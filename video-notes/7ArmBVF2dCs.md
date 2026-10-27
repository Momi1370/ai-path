---
id: 7ArmBVF2dCs
title: Linear Regression, Clearly Explained!!!
source: StatQuest, Josh Starmer
duration: 27 min
chapters: 4, 5, 12
basis: transcript
---
**What it teaches.** The statistician's view of linear regression: least squares, R squared, and a p-value. An optional backup if the cost function felt fuzzy.

**Key points**
- Least squares: draw a line through the data, measure each point's distance to it, square the distances, add them up, and keep the line with the smallest sum. This is the same idea as the squared-error cost in Ng's course.
- R squared compares the variation around the mean with the variation around the fitted line: (variation around the mean minus variation around the line) divided by the variation around the mean. It says how much of the variation the line explains.
- With more predictors (the example adds tail length to mouse weight) least squares estimates an intercept and one number per predictor.
- A p-value, from an F statistic that uses the number of parameters in the fit line and in the mean line, says whether the relationship could be chance.

**Remember.** R squared near 1 means the line explains most of the variation.
