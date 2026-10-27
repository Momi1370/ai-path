---
id: _L39rN6gz7Y
title: Decision and Classification Trees, Clearly Explained!!!
source: StatQuest, Josh Starmer
duration: 18:08
chapters: 13
basis: notes
---
**What it teaches.** How a decision tree is built, using Gini impurity.

**Key points**
- A tree asks yes or no questions at its nodes and ends in leaves that hold a prediction.
- To pick the question for a node, compute the Gini impurity of the leaves each candidate would create: 1 minus the sum of squared class shares. A pure leaf scores 0. Weigh each leaf by how many rows it holds, and add. The candidate with the lowest weighted impurity wins.
- For a numeric feature such as age, sort the values, try the midpoint between each neighbouring pair as a cutoff, and keep the best.
- Build the tree top-down. Use a feature again on a branch only if it reduces impurity there; stop when no split improves it.
- Worked example in the notes: 6 accepted and 4 not accepted gives 0.48; after a good split the weighted impurity is 0.40.

**Remember.** Pick the split that leaves the purest groups.
