// greedy interval rules; [s,e) half-open. key(i, alive) -> smaller is picked first; ties by end, then start.
const ov=(a,b)=>a[0]<b[1]&&b[0]<a[1];
export const RULES={
  shortest:(I,i)=>I[i][1]-I[i][0],
  start:(I,i)=>I[i][0],
  conflicts:(I,i,alive)=>I.reduce((c,x,j)=>c+(j!==i&&alive[j]&&ov(I[i],x)?1:0),0),
};
export function greedy(I,rule){const alive=I.map(()=>true),out=[];for(;;){let b=-1,bk;
  I.forEach((x,i)=>{if(!alive[i])return;const k=[RULES[rule](I,i,alive),x[1],x[0]];if(b<0||k[0]<bk[0]||k[0]===bk[0]&&(k[1]<bk[1]||k[1]===bk[1]&&k[2]<bk[2])){b=i;bk=k;}});
  if(b<0)return out;out.push(b);const pb=I[b];I.forEach((x,j)=>{if(j===b||ov(pb,x))alive[j]=false;});}}
export function best(I){const s=[...I].sort((a,b)=>a[1]-b[1]);let c=0,e=-1;for(const x of s)if(x[0]>=e){c++;e=x[1];}return c;}
if(process.argv[2]){const T=8,all=[];for(let e=1;e<=T;e++)for(let s=0;s<e;s++)all.push([s,e]);
 for(let n=2;n<=6;n++){let ex=null,cnt=0;const p=[];(function rec(i,f){if(i===n){const I=p.map(k=>all[k]);const b=best(I);
   if(process.argv.slice(2).every(r=>greedy(I,r).length<b)){cnt++;ex??=JSON.stringify(I);}return;}for(let a=f;a<all.length;a++){p[i]=a;rec(i+1,a+1);}})(0,0);
  console.log(n,cnt,ex);if(cnt)break;}}
