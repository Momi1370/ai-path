import { h } from '../dom.js';
import { search } from '../search.js';
import { attach } from './listen.js';

let q = '';

export async function render(ctx, el, page, section) {
  if (!page) return index(ctx, el);
  if (page === 'e') return glossary(ctx, el);
  return reader(ctx, el, page, section);
}

async function index(ctx, el) {
  const toc = await ctx.load('content/toc.json');
  const results = h('div', { class: 'stack', style: 'margin-top:12px' });
  const run = async () => {
    results.replaceChildren();
    if (q.trim().length < 2) return;
    const hits = search(await ctx.load('content/search.json'), q);
    results.append(h('div', { class: 'label' }, `${hits.length} result${hits.length === 1 ? '' : 's'}`),
      ...hits.map(({ entry, snippet }) => h('a', { class: 'card', style: 'text-decoration:none;color:inherit', href: entry.page ? `#/notes/${entry.page}` : `#/notes/ch-${entry.ch}${entry.id ? `/${entry.id}` : ''}` },
        h('strong', {}, entry.title), h('div', { class: 'small muted' }, entry.ch ? `Chapter ${entry.ch}` : 'Appendix'), h('div', { class: 'snippet' }, snippet))));
    if (!hits.length) results.append(h('div', { class: 'card empty' }, 'Nothing found. Try fewer or different words.'));
  };
  const input = h('input', { type: 'search', id: 'q', placeholder: 'Search all chapters and terms', value: q, 'aria-label': 'Search notes', onInput: (e) => { q = e.target.value; run(); } });
  el.append(h('h1', {}, 'Notes'), h('p', { class: 'muted' }, 'A textbook of 18 chapters. Search finds the exact section.'), input, results);
  if (q) run();
  const last = ctx.state.last;
  const lastCh = last.startsWith('ch-') ? toc.parts.flatMap((p) => p.chapters).find((c) => `ch-${c.n}` === last) : null;
  if (lastCh) el.append(h('a', { class: 'card', style: 'display:block;text-decoration:none;color:inherit;margin-top:12px', href: `#/notes/ch-${lastCh.n}` },
    h('div', { class: 'label' }, 'Continue reading'), h('strong', {}, `Chapter ${lastCh.n}: ${lastCh.title}`), h('div', { class: 'small muted' }, `${Math.round((ctx.state.scroll[last] ?? 0) * 100)}% read`)));
  for (const p of toc.parts) el.append(h('div', { class: 'part' }, h('div', { class: 'label' }, `Part ${p.letter} · ${p.name}`),
    p.chapters.map((c) => h('a', { class: 'chrow', href: `#/notes/ch-${c.n}`, style: 'text-decoration:none;color:inherit' }, h('span', { class: 'chnum' }, c.n), h('span', { class: 'grow' }, h('div', {}, c.title), h('div', { class: 'small muted' }, `${c.minutes} min read${ctx.state.read[`ch-${c.n}`] ? ' · read' : ''}`)), h('span', { class: 'muted' }, '›')))));
  el.append(h('div', { class: 'part' }, h('div', { class: 'label' }, 'Appendices'),
    [...toc.appendices.map((a) => [`#/notes/${a.id}`, a.id === 'e' ? 'Glossary' : a.title]), ['#/watch', 'Video index']].map(([href, title]) => h('a', { class: 'chrow', href, style: 'text-decoration:none;color:inherit' }, h('span', { class: 'grow' }, title), h('span', { class: 'muted' }, '›')))));
}

async function reader(ctx, el, page, section) {
  const isChapter = page.startsWith('ch-');
  const data = await ctx.load(`content/chapters/${page}.json`);
  const toc = isChapter ? await ctx.load('content/toc.json') : null;
  const chapters = toc ? toc.parts.flatMap((p) => p.chapters) : [];
  const art = h('article', { class: 'read', style: `--fs:${ctx.state.settings.fontScale}`, html: data.html });
  const bar = h('div', { class: 'row' }, h('a', { class: 'btn small', href: '#/notes' }, '‹ Notes'), h('span', { class: 'grow' }),
    h('button', { type: 'button', class: 'btn small', 'aria-label': 'Smaller text', onClick: () => zoom(-0.1) }, 'A−'),
    h('button', { type: 'button', class: 'btn small', 'aria-label': 'Larger text', onClick: () => zoom(0.1) }, 'A+'));
  function zoom(d) {
    const v = Math.min(1.6, Math.max(0.85, +(ctx.state.settings.fontScale + d).toFixed(2)));
    ctx.update((s) => ({ ...s, settings: { ...s.settings, fontScale: v } }));
    art.style.setProperty('--fs', v);
  }
  el.append(bar);
  if (isChapter) {
    const listen = await attach(ctx, el, art, data);
    if (listen) bar.append(listen);
    el.append(h('p', { class: 'label', style: 'margin-top:16px' }, `Part ${data.part} · Chapter ${data.n}`), h('h1', {}, data.title));
    if (data.sections.length) el.append(h('details', { class: 'card', style: 'margin:10px 0' }, h('summary', {}, 'In this chapter'), h('div', { class: 'stack small', style: 'margin-top:8px' }, data.sections.map((s) => h('a', { href: `#/notes/${page}/${s.id}` }, s.title)))));
  } else el.append(h('h1', { style: 'margin-top:16px' }, data.title));
  el.append(art);
  if (isChapter) {
    const i = chapters.findIndex((c) => c.n === data.n);
    el.append(h('div', { class: 'card', style: 'margin-top:18px' }, h('strong', {}, 'Check yourself'), h('p', { class: 'small muted' }, 'This chapter\'s questions are in your review deck.'),
      h('button', { type: 'button', class: 'btn wide', onClick: async () => { const cards = await ctx.load('content/cards.json'); ctx.startReview(cards.filter((c) => c.kind === 'question' && c.ch === data.n).map((c) => c.id), `Chapter ${data.n}`); } }, 'Answer them now')),
      h('div', { class: 'row', style: 'margin-top:12px' }, i > 0 ? h('a', { class: 'btn grow', href: `#/notes/ch-${chapters[i - 1].n}` }, `‹ Chapter ${chapters[i - 1].n}`) : h('span', { class: 'grow' }), i < chapters.length - 1 ? h('a', { class: 'btn grow', href: `#/notes/ch-${chapters[i + 1].n}` }, `Chapter ${chapters[i + 1].n} ›`) : null));
  }
  // where you were: the section you asked for, else how far you had read
  requestAnimationFrame(() => {
    const target = section && document.getElementById(section);
    if (target) target.scrollIntoView();
    else if (ctx.state.scroll[page] > 0.02 && ctx.state.scroll[page] < 0.97) window.scrollTo(0, ctx.state.scroll[page] * (document.documentElement.scrollHeight - innerHeight));
    else window.scrollTo(0, 0);
  });
  ctx.update((s) => ({ ...s, last: page }));
  let timer = 0;
  const onScroll = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const frac = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 1;
      ctx.update((s) => ({ ...s, scroll: { ...s.scroll, [page]: +frac.toFixed(3) }, read: frac >= 0.9 ? { ...s.read, [page]: true } : s.read }));
    }, 300);
  };
  addEventListener('scroll', onScroll, { passive: true });
  ctx.onLeave(() => { clearTimeout(timer); removeEventListener('scroll', onScroll); });
}

async function glossary(ctx, el) {
  const terms = (await ctx.load('content/cards.json')).filter((c) => c.kind === 'term');
  const list = h('div', { class: 'stack glossary', style: 'margin-top:12px' });
  let gq = '';
  const paint = () => {
    const w = gq.trim().toLowerCase();
    const shown = w ? terms.filter((t) => `${t.front} ${t.back}`.toLowerCase().includes(w)) : terms;
    list.replaceChildren(...shown.map((t) => h('div', { class: 'card' }, h('strong', { html: t.front }), h('div', { class: 'muted', html: t.back }))), shown.length ? null : h('div', { class: 'card empty' }, 'No such term.'));
  };
  el.append(h('a', { class: 'btn small', href: '#/notes' }, '‹ Notes'), h('h1', { style: 'margin-top:14px' }, 'Glossary'), h('p', { class: 'muted' }, `${terms.length} terms, one plain line each.`),
    h('input', { type: 'search', id: 'gq', placeholder: 'Find a term', 'aria-label': 'Find a term', onInput: (e) => { gq = e.target.value; paint(); } }), list);
  paint();
}
