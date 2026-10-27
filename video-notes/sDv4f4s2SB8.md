---
id: sDv4f4s2SB8
title: Gradient Descent, Step-by-Step
source: StatQuest, Josh Starmer
duration: 24 min
chapters: 6
basis: transcript
---
**What it teaches.** Gradient descent done with real numbers on a tiny height-and-weight data set, one step at a time.

**Key points**
- Start by looking at the sum of squared residuals for one intercept; try more intercepts and you get a curve. Finding the lowest point by trying values is too slow.
- Use the derivative of the sum of squared residuals with respect to the intercept (with the chain rule). Where the slope is near 0 you are near the best value.
- Step size = slope times learning rate. With learning rate 0.1 and slope -2.3 the step is -0.23, so the intercept moves from 0.57 to about 0.8 (the video shows these steps).
- Stop when the step size is very small or after a maximum number of steps.
- With both intercept and slope, take the derivative with respect to each; the vector of those derivatives is the gradient. Stochastic gradient descent uses a random subset of data per step to speed things up.

**Remember.** Step size = slope x learning rate; steps shrink as you approach the bottom.
