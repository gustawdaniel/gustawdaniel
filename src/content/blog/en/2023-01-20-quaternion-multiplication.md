---
author: Daniel Gustaw
canonicalName: codingame-quaternion-multiplication-rust-nodejs-parsing-algebra
coverImage: http://localhost:8484/d49f26ae-0d28-40ec-a9ec-a242c016b45d.avif
date_updated: 2023-01-20 02:19:57+00:00
description: In this article, we will see how to implement the multiplication of quaternions
  in Rust and NodeJS. You will learn about parsing and algebra.
excerpt: In this article, we will see how to implement the multiplication of quaternions
  in Rust and NodeJS. You will learn about parsing and algebra.
publishDate: 2023-01-20 02:19:57+00:00
slug: en/quaternion-multiplication
tags:
- quaternion
- rust
- nodejs
- algebra
- mathematics
- parsing
title: 'CodinGame: Quaternion Multiplication - Rust, NodeJS - Parsing, Algebra'
---



In this article we will see how to implement the multiplication of quaternions in Rust and NodeJS. I encourage you to try solve this problem before seeing solutions. Below I attaching link to this exercise:

[Coding Games and Programming Challenges to Code Better

CodinGame is a challenge-based training platform for programmers where you can play with the hottest programming topics. Solve games, code AI bots, learn from your peers, have fun.

![](https://static.codingame.com/assets/apple-touch-icon-152x152-precomposed.5cb052db.png)CodinGame

![](https://files.codingame.com/codingame/codingame_share_pics.jpg)](https://www.codingame.com/training/medium/quaternion-multiplication)

The quaternions belong to a number system that extends the complex numbers. A quaternion is defined by the sum of scalar multiples of the constants **i**,**j**,**k** and **1**.
More information is available at:

[Quaternion -- from Wolfram MathWorld

The quaternions are members of a noncommutative division algebra first invented by William Rowan Hamilton. The idea for quaternions occurred to him while he was walking along the Royal Canal on his way to a meeting of the Irish Academy, and Hamilton was so pleased with his discovery that he scratche…

from Wolfram MathWorld

![](https://mathworld.wolfram.com/images/socialmedia/share.png)](https://mathworld.wolfram.com/Quaternion.html)

Consider the following properties:
**jk** = **i**
**ki** = **j**
**ij** = **k**
**i**² = **j**² = **k**² = **\-1**

These properties also imply that:
**kj** = **\-i**
**ik** = **\-j**
**ji** = **\-k**

The order of multiplication is important.

Your program must output the result of the product of a number of bracketed simplified quaternions.

**Pay attention to the formatting**
The coefficient is appended to the left of the constant.
If a coefficient is **1** or **\-1**, don't include the **1** symbol.
If a coefficient or scalar term is **0**, don't include it.
The terms must be displayed in order: a**i** + b**j** + c**k** + d.

**Example Multiplication**
(2i+2j)(j+1) = (2ij+2i+2j² +2j) = (2k+2i-2+2j) = (2i+2j+2k-2)

---

**Input:**

**Line 1**: The expression expr to evaluate. This will always be the product of simplified bracketed expressions.

**Output:**A single line containing the simplified result of the product expression. No brackets are required.

**Constraints:**All coefficients in any part of evaluation will be less than **10^9**
The input contains no more than 10 simplified bracketed expressions

**Example**

**Input**

```
(i+j)(k)
```

**Output**

```
i-j
```

# Solution

I decided to present only most important parts here. Full solution can be found in repository:

[GitHub - gustawdaniel/codingame-quaternion-multiplication

Contribute to gustawdaniel/codingame-quaternion-multiplication development by creating an account on GitHub.

![](https://github.githubassets.com/favicons/favicon.svg)GitHubgustawdaniel

![](https://opengraph.githubassets.com/85682fcbd54214a903a6cb968a0137db1d1243d42b118b9e0764ac9229c76d63/gustawdaniel/codingame-quaternion-multiplication)](https://github.com/gustawdaniel/codingame-quaternion-multiplication)

We can divide our problem to three steps:

* parsing input to Quaternion structure
* multiplication of Quaternions
* formatting Quaternion again to string

![](http://localhost:8484/8467207d-4e35-4dd6-ac96-8b874028e6ef.avif)

These high-level operations can be implemented in NodeJS

```typescript
import {Quaternion} from "./lib";

process.stdin.on('data', (buff) => {
    const line = buff.toString();
    const qs = Quaternion.parse(line);
    process.stdout.write(qs.reduce((p, n) => p.multiply(n)).format());
})
```

and in Rust

```rust
fn main() {
    let mut input_line = String::new();
    io::stdin().read_line(&mut input_line).unwrap();
    let expr = input_line.trim_matches('\n').to_string();

    let qs = Quaternion::parse(&expr);
    let out = qs.into_iter().reduce(|p, n| p.multiply(n)).unwrap();
    println!("{}", out);
}
```

You can see that this code is really similar but in both cases we have to implement `Struct/Class` named `Quaternion`. Now we will go through three steps mentioned before using `TDD`. Tests are natively supported in rust, but in `NodeJS` I decided to use `jest` as testing framework.

## Parsing input to Quaternion structure

Our input

```
(i+j)(k)
```

should be treated as array of quaternions - separated by brackets. In any brackets we have array of coefficients. So we can divide our parsing to 4 parts:

* spliting by brackets
* splitings any bracket to coefficients
* creating Quaternions from arrays of coefficients
* extracing number from coefficient

![](http://localhost:8484/dd766517-6a3f-4c23-b9df-dbf68b0c0c80.avif)

In NodeJS we can start from two tests. First for simple cases:

```typescript
    it('simple parse', () => {
        const qs = Quaternion.parse('(i+j)');
        expect(qs.length).toEqual(1);
        expect(qs[0].r).toEqual(0);
        expect(qs[0].i).toEqual(1);
        expect(qs[0].j).toEqual(1);
        expect(qs[0].k).toEqual(0);
    });
```

Second for more advanced coefficients:

```typescript
    it('complex parse', () => {
        const qs = Quaternion.parse('(9+i-j)(k-8.4j)');
        expect(qs.length).toEqual(2);
        expect(qs[0].r).toEqual(9);
        expect(qs[0].i).toEqual(1);
        expect(qs[0].j).toEqual(-1);
        expect(qs[0].k).toEqual(0);

        expect(qs[1].r).toEqual(0);
        expect(qs[1].i).toEqual(0);
        expect(qs[1].j).toEqual(-8.4);
        expect(qs[1].k).toEqual(1);
    });
```

The same tests in `rust` can be written as

```rust
#[cfg(test)]
mod tests {
    use crate::{Quaternion};


    #[test]
    fn simple_parse() {
        let qs = Quaternion::parse("(i+j)");
        assert_eq!(qs.len(), 1);
        assert_eq!(qs[0].r, 0f64);
        assert_eq!(qs[0].i, 1f64);
        assert_eq!(qs[0].j, 1f64);
        assert_eq!(qs[0].k, 0f64);
    }

    #[test]
    fn complex_parse() {
        let qs = Quaternion::parse("(9+i-j)(k-8.4j)");
        assert_eq!(qs.len(), 2);
        assert_eq!(qs[0].r, 9f64);
        assert_eq!(qs[0].i, 1f64);
        assert_eq!(qs[0].j, -1f64);
        assert_eq!(qs[0].k, 0f64);

        assert_eq!(qs[1].r, 0f64);
        assert_eq!(qs[1].i, 0f64);
        assert_eq!(qs[1].j, -8.4f64);
        assert_eq!(qs[1].k, 1f64);
    }
}
```

Our base `Quaternion` class will have `4` properties. In NodeJS:

```typescript
export class Quaternion {
    r: number = 0;
    i: number = 0;
    j: number = 0;
    k: number = 0;
}
```

where `r` means `real` part that inherits arithmetic from real numbers. In `rust` we are using `struct` keyword instead of `class`

```rust
#[derive(Debug)]
struct Quaternion {
    r: f64,
    i: f64,
    j: f64,
    k: f64,
}
```

### Splitting string using regular expressions

To split input and provide arrays of coefficients to Quaternion constructors we can write methods in NodeJS:

```typescript
    static parse(input: string): Quaternion[] {
        const qs = (input.match(/\(.*?\)/g) ?? []).map(
            (e: string) => (e
                    .replace('(', '')
                    .replace(')', '')
                    .match(/[-+]?[\d.]*[ijk]?/g) ?? []
            ).filter(v => v).map(
                v => v.replace(/^\+/, '')
            )
        );
        return qs.map((q) => new Quaternion(q));
    }
```

and Rust

```rust
impl Quaternion {
    fn parse(input: &str) -> Vec<Quaternion> {
        let re = Regex::new(r"\((.*?)\)").expect("can't create regex");

        let qs = re.captures_iter(input).filter_map(|cap| Some(cap.get(1)?.as_str()))
            .map(|m| m.to_string()).collect::<Vec<_>>();

        let re = Regex::new(r"\+?(-?[\d.]*[ijk]?)").expect("can't create regex");

        let res = qs.iter().map(|q| {
            let args = re.captures_iter(&q).filter_map(|cap| Some(cap.get(1)?.as_str()))
                .map(|m| m.to_string()).collect::<Vec<_>>();
            Quaternion::new(args)
        });

        res.collect::<Vec<_>>()
    }
}
```

Generally there are the same regex expressions but `rust` requires here external library called `regex`. Additionally `rust` checks correctness of regex expressions and ensure handling errors in them, that can be skipped by default in `node js` code. Generally I feel that `node js` approach to regex is more clean and readable.

Now we have the following problem. Our coefficients can contains numbers, numbers with names of component like: `i`, `j` or `k`, or even lonely letters like `i` what means `1i`. There are also possible signs like `-k`.

We need code that will extract numbers from them. Lets name `i`, `j` or `k` as `type` and full coefficient string as `input`. Then extracting number can be considered as:

* removing `type` from `input`
* if rest not end with digit then add `1` on the end ( example is `-` )
* finally parse it as float

Implementation in `node js`

```typescript
    static getCoefficient(type: string, input: string): number {
        const coefficient = input.replace(type, '');
        return Number.parseFloat(/\d$/.test(coefficient) ? coefficient : coefficient + '1')
    }
```

and analogical in rust

```rust
    fn get_coefficient(t: &str, input: String) -> f64 {
        let c = input.replace(t, "");
        if Regex::new(r"\d$").expect("ff").is_match(&c) {
            c.parse::<f64>().unwrap()
        } else {
            (c + "1").parse::<f64>().unwrap()
        }
    }
```

In rust generally handling conversions between types require more characters but is more reliable. In this case writing `unwrap` we are enforced to think about possible ways of handle problems with parsing.

Now we can present constructors. In them we will pass array of strings with coefficients like `8`, `-9k`, or `i`. In `node js`:

```typescript
    constructor(args: Array<string>) {
        for (let arg of args) {
            if (arg.includes('i')) {
                this.i = Quaternion.getCoefficient('i', arg);
            } else if (arg.includes('j')) {
                this.j = Quaternion.getCoefficient('j', arg);
            } else if (arg.includes('k')) {
                this.k = Quaternion.getCoefficient('k', arg);
            } else {
                this.r = Number.parseFloat(arg);
            }
        }
    }
```

or in `rust`:

```rust
    fn new(args: Vec<String>) -> Quaternion {
        let mut q = Quaternion {
            i: 0f64,
            j: 0f64,
            k: 0f64,
            r: 0f64,
        };

        for arg in args {
            if arg.contains("i") {
                q.i = Quaternion::get_coefficient("i", arg)
            } else if arg.contains("j") {
                q.j = Quaternion::get_coefficient("j", arg)
            } else if arg.contains("k") {
                q.k = Quaternion::get_coefficient("k", arg)
            } else {
                q.r = arg.parse::<f64>().unwrap()
            }
        }

        q
    }
```

## Multiplication of Quaternions

Multiplication of two quaternions is similar to multiplication of polynomials. Firstly we muliply any components pairs each other. Then we can group them by component type and finally add coefficients. Difference is that in polynomial multiplication we always adding powers, but in Quaternions we using noncommutative division algebra presented on table:

![](http://localhost:8484/c7947573-0696-486e-8bd7-ffbfc5b8c85c.avif)

So basically we can divide our problem to:

* multiplication of base elements
* multiplication of linear combinations of base elements

### Multiplication of base elements

I rewrote all possible cases in test file in `NodeJS`

```typescript
    it('multiply base', () => {
        expect(Quaternion.multiplyBase('r', 'r')).toEqual({c: 1, d: 'r'});
        expect(Quaternion.multiplyBase('r', 'i')).toEqual({c: 1, d: 'i'});
        expect(Quaternion.multiplyBase('r', 'j')).toEqual({c: 1, d: 'j'});
        expect(Quaternion.multiplyBase('r', 'k')).toEqual({c: 1, d: 'k'});

        expect(Quaternion.multiplyBase('i', 'r')).toEqual({c: 1, d: 'i'});
        expect(Quaternion.multiplyBase('i', 'i')).toEqual({c: -1, d: 'r'});
        expect(Quaternion.multiplyBase('i', 'j')).toEqual({c: 1, d: 'k'});
        expect(Quaternion.multiplyBase('i', 'k')).toEqual({c: -1, d: 'j'});

        expect(Quaternion.multiplyBase('j', 'r')).toEqual({c: 1, d: 'j'});
        expect(Quaternion.multiplyBase('j', 'i')).toEqual({c: -1, d: 'k'});
        expect(Quaternion.multiplyBase('j', 'j')).toEqual({c: -1, d: 'r'});
        expect(Quaternion.multiplyBase('j', 'k')).toEqual({c: 1, d: 'i'});

        expect(Quaternion.multiplyBase('k', 'r')).toEqual({c: 1, d: 'k'});
        expect(Quaternion.multiplyBase('k', 'i')).toEqual({c: 1, d: 'j'});
        expect(Quaternion.multiplyBase('k', 'j')).toEqual({c: -1, d: 'i'});
        expect(Quaternion.multiplyBase('k', 'k')).toEqual({c: -1, d: 'r'});
    })
```

and `Rust`

```rust
    #[test]
    fn multiply_base() {
        assert_eq!(Quaternion::multiply_base('r', 'r'), SignedCoefficient { c: 1f64, d: 'r' });
        assert_eq!(Quaternion::multiply_base('r', 'i'), SignedCoefficient { c: 1f64, d: 'i' });
        assert_eq!(Quaternion::multiply_base('r', 'j'), SignedCoefficient { c: 1f64, d: 'j' });
        assert_eq!(Quaternion::multiply_base('r', 'k'), SignedCoefficient { c: 1f64, d: 'k' });

        assert_eq!(Quaternion::multiply_base('i', 'r'), SignedCoefficient { c: 1f64, d: 'i' });
        assert_eq!(Quaternion::multiply_base('i', 'i'), SignedCoefficient { c: -1f64, d: 'r' });
        assert_eq!(Quaternion::multiply_base('i', 'j'), SignedCoefficient { c: 1f64, d: 'k' });
        assert_eq!(Quaternion::multiply_base('i', 'k'), SignedCoefficient { c: -1f64, d: 'j' });

        assert_eq!(Quaternion::multiply_base('j', 'r'), SignedCoefficient { c: 1f64, d: 'j' });
        assert_eq!(Quaternion::multiply_base('j', 'i'), SignedCoefficient { c: -1f64, d: 'k' });
        assert_eq!(Quaternion::multiply_base('j', 'j'), SignedCoefficient { c: -1f64, d: 'r' });
        assert_eq!(Quaternion::multiply_base('j', 'k'), SignedCoefficient { c: 1f64, d: 'i' });

        assert_eq!(Quaternion::multiply_base('k', 'r'), SignedCoefficient { c: 1f64, d: 'k' });
        assert_eq!(Quaternion::multiply_base('k', 'i'), SignedCoefficient { c: 1f64, d: 'j' });
        assert_eq!(Quaternion::multiply_base('k', 'j'), SignedCoefficient { c: -1f64, d: 'i' });
        assert_eq!(Quaternion::multiply_base('k', 'k'), SignedCoefficient { c: -1f64, d: 'r' });
    }
```

In `Rust` I have to define `SignedCoefficient` that was simple anonymous objects in `node`

```rust
#[derive(Debug)]
struct SignedCoefficient {
    c: f64,
    d: char,
}
```

additionally I have to implement equation relation on them to use `assert_eq`.

```rust
impl PartialEq<SignedCoefficient> for SignedCoefficient {
    fn eq(&self, other: &SignedCoefficient) -> bool {
        self.c == other.c && self.d == other.d
    }
}
```

Function `multiplyBase` is super simple and to build it we have to see that:

* multiplication by 1 is always the other element. `a * 1 = a` and `1 * a = a`
* excluding 1 we always have `a * a = -1`
* excluding 1 and diagonal we always receive coefficient different that these used to multiply, sign can be determined using `%2` operation and direction of multiplication.

Using these observations we can define multiplication in `node` as

```typescript
    static multiplyBase(a: Base, b: Base): { c: -1 | 1, d: Base } {
        if (a === 'r') return {c: 1, d: b};
        if (b === 'r') return {c: 1, d: a};
        if (a === b) return {c: -1, d: 'r'};
        const diff = a.charCodeAt(0) - b.charCodeAt(0);
        return {
            c: (diff > 0 ? -1 : 1) * ((diff + 2) % 2 === 0 ? -1 : 1) as -1 | 1,
            d: ['i', 'j', 'k'].find((e) => e !== a && e !== b) as Base
        }
    }
```

and in `rust`

```rust
    fn multiply_base(a: char, b: char) -> SignedCoefficient {
        if a == 'r' { return SignedCoefficient { c: 1f64, d: b }; }
        if b == 'r' { return SignedCoefficient { c: 1f64, d: a }; }
        if a == b { return SignedCoefficient { c: -1f64, d: 'r' }; }
        let diff = u32::from(a) as i32 - u32::from(b) as i32;

        SignedCoefficient {
            c: (if diff > 0 { -1f64 } else { 1f64 }) * (if (diff + 2i32) % 2 == 0 { -1f64 } else { 1f64 }),
            d: vec!['i', 'j', 'k'].iter().find(|&&e| e != a && e != b).unwrap().to_owned(),
        }
    }
```

### Multiplication of linear combinations

I divided multiplication tests to simple and complex cases

```typescript
    it('simple multiply', () => {
        const res = (new Quaternion(['1']))
            .multiply(new Quaternion(['1']))

        expect(res.r).toEqual(1);
        expect(res.i).toEqual(0);
        expect(res.j).toEqual(0);
        expect(res.k).toEqual(0);
    })

    it('complex multiply', () => {
        const res = (new Quaternion(['2i', '2j']))
            .multiply(new Quaternion(['j', '1']))

        expect(res.r).toEqual(-2);
        expect(res.i).toEqual(2);
        expect(res.j).toEqual(2);
        expect(res.k).toEqual(2);
    })
```

and

```rust
    #[test]
    fn simple_multiply() {
        let res = Quaternion::new(vec![String::from("1")])
            .multiply(Quaternion::new(vec![String::from("1")]));

        assert_eq!(res, Quaternion {
            r: 1f64,
            i: 0f64,
            j: 0f64,
            k: 0f64,
        })
    }

    #[test]
    fn complex_multiply() {
        let res = Quaternion::new(vec![String::from("2i"), String::from("2j")])
            .multiply(Quaternion::new(vec![String::from("j"), String::from("1")]));

        assert_eq!(res, Quaternion {
            r: -2f64,
            i: 2f64,
            j: 2f64,
            k: 2f64,
        })
    }
```

here to compare Quaternions we have to implement `PartialEq`

```rust
impl PartialEq<Quaternion> for Quaternion {
    fn eq(&self, other: &Quaternion) -> bool {
        self.r == other.r && self.i == other.i && self.j == other.j && self.k == other.k
    }
}
```

In `NodeJS` is can be reduced to nested loop like this

```typescript
    multiply(a: Quaternion): Quaternion {
        const res = new Quaternion([]);
        for (let p of ['r', 'i', 'j', 'k'] as Array<Base>) {
            for (let n of ['r', 'i', 'j', 'k'] as Array<Base>) {
                const {c, d} = Quaternion.multiplyBase(p, n);
                res[d] += c * this[p] * a[n];
            }
        }
        return res;
    }
```

`c` is sign, `d` is name of coefficient.

In `Rust` we cant have access to dynamic properties that are chars so we have to add two auxiliary methods to get and set values using chars

```rust
    fn get(&self, key: char) -> f64 {
        match key {
            'r' => self.r,
            'i' => self.i,
            'j' => self.j,
            'k' => self.k,
            _ => 0f64
        }
    }

    fn set(&mut self, key: char, value: f64) -> &Quaternion {
        match key {
            'r' => self.r = value,
            'i' => self.i = value,
            'j' => self.j = value,
            'k' => self.k = value,
            _ => ()
        }

        self
    }

    fn multiply(&self, a: Quaternion) -> Quaternion {
        let mut res = Quaternion::new(vec![]);
        for p in vec!['r', 'i', 'j', 'k'] {
            for n in vec!['r', 'i', 'j', 'k'] {
                let SignedCoefficient { c, d } = Quaternion::multiply_base(p, n);
                res.set(d, res.get(d) + c * self.get(p) * a.get(n));
            }
        }
        res
    }
```

but generally idea is the same.

Now we have program that can read input, convert it to array of Quaternions and multiply them.

![](http://localhost:8484/0dd8108f-02cd-4dfd-84c6-63517935dd45.avif)

Last lacking element is formatting result as string.

## Formatting Quaternion to strings

Formatting results can be considered as:

* formatting any single coefficient using special treatments for `1`
* building ordered array of coefficients that is joined as sting

These operations are inversion of parsing presented in first part. Lest start from tests in `node js`

```typescript
    it('format coefficient', () => {
       expect(Quaternion.formatCoefficient('i', 20)).toEqual('20i');
       expect(Quaternion.formatCoefficient('i', 1)).toEqual('i');
       expect(Quaternion.formatCoefficient('', 0)).toEqual('0');
    });

    it('format', () => {
        expect((new Quaternion([]).format())).toEqual('0');
        expect((new Quaternion(['1']).format())).toEqual('1');
        expect((new Quaternion(['i', '1']).format())).toEqual('i+1');
        expect((new Quaternion(['i', '-3.4j', '1']).format())).toEqual('i-3.4j+1');
        expect((new Quaternion(['j', 'k']).format())).toEqual('j+k');

    })
```

Analogical tests in `rust`

```rust
    #[test]
    fn format_coefficient() {
        assert_eq!(Quaternion::format_coefficient('i', 20f64), String::from("20i"));
        assert_eq!(Quaternion::format_coefficient('i', 1f64), String::from("i"));
        assert_eq!(Quaternion::format_coefficient(' ', 0f64), String::from("0"));
    }

    #[test]
    fn format() {
        assert_eq!(format!("{}", Quaternion::new(vec![])), String::from("0"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("1")])), String::from("1"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("i"), String::from("1")])), String::from("i+1"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("i"), String::from("-3.4j"), String::from("1")])), String::from("i-3.4j+1"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("j"), String::from("k")])), String::from("j+k"));
    }
```

In function `formatCoefficient` we carry about cases like `1`, `-` and deciding if component name like `i`, `j` or `k` should be added to result.

```typescript
    static formatCoefficient(type: Base | '', value: number) {
        const out = `${Math.abs(value) === 1 ? (
            Math.sign(value) === 1 ? '' : '-'
        ) : value}${type}`;
        return /[\dijk]$/.test(out) ? out : `${out}1`;
    }
```

and

```rust
    fn format_coefficient(t: char, value: f64) -> String {
        let out = if f64::abs(value) == 1f64 {
            if f64::signum(value) == 1f64 {
                String::from("") + &t.to_string()[..].trim()
            } else {
                String::from("-") + &t.to_string()[..].trim()
            }
        } else {
            format!("{}", value) + &t.to_string()[..].trim()
        };

        match Regex::new(r"[\dijk]$").unwrap().captures(&out[..]) {
            Some(_) => out,
            None => out + "1"
        }
    }
}
```

In function `format` we collecting these components and decide about joining. We can't join by `+` because of some elements starts from `-`. But we have to handle case of `0`. Finally in `NodeJS` we have:

```typescript
    format(): string {
        let out = [];
        if (this.i) {
            out.push(Quaternion.formatCoefficient('i', this.i));
        }
        if (this.j) {
            out.push(Quaternion.formatCoefficient('j', this.j));
        }
        if (this.k) {
            out.push(Quaternion.formatCoefficient('k', this.k));
        }
        if (this.r) {
            out.push(Quaternion.formatCoefficient('', this.r));
        }

        if (!out.length) return '0';

        return out.reduce((p, n) => p + (
            p.length && Quaternion.getCoefficient('',n.replace(/[kij]/, '')) > 0 ? `+${n}` : `${n}`), ''
        );
    }
```

while in `rust` implementation of formatting can be done by `fmt` function

```rust
impl fmt::Display for Quaternion {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut out: Vec<String> = vec![];
        if self.i != 0f64 {
            out.push(Quaternion::format_coefficient('i', self.i))
        }
        if self.j != 0f64 {
            out.push(Quaternion::format_coefficient('j', self.j))
        }
        if self.k != 0f64 {
            out.push(Quaternion::format_coefficient('k', self.k))
        }
        if self.r != 0f64 {
            out.push(Quaternion::format_coefficient(' ', self.r))
        }

        let out = out.into_iter().reduce(
            |p, n| format!(
                "{}{}",
                p.clone(),
                if p.len() > 0 && Quaternion::get_coefficient(&"", n.replace("i", "").replace("j", "").replace("k", "")) > 0f64 {
                    format!("{}{}", "+", n)
                } else {
                    n
                }
            )
        );

        write!(f, "{}", out.unwrap_or(String::from("0")))
    }
}
```

### Final e2e tests

To check if all parts of programs match to each other we can prepare some `e2e` test cases in `node`

```typescript
    it('e2e', () => {
        const cases = [
            {
                in: '(i+j)(k)',
                out: 'i-j'
            },
            {
                in: '(i+j+20)(j-9)',
                out: '-9i+11j+k-181'
            },
            {
                in: '(10i)(10j-k+1)(-99i+j-10k+7)(4)',
                out: '-520i-38920j+6800k+7920'
            },
            {
                in: '(i+j+k+1)(i+2j+4k+8)(i+3j+9k+27)(i+j+8k+8)(i-j+k-10)(99i-j+k-1)(k)(j)(i)(3)',
                out: '11415288i-8751432j-5206896k+9766704'
            }
        ]
        for (const c of cases) {
            const qs = Quaternion.parse(c.in);
            const out = qs.reduce((p, n) => p.multiply(n)).format();
            expect(out).toEqual(c.out);
        }
    })
```

and analogically in `rust`

```rust
#[test]
    fn e2e() {
        struct Case {
            input: String,
            output: String,
        }

        let cases: Vec<Case> = vec![
            Case {
                input: String::from("(i+j)(k)"),
                output: String::from("i-j"),
            },
            Case {
                input: String::from("(i+j+20)(j-9)"),
                output: String::from("-9i+11j+k-181"),
            },
            Case {
                input: String::from("(10i)(10j-k+1)(-99i+j-10k+7)(4)"),
                output: String::from("-520i-38920j+6800k+7920"),
            },
            Case {
                input: String::from("(i+j+k+1)(i+2j+4k+8)(i+3j+9k+27)(i+j+8k+8)(i-j+k-10)(99i-j+k-1)(k)(j)(i)(3)"),
                output: String::from("11415288i-8751432j-5206896k+9766704"),
            },
        ];
        for c in cases {
            let qs = Quaternion::parse(&c.input[..]);
            let out = qs.into_iter().reduce(|p, n| p.multiply(n)).unwrap();
            assert_eq!(format!("{}", out), c.output);
        }
    }
```

It is the end of this exercise. If you are interested in learning more about Quaternions multiplication and how it is connected with geometry I recommend you video:

As you can see `rust` and `typescript` have a lot of similar elements. All descriptions and logic elements are identical and only differences can be seen on level of syntax, that is more focused on elimination of undefined behaviors in rust. On the other hand in typescript code can be written in a little more concise way that can improve readability.
