import { MEETING_RULES, greedyMeetings, bestMeetings } from '../algo.js';

/** One room, a list of meeting requests (bars on a timeline). Greedy rules book meetings; the player makes every
 *  listed rule book fewer than the best possible. Drag across a free lane to add a meeting; × removes it. */
export function mountMeetings(el, lv, report) {
  const T = lv.hours, H0 = lv.firstHour;
  let I = [];
  const hourOpts = (from, to, sel) => Array.from({ length: to - from + 1 }, (_, i) => from + i).map(h => `<option value="${h - H0}" ${h - H0 === sel ? 'selected' : ''}>${h}:00</option>`).join('');
  el.innerHTML = `
    <div class="tl" id="tl" role="group" aria-label="Meeting requests on a timeline"></div>
    <form class="addform" id="add">
      <span class="muted">Add a meeting:</span>
      <label>from <select id="as">${hourOpts(H0, H0 + T - 1, 0)}</select></label>
      <label>to <select id="ae">${hourOpts(H0 + 1, H0 + T, 2)}</select></label>
      <button type="submit">Add</button><button type="button" id="clr">Clear all</button>
    </form>
    <div id="res" class="mres" aria-live="polite"></div>`;
  const tl = el.querySelector('#tl');
  el.querySelector('#add').addEventListener('submit', e => {
    e.preventDefault();
    const s = +el.querySelector('#as').value, en = +el.querySelector('#ae').value;
    if (en > s) add([s, en]);
  });
  el.querySelector('#clr').addEventListener('click', () => { I = []; draw(); });
  function add(m) {
    if (I.length >= lv.maxMeetings || I.some(x => x[0] === m[0] && x[1] === m[1])) return draw(I.length >= lv.maxMeetings ? `At most ${lv.maxMeetings} meetings.` : 'That meeting is already on the list.');
    I.push(m); draw();
  }

  // drag to create on the empty lane at the bottom
  let drag = null;
  const hourAt = (x) => { const r = tl.querySelector('.track.new').getBoundingClientRect(); return Math.max(0, Math.min(T, Math.round((x - r.left) / r.width * T))); };
  tl.addEventListener('pointerdown', e => {
    if (!e.target.closest('.track.new')) return;
    const r = tl.querySelector('.track.new').getBoundingClientRect();
    const h = Math.max(0, Math.min(T - 1, Math.floor((e.clientX - r.left) / r.width * T)));
    drag = { a: h, b: h + 1 }; tl.setPointerCapture(e.pointerId); ghost(); e.preventDefault();
  });
  tl.addEventListener('pointermove', e => {
    if (!drag) return;
    const h = hourAt(e.clientX);
    if (h > drag.a) { drag.b = h; } else { drag.b = drag.a + 1; drag.s = Math.min(h, drag.a); }
    ghost();
  });
  tl.addEventListener('pointerup', () => {
    if (!drag) return;
    const m = [drag.s ?? drag.a, drag.b]; drag = null; add(m);
  });
  function ghost() {
    const g = tl.querySelector('.track.new .bar');
    const s = drag.s ?? drag.a, e = drag.b;
    g.hidden = false; g.style.left = `${s / T * 100}%`; g.style.width = `${(e - s) / T * 100}%`;
  }

  function draw(msg = '') {
    const results = lv.rules.map(r => ({ r, pick: greedyMeetings(I, r) }));
    const best = bestMeetings(I);
    const ticks = Array.from({ length: T + 1 }, (_, h) => `<span style="left:${h / T * 100}%">${H0 + h}</span>`).join('');
    const marks = i => results.map(({ r, pick }) => {
      const k = pick.indexOf(i);
      return `<span class="mk ${k >= 0 ? 'on' : ''}" title="${MEETING_RULES[r].name}">${k >= 0 ? k + 1 : '·'}</span>`;
    }).join('') + `<span class="mk best ${best.includes(i) ? 'on' : ''}">${best.includes(i) ? '✓' : '·'}</span>`;
    const showC = lv.rules.includes('conflicts');
    const clashes = i => I.reduce((c, x, j) => c + (j !== i && x[0] < I[i][1] && I[i][0] < x[1] ? 1 : 0), 0);
    const n = lv.rules.length + 1 + (showC ? 1 : 0), blanks = k => '<span></span>'.repeat(k);
    const narrow = el.clientWidth < 460;
    tl.style.gridTemplateColumns = `minmax(0, 1fr) repeat(${n}, ${narrow ? 30 : 40}px) ${narrow ? 28 : 34}px`;
    tl.style.setProperty('--hours', T);
    tl.innerHTML = `<div class="ticks" aria-hidden="true">${ticks}</div>${blanks(n + 1)}
      <span></span>${showC ? '<span class="mk head">clashes</span>' : ''}${lv.rules.map(r => `<span class="mk head">${lv.rules.length === 1 ? 'order' : MEETING_RULES[r].short}</span>`).join('')}<span class="mk head best">best</span><span></span>` +
      I.map((m, i) => `<div class="track"><div class="bar" style="left:${m[0] / T * 100}%;width:${(m[1] - m[0]) / T * 100}%">${H0 + m[0]}–${H0 + m[1]}</div></div>
        ${showC ? `<span class="mk cnt" aria-label="clashes with ${clashes(i)}">${clashes(i)}</span>` : ''}${marks(i)}<button class="x" data-i="${i}" aria-label="Remove meeting ${H0 + m[0]}:00 to ${H0 + m[1]}:00">×</button>`).join('') +
      `<div class="track new"><div class="bar" hidden></div><span class="muted">${I.length >= lv.maxMeetings ? 'full' : (narrow ? 'drag to add' : 'drag here to add a meeting')}</span></div>${blanks(n + 1)}`;
    tl.querySelectorAll('.x').forEach(b => b.addEventListener('click', () => { I.splice(+b.dataset.i, 1); draw(); }));
    const say = (name, n) => `${name} books <b>${n}</b> meeting${n === 1 ? '' : 's'}`;
    el.querySelector('#res').innerHTML = (msg ? `<p class="bad">${msg}</p>` : '') + `<p>${results.map(({ r, pick }) => say(cap(MEETING_RULES[r].name), pick.length)).join(' · ')} · the best schedule fits <b>${best.length}</b>.</p>`;
    const broken = I.length > 0 && results.every(({ pick }) => pick.length < best.length);
    const someFail = results.some(({ pick }) => pick.length < best.length);
    report({ broken, bonus: broken && lv.bonus && I.length === lv.bonus.smallest,
      note: broken ? '' : someFail ? 'One rule is fooled. Now fool the other with the same list.' : '' });
  }
  draw();
}
const cap = s => s[0].toUpperCase() + s.slice(1);
