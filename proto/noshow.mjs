// No-show paradox for instant runoff, 3 candidates: smallest electorate where a group of
// identical sincere ballots that SHOW UP turns the winner from W into someone they rank BELOW W.
// Ties anywhere (elimination or final) disqualify a profile. Exhaustive over all ballot counts.
const R = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
function irv(c) {
  const first = [0,0,0];
  R.forEach((r,i) => first[r[0]] += c[i]);
  const lo = Math.min(...first);
  if (first.filter(x => x === lo).length > 1) return -1;
  const out = first.indexOf(lo);
  const [a,b] = [0,1,2].filter(x => x !== out);
  let va = 0, vb = 0;
  R.forEach((r,i) => { r.indexOf(a) < r.indexOf(b) ? va += c[i] : vb += c[i]; });
  return va === vb ? -1 : (va > vb ? a : b);
}
function* comps(n, k) { if (k === 1) { yield [n]; return; }
  for (let i = 0; i <= n; i++) for (const t of comps(n - i, k - 1)) yield [i, ...t]; }
const MAX = +(process.argv[2] || 16);
for (let total = 1; total <= MAX; total++) {
  let found = 0, ex = null, minK = Infinity;
  for (const after of comps(total, 6)) {
    const w2 = irv(after); if (w2 < 0) continue;
    for (let j = 0; j < 6; j++) for (let k = 1; k <= after[j]; k++) {
      const before = after.slice(); before[j] -= k;
      const w1 = irv(before); if (w1 < 0 || w1 === w2) continue;
      if (R[j].indexOf(w1) < R[j].indexOf(w2)) { found++; if (k < minK || !ex) { minK = Math.min(minK,k); ex = {before, j, k, w1, w2}; } }
    }
  }
  console.log(total, found, ex ? JSON.stringify(ex) : '');
  if (found) break;
}
