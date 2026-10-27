---
id: jhrrw8Iuus0
title: Regularized linear regression
source: Andrew Ng, DeepLearning.AI
duration: 8:52
chapters: 11
basis: notes
---
**What it teaches.** Gradient descent for linear regression with the regularization term.

**Key points**
- The slope for w_j gets one extra term, (lambda / m) times w_j. The slope for b is unchanged.
- Rewritten, every update first shrinks w_j a little (multiplies it by 1 - alpha x lambda / m, a number just below 1), and then applies the usual update. That is why regularization is also called weight decay.
- A tiny lambda barely changes anything; a larger lambda pulls the weights toward 0 on every step.

**Remember.** Each step: shrink the weights slightly, then the normal update.
