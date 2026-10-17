// Checks the generated content: `npm run validate`. Also used by test/content.test.mjs.
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const json = async (p) => JSON.parse(await readFile(root + p, 'utf8'));

export async function validate() {
  const problems = [];
  const toc = await json('content/toc.json'), cards = await json('content/cards.json'), videos = await json('content/videos.json');
  const week = await json('content/week.json'), pre = await json('content/precache.json'), search = await json('content/search.json');
  const chapters = toc.parts.flatMap((p) => p.chapters);
  if (chapters.length < 18) problems.push(`only ${chapters.length} chapters`);
  const ids = new Set();
  for (const c of cards) {
    if (ids.has(c.id)) problems.push(`duplicate card id ${c.id}`);
    ids.add(c.id);
    if (!c.front?.trim() || !c.back?.trim()) problems.push(`card ${c.id} has an empty side`);
    if (c.ch && !chapters.some((x) => x.n === c.ch)) problems.push(`card ${c.id} points at missing chapter ${c.ch}`);
  }
  for (const k of ['question', 'term', 'formula']) if (!cards.some((c) => c.kind === k)) problems.push(`no ${k} cards`);
  for (const ch of chapters) {
    const data = await json(`content/chapters/ch-${ch.n}.json`);
    if (!data.html.includes('Check yourself')) problems.push(`chapter ${ch.n} has no Check yourself`);
    for (const m of data.html.matchAll(/<img src="([^"]+)"/g)) await access(root + m[1]).catch(() => problems.push(`chapter ${ch.n}: missing image ${m[1]}`));
    for (const m of data.html.matchAll(/href="#\/notes\/(ch-\d+)/g)) if (!chapters.some((x) => `ch-${x.n}` === m[1])) problems.push(`chapter ${ch.n}: link to missing ${m[1]}`);
  }
  for (const v of videos.videos) if (!/^[\w-]{11}$/.test(v.id ?? '')) problems.push(`video ${v.n} has a bad id`);
  for (const d of week.days) {
    const tasks = [...d.html.matchAll(/data-task="([^"]+)"/g)].map((m) => m[1]);
    if (new Set(tasks).size !== tasks.length) problems.push(`${d.label}: duplicate task ids`);
    for (const m of d.html.matchAll(/#\/watch\/([\w-]{11})/g)) if (!videos.videos.some((v) => v.id === m[1])) problems.push(`${d.label}: video ${m[1]} is not in the video list`);
  }
  for (const f of pre.files) await access(root + f).catch(() => problems.push(`precache lists a missing file ${f}`));
  if (!search.length) problems.push('empty search index');
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = await validate();
  console.log(problems.length ? problems.join('\n') : 'Content OK');
  process.exit(problems.length ? 1 : 0);
}
