---
author: Daniel Gustaw
canonicalName: maximum-inequality-linear-search-rust-and-typescript
coverImage: http://localhost:8484/3e9e4456-ce05-4bd0-b136-7bbd4c952edd.avif
description: Tarea simple de hackeartch resuelta en node js y rust. Puedes comparar estos dos lenguajes con el ejemplo de este problema. Recomiendo resolverlo de forma independiente antes de leer las soluciones.
excerpt: Tarea simple de hackeartch resuelta en node js y rust. Puedes comparar estos dos lenguajes con el ejemplo de este problema. Recomiendo resolverlo de forma independiente antes de leer las soluciones.
publishDate: 2022-11-28 16:54:21+00:00
slug: es/maxima-desigualdad
tags:
- linear-search
- rust
- nodejs
- typescript
title: Máxima Desigualdad [Búsqueda Lineal] rust y typescript
updateDate: 2022-11-28 16:54:20+00:00
---

**Problema**

Una función en una cadena binaria *T* de longitud *M* se define de la siguiente manera:

*F(T)* = número de índices *i* (1≤i<M)* tal que *Ti≠Ti+1*.

Se te da una cadena binaria *S* de longitud *N*. Debes dividir la cadena *S* en dos subsecuencias *S1, S2* de tal manera que:

* Cada carácter de la cadena *S* pertenece a uno de *S1* y *S2*.
* Los caracteres de *S1* y *S2* deben aparecer en el orden en que aparecen en *S*.

Encuentra el valor máximo posible de *F(S1)+F(S2)*.

**NOTA:** Una cadena binaria es una cadena que consiste en los caracteres `*0*` y `*1*`. Una de las cadenas *S1*, *S2* puede estar vacía.

**Formato de entrada**

* La primera línea contiene *T* que denota el número de casos de prueba. La descripción de los *T* casos de prueba es la siguiente:
* Para cada caso de prueba:
* La primera línea contiene *N* que denota el tamaño de la cadena *S*.
* La segunda línea contiene la cadena *S*.

**Formato de salida**

Para cada caso de prueba, imprime el valor máximo posible de *F(S1)+F(S2)* en una línea separada.

**Restricciones**

```
1≤T≤10^5
1≤N≤10^5
∣S∣=N $$
S contains characters ′0′ and ′1′.
Sum of N over all test cases does not exceed 2 ⋅ 10^5.
```

Entrada de muestra

```
3
3
011
4
1100
5
11111
```

Salida de Ejemplo

```
1
2
0
```

**Explicación**

**El primer caso de prueba**

* Una posible división es S1=011,S2="" (cadena vacía). Aquí F(S1)+F(S2)=1+0=1. No hay forma de dividir la cadena dada para obtener una respuesta mayor.

**El segundo caso de prueba**

* La división óptima es S1=10,S2=10. Aquí F(S1)+F(S2)=1+1=2. No hay forma de dividir la cadena dada para obtener una respuesta mayor.

**El tercer caso de prueba**

* Para cualquier posible división de *S*, F(S1)+F(S2)=0.

# Solución

Describiré el método y luego presentaré código en javascript y rust.

## Método

Para resolver este problema podemos crear dos punteros - uno para cualquier cabeza de subsecuencia. Luego cambiamos el valor de la primera secuencia tan pronto como sea posible. En otro caso, cambiamos la segunda. Cualquier cambio debe incrementar el contador de cambios. Este algoritmo simple tiene una complejidad de O(n).

## Solución de Node JS

En la solución `node` usaremos el módulo `readline`. Permite crear una interfaz que lanza eventos relacionados con la lectura de la entrada estándar.

```typescript
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
```

Podremos agregar oyentes de eventos en el objeto `rl`, pero ahora vamos a crear `input_array` que se llenará con las líneas subsiguientes.

```typescript
const input_array:string[] = []
```

Ahora podemos escuchar en cualquier línea añadida en la entrada estándar y añadirlas a este arreglo.

```typescript
rl.on('line', (line: string) => {
    input_array.push(line);
});
```

Cuando la entrada se cierre, queremos construir la salida y pasarla a la salida estándar:

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

estamos utilizando la función `solve` que encontrará el número máximo de cambios en ambos. Así que hay una implementación de la función `solve`.

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

Este es el final de typescript, pero vale la pena presentar la prueba. No utilizaremos `jest`, `ava` o `mocha`, que están diseñados para probar el código internamente. En su lugar, decidí probar el programa mediante una prueba de caja negra escrita en `shunit2`. Hay un archivo `text` con datos de prueba.

```text
3
3
011
4
1100
5
11111
```

Del contenido del ejercicio sabemos que las soluciones son `1`, `2` y `0`. Así que mi prueba está escrita en `equality_test.sh`

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

Finalmente, flujo de trabajo de acción de GitHub

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

## Solución en Rust

En Rust, dividimos el proyecto en 2 archivos. Un `main.rs` casi vacío.

```rust
use linear_search_max_inequality::max_inequality;
use std::io;

fn main() -> io::Result<()>{
    max_inequality(&mut io::stdin(), &mut io::stdout())
}
```

y `lib.rs` con toda la lógica y pruebas unitarias. Comencemos con las pruebas.

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

Al leer las pruebas, podemos ver que hay una función `compute_max_inequality` que resuelve el problema principal y `max_inequality` para manejar la entrada y salida correctamente.

La solución del problema es generalmente una copia de la solución del nodo con un poco de complicación por la necesidad de convertir caracteres a cadenas.

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

otro problema que era típico solo para rust es un poco sobrediseñado imprimir vector en nuevas líneas

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

Finalmente, la función principal que lee líneas y calcula resultados.

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

El flujo de trabajo de Rust en GitHub es bastante estándar

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
