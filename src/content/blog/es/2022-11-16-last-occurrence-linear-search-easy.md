---
author: Daniel Gustaw
canonicalName: last-occurrence-linear-search-easy
coverImage: http://localhost:8484/f0cf18ae-5174-47c0-81af-cb479a0c36b3.avif
description: Encuentra e imprime el índice de la última ocurrencia del elemento en el array.
excerpt: Encuentra e imprime el índice de la última ocurrencia del elemento en el array.
publishDate: 2022-11-16 17:22:37+00:00
slug: es/ultima-ocurrencia
tags:
- rust
- linear search
- easy
title: Última Ocurrencia [Búsqueda Lineal] fácil
updateDate: 2022-11-28 14:40:24+00:00
---

Se te ha dado un arreglo de tamaño *N* que consiste en enteros. Además, se te ha dado un elemento *M* que necesitas encontrar e imprimir el índice de la última ocurrencia de este elemento *M* en el arreglo si existe en él, de lo contrario imprime -1. Considera que este arreglo es de indexación 1.

**Formato de Entrada**:

La primera línea consiste en 2 enteros *N* y *M* que denotan el tamaño del arreglo y el elemento a buscar en el arreglo respectivamente. La siguiente línea contiene *N* enteros separados por espacios que denotan los elementos del arreglo.

**Formato de Salida**

Imprime un solo entero que denota el índice de la última ocurrencia del entero *M* en el arreglo si existe, de lo contrario imprime -1.

**Restricciones**

$$
1 \le N \le 10^5
$$

$$
1 \le A[i] \le 10^9
$$

$$
1 \le M \le 10^9
$$


**EJEMPLO DE ENTRADA**

```
5 1
1 2 3 4 1
```

**SALIDA DE MUESTRA**

```
5
```

Solución

En `main.rs` podemos agregar una función principal que procese los flujos de entrada y salida.

```rust
use linear_sort_reverse_search_rust_easy::reverse_search;
use std::io;

fn main() -> io::Result<()> {
    reverse_search(&mut io::stdin(), &mut io::stdout())
}
```

en `lib.rs` está el resto de nuestro código

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

[orden-lineal-busqueda-inversa-rust-facil](https://github.com/gustawdaniel/linear-sort-reverse-search-rust-easy)
