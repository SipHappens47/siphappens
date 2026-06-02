// Imports Sheet1 of Spirit Data.xlsx into Supabase via Prisma.
// Run: node --env-file=.env scripts/import-spirits-xlsx.js "<path-to-xlsx>"
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const trim = (v) => (v == null ? null : String(v).trim() || null);

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node --env-file=.env scripts/import-spirits-xlsx.js <path-to-xlsx>');
    process.exit(1);
  }

  const wb = XLSX.readFile(file);
  const ws = wb.Sheets['Sheet1'];
  if (!ws) {
    console.error('Sheet1 not found in workbook');
    process.exit(1);
  }
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  console.log(`Loaded ${rows.length} rows from Sheet1`);

  const distilleryCache = new Map(); // name -> id

  let imported = 0;
  let skippedDupes = 0;
  let skippedNoName = 0;
  let newDistilleries = 0;

  for (const row of rows) {
    const name = trim(row['Name']);
    if (!name) {
      skippedNoName++;
      continue;
    }

    const existing = await prisma.spirit.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) {
      skippedDupes++;
      continue;
    }

    const distilleryName = trim(row['Distillery']);
    const region = trim(row['Region']);
    const category = trim(row['Spirit']);
    const style = trim(row['Style']);
    const abv = row['ABV%'] == null || row['ABV%'] === '' ? null : Number(row['ABV%']);

    let distilleryId = null;
    if (distilleryName) {
      if (distilleryCache.has(distilleryName)) {
        distilleryId = distilleryCache.get(distilleryName);
      } else {
        let d = await prisma.distillery.findFirst({
          where: { name: distilleryName },
          select: { id: true },
        });
        if (!d) {
          d = await prisma.distillery.create({
            data: {
              name: distilleryName,
              country: region,
              region: region,
              isclaimed: false,
            },
            select: { id: true },
          });
          newDistilleries++;
        }
        distilleryCache.set(distilleryName, d.id);
        distilleryId = d.id;
      }
    }

    await prisma.spirit.create({
      data: {
        name,
        category,
        style,
        abv: abv != null && !Number.isNaN(abv) ? abv : null,
        region,
        // isusercreated defaults to false — curated catalog
        ...(distilleryId ? { distillery: { connect: { id: distilleryId } } } : {}),
      },
    });

    imported++;
    if (imported % 50 === 0) console.log(`  Imported ${imported}...`);
  }

  console.log('\nDone:');
  console.log(`  Spirits imported:   ${imported}`);
  console.log(`  Skipped (dupes):    ${skippedDupes}`);
  console.log(`  Skipped (no name):  ${skippedNoName}`);
  console.log(`  New distilleries:   ${newDistilleries}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Import failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
