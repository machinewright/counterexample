# Proofs behind the "smallest" stars

Most stars are checked by `node --test test/` (exhaustive search in JS). Two need more than JS should do in a test run:

- **Bélády ("More memory"):** `node proto/belady.mjs 5` lists every request list over five pages up to length 12, up to
  renaming pages. Nothing below 12 works; at 12 exactly one list does: ABCDABEABCDE. (The test suite repeats this.)
- **"Fewest clashes":** `gcc -O2 -o proto/iv proto/iv.c`, then `./proto/iv 8 n` for n = 6 to 10, tries every set
  of n distinct meetings [start, end) in whole hours on an 8-hour day: no set of 6, 7, 8 or 9 (all 94,143,280 sets of nine)
  fools the rule (sets of up to 5 are checked in the test suite); ten
  meetings work (6 sets). The rule and tie-breaks match `greedyMeetings(I, 'conflicts')` in src/algo.js: fewest
  clashes among remaining requests, then earliest end, then earliest start. Runtime about 2 minutes.
