import { greedyChange, fewestChange } from '../algo.js';

const coinRow = list => list.map(c => `<span class="coin${c === 1 ? ' c1' : ''}" aria-hidden="true">${c}</span>`).join('');

export function mountCoins(el, lv, report) {
  const pick = lv.newCoin;
  el.innerHTML = (pick ? `
    <div class="stepper">
      <button data-c="-1" aria-label="Smaller new coin">−</button>
      <label class="visually-hidden" for="nc">New coin</label>
      <input id="nc" type="number" min="${pick.min}" max="${pick.max}" value="${pick.start}" inputmode="numeric">
      <button data-c="1" aria-label="Larger new coin">+</button>
      <span class="muted">the new coin</span>
    </div>` : '') + `
    <div class="stepper">
      <button data-d="-1" aria-label="Smaller amount">−</button>
      <label class="visually-hidden" for="amt">Amount</label>
      <input id="amt" type="number" min="1" max="${lv.max}" value="1" inputmode="numeric">
      <button data-d="1" aria-label="Larger amount">+</button>
      <span class="muted" id="cl"></span>
    </div>
    <div class="payrow"><span>Greedy pays</span><span class="coins" id="g"></span></div>
    <div class="payrow"><span>Fewest coins</span><span class="coins" id="f"></span></div>`;
  const amt = el.querySelector('#amt'), nc = el.querySelector('#nc');
  const clamp = (v, lo, hi) => { v = Math.round(+v); return !(v >= lo) ? lo : v > hi ? hi : v; };
  const show = () => {
    const a = clamp(amt.value, 1, lv.max);
    let coins = lv.coins;
    if (pick) { const c = clamp(nc.value, pick.min, pick.max); if (!coins.includes(c)) coins = [...coins, c].sort((x, y) => x - y); }
    el.querySelector('#cl').textContent = `coins: ${coins.join(', ')}`;
    const g = greedyChange(coins, a), f = fewestChange(coins, a);
    const say = list => `${list.join(' + ')} = ${a}`;
    el.querySelector('#g').innerHTML = coinRow(g) + `<span class="count">${g.length} coin${g.length > 1 ? 's' : ''}</span><span class="visually-hidden">: ${say(g)}</span>`;
    el.querySelector('#f').innerHTML = coinRow(f) + `<span class="count">${f.length} coin${f.length > 1 ? 's' : ''}</span><span class="visually-hidden">: ${say(f)}</span>`;
    const broken = g.length > f.length;
    report({ broken, bonus: broken && a === lv.bonus.smallest, input: { amount: a, coins },
      note: broken ? '' : `Greedy is right for ${a}. Try another amount.` });
  };
  amt.addEventListener('input', show);
  nc?.addEventListener('input', show);
  el.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => {
    nc.value = clamp((+nc.value || pick.start) + +b.dataset.c, pick.min, pick.max); show();
  }));
  el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => {
    amt.value = Math.min(lv.max, Math.max(1, (+amt.value || 1) + +b.dataset.d)); show();
  }));
  show();
}
