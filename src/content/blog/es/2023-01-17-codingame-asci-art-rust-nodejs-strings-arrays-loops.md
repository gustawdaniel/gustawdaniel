---
author: Daniel Gustaw
canonicalName: codingame-asci-art-rust-nodejs-strings-arrays-loops
coverImage: http://localhost:8484/6e4fd27a-860f-44c6-8b0a-1c473296724b.avif
description: Resolver este rompecabezas enseña cómo gestionar cadenas y aritmética de arreglos. Sabrás cómo dividir una cadena en partes separadas y concatenarlas en una nueva. Puedes usar índices de arreglos.
excerpt: Resolver este rompecabezas enseña cómo gestionar cadenas y aritmética de arreglos. Sabrás cómo dividir una cadena en partes separadas y concatenarlas en una nueva. Puedes usar índices de arreglos.
publishDate: 2023-01-17 18:31:50+00:00
slug: es/asci-art-rust-nodejs
tags:
- asci
- rust
- nodejs
- strings
- arrays
- loops
title: 'CodinGame: Arte ASCI - Rust, NodeJs - Cadenas, Arreglos, Bucles'
updateDate: 2023-01-17 18:31:50+00:00
---

El objetivo del problema es simular una antigua pantalla de terminal de aeropuerto: tu programa debe mostrar una línea de texto en arte ASCII.

Debes dividir cadenas, almacenarlas y recrear otras. Puedes usar estructuras de datos como arreglos o tablas de hash.

Se puede resolver utilizando los siguientes conceptos.

* [Cadenas](https://www.codingame.com/learn/strings)
* [Arreglos](https://www.codingame.com/learn/arrays)
* [Bucles](https://www.codingame.com/learn/loops)

## **El Objetivo**

En estaciones y aeropuertos, a menudo ves este tipo de pantalla:

![](http://localhost:8484/bde46da2-a48c-4b4f-858d-af642e708b0f.avif)

¿Alguna vez te has preguntado cómo podría ser posible simular esta pantalla en un viejo terminal? ¡Lo tenemos: con arte ASCII!

## Reglas

El arte ASCII te permite representar formas utilizando caracteres. Para ser precisos, en nuestro caso, estas formas son palabras. Por ejemplo, la palabra "MANHATTAN" podría mostrarse de la siguiente manera en arte ASCII:

```
# #  #  ### # #  #  ### ###  #  ###
### # # # # # # # #  #   #  # # # #
### ### # # ### ###  #   #  ### # #
# # # # # # # # # #  #   #  # # # #
# # # # # # # # # #  #   #  # # # #
```

Tu misión es escribir un programa que pueda mostrar una línea de texto en arte ASCII en un estilo que se te da como entrada.

## Entrada del Juego

**Entrada**

**Línea 1:** el ancho `L` de una letra representada en arte ASCII. Todas las letras tienen el mismo ancho.

**Línea 2:** la altura `H` de una letra representada en arte ASCII. Todas las letras tienen la misma altura.

**Línea 3:** La línea de texto `T`, compuesta por `N` caracteres ASCII.

**Líneas siguientes:** la cadena de caracteres ABCDEFGHIJKLMNOPQRSTUVWXYZ? representada en arte ASCII.

**Salida**

El texto `T` en arte ASCII.
Los caracteres de la a a la z se muestran en arte ASCII por su equivalente en mayúsculas.
Los caracteres que no están en los intervalos \[a-z\] o \[A-Z\] se mostrarán como un signo de interrogación en arte ASCII.

**Restricciones**

0 < `L` < 30
0 < `H` < 30
0 < `N` < 200

**Ejemplo 1**

**Entrada**

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

**Salida**

```
###
#
##
#
###
```

**Ejemplo 2**

**Entrada**

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

**Salida**

```
# #  #  ### # #  #  ### ###  #  ###
### # # # # # # # #  #   #  # # # #
### ### # # ### ###  #   #  ### # #
# # # # # # # # # #  #   #  # # # #
# # # # # # # # # #  #   #  # # # #
```

## Fuente

Este ejercicio se puede encontrar en codingame.com

[Juegos de Codificación y Desafíos de Programación para Codificar Mejor](https://www.codingame.com/ide/puzzle/ascii-art)

## Solución en NodeJs

Tendremos tres directorios: `node`, `rust` y `cases` con archivos de entrada y salida de texto. En `node` podemos configurar el proyecto usando comandos

```
npm init -y
tsc --init
```

en `tsconfig.json` cambiaremos `target` a `ESNext` para poder usar `padEnd` en nuestro código. Adicionalmente, deberíamos instalar dependencias de desarrollo:

```
npm i -D @types/node typescript
```

### Lectura de líneas

Queremos pasar la entrada por la entrada estándar al programa. Usando el módulo `readline`, podemos escuchar las líneas y el final de la entrada. Cualquier línea se añadirá al array `lines`. Cuando toda la entrada haya sido leída, llamaremos a la función `start` que definiremos más adelante.

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

Además, definimos la función `readline` que nos dará las siguientes líneas del array `lines`.

### Interfaz de la clase que procesa la entrada

Crearemos la clase `Alphabet` que necesitará el tamaño de la letra en el `constructor`. Luego, guardaremos las filas una por una y, finalmente, necesitaremos obtener un array de filas para la cadena dada. Nos enfocaremos en la implementación más tarde, pero ahora veamos la función `start` mencionada anteriormente:

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

esta función será llamada cuando la entrada sea guardada en `lines`. Ahora podemos centrarnos en la implementación de `Alphabet`

### Procesando filas

En `setRow` estamos añadiendo líneas a la propiedad `rows`, pero `padEnd` permite agregar espacios al final de las filas para simplificar el procesamiento posterior.

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

La función `get` comienza obteniendo el código ascii de `A`. Luego preparamos filas de salida vacías. Para cualquier letra de la palabra esperada, estamos computando la posición en nuestro alfabeto usando códigos ascii. Las subcadenas que corresponden a estas letras se añaden a las filas. Finalmente, las filas cumplidas se devuelven del método `get`.

### Shunit para node js

Para probar, podemos usar `shunit2` porque este marco se puede aplicar a cualquier lenguaje y es excelente para usar en casos donde tenemos que probar la entrada y salida de comandos bash.

Este es el contenido de nuestro `shunit.sh`

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

Hay un fragmento `${file/in/"out"}` - esto significa que estamos reemplazando `in` por `out` en las rutas a los archivos. Los archivos en `cases` comienzan con `in` o `out` teniendo el resto de los nombres igual. Puedes verificarlos en el repositorio de github:

[asci-art-rust-node-js/cases at main · gustawdaniel/asci-art-rust-node-js](https://opengraph.githubassets.com/eab81b748e6df897c8f1f504304f64535b3fe2515345883fefb716d3ffe7889d/gustawdaniel/asci-art-rust-node-js)](https://github.com/gustawdaniel/asci-art-rust-node-js/tree/main/cases)

El flujo de trabajo de Node es el siguiente:

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

para que funcione, debemos agregar los `scripts` adecuados en `package.json`

```json
  "scripts": {
    "test": "./shunit.sh"
  },
```

## Solución en Rust

Seguiremos el mismo esquema que en NodeJs. Nuestro código se puede dividir en ayudantes, procesamiento de entrada/salida y la estructura `Alphabet` con sus métodos.

### Ayudantes para cadenas

En `src/main.rs` podemos iniciar el archivo desde

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

hay una macro y una prueba para tres operaciones:

* obtener el código ASCII para un carácter
* rellenar a la izquierda que utiliza `format`
* concatenación para unir dos cadenas

### Procesamiento de entrada y salida

Nuestra función `main` será responsable de leer la entrada y imprimir la salida. El resto de la lógica se ha movido a la estructura `Alphabet`. Ahora mostraremos la función `main`:

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

Es bastante simple, así que podemos ir a la implementación de `Alphabet`.

### Arte ASCI en rust

La estructura se puede declarar como

```rust
struct Alphabet {
    h: usize,
    l: usize,
    rows: Vec<String>,
}
```

Tendremos `i32` en `main`, así que para convertirlos a `usize` agregamos un casting al constructor.

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

cuando añadimos filas necesitaremos `lpad`

```rust
    fn set_row(&mut self, row: String) -> () {
        let line = lpad(row, (25 + 2) * self.l);
        self.rows.push(line);
    }
```

finalmente, la implementación de `get` puede escribirse de la siguiente manera:

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

### Pruebas en rust

Nuestro shunit será casi el mismo que en `node`. La única diferencia es `cargo run` en lugar de `ts-node index.ts`. El flujo de trabajo se puede dividir en construcción, pruebas unitarias y pruebas e2e.

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

### Resumen

Espero que este artículo sea útil para aprender conceptos básicos de rust o javascript. El código completo se puede ver aquí:

[GitHub - gustawdaniel/asci-art-rust-node-js](https://github.com/gustawdaniel/asci-art-rust-node-js)

Si quieres resolver problemas similares, puedes crear una cuenta en `codingame` usando el siguiente enlace:

[https://www.codingame.com/servlet/urlinvite?u=5287657](https://www.codingame.com/servlet/urlinvite?u=5287657)
