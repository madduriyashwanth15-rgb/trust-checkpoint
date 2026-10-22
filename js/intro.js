// Cold open: about 12 seconds, skippable, once per visit. It ends on the same tie the product later inspects.
var Intro = (function () {
  var T = [], done;
  function $(id) { return document.getElementById(id); }
  function at(ms, fn) { T.push(setTimeout(fn, U.reduce ? 0 : ms)); }
  function on(id) { var e = $(id); if (e) e.classList.add('on'); }
  function off(id) { var e = $(id); if (e) e.classList.remove('on'); }
  function end() {
    T.forEach(clearTimeout); T = [];
    var o = $('intro'); if (!o) return;
    o.classList.add('gone'); U.store('tc-intro-seen', '1');
    setTimeout(function () { o.hidden = true; o.classList.remove('gone'); if (done) { var d = done; done = null; d(); } var f = document.querySelector('.allow'); if (f) f.focus({ preventScroll: true }); }, U.reduce ? 0 : 700);
  }
  function rain(n) {
    var r = $('rain'), colours = ['#7FAEFF', '#6FA2FF', '#9DC0FF'];
    for (var i = 0; i < n; i++) (function (i) {
      T.push(setTimeout(function () { var d = document.createElement('i'); d.className = 'drop'; d.style.left = (Math.random() * 100) + '%'; d.style.background = colours[i % colours.length]; d.style.animationDuration = (1.2 + Math.random()) + 's'; r.appendChild(d); setTimeout(function () { d.remove(); }, 2600); }, i * 26));
    })(i);
  }
  function count(to, ms) { var el = $('cnt'), t0 = performance.now(); (function s(t) { var k = Math.min(1, (t - t0) / ms); el.textContent = Math.round(to * k); if (k < 1) requestAnimationFrame(s); })(t0); }
  function play(force, cb) {
    var o = $('intro');
    if (!force && (U.store('tc-intro-seen') || /[?&]nointro=1/.test(location.search))) { o.hidden = true; if (cb) cb(); return; }
    done = cb; o.hidden = false; ['l1', 'l2', 'l3', 'tie', 'stamp', 'l4'].forEach(off);
    $('cnt').textContent = '0';
    // the tie shown here is computed, not drawn by hand
    var ex = Model.compute(App.state()).rec['Personal care'].example;
    if (ex) { $('i-usual').innerHTML = Art.product(ex.category, ex.options[0].brand, ex.item, 70) + '<b>' + ex.options[0].brand + '</b><span>Her usual · ' + U.inr(ex.options[0].total) + ' · ' + ex.options[0].rating + '★</span>';
              $('i-spons').innerHTML = '<span class="stamp" id="stamp">Sponsored</span>' + Art.product(ex.category, ex.chosen.brand, ex.item, 70) + '<b>' + ex.chosen.brand + '</b><span>' + U.inr(ex.chosen.total) + ' · ' + ex.chosen.rating + '★</span><em class="picked">Agent picked</em>'; }
    $('skip').focus({ preventScroll: true });
    if (U.reduce) { on('tie'); on('stamp'); on('l4'); return; }
    at(200, function () { on('l1'); });
    at(1500, function () { off('l1'); });
    at(2000, function () { on('l2'); rain(90); count(Model.compute(App.state()).decisions, 2200); });
    at(5200, function () { off('l2'); on('l3'); });
    at(6900, function () { off('l3'); on('tie'); });
    at(7800, function () { on('stamp'); });
    at(8400, function () { on('l4'); });
    at(12600, end);
  }
  document.addEventListener('DOMContentLoaded', function () { $('skip').addEventListener('click', end); $('intro').addEventListener('keydown', function (e) { if (e.key === 'Escape') end(); }); });
  return { play: play, end: end };
})();
