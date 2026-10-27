---
id: k0h8emRAAHE
title: Learning rate
source: Andrew Ng, DeepLearning.AI
duration: 9:04
chapters: 6
basis: transcript
---
**What it teaches.** How the learning rate alpha changes gradient descent, and how to choose it.

**Key points**
- If alpha is too small, gradient descent still works but takes very many tiny steps.
- If alpha is too large, it can overshoot the minimum, bounce from side to side, fail to converge or even diverge.
- If w is already at a local minimum, the slope there is zero, so one more step changes nothing.
- Near a minimum the slope gets smaller, so the steps shrink automatically even with a fixed alpha.

**Remember.** Too small = slow; too large = it may never settle. Watch the cost while it runs.
