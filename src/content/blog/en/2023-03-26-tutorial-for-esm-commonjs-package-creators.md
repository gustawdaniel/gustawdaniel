---
author: Daniel Gustaw
canonicalName: tutorial-for-esm-commonjs-package-creators
coverImage: http://localhost:8484/1f726cb6-0ad6-4680-8f5f-dc939d66358c.avif
description: There is intense debate in the JS community on dropping CommonJS or using dual packages. I've curated key links and written a tutorial for dual package publishing.
excerpt: There is intense debate in the JS community on dropping CommonJS or using dual packages. I've curated key links and written a tutorial for dual package publishing.
publishDate: 2023-03-26 01:12:20+00:00
slug: en/simplest-tutorial-for-esm-commonjs-package-creators
tags:
- esm
- cjs
- typescript
title: Tutorial for ESM + CommonJS package creators
updateDate: 2023-03-26 15:10:40+00:00
---

I will start from sources and context, then show practical implementation.

## Pure ESM vs Dual Packages

Modules in JavaScript has awesome history and knowledge of their evolution is important for understanding current state and forecasting future shape of JS ecosystem.

[Understanding ES6 Modules via Their History — SitePoint](https://www.sitepoint.com/understanding-es6-modules-via-their-history/)

There is widely cited opinion, that we should provide ESM package only on gist below.

[Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

But it can lead to problems experienced by end users or other maintainers.

[The awkward valley to ESM: Node.js, Victory, and D3](https://formidable.com/blog/2022/victory-esm/)

Breaking compatibility is one of ways of introduction for change, but is painful and leads to errors like these:

```
Error: require() of ES modules is not supported when importing
```

[Error: require() of ES modules is not supported when importing node-fetch](https://stackoverflow.com/questions/69041454/error-require-of-es-modules-is-not-supported-when-importing-node-fetch)

Viewed 123k times

[Error \[ERR\_REQUIRE\_ESM\]: require() of ES Module not supported](https://stackoverflow.com/questions/69081410/error-err-require-esm-require-of-es-module-not-supported)

Viewed 379k times

It is great that knowledge about ESM spreads in community thanks to these errors, but CommonJS is currently default standard for module inclusion in NodeJS world.

[CommonJS vs ES Modules in Node.js - A Detailed Comparison](https://www.knowledgehut.com/blog/web-development/commonjs-vs-es-modules)

I can't find official sources but using GPT-4 we can estimate that in april 2023:

1. ESM adoption reaches a substantial level, possibly around 30-40% of the npm packages.
2. CommonJS continues to hold a significant share, perhaps around 60-70%, due to its historical prevalence and the presence of many legacy projects still using it.
3. Dual packages might represent a slightly larger portion of the ecosystem, around 10-15%, as package authors aim to support both module systems during the transition period.

So because we are in "transition period" I think it is better to take responsibility and provide dual version for existing packages.

![](http://localhost:8484/180dbb8c-8a50-41be-bbf8-97d85f598abd.avif)

If you creating new package I think you can select `ESM` and do not worry about `CommonJS` but if your packages was published earlier, this tutorial is for you.

## Dual package hazard

Before we start you should be aware of existence of hazard for dual packages:

[Modules: Packages | Node.js v19.8.1 Documentation](https://nodejs.org/api/packages.html#dual-package-hazard)

Simplifying if user will write `const pkgInstance = require('pkg')` and in other place `import pkgInstance from 'pkg'` then two instances of package will be created. It can lead to hard to debug problems and undefined behaviors so there are two methods of minimize them.

I prepared diagram that help you do decide which approach best fit to you:

![](http://localhost:8484/e0bcb50f-53f2-4165-9c31-77c0e7e32b38.avif)

If you need to create `ES wrapper` then refer directly to docs. In further chapter I will assume that you have stateless package and will apply `Isolate state` approach.

## Isolated state

There is great practical guide that showing problem similar to this one:

[Supporting CommonJS and ESM with Typescript and Node](https://evertpot.com/universal-commonjs-esm-typescript-packages/)

### Creation of dual package

In this example we will write library that implement `sum` function. Let's create project:

```bash
npm init -y && tsc --init && mkdir -p src && touch src/index.ts
```

in `src/index.ts` file we defining function

```typescript
export function sum(a: number, b: number): number {
    return a+b;
}
```

in `package.json` we adding `script.build` that will create both CJS and ESM

```bash
"build": "npx tsc --module commonjs --outDir cjs/ && echo '{\"type\": \"commonjs\"}' > cjs/package.json && npx tsc --module es2022 --outDir esm/ && echo '{\"type\": \"module\"}' > esm/package.json"
```

because we will create two directories instead of single `dist` we adding to `package.json`

```json
  "exports": {
    "require": "./cjs/index.js",
    "import": "./esm/index.js"
  },
  "types": "./src",
```

Finally in `package.json` we need to change `main`

```bash
  "main": "cjs/index.js"
```

Now after building

```bash
npm run build
```

we can test it in other project.

### Import/require on dual package

Create other project

```bash
npm init -y
```

and add dependency with patch to our original project

```bash
    "sumesm": "file:./../dual"
```

and here in `index.js` we can write

```javascript
const s = require('sumesm');

console.log(s.sum(1, 2));
```

as well as

```javascript
(async () => {
    const s = await import('sumesm');
    console.log(s.sum(1, 2));
})()
```

both will work.

### Test for dual package in jest

Let's go back to our package and write tests.

```bash
npm install --save-dev jest @types/jest ts-jest
npx ts-jest config:init
```

or if you do not able to remember all these commands you can use

```bash
gpt-cli add and config jest for typescript to node project
```

using this program [https://github.com/gustawdaniel/gpt-cli](https://github.com/gustawdaniel/gpt-cli). Lets create test

```bash
mkdir -p test && touch test/sum.test.ts
```

with content

```typescript
import {sum} from "../src";

it('sum', () => {
    expect(sum(1, 2)).toEqual(3)
})
```

and update `script` in `package.json`

```bash
    "test": "jest",
```

test works

```text
Tests:       1 passed, 1 total
Time:        1.185 s
```

we can replace `ts-node` by `esbuild-jest` in `package.json` and `preset: 'ts-jest',` in `jest.config.js` by

```json
"transform": {
    "^.+\\.tsx?$": "esbuild-jest"
  },
```

to speedup tests 8 times

```text
Tests:       1 passed, 1 total
Time:        0.152 s, estimated 2 s
```

and it also works.

Unfortunately tests breaks our build so we have two options.

First is slow, but seems to be stable. It is inclusion:

```json
 "include": [
    "src/**/*"
  ]
```

to `tsconfig.json`. Second is two time faster and it is simple migration from `tsc` to `esbuild`. You can replace old `build` in `package.json` by

```bash
    "build": "npx esbuild --bundle src/index.ts --outdir=cjs --platform=node --format=cjs && echo '{\"type\": \"commonjs\"}' > cjs/package.json && npx esbuild --bundle src/index.ts --outdir=esm --platform=neutral --format=esm && echo '{\"type\": \"module\"}' > esm/package.json"
```

### Check autocompletion of types

Thanks to `"types": "./src",` in `package.json` it works. There is common practice to replace source by files that contains only types, because full sources are heavier. But i prefer this method because it is easier to debug.

To final package you need to append:

```csv
package.json
esm
cjs
src
```

### Building with swc

I was tried to replace `esbuild` by `swc` but it is not ready yet.

## Let's dive in problems

Let's assume now that we need to use package `humanize-string`. I selected this one because it is example of package which dropped `cjs` causing problems. His version `2.1.0` is `cjs`, but `3.0.0` is pure `esm`.

If we will add this package in version `2.1.0` to our project then `cjs` can be builded properly but for `esm` there is error:

![](http://localhost:8484/f426f8ba-43ed-44af-ab1e-b5af1e0596f3.avif)

package `xregexp` that is dependency of `decamelize` had default export in version 4 so it was impossible to easy convert it to `esm`

![](http://localhost:8484/908ea621-1aa8-4a48-a892-f58288b5151f.avif)

we can read about this problem here:

[Import does not work anymore since version 4.4.0 · Issue #305 · slevithan/xregexp](https://github.com/slevithan/xregexp/issues/305)

On the other hand when we will install `humanize-string` in `3.0.0` then building works but tests are broken:

![](http://localhost:8484/56ccdabe-48d6-4ae1-8b78-a7831f34ea96.avif)

fortunately in this case i found solution overriding `decamelize` version:

```
  "dependencies": {
    "humanize-string": "^2.1.0"
  },
  "overrides": {
    "decamelize": "4.0.0"
  }
```

because it dropping `xregexp` dependency

[Release v4.0.0 · sindresorhus/decamelize](https://github.com/sindresorhus/decamelize/releases/tag/v4.0.0)

but if I would not find this option then I would probably move to pnpm for `pnpm patch` or use npm `patch-package`. This scenario is typical if you trying to do something with `esm`.

## Future of JS Packages

Now we are in transition moment. It is quite clear that in future `cjs` modules will be called `legacy` and we will use rather `ESM`. I hope that by offering dual packages instead of ESM-only, users will spend less time dealing with errors. In the meantime, a new wave of developer tools like SWC, esbuild, Rome, and others will continue to improve ESM support. Eventually, we will be able to drop CommonJS support in the future when its impact on end-users becomes negligible.

Thanks for all Reddit users that helped me understand this topic in discussion:

[ESM vs Dual Package?](https://www.reddit.com/r/node/comments/121a1wa/esm_vs_dual_package/)
