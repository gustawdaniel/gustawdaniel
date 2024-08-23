---
author: Daniel Gustaw
canonicalName: codingame-best-fit-to-data-rust-regression-analysis
coverImage: https://ucarecdn.com/5b6dbf3a-bdb7-428d-9017-948141dc0725/
date_updated: 2023-01-22 23:09:20+00:00
description: Linear and logarithmic regressions were derived here. Models were fitted
  in rust language. This article shows that sometimes it's worth improving the theoretical
  model before starting implementation.
excerpt: Linear and logarithmic regressions were derived here. Models were fitted
  in rust language. This article shows that sometimes it's worth improving the theoretical
  model before starting implementation.
publishDate: 2023-01-22 23:09:20+00:00
slug: en/regression
tags:
- regression
- rust
- mathematics
- codingame
title: 'CodinGame: Best fit to data - Rust - Regression Analysis'
---



We will discuss exercise:

[Coding Games and Programming Challenges to Code Better

CodinGame is a challenge-based training platform for programmers where you can play with the hottest programming topics. Solve games, code AI bots, learn from your peers, have fun.

![](https://static.codingame.com/assets/apple-touch-icon-152x152-precomposed.5cb052db.png)CodinGame

![](https://files.codingame.com/codingame/codingame_share_pics.jpg)](https://www.codingame.com/ide/puzzle/blunder-episode-3)

Goal is find best fitting model for given dataset. For example for data:

![](https://ucarecdn.com/a0d8ebee-eb4d-49f1-b261-5260c0f20dc1/)

we should print `O(log n)`. We can select models from list:

* O(1),
* O(log n),
* O(n),
* O(n log n),
* O(n^2),
* O(n^2 log n),
* O(n^3),
* O(2^n)

Input of program will contain first line with number of next lines and any following line will contain `n` and `t` values.

There are constrains:

```
5 < N < 1000
5 < num < 15000
0 < t < 10000000
```

and exemplary input:

```
10
5 341
1005 26324
2005 52585
3005 78877
4005 104925
4805 125920
6105 159156
7205 188017
8105 211417
9905 258991
```

should give to us

```
O(n)
```

because of is is similar to linear growth.

