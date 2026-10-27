import { h } from '../dom.js';
import { dueIds, newIds, gradeCard, Grade, formatWait, KINDS } from '../review.js';
import { previews, newCard } from '../srs.js';
import { farsi } from '../i18n.js';

let kind = '';
export let session = null;

export function startSession(ids, title) { session = { ids: ids.slice(), i: 0, shown: false, done: 0, again: {}, title }; }
export const endSession = () => { session = null; };

const KIND_NAMES = { '': 'All', question: 'Questions', term: 'Terms', formula: 'Formulas' };

export async function render(ctx, el) {
  const cards = await ctx.load('content/cards.json');
  const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
  if (session) return card(ctx, el, byId);
  const due = dueIds(ctx.state, cards, new Date(), kind), fresh = newIds(ctx.state, cards, new Date(), kind);
  el.append(h('h1', {}, 'Review'), h('p', { class: 'muted' }, 'Cards from your notes, spaced so each one comes back just before you forget it.'),
    h('div', { class: 'grid2', style: 'margin:12px 0' }, tile(due.length, 'due now'), tile(fresh.length, `new today (max ${ctx.state.settings.newPerDay})`)),
    h('div', { class: 'chips', style: 'margin-bottom:12px' }, ['', ...KINDS].map((k) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(kind === k), onClick: () => { kind = k; ctx.rerender(); } }, KIND_NAMES[k]))),
    h('button', { type: 'button', class: 'btn primary wide', disabled: !(due.length + fresh.length), onClick: () => { startSession([...due, ...fresh], 'Today'); ctx.rerender(); } }, due.length + fresh.length ? `Start ${due.length + fresh.length} cards` : 'Nothing due. Come back later.'));
}

const tile = (n, text) => h('div', { class: 'card tile' }, h('div', { class: 'big' }, n), h('div', { class: 'small muted' }, text));

function card(ctx, el, byId) {
  const s = session;
  if (s.i >= s.ids.length) {
    el.append(h('h1', {}, 'Done'), h('p', { class: 'muted' }, `${s.done} cards reviewed. ${s.title}.`), h('button', { type: 'button', class: 'btn primary wide', onClick: () => { endSession(); ctx.rerender(); } }, 'Back to Review'));
    return;
  }
  const id = s.ids[s.i], c = byId[id];
  const label = c.kind === 'question' ? `Chapter ${c.ch} question` : c.kind === 'term' ? 'Term' : 'Formula';
  el.append(
    h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn small', onClick: () => { endSession(); ctx.rerender(); } }, '‹ Stop'),
      h('span', { class: 'grow small muted', style: 'text-align:center' }, `${s.i + 1} / ${s.ids.length} · ${label}`), h('span', { style: 'width:60px' })),
    h('div', { class: 'card flash', style: 'margin-top:12px' }, h('div', { class: 'front', html: c.front }), farsi(c.fa?.f), s.shown ? h('div', { class: 'back', html: c.back }) : null, s.shown ? farsi(c.fa?.b) : null,
      s.shown && c.kind === 'question' ? h('a', { class: 'small', href: `#/notes/ch-${c.ch}` }, `Read chapter ${c.ch}`) : null),
    s.shown ? grades(ctx, id) : h('button', { type: 'button', class: 'btn primary wide', style: 'margin-top:12px', onClick: () => { s.shown = true; ctx.rerender(); } }, 'Show answer'));
}

function grades(ctx, id) {
  const wait = previews(ctx.state.cards[id] ?? newCard());
  const names = [[Grade.Again, 'Again'], [Grade.Hard, 'Hard'], [Grade.Good, 'Good'], [Grade.Easy, 'Easy']];
  return h('div', { class: 'grades', style: 'margin-top:12px' }, names.map(([g, name]) => h('button', {
    type: 'button', 'data-g': String(g), onClick: () => {
      ctx.update((st) => gradeCard(st, id, g));
      // "Again" brings the card back at the end of this session, at most twice.
      if (g === Grade.Again && (session.again[id] ?? 0) < 2) { session.again[id] = (session.again[id] ?? 0) + 1; session.ids.push(id); }
      session.done++; session.i++; session.shown = false; ctx.rerender();
    },
  }, name, h('small', {}, formatWait(wait[g])))));
}
