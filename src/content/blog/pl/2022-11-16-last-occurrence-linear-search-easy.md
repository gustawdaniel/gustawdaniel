---
author: Daniel Gustaw
canonicalName: last-occurrence-linear-search-easy
coverImage: http://localhost:8484/f0cf18ae-5174-47c0-81af-cb479a0c36b3.avif
description: Znajdź i wydrukuj indeks ostatniego wystąpienia elementu w tablicy.
excerpt: Znajdź i wydrukuj indeks ostatniego wystąpienia elementu w tablicy.
publishDate: 2022-11-16 17:22:37+00:00
slug: pl/ostatnie-wystapienie
tags:
- rust
- linear search
- easy
title: Ostatnie wystąpienie [Wyszukiwanie liniowe] łatwe
updateDate: 2022-11-28 14:40:24+00:00
---

Została Ci podana tablica o rozmiarze *N* składająca się z liczb całkowitych. Dodatkowo otrzymałeś element *M*, którego musisz szukać i wydrukować indeks ostatniego wystąpienia tego elementu *M* w tablicy, jeśli on istnieje, w przeciwnym razie wydrukuj -1. Uważaj, że ta tablica ma indeksowanie zaczynające się od 1.

**Format wejściowy**:

Pierwsza linia składa się z 2 liczb całkowitych *N* i *M*, oznaczających rozmiar tablicy oraz element, którego należy szukać w tablicy. Następna linia zawiera *N* liczb całkowitych oddzielonych spacjami, które oznaczają elementy tablicy.

**Format wyjściowy**

Wydrukuj jedną liczbę całkowitą oznaczającą indeks ostatniego wystąpienia liczby *M* w tablicy, jeśli istnieje, w przeciwnym razie wydrukuj -1.

**Ograniczenia**

$$
1 \le N \le 10^5
$$

$$
1 \le A[i] \le 10^9
$$

$$
1 \le M \le 10^9
$$


**PRZYKŁADOWE WEJŚCIE**

```
5 1
1 2 3 4 1
```

**PRZYKŁADOWY WYNIK**

```
5
```

Rozwiązanie

W `main.rs` możemy dodać funkcję główną, która przetwarza strumienie wejściowe i wyjściowe.

```rust
use linear_sort_reverse_search_rust_easy::reverse_search;
use std::io;

fn main() -> io::Result<()> {
    reverse_search(&mut io::stdin(), &mut io::stdout())
}
```

w `lib.rs` znajduje się reszta naszego kodu

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
