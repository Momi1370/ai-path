---
id: tIeHLnjs5U8
title: Backpropagation calculus (Deep Learning Chapter 4)
source: 3Blue1Brown
duration: 
chapters: 14, 15
basis: notes
---
**What it teaches.** The maths of backpropagation, which is the chain rule.

**Key points**
- Start with the simplest network: one neuron per layer. The cost depends on the weight through a chain: weight, then the weighted sum z, then the activation a, then the cost.
- The chain rule multiplies the sensitivities along that chain to get the derivative of the cost with respect to the weight.
- The derivative with respect to the bias and with respect to the previous activation use the same pieces.
- With many neurons per layer the idea is the same, with indices for which neuron and which layer, and a sum over the neurons in the next layer.
- Software libraries compute all of this automatically, so you rarely do it by hand.

**Remember.** Backpropagation is the chain rule applied layer by layer.
