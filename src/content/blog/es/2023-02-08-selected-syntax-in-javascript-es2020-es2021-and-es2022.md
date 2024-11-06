---
author: Daniel Gustaw
canonicalName: selected-syntax-in-javascript-es2020-es2021-and-es2022
coverImage: http://localhost:8484/dc12881c-1152-4886-bd6b-32ec7961740c.avif
description: Coalescencia nula, Encadenamiento opcional, Proxies, Campos privados, allSettled, BigInt, Importación dinámica, replaceAll, Separadores numéricos, matchAll, Asignación lógica, Espera de nivel superior
excerpt: Coalescencia nula, Encadenamiento opcional, Proxies, Campos privados, allSettled, BigInt, Importación dinámica, replaceAll, Separadores numéricos, matchAll, Asignación lógica, Espera de nivel superior
publishDate: 2023-02-08 16:39:54+00:00
slug: es/sintaxis-en-javascript
tags:
- javascript
- es6
title: Sintaxis seleccionada en JavaScript ES2020, ES2021 y ES2022
updateDate: 2023-02-08 16:39:54+00:00
---

Javascript es el lenguaje principal. Pero su desarrollo dinámico requiere de mí constantes actualizaciones sobre mi conocimiento acerca de él. En este artículo mostraré algunas sintaxis que he aprendido en los últimos dos años y que no estaban disponibles si conocías JavaScript anteriormente.

Es posible que algunos de ellos te sean conocidos, pero espero que algunos de ellos amplíen tu habilidad en la sintaxis de JS. Para ahorrar tu tiempo, estoy añadiendo una tabla de contenido:

* ES2020 - Coalescencia nula
* ES2020 - Encadenamiento opcional
* ES2015 - Proxies
* ES2022 - Campos privados
* ES2020 - Promise.allSettled
* ES2020 - BigInt
* ES2020 - Importación dinámica
* ES2022 - String.replaceAll
* ES2020 - Separadores numéricos
* ES2020 - String.matchAll
* ES2021 - Asignación lógica
* ES2020 - Promise.any
* ES2022 - Array.prototype.at
* ES2022 - Espera en el nivel superior

![](http://localhost:8484/98e9fea6-990b-4122-bf8d-534cd0124cf5.avif)

## Operador de coalescencia nula ?? \[ más estricto || \]

El operador de coalescencia nula (`??`) en JavaScript ES2020 es un operador lógico que devuelve el operando del lado derecho cuando el operando del lado izquierdo es `null` o `undefined`, y devuelve el operando del lado izquierdo en caso contrario.

Aquí hay un ejemplo de cómo se puede usar el operador de coalescencia nula en JavaScript.

```javascript
let name = userName ?? 'default';
```

En este ejemplo, si `userName` es `null` o `undefined`, el valor de `name` se establecerá en `'default'`. Si `userName` tiene un valor verdadero, el valor de `name` se establecerá en ese valor.

El operador de fusión nula es diferente de las técnicas aplicadas anteriormente, como el operador lógico OR (`||`), en que el operador lógico OR devuelve el operando del lado derecho cuando el operando del lado izquierdo es falso, lo que incluye no solo `null` y `undefined`, sino también valores como `0`, `''` y `false`.

Aquí hay un ejemplo que demuestra la diferencia entre el operador de fusión nula y el operador lógico OR:

```javascript
let name = userName ?? 'default'; // using the nullish coalescing operator
let name = userName || 'default'; // using the logical OR operator
```

En el primer ejemplo, si `userName` es `null` o `undefined`, el valor de `name` se establecerá en `'default'`. En el segundo ejemplo, si `userName` es falsy, el valor de `name` también se establecerá en `'default'`.

Por lo tanto, en resumen, el operador de fusión nula es una forma más estricta y específica de manejar valores predeterminados en JavaScript, en comparación con el operador lógico OR.

![](http://localhost:8484/0cd67446-74e2-4230-ad86-43ac76a47b6c.avif)

## Encadenamiento opcional .? \[ acceso a props menos estricto \]

El encadenamiento opcional en JavaScript es una característica introducida en ECMAScript 2020 que te permite acceder de manera segura a una propiedad de un objeto, un elemento de un array o el valor de retorno de una función y evitar un `TypeError` en caso de acceder a un objeto indefinido o a un valor nulo. Se escribe utilizando la sintaxis `?.` y se puede utilizar para acceder a propiedades anidadas de un objeto.

Por ejemplo, considera el siguiente código que utiliza encadenamiento opcional:

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

Antes de la encadenación opcional, un enfoque común para evitar el `TypeError` era usar el operador `&&` y verificar los valores `null` y `undefined`:

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

La diferencia principal entre la encadenación opcional y este enfoque es que la encadenación opcional es más concisa, legible y expresiva. También es menos propensa a errores, ya que elimina la necesidad de verificar manualmente los valores `null` y `undefined` en cada paso.

## Proxies \[ para metaprogramación como reflexión \]

Un proxy en JavaScript es un objeto que actúa como un intermediario entre un objeto objetivo y el código que interactúa con él. Los proxies se utilizan para interceptar y modificar las operaciones realizadas en el objeto objetivo, como el acceso a propiedades, llamadas a métodos y asignaciones de objetos. Esto los convierte en una herramienta poderosa para agregar comportamiento personalizado a objetos existentes, hacer cumplir restricciones y crear abstracciones.

Un ejemplo de caso de uso de un proxy es agregar un mecanismo de registro a un objeto para rastrear cuándo se acceden a sus propiedades. Aquí hay un ejemplo de cómo se puede hacer esto utilizando un proxy:

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

En este ejemplo, definimos un objeto objetivo y un objeto manejador. El objeto manejador contiene un método `get` que registra un mensaje y devuelve el valor de la propiedad del objeto objetivo. Finalmente, creamos un nuevo objeto proxy pasando el objetivo y el manejador al constructor de `Proxy`. Cuando accedemos a la propiedad `name` del objeto proxy, se llama al método `get` del manejador, registrando el mensaje y devolviendo el valor de la propiedad del objeto objetivo.

Este es un ejemplo de Reflexión - una característica que permite a un programa inspeccionar y manipular su propia estructura y comportamiento en tiempo de ejecución. Esto incluye la introspección de objetos, clases y métodos, así como la modificación de sus propiedades y comportamiento.

En nuestro ejemplo hay `console.log` pero puedes usar cualquier lógica en los trampas `get` o `set`. Por ejemplo, notificando a otras partes del programa sobre cambios o registrando el historial de cambios. El proxy se utiliza extensamente en la implementación de reactividad en marcos de frontend como Vue.

Hay 13 trampas en Proxy que se describen aquí:

[Ver las 13 trampas de Proxy en JavaScript | DigitalOcean](https://www.digitalocean.com/community/tutorials/js-proxy-traps)

Solo mostraré las 3 más populares: `get`, `set` y `has`. En el ejemplo a continuación podemos construir un manejador que nos permita construir objetos que prevengan el acceso a propiedades "privadas".

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

Los proxies merecen un artículo distinto, pero espero que te sientas inspirado para aprender más sobre ellos.

![](http://localhost:8484/d5ed1e3f-839f-45b5-8042-0aa0d73a2daa.avif)

## Campos privados \[ privacidad sin WeakMap y cierres \]

Los campos privados en JavaScript son una característica introducida en ECMAScript 2020 que te permite definir propiedades en un objeto que no son accesibles desde fuera del objeto. Se escriben utilizando un símbolo `#` antes del nombre de la propiedad y solo son accesibles dentro de los métodos del objeto.

Los miembros privados no son nativos del lenguaje antes de que existiera esta sintaxis. En la herencia prototípica, su comportamiento puede ser emulado con objetos [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap#emulating_private_members) o [cierres](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures#emulating_private_methods_with_closures), pero no se pueden comparar con la sintaxis `#` en términos de ergonomía.

Aquí hay un ejemplo de cómo se pueden utilizar campos privados en JavaScript:

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

En este ejemplo, definimos una clase `Person` con un campo privado `#name`. El campo `#name` se asigna un valor en el constructor, y se define un método `getName` para devolver su valor. Cuando intentamos acceder al campo `#name` fuera de la clase `Person`, obtenemos un `SyntaxError` que indica que los campos privados deben ser accesibles dentro de la declaración de la clase.

Los campos privados proporcionan una forma de encapsular el estado interno de un objeto y evitar que sea modificado o accedido directamente. Esto facilita mantener la integridad de los datos del objeto y hacer cumplir sus invariantes internos.

Es genial que se haya introducido esta característica, pero creo que sigue siendo bastante desconocida. A continuación se presentan especificaciones más detalladas:

[Características privadas de clase - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields)

## Promise.allSettled() \[ para programación concurrente \]

El método `Promise.allSettled()` en JavaScript se utiliza para crear una única Promesa que se resuelve cuando todas las promesas en un iterable se han resuelto (ya sea cumplidas o rechazadas). Devuelve un array de objetos que representan el resultado de cada promesa, en lugar de un único valor o un error.

Aquí hay un ejemplo de cómo se puede utilizar `Promise.allSettled()` en JavaScript:

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

En este ejemplo, creamos tres promesas: `p1`, `p2` y `p3`. `p1` es una promesa resuelta con un valor de 42, `p2` es una promesa rechazada con un mensaje de error, y `p3` es una promesa resuelta con un valor de 10. Luego pasamos estas promesas como un iterable a `Promise.allSettled()` y registramos los resultados cuando todas se han resuelto. El resultado es un array de objetos que representan el resultado de cada promesa, con una propiedad `status` que indica si la promesa fue cumplida o rechazada, y una propiedad `value` o `reason` que contiene el resultado o el error.

El método `Promise.allSettled()` es útil cuando deseas esperar a que varias promesas se completen, pero no necesitas conocer el resultado de cada promesa para continuar. A diferencia de `Promise.all()`, que se rechaza con el primer error que ocurre, `Promise.allSettled()` esperará a que todas las promesas se resuelvan antes de resolver, incluso si algunas de ellas son rechazadas.

[Promise.allSettled() - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

![](http://localhost:8484/9ec41cb4-0b3c-4f77-9906-74048d4e67ed.avif)

## BigInt \[ para Matemáticas y grandes Id de bases de datos \]

BigInt es un nuevo tipo primitivo en JavaScript que fue introducido en ECMAScript 2020. Representa un entero de tamaño arbitrario y te permite realizar operaciones aritméticas con valores que pueden ser mayores que el valor máximo seguro del tipo `Number`, que es `2^53 - 1`.

Aquí hay un ejemplo de cómo se puede utilizar BigInt en JavaScript:

```javascript
const a = BigInt(9007199254740992);
const b = BigInt(1);
console.log(a + b); // Output: 9007199254740993n
```

En este ejemplo, creamos dos valores BigInt y realizamos una operación de suma en ellos. El resultado es un valor BigInt que representa con precisión el resultado del cálculo, incluso si supera el valor máximo seguro de entero de `Number`.

Para comparar, al sumar uno a tal `Number` grande, obtendrás un resultado incorrecto.

```javascript
console.log(9007199254740992 + 1); // 9007199254740992
```

Otra diferencia es que los valores de BigInt soportan un conjunto más limitado de operaciones aritméticas y de comparación que los valores de `Number`. Por ejemplo, los valores de BigInt no soportan operaciones como la división por cero, NaN o Infinity.

```javascript
BigInt(1) / BigInt(0); // Uncaught RangeError: Division by zero
```

y

```javascript
BigInt(1) / 0; // Uncaught TypeError: Cannot mix BigInt and other types, use explicit conversions
```

BigInt proporciona una forma de representar y manipular enteros grandes en JavaScript sin la pérdida de precisión que puede ocurrir con el tipo `Number`. Es especialmente útil en casos donde necesitas realizar cálculos con valores que superan el valor máximo seguro de entero de `Number`.

[BigInt - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

![](http://localhost:8484/e6c62d94-225d-4f29-be1e-04a75c8c51c3.avif)

## Importación Dinámica

La Importación Dinámica es una característica en JavaScript que te permite cargar un módulo o un fragmento de código de manera asíncrona en tiempo de ejecución, en lugar de en el momento de analizar y ejecutar el script. Esto te permite cargar solo los recursos que necesitas cuando los necesitas, en lugar de cargar todo de antemano, lo que puede mejorar el rendimiento y el tiempo de carga de tu aplicación.

Aquí hay un ejemplo de cómo se puede utilizar la Importación Dinámica en JavaScript:

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

y

```javascript
async function main() {
  let {hi, bye} = await import('./say.mjs');

  hi();
  bye();
}

console.log("Import not executed yet");
main().catch(console.error);
```

El comando `node index.js` imprimirá

```
Import not executed yet
Now file is imported
Hello
Bye
```

En este ejemplo, usamos la función `import()` para cargar un módulo `module.js` de forma asincrónica. La función `import()` devuelve una Promesa que se resuelve al objeto del módulo, al que luego podemos acceder utilizando desestructuración o la propiedad por defecto.

La Importación Dinámica es diferente de otros tipos de importación (como las declaraciones `import` y `require`) de varias maneras clave:

* Tiempo de Carga: La Importación Dinámica se carga en tiempo de ejecución, cuando se llama a la función `import()`, en lugar de en el momento de analizar el script. Esto significa que el módulo o código solo se carga cuando realmente se necesita, lo que puede mejorar el rendimiento y el tiempo de carga de su aplicación.
* Valor de Retorno: La Importación Dinámica devuelve una Promesa que se resuelve al objeto del módulo, en lugar de al objeto del módulo mismo. Esto le permite cargar el módulo de manera asincrónica y manejar el resultado cuando esté disponible, en lugar de bloquear la ejecución del script mientras se carga el módulo.
* División de Código: La Importación Dinámica permite dividir su código en piezas más pequeñas y manejables que se pueden cargar bajo demanda. Esto puede mejorar el rendimiento y la escalabilidad de su aplicación al reducir la cantidad de código que necesita ser cargado y analizado al inicio de su script.

La Importación Dinámica proporciona una forma flexible y poderosa de cargar código de manera asincrónica en JavaScript, y es particularmente útil para aplicaciones grandes y complejas que necesitan cargar recursos bajo demanda. Al utilizar la Importación Dinámica, puede optimizar el rendimiento y el tiempo de carga de su aplicación, y mejorar la experiencia general del usuario.

Puede aprender más comparando los documentos de la importación estática

[import - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)

Con la importación dinámica descrita aquí

[import() - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)

Gracias a las importaciones dinámicas, puede gestionar tanto el tiempo de importación como el parcheo al módulo importado en tiempo de ejecución, lo que puede ser útil, por ejemplo, si tiene que cargar un diccionario con traducciones de su sitio web o elegir un componente en lugar de todos para mostrar la primera página.

## replaceAll \[ sintaxis concisa para reemplazar con //g \]

El método `String.prototype.replaceAll` en JavaScript es una adición reciente (parte del estándar ECMAScript 2022) que proporciona una manera más directa de realizar operaciones de búsqueda y reemplazo globales en cadenas. A diferencia del método anterior de usar `String.prototype.replace` con una expresión regular y la bandera `g` (global), `String.prototype.replaceAll` proporciona una sintaxis más simple para este caso de uso común.

Por ejemplo, para reemplazar globalmente todas las ocurrencias de una cadena objetivo con otra cadena, puede usar `replaceAll` de la siguiente manera:

```javascript
const originalString = "Hello world! Hello again.";
const newString = originalString.replaceAll("Hello", "Goodbye");
console.log(newString); // Goodbye world! Goodbye again.
```

En comparación, usar `replace` con una expresión regular y la bandera `g` se vería así:

```javascript
const originalString = "Hello world! Hello again.";
const newString = originalString.replace(/Hello/g, "Goodbye");
console.log(newString); // Goodbye world! Goodbye again.
```

Como puedes ver, `replaceAll` proporciona una sintaxis más concisa y legible para este caso de uso común.

## Separadores numéricos \[ azúcar para la legibilidad del código \]

Los separadores numéricos en JavaScript son una adición reciente (parte del estándar ECMAScript 2020) que permite a los desarrolladores hacer que los números grandes sean más fáciles de leer al agregar guiones bajos como separadores entre grupos de dígitos. Los guiones bajos se ignoran durante la evaluación, pero sirven como una ayuda visual para separar los dígitos.

Por ejemplo, en lugar de escribir:

```javascript
const x = 1000000000;
```

Puedes escribir:

```javascript
const x = 1_000_000_000;
```

Esto facilita ver los diferentes grupos de dígitos, especialmente en números grandes. Los separadores numéricos se pueden usar tanto con literales decimales como con literales binarios, octales y hexadecimales.

Aquí hay un ejemplo usando literales binarios:

```javascript
const y = 0b1010_0101_1001_0010;
```

Y aquí hay un ejemplo usando literales hexadecimales:

```javascript
const z = 0xff_ff_ff;
```

En todos los casos, los separadores numéricos se ignoran durante la evaluación, y los valores se almacenan y se utilizan igual que cualquier otro número en JavaScript.

![](http://localhost:8484/080468b3-91ec-407d-b20e-5159e7e12f4c.avif)

## matchAll \[ acceso a coincidencias para regex //g \]

El método `String.prototype.matchAll()` en JavaScript es una adición reciente (parte del estándar ECMAScript 2020) que proporciona una nueva forma de extraer todas las coincidencias de una expresión regular de una cadena. A diferencia del método anterior de usar `String.prototype.match` con una expresión regular, `String.prototype.matchAll` devuelve un iterador que produce todas las coincidencias, en lugar de solo la primera coincidencia o todas las coincidencias como un arreglo.

Por ejemplo, para extraer todas las ocurrencias de una cadena objetivo de una cadena, puedes usar `matchAll` de la siguiente manera:

```javascript
const originalString = "Hello world! Hello again.";
const regex = /Hello/g;
const matches = originalString.matchAll(regex);
```

ahora `matches` es un objeto `RegExpStringIterator`.

![](http://localhost:8484/dc16049c-f1b7-4a89-8699-eddc3e83d19f.avif)

podemos acceder a un solo partido usando `next`

```javascript
m = matches.next()
```

entonces `m` será un objeto con un booleano `done` y `value` que contiene detalles sobre la coincidencia.

![](http://localhost:8484/5427fdde-d4fb-43d6-b8ac-b6d7f6e367f0.avif)

la segunda opción para obtener coincidencias es la iteración

```javascript
for (const match of matches) {
  console.log(match[0]);
}
// Hello
// Hello
```

o

![](http://localhost:8484/5ff51c58-9603-4286-a4e0-eb02af715ced.avif)

En comparación, usar `match` con una expresión regular se vería así:

```javascript
const originalString = "Hello world! Hello again.";
const regex = /Hello/g;
const matches = originalString.match(regex);
console.log(matches); // [ "Hello", "Hello" ]
```

así que `match` está perdiendo acceso a index, input y grupos cuando se usa con la expresión regular `//g`.

Como puedes ver, matchAll proporciona una manera de trabajar con cada coincidencia una a una, en lugar de tener que procesar todas las coincidencias como un arreglo. Esto puede ser útil en ciertos casos, como cuando necesitas realizar un procesamiento adicional en cada coincidencia, o cuando necesitas extraer información de los grupos capturados dentro de cada coincidencia. Además, dado que `matchAll` devuelve un iterador, puedes usarlo en un bucle `for...of`, lo que puede hacer que tu código sea más legible y conciso.

## Asignación Lógica \[ asignación condicional \]

La asignación lógica en JavaScript es una nueva característica (parte del estándar ECMAScript 2021) que te permite simplificar y condensar ciertos tipos de asignaciones que involucran operaciones lógicas. Proporciona una forma abreviada para combinar una asignación con una operación lógica, como `&&` o `||`.

Los operadores de asignación lógica son `&&=`, `||=`, y `??=`. Realizan las mismas operaciones que los operadores lógicos correspondientes, pero con el comportamiento adicional de asignación.

```javascript
x &&= y
```

es equivalente a

```
x && (x = y);
```

Aquí hay un ejemplo usando el operador `&&=`:

```javascript
let x = 1;
x &&= 2;
console.log(x); // 2

x = 0;
x &&= 2;
console.log(x); // 0
```

En el primer caso, `x` se le asigna el valor de `2`, porque `1 && 2` es `2`. En el segundo caso, `x` se le asigna el valor de `0`, porque `0 && 2` es `0`.

Aquí hay un ejemplo utilizando el operador `||=`:

```javascript
let x = null;
x ||= 1;
console.log(x); // 1

x = 2;
x ||= 1;
console.log(x); // 2
```

En el primer caso, `x` se asigna el valor de `1`, porque `null || 1` es `1`. En el segundo caso, `x` se asigna el valor de `2`, porque `2 || 1` es `2`.

Y aquí hay un ejemplo usando el operador `??=`:

```javascript
let x = null;
x ??= 1;
console.log(x); // 1

x = 2;
x ??= 1;
console.log(x); // 2
```

En el primer caso, x se le asigna el valor de 1, porque null ?? 1 es 1. En el segundo caso, x se le asigna el valor de 2, porque 2 ?? 1 es 2. El operador ?? es similar al operador ||, pero solo evalúa la expresión del lado derecho si la expresión del lado izquierdo es null o undefined.

![](http://localhost:8484/7fa48648-26df-4d5a-8137-72a13b00933a.avif)

## Promise.any() \[ para carreras \]

El método `Promise.any()` en JavaScript es una adición reciente (parte del estándar ECMAScript 2020) que te permite esperar a que la primera de varias promesas se resuelva (es decir, se resuelva o se rechace) y luego devolver el resultado de esa promesa. Proporciona una forma de esperar a que varias promesas se completen y devolver la primera que tenga éxito, sin tener que esperar a que todas terminen.

Aquí hay un ejemplo de uso de `Promise.any()`

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

En este ejemplo, el método `Promise.any()` toma un array de promesas como su argumento y devuelve una nueva promesa que se resuelve con el primer valor resuelto de las promesas de entrada. Si todas las promesas de entrada son rechazadas, `Promise.any()` devuelve una promesa rechazada con el primer error que ocurre.

El uso de `Promise.any()` puede simplificar tu código y mejorar el rendimiento en casos donde deseas esperar a que se completen múltiples promesas, pero solo necesitas manejar el resultado de la primera que tenga éxito.

![](http://localhost:8484/d7ba2fa1-1be9-4d7e-a741-956c2fd0c415.avif)

## Array.prototype.at()

El método **`at()`** toma un valor entero y devuelve el elemento en ese índice, permitiendo enteros positivos y negativos. Los enteros negativos cuentan hacia atrás desde el último elemento del arreglo.

```
a = [0,1,2]
a.at(0); // 0
a.at(4); // undefined
a.at(-2); // 1
a.at(Infinity); // undefined
```

Es una buena característica. Antes solía aplicar sintaxis.

```
a[(a.length + n) % a.length]
```

para recibir resultados similares (pero no iguales):

```
a[(a.length + 0) % a.length] // 0 as a.at(0)
a[(a.length + 4) % a.length] // 1
a[(a.length -2) % a.length] // 1
a[(a.length + Infinity) % a.length] // undefined
```

## *Nivel* superior de espera

Este concepto está relacionado con la importación dinámica. Debido a que tu importación se ejecuta en tiempo de ejecución, los objetos exportados pueden ser preparados en tiempo de ejecución. Así que no hay razones para no darles algo de tiempo.

Podemos lograrlo con una sintaxis como esta

```javascript
const colors = fetch("../data/colors.json").then((response) => response.json());

export default await colors;
```

en el módulo importado. Permítanme presentar un ejemplo completo:

```
// file objects.mjs
const res = fetch('https://api.restful-api.dev/objects');

export default await (await res).json();
```

y

```
// file index.js
async function main() {
  let ok = await import('./objects.mjs');
  console.log(ok.default);
}

main().catch(console.error);
```

la ejecución imprimirá en la consola:

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

Puedes leer sobre más características geniales de await aquí:

[await - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)

---

Todo está en este artículo, pero definitivamente solo toqué una pequeña parte de las características actuales de JS y estoy seguro de que este artículo es una peor fuente para aprenderlas que las especificaciones oficiales. Su objetivo fue más bien resumir qué características considero útiles pero que aún son raramente vistas en el código.

Espero que te sientas inspirado o que hayas aprendido algo nuevo y, si es así, haz clic en suscribirte o escribe un comentario. Gracias.
