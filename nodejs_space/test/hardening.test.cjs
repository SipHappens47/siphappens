// Item 6: trust proxy, CSPRNG reset codes, 30-day JWT,
// and the existing decline/cancel path for connection requests.
// Local only: the express check listens on loopback via supertest.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const request = require('supertest');
const { loadTs, ForbiddenException } = require('./support/load-ts.cjs');
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

// Scan quota and recognition failures: see scan-recognition.test.cjs.

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
