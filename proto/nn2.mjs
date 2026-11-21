// Like nn.mjs, but also: worst ratio among placements where NN never faces a tie; and how many reach >= 1.2 / 1.3.
const G=6, K=5;
const pts=[];for(let y=0;y<G;y++)for(let x=0;x<G;x++)pts.push([x,y]);
const d=(a,b)=>Math.hypot(pts[a][0]-pts[b][0],pts[a][1]-pts[b][1]);
function nn(c){const left=c.slice(1);let cur=c[0],L=0,tie=false;while(left.length){
 let db=Infinity,bi=-1;for(let i=0;i<left.length;i++){const di=d(cur,left[i]);if(di<db-1e-9){db=di;bi=i;}}
 if(left.filter(x=>Math.abs(d(cur,x)-db)<1e-9).length>1)tie=true;
 L+=db;cur=left.splice(bi,1)[0];}return [L+d(cur,c[0]),tie];}
function opt(c){let best=Infinity;const r=c.slice(1);(function perm(a,k){if(k===a.length){let L=d(c[0],a[0]);for(let i=1;i<a.length;i++)L+=d(a[i-1],a[i]);L+=d(a.at(-1),c[0]);if(L<best)best=L;return;}for(let i=k;i<a.length;i++){[a[k],a[i]]=[a[i],a[k]];perm(a,k+1);[a[k],a[i]]=[a[i],a[k]];}})(r,0);return best;}
let bestAll=0,bestNoTie=0,ex=null,n12=0,n13=0,tot=0;const N=pts.length;
for(let h=0;h<N;h++){const c=[h];(function rec(from,k){if(k===K){const [L,tie]=nn(c);const r=L/opt(c);tot++;if(r>=1.2)n12++;if(r>=1.3)n13++;if(r>bestAll)bestAll=r;if(!tie&&r>bestNoTie+1e-9){bestNoTie=r;ex=c.map(i=>pts[i].join(',')).join(' ');}return;}for(let i=from;i<N;i++){if(i===h)continue;c.push(i);rec(i+1,k+1);c.pop();}})(0,1);}
console.log({bestAll:bestAll.toFixed(4),bestNoTie:bestNoTie.toFixed(4),ex,tot,n12,n13});
