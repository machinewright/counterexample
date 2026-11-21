import { cacheTrace } from '../algo.js';

const LABEL = { fifo: 'first in, first out', lru: 'least recently used' };
const SHORT = { fifo: 'FIFO', lru: 'LRU' };

/** Two caches run the same request list; the player makes caches[1] miss more than caches[0]. */
export function mountFifo(el, lv, report) {
  el.innerHTML = `
    <div class="typer">
      <label class="visually-hidden" for="seq">Page requests (letters ${lv.pages[0]} to ${lv.pages.at(-1)})</label>
      <input id="seq" autocomplete="off" spellcheck="false" maxlength="${lv.maxLen}" placeholder="type pages, e.g. ABCA">
    </div>
    <div class="typer" aria-label="Add a request">
      ${[...lv.pages].map(p => `<button class="page" data-p="${p}">${p}</button>`).join('')}
      <button id="back" aria-label="Remove last request">⌫</button><button id="clear">Clear</button>
    </div>
    <div class="trace" id="trace" tabindex="-1"></div>
    <p class="muted scroll-cue" id="cue" hidden>The list is wider than the screen: scroll it sideways →</p>
    <div class="totals" id="tot" aria-live="polite"></div>`;
  const inp = el.querySelector('#seq');
  const clean = () => { const v = inp.value.toUpperCase().replace(new RegExp(`[^${lv.pages}]`, 'g'), '').slice(0, lv.maxLen); if (v !== inp.value) inp.value = v; return v; };
  inp.addEventListener('input', show);
  el.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { inp.value = clean() + b.dataset.p; show(); }));
  el.querySelector('#back').addEventListener('click', () => { inp.value = clean().slice(0, -1); show(); });
  el.querySelector('#clear').addEventListener('click', () => { inp.value = ''; show(); });
  const name = c => lv.caches.every(x => x.policy === c.policy) ? `${c.k} slots` : `${c.k} slots, ${SHORT[c.policy]}`;

  function block(seq, c) {
    const steps = cacheTrace(seq, c.k, c.policy);
    let rows = '';
    for (let r = 0; r < c.k; r++) {
      rows += `<tr><th>${r === 0 ? name(c) : ''}</th>` + steps.map(s => {
        const p = s.mem[r];
        return p === undefined ? '<td class="empty"></td>' : `<td class="${s.fault && p === s.page ? 'new' : ''}">${p}</td>`;
      }).join('') + '</tr>';
    }
    rows += `<tr><th></th>${steps.map(s => `<td class="miss">${s.fault ? 'miss' : ''}</td>`).join('')}</tr>`;
    return { rows, misses: steps.filter(s => s.fault).length };
  }
  function show() {
    const seq = [...clean()];
    const [a, b] = lv.caches.map(c => block(seq, c));
    const tr = el.querySelector('#trace');
    tr.innerHTML = seq.length ? `<table aria-hidden="true">
      <tr><th>request</th>${seq.map(p => `<td class="req">${p}</td>`).join('')}</tr>
      <tr class="gap"><th></th></tr>${a.rows}<tr class="gap"><th></th></tr>${b.rows}</table>`
      : `<p class="muted">Each cache's contents will show here, the page it will throw out next on top.</p>`;
    el.querySelector('#cue').hidden = tr.scrollWidth <= tr.clientWidth + 1;
    el.querySelector('#tot').innerHTML = lv.caches.map((c, i) => `<span>${name(c)}: ${[a, b][i].misses} misses</span>`).join('');
    const broken = b.misses > a.misses;
    report({ broken, bonus: broken && seq.length === lv.bonus.smallest,
      note: broken ? '' : seq.length >= 6 && a.misses === b.misses ? `Tied so far. The ${name(lv.caches[1])} cache has to fall behind.` : '' });
  }
  show();
}
export { LABEL };
