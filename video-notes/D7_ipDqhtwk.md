---
id: D7_ipDqhtwk
title: How We Build Effective Agents
source: Barry Zhang, Anthropic (AI Engineer talk)
duration: 15:09
chapters: 16, 17
basis: transcript
---
**What it teaches.** Practical advice from Anthropic on when and how to build an agent. It follows the "Building Effective Agents" blog post.

**Key points**
- Do not build an agent for everything. Check that the task is complex enough, valuable enough, and that the cost of mistakes is manageable.
- De-risk the critical capabilities first. For a coding agent: can it write good code, debug, and recover from its own errors? If one of these is a bottleneck, reduce the scope.
- Keep it simple. An agent is three things: an environment, a set of tools, and a system prompt. Get these three right before optimizing.
- Optimizations come later: cache the trajectory to cut cost for coding and computer use, run tool calls in parallel to cut latency for search, and show progress so users trust it.
- Think like your agent: it sees only its context window. Put the whole trajectory in front of the model and ask why it made a decision.

**Remember.** Environment, tools, system prompt: get those right, and read your agent's trajectory like a transcript.
