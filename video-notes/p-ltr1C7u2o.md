---
id: p-ltr1C7u2o
title: Classification: why not linear regression
source: Andrew Ng, DeepLearning.AI
duration: 9:48
chapters: 9
basis: transcript
---
**What it teaches.** Why a straight-line regression is the wrong tool for yes-or-no problems.

**Key points**
- Classification has an output y that takes one of a few values, often 0 (no, negative class) and 1 (yes, positive class).
- Example: tumour size against malignant (1) or benign (0). Fitting a straight line and thresholding at 0.5 works only for some data sets.
- One extra far-away example can tilt the line and move the threshold, so points that were classified correctly are suddenly wrong.
- An output below 0 or above 1 makes no sense as a yes or no. This motivates logistic regression.

**Remember.** A line extends forever; a probability must stay between 0 and 1.
