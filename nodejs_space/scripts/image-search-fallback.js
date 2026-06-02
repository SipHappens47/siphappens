// Layered fallback image search for spirits still without bottleimage.
// Tries multiple sources in order, accepting the first reasonable hit:
//   1. Master of Malt direct search (whisky-focused retailer)
//   2. The Whisky Exchange direct search
//   3. Yandex Images (better than Bing for products)
//   4. DuckDuckGo Images (via Playwright — JS-rendered)
//
// Run: node --env-file=.env scripts/image-search-fallback.js [--limit N]
const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith('--limit'));
const LIMIT = limitArg ? parseInt(args[args.indexOf(limitArg) + 1], 10) : 99999;

function cleanSpiritName(name) {
  if (!name) return '';
  let s = name;
  s = s.replace(/^[A-Z]{2,3}\s+/, '');
  s = s.replace(/(\d+)\s?-?\s?Y[RO]\b\.?/gi, '$1 Year Old');
  s = s.replace(/(\d+)\s?-?\s?YEARS?\s?-?\s?OLD/gi, '$1 Year Old');
  s = s.replace(/\s*W\/.*$/gi, '');
  s = s.replace(/\s+WITH\s+[A-Z0-9 &]+$/gi, '');
  s = s.replace(/\bGIFT\s+(BOX|PACK|SET)\b/gi, '');
  s = s.replace(/\bGB\b/gi, '');
  s = s.replace(/\bMINI(?:\s+DISCO)?\b/gi, '');
  s = s.replace(/\bDISCO\b/gi, '');
  s = s.replace(/\b\d{4}\s+EDITION\b/gi, '');
  s = s.replace(/\b(F1|NASCAR|NFL|NBA|UFC)\s+(TEAM\s+)?EDITION\b/gi, '');
  s = s.replace(/\s+EDITION\s+#?\d+\b/gi, '');
  s = s.replace(/\b(\d+)\s?(ML|CL|L)\b\.?/gi, '');
  s = s.replace(/\b(\d+)PRF\b/gi, '');
  s = s.replace(/\bPROOF\b\s*\d*/gi, '');
  s = s.replace(/\([^)]*\)/g, ' ');
  s = s.replace(/,\s*$/, '');
  s = s.replace(/\b[A-Z]{2,}\b/g, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function makeQuery(distillery, spirit) {
  const dist = (distillery || '').trim();
  if (!dist) return spirit;
  const spiritLower = spirit.toLowerCase();
  const distFirst = dist.split(/\s+/)[0].toLowerCase();
  if (distFirst.length >= 4 && spiritLower.includes(distFirst)) {
    return spirit;
  }
  return `${dist} ${spirit}`.replace(/\s+/g, ' ').trim();
}

async function pageOgImage(page) {
  return page.evaluate(() => {
    const meta = (p) => {
      const el = document.querySelector(`meta[property="${p}"], meta[name="${p}"]`);
      return el ? el.getAttribute('content') : null;
    };
    return meta('og:image:secure_url') || meta('og:image') || meta('twitter:image');
  });
}

// --- Source 1: Master of Malt — search → click first product → og:image ---
async function tryMasterOfMalt(page, query) {
  const searchUrl = `https://www.masterofmalt.com/search.aspx?searchTerm=${encodeURIComponent(query)}`;
  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(1200);
    // Find the first link that goes to an actual product page
    const productHref = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      for (const a of links) {
        const href = a.getAttribute('href') || '';
        // MoM product pages typically have a category path then a product slug ending with .aspx
        // and live under categories like /whiskies/, /gin/, /rum/, /vodka/, etc.
        if (
          /^\/?(whiskies|whisky|whiskey|gin|rum|vodka|tequila|mezcal|brandy|cognac|liqueurs?|spirits|absinthe)\//i.test(
            href.replace(/^https?:\/\/[^/]+/, ''),
          ) &&
          !/\/(category|brand|distillery|country|region|search|filter)\//i.test(href)
        ) {
          // Skip listing pages; product pages usually end with a slug not a directory
          if (!/\/$/.test(href)) return href.startsWith('http') ? href : `https://www.masterofmalt.com${href}`;
        }
      }
      return null;
    });
    if (!productHref) return null;
    await page.goto(productHref, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(800);
    const og = await pageOgImage(page);
    if (!og) return null;
    // Reject the generic site logo / attribute_rule placeholder
    if (/attribute_rule_images|logo|placeholder/i.test(og)) return null;
    return og.startsWith('http') ? og : `https://www.masterofmalt.com${og}`;
  } catch {
    return null;
  }
}

// --- Source 2: The Whisky Exchange — search → first product → og:image ---
async function tryTheWhiskyExchange(page, query) {
  const searchUrl = `https://www.thewhiskyexchange.com/search?q=${encodeURIComponent(query)}`;
  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(1200);
    const productHref = await page.evaluate(() => {
      // TWE product cards link to /p/<id>/<slug>
      const a = document.querySelector('a.product-card[href*="/p/"]') ||
                document.querySelector('a[href*="/p/"]');
      if (!a) return null;
      const href = a.getAttribute('href') || '';
      return href.startsWith('http') ? href : `https://www.thewhiskyexchange.com${href}`;
    });
    if (!productHref) return null;
    await page.goto(productHref, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(800);
    const og = await pageOgImage(page);
    if (!og) return null;
    if (/logo|placeholder/i.test(og)) return null;
    return og.startsWith('http') ? og : `https://www.thewhiskyexchange.com${og}`;
  } catch {
    return null;
  }
}

// --- Source 3: Yandex Images ---
async function tryYandexImages(page, query) {
  const url = `https://yandex.com/images/search?text=${encodeURIComponent(query)}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    const imageUrl = await page.evaluate(() => {
      // Yandex image cards have data-bem JSON with the image url
      const cards = document.querySelectorAll('div.serp-item, div.SerpItem');
      for (const c of cards) {
        const data = c.getAttribute('data-bem');
        if (!data) continue;
        try {
          const j = JSON.parse(data);
          const url = j?.['serp-item']?.img_href || j?.['serp-item']?.preview?.[0]?.url;
          if (url && /^https?:/.test(url)) return url;
        } catch {}
      }
      // Fallback: first img in results area
      const img = document.querySelector('.serp-item img, img.MMImage-Origin');
      return img ? img.getAttribute('src') : null;
    });
    return imageUrl || null;
  } catch {
    return null;
  }
}

// --- Source 4: DuckDuckGo Images ---
async function tryDuckDuckGoImages(page, query) {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2500);
    const imageUrl = await page.evaluate(() => {
      const img = document.querySelector('img.tile--img__img, .tile--img__img img');
      if (img) {
        let src = img.getAttribute('data-src') || img.getAttribute('src');
        if (src && src.startsWith('//')) src = 'https:' + src;
        return src;
      }
      return null;
    });
    return imageUrl || null;
  } catch {
    return null;
  }
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
  console.log(`Fallback-searching ${todo.length} spirits with no image yet...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);

  const sources = [
    { name: 'MoM',    fn: tryMasterOfMalt },
    { name: 'TWE',    fn: tryTheWhiskyExchange },
    { name: 'Yandex', fn: tryYandexImages },
    { name: 'DDG',    fn: tryDuckDuckGoImages },
  ];

  let ok = 0, fail = 0, processed = 0;
  const bySource = {};
  for (const s of todo) {
    processed++;
    const clean = cleanSpiritName(s.spirit_name);
    const query = makeQuery(s.distillery_name, clean);
    let url = null, hit = null;
    for (const src of sources) {
      try {
        url = await src.fn(page, query);
      } catch {}
      if (url) { hit = src.name; break; }
    }
    if (url) {
      try {
        await prisma.spirit.update({ where: { id: s.id }, data: { bottleimage: url } });
        ok++;
        bySource[hit] = (bySource[hit] || 0) + 1;
        if (ok % 10 === 0 || processed <= 10) {
          console.log(`[${processed}/${todo.length}] ✓ ${hit.padEnd(7)} ${s.spirit_name.slice(0, 55)}  →  ${url.slice(0, 70)}`);
        }
      } catch (e) {
        fail++;
      }
    } else {
      fail++;
      if (processed <= 10 || processed % 100 === 0) {
        console.log(`[${processed}/${todo.length}] ✗ all sources failed: ${s.spirit_name.slice(0, 60)}`);
      }
    }
    await page.waitForTimeout(300);
  }

  await browser.close();
  await prisma.$disconnect();
  console.log(`\nDone: ${ok} matched, ${fail} failed.`);
  console.log('By source:', bySource);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
