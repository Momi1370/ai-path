---
id: aircAruvnKk
title: But what is a neural network? (Deep learning chapter 1)
source: 3Blue1Brown
duration: 18:40
chapters: 14
basis: notes
---
**What it teaches.** What a neural network is, using handwritten digits.

**Key points**
- A 28 by 28 picture has 784 pixels. Each pixel feeds a neuron holding a number between 0 and 1 (its activation).
- The example network has a layer of 784 inputs, two hidden layers of 16 neurons, and 10 outputs, one per digit. The brightest output is the answer.
- The hope: early layers detect small pieces (edges), later layers combine them (loops, lines), and the last layer assembles digits.
- Each neuron computes a weighted sum of the previous layer's activations plus a bias, then squashes it with an activation function (the sigmoid here; ReLU is mostly used now).
- This network has 13,002 weights and biases. Learning means finding good values for all of them.

**Remember.** A network is a function with thousands of adjustable numbers.
