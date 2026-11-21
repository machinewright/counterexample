// Smallest interval sets where greedy "pick the interval with fewest conflicts among the remaining" beats... loses to optimum.
// Intervals [s,e) with 0<=s<e<=T. Ties broken by earliest end, then earliest start. Multisets allowed (no: distinct only).
#include <stdio.h>
#include <stdlib.h>
int T,N,M; int S[64],E[64]; int pick[16]; long found=0;
static int ov(int a,int b){return S[a]<E[b]&&S[b]<E[a];}
int opt(int n){ // earliest-end greedy is optimal
  int idx[16]; for(int i=0;i<n;i++)idx[i]=pick[i];
  int cnt=0,end=-1; // pick sorted by end; intervals enumerated sorted by end already
  for(int i=0;i<n;i++){int a=idx[i]; if(S[a]>=end){cnt++;end=E[a];}} return cnt;}
int greedy(int n){ int alive[16]; for(int i=0;i<n;i++)alive[i]=1; int cnt=0;
  for(;;){ int best=-1,bc=99; for(int i=0;i<n;i++)if(alive[i]){int c=0; for(int j=0;j<n;j++)if(j!=i&&alive[j]&&ov(pick[i],pick[j]))c++;
      if(c<bc){bc=c;best=i;} } // first in end-order wins ties => earliest end, then earliest start
    if(best<0)break; cnt++; for(int j=0;j<n;j++)if(alive[j]&&(j==best||ov(pick[best],pick[j])))alive[j]=0; }
  return cnt;}
void rec(int i,int from){ if(i==N){ if(greedy(N)<opt(N)){ if(!found++){ for(int k=0;k<N;k++)printf("[%d,%d) ",S[pick[k]],E[pick[k]]); printf("\n");} } return;}
  for(int a=from;a<M;a++){pick[i]=a;rec(i+1,a+1);} }
int main(int c,char**v){T=atoi(v[1]);N=atoi(v[2]); M=0; for(int e=1;e<=T;e++)for(int s=0;s<e;s++){S[M]=s;E[M]=e;M++;} // sorted by end, then start desc? 
  rec(0,0); printf("T=%d N=%d found=%ld\n",T,N,found);}
