// Exports all distilleries to a CSV with name, website, location, etc.
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  const rows = await prisma.distillery.findMany({
    select: {
      name: true,
      country: true,
      region: true,
      websiteurl: true,
      logo: true,
      heroimage: true,
      bio: true,
    },
    orderBy: [{ region: 'asc' }, { name: 'asc' }],
  });

  const header = ['name', 'location', 'website', 'has_logo', 'has_hero', 'has_bio', 'bio'];
  const lines = [header.join(',')];
  for (const r of rows) {
    const location = r.country || r.region || '';
    lines.push([
      csvEscape(r.name),
      csvEscape(location),
      csvEscape(r.websiteurl || ''),
      r.logo ? 'Y' : '',
      r.heroimage ? 'Y' : '',
      r.bio ? 'Y' : '',
      csvEscape(r.bio || ''),
    ].join(','));
  }

  const out = 'C:\\dev\\siphappens\\distilleries.csv';
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`Wrote ${rows.length} distilleries to ${out}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
