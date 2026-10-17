import { h, toast } from '../dom.js';
import { RATES } from '../store.js';
import { lastAtOrBefore } from '../timing.js';

// Read-aloud with recorded voices (Heart and Emma). The audio is one file per chapter; a small JSON file gives the
// start of every sentence and word, and the text carries <span data-s data-w> marks, so the sentence and the word
// being read are highlighted as the voice goes. One audio element is kept for the whole session: iOS lets it
// continue to the next chapter by itself once you have pressed play.
const audio = new Audio();
audio.preload = 'auto';
let pendingAutoplay = false;
let pruned = false;

export const VOICE_NAMES = { heart: 'Heart', emma: 'Emma' };
const AUDIO_CACHE = 'audio-aipath';

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

async function pruneCache(manifest) {
  if (pruned || !globalThis.caches) return;
  pruned = true;
  try {
    const keep = new Set();
    for (const [n, e] of Object.entries(manifest.chapters)) for (const v of Object.keys(e.voices)) for (const ext of ['mp3', 'json']) keep.add(new URL(`audio/${v}/ch-${n}.${e.hash}.${ext}`, location.href).href);
    const cache = await caches.open(AUDIO_CACHE);
    for (const req of await cache.keys()) if (!keep.has(req.url)) await cache.delete(req);
  } catch { /* no cache on this device */ }
}

// Returns the "Listen" button for the top bar, or null if this chapter has no audio yet.
export async function attach(ctx, el, art, data) {
  let manifest;
  try { manifest = await ctx.load('audio/manifest.json'); } catch { return null; }
  const entry = manifest.chapters?.[String(data.n)];
  if (!entry || entry.hash !== data.speechHash) return null;
  pruneCache(manifest);
  const voices = manifest.voices.filter((v) => entry.voices[v.id]);
  if (!voices.length) return null;

  const words = new Map(); // sentence -> [[spans of word 0], [spans of word 1], ...]
  const sentences = new Map(); // sentence -> all its spans
  for (const sp of art.querySelectorAll('[data-s]')) {
    const s = +sp.dataset.s, w = +sp.dataset.w;
    if (!words.has(s)) { words.set(s, []); sentences.set(s, []); }
    (words.get(s)[w] ??= []).push(sp);
    sentences.get(s).push(sp);
  }

  let voice = voices.some((v) => v.id === ctx.state.settings.voice) ? ctx.state.settings.voice : voices[0].id;
  let timings = null, starts = [], curS = -1, curW = -1, raf = 0, open = false, manualUntil = 0, lastSave = 0;
  const url = (ext, v = voice) => `audio/${v}/ch-${data.n}.${entry.hash}.${ext}`;

  const slider = h('input', { type: 'range', min: '0', max: String(Math.floor(entry.voices[voice].d)), value: '0', step: '1', 'aria-label': 'Position', class: 'seek' });
  const timeLabel = h('span', { class: 'small muted', style: 'font-variant-numeric:tabular-nums;min-width:5.5em;text-align:right' }, `0:00 / ${clock(entry.voices[voice].d)}`);
  const playBtn = h('button', { type: 'button', class: 'btn primary play', 'aria-label': 'Play' }, '▶');
  const rateBtn = h('button', { type: 'button', class: 'btn small', 'aria-label': 'Speed' }, `${ctx.state.settings.rate}×`);
  const voiceBtns = voices.map((v) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(v.id === voice), onClick: () => switchVoice(v.id) }, v.name));
  const bar = h('div', { class: 'listen-bar', hidden: true },
    h('div', { class: 'inner' },
      h('div', { class: 'row' }, slider, timeLabel),
      h('div', { class: 'row', style: 'justify-content:space-between;flex-wrap:wrap;margin-top:6px' },
        h('div', { class: 'chips' }, voiceBtns),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn small', 'aria-label': 'Back 15 seconds', onClick: () => skip(-15) }, '−15'),
          playBtn,
          h('button', { type: 'button', class: 'btn small', 'aria-label': 'Forward 15 seconds', onClick: () => skip(15) }, '+15'),
          rateBtn,
          h('button', { type: 'button', class: 'btn small', 'aria-label': 'Close player', onClick: () => close() }, '✕')))));
  el.append(bar);
  const listenBtn = h('button', { type: 'button', class: 'btn small', onClick: () => (open ? close() : start()) }, '♪ Listen');

  const loadTimings = async (v = voice) => { const t = await ctx.load(url('json', v)); return t; };
  async function load(v, atSentence) {
    voice = v;
    timings = await loadTimings(v);
    starts = timings.s.map((x) => x[0]);
    slider.max = String(Math.floor(timings.d));
    const wasSrc = new URL(url('mp3'), location.href).href;
    if (audio.src !== wasSrc) audio.src = url('mp3');
    audio.playbackRate = ctx.state.settings.rate;
    if (atSentence != null) {
      const t = timings.s[Math.min(atSentence, timings.s.length - 1)][0];
      if (audio.readyState >= 1) audio.currentTime = t; else audio.addEventListener('loadedmetadata', () => { audio.currentTime = t; update(true); }, { once: true });
    }
  }

  let litWord = [];
  function mark(s, w) {
    if (s !== curS) {
      for (const sp of sentences.get(curS) ?? []) sp.classList.remove('sp-s');
      for (const sp of sentences.get(s) ?? []) sp.classList.add('sp-s');
      curS = s; curW = -2;
      const first = sentences.get(s)?.[0];
      if (first && Date.now() > manualUntil) {
        const r = first.getBoundingClientRect();
        if (r.top < 100 || r.bottom > innerHeight - 230) scrollTo({ top: scrollY + r.top - innerHeight * 0.3, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    }
    if (w !== curW) {
      for (const sp of litWord) sp.classList.remove('sp-w');
      litWord = words.get(s)?.[w] ?? [];
      for (const sp of litWord) sp.classList.add('sp-w');
      curW = w;
    }
  }
  function update(force = false) {
    if (!timings) return;
    const t = audio.currentTime;
    const s = lastAtOrBefore(starts, t);
    const [, end, ws] = timings.s[s];
    mark(s, t <= end + 0.4 ? lastAtOrBefore(ws, t) : ws.length - 1);
    if (!slider.matches(':active') || force) slider.value = String(Math.floor(t));
    timeLabel.textContent = `${clock(t)} / ${clock(timings.d)}`;
    if (!audio.paused && Date.now() - lastSave > 4000) { lastSave = Date.now(); savePos(s); }
  }
  const savePos = (s) => ctx.update((st) => ({ ...st, audioPos: { ...st.audioPos, [data.n]: s } }));
  function loop() { update(); if (!audio.paused) raf = requestAnimationFrame(loop); }

  const onPlay = () => { playBtn.textContent = '⏸'; playBtn.setAttribute('aria-label', 'Pause'); cancelAnimationFrame(raf); loop(); session(); };
  const onPause = () => { playBtn.textContent = '▶'; playBtn.setAttribute('aria-label', 'Play'); cancelAnimationFrame(raf); update(); if (timings) savePos(curS < 0 ? 0 : curS); };
  const onEnded = () => {
    savePos(0);
    ctx.update((st) => ({ ...st, read: { ...st.read, [`ch-${data.n}`]: true } }));
    const next = manifest.chapters[String(data.n + 1)];
    if (next && next.voices[voice]) { pendingAutoplay = true; location.hash = `#/notes/ch-${data.n + 1}`; }
  };
  const onError = () => toast('This audio is not saved on the phone yet. Connect to the internet and try again.');
  audio.addEventListener('play', onPlay); audio.addEventListener('pause', onPause); audio.addEventListener('ended', onEnded); audio.addEventListener('error', onError);
  audio.addEventListener('timeupdate', onTimeupdate);
  function onTimeupdate() { if (audio.paused) update(); }

  function session() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: `Chapter ${data.n}: ${data.title}`, artist: `${VOICE_NAMES[voice] ?? voice} · AI Path`, album: 'Notes', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
      navigator.mediaSession.setActionHandler('play', () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => skip(-15));
      navigator.mediaSession.setActionHandler('seekforward', () => skip(15));
    } catch { /* not supported */ }
  }

  function skip(d) { audio.currentTime = Math.max(0, Math.min(timings.d, audio.currentTime + d)); update(true); }
  function seekSentence(s) { audio.currentTime = timings.s[s][0]; update(true); }
  async function play() { try { await audio.play(); } catch { onError(); } }

  async function start() {
    open = true; bar.hidden = false; document.body.classList.add('has-player');
    const saved = ctx.state.audioPos?.[data.n] ?? 0;
    await load(voice, saved > 0 ? saved : 0);
    await play();
  }
  function close() { open = false; audio.pause(); bar.hidden = true; document.body.classList.remove('has-player'); }
  async function switchVoice(v) {
    if (v === voice) return;
    const s = Math.max(0, curS), wasPlaying = !audio.paused;
    audio.pause();
    voiceBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(voices[i].id === v)));
    ctx.update((st) => ({ ...st, settings: { ...st.settings, voice: v } }));
    await load(v, s);
    if (wasPlaying) await play();
  }
  rateBtn.addEventListener('click', () => {
    const next = RATES[(RATES.indexOf(ctx.state.settings.rate) + 1) % RATES.length] ?? 1;
    ctx.update((st) => ({ ...st, settings: { ...st.settings, rate: next } }));
    audio.playbackRate = next; rateBtn.textContent = `${next}×`;
  });
  slider.addEventListener('input', () => { if (timings) { audio.currentTime = +slider.value; update(); } });
  playBtn.addEventListener('click', () => (audio.paused ? play() : audio.pause()));

  // tap a sentence to hear it from there
  art.addEventListener('click', (e) => {
    const sp = e.target.closest?.('[data-s]');
    if (!open || !sp || e.target.closest('a') || !timings) return;
    seekSentence(+sp.dataset.s);
    if (audio.paused) play();
  });
  const manual = () => { manualUntil = Date.now() + 4000; };
  addEventListener('touchmove', manual, { passive: true }); addEventListener('wheel', manual, { passive: true });

  ctx.onLeave(() => {
    cancelAnimationFrame(raf);
    removeEventListener('touchmove', manual); removeEventListener('wheel', manual);
    audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause); audio.removeEventListener('ended', onEnded); audio.removeEventListener('error', onError); audio.removeEventListener('timeupdate', onTimeupdate);
    if (!pendingAutoplay) audio.pause();
    document.body.classList.remove('has-player');
  });

  // continuing from the previous chapter
  if (pendingAutoplay) { pendingAutoplay = false; queueMicrotask(async () => { open = true; bar.hidden = false; document.body.classList.add('has-player'); await load(voice, 0); await play(); }); }
  return listenBtn;
}
