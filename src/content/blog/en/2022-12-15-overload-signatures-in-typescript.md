---
author: Daniel Gustaw
canonicalName: overload-signatures-in-typescript
coverImage: http://localhost:8484/4c92b683-70df-4d32-85da-c78094fc0cfc.avif
description: In TypeScript, we can specify a function that can be called in different ways by writing overload signatures. You can use this to define functions with returned type dependent from arguments values.
excerpt: In TypeScript, we can specify a function that can be called in different ways by writing overload signatures. You can use this to define functions with returned type dependent from arguments values.
publishDate: 2022-12-14 21:02:01+00:00
slug: en/overload-signatures-in-typescript
tags:
- typescript
- signatures
- javascript
title: Overload Signatures in Typescript
updateDate: 2022-12-14 21:02:01+00:00
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

![](http://localhost:8484/9be19831-d3c3-453b-abce-b2c40444a931.avif)

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

[TypeScript function return type based on input parameter](https://stackoverflow.com/questions/54165536/typescript-function-return-type-based-on-input-parameter)

[Learn about how Functions work in TypeScript.](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)
