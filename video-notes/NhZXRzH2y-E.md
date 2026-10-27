---
id: NhZXRzH2y-E
title: Regularized logistic regression
source: Andrew Ng, DeepLearning.AI
duration: 5:33
chapters: 11
basis: notes
---
**What it teaches.** The same regularization applied to logistic regression.

**Key points**
- Add the same penalty, lambda divided by 2m times the sum of squared weights, to the logistic cost.
- The update equations look just like regularized linear regression; only f is different (the sigmoid of w . x + b).
- With many polynomial features, regularization stops the decision boundary from twisting around single points.
- That ends the first course of the specialization: you can now train, tune and regularize two core models.
- In scikit-learn the knob is C, which equals 1 / lambda: a small C means strong regularization.

**Remember.** Same penalty, same shrink step; the model is just a sigmoid on top.
