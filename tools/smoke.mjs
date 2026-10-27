// Opens every screen in headless Chrome (360 px wide) and checks it rendered without errors.
// Usage: npm run smoke   (starts its own server; needs Google Chrome, or set CHROME=/path/to/chrome)
// SHOTS=/some/dir npm run smoke   also saves a screenshot of each screen.
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

const server = await serve(0);
const base = `http://127.0.0.1:${server.address().port}`;
const b = await launch({ width: 360, height: 800, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
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
  if (/(^|\s)(null|undefined)(\s|$)/.test(text)) problems.push('page prints the word null or undefined');
  if (expectText && !text.toLowerCase().includes(expectText.toLowerCase())) problems.push(`missing text "${expectText}"`);
  if (await b.evaluate('document.documentElement.scrollWidth > innerWidth + 1').catch(() => false)) problems.push('page scrolls sideways');
  problems.push(...b.errors.slice(before));
  if (shots) await b.screenshot(`${shots}/${name}.png`);
  if (problems.length) failed++;
  console.log(`${problems.length ? '✗' : '✓'} ${hash || '(start)'}${problems.map((p) => `\n   - ${p}`).join('')}`);
}

try {
  await check('today', '#/today', 'today', 'This week');
  await check('today-videos', '?o=20#/today', 'today', 'Videos this week', async (br, p) => {
    if (!(await br.evaluate('[...document.querySelectorAll("a.vrow")].some((a) => /Matrix multiplication as composition/.test(a.textContent) && a.getAttribute("href").startsWith("#/watch/"))'))) p.push('Today lists no video link');
    if (!(await br.evaluate('[...document.querySelectorAll("a.vrow")].some((a) => /^https:/.test(a.getAttribute("href")))'))) p.push('Today has no link to the course page');
  });
  await check('watch', '#/watch', 'watch', 'videos watched');
  await check('video', '#/watch/Kdsp6soqA7o', 'watch', 'Mark as watched', async (br, p) => { if (!(await br.evaluate('!!document.querySelector("iframe.player")'))) p.push('no player'); });
  await check('sessions', '#/watch', 'watch', 'videos watched', async (br, p) => {
    if (!/Session 5/i.test(await br.text())) p.push('Session 5 is not listed');
    if (!(await br.evaluate('document.querySelectorAll("details.session").length >= 5'))) p.push('the sessions book is missing sessions');
    // open Session 4 and see its videos
    await br.evaluate('document.querySelectorAll("details.session")[3].open = true');
    if (!(await br.evaluate('[...document.querySelectorAll("details.session")[3].querySelectorAll("a.vrow")].some((a) => /ROC/.test(a.textContent))'))) p.push('Session 4 does not list the ROC video');
    // search the video pages
    await br.evaluate('(() => { const i = document.getElementById("vq"); i.value = "ROC"; i.dispatchEvent(new Event("input")); })()');
    if (!(await br.waitFor('[...document.querySelectorAll("a.card")].some((a) => /ROC and AUC/.test(a.textContent))', 5000))) p.push('searching "ROC" did not find the ROC video');
  });
  await check('video-text', '#/watch/4jRBRDbJemM', 'watch', 'Text version', async (br, p) => {
    if (!(await br.evaluate('!!document.querySelector("article.vtext") && /AUC/.test(document.querySelector("article.vtext").textContent)'))) p.push('the text page does not explain AUC');
    if (!(await br.evaluate('/Session 4/.test(document.body.textContent)'))) p.push('no session label');
  });
  await check('review', '#/review', 'review', 'Start');
  await check('notes', '#/notes', 'notes', 'Part A');
  await check('chapter', '#/notes/ch-9', 'notes', 'Logistic regression', async (br, p) => {
    if (!(await br.evaluate('document.querySelectorAll("article math").length > 0'))) p.push('formula did not render');
    if (!(await br.evaluate('[...document.images].every((i) => i.complete && i.naturalWidth > 0)'))) p.push('an image did not load');
  });
  await check('chapter12', '#/notes/ch-12', 'notes', 'Measuring a model');
  await check('notes-sessions', '?o=21#/notes', 'notes', 'Session notes', async (br, p) => {
    if (!(await br.evaluate('document.querySelectorAll("details.session").length >= 5'))) p.push('Notes lists fewer than 5 sessions');
    await br.evaluate('document.querySelectorAll("details.session")[3].open = true');
    if (!(await br.evaluate('[...document.querySelectorAll("details.session")[3].querySelectorAll("a.vrow")].some((a) => /ROC/.test(a.textContent) && a.getAttribute("href") === "#/notes/v/4jRBRDbJemM")'))) p.push('Session 4 does not link the ROC note');
  });
  await check('note-video', '#/notes/v/4jRBRDbJemM', 'notes', 'Watch the video', async (br, p) => {
    if (!(await br.evaluate('/AUC/.test(document.querySelector("article.vtext")?.textContent ?? "")'))) p.push('the video note does not explain AUC');
  });
  await check('formulas', '#/notes/a', 'notes', 'Formula sheet');
  await check('glossary', '#/notes/e', 'notes', 'Glossary');
  await check('progress', '#/progress', 'progress', 'Cards by stage');

  // Read-aloud: press Listen, the voice plays and the sentence and word being read are highlighted and move on.
  await check('listen', '#/notes/ch-9', 'notes', 'Logistic regression', async (br, p) => {
    if (!(await br.click('Listen'))) { p.push('no Listen button'); return; }
    if (!(await br.waitFor('document.querySelector(".listen-bar") && !document.querySelector(".listen-bar").hidden', 4000))) { p.push('the player did not open'); return; }
    if (!(await br.waitFor('document.querySelectorAll(".sp-s").length > 0 && document.querySelector(".sp-w")', 15000))) { p.push('nothing was highlighted'); return; }
    const w1 = await br.evaluate('document.querySelector(".sp-w").textContent');
    const t1 = await br.evaluate('+document.querySelector(".listen-bar .seek").value');
    await new Promise((r) => setTimeout(r, 4000));
    const w2 = await br.evaluate('document.querySelector(".sp-w")?.textContent');
    const t2 = await br.evaluate('+document.querySelector(".listen-bar .seek").value');
    if (!(t2 > t1)) p.push(`the voice did not move on (${t1} -> ${t2})`);
    if (w1 === w2) p.push('the highlighted word did not change');
    const s1 = await br.evaluate('document.querySelector(".sp-w").dataset.s');
    await br.click('+15');
    await new Promise((r) => setTimeout(r, 600));
    const s2 = await br.evaluate('document.querySelector(".sp-w")?.dataset.s');
    if (s1 === s2) p.push('skipping 15 seconds did not move the highlight');
    if (await br.evaluate('document.querySelectorAll(".listen-bar .chip").length > 1')) {
      await br.click('Emma');
      await new Promise((r) => setTimeout(r, 2500));
      if (!(await br.evaluate('document.querySelector(".listen-bar .play").getAttribute("aria-label") === "Pause"'))) p.push('switching to Emma stopped the voice');
      if (!(await br.evaluate('document.querySelectorAll(".sp-w").length > 0'))) p.push('no highlight after switching voice');
    }
    await br.click('✕');
    if (await br.evaluate('document.querySelector(".listen-bar") && !document.querySelector(".listen-bar").hidden')) p.push('the player did not close');
  });
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
  // Notes search also finds the video page that explains a word.
  await check('search-video', '?o=7#/notes', 'notes', 'Notes', async (br, p) => {
    await br.evaluate('(() => { const i = document.getElementById("q"); i.value = "ROC"; i.dispatchEvent(new Event("input")); })()');
    if (!(await br.waitFor('[...document.querySelectorAll("a.card")].some((a) => /Video · Session 4/.test(a.textContent) && a.getAttribute("href") === "#/notes/v/4jRBRDbJemM")', 5000))) p.push('searching "ROC" in Notes found no video note');
  });
  // Farsi: off by default; the setting turns it on everywhere, and nothing scrolls sideways.
  await check('farsi-off', '?o=8#/notes/e', 'notes', 'Glossary', async (br, p) => {
    if (await br.evaluate('[...document.querySelectorAll(".fa")].some((e) => e.offsetHeight > 0)')) p.push('Farsi is visible while the setting is off');
  });
  await check('farsi-switch', '?o=9#/progress', 'progress', 'Farsi explanations', async (br, p) => {
    await br.evaluate('document.getElementById("farsi").click()');
    if (!(await br.waitFor('document.body.classList.contains("fa-on") && document.getElementById("farsi").getAttribute("aria-checked") === "true"', 3000))) p.push('the Farsi switch did not turn on');
  });
  await check('farsi-glossary', '?o=10#/notes/e', 'notes', 'Glossary', async (br, p) => {
    if (!(await br.evaluate('[...document.querySelectorAll(".fa")].filter((e) => e.offsetHeight > 0 && getComputedStyle(e).direction === "rtl").length > 50'))) p.push('the glossary shows no Farsi');
  });
  await check('farsi-card', '?o=11#/watch/4jRBRDbJemM', 'watch', null, async (br, p) => {
    if (!(await br.click('Quick check'))) { p.push('no Quick check button'); return; }
    if (!(await br.waitFor('document.querySelector(".flash")', 5000))) { p.push('the quick check did not start'); return; }
    await br.click('Show answer');
    if (!(await br.evaluate('document.querySelectorAll(".flash .fa").length >= 2'))) p.push('the review card shows no Farsi (question and answer)');
  });
  await check('farsi-chapter', '?o=13#/notes/ch-14', 'notes', 'Neural networks', async (br, p) => {
    if (!(await br.evaluate('[...document.querySelectorAll("article.read .fa")].filter((e) => e.offsetHeight > 0 && getComputedStyle(e).direction === "rtl").length > 30'))) p.push('chapter 14 shows too little Farsi');
    if (!(await br.evaluate('!!document.querySelector("article.read li > .fa")'))) p.push('no Farsi inside list items');
  });
  await check('farsi-chapter-1', '?o=14#/notes/ch-1', 'notes', 'What machine learning is', async (br, p) => {
    if (!(await br.evaluate('[...document.querySelectorAll("article.read .fa")].filter((e) => e.offsetHeight > 0).length > 30'))) p.push('chapter 1 shows too little Farsi');
  });
  await check('farsi-video-note', '?o=15#/notes/v/4jRBRDbJemM', 'notes', 'Watch the video', async (br, p) => {
    if (!(await br.evaluate('[...document.querySelectorAll("article.vtext .fa")].filter((e) => e.offsetHeight > 0 && getComputedStyle(e).direction === "rtl").length >= 5'))) p.push('the video note shows no Farsi');
  });
  await check('farsi-off-again', '?o=12#/progress', 'progress', 'Farsi explanations', async (br, p) => {
    await br.evaluate('document.getElementById("farsi").click()');
    if (!(await br.waitFor('!document.body.classList.contains("fa-on")', 3000))) p.push('the Farsi switch did not turn off');
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
