---
id: 6SZUnXEHCns
title: Gradient descent for logistic regression
source: Andrew Ng, DeepLearning.AI
duration: 6:31
chapters: 10
basis: transcript
---
**What it teaches.** Training logistic regression with gradient descent.

**Key points**
- Find w and b that minimize J, using the same update rule as before: w_j = w_j minus alpha times the slope, and the same for b.
- The slopes look identical to linear regression: the average of (f minus y) times x_j, and the average of (f minus y).
- The difference is the definition of f: in linear regression f = w . x + b, but in logistic regression f = sigmoid(w . x + b).
- Vectorization and feature scaling work here too. In practice many practitioners use scikit-learn for this.

**Remember.** Same update equations, different f. After training, a new x gives a probability.
