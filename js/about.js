// "How I built this": the product thinking and the build, in one place.
var About = (function () {
  var el, last;
  function html() {
    var S0 = App.state();
    // "before" is always today's record (13 weeks, no rule), whatever step the visitor is on
    var B = JSON.parse(JSON.stringify(S0)); B.now = DATA.historyWeeks; B.ruleFrom = null; B.raised = false; B.askAbove = null; B.payback = null;
    var M = Model.compute(B), pc = M.rec['Personal care'];
    // the month-after figure comes from the same simulation, with the rule switched on from today
    var T = JSON.parse(JSON.stringify(S0)); T.now = DATA.historyWeeks; T.ruleFrom = DATA.historyWeeks; T.raised = true; T.limit = DATA.moneyAgent.proposedLimit;
    var pb = Model.payoff(T, DATA.historyWeeks, DATA.historyWeeks + DATA.futureWeeks);
    return '<div class="ab" role="dialog" aria-modal="true" aria-labelledby="ab-title"><button type="button" class="back ab-x" data-act="about-close">Close</button>' +
      '<h2 id="ab-title">How I built this</h2>' +
      '<p class="ab-lede">A concept for Flipkart APM \'29. In 2040 your agent shops and pays for you. Trust Checkpoint shows its record before it gets more power.</p>' +
      '<section class="ab-how"><h3>How it works</h3><ol>' +
      '<li><b>The agent writes a record</b> of every option it saw (price, delivery, rating, ad label) and what it picked. Each payment carries the record\'s fingerprint, and your bank keeps it, so the record cannot be rewritten later.</li>' +
      '<li><b>The checker applies fixed, public rules</b> to the records you share. No AI, so anyone can recompute a verdict. It also compares a few records with public listings it saved itself, to catch a record that hid an option.</li>' +
      '<li><b>A higher limit or a new area changes your payment mandate,</b> so the request stops at your bank, which asks the checker first.</li>' +
      '<li><b>A rule you add becomes a condition of the new limit.</b> If next month\'s records show it broken, the bank drops the limit back.</li></ol></section>' +
      '<div class="ab-grid">' +
      '<section><h3>The problem</h3><p>When two options cost the same and are rated the same, only loyalty decides which one the agent picks. If a brand paid, she would never notice. Spending limits control how much an agent spends, not how well it chooses.</p></section>' +
      '<section><h3>What I would measure</h3><p>North star: the share of ties settled by her preference, not by who paid, against a control group. In this simulation, ' + pc.tiesWon + ' of ' + pc.tiesTotal + ' personal-care ties over the 3 months before the rule; ' + pb.wonWith + ' of ' + pb.ties + ' in the month after. Guardrails: avoidable spend does not rise and people keep delegating.</p></section>' +
      '<section><h3>Calls I made</h3><ul><li>Independent: the company that runs the agent should not grade it.</li><li>A new area starts with no verdict, not a green light.</li><li>The rule changes whose brand wins, not the bill, and the screen says so.</li><li>Every simulated part is labelled.</li></ul></section>' +
      '<section><h3>How I shipped it</h3><ul><li>Decisions first: a log of every product call, then a spec, then screens.</li><li>A seeded simulation of 13 weeks of choices computes every number here and in the PDF.</li><li>Fingerprinted records. <button type="button" class="ab-try" data-act="tamper">Try it: edit an old record</button><span id="tamperOut" class="ab-out" aria-live="polite"></span></li><li>Automated browser checks on every number and step; a deliberately broken copy fails them.</li><li>Built with Claude and Claude Code in Cursor, versioned on GitHub, deployed on Vercel. Plain HTML, CSS and JavaScript; works offline.</li></ul></section>' +
      '</div>' +
      '<p class="ab-real"><b>Real here:</b> the agent simulation, the tie test, the verdicts, what the lens shows, and the fingerprinted records. <b>Simulated:</b> the bank, the second checker, the face confirmation, and the spot-check against public listings. All brands, people and numbers are invented.</p>' +
      '</div>';
  }
  function open() { last = document.activeElement; el = document.getElementById('about'); el.innerHTML = html(); el.hidden = false; document.body.classList.add('about-open'); var c = el.querySelector('.ab-x'); if (c) c.focus(); }
  function close() { if (!el) return; el.hidden = true; document.body.classList.remove('about-open'); if (last && last.focus) last.focus(); }
  function isOpen() { return !!el && !el.hidden; }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-act="about-close"]') || e.target.id === 'about') close();
    if (e.target.closest('[data-act="tamper"]')) {
      // edit an old record on a copy of the state, then verify the fingerprint chain
      var S0 = App.state(), T = JSON.parse(JSON.stringify(S0)); T.cheat = { edited: true, hidden: false };
      var l = Model.compute(T).lock['Personal care'];
      document.getElementById('tamperOut').textContent = l.broken.length ? ' Tamper caught: ' + l.match + ' of ' + l.total + ' personal-care records unchanged, 1 edited after it was written.' : ' No change detected.';
    }
  });
  return { open: open, close: close, isOpen: isOpen };
})();
