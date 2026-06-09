// Normalize the remaining messy/ALL-CAPS category labels to the canonical set.
// Category only — names are left untouched.
//
// Dry run (default):  node --env-file=.env scripts/fix-categories.js
// Apply:              node --env-file=.env scripts/fix-categories.js --apply
const { PrismaClient } = require('@prisma/client');
const { categorize } = require('./fix-temp-specialty');
const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const CANONICAL = ['Whiskey','Vodka','Rum','Gin','Tequila','Mezcal','Brandy','Liqueur','Pisco','Aquavit','Cachaça'];

// Category labels that map cleanly to one canonical category.
const CLEAR_MAP = {
  'CANADIAN WHISKIES': 'Whiskey', 'BLENDED WHISKIES': 'Whiskey', 'IRISH WHISKIES': 'Whiskey',
  'TENNESSEE WHISKIES': 'Whiskey', 'CORN WHISKIES': 'Whiskey',
  'IMPORTED BRANDIES': 'Brandy', 'AMERICAN BRANDIES': 'Brandy',
  'AMERICAN SCHNAPPS': 'Liqueur', 'GIN': 'Gin', 'LIQUEUR\r\n': 'Liqueur', 'LIQUEUR': 'Liqueur',
};
// Fallback when a row in a mixed bucket can't be categorized by its name.
const BUCKET_FALLBACK = {
  'NEUTRAL GRAIN SPIRITS FLAVORED': 'Vodka',
  'COCKTAILS/RTD': 'Liqueur',
};

async function main() {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, name, category FROM public.spirit WHERE category <> ALL($1::text[])`,
    CANONICAL,
  );
  const counts = {};
  const unmatched = [];
  const plan = [];
  for (const r of rows) {
    const newCat = categorize(r.name) || CLEAR_MAP[r.category] || BUCKET_FALLBACK[r.category] || null;
    counts[newCat || '∅ UNMATCHED'] = (counts[newCat || '∅ UNMATCHED'] || 0) + 1;
    if (!newCat) unmatched.push(`${r.category}  |  ${r.name}`);
    if (newCat && newCat !== r.category) plan.push({ id: r.id, name: r.name, oldCat: r.category, newCat });
  }
  console.log(`Rows in messy categories: ${rows.length}`);
  console.log('Proposed category result:');
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(16)} ${v}`);
  console.log('\nSample:');
  for (const p of plan.slice(0, 25)) console.log(`  ${p.oldCat.padEnd(34)} -> ${p.newCat.padEnd(8)}  ${p.name.slice(0, 45)}`);
  if (unmatched.length) {
    console.log(`\n⚠ ${unmatched.length} unmatched (left as-is):`);
    for (const u of unmatched) console.log(`   ${u}`);
  }
  if (!APPLY) { console.log('\n(dry run — nothing written.)'); await prisma.$disconnect(); return; }

  let updated = 0;
  for (const p of plan) { await prisma.spirit.update({ where: { id: p.id }, data: { category: p.newCat } }); updated++; }
  console.log(`\n✅ Applied: ${updated} category updates.`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
