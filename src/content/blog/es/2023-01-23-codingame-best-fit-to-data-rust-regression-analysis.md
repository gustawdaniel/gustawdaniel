---
author: Daniel Gustaw
canonicalName: codingame-best-fit-to-data-rust-regression-analysis
coverImage: http://localhost:8484/5b6dbf3a-bdb7-428d-9017-948141dc0725.avif
description: Se derivaron regresiones lineales y logarítmicas aquí. Los modelos se ajustaron en el lenguaje rust. Este artículo muestra que a veces vale la pena mejorar el modelo teórico antes de comenzar la implementación.
excerpt: Se derivaron regresiones lineales y logarítmicas aquí. Los modelos se ajustaron en el lenguaje rust. Este artículo muestra que a veces vale la pena mejorar el modelo teórico antes de comenzar la implementación.
publishDate: 2023-01-22 23:09:20+00:00
slug: es/regresion
tags:
- regression
- rust
- mathematics
- codingame
title: 'CodinGame: Mejor ajuste a los datos - Rust - Análisis de Regresión'
updateDate: 2023-01-22 23:09:20+00:00
---

Discutiremos ejercicio:

[Juegos de programación y desafíos de codificación para programar mejor](https://www.codingame.com/ide/puzzle/blunder-episode-3)

El objetivo es encontrar el modelo que mejor se ajuste al conjunto de datos dado. Por ejemplo, para los datos:

![](http://localhost:8484/a0d8ebee-eb4d-49f1-b261-5260c0f20dc1.avif)

deberíamos imprimir `O(log n)`. Podemos seleccionar modelos de la lista:

* O(1),
* O(log n),
* O(n),
* O(n log n),
* O(n^2),
* O(n^2 log n),
* O(n^3),
* O(2^n)

La entrada del programa contendrá la primera línea con el número de líneas siguientes y cualquier línea siguiente contendrá los valores `n` y `t`.

Hay restricciones:

```
5 < N < 1000
5 < num < 15000
0 < t < 10000000
```

y entrada ejemplar:

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

debería darnos

```
O(n)
```

debido a que es similar al crecimiento lineal.

---

## Ajuste por Mínimos Cuadrados

Podemos derivar la ecuación sobre el coeficiente y asumiendo que queremos minimizar la suma de los cuadrados de las diferencias entre la medición y la predicción de nuestro modelo.

$$ 
R^2 = \sum_i \left( t_i - f(n_i, a) \right)^2 
$$

Este enfoque se llama ajuste por mínimos cuadrados, y puedes leer más sobre él en MathWorld

[Ajuste por Mínimos Cuadrados -- de Wolfram MathWorld](https://mathworld.wolfram.com/LeastSquaresFitting.html)

Un valor mínimo significa que la derivada parcial por el parámetro del modelo `a` es 0.

$$ 
\frac{\partial (R^2)}{\partial a} = - 2 \sum_i \left( t_i - f(n_i, a) \right) \frac{\partial f(n_i, a)}{\partial a} = 0 
$$

## Regresión Lineal

Ahora podemos asumir que la función es linealmente dependiente del parámetro de escalado `a`.

$$ 
f(n_i, a) = a * f(n_i) 
$$

Nuestro objetivo es encontrar la ecuación para calcular `a` y luego `R^2`. Nuestra derivada puede ser simplificada:

$$ 
\frac{\partial f(n_i, a)}{\partial a} = \frac{\partial a f(n_i)}{\partial a} = f(n_i) 
$$

Usando la última ecuación del `Ajuste por Mínimos Cuadrados` podemos calcular `a`

$$ 
\sum_i \left( t_i f(n_i) - a (f(n_i))^2 \right) = 0 
$$

entonces

$$ 
a = \frac{\sum_i t_i f(n_i)}{\sum (f(n_i))^2 } 
$$

y

$$ 
R^2 = \sum_i \left( t_i - a f(n_i) \right)^2 
$$

Nuestras ecuaciones lucen hermosas, pero el diablo está en los detalles.

Si miramos las restricciones de los datos para este ejercicio:

```
5 < N < 1000
5 < num < 15000
0 < t < 10000000
```

y recuerda que los modelos que necesitamos probar es fácil ver que operaremos con números enormes.

Por ejemplo `2^n` con `n = 15 000` es mucho más que el rango máximo de un float de 64 bits

[MAX en std::f64 - Rust](https://doc.rust-lang.org/std/f64/constant.MAX.html)

que está restringido a `2^1024`. Hay trucos que permiten operar en estos rangos, pero en lugar de modificar las limitaciones de las computadoras, utilizaremos matemáticas.

En lugar de operar con números grandes, utilizaremos su logaritmo para el cálculo.

## Regresión Logarítmica

Nuestra solución es consecuencia de la observación de que si igualamos los logaritmos de los modelos con los logaritmos de los datos `t`, entonces como resultado seleccionaremos el mismo modelo.

Así que al agregar `log` tanto a los datos como a la función, obtenemos la ecuación:

$$ 
\frac{\partial (R^2)}{\partial a} = - 2 \sum_i \left( log( t_i) - log(a f(n_i) ) \right) \frac{\partial log( a f(n_i) )}{\partial a} = 0 
$$


Reescribiendo esta ecuación, podemos obtener `a`

$$ 
\sum_i \left( log( t_i) - log(a) - log( f(n_i)) ) \right) \frac{\partial log( a ) + log(f(n_i) )}{\partial a} = 0 
$$

$$ 
\sum_i \left( log( t_i) - log(a) - log( f(n_i)) ) \right) \frac{1}{a} = 0 
$$

$$ 
a = exp( \frac{\sum_i log(t_i) - \sum_i log(f(n_i))}{N} ) 
$$


donde

$$ 
N = \sum_i 1 
$$


y reescribiendo la ecuación para `R^2` vemos:

$$
R^2 = \sum_i ( log( t_i) - log( a * f(n_i) ) )^2 = \sum_i ( log( t_i) - log( f(n_i) ) - log(a) )^2 
$$


Introduzcamos una nueva variable `c` definida como

$$ 
c = log(a) = 1/N ( \sum_i log( t_i) - \sum_i log( f(n_i)) ) ) 
$$


Y luego `R^2` puede reescribirse como

$$ 
R^2 = \sum_i ( log( t_i) - log( f(n_i) ) - c )^2 
$$


Podemos ver que ahora no hay posibilidad de operar con números demasiado grandes, así que podemos comenzar la implementación de estas ecuaciones.

![](http://localhost:8484/761d2c63-871b-4b55-b075-ad6b225d52bc.avif)

## Lectura de series de datos desde la entrada estándar

Comencemos con la definición de la estructura `Point` que representa una única medición.

```rust
#[derive(Debug)]
struct Point {
    n: u32,
    t: u32,
}
```

en `main` leeremos la entrada estándar en un `String` llamado `buffer`.

```rust
fn main() {
    let mut buffer = String::new();
    std::io::stdin().read_to_string(&mut buffer).unwrap();
}
```

queremos procesar este búfer y obtener un vector de `Puntos`. Para hacerlo, estamos escribiendo una función:

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

podemos verificar si funciona añadiendo a la línea `main`

```rust
    println!("{:?}", read_series(buffer));
```

## Cálculo de la suma en series usando cierres

En las ecuaciones presentadas tuvimos algunas sumas, así que para simplificar el código adicional implementemos la función `sum` que puede usar cierres para definir la operación que debe ser sumada.

Inicialmente lo escribí como `noob`

```rust
fn sum(series: &Vec<Point>, expression: impl Fn(&Point) -> f64) -> f64 {
    let mut res = 0f64;
    for point in series {
        res += expression(point)
    }
    res
}
```

pero pronto arreglado como `hacker`

```rust
fn sum(series: &Vec<Point>, expression: impl Fn(&Point) -> f64) -> f64 {
    series.into_iter().fold(0f64, |acc, point| { acc + expression(point) })
}
```

podemos añadir prueba

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

## Evaluación de la Suma de Errores Cuadráticos

Nuestros modelos a probar se pueden representar utilizando estructura

```rust
struct Model {
    name: String,
    fn_log: fn(u32) -> f64,
}
```

pero después de calcular `R^2` podemos guardar el resultado como

```rust
struct EvaluatedMode {
    name: String,
    r2_log: f64,
}
```

esta es una organización de datos conveniente porque los resultados de la evaluación se compararán por `r2_log` pero luego `name` debería estar disponible para imprimir como salida.

Debido a esta razón, seleccionaremos la siguiente firma para la evaluación de `R^2`

```rust
fn evaluate_r2(model: Model, series: &Vec<Point>) -> EvaluatedMode
```

Las series se pasan por referencia de manera similar a como en `sum`. No queremos cambiarlas ni copiarlas, por lo que operar sobre la referencia es la opción preferida para nosotros.

Reescribiendo las ecuaciones derivadas anteriormente en Rust, podemos implementarlas de esta manera.

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

## Selección del modelo mejor ajustado

Para seleccionar el modelo, comenzamos desde la firma de la función.

```rust
fn select_model(series: &Vec<Point>) -> String {
```

y definiendo un vector con modelos posibles para seleccionar. En lugar de las funciones originales, estamos agregando `fn_log`, que son los logaritmos de estas funciones.

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

finalmente estamos mapeando estos modelos a modelos evaluados y reduciendo el resultado al modelo con el `r2_log` más pequeño.

```rust
    models.into_iter().map(|m| { evaluate_r2(m, series) }).reduce(|p, n| {
        if p.r2_log < n.r2_log { p } else { n }
    }).unwrap().name
}
```

es todo. Ahora podemos cambiar la última línea de `main` a

```rust
    println!("{}", select_model(&read_series(buffer)));
```

y nuestro programa funciona.

Tradicionalmente, puedes revisar el código completo con pruebas en mi github

[GitHub - gustawdaniel/codingame-computational-complexity](https://github.com/gustawdaniel/codingame-computational-complexity)

![](http://localhost:8484/c23aba85-16ce-4f94-9ff6-8734a5dcb988.avif)
