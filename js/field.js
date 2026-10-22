// The agent's body: one dot per choice it made for Priya. Uniform blue is how it looks to her.
// The checkpoint arranges the same dots into weeks and gives each its real colour.
var Field = (function () {
  var el, nodes = {}, tags = {}, last = null, quick = false, rt = null;
  var ORDER = ['Groceries', 'Personal care', 'Household', 'Gold'];
  var KCLS = { 'aligned': 'k-ok', 'sponsored-tie': 'k-tie', 'overpaid-sponsored': 'k-over', 'overpaid': 'k-over', 'differs': 'k-diff' };

  function init() {
    el = U.$('field');
    // re-flow after the layout settles, without replaying the staggered entrance
    if (window.ResizeObserver) new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(function () { if (last) { quick = true; last(); quick = false; } }, 90); }).observe(el);
  }

  // Every choice in the card's window, keyed so the same choice keeps the same dot across views.
  function items(M, S) {
    var from = S.now - DATA.historyWeeks, seen = {}, out = [];
    M.p.slice().sort(function (a, b) { return ORDER.indexOf(a.category) - ORDER.indexOf(b.category) || a.week - b.week; }).forEach(function (p) {
      var w = p.week - from, id = p.category + '|' + p.week, j = seen[id] = (seen[id] || 0) + 1;
      out.push({ k: id + '|' + j, cat: p.category, col: w, row: j - 1, cls: KCLS[Model.classify(p)], p: p });
    });
    DATA.gold.weeklyPrice.forEach(function (g, w) { if (g <= DATA.gold.buyAtOrBelow) out.push({ k: 'Gold|' + w, cat: 'Gold', col: w, row: 0, cls: 'k-gold' }); });
    return out;
  }

  function put(list, labels, mode) {
    el.dataset.mode = mode;
    var keep = {};
    list.forEach(function (d) {
      var n = nodes[d.k];
      if (!n) {
        n = document.createElement('i'); n.className = 'd'; n.dataset.k = d.k;
        n.style.transform = 'translate(' + (d.fromX != null ? d.fromX : d.x) + 'px,' + (d.fromY != null ? d.fromY : d.y) + 'px) scale(0)';
        el.appendChild(n); nodes[d.k] = n; void n.offsetWidth;
      }
      n.className = 'd ' + d.c + (d.extra ? ' ' + d.extra : '');
      n.dataset.cat = d.cat || '';
      n.style.width = n.style.height = d.s + 'px';
      n.style.transitionDelay = (U.reduce || quick ? 0 : (d.delay || 0)) + 'ms';
      n.style.transform = 'translate(' + (d.x - d.s / 2) + 'px,' + (d.y - d.s / 2) + 'px) scale(' + (d.z || 1) + ')';
      n.style.opacity = d.o == null ? 1 : d.o;
      n.style.setProperty('--f', ((d.i || 0) % 7) * -0.9 + 's');
      keep[d.k] = 1;
    });
    Object.keys(nodes).forEach(function (k) {
      if (keep[k]) return;
      var n = nodes[k]; delete nodes[k];
      n.style.transitionDelay = '0ms'; n.style.opacity = 0; n.classList.add('out');
      setTimeout(function () { n.remove(); }, U.reduce ? 0 : 650);
    });
    var tk = {};
    labels.forEach(function (t) {
      var n = tags[t.k];
      if (!n) { n = document.createElement('div'); n.className = 'tag'; el.appendChild(n); tags[t.k] = n; n.style.opacity = 0; void n.offsetWidth; }
      n.className = 'tag ' + (t.cls || '');
      n.innerHTML = t.html;
      n.style.left = t.x + 'px'; n.style.top = t.y + 'px'; n.style.width = t.w ? t.w + 'px' : '';
      if (t.h) n.style.height = t.h + 'px'; else n.style.height = '';
      n.style.transitionDelay = (U.reduce ? 0 : (t.delay || 0)) + 'ms';
      n.style.opacity = 1; tk[t.k] = 1;
    });
    Object.keys(tags).forEach(function (k) { if (tk[k]) return; var n = tags[k]; delete tags[k]; n.style.transitionDelay = '0ms'; n.style.opacity = 0; setTimeout(function () { n.remove(); }, 400); });
  }

  // ---- layouts ----
  function swarm(M, S) {
    var it = items(M, S), w = el.clientWidth, h = el.clientHeight, cx = w / 2, cy = h / 2;
    var R = Math.min(w, h) * 0.44, n = it.length, c = R / Math.sqrt(n), s = Math.max(8, Math.min(18, c * 0.82));
    var list = it.map(function (d, i) {
      var a = i * 2.39996, r = c * Math.sqrt(i + 0.6);
      return { k: d.k, cat: d.cat, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), s: s, c: 'k-agent', i: i, delay: i * 4 };
    });
    put(list, [], 'swarm');
  }

  // Week grid. opts: {focus, flip, electronics, dispute, only}
  function grid(M, S, opts) {
    opts = opts || {};
    var it = items(M, S), w = el.clientWidth, h = el.clientHeight;
    var rows = [['Groceries', 6], ['Personal care', 2], ['Household', 1], ['Gold', 1]];
    if (opts.electronics) rows.push(['Electronics', 1]);
    var nRows = rows.reduce(function (a, r) { return a + r[1]; }, 0), headH = 40, axisH = 34;
    var pitch = Math.min(40, (w - 24) / 13, (h - rows.length * headH - axisH - 8) / nRows);
    var gw = pitch * 13, x0 = Math.max(12, (w - gw) / 2), s = Math.max(7, pitch * 0.62);
    var top = Math.max(4, (h - (nRows * pitch + rows.length * headH + axisH)) / 2), y = top, at = {}, labels = [];
    rows.forEach(function (r, ri) {
      var name = r[0];
      labels.push({ k: 'h|' + name, x: x0, y: y, w: gw, html: head(M, S, name, opts, gw < 520), cls: 'row-h' + (opts.focus && name !== 'Personal care' ? ' dim' : '') + (opts.dispute && M.verdicts[name] && M.verdicts[name].disputed ? ' disputed' : ''), delay: 300 + ri * 90 });
      at[name] = y + headH;
      if (name === 'Electronics') labels.push({ k: 'empty|e', x: x0, y: y + headH + 2, w: gw, h: pitch - 4, html: '0 decisions yet', cls: 'empty-row' });
      y += headH + r[1] * pitch;
    });
    var a = DATA.historyWeeks, from = S.now - a;
    labels.push({ k: 'axis', x: x0, y: y + 6, w: gw, html: '<span>Week ' + (from + 1) + '</span>' + (gw < 520 ? '' : '<span>Each dot is one choice her agents made</span>') + '<span>Week ' + S.now + '</span>', cls: 'axis' });
    var ex = M.rec['Personal care'].example;
    var list = it.map(function (d, i) {
      var o = { k: d.k, cat: d.cat, x: x0 + d.col * pitch + pitch / 2, y: at[d.cat] + d.row * pitch + pitch / 2, s: s, c: d.cls, i: i, delay: 120 + d.col * 38 + d.row * 14 };
      if (opts.focus) {
        var isEx = ex && d.p === ex;
        if (d.cat !== 'Personal care') o.o = 0.14;
        if (isEx) { o.z = 1.5; o.extra = 'ring'; o.delay = 400; }
      }
      if (opts.flip && d.cls === 'k-tie') o.extra = 'flip';
      return o;
    });
    put(list, labels, opts.focus ? 'focus' : 'grid');
  }
  function head(M, S, name, opts, small) {
    if (name === 'Gold') return '<b>Gold</b><span><i class="v ' + M.gold.light + '"></i>' + (small ? M.gold.bought + ' of ' + M.gold.chances + ' at her price' : 'Bought at her price ' + M.gold.bought + ' of ' + M.gold.chances + ' times') + '</span>';
    if (name === 'Electronics') return '<b>Electronics</b><span><i class="v grey"></i>' + (small ? 'No evidence yet' : 'Not enough evidence yet') + '</span>';
    var c = M.rec[name], v = M.verdicts[name];
    var t = c.tiesWon + ' of ' + c.tiesTotal + ' ties hers' + (c.avoidablePerMonth && !small ? ' · ' + U.inr(c.avoidablePerMonth) + '/month overpaid' : '');
    return '<b>' + name + '</b><span><i class="v ' + v.shown + '"></i>' + t + (opts.dispute && v.disputed ? ' · disputed' : '') + '</span>';
  }

  // One month after the decision: the personal-care ties, with and without her rule.
  function payoff(M, S) {
    var pb = S.payback, w = el.clientWidth, h = el.clientHeight;
    var n = Math.max(pb.tiesList.length, pb.tiesListWithout.length, 1), pitch = Math.min(96, (w - 40) / n), s = pitch * 0.5;
    var gw = pitch * n, x0 = (w - gw) / 2, y1 = h * 0.30, y2 = h * 0.66, list = [], labels = [];
    function row(arr, y, pre) {
      arr.forEach(function (x, i) { list.push({ k: pre + i, x: x0 + i * pitch + pitch / 2, y: y, s: s, c: x.chosen.role === 'usual' ? 'k-ok' : 'k-tie', delay: 300 + i * 160, fromX: w / 2, fromY: h / 2 }); });
    }
    row(pb.tiesList, y1, 'PW|'); row(pb.tiesListWithout, y2, 'PN|');
    labels.push({ k: 'pw', x: x0, y: y1 - s / 2 - 46, w: gw, html: '<b>With her rule</b><span>' + pb.wonWith + ' of ' + pb.ties + ' went to her usual brand</span>', cls: 'row-h big' });
    labels.push({ k: 'pn', x: x0, y: y2 - s / 2 - 46, w: gw, html: '<b>Same month, no rule</b><span>' + pb.wonWithout + ' of ' + pb.tiesListWithout.length + '</span>', cls: 'row-h big muted' });
    labels.push({ k: 'axis', x: x0, y: y2 + s / 2 + 22, w: gw, html: '<span>Personal-care ties, weeks ' + (S.now - 3) + ' to ' + S.now + '</span>', cls: 'axis c' });
    put(list, labels, 'payoff');
  }

  // A limit sees totals; the checkpoint sees choices. Same dots, two readings.
  function split(M, S) {
    var it = items(M, S), w = el.clientWidth, h = el.clientHeight, list = [], labels = [], narrow = w < 560;
    var R = narrow ? [[0, 0, w, h / 2], [0, h / 2, w, h / 2]] : [[0, 0, w / 2, h], [w / 2, 0, w / 2, h]];
    var rowsAt = { 'Groceries': 0, 'Personal care': 6, 'Household': 8, 'Gold': 9 };
    R.forEach(function (r, side) {
      var labH = narrow ? 82 : 100, pitch = Math.min(22, (r[2] - 36) / 13, (r[3] - labH - 16) / 10), s = pitch * 0.66, gw = pitch * 13;
      var top = narrow ? r[1] + labH : Math.max(r[1] + labH + 10, r[1] + (r[3] - 10 * pitch) / 2 + 20), x0 = r[0] + (r[2] - gw) / 2;
      it.forEach(function (d, i) {
        list.push({ k: (side ? '' : 'L|') + d.k, cat: d.cat, x: x0 + d.col * pitch + pitch / 2, y: top + (rowsAt[d.cat] + d.row) * pitch + pitch / 2, s: s, c: side ? d.cls : 'k-agent', i: i, delay: 80 + d.col * 30 });
      });
      labels.push({ k: 'sp' + side, x: r[0] + 16, y: top - labH + (narrow ? 4 : 4), w: r[2] - 32, cls: 'split-h' + (side ? ' lit' : ''),
        html: side ? '<span>What Trust Checkpoint sees</span><b>' + M.tiesWon + ' of ' + M.tiesTotal + ' ties went her way. ' + U.inr(M.avoidable) + ' a month overpaid on non-ties.</b>'
                   : '<span>What a spending limit sees</span><b>' + U.inr(DATA.moneyAgent.shoppingBudgetUsed) + ' of ' + U.inr(S.limit) + ' used. All within limit.</b>' });
    });
    if (!narrow) labels.push({ k: 'divider', x: w / 2 - 1, y: 40, h: h - 80, html: '', cls: 'divider' });
    put(list, labels, 'split');
  }

  function show(kind, M, S, opts) {
    last = function () { ({ swarm: swarm, grid: grid, payoff: payoff, split: split })[kind](M, S, opts); };
    last();
  }
  return { init: init, show: show, items: items };
})();
