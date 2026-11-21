import { misses } from '../src/algo.js';
for (const [P,k] of [[4,3],[5,3]]) for (let L=1;L<=10;L++){ let ex=null,c=0; const s=[];
 (function rec(i,mx){ if(i===L){ if(misses(s,k,'fifo')>misses(s,k,'lru')){c++;ex??=s.join('');} return;} for(let p=0;p<=Math.min(mx+1,P-1);p++){s[i]='ABCDE'[p];rec(i+1,Math.max(mx,p));}})(0,-1);
 if(c){console.log('pages',P,'k',k,'len',L,c,ex);break;} }
