// Small illustrated product tiles (inline SVG). Invented brands only; colours keyed to role.
var Art = (function () {
  var ROLE = { usual: ['#4FB3A9', '#3A8F87'], sponsor: ['#E7A93B', '#C98D24'], other: ['#8B7CF6', '#6E5FD9'] };
  function roleOf(cat, brand) { return brand === cat.usual ? 'usual' : brand === cat.sponsor ? 'sponsor' : 'other'; }
  function shape(item, c) {
    var k = item.toLowerCase(), a = c[0], b = c[1];
    if (/deodorant|body wash|shampoo|dishwash|floor/.test(k)) return '<rect x="13" y="3" width="14" height="7" rx="2" fill="#9FB1CF"/><rect x="8" y="10" width="24" height="34" rx="9" fill="' + a + '"/><rect x="8" y="22" width="24" height="9" fill="' + b + '"/>';
    if (/toothpaste|face wash/.test(k)) return '<rect x="5" y="17" width="30" height="13" rx="6" fill="' + a + '"/><rect x="29" y="20" width="8" height="7" rx="2" fill="' + b + '"/>';
    if (/atta|rice|dal|milk|tea|biscuit|detergent/.test(k)) return '<path d="M8 8h24l-2 36H10z" fill="' + a + '"/><rect x="9" y="18" width="22" height="10" fill="' + b + '"/>';
    if (/oil/.test(k)) return '<rect x="15" y="3" width="10" height="8" rx="2" fill="#9FB1CF"/><path d="M12 11h16l3 9v22a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V20z" fill="' + a + '"/>';
    if (/garbage/.test(k)) return '<path d="M10 12h20l-3 32H13z" fill="' + a + '"/><path d="M14 6h12l-2 6h-8z" fill="' + b + '"/>';
    return '<rect x="8" y="8" width="24" height="34" rx="6" fill="' + a + '"/>';
  }
  function product(catName, brand, item, size) {
    var cat = DATA.categories.filter(function (c) { return c.name === catName; })[0] || { usual: '', sponsor: '' };
    var c = ROLE[roleOf(cat, brand)];
    return '<svg class="prod" viewBox="0 0 40 48" width="' + (size || 36) + '" height="' + Math.round((size || 36) * 1.2) + '" aria-hidden="true">' + shape(item, c) + '</svg>';
  }
  function gold(size) {
    return '<svg viewBox="0 0 40 40" width="' + (size || 34) + '" height="' + (size || 34) + '" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="#E8B64C"/><circle cx="20" cy="20" r="10" fill="#C9962F"/><path d="M15 21h10M20 15v12" stroke="#FCE7B0" stroke-width="2"/></svg>';
  }
  function areaIcon(name) {
    var m = { 'Groceries': ['Atta', '#F4C76B', '#E3A93A'], 'Personal care': ['Deodorant', '#4FB3A9', '#3A8F87'], 'Household': ['Detergent', '#8B7CF6', '#6E5FD9'], 'Electronics': ['x', '#94A3B8', '#64748B'] };
    var v = m[name] || m.Electronics;
    if (name === 'Electronics') return '<svg viewBox="0 0 40 48" width="32" height="38" aria-hidden="true"><rect x="5" y="10" width="30" height="20" rx="3" fill="' + v[1] + '"/><rect x="2" y="31" width="36" height="4" rx="2" fill="' + v[2] + '"/></svg>';
    return '<svg viewBox="0 0 40 48" width="32" height="38" aria-hidden="true">' + shape(v[0], [v[1], v[2]]) + '</svg>';
  }
  return { product: product, gold: gold, areaIcon: areaIcon };
})();
