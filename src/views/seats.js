import { hamilton } from '../algo.js';

const NAMES = ['A', 'B', 'C'];
const chip = c => `<span class="cand k${c}">${c}</span>`;
const dec = (num, den) => (num / den).toFixed(3);

/** Hamilton apportionment of a house of h seats and of h + 1 seats among three states; the player sets populations
 *  (whole millions) and h. Broken when a state has fewer seats in the bigger house. */
export function mountSeats(el, lv, report) {
  const step = (id, label, min, max, val) => `<span class="mini">
      <button data-id="${id}" data-d="-1" aria-label="${label}: one fewer">−</button>
      <input id="${id}" type="number" min="${min}" max="${max}" value="${val}" inputmode="numeric" aria-label="${label}">
      <button data-id="${id}" data-d="1" aria-label="${label}: one more">+</button></span>`;
  el.innerHTML = `
    <div class="seatform">
      ${NAMES.map((c, i) => `<label>${chip(c)} ${step('p' + i, `Population of state ${c}, millions`, 1, lv.maxPop, lv.start[i])} <span class="muted">million</span></label>`).join('')}
      <label>Seats ${step('h', 'Seats in the house', 1, lv.maxSeats, lv.startSeats)}</label>
    </div>
    <div class="counts" aria-live="polite"><div id="before"></div><div id="after"></div></div>`;
  const clamp = (v, lo, hi) => { v = Math.round(+v); return !(v >= lo) ? lo : Math.min(v, hi); };
  el.querySelectorAll('input').forEach(i => i.addEventListener('input', show));
  el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => {
    const i = el.querySelector('#' + b.dataset.id);
    i.value = clamp((+i.value || 0) + +b.dataset.d, +i.min, +i.max); show();
  }));

  function table(pops, h, res, lost) {
    const { seats, rem, P } = res;
    const floors = pops.map(p => Math.floor(p * h / P));
    const left = h - floors.reduce((a, b) => a + b, 0);
    const rows = NAMES.map((c, i) => {
      const extra = seats ? seats[i] > floors[i] : false;
      return `<tr${lost === i ? ' class="lost"' : ''}><td>${chip(c)}</td><td>${dec(pops[i] * h, P)}</td><td>${floors[i]}</td>
        <td>${rem[i] ? '.' + dec(rem[i], P).split('.')[1] : '0'}${extra ? ' <span class="plus">+1</span>' : ''}</td>
        <td class="sn">${seats ? seats[i] : '?'}</td></tr>`;
    }).join('');
    return `<h3>${h} seats</h3>
      <table class="shares"><thead><tr><th>State</th><th>Exact share</th><th>Rounded down</th><th>Fraction</th><th>Seats</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="muted rlabel">${left ? `${left} seat${left === 1 ? '' : 's'} left over, for the largest fraction${left === 1 ? '' : 's'}` : 'No seats left over'}</p>
      ${seats ? '' : '<p class="bad">Tie between fractions: no clear result</p>'}${lost >= 0 ? `<p class="bad">${chip(NAMES[lost])} ends up with fewer seats in the bigger parliament.</p>` : ''}`;
  }
  function show() {
    const pops = NAMES.map((_, i) => clamp(el.querySelector('#p' + i).value, 1, lv.maxPop));
    const h = clamp(el.querySelector('#h').value, 1, lv.maxSeats);
    const a = hamilton(pops, h), b = hamilton(pops, h + 1);
    const lost = a.seats && b.seats ? b.seats.findIndex((s, i) => s < a.seats[i]) : -1;
    const broken = lost >= 0, P = a.P;
    el.querySelector('#before').innerHTML = table(pops, h, a, -1);
    el.querySelector('#after').innerHTML = table(pops, h + 1, b, lost);
    const note = broken || !a.seats || !b.seats ? '' : 'With one more seat, no state loses one.';
    report({ broken, bonus: broken && P === lv.bonus.smallest, input: { pops, seats: h }, note });
  }
  show();
}
