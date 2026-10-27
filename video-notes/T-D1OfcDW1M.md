---
id: T-D1OfcDW1M
title: What is Retrieval-Augmented Generation (RAG)?
source: IBM Technology
duration: 6:36
chapters: 18
basis: notes
---
**What it teaches.** A short explanation of RAG and why it helps.

**Key points**
- A plain language model answers from what it learned in training. That can be out of date, and it gives no source.
- With RAG, the question first goes to a content store (documents, a database). The retrieved text is added to the prompt, and the model answers from it.
- Benefits: more up-to-date answers, the ability to cite sources, less making things up, and the model can say it does not know when nothing relevant is found.
- Two parts can fail: the retriever (did it find the right material?) and the generator (did it use it faithfully?).

**Remember.** Retrieve first, then generate, and keep the source.
