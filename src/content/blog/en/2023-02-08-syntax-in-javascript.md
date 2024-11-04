---
author: Daniel Gustaw
canonicalName: selected-syntax-in-javascript-es2020-es2021-and-es2022
coverImage: http://localhost:8484/dc12881c-1152-4886-bd6b-32ec7961740c.avif
updateDate: 2023-02-08 16:39:54+00:00
description: Nullish coalescing, Optional chaining, Proxies, Private fields, allSettled,
  BigInt, Dynamic Import, replaceAll, Numeric Separators, matchAll, Logical Assignment,
  Top level await
excerpt: Nullish coalescing, Optional chaining, Proxies, Private fields, allSettled,
  BigInt, Dynamic Import, replaceAll, Numeric Separators, matchAll, Logical Assignment,
  Top level await
publishDate: 2023-02-08 16:39:54+00:00
slug: en/syntax-in-javascript
tags:
- javascript
- es6
title: Selected syntax in JavaScript ES2020, ES2021 and ES2022
---



Javascript is main primary language. But his dynamic development insist from me constant updates of my knowledge about it. In this article I will show few syntax that I learned in last two years and which was not available if you get know JavaScript earlier.

It is possible that some of them are known for you, but I hope that some of them will extend your skill in JS syntax. To save your time I am adding table of content:

* ES2020 - Nullish coalescing
* ES2020 - Optional chaining
* ES2015 - Proxies
* ES2022 - Private fields
* ES2020 - Promise.allSettled
* ES2020 - BigInt
* ES2020 - Dynamic Import
* ES2022 - String.replaceAll
* ES2020 - Numeric Separators
* ES2020 - String.matchAll
* ES2021 - Logical Assignment
* ES2020 - Promise.any
* ES2022 - Array.prototype.at
* ES2022 - Top level await

![](http://localhost:8484/98e9fea6-990b-4122-bf8d-534cd0124cf5.avif)

## Nullish coalescing operator ?? \[ more strict || \]

The nullish coalescing operator (`??`) in JavaScript ES2020 is a logical operator that returns the right-hand side operand when the left-hand side operand is `null` or `undefined`, and returns the left-hand side operand otherwise.

Here's an example of how the nullish coalescing operator can be used in JavaScript

```javascript
let name = userName ?? 'default';
```

In this example, if `userName` is `null` or `undefined`, the value of `name` will be set to `'default'`. If `userName` has a truthy value, the value of `name` will be set to that value.

The nullish coalescing operator is different from the previously applied techniques, such as the logical OR operator (`||`), in that the logical OR operator returns the right-hand side operand when the left-hand side operand is falsy, which includes not just `null` and `undefined`, but also values such as `0`, `''`, and `false`.

Here's an example that demonstrates the difference between the nullish coalescing operator and the logical OR operator:

```javascript
let name = userName ?? 'default'; // using the nullish coalescing operator
let name = userName || 'default'; // using the logical OR operator
```

In the first example, if `userName` is `null` or `undefined`, the value of `name` will be set to `'default'`. In the second example, if `userName` is falsy, the value of `name` will also be set to `'default'`.

So, in short, the nullish coalescing operator is a more strict and specific way to handle default values in JavaScript, compared to the logical OR operator.

![](http://localhost:8484/0cd67446-74e2-4230-ad86-43ac76a47b6c.avif)

## Optional chaining .? \[ less strict props access \]

Optional chaining in JavaScript is a feature introduced in ECMAScript 2020 that allows you to access an object property, an array element, or a function return value safely and avoid `TypeError` in case of accessing an undefined object or a null value. It's written using a `?.` syntax and can be used to access nested properties of an object.

For example, consider the following code that uses optional chaining:

```javascript
let obj = {
  prop1: {
    prop2: {
      prop3: 'value'
    }
  }
};

let value = obj?.prop1?.prop2?.prop3;
console.log(value); // Output: "value"
```

Prior to optional chaining, a common approach to avoid the `TypeError` was to use the `&&` operator and check for `null` and `undefined` values:

```javascript
let obj = {
  prop1: {
    prop2: {
      prop3: 'value'
    }
  }
};

let value = obj && obj.prop1 && obj.prop1.prop2 && obj.prop1.prop2.prop3;
console.log(value); // Output: "value"
```

The main difference between optional chaining and this approach is that optional chaining is more concise, readable, and expressive. It's also less error-prone, as it eliminates the need to manually check for `null` and `undefined` values at every step.

## Proxies \[ for metaprogramming like reflection \]

A proxy in JavaScript is an object that acts as an intermediary between a target object and the code that interacts with it. Proxies are used to intercept and modify operations performed on the target object, such as property access, method calls, and object assignments. This makes them a powerful tool for adding custom behavior to existing objects, enforcing constraints, and creating abstractions.

An example use case of a proxy is to add a logging mechanism to an object to track when its properties are accessed. Here's an example of how this can be done using a proxy:

```javascript
let target = { name: 'John Doe' };

let handler = {
  get: function(target, prop) {
    console.log(`Accessing property ${prop}`);
    return target[prop];
  }
};

let proxy = new Proxy(target, handler);

console.log(proxy.name); // Output: Accessing property name
//                           John Doe
```

In this example, we define a target object and a handler object. The handler object contains a `get` method that logs a message and returns the value of the target object's property. Finally, we create a new proxy object by passing the target and the handler to the `Proxy` constructor. When we access the `name` property of the proxy object, the `get` method of the handler is called, logging the message and returning the value of the target object's property.

It is example of Reflection - a feature that allows a program to inspect and manipulate its own structure and behavior at runtime. This includes introspection of objects, classes, and methods, as well as modification of their properties and behavior.

In our example there is `console.log` but you can use any logic in get or set traps. For example notifying other parts of program about change or logging changes history. Proxy is extensively used in implementation of reactivity in frontend frameworks like Vue.

There is 13 traps in Proxy that are described here:

[Looking at All 13 JavaScript Proxy Traps | DigitalOcean](https://www.digitalocean.com/community/tutorials/js-proxy-traps)

I will show only 3 most popular `get`, `set` and `has`. In example below we can build handler that allow us to build objects that prevent to access to "private" properties.

```javascript
function invariant (key, action) {
  if (key[0] === '_') {
    throw new Error(`Invalid attempt to ${action} private "${key}" property`)
  }
}
var handler = {
  get (target, key) {
    invariant(key, 'get')
    return target[key]
  },
  set (target, key, value) {
    invariant(key, 'set')
    return true
  },
  has (target, key) {
    if (key[0] === '_') {
      return false
    }
    return key in target
  }
}
```

Proxies deserve for distinct article, but I hope you feel to be inspired to learn them deeper.

![](http://localhost:8484/d5ed1e3f-839f-45b5-8042-0aa0d73a2daa.avif)

## Private fields \[ privacy without WeakMap and closures \]

Private fields in JavaScript are a feature introduced in ECMAScript 2020 that allow you to define properties on an object that are not accessible from outside of the object. They are written using a `#` symbol before the property name and are only accessible within the object's methods.

Private members are not native to the language before this syntax existed. In prototypical inheritance, its behavior may be emulated with [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap#emulating_private_members) objects or [closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures#emulating_private_methods_with_closures), but they can't compare to the `#` syntax in terms of ergonomics.

Here's an example of how private fields can be used in JavaScript:

```javascript
class Person {
  #name;

  constructor(name) {
    this.#name = name;
  }

  getName() {
    return this.#name;
  }
}

let person = new Person('John Doe');
console.log(person.getName()); // Output: "John Doe"
console.log(person.#name); // Output: SyntaxError: Private field '#name' must be accessed within the class declaration.
```

In this example, we define a `Person` class with a private field `#name`. The `#name` field is assigned a value in the constructor, and a `getName` method is defined to return its value. When we try to access the `#name` field outside of the `Person` class, we get a `SyntaxError` indicating that private fields must be accessed within the class declaration.

Private fields provide a way to encapsulate an object's internal state and prevent it from being modified or accessed directly. This makes it easier to maintain the integrity of the object's data and enforce its internal invariants.

It is great that this feature was introduced but i think it seems to be still quite unknown. More detailed specs below:

[Private class features - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields)

## Promise.allSettled() \[ for concurrent programming \]

The `Promise.allSettled()` method in JavaScript is used to create a single Promise that resolves when all of the promises in an iterable have settled (either fulfilled or rejected). It returns an array of objects that represent the outcome of each promise, rather than a single value or an error.

Here's an example of how `Promise.allSettled()` can be used in JavaScript:

```javascript
let p1 = Promise.resolve(42);
let p2 = Promise.reject(new Error('failed'));
let p3 = Promise.resolve(10);

Promise.allSettled([p1, p2, p3]).then((results) => {
  console.log(results);
  /* Output:
  [
    { status: 'fulfilled', value: 42 },
    { status: 'rejected', reason: Error: failed },
    { status: 'fulfilled', value: 10 }
  ]
  */
});
```

In this example, we create three promises: `p1`, `p2`, and `p3`. `p1` is a resolved promise with a value of 42, `p2` is a rejected promise with an error message, and `p3` is a resolved promise with a value of 10. We then pass these promises as an iterable to `Promise.allSettled()` and log the results when they have all settled. The result is an array of objects that represent the outcome of each promise, with a `status` property that indicates whether the promise was fulfilled or rejected, and a `value` or `reason` property that contains the result or error.

The `Promise.allSettled()` method is useful when you want to wait for multiple promises to complete, but you don't need to know the outcome of each promise in order to continue. Unlike `Promise.all()`, which rejects with the first error that occurs, `Promise.allSettled()` will wait for all promises to settle before resolving, even if some of them are rejected.

[Promise.allSettled() - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

![](http://localhost:8484/9ec41cb4-0b3c-4f77-9906-74048d4e67ed.avif)

## BigInt \[ for Math and huge Id from databases \]

BigInt is a new primitive type in JavaScript that was introduced in ECMAScript 2020. It represents an arbitrarily large integer and allows you to perform arithmetic operations with values that can be larger than the `Number` type's maximum safe integer value of `2^53 - 1`.

Here's an example of how BigInt can be used in JavaScript:

```javascript
const a = BigInt(9007199254740992);
const b = BigInt(1);
console.log(a + b); // Output: 9007199254740993n
```

In this example, we create two BigInt values and perform an addition operation on them. The result is a BigInt value that accurately represents the result of the calculation, even though it exceeds the maximum safe integer value of `Number`.

For comparison adding one to such big `Number` your will get wrong result

```javascript
console.log(9007199254740992 + 1); // 9007199254740992
```

Another difference is that BigInt values support a more limited set of arithmetic and comparison operations than `Number` values. For example, BigInt values do not support operations such as division by zero, NaN, or Infinity.

```javascript
BigInt(1) / BigInt(0); // Uncaught RangeError: Division by zero
```

and

```javascript
BigInt(1) / 0; // Uncaught TypeError: Cannot mix BigInt and other types, use explicit conversions
```

BigInt provides a way to represent and manipulate large integers in JavaScript without the loss of precision that can occur with the `Number` type. It is particularly useful in cases where you need to perform calculations with values that exceed the maximum safe integer value of `Number`.

[BigInt - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

![](http://localhost:8484/e6c62d94-225d-4f29-be1e-04a75c8c51c3.avif)

## Dynamic Import

Dynamic Import is a feature in JavaScript that allows you to load a module or a piece of code asynchronously at runtime, rather than at the time of parsing and executing the script. This allows you to load only the resources that you need when you need them, rather than loading everything upfront, which can improve the performance and load time of your application.

Here's an example of how Dynamic Import can be used in JavaScript:

```javascript
// ? say.mjs
console.log("Now file is imported");

export function hi() {
  console.log(`Hello`);
}

export function bye() {
  console.log(`Bye`);
}

```

and

```javascript
async function main() {
  let {hi, bye} = await import('./say.mjs');

  hi();
  bye();
}

console.log("Import not executed yet");
main().catch(console.error);
```

Command `node index.js` will print

```
Import not executed yet
Now file is imported
Hello
Bye
```

In this example, we use the `import()` function to load a module `module.js` asynchronously. The `import()` function returns a Promise that resolves to the module object, which we can then access using destructuring or the default property.

Dynamic Import is different from the other import types (such as `import` and `require` statements) in a few key ways:

* Load Time: Dynamic Import is loaded at runtime, when the `import()` function is called, rather than at the time of parsing the script. This means that the module or code is only loaded when it is actually needed, which can improve the performance and load time of your application.
* Return Value: Dynamic Import returns a Promise that resolves to the module object, rather than the module object itself. This allows you to load the module asynchronously and handle the result when it is available, rather than blocking the execution of the script while the module is being loaded.
* Code Splitting: Dynamic Import enables you to split your code into smaller, more manageable pieces that can be loaded on demand. This can improve the performance and scalability of your application by reducing the amount of code that needs to be loaded and parsed at the start of your script.

Dynamic Import provides a flexible and powerful way to load code asynchronously in JavaScript, and is particularly useful for large and complex applications that need to load resources on demand. By using Dynamic Import, you can optimize the performance and load time of your application, and improve the overall user experience.

You can learn more comparing docs of static import

[import - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)

With dynamic import described here

[import() - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)

Thanks to dynamic imports you can manage both time of importing and patch to imported module in runtime what can be useful for example if you have to load dictionary with translations of your website or picking one component instead of all to display first page.

## replaceAll \[ concise syntax for replace with //g \]

The `String.prototype.replaceAll` method in JavaScript is a recent addition (part of the ECMAScript 2022 standard) that provides a more straightforward way to perform global search-and-replace operations on strings. Unlike the previous method of using `String.prototype.replace` with a regular expression and the `g` (global) flag, `String.prototype.replaceAll` provides a simpler syntax for this common use case.

For example, to globally replace all occurrences of a target string with another string, you can use `replaceAll` as follows:

```javascript
const originalString = "Hello world! Hello again.";
const newString = originalString.replaceAll("Hello", "Goodbye");
console.log(newString); // Goodbye world! Goodbye again.
```

In comparison, using `replace` with a regular expression and the `g` flag would look like this:

```javascript
const originalString = "Hello world! Hello again.";
const newString = originalString.replace(/Hello/g, "Goodbye");
console.log(newString); // Goodbye world! Goodbye again.
```

As you can see, `replaceAll` provides a more concise and readable syntax for this common use case.

## Numeric Separators \[ sugar for code redability \]

Numeric separators in JavaScript are a recent addition (part of the ECMAScript 2020 standard) that allow developers to make large numbers easier to read by adding underscores as separators between groups of digits. The underscores are ignored during evaluation, but serve as a visual aid to separate the digits.

For example, instead of writing:

```javascript
const x = 1000000000;
```

You can write:

```javascript
const x = 1_000_000_000;
```

This makes it easier to see the different groups of digits, especially in large numbers. Numeric separators can be used with decimal literals as well as binary, octal, and hexadecimal literals.

Here's an example using binary literals:

```javascript
const y = 0b1010_0101_1001_0010;
```

And here's an example using hexadecimal literals:

```javascript
const z = 0xff_ff_ff;
```

In all cases, the numeric separators are ignored during evaluation, and the values are stored and used just like any other number in JavaScript.

![](http://localhost:8484/080468b3-91ec-407d-b20e-5159e7e12f4c.avif)

## matchAll \[ access to matches for //g regex \]

The `String.prototype.matchAll()` method in JavaScript is a recent addition (part of the ECMAScript 2020 standard) that provides a new way to extract all matches of a regular expression from a string. Unlike the previous method of using `String.prototype.match` with a regular expression, `String.prototype.matchAll` returns an iterator that yields all matches, rather than just the first match or all matches as an array.

For example, to extract all occurrences of a target string from a string, you can use `matchAll` as follows:

```javascript
const originalString = "Hello world! Hello again.";
const regex = /Hello/g;
const matches = originalString.matchAll(regex);
```

now `matches` is object `RegExpStringIterator`.

![](http://localhost:8484/dc16049c-f1b7-4a89-8699-eddc3e83d19f.avif)

we can get acess to single match by `next`

```javascript
m = matches.next()
```

then `m` will be object with bolean `done` and `value` that contains details about match.

![](http://localhost:8484/5427fdde-d4fb-43d6-b8ac-b6d7f6e367f0.avif)

second option to get matches is iteration

```javascript
for (const match of matches) {
  console.log(match[0]);
}
// Hello
// Hello
```

or

![](http://localhost:8484/5ff51c58-9603-4286-a4e0-eb02af715ced.avif)

In comparison, using `match` with a regular expression would look like this:

```javascript
const originalString = "Hello world! Hello again.";
const regex = /Hello/g;
const matches = originalString.match(regex);
console.log(matches); // [ "Hello", "Hello" ]
```

so `match` is losing access to index, input and groups when was used with `//g` regex.

As you can see, matchAll provides a way to work with each match one by one, rather than having to process all matches as an array. This can be useful in certain cases, such as when you need to perform additional processing on each match, or when you need to extract information from the captured groups within each match. Additionally, because `matchAll` returns an iterator, you can use it in a `for...of` loop, which can make your code more readable and concise.

## Logical Assignment \[ conditional assignment \]

Logical assignment in JavaScript is a new feature (part of the ECMAScript 2021 standard) that allows you to simplify and condense certain types of assignments that involve logical operations. It provides a shorthand for combining an assignment with a logical operation, such as `&&` or `||`.

The logical assignment operators are `&&=`, `||=`, and `??=`. They perform the same operations as the corresponding logical operators, but with the added behavior of assignment.

```javascript
x &&= y
```

is equivalent to

```
x && (x = y);
```

Here's an example using the `&&=` operator:

```javascript
let x = 1;
x &&= 2;
console.log(x); // 2

x = 0;
x &&= 2;
console.log(x); // 0
```

In the first case, `x` is assigned the value of `2`, because `1 && 2` is `2`. In the second case, `x` is assigned the value of `0`, because `0 && 2` is `0`.

Here's an example using the `||=` operator:

```javascript
let x = null;
x ||= 1;
console.log(x); // 1

x = 2;
x ||= 1;
console.log(x); // 2
```

In the first case, `x` is assigned the value of `1`, because `null || 1` is `1`. In the second case, `x` is assigned the value of `2`, because `2 || 1` is `2`.

And here's an example using the `??=` operator:

```javascript
let x = null;
x ??= 1;
console.log(x); // 1

x = 2;
x ??= 1;
console.log(x); // 2
```

In the first case, x is assigned the value of 1, because null ?? 1 is 1. In the second case, x is assigned the value of 2, because 2 ?? 1 is 2. The ?? operator is similar to the || operator, but it only evaluates the right-side expression if the left-side expression is null or undefined.

![](http://localhost:8484/7fa48648-26df-4d5a-8137-72a13b00933a.avif)

## Promise.any() \[ for racings \]

The `Promise.any()` method in JavaScript is a recent addition (part of the ECMAScript 2020 standard) that allows you to wait for the first of several promises to settle (i.e., to either resolve or reject), and then return the result of that promise. It provides a way to wait for multiple promises to complete and return the first one that succeeds, without having to wait for all of them to finish.

Here's an example usage of `Promise.any()`

```javascript
const promise1 = Promise.resolve(1);
const promise2 = Promise.reject(new Error("error"));
const promise3 = Promise.resolve(3);

Promise.any([promise1, promise2, promise3])
  .then((value) => {
    console.log(value); // 1
  })
  .catch((error) => {
    console.error(error);
  });
```

In this example, the `Promise.any()` method takes an array of promises as its argument and returns a new promise that is resolved with the first resolved value from the input promises. If all of the input promises are rejected, `Promise.any()` returns a rejected promise with the first error that occurs.

The use of `Promise.any()` can simplify your code and improve performance in cases where you want to wait for multiple promises to complete, but you only need to handle the result of the first one that succeeds.

![](http://localhost:8484/d7ba2fa1-1be9-4d7e-a741-956c2fd0c415.avif)

## Array.prototype.at()

The **`at()`** method takes an integer value and returns the item at that index, allowing for positive and negative integers. Negative integers count back from the last item in the array.

```
a = [0,1,2]
a.at(0); // 0
a.at(4); // undefined
a.at(-2); // 1
a.at(Infinity); // undefined
```

It is nice feature. Before I used to apply syntax

```
a[(a.length + n) % a.length]
```

to recive similar (but not the same) results:

```
a[(a.length + 0) % a.length] // 0 as a.at(0)
a[(a.length + 4) % a.length] // 1
a[(a.length -2) % a.length] // 1
a[(a.length + Infinity) % a.length] // undefined
```

## *Top* level await

This concept is connected with dynamic import. Because of your import is executed in runtime, so exported objects can be prepared in runtime. So there is no reasons to no give them some time.

We can achieve it by syntax like this

```javascript
const colors = fetch("../data/colors.json").then((response) => response.json());

export default await colors;
```

in imported module. Let mi present full example:

```
// file objects.mjs
const res = fetch('https://api.restful-api.dev/objects');

export default await (await res).json();
```

and

```
// file index.js
async function main() {
  let ok = await import('./objects.mjs');
  console.log(ok.default);
}

main().catch(console.error);
```

execution will print in console:

```
[
  {
    id: '1',
    name: 'Google Pixel 6 Pro',
    data: { color: 'Cloudy White', capacity: '128 GB' }
  },
  ...
]
```

You can read about more awesome await features here:

[await - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)

---

It is all in this article, but definitely I touched only small part of current JS features and I am sure that this article is worse source to learn them than official specs . His goal was rather summarize, which features I see as useful but still rarely seen in codebase.

I hope you feel inspired or learned something new and if yes, click subscribe or write comment. Thx
