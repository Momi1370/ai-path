---
id: Ilg3gGewQ5U
title: Backpropagation, intuitively (Deep Learning Chapter 3)
source: 3Blue1Brown
duration: 
chapters: 14
basis: notes
---
**What it teaches.** The intuition of backpropagation, without the calculus.

**Key points**
- For one training example, ask how every weight, bias and earlier activation should change to make the output closer to the right answer. A wrong output neuron wants its activation to go up or down by an amount.
- Weights attached to bright neurons and large errors matter most, since changing them has the biggest effect.
- Each neuron in the layer before also wants to change, and that desire is passed back layer by layer. This backward flow is backpropagation.
- Averaging the nudges over all training examples gives the gradient. Doing so for every example is slow, so training uses mini-batches (stochastic gradient descent): a rough but fast approximation.

**Remember.** Errors flow backwards to tell each weight which way to move.
