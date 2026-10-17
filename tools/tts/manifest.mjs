// Writes audio/manifest.json from the audio files that match the current spoken text, and removes audio
// that does not (an older text of a chapter). Run after tools/tts/generate.py.
import { readFile, readdir, writeFile, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const voices = JSON.parse(await readFile(`${ROOT}tools/tts/voices.json`, 'utf8')).voices;
const scripts = (await readdir(`${ROOT}tools/tts/scripts`)).filter((f) => /^ch-\d+\.json$/.test(f));
const manifest = { version: 1, voices: voices.map(({ id, name }) => ({ id, name })), chapters: {} };
const exists = (p) => stat(p).then(() => true, () => false);

for (const f of scripts.sort((a, b) => parseInt(a.slice(3), 10) - parseInt(b.slice(3), 10))) {
  const { n, hash } = JSON.parse(await readFile(`${ROOT}tools/tts/scripts/${f}`, 'utf8'));
  const entry = { hash, voices: {} };
  for (const v of voices) {
    const base = `${ROOT}audio/${v.id}/ch-${n}.${hash}`;
    if (!(await exists(`${base}.mp3`)) || !(await exists(`${base}.json`))) continue;
    const t = JSON.parse(await readFile(`${base}.json`, 'utf8'));
    entry.voices[v.id] = { d: t.d, bytes: (await stat(`${base}.mp3`)).size };
  }
  if (Object.keys(entry.voices).length) manifest.chapters[n] = entry;
}
// remove audio that belongs to an older text
for (const v of voices) {
  const dir = `${ROOT}audio/${v.id}`;
  if (!(await exists(dir))) continue;
  for (const file of await readdir(dir)) {
    const m = /^ch-(\d+)\.([0-9a-f]+)\.(mp3|json)$/.exec(file);
    if (m && manifest.chapters[m[1]]?.hash !== m[2]) { await rm(`${dir}/${file}`); console.log('removed old', `${v.id}/${file}`); }
  }
}
await writeFile(`${ROOT}audio/manifest.json`, JSON.stringify(manifest));
const made = Object.keys(manifest.chapters).length;
const mb = Object.values(manifest.chapters).flatMap((c) => Object.values(c.voices)).reduce((n, v) => n + v.bytes, 0) / 1e6;
console.log(`${made} of ${scripts.length} chapters have audio (${mb.toFixed(1)} MB)`);
