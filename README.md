# AI Path

A phone companion for learning machine learning and AI engineering. It holds this week's plan, the videos, a textbook of notes, and spaced-repetition review cards, all in one installable web app that also works offline.

**Open the app:** https://momi1370.github.io/ai-path/

## Install on iPhone

1. Open the link above in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Open it once while online. After that, the notes, cards and plan work without internet. Videos need internet.

Your progress stays on your phone. Use **Progress → Settings and backup** to save a backup file before you clear Safari data or change phones.

## What is inside

- **Today**: the ML sessions of the current week (reading, videos, drills) with tick boxes.
- **Watch**: a book of **sessions** (session N = plan week N), each with its videos in order, so you can find and rewatch any video from any week. Every video has its own page: the player, a **text version** (what it teaches, key points, one line to remember), a quick check from its chapter, and previous/next. The search box finds a video by what it explains (for example "ROC"). The **Index** tab keeps the flat list.
- **Review**: about 195 cards (questions, glossary terms, formulas) scheduled with [FSRS](https://github.com/open-spaced-repetition/ts-fsrs), like Taalmaatje. New cards per day can be 3, 5, 10 or 15.
- **Notes**: 18 chapters, a formula sheet, a reading list, a glossary and full-text search. Your place in each chapter is remembered. **Listen** reads a chapter aloud in a recorded voice (Heart or Emma), highlights the sentence and the word being read, scrolls along, and continues with the next chapter. Tap a sentence to hear it from there. Speed 0.85× to 1.75×, lock-screen controls included.
- **Progress**: videos watched, chapters read, streak, cards by memory stage, reviews per day, and the settings, including **Farsi explanations**.
- **Farsi** (Progress, Settings): when it is on, a right-to-left Farsi explanation appears under each English paragraph, list item and heading of the chapters, under glossary terms and review cards, and on the video pages, wherever a translation exists. Code, formulas and numbers stay in English. Search also looks in the Farsi text while the setting is on. A chapter that is only partly translated says so at its top.

## Development

```bash
npm install          # build tools only: marked and KaTeX
npm run build        # notes + plan -> content/, assets/ and the voice scripts in tools/tts/scripts/
npm test             # unit tests (Node 22+)
npm run validate     # check the generated content
npm run serve        # http://127.0.0.1:8080
npm run smoke        # headless Chrome opens every screen, then goes offline
```

The app has no runtime dependencies and no build step: plain ES modules, a hash router, `localStorage` for progress, and a service worker.

## Updating the content

The content comes from a separate private repo (`AI-Engineering-Plan-2026-27`, expected next to this one):

```bash
npm run build        # reads ../AI-Engineering-Plan-2026-27/notes/course-notes.md and plan/this-week.md
python tools/tts/generate.py && node tools/tts/manifest.mjs   # new audio only for chapters whose text changed (see tools/tts/README.md)
npm test && npm run smoke
git add -A && git commit -m "Content: week N" && git push
```

Two more things are kept in this repo, because the private plan repo does not hold them:

- `video-notes/<youtube id>.md`: the text page of one video (a small header, then the text). A video joins a session when the plan of that week links it; `video-notes/sessions.json` holds each session's topic, optional outside links (for example a Coursera course) and videos to show first. `npm run validate` fails if a video in a session has no page. Each page says whether it was written from the video's transcript or from the course notes.
- `i18n/fa/<scope>.json`: Farsi translations, one entry per English block, keyed by a hash of that block's English words. When the English changes, the old translation stops matching and is listed as missing (it is never shown as if it were current). `node tools/i18n.mjs status` shows coverage, `todo <scope>` lists what is missing, and `add <scope>` merges new translations from stdin. Scopes: `ch-1` to `ch-18`, `cards`, `videos`.

`tools/build-content.mjs` publishes only the **ML sessions** of the weekly plan, strips clock times, issue links and private remarks, and fails the build if a forbidden word (see `FORBIDDEN` in the script) ends up in any published file. The build track, the calendar and everything personal stay in the private repo.

## Read-aloud audio

The voices are [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0), Heart and Emma, made ahead of time on the Mac: one MP3 per chapter and voice (about 30 MB per voice in total) plus a small JSON file with the time of every sentence and word. Chapter text carries `data-s` / `data-w` marks, so the app highlights what is being read without any speech engine on the phone. Audio is fetched the first time you play a chapter and then kept for offline use. Code, tables, formulas and the answers are not read aloud. Details: `tools/tts/README.md`.

## Licence

The code is MIT (see `LICENSE`). The notes, cards and plan text are not licensed for reuse. Scheduling by [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT); see `THIRD_PARTY_NOTICES.md`.
