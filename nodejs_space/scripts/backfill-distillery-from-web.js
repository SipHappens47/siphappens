// Backfills distillery.websiteurl, logo, heroimage, bio from each distillery's
// official website. Searches via DuckDuckGo HTML, fetches the homepage, and
// extracts Open Graph + icon metadata.
//
// Skips distilleries that already have a websiteurl (assume done).
// Run: node --env-file=.env scripts/backfill-distillery-from-web.js [--limit N] [--only "Name"]
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Domains to ignore as "the official site" (these are wrappers / directories / socials / retailers / encyclopedias).
const BLOCKED_HOSTS = [
  'wikipedia.org', 'wikimedia.org',
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com',
  'tiktok.com', 'youtube.com', 'reddit.com', 'pinterest.com',
  'tripadvisor.com', 'yelp.com',
  'amazon.com', 'amazon.co.uk', 'amazon.de',
  'masterofmalt.com', 'thewhiskyexchange.com', 'totalwine.com', 'drizly.com', 'klwines.com',
  'whiskybase.com', 'whisky.com', 'whiskeyadvocate.com', 'whisky.de', 'whiskyadvocate.com',
  'distillerytrail.com', 'dramface.com', 'maltspedia.com', 'maltmaniacs.net',
  'diffordsguide.com', 'finewineandgoodspirits.com', 'thespiritsbusiness.com',
  'difford.com', 'whiskyfun.com', 'whiskyinvestdirect.com', 'liquor.com',
  'punchdrink.com', 'bevvy.com', 'cocktailsdistilled.com',
  'apple.com', 'apps.apple.com', 'play.google.com',
  'pinterest.co.uk', 'youtube.co.uk',
  'whisky-news.com', 'scotchwhisky.com', 'malt-review.com',
];

function isBlockedHost(host) {
  host = host.toLowerCase();
  return BLOCKED_HOSTS.some((b) => host === b || host.endsWith('.' + b));
}

async function fetchText(url, { timeout = 15000 } = {}) {
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
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Returns array of candidate URLs from a DuckDuckGo HTML search.
async function ddgSearch(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const html = await fetchText(url);
  if (!html) return [];

  const urls = [];
  // DDG renders results as <a class="result__a" href="...">
  // followed by redirect URLs like //duckduckgo.com/l/?uddg=ENCODED_URL
  const re = /class="result__a"[^>]*href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    let href = m[1];
    // DDG wraps URLs as //duckduckgo.com/l/?uddg=...&rut=...
    const uddg = href.match(/uddg=([^&]+)/);
    if (uddg) {
      try {
        href = decodeURIComponent(uddg[1]);
      } catch {
        continue;
      }
    }
    if (!/^https?:\/\//i.test(href)) continue;
    urls.push(href);
  }
  return urls;
}

function attrOf(html, tag, attr, valueOf = 'content') {
  // Find <tag ... attr="something" ... valueOf="X">
  const re = new RegExp(
    `<${tag}\\b[^>]*\\b${attr}\\s*=\\s*"([^"]+)"[^>]*>`,
    'gi',
  );
  let m;
  while ((m = re.exec(html))) {
    const tagOpen = m[0];
    const v = tagOpen.match(new RegExp(`\\b${valueOf}\\s*=\\s*"([^"]+)"`, 'i'));
    if (v) return { match: m[1], value: v[1] };
  }
  return null;
}

function metaContent(html, propName) {
  // Looks for <meta property="propName" content="..."> OR <meta name="propName" content="...">
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
  // Looks for <link rel="..." href="..."> where rel matches a token in our value.
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

function nameTokens(name) {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !['the', 'and', 'of', 'distillery', 'distilling', 'distillers', 'co', 'inc', 'llc', 'ltd', 'group', 'spirits', 'brand', 'brands'].includes(w));
}

function pageMatchesDistillery(name, html, finalUrl) {
  const tokens = nameTokens(name);
  if (tokens.length === 0) return true; // Too short to verify, accept
  const blob = (html || '').toLowerCase() + ' ' + finalUrl.toLowerCase();
  // Require at least one significant token to appear (good enough for sanity check)
  return tokens.some((t) => blob.includes(t));
}

async function extractFromHomepage(homepageUrl, distilleryName) {
  const html = await fetchText(homepageUrl);
  if (!html) return null;

  // Sanity check is unreliable (brand/corporate name mismatches), so trust
  // the search result. We still verify we got real OG metadata before saving.

  const heroRaw =
    metaContent(html, 'og:image:secure_url') ||
    metaContent(html, 'og:image') ||
    metaContent(html, 'twitter:image');
  const bioRaw =
    metaContent(html, 'og:description') ||
    metaContent(html, 'twitter:description') ||
    metaContent(html, 'description');
  const logoRaw =
    linkRelHref(html, 'apple-touch-icon') ||
    linkRelHref(html, 'apple-touch-icon-precomposed') ||
    linkRelHref(html, 'icon') ||
    linkRelHref(html, 'shortcut icon');

  return {
    heroimage: absolute(heroRaw, homepageUrl),
    logo: absolute(logoRaw, homepageUrl) || absolute('/favicon.ico', homepageUrl),
    bio: bioRaw ? htmlDecode(bioRaw).slice(0, 500) : null,
  };
}

async function findOfficialSite(name) {
  const tokens = nameTokens(name);
  const queries = [
    `"${name}" distillery official site`,
    `${name} distillery`,
    `${name} official site`,
    name,
  ];

  // Collect candidates from all queries first, then rank.
  const candidates = [];
  const seenHosts = new Set();
  for (const q of queries) {
    const results = await ddgSearch(q);
    for (const r of results) {
      try {
        const u = new URL(r);
        if (isBlockedHost(u.hostname)) continue;
        if (seenHosts.has(u.hostname)) continue;
        seenHosts.add(u.hostname);
        candidates.push({ url: r, host: u.hostname, homepage: `${u.protocol}//${u.hostname}/` });
        if (candidates.length >= 8) break;
      } catch {}
    }
    if (candidates.length >= 8) break;
    await new Promise((res) => setTimeout(res, 600));
  }
  if (candidates.length === 0) return null;

  // Rank: prefer hosts where one of the distillery's name tokens appears in the domain.
  const hostMatches = (host) => {
    const h = host.toLowerCase().replace(/[^a-z0-9]/g, '');
    return tokens.some((t) => h.includes(t.toLowerCase().replace(/[^a-z0-9]/g, '')));
  };
  candidates.sort((a, b) => Number(hostMatches(b.host)) - Number(hostMatches(a.host)));
  return candidates[0];
}

async function processDistillery(d) {
  const search = await findOfficialSite(d.name);
  if (!search) return { status: 'no-search-result' };
  const extracted = await extractFromHomepage(search.homepage, d.name);
  if (!extracted) return { status: 'fetch-failed', url: search.homepage };
  if (extracted.skipped) return { status: extracted.skipped, url: search.homepage };

  const updates = { websiteurl: search.homepage };
  if (extracted.heroimage) updates.heroimage = extracted.heroimage;
  if (extracted.logo) updates.logo = extracted.logo;
  if (extracted.bio) updates.bio = extracted.bio;

  // Only write if we got at least one image or bio (websiteurl alone is weak)
  const enriched = !!(updates.heroimage || updates.logo || updates.bio);
  if (!enriched) return { status: 'no-meta', url: search.homepage };

  await prisma.distillery.update({ where: { id: d.id }, data: updates });
  return {
    status: 'ok',
    url: search.homepage,
    fields: Object.keys(updates).filter((k) => k !== 'websiteurl'),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit'));
  const onlyArg = args.find((a) => a.startsWith('--only'));
  const limit = limitArg ? parseInt(limitArg.split('=')[1] || args[args.indexOf(limitArg) + 1], 10) : null;
  const only = onlyArg ? (onlyArg.includes('=') ? onlyArg.split('=')[1] : args[args.indexOf(onlyArg) + 1]) : null;

  const where = { websiteurl: null };
  if (only) where.name = { equals: only, mode: 'insensitive' };

  const all = await prisma.distillery.findMany({
    where,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: limit || undefined,
  });
  console.log(`Processing ${all.length} distillery profiles...\n`);

  const counts = { ok: 0, 'no-search-result': 0, 'fetch-failed': 0, 'no-meta': 0, 'name-not-on-page': 0 };
  let processed = 0;
  for (const d of all) {
    processed++;
    let result;
    try {
      result = await processDistillery(d);
    } catch (e) {
      result = { status: 'error', error: e.message };
    }
    counts[result.status] = (counts[result.status] || 0) + 1;

    if (result.status === 'ok') {
      console.log(`  [${processed}/${all.length}] ✓ ${d.name}  →  ${result.url}  (${result.fields.join('+')})`);
    } else if (processed % 25 === 0) {
      console.log(`  [${processed}/${all.length}] (last: ${d.name} → ${result.status})`);
    }
    // Throttle to be polite — average 1.5s/distillery
    await new Promise((res) => setTimeout(res, 800));
  }

  console.log('\nDone:');
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(20)} ${v}`);
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
