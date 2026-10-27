---
id: P_9hNBVRldM
title: Choosing the learning rate
source: Andrew Ng, DeepLearning.AI
duration: 6:07
chapters: 6
basis: transcript
---
**What it teaches.** How to pick alpha in practice.

**Key points**
- If the cost goes up and down, or only up, alpha is too large (or the code has a bug).
- A debugging trick: set alpha very small. The cost should then drop on every iteration. If it still does not, the code is wrong. This tiny alpha is for debugging, not for actual training because it is slow.
- Try a range of values, about three times apart (0.001, 0.003, 0.01, 0.03, 0.1 ...), and pick the largest one that still gives a steadily falling curve, or one a bit smaller.
- Next: choosing and engineering your own features.

**Remember.** Largest alpha that still descends smoothly.
