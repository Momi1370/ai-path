---
id: EkAQAi3a4js
title: Multiple Regression, Clearly Explained!!!
source: StatQuest, Josh Starmer
duration: 5:25
chapters: 7
basis: transcript
---
**What it teaches.** Multiple regression is linear regression with more than one predictor, and it lets you test whether a new predictor is worth collecting.

**Key points**
- It adds more dimensions to the model: instead of body length from mouse weight alone, use weight and tail length. The fitted shape is a plane (or a higher-dimensional object), still found by least squares.
- R squared is calculated the same way, but it is adjusted for the extra parameters, so adding a useless predictor cannot raise it for free.
- A p-value for the whole model comes from an F statistic, as for simple regression.
- The key trick: compare the simple model (without tail length) with the multiple model (with it). A small p-value means the extra predictor is worth the trouble of collecting.

**Remember.** A predictor earns its place only if the bigger model beats the smaller one by more than chance.
