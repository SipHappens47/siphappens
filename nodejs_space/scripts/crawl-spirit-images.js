// Crawls each distillery's website looking for individual product pages,
// then matches each product page to a spirit in our DB by name and saves
// that page's og:image as the spirit's bottleimage.
//
// Strategy per distillery:
//   1. Open homepage in Playwright (handles Cloudflare/JS sites).
//   2. Collect all internal links.
//   3. Filter to "looks like a product page" (URL or anchor text contains
//      product-y words).
//   4. Visit each candidate page; pull og:image + <title> / <h1>.
//   5. Try to match the page name to one of this distillery's spirits.
//   6. Write the og:image into spirit.bottleimage.
//
// Run: node --env-file=.env scripts/crawl-spirit-images.js [--limit N]
const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith('--limit'));
const DISTILLERY_LIMIT = limitArg ? parseInt(args[args.indexOf(limitArg) + 1], 10) : 999;

// URL/anchor-text words that suggest a product page
const PRODUCT_HINTS = [
  'whisky','whiskey','bourbon','scotch','rye','malt',
  'rum','rhum','gin','vodka','tequila','mezcal','cachaca','cachaça',
  'brandy','cognac','armagnac','liqueur','spirit','spirits',
  'product','products','our-','collection','range','expressions','releases',
  'years','year-old','aged','reserve','single',
];

const SKIP_URL_HINTS = [
  '/blog','/news','/journal','/event','/recipe','/cocktail',
  '/about','/contact','/visit','/shop','/cart','/account','/login',
  '/privacy','/terms','/legal','/career','/job','/press',
  '.pdf','.jpg','.png','mailto:','tel:','#',
];

// Tokens to ignore when matching product page names to spirits
const STOPWORDS = new Set([
  'the','and','of','a','an','old','year','years','yr','yrs','yo',
  'single','malt','blended','blend','whisky','whiskey','bourbon','rum',
  'gin','vodka','tequila','mezcal','brandy','cognac','armagnac','liqueur','spirit','spirits',
  'distillery','distillers','distilling','distilled',
  'reserve','select','edition','release','limited','special','rare',
  'no','number','small','batch','sherry','oak','cask','finish','aged','matured',
  'classic','original','premium','straight','strength',
]);

function normTokens(s) {
  if (!s) return [];
  // Normalize: strip apostrophes, split on non-alphanumeric, lowercase
  // Also normalize "12yr"/"12yo" -> "12" and split number+letter combos
  let t = s
    .toLowerCase()
    .replace(/['’`"]/g, '')
    // Split number+letter combos: "12yr" -> "12 yr", "10yo" -> "10 yo"
    .replace(/(\d+)([a-z]+)/g, '$1 $2')
    .replace(/([a-z]+)(\d+)/g, '$1 $2')
    .replace(/[^a-z0-9 ]+/g, ' ');
  return t.split(/\s+/).filter((w) => w && !STOPWORDS.has(w));
}

function distinctiveTokens(s) {
  // Strip common short prefixes used by TTB CSVs: BP, HA, WP, etc. (two-letter all-caps prefix)
  s = s.replace(/^[A-Z]{2,3}\s+/, '');
  return normTokens(s);
}

function isProductLikeLink(url, text) {
  const u = url.toLowerCase();
  const t = (text || '').toLowerCase();
  if (SKIP_URL_HINTS.some((h) => u.includes(h))) return false;
  const blob = u + ' ' + t;
  return PRODUCT_HINTS.some((h) => blob.includes(h));
}

async function getDistilleriesToCrawl() {
  // Distilleries that have a website AND at least one spirit with no bottleimage
  return prisma.$queryRaw`
    SELECT d.id, d.name, d.websiteurl, COUNT(s.id)::int AS empty_spirits
    FROM public.distillery d
    JOIN public.spirit s ON s.distilleryid = d.id
    WHERE d.websiteurl IS NOT NULL
      AND s.bottleimage IS NULL
    GROUP BY d.id, d.name, d.websiteurl
    ORDER BY empty_spirits DESC, d.name
    LIMIT ${DISTILLERY_LIMIT}
  `;
}

async function collectCandidateLinks(page, homepage) {
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map((a) => ({
      href: a.getAttribute('href'),
      text: (a.textContent || '').trim().slice(0, 100),
    }));
  });
  const home = new URL(homepage);
  const seen = new Set();
  const out = [];
  for (const { href, text } of links) {
    if (!href) continue;
    let u;
    try {
      u = new URL(href, homepage);
    } catch {
      continue;
    }
    if (u.hostname !== home.hostname) continue;
    const norm = `${u.origin}${u.pathname}`.replace(/\/$/, '');
    if (seen.has(norm)) continue;
    if (!isProductLikeLink(u.pathname, text)) continue;
    // Skip the homepage itself
    if (u.pathname === '/' || u.pathname === '') continue;
    seen.add(norm);
    out.push({ url: norm, text });
    if (out.length >= 60) break;
  }
  return out;
}

async function extractPageMeta(page) {
  return page.evaluate(() => {
    const meta = (p) => {
      const el = document.querySelector(`meta[property="${p}"], meta[name="${p}"]`);
      return el ? el.getAttribute('content') : null;
    };
    const title = (document.querySelector('h1')?.textContent || document.title || '').trim();
    return {
      ogImage: meta('og:image:secure_url') || meta('og:image') || meta('twitter:image'),
      title,
    };
  });
}

function matchPageToSpirit(pageTitle, pageUrl, spirits) {
  // Try to find the best spirit whose distinctive tokens all appear in the page title
  const pageBlob = `${pageTitle} ${pageUrl}`.toLowerCase();
  const pageTokens = new Set(normTokens(pageBlob));
  let bestScore = 0;
  let best = null;
  for (const s of spirits) {
    if (s.bottleimage) continue;
    const tokens = distinctiveTokens(s.name);
    if (tokens.length === 0) continue;
    let hit = 0;
    const numericTokens = tokens.filter((t) => /^\d+$/.test(t));
    let numericMatched = numericTokens.length === 0; // true if no number, else require number match
    for (const t of tokens) {
      if (pageTokens.has(t) || pageBlob.includes(t)) {
        hit++;
        if (/^\d+$/.test(t)) numericMatched = true;
      }
    }
    const score = hit / tokens.length;
    // Require: numeric token (age) matches if spirit has one, AND >=50% of tokens match,
    // AND at least 2 hits total (or 1 hit if only 1 token).
    const minHits = tokens.length === 1 ? 1 : 2;
    if (numericMatched && hit >= minHits && score >= 0.5 && score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

async function crawlDistillery(context, d, spirits) {
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const result = { candidates: 0, matched: 0, errors: 0 };
  try {
    await page.goto(d.websiteurl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    const links = await collectCandidateLinks(page, d.websiteurl);
    result.candidates = links.length;

    for (const link of links) {
      if (spirits.every((s) => s.bottleimage)) break; // all filled, stop
      try {
        await page.goto(link.url, { waitUntil: 'domcontentloaded', timeout: 18000 });
        await page.waitForTimeout(1200);
        const meta = await extractPageMeta(page);
        if (!meta.ogImage) continue;
        const matched = matchPageToSpirit(meta.title, link.url, spirits);
        if (!matched) continue;
        const imageUrl = new URL(meta.ogImage, link.url).href;
        await prisma.spirit.update({
          where: { id: matched.id },
          data: { bottleimage: imageUrl },
        });
        matched.bottleimage = imageUrl;
        result.matched++;
        console.log(`    ✓ ${matched.name}  ←  ${link.url.split('/').pop()}`);
      } catch (e) {
        result.errors++;
      }
    }
  } catch (e) {
    result.errors++;
  } finally {
    await page.close();
  }
  return result;
}

async function main() {
  const distilleries = await getDistilleriesToCrawl();
  console.log(`Will crawl ${distilleries.length} distilleries.\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });

  let totalMatched = 0;
  let processed = 0;
  for (const d of distilleries) {
    processed++;
    const spirits = await prisma.spirit.findMany({
      where: { distilleryid: d.id },
      select: { id: true, name: true, bottleimage: true },
    });
    const emptyCount = spirits.filter((s) => !s.bottleimage).length;
    if (emptyCount === 0) continue;
    console.log(`[${processed}/${distilleries.length}] ${d.name} — ${emptyCount} spirits to match`);
    const r = await crawlDistillery(context, d, spirits);
    totalMatched += r.matched;
    console.log(`    → ${r.matched}/${emptyCount} matched (${r.candidates} candidate pages)\n`);
  }

  await browser.close();
  await prisma.$disconnect();
  console.log(`\nDone. ${totalMatched} bottle images matched across ${processed} distilleries.`);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
