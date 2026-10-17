// Opens every screen in headless Chrome (360 px wide) and checks it rendered without errors.
// Usage: npm run smoke   (starts its own server; needs Google Chrome, or set CHROME=/path/to/chrome)
// SHOTS=/some/dir npm run smoke   also saves a screenshot of each screen.
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

const server = await serve(0);
const base = `http://127.0.0.1:${server.address().port}`;
const b = await launch({ width: 360, height: 800 });
const shots = process.env.SHOTS;
let failed = 0;

async function check(name, hash, route, expectText, extra) {
  const before = b.errors.length;
  await b.evaluate('delete document.body?.dataset.ready').catch(() => {});
  await b.goto(`${base}/index.html${hash}`);
  const problems = [];
  if (!(await b.waitFor(`document.body.dataset.ready === ${JSON.stringify(route)}`, 15000))) problems.push('screen did not finish rendering');
  await new Promise((r) => setTimeout(r, 250));
  if (extra) await extra(b, problems);
  const text = await b.text().catch(() => '');
  if (text.includes('Could not load this page')) problems.push('screen showed the error panel');
  if (expectText && !text.toLowerCase().includes(expectText.toLowerCase())) problems.push(`missing text "${expectText}"`);
  if (await b.evaluate('document.documentElement.scrollWidth > innerWidth + 1').catch(() => false)) problems.push('page scrolls sideways');
  problems.push(...b.errors.slice(before));
  if (shots) await b.screenshot(`${shots}/${name}.png`);
  if (problems.length) failed++;
  console.log(`${problems.length ? '✗' : '✓'} ${hash || '(start)'}${problems.map((p) => `\n   - ${p}`).join('')}`);
}

try {
  await check('today', '#/today', 'today', 'This week');
  await check('watch', '#/watch', 'watch', 'videos watched');
  await check('video', '#/watch/Kdsp6soqA7o', 'watch', 'Mark as watched', async (br, p) => { if (!(await br.evaluate('!!document.querySelector("iframe.player")'))) p.push('no player'); });
  await check('review', '#/review', 'review', 'Start');
  await check('notes', '#/notes', 'notes', 'Part A');
  await check('chapter', '#/notes/ch-9', 'notes', 'Logistic regression', async (br, p) => {
    if (!(await br.evaluate('document.querySelectorAll("article math").length > 0'))) p.push('formula did not render');
    if (!(await br.evaluate('[...document.images].every((i) => i.complete && i.naturalWidth > 0)'))) p.push('an image did not load');
  });
  await check('chapter12', '#/notes/ch-12', 'notes', 'Measuring a model');
  await check('formulas', '#/notes/a', 'notes', 'Formula sheet');
  await check('glossary', '#/notes/e', 'notes', 'Glossary');
  await check('progress', '#/progress', 'progress', 'Cards by stage');

  // A review session: grade a card, see the schedule saved.
  await check('session', '#/review', 'review', null, async (br, p) => {
    await br.click('Start');
    await br.waitFor('document.querySelector(".flash")');
    await br.click('Show answer');
    await br.waitFor('document.querySelector(".grades")');
    await br.click('Good');
    await br.waitFor('document.querySelector(".flash")');
    const saved = await br.evaluate('JSON.parse(localStorage.getItem("aipath.v1")).log');
    if (!Object.values(saved).some((d) => d.reviews === 1)) p.push('the review was not saved');
  });
  // Ticking a plan step is remembered.
  await check('tick', '#/today', 'today', 'steps done', async (br, p) => {
    await br.evaluate('document.querySelector(".task .check").click()');
    const ticked = await br.evaluate('Object.keys(JSON.parse(localStorage.getItem("aipath.v1")).tasks).length');
    if (ticked !== 1) p.push('the tick was not saved');
  });
  // Search finds the section that explains the sigmoid.
  await check('search', '#/notes', 'notes', 'Notes', async (br, p) => {
    await br.evaluate('(() => { const i = document.getElementById("q"); i.value = "sigmoid"; i.dispatchEvent(new Event("input")); })()');
    if (!(await br.waitFor('document.querySelectorAll("a.card").length > 3', 5000))) p.push('search returned nothing for "sigmoid"');
  });
  // Offline: after one visit the service worker has saved everything, and the app opens with no network.
  await check('online', '#/today', 'today', 'This week');
  const cached = await b.evaluate('navigator.serviceWorker.ready.then(() => caches.keys()).then(async (keys) => { const c = await caches.open(keys[0]); return (await c.keys()).length; })').catch(() => 0);
  console.log(`   service worker cache: ${cached} files`);
  if (cached < 40) { failed++; console.log('✗ the service worker did not cache the app'); }
  await b.offline(true);
  // "?o=n" makes each of these a real page load (a changed hash alone would not reload the page).
  await check('offline-today', '?o=1#/today', 'today', 'This week');
  await check('offline-chapter', '?o=2#/notes/ch-9', 'notes', 'Logistic regression', async (br, p) => { if (!(await br.evaluate('[...document.images].every((i) => i.complete && i.naturalWidth > 0)'))) p.push('an image is missing offline'); });
  await check('offline-review', '?o=3#/review', 'review', 'Review');
  await b.offline(false);
} finally {
  await b.close();
  server.close();
}
console.log(failed ? `\n${failed} screen(s) failed` : '\nAll screens OK');
process.exit(failed ? 1 : 0);
