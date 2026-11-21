// Shortest FIFO request sequence where 4 frames fault more than 3 (pages canonical: first uses in order 1,2,3..)
function faults(seq, k){ const q=[]; let f=0; for(const p of seq){ if(!q.includes(p)){ f++; q.push(p); if(q.length>k) q.shift(); } } return f; }
const P=+process.argv[2]||5;
for(let L=1;L<=13;L++){ let count=0, ex=null;
  const s=[]; (function rec(i,mx){ if(i===L){ if(faults(s,4)>faults(s,3)){count++; ex??=s.join(',');} return; }
    for(let p=1;p<=Math.min(mx+1,P);p++){ s[i]=p; rec(i+1,Math.max(mx,p)); } })(0,0);
  console.log(L,count,ex); if(count) break; }
