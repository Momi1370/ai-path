import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockId, listBlocks, injectFarsi } from '../tools/i18n.mjs';
import { annotate } from '../tools/speech.mjs';
import { parseVideoNote, parseSessions } from '../tools/build-content.mjs';

const HTML = '<h4 id="h-a">A heading</h4>\n<p>First paragraph. It has two sentences.</p>\n<ul>\n<li>An item with <code>code</code> inside\n<ul>\n<li>A nested item</li>\n</ul>\n</li>\n</ul>\n<pre><code>skip me</code></pre>\n<div class="tbl"><table><tr><td>cell text</td></tr></table></div>\n<p>1</p>\n';

test('block ids depend on the English words only', () => {
  assert.equal(blockId('Hello   world'), blockId(' Hello world '));
  assert.notEqual(blockId('Hello world'), blockId('Hello worlds'));
});

test('the translatable blocks are headings, paragraphs and list items, not code, tables or bare numbers', () => {
  assert.deepEqual(listBlocks(HTML).map((b) => b.en), ['A heading', 'First paragraph. It has two sentences.', 'An item with code inside', 'A nested item']);
});

test('Farsi is placed after its block, inside list items, and nothing else changes', () => {
  const blocks = listBlocks(HTML), ids = blocks.map((b) => b.id);
  const fa = { [ids[0]]: 'عنوان', [ids[2]]: 'یک مورد با `code`' };
  const out = injectFarsi(HTML, ids, fa, (s) => s.replace(/`([^`]+)`/g, '<code>$1</code>'));
  assert.equal(out.translated, 2);
  assert.equal(out.total, 4);
  assert.match(out.html, /<h4 id="h-a">A heading<\/h4><div class="fa" lang="fa" dir="rtl">عنوان<\/div>/);
  assert.match(out.html, /<li>An item with <code>code<\/code> inside\s*<div class="fa" lang="fa" dir="rtl">یک مورد با <code>code<\/code><\/div><ul>/);
  assert.doesNotMatch(out.html, /skip me[^<]*<\/code><\/pre><div class="fa"/);
});

test('Farsi never changes the read-aloud script, and ids computed before the voice marks still line up', () => {
  const ids = listBlocks(HTML).map((b) => b.id);
  const spoken = annotate(HTML);
  const out = injectFarsi(spoken.html, ids, { [ids[1]]: 'پاراگراف اول' }, (s) => s);
  assert.equal(out.translated, 1);
  assert.equal(annotate(HTML).hash, spoken.hash);
  assert.throws(() => injectFarsi(spoken.html, ids.slice(1), {}, (s) => s), /blocks/);
});

test('a video page has a header and a body', () => {
  const note = parseVideoNote('---\nid: abcdefghijk\ntitle: A video\nsource: Someone\nduration: 5:00\nchapters: 4, 12\nbasis: notes\n---\n**Hi.** Body.\n');
  assert.deepEqual(note, { id: 'abcdefghijk', title: 'A video', source: 'Someone', duration: '5:00', chapters: [4, 12], basis: 'notes', md: '**Hi.** Body.' });
  assert.throws(() => parseVideoNote('---\nid: short\ntitle: x\n---\nbody'), /bad id/);
  assert.throws(() => parseVideoNote('no header'), /header/);
});

test('a video belongs to the first week that links it', () => {
  const week = (n, ids) => `# Week ${n} (1 - 7 Oct)\n` + ids.map((id) => `[v](https://www.youtube.com/watch?v=${id})`).join('\n');
  const s = parseSessions([week(1, ['aaaaaaaaaaa', 'bbbbbbbbbbb']), week(2, ['bbbbbbbbbbb', 'ccccccccccc'])]);
  assert.deepEqual(s.map((x) => x.ids), [['aaaaaaaaaaa', 'bbbbbbbbbbb'], ['ccccccccccc']]);
  assert.deepEqual(s.map((x) => x.n), [1, 2]);
});
