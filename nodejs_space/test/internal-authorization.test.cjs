// Isolated service regressions: no app bootstrap, credentials, DB or storage calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

class ForbiddenException extends Error {}
class NotFoundException extends Error {}

function loadService(relativePath, className) {
  const filename = path.join(__dirname, '..', 'src', relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      experimentalDecorators: true,
    },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === '@nestjs/common') {
        return { Injectable: () => (value) => value, ForbiddenException, NotFoundException };
      }
      if (name === '../moderation/blocking') {
        return require('./support/load-ts.cjs').loadTs('moderation/blocking');
      }
      throw new Error(`Unexpected import in isolated regression: ${name}`);
    },
  }, { filename });
  return exports[className];
}

const DistilleriesService = loadService('distilleries/distilleries.service.ts', 'DistilleriesService');
const SearchService = loadService('search/search.service.ts', 'SearchService');
const plain = (value) => JSON.parse(JSON.stringify(value));

function distilleryFixture({ premium = true, exists = true, matchingSpirit = true } = {}) {
  const calls = { lookup: 0, spirit: 0, upsert: 0, analytics: 0 };
  const distillery = exists ? {
    id: 'distillery', owneruserid: 'owner', ispremium: premium,
    followerscount: 7, _count: { spirits: 3, pours: 2 },
  } : null;
  const prisma = {
    distillery: { findUnique: async () => { calls.lookup++; return distillery; } },
    spirit: {
      findFirst: async (query) => {
        calls.spirit++;
        assert.deepEqual(plain(query.where), { id: 'spirit', distilleryid: 'distillery' });
        return matchingSpirit ? { id: 'spirit' } : null;
      },
      findMany: async () => [{ id: 'spirit', name: 'Test Gin', bottleimage: 'test-image', _count: { radar: 4 } }],
    },
    distilleryinsight: { upsert: async ({ create }) => { calls.upsert++; return create; } },
    radar: { count: async () => { calls.analytics++; return 4; } },
    spiritflavortag: { findMany: async () => [{ flavortag: { name: 'Citrus' } }] },
    pour: { groupBy: async () => [{ createdat: new Date('2026-09-01T00:00:00Z'), _count: 2 }] },
  };
  return { service: new DistilleriesService(prisma), calls };
}

const notes = { tastingNotes: 'Synthetic owner note', howWeCreated: 'Synthetic process' };
for (const method of ['insights', 'analytics']) {
  const invoke = (service, actor) => method === 'insights'
    ? service.updateInsights('distillery', 'spirit', actor, notes)
    : service.getAnalytics('distillery', actor);

  for (const actor of ['stranger', undefined]) {
    test(`${method}: rejects ${actor ?? 'missing'} actor before protected reads/writes`, async () => {
      const { service, calls } = distilleryFixture();
      await assert.rejects(invoke(service, actor), ForbiddenException);
      assert.equal(calls.spirit, 0);
      assert.equal(calls.upsert, 0);
      assert.equal(calls.analytics, 0);
    });
  }

  test(`${method}: free owner remains denied`, async () => {
    const { service, calls } = distilleryFixture({ premium: false });
    await assert.rejects(invoke(service, 'owner'), ForbiddenException);
    assert.equal(calls.upsert, 0);
    assert.equal(calls.analytics, 0);
  });

  test(`${method}: missing distillery remains not found`, async () => {
    const { service } = distilleryFixture({ exists: false });
    await assert.rejects(invoke(service, 'owner'), NotFoundException);
  });
}

test('insights: premium owner retains successful note mutation and response', async () => {
  const { service, calls } = distilleryFixture();
  assert.deepEqual(plain(await service.updateInsights('distillery', 'spirit', 'owner', notes)), {
    message: 'Distillery insights updated successfully',
    insights: { howWeCreated: notes.howWeCreated, tastingNotes: notes.tastingNotes },
  });
  assert.equal(calls.upsert, 1);
});

test('insights: owner cannot edit a spirit outside the target distillery', async () => {
  const { service, calls } = distilleryFixture({ matchingSpirit: false });
  await assert.rejects(service.updateInsights('distillery', 'spirit', 'owner', notes), NotFoundException);
  assert.equal(calls.upsert, 0);
});

test('analytics: premium owner retains populated analytics contract', async () => {
  const { service, calls } = distilleryFixture();
  assert.deepEqual(plain(await service.getAnalytics('distillery', 'owner')), {
    overview: { totalSpirits: 3, totalFollowers: 7, totalRadarAdds: 4, totalPours: 2 },
    topSpiritsOnRadar: [{ id: 'spirit', name: 'Test Gin', bottleImage: 'test-image', radarAdds: 4 }],
    topFlavorTags: [{ name: 'Citrus', count: 1 }],
    monthlyGraph: [{ month: '2026-09', count: 2 }],
  });
  assert.equal(calls.analytics, 1);
});

function searchFixture() {
  const people = [
    { id: 'bob', name: 'Bob Sipper', email: 'bob@example.invalid', profilephoto: 'photo', experiencelevel: 'Explorer', isofficial: true, verifiedOwner: false },
    { id: 'alice', name: 'Alice Bob', email: 'alice@example.invalid', verifiedOwner: false },
    { id: 'brand-owner', name: 'Bob Distiller', email: 'brand@example.invalid', verifiedOwner: true },
  ];
  let userQuery;
  const prisma = {
    user: { findMany: async (query) => {
      userQuery = plain(query);
      const [self, owner, matching] = userQuery.where.AND;
      assert.deepEqual(owner, { owneddistillery: { none: { verified: true } } });
      return people.filter((user) => user.id !== self.id.not && !user.verifiedOwner &&
        Object.entries(matching).every(([key, condition]) =>
          user[key].toLowerCase().includes(condition.contains.toLowerCase())));
    } },
    spirit: { findMany: async () => [] },
    distillery: { findMany: async () => [] },
    flavortag: { findMany: async () => [] },
    pour: { findMany: async () => [] },
    block: { findMany: async () => [] },
  };
  return { service: new SearchService(prisma), query: () => userQuery };
}

for (const query of [' Bob ']) {
  test(`search: ${query.trim()} retains public identity and navigation ID without email`, async () => {
    const fixture = searchFixture();
    const results = plain(await fixture.service.universalSearch(query, 'alice'));
    assert.deepEqual(results.users, [{
      id: 'bob', name: 'Bob Sipper', profilePhoto: 'photo', experienceLevel: 'Explorer', isOfficial: true, type: 'user',
    }]);
    assert.equal(Object.hasOwn(results.users[0], 'email'), false);
    assert.equal(fixture.query().select.email, undefined);
    assert.equal(fixture.query().take, 5);
    assert.deepEqual(results.spirits, []);
  });
}

test('search: an email or email fragment matches nobody (batch 3)', async () => {
  for (const query of ['bob@example.invalid', 'example.invalid', '@example']) {
    const fixture = searchFixture();
    assert.deepEqual(plain((await fixture.service.universalSearch(query, 'alice')).users), [], query);
    assert.equal(JSON.stringify(fixture.query().where).includes('email'), false);
  }
});

test('search: nonmatching query stays empty', async () => {
  const fixture = searchFixture();
  assert.deepEqual(plain((await fixture.service.universalSearch('unknown', 'alice')).users), []);
});

test('search: short query performs no user lookup', async () => {
  const fixture = searchFixture();
  const results = await fixture.service.universalSearch('x', 'alice');
  assert.deepEqual(plain(results.users), []);
  assert.equal(fixture.query(), undefined);
});
