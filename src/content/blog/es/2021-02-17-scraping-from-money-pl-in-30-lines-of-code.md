---
author: Daniel Gustaw
canonicalName: scraping-from-money-pl-in-30-lines-of-code
coverImage: http://localhost:8484/f92c69bd-529d-4ea3-9094-69da20ca9232.avif
description: Vea un caso de estudio simple sobre la descarga y el procesamiento de datos de una tabla paginada.
excerpt: Vea un caso de estudio simple sobre la descarga y el procesamiento de datos de una tabla paginada.
publishDate: 2021-02-17 15:10:17+00:00
slug: es/raspando-libor-y-wibor-de-money-pl
tags:
- libor
- mongo
- scraping
title: Raspado de money.pl en 30 líneas de código.
updateDate: 2021-02-17 21:03:26+00:00
---

Se recomienda descargar datos financieros de buena calidad y convenientes desde Stooq.

Sin embargo, antes de enterarme de este servicio, los descargaba de otras fuentes. En este artículo, presento un caso en el que la interfaz poco amigable del sitio web me obligó a raspar y descargar los datos que necesitaba.

En el artículo, aprenderás a hacerlo rápidamente. Verás qué herramientas utilizo y cómo organizo el código para proyectos de raspado.

Como si nada hubiera pasado, voy en línea y quiero descargar `LIBORCHF3M` y `WIBOR3M`. Incluso encuentro un sitio web que proporciona dichos datos:

[Archivo de cotizaciones para LIBOR franco suizo 3M (LIBORCHF3M)](https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,1.html)

![](http://localhost:8484/3d264f28-b578-4109-a4e7-939d74de1e3f.avif)

Hago clic en descargar y incluso recibo el archivo, pero después de seleccionar el período completo y elegir los datos correctos veo:

![](http://localhost:8484/da1f58ed-b8f1-431c-a159-8caf6f8d1356.avif)

> Número de filas limitado a 50

¿Quién lo limitó? ¿Cuál es el propósito de este formulario si no se puede usar!? Se sabe que cuando alguien quiere procesar datos, es mejor tener el rango más amplio posible.

En esta entrada, mostraré cómo eludir el problema con una cantidad mínima de líneas de código y realizar un scraping rápido. A continuación, se presenta el plan de acción que exhibiré:

1. Verificar cómo acceder a estos datos.
2. Descargar los datos en la máquina local.
3. Describir la estructura objetivo.
4. Procesar las páginas descargadas.

Objetivos principales:

* minimizar el tiempo y las líneas de código para esta tarea

# Cómo acceder a los datos

Resulta que cuando mostramos la tabla, los datos se pueden leer de ella y estarán paginados.

![](http://localhost:8484/f21ad04b-f819-4688-9304-ca972265f3cf.avif)

Los enlaces tienen la forma:

```
BASE_PREFIX${index}BASE_POSTFIX
```

Por ejemplo

```
https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,1.html
```

Renderizado en el backend, que vemos al revisar el código fuente de la página:

![](http://localhost:8484/d2d08c47-c9b0-4aca-bd95-24bc095de2e1.avif)

Plan potencial 1:

* descarga todos los bucles en bash usando wget - una línea
* procesa todos los archivos descargados en `node` con `jsdom` 30 líneas

Plan potencial 2

* descarga archivos CSV cada 50 días dentro del rango de fechas - alrededor de 40 líneas de `node`
* procésalos en aproximadamente 1 línea en sed / awk / perl / bash

La opción con CSV sería más simple si no fuera por la problemática paginación por fechas. Trabajar con fechas en `js` es bastante desagradable, sin embargo, ambas estrategias son racionales. Si quisiera ahorrar transferencia de red o potencia computacional, el plan 2 claramente supera al plan 1. Sin embargo, nuestro objetivo es minimizar la cantidad de código, así que lo haremos de la primera manera.

# Recuperación de datos

Enlaces:

```
LIBOR:

https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,1.html

Stron: 245

WIBOR:

https://www.money.pl/pieniadze/depozyty/zlotowearch/1921-02-05,2021-02-05,WIBOR3M,strona,1.html

Stron: 178
```

Necesitaremos un bucle `for` y `wget`. Para la prueba, verificaremos `i=1`.

```
for i in {1..1}; do wget "https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,$i.html" -O raw; done
```

Resulta que la respuesta a `403`

```
--2021-02-05 16:59:56--  https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,1.html
Loaded CA certificate '/etc/ssl/certs/ca-certificates.crt'
Resolving www.money.pl (www.money.pl)... 212.77.101.20
Connecting to www.money.pl (www.money.pl)|212.77.101.20|:443... connected.
HTTP request sent, awaiting response... 403 Forbidden
2021-02-05 16:59:56 ERROR 403: Forbidden.
```

¿Podría ser que esta página fue rastreada tan a menudo con `wget` que los administradores bloquearon las solicitudes para el agente de usuario predeterminado de wget?

![](http://localhost:8484/a01f54f5-5d4c-47d2-b9b8-220e924bed30.avif)

No me sorprendería, considerando el hecho de que Wget no oculta su identidad en absoluto. Httpie no es mejor.

![](http://localhost:8484/2d2cbb6c-17d2-451f-95ab-a67271405e5f.avif)

pero es menos conocido, por eso funciona

![](http://localhost:8484/f636546c-641b-4405-853f-faa0c337217d.avif)

Para `LIBORCHF3M`

```
mkdir -p raw && for i in {1..245}; do http -b "https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,$i.html" > "raw/l${i}.html";echo $i; done
```

Para `WIBOR3M`

```
mkdir -p raw && for i in {1..178}; do http -b "https://www.money.pl/pieniadze/depozyty/zlotowearch/1921-02-05,2021-02-05,WIBOR3M,strona,$i.html" > "raw/w${i}.html";echo $i; done
```

En el directorio `raw`, ya tenemos todos los archivos necesarios para el procesamiento.

![](http://localhost:8484/6a907b6c-e625-46a2-be35-270e2fdc5229.avif)

# Describiendo la estructura objetivo

Quiero tener un archivo `json` con la siguiente estructura como salida

```
{
   "WIBOR3M": { 'YYYY-MM-DD': value, ... },
   "LIBORCHF3M": { 'YYYY-MM-DD': value, ... }
}
```

# Procesamiento de Páginas Descargadas

Estamos comenzando el proyecto

```
npm init -y && tsc --init && touch app.ts
```

Instalando `jsdom` para analizar el árbol DOM del lado de Node.js.

```
npm i jsdom @types/jsdom @types/node
```

Al final compararemos `jsdom` con `cheerio`. Pero por ahora, asumamos que lograremos la tarea utilizando la primera biblioteca.

La estructura base es bastante predecible.

```
import fs from 'fs';
import {JSDOM} from 'jsdom';

const main = () => {
   // get all files
   // process any of them
   // using file names and data compose final strucutre
   // save it
}

console.dir(main())
```

Ahora queremos leer todos los archivos. Escribimos una función para esto:

```
const getFiles = (): { type: string, content: string }[] => fs
  .readdirSync(process.cwd() + `/raw`)
  .map(name => ({
    type: name[0] === 'l' ? 'LIBORCHF3M' : 'WIBOR3M',
    content: fs.readFileSync(process.cwd() + '/raw/' + name).toString()
  }))
```

Ahora procesaremos una sola tabla:

![](http://localhost:8484/ad5cde4e-061f-48f4-b58c-9a9dd680399e.avif)

Definiendo Interfaces

```
interface FileInput {
  type: string,
  content: string
}

interface Output {
  [key: string]: { [date: string]: number }
}
```

La función de procesamiento de archivos tomará la forma:

```
const processFile = ({ type, content }: FileInput): Output => ({
  [type]: [...new JSDOM(content).window.document.querySelectorAll('.tabela.big.m0.tlo_biel>tbody>tr')].reduce((p, n) => ({
    ...p,
    [n.querySelector('td')?.textContent || '']: (n.querySelector('td.ar')?.textContent || '').replace(',', '.')
  }), {})
})
```

su uso podría verse así

```
const main = () => {
  return getFiles().map(processFile)
}

console.dir(main())
```

La ejecución devuelve datos que aún necesitamos reducir a solo un par de claves - `LIBORCHF3M` y `WIBOR3M`

![](http://localhost:8484/67386ff8-1f34-41e8-b420-8de3aba109bd.avif)

La reducción requiere fusionar objetos en claves, por lo que añadiremos una función a ello.

```
const reducer = (p: Output, n: Output): Output => {
  Object.keys(n).forEach(k => {
    Object.keys(p).includes(k) ?  p[k] = { ...p[k], ...n[k] } : p[k] = n[k];
  })
  return p
}
```

El código completo puede verse finalmente así

```ts
import fs from 'fs'
import { JSDOM } from 'jsdom'

interface FileInput {
    type: string,
    content: string
}

interface Output {
    [key: string]: { [date: string]: number }
}

const getFiles = (): FileInput[] => fs.readdirSync(process.cwd() + `/raw`).map(name => ({
    type: name[0] === 'l' ? 'LIBORCHF3M' : 'WIBOR3M',
    content: fs.readFileSync(process.cwd() + '/raw/' + name).toString()
}))

const processFile = ({ type, content }: FileInput): Output => ({
    [type]: [...new JSDOM(content).window.document.querySelectorAll('.tabela.big.m0.tlo_biel>tbody>tr')].reduce((p, n) => ({
        ...p,
        [n.querySelector('td')?.textContent || '']: parseFloat((n.querySelector('td.ar')?.textContent || '').replace(',', '.'))
    }), {})
})

const reducer = (p: Output, n: Output): Output => {
    Object.keys(n).forEach(k => {
        Object.keys(p).includes(k) ?  p[k] = { ...p[k], ...n[k] } : p[k] = n[k];
    })
    return p
}

const main = () => {
    return getFiles().map(processFile).reduce(reducer)
}

!fs.existsSync(process.cwd() + '/out') && fs.mkdirSync(process.cwd() + '/out', {recursive: true})
fs.writeFileSync(process.cwd() + '/out/rates.json', JSON.stringify(main()))
```

Número de líneas de código real: 30

![](http://localhost:8484/903a0aff-c5e9-444b-b7eb-ce8eb9910c17.avif)

Tiempo de ejecución: 1min 15seg

![](http://localhost:8484/9c30542e-2868-494f-b185-951200f3aece.avif)

El tamaño de los archivos HTML descargados es de 43MB. El peso de los datos extraídos es de 244KB en formato JSON. Si quisiéramos mantenerlos en CSV, el ahorro sería solo 2 comillas por línea. Con alrededor de 13 mil líneas, eso da 26KB de caracteres innecesarios al convertir a CSV, lo que es un 10%. Esto es muy poco.

Sin embargo, recordemos que se pueden ahorrar otros 4 caracteres cambiando el formato de fecha de `YYYY-MM-DD` a `YYMMDD`, y probablemente incluso más al codificar las fechas en un formato con mayor entropía que el que utilizan las personas en su vida diaria.

Significativamente más, porque ahorramos 15 caracteres por línea en la decisión de que las fechas serían claves aquí.

```
15 znaków = date (4) + value (5) + cudzysłowy do nich (4), dwókropek (1), przecinek (1)
```

Los datos están disponibles para descargar en el siguiente enlace:

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/bank-rates.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/bank-rates.json)

El código en esta versión se puede encontrar en el repositorio

[app.ts · 0e96ff56b983c86d0b2bb50dcd7760063a16681c · gustawdaniel / money-pl-scraper](https://gitlab.com/gustawdaniel/money-pl-scraper/-/blob/0e96ff56b983c86d0b2bb50dcd7760063a16681c/app.ts)

## Cheerio vs JSDOM

Algún tiempo después de escribir este artículo, me encontré con un problema de alto consumo de memoria en JSDOM. Lo confirmé experimentalmente en el problema:

[¿Es cheerio aún 8 veces más rápido que jsdom? · Problema #700 · cheeriojs/cheerio](https://github.com/cheeriojs/cheerio/issues/700)

Ahora mostraré cómo reescribir este código en `cheerio` y cómo aumentará su rendimiento

1. Instalamos Cheerio

```
npm i cheerio
```

2. Reemplazamos la importación con

```ts
import cheerio from 'cheerio';
```

3. Reemplazamos la función que procesa el archivo con

```ts
const processFile = ({type, content}: FileInput): Output => ({
    [type]: cheerio.load(content)('.tabela.big.m0.tlo_biel>tbody>tr').toArray().reduce((p, n) => ({
        ...p,
        ...((el) => ({[el.find('td').text()]: parseFloat(el.find('td.ar').text().replace(',', '.'))}))(cheerio(n))
    }), {})
})
```

El resultado mejoró en `3.4` veces

```
time ts-node app.ts
ts-node app.ts  29.53s user 1.21s system 141% cpu 21.729 total
```

El DIFF completo está disponible en el enlace:

[JSDOM reemplazado por Cheerio (3.4) veces más rápido (4cff4a83) · Commits · gustawdaniel / money-pl-scraper](https://gitlab.com/gustawdaniel/money-pl-scraper/-/commit/4cff4a835589976ca26a7852f67dd42f2c4f2525)

También vale la pena leer

[Iteración de nivel inferior para ES3/ES5 en TypeScript](https://mariusschulz.com/blog/downlevel-iteration-for-es3-es5-in-typescript)
