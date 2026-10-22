// "Behind the scenes": the machinery Priya can't see. Every control re-runs the model; the dots and the card update.
var Lab = (function () {
  var el, shown = { tie: null, avoid: null, areas: null };
  function $(id) { return document.getElementById(id); }
  function build() {
    el = $('lab');
    el.innerHTML =
      '<div class="lab-head"><h2>Behind the scenes</h2><button type="button" class="back" data-act="lab">Close</button></div>' +
      '<p class="lead">Change how her agent behaves and watch the dots and the card change. All data is seeded mock data.</p>' +
      '<div class="grp"><label class="gl" for="infl">How much sponsors sway her agent: <output id="inflOut">40%</output></label><input type="range" id="infl" min="0" max="60" step="5" value="40"><div class="scale"><span>0%</span><span>60%</span></div></div>' +
      '<div class="grp"><span class="gl" id="tlbl">Time</span><div class="seg four" role="group" aria-labelledby="tlbl"><button type="button" data-ff="1">+1 week</button><button type="button" data-ff="4">+1 month</button><button type="button" data-ff="13">+3 months</button><button type="button" data-ff="0">Today</button></div><p class="tiny" id="clock"></p></div>' +
      '<div class="grp"><label class="sw"><input type="checkbox" id="d-rule"><span><b>On ties, pick my usual brand</b><small id="ruleNote">Turn on to apply it to the last 3 months</small></span></label></div>' +
      '<div class="metrics" aria-live="polite"><div><b id="m-tie">0%</b><span>Ties won by Priya</span></div><div><b id="m-avoid">₹0</b><span>Overpaid a month</span></div><div><b id="m-areas">0</b><span>Areas handed over</span></div></div>' +
      '<div class="grp"><span class="gl">Try to cheat the records</span><div class="cheats"><button type="button" id="c-edit">Edit an old record</button><button type="button" id="c-hide">Hide an option when writing</button><button type="button" id="c-reset">Reset</button></div><ul class="cheat-out" id="cheatOut"></ul></div>' +
      '<div class="grp"><div class="pair"><button type="button" class="b" data-act="export">Export her records</button><button type="button" class="b" data-act="restart">Restart</button></div></div>' +
      '<div class="grp"><span class="gl">What just happened</span><ol class="events" id="events"></ol></div>';
    $('infl').addEventListener('input', function (e) { App.state().influence = e.target.value / 100; App.render(); });
    $('infl').addEventListener('change', function (e) { App.log('Sponsor sway set to ' + e.target.value + '%'); App.render(); });
    el.querySelectorAll('[data-ff]').forEach(function (b) {
      b.addEventListener('click', function () { var S = App.state(), n = +b.dataset.ff; S.payback = null; if (S.c === 4 || S.c === 5) S.c = 1; if (n === 0) { S.now = DATA.historyWeeks; App.log('Back to today'); } else { S.now += n; App.log('Moved ahead ' + b.textContent.slice(1)); } App.render(); });
    });
    $('d-rule').addEventListener('change', function (e) { var S = App.state(); S.ruleFrom = e.target.checked ? S.now - DATA.historyWeeks : null; App.log(e.target.checked ? 'Tie rule on (3 months ago)' : 'Tie rule off'); App.render(); });
    $('c-edit').addEventListener('click', function () { App.state().cheat.edited = true; App.log('Someone edited an old record'); App.render(); });
    $('c-hide').addEventListener('click', function () { App.state().cheat.hidden = true; App.log('Agent hid an option when writing'); App.render(); });
    $('c-reset').addEventListener('click', function () { App.state().cheat = { edited: false, hidden: false }; App.log('Records reset'); App.render(); });
  }
  function countTo(node, from, to, fmt) {
    if (U.reduce || from === null || from === to) { node.textContent = fmt(to); return; }
    var t0 = performance.now();
    (function step(t) { var k = Math.min(1, (t - t0) / 400); node.textContent = fmt(from + (to - from) * k); if (k < 1) requestAnimationFrame(step); })(t0);
  }
  function update(M, S, history) {
    if (!el) return;
    $('infl').value = Math.round(S.influence * 100); $('inflOut').textContent = Math.round(S.influence * 100) + '%';
    $('d-rule').checked = S.ruleFrom !== null;
    $('ruleNote').textContent = S.ruleFrom !== null ? 'On since week ' + (S.ruleFrom + 1) : 'Turn on to apply it to the last 3 months';
    $('clock').textContent = 'The record covers weeks ' + (S.now - DATA.historyWeeks + 1) + ' to ' + S.now;
    var tie = Math.round(M.tieRate * 100);
    countTo($('m-tie'), shown.tie, tie, function (v) { return Math.round(v) + '%'; });
    countTo($('m-avoid'), shown.avoid, M.avoidable, function (v) { return U.inr(v); });
    countTo($('m-areas'), shown.areas, M.areas, function (v) { return String(Math.round(v)); });
    shown = { tie: tie, avoid: M.avoidable, areas: M.areas };
    var pc = M.lock['Personal care'] || { match: 0, total: 0, broken: [] }, out = [];
    out.push('<li class="' + (pc.broken.length ? 'bad' : 'ok') + '">' + (pc.broken.length ? 'Tamper caught: a record was changed after it was written. ' : '') + 'Personal care: ' + pc.match + ' of ' + pc.total + ' records unchanged since written.</li>');
    if (M.missing.length) out.push('<li class="bad">Hidden option caught by the spot-check, even though the record itself looked untouched: ' + M.missing[0].brand + ' at ' + U.inr(M.missing[0].total) + ' was left out.</li>');
    $('cheatOut').innerHTML = out.join('');
    $('c-edit').disabled = S.cheat.edited; $('c-hide').disabled = S.cheat.hidden;
    $('events').innerHTML = history.length ? history.map(function (h) { return '<li><span>Week ' + h.w + '</span>' + U.esc(h.t) + '</li>'; }).join('') : '<li class="empty">Nothing yet. Every change you make is listed here.</li>';
  }
  function reset() { shown = { tie: null, avoid: null, areas: null }; }
  return { build: build, update: update, reset: reset };
})();
