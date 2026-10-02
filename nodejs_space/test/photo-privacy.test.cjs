// Item 5 (SH-C04): a pour photo follows its pour's share state and is only
// handed out as a short-lived signed URL; optional private bucket routing.
// Fake DB; storage module either stubbed or loaded with a fake fetch.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTs, ForbiddenException } = require('./support/load-ts.cjs');
const { fakeDb } = require('./support/fake-db.cjs');

const OWNER = '11111111-1111-4111-8111-111111111111';
const STRANGER = '22222222-2222-4222-8222-222222222222';

function upload(files, { privateBucket = false } = {}) {
  const urls = [];
  const storage = {
    getFileUrl: async (path, isPublic) => { urls.push({ path, isPublic }); return `https://storage.invalid/${isPublic ? 'public' : 'signed'}/${path}`; },
    generatePresignedUploadUrl: async (p) => ({ uploadUrl: 'u', cloud_storage_path: p }),
    deleteFile: async () => {},
    privateBucketConfigured: () => privateBucket,
  };
  const { UploadService } = loadTs('upload/upload.service', { '../lib/s3': storage });
  const prisma = fakeDb({ file: files.map((f) => ({ createdat: new Date('2026-08-01T00:00:00Z'), filename: 'p.jpg', mimetype: 'image/jpeg', ...f })) });
  return { service: new UploadService(prisma), urls };
}

// Shared-at-upload pour photo from an older client: stored on a public path with ispublic=true.
const legacyPublicPhoto = (isshared) => ({
  id: 'photo', userid: OWNER, cloudstoragepath: 'public/uploads/pour-1.jpg', ispublic: true,
  pours: [{ userid: OWNER, isshared }],
});

test('original C04 reproduction: unshared pour photo is denied to a stranger', async () => {
  const { service, urls } = upload([legacyPublicPhoto(false)]);
  await assert.rejects(service.getFileUrl(STRANGER, 'photo'), ForbiddenException);
  assert.deepEqual(urls, []);
});

test('owner still sees their unshared pour photo, via a signed URL', async () => {
  const { service, urls } = upload([legacyPublicPhoto(false)]);
  assert.match((await service.getFileUrl(OWNER, 'photo')).url, /signed/);
  assert.deepEqual(urls, [{ path: 'public/uploads/pour-1.jpg', isPublic: false }]);
});

test('shared pour photo is visible to others, but only as a signed URL', async () => {
  const { service, urls } = upload([legacyPublicPhoto(true)]);
  assert.match((await service.getFileUrl(STRANGER, 'photo')).url, /signed/);
  assert.deepEqual(urls, [{ path: 'public/uploads/pour-1.jpg', isPublic: false }]);
});

test("someone else's shared pour cannot expose a private photo it does not own", async () => {
  const { service } = upload([{
    id: 'photo', userid: OWNER, cloudstoragepath: `private/users/${OWNER}/0b8f1c1e-1111-4111-8111-111111111111-p.jpg`,
    ispublic: false, pours: [{ userid: OWNER, isshared: false }, { userid: STRANGER, isshared: true }],
  }]);
  await assert.rejects(service.getFileUrl(STRANGER, 'photo'), ForbiddenException);
});

test('non-pour public files (avatars, logos, bottles) keep their public URL', async () => {
  const { service, urls } = upload([{ id: 'avatar', userid: OWNER, cloudstoragepath: 'public/uploads/avatar.jpg', ispublic: true, pours: [] }]);
  assert.match((await service.getFileUrl(STRANGER, 'avatar')).url, /public/);
  assert.deepEqual(urls, [{ path: 'public/uploads/avatar.jpg', isPublic: true }]);
});

test('non-pour private file: stranger denied, owner gets signed URL', async () => {
  const { service } = upload([{ id: 'doc', userid: OWNER, cloudstoragepath: `private/users/${OWNER}/0b8f1c1e-1111-4111-8111-111111111111-d.jpg`, ispublic: false, pours: [] }]);
  await assert.rejects(service.getFileUrl(STRANGER, 'doc'), ForbiddenException);
  assert.match((await service.getFileUrl(OWNER, 'doc')).url, /signed/);
});

test('with a private bucket configured, private uploads get secure/<owner>/ paths that only the owner can complete', async () => {
  const { service } = upload([], { privateBucket: true });
  const issued = await service.generatePresignedUrl(OWNER, { fileName: 'pour.jpg', contentType: 'image/jpeg', isPublic: false });
  assert.match(issued.cloud_storage_path, new RegExp(`^secure/${OWNER}/[0-9a-f-]{36}-pour\\.jpg$`));
  const pub = await service.generatePresignedUrl(OWNER, { fileName: 'a.jpg', contentType: 'image/jpeg', isPublic: true });
  assert.match(pub.cloud_storage_path, new RegExp(`^public/users/${OWNER}/`));
  const dto = { cloud_storage_path: issued.cloud_storage_path, fileName: 'pour.jpg', mimeType: 'image/jpeg', fileSize: 1 };
  await assert.rejects(service.completeUpload(STRANGER, dto), ForbiddenException);
  assert.equal((await service.completeUpload(OWNER, dto)).isPublic, false);
});

test('without a private bucket, private uploads stay in the main bucket namespace', async () => {
  const { service } = upload([]);
  const issued = await service.generatePresignedUrl(OWNER, { fileName: 'pour.jpg', contentType: 'image/jpeg' });
  assert.match(issued.cloud_storage_path, new RegExp(`^private/users/${OWNER}/`));
});

// Storage routing in lib/s3.ts, exercised with a fake fetch (no network).
async function withStorage(env, fn) {
  const saved = {};
  for (const key of Object.keys(env)) { saved[key] = process.env[key]; process.env[key] = env[key]; }
  const realFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url, method: init.method, body: init.body });
    const signedURL = `/object/sign/x?token=t`;
    return { ok: true, status: 200, json: async () => ({ url: '/object/upload/sign/x?token=t', signedURL }), text: async () => '' };
  };
  try {
    const s3 = loadTs('lib/s3');
    await fn(s3, requests);
  } finally {
    globalThis.fetch = realFetch;
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

const baseEnv = { SUPABASE_URL: 'https://storage.invalid', SUPABASE_SERVICE_KEY: 'test-key-not-real', SUPABASE_BUCKET: 'uploads' };

test('storage: secure/ paths use the private bucket and are never given a public URL', async () => {
  await withStorage({ ...baseEnv, SUPABASE_PRIVATE_BUCKET: 'private-photos' }, async (s3, requests) => {
    assert.equal(s3.privateBucketConfigured(), true);
    const url = await s3.getFileUrl(`secure/${OWNER}/p.jpg`, true);
    assert.equal(url.includes('/object/public/'), false);
    await s3.generatePresignedUploadUrl(`secure/${OWNER}/p.jpg`, 'image/jpeg');
    await s3.deleteFile(`secure/${OWNER}/p.jpg`);
    assert.deepEqual(requests.map((r) => r.url), [
      `https://storage.invalid/storage/v1/object/sign/private-photos/secure/${OWNER}/p.jpg`,
      `https://storage.invalid/storage/v1/object/upload/sign/private-photos/secure/${OWNER}/p.jpg`,
      `https://storage.invalid/storage/v1/object/private-photos/secure/${OWNER}/p.jpg`,
    ]);
    assert.equal(JSON.parse(requests[0].body).expiresIn, 3600);
  });
});

test('storage: existing main-bucket paths keep working (public URL or signed)', async () => {
  await withStorage({ ...baseEnv, SUPABASE_PRIVATE_BUCKET: 'private-photos' }, async (s3, requests) => {
    assert.equal(await s3.getFileUrl('public/uploads/a.jpg', true), 'https://storage.invalid/storage/v1/object/public/uploads/public/uploads/a.jpg');
    await s3.getFileUrl('private/uploads/b.jpg', false);
    assert.deepEqual(requests.map((r) => r.url), ['https://storage.invalid/storage/v1/object/sign/uploads/private/uploads/b.jpg']);
  });
});

test('storage: secure/ path without SUPABASE_PRIVATE_BUCKET fails loudly instead of using the public bucket', async () => {
  await withStorage({ ...baseEnv, SUPABASE_PRIVATE_BUCKET: '' }, async (s3, requests) => {
    assert.equal(s3.privateBucketConfigured(), false);
    await assert.rejects(s3.getFileUrl(`secure/${OWNER}/p.jpg`, false), /SUPABASE_PRIVATE_BUCKET/);
    assert.deepEqual(requests, []);
  });
});
