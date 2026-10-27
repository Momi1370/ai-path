// Turns the course notes and the weekly plan (markdown) into the app's content files.
// Usage: node tools/build-content.mjs [course-notes.md] [this-week.md] [assets-dir]
// Defaults point at the sibling repo ../AI-Engineering-Plan-2026-27. Output goes to content/ and assets/.
// Only the learning part of the plan is published (ML sessions); personal details are filtered out and
// the build fails if a forbidden word survives.
import { mkdir, readFile, writeFile, copyFile, readdir, rm } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import katex from 'katex/dist/katex.mjs';
import { annotate } from './speech.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PLAN_REPO = join(ROOT, '..', 'AI-Engineering-Plan-2026-27');
const [notesPath = join(PLAN_REPO, 'notes/course-notes.md'), planPath = join(PLAN_REPO, 'plan/this-week.md'), assetsDir = join(PLAN_REPO, 'assets')] = process.argv.slice(2);
const PLAN_YEAR = 2026;
// Private words (for example the owner's own name) live in tools/forbidden.local.txt, one per line.
// That file is git-ignored on purpose, so the words themselves never reach the public repo.
const LOCAL_WORDS_FILE = new URL('./forbidden.local.txt', import.meta.url);
const escapeRe = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
if (!existsSync(LOCAL_WORDS_FILE)) console.warn('ai-path: tools/forbidden.local.txt not found, so private words are NOT being checked.');
const LOCAL_FORBIDDEN = existsSync(LOCAL_WORDS_FILE)
  ? readFileSync(LOCAL_WORDS_FILE, 'utf8').split('\n').map((w) => w.trim()).filter((w) => w && !w.startsWith('#')).map((w) => new RegExp(escapeRe(w), 'i'))
  : [];
// Never in anything published, and the extra words never in the weekly plan (the notes may use them as examples).
export const FORBIDDEN = [/MDDP/i, /retake/i, ...LOCAL_FORBIDDEN, /issue #\d/i, /JobSpark/i, /loan-ops-copilot/i];
export const FORBIDDEN_PLAN = [/budget/i, /payment/i, /gmail/i, /calendar/i, /\bEUR\b/, /\bX scan\b/i];

// ---------- helpers ----------
export const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
export const fnv = (s) => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const unescapeMd = (s) => s.replace(/\\([\\`*_{}[\]()#+\-.!|<>~$])/g, '$1');
const plainText = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<math[\s\S]*?<\/math>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
export const youtubeId = (url) => (/(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/)([\w-]{11})/.exec(url) ?? [])[1] ?? null;

// ---------- markdown renderer ----------
export function makeRenderer({ routeOf = () => null, videoTitles = new Map() } = {}) {
  const used = new Set();
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      heading(text, level) {
        let id = `h-${slug(text)}`;
        while (used.has(id)) id += '-x';
        used.add(id);
        return `<h${level} id="${id}">${text}</h${level}>\n`;
      },
      link(href, title, text) {
        const vid = youtubeId(href);
        if (vid) {
          if (!videoTitles.has(vid) && text && !/^https?:/.test(text)) videoTitles.set(vid, text);
          return `<a class="vlink" href="#/watch/${vid}">${text}</a>`;
        }
        if (href.startsWith('#')) {
          const route = routeOf(href.slice(1));
          return route ? `<a href="${route}">${text}</a>` : text;
        }
        return `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
      },
      image(href, title, text) {
        return `<img src="${href.replace(/^(\.\.\/)+/, '')}" alt="${text.replace(/"/g, '&quot;')}" loading="lazy">`;
      },
      table(header, body) { return `<div class="tbl"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>\n`; },
    },
  });
  return {
    resetIds: () => used.clear(),
    html(md) {
      const maths = [];
      const withTokens = md.replace(/```math\n([\s\S]*?)\n```/g, (_, tex) => `\n@@MATH${maths.push(tex) - 1}@@\n`);
      let html = marked.parse(withTokens);
      html = html.replace(/<p>@@MATH(\d+)@@<\/p>/g, (_, i) => `<div class="math">${katex.renderToString(maths[+i], { output: 'mathml', displayMode: true, throwOnError: true })}</div>`);
      return html.replace(/<input disabled="" type="checkbox">\s*/g, '');
    },
    inline: (md) => marked.parseInline(md),
  };
}

// Split markdown into [{level, title, lines}] by headings of one level, ignoring fenced code.
export function splitByHeading(lines, level) {
  const marker = '#'.repeat(level) + ' ';
  const out = [{ title: null, lines: [] }];
  let fence = false;
  for (const line of lines) {
    if (/^```/.test(line)) fence = !fence;
    if (!fence && line.startsWith(marker)) out.push({ title: line.slice(marker.length).trim(), lines: [] });
    else out.at(-1).lines.push(line);
  }
  return out;
}

const tableRows = (lines) => lines.filter((l) => /^\|.*\|$/.test(l.trim())).slice(2).map((l) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim()));

// ---------- notes ----------
export function parseNotes(md) {
  const lines = md.split('\n');
  const parts = splitByHeading(lines, 2);
  const chapters = [], appendices = [];
  let partLetter = '', partName = '';
  for (const part of parts) {
    if (!part.title) continue;
    const pm = /^Part ([A-F]): (.*)/.exec(part.title);
    if (pm) { partLetter = pm[1]; partName = pm[2]; }
    if (pm) {
      for (const ch of splitByHeading(part.lines, 3)) {
        const cm = ch.title && /^Chapter (\d+): (.*)/.exec(ch.title);
        if (cm) chapters.push({ n: +cm[1], title: cm[2], part: partLetter, partName, md: ch.lines.join('\n').trim() });
      }
    } else if (/^Appendix ([A-E]): (.*)/.test(part.title)) {
      const am = /^Appendix ([A-E]): (.*)/.exec(part.title);
      appendices.push({ id: am[1].toLowerCase(), title: am[2], md: part.lines.join('\n').trim() });
    }
  }
  return { chapters, appendices };
}

export function parseChecks(chapter) {
  const m = /\*\*Check yourself\*\*\n\n((?:- \[ \] .*\n?)+)\n+\*Answers\.\* ([^\n]*)/.exec(chapter.md);
  if (!m) return { cards: [], warn: `chapter ${chapter.n}: no Check yourself block` };
  const qs = m[1].trim().split('\n').map((q) => q.replace(/^- \[ \] /, '').trim());
  const parts = (' ' + m[2]).split(/\s\((\d+)\)\s/);
  const answers = {};
  for (let i = 1; i < parts.length - 1; i += 2) answers[+parts[i]] = parts[i + 1].trim();
  const cards = [], warn = [];
  qs.forEach((q, i) => {
    if (!answers[i + 1]) warn.push(`chapter ${chapter.n} question ${i + 1}: no answer found`);
    else cards.push({ id: `q${chapter.n}-${i + 1}`, kind: 'question', ch: chapter.n, front: q, back: answers[i + 1] });
  });
  return { cards, warn: warn.join('; ') };
}

export function parseVideos(md) {
  return tableRows(md.split('\n')).map((c) => {
    const lm = /^\[(.+?)\]\((.+?)\)\s*(?:\((.+?)\))?/.exec(c[1]);
    if (!lm) return null;
    const meta = lm[3] ?? '';
    const dur = /(\d+:\d\d|\d+ h \d+ min|\d+ min)\s*$/.exec(meta)?.[1] ?? '';
    return {
      n: +c[0], id: youtubeId(lm[2]), title: lm[1], source: meta.replace(/,?\s*(\d+:\d\d|\d+ h \d+ min|\d+ min)\s*$/, '').trim(), duration: dur,
      layer: c[2], chapters: c[3].split(',').map((x) => +x.trim()).filter(Boolean), status: c[4],
    };
  }).filter((v) => v && /^[\w-]{11}$/.test(v.id ?? '')); // rows that are not YouTube videos (a course page) stay in the notes only
}

export function parseGlossary(md) {
  return tableRows(md.split('\n')).map((c, i) => ({ id: `g${i + 1}`, kind: 'term', ch: 0, front: unescapeMd(c[0]), back: unescapeMd(c[1]) }));
}

export function parseFormulas(md) {
  return tableRows(md.split('\n')).map((c, i) => ({ id: `f${i + 1}`, kind: 'formula', ch: parseInt(c[2], 10) || 0, front: unescapeMd(c[0]), back: unescapeMd(c[1]) + (c[2] ? ` (Chapter ${c[2]})` : '') }));
}

// ---------- plan ----------
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
export function isoOf(label) {
  const m = /(\d{1,2}) (\w{3})/.exec(label);
  if (!m || !(m[2] in MONTHS)) return null;
  return new Date(Date.UTC(PLAN_YEAR, MONTHS[m[2]], +m[1])).toISOString().slice(0, 10);
}
const stripTimes = (s) => s
  .replace(/^\*\*\d\d:\d\d-\d\d:\d\d · /gm, '**')
  .replace(/^(\s*- \[ \] )\d\d:\d\d-\d\d:\d\d[,:]\s*(\S)/gm, (m, lead, c) => lead + c.toUpperCase())
  .replace(/\s*\([^)]*issue #\d+[^)]*\)/g, '')
  .replace(/ without payment\. If it does not, tell me on Sunday\./g, ' for free.')
  .replace(/ without payment\b/g, '')
  .replace(/\s*\(see above\)/g, '')
  .replace(/ of Course notes/g, ' of the notes');
// private logistics (payment, issue numbers, notes to the owner) never reach the app: drop those sentences and brackets
export const dropPrivate = (s) => s
  .replace(/\s*\([^)]*(?:payment|issue #\d+)[^)]*\)/gi, '')
  .split(/(?<=\.)\s+/).filter((x) => !/payment|tell me on Sunday/i.test(x)).join(' ');
// "Chapter 12" in the plan becomes a link to that chapter in the app
const linkChapters = (html) => html.replace(/(>[^<]*?)\bChapter (\d+)\b/g, (m, pre, n) => `${pre}<a href="#/notes/ch-${n}">Chapter ${n}</a>`);

export function parsePlan(md) {
  const lines = md.split('\n');
  const title = /^# (.*)/m.exec(md)?.[1] ?? '';
  const wm = /week (\d+) \(([^)]+)\)/.exec(title);
  const sections = splitByHeading(lines, 2); // the repo copy of the plan is one heading level up from the doc
  const intro = sections[0].lines.join('\n');
  const videosPara = dropPrivate(/^\*\*The videos:\*\*.*$/m.exec(intro)?.[0] ?? '').replace(/ of Course notes/g, ' of the notes');
  const days = [];
  for (const s of sections.slice(1)) {
    const dm = /^(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day (\d+ \w{3})/.exec(s.title ?? '');
    if (!dm) continue;
    // keep only the ML blocks: a block starts at a bold line like "**10:00-12:00 · ML 1 of 3 ..."
    const blocks = [];
    for (const line of s.lines) {
      if (/^\*\*\d\d:\d\d-\d\d:\d\d · /.test(line)) blocks.push({ ml: /· ML /.test(line), lines: [line] });
      else blocks.at(-1)?.lines.push(line);
    }
    const ml = blocks.filter((b) => b.ml).map((b) => stripTimes(b.lines.join('\n')).replace(/^(\*\*.*?\*\*)/, '### $1')).join('\n\n');
    if (ml) days.push({ key: dm[1].slice(0, 3), label: `${dm[1]}day ${dm[2]}`, iso: isoOf(dm[2]), md: ml });
  }
  const done = sections.find((s) => /is done when/.test(s.title ?? ''));
  const doneItems = (done?.lines ?? []).filter((l) => /^- \[ \] \*\*(ML|Course 2):/.test(l)).map(dropPrivate);
  return { n: wm ? +wm[1] : 0, dates: wm?.[2] ?? '', videosPara, days, doneItems };
}

// ---------- build ----------
async function main() {
  const out = (p) => join(ROOT, p);
  await rm(out('content'), { recursive: true, force: true });
  await mkdir(out('content/chapters'), { recursive: true });
  await rm(out('tools/tts/scripts'), { recursive: true, force: true });
  await mkdir(out('tools/tts/scripts'), { recursive: true });
  await mkdir(out('assets/notes'), { recursive: true });

  const notes = parseNotes(await readFile(notesPath, 'utf8'));
  const routeBySlug = new Map();
  for (const c of notes.chapters) routeBySlug.set(slug(`Chapter ${c.n}: ${c.title}`), `#/notes/ch-${c.n}`);
  for (const a of notes.appendices) routeBySlug.set(slug(`Appendix ${a.id.toUpperCase()}: ${a.title}`), a.id === 'b' ? '#/watch' : `#/notes/${a.id}`);
  const videoTitles = new Map();
  const r = makeRenderer({ routeOf: (s) => routeBySlug.get(s), videoTitles });

  const cards = [], warnings = [], search = [], toc = { parts: [], appendices: [] };
  for (const c of notes.chapters) {
    r.resetIds();
    const html = r.html(c.md);
    const withAnswers = html.replace(/<p><em>Answers\.<\/em>([\s\S]*?)<\/p>/, '<details class="answers"><summary>Show answers</summary><p>$1</p></details>');
    const words = plainText(html).split(' ').length;
    const sections = [...withAnswers.matchAll(/<h4 id="([^"]+)">([^<]*)<\/h4>/g)].map((m) => ({ id: m[1], title: m[2] }));
    // every spoken word gets a data-s / data-w mark (for the read-aloud highlight); the script goes to the voice generator
    const spoken = annotate(withAnswers);
    await writeFile(out(`content/chapters/ch-${c.n}.json`), JSON.stringify({ n: c.n, title: c.title, part: c.part, partName: c.partName, words, minutes: Math.max(1, Math.round(words / 200)), sections, speechHash: spoken.hash, html: spoken.html }));
    await writeFile(out(`tools/tts/scripts/ch-${c.n}.json`), JSON.stringify({ n: c.n, title: c.title, hash: spoken.hash, sentences: spoken.sentences }, null, 0) + '\n');
    let part = toc.parts.find((p) => p.letter === c.part);
    if (!part) toc.parts.push(part = { letter: c.part, name: c.partName, chapters: [] });
    part.chapters.push({ n: c.n, title: c.title, minutes: Math.max(1, Math.round(words / 200)) });
    // search: split the chapter html at h4 headings
    const pieces = withAnswers.split(/(?=<h4 id=)/);
    for (const p of pieces) {
      const hm = /^<h4 id="([^"]+)">([^<]*)<\/h4>/.exec(p);
      search.push({ ch: c.n, id: hm?.[1] ?? '', title: hm ? hm[2] : c.title, text: plainText(p).slice(0, 4000) });
    }
    const checks = parseChecks(c);
    if (checks.warn) warnings.push(checks.warn);
    cards.push(...checks.cards);
  }
  for (const a of notes.appendices) {
    if (a.id === 'b') continue;
    if (a.id === 'e') { cards.push(...parseGlossary(a.md)); continue; }
    if (a.id === 'a') cards.push(...parseFormulas(a.md));
    r.resetIds();
    const html = r.html(a.md);
    await writeFile(out(`content/chapters/${a.id}.json`), JSON.stringify({ id: a.id, title: a.title, html }));
    toc.appendices.push({ id: a.id, title: a.title });
    search.push({ ch: 0, id: '', title: `Appendix ${a.id.toUpperCase()}: ${a.title}`, text: plainText(html).slice(0, 4000), page: a.id });
  }
  toc.appendices.push({ id: 'e', title: 'Glossary' });
  for (const g of cards.filter((c) => c.kind === 'term')) search.push({ ch: 0, id: '', title: g.front, text: g.back, page: 'e' });

  // render card text (inline markdown only)
  for (const c of cards) { c.front = r.inline(c.front); c.back = r.inline(c.back); }
  const videos = parseVideos(notes.appendices.find((a) => a.id === 'b').md);

  // plan
  const plan = parsePlan(await readFile(planPath, 'utf8'));
  const pr = makeRenderer({ videoTitles });
  const planDays = plan.days.map((d) => {
    const taskMd = d.md.replace(/^- \[ \] /gm, '- ');
    const html = pr.html(taskMd);
    const marked = d.md.split('\n').filter((l) => /^- \[ \] /.test(l)).map((l) => plainText(pr.inline(l.replace(/^- \[ \] /, ''))));
    const tasked = html.replace(/<li>([\s\S]*?)<\/li>/g, (m, inner) => {
      const text = plainText(inner);
      return marked.includes(text) ? `<li class="task" data-task="w${plan.n}-${fnv(d.key + text)}"><button class="check" role="checkbox" aria-checked="false" aria-label="Done"></button><span>${inner}</span></li>` : m;
    });
    return { key: d.key, label: d.label, iso: d.iso, html: linkChapters(tasked) };
  });
  const week = {
    n: plan.n, dates: plan.dates,
    introHtml: plan.videosPara ? pr.inline(plan.videosPara.replace(/^\*\*The videos:\*\*\s*/, '')) : '',
    days: planDays,
    doneHtml: pr.html(plan.doneItems.map((l) => l.replace(/^- \[ \] /, '- ')).join('\n')),
  };
  await writeFile(out('content/week.json'), JSON.stringify(week));

  // videos: the index plus anything linked from this week's plan that is not in it
  const known = new Set(videos.map((v) => v.id));
  const extra = [];
  for (const d of plan.days) for (const m of d.md.matchAll(/\[([^\]]+)\]\((https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}[^)]*)\)/g)) {
    const id = youtubeId(m[2]);
    if (id && !known.has(id)) { known.add(id); extra.push({ n: 100 + extra.length, id, title: m[1], source: '', duration: '', layer: 'This week', chapters: [], status: 'Next' }); }
  }
  const titles = Object.fromEntries([...videoTitles].map(([k, v]) => [k, v]));
  await writeFile(out('content/videos.json'), JSON.stringify({ videos: videos.concat(extra), titles }));
  await writeFile(out('content/cards.json'), JSON.stringify(cards));
  await writeFile(out('content/toc.json'), JSON.stringify(toc));
  await writeFile(out('content/search.json'), JSON.stringify(search));

  // assets used by the notes
  const imgs = new Set();
  for (const c of notes.chapters) for (const m of c.md.matchAll(/!\[[^\]]*\]\(((?:\.\.\/)*assets\/[^)]+)\)/g)) imgs.add(m[1].replace(/^(\.\.\/)+assets\//, ''));
  for (const i of imgs) { await mkdir(dirname(out(`assets/${i}`)), { recursive: true }); await copyFile(join(assetsDir, i), out(`assets/${i}`)); }

  // forbidden words must not appear in anything published
  const bad = [];
  for (const f of await readdir(out('content'), { recursive: true })) {
    if (!f.endsWith('.json')) continue;
    const text = await readFile(out(`content/${f}`), 'utf8');
    for (const re of f === 'week.json' ? [...FORBIDDEN, ...FORBIDDEN_PLAN] : FORBIDDEN) if (re.test(text)) bad.push(`${f}: ${re}`);
  }
  if (bad.length) { console.error('Forbidden words in published content:\n' + bad.join('\n')); process.exit(1); }

  // precache list for the service worker
  const files = [];
  for (const f of await readdir(out('content'), { recursive: true })) if (f.endsWith('.json')) files.push(`content/${f}`);
  for (const f of await readdir(out('assets'), { recursive: true })) if (/\.(png|svg)$/.test(f)) files.push(`assets/${f}`);
  files.sort();
  const hash = createHash('sha1');
  for (const f of files) hash.update(await readFile(out(f)));
  await writeFile(out('content/precache.json'), JSON.stringify({ version: hash.digest('hex').slice(0, 10), files: files.filter((f) => f !== 'content/precache.json') }));

  console.log(`${notes.chapters.length} chapters, ${cards.length} cards (${cards.filter((c) => c.kind === 'term').length} terms, ${cards.filter((c) => c.kind === 'question').length} questions, ${cards.filter((c) => c.kind === 'formula').length} formulas), ${videos.length + extra.length} videos, week ${week.n} with ${week.days.length} ML days, ${imgs.size} images`);
  for (const w of warnings) console.warn('warning:', w);
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
