---
id: xuTiAW0OR40
title: Logistic regression and the sigmoid
source: Andrew Ng, DeepLearning.AI
duration: 9:49
chapters: 9
basis: transcript
---
**What it teaches.** The logistic regression model.

**Key points**
- Logistic regression is probably the most widely used classification algorithm in the world.
- Step 1: z = w . x + b. Step 2: pass z through the sigmoid (logistic) function g(z) = 1 / (1 + e^(-z)).
- The sigmoid outputs a value between 0 and 1: near 0 for very negative z, 0.5 at z = 0, near 1 for very positive z.
- The model is f(x) = g(w . x + b). Read the output as the probability that y = 1, for example 0.7 means a 70 percent chance of malignant.
- Next: turning 0.3, 0.65 or 0.7 into a prediction of 0 or 1.

**Remember.** Linear score z, then the S-curve: that is the whole model.
