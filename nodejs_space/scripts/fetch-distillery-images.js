// Fetches a hero image for each distillery from Wikipedia.
// Strategy: search Wikipedia for "{name} distillery" (then fallback to "{name}"),
// validate the result is about a spirits producer (filter by description),
// and use the page's thumbnail URL as the heroimage.
// Skips distilleries that already have a heroimage.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SPIRIT_KEYWORDS = [
  'distillery','distiller','distilling','distilled',
  'whisky','whiskey','bourbon','rye','scotch',
  'rum','rhum','vodka','gin','tequila','mezcal',
  'brandy','cognac','armagnac','liqueur','liquor',
  'spirits','spirit','pisco','cachaça','cachaca','aquavit','akvavit',
  'cordial','schnapps','amaro','amaretto','sambuca','genever','jenever',
  'absinthe','pastis','grappa','bitters',
];

const SPIRIT_RE = new RegExp(`\\b(${SPIRIT_KEYWORDS.join('|')})\\b`, 'i');

const UA = 'SipHappens-CatalogBackfill/1.0 (dev)';

async function wikipediaSearch(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=3&search=${encodeURIComponent(query)}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) return [];
  const data = await r.json();
  // opensearch returns [query, [titles], [descriptions], [urls]]
  const titles = data[1] || [];
  const descs = data[2] || [];
  return titles.map((t, i) => ({ title: t, desc: descs[i] || '' }));
}

async function wikipediaSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) return null;
  return r.json();
}

function looksLikeSpiritsTopic({ title = '', desc = '' }, summary) {
  const blob = `${title} ${desc} ${summary?.description || ''} ${summary?.extract || ''}`;
  return SPIRIT_RE.test(blob);
}

async function findHeroImage(name) {
  // Try with " distillery" suffix first, then bare name.
  const queries = [
    `${name} distillery`,
    name.toLowerCase().endsWith('distillery') ? null : `${name} whisky`,
    `${name}`,
  ].filter(Boolean);

  for (const q of queries) {
    const results = await wikipediaSearch(q);
    for (const r of results) {
      const summary = await wikipediaSummary(r.title);
      if (!summary || summary.type === 'disambiguation') continue;
      if (!looksLikeSpiritsTopic(r, summary)) continue;
      const url = summary?.originalimage?.source || summary?.thumbnail?.source;
      if (url) return { url, sourceTitle: r.title };
    }
  }
  return null;
}

async function main() {
  const all = await prisma.distillery.findMany({
    where: { heroimage: null },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  console.log(`${all.length} distilleries to look up.\n`);

  let hits = 0;
  let misses = 0;
  let processed = 0;
  for (const d of all) {
    processed++;
    try {
      const result = await findHeroImage(d.name);
      if (result) {
        await prisma.distillery.update({
          where: { id: d.id },
          data: { heroimage: result.url },
        });
        hits++;
        if (hits % 10 === 0) {
          console.log(`  [${processed}/${all.length}] HIT: ${d.name} ← ${result.sourceTitle}`);
        }
      } else {
        misses++;
      }
    } catch (e) {
      misses++;
      // Don't log every error - Wikipedia returns 404s for unknown pages, expected
    }
    // Tiny throttle to be polite to Wikipedia
    if (processed % 50 === 0) {
      console.log(`Progress: ${processed}/${all.length} (${hits} hits, ${misses} misses)`);
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`\nDone:`);
  console.log(`  Processed:    ${processed}`);
  console.log(`  Hero images:  ${hits}`);
  console.log(`  No match:     ${misses}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
