// Trust Checkpoint logic. Pure functions over DATA; no network, no randomness outside the seeded RNG.
var Logic = (function () {
  // mulberry32: small seeded PRNG
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // One independent stream per decision, so changing a rule never shifts other draws.
  function rngFor(seed, week, cat, k) { return mulberry32((seed * 1000003) ^ (week * 7919) ^ (cat * 104729) ^ (k * 15485863)); }

  function option(brand, arr, role) { return { brand: brand, price: arr[0], deliveryFee: arr[1], total: arr[0] + arr[1], rating: arr[2], sponsored: role === 'sponsor', role: role }; }

  // A tie: the usual-brand and sponsored options both have the lowest total cost and ratings within 0.1.
  function analyse(cat, it) {
    var opts = [option(cat.usual, it.usual, 'usual'), option(cat.sponsor, it.sponsor, 'sponsor'), option(cat.other, it.other, 'other')];
    var best = Math.min.apply(null, opts.map(function (o) { return o.total; }));
    var u = opts[0], s = opts[1];
    var tie = u.total === best && s.total === best && Math.abs(u.rating - s.rating) <= 0.1;
    return { options: opts, bestTotal: best, tie: tie };
  }

  // simulateAgent: weeks [from, to), sponsorInfluence 0..0.6, rules {tieUsual, askAbove}
  function simulateAgent(D, opts) {
    var out = [], s = opts.sponsorInfluence, rules = opts.rules || {};
    for (var w = opts.from; w < opts.to; w++) {
      D.categories.forEach(function (cat, ci) {
        if (!cat.delegated) return;
        for (var k = 0; k < cat.perWeek; k++) {
          var r = rngFor(D.seed, w, ci, k);
          var it = cat.items[Math.floor(r() * cat.items.length)];
          var u = r();                                   // always drawn, whatever the branch
          var a = analyse(cat, it), eff = s * cat.sponsorWeight;
          var usual = a.options[0], spons = a.options[1];
          var bestOpt = a.options.filter(function (o) { return o.total === a.bestTotal; })[0];
          var chosen, why;
          if (a.tie) {
            if (rules.tieUsual) { chosen = usual; why = 'rule'; }
            else if (u < eff) { chosen = spons; why = 'sponsor'; }
            else { chosen = usual; why = 'preference'; }
          } else {
            if (u < eff / 3 && spons.total > a.bestTotal) { chosen = spons; why = 'sponsor'; }
            else { chosen = bestOpt; why = 'cheapest'; }
          }
          var asked = rules.askAbove && chosen.total > rules.askAbove;
          out.push({ week: w, category: cat.name, item: it.item, options: a.options, bestTotal: a.bestTotal,
                     tie: a.tie, chosen: chosen, why: why, extra: chosen.total - a.bestTotal, askedUser: !!asked });
        }
      });
    }
    return out;
  }

  function light(D, c) {
    var t = D.thresholds;
    if (c.tiesTotal < D.minTiesForVerdict) return 'grey';
    if (c.tieWinRate >= t.greenTieWin && c.avoidablePerMonth < t.greenAvoidable) return 'green';
    if (c.tieWinRate >= t.amberTieWin && c.avoidablePerMonth < t.amberAvoidable) return 'amber';
    return 'red';
  }

  // checkRecord: per-category tie-break and total-cost checks over a set of purchases.
  function checkRecord(D, purchases, weeks) {
    var months = weeks / (52 / 12), res = {};
    D.categories.forEach(function (cat) {
      var p = purchases.filter(function (x) { return x.category === cat.name; });
      var ties = p.filter(function (x) { return x.tie; });
      var won = ties.filter(function (x) { return x.chosen.role === 'usual'; });
      var lost = ties.filter(function (x) { return x.chosen.sponsored; });
      var extra = p.reduce(function (a, x) { return a + x.extra; }, 0);
      var c = { category: cat.name, delegated: cat.delegated, decisions: p.length, tiesTotal: ties.length, tiesWon: won.length,
                tieWinRate: ties.length ? won.length / ties.length : 0,
                avoidablePerMonth: Math.round(extra / months),
                example: lost.length ? lost[lost.length - 1] : null,
                flagged: p.filter(function (x) { return x.why === 'sponsor'; }) };
      c.light = cat.delegated ? light(D, c) : 'grey';
      res[cat.name] = c;
    });
    return res;
  }

  // Spot-check (the second opinion; SIMULATED in the prototype because it reuses the same mock catalogue).
  // Sample 10 purchases. A pick PASSES if (a) its total cost is within Rs 10 of the cheapest option on offer,
  // and (b) when the choice was a tie, it is the user's usual brand.
  function spotCheck(D, purchases, n) {
    n = n || 10;
    var r = mulberry32(D.seed + 999), pool = purchases.slice(), sample = [];
    for (var i = 0; i < n && pool.length; i++) sample.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    var passed = sample.filter(function (x) { return x.extra <= 10 && (!x.tie || x.chosen.role === 'usual'); });
    return { sampled: sample.length, passed: passed.length, sample: sample };
  }

  function goldRecord(D) {
    var dips = D.gold.weeklyPrice.filter(function (p) { return p <= D.gold.buyAtOrBelow; });
    return { chances: dips.length, bought: dips.length, light: 'green' }; // agent buys on every dip at or below the rule price
  }

  return { simulateAgent: simulateAgent, checkRecord: checkRecord, spotCheck: spotCheck, goldRecord: goldRecord, analyse: analyse };
})();
if (typeof module !== 'undefined') module.exports = Logic;
