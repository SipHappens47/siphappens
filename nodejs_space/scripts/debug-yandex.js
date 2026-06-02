const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  await page.goto('https://yandex.com/images/search?text=Glenfiddich+12+Year+Old', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => {
    // Find a parent element that looks like a result tile
    const candidates = document.querySelectorAll('[data-bem]');
    const out = [];
    for (let i = 0; i < Math.min(3, candidates.length); i++) {
      const el = candidates[i];
      out.push({
        idx: i,
        tag: el.tagName,
        cls: el.className.slice(0, 100),
        bemKey: Object.keys(JSON.parse(el.getAttribute('data-bem') || '{}'))[0],
        bemSample: el.getAttribute('data-bem').slice(0, 300),
      });
    }
    // Also find img tags and their parent classes
    const imgs = Array.from(document.querySelectorAll('img')).slice(0, 5).map((img) => ({
      src: (img.getAttribute('src') || '').slice(0, 80),
      cls: img.className.slice(0, 60),
      parent: img.parentElement?.className.slice(0, 60),
    }));
    return { bemSample: out, imgs };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
