// Smallest electorate where IRV (3 candidates) fails monotonicity: A wins, some voters
// raise A (move A from 2nd to 1st), and A then loses. Ties anywhere = invalid.
const B = ['ABC','ACB','BAC','BCA','CAB','CBA'];
function irv(cnt) { // cnt[6] -> winner letter or null on tie
  const n = cnt.reduce((a,b)=>a+b,0), first = {A:0,B:0,C:0};
  B.forEach((b,i)=>first[b[0]]+=cnt[i]);
  for (const c of 'ABC') if (2*first[c] > n) return c;
  const s = Object.entries(first).sort((x,y)=>x[1]-y[1]);
  if (s[0][1] === s[1][1]) return null;
  const out = s[0][0], [p,q] = 'ABC'.replace(out,'').split('');
  let vp = 0, vq = 0;
  B.forEach((b,i)=>{ const r = b.replace(out,''); if (r[0]===p) vp+=cnt[i]; else vq+=cnt[i]; });
  return vp === vq ? null : vp > vq ? p : q;
}
const found = [];
function* comps(n, k) { if (k===1) { yield [n]; return; } for (let i=0;i<=n;i++) for (const r of comps(n-i,k-1)) yield [i,...r]; }
for (let n = 1; n <= 17; n++) {
  let hits = 0, ex = null;
  for (const c of comps(n, 6)) {
    if (irv(c) !== 'A') continue;
    // raise A: BAC -> ABC (s1), CAB -> ACB (s2)
    // every raise of A that keeps B,C order: BAC->ABC, CAB->ACB, BCA->BAC|ABC, CBA->CAB|ACB
    const moves = [[2,0],[4,1],[3,2],[3,0],[5,4],[5,1]];
    const rec = (d, m, s) => {
      if (m === moves.length) { if (!s) return; const w = irv(d);
        if (w && w !== 'A') { hits++; if (!ex || s < ex.s) ex = {c, d, s, w}; } return; }
      const [f,t] = moves[m];
      for (let k = 0; k <= d[f]; k++) { const e=[...d]; e[f]-=k; e[t]+=k; rec(e, m+1, s+k); }
    };
    rec(c, 0, 0);
  }
  console.log(n, hits, ex && JSON.stringify(ex));
  if (hits && n > 0 && found.push(n) >= 4) break;
}
