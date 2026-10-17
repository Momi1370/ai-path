import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSpeech, splitSentences, annotate } from '../tools/speech.mjs';
import { lastAtOrBefore } from '../js/timing.js';

test('symbols are spoken as words', () => {
  assert.equal(toSpeech('z = w . x + b'), 'z equals w dot x plus b');
  assert.equal(toSpeech('0.029 x amount - 5'), '0.029 times amount minus 5');
  assert.equal(toSpeech('50% of y_true [1, 2] -> done, e.g. this'), '50 percent of y true 1, 2 to done, for example this');
  assert.equal(toSpeech('see https://example.com now'), 'see now');
  assert.equal(toSpeech('x^2 and e^3'), 'x squared and e to the power of 3');
  assert.equal(toSpeech('a / b'), 'a divided by b');
});

test('sentences split after . ! ? but not at abbreviations or decimals', () => {
  const split = (t) => splitSentences(t.split(' ')).map((s) => s.join(' '));
  assert.deepEqual(split('It is 0.5 here. Next one! Third?'), ['It is 0.5 here.', 'Next one!', 'Third?']);
  assert.deepEqual(split('Use e.g. a line. Done.'), ['Use e.g. a line.', 'Done.']);
  assert.deepEqual(split('One sentence only.'), ['One sentence only.']);
});

test('annotate marks spoken words and skips code, formulas, answers and what follows Check yourself', () => {
  const r = annotate('<h3 id="a">Title here</h3><p>One two. Three <code>four</code>, five.</p><pre><code>skip</code></pre><div class="math"><math></math></div><details class="answers"><p>hidden answer</p></details><p><strong>Check yourself</strong></p><ul><li>not spoken</li></ul>');
  assert.deepEqual(r.sentences.map((s) => [s.text, s.w, s.gap]), [['Title here', 2, 'heading'], ['One two.', 2, 'sentence'], ['Three four, five.', 3, 'block']]);
  assert.equal((r.html.match(/data-s=/g) ?? []).length, 7 + 1, 'one extra span for the comma that follows the code word');
  assert.match(r.html, /<code><span data-s="2" data-w="1">four<\/span><\/code><span data-s="2" data-w="1">,<\/span>/);
  assert.doesNotMatch(r.html, /data-s="[^"]*">(skip|hidden|answer|not)/);
  assert.match(r.hash, /^[0-9a-f]{8}$/);
  assert.equal(annotate('<p>Same words.</p>').hash, annotate('<p>Same words.</p>').hash);
  assert.notEqual(annotate('<p>Same words.</p>').hash, annotate('<p>Other words.</p>').hash);
});

test('the time of each sentence is found by binary search', () => {
  const starts = [0.15, 5, 9.5, 20];
  assert.equal(lastAtOrBefore(starts, 0), 0);
  assert.equal(lastAtOrBefore(starts, 5), 1);
  assert.equal(lastAtOrBefore(starts, 19.9), 2);
  assert.equal(lastAtOrBefore(starts, 99), 3);
});
