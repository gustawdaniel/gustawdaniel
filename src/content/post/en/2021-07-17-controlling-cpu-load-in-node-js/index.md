---
title: Managing processes in Node JS.
slug: managing-processes-in-node-js
publishDate: 2023-04-05T09:44:19.000Z
date_updated: 2023-04-05T09:44:58.000Z
draft: true
excerpt: Learn how to create and terminate subprocesses in Node.js, dynamically manage their quantity, and establish bidirectional communication with them.
---

In this post, we will learn how to create and terminate subprocesses in Node.js, and how to transmit data between them.

If a program is performing heavy computations but is not parallelized, the state of your processor may look like this:

![](https://gustawdaniel.com/content/images/2021/07/cpu0-12.png)

That's why it's worth delving into this topic regardless of the language you're writing in.

The article will be divided into 3 parts:

In the first two, we will write a script to simulate CPU core load. In the last one, we will parallelize a brute force attack on a password.

At the end, we will analyze the scalability of the written program.

## Process control with readline

We want to create a program in which by pressing a key on the keyboard, we can set the number of CPU cores to be utilized. We will start by capturing keyboard events in real time.

We will be able to do this thanks to the readline module, which provides an interface for reading and writing data from streams such as the keyboard (process.stdin).

We will start with importing this module.

```
const readline = require('readline');
```

Next, we set up the readline event to trigger upon pressing a button on the keyboard using the command.

```
readline.emitKeypressEvents(process.stdin);
```

The readline function can work with various streams. This line instructs it to listen to the keyboard. We immediately set the mode to raw.

```
process.stdin.setRawMode(true);
```

This allows reading character by character from the keyboard with separately attached modifiers such as Ctrl or Shift. At the same time, this mode forces independent handling of the process shutdown by Ctrl+C. More information about stream modes and connecting a terminal to a process can be found in the documentation.

Meanwhile, in our program, the next lines will allow us to handle character reading:

```
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit();
    } else {
        console.log('typed char', key.name);
    }
});
```

The symbol saved in key is an object with the following keys.

```
{ sequence: 'v', name: 'v', ctrl: false, meta: false, shift: false }
```

In the presented code, we handle the closing of the process with the ctrl+c combination and printing the chosen keyboard character to the console. Typing in successive characters will always show them in the terminal.

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-16-18-15-24.png)

The next step is to replace typing in characters with creating or deleting processor-intensive processes.

## Creating and terminating processes in Node JS

In Node JS, we can easily create subprocesses and manage them using the child\_process module. We import it just like the previous module to manage subprocesses.

```
const cp = require('child_process');
```

Next, we create an array to which we will be saving references to the processes that are being created.

```
const forks = [];
```

If we forgot about them when closing the program, they would become zombie processes - that is, ones that continue to live and consume computer resources without supervision.

![](https://gustawdaniel.com/content/images/2021/07/one-does-not-simply-kill-a-zombie-process.jpg)

To remove them before closing our script, we write the code:

```
if (key.ctrl && key.name === 'c') {
        while (forks.length > 0) {
            forks[forks.length - 1].kill()
            forks.pop()
        }
        process.exit();
    } else {
```

If other buttons are chosen besides 'c' in the presence of 'ctrl', we will read the numerical value of that button and, based on that value, add or kill the appropriate number of processes to make their number equal to that value.

```
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

The choice of the base-32 numbering system may seem surprising. However, it is a convenient system if we assume that we want to indicate a number slightly exceeding 10 using only one key.

The required number of processes is assigned to the variable req, and using cp.fork or kill we create and terminate any missing or excess processes.

We only need the contents of the bomb.js file to complete the whole. It could contain any operations that consume computing power. In our case, it is missing.

```
let result = 0;
while (true) {
    result += Math.random() * Math.random();
}
```

This means code written only to simulate load.

After launching the program and selecting several load options, we can see how processes are being created and deleted. Thanks to htop, we can observe how CPU usage changes during this time.

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-16-18-51-17.png)

BashTop has an even nicer interface for monitoring your processor, as it also displays historical usage. In the screenshot below, we can see how by modifying the number of processes in our program, I was able to simulate different levels of processor load with tasks.

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-16-15-26-13.png)

And what was the utilization of the cores like when I selected the option to create 16 processes?

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-16-15-30-03.png)

We can use this program to simulate load testing. In the bomb.js file, we can replace random number generation with operations such as sending HTTP requests or consuming other resources, such as RAM or disk space.

## Parallel brute-force attack on password

Different methods have been used throughout history to hash passwords. Currently, the most popular method is bcrypt, but a newer and more advanced method, argon2i, also holds a strong position. Simplifying the difference between the two, breaking bcrypt requires significant computational power, while argon can be configured to require a large amount of operational memory. With the former, it is easy to purchase large amounts of computational power, and graphics cards and streaming processors can additionally increase our password cracking capabilities. However, breaking argon requires a much greater effort to accumulate the necessary amount of operational memory on a single machine. It is worth noting that this brief overview could be expanded by reading the full article.

![](https://miro.medium.com/fit/c/152/152/1*sHhtYhaCe2Uc3IU0IgKwIQ.png)

In the following part of the post, we will show how using multiple cores speeds up the breaking of a password hashed with the bcrypt algorithm.

We will write code for generating password hash, crack it using a single core, and then we will write the same code utilizing sub-processes, to delegate the task of checking subsequent phrases.

### Generating password hash using bcrypt

Installation of the bcrypt package is required for this.

```
npm init -y && npm i bcrypt
```

We will generate a password using the generate\_hash.js script, which takes a password argument and writes its hash to the .pass file.

```
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

### Breaking a password with the brute force method in a single thread

In a brute-force attack, the key is the set of characters that we use to iterate over the sequences that we will check. We will use the standard alphabet from a to z and repeatedly generate sequences of characters to check. The process of generating and processing these sequences can be implemented using a recursive function, but this would make it difficult to control the order in which they are generated. Instead, we will use a simple queue stored in memory. This queue will not be emptied, as emptying it from the front would change the indexing within the queue, which could negatively affect performance as already discussed in the article.

![](https://gustawdaniel.com/favicon.ico)

Instead of emptying the queue, we will read values from it using a variable index that will move along it. The flowchart of the program we will write is as follows:

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-17-13-44-09.png)

His code is:

```
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

The chalk package is required for the operation, which allows for easy text coloring.

```
npm i chalk
```

Let's test our program.

At first, we will generate a password. We'll choose "ac" because it's simple and we'll break it quickly.

```
node generate_hash.js ac
```

Next, we start our program and see how it sequentially checks passwords from the queue.

```
time node force-single.js
```

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-17-13-48-47.png)

In the columns, we have the index, the sequence being checked, the time elapsed in milliseconds since the program started, the information on whether the password matches the hash, and the current length of the queue.

If you are concerned that the queue is growing too quickly and wasting a lot of power, we can see how the program behaves after replacing the line.

```
const r = await bc.compare(input, hash)
```

"Aby uzyskać najlepszy efekt, należy stosować ten produkt regularnie, zwykle dwa razy dziennie po umyciu twarzy. Nałożyć na skórę delikatnie, unikając okolic wokół oczu." "To achieve the best effect, it is recommended to use this product regularly, typically twice daily after washing your face. Apply gently onto the skin, avoiding the eye area."

```
const r = i >= 29 // await bc.compare(input, hash)
```

It will turn out that the script execution time will decrease from 7.27 seconds to 0.17 seconds.

```
node force-single.js  0.17s user 0.03s system 103% cpu 0.188 total
```

"What it means is that only 2.3% of computing power is being allocated to operations other than just comparing passwords."

### Using sub-processes to increase efficiency

Because checking the compatibility of a password and a hash is a processor-intensive operation, we expect a significant improvement in performance for this task if we use multiple cores simultaneously. Therefore, we will rewrite our program so that the main process handles the queue and assigns the task of checking passwords to subordinate processes.

![](https://gustawdaniel.com/content/images/2021/07/bFbMbDgAT6M6T4zsVmk16Oiip7vIOWaeuEY0vTkkZoU.png)

Our program structure is divided into a main thread and sub processes. In the main thread, a list of sub processes, a queue, and a listener for messages from sub processes are created. Ultimately, each sub process is assigned a task from the queue to execute. After executing a task, a sub process reports back to the main thread with a response. The main thread then increments the index and assigns the sub process a new task. This process continues until a correct password is found.

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-17-14-16-35.png)

It is worth noting that independent children will complete tasks at different speeds, which will affect the order of their response submissions. An exemplary output of the program is:

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-17-14-26-11.png)

The code is divided into two files:

We will begin the analysis of the main process - force-child.js. The program starts by defining the alphabet and auxiliary variables for indexing and counting time.

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

In the single-threaded version of the program, the check function received a phrase, checked it, and expanded the queue. This time, in addition to the phrase, the argument for the selected subprocess to perform the check will be "f". Instead of using bcrypt directly, we will send a request to the subprocess to process the phrase and expand the queue.

```
function check(input, f) {
    if (found) return;

    f.send(input);

    for (let n of alphabet) {
        que.push(input + n);
    }
}
```

We have eliminated the word "async" here, so we do not have to wait for the execution of this function. This is a simple task delegation. The key element of this code is sending a message to the subprocess, which is done by the "send" function directly on the subprocess.

The next function, processQue, serves us to perform a single clock cycle on the queue.

```
function processQue(f) {
    const phrase = que[i++]
    check(phrase, f)
}
```

It is very short and its main task is to prevent duplication of the logic responsible for iterating through the queue.

The main function is the program's primary function responsible for setting up listeners for responses from subprocesses and assigning them initial tasks that allow them to enter a loop of communication between them.

```
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

Before we call the main function, it is necessary to create processes in the forks array.

```
while (forks.length < (process.argv[2] || 15)) {
    const n = cp.fork(`${__dirname}/force-fork.js`);
    forks.push(n)
}
```

The recommended number of them is a value close to the number of processor threads but smaller than it, so that the main process is not blocked.

At the end, we print information about the program, column names, and start the main function.

```
console.log(chalk.blue(`Run using ${forks.length} child processes`))
console.log(`i\tinput\tn()\tr\tque.length\tpid`)
main().catch(console.error)
```

The second file - force-fork.js is much simpler and contains only reading the hash and waiting for tasks. When it receives them, it tests the hashed password using bcrypt and then sends the result back through the same communication channel.

```
const fs = require('fs');
const bc = require('bcrypt');

const hash = fs.readFileSync(`${__dirname}/.pass`).toString()

process.on('message', (input) => {
    bc.compare(input, hash).then((r) => {
        process.send({r, input});
    })
});
```

## Scalability

An attentive reader probably noticed a small but important line of code for the rest of the article:

```
fs.appendFileSync('logs.txt', `${forks.length},${n()}\n`)
```

It is performed after finding the password and it attaches the number of sub-processes and the time of finding the password to the logs.txt file. The data for this file was provided by executing a double loop in bash.

```
for j in $(seq 1 20); do for i in $(seq 1 25); do time node force-child.js $i; sleep 4; done; done;
```

And later expanding these results to a higher number of processes.

```
for j in $(seq 1 5); do for i in $(seq 1 50); do time node force-child.js $i; sleep 4; done; done;
```

According to the General Law of Scaling, we expect a performance increase up to a certain point (around 15 cores), followed by a decrease due to delays caused by mutual blocking of sub-processes.

### Universal law of scaling

If you haven't heard of the universal scaling law, I will introduce you to the topic quickly. It means that in an ideal world, if systems were linearly scalable, adding n times more resources would increase the system's performance or throughput by n times. This situation can be illustrated by the diagram:

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-17-14-56-29.png)

However, such situations are not encountered in the real world. There is always some inefficiency associated with assigning data to nodes (servers or threads) and collecting them. Delays related to data assignment and retrieval are called serialization. Sometimes the term contention is used.

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-17-14-56-40.png)

Taking this phenomenon into account leads to the Amdahl's Model. However, it turns out that it is insufficient for most IT systems because it completely overlooks the second major factor limiting scaling - inter-process communication, or crosstalk. It can be graphically represented as follows:

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-17-14-56-46.png)

If serialization has a cost proportional to the number of nodes, then communication is proportional to their square - just like the number of diagonals of a polygon is proportional to the number of its angles.

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-17-14-56-51.png)

On the graph, we can see curves comparing the impact of the number of nodes on system performance according to these three models.

![](https://gustawdaniel.com/content/images/2021/07/usl.svg)

A good (50-page) study on this topic can be found at the link:

Please find the translation below: https://cdn2.hubspot.net/hubfs/498921/eBooks/scalability\_new.pdf

### Compilation of measurement data with the USL model

The collected data consists of the number of threads and execution times of the program. We load it into the Mathematica program using the command:

```
load = Import["/home/daniel/exp/node/logs.txt", "Data"];
```

Because we want to consider efficiency rather than time, we reverse the second column with the command.

```
loadEff = {#[[1]], 1/#[[2]]} & /@ load;
```

"The most sensible unit is normalization with respect to the execution time for one subprocess. This will allow us to see the gain from adding additional processes. We calculate the average of these times using the command."

```
firstMean = GroupBy[loadEff // N, First -> Last, Mean][[1]];
```

Next, we adjust the model:

```
nlm = NonlinearModelFit[{#[[1]], #[[2]]/firstMean} & /@
   loadEff, \[Lambda] n/(1 + \[Sigma] (n - 1) + \[Kappa] n (n -
         1)), {{\[Lambda], 0.9}, {\[Sigma], 0.9}, {\[Kappa],
    0.1}}, {n}]
```

And we compare it with a graph of the list of measurement points.

```
Show[ListPlot[{#[[1]], #[[2]]/firstMean} & /@ loadEff],
 Plot[nlm[s], {s, 0, 50}, PlotStyle -> Orange, PlotRange -> All],
 AxesLabel -> {"processes", "gain of efficiency"}, ImageSize -> Large,
  PlotLabel -> "Gain of efficiency relative to single process"]
```

![](https://gustawdaniel.com/content/images/2021/07/gain-eff.svg)

It is worth showing a very nice example of theoretical maximum here.

```
Solve[D[\[Lambda] n/(1 + \[Sigma] (n - 1) + \[Kappa] n (n - 1)),
   n] == 0, n]
```

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-17-15-21-22.png)

Numerically calculated.

```
NSolve[D[Normal[nlm], n] == 0, n]
```

The optimal amount of processes is 14.8271. A few paragraphs earlier, I wrote that it is recommended to use a value slightly lower than the number of available threads - in my case, there were 16 of them.

## Processes, Workers and Clusters in Node JS

This article focused on the processes described in the documentation under the link.

We showed how to create subprocesses, kill them, dynamically manage the number of subprocesses, and conduct bidirectional communication with them. In the end, we compared the scalability of password cracking with the brute force method to predictions based on universal scaling laws.

However, this topic was only briefly touched upon by us. I did not write anything about the clusters described here.

Workers, which also have a separate chapter for documentation.

I encourage you to read the Node JS documentation and design your own experiments independently.
