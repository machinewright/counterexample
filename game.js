import { LEVELS } from './src/levels.js';
import { mountCoins } from './src/views/coins.js';
import { mountColour } from './src/views/colour.js';
import { mountFifo } from './src/views/fifo.js';
import { mountMeetings } from './src/views/meetings.js';
import { mountPaths } from './src/views/paths.js';

const VIEWS = { coins: mountCoins, colour: mountColour, fifo: mountFifo, meetings: mountMeetings, paths: mountPaths };
const KEY = 'counterexample-progress-v1';
const $ = id => document.getElementById(id);
let progress = {};
try { const p = JSON.parse(localStorage.getItem(KEY)); if (p && typeof p === 'object') progress = p; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch {} };
let cur = 0;

function nav() {
  $('levels').innerHTML = LEVELS.map((lv, i) => {
    const p = progress[lv.id] || {};
    const stars = p.won ? (lv.bonus ? (p.bonus ? '★★' : '★☆') : '★') : '';
    return `<button data-i="${i}" ${i === cur ? 'aria-current="true"' : ''}>${i + 1}<span class="stars" aria-label="${p.won ? 'broken' : ''}">${stars}</span></button>`;
  }).join('');
  $('levels').querySelectorAll('button').forEach(b => b.addEventListener('click', () => load(+b.dataset.i)));
}

function load(i) {
  cur = i; const lv = LEVELS[i];
  $('title').textContent = `${i + 1}. ${lv.title}`;
  $('claim').textContent = lv.claim;
  $('setup').textContent = lv.setup;
  $('goal').textContent = lv.goal + (lv.bonus ? ` Second star: ${lv.bonus.goal}.` : '');
  $('hint').textContent = lv.hint; $('hint').hidden = true; $('hint-btn').setAttribute('aria-expanded', 'false');
  $('verdict').innerHTML = '';
  $('next-btn').hidden = true;
  nav();
  VIEWS[lv.kind]($('stage'), lv, st => verdict(lv, st));
}

function verdict(lv, st) {
  const p = progress[lv.id] ||= {};
  if (st.broken) {
    const firstWin = !p.won;
    p.won = true; if (st.bonus) p.bonus = true; save(); nav();
    let star = '';
    if (lv.bonus) star = st.bonus ? `<p class="star">★★ And it's the smallest possible. ${lv.bonus.done}</p>`
      : p.bonus ? '' : `<p class="star">★☆ For the second star: ${lv.bonus.goal}.</p>`;
    $('verdict').innerHTML = `<p class="broken">Claim broken.</p>${star}<p class="why">${lv.why}</p>`;
    $('next-btn').hidden = cur === LEVELS.length - 1;
    if (firstWin) $('verdict').scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  } else {
    $('verdict').innerHTML = st.note ? `<p class="muted">${st.note}</p>` : '';
    $('next-btn').hidden = true;
  }
}

$('hint-btn').addEventListener('click', () => {
  const open = $('hint').hidden; $('hint').hidden = !open; $('hint-btn').setAttribute('aria-expanded', String(open));
});
$('next-btn').addEventListener('click', () => load(Math.min(cur + 1, LEVELS.length - 1)));
load(Math.max(0, LEVELS.findIndex(l => !progress[l.id]?.won)));
