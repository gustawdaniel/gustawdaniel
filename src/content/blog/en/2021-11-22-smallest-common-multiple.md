---
author: Daniel Gustaw
canonicalName: smallest-common-multiple
coverImage: http://localhost:8484/2584a854-c1e8-458d-8add-5e70e49ef101.avif
description: Solution to the "Archery" problem from the "Number Theory" section of "Hacker Earth". The task is to determine the least common multiple of a sequence of numbers.
excerpt: Solution to the "Archery" problem from the "Number Theory" section of "Hacker Earth". The task is to determine the least common multiple of a sequence of numbers.
publishDate: 2021-11-22T14:38:00.000Z
slug: en/least-common-multiple
tags: ['javascript', 'numbers-therory', 'mathematica']
title: Least Common Multiple - Number Theory
updateDate: 2021-11-22T14:38:00.000Z
---

In the Hacker Earth platform, you can find many interesting tasks for programmers.

One of them: "Archery" is presented in this post along with a discussion of the solution.

### Problem Statement

Problem

`N` archers shoot arrows at targets. There is an infinite number of targets numbered from 1. Archer `i` shoots at all targets that are multiples of `k_i`.

Find the smallest target hit by all archers.

Input

The first line contains an integer T - the total number of test cases.

Below are T test cases. Each test case has the following format:

The first line contains a natural number - N - the number of archers. The second line contains N integers separated by spaces, where each subsequent number indicates the value of `k_i` for the archer.

Output

For each test case, print on a new line **the smallest target hit by all archers.**

Constraints

```
1 <= T <= 5
1 <= N <= 15
1 <= k_i <= 48
```

![](http://localhost:8484/8125dd8c-e9dc-4dd9-ab8c-cdbaaf274cc1.avif)

Explanation

The first archer shoots at targets 2, 4, 6, 8, 10, 12, 14, ...

The second archer shoots at targets 3, 6, 9, 12, ...

The third archer shoots at targets 4, 8, 12, 16, 20, ...

The smallest target that all archers shoot at is 12.

### Solution

By taking the story of the archers out of the problem, we are left with the task of finding the least common multiple.

[Least common multiple - Wikipedia](https://en.wikipedia.org/wiki/Least_common_multiple)

Key formulas are:

* Fundamental theorem of arithmetic - every positive integer can be expressed as a unique product of its prime factors with appropriate powers

![](http://localhost:8484/20687346-ea6f-43fc-8b22-7a7573819554.avif)

* The least common multiple (lcm) of a pair of numbers will be calculated using this factorization.

![](http://localhost:8484/29216930-efaf-40f6-81e6-49f186d6a8fc.avif)

There are ways to calculate `lcm` without prime factorization, for example through the relationship with the greatest common divisor (gcd) and the Euclidean algorithm, but we will use prime factorization here.

#### Algorithm for Finding the Least Common Multiple

1. We factor the numbers into products of prime factors,
2. We select the maximum multiplicities of the prime factors
3. We multiply the prime factors, raising them to the number of their occurrences

We see that the first challenge is to factor the number.

#### Factorization of a Number into Prime Factors

In this topic, a graphical representation of the algorithm is very helpful.

![](http://localhost:8484/102c0a22-4b94-4642-97b0-6e96f9d9bd47.avif)

This algorithm is called "Trial division" and is the least efficient but the simplest to understand factorization algorithm. Other ones are listed here:

Before the implementation, let's establish a way to record the factorization result. We will use an object where the keys are the factors and the values are the quantities of their occurrences. For example, to record the number `12` which is `2 * 2 * 3`, we will create an object.

```json
{
  2: 2,
  3: 1
}
```

The code will be used for factorization calculations.

```javascript
function divideTimes(n, i) {
    let counter = 0;
    while(n % i === 0) {
        counter++;
        n = n / i;
    }
    return counter;
}

function primeFactors(n) {
    if(n === 1) return { 1: 1 };
    const res = {};
    let p = 2
    while(n >= p*p) {
        if(n % p === 0) {
            res[p] = divideTimes(n,p);
            n /= Math.pow(p, res[p]);
        } else {
            p++
        }
    }
    if(n > 1) {
        res[n] = 1;
    }
    return res;
}
```

#### Skipping Repeating Factors in Multiplication

```
function mergeKeysChoosingMaxValue(prev, next) {
    for(let key of Object.keys(next)) {
        if(prev.hasOwnProperty(key)) {
            prev[key] = Math.max(prev[key], next[key]);
        } else {
            prev[key] = next[key];
        }
    }
    return prev;
}
```

#### Evaluation of the value of a number from its factors

Finally, we want to display numbers to the user rather than their factorization, so we will switch from the factored format to the pure numerical value.

```
function evaluate(object) {
    return Object.keys(object).reduce((prev, key) => {
        return prev * Math.pow(Number(key), object[key]);
    },1)
}
```

#### Integration of the solution with the program's input and output format

We still need to connect the components we wrote to the input and output format required by the task. The first part of the code reads data from the standard stream and runs the `main` function on it.

```
process.stdin.resume();
process.stdin.setEncoding("utf-8");
let stdin_input = "";

process.stdin.on("data", function (input) {
    stdin_input += input;
});

process.stdin.on("end", function () {
   main(stdin_input);
});
```

The second part consists of code processing lines of text into arrays of numbers in the `main` function and performing the task in the `minCommonDiv` function.

```
function minCommonDiv(k) {
    const factorized = k.map(primeFactors);
    return evaluate(factorized.reduce(mergeKeysChoosingMaxValue))
}

function main(input) {
    const lines = input.split('\n').filter(line => Boolean(line));
    const T = Number.parseInt(lines.shift());
    const out = [];
    for(let i=0; i<T; i++) {
        lines.shift();
        const k = lines.shift().split(/\s+/).map(n => Number.parseInt(n));
        const res = minCommonDiv(k);
        out.push(res);
    }

    process.stdout.write(out.join("\n") + "\n");
}
```

The program assuming that we will save the input to `input.txt` and the program to `app.js`, we can check our solution with the command:

```
cat input.txt | node app.js
```
