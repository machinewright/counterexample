import { dijkstra, bellmanFord, pathTo } from '../algo.js';

/** A small directed graph with editable weights. Mode 'dijkstra': make Dijkstra's distance to the target wrong.
 *  Mode 'shift': add a constant so no weight is negative, run Dijkstra; make the path it finds not the shortest. */
export function mountPaths(el, lv, report) {
  const names = lv.names, n = names.length, src = 0, t = n - 1;
  const w = lv.edges.map(e => e[2]);
  const narrow = el.clientWidth > 0 && el.clientWidth < 460, W = narrow ? 340 : 520, H = narrow ? 220 : 250, ns = 'http://www.w3.org/2000/svg';
  el.innerHTML = `<svg class="graph paths" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="#9aa0aa"/></marker>
      <marker id="ahd" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="#a8650f"/></marker></defs></svg>
    <div class="weights" id="wts"></div>
    <div id="pres" class="mres" aria-live="polite"></div>`;
  const svg = el.querySelector('svg');
  const P = lv.pos.map(([x, y]) => [x * W, y * H]);
  const R = 22;
  const geo = lv.edges.map(([a, b]) => {
    const [x1, y1] = P[a], [x2, y2] = P[b], d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    return { x1: x1 + ux * R, y1: y1 + uy * R, x2: x2 - ux * (R + 2), y2: y2 - uy * (R + 2), mx: (x1 + x2) / 2 - uy * 14, my: (y1 + y2) / 2 + ux * 14 };
  });
  let html = '';
  geo.forEach((g, i) => { html += `<line class="hl h${i}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}"/>`; });
  geo.forEach((g, i) => { html += `<line class="edge e${i}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}" marker-end="url(#ah)"/>`; });
  geo.forEach((g, i) => { html += `<text class="wt w${i}" x="${g.mx}" y="${g.my}"></text>`; });
  P.forEach(([x, y], v) => { html += `<g class="v"><circle cx="${x}" cy="${y}" r="${R}"/><text x="${x}" y="${y}">${names[v]}</text><g class="badge b${v}" hidden><circle cx="${x + R * 0.95}" cy="${y - R * 0.95}" r="10"/><text class="o${v}" x="${x + R * 0.95}" y="${y - R * 0.95}"></text></g></g>`; });
  svg.insertAdjacentHTML('beforeend', html);
  const label = i => `${names[lv.edges[i][0]]}→${names[lv.edges[i][1]]}`;
  el.querySelector('#wts').innerHTML = lv.edges.map((e, i) => lv.editable.includes(i)
    ? `<span class="wbox"><span class="wl">${label(i)}</span><button data-i="${i}" data-d="-1" aria-label="Lower ${label(i)}">−</button><output id="wv${i}" aria-live="off"></output><button data-i="${i}" data-d="1" aria-label="Raise ${label(i)}">+</button></span>`
    : `<span class="wbox fixed"><span class="wl">${label(i)}</span><output>${e[2]}</output></span>`).join('');
  el.querySelectorAll('#wts button').forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i; w[i] = Math.max(lv.min, Math.min(lv.max, w[i] + +b.dataset.d)); draw();
  }));
  const fmt = p => p.map(v => names[v]).join('→');
  const cost = p => p.slice(1).reduce((c, v, k) => c + w[lv.edges.findIndex(e => e[0] === p[k] && e[1] === v)], 0);

  function draw() {
    const E = lv.edges.map((e, i) => [e[0], e[1], w[i]]);
    lv.edges.forEach((_, i) => { svg.querySelector(`.w${i}`).textContent = w[i]; const o = el.querySelector(`#wv${i}`); if (o) o.textContent = w[i]; });
    const truth = bellmanFord(n, E, src);
    let ran, shift = 0;
    if (lv.mode === 'shift') { shift = Math.max(0, -Math.min(...w)); ran = dijkstra(n, E.map(([a, b, x]) => [a, b, x + shift]), src); }
    else ran = dijkstra(n, E, src);
    const dp = pathTo(ran.prev, t), tp = truth ? pathTo(truth.prev, t) : [];
    const onPath = (p, i) => p.some((v, k) => k && lv.edges[i][0] === p[k - 1] && lv.edges[i][1] === v);
    lv.edges.forEach((_, i) => {
      const l = svg.querySelector(`.e${i}`);
      l.classList.toggle('alg', onPath(dp, i)); svg.querySelector(`.h${i}`).classList.toggle('true', !!truth && onPath(tp, i));
      l.setAttribute('marker-end', onPath(dp, i) ? 'url(#ahd)' : 'url(#ah)');
    });
    names.forEach((_, v) => { const k = ran.order.indexOf(v), show = lv.mode === 'dijkstra' && k >= 0; svg.querySelector(`.b${v}`).toggleAttribute('hidden', !show); svg.querySelector(`.o${v}`).textContent = show ? k + 1 : ''; });
    const res = el.querySelector('#pres');
    if (!truth) { res.innerHTML = '<p class="bad">There is a loop with negative total weight, so no path is shortest: you can go round it for ever. The claim is only about graphs without one.</p>'; return report({ broken: false }); }
    let broken, text;
    if (lv.mode === 'shift') {
      const real = cost(dp);
      text = `Adding ${shift} to every weight, Dijkstra picks <span class="alg-t">${fmt(dp)}</span>, which really costs <b>${real}</b>. The shortest path is <span class="true-t">${fmt(tp)}</span> at <b>${truth.dist[t]}</b>.`;
      broken = real > truth.dist[t];
    } else {
      text = `Dijkstra says the shortest way to ${names[t]} costs <b>${ran.dist[t]}</b>, via <span class="alg-t">${fmt(dp)}</span>. Truly shortest: <b>${truth.dist[t]}</b>, via <span class="true-t">${fmt(tp)}</span>.`;
      broken = ran.dist[t] !== truth.dist[t];
    }
    res.innerHTML = `<p>${text}</p>`;
    report({ broken, bonus: broken && lv.bonus && lv.bonus.test(w), note: '' });
  }
  draw();
}
