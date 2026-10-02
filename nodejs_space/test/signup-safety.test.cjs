// Batch 3, items 5 and 6: a banned account's email cannot sign up again (and
// the banned account cannot log in), and two parallel signups cannot both
// claim one unowned distillery. Fake DB, storage and JWT only.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const bcrypt = require('bcryptjs');
const { loadTs, BadRequestException, UnauthorizedException } = require('./support/load-ts.cjs');
const { fakeDb } = require('./support/fake-db.cjs');

const ADMIN = 'admin-id';
const BOB_EMAIL = 'bob.banned@example.invalid';
const { AuthService } = loadTs('auth/auth.service', { '../lib/email': { sendEmail: async () => {} } });
const { bannedEmailKey } = loadTs('moderation/banned-emails');
const storage = { deleteFile: async () => {}, getFileUrl: async () => 'u' };
const { ModerationService } = loadTs('moderation/moderation.service', { '../lib/s3': storage });

const jwt = { sign: (payload) => `token-for-${payload.sub}` };
const adminService = {
  checkAdminAccess: async (id) => { if (id !== ADMIN) throw new Error('Admin access required'); },
};
const signup = (email, extra = {}) => ({ email, password: 'password123', name: 'Synthetic', ageVerified: true, ...extra });

async function bannedWorld({ via = 'user' } = {}) {
  const password = await bcrypt.hash('password123', 4);
  const prisma = fakeDb({
    user: [
      { id: ADMIN, email: 'official@siphappens.com', password, tokenversion: 0, owneddistillery: [] },
      { id: 'bob', email: BOB_EMAIL, password, tokenversion: 0, owneddistillery: [] },
      { id: 'carol', email: 'carol@example.invalid', password, tokenversion: 0, owneddistillery: [] },
    ],
    pour: [{ id: 'bob-pour', userid: 'bob' }],
    file: [],
    report: [{ id: 'r1', reporterid: 'carol', targettype: via, targetid: via === 'user' ? 'bob' : 'bob-pour', reason: 'abuse', status: 'Open' }],
  });
  const moderation = new ModerationService(prisma, adminService);
  await moderation.resolveReport(ADMIN, 'r1', { action: 'ban_user' });
  return { prisma, moderation, auth: new AuthService(prisma, jwt) };
}

// --- Item 5: banned users -----------------------------------------------

for (const via of ['user', 'pour']) {
  test(`ban via a ${via} report deletes the account and records only a hash of the email`, async () => {
    const { prisma } = await bannedWorld({ via });
    assert.equal(prisma.user.rows.some((u) => u.id === 'bob'), false);
    const record = prisma.report.rows.find((r) => r.targettype === 'banned_email');
    assert.equal(record.targetid, bannedEmailKey(BOB_EMAIL));
    assert.equal(record.status, 'Resolved');
    assert.equal(JSON.stringify(prisma.report.rows).includes('bob.banned'), false, 'plain email is not stored');
  });
}

for (const email of [BOB_EMAIL, 'Bob.Banned@Example.invalid', `  ${BOB_EMAIL.toUpperCase()} `]) {
  test(`a banned email cannot sign up again (${JSON.stringify(email)})`, async () => {
    const { prisma, auth } = await bannedWorld();
    const before = prisma.user.rows.length;
    await assert.rejects(auth.signup(signup(email)), (err) => err instanceof BadRequestException && /can't be used/.test(err.message));
    assert.equal(prisma.user.rows.length, before);
  });
}

test('other emails can still sign up after a ban', async () => {
  const { auth } = await bannedWorld();
  const result = await auth.signup(signup('new.person@example.invalid'));
  assert.equal(result.user.email, 'new.person@example.invalid');
});

test('the banned account cannot log in, and its old tokens are refused', async () => {
  const { prisma, auth } = await bannedWorld();
  await assert.rejects(auth.login({ email: BOB_EMAIL, password: 'password123' }), UnauthorizedException);
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'placeholder-not-a-secret';
  const { JwtStrategy } = loadTs('auth/jwt.strategy', {
    '@nestjs/passport': { PassportStrategy: () => class {} },
    'passport-jwt': { ExtractJwt: { fromAuthHeaderAsBearerToken: () => () => null }, Strategy: class {} },
  });
  const strategy = new JwtStrategy(prisma);
  await assert.rejects(strategy.validate({ sub: 'bob', email: BOB_EMAIL, tokenVersion: 0 }), UnauthorizedException);
  assert.equal((await strategy.validate({ sub: 'carol', tokenVersion: 0 })).userId, 'carol', 'control: other users unaffected');
});

test('an Open (user-filed) banned_email row cannot block anyone', async () => {
  const prisma = fakeDb({
    user: [],
    report: [{ id: 'x', reporterid: 'mallory', targettype: 'banned_email', targetid: bannedEmailKey('victim@example.invalid'), status: 'Open' }],
  });
  const result = await new AuthService(prisma, jwt).signup(signup('victim@example.invalid'));
  assert.equal(result.user.email, 'victim@example.invalid');
});

test('ban records are hidden from the admin report list', async () => {
  const { moderation } = await bannedWorld();
  const resolved = await moderation.listReports(ADMIN, 'Resolved');
  assert.deepEqual(resolved.map((r) => r.id), ['r1']);
});

test('dismissing a report records no ban', async () => {
  const prisma = fakeDb({
    user: [{ id: 'bob', email: BOB_EMAIL }],
    report: [{ id: 'r1', reporterid: 'carol', targettype: 'user', targetid: 'bob', status: 'Open' }],
  });
  await new ModerationService(prisma, adminService).resolveReport(ADMIN, 'r1', { action: 'dismiss' });
  assert.equal(prisma.report.rows.some((r) => r.targettype === 'banned_email'), false);
  assert.equal(prisma.user.rows.length, 1);
});

// --- Item 6: distillery claim race --------------------------------------

function claimWorld(owneruserid = null) {
  return fakeDb({
    user: [],
    distillery: [{ id: 'd1', name: 'Seeded Distillery', owneruserid, verified: false, isclaimed: false, bio: 'Seeded bio' }],
  });
}
const claim = (email, bio) => signup(email, {
  isDistilleryAccount: true, distilleryData: { distilleryName: 'seeded distillery', bio },
});

test('two parallel signups cannot both claim one unowned distillery', async () => {
  const prisma = claimWorld();
  const auth = new AuthService(prisma, jwt);
  const results = await Promise.allSettled([
    auth.signup(claim('first@example.invalid', 'First bio')),
    auth.signup(claim('second@example.invalid', 'Second bio')),
  ]);
  const won = results.filter((r) => r.status === 'fulfilled');
  const lost = results.filter((r) => r.status === 'rejected');
  assert.equal(won.length, 1);
  assert.equal(lost.length, 1);
  assert.ok(lost[0].reason instanceof BadRequestException);
  assert.match(lost[0].reason.message, /already been claimed/);
  // The loser's account is removed; the winner owns the distillery.
  assert.equal(prisma.user.rows.length, 1);
  const winner = prisma.user.rows[0];
  assert.equal(won[0].value.user.id, winner.id);
  assert.equal(prisma.distillery.rows[0].owneruserid, winner.id);
  assert.equal(prisma.distillery.rows[0].verified, false);
});

test('a single claim of an unowned distillery still works (pending verification)', async () => {
  const prisma = claimWorld();
  const result = await new AuthService(prisma, jwt).signup(claim('owner@example.invalid', 'Owner bio'));
  const d = prisma.distillery.rows[0];
  assert.equal(d.owneruserid, result.user.id);
  assert.equal(d.isclaimed, true);
  assert.equal(result.distillery, null, 'unverified claim confers no distillery powers');
  // Product rule deliberately unchanged (AJ decision): the claim still sets public fields.
  assert.equal(d.bio, 'Owner bio');
});

test('an owned distillery is still refused before any account is created', async () => {
  const prisma = claimWorld('real-owner');
  await assert.rejects(new AuthService(prisma, jwt).signup(claim('late@example.invalid', 'x')), /already been claimed/);
  assert.equal(prisma.user.rows.length, 0);
  assert.equal(prisma.distillery.rows[0].owneruserid, 'real-owner');
});
