---
author: Daniel Gustaw
canonicalName: retry-policy
coverImage: http://localhost:8484/06db71a6-c569-4d4c-8497-9872e525bcb9.avif
description: Aprende a hacer que los errores aleatorios y no reproducibles ya no sean una amenaza para tu programa.
excerpt: Aprende a hacer que los errores aleatorios y no reproducibles ya no sean una amenaza para tu programa.
publishDate: 2022-06-10T16:14:57.000Z
slug: es/politica-de-reintentos
tags: ['typescript', 'nodejs', 'error']
title: Política de reintentos - Cómo manejar errores aleatorios e impredecibles
updateDate: 2022-06-10T16:14:57.000Z
---

A veces, por diversas razones, los programas informáticos pueden devolver errores extraños que son extremadamente difíciles de reproducir, y su solución no es posible. Sin embargo, si se puede lograr el funcionamiento correcto del programa después de un número finito de reinicios, esto puede constituir una forma óptima de resolver el problema.

![](http://localhost:8484/80ac4d04-5e5c-40dd-8e24-a8acc023dac4.avif)

Esto es importante, especialmente en sistemas complejos donde múltiples fuentes potenciales de errores se acumulan, y volver a intentar la invocación de funciones defectuosas reduce la probabilidad de un error al cuadrarla.

En este artículo, mostraré cómo, utilizando el paquete `ts-retry` y el objeto `Proxy`, puedes aumentar la estabilidad de tu código y hacer que el código que rara vez funcionaba devuelva errores solo ocasionalmente.

## Programa que devuelve errores aleatorios

Comencemos implementando una clase de muestra - Rectángulo, que con una cierta probabilidad falla en calcular su área.

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

El argumento de la función `field` es la probabilidad de error.

Ahora veamos cómo sería el uso de un objeto de esta clase y calculemos el número de errores.

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

después de habilitar esta función, vemos que aproximadamente cada décimo resultado es incorrecto

```json
{ ok: 9035, fail: 965 }
```

Es casi seguro que en 10,000 casos encontraremos al menos un error. Si quisieramos tener una probabilidad de error del 0.1% en 10,000 casos, tendríamos que reducir la probabilidad de un solo error de llamada del 10% al 0.000001%, que es un millón de veces.

Resulta que no solo es posible, sino que ni siquiera tomará mucho tiempo. El tiempo total de ejecución del programa, aplicando el método de reintentos para los errores encontrados, se calcula como

$$
T = T_0 \sum_{n=0}^{\infty} p_e^n = T_0 \exp(p_e) \approx (1+p_e) T_0
$$

En nuestro caso, esto significará que puede haber series de 6 intentos fallidos en fila, pero todo el programa simplemente se ejecutará en promedio solo 1/10 de tiempo adicional en lugar de devolver errores.

## Reducción de Errores en la Salida

Instalemos el paquete `ts-retry` y escribamos el siguiente código:

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

La función `retryPolicy` devuelve un objeto Proxy que se comporta casi como nuestra clase de entrada, pero para la función `field`, devuelve un controlador que intenta invocar esta función de acuerdo con la configuración pasada a `retryPolicy` como segundo argumento.

Si ahora volvemos a la función `main` y reemplazamos:

```typescript
const rec = new Rectangle(1, 2);
```

por

```typescript
const rec = retryPolicy<Rectangle>(new Rectangle(1, 2), {maxTry: 6, delay: 0});
```

es casi seguro que veremos:

```json
{ ok: 10000, fail: 0 }
```

Si queremos que sea cierto, podemos cambiar `maxTry` de `6` a `Infinito`, pero hay una trampa. Tal valor disminuiría la posibilidad de que algún error aleatorio irrecuperable arruine nuestro resultado final, pero con cada intento subsiguiente, la posibilidad de que el error con el que estamos lidiando no sea aleatorio en absoluto y no desaparezca con la próxima iteración aumenta.

A veces, la causa del error puede ser la falta de acceso a algún recurso precisamente porque lo estamos consultando con demasiada frecuencia. En ese caso, vale la pena esperar más tiempo con cada intento subsiguiente. Sin embargo, a menudo encontramos errores que no se pueden simplemente arreglar con el método de "apagarlo y volver a intentarlo". En su caso, un valor demasiado alto de `maxTry` aumenta el tiempo total que el programa dedica a acciones infructuosas.

![](http://localhost:8484/61babd67-eb90-458a-928f-7b929bf00f8c.avif)

Frente a las dificultades para medir las posibilidades de errores y categorizarlos, en muchos casos, en lugar de calcular los parámetros de la `política de reintentos`, se establecen de forma intuitiva.

Es muy razonable variar la política de reintentos dependiendo del tipo de error:

![](http://localhost:8484/9fc3b562-2ac9-4e30-918c-80fa74af3f60.avif)

Desafortunadamente, el paquete `ts-retry` no soporta ni `reintento exponencial` ni un manejo diferente de, por ejemplo, códigos de error, lo que ayuda a decidir qué hacer con este error. Afortunadamente, se han desarrollado paquetes más avanzados durante años. Entre ellos, el más interesante parece ser `ts-retry-promise`, que, a pesar de su baja popularidad, ofrece un buen compromiso entre facilidad de uso y opciones de personalización.

![](http://localhost:8484/90c12071-2e59-4b09-b000-c8fe52afe717.avif)

Puedes leer más sobre estrategias de `retry` óptimas en el artículo del Prof. Douglas Thain - Retroceso Exponencial en Sistemas Distribuidos de 2009.

[Retroceso Exponencial en Sistemas Distribuidos](https://dthain.blogspot.com/2009/02/exponential-backoff-in-distributed.html)

Para usar `ts-retry-promise` para importaciones añadiremos:

```typescript
import {NotRetryableError, RetryConfig, retryDecorator} from "ts-retry-promise";
```

cambiamos `maxTry` a `retries`. Podemos establecer `backoff` como `EXPONENCIAL`, pero todavía tenemos el problema de los errores para los cuales nos gustaría rendirnos sin luchar.

Cambiemos el cuerpo de la función de campo de la siguiente manera.

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

Ahora devuelve dos tipos de errores, `Fallo Aleatorio` para el cual intentaremos reintentar (esto podría ser el código de error 429) y `CRÍTICO` para el cual sabemos que no tiene sentido (por ejemplo, 401).

En `main`, la función `field` ahora toma la probabilidad de un error (n) y la probabilidad de que sea un error crítico (m).

Sin más cambios en `Rectángulo` y `main`, modificaremos la línea en la función `retryPolicy`.

```typescript
return retryAsyncDecorator(target[handler].bind(target), policy)
```

en

```typescript
return retryDecorator(rethrowNotRetryableErrors(target[handler].bind(target)), policy)
```

y añadiremos una función:

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

Su tarea es ocultar la lógica de la traducción de errores devueltos por `Rectangle` a aquellos que difieren en el manejo en el paquete `ts-retry-promise`. De esta manera, dejando el resto del código intacto, podemos afirmar aquí que no intentaremos reintentos con errores que contengan `CRITICAL` en el campo `message`.

El código presentado aquí se puede encontrar en el enlace:

[GitHub - gustawdaniel/blog-retry-policy](https://github.com/gustawdaniel/blog-retry-policy)

## ¿Qué pasa si el error no se puede manejar?

Entonces necesitas informar al usuario final, siguiendo estas reglas:

* no puedes decirles demasiado sobre el error, ya que pueden ser un hacker y explotarlo
* no puedes decirles muy poco, ya que el departamento de soporte no podrá ayudarlos
* no puedes admitir en el mensaje de error que el código no está funcionando... ya sabes por qué
* simplemente mezcla cinismo y honestidad con humor y muéstrales esto:

![](http://localhost:8484/be0b858a-5648-408d-aa10-fc750a896244.avif)
