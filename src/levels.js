// Level data. Each level states a claim; the player builds the input that breaks it.
// `best` facts are proven by test/levels.test.mjs.
import { adjacency } from './algo.js';

const crown = n => { const e = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) e.push([i, n + j]); return e; };

export const LEVELS = [
  {
    id: 'coins', kind: 'coins', title: 'Fewest coins',
    claim: 'To pay an amount with the fewest coins, keep taking the largest coin that still fits.',
    setup: 'This country has coins worth 1, 3 and 4. Pick an amount to pay.',
    coins: [1, 3, 4], max: 40,
    goal: 'Find an amount where the greedy way uses more coins than needed.',
    bonus: { goal: 'the smallest amount that works', done: 'No smaller amount breaks it.', smallest: 6 },
    hint: 'Greedy takes a 4 whenever it can. Find an amount where taking the 4 leaves a remainder that is awkward to pay.',
    why: 'Greedy grabs the 4 and is left with 2, which only 1s can pay: 4+1+1. Two 3s do it with one coin fewer. Taking the biggest coin first is only safe for some coin sets. Most real currencies are chosen so that it is; this one is not.',
  },
  {
    id: 'path', kind: 'colour', title: 'Two colours?',
    claim: 'Colour the dots one at a time, each with the first colour none of its neighbours has. A chain needs only two colours, so that is all you will use.',
    setup: 'Click the dots in any order. Each one takes colour 1 if it can, else 2, else 3.',
    n: 4, edges: [[0, 1], [1, 2], [2, 3]], layout: 'line',
    goal: 'Choose an order that makes it use a third colour.',
    target: 3,
    hint: 'A dot is forced to colour 3 only if it already has a neighbour with 1 and a neighbour with 2. How could a middle dot\'s neighbour end up with colour 2?',
    why: 'Colour both ends first (both get 1), then an inner dot: its outer neighbour has 1, so it takes 2. The last dot now sees 1 and 2 and needs 3. First-fit colouring depends on the order. It never needs more than one colour beyond a vertex\'s number of neighbours, but it can use far more than the fewest possible.',
  },
  {
    id: 'crown', kind: 'colour', title: 'Two rows',
    claim: 'Every line here joins the top row to the bottom row, so two colours (one per row) are enough. First-fit colouring will find a colouring that small, or close to it.',
    setup: 'Each dot is joined to every dot in the other row except the one straight across from it. Click the dots in any order.',
    n: 8, edges: crown(4), layout: 'rows',
    goal: 'Make first-fit use four colours, twice what is needed.',
    target: 4,
    hint: 'Dots straight across from each other are not joined, so they can share a colour. Try colouring the graph pair by pair.',
    why: 'Take the pairs in turn, one dot from each row. The first pair gets colour 1. The second pair touches both 1s, so it takes 2, and pair k takes colour k. With n pairs, first-fit uses n colours on a graph that needs two: no fixed factor bounds how badly it can do.',
  },
  {
    id: 'belady', kind: 'fifo', title: 'More memory',
    claim: 'Give a cache more room and it will miss less often, or at worst just as often.',
    setup: 'A cache holds pages A–E. On a miss it loads the page and, if full, throws out the page that has been in longest (first in, first out). Type a list of page requests. Two caches run it: one with 3 slots, one with 4.',
    pages: 'ABCDE', small: 3, large: 4, maxLen: 24,
    goal: 'Make the 4-slot cache miss more often than the 3-slot one.',
    bonus: { goal: 'the shortest list that works', done: 'No list of 11 requests or fewer breaks it.', smallest: 12 },
    hint: 'The two caches throw out different pages at different times. Get the small cache to keep exactly the pages you are about to ask for, while the large one has just thrown them out.',
    why: 'This is Bélády\'s anomaly, found by László Bélády and colleagues at IBM in 1969: under first-in-first-out, more memory can mean more misses. The shortest request lists that show it have 12 requests, and with five pages there is only one, up to renaming them: A B C D A B E A B C D E (checked here by trying every list). Caches that throw out the least recently used page can never do this.',
  },
];

for (const L of LEVELS) if (L.kind === 'colour') L.adj = adjacency(L.n, L.edges);
