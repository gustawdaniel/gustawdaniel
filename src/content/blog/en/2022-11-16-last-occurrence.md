---
author: Daniel Gustaw
canonicalName: last-occurrence-linear-search-easy
coverImage: http://localhost:8484/f0cf18ae-5174-47c0-81af-cb479a0c36b3.avif
date_updated: 2022-11-28 14:40:24+00:00
description: Find and print the index of the last occurrence of element in the array.
excerpt: Find and print the index of the last occurrence of element in the array.
publishDate: 2022-11-16 17:22:37+00:00
slug: en/last-occurrence
tags:
- rust
- linear search
- easy
title: Last Occurrence [Linear Search] easy
---



You have been given an array of size *N* consisting of integers. In addition you have been given an element *M* you need to find and print the index of the last occurrence of this element *M* in the array if it exists in it, otherwise print -1. Consider this array to be 1 indexed.

**Input Format**:

The first line consists of 2 integers *N* and *M* denoting the size of the array and the element to be searched for in the array respectively . The next line contains *N* space separated integers denoting the elements of of the array.

**Output Format**

Print a single integer denoting the index of the last occurrence of integer *M* in the array if it exists, otherwise print -1.

**Constraints**

$$
1 \le N \le 10^5
$$

$$
1 \le A[i] \le 10^9
$$

$$
1 \le M \le 10^9
$$


**SAMPLE INPUT**

```
5 1
1 2 3 4 1
```

**SAMPLE OUTPUT**

```
5
```

Solution

In `main.rs` we can add main function that process in and out streams.

```rust
use linear_sort_reverse_search_rust_easy::reverse_search;
use std::io;

fn main() -> io::Result<()> {
    reverse_search(&mut io::stdin(), &mut io::stdout())
}
```

in `lib.rs` there is rest of our code

```rust
use std::io::{Error, Read, Write};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_test() {
        let mut output: Vec<u8> = Vec::new();

        reverse_search(&mut "5 1
1 2 3 4 1".as_bytes(), &mut output).unwrap();
        assert_eq!(&output, b"5\n");
    }


    #[test]
    fn not_found_test() {
        let mut output: Vec<u8> = Vec::new();

        reverse_search(&mut "5 7
1 2 3 4 1".as_bytes(), &mut output).unwrap();
        assert_eq!(&output, b"-1\n");
    }
}

pub fn reverse_search(
    handle: &mut impl Read ,
    output: &mut impl Write,
) -> Result<(), Error> {
    let mut buffer = "".to_string();
    let mut out = "".to_string();
    handle.read_to_string(&mut buffer)?;

    let mut lines = buffer.lines();

    let mut some_line = match lines.next() {
        Some(line) => line,
        _ => ""
    };

    let mut iterator = some_line.split_ascii_whitespace();

    let mut len: usize = match iterator.next() {
        Some(p) => p.trim().parse().expect("can't read"),
        None => 0
    };
    let  needle = match iterator.next() {
        Some(p) => p.trim().parse().expect("can't read"),
        None => 0
    };

    some_line = match lines.next() {
        Some(line) => line,
        _ => ""
    };

    let mut vec:Vec<i32> = vec![0; len];

    iterator = some_line.split_ascii_whitespace();

    for n in 0..len {
        vec[n] = match iterator.next() {
            Some(p) => p.trim().parse().expect("can't read"),
            None => 0
        };
    }

    let mut iter = vec.iter().rev();

    while let Some(num) = iter.next() {
        if *num == needle {
            out = format!("{}\n", len);
            break;
        }
        len -= 1;
    }

    if len == 0 {
        out = format!("-1\n");
    }

    output.write_all(out.to_uppercase().as_bytes())?;

    Ok(())
}
```

[linear-sort-reverse-search-rust-easy](https://github.com/gustawdaniel/linear-sort-reverse-search-rust-easy)
