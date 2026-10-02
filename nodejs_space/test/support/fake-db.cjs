// Minimal in-memory stand-in for the Prisma calls exercised by the isolated
// regressions. Records are stored pre-joined (e.g. a pour carries its spirit),
// include/select are ignored, and only the where operators the services use
// are supported. Every call is recorded for assertions.
const OPS = new Set(['not', 'in', 'notIn', 'lt', 'gt', 'contains', 'equals', 'mode', 'none', 'some']);

function match(record, where) {
  if (!where) return true;
  return Object.entries(where).every(([key, cond]) => {
    if (key === 'OR') return cond.some((c) => match(record, c));
    if (key === 'AND') return cond.every((c) => match(record, c));
    const value = record?.[key];
    if (cond && typeof cond === 'object' && !(cond instanceof Date) && !Array.isArray(cond)) {
      const keys = Object.keys(cond);
      if (!keys.some((k) => OPS.has(k))) return value != null && match(value, cond);
      const text = (v) => String(v ?? '').toLowerCase();
      if ('not' in cond && value === cond.not) return false;
      if ('in' in cond && !cond.in.includes(value)) return false;
      if ('notIn' in cond && cond.notIn.includes(value)) return false;
      if ('lt' in cond && !(value < cond.lt)) return false;
      if ('gt' in cond && !(value > cond.gt)) return false;
      if ('contains' in cond && !text(value).includes(text(cond.contains))) return false;
      if ('equals' in cond && text(value) !== text(cond.equals)) return false;
      if ('none' in cond && Array.isArray(value) && value.some((v) => match(v, cond.none))) return false;
      if ('some' in cond && !(Array.isArray(value) && value.some((v) => match(v, cond.some)))) return false;
      return true;
    }
    return value === cond;
  });
}

function table(name, rows, log) {
  let seq = 0;
  const t = {
    rows,
    findMany: async (q = {}) => { log.push([name, 'findMany', q]); return rows.filter((r) => match(r, q.where)).slice(0, q.take ?? Infinity); },
    findFirst: async (q = {}) => { log.push([name, 'findFirst', q]); return rows.find((r) => match(r, q.where)) ?? null; },
    findUnique: async (q = {}) => {
      log.push([name, 'findUnique', q]);
      const where = { ...q.where };
      for (const [k, v] of Object.entries(where)) {
        if (v && typeof v === 'object' && k.includes('_')) { delete where[k]; Object.assign(where, v); }
      }
      return rows.find((r) => match(r, where)) ?? null;
    },
    count: async (q = {}) => { log.push([name, 'count', q]); return rows.filter((r) => match(r, q.where)).length; },
    create: async (q) => { log.push([name, 'create', q]); const row = { id: `${name}-${++seq}`, ...q.data }; rows.push(row); return row; },
    update: async (q) => {
      log.push([name, 'update', q]);
      const row = rows.find((r) => match(r, q.where));
      Object.assign(row, q.data);
      return row;
    },
    upsert: async (q) => { log.push([name, 'upsert', q]); return q.create; },
    aggregate: async (q) => { log.push([name, 'aggregate', q]); return { _avg: { rating: null } }; },
    delete: async (q) => { log.push([name, 'delete', q]); const i = rows.findIndex((r) => match(r, q.where)); return rows.splice(i, 1)[0]; },
    deleteMany: async (q = {}) => {
      log.push([name, 'deleteMany', q]);
      const keep = rows.filter((r) => !match(r, q.where));
      const count = rows.length - keep.length;
      rows.splice(0, rows.length, ...keep);
      return { count };
    },
  };
  return t;
}

function fakeDb(data = {}) {
  const log = [];
  const prisma = { log };
  for (const name of ['user', 'pour', 'file', 'connection', 'cheer', 'block', 'spirit', 'distillery', 'report', 'flavortag']) {
    prisma[name] = table(name, data[name] ?? [], log);
  }
  prisma.calls = (name, op) => log.filter(([n, o]) => n === name && (!op || o === op));
  return prisma;
}

module.exports = { fakeDb, match };
