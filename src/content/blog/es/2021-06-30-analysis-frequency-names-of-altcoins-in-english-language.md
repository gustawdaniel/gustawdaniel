---
author: Daniel Gustaw
canonicalName: analysis-frequency-names-of-altcoins-in-english-language
coverImage: http://localhost:8484/13fd8113-13b0-4f44-a262-90a5e01d4714.avif
description: El objetivo del artículo es mostrar cómo filtrar de todos los nombres de criptomonedas aquellos que no aparecen en el lenguaje natural.
excerpt: El objetivo del artículo es mostrar cómo filtrar de todos los nombres de criptomonedas aquellos que no aparecen en el lenguaje natural.
publishDate: 2021-06-30 10:22:00+00:00
slug: es/analisis-de-la-frecuencia-del-nombre-de-criptomoneda-en-el-corpus-del-idioma-ingles
tags:
- maxdata
- typescript
title: Análisis de la frecuencia de los nombres de altcoins en el corpus del idioma inglés
updateDate: 2021-06-30 10:22:00+00:00
---

## Nombres de Altcoins

```
https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing
```

con el parámetro `start` iterado sobre `1+100*n` para `n` desde `0` hasta que la respuesta no contenga la clave `data`.

Un ejemplo de una buena respuesta es:

```
{
    "data": {
        "cryptoCurrencyList": [
            {
                "id": 8138,
                "name": "LinkBased",
                "symbol": "LBD",
                "slug": "linkbased",
                "tags": [],
                "cmcRank": 4601,
                "marketPairCount": 1,
                "circulatingSupply": 0E-8,
                "totalSupply": 813923.00000000,
                "isActive": 1,
                "lastUpdated": "2021-06-26T09:08:12.000Z",
                "dateAdded": "2020-12-30T00:00:00.000Z",
                "quotes": [
                    {
                        "name": "USD",
                        "price": 1.59351133162663,
                        "volume24h": 514.07425485,
                        "marketCap": 0E-22,
                        "percentChange1h": -0.13208528,
                        "percentChange24h": -26.50872672,
                        "percentChange7d": -34.07116202,
                        "lastUpdated": "2021-06-26T09:08:12.000Z",
                        "percentChange30d": -56.37728930,
                        "percentChange60d": -57.50444478,
                        "percentChange90d": -46.98725744,
                        "fullyDilluttedMarketCap": 1296995.52,
                        "dominance": 0.0,
                        "ytdPriceChangePercentage": 41.3223
                    }
                ],
                "isAudited": false
            },
            ...
        ],
        "totalCount": "5465"
    },
    "status": {
        "timestamp": "2021-06-26T09:10:02.180Z",
        "error_code": "0",
        "error_message": "SUCCESS",
        "elapsed": "134",
        "credit_count": 0
    }
}
```

Y cuando excedemos el rango obtendremos:

```
{
    "status": {
        "credit_count": 0,
        "elapsed": "4",
        "error_code": "500",
        "error_message": "The system is busy, please try again later!",
        "timestamp": "2021-06-26T09:07:58.780Z"
    }
}
```

Estamos más interesados en los parámetros:

* nombre
* símbolo
* quotes\[0\].capitalización de mercado o su versión normalizada quotes\[0\].dominancia

[Dominancia | CoinMarketCap](https://coinmarketcap.com/alexandria/glossary/dominance)

Descargaremos todos los datos sobre criptomonedas y los guardaremos en un archivo. Estamos preparando el proyecto:

```
npm init -y && tsc --init && npm i axios && npm i -D @types/node && mkdir -p src raw out && touch src/getAltcoins.ts
```

El núcleo del programa `getAltcoins.ts` se puede tomar de nuestra publicación reciente:

[Raspando las cuentas de Twitter más populares](./scraping-najbardziej-popularnych-kont-na-twitterze/)

Eso es aproximadamente así:

```
import * as fs from "fs";

interface CmcCoin {
    // todo implement
}

class Page {
    i: number;

    constructor(i: number) {
        this.i = i;
    }

    url() {
        return `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=${1 + 100 * this.i}`
    }

    file() {
        return `${process.cwd()}/raw/${this.i}.json`
    }

    sync() {
        // TODO implement
        return false;
    }

    parse(): CmcCoin[] {
        // todo implement
        return []
    }
}

const main = async ():Promise<CmcCoin[]> => {
    let i = 0;
    const allItems:CmcCoin[] = [];
    while (await new Page(i).sync()) {
        const items = new Page(i).parse()
        if (items.length === 0) break;
        allItems.push(...items);
        i++;
    }
    return allItems;
}

main().then((coins) => {
    fs.writeFileSync(process.cwd() + '/out/coins.json', JSON.stringify(coins));
    console.log(coins);
}).catch(console.error)
```

### Implementación de la interfaz CmcCoin

El método más sencillo es observar lo que devuelve la API de Bitcoin:

```
{
  "id": 1,
  "name": "Bitcoin",
  "symbol": "BTC",
  "slug": "bitcoin",
  "tags": [
    "mineable",
    "pow",
    "sha-256",
    "store-of-value",
    "state-channels",
    "coinbase-ventures-portfolio",
    "three-arrows-capital-portfolio",
    "polychain-capital-portfolio",
    "binance-labs-portfolio",
    "arrington-xrp-capital",
    "blockchain-capital-portfolio",
    "boostvc-portfolio",
    "cms-holdings-portfolio",
    "dcg-portfolio",
    "dragonfly-capital-portfolio",
    "electric-capital-portfolio",
    "fabric-ventures-portfolio",
    "framework-ventures",
    "galaxy-digital-portfolio",
    "huobi-capital",
    "alameda-research-portfolio",
    "a16z-portfolio",
    "1confirmation-portfolio",
    "winklevoss-capital",
    "usv-portfolio",
    "placeholder-ventures-portfolio",
    "pantera-capital-portfolio",
    "multicoin-capital-portfolio",
    "paradigm-xzy-screener"
  ],
  "cmcRank": 1,
  "marketPairCount": 9193,
  "circulatingSupply": 18742968,
  "totalSupply": 18742968,
  "maxSupply": 21000000,
  "isActive": 1,
  "lastUpdated": "2021-06-26T09:20:02.000Z",
  "dateAdded": "2013-04-28T00:00:00.000Z",
  "quotes": [
    {
      "name": "USD",
      "price": 30407.151465830357,
      "volume24h": 41711690274.967766,
      "marketCap": 569920266895.2114,
      "percentChange1h": 0.67834797,
      "percentChange24h": -11.72063275,
      "percentChange7d": -15.05133094,
      "lastUpdated": "2021-06-26T09:20:02.000Z",
      "percentChange30d": -22.4475165,
      "percentChange60d": -44.25026974,
      "percentChange90d": -46.26175604,
      "fullyDilluttedMarketCap": 638550180782.44,
      "dominance": 48.2033,
      "turnover": 0.07318864,
      "ytdPriceChangePercentage": 3.5167
    }
  ],
  "isAudited": false
}
```

y convirtiéndolo en una interfaz:

```
interface CmcCoin {
    "id": number,
    "name": string,
    "symbol": string,
    "slug": string,
    "tags": string[],
    "cmcRank": number,
    "marketPairCount": number,
    "circulatingSupply": number,
    "totalSupply": number,
    "maxSupply": number,
    "isActive": number,
    "lastUpdated": string,
    "dateAdded": string,
    "quotes": {
        "name": string,
        "price": number,
        "volume24h": number,
        "marketCap": number,
        "percentChange1h": number,
        "percentChange24h": number,
        "percentChange7d": number,
        "lastUpdated": string,
        "percentChange30d": number,
        "percentChange60d": number,
        "percentChange90d": number,
        "fullyDilluttedMarketCap": number,
        "dominance": number,
        "turnover": number,
        "ytdPriceChangePercentage": number
    }[],
    "isAudited": boolean
}
```

### Sincronización

Después de agregar el paquete `debug` con el comando

```
npm i debug && npm i -D @types/debug
```

y varias importaciones

```
import axios from "axios";
import * as fs from "fs";
import Debug from 'debug';

const debug = Debug('app');
```

similitudes al artículo mencionado anteriormente implementamos `sync`

```
    async sync() {
        try {
            const fileExists = fs.existsSync(this.file())

            if (fileExists) return true;

            const {data, status} = await axios.get(this.url());

            if (status !== 200) return false;

            fs.writeFileSync(this.file(), JSON.stringify(data));
            debug(`Saved ${this.file()}`)

            return true;
        } catch (e) {
            console.error(e)
            return false;
        }
    }
```

La única diferencia aquí es `JSON.stringify` porque queremos escribir una cadena en un archivo y no un objeto. Esta vez usamos `api` en lugar de obtener `html`.

Incluso podemos escribirlo de manera más universal.

```
typeof data === 'string' ? data : JSON.stringify(data)
```

lo que nos permitirá reutilizar este código escrito múltiples veces.

### Análisis

El método para el análisis es excepcionalmente simple:

```
    parse(): CmcCoin[] {
        try {
            const content = JSON.parse(fs.readFileSync(this.file()).toString());
            return content.data.cryptoCurrencyList
        } catch (e) {
            return []
        }
    }
```

implica intentar extraer una lista bajo una clave específica, y si eso no es posible, devuelve un array vacío causando que el bucle principal del programa termine.

En última instancia, al ejecutar el programa:

```
DEBUG=app ts-node src/getAltcoins.ts
```

En el directorio `out/coins.json` obtenemos un archivo que coloqué bajo el enlace:

## Descargando y manejando el corpus lingüístico

Después de escribir la frase "corpus en inglés" rápidamente aterrizamos en la página

Esto es una estafa. Contiene información que es gratuita y todo lo que necesitas hacer es registrarte para obtener una cuenta.

![](http://localhost:8484/63f7d022-1bb8-4a7f-a7a7-bc7a4d554017.avif)

pero tiene limitaciones que nos permiten escanear solo 50 palabras por día. Perdí tiempo tratando de automatizar la extracción de datos de este servicio.

Extraer muestras de él conduce a datos fragmentados que no son adecuados para ninguna aplicación, y solo comprobar el precio explica que puedes comprar un corpus de ellos por varios cientos de dólares.

Afortunadamente, logré extraer los datos requeridos de un sitio web con un posicionamiento mucho peor, pero mucho más valioso:

[Frecuencia de Palabras en Inglés](https://www.kaggle.com/rtatman/english-word-frequency)

También se requiere registro allí, pero a cambio obtenemos acceso a datos interesantes, contenido atractivo y un curso fantástico. Incluso si no lo necesitamos, simplemente obtenemos los datos de forma gratuita. Es un archivo csv de 5MB con columnas que contienen la palabra y el conteo.

Coloqué este archivo en la ruta `dict/unigram_freq.csv`. Para consultar el conteo de la palabra `credito`, simplemente ingresa:

```
grep -E '^credit,' dict/unigram_freq.csv
```

recibimos:

```
credit,175916536
```

De manera análoga para la frase:

```
grep -E '^theta,' dict/unigram_freq.csv
```

tenemos:

```
theta,5070673
```

Usando TypeScript, podríamos escribirlo así:

```
import child_process from 'child_process';

const grepWithFork = (filename: string, word: string): Buffer => {
    const cmd = `egrep '^${word},' ${filename}`;
    return child_process.execSync(cmd, {maxBuffer: 200000000})
}

export const checkFrequency = async (word: string): Promise<number> => {
    return parseInt(grepWithFork(
        process.cwd() + '/dict/unigram_freq.csv',
        word
    ).toString().replace(`${word},`, '')) || 0;
}

checkFrequency('credit').then(console.log).catch(console.error)
checkFrequency('theta').then(console.log).catch(console.error)
```

ejecutar este archivo devolverá las frecuencias:

```
175916536
5070673
```

## Combinando Frecuencia con Nombres de Monedas

```
import {CmcCoin} from "./CmcCoin";

export interface CoinWithFrequency extends CmcCoin {
    frequency: {
        name: number,
        symbol: number,
        slug: number
    }
}
```

es una estructura de datos que nos permite capturar datos sobre la frecuencia de ocurrencia no solo de nombres sino también de símbolos y potencialmente `slug` de monedas.

Moví la clase `Page`, así como las funciones `grepWithFork` y `checkFrequency` a `helpers`, siendo esta última la que recibe manejo de excepciones:

```
import {grepWithFork} from "./grepWithFork";

export const checkFrequency = (word: string): number => {
    try {
        return parseInt(grepWithFork(
            process.cwd() + '/dict/unigram_freq.csv',
            word
        ).toString().replace(`${word},`, '')) || 0;
    } catch (e) {
        return 0
    }
}
```

El último cambio es la eliminación de la función `main` de `getAltcoins` y su renombramiento a `getCoins`. El código ahora está en el archivo del mismo nombre en `helpers`.

```
import {CmcCoin} from "../interface/CmcCoin";
import {Page} from "./Page";

export const getCoins = async ():Promise<CmcCoin[]> => {
    let i = 0;
    const allItems:CmcCoin[] = [];
    while (await new Page(i).sync()) {
        const items = new Page(i).parse()
        if (items.length === 0) break;
        allItems.push(...items);
        i++;
    }
    return allItems;
}
```

La nueva función es una función muy simple `enhanceSingleCoin` también ubicada en `helpers` en el archivo con ese nombre que contiene:

```
import {CmcCoin} from "../interface/CmcCoin";
import {CoinWithFrequency} from "../interface/CoinWithFrequency";
import {checkFrequency} from "./checkFrequency";

export const enhanceSingleCoin = (coin: CmcCoin): CoinWithFrequency => {
    return {
        ...coin,
        frequency: {
            name: checkFrequency(coin.name.toLowerCase()),
            slug: checkFrequency(coin.slug.toLowerCase()),
            symbol: checkFrequency(coin.symbol.toLowerCase())
        }
    }
}
```

Al iterar a través del array de divisas utilizando eso, las procesamos una por una.

```
import {CoinWithFrequency} from "../interface/CoinWithFrequency";
import {getCoins} from "./getCoins";
import {enhanceSingleCoin} from "./enhanceSingleCoin";

export const enhanceCoins = async (): Promise<CoinWithFrequency[]> => {
    const coins = await getCoins();
    const res: CoinWithFrequency[] = []
    let i = 0, s = new Date().getTime(), n = () => new Date().getTime() - s;
    for (const coin of coins) {
        res.push(enhanceSingleCoin(coin));
        console.log(`${i++}\t${i/coins.length}\t${n()}`);
    }
    return res;
}
```

Dado que toma un momento, añadí una simple visualización del progreso y el tiempo de ejecución a la función.

Nuestro último script: `enhanceCoinsByFrequenceis.ts` solo incluye guardar los resultados de esta función en un archivo:

```
import fs from "fs";
import {enhanceCoins} from "./helpers/enhanceCoins";

enhanceCoins().then((coins) => {
    fs.writeFileSync(process.cwd() + '/out/coins-with-freq.json', JSON.stringify(coins));
    console.log(coins)
}).catch(console.error)
```

Después de ejecutar el comando

```
DEBUG=app ts-node src/enhanceCoinsByFrequenceis.ts
```

recibimos un archivo con monedas enriquecidas con frecuencia `/out/coins-with-freq.json`.

### Frases de ordenamiento

Ahora echemos un vistazo a los datos ordenados con respecto a la relación de `quotes[0].marketCap` a los parámetros definidos bajo la clave `frequency`. Comenzaremos determinando la estructura de los datos de salida:

```
import {CoinWithFrequency} from "./CoinWithFrequency";

export enum PhraseType {
    slug = 'slug',
    name = 'name',
    symbol = 'symbol',
}

export interface Phrase {
    coinId: number,
    value: string,
    capToFrequency: number,
    type: PhraseType
    coin?: CoinWithFrequency
}
```

El parámetro `coin` no es obligatorio, ya que supongo que puede ser útil para fines de análisis, pero la cantidad de datos en este parámetro es tan grande que puede resultar que vale la pena limpiar el resultado final de él.

El bloque de construcción básico de la última fase es convertir monedas en frases.

```
import {CoinWithFrequency} from "../interface/CoinWithFrequency";
import {Phrase, PhraseType} from "../interface/Phrase";
import {SortOptions} from "../interface/SortOptions";

export const convertCoinsToPhrases = (
    coins: CoinWithFrequency[],
    options: SortOptions = {withCoin: true}
): Phrase[] => {
    const phrases: Phrase[] = [];
    for (const coin of coins) {
        const newPhrases = [PhraseType.name, PhraseType.slug, PhraseType.symbol]
            .map((type: PhraseType): Phrase => {
                return {
                    coinId: coin.id,
                    value: coin[type as keyof CoinWithFrequency] as string,
                    capToFrequency: coin.quotes[0].marketCap / coin.frequency[type],
                    type,
                    ... options.withCoin ? {coin} : {}
                }
            })
        phrases.push(...newPhrases)
    }
    return phrases
}
```

opciones de ordenamiento importadas:

```
export interface SortOptions {
    withCoin: boolean
}
```

se reducen a simplemente determinar si queremos ver los resultados con otros datos sobre la moneda.

Usaremos la función de ordenamiento:

```
import {SortOptions} from "../interface/SortOptions";
import fs from "fs";
import {convertCoinsToPhrases} from "./convertCoinsToPhrases";

export const sortCurrencies = async (options: SortOptions) => {
    const coins = JSON.parse(fs.readFileSync(process.cwd() + '/out/coins-with-freq.json').toString());
    const phrases = convertCoinsToPhrases(coins, options)
    phrases.sort((a, b) => a.capToFrequency - b.capToFrequency)
    return phrases;
}
```

desde aquí es un camino directo para guardar los resultados en un archivo usando el script `src/preparePhrases.ts`

```
import fs from 'fs';
import {sortCurrencies} from "./helpers/sortCurrencies";

sortCurrencies({withCoin: false}).then((coins) => {
    fs.writeFileSync(process.cwd() + '/out/phrases.json', JSON.stringify(coins));
    console.log(coins);
}).catch(console.error)
```

Activándolo con el comando:

```
ts-node src/preparePhrases.ts
```

Podemos ver que para monedas muy oscuras, la proporción es muy baja a pesar de las palabras populares.

![](http://localhost:8484/f5d3c63c-9dbb-4c1d-b79d-e02f96823e5f.avif)

podemos esperar muchos tweets con palabras como `tú`, `gigante`, `espectro`, `pop`, `cil`, `voto`, `obtener`, `real` o `tipo` donde el autor no se refería a criptomonedas. Por otro lado, no hay un criterio de corte objetivo.

![](http://localhost:8484/693ef6c8-ca55-4450-9373-407542eb3313.avif)

Si lo configuro en 100, 2328/16395 = 14% de las frases serían eliminadas. Con un valor de `5`, tenemos un corte de 1560/16395 = 9.5%.

## Resumen

Una determinación objetiva del criterio de corte para altcoins a partir del monitoreo resultó ser imposible, pero la necesidad de tomar varias miles de decisiones de "habilitar/deshabilitar" a partir de observaciones fue reemplazada por una decisión sobre la relación límite entre el valor de la moneda y la frecuencia de su uso del nombre en inglés.

Vemos que una enorme mayoría del ruido se elimina si nos abstenemos de observar alrededor del 10% de las altcoins con nombres o abreviaturas que son frases populares.

Todo esto se encapsuló en aproximadamente 211 líneas de TypeScript, de las cuales 57 son interfaces.
