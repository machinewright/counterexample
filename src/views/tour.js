import { nearestTour, bestTour } from '../algo.js';

/** Place cities on a grid of points; the first one placed is home. Shows the nearest-neighbour tour (orange, numbered)
 *  and the best tour (green band); the player makes the nearest-neighbour tour long compared with the best. */
export function mountTour(el, lv, report) {
  const G = lv.grid, S = 64, M = 36, W = M * 2 + S * (G - 1), ns = 'http://www.w3.org/2000/svg';
  let C = [];
  el.innerHTML = `<svg class="graph tour" viewBox="0 0 ${W} ${W}" role="group" aria-label="Map: click points to place cities"></svg>
    <div class="controls" style="justify-content:center"><button id="undo">Undo</button><button id="reset">Start over</button></div>
    <div id="tres" class="mres" aria-live="polite"></div>`;
  const svg = el.querySelector('svg');
  const xy = ([x, y]) => [M + x * S, M + y * S];
  svg.innerHTML = '<g class="best"></g><g class="nn"></g><g class="pts"></g>';
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    const g = document.createElementNS(ns, 'g');
    const [px, py] = xy([x, y]);
    g.setAttribute('class', 'pt'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
    g.innerHTML = `<circle class="hit" cx="${px}" cy="${py}" r="26"/><circle class="dot" cx="${px}" cy="${py}" r="4"/><circle class="city" cx="${px}" cy="${py}" r="13"/><text x="${px}" y="${py}"></text>`;
    const act = () => toggle(x, y);
    g.addEventListener('click', act);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    g.dataset.x = x; g.dataset.y = y;
    svg.querySelector('.pts').appendChild(g);
  }
  function toggle(x, y) {
    const i = C.findIndex(c => c[0] === x && c[1] === y);
    if (i >= 0) C.splice(i, 1); else if (C.length < lv.cities) C.push([x, y]); else return draw(`All ${lv.cities} cities are placed. Click one to remove it.`);
    draw();
  }
  el.querySelector('#undo').addEventListener('click', () => { C.pop(); draw(); });
  el.querySelector('#reset').addEventListener('click', () => { C = []; draw(); });
  const line = (a, b, cls) => { const [x1, y1] = xy(a), [x2, y2] = xy(b); return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; };

  function draw(msg = '') {
    svg.querySelectorAll('.pt').forEach(g => {
      const i = C.findIndex(c => c[0] === +g.dataset.x && c[1] === +g.dataset.y);
      g.classList.toggle('on', i >= 0); g.classList.toggle('home', i === 0);
      g.querySelector('text').textContent = i === 0 ? 'H' : '';
      g.setAttribute('aria-label', `Point ${+g.dataset.x + 1}, ${+g.dataset.y + 1}${i === 0 ? ', home' : i > 0 ? ', city' : ''}`);
    });
    const res = el.querySelector('#tres');
    el.querySelector('#undo').disabled = !C.length;
    if (C.length < lv.cities) {
      svg.querySelector('.best').innerHTML = svg.querySelector('.nn').innerHTML = '';
      res.innerHTML = (msg ? `<p class="bad">${msg}</p>` : '') + `<p class="muted">${C.length ? `${lv.cities - C.length} more to place.` : `Place ${lv.cities} cities. The first one is home (H).`}</p>`;
      return report({ broken: false });
    }
    const nn = nearestTour(C), best = bestTour(C), ratio = nn.length / best.length;
    svg.querySelector('.best').innerHTML = best.order.map((v, i) => line(C[v], C[best.order[(i + 1) % C.length]], 'band')).join('');
    svg.querySelector('.nn').innerHTML = nn.order.map((v, i) => line(C[v], C[nn.order[(i + 1) % C.length]], 'leg')).join('') +
      nn.order.slice(1).map((v, i) => { const [x, y] = xy(C[v]); return `<text class="step" x="${x + 15}" y="${y - 15}">${i + 1}</text>`; }).join('');
    const r = Math.floor(ratio * 1000 + 1e-6) / 1000;
    res.innerHTML = (msg ? `<p class="bad">${msg}</p>` : '') + `<p>Nearest neighbour: <span class="alg-t">${nn.length.toFixed(2)}</span> · best tour: <span class="true-t">${best.length.toFixed(2)}</span> · <b>${r.toFixed(3)}×</b> as long</p>`;
    report({ broken: ratio >= lv.target - 1e-9, bonus: ratio >= lv.bonus.worst - 1e-6,
      note: ratio >= lv.target - 1e-9 ? '' : `${r.toFixed(3)}× so far; the goal is ${lv.target}×.` });
  }
  draw();
}
