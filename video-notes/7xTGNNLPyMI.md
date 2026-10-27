---
id: 7xTGNNLPyMI
title: Deep Dive into LLMs like ChatGPT (tokenization chapter)
source: Andrej Karpathy
duration: 3 h 31 min
chapters: 16, 17
basis: transcript
---
**What it teaches.** A long, general-audience tour of how a model like ChatGPT is made and what it is. Your plan linked the tokenization chapter (it starts at 7:47) to explain why prices are per token. The excerpts used for this page come from across the whole video; the tokenization chapter itself was not read in detail.

**The arc of the video**
- Pretraining: download and clean a huge amount of internet text, turn it into tokens, and train a neural network to predict the next token.
- Inference: the model samples one token at a time, so the same prompt can give different answers ("parallel universes").
- From base model to assistant: post-training on conversations written by human labellers teaches the model to answer as an assistant.
- Hallucinations, the model's knowledge in its parameters versus the working memory in its context, and why tools such as web search help.
- Reinforcement learning, reasoning models (the DeepSeek discussion) and learning from human feedback.

**Remember.** A model is a very large next-token predictor; treat its output as a first draft you check yourself.
