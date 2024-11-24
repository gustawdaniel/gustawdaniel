---
author: Daniel Gustaw
canonicalName: retry-policy
coverImage: http://localhost:8484/06db71a6-c569-4d4c-8497-9872e525bcb9.avif
description: Learn how to make random, unreproducible errors no longer a threat to your program.
excerpt: Learn how to make random, unreproducible errors no longer a threat to your program.
publishDate: 2022-06-10T16:14:57.000Z
slug: en/retry-policy
tags: ['typescript', 'nodejs', 'error']
title: Retry Policy - How to Handle Random, Unpredictable Errors
updateDate: 2022-06-10T16:14:57.000Z
---

Sometimes, for a variety of reasons, computer programs can return strange errors that are extremely difficult to reproduce, and fixing them is not possible. However, if correct program operation can be achieved after a finite number of restarts, this may constitute an optimal way to solve the problem.

![](http://localhost:8484/80ac4d04-5e5c-40dd-8e24-a8acc023dac4.avif)

This matters, especially in complex systems where multiple potential sources of errors accumulate, and retrying the invocation of faulty functions reduces the likelihood of an error by squaring it.

In this article, I will show how, using the `ts-retry` package and the `Proxy` object, you can increase the stability of your code and make code that rarely worked return errors only occasionally.

## Program returning random errors

Let's start by implementing a sample class - Rectangle, which with a certain probability fails to calculate its area.

```typescript
class Rectangle {
    a: number
    b: number

    constructor(a: number, b: number) {
        this.a = a;
        this.b = b;
    }

    async field(n: number) {
        if (Math.random() > n) {
            return this.a * this.b
        } else {
            throw new Error(`Random Fail`);
        }
    }
}
```

The argument of the `field` function is the probability of error.

Now let's see what the usage of an object of this class would look like and calculate the number of errors.

```typescript
async function main() {
    const rec = new Rectangle(1, 2);
    const res = {
        ok: 0,
        fail: 0
    }

    for (let i = 0; i < 10000; i++) {
        try {
            await rec.field(0.1);
            res.ok++;
        } catch {
            res.fail++;
        }
    }

    console.log(res);
}

main().catch(console.error)
```

after enabling this feature, we see that about every tenth result is incorrect

```json
{ ok: 9035, fail: 965 }
```

It is almost certain that in 10,000 cases we will find at least one error. If we wanted to have an error probability of 0.1% in 10,000 cases, we would have to reduce the chance of a single call error from 10% to 0.000001%, which is a million times.

It turns out that not only is it possible, but it won't even take much time. The total runtime of the program, applying the retry method for the encountered errors, is calculated as

$$
T = T_0 \sum_{n=0}^{\infty} p_e^n = T_0 \exp(p_e) \approx (1+p_e) T_0
$$

In our case, this will mean that there may be series of 6 failed attempts in a row, but the entire program will simply run on average only 1/10 longer instead of returning errors.

## Error Reduction at Output

Let's install the `ts-retry` package and write the following code:

```typescript
import {retryAsyncDecorator} from "ts-retry/lib/cjs/retry/decorators";
import { RetryOptions} from "ts-retry";

export function retryPolicy<T>(obj: any, policy: RetryOptions): T {
    return new Proxy(obj, {
        get(target, handler) {
            if (handler in target) {
                if (handler === 'field') {
                    return retryAsyncDecorator(target[handler].bind(target), policy)
                }
                return target[handler];
            }
        }
    })
}
```

The `retryPolicy` function returns a Proxy object that behaves almost like our input class, but for the `field` function, it returns a handler that attempts to invoke this function according to the configuration passed to `retryPolicy` as the second argument.

If we now go back to the `main` function and replace:

```typescript
const rec = new Rectangle(1, 2);
```

by

```typescript
const rec = retryPolicy<Rectangle>(new Rectangle(1, 2), {maxTry: 6, delay: 0});
```

it is almost certain that we will see:

```json
{ ok: 10000, fail: 0 }
```

If we want it to be certain, we can change `maxTry` from `6` to `Infinity`, but there is a trap. Such a value would indeed lower the chance that some unrecoverable random error will ruin our final result, but with each subsequent attempt, the chance that the error we are dealing with is not random at all and will not disappear with the next iteration increases.

Sometimes, the cause of the error may be a lack of access to some resource precisely because we are querying it too often. In that case, it's worth waiting longer with each subsequent attempt. However, we often encounter errors that cannot simply be fixed with the "turn it off and try again" method. In their case, too high a value of `maxTry` increases the total time the program spends on futile actions.

![](http://localhost:8484/61babd67-eb90-458a-928f-7b929bf00f8c.avif)

In the face of difficulties in measuring the chances of errors and categorizing them, in many cases instead of calculating `retry policy` parameters, they are set intuitively.

It is very reasonable to vary the retry policy depending on the type of error:

![](http://localhost:8484/9fc3b562-2ac9-4e30-918c-80fa74af3f60.avif)

Unfortunately, the `ts-retry` package does not support either `exponential backoff` or different handling of, for example, error codes, which help in deciding what to do with this error. Fortunately, more advanced packages have been developed for years. Among them, the most interesting seems to be `ts-retry-promise`, which, despite its low popularity, offers a good compromise between ease of use and customization options.

![](http://localhost:8484/90c12071-2e59-4b09-b000-c8fe52afe717.avif)

You can read more about optimal `retry` strategies in Prof. Douglas Thain's article - Exponential Backoff in Distributed Systems from 2009.

[Exponential Backoff in Distributed Systems](https://dthain.blogspot.com/2009/02/exponential-backoff-in-distributed.html)

To use `ts-retry-promise` for imports we will add:

```typescript
import {NotRetryableError, RetryConfig, retryDecorator} from "ts-retry-promise";
```

we change `maxTry` to `retries`. We can set `backoff` to `EXPONENTIAL`, but we still have the issue of errors for which we would like to give up without a fight.

Let's change the body of the field function as follows

```typescript
    async field(n: number, m: number) {
        if (Math.random() > n) {
            return this.a * this.b
        } else {
            if(Math.random() > m) {
                throw new Error(`Random Fail`);
            } else {
                throw new Error(`CRITICAL`);
            }
        }
    }
```

It now returns two types of errors, `Random Fail` for which we will attempt to retry (this could be error code 429) and `CRITICAL` for which we know it makes no sense (e.g. 401).

In `main`, the `field` function now takes the chance of an error (n) and the chance that it is a critical error (m).

Without further changes in `Rectangle` and `main`, we will modify the line in the `retryPolicy` function.

```typescript
return retryAsyncDecorator(target[handler].bind(target), policy)
```

on

```typescript
return retryDecorator(rethrowNotRetryableErrors(target[handler].bind(target)), policy)
```

and we will add a function:

```typescript
import {types} from 'util';

function rethrowNotRetryableErrors(fun: any):any {
    return (...args:any) => {
        return fun(...args).catch((err: unknown) => {
            if(types.isNativeError(err)) {
                if(err.message.includes('CRITICAL')) throw new NotRetryableError(err.message);
            }
            throw err;
        })
    }
}
```

Its task is to hide the logic of error translation returned by `Rectangle` to those that differ in handling in the `ts-retry-promise` package. This way, leaving the rest of the code untouched, we can state here that we will not attempt retries with errors containing `CRITICAL` in the `message` field.

The code presented here can be found at the link:

[GitHub - gustawdaniel/blog-retry-policy](https://github.com/gustawdaniel/blog-retry-policy)

## What if the error cannot be handled

Then you need to inform the end user, following these rules:

* you cannot tell them too much about the error, as they may be a hacker and exploit it
* you cannot tell them too little, as the support department will not be able to help them
* you cannot admit in the error message that the code is not working... you know why
* just mix cynicism and honesty with humor and show them this:

![](http://localhost:8484/be0b858a-5648-408d-aa10-fc750a896244.avif)
