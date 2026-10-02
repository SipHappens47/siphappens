// Preload for local test runs: NODE_OPTIONS="--require ./test/support/no-network.cjs".
// 1. Placeholder credentials are set before anything loads, so a stray
//    dotenv/Prisma auto-load of nodejs_space/.env cannot supply real ones
//    (dotenv never overrides variables that are already defined).
// 2. Every outbound socket and fetch to a non-loopback host throws. Each
//    blocked attempt is appended to NO_NETWORK_LOG when that is set.
const fs = require('node:fs');
const net = require('node:net');

const PLACEHOLDERS = {
  DATABASE_URL: 'postgresql://placeholder:placeholder@127.0.0.1:9/placeholder',
  DIRECT_URL: 'postgresql://placeholder:placeholder@127.0.0.1:9/placeholder',
  SUPABASE_URL: 'http://127.0.0.1:9',
  SUPABASE_SERVICE_KEY: 'placeholder-not-a-key',
  SUPABASE_KEY: 'placeholder-not-a-key',
  SUPABASE_BUCKET: 'placeholder-bucket',
  GEMINI_API_KEY: 'placeholder-not-a-key',
  RESEND_API_KEY: 'placeholder-not-a-key',
  JWT_SECRET: 'placeholder-not-a-secret',
  SENTRY_DSN: '',
};
for (const [k, v] of Object.entries(PLACEHOLDERS)) process.env[k] = v;

const LOOPBACK = new Set(['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1']);

function blocked(target) {
  if (process.env.NO_NETWORK_LOG) fs.appendFileSync(process.env.NO_NETWORK_LOG, `${new Date().toISOString()} ${target}\n`);
  return new Error(`Network blocked in tests: ${target}`);
}

const realConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = args[0];
  const opts = Array.isArray(first) ? first[0] : first;
  const host = typeof opts === 'object' && opts !== null ? opts.host : typeof args[1] === 'string' ? args[1] : undefined;
  const isPipe = typeof opts === 'object' && opts !== null && typeof opts.path === 'string';
  if (!isPipe && host !== undefined && !LOOPBACK.has(host)) throw blocked(`socket ${host}`);
  return realConnect.apply(this, args);
};

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input?.url ?? String(input));
  if (!LOOPBACK.has(url.hostname.replace(/^\[|\]$/g, ''))) throw blocked(`fetch ${url.origin}`);
  return realFetch(input, init);
};
