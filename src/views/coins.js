import { greedyChange, fewestChange } from '../algo.js';

const coinRow = list => list.map(c => `<span class="coin${c === 1 ? ' c1' : ''}" aria-hidden="true">${c}</span>`).join('');

export function mountCoins(el, lv, report) {
  el.innerHTML = `
    <div class="stepper">
      <button data-d="-1" aria-label="Smaller amount">−</button>
      <label class="visually-hidden" for="amt">Amount</label>
      <input id="amt" type="number" min="1" max="${lv.max}" value="1" inputmode="numeric">
      <button data-d="1" aria-label="Larger amount">+</button>
      <span class="muted">coins: ${lv.coins.join(', ')}</span>
    </div>
    <div class="payrow"><span>Greedy pays</span><span class="coins" id="g"></span></div>
    <div class="payrow"><span>Fewest coins</span><span class="coins" id="f"></span></div>`;
  const amt = el.querySelector('#amt');
  const show = () => {
    let a = Math.round(+amt.value); if (!(a >= 1)) a = 1; if (a > lv.max) a = lv.max;
    const g = greedyChange(lv.coins, a), f = fewestChange(lv.coins, a);
    const say = list => `${list.join(' + ')} = ${a}`;
    el.querySelector('#g').innerHTML = coinRow(g) + `<span class="count">${g.length} coin${g.length > 1 ? 's' : ''}</span><span class="visually-hidden">: ${say(g)}</span>`;
    el.querySelector('#f').innerHTML = coinRow(f) + `<span class="count">${f.length} coin${f.length > 1 ? 's' : ''}</span><span class="visually-hidden">: ${say(f)}</span>`;
    const broken = g.length > f.length;
    report({ broken, bonus: broken && a === lv.bonus.smallest,
      note: broken ? '' : `Greedy is right for ${a}. Try another amount.` });
  };
  amt.addEventListener('input', show);
  el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => {
    amt.value = Math.min(lv.max, Math.max(1, (+amt.value || 1) + +b.dataset.d)); show();
  }));
  show();
}
