// Renames every remaining ALL-CAPS distillery, regardless of spirit count.
// Same cleanName rules as the first batch.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SMALL_WORDS = new Set(['and', 'of', 'the', 'in', 'on', 'at', 'a', 'an', 'or', 'for', 'to', 'de', 'la', 'le']);

function titleCase(s) {
  if (!s) return s;
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => {
      if (i > 0 && SMALL_WORDS.has(w)) return w;
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
  s = s.replace(/\s*[\/-]?\s*CLOSED\s*$/i, '').trim();
  if (s.includes('/')) {
    const parts = s.split(/\s*\/\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      const real = parts.find((p) => !CORP_TOKEN_RE.test(p));
      s = real || parts[parts.length - 1];
    }
  }
  let prev;
  do {
    prev = s;
    s = s.replace(CORP_SUFFIX_RE, '').trim();
    s = s.replace(/[,\s]+$/, '').trim();
  } while (s !== prev);
  return titleCase(s);
}

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT id, name FROM public.distillery
    WHERE name = UPPER(name) AND name ~ '[A-Z]'
    ORDER BY name
  `;
  console.log(`Renaming ${rows.length} all-caps distilleries...`);
  let updated = 0;
  for (const d of rows) {
    const newName = cleanName(d.name);
    if (!newName || newName === d.name) continue;
    await prisma.distillery.update({ where: { id: d.id }, data: { name: newName } });
    updated++;
    if (updated % 25 === 0) console.log(`  Updated ${updated}...`);
  }
  console.log(`\nDone: ${updated} renamed.`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
