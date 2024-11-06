---
author: Daniel Gustaw
canonicalName: analysis-frequency-names-of-altcoins-in-english-language
coverImage: http://localhost:8484/13fd8113-13b0-4f44-a262-90a5e01d4714.avif
description: The aim of the article is to show how to filter out from all cryptocurrency names those that do not appear in natural language.
excerpt: The aim of the article is to show how to filter out from all cryptocurrency names those that do not appear in natural language.
publishDate: 2021-06-30 10:22:00+00:00
slug: en/analysis-of-cryptocurrency-name-frequency-in-the-english-language-corpus
tags:
- maxdata
- typescript
title: Analysis of the frequency of altcoin names in the English language corpus
updateDate: 2021-06-30 10:22:00+00:00
---

## Altcoin Names

```
https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing
```

with the parameter `start` iterated over `1+100*n` for `n` from `0` until the response does not contain the key `data`.

An example of a good response is:

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

And when we go beyond the range we will get:

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

We are most interested in the parameters:

* name
* symbol
* quotes\[0\].marketCap or its normalized version quotes\[0\].dominance

[Dominance | CoinMarketCap](https://coinmarketcap.com/alexandria/glossary/dominance)

We will download all data about cryptocurrencies and save it in a file. We are preparing the project:

```
npm init -y && tsc --init && npm i axios && npm i -D @types/node && mkdir -p src raw out && touch src/getAltcoins.ts
```

The core of the program `getAltcoins.ts` can be taken from our recent post:

[Scraping the most popular Twitter accounts](./scraping-najbardziej-popularnych-kont-na-twitterze/)

That is roughly like this:

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

### Implementation of CmcCoin Interface

The simplest method is to look at what the Bitcoin API returns:

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

and converting it to an interface:

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

### Synchronization

After adding the `debug` package with the command

```
npm i debug && npm i -D @types/debug
```

and several imports

```
import axios from "axios";
import * as fs from "fs";
import Debug from 'debug';

const debug = Debug('app');
```

similarly to the previously mentioned article we implement `sync`

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

The only difference here is `JSON.stringify` because we want to write a string to a file and not an object. This time we use `api` instead of fetching `html`.

We can even write it more universally.

```
typeof data === 'string' ? data : JSON.stringify(data)
```

what will allow us to reuse this written code multiple times.

### Parsing

The method for parsing is exceptionally simple:

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

it involves trying to extract a list under a specific key, and if that is not possible, it returns an empty array causing the main program loop to end.

Ultimately, upon running the program:

```
DEBUG=app ts-node src/getAltcoins.ts
```

In the directory `out/coins.json` we get a file that I placed under the link:

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/coins.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/coins.json)

## Downloading and handling the language corpus

After typing the phrase "english corpus" we quickly land on the page

[English Corpora: most widely used online corpora. Billions of words of data: free online access](https://www.english-corpora.org/)

This is a scam. It contains information that it is free and all you need to do is register an account.

![](http://localhost:8484/63f7d022-1bb8-4a7f-a7a7-bc7a4d554017.avif)

but it has limitations that allow us to scan only 50 words per day. I wasted time trying to automate data extraction from this service.

Extracting samples from it leads to fragmented data that is not suitable for any application, and only checking the pricing explains that you can purchase a corpus from them for several hundred dollars.

Fortunately, I managed to extract the required data from a website with much worse positioning, but much more valuable:

[English Word Frequency](https://www.kaggle.com/rtatman/english-word-frequency)

Registration is also required there, but in return we get access to interesting data, engaging content, and a fantastic course. Even if we don't need it, we simply get the data for free. It is a 5MB csv file with columns containing the word and the count.

I placed this file under the path `dict/unigram_freq.csv`. To query the count of the word `credit`, simply enter:

```
grep -E '^credit,' dict/unigram_freq.csv
```

we receive:

```
credit,175916536
```

Analogously for the phrase:

```
grep -E '^theta,' dict/unigram_freq.csv
```

we have:

```
theta,5070673
```

Using TypeScript, we could write it like this:

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

executing this file will return the frequencies:

```
175916536
5070673
```

## Combining Frequency with Coin Names

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

it is a data structure that allows us to capture data regarding the frequency of occurrence of not only names but also symbols and potentially `slug` of coins.

I moved the `Page` class, as well as the `grepWithFork` and `checkFrequency` functions to `helpers`, with the latter receiving exception handling:

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

The last change is the removal of the `main` function from `getAltcoins` and renaming it to `getCoins`. The code is now in the file of the same name in `helpers`.

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

The new feature is a very simple function `enhanceSingleCoin` also placed in `helpers` in the file with that name containing:

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

By iterating through the currency array using it, we process them one by one.

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

Since it takes a moment, I added a simple display of progress and execution time to the function.

Our last script: `enhanceCoinsByFrequenceis.ts` only includes saving the results of this function to a file:

```
import fs from "fs";
import {enhanceCoins} from "./helpers/enhanceCoins";

enhanceCoins().then((coins) => {
    fs.writeFileSync(process.cwd() + '/out/coins-with-freq.json', JSON.stringify(coins));
    console.log(coins)
}).catch(console.error)
```

After executing the command

```
DEBUG=app ts-node src/enhanceCoinsByFrequenceis.ts
```

we receive a file with currencies enriched with frequency `/out/coins-with-freq.json`.

### Sorting phrases

Now let’s take a look at the sorted data regarding the ratio of `quotes[0].marketCap` to the parameters defined under the key `frequency`. We will start by determining the structure of the output data:

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

The `coin` parameter is not required, as I assume it may be useful for analysis purposes, but the amount of data in this parameter is so large that it may turn out that it is worth cleaning the final result from it.

The basic building block of the last phase is converting coins to phrases.

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

imported sorting options:

```
export interface SortOptions {
    withCoin: boolean
}
```

they come down to just determining whether we want to see the results with other data about the coin.

We will use the function for sorting:

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

from here it's a straightforward path to save the results to a file using the script `src/preparePhrases.ts`

```
import fs from 'fs';
import {sortCurrencies} from "./helpers/sortCurrencies";

sortCurrencies({withCoin: false}).then((coins) => {
    fs.writeFileSync(process.cwd() + '/out/phrases.json', JSON.stringify(coins));
    console.log(coins);
}).catch(console.error)
```

By turning it on with the command:

```
ts-node src/preparePhrases.ts
```

We can see that for very obscure coins, the ratio is very low despite the popular words.

![](http://localhost:8484/f5d3c63c-9dbb-4c1d-b79d-e02f96823e5f.avif)

we can expect many tweets with words like `you`, `giant`, `spectrum`, `pop`, `cyl`, `vote`, `get`, `real` or `kind` where the author did not mean cryptocurrencies. On the other hand, there is no objective cutoff criterion.

![](http://localhost:8484/693ef6c8-ca55-4450-9373-407542eb3313.avif)

If I set it to 100, 2328/16395 = 14% of phrases would be cut. At a value of `5`, we have a cutoff of 1560/16395 = 9.5%.

## Summary

An objective determination of the cutoff criterion for altcoins from monitoring turned out to be impossible, but the need to make several thousand "enable/disable" decisions from observations was replaced by one decision on the boundary ratio of the coin's value to the frequency of its name usage in English.

We see that a huge majority of the noise is cut out if we refrain from observing about 10% of altcoins with names or abbreviations that are popular phrases.

The whole thing was encapsulated in about 211 lines of TypeScript, of which 57 are interfaces.
