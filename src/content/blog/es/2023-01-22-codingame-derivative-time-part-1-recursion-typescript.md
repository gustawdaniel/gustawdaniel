---
author: Daniel Gustaw
canonicalName: codingame-derivative-time-part-1-recursion-typescript
coverImage: http://localhost:8484/4fa140be-b4cd-472c-9a33-31181e493f79.avif
description: Solución del ejercicio de CodinGame. Ejemplo simple de recursión con typescript. Representación de fórmulas inspirada en lisp.
excerpt: Solución del ejercicio de CodinGame. Ejemplo simple de recursión con typescript. Representación de fórmulas inspirada en lisp.
publishDate: 2023-01-21 20:31:28+00:00
slug: es/codigo-de-juego-derivada-parte-1
tags:
- recursion
- typescript
- codingame
title: 'CodinGame: Tiempo de Derivadas - Parte 1, Recursión (Typescript)'
updateDate: 2023-01-21 20:31:28+00:00
---

Ahora resolveremos el ejercicio `DERIVATIVE TIME`:

[Juegos de Codificación y Desafíos de Programación para Programar Mejor](https://www.codingame.com/training/medium/derivative-time---part1)

Nuestro objetivo es evaluar la derivada parcial de una fórmula dada.

Por ejemplo, dada la fórmula de función "(5\*(x\*(y^2)))" y "y x", las variables con respecto a las que debes derivar.

Así que aquí f(x,y) = 5xy² y tienes que calcular:

```
   d²f(x,y)
  ----------
    dxdy
```

te da la fórmula 10\*y. Al final "x 2 y 6" significa x=2, y=6, te da los valores con los que debes evaluar la derivada obtenida. Así que la respuesta debería ser 60

**Nota**
Para simplificar la tarea, solo considera **+**, **\*** y **^**. Y asume que **+**, **\*** y **^** siempre toman dos argumentos y que las expresiones están completamente entre paréntesis.

La potencia negativa no tiene paréntesis. p.ej. (((18\*(x^**\-1**))+y)+z)

Las variables pueden estar en otras formas además de x, y y z. Similar a los identificadores en muchos lenguajes de programación, la var sería alguna letra seguida de letras, números o guiones bajos.

enlace sobre reglas de cálculo:

[Reglas de diferenciación - Wikipedia](https://wikimedia.org/api/rest_v1/media/math/render/svg/86a67b81c2de995bd608d5b2df50cd8cd7d92455)](https://es.wikipedia.org/wiki/Reglas_de_diferenciaci%C3%B3n)

Las reglas necesarias aquí:

```
a'=0
(a*x)'=a
(x^a)'=a*x^(a-1) (when a is not 0)
(u+v)'=u'+v'
(u*v)'=u'*v+v'*u
```

# Introducción teórica a las derivadas

Para calcular la derivada de una función, tenemos que representar la función como un objeto que sea posible manipular. Una de las posibilidades es representarla como un arreglo con la operación colocada al principio y con los argumentos ocupando el resto de las posiciones.

Este concepto se utiliza intensivamente en algunos de los lenguajes como Lisp o Scheme. Si no conoces Lisp, puedes aprenderlo fácilmente en `y` minutos en la página:

[Aprende Common Lisp en Y Minutos](https://learnxinyminutes.com/docs/common-lisp/)

Así que en lugar de escribir

```
a + b
```

en lisp escribirás

```
(+ a b)
```

Nuestra solución adicional se basará en este concepto de ordenamiento. ¿Qué ventajas tiene sobre `a + b`? En primer lugar, podemos descomponer nuestras expresiones mediante

```typescript
const [operation, ...arguments] = expression;
```

En segundo lugar, para operaciones [asociativas](https://mathworld.wolfram.com/Associative.html) podemos usar la función `reduce` así

```
const res = arguments.reduce(fn, identity);
```

En este caso, `identity` es un valor que no cambiará el resultado de la operación, y `fn` es una función asignada a `operation`, por ejemplo, `(a,b) => a+b` para la adición.

Teniendo en cuenta estos conceptos básicos, podemos considerar la derivada como una función que transforma un array que representa una fórmula matemática en otro array con otra fórmula.

Sabemos qué transformaciones deben aplicarse a la adición, multiplicación o potencias. También podemos simplificar el resultado conociendo las derivadas de la función constante o de la función identidad.

Así que dividamos nuestra solución en cuatro pasos.

1. Configurar el proyecto
2. Analizar la entrada
3. Evaluar valores
4. Calcular la derivada

## Configurar el proyecto de NodeJS con TypeScript y Jest

Vamos a inicializar el proyecto.

```
npm init -y
tsc --init
```

en el `tsconfig.json` generado tenemos que establecer

```
"target": "ESNext",
```

para poder usar `Map` u otras estructuras de datos modernas o sintaxis.

En `package.json` debemos establecer

```
"test": "jest"
```

en la sección `scripts` e instalar los paquetes requeridos.

```
npm i -D @types/jest @types/node esbuild-jest jest ts-node typescript
```

Ahora creamos la configuración de `jest` `jest.config.ts`

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

Finalmente, podemos crear tres archivos: `lib.ts` con:

```typescript
export function run(input: string): string {
    return ''
}
```

Prueba `test/lib.test.ts` con

```typescript
import {run} from "../lib";

describe('e2e', () => {
    it('temporary', () => {
        expect(run('')).toEqual('')
    })
});
```

y `index.ts` que es responsable de las operaciones de entrada/salida

```typescript
import {run} from "./lib";

process.stdin.on('data', (buff) => {
    const input = buff.toString();
    process.stdout.write(run(input));
})
```

Ahora deberíamos poder ejecutar el programa usando

```
echo '' | ts-node index.ts
```

y prueba por comando

```
npm run test
```

## Análisis de entrada y construcción de objetos

Veamos la entrada

Del contenido de este ejercicio podemos leer que la entrada contiene 3 líneas:

**Línea 1**: fórmula  
**Línea 2**: lista de variables para la derivada parcial, separadas por espacio, la longitud de la lista será 1, 2 o 3.  
**Línea 3**: valores de las variables, emparejados y separados por espacio  

La salida es el resultado (siempre un entero).  

Así que, por ejemplo, la entrada

```
(5*(x*y))
x
x 2 y 6
```

tendremos la derivada por `x` dando `(5*y)`, que en el punto `{x:2, y:6}` es `5*6` o simplemente

```
30
```

Ahora introduciremos tres objetos que se referirán a estas líneas:

* Fórmula
* DiffOperator
* Coordenada

Generalmente, cualquiera de estos objetos debería ser creado basándose en su línea. La única excepción es `Fórmula` que requiere `variables` de `coordenada` para reconocer los argumentos y tratarlos de una manera especial.

Ahora la función `run` de `lib.ts` puede ser reescrita como

```typescript
export function run(input: string): string {
    const [F, vs, dict] = input.split('\n');
    const point = new Coordinate(dict);
    const diff = new DiffOperator(vs);
    const formula = new Formula(F, point.variables);

    return diff.actOn(formula).evaluate(point).toString();
}
```

Lo que se puede explicar como actuar como operador derivado sobre una función y evaluarlo en un punto dado. Es exactamente lo que necesitamos hacer en esta tarea.

Ahora implementaremos estas clases y escribiremos algunas pruebas para ellas.

### Implementación de coordenadas

Comencemos con `coordenada`

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

Simplemente divide su cadena `x 2 y 6` por espacios y se mueve en pares estableciendo los pares como claves y valores de un `Map` interno. Puede devolver tanto una lista de claves para ayudar en la inicialización de `Formula` como obtener un valor único de la clave que es útil en la evaluación.

Las pruebas para las coordenadas son las siguientes

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

### Inicialización de fórmula

El siguiente objeto es la fórmula. Necesitamos dos tipos adicionales.

```typescript
type Operator = '*' | '^' | '+' | '-';
type SubFormula = Array<string | number | SubFormula> | string | number
```

y puede escribir nuestra clase de fórmula

```typescript
export class Formula {
    f: SubFormula;
    v: string[] = [];
}
```

las siguientes funciones se colocarán dentro de esta clase. Necesitamos un constructor que obtenga la cadena de fórmula y una lista de variables. Para operar sobre la forma de cadena de la fórmula, definiremos dos funciones:

* `decomposeInput(input: string): SubFormula`
* `isDecomposable(input: string): boolean`

La primera realizará el análisis, la segunda verificará si debemos expandir la entrada a elementos o si debemos dejarla como parte atómica de la fórmula.

En nuestro caso, necesitamos descomponer si la cadena comienza y termina con corchetes y contiene un operador.

```typescript
    isDecomposable(input: string): boolean {
        return input.startsWith('(') && input.endsWith(')') && /[*^+-]/.test(input)
    }
```

La descomposición contiene una parte que prepara tres elementos `p` como anterior, `n` como siguiente y operador.

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

estamos usando `level` para determinar en qué nivel de subparéntesis estamos alcanzando durante el bucle.

Después de recorrer todos los caracteres y completar `p`, `n` y `operator`, tenemos que verificar si debemos descomponer o analizar estos elementos utilizando código.

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

después de definir estas funciones podemos escribir el constructor

```typescript
    constructor(input: string, variables: string[]) {
        this.v = variables;
        this.f = this.decomposeInput(input);
    }
```

y pruebe para ellos

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

### Inicialización de DiffOperator (derivada)

Afortunadamente, la derivada es muy fácil de construir.

```typescript
export class DiffOperator {
    d: string[] = [];

    constructor(input: string) {
        this.d = input.split(' ');
    }
}
```

dentro queremos almacenar un array de nombres de variables que utilizaremos secuencialmente actuando sobre la función dada.

Podemos omitir las pruebas para esto y pasar a la siguiente parte - Evaluación de valores

## Evaluación de valores

Ahora todavía escribiremos código en la clase `Formula`.

Nuestra función de computación podrá llamarse a sí misma muchas veces, por lo que para simplificar su interfaz, dividiremos la computación en:

```typescript
static compute(f: SubFormula | string | number, point: Coordinate): number
```

y

```typescript
evaluate(point: Coordinate): number
```

el primero se utilizará para operar directamente en `SubFormula`, pero el segundo será la capa que se aplicó en `run` en la expresión

```typescript
diff.actOn(formula).evaluate(point)
```

evaluar puede definirse como

```typescript
    evaluate(point: Coordinate): number {
        return Formula.compute(this.f, point);
    }
```

Pero `compute` debería comenzar desde la clasificación de su argumento. Puede ser una expresión, entonces `Array.isArray(f)` será verdadero, un número, entonces este número debería ser devuelto o el nombre de la coordenada, luego la coordenada guardada en `point` puede ser devuelta.

Nuestro código será el siguiente

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

Lo más interesante es el caso cuando, `f` es un arreglo. Entonces, utilizando la teoría de la introducción, deberíamos descomponerlo en operador y argumentos;

```typescript
const [op, ...rest] = f;
```

y en el siguiente paso, en función de los argumentos de `operator`, se pueden procesar mediante diferentes funciones:

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

Para operaciones asociativas como `*` y `+` con un valor de identidad existente, utilizamos `reduce`. Pero para los demás casos, asumimos que hay dos argumentos y utilizamos la desestructuración.

Para demostrar que funciona, podemos agregar la siguiente prueba a la sección de `formula`

```typescript
    it('evaluate', () => {
        expect(f.evaluate(new Coordinate('x 1 y 2'))).toStrictEqual(10);
    });
```

nuestra fórmula definida anteriormente fue `(5*(x*y))` así que esperamos un resultado `10`.

Si has seguido todos estos conceptos hasta este punto, entonces el siguiente paso será una continuación lógica fácil para ti.

## Cálculo de la derivada

El cálculo de la derivada se realizará de la misma manera que la evaluación del valor de la función. La dividiremos en dos métodos: Dinámico `actOn` con interfaz

```typescript
actOn(f: Formula): Formula
```

y función interna estática

```typescript
static derivative(s: SubFormula, dir: string): SubFormula
```

El primero iterará sobre todas las direcciones guardadas en la propiedad `d`. El segundo es la derivada de primer orden en la dirección pasada como segundo argumento. Estas funciones también funcionan en otros niveles: `actOn` utilizará la abstracción `Formula`, pero `derivative` necesita y devuelve `SubFormula` para operar en una estructura de nivel más bajo.

También introduciremos una función estática más.

```typescript
static simplify(s: SubFormula): SubFormula
```

que no necesitará dirección y utilizará reglas algebraicas simples para hacer que los resultados parciales de la computación sean más legibles y fáciles de procesar. Simplificar devolverá la misma fórmula matemática, pero escrita de la manera más sencilla posible, eliminando sumas innecesarias de `0` o multiplicaciones por `1`.

Las siguientes funciones se definen como métodos de `DiffOperator`.

### Simplificación de fórmula

Comencemos con `simplify` porque empecé a explicarlo. Para simplificar fórmulas, aplicaremos las siguientes reglas:

* todos los subargumentos deben ser simplificados (recursivamente)
* si todos los subargumentos son números, deben ser calculados
* si uno de los argumentos es `0` o `1`, se debe aplicar un tratamiento especial del segundo argumento dependiendo del `operador`

El código que implementa el comportamiento descrito es

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

### Derivada de la fórmula

Para definir la derivada de primer orden en una dirección dada:

```typescript
static derivative(s: SubFormula, dir: string): SubFormula
```

tenemos que suponer que podemos computarlo en

* expresión
* nuestra variable
* constante

Si se ejecuta en variable o constante, entonces el resultado será `1` o `0`, pero en expresión tenemos que verificar el `operador` y decidir qué regla debemos aplicar. Esta parte es exactamente el mismo concepto que con la evaluación, pero devolvemos arreglos con operadores que representan funciones en lugar de números. Código a continuación:

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

podemos ver que solo con potencias hay un poco de confusión, porque decidí evaluar la resta `1` en potencia si es un número. Decidí omitir el soporte para `a^x` porque es una función exponencial que está fuera del alcance de la primera parte de este ejercicio.

Finalmente, para implementar `actOn` necesitaremos un clon de la fórmula, así que en la fórmula deberíamos implementar

```typescript
    clone(): Formula {
        const o = new Formula('', []);
        o.f = JSON.parse(JSON.stringify(this.f));
        o.v = JSON.parse(JSON.stringify(this.f));
        return o;
    }
```

y luego en `DiffOperator`

```typescript
    actOn(f: Formula): Formula {
        const o = f.clone();
        return this.d.reduce((p, n) => {
            o.f = DiffOperator.simplify(DiffOperator.derivative(p.f, n));
            return o;
        }, o);
    }
```

para escribir código estable, editable y funcional debemos agregar pruebas

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

Finalmente, todos los elementos del programa funcionan, así que también podemos agregar pruebas `e2e` en la función `run`

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

y flujo de trabajo adecuado en github

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

## Pasos adicionales

En codingame también hay una segunda parte de este ejercicio:

[Juegos de codificación y desafíos de programación para codificar mejor](https://www.codingame.com/training/medium/derivative-time---part2)

que incluirá funciones trigonométricas, logaritmos, exponentes e incluso la regla de la cadena.

Puedes invitarme a tus amigos en esta plataforma utilizando el enlace:

[https://www.codingame.com/servlet/urlinvite?u=5287657](https://www.codingame.com/servlet/urlinvite?u=5287657)

Puedes encontrar todo el código presentado en mi github:

[GitHub - gustawdaniel/codingame-derivative-time-part-1](https://opengraph.githubassets.com/f239053bc814122dc1c46e68d764599685c1bcf41c7c4651e8f19786982fa0db/gustawdaniel/codingame-derivative-time-part-1)](https://github.com/gustawdaniel/codingame-derivative-time-part-1)
