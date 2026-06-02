// Uses Playwright (real Chromium browser) to backfill distilleries whose sites
// blocked the simple fetch (Cloudflare, JS-rendered pages, age-gates).
// Reads the same name->URL map. For each distillery still missing data, opens
// the site in headless Chromium and extracts OG metadata + apple-touch-icon.
//
// Run: node --env-file=.env scripts/backfill-with-playwright.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const map = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'distillery-domains.json'), 'utf-8'),
);
for (const k of Object.keys(map)) {
  if (k.startsWith('_')) delete map[k];
}

function absolute(url, base) {
  if (!url) return null;
  try {
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

async function extractFromPage(page) {
  return await page.evaluate(() => {
    const meta = (prop) => {
      const el = document.querySelector(
        `meta[property="${prop}"], meta[name="${prop}"]`,
      );
      return el ? el.getAttribute('content') : null;
    };
    const linkHref = (rel) => {
      const els = Array.from(document.querySelectorAll('link[rel]'));
      for (const el of els) {
        const rels = (el.getAttribute('rel') || '').toLowerCase().split(/\s+/);
        if (rels.includes(rel)) {
          return el.getAttribute('href');
        }
      }
      return null;
    };
    return {
      ogImage:
        meta('og:image:secure_url') ||
        meta('og:image') ||
        meta('twitter:image'),
      ogDescription:
        meta('og:description') ||
        meta('twitter:description') ||
        meta('description'),
      appleIcon:
        linkHref('apple-touch-icon') ||
        linkHref('apple-touch-icon-precomposed') ||
        linkHref('icon') ||
        linkHref('shortcut icon'),
    };
  });
}

function htmlDecode(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function main() {
  const entries = Object.entries(map);
  console.log(`Checking ${entries.length} distilleries for ones needing Playwright fallback...`);

  // Filter to only those still missing metadata in the DB
  const todo = [];
  for (const [name, url] of entries) {
    const d = await prisma.distillery.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true, name: true, heroimage: true, logo: true, bio: true, websiteurl: true },
    });
    if (!d) continue;
    // Skip if all three are already filled
    if (d.heroimage && d.logo && d.bio) continue;
    todo.push({ ...d, url });
  }
  console.log(`${todo.length} need a retry via Playwright.\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    timezoneId: 'Europe/London',
  });

  const tally = { ok: 0, 'no-meta': 0, 'nav-failed': 0, 'page-error': 0 };
  let processed = 0;
  for (const d of todo) {
    processed++;
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    try {
      await page.goto(d.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Brief settle for Cloudflare challenges / JS hydration
      await page.waitForTimeout(2500);
      const meta = await extractFromPage(page);

      const updates = { websiteurl: d.websiteurl || d.url };
      if (!d.heroimage && meta.ogImage)
        updates.heroimage = absolute(meta.ogImage, d.url);
      if (!d.logo)
        updates.logo = absolute(meta.appleIcon, d.url) || absolute('/favicon.ico', d.url);
      if (!d.bio && meta.ogDescription)
        updates.bio = htmlDecode(meta.ogDescription).slice(0, 500);

      const filled = ['heroimage', 'logo', 'bio'].filter((k) => updates[k] && !d[k]);
      if (filled.length === 0) {
        tally['no-meta']++;
        console.log(`  [${processed}/${todo.length}] ✗ no-meta   ${d.name}`);
      } else {
        await prisma.distillery.update({ where: { id: d.id }, data: updates });
        tally.ok++;
        console.log(`  [${processed}/${todo.length}] ✓ ${filled.join('+').padEnd(20)} ${d.name}`);
      }
    } catch (e) {
      const isNavErr = /timeout|net::|Navigation/i.test(e.message);
      tally[isNavErr ? 'nav-failed' : 'page-error']++;
      console.log(`  [${processed}/${todo.length}] ✗ ${isNavErr ? 'nav-failed' : 'page-error'} ${d.name} (${e.message.slice(0, 60)})`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  await prisma.$disconnect();

  console.log('\nPlaywright pass summary:');
  for (const [k, v] of Object.entries(tally)) console.log(`  ${k.padEnd(15)} ${v}`);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
