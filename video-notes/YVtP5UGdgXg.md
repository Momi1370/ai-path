---
id: YVtP5UGdgXg
title: Feature scaling part 1
source: Andrew Ng, DeepLearning.AI
duration: 6:35
chapters: 8
basis: transcript
---
**What it teaches.** Why features with very different ranges make gradient descent slow.

**Key points**
- House size is in the thousands of square feet; bedrooms are 1 to 5. A good weight for size is small, a good weight for bedrooms is large.
- On the contour plot of the cost, that makes tall thin ellipses. Gradient descent bounces back and forth and takes a long time.
- If the features are rescaled to comparable ranges, the contours become rounder and gradient descent takes a direct path to the minimum.

**Remember.** Different units fight each other during training; put features on one scale.
