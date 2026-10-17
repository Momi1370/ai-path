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
- **Watch**: the video list. Each video plays in the app, with a quick check of 3 questions from its chapter.
- **Review**: about 195 cards (questions, glossary terms, formulas) scheduled with [FSRS](https://github.com/open-spaced-repetition/ts-fsrs), like Taalmaatje. New cards per day can be 3, 5, 10 or 15.
- **Notes**: 18 chapters, a formula sheet, a reading list, a glossary and full-text search. Your place in each chapter is remembered, and **Listen** reads a chapter aloud with the phone's own voice.
- **Progress**: videos watched, chapters read, streak, cards by memory stage, reviews per day.

## Development

```bash
npm install          # build tools only: marked and KaTeX
npm run build        # notes + plan -> content/ and assets/
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
npm test && npm run smoke
git add -A && git commit -m "Content: week N" && git push
```

`tools/build-content.mjs` publishes only the **ML sessions** of the weekly plan, strips clock times, issue links and private remarks, and fails the build if a forbidden word (see `FORBIDDEN` in the script) ends up in any published file. The build track, the calendar and everything personal stay in the private repo.

## Licence

The code is MIT (see `LICENSE`). The notes, cards and plan text are not licensed for reuse. Scheduling by [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT); see `THIRD_PARTY_NOTICES.md`.
