import { firstFree } from '../algo.js';

function positions(lv, W) {
  const M = W < 500 ? 36 : 70;
  if (lv.layout === 'line') return Array.from({ length: lv.n }, (_, i) => [M + i * (W - 2 * M) / (lv.n - 1), 70]);
  const h = lv.n / 2;
  return Array.from({ length: lv.n }, (_, i) => [M + (i % h) * (W - 2 * M) / (h - 1), i < h ? 50 : 230]);
}

export function mountColour(el, lv, report) {
  const W = el.clientWidth && el.clientWidth < 460 ? 380 : 560;
  const pos = positions(lv, W), H = lv.layout === 'line' ? 140 : 290;
  let order = [];
  el.innerHTML = `<svg class="graph" viewBox="0 0 ${W} ${H}" role="group" aria-label="Graph: click dots to colour them"></svg>
    <div class="legend" id="leg"></div>
    <div class="controls" style="justify-content:center"><button id="undo">Undo</button><button id="reset">Start over</button></div>`;
  const svg = el.querySelector('svg');
  const ns = 'http://www.w3.org/2000/svg';
  for (const [a, b] of lv.edges) {
    const l = document.createElementNS(ns, 'line');
    l.setAttribute('class', 'edge'); l.setAttribute('x1', pos[a][0]); l.setAttribute('y1', pos[a][1]); l.setAttribute('x2', pos[b][0]); l.setAttribute('y2', pos[b][1]);
    svg.appendChild(l);
  }
  const nodes = pos.map(([x, y], v) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'v'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
    g.innerHTML = `<circle cx="${x}" cy="${y}" r="22"/><text x="${x}" y="${y}"></text><text class="order" x="${x}" y="${y + (y > H / 2 ? 40 : -32)}"></text>`;
    const act = () => colour(v);
    g.addEventListener('click', act);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    svg.appendChild(g); return g;
  });
  const colourOf = () => { const col = new Array(lv.n).fill(-1); for (const v of order) col[v] = firstFree(lv.adj, col, v); return col; };
  function colour(v) { if (order.includes(v)) return; order.push(v); draw(); }
  el.querySelector('#undo').addEventListener('click', () => { order.pop(); draw(); });
  el.querySelector('#reset').addEventListener('click', () => { order = []; draw(); });
  function draw() {
    const col = colourOf();
    nodes.forEach((g, v) => {
      const c = col[v], k = order.indexOf(v);
      g.querySelector('circle').style.fill = c < 0 ? '#fff' : `var(--c${c + 1})`;
      g.querySelectorAll('text')[0].textContent = c < 0 ? '' : c + 1;
      g.querySelectorAll('text')[1].textContent = k < 0 ? '' : `#${k + 1}`;
      g.classList.toggle('done', c >= 0);
      const nb = lv.adj[v].length;
      g.setAttribute('aria-label', c < 0 ? `Dot ${v + 1}, uncoloured, ${nb} neighbour${nb > 1 ? 's' : ''}` : `Dot ${v + 1}, colour ${c + 1}, coloured ${ordinal(k + 1)}`);
    });
    const used = Math.max(0, ...col) + (order.length ? 1 : 0);
    el.querySelector('#leg').innerHTML = `Colours used: <b>${order.length ? used : 0}</b> &nbsp;·&nbsp; goal: ${lv.target}`;
    el.querySelector('#undo').disabled = !order.length;
    const broken = used >= lv.target;
    report({ broken, bonus: false,
      note: broken ? '' : order.length === lv.n ? `Every dot is coloured, with ${used} colours. Start over and try another order.` : '' });
  }
  draw();
}
const ordinal = k => k + (k % 10 === 1 && k !== 11 ? 'st' : k % 10 === 2 && k !== 12 ? 'nd' : k % 10 === 3 && k !== 13 ? 'rd' : 'th');
