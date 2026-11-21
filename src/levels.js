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
    id: 'shortest', kind: 'meetings', title: 'One room',
    claim: 'To fit the most meetings into one room, book the shortest meetings first. Short meetings leave the most room for others.',
    setup: 'Requests come in for one meeting room. The rule books the shortest request, drops every request that clashes with it, and repeats (ties go to the one that ends first). Add requests by dragging across the dashed lane, or with the form.',
    rules: ['shortest'], hours: 10, firstHour: 9, maxMeetings: 8,
    goal: 'Make shortest-first book fewer meetings than the room could hold.',
    hint: 'A short meeting can still be a bad pick. What if it sits across the boundary between two longer meetings?',
    why: 'A short meeting that straddles two longer ones knocks both out: shortest-first books one where two fit. The rule that always works is to book the meeting that ends first, then repeat; the "best" column uses it. It is one of the few greedy rules with a proof: whatever the best schedule books first, swapping that for the earliest-ending meeting never makes things worse.',
  },
  {
    id: 'tworules', kind: 'meetings', title: 'Two rules',
    claim: 'Fine, shortest-first can be fooled. Then book the meeting that starts earliest. And no single list of requests can fool both rules.',
    setup: 'Same room, two rules side by side: shortest first, and earliest start first. Each books its pick, drops whatever clashes, and repeats (ties go to the one that ends first).',
    rules: ['shortest', 'start'], hours: 10, firstHour: 9, maxMeetings: 8,
    goal: 'Make one list on which both rules book fewer meetings than the room could hold.',
    bonus: { goal: 'the fewest meetings that work', done: 'No list of three meetings fools both rules.', smallest: 4 },
    hint: 'Earliest-start falls for one long meeting that starts first. Shortest-first falls for a short meeting across a boundary. Can the two traps share meetings?',
    why: 'Each rule has its own blind spot, and one list can hit both. With four meetings it fits; no list of three does it (checked by trying every list of three on this timeline). Booking whatever ends first beats both rules on every list.',
  },
  {
    id: 'crown', kind: 'colour', title: 'Two rows',
    claim: 'Every line here joins the top row to the bottom row, so two colours are enough: one per row. First-fit stumbled on a chain, but on a graph this tidy it stays close to two.',
    setup: 'Each dot is joined to every dot in the other row except the one straight across from it. Click the dots in any order.',
    n: 8, edges: crown(4), layout: 'rows',
    goal: 'Make first-fit use four colours, twice what is needed.',
    target: 4,
    hint: 'Dots straight across from each other are not joined, so they can share a colour. Try colouring the graph pair by pair.',
    why: 'Take the pairs in turn, one dot from each row. The first pair gets colour 1. The second pair touches both 1s, so it takes 2, and pair k takes colour k. With n pairs, first-fit uses n colours on a graph that needs two: no fixed factor bounds how badly it can do.',
  },
  {
    id: 'lru', kind: 'fifo', title: 'Old is not stale',
    claim: 'Throwing out the page that came in first is as good as throwing out the one used least recently. Old pages are the stale ones anyway.',
    setup: 'A cache holds a few pages; on a miss it loads the page and, if full, throws one out. Two caches with 3 slots each run the same list of requests (pages A–E). LRU throws out the page used least recently; FIFO throws out the page that was loaded first, however often it has been used since.',
    pages: 'ABCDE', caches: [{ k: 3, policy: 'lru' }, { k: 3, policy: 'fifo' }], maxLen: 24,
    goal: 'Make the FIFO cache miss more often than the LRU one.',
    bonus: { goal: 'the shortest list that works', done: 'No list of five requests or fewer does it.', smallest: 6 },
    hint: 'Load a page first, then keep using it. FIFO still counts it as the oldest.',
    why: 'FIFO remembers when a page arrived, not that it was just used, so it throws out a page that is in constant use. LRU tracks use. Tracking every use is costly in real hardware, so operating systems usually approximate LRU instead (the "clock" algorithm is the classic way).',
  },
  {
    id: 'belady', kind: 'fifo', title: 'More memory',
    claim: 'Give a cache more room and it will miss less often, or at worst just as often.',
    setup: 'Two FIFO caches (first in, first out) run the same list of requests, pages A–E. One has 3 slots, the other 4.',
    pages: 'ABCDE', caches: [{ k: 3, policy: 'fifo' }, { k: 4, policy: 'fifo' }], maxLen: 24,
    goal: 'Make the 4-slot cache miss more often than the 3-slot one.',
    bonus: { goal: 'the shortest list that works', done: 'No list of 11 requests or fewer breaks it.', smallest: 12 },
    hint: 'The two caches throw out different pages at different times. Get the small cache to keep exactly the pages you are about to ask for, while the large one has just thrown them out.',
    why: 'This is Bélády\'s anomaly, found by László Bélády and colleagues at IBM in 1969: under first-in-first-out, more memory can mean more misses. The shortest request lists that show it have 12 requests, and with five pages there is only one, up to renaming them: A B C D A B E A B C D E (checked here by trying every list). An LRU cache can never do this: its contents with 3 slots are always among its contents with 4.',
  },
  {
    id: 'clashes', kind: 'meetings', title: 'Fewest clashes',
    claim: 'The real trick: book the meeting that clashes with the fewest others. It gets in nobody\'s way.',
    setup: 'Same room, a workday from 9 to 17. The rule counts how many of the remaining requests each one clashes with, books the one with the fewest, drops its clashes, and counts again (ties go to the one that ends first, then the one that starts first).',
    rules: ['conflicts'], hours: 8, firstHour: 9, maxMeetings: 12,
    goal: 'Make fewest-clashes book fewer meetings than the room could hold.',
    bonus: { goal: 'the fewest meetings that work', done: 'No list of nine meetings or fewer on this day does it (checked by trying all 94 million lists of nine).', smallest: 10 },
    hint: 'Plan the best schedule first: four meetings back to back. The rule should be tempted by one quiet meeting across the boundary between two of them. So make the four look busy: stack extra requests on them, but none on the quiet one.',
    why: 'A clash count only looks at the neighbourhood. A meeting can look quiet while it sits exactly on the boundary between two meetings the best schedule needs; crowd those two with extra requests and the rule takes the quiet one. On this day it takes ten requests to set the trap, and no smaller list works. Booking whatever ends first, from level 3, still gets the best schedule every time.',
  },
];

for (const L of LEVELS) if (L.kind === 'colour') L.adj = adjacency(L.n, L.edges);
