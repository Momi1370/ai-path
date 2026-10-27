---
id: YkTcK_LXAxw
title: The simplified cost function
source: Andrew Ng, DeepLearning.AI
duration: 5:45
chapters: 10
basis: transcript
---
**What it teaches.** One formula for both cases of y, and the overall cost.

**Key points**
- The two-case loss can be written as one expression: loss = -y log(f) - (1 - y) log(1 - f). When y = 1 the second term vanishes; when y = 0 the first term vanishes.
- The cost J(w, b) is the average of this loss over all m examples.
- This cost comes from the statistical principle of maximum likelihood, and it is convex, so gradient descent can find the global minimum.
- A plot shows the better-fitting decision boundary has a lower cost than a worse one.

**Remember.** J = average of -y log f - (1 - y) log(1 - f).
