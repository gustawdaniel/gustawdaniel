---
author: Daniel Gustaw
canonicalName: zipfs-law-in-nodejs
coverImage: http://localhost:8484/9ce72a45-8820-4738-8ccb-71dae040e3ee.avif
description: Aprende cómo leer archivos grandes en Node.js, contar ocurrencias de palabras utilizando el objeto Map y manejar límites de memoria.
excerpt: Aprende cómo leer archivos grandes en Node.js, contar ocurrencias de palabras utilizando el objeto Map y manejar límites de memoria.
publishDate: 2022-06-11T22:50:51.000Z
slug: es/la-ley-de-zipf-en-nodejs
tags: ['nodejs', 'zipf', 'typescript']
title: Análisis de la Ley de Zipf en Node.js
updateDate: 2022-06-11T23:06:08.000Z
---

La ley de Zipf establece que si las palabras en un idioma dado se ordenan por su frecuencia de aparición, esa frecuencia será inversamente proporcional a la posición (rango) de la palabra.

En otras palabras, hay una relación lineal con un coeficiente negativo entre los logaritmos de frecuencia y rango, como se ve en el gráfico en escala logarítmica-logarítmica.

![](http://localhost:8484/6239ac87-abab-42ec-8187-c0cc1048c36f.avif)

## Preparando datos para el análisis

```bash
wget https://lang.org.ua/static/downloads/corpora/laws.txt.lemmatized.bz2
```

lo desglosamos:

```
tar -xf laws.txt.lemmatized.bz2
```

y preparamos su resumen para poder probar la aplicación en un archivo más pequeño

```
head -n 200 laws.txt.lemmatized > laws.txt.lemmatized.head
```

Las estadísticas del archivo de entrada son las siguientes

```
wc laws.txt.lemmatized
43230994  580844603 7538876115 laws.txt.lemmatized

du -h laws.txt.lemmatized
7,1G	laws.txt.lemmatized
```

## Leer un archivo en Node.js

Comenzamos el proyecto con los comandos

```
npm init -y && tsc --init
```

Estamos instalando los paquetes `esbuild esbuild-node-tsc` para construir el proyecto y `dayjs` para medir el tiempo de ejecución del programa.

```
npm i -D esbuild esbuild-node-tsc
npm i dayjs
```

colocamos en el `Makefile`

```
run:
	etsc && node ./dist/index.js
```

gracias a la cual con el comando `make run` podremos compilar y ejecutar nuestro programa. Esto requiere más configuración que `ts-node`, pero la velocidad de compilación es 4 veces mayor.

Debido al tamaño del archivo, no es recomendable escribir `fs.readFileSync`, aunque la mayoría de ustedes probablemente tenga más de 8GB de RAM. Sin embargo, supongamos que queremos escribir un programa que pueda manejar archivos más grandes sin imponer restricciones relacionadas con la necesidad de cargarlos completamente en memoria.

Usaremos la construcción

```typescript
import readline from "readline";
import fs from "fs";

async function main() {
    const path = process.cwd() + '/laws.txt.lemmatized.head';

    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        console.log(line)
    }
}

main().catch(console.log)
```

Este código se coloca en el archivo `src/index.ts`. La opción `crlfDelay` permite la lectura correcta de archivos con `\r\n`, es bueno incluirla por si acaso. Vemos que la primera línea que contiene `await` es solo el bucle `for`. Esto nos permite comenzar a procesar el archivo antes de que la lectura llegue a su fin.

## Contar Ocurrencias de Palabras

Ahora agregaremos la cuenta de ocurrencias de palabras y las colocaremos en un mapa.

```typescript
    const map = new Map<string, number>()
```

podemos reemplazar `console.log` en un bucle `for` con

```typescript
        line.split(' ').forEach(word => {
            if (map.has(word)) {
                map.set(word, (map.get(word) || 0) + 1)
            } else {
                map.set(word, 1)
            }
        })
```

después de completar el bucle, ordenamos el mapa por frecuencia de ocurrencias

```typescript
    const sortedAsc = new Map([...map].sort((a, b) => (a[1] < b[1] ? 1 : -1)));
```

formamos el archivo de salida texto

```typescript
    const out = [...sortedAsc.entries()].reduce((p, n) => `${p}\n${n[1]},${n[0]}`, ``)
```

y guardamos el archivo

```typescript
    fs.writeFileSync(process.cwd() + '/out', out)
```

En realidad, eso es todo. Al iniciar el programa con todo el archivo, esperamos recibir un archivo con dos columnas: el conteo y la palabra. Sin embargo, sin ningún feedback sobre en qué etapa estamos, sería difícil determinar si el programa está funcionando correctamente, se ha congelado y cuánto más tiempo tendremos que esperar para el resultado.

## Decoración del Programa con Registros

Comenzaremos importando dayjs, para poder mostrar la hora. Normalmente, no se deben instalar bibliotecas que no son necesarias, pero el objeto Date nativo es inútil.

```
console.log('Time', dayjs().diff(s))
```

```typescript
import dayjs from 'dayjs'
```

Al principio de la función `main`, definimos una variable con el tiempo de inicio de la ejecución.

```typescript
    const s = dayjs()
```

Antes del bucle, definimos el contador.

```typescript
    let i = 0;
```

y en el bucle mostramos su valor y el tiempo desde que se encendió

```typescript
        i++;
        if (i % 1e5 === 0) {
            console.log(`I`, i, `T`, dayjs().diff(s))
        }
```

Gracias a esto, sabiendo que el archivo tiene 43 millones de líneas, podemos estimar cuándo terminará el programa. Al final de la función `main` podemos añadir

```typescript
    console.log('Time', dayjs().diff(s))
```

Una alternativa a este enfoque es `console.time`.

## Ejecución del programa y problema de memoria

Después de comenzar, todo inicialmente fue bien, hasta el error fatal `heap out of memory`.

![](http://localhost:8484/75262dcb-25cd-46a0-9a22-2e580b0d4652.avif)

Es importante que la computadora no se congeló y tenía memoria libre disponible. Esto ocurrió porque se superó el límite predeterminado establecido en 2GB. Podemos verificar este límite con el comando:

```bash
node -e 'console.log(v8.getHeapStatistics().heap_size_limit/(1024*1024))'
```

y aumentarlo estableciendo la bandera adecuada con el proceso `node` en el `Makefile`

```
run:
	etsc && node --max-old-space-size=4096 ./dist/index.js
```

Esta vez el programa funcionó correctamente y guardó el archivo de salida después de 5.5 minutos.

Sus primeras líneas se muestran a continuación.

```csv
14022692,
9279668,та
8653492,з
7907815,на
7890310,у
7462816,в
7090614,Україна
6233283,від
6075057,до
6042053,за
5698079,і
4811990,про
4300976,N
3969368,або
3863955,який
3547579,державний
3309810,що
3123859,1
3059829,для
3036979,закон
2992163,особа
2738219,не
2611769,згідно
2555994,стаття
2390347,із
2315387,орган
2275758,інший
2267005,2
2262961,а
2208099,рік
2038612,бути
1920091,вони
1836843,пункт
1785740,це
1737457,3
1584258,порядок
1573372,такий
1516880,частина
1424188,зміна
```

## Preparando el Gráfico

Ahora nos gustaría ver el archivo donde la primera línea contiene la posición de la palabra y la segunda el número de ocurrencias. Lo creamos con el comando:

```
grep '\S' out | awk -F',' '{print NR, $1}' > log.txt
```

En esta línea, `\S` es responsable de filtrar las líneas vacías. La bandera `-F` permite establecer `,` como el separador, y `NR` inserta el número de línea comenzando desde `1`.

Crearemos el gráfico usando `gnuplot`.

```
gnuplot -e "set ylabel 'Count'; set xlabel 'Rank'; set logscale xy; plot 'log.txt' with linespoints linestyle 1" -p
```

La bandera `-e` te permite especificar un comando y `-p` no apaga el gráfico después de que se dibuja.

![](http://localhost:8484/ad6a0225-ab79-4797-9ef6-285c623bd87a.avif)

Vemos que el gráfico coincide con el que vimos en Wikipedia.

![](http://localhost:8484/bc9c8b7d-7019-4011-97a1-d2ac6549cdca.avif)

## Interpretación de Resultados
