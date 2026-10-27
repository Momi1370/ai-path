---
id: vP06aMoz4v8
title: Machine Learning Fundamentals: Sensitivity and Specificity
source: StatQuest, Josh Starmer
duration: 11:46
chapters: 12
basis: notes
---
**What it teaches.** Two numbers that summarize a confusion matrix.

**Key points**
- Sensitivity (also called recall or true positive rate) = true positives / (true positives + false negatives). Of the people who really have the disease, how many did we find?
- Specificity = true negatives / (true negatives + false positives). Of the people who are healthy, how many did we correctly clear?
- Use them to pick a model: if missing a sick patient is the worst error, choose the model with higher sensitivity; if false alarms are costly, choose higher specificity.
- With more than two classes, calculate them one class at a time: treat that class as positive and all the others together as negative.

**Remember.** Sensitivity = catch rate for the positives; specificity = catch rate for the negatives.
