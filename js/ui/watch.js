import { h } from '../dom.js';
import { isWatched, videoOf, embedUrl, watchUrl } from '../videos.js';
import { quickCheck } from '../review.js';

let filter = 'next';

export async function render(ctx, el, id) {
  const data = await ctx.load('content/videos.json');
  if (id) return detail(ctx, el, data, id);
  const list = data.videos.filter((v) => filter === 'all' || (filter === 'watched') === isWatched(ctx.state, v));
  const n = data.videos.filter((v) => isWatched(ctx.state, v)).length;
  el.append(h('h1', {}, 'Watch'), h('p', { class: 'muted' }, `${n} of ${data.videos.length} videos watched`),
    h('div', { class: 'chips', style: 'margin:10px 0' }, [['next', 'Next'], ['watched', 'Watched'], ['all', 'All']].map(([k, label]) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(filter === k), onClick: () => { filter = k; ctx.rerender(); } }, label))),
    h('div', { class: 'stack' }, list.length ? list.map((v) => row(ctx, v)) : h('div', { class: 'card empty' }, filter === 'watched' ? 'Nothing watched yet.' : 'Nothing left to watch.')));
}

export function row(ctx, v) {
  const w = isWatched(ctx.state, v);
  return h('a', { class: 'vrow', href: `#/watch/${v.id}`, style: 'text-decoration:none;color:inherit' },
    h('span', { class: 'vnum' }, v.n < 100 ? v.n : ''), h('span', { class: 'grow', style: 'min-width:0' }, h('div', {}, v.title), h('div', { class: 'small muted' }, [v.source, v.duration].filter(Boolean).join(', '))),
    h('span', { class: `pill ${w ? 'done' : 'next'}` }, w ? 'Watched' : 'Next'));
}

async function detail(ctx, el, data, id) {
  const v = videoOf(data, id);
  const cards = await ctx.load('content/cards.json');
  const w = isWatched(ctx.state, v);
  const qs = quickCheck(ctx.state, cards, v.chapters);
  el.append(h('a', { class: 'btn small', href: '#/watch' }, '‹ All videos'), h('h1', { style: 'margin-top:14px' }, v.title),
    h('p', { class: 'muted' }, [v.source, v.duration, v.layer && v.layer.toLowerCase()].filter(Boolean).join(' · ')),
    navigator.onLine
      ? h('iframe', { class: 'player', src: embedUrl(id), title: v.title, allow: 'accelerometer; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin', loading: 'lazy' })
      : h('div', { class: 'player empty', style: 'display:grid;place-items:center' }, 'You are offline. Videos need internet; notes and cards still work.'),
    h('p', { class: 'small' }, h('a', { href: watchUrl(id), target: '_blank', rel: 'noopener' }, 'Open in the YouTube app')),
    h('div', { class: 'stack', style: 'margin-top:8px' },
      h('button', { type: 'button', class: `btn wide ${w ? '' : 'primary'}`, onClick: () => { ctx.update((s) => ({ ...s, watched: { ...s.watched, [id]: !w } })); ctx.rerender(); } }, w ? 'Watched · tap to undo' : 'Mark as watched'),
      qs.length ? h('button', { type: 'button', class: 'btn wide', onClick: () => ctx.startReview(qs, `Quick check: ${v.title}`) }, `Quick check: ${qs.length} questions from chapter ${v.chapters.join(', ')}`) : null,
      v.chapters.map((n) => h('a', { class: 'btn wide', href: `#/notes/ch-${n}` }, `Read chapter ${n}`))));
}
