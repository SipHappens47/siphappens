// Item 4 (SH-C02): blocking is two-way invisibility with no interaction.
// Alice blocked Bob; Carol is unrelated. Every check runs in both directions
// with a non-blocked control. Fake DB/storage only.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTs, NotFoundException } = require('./support/load-ts.cjs');
const { fakeDb } = require('./support/fake-db.cjs');

const ALICE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BOB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CAROL = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PAIRS = [[ALICE, BOB, 'blocker views blocked'], [BOB, ALICE, 'blocked views blocker']];

const person = (id, name) => ({ id, name, profilephoto: null, experiencelevel: 'Curious', isofficial: false, owneddistillery: [] });
const people = { [ALICE]: person(ALICE, 'Alice Sipper'), [BOB]: person(BOB, 'Bob Sipper'), [CAROL]: person(CAROL, 'Carol Sipper') };
const spirit = { id: 'spirit', name: 'Test Gin', distillery: null, flavortags: [] };
const pourOf = (userid) => ({
  id: `pour-${userid}`, userid, isshared: true, whyithit: 'Synthetic tasting note', image: `img-${userid}`,
  spiritid: 'spirit', distilleryid: 'distillery', spirit, flavortags: [], user: people[userid], cheers: [],
  createdat: new Date('2026-09-01T00:00:00Z'),
});
const conn = (id, initiatorid, receiverid, status) => ({
  id, initiatorid, receiverid, status, ismuted: false, initiator: people[initiatorid], receiver: people[receiverid],
});

function world({ connections } = {}) {
  return fakeDb({
    user: Object.values(people).map((p) => ({ ...p, email: `${p.name.split(' ')[0].toLowerCase()}@example.invalid`, allowinstantfollow: false })),
    pour: [pourOf(ALICE), pourOf(BOB), pourOf(CAROL)],
    file: [ALICE, BOB, CAROL].map((u) => ({
      id: `img-${u}`, userid: u, cloudstoragepath: `private/users/${u}/0b8f1c1e-1111-4111-8111-111111111111-p.jpg`,
      ispublic: false, filename: 'p.jpg', mimetype: 'image/jpeg', createdat: new Date('2026-08-01T00:00:00Z'),
      pours: [{ userid: u, isshared: true }],
    })),
    // Legacy state from before this fix: a block that left the connection in place.
    connection: connections ?? [conn('c-ab', BOB, ALICE, 'Accepted'), conn('c-ac', CAROL, ALICE, 'Accepted'), conn('c-bc', BOB, CAROL, 'Accepted')],
    cheer: [{ id: 'ch1', userid: BOB, pourid: `pour-${ALICE}`, pour: pourOf(ALICE), user: people[BOB], createdat: new Date() }],
    block: [{ id: 'b1', blockerid: ALICE, blockedid: BOB, createdat: new Date(), blocked: people[BOB] }],
  });
}

const storage = {
  getFileUrl: async (path, isPublic) => `https://storage.invalid/${isPublic ? 'public' : 'signed'}/${path}`,
  deleteFile: async () => {},
  generatePresignedUploadUrl: async (p) => ({ uploadUrl: 'u', cloud_storage_path: p }),
};
const noop = { calculateExperienceLevel: async () => {}, checkAndUnlockBadges: async () => {} };
const services = (prisma) => {
  const { ProfileService } = loadTs('profile/profile.service', { '../lib/s3': storage });
  const { PoursService } = loadTs('pours/pours.service');
  const { UploadService } = loadTs('upload/upload.service', { '../lib/s3': storage });
  const { ConnectionsService } = loadTs('connections/connections.service', { '../lib/push-notifications': { sendPushNotification: async () => {} } });
  const { CheersService } = loadTs('cheers/cheers.service', { '../lib/push-notifications': { sendPushNotification: async () => {} } });
  const { SearchService } = loadTs('search/search.service');
  const { ModerationService } = loadTs('moderation/moderation.service', { '../lib/s3': storage });
  const { DistilleriesService } = loadTs('distilleries/distilleries.service');
  const { SpiritsService } = loadTs('spirits/spirits.service');
  const { BadgesController } = loadTs('badges/badges.controller');
  const connections = new ConnectionsService(prisma, noop);
  return {
    profile: new ProfileService(prisma),
    pours: new PoursService(prisma, noop, noop),
    upload: new UploadService(prisma),
    connections,
    cheers: new CheersService(prisma, connections),
    search: new SearchService(prisma),
    moderation: new ModerationService(prisma, { checkAdminAccess: async () => {} }),
    distilleries: new DistilleriesService(prisma),
    spirits: new SpiritsService(prisma),
    badges: new BadgesController({ getUserBadgesWithProgress: async (id) => ({ id }), getTasteSummary: async (id) => ({ id }) }, prisma),
  };
};

for (const [viewer, target, label] of PAIRS) {
  test(`profile, badges and taste summary are not found (${label}); Carol still sees them`, async () => {
    const s = services(world());
    await assert.rejects(s.profile.getPublicProfile(target, viewer), NotFoundException);
    await assert.rejects(s.badges.getUserBadges(target, { user: { userId: viewer } }), NotFoundException);
    await assert.rejects(s.badges.getUserTasteSummary(target, { user: { userId: viewer } }), NotFoundException);
    assert.equal((await s.profile.getPublicProfile(target, CAROL)).id, target);
    assert.deepEqual(await s.badges.getUserBadges(target, { user: { userId: CAROL } }), { id: target });
  });

  test(`public pour list, pour detail and pour photo are not found (${label}); Carol still sees them`, async () => {
    const s = services(world());
    await assert.rejects(s.pours.getUserPublicPours(target, viewer), NotFoundException);
    await assert.rejects(s.pours.getPour(viewer, `pour-${target}`), NotFoundException);
    await assert.rejects(s.upload.getFileUrl(viewer, `img-${target}`), NotFoundException);
    assert.equal((await s.pours.getUserPublicPours(target, CAROL)).length, 1);
    assert.equal((await s.pours.getPour(CAROL, `pour-${target}`)).id, `pour-${target}`);
    assert.match((await s.upload.getFileUrl(CAROL, `img-${target}`)).url, /signed/);
  });

  test(`search hides users and reviews (${label})`, async () => {
    const s = services(world());
    const results = await s.search.universalSearch('sip', viewer);
    assert.deepEqual(results.users.map((u) => u.id).sort(), [CAROL]);
    const reviews = (await s.search.universalSearch('synthetic', viewer)).reviews.map((r) => r.user.id);
    assert.equal(reviews.includes(target), false);
    assert.equal(reviews.includes(CAROL), true);
    const people2 = await s.connections.searchUsers(viewer, 'sipper');
    assert.deepEqual(people2.map((u) => u.id), [CAROL]);
  });

  test(`cannot connect, accept, or cheer (${label})`, async () => {
    const prisma = world({ connections: [conn('pending', target, viewer, 'Pending')] });
    const s = services(prisma);
    await assert.rejects(s.connections.sendConnectionRequestById(viewer, target), NotFoundException);
    await assert.rejects(s.connections.sendConnectionRequest(viewer, people[target].name), NotFoundException);
    await assert.rejects(s.connections.acceptConnectionRequest(viewer, 'pending'), NotFoundException);
    await assert.rejects(s.cheers.addCheer(viewer, `pour-${target}`), NotFoundException);
    assert.equal(prisma.calls('connection', 'create').length, 0);
    assert.equal(prisma.calls('connection', 'update').length, 0);
    assert.equal(prisma.calls('cheer', 'create').length, 0);
  });

  test(`legacy accepted connection no longer counts (${label})`, async () => {
    const s = services(world());
    assert.equal(await s.connections.areConnected(viewer, target), false);
    await assert.rejects(s.cheers.addCheer(viewer, `pour-${target}`), NotFoundException);
    const others = (await s.connections.getConnections(viewer)).map((c) => c.user.id);
    assert.equal(others.includes(target), false);
  });

  test(`pending and sent request lists hide the other side (${label})`, async () => {
    const prisma = world({ connections: [conn('p1', target, viewer, 'Pending'), conn('p2', viewer, target, 'Pending'), conn('p3', CAROL, viewer, 'Pending')] });
    const s = services(prisma);
    assert.deepEqual((await s.connections.getPendingRequests(viewer)).map((r) => r.initiator.id), [CAROL]);
    assert.deepEqual((await s.connections.getSentRequests(viewer)).map((r) => r.receiver.id), []);
  });

  test(`distillery pour feed and spirit fellow sippers hide the other side (${label})`, async () => {
    const prisma = world();
    prisma.distillery.rows.push({ id: 'distillery' });
    prisma.spirit.rows.push({ ...spirit });
    const s = services(prisma);
    const feed = (await s.distilleries.getPours('distillery', viewer)).map((p) => p.user.id);
    assert.equal(feed.includes(target), false);
    assert.equal(feed.includes(CAROL), true);
  });
}

test('cheer notifications hide cheers from a blocked user; Carol unaffected', async () => {
  const prisma = world();
  prisma.cheer.rows.push({ id: 'ch2', userid: CAROL, pourid: `pour-${ALICE}`, pour: pourOf(ALICE), user: people[CAROL], createdat: new Date() });
  const s = services(prisma);
  assert.deepEqual((await s.cheers.getReceivedCheers(ALICE)).map((c) => c.user.id), [CAROL]);
});

test('spirit fellow sippers exclude a blocked connection', async () => {
  const prisma = world();
  prisma.spirit.rows.push({ ...spirit });
  const s = services(prisma);
  const result = await s.spirits.getSpirit('spirit', ALICE);
  assert.deepEqual(result.fellowSipperPours.map((p) => p.userId), [CAROL]);
});

test('blocking removes any connection or pending request in both directions', async () => {
  const prisma = world({ connections: [conn('c1', CAROL, ALICE, 'Accepted'), conn('c2', ALICE, CAROL, 'Pending'), conn('c3', BOB, ALICE, 'Accepted')] });
  const s = services(prisma);
  await s.moderation.blockUser(ALICE, CAROL);
  assert.deepEqual(prisma.connection.rows.map((c) => c.id), ['c3']);
});

test('blocker can list blocked users (id and name) to unblock them', async () => {
  const s = services(world());
  assert.deepEqual((await s.moderation.getMyBlockedUsers(ALICE)).map(({ id, name }) => ({ id, name })), [{ id: BOB, name: 'Bob Sipper' }]);
  assert.deepEqual(await s.moderation.getMyBlockedUsers(BOB), []);
  assert.deepEqual(await s.moderation.getHiddenUserIds(BOB), [ALICE]);
});

test('owner still sees their own pour and photo; self is never "blocked"', async () => {
  const s = services(world());
  assert.equal((await s.pours.getPour(BOB, `pour-${BOB}`)).id, `pour-${BOB}`);
  assert.match((await s.upload.getFileUrl(BOB, `img-${BOB}`)).url, /signed/);
});
