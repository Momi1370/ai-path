import { createStore } from './store.js';
import { h, clear } from './dom.js';
import * as today from './ui/today.js';
import * as watch from './ui/watch.js';
import * as review from './ui/review.js';
import * as notes from './ui/notes.js';
import * as progress from './ui/progress.js';

const TABS = [
  ['today', 'Today', '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>'],
  ['watch', 'Watch', '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>'],
  ['review', 'Review', '<rect x="4" y="6" width="14" height="12" rx="2"/><path d="M8 3h12v12"/>'],
  ['notes', 'Notes', '<path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13C17 4 14 4.5 12 6z"/><path d="M12 6v13"/>'],
  ['progress', 'Progress', '<path d="M5 20V11"/><path d="M12 20V5"/><path d="M19 20v-6"/>'],
];

const root = document.getElementById('app');
let storage = null;
try { storage = window.localStorage; } catch { storage = null; }
const store = createStore(storage);
const cache = new Map();
let leaveHooks = [];

const ctx = {
  state: store.load(),
  update(fn) { ctx.state = fn(ctx.state); store.save(ctx.state); },
  load(path) {
    if (!cache.has(path)) cache.set(path, fetch(path, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); }).catch((e) => { cache.delete(path); throw e; }));
    return cache.get(path);
  },
  onLeave: (fn) => leaveHooks.push(fn),
  rerender: () => render(false),
  startReview(ids, title) { review.startSession(ids, title); location.hash = '#/review'; if (location.hash === '#/review') render(); },
};

// "#/notes/ch-9/h-91-why" -> ['notes', 'ch-9', 'h-91-why']
const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

async function render(fresh = true) {
  const [name = 'today', a, b] = parse();
  const route = TABS.some(([id]) => id === name) ? name : 'today';
  const keepScroll = !fresh ? scrollY : 0;
  for (const fn of leaveHooks) fn();
  leaveHooks = [];
  document.querySelectorAll('[data-tab]').forEach((t) => { const on = t.dataset.tab === route; t.classList.toggle('active', on); if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); });
  if (route !== 'review' && review.session && fresh) review.endSession();
  clear(root);
  try {
    if (route === 'today') await today.render(ctx, root);
    else if (route === 'watch') await watch.render(ctx, root, a);
    else if (route === 'review') await review.render(ctx, root);
    else if (route === 'notes') await notes.render(ctx, root, a, b);
    else await progress.render(ctx, root);
  } catch (e) {
    console.warn(e);
    root.append(h('div', { class: 'card' }, h('h1', {}, 'Could not load this page'), h('p', {}, 'Check your internet connection and try again. If you installed the app, open it once while online so it can save its content.'),
      h('button', { type: 'button', class: 'btn primary', onClick: () => render() }, 'Try again')));
  }
  document.body.dataset.ready = route;
  if (route !== 'notes' || !a) window.scrollTo(0, keepScroll);
}

function buildTabs() {
  const nav = document.getElementById('tabs');
  for (const [id, label, svg] of TABS) {
    const a = h('a', { href: `#/${id}`, 'data-tab': id });
    a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${svg}</svg>`;
    a.append(label);
    nav.append(a);
  }
}

buildTabs();
addEventListener('hashchange', () => render());
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
await render();
