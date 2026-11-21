import { fifoTrace } from '../algo.js';

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
    <div class="trace" id="trace"></div>
    <div class="totals" id="tot" aria-live="polite"></div>`;
  const inp = el.querySelector('#seq');
  const clean = () => { const v = inp.value.toUpperCase().replace(new RegExp(`[^${lv.pages}]`, 'g'), '').slice(0, lv.maxLen); if (v !== inp.value) inp.value = v; return v; };
  inp.addEventListener('input', show);
  el.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { inp.value = clean() + b.dataset.p; show(); }));
  el.querySelector('#back').addEventListener('click', () => { inp.value = clean().slice(0, -1); show(); });
  el.querySelector('#clear').addEventListener('click', () => { inp.value = ''; show(); });

  function block(seq, k) {
    const steps = fifoTrace(seq, k);
    let rows = '';
    for (let r = 0; r < k; r++) {
      rows += `<tr><th>${r === 0 ? `${k} slots` : ''}</th>` + steps.map(s => {
        const p = s.mem[r];
        return p === undefined ? '<td class="empty"></td>' : `<td class="${s.fault && p === s.page ? 'new' : ''}">${p}</td>`;
      }).join('') + '</tr>';
    }
    rows += `<tr><th></th>${steps.map(s => `<td class="miss">${s.fault ? 'miss' : ''}</td>`).join('')}</tr>`;
    return { rows, misses: steps.filter(s => s.fault).length };
  }
  function show() {
    const seq = [...clean()];
    const a = block(seq, lv.small), b = block(seq, lv.large);
    el.querySelector('#trace').innerHTML = seq.length ? `<table aria-hidden="true">
      <tr><th>request</th>${seq.map(p => `<td class="req">${p}</td>`).join('')}</tr>
      <tr class="gap"><th></th></tr>${a.rows}<tr class="gap"><th></th></tr>${b.rows}</table>` : '<p class="muted">Each cache\'s contents will show here, oldest page on top.</p>';
    el.querySelector('#tot').innerHTML = `<span>${lv.small} slots: ${a.misses} misses</span><span>${lv.large} slots: ${b.misses} misses</span>`;
    const broken = b.misses > a.misses;
    report({ broken, bonus: broken && seq.length === lv.bonus.smallest,
      note: broken ? '' : seq.length >= 6 && a.misses === b.misses ? 'Tied so far. The bigger cache has to fall behind.' : '' });
  }
  show();
}
