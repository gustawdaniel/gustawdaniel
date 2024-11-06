---
author: Daniel Gustaw
canonicalName: tutorial-for-esm-commonjs-package-creators
coverImage: http://localhost:8484/1f726cb6-0ad6-4680-8f5f-dc939d66358c.avif
description: Hay un intenso debate en la comunidad de JS sobre dejar de lado CommonJS o utilizar paquetes duales. He recopilado enlaces clave y escrito un tutorial sobre la publicación de paquetes duales.
excerpt: Hay un intenso debate en la comunidad de JS sobre dejar de lado CommonJS o utilizar paquetes duales. He recopilado enlaces clave y escrito un tutorial sobre la publicación de paquetes duales.
publishDate: 2023-03-26 01:12:20+00:00
slug: es/tutorial-mas-sencillo-para-creadores-de-paquetes-esm-y-commonjs
tags:
- esm
- cjs
- typescript
title: Tutorial para creadores de paquetes ESM + CommonJS
updateDate: 2023-03-26 15:10:40+00:00
---

Comenzaré desde las fuentes y el contexto, luego mostraré la implementación práctica.

## ESM puro vs Paquetes duales

Los módulos en JavaScript tienen una historia impresionante y el conocimiento de su evolución es importante para comprender el estado actual y prever la futura configuración del ecosistema JS.

[Comprendiendo los módulos ES6 a través de su historia — SitePoint](https://www.sitepoint.com/understanding-es6-modules-via-their-history/)

Hay una opinión ampliamente citada que dice que deberíamos proporcionar un paquete ESM solo en el gist a continuación.

[Paquete ESM puro](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

Pero esto puede llevar a problemas experimentados por los usuarios finales u otros mantenedores.

[El valle incómodo hacia ESM: Node.js, Victory y D3](https://formidable.com/blog/2022/victory-esm/)

Romper la compatibilidad es una de las formas de introducir cambios, pero es doloroso y conduce a errores como estos:

```
Error: require() of ES modules is not supported when importing
```

[Error: require() de módulos ES no es compatible al importar node-fetch](https://stackoverflow.com/questions/69041454/error-require-of-es-modules-is-not-supported-when-importing-node-fetch)

Visto 123k veces

[Error \[ERR\_REQUIRE\_ESM\]: require() de módulo ES no soportado](https://stackoverflow.com/questions/69081410/error-err-require-esm-require-of-es-module-not-supported)

Visto 379k veces

Es genial que el conocimiento sobre ESM se propague en la comunidad gracias a estos errores, pero CommonJS es actualmente el estándar predeterminado para la inclusión de módulos en el mundo de NodeJS.

[CommonJS vs Módulos ES en Node.js - Una Comparación Detallada](https://www.knowledgehut.com/blog/web-development/commonjs-vs-es-modules)

No puedo encontrar fuentes oficiales, pero usando GPT-4 podemos estimar que en abril de 2023:

1. La adopción de ESM alcanza un nivel sustancial, posiblemente alrededor del 30-40% de los paquetes npm.
2. CommonJS sigue manteniendo una participación significativa, quizás alrededor del 60-70%, debido a su prevalencia histórica y la presencia de muchos proyectos heredados que aún lo utilizan.
3. Los paquetes duales podrían representar una porción ligeramente mayor del ecosistema, alrededor del 10-15%, ya que los autores de paquetes intentan apoyar ambos sistemas de módulos durante el período de transición.

Entonces, debido a que estamos en un "período de transición", creo que es mejor asumir la responsabilidad y proporcionar una versión dual para los paquetes existentes.

![](http://localhost:8484/180dbb8c-8a50-41be-bbf8-97d85f598abd.avif)

Si estás creando un nuevo paquete, creo que puedes seleccionar `ESM` y no preocuparte por `CommonJS`, pero si tus paquetes fueron publicados anteriormente, este tutorial es para ti.

## Peligro del paquete dual

Antes de comenzar, debes estar consciente de la existencia del peligro de los paquetes duales:

[Modules: Packages | Node.js v19.8.1 Documentation](https://nodejs.org/api/packages.html#dual-package-hazard)

Simplificando, si un usuario escribe `const pkgInstance = require('pkg')` y en otro lugar `import pkgInstance from 'pkg'`, entonces se crearán dos instancias del paquete. Esto puede conducir a problemas difíciles de depurar y comportamientos indefinidos, por lo que hay dos métodos para minimizarlos.

He preparado un diagrama que te ayudará a decidir qué enfoque se adapta mejor a ti:

![](http://localhost:8484/e0bcb50f-53f2-4165-9c31-77c0e7e32b38.avif)

Si necesitas crear un `wrapper ES`, entonces consulta directamente la documentación. En el siguiente capítulo asumiré que tienes un paquete sin estado y aplicaré el enfoque de `estado aislado`.

## Estado aislado

Hay una excelente guía práctica que muestra un problema similar a este:

[Soporte para CommonJS y ESM con Typescript y Node](https://evertpot.com/universal-commonjs-esm-typescript-packages/)

### Creación de un paquete dual

En este ejemplo vamos a escribir una biblioteca que implementa la función `sum`. Vamos a crear un proyecto:

```bash
npm init -y && tsc --init && mkdir -p src && touch src/index.ts
```

en el archivo `src/index.ts` estamos definiendo la función

```typescript
export function sum(a: number, b: number): number {
    return a+b;
}
```

en `package.json` estamos agregando `script.build` que creará tanto CJS como ESM

```bash
"build": "npx tsc --module commonjs --outDir cjs/ && echo '{\"type\": \"commonjs\"}' > cjs/package.json && npx tsc --module es2022 --outDir esm/ && echo '{\"type\": \"module\"}' > esm/package.json"
```

porque crearemos dos directorios en lugar de un solo `dist` que añadimos a `package.json`

```json
  "exports": {
    "require": "./cjs/index.js",
    "import": "./esm/index.js"
  },
  "types": "./src",
```

Finalmente en `package.json` necesitamos cambiar `main`

```bash
  "main": "cjs/index.js"
```

Ahora después de construir

```bash
npm run build
```

podemos probarlo en otro proyecto.

### Importar/requerir en paquete dual

Crear otro proyecto

```bash
npm init -y
```

y añadir dependencia con parche a nuestro proyecto original

```bash
    "sumesm": "file:./../dual"
```

y aquí en `index.js` podemos escribir

```javascript
const s = require('sumesm');

console.log(s.sum(1, 2));
```

así como

```javascript
(async () => {
    const s = await import('sumesm');
    console.log(s.sum(1, 2));
})()
```

ambos funcionarán.

### Prueba para paquete dual en jest

Volvamos a nuestro paquete y escribamos pruebas.

```bash
npm install --save-dev jest @types/jest ts-jest
npx ts-jest config:init
```

o si no puedes recordar todos estos comandos, puedes usar

```bash
gpt-cli add and config jest for typescript to node project
```

usando este programa [https://github.com/gustawdaniel/gpt-cli](https://github.com/gustawdaniel/gpt-cli). Vamos a crear una prueba.

```bash
mkdir -p test && touch test/sum.test.ts
```

con contenido

```typescript
import {sum} from "../src";

it('sum', () => {
    expect(sum(1, 2)).toEqual(3)
})
```

y actualizar `script` en `package.json`

```bash
    "test": "jest",
```

la prueba funciona

```text
Tests:       1 passed, 1 total
Time:        1.185 s
```

podemos reemplazar `ts-node` por `esbuild-jest` en `package.json` y `preset: 'ts-jest',` en `jest.config.js` por

```json
"transform": {
    "^.+\\.tsx?$": "esbuild-jest"
  },
```

para acelerar las pruebas 8 veces

```text
Tests:       1 passed, 1 total
Time:        0.152 s, estimated 2 s
```

y también funciona.

Desafortunadamente, las pruebas rompen nuestra compilación, así que tenemos dos opciones.

La primera es lenta, pero parece ser estable. Es inclusión:

```json
 "include": [
    "src/**/*"
  ]
```

a `tsconfig.json`. El segundo es dos veces más rápido y es una migración simple de `tsc` a `esbuild`. Puedes reemplazar el antiguo `build` en `package.json` por

```bash
    "build": "npx esbuild --bundle src/index.ts --outdir=cjs --platform=node --format=cjs && echo '{\"type\": \"commonjs\"}' > cjs/package.json && npx esbuild --bundle src/index.ts --outdir=esm --platform=neutral --format=esm && echo '{\"type\": \"module\"}' > esm/package.json"
```

### Verificar la autocompletación de tipos

Gracias a `"types": "./src",` en `package.json` funciona. Es una práctica común reemplazar el código fuente por archivos que contienen solo tipos, porque los fuentes completos son más pesados. Pero prefiero este método porque es más fácil de depurar.

Para el paquete final necesitas añadir:

```csv
package.json
esm
cjs
src
```

### Construyendo con swc

Intenté reemplazar `esbuild` por `swc`, pero aún no está listo.

## Vamos a profundizar en los problemas

Supongamos ahora que necesitamos usar el paquete `humanize-string`. Seleccioné este paquete porque es un ejemplo de un paquete que dejó `cjs`, causando problemas. Su versión `2.1.0` es `cjs`, pero `3.0.0` es puro `esm`.

Si añadimos este paquete en la versión `2.1.0` a nuestro proyecto, entonces `cjs` puede construirse correctamente, pero para `esm` hay un error:

![](http://localhost:8484/f426f8ba-43ed-44af-ab1e-b5af1e0596f3.avif)

el paquete `xregexp` que es dependencia de `decamelize` tenía una exportación predeterminada en la versión 4, por lo que era imposible convertirlo fácilmente a `esm`.

![](http://localhost:8484/908ea621-1aa8-4a48-a892-f58288b5151f.avif)

podemos leer sobre este problema aquí:

[La importación ya no funciona desde la versión 4.4.0 · Problema #305 · slevithan/xregexp](https://github.com/slevithan/xregexp/issues/305)

Por otro lado, cuando instalamos `humanize-string` en `3.0.0`, la construcción funciona pero las pruebas están rotas:

![](http://localhost:8484/56ccdabe-48d6-4ae1-8b78-a7831f34ea96.avif)

afortunadamente en este caso encontré una solución sobrescribiendo la versión de `decamelize`:

```
  "dependencies": {
    "humanize-string": "^2.1.0"
  },
  "overrides": {
    "decamelize": "4.0.0"
  }
```

porque se eliminó la dependencia `xregexp`

[Release v4.0.0 · sindresorhus/decamelize](https://github.com/sindresorhus/decamelize/releases/tag/v4.0.0)

pero si no encontrara esta opción, probablemente me mudaría a pnpm para `pnpm patch` o usaría npm `patch-package`. Este escenario es típico si intentas hacer algo con `esm`.

## Futuro de los Paquetes JS

Ahora estamos en un momento de transición. Está bastante claro que en el futuro los módulos `cjs` serán llamados `legacy` y usaremos más bien `ESM`. Espero que al ofrecer paquetes duales en lugar de solo ESM, los usuarios pasen menos tiempo lidiando con errores. Mientras tanto, una nueva ola de herramientas para desarrolladores como SWC, esbuild, Rome y otras seguirán mejorando el soporte de ESM. Eventualmente, podremos eliminar el soporte para CommonJS en el futuro cuando su impacto en los usuarios finales se vuelva insignificante.

Gracias a todos los usuarios de Reddit que me ayudaron a entender este tema en la discusión:

[ESM vs Dual Package?](https://www.reddit.com/r/node/comments/121a1wa/esm_vs_dual_package/)
