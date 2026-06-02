// Fetches each distillery's homepage (from a curated name->URL map) and writes
// the og:image / apple-touch-icon / og:description into Supabase.
// No search engine involved — avoids the bulk-scraping rate-limit problem.
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const map = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'distillery-domains.json'), 'utf-8'),
);
// strip any comment / section-marker keys (underscore prefix)
for (const k of Object.keys(map)) {
  if (k.startsWith('_')) delete map[k];
}

async function fetchText(url, { timeout = 20000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    if (!r.ok) return { ok: false, status: r.status };
    return { ok: true, url: r.url, text: await r.text() };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    clearTimeout(t);
  }
}

function metaContent(html, propName) {
  const re = new RegExp(
    `<meta\\b[^>]*\\b(?:property|name)\\s*=\\s*"${propName}"[^>]*>`,
    'i',
  );
  const m = html.match(re);
  if (!m) return null;
  const c = m[0].match(/\bcontent\s*=\s*"([^"]+)"/i);
  return c ? c[1] : null;
}

function linkRelHref(html, rel) {
  const re = /<link\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const relMatch = tag.match(/\brel\s*=\s*"([^"]+)"/i);
    if (!relMatch) continue;
    const rels = relMatch[1].toLowerCase().split(/\s+/);
    if (rels.includes(rel)) {
      const href = tag.match(/\bhref\s*=\s*"([^"]+)"/i);
      if (href) return href[1];
    }
  }
  return null;
}

function absolute(url, base) {
  if (!url) return null;
  try {
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

function htmlDecode(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

async function processOne(name, homepageUrl) {
  const d = await prisma.distillery.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true, name: true, websiteurl: true, logo: true, heroimage: true, bio: true },
  });
  if (!d) return { status: 'no-such-distillery' };

  // Always (re)write websiteurl. Only fill the others if currently empty.
  const result = await fetchText(homepageUrl);
  if (!result.ok) return { status: 'fetch-failed', err: result.error || result.status };
  const html = result.text;
  const finalUrl = result.url || homepageUrl;

  const hero =
    metaContent(html, 'og:image:secure_url') ||
    metaContent(html, 'og:image') ||
    metaContent(html, 'twitter:image');
  const desc =
    metaContent(html, 'og:description') ||
    metaContent(html, 'twitter:description') ||
    metaContent(html, 'description');
  const ico =
    linkRelHref(html, 'apple-touch-icon') ||
    linkRelHref(html, 'apple-touch-icon-precomposed') ||
    linkRelHref(html, 'icon') ||
    linkRelHref(html, 'shortcut icon');

  const updates = { websiteurl: homepageUrl };
  if (!d.heroimage && hero) updates.heroimage = absolute(hero, finalUrl);
  if (!d.logo) {
    updates.logo = absolute(ico, finalUrl) || absolute('/favicon.ico', finalUrl);
  }
  if (!d.bio && desc) updates.bio = htmlDecode(desc).slice(0, 500);

  const filled = ['heroimage', 'logo', 'bio'].filter((k) => updates[k]);
  if (filled.length === 0 && d.websiteurl === homepageUrl) {
    return { status: 'no-meta' };
  }

  await prisma.distillery.update({ where: { id: d.id }, data: updates });
  return { status: 'ok', filled, finalUrl };
}

async function main() {
  const entries = Object.entries(map);
  console.log(`Processing ${entries.length} curated distilleries...\n`);

  const tally = {};
  for (const [name, url] of entries) {
    let res;
    try {
      res = await processOne(name, url);
    } catch (e) {
      res = { status: 'error', err: e.message };
    }
    tally[res.status] = (tally[res.status] || 0) + 1;
    const tag = res.status === 'ok' ? `✓ ${res.filled.join('+')}` : `✗ ${res.status}`;
    console.log(`  ${tag.padEnd(30)} ${name}`);
  }

  console.log('\nSummary:');
  for (const [k, v] of Object.entries(tally)) console.log(`  ${k.padEnd(20)} ${v}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
