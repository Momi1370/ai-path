---
id: pd-0G0MigUA
title: Python SQLite Tutorial: Complete Overview
source: Corey Schafer
duration: 30 min
chapters: 
basis: transcript
---
**What it teaches.** Working with SQLite from Python. This is a build-track resource for the loan database, not part of the ML course. Your plan said to watch the first 15 minutes.

**Key points**
- SQLite is a small database that lives in a file (or in memory), good for small and medium applications, testing and prototypes. No server to set up.
- Connect with `sqlite3.connect`, create a cursor, run `execute`, and call `commit` to save changes. Close the connection at the end.
- Use placeholders for values (question marks or named parameters) instead of pasting strings into the SQL, and fetch with `fetchone`, `fetchmany` or `fetchall`.
- A special in-memory database (`:memory:`) starts fresh every run, which is handy for tests.

**Remember.** Parameters, not string formatting, and commit your changes.
