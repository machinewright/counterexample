import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greedyChange, fewestChange, greedyColour, mostGreedyColours, fewestColours, misses, cacheTrace,
  greedyMeetings, bestMeetings } from '../src/algo.js';
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

// every request list of length `len` over `pages`, up to renaming (pages first used in alphabetical order)
function eachList(pages, len, f) {
  const s = [];
  (function rec(i, mx) {
    if (i === len) return f(s);
    for (let p = 0; p <= Math.min(mx + 1, pages.length - 1); p++) { s[i] = pages[p]; rec(i + 1, Math.max(mx, p)); }
  })(0, -1);
}
const breaks = (lv, s) => { const [a, b] = lv.caches; return misses(s, b.k, b.policy) > misses(s, a.k, a.policy); };

test('cache levels: bonus length is the shortest that works', () => {
  for (const lv of LEVELS.filter(l => l.kind === 'fifo')) {
    for (let len = 1; len < lv.bonus.smallest; len++) eachList(lv.pages, len, s => assert.ok(!breaks(lv, s), `${lv.id} ${s.join('')}`));
    let n = 0; eachList(lv.pages, lv.bonus.smallest, s => { if (breaks(lv, s)) n++; });
    assert.ok(n > 0, lv.id);
  }
});

test('belady: the classic list, and with five pages it is the only shortest one', () => {
  const lv = L('belady');
  assert.equal(misses([...'ABCDABEABCDE'], 3, 'fifo'), 9);
  assert.equal(misses([...'ABCDABEABCDE'], 4, 'fifo'), 10);
  const at12 = []; eachList(lv.pages, 12, s => { if (breaks(lv, s)) at12.push(s.join('')); });
  assert.deepEqual(at12, ['ABCDABEABCDE']);
  assert.equal(cacheTrace([...'ABA'], 3, 'fifo')[2].fault, false);
});

test('lru: stack property (3 slots never miss less than 4) on all lists up to length 9', () => {
  for (let len = 1; len <= 9; len++) eachList('ABCDE', len, s => assert.ok(misses(s, 4, 'lru') <= misses(s, 3, 'lru')));
  assert.deepEqual(cacheTrace([...'ABCA D'.replace(' ', '')], 3, 'lru').at(-1).mem, ['C', 'A', 'D']);
});

function eachMeetingList(T, n, f) {
  const all = []; for (let e = 1; e <= T; e++) for (let s = 0; s < e; s++) all.push([s, e]);
  const p = [];
  (function rec(i, from) { if (i === n) return f(p.map(k => all[k])); for (let a = from; a < all.length; a++) { p[i] = a; rec(i + 1, a + 1); } })(0, 0);
}
const fooled = (lv, I) => { const b = bestMeetings(I).length; return lv.rules.every(r => greedyMeetings(I, r).length < b); };

test('meetings: rules, best, and the smallest lists that fool them', () => {
  const I = [[1, 4], [0, 5], [3, 5], [4, 6]];
  assert.equal(bestMeetings(I).length, 2);
  assert.deepEqual(greedyMeetings(I, 'shortest'), [2]);
  assert.deepEqual(greedyMeetings(I, 'start'), [1]);
  for (const lv of LEVELS.filter(l => l.kind === 'meetings' && (l.bonus?.smallest ?? 3) <= 4)) {
    const smallest = lv.bonus?.smallest ?? 3;
    for (let n = 1; n < smallest; n++) eachMeetingList(lv.hours, n, I => assert.ok(!fooled(lv, I), `${lv.id} ${JSON.stringify(I)}`));
    let found = 0; eachMeetingList(lv.hours, smallest, I => { if (fooled(lv, I)) found++; });
    assert.ok(found > 0, lv.id);
  }
  // best is truly a maximum: compare with brute force on all 4-meeting lists over 6 hours
  eachMeetingList(6, 4, I => {
    let m = 0; for (let mask = 1; mask < 16; mask++) {
      const S = I.filter((_, i) => mask >> i & 1);
      if (S.every((a, i) => S.every((b, j) => i === j || !(a[0] < b[1] && b[0] < a[1])))) m = Math.max(m, S.length);
    }
    assert.equal(bestMeetings(I).length, m);
  });
});

test('fewest clashes: a 10-meeting trap; nothing up to 5 meetings works (9 is checked by proto/iv.c)', () => {
  const lv = L('clashes');
  const I = [[0, 2], [1, 2], [0, 3], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 7], [5, 8]];
  assert.ok(fooled(lv, I)); assert.equal(I.length, lv.bonus.smallest);
  for (let n = 1; n <= 5; n++) eachMeetingList(lv.hours, n, J => assert.ok(!fooled(lv, J)));
});

test('a new coin: 8 is the smallest amount any added coin breaks; the safe coins are safe', () => {
  const lv = L('mint'); let min = Infinity; const safe = [];
  for (let c = lv.newCoin.min; c <= lv.newCoin.max; c++) {
    if (lv.coins.includes(c)) continue;
    const coins = [...lv.coins, c]; let f = null;
    // Kozen & Zaks: a smallest counterexample, if any, lies below the sum of the two largest coins (< 99 + 25)
    for (let a = 1; a < 125; a++) if (greedyChange(coins, a).length > fewestChange(coins, a).length) { f = a; break; }
    if (f === null) safe.push(c); else min = Math.min(min, f);
  }
  assert.equal(min, lv.bonus.smallest);
  for (const c of [2, 3, 15, 40, 50]) assert.ok(safe.includes(c), c);
  assert.deepEqual(greedyChange([1, 5, 10, 20, 25], 40), [25, 10, 5]);
  assert.deepEqual(fewestChange([1, 4, 5, 10, 25], 8), [4, 4]);
});
