---
id: ZaY5_ScmiFE
title: An Introduction to AI Agents
source: Shaw Talebi
duration: 23:47
chapters: 16
basis: transcript
---
**What it teaches.** What an AI agent is, and three levels of agency. It is the first video of a series.

**Key points**
- No one agrees on a single definition. OpenAI says an LLM configured with instructions and tools; Hugging Face adds planning; Anthropic stresses that the LLM directs its own process.
- Why agents work now: reasoning models trained with reinforcement learning can solve new problems without very detailed prompts for each task.
- Level 1, an LLM plus tools: one model with a few tools, such as search or a code interpreter.
- Level 2, an LLM workflow: a predefined sequence of steps with an LLM inside. Example: an email arrives, an LLM decides junk or not, junk goes to the trash, the rest follows the next step. You can chain several calls or run them in parallel.
- Level 3, an LLM in a loop: the model acts, gets feedback and tries again until checks pass. The evaluator-optimizer pattern is the example: one LLM writes, another reviews, and they loop.

**Remember.** More agency means more flexibility and less predictability; start with the simplest level that works.
