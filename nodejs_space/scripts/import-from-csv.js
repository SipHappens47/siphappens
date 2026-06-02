// Replaces the spirit + distillery tables with the original Abacus CSV exports.
// Preserves original UUIDs and FK relationships.
// Run: node --env-file=.env scripts/import-from-csv.js <distilleries.csv> <spirits.csv>
const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const trim = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};
const toBool = (v) => {
  const s = trim(v);
  if (s == null) return false;
  return /^(true|t|1|yes)$/i.test(s);
};
const toNum = (v) => {
  const s = trim(v);
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const toInt = (v) => {
  const n = toNum(v);
  return n == null ? 0 : Math.trunc(n);
};
const toDate = (v) => {
  const s = trim(v);
  if (s == null) return new Date();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

function parseCsv(path) {
  const text = fs.readFileSync(path, 'utf-8');
  const r = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (r.errors && r.errors.length) {
    console.warn(`  ${r.errors.length} CSV parse warnings in ${path}`);
  }
  return r.data;
}

async function main() {
  const distFile = process.argv[2];
  const spiritFile = process.argv[3];
  if (!distFile || !spiritFile) {
    console.error(
      'Usage: node --env-file=.env scripts/import-from-csv.js <distilleries.csv> <spirits.csv>',
    );
    process.exit(1);
  }

  console.log('Wiping current spirit + distillery tables...');
  // Spirit has FK to distillery (cascade), so delete spirits first.
  const sDel = await prisma.spirit.deleteMany();
  const dDel = await prisma.distillery.deleteMany();
  console.log(`  Removed ${sDel.count} spirits, ${dDel.count} distilleries`);

  console.log('Loading distilleries CSV...');
  const distRows = parseCsv(distFile);
  console.log(`  ${distRows.length} distillery rows`);

  // Set owneruserid to null universally — Abacus user UUIDs don't exist in our DB.
  const distData = distRows
    .filter((r) => trim(r.id) && trim(r.name))
    .map((r) => ({
      id: trim(r.id),
      name: trim(r.name),
      country: trim(r.country),
      region: trim(r.region),
      createdat: toDate(r.createdat),
      logo: trim(r.logo),
      heroimage: trim(r.heroimage),
      bio: trim(r.bio),
      verified: toBool(r.verified),
      ispremium: toBool(r.ispremium),
      websiteurl: trim(r.websiteurl),
      latitude: toNum(r.latitude),
      longitude: toNum(r.longitude),
      followerscount: toInt(r.followerscount),
      owneruserid: null,
      spirittypes: trim(r.spirittypes),
      isclaimed: toBool(r.isclaimed),
    }));

  console.log(`  Inserting ${distData.length} distilleries...`);
  // Chunk to avoid huge single statements.
  const CHUNK = 200;
  let dIns = 0;
  for (let i = 0; i < distData.length; i += CHUNK) {
    const r = await prisma.distillery.createMany({
      data: distData.slice(i, i + CHUNK),
      skipDuplicates: true,
    });
    dIns += r.count;
  }
  console.log(`  Inserted ${dIns} distilleries`);

  console.log('Loading spirits CSV...');
  const spiritRows = parseCsv(spiritFile);
  console.log(`  ${spiritRows.length} spirit rows`);

  // Build a set of valid distillery IDs we just inserted so we can null
  // out any spirit.distilleryid that points at a missing distillery.
  const validDistIds = new Set(distData.map((d) => d.id));

  const spiritData = spiritRows
    .filter((r) => trim(r.id) && trim(r.name))
    .map((r) => {
      const did = trim(r.distilleryid);
      return {
        id: trim(r.id),
        name: trim(r.name),
        distilleryid: did && validDistIds.has(did) ? did : null,
        category: trim(r.category),
        style: trim(r.style),
        abv: toNum(r.abv),
        region: trim(r.region),
        bottleimage: trim(r.bottleimage),
        officialtastingnotes: trim(r.officialtastingnotes),
        isusercreated: toBool(r.isusercreated),
        createdat: toDate(r.createdat),
      };
    });

  const orphans = spiritData.filter((s) => s.distilleryid === null).length;
  console.log(`  Inserting ${spiritData.length} spirits (${orphans} with no distillery link)...`);
  let sIns = 0;
  for (let i = 0; i < spiritData.length; i += CHUNK) {
    const r = await prisma.spirit.createMany({
      data: spiritData.slice(i, i + CHUNK),
      skipDuplicates: true,
    });
    sIns += r.count;
  }
  console.log(`  Inserted ${sIns} spirits`);

  await prisma.$disconnect();
  console.log('\nImport complete.');
}

main().catch(async (e) => {
  console.error('Import failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
