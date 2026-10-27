---
id: U6zuBcmLxSg
title: Vectorization part 1
source: Andrew Ng, DeepLearning.AI
duration: 6:55
chapters: 7
basis: transcript
---
**What it teaches.** Vectorization: writing the model without loops.

**Key points**
- Vectorized code is shorter and runs much faster, and can use fast linear algebra libraries and even GPUs.
- Without vectorization you write a loop over j from 0 to n-1 that adds w[j] times x[j], then add b. In Python range(n) stops at n-1.
- With NumPy, `np.dot(w, x) + b` does the same job in one line.

**Remember.** Replace the loop with one NumPy call: shorter to read and much quicker to run.
