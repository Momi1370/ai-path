---
id: w_2vCijLiiM
title: Implementing gradient descent
source: Andrew Ng, DeepLearning.AI
duration: 10:00
chapters: 6
basis: transcript
---
**What it teaches.** The update rule you actually code.

**Key points**
- On each step: w becomes w minus alpha times the slope of J with respect to w; b becomes b minus alpha times the slope of J with respect to b.
- Alpha is the learning rate: it controls how big each step is.
- The slope (derivative) says which way is uphill, so subtracting it moves you downhill.
- Update w and b at the same time: compute both new values from the old ones first, then assign. Updating one and then using it to compute the other is a subtle bug.
- Repeat until convergence, meaning the parameters hardly change any more.

**Remember.** New value = old value minus learning rate times slope, for every parameter, all at once.
