// One-off: inspect a Spirit Data xlsx to see sheets and columns.
const XLSX = require('xlsx');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/inspect-xlsx.js <path-to-xlsx>');
  process.exit(1);
}

const wb = XLSX.readFile(file);
console.log('Sheets:', wb.SheetNames);
for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  console.log(`\n=== Sheet: ${sheetName} (${rows.length} rows) ===`);
  if (rows.length === 0) continue;
  console.log('Columns:', Object.keys(rows[0]));
  console.log('First 3 rows:');
  console.log(JSON.stringify(rows.slice(0, 3), null, 2));
}
