import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greedyChange, fewestChange, greedyColour, mostGreedyColours, fewestColours, faults, fifoTrace } from '../src/algo.js';
import { LEVELS } from '../src/levels.js';
const L = id => LEVELS.find(l => l.id === id);

test('coins: smallest amount where greedy loses', () => {
  const { coins, bonus, max } = L('coins');
  const bad = []; for (let a = 1; a <= max; a++) if (greedyChange(coins, a).length > fewestChange(coins, a).length) bad.push(a);
  assert.equal(bad[0], bonus.smallest);
  assert.deepEqual(greedyChange(coins, 6), [4, 1, 1]); assert.deepEqual(fewestChange(coins, 6), [3, 3]);
});

test('colour levels: the target is the most first-fit can be made to use, and more than needed', () => {
  for (const lv of LEVELS.filter(l => l.kind === 'colour')) {
    assert.equal(mostGreedyColours(lv.adj), lv.target, lv.id);
    assert.equal(fewestColours(lv.adj), 2, lv.id);
  }
  assert.equal(Math.max(...greedyColour(L('path').adj, [0, 3, 1, 2])) + 1, 3);
  assert.equal(Math.max(...greedyColour(L('crown').adj, [0, 4, 1, 5, 2, 6, 3, 7])) + 1, 4);
});

test('fifo: classic anomaly and nothing shorter than 12', () => {
  const { small, large, bonus, pages } = L('belady');
  assert.equal(faults([...'ABCDABEABCDE'], small), 9);
  assert.equal(faults([...'ABCDABEABCDE'], large), 10);
  // every canonical list (pages first used in order A, B, C, ...) of each length below 12, over 5 pages
  let found = 0; const s = [];
  for (let len = 1; len < bonus.smallest; len++) {
    (function rec(i, mx) {
      if (i === len) { if (faults(s.slice(0, len), large) > faults(s.slice(0, len), small)) found++; return; }
      for (let p = 0; p <= Math.min(mx + 1, pages.length - 1); p++) { s[i] = pages[p]; rec(i + 1, Math.max(mx, p)); }
    })(0, -1);
  }
  assert.equal(found, 0);
  assert.equal(fifoTrace([...'ABA'], 3)[2].fault, false);
  let at12 = []; (function rec(i, mx) {
    if (i === 12) { if (faults(s, large) > faults(s, small)) at12.push(s.join('')); return; }
    for (let p = 0; p <= Math.min(mx + 1, pages.length - 1); p++) { s[i] = pages[p]; rec(i + 1, Math.max(mx, p)); }
  })(0, -1);
  assert.deepEqual(at12, ['ABCDABEABCDE']);
});
