// Worst nearest-neighbour tour / best tour for k cities on a G x G grid; home = first city; ties: lower index (row-major).
const G=+process.argv[2]||6, K=+process.argv[3]||5;
const pts=[];for(let y=0;y<G;y++)for(let x=0;x<G;x++)pts.push([x,y]);
const d=(a,b)=>Math.hypot(pts[a][0]-pts[b][0],pts[a][1]-pts[b][1]);
function nn(c){const left=c.slice(1);let cur=c[0],L=0;while(left.length){let bi=0;for(let i=1;i<left.length;i++){if(d(cur,left[i])<d(cur,left[bi])-1e-9)bi=i;}L+=d(cur,left[bi]);cur=left.splice(bi,1)[0];}return L+d(cur,c[0]);}
function opt(c){let best=Infinity;const r=c.slice(1);(function perm(a,k){if(k===a.length){let L=d(c[0],a[0]);for(let i=1;i<a.length;i++)L+=d(a[i-1],a[i]);L+=d(a.at(-1),c[0]);if(L<best)best=L;return;}for(let i=k;i<a.length;i++){[a[k],a[i]]=[a[i],a[k]];perm(a,k+1);[a[k],a[i]]=[a[i],a[k]];}})(r,0);return best;}
let best=0,ex=null;const N=pts.length;
for(let h=0;h<N;h++){const c=[h];(function rec(from,k){if(k===K){const r=nn(c)/opt(c);if(r>best+1e-9){best=r;ex=c.map(i=>pts[i].join(',')).join(' ');}return;}for(let i=from;i<N;i++){if(i===h)continue;c.push(i);rec(i+1,k+1);c.pop();}})(0,1);}
console.log(G,K,best.toFixed(4),ex);
