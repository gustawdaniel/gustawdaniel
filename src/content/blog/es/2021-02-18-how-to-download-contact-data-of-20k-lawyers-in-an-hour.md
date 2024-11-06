---
author: Daniel Gustaw
canonicalName: how-to-download-contact-data-of-20k-lawyers-in-an-hour
coverImage: http://localhost:8484/3a18d7e4-4a5d-4920-8f41-aea5b4aa14b6.avif
description: Descubre la técnica de raspado paralelo que puede acelerar significativamente la recuperación de datos.
excerpt: Descubre la técnica de raspado paralelo que puede acelerar significativamente la recuperación de datos.
publishDate: 2021-02-17 20:59:14+00:00
slug: es/como-descargar-datos-de-contacto-de-20k-abogados-en-una-hora
tags:
- contact
title: Cómo descargar datos de contacto de 20,000 abogados en una hora
updateDate: 2021-02-17 20:59:14+00:00
---

El sitio web "Registro de Abogados" es una colección de datos públicos. Según la ley aplicable, los datos personales disponibles al público de los registros pueden ser recopilados y procesados.

[Registro Nacional de Abogados y Pasantes Legales](https://rejestradwokatow.pl/adwokat)

En este artículo, prepararemos un conjunto de datos que permite contactar con abogados de este registro. Si simplemente está buscando un abogado, puede encontrarlos allí y no necesita descargar toda la base de datos.

Sin embargo, si dirige un negocio donde los abogados son su grupo objetivo, verá los beneficios de poder cargar estos datos en su sistema CRM.

Este artículo muestra cómo escribir un código de programa para recuperar estos datos de un registro público. Si está interesado en los datos en sí, salte al final del artículo.

Dividiremos el proyecto en etapas:

1. Investigar la página de datos y establecer una estrategia de descarga
2. Descargar tablas con datos básicos
3. Procesar tablas y extraer enlaces a subpáginas
4. Descargar subpáginas con datos de contacto
5. Procesar datos de contacto
6. Cargar datos en la base de datos y mostrar resultados de consultas

## Investigando la página de datos (estrategia)

El registro de abogados disponible en el enlace:

[Registro Nacional de Abogados y Pasantes Legales](https://rejestradwokatow.pl/adwokat)

contiene un botón de búsqueda verde. Después de hacer clic en él, llegamos a la página

> [https://rejestradwokatow.pl/adwokat/wyszukaj](https://rejestradwokatow.pl/adwokat/wyszukaj)

que contiene una tabla clásica

![](http://localhost:8484/8353fdf9-84d5-424c-953e-97fde105a990.avif)

Desplazarse hasta el final y hacer clic en "último"

![](http://localhost:8484/3cce61da-ebb6-4b3b-a02c-f2c6b03a2eec.avif)

seremos redirigidos a la página con paginación clásica

Los abogados en la lista se pueden dividir en:

* abogados en ejercicio
* exabogados
* abogados no ejercientes

Cada una de las categorías tiene una página de perfil ligeramente diferente:

Un abogado en ejercicio tiene el perfil más completo

![](http://localhost:8484/8393459d-2aa3-45b6-a92d-791a0ffeee65.avif)

Algunos tienen un teléfono móvil para esto

![](http://localhost:8484/06083bb5-6576-4b2f-af5b-26a28c09442c.avif)

Los datos sobre exabogados son limitados

![](http://localhost:8484/6da64a0f-0436-4991-93d4-8b1dd546fa26.avif)

Aún más sobre aquellos que no practican la profesión

![](http://localhost:8484/ecc0716d-4318-4ab7-a809-8e3d8cb8090f.avif)

La estrategia para recuperar estos datos es simple. Primero, pasaremos por la tabla construyendo una lista base con los datos básicos. Entre ellos, habrá enlaces a perfiles. Los recuperaremos todos y a partir de ellos obtendremos una extensión de esta lista base con los datos más valiosos, como información de contacto.

## Recuperando tablas con datos básicos

Descargamos todas las subpáginas con un comando en bash.

```bash
mkdir -p raw && for i in {1..272}; do wget "https://rejestradwokatow.pl/adwokat/wyszukaj/strona/$i" -O raw/$i.html; done
```

## Procesamiento de Tablas

![](http://localhost:8484/79c8599c-c0b1-424b-bf53-9ff925e91320.avif)

Inicializamos el proyecto con el comando

```
npm init -y && tsc --init && touch entry.ts
```

Instalamos `cheerio` y `axios`, que serán necesarios para procesar archivos `html` y enviar solicitudes `http`. También agregaremos `@types/node`, que nos permite importar, por ejemplo, `fs`.

```
npm i cheerio axios @types/node
```

Dado que el proyecto contendrá varios archivos, también crearemos un archivo `helpers.ts`, donde colocaremos código compartido. Sobre todo, interfaces.

Comenzaremos a escribir código definiendo las interfaces de datos de salida del procesamiento de la tabla. En lugar de mantener nombres en polaco como en el encabezado de la tabla:

```
NAZWISKO
IMIĘ
DRUGIE IMIĘ
MIEJSCOWOŚĆ
IZBA ADWOKACKA
STATUS
SZCZEGÓŁY
```

Optaremos por sus equivalentes en inglés.

```
export enum LawyerStatus {
    active = "Wykonujący zawód",
    former = "Były adwokat",
    inavtive = "Niewykonujący zawodu",
    undefined = ""
}

export interface Output {
    surname: string
    name: string
    second_name: string
    city: string
    office: string
    status: LawyerStatus
    link: string
}
```

y los colocaremos en el archivo `helpers.ts`

El `entry.ts` contendrá código que realizará el procedimiento clásico de mapeo y reducción en los archivos.

El archivo comienza con las importaciones necesarias.

```ts
import fs from 'fs';
import cheerio from 'cheerio';

import {LawyerStatus, Output} from './helpers'
```

A continuación, añadimos una función que lee archivos y devuelve un array con su contenido.

```ts
const getFiles = (): string[] => fs
    .readdirSync(process.cwd() + `/raw`)
    .filter((name) => /^\d+\.html/.test(name))
    .map(name =>
        fs.readFileSync(process.cwd() + '/raw/' + name).toString()
    );
```

Otra función, clave para este script, es `processFile`, que utiliza `cheerio` para procesar cadenas de `html` en arreglos de datos de abogados contenidos en la tabla.

```ts
const processFile = (content: string): Output[] => cheerio
    .load(content)('.rejestr tbody tr')
    .toArray()
    .map(row => ({
        surname: cheerio(row).find('td:nth-of-type(2)').text(),
        name: cheerio(row).find('td:nth-of-type(3)').text().trim(),
        second_name: cheerio(row).find('td:nth-of-type(4)').text(),
        city: cheerio(row).find('td:nth-of-type(5)').text(),
        office: cheerio(row).find('td:nth-of-type(6)').text(),
        status: cheerio(row).find('td:nth-of-type(7)').text() as LawyerStatus,
        link: cheerio(row).find('td:nth-of-type(8) a').attr('href') || '',
    }))
```

Dado que cada subpágina de la tabla devuelve una matriz separada, necesitamos combinarlas en una sola para evitar problemas con la paginación que es poco natural para nuestras necesidades. La función `reducer` nos ayudará con esto.

```ts
const reducer = (a:Output[], b:Output[]):Output[] => [...a, ...b];
```

El programa entero es simplemente la ejecución secuencial de estas funciones, de modo que pasan sus resultados entre sí como argumentos.

```ts
const main = () => {
    return getFiles().map(processFile).reduce(reducer);
}
```

Finalmente, creamos el directorio `out` y colocamos el archivo `basic_data.json` con los datos leídos de los archivos en él.

```
const out = main();

!fs.existsSync(process.cwd() + '/out') && fs.mkdirSync(process.cwd() + '/out', {recursive: true})
fs.writeFileSync(process.cwd() + '/out/basic_data.json', JSON.stringify(out))

console.dir(out)
```

Ejecución:

```
ts-node entry.ts
```

toma medio minuto

```
35.95s user 0.98s system 125% cpu 29.466 total
```

y genera un archivo que pesa `5.1M`

![](http://localhost:8484/499c6f85-e441-4a5a-93a4-e320543c0837.avif)

El repositorio con el código se puede encontrar aquí:

[Procesando tablas con datos de abogados (1b87854f) · Commits · gustawdaniel / lawyers-scraper](https://gitlab.com/gustawdaniel/lawyers-scraper/-/commit/1b87854fd741d6bfc10f8c36c21b7390a3095260)

## Descargando Subpáginas

Descargaremos subpáginas no usando `wget` sino en `node`. En el archivo `helpers.ts`, colocaremos el código auxiliar para leer el conjunto de datos básico generado.

```
import {readFileSync} from "fs";

export const getConfig = () => JSON.parse(readFileSync(process.cwd() + '/out/basic_data.json').toString());
```

Colorir las solicitudes ejecutadas con éxito de color verde y aquellas que terminaron con un error de color rojo es muy útil para hacer scraping.

Aunque hay bibliotecas listas para colorear, en un caso tan simple, es más conveniente guardar los colores en constantes.

Comenzaremos el nuevo archivo `scraper.ts` con importaciones y definiciones de colores.

```ts
import fs from "fs";
import axios from 'axios';
import {getConfig} from "./helpers";

const Reset = "\x1b[0m"
const FgRed = "\x1b[31m"
const FgGreen = "\x1b[32m"
```

Otra información valiosa, además de la representación gráfica del éxito y el fracaso, es el tiempo. Por lo tanto, en las siguientes líneas, definiremos variables que nos permitan almacenar los puntos de tiempo del inicio del programa y el final del bucle anterior.

```ts
const init = new Date().getTime();
let last = new Date().getTime();
```

En la función `main`, colocaremos el código que recupera el conjunto de datos base e itera sobre él para recopilar todos los enlaces y guardar las páginas en archivos.

```ts
const main = async () => {
    const links = getConfig().map((a:{link:string}):string => a.link);

    while (links.length) {
        const link = links.pop();
        const name = link.split('/').reverse()[0];
        const {data, status} = await axios.get(link);
        fs.writeFileSync(process.cwd() + `/raw/${name}.html`, data);
        const now = new Date().getTime();
        console.log(status === 200 ? `${FgGreen}%s\t%s\t%s\t%s\t%s${Reset}` : `${FgRed}%s\t%s\t%s\t%s\t%s${Reset}`, status, links.length, now - last, now - init, name);
        last = new Date().getTime();
    }
}
```

Lo menos obvio aquí es la pantalla, pero solo escribiré que gracias a los marcadores de color tenemos líneas verdes o rojas. Representan sucesivamente.

* código de respuesta (se espera que sea 200)
* número de registros restantes hasta el final
* tiempo desde la última ejecución del bucle en ms
* tiempo desde el inicio del programa en ms
* nombre del archivo que se está creando

La ejecución es la línea:

```ts
main().then(() => console.log("ok")).catch(console.error);
```

Aquí hay ejemplos de llamadas, una con y otra sin guardado de archivos.

![](http://localhost:8484/99942770-6f9d-4fc2-ac6b-d4e50cc24090.avif)

## Solicitudes concurrentes

```ts
let queueLength = 0;
const MAX_QUEUE_LENGTH = 500;
```

La constante representa el número de archivos que se pueden procesar simultáneamente. Esto significa que si estamos esperando 500 archivos al mismo tiempo, el script no enviará solicitudes adicionales. No tiene sentido, porque no queremos sobrecargar innecesariamente demasiada RAM o ser desconectados por el servidor debido a exceder el número de solicitudes que puede poner en cola.

La constante `queueLength` es nuestro número actual de solicitudes que hemos enviado y aún estamos esperando respuestas.

Movemos toda la lógica que estaba anteriormente en `main` a la función `append`. Su tarea es añadir una solicitud a la cola.

```ts
const append = async (links: string[]) => {
    queueLength++;
    const link: string = links.pop() || '';
    const name = link.split('/').reverse()[0];
    const {data, status} = await axios.get(link);
    fs.writeFileSync(process.cwd() + `/raw/${name}.html`, data);
    const now = new Date().getTime();
    console.log(status === 200 ? `${FgGreen}%s\t%s\t%s\t%s\t%s\t%s${Reset}` : `${FgRed}%s\t%s\t%s\t%s\t%s\t%s${Reset}`,
        status, links.length, queueLength, now - last, now - init, name
    );
    last = new Date().getTime();
}
```

Se diferencia del código anterior en que incrementa `queueLength` y muestra su valor actual.

Además, incluimos la función `sleep`, que nos permitirá esperar entre solicitudes sucesivas.

```ts
const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time))
```

Como se puede ver al enviar múltiples solicitudes al mismo tiempo, los mecanismos que nos protegen del riesgo de abrumar al servidor con tráfico de red excesivo y causar pérdida de paquetes son importantes.

La función `main` ahora desempeña el mismo papel que antes, pero no espera que se cumplan las `promesas` de la función `append`. En su lugar, limita sus llamadas en función de esperar `sleep` y la condición de no exceder `MAX_QUEUE_LENGTH`.

```ts
const main = async () => {
    const links = getConfig().map((a: { link: string }): string => a.link);

    while (links.length) {
        await sleep(9);
        if (queueLength < MAX_QUEUE_LENGTH)
            append(links).finally(() => queueLength--)
    }
}
```

A continuación, vemos un fragmento de la invocación de dicho programa reescrito:

![](http://localhost:8484/0cd60295-e8e0-49fb-aa4b-a6a81826293a.avif)

El código se puede verificar en el commit:

[Scraping paralelo de páginas de perfil (ca8895f1) · Commits · gustawdaniel / lawyers-scraper](https://gitlab.com/gustawdaniel/lawyers-scraper/-/commit/ca8895f1d3474881269fbf3ef088a7ff03f9010f)

## Procesamiento de páginas de perfil

Cuando ya tenemos las subpáginas con los perfiles de los abogados, podemos crear el archivo final `parser.ts` y usarlo para enriquecer el conjunto de datos base con información visible en las páginas de perfil. Sin embargo, antes de pasar al código, nos enfocaremos en los datos que queremos recopilar sobre abogados de diferentes estatus:

```
export interface ActiveOutput {
    id: string
    date: string
    address: string
    phone: string
    email: string
    workplace: string
    speciality: string[]
}

export interface FormerOutput {
    id: string
    date: string
    date_end: string
    last_place: string
    replaced_by: string
}

export interface UndefinedOutput {
    id: string
}

export interface InactiveOutput {
    id: string
    date: string
}

export type ExtraOutput = ActiveOutput | FormerOutput | UndefinedOutput | InactiveOutput
```

El estado "No definido" significa un abogado que no tiene estado. Hay varios abogados así en esta base de datos, a menudo está relacionado con la búsqueda de una cuenta duplicada. No profundizaremos en esto, ya que está fuera del alcance de esta base de datos.

En el archivo `parser.ts` incluimos las importaciones.

```ts
import {FormerOutput, getConfig} from "./helpers";
import {Output, ExtraOutput, LawyerStatus} from './helpers'
import {readFileSync, writeFileSync} from "fs";
import cheerio from 'cheerio';
```

Dado que los textos a menudo están llenos de caracteres de nueva línea y espacios vacíos entre ellos, un `trim` regular no es suficiente. Por eso escribimos una función para limpiar textos de varias líneas.

```ts
const cleanText = (text: string): string => text.split(/[\n|\t]/).map((t: string): string => t.trim()).filter(t => t).join('\n');
```

El procesamiento de archivos se ve igual que siempre, excepto que depende del estado del abogado.

```ts
const processFile = (content: string, status: LawyerStatus): ExtraOutput => {
    const $ = cheerio.load(content);

    const section = (n: number): string => `section .line_list_K div:nth-of-type(${n}) div:nth-of-type(1)`

    const id = $('main section h3').text();

    switch (status) {
        case LawyerStatus.active:
            return {
                id,
                date: $(section(2)).text(),
                address: cleanText($('.line_list_K div:nth-of-type(3) div:nth-of-type(1)').text()),
                phone: $('.line_list_K div:nth-of-type(4) div:nth-of-type(1)').text(),
                email: (el => el.attr('data-ea') + `@` + el.attr('data-eb'))($('.line_list_K div:last-of-type div:nth-of-type(1)')),
                speciality: $('.line_list_A > div').toArray().map((el): string => cheerio(el).text().trim()),
                workplace: cleanText($('.mb_tab_content.special_one .line_list_K').text())
            };
        case LawyerStatus.former:
            return {
                id,
                date: $(section(2)).text(),
                date_end: $(section(3)).text().trim(),
                last_place: $(section(4)).text().trim(),
                replaced_by: $(section(5)).text().trim()
            }
        case LawyerStatus.inavtive:
            return {
                id,
                date: $(section(2)).text(),
            }
        case LawyerStatus.undefined:
            return {
                id
            }
    }
}
```

Otra pieza de código bastante predecible es la función `main`.

```ts
let initDate = new Date().getTime();
let lastDate = new Date().getTime();

const main = () => {
    const lawyers = getConfig().reverse().filter((e: Output, i: number) => i < Infinity);
    const res: (Output & ExtraOutput)[] = [];

    while (lawyers.length) {
        const lawyer = lawyers.shift();
        const name = lawyer.link.split('/').reverse()[0];
        const extraLawyerInfo = processFile(readFileSync(process.cwd() + `/raw/${name}.html`).toString(), lawyer.status)

        res.push({...lawyer, ...extraLawyerInfo});

        if (lawyers.length % 100 === 0) {
            const now = new Date().getTime();
            console.log(res.length, lawyers.length, now - lastDate, now - initDate);
            lastDate = new Date().getTime();
        }
    }

    return res;
}
```

Al final del registro del archivo

```ts
const out = main();
writeFileSync(process.cwd() + '/out/extended_data.json', JSON.stringify(out))
```

La ejecución de este archivo muestra columnas con

* el número de archivos procesados
* el número de archivos restantes
* el tiempo entre lotes subsecuentes
* el tiempo total desde que se inició la aplicación

![](http://localhost:8484/eceb4ffe-efff-4f71-ab81-ed67c75f4d26.avif)

Procesar cada cien archivos tarda aproximadamente 340 ms. Esto significa aproximadamente 300 por segundo, por lo que debería tardar alrededor de un minuto y medio en total. En realidad:

```
ts-node parser.ts  124.32s user 1.81s system 131% cpu 1:35.98 total
```

El archivo generado con datos sobre abogados pesa `13MB`

```
du -h out/extended_data.json
13M	out/extended_data.json
```

## Cargando datos en la base de datos

El archivo `json` es muy conveniente como medio de intercambio de datos. Desafortunadamente, no es adecuado para procesarlo directamente de manera conveniente y construir consultas sobre él. Afortunadamente, cargar este archivo en la base de datos `mongo` está a solo un comando de distancia. Es:

```bash
mongoimport --db test --collection lawyer --jsonArray --drop --file ./out/extended_data.json
```

Mostrará

```bash
2021-02-17T20:26:58.455+0100	connected to: mongodb://localhost/
2021-02-17T20:26:58.455+0100	dropping: test.lawyer
2021-02-17T20:27:00.013+0100	27191 document(s) imported successfully. 0 document(s) failed to import.
```

Habilitando la base de datos con un comando

```
mongo test
```

accederemos a la consola desde la cual podemos ejecutar consultas:

```
db.lawyer.aggregate([{$group:{_id: "$status", sum:{$sum: 1}, link:{$first: "$link"}}}])
```

Devolverá la distribución por ocupaciones realizadas y enlaces de ejemplo:

```
{ "_id" : "", "sum" : 7, "link" : "https://rejestradwokatow.pl/adwokat/jawor-marcin-51297" }
{ "_id" : "Niewykonujący zawodu", "sum" : 4410, "link" : "https://rejestradwokatow.pl/adwokat/konopacka-izabela-83958" }
{ "_id" : "Wykonujący zawód", "sum" : 19930, "link" : "https://rejestradwokatow.pl/adwokat/konrad-adam-33796" }
{ "_id" : "Były adwokat", "sum" : 2844, "link" : "https://rejestradwokatow.pl/adwokat/konopiski-sawomir-48480" }
```

Con la interfaz de Compass, podemos explorar muchos más agrupamientos de este tipo en modo gráfico.

![](http://localhost:8484/76a04f8e-5417-4186-8cc2-f7d296cca8e8.avif)

Si queremos subir estos datos a Mongo Atlas, podemos usar el comando

```
mongoimport --collection lawyer <connection-string>  --jsonArray --drop --file ./out/extended_data.json
```

donde `connection-string` es una cadena que permite conectar a la base de datos:

```
mongodb+srv://user:pass@cluseter_number.mongodb.net/db_name
```

En Mongo Charts, podemos unir rápidamente varios gráficos, por ejemplo, la distribución de los estados de los abogados mencionada anteriormente.

![](http://localhost:8484/b7187cc9-3753-48fe-b8f2-3cc448ddb52c.avif)

El gráfico interactivo disponible para incrustar como un `iframe` se puede ver a continuación.

Otro gráfico muestra el número anual de entradas en el registro. Se podría esperar que los datos obtenidos de Internet contengan errores. Este fue también el caso esta vez. Tuvimos que excluir todas las entradas sin fechas, con la fecha "0000-00-00", y una con la fecha "2019-00-01" usando el filtro.

```json
{status: {$ne: ""}, date:{$nin: ["","0000-00-00","2019-00-01"]}}
```

Después de agregar un campo calculado con fecha y año:

```json
{computed_date: {
  $dateFromString: {
    dateString: "$date"
  }
},
  year:  {$year:{
  $dateFromString: {
    dateString: "$date"
  }
}}
}
```

Podemos definir un gráfico

![](http://localhost:8484/62950ca0-eca6-4ab8-bd33-36e4fd197fe0.avif)

Del mismo modo, preparamos un gráfico con el número promedio de especializaciones

Usando la configuración

![](http://localhost:8484/69740c15-e6e6-4e0b-8003-57abb2dc894c.avif)

podemos mostrar la frecuencia de las especializaciones seleccionadas

Finalmente, adjunto una tabla con los datos de contacto. No incluye a todos los abogados, sino solo a aquellos con números de teléfono correctos, es decir, que cumplen con la condición

```json
{phone: /^(\d|-)+$/}
```

Espero que leer este post haya expandido tu conjunto de herramientas para extraer y visualizar datos. Si te gustaría hablar sobre proyectos en esta área, estás considerando encargar extracción, o solo quieres compartir experiencias, no dudes en contactarme.
