---
author: Daniel Gustaw
canonicalName: codingame-asci-art-rust-nodejs-strings-arrays-loops
coverImage: http://localhost:8484/6e4fd27a-860f-44c6-8b0a-1c473296724b.avif
description: Rozwiązywanie tej zagadki uczy, jak zarządzać ciągami znaków i arytmetyką tablic. Dowiesz się, jak podzielić ciąg na oddzielne części i połączyć je w nowy. Możesz używać indeksów tablic.
excerpt: Rozwiązywanie tej zagadki uczy, jak zarządzać ciągami znaków i arytmetyką tablic. Dowiesz się, jak podzielić ciąg na oddzielne części i połączyć je w nowy. Możesz używać indeksów tablic.
publishDate: 2023-01-17 18:31:50+00:00
slug: pl/asci-art-rust-nodejs
tags:
- asci
- rust
- nodejs
- strings
- arrays
- loops
title: 'CodinGame: Sztuka ASCI - Rust, NodeJs - Ciągi, Tablice, Pętle'
updateDate: 2023-01-17 18:31:50+00:00
---

Celem problemu jest zasymulowanie wyświetlacza starego terminalu lotniska: twój program musi wyświetlić linię tekstu w sztuce ASCII.

Musisz podzielić łańcuchy, przechować je i odtworzyć inne. Możesz użyć struktur danych, takich jak tablice lub tablice haszujące.

Można to rozwiązać, korzystając z następujących koncepcji.

* [Łańcuchy](https://www.codingame.com/learn/strings)
* [Tablice](https://www.codingame.com/learn/arrays)
* [Pętle](https://www.codingame.com/learn/loops)

## **Cel**

Na dworcach i lotniskach często można zobaczyć ten typ ekranu:

![](http://localhost:8484/bde46da2-a48c-4b4f-858d-af642e708b0f.avif)

Czy kiedykolwiek zadawałeś sobie pytanie, jak można symulować ten wyświetlacz na dobrym, starym terminalu? Mamy: za pomocą sztuki ASCII!

## Zasady

Sztuka ASCII pozwala na reprezentowanie form za pomocą znaków. Mówiąc dokładniej, w naszym przypadku te formy to słowa. Na przykład słowo "MANHATTAN" można wyświetlić w następujący sposób w sztuce ASCII:

```
# #  #  ### # #  #  ### ###  #  ###
### # # # # # # # #  #   #  # # # #
### ### # # ### ###  #   #  ### # #
# # # # # # # # # #  #   #  # # # #
# # # # # # # # # #  #   #  # # # #
```

Twoja misja to napisanie programu, który potrafi wyświetlić linię tekstu w sztuce ASCII w stylu podanym jako dane wejściowe.

## Wejście gry

**Wejście**

**Linia 1:** szerokość `L` litery reprezentowanej w sztuce ASCII. Wszystkie litery mają tę samą szerokość.

**Linia 2:** wysokość `H` litery reprezentowanej w sztuce ASCII. Wszystkie litery mają tę samą wysokość.

**Linia 3:** Linia tekstu `T`, składająca się z `N` znaków ASCII.

**Kolejne linie:** ciąg znaków ABCDEFGHIJKLMNOPQRSTUVWXYZ? reprezentowany w sztuce ASCII.

**Wyjście**

Tekst `T` w sztuce ASCII.
Znaki od a do z są przedstawiane w sztuce ASCII przez ich odpowiedniki w górnym przypadku.
Znaki, które nie mieszczą się w przedziałach \[a-z\] lub \[A-Z\], będą przedstawiane jako znak zapytania w sztuce ASCII.

**Ograniczenia**

0 < `L` < 30
0 < `H` < 30
0 < `N` < 200

**Przykład 1**

**Wejście**

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

**Wynik**

```
###
#
##
#
###
```

**Przykład 2**

**Wejście**

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

**Wynik**

```
# #  #  ### # #  #  ### ###  #  ###
### # # # # # # # #  #   #  # # # #
### ### # # ### ###  #   #  ### # #
# # # # # # # # # #  #   #  # # # #
# # # # # # # # # #  #   #  # # # #
```

## Źródło

To ćwiczenie można znaleźć na codingame.com

[Gry kodowania i wyzwania programistyczne, aby lepiej kodować](https://www.codingame.com/ide/puzzle/ascii-art)

## Rozwiązanie w NodeJs

Będziemy mieć trzy katalogi: `node`, `rust` i `cases` z plikami wejściowymi i wyjściowymi tekstu. W `node` możemy skonfigurować projekt za pomocą komend

```
npm init -y
tsc --init
```

w `tsconfig.json` zmienimy `target` na `ESNext`, aby móc używać `padEnd` w naszym kodzie. Dodatkowo powinniśmy zainstalować zależności deweloperskie:

```
npm i -D @types/node typescript
```

### Odczytywanie linii

Chcemy przekazać dane wejściowe przez standardowe wejście do programu. Używając modułu `readline`, możemy nasłuchiwać linii i końca danych wejściowych. Każda linia zostanie dodana do tablicy `lines`. Gdy wszystkie dane wejściowe zostaną odczytane, wywołamy funkcję `start`, którą zdefiniujemy później.

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

Dodatkowo zdefiniowaliśmy funkcję `readline`, która zwróci nam następne linie z tablicy `lines`.

### Interfejs klasy przetwarzającej dane wejściowe

Stworzymy klasę `Alphabet`, która będzie potrzebować rozmiaru litery w `konstruktorze`. Następnie będziemy zapisywać wiersze jeden po drugim, a na koniec musimy uzyskać tablicę wierszy dla danego ciągu znaków. Skupimy się na implementacji później, ale teraz zobaczmy funkcję `start`, o której wspomniano wcześniej:

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

ta funkcja zostanie wywołana, gdy dane wejściowe zostaną zapisane do `lines`. Teraz możemy skupić się na implementacji `Alphabet`

### Przetwarzanie wierszy

W `setRow` dodajemy wiersze do właściwości `rows`, ale `padEnd` pozwala na dodanie spacji na końcu wierszy, aby uprościć dalsze przetwarzanie.

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

Funkcja `get` zaczyna od uzyskania kodu asci litery `A`. Następnie przygotowujemy puste wiersze wyjściowe. Dla każdej litery z oczekiwanego słowa obliczamy pozycję w naszym alfabecie używając kodów asci. Podciągi odpowiadające tym literom są dodawane do wierszy. Na koniec wypełnione wiersze są zwracane z metody `get`.

### Shunit dla node js

Aby przetestować, możemy użyć `shunit2`, ponieważ ten framework można zastosować w każdym języku i świetnie sprawdza się w przypadkach, gdy musimy testować wejście i wyjście poleceń bash.

To jest nasza zawartość `shunit.sh`

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

Jest fragment `${file/in/"out"}` - oznacza to, że zastępujemy `in` przez `out` w ścieżkach do plików. Pliki w `cases` zaczynają się od `in` lub `out`, mając resztę nazw taką samą. Możesz je sprawdzić w repozytorium github:

[asci-art-rust-node-js/cases at main · gustawdaniel/asci-art-rust-node-js](https://opengraph.githubassets.com/eab81b748e6df897c8f1f504304f64535b3fe2515345883fefb716d3ffe7889d/gustawdaniel/asci-art-rust-node-js)](https://github.com/gustawdaniel/asci-art-rust-node-js/tree/main/cases)

Workflow w Node.js jest następujący:

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

aby to zadziałało, powinniśmy dodać odpowiednie `skrypty` w `package.json`

```json
  "scripts": {
    "test": "./shunit.sh"
  },
```

## Rozwiązanie w Rust

Będziemy podążać tą samą strukturą co w NodeJs. Nasz kod można podzielić na pomocniki, przetwarzanie wejścia/wyjścia oraz strukturę `Alphabet` z jej metodami.

### Pomocnicy dla stringów

W `src/main.rs` możemy rozpocząć plik od

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

są jeden makro i test dla trzech operacji:

* uzyskiwanie kodu ASCI dla znaku
* lewy padding, który używa `format`
* konkatenacja do łączenia dwóch łańcuchów

### Przetwarzanie wejścia i wyjścia

Nasza funkcja `main` będzie odpowiedzialna za odczyt wejścia i drukowanie wyjścia. Reszta logiki została przeniesiona do struktury `Alphabet`. Teraz pokażemy funkcję `main`:

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

To jest dość proste, więc możemy przejść do implementacji `Alphabet`.

### Sztuka ASCI w rust

Struktura może być zadeklarowana jako

```rust
struct Alphabet {
    h: usize,
    l: usize,
    rows: Vec<String>,
}
```

W `main` otrzymamy `i32`, więc aby je przekonwertować na `usize`, dodajemy rzutowanie do konstruktora.

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

gdy dodajemy wiersze, będziemy potrzebować `lpad`

```rust
    fn set_row(&mut self, row: String) -> () {
        let line = lpad(row, (25 + 2) * self.l);
        self.rows.push(line);
    }
```

ostatecznie implementacja `get` może być napisana w następujący sposób:

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

### Testy w rust

Nasz shunit będzie prawie taki sam jak w `node`. Jedyną różnicą jest `cargo run` zamiast `ts-node index.ts`. Przepływ pracy można podzielić na budowanie, testy jednostkowe i testy end-to-end.

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

### Podsumowanie

Mam nadzieję, że ten artykuł będzie pomocny w nauce podstawowych pojęć z rusta lub javascriptu. Pełny kod można zobaczyć tutaj:

[GitHub - gustawdaniel/asci-art-rust-node-js](https://github.com/gustawdaniel/asci-art-rust-node-js)

Jeśli chcesz rozwiązywać podobne problemy, możesz założyć konto na `codingame` korzystając z linku:

https://www.codingame.com/servlet/urlinvite?u=5287657
