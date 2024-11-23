---
author: Daniel Gustaw
canonicalName: medical-register-scraping
coverImage: http://localhost:8484/e6f09d94-68fb-472e-9972-9ffe2c6a025f.avif
description: Data administrators hate it. See how by entering two commands in the console he downloaded the register of all pharmacies in Poland.
excerpt: Data administrators hate it. See how by entering two commands in the console he downloaded the register of all pharmacies in Poland.
publishDate: 2021-02-17 23:25:12+00:00
slug: en/scraping-medical-registers
tags:
- medical
title: Scraping of the Pharmacy Register
updateDate: 2021-02-17 23:27:35+00:00
---

There are websites that are better or worse protected against scraping. Now we will take a look at a website that is not protected at all - the Medical Register containing data about pharmacies.

From the article, you will learn how to analyze websites and what to pay attention to when scraping data. It turns out that in some cases, really minimal amounts of code are enough to download data in a convenient format for further processing.

The article is based on an analysis of scraping in a specific case. Here it is the website:

```
https://rejestrymedyczne.ezdrowie.gov.pl/main
```

It contains several data registers related to medicine.

![](http://localhost:8484/c17df1c5-6321-4840-bdbe-f47b6296c374.avif)

Let's assume we want to download all data about pharmacies from this page. We click on the pharmacy register and see:

![](http://localhost:8484/faf5fc8b-7bd7-40e5-9b3e-0d6b1669bd37.avif)

Interestingly, pagination does not change the URL here, only reloads the page and displays the next view in the table.

After switching to the "Network" tab in the browser console, we can see that a request is being sent in the background.

![](http://localhost:8484/cb21eefb-14a1-4d54-a5ba-8df7f8e7a16c.avif)

It turns out that without any token, key, or cookie, you can download data that is loaded into the table directly from the API using a command.

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=1\&size\=2\&sortField\=originId\&sortDirection\=ASC
```

![](http://localhost:8484/ace8898e-9b72-44d5-a5bf-f2e543ea67a0.avif)

No problem to download **two** pharmacies:

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=1\&size\=2\&sortField\=originId\&sortDirection\=ASC | jq '.[][] | {nr: .registrationNumber, name: .owners[0].name}'
```

![](http://localhost:8484/1eac6eca-3409-4c59-b678-367f6607d33f.avif)

There is no problem downloading **ten thousand** pharmacies.

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=1\&size\=10000\&sortField\=originId\&sortDirection\=ASC | jq '.[][].owners[0].name' | wc
```

![](http://localhost:8484/51765dc2-2e85-47a2-916e-7f505842c0dc.avif)

To download 15 thousand pharmacies, the command is

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=1\&size\=15000\&sortField\=originId\&sortDirection\=ASC | jq '.[][]' > ra.json
```

To insert data into the database

```bash
mongoimport --db test --collection ra --drop --file ./ra.json
```

It turns out that unfortunately we only have `8006` documents, not the expected `15000`.

```bash
2021-02-17T22:59:19.216+0100	connected to: mongodb://localhost/
2021-02-17T22:59:19.217+0100	dropping: test.ra
2021-02-17T22:59:20.234+0100	8006 document(s) imported successfully. 0 document(s) failed to import.
```

For `10,000` we have the correct result for both downloading

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=1\&size\=10000\&sortField\=originId\&sortDirection\=ASC | jq '.[][]' > ra.json
```

how and import

```bash
mongoimport --db test --collection ra --drop --file ./ra.json

2021-02-17T23:02:11.893+0100	connected to: mongodb://localhost/
2021-02-17T23:02:11.894+0100	dropping: test.ra
2021-02-17T23:02:13.143+0100	10000 document(s) imported successfully. 0 document(s) failed to import.
```

It is important that when downloading the second page we append to the file `>>` and do not overwrite its content `>`.

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=2\&size\=10000\&sortField\=originId\&sortDirection\=ASC | jq '.[][]' >> ra.json
```

This time the record gives `13006` files and everything is explained.

```bash
mongoimport --db test --collection ra --drop --file ./ra.json

2021-02-17T23:03:43.592+0100	connected to: mongodb://localhost/
2021-02-17T23:03:43.592+0100	dropping: test.ra
2021-02-17T23:03:45.173+0100	13006 document(s) imported successfully. 0 document(s) failed to import.
```

The result `8006` at `size=15000` was due to the fact that pages are numbered starting from `0` in this `api` and `8006` = `23006 - 15000`, which was the correct result.

In any case, it doesn't matter whether we fetch in batches of 10 or 15 thousand, we have one request left with `page=0`, for example:

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=0\&size\=10000\&sortField\=originId\&sortDirection\=ASC | jq '.[][]' >> ra.json
```

The last import allows us to upload all pharmacies.

```
mongoimport --db test --collection ra --drop --file ./ra.json

2021-02-17T23:08:02.038+0100	connected to: mongodb://localhost/
2021-02-17T23:08:02.038+0100	dropping: test.ra
2021-02-17T23:08:04.808+0100	23006 document(s) imported successfully. 0 document(s) failed to import.
```

In `compass` we can design an aggregation with two stages:

1. Take a snapshot of the `owners` table

```
{
    '$unwind': {
      'path': '$owners'
    }
}
```

2. Projection of the most interesting fields

```
{
    '$project': {
      'name': '$owners.name',
      'firstName': '$owners.firstName',
      'lastName': '$owners.lastName',
      'krs': '$owners.krs',
      'nip': '$owners.nip',
      'regon': '$owners.regon',
      'address': {
        '$concat': [
          '$address.street', ' ', '$address.homeNumber', ', ', '$address.postcode', ' ', '$address.city'
        ]
      }
    }
}
```

It will allow us to generate the program code.

```js
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

/*
 * Requires the MongoDB Node.js Driver
 * https://mongodb.github.io/node-mongodb-native
 */

const agg = [
  {
    '$unwind': {
      'path': '$owners'
    }
  }, {
    '$project': {
      'name': '$owners.name',
      'firstName': '$owners.firstName',
      'lastName': '$owners.lastName',
      'krs': '$owners.krs',
      'nip': '$owners.nip',
      'regon': '$owners.regon',
      'address': {
        '$concat': [
          '$address.street', ' ', '$address.homeNumber', ', ', '$address.postcode', ' ', '$address.city'
        ]
      }
    }
  }
];

MongoClient.connect(
  'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false',
  { useNewUrlParser: true, useUnifiedTopology: true },
  function(connectErr, client) {
    assert.equal(null, connectErr);
    const coll = client.db('test').collection('ra');
    coll.aggregate(agg, (cmdErr, result) => {
      assert.equal(null, cmdErr);
    });
    client.close();
  });
```

To enable it, we need to install the drivers for `mongo` and `assert`.

```
 npm init -y && npm i mongodb@3.6.3 assert
```

Version `@3.6.3` results from the occurrence of the missing `MongoError` bug in version `3.6.4`.

[Warning: Accessing non-existent property ‘MongoError’ of module exports inside circular dependency](https://developer.mongodb.com/community/forums/t/warning-accessing-non-existent-property-mongoerror-of-module-exports-inside-circular-dependency/15411)

The presented code does nothing besides performing the aggregation. If we wanted to save the aggregation result to a file, we need to slightly modify it by adding the necessary import at the beginning.

```
const fs = require('fs')
```

and changing the callback to one that actually saves the result.

```
MongoClient.connect(
    'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false',
    { useNewUrlParser: true, useUnifiedTopology: true },
    function(connectErr, client) {
      assert.strictEqual(null, connectErr);
      const coll = client.db('test').collection('ra');
      coll.aggregate(agg, async (cmdErr, result) => {
        assert.strictEqual(null, cmdErr);
          const out = await result.toArray();
          fs.writeFileSync('ra-project.json', JSON.stringify(out));
          return client.close();
      });
    });
```

It turns out that the most interesting data is about 10% of what we downloaded.

```
du -h ra*json
50M	ra.json
4.8M	ra-project.json
```

This entry shows how easy it is to perform scraping using APIs provided by website creators.

Unfortunately, not all registers from this service are so easy to retrieve. One of the more challenging ones is the medical diagnosticians' register. However, the difficulty here is that even a person cannot access some of the data presented in this register due to errors in the website code.

## Summary

We demonstrated how to detect requests to the `api` using the browser console and how to utilize them for data scraping. We then placed the data into `mongodb` and, through aggregation, generated a dataset that is 10 times lighter, containing only the most interesting information.

In this project, there is so little code that no repository was created for it. Data can be downloaded from the links.

All data:

> [https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/ra.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/ra.json)

Only KRS, NIP, REGON, ADDRESS, FIRST NAME, LAST NAME, NAME

> [https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/ra-project.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/ra-project.json)

If you want to challenge me and suggest a website worth scraping, feel free to schedule an obligation-free consultation.
