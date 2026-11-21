import { runoff } from '../algo.js';

const RANKS = ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'];
const chip = c => `<span class="cand k${c}">${c}</span>`;
const say = r => [...r].join(' then ');

/** Instant runoff, three candidates. The player sets the ballots, then has some voters move A to the top. */
export function mountRunoff(el, lv, report) {
  const votes = Object.fromEntries(RANKS.map(r => [r, 0])), moved = Object.fromEntries(RANKS.map(r => [r, 0]));
  const step = (id, label) => `<span class="mini">
      <button data-id="${id}" data-d="-1" aria-label="${label}: one fewer">−</button>
      <input id="${id}" type="number" min="0" max="${lv.maxPerRow}" value="0" inputmode="numeric" aria-label="${label}">
      <button data-id="${id}" data-d="1" aria-label="${label}: one more">+</button></span>`;
  el.innerHTML = `
    <table class="ballots">
      <thead><tr><th>Ballot (1st, 2nd, 3rd)</th><th>Voters</th><th>Of them, move A to the top</th></tr></thead>
      <tbody>${RANKS.map(r => `<tr><td><span class="visually-hidden">${say(r)}</span><span aria-hidden="true">${[...r].map(chip).join('<span class="gt">›</span>')}</span></td>
        <td>${step('v' + r, `Voters ranking ${say(r)}`)}</td>
        <td>${r[0] === 'A' ? '<span class="muted">A is already first</span>' : step('m' + r, `Voters ranking ${say(r)} who move A to the top`)}</td></tr>`).join('')}</tbody>
    </table>
    <div class="counts" aria-live="polite"><div id="before"></div><div id="after"></div></div>`;
  const clamp = (v, hi) => { v = Math.round(+v); return !(v >= 0) ? 0 : Math.min(v, hi); };
  const read = () => {
    for (const r of RANKS) {
      const v = el.querySelector('#v' + r); votes[r] = clamp(v.value, lv.maxPerRow);
      const m = el.querySelector('#m' + r);
      if (m) { m.max = votes[r]; moved[r] = clamp(m.value, votes[r]); if (+m.value !== moved[r] && m.value !== '') m.value = moved[r]; }
    }
  };
  el.querySelectorAll('input').forEach(i => i.addEventListener('input', show));
  el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => {
    const i = el.querySelector('#' + b.dataset.id); i.value = Math.max(0, (+i.value || 0) + +b.dataset.d); show();
  }));

  function block(title, res, n) {
    const row = t => Object.entries(t).map(([c, k]) => `<div class="vbar"><span>${chip(c)}</span><span class="vfill k${c}" style="width:${n ? Math.round(100 * k / n) : 0}%"></span><span class="vnum">${k}</span></div>`).join('');
    let h = `<h3>${title} <span class="muted">${n} voter${n === 1 ? '' : 's'}</span></h3><p class="muted rlabel">First choices${n ? ` (a majority is ${Math.floor(n / 2) + 1})` : ''}</p>${row(res.rounds[0])}`;
    if (res.rounds[1]) h += `<p class="muted rlabel">${res.out} is out; ${res.out}'s voters go to their 2nd choice</p>${row(res.rounds[1])}`;
    h += !n ? '' : res.winner ? `<p class="win">${chip(res.winner)} wins${res.rounds[1] ? '' : ' with a majority'}</p>`
      : `<p class="bad">${res.tie === 'last' ? 'Tie for last place' : 'Tie in the final count'}: no clear result</p>`;
    return h;
  }
  function show() {
    read();
    const after = { ...votes };
    for (const r of RANKS) if (moved[r]) { after[r] -= moved[r]; after['A' + r.replace('A', '')] += moved[r]; }
    const n = RANKS.reduce((s, r) => s + votes[r], 0), m = RANKS.reduce((s, r) => s + moved[r], 0);
    const b = runoff(votes), a = runoff(after);
    el.querySelector('#before').innerHTML = block('Before', b, n);
    el.querySelector('#after').innerHTML = block(m ? `After ${m} voter${m === 1 ? '' : 's'} move A to the top` : 'After (nobody has moved yet)', a, n);
    const broken = b.winner === 'A' && m > 0 && a.winner && a.winner !== 'A';
    let note = '';
    if (!broken && n) {
      if (b.winner && b.winner !== 'A') note = 'A has to win the first election, so the extra support can cost A something.';
      else if (b.winner === 'A' && !m) note = 'A wins. Now have some voters move A to the top.';
      else if (b.winner === 'A' && a.winner === 'A') note = 'A still wins with the extra support.';
    }
    report({ broken, bonus: broken && n === lv.bonus.smallest, input: { votes, moved }, note });
  }
  show();
}
