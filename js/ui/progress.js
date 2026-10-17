import { h, toast } from '../dom.js';
import { stageCounts, STAGES, streak, lastDays } from '../review.js';
import { isWatched } from '../videos.js';
import { buildBackup, parseBackup, NEW_PER_DAY, VOICES, RATES, defaultState } from '../store.js';

const COLORS = { learned: 'var(--good)', familiar: 'var(--accent)', learning: 'var(--muted)', new: 'var(--line)' };
let confirmReset = false;

export async function render(ctx, el) {
  const [cards, vids, toc] = await Promise.all([ctx.load('content/cards.json'), ctx.load('content/videos.json'), ctx.load('content/toc.json')]);
  const s = ctx.state;
  const counts = stageCounts(s, cards);
  const watched = vids.videos.filter((v) => isWatched(s, v)).length;
  const chapters = toc.parts.flatMap((p) => p.chapters);
  const readCount = chapters.filter((c) => s.read[`ch-${c.n}`]).length;
  const days = lastDays(s), max = Math.max(5, ...days.map((d) => d.reviews));
  el.append(h('h1', {}, 'Progress'),
    h('div', { class: 'grid2', style: 'margin:12px 0' }, tile(`${watched} / ${vids.videos.length}`, 'videos watched'), tile(`${readCount} / ${chapters.length}`, 'chapters read'), tile(streak(s), 'day streak'), tile(counts.learned, 'cards learned')),
    h('div', { class: 'card' }, h('strong', {}, 'Cards by stage'),
      h('div', { class: 'bar', style: 'margin:10px 0' }, [...STAGES].reverse().map((k) => h('i', { style: `width:${(100 * counts[k]) / cards.length}%;background:${COLORS[k]}` }))),
      h('div', { class: 'chips small' }, STAGES.map((k) => h('span', {}, h('b', { style: `color:${COLORS[k]}` }, '● '), `${counts[k]} ${k}`))),
      h('p', { class: 'small muted' }, 'Learned means about three weeks of memory and at least 3 reviews. A card you forget moves back down.')),
    h('div', { class: 'card', style: 'margin-top:10px' }, h('strong', {}, 'Reviews, last 7 days'),
      h('div', { style: 'display:flex;align-items:flex-end;gap:8px;height:96px;margin-top:12px' }, days.map((d) => h('div', { style: 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;height:100%' },
        h('span', { class: 'small muted' }, d.reviews || ''), h('div', { style: `width:100%;border-radius:6px 6px 0 0;background:var(--accent);height:${Math.max(3, (60 * d.reviews) / max)}px;opacity:${d.reviews ? 1 : 0.25}` }), h('span', { class: 'small muted' }, d.label))))),
    settings(ctx));
}

const tile = (n, text) => h('div', { class: 'card tile' }, h('div', { class: 'big' }, n), h('div', { class: 'small muted' }, text));

function settings(ctx) {
  const s = ctx.state;
  const file = h('input', { type: 'file', accept: 'application/json,.json', id: 'restore', style: 'display:none', onChange: async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { const next = parseBackup(await f.text()); ctx.update(() => next); toast('Backup restored'); ctx.rerender(); } catch (err) { toast(err.message); }
  } });
  return h('div', { class: 'card', style: 'margin-top:10px' }, h('strong', {}, 'Settings and backup'),
    h('div', { class: 'row', style: 'margin:10px 0' }, h('label', { for: 'perday', class: 'grow' }, 'New cards per day'),
      h('select', { id: 'perday', onChange: (e) => ctx.update((st) => ({ ...st, settings: { ...st.settings, newPerDay: +e.target.value } })) }, NEW_PER_DAY.map((n) => h('option', { value: n, selected: n === s.settings.newPerDay }, n)))),
    h('div', { class: 'row', style: 'margin:10px 0' }, h('label', { for: 'voice', class: 'grow' }, 'Reading voice'),
      h('select', { id: 'voice', onChange: (e) => ctx.update((st) => ({ ...st, settings: { ...st.settings, voice: e.target.value } })) }, VOICES.map((v) => h('option', { value: v, selected: v === s.settings.voice }, v === 'heart' ? 'Heart' : 'Emma')))),
    h('div', { class: 'row', style: 'margin:10px 0' }, h('label', { for: 'rate', class: 'grow' }, 'Reading speed'),
      h('select', { id: 'rate', onChange: (e) => ctx.update((st) => ({ ...st, settings: { ...st.settings, rate: +e.target.value } })) }, RATES.map((r) => h('option', { value: r, selected: r === s.settings.rate }, `${r}×`)))),
    h('p', { class: 'small muted' }, 'Your progress stays on this phone. Save a backup file before you clear Safari data or change phones.'),
    h('div', { class: 'row', style: 'flex-wrap:wrap' },
      h('button', { type: 'button', class: 'btn small', onClick: () => {
        const blob = new Blob([buildBackup(ctx.state)], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `ai-path-backup-${new Date().toISOString().slice(0, 10)}.json` });
        document.body.append(a); a.click(); a.remove();
      } }, 'Save backup'),
      h('button', { type: 'button', class: 'btn small', onClick: () => file.click() }, 'Restore backup'), file,
      h('button', { type: 'button', class: `btn small ${confirmReset ? 'danger' : ''}`, onClick: () => { if (!confirmReset) { confirmReset = true; ctx.rerender(); return; } confirmReset = false; ctx.update(() => defaultState()); toast('Progress reset'); ctx.rerender(); } }, confirmReset ? 'Tap again to erase everything' : 'Reset progress')));
}
