---
author: Daniel Gustaw
canonicalName: codingame-asci-art-rust-nodejs-strings-arrays-loops
date_updated: 2023-01-17 18:31:50+00:00
description: Solving this puzzle teaches how to manage strings and array arithmetics.
  You'll know how to split a string into separate parts and concatenate them into
  a new one. You can use indexes of arrays
excerpt: Solving this puzzle teaches how to manage strings and array arithmetics.
  You'll know how to split a string into separate parts and concatenate them into
  a new one. You can use indexes of arrays
publishDate: 2023-01-17 18:31:50+00:00
slug: en/asci-art-rust-nodejs
tags:
- rust
- nodejs
- strings
- arrays
- loops
title: 'CodinGame: ASCI Art - Rust, NodeJs - Strings, Arrays, Loops'
---


The goal of the problem is to simulate an old airport terminal display: your program must display a line of text in ASCII art.

You have to split strings, store them and recreate others. You can use data structures like arrays or hash tables.

It can be solved using the following concepts.

* [Strings](https://www.codingame.com/learn/strings)
* [Arrays](https://www.codingame.com/learn/arrays)
* [Loops](https://www.codingame.com/learn/loops)

## **The Goal**

In stations and airports you often see this type of screen:

![](../../../assets/2023-01-17/led_display.jpg)

Have you ever asked yourself how it might be possible to simulate this display on a good old terminal? We have: with ASCII art!

## Rules

ASCII art allows you to represent forms by using characters. To be precise, in our case, these forms are words. For example, the word "MANHATTAN" could be displayed as follows in ASCII art:

```
# #  #  ### # #  #  ### ###  #  ###
### # # # # # # # #  #   #  # # # #
### ### # # ### ###  #   #  ### # #
# # # # # # # # # #  #   #  # # # #
# # # # # # # # # #  #   #  # # # #
```

​Your mission is to write a program that can display a line of text in ASCII art in a style you are given as input.

## Game Input

**Input**

**Line 1:**the width `L` of a letter represented in ASCII art. All letters are the same width.

**Line 2:**the height `H` of a letter represented in ASCII art. All letters are the same height.

**Line 3:**The line of text `T`, composed of `N` ASCII characters.

**Following lines:**the string of characters ABCDEFGHIJKLMNOPQRSTUVWXYZ? Represented in ASCII art.

**Output**

The text `T` in ASCII art.
The characters a to z are shown in ASCII art by their equivalent in upper case.
The characters that are not in the intervals \[a-z\] or \[A-Z\] will be shown as a question mark in ASCII art.

**Constraints**

0 < `L` < 30
0 < `H` < 30
0 < `N` < 200

**Example 1**

**Input**

```
4
5
E
 #  ##   ## ##  ### ###  ## # # ###  ## # # #   # # ###  #  ##   #  ##   ## ### # # # # # # # # # # ### ###
# # # # #   # # #   #   #   # #  #    # # # #   ### # # # # # # # # # # #    #  # # # # # # # # # #   #   #
### ##  #   # # ##  ##  # # ###  #    # ##  #   ### # # # # ##  # # ##   #   #  # # # # ###  #   #   #   ##
# # # # #   # # #   #   # # # #  #  # # # # #   # # # # # # #    ## # #   #  #  # # # # ### # #  #  #
# # ##   ## ##  ### #    ## # # ###  #  # # ### # # # #  #  #     # # # ##   #  ###  #  # # # #  #  ###  #
```

**Output**

```
###
#
##
#
###
```

**Example 2**

**Input**

```
4
5
MANHATTAN
 #  ##   ## ##  ### ###  ## # # ###  ## # # #   # # ###  #  ##   #  ##   ## ### # # # # # # # # # # ### ###
# # # # #   # # #   #   #   # #  #    # # # #   ### # # # # # # # # # # #    #  # # # # # # # # # #   #   #
### ##  #   # # ##  ##  # # ###  #    # ##  #   ### # # # # ##  # # ##   #   #  # # # # ###  #   #   #   ##
# # # # #   # # #   #   # # # #  #  # # # # #   # # # # # # #    ## # #   #  #  # # # # ### # #  #  #
# # ##   ## ##  ### #    ## # # ###  #  # # ### # # # #  #  #     # # # ##   #  ###  #  # # # #  #  ###  #
```

**Output**

```
# #  #  ### # #  #  ### ###  #  ###
### # # # # # # # #  #   #  # # # #
### ### # # ### ###  #   #  ### # #
# # # # # # # # # #  #   #  # # # #
# # # # # # # # # #  #   #  # # # #
```

## Source

This exercise can be found on codingame.com

[Coding Games and Programming Challenges to Code Better

CodinGame is a challenge-based training platform for programmers where you can play with the hottest programming topics. Solve games, code AI bots, learn from your peers, have fun.

![](https://static.codingame.com/assets/apple-touch-icon-152x152-precomposed.5cb052db.png)CodinGame

![](https://files.codingame.com/codingame/codingame_share_pics.jpg)](https://www.codingame.com/ide/puzzle/ascii-art)

## Solution in NodeJs

We will have three directories: `node`, `rust` and `cases` with text inputs and outputs files. In `node` we can setup project using commands

```
npm init -y
tsc --init
```

in `tsconfig.json` we will change `target` to `ESNext` to be able to use `padEnd` in our code. Additionally we should install dev dependencies:

```
npm i -D @types/node typescript
```

### Reading lines

We want to pass input by standard input to program. Using module `readline` we can listen on lines and end of input. Any line will be added to `lines` array. When all input will be read, we will call `start` function that we will define later.

```typescript
import readlineModule from "readline";

const rl = readlineModule.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

const lines: string[] = [];
let readIndex = 0;

rl.on('line', (line: string) => {
    lines.push(line)
});

rl.on('close', () => {
    start();
})

function readline() {
    return lines[readIndex++];
}
```

Additionally we defined `readline` function that will give us next lines from `lines` array.

### Interface of class that process input

We will create class `Alphabet` that will need size of letter in `constructor`. Then we will save rows one by one and finally we need get array of rows for given string. We will focus on implementation later, but now let's see `start` function mentioned before:

```typescript
function start() {
    const L: number = parseInt(readline());
    const H: number = parseInt(readline());
    const T: string = readline();

    const a = new Alphabet(L, H);
    for (let i = 0; i < H; i++) {
        const ROW: string = readline();
        a.setRow(ROW);
    }

    const res = a.get(T);
    res.forEach((row) => {
        console.log(row.replace(/\s+$/, ''));
    });
}
```

this function will be called when input will be saved to `lines`. Now we can focus on implementation of `Alphabet`

### Processing rows

In `setRow` we adding lines to `rows` property, but `padEnd` allow to append spaces at the end of rows to simplify further processing.

```typescript
class Alphabet {
    l: number = 0;
    h: number = 0;
    rows: string[] = []

    constructor(L: number, H: number) {
        this.l = L;
        this.h = H;
    }

    setRow(line: string) {
        this.rows.push(line.padEnd((25 + 2) * this.l, " "));
    }

    get(word: string): string[] {
        const aPosition = 'A'.charCodeAt(0);
        let rows = [...new Array(this.h)].map(() => '');
        for (let letter of word) {
            let pos: number = letter.toUpperCase().charCodeAt(0) - aPosition;
            if (pos < 0 || pos > 25) pos = this.rows[0].length / this.l - 1;
            for (let i = 0; i < this.h; i++) {
                rows[i] += this.rows[i].substring(pos * this.l, (pos + 1) * this.l);
            }
        }
        return rows;
    }
}
```

Function `get` starts from getting asci code of `A`. Then we preparing empty output rows. For any letters from expected word we are computing position in our alphabeth using asci codes. Substrings correcponding to these letters are added to rows. Finally fulfilled rows are returned from method `get`.

### Shunit for node js

To test we can use `shunit2` because this framework can be applied to any language and is great to use in cases where we have to test input and output of bash commands.

This is our `shunit.sh` content

```bash
#!/bin/bash

testInOut() {
  for file in `ls ../cases/in*`
  do
    RES=$(cat < ${file} | ts-node index.ts)
    EXP=$(cat "${file/in/"out"}")
    assertEquals "${EXP}" "${RES}"
  done;
}

# Load shUnit2.
. /usr/share/shunit2/shunit2
```

There is fragment `${file/in/"out"}` - it means that we replacing `in` by `out` in paths to files. Files in `cases` are starting from `in` or `out` having rest of names the same. You can check them in github repository:

[asci-art-rust-node-js/cases at main · gustawdaniel/asci-art-rust-node-js

Contribute to gustawdaniel/asci-art-rust-node-js development by creating an account on GitHub.

![](https://github.githubassets.com/favicons/favicon.svg)GitHubgustawdaniel

![](https://opengraph.githubassets.com/eab81b748e6df897c8f1f504304f64535b3fe2515345883fefb716d3ffe7889d/gustawdaniel/asci-art-rust-node-js)](https://github.com/gustawdaniel/asci-art-rust-node-js/tree/main/cases)

Node workflow is the following

```yml
name: Node.js CI

on:
  push:
    branches: [ "main" ]
    paths: [ "node/**" ]

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

to make it working we should add proper `scripts` in `package.json`

```json
  "scripts": {
    "test": "./shunit.sh"
  },
```

## Solution in Rust

We will follow the same schema as in NodeJs. Our code can be divide to helpers, input/output processing and struct `Alphabet` with their methods.

### Helpers for string

In `src/main.rs` we can start file from

```rust
use std::io;

macro_rules! parse_input {
    ($x:expr, $t:ident) => ($x.trim().parse::<$t>().unwrap())
}

fn char_code_at(letter: char) -> u32 {
    u32::from(letter)
}

fn lpad(word: String, len: usize) -> String {
    format!("{:<1$}", word, len)
}

fn concat_str(a: &str, b: &str) -> String {
    a.to_string() + b
}

#[cfg(test)]
mod tests {
    use crate::{char_code_at, concat_str, lpad};

    #[test]
    fn char_code_at_test() {
        assert_eq!(char_code_at('A'), 65);
    }

    #[test]
    fn pad() {
        assert_eq!(lpad(String::from("ab"), 3).len(), 3);
    }

    #[test]
    fn concat() {
        assert_eq!(concat_str("a", "b"), "ab");
    }
}
```

there are one macro and test for three operations:

* getting ASCI code for character
* left pad that use `format`
* concatenation to merge two strings

### Input and output processing

Our `main` function will be responsible for reading input and printing output. Rest of login si moved to `Alphabet` structure. Now we will show `main` function:

```rust
fn main() {
    let mut input_line = String::new();
    io::stdin().read_line(&mut input_line).unwrap();
    let l = parse_input!(input_line, i32);
    let mut input_line = String::new();
    io::stdin().read_line(&mut input_line).unwrap();
    let h = parse_input!(input_line, i32);
    let mut input_line = String::new();
    io::stdin().read_line(&mut input_line).unwrap();
    let t = input_line.trim_matches('\n').to_string();

    let mut a = Alphabet::new(l, h);

    for _i in 0..h {
        let mut input_line = String::new();
        io::stdin().read_line(&mut input_line).unwrap();
        let row = input_line.trim_matches('\n').to_string();
        a.set_row(row)
    }

    let res = a.get(t);
    for r in res {
        println!("{}", r.trim_end_matches(" "));
    }
}
```

It is quite simple, so we can go to `Alphabet` implementation.

### ASCI Art in rust

Struct can be declared as

```rust
struct Alphabet {
    h: usize,
    l: usize,
    rows: Vec<String>,
}
```

We will get `i32` in `main` so to convert them to `usize` we adding casting to constructor

```rust
impl Alphabet {
    fn new(l: i32, h: i32) -> Alphabet {
        Alphabet {
            l: l as usize,
            h: h as usize,
            rows: vec![],
        }
    }
```

when we adding rows we will need `lpad`

```rust
    fn set_row(&mut self, row: String) -> () {
        let line = lpad(row, (25 + 2) * self.l);
        self.rows.push(line);
    }
```

finally implementation of `get` can be written in following way:

```rust
fn get(&self, word: String) -> Vec<String> {
        let a_position = char_code_at('A');
        let mut rows: Vec<String> = std::iter::repeat(String::from("")).take(self.h).collect();
        for letter in word.chars() {
            let mut pos: i32 = char_code_at(letter.to_ascii_uppercase()) as i32 - a_position as i32;
            if pos < 0 || pos > 25 {
                pos = (self.rows[0].len() / self.l - 1) as i32
            }
            let pos: usize = pos as usize;

            for i in 0..self.h {
                rows[i as usize] = concat_str(
                    &rows[i],
                    &self.rows[i as usize][pos * self.l..(pos + 1) * self.l],
                )
            }
        }

        rows
    }
}
```

### Tests in rust

Our shunit will be almost the same as in `node`. Only difference is `cargo run` instead of `ts-node index.ts`. Workflow can be divided to building, unit tests and e2e tests

```yml
name: Rust

on:
  push:
    branches: [ "main" ]
    paths: [ "rust/**" ]

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

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install shunit
        run: sudo apt install -y shunit2
      - name: Check files
        run: ls ../cases/in*
        working-directory: ${{ env.working-directory }}
      - name: Test with shunit
        run: ./shunit.sh
        working-directory: ${{ env.working-directory }}

```

### Summary

I hope this article will be helpful for learning basic concepts from rust or javascript. Full code can be seen here:

[GitHub - gustawdaniel/asci-art-rust-node-js

Contribute to gustawdaniel/asci-art-rust-node-js development by creating an account on GitHub.

![](https://github.githubassets.com/favicons/favicon.svg)GitHubgustawdaniel

![](https://opengraph.githubassets.com/eab81b748e6df897c8f1f504304f64535b3fe2515345883fefb716d3ffe7889d/gustawdaniel/asci-art-rust-node-js)](https://github.com/gustawdaniel/asci-art-rust-node-js)

If you want to solve similar problems you can create account on `codingame` using link:

[https://www.codingame.com/servlet/urlinvite?u=5287657](https://www.codingame.com/servlet/urlinvite?u=5287657)
