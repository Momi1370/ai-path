// Farsi explanations. Every paragraph, list item and heading of a page has a block id made from its English text,
// so a translation in i18n/fa/<scope>.json belongs to that exact sentence: when the English changes, the old
// translation stops matching (it is listed as missing, never shown as if it were current).
//
//   node tools/i18n.mjs status             coverage per scope
//   node tools/i18n.mjs todo <scope> [n]   the next n untranslated blocks, as JSON ({id, en})
//   node tools/i18n.mjs add <scope>        merge {"id": "Farsi text"} from stdin into i18n/fa/<scope>.json
//
// Scopes: ch-1 ... ch-18 (chapters), cards (glossary terms and review questions), videos (the text pages of the videos).
// `npm run build` writes i18n/en-blocks.json (git-ignored), which these commands read.
import { parseFragment, serialize, defaultTreeAdapter as T } from 'parse5';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HTML = 'http://www.w3.org/1999/xhtml';
const BLOCK = new Set(['h3', 'h4', 'p', 'li']);
const NESTING = new Set(['ul', 'ol', 'div', 'blockquote', 'details', 'section', 'table']);
const SKIP = new Set(['pre', 'table', 'math', 'script', 'style', 'svg', 'img', 'summary']);

export const fnv = (s) => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
export const normalize = (s) => s.replace(/\s+/g, ' ').trim();
export const blockId = (text) => fnv(normalize(text));

const hasClass = (el, re) => (el.attrs ?? []).some((a) => a.name === 'class' && re.test(a.value));

// The text a block owns: its own words, not those of nested lists or blocks.
function ownText(el) {
  let out = '';
  const gather = (n) => {
    for (const c of n.childNodes) {
      if (c.nodeName === '#text') out += c.value;
      else if (c.tagName && !SKIP.has(c.tagName) && !BLOCK.has(c.tagName) && !NESTING.has(c.tagName) && c.tagName !== 'ul' && c.tagName !== 'ol') gather(c);
    }
  };
  gather(el);
  return normalize(out);
}

// The translatable blocks of a page, in reading order: [{ el, text, id }].
function collect(frag) {
  const out = [];
  const walk = (n) => {
    for (const c of n.childNodes) {
      if (!c.tagName || SKIP.has(c.tagName) || hasClass(c, /\b(fa|math|tbl)\b/)) continue;
      if (BLOCK.has(c.tagName)) {
        const text = ownText(c);
        if ((text.match(/\p{L}/gu) ?? []).length >= 2) out.push({ el: c, text, id: blockId(text) });
      }
      walk(c);
    }
  };
  walk(frag);
  return out;
}

export const listBlocks = (html) => collect(parseFragment(html)).map(({ text, id }) => ({ id, en: text }));

// Puts the Farsi after each block that has one. `ids` are the block ids computed on the page BEFORE the read-aloud
// marks were added, in the same order (those marks split words into spans, which the ids must not see).
export function injectFarsi(html, ids, dict, renderInline) {
  const frag = parseFragment(html);
  const blocks = collect(frag);
  if (blocks.length !== ids.length) throw new Error(`injectFarsi: ${blocks.length} blocks, expected ${ids.length}`);
  let used = 0;
  blocks.forEach(({ el }, i) => {
    const fa = dict[ids[i]];
    if (!fa) return;
    used++;
    const box = T.createElement('div', HTML, [{ name: 'class', value: 'fa' }, { name: 'lang', value: 'fa' }, { name: 'dir', value: 'rtl' }]);
    for (const n of parseFragment(renderInline(fa)).childNodes) T.appendChild(box, n);
    if (el.tagName === 'li') {
      const nested = el.childNodes.find((c) => c.tagName === 'ul' || c.tagName === 'ol');
      if (nested) T.insertBefore(el, box, nested); else T.appendChild(el, box);
    } else {
      const parent = el.parentNode, at = parent.childNodes.indexOf(el);
      const next = parent.childNodes[at + 1];
      if (next) T.insertBefore(parent, box, next); else T.appendChild(parent, box);
    }
  });
  return { html: serialize(frag), total: blocks.length, translated: used };
}

// ---------- translation files ----------
const faPath = (scope) => `${ROOT}i18n/fa/${scope}.json`;

export async function loadFa(scope) {
  if (!existsSync(faPath(scope))) return {};
  const raw = JSON.parse(await readFile(faPath(scope), 'utf8'));
  return Object.fromEntries(Object.entries(raw).map(([id, v]) => [id, v?.fa ?? v]));
}

async function readBlocks() {
  const p = `${ROOT}i18n/en-blocks.json`;
  if (!existsSync(p)) throw new Error('i18n/en-blocks.json is missing: run `npm run build` first');
  return JSON.parse(await readFile(p, 'utf8'));
}

async function main([cmd, scope, arg]) {
  const all = await readBlocks();
  if (cmd === 'status') {
    let t = 0, d = 0;
    for (const [s, list] of Object.entries(all)) {
      const dict = await loadFa(s);
      const have = list.filter((b) => dict[b.id]).length;
      const orphans = Object.keys(dict).filter((id) => !list.some((b) => b.id === id)).length;
      t += list.length; d += have;
      console.log(`${s.padEnd(8)} ${String(have).padStart(4)} / ${String(list.length).padEnd(4)} ${have === list.length ? 'done' : ''}${orphans ? `  (${orphans} old translations no longer match)` : ''}`);
    }
    console.log(`total    ${d} / ${t}`);
  } else if (cmd === 'todo') {
    const dict = await loadFa(scope);
    const list = (all[scope] ?? []).filter((b) => !dict[b.id]).slice(0, +arg || 20);
    for (const b of list) console.log(`${b.id}\t${b.en}`);
    console.error(`${list.length} shown`);
  } else if (cmd === 'add') {
    if (!all[scope]) throw new Error(`unknown scope ${scope}`);
    let text = '';
    for await (const chunk of process.stdin) text += chunk;
    const add = JSON.parse(text);
    const known = new Map(all[scope].map((b) => [b.id, b.en]));
    const file = existsSync(faPath(scope)) ? JSON.parse(await readFile(faPath(scope), 'utf8')) : {};
    let n = 0;
    for (const [id, fa] of Object.entries(add)) {
      if (!known.has(id)) { console.error(`skipped ${id}: not a block of ${scope}`); continue; }
      file[id] = { en: known.get(id).slice(0, 70), fa }; n++;
    }
    await mkdir(`${ROOT}i18n/fa`, { recursive: true });
    await writeFile(faPath(scope), JSON.stringify(file, null, 1) + '\n');
    console.log(`${scope}: added ${n}`);
  } else console.log('usage: node tools/i18n.mjs status | todo <scope> [n] | add <scope>');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
