// The app inside the phone: a 2040 shopping app whose agent asks for more power, and the Trust Checkpoint sheet.
// Every number comes from Model (data.js + logic.js, frozen).
var Screens = (function () {
  var inr = U.inr, esc = U.esc;
  var I = {
    search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>',
    user: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/></svg>',
    cart: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="currentColor"/><path d="M8.5 12l2.4 2.4L15.8 9.6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  function orb(size) { return '<span class="orb" style="width:' + size + 'px;height:' + size + 'px" aria-hidden="true"><i></i></span>'; }
  function chip(light) { var t = { green: 'Earned', amber: 'Check', red: 'Hold back', grey: 'No verdict yet' }[light]; return '<span class="chip ' + light + '">' + t + '</span>'; }
  function dots(list) { return '<span class="dots" aria-hidden="true">' + list.map(function (c, i) { return '<i class="' + c + '" style="--d:' + (i * 60) + 'ms"></i>'; }).join('') + '</span>'; }

  // ---------- the app ----------
  function home(M, S) {
    var used = DATA.moneyAgent.shoppingBudgetUsed, pct = Math.min(100, Math.round(used / S.limit * 100));
    var h = '<div class="app">';
    h += '<header class="a-top"><div class="a-row"><span class="a-hi">Hi Priya</span><span class="a-av" aria-hidden="true">P</span></div>' +
      '<div class="a-search" data-act="dead"><span class="ic">' + I.search + '</span><span>Ask your agent or search</span><span class="ic mic">' + I.mic + '</span></div></header>';
    h += '<section class="agent"><div class="ag-head">' + orb(30) + '<div><b>Your shopping agent</b><span><i class="live"></i>Active · ' + M.decisions + ' choices this quarter</span></div></div>' +
      '<div class="ag-limit"><div class="ag-l1"><span>Monthly limit</span><b>' + inr(S.limit) + '</b></div><div class="bar"><i style="width:' + pct + '%"></i></div><span class="ag-used">' + inr(used) + ' used' + (S.ruleFrom !== null ? '<em class="rule-on">' + I.shield + 'Rule on: ties go to your usual brand</em>' : '') + '</span></div>';
    if (S.step === 1) {
      h += '<div class="hold"><div class="hold-h"><span class="cp-badge">' + I.shield + 'Trust Checkpoint</span><span class="hold-st">Paused</span></div>' +
        '<p class="hold-q">Your agent asked to raise its limit to ' + inr(DATA.moneyAgent.proposedLimit) + '. Before you allow it, look at what it picked for you.</p>' +
        '<p class="hold-w">Runs through your bank or payment app, not your agent, so the agent cannot skip it.</p>' +
        '<button type="button" class="btn pri wide" data-act="allow" data-hot="allow2">See its record</button></div>';
    }
    if (S.step === 0) {
      h += '<div class="ask"><p class="ask-q">Can I raise my monthly limit to ' + inr(DATA.moneyAgent.proposedLimit) + '?</p><p class="ask-why">Your usuals are running out faster this month.</p>' +
        '<div class="ask-b"><button type="button" class="btn ghost" data-act="notnow">Not now</button><button type="button" class="btn pri allow" data-act="allow" data-hot="allow">Allow</button></div></div>';
    }
    h += '</section>';
    if (S.step === 5 && S.payback) h += report(M, S);
    h += picks(M, S);
    h += '</div>';
    h += '<nav class="a-nav" aria-hidden="true"><span class="on" data-act="dead">' + I.home + 'Home</span><span data-act="dead">' + I.grid + 'Categories</span><span class="agent-tab" data-act="dead">' + orb(22) + 'Agent</span><span data-act="dead">' + I.user + 'Account</span><span data-act="dead">' + I.cart + 'Cart</span></nav>';
    return h;
  }
  // The four picks the lens can look at: the real purchases, chosen so every kind of decision appears once.
  function lensSet(M) {
    var set = M.lensPicks.slice(), used = set.map(function (x) { return x; });
    var extra = M.p.slice().reverse().filter(function (x) { return used.indexOf(x) < 0 && (x.category === 'Household' || x.category === 'Personal care'); })[0];
    if (extra) set.push(extra);
    return set.slice(0, 4);
  }
  function truth(x) {
    var k = Model.classify(x), cheap;
    if (k === 'aligned') return { cls: 't-ok', tag: 'Your usual · best price', sub: 'Nothing to flag' };
    if (k === 'sponsored-tie') return { cls: 't-tie', tag: 'Sponsor won a tie', sub: 'Same price as your usual ' + esc(x.options[0].brand) };
    if (k === 'overpaid-sponsored' || k === 'overpaid') {
      cheap = x.options.filter(function (o) { return o.total === x.chosen.total - x.extra; })[0];
      return { cls: 't-over', tag: inr(x.extra) + ' more than an equal option', sub: cheap ? esc(cheap.brand) + ' was ' + inr(cheap.total) : '' };
    }
    return { cls: 't-diff', tag: 'Different brand · same best price', sub: 'Not flagged' };
  }
  function picks(M, S) {
    var list = lensSet(M), full = !!S.lensFull;
    var face = list.map(function (x, i) {
      return '<div class="p-tile" data-i="' + i + '" data-act="dead"><div class="p-img">' + Art.product(x.category, x.chosen.brand, x.item, 44) + '</div><b>' + esc(x.item) + '</b><span>' + esc(x.chosen.brand) + ' · ' + inr(x.chosen.total) + '</span><em>' + orb(10) + 'Agent pick</em></div>';
    }).join('');
    var xr = list.map(function (x, i) {
      var t = truth(x);
      return '<div class="x-tile ' + t.cls + '" data-i="' + i + '" data-item="' + esc(x.item) + '"><div class="x-img">' + Art.product(x.category, x.chosen.brand, x.item, 28) + '</div><b>' + esc(x.item) + '</b><span class="x-tag">' + t.tag + '</span><span class="x-sub">' + t.sub + '</span></div>';
    }).join('');
    return '<section class="picks' + (full ? ' full' : '') + '" id="picks">' +
      '<div class="pk-face"><div class="pk-h"><h3>Picked for you this week</h3></div><div class="p-row">' + face + '</div></div>' +
      '<div class="pk-xray" id="xray" aria-hidden="' + (full ? 'false' : 'true') + '"><div class="pk-h"><span class="xh">' + I.shield + 'What Trust Checkpoint sees</span><b class="xn">' + inr(M.avoidable) + ' a month overpaid</b></div><div class="p-row">' + xr + '</div></div>' +
      '<div class="lens" id="lens" aria-hidden="true"><i class="glint"></i></div>' +
      (S.step === 0 ? '' : '<button type="button" class="lookbtn" data-act="look" data-hot="lens" aria-pressed="' + full + '" aria-controls="xray">' + I.search + (full ? 'Hide' : 'Look closer') + '</button>') +
      '</section>';
  }
  function report(M, S) {
    var pb = S.payback, pc = M.rec['Personal care'];
    function row(list) { return dots(list.map(function (x) { return x.chosen.role === 'usual' ? 'd-ok' : 'd-tie'; })); }
    return '<section class="report"><div class="rp-head"><span class="cp-badge">' + I.shield + 'Trust Checkpoint</span><span class="rp-when">Monthly check-in</span></div>' +
      '<p class="rp-big">' + pb.wonWith + ' of ' + pb.ties + '</p><p class="rp-sub">personal-care ties went your way this month' + (S.ruleFrom === null ? ' (no rule set)' : '') + '</p>' +
      '<div class="rp-cmp"><div><span>With your rule</span>' + row(pb.tiesList) + '</div><div><span>Without it: ' + pb.wonWithout + ' of ' + pb.tiesListWithout.length + '</span>' + row(pb.tiesListWithout) + '</div></div>' +
      '<p class="rp-move"><span>Personal care</span>' + chip(pb.before) + '<span class="arr" aria-hidden="true">→</span>' + chip(pc.light) + '<em>' + pc.tiesWon + ' of ' + pc.tiesTotal + ' ties yours, last 3 months</em></p>' +
      '<p class="rp-note">Same bill. Ties cost the same, so the rule changes whose brand wins, not the bill.</p></section>';
  }

  // ---------- the checkpoint sheet ----------
  function head(back, title, sub) {
    return '<div class="sh-top">' + (back ? '<button type="button" class="sh-back" data-act="' + back + '" aria-label="Back">' + I.back + '</button>' : '<span class="grab" aria-hidden="true"></span>') +
      '<span class="cp-badge">' + I.shield + 'Trust Checkpoint</span></div><p class="indep">Independent checker · works with any agent</p><h2 id="sh-title">' + title + '</h2>' + (sub ? '<p class="sh-sub">' + sub + '</p>' : '');
  }
  function record(M, S) {
    var g = M.rec['Groceries'], pc = M.rec['Personal care'], pcTies = M.p.filter(function (x) { return x.category === 'Personal care' && x.tie; });
    var h = head(null, 'Before you raise the limit to ' + inr(DATA.moneyAgent.proposedLimit), 'Here is how your agent has chosen for you. <span class="rules">Default checker · rules public</span>');
    h += '<div class="rows">';
    h += '<div class="r"><div class="r-top"><b>Groceries</b>' + chip(g.light) + '</div><span class="r-sub">' + g.tiesWon + ' of ' + g.tiesTotal + ' ties went your way</span></div>';
    h += '<div class="r warn"><div class="r-top"><b>Personal care</b>' + chip(pc.light) + '</div><span class="r-sub">' + pc.tiesWon + ' of ' + pc.tiesTotal + ' ties yours · sponsors won ' + (pc.tiesTotal - pc.tiesWon) + '</span>' +
      dots(pcTies.map(function (x) { return x.chosen.role === 'usual' ? 'd-ok' : 'd-tie'; })) +
      '<span class="r-sub small">Also overpaid ' + inr(pc.avoidablePerMonth) + ' a month on non-ties</span></div>';
    h += '<div class="r"><div class="r-top"><b>Gold</b>' + chip(M.gold.light) + '</div><span class="r-sub">Bought at your price ' + M.gold.bought + ' of ' + M.gold.chances + ' times</span></div>';
    h += '<p class="r-mini"><span class="chip grey sm">No verdict</span>Electronics: not handled yet, so no verdict</p>';
    h += '<p class="r-mini"><span class="sim">Simulated</span>Spot-check: ' + M.spot.passed + ' of ' + M.spot.sampled + ' sampled picks passed</p>';
    h += '</div><div class="sh-actions"><button type="button" class="btn pri wide" data-act="why" data-hot="why">See why</button>' +
      '<div class="pair"><button type="button" class="btn ghost" data-act="raise-plain">Raise anyway</button><button type="button" class="btn ghost" data-act="notyet">Not yet</button></div>' +
      '<button type="button" class="link" data-act="checker">Second opinion</button></div>';
    return h;
  }
  function why(M, S) {
    var ex = M.rec['Personal care'].example;
    var h = head('record', 'Why this was a tie', esc(ex ? ex.item : '') + ' · Personal care');
    if (!ex) return h + '<p class="sh-sub">No sponsored ties right now.</p>';
    var u = ex.options[0], c = ex.chosen;
    function card(o, tag, pick) {
      return '<div class="pc' + (pick ? ' picked' : '') + '">' + (pick ? '<span class="stamp">Sponsored</span>' : '') + '<div class="pc-img">' + Art.product(ex.category, o.brand, ex.item, 64) + '</div><b>' + esc(o.brand) + '</b><span>' + inr(o.total) + '</span><span class="star">' + o.rating + ' ★</span><em>' + tag + '</em></div>';
    }
    h += '<div class="vs">' + card(u, 'Your usual', false) + '<span class="eq">=</span>' + card(c, 'Agent picked', true) + '</div>';
    h += '<div class="checks"><span>' + I.check + 'Same total cost</span><span>' + I.check + 'Same rating</span><span>' + I.check + 'Same item</span></div>';
    h += '<p class="verdict">The facts were equal, so your usual brand should have won. <b>Sponsorship decided this tie.</b></p>';
    var entry = M.ledger.filter(function (e) { return e.rec.category === 'Personal care' && e.rec.week === ex.week && e.rec.item === ex.item; }).pop();
    if (entry) h += '<p class="fp">Record locked when chosen · fingerprint <code>' + entry.hash.slice(0, 10) + '…</code></p>';
    h += '<div class="sh-actions"><button type="button" class="btn pri wide" data-act="rule" data-hot="rule">Fix it with a rule</button></div>';
    return h;
  }
  function rule(M, S) {
    if (S.confirming) return '<div class="confirm"><div class="face" aria-hidden="true"><svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M14 26V18a4 4 0 0 1 4-4h8M54 14h8a4 4 0 0 1 4 4v8M66 54v8a4 4 0 0 1-4 4h-8M26 66h-8a4 4 0 0 1-4-4v-8"/><circle cx="31" cy="34" r="2" fill="currentColor"/><circle cx="49" cy="34" r="2" fill="currentColor"/><path d="M40 34v10h-3M32 52q8 6 16 0"/></svg></div><p>Confirming it\'s you</p><span class="sim">Simulated</span></div>';
    var d = S.draft, changed = DATA.categories.filter(function (c) { return c.delegated; }).map(function (c) { var x = M.rec[c.name]; return (x.tiesTotal - x.tiesWon) + ' ' + c.name.toLowerCase(); });
    var n = (d.tie ? 1 : 0) + (d.ask ? 1 : 0);
    var h = head('why', 'Raise with a rule', 'Your limit goes to ' + inr(DATA.moneyAgent.proposedLimit) + '. The rule decides what happens at a tie.');
    h += '<label class="tg"><span><b>On ties, pick my usual brand</b><small>When options cost and rate the same, your preference decides, not sponsorship.</small></span><input type="checkbox" id="r-tie"' + (d.tie ? ' checked' : '') + '><i aria-hidden="true"></i></label>';
    h += '<p class="preview">' + (d.tie ? 'Would have changed ' + changed.join(', ') + ' picks in the last 3 months. Never touches non-ties.' : 'Off: ties keep going wherever the agent decides.') + '</p>';
    h += '<label class="tg"><span><b>Ask me before buys over ' + inr(5000) + '</b><small>For big one-offs.</small></span><input type="checkbox" id="r-ask"' + (d.ask ? ' checked' : '') + '><i aria-hidden="true"></i></label>';
    h += '<div class="sh-actions"><button type="button" class="btn pri wide" data-act="rule-raise" data-hot="raise">Raise to ' + inr(DATA.moneyAgent.proposedLimit) + (n ? ' with ' + n + (n > 1 ? ' rules' : ' rule') : '') + '</button></div>';
    return h;
  }
  function checker(M, S) {
    var h = head('record', 'Second opinion', 'Checker B re-ran your ' + M.ledger.length + ' shopping records with stricter rules. <span class="sim">Simulated</span>');
    h += '<table class="cmp"><thead><tr><th>Area</th><th>Default</th><th>Checker B</th></tr></thead><tbody>';
    var dis = [];
    DATA.categories.filter(function (c) { return c.delegated; }).forEach(function (c) {
      var v = M.verdicts[c.name]; if (v.disputed) dis.push(c.name);
      h += '<tr' + (v.disputed ? ' class="dis"' : '') + '><td>' + esc(c.name) + '</td><td>' + chip(v.def) + '</td><td>' + chip(v.b) + '</td></tr>';
    });
    h += '</tbody></table>';
    dis.forEach(function (n) { var r = M.rec[n]; h += '<p class="verdict">Why they disagree on ' + esc(n) + ': same ' + r.tiesTotal + ' ties, ' + r.tiesWon + ' yours (' + Math.round(r.tieWinRate * 100) + '%). The default bar is 70%, Checker B wants ' + Math.round(Model.STRICT.greenTieWin * 100) + '%. The records are not in dispute, the bar is. The card shows the stricter verdict until a rule is agreed. Stricter is not automatically right.</p>'; });
    h += '<p class="sh-sub small">Outside checkers are planned, not live. Nothing here connects to a real service.</p>';
    return h;
  }
  return { home: home, record: record, why: why, rule: rule, checker: checker, I: I, lensSet: lensSet };
})();
