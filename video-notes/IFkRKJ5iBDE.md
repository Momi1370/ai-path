---
id: IFkRKJ5iBDE
title: Polynomial regression
source: Andrew Ng, DeepLearning.AI
duration: 5:52
chapters: 8
basis: transcript
---
**What it teaches.** Fitting curves with a linear-regression algorithm.

**Key points**
- If a straight line does not fit, add features such as x squared or x cubed. The model is still linear in the weights, so the same gradient descent works.
- Another choice is the square root of x; it rises but flattens, without ever coming back down. Pick features by looking at the shape of the data.
- When you use powers of x, feature scaling becomes very important, because x, x squared and x cubed have wildly different ranges.
- Next week: classification, the first algorithm that predicts categories. In practice, libraries such as scikit-learn do much of this for you.

**Remember.** Curves are just more features.
