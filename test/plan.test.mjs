import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickDay, taskIds } from '../js/plan.js';

const days = [{ iso: '2026-10-19', html: '<li data-task="w4-a"></li>' }, { iso: '2026-10-20', html: '<li data-task="w4-b"></li><li data-task="w4-c"></li>' }, { iso: '2026-10-21', html: '' }];

test('opens on today, else the next day to come, else the last day', () => {
  assert.equal(pickDay(days, new Date(2026, 9, 20, 8)), 1);
  assert.equal(pickDay(days, new Date(2026, 9, 17, 8)), 0);
  assert.equal(pickDay(days, new Date(2026, 9, 30, 8)), 2);
  assert.equal(pickDay([], new Date()), -1);
});

test('lists every task id of the week', () => {
  assert.deepEqual(taskIds({ days }), ['w4-a', 'w4-b', 'w4-c']);
});
