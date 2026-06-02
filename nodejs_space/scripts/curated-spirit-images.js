// Hand-curated ~50 iconic spirits → their official product page URL.
// For each entry: fetch the product page, extract og:image, save to the matching
// spirit row in the DB (case-insensitive name match within the right distillery).
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Hand-curated: { distillery, spiritNamePattern (regex string, case-insensitive), productUrl }
const CURATED = [
  // Scotch — Speyside / Highlands
  { distillery: 'Glenfiddich',     pattern: '^Glenfiddich 12',                            url: 'https://www.glenfiddich.com/our-whiskies/12-year-old/' },
  { distillery: 'Glenfiddich',     pattern: '^Glenfiddich 15',                            url: 'https://www.glenfiddich.com/our-whiskies/15-year-old/' },
  { distillery: 'Glenfiddich',     pattern: '^Glenfiddich 18',                            url: 'https://www.glenfiddich.com/our-whiskies/18-year-old/' },
  { distillery: 'The Macallan',    pattern: 'Sherry Oak 12',                              url: 'https://www.themacallan.com/en/our-whiskies/sherry-oak/the-macallan-12-years-old' },
  { distillery: 'The Macallan',    pattern: 'Double Cask 12',                             url: 'https://www.themacallan.com/en/our-whiskies/double-cask/the-macallan-double-cask-12-years-old' },
  { distillery: 'The Macallan',    pattern: 'Sherry Oak 18',                              url: 'https://www.themacallan.com/en/our-whiskies/sherry-oak/the-macallan-18-years-old' },
  { distillery: 'The Balvenie',    pattern: 'DoubleWood 12',                              url: 'https://www.thebalvenie.com/range/doublewood-12-year-old' },
  { distillery: 'The Balvenie',    pattern: 'Caribbean Cask 14',                          url: 'https://www.thebalvenie.com/range/caribbean-cask-14-year-old' },
  { distillery: 'Aberlour',        pattern: '^Aberlour 12.*Double',                       url: 'https://www.aberlour.com/en/whisky/aberlour-12-year-old-double-cask-matured/' },
  { distillery: 'Aberlour',        pattern: "A.bunadh",                                   url: 'https://www.aberlour.com/en/whisky/aberlour-abunadh/' },
  { distillery: 'Glendronach',     pattern: '12 Year.*Original',                          url: 'https://www.glendronachdistillery.com/the-glendronach-original-aged-12-years' },
  { distillery: 'Glendronach',     pattern: '18 Year.*Allardice',                         url: 'https://www.glendronachdistillery.com/the-glendronach-allardice-aged-18-years' },
  { distillery: 'Highland Park',   pattern: 'Highland Park 12',                           url: 'https://www.highlandparkwhisky.com/our-whisky/highland-park-12-year-old-viking-honour' },
  { distillery: 'Highland Park',   pattern: 'Highland Park 18',                           url: 'https://www.highlandparkwhisky.com/our-whisky/highland-park-18-year-old-viking-pride' },
  { distillery: 'The Dalmore',     pattern: 'Dalmore 12',                                 url: 'https://www.thedalmore.com/our-whisky/the-dalmore-12-year-old' },
  // Scotch — Islay
  { distillery: 'Bowmore',         pattern: 'Bowmore 12',                                 url: 'https://www.bowmore.com/our-whisky/bowmore-12-year-old' },
  { distillery: 'Bowmore',         pattern: 'Bowmore 15',                                 url: 'https://www.bowmore.com/our-whisky/bowmore-15-year-old' },
  { distillery: 'Bruichladdich',   pattern: 'Classic Laddie',                             url: 'https://www.bruichladdich.com/our-whisky/the-classic-laddie-scottish-barley' },
  { distillery: 'Lagavulin',       pattern: 'Lagavulin 16',                               url: 'https://www.malts.com/en-row/our-whisky-collection/lagavulin/lagavulin-16-year-old' },
  // Scotch — Skye / Campbeltown / Arran
  { distillery: 'Talisker',        pattern: 'Talisker 10',                                url: 'https://www.malts.com/en-row/our-whisky-collection/talisker/talisker-10-year-old' },
  { distillery: 'Springbank',      pattern: 'Springbank 10',                              url: 'https://www.springbank.scot/our-whiskies/springbank-10/' },
  { distillery: 'Arran',           pattern: 'Arran 10',                                   url: 'https://www.arranwhisky.com/range/arran-10/' },
  { distillery: 'Glen Scotia',     pattern: 'Double Cask',                                url: 'https://www.glenscotia.com/glen-scotia-double-cask-rum-finish/' },
  // Japanese
  { distillery: 'Hibiki',          pattern: 'Japanese Harmony',                           url: 'https://www.suntory.com/whisky/hibiki/products/jh.html' },
  { distillery: 'Yamazaki',        pattern: 'Yamazaki 12',                                url: 'https://www.suntory.com/whisky/yamazaki/products/y12.html' },
  { distillery: 'Kavalan',         pattern: 'Kavalan Classic',                            url: 'https://www.kavalanwhisky.com/en/products/classic-single-malt' },
  // Bourbon / American
  { distillery: 'Four Roses',      pattern: 'Yellow Label',                               url: 'https://fourrosesbourbon.com/bourbon/four-roses-yellow-label/' },
  { distillery: 'Four Roses',      pattern: 'Small Batch Select',                         url: 'https://fourrosesbourbon.com/bourbon/four-roses-small-batch-select/' },
  { distillery: "Michter’s",       pattern: 'US.*1 Bourbon',                              url: 'https://michters.com/whiskey/us-1-bourbon/' },
  { distillery: "Michter’s",       pattern: '10 Year Bourbon',                            url: 'https://michters.com/whiskey/10-year-bourbon/' },
  { distillery: 'Hudson',          pattern: 'Baby Bourbon',                               url: 'https://www.hudsonwhiskey.com/our-whiskeys/baby-bourbon/' },
  { distillery: 'Westland',        pattern: 'American Single Malt',                       url: 'https://www.westlanddistillery.com/our-whiskey/american-single-malt/' },
  // Tequila / Mezcal
  { distillery: 'Patrón',          pattern: 'Patrón Silver',                              url: 'https://www.patrontequila.com/our-products/patron-silver.html' },
  { distillery: 'Patrón',          pattern: 'Patrón Reposado',                            url: 'https://www.patrontequila.com/our-products/patron-reposado.html' },
  { distillery: 'Patrón',          pattern: 'Patrón Añejo',                               url: 'https://www.patrontequila.com/our-products/patron-anejo.html' },
  { distillery: 'Clase Azul',      pattern: 'Clase Azul Reposado',                        url: 'https://www.claseazul.com/en/products/clase-azul-reposado' },
  { distillery: 'Fortaleza',       pattern: 'Fortaleza Blanco',                           url: 'https://www.tequilafortaleza.com/products/blanco' },
  // Rum
  { distillery: 'Appleton Estate', pattern: 'Signature',                                  url: 'https://www.appletonestate.com/our-rums/signature' },
  { distillery: 'Mount Gay',       pattern: 'Mount Gay XO',                               url: 'https://www.mountgayrum.com/rums/xo/' },
  { distillery: 'Foursquare',      pattern: 'Probitas',                                   url: 'https://foursquarerumdistillery.com/probitas-white-blended-rum/' },
  { distillery: 'El Dorado',       pattern: '12 Year',                                    url: 'https://www.theeldoradorum.com/our-rums/12-year-old/' },
  { distillery: 'Zacapa',          pattern: 'Zacapa 23',                                  url: 'https://www.zacaparum.com/en-us/our-rums/zacapa-23.html' },
  // Gin
  { distillery: "Hendrick's Gin",  pattern: 'Original Gin',                               url: 'https://www.hendricksgin.com/our-gins/hendricks-original/' },
  { distillery: 'Tanqueray',       pattern: 'London Dry',                                 url: 'https://www.tanqueray.com/en-us/our-gins/london-dry/' },
  { distillery: 'The Botanist',    pattern: 'Islay Dry Gin',                              url: 'https://www.thebotanist.com/the-botanist-islay-dry-gin/' },
  { distillery: 'Sipsmith',        pattern: 'London Dry',                                 url: 'https://www.sipsmith.com/our-spirits/london-dry-gin/' },
  // SA
  { distillery: 'James Sedgwick',  pattern: 'Three Ships 5 Year',                         url: 'https://www.threeshipswhisky.com/whisky/5-year-old/' },
  { distillery: 'James Sedgwick',  pattern: 'Bain.*Cape Mountain',                        url: 'https://www.bainswhisky.com/' },
  { distillery: 'KWV',             pattern: 'KWV 10',                                     url: 'https://www.kwv.co.za/brandy/kwv-10-year-old/' },
  { distillery: 'Inverroche',      pattern: 'Verdant',                                    url: 'https://www.inverroche.com/products/inverroche-gin-verdant' },
  // Liqueur
  { distillery: 'Cointreau',       pattern: '^Cointreau$',                                url: 'https://www.cointreau.com/us/en/the-original/cointreau-orange-liqueur.html' },
  { distillery: 'Drambuie',        pattern: 'Original',                                   url: 'https://www.drambuie.com/en-us/our-whisky/drambuie-original' },
];

async function fetchOgImage(url) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    if (!r.ok) return { error: `HTTP ${r.status}`, finalUrl: r.url };
    const html = await r.text();
    const m =
      html.match(/<meta\s+property=["']og:image(?::secure_url)?["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image[^"']*["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (!m) return { error: 'no og:image', finalUrl: r.url };
    let img = m[1];
    if (img.startsWith('//')) img = 'https:' + img;
    else if (img.startsWith('/')) img = new URL(img, r.url).href;
    return { url: img, finalUrl: r.url };
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  console.log(`Curating ${CURATED.length} iconic spirits...\n`);
  let ok = 0, fail = 0;
  for (const c of CURATED) {
    const spirits = await prisma.$queryRawUnsafe(
      `SELECT s.id, s.name FROM public.spirit s
       JOIN public.distillery d ON s.distilleryid = d.id
       WHERE LOWER(d.name) = LOWER($1) AND s.name ~* $2 AND s.bottleimage IS NULL`,
      c.distillery, c.pattern,
    );
    if (spirits.length === 0) {
      console.log(`  ✗ no match for distillery="${c.distillery}" pattern="${c.pattern}"`);
      fail++;
      continue;
    }
    const r = await fetchOgImage(c.url);
    if (r.error) {
      console.log(`  ✗ ${c.distillery} / ${c.pattern}  →  ${r.error}`);
      fail++;
      continue;
    }
    for (const s of spirits) {
      await prisma.spirit.update({ where: { id: s.id }, data: { bottleimage: r.url } });
    }
    ok++;
    console.log(`  ✓ ${spirits[0].name.padEnd(50)} ${r.url.slice(0, 80)}`);
    // tiny pause to be polite
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log(`\nDone: ${ok} curated, ${fail} failed.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
