---
author: Daniel Gustaw
canonicalName: maximum-inequality-linear-search-rust-and-typescript
coverImage: http://localhost:8484/3e9e4456-ce05-4bd0-b136-7bbd4c952edd.avif
date_updated: 2022-11-28 16:54:20+00:00
description: Simple hackeartch task solved in node js and rust. You con compare these
  two languages on example of this problem. I recommend to solve it independently
  before reading solutions.
excerpt: Simple hackeartch task solved in node js and rust. You con compare these
  two languages on example of this problem. I recommend to solve it independently
  before reading solutions.
publishDate: 2022-11-28 16:54:21+00:00
slug: en/maximum-inequality
tags:
- linear-search
- rust
- nodejs
- typescript
title: Maximum Inequality [Linear Search] rust and typescript
---



**Problem**

A function on a binary string *T* of length *M* is defined as follows:

*F(T)* = number of indices*i (1≤i<M)* such that Ti≠Ti+1.

You are given a binary string *S*of length *N*. You have to divide string *S* into two subsequences*S1,S2* such that:

* Each character of string *S* belongs to one of S1 and S2.
* The characters of S1and S2.must occur in the order they appear in *S.*

Find the maximum possible value of F(S1)+F(S2).

**NOTE:**A binary string is a string that consists of characters \`*0*\` and \`*1*\`. One of the strings S1, S2 can be empty.

**Input format**

* The first line contains *T*denotingthe numberof test cases. The description of *T* test cases is as follows:
* For each test case:
* The first line contains *N*denoting the size of string *S*.
* The second line contains the string *S.*

**Output format**
For each test case, print the maximum possible value of F(S1)+F(S2) in a separate line.

**Constraints**

```
1≤T≤10^5
1≤N≤10^5
∣S∣=N $$
S contains characters ′0′ and ′1′.
Sum of N over all test cases does not exceed 2 ⋅ 10^5.
```

Sample Input

```
3
3
011
4
1100
5
11111
```

Sample Output

```
1
2
0
```

**Explanation**

**The first test case**

* One possible division is S1=011,S2="" (empty string). Here F(S1)+F(S2)=1+0=1. There is no way to divide the given string to obtain a greater answer.

**The second test case**

* The optimal division is S1=10,S2=10. Here F(S1)+F(S2)=1+1=2. There is no way to divide the given string to obtain a greater answer.

**The third test case**

* For any possible division of *S*, F(S1)+F(S2)=0.

# Solution

I will describe method and then present code in javascript and rust.

## Method

To solve this problem we can create two pointers - one for any head of subsequence. Then we changing first sequence value as soon as possible. In other case we changing second. Any change should increment counter of changes. This simple algorithm has O(n) complexity.

## Node JS Solution

In `node` solution we will use `readline` module. It allow to create interface which throws events connected with reading from standard input.

```typescript
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
```

We will be able to add event listeners on `rl` object but now lets create `input_array` which will be filled by subsequent lines.

```typescript
const input_array:string[] = []
```

Now we can listen on any added line in standard input, and append them to this array.

```typescript
rl.on('line', (line: string) => {
    input_array.push(line);
});
```

When input will be closed then We want to build output and pass it to standard output:

```typescript
rl.once('close', () => {
    let index = 0;
    let T = parseInt(input_array[index++].trim(), 10);
    for (let t_i = 0; t_i < T; t_i++) {
        let N = parseInt(input_array[index++].trim(), 10);
        let S = input_array[index++].trim();

        let out_ = solve(N, S);
        rl.output.write(out_.toString());
        rl.output.write('\n');
    }

    process.exit();
});
```

we are using there `solve` function that will find maximum number of changes in both. So there is implementation of `solve` function.

```typescript
function solve(N: number, S: string) {
    let s1: string = '';
    let s2: string = '';
    let changes = 0;

    for (let i=0; i<N; i++) {
        const v = S[i];
        if (!s1) {
            s1 = v;
        } else if (!s2 && v === s1) {
            s2 = v;
        } else if (s1 !== v) {
            s1 = v;
            changes++;
        } else if (s2 && s2 !== v) {
            s2 = v;
            changes++;
        }
    }

    return changes;
}
```

This is end of typescript, but worth to present test. We will not use `jest`, `ava` or `mocha` that are designed to test code internally. Instead I decided to test program by blackbox test written in `shunit2`. There is `text` file with test data

```text
3
3
011
4
1100
5
11111
```

From exercise content we know that solutions are `1` ,`2` and `0`. So my test is written in `equality_test.sh`

```bash
#! /bin/sh

testEquality() {
  RES=$(cat < text | ts-node index.ts)
  EXP=$(printf "1\n2\n0")
  assertEquals "${EXP}" "${RES}"
}

# Load shUnit2.
. /usr/share/shunit2/shunit2
```

Finally github action workflow

```yml
name: Node.js CI

on:
  push:
    branches: [ "main" ]
    paths: [ "node" ]

env:
  working-directory: ./node

jobs:
  build:

    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: ${{ env.working-directory }}

    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]

    steps:
      - uses: actions/checkout@v3
      - name: Install shunit
        run: sudo apt install -y shunit2
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: ${{ env.working-directory }}/package-lock.json
      - run: npm ci
      - run: npm install -g ts-node
      - run: npm run build --if-present
      - run: npm test
```

## Rust Solution

In rust we divided project to 2 files. Almost empty `main.rs`

```rust
use linear_search_max_inequality::max_inequality;
use std::io;

fn main() -> io::Result<()>{
    max_inequality(&mut io::stdin(), &mut io::stdout())
}
```

and `lib.rs` with all logics and unit tests. Lets start from tests

```rust
use std::io::{Write, Read, Error};
use std::fmt::{Display, Formatter};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn printing_in_new_lines_test() {
        let vec = NumVec(vec![0,1,2]);
        assert_eq!(format!("{}", vec), "0\n1\n2");
    }

    #[test]
    fn test_of_single_series_001_test() {
        let res = compute_max_inequality(3, "001");
        assert_eq!(res, 1);
    }

    #[test]
    fn test_of_single_series_1100_test() {
        let res = compute_max_inequality(4, "1100");
        assert_eq!(res, 2);
    }

    #[test]
    fn test_of_single_series_11111_test() {
        let res = compute_max_inequality(5, "11111");
        assert_eq!(res, 0);
    }


    #[test]
    fn string_new_test() {
        let s1 = String::new();
        assert_eq!(s1, "".to_string());
    }

    #[test]
    fn max_inequality_001_test() {
        let mut out: Vec<u8> = Vec::new();

        max_inequality(&mut "1
3
001".as_bytes(), &mut out).unwrap();

        assert_eq!(out, b"1\n");
    }
}
```

Reading tests we can see that there is function `compute_max_inequality` that solving main problem and `max_inequality` to handle input and output properly.

Solving problem is generally copy from node solution with a little complications from necessity of conversion chars to strings.

```rust
fn compute_max_inequality(_length: u32, series: &str) -> u32 {
    let mut s1:String = String::new();
    let mut s2:String = String::new();
    let mut changes = 0u32;

    for c in series.chars() {
        let v = c.to_string();
        if s1 == "" {
            s1 = v;
        } else if s2 == "" && s1 == v {
            s2 = v
        } else if s1 != v {
            s1 = v;
            changes+=1;
        } else if s2 != "" && s2 != v {
            s2 = v;
            changes+=1;
        }
    }

    changes
}
```

other problem that was typical only for rust is a little overengineered printing vector to new lines

```rust
struct NumVec(Vec<u32>);

impl Display for NumVec {
    fn fmt(&self, f: &mut Formatter) -> Result<(), std::fmt::Error> {
        let mut out = String::new();

        for num in &self.0[0..self.0.len() - 1] {
            out.push_str(&num.to_string());
            out.push_str("\n");
        }

        out.push_str(&self.0[self.0.len() - 1].to_string());
        write!(f, "{}", out)
    }
}
```

Finally main function that read lines and compute results.

```
pub fn max_inequality(
    input: &mut impl Read,
    output: &mut impl Write,
) -> Result<(), Error> {
    let mut buffer = "".to_string();

    input.read_to_string(&mut buffer)?;

    let mut iterator = buffer.split("\n");

    iterator.next();

    let mut results:Vec<u32> = vec![];

    while let Some(length) = iterator.next() {
        let length: u32 = length.parse().unwrap();
        let series = if let Some(series) = iterator.next() { series } else { "" };
        results.push(compute_max_inequality(length, series));
    }

    let out = format!("{}\n", NumVec(results));

    output.write_all(out.as_bytes())?;

    Ok(())
}
```

Rust workflow in github is pretty standard

```yaml
name: Rust

on:
  push:
    branches: [ "main" ]
    paths: [ "rust" ]

env:
  CARGO_TERM_COLOR: always
  working-directory: ./rust

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - name: Build
        run: cargo build --verbose
        working-directory: ${{ env.working-directory }}

  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: cargo test --verbose
        working-directory: ${{ env.working-directory }}
```

[linear-sort-maximum-inequality-rust-node](https://github.com/gustawdaniel/linear-sort-maximum-inequality-rust-node)
