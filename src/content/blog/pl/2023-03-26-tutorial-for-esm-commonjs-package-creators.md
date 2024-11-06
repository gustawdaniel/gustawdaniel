---
author: Daniel Gustaw
canonicalName: tutorial-for-esm-commonjs-package-creators
coverImage: http://localhost:8484/1f726cb6-0ad6-4680-8f5f-dc939d66358c.avif
description: W społeczności JS trwa intensywna debata na temat porzucenia CommonJS lub korzystania z podwójnych pakietów. Zgromadziłem kluczowe linki i napisałem poradnik dotyczący publikacji podwójnych pakietów.
excerpt: W społeczności JS trwa intensywna debata na temat porzucenia CommonJS lub korzystania z podwójnych pakietów. Zgromadziłem kluczowe linki i napisałem poradnik dotyczący publikacji podwójnych pakietów.
publishDate: 2023-03-26 01:12:20+00:00
slug: pl/najprostszy-samouczek-dla-tworcow-pakietow-esm-commonjs
tags:
- esm
- cjs
- typescript
title: Tutorial dla twórców pakietów ESM + CommonJS
updateDate: 2023-03-26 15:10:40+00:00
---

Zacznę od źródeł i kontekstu, a następnie pokażę praktyczną implementację.

## Czyste ESM vs Podwójne pakiety

Moduły w JavaScript mają wspaniałą historię, a znajomość ich ewolucji jest ważna dla zrozumienia obecnego stanu i prognozowania przyszłego kształtu ekosystemu JS.

[Zrozumienie modułów ES6 poprzez ich historię — SitePoint](https://www.sitepoint.com/understanding-es6-modules-via-their-history/)

Istnieje szeroko cytowana opinia, że powinniśmy dostarczać tylko pakiet ESM według poniższego zestawu.

[Czysty pakiet ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

Jednak może to prowadzić do problemów doświadczanych przez użytkowników końcowych lub innych konserwatorów.

[Dziwna dolina do ESM: Node.js, Victory i D3](https://formidable.com/blog/2022/victory-esm/)

Złamanie kompatybilności jest jednym z sposobów wprowadzenia zmian, ale jest bolesne i prowadzi do błędów takich jak te:

```
Error: require() of ES modules is not supported when importing
```

[Blad: require() modułów ES nie jest obsługiwany podczas importowania node-fetch](https://stackoverflow.com/questions/69041454/error-require-of-es-modules-is-not-supported-when-importing-node-fetch)

Wyświetlono 123k razy

[Blad \[ERR\_REQUIRE\_ESM\]: require() modułu ES nie jest obsługiwany](https://stackoverflow.com/questions/69081410/error-err-require-esm-require-of-es-module-not-supported)

Wyświetlono 379k razy

Wspaniale jest, że wiedza na temat ESM rozpowszechnia się w społeczności dzięki tym błędom, ale CommonJS jest obecnie domyślnym standardem dla włączania modułów w świecie NodeJS.

[CommonJS vs ES Modules w Node.js - Szczegółowe porównanie](https://www.knowledgehut.com/blog/web-development/commonjs-vs-es-modules)

Nie mogę znaleźć oficjalnych źródeł, ale używając GPT-4 możemy oszacować, że w kwietniu 2023 roku:

1. Przyjęcie ESM osiąga znaczny poziom, prawdopodobnie około 30-40% pakietów npm.
2. CommonJS wciąż utrzymuje znaczący udział, być może około 60-70%, ze względu na swoją historyczną dominację oraz obecność wielu projektów legacy, które wciąż go używają.
3. Podwójne pakiety mogą stanowić nieco większą część ekosystemu, około 10-15%, ponieważ autorzy pakietów dążą do wsparcia obu systemów modułów w trakcie okresu przejściowego.

Więc ponieważ jesteśmy w "okresie przejściowym", uważam, że lepiej jest wziąć odpowiedzialność i zapewnić podwójną wersję dla istniejących pakietów.

![](http://localhost:8484/180dbb8c-8a50-41be-bbf8-97d85f598abd.avif)

Jeśli tworzysz nowy pakiet, myślę, że możesz wybrać `ESM` i nie martwić się o `CommonJS`, ale jeśli twoje pakiety były publikowane wcześniej, ten poradnik jest dla ciebie.

## Niebezpieczeństwo podwójnego pakietu

Zanim zaczniemy, powinieneś być świadomy istnienia niebezpieczeństwa związanego z podwójnymi pakietami:

[Moduły: Pakiety | Dokumentacja Node.js v19.8.1](https://nodejs.org/api/packages.html#dual-package-hazard)

Upraszczając, jeśli użytkownik napisze `const pkgInstance = require('pkg')`, a w innym miejscu `import pkgInstance from 'pkg'`, to zostaną utworzone dwie instancje pakietu. Może to prowadzić do trudnych do zdebugowania problemów i nieokreślonych zachowań, dlatego istnieją dwa sposoby, aby je zminimalizować.

Przygotowałem diagram, który pomoże ci zdecydować, które podejście najlepiej do ciebie pasuje:

![](http://localhost:8484/e0bcb50f-53f2-4165-9c31-77c0e7e32b38.avif)

Jeśli musisz stworzyć `ES wrapper`, to odwołaj się bezpośrednio do dokumentacji. W dalszej części założę, że masz bezstanowy pakiet i zastosujesz podejście `Izolowanie stanu`.

## Izolowany stan

Istnieje świetny praktyczny przewodnik, który pokazuje problem podobny do tego:

[Obsługa CommonJS i ESM za pomocą Typescript i Node](https://evertpot.com/universal-commonjs-esm-typescript-packages/)

### Tworzenie podwójnego pakietu

W tym przykładzie napiszemy bibliotekę, która implementuje funkcję `sum`. Stwórzmy projekt:

```bash
npm init -y && tsc --init && mkdir -p src && touch src/index.ts
```

w pliku `src/index.ts` definiujemy funkcję

```typescript
export function sum(a: number, b: number): number {
    return a+b;
}
```

w `package.json` dodajemy `script.build`, który stworzy zarówno CJS, jak i ESM

```bash
"build": "npx tsc --module commonjs --outDir cjs/ && echo '{\"type\": \"commonjs\"}' > cjs/package.json && npx tsc --module es2022 --outDir esm/ && echo '{\"type\": \"module\"}' > esm/package.json"
```

ponieważ stworzymy dwa katalogi zamiast pojedynczego `dist`, dodajemy do `package.json`

```json
  "exports": {
    "require": "./cjs/index.js",
    "import": "./esm/index.js"
  },
  "types": "./src",
```

W końcu w `package.json` musimy zmienić `main`

```bash
  "main": "cjs/index.js"
```

Teraz po zbudowaniu

```bash
npm run build
```

możemy to przetestować w innym projekcie.

### Importuj/załaduj w pakiecie dwukierunkowym

Utwórz inny projekt

```bash
npm init -y
```

i dodaj zależność z poprawką do naszego oryginalnego projektu

```bash
    "sumesm": "file:./../dual"
```

a tutaj w `index.js` możemy napisać

```javascript
const s = require('sumesm');

console.log(s.sum(1, 2));
```

jak również

```javascript
(async () => {
    const s = await import('sumesm');
    console.log(s.sum(1, 2));
})()
```

oba będą działać.

### Test dla podwójnego pakietu w jest

Wróćmy do naszego pakietu i napiszmy testy.

```bash
npm install --save-dev jest @types/jest ts-jest
npx ts-jest config:init
```

lub jeśli nie możesz zapamiętać wszystkich tych poleceń, możesz użyć

```bash
gpt-cli add and config jest for typescript to node project
```

używając tego programu [https://github.com/gustawdaniel/gpt-cli](https://github.com/gustawdaniel/gpt-cli). Stwórzmy test

```bash
mkdir -p test && touch test/sum.test.ts
```

z treścią

```typescript
import {sum} from "../src";

it('sum', () => {
    expect(sum(1, 2)).toEqual(3)
})
```

i zaktualizuj `script` w `package.json`

```bash
    "test": "jest",
```

test działa

```text
Tests:       1 passed, 1 total
Time:        1.185 s
```

możemy zastąpić `ts-node` przez `esbuild-jest` w `package.json` oraz `preset: 'ts-jest',` w `jest.config.js` przez

```json
"transform": {
    "^.+\\.tsx?$": "esbuild-jest"
  },
```

przyspieszyć testy 8 razy

```text
Tests:       1 passed, 1 total
Time:        0.152 s, estimated 2 s
```

i to również działa.

Niestety testy psują nasze kompilacje, więc mamy dwie opcje.

Pierwsza jest wolna, ale wydaje się stabilna. To jest włączenie:

```json
 "include": [
    "src/**/*"
  ]
```

do `tsconfig.json`. Drugie jest dwa razy szybsze i jest prostą migracją z `tsc` do `esbuild`. Możesz zastąpić stary `build` w `package.json` przez

```bash
    "build": "npx esbuild --bundle src/index.ts --outdir=cjs --platform=node --format=cjs && echo '{\"type\": \"commonjs\"}' > cjs/package.json && npx esbuild --bundle src/index.ts --outdir=esm --platform=neutral --format=esm && echo '{\"type\": \"module\"}' > esm/package.json"
```

### Sprawdź autouzupełnianie typów

Dzięki `"types": "./src",` w `package.json` to działa. Istnieje powszechna praktyka zastępowania źródła plikami, które zawierają tylko typy, ponieważ pełne źródła są cięższe. Ale wolę tę metodę, ponieważ jest łatwiejsza do debugowania.

Do końcowego pakietu musisz dodać:

```csv
package.json
esm
cjs
src
```

### Budowanie z swc

Próbowałem zastąpić `esbuild` przez `swc`, ale na razie nie jest to gotowe.

## Zajmijmy się problemami

Załóżmy teraz, że musimy użyć pakietu `humanize-string`. Wybrałem ten, ponieważ jest to przykład pakietu, który porzucił `cjs`, co powoduje problemy. Jego wersja `2.1.0` jest `cjs`, ale `3.0.0` to czysty `esm`.

Jeśli dodamy ten pakiet w wersji `2.1.0` do naszego projektu, to `cjs` może być zbudowany poprawnie, ale dla `esm` występuje błąd:

![](http://localhost:8484/f426f8ba-43ed-44af-ab1e-b5af1e0596f3.avif)

pakiet `xregexp`, który jest zależnością `decamelize`, miał domyślne eksporty w wersji 4, więc niemożliwe było łatwe przekształcenie go na `esm`

![](http://localhost:8484/908ea621-1aa8-4a48-a892-f58288b5151f.avif)

możemy przeczytać o tym problemie tutaj:

[Import nie działa od wersji 4.4.0 · Issue #305 · slevithan/xregexp](https://github.com/slevithan/xregexp/issues/305)

Z drugiej strony, gdy zainstalujemy `humanize-string` w wersji `3.0.0`, wtedy budowanie działa, ale testy są zepsute:

![](http://localhost:8484/56ccdabe-48d6-4ae1-8b78-a7831f34ea96.avif)

na szczęście w tym przypadku znalazłem rozwiązanie nadpisując wersję `decamelize`:

```
  "dependencies": {
    "humanize-string": "^2.1.0"
  },
  "overrides": {
    "decamelize": "4.0.0"
  }
```

ponieważ zrezygnowano z zależności `xregexp`

[Wydanie v4.0.0 · sindresorhus/decamelize](https://github.com/sindresorhus/decamelize/releases/tag/v4.0.0)

ale gdybym nie znalazł tej opcji, to prawdopodobnie przeszedłbym na pnpm dla `pnpm patch` lub użyłbym npm `patch-package`. Ten scenariusz jest typowy, jeśli próbujesz coś zrobić z `esm`.

## Przyszłość pakietów JS

Teraz jesteśmy w momencie przejściowym. Jest dość jasne, że w przyszłości moduły `cjs` będą nazywane `legacy`, a my raczej będziemy używać `ESM`. Mam nadzieję, że oferując dualne pakiety zamiast wyłącznie ESM, użytkownicy spędzą mniej czasu na radzeniu sobie z błędami. W międzyczasie nowa fala narzędzi deweloperskich, takich jak SWC, esbuild, Rome i inne, będzie nadal poprawiać wsparcie dla ESM. Ostatecznie w przyszłości będziemy mogli zrezygnować z wsparcia dla CommonJS, gdy jego wpływ na użytkowników końcowych stanie się znikomy.

Dziękuję wszystkim użytkownikom Reddita, którzy pomogli mi zrozumieć ten temat w dyskusji:

[ESM vs Dual Package?](https://www.reddit.com/r/node/comments/121a1wa/esm_vs_dual_package/)
