// Pure algorithms the levels run, plus exact checkers used by tests to prove each level's best answer.

/** Greedy change-making: take the largest coin that fits, repeat. Returns the coins used. */
export function greedyChange(coins, amount) {
  const out = [], sorted = [...coins].sort((a, b) => b - a);
  let left = amount;
  for (const c of sorted) while (left >= c) { out.push(c); left -= c; }
  return left === 0 ? out : null;
}

/** Fewest coins that make `amount` exactly (dynamic programming). Returns the coins used, largest first. */
export function fewestChange(coins, amount) {
  const best = new Array(amount + 1).fill(Infinity), last = new Array(amount + 1).fill(0);
  best[0] = 0;
  for (let a = 1; a <= amount; a++) for (const c of coins)
    if (c <= a && best[a - c] + 1 < best[a]) { best[a] = best[a - c] + 1; last[a] = c; }
  if (best[amount] === Infinity) return null;
  const out = [];
  for (let a = amount; a > 0; a -= last[a]) out.push(last[a]);
  return out.sort((x, y) => y - x);
}

/** Greedy colouring in the given order: each vertex gets the smallest colour (0, 1, ...) no coloured neighbour has. */
export function greedyColour(adj, order) {
  const col = new Array(adj.length).fill(-1);
  for (const v of order) col[v] = firstFree(adj, col, v);
  return col;
}
export function firstFree(adj, col, v) {
  const used = new Set(adj[v].map(u => col[u]));
  let c = 0; while (used.has(c)) c++;
  return c;
}

/** Most colours greedy colouring can be made to use over all orders (the Grundy number), by search. */
export function mostGreedyColours(adj) {
  const n = adj.length, col = new Array(n).fill(-1);
  let best = 0;
  (function rec(done, mx) {
    if (mx > best) best = mx;
    if (done === n) return;
    for (let v = 0; v < n; v++) if (col[v] < 0) {
      col[v] = firstFree(adj, col, v); rec(done + 1, Math.max(mx, col[v] + 1)); col[v] = -1;
    }
  })(0, 0);
  return best;
}

/** Fewest colours any proper colouring needs (chromatic number), by search. */
export function fewestColours(adj) {
  const n = adj.length;
  for (let k = 1; k <= n; k++) {
    const col = new Array(n).fill(-1);
    const ok = (function rec(v) {
      if (v === n) return true;
      for (let c = 0; c < k; c++) if (adj[v].every(u => col[u] !== c)) { col[v] = c; if (rec(v + 1)) return true; }
      col[v] = -1; return false;
    })(0);
    if (ok) return k;
  }
  return n;
}

/** FIFO page cache with k frames. Returns one step per request: { page, fault, mem (oldest first), evicted }. */
export function fifoTrace(seq, k) {
  const mem = [], steps = [];
  for (const page of seq) {
    let fault = false, evicted = null;
    if (!mem.includes(page)) { fault = true; mem.push(page); if (mem.length > k) evicted = mem.shift(); }
    steps.push({ page, fault, mem: [...mem], evicted });
  }
  return steps;
}
export const faults = (seq, k) => fifoTrace(seq, k).filter(s => s.fault).length;

/** Undirected adjacency lists from an edge list. */
export function adjacency(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  return adj;
}

/** Page cache with k frames and a replacement policy ('fifo' or 'lru'). Same step format as fifoTrace;
 *  `mem` is listed in eviction order (next to go first). */
export function cacheTrace(seq, k, policy) {
  if (policy === 'fifo') return fifoTrace(seq, k);
  const mem = [], steps = [];
  for (const page of seq) {
    let fault = false, evicted = null;
    const at = mem.indexOf(page);
    if (at >= 0) mem.splice(at, 1); else { fault = true; if (mem.length === k) evicted = mem.shift(); }
    mem.push(page);
    steps.push({ page, fault, mem: [...mem], evicted });
  }
  return steps;
}
export const misses = (seq, k, policy) => cacheTrace(seq, k, policy).filter(s => s.fault).length;

// Meetings: intervals [start, end) in whole hours. Greedy rules pick the smallest key; ties go to the one that ends
// first, then the one that starts first.
const overlap = (a, b) => a[0] < b[1] && b[0] < a[1];
export const MEETING_RULES = {
  shortest: { name: 'shortest first', short: 'short', key: (I, i) => I[i][1] - I[i][0] },
  start: { name: 'earliest start first', short: 'early', key: (I, i) => I[i][0] },
  conflicts: { name: 'fewest clashes first', short: 'clash', key: (I, i, alive) => I.reduce((c, x, j) => c + (j !== i && alive[j] && overlap(I[i], x) ? 1 : 0), 0) },
};
/** Indices of the meetings a greedy rule books, in booking order. */
export function greedyMeetings(I, rule) {
  const alive = I.map(() => true), out = [], key = MEETING_RULES[rule].key;
  for (;;) {
    let b = -1, bk;
    I.forEach((x, i) => {
      if (!alive[i]) return;
      const k = [key(I, i, alive), x[1], x[0]];
      if (b < 0 || k[0] < bk[0] || (k[0] === bk[0] && (k[1] < bk[1] || (k[1] === bk[1] && k[2] < bk[2])))) { b = i; bk = k; }
    });
    if (b < 0) return out;
    out.push(b);
    const pb = I[b];
    I.forEach((x, j) => { if (j === b || overlap(pb, x)) alive[j] = false; });
  }
}
/** A largest set of non-clashing meetings (earliest end first, which is optimal). Indices. */
export function bestMeetings(I) {
  const idx = I.map((_, i) => i).sort((a, b) => I[a][1] - I[b][1] || I[a][0] - I[b][0]);
  const out = []; let end = -Infinity;
  for (const i of idx) if (I[i][0] >= end) { out.push(i); end = I[i][1]; }
  return out;
}
