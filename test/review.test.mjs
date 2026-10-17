import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState } from '../js/store.js';
import { stageOf, stageCounts, gradeCard, dueIds, newIds, quickCheck, formatWait, streak, lastDays, Grade } from '../js/review.js';
import { previews, newCard } from '../js/srs.js';

const cards = [
  { id: 'q1-1', kind: 'question', ch: 1, front: 'a', back: 'b' }, { id: 'q1-2', kind: 'question', ch: 1, front: 'a', back: 'b' },
  { id: 'q2-1', kind: 'question', ch: 2, front: 'a', back: 'b' }, { id: 'g1', kind: 'term', ch: 0, front: 'a', back: 'b' },
  { id: 'f1', kind: 'formula', ch: 4, front: 'a', back: 'b' },
];
const t0 = new Date(2026, 9, 19, 10, 0);

test('a card nobody has seen is new; grading creates it and logs a fresh card', () => {
  let s = defaultState();
  assert.equal(stageOf(s, 'q1-1'), 'new');
  s = gradeCard(s, 'q1-1', Grade.Good, t0);
  assert.equal(stageOf(s, 'q1-1'), 'learning');
  assert.deepEqual(s.log['2026-10-19'], { reviews: 1, fresh: 1 });
  s = gradeCard(s, 'q1-1', Grade.Good, new Date(t0.getTime() + 3600e3));
  assert.deepEqual(s.log['2026-10-19'], { reviews: 2, fresh: 1 });
});

test('a card is due once its time has come', () => {
  let s = gradeCard(defaultState(), 'q1-1', Grade.Again, t0);
  assert.deepEqual(dueIds(s, cards, t0), []);
  assert.deepEqual(dueIds(s, cards, new Date(t0.getTime() + 20 * 60e3)), ['q1-1']);
  assert.deepEqual(dueIds(s, cards, new Date(t0.getTime() + 20 * 60e3), 'term'), []);
});

test('new cards: questions first, capped by the daily limit, and the limit counts what you started today', () => {
  let s = { ...defaultState(), settings: { newPerDay: 3, fontScale: 1 } };
  assert.deepEqual(newIds(s, cards, t0), ['q1-1', 'q1-2', 'q2-1']);
  assert.deepEqual(newIds(s, cards, t0, 'term'), ['g1']);
  s = gradeCard(s, 'q1-1', Grade.Good, t0);
  assert.deepEqual(newIds(s, cards, t0), ['q1-2', 'q2-1']);
  assert.deepEqual(newIds(s, cards, new Date(2026, 9, 20, 9, 0)), ['q1-2', 'q2-1', 'g1']);
});

test('stages follow stability and reviews, like Taalmaatje', () => {
  const s = { ...defaultState(), cards: {
    a: { due: 'x', stability: 2, reps: 1 }, b: { due: 'x', stability: 9, reps: 2 }, c: { due: 'x', stability: 30, reps: 5 }, d: { due: 'x', stability: 30, reps: 2 },
  } };
  assert.deepEqual(['a', 'b', 'c', 'd'].map((id) => stageOf(s, id)), ['learning', 'familiar', 'learned', 'familiar']);
  assert.deepEqual(stageCounts(s, [{ id: 'a' }, { id: 'c' }, { id: 'zz' }]), { new: 1, learning: 1, familiar: 0, learned: 1 });
});

test('quick check picks the least known questions of the chapters', () => {
  const s = gradeCard(defaultState(), 'q1-1', Grade.Easy, t0);
  assert.deepEqual(quickCheck(s, cards, [1], 3), ['q1-2', 'q1-1']);
  assert.deepEqual(quickCheck(s, cards, [1, 2], 2), ['q1-2', 'q2-1']);
  assert.deepEqual(quickCheck(s, cards, [9]), []);
});

test('the answer buttons show growing waits', () => {
  const p = previews(newCard(t0), t0);
  const waits = [Grade.Again, Grade.Hard, Grade.Good, Grade.Easy].map((g) => p[g]);
  assert.ok(waits[0] <= waits[1] && waits[1] <= waits[2] && waits[2] < waits[3], waits.join());
  assert.equal(formatWait(60e3), '1 min');
  assert.equal(formatWait(90 * 60e3), '2 h');
  assert.equal(formatWait(3 * 86400e3), '3 d');
  assert.equal(formatWait(70 * 86400e3), '2 mo');
});

test('streak counts back from today, or from yesterday if today is still empty', () => {
  const s = { ...defaultState(), log: { '2026-10-17': { reviews: 2, fresh: 0 }, '2026-10-18': { reviews: 1, fresh: 0 } } };
  assert.equal(streak(s, new Date(2026, 9, 19)), 2);
  assert.equal(streak(s, new Date(2026, 9, 18)), 2);
  assert.equal(streak(s, new Date(2026, 9, 21)), 0);
  const days = lastDays(s, 3, new Date(2026, 9, 19));
  assert.deepEqual(days.map((d) => d.reviews), [2, 1, 0]);
});
