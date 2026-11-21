// Alabama paradox under Hamilton's method: smallest total population (whole millions, n states) where one more seat
// costs some state a seat. Ties between fractions don't count. Seats repeat with period P (share of h+P = share of h
// plus the population), so house sizes 1..P cover everything.   node proto/alabama.mjs [states] [maxP]
import { hamilton } from '../src/algo.js';
function* parts(P, n, min = 1) {
  if (n === 1) { if (P >= min) yield [P]; return; }
  for (let a = min; a * n <= P; a++) for (const rest of parts(P - a, n - 1, a)) yield [a, ...rest];
}
const n = +(process.argv[2] || 3), maxP = +(process.argv[3] || 40);
for (let P = n; P <= maxP; P++) {
  for (const pops of parts(P, n)) for (let h = 1; h <= P; h++) {
    const a = hamilton(pops, h).seats, b = hamilton(pops, h + 1).seats;
    if (a && b && b.some((s, i) => s < a[i])) { console.log('P', P, 'pops', pops, 'seats', h, a, '->', h + 1, b); process.exit(0); }
  }
}
console.log('none up to', maxP);
