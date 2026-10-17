import { test } from 'node:test';
import assert from 'node:assert/strict';
import { search, snippet } from '../js/search.js';

const index = [
  { ch: 9, id: 'a', title: '9.2 The sigmoid', text: 'The sigmoid squeezes any number into 0 to 1.' },
  { ch: 10, id: 'b', title: '10.1 Why not squared error', text: 'With a sigmoid the squared error cost is bumpy.' },
  { ch: 4, id: 'c', title: 'Linear regression', text: 'A straight line through data.' },
];

test('every word must match; titles rank first', () => {
  const hits = search(index, 'sigmoid');
  assert.deepEqual(hits.map((h) => h.entry.id), ['a', 'b']);
  assert.deepEqual(search(index, 'sigmoid bumpy').map((h) => h.entry.id), ['b']);
  assert.deepEqual(search(index, 'zzzz'), []);
  assert.deepEqual(search(index, 'a'), []);
});

test('the snippet is cut around the first hit', () => {
  const s = snippet('x'.repeat(200) + ' sigmoid ' + 'y'.repeat(200), 'sigmoid');
  assert.ok(s.includes('sigmoid') && s.startsWith('…') && s.endsWith('…') && s.length < 200);
});
