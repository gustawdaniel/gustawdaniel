---
author: Daniel Gustaw
canonicalName: codingame-derivative-time-part-1-recursion-typescript
coverImage: http://localhost:8484/4fa140be-b4cd-472c-9a33-31181e493f79.avif
updateDate: 2023-01-21 20:31:28+00:00
description: Solution of CodinGame exercise. Simple recursion example with typescript.
  Formula representation inspired by lisp.
excerpt: Solution of CodinGame exercise. Simple recursion example with typescript.
  Formula representation inspired by lisp.
publishDate: 2023-01-21 20:31:28+00:00
slug: en/codingame-derivative-part-1
tags:
- recursion
- typescript
- codingame
title: 'CodinGame: Derivative Time - Part 1, Recursion (Typescript)'
---



Now we will solve exercise `DERIVATIVE TIME`:

[Coding Games and Programming Challenges to Code Better](https://www.codingame.com/training/medium/derivative-time---part1)

Our goal is, evaluate the partial derivative of a given formula.

For instance, given the function formula "(5\*(x\*(y^2)))" and "y x", the variables in respect with you must derive it

So here f(x,y) = 5xy² and you have to calculate:

```
   d²f(x,y)
  ----------
    dxdy
```

it gives you the formula 10\*y. At last "x 2 y 6" means x=2, y=6, gives you the values with which you must evaluate the obtained derivative. So the answer should be 60

**Note**
To simplify the task, only consider **+**, **\*** and **^**. And assume that **+**, **\*** and **^** always take two arguments and that expressions are fully parenthesized.

Negative power has no parenthesis. e.g. (((18\*(x^**\-1**))+y)+z)

vars may be in other forms other than x, y, and z. Similar to identifiers in many programming languages, the var would be some letter followed by letters, numbers or underscore.

link about calculus rules:

[Differentiation rules - Wikipedia](https://wikimedia.org/api/rest_v1/media/math/render/svg/86a67b81c2de995bd608d5b2df50cd8cd7d92455)](https://en.wikipedia.org/wiki/Differentiation_rules)

The rules needed here:

```
a'=0
(a*x)'=a
(x^a)'=a*x^(a-1) (when a is not 0)
(u+v)'=u'+v'
(u*v)'=u'*v+v'*u
```

# Theoretical introduction to derivatives

To compute derivative of function we have to represent function as object possible to manipulate. One of possibilities is representing it as an array with operation placed on the beginning and with arguments occupying rest of positions.

This concept is intensively used in some of the languages as Lisp or Scheme. If you do not know Lisp you can easy learn it in `y` minutes on page:

[Learn Common Lisp in Y Minutes](https://learnxinyminutes.com/docs/common-lisp/)

So instead of write

```
a + b
```

in lisp you will write

```
(+ a b)
```

Our further solution will be heavily based on this concept of ordering. How advantages it have over `a + b`? Firstly we can decompose our expressions by

```typescript
const [operation, ...arguments] = expression;
```

Secondly for [associative](https://mathworld.wolfram.com/Associative.html) operations we can use `reduce` function like

```
const res = arguments.reduce(fn, identity);
```

In this case `identity` is value that will not change result of operation, and `fn` is function assigned to `operation`, eg `(a,b) => a+b` for addition.

Having these basic concept in mind we can consider derivative as function that transform array representing mathematical formula to other array with other formula.

We know which transformations should be applied to addition, multiplication or powers. We also able to simplify result knowing derivatives of constant or identity function.

So lets divide our solution to four steps.

1. Setup project
2. Parsing input
3. Evaluating values
4. Computing derivative

## Setup NodeJS typescript project with jest

Lets init project

```
npm init -y
tsc --init
```

in generated `tsconfigl.json` we have to set

```
"target": "ESNext",
```

to be albe to use `Map` or other modern data structures or syntax.

In `package.json` we should set

```
"test": "jest"
```

in `scripts` section and install required packages.

```
npm i -D @types/jest @types/node esbuild-jest jest ts-node typescript
```

Now lets create `jest` config `jest.config.ts`

```typescript
module.exports = {
    roots: ['<rootDir>'],
    testMatch: ['**/__tests__/**/*.+(ts|tsx)', '**/?(*.)+(spec|test).+(ts|tsx)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'esbuild-jest',
    },
    setupFilesAfterEnv: [],
    testEnvironment: 'node',
}
```

Finally we can create three files: `lib.ts` with:

```typescript
export function run(input: string): string {
    return ''
}
```

Test `test/lib.test.ts` with

```typescript
import {run} from "../lib";

describe('e2e', () => {
    it('temporary', () => {
        expect(run('')).toEqual('')
    })
});
```

and `index.ts` that is responsible for input/output operations

```typescript
import {run} from "./lib";

process.stdin.on('data', (buff) => {
    const input = buff.toString();
    process.stdout.write(run(input));
})
```

Now we should be able to run program using

```
echo '' | ts-node index.ts
```

and test by command

```
npm run test
```

## Parsing Input and building objects

Lets see on input

From content of this exercise we can read that input contains 3 lines:

**Line 1**: formula
**Line 2**: list of vars for partial derivative, separated by space, length of the list will be 1, 2 or 3.
**Line 3**: vars' values, paired and separated by space

Output is the result (always an integer).

So for example input

```
(5*(x*y))
x
x 2 y 6
```

we will have derivative by `x` giving `(5*y)`, that in point `{x:2, y:6}` is `5*6` or simply

```
30
```

Now we will introduce three objects that will refer to these lines:

* Formula
* DiffOperator
* Coordinate

Generally any of these object should be created basing on his line. Only exception is `Formula` that require `variables` from `coordinate` to recognize on arguments and treat them in a special way.

Now `run` function from `lib.ts` can be rewritten as

```typescript
export function run(input: string): string {
    const [F, vs, dict] = input.split('\n');
    const point = new Coordinate(dict);
    const diff = new DiffOperator(vs);
    const formula = new Formula(F, point.variables);

    return diff.actOn(formula).evaluate(point).toString();
}
```

What can be explained as acting derivative operator on function and evaluating it at given point. It is exactly what we need to do in this task.

Now we will implement these classes and write some tests for them

### Coordinate implementation

Lets start from `coordinate`

```typescript
export class Coordinate {
    map: Map<string, number> = new Map();

    constructor(input: string) {
        const pairs = input.split(' ');
        for (let i = 0; i < pairs.length / 2; i++) {
            const [key, value] = [pairs[i * 2], Number.parseFloat(pairs[i * 2 + 1])];
            this.map.set(key, value);
        }
    }

    get variables(): string[] {
        return [...this.map.keys()]
    }

    get(name): number {
        return this.map.get(name) ?? 0;
    }
}
```

It simply splits his string `x 2 y 6` by spaces and move by pairs setting them as keys and values of internal `Map`. It can return both list of keys to help in `Formula` initialization and get singe value of key that is useful in evaluating.

tests for coordinate are the following

```typescript
describe('coordinate', () => {
    it('parsing', () => {
        const point = new Coordinate('x 2 y 6');
        expect(point.variables).toEqual(['x', 'y']);
        expect(point.get('x')).toEqual(2);
        expect(point.get('y')).toEqual(6);
        expect(point.get('undefined')).toEqual(0);
    })
})
```

### Formula initialization

Next object is formula. We need two additional types

```typescript
type Operator = '*' | '^' | '+' | '-';
type SubFormula = Array<string | number | SubFormula> | string | number
```

and can write our formula class

```typescript
export class Formula {
    f: SubFormula;
    v: string[] = [];
}
```

following functions will be placed inside of this class. We need constructor that will get formula string and list of variables. To operate on string form of formula we will define two functions:

* `decomposeInput(input: string): SubFormula`
* `isDecomposable(input: string): boolean`

Firs will do parsing, second will check if should we expand input to elements or should we left it as atomic part of formula.

In our case we need to decompose if string starts and ends with brackets and contains operator

```typescript
    isDecomposable(input: string): boolean {
        return input.startsWith('(') && input.endsWith(')') && /[*^+-]/.test(input)
    }
```

Decomposition contains part that prepare three elements `p` like previous, `n` like next, and operator.

```typescript
decomposeInput(input: string): SubFormula {
        let p: SubFormula = '', operator: Operator | '' = '', n: SubFormula = '', level: number = 0;
        if (!this.isDecomposable(input)) return [0];
        for (let i = 1; i < input.length - 1; i++) {
            if (level === 0 && !operator && /[*^+-]/.test(input[i])) {
                operator = input[i] as Operator;
                continue;
            } else if (input[i] === '(') {
                level++;
            } else if (input[i] === ')') {
                level--;
            }
            if (operator) {
                n += input[i];
            } else {
                p += input[i];
            }
        }
```

we are using `level` to determine which sub bracket level we reaching during loop.

After loop over all characters and completing `p`, `n`, and `operator` we have to check if should we decompose or parse these elements using code

```typescript
        if (this.isDecomposable(p)) {
            p = this.decomposeInput(p);
        } else {
            if (!this.v.includes(p)) {
                p = Number.parseFloat(p);
            }
        }
        if (this.isDecomposable(n)) {
            n = this.decomposeInput(n);
        } else {
            if (!this.v.includes(n)) {
                n = Number.parseFloat(n);
            }
        }
        return [operator, p, n];
    }
```

after defining these functions we can write constructor

```typescript
    constructor(input: string, variables: string[]) {
        this.v = variables;
        this.f = this.decomposeInput(input);
    }
```

and test for them

```typescript
describe('formula', () => {
    const f = new Formula('(5*(x*y))', ['x', 'y']);

    it('parse', () => {
        expect(f.f).toEqual(['*', 5, ['*', 'x', 'y']]);
        expect(f.v).toEqual(['x', 'y']);
    });

    it('parse with many brackets', () => {
        const f = new Formula('((x^3)+(x^2))', ['x']);
        expect(f.f).toEqual(['+', ['^', 'x', 3], ['^', 'x', 2]])
    })
})
```

### DiffOperator (derivateve) initialization

Fortunatelly derivative is super easy to construct

```typescript
export class DiffOperator {
    d: string[] = [];

    constructor(input: string) {
        this.d = input.split(' ');
    }
}
```

inside we want to store array of variables names that we will use seqentially acting on given function.

We can skip tests for it and go to next part - Evaluating values

## Evaluating values

Now we still will write code in `Formula` class.

Our computing function will be able to call themself many times so to simply their interface we will split computation to:

```typescript
static compute(f: SubFormula | string | number, point: Coordinate): number
```

and

```typescript
evaluate(point: Coordinate): number
```

first one will be used to operate directly on `SubFormula`, but second will be layer that was applied in `run` in expression

```typescript
diff.actOn(formula).evaluate(point)
```

evaluate can be defined as

```typescript
    evaluate(point: Coordinate): number {
        return Formula.compute(this.f, point);
    }
```

But `compute` should start from classification of his argument. It can be expression, then `Array.isArray(f)` will be true, number, then this number should be returned od name of coordinate, then coordinate saved in `point` can be returned.

Our code will be the following

```typescript
    static compute(f: SubFormula | string | number, point: Coordinate): number {
        if (Array.isArray(f)) {
            // ... TO BE DEFINED IN NEXT STEP
        } else if (typeof f === 'number') {
            return f;
        } else {
            return point.get(f);
        }
    }
```

Most interesting is case when, `f` is array. Then using theory from introduction we should decompose it to operator and arguments;

```typescript
const [op, ...rest] = f;
```

and in next step in dependence from `operator` arguments can be processed by different functions:

```typescript
switch (op) {
    case '+':
        return <number>rest.reduce((p: number, n: SubFormula): number => p + this.compute(n, point), 0);
    case '*':
        return <number>rest.reduce((p: number, n: SubFormula): number => p * this.compute(n, point), 1);
    case '^': {
        const [p, n] = rest;
        return Math.pow(this.compute(p, point), this.compute(n, point));
    }
    case '-': {
        const [p, n] = rest;
        return this.compute(p,point) - this.compute(n, point);
    }
    default:
        return 0;
}
```

For associative operations like `*` and `+` with existing identity value we used `reduce`. But for rest cases we assumed that there are two arguments and used destructuring.

To prove that it works we can add the following test to `formula` section

```typescript
    it('evaluate', () => {
        expect(f.evaluate(new Coordinate('x 1 y 2'))).toStrictEqual(10);
    });
```

our formula defined ealier was `(5*(x*y))` so we expect result `10`.

If you following all these concepts to this point, then next step will be easy logical continuation for you.

## Computing derivative

Computing derivative will be done in the same style like evaluating value of function. We will split it on two methods Dynamic `actOn` with interface

```typescript
actOn(f: Formula): Formula
```

and static internal function

```typescript
static derivative(s: SubFormula, dir: string): SubFormula
```

First one will iterate over all directions saved in `d` property. Second is first order derivative in direction passed by second argument. These functions works also on other levels: `actOn` will use `Formula` abstraction, but `derivative` need and return `SubFormula` to operate on more low level structure.

We will introduce also one more static function

```typescript
static simplify(s: SubFormula): SubFormula
```

that will not need direction and use simple algebra rules to make computation partial results more human readable and easy to process. Simplify will return the same mathematical formula but written in most simple possible manner removing unnecessary additions of `0` or multiplications by `1`.

Following functions are defined as methods of `DiffOperator`.

### Simplification of formula

Lets start from `simplify` because of I started to explain it. To simplify formulas we will apply the folowing rules:

* all subarguments should be simplified (recursive)
* if all subarguments are numbers, they should be computed
* if one of argument is `0` or `1` special treatment of second argument should be applied in dependence from `operator`

Code that implement described behavior is

```typescript
    static simplify(s: SubFormula): SubFormula {
        if (Array.isArray(s)) {
            const [op, ...rest] = s;
            for (let i = 0; i < rest.length; i++) {
                rest[i] = this.simplify(rest[i]);
            }
            if (rest.every((r) => typeof r === 'number')) {
                return Formula.compute(s, new Coordinate(''));
            }
            if (rest[0] === 0) {
                if (op === '+') return rest[1]
                if (op === '*') return 0
                if (op === '^') return 0
            }
            if (rest[0] === 1) {
                if (op === '*') return rest[1]
                if (op === '^') return 1
            }
            if (rest[1] === 0) {
                if (op === '+') return rest[0]
                if (op === '*') return 0
                if (op === '^') return 1
            }
            if (rest[1] === 1) {
                if (op === '*') return rest[0]
                if (op === '^') return rest[0]
            }
            return [op, ...rest];
        } else {
            return s;
        }
    }
```

### Derivative of formula

To define derivative of first order on given direction:

```typescript
static derivative(s: SubFormula, dir: string): SubFormula
```

we have to assume that we can compute it on

* expression
* our variable
* constant

If it is executed on variable or constant then result will be `1` or `0`, but on expression we have to check `operator` and decide which rule should we apply. This part is exactly the same concept as with evaluation, but we returns arrays with operators that represents functions instead of numbers. Code below:

```typescript
    static derivative(s: SubFormula, dir: string): SubFormula {
        if (Array.isArray(s)) {
            const [op, p, n] = s;
            switch (op) {
                case '*':
                    return ['+', ['*', p, this.derivative(n, dir)], ['*', this.derivative(p, dir), n]];
                case '+':
                    return ['+', this.derivative(p, dir), this.derivative(n, dir)];
                case '-':
                    return ['-', this.derivative(p, dir), this.derivative(n, dir)];
                case '^': {
                    if (p === dir) {
                        if (n === 0) return 0;
                        return typeof n === 'number' ? ['*', n, ['^', p, n - 1]] : ['*', n, ['^', p, ['+', n, -1]]]
                    } else {
                        return 0;
                    }
                }
            }

        } else if (typeof s === 'string' && s === dir) {
            return 1
        } else {
            return 0;
        }
    }
```

we can see that only with powers there is a little confuction, because of I decided to evaluate subtraction `1` on power if it is number. I decided to skip support for `a^x` because of it is exponential function that is out of scope of first part of this exercise.

Finally to implement `actOn` we will need clone of formula, so on formula we should implement

```typescript
    clone(): Formula {
        const o = new Formula('', []);
        o.f = JSON.parse(JSON.stringify(this.f));
        o.v = JSON.parse(JSON.stringify(this.f));
        return o;
    }
```

and then on `DiffOperator`

```typescript
    actOn(f: Formula): Formula {
        const o = f.clone();
        return this.d.reduce((p, n) => {
            o.f = DiffOperator.simplify(DiffOperator.derivative(p.f, n));
            return o;
        }, o);
    }
```

to write stable, editable and working code we should add tests

```typescript
describe('diff operation', () => {
    it('simplify', () => {
        expect(DiffOperator.simplify(["+", ["*", 1, 0], ["*", 0, 1]])).toEqual(0);
        expect(DiffOperator.simplify(['^', 'x', 1])).toEqual('x');
        expect(DiffOperator.simplify(['*', 2, ['^', 'x', 1]])).toEqual(['*', 2, 'x']);
        expect(DiffOperator.simplify(["*", 5, ["+", ["*", "x", 0], ["*", 1, "y"]]])).toEqual(['*', 5, 'y'])
        expect(DiffOperator.simplify(["+", ["*", 5, ["+", ["*", "x", 0], ["*", 1, "y"]]], ["*", 0, ["*", "x", "y"]]])).toEqual(['*', 5, 'y'])
    });
    it('derivative', () => {
        expect(DiffOperator.simplify(DiffOperator.derivative(['*', 2, 'x'], 'x'))).toEqual(2);
        expect(DiffOperator.simplify(DiffOperator.derivative(['*', 5, ['*', 'x', 'y']], 'x'))).toEqual(['*', 5, 'y'])
    })
    it("a'=0", () => {
        const f = new Formula('(1*1)', ['x']);
        const d = new DiffOperator('x');
        expect(d.actOn(f).f).toEqual(0);
    });
    it("(a*x)'=a", () => {
        const f = new Formula('(4*x)', ['x']);
        const d = new DiffOperator('x');
        expect(d.actOn(f).f).toEqual(4);
    });
    it("(x^a)'=a*x^(a-1) (when a is not 0)", () => {
        const cases = [
            {in: '(x^5)', out: ['*', 5, ['^', 'x', 4]]},
            {in: '(x^3)', out: ['*', 3, ['^', 'x', 2]]},
            {in: '(x^2)', out: ['*', 2, 'x']},
        ];
        for (const c of cases) {
            const f = new Formula(c.in, ['x']);
            const d = new DiffOperator('x');
            expect(d.actOn(f).f).toEqual(c.out);
        }
    });
    it("(u+v)'=u'+v for (x+(x^2))'", () => {
        const f = new Formula('(x+(x^2))', ['x']);
        const d = new DiffOperator('x');
        expect(d.actOn(f).f).toEqual(['+', 1, ['*', 2, 'x']]);
    });

    it("(u+v)'=u'+v'", () => {
        const f = new Formula('((x^3)+(x^2))', ['x']);
        const d = new DiffOperator('x');
        console.log("f", f);
        expect(d.actOn(f).f).toEqual(['+', ['*', 3, ['^', 'x', 2]], ['*', 2, 'x']]);
    });
    it("(u*v)'=u'*v+v'*u", () => {
        const f = new Formula('(x*x)', ['x']);
        const d = new DiffOperator('x');
        console.log("f", f);
        expect(d.actOn(f).f).toEqual(['+', 'x', 'x']);
    });

    it('d(8*(y^x))/dy', () => {
        const f = new Formula('(8*(y^x))', ['x', 'y']);
        expect(f.f).toEqual(['*', 8, ['^', 'y', 'x']]);
        expect(DiffOperator.simplify(DiffOperator.derivative(['*', 8, ['^', 'y', 'x']], 'y'))).toEqual(['*', 8, ['*', 'x', ['^', 'y', ['+', 'x', -1]]]]);
    })

    it('(18*(x^-1))',() => {
        const f = new Formula('(18*(x^-1))', ['x']);
        expect(f.f).toEqual(['*', 18, ['^', 'x', -1]]);
        expect(DiffOperator.simplify(DiffOperator.derivative(f.f, 'x'))).toEqual( ['*', 18, ['*', -1, ['^', 'x', -2]]]);
    });

    it('d(((x^2)+(2*(z^5)))+(((18*(x^-1))+y)+z))/dx', () => {
        const f = new Formula('(((x^2)+(2*(z^5)))+(((18*(x^-1))+y)+z))', ['x', 'y', 'z']);
        expect(DiffOperator.simplify(DiffOperator.derivative(f.f, 'x'))).toEqual(['+', ['*', 2, 'x'], ['*', 18, ['*', -1, ['^', 'x', -2]]]]);
    })
})
```

Finally all elements of program works so we can add also `e2e` tests on `run` function

```typescript
describe('e2e', () => {
    it('easy multiply', () => {
        expect(run('(5*(x*y))\nx\nx 2 y 6')).toEqual('30')
    })
    it("second derivative", () => {
        expect(run('(5*((x^4)*(y^2)))\nx x\nx 2 y 6')).toEqual('8640')
    })
    it("second derivative mix", () => {
        expect(run('(5*(x*(y^2)))\ny x\nx 2 y 6')).toEqual('60')
    })
    it("power with number", () => {
        expect(run('((x^2)+(9*(x+y)))\nx\nx 1 y 2')).toEqual('11')
    })
    it("power with variable", () => {
        expect(run('(8*(y^x))\ny y\nx -1 y 2')).toEqual('2')
    })
    it("3 variables", () => {
        expect(run('(((x^2)+(2*(z^5)))+((x+y)+z))\nz\nx 2 y 3 z 4')).toEqual('2561')
    })
    it("fraction", () => {
        expect(run('(((x^2)+(2*(z^5)))+(((18*(x^-1))+y)+z))\nx\nx 3 y 4 z 1')).toEqual('4')
    })
    it("longer multiply", () => {
        expect(run('(((x^2)*(2*(z^5)))*((x+y)+z))\nz\nx 1 y 1 z 1')).toEqual('32')
    })
    it("3rd derivative", () => {
        expect(run('(((y^6)*(z^5))*(((3*(x^4))+y)+z))\ny y z\nx 1 y 1 z 2')).toEqual('16320')
    })
    it("some Greek ;)", () => {
        expect(run('(((Beta^6)*(Gamma^5))*(((3*(Alpha^4))+Beta)+Gamma))\nBeta Beta Gamma\nAlpha 1 Beta 1 Gamma 2')).toEqual('16320')
    })
    it("maybe not xyz ;)", () => {
        expect(run('(((x2^6)*(x3^5))*(((3*(x1^4))+x2)+x3))\nx2 x2 x3\nx1 1 x2 1 x3 2')).toEqual('16320')
    })
    it("some Vars ;)))", () => {
        expect(run('(((Var_2^6)*(Var_3^5))*(((3*(Var_1^4))+Var_2)+Var_3))\nVar_2 Var_2 Var_3\nVar_1 1 Var_2 1 Var_3 2')).toEqual('16320')
    })
    it("bigger constants", () => {
        expect(run('(50*((x^40)*(y^20)))\nx x\nx 1 y 1')).toEqual('78000')
    })
    it("bigger power", () => {
        expect(run('(x^(y^10))\nx x\nx 1 y 2')).toEqual('1047552')
    })
    it("cannot find", () => {
        expect(run('(5*(x*(y^2)))\nz\nx 2 y 6')).toEqual('0')
    })
})
```

and proper github workflow

```yml
name: Node.js CI

on:
  push:
    branches: [ "main" ]

jobs:
  build:

    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test
```

## Further steps

In codingame there is also second part of this exercise:

[Coding Games and Programming Challenges to Code Better](https://www.codingame.com/training/medium/derivative-time---part2)

that will include trigonometric functions, logarithm, exponent and even the chain rule.

You can invite me to your friends on this platform using link:

[https://www.codingame.com/servlet/urlinvite?u=5287657](https://www.codingame.com/servlet/urlinvite?u=5287657)

You can find all presented code on my github:

[GitHub - gustawdaniel/codingame-derivative-time-part-1](https://opengraph.githubassets.com/f239053bc814122dc1c46e68d764599685c1bcf41c7c4651e8f19786982fa0db/gustawdaniel/codingame-derivative-time-part-1)](https://github.com/gustawdaniel/codingame-derivative-time-part-1)
