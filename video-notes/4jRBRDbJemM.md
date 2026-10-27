---
id: 4jRBRDbJemM
title: ROC and AUC, Clearly Explained!
source: StatQuest, Josh Starmer
duration: 16:17
chapters: 12
basis: notes
---
**What it teaches.** How to judge a classifier across every possible threshold, not just 0.5.

**Key points**
- A model such as logistic regression gives probabilities. Each threshold (0.5, 0.2, 0.9 ...) gives a different confusion matrix.
- The ROC curve plots the true positive rate (sensitivity) against the false positive rate (1 minus specificity) for all thresholds. Each point on the curve is one threshold.
- The diagonal line is a model that guesses at random. The closer the curve gets to the top-left corner, the better the model. Use the curve to choose the threshold that suits your costs.
- AUC, the area under the curve, is one number for comparing models: 0.5 is random, 1.0 is perfect.
- When the positive class is rare, precision (true positives / predicted positives) is often more informative than the false positive rate.

**Remember.** ROC shows the trade-off; AUC scores it with one number.
