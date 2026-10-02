// Express "trust proxy" setting for running behind Render's proxy.
// Without it req.ip (which the rate limiter keys on) is the proxy's address,
// so every client shares one throttle bucket. With a hop count n, Express
// takes req.ip from X-Forwarded-For n hops back from the socket, so a client
// cannot pick its own IP by sending extra X-Forwarded-For entries.
// TRUST_PROXY overrides the default of 1 hop: a hop count, 'false', or an
// Express address/subnet list. 'true' trusts every hop and is spoofable.
export function trustProxySetting(raw: string | undefined = process.env.TRUST_PROXY): boolean | number | string {
  const value = raw?.trim();
  if (!value) return 1;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  return value;
}
