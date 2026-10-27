const tokens = (q) => q.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 2);

// Every word of the query must appear in the section; titles count more than text.
export function search(index, query, limit = 30, opts = {}) {
  const words = tokens(query);
  if (!words.length) return [];
  const out = [];
  for (const entry of index) {
    const farsi = opts.fa && entry.fa ? ` ${entry.fa}` : '';
    const title = entry.title.toLowerCase(), text = (entry.text + farsi).toLowerCase();
    let score = 0;
    let ok = true;
    for (const w of words) {
      const inTitle = title.includes(w), n = text.split(w).length - 1;
      if (!inTitle && !n) { ok = false; break; }
      score += (inTitle ? 6 : 0) + Math.min(n, 5);
    }
    if (ok) out.push({ entry, score, snippet: snippet(entry.text + farsi, words[0]) });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function snippet(text, word, radius = 70) {
  const i = text.toLowerCase().indexOf(word);
  if (i < 0) return text.slice(0, radius * 2);
  const from = Math.max(0, i - radius), to = Math.min(text.length, i + word.length + radius);
  return (from > 0 ? '…' : '') + text.slice(from, to) + (to < text.length ? '…' : '');
}
