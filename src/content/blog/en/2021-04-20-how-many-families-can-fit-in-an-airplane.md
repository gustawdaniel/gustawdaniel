---
author: Daniel Gustaw
canonicalName: how-many-families-can-fit-in-an-airplane
coverImage: http://localhost:8484/e241188a-23c6-41d5-a640-95085128893c.avif
description: We compare two solutions to the problem of counting free sets of adjacent seats. You will learn how to use Profiling and how much difference the use of pop and shift makes on arrays in js.
excerpt: We compare two solutions to the problem of counting free sets of adjacent seats. You will learn how to use Profiling and how much difference the use of pop and shift makes on arrays in js.
publishDate: 2021-04-20 18:41:10+00:00
slug: en/how-many-families-fit-in-a-plane
tags:
- algorithm
title: How many families can fit on the plane - an algorithmics problem
updateDate: 2021-04-20 18:41:10+00:00
---

We will discuss two solutions to the problem that was used during a certain recruitment. If you can write code, I recommend solving it on your own after reading the content; it will take about 10 to 30 minutes and allow you to compare your solution with those presented below:

## Problem Statement

In the airplane, there are seats arranged in three sets containing 3, 4, and 3 adjacent seats, respectively. We assume that the rows are counted from 1 and the columns are indexed using the letters of the alphabet as in an EXCEL table (from A to K). The diagram of the airplane is shown in the image below. We assume that all seats have the same layout as those marked in blue.

![](http://localhost:8484/d7351e7c-8a1e-48d4-a56a-1e276afb1ca9.avif)

We assume that the airplane has a length of `N` rows with seats. We also know the current occupancy of the seats, which is recorded in the form of a string `S` as space-separated coordinates of the row and column number, e.g.:

```
S=1A 3C 2B 40G 5A
```

means taking seats `1A`, `3C`, `2B`, `40G` and `5A`.

Our goal is to write a function that counts how many 3-person families needing adjacent seats can fit in the plane.

For example, for the data:

```
const S = "1A 2F 1C"
const N = 2;
```

the correct result will be 4.

---

This is the best place to complete this task on your own and compare with the solutions presented below.

## Marcin's Solution

The first solution was created by my friend Marcin. It has short, readable code. It initializes a two-dimensional array of all places, marks them with `false`, and finally iterates through the rows counting free slots based on the appropriate criteria for each of them.

```javascript
function solution(N, S) {
  const seatNames = {
    'A': 0,
    'B': 1,
    'C': 2,
    'D': 3,
    'E': 4,
    'F': 5,
    'G': 6,
    'H': 7,
    'J': 8,
    'K': 9
  }
  const freeSeats = Array.from({length: N}, () => Array.from({length: 10}, () => true))
  const reservedSeats = S.split(' ');
  reservedSeats.forEach(s => {
    try {
      freeSeats[parseInt(s.substring(0, s.length - 1)) - 1][seatNames[s[s.length - 1]]] = false;
    } catch (e) {
      console.log('Some error @ reserved seat marked: ', s)
    }
  })

  let free3seats = 0
  freeSeats.forEach(rs => {
    if (rs[0] && rs[1] && rs[2]) free3seats++;
    if ((rs[3] && rs[4] && rs[5]) || (rs[4] && rs[5] && rs[6])) free3seats++;
    if (rs[7] && rs[8] && rs[9]) free3seats++;
  })

  return free3seats
}

module.exports = {solution};
```

## Daniel's Solution

The second directly uses a slot array, folding it into one dimension. Without using an indexing data structure analogous to the places, we are forced to calculate the slot index every time sequentially, along with conditional statements imposed on columns. The code is harder to read and requires several lines of comments describing the adopted convention. Its advantage is operating on a smaller data structure, while its disadvantage is more complex conditional statements.

```javascript
// DOCS
// slot 1 = empty
// slot 0 = taken
// slot "r" = taken from right
// slot "l" = taken from left

function markCorner(slots, nr, side) {
  if (slots[(nr - 1) * 3 + 1] === 1) slots[(nr - 1) * 3 + 1] = side;
  else if (slots[(nr - 1) * 3 + 1] === (side === 'l' ? 'r' : 'l')) slots[(nr - 1) * 3 + 1] = 0;
}

function solution(N, S) {
  const slots = [...new Array(3 * N)].map(() => 1);
  const places = S.split(' ');
  while (places.length) {
    const place = places.shift();
    const nr = place.slice(0, -1);
    const letter = place.charAt(place.length - 1);

    if (['A', 'B', 'C'].includes(letter)) {
      slots[(nr - 1) * 3] = 0;
    }

    if (['H', 'J', 'K'].includes(letter)) {
      slots[(nr - 1) * 3 + 2] = 0;
    }

    if (['E', 'F'].includes(letter)) {
      slots[(nr - 1) * 3 + 1] = 0;
    }

    if (['D'].includes(letter)) {
      markCorner(slots, nr, 'l');
    }

    if (['G'].includes(letter)) {
      markCorner(slots, nr, 'r');
    }
  }

  return slots.reduce((p, n) => p + Boolean(n), 0);
}

module.exports = {solution};
```

## Performance Comparison of Solutions

To compare the execution speed of these codes, we will add a coordinate generator with locations:

```
const fs = require('fs');

function letter() {
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'][Math.floor(Math.random() * 10)];
}

function row(N) {
  return Math.floor(Math.random() * N + 1);
}

function tempPath(N, M) {
  return `/tmp/.cache.generate-places-${N},${M}.log`;
}

// '1A 3C 2B 40G 5A'
function generatePlaces(N, M) {
  if (fs.existsSync(tempPath(N, M))) {
    return fs.readFileSync(tempPath(N, M)).toString();
  }

  let res = [];
  while (res.length < M) {
    const n = `${row(N)}${letter()}`;
    if (!res.includes(n)) {
      res.push(n);
    }
  }
  const out = res.join(' ');

  fs.writeFileSync(tempPath(N, M), out);

  return out;
}

module.exports = generatePlaces;
```

Lines from `fs` allow us to save the generated list of locations in cache and not regenerate it when retesting.

We also create a script to test the performance of both algorithms:

```
const d = require('./d');
const m = require('./m');
const generatePlaces = require('./generatePlaces');

if (process.argv.length !== 4) {
  throw new Error('Type `node test.js N M`');
}

const N = parseInt(process.argv[2]) || 50;
const M = parseInt(process.argv[3]) || 10;

const params = [N, generatePlaces(N, M)];

console.time('m');
const endM = m.solution(...params);
console.timeEnd('m');

console.time('d');
const endD = d.solution(...params);
console.timeEnd('d');

console.log(endM, endD);
```

Hypothetically, let's assume we have a very long plane (half a million rows). We will sequentially check the cases of a nearly empty flight with `1000` occupied seats. The number that follows `m` is the time for Marcin's solution, and the one after `d` is the time for Daniel's.

```
time node test.js 500000 1000
m: 1.339s
d: 151.637ms
```

We see that the solution counting only slots detects 8.8 times faster. For `20k` already occupied places:

```
time node test.js 500000 20000
m: 1.462s
d: 276.517ms
```

this advantage drops to 5.3 times. If there are `40k` occupied places, the results will differ as follows:

```
time node test.js 500000 40000
m: 1.386s
d: 606.803ms
```

Daniel's solution will still be faster, but only 2.2 times. For `80k` occupied seats, the situation reverses and Marcin's solution becomes 1.62 times faster.

```
time node test.js 500000 80000
m: 1.385s
d: 2.257s
```

At `100k` places, Marcin's script achieves results that are already 4.7 times better.

```
time node test.js 500000 100000
m: 1.413s
d: 6.656s
```

---

## Trap

```
const d = require('./d');
// const m = require('./m');
const generatePlaces = require('./generatePlaces');

if (process.argv.length !== 4) {
  throw new Error('Type `node test.js N M`');
}

const N = parseInt(process.argv[2]) || 50;
const M = parseInt(process.argv[3]) || 10;

const params = [N, generatePlaces(N, M)];

// console.time('m');
// const endM = m.solution(...params);
// console.timeEnd('m');

console.time('d');
const endD = d.solution(...params);
console.timeEnd('d');

// console.log(endM, endD);
```

the measurement time result will increase significantly:

```
time node test.js 500000 100000
d: 26.454s
node test.js 500000 100000  26.42s user 0.08s system 99% cpu 26.524 total
```

And in the same isolated way, testing Marcin's code will give us again the same result close to one and a half seconds.

```
time node test.js 500000 100000
m: 1.437s
node test.js 500000 100000  1.66s user 0.09s system 115% cpu 1.515 total
```

For profiling, we can use the `--porf` flag, which will create a log file of about `4MB`.

Reviewing it is not easy if you don’t know what to look for. This file looks something like this:

![](http://localhost:8484/d3709132-8973-4019-b6a5-bbe082a7142e.avif)

Fortunately, Webstorm has interesting profiling tools that do the same thing as this flag underneath, but they apply a graphical overlay and graphs that allow you to navigate the logs and quickly get to the source of the problem. To configure profiling, we check `Coding assistance for Node.js` in the settings.

![](http://localhost:8484/2dbfbc25-faf3-4b30-96c4-10804664593c.avif)

Next, we create a profile that will launch our script with the appropriate parameters.

![](http://localhost:8484/43a371ac-f72d-4e4f-824f-48d82b77915b.avif)

and in the `V8 Profiling` tab, we select the profiling option.

![](http://localhost:8484/4c4e1fd8-521b-4d46-9765-62032b9b7527.avif)

After selecting the green triangle, profiling starts.

![](http://localhost:8484/69644d36-ba44-4026-b579-442715c7f781.avif)

we will see the logs sorted by percentage share over execution time.

![](http://localhost:8484/b08006c7-6808-4c90-82e6-dca997d39d54.avif)

This view allows you to extract the most time-consuming functions relative to the total execution time. You can read more about profiling in the WebStorm documentation.

[V8 CPU and memory profiling | WebStorm](https://www.jetbrains.com/help/webstorm/v8-cpu-and-memory-profiling.html#ws_node_cpu_profiling)

A re-examination of the code and the log summary with the information that the amount of occupied spaces significantly reduces the script's performance indicate that the problem should be sought in the `shift` function.

```
const place = places.shift();
```

A thread on stack overflow was devoted to this

[Why is pop faster than shift?](https://stackoverflow.com/questions/6501160/why-is-pop-faster-than-shift)

Changing this one line

```
const place = places.shift();
```

on

```
const place = places.pop();
```

in Daniel's algorithm restores its correct pace of operation regardless of whether Marcin's code is executed or not

```
time node test.js 500000 100000
m: 1.449s
d: 233.327ms
1421226 1421226
node test.js 500000 100000  1.89s user 0.13s system 114% cpu 1.768 total
```

and

```
time node test.js 500000 100000
d: 238.217ms
node test.js 500000 100000  0.27s user 0.04s system 101% cpu 0.311 total
```

After a slight modification of the code written by `bhirt` on Slack Overflow:

```
let sum;
const tests = new Array(8).fill(null).map((e, i) => (i + 6) * 10000);

console.log(JSON.stringify(process.versions));

tests.forEach(function (count) {
  console.log('Testing arrays of size ' + count);
  let s1 = Date.now();
  let sArray = new Array(count);
  let pArray = new Array(count);
  for (let i = 0; i < count; i++) {
    const num = Math.floor(Math.random() * 6) + 1;
    sArray[i] = num;
    pArray[i] = num;
  }
  console.log(' -> ' + (Date.now() - s1) + 'ms: built arrays with ' + count + ' random elements');

  s1 = Date.now();
  sum = 0;
  while (pArray.length) {
    sum += pArray.pop();
  }
  console.log(
    ' -> ' + (Date.now() - s1) + 'ms: sum with pop() ' + count + ' elements, sum = ' + sum
  );

  s1 = Date.now();
  sum = 0;
  while (sArray.length) {
    sum += sArray.shift();
  }
  console.log(
    ' -> ' + (Date.now() - s1) + 'ms: sum with shift() ' + count + ' elements, sum = ' + sum
  );
});
```

we see that the latest version of `node` did not fix this issue

```
{"node":"15.8.0","v8":"8.6.395.17-node.23","uv":"1.40.0","zlib":"1.2.11","brotli":"1.0.9","ares":"1.17.1","modules":"88","nghttp2":"1.42.0","napi":"7","llhttp":"2.1.3","openssl":"1.1.1i","cldr":"38.1","icu":"68.2","tz":"2020d","unicode":"13.0"}
Testing arrays of size 60000
 -> 12ms: built arrays with 60000 random elements
 -> 5ms: sum with pop() 60000 elements, sum = 209556
 -> 1057ms: sum with shift() 60000 elements, sum = 209556
Testing arrays of size 70000
 -> 20ms: built arrays with 70000 random elements
 -> 1ms: sum with pop() 70000 elements, sum = 244919
 -> 1476ms: sum with shift() 70000 elements, sum = 244919
Testing arrays of size 80000
 -> 5ms: built arrays with 80000 random elements
 -> 0ms: sum with pop() 80000 elements, sum = 279502
 -> 1993ms: sum with shift() 80000 elements, sum = 279502
Testing arrays of size 90000
 -> 4ms: built arrays with 90000 random elements
 -> 0ms: sum with pop() 90000 elements, sum = 313487
 -> 2601ms: sum with shift() 90000 elements, sum = 313487
Testing arrays of size 100000
 -> 4ms: built arrays with 100000 random elements
 -> 1ms: sum with pop() 100000 elements, sum = 350059
 -> 3263ms: sum with shift() 100000 elements, sum = 350059
Testing arrays of size 110000
 -> 8ms: built arrays with 110000 random elements
 -> 1ms: sum with pop() 110000 elements, sum = 384719
 -> 4154ms: sum with shift() 110000 elements, sum = 384719
Testing arrays of size 120000
 -> 7ms: built arrays with 120000 random elements
 -> 0ms: sum with pop() 120000 elements, sum = 419326
 -> 5027ms: sum with shift() 120000 elements, sum = 419326
Testing arrays of size 130000
 -> 8ms: built arrays with 130000 random elements
 -> 0ms: sum with pop() 130000 elements, sum = 454068
 -> 5702ms: sum with shift() 130000 elements, sum = 454068
```

In the browser, these operations take half as long, but the difference between `pop` and `shift` is still huge, and every 50-100 elements added to the array adds a millisecond to the execution time of `shift`.

![](http://localhost:8484/fd115ab8-9eea-4e2f-8cf4-d99d46f3080a.avif)

By modifying this code for testing a second time, we can obtain a version that works well in the browser and allows for generating data to draw a chart:

```
var sum;
var res = [];
var tests = new Array(20).fill(null).map((e, i) => (i + 1) * 10000);

tests.forEach(function (count) {
  console.log('Testing arrays of size ' + count);
  let s1 = Date.now();
  let sArray = new Array(count);
  let pArray = new Array(count);
  for (let i = 0; i < count; i++) {
    const num = Math.floor(Math.random() * 6) + 1;
    sArray[i] = num;
    pArray[i] = num;
  }
  console.log(' -> ' + (Date.now() - s1) + 'ms: built arrays with ' + count + ' random elements');

  s1 = Date.now();
  sum = 0;
  while (pArray.length) {
    sum += pArray.pop();
  }
  console.log(
    ' -> ' + (Date.now() - s1) + 'ms: sum with pop() ' + count + ' elements, sum = ' + sum
  );

  s1 = Date.now();
  sum = 0;
  while (sArray.length) {
    sum += sArray.shift();
  }
  res.push([count, Date.now() - s1]);
  console.log(
    ' -> ' + (Date.now() - s1) + 'ms: sum with shift() ' + count + ' elements, sum = ' + sum
  );
});
```

We will generate a chart showing the dependence of time on the array length in `chart.js`

```
let res = [[10000,3],[20000,3],[30000,4],[40000,193],[50000,304],[60000,450],[70000,625],[80000,859],[90000,1081],[100000,1419],[110000,1704],[120000,2040],[130000,2466],[140000,2936],[150000,3429],[160000,3948],[170000,4509],[180000,5158],[190000,5852],[200000,6450]];

const labels = res.map(r => r[0]);
const data = {
  labels: labels,
  datasets: [{
    label: 'Time [ms] of sum of rarray computed with shift method vs array length',
    backgroundColor: 'rgb(255, 99, 132)',
    borderColor: 'rgb(255, 99, 132)',
    data: res.map(r => r[1]),
  }]
};
```

![](http://localhost:8484/619da3bc-ba97-4390-b8cd-65344f86db03.avif)

## Re-evaluation of solutions

Originally, Marcin wrote better code than I did. The `shift` mishap ruined all the performance gains from the concept of operating on slots instead of individual places. However, if we allow the replacement of `shift` with `pop` in my code (Daniel's), it turns out to be ultimately several to dozens of times faster than Marcin's code.

The modified file `test.js` is responsible for comparing the results.

```javascript
const d = require('./d');
const m = require('./m');
const generatePlaces = require('./generatePlaces');
const res = [];

function log(res) {
  console.log('Daniel Results');
  console.table(res.map(r => r.map(r => r.d)));
  console.log('Marcin Results');
  console.table(res.map(r => r.map(r => r.m)));
  console.log('Rations Marcin Time to Daniel Time');
  console.table(res.map(r => r.map(r => r.r)));
}

const start = new Date().getTime();

for (let N = 250000; N < 1000000; N += 250000) {
  res[N] = [];
  for (let M = 10000; M < 150000; M += 10000) {
    const params = [N, generatePlaces(N, M)];

    const sm = new Date().getTime();
    m.solution(...params);
    const em = new Date().getTime();

    const sd = new Date().getTime();
    d.solution(...params);
    const ed = new Date().getTime();
    res[N][M] = {
      d: ed - sd,
      m: em - sm,
      r: Math.round((100 * (em - sm)) / (ed - sd)) / 100
    };

    const now = new Date().getTime();
    console.log(now - start);
    log(res);
  }
}
```

The results present time in milliseconds. These are the times of Daniel, Marcin, and the ratios of Marcin's time to Daniel's. The columns show the number of occupied seats, and the rows show the number of rows in the plane.

![](http://localhost:8484/0497009b-a592-4043-8759-fc5d86f31cf6.avif)
