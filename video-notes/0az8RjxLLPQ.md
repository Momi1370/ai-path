---
id: 0az8RjxLLPQ
title: Decision boundary
source: Andrew Ng, DeepLearning.AI
duration: 10:43
chapters: 9
basis: transcript
---
**What it teaches.** How a probability becomes a yes or no, and where the dividing line sits.

**Key points**
- Predict 1 when f(x) is at least 0.5 (a common threshold). That happens exactly when z = w . x + b is at least 0.
- The line z = 0 is the decision boundary: the place where the model is neutral between 0 and 1.
- Example with two features: w1 = 1, w2 = 1, b = -3. The boundary is x1 + x2 - 3 = 0, which is the line x1 + x2 = 3. One side is predicted 1, the other 0.
- With extra polynomial features the boundary can be a circle or a more complex curve.

**Remember.** The decision boundary is where w . x + b = 0.
