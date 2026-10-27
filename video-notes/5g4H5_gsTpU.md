---
id: 5g4H5_gsTpU
title: Checking gradient descent for convergence
source: Andrew Ng, DeepLearning.AI
duration: 5:40
chapters: 6
basis: transcript
---
**What it teaches.** How to tell whether gradient descent is working.

**Key points**
- Plot the cost J against the number of iterations (the learning curve).
- If it works, J goes down on every single iteration. If J ever goes up, alpha is probably too large or there is a bug.
- The curve flattens when the algorithm has converged. The number of iterations needed varies a lot between problems.
- An automatic convergence test (stop when J drops by less than a small epsilon) is possible, but looking at the curve is more informative and warns you early.

**Remember.** The learning curve should fall on every iteration, then flatten.
