import { fsrs, generatorParameters, createEmptyCard, Rating } from '../vendor/ts-fsrs.mjs';

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

export const Grade = Object.freeze({
  Again: Rating.Again,
  Hard: Rating.Hard,
  Good: Rating.Good,
  Easy: Rating.Easy,
});

const plain = (card) => JSON.parse(JSON.stringify(card));

export function newCard(now = new Date()) {
  return plain(createEmptyCard(now));
}

export function review(card, grade, now = new Date()) {
  return plain(scheduler.next(card, now, grade).card);
}

export function isDue(card, now = new Date()) {
  return new Date(card.due).getTime() <= now.getTime();
}

export function isLearned(card) {
  return card.reps > 0;
}

// How long until each answer would bring the card back, in ms (for the labels on the answer buttons).
export function previews(card, now = new Date()) {
  const record = scheduler.repeat(card, now);
  return Object.fromEntries(Object.values(Grade).map((g) => [g, new Date(record[g].card.due).getTime() - now.getTime()]));
}
