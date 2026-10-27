import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slug, fnv, youtubeId, makeRenderer, parseNotes, parseChecks, parseVideos, parseGlossary, parseFormulas, parsePlan, isoOf, dropPrivate } from '../tools/build-content.mjs';

test('slug matches GitHub heading anchors', () => {
  assert.equal(slug('Chapter 9: Logistic regression, predicting yes or no'), 'chapter-9-logistic-regression-predicting-yes-or-no');
  assert.equal(slug('Appendix A: Formula sheet'), 'appendix-a-formula-sheet');
});

test('YouTube ids come out of watch links, short links and playlist links', () => {
  assert.equal(youtubeId('https://www.youtube.com/watch?v=Kdsp6soqA7o'), 'Kdsp6soqA7o');
  assert.equal(youtubeId('https://www.youtube.com/watch?v=p-ltr1C7u2o&list=PL123&index=31'), 'p-ltr1C7u2o');
  assert.equal(youtubeId('https://youtu.be/jXg0vU0y1ak?list=PL1'), 'jXg0vU0y1ak');
  assert.equal(youtubeId('https://example.com/watch?v=Kdsp6soqA7o'), null);
});

test('renderer: math becomes MathML, videos open in the app, other links open outside, tables scroll', () => {
  const titles = new Map();
  const r = makeRenderer({ routeOf: (s) => (s === 'chapter-1-x' ? '#/notes/ch-1' : null), videoTitles: titles });
  const html = r.html('```math\nx^2\n```\n\nSee [the video](https://www.youtube.com/watch?v=Kdsp6soqA7o), [docs](https://example.com), [Chapter 1](#chapter-1-x), [gone](#nowhere).\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n');
  assert.match(html, /<div class="math"><span class="katex"><math/);
  assert.match(html, /<a class="vlink" href="#\/watch\/Kdsp6soqA7o">the video<\/a>/);
  assert.match(html, /<a href="https:\/\/example.com" target="_blank" rel="noopener">docs<\/a>/);
  assert.match(html, /<a href="#\/notes\/ch-1">Chapter 1<\/a>/);
  assert.doesNotMatch(html, /href="#nowhere"/);
  assert.match(html, /<div class="tbl"><table>/);
  assert.equal(titles.get('Kdsp6soqA7o'), 'the video');
});

const NOTES = `# Book

## Part A: The big picture

### Chapter 1: What it is

Text.

**Check yourself**

- [ ] Why is the sky blue?
- [ ] What is 2 + 2?

*Answers.* (1) Scattering. (2) 4 (as in 2 + 2 = 4).

## Appendix B: Video index

| # | Video | Layer | Used in chapters | Status |
| --- | --- | --- | --- | --- |
| 1 | [Big video](https://www.youtube.com/watch?v=BUTjcAjfMgY) (Shaw Talebi, 34:50) | Big picture | 1, 2 | Watched |
| 3 | [Ng week 1](https://www.youtube.com/watch?v=vStJoetOxJg&list=PL1) (2 h 27 min) | Details | 1 | Next |

## Appendix E: Glossary

| Term | In one plain line |
| --- | --- |
| Feature (x) | An input |
| a\\_b | with \\| bar |
`;

test('notes are split into parts, chapters and appendices', () => {
  const n = parseNotes(NOTES);
  assert.deepEqual(n.chapters.map((c) => [c.n, c.title, c.part, c.partName]), [[1, 'What it is', 'A', 'The big picture']]);
  assert.deepEqual(n.appendices.map((a) => a.id), ['b', 'e']);
});

test('check-yourself questions pair with their answers', () => {
  const { cards, warn } = parseChecks(parseNotes(NOTES).chapters[0]);
  assert.equal(warn, '');
  assert.deepEqual(cards.map((c) => [c.id, c.front, c.back]), [['q1-1', 'Why is the sky blue?', 'Scattering.'], ['q1-2', 'What is 2 + 2?', '4 (as in 2 + 2 = 4).']]);
  assert.match(parseChecks({ n: 2, md: 'no block' }).warn, /chapter 2/);
});

test('the video index and glossary parse', () => {
  const n = parseNotes(NOTES);
  const v = parseVideos(n.appendices[0].md);
  assert.deepEqual(v.map((x) => [x.n, x.id, x.source, x.duration, x.chapters, x.status]), [[1, 'BUTjcAjfMgY', 'Shaw Talebi', '34:50', [1, 2], 'Watched'], [3, 'vStJoetOxJg', '', '2 h 27 min', [1], 'Next']]);
  assert.deepEqual(parseGlossary(n.appendices[1].md).map((g) => [g.front, g.back]), [['Feature (x)', 'An input'], ['a_b', 'with | bar']]);
  assert.deepEqual(parseFormulas('| Name | Formula | Chapter |\n| --- | --- | --- |\n| Z-score | (x - mean) / sd | 8, 15 |')[0], { id: 'f1', kind: 'formula', ch: 8, front: 'Z-score', back: '(x - mean) / sd (Chapter 8, 15)' });
});

const PLAN = `# This week in detail: week 4 (19 - 25 Oct)

Intro.

**Where week 3 ended:** private story about JobSpark.

**The videos:** Ng ended at #41. See [page](https://example.com).

## Monday 19 Oct

**10:00-12:00 · ML 1 of 3: measuring a model** (4 videos, 41 minutes)

- [ ] 10:00-10:25, hands first on paper: the cost.
- [ ] 10:25-10:45: read Chapter 12 of Course notes. Then watch:
- [ ] Open the page on your free audit (this is the payment decision in issue #24).

**13:00-15:40 · Build: gold questions**

- [ ] Do the thing about MDDP.

## Thursday 22 Oct (optional)

**15:00-16:00, after the MDDP lecture:** nothing public.

## Week 4 is done when

- [ ] **ML:** the quiz passed.
- [ ] **Build:** secret.
- [ ] **Course 2:** week 1 opens.
`;

test('only the ML sessions of the plan are published, without clock times or private references', () => {
  const p = parsePlan(PLAN);
  assert.equal(p.n, 4);
  assert.equal(p.dates, '19 - 25 Oct');
  assert.deepEqual(p.days.map((d) => [d.key, d.label, d.iso]), [['Mon', 'Monday 19 Oct', '2026-10-19']]);
  const md = p.days[0].md;
  assert.match(md, /### \*\*ML 1 of 3: measuring a model\*\* \(4 videos, 41 minutes\)/);
  assert.match(md, /- \[ \] Hands first on paper: the cost\./);
  assert.match(md, /Read Chapter 12 of the notes/);
  assert.doesNotMatch(md, /MDDP|issue #|13:00|10:00|gold questions|Build/);
  assert.match(p.videosPara, /^\*\*The videos:\*\*/);
  assert.equal(p.doneItems.length, 2);
  assert.ok(p.doneItems[0].startsWith('- [ ] **ML:**') && p.doneItems[1].startsWith('- [ ] **Course 2:**'));
});

test('dates become ISO days', () => {
  assert.equal(isoOf('Monday 19 Oct'), '2026-10-19');
  assert.equal(isoOf('Sunday 1 Nov'), '2026-11-01');
  assert.equal(isoOf('nonsense'), null);
  assert.equal(fnv('abc'), fnv('abc'));
  assert.notEqual(fnv('abc'), fnv('abd'));
});

test('private logistics never reach the app', () => {
  const para = '**The videos:** Course 2 is 17 videos. Open the page: if it needs payment, tell me on Sunday (issue #24). Then watch them.';
  assert.equal(dropPrivate(para), '**The videos:** Course 2 is 17 videos. Then watch them.');
  assert.equal(dropPrivate('- [ ] **Course 2:** week 1 opens (or the payment question is on the list).'), '- [ ] **Course 2:** week 1 opens.');
});
