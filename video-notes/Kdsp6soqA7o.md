---
id: Kdsp6soqA7o
title: Machine Learning Fundamentals: The Confusion Matrix
source: StatQuest, Josh Starmer
duration: 7:12
chapters: 12
basis: notes
---
**What it teaches.** How to lay out a classifier's right and wrong answers in one table.

**Key points**
- Rows are what the model predicted, columns are what is actually true (some books swap them, so always read the labels).
- For a yes-or-no problem the four cells are true positives (predicted yes, was yes), false positives (predicted yes, was no), false negatives (predicted no, was yes) and true negatives (predicted no, was no).
- The diagonal holds the correct predictions; everything off the diagonal is a mistake.
- With more than two classes the matrix gets one row and one column per class. The video compares two models by laying out both matrices.

**Remember.** Check the labels first: which axis is predicted and which is actual?
