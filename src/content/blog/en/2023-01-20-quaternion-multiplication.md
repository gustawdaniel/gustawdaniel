---
author: Daniel Gustaw
canonicalName: codingame-quaternion-multiplication-rust-nodejs-parsing-algebra
coverImage: https://ucarecdn.com/d49f26ae-0d28-40ec-a9ec-a242c016b45d/
date_updated: 2023-01-20 02:19:57+00:00
description: In this article, we will see how to implement the multiplication of quaternions
  in Rust and NodeJS. You will learn about parsing and algebra.
excerpt: In this article, we will see how to implement the multiplication of quaternions
  in Rust and NodeJS. You will learn about parsing and algebra.
publishDate: 2023-01-20 02:19:57+00:00
slug: en/quaternion-multiplication
tags:
- quaternion
- rust
- nodejs
- algebra
- mathematics
- parsing
title: 'CodinGame: Quaternion Multiplication - Rust, NodeJS - Parsing, Algebra'
---



In this article we will see how to implement the multiplication of quaternions in Rust and NodeJS. I encourage you to try solve this problem before seeing solutions. Below I attaching link to this exercise:

[Coding Games and Programming Challenges to Code Better

CodinGame is a challenge-based training platform for programmers where you can play with the hottest programming topics. Solve games, code AI bots, learn from your peers, have fun.

![](https://static.codingame.com/assets/apple-touch-icon-152x152-precomposed.5cb052db.png)CodinGame

![](https://files.codingame.com/codingame/codingame_share_pics.jpg)](https://www.codingame.com/training/medium/quaternion-multiplication)

The quaternions belong to a number system that extends the complex numbers. A quaternion is defined by the sum of scalar multiples of the constants **i**,**j**,**k** and **1**.
More information is available at:

[Quaternion -- from Wolfram MathWorld

The quaternions are members of a noncommutative division algebra first invented by William Rowan Hamilton. The idea for quaternions occurred to him while he was walking along the Royal Canal on his way to a meeting of the Irish Academy, and Hamilton was so pleased with his discovery that he scratche…

from Wolfram MathWorld

![](https://mathworld.wolfram.com/images/socialmedia/share.png)](https://mathworld.wolfram.com/Quaternion.html)

Consider the following properties:
**jk** = **i**
**ki** = **j**
**ij** = **k**
**i**² = **j**² = **k**² = **\-1**

These properties also imply that:
**kj** = **\-i**
**ik** = **\-j**
**ji** = **\-k**

The order of multiplication is important.

Your program must output the result of the product of a number of bracketed simplified quaternions.

**Pay attention to the formatting**
The coefficient is appended to the left of the constant.
If a coefficient is **1** or **\-1**, don't include the **1** symbol.
If a coefficient or scalar term is **0**, don't include it.
The terms must be displayed in order: a**i** + b**j** + c**k** + d.

**Example Multiplication**
(2i+2j)(j+1) = (2ij+2i+2j² +2j) = (2k+2i-2+2j) = (2i+2j+2k-2)

