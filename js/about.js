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
      '<p class="ab-lede">A concept for Flipkart APM \'29: in 2040 your agent shops and pays for you. Trust Checkpoint shows its record before it gets more power.</p>' +
      '<div class="ab-grid">' +
      '<section><h3>The problem</h3><p>Agents will make most everyday choices. Their worst habits are invisible: a sponsor wins a tie, a small overpay repeats. Limits control how much an agent spends, not how well it chooses.</p></section>' +
      '<section><h3>The bet</h3><p>Check the record at the moment people already pause: before raising a limit or handing over a new area. Also on request, and on its own every 90 days. The checker is independent: no agent maker owns it, and it works with any agent through consented decision records.</p></section>' +
      '<section><h3>How we know it works</h3><p>North star: ties settled by her preference, not by who paid. Here ' + pc.tiesWon + ' of ' + pc.tiesTotal + ' in personal care before the rule, ' + pb.wonWith + ' of ' + pb.ties + ' the month after. Guardrail: people keep delegating. The goal is trust that matches the record, not less trust.</p></section>' +
      '<section><h3>Calls I made</h3><ul><li>Independent, not owned by any platform: a checker run by the agent\'s maker is marking its own homework.</li><li>No history means grey, not green.</li><li>When checkers disagree, show both and use the stricter one, and say stricter is not automatically right.</li><li>Say plainly the rule changes whose brand wins, not the bill.</li><li>Label every simulated part.</li></ul></section>' +
      '</div>' +
      '<section class="ab-ship"><h3>How I shipped it</h3><ol>' +
      '<li><b>Thinking first.</b> Problem analysis, a decision log of every product call, and a spec before any screen.</li>' +
      '<li><b>Logic before pixels.</b> A seeded simulation of 13 weeks of agent choices. Every number on screen and in the PDF is computed by it, never typed in.</li>' +
      '<li><b>Records that catch tampering.</b> Each decision is written with a SHA-256 fingerprint chained to the last, so editing one later is detected. <button type="button" class="ab-try" data-act="tamper">Try it: edit an old record</button><span id="tamperOut" class="ab-out" aria-live="polite"></span></li>' +
      '<li><b>Tested like a product.</b> Automated browser checks (Playwright) on every number and chapter. A deliberately broken copy fails them.</li>' +
      '<li><b>Reviewed with fresh eyes.</b> After each version a reviewer that had not seen it played the recruiter. Several versions later, this one: a familiar app, one new layer.</li>' +
      '<li><b>AI-assisted, human-directed.</b> Built with Claude and Claude Code in Cursor, versioned on GitHub, deployed on Vercel. Plain HTML, CSS and JavaScript: no framework, works offline.</li>' +
      '</ol></section>' +
      '<p class="ab-real"><b>Real here:</b> the agent simulation, tie test, what the lens shows, verdicts, spot-check, fingerprinted records, export. <b>Simulated:</b> the second checker, face confirmation, outside catalogue data. All brands, people and numbers are invented.</p>' +
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
