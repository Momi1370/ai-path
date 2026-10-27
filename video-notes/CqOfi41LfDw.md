---
id: CqOfi41LfDw
title: The Essential Main Ideas of Neural Networks
source: StatQuest, Josh Starmer
duration: 18:54
chapters: 14
basis: notes
---
**What it teaches.** A gentle picture of what a neural network does: fit a squiggle.

**Key points**
- A neural network is a way to fit a flexible curve (a squiggle) to data that a straight line cannot follow, for example how effective a drug is at different doses.
- Nodes in the hidden layer each apply an activation function (softplus, ReLU or sigmoid) to a weighted input plus a bias. This bends the input into a curve.
- The curves from several hidden nodes are scaled by more weights and added together. The result is the final squiggle.
- Weights and biases are learned from the data. More hidden nodes give a more flexible curve.

**Remember.** Hidden nodes make bent pieces; the output adds the pieces into one curve.
