---
id: IHZwWFHWa-w
title: Gradient descent, how neural networks learn (Deep Learning Chapter 2)
source: 3Blue1Brown
duration: 20:33
chapters: 14, 6
basis: notes
---
**What it teaches.** How a network learns from training examples.

**Key points**
- A cost function scores the whole network: for one example, add up the squared differences between the output activations and the desired ones; then average over all training examples.
- The cost is a function of all 13,002 weights and biases. Gradient descent nudges them all in the direction that lowers the cost fastest (the negative gradient).
- The size of each component of the gradient shows which weights matter most for the cost.
- Backpropagation, the next chapter, is the fast way to compute the gradient.
- A caution: in the example the network does not learn the neat edge-and-loop features hoped for; it finds some working pattern, and it struggles with random noise inputs.

**Remember.** Learning = repeated small steps downhill on a cost that depends on every weight.
