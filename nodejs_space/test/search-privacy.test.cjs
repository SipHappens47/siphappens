// Batch 3, items 3 and 4: the spirit "fellow sippers" list shows only pours
// the viewer may see (shared ones), and user search/connect never matches on
// email. Fake DB only.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTs, NotFoundException, BadRequestException } = require('./support/load-ts.cjs');
const { fakeDb } = require('./support/fake-db.cjs');

const person = (id, name) => ({
  id, name, email: `${id}@example.invalid`, profilephoto: null, experiencelevel: 'Curious',
  isofficial: false, owneddistillery: [], allowinstantfollow: false, pushtoken: null,
});
const people = {
  alice: person('alice', 'Alice Sipper'),
  carol: person('carol', 'Carol Sipper'),
  dave: person('dave', 'Dave Sipper'),
  erin: person('erin', 'Erin Sipper'),
  eve: person('eve', 'Eve Stranger'),
};
const accepted = (id, a, b) => ({ id, initiatorid: a, receiverid: b, status: 'Accepted' });
const pour = (id, userid, isshared, spiritid = 'gin') => ({ id, userid, spiritid, isshared, user: people[userid] });

function world() {
  return fakeDb({
    user: Object.values(people).map((p) => ({ ...p })),
    spirit: [{ id: 'gin', name: 'Test Gin', distillery: null, flavortags: [] }],
    connection: [accepted('c1', 'alice', 'carol'), accepted('c2', 'dave', 'alice'), accepted('c3', 'erin', 'alice')],
    pour: [
      pour('carol-private', 'carol', false), // friend, unshared only: must not appear
      pour('dave-shared', 'dave', true), // friend, shared: appears
      pour('erin-private', 'erin', false), // friend with one unshared ...
      pour('erin-shared', 'erin', true), // ... and one shared pour: appears
      pour('eve-shared', 'eve', true), // not a friend: never a fellow sipper
      pour('carol-other', 'carol', true, 'rum'), // shared, but a different spirit
    ],
  });
}

const spirits = (prisma) => new (loadTs('spirits/spirits.service').SpiritsService)(prisma);
const connections = (prisma) => new (loadTs('connections/connections.service', {
  '../lib/push-notifications': { sendPushNotification: async () => {} },
}).ConnectionsService)(prisma, { calculateExperienceLevel: async () => {} });

// --- Item 3: fellow sippers ---------------------------------------------

test("fellow sippers list friends' shared pours only, never unshared ones", async () => {
  const result = await spirits(world()).getSpirit('gin', 'alice');
  assert.deepEqual(result.fellowSipperPours.map((p) => p.userId).sort(), ['dave', 'erin']);
});

test('a friend whose only pour is unshared is not listed (the original leak)', async () => {
  const prisma = world();
  const result = await spirits(prisma).getSpirit('gin', 'alice');
  assert.equal(result.fellowSipperPours.some((p) => p.userId === 'carol'), false);
  const friendQuery = prisma.calls('pour', 'findMany').map(([, , q]) => q).find((q) => q.where.userid);
  assert.equal(friendQuery.where.isshared, true);
});

test('fellow sippers update when a pour is shared or made private again', async () => {
  const prisma = world();
  prisma.pour.rows.find((p) => p.id === 'carol-private').isshared = true;
  prisma.pour.rows.find((p) => p.id === 'dave-shared').isshared = false;
  const result = await spirits(prisma).getSpirit('gin', 'alice');
  assert.deepEqual(result.fellowSipperPours.map((p) => p.userId).sort(), ['carol', 'erin']);
});

test('no viewer means no fellow sippers', async () => {
  const result = await spirits(world()).getSpirit('gin', undefined);
  assert.deepEqual(result.fellowSipperPours, []);
});

// --- Item 4: no email matching in connection search or connect ----------

test('connection search by name still works and returns no email', async () => {
  const prisma = world();
  const results = await connections(prisma).searchUsers('alice', 'carol');
  assert.deepEqual(results.map((u) => u.id), ['carol']);
  assert.equal(Object.hasOwn(results[0], 'email'), false);
});

for (const query of ['carol@example.invalid', 'example.invalid', '@example', 'carol@']) {
  test(`connection search does not match the email fragment ${JSON.stringify(query)}`, async () => {
    const prisma = world();
    assert.deepEqual(await connections(prisma).searchUsers('alice', query), []);
    const [, , q] = prisma.calls('user', 'findMany')[0];
    assert.equal(JSON.stringify(q.where).includes('email'), false);
  });
}

test('sending a request by email address finds nobody and creates nothing', async () => {
  const prisma = world();
  await assert.rejects(connections(prisma).sendConnectionRequest('eve', 'carol@example.invalid'), NotFoundException);
  assert.equal(prisma.calls('user', 'findUnique').length, 0);
  assert.equal(prisma.calls('connection', 'create').length, 0);
});

test('sending a request by exact name still works', async () => {
  const prisma = world();
  prisma.connection.create = async ({ data }) => ({
    id: 'new', ...data, initiator: people[data.initiatorid], receiver: people[data.receiverid],
  });
  const result = await connections(prisma).sendConnectionRequest('eve', ' carol sipper ');
  assert.equal(result.receiver.id, 'carol');
  assert.equal(result.status, 'Pending');
  assert.equal(JSON.stringify(result).includes('@'), false);
});

test('an ambiguous name is refused rather than guessed', async () => {
  const prisma = world();
  prisma.user.rows.push(person('carol2', 'Carol Sipper'));
  await assert.rejects(connections(prisma).sendConnectionRequest('eve', 'Carol Sipper'), BadRequestException);
});
