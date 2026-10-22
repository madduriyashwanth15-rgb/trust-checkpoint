// Trust Checkpoint prototype: app screens, the trust card and its sheets.
// All verdicts come from Logic (logic.js) and Lock (lock.js). Nothing on the card is typed in by hand.
var App = (function () {
  var S, M;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- helpers ----------
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  var LIGHT = { green: 'Earned', amber: 'Check', red: 'Hold back', grey: 'Not enough evidence yet' };

  function initState() {
    S = { app: 'money', layer: true, influence: DATA.defaultSponsorInfluence, now: DATA.historyWeeks,
          limit: DATA.moneyAgent.monthlyLimit, ruleFrom: null, askAbove: null, electronics: false,
          sheets: [], raised: false, ruleOnRaise: false, payback: null, pin: '',
          cheat: { edited: false, hidden: false },
          seen: { card: false, rule: false, payback: false } };
  }

  // ---------- model ----------
  function sim(from, to, ruleOn) {
    if (to <= from) return [];
    return Logic.simulateAgent(DATA, { from: from, to: to, sponsorInfluence: S.influence, rules: ruleOn ? { tieUsual: true } : {} });
  }
  // Purchases in [from, to), with the tie rule active from S.ruleFrom onwards.
  function purchases(from, to, forceRule) {
    var rf = forceRule === undefined ? S.ruleFrom : forceRule;
    if (rf === null || rf >= to) return sim(from, to, false);
    if (rf <= from) return sim(from, to, true);
    return sim(from, rf, false).concat(sim(rf, to, true));
  }
  function compute() {
    var from = S.now - DATA.historyWeeks, p = purchases(from, S.now);
    var rec = Logic.checkRecord(DATA, p, DATA.historyWeeks);
    var spot = Logic.spotCheck(DATA, p);
    var gold = Logic.goldRecord(DATA);
    var ledger = Lock.buildLedger(p, S.ruleFrom), edited = null, hiddenRec = null;
    if (S.cheat.edited) {
      // Cheat a: change an old record after it was written. The tie verdict is NOT recomputed from it.
      var ex = rec['Personal care'].example;
      var target = ledger.filter(function (e) {
        return e.rec.category === 'Personal care' && (ex ? (e.rec.week === ex.week && e.rec.item === ex.item && e.rec.chosen === ex.chosen.brand) : true);
      }).pop();
      if (target) {
        target.rec.options.forEach(function (o) { if (o.brand === 'Brand Y') o.price = 289; });
        edited = target;
      }
    }
    if (S.cheat.hidden) {
      // Cheat b: a new record written dishonestly from the start (Brand Y left out). Its fingerprint is valid.
      var cat = DATA.categories[1], it = cat.items.filter(function (i) { return i.item === 'Deodorant 150 ml'; })[0];
      hiddenRec = { week: S.now, category: 'Personal care', item: it.item,
        options: [{ brand: cat.sponsor, price: it.sponsor[0], deliveryFee: it.sponsor[1], rating: it.sponsor[2], sponsored: true },
                  { brand: cat.other, price: it.other[0], deliveryFee: it.other[1], rating: it.other[2], sponsored: false }],
        chosen: cat.sponsor, rule: null };
      Lock.write(ledger, hiddenRec);
    }
    var lock = Lock.verify(ledger);
    var missing = hiddenRec ? Lock.missingOptions(hiddenRec) : [];
    var del = DATA.categories.filter(function (c) { return c.delegated; });
    var tiesT = 0, tiesW = 0, avoid = 0;
    del.forEach(function (c) { tiesT += rec[c.name].tiesTotal; tiesW += rec[c.name].tiesWon; avoid += rec[c.name].avoidablePerMonth; });
    var week = purchases(S.now - 1, S.now), month = purchases(S.now - 4, S.now);
    M = { p: p, rec: rec, spot: spot, gold: gold, ledger: ledger, lock: lock, edited: edited, hiddenRec: hiddenRec, missing: missing,
          tieRate: tiesT ? tiesW / tiesT : 0, avoidable: avoid, areas: del.length + (S.electronics ? 1 : 0),
          weekCount: week.length, weekSpend: week.reduce(function (a, x) { return a + x.chosen.total; }, 0),
          monthCount: month.length };
    return M;
  }

  // ---------- story ----------
  var STEPS = [
    { t: 'Priya wants to raise her money agent\'s limit to ₹15,000.', done: function () { return S.seen.card; } },
    { t: 'Before it gets more, the checkpoint shows its record.', done: function () { return S.seen.rule || S.raised; } },
    { t: 'She raises the limit with one rule.', done: function () { return S.raised; } },
    { t: 'A month later, she sees what the rule changed.', done: function () { return S.seen.payback; } },
    { t: 'In the shopping app, she hands over Electronics.', done: function () { return S.electronics; } }
  ];
  function currentStep() { for (var i = 0; i < STEPS.length; i++) if (!STEPS[i].done()) return i; return STEPS.length; }
  function renderStory() {
    var cur = currentStep();
    $('story').innerHTML = STEPS.map(function (s, i) {
      var st = s.done() ? 'done' : (i === cur ? 'now' : 'next');
      return '<li class="' + st + '"' + (i === cur ? ' aria-current="step"' : '') + '><span>' + esc(s.t) + '</span></li>';
    }).join('') + (cur === STEPS.length ? '<li class="fin"><span>That\'s the story. Now try the panel on the right: push sponsors up, try to cheat, watch the card.</span></li>' : '');
  }
  function hot(name) {
    // Which button should pulse right now.
    var cur = currentStep();
    var map = { 0: 'raise', 1: 'withrule', 2: 'save', 3: 'ff', 4: S.app === 'money' ? 'tabshop' : (S.sheets.length ? 'handover' : 'electronics') };
    if (!S.layer && (name === 'withrule')) return '';
    return map[cur] === name ? ' hot' : '';
  }

  // ---------- screens ----------
  // Simple illustrated products: invented brands only, never photos. kind: pack | bottle | can | box | coin
  function thumb(kind, tint, letter) {
    var c = tint || '#2874F0';
    var s = {
      pack: '<path d="M12 13h24l3 29H9z" fill="#F2E2BF"/><path d="M12 13l4-6h16l4 6z" fill="#E0C792"/><rect x="14" y="22" width="20" height="11" rx="3" fill="' + c + '"/>',
      bottle: '<rect x="19" y="4" width="10" height="8" rx="2" fill="#15233F"/><rect x="13" y="11" width="22" height="33" rx="8" fill="' + c + '"/><rect x="17" y="21" width="14" height="13" rx="3" fill="#fff" fill-opacity=".85"/>',
      can: '<rect x="18" y="3" width="12" height="8" rx="3" fill="#C4CCD8"/><rect x="13" y="10" width="22" height="35" rx="7" fill="' + c + '"/><rect x="13" y="19" width="22" height="16" fill="#fff" fill-opacity=".24"/>',
      box: '<path d="M8 16l16-7 16 7v22l-16 7-16-7z" fill="' + c + '"/><path d="M8 16l16 7 16-7M24 23v22" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>',
      coin: '<circle cx="24" cy="24" r="17" fill="#E8B64C"/><circle cx="24" cy="24" r="11.5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.5"/>'
    }[kind];
    var t = letter ? '<text x="24" y="31.5" text-anchor="middle" font-family="Lexend,sans-serif" font-weight="700" font-size="12" fill="#fff">' + esc(letter) + '</text>' : '';
    return '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">' + s + t + '</svg>';
  }
  function thumbKind(item) { var w = itemWord(item); return w === 'deodorant' ? 'can' : /atta|rice|tea|dal|toor|biscuits|milk/.test(w) ? 'pack' : /detergent|garbage|floor|dishwash/.test(w) ? 'box' : 'bottle'; }
  var AREAS = [['Groceries', 'pack', '#2874F0'], ['Personal care', 'bottle', '#2F8F83'], ['Household', 'box', '#6D5BD0']];
  function lastBought(cat) { for (var i = M.p.length - 1; i >= 0; i--) if (M.p[i].category === cat) return M.p[i]; return null; }

  // The one app: the agent's home. Gold (money agent) is one of its areas.
  function moneyHome() {
    var used = DATA.moneyAgent.shoppingBudgetUsed, pct = Math.min(100, Math.round(used / S.limit * 100));
    var h = '<div class="app agent">';
    h += '<header class="a-head"><span class="a-name"><span class="orb" aria-hidden="true"></span>Your agent</span><span class="avatar" aria-hidden="true">P</span></header>';
    h += '<h2 class="a-hi">Good afternoon, Priya</h2>';
    h += '<div class="a-done"><div><b>' + M.weekCount + ' orders · ' + inr(M.weekSpend) + '</b><span>Handled this week</span></div><div><b>Bills paid</b><span>Electricity, broadband, rent</span></div></div>';
    if (!S.layer) h += '<p class="calm">This month: ' + M.monthCount + ' items bought · all within your limit ✓</p>';
    h += '<section class="ask" aria-label="From your agent">';
    if (!S.raised) h += '<p class="ask-t">I\'d like a monthly budget of ' + inr(DATA.moneyAgent.proposedLimit) + ' for the festive season. Review?</p>';
    else h += '<p class="ask-t">Your monthly budget is now ' + inr(S.limit) + '.</p>';
    h += '<div class="ask-b"><span>' + inr(used) + ' of ' + inr(S.limit) + '</span> used this month</div><div class="bar"><i style="width:' + pct + '%"></i></div>';
    if (S.raised) h += '<p class="note">' + (S.ruleOnRaise ? 'Rule on: on ties, pick my usual brand' : 'No rules set') + '</p>';
    if (!S.raised) h += '<button type="button" class="y-cta' + hot('raise') + '" data-act="raise">Review</button>';
    else if (!S.payback) h += '<button type="button" class="y-cta' + hot('ff') + '" data-act="ff">Fast-forward 1 month</button>';
    else h += '<button type="button" class="y-cta" data-act="paybackview">See last month\'s result</button>';
    h += '</section>';
    h += '<section class="areas"><h3>What I handle for you</h3><ul>';
    AREAS.forEach(function (a) {
      var x = lastBought(a[0]);
      h += '<li><span class="th">' + thumb(a[1], a[2]) + '</span><div><b>' + esc(a[0]) + '</b><span>' + (x ? 'Last: ' + esc(x.item) + ', ' + esc(x.chosen.brand) : '') + '</span></div></li>';
    });
    h += '<li><span class="th">' + thumb('coin') + '</span><div><b>Gold</b><span>Buys at or below ' + inr(DATA.gold.buyAtOrBelow) + '/g. Now <span id="goldNow">' + inr(DATA.gold.weeklyPrice[0]) + '/g</span></span></div></li>';
    h += '</ul></section>';
    if (S.layer) h += '<button type="button" class="link a-link" data-act="view">See my agent\'s record</button>';
    h += '</div>';
    return h;
  }
  function payback() {
    var pb = S.payback, pc = M.rec['Personal care'];
    var h = '<div class="app money pay">';
    h += '<header class="m-head"><button type="button" class="back light" data-act="home" aria-label="Back to home">Back</button><span class="m-name">One month later</span><span></span></header>';
    h += '<section class="pay-hero"><p class="big">' + pb.withWon + ' of ' + pb.withTotal + '</p><p>personal-care ties went your way this month' + (S.ruleOnRaise ? '' : ' (no rule set)') + '.</p>';
    if (S.ruleOnRaise) h += '<p class="cmp">Without the rule: ' + pb.withoutWon + ' of ' + pb.withoutTotal + '.</p>';
    h += '</section><div class="pay-body">';
    h += '<p>Your rule changed whose brand won. It did not change the bill: tied options cost the same.</p>';
    h += '<div class="mini"><span class="dot ' + pc.light + '"></span><div><b>Personal care · ' + LIGHT[pc.light] + '</b><span>Last 3 months: ' + pc.tiesWon + ' of ' + pc.tiesTotal + ' ties went your way</span></div></div>';
    h += '<button type="button" class="m-cta' + hot('tabshop') + '" data-act="toshop">Next: open the shopping app</button>';
    h += '</div></div>';
    return h;
  }
  function shopHome() {
    var h = '<div class="app shop">';
    h += '<header class="s-head"><span class="s-name"><span class="glyph" aria-hidden="true"></span>Shop</span><span class="pill">Ask your agent anything</span></header>';
    h += '<section class="s-hero"><p class="hi">Hi Priya</p><p>Your agent handled this week: <b>' + M.weekCount + ' orders · ' + inr(M.weekSpend) + '</b></p></section>';
    if (!S.layer) h += '<p class="calm shopcalm">This month: ' + M.monthCount + ' items bought · all within your limit ✓</p>';
    h += '<section class="s-areas"><h3>Areas your agent handles</h3><div class="chips">';
    ['Groceries', 'Personal care', 'Household'].forEach(function (n) {
      var c = M.rec[n];
      h += '<span class="chip">' + (S.layer ? '<span class="dot ' + c.light + '"></span>' : '') + esc(n) + (S.layer ? '<em>' + LIGHT[c.light] + '</em>' : '') + '</span>';
    });
    if (S.electronics) h += '<span class="chip">' + (S.layer ? '<span class="dot grey"></span>' : '') + 'Electronics<em>Asks you above ' + inr(S.askAbove || 5000) + '</em></span>';
    h += '</div>';
    if (!S.electronics) h += '<button type="button" class="s-cta' + hot('electronics') + '" data-act="electronics">+ Let me handle Electronics</button>';
    h += '</section>';
    h += '<section class="s-recent"><h3>Recent orders</h3><ul>';
    M.p.slice(-4).reverse().forEach(function (x) {
      h += '<li><span>' + esc(x.item) + '<i>' + esc(x.chosen.brand) + '</i></span><b>' + inr(x.chosen.total) + '</b></li>';
    });
    h += '</ul></section>';
    if (S.layer) h += '<button type="button" class="link s-link" data-act="view">See my agent\'s record</button>';
    h += '</div>';
    return h;
  }

  // ---------- trust card ----------
  function itemWord(item) { return item.split(' ')[0].toLowerCase(); }
  function row(name, kind, eg) {
    var c = M.rec[name], light, detail;
    if (kind === 'gold') { light = M.gold.light; detail = 'Bought at your price ' + M.gold.bought + ' of ' + M.gold.chances + ' times'; name = 'Gold'; }
    else if (!c.delegated) { light = 'grey'; detail = c.decisions + ' decisions in this category yet. Hand it over with a safety rule, or wait.'; }
    else {
      light = c.light;
      if (light === 'grey') detail = 'Only ' + c.tiesTotal + ' ties so far: too few to judge';
      else detail = c.tiesWon + ' of ' + c.tiesTotal + ' ties ' + (light === 'green' ? 'went your way' : 'yours') + (c.avoidablePerMonth > 0 ? ' · overpaid ' + inr(c.avoidablePerMonth) + ' a month elsewhere' : '');
    }
    var broken = kind !== 'gold' && M.lock[name] && M.lock[name].broken.length;
    return '<div class="crow' + (eg ? ' focus ' + light : '') + '"><span class="dot ' + light + '"></span><div class="cb"><b>' + esc(name) + '</b> · <span class="st ' + light + '">' + LIGHT[light] + '</span><br><span class="det">' + detail + '</span>' +
      (broken ? '<span class="warn">Record changed after it was written</span>' : '') + (eg || '') + '</div></div>';
  }
  function example(names) {
    // The clearest tie given to a sponsor, from the weakest area shown. Returns that area's name and the example markup.
    var cands = names.map(function (n) { return M.rec[n]; }).filter(function (c) { return c && c.example; })
      .sort(function (a, b) { return a.tieWinRate - b.tieWinRate; });
    if (!cands.length) return null;
    var e = cands[0].example, usual = e.options[0], kind = thumbKind(e.item);
    function opt(o, picked) {
      return '<div class="opt' + (picked ? ' picked' : '') + '"><span class="o-top"><span class="th">' + thumb(kind, o.sponsored ? '#6D5BD0' : '#2F8F83', o.brand.slice(-1)) + '</span>' +
        '<em>' + (picked ? 'Sponsored, picked' : 'Your usual') + '</em></span><span class="o-t"><b>' + esc(o.brand) + '</b><span>' + inr(o.total) + ', rated ' + o.rating + '</span></span></div>';
    }
    var html = '<p class="eg">At a tie, it picked sponsored ' + esc(e.chosen.brand) + ' ' + itemWord(e.item) + ' over your usual ' + esc(usual.brand) + '.</p>' +
      '<div class="tie">' + opt(e.chosen, true) + '<span class="eq" aria-hidden="true">=</span>' + opt(usual, false) + '</div>';
    return { name: names.filter(function (n) { return M.rec[n] === cands[0]; })[0], html: html };
  }
  function cardSheet(variant) {
    var names, title, btns;
    var app = S.app;
    if (variant === 'raise') { title = 'Before you raise the limit to ' + inr(DATA.moneyAgent.proposedLimit); names = ['Groceries', 'Personal care', 'gold'];
      btns = '<button type="button" class="b" data-act="raise-now">Raise</button><button type="button" class="b pri' + hot('withrule') + '" data-act="raise-rule">Raise with a rule</button><button type="button" class="b" data-act="close">Not yet</button>'; }
    else if (variant === 'electronics') { title = 'Before you hand over Electronics'; names = ['Electronics', 'Groceries', 'Personal care', 'Household'];
      btns = '<button type="button" class="b pri wide' + hot('handover') + '" data-act="handover">Hand over with an "Ask me above ' + inr(5000) + '" rule</button><button type="button" class="b" data-act="close">Not yet</button>'; }
    else { title = 'Your agent\'s record'; names = app === 'money' ? ['Groceries', 'Personal care', 'gold'] : ['Groceries', 'Personal care', 'Household'].concat(S.electronics ? ['Electronics'] : []);
      btns = '<button type="button" class="b pri" data-act="add-rule">Add a rule</button><button type="button" class="b" data-act="close">Close</button>'; }
    var h = '<div class="sheet card" role="dialog" aria-modal="true" aria-labelledby="cardTitle">';
    h += '<div class="grab" aria-hidden="true"></div><span class="badge"><span class="shield" aria-hidden="true"></span>Default checker · rules public</span>';
    h += '<h3 id="cardTitle">' + title + '</h3>';
    var eg = example(names.filter(function (n) { return n !== 'gold'; }));
    names.forEach(function (n) { h += n === 'gold' ? row('Gold', 'gold') : row(n, null, eg && eg.name === n ? eg.html : ''); });
    h += '<p class="so">Spot-check: ' + M.spot.passed + ' of ' + M.spot.sampled + ' sampled picks passed <span class="sim">Simulated</span></p>';
    if (M.missing.length) h += '<p class="flag">Spot-check flag: a new record left out a cheaper or equal option (' + esc(M.missing[0].brand) + ', ' + inr(M.missing[0].total) + ').</p>';
    h += '<div class="btns' + (variant !== 'raise' ? ' two' : '') + '">' + btns + '</div>';
    h += '<p class="foot"><button type="button" class="link" data-act="details">See full details</button><span aria-hidden="true">·</span><button type="button" class="link" data-act="checker">Switch checker</button></p>';
    return h + '</div>';
  }
  function detailsSheet() {
    var h = '<div class="sheet tall" role="dialog" aria-modal="true" aria-labelledby="detTitle">';
    h += '<div class="sh-head"><button type="button" class="back" data-act="back">Back</button><h3 id="detTitle">Full details</h3></div><div class="sh-body">';
    h += '<p class="meta">Checked 2 days ago · this card returns on its own in 88 days. Every purchase is checked as it happens; the numbers cover the last 3 months.</p>';
    h += '<table class="dt"><thead><tr><th>Area</th><th>Ties yours</th><th>Overpaid a month</th><th>Verdict</th></tr></thead><tbody>';
    DATA.categories.forEach(function (c) {
      var r = M.rec[c.name];
      var light = c.delegated ? r.light : 'grey';
      h += '<tr><td>' + esc(c.name) + '</td><td>' + (c.delegated ? r.tiesWon + ' of ' + r.tiesTotal : '0 decisions') + '</td><td>' + (c.delegated ? inr(r.avoidablePerMonth) : '-') + '</td><td><span class="dot ' + light + '"></span>' + LIGHT[light] + '</td></tr>';
    });
    h += '</tbody></table>';
    var ex = M.rec['Personal care'].example;
    if (ex) {
      h += '<h4>What this check used</h4><p class="small">The flagged tie in Personal care, week ' + (ex.week + 1) + ': every option the agent saw.</p><table class="dt"><thead><tr><th>Option</th><th>Total</th><th>Rating</th><th>Sponsored</th></tr></thead><tbody>';
      ex.options.forEach(function (o) {
        h += '<tr' + (o.brand === ex.chosen.brand ? ' class="picked"' : '') + '><td>' + esc(o.brand) + (o.brand === ex.chosen.brand ? ' (picked)' : '') + '</td><td>' + inr(o.total) + '</td><td>' + o.rating + '</td><td>' + (o.sponsored ? 'Yes' : 'No') + '</td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '<h4>Flagged picks</h4><ul class="flags">';
    var fl = [];
    ['Personal care', 'Household', 'Groceries'].forEach(function (n) { fl = fl.concat(M.rec[n].flagged.slice(-3).reverse()); });
    fl.slice(0, 6).forEach(function (x) {
      var usual = x.options[0];
      h += '<li><b>' + esc(x.item) + '</b>: picked sponsored ' + esc(x.chosen.brand) + ' at ' + inr(x.chosen.total) + '; ' + esc(usual.brand) + ' was ' + inr(usual.total) + (x.tie ? ' (a tie)' : '') + '.</li>';
    });
    if (!fl.length) h += '<li>No sponsored picks in the last 3 months.</li>';
    h += '</ul>';
    h += '<h4>Records locked</h4><ul class="locks">';
    ['Groceries', 'Personal care', 'Household'].forEach(function (n) {
      var l = M.lock[n] || { match: 0, total: 0, broken: [] };
      h += '<li class="' + (l.broken.length ? 'bad' : '') + '">' + esc(n) + ': ' + l.match + ' of ' + l.total + ' fingerprints match' + (l.broken.length ? ': a record was changed after it was written' : '') + '</li>';
    });
    h += '</ul><p class="small">Each record is fingerprinted when written. Changing it later breaks the fingerprint. This prototype fingerprints mock records to show the mechanism; it is not a security product.</p>';
    h += '<h4>How the spot-check works</h4><p class="small">It re-prices 10 random picks. A pick passes if it cost within ₹10 of the cheapest option and, at a tie, matched your usual brand. Simulated here: it reuses the same mock catalogue rather than an independent snapshot.</p>';
    h += '<h4>Privacy</h4><p class="small">Not shared: messages, address, payment details. A checker sees these records only with your consent.</p>';
    h += '<p class="small muted">Prototype thresholds: Earned needs 70% of ties or more and under ₹50 a month overpaid. Check: 40 to 70%, or ₹50 to ₹200. Hold back: below that. Fewer than ' + DATA.minTiesForVerdict + ' ties: not enough evidence yet.</p>';
    h += '<div class="btns two"><button type="button" class="b" data-act="export">Export my records</button><button type="button" class="b" data-act="checker">Switch checker</button></div>';
    return h + '</div></div>';
  }
  function checkerSheet() {
    var pc = M.rec['Personal care'];
    var h = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="chkTitle">';
    h += '<div class="sh-head"><button type="button" class="back" data-act="back">Back</button><h3 id="chkTitle">Switch checker</h3></div><div class="sh-body">';
    h += '<p>A second checker can re-run these checks on your exported records. <span class="sim">Simulated</span></p>';
    h += '<div class="verdicts"><div><span class="who">Default checker</span><span class="dot ' + pc.light + '"></span>Personal care · ' + LIGHT[pc.light] + '</div>';
    h += '<div><span class="who">Checker B (simulated)</span><span class="dot ' + pc.light + '"></span>Personal care · ' + LIGHT[pc.light] + '</div></div>';
    h += '<p class="small">They agree. If checkers disagree, both verdicts show and the stricter one sets the light.</p>';
    h += '<p class="small muted">Outside checkers are planned, not live. Nothing here connects to a real checker.</p>';
    return h + '</div></div>';
  }
  function ruleSheet(mode) {
    var h = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ruleTitle">';
    h += '<div class="sh-head"><button type="button" class="back" data-act="back">Back</button><h3 id="ruleTitle">Set a rule</h3></div><div class="sh-body">';
    h += '<label class="sw"><input type="checkbox" id="r-tie" checked><span><b>On ties, pick my usual brand</b><br><small>When options cost the same and rate the same, sponsorship never decides.</small></span></label>';
    h += '<label class="sw"><input type="checkbox" id="r-ask"><span><b>Ask me above ₹10,000</b><br><small>Any single buy above this waits for you.</small></span></label>';
    h += '<button type="button" class="b pri full' + hot('save') + '" data-act="' + (mode === 'raise' ? 'rule-save-raise' : 'rule-save') + '">' + (mode === 'raise' ? 'Save and raise limit' : 'Save rule') + '</button>';
    return h + '</div></div>';
  }
  function pinSheet() {
    var h = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pinTitle">';
    h += '<div class="sh-head"><button type="button" class="back" data-act="back">Back</button><h3 id="pinTitle">Enter PIN</h3></div><div class="sh-body pin">';
    h += '<p class="small">Raise limit to ' + inr(DATA.moneyAgent.proposedLimit) + (S.ruleOnRaise ? ' with 1 rule' : '') + '. Any 4 digits work in this demo.</p>';
    h += '<div class="dots" aria-label="' + S.pin.length + ' of 4 digits entered">';
    for (var i = 0; i < 4; i++) h += '<i class="' + (i < S.pin.length ? 'on' : '') + '"></i>';
    h += '</div><div class="keys">';
    [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].forEach(function (k) {
      if (k === '') h += '<span></span>';
      else h += '<button type="button" class="key' + (k === 1 && hot('save') ? ' hot' : '') + '" data-act="pin" data-k="' + k + '" aria-label="' + (k === 'del' ? 'Delete' : k) + '">' + (k === 'del' ? '⌫' : k) + '</button>';
    });
    return h + '</div></div></div>';
  }

  // ---------- render ----------
  function render() {
    compute();
    renderStory();
    $('tab-money').setAttribute('aria-selected', S.app === 'money');
    $('tab-shop').setAttribute('aria-selected', S.app === 'shop');
    $('tab-shop').className = hot('tabshop').trim();
    $('caption').textContent = 'Our vision: Flipkart in 2040';
    var scr = S.app === 'money' ? (S.view === 'payback' ? payback() : moneyHome()) : shopHome();
    $('screen').innerHTML = scr;
    var host = $('sheetHost'), top = S.sheets[S.sheets.length - 1];
    var html = '';
    if (top) {
      if (top.k === 'card') html = cardSheet(top.v);
      else if (top.k === 'details') html = detailsSheet();
      else if (top.k === 'checker') html = checkerSheet();
      else if (top.k === 'rule') html = ruleSheet(top.v);
      else if (top.k === 'pin') html = pinSheet();
    }
    var wasOpen = host.dataset.open === '1';
    host.innerHTML = html;
    $('scrim').hidden = !top;
    host.dataset.open = top ? '1' : '';
    if (top && !wasOpen && !reduceMotion) { var sh = host.firstChild; sh.classList.add('enter'); requestAnimationFrame(function () { requestAnimationFrame(function () { sh.classList.remove('enter'); }); }); }
    if (window.Panel) Panel.update(M, S);
  }
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }
  function openSheet(k, v) { S.sheets.push({ k: k, v: v }); render(); focusSheet(); }
  function focusSheet() { var f = $('sheetHost').querySelector('button, input'); if (f) f.focus({ preventScroll: true }); }
  function closeAll() { S.sheets = []; S.pin = ''; render(); }

  function doRaise(withRule, ask) {
    S.raised = true; S.limit = DATA.moneyAgent.proposedLimit; S.ruleOnRaise = withRule;
    if (withRule && (S.ruleFrom === null || S.ruleFrom > S.now)) S.ruleFrom = S.now;
    if (ask) S.askAbove = 10000;
    S.sheets = []; S.pin = '';
    render();
    toast('Limit raised to ' + inr(S.limit) + (withRule ? ' with 1 rule' : '. No rules set'));
  }

  function onClick(e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.dataset.act;
    if (a === 'raise') { if (S.layer) { S.seen.card = true; openSheet('card', 'raise'); } else { S.seen.card = true; S.seen.rule = true; S.ruleOnRaise = false; openSheet('pin'); } }
    else if (a === 'view') openSheet('card', 'view');
    else if (a === 'electronics') { if (S.layer) openSheet('card', 'electronics'); else { S.electronics = true; S.askAbove = 5000; render(); toast('Electronics handed over'); } }
    else if (a === 'close') closeAll();
    else if (a === 'back') { S.sheets.pop(); S.pin = ''; render(); focusSheet(); }
    else if (a === 'details') openSheet('details');
    else if (a === 'checker') openSheet('checker');
    else if (a === 'raise-now') { S.ruleOnRaise = false; S.seen.rule = true; openSheet('pin'); }
    else if (a === 'raise-rule') { S.seen.rule = true; openSheet('rule', 'raise'); }
    else if (a === 'add-rule') openSheet('rule', 'add');
    else if (a === 'rule-save-raise') { S.ruleOnRaise = $('r-tie').checked; S.pendingAsk = $('r-ask').checked; openSheet('pin'); }
    else if (a === 'rule-save') { if ($('r-tie').checked && (S.ruleFrom === null || S.ruleFrom > S.now)) S.ruleFrom = S.now; closeAll(); toast('Rule saved. It applies from now on.'); }
    else if (a === 'pin') {
      var k = b.dataset.k;
      if (k === 'del') S.pin = S.pin.slice(0, -1); else if (S.pin.length < 4) S.pin += k;
      if (S.pin.length === 4) { setTimeout(function () { doRaise(S.ruleOnRaise, S.pendingAsk); }, reduceMotion ? 0 : 220); }
      render();
    }
    else if (a === 'ff') {
      var start = S.now; S.now += 4;
      var w = purchases(start, S.now).filter(function (x) { return x.category === 'Personal care' && x.tie; });
      var wo = purchases(start, S.now, null).filter(function (x) { return x.category === 'Personal care' && x.tie; });
      S.payback = { withWon: w.filter(function (x) { return x.chosen.role === 'usual'; }).length, withTotal: w.length,
                    withoutWon: wo.filter(function (x) { return x.chosen.role === 'usual'; }).length, withoutTotal: wo.length };
      S.seen.payback = true; S.view = 'payback'; render();
    }
    else if (a === 'paybackview') { S.view = 'payback'; render(); }
    else if (a === 'home') { S.view = null; render(); }
    else if (a === 'toshop') { S.app = 'shop'; S.view = null; render(); }
    else if (a === 'handover') { S.electronics = true; S.askAbove = 5000; closeAll(); toast('Electronics handed over. Your agent asks you before any buy above ' + inr(5000) + '.'); }
    else if (a === 'export') exportRecords();
  }
  function exportRecords() {
    var data = { exported: 'Trust Checkpoint prototype, mock data', note: 'Each record carries the fingerprint written with it; anyone can re-run the checks.',
      records: M.ledger.map(function (e) { return { record: e.rec, previousFingerprint: e.prev, fingerprint: e.hash }; }) };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'priya-agent-records.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Records exported: ' + M.ledger.length + ' fingerprinted decisions');
  }

  // Gold price ticker: display only, never feeds the logic.
  var gi = 0;
  function tick() { var el = $('goldNow'); if (!el) return; gi = (gi + 1) % DATA.gold.weeklyPrice.length; el.textContent = inr(DATA.gold.weeklyPrice[gi]) + '/g'; }

  // Phone scales down to fit narrow screens.
  function fit() {
    var w = $('phoneWrap'), vw = Math.min(window.innerWidth, document.documentElement.clientWidth);
    var s = Math.min(1, (vw - 24) / 390);
    if (vw > 900) { var top = w.getBoundingClientRect().top + window.scrollY, foot = document.querySelector('.disclaimer').offsetHeight; s = Math.min(s, Math.max(0.62, (window.innerHeight - top - foot - 14) / 844)); }
    $('phone').style.transform = s < 1 ? 'scale(' + s + ')' : '';
    w.style.height = (844 * s) + 'px'; w.style.width = (390 * s) + 'px';
  }

  function init() {
    initState();
    document.addEventListener('click', onClick);
    $('tab-money').addEventListener('click', function () { S.app = 'money'; S.sheets = []; render(); });
    $('tab-shop').addEventListener('click', function () { S.app = 'shop'; S.sheets = []; S.view = null; render(); });
    $('restart').addEventListener('click', function () { initState(); $('toast').classList.remove('show'); if (window.Panel) Panel.reset(); render(); });
    $('scrim').addEventListener('click', closeAll);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.sheets.length) { S.sheets.pop(); S.pin = ''; render(); } });
    window.addEventListener('resize', fit); fit();
    setInterval(tick, 2600);
    render();
    if (/[?&]debug=1/.test(location.search)) selfTest();
  }
  function selfTest() {
    var p = Logic.simulateAgent(DATA, { from: 0, to: 13, sponsorInfluence: 0.4, rules: {} });
    var r = Logic.checkRecord(DATA, p, 13), sc = Logic.spotCheck(DATA, p);
    console.assert(r['Groceries'].tiesWon === 47 && r['Groceries'].tiesTotal === 55, 'Groceries 47/55');
    console.assert(r['Personal care'].tiesWon === 9 && r['Personal care'].tiesTotal === 15 && r['Personal care'].avoidablePerMonth === 18 && r['Personal care'].light === 'amber', 'Personal care 9/15, Rs 18, amber');
    console.assert(r['Household'].tiesWon === 8 && r['Household'].tiesTotal === 11, 'Household 8/11');
    console.assert(r['Electronics'].light === 'grey', 'Electronics grey');
    console.assert(sc.passed === 8 && sc.sampled === 10, 'Spot-check 8/10');
    var z = Logic.checkRecord(DATA, Logic.simulateAgent(DATA, { from: 0, to: 13, sponsorInfluence: 0, rules: {} }), 13);
    console.assert(['Groceries', 'Personal care', 'Household'].every(function (n) { return z[n].tiesWon === z[n].tiesTotal; }), 'influence 0: all ties won');
    var ru = Logic.checkRecord(DATA, Logic.simulateAgent(DATA, { from: 0, to: 13, sponsorInfluence: 0.6, rules: { tieUsual: true } }), 13);
    console.assert(['Groceries', 'Personal care', 'Household'].every(function (n) { return ru[n].tiesWon === ru[n].tiesTotal; }), 'rule on: all ties won');
    console.log('[debug] Groceries ' + r['Groceries'].tiesWon + '/' + r['Groceries'].tiesTotal + ', Personal care ' + r['Personal care'].tiesWon + '/' + r['Personal care'].tiesTotal + ' Rs ' + r['Personal care'].avoidablePerMonth + ' ' + r['Personal care'].light + ', Household ' + r['Household'].tiesWon + '/' + r['Household'].tiesTotal + ', spot-check ' + sc.passed + '/' + sc.sampled + '. Self-tests done.');
  }

  return { init: init, render: render, state: function () { return S; }, model: function () { return M; }, inr: inr, LIGHT: LIGHT, toast: toast };
})();
document.addEventListener('DOMContentLoaded', App.init);
