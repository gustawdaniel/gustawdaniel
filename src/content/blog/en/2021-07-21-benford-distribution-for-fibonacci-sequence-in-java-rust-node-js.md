---
author: Daniel Gustaw
canonicalName: benford-distribution-for-fibonacci-sequence-in-java-rust-node-js
coverImage: http://localhost:8484/148d29c9-465f-472c-ac6b-7ce78ebe3bd1.avif
description: Programs written in Java, Rust, and Node JS compete in checking the distribution of the first digits of the Fibonacci sequence. See how they are similar, how they differ, and how their performance depends on the length of the sequence.
excerpt: Programs written in Java, Rust, and Node JS compete in checking the distribution of the first digits of the Fibonacci sequence. See how they are similar, how they differ, and how their performance depends on the length of the sequence.
publishDate: 2021-07-21 15:57:21+00:00
slug: en/benford's-law
tags:
- rust
- java
- nodejs
title: Benford's Law for the Fibonacci Sequence in Java, Rust, and Node JS
updateDate: 2021-07-22 10:10:14+00:00
---

It was 1992. In the town of Wayne (Arizona USA), a verdict was reached for James Nelson - the chief accountant and manager of Arizona State Treasurer. His false checks, through which he embezzled almost 2 million dollars, were detected because the distribution of the first digits in the swindled amounts deviated from Benford's distribution.

![](http://localhost:8484/c1a7958b-17cd-410d-b4cb-403bb76cac96.avif)

On the first positions imagined by the accountant, the values 7, 8, and 9 were too often present - typical values perceived by us as "more" random than 1, 2, or 3.

---

From this entry, you will learn what Benford's Distribution is and why it is observed in many data sets. Later, we will discuss the Fibonacci sequence and its basic properties. Finally, we will write a program to check if Benford's Distribution applies to the Fibonacci sequence. The program will be written in three languages:

* Java
* Rust
* Node JS

We will compare the results of its performance.

## Benford's Distribution

Benford's Distribution is a probability distribution of the occurrence of specific numbers in the leading positions in many observed data sets. For it to occur, the following conditions must be met:

* the set of values should span many orders of magnitude
* the probability should be invariant with respect to scale and base

![](http://localhost:8484/1d0416b4-db35-4e92-a7fc-3abceedd15ac.avif)

An example of a size distribution where the first digit approximately follows Benford's law. The exponential decay of the distribution is evident as the value axis densifies.

![](http://localhost:8484/8dbf58e1-31d9-45e6-b6a7-2178aa19a87e.avif)

Distribution of sizes encompassing one order of magnitude. Usually, the first digits do not follow Benford's distribution if the initial distribution is not sufficiently wide.

A great formal derivation of Benford's distribution was presented by Arno Berger and Theodore P. Hill in the publication: ["A basic theory of Benford’s Law"](https://digitalcommons.calpoly.edu/cgi/viewcontent.cgi?referer=https://www.google.com/&httpsredir=1&article=1083&context=rgp_rsr)

This is a more than 100-page publication that extensively discusses the topic and I recommend it to everyone who loves mathematics. A shorter and simpler derivation worth noting was written by [Victor Romero-Rochin](https://www.researchgate.net/publication/45873771_A_derivation_of_Benford's_Law_and_a_vindication_of_Newcomb)

Examples of distributions following Benford's law are clearly shown at the link:

[Testing Benford’s Law](https://testingbenfordslaw.com/)

An intuitive reason for the higher representation of lower digits is the higher probability of occurrence of many smaller values, which, when overlapping with the stepwise variable density of digits as the order of magnitude increases, causes a shift towards higher representation of lower digits in the first positions.

Since in this article, Benford's distribution is merely a pretext for comparing the performance of programs written in various languages and not the main topic, I will allow myself to limit its description to showing the best publications, the derived formula, and a few examples.

The formula for the probability of the digit `d` occurring in the first position is:

![](http://localhost:8484/87e83494-bb63-4c20-a359-5392bda46134.avif)

Examples I will show come from the website `[deltami.edu.pl](http://www.deltami.edu.pl/temat/matematyka/zastosowania/2016/03/21/Fenomen_rozkladu_Benforda/)`

* Uniform distribution of uniform distribution

From the set of natural numbers ranging from 1 to 9999, we randomly draw a number p, using a random number generator with a uniform distribution. Next, from the range of natural numbers from 1 to p, we randomly draw a number r, also using the uniform distribution.

![](http://localhost:8484/98c32399-f9e6-47ea-b571-c47e956c0ae0.avif)

* Atomic mass of elements from the periodic table

Let's take a look at the periodic table of chemical elements, more specifically, one of the parameters of each element - atomic mass.

![](http://localhost:8484/5ee78f6d-c0ce-42d9-ace8-da38dd6087fb.avif)

* Surface area of world countries in km²

The last example is related to geography - let’s take a look at the surface area of all the countries in the world in km².

![](http://localhost:8484/72722365-4efd-4357-b0d2-40420d2480cb.avif)

* Benford's Law

Benford's discrete distribution for the decimal system also known as the law of first (significant) digits.

![](http://localhost:8484/65baa70d-2665-4c67-bd0f-9cf9f36198a9.avif)

As we see, all these sets of numbers have the same property – invariance with respect to scale, base, and extension by several orders of magnitude.

## Fibonacci Sequence

The Fibonacci sequence is a sequence of natural numbers with a recursive definition:

![](http://localhost:8484/4d2011f5-ed80-4f02-a5b2-fe27c37e26cf.avif)

where

![](http://localhost:8484/cd6431d2-5e38-4471-b87d-ad3102177679.avif)

Its initial values are:

```
1,1,2,3,5,8,13,21,34,55,89
```

This is a sequence that we can often observe in nature: in water vortices, in the shape of tornadoes, in the arrangement of flowers, in the branching of plants, and in the division of insect bodies. Its prevalence fascinates researchers of this phenomenon. Just like the prevalence of exponential or quadratic functions, it results from the simplicity of the formula and being a good approximation for much more complex systems observed in reality.

![](http://localhost:8484/f51dc67a-f506-447c-b141-cc74bd7c3f4c.avif)

The ratios of successive values of the sequence converge to the golden ratio. The proof follows directly from the definition.

## Java

![](http://localhost:8484/de07baa3-4ca2-4e9d-87fa-394f7e757a5c.avif)

To do this in Java, the import of the `java.math.BigInteger` module is required.

```java
import java.math.BigInteger;
```

In the file `Benford.java` in the class `Benford`, we will create a function `generateFibonacci` that will allow us to prepare the sequence.

```java
public class Benford {
    private static BigInteger[] generateFibonacci(int n) {
        BigInteger[] fib = new BigInteger[n];
        fib[0] = BigInteger.ONE;
        if(n == 1) return fib;
        fib[1] = BigInteger.ONE;
        for (int i = 2; i < n; i++)
            fib[i] = fib[i - 1].add(fib[i - 2]);
        return fib;
    }
```

It is worth noting that instead of `1` we use `BigInteger.ONE` to maintain type compatibility. Similarly, instead of classic addition by `+`, we use the `add` method defined on `BigInteger` objects.

In the `main` method, we prepare the Fibonacci sequence.

```java
    public static void main(String[] args) {
        BigInteger[] numbers = generateFibonacci(
            args.length > 0 ? Integer.parseInt(args[0]) : 1000
        );
```

Thanks to `args`, we can use the argument entered by the user. If it is not provided, the default value is `1000`.

Next, the `digits` array is filled with the counts of the digits.

```java
        int[] digits = new int[10];

        for (BigInteger number : numbers)
            digits[Integer.valueOf(number.toString().substring(0, 1))]++;
```

At the end, we display a table comparing the results with the theoretical predictions.

```java
        System.out.print("N   Ben        Fib\n");
        for (int i = 1; i < digits.length; i++)
            System.out.printf("%d %10.6f %10.6f\n",
                    i,
                    (double) digits[i] / numbers.length,
                    Math.log10(1.0 + 1.0 / i)
            );
    }
}
```

We execute the code by typing `java Benford.java` and get a result confirming our theory:

![](http://localhost:8484/d408d398-519c-46a9-a081-4e309adb9767.avif)

## Rust

We start projects in `Rust` with the command

```bash
cargo new benford
```

a file `Cargo.toml` is created in the `benford` directory with the content

```toml
[package]
name = "b"
version = "0.1.0"
edition = "2018"

[dependencies]
```

and the file `src/main.rs` with the content

```rust
fn main() {
    println!("Hello, world!");
}
```

It's very nice that Rust welcomes us in such a pleasant way, making it easier to start working with this language.

![](http://localhost:8484/8c306ef2-043e-4995-9896-ee25f46f3f45.avif)

To compile the program, we execute the command.

```bash
cargo build
```

It can then be started using the command

```bash
./target/debug/benford
```

To compile and run the program simultaneously, we will use the command

```bash
cargo run
```

While in Java we used one package for handling large integers, in Rust we need two: `num-bigint` and `num-traits`. We will add them to the project by writing lines

```toml
num-bigint = "0.4.0"
num-traits = "0.2.14"
```

under the `[dependencies]` key in the `Cargo.toml` file. The versions of the packages will be automatically suggested by our `IDE`. Their use in the `src/main.rs` file requires writing

```rust
use num_bigint::BigUint;
use num_traits::{Zero, One};
use std::env;
```

Where `Uint` comes from `unsigned integer`, which are whole numbers that do not spare one bit for the sign, because they are always positive. The function generating the Fibonacci sequence will be similar to the one in `Java`.

```rust
fn generate_fibonacci(n: usize) -> Vec<BigUint> {
    let mut fib = vec![Zero::zero(); n];
    fib[0] = One::one();
    if n == 1 { return fib; }
    fib[1] = One::one();
    for i in 2..n {
        fib[i] = &fib[i - 1] + &fib[i - 2];
    }
    return fib;
}
```

We see that the main difference lies in naming the types. In the `main` function, we generate the sequence in the same way by saving it to an array.

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let numbers = generate_fibonacci(
        if args.len() > 1 { (&args[1]).trim().parse().unwrap() }
        else { 100 }
    );
```

This time, the argument array starts with the program name and the value passed from the command line has an index of 1.

we prepare an array with the count of digits in the first positions

```rust
let mut digits = vec![0; 10];
```

An analogous record to that in Java allows us to count the digits and store the number of their occurrences in an array.

```rust
for n in numbers.iter() {
    digits[n.to_string()[..1].parse::<usize>().unwrap()] += 1;
}
```

At the end, we display the results in the console using the following loop.

```rust
    println!("N   Fib        Ben");
    for i in 1..digits.len() {
        println!("{:} {:10.6} {:10.6}",
                 i,
                 digits[i] as f64 / numbers.len() as f64,
                 (1.0 + 1.0 / i as f64).log10()
        );
    }
}
```

## Node JS

A unique feature of the presented program is that, like few other projects in `node js`, it does not contain a list of required packages. We do not need to import any modules responsible for handling large numbers. Constants of type `BigInt` are created by adding the letter `n` after the number. As a result, the function for generating the Fibonacci sequence takes the form:

```javascript
const generate_fibonacci = (n) => {
    let fib = [];
    fib[0] = 1n;
    if(n === 1) return fib;
    fib[1] = 1n;
    for (let i = 2; i < n; i++)
        fib[i] = fib[i - 1] + fib[i - 2];
    return fib;
};
```

However, we can easily imagine that someone writing code does not know the difference between `1n` and `1` or simply forgot that they are working with large numbers and wrote it like this:

```javascript
const generate_fibonacci = (n) => {
    let fib = [];
    fib[0] = 1;
    if(n === 1) return fib;
    fib[1] = 1;
    for (let i = 2; i < n; i++)
        fib[i] = fib[i - 1] + fib[i - 2];
    return fib;
};
```

To simulate both cases, let's write a universal function controlled by the `--cheat` flag.

```javascript
const generate_fibonacci = (n) => {
    let fib = [];
    fib[0] = process.argv[3] === '--cheat' ? 1 : 1n;
    if(n === 1) return fib;
    fib[1] = process.argv[3] === '--cheat' ? 1 : 1n;
    for (let i = 2; i < n; i++)
        fib[i] = fib[i - 1] + fib[i - 2];
    return fib;
};
```

In the further part, it will become apparent how colossal differences in performance and correctness of the program are made by this one symbol `n`. When writing software, it is important to understand what value ranges the program operates on and to correctly handle their boundaries.

![](http://localhost:8484/1ff3b625-6b92-4b17-bc7c-53676c7f9b23.avif)

> In this regard, `node` requires particular responsibility from the programmer, as trying to save the program by throwing an error leads to compromises that can sometimes be brilliant, but can also be very deceptive.

We will use the `generate_fibonacci` function in the `main` function as follows

```javascript
const main = () => {
    const numbers = generate_fibonacci(
       parseInt(process.argv[2]) || 1000
    );
```

Of course, in `node` we are not obliged to define a `main` function, but I consider it good practice for the program to have a clearly defined starting point and well delineated boundaries between declaring functions and procedures and using them.

By the way, you probably noticed that `argv` is indexed completely differently again. As you can see, each language has its own convention here, and this time the first two arguments are the directory and the program name.

An array of ten zeros, which will contain counts of the recorded first digits, can be declared as follows.

```javascript
const digits = [...new Array(10)].map(() => 0);
```

Counting itself is just as simple as in other languages.

```javascript
numbers.forEach(n =>
    digits[n.toString().substr(0, 1)]++
)
```

On the other hand, printing results instead of using a template where we input values as arguments directly uses template strings.

```javascript
    process.stdout.write("N   Ben        Fib\n");
    for (let i = 1; i < digits.length; i++) {
        const ben = digits[i] / numbers.length;
        const fib = Math.log10(1 + 1 / i);
        process.stdout.write(
            `${i}   ${ben.toFixed(6)}   ${fib.toFixed(6)}\n`
        )
    }
}
```

At the end, we activate our program by calling the `main` function.

```javascript
main();
```

## Performance Comparison of Programs

By performance of programs, I mean the performance of compiled programs without counting the compilation time. Therefore, in the case of Java, we need to compile using the command

```bash
javac Benford.java
```

As a result of this command, a file `Benford.class` will be created.

For Rust, the compilation performed by `cargo build` creates a developer version that is not optimized. To create an optimized version, you need to add the `release` flag.

```bash
cargo build --release
```

For example, for `n=1000`, each program displays the same result, but the computation times vary.

![](http://localhost:8484/5aa2a8ee-87c7-4f60-95d5-d70a4da9c9b7.avif)

Rust crushes the competition. Node.js shows the same results and very similar, even good time, regardless of whether we started from `1` or `1n`. Java, despite significant `cpu` usage, takes so long to start that it performs the worst in this test.

For `n=10000`, the result of Java only increases by 10 times, even though Rust performs calculations two orders of magnitude longer, and Node 24 times longer.

![](http://localhost:8484/81925e03-09e3-49d0-a7c4-2d902da7e63f.avif)

Do not be misled by the fact that `n` has increased "only" 10 times. The values processed by the program grow at a geometric pace, quickly reaching gigantic values. For example, for `n=10000`, the value of the sequence is:

![](http://localhost:8484/f0b9f7f5-50af-448e-9a85-7f206bb8eaa2.avif)

The difference in performance increase comes from the fact that Java has the heaviest startup process. Node, although quite lightweight, still requires loading the entire interpreter, which is why Rust, having the fastest startup, demonstrated how much computational complexity has actually increased.

Since the main burden here is adding larger and larger numbers, whose length increases linearly, we can expect a complexity of O(n^2), which Rust presents.

The last conclusion is that a program written in `Node JS` with the `--cheat` flag "did not notice" that it is running incorrectly. Its results show that despite the fast execution, it did not accurately count the leading digits. Knowing the limitations of the `Number` type in Node, we know that it cannot exceed the value of `Number.MAX_VALUE`, which is `1.7976931348623157e+308`, while `Log10[Fibonacci[1000]]` equals `208.638`, but `Log10[Fibonacci[10000]]` is already `2089.53`. Therefore, the numbers that the program in Node adds are `Infinity`.

Of course, `Infinity` + `Infinity` = `Infinity`, which significantly reduces computation time, but the first "digit" of infinity for Node is `I` because we calculate it with the command.

```javascript
n.toString().substr(0, 1)
```

If I stopped at the comparison of the pair of results for three programs, I wouldn't be myself. Curiosity compels me to look deeper and prepare a chart showing how computation time increased with the length of the sequence.

I will also show the measurement point `50,000`.

![](http://localhost:8484/855ea912-ebd2-4c71-b67b-200176981079.avif)

However, discussing each one individually is not as valuable as conducting a whole series of measurements and overlaying them on a common graph.

### Measuring program performance depending on the argument

To effectively measure the performance of programs, we need to solve several problems

* separate the program's output streams from the performance measurement
* choose a set of values for which we will conduct the measurement
* draw the graphs

#### Separating the program stream from the time measurement stream

In bash, programs communicate by redirecting data streams. The output of one program can become the input of another, which may want to save the processed information to a file.

For a simple execution:

```bash
java Benford 10
```

result in the form of:

```tsv
N   Ben        Fib
1   0.300000   0.301030
2   0.200000   0.176091
3   0.200000   0.124939
4   0.000000   0.096910
5   0.200000   0.079181
6   0.000000   0.066947
7   0.000000   0.057992
8   0.100000   0.051153
9   0.000000   0.045757
```

will be displayed in the terminal because the terminal is the default output for the data stream produced by this program. The data produced by the program defaults to being sent out through standard output. We can redirect it elsewhere using `1>` or simply `>` and omit the `1`, which is default.

Executing `java Benford 10 > out` will not show anything but will create a file with data from standard output.

However, when we precede the program with the command `time`, that is, we write

```bash
time java Benford 10
```

it will turn out that we will receive in the terminal

```tsv
N   Ben        Fib
1   0.300000   0.301030
2   0.200000   0.176091
3   0.200000   0.124939
4   0.000000   0.096910
5   0.200000   0.079181
6   0.000000   0.066947
7   0.000000   0.057992
8   0.100000   0.051153
9   0.000000   0.045757
java Benford 10  0.12s user 0.02s system 153% cpu 0.091 total
```

however, attempting to capture the execution time to a file as before using `>` will end with displaying the line

```tsv
java Benford 10  0.12s user 0.02s system 153% cpu 0.091 total
```

in the terminal, and all other output will be redirected to the file. This is because time does not mix its data with the data from the standard stream. Instead, it uses the error stream `2>`.

Our goal is to hide the data from the standard stream. We can do this by redirecting it to `/dev/null`. This means

```bash
time java Benford 10 > /dev/null
```

However, the error stream is impossible for us to process unless we redirect it to the main stream. We will achieve this with the command

```bash
(time java Benford 10 > /dev/null) 2>&1
```

The result of these two looks the same, but the key difference is that in the second case, we can process the stream by redirecting it to `awk`.

For example, a command that involves data processing:

```bash
(time java Benford 10 > /dev/null) 2>&1 | awk '{print $1,10,$6,$10,$12}'
```

will only return on standard output

```tsv
java 10 0.11s 154% 0.090
```

to clean these results of the `s` and `%` sign we can add

```bash
| tr -d "s%"
```

If we want to view this result while saving it to a file, `tee` comes to our aid - the third of my favorite tools alongside Kafka and Express.

Just add at the end:

```bash
| tee -a logs
```

and the shown line will be appended at the end of the `logs` file. Now let's assume that we want to wrap the recently generated command in a loop iterating over the sequence:

```bash
for i in $(seq 5 5 25); do echo $i; done;
```

The sequence will display to us

```tsv
5
10
15
20
25
```

But if we naively pasted `$i` into `print` in `awk` like this:

```bash
for i in $(seq 5 5 25); do (time java Benford $i > /dev/null) 2>&1 | awk '{print $1,$i,$6,$10,$12}' | tr -d "s%" | tee -a logs; done;
```

we would get a repeatedly repeated line

```bash
java java Benford $i > /dev/null  0.12s user 0.02s system 152% cpu 0.091 total 0.12 152 0.091
```

It is like this because `i` does not exist inside `print` unless we put it there. Therefore, `$i` is equal to `$0`, which corresponds to the entire line, not a selected column. To use variables inside the `print` context in `awk`, we can use the `-v` flag. The correct syntax of the command is:

```bash
for i in $(seq 5 5 25); do (time java Benford $i > /dev/null) 2>&1 | awk -v i=$i '{print $1,i,$6,$10,$12}' | tr -d "s%" | tee -a logs; done;
```

and its result is simultaneously writing to the `logs` file and displaying the line on the screen:

```bash
java 5 0.11 150 0.090
java 10 0.12 153 0.089
java 15 0.11 152 0.088
java 20 0.10 154 0.087
java 25 0.11 153 0.089
```

If the topic of streams in `bash` interests you, I recommend the introduction of [Justin Albano](https://www.baeldung.com/linux/author/justin-albano).

#### Preparation of a series of values `n` for performance analysis

By dividing the measurement range into parts, one should increase the density of measurements where their cost is low (short program execution time) and variability and interesting behaviors are expected. For us, this is the change in the ratio of computation time to startup time (typical for small values of `n`). Thus, we have two reasons not to divide the measurement range into equal pieces and not to use `seq`. Instead, we can generate a series whose density decreases as `n` increases. For example, a module in `Mathematica`:

```matlab
Module[{steps = 100, minY = 1, maxY = 50000, pow = 3},
   Table[maxY (minY + maxY (n)^pow)/(minY + maxY), {n, 0, 1,
     1/(steps - 1)}]] // Ceiling // DeleteDuplicates
```

will result in a series with the following distribution

![](http://localhost:8484/86665921-d254-40b6-937e-bc9bc677d397.avif)

We save it to the file `n_values` with the command

```matlab
Export["~/exp/benford/n_values.csv", %]
```

#### Preparing charts comparing program performance

We will save the performance measuring code in a file `measure.sh`

```bash
#!/usr/bin/zsh

while IFS= read -r i
do
 (time node benford.js "$i" > /dev/null) 2>&1 | awk -v i="$i" '{print $1,i,$6,$10,$12}' | tee -a logs;
 (time ./target/release/benford "$i" > /dev/null) 2>&1 | awk -v i="$i" '{print "rust",i,$5,$9,$11}' | tee -a logs;
 (time java Benford "$i" > /dev/null) 2>&1 | awk -v i="$i" '{print $1,i,$6,$10,$12}' | tee -a logs;
done;
```

We replaced the `for` loop with `while`. Using `cat n_values.csv` is permissible but not recommended

[koalaman/shellcheck Wiki](https://github.com/koalaman/shellcheck/wiki/SC2013)

It's also worth enclosing `$i` in quotes. When we fetched data from the sequence, it didn't matter, and it won't affect the program now, but it's good practice to use quotes because if the variables contain values with spaces, the words separated by spaces may be treated as arguments in subsequent positions instead of one value.

[koalaman/shellcheck Wiki](https://github.com/koalaman/shellcheck/wiki/SC2086)

We measure by entering

```bash
time zsh measure.sh
```

Uploading the created file

```matlab
logs = Import["/home/daniel/exp/benford/logs", "Data"];
```

and we draw a graph

```matlab
ListLogPlot[
 Table[{#[[1]],
     PadLeft[ToExpression /@ StringSplit[ToString[#[[2]]], ":"],
        2]*{60, 1} // Total} & /@
   GroupBy[logs, First][i][[All, {2, 5}]], {i, {"java", "rut",
    "node"}}],
 PlotLegends -> {"Java", "Rust", "Node"}, ImageSize -> Full,
 Frame -> True,
 FrameLabel -> {"Fibonaccin sequence length", "Total time"},
 LabelStyle -> Directive[FontSize -> 16]]
```

![](http://localhost:8484/8aafa240-d291-4fd8-beb4-9149876eb2db.avif)

Summary:

* the long startup time of the Java virtual machine prevented it from taking off in the early phase, making it perform the worst for small values of `n`.
* surprisingly well managed `Node`, which although not recommended for CPU-intensive tasks, has a really well-optimized implementation of [BigInt](https://v8.dev/blog/bigint)
* unbeatable for low `n` turned out to be `Rust`, which, as it is not burdened by any runtime environment or interpreter, however succumbed to Java for large `n`, whose team has been [improving](https://en.wikipedia.org/wiki/Java_performance) the performance of Java in successive versions for years.

I realize that these programs can be optimized, for example in terms of memory usage - not holding entire arrays with strings. I tried to write them in a way that is as similar and simple as possible in all languages. If you noticed a mistake in them, I would be very grateful for bringing it to my attention in the comments.

### Update: Implementations of large numbers in Rust

DK13 - a user of the wykop service pointed out that in Rust we have different implementations of large numbers and which one we choose significantly affects the final result.

[Write once, debug everywhere.](https://www.wykop.pl/ludzie/DK13/)

[https://github.com/tczajka/bigint-benchmark-rs#results](https://github.com/tczajka/bigint-benchmark-rs#results)

I will check this soon and update the content of this post.
