import { newCard, review, isDue, Grade } from './srs.js';
import { localDate } from './store.js';

// Memory stages, read from the FSRS card (stability = days until the chance of remembering falls to 90 %).
// Same rule as Taalmaatje. Nothing extra is stored, so a forgotten card moves back down by itself.
export const FAMILIAR_DAYS = 7;
export const LEARNED_DAYS = 21;
export const LEARNED_REPS = 3;
export const STAGES = ['new', 'learning', 'familiar', 'learned'];
export const KINDS = ['question', 'term', 'formula'];

export function stageOf(state, id) {
  const card = state.cards[id];
  if (!card) return 'new';
  const days = Number.isFinite(card.stability) ? card.stability : 0;
  if ((card.reps ?? 0) >= LEARNED_REPS && days >= LEARNED_DAYS) return 'learned';
  if ((card.reps ?? 0) > 0 && days >= FAMILIAR_DAYS) return 'familiar';
  return 'learning';
}

export function stageCounts(state, cards) {
  const counts = Object.fromEntries(STAGES.map((s) => [s, 0]));
  for (const c of cards) counts[stageOf(state, c.id)]++;
  return counts;
}

export const dueIds = (state, cards, now = new Date(), kind = '') =>
  cards.filter((c) => (!kind || c.kind === kind) && state.cards[c.id] && isDue(state.cards[c.id], now))
    .sort((a, b) => new Date(state.cards[a.id].due) - new Date(state.cards[b.id].due)).map((c) => c.id);

export const freshToday = (state, now = new Date()) => state.log[localDate(now)]?.fresh ?? 0;

// Questions first, then terms, then formulas: the order they appear in the notes.
export function newIds(state, cards, now = new Date(), kind = '') {
  const left = Math.max(0, state.settings.newPerDay - freshToday(state, now));
  const rank = (c) => KINDS.indexOf(c.kind);
  return cards.filter((c) => (!kind || c.kind === kind) && !state.cards[c.id]).sort((a, b) => rank(a) - rank(b)).slice(0, left).map((c) => c.id);
}

export function gradeCard(state, id, g, now = new Date()) {
  const before = state.cards[id];
  const card = review(before ?? newCard(now), g, now);
  const day = localDate(now);
  const entry = state.log[day] ?? { reviews: 0, fresh: 0 };
  return {
    ...state,
    cards: { ...state.cards, [id]: card },
    log: { ...state.log, [day]: { reviews: entry.reviews + 1, fresh: entry.fresh + (before ? 0 : 1) } },
  };
}

export { Grade };

// Up to `limit` question cards from these chapters, least-known first (for the "quick check" after a video).
export function quickCheck(state, cards, chapters, limit = 3) {
  const order = { new: 0, learning: 1, familiar: 2, learned: 3 };
  return cards.filter((c) => c.kind === 'question' && chapters.includes(c.ch))
    .sort((a, b) => order[stageOf(state, a.id)] - order[stageOf(state, b.id)] || a.id.localeCompare(b.id, 'en', { numeric: true }))
    .slice(0, limit).map((c) => c.id);
}

export function formatWait(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${Math.max(1, min)} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d`;
  const months = Math.round(days / 30);
  return months < 12 ? `${months} mo` : `${(months / 12).toFixed(1)} y`;
}

export function streak(state, now = new Date()) {
  let n = 0;
  const d = new Date(now);
  if (!(state.log[localDate(d)]?.reviews > 0)) d.setDate(d.getDate() - 1); // today may still be empty
  while (state.log[localDate(d)]?.reviews > 0) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function lastDays(state, count = 7, now = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (count - 1 - i));
    return { date: localDate(d), label: d.toLocaleDateString('en', { weekday: 'short' }), reviews: state.log[localDate(d)]?.reviews ?? 0 };
  });
}
