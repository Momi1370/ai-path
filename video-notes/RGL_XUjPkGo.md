---
id: RGL_XUjPkGo
title: Gradient descent for linear regression
source: Andrew Ng, DeepLearning.AI
duration: 6:37
chapters: 6, 7
basis: transcript
---
**What it teaches.** Putting the model, the squared-error cost and gradient descent together.

**Key points**
- The slopes of the squared-error cost are: for w, the average of (prediction minus target) times x; for b, the average of (prediction minus target).
- The factor 1/2 in the cost cancels the 2 from the derivative, which is why the cost was defined with it.
- The squared-error cost for linear regression is bowl-shaped (convex): it has one global minimum and no other local minima. With a suitable learning rate, gradient descent always reaches it.

**Remember.** Linear regression has no trap valleys: gradient descent finds the one best line.
