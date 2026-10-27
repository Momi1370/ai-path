---
id: vq4Ie5xWhww
title: Cost function for logistic regression
source: Andrew Ng, DeepLearning.AI
duration: 11:59
chapters: 10
basis: transcript
---
**What it teaches.** Why logistic regression needs its own cost function.

**Key points**
- The squared-error cost, applied to the sigmoid output, produces a wavy cost surface with many local minima, so gradient descent can get stuck. A different loss is needed.
- Loss for one example: if y = 1, loss = -log(f); if y = 0, loss = -log(1 - f).
- If y = 1 and the model says f near 1, the loss is near 0. If it says f near 0, the loss goes toward infinity: a confident wrong answer is punished heavily. The case y = 0 mirrors this.
- Since f is always between 0 and 1, only that part of the curve matters.

**Remember.** Be confidently right and the loss is tiny; be confidently wrong and it explodes.
