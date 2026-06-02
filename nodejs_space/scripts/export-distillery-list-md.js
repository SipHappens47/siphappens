// Exports all distilleries to a readable Markdown file, grouped by location.
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.distillery.findMany({
    select: { name: true, country: true, region: true, websiteurl: true },
    orderBy: { name: 'asc' },
  });

  // Group by location
  const groups = new Map();
  for (const r of rows) {
    const loc = r.country || r.region || '(no location)';
    if (!groups.has(loc)) groups.set(loc, []);
    groups.get(loc).push(r);
  }
  const sortedLocs = [...groups.keys()].sort((a, b) =>
    a === '(no location)' ? 1 : b === '(no location)' ? -1 : a.localeCompare(b),
  );

  const lines = [];
  lines.push(`# SipHappens distilleries (${rows.length} total)\n`);
  const withSite = rows.filter((r) => r.websiteurl).length;
  lines.push(`*${withSite} have websites linked / ${rows.length - withSite} without*\n`);

  for (const loc of sortedLocs) {
    const items = groups.get(loc).sort((a, b) => a.name.localeCompare(b.name));
    lines.push(`\n## ${loc} (${items.length})\n`);
    for (const d of items) {
      if (d.websiteurl) {
        lines.push(`- **${d.name}** — ${d.websiteurl}`);
      } else {
        lines.push(`- ${d.name} — —`);
      }
    }
  }

  const out = 'C:\\dev\\siphappens\\distilleries.md';
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`Wrote ${rows.length} distilleries to ${out}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
