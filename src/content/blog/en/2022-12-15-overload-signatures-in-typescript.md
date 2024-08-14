---
author: Daniel Gustaw
canonicalName: overload-signatures-in-typescript
date_updated: 2022-12-14 21:02:01+00:00
description: In TypeScript, we can specify a function that can be called in different
  ways by writing overload signatures. You can use this to define functions with returned
  type dependent from arguments values.
excerpt: In TypeScript, we can specify a function that can be called in different
  ways by writing overload signatures. You can use this to define functions with returned
  type dependent from arguments values.
publishDate: 2022-12-14 21:02:01+00:00
slug: en/overload-signatures-in-typescript
tags:
- typescript
- signatures
- javascript
title: Overload Signatures in Typescript
---


When do you have function that returns different types in dependence from parameter values `overload signatures` can be exactly what do you need.

Let me introduce context.

We have super simple function that computes volume of hypercube:

```typescript
interface HyperCube {
    size: number
    dimension: number
}

export function volume(cube: HyperCube): number {
    return Math.pow(cube.size, cube.dimension);
}
```

But because our volumes are really huge, we need to display them in snake case notation. Eg.: `1_000_000_000` instead of `1000000000`.

We can add function to format

```typescript
export function formatNumber(num: number): string {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1_')
}
```

but we do not want to write this `formatNumber` function always when we using conversion to string. Instead we would like to add second parameter to `volume` function to decide if we returning string or number.

```typescript
export function volume(cube: HyperCube, asString: boolean = false): string | number {
    const volume = Math.pow(cube.size, cube.dimension);
    return asString ? formatNumber(volume) : volume;
}
```

Unfortunately now using `volume` function we do not know if we will get `string` or `number`. We do not want to use `.toString` or `parseInt` any time.

![](https://ucarecdn.com/9be19831-d3c3-453b-abce-b2c40444a931/)

Fortunately, there is a concept called overload signatures. It allows selecting a returned type in dependence from parameters values.

In our case we want `number` is `asString` is false, in other case we need return `string`. To apply overload signature we can use the following syntax

```typescript
export function volume(cube: HyperCube, asString: false): number
export function volume(cube: HyperCube, asString: true): string
export function volume(cube: HyperCube, asString: boolean = false): string | number {
    const volume = Math.pow(cube.size, cube.dimension);
    return asString ? formatNumber(volume) : volume;
}
```

now our returned type is correct and depend from `asString` value.

Sources:

[TypeScript function return type based on input parameter

I have a few different interfaces and objects that each have a type property. Let’s say these are objects stored in a NoSQL db. How can I create a generic getItem function with a deterministic return

![](https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon.png?v&#x3D;c78bd457575a)Stack OverflowArash Motamedi

![](https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon@2.png?v&#x3D;73d79a89bded)](https://stackoverflow.com/questions/54165536/typescript-function-return-type-based-on-input-parameter)

[Documentation - More on Functions

Learn about how Functions work in TypeScript.

![](https://www.typescriptlang.org/icons/icon-512x512.png?v&#x3D;8944a05a8b601855de116c8a56d3b3ae)More on Functions

![](data:image/png;base64,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&#x3D;&#x3D;)](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)
