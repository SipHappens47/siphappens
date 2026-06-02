// Image-search spirits via Yandex Images using Playwright.
// Yandex is less aggressive about bot-blocking and tends to surface real product photos.
// For each spirit with no bottleimage, search "{distillery} {clean spirit name}"
// and accept the first image whose source isn't an obvious junk domain.
//
// Run: node --env-file=.env scripts/yandex-spirit-images.js [--limit N] [--offset N]
const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith('--limit'));
const offsetArg = args.find((a) => a.startsWith('--offset'));
const LIMIT = limitArg ? parseInt(args[args.indexOf(limitArg) + 1], 10) : 99999;
const OFFSET = offsetArg ? parseInt(args[args.indexOf(offsetArg) + 1], 10) : 0;

const BAD_DOMAIN_PARTS = [
  'wikipedia','wikimedia','flagle','tubemap','tube-map','londonmap','map360',
  'puzzle','tutorial','sudoku','gamefaqs','wordle','quordle','heardle',
  'youtube','tiktok','reddit','pinterest','facebook','instagram','twitter','x.com',
  'imdb','spotify','soundcloud','medium.com',
  'recipe','foodnetwork','allrecipes','tasty.co','epicurious',
  'shutterstock','getty','istockphoto','dreamstime','depositphotos','alamy',
  'clipart','vector','clipground','cleanpng','pngegg','freepik',
  'goodreads','imdb','tripadvisor','yelp','google.com/search',
  'interestingengineering','techspot','ixbt.com','engadget','firstderm',
  'naturadocet','rupertmuseum','spektrum','dattatreyatemple','geekrewind',
  'ageratingjuju','slideserve','windows','ontozowebshop','carroeletrico',
  'pxhere',
];
function isBadDomain(host) {
  const h = host.toLowerCase();
  return BAD_DOMAIN_PARTS.some((p) => h.includes(p));
}

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
  if (distFirst.length >= 4 && spiritLower.includes(distFirst)) return spirit;
  return `${dist} ${spirit}`.replace(/\s+/g, ' ').trim();
}

async function searchYandex(page, query) {
  const url = `https://yandex.com/images/search?text=${encodeURIComponent(query)}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    // Yandex renders result tiles with <img class="ImagesContentImage-Image">.
    // The image URLs are protocol-relative `//avatars.mds.yandex.net/i?id=...` (Yandex CDN proxy — stable).
    // Source page link is usually on the parent <a class="Link ImagesContentImage-Cover">; full
    // data-bem JSON is on an ancestor tile with class containing "ImagesContentImage-Wrapper".
    const candidates = await page.evaluate(() => {
      const out = [];
      const imgs = document.querySelectorAll('img.ImagesContentImage-Image');
      for (const img of imgs) {
        let src = img.getAttribute('src') || img.getAttribute('data-src');
        if (!src) continue;
        if (src.startsWith('//')) src = 'https:' + src;
        if (!/^https?:/.test(src)) continue;
        // Look up the tile to find the source page URL + title
        let parent = img;
        let source = '';
        let title = '';
        for (let depth = 0; depth < 8 && parent; depth++) {
          if (parent.tagName === 'A' && parent.getAttribute('href')) {
            const href = parent.getAttribute('href');
            // The image-tile anchor links to a Yandex internal viewer; the *source* page
            // is in the data-bem JSON of the wrapper. Try to find it via data-bem.
            const data = parent.getAttribute('data-bem');
            if (data) {
              try {
                const j = JSON.parse(data);
                source = j?.['serp-item']?.snippet?.url || j?.['serp-item']?.img_href || '';
                title = (j?.['serp-item']?.snippet?.title || '').toLowerCase();
                if (source) break;
              } catch {}
            }
          }
          const data = parent.getAttribute && parent.getAttribute('data-bem');
          if (data) {
            try {
              const j = JSON.parse(data);
              const item = j?.['serp-item'] || j?.['SerpItem'];
              if (item) {
                source = item.snippet?.url || item.img_href || '';
                title = (item.snippet?.title || '').toLowerCase();
                if (source) break;
              }
            } catch {}
          }
          parent = parent.parentElement;
        }
        out.push({ url: src, source, title });
        if (out.length >= 15) break;
      }
      return out;
    });
    return candidates;
  } catch {
    return [];
  }
}

function pickCandidate(candidates, queryTokens) {
  // Reject bad domains. Prefer ones where the title contains any query token (≥4 chars).
  const longTokens = queryTokens.filter((t) => t.length >= 4 && !/^\d+$/.test(t));
  const filtered = candidates.filter((c) => {
    try {
      const host = new URL(c.url).hostname.toLowerCase();
      const sourceHost = c.source ? new URL(c.source).hostname.toLowerCase() : '';
      if (isBadDomain(host) || isBadDomain(sourceHost)) return false;
      return true;
    } catch { return false; }
  });
  // Try title-token match first
  for (const c of filtered) {
    if (longTokens.some((t) => c.title.includes(t))) return c;
  }
  // Otherwise fall back to first non-bad
  return filtered[0] || null;
}

async function main() {
  const all = await prisma.$queryRaw`
    SELECT s.id, s.name AS spirit_name, d.name AS distillery_name
    FROM public.spirit s
    LEFT JOIN public.distillery d ON s.distilleryid = d.id
    WHERE s.bottleimage IS NULL
    ORDER BY d.name NULLS LAST, s.name
  `;
  const todo = all.slice(OFFSET, OFFSET + LIMIT);
  console.log(`Yandex-searching ${todo.length} spirits (offset ${OFFSET})...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  let ok = 0, fail = 0, processed = 0;
  for (const s of todo) {
    processed++;
    const clean = cleanSpiritName(s.spirit_name);
    const query = makeQuery(s.distillery_name, clean);
    const queryTokens = query.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
    const cands = await searchYandex(page, query);
    const pick = pickCandidate(cands, queryTokens);
    if (pick) {
      try {
        await prisma.spirit.update({ where: { id: s.id }, data: { bottleimage: pick.url } });
        ok++;
        if (ok <= 15 || ok % 25 === 0) {
          console.log(`[${processed}/${todo.length}] ✓ ${s.spirit_name.slice(0, 50)} → ${pick.url.slice(0, 70)}`);
        }
      } catch { fail++; }
    } else {
      fail++;
      if (processed <= 10 || processed % 100 === 0) {
        console.log(`[${processed}/${todo.length}] ✗ ${s.spirit_name.slice(0, 50)} (${cands.length} candidates)`);
      }
    }
    await page.waitForTimeout(700);
  }
  await browser.close();
  await prisma.$disconnect();
  console.log(`\nDone: ${ok} matched, ${fail} failed, ${processed} processed.`);
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
