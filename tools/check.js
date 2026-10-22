// Runs the CLAUDE.md check list against index.html?debug=1 in Chromium and Edge. Read-only: never writes to the prototype.
// Usage (from the project folder): node tools/check.js
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');
const URL = pathToFileURL(path.join(ROOT, 'index.html')).href + '?debug=1';
const OUT = path.join(__dirname, 'screenshots');
const wait = ms => new Promise(r => setTimeout(r, ms));

// Playwright's own Chromium: use whichever build is installed, so a playwright-core upgrade does not need a re-download.
function chromiumExe() {
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  const dirs = fs.existsSync(base) ? fs.readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split('-')[1] - +a.split('-')[1]) : [];
  for (const d of dirs) { const exe = path.join(base, d, 'chrome-win64', 'chrome.exe'); if (fs.existsSync(exe)) return exe; }
  return undefined; // fall back to playwright-core's default lookup
}

async function run(label, launchOpts) {
  const results = [];
  const check = (name, ok, got) => results.push({ name, ok: !!ok, got });
  const shot = name => path.join(OUT, label.toLowerCase() + '-' + name + '.png');
  const browser = await chromium.launch(launchOpts);
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const logs = [], errors = [], requests = [];
    page.on('console', m => logs.push(m.type() + ': ' + m.text()));
    page.on('pageerror', e => errors.push(String(e)));
    page.on('request', r => { if (!/^(file|blob|data):/.test(r.url())) requests.push(r.url()); });

    await page.goto(URL); await wait(800);
    const sheet = page.locator('#sheetHost');
    const txt = async l => (await l.innerText()).replace(/\s+/g, ' ');
    const act = a => page.locator(`[data-act="${a}"]`).first().click();

    // 1. Console
    const dbg = logs.find(l => l.includes('[debug]')) || '';
    check('Console debug line exact', dbg.includes('[debug] Groceries 47/55, Personal care 9/15 Rs 18 amber, Household 8/11, spot-check 8/10. Self-tests done.'), dbg);
    check('No "Assertion failed" / errors', !logs.some(l => /assert|error/i.test(l.split(':')[0]) || /Assertion failed/.test(l)) && !errors.length, JSON.stringify(logs.filter(l => !l.includes('[debug]')).concat(errors)));
    await page.screenshot({ path: shot('01-default-1440') });

    check('Panel default: Personal care 26 of 26 fingerprints', (await txt(page.locator('#cheatOut'))).includes('26 of 26 fingerprints match'), await txt(page.locator('#cheatOut')));

    // 2. Raise limit -> card
    await act('raise'); await wait(500);
    const card = await txt(sheet);
    await page.screenshot({ path: shot('02-card-raise-1440') });
    check('Card title', card.includes('Before you raise the limit to ₹15,000'), card.slice(0, 80));
    check('Groceries 47 of 55, Earned', /Groceries · Earned 47 of 55 ties/.test(card), card.match(/Groceries[^G]*?ties[^·]*/)?.[0]);
    check('Personal care 9 of 15, overpaid ₹18 a month, Check', /Personal care · Check 9 of 15 ties yours · overpaid ₹18 a month/.test(card), card.match(/Personal care.*?a month[^G]*/)?.[0]);
    check('Gold bought at your price 3 of 3 times', /Bought at your price 3 of 3 times/.test(card), card.match(/Gold.*?times/)?.[0]);
    check('Spot-check 8 of 10 passed (Simulated)', /Spot-check: 8 of 10 sampled picks passed Simulated/.test(card), card.match(/Spot-check.*?Simulated/)?.[0]);
    check('Badge "Default checker · rules public"', card.includes('Default checker · rules public'), '');
    check('Example line', card.includes('At a tie, it picked sponsored Brand Q deodorant over your usual Brand Y.'), card.match(/At a tie[^.]*\./)?.[0]);

    // Full details: fingerprints
    await act('details'); await wait(400);
    const det = await txt(sheet);
    await page.screenshot({ path: shot('03-details-1440') });
    check('Details: Personal care 26 of 26 fingerprints match', det.includes('Personal care: 26 of 26 fingerprints match'), det.match(/Personal care: \d+ of \d+ fingerprints match/)?.[0]);
    check('Details: Electronics 0 decisions, Not enough evidence yet', /Electronics 0 decisions - Not enough evidence yet/.test(det), det.match(/Electronics[^H]*?yet/)?.[0]);
    await act('checker'); await wait(300);
    const chk = await txt(sheet);
    check('Checker B labelled simulated', chk.includes('Checker B (simulated)') && chk.includes('Simulated'), '');
    await page.keyboard.press('Escape'); await wait(200);
    await page.keyboard.press('Escape'); await wait(300);
    check('Escape closes sheets back to card', (await txt(sheet)).includes('Before you raise the limit'), '');

    // Raise with a rule -> Save -> PIN 1234
    await act('raise-rule'); await wait(300);
    await act('rule-save-raise'); await wait(300);
    for (const k of ['1', '2', '3', '4']) await page.locator(`[data-act="pin"][data-k="${k}"]`).click();
    await wait(700);
    const home = await txt(page.locator('#screen'));
    check('Limit raised to ₹15,000 with rule', home.includes('₹8,200 of ₹15,000') && home.includes('Rule on'), home.match(/₹8,200 of [^ ]+/)?.[0]);

    // Fast-forward 1 month
    await act('ff'); await wait(500);
    const pay = await txt(page.locator('#screen'));
    await page.screenshot({ path: shot('04-payback-1440') });
    check('After rule + FF: 4 of 4 personal-care ties', /4 of 4 personal-care ties went your way/.test(pay), pay.match(/\d+ of \d+ personal-care/)?.[0]);
    check('Without the rule: 2 of 4', pay.includes('Without the rule: 2 of 4.'), pay.match(/Without the rule: [^.]*/)?.[0]);
    check('Personal care 11 of 15, Earned', /Personal care · Earned Last 3 months: 11 of 15 ties/.test(pay), pay.match(/Personal care · .*?ties/)?.[0]);

    // Next -> shopping app -> Electronics
    await act('toshop'); await wait(400);
    await act('electronics'); await wait(500);
    const el = await txt(sheet);
    await page.screenshot({ path: shot('05-electronics-1440') });
    check('Electronics grey "Not enough evidence yet"', /Electronics · Not enough evidence yet/.test(el) && (await page.locator('#sheetHost .crow .dot.grey').count()) >= 1, el.match(/Electronics · [^0-9]*/)?.[0]);
    await act('handover'); await wait(400);
    check('Hand over adds Electronics chip', (await txt(page.locator('#screen'))).includes('Electronics'), '');
    check('Story complete', (await txt(page.locator('#story'))).includes("That's the story"), '');

    // Panel: cheats
    await page.click('#c-edit'); await wait(300);
    const outE = await txt(page.locator('#cheatOut'));
    check('Edit old record: fingerprint drops + caught', /Personal care records: 25 of 26 fingerprints match\. Caught/.test(outE), outE);
    await act('view'); await wait(400);
    check('Card shows "Record changed after it was written"', (await txt(sheet)).includes('Record changed after it was written'), '');
    await page.keyboard.press('Escape'); await wait(200);
    await page.click('#c-hide'); await wait(300);
    const outH = await txt(page.locator('#cheatOut'));
    check('Hide an option: spot-check catches Brand Y ₹249', outH.includes('Brand Y at ₹249 was left out'), outH);
    await page.screenshot({ path: shot('06-cheats-1440') });
    await page.click('#c-reset'); await wait(300);
    const outR = await txt(page.locator('#cheatOut'));
    check('Reset restores all fingerprints', /(\d+) of \1 fingerprints match\.$/.test(outR.trim()), outR);

    // Slider to 0%
    await page.locator('#infl').fill('0'); await wait(700);
    const tie = await page.locator('#m-tie').innerText();
    check('Slider 0%: tie-breaks 100%', tie === '100%', tie);
    await page.screenshot({ path: shot('07-slider0-1440') });

    check('No horizontal scroll at 1440', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '');

    // 3. Mobile 390x844
    const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const mErr = [];
    m.on('pageerror', e => mErr.push(String(e)));
    await m.goto(URL); await wait(800);
    await m.screenshot({ path: shot('08-default-390') });
    await m.screenshot({ path: shot('09-default-390-full'), fullPage: true });
    const sw = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    check('No horizontal scroll at 390', sw[0] <= sw[1], sw.join(' vs '));
    await m.locator('[data-act="raise"]').click(); await wait(500);
    await m.locator('#phone').screenshot({ path: shot('10-card-390') });
    const sw2 = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    check('No horizontal scroll at 390 with card open', sw2[0] <= sw2[1], sw2.join(' vs '));
    check('No page errors at 390', !mErr.length, mErr.join('; '));

    check('No network requests', !requests.length, requests.join(', '));
    check('Footer disclaimer visible', await page.locator('footer.disclaimer').isVisible(), '');
  } catch (e) {
    check('Run completed', false, e.message.split('\n')[0]);
  } finally {
    await browser.close();
  }
  return results;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const runs = [['Chromium', { executablePath: chromiumExe() }], ['Edge', { channel: 'msedge' }]];
  let failed = 0;
  for (const [label, opts] of runs) {
    let results;
    try { results = await run(label, opts); } catch (e) { results = [{ name: 'Browser launched', ok: false, got: e.message.split('\n')[0] }]; }
    console.log('\n== ' + label + ' ==');
    for (const r of results) console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.name + (r.ok ? '' : '  -> got: ' + r.got));
    const pass = results.filter(r => r.ok).length;
    console.log(`${label}: ${pass}/${results.length} passed`);
    failed += results.length - pass;
  }
  console.log('\nScreenshots: ' + OUT);
  console.log(failed ? `\nFAIL: ${failed} check(s) failed` : '\nALL PASS in Chromium and Edge');
  process.exit(failed ? 1 : 0);
})();
