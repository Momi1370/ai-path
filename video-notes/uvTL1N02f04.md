---
id: uvTL1N02f04
title: Vectorization part 2
source: Andrew Ng, DeepLearning.AI
duration: 6:53
chapters: 7
basis: transcript
---
**What it teaches.** Why vectorized code is faster, and how it helps the gradient descent update.

**Key points**
- A vectorized operation lets the computer do many multiplications at the same time in parallel hardware, instead of one after another in a loop.
- Example: updating 16 weights. Without vectorization you loop and update w1, w2 and so on one by one. With vectorization you write one line: w = w - 0.1 * d, where d holds all 16 derivatives.
- Ng says it was mind-blowing the first time he timed the two versions.

**Remember.** One line, all parameters at once.
