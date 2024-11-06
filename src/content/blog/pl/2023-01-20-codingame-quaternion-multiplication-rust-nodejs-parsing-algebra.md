---
author: Daniel Gustaw
canonicalName: codingame-quaternion-multiplication-rust-nodejs-parsing-algebra
coverImage: http://localhost:8484/d49f26ae-0d28-40ec-a9ec-a242c016b45d.avif
description: W tym artykule zobaczymy, jak zaimplementować mnożenie kwaternionów w Rust i NodeJS. Dowiesz się o parsowaniu i algebrze.
excerpt: W tym artykule zobaczymy, jak zaimplementować mnożenie kwaternionów w Rust i NodeJS. Dowiesz się o parsowaniu i algebrze.
publishDate: 2023-01-20 02:19:57+00:00
slug: pl/mnozenie-kwaternionow
tags:
- quaternion
- rust
- nodejs
- algebra
- mathematics
- parsing
title: 'CodinGame: Mnożenie kwaternionów - Rust, NodeJS - Parsowanie, Algebra'
updateDate: 2023-01-20 02:19:57+00:00
---

W tym artykule zobaczymy, jak zaimplementować mnożenie kwaternionów w Rust i NodeJS. Zachęcam do próby rozwiązania tego problemu przed zapoznaniem się z rozwiązaniami. Poniżej zamieszczam link do tego ćwiczenia:

[Coding Games and Programming Challenges to Code Better](https://www.codingame.com/training/medium/quaternion-multiplication)

Kwaterniony należą do systemu liczb, który rozszerza liczby zespolone. Kwaternion jest definiowany przez sumę skalarnych wielokrotności stałych **i**, **j**, **k** i **1**. Więcej informacji można znaleźć pod adresem:

[Quaternion -- from Wolfram MathWorld](https://mathworld.wolfram.com/Quaternion.html)

Rozważ następujące własności:  
**jk** = **i**  
**ki** = **j**  
**ij** = **k**  
**i**² = **j**² = **k**² = **\-1**  

Te właściwości implikują również, że:  
**kj** = **\-i**  
**ik** = **\-j**  
**ji** = **\-k**  

Kolejność mnożenia ma znaczenie.

Twój program musi wypisać wynik iloczynu liczby uproszczonych kwaternionów w nawiasach.

**Zwróć uwagę na formatowanie**  
Współczynnik jest dołączany po lewej stronie stałej.  
Jeśli współczynnik wynosi **1** lub **\-1**, nie dołączaj symbolu **1**.  
Jeśli współczynnik lub termin skalarowy wynosi **0**, nie dołączaj go.  
Terminy muszą być wyświetlane w kolejności: a**i** + b**j** + c**k** + d.

**Przykład mnożenia**  
(2i+2j)(j+1) = (2ij+2i+2j² +2j) = (2k+2i-2+2j) = (2i+2j+2k-2)

---

**Wejście:**

**Linia 1**: Wyrażenie expr do oceny. To zawsze będzie iloczyn uproszczonych wyrażeń w nawiasach.

**Wyjście:** Jedna linia zawierająca uproszczony wynik wyrażenia iloczynu. Nawiasy nie są wymagane.

**Ograniczenia:** Wszystkie współczynniki w jakiejkolwiek części oceny będą mniejsze niż **10^9**  
Wejście nie zawiera więcej niż 10 uproszczonych wyrażeń w nawiasach

**Przykład**

**Wejście**

```
(i+j)(k)
```

**Wynik**

```
i-j
```

# Rozwiązanie

Postanowiłem zaprezentować tutaj tylko najważniejsze części. Pełne rozwiązanie można znaleźć w repozytorium:

[GitHub - gustawdaniel/codingame-quaternion-multiplication](https://opengraph.githubassets.com/85682fcbd54214a903a6cb968a0137db1d1243d42b118b9e0764ac9229c76d63/gustawdaniel/codingame-quaternion-multiplication)](https://github.com/gustawdaniel/codingame-quaternion-multiplication)

Możemy podzielić nasz problem na trzy kroki:

* analiza wejścia do struktury Quaternion
* mnożenie Quaternionów
* formatowanie Quaterniona z powrotem do ciągu znaków

![](http://localhost:8484/8467207d-4e35-4dd6-ac96-8b874028e6ef.avif)

Te operacje na wysokim poziomie można zaimplementować w NodeJS

```typescript
import {Quaternion} from "./lib";

process.stdin.on('data', (buff) => {
    const line = buff.toString();
    const qs = Quaternion.parse(line);
    process.stdout.write(qs.reduce((p, n) => p.multiply(n)).format());
})
```

i w Rust

```rust
fn main() {
    let mut input_line = String::new();
    io::stdin().read_line(&mut input_line).unwrap();
    let expr = input_line.trim_matches('\n').to_string();

    let qs = Quaternion::parse(&expr);
    let out = qs.into_iter().reduce(|p, n| p.multiply(n)).unwrap();
    println!("{}", out);
}
```

Możesz zauważyć, że ten kod jest naprawdę podobny, ale w obu przypadkach musimy zaimplementować `Struct/Class` o nazwie `Quaternion`. Teraz przejdziemy przez trzy kroki wymienione wcześniej, używając `TDD`. Testy są natywnie wspierane w rust, ale w `NodeJS` zdecydowałem się użyć `jest` jako frameworka do testowania.

## Parsowanie wejścia do struktury Quaternion

Nasze wejście

```
(i+j)(k)
```

powinno być traktowane jako tablica kwaternionów - oddzielonych nawiasami. W dowolnych nawiasach mamy tablicę współczynników. Możemy więc podzielić nasze parsy na 4 części:

* dzielenie według nawiasów
* dzielenie dowolnego nawiasu na współczynniki
* tworzenie kwaternionów z tablic współczynników
* wyodrębnianie liczby z współczynnika

![](http://localhost:8484/dd766517-6a3f-4c23-b9df-dbf68b0c0c80.avif)

W NodeJS możemy zacząć od dwóch testów. Pierwszy dla prostych przypadków:

```typescript
    it('simple parse', () => {
        const qs = Quaternion.parse('(i+j)');
        expect(qs.length).toEqual(1);
        expect(qs[0].r).toEqual(0);
        expect(qs[0].i).toEqual(1);
        expect(qs[0].j).toEqual(1);
        expect(qs[0].k).toEqual(0);
    });
```

Drugi dla bardziej zaawansowanych współczynników:

```typescript
    it('complex parse', () => {
        const qs = Quaternion.parse('(9+i-j)(k-8.4j)');
        expect(qs.length).toEqual(2);
        expect(qs[0].r).toEqual(9);
        expect(qs[0].i).toEqual(1);
        expect(qs[0].j).toEqual(-1);
        expect(qs[0].k).toEqual(0);

        expect(qs[1].r).toEqual(0);
        expect(qs[1].i).toEqual(0);
        expect(qs[1].j).toEqual(-8.4);
        expect(qs[1].k).toEqual(1);
    });
```

Identyczne testy w `rust` można wyrazić jako

```rust
#[cfg(test)]
mod tests {
    use crate::{Quaternion};


    #[test]
    fn simple_parse() {
        let qs = Quaternion::parse("(i+j)");
        assert_eq!(qs.len(), 1);
        assert_eq!(qs[0].r, 0f64);
        assert_eq!(qs[0].i, 1f64);
        assert_eq!(qs[0].j, 1f64);
        assert_eq!(qs[0].k, 0f64);
    }

    #[test]
    fn complex_parse() {
        let qs = Quaternion::parse("(9+i-j)(k-8.4j)");
        assert_eq!(qs.len(), 2);
        assert_eq!(qs[0].r, 9f64);
        assert_eq!(qs[0].i, 1f64);
        assert_eq!(qs[0].j, -1f64);
        assert_eq!(qs[0].k, 0f64);

        assert_eq!(qs[1].r, 0f64);
        assert_eq!(qs[1].i, 0f64);
        assert_eq!(qs[1].j, -8.4f64);
        assert_eq!(qs[1].k, 1f64);
    }
}
```

Nasza bazowa klasa `Quaternion` będzie miała `4` właściwości. W NodeJS:

```typescript
export class Quaternion {
    r: number = 0;
    i: number = 0;
    j: number = 0;
    k: number = 0;
}
```

gdzie `r` oznacza `rzeczywistą` część, która dziedziczy arytmetykę z liczb rzeczywistych. W `rust` używamy słowa kluczowego `struct` zamiast `class`

```rust
#[derive(Debug)]
struct Quaternion {
    r: f64,
    i: f64,
    j: f64,
    k: f64,
}
```

### Dzieleniu ciągu za pomocą wyrażeń regularnych

Aby podzielić dane wejściowe i dostarczyć tablice współczynników do konstruktorów Quaternion, możemy napisać metody w NodeJS:

```typescript
    static parse(input: string): Quaternion[] {
        const qs = (input.match(/\(.*?\)/g) ?? []).map(
            (e: string) => (e
                    .replace('(', '')
                    .replace(')', '')
                    .match(/[-+]?[\d.]*[ijk]?/g) ?? []
            ).filter(v => v).map(
                v => v.replace(/^\+/, '')
            )
        );
        return qs.map((q) => new Quaternion(q));
    }
```

i Rust

```rust
impl Quaternion {
    fn parse(input: &str) -> Vec<Quaternion> {
        let re = Regex::new(r"\((.*?)\)").expect("can't create regex");

        let qs = re.captures_iter(input).filter_map(|cap| Some(cap.get(1)?.as_str()))
            .map(|m| m.to_string()).collect::<Vec<_>>();

        let re = Regex::new(r"\+?(-?[\d.]*[ijk]?)").expect("can't create regex");

        let res = qs.iter().map(|q| {
            let args = re.captures_iter(&q).filter_map(|cap| Some(cap.get(1)?.as_str()))
                .map(|m| m.to_string()).collect::<Vec<_>>();
            Quaternion::new(args)
        });

        res.collect::<Vec<_>>()
    }
}
```

Ogólnie rzecz biorąc, są te same wyrażenia regex, ale `rust` wymaga tutaj zewnętrznej biblioteki o nazwie `regex`. Dodatkowo `rust` sprawdza poprawność wyrażeń regex i zapewnia obsługę błędów w nich, co może być pomijane domyślnie w kodzie `node js`. Ogólnie czuję, że podejście `node js` do regex jest bardziej czyste i czytelne.

Teraz mamy następujący problem. Nasze współczynniki mogą zawierać liczby, liczby z nazwami komponentów takimi jak: `i`, `j` lub `k`, lub nawet samotne litery takie jak `i`, co oznacza `1i`. Istnieją również możliwe znaki, takie jak `-k`.

Potrzebujemy kodu, który wyodrębni liczby z nich. Nazwijmy `i`, `j` lub `k` jako `typ`, a pełny ciąg współczynnika jako `input`. Następnie można uznać wyodrębnienie liczby za:

* usunięcie `typ` z `input`
* jeśli reszta nie kończy się na cyfrę, dodaj `1` na końcu (przykład to `-`)
* w końcu skonwertuj jako float

Implementacja w `node js`

```typescript
    static getCoefficient(type: string, input: string): number {
        const coefficient = input.replace(type, '');
        return Number.parseFloat(/\d$/.test(coefficient) ? coefficient : coefficient + '1')
    }
```

i analogiczny w rust

```rust
    fn get_coefficient(t: &str, input: String) -> f64 {
        let c = input.replace(t, "");
        if Regex::new(r"\d$").expect("ff").is_match(&c) {
            c.parse::<f64>().unwrap()
        } else {
            (c + "1").parse::<f64>().unwrap()
        }
    }
```

W Rust, ogólnie obsługa konwersji między typami wymaga więcej znaków, ale jest bardziej niezawodna. W tym przypadku użycie `unwrap` zmusza nas do myślenia o możliwych sposobach radzenia sobie z problemami z analizą.

Teraz możemy przedstawić konstruktory. W nich przekażemy tablicę ciągów znaków z współczynnikami takimi jak `8`, `-9k` lub `i`. W `Node.js`:

```typescript
    constructor(args: Array<string>) {
        for (let arg of args) {
            if (arg.includes('i')) {
                this.i = Quaternion.getCoefficient('i', arg);
            } else if (arg.includes('j')) {
                this.j = Quaternion.getCoefficient('j', arg);
            } else if (arg.includes('k')) {
                this.k = Quaternion.getCoefficient('k', arg);
            } else {
                this.r = Number.parseFloat(arg);
            }
        }
    }
```

lub w `rust`:

```rust
    fn new(args: Vec<String>) -> Quaternion {
        let mut q = Quaternion {
            i: 0f64,
            j: 0f64,
            k: 0f64,
            r: 0f64,
        };

        for arg in args {
            if arg.contains("i") {
                q.i = Quaternion::get_coefficient("i", arg)
            } else if arg.contains("j") {
                q.j = Quaternion::get_coefficient("j", arg)
            } else if arg.contains("k") {
                q.k = Quaternion::get_coefficient("k", arg)
            } else {
                q.r = arg.parse::<f64>().unwrap()
            }
        }

        q
    }
```

## Mnożenie kwaternionów

Mnożenie dwóch kwaternionów jest podobne do mnożenia wielomianów. Najpierw mnożymy ze sobą dowolne pary składników. Następnie możemy grupować je według rodzaju składnika i na końcu dodać współczynniki. Różnica polega na tym, że w mnożeniu wielomianów zawsze dodajemy potęgi, podczas gdy w kwaternionach używamy niekomutatywnej algebry dzielenia przedstawionej w tabeli:

![](http://localhost:8484/c7947573-0696-486e-8bd7-ffbfc5b8c85c.avif)

Więc zasadniczo możemy podzielić nasz problem na:

* mnożenie elementów podstawowych
* mnożenie kombinacji liniowych elementów podstawowych

### Mnożenie elementów podstawowych

Przepisałem wszystkie możliwe przypadki w pliku testowym w `NodeJS`

```typescript
    it('multiply base', () => {
        expect(Quaternion.multiplyBase('r', 'r')).toEqual({c: 1, d: 'r'});
        expect(Quaternion.multiplyBase('r', 'i')).toEqual({c: 1, d: 'i'});
        expect(Quaternion.multiplyBase('r', 'j')).toEqual({c: 1, d: 'j'});
        expect(Quaternion.multiplyBase('r', 'k')).toEqual({c: 1, d: 'k'});

        expect(Quaternion.multiplyBase('i', 'r')).toEqual({c: 1, d: 'i'});
        expect(Quaternion.multiplyBase('i', 'i')).toEqual({c: -1, d: 'r'});
        expect(Quaternion.multiplyBase('i', 'j')).toEqual({c: 1, d: 'k'});
        expect(Quaternion.multiplyBase('i', 'k')).toEqual({c: -1, d: 'j'});

        expect(Quaternion.multiplyBase('j', 'r')).toEqual({c: 1, d: 'j'});
        expect(Quaternion.multiplyBase('j', 'i')).toEqual({c: -1, d: 'k'});
        expect(Quaternion.multiplyBase('j', 'j')).toEqual({c: -1, d: 'r'});
        expect(Quaternion.multiplyBase('j', 'k')).toEqual({c: 1, d: 'i'});

        expect(Quaternion.multiplyBase('k', 'r')).toEqual({c: 1, d: 'k'});
        expect(Quaternion.multiplyBase('k', 'i')).toEqual({c: 1, d: 'j'});
        expect(Quaternion.multiplyBase('k', 'j')).toEqual({c: -1, d: 'i'});
        expect(Quaternion.multiplyBase('k', 'k')).toEqual({c: -1, d: 'r'});
    })
```

i `Rust`

```rust
    #[test]
    fn multiply_base() {
        assert_eq!(Quaternion::multiply_base('r', 'r'), SignedCoefficient { c: 1f64, d: 'r' });
        assert_eq!(Quaternion::multiply_base('r', 'i'), SignedCoefficient { c: 1f64, d: 'i' });
        assert_eq!(Quaternion::multiply_base('r', 'j'), SignedCoefficient { c: 1f64, d: 'j' });
        assert_eq!(Quaternion::multiply_base('r', 'k'), SignedCoefficient { c: 1f64, d: 'k' });

        assert_eq!(Quaternion::multiply_base('i', 'r'), SignedCoefficient { c: 1f64, d: 'i' });
        assert_eq!(Quaternion::multiply_base('i', 'i'), SignedCoefficient { c: -1f64, d: 'r' });
        assert_eq!(Quaternion::multiply_base('i', 'j'), SignedCoefficient { c: 1f64, d: 'k' });
        assert_eq!(Quaternion::multiply_base('i', 'k'), SignedCoefficient { c: -1f64, d: 'j' });

        assert_eq!(Quaternion::multiply_base('j', 'r'), SignedCoefficient { c: 1f64, d: 'j' });
        assert_eq!(Quaternion::multiply_base('j', 'i'), SignedCoefficient { c: -1f64, d: 'k' });
        assert_eq!(Quaternion::multiply_base('j', 'j'), SignedCoefficient { c: -1f64, d: 'r' });
        assert_eq!(Quaternion::multiply_base('j', 'k'), SignedCoefficient { c: 1f64, d: 'i' });

        assert_eq!(Quaternion::multiply_base('k', 'r'), SignedCoefficient { c: 1f64, d: 'k' });
        assert_eq!(Quaternion::multiply_base('k', 'i'), SignedCoefficient { c: 1f64, d: 'j' });
        assert_eq!(Quaternion::multiply_base('k', 'j'), SignedCoefficient { c: -1f64, d: 'i' });
        assert_eq!(Quaternion::multiply_base('k', 'k'), SignedCoefficient { c: -1f64, d: 'r' });
    }
```

W `Rust` muszę zdefiniować `SignedCoefficient`, które były prostymi anonimowymi obiektami w `node`.

```rust
#[derive(Debug)]
struct SignedCoefficient {
    c: f64,
    d: char,
}
```

dodatkowo muszę wdrożyć relację równania na nich, aby użyć `assert_eq`.

```rust
impl PartialEq<SignedCoefficient> for SignedCoefficient {
    fn eq(&self, other: &SignedCoefficient) -> bool {
        self.c == other.c && self.d == other.d
    }
}
```

Funkcja `multiplyBase` jest bardzo prosta i aby ją zbudować, musimy zauważyć, że:

* mnożenie przez 1 zawsze daje drugi element. `a * 1 = a` i `1 * a = a`
* z wyjątkiem 1 zawsze mamy `a * a = -1`
* z wyjątkiem 1 i przekątnej zawsze otrzymujemy współczynnik różny od tych używanych do mnożenia, znak można określić za pomocą operacji `%2` oraz kierunku mnożenia.

Używając tych obserwacji, możemy zdefiniować mnożenie w `node` jako

```typescript
    static multiplyBase(a: Base, b: Base): { c: -1 | 1, d: Base } {
        if (a === 'r') return {c: 1, d: b};
        if (b === 'r') return {c: 1, d: a};
        if (a === b) return {c: -1, d: 'r'};
        const diff = a.charCodeAt(0) - b.charCodeAt(0);
        return {
            c: (diff > 0 ? -1 : 1) * ((diff + 2) % 2 === 0 ? -1 : 1) as -1 | 1,
            d: ['i', 'j', 'k'].find((e) => e !== a && e !== b) as Base
        }
    }
```

i w `rust`

```rust
    fn multiply_base(a: char, b: char) -> SignedCoefficient {
        if a == 'r' { return SignedCoefficient { c: 1f64, d: b }; }
        if b == 'r' { return SignedCoefficient { c: 1f64, d: a }; }
        if a == b { return SignedCoefficient { c: -1f64, d: 'r' }; }
        let diff = u32::from(a) as i32 - u32::from(b) as i32;

        SignedCoefficient {
            c: (if diff > 0 { -1f64 } else { 1f64 }) * (if (diff + 2i32) % 2 == 0 { -1f64 } else { 1f64 }),
            d: vec!['i', 'j', 'k'].iter().find(|&&e| e != a && e != b).unwrap().to_owned(),
        }
    }
```

### Mnożenie kombinacji liniowych

Podzieliłem testy mnożenia na przypadki proste i złożone.

```typescript
    it('simple multiply', () => {
        const res = (new Quaternion(['1']))
            .multiply(new Quaternion(['1']))

        expect(res.r).toEqual(1);
        expect(res.i).toEqual(0);
        expect(res.j).toEqual(0);
        expect(res.k).toEqual(0);
    })

    it('complex multiply', () => {
        const res = (new Quaternion(['2i', '2j']))
            .multiply(new Quaternion(['j', '1']))

        expect(res.r).toEqual(-2);
        expect(res.i).toEqual(2);
        expect(res.j).toEqual(2);
        expect(res.k).toEqual(2);
    })
```

i

```rust
    #[test]
    fn simple_multiply() {
        let res = Quaternion::new(vec![String::from("1")])
            .multiply(Quaternion::new(vec![String::from("1")]));

        assert_eq!(res, Quaternion {
            r: 1f64,
            i: 0f64,
            j: 0f64,
            k: 0f64,
        })
    }

    #[test]
    fn complex_multiply() {
        let res = Quaternion::new(vec![String::from("2i"), String::from("2j")])
            .multiply(Quaternion::new(vec![String::from("j"), String::from("1")]));

        assert_eq!(res, Quaternion {
            r: -2f64,
            i: 2f64,
            j: 2f64,
            k: 2f64,
        })
    }
```

Aby porównać kwaterniony, musimy zaimplementować `PartialEq`

```rust
impl PartialEq<Quaternion> for Quaternion {
    fn eq(&self, other: &Quaternion) -> bool {
        self.r == other.r && self.i == other.i && self.j == other.j && self.k == other.k
    }
}
```

W `NodeJS` można to uprościć do zagnieżdżonej pętli w ten sposób

```typescript
    multiply(a: Quaternion): Quaternion {
        const res = new Quaternion([]);
        for (let p of ['r', 'i', 'j', 'k'] as Array<Base>) {
            for (let n of ['r', 'i', 'j', 'k'] as Array<Base>) {
                const {c, d} = Quaternion.multiplyBase(p, n);
                res[d] += c * this[p] * a[n];
            }
        }
        return res;
    }
```

`c` to znak, `d` to nazwa współczynnika.

W `Rust` nie możemy uzyskać dostępu do dynamicznych właściwości, które są znakami, więc musimy dodać dwie metody pomocnicze, aby uzyskać i ustawić wartości przy użyciu znaków.

```rust
    fn get(&self, key: char) -> f64 {
        match key {
            'r' => self.r,
            'i' => self.i,
            'j' => self.j,
            'k' => self.k,
            _ => 0f64
        }
    }

    fn set(&mut self, key: char, value: f64) -> &Quaternion {
        match key {
            'r' => self.r = value,
            'i' => self.i = value,
            'j' => self.j = value,
            'k' => self.k = value,
            _ => ()
        }

        self
    }

    fn multiply(&self, a: Quaternion) -> Quaternion {
        let mut res = Quaternion::new(vec![]);
        for p in vec!['r', 'i', 'j', 'k'] {
            for n in vec!['r', 'i', 'j', 'k'] {
                let SignedCoefficient { c, d } = Quaternion::multiply_base(p, n);
                res.set(d, res.get(d) + c * self.get(p) * a.get(n));
            }
        }
        res
    }
```

ale ogólnie rzecz biorąc, pomysł jest taki sam.

Teraz mamy program, który może odczytać dane wejściowe, przekształcić je w tablicę kwaternionów i pomnożyć je.

![](http://localhost:8484/0dd8108f-02cd-4dfd-84c6-63517935dd45.avif)

Ostatnim brakującym elementem jest sformatowanie wyniku jako łańcucha.

## Formatowanie kwaternionu do łańcuchów

Formatowanie wyników można rozważać jako:

* formatowanie dowolnego pojedynczego współczynnika z użyciem specjalnych traktacji dla `1`
* budowanie uporządkowanej tablicy współczynników, które są łączone w łańcuch

Te operacje są odwrotnością analizy przedstawionej w pierwszej części. Zacznijmy od testów w `node js`

```typescript
    it('format coefficient', () => {
       expect(Quaternion.formatCoefficient('i', 20)).toEqual('20i');
       expect(Quaternion.formatCoefficient('i', 1)).toEqual('i');
       expect(Quaternion.formatCoefficient('', 0)).toEqual('0');
    });

    it('format', () => {
        expect((new Quaternion([]).format())).toEqual('0');
        expect((new Quaternion(['1']).format())).toEqual('1');
        expect((new Quaternion(['i', '1']).format())).toEqual('i+1');
        expect((new Quaternion(['i', '-3.4j', '1']).format())).toEqual('i-3.4j+1');
        expect((new Quaternion(['j', 'k']).format())).toEqual('j+k');

    })
```

Testy analogiczne w `rust`

```rust
    #[test]
    fn format_coefficient() {
        assert_eq!(Quaternion::format_coefficient('i', 20f64), String::from("20i"));
        assert_eq!(Quaternion::format_coefficient('i', 1f64), String::from("i"));
        assert_eq!(Quaternion::format_coefficient(' ', 0f64), String::from("0"));
    }

    #[test]
    fn format() {
        assert_eq!(format!("{}", Quaternion::new(vec![])), String::from("0"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("1")])), String::from("1"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("i"), String::from("1")])), String::from("i+1"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("i"), String::from("-3.4j"), String::from("1")])), String::from("i-3.4j+1"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("j"), String::from("k")])), String::from("j+k"));
    }
```

W funkcji `formatCoefficient` obsługujemy przypadki takie jak `1`, `-` i decydujemy, czy nazwy komponentów takie jak `i`, `j` czy `k` powinny być uwzględnione w wyniku.

```typescript
    static formatCoefficient(type: Base | '', value: number) {
        const out = `${Math.abs(value) === 1 ? (
            Math.sign(value) === 1 ? '' : '-'
        ) : value}${type}`;
        return /[\dijk]$/.test(out) ? out : `${out}1`;
    }
```

i

```rust
    fn format_coefficient(t: char, value: f64) -> String {
        let out = if f64::abs(value) == 1f64 {
            if f64::signum(value) == 1f64 {
                String::from("") + &t.to_string()[..].trim()
            } else {
                String::from("-") + &t.to_string()[..].trim()
            }
        } else {
            format!("{}", value) + &t.to_string()[..].trim()
        };

        match Regex::new(r"[\dijk]$").unwrap().captures(&out[..]) {
            Some(_) => out,
            None => out + "1"
        }
    }
}
```

W funkcji `format` zbieramy te składniki i decydujemy, jak je połączyć. Nie możemy łączyć za pomocą `+`, ponieważ niektóre elementy zaczynają się od `-`. Musimy jednak zająć się przypadkiem `0`. Ostatecznie, w `NodeJS`, mamy:

```typescript
    format(): string {
        let out = [];
        if (this.i) {
            out.push(Quaternion.formatCoefficient('i', this.i));
        }
        if (this.j) {
            out.push(Quaternion.formatCoefficient('j', this.j));
        }
        if (this.k) {
            out.push(Quaternion.formatCoefficient('k', this.k));
        }
        if (this.r) {
            out.push(Quaternion.formatCoefficient('', this.r));
        }

        if (!out.length) return '0';

        return out.reduce((p, n) => p + (
            p.length && Quaternion.getCoefficient('',n.replace(/[kij]/, '')) > 0 ? `+${n}` : `${n}`), ''
        );
    }
```

podczas gdy w implementacji `rust` formatowanie może być wykonane przez funkcję `fmt`

```rust
impl fmt::Display for Quaternion {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut out: Vec<String> = vec![];
        if self.i != 0f64 {
            out.push(Quaternion::format_coefficient('i', self.i))
        }
        if self.j != 0f64 {
            out.push(Quaternion::format_coefficient('j', self.j))
        }
        if self.k != 0f64 {
            out.push(Quaternion::format_coefficient('k', self.k))
        }
        if self.r != 0f64 {
            out.push(Quaternion::format_coefficient(' ', self.r))
        }

        let out = out.into_iter().reduce(
            |p, n| format!(
                "{}{}",
                p.clone(),
                if p.len() > 0 && Quaternion::get_coefficient(&"", n.replace("i", "").replace("j", "").replace("k", "")) > 0f64 {
                    format!("{}{}", "+", n)
                } else {
                    n
                }
            )
        );

        write!(f, "{}", out.unwrap_or(String::from("0")))
    }
}
```

### Ostateczne testy e2e

Aby zweryfikować, że wszystkie komponenty programów odpowiadają sobie nawzajem, możemy przygotować kilka przypadków testowych `e2e` w `node`

```typescript
    it('e2e', () => {
        const cases = [
            {
                in: '(i+j)(k)',
                out: 'i-j'
            },
            {
                in: '(i+j+20)(j-9)',
                out: '-9i+11j+k-181'
            },
            {
                in: '(10i)(10j-k+1)(-99i+j-10k+7)(4)',
                out: '-520i-38920j+6800k+7920'
            },
            {
                in: '(i+j+k+1)(i+2j+4k+8)(i+3j+9k+27)(i+j+8k+8)(i-j+k-10)(99i-j+k-1)(k)(j)(i)(3)',
                out: '11415288i-8751432j-5206896k+9766704'
            }
        ]
        for (const c of cases) {
            const qs = Quaternion.parse(c.in);
            const out = qs.reduce((p, n) => p.multiply(n)).format();
            expect(out).toEqual(c.out);
        }
    })
```

i analogicznie w `rust`

```rust
#[test]
    fn e2e() {
        struct Case {
            input: String,
            output: String,
        }

        let cases: Vec<Case> = vec![
            Case {
                input: String::from("(i+j)(k)"),
                output: String::from("i-j"),
            },
            Case {
                input: String::from("(i+j+20)(j-9)"),
                output: String::from("-9i+11j+k-181"),
            },
            Case {
                input: String::from("(10i)(10j-k+1)(-99i+j-10k+7)(4)"),
                output: String::from("-520i-38920j+6800k+7920"),
            },
            Case {
                input: String::from("(i+j+k+1)(i+2j+4k+8)(i+3j+9k+27)(i+j+8k+8)(i-j+k-10)(99i-j+k-1)(k)(j)(i)(3)"),
                output: String::from("11415288i-8751432j-5206896k+9766704"),
            },
        ];
        for c in cases {
            let qs = Quaternion::parse(&c.input[..]);
            let out = qs.into_iter().reduce(|p, n| p.multiply(n)).unwrap();
            assert_eq!(format!("{}", out), c.output);
        }
    }
```

To koniec tego ćwiczenia. Jeśli jesteś zainteresowany nauką więcej o mnożeniu kwaternionów i o tym, jak jest to związane z geometrią, polecam ci film:

Jak widać, `rust` i `typescript` mają wiele podobnych elementów. Wszystkie opisy i elementy logiczne są identyczne, a jedyne różnice można zauważyć na poziomie składni, która w rust jest bardziej skoncentrowana na eliminacji niesprecyzowanych zachowań. Z drugiej strony w typescript kod może być pisany w nieco bardziej zwięzły sposób, co może poprawić czytelność.
