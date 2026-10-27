---
id: BfKanl1aSG0
title: Logistic Regression Details Pt 2: Maximum Likelihood
source: StatQuest, Josh Starmer
duration: 10:23
chapters: 10
basis: transcript
---
**What it teaches.** How the S-shaped curve of logistic regression is fitted: by maximum likelihood, not least squares. An optional deeper look behind the log loss.

**Key points**
- Logistic regression works on the log odds scale, where the raw data sits at plus and minus infinity, so ordinary residuals cannot be used.
- Instead, try a candidate line, convert it to a curve of probabilities, and ask for each mouse: how likely is its observed status (obese or not) under this curve?
- For an obese mouse the likelihood is the height of the curve at its weight; for a not-obese mouse it is 1 minus that height.
- Multiply the likelihoods of all mice to get the likelihood of the curve. Statisticians take the log of it and add the logs, because the curve that maximizes one also maximizes the other.
- Pick the curve with the highest log-likelihood. Maximizing log likelihood is the same as minimizing the log loss in Ng's cost function.

**Remember.** Best curve = the one that makes the observed data most probable.
