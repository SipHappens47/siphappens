// Item 1: shared catalogue writes are admin-only; distillery owners keep their own shelf path.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTs, ForbiddenException } = require('./support/load-ts.cjs');

const { AdminService } = loadTs('admin/admin.service');
const { SeedController } = loadTs('seed/seed.controller');
const { SpiritsController } = loadTs('spirits/spirits.controller');
const { DistilleriesService } = loadTs('distilleries/distilleries.service');

const ADMIN = 'admin-id';
const EMAILS = { [ADMIN]: 'official@siphappens.com', user: 'user@example.invalid' };
const adminService = () => new AdminService({
  user: { findUnique: async ({ where }) => (EMAILS[where.id] ? { email: EMAILS[where.id] } : null) },
});
const req = (userId) => ({ user: { userId } });

function seedFixture() {
  const calls = [];
  const record = (name, value) => async (...args) => { calls.push(name); return value; };
  const seedService = {
    autoImportFromPublicDatasets: record('autoImport', { totalImported: 0 }),
    importFromUploadedCsv: record('csv', { totalImported: 0 }),
    getDatabaseStats: record('stats', { totalSpirits: 0 }),
    seedTestDistilleries: record('seedTest', { count: 0 }),
  };
  return { controller: new SeedController(seedService, adminService()), calls };
}

const csvFile = { originalname: 'synthetic.csv', buffer: Buffer.from('name\n') };
const seedRoutes = {
  'auto-import': (c, r) => c.autoImport(r),
  'upload-csv': (c, r) => c.uploadCsv(r, csvFile),
  'get-stats': (c, r) => c.getStats(r),
  'seed-test-distilleries': (c, r) => c.seedTestDistilleries(r),
};

for (const [route, invoke] of Object.entries(seedRoutes)) {
  for (const actor of ['user', 'unknown-user']) {
    test(`seed ${route}: ${actor} is refused before any catalogue work`, async () => {
      const { controller, calls } = seedFixture();
      await assert.rejects(invoke(controller, req(actor)), ForbiddenException);
      assert.deepEqual(calls, []);
    });
  }
  test(`seed ${route}: admin is allowed`, async () => {
    const { controller, calls } = seedFixture();
    await invoke(controller, req(ADMIN));
    assert.equal(calls.length, 1);
  });
}

function spiritsFixture() {
  const calls = [];
  const spiritsService = { updateSpirit: async (id, dto) => { calls.push([id, dto]); return { id }; } };
  return { controller: new SpiritsController(spiritsService, adminService()), calls };
}

test('PUT /api/spirits/:id: signed-in non-admin cannot edit the shared catalogue', async () => {
  const { controller, calls } = spiritsFixture();
  await assert.rejects(controller.updateSpirit('spirit', { name: 'Vandalised' }, req('user')), ForbiddenException);
  assert.deepEqual(calls, []);
});

test('PUT /api/spirits/:id: admin can edit', async () => {
  const { controller, calls } = spiritsFixture();
  assert.deepEqual(await controller.updateSpirit('spirit', { name: 'Fixed' }, req(ADMIN)), { id: 'spirit' });
  assert.deepEqual(calls, [['spirit', { name: 'Fixed' }]]);
});

function shelfFixture() {
  const calls = { update: 0 };
  const prisma = {
    distillery: { findUnique: async () => ({ owneruserid: 'owner' }) },
    spirit: {
      findUnique: async () => ({ distilleryid: 'distillery' }),
      update: async ({ data }) => {
        calls.update++;
        return { id: 'spirit', ...data, distillery: null, flavortags: [] };
      },
    },
  };
  return { service: new DistilleriesService(prisma), calls };
}

test('distillery owner still edits their own shelf spirit', async () => {
  const { service, calls } = shelfFixture();
  const result = await service.updateSpiritOnShelf('distillery', 'spirit', 'owner', { name: 'Owner edit' });
  assert.equal(result.name, 'Owner edit');
  assert.equal(calls.update, 1);
});

test('non-owner cannot use the shelf path either', async () => {
  const { service, calls } = shelfFixture();
  await assert.rejects(service.updateSpiritOnShelf('distillery', 'spirit', 'user', { name: 'x' }), ForbiddenException);
  assert.equal(calls.update, 0);
});

// Signup must not let a newcomer take over a distillery someone already owns.
const { AuthService } = loadTs('auth/auth.service', { '../lib/email': { sendEmail: async () => {} } });

function signupFixture(existingDistillery) {
  const calls = { userCreate: 0, distilleryUpdate: 0 };
  const prisma = {
    user: {
      findUnique: async () => null,
      findFirst: async () => null,
      create: async ({ data }) => { calls.userCreate++; return { id: 'new-user', tokenversion: 0, ...data }; },
    },
    connection: { create: async () => ({}) },
    report: { findFirst: async () => null }, // no banned emails
    distillery: {
      findFirst: async () => existingDistillery,
      update: async ({ data }) => { calls.distilleryUpdate++; return { ...existingDistillery, ...data }; },
      updateMany: async ({ where, data }) => {
        calls.distilleryUpdate++;
        if (existingDistillery.owneruserid !== where.owneruserid) return { count: 0 };
        Object.assign(existingDistillery, data);
        return { count: 1 };
      },
      findUnique: async () => existingDistillery,
      create: async ({ data }) => ({ id: 'created', ...data }),
    },
  };
  const jwt = { sign: () => 'token' };
  return { service: new AuthService(prisma, jwt), calls };
}

const distillerySignup = {
  email: 'claimer@example.invalid', password: 'password123', name: 'Claimer', ageVerified: true,
  isDistilleryAccount: true, distilleryData: { distilleryName: 'Owned Distillery', bio: 'Hijacked bio' },
};

test('signup cannot re-claim a distillery that already has an owner', async () => {
  const { service, calls } = signupFixture({ id: 'd1', name: 'Owned Distillery', owneruserid: 'real-owner', verified: true });
  await assert.rejects(service.signup(distillerySignup), /already been claimed/);
  assert.equal(calls.userCreate, 0);
  assert.equal(calls.distilleryUpdate, 0);
});

test('signup can still claim an unowned seeded distillery (pending verification)', async () => {
  const { service, calls } = signupFixture({ id: 'd2', name: 'Owned Distillery', owneruserid: null, verified: false });
  const result = await service.signup(distillerySignup);
  assert.equal(calls.userCreate, 1);
  assert.equal(calls.distilleryUpdate, 1);
  assert.equal(result.distillery, null, 'unverified claim confers no distillery powers');
});
