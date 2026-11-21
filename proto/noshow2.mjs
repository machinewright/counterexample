// Like noshow.mjs but the joiners may cast ANY mix of ballots, as long as every joiner ranks the
// old winner above the new one. Smallest total electorate (after joining), no ties anywhere.
import { runoff } from '../src/algo.js';
const R = ['ABC','ACB','BAC','BCA','CAB','CBA'];
function* comps(n, k) { if (k === 1) { yield [n]; return; }
  for (let i = 0; i <= n; i++) for (const t of comps(n - i, k - 1)) yield [i, ...t]; }
function* subs(c, i = 0) { if (i === c.length) { yield []; return; }
  for (let k = 0; k <= c[i]; k++) for (const t of subs(c, i + 1)) yield [k, ...t]; }
const obj = a => Object.fromEntries(R.map((r, i) => [r, a[i]]));
for (let T = 1; T <= +(process.argv[2] || 12); T++) {
  let found = 0, ex = null;
  for (const after of comps(T, 6)) {
    const w2 = runoff(obj(after)).winner; if (!w2) continue;
    for (const j of subs(after)) {
      if (!j.some(Boolean)) continue;
      const before = after.map((x, i) => x - j[i]);
      const w1 = runoff(obj(before)).winner; if (!w1 || w1 === w2) continue;
      if (j.every((k, i) => !k || R[i].indexOf(w1) < R[i].indexOf(w2))) { found++; ex ??= { before, j, w1, w2 }; }
    }
  }
  console.log(T, found, ex ? JSON.stringify(ex) : ''); if (found) break;
}
