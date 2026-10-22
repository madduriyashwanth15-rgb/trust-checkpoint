// Record locking demo (spec 8b). Reads purchases from logic.js; never changes logic.js or its random draws.
// Each record gets a SHA-256 fingerprint of its contents plus the previous fingerprint (a simple chain).
// Pure JavaScript SHA-256 so it works the same from file:// in every browser, offline.
var Lock = (function () {
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var maxWord = Math.pow(2, 32), result = '', words = [], bitLen = ascii.length * 8;
    var hash = [], k = [], primeCounter = 0, isComposite = {};
    for (var c = 2; primeCounter < 64; c++) {
      if (!isComposite[c]) {
        for (var i = 0; i < 313; i += c) isComposite[i] = c;
        hash[primeCounter] = (Math.pow(c, .5) * maxWord) | 0;
        k[primeCounter++] = (Math.pow(c, 1 / 3) * maxWord) | 0;
      }
    }
    hash = hash.slice(0, 8);
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) { var j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = ((bitLen / maxWord) | 0);
    words[words.length] = (bitLen);
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var temp1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += ((b < 16) ? 0 : '') + b.toString(16); }
    return result;
  }
  // Records only contain ASCII once rupee signs are left out of the data, so this is safe.
  function toRecord(p, ruleOn) {
    return { week: p.week, category: p.category, item: p.item,
      options: p.options.map(function (o) { return { brand: o.brand, price: o.price, deliveryFee: o.deliveryFee, rating: o.rating, sponsored: o.sponsored }; }),
      chosen: p.chosen.brand, rule: ruleOn ? 'On ties, pick my usual brand' : null };
  }
  // The checker's own catalogue snapshot: a separate copy taken at load, never read from an agent's record.
  var snapshot = JSON.parse(JSON.stringify(DATA.categories));

  function write(ledger, rec) {
    var prev = ledger.length ? ledger[ledger.length - 1].hash : 'genesis';
    ledger.push({ rec: rec, prev: prev, hash: sha256(prev + '|' + JSON.stringify(rec)) });
  }
  function buildLedger(purchases, ruleFromWeek) {
    var ledger = [];
    purchases.forEach(function (p) { write(ledger, toRecord(p, ruleFromWeek !== null && p.week >= ruleFromWeek)); });
    return ledger;
  }
  // Verify each record against its stored fingerprint (using the stored previous fingerprint).
  function verify(ledger) {
    var res = {};
    ledger.forEach(function (e) {
      var c = res[e.rec.category] || (res[e.rec.category] = { total: 0, match: 0, broken: [] });
      c.total++;
      if (sha256(e.prev + '|' + JSON.stringify(e.rec)) === e.hash) c.match++; else c.broken.push(e);
    });
    return res;
  }
  // Spot-check a record against the snapshot: did it leave out an option that was cheaper or equal?
  function missingOptions(rec) {
    var cat = snapshot.filter(function (c) { return c.name === rec.category; })[0];
    if (!cat) return [];
    var item = cat.items.filter(function (i) { return i.item === rec.item; })[0];
    if (!item) return [];
    var listed = rec.options.map(function (o) { return o.brand; });
    var chosen = rec.options.filter(function (o) { return o.brand === rec.chosen; })[0];
    var chosenTotal = chosen ? chosen.price + chosen.deliveryFee : Infinity;
    var all = [[cat.usual, item.usual], [cat.sponsor, item.sponsor], [cat.other, item.other]];
    return all.filter(function (a) { return listed.indexOf(a[0]) < 0 && a[1][0] + a[1][1] <= chosenTotal; })
              .map(function (a) { return { brand: a[0], total: a[1][0] + a[1][1] }; });
  }
  return { sha256: sha256, buildLedger: buildLedger, write: write, verify: verify, missingOptions: missingOptions, toRecord: toRecord };
})();
