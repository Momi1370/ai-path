import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validate } from '../tools/validate.mjs';
import { FORBIDDEN } from '../tools/build-content.mjs';

test('the generated content is complete and consistent', async () => {
  assert.deepEqual(await validate(), []);
});

test('nothing private is in the published files', async () => {
  for (const f of ['week.json', 'cards.json', 'videos.json', 'toc.json']) {
    const text = await readFile(new URL(`../content/${f}`, import.meta.url), 'utf8');
    for (const re of FORBIDDEN) assert.doesNotMatch(text, re, `${f} matches ${re}`);
  }
});

test('the service worker lists every module the app imports', async () => {
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const { readdir } = await import('node:fs/promises');
  for (const dir of ['js', 'js/ui']) for (const f of await readdir(new URL(`../${dir}/`, import.meta.url))) if (f.endsWith('.js')) assert.ok(sw.includes(`'${dir}/${f}'`), `${dir}/${f} is missing from sw.js`);
});
