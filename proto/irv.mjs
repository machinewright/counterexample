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
for (let n = 1; n <= 30; n++) {
  let hits = 0, ex = null;
  for (const c of comps(n, 6)) {
    if (irv(c) !== 'A') continue;
    // raise A: BAC -> ABC (s1), CAB -> ACB (s2)
    for (let s1 = 0; s1 <= c[2]; s1++) for (let s2 = 0; s2 <= c[4]; s2++) {
      if (!s1 && !s2) continue;
      const d = [...c]; d[2]-=s1; d[0]+=s1; d[4]-=s2; d[1]+=s2;
      const w = irv(d);
      if (w && w !== 'A') { hits++; if (!ex || s1+s2 < ex.s) ex = {c, s1, s2, s:s1+s2, w}; }
    }
  }
  console.log(n, hits, ex && JSON.stringify(ex));
  if (hits && n > 0 && found.push(n) >= 4) break;
}
