---
id: peNRqkfukYY
title: Cost function intuition
source: Andrew Ng, DeepLearning.AI
duration: 15:47
chapters: 5
basis: transcript
---
**What it teaches.** What the cost function is really doing, using a simplified model with only w (b fixed at 0).

**Key points**
- With b = 0 the model is f(x) = w x, a line through the origin. Each value of w gives a different line and a different cost J(w).
- Plotting J against w gives a curve. For w = 1 the line passes exactly through the training points and the cost is 0. For w = 0.5 or a negative w the line is worse and the cost is larger.
- Choosing w means choosing a point on the J curve; the best w is the one at the bottom.
- The goal of linear regression: find the parameters (w, or w and b) that give the smallest possible J.

**Remember.** Every line you could draw is one point on the cost curve; training is looking for the lowest point.
