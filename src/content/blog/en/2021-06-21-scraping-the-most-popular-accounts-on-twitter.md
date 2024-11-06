---
author: Daniel Gustaw
canonicalName: scraping-the-most-popular-accounts-on-twitter
coverImage: http://localhost:8484/928713fa-9c4a-43d6-8936-f2762f14d35f.avif
description: Thanks to observing Twitter posts, we can track various trends. In this entry, I will show how to download data about accounts on this service and select those that have the highest influence ratio.
excerpt: Thanks to observing Twitter posts, we can track various trends. In this entry, I will show how to download data about accounts on this service and select those that have the highest influence ratio.
publishDate: 2021-06-21 16:24:01+00:00
slug: en/scraping-the-most-popular-accounts-on-twitter
tags:
- twitter
- cheerio
- scraping
- mongo
- nodejs
title: Scraping the most popular Twitter accounts
updateDate: 2021-06-26 09:35:10+00:00
---

The list of the most popular accounts on Twitter can be found on the Trackalytics page:

[The Most Followed Twitter Profiles | Trackalytics](https://www.trackalytics.com/the-most-followed-twitter-profiles/page/1/)

In this post, I will show how to download this data and sort it based on the number of tweets to followers. Then we will analyze how many creators we could follow simultaneously without exceeding the limit of the free Twitter API: 500,000 tweets/month.

### Analysis of the Scraped Page

Before starting the scraping, it is always necessary to choose an appropriate data acquisition vector. The first thing to check is the network tab in the browser. In our case, on the page:

> [https://www.trackalytics.com/the-most-followed-twitter-profiles/page/1/](https://www.trackalytics.com/the-most-followed-twitter-profiles/page/1/)

We have a request for the already rendered page:

![](http://localhost:8484/d6f34ea7-4697-432f-9637-055a8e1fae8f.avif)

so rendering must take place on the backend. We will confirm this by checking the page source.

```
view-source:https://www.trackalytics.com/the-most-followed-twitter-profiles/page/1/
```

Indeed, we see data ready for scraping:

![](http://localhost:8484/ebca2c49-e69c-4962-ac42-fda0fab108ef.avif)

We will write a script that fetches it and processes it using the `cheerio` library.

### Project Setup

We initialize the project with the commands:

```bash
npm init -y && tsc --init
```

We create a `raw` directory for downloaded files

```bash
mkdir -p raw
```

We are installing TypeScript

```bash
npm i -D @types/node
```

The core of our program may look like this:

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

We have here to implement an interface for accounts resulting from the structure of the retrieved data, a function to check if a page exists and save data, and a function for parsing.

### Data Model

Looking at the displayed data:

![](http://localhost:8484/ac9cf5b4-0b47-4b21-9d6d-52db34010d12.avif)

You can create the following interface describing a Twitter account.

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

### Downloading Pages

We will use the `axios` library for downloading pages. `debug` will be suitable for logging data.

```bash
npm i axios debug
npm i -D @types/debug
```

After performing several imports:

```
import axios from "axios";
import * as fs from "fs";
import Debug from 'debug';

const debug = Debug('app');
```

The synchronization function could look like this:

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

### Processing Pages

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

In `node js` we don't have a `document` object and to perform selectors on the DOM tree we need to build it from text as the browser does. However, instead of using the natively built-in mechanism, we will use one of the popular libraries. The most well-known are:

* cheerio
* jsdom

I once made a comparison of them in terms of performance:

[Is cheerio still 8x faster than jsdom? · Issue #700 · cheeriojs/cheerio](https://github.com/cheeriojs/cheerio/issues/700)

Everything indicates that `cheerio` is a much better choice.

To process it into a form acceptable by cheerio, we need to replace `document` with `cheerio.load(content)`, and elements should be wrapped with `cheerio(element).find` to search for their descendants. For attributes, we need the `attr` function and for arrays, the `toArray` function. These are actually all the changes, implementing them takes a moment and as a result of their application to the selector working in the browser we will get the implementation of the `parse` function.

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

Adding a small modification to the program's end so that it saves the obtained data in a `json` file

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

after installing the `cheerio` package

```
npm i cheerio
```

we can start our program with a command

```
time DEBUG=app ts-node index.ts
```

Below we see what it looks like in the environment of the `bmon` program for monitoring network interfaces and `htop` for checking `ram` memory and processor usage.

![](http://localhost:8484/cc657994-e0d6-4ec3-ba19-2256dba98c2d.avif)

To save this file in the mongo database, we can use the command:

```
mongoimport --collection twitter_accounts <connection_string>  --jsonArray --drop --file ./accounts.json
```

Next, performing aggregation:

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

we can learn that the 16k most popular accounts on Twitter generated 0.6 billion tweets, of which 177 thousand today.

```
tweets_today:177779
tweets_total:613509174
followers_today:9577284
followers_total:20159062136
count:16349
```

The total number of followers is 20 billion (of course, there are numerous duplicates), and today the followers gained by these accounts amount to 10 million.

The free Twitter API allows for real-time listening of up to 500 thousand tweets. This means that on average, 16 thousand can be collected daily.

Let's assume that our task is to observe those accounts that achieve the greatest reach with the fewest posts. The next aggregation will help us find them:

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

Thanks to it, we can select 3,798 accounts that post only 17,161 tweets daily but have a reach of up to 14 billion users combined, and today they gained 8 million.

```
tweets_today:17161
tweets_total:32346484
followers_today:8197454
followers_total:14860523601
count:3798
```

This means that the number of observed accounts has dropped to 23%, the number of tweets per day to 9%, but the total number of followers has remained at 73% of the previous value (of course, these calculations do not account for duplication), and the number of followers being gained today by these selected accounts is 85% of the original value.

In summary. We selected only a portion of accounts that, writing 9% of the tweets in relation to the entire group of the most popular accounts each day, allow us to achieve 85% of the reach we are interested in.

Our cutoff criterion is to obtain at least 100 followers per tweet. We should expect about 17000/24/60 = 11 tweets per minute.

According to the tradition of this blog, at the end I provide a link to the scraped data:

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/accounts.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/accounts.json)
