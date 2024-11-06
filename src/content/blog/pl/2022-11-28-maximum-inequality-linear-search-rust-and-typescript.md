---
author: Daniel Gustaw
canonicalName: maximum-inequality-linear-search-rust-and-typescript
coverImage: http://localhost:8484/3e9e4456-ce05-4bd0-b136-7bbd4c952edd.avif
description: Prosta zadanie hackeartch rozwiązane w node js i rust. Możesz porównać te dwa języki na przykładzie tego problemu. Zalecam rozwiązanie go samodzielnie przed przeczytaniem rozwiązań.
excerpt: Prosta zadanie hackeartch rozwiązane w node js i rust. Możesz porównać te dwa języki na przykładzie tego problemu. Zalecam rozwiązanie go samodzielnie przed przeczytaniem rozwiązań.
publishDate: 2022-11-28 16:54:21+00:00
slug: pl/maksymalna-nierownosc
tags:
- linear-search
- rust
- nodejs
- typescript
title: Maksymalna nierówność [Wyszukiwanie liniowe] rust i typescript
updateDate: 2022-11-28 16:54:20+00:00
---

**Problem**

Funkcja na ciągu binarnym *T* o długości *M* jest zdefiniowana w następujący sposób:

*F(T)* = liczba indeksów *i (1≤i<M)* takich, że Ti≠Ti+1.

Otrzymujesz ciąg binarny *S* o długości *N*. Musisz podzielić ciąg *S* na dwie podsekwencje *S1,S2* w taki sposób, że:

* Każdy znak ciągu *S* należy do jednej z *S1* oraz *S2*.
* Znaki *S1* i *S2* muszą występować w kolejności, w jakiej pojawiają się w *S*.

Znajdź maksymalną możliwą wartość *F(S1)+F(S2)*.

**UWAGA:** Ciąg binarny to ciąg, który składa się z znaków \`*0*\` i \`*1*\`. Jeden z ciągów S1, S2 może być pusty.

**Format wejścia**

* W pierwszej linii znajduje się *T*, oznaczające liczbę przypadków testowych. Opis *T* przypadków testowych jest następujący:
* Dla każdego przypadku testowego:
* W pierwszej linii znajduje się *N*, oznaczające rozmiar ciągu *S*.
* W drugiej linii znajduje się ciąg *S*.

**Format wyjścia**

Dla każdego przypadku testowego, wypisz maksymalną możliwą wartość *F(S1)+F(S2)* w osobnej linii.

**Ograniczenia**

```
1≤T≤10^5
1≤N≤10^5
∣S∣=N $$
S contains characters ′0′ and ′1′.
Sum of N over all test cases does not exceed 2 ⋅ 10^5.
```

Przykładowe Dane Wejściowe

```
3
3
011
4
1100
5
11111
```

Przykładowy wynik

```
1
2
0
```

**Wyjaśnienie**

**Pierwszy przypadek testowy**

* Jednym z możliwych podziałów jest S1=011, S2="" (pusty ciąg). Tutaj F(S1)+F(S2)=1+0=1. Nie ma możliwości podzielenia danego ciągu, aby uzyskać większy wynik.

**Drugi przypadek testowy**

* Optymalny podział to S1=10, S2=10. Tutaj F(S1)+F(S2)=1+1=2. Nie ma możliwości podzielenia danego ciągu, aby uzyskać większy wynik.

**Trzeci przypadek testowy**

* Dla dowolnego możliwego podziału *S*, F(S1)+F(S2)=0.

# Rozwiązanie

Opiszę metodę, a następnie przedstawię kod w javascript i rust.

## Metoda

Aby rozwiązać ten problem, możemy utworzyć dwa wskaźniki - jeden dla dowolnego początku podciągu. Następnie zmieniamy wartość pierwszej sekwencji tak szybko, jak to możliwe. W przeciwnym razie zmieniamy drugą. Każda zmiana powinna zwiększać licznik zmian. Ten prosty algorytm ma złożoność O(n).

## Rozwiązanie Node JS

W rozwiązaniu `node` użyjemy modułu `readline`. Pozwala to na stworzenie interfejsu, który generuje zdarzenia związane z odczytem z standardowego wejścia.

```typescript
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
```

Będziemy mogli dodać nasłuchiwacze zdarzeń do obiektu `rl`, ale teraz stwórzmy `input_array`, który będzie wypełniany kolejnymi liniami.

```typescript
const input_array:string[] = []
```

Teraz możemy nasłuchiwać na każdej dodanej linii w standardowym wejściu i dodawać je do tej tablicy.

```typescript
rl.on('line', (line: string) => {
    input_array.push(line);
});
```

Kiedy wejście zostanie zamknięte, chcemy zbudować wyjście i przekazać je do standardowego wyjścia:

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

używamy funkcji `solve`, która znajdzie maksymalną liczbę zmian w obu. Oto implementacja funkcji `solve`.

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

To koniec typescript, ale warto przedstawić test. Nie będziemy używać `jest`, `ava` ani `mocha`, które są zaprojektowane do testowania kodu wewnętrznie. Zamiast tego postanowiłem przetestować program za pomocą testu czarnej skrzynki napisanego w `shunit2`. Istnieje plik `text` z danymi testowymi.

```text
3
3
011
4
1100
5
11111
```

Z treści ćwiczenia wiemy, że rozwiązania to `1`, `2` i `0`. Więc mój test jest napisany w `equality_test.sh`

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

W końcu workflow akcji GitHub

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

## Rozwiązanie w Rust

W Rusta podzieliliśmy projekt na 2 pliki. Prawie pusty `main.rs`

```rust
use linear_search_max_inequality::max_inequality;
use std::io;

fn main() -> io::Result<()>{
    max_inequality(&mut io::stdin(), &mut io::stdout())
}
```

i `lib.rs` z całą logiką i testami jednostkowymi. Zacznijmy od testów.

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

Czytając testy, możemy zauważyć, że istnieje funkcja `compute_max_inequality`, która rozwiązuje główny problem, oraz `max_inequality`, która obsługuje poprawnie wejście i wyjście.

Rozwiązanie problemu jest generalnie kopią rozwiązania w nodze z drobnymi komplikacjami wynikającymi z konieczności konwersji znaków na ciągi.

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

innym problemem, który był typowy tylko dla rusta, jest nieco zbyt skomplikowane drukowanie wektora w nowych liniach

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

Ostatecznie główna funkcja, która odczytuje linie i oblicza wyniki.

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

Workflow Rust w GitHubie jest dość standardowy

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
