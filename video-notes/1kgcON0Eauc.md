---
id: 1kgcON0Eauc
title: Addressing overfitting
source: Andrew Ng, DeepLearning.AI
duration: 8:15
chapters: 11
basis: notes
---
**What it teaches.** Three ways to reduce overfitting.

**Key points**
- Get more training data. With more examples a flexible model has less room to chase noise. This is the best fix when you can afford it.
- Use fewer features. Too many features, especially with little data, invite overfitting; choosing the most useful ones (feature selection) helps, at the price of throwing information away.
- Regularization. Keep all the features but shrink the size of the weights, so no single feature dominates. This is the fix the next videos build.
- Regularizing b is not needed in practice.

**Remember.** More data, fewer features, or smaller weights.
