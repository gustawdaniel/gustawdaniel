---
author: Daniel Gustaw
canonicalName: codingame-best-fit-to-data-rust-regression-analysis
coverImage: http://localhost:8484/5b6dbf3a-bdb7-428d-9017-948141dc0725.avif
description: W tym miejscu przedstawiono regresje liniowe i logarytmiczne. Modele zostały dopasowane w języku rust. Artykuł pokazuje, że czasami warto poprawić model teoretyczny przed rozpoczęciem implementacji.
excerpt: W tym miejscu przedstawiono regresje liniowe i logarytmiczne. Modele zostały dopasowane w języku rust. Artykuł pokazuje, że czasami warto poprawić model teoretyczny przed rozpoczęciem implementacji.
publishDate: 2023-01-22 23:09:20+00:00
slug: pl/regresja
tags:
- regression
- rust
- mathematics
- codingame
title: 'CodinGame: Najlepsze dopasowanie do danych - Rust - Analiza regresji'
updateDate: 2023-01-22 23:09:20+00:00
---

Będziemy omawiać ćwiczenie:

[Gry programistyczne i wyzwania programistyczne, aby lepiej kodować](https://www.codingame.com/ide/puzzle/blunder-episode-3)

Celem jest znalezienie najlepiej dopasowanego modelu do danego zestawu danych. Na przykład dla danych:

![](http://localhost:8484/a0d8ebee-eb4d-49f1-b261-5260c0f20dc1.avif)

powinniśmy wydrukować `O(log n)`. Możemy wybrać modele z listy:

* O(1),
* O(log n),
* O(n),
* O(n log n),
* O(n^2),
* O(n^2 log n),
* O(n^3),
* O(2^n)

Wejście programu będzie zawierać pierwszy wiersz z liczbą kolejnych wierszy, a każdy kolejny wiersz będzie zawierał wartości `n` i `t`.

Są ograniczenia:

```
5 < N < 1000
5 < num < 15000
0 < t < 10000000
```

i przykładowe wejście:

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

powinno dać nam

```
O(n)
```

ponieważ jest podobne do liniowego wzrostu.

---

## Dopasowanie metodą najmniejszych kwadratów

Możemy wyprowadzić równanie na współczynniki, zakładając, że chcemy zminimalizować sumę drugich potęg różnic między pomiarem a prognozą naszego modelu.

$$ 
R^2 = \sum_i \left( t_i - f(n_i, a) \right)^2 
$$


Podejście to nazywa się dopasowaniem metodą najmniejszych kwadratów, a więcej na ten temat można przeczytać w MathWorld.

[Dopasowanie metodą najmniejszych kwadratów -- z Wolfram MathWorld](https://mathworld.wolfram.com/LeastSquaresFitting.html)

Minimalna wartość oznacza, że pochodna cząstkowa według parametru modelu `a` wynosi 0.

$$ 
\frac{\partial (R^2)}{\partial a} = - 2 \sum_i \left( t_i - f(n_i, a) \right) \frac{\partial f(n_i, a)}{\partial a} = 0 
$$

## Regresja Liniowa

Teraz możemy założyć, że funkcja jest liniowo zależna od parametru skalowania `a`.

$$ 
f(n_i, a) = a * f(n_i) 
$$


Naszym celem jest znalezienie równania do obliczenia `a`, a następnie `R^2`. Nasza pochodna może zostać uproszczona:

$$ 
\frac{\partial f(n_i, a)}{\partial a} = \frac{\partial a f(n_i)}{\partial a} = f(n_i) 
$$


Używając ostatniego równania z `Dopasowania metodą najmniejszych kwadratów`, możemy obliczyć `a`.

$$ 
\sum_i \left( t_i f(n_i) - a (f(n_i))^2 \right) = 0 
$$


więc

$$ 
a = \frac{\sum_i t_i f(n_i)}{\sum (f(n_i))^2 } 
$$


i

$$ 
R^2 = \sum_i \left( t_i - a f(n_i) \right)^2 
$$


Nasze równania wyglądają pięknie, ale diabeł tkwi w szczegółach.

Jeśli przyjrzymy się ograniczeniom danych w tym ćwiczeniu:

```
5 < N < 1000
5 < num < 15000
0 < t < 10000000
```

i pamiętaj, że modele, które musimy przetestować, łatwo zobaczyć, że będziemy operować na ogromnych liczbach.

Na przykład `2^n` przy `n = 15 000` to znacznie więcej niż maksymalny zasięg 64-bitowego float.

[MAX w std::f64 - Rust](https://doc.rust-lang.org/std/f64/constant.MAX.html)

który jest ograniczony do `2^1024`. Są sztuczki, które pozwalają na operacje w tych zakresach, ale zamiast omijania ograniczeń komputerów użyjemy matematyki.

Zamiast operować na dużych liczbach, użyjemy ich logarytmu do obliczeń.

## Regresja Logarytmiczna

Nasze rozwiązanie wynika z obserwacji, że jeśli dopasujemy logarytmy modeli do logarytmów danych `t`, to w rezultacie wybierzemy ten sam model.

Dodając `log` zarówno do danych, jak i funkcji, otrzymujemy równanie:

$$ 
\frac{\partial (R^2)}{\partial a} = - 2 \sum_i \left( log( t_i) - log(a f(n_i) ) \right) \frac{\partial log( a f(n_i) )}{\partial a} = 0 
$$


przepisując to równanie, możemy uzyskać `a`

$$ 
\sum_i \left( log( t_i) - log(a) - log( f(n_i)) ) \right) \frac{\partial log( a ) + log(f(n_i) )}{\partial a} = 0 
$$

$$ 
\sum_i \left( log( t_i) - log(a) - log( f(n_i)) ) \right) \frac{1}{a} = 0 
$$

$$ 
a = exp( \frac{\sum_i log(t_i) - \sum_i log(f(n_i))}{N} ) 
$$


gdzie

$$ 
N = \sum_i 1 
$$


a przepisując równanie dla `R^2` widzimy:

$$
R^2 = \sum_i ( log( t_i) - log( a * f(n_i) ) )^2 = \sum_i ( log( t_i) - log( f(n_i) ) - log(a) )^2 
$$


Wprowadźmy nową zmienną `c`, zdefiniowaną jako

$$ 
c = log(a) = 1/N ( \sum_i log( t_i) - \sum_i log( f(n_i)) ) ) 
$$


a następnie `R^2` może być przepisane jako

$$ 
R^2 = \sum_i ( log( t_i) - log( f(n_i) ) - c )^2 
$$


widocznie teraz nie ma szans na operacje na zbyt dużych liczbach, więc możemy rozpocząć implementację tych równań.

![](http://localhost:8484/761d2c63-871b-4b55-b075-ad6b225d52bc.avif)

## Odczyt serii danych z standardowego wejścia

Zacznijmy od definicji struktury `Point`, która reprezentuje pojedynczy pomiar.

```rust
#[derive(Debug)]
struct Point {
    n: u32,
    t: u32,
}
```

w `main` przeczytamy standardowe wejście do `String` o nazwie `buffer`.

```rust
fn main() {
    let mut buffer = String::new();
    std::io::stdin().read_to_string(&mut buffer).unwrap();
}
```

chcemy przetworzyć ten bufor i uzyskać wektor `Points`. Aby to zrobić, piszemy funkcję:

```rust
fn read_series(input: String) -> Vec<Point> {
    let mut iterator = input.lines();
    let n = iterator.next();
    let mut res: Vec<Point> = vec![];

    if Some(n).is_some() {
        for line in iterator {
            if let Some((n, y)) = line.split_once(' ') {
                res.push(Point {
                    n: n.parse::<u32>().unwrap_or(0),
                    t: y.parse::<u32>().unwrap_or(0),
                });
            }
        }
        return res;
    }

    return vec![];
}
```

możemy sprawdzić, czy to działa dodając do linii `main`

```rust
    println!("{:?}", read_series(buffer));
```

## Obliczanie sumy w szeregach za pomocą zamknięć

W prezentowanych równaniach mieliśmy kilka sum, więc aby uprościć dalszy kod, zaimplementujmy funkcję `sum`, która może używać zamknięć do zdefiniowania operacji, co powinno być sumowane.

Początkowo napisałem to jako `noob`

```rust
fn sum(series: &Vec<Point>, expression: impl Fn(&Point) -> f64) -> f64 {
    let mut res = 0f64;
    for point in series {
        res += expression(point)
    }
    res
}
```

ale wkrótce naprawiono jako `hacker`

```rust
fn sum(series: &Vec<Point>, expression: impl Fn(&Point) -> f64) -> f64 {
    series.into_iter().fold(0f64, |acc, point| { acc + expression(point) })
}
```

możemy dodać test

```rust
#[cfg(test)]
mod tests {
    use crate::{Point, sum};

    #[test]
    fn sum_test() {
        assert_eq!(sum(
            &vec![Point { n: 0u32, t: 1u32 }, Point { n: 1u32, t: 2u32 }],
            |p: &Point| { f64::from(p.t) },
        ), 3f64);
    }
}
```

## Ocena sumy kwadratów

Nasze modele do testowania można przedstawić za pomocą struktury

```rust
struct Model {
    name: String,
    fn_log: fn(u32) -> f64,
}
```

ale po obliczeniu `R^2` możemy zapisać wynik jako

```rust
struct EvaluatedMode {
    name: String,
    r2_log: f64,
}
```

to jest wygodna organizacja danych, ponieważ wyniki oceny będą porównywane za pomocą `r2_log`, ale wtedy `name` powinno być dostępne do wydruku jako wynik.

Z tego powodu wybierzemy następującą sygnaturę do oceny `R^2`

```rust
fn evaluate_r2(model: Model, series: &Vec<Point>) -> EvaluatedMode
```

Seria jest przekazywana przez referencję, podobnie jak w `sum`. Nie chcemy ich zmieniać ani kopiować, dlatego operowanie na referencji jest dla nas preferowaną opcją.

Przepisując wcześniejsze równania na Rust, możemy to zaimplementować w ten sposób

```rust
fn evaluate_r2(model: Model, series: &Vec<Point>) -> EvaluatedMode {
    let Model { name, fn_log } = model;
    let c = 1.0 / series.len() as f64 * sum(
        &series,
        |p| { f64::ln(f64::from(p.t)) - fn_log(p.n) },
    );
    let r2_log = sum(
        &series,
        |p| f64::powi(f64::ln(f64::from(p.t)) - fn_log(p.n) - c, 2),
    );
    EvaluatedMode {
        name,
        r2_log,
    }
}
```

## Wybór najlepiej dopasowanego modelu

Aby wybrać model, zaczynamy od sygnatury funkcji.

```rust
fn select_model(series: &Vec<Point>) -> String {
```

i definiowanie wektora z modelami, które można wybrać. Zamiast oryginalnych funkcji dodajemy `fn_log`, które są logarytmami tych funkcji.

```rust
    let models: Vec<Model> = vec![
        Model {
            name: String::from("O(1)"),
            fn_log: |_n| 0f64,
        },
        Model {
            name: String::from("O(log n)"),
            fn_log: |n| f64::ln(f64::ln(f64::from(n))),
        },
        Model {
            name: String::from("O(n)"),
            fn_log: |n| f64::ln(f64::from(n)),
        },
        Model {
            name: String::from("O(n log n)"),
            fn_log: |n| f64::ln(f64::from(n)) + f64::ln(f64::ln(f64::from(n))),
        },
        Model {
            name: String::from("O(n^2)"),
            fn_log: |n| 2.0 * f64::ln(f64::from(n)),
        },
        Model {
            name: String::from("O(n^2 log n)"),
            fn_log: |n| 2.0 * f64::ln(f64::from(n)) + f64::ln(f64::ln(f64::from(n))),
        },
        Model {
            name: String::from("O(n^3)"),
            fn_log: |n| 3.0 * f64::ln(f64::from(n)),
        },
        Model {
            name: String::from("O(2^n)"),
            fn_log: |n| f64::from(n) * f64::ln(2.0),
        },
    ];
```

w końcu mapujemy te modele do ocenianych modeli i redukujemy wynik do modelu z najmniejszym `r2_log`

```rust
    models.into_iter().map(|m| { evaluate_r2(m, series) }).reduce(|p, n| {
        if p.r2_log < n.r2_log { p } else { n }
    }).unwrap().name
}
```

to wszystko. Teraz możemy zmienić ostatnią linię `main` na

```rust
    println!("{}", select_model(&read_series(buffer)));
```

i nasz program działa.

Tradycyjnie możesz sprawdzić cały kod z testami na moim githubie

[GitHub - gustawdaniel/codingame-computational-complexity](https://github.com/gustawdaniel/codingame-computational-complexity)

![](http://localhost:8484/c23aba85-16ce-4f94-9ff6-8734a5dcb988.avif)
