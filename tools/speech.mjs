// Marks every spoken word of a chapter with <span data-s="sentence" data-w="word"> so the app can highlight
// the sentence and word being read, and returns the script for the voice (tools/tts/generate.py).
// What is spoken: headings, paragraphs and list items up to "Check yourself". Code, tables, formulas and
// the answers are skipped.
import { parseFragment, serialize, defaultTreeAdapter as T } from 'parse5';
import { createHash } from 'node:crypto';

const HTML = 'http://www.w3.org/1999/xhtml';
const SKIP = new Set(['pre', 'table', 'math', 'script', 'style', 'svg', 'img', 'summary']);
const BLOCK = new Set(['h3', 'h4', 'p', 'li']);
const NESTING = new Set(['ul', 'ol', 'div', 'blockquote', 'details', 'section']);
const ABBREV = /^(e\.g\.|i\.e\.|etc\.|vs\.|fig\.|no\.|approx\.|dr\.|st\.|[a-z]\.)$/i;

// Text as the phone shows it -> text as a voice should say it.
export function toSpeech(text) {
  return text
    .replace(/\bhttps?:\/\/\S+/g, '')
    .replace(/`/g, '')
    .replace(/\be\.g\./gi, 'for example').replace(/\bi\.e\./gi, 'that is').replace(/\betc\./gi, 'and so on').replace(/\bvs\./gi, 'versus')
    .replace(/(?<=[\w)\]]) x (?=[\w(\[])/g, ' times ')
    .replace(/\s+\.\s+/g, ' dot ')
    .replace(/\s*(?:->|→)\s*/g, ' to ')
    .replace(/(?<=\S) = (?=\S)/g, ' equals ')
    .replace(/(?<=[\w)\]]) \+ (?=[\w(\[])/g, ' plus ')
    .replace(/(?<=[\w)\]]) - (?=[\w(\[])/g, ' minus ')
    .replace(/(?<=\S) \/ (?=\S)/g, ' divided by ')
    .replace(/(\d)\s?%/g, '$1 percent')
    .replace(/\^2\b/g, ' squared').replace(/\^(\d+)/g, ' to the power of $1')
    .replace(/&/g, ' and ')
    .replace(/[[\]]/g, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Splits the words of one block into sentences: a word ending in . ! or ? ends a sentence when the next word starts like one.
export function splitSentences(words) {
  const out = [[]];
  words.forEach((w, i) => {
    out.at(-1).push(w);
    const next = words[i + 1];
    if (next && /[.!?]["'”)\]]*$/.test(w) && !ABBREV.test(w) && /^["'“(\[`]?[A-Z0-9]/.test(next)) out.push([]);
  });
  return out.filter((s) => s.length);
}

export function annotate(html) {
  const frag = parseFragment(html);
  const sentences = [];
  let stop = false;

  const gather = (el, nodes) => {
    for (const c of el.childNodes) {
      if (c.nodeName === '#text') nodes.push(c);
      else if (c.tagName && !SKIP.has(c.tagName) && !BLOCK.has(c.tagName) && !NESTING.has(c.tagName) && c.tagName !== 'ul' && c.tagName !== 'ol') gather(c, nodes);
    }
  };

  const doBlock = (el) => {
    const nodes = [];
    gather(el, nodes);
    const full = nodes.map((n) => n.value).join('');
    if (/^\s*Check yourself/.test(full) && el.tagName === 'p') { stop = true; return; }
    const re = /\S+/g;
    const words = [];
    for (let m; (m = re.exec(full));) words.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    if (words.length) {
      const groups = el.tagName === 'h3' || el.tagName === 'h4' ? [words] : splitSentences(words.map((w) => w.text)).map((g) => g.map(() => null));
      // groups for paragraphs are lists of placeholders; walk them in order to give each word its sentence and number
      let wi = 0;
      const wordSentence = new Array(words.length), wordIndex = new Array(words.length);
      groups.forEach((g, gi) => {
        const base = sentences.length;
        const list = [];
        g.forEach((_, k) => { const w = words[wi]; wordSentence[wi] = base; wordIndex[wi] = k; list.push(w.text); wi++; });
        const text = list.join(' ');
        sentences.push({ s: base, text, say: toSpeech(text), w: list.length, gap: gi < groups.length - 1 ? 'sentence' : el.tagName === 'h3' || el.tagName === 'h4' ? 'heading' : 'block' });
      });
      // wrap each word (a word that crosses two text nodes becomes two spans with the same numbers)
      let offset = 0;
      for (const node of nodes) {
        const a = offset, b = offset + node.value.length;
        offset = b;
        const parent = node.parentNode;
        let pos = 0;
        const add = (text, wIdx) => {
          if (!text) return;
          if (wIdx < 0) T.insertTextBefore(parent, text, node);
          else {
            const span = T.createElement('span', HTML, [{ name: 'data-s', value: String(wordSentence[wIdx]) }, { name: 'data-w', value: String(wordIndex[wIdx]) }]);
            T.insertText(span, text);
            T.insertBefore(parent, span, node);
          }
        };
        for (let k = 0; k < words.length; k++) {
          const w = words[k];
          if (w.end <= a || w.start >= b) continue;
          const from = Math.max(w.start, a) - a, to = Math.min(w.end, b) - a;
          add(node.value.slice(pos, from), -1);
          add(node.value.slice(from, to), k);
          pos = to;
        }
        add(node.value.slice(pos), -1);
        T.detachNode(node);
      }
    }
    // nested lists and blocks inside this one
    for (const c of [...el.childNodes]) if (c.tagName && (c.tagName === 'ul' || c.tagName === 'ol' || BLOCK.has(c.tagName) || NESTING.has(c.tagName))) walk(c);
  };

  const walk = (el) => {
    for (const c of [...el.childNodes]) {
      if (stop) return;
      if (!c.tagName || SKIP.has(c.tagName)) continue;
      if (c.tagName === 'details' && (c.attrs ?? []).some((a) => a.name === 'class' && a.value === 'answers')) continue;
      if (c.tagName === 'div' && (c.attrs ?? []).some((a) => a.name === 'class' && /\b(math|tbl)\b/.test(a.value))) continue;
      if (BLOCK.has(c.tagName)) doBlock(c);
      else walk(c);
    }
  };
  walk(frag);
  const hash = createHash('sha1').update(JSON.stringify(sentences.map((s) => [s.say, s.gap]))).digest('hex').slice(0, 8);
  return { html: serialize(frag), sentences, hash };
}
