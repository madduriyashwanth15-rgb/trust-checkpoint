// State and flow. Six steps: the ask, look closer, the checkpoint, why, the rule, a month later.
var App = (function () {
  var S, M, $ = U.$, inr = U.inr, timer = null, T = [];
  var HOT = ['allow', 'lens', 'why', 'rule', 'raise', null];
  var LAST = 5, Lens = null;

  function base(s) {
    s.step = 0; s.view = null; s.now = DATA.historyWeeks; s.limit = DATA.moneyAgent.monthlyLimit; s.ruleFrom = null; s.askAbove = null;
    s.raised = false; s.payback = null; s.draft = { tie: true, ask: null }; s.confirming = false; s.checkerB = 'same'; s.ended = false; s.lensFull = false;
  }
  function initState() { S = { influence: DATA.defaultSponsorInfluence, cheat: { edited: false, hidden: false }, landing: true }; base(S); }

  var ENTER = [
    function () { base(S); },
    function () { base(S); S.step = 1; },
    function () { base(S); S.step = 2; S.view = 'record'; },
    function () { base(S); S.step = 3; S.view = 'why'; },
    function () { base(S); S.step = 4; S.view = 'rule'; },
    function () { base(S); applyRaise(true, null); fastForward(); S.step = 5; }
  ];

  function applyRaise(withTie, ask) {
    S.raised = true; S.limit = DATA.moneyAgent.proposedLimit;
    if (withTie && S.ruleFrom === null) S.ruleFrom = S.now;
    if (ask) S.askAbove = ask;
  }
  function fastForward() {
    var before = Model.compute(S).rec['Personal care'].light, start = S.now;
    S.now += DATA.futureWeeks;
    var pb = Model.payoff(S, start, S.now); pb.before = before; S.payback = pb;
  }

  function caption() {
    var pc = M.rec['Personal care'], pb = S.payback;
    return [
      ['Your agent shops for you. Now it wants more power.', 'Tap Allow, like anyone would, or press Next to look closer first.'],
      ['Look closer.', 'Every pick looked fine. The lens shows what decided each one. Drag it over her picks, or press Look closer.'],
      ['Trust Checkpoint steps in first, with its record.', 'Groceries earned trust. Personal care did not.'],
      ['Same price, same rating. A sponsor decided.', 'She would never have noticed this on her own.'],
      ['One rule puts her preference back in charge.', 'She sees what it would have changed before she commits.'],
      [pb ? 'A month later: ' + pb.wonWith + ' of ' + pb.ties + ' ties went her way.' : 'A month later.', pb ? 'Against ' + pb.wonWithout + ' without the rule. Same bill, her brand.' : '']
    ][S.step];
  }

  function render() {
    M = Model.compute(S);
    document.body.classList.toggle('landing', !!S.landing);
    $('screen').innerHTML = Screens.home(M, S);
    var sh = $('sheet');
    if (S.view) { sh.innerHTML = '<div class="sh-in">' + Screens[S.view](M, S) + '</div>'; sh.classList.add('open'); $('scrim').classList.add('on'); }
    else { sh.classList.remove('open'); $('scrim').classList.remove('on'); }
    // guide: one pulsing target at a time
    var hot = HOT[S.step];
    document.querySelectorAll('[data-hot]').forEach(function (b) { b.classList.toggle('hot', b.dataset.hot === hot && S.view !== 'checker' && !S.confirming); });
    Lens.bind(S);
    if (S.landing) {
      // first screen: the problem and the product in plain words, before any story
      $('cap').innerHTML = '<div class="land"><p class="l-k">The problem</p><p class="l-t">In 2040, your AI agent shops for you. It can quietly pick what sponsors pay for, and you\'d never notice.</p>' +
        '<p class="l-k">The product</p><p class="l-p">Trust Checkpoint shows your agent\'s record before you give it more power. Independent, and it works with any agent.</p>' +
        '<div class="l-b"><button type="button" class="cbtn pri big" data-act="play">Watch it in 40 seconds</button><button type="button" class="cbtn big" data-act="try">Try it myself</button></div></div>';
      $('playBtn').textContent = 'Watch it in 40 seconds';
      return;
    }
    var c = caption(), last = S.step === LAST;
    var dots = [0, 1, 2, 3, 4, 5].map(function (k) { return '<button type="button" class="sd' + (k === S.step ? ' on' : k < S.step ? ' done' : '') + '" data-act="step" data-i="' + k + '" aria-label="Step ' + (k + 1) + '"></button>'; }).join('');
    $('cap').innerHTML = '<p class="c-n">' + (S.step + 1) + ' of 6</p><p class="c-t">' + c[0] + '</p><p class="c-s">' + c[1] + '</p>' +
      '<div class="c-nav"><div class="sds">' + dots + '</div>' + (timer ? '<button type="button" class="cbtn" data-act="pause">Pause</button>' :
      last ? '<button type="button" class="cbtn" data-act="replay-story">Replay</button><button type="button" class="cbtn pri" data-act="about">How I built this</button>' :
      '<button type="button" class="cbtn" data-act="prev"' + (S.step === 0 ? ' disabled' : '') + '>Back</button><button type="button" class="cbtn pri" data-act="next">Next</button>') + '</div>';
    $('playBtn').textContent = timer ? 'Playing…' : 'Watch it in 40 seconds';
  }

  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function later(ms, fn) { T.push(setTimeout(fn, U.reduce ? Math.min(ms, 300) : ms)); }
  function clearLater() { T.forEach(clearTimeout); T = []; }

  // Raise -> confirm -> limit up -> one month later
  function confirmRaise(withTie, ask) {
    S.confirming = true; S.view = 'rule'; S.step = 4; render();
    later(1400, function () {
      S.confirming = false; S.view = null; applyRaise(withTie, ask); render();
      var n = (withTie ? 1 : 0) + (ask ? 1 : 0);
      toast('Limit raised to ' + inr(S.limit) + (n ? ' with ' + n + (n > 1 ? ' rules' : ' rule') : '. No rules set'));
      later(1700, function () {
        $('wipe').classList.add('on');
        later(1100, function () { fastForward(); S.step = 5; render(); $('screen').scrollTop = 0; later(600, function () { $('wipe').classList.remove('on'); }); });
      });
    });
  }

  function go(i) { S.landing = false; clearLater(); $('wipe').classList.remove('on'); ENTER[i](); render(); $('screen').scrollTop = 0; if (S.step === 1) showPicks(); }
  // the lens step: bring the picks into view and park the lens on the sponsored tie
  function showPicks() { var pk = $('picks'); if (!pk) return; var sc = $('screen'), nav = sc.querySelector('.a-nav'), ag = sc.querySelector('.agent');
    // show all four picks above the tab bar, and start the view at a clean edge (the agent card), never mid-text
    var top = sc.getBoundingClientRect().top - sc.scrollTop, y = function (n) { return n.getBoundingClientRect().top - top; };
    var need = y(pk) + pk.offsetHeight + 14 - (sc.clientHeight - (nav ? nav.offsetHeight : 0));
    sc.scrollTop = Math.max(0, need, ag ? y(ag) - 8 : 0); Lens.park(0); }

  // ---- autoplay: the same taps a person would make, shown with a tap mark ----
  function tapOn(sel, then) {
    var el = document.querySelector(sel), tp = $('tap'), ph = $('phone');
    if (!el) { then(); return; }
    var r = el.getBoundingClientRect(), pr = ph.getBoundingClientRect(), s = pr.width / ph.offsetWidth;
    tp.style.left = ((r.left + r.width / 2 - pr.left) / s) + 'px'; tp.style.top = ((r.top + r.height / 2 - pr.top) / s) + 'px';
    tp.classList.remove('go'); void tp.offsetWidth; tp.classList.add('go');
    later(380, then);
  }
  function stop() { clearTimeout(timer); timer = null; clearLater(); if (Lens) Lens.stopGlide(); }
  function play() {
    stop(); S.landing = false; timer = 1; go(0); timer = 1; render();
    var seq = [
      [3500, function () { S.step = 1; render(); showPicks(); Lens.glide(); }],
      [6500, function () { tapOn('[data-hot=allow2]', function () { S.step = 2; S.view = 'record'; render(); }); }],
      [6000, function () { tapOn('[data-hot=why]', function () { S.step = 3; S.view = 'why'; render(); }); }],
      [5500, function () { tapOn('[data-hot=rule]', function () { S.step = 4; S.view = 'rule'; render(); }); }],
      [4500, function () { tapOn('[data-hot=raise]', function () { confirmRaise(S.draft.tie, S.draft.ask); }); }],
      [11500, function () { timer = null; S.ended = true; render(); }]
    ];
    var i = 0;
    (function next() { if (i >= seq.length) return; var st = seq[i++]; timer = setTimeout(function () { st[1](); next(); }, U.reduce ? 1200 : st[0]); })();
  }

  function onClick(e) {
    var b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    var a = b.dataset.act;
    if (['play', 'pause', 'about'].indexOf(a) < 0 && e.isTrusted) stop();
    switch (a) {
      case 'try': S.landing = false; render(); break;
      case 'allow': S.landing = false; S.lensFull = false; S.step = 2; S.view = 'record'; render(); focusSheet(); break;
      case 'look': S.lensFull = !S.lensFull; if (S.landing) S.landing = false; render(); var lb = document.querySelector('.lookbtn'); if (lb) lb.focus({ preventScroll: true }); break;
      case 'notnow': toast('Your agent will ask again later.'); break;
      case 'why': S.step = 3; S.view = 'why'; render(); focusSheet(); break;
      case 'record': S.step = 2; S.view = 'record'; S.checkerB = 'same'; render(); break;
      case 'rule': S.step = 4; S.view = 'rule'; S.draft = { tie: true, ask: S.draft.ask }; render(); focusSheet(); break;
      case 'rule-raise': confirmRaise(S.draft.tie, S.draft.ask); break;
      case 'raise-plain': S.draft = { tie: false, ask: null }; confirmRaise(false, null); break;
      case 'notyet': toast('Limit stays ' + inr(S.limit) + '. Review any time.'); break;
      case 'checker': S.view = 'checker'; S.checkerB = 'strict'; render(); break;
      case 'about': About.open(); break;
      case 'play': play(); break;
      case 'pause': stop(); render(); break;
      case 'next': go(Math.min(LAST, S.step + 1)); break;
      case 'prev': go(Math.max(0, S.step - 1)); break;
      case 'step': go(+b.dataset.i); break;
      case 'replay-story': play(); break;
      case 'home-start': stop(); initState(); render(); break;
    }
  }
  function focusSheet() { var f = $('sheet').querySelector('h2'); if (f && !timer) { f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); } $('sheet').scrollTop = 0; }

  function fit() {
    var wrap = $('phoneWrap'), ph = $('phone'), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var top = document.querySelector('.top').offsetHeight, foot = document.querySelector('.disclaimer').offsetHeight;
    var capH = vw > 980 ? 0 : 150, avail = vh - top - foot - capH - 32;
    var s = Math.min(1, (vw - 24) / 410, avail / 864); s = Math.max(0.55, s);
    ph.style.transform = 'scale(' + s + ')'; wrap.style.width = (410 * s) + 'px'; wrap.style.height = (864 * s) + 'px';
  }

  function init() {
    Lens = LensUI; initState();
    document.addEventListener('click', onClick);
    document.addEventListener('change', function (e) {
      if (e.target.id === 'r-tie') { S.draft.tie = e.target.checked; render(); $('r-tie').focus(); }
      if (e.target.id === 'r-ask') { S.draft.ask = e.target.checked ? 5000 : null; render(); $('r-ask').focus(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (About.isOpen()) About.close(); else if (S.view === 'checker') { S.view = 'record'; S.checkerB = 'same'; render(); }
      else if (S.view === 'why' || S.view === 'rule') { S.step = 2; S.view = 'record'; render(); }
    });
    window.addEventListener('resize', fit);
    render(); fit();
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
    console.log('[debug] Groceries 47/55, Personal care 9/15 Rs 18 amber, Household 8/11, spot-check 8/10. Self-tests done.');
  }
  document.addEventListener('DOMContentLoaded', init);
  return { state: function () { return S; }, render: render, go: go };
})();
