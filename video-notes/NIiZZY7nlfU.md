---
id: NIiZZY7nlfU
title: Cost function with regularization
source: Andrew Ng, DeepLearning.AI
duration: 9:03
chapters: 11
basis: notes
---
**What it teaches.** How regularization changes the cost function.

**Key points**
- Add a penalty to the cost: lambda divided by 2m times the sum of the squared weights. The model now balances two goals: fit the data (the usual cost) and keep the weights small (the penalty).
- Lambda is the regularization strength. Lambda = 0 means no penalty, so the model can overfit. A huge lambda forces every weight toward 0, so the model becomes almost a flat line (f = b) and underfits.
- You pick a lambda in between, by checking performance on data the model has not trained on.
- The penalty usually leaves b out.

**Remember.** Cost = how wrong it is + lambda x how big the weights are.
