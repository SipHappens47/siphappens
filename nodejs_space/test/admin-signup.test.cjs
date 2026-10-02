// Item 2: nobody can self-register the reserved admin email unless ALLOW_ADMIN_SIGNUP=true.
const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const bcrypt = require('bcryptjs');
const { loadTs, BadRequestException } = require('./support/load-ts.cjs');

const { AuthService } = loadTs('auth/auth.service', { '../lib/email': { sendEmail: async () => {} } });

const ORIGINAL = process.env.ALLOW_ADMIN_SIGNUP;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.ALLOW_ADMIN_SIGNUP;
  else process.env.ALLOW_ADMIN_SIGNUP = ORIGINAL;
});

function fixture(existing = null) {
  const calls = { create: 0 };
  const prisma = {
    user: {
      findUnique: async () => existing,
      findFirst: async () => null,
      create: async ({ data }) => { calls.create++; return { id: 'new-user', tokenversion: 0, ...data }; },
    },
    connection: { create: async () => ({}) },
  };
  return { service: new AuthService(prisma, { sign: () => 'token' }), calls };
}

const signup = (email) => ({ email, password: 'password123', name: 'Synthetic', ageVerified: true });

for (const email of ['official@siphappens.com', 'Official@SipHappens.com', ' OFFICIAL@siphappens.com ']) {
  test(`signup refuses reserved admin email ${JSON.stringify(email)} by default`, async () => {
    delete process.env.ALLOW_ADMIN_SIGNUP;
    const { service, calls } = fixture();
    await assert.rejects(service.signup(signup(email)), (err) => err instanceof BadRequestException && /reserved/.test(err.message));
    assert.equal(calls.create, 0);
  });
}

test('signup still refuses the admin email when the flag is anything but "true"', async () => {
  process.env.ALLOW_ADMIN_SIGNUP = '1';
  const { service, calls } = fixture();
  await assert.rejects(service.signup(signup('official@siphappens.com')), BadRequestException);
  assert.equal(calls.create, 0);
});

test('ALLOW_ADMIN_SIGNUP=true permits the one-off admin registration', async () => {
  process.env.ALLOW_ADMIN_SIGNUP = 'true';
  const { service, calls } = fixture();
  const result = await service.signup(signup('official@siphappens.com'));
  assert.equal(calls.create, 1);
  assert.equal(result.user.email, 'official@siphappens.com');
});

test('ordinary signup is unaffected', async () => {
  delete process.env.ALLOW_ADMIN_SIGNUP;
  const { service, calls } = fixture();
  const result = await service.signup(signup('someone@example.invalid'));
  assert.equal(calls.create, 1);
  assert.equal(result.token, 'token');
});

test('an existing admin account still logs in', async () => {
  delete process.env.ALLOW_ADMIN_SIGNUP;
  const password = await bcrypt.hash('password123', 4);
  const { service } = fixture({
    id: 'admin', email: 'official@siphappens.com', password, name: 'SipHappens', tokenversion: 0, owneddistillery: [],
  });
  const result = await service.login({ email: 'official@siphappens.com', password: 'password123' });
  assert.equal(result.user.id, 'admin');
});
