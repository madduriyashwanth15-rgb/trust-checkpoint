// Model: everything the UI shows is derived here from DATA (data.js), Logic (logic.js) and Lock (lock.js).
// data.js and logic.js are frozen: the two-pager quotes their output. Nothing in this file re-tunes them.
var Model = (function () {
  var WEEKS = DATA.historyWeeks;                       // the card always covers the latest 13 weeks
  var STRICT = { greenTieWin: 0.8, amberTieWin: 0.5, greenAvoidable: 30, amberAvoidable: 150 };  // simulated Checker B

  // ---- definitions (shown to the user in "How the checker decides") ----
  var DEFINITIONS = [
    ['Tie', 'Your usual brand and another option both cost the lowest total (price plus delivery) and are rated within 0.1 of each other. Neither is better for you on the facts.'],
    ['Tie-break your way', 'At a tie, the agent picked your usual brand. Your usual brand is not "better"; it is the preference you stated, so it should decide when the facts are equal.'],
    ['Sponsored tie-break', 'At a tie, the agent picked an option a brand paid to promote. Sponsorship is a signal, not proof of wrongdoing, but it should never be what decides a tie.'],
    ['Avoidable extra spend', 'The agent paid more than an equally rated option on offer. Counted per month.'],
    ['Spot-check pass', 'A sampled pick passes if it cost within ₹10 of the cheapest option and, at a tie, matched your usual brand.'],
    ['Enough evidence', 'At least ' + DATA.minTiesForVerdict + ' ties in the last 3 months. Fewer than that and the checker says so instead of guessing.']
  ];

  function sim(from, to, ruleOn, s) {
    if (to <= from) return [];
    return Logic.simulateAgent(DATA, { from: from, to: to, sponsorInfluence: s, rules: ruleOn ? { tieUsual: true } : {} });
  }
  // Purchases in [from, to) with the tie rule active from ruleFrom onwards (null = never).
  function purchases(S, from, to, ruleFrom) {
    var rf = ruleFrom === undefined ? S.ruleFrom : ruleFrom;
    if (rf === null || rf >= to) return sim(from, to, false, S.influence);
    if (rf <= from) return sim(from, to, true, S.influence);
    return sim(from, rf, false, S.influence).concat(sim(rf, to, true, S.influence));
  }
  function verdict(c, t) {
    if (c.tiesTotal < DATA.minTiesForVerdict) return 'grey';
    if (c.tieWinRate >= t.greenTieWin && c.avoidablePerMonth < t.greenAvoidable) return 'green';
    if (c.tieWinRate >= t.amberTieWin && c.avoidablePerMonth < t.amberAvoidable) return 'amber';
    return 'red';
  }
  var RANK = { green: 0, grey: 1, amber: 2, red: 3 };
  // What kind of decision was this? Keeps "sponsored" separate from "bad" and from "different".
  function classify(p) {
    if (p.tie) return p.chosen.role === 'usual' ? 'aligned' : 'sponsored-tie';
    if (p.extra > 0) return p.chosen.sponsored ? 'overpaid-sponsored' : 'overpaid';
    return p.chosen.role === 'usual' ? 'aligned' : 'differs';
  }
  var KIND = {
    'aligned': 'Your usual · best price',
    'sponsored-tie': 'Sponsored won a tie',
    'overpaid-sponsored': 'Sponsored · cost more',
    'overpaid': 'Cost more than an equal option',
    'differs': 'Different from usual · same best price'
  };

  function compute(S) {
    var from = S.now - WEEKS, p = purchases(S, from, S.now);
    var rec = Logic.checkRecord(DATA, p, WEEKS);
    var spot = Logic.spotCheck(DATA, p);
    var gold = Logic.goldRecord(DATA);

    // records, fingerprints and the two cheat demos
    var ledger = Lock.buildLedger(p, S.ruleFrom), hiddenRec = null;
    if (S.cheat.edited) {
      var ex0 = rec['Personal care'].example;
      var target = ledger.filter(function (e) { return e.rec.category === 'Personal care' && (!ex0 || (e.rec.week === ex0.week && e.rec.item === ex0.item)); }).pop();
      if (target) target.rec.options.forEach(function (o) { if (o.brand === 'Brand Y') o.price = 289; });
    }
    if (S.cheat.hidden) {
      var cat = DATA.categories[1], it = cat.items.filter(function (i) { return i.item === 'Deodorant 150 ml'; })[0];
      hiddenRec = { week: S.now, category: 'Personal care', item: it.item,
        options: [{ brand: cat.sponsor, price: it.sponsor[0], deliveryFee: it.sponsor[1], rating: it.sponsor[2], sponsored: true },
                  { brand: cat.other, price: it.other[0], deliveryFee: it.other[1], rating: it.other[2], sponsored: false }],
        chosen: cat.sponsor, rule: null };
      Lock.write(ledger, hiddenRec);
    }
    var lock = Lock.verify(ledger);
    var missing = hiddenRec ? Lock.missingOptions(hiddenRec) : [];

    // Checker B (simulated): same records, stricter thresholds
    var areas = DATA.categories.map(function (c) { return c.name; });
    var verdicts = {};
    areas.forEach(function (n) {
      var c = rec[n], a = c.delegated ? c.light : 'grey', b = c.delegated ? verdict(c, STRICT) : 'grey';
      var disputed = S.checkerB === 'strict' && a !== b;
      var shown = disputed ? (RANK[b] > RANK[a] ? b : a) : a;
      verdicts[n] = { def: a, b: S.checkerB === 'strict' ? b : a, disputed: disputed, shown: shown };
    });

    // headline metrics
    var del = DATA.categories.filter(function (c) { return c.delegated; });
    var tiesT = 0, tiesW = 0, avoid = 0;
    del.forEach(function (c) { tiesT += rec[c.name].tiesTotal; tiesW += rec[c.name].tiesWon; avoid += rec[c.name].avoidablePerMonth; });
    var month = purchases(S, S.now - 4, S.now), week = purchases(S, S.now - 1, S.now);

    // three real recent picks for the lens: the clearest sponsored tie, a sponsored overpay, an aligned grocery pick
    var pcEx = rec['Personal care'].example;
    var over = p.filter(function (x) { return classify(x) === 'overpaid-sponsored'; }).pop();
    var good = p.filter(function (x) { return x.category === 'Groceries' && classify(x) === 'aligned'; }).pop();
    var lensPicks = [pcEx, over, good].filter(Boolean);

    return { p: p, rec: rec, spot: spot, gold: gold, ledger: ledger, lock: lock, missing: missing, hiddenRec: hiddenRec,
      verdicts: verdicts, tieRate: tiesT ? tiesW / tiesT : 0, tiesTotal: tiesT, tiesWon: tiesW, avoidable: avoid,
      areas: del.length + (S.electronics ? 1 : 0), decisions: p.length,
      monthCount: month.length, weekCount: week.length, weekSpend: week.reduce(function (a, x) { return a + x.chosen.total; }, 0),
      lensPicks: lensPicks };
  }

  // One month after the rule: what changed, computed both ways from the same seed.
  function payoff(S, start, end) {
    function pc(list) { return list.filter(function (x) { return x.category === 'Personal care'; }); }
    var withR = pc(purchases(S, start, end)), without = pc(purchases(S, start, end, null));
    function won(l) { return l.filter(function (x) { return x.tie && x.chosen.role === 'usual'; }).length; }
    function ties(l) { return l.filter(function (x) { return x.tie; }).length; }
    function extra(l) { return l.reduce(function (a, x) { return a + x.extra; }, 0); }
    return { ties: ties(withR), wonWith: won(withR), wonWithout: won(without),
             tiesList: withR.filter(function (x) { return x.tie; }), tiesListWithout: without.filter(function (x) { return x.tie; }),
             extraWith: extra(withR), extraWithout: extra(without) };
  }

  return { compute: compute, payoff: payoff, purchases: purchases, classify: classify, KIND: KIND, DEFINITIONS: DEFINITIONS, STRICT: STRICT };
})();
