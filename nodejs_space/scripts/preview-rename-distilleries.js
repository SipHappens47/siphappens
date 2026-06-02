// Previews rename of ALL-CAPS importer-style distillery names (no country, no region, no spirits).
// Does NOT modify the DB. Run: node --env-file=.env scripts/preview-rename-distilleries.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

const SMALL_WORDS = new Set(['and', 'of', 'the', 'in', 'on', 'at', 'a', 'an', 'or', 'for', 'to', 'de', 'la', 'le']);

function titleCase(s) {
  if (!s) return s;
  // Lowercase then capitalize words, keeping small connector words lowercase except at the start.
  const words = s.toLowerCase().split(/\s+/);
  return words
    .map((w, i) => {
      if (i > 0 && SMALL_WORDS.has(w)) return w;
      // Handle apostrophes: "o'brien" -> "O'Brien" only if cap follows the apostrophe initially; keep simple.
      // Don't capitalize letters that come right after a digit (so "10th" stays "10th").
      return w.replace(/(^|[^a-z'0-9])([a-z])/gi, (_m, p1, p2) => p1 + p2.toUpperCase());
    })
    .join(' ');
}

const CORP_SUFFIX_RE =
  /(\s*[,\s]\s*(LLC|L\.L\.C\.?|LP|LTD|LIMITED|INC\.?|INCORPORATED|CORP\.?|CORPORATION|CO\.?|COMPANY|HOLDINGS|ENTERPRISES|GROUP|TRADING|IMPORTS|DISTRIBUTORS)\.?)+$/gi;

const CORP_TOKEN_RE =
  /\b(LLC|L\.L\.C\.?|INC\.?|INCORPORATED|CORP\.?|CORPORATION|HOLDINGS|ENTERPRISES|GROUP|IMPORTS|DISTRIBUTORS|TRADING)\b/i;

function cleanName(name) {
  if (!name) return name;
  let s = name.trim();
  // Strip trailing CLOSED markers
  s = s.replace(/\s*[\/-]?\s*CLOSED\s*$/i, '').trim();
  // If contains "/" split and prefer the part that does NOT look like a holding co.
  if (s.includes('/')) {
    const parts = s
      .split(/\s*\/\s*/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      const real = parts.find((p) => !CORP_TOKEN_RE.test(p));
      s = real || parts[parts.length - 1];
    }
  }
  // Strip trailing corporate suffixes (may be nested)
  let prev;
  do {
    prev = s;
    s = s.replace(CORP_SUFFIX_RE, '').trim();
    s = s.replace(/[,\s]+$/, '').trim();
  } while (s !== prev);
  return titleCase(s);
}

async function main() {
  const all = await prisma.distillery.findMany({
    where: {
      country: null,
      region: null,
      spirits: { none: {} },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${all.length} candidates (no country, no region, no spirits).\n`);
  const rows = all.map((d) => ({ id: d.id, old: d.name, new: cleanName(d.name) }));

  // Write full list to a file for review
  const out = 'C:\\dev\\siphappens\\distillery-rename-preview.txt';
  const lines = rows.map((r) => `${r.old}  →  ${r.new}`);
  fs.writeFileSync(out, lines.join('\n') + '\n');
  console.log(`Full preview written to: ${out}`);

  // Print first 30 and last 10 as a sample
  console.log('\n--- First 30 ---');
  for (const r of rows.slice(0, 30)) console.log(`${r.old}  →  ${r.new}`);
  console.log('\n--- Last 10 ---');
  for (const r of rows.slice(-10)) console.log(`${r.old}  →  ${r.new}`);

  // Detect any that became empty or unchanged
  const empties = rows.filter((r) => !r.new || r.new.trim() === '');
  const unchanged = rows.filter((r) => r.new === r.old);
  console.log(`\nEmpty new names: ${empties.length}`);
  console.log(`Unchanged (already cased OK): ${unchanged.length}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
