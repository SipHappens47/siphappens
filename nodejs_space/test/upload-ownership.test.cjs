// Item 3 (SH-C03, Vale W04): callers cannot register, read through, attach or
// delete storage objects they do not own. Fake DB and storage only.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  loadTs, ForbiddenException, ConflictException, NotFoundException,
} = require('./support/load-ts.cjs');

const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';

function fakeStorage() {
  const calls = { signUpload: [], deleted: [], urls: [] };
  return {
    calls,
    module: {
      generatePresignedUploadUrl: async (path) => { calls.signUpload.push(path); return { uploadUrl: `https://storage.invalid/upload/${path}`, cloud_storage_path: path }; },
      getFileUrl: async (path, isPublic) => { calls.urls.push([path, isPublic]); return `https://storage.invalid/${isPublic ? 'public' : 'signed'}/${path}`; },
      deleteFile: async (path) => { calls.deleted.push(path); },
      completeMultipartUpload: async () => { throw new Error('not supported'); },
      getPresignedUrlForPart: async () => { throw new Error('not supported'); },
      initiateMultipartUpload: async () => { throw new Error('not supported'); },
      privateBucketConfigured: () => false,
    },
  };
}

function matches(record, where = {}) {
  return Object.entries(where).every(([key, cond]) => {
    const value = record[key];
    if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      if ('not' in cond && value === cond.not) return false;
      if ('lt' in cond && !(value < cond.lt)) return false;
      if ('in' in cond && !cond.in.includes(value)) return false;
      return true;
    }
    return value === cond;
  });
}

function fakeDb(files = [], extra = {}) {
  const state = { files: files.map((f, i) => ({ createdat: new Date(Date.UTC(2026, 0, 1 + i)), pours: [], ...f })) };
  let seq = 0;
  const prisma = {
    file: {
      findUnique: async ({ where }) => state.files.find((f) => f.id === where.id) ?? null,
      findFirst: async ({ where }) => state.files.find((f) => matches(f, where)) ?? null,
      findMany: async ({ where }) => state.files.filter((f) => matches(f, where)),
      create: async ({ data }) => {
        const record = { id: `file-${++seq}`, createdat: new Date(Date.UTC(2026, 5, 1 + seq)), pours: [], ...data };
        state.files.push(record);
        return record;
      },
      delete: async ({ where }) => { state.files = state.files.filter((f) => f.id !== where.id); },
    },
    user: { delete: async () => ({}) },
    block: { findFirst: async () => null, findMany: async () => [] },
    ...extra,
  };
  return { prisma, state };
}

function uploadService(files, extra) {
  const storage = fakeStorage();
  const { UploadService } = loadTs('upload/upload.service', { '../lib/s3': storage.module });
  const db = fakeDb(files, extra);
  return { service: new UploadService(db.prisma), storage, db };
}

const completeDto = (path) => ({ cloud_storage_path: path, fileName: 'pour.jpg', mimeType: 'image/jpeg', fileSize: 10 });

test('presign issues a server-generated path in the caller namespace and ignores client path tricks', async () => {
  const { service, storage } = uploadService();
  const priv = await service.generatePresignedUrl(ALICE, { fileName: '../../bob/evil.jpg', contentType: 'image/jpeg' });
  const pub = await service.generatePresignedUrl(ALICE, { fileName: 'avatar.jpg', contentType: 'image/jpeg', isPublic: true });
  assert.match(priv.cloud_storage_path, new RegExp(`^private/users/${ALICE}/[0-9a-f-]{36}-\\.\\._\\.\\._bob_evil\\.jpg$`));
  assert.match(pub.cloud_storage_path, new RegExp(`^public/users/${ALICE}/[0-9a-f-]{36}-avatar\\.jpg$`));
  assert.deepEqual(storage.calls.signUpload, [priv.cloud_storage_path, pub.cloud_storage_path]);
});

test('owner completes an issued path; visibility follows the server prefix', async () => {
  const { service, db } = uploadService();
  const { cloud_storage_path } = await service.generatePresignedUrl(ALICE, { fileName: 'a.jpg', contentType: 'image/jpeg', isPublic: true });
  const result = await service.completeUpload(ALICE, completeDto(cloud_storage_path));
  assert.equal(result.isPublic, true);
  assert.equal(db.state.files.length, 1);
  assert.equal(db.state.files[0].userid, ALICE);
});

const foreignPaths = {
  "another user's issued path": `private/users/${ALICE}/0b8f1c1e-1111-4111-8111-111111111111-a.jpg`,
  'legacy path with no owner (original SH-C03 reproduction)': 'private/uploads/owner-known-path.jpg',
  'legacy public path': 'public/uploads/known.jpg',
  'traversal out of own namespace': `private/users/${BOB}/../${ALICE}/a.jpg`,
  'nested segment in own namespace': `private/users/${BOB}/x/a.jpg`,
  'empty object name': `private/users/${BOB}/`,
  'prefix lookalike': `private/users/${BOB}x/a.jpg`,
};
for (const [label, path] of Object.entries(foreignPaths)) {
  test(`completion refuses ${label}`, async () => {
    const { service, db } = uploadService();
    await assert.rejects(service.completeUpload(BOB, completeDto(path)), ForbiddenException);
    assert.equal(db.state.files.length, 0);
  });
}

test('completion refuses a path that was already completed', async () => {
  const { service, db } = uploadService();
  const { cloud_storage_path } = await service.generatePresignedUrl(BOB, { fileName: 'a.jpg', contentType: 'image/jpeg' });
  await service.completeUpload(BOB, completeDto(cloud_storage_path));
  await assert.rejects(service.completeUpload(BOB, completeDto(cloud_storage_path)), ConflictException);
  assert.equal(db.state.files.length, 1);
});

test('multipart part/complete also refuse foreign paths before touching storage', async () => {
  const { service } = uploadService();
  const path = foreignPaths["another user's issued path"];
  await assert.rejects(service.getPartUrl(BOB, { cloud_storage_path: path, uploadId: 'u', partNumber: 1 }), ForbiddenException);
  await assert.rejects(service.completeMultipart(BOB, { ...completeDto(path), uploadId: 'u', parts: [] }), ForbiddenException);
});

// Records forged before this fix: Bob registered Alice's legacy path after Alice did.
const legacy = 'private/uploads/alice-photo.jpg';
const forgedFixture = () => [
  { id: 'alice-file', userid: ALICE, cloudstoragepath: legacy, ispublic: false, filename: 'a', mimetype: 'image/jpeg' },
  { id: 'bob-forged', userid: BOB, cloudstoragepath: legacy, ispublic: false, filename: 'a', mimetype: 'image/jpeg' },
];

test('a forged legacy record cannot be used to re-sign the victim object', async () => {
  const { service, storage } = uploadService(forgedFixture());
  await assert.rejects(service.getFileUrl(BOB, 'bob-forged'), ForbiddenException);
  assert.deepEqual(storage.calls.urls, []);
  const own = await service.getFileUrl(ALICE, 'alice-file');
  assert.match(own.url, /alice-photo/);
});

test('deleting a forged legacy record removes the record but never the victim object', async () => {
  const { service, storage, db } = uploadService(forgedFixture());
  await service.deleteFile(BOB, 'bob-forged');
  assert.deepEqual(storage.calls.deleted, []);
  assert.deepEqual(db.state.files.map((f) => f.id), ['alice-file']);
});

test("a user cannot delete another user's file record", async () => {
  const { service, storage } = uploadService(forgedFixture());
  await assert.rejects(service.deleteFile(BOB, 'alice-file'), ForbiddenException);
  assert.deepEqual(storage.calls.deleted, []);
});

test('owner deleting own namespaced and sole legacy files removes the objects', async () => {
  const own = `private/users/${ALICE}/0b8f1c1e-1111-4111-8111-111111111111-a.jpg`;
  const { service, storage } = uploadService([
    { id: 'own', userid: ALICE, cloudstoragepath: own },
    { id: 'old', userid: ALICE, cloudstoragepath: 'public/uploads/old.jpg' },
  ]);
  await service.deleteFile(ALICE, 'own');
  await service.deleteFile(ALICE, 'old');
  assert.deepEqual(storage.calls.deleted, [own, 'public/uploads/old.jpg']);
});

test('missing file stays not found', async () => {
  const { service } = uploadService();
  await assert.rejects(service.deleteFile(ALICE, 'nope'), NotFoundException);
});

// W04: account deletion and admin ban must not delete objects the account cannot prove it owns.
const bobOwn = `public/users/${BOB}/0b8f1c1e-2222-4222-8222-222222222222-b.jpg`;
const accountFixture = () => [...forgedFixture(), { id: 'bob-own', userid: BOB, cloudstoragepath: bobOwn }];

test("account deletion keeps another user's object referenced by a forged record", async () => {
  const storage = fakeStorage();
  const { ProfileService } = loadTs('profile/profile.service', { '../lib/s3': storage.module });
  const db = fakeDb(accountFixture());
  await new ProfileService(db.prisma).deleteAccount(BOB);
  assert.deepEqual(storage.calls.deleted, [bobOwn]);
});

test("admin ban keeps another user's object referenced by a forged record", async () => {
  const storage = fakeStorage();
  const { ModerationService } = loadTs('moderation/moderation.service', { '../lib/s3': storage.module });
  const db = fakeDb(accountFixture(), {
    report: {
      findUnique: async () => ({ id: 'r', targettype: 'user', targetid: BOB }),
      update: async () => ({}),
      create: async () => ({}), // batch 3: the ban records a hash of the email
    },
    user: { findUnique: async () => ({ email: 'bob@example.invalid' }), delete: async () => ({}) },
  });
  const admin = { checkAdminAccess: async () => {} };
  await new ModerationService(db.prisma, admin).resolveReport('admin', 'r', { action: 'ban_user' });
  assert.deepEqual(storage.calls.deleted, [bobOwn]);
});

// Pours may only attach the caller's own uploaded image.
function poursFixture() {
  const created = [];
  const files = { 'alice-img': { userid: ALICE }, 'bob-img': { userid: BOB } };
  const pour = { id: 'p1', userid: BOB, image: 'bob-img', isshared: true };
  const prisma = {
    file: { findUnique: async ({ where }) => files[where.id] ?? null },
    pour: {
      create: async ({ data }) => { created.push(data); return { id: 'new', ...data, spirit: { id: 's' }, flavortags: [] }; },
      findUnique: async () => pour,
      update: async ({ data }) => { created.push(data); return { ...pour, ...data, spirit: { id: 's' }, flavortags: [] }; },
    },
    pourflavortag: { deleteMany: async () => ({}) },
  };
  const { PoursService } = loadTs('pours/pours.service');
  const service = new PoursService(prisma, { checkAndUnlockBadges: async () => {} }, { calculateExperienceLevel: async () => {} });
  return { service, created };
}

test("createPour refuses another user's image file", async () => {
  const { service, created } = poursFixture();
  await assert.rejects(service.createPour(BOB, { spiritId: 's', whyItHit: 'x', isShared: true, image: 'alice-img' }), ForbiddenException);
  await assert.rejects(service.createPour(BOB, { spiritId: 's', whyItHit: 'x', image: 'missing' }), ForbiddenException);
  assert.equal(created.length, 0);
});

test('createPour accepts own image and no image', async () => {
  const { service, created } = poursFixture();
  await service.createPour(BOB, { spiritId: 's', whyItHit: 'x', image: 'bob-img' });
  await service.createPour(BOB, { spiritId: 's', whyItHit: 'x' });
  assert.equal(created.length, 2);
});

test("updatePour refuses switching to another user's image but keeps unchanged image working", async () => {
  const { service, created } = poursFixture();
  await assert.rejects(service.updatePour(BOB, 'p1', { image: 'alice-img' }), ForbiddenException);
  assert.equal(created.length, 0);
  await service.updatePour(BOB, 'p1', { image: 'bob-img', whyItHit: 'edited' });
  assert.equal(created.length, 1);
});
