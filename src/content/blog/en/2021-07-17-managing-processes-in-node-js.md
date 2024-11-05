---
author: Daniel Gustaw
canonicalName: managing-processes-in-node-js
coverImage: http://localhost:8484/d8bce439-7a26-4a7d-aef8-4308277995db.avif
description: Learn how to create and kill child processes in Node JS, dynamically manage their quantity, and conduct bidirectional communication with them.
excerpt: Learn how to create and kill child processes in Node JS, dynamically manage their quantity, and conduct bidirectional communication with them.
publishDate: 2021-07-17 13:53:19+00:00
slug: en/cpu-load-control-in-node-js
tags:
- nodejs
- cpu
title: Process Control in Node JS
updateDate: 2021-07-17 13:57:27+00:00
---

In this post, we will learn how to create and terminate `subprocesses` in Node JS and how to pass data between them.

If the program performs heavy computations but is not parallelized, the state of your processor may look like this:

![](http://localhost:8484/3b1ed569-b0e0-490f-81a6-df3454db4788.avif)

Therefore, it is worth delving into this topic regardless of the language you are writing in.

The article will be divided into 3 parts:

* controlling the process using `readline`
* creating and killing subprocesses
* communication between processes

In the first two, we will write a script to simulate the load on the processor cores. In the last one, we will parallelize a brute-force attack on a password.

At the end, we will analyze the scalability of the program we wrote.

## Controlling the process with `readline`

We want to write a program in which pressing a key on the keyboard will set how many processor cores should be loaded. We will start by capturing keyboard events in real-time.

The `readline` module will allow us to do this, providing an interface for reading and writing data from streams like the keyboard - `process.stdin`.

We will start by importing this module.

```javascript
const readline = require('readline');
```

Next, we set up the event emission from `readline` on a key press using the command

```javascript
readline.emitKeypressEvents(process.stdin);
```

The `readline` can work with different streams. With this line, we indicate that it should listen to the keyboard. We immediately set the mode to `raw`.

```javascript
process.stdin.setRawMode(true);
```

This allows reading from the keyboard character by character with separately toggled modifiers like ctrl or shift. At the same time, this mode forces the manual handling of the process termination via `ctrl+c`. More about stream modes and connecting the terminal to a process can be found in the documentation:

[Readline | Node.js v16.5.0 Documentation | Node.js v16.5.0 Documentation](https://nodejs.org/api/readline.html#readline_readline_emitkeypressevents_stream_interface)

[TTY | Node.js v16.5.0 Documentation | Node.js v16.5.0 Documentation](https://nodejs.org/api/tty.html#tty_readstream_setrawmode_mode)

Meanwhile, in our program, the following lines will handle the reading of characters:

```javascript
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit();
    } else {
        console.log('typed char', key.name);
    }
});
```

The sign written in `key` is an object with the following keys

```json lines
{ sequence: 'v', name: 'v', ctrl: false, meta: false, shift: false }
```

In the presented code, we handle the closure of the process with the combination `ctrl+c` and printing to the console the character selected on the keyboard. Typing subsequent characters will show them in the terminal each time.

![](http://localhost:8484/ed2de3c0-579d-4be5-b2ae-57c87cc4e1d8.avif)

The next step is to replace printing characters with creating or killing processes that load the processor.

## Creating and Killing Processes in Node JS

In Node JS, we can very easily create subprocesses and manage them. To manage subprocesses, we can use the `child_process` module. We import it just like the previous module.

```
const cp = require('child_process');
```

Next, we create an array where we will store references to the processes being created.

```
const forks = [];
```

If we forgot about them when closing the program, they would become `zombie` processes - that is, ones that still live and consume computer resources without supervision.

![](http://localhost:8484/b76d2cab-977e-458c-bf42-027fe76d3234.avif)

To remove them, before closing our script, we write the code:

```javascript
    if (key.ctrl && key.name === 'c') {
        while (forks.length > 0) {
            forks[forks.length - 1].kill()
            forks.pop()
        }
        process.exit();
    } else {
```

In the case of selecting buttons other than `c` while pressing `ctrl`, we will read the numeric value of that button and based on it, we will add or kill the appropriate number of processes so that their count equals that number.

```javascript
        if (!Number.isNaN(parseInt(key.name,32))) {
            const req = parseInt(key.name,32);

            if (forks.length < req) {
                while (forks.length < req) {
                    const n = cp.fork(`${__dirname}/bomb.js`);
                    forks.push(n)
                }
            }

            if (forks.length > req) {
                while (forks.length > req) {
                    forks[forks.length - 1].kill()
                    forks.pop()
                }
            }

            console.log('processes PIDs', forks.map(f => f.pid));

        }
```

One might be surprised by the choice of the numerical system `32`. However, it is a convenient system if we assume that with one key we want to indicate a small number that exceeds 10.

The variable `req` receives the required number of processes, and thanks to `cp.fork` or `kill`, we create and terminate the missing or excess processes.

All we need to complete the whole is the content of the file `bomb.js`. There could be any operations consuming computational power. In our case, it is

```javascript
let result = 0;
while (true) {
    result += Math.random() * Math.random();
}
```

meaning that the code is written only to simulate load.

Upon starting the program and selecting a few load options, we see how processes are created and terminated. Thanks to `htop`, we can observe how CPU usage changes during this time.

![](http://localhost:8484/a089f093-d5f3-443b-ab10-728a38ca6a6b.avif)

An even nicer interface for monitoring the processor is provided by `bashtop`, as it also displays historical usage. In the screenshot below, we can see how by modifying the number of processes in our program, I was able to simulate various levels of CPU load with tasks.

![](http://localhost:8484/47bf0bb1-95cc-46b4-9d29-237b504b6a29.avif)

And what the core usage looked like when I selected the option to create 16 processes.

![](http://localhost:8484/05911406-d43c-4316-b265-9202b0042ea1.avif)

We can use this program to simulate load. In the `bomb.js` file, we can replace random number generation with sending http requests or consuming other resources, such as RAM or disk.

## Parallel brute-force attack on a password

Various methods have been used historically for password hashing. Currently, the most popular is `bcrypt`, but a more modern contender is `argon2i`, which also has a strong position. To simplify, the difference between them is that breaking bcrypt requires a lot of computational power, whereas argon can be configured to require a large amount of RAM. In the first case, we can easily acquire computational power in very large quantities, additionally, our password-cracking capabilities are enhanced by graphics cards and stream processors. However, when cracking argon, it is much harder to gather the necessary amounts of RAM on a single machine. My very brief description is worth expanding with the reading of the article:

[Password Hashing: PBKDF2, Scrypt, Bcrypt and ARGON2](https://medium.com/analytics-vidhya/password-hashing-pbkdf2-scrypt-bcrypt-and-argon2-e25aaf41598e)

In the subsequent part of the entry, we will show how using multiple cores speeds up cracking a password hashed with the `bcrypt` algorithm.

We will write code to generate a password hash, crack it using one core, and then write the same code using subprocesses that we will assign to check successive phrases.

### Generating a password hash using bcrypt

The installation of the `bcrypt` package is required for this:

```
npm init -y && npm i bcrypt
```

We will generate the password using the `generate_hash.js` script, which takes an argument that is the password and saves its hash to the `.pass` file.

```javascript
const fs = require('fs')
const bc = require('bcrypt')

const main = async () => {
    return bc.hash(process.argv[2] || 'pass', 11)
}

main().then(p => {
    fs.writeFileSync(`${__dirname}/.pass`, p);
    console.log(p)
}).catch(console.error);
```

### Brute force password cracking in a single thread

In a brute-force attack, the key is the character set on which we will base the sequences we will check. We will use the standard alphabet from `a` to `z`. We will generate sequences of characters to check by combining them with each other. The process of their generation and processing can be placed in a recursive function, but by doing so, we lose the chance for convenient control over the order. Instead, we will use a simple queue held in memory. It will not be unloaded, as unloading it from the front would change the indexing within the queue. I have already described how detrimental this can be for performance in the article:

> How many families can fit in an airplane - an algorithmic problem

We compare two solutions to the problem of counting free adjacent seat sets. You will learn how to use Profiling and how significant a difference it makes to use pop and shift on arrays in js.

![](http://localhost:8484/e4679649-0445-42f4-9890-f45307625bd6.avif)

Instead of unloading the queue, we will read values from it using a variable index that will move along it. The flowchart of the program we will write is as follows:

![](http://localhost:8484/50ac21aa-497e-4dca-8292-d672a9cd5198.avif)

Its code is:

```javascript
const fs = require('fs');
const bc = require('bcrypt');
const alphabet = String.fromCharCode(...Array(123).keys()).slice(97);
const hash = fs.readFileSync(`${__dirname}/.pass`).toString()
const chalk = require('chalk')

let i = 0;
const s = new Date().getTime();
const n = () => new Date().getTime() - s;
let found = false;

const que = [];

async function check(input) {
  if (found) return;
  const r = await bc.compare(input, hash)

  console.log(`${i}\t${input}\t${n()}\t${r}\t${que.length}`)
  if (r) {
    console.log(chalk.green(`FOUND: "${input}"`))
    found = true;
    process.exit();
  }
  for (let n of alphabet) {
    que.push(input + n);
  }
}

async function processQue() {
  const phrase = que[i++]
  await check(phrase)
}

const main = async () => {
  while (!found) {
    await processQue()
  }
}

console.log(`i\tinput\tn()\tr\tque.length`)
check('').then(() => main()).catch(console.error)
```

The `chalk` package is required for the actions, which allows for easy coloring of text:

```
npm i chalk
```

Let's test our program.

First, we will generate a password. We will choose "ac" because it is simple and we will break it quickly.

```
node generate_hash.js ac
```

Next, we launch our program and see how it sequentially checks the passwords from the queue.

```
time node force-single.js
```

![](http://localhost:8484/72cbd407-9321-4ca7-b7e9-b57a8911bad8.avif)

In the columns we have the index, the sequence being checked, the time since the program was started in milliseconds, information about whether the password matches the hash, and the current length of the queue.

If you are worried that the queue is growing too quickly and wasting a lot of power, we can see how the program will behave after replacing the line.

```
const r = await bc.compare(input, hash)
```

by

```
const r = i >= 29 // await bc.compare(input, hash)
```

It will turn out that the execution time of the script will drop from 7.27 seconds to 0.17 seconds.

```
node force-single.js  0.17s user 0.03s system 103% cpu 0.188 total
```

What does it mean that only 2.3% of the computational power is allocated to operations other than password comparisons?

### Using Subprocesses to Improve Performance

Since checking password and hash compatibility is a CPU-intensive operation, we expect a significant increase in the performance of this task if we use multiple cores simultaneously. For this reason, we will rewrite our program so that the main process handles the queue and assigns the checking task to subprocesses instead of performing password checks itself.

![](http://localhost:8484/cffe8d53-af1d-41cc-afd9-9559222f20c6.avif)

The diagram of our program is divided into the main process and subprocesses. In the main process, a list of child processes, a queue, and listeners for messages from subprocesses are created. In the end, each subprocess is assigned a task from the queue to execute. After completion, subprocesses report back to the main thread with the response, which increments the index and assigns new tasks to them. This continues until the correct password is found.

![](http://localhost:8484/9f6ce1ed-a710-42bb-890e-1def30a24127.avif)

It is worth noting that independent children will execute tasks at different speeds, which will affect the order of response reporting. An example output of the program is:

![](http://localhost:8484/ba051803-3c65-464d-8441-1368270ef48e.avif)

The code is divided into two files:

* force-child.js - main process using child processes
* force-fork.js - subprocess for checking passwords with bcrypt

We will start analyzing the main process - `force-child.js`. The program begins by defining the alphabet and auxiliary variables for indexing and counting time.

```
const cp = require('child_process');
const fs = require('fs');
const chalk = require('chalk')

const alphabet = String.fromCharCode(...Array(123).keys()).slice(97);
const forks = [];

let i = 0;
const s = new Date().getTime();
const n = () => new Date().getTime() - s;
let found = false;
```

Next, we fill the queue with the alphabet.

```
const que = alphabet.split('');
```

The `check` function in the single-threaded version of the program received a phrase, checked it, and expanded the queue. This time, in addition to the phrase, the argument will be the subprocess chosen to perform the check - `f`. Instead of using `bcrypt` directly, we will send a request for the subprocess to process the phrase and expand the queue.

```
function check(input, f) {
    if (found) return;

    f.send(input);

    for (let n of alphabet) {
        que.push(input + n);
    }
}
```

We removed the word `async` here, which means we don't have to wait for the execution of this function. It is a simple delegation of the task. A key element of this code is sending a message to the subprocess carried out by the `send` function executed directly on the subprocess.

The next function `processQue` is used to perform a single tick on the queue.

```
function processQue(f) {
    const phrase = que[i++]
    check(phrase, f)
}
```

It is very short and its main task is to prevent the duplication of logic responsible for iterating through the queue.

The main function of the program is `main` and is responsible for setting up listeners for responses from subprocesses and assigning them initial tasks that allow them to enter the communication loop between them.

```javascript
const main = async () => {
  forks.forEach(f => {
    f.on('message', ({input, r}) => {
      console.log(`${i}\t${input}\t${n()}\t${r}\t${que.length}\t${f.pid}`)

      if (r) {
        console.log(chalk.green(`FOUND: "${input}"`))
        found = true;

        fs.appendFileSync('logs.txt', `${forks.length},${n()}\n`)

        while (forks.length > 0) {
          forks[forks.length - 1].kill()
          forks.pop()
        }

        process.exit();
      } else {
        processQue(f);
      }
    });
    processQue(f);
  })
}
```

Before we call the `main` function, it is necessary to spawn the processes in the `forks` array:

```javascript
while (forks.length < (process.argv[2] || 15)) {
  const n = cp.fork(`${__dirname}/force-fork.js`);
  forks.push(n)
}
```

The recommended number is a value close to the number of processor threads but less than it, so that the main process is not blocked.

At the end, we print information about the program, the column names, and start the `main` function.

```javascript
console.log(chalk.blue(`Run using ${forks.length} child processes`))
console.log(`i\tinput\tn()\tr\tque.length\tpid`)
main().catch(console.error)
```

The second file - `force-fork.js` is much simpler and only contains reading the `hash` and waiting for tasks. When it receives them, it checks the tested password using `bcrypt`, and then sends the result back through the same communication channel.

```javascript
const fs = require('fs');
const bc = require('bcrypt');

const hash = fs.readFileSync(`${__dirname}/.pass`).toString()

process.on('message', (input) => {
  bc.compare(input, hash).then((r) => {
    process.send({r, input});
  })
});
```

## Scalability Analysis

The observant reader has probably noticed an inconspicuous, but important line of code for the further part of the article:

```javascript
fs.appendFileSync('logs.txt', `${forks.length},${n()}\n`)
```

It is performed after finding the password and attaches the number of subprocesses and the time taken to find the password to the file `logs.txt`. The data for this file was provided by executing a double loop in `bash`.

```
for j in $(seq 1 20); do for i in $(seq 1 25); do time node force-child.js $i; sleep 4; done; done;
```

And later expanding these results with a higher number of processes.

```
for j in $(seq 1 5); do for i in $(seq 1 50); do time node force-child.js $i; sleep 4; done; done;
```

According to the General Law of Scaling, we expect performance to increase up to a certain point (around 15 cores) and then decline due to delays caused by mutual blocking of subprocesses.

### Universal Law of Scaling

If you haven't heard of the universal law of scaling, let me quickly introduce you to the topic. It suggests that in an ideal world, if systems were linearly scalable, it would mean that adding `n` times more resources would increase the performance or throughput of the system by `n` times. This situation can be illustrated by the picture:

![](http://localhost:8484/b551739b-a90e-4e7d-b275-9cbf067b2c02.avif)

However, such situations are not found in the real world. There is always some inefficiency associated with allocating data to nodes (servers or threads) and gathering them. The delays related to allocating and receiving data are called serialization, and sometimes you may encounter the term `contention`:

![](http://localhost:8484/3f245c79-a00f-42ed-9050-209d5a69e8d9.avif)

Taking this phenomenon into account leads to Amdahl's model. However, it turns out that it is insufficient for most IT systems because it completely ignores the second main factor limiting scaling - communication between processes - `crosstalk`. This can be graphically represented as follows:

![](http://localhost:8484/a3003513-1d18-4386-85cf-e6d83bdc3581.avif)

While serialization has a cost proportional to the number of nodes, communication is proportional to the square of their number - just like the number of diagonals of a polygon to the number of angles.

![](http://localhost:8484/0a680f83-94b6-4398-aeda-28b4186f3e8b.avif)

In the graph, we see curves comparing the impact of the number of nodes on performance in the system according to these three models.

![](http://localhost:8484/6ddf6ca7-c25e-473a-bceb-d4d4a19506d0.avif)

A good (50-page) study on this topic can be found at the link:

[https://cdn2.hubspot.net/hubfs/498921/eBooks/scalability\_new.pdf](https://cdn2.hubspot.net/hubfs/498921/eBooks/scalability_new.pdf)

### Summary of measurement data with the USL model

The collected data are the amounts of threads and the execution times of the program. We load the program into `Mathematica` with the command:

```
load = Import["/home/daniel/exp/node/logs.txt", "Data"];
```

Since we want to consider performance and not execution time, we reverse the second column with the command.

```
loadEff = {#[[1]], 1/#[[2]]} & /@ load;
```

The most sensible unit is normalization with respect to execution time for a single subprocess. This will allow us to see the gain from adding additional processes. We calculate the average of these times using the command

```
firstMean = GroupBy[loadEff // N, First -> Last, Mean][[1]];
```

Next, we fit the model:

```
nlm = NonlinearModelFit[{#[[1]], #[[2]]/firstMean} & /@
   loadEff, \[Lambda] n/(1 + \[Sigma] (n - 1) + \[Kappa] n (n -
         1)), {{\[Lambda], 0.9}, {\[Sigma], 0.9}, {\[Kappa],
    0.1}}, {n}]
```

And we compare it with the chart of the measurement points list.

```
Show[ListPlot[{#[[1]], #[[2]]/firstMean} & /@ loadEff],
 Plot[nlm[s], {s, 0, 50}, PlotStyle -> Orange, PlotRange -> All],
 AxesLabel -> {"processes", "gain of efficiency"}, ImageSize -> Large,
  PlotLabel -> "Gain of efficiency relative to single process"]
```

![](http://localhost:8484/ae266323-acb4-4792-a077-286260383b11.avif)

It is worth showing a very nice formula for the theoretical maximum.

```
Solve[D[\[Lambda] n/(1 + \[Sigma] (n - 1) + \[Kappa] n (n - 1)),
   n] == 0, n]
```

![](http://localhost:8484/5eeff6fb-5759-4d91-b8bf-7a9684533bf7.avif)

Calculated numerically

```
NSolve[D[Normal[nlm], n] == 0, n]
```

the optimal number of processes is `14.8271`. A few paragraphs earlier, I wrote that it is recommended to have a value slightly lower than the number of available threads - I had 16.

## Processes, Workers and Clusters in Node JS

This article focused on the processes described in the documentation at the link

[Process | Node.js v16.5.0 Documentation | Node.js v16.5.0 Documentation](https://nodejs.org/api/process.html)

We showed how to create subprocesses, kill them. How to dynamically manage the number of subprocesses and maintain bidirectional communication with them. In the end, we compared the scalability of password cracking using the brute force method with predictions of the universal scaling law.

However, we only touched on this topic slightly. I did not write anything about clusters described here:

[Cluster | Node.js v16.5.0 Documentation | Node.js v16.5.0 Documentation](https://nodejs.org/api/cluster.html)

Or workers, which also have a separate section in the documentation

[Worker threads | Node.js v16.5.0 Documentation | Node.js v16.5.0 Documentation](https://nodejs.org/api/worker_threads.html)

I encourage you to read the `Node JS` documentation on your own and design your own experiments.
