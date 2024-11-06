---
author: Daniel Gustaw
canonicalName: scraping-from-money-pl-in-30-lines-of-code
coverImage: http://localhost:8484/f92c69bd-529d-4ea3-9094-69da20ca9232.avif
description: See a simple case study of downloading and processing data from a paginated table.
excerpt: See a simple case study of downloading and processing data from a paginated table.
publishDate: 2021-02-17 15:10:17+00:00
slug: en/scraping-libor-and-wibor-from-money-pl
tags:
- libor
- mongo
- scraping
title: Scraping from money.pl in 30 lines of code.
updateDate: 2021-02-17 21:03:26+00:00
---

Financial data in good quality and convenient to download is recommended to be downloaded from Stooq.

However, before I learned about this service, I was downloading it from other sources. In this article, I present such a case where the unfriendly interface of the website forced me to scrape it and download the data I needed.

From the article, you will learn how to do it quickly. You will see what tools I use and how I organize the code for scraping projects.

As if nothing happened, I go online and want to download `LIBORCHF3M` and `WIBOR3M`. I even find a website that provides such data:

[Archive of quotes for LIBOR Swiss franc 3M (LIBORCHF3M)](https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,1.html)

![](http://localhost:8484/3d264f28-b578-4109-a4e7-939d74de1e3f.avif)

I click download and I even receive the file, but after selecting the full period and choosing the correct data I see:

![](http://localhost:8484/da1f58ed-b8f1-431c-a159-8caf6f8d1356.avif)

> Number of rows limited to 50

Who limited it? What's the point of this form if it can't be used!? It is known that when someone wants to process data, it is best to have the broadest possible range.

In this entry, I will show how to bypass the problem with a minimal amount of lines of code and perform quick scraping. Below is the plan of action that I will present:

1. Check how to access this data.
2. Download the data to the local machine.
3. Describe the target structure.
4. Process the downloaded pages.

Main goals:

* minimize the time and lines of code for this task

# How to access the data

It turns out that when we display the table, the data can be read from it and it will be paginated.

![](http://localhost:8484/f21ad04b-f819-4688-9304-ca972265f3cf.avif)

Links have the shape:

```
BASE_PREFIX${index}BASE_POSTFIX
```

For example

```
https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,1.html
```

Rendered on the backend, which we see by checking the page source:

![](http://localhost:8484/d2d08c47-c9b0-4aca-bd95-24bc095de2e1.avif)

Potential plan 1:

* download all loops in bash using wget - one line
* process all downloaded files in `node` with `jsdom` 30 lines

Potential plan 2

* download CSV files every 50 days within the date range - about 40 lines of `node`
* process them about 1 line in sed / awk / perl / bash

The option with CSV would be simpler if it weren't for the problematic pagination by dates. Working with dates in `js` is rather unpleasant, nevertheless both strategies are rational. If I were to save network transfer or computational power, plan 2 clearly beats plan 1. However, we aim to minimize the amount of code, so we will do it the first way.

# Data Retrieval

Links:

```
LIBOR:

https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,1.html

Stron: 245

WIBOR:

https://www.money.pl/pieniadze/depozyty/zlotowearch/1921-02-05,2021-02-05,WIBOR3M,strona,1.html

Stron: 178
```

We will need a `for` loop and `wget`. For testing, we will check `i=1`.

```
for i in {1..1}; do wget "https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,$i.html" -O raw; done
```

It turns out that the response to `403`

```
--2021-02-05 16:59:56--  https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,1.html
Loaded CA certificate '/etc/ssl/certs/ca-certificates.crt'
Resolving www.money.pl (www.money.pl)... 212.77.101.20
Connecting to www.money.pl (www.money.pl)|212.77.101.20|:443... connected.
HTTP request sent, awaiting response... 403 Forbidden
2021-02-05 16:59:56 ERROR 403: Forbidden.
```

Could it be that this page was crawled so often with `wget` that the admins blocked requests for the default user agent of wget?

![](http://localhost:8484/a01f54f5-5d4c-47d2-b9b8-220e924bed30.avif)

I wouldn't be surprised, considering the fact that Wget does not hide its identity at all. Httpie is not better.

![](http://localhost:8484/2d2cbb6c-17d2-451f-95ab-a67271405e5f.avif)

but it is less known, which is why it works

![](http://localhost:8484/f636546c-641b-4405-853f-faa0c337217d.avif)

For `LIBORCHF3M`

```
mkdir -p raw && for i in {1..245}; do http -b "https://www.money.pl/pieniadze/depozyty/walutowearch/1921-02-05,2021-02-05,LIBORCHF3M,strona,$i.html" > "raw/l${i}.html";echo $i; done
```

For `WIBOR3M`

```
mkdir -p raw && for i in {1..178}; do http -b "https://www.money.pl/pieniadze/depozyty/zlotowearch/1921-02-05,2021-02-05,WIBOR3M,strona,$i.html" > "raw/w${i}.html";echo $i; done
```

In the `raw` directory, we already have all the files required for processing.

![](http://localhost:8484/6a907b6c-e625-46a2-be35-270e2fdc5229.avif)

# Describing the target structure

I want to have a `json` file with the following structure as output

```
{
   "WIBOR3M": { 'YYYY-MM-DD': value, ... },
   "LIBORCHF3M": { 'YYYY-MM-DD': value, ... }
}
```

# Processing Downloaded Pages

We are starting the project

```
npm init -y && tsc --init && touch app.ts
```

Installing `jsdom` for parsing the DOM tree on the Node.js side.

```
npm i jsdom @types/jsdom @types/node
```

At the end we will compare `jsdom` with `cheerio`. But for now, let's assume we will accomplish the task using the first library.

The base structure is quite predictable.

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

We now want to read all the files. We write a function for this:

```
const getFiles = (): { type: string, content: string }[] => fs
  .readdirSync(process.cwd() + `/raw`)
  .map(name => ({
    type: name[0] === 'l' ? 'LIBORCHF3M' : 'WIBOR3M',
    content: fs.readFileSync(process.cwd() + '/raw/' + name).toString()
  }))
```

Now we will process a single table:

![](http://localhost:8484/ad5cde4e-061f-48f4-b58c-9a9dd680399e.avif)

Defining Interfaces

```
interface FileInput {
  type: string,
  content: string
}

interface Output {
  [key: string]: { [date: string]: number }
}
```

The function processing files will take the form:

```
const processFile = ({ type, content }: FileInput): Output => ({
  [type]: [...new JSDOM(content).window.document.querySelectorAll('.tabela.big.m0.tlo_biel>tbody>tr')].reduce((p, n) => ({
    ...p,
    [n.querySelector('td')?.textContent || '']: (n.querySelector('td.ar')?.textContent || '').replace(',', '.')
  }), {})
})
```

its usage could look like this

```
const main = () => {
  return getFiles().map(processFile)
}

console.dir(main())
```

The execution returns data that we still need to reduce to just a pair of keys - `LIBORCHF3M` and `WIBOR3M`

![](http://localhost:8484/67386ff8-1f34-41e8-b420-8de3aba109bd.avif)

Reduction requires merging objects on keys, so we will add a function to it.

```
const reducer = (p: Output, n: Output): Output => {
  Object.keys(n).forEach(k => {
    Object.keys(p).includes(k) ?  p[k] = { ...p[k], ...n[k] } : p[k] = n[k];
  })
  return p
}
```

The entire code may finally look like this

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

Number of lines of real code: 30

![](http://localhost:8484/903a0aff-c5e9-444b-b7eb-ce8eb9910c17.avif)

Execution time: 1min 15sec

![](http://localhost:8484/9c30542e-2868-494f-b185-951200f3aece.avif)

The size of the downloaded HTML files is 43MB. The weight of the extracted data is 244KB in JSON format. If we wanted to keep them in CSV, the saving would only be 2 quotes per line. With about 13 thousand lines, that gives 26KB of unnecessary characters when converting to CSV, which is 10%. This is very little.

However, let's remember that another 4 characters can be saved by changing the date format from `YYYY-MM-DD` to `YYMMDD`, and probably even more by encoding dates in a format with higher entropy than used by people on a daily basis.

Significantly more, because we saved 15 characters per line on the decision that dates would be keys here.

```
15 znaków = date (4) + value (5) + cudzysłowy do nich (4), dwókropek (1), przecinek (1)
```

Data is available for download at the link:

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/bank-rates.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/bank-rates.json)

The code in this version can be found in the repository

[app.ts · 0e96ff56b983c86d0b2bb50dcd7760063a16681c · gustawdaniel / money-pl-scraper](https://gitlab.com/gustawdaniel/money-pl-scraper/-/blob/0e96ff56b983c86d0b2bb50dcd7760063a16681c/app.ts)

## Cheerio vs JSDOM

Some time after writing this article, I encountered a problem with high memory consumption in JSDOM. I confirmed this experimentally in the issue:

[Is cheerio still 8x faster than jsdom? · Issue #700 · cheeriojs/cheerio](https://github.com/cheeriojs/cheerio/issues/700)

Now I will show how to rewrite this code in `cheerio` and how its performance will increase

1. We install Cheerio

```
npm i cheerio
```

2. We replace the import with

```ts
import cheerio from 'cheerio';
```

3. We replace the function processing the file with

```ts
const processFile = ({type, content}: FileInput): Output => ({
    [type]: cheerio.load(content)('.tabela.big.m0.tlo_biel>tbody>tr').toArray().reduce((p, n) => ({
        ...p,
        ...((el) => ({[el.find('td').text()]: parseFloat(el.find('td.ar').text().replace(',', '.'))}))(cheerio(n))
    }), {})
})
```

The result improved by `3.4` times

```
time ts-node app.ts
ts-node app.ts  29.53s user 1.21s system 141% cpu 21.729 total
```

The full DIFF is available at the link:

[JSDOM replaced by Cheerio (3.4) times faster (4cff4a83) · Commits · gustawdaniel / money-pl-scraper](https://gitlab.com/gustawdaniel/money-pl-scraper/-/commit/4cff4a835589976ca26a7852f67dd42f2c4f2525)

It's also worth reading

[Downlevel Iteration for ES3/ES5 in TypeScript](https://mariusschulz.com/blog/downlevel-iteration-for-es3-es5-in-typescript)
