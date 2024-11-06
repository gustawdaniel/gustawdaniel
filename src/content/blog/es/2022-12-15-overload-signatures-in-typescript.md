---
author: Daniel Gustaw
canonicalName: overload-signatures-in-typescript
coverImage: http://localhost:8484/4c92b683-70df-4d32-85da-c78094fc0cfc.avif
description: En TypeScript, podemos especificar una función que se puede llamar de diferentes maneras escribiendo firmas de sobrecarga. Puedes usar esto para definir funciones con un tipo de retorno que depende de los valores de los argumentos.
excerpt: En TypeScript, podemos especificar una función que se puede llamar de diferentes maneras escribiendo firmas de sobrecarga. Puedes usar esto para definir funciones con un tipo de retorno que depende de los valores de los argumentos.
publishDate: 2022-12-14 21:02:01+00:00
slug: es/sobrecarga-firmas-en-typescript
tags:
- typescript
- signatures
- javascript
title: Sobrecarga de Firmas en Typescript
updateDate: 2022-12-14 21:02:01+00:00
---

Cuando tienes una función que devuelve diferentes tipos en función de los valores de los parámetros, las `firmas de sobrecarga` pueden ser exactamente lo que necesitas.

Déjame introducir el contexto.

Tenemos una función súper simple que calcula el volumen de un hipercubo:

```typescript
interface HyperCube {
    size: number
    dimension: number
}

export function volume(cube: HyperCube): number {
    return Math.pow(cube.size, cube.dimension);
}
```

Pero debido a que nuestros volúmenes son realmente grandes, necesitamos mostrarlos en notación de snake case. Ej.: `1_000_000_000` en lugar de `1000000000`.

Podemos agregar una función para formatear.

```typescript
export function formatNumber(num: number): string {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1_')
}
```

pero no queremos escribir esta función `formatNumber` siempre que usamos la conversión a cadena. En su lugar, nos gustaría agregar un segundo parámetro a la función `volume` para decidir si devolvemos una cadena o un número.

```typescript
export function volume(cube: HyperCube, asString: boolean = false): string | number {
    const volume = Math.pow(cube.size, cube.dimension);
    return asString ? formatNumber(volume) : volume;
}
```

Desafortunadamente, ahora al usar la función `volume` no sabemos si obtendremos un `string` o un `number`. No queremos usar `.toString` o `parseInt` en ningún momento.

![](http://localhost:8484/9be19831-d3c3-453b-abce-b2c40444a931.avif)

Afortunadamente, existe un concepto llamado firmas de sobrecarga. Permite seleccionar un tipo de retorno en dependencia de los valores de los parámetros.

En nuestro caso queremos que `number` sea `asString` es falso, en otro caso necesitamos devolver `string`. Para aplicar la firma de sobrecarga, podemos usar la siguiente sintaxis

```typescript
export function volume(cube: HyperCube, asString: false): number
export function volume(cube: HyperCube, asString: true): string
export function volume(cube: HyperCube, asString: boolean = false): string | number {
    const volume = Math.pow(cube.size, cube.dimension);
    return asString ? formatNumber(volume) : volume;
}
```

ahora nuestro tipo de retorno es correcto y depende del valor de `asString`.

Fuentes:

[Tipo de retorno de la función TypeScript basado en el parámetro de entrada](https://stackoverflow.com/questions/54165536/typescript-function-return-type-based-on-input-parameter)

[Aprende sobre cómo funcionan las funciones en TypeScript.](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)
