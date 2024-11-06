---
author: Daniel Gustaw
canonicalName: overload-signatures-in-typescript
coverImage: http://localhost:8484/4c92b683-70df-4d32-85da-c78094fc0cfc.avif
description: W TypeScript możemy określić funkcję, która może być wywoływana na różne sposoby, pisząc sygnatury przeciążenia. Można to wykorzystać do definiowania funkcji, których typ zwracany zależy od wartości argumentów.
excerpt: W TypeScript możemy określić funkcję, która może być wywoływana na różne sposoby, pisząc sygnatury przeciążenia. Można to wykorzystać do definiowania funkcji, których typ zwracany zależy od wartości argumentów.
publishDate: 2022-12-14 21:02:01+00:00
slug: pl/przeciazenia-podpisow-w-typescript
tags:
- typescript
- signatures
- javascript
title: Przeciążone sygnatury w TypeScript
updateDate: 2022-12-14 21:02:01+00:00
---

Kiedy masz funkcję, która zwraca różne typy w zależności od wartości parametrów, `overload signatures` mogą być dokładnie tym, czego potrzebujesz.

Pozwól, że przedstawię kontekst.

Mamy super prostą funkcję, która oblicza objętość hipersześcianu:

```typescript
interface HyperCube {
    size: number
    dimension: number
}

export function volume(cube: HyperCube): number {
    return Math.pow(cube.size, cube.dimension);
}
```

Ale ponieważ nasze wolumeny są naprawdę ogromne, musimy je wyświetlać w notacji snake case. Na przykład: `1_000_000_000` zamiast `1000000000`.

Możemy dodać funkcję do formatowania.

```typescript
export function formatNumber(num: number): string {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1_')
}
```

ale nie chcemy zawsze pisać tej funkcji `formatNumber` podczas konwersji do string. Zamiast tego chcielibyśmy dodać drugi parametr do funkcji `volume`, aby zdecydować, czy zwracamy string, czy liczbę.

```typescript
export function volume(cube: HyperCube, asString: boolean = false): string | number {
    const volume = Math.pow(cube.size, cube.dimension);
    return asString ? formatNumber(volume) : volume;
}
```

Niestety, obecnie korzystając z funkcji `volume`, nie wiemy, czy otrzymamy `string` czy `number`. Nie chcemy korzystać z `.toString` ani `parseInt` w żadnym przypadku.

![](http://localhost:8484/9be19831-d3c3-453b-abce-b2c40444a931.avif)

Na szczęście istnieje koncepcja zwana sygnaturami przeciążenia. Umożliwia ona wybór typu zwracanego w zależności od wartości parametrów.

W naszym przypadku chcemy, aby `number` był, gdy `asString` jest false, w przeciwnym razie potrzebujemy zwrócić `string`. Aby zastosować sygnaturę przeciążenia, możemy użyć następującej składni:

```typescript
export function volume(cube: HyperCube, asString: false): number
export function volume(cube: HyperCube, asString: true): string
export function volume(cube: HyperCube, asString: boolean = false): string | number {
    const volume = Math.pow(cube.size, cube.dimension);
    return asString ? formatNumber(volume) : volume;
}
```

teraz nasz typ zwracany jest poprawny i zależy od wartości `asString`.

Źródła:

[Typ zwracany funkcji TypeScript w oparciu o parametr wejściowy](https://stackoverflow.com/questions/54165536/typescript-function-return-type-based-on-input-parameter)

[Dowiedz się, jak działają funkcje w TypeScript.](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)
