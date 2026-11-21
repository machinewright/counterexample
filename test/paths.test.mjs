import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dijkstra, bellmanFord, pathTo } from '../src/algo.js';

test('dijkstra agrees with bellman-ford on random graphs with non-negative weights', () => {
  let seed = 7; const rnd = k => (seed = (seed * 1103515245 + 12345) % 2147483648) % k;
  for (let it = 0; it < 500; it++) {
    const n = 2 + rnd(5), E = [];
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (a !== b && rnd(3) === 0) E.push([a, b, rnd(10)]);
    const d = dijkstra(n, E, 0).dist, b = bellmanFord(n, E, 0).dist;
    assert.deepEqual(d, b);
  }
});

test('the classic failure: a negative edge into an already settled node', () => {
  const E = [[0, 1, 2], [0, 2, 3], [2, 1, -2], [1, 3, 3]];
  assert.equal(dijkstra(4, E, 0).dist[3], 5);
  assert.equal(bellmanFord(4, E, 0).dist[3], 4);
  assert.deepEqual(pathTo(bellmanFord(4, E, 0).prev, 3), [0, 2, 1, 3]);
  assert.equal(bellmanFord(2, [[0, 1, 1], [1, 0, -2]], 0), null);
});
