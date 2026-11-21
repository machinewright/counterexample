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
