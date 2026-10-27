---
id: fSytzGwwBVw
title: Machine Learning Fundamentals: Cross Validation
source: StatQuest, Josh Starmer
duration: 6:04
chapters: 12
basis: notes
---
**What it teaches.** How to use your data fairly when you both train and test.

**Key points**
- Testing on the same data you trained on tells you nothing about new data. A single train-test split depends on luck of which rows land in the test part.
- Cross validation splits the data into blocks (folds). Each block takes a turn as the test set while the others train, and you average the results.
- Four blocks is the example; ten is common. Leave-one-out uses a single row as each test set.
- Use the average score to compare methods, or to tune a setting such as the regularization strength.

**Remember.** Every row gets to be test data once.
