---
id: Xm2C_gTAl8c
title: Ridge vs Lasso Regression, Visualized!!!
source: StatQuest, Josh Starmer
duration: 9:06
chapters: 11
basis: notes
---
**What it teaches.** The difference between the two common penalties, shown with pictures.

**Key points**
- Ridge (L2) adds lambda times the squared weights to the cost. It shrinks weights toward zero but almost never makes one exactly zero.
- Lasso (L1) adds lambda times the absolute value of the weights. It can shrink weights all the way to exactly zero, so it removes features and acts as automatic feature selection.
- Both reduce variance by accepting a little bias: the line is a bit worse on the training data and better on new data.
- Rule of thumb: ridge when most features matter a bit, lasso when you suspect many are useless.

**Remember.** Ridge shrinks; lasso shrinks and can delete.
