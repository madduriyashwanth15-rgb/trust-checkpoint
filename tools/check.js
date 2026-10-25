// Full check list for the Trust Checkpoint prototype. Run: node tools/check.js
// Checks the first screen, every number the two-pager quotes, every step, the side paths, the autoplay story and layout.
// Browsers: Chromium (bundled or CHROME_PATH) and Microsoft Edge (channel "msedge", skipped if not installed).
// Set CHECK_URL to test a deployed copy, e.g. CHECK_URL=https://trust-checkpoint.vercel.app/ node tools/check.js
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.CHECK_URL || ('file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/').replace(/^\/+/, ''));
const URL = BASE + '?debug=1';
const ORIGIN = BASE.startsWith('http') ? new (require('url').URL)(BASE).origin : null;
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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();
  const logs = [], errors = [];
  pg.on('console', m => { logs.push(m.text()); if (m.type() === 'error' || m.type() === 'assert' || /Assertion failed/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  pg.on('pageerror', e => errors.push(String(e)));
  pg.on('request', r => { const u = r.url(); if (!(u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:') || (ORIGIN && u.startsWith(ORIGIN)))) errors.push('network: ' + u); });
  const shot = n => pg.screenshot({ path: path.join(SHOTS, name + '-' + n + '.png') });
  const sheet = () => pg.innerText('#sheet');
  const screen = () => pg.innerText('#screen');
  const cap = () => pg.innerText('#cap');
  const wait = ms => pg.waitForTimeout(ms);

  await pg.goto(URL); await wait(900);
  ok('Console debug line exact', logs.some(l => l === '[debug] Groceries 47/55, Personal care 9/15 Rs 18 amber, Household 8/11, spot-check 8/10. Self-tests done.'));
  let c = await cap();
  ok('First screen states the problem', c.includes("In 2040, your AI agent shops for you. It can quietly pick what sponsors pay for, and you'd never notice."));
  ok('First screen states the product', c.includes("Trust Checkpoint shows your agent's record before you give it more power."));
  ok('First screen has Watch and Try', c.includes('Watch it in 40 seconds') && c.includes('Try it myself'));
  ok('First screen unchanged: no lens or Look closer yet', !(await pg.$('.lookbtn')) && !(await pg.$('.lens.on')));
  ok('Link preview tags present', (await pg.$('meta[property="og:image"]')) && (await pg.$('meta[property="og:title"]')));
  ok('Disclaimer says independent and not affiliated', (await pg.innerText('.disclaimer')).includes('independent product, not affiliated'));
  await shot('01-first-screen');

  await pg.click('#cap [data-act=try]'); await wait(300);
  ok('Try starts at step 1 of 6', (await cap()).includes('1 of 6'));
  ok('The agent asks: 120 choices, limit to ₹15,000', (await screen()).includes('120 choices') && (await screen()).includes('raise my monthly limit to ₹15,000'));
  await pg.click('#screen [data-act=notnow]'); await wait(200);
  ok('Not now keeps the limit', (await pg.innerText('#toast')).includes('ask again later'));

  await pg.click('#screen [data-act=allow]'); await wait(900);
  ok('Allow on the ask opens the checkpoint directly (3 of 6)', (await cap()).includes('3 of 6'));
  c = await sheet();
  ok('Card title matches PDF', c.includes('Before you raise the limit to ₹15,000'));
  ok('Badge: Default checker, rules public', c.includes('Default checker · rules public'));
  ok('Independent checker label', c.includes('Independent checker · works with any agent'));
  ok('Groceries 47 of 55, Earned', /Groceries\s*Earned\s*47 of 55 ties went your way/.test(c));
  ok('Personal care 9 of 15, Check, sponsors won 6', /Personal care\s*Check\s*9 of 15 ties yours · sponsors won 6/.test(c));
  ok('Personal care dots: 15, 6 amber', (await pg.$$eval('#sheet .r.warn .dots i', n => n.length)) === 15 && (await pg.$$eval('#sheet .r.warn .dots i.d-tie', n => n.length)) === 6);
  ok('Overpaid ₹18 a month', c.includes('Also overpaid ₹18 a month on non-ties'));
  ok('Gold 3 of 3', c.includes('Bought at your price 3 of 3 times'));
  ok('Electronics: no verdict', c.includes('Electronics: not handled yet, so no verdict'));
  ok('Spot-check 8 of 10, Simulated', c.includes('Simulated') && c.includes('Spot-check: 8 of 10 sampled picks passed'));
  ok('Three choices', c.includes('See why') && c.includes('Raise anyway') && c.includes('Not yet'));
  await shot('02-checkpoint');

  await pg.click('#sheet [data-act=notyet]'); await wait(200);
  ok('Not yet keeps ₹10,000', (await pg.innerText('#toast')).includes('Limit stays ₹10,000'));
  await pg.click('#sheet [data-act=checker]'); await wait(500);
  c = await sheet();
  ok('Second opinion labelled simulated', c.includes('Simulated') && c.includes('Outside checkers are planned, not live'));
  ok('Disagreement explained', c.includes('Why they disagree on') && c.includes('the bar is') && c.includes('Stricter is not automatically right'));
  ok('Second opinion keeps step 3', (await cap()).includes('3 of 6'));
  await shot('03-second-opinion');
  await pg.click('#sheet [data-act=record]'); await wait(400);

  await pg.click('#sheet [data-act=why]'); await wait(800);
  c = await sheet();
  ok('Why: same ₹249, Brand Y vs Brand Q', (c.match(/₹249/g) || []).length >= 2 && c.includes('Brand Y') && c.includes('Brand Q'));
  ok('Why: Sponsored stamp and verdict', c.includes('Sponsored') && c.includes('Sponsorship decided this tie.'));
  ok('Why: record fingerprint shown', c.includes('Record locked when chosen'));
  await shot('04-why');

  await pg.click('#sheet [data-act=rule]'); await wait(700);
  c = await sheet();
  ok('Rule preview: 6 personal care', c.includes('6 personal care'));
  await pg.click('#sheet label.tg >> nth=0'); await wait(300);
  ok('Rule off shows the consequence', (await sheet()).includes('Off: ties keep going wherever the agent decides.'));
  await pg.click('#sheet label.tg >> nth=0'); await wait(300);
  await pg.click('#sheet [data-act=rule-raise]'); await wait(600);
  ok('Face confirm shown, simulated', (await sheet()).includes("Confirming it's you") && (await sheet()).includes('Simulated'));
  await wait(1200);
  ok('Raised with 1 rule', (await pg.innerText('#toast')).includes('Limit raised to ₹15,000 with 1 rule'));
  await wait(3600);
  c = await screen();
  ok('Month later: 4 of 4', c.includes('4 of 4') && (await cap()).includes('6 of 6'));
  ok('Month later: 2 of 4 without the rule', c.includes('Without it: 2 of 4'));
  ok('Month later: Personal care now Earned, 11 of 15', c.includes('Earned') && c.includes('11 of 15 ties yours'));
  ok('Month later: honest about the bill', c.includes('changes whose brand wins, not the bill'));
  ok('Limit ₹15,000 with rule on', c.includes('₹15,000') && c.includes('Rule on'));
  await shot('05-month-later');

  await pg.click('#cap [data-act=about]'); await wait(500);
  let a = await pg.innerText('#about');
  ok('How I built this: thinking, independence, shipping', a.includes('How I shipped it') && a.includes('North star') && a.includes('Independent'));
  await pg.click('#about [data-act=tamper]'); await wait(300);
  ok('Tamper test caught (25 of 26)', (await pg.innerText('#tamperOut')).includes('Tamper caught: 25 of 26'));
  await shot('06-about');
  await pg.keyboard.press('Escape'); await wait(300);
  ok('Escape closes How I built this', await pg.evaluate(() => document.getElementById('about').hidden));

  // the lens: step 2, look closer at the picks that looked fine
  await pg.click('#cap [data-act=step][data-i="1"]'); await wait(900);
  c = await cap();
  ok('Lens step: 2 of 6, Look closer.', c.includes('2 of 6') && c.includes('Look closer.') && c.includes('Every pick looked fine. The lens shows what decided each one.'));
  const L = await pg.evaluate(() => {
    const M = Model.compute(App.state()), set = Screens.lensSet(M), kinds = set.map(Model.classify);
    const over = set.find(x => /^overpaid/.test(Model.classify(x)));
    const pc = M.rec['Personal care'];
    const av = n => (M.rec[n] || {}).avoidablePerMonth || 0;
    return { pcA: av('Personal care'), hh: av('Household'), gr: av('Groceries'), kinds, items: set.map(x => x.item), avoidable: M.avoidable, overItem: over && over.item, overExtra: over && over.extra,
      face: [...document.querySelectorAll('.pk-face .p-tile')].map(t => t.innerText),
      xt: [...document.querySelectorAll('.x-tile')].map(t => ({ cls: t.className, item: t.dataset.item, text: t.innerText })),
      head: document.querySelector('.pk-xray .pk-h').textContent.replace(/\s+/g, ' '), lr: +document.getElementById('xray').dataset.lr,
      cur: (document.querySelector('.x-tile.cur') || {}).dataset };
  });
  ok('Lens shows four picks, every kind once: aligned, sponsor tie, overpaid', L.items.length === 4 && L.kinds.includes('aligned') && L.kinds.includes('sponsored-tie') && L.kinds.some(k => /^overpaid/.test(k)));
  ok('Outside the lens the picks look normal (Agent pick, no flags)', L.face.length === 4 && L.face.every(t => t.includes('Agent pick') && !/Sponsor|more than/.test(t)));
  ok('Lens parked on the Deodorant tile', L.lr > 0 && L.cur && /Deodorant/.test(L.cur.item));
  const deo = L.xt.find(t => /Deodorant/.test(t.item));
  ok('Deodorant: amber "Sponsor won a tie", same price as usual', deo && /t-tie/.test(deo.cls) && deo.text.includes('Sponsor won a tie') && deo.text.includes('Same price as your usual'));
  const ov = L.xt.find(t => t.item === L.overItem);
  ok('Overpaid pick: coral "₹' + L.overExtra + ' more than an equal option" from the logic', ov && /t-over/.test(ov.cls) && L.overExtra > 0 && ov.text.includes('₹' + L.overExtra + ' more than an equal option'));
  ok('Aligned pick: green "Your usual · best price"', L.xt.some(t => /t-ok/.test(t.cls) && t.text.includes('Your usual · best price')));
  ok('Header: What Trust Checkpoint sees · ₹N = M.avoidable (₹28)', L.head.includes('What Trust Checkpoint sees') && L.head.includes('₹' + L.avoidable + ' a month overpaid') && L.avoidable === 28);
  ok('Header ₹N adds up the card numbers (Personal care ₹18 + Household ₹' + L.hh + ' + Groceries ₹' + L.gr + ')', L.pcA === 18 && L.pcA + L.hh + L.gr === L.avoidable);
  await shot('02b-lens');
  // drag: move the pointer over the overpaid pick, the lens follows and snaps to it
  const ovBox = await pg.locator('.pk-face .p-tile').nth(L.items.indexOf(L.overItem)).boundingBox();
  await pg.mouse.move(ovBox.x + 20, ovBox.y + 20); await pg.mouse.move(ovBox.x + ovBox.width / 2, ovBox.y + ovBox.height / 2, { steps: 4 }); await wait(400);
  ok('Pointer drag moves the lens onto the overpaid pick', await pg.evaluate(it => { const c = document.querySelector('.x-tile.cur'); return !!c && c.dataset.item === it; }, L.overItem));
  // keyboard: Look closer toggles a full reveal
  await pg.focus('.lookbtn'); await pg.keyboard.press('Enter'); await wait(500);
  ok('Keyboard: Look closer reveals all four (aria-pressed, Hide)', await pg.evaluate(() => document.getElementById('picks').classList.contains('full') && document.querySelector('.lookbtn').getAttribute('aria-pressed') === 'true' && /Hide/.test(document.querySelector('.lookbtn').innerText) && document.activeElement.classList.contains('lookbtn')));
  await pg.keyboard.press('Enter'); await wait(400);
  ok('Keyboard: pressing again hides the reveal', await pg.evaluate(() => !document.getElementById('picks').classList.contains('full') && document.querySelector('.lookbtn').getAttribute('aria-pressed') === 'false'));
  await pg.click('#screen [data-act=allow]'); await wait(800);
  ok('Allow from the lens step opens the checkpoint (3 of 6)', (await cap()).includes('3 of 6') && (await sheet()).includes('Before you raise the limit'));

  // the other path: raise without a rule, honestly shows no gain
  await pg.click('#cap [data-act=step][data-i="2"]'); await wait(700);
  await pg.click('#sheet [data-act=raise-plain]'); await wait(5600);
  ok('Raise anyway: 2 of 4, no rule set', (await screen()).includes('2 of 4') && (await screen()).includes('(no rule set)'));

  // autoplay: the whole story plays itself
  await pg.click('.top [data-act=play]'); const t0 = Date.now(); await wait(5600);
  ok('Watch: the lens glides over the picks', await pg.evaluate(() => (document.getElementById('picks') || {}).classList && (document.getElementById('picks').classList.contains('full') || +document.getElementById('xray').dataset.lr > 0)) && (await cap()).includes('2 of 6'));
  await pg.waitForFunction(() => App.state().ended, null, { timeout: 60000 });
  const secs = (Date.now() - t0) / 1000;
  ok('Watch: autoplay ends at step 6 with 4 of 4 in ' + secs.toFixed(1) + ' s (40 s label is truthful)', (await cap()).includes('6 of 6') && (await screen()).includes('4 of 4') && secs <= 40.5);

  const mob = await ctx.newPage(); await mob.setViewportSize({ width: 390, height: 844 });
  mob.on('pageerror', e => errors.push(String(e)));
  await mob.goto(URL); await mob.waitForTimeout(800);
  ok('Mobile: no horizontal scroll', (await mob.evaluate('document.documentElement.scrollWidth')) <= 390);
  ok('Mobile: problem text above the phone', await mob.evaluate(() => document.getElementById('cap').getBoundingClientRect().top < document.getElementById('phoneWrap').getBoundingClientRect().top));
  await mob.click('#cap [data-act=try]'); await mob.click('#screen [data-act=allow]'); await mob.waitForTimeout(900);
  ok('Mobile: checkpoint fits', (await mob.evaluate('document.documentElement.scrollWidth')) <= 390 && (await mob.innerText('#sheet')).includes('Before you raise the limit'));
  await mob.screenshot({ path: path.join(SHOTS, name + '-07-mobile.png') });
  // phone: press and hold to look through the lens
  const tctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const tp = await tctx.newPage(); tp.on('pageerror', e => errors.push(String(e)));
  await tp.goto(URL); await tp.waitForTimeout(700);
  await tp.click('#cap [data-act=try]'); await tp.click('#cap [data-act=next]'); await tp.waitForTimeout(900);
  ok('Phone: lens step fits, no horizontal scroll', (await tp.evaluate('document.documentElement.scrollWidth')) <= 390 && (await tp.innerText('#cap')).includes('2 of 6'));
  const tb = await tp.locator('.pk-face .p-tile').nth(3).boundingBox();
  const cdp = await tctx.newCDPSession(tp), pt = { x: tb.x + tb.width / 2, y: tb.y + tb.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] }); await tp.waitForTimeout(60);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await tp.waitForTimeout(300);
  ok('Phone: a quick tap does not move the lens', await tp.evaluate(() => (document.querySelector('.x-tile.cur') || {}).dataset.i === '0'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] }); await tp.waitForTimeout(450);
  ok('Phone: press and hold moves the lens to the held pick', await tp.evaluate(() => (document.querySelector('.x-tile.cur') || {}).dataset.i === '3' && +document.getElementById('xray').dataset.lr > 0));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await tp.waitForTimeout(200);
  await tp.screenshot({ path: path.join(SHOTS, name + '-08-phone-lens.png') });
  // reduced motion: no shimmer, no glide animation
  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const rp = await rctx.newPage(); rp.on('pageerror', e => errors.push(String(e)));
  await rp.goto(URL); await rp.waitForTimeout(600); await rp.click('#cap [data-act=try]'); await rp.click('#cap [data-act=next]'); await rp.waitForTimeout(500);
  ok('Reduced motion: lens shimmer and slides switched off', await rp.evaluate(() => getComputedStyle(document.querySelector('.glint'), '::after').animationName === 'none' && /^0s/.test(getComputedStyle(document.getElementById('lens')).transitionDuration)));
  ok('No console errors or outside network calls', errors.length === 0);
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
