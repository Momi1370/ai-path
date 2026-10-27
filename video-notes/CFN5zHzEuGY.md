---
id: CFN5zHzEuGY
title: Cost function formula
source: Andrew Ng, DeepLearning.AI
duration: 9:05
chapters: 5
basis: transcript
---
**What it teaches.** How to build the cost function that scores how well a line fits.

**Key points**
- The model is f(x) = w x + b. If w = 0.5 and b = 0 the line passes through the origin with slope 0.5; b is the y-intercept.
- The error of one example is y-hat minus y. Square it so negative and positive errors do not cancel.
- Sum the squared errors over all m examples, then divide by m so the cost does not simply grow with the data set.
- By convention the cost divides by 2m, which makes the later derivative tidier. This is the squared-error cost J(w, b).
- Goal: find w and b that make J as small as possible.

**Remember.** Cost = average squared mistake (with an extra 1/2). Small cost means a good fit.
