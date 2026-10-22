// Full check list for the Trust Checkpoint prototype. Run: node tools/check.js
// Checks every number the two-pager quotes, every chapter, the failure and disagreement states, and layout.
// Browsers: Chromium (bundled or CHROME_PATH) and Microsoft Edge (channel "msedge", skipped if not installed).
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/').replace(/^\/+/, '') + '?nointro=1&debug=1';
const SHOTS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

async function launch(name) {
  if (name === 'edge') return chromium.launch({ channel: 'msedge' });
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH });
  try { return await chromium.launch(); } catch (e) { return chromium.launch({ channel: 'chrome' }); }
}

async function run(name) {
  const results = [];
  const ok = (label, cond) => results.push([label, !!cond]);
  let browser;
  try { browser = await launch(name); } catch (e) { return { name, skipped: 'not available: ' + e.message.split('\n')[0] }; }
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const pg = await ctx.newPage();
  const logs = [], errors = [];
  pg.on('console', m => { logs.push(m.text()); if (m.type() === 'error' || m.type() === 'assert' || /Assertion failed/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  pg.on('pageerror', e => errors.push(String(e)));
  pg.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) errors.push('network: ' + r.url()); });
  const shot = n => pg.screenshot({ path: path.join(SHOTS, name + '-' + n + '.png') });
  const panel = () => pg.innerText('#panel');
  const field = () => pg.innerText('#field');
  const cap = () => pg.innerText('#cap');
  const settle = (ms = 1300) => pg.waitForTimeout(ms);

  await pg.goto(URL); await settle(900);
  ok('Console debug line exact', logs.some(l => l === '[debug] Groceries 47/55, Personal care 9/15 Rs 18 amber, Household 8/11, spot-check 8/10. Self-tests done.'));
  ok('Tagline and disclaimer visible', (await pg.innerText('.tagline')).includes('Before your agent gets more power, see its record.') && await pg.isVisible('.disclaimer'));
  ok('The ask: 120 choices, limit to ₹15,000', /120 choices[\s\S]*₹10,000 to ₹15,000/.test(await pg.innerText('#agentLine')));
  ok('120 dots, all agent blue before the checkpoint', (await pg.$$eval('#field .d', n => n.length)) === 120 && (await pg.$$eval('#field .d.k-agent', n => n.length)) === 120);
  await shot('01-ask');

  await pg.click('[data-act=allow]'); await settle();
  let c = await panel();
  ok('Card title matches PDF', c.includes('Before you raise the limit to ₹15,000'));
  ok('Badge: Default checker, rules public', c.includes('Default checker · rules public') && !/independent check/i.test(c));
  ok('Groceries 47 of 55, Earned', /Groceries · Earned\s*47 of 55 ties went your way/.test(c));
  ok('Personal care 9 of 15, ₹18, Check', /Personal care · Check\s*9 of 15 ties yours · overpaid ₹18 a month elsewhere/.test(c));
  ok('Example line', c.includes('At a tie, it picked sponsored Brand Q deodorant over your usual Brand Y.'));
  ok('Gold 3 of 3', c.includes('Bought at your price 3 of 3 times'));
  ok('Spot-check 8 of 10, Simulated', /Spot-check: 8 of 10 sampled picks passed\s*Simulated/.test(c));
  ok('Three choices with consequences', c.includes('Raise with a rule') && c.includes('Not yet') && c.includes('Limit stays ₹10,000'));
  ok('Dots coloured: 6 personal-care sponsor ties', (await pg.$$eval('#field .d.k-tie[data-cat="Personal care"]', n => n.length)) === 6);
  ok('Field labels match the card', (await field()).includes('47 of 55 ties hers') && (await field()).includes('9 of 15 ties hers'));
  await shot('02-checkpoint');

  await pg.click('#panel [data-act=checker]'); await settle(400);
  ok('Second opinion from the card keeps chapter 2', (await cap()).includes('2 of 5'));
  await pg.click('#panel [data-act=cb][data-v=strict]'); await settle(500);
  c = await panel();
  ok('Second opinion labelled simulated', c.includes('Simulated') && c.includes('Outside checkers are planned, not live'));
  ok('Disagreement explained', c.includes('Why they disagree on') && c.includes('the bar is') && c.includes('Stricter is not automatically right'));
  await shot('02b-second-opinion');
  await pg.click('#panel [data-act=cb][data-v=same]'); await settle(200);
  await pg.click('#panel [data-act=back]'); await settle(300);
  ok('Electronics: no history, so no verdict', (await panel()).includes('Electronics: not handled yet, so no verdict'));

  await pg.click('[data-act=evidence]'); await settle();
  c = await panel();
  ok('Evidence: three tie tests', c.includes('Same lowest total cost') && c.includes('Ratings within 0.1') && c.includes('Both match what she asked for'));
  ok('Evidence: picked option marked', c.includes('Brand Q (picked)'));
  ok('Evidence: privacy boundary', c.includes('Stays private') && c.includes('With your consent'));
  ok('Evidence: fingerprint matches', c.includes('matches what was written at the moment of choice'));
  ok('Evidence: exactly one dot ringed', (await pg.$$eval('#field .d.ring', n => n.length)) === 1);
  await shot('03-evidence');
  await pg.click('#panel [data-act=back]'); await settle(400);
  ok('Back from the evidence returns to the card', (await panel()).includes('Before you raise the limit'));

  await pg.click('[data-act=raise-rule]'); await settle();
  ok('Rule preview: 6 personal care', (await panel()).includes('6 personal care'));
  ok('Rule preview rings the sponsor ties', (await pg.$$eval('#field .d.flip', n => n.length)) > 0);
  await pg.click('[data-act=rule-raise]'); await pg.waitForTimeout(1900);
  ok('Raised with 1 rule', (await pg.innerText('#toast')).includes('Limit raised to ₹15,000 with 1 rule'));
  await pg.click('#panel [data-act=ff]'); await settle();
  c = await panel();
  ok('Payoff 4 of 4', c.includes('4 of 4'));
  ok('Payoff 2 without the rule', c.includes('against 2 without the rule'));
  ok('Payoff honest about the bill', c.includes('changes whose brand wins, not the bill'));
  ok('Personal care now Earned, 11 of 15', c.includes('Earned') && c.includes('11 of 15 ties yours'));
  await shot('04-payoff');

  await pg.click('#cap [data-act=next]'); await settle();
  ok('Closing chapter: limit sees totals, checkpoint sees choices', (await field()).includes('All within limit') && (await field()).includes('What Trust Checkpoint sees'));
  ok('Closing chapter: the takeaway', (await panel()).includes('Your agent works for you only if you can check its record.'));
  await shot('05-limits');
  await pg.click('#panel [data-act=about]'); await settle(500);
  ok('How I built this: thinking and shipping', (await pg.innerText('#about')).includes('How I shipped it') && (await pg.innerText('#about')).includes('North star'));
  await shot('06-about');
  await pg.keyboard.press('Escape'); await settle(300);
  ok('Escape closes How I built this', await pg.evaluate(() => document.getElementById('about').hidden));

  await pg.click('#labBtn'); await settle(500);
  await pg.click('#lab [data-act=restart]'); await settle(900);
  ok('Restart from Behind the scenes shows the record', (await panel()).includes('Before you raise the limit'));
  await pg.click('#c-edit'); await settle(250);
  ok('Cheat: edited record caught (25 of 26)', (await pg.innerText('#cheatOut')).includes('25 of 26'));
  await pg.click('#c-hide'); await settle(250);
  ok('Cheat: hidden option caught (Brand Y ₹249)', (await pg.innerText('#cheatOut')).includes('Brand Y at ₹249'));
  await shot('08-cheats');
  await pg.click('#c-reset'); await settle(250);
  ok('Reset: 26 of 26 unchanged', (await pg.innerText('#cheatOut')).includes('26 of 26'));
  await pg.fill('#infl', '0'); await pg.dispatchEvent('#infl', 'input'); await settle(700);
  ok('Sponsors 0%: 100% of ties, no amber dots', (await pg.innerText('#m-tie')).trim() === '100%' && (await pg.$$eval('#field .d.k-tie', n => n.length)) === 0);
  await pg.fill('#infl', '60'); await pg.dispatchEvent('#infl', 'input'); await settle(300);
  await pg.check('#d-rule'); await settle(700);
  ok('Tie rule: 100% of ties even at 60%', (await pg.innerText('#m-tie')).trim() === '100%');
  await pg.uncheck('#d-rule'); await pg.fill('#infl', '40'); await pg.dispatchEvent('#infl', 'input'); await settle(300);
  const dl = pg.waitForEvent('download');
  await pg.click('#lab [data-act=export]');
  ok('Export downloads records', (await dl).suggestedFilename() === 'priya-agent-records.json');
  await pg.keyboard.press('Escape'); await settle(300);
  ok('Escape closes Behind the scenes', !(await pg.evaluate(() => document.body.classList.contains('lab-open'))));

  const mob = await ctx.newPage(); await mob.setViewportSize({ width: 390, height: 844 });
  mob.on('pageerror', e => errors.push(String(e)));
  await mob.goto(URL); await mob.waitForTimeout(900);
  ok('Mobile: no horizontal scroll on the ask', (await mob.evaluate('document.documentElement.scrollWidth')) <= 390);
  await mob.click('[data-act=allow]'); await mob.waitForTimeout(1400);
  const pb = await mob.evaluate(() => { const r = document.getElementById('panel').getBoundingClientRect(); return [r.left, r.right, document.documentElement.scrollWidth]; });
  ok('Mobile: checkpoint fits the screen', pb[0] >= 0 && pb[1] <= 390 && pb[2] <= 390);
  await mob.screenshot({ path: path.join(SHOTS, name + '-09-mobile.png'), fullPage: true });
  ok('No console errors or network calls', errors.length === 0);
  if (errors.length) console.log('  errors:', errors.slice(0, 5));
  await browser.close();
  return { name, results };
}

(async () => {
  let failed = 0, ran = [];
  for (const b of ['chromium', 'edge']) {
    const r = await run(b);
    if (r.skipped) { console.log(`\n${b}: SKIPPED (${r.skipped})`); continue; }
    ran.push(b);
    console.log(`\n${b}:`);
    r.results.forEach(([l, p]) => { console.log((p ? 'PASS ' : 'FAIL ') + l); if (!p) failed++; });
  }
  console.log(failed ? `\n${failed} check(s) FAILED` : `\nALL PASS in ${ran.join(' and ')}`);
  process.exit(failed ? 1 : 0);
})();
