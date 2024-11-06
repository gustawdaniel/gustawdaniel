---
author: Daniel Gustaw
canonicalName: scraping-the-most-popular-accounts-on-twitter
coverImage: http://localhost:8484/928713fa-9c4a-43d6-8936-f2762f14d35f.avif
description: Gracias a la observación de publicaciones en Twitter, podemos rastrear diversas tendencias. En esta entrada, mostraré cómo descargar datos sobre cuentas en este servicio y seleccionar aquellas que tienen el mayor ratio de influencia.
excerpt: Gracias a la observación de publicaciones en Twitter, podemos rastrear diversas tendencias. En esta entrada, mostraré cómo descargar datos sobre cuentas en este servicio y seleccionar aquellas que tienen el mayor ratio de influencia.
publishDate: 2021-06-21 16:24:01+00:00
slug: es/raspado-de-las-cuentas-mas-populares-en-twitter
tags:
- twitter
- cheerio
- scraping
- mongo
- nodejs
title: Raspar las cuentas de Twitter más populares
updateDate: 2021-06-26 09:35:10+00:00
---

La lista de las cuentas más populares en Twitter se puede encontrar en la página de Trackalytics:

[Los perfiles de Twitter más seguidos | Trackalytics](https://www.trackalytics.com/the-most-followed-twitter-profiles/page/1/)

En esta publicación, mostraré cómo descargar estos datos y ordenarlos según el número de tweets por seguidores. Luego analizaremos cuántos creadores podríamos seguir simultáneamente sin exceder el límite de la API gratuita de Twitter: 500,000 tweets/mes.

### Análisis de la Página Raspada

Antes de comenzar la recolección de datos, siempre es necesario elegir un vector de adquisición de datos apropiado. Lo primero que hay que revisar es la pestaña de red en el navegador. En nuestro caso, en la página:

> [https://www.trackalytics.com/the-most-followed-twitter-profiles/page/1/](https://www.trackalytics.com/the-most-followed-twitter-profiles/page/1/)

Tenemos una solicitud para la página ya renderizada:

![](http://localhost:8484/d6f34ea7-4697-432f-9637-055a8e1fae8f.avif)

por lo que el renderizado debe tener lugar en el backend. Confirmaremos esto revisando el código fuente de la página.

```
view-source:https://www.trackalytics.com/the-most-followed-twitter-profiles/page/1/
```

De hecho, vemos datos listos para ser extraídos:

![](http://localhost:8484/ebca2c49-e69c-4962-ac42-fda0fab108ef.avif)

Escribiremos un script que lo obtenga y lo procese utilizando la biblioteca `cheerio`.

### Configuración del Proyecto

Inicializamos el proyecto con los comandos:

```bash
npm init -y && tsc --init
```

Creamos un directorio `raw` para archivos descargados

```bash
mkdir -p raw
```

Estamos instalando TypeScript

```bash
npm i -D @types/node
```

El núcleo de nuestro programa puede verse así:

```ts
interface TwitterAccount {
    // todo implement
}

class Page {
    i: number;

    constructor(i: number) {
        this.i = i;
    }

    url() {
        return `https://www.trackalytics.com/the-most-followed-twitter-profiles/page/${this.i}/`
    }

    file() {
        return `${process.cwd()}/raw/${this.i}.html`
    }

    sync() {
        // TODO implement
        return false;
    }

    parse(): TwitterAccount[] {
        // todo implement
        return []
    }
}

const main = async () => {
    let i = 1;
    const accounts = [];
    while (new Page(i).sync()) {
        const newAccounts = new Page(i).parse()
        if (newAccounts.length === 0) break;
        accounts.push(...newAccounts);
        i++;
    }
    return accounts;
}

main().then(console.log).catch(console.error)
```

Tenemos aquí que implementar una interfaz para las cuentas resultantes de la estructura de los datos recuperados, una función para verificar si una página existe y guardar datos, y una función para el análisis.

### Modelo de Datos

Al observar los datos mostrados:

![](http://localhost:8484/ac9cf5b4-0b47-4b21-9d6d-52db34010d12.avif)

Puedes crear la siguiente interfaz que describe una cuenta de Twitter.

```ts
interface TwitterAccount {
    rank: number
    avatar: string
    name: string
    url: string
    followers_total: number
    followers_today: number
    following_total: number
    following_today: number
    tweets_total: number
    tweets_today: number
}
```

### Descargando Páginas

Usaremos la biblioteca `axios` para descargar páginas. `debug` será adecuado para registrar datos.

```bash
npm i axios debug
npm i -D @types/debug
```

Después de realizar varias importaciones:

```
import axios from "axios";
import * as fs from "fs";
import Debug from 'debug';

const debug = Debug('app');
```

La función de sincronización podría verse así:

```ts
    async sync() {
        try {
            const fileExists = fs.existsSync(this.file())

            if (fileExists) return true;

            const {data, status} = await axios.get(this.url());

            if (status !== 200) return false;

            fs.writeFileSync(this.file(), data);
            debug(`Saved ${this.file()}`)

            return true;
        } catch (e) {
            console.error(e)
            return false;
        }
    }
```

### Procesando Páginas

```ts
[...document.querySelectorAll('.post-content>table>tbody tr')].map(tr => {

const cols = [3,4,5].map(i => tr.querySelector(`td:nth-child(${i})`).textContent.split(/\s+/).filter(x => x && x !== "(").map(x => parseInt(x.replace(/\)|\(|,/g,''))))

return {
       rank: parseInt(tr.querySelector('.badge-info').textContent),
    avatar: tr.querySelector('img').src,
    name:  tr.querySelector('td:nth-child(2) a').title,
    url: tr.querySelector('td:nth-child(2) a').href,
    followers_total: cols[0][0],
    followers_today: cols[0][1],
    following_total: cols[1][0],
    following_today: cols[1][1],
    tweets_total: cols[2][0],
    tweets_today: cols[2][1]
}})
```

![](http://localhost:8484/cdfec776-07ad-40de-8ed3-1caa9e79c100.avif)

En `node js` no tenemos un objeto `document` y para realizar selectores en el árbol DOM necesitamos construirlo a partir de texto como lo hace el navegador. Sin embargo, en lugar de utilizar el mecanismo nativo incorporado, usaremos una de las bibliotecas populares. Las más conocidas son:

* cheerio
* jsdom

Una vez hice una comparación de ellas en términos de rendimiento:

[¿Es cheerio todavía 8 veces más rápido que jsdom? · Issue #700 · cheeriojs/cheerio](https://github.com/cheeriojs/cheerio/issues/700)

Todo indica que `cheerio` es una elección mucho mejor.

Para procesarlo en una forma aceptable por cheerio, necesitamos reemplazar `document` con `cheerio.load(content)`, y los elementos deben envolverse con `cheerio(element).find` para buscar sus descendientes. Para los atributos, necesitamos la función `attr` y para los arrays, la función `toArray`. Estos son realmente todos los cambios, implementarlos toma un momento y como resultado de su aplicación al selector que funciona en el navegador obtendremos la implementación de la función `parse`.

```ts
    parse(): TwitterAccount[] {
        const content = fs.readFileSync(this.file()).toString();
        const $ = cheerio.load(content);

        return $('.post-content>table>tbody tr').toArray().map(tr => {
            const cols = [3, 4, 5].map(i => cheerio(tr)
                .find(`td:nth-child(${i})`).text().split(/\s+/)
                .filter(x => x && x !== "(").map(
                    x => parseInt(x.replace(/\)|\(|,/g, ''))))

            return {
                rank: parseInt(cheerio(tr).find('.badge-info').text()),
                avatar: cheerio(tr).find('img').attr('src') || '',
                name: cheerio(tr).find('td:nth-child(2) a').attr('title') || '',
                url: cheerio(tr).find('td:nth-child(2) a').attr('href') || '',
                followers_total: cols[0][0],
                followers_today: cols[0][1],
                following_total: cols[1][0],
                following_today: cols[1][1],
                tweets_total: cols[2][0],
                tweets_today: cols[2][1]
            }
        })
    }
```

Agregando una pequeña modificación al final del programa para que guarde los datos obtenidos en un archivo `json`

```ts
const main = async () => {
    let i = 1;
    const accounts = [];
    while (await new Page(i).sync()) {
        const newAccounts = new Page(i).parse()
        if (newAccounts.length === 0) break;
        accounts.push(...newAccounts);
        i++;
        debug(`Page ${i}`);
    }
    return accounts;
}

main().then(a => {
    fs.writeFileSync(process.cwd() + '/accounts.json', JSON.stringify(a.map(a => ({
        ...a,
        username: a.url.split('/').filter(a => a).reverse()[0]
    }))));
    console.log(a);
}).catch(console.error)
```

después de instalar el paquete `cheerio`

```
npm i cheerio
```

podemos iniciar nuestro programa con un comando

```
time DEBUG=app ts-node index.ts
```

A continuación vemos cómo se ve en el entorno del programa `bmon` para monitorear interfaces de red y `htop` para verificar el uso de memoria `ram` y del procesador.

![](http://localhost:8484/cc657994-e0d6-4ec3-ba19-2256dba98c2d.avif)

Para guardar este archivo en la base de datos mongo, podemos usar el comando:

```
mongoimport --collection twitter_accounts <connection_string>  --jsonArray --drop --file ./accounts.json
```

A continuación, realizando agregación:

```json
[{
    $group: {
        _id: null,
        tweets_today: {
            $sum: '$tweets_today'
        },
        tweets_total: {
            $sum: '$tweets_total'
        },
        followers_today: {
            $sum: '$followers_today'
        },
        followers_total: {
            $sum: '$followers_total'
        },
        count: {
            $sum: 1
        }
    }
}]
```

podemos aprender que las 16,000 cuentas más populares en Twitter generaron 0.6 mil millones de tuits, de los cuales 177 mil hoy.

```
tweets_today:177779
tweets_total:613509174
followers_today:9577284
followers_total:20159062136
count:16349
```

El número total de seguidores es de 20 mil millones (por supuesto, hay numerosos duplicados), y hoy los seguidores ganados por estas cuentas ascienden a 10 millones.

La API gratuita de Twitter permite la escucha en tiempo real de hasta 500 mil tweets. Esto significa que, en promedio, se pueden recopilar 16 mil diarios.

Supongamos que nuestra tarea es observar aquellas cuentas que logran el mayor alcance con el menor número de publicaciones. La siguiente agregación nos ayudará a encontrarlas:

```json
[{$match: {
  tweets_total: {$gt: 0}
}}, {$addFields: {
  influence_by_tweet: {$divide: ['$followers_total','$tweets_total']}
}}, {$sort: {
  influence_by_tweet: -1
}}, {$match: {
  influence_by_tweet: {$gt: 100}
}}, {$group: {
        _id: null,
        tweets_today: {
            $sum: '$tweets_today'
        },
        tweets_total: {
            $sum: '$tweets_total'
        },
        followers_today: {
            $sum: '$followers_today'
        },
        followers_total: {
            $sum: '$followers_total'
        },
        count: {
            $sum: 1
        }
    }}]
```

Gracias a esto, podemos seleccionar 3,798 cuentas que publican solo 17,161 tuits diarios pero tienen un alcance de hasta 14 mil millones de usuarios en total, y hoy ganaron 8 millones.

```
tweets_today:17161
tweets_total:32346484
followers_today:8197454
followers_total:14860523601
count:3798
```

Esto significa que el número de cuentas observadas ha caído al 23%, el número de tweets por día al 9%, pero el número total de seguidores se ha mantenido en el 73% del valor anterior (por supuesto, estos cálculos no tienen en cuenta la duplicación), y el número de seguidores que se están ganando hoy por estas cuentas seleccionadas es el 85% del valor original.

En resumen. Seleccionamos solo una parte de las cuentas que, escribiendo el 9% de los tweets en relación con todo el grupo de las cuentas más populares cada día, nos permiten lograr el 85% del alcance que nos interesa.

Nuestro criterio de corte es obtener al menos 100 seguidores por tweet. Debemos esperar aproximadamente 17000/24/60 = 11 tweets por minuto.

De acuerdo con la tradición de este blog, al final proporciono un enlace a los datos extraídos:

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/accounts.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/accounts.json)
