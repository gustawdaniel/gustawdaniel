---
author: Daniel Gustaw
canonicalName: trpc-super-fast-development-cycle-for-fullstack-typescript-apps
coverImage: http://localhost:8484/7fc824e8-9e03-4665-9108-d9e1439bb971.avif
description: Estamos construyendo un cliente y servidor tRPC con consultas, mutaciones, autenticación y suscripciones. La autenticación para websocket puede ser complicada y en este caso lo es, por lo que se presentan tres enfoques para resolver este problema.
excerpt: Estamos construyendo un cliente y servidor tRPC con consultas, mutaciones, autenticación y suscripciones. La autenticación para websocket puede ser complicada y en este caso lo es, por lo que se presentan tres enfoques para resolver este problema.
publishDate: 2023-03-09 09:17:29+00:00
slug: es/trpc
tags:
- trpc
- websocket
- authorization
title: tRPC - ciclo de desarrollo súper rápido para aplicaciones fullstack en TypeScript
updateDate: 2023-03-09 09:17:29+00:00
---

Hoy aprendí tRPC y me enamoré ❤️ instantáneamente, decidiendo reescribir el proyecto que actualmente estoy desarrollando a este marco.

En pocas palabras, de qué se trata:
1\. Puedes desarrollar un esquema como en gRPC
2\. Pero solo estás limitado a TypeScript (el soporte para Rust está en progreso)
3\. En lugar de protobuf, que es difícil de leer/debuguear, tienes tipos livianos generados a partir de tus validadores (como zod) y resolutores

Finalmente, obtienes el ciclo de desarrollo fullstack más rápido que he visto y solo puedo compararlo con Ruby on Rails.

## Ejemplo mínimo de tRPC con consulta por http

Déjame mostrarte un proyecto mínimo utilizando esta pila.

Empezaremos desde 2 carpetas:

* cliente
* servidor

En `cliente` tenemos que instalar `@trpc/client` y en `servidor` instalamos `@trpc/server` y `zod`.

En `servidor/index.ts` estamos creando el servidor con el esquema generado a partir de nuestro código.

```typescript
import {initTRPC} from '@trpc/server';
import {createHTTPServer} from '@trpc/server/adapters/standalone';
import {z} from 'zod'

export type AppRouter = typeof appRouter;

const t = initTRPC.create();

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
    greet: publicProcedure
        .input(z.string())
        .query(({input}) => ({greeting: `hello, ${input}!`})),
});

createHTTPServer({
    router: appRouter,
}).listen(2022);
```

Mira la línea `export type AppRouter`, esta línea es responsable de exportar el esquema para el cliente. Unas líneas más adelante definimos todas las rutas usando la función `router`.

No solo hay `query`, sino también `mutation` y `subscription`. Pero en nuestro ejemplo tenemos que mostrar un inicio mínimo, así que veamos el código del cliente.

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:2022',
    }),
  ],
});

async function main() {
  const result = await client.greet.query('tRPC');

  // Type safe
  console.log(result.greeting.toUpperCase());
}

void main();
```

Aquí está la importación de `AppRouter` y lo estamos usando como tipo genérico para crear `client`. Así que todos los:

* métodos del cliente
* argumentos de los métodos
* salidas de los métodos

tienen tipado fuerte.

## Autenticación con tRPC

Agreguemos una mutación que solo puede ser realizada por un administrador. Para simplificar, omitiremos jwt / inicio de sesión / registro y consideraremos la situación en la que el cliente puede enviar el encabezado `Authorization` con `ABC` para autorizarlo.

Así que en esta parte aprenderás cómo agregar autorización, middleware y mutaciones.

Vamos a crear `context.ts` en `server`

```typescript
import {inferAsyncReturnType} from '@trpc/server';
import {CreateNextContextOptions} from '@trpc/server/adapters/next';

export async function createContext({req}: CreateNextContextOptions) {
    return {
        auth: req.headers.authorization === 'ABC'
    };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

Ahora podemos cambiar

```typescript
const t = initTRPC.create();
```

a

```typescript
import type { Context } from './context';
export const t = initTRPC.context<Context>().create();
```

Ahora esperamos que en `context` podamos verificar si el usuario está autorizado.

También tienes que añadir `createContext` a las opciones de `createHTTPServer`, así que cambia:

```typescript
createHTTPServer({
    router: appRouter,
}).listen(2022);
```

a

```typescript
import {createContext} from "./context";

createHTTPServer({
    router: appRouter,
    createContext
}).listen(2022);
```

Ahora tenemos 2 opciones. Podemos verificar `auth` en el resolver.

```typescript
secret: t.procedure.query(({ ctx }) => {
    if (!ctx.auth) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return {
      secret: 'sauce',
    };
  }),
```

pero el mejor enfoque probablemente sea agregar esta verificación a un middleware llamado `protectedProcedure`.

Es un poco más de código, pero nos da algunas ventajas.

```typescript
const isAuthed = t.middleware(({ next, ctx }) => {
    if (!ctx.auth) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
        ctx: {
            auth: ctx.auth
        }
    });
});
const protectedProcedure = t.procedure.use(isAuthed);
```

Primero, podemos redefinir nuestro contexto, por ejemplo, encontrando al usuario en la base de datos y convirtiendo el id en un token para el conjunto completo de parámetros del usuario. Además, podemos reutilizar `protectedProcedure` en todos los lugares sin repetir esta verificación cada vez.

Ahora hay un último paso final en el servidor: agregar una nueva ruta a las claves de argumento `router`.

```typescript
secret: protectedProcedure.mutation(() => "access granted")
```

En el cliente podemos usarlo de la siguiente manera:

```typescript
  const unauthorizedError = await client.secret.mutate();
  console.log(unauthorizedError);
```

y veremos un hermoso error no autorizado como este

![](http://localhost:8484/096a9d57-0df1-4356-b9c9-85d8d39a5712.avif)

Para ser autorizado, podemos agregar encabezados en la definición del cliente.

```typescript
const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:2022',
      headers: {
        Authorization: 'ABC'
      }
    }),
  ],
});
```

Si lo dejara en esa forma, tendría que recrear el cliente con nuevos encabezados en cada cambio de encabezado. Afortunadamente, esta forma simple se puede mejorar y podemos escribir de esta manera:

```typescript
const headers: Map<string, string> = new Map<string, string>();

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:2022',
      headers: () => Object.fromEntries(headers)
    }),
  ],
});
```

y decidir sobre la forma de los encabezados dinámicamente en tiempo de ejecución, por ejemplo, configurando `Authorization` mediante

```typescript
headers.set('Authorization', 'ABC');
```

## Tiempo de tiempo real con suscripciones tRPC

En `server` estamos instalando `ws`.

```bash
npm i ws
npm i -D @types/ws
```

A `router` le podemos agregar una nueva suscripción que nos dará tiempo cada segundo.

```typescript
time: publicProcedure.subscription(() => {
        return observable<Date>((emit) => {
            // logic that will execute on subscription start
            const interval = setInterval(() => emit.next(new Date()), 1000);
            // function to clean up and close interval after end of connection
            return () => {
                clearInterval(interval);
            }
        })
    })
```

Ahora tenemos que abrir el servidor `websocket`, así que añadámoslo usando el código:

```
const wss = new ws.Server({
    port: 3001,
});
const handler = applyWSSHandler({ wss, router: appRouter, createContext });
wss.on('connection', (ws) => {
    console.log(`➕➕ Connection (${wss.clients.size})`);
    ws.once('close', () => {
        console.log(`➖➖ Connection (${wss.clients.size})`);
    });
});
console.log('✅ WebSocket Server listening on ws://localhost:3001');
process.on('SIGTERM', () => {
    console.log('SIGTERM');
    handler.broadcastReconnectNotification();
    wss.close();
});
```

Verifiqué en `insomnia` que puedo conectar.

![](http://localhost:8484/2db8b228-51fe-42cb-bc1c-0630fec958cd.avif)

En la carga útil, utilicé un objeto con la forma descrita en la especificación `jsonrpc`.

```json
{
  id: number | string;
  jsonrpc?: '2.0';
  method: 'subscription';
  params: {
    path: string;
    input?: unknown; // <-- pass input of procedure, serialized by transformer
  };
}
```

Así que conectemos nuestro cliente en TypeScript ahora.

Siguiendo la documentación oficial verás un error.

```typescript
ReferenceError: WebSocket is not defined
```

porque `createWSClient` asume que opera en el navegador, pero estamos usando el cliente de nodo en este ejemplo.

![](http://localhost:8484/3daf5f04-8832-43fc-aebc-9d73b5edec9c.avif)

Para solucionarlo tenemos que instalar `ws` y asignarlo al alcance `global`, pero si tu cliente vive en el navegador, puedes omitir este paso.

```bash
npm i ws
npm i -D @types/ws
```

Ahora puedes crear `wsClient`

```typescript
const WebSocket = require('ws');
const wsClient = createWSClient({
    url: `ws://localhost:3001`,
    WebSocket: WebSocket,
});
```

úsalo envolviéndolo en un enlace

```typescript
const client = createTRPCProxyClient<AppRouter>({
    links: [
        wsLink({
            client: wsClient
        }),
    ],
});
```

y finalmente suscríbete para ver la serie de Fechas

```typescript
    client.time.subscribe(undefined, {
        onData: (time) => {
            console.log(time)
        }
    })
```

Desafortunadamente, tienes que eliminar nuestra mutación secreta.

```typescript
await client.secret.mutate();
```

hacerlo funcionar.

![](http://localhost:8484/890537bc-dfee-4334-a30e-a42dd593b854.avif)

## Falta de documentación - autenticación de websocket en tRPC

Ahora nos enfrentamos al problema de proporcionar autenticación a websocket, pero probablemente sepas que los websockets puros no soportan encabezados http. Puedes pasarlos en la solicitud http de handshake que actualizará el protocolo a websocket. Los detalles están descritos en el RFC 6455

[RFC 6455: El Protocolo WebSocket](https://www.rfc-editor.org/rfc/rfc6455)

En proyectos más maduros como apollo server puedes ver que la solicitud de actualización se usa para pasar información de autenticación, pero desafortunadamente ahora tRPC no lo soporta.

De todos modos, puedes dividir tu cliente en partes http y websocket.

```typescript
const client = createTRPCProxyClient<AppRouter>({
    links: [
        splitLink({
            condition: (op) => op.type === 'subscription',
            true:         wsLink({
                client: wsClient
            }),
            false: httpBatchLink({
                url: 'http://localhost:2022',
                headers: () => Object.fromEntries(headers)
            }),
        }),
    ],
});
```

Probablemente la mayoría de las operaciones serán operaciones http, por lo que puedes usar el mecanismo de autenticación descrito anteriormente para consultas y mutaciones. En caso de websocket, puedes usar la carga útil para pasar el token ahora o usar el truco que describo a continuación.

Para darte más contexto, hay un problema abierto:

[feat: Autenticación por Websocket · Issue #3955 · trpc/trpc](https://github.com/trpc/trpc/issues/3955)

Tema interesante pero engañoso en stackoverflow

[Encabezados HTTP en la API de cliente Websockets](https://stackoverflow.com/questions/4361173/http-headers-in-websockets-client-api)

La respuesta con más votos es incorrecta, porque no tiene en cuenta el apretón de manos. Y `ws` lo implementa como tercer argumento, pero no puedes encontrarlo en el README.md oficial.

[GitHub - websockets/ws: Cliente y servidor WebSocket simple de usar, rápido como un rayo y minuciosamente probado para Node.js](https://github.com/websockets/ws)

En el código de `trpc` este tercer argumento se omite

[trpc/wsLink.ts en main · trpc/trpc](https://github.com/trpc/trpc/blob/main/packages/client/src/links/wsLink.ts#L130-L134)

![](http://localhost:8484/7d4e75e8-2862-41cd-863a-2c598ef97cce.avif)

No puedes usar `Sec-WebSocket-Key` porque `ws` lo sobrescribe con un hash aleatorio.

[ws/websocket.js en master · websockets/ws](https://opengraph.githubassets.com/45c5a7f253c0db2b0bc8e3b601909e0a559e4afec84d93eb8c4362b6c8d91cde/websockets/ws)](https://github.com/websockets/ws/blob/master/lib/websocket.js#L717-L723)

![](http://localhost:8484/a40d66b4-2d1e-413a-a4f2-0b4323f2d5a2.avif)

y perder `trpc` pierde esta información.

Hay tres enfoques para resolver este problema.

* pasar el encabezado de autenticación al apretón de manos (fácil, pero restrictivo y no práctico)
* construir un mapa entre los ids de conexión y estos tokens en el servidor (tiene fallas pero funciona)
* pasar el token a cualquier suscripción en la carga útil (menos elegante pero más escalable)

![](http://localhost:8484/677b22ea-a0dc-447a-9c1e-ee5532981fc3.avif)

### Escenario 1: Conocemos el token de autenticación antes de crear el cliente

Este es un escenario que es extremadamente fácil de implementar, pero no práctico. Lo presento solo porque no requiere cambios en el backend y será nuestra prueba de concepto que utilizaremos para mejorar en el siguiente paso.

Construyamos tu Proxy que agregará encabezados de todos modos.

```typescript
const WebSocket = require('ws');

const WebSocketProxy = new Proxy(WebSocket, {
    construct(target, args) {
        return new target(args[0], undefined, {
            headers: Object.fromEntries(headers)
        });
    }
})
```

Este objeto usará los encabezados definidos anteriormente como un mapa en la parte sobre autorización.

```typescript
const headers: Map<string, string> = new Map<string, string>();
```

`args[0]` será tu URL del servidor, y undefined es para el protocolo, no tienes que preocuparte por eso. De todos modos, estaba undefined/saltado.

Pero tenemos que establecer el encabezado mediante

```typescript
headers.set('Authorization', 'ABC');
```

antes de llamar a `createWSClient`.

Ahora puedes usar `WebSocketProxy` en lugar de la implementación original de `Websocket`

```typescript
const wsClient = createWSClient({
    url: `ws://localhost:3001`,
    WebSocket: WebSocketProxy,
});
```

El cliente solo puede tener wsLink.

```typescript
const client = createTRPCProxyClient<AppRouter>({
    links: [
        wsLink({
            client: wsClient
        }),
    ],
});
```

O ser dividido en partes http y websocket.

```typescript
const client = createTRPCProxyClient<AppRouter>({
    links: [
        splitLink({
            condition: (op) => op.type === 'subscription',
            true: wsLink({
                client: wsClient
            }),
            false: httpBatchLink({
                url: 'http://localhost:2022',
                headers: () => Object.fromEntries(headers)
            }),
        }),
    ],
});
```

En el lado del servidor no necesitamos cambios, pero haremos solo una mejora simple. Devolveremos el estado `auth` de la suscripción `time`.

```typescript
time: publicProcedure.subscription(({ctx}) => {
        return observable<{ date: Date, auth: boolean }>((emit) => {
            // logic that will execute on subscription start
            const interval = setInterval(() => emit.next({date: new Date(), auth: ctx.auth}), 1000);
            // function to clean up and close interval after end of connection
            return () => {
                clearInterval(interval);
            }
        })
    })
```

Ahora nuestra función `main` del cliente será la siguiente.

```typescript
async function main() {
    const result = await client.greet.query('tRPC');
    console.log(result.greeting.toUpperCase());

    const secret = await client.secret.mutate();
    console.log(secret);

    client.time.subscribe(undefined, {
        onData: ({auth, date}) => {
            console.log(`I am ${auth ? 'auth' : 'not auth'} at ${date}`)
        }
    })
}
```

deberíamos ver que todas las solicitudes funcionan correctamente y que tenemos acceso al token en el contexto del websocket también.

![](http://localhost:8484/7df97c33-f713-4cbf-b28a-a77824ad76ad.avif)

Pero en un caso de uso real, comienzas la aplicación como un usuario no autenticado, que se autenticará por http y luego abrirá conexiones websocket para operar sobre ellas.

tRPC define la función `tryReconnect` para `wsLink` pero no la expone. Además, sería mejor poder autenticarse sin reconexión y tener un endpoint websocket especial dedicado a inicio de sesión.

### Escenario 2: Nos autenticamos a través del contexto http y pasamos el resultado al contexto websocket

Comencemos con un diseño de alto nivel.

1. Configuraremos nuestra `sec-websocket-key` que podremos guardar y reutilizar en el cliente.
2. Configuraremos un mapa de estas claves y estos estados de autenticación en el cliente.
3. Permitiremos modificar este mapa utilizando solicitudes http con encabezados de autorización.
4. Veremos que en la suscripción websocket, el estado de autenticación se puede obtener utilizando `keys`.

#### Configurando el encabezado con la identificación del cliente

Hay un [pr](https://github.com/websockets/ws/pull/2125) abierto que permitirá anular `sec-websocket-key`, pero ahora, usemos un nombre diferente. `sec-websocket-id` parece ser genial.

Entonces, cuando nuestro cliente comienza (por ejemplo, el usuario ingresa a la url de nuestra página o en nuestro caso, el proceso de node comienza), necesitamos generar id. Me centraré en la implementación de `node`, así que podemos usar `crypto`.

Nuestras nuevas líneas en el cliente serán

```typescript
import crypto from 'crypto';
const id = crypto.randomBytes(16).toString('hex')
headers.set('sec-websocket-id', id);
```

tienes que establecerlos antes de `const wsClient = createWSClient({`.

#### Configuración del mapa de conexiones en el servidor

El punto crucial es que compartimos `headers` para los enlaces `http` y `websocket`. Así que en el servidor `createContext` esperamos ver este encabezado para todos los tipos de solicitudes: tanto las solicitudes http estándar como las solicitudes de actualización http que abrirán el websocket.

Nuestro `context.ts` puede ser reescrito de esta manera:

```typescript
import {inferAsyncReturnType} from '@trpc/server';
import {CreateNextContextOptions} from '@trpc/server/adapters/next';

const authState = new Map<string, boolean>();

export async function createContext({req}: CreateNextContextOptions) {
    console.log(req.headers);
    const auth = req.headers.authorization === 'ABC';
    const id = req.headers['sec-websocket-id'];

    authState.set(id, auth);

    return {
        auth: () => authState.get(id) ?? false,
        id
    };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

así que ahora, no estamos verificando el estado de autenticación en la solicitud actual, sino el último valor guardado en `Map`.

En nuestro escenario hay los siguientes eventos:

* consulta pública
* configuración de token
* mutación privada <– aquí estamos configurando la autenticación a verdadera
* suscripción de websocket <— aquí estamos usando el estado del mapa

Necesitamos ajustes muy pequeños en dos lugares. En la función `isAuthed` necesitamos llamar a la autenticación.

```typescript
const isAuthed = t.middleware(({next, ctx}) => {
    if (!ctx.auth()) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
    }
    return next({
        ctx: {
            auth: ctx.auth
        }
    });
});
```

y en la suscripción tenemos que cambiar `ctx.auth` a `ctx.auth()` también

```typescript
const interval = setInterval(() => emit.next({date: new Date(), auth: ctx.auth()}), 1000);
```

#### Verifiquemos si funciona para el cliente

Para lograr un efecto más dramático, podemos usar `setTimeout` para retrasar la autenticación.

Nuestra función `main` ahora tiene un formulario

```typescript
async function main() {
    const result = await client.greet.query('tRPC');
    console.log(result.greeting.toUpperCase());

    setTimeout(async () => {
        headers.set('Authorization', 'ABC');

        const secret = await client.secret.mutate();
        console.log(secret);
    }, 2000)


    client.time.subscribe(undefined, {
        onData: (ctx) => {
            console.log(`I am ${ctx.auth ? 'auth' : 'not auth'} at ${ctx.date}`)
        }
    })
}
```

y en la consola veo

![](http://localhost:8484/92e2cfd7-6c15-4e2c-8067-4dae29b82213.avif)

#### Escenario 3: Pasar el token en la entrada de suscripción

Para cubrir el problema completamente, estoy presentando el tercer enfoque anterior: pasar el token en la carga útil a la suscripción, en lugar de a las solicitudes de apretón de manos. Podemos modificar nuestro `time`

```typescript
    time: publicProcedure.input(
        z.object({
            token: z.string(),
        }),
    ).subscription(({ctx, input}) => {
        return observable<{ date: Date, ctx_auth: boolean, input_auth: boolean }>((emit) => {
            // logic that will execute on subscription start
            const interval = setInterval(() => emit.next({
                date: new Date(),
                ctx_auth: ctx.auth(),
                input_auth: input.token === 'ABC'
            }), 1000);
            // function to clean up and close interval after end of connection
            return () => {
                clearInterval(interval);
            }
        })
    })
```

y en el lado del cliente

```typescript
    client.time.subscribe({token: 'ABC'}, {
        onData: (ctx) => {
            console.log(`I am ${ctx.input_auth ? 'auth' : 'not auth'} at ${ctx.date}`)
        }
    })
```

## Mejoras recomendadas

Si eres usuario de grpc y de manera similar a `Funwithloops` en este tema de reddit:

[https://www.reddit.com/r/node/comments/117fgb5/trpc\_correct\_way\_to\_authorize\_websocket/](https://www.reddit.com/r/node/comments/117fgb5/trpc_correct_way_to_authorize_websocket/)

piensa en la autenticación de websocket. Deberías considerar esta publicación de blog como un boceto escrito por una persona que aprendió `tRPC` hace unas pocas horas. En un entorno de producción, debes resolver el problema de compartir el estado guardado en `authState` entre tus instancias de backend. Probablemente necesitarás redis para ello. Luego debes establecer los parámetros `TX` para que no persistan estas claves infinitamente. Nos olvidamos del endpoint de cierre de sesión.

Redis para gestionar la autenticación disminuye el rendimiento en comparación con el `jwt` puro, así que quizás un mejor diseño sería añadir la autenticación a la entrada de tu suscripción, lo cual, por otro lado, es menos legible y requiere más código extra.

Debes saber que `trpc` no implementa la opción `lazy` para el cliente de websocket que está disponible en Apollo y que simplificaría nuestro primer escenario que describí aquí.

Esta tecnología es super caliente, pero aún está en fase de desarrollo y este artículo puede quedar desactualizado pronto.

![](http://localhost:8484/8a800bce-1eff-40a1-8ee9-f6d4fd570fd8.avif)

Si eres uno de los mantenedores de `trpc`, puedes utilizar los conceptos presentados aquí en la documentación oficial o sugerirme un mejor enfoque para la autenticación de websocket en la sección de comentarios.
