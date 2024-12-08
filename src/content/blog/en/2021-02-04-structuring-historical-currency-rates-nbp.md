---
author: Daniel Gustaw
canonicalName: structuring-historical-currency-rates-nbp
coverImage: http://localhost:8484/df272521-e61f-4143-bcb4-a664b6cc1384.avif
description: Learn how to write code that normalizes and structures data based on a case study in the field of finance.
excerpt: Learn how to write code that normalizes and structures data based on a case study in the field of finance.
publishDate: 2021-02-04 06:02:21+00:00
slug: en/structuring-historical-exchange-rates-nbp
tags:
- csv
- typescript
- parcel
- data-processing
- apexcharts
- xls
- json
title: Data Structuring on the Example of CHF NBP Course
updateDate: 2021-02-17 15:21:43+00:00
---

Data structuring is giving data a shape that allows for its analysis and convenient processing. In this entry, I will show how such a process might look using data from NBP, which is stored in files where the header arrangement convention has changed over the years.

Data from NBP are not suitable for immediate use and need to be organized if we want to process them.

I want to emphasize that historical exchange rates are excellently presented on the website:

[https://stooq.com/](https://stooq.com/)

Let's take the Swiss franc exchange rate as an example:

![](http://localhost:8484/c45fe2c1-92f2-45a2-b2a3-34e616bc8bec.avifchf1pricehistory.png)

To download this data, simply go to the page:

[https://stooq.com/q/d/?s=chfpln](https://stooq.com/q/d/?s=chfpln)

and click the button below the table.

![](http://localhost:8484/95e88003-79bf-46d0-b300-d7661d4adcee.avifchf2download.png)

In this article, I am not solving a *real problem*, but rather presenting possible *data structuring methods **through the example of*** a specific set of files with inconsistent and unpredictable conventions.

We will sequentially go through the issues:

1. Data acquisition
2. Data processing
3. Chart display

The main value for the reader is to follow the entire process from start to finish and learn about the tools used here.

---

We will download the data with exchange rates from the page

> [https://www.nbp.pl/home.aspx?f=/kursy/arch\_a.html](https://www.nbp.pl/home.aspx?f=/kursy/arch_a.html)

![](http://localhost:8484/045d4962-c028-4eb1-be9e-9fbd46fcc60d.avifchf3table.png)

Data is divided into separate `xls` sheets.

# Data Retrieval

We will start by retrieving this data. We read the selector from the `HTML` code.

![](http://localhost:8484/6aea3892-5617-4b54-909f-c202c1ae20f5.avifchf4selector.png)

In the browser console, we type:

```js
[...document.querySelectorAll('.normal_2 a')]
    .map(a => `wget ${a.href}`)
    .filter(link => /archiwum_tab/.test(link))
    .join(' && ')
```

The result is a combined `&&` list of `wget` commands downloading consecutive files.

```bash
wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2020.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2021.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2010.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2011.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2012.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2013.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2014.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2015.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2016.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2017.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2018.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2019.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2000.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2001.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2002.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2003.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2004.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2005.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2006.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2007.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2008.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_2009.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1990.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1991.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1992.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1993.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1994.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1995.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1996.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1997.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1998.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1999.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1984.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1985.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1986.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1987.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1988.xls && wget https://www.nbp.pl/kursy/Archiwum/archiwum_tab_a_1989.xls
```

After pasting them into the terminal, the files will be downloaded to our computer.

I recommend using a convention in which such raw files downloaded from the internet go into a separate directory, e.g., `raw`.

# Conversion

We convert all files to `csv` format because it is more convenient for machine processing than `xls`.

```bash
for i in *.xls; do  libreoffice --headless --convert-to csv "$i" ; done
```

After executing this command in our directory, we will see both `xls` files and their corresponding `csv`.

# Structuring

Unfortunately, the people preparing these files did not take care to maintain a common convention, and the first row sometimes needs to be discarded, at other times it contains the names of currencies, countries, and at yet other times, the currency code.

What can we do about it?

It is best to establish our own recording standard and unify the data structure across the entire dataset.

Date, currency, and exchange rate recording convention:

* date YYYY-MM-DD - because it sorts conveniently and is a natural date format in many languages
* currency - using ISO_4217 code (3-letter currency code)
* exchange rate - using a format with a dot to denote fractions

Data structure convention (composition):

* JSON in which the first key is the currency and the second is the date, the value is the value in złoty - this format allows easy searching by currency and then by date, it is conveniently projected in relation to currencies. Despite the overhead in terms of volume compared to CSV, the ease of further processing is the deciding factor here.

Once we have the convention, we can write the code. We will use `typescript` for that.

## Project setup

We start the project with commands

```bash
tsc --init
npm init -y
npm install chai
npm i --save-dev @types/node @types/chai
touch app.ts
```

The package we installed - `chai` will allow us to write automated tests checking the compliance of results with our expectations. This will save us time on their manual verification.

For the task, we should choose a directory structure and paradigm. In our case, we assume a maximum of 100 lines of processing code, and for this reason, one file with procedural code is enough with the skeleton:

```typescript
// declarations
imports ...

constants ...

functions ...

main function

// execution
console.log(main())
```

## Reading Files

The first function will be `main`. We will start by displaying a list of files.

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

Execution by command

```bash
 ts-node app.ts
```

It gives the names of the files we will process:

```json
[
  'archiwum_tab_a_1984.csv',
  'archiwum_tab_a_1985.csv',
...
```

Thanks to the line using `chai`, we are sure that all results have the appropriate type. This may not seem impressive now, but at a later stage, such testing will allow us to quickly detect and patch errors related to discovering further nuances in the conventions used in the examined files.

To display the contents of the first file, we will use the `readFileSync` function. The choice of filters and maps is not random. These functions, along with reduce, are perfectly suited for data processing, and we will see them here many more times.

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

It turns out that the first file does not contain currency codes.

![](http://localhost:8484/db384089-4942-4f2c-9c7e-61960ff9385c.avifchf5codes.png)

So we are forced to build a dictionary that maps country names to currency codes.

```ts
const dict: { [key: string]: string } = {
  'Szwajcaria': 'CHF'
}
```

## Processing Headers

Examining the headers also defines the basic rules for further processing.

1. We need to search for the country name in the first row.
2. Based on this, determine the `col` column where the data is located.
3. In the second row, the `col` column contains the divisor `div`
4. Later, we only take those rows that contain a date in the first column.
5. In these rows, the `col` column contains a value that should be divided by the divisor `div` to have the currency exchange rate.

Thanks to interfaces in TypeScript, we can define what our target data structure from a single file will look like:

```ts
interface YearData {
  [key: string]: {
    col: number,
    div: number,
    values: { [key: string]: number }[]
  }
}
```

Line returning the file content:

```ts
return fs.readFileSync(`${rawDir}/${name}`).toString()
```

we will change to assigning to the constant `arr` an array of arrays from the `csv` file split by new line characters and commas

```ts
const arr = fs
  .readFileSync(`${rawDir}/${name}`)
  .toString()
  .split(`\n`)
  .map(l => l.split(','));
```

The function we will use for the first line distribution is:

```ts
const decomposeBaseSettingsFromNames = (localArr: string[]) => localArr.reduce((p: YearData, n: string, i: number): YearData => {
  if (Object.keys(dict).includes(n)) {
    p[dict[n]] = { col: i, div: 1, values: [] }
  }
  return p
}, {})
```

We will use it right after unpacking the file into the array `arr` in lines

```ts
const head = arr.shift()
if (!head) throw Error('File do not have header line.')
let settings: YearData = decomposeBaseSettingsFromNames(head)
```

In case of success, the settings will contain the key `CHF` with the well-calculated value of the column. For that, we needed the function `decomposeBaseSettingsFromNames`, however, let’s note that I set the value of the divider to `1`. That's because the dividers are in the next line. We will find them using the following lines:

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

The test will also change and will currently take the form of:

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

Executing the above code will give us

```json
[ { CHF: { col: 25, div: 1, values: [] } } ]
```

## Processing Values

```ts
const getDate = (input: string) => {
  if (/\d{2}\.\d{2}\.\d{4}/.test(input)) {
    return input.split('.').reverse().join('-')
  }
  return false
}
```

Now, after processing the headers, we can add code to structure the course values.

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

As we can see, the headers were the most difficult part. Once we have them, arranging the values becomes a formality. The code execution gives:

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

A test of correct data structure could look like this:

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

You can review the entire code here:

[app.ts · 9d401a925bc9e115dfaf9efe6528484f62cf2263 · gustawdaniel / nbp](https://gitlab.com/gustawdaniel/nbp/-/blob/9d401a925bc9e115dfaf9efe6528484f62cf2263/app.ts)

This article could end here with the merging of files into one function and the presentation of the final result...

However, that is not the case. Now the dirty work begins with detecting inconsistencies in the file conventions of NBP.

## Normalization and data cleaning

If we check file `6` using this code, setting the file filtering function to:

```ts
const FILES_FILTER = (e: string, i: number) => i === 5
```

the result will be surprisingly disappointing

```json
[ { CHF: { col: 27, div: 1, values: [] } } ]
```

To debug it behind the line:

```ts
.split(`\n`)
```

we will add

```ts
.filter(ROWS_FILTER)
```

with the value `ROWS_FILTER` defined as

```ts
const ROWS_FILTER = (e: string, i: number) => i <= 4
```

To make reading more convenient, I temporarily displayed the `arr` table using `console.table` and extracted only the most interesting columns:

```ts
console.table(arr.map(l => l.filter((e,i) => i < 5 || Math.abs(i - 30) < 4)));
```

![](http://localhost:8484/61cf0fb7-0756-4f14-8139-5e7a19560cb8.avifchf6table.png)

What do we see?

That the date format has changed to `MM/DD/YYYY`.

We will handle the problem by extending the date converter with another `if`.

```ts
if (/\d{2}\/\d{2}\/\d{4}/.test(input)) {
  const [m, d, y] = input.split('/')
  return [y, m, d].join('-')
}
```

We can also add a filter that will remove spaces from country names:

```ts
const DROP_SPACES = (l: string): string => l.replace(/\s+/g, '')
```

inserted into the map behind the line

```ts
.split(`\n`)
```

This will allow treating the country `U.K.` and `U.K.` the same way.

After these changes, we will also implement a change in testing. We will enforce a non-zero length for price values. We will also move testing to a separate function.

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

And we perform it by returning `settings`.

```ts
testYearData(settings);
```

After unlocking filters

```ts
const FILES_FILTER = (e: string, i: number) => i < Infinity
const ROWS_FILTER = (e: string, i: number) => i <= Infinity
```

Execution will end with an error

![](http://localhost:8484/99217fa8-3967-43d9-a7d9-b1a7cdf95603.avifchf7err.png)

Thanks to the lines allowing for debugging:

```ts
console.table(arr.map(l => l.filter((e,i) => i < 3 || Math.abs(i - 27) < 5)));
```

and

```ts
console.dir(settings, {depth: Infinity});
```

we see that the problem is completely empty lines.

![](http://localhost:8484/ddd3e51a-bd37-474f-8c4b-64d7e89fe9a3.avifchf24empty.png)

The cause of the error is the rigid adherence to a specific row as a place where we keep delimiters or currency names, whereas we should be removing empty lines before detecting headers.

This is a common problem when parsing Excel files. Users, being able to prepare data in a very arbitrary structure, often do not adhere to the convention of placing headers in the same way across all files.

We will use the `test` function and a regular expression that denotes either commas or nothing throughout the line:

```ts
const DROP_EMPTY_LINES = (e:string) => !/^,*$/.test(e)
```

We will join it after `DROP_SPACES` in the `filter` function.

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

This time it doesn't work again. The reason is a very unusual line in one of the files.

![](http://localhost:8484/752e8b00-4302-4f82-a2b6-ba872c04ccdb.avifchf8correction.png)

Course Correction from 1987? How is that? Actually, in `xls` we have something like this:

![](http://localhost:8484/093d1361-1532-4040-aa60-cd50cc9705de.avifchf9xls.png)

However, it concerns the currency `ECU`, so it is most reasonable to omit this line by tightening the date recognition criteria.

![](http://localhost:8484/62ec75f9-e6c2-476a-abd5-6b53ca5df44c.avifchf10diff.png)

The entire code from this stage can be found at the link:

[app.ts · 845527b631054744329b53293bfbf6705956b361 · gustawdaniel / nbp](https://gitlab.com/gustawdaniel/nbp/-/blob/845527b631054744329b53293bfbf6705956b361/app.ts)

However, its execution still causes errors.

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

Upon deeper inspection, it turns out that the problem lies with a line that was almost empty, but not completely empty:

![](http://localhost:8484/a1a5c29e-0331-469d-ba92-28bca784abbd.avifchf11empty.png)

Someone placed `Nr` in a completely insignificant column. We therefore return to the code and will remove this line with the next filter: `DROP_JUNK_LINES`, placed before `DROP_EMPTY_LINES`.

When I wrote this code, I returned to this filter several times. I will not reproduce it this time, but I will simplify and provide the final value of this function:

```ts
const DROP_JUNK_LINES = (l: string): string => l.replace(/(Nr)|(data)|(WALUTA\/CURRENCY)|(\.tab)/ig, '')
```

It turned out that in this line there were:

* No
* date
* Currency/Currency
* .tab

These things were sometimes in uppercase, and what surprised me the most was also \`C U R R E N C Y / C U R R E N C Y\`. Fortunately, thanks to the `DROP_SPACES` map and the flags `g` and `i` in the `DROP_JUNK_LINES` map, the `DROP_EMPTY_LINES` filter treats all these lines as equally empty, that is, necessary.

```diff
     .split(`\n`)
     .map(DROP_SPACES)
+    .map(DROP_JUNK_LINES)
     .filter(DROP_EMPTY_LINES)
     .filter(ROWS_FILTER)
```

After introducing these fixes, we can see the required structure for subsequent files:

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

Link to changes in the code

[Dropped junk lines (fd13a96c) · Commits · gustawdaniel / nbp](https://gitlab.com/gustawdaniel/nbp/-/commit/fd13a96ceb1effe2471445a1e954600fb51c56af)

However, it is enough to process a few more files to return to the starting point, see

```json
[ {} ]
```

and repair from scratch.

What happened this time?

Printing a table from the `CSV` file after processing will help us.

```ts
console.table(arr.map(e => e.filter((e,i) => i < 10)));
```

to see a completely new header organization and the change of the date column

![](http://localhost:8484/70234f95-8834-4879-8290-b1b873c01f15.avifchf12fix.png)

This time both the currency and the divisor are placed on the same line. So we will handle the `else` case after the line.

```ts
if (Object.keys(settings).length) {
```

we will use the function `decomposeBaseSettingsFromCodes` defined as

```ts
const decomposeBaseSettingsFromCodes = (localArr: string[]) => localArr.reduce((p: YearData, n: string, i: number): YearData => {
  const [, div, curr] = n.match(/^(\d+)(\w+)$/) || []
  if (parseInt(div) && curr && Object.values(dict).includes(curr)) {
    p[curr] = { col: i, div: parseInt(div), values: [] }
  }
  return p
}, {})
```

What does it change?

* It splits the value into the divisor `div` and currency code using `match`
* It does not need an additional `shift` statement to extract the divisor

For this reason, it will be incorporated into the code as follows

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

Another problem is the ordinal numbers in the first column instead of dates. We will deal with dates by replacing the `getDate` function with the `getDateFromArr` function.

```ts
const getDateFromArr = (arr: string[]) => {
  return getDate(arr[0]) || getDate(arr[1])
}
```

now it is used like this:

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

Fixes can be seen in the commit:

[Fixed decoding codes and column with indexes](https://gitlab.com/gustawdaniel/nbp/-/commit/81db32a6bb6d1b25569680a1605961d6efa8b190)

Is that all the problems? Absolutely not. In 2008, another convention was used.

![](http://localhost:8484/43871410-d47e-4076-95ab-61d8795fef17.avifchf132008.png)

It consists of not placing "Switzerland" anywhere, nor "1CHF" anywhere, therefore both recognition methods fail. What should we do? We can outline the header recognition algorithm as follows:

![](http://localhost:8484/fa86f166-08a5-4f4d-a6ac-93564ffe122b.avifchf14schema.png)

We marked the missing elements in orange.

Since the search for the divisor is repeated, we will separate it into a separate function:

```ts
const extendSettingsByDivCoefficient = (arr: string[][], settings: YearData) => {
  const subHead = arr.shift()
  if (!subHead) throw Error('File do not have sub-header line.')
  Object.keys(settings).forEach(key => {
    settings[key].div = parseInt(subHead[settings[key].col])
  })
}
```

We shouldn't keep too much code in `main` because it loses readability, so we move all the header recognition logic to a separate function:

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

In the main will only be:

```
const settings = recognizeSettingsFromHead(arr);
```

For parsing divisors, the condition became key:

```
Number.isNaN(settings[key].div)
```

Therefore, in the configuration settings for codes, we can no longer optimistically assume setting `1` as the default value, nor force the occurrence of a number with the currency code, nor require it.

Changes in functions performing the header processing earlier look like this

![](http://localhost:8484/e43bf31c-938d-446b-bba7-a2692d73e6ca.avifchf15diff.png)

This is how their current code looks, however.

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

The entire project at this stage:

[app.ts](https://gitlab.com/gustawdaniel/nbp/-/blob/4bca2afc7fcac9779ea4afdf0bcda89a08f6ab52/app.ts)

As you can see, data cleaning is a tedious process where problems never end. Fortunately, this data arrives at the pace of one file per year, and it seems that we managed to structure it before this time elapsed.

Executing the code with the command

```bash
ts-node app.ts
```

will display long lists of tables and configurations but will not throw any error.

## Merging Files

The following are required for merging files:

1. adding a result type

```ts
interface OutData {
  [key: string]: {
    [key: string]: number
  }
}
```

3. Preparing the connecting function

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

4\. Adding `mergeYears` before `return` in the `main` function.

```ts
return mergeYears(fs.readdirSync(rawDir).filter(f => f.endsWith('csv'))
```

Introducing these changes allows you to see the courses across the entire range.

```json
{
  CHF: {
    '1984-01-02': 140.84,
    '1984-01-09': 140.08,
    '1984-01-16': 138.62,
...
```

To save the result, we will add the line:

```ts
!fs.existsSync(process.cwd() + '/out') && fs.mkdirSync(process.cwd() + '/out', {recursive: true})
fs.writeFileSync(process.cwd() + '/out/chf.json', JSON.stringify(main()))
```

Execution:

```bash
time ts-node app.ts
```

returns:

```bash
ts-node app.ts  7.67s user 0.29s system 147% cpu 5.412 total
```

and will create the file `/out/chf.json` weighing `156K`.

The project file containing `126` lines of code is available at the link:

[app.ts](https://gitlab.com/gustawdaniel/nbp/-/blob/12edf429a1ddba80f04f29e0f9d2a0309aa372e2/app.ts)

If you need this data, you can recreate all the steps yourself or download the ready-made JSON data from the link

https://gitlab.com/gustawdaniel/nbp/-/blob/master/out/chf.json

# Visualization

I can’t resist the temptation to draw and discuss the exchange rate of the Swiss Franc once I managed to extract the rates from so many years ago. Particularly interesting is the period before the beginning of the current century and the boom in CHF loans from 2005-2008.

## Project Preparation

To draw the charts, we will use the `index.html` file with the content:

```html
<html>
<body>
<script src="./index.ts"></script>
</body>
</html>
```

and an empty `index.ts`. Now let's install `parcel`

```bash
npm install -g parcel-bundler
```

It is a build tool like `webpack`, `gulp`, or `grunt`, except that unlike the aforementioned, its configuration does not take hundreds of years and does not require pasting configurations and searching for packages.

After typing:

```bash
parcel index.html
```

we will see a build message and a link to the page

![](http://localhost:8484/892c57e1-ea8f-45dc-aac4-e70fe31c48b4.avifchf16server.png)

After opening the link and the developer console, and then adding the line `***console***.log("test")` to `index.ts`, we will see the page automatically reload and "test" logged to the console.

## Integration of the charting library

To draw charts, we will use Apex Charts.

```bash
npm install apexcharts --save
```

We will include the following in the body in the file `index.html`:

```
<main id='chart'></main>
```

to attach the chart. However, in `index.ts` the configuration of a simple stock chart

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

You could say - super simple:

![](http://localhost:8484/13ae27b8-3d64-470c-b7d7-13813ffcbcf7.avifchf17bar.png)

However, this simplicity has a purpose. It allows not to clutter the article with test data, only when we have the data structure for the chart can we perform the transformation of our structure extracted from `xls` files.

## Arrangement of data on the chart

Let's summarize:

1. Our structure

```
{
  CHF: {
    'YYYY-MM-DD': number,
    ...
  }
}
```

Structure for the chart:

```
{
  x: Date,
  y: [number, number, number, number] // open, high, low, close
}[]
```

To perform this transformation, we need to divide our data into ranges, meaning we need to choose how many candles the chart should contain. Then, after calculating the boundary dates, we will iterate through the ranges, selecting from the available dates those that fall within the range, from which we will in turn search for the opening, closing, and extreme values.

We will start by importing the file with data saved by the script from the previous section:

```ts
import {CHF} from './out/chf.json'
```

To handle this correctly in the `tsconfig.json` file, we add the `resolveJsonModule` flag.

```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    ...
```

Now we define the interface with output data

```ts
interface StockRecord {
  x: Date,
  y: [number, number, number, number]
}
```

To the distribution of the function over intervals we will use the function:

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

described in the link:

[Stack Overflow](https://stackoverflow.com/questions/63273494/divide-date-range-into-known-number-of-equal-chunks)

The data mapping itself has been arranged in another function.

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

This longer piece of code requires a comment. This task could have been accomplished using map filters and forEach loops, but I opted for a double while with double shifts. This is not a coincidence. In this case, it's about performance. While those more fashionable and elegant methods are always my first choice, in cases where reducing computational complexity requires maintaining some kind of cache, I make an exception. Communication between separate executions of the methods `map`, `filter`, `reduce`, `forEach` is more difficult, requiring the use of higher scope variables. In particular, nesting loops by default assumes performing `n x m` operations where `n` and `m` are the dimensions of the arrays. However, here I want to perform more like `n + m` runs; I don't want to process, discard, filter, or check the same key in the currency object twice if it's not necessary.

What savings are we talking about?

If this code was written inefficiently and we didn't arrange the iterations well, it might look more readable and concise, but with a granularity of 500 candles, it would perform `7200 x 500 = 3.6e6` loops, while we have around `7200 + 500 = 7.7e4`, which means about 50 times shorter loading time.

Generating options is simply a function that puts data into the Apex Chart configuration template.

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

At the end, the execution of the program, that is, attaching data to the configuration and creating a chart using it:

```
const chart = new ApexCharts(document.querySelector('#chart'), generateOptions(mapToStockData(CHF, 500)))
chart.render().then(console.log).catch(console.error)
```

The chart looks great. It perfectly captures the realities of the currency wild west from the early 90s. We see how in 1991 inflation skyrocketed the price of the franc by orders of magnitude, and the drastic drop at the beginning of 1995 caused by the implementation of the denomination act from July 7, 1994.

![](http://localhost:8484/79297982-53d5-4631-80ce-233139e5e437.avifchf18graph.png)

An undetected problem turns out to be the incorrect scaling from 1995.

![](http://localhost:8484/ec2b3b0d-9f59-42a9-8a1d-a15d417333f6.avifchf19chart.png)

Indeed, we have a change in the multiplier during the year 1995

![](http://localhost:8484/49771fae-248f-44fe-a307-bc25574964da.avifchf20chart.png)

We can fix this problem by adding lines that shift the divider if its change occurs between values, not in the header:

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

The next change will be the introduction of normalization. If we want to compare values on the chart, we should consider the denomination. The function will help us with this.

```ts
const denominationFactor = (date:string): number => {
    return Number.parseInt(date.substr(0,4)) <= 1994 ? 1e4 : 1;
}
```

and including its result in the line:

```ts
settings[key].values.push({[date]: parseFloat(localArr[settings[key].col]) / settings[key].div / denominationFactor(date)})
```

Regenerating data allows you to see the chart

![](http://localhost:8484/8d0b0279-28a4-4f36-8018-bd8cb6cbb5e0.avifchf21chart.png)

To perform the deployment, we will use the Netlify service.

[CHF Exchange Rate in PLN](https://chf-pln.netlify.app/)

For this purpose, we add `parcel` to the project's development dependencies:

```
 npm install -D parcel-bundler
```

And we add a build command in `package.json`

```json
  "scripts": {
    "build": "parcel build index.html",
  },
```

After selecting the `dist` directory in the Netlify panel and running the command `npm run build`, we can enjoy a configured CI deployment.

![](http://localhost:8484/47831aa4-8526-44ad-b452-a874f467ec88.avifchf22netlify.png)

At the end of the course CHF from the late 90s to modern times

![](http://localhost:8484/bedc08c4-895e-4579-b482-5c9d2cc39126.avifchf23chart.png)

# Conclusions

Articles that helped in preparing this entry
