// Numbers quoted in the level explanations ("why" texts) that the bonus tests don't already cover.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greedyChange, fewestChange, hamilton, runoff } from '../src/algo.js';

test('seats why: 3, 5, 15 million lose the small state a seat from 11 to 12 seats', () => {
  assert.deepEqual(hamilton([3, 5, 15], 11).seats, [2, 2, 7]);
  assert.deepEqual(hamilton([3, 5, 15], 12).seats, [1, 3, 8]);
});

test('mint why: with a 20-cent coin greedy pays 40 as 25+10+5, best is 20+20', () => {
  const c = [1, 5, 10, 20, 25];
  assert.deepEqual([...greedyChange(c, 40)].sort((a, b) => b - a), [25, 10, 5]);
  assert.equal(fewestChange(c, 40).length, 2);
});

test('noshow why: in every failure up to 13 voters, the newcomers rank the old winner second', () => {
  const R = ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'];
  function* comps(n, k) { if (k === 1) { yield [n]; return; } for (let i = 0; i <= n; i++) for (const t of comps(n - i, k - 1)) yield [i, ...t]; }
  function* subs(c, i = 0) { if (i === c.length) { yield []; return; } for (let k = 0; k <= c[i]; k++) for (const t of subs(c, i + 1)) yield [k, ...t]; }
  const obj = a => Object.fromEntries(R.map((r, i) => [r, a[i]]));
  let found = 0;
  for (let T = 1; T <= 13; T++) for (const after of comps(T, 6)) {
    const w2 = runoff(obj(after)).winner; if (!w2) continue;
    for (const j of subs(after)) {
      if (!j.some(Boolean)) continue;
      const w1 = runoff(obj(after.map((x, i) => x - j[i]))).winner;
      if (!w1 || w1 === w2) continue;
      if (!j.every((k, i) => !k || R[i].indexOf(w1) < R[i].indexOf(w2))) continue;
      found++;
      assert.ok(j.every((k, i) => !k || R[i][1] === w1), `${after} ${j}`);
    }
  }
  assert.ok(found > 0);
});
