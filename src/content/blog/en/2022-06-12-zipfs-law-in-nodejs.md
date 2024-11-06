---
author: Daniel Gustaw
canonicalName: zipfs-law-in-nodejs
coverImage: http://localhost:8484/9ce72a45-8820-4738-8ccb-71dae040e3ee.avif
description: Learn how to read large files in Node.js, count word occurrences using the Map object, and handle memory limits.
excerpt: Learn how to read large files in Node.js, count word occurrences using the Map object, and handle memory limits.
publishDate: 2022-06-11T22:50:51.000Z
slug: en/zipf's-law-in-nodejs
tags: ['nodejs', 'zipf', 'typescript']
title: Analysis of Zipf's Law in Node.js
updateDate: 2022-06-11T23:06:08.000Z
---

Zipf's law states that if words in a given language are sorted by their frequency of occurrence, that frequency will be inversely proportional to the position (rank) of the word.

In other words, there is a linear relationship with a negative coefficient between the logarithms of frequency and rank, as seen in the graph in logarithmic-logarithmic scale.

![](http://localhost:8484/6239ac87-abab-42ec-8187-c0cc1048c36f.avif)

or through a simple transformation:

$$
f * r = const \Leftrightarrow \log(f *r) = const \Leftrightarrow \log(f) = const - \log(r)
$$

[Zipf’s law - Wikipedia](https://en.wikipedia.org/wiki/Zipf%27s_law)

We know that this is true, and on Wikipedia, you can find charts made based on corpora from many languages. We are checking this for fun and out of love for science.

The texts we took from Ukrainian legislation, half a billion words should be enough.

[Corpora: lang-uk](https://lang.org.ua/en/corpora/)

On the site, we have a version with tokenization, which is the division into words, and lemmatization, which additionally consolidates word forms, replacing them with the default non-inflected form. You can read more about tokenization and lemmatization at the link:

[https://medium.com/mlearning-ai/nlp-tokenization-stemming-lemmatization-and-part-of-speech-tagging-9088ac068768](https://medium.com/mlearning-ai/nlp-tokenization-stemming-lemmatization-and-part-of-speech-tagging-9088ac068768)

## Preparing data for analysis

For us, lemmatization will be more convenient, as we do not want to analyze content, but only the statistics of this vocabulary. We download the file

```bash
wget https://lang.org.ua/static/downloads/corpora/laws.txt.lemmatized.bz2
```

we unpack it:

```
tar -xf laws.txt.lemmatized.bz2
```

and we prepare its summary to be able to test the application on a smaller file

```
head -n 200 laws.txt.lemmatized > laws.txt.lemmatized.head
```

The statistics of the input file are as follows

```
wc laws.txt.lemmatized
43230994  580844603 7538876115 laws.txt.lemmatized

du -h laws.txt.lemmatized
7,1G	laws.txt.lemmatized
```

## Reading a file in Node.js

We start the project with the commands

```
npm init -y && tsc --init
```

We are installing packages `esbuild esbuild-node-tsc` for building the project and `dayjs` for measuring program execution time.

```
npm i -D esbuild esbuild-node-tsc
npm i dayjs
```

we place in the `Makefile`

```
run:
	etsc && node ./dist/index.js
```

thanks to which with the command `make run` we will be able to compile and run our program. This requires more configuration than `ts-node`, but the compilation speed is 4 times higher.

Due to the size of the file, it is not advisable to write `fs.readFileSync`, although most of you probably have over 8GB of RAM. However, let's assume we want to write a program that can handle larger files without imposing restrictions related to the need to load them entirely into memory.

We will use the construction

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

This code is placed in the file `src/index.ts`. The `crlfDelay` option allows for correct reading of files with `\r\n`, it is good to include it just in case. We see that the first line containing `await` is only the `for` loop. This allows us to start processing the file before the read reaches its end.

## Counting Word Occurrences

Now we will add counting word occurrences and place them in a map.

```typescript
    const map = new Map<string, number>()
```

we can replace `console.log` in a `for` loop with

```typescript
        line.split(' ').forEach(word => {
            if (map.has(word)) {
                map.set(word, (map.get(word) || 0) + 1)
            } else {
                map.set(word, 1)
            }
        })
```

after completing the loop we sort the map by frequency of occurrences

```typescript
    const sortedAsc = new Map([...map].sort((a, b) => (a[1] < b[1] ? 1 : -1)));
```

we form the output file text

```typescript
    const out = [...sortedAsc.entries()].reduce((p, n) => `${p}\n${n[1]},${n[0]}`, ``)
```

and we save the file

```typescript
    fs.writeFileSync(process.cwd() + '/out', out)
```

Actually, that's it. When starting the program with the entire file, we expect to receive a file with two columns - the count and the word. However, without any feedback on what stage we are at, it would be difficult to determine whether the program is working correctly, has frozen, and how much longer we will have to wait for the result.

## Program Decoration with Logs

We will start by importing dayjs, in order to display the time. Usually, one should not install libraries that are not needed, but the native Date object is useless.

```
console.log('Time', dayjs().diff(s))
```

```typescript
import dayjs from 'dayjs'
```

At the beginning of the `main` function, we define a variable with the start time of execution.

```typescript
    const s = dayjs()
```

Before the loop, we define the counter.

```typescript
    let i = 0;
```

and in the loop we display its value and the time since it was turned on

```typescript
        i++;
        if (i % 1e5 === 0) {
            console.log(`I`, i, `T`, dayjs().diff(s))
        }
```

Thanks to this, knowing that the file has 43 million lines, we can estimate when the program will finish. At the very end of the `main` function we can add

```typescript
    console.log('Time', dayjs().diff(s))
```

An alternative to this approach is `console.time`.

## Running the program and memory issue

After starting, everything initially went well, until the fatal error `heap out of memory`.

![](http://localhost:8484/75262dcb-25cd-46a0-9a22-2e580b0d4652.avif)

Importantly, the computer did not freeze and had spare free memory. This happened because the default limit set at 2GB was exceeded. We can check this limit with the command:

```bash
node -e 'console.log(v8.getHeapStatistics().heap_size_limit/(1024*1024))'
```

and raise it by setting the appropriate flag with the `node` process in the `Makefile`

```
run:
	etsc && node --max-old-space-size=4096 ./dist/index.js
```

This time the program worked correctly and saved the output file after 5.5 minutes.

Its first lines are shown below.

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

## Preparing the Chart

We would now like to see the file where the first line contains the position of the word and the second the number of occurrences. We create it with the command:

```
grep '\S' out | awk -F',' '{print NR, $1}' > log.txt
```

In this line, `\S` is responsible for filtering out empty lines. The flag `-F` allows setting `,` as the separator, and `NR` inserts the line number starting from `1`.

We will create the chart using `gnuplot`.

```
gnuplot -e "set ylabel 'Count'; set xlabel 'Rank'; set logscale xy; plot 'log.txt' with linespoints linestyle 1" -p
```

The `-e` flag allows you to specify a command and `-p` does not turn off the plot after it is drawn.

![](http://localhost:8484/ad6a0225-ab79-4797-9ef6-285c623bd87a.avif)

We see that the chart matches the one we saw on Wikipedia.

![](http://localhost:8484/bc9c8b7d-7019-4011-97a1-d2ac6549cdca.avif)

## Interpretation of Results

Thanks to this distribution of word frequencies, language learning can be presented as a shift from familiarity with the most commonly to least commonly known phrases. We can also sort texts according to their difficulty for readers and adapt them to the student's level. We are also able to estimate the probability of encountering an unknown word in a given sample of text.

It seems that exploring this topic further could have interesting practical applications.
