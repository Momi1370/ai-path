---
id: Ylz779Op9Pw
title: How to Improve LLMs with RAG (Overview + Python Code)
source: Shaw Talebi
duration: 21:41
chapters: 18
basis: notes
---
**What it teaches.** Retrieval-augmented generation: how to give a language model facts it was not trained on.

**Key points**
- A model does not know your private or recent documents. RAG fixes that without retraining: find the relevant passages first, then put them into the prompt.
- Steps: split the documents into chunks, turn each chunk into an embedding (a list of numbers that captures its meaning), store them, embed the question, retrieve the closest chunks, and ask the model to answer from them.
- The quality depends on retrieval: if the right chunk is not retrieved, the model cannot use it. You measure that with a retrieval metric such as hit at k.
- The video ends with a Python walk-through.

**Remember.** The model answers from what you hand it, so retrieval is the part to test first.
