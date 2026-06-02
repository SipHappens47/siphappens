// For each spirit with no bottleimage:
//   1. Clean its name (strip TTB-style prefixes, normalize "12yr" -> "12 Year Old", etc.)
//   2. Image-search "{distillery} {clean name} bottle" on Bing Images via Playwright.
//   3. Grab the first decent-quality result image URL.
//   4. Save it as spirit.bottleimage.
//
// Run: node --env-file=.env scripts/image-search-spirits.js [--limit N]
const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith('--limit'));
const LIMIT = limitArg ? parseInt(args[args.indexOf(limitArg) + 1], 10) : 99999;

function cleanSpiritName(name) {
  if (!name) return '';
  let s = name;
  // Strip TTB-style 2-3 letter prefixes ("BP WHISTLEPIG...", "HA ..." etc.)
  s = s.replace(/^[A-Z]{2,3}\s+/, '');
  // Year notations: "12YR", "12YO", "12-YR", "12-YEAR-OLD" -> "12 Year Old"
  s = s.replace(/(\d+)\s?-?\s?Y[RO]\b\.?/gi, '$1 Year Old');
  s = s.replace(/(\d+)\s?-?\s?YEARS?\s?-?\s?OLD/gi, '$1 Year Old');
  // Remove packaging / SKU descriptors AFTER product name:
  s = s.replace(/\s*W\/.*$/gi, '');                 // "...W/GOLD PEN"
  s = s.replace(/\s+WITH\s+[A-Z0-9 &]+$/gi, '');    // "...WITH MIXERS"
  s = s.replace(/\bGIFT\s+(BOX|PACK|SET)\b/gi, '');
  s = s.replace(/\bGB\b/gi, '');
  s = s.replace(/\bMINI(?:\s+DISCO)?\b/gi, '');
  s = s.replace(/\bDISCO\b/gi, '');
  s = s.replace(/\b\d{4}\s+EDITION\b/gi, '');       // "2024 EDITION"
  s = s.replace(/\b(F1|NASCAR|NFL|NBA|UFC)\s+(TEAM\s+)?EDITION\b/gi, '');
  s = s.replace(/\s+EDITION\s+#?\d+\b/gi, '');      // "EDITION #5"
  // Volume markers
  s = s.replace(/\b(\d+)\s?(ML|CL|L)\b\.?/gi, '');
  s = s.replace(/\b(\d+)PRF\b/gi, '');              // "100PRF"
  s = s.replace(/\bPROOF\b\s*\d*/gi, '');
  // Parentheticals and trailing punctuation
  s = s.replace(/\([^)]*\)/g, ' ');
  s = s.replace(/,\s*$/, '');
  // Title-case ALL-CAPS words (don't touch already-mixed case)
  s = s.replace(/\b[A-Z]{2,}\b/g, (m) =>
    m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()
  );
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function buildQuery(distilleryName, cleanedSpirit) {
  // Avoid duplicating distillery name if it's already in the spirit name.
  const dist = (distilleryName || '').trim();
  if (!dist) return cleanedSpirit;
  const spiritLower = cleanedSpirit.toLowerCase();
  const distFirst = dist.split(/\s+/)[0].toLowerCase();
  if (distFirst.length >= 4 && spiritLower.includes(distFirst)) {
    return cleanedSpirit;
  }
  return `${dist} ${cleanedSpirit}`.replace(/\s+/g, ' ').trim();
}

// Domain badness markers — obvious non-spirits sources to reject outright
const BAD_DOMAIN_PARTS = [
  'wikipedia','wikimedia','flagle','tubemap','tube-map','londonmap','map360',
  'puzzle','tutorial','sudoku','gamefaqs','wordle','quordle','heardle',
  'youtube','tiktok','reddit','pinterest','facebook','instagram','twitter','x.com',
  'imdb','spotify','soundcloud','medium.com',
  'recipe','foodnetwork','allrecipes','tasty.co','epicurious',
  'shutterstock','getty','istockphoto','dreamstime','depositphotos','alamy',
  'logo','clipart','vector','clipground','cleanpng','pngegg','freepik',
  'goodreads','imdb','tripadvisor','yelp','google.com/search',
  'amazon.com/sspa','amazon.com/dp/B0','etsy.com',
];
// Positive signal — domains that are likely real spirit photos.
// Broader list of words / known retailer hosts.
const GOOD_DOMAIN_PARTS = [
  // Generic spirit-related words anywhere in hostname
  'whisky','whiskey','whiskies','spirit','spirits','liquor','liqour','bourbon',
  'rum','gin','vodka','tequila','mezcal','brandy','cognac','wine','drinks',
  'distill','dranken','alkohol','alcohol','bottle','bar.','cocktail','cellar',
  'getränke','spiritueux',
  // Known retailers / cataloging sites
  'masterofmalt','thewhiskyexchange','totalwine','klwines','reservebar','caskers',
  'drizly','minibardelivery','flaviar','astorwines','wallywine','liquorbarn',
  'thewhiskyworld','whiskybase','whisky.de','dekanta','royalmilewhiskies',
  'alko.fi','systembolaget','vinmonopolet','lcbo.com','saq.com',
  'beerwineliquor','liquorama','urbandrinks','finewineandgoodspirits',
  'marketviewliquor','warehousewines','bevmo','flaskfinewines','liquorland',
  'whiskeycaviar','seelbachs','breakingbourbon','dramnation','specsonline',
  'iowaabd','liquorstore-online','wineanthology','bottlebuzz',
  'shop.','store.','www.shop','wines','shopify','squarespace-cdn',
  // South African retailers
  'norman','tops.','vinopinto','makro','wineofthemonthclub','onestopwine',
];

function isBadDomain(host) {
  const h = host.toLowerCase();
  return BAD_DOMAIN_PARTS.some((p) => h.includes(p));
}
function isGoodDomain(host) {
  const h = host.toLowerCase();
  return GOOD_DOMAIN_PARTS.some((p) => h.includes(p));
}

async function searchBingImage(page, query, spiritTokens, distilleryToken) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(1500);
    const candidates = await page.evaluate(() => {
      const cells = document.querySelectorAll('a.iusc');
      const out = [];
      for (const c of cells) {
        const m = c.getAttribute('m');
        if (!m) continue;
        try {
          const data = JSON.parse(m);
          const url = data.murl || data.turl;
          if (!url) continue;
          if (/^(data:|javascript:)/i.test(url)) continue;
          out.push({ url, source: data.purl || '', title: (data.t || '').toLowerCase() });
          if (out.length >= 20) break;
        } catch {}
      }
      return out;
    });

    if (candidates.length === 0) return null;

    // Pass each candidate through 2 acceptance tests:
    //   A. Image TITLE must contain the distillery name (strongest signal).
    //   B. Failing that, source domain must be a known good spirits/retailer host
    //      AND title must contain ≥1 distinctive non-numeric token from the spirit name.
    // Reject bad domains in either case.
    const distilleryTok = (distilleryToken || '').toLowerCase();
    const longTokens = spiritTokens.filter((t) => t.length >= 4 && !/^\d+$/.test(t));

    // Pass A
    for (const c of candidates) {
      let host = '';
      let sourceHost = '';
      try { host = new URL(c.url).hostname; } catch { continue; }
      try { sourceHost = c.source ? new URL(c.source).hostname : ''; } catch {}
      if (isBadDomain(host) || isBadDomain(sourceHost)) continue;
      const t = (c.title || '').toLowerCase();
      if (distilleryTok && distilleryTok.length >= 4 && t.includes(distilleryTok)) {
        return { url: c.url, source: c.source, host };
      }
    }
    // Pass B
    for (const c of candidates) {
      let host = '';
      let sourceHost = '';
      try { host = new URL(c.url).hostname; } catch { continue; }
      try { sourceHost = c.source ? new URL(c.source).hostname : ''; } catch {}
      if (isBadDomain(host) || isBadDomain(sourceHost)) continue;
      if (!(isGoodDomain(host) || isGoodDomain(sourceHost))) continue;
      const t = (c.title || '').toLowerCase();
      if (longTokens.some((tok) => t.includes(tok))) {
        return { url: c.url, source: c.source, host };
      }
    }
    return null;
  } catch {
    return null;
  }
}

function tokenizeForMatch(name) {
  if (!name) return [];
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w && w.length >= 2);
}

async function main() {
  const spirits = await prisma.$queryRaw`
    SELECT s.id, s.name AS spirit_name, d.name AS distillery_name
    FROM public.spirit s
    LEFT JOIN public.distillery d ON s.distilleryid = d.id
    WHERE s.bottleimage IS NULL
    ORDER BY d.name NULLS LAST, s.name
  `;
  const todo = spirits.slice(0, LIMIT);
  console.log(`Searching ${todo.length} spirits...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);

  let ok = 0;
  let fail = 0;
  let processed = 0;
  for (const s of todo) {
    processed++;
    const clean = cleanSpiritName(s.spirit_name);
    const query = buildQuery(s.distillery_name, clean);
    const matchTokens = tokenizeForMatch(`${s.distillery_name || ''} ${clean}`);
    // Distillery's first significant word — the strongest title-match signal
    const distilleryFirstToken = ((s.distillery_name || '').toLowerCase().split(/\s+/).find((w) => w.length >= 4) || '');
    const result = await searchBingImage(page, query, matchTokens, distilleryFirstToken);
    if (result && result.url) {
      try {
        await prisma.spirit.update({
          where: { id: s.id },
          data: { bottleimage: result.url },
        });
        ok++;
        if (ok % 20 === 0 || processed <= 20) {
          console.log(`[${processed}/${todo.length}] ✓ ${s.spirit_name.slice(0, 50)}  →  ${result.url.slice(0, 80)}`);
        }
      } catch (e) {
        fail++;
      }
    } else {
      fail++;
      if (process.env.DEBUG || processed <= 20) {
        console.log(`[${processed}/${todo.length}] ✗ ${s.spirit_name.slice(0, 60)}  query="${query.slice(0, 60)}"`);
      }
    }
    // Tiny throttle: 400ms between searches
    await page.waitForTimeout(400);
  }

  await browser.close();
  await prisma.$disconnect();
  console.log(`\nDone: ${ok} matched, ${fail} failed, ${processed} processed.`);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
