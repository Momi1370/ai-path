---
id: XkY2DOUCWMU
title: Matrix multiplication as composition
source: 3Blue1Brown
duration: 
chapters: 7, 14, 15
basis: notes
---
**What it teaches.** What multiplying two matrices means.

**Key points**
- A matrix is a transformation of space. Multiplying two matrices gives the single transformation you get by doing both, one after the other.
- Read the product from right to left: in M2 M1, the transformation M1 is applied first, then M2.
- Order matters: M2 M1 is generally not the same as M1 M2. A rotation followed by a shear differs from a shear followed by a rotation.
- Multiplication is associative, because composing three transformations does not depend on how you group them.
- This is the picture behind the matrix products of a neural network layer: each layer is one transformation.

**Remember.** A matrix product = do one transformation, then the other.
