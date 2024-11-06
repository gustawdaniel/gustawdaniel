---
author: Daniel Gustaw
canonicalName: smallest-common-multiple
coverImage: http://localhost:8484/2584a854-c1e8-458d-8add-5e70e49ef101.avif
description: Solución al problema "Arquería" de la sección "Teoría de Números" de "Hacker Earth". La tarea es determinar el mínimo común múltiplo de una secuencia de números.
excerpt: Solución al problema "Arquería" de la sección "Teoría de Números" de "Hacker Earth". La tarea es determinar el mínimo común múltiplo de una secuencia de números.
publishDate: 2021-11-22T14:38:00.000Z
slug: es/minimo-comun-multiplo
tags: ['javascript', 'numbers-therory', 'mathematica']
title: Múltiplo Común Mínimo - Teoría de Números
updateDate: 2021-11-22T14:38:00.000Z
---

En la plataforma Hacker Earth, puedes encontrar muchas tareas interesantes para programadores.

Uno de ellos: "Tiro con arco" se presenta en este post junto con una discusión sobre la solución.

### Declaración del Problema

Problema

`N` arqueros disparan flechas a los objetivos. Hay un número infinito de objetivos numerados a partir de 1. El arquero `i` dispara a todos los objetivos que son múltiplos de `k_i`.

Encuentra el objetivo más pequeño que sea alcanzado por todos los arqueros.

Entrada

La primera línea contiene un número entero T - el número total de casos de prueba.

A continuación, se presentan T casos de prueba. Cada caso de prueba tiene el siguiente formato:

La primera línea contiene un número natural - N - el número de arqueros. La segunda línea contiene N enteros separados por espacios, donde cada número subsiguiente indica el valor de `k_i` para el arquero.

Salida

Para cada caso de prueba, imprime en una nueva línea **el objetivo más pequeño alcanzado por todos los arqueros.**

Restricciones

```
1 <= T <= 5
1 <= N <= 15
1 <= k_i <= 48
```

![](http://localhost:8484/8125dd8c-e9dc-4dd9-ab8c-cdbaaf274cc1.avif)

Explicación

El primer arquero dispara a los objetivos 2, 4, 6, 8, 10, 12, 14, ...

El segundo arquero dispara a los objetivos 3, 6, 9, 12, ...

El tercer arquero dispara a los objetivos 4, 8, 12, 16, 20, ...

El objetivo más pequeño al que disparan todos los arqueros es 12.

### Solución

Al sacar la historia de los arqueros del problema, nos queda la tarea de encontrar el mínimo común múltiplo.

[Mínimo común múltiplo - Wikipedia](https://es.wikipedia.org/wiki/M%C3%ADnimo_com%C3%BAn_m%C3%BAltiple)

Las fórmulas clave son:

* Teorema fundamental de la aritmética - cada número entero positivo puede expresarse como un producto único de sus factores primos con potencias apropiadas.

![](http://localhost:8484/20687346-ea6f-43fc-8b22-7a7573819554.avif)

* El mínimo común múltiplo (mcm) de un par de números se calculará utilizando esta factorización.

![](http://localhost:8484/29216930-efaf-40f6-81e6-49f186d6a8fc.avif)

#### Algoritmo para encontrar el Mínimo Común Múltiplo

#### Factorización de un Número en Factores Primos

![](http://localhost:8484/102c0a22-4b94-4642-97b0-6e96f9d9bd47.avif)

Este algoritmo se llama "División de prueba" y es el menos eficiente pero el más sencillo de entender de los algoritmos de factorización. Otros se enumeran aquí:

Antes de la implementación, establezcamos una forma de registrar el resultado de la factorización. Usaremos un objeto donde las claves son los factores y los valores son las cantidades de sus ocurrencias. Por ejemplo, para registrar el número `12` que es `2 * 2 * 3`, crearemos un objeto.

```json
{
  2: 2,
  3: 1
}
```

El código se utilizará para cálculos de factorización.

```javascript
function divideTimes(n, i) {
    let counter = 0;
    while(n % i === 0) {
        counter++;
        n = n / i;
    }
    return counter;
}

function primeFactors(n) {
    if(n === 1) return { 1: 1 };
    const res = {};
    let p = 2
    while(n >= p*p) {
        if(n % p === 0) {
            res[p] = divideTimes(n,p);
            n /= Math.pow(p, res[p]);
        } else {
            p++
        }
    }
    if(n > 1) {
        res[n] = 1;
    }
    return res;
}
```

#### Omitiendo Factores Repetidos en la Multiplicación

```
function mergeKeysChoosingMaxValue(prev, next) {
    for(let key of Object.keys(next)) {
        if(prev.hasOwnProperty(key)) {
            prev[key] = Math.max(prev[key], next[key]);
        } else {
            prev[key] = next[key];
        }
    }
    return prev;
}
```

#### Evaluación del valor de un número a partir de sus factores

Finalmente, queremos mostrar números al usuario en lugar de su factorización, así que cambiaremos del formato factorizado al valor numérico puro.

```
function evaluate(object) {
    return Object.keys(object).reduce((prev, key) => {
        return prev * Math.pow(Number(key), object[key]);
    },1)
}
```

#### Integración de la solución con el formato de entrada y salida del programa

```
process.stdin.resume();
process.stdin.setEncoding("utf-8");
let stdin_input = "";

process.stdin.on("data", function (input) {
    stdin_input += input;
});

process.stdin.on("end", function () {
   main(stdin_input);
});
```

La segunda parte consiste en procesar líneas de texto en matrices de números en la función `main` y realizar la tarea en la función `minCommonDiv`.

```
function minCommonDiv(k) {
    const factorized = k.map(primeFactors);
    return evaluate(factorized.reduce(mergeKeysChoosingMaxValue))
}

function main(input) {
    const lines = input.split('\n').filter(line => Boolean(line));
    const T = Number.parseInt(lines.shift());
    const out = [];
    for(let i=0; i<T; i++) {
        lines.shift();
        const k = lines.shift().split(/\s+/).map(n => Number.parseInt(n));
        const res = minCommonDiv(k);
        out.push(res);
    }

    process.stdout.write(out.join("\n") + "\n");
}
```

El programa asumiendo que guardaremos la entrada en `input.txt` y el programa en `app.js`, podemos verificar nuestra solución con el comando:

```
cat input.txt | node app.js
```
