// Clean up spirits stuck in category "TEMPORARY & SPECIALTY PACKAGES":
//  - strip packaging junk from the name (W/... clauses, VAP, MINI, gift/variety
//    packs, sizes), expand "10YR" -> "10 Year Old", Title-case the result
//  - set `category` from the category word in the name, or from the brand
//
// Dry run (default): prints proposed changes + a summary, writes nothing.
// Apply:  node --env-file=.env scripts/fix-temp-specialty.js --apply
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

// Tokens to keep upper-cased after title-casing.
const KEEP_UPPER = new Set([
  'XO','VS','VSOP','VSOP','BIB','PB','VR','OSR','NV','BRT','F1','NFL','NBA','UFC','US','EOY','IPA','RTD',
]);
function titleCase(s) {
  return s.toLowerCase().split(/\s+/).filter(Boolean).map((w) => {
    const u = w.replace(/[^a-z0-9]/gi, '').toUpperCase();
    if (KEEP_UPPER.has(u)) return w.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

function cleanName(raw) {
  let s = ' ' + raw.toUpperCase().trim() + ' ';
  s = s.replace(/^\s*(BP|HA)\s+/, ' ');                 // buyer prefixes
  s = s.replace(/[-,]?\s*USE CODE.*$/, ' ');            // "... USE CODE 12345"
  s = s.replace(/\bWRONG CODE\b/g, ' ');
  s = s.replace(/\sW\/.*$/, ' ');                       // " W/ glasses"
  s = s.replace(/\sWITH\s.*$/, ' ');                    // " WITH glasses"
  s = s.replace(/\sW\s.*$/, ' ');                       // " W glasses"
  s = s.replace(/\b(\d+)\s?-?\s?Y[RO]\b/g, ' $1 Year Old ');
  s = s.replace(/\b(\d+)\s?YEARS?\b/g, ' $1 Year Old ');
  const junk = [
    /\bVAP\b/g, /\bGIFT (BOX|SET|PACK|TUBE|TIN)\b/g, /\bGIFT\b/g,
    /\bHOLIDAY\b/g, /\bCOCKTAIL (KIT|CADDY|COLLECTION|SYRUP)\b/g,
    /\bVARIETY( PARTY YARD)? PACK\b/g, /\bPARTY (BUCKET|PACK|YARD PACK)\b/g,
    /\b(TRI|TRIO|DUO|COMBO|TRINITY|SAMPLE|SAMPLER|TASTING|DISCOVERY|GLASS|SPLIT|MULTI)\s?-?\s?(PACK|COLLECTION|SET)?\b/g,
    /\bMINIS?\b/g, /\b\d+\s?PK\b/g, /\b\d+ ?PACK\b/g, /\b\d+ ?BOTTLE( GIFT)?( PACK)?\b/g,
    /\bADVENT CALENDAR\b/g, /\bCOUNTDOWN CALENDAR\b/g, /\bCALENDAR\b/g,
    /\b(SEQUIN )?SLEEVE\b/g, /\bCOMMEMORATIVE( WRAP)?\b/g, /\bWRAP\b/g,
    /\bLTO\b/g, /\bEOY\b/g, /\bNP\b/g, /\bTUMBLER\b/g, /\bTIN\b/g, /\bCROCK\b/g,
    /\bEDITION\b/g, /\bGB\b/g, /\bSPECIAL (PACK|EDITION)\b/g, /\bLIMITED EDITION\b/g,
    /\b20\d{2}\b/g,
  ];
  for (const r of junk) s = s.replace(r, ' ');
  s = s.replace(/\b\d+(\.\d+)?\s?(ML|OZ|PRF|PF|PROOF)\b/g, ' ');
  s = s.replace(/\b\d+(\.\d+)?\s?L\b/g, ' ');
  s = s.replace(/\b\d+X\s?\d+(ML|L)?\b/g, ' ');
  s = s.replace(/\bPET\b/g, ' ');
  s = s.replace(/\s{2,}/g, ' ').trim();
  s = s.replace(/[\s,&\/:\-]+$/, '').trim();
  return s;
}

// Brand-specific overrides (win over the category-word check below).
const EXCEPTIONS = [
  [/TEQUILA ROSE/, 'Liqueur'], [/RUMCHATA/, 'Liqueur'], [/SHANKYS WHIP/, 'Liqueur'],
  [/BARENJAGER/, 'Liqueur'], [/CAROLANS/, 'Liqueur'], [/BAILEYS/, 'Liqueur'],
  [/DISARONNO/, 'Liqueur'], [/FRANGELICO/, 'Liqueur'], [/GRAND MARNIER/, 'Liqueur'],
  [/LICOR 43/, 'Liqueur'], [/\bAMARO\b|MONTENEGRO|SELECT APERITIVO/, 'Liqueur'],
  [/APEROL/, 'Liqueur'], [/CAMPARI/, 'Liqueur'], [/JAGERMEISTER/, 'Liqueur'],
  [/HYPNOTIQ/, 'Liqueur'], [/MOZART/, 'Liqueur'], [/ST\.? GERMAIN/, 'Liqueur'],
  [/KINKY/, 'Liqueur'], [/DEKUYPER/, 'Liqueur'], [/DR\.? ?MCGILLICUDDY/, 'Liqueur'],
  [/SAMBUCA/, 'Liqueur'], [/CARAVELLA|LIMONCELLO/, 'Liqueur'], [/TIRAMISU/, 'Liqueur'],
  [/MIDNIGHT MOON.*(MOONSHAKE|SIPPIN|NOG|COOKIES|CREAM)/, 'Liqueur'],
  [/SUGARLANDS.*(SIPPIN|CREAM|LATTE)/, 'Liqueur'],
  [/RUMHAVEN/, 'Rum'], [/MALIBU/, 'Rum'], [/KRAKEN/, 'Rum'], [/BUMBU/, 'Rum'],
  [/ZAYA/, 'Rum'], [/DIPLOMATICO/, 'Rum'], [/BLUE CHAIR BAY/, 'Rum'], [/SANTA TERESA/, 'Rum'],
  [/BARTENDERS TRADING|ON THE ROCKS|WHITE NEGRONI/, 'Liqueur'],
  [/MCQUEEN AND THE VIOLET FOG/, 'Gin'],
  [/EL JOLGORIO|CASAMIGOS MEZCAL/, 'Mezcal'],
  [/CARPANO/, 'Liqueur'],
  [/CASA NOBLE|\bJUAREZ\b/, 'Tequila'],
];

// Brand -> category, for names with no explicit category word.
const BRANDS = [
  // Vodka
  [/ABSOLUT|BELVEDERE|CIROC|CRYSTAL HEAD|DEEP EDDY|GREY GOOSE|HAKU|KETEL ONE|PINNACLE|PLATINUM 7X|RUSSIAN STANDARD|SKYY|SMIRNOFF|SOBIESKI|SVEDKA|TITOS|WESTERN SON|WILD ROOTS|FRANKLY ORGANIC|BLOOD SWEAT TEARS|\b360\b|BURNETTS|VAN GOGH|JEWEL OF RUSSIA|\bFIREFLY\b/, 'Vodka'],
  // Tequila
  [/\b1800\b|AVION|CAZADORES|CODIGO|CORRALEJO|DON JULIO|ESPOLON|CAMARENA|FLECHA AZUL|HORNITOS|\bJAJA\b|MI CAMPO|MILAGRO|NUMBER JUAN|PATRON|\bSANTO\b|TARANTULA|TEREMANA|TRES GENERACIONES|CASA DRAGONES|CASAMIGOS/, 'Tequila'],
  // Mezcal
  [/DEL MAGUEY|DOS HOMBRES|MONTELOBOS/, 'Mezcal'],
  // Rum
  [/BACARDI|CAPTAIN MORGAN|HUSSONGS/, 'Rum'],
  // Gin
  [/BOMBAY SAPPHIRE|DEATHS DOOR|MALFY|MONKEY 47/, 'Gin'],
  // Brandy / Cognac
  [/HENNESSY|MARTELL|TORRES|DERINGER/, 'Brandy'],
  // Whiskey (scotch / bourbon / rye / irish / canadian / japanese / moonshine)
  [/1792|ABERFELDY|ALBERTA PREMIUM|ANCNOC|ANGELS ENVY|ARDBEG|BAD SWEATER|BALCONES|BALLANTINES|BALVENIE|BARRELL|BIRD DOG|BLACKENED|BUCHANANS|BUFFALO TRACE|BULLEIT|BUSHMILLS|BUZZARDS ROOST|CANADIAN CLUB|CEDAR RIDGE|CHIVAS|CLYDE MAYS|CROWN ROYAL|DALMORE|DARK ARTS|DEVILS RIVER|DEWARS|DOC HOLLIDAY|ELIJAH CRAIG|EZRA BROOKS|FARMSTOCK|FIREBALL|FORTY CREEK|FOX AND ODEN|GEORGE DICKEL|GLEN MORAY|GLENFIDDICH|GLENLIVET|GLENMORANGIE|GREEN FROG|HEAVEN HILL|HIGH WEST|JAMESON|JEFFERSON|JIM BEAM|JOHNNIE WALKER|WISERS|KNOB CREEK|LAPHROAIG|LARCENY|LONGBRANCH|LOT NO|LUX ROW|MAKERS MARK|MASTERSONS|MIDDLE WEST|MIDLETON|MIDNIGHT MOON|OLD ELK|OLD FORESTER|OLD GRAND DAD|OLE SMOKY|PEERLESS|PENDLETON|PENELOPE|PIGGYBACK|PROPER NO|QUINTESSENTIAL|RABBIT HOLE|REDBREAST|REDNECK RIVIERA|REDWOOD EMPIRE|REVEL STOKE|SKREWBALL|SLIPKNOT|SMOOTH AMBLER|SPEYBURN|SUGARLANDS|SUNTORY|TEELING|TEMPLETON|PEACEKEEPER|TOKI|TOWN BRANCH|TULLAMORE|VERY OLD BARTON|WELLER|WHISTLEPIG|WILD TURKEY|WINDSOR CANADIAN|WOODFORD RESERVE|WRITERS TEARS|YELLOW ROSE|YELLOWSTONE|BOURBON TIME|STUMPYS/, 'Whiskey'],
  [/^99 |\b99 BRAND\b/, 'Liqueur'],
  [/KOVAL GIN/, 'Gin'],
];

function categorize(raw) {
  const n = raw.toUpperCase();
  for (const [re, cat] of EXCEPTIONS) if (re.test(n)) return cat;
  // explicit category words (word-boundary so "oriGINal" doesn't match GIN)
  if (/\bMEZCAL\b/.test(n)) return 'Mezcal';
  if (/\bTEQUILA\b/.test(n)) return 'Tequila';
  if (/\bBOURBON\b|\bRYE\b|\bSCOTCH\b|\bWHISK(E)?Y\b|SINGLE MALT|\bMOONSHINE\b|CORN WHISKEY/.test(n)) return 'Whiskey';
  if (/IRISH CREAM/.test(n)) return 'Liqueur';
  if (/\bVODKA\b/.test(n)) return 'Vodka';
  if (/\bGIN\b/.test(n)) return 'Gin';
  if (/\bRUM\b/.test(n)) return 'Rum';
  if (/\bCOGNAC\b|\bBRANDY\b|KIRSCHWASSER|\bGRAPPA\b|\bARMAGNAC\b|\bCALVADOS\b/.test(n)) return 'Brandy';
  if (/\bLIQUEUR\b|\bLIQUORE\b|\bLIQ\b|SCHNAPPS|AMARETTO|TRIPLE SEC|APERITIVO|PISCO|CACHACA|AQUAVIT/.test(n)) {
    if (/PISCO/.test(n)) return 'Pisco';
    if (/CACHACA/.test(n)) return 'Cachaça';
    if (/AQUAVIT/.test(n)) return 'Aquavit';
    return 'Liqueur';
  }
  for (const [re, cat] of BRANDS) if (re.test(n)) return cat;
  return null; // unmatched -> manual review
}

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT id, name FROM public.spirit
    WHERE category = 'TEMPORARY & SPECIALTY PACKAGES' ORDER BY name`;
  const counts = {};
  const unmatched = [];
  const plan = [];
  for (const r of rows) {
    const newName = titleCase(cleanName(r.name)) || r.name;
    const cat = categorize(r.name);
    counts[cat || '∅ UNMATCHED'] = (counts[cat || '∅ UNMATCHED'] || 0) + 1;
    if (!cat) unmatched.push(r.name);
    plan.push({ id: r.id, oldName: r.name, newName, cat });
  }

  console.log(`Total in bucket: ${rows.length}\n`);
  console.log('By proposed category:');
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(16)} ${v}`);
  console.log('\nSample of name changes:');
  for (const p of plan.slice(0, 45)) console.log(`  [${(p.cat || '???').padEnd(8)}] ${p.oldName.slice(0, 50).padEnd(52)} -> ${p.newName}`);
  if (unmatched.length) {
    console.log(`\n⚠ ${unmatched.length} could not be auto-categorized:`);
    for (const u of unmatched) console.log(`   ${u}`);
  }

  if (!APPLY) { console.log('\n(dry run — nothing written. Re-run with --apply to commit.)'); await prisma.$disconnect(); return; }

  let updated = 0;
  for (const p of plan) {
    const data = { name: p.newName };
    if (p.cat) data.category = p.cat;        // leave unmatched category as-is
    await prisma.spirit.update({ where: { id: p.id }, data });
    updated++;
  }
  console.log(`\n✅ Applied: ${updated} rows updated.`);
  await prisma.$disconnect();
}
module.exports = { cleanName, titleCase, categorize };

if (require.main === module) {
  main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
}
