// State, chapters and events. The agent asks for more power; Trust Checkpoint steps in.
var App = (function () {
  var S, M, $ = U.$, inr = U.inr, history = [], timer = null, ended = false;
  var TITLES = ['The ask', 'The checkpoint', 'Her decision', 'The payoff', 'How well, not how much'];
  var DUR = [8, 13, 10, 11, 12];

  function base(s) {
    s.c = 0; s.subs = []; s.now = DATA.historyWeeks; s.limit = DATA.moneyAgent.monthlyLimit; s.ruleFrom = null; s.askAbove = null;
    s.raised = false; s.payback = null; s.electronics = false; s.askElectronics = null; s.checkerB = 'same';
    s.draft = { tie: true, ask: null }; s.confirming = false;
  }
  function initState() { S = { influence: DATA.defaultSponsorInfluence, cheat: { edited: false, hidden: false }, lab: false }; base(S); history = []; }

  // Each chapter as an absolute state, so the story, Next/Back and the dots always agree.
  var ENTER = [
    function () { base(S); },
    function () { base(S); S.c = 1; },
    function () { base(S); S.c = 2; },
    function () { base(S); applyRaise(true, null, true); fastForward(); S.c = 3; },
    function () { ENTER[3](); S.c = 4; }
  ];

  function log(t) { history.unshift({ w: S.now, t: t }); history = history.slice(0, 8); }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 3200); }
  function applyRaise(withTie, ask, quiet) {
    S.raised = true; S.limit = DATA.moneyAgent.proposedLimit;
    if (withTie && (S.ruleFrom === null || S.ruleFrom > S.now)) S.ruleFrom = S.now;
    if (ask) S.askAbove = ask;
    log('Limit raised to ' + inr(S.limit) + (withTie ? ' with tie rule' : '') + (ask ? ', ask above ' + inr(ask) : ''));
    var n = (withTie ? 1 : 0) + (ask ? 1 : 0);
    if (!quiet) toast('Limit raised to ' + inr(S.limit) + (n ? ' with ' + n + (n > 1 ? ' rules' : ' rule') : '. No rules set'));
  }
  function fastForward() {
    var before = Model.compute(S).rec['Personal care'].light, start = S.now;
    S.now += DATA.futureWeeks;
    var pb = Model.payoff(S, start, S.now); pb.before = before; S.payback = pb;
    log('Fast-forward 1 month');
  }

  function caption(i) {
    var g = M.rec['Groceries'], pc = M.rec['Personal care'], pb = S.payback;
    switch (i) {
      case 0: return 'Priya\'s agents made ' + M.decisions + ' choices for her in 3 months, all within her limit. To her, every one looks the same. Now her shopping agent wants more power.';
      case 1: return 'Before the limit rises, Trust Checkpoint colours every choice by what decided it. Groceries earned trust. In personal care a sponsor won ' + (pc.tiesTotal - pc.tiesWon) + ' of ' + pc.tiesTotal + ' ties: same price, same rating, not her brand.';
      case 2: return 'She raises the limit with one rule: on ties, pick my usual brand. The ringed dots preview exactly what it would have changed, before she commits.';
      case 3: return pb ? 'A month later: ' + pb.wonWith + ' of ' + pb.ties + ' personal-care ties went her way, against ' + pb.wonWithout + ' without the rule. Same bill, her choice.' : 'The limit is raised. Fast-forward a month to see what the rule changed.';
      case 4: return 'A spending limit sees how much. Trust Checkpoint sees how well. Your agent works for you only if you can check its record.';
    }
  }

  function agent() {
    if (S.c === 0) return '<p class="say">Priya, I made <b>' + M.decisions + ' choices</b> for you in the last 3 months. All within your limit.</p><p class="say ask-line">Can I raise my monthly limit from ' + inr(S.limit) + ' to ' + inr(DATA.moneyAgent.proposedLimit) + '?</p>';
    var top = S.subs[S.subs.length - 1];
    var t = top === 'evidence' ? 'Inspecting one choice' : { 1: 'Your agent is asking: raise my limit to ' + inr(DATA.moneyAgent.proposedLimit), 2: 'Your agent is asking: raise my limit to ' + inr(DATA.moneyAgent.proposedLimit), 3: S.payback ? 'One month later' : 'Limit raised', 4: 'The same choices, read two ways' }[S.c];
    return '<p class="chip"><i aria-hidden="true"></i>' + t + '</p>';
  }

  function render() {
    M = Model.compute(S);
    document.body.dataset.mode = S.c === 0 ? 'ask' : 'panel';
    document.body.dataset.c = S.c;
    $('agentLine').innerHTML = agent();
    var ec = $('endcard'); if (ended && !ec) { ec = document.createElement('div'); ec.id = 'endcard'; ec.className = 'endcard'; ec.innerHTML = '<div><p>Your agent works for you only if you can check its record.</p><small>Trust Checkpoint: before your agent gets more power, see its record.</small><div class="ask-btns"><button type="button" class="allow" data-act="play">Replay the story</button><button type="button" class="notnow" data-act="tryit">Try it yourself</button><button type="button" class="notnow" data-act="about">How I built this</button></div></div>'; document.querySelector('.world').appendChild(ec); } else if (!ended && ec) ec.remove();
    $('askBtns').innerHTML = S.c === 0 ? '<button type="button" class="allow" data-act="allow">Allow</button><button type="button" class="notnow" data-act="notnow">Not now</button>' : '';
    // the field
    var sub = S.subs[S.subs.length - 1];
    if (S.c === 0) Field.show('swarm', M, S);
    else if (sub === 'evidence') Field.show('grid', M, S, { focus: true });
    else if (sub === 'checker') Field.show('grid', M, S, { dispute: true });
    else if (S.c === 2) Field.show('grid', M, S, { flip: S.draft.tie });
    else if (S.c === 3 && S.payback) Field.show('payoff', M, S);
    else if (S.c === 4) Field.show('split', M, S);
    else Field.show('grid', M, S);
    $('legend').innerHTML = S.c === 0 ? '' : S.c === 3 && S.payback ? legend(['k-ok', 'Her usual brand won the tie'], ['k-tie', 'Sponsor won the tie']) : S.c === 4 ? '' :
      legend(['k-ok', 'Her usual, best price'], ['k-tie', 'Sponsor won a tie'], ['k-over', 'Paid more than an equal option'], ['k-diff', 'Different brand, same best price'], ['k-gold', 'Gold bought at her price']);
    // the panel
    var top = S.subs[S.subs.length - 1], p = $('panel'), html;
    if (top) html = function () { return Panel[top](M, S, true); };
    else html = ({ 1: Panel.card, 2: Panel.rule, 3: S.payback ? Panel.payoff : S.raised ? Panel.raised : Panel.card, 4: Panel.limits })[S.c];
    p.innerHTML = S.c === 0 ? '' : '<div class="pn" role="region" aria-labelledby="pn-title">' + html(M, S) + '</div>';
    // the caption bar
    var dots = TITLES.map(function (t, k) { return '<button type="button" class="sdot' + (k === S.c ? ' on' : k < S.c ? ' done' : '') + '" data-act="scene" data-i="' + k + '" aria-label="Chapter ' + (k + 1) + ': ' + t + '"' + (k === S.c ? ' aria-current="step"' : '') + '></button>'; }).join('');
    $('cap').innerHTML = '<div class="cap-l"><p class="cap-n">' + (S.c + 1) + ' of ' + TITLES.length + ' · ' + TITLES[S.c] + '</p><p class="cap-t">' + caption(S.c) + '</p></div>' +
      '<div class="cap-r"><div class="sdots">' + dots + '</div><div class="sbtns">' + (timer ? '<button type="button" class="b" data-act="pause">Pause</button>' :
      '<button type="button" class="b" data-act="prev"' + (S.c === 0 ? ' disabled' : '') + '>Back</button>' + (S.c === TITLES.length - 1 ? '<button type="button" class="b pri" data-act="tryit">Start over</button>' : '<button type="button" class="b pri" data-act="next">Next</button>')) + '</div></div>';
    $('playBtn').textContent = timer ? 'Playing…' : 'Play the story · 1 min';
    Lab.update(M, S, history);
  }
  function legend() { return Array.prototype.map.call(arguments, function (l) { return '<span><i class="swt ' + l[0] + '"></i>' + l[1] + '</span>'; }).join(''); }

  function go(i) { ENTER[i](); render(); }
  function setC(i) { S.c = i; S.subs = []; render(); var f = $('panel').querySelector('h2'); if (f && !timer) { f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); } $('panel').scrollTop = 0; }

  // ---- story autoplay ----
  function stop() { clearTimeout(timer); timer = null; }
  function play() {
    stop(); var i = 0; timer = 1; go(0);
    (function next() { timer = setTimeout(function () { i++; if (i >= ENTER.length) { stop(); ended = true; render(); return; } go(i); if (i === 1) setTimeout(function () { if (timer && S.c === 1) { S.subs = ['evidence']; render(); } }, U.reduce ? 3000 : 6000); next(); }, (U.reduce ? 6 : DUR[i]) * 1000); })();
    render();
  }

  function onClick(e) {
    var b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    var a = b.dataset.act;
    if (['play', 'pause', 'restart', 'lab', 'replay'].indexOf(a) < 0) stop();
    ended = false;
    switch (a) {
      case 'allow': log('Asked to raise the limit'); setC(1); if (window.innerWidth < 900) setTimeout(function () { $('panel').scrollIntoView({ behavior: U.reduce ? 'auto' : 'smooth', block: 'start' }); }, 1700); break;
      case 'notnow': toast('Your agent will ask again later. The limit stays ' + inr(S.limit) + '.'); break;
      case 'evidence': S.subs.push('evidence'); render(); $('panel').scrollTop = 0; break;
      case 'tocard': S.confirming = false; setC(1); break;
      case 'about': About.open(); break;
      case 'raise-plain': S.draft = { tie: false, ask: null }; confirm(); break;
      case 'raise-rule': S.draft = { tie: true, ask: S.draft.ask }; setC(2); break;
      case 'rule-raise': confirm(); break;
      case 'ask': S.draft.ask = b.dataset.v ? +b.dataset.v : null; render(); break;
      case 'notyet': toast('Limit stays ' + inr(S.limit) + '. Review again any time.'); log('Kept the limit at ' + inr(S.limit)); break;
      case 'ff': fastForward(); setC(3); break;
      case 'handover': S.electronics = true; S.askElectronics = 5000; log('Electronics handed over with a ₹5,000 cap'); render(); toast('Electronics handed over. Your agent asks before any buy above ₹5,000.'); break;
      case 'notyet-e': toast('Electronics stays with you.'); break;
      case 'details': S.subs.push('details'); render(); $('panel').scrollTop = 0; break;
      case 'checker': S.subs.push('checker'); render(); $('panel').scrollTop = 0; break;
      case 'back': S.subs.pop(); render(); break;
      case 'cb': S.checkerB = b.dataset.v; log('Checker B: ' + (S.checkerB === 'strict' ? 'stricter rules' : 'same rules')); render(); break;
      case 'export': exportRecords(); break;
      case 'play': play(); break;
      case 'tryit': go(0); break;
      case 'pause': stop(); render(); break;
      case 'next': go(Math.min(TITLES.length - 1, S.c + 1)); break;
      case 'prev': go(Math.max(0, S.c - 1)); break;
      case 'scene': go(+b.dataset.i); break;
      case 'lab': toggleLab(); break;
      case 'restart': stop(); var l = S.lab; initState(); S.lab = l; if (l) S.c = 1; Lab.reset(); $('toast').classList.remove('show'); render(); break;
      case 'replay': stop(); Intro.play(true); break;
    }
  }
  function confirm() {
    S.confirming = true; S.c = 2; S.subs = []; render();
    setTimeout(function () {
      S.confirming = false; applyRaise(S.draft.tie, S.draft.ask); setC(3);
    }, U.reduce ? 200 : 1500);
  }
  function toggleLab(force) {
    S.lab = force === undefined ? !S.lab : force;
    document.body.classList.toggle('lab-open', S.lab); $('labBtn').setAttribute('aria-expanded', S.lab);
    if (S.lab && S.c === 0) setC(1);
    if (S.lab) setTimeout(function () { var f = $('lab').querySelector('button'); if (f) f.focus(); }, 60);
  }
  function exportRecords() {
    var data = { exported: 'Trust Checkpoint prototype, mock data', note: 'Each record carries the fingerprint written with it; anyone can re-run the checks.',
      records: M.ledger.map(function (e) { return { record: e.rec, previousFingerprint: e.prev, fingerprint: e.hash }; }) };
    var url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })), a = document.createElement('a');
    a.href = url; a.download = 'priya-agent-records.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    log('Exported ' + M.ledger.length + ' records'); toast('Exported ' + M.ledger.length + ' fingerprinted decision records');
  }

  function init() {
    initState(); Field.init(); Lab.build();
    document.addEventListener('click', onClick);
    document.addEventListener('change', function (e) { if (e.target.id === 'r-tie') { S.draft.tie = e.target.checked; render(); var t = $('r-tie'); if (t) t.focus(); } });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !$('intro').hidden) return;
      if (About.isOpen()) About.close(); else if (S.subs.length) { S.subs.pop(); render(); } else if (S.lab) toggleLab(false); else if (S.c === 2) setC(1);
    });
    render();
    if (/[?&]debug=1/.test(location.search)) selfTest();
    Intro.play(false);
  }
  function selfTest() {
    var p = Logic.simulateAgent(DATA, { from: 0, to: 13, sponsorInfluence: 0.4, rules: {} });
    var r = Logic.checkRecord(DATA, p, 13), sc = Logic.spotCheck(DATA, p);
    console.assert(r['Groceries'].tiesWon === 47 && r['Groceries'].tiesTotal === 55, 'Groceries 47/55');
    console.assert(r['Personal care'].tiesWon === 9 && r['Personal care'].tiesTotal === 15 && r['Personal care'].avoidablePerMonth === 18 && r['Personal care'].light === 'amber', 'Personal care 9/15, Rs 18, amber');
    console.assert(r['Household'].tiesWon === 8 && r['Household'].tiesTotal === 11, 'Household 8/11');
    console.assert(r['Electronics'].light === 'grey', 'Electronics grey');
    console.assert(sc.passed === 8 && sc.sampled === 10, 'Spot-check 8/10');
    console.log('[debug] Groceries 47/55, Personal care 9/15 Rs 18 amber, Household 8/11, spot-check 8/10. Self-tests done.');
  }

  document.addEventListener('DOMContentLoaded', init);
  return { state: function () { return S; }, render: render, log: log, go: go, toast: toast };
})();
