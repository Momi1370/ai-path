---
id: gmJqLGrUscg
title: Feature scaling part 2
source: Andrew Ng, DeepLearning.AI
duration: 7:35
chapters: 8
basis: transcript
---
**What it teaches.** Three ways to rescale.

**Key points**
- Divide by the maximum: size from 3 to 2000 becomes about 0.0015 to 1.
- Mean normalization: subtract the mean, divide by (max minus min); results lie roughly between -1 and 1.
- Z-score normalization: subtract the mean mu and divide by the standard deviation sigma. For mean 600 and sigma 450 the result is centred on 0.
- A feature roughly between -1 and 1 is ideal; anything within about -3 to 3 is fine, but much smaller or larger ranges deserve rescaling.
- Rescaling makes training faster and never hurts. Next question: how do you check that gradient descent is actually converging?

**Remember.** Z-score = (x - mean) / standard deviation.
