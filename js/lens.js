// The Trust Checkpoint lens: a glass magnifier over the agent's picks. Outside it everything looks fine;
// under it, each pick shows what actually decided it (computed by the frozen logic in Screens.picks).
var LensUI = (function () {
  var R = 92, MAG = 1.12;
  var st = { on: false, x: 0, y: 0, tile: null }, timers = [], hold = null, S = null;

  function el(id) { return document.getElementById(id); }
  function scaleOf(node) { var r = node.getBoundingClientRect(); return node.offsetWidth ? r.width / node.offsetWidth : 1; }

  function apply() {
    var pk = el('picks'), xr = el('xray'), ln = el('lens');
    if (!pk || !xr || !ln) return;
    pk.classList.toggle('lensing', !!(S && S.step === 1));
    if (S && S.lensFull) {
      xr.style.transform = 'none'; xr.style.clipPath = 'inset(0 round 18px)';
      xr.dataset.lr = 9999; ln.classList.remove('on'); return;
    }
    if (!st.on) {
      xr.style.clipPath = 'circle(0px at ' + (st.x - xr.offsetLeft) + 'px ' + (st.y - xr.offsetTop) + 'px)'; xr.dataset.lr = 0;
      ln.classList.remove('on'); return;
    }
    xr.querySelectorAll('.x-tile').forEach(function (t, k) { t.classList.toggle('cur', k === st.tile); });
    // the layer is bigger than the picks so the circle is never cut flat; convert to its own coordinates
    var lx = st.x - xr.offsetLeft, ly = st.y - xr.offsetTop;
    xr.style.transformOrigin = lx + 'px ' + ly + 'px';
    xr.style.transform = 'scale(' + MAG + ')';
    xr.style.clipPath = 'circle(' + (R / MAG).toFixed(1) + 'px at ' + lx + 'px ' + ly + 'px)';
    xr.dataset.lx = Math.round(st.x); xr.dataset.ly = Math.round(st.y); xr.dataset.lr = R;
    ln.style.transform = 'translate(' + (st.x - R) + 'px,' + (st.y - R) + 'px)';
    ln.classList.add('on');
  }

  function centre(t) {
    var pk = el('picks'), pr = pk.getBoundingClientRect(), r = t.getBoundingClientRect(), s = scaleOf(pk);
    return { x: (r.left - pr.left + r.width / 2) / s, y: (r.top - pr.top + r.height / 2) / s };
  }
  // snap to the centre of the nearest pick, so the lens always reads one whole card, never fragments
  function target(px, py) {
    var best = null, bd = Infinity;
    el('picks').querySelectorAll('.pk-face .p-tile').forEach(function (t, k) {
      var c = centre(t), d = (c.x - px) * (c.x - px) + (c.y - py) * (c.y - py);
      if (d < bd) { bd = d; best = { x: c.x, y: c.y, tile: k }; }
    });
    return best || { x: px, y: py, tile: null };
  }
  function local(e) {
    var pk = el('picks'), r = pk.getBoundingClientRect(), s = scaleOf(pk);
    return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
  }
  function moveTo(px, py) { var t = target(px, py); st.on = true; st.x = t.x; st.y = t.y; st.tile = t.tile; apply(); }
  function off() { if (S && S.step === 1) { park(st.tile == null ? 0 : st.tile); return; } st.on = false; apply(); }

  function park(i) {
    var pk = el('picks'); if (!pk) return;
    var t = pk.querySelectorAll('.pk-face .p-tile')[i]; if (!t) return;
    var c = centre(t); st.on = true; st.tile = i; st.x = c.x; st.y = c.y;
    apply();
  }

  function bind(state) {
    S = state;
    var pk = el('picks'); if (!pk) return;
    if (S.step !== 1 && !S.lensFull) st.on = false;
    // the revealed cards sit exactly under the visible ones
    var face = pk.querySelectorAll('.pk-face .p-tile');
    pk.querySelectorAll('.pk-xray .x-tile').forEach(function (t, k) { if (face[k]) t.style.height = face[k].offsetHeight + 'px'; });
    pk.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' && !hold) return;
      if (e.pointerType === 'touch' && hold && hold.live === false) return;
      var p = local(e); moveTo(p.x, p.y);
    });
    pk.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') off(); });
    pk.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') return;
      var p = local(e);
      hold = { live: false, t: setTimeout(function () { hold.live = true; moveTo(p.x, p.y); }, 160) };
    });
    function up(e) { if (e.pointerType !== 'touch' || !hold) return; clearTimeout(hold.t); var was = hold.live; hold = null; if (was) off(); }
    pk.addEventListener('pointerup', up); pk.addEventListener('pointercancel', up);
    apply();
  }

  // autoplay: glide across the four picks, then reveal everything at once
  function glide() {
    stopGlide();
    var order = [1, 2, 3, 0], step = U.reduce ? 150 : 850;
    order.forEach(function (i, k) { timers.push(setTimeout(function () { park(i); }, 250 + k * step)); });
    timers.push(setTimeout(function () { var s = App.state(); s.lensFull = true; App.render(); }, 250 + order.length * step + 300));
    timers.push(setTimeout(function () { var s = App.state(); s.lensFull = false; App.render(); park(0); }, 250 + order.length * step + 1900));
  }
  function stopGlide() { timers.forEach(clearTimeout); timers = []; }

  return { bind: bind, park: park, glide: glide, stopGlide: stopGlide, state: function () { return st; } };
})();
