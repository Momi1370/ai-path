import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, migrate, createStore, buildBackup, parseBackup, localDate } from '../js/store.js';

test('a missing or odd save gives the default state', () => {
  assert.deepEqual(migrate(null), defaultState());
  assert.deepEqual(migrate({ version: 2 }), defaultState());
  assert.deepEqual(migrate('nope'), defaultState());
});

test('broken fields are reset, good ones kept', () => {
  const s = migrate({ version: 1, tasks: { a: true, b: 'yes' }, settings: { newPerDay: 7, fontScale: 1.2 }, cards: { x: { due: '2026-10-20T00:00:00.000Z' }, y: 5 }, scroll: { 'ch-1': 0.4, 'ch-2': 9 }, last: 4 });
  assert.deepEqual(s.tasks, { a: true });
  assert.equal(s.settings.newPerDay, 10);
  assert.equal(s.settings.fontScale, 1.2);
  assert.deepEqual(Object.keys(s.cards), ['x']);
  assert.deepEqual(s.scroll, { 'ch-1': 0.4 });
  assert.equal(s.last, '');
});

test('the store saves, loads and survives broken storage', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
  const store = createStore(storage);
  const s = { ...defaultState(), tasks: { t: true } };
  assert.equal(store.save(s), true);
  assert.deepEqual(store.load().tasks, { t: true });
  mem.set('aipath.v1', '{not json');
  assert.deepEqual(store.load(), defaultState());
  const blocked = createStore({ getItem() { throw new Error('no'); }, setItem() { throw new Error('no'); }, removeItem() {} });
  assert.equal(blocked.available, false);
  assert.equal(blocked.save(s), false);
  assert.deepEqual(blocked.load(), defaultState());
});

test('a backup round-trips and other files are refused', () => {
  const s = { ...defaultState(), watched: { abcdefghijk: true }, read: { 'ch-9': true } };
  assert.deepEqual(parseBackup(buildBackup(s)), s);
  assert.throws(() => parseBackup('{"app":"taalmaatje","version":1,"state":{}}'), /not an AI Path backup/);
  assert.throws(() => parseBackup('hello'), /not an AI Path backup/);
});

test('localDate is the local calendar day', () => {
  assert.equal(localDate(new Date(2026, 9, 5, 23, 59)), '2026-10-05');
});
