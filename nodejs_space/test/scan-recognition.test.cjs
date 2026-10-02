// Batch 3, NF-2 and recognition errors: the daily scan quota is claimed
// atomically, refunded only for provider/transient failures, and failures
// reach the app as a readable 503 (provider) or 422 (the image itself).
// Fake DB and fake fetch only: no Gemini, DB or network.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTs, HttpException } = require('./support/load-ts.cjs');
const { fakeDb } = require('./support/fake-db.cjs');

const today = new Date().toISOString().slice(0, 10);
const image = { image: 'data:image/jpeg;base64,AAAA' };

function scanFixture({ used = 0, date = today, limit = '3' } = {}) {
  process.env.SCAN_DAILY_LIMIT = limit;
  const prisma = fakeDb({ user: [{ id: 'u1', dailyscancount: used, dailyscandate: date }] });
  // A real DB read returns a snapshot, not a live row: without this a
  // read-then-write quota would look race-free here.
  const liveFindUnique = prisma.user.findUnique;
  prisma.user.findUnique = async (q) => { const row = await liveFindUnique(q); return row && { ...row }; };
  const { SpiritsService } = loadTs('spirits/spirits.service');
  return { service: new SpiritsService(prisma), user: prisma.user.rows[0] };
}

// Runs fn with a fake fetch and GEMINI_API_KEY (null = unset); records every provider call.
async function withProvider(respond, fn, { key = 'test-key-not-real' } = {}) {
  const calls = [];
  const savedKey = process.env.GEMINI_API_KEY;
  const realFetch = globalThis.fetch;
  if (key === null) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key;
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); return respond(calls.length, url, init); };
  try { await fn(calls); } finally {
    globalThis.fetch = realFetch;
    if (savedKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = savedKey;
  }
}

const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
});
const answer = (text) => reply(200, { candidates: [{ content: { parts: [{ text }] } }] });
const success = () => answer('{"matches":[{"spiritName":"Test Gin"}]}');
const badImage = () => reply(400, { error: { code: 400, message: 'Unable to process input image.', status: 'INVALID_ARGUMENT' } });
const badKey = () => reply(400, {
  error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT',
    details: [{ reason: 'API_KEY_INVALID' }] },
});

const status = (code, pattern) => (err) => {
  assert.ok(err instanceof HttpException, `expected an HttpException, got ${err}`);
  assert.equal(err.status, code);
  if (pattern) assert.match(err.message, pattern);
  return true;
};
const UNAVAILABLE = /temporarily unavailable.*search for the bottle manually/;
const UNREADABLE = /couldn't read that photo/;

// --- Atomic claim -------------------------------------------------------

for (const [label, date] of [['same day', today], ['first scan of a new day', '2000-01-01'], ['never scanned', null]]) {
  test(`parallel scans cannot exceed the limit (${label})`, async () => {
    await withProvider(success, async (calls) => {
      const { service, user } = scanFixture({ used: date === today ? 1 : 7, date, limit: '3' });
      const results = await Promise.allSettled(Array.from({ length: 8 }, () => service.recognizeBottle('u1', image)));
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const limited = results.filter((r) => r.status === 'rejected' && r.reason.status === 429).length;
      const allowed = date === today ? 2 : 3;
      assert.equal(ok, allowed);
      assert.equal(limited, 8 - allowed);
      assert.equal(user.dailyscancount, 3);
      assert.equal(user.dailyscandate, today);
      assert.equal(calls.length, allowed);
    });
  });
}

test('the daily limit blocks before any provider call', async () => {
  await withProvider(success, async (calls) => {
    const { service, user } = scanFixture({ used: 3, limit: '3' });
    await assert.rejects(service.recognizeBottle('u1', image), status(429, /Daily scan limit of 3/));
    assert.equal(user.dailyscancount, 3);
    assert.equal(calls.length, 0);
  });
});

test('a limit of 0 disables scans without starting a count', async () => {
  await withProvider(success, async (calls) => {
    const { service, user } = scanFixture({ used: 5, date: '2000-01-01', limit: '0' });
    await assert.rejects(service.recognizeBottle('u1', image), status(429));
    assert.equal(user.dailyscandate, '2000-01-01');
    assert.equal(calls.length, 0);
  });
});

test('an unknown user is 404 and nothing is called', async () => {
  await withProvider(success, async (calls) => {
    const { service } = scanFixture();
    await assert.rejects(service.recognizeBottle('nobody', image), status(404));
    assert.equal(calls.length, 0);
  });
});

test('a successful recognition is counted and returned', async () => {
  await withProvider(success, async (calls) => {
    const { service, user } = scanFixture({ used: 0 });
    assert.deepEqual(await service.recognizeBottle('u1', image), { matches: [{ spiritName: 'Test Gin' }] });
    assert.equal(user.dailyscancount, 1);
    assert.ok(calls[0].init.signal instanceof AbortSignal, 'provider call has a timeout signal');
  });
});

// --- Provider/transient failures: refunded, readable 503 ---------------

test('missing configuration: 503, refunded, no provider call', async () => {
  await withProvider(success, async (calls) => {
    const { service, user } = scanFixture({ used: 1 });
    await assert.rejects(service.recognizeBottle('u1', image), status(503, UNAVAILABLE));
    assert.equal(user.dailyscancount, 1);
    assert.equal(calls.length, 0);
  }, { key: null });
});

test('rate limited on every model (429): 503, refunded, both models tried', async () => {
  await withProvider(() => reply(429, 'quota'), async (calls) => {
    const { service, user } = scanFixture({ used: 2 });
    await assert.rejects(service.recognizeBottle('u1', image), status(503, UNAVAILABLE));
    assert.equal(user.dailyscancount, 2);
    assert.equal(calls.length, 2);
  });
});

test('provider 5xx on every attempt: 503, refunded', async () => {
  await withProvider(() => reply(503, 'overloaded'), async (calls) => {
    const { service, user } = scanFixture({ used: 0 });
    await assert.rejects(service.recognizeBottle('u1', image), status(503, UNAVAILABLE));
    assert.equal(user.dailyscancount, 0);
    assert.equal(calls.length, 4); // two attempts on each of two models
  });
});

test('timeouts and network errors: 503, refunded, fallback model tried', async () => {
  const timeout = () => { const e = new Error('The operation was aborted due to timeout'); e.name = 'TimeoutError'; throw e; };
  await withProvider(timeout, async (calls) => {
    const { service, user } = scanFixture({ used: 0 });
    await assert.rejects(service.recognizeBottle('u1', image), status(503, UNAVAILABLE));
    assert.equal(user.dailyscancount, 0);
    assert.equal(calls.length, 2);
  });
});

test('first model fails, fallback succeeds: counted once', async () => {
  await withProvider((n) => (n === 1 ? reply(429, 'quota') : success()), async (calls) => {
    const { service, user } = scanFixture({ used: 0 });
    assert.equal((await service.recognizeBottle('u1', image)).matches.length, 1);
    assert.equal(user.dailyscancount, 1);
    assert.equal(calls.length, 2);
  });
});

test('an invalid API key (400 API_KEY_INVALID) is our fault: 503, refunded', async () => {
  await withProvider(badKey, async () => {
    const { service, user } = scanFixture({ used: 0 });
    await assert.rejects(service.recognizeBottle('u1', image), status(503, UNAVAILABLE));
    assert.equal(user.dailyscancount, 0);
  });
});

test('an unreadable provider response body: 503, refunded', async () => {
  const garbled = () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token'); } });
  await withProvider(garbled, async () => {
    const { service, user } = scanFixture({ used: 0 });
    await assert.rejects(service.recognizeBottle('u1', image), status(503, UNAVAILABLE));
    assert.equal(user.dailyscancount, 0);
  });
});

// --- Client-caused rejections: counted, readable 422 --------------------

test('an invalid image (400 INVALID_ARGUMENT) is counted, 422, and not retried on the fallback', async () => {
  await withProvider(badImage, async (calls) => {
    const { service, user } = scanFixture({ used: 0 });
    await assert.rejects(service.recognizeBottle('u1', image), status(422, UNREADABLE));
    assert.equal(user.dailyscancount, 1);
    assert.equal(calls.length, 1);
  });
});

test('repeated invalid images use up the quota (no unlimited provider calls)', async () => {
  await withProvider(badImage, async (calls) => {
    const { service, user } = scanFixture({ used: 0, limit: '3' });
    for (let i = 0; i < 3; i++) await assert.rejects(service.recognizeBottle('u1', image), status(422));
    await assert.rejects(service.recognizeBottle('u1', image), status(429));
    assert.equal(user.dailyscancount, 3);
    assert.equal(calls.length, 3);
  });
});

test('a blocked or empty answer for the image is counted, 422', async () => {
  await withProvider(() => reply(200, { candidates: [], promptFeedback: { blockReason: 'SAFETY' } }), async () => {
    const { service, user } = scanFixture({ used: 0 });
    await assert.rejects(service.recognizeBottle('u1', image), status(422, UNREADABLE));
    assert.equal(user.dailyscancount, 1);
  });
});

test('a non-JSON answer is counted, 422 (never a bare 500)', async () => {
  await withProvider(() => answer('not json'), async () => {
    const { service, user } = scanFixture({ used: 0 });
    await assert.rejects(service.recognizeBottle('u1', image), status(422, UNREADABLE));
    assert.equal(user.dailyscancount, 1);
  });
});

test('error messages never name the provider or leak provider text', async () => {
  await withProvider(() => reply(503, 'secret upstream detail'), async () => {
    const { service } = scanFixture({ used: 0 });
    await assert.rejects(service.recognizeBottle('u1', image), (err) => {
      assert.doesNotMatch(err.message, /Gemini|upstream|API/);
      return true;
    });
  });
});
