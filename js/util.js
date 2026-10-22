// Shared helpers.
var U = {
  inr: function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); },
  esc: function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); },
  $: function (id) { return document.getElementById(id); },
  LIGHT: { green: 'Earned', amber: 'Check', red: 'Hold back', grey: 'Not enough evidence yet' },
  reduce: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
  word: function (item) { return item.split(' ')[0].toLowerCase(); },
  store: function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
};
