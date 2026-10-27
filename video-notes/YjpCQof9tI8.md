---
id: YjpCQof9tI8
title: Gradient descent for multiple linear regression
source: Andrew Ng, DeepLearning.AI
duration: 7:46
chapters: 6, 7
basis: transcript
---
**What it teaches.** The full gradient descent update for several features.

**Key points**
- Write the parameters as a vector w and a number b. The update is the same idea as before, repeated for each j from 1 to n.
- For each weight: w_j = w_j minus alpha times the average over examples of (prediction minus target) times x_j.
- For b: b = b minus alpha times the average of (prediction minus target).
- Update all of them simultaneously, and repeat until convergence.
- A closing mention of the normal equation as an alternative for linear regression; gradient descent is the general method.

**Remember.** Same recipe as one feature, with one extra loop over the weights.
