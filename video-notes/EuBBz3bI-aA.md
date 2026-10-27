---
id: EuBBz3bI-aA
title: Machine Learning Fundamentals: Bias and Variance
source: StatQuest, Josh Starmer
duration: 6:36
chapters: 11
basis: transcript
---
**What it teaches.** Bias and variance, with one example of mouse weight and height.

**Key points**
- The true relationship between weight and height is a curve. Split the data into a training set and a testing set.
- A straight line (linear regression) cannot bend, so it cannot match the curve: it has high bias. But its sum of squares is similar on different data sets, so it has low variance.
- A wiggly curve that passes through every training point fits the training set perfectly (distances all zero), but its error on testing data changes a lot from one data set to another: low bias, high variance. It overfits.
- What we want is a model with low bias and low variance, found by balancing simple and complex models. The video names regularization, boosting and bagging (random forest) as ways to find that balance.

**Remember.** High bias = too simple, misses the pattern. High variance = too wiggly, memorizes the noise.
