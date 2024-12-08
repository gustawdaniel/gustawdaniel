---
author: Daniel Gustaw
canonicalName: structuring-historical-currency-rates-nbp
coverImage: http://localhost:8484/df272521-e61f-4143-bcb4-a664b6cc1384.avif
description: Aprende a escribir código que normalice y estructure datos basado en un estudio de caso en el campo de las finanzas.
excerpt: Aprende a escribir código que normalice y estructure datos basado en un estudio de caso en el campo de las finanzas.
publishDate: 2021-02-04 06:02:21+00:00
slug: es/estructuracion-de-tasas-de-cambio-historicas-nbp
tags:
- csv
- typescript
- parcel
- data-processing
- apexcharts
- xls
- json
title: Estructuración de Datos en el Ejemplo del Curso CHF NBP
updateDate: 2021-02-17 15:21:43+00:00
---

La estructura de datos le da una forma a los datos que permite su análisis y procesamiento conveniente. En esta entrada, mostraré cómo podría lucir dicho proceso utilizando datos del NBP, que se almacenan en archivos donde la convención de disposición de encabezados ha cambiado a lo largo de los años.

Los datos del NBP no son aptos para su uso inmediato y necesitan ser organizados si queremos procesarlos.

Quiero enfatizar que los tipos de cambio históricos están excelentemente presentados en el sitio web:

[https://stooq.com/](https://stooq.com/)

Tomemos como ejemplo el tipo de cambio del franco suizo:

![](http://localhost:8484/c45fe2c1-92f2-45a2-b2a3-34e616bc8bec.avifchf1pricehistory.png)

Para descargar estos datos, simplemente ve a la página:

[https://stooq.com/q/d/?s=chfpln](https://stooq.com/q/d/?s=chfpln)

y haz clic en el botón debajo de la tabla.

![](http://localhost:8484/95e88003-79bf-46d0-b300-d7661d4adcee.avifchf2download.png)

En este artículo, no estoy resolviendo un *problema real*, sino presentando posibles *métodos de estructuración de datos **a través del ejemplo de*** un conjunto específico de archivos con convenciones inconsistentes e impredecibles.

Pasaremos secuencialmente por los problemas:

1. Adquisición de datos
2. Procesamiento de datos
3. Visualización de gráficos

El principal valor para el lector es seguir todo el proceso de principio a fin y aprender sobre las herramientas utilizadas aquí.

---

Descargaremos los datos con tasas de cambio de la página

> [https://www.nbp.pl/home.aspx?f=/kursy/arch\_a.html](https://www.nbp.pl/home.aspx?f=/kursy/arch_a.html)

![](http://localhost:8484/045d4962-c028-4eb1-be9e-9fbd46fcc60d.avifchf3table.png)

Los datos están divididos en hojas `xls` separadas.

# Recuperación de datos

Comenzaremos recuperando estos datos. Leemos el selector del código `HTML`.

![](http://localhost:8484/6aea3892-5617-4b54-909f-c202c1ae20f5.avifchf4selector.png)

En la consola del navegador, escribimos:

```js
[...document.querySelectorAll('.normal_2 a')]
    .map(a => `wget ${a.href}`)
    .filter(link => /archiwum_tab/.test(link))
    .join(' && ')
```

El resultado es una lista combinada de comandos `wget` con `&&` que descargan archivos consecutivos.

```bash
wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2020.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2021.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2010.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2011.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2012.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2013.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2014.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2015.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2016.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2017.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2018.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2019.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2000.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2001.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2002.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2003.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2004.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2005.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2006.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2007.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2008.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2009.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1990.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1991.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1992.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1993.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1994.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1995.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1996.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1997.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1998.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1999.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1984.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1985.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1986.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1987.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1988.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1989.xls
```

Después de pegarlos en la terminal, los archivos se descargarán en nuestro computadora.

Recomiendo usar una convención en la que esos archivos en bruto descargados de internet vayan a un directorio separado, por ejemplo, `raw`.

# Conversión

Convertimos todos los archivos al formato `csv` porque es más conveniente para el procesamiento por máquina que `xls`.

```bash
for i in *.xls; do  libreoffice --headless --convert-to csv "$i" ; done
```

Después de ejecutar este comando en nuestro directorio, veremos tanto archivos `xls` como sus correspondientes `csv`.

# Estructuración

Desafortunadamente, las personas que prepararon estos archivos no se preocuparam por mantener una convención común, y la primera fila a veces necesita ser descartada, en otras ocasiones contiene los nombres de monedas, países y en otras ocasiones, el código de la moneda.

¿Qué podemos hacer al respecto?

Es mejor establecer nuestro propio estándar de grabación y unificar la estructura de datos en todo el conjunto de datos.

Convención de grabación de fecha, moneda y tipo de cambio:

* fecha AAAA-MM-DD - porque ordena convenientemente y es un formato de fecha natural en muchos idiomas
* moneda - usando el código ISO_4217 (código de moneda de 3 letras)
* tipo de cambio - usando un formato con un punto para denotar fracciones

Convención de estructura de datos (composición):

* JSON en el que la primera clave es la moneda y la segunda es la fecha, el valor es el valor en złoty - este formato permite una fácil búsqueda por moneda y luego por fecha, se proyecta convenientemente en relación con las monedas. A pesar de la sobrecarga en términos de volumen en comparación con CSV, la facilidad de procesamiento posterior es el factor decisivo aquí.

Una vez que tengamos la convención, podemos escribir el código. Usaremos `typescript` para eso.

## Configuración del proyecto

Comenzamos el proyecto con comandos

```bash
tsc --init
npm init -y
npm install chai
npm i --save-dev @types/node @types/chai
touch app.ts
```

El paquete que instalamos - `chai` nos permitirá escribir pruebas automatizadas que verifiquen la conformidad de los resultados con nuestras expectativas. Esto nos ahorrará tiempo en su verificación manual.

Para la tarea, debemos elegir una estructura de directorios y un paradigma. En nuestro caso, asumimos un máximo de 100 líneas de código de procesamiento, y por esta razón, un archivo con código procedural es suficiente con el esqueleto:

```typescript
// declarations
imports ...

constants ...

functions ...

main function

// execution
console.log(main())
```

## Lectura de Archivos

La primera función será `main`. Comenzaremos mostrando una lista de archivos.

```ts
import fs from 'fs'
import chai from 'chai'

const main = () => {
    const rawDir = process.cwd() + `/raw`

    const res = fs.readdirSync(rawDir).filter(f => f.endsWith('csv'));
    res.forEach(r => chai.expect(r).to.be.a('string'))

    return res;
}

console.dir(main(), {depth: Infinity, maxArrayLength: Infinity})
```

Ejecución por comando

```bash
 ts-node app.ts
```

Da los nombres de los archivos que procesaremos:

```json
[
  'archiwum_tab_a_1984.csv',
  'archiwum_tab_a_1985.csv',
...
```

Gracias a la línea que utiliza `chai`, estamos seguros de que todos los resultados tienen el tipo adecuado. Esto puede no parecer impresionante ahora, pero en una etapa posterior, dichas pruebas nos permitirán detectar y corregir rápidamente errores relacionados con el descubrimiento de matices adicionales en las convenciones utilizadas en los archivos examinados.

Para mostrar el contenido del primer archivo, utilizaremos la función `readFileSync`. La elección de filtros y mapas no es aleatoria. Estas funciones, junto con reduce, son perfectas para el procesamiento de datos, y las veremos aquí muchas más veces.

```diff
import fs from 'fs'
import chai from 'chai'

+ const FILES_FILTER = (e: string, i: number) => i <= 0

const main = () => {
  const rawDir = process.cwd() + `/raw`

  const res = fs.readdirSync(rawDir).filter(f => f.endsWith('csv'))
+    .filter(FILES_FILTER)
+    .map((name, i) => {
+      return fs
+        .readFileSync(`${rawDir}/${name}`)
+        .toString()
+    })
  res.forEach(r => chai.expect(r).to.be.a('string'))
  return res;
}

console.dir(main(), {depth: Infinity, maxArrayLength: Infinity})
```

Resulta que el primer archivo no contiene códigos de moneda.

![](http://localhost:8484/db384089-4942-4f2c-9c7e-61960ff9385c.avifchf5codes.png)

Así que nos vemos obligados a construir un diccionario que mapea los nombres de los países a los códigos de moneda.

```ts
const dict: { [key: string]: string } = {
  'Szwajcaria': 'CHF'
}
```

## Procesamiento de Encabezados

Examinar los encabezados también define las reglas básicas para un procesamiento posterior.

1. Necesitamos buscar el nombre del país en la primera fila.
2. Basándonos en esto, determina la columna `col` donde se encuentra los datos.
3. En la segunda fila, la columna `col` contiene el divisor `div`
4. Más tarde, solo tomamos aquellas filas que contienen una fecha en la primera columna.
5. En estas filas, la columna `col` contiene un valor que debe ser dividido por el divisor `div` para obtener el tipo de cambio de divisas.

Gracias a las interfaces en TypeScript, podemos definir cómo se verá nuestra estructura de datos objetivo de un solo archivo:

```ts
interface YearData {
  [key: string]: {
    col: number,
    div: number,
    values: { [key: string]: number }[]
  }
}
```

Línea que devuelve el contenido del archivo:

```ts
return fs.readFileSync(`${rawDir}/${name}`).toString()
```

cambiaremos la asignación de la constante `arr` a un arreglo de arreglos del archivo `csv` dividido por caracteres de nueva línea y comas

```ts
const arr = fs
  .readFileSync(`${rawDir}/${name}`)
  .toString()
  .split(`\n`)
  .map(l => l.split(','));
```

La función que utilizaremos para la distribución de la primera línea es:

```ts
const decomposeBaseSettingsFromNames = (localArr: string[]) => localArr.reduce((p: YearData, n: string, i: number): YearData => {
  if (Object.keys(dict).includes(n)) {
    p[dict[n]] = { col: i, div: 1, values: [] }
  }
  return p
}, {})
```

Lo usaremos justo después de descomprimir el archivo en el arreglo `arr` en las líneas

```ts
const head = arr.shift()
if (!head) throw Error('File do not have header line.')
let settings: YearData = decomposeBaseSettingsFromNames(head)
```

En caso de éxito, la configuración contendrá la clave `CHF` con el valor bien calculado de la columna. Para eso, necesitábamos la función `decomposeBaseSettingsFromNames`, sin embargo, notemos que establecí el valor del divisor en `1`. Eso es porque los divisores están en la siguiente línea. Los encontraremos utilizando las siguientes líneas:

```ts
if (Object.keys(settings).length) {
  const subHead = arr.shift()
  if (!subHead) throw Error('File do not have sub-header line.')
  Object.keys(settings).forEach(key => {
    settings[key].div = parseInt(subHead[settings[key].col])
  })
}

return settings;
```

La prueba también cambiará y actualmente tomará la forma de:

```
res.forEach(r => {
        chai.expect(r).to.haveOwnProperty('CHF');
        chai.expect(r.CHF).to.haveOwnProperty('col');
        chai.expect(r.CHF).to.haveOwnProperty('div');
        chai.expect(r.CHF).to.haveOwnProperty('values');
        chai.expect(r.CHF.col).to.be.a('number');
        chai.expect(r.CHF.div).to.be.a('number');
        chai.expect(r.CHF.values).to.be.a('array');
    })
```

Ejecutar el código anterior nos dará

```json
[ { CHF: { col: 25, div: 1, values: [] } } ]
```

## Procesamiento de Valores

```ts
const getDate = (input: string) => {
  if (/\d{2}\.\d{2}\.\d{4}/.test(input)) {
    return input.split('.').reverse().join('-')
  }
  return false
}
```

Ahora, después de procesar los encabezados, podemos agregar código para estructurar los valores del curso.

```ts
arr.forEach(localArr => {
  const date = getDate(localArr[0])
  if (typeof date === 'string') {
    Object.keys(settings).forEach(key => {
      settings[key].values.push({ [date]: parseFloat(localArr[settings[key].col]) / settings[key].div })
    })
  }
})
```

Como podemos ver, los encabezados fueron la parte más difícil. Una vez que los tenemos, organizar los valores se convierte en una formalidad. La ejecución del código da:

```json
[
  {
    CHF: {
      col: 28,
      div: 1,
      values: [
        { '1984-01-02': 140.84 },
        { '1984-01-09': 140.08 },
        { '1984-01-16': 138.62 },
...
```

Una prueba de estructura de datos correcta podría verse así:

```
    res.forEach(r => {
        chai.expect(r).to.haveOwnProperty('CHF');
        chai.expect(r.CHF).to.haveOwnProperty('col');
        chai.expect(r.CHF).to.haveOwnProperty('div');
        chai.expect(r.CHF).to.haveOwnProperty('values');
        chai.expect(r.CHF.col).to.be.a('number');
        chai.expect(r.CHF.div).to.be.a('number');
        chai.expect(r.CHF.values).to.be.a('array');
        r.CHF.values.forEach(v => {
            chai.expect(Object.keys(v)[0]).to.be.a('string');
            chai.expect(/\d{4}-\d{2}-\d{2}/.test(Object.keys(v)[0])).to.be.true;
            chai.expect(Object.values(v)[0]).to.be.a('number');
            chai.expect(Object.values(v)[0]).to.be.greaterThan(0);
        })
    })
```

Puedes revisar todo el código aquí:

[app.ts · 9d401a925bc9e115dfaf9efe6528484f62cf2263 · gustawdaniel / nbp](https://gitlab.com/gustawdaniel/nbp/-/blob/9d401a925bc9e115dfaf9efe6528484f62cf2263/app.ts)

Este artículo podría terminar aquí con la fusión de archivos en una función y la presentación del resultado final...

Sin embargo, ese no es el caso. Ahora comienza el trabajo sucio con la detección de inconsistencias en las convenciones de archivos de NBP.

## Normalización y limpieza de datos

Si revisamos el archivo `6` usando este código, configurando la función de filtrado de archivos a:

```ts
const FILES_FILTER = (e: string, i: number) => i === 5
```

el resultado será sorprendentemente decepcionante

```json
[ { CHF: { col: 27, div: 1, values: [] } } ]
```

Para depurarlo detrás de la línea:

```ts
.split(`\n`)
```

agregaremos

```ts
.filter(ROWS_FILTER)
```

con el valor `ROWS_FILTER` definido como

```ts
const ROWS_FILTER = (e: string, i: number) => i <= 4
```

Para facilitar la lectura, mostré temporalmente la tabla `arr` usando `console.table` y extraje solo las columnas más interesantes:

```ts
console.table(arr.map(l => l.filter((e,i) => i < 5 || Math.abs(i - 30) < 4)));
```

![](http://localhost:8484/61cf0fb7-0756-4f14-8139-5e7a19560cb8.avifchf6table.png)

¿Qué vemos?

Que el formato de fecha ha cambiado a `MM/DD/YYYY`.

Manejaremos el problema extendiendo el convertidor de fechas con otro `if`.

```ts
if (/\d{2}\/\d{2}\/\d{4}/.test(input)) {
  const [m, d, y] = input.split('/')
  return [y, m, d].join('-')
}
```

También podemos agregar un filtro que eliminará los espacios de los nombres de los países:

```ts
const DROP_SPACES = (l: string): string => l.replace(/\s+/g, '')
```

insertado en el mapa detrás de la línea

```ts
.split(`\n`)
```

Esto permitirá tratar al país `Reino Unido` y `Reino Unido` de la misma manera.

Después de estos cambios, también implementaremos un cambio en las pruebas. Haremos cumplir una longitud mayor a cero para los valores de precio. También moveremos las pruebas a una función separada.

```ts
const testYearData = (r:YearData):void => {
    chai.expect(r).to.haveOwnProperty('CHF');
    chai.expect(r.CHF).to.haveOwnProperty('col');
    chai.expect(r.CHF).to.haveOwnProperty('div');
    chai.expect(r.CHF).to.haveOwnProperty('values');
    chai.expect(r.CHF.col).to.be.a('number');
    chai.expect(r.CHF.div).to.be.a('number');
    chai.expect(r.CHF.values).to.be.a('array');
    chai.expect(r.CHF.values.length).to.be.greaterThan(0);
    r.CHF.values.forEach(v => {
        chai.expect(Object.keys(v)[0]).to.be.a('string');
        chai.expect(/\d{4}-\d{2}-\d{2}/.test(Object.keys(v)[0])).to.be.true;
        chai.expect(Object.values(v)[0]).to.be.a('number');
        chai.expect(Object.values(v)[0]).to.be.greaterThan(0);
    })
};
```

Y lo llevamos a cabo devolviendo `settings`.

```ts
testYearData(settings);
```

Después de desbloquear filtros

```ts
const FILES_FILTER = (e: string, i: number) => i < Infinity
const ROWS_FILTER = (e: string, i: number) => i <= Infinity
```

La ejecución terminará con un error

![](http://localhost:8484/99217fa8-3967-43d9-a7d9-b1a7cdf95603.avifchf7err.png)

Gracias a las líneas que permiten la depuración:

```ts
console.table(arr.map(l => l.filter((e,i) => i < 3 || Math.abs(i - 27) < 5)));
```

y

```ts
console.dir(settings, {depth: Infinity});
```

vemos que el problema son las líneas completamente vacías.

![](http://localhost:8484/ddd3e51a-bd37-474f-8c4b-64d7e89fe9a3.avifchf24empty.png)

La causa del error es la rígida adherencia a una fila específica como un lugar donde mantenemos delimitadores o nombres de moneda, mientras que deberíamos estar eliminando líneas vacías antes de detectar encabezados.

Este es un problema común al analizar archivos de Excel. Los usuarios, al poder preparar datos en una estructura muy arbitraria, a menudo no se adhieren a la convención de colocar encabezados de la misma manera en todos los archivos.

Usaremos la función `test` y una expresión regular que denote ya sea comas o nada a lo largo de la línea:

```ts
const DROP_EMPTY_LINES = (e:string) => !/^,*$/.test(e)
```

Nos uniremos a ello después de `DROP_SPACES` en la función `filter`.

```ts
const arr = fs
  .readFileSync(`${rawDir}/${name}`)
  .toString()
  .split(`\n`)
  .map(DROP_SPACES)
  .filter(DROP_EMPTY_LINES)
  .filter(ROWS_FILTER)
  .map(l => l.split(',')
```

Esta vez no funciona de nuevo. La razón es una línea muy inusual en uno de los archivos.

![](http://localhost:8484/752e8b00-4302-4f82-a2b6-ba872c04ccdb.avifchf8correction.png)

¿Corrección de curso desde 1987? ¿Cómo es eso? En realidad, en `xls` tenemos algo así:

![](http://localhost:8484/093d1361-1532-4040-aa60-cd50cc9705de.avifchf9xls.png)

Sin embargo, se trata de la moneda `ECU`, por lo que es más razonable omitir esta línea ajustando los criterios de reconocimiento de fechas.

![](http://localhost:8484/62ec75f9-e6c2-476a-abd5-6b53ca5df44c.avifchf10diff.png)

El código completo de esta etapa se puede encontrar en el enlace:

[app.ts · 845527b631054744329b53293bfbf6705956b361 · gustawdaniel / nbp](https://gitlab.com/gustawdaniel/nbp/-/blob/845527b631054744329b53293bfbf6705956b361/app.ts)

Sin embargo, su ejecución aún causa errores.

```json
[
  {
    CHF: {
      col: 27,
      div: NaN,
      values: [ { '1988-12-27': NaN }, { '1989-01-02': NaN } ]
    }
  }
]
```

Tras una inspección más profunda, resulta que el problema radica en una línea que estaba casi vacía, pero no completamente vacía:

![](http://localhost:8484/a1a5c29e-0331-469d-ba92-28bca784abbd.avifchf11empty.png)

Alguien colocó `Nr` en una columna completamente insignificante. Por lo tanto, volvemos al código y eliminaremos esta línea con el siguiente filtro: `DROP_JUNK_LINES`, colocado antes de `DROP_EMPTY_LINES`.

Cuando escribí este código, volví a este filtro varias veces. No lo reproduciré esta vez, pero simplificaré y proporcionaré el valor final de esta función:

```ts
const DROP_JUNK_LINES = (l: string): string => l.replace(/(Nr)|(data)|(WALUTA\/CURRENCY)|(\.tab)/ig, '')
```

Resultó que en esta línea había:

* No
* fecha
* Moneda/Moneda
* .tab

Estas cosas a veces estaban en mayúsculas, y lo que más me sorprendió fue también \`M O N E D A / M O N E D A\`. Afortunadamente, gracias al mapa `DROP_SPACES` y las flags `g` e `i` en el mapa `DROP_JUNK_LINES`, el filtro `DROP_EMPTY_LINES` trata todas estas líneas como igualmente vacías, es decir, necesarias.

```diff
     .split(`\n`)
     .map(DROP_SPACES)
+    .map(DROP_JUNK_LINES)
     .filter(DROP_EMPTY_LINES)
     .filter(ROWS_FILTER)
```

Después de introducir estas correcciones, podemos ver la estructura requerida para los archivos subsecuentes:

```json
[
  {
    CHF: {
      col: 30,
      div: 1,
      values: [
        { '1988-12-27': 910.9 },
        { '1989-01-02': 904.29 },
        { '1989-01-09': 915.44 }
...
```

Enlace a los cambios en el código

[Líneas innecesarias eliminadas (fd13a96c) · Commits · gustawdaniel / nbp](https://gitlab.com/gustawdaniel/nbp/-/commit/fd13a96ceb1effe2471445a1e954600fb51c56af)

Sin embargo, es suficiente procesar algunos archivos más para volver al punto de partida, ver

```json
[ {} ]
```

y reparar desde cero.

¿Qué ocurrió esta vez?

Imprimir una tabla del archivo `CSV` después de procesarlo nos ayudará.

```ts
console.table(arr.map(e => e.filter((e,i) => i < 10)));
```

ver una organización completamente nueva del encabezado y el cambio de la columna de fecha

![](http://localhost:8484/70234f95-8834-4879-8290-b1b873c01f15.avifchf12fix.png)

Esta vez tanto la moneda como el divisor se colocan en la misma línea. Así que manejaremos el caso `else` después de la línea.

```ts
if (Object.keys(settings).length) {
```

usaremos la función `decomposeBaseSettingsFromCodes` definida como

```ts
const decomposeBaseSettingsFromCodes = (localArr: string[]) => localArr.reduce((p: YearData, n: string, i: number): YearData => {
  const [, div, curr] = n.match(/^(\d+)(\w+)$/) || []
  if (parseInt(div) && curr && Object.values(dict).includes(curr)) {
    p[curr] = { col: i, div: parseInt(div), values: [] }
  }
  return p
}, {})
```

¿Qué cambia?

* Divide el valor entre el divisor `div` y el código de moneda utilizando `match`
* No necesita una declaración `shift` adicional para extraer el divisor

Por esta razón, se incorporará al código de la siguiente manera

```ts
const head = arr.shift()
if (!head) throw Error('File do not have header line.')
let settings: YearData = decomposeBaseSettingsFromNames(head)
if (Object.keys(settings).length) {
  const subHead = arr.shift()
  if (!subHead) throw Error('File do not have sub-header line.')
  Object.keys(settings).forEach(key => {
    settings[key].div = parseInt(subHead[settings[key].col])
  })
} else {
  settings = decomposeBaseSettingsFromCodes(head)
}
```

Otro problema son los números ordinales en la primera columna en lugar de las fechas. Trataremos con las fechas reemplazando la función `getDate` por la función `getDateFromArr`.

```ts
const getDateFromArr = (arr: string[]) => {
  return getDate(arr[0]) || getDate(arr[1])
}
```

ahora se utiliza así:

```diff
arr.forEach(localArr => {
-  const date = getDate(localArr[0])
+  const date = getDateFromArr(localArr)
  if (typeof date === 'string') {
    Object.keys(settings).forEach(key => {
      settings[key].values.push({ [date]: parseFloat(localArr[settings[key].col]) / settings[key].div })
    })
  }
})
```

Las correcciones se pueden ver en el commit:

[Se corrigieron códigos de decodificación y columna con índices](https://gitlab.com/gustawdaniel/nbp/-/commit/81db32a6bb6d1b25569680a1605961d6efa8b190)

¿Son esos todos los problemas? Absolutamente no. En 2008, se utilizó otra convención.

![](http://localhost:8484/43871410-d47e-4076-95ab-61d8795fef17.avifchf132008.png)

Se trata de no colocar "Suiza" en ningún lugar, ni "1CHF" en ningún lugar, por lo tanto, ambos métodos de reconocimiento fallan. ¿Qué deberíamos hacer? Podemos esbozar el algoritmo de reconocimiento de encabezados de la siguiente manera:

![](http://localhost:8484/fa86f166-08a5-4f4d-a6ac-93564ffe122b.avifchf14schema.png)

Marcamos los elementos faltantes en naranja.

Dado que la búsqueda del divisor se repite, la separaremos en una función aparte:

```ts
const extendSettingsByDivCoefficient = (arr: string[][], settings: YearData) => {
  const subHead = arr.shift()
  if (!subHead) throw Error('File do not have sub-header line.')
  Object.keys(settings).forEach(key => {
    settings[key].div = parseInt(subHead[settings[key].col])
  })
}
```

No deberíamos mantener demasiado código en `main` porque pierde legibilidad, así que movemos toda la lógica de reconocimiento de encabezados a una función separada:

```ts
const recognizeSettingsFromHead = (arr: string[][]):YearData => {
  const head = arr.shift()
  if (!head) throw Error('File do not have header line.')
  let settings: YearData = decomposeBaseSettingsFromNames(head)
  if (Object.keys(settings).length) {
    extendSettingsByDivCoefficient(arr, settings);
  } else {
    settings = decomposeBaseSettingsFromCodes(head);
    while (Object.keys(settings).some(key => Number.isNaN(settings[key].div))) {
      extendSettingsByDivCoefficient(arr, settings);
    }
  }

  return settings;
}
```

En la mayoría será solo:

```
const settings = recognizeSettingsFromHead(arr);
```

Para analizar divisores, la condición se volvió clave:

```
Number.isNaN(settings[key].div)
```

Por lo tanto, en la configuración de ajustes para códigos, ya no podemos asumir optimistamente que el ajuste `1` es el valor predeterminado, ni forzar la ocurrencia de un número con el código de moneda, ni exigirlo.

Los cambios en las funciones que realizan el procesamiento del encabezado anteriormente se ven así

![](http://localhost:8484/e43bf31c-938d-446b-bba7-a2692d73e6ca.avifchf15diff.png)

Así es como se ve su código actual, sin embargo.

```ts
const decomposeBaseSettingsFromNames = (localArr: string[]) => localArr.reduce((p: YearData, n: string, i: number): YearData => {
    if (Object.keys(dict).includes(n)) {
        p[dict[n]] = { col: i, div: NaN, values: [] }
    }
    return p
}, {})

const decomposeBaseSettingsFromCodes = (localArr: string[]) => localArr.reduce((p: YearData, n: string, i: number): YearData => {
    const [, div, curr] = n.match(/^(\d*)(\w+)$/) || []
    if (curr && Object.values(dict).includes(curr)) {
        p[curr] = { col: i, div: parseInt(div), values: [] }
    }
    return p
}, {})
```

El proyecto completo en esta etapa:

[app.ts](https://gitlab.com/gustawdaniel/nbp/-/blob/4bca2afc7fcac9779ea4afdf0bcda89a08f6ab52/app.ts)

Como puedes ver, la limpieza de datos es un proceso tedioso donde los problemas nunca terminan. Afortunadamente, estos datos llegan a razón de un archivo por año, y parece que logramos estructurarlo antes de que transcurriera este tiempo.

Ejecutando el código con el comando

```bash
ts-node app.ts
```

mostrará largas listas de tablas y configuraciones pero no generará ningún error.

## Combinando Archivos

Los siguientes son necesarios para combinar archivos:

1. agregar un tipo de resultado

```ts
interface OutData {
  [key: string]: {
    [key: string]: number
  }
}
```

3. Preparando la función de conexión

```ts
const mergeYears = (payload: YearData[]): OutData => {
  return payload.reduce((p: OutData, n: YearData) => {
    Object.keys(n).forEach(key => {
      if (p.hasOwnProperty(key)) {
        p[key] = {...p[key], ...n[key].values.reduce((p,n) => ({...p,...n}))}
      } else {
        p[key] = n[key].values.reduce((p,n) => ({...p,...n}))
      }
    })
    return p
  }, {})
}
```

4\. Agregando `mergeYears` antes de `return` en la función `main`.

```ts
return mergeYears(fs.readdirSync(rawDir).filter(f => f.endsWith('csv'))
```

La introducción de estos cambios te permite ver los cursos en toda la gama.

```json
{
  CHF: {
    '1984-01-02': 140.84,
    '1984-01-09': 140.08,
    '1984-01-16': 138.62,
...
```

Para guardar el resultado, añadiremos la línea:

```ts
!fs.existsSync(process.cwd() + '/out') && fs.mkdirSync(process.cwd() + '/out', {recursive: true})
fs.writeFileSync(process.cwd() + '/out/chf.json', JSON.stringify(main()))
```

Ejecución:

```bash
time ts-node app.ts
```

devoluciones:

```bash
ts-node app.ts  7.67s user 0.29s system 147% cpu 5.412 total
```

y creará el archivo `/out/chf.json` con un peso de `156K`.

El archivo del proyecto que contiene `126` líneas de código está disponible en el enlace:

[app.ts](https://gitlab.com/gustawdaniel/nbp/-/blob/12edf429a1ddba80f04f29e0f9d2a0309aa372e2/app.ts)

Si necesitas estos datos, puedes recrear todos los pasos tú mismo o descargar los datos JSON ya preparados desde el enlace

https://gitlab.com/gustawdaniel/nbp/-/blob/master/out/chf.json

# Visualización

No puedo resistir la tentación de dibujar y discutir el tipo de cambio del Franco Suizo una vez que logré extraer las tasas de hace tantos años. Particularmente interesante es el período antes del comienzo del siglo actual y el auge de los préstamos en CHF de 2005-2008.

## Preparación del Proyecto

Para dibujar los gráficos, utilizaremos el archivo `index.html` con el contenido:

```html
<html>
<body>
<script src="./index.ts"></script>
</body>
</html>
```

y un archivo `index.ts` vacío. Ahora instalemos `parcel`

```bash
npm install -g parcel-bundler
```

Después de escribir:

```bash
parcel index.html
```

veremos un mensaje de construcción y un enlace a la página

![](http://localhost:8484/892c57e1-ea8f-45dc-aac4-e70fe31c48b4.avifchf16server.png)

Después de abrir el enlace y la consola de desarrollador, y luego agregar la línea `***console***.log("test")` a `index.ts`, veremos que la página se recarga automáticamente y "test" se registra en la consola.

## Integración de la biblioteca de gráficos

Para dibujar gráficos, utilizaremos Apex Charts.

```bash
npm install apexcharts --save
```

Incluiremos lo siguiente en el cuerpo del archivo `index.html`:

```
<main id='chart'></main>
```

para adjuntar el gráfico. Sin embargo, en `index.ts` la configuración de un gráfico de acciones simple

```js
import ApexCharts from 'apexcharts'

const options = {
  series: [{
    data: [{
      x: new Date(1538778600000),
      y: [6629.81, 6650.5, 6623.04, 6633.33]
    },
      {
        x: new Date(1538780400000),
        y: [6632.01, 6643.59, 6620, 6630.11]
      }
    ]
  }],
  chart: {
    type: 'candlestick',
    height: 350
  },
  title: {
    text: 'CandleStick Chart',
    align: 'left'
  },
  xaxis: {
    type: 'datetime'
  },
  yaxis: {
    tooltip: {
      enabled: true
    }
  }
};

const chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render().then(console.log).catch(console.error);
```

Podrías decir - super simple:

![](http://localhost:8484/13ae27b8-3d64-470c-b7d7-13813ffcbcf7.avifchf17bar.png)

Sin embargo, esta simplicidad tiene un propósito. Permite no llenar el artículo con datos de prueba, solo cuando tengamos la estructura de datos para el gráfico podemos realizar la transformación de nuestra estructura extraída de archivos `xls`.

## Organización de datos en el gráfico

Resumamos:

1. Nuestra estructura

```
{
  CHF: {
    'YYYY-MM-DD': number,
    ...
  }
}
```

Estructura para el gráfico:

```
{
  x: Date,
  y: [number, number, number, number] // open, high, low, close
}[]
```

Para realizar esta transformación, necesitamos dividir nuestros datos en rangos, lo que significa que debemos elegir cuántas velas debe contener el gráfico. Luego, después de calcular las fechas límite, iteraremos a través de los rangos, seleccionando de las fechas disponibles aquellas que caen dentro del rango, de las cuales a su vez buscaremos los valores de apertura, cierre y extremos.

Comenzaremos importando el archivo con los datos guardados por el script de la sección anterior:

```ts
import {CHF} from './out/chf.json'
```

Para manejar esto correctamente en el archivo `tsconfig.json`, añadimos la opción `resolveJsonModule`.

```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    ...
```

Ahora definimos la interfaz con los datos de salida

```ts
interface StockRecord {
  x: Date,
  y: [number, number, number, number]
}
```

Para la distribución de la función sobre intervalos, utilizaremos la función:

```ts
const splitDateIntoEqualIntervals = (startDate: Date, endDate: Date, numberOfIntervals: number): { start: Date, end: Date, avg: Date }[] => {
  const intervalLength = (endDate.getTime() - startDate.getTime()) / numberOfIntervals
  return [...(new Array(numberOfIntervals))]
    .map((e, i) => {
      return {
        start: new Date(startDate.getTime() + i * intervalLength),
        avg: new Date(startDate.getTime() + (i + 0.5) * intervalLength),
        end: new Date(startDate.getTime() + (i + 1) * intervalLength)
      }
    })
}
```

descrito en el enlace:

[Stack Overflow](https://stackoverflow.com/questions/63273494/divide-date-range-into-known-number-of-equal-chunks)

La asignación de datos en sí se ha organizado en otra función.

```ts
const mapToStockData = (values: { [key: string]: number }, parts: number):StockRecord[] => {
  const entries = Object.entries(values)
  const start = new Date(entries[0][0])
  const end = new Date(entries[entries.length - 1][0])
  const intervals = splitDateIntoEqualIntervals(start, end, parts)

  const stockData: StockRecord[] = []

  while (intervals.length) {
    const int = intervals.shift()
    if (!int) break
    let currDate = int.start
    stockData.push({
      x: int.avg,
      y: [NaN, NaN, NaN, NaN]
    })

    const currStock = stockData[stockData.length - 1]
    let stat = {
      min: Infinity,
      max: -Infinity
    }

    while (currDate < int.end) {
      const [dateString, value] = entries.shift() || []
      if (!dateString || typeof value !== 'number') break
      currDate = new Date(dateString)
      if (isNaN(currStock.y[0])) currStock.y[0] = value
      currStock.y[3] = value
      stat.min = Math.min(stat.min, value)
      stat.max = Math.max(stat.max, value)
    }
    currStock.y[1] = stat.max
    currStock.y[2] = stat.min
  }

  return stockData
}
```

Este fragmento de código más largo requiere un comentario. Esta tarea podría haberse realizado utilizando filtros de mapa y bucles forEach, pero opté por un doble while con desplazamientos dobles. No es una coincidencia. En este caso, se trata de rendimiento. Aunque esos métodos más de moda y elegantes son siempre mi primera opción, en casos donde reducir la complejidad computacional requiere mantener algún tipo de caché, hago una excepción. La comunicación entre ejecuciones separadas de los métodos `map`, `filter`, `reduce`, `forEach` es más difícil, requiriendo el uso de variables de mayor alcance. En particular, anidar bucles por defecto asume realizar operaciones `n x m` donde `n` y `m` son las dimensiones de los arreglos. Sin embargo, aquí quiero realizar más bien `n + m` ejecuciones; no quiero procesar, descartar, filtrar o verificar la misma clave en el objeto de moneda dos veces si no es necesario.

¿Qué ahorros estamos considerando?

Si este código se hubiera escrito de manera ineficiente y no hubiéramos organizado bien las iteraciones, podría parecer más legible y conciso, pero con una granularidad de 500 velas, realizaría `7200 x 500 = 3.6e6` bucles, mientras que tendríamos alrededor de `7200 + 500 = 7.7e4`, lo que significa un tiempo de carga aproximadamente 50 veces más corto.

Generar opciones es simplemente una función que coloca datos en la plantilla de configuración de Apex Chart.

```ts
const generateOptions = (data: StockRecord[]) => ({
  series: [{
    data
  }],
  chart: {
    type: 'candlestick',
    height: window.innerHeight - 50,
    zoom: {
      autoScaleYaxis: true
    }
  },
  title: {
    text: 'CandleStick Chart',
    align: 'left'
  },
  xaxis: {
    type: 'datetime'
  },
  yaxis: {
    tooltip: {
      enabled: true
    }
  }
})
```

Al final, la ejecución del programa, es decir, adjuntar datos a la configuración y crear un gráfico utilizando esto:

```
const chart = new ApexCharts(document.querySelector('#chart'), generateOptions(mapToStockData(CHF, 500)))
chart.render().then(console.log).catch(console.error)
```

El gráfico se ve genial. Captura perfectamente las realidades del salvaje oeste de las divisas de principios de los 90. Vemos cómo en 1991 la inflación disparó el precio del franco por órdenes de magnitud, y la drástica caída a principios de 1995 causada por la implementación de la ley de denominación del 7 de julio de 1994.

![](http://localhost:8484/79297982-53d5-4631-80ce-233139e5e437.avifchf18graph.png)

Un problema no detectado resulta ser el escalado incorrecto de 1995.

![](http://localhost:8484/ec2b3b0d-9f59-42a9-8a1d-a15d417333f6.avifchf19chart.png)

De hecho, tenemos un cambio en el multiplicador durante el año 1995.

![](http://localhost:8484/49771fae-248f-44fe-a307-bc25574964da.avifchf20chart.png)

Podemos solucionar este problema agregando líneas que muevan el divisor si su cambio ocurre entre valores, no en el encabezado:

```diff
             arr.forEach(localArr => {
                 const date = getDateFromArr(localArr)
+
+                const newSettings = decomposeBaseSettingsFromCodes(localArr)
+                if (Object.keys(newSettings).length) {
+                    Object.keys(settings).forEach(key => {
+                        settings[key].div = newSettings[key].div
+                    })
+                }
+
                 if (typeof date === 'string') {
                     Object.keys(settings).forEach(key => {
```

El próximo cambio será la introducción de la normalización. Si queremos comparar valores en el gráfico, debemos considerar la denominación. La función nos ayudará con esto.

```ts
const denominationFactor = (date:string): number => {
    return Number.parseInt(date.substr(0,4)) <= 1994 ? 1e4 : 1;
}
```

y incluyendo su resultado en la línea:

```ts
settings[key].values.push({[date]: parseFloat(localArr[settings[key].col]) / settings[key].div / denominationFactor(date)})
```

La regeneración de datos te permite ver el gráfico.

![](http://localhost:8484/8d0b0279-28a4-4f36-8018-bd8cb6cbb5e0.avifchf21chart.png)

Para realizar la implementación, utilizaremos el servicio de Netlify.

[Tasa de Cambio CHF en PLN](https://chf-pln.netlify.app/)

Para este propósito, añadimos `parcel` a las dependencias de desarrollo del proyecto:

```
 npm install -D parcel-bundler
```

Y agregamos un comando de construcción en `package.json`

```json
  "scripts": {
    "build": "parcel build index.html",
  },
```

Después de seleccionar el directorio `dist` en el panel de Netlify y ejecutar el comando `npm run build`, podemos disfrutar de un despliegue CI configurado.

![](http://localhost:8484/47831aa4-8526-44ad-b452-a874f467ec88.avifchf22netlify.png)

Al final del curso CHF desde finales de los 90 hasta tiempos modernos

![](http://localhost:8484/bedc08c4-895e-4579-b482-5c9d2cc39126.avifchf23chart.png)

# Conclusiones

Artículos que ayudaron en la preparación de esta entrada
