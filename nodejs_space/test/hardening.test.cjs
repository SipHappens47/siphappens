// Item 6: trust proxy, CSPRNG reset codes, 30-day JWT, scan quota refund,
// and the existing decline/cancel path for connection requests.
// Local only: the express check listens on loopback via supertest.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const request = require('supertest');
const { loadTs, ForbiddenException, HttpException } = require('./support/load-ts.cjs');
const { fakeDb } = require('./support/fake-db.cjs');

const { trustProxySetting } = loadTs('lib/trust-proxy');

test('trust proxy defaults to one hop and parses overrides', () => {
  assert.equal(trustProxySetting(undefined), 1);
  assert.equal(trustProxySetting(''), 1);
  assert.equal(trustProxySetting('2'), 2);
  assert.equal(trustProxySetting('false'), false);
  assert.equal(trustProxySetting('true'), true);
  assert.equal(trustProxySetting('loopback, 10.0.0.0/8'), 'loopback, 10.0.0.0/8');
});

function ipApp(setting) {
  const app = express();
  if (setting !== undefined) app.set('trust proxy', setting);
  app.get('/ip', (req, res) => res.json({ ip: req.ip }));
  return app;
}

test('with the default setting req.ip is the client address added by the proxy, not a spoofed one', async () => {
  const res = await request(ipApp(trustProxySetting(undefined)))
    .get('/ip').set('X-Forwarded-For', '198.51.100.99, 203.0.113.7');
  assert.equal(res.body.ip, '203.0.113.7');
});

test('two clients behind the proxy get distinct throttle keys', async () => {
  const app = ipApp(trustProxySetting(undefined));
  const a = await request(app).get('/ip').set('X-Forwarded-For', '203.0.113.7');
  const b = await request(app).get('/ip').set('X-Forwarded-For', '203.0.113.8');
  assert.notEqual(a.body.ip, b.body.ip);
});

test('control: without trust proxy every request looks like the proxy (shared bucket)', async () => {
  const app = ipApp(undefined);
  const a = await request(app).get('/ip').set('X-Forwarded-For', '203.0.113.7');
  const b = await request(app).get('/ip').set('X-Forwarded-For', '203.0.113.8');
  assert.equal(a.body.ip, b.body.ip);
});

// Auth: reset code and token lifetime.
function authFixture() {
  const sent = [];
  const signed = [];
  const { AuthService } = loadTs('auth/auth.service', {
    '../lib/email': { sendEmail: async (to, subject, html) => { sent.push(html); } },
  });
  const prisma = fakeDb({ user: [{ id: 'u1', email: 'user@example.invalid', password: 'x', tokenversion: 0, owneddistillery: [] }] });
  const jwt = { sign: (payload, options) => { signed.push(options); return 'token'; } };
  return { service: new AuthService(prisma, jwt), sent, signed, prisma };
}

test('reset code is a 6-digit code from the CSPRNG, not Math.random', async () => {
  const { service, sent } = authFixture();
  const realRandom = Math.random;
  Math.random = () => { throw new Error('Math.random must not be used for reset codes'); };
  try {
    await service.forgotPassword('user@example.invalid');
  } finally {
    Math.random = realRandom;
  }
  assert.match(sent[0], /<strong[^>]*>\d{6}<\/strong>/);
});

test('unknown email still gets the generic response and no email', async () => {
  const { service, sent } = authFixture();
  const result = await service.forgotPassword('nobody@example.invalid');
  assert.match(result.message, /If that email has an account/);
  assert.equal(sent.length, 0);
});

test('tokens are issued for 30 days', async () => {
  const bcrypt = require('bcryptjs');
  const { service, signed, prisma } = authFixture();
  prisma.user.rows[0].password = await bcrypt.hash('password123', 4);
  await service.login({ email: 'user@example.invalid', password: 'password123' });
  await service.signup({ email: 'new@example.invalid', password: 'password123', name: 'New', ageVerified: true });
  assert.deepEqual(signed, [{ expiresIn: '30d' }, { expiresIn: '30d' }]);
});

// Scan quota: failures are refunded, successes and limit hits are not.
function scanFixture({ used = 0, limit = '3' } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const user = { id: 'u1', dailyscancount: used, dailyscandate: today };
  const prisma = {
    user: {
      findUnique: async () => ({ ...user }),
      update: async ({ data }) => Object.assign(user, data),
      updateMany: async ({ where, data }) => {
        if (where.id === user.id && where.dailyscandate === user.dailyscandate && user.dailyscancount > where.dailyscancount.gt) {
          user.dailyscancount -= data.dailyscancount.decrement;
          return { count: 1 };
        }
        return { count: 0 };
      },
    },
  };
  process.env.SCAN_DAILY_LIMIT = limit;
  const { SpiritsService } = loadTs('spirits/spirits.service');
  return { service: new SpiritsService(prisma), user };
}

async function withEnv(env, fetchImpl, fn) {
  const saved = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
  const realFetch = globalThis.fetch;
  for (const [k, v] of Object.entries(env)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  globalThis.fetch = fetchImpl;
  try { await fn(); } finally {
    globalThis.fetch = realFetch;
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
}

const noNetwork = async () => { throw new Error('network must not be used'); };
const image = { image: 'data:image/jpeg;base64,AAAA' };

test('scan: recognition not configured does not consume the quota', async () => {
  await withEnv({ GEMINI_API_KEY: undefined }, noNetwork, async () => {
    const { service, user } = scanFixture({ used: 1 });
    await assert.rejects(service.recognizeBottle('u1', image), /not configured/);
    assert.equal(user.dailyscancount, 1);
  });
});

test('scan: provider failure on every model does not consume the quota', async () => {
  const failing = async () => ({ ok: false, status: 429, text: async () => 'quota' });
  await withEnv({ GEMINI_API_KEY: 'test-key-not-real' }, failing, async () => {
    const { service, user } = scanFixture({ used: 2 });
    await assert.rejects(service.recognizeBottle('u1', image), /Failed to analyze/);
    assert.equal(user.dailyscancount, 2);
  });
});

test('scan: a successful recognition is counted', async () => {
  const ok = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"matches":[]}' }] } }] }) });
  await withEnv({ GEMINI_API_KEY: 'test-key-not-real' }, ok, async () => {
    const { service, user } = scanFixture({ used: 0 });
    assert.deepEqual(await service.recognizeBottle('u1', image), { matches: [] });
    assert.equal(user.dailyscancount, 1);
  });
});

test('scan: the daily limit still blocks before any provider call', async () => {
  await withEnv({ GEMINI_API_KEY: 'test-key-not-real' }, noNetwork, async () => {
    const { service, user } = scanFixture({ used: 3, limit: '3' });
    await assert.rejects(service.recognizeBottle('u1', image), (err) => err instanceof HttpException && err.status === 429);
    assert.equal(user.dailyscancount, 3);
  });
});

// Decline/ignore: DELETE /api/connections/:id already lets the receiver decline
// and the sender cancel a pending request; nobody else can touch it.
const ALICE = 'a1';
const BOB = 'b1';
function declineFixture() {
  const prisma = fakeDb({ connection: [{ id: 'req', initiatorid: BOB, receiverid: ALICE, status: 'Pending' }] });
  const { ConnectionsService } = loadTs('connections/connections.service', { '../lib/push-notifications': { sendPushNotification: async () => {} } });
  return { service: new ConnectionsService(prisma, {}), prisma };
}

test('receiver can decline a pending request', async () => {
  const { service, prisma } = declineFixture();
  await service.rejectConnectionRequest(ALICE, 'req');
  assert.deepEqual(prisma.connection.rows, []);
});

test('sender can cancel their pending request', async () => {
  const { service, prisma } = declineFixture();
  await service.rejectConnectionRequest(BOB, 'req');
  assert.deepEqual(prisma.connection.rows, []);
});

test('an unrelated user cannot decline someone else\'s request', async () => {
  const { service, prisma } = declineFixture();
  await assert.rejects(service.rejectConnectionRequest('stranger', 'req'), ForbiddenException);
  assert.equal(prisma.connection.rows.length, 1);
});
