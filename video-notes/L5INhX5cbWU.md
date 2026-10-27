---
id: L5INhX5cbWU
title: Visualization examples
source: Andrew Ng, DeepLearning.AI
duration: 6:01
chapters: 5, 6
basis: transcript
---
**What it teaches.** Reading the contour plot together with the line it describes.

**Key points**
- A point on the contour plot (for example w about -0.15 and b about 800) is one pair of parameters and corresponds to one specific line through the data. A far-off point gives a poor line with a large cost.
- The error of each data point is the vertical distance between the point and the line. The cost adds up the squares of those distances.
- Points near the centre of the rings give lines that fit close to the minimum possible sum of squared errors.
- Finding the centre by hand is not practical, so we need an algorithm: gradient descent.

**Remember.** Moving toward the centre of the rings = the line fits the data better.
