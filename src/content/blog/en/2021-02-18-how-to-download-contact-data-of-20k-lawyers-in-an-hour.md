---
author: Daniel Gustaw
canonicalName: how-to-download-contact-data-of-20k-lawyers-in-an-hour
coverImage: http://localhost:8484/3a18d7e4-4a5d-4920-8f41-aea5b4aa14b6.avif
description: Discover the parallel scraping technique that can significantly speed up data retrieval.
excerpt: Discover the parallel scraping technique that can significantly speed up data retrieval.
publishDate: 2021-02-17 20:59:14+00:00
slug: en/how-to-download-contact-data-of-20k-lawyers-in-an-hour
tags:
- contact
title: How to download contact data for 20k lawyers in an hour
updateDate: 2021-02-17 20:59:14+00:00
---

The "Register of Lawyers" website is a public data collection. According to the applicable law, publicly available personal data from registers can be collected and processed.

[National Register of Lawyers and Legal Trainees](https://rejestradwokatow.pl/adwokat)

In this article, we will prepare a data set that allows for contact with lawyers from this register. If you are simply looking for a lawyer, you can find them there and do not need to download the entire database.

However, if you run a business where lawyers are your target group, you will see the benefits of being able to load this data into your CRM system.

This article shows how to write a program code to retrieve this data from a public register. If you are interested in the data itself, skip to the end of the article.

We will divide the project into stages:

1. Investigating the data page and establishing a download strategy
2. Downloading tables with basic data
3. Processing tables and extracting links to subpages
4. Downloading subpages with contact data
5. Processing contact data
6. Loading data into the database and displaying query results

## Investigating the data page (strategy)

The register of lawyers available at the link:

[National Register of Lawyers and Legal Trainees](https://rejestradwokatow.pl/adwokat)

contains a green search button. After clicking it, we go to the page

> [https://rejestradwokatow.pl/adwokat/wyszukaj](https://rejestradwokatow.pl/adwokat/wyszukaj)

containing a classic table

![](http://localhost:8484/8353fdf9-84d5-424c-953e-97fde105a990.avif)

Scrolling to the bottom and clicking "last"

![](http://localhost:8484/3cce61da-ebb6-4b3b-a02c-f2c6b03a2eec.avif)

we will be redirected to the page with classic pagination

> [https://rejestradwokatow.pl/adwokat/wyszukaj/strona/272](https://rejestradwokatow.pl/adwokat/wyszukaj/strona/272)

Lawyers on the list can be divided into:

* practicing lawyers
* former lawyers
* non-practicing lawyers

Each of the categories has a slightly different profile page:

> [https://rejestradwokatow.pl/adwokat/urek-macias-paulina-54635](https://rejestradwokatow.pl/adwokat/urek-macias-paulina-54635)

A practicing lawyer has the most complete profile

![](http://localhost:8484/8393459d-2aa3-45b6-a92d-791a0ffeee65.avif)

Some have a mobile phone for this

![](http://localhost:8484/06083bb5-6576-4b2f-af5b-26a28c09442c.avif)

Data on former lawyers is limited

![](http://localhost:8484/6da64a0f-0436-4991-93d4-8b1dd546fa26.avif)

Even more about those not practicing the profession

![](http://localhost:8484/ecc0716d-4318-4ab7-a809-8e3d8cb8090f.avif)

The strategy for fetching this data is simple. First, we will go through the table building a base list with the basic data. Among them, there will be links to profiles. We will fetch them all and from them we will obtain an extension of this base list with the most valuable data, such as contact information.

## Fetching tables with basic data

We download all subpages with one command in bash.

```bash
mkdir -p raw && for i in {1..272}; do wget "https://rejestradwokatow.pl/adwokat/wyszukaj/strona/$i" -O raw/$i.html; done
```

## Processing Tables

![](http://localhost:8484/79c8599c-c0b1-424b-bf53-9ff925e91320.avif)

We initialize the project with the command

```
npm init -y && tsc --init && touch entry.ts
```

We install `cheerio` and `axios` which will be needed for processing `html` files and sending `http` requests. We will also add `@types/node` which allows us to import, for example, `fs`.

```
npm i cheerio axios @types/node
```

Since the project will contain several files, we will also create a `helpers.ts` file, where we will place shared code. Above all, interfaces.

We will start writing code by defining the output data interfaces from table processing. Instead of keeping Polish names like in the table header:

```
NAZWISKO
IMIĘ
DRUGIE IMIĘ
MIEJSCOWOŚĆ
IZBA ADWOKACKA
STATUS
SZCZEGÓŁY
```

We will opt for their English equivalents.

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

and we will place them in the file `helpers.ts`

The `entry.ts` will contain code that will perform the classic mapping and reducing procedure on the files.

The file starts with the necessary imports.

```ts
import fs from 'fs';
import cheerio from 'cheerio';

import {LawyerStatus, Output} from './helpers'
```

Next, we add a function that reads files and returns an array with their contents.

```ts
const getFiles = (): string[] => fs
    .readdirSync(process.cwd() + `/raw`)
    .filter((name) => /^\d+\.html/.test(name))
    .map(name =>
        fs.readFileSync(process.cwd() + '/raw/' + name).toString()
    );
```

Another function, key to this script is `processFile`, which uses `cheerio` to process strings from `html` into arrays of lawyer data contained in the table.

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

Since each subpage of the table returns a separate array, we need to combine them into one to avoid issues with pagination that is unnatural for our needs. The `reducer` function will help us with this.

```ts
const reducer = (a:Output[], b:Output[]):Output[] => [...a, ...b];
```

The entire program is simply the sequential execution of these functions, so that they pass their results to each other as arguments.

```ts
const main = () => {
    return getFiles().map(processFile).reduce(reducer);
}
```

Finally, we create the `out` directory and place the `basic_data.json` file with data read from the files in it.

```
const out = main();

!fs.existsSync(process.cwd() + '/out') && fs.mkdirSync(process.cwd() + '/out', {recursive: true})
fs.writeFileSync(process.cwd() + '/out/basic_data.json', JSON.stringify(out))

console.dir(out)
```

Execution:

```
ts-node entry.ts
```

takes half a minute

```
35.95s user 0.98s system 125% cpu 29.466 total
```

and generates a file weighing `5.1M`

![](http://localhost:8484/499c6f85-e441-4a5a-93a4-e320543c0837.avif)

The repository with the code can be found here:

[Processing tables with lawyers data (1b87854f) · Commits · gustawdaniel / lawyers-scraper](https://gitlab.com/gustawdaniel/lawyers-scraper/-/commit/1b87854fd741d6bfc10f8c36c21b7390a3095260)

## Downloading Subpages

We will download subpages not using `wget` but in `node`. In the `helpers.ts` file, we will place helper code to read the generated basic dataset.

```
import {readFileSync} from "fs";

export const getConfig = () => JSON.parse(readFileSync(process.cwd() + '/out/basic_data.json').toString());
```

Coloring successfully executed requests green and those that ended with an error red is very helpful for scraping.

Although there are ready-made libraries for coloring, in such a simple case, it's more convenient to save the colors in constants.

We will start the new file `scraper.ts` with imports and color definitions.

```ts
import fs from "fs";
import axios from 'axios';
import {getConfig} from "./helpers";

const Reset = "\x1b[0m"
const FgRed = "\x1b[31m"
const FgGreen = "\x1b[32m"
```

Another valuable piece of information, besides the graphical representation of success and failure, is time. Therefore, in the following lines, we will define variables that allow us to store the time points of the program's start and the end of the previous loop.

```ts
const init = new Date().getTime();
let last = new Date().getTime();
```

In the `main` function, we will place the code that retrieves the base dataset and iterates over it to collect all the links and save the pages to files.

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

The least obvious here is the display, but I will just write that thanks to the color markers we have green or red lines. They represent successively.

* response code (expected is 200)
* number of remaining records to the end
* time since the last loop execution in ms
* time since the start of the program in ms
* name of the file being created

Execution is the line:

```ts
main().then(() => console.log("ok")).catch(console.error);
```

Here are example calls, one with and the other without file saving.

![](http://localhost:8484/99942770-6f9d-4fc2-ac6b-d4e50cc24090.avif)

It is clear that they do not differ from each other in a noticeable way and the average time to record one lawyer is about 150 ms. This gives a total of `27190*0.15` = `4078` seconds. However, this is more than `3600`. Over an hour!

We cannot afford this, as in the title of the article I promise that we will retrieve this data in less than an hour, and over 8 minutes has already been spent on fetching the base data.

## Concurrent requests

Fortunately, thanks to the ability to send subsequent requests before the results from the previous ones arrive, we are able to increase the download speed from about `6.6` files per second (1 file every 150 ms) to about `40` files per second (on average 1 file every 25 ms).

Ultimately, the download result is `27191/(11*60+24.20)` = `39.74` files / second. So the total time was 11 minutes 24 seconds instead of the estimated 1 hour and 8 minutes mentioned in the previous paragraph.

How did we manage to significantly improve the data fetching time? Let's take a look at the code. First of all, I started by adding two additional variables:

```ts
let queueLength = 0;
const MAX_QUEUE_LENGTH = 500;
```

The constant represents the number of files that can be processed simultaneously. This means that if we are waiting for 500 files at the same time, the script will not send additional requests. It doesn't make sense, because we don't want to unnecessarily overload too much RAM or get cut off by the server due to exceeding the number of requests it can queue.

The constant `queueLength` is our current number of requests that we have sent and are still waiting for responses.

We move all the logic that was previously in `main` to the `append` function. Its task is to add a request to the queue.

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

It differs from the previous code in that it increments `queueLength` and displays its current value.

Additionally, we include the `sleep` function, which will allow us to wait between subsequent requests.

```ts
const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time))
```

As can be seen when sending multiple requests at the same time, mechanisms that protect us from the risk of overwhelming the server with excessive network traffic and causing packet loss are important.

The `main` function now takes the same role as before, but it does not wait for the `promises` from the `append` function to be fulfilled. Instead, it limits its calls based on waiting for `sleep` and the condition of not exceeding `MAX_QUEUE_LENGTH`.

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

Below we see a fragment from the invocation of such a rewritten program:

![](http://localhost:8484/0cd60295-e8e0-49fb-aa4b-a6a81826293a.avif)

Code can be checked in the commit:

[Parallel scraping of profile pages (ca8895f1) · Commits · gustawdaniel / lawyers-scraper](https://gitlab.com/gustawdaniel/lawyers-scraper/-/commit/ca8895f1d3474881269fbf3ef088a7ff03f9010f)

## Processing profile pages

When we already have the subpages with the profiles of lawyers, we can create the final file `parser.ts` and use it to enrich the base dataset with information visible on the profile pages. However, before we move on to the code, we will focus on the data we want to collect about lawyers of different statuses:

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

The status "Undefined" means a lawyer who has no status. There are several such lawyers in this database, often it is related to finding a duplicate account. We will not delve into this, as it is the margin of this database.

In the file `parser.ts` we include the imports

```ts
import {FormerOutput, getConfig} from "./helpers";
import {Output, ExtraOutput, LawyerStatus} from './helpers'
import {readFileSync, writeFileSync} from "fs";
import cheerio from 'cheerio';
```

Since texts are often filled with new line characters and empty spaces between them, a regular `trim` is not enough. That's why we wrote a function to clean multi-line texts.

```ts
const cleanText = (text: string): string => text.split(/[\n|\t]/).map((t: string): string => t.trim()).filter(t => t).join('\n');
```

The processing of files looks the same as always, except that it depends on the lawyer's status.

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

Another quite predictable piece of code is the `main` function.

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

At the end of the file record

```ts
const out = main();
writeFileSync(process.cwd() + '/out/extended_data.json', JSON.stringify(out))
```

The execution of this file shows columns with

* the number of processed files
* the number of remaining files
* the time between subsequent batches
* the total time since the application was started

![](http://localhost:8484/eceb4ffe-efff-4f71-ab81-ed67c75f4d26.avif)

Processing every hundred files takes about 340 ms. This means roughly 300 per second, so it should take about one and a half minutes in total. Actually:

```
ts-node parser.ts  124.32s user 1.81s system 131% cpu 1:35.98 total
```

The generated file with data about lawyers weighs `13MB`

```
du -h out/extended_data.json
13M	out/extended_data.json
```

## Loading data into the database

The `json` file is very convenient as a data interchange medium. Unfortunately, it is not suitable for directly processing it conveniently and building queries on it. Fortunately, loading this file into the `mongo` database is just one command away. It is:

```bash
mongoimport --db test --collection lawyer --jsonArray --drop --file ./out/extended_data.json
```

It will show

```bash
2021-02-17T20:26:58.455+0100	connected to: mongodb://localhost/
2021-02-17T20:26:58.455+0100	dropping: test.lawyer
2021-02-17T20:27:00.013+0100	27191 document(s) imported successfully. 0 document(s) failed to import.
```

Enabling the database with a command

```
mongo test
```

we will access the console from which we can execute queries:

```
db.lawyer.aggregate([{$group:{_id: "$status", sum:{$sum: 1}, link:{$first: "$link"}}}])
```

It will return the distribution by occupations performed and example links:

```
{ "_id" : "", "sum" : 7, "link" : "https://rejestradwokatow.pl/adwokat/jawor-marcin-51297" }
{ "_id" : "Niewykonujący zawodu", "sum" : 4410, "link" : "https://rejestradwokatow.pl/adwokat/konopacka-izabela-83958" }
{ "_id" : "Wykonujący zawód", "sum" : 19930, "link" : "https://rejestradwokatow.pl/adwokat/konrad-adam-33796" }
{ "_id" : "Były adwokat", "sum" : 2844, "link" : "https://rejestradwokatow.pl/adwokat/konopiski-sawomir-48480" }
```

With the Compass interface, we can browse many more such groupings in graphical mode.

![](http://localhost:8484/76a04f8e-5417-4186-8cc2-f7d296cca8e8.avif)

If we want to upload this data to Mongo Atlas, we can use the command

```
mongoimport --collection lawyer <connection-string>  --jsonArray --drop --file ./out/extended_data.json
```

where `connection-string` is a string that allows connecting to the database:

```
mongodb+srv://user:pass@cluseter_number.mongodb.net/db_name
```

In Mongo Charts, we can quickly click together several charts, for example, the previously mentioned distribution of lawyer statuses.

![](http://localhost:8484/b7187cc9-3753-48fe-b8f2-3cc448ddb52c.avif)

The interactive chart available for embedding as an `iframe` can be seen below.

Another chart shows the annual number of entries in the registry. It could be expected that the data obtained from the internet contains errors. This was the case this time as well. We had to exclude all entries without dates, with the date "0000-00-00", and one with the date "2019-00-01" using the filter.

```json
{status: {$ne: ""}, date:{$nin: ["","0000-00-00","2019-00-01"]}}
```

After adding a calculated field with date and year:

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

We can define a chart

![](http://localhost:8484/62950ca0-eca6-4ab8-bd33-36e4fd197fe0.avif)

Similarly, we prepare a chart with the average number of specializations

Using the configuration

![](http://localhost:8484/69740c15-e6e6-4e0b-8003-57abb2dc894c.avif)

we can show the frequency of selected specializations

Finally, I am attaching a table with contact details. It does not include all lawyers, but only those with correct phone numbers, i.e., meeting the condition

```json
{phone: /^(\d|-)+$/}
```

I hope that reading this post has expanded your toolkit for scraping and visualizing data. If you would like to talk about projects in this area, you are considering ordering scraping, or just want to share experiences, feel free to contact me.
