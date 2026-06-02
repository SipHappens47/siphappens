// Fills in distillery.logo and distillery.heroimage from Yandex Images.
// For each distillery missing logo, search "<name> logo"; for each missing
// heroimage, search "<name> distillery" and take the first valid image.
//
// Run: node --env-file=.env scripts/yandex-distillery-images.js [--limit N]
const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith('--limit'));
const LIMIT = limitArg ? parseInt(args[args.indexOf(limitArg) + 1], 10) : 99999;

const BAD_DOMAIN_PARTS = [
  'wikipedia','wikimedia','flagle','map360','puzzle','tutorial','sudoku',
  'youtube','tiktok','reddit','pinterest','facebook','instagram','twitter','x.com',
  'shutterstock','getty','istockphoto','dreamstime','depositphotos','alamy',
  'recipe','foodnetwork','allrecipes','tasty','epicurious',
];
function isBadDomain(host) {
  const h = (host || '').toLowerCase();
  return BAD_DOMAIN_PARTS.some((p) => h.includes(p));
}

async function searchYandex(page, query) {
  const url = `https://yandex.com/images/search?text=${encodeURIComponent(query)}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2200);
    const candidates = await page.evaluate(() => {
      const out = [];
      const imgs = document.querySelectorAll('img.ImagesContentImage-Image');
      for (const img of imgs) {
        let src = img.getAttribute('src') || img.getAttribute('data-src');
        if (!src) continue;
        if (src.startsWith('//')) src = 'https:' + src;
        if (!/^https?:/.test(src)) continue;
        out.push({ url: src });
        if (out.length >= 10) break;
      }
      return out;
    });
    return candidates;
  } catch {
    return [];
  }
}

function pickFirstUsable(candidates) {
  for (const c of candidates) {
    try {
      const host = new URL(c.url).hostname.toLowerCase();
      if (!isBadDomain(host)) return c.url;
    } catch {}
  }
  return null;
}

async function main() {
  // All distilleries missing logo or heroimage — including renamed importer LLCs.
  const dists = await prisma.$queryRaw`
    SELECT d.id, d.name, d.logo, d.heroimage,
      (SELECT COUNT(*) FROM public.spirit s WHERE s.distilleryid = d.id) AS spirit_count
    FROM public.distillery d
    WHERE d.logo IS NULL OR d.heroimage IS NULL
    ORDER BY spirit_count DESC, d.name
  `;
  const todo = dists.slice(0, LIMIT);
  console.log(`Processing ${todo.length} distilleries (logos + heroes)...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  let processed = 0;
  let logosOk = 0, heroesOk = 0;

  for (const d of todo) {
    processed++;
    const updates = {};

    if (!d.logo) {
      const cands = await searchYandex(page, `${d.name} logo`);
      const pick = pickFirstUsable(cands);
      if (pick) { updates.logo = pick; logosOk++; }
      await page.waitForTimeout(500);
    }
    if (!d.heroimage) {
      const cands = await searchYandex(page, `${d.name} distillery`);
      const pick = pickFirstUsable(cands);
      if (pick) { updates.heroimage = pick; heroesOk++; }
      await page.waitForTimeout(500);
    }

    if (Object.keys(updates).length > 0) {
      try {
        await prisma.distillery.update({ where: { id: d.id }, data: updates });
      } catch {}
    }
    if (processed <= 10 || processed % 25 === 0) {
      console.log(`[${processed}/${todo.length}] ${d.name.padEnd(45)} logo=${updates.logo ? '✓' : (d.logo ? '·' : '✗')} hero=${updates.heroimage ? '✓' : (d.heroimage ? '·' : '✗')}`);
    }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log(`\nDone. Logos added: ${logosOk} | Heroes added: ${heroesOk}`);
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
