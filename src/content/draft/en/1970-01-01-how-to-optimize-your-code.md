---
title: How to optimize your code
slug: how-to-optimize-your-code
publishDate: 1970-01-01T00:00:00.000Z
date_updated: 2021-04-20T19:20:49.000Z
draft: true
---

There are some places where you should optimize code

* when you detected bottleneck
* when you can change algorithmic complexity

And some places when you should not

* when it have negative influence on security
* when it obfuscate code clarity

Of course these are general rules and any challenge has other weights assigned to security, code readability and performance, but idea of this text is the following: There are good and bad code optimizations. I would like to present and discuss both examples.

### Async Await

Lets consider this code

```js
const dt = new Date();
for(let i = 0; i < 120; i++) {
    dt.setDate( dt.getDate() - 1 );
    await prisma.createUserDailyLog({
        name: to,
        tier: Math.ceil(Math.random() * 10),
        user: {connect: {name: to}},
        date: formatEuropeanDate(dt),
        cache: {
            create: {
                float: 100 * Math.random() * Math.exp(- 10 * Math.random()),
                profit: 100 * Math.random() * Math.exp(- 10 * Math.random()),
                total: 100 * Math.random() * Math.exp(- 10 * Math.random())
            }
        }
    })
}
```

In this example we want to save to database some random data. We 120 times sending data to base and waiting for finalization of save. W can do it much better without huge changes:

```
await Promise.all([...new Array(120)].map(async (el, index) => {
    const dt = new Date();
    dt.setDate( dt.getDate() - index );

    return prisma.createUserDailyLog({
        name: to,
        tier: Math.ceil(Math.random() * 10),
        user: {connect: {name: to}},
        date: formatEuropeanDate(dt),
        cache: {
            create: {
                float: 100 * Math.random() * Math.exp(- 10 * Math.random()),
                profit: 100 * Math.random() * Math.exp(- 10 * Math.random()),
                total: 100 * Math.random() * Math.exp(- 10 * Math.random())
            }
        }
    })
}));
```

In this case we are sending all requests to save in one time and waiting for last one will finish.

Time of execution of first example is 1.8 - 2.2 sec, in second case it is 0.26 - 0.34 sec.

It is only 120 records. If it would be 120 000 recored, this method would be bad too.

In my case I am using `MongoDB`. For 120 000 logs I should use `bulkInsert`

> [https://docs.mongodb.com/manual/reference/method/Bulk.insert/](https://docs.mongodb.com/manual/reference/method/Bulk.insert/)

But cost of this solution is worse portability of code. Prisma is ORM and allow to connect with many different databases, so my code is more general than custom Mongo bulk Insert.
