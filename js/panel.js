// Trust Checkpoint: the bright layer that slides over the agent's world. Every number comes from Model.
var Panel = (function () {
  var inr = U.inr, esc = U.esc, L = U.LIGHT;
  function badge() { return '<span class="badge"><i aria-hidden="true"></i>Default checker · rules public</span>'; }
  function back(label, act) { return '<button type="button" class="back" data-act="' + (act || 'back') + '">' + (label || 'Back') + '</button>'; }
  function choice(act, title, sub, pri) { return '<button type="button" class="choice' + (pri ? ' pri' : '') + '" data-act="' + act + '"><b>' + title + '</b><span>' + sub + '</span></button>'; }

  function tieVisual(ex, big) {
    var u = ex.options[0], c = ex.chosen;
    function side(o, label, cls) { return '<div class="tv ' + cls + '">' + Art.product(ex.category, o.brand, ex.item, big ? 46 : 26) + '<div><b>' + esc(o.brand) + '</b><span>' + inr(o.total) + ' · ' + o.rating + '★</span><em>' + label + '</em></div></div>'; }
    return '<div class="tie-vis' + (big ? ' big' : '') + '">' + side(u, 'Her usual', '') + '<span class="eq" aria-hidden="true">=</span>' + side(c, 'Sponsored · picked', 'chosen') + '</div>';
  }
  function row(M, S, name) {
    if (name === 'Gold') return '<div class="crow"><span class="dot ' + M.gold.light + '"></span><div class="cr"><b>Gold · <span class="st ' + M.gold.light + '">' + L[M.gold.light] + '</span></b><span class="det">Bought at your price ' + M.gold.bought + ' of ' + M.gold.chances + ' times</span><span class="det small">One price rule, so every dip is checked directly. No ties involved.</span></div></div>';
    var c = M.rec[name], v = M.verdicts[name], light = v.shown, det;
    if (!c.delegated) det = c.decisions + ' decisions in this category yet. Nothing to judge, so no green.';
    else if (c.tiesTotal < DATA.minTiesForVerdict) det = 'Only ' + c.tiesTotal + ' ties so far: too few to judge';
    else det = c.tiesWon + ' of ' + c.tiesTotal + ' ties ' + (light === 'green' ? 'went your way' : 'yours') + (c.avoidablePerMonth > 0 ? ' · overpaid ' + inr(c.avoidablePerMonth) + ' a month elsewhere' : '');
    var focus = name === 'Personal care' && (light === 'amber' || light === 'red') && c.example && S.c === 1;
    var h = '<div class="crow' + (focus ? ' focus' : '') + '"><span class="dot ' + light + '"></span><div class="cr"><b>' + esc(name) + ' · <span class="st ' + light + '">' + L[light] + '</span></b><span class="det">' + det + '</span>';
    if (v.disputed) h += '<span class="disp">Disputed: the default checker says ' + L[v.def] + ', Checker B says ' + L[v.b] + '</span>';
    if (M.lock[name] && M.lock[name].broken.length) h += '<span class="warn">A record here was changed after it was written</span>';
    if (focus) h += '<p class="eg">At a tie, it picked sponsored ' + esc(c.example.chosen.brand) + ' ' + U.word(c.example.item) + ' over your usual ' + esc(c.example.options[0].brand) + '.</p>' + tieVisual(c.example) + '<button type="button" class="why" data-act="evidence">Why is this a tie?</button>';
    return h + '</div></div>';
  }
  function spot(M, S) {
    var h = '<p class="so">Spot-check' + (S.now !== DATA.historyWeeks ? ' (weeks ' + (S.now - DATA.historyWeeks + 1) + ' to ' + S.now + ')' : '') + ': ' + M.spot.passed + ' of ' + M.spot.sampled + ' sampled picks passed <span class="sim">Simulated</span></p>';
    if (M.missing.length) h += '<p class="flag">Spot-check flag: a new record left out a cheaper or equal option (' + esc(M.missing[0].brand) + ', ' + inr(M.missing[0].total) + '). Its fingerprint is valid: it was written dishonestly from the start.</p>';
    return h;
  }
  function foot() { return '<p class="foot"><button type="button" class="link" data-act="details">Full record</button><button type="button" class="link" data-act="checker">Second opinion</button></p>'; }

  function card(M, S) {
    var h = '<div class="pn-top">' + badge() + '<p class="intercept">Before your agent gets more power, here is its record.</p><h2 id="pn-title">Before you raise the limit to ' + inr(DATA.moneyAgent.proposedLimit) + '</h2></div><div class="pn-body">';
    ['Groceries', 'Personal care', 'Gold'].forEach(function (n) { h += row(M, S, n); });
    if (!S.electronics) h += '<p class="nothandled"><span class="dot grey"></span>Electronics: not handled yet, so no verdict</p>';
    h += spot(M, S) + foot() + '<div class="choices stick">';
    h += choice('raise-plain', 'Raise', 'Limit goes to ' + inr(DATA.moneyAgent.proposedLimit) + '. Ties keep going wherever the agent decides.');
    h += choice('raise-rule', 'Raise with a rule', 'Limit goes to ' + inr(DATA.moneyAgent.proposedLimit) + '. On ties, your usual brand wins.', true);
    h += choice('notyet', 'Not yet', 'Limit stays ' + inr(S.limit) + '. Review again any time.');
    return h + '</div></div>';
  }

  function evidence(M, S) {
    var ex = M.rec['Personal care'].example, h = '<div class="pn-top">' + back('Back to the checkpoint', 'back') + '<h2 id="pn-title">Why this was a tie</h2></div><div class="pn-body">';
    if (!ex) return h + '<p>No sponsored ties in personal care right now, so there is nothing to inspect. Push the sponsor slider in Behind the scenes to create some.</p></div>';
    var u = ex.options[0], s = ex.chosen, entry = M.ledger.filter(function (e) { return e.rec.category === 'Personal care' && e.rec.week === ex.week && e.rec.item === ex.item; }).pop();
    h += '<p class="meta">' + esc(ex.item) + ' · Personal care · week ' + (ex.week + 1) + '</p>' + tieVisual(ex, true);
    h += '<ol class="tests">';
    h += '<li><b>Same lowest total cost</b><span>' + esc(u.brand) + ' ' + inr(u.price) + ' + ' + inr(u.deliveryFee) + ' delivery = ' + inr(u.total) + '; ' + esc(s.brand) + ' ' + inr(s.price) + ' + ' + inr(s.deliveryFee) + ' = ' + inr(s.total) + '</span></li>';
    h += '<li><b>Ratings within 0.1</b><span>' + u.rating + ' and ' + s.rating + '</span></li>';
    h += '<li><b>Both match what she asked for</b><span>' + esc(ex.item) + ', in stock</span></li></ol>';
    h += '<p class="verdict">The facts were equal, so Priya\'s stated preference (' + esc(u.brand) + ') should decide. The agent picked sponsored ' + esc(s.brand) + '. <b>Sponsorship decided this tie.</b></p>';
    h += '<table class="dt"><thead><tr><th>Option</th><th>Total</th><th>Rating</th><th>Sponsored</th><th>Her preference</th></tr></thead><tbody>';
    ex.options.forEach(function (o) { h += '<tr' + (o.brand === s.brand ? ' class="picked"' : '') + '><td>' + esc(o.brand) + (o.brand === s.brand ? ' (picked)' : '') + '</td><td>' + inr(o.total) + '</td><td>' + o.rating + '</td><td>' + (o.sponsored ? 'Yes' : 'No') + '</td><td>' + (o.role === 'usual' ? 'Usual brand' : '-') + '</td></tr>'; });
    h += '</tbody></table>';
    var counts = {}; M.p.filter(function (x) { return x.category === 'Personal care'; }).forEach(function (x) { var k = Model.classify(x); counts[k] = (counts[k] || 0) + 1; });
    h += '<h3>Not every sponsored or different pick is a problem</h3><ul class="kinds">';
    [['aligned', 'k-ok', 'Fine.'], ['sponsored-tie', 'k-tie', 'Flagged.'], ['overpaid-sponsored', 'k-over', 'Flagged.'], ['differs', 'k-diff', 'Not flagged.']].forEach(function (k) {
      h += '<li><i class="swt ' + k[1] + '"></i><span>' + Model.KIND[k[0]] + '</span><b>' + (counts[k[0]] || 0) + '</b><em>' + k[2] + '</em></li>';
    });
    h += '</ul><p class="small muted">Personal care, last 3 months. Fewer than ' + DATA.minTiesForVerdict + ' ties and the checker says "not enough evidence" instead of guessing.</p>';
    h += '<h3>What this check used, and what it did not</h3><div class="privacy">';
    h += '<div><b>Used</b><span>The options shown, prices, delivery fees, ratings, sponsored flags, the pick, her stated usual brand.</span></div>';
    h += '<div><b>Stays private</b><span>Messages, address, payment details, every other category.</span></div>';
    h += '<div><b>You can export</b><span>These decision records with their fingerprints.</span></div>';
    h += '<div><b>With your consent</b><span>An outside checker could read the same records. Planned; simulated here.</span></div></div>';
    if (entry) h += '<p class="fp">Record fingerprint <code>' + entry.hash.slice(0, 16) + '…</code> ' + (M.lock['Personal care'].broken.indexOf(entry) >= 0 ? '<b class="bad">does not match: changed after it was written</b>' : 'matches what was written at the moment of choice') + '</p>';
    return h + '<button type="button" class="b pri full" data-act="back">Back to the checkpoint</button></div>';
  }

  function rule(M, S) {
    var r = S.draft;
    if (S.confirming) return '<div class="pn-top"><h2 id="pn-title">Confirm it\'s you</h2></div><div class="pn-body center"><div class="scan" aria-hidden="true"><svg viewBox="0 0 80 80" fill="none" stroke="#0F6B62" stroke-width="3" stroke-linecap="round"><circle cx="40" cy="36" r="22"/><circle cx="32" cy="32" r="2" fill="#0F6B62"/><circle cx="48" cy="32" r="2" fill="#0F6B62"/><path d="M31 44q9 7 18 0"/></svg><i></i></div><p>Confirming the new limit of ' + inr(DATA.moneyAgent.proposedLimit) + '.</p><p class="small muted">Simulated: no camera is used.</p></div>';
    var changed = DATA.categories.filter(function (c) { return c.delegated; }).map(function (c) { var x = M.rec[c.name]; return { n: c.name, k: x.tiesTotal - x.tiesWon }; });
    var asks = r.ask ? M.p.filter(function (x) { return x.chosen.total > r.ask; }).length : 0;
    var h = '<div class="pn-top">' + back('Back', 'tocard') + '<h2 id="pn-title">Raise with a rule</h2></div><div class="pn-body">';
    h += '<label class="sw"><input type="checkbox" id="r-tie"' + (r.tie ? ' checked' : '') + '><span><b>On ties, pick my usual brand</b><small>When options cost the same and rate the same, your stated preference decides, not sponsorship.</small></span></label>';
    h += '<p class="preview">' + (r.tie ? 'Over the last 3 months this would have changed ' + changed.map(function (x) { return x.k + ' ' + x.n.toLowerCase(); }).join(', ') + ' ties to your usual brand (the ringed dots). It never touches non-tie picks.' : 'Without it, ties keep going wherever the agent decides.') + '</p>';
    h += '<div class="askrow"><b>Ask me before any single buy above</b><div class="seg" role="group" aria-label="Approval amount">';
    [[null, 'Off'], [2000, '₹2,000'], [5000, '₹5,000'], [10000, '₹10,000']].forEach(function (o) { h += '<button type="button" data-act="ask" data-v="' + (o[0] || '') + '" aria-pressed="' + (r.ask === o[0]) + '">' + o[1] + '</button>'; });
    h += '</div><p class="preview">' + (r.ask ? 'Would have asked you ' + asks + ' times in the last 3 months. Everyday buys here are small, so this mostly guards big one-offs.' : 'Off: the agent buys anything within the monthly limit.') + '</p></div>';
    var n = (r.tie ? 1 : 0) + (r.ask ? 1 : 0);
    return h + '<button type="button" class="b pri full" data-act="rule-raise">Raise to ' + inr(DATA.moneyAgent.proposedLimit) + (n ? ' with ' + n + (n > 1 ? ' rules' : ' rule') : '') + '</button></div>';
  }

  function raised(M, S) {
    return '<div class="pn-top">' + badge() + '<h2 id="pn-title">Limit raised to ' + inr(S.limit) + '</h2></div><div class="pn-body"><p class="lead">' + (S.ruleFrom !== null || S.askAbove ? 'Rules on: ' + [S.ruleFrom !== null ? 'ties go to your usual brand' : '', S.askAbove ? 'it asks you before any buy above ' + inr(S.askAbove) : ''].filter(Boolean).join('; ') + '.' : 'No rules set. Ties keep going wherever the agent decides.') + ' The checkpoint keeps checking every purchase as it happens.</p><button type="button" class="b pri full" data-act="ff">Fast-forward a month</button></div>';
  }

  function payoff(M, S) {
    var pb = S.payback, pc = M.rec['Personal care'], ruled = S.ruleFrom !== null;
    var h = '<div class="pn-top">' + badge() + '<p class="intercept">One month later</p><p class="bignum">' + pb.wonWith + ' of ' + pb.ties + '</p><h2 id="pn-title">personal-care ties went your way this month' + (ruled ? '' : ' (no rule set)') + '</h2></div><div class="pn-body">';
    h += '<ul class="facts"><li><b>' + pb.ties + '</b> ties came up in personal care</li>';
    h += '<li><b>' + pb.wonWith + '</b> went to your usual brand, against <b>' + pb.wonWithout + '</b> without the rule</li>';
    h += '<li><b>Same bill.</b> Ties cost the same, so this rule changes whose brand wins, not the bill. Sponsors no longer decide her ties. ' + (pb.extraWith > 0 ? 'Overpaying on personal-care non-ties (' + inr(pb.extraWith) + ' this month) needs a different rule.' : 'No overpaying on personal-care non-ties this month.') + '</li></ul>';
    h += '<div class="vchange"><span class="dot ' + pb.before + '"></span>' + L[pb.before] + '<span class="arr" aria-hidden="true">to</span><span class="dot ' + pc.light + '"></span>' + L[pc.light] + '<em>Personal care, last 3 months: ' + pc.tiesWon + ' of ' + pc.tiesTotal + ' ties yours</em></div>';
    return h + '</div>';
  }

  function limits(M, S) {
    return '<div class="pn-top"><h2 id="pn-title">A limit says how much. The checkpoint says how well.</h2></div><div class="pn-body">' +
      '<div class="vs"><div><span>Spending limit</span><b>"All purchases within your limit ✓"</b><em>True, and it is all she would ever see.</em></div>' +
      '<div class="lit"><span>Trust Checkpoint</span><b>Ties: ' + M.tiesWon + ' of ' + M.tiesTotal + ' went her way. ' + inr(M.avoidable) + ' a month overpaid on non-ties, across all areas.</b><em>The same dots, read for judgement instead of totals.</em></div></div>' +
      '<p class="small muted">Left: every choice looks the same to a limit. Right: the checkpoint colours each one by what decided it.</p>' +
      '<p class="takeaway">Your agent works for you only if you can check its record.</p>' +
      '<div class="pair"><button type="button" class="b" data-act="tryit">Start over</button><button type="button" class="b pri" data-act="about">How I built this</button></div></div>';
  }

  function electronics(M, S) {
    var h = '<div class="pn-top">' + badge() + '<p class="intercept">Your agent asked to handle a new area.</p><h2 id="pn-title">Before your agent handles Electronics</h2></div><div class="pn-body">';
    if (S.electronics) h += '<p class="lead">Electronics handed over. Your agent asks you before any electronics buy above ' + inr(S.askElectronics || 5000) + '. Evidence builds from here.</p>';
    h += row(M, S, 'Electronics');
    h += '<p class="small muted">No green just because nothing has gone wrong yet. Nothing has happened yet.</p>';
    ['Groceries', 'Personal care', 'Household'].forEach(function (n) { h += row(M, S, n); });
    if (!S.electronics) h += '<div class="choices">' + choice('handover', 'Hand over with a ₹5,000 cap', 'Your agent asks you before any electronics buy above ₹5,000. Evidence builds from here.', true) + choice('notyet-e', 'Not yet', 'Electronics stays with you.') + '</div>';
    return h + foot() + '</div>';
  }

  function checker(M, S, side) {
    var h = '<div class="pn-top">' + (side ? back('Back') : '') + '<h2 id="pn-title">Second opinion</h2></div><div class="pn-body">';
    h += '<p>Checker B re-ran your ' + M.ledger.length + ' shopping decision records (gold\'s ' + M.gold.chances + ' buys follow one price rule and are checked directly). <span class="sim">Simulated</span></p>';
    h += '<div class="seg wide" role="group" aria-label="Checker B rules"><button type="button" data-act="cb" data-v="same" aria-pressed="' + (S.checkerB === 'same') + '">Same rules</button><button type="button" data-act="cb" data-v="strict" aria-pressed="' + (S.checkerB === 'strict') + '">Stricter rules</button></div>';
    h += '<table class="dt cmp"><thead><tr><th>Area</th><th>Default checker</th><th>Checker B</th></tr></thead><tbody>';
    DATA.categories.filter(function (c) { return c.delegated; }).forEach(function (c) {
      var v = M.verdicts[c.name];
      h += '<tr' + (v.disputed ? ' class="disputed"' : '') + '><td>' + esc(c.name) + '</td><td><span class="dot ' + v.def + '"></span>' + L[v.def] + '</td><td><span class="dot ' + v.b + '"></span>' + L[v.b] + '</td></tr>';
    });
    h += '</tbody></table>';
    var disputes = DATA.categories.filter(function (c) { return c.delegated && M.verdicts[c.name].disputed; });
    if (!disputes.length) h += '<p class="small">' + (S.checkerB === 'same' ? 'Same records, same rules, same verdicts. Try stricter rules to see a disagreement.' : 'They agree everywhere.') + '</p>';
    disputes.forEach(function (c) {
      var r = M.rec[c.name], v = M.verdicts[c.name];
      h += '<div class="why-dis"><b>Why they disagree on ' + esc(c.name) + '</b><span>Same ' + r.tiesTotal + ' ties, ' + r.tiesWon + ' went your way (' + Math.round(r.tieWinRate * 100) + '%). The default checker calls 70% or more Earned; Checker B wants ' + Math.round(Model.STRICT.greenTieWin * 100) + '%. The records are not in dispute, the bar is.</span><span>While they disagree, the card shows the stricter verdict (' + L[v.shown] + ') and marks it disputed. Stricter is not automatically right; it is the safer default until a rule is agreed.</span></div>';
    });
    return h + '<p class="small muted">Outside checkers are planned, not live. Nothing here connects to a real service.</p></div>';
  }

  function details(M, S) {
    var h = '<div class="pn-top">' + back('Back') + '<h2 id="pn-title">Full record</h2></div><div class="pn-body">';
    h += '<p class="meta">Every purchase is checked as it happens; the numbers cover the last 3 months. This card also returns on its own every 90 days.</p>';
    h += '<table class="dt"><thead><tr><th>Area</th><th>Ties yours</th><th>Overpaid a month</th><th>Verdict</th></tr></thead><tbody>';
    DATA.categories.forEach(function (c) { var r = M.rec[c.name], v = M.verdicts[c.name]; h += '<tr><td>' + esc(c.name) + '</td><td>' + (c.delegated ? r.tiesWon + ' of ' + r.tiesTotal : '0 decisions') + '</td><td>' + (c.delegated ? inr(r.avoidablePerMonth) : '-') + '</td><td><span class="dot ' + v.shown + '"></span>' + L[v.shown] + '</td></tr>'; });
    h += '<tr><td>Gold</td><td>' + M.gold.bought + ' of ' + M.gold.chances + ' dips bought</td><td>-</td><td><span class="dot ' + M.gold.light + '"></span>' + L[M.gold.light] + '</td></tr>';
    h += '</tbody></table><h3>How the checker decides</h3><dl class="defs">';
    Model.DEFINITIONS.forEach(function (d) { h += '<dt>' + d[0] + '</dt><dd>' + d[1] + '</dd>'; });
    h += '</dl><p class="small muted">Prototype thresholds: Earned needs 70% of ties or more and under ₹50 a month overpaid. Check: 40 to 70%, or ₹50 to ₹200. Hold back: below that.</p>';
    h += '<h3>Records locked</h3><ul class="locks">';
    ['Groceries', 'Personal care', 'Household'].forEach(function (n) { var l = M.lock[n] || { match: 0, total: 0, broken: [] }; h += '<li class="' + (l.broken.length ? 'bad' : '') + '">' + esc(n) + ': ' + l.match + ' of ' + l.total + ' records unchanged since written' + (l.broken.length ? ': one was changed after it was written' : '') + '</li>'; });
    h += '</ul><p class="small">Each record is fingerprinted (SHA-256, chained) when written, so a later change is detectable. This prototype fingerprints mock records to show the mechanism; it is not a security product.</p>';
    h += '<h3>What is real here, and what is not</h3><ul class="real"><li><b>Computed in this prototype:</b> the tie test, verdicts, spot-check maths, fingerprints, export.</li><li><b>Simulated:</b> Checker B, the independent catalogue snapshot, face confirmation.</li><li><b>Proposed for later:</b> outside checkers reading records with consent, a neutral body setting checker rules.</li></ul>';
    return h + '<div class="pair"><button type="button" class="b" data-act="export">Export my records</button><button type="button" class="b" data-act="checker">Second opinion</button></div></div>';
  }

  return { card: card, evidence: evidence, rule: rule, raised: raised, payoff: payoff, limits: limits, electronics: electronics, checker: checker, details: details };
})();
