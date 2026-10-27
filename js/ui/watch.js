import { h } from '../dom.js';
import { isWatched, videoOf, embedUrl, watchUrl } from '../videos.js';
import { quickCheck } from '../review.js';
import { search } from '../search.js';

let view = 'sessions';   // 'sessions' (the book) or 'index' (the flat list of the video index)
let filter = 'next';     // index view: next, watched or all
let q = '';
const openSessions = new Set();
let openInit = false;

export async function render(ctx, el, id) {
  const [data, weeks, notes] = await Promise.all([ctx.load('content/videos.json'), ctx.load('content/weeks.json'), ctx.load('content/vnotes.json')]);
  if (id) return detail(ctx, el, data, weeks, notes, id);
  if (!openInit) { openInit = true; if (weeks.sessions.length) openSessions.add(weeks.sessions.at(-1).n); }
  const all = allVideos(weeks, data);
  const n = all.filter((v) => isWatched(ctx.state, v)).length;
  el.append(h('h1', {}, 'Watch'), h('p', { class: 'muted' }, `${n} of ${all.length} videos watched`),
    h('div', { class: 'chips', style: 'margin:10px 0' }, [['sessions', 'Sessions'], ['index', 'Index']].map(([k, label]) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(view === k), onClick: () => { view = k; ctx.rerender(); } }, label))));
  if (view === 'index') return indexView(ctx, el, data);
  return sessionsView(ctx, el, data, weeks, notes);
}

// Every video the app knows: the sessions book plus the index rows that no session lists.
export function allVideos(weeks, data) {
  const out = weeks.sessions.flatMap((s) => s.videos.filter((e) => !e.missing).map((e) => ({ id: e.id, status: e.status })));
  const seen = new Set(out.map((v) => v.id));
  for (const v of data.videos) if (!seen.has(v.id)) out.push({ id: v.id, status: v.status });
  return out;
}

export const metaOf = (data, notes, id) => {
  const v = videoOf(data, id), note = notes[id];
  return { ...v, title: note?.title || v.title, source: note?.source || v.source, duration: note?.duration || v.duration, chapters: note?.chapters?.length ? note.chapters : v.chapters };
};

function sessionsView(ctx, el, data, weeks, notes) {
  const results = h('div', { class: 'stack', style: 'margin-top:12px' });
  const book = h('div', { class: 'stack', style: 'margin-top:12px' });
  const run = async () => {
    results.replaceChildren();
    book.style.display = q.trim().length >= 2 ? 'none' : '';
    if (q.trim().length < 2) return;
    const hits = search(await ctx.load('content/search.json'), q, 30, { fa: ctx.state.settings.farsi }).filter((x) => x.entry.vid);
    results.append(h('div', { class: 'label' }, `${hits.length} video${hits.length === 1 ? '' : 's'}`),
      ...hits.map(({ entry, snippet }) => h('a', { class: 'card', style: 'text-decoration:none;color:inherit', href: `#/watch/${entry.vid}` },
        h('strong', {}, entry.title), h('div', { class: 'small muted' }, `Session ${entry.session}`), h('div', { class: 'snippet' }, snippet))));
    if (!hits.length) results.append(h('div', { class: 'card empty' }, 'No video page mentions that. Try the Notes tab: it searches the chapters too.'));
  };
  el.append(h('input', { type: 'search', id: 'vq', placeholder: 'Search the videos, for example ROC', value: q, 'aria-label': 'Search the videos', onInput: (e) => { q = e.target.value; run(); } }), results, book);
  for (const s of weeks.sessions) book.append(session(ctx, s, data, notes));
  if (q) run();
}

function session(ctx, s, data, notes) {
  const list = s.videos.map((e) => ({ e, m: metaOf(data, notes, e.id), w: isWatched(ctx.state, { id: e.id, status: e.status }) }));
  const done = list.filter((x) => x.w).length;
  const markAll = (on) => { ctx.update((st) => ({ ...st, watched: { ...st.watched, ...Object.fromEntries(list.filter((x) => !x.e.missing).map((x) => [x.e.id, on])) } })); ctx.rerender(); };
  return h('details', { class: 'session card', open: openSessions.has(s.n), onToggle: (ev) => { if (ev.target.open) openSessions.add(s.n); else openSessions.delete(s.n); } },
    h('summary', {}, h('div', { class: 'label' }, `Session ${s.n} · ${s.dates}`), h('strong', {}, s.topic || `Session ${s.n}`), h('div', { class: 'small muted' }, `${done} of ${list.length} watched`)),
    h('div', { class: 'stack', style: 'margin-top:10px' },
      (s.links ?? []).map((l) => h('a', { class: 'vrow', href: l.url, target: '_blank', rel: 'noopener', style: 'text-decoration:none;color:inherit' }, h('span', { class: 'vnum' }, '↗'), h('span', { class: 'grow', style: 'min-width:0' }, h('div', {}, l.title), h('div', { class: 'small muted' }, 'Opens in your browser')))),
      list.map(({ e, m, w }, i) => row(m, i + 1, w)),
      h('button', { type: 'button', class: 'btn small', onClick: () => markAll(done !== list.length) }, done === list.length ? 'Mark the session as not watched' : 'Mark the whole session as watched')));
}

export function row(m, num, w) {
  return h('a', { class: 'vrow', href: `#/watch/${m.id}`, style: 'text-decoration:none;color:inherit' },
    h('span', { class: 'vnum' }, num), h('span', { class: 'grow', style: 'min-width:0' }, h('div', {}, m.title), h('div', { class: 'small muted' }, [m.source, m.duration].filter(Boolean).join(', '))),
    h('span', { class: `pill ${w ? 'done' : 'next'}` }, w ? 'Watched' : 'Next'));
}

function indexView(ctx, el, data) {
  const list = data.videos.filter((v) => filter === 'all' || (filter === 'watched') === isWatched(ctx.state, v));
  el.append(h('div', { class: 'chips', style: 'margin:0 0 10px' }, [['next', 'Next'], ['watched', 'Watched'], ['all', 'All']].map(([k, label]) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(filter === k), onClick: () => { filter = k; ctx.rerender(); } }, label))),
    h('div', { class: 'stack' }, list.length ? list.map((v) => indexRow(ctx, v)) : h('div', { class: 'card empty' }, filter === 'watched' ? 'Nothing watched yet.' : 'Nothing left to watch.')));
}

export function indexRow(ctx, v) {
  const w = isWatched(ctx.state, v);
  return h('a', { class: 'vrow', href: `#/watch/${v.id}`, style: 'text-decoration:none;color:inherit' },
    h('span', { class: 'vnum' }, v.n < 100 ? v.n : ''), h('span', { class: 'grow', style: 'min-width:0' }, h('div', {}, v.title), h('div', { class: 'small muted' }, [v.source, v.duration].filter(Boolean).join(', '))),
    h('span', { class: `pill ${w ? 'done' : 'next'}` }, w ? 'Watched' : 'Next'));
}

async function detail(ctx, el, data, weeks, notes, id) {
  const m = metaOf(data, notes, id), note = notes[id];
  const sess = weeks.sessions.find((s) => s.videos.some((e) => e.id === id));
  const entry = sess?.videos.find((e) => e.id === id);
  const w = isWatched(ctx.state, { id, status: entry?.status ?? m.status });
  const cards = await ctx.load('content/cards.json');
  const qs = quickCheck(ctx.state, cards, m.chapters);
  const at = sess ? sess.videos.findIndex((e) => e.id === id) : -1;
  const prev = at > 0 ? sess.videos[at - 1] : null, next = at >= 0 && at < sess.videos.length - 1 ? sess.videos[at + 1] : null;
  const nav = (e, label) => (e ? h('a', { class: 'btn grow', href: `#/watch/${e.id}` }, label) : h('span', { class: 'grow' }));
  el.append(h('a', { class: 'btn small', href: '#/watch' }, '‹ All sessions'),
    sess ? h('p', { class: 'label', style: 'margin-top:14px' }, `Session ${sess.n} · video ${at + 1} of ${sess.videos.length}`) : null,
    h('h1', { style: sess ? '' : 'margin-top:14px' }, m.title),
    h('p', { class: 'muted' }, [m.source, m.duration, m.layer && m.layer.toLowerCase()].filter(Boolean).join(' · ')),
    navigator.onLine
      ? h('iframe', { class: 'player', src: embedUrl(id), title: m.title, allow: 'accelerometer; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin', loading: 'lazy' })
      : h('div', { class: 'player empty', style: 'display:grid;place-items:center' }, 'You are offline. Videos need internet; the text below and your notes still work.'),
    h('p', { class: 'small' }, h('a', { href: watchUrl(id), target: '_blank', rel: 'noopener' }, 'Open in the YouTube app')),
    note ? h('article', { class: 'read vtext card', style: `--fs:${ctx.state.settings.fontScale}` },
      h('div', { class: 'label' }, 'Text version'),
      h('div', { html: note.html }),
      note.fa && note.fa.translated < note.fa.total ? h('p', { class: 'fa-only small muted' }, note.fa.translated ? `Farsi: ${note.fa.translated} of ${note.fa.total} paragraphs are translated so far.` : 'Farsi is not available for this page yet.') : null,
      h('p', { class: 'small muted basis' }, note.basis === 'notes' ? 'Written from the course notes, not from the video transcript. Check it against the video.' : 'Based on the transcript of this video.')) : null,
    h('div', { class: 'stack', style: 'margin-top:8px' },
      h('button', { type: 'button', class: `btn wide ${w ? '' : 'primary'}`, onClick: () => { ctx.update((s) => ({ ...s, watched: { ...s.watched, [id]: !w } })); ctx.rerender(); } }, w ? 'Watched · tap to undo' : 'Mark as watched'),
      qs.length ? h('button', { type: 'button', class: 'btn wide', onClick: () => ctx.startReview(qs, `Quick check: ${m.title}`) }, `Quick check: ${qs.length} questions from chapter ${m.chapters.join(', ')}`) : null,
      m.chapters.map((n) => h('a', { class: 'btn wide', href: `#/notes/ch-${n}` }, `Read chapter ${n}`)),
      sess ? h('div', { class: 'row' }, nav(prev, '‹ Previous'), nav(next, 'Next ›')) : null));
}

// The rows of one session (outside links first, then its videos); used by the Today tab.
export function sessionRows(ctx, s, data, notes) {
  return [
    (s.links ?? []).map((l) => h('a', { class: 'vrow', href: l.url, target: '_blank', rel: 'noopener', style: 'text-decoration:none;color:inherit' }, h('span', { class: 'vnum' }, '↗'), h('span', { class: 'grow', style: 'min-width:0' }, h('div', {}, l.title), h('div', { class: 'small muted' }, 'Opens in your browser')))),
    s.videos.filter((e) => !e.missing).map((e, i) => row(metaOf(data, notes, e.id), i + 1, isWatched(ctx.state, { id: e.id, status: e.status }))),
  ];
}
