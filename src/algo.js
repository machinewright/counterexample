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

// Shortest paths on a small directed graph: edges [from, to, weight], nodes 0..n-1.
/** Textbook Dijkstra: each node is settled once, when it has the smallest tentative distance; settled nodes are
 *  never updated again. Returns { dist, prev, order } (order = settling order). */
export function dijkstra(n, edges, src) {
  const dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false), order = [];
  dist[src] = 0;
  for (;;) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!done[v] && dist[v] < Infinity && (u < 0 || dist[v] < dist[u])) u = v;
    if (u < 0) break;
    done[u] = true; order.push(u);
    for (const [a, b, w] of edges) if (a === u && !done[b] && dist[u] + w < dist[b]) { dist[b] = dist[u] + w; prev[b] = u; }
  }
  return { dist, prev, order };
}
/** Bellman-Ford: true shortest distances, or null if a negative cycle is reachable. */
export function bellmanFord(n, edges, src) {
  const dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1);
  dist[src] = 0;
  for (let i = 0; i < n - 1; i++) for (const [a, b, w] of edges) if (dist[a] + w < dist[b]) { dist[b] = dist[a] + w; prev[b] = a; }
  for (const [a, b, w] of edges) if (dist[a] + w < dist[b]) return null;
  return { dist, prev };
}
export function pathTo(prev, t) { const p = []; for (let v = t; v >= 0; v = prev[v]) p.unshift(v); return p; }

// Tours through cities on a grid; a city is [x, y]; tours start and end at cities[0] (home).
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const tourLength = (C, order) => order.reduce((L, v, i) => L + dist(C[v], C[order[(i + 1) % order.length]]), 0);
/** Nearest neighbour from home: always go to the nearest unvisited city; ties go to the one nearer the top
 *  (smaller y), then nearer the left (smaller x). Returns { order, length }. */
export function nearestTour(C) {
  const order = [0], left = C.map((_, i) => i).slice(1);
  while (left.length) {
    const cur = C[order.at(-1)];
    let bi = 0;
    for (let i = 1; i < left.length; i++) {
      const a = C[left[i]], b = C[left[bi]], da = dist(cur, a), db = dist(cur, b);
      if (da < db - 1e-9 || (Math.abs(da - db) < 1e-9 && (a[1] < b[1] || (a[1] === b[1] && a[0] < b[0])))) bi = i;
    }
    order.push(left.splice(bi, 1)[0]);
  }
  return { order, length: tourLength(C, order) };
}
/** Shortest tour from home, by trying every order (fine for up to ~8 cities). */
export function bestTour(C) {
  const rest = C.map((_, i) => i).slice(1);
  let best = { order: [0, ...rest], length: tourLength(C, [0, ...rest]) };
  (function perm(k) {
    if (k === rest.length) { const L = tourLength(C, [0, ...rest]); if (L < best.length - 1e-9) best = { order: [0, ...rest], length: L }; return; }
    for (let i = k; i < rest.length; i++) { [rest[k], rest[i]] = [rest[i], rest[k]]; perm(k + 1); [rest[k], rest[i]] = [rest[i], rest[k]]; }
  })(0);
  return best;
}

/** Instant-runoff count with three candidates. `ballots` maps rankings like 'ACB' to voter counts.
 *  Returns { rounds: [{A,B,C}, ...], out, winner } where winner is null on any tie that decides the result. */
export function runoff(ballots) {
  const n = Object.values(ballots).reduce((a, b) => a + b, 0);
  const tally = skip => {
    const t = {};
    for (const c of 'ABC') if (c !== skip) t[c] = 0;
    for (const [b, k] of Object.entries(ballots)) t[[...b].find(c => c !== skip)] += k;
    return t;
  };
  const r1 = tally(null);
  const maj = Object.keys(r1).find(c => 2 * r1[c] > n);
  if (!n) return { rounds: [r1], out: null, winner: null };
  if (maj) return { rounds: [r1], out: null, winner: maj };
  const low = Math.min(...Object.values(r1)), lows = Object.keys(r1).filter(c => r1[c] === low);
  if (lows.length > 1) return { rounds: [r1], out: null, winner: null, tie: 'last' };
  const r2 = tally(lows[0]), [p, q] = Object.keys(r2);
  return { rounds: [r1, r2], out: lows[0], winner: r2[p] === r2[q] ? null : r2[p] > r2[q] ? p : q, tie: r2[p] === r2[q] ? 'final' : undefined };
}

/** Hamilton's method (largest remainders): each state gets its exact share of `h` seats rounded down, and the seats
 *  left over go to the largest fractions. Exact integer arithmetic. Returns { seats, rem, P }, with seats null when a
 *  tie between fractions decides a seat. rem[i]/P is state i's fraction. */
export function hamilton(pops, h) {
  const P = pops.reduce((a, b) => a + b, 0);
  if (!P) return { seats: null, rem: pops.map(() => 0), P };
  const seats = pops.map(p => Math.floor(p * h / P)), rem = pops.map(p => (p * h) % P);
  const left = h - seats.reduce((a, b) => a + b, 0);
  const order = pops.map((_, i) => i).sort((a, b) => rem[b] - rem[a]);
  if (left > 0 && left < pops.length && rem[order[left - 1]] === rem[order[left]]) return { seats: null, rem, P };
  for (let k = 0; k < left; k++) seats[order[k]]++;
  return { seats, rem, P };
}
