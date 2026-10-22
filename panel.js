// Side panel: "What Priya can't see". Controls change the hidden machinery; the phone re-renders live.
var Panel = (function () {
  var el, shown = { tie: null, avoid: null, areas: null }, reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return document.getElementById(id); }

  function build() {
    el = $('panel');
    el.innerHTML =
      '<h2>What Priya can\'t see</h2>' +
      '<p class="lead">The machinery behind her agent. Change it and watch her phone.</p>' +
      '<div class="grp"><span class="gl" id="viewLbl">Priya\'s view</span><div class="seg" role="group" aria-labelledby="viewLbl">' +
        '<button type="button" id="v-off" aria-pressed="false">Without checkpoint</button><button type="button" id="v-on" aria-pressed="true">With checkpoint</button></div></div>' +
      '<div class="grp"><label class="gl" for="infl">How much sponsors sway her agent: <output id="inflOut">40%</output></label>' +
        '<input type="range" id="infl" min="0" max="60" step="5" value="40"><div class="scale"><span>0%</span><span>60%</span></div></div>' +
      '<div class="grp"><span class="gl" id="ffLbl">Fast-forward time</span><div class="seg three" role="group" aria-labelledby="ffLbl">' +
        '<button type="button" data-ff="1">1 week</button><button type="button" data-ff="4">1 month</button><button type="button" data-ff="13">3 months</button></div>' +
        '<p class="tiny" id="clock"></p></div>' +
      '<div class="grp"><label class="sw dark"><input type="checkbox" id="p-rule"><span>On ties, pick my usual brand<br><small>As if Priya had set it 3 months ago</small></span></label></div>' +
      '<div class="metrics" aria-live="polite">' +
        '<div><b id="m-tie">0%</b><span>Tie-breaks won by Priya</span></div>' +
        '<div><b id="m-avoid">₹0</b><span>Overpaid to tilts, a month</span></div>' +
        '<div><b id="m-areas">0</b><span>Areas handed to her agent</span></div></div>' +
      '<div class="grp cheat"><span class="gl">Try to cheat (demo)</span>' +
        '<div class="cheats"><button type="button" id="c-edit">Edit an old record</button><button type="button" id="c-hide">Hide an option when writing</button><button type="button" id="c-reset">Reset</button></div>' +
        '<ul class="cheat-out" id="cheatOut"></ul>' +
        '<p class="tiny">Demo: mock data. In the real product the checker\'s catalogue snapshot is collected independently.</p></div>';

    $('v-off').addEventListener('click', function () { App.state().layer = false; App.state().sheets = []; App.render(); });
    $('v-on').addEventListener('click', function () { App.state().layer = true; App.render(); });
    $('infl').addEventListener('input', function (e) { App.state().influence = e.target.value / 100; $('inflOut').textContent = e.target.value + '%'; App.render(); });
    el.querySelectorAll('[data-ff]').forEach(function (b) { b.addEventListener('click', function () { App.state().now += +b.dataset.ff; App.render(); App.toast('Moved ahead ' + b.textContent + '. The card now covers the latest 3 months.'); }); });
    $('p-rule').addEventListener('change', function (e) { var S = App.state(); S.ruleFrom = e.target.checked ? S.now - DATA.historyWeeks : null; App.render(); });
    $('c-edit').addEventListener('click', function () { App.state().cheat.edited = true; App.render(); showOut(); });
    $('c-hide').addEventListener('click', function () { App.state().cheat.hidden = true; App.render(); showOut(); });
    $('c-reset').addEventListener('click', function () { App.state().cheat = { edited: false, hidden: false }; App.render(); });
    if (App.model()) update(App.model(), App.state());
  }

  function countTo(node, from, to, fmt) {
    if (reduceMotion || from === null || from === to) { node.textContent = fmt(to); return; }
    var t0 = performance.now(), d = 400;
    (function step(t) { var k = Math.min(1, (t - t0) / d); node.textContent = fmt(from + (to - from) * k); if (k < 1) requestAnimationFrame(step); })(t0);
  }

  function update(M, S) {
    if (!el) return;
    $('v-on').setAttribute('aria-pressed', S.layer); $('v-off').setAttribute('aria-pressed', !S.layer);
    $('infl').value = Math.round(S.influence * 100); $('inflOut').textContent = Math.round(S.influence * 100) + '%';
    $('p-rule').checked = S.ruleFrom !== null && S.ruleFrom <= S.now - DATA.historyWeeks;
    var wk = S.now - DATA.historyWeeks;
    $('clock').textContent = 'Card covers weeks ' + (wk + 1) + ' to ' + S.now + (S.ruleFrom !== null ? ' · tie rule on from week ' + (S.ruleFrom + 1) : '');
    var tie = Math.round(M.tieRate * 100);
    countTo($('m-tie'), shown.tie, tie, function (v) { return Math.round(v) + '%'; });
    countTo($('m-avoid'), shown.avoid, M.avoidable, function (v) { return App.inr(v); });
    countTo($('m-areas'), shown.areas, M.areas, function (v) { return String(Math.round(v)); });
    shown = { tie: tie, avoid: M.avoidable, areas: M.areas };
    var out = [];
    var pc = M.lock['Personal care'] || { match: 0, total: 0, broken: [] };
    out.push('<li class="' + (pc.broken.length ? 'bad' : 'ok') + '">Personal care records: ' + pc.match + ' of ' + pc.total + ' fingerprints match' + (pc.broken.length ? '. Caught: a record was changed after it was written.' : '.') + '</li>');
    if (M.missing.length) out.push('<li class="bad">New record\'s fingerprint is valid: the lie was written in at the start. The spot-check caught it anyway: ' + M.missing[0].brand + ' at ' + App.inr(M.missing[0].total) + ' was left out.</li>');
    $('cheatOut').innerHTML = out.join('');
    $('c-edit').disabled = S.cheat.edited; $('c-hide').disabled = S.cheat.hidden;
  }
  function showOut() { var o = $('cheatOut'); if (o && o.lastElementChild) o.lastElementChild.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' }); }
  function reset() { shown = { tie: null, avoid: null, areas: null }; }
  document.addEventListener('DOMContentLoaded', build);
  return { update: update, reset: reset };
})();
