---
author: Daniel Gustaw
canonicalName: login-by-metamask-rest-backend-in-fastify-node-typescript-prisma
coverImage: http://localhost:8484/4063ad62-79ab-432e-94a1-7ec1bbd852b8.avif
description: Estamos construyendo desde cero una API REST en Fastify utilizando MongoDB conectado por Prisma como base de datos, Jest como marco de pruebas y Ether.js para verificar firmas firmadas por Metamask.
excerpt: Estamos construyendo desde cero una API REST en Fastify utilizando MongoDB conectado por Prisma como base de datos, Jest como marco de pruebas y Ether.js para verificar firmas firmadas por Metamask.
publishDate: 2022-11-30 17:23:41+00:00
slug: es/login-por-metamask-backend-rest-en-fastify
tags:
- metamask
- fastify
- nodejs
- typescript
- jest
- prisma
- rest
title: Iniciar sesión con Metamask - Backend Rest en Fastify (Node, Typescript, Prisma)
updateDate: 2022-11-30 17:23:41+00:00
---

Metamask es una billetera de criptomonedas y una puerta de enlace a aplicaciones de blockchain. Se puede instalar como una aplicación móvil o una extensión de navegador. Metamask se puede utilizar para construir un flujo de autorización sin costo, criptográficamente seguro, sin procesar datos personales.

En este blog te mostraré cómo preparar una API REST en Fastify. Para probar, utilizaremos `jest`. Como base de datos seleccionamos `mongodb` conectado por `prisma`. La primera parte describe la configuración del endpoint `version` y la configuración del entorno. Luego mostraremos un diagrama del flujo de autenticación, conectaremos la base de datos e implementaremos todos los endpoints.

## Configuración del Proyecto Node con Typescript

Los primeros comandos en un nuevo proyecto `nodejs` con `typescript` siempre son la inicialización de `package.json`.

```
npm init -y
```

y `tsconfig.json`

```
tsc --init
```

Ahora tenemos que decidir cómo ejecutar nuestro proyecto. Métodos antiguos como `ts-node` con `nodemon` fueron abandonados por mí cuando conocí `ts-node-dev`. Reinicia el proceso de node objetivo cuando cualquiera de los archivos requeridos cambia (como el estándar node-dev) pero comparte el proceso de compilación de Typescript entre reinicios. Esto aumenta significativamente la velocidad de reinicio en comparación con las soluciones mencionadas. En el archivo `package.json`, podemos agregar la línea:

```
    "dev": "ts-node-dev --no-notify --respawn --transpile-only src/index.ts",
```

instalemos `ts-node-dev`

```
npm i -D ts-node-dev
```

en `src/index.ts` podemos agregar contenido

```typescript
async function main() {
    console.log("ok");
}

main().catch(console.error)
```

y ejecútalo por

```
npm run dev
```

Mostrará "ok" y esperará cambios para reaccionar a ellos en tiempo real.

![](http://localhost:8484/7125cc3e-5539-4850-b765-01a1c2dea692.avif)

## Agregar Fastify con el primer endpoint

Fastify es un marco similar a express pero con dos ventajas

* es aproximadamente un 20% más rápido en el procesamiento de solicitudes

![](http://localhost:8484/b8d54d3e-88fc-494a-b406-0c117bb9b4ed.avif)

* es más rápido en desarrollo gracias a simplificaciones útiles en su API

Una desventaja de fastify es una comunidad más pequeña (32 veces más pequeña ahora).

Para instalar `fastify` escribe:

```
npm i fastify
```

Ahora podemos crear `src/fastify.ts` con el contenido:

```typescript
import fastify, {FastifyInstance} from "fastify";

export function getFastifyServer(): FastifyInstance {
    const app = fastify({})

    // there add
    // - endpoints
    // - hooks
    // - middlewares

    return app
}
```

y en `src/index.ts` impórtalo y úsalo para ejecutar el servidor en el puerto seleccionado

```typescript
import { getFastifyServer } from './fastify'

async function main() {
    const app = await getFastifyServer()
    await app.listen({ port: 4200, host: '0.0.0.0' })
    console.log(`Fastify listen on http://localhost:4200/`)
}

main().catch(console.error)
```

Ahora no es muy útil, porque no hemos definido ninguna ruta, middleware o hook para procesar solicitudes. Vamos a hacerlo y definir el endpoint `/`.

## Primer endpoint en Fastify - versión del proyecto

Esta será una ruta pública, pero para no ensuciar el archivo `fastify.ts` crearemos otro `src/routes/version.ts` con el contenido

```typescript
import pJson from '../../package.json'

export class Version {
    static async root() {
        return {
            name: pJson.name,
            version: pJson.version,
        }
    }
}
```

Es una clase simple con un método estático que devuelve un objeto. Fastify lo convertirá en una respuesta con el tipo de contenido `application/json` por nosotros, pero tenemos que habilitar la opción `resolveJsonModule` en `tsconfig.json`

```json
     "resolveJsonModule": true,                        /* Enable importing .json files. */
```

ahora en el centro del archivo `fastify.ts` podemos agregar

```
    app.get('/', Version.root)
```

y solicitud a la ruta principal de nuestro servidor

```
 http -b localhost:4200
```

inicia devuelve respuesta

```json
{
    "name": "metamask-fastify-rest-api",
    "version": "1.0.0"
}
```

![](http://localhost:8484/7ffbbcf3-ef0d-4431-a300-3eec3eb41ccf.avif)

## Pruebas en Jest con esbuild

Si eres programador, más tiempo que un día, eres consciente de lo fácil que es romper tu programa de trabajo al cambiar algo en el código fuente en lugares aleatorios. Afortunadamente, podemos escribir pruebas que demuestren que el código está funcionando como esperamos.

![](http://localhost:8484/b23e01cd-3fbb-473b-8213-5c9c95e64cc1.avif)

En node js, una de las mejores bibliotecas de pruebas es `jest`. Pero para conectarla con TypeScript necesitamos un complemento que transformará archivos `ts`. Es terrible que el más popular `ts-jest` se use 2000 veces más que el aproximadamente 26 veces más rápido `jest-ebuild`. Pero utilicemos la tecnología del futuro: esbuild.

![](http://localhost:8484/42715107-7b7c-4e7a-8388-8d19edb97451.avif)

Nuestro `jest.config.ts` contendrá

```typescript
module.exports = {
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx)', '**/?(*.)+(spec|test).+(ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'jest-esbuild',
  },
  setupFilesAfterEnv: [],
  testEnvironment: 'node',
}
```

Instalemos paquetes

```
npm i -D jest @types/jest jest-esbuild
```

y añade un script `test` en `package.json`

nuestro primer archivo de prueba `test/version.test.ts` puede verse así:

```typescript
import pJson from '../package.json'
import { getFastifyServer } from '../src/fastify'

const correctVersion = { name: pJson.name, version: pJson.version }

describe('i can read version', () => {
  it('from rest api', async () => {
    const server = await getFastifyServer()
    const result = await server.inject({
      method: 'GET',
      path: '/',
    })

    expect(result.body).toEqual(JSON.stringify(correctVersion))
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toContain('application/json')
  })
})
```

Ahora, cuando escribes

```
npm test
```

deberías ver

```bash
 PASS  test/version.test.ts
  i can read version
    ✓ from rest api (14 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.222 s, estimated 1 s
Ran all test suites.
```

![](http://localhost:8484/06115b39-25fc-4a11-93d5-3396d5c05929.avif)

Hemos configurado el servidor fastify con un entorno de desarrollo de recarga en vivo y pruebas súper rápidas configuradas en jest. Creamos el primer endpoint que devuelve el nombre y la versión del servidor en el endpoint raíz. Es hora de describir el flujo de autenticación e implementar las rutas necesarias.

## Diagrama del flujo de autenticación

La idea general es la siguiente. El usuario tiene una clave privada conectada con su dirección de cartera. Podemos guardar esta dirección en la base de datos como su ID único y generar un nonce para él. El nonce es una frase aleatoria simple generada para verificar si el usuario puede firmarla correctamente usando su propia dirección. Si el nonce se filtra, no es nada aterrador, porque nadie podrá firmarlo con la dirección correcta si no posee la clave privada. A continuación, presentamos el diagrama:

![](http://localhost:8484/f6921ccd-2b57-4935-9aa8-18cf7e8296eb.avif)

Así que necesitamos una colección de usuarios solo con `address` y `nonce` y 4 endpoints

* para obtener nonce para una dirección dada
* para registrar una nueva dirección y asignarle nonce
* para iniciar sesión usando dirección, nonce y firma
* para obtener los detalles de mi cuenta usando el token JWT

## Modelo de DB con prisma

Prisma es una gran pieza de software que ayuda a usar la base de datos de manera confiable gracias a los excelentes tipos e interfaces que permiten validar estáticamente todos los lugares en el código cuando usamos la base de datos.

Para instalar prisma necesitaremos dos bibliotecas

```
npm i prisma @prisma/client
```

Ahora escribiendo:

```
npx prisma init
```

podemos generar la configuración inicial.

Se creó un archivo `.env` con `DATABASE_URL` y `prisma/schema.prisma`, que por defecto utiliza postgresql. Necesitamos mongo, así que modifiquemos el archivo con el esquema.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model users {
  id      String @id @default(auto()) @map("_id") @db.ObjectId
  address String @unique
  nonce   String
}
```

y en `.env` podemos seleccionar la dirección de nuestra base de datos mongo

```
DATABASE_URL=mongodb://localhost:27017/web3_bdl
```

![](http://localhost:8484/4116df67-d537-41fe-b933-aff45f28ac77.avif)

### Mongo en Modo de Conjunto de Réplicas

Es importante que Prisma ahora usa Mongo en modo de réplica.

[Replicación — Manual de MongoDB](https://www.mongodb.com/docs/manual/replication/)

Para configurarlo, necesitarás agregar líneas.

```
replication:
  replSetName: rs0
```

a tu configuración de mongodb `/etc/mongod.conf`. Esta ruta depende de tu sistema operativo.

En la cli de `mongo` deberías ejecutar

```
rs.initiate()
```

para configurar un conjunto de réplicas y

```
rs.status()
```

para verificarlo. Tendrás que reiniciar tu servicio de mongo para leer los cambios de la configuración.

### Generación de typescript desde prisma

Si has configurado correctamente mongo y creado modelos de usuario, ejecuta

```
npx prisma generate
```

este comando generará typescript para ayudar con la autocompletación y la validación estática de su código posterior.

### Cliente prisma único para toda la aplicación

Es una buena práctica configurar el punto de acceso a la base de datos en un solo lugar e importarlo desde este archivo en lugar de usar una biblioteca. En nuestro caso, será el archivo `src/storage/prisma.ts`. En este archivo, modificaremos `DATABASE_URL` añadiendo `_test` al final en el entorno de prueba. Gracias a esta modificación, podemos no preocuparnos por un conjunto distinto de variables de entorno para las pruebas y evitar sobrescribir nuestros datos locales durante las pruebas escritas en jest.

```typescript
import {PrismaClient} from "@prisma/client";

function dbUrl() {
    const url = process.env.DATABASE_URL;

    if(!url) throw new Error(`No db url`);

    if(process.env.NODE_ENV === 'test') {
        if(url.includes('?')) {
            throw new Error('test url not implemented for this db')
        }
        return url + '_test'
    } else {
        return url;
    }
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl()
        }
    }
})

export {
    prisma,
    PrismaClient
}
```

Ahora podemos importar prisma desde este lugar y obtener acceso a la base de datos adecuada dependiendo de `NODE_ENV`.

![](http://localhost:8484/e2b309fd-236d-4a82-9995-c6f5e8db7f22.avif)

### Pasando env a process

No hay un último desafío relacionado con la base de datos: pasar la dirección de la base de datos a la aplicación de manera segura. Podemos hacerlo mediante la biblioteca `dotenv`, pero prefiero `Makefile` como punto de acceso a la aplicación porque es una forma más universal y se puede aplicar con `python`, `go`, `ruby` y otros lenguajes de la misma manera. Este es mi `Makefile`

```makefile
include .env
export

node_modules: package.json
	npm i

up: node_modules
	npm run dev
```

así que de ahora en adelante, en lugar de escribir

```
npm run dev
```

puedes escribir

```
make up
```

por supuesto, es la única solución en modo de desarrollo. En producción es mejor pasar las variables de entorno utilizando docker o una solución similar.

## Verificando si existe un usuario con la dirección

El primer paso en nuestro diagrama fue verificar si existe un usuario con la dirección dada y obtener su nonce. Si la dirección no existe, queremos devolver una respuesta de `No encontrado`. Podemos usar un ayudante para crear una respuesta de `noFound` usando `@fastify/sensible`. Instalémoslo:

```
npm i @fastify/sensible
```

ahora podemos importarlo en `src/fastify.ts`

```typescript
import fastifySensible from '@fastify/sensible'
```

y registrar en el cuerpo de la función `getFastifyServer`

```
    app.register(fastifySensible)
```

Para agregar un endpoint que encuentre usuarios por dirección, añade también una línea aquí.

```typescript
    app.get('/users/:address/nonce', User.getNonce)
```

Necesitaremos importar el usuario de `routes`, así que en `src/routes/user.ts` vamos a crear la clase `User` con el método estático `getNonce`, como lo hicimos antes con `version`.

```typescript
import {FastifyRequest} from "fastify";
import {prisma} from "../storage/prisma";

export class User {
    static async getNonce(req: FastifyRequest<{ Params: { address: string } }>, res: FastifyReply) {
        const address = req.params.address;

        const user = await prisma.users.findUnique({
            where: {
                address
            }
        })

        if (!user) return res.notFound()

        return {
            nonce: user.nonce
        }
    }
}
```

Ahora podemos probarlo manualmente.

```
http -b localhost:4200/users/123/nonce
{
    "error": "Not Found",
    "message": "Not Found",
    "statusCode": 404
}
```

pero es mejor escribir pruebas en `jest`. Antes de escribir pruebas, prepararemos el archivo `src/storage/seed.ts` con la función `seed` para limpiar nuestra base de datos.

```typescript
import {prisma} from "./prisma";

export async function seed() {
    await prisma.users.deleteMany();
}
```

Ahora en `test/address.test.ts` podemos escribir pruebas para comprobar si este punto final está funcionando.

```typescript
import { getFastifyServer } from '../src/fastify'
import {seed} from "../src/storage/seed";
import {prisma} from "../src/storage/prisma";

describe('searching user by address', () => {
  it('address not found', async () => {
    await seed();

    const server = await getFastifyServer()
    const result = await server.inject({
      method: 'GET',
      path: '/users/abc/nonce',
    })


    expect(result.statusCode).toEqual(404);
    expect(result.body).toEqual(JSON.stringify({
      statusCode: 404,
      error: "Not Found",
      message: "Not Found"
    }))
  })

  it('address found and nonce is correct', async () => {
    await prisma.users.upsert({
      where: {
        address: "abc"
      },
      create: {
        address: "abc",
        nonce: "secret"
      },
      update: {
        nonce: "secret"
      }
    })

    const server = await getFastifyServer()
    const result = await server.inject({
      method: 'GET',
      path: '/users/abc/nonce',
    })

    expect(result.statusCode).toEqual(200);
    expect(result.body).toEqual(JSON.stringify({
      nonce: 'secret'
    }))

  })
})
```

Aquí cubrimos todos los escenarios posibles.

![](http://localhost:8484/316a676f-2eb0-499f-a8f4-82f9fa59c5f2.avif)

## Registrar usuario usando dirección de billetera

Ahora el usuario puede verificar si su dirección está registrada. Por supuesto, si ve nuestra aplicación por primera vez, no estará registrada, por lo que obtendrá un 404 y intentará registrar su dirección. Vamos a implementar el registro.

Nonce tiene que ser una cadena aleatoria. Para generarlo, utilizaremos el paquete `uid`.

```
npm i uid
```

En `src/routes/user.ts` estamos añadiendo un nuevo método estático a la clase `User`.

```typescript
    static async register(req: FastifyRequest<{
        Body: {
            address: string
        }
    }>, res: FastifyReply) {
        const found = await prisma.users.findUnique({
            where: {
                address: req.body.address
            }
        })

        if (found) return res.code(200).send({
            nonce: found.nonce
        });

        const nonce = uid(20);
        await prisma.users.create({
            data: {
                address: req.body.address,
                nonce,
            }
        })

        return res.code(201).send({
            nonce
        });
    }
```

La lógica aquí es muy simple. Estamos buscando al usuario. Si existe, el código de respuesta es 200. Si no, entonces el usuario se crea y el código de respuesta es 201. En cualquier caso, queremos devolver el nonce del usuario.

En `src/fastify.ts` estamos añadiendo una línea que registrará este manejador.

```typescript
    app.post('/register', User.register)
```

Podemos cubrirlo mediante una prueba de manera similar a como lo hicimos antes.

```typescript
import { getFastifyServer } from '../src/fastify'
import {seed} from "../src/storage/seed";
import {Response } from "light-my-request";

describe('user can register account', () => {
  it('first and second registration', async () => {
    await seed();

    async function registerUser(address: string): Promise<Response> {
      return server.inject({
        method: 'POST',
        path: '/register',
        payload: {
          'address': address
        }
      })
    }

    const server = await getFastifyServer()
    const result1 =await registerUser("abc")

    expect(result1.statusCode).toEqual(201);
    expect(result1.headers['content-type']).toContain("application/json");

    const result2 =await registerUser("abc")

    expect(result2.statusCode).toEqual(200);
    expect(result2.body).toEqual(result1.body);
  })
})
```

![](http://localhost:8484/fe98e588-0f2d-471c-a42f-cf1d1ea328d1.avif)

## Iniciar sesión como usuario mediante un mensaje firmado

Ahora tenemos que implementar la verificación de la firma creada por metamask. Podemos hacerlo usando la función `verifyMessage` proporcionada por la biblioteca `etherjs`.

### Verificación de firma con etherjs

```
npm i ethers
```

en el nuevo archivo `src/auth/getUser.ts` podemos crear algunas funciones auxiliares.

```typescript
import {utils} from "ethers";
import { users} from "@prisma/client";

export function getAddress(nonce: string, signature: string): string {
    return utils.verifyMessage(nonce, signature).toLowerCase()
}

export function verifyUser(user: Pick<users, 'nonce' | 'address'>, signature: string): boolean {
    try {
        return getAddress(user.nonce, signature) === user.address;
    } catch {
        return false;
    }
}
```

primero, nos da la dirección utilizada para firmar el mensaje. Segundo, verifique si esta dirección es la misma que posee nuestro usuario. En `test/auth.test.ts` podemos comprobar si funciona.

```typescript
import {verifyUser, getAddress} from "../src/auth/getUser";

const address = '0xa68701d9b3eb52f0a7248e7b57d484411a60b045';
const nonce = '14b2a79636d81fbb10f9';
const signature = '0x5d8f425c91437148b65f47e9444d91e868d3566d868649fec58c76010c8f01992edd2db3284088d5f5048fc3bc9eff307e0cd1b8b1a2e6c96a2784eb5fd5358d1b';


describe('i can authenticate signature', () => {
    it('auth', () => {
        expect(getAddress(nonce, signature)).toEqual(address)
        expect(verifyUser({nonce, address}, signature)).toBeTruthy();
    })
});
```

valores en la prueba `address`, `nonce` y `signature` se preparan en el navegador.

### Firmar nonce en el navegador usando metamask

Si usas `metamask` puedes obtener la dirección de firma escribiendo en la consola del navegador:

```javascript
ethereum.enable()
```

y luego

```javascript
ethereum.selectedAddress
```

Si quieres firmar nonce, vamos a crear un helper en la consola del navegador:

```javascript
function utf8ToHex(str) {
  return Array.from(str).map(c =>
      c.charCodeAt(0) < 128 ? c.charCodeAt(0).toString(16) :
          encodeURIComponent(c).replace(/\%/g, '').toLowerCase()
  ).join('');
}
```

entonces define nonce

```javascript
nonce = 'abc'
```

y finalmente

```javascript
await ethereum.request({
    method: "personal_sign",
    params: [utf8ToHex(nonce), ethereum.selectedAddress],
  })
```

### Generación de token JWT con datos del usuario

Nuestro siguiente desafío es enviar el token `jwt`. Para crearlo, instalemos dos bibliotecas.

```
npm i jsonwebtoken dayjs
npm i --save-dev @types/jsonwebtoken
```

En `src/auth/getUser.ts` podemos definir el siguiente helper para crear tokens

```typescript
import dayjs from "dayjs";
import jwt from 'jsonwebtoken'

const jwtKey = process.env.JWT_SECRET_KEY ?? 'test';
const issuer = 'I <3 web3'; // name of organization


export function tokenizeUser(user: Pick<users, 'address'>): string {
    return jwt.sign({
        sub: user.address,
        iss: issuer,
        exp: dayjs().add(1, 'month').unix()
    }, jwtKey)
}
```

Estos tokens tendrán una vida útil de `1` mes y contendrán la dirección del usuario y información sobre la organización. En `.env` tenemos que agregar una línea con nuestra clave secreta jwt.

```
JWT_SECRET_KEY=123
```

### Endpoint de inicio de sesión en API REST

Ahora estamos listos para agregar la función `login` a `src/routes/user.ts`

```typescript
import {tokenizeUser, verifyUser} from "../auth/getUser";

// ...

    static async login(req: FastifyRequest<{
        Body: { address: string, sig: string, nonce: string }
    }>, res: FastifyReply) {
        const {address, sig, nonce} = req.body

        if (!address || !sig || !nonce) return res.expectationFailed('invalid body');

        const verified = verifyUser({address, nonce}, sig);
        if (!verified) return res.unauthorized();


        return {
            token: tokenizeUser({address})
        }
    }
```

en `src/fastify.ts` necesitamos registrar la ruta `/login`

```typescript
    app.post('/login', User.login)
```

Ahora podemos agregar la siguiente prueba en `test/auth.test.ts`

```typescript
import {getFastifyServer} from "../src/fastify";
import {seed} from "../src/storage/seed";
import {prisma} from "../src/storage/prisma";
import {Response} from "light-my-request";


    it('and see his token', async () => {
        await seed();
        await prisma.users.create({
            data: {
                address,
                nonce
            },
        })

        async function login(signature: string): Promise<Response> {
            return server.inject({
                method: 'POST',
                path: '/login',
                payload: {
                    address,
                    sig: signature,
                    nonce
                }
            })
        }

        const server = await getFastifyServer()
        const result1 = await login("abc")

        expect(result1.statusCode).toEqual(401);
        expect(result1.body).toEqual(JSON.stringify({
            statusCode: 401, error: "Unauthorized", message: "Unauthorized"
        }));

        const result2 = await login(signature)

        expect(result2.statusCode).toEqual(200);
        expect(result2.body).toEqual(JSON.stringify({
            token: tokenizeUser({address})
        }));
    })
```

![](http://localhost:8484/d1fd89b1-4884-4fe7-9df5-c95a456f3cbe.avif)

## Obtener datos de usuario del token JWT

Finalmente estamos listos para implementar la ruta `/me`, pero será diferente a cualquier otra anterior. No será una ruta pública. Vamos a crear un middleware para proteger esta ruta. En este middleware reconoceremos al usuario y lo añadiremos al objeto `request` durante el procesamiento de esta solicitud.

El primer elemento que falta es la función `getUser`. Definámosla en el archivo `src/auth/getUser.ts`

```typescript
interface JwtPayloadCustomer {
    iss: string
    iat: number
    exp: number
    sub: string
}

function getExpDate(jwtPayload: { exp: number }): Date {
    return dayjs.unix(jwtPayload.exp).toDate()
}

export function getUser(token?: string): JWTUser | null {
    if (!token) {
        return null
    } else {
        token = token.replace(/^Bearer\s+/, '')

        const jwtPayload = jwt.verify(token, jwtKey) as unknown as JwtPayloadCustomer

        const sub = jwtPayload.sub

        return {
            address: sub,
            token_expiring_at: getExpDate(jwtPayload),
        }
    }
}
```

la interfaz devuelta `JWTUser` se puede definir en `src/interfaces/context.ts` como

```typescript
import { PrismaClient } from '../storage/prisma'

export interface JWTUser {
  address: string
  token_expiring_at: Date
}
```

El segundo elemento que falta es la extensión de `FastifyRequest` que permite guardar el usuario entre las propiedades de la solicitud. En `src/fastify.ts` podemos declarar el módulo `fastify` extendiendo `FastifyRequest`.

```typescript
declare module 'fastify' {
    interface FastifyRequest {
        user: JWTUser | null
    }
}
```

Ahora podemos definir la función `auth` que se utilizará en el arreglo `preValidation` como guardia para cualquier ruta privada.

```typescript
async function auth(request: FastifyRequest, reply: FastifyReply) {
    const token = (request.headers.authorization || '').replace(/Bearer\s+/, '') || undefined
    request.user = getUser(token)
    if (!request.user) reply.unauthorized()
}
```

Este middleware `auth` nos asignará un usuario a la solicitud si el token es válido. De lo contrario, responderá con 401.

Formalmente, 401 No Autorizado es el código de estado a devolver cuando el cliente no proporciona credenciales o proporciona credenciales inválidas. 403 Prohibido es el código de estado a devolver cuando un cliente tiene credenciales válidas pero no suficientes privilegios para realizar una acción en un recurso.

Pero por el bien de la simplicidad, omitiremos esta matiz. Ahora podemos registrar `/me` con un guardia de pre validación.

```typescript
    app.get('/me', {preValidation: [auth]}, User.root)
```

y en `src/route/user.ts` agrega un controlador con el nombre `root`.

```
    static async root(req: FastifyRequest, res: FastifyReply) {
        return req.user;
    }
```

Ahora intentemos usarlo. Primero, regístrate con una dirección desde mi navegador.

![](http://localhost:8484/c0280d22-ead4-4f84-a5aa-1d410013046e.avif)

Luego firma `nonce` en el navegador

![](http://localhost:8484/1ebb796e-3494-45c1-93f3-6b70eee435f1.avif)

Iniciar sesión usando firma para obtener un token JWT

![](http://localhost:8484/4f94593d-a657-44e9-a132-2fd13837b3c3.avif)

Y finalmente obtener datos del usuario utilizando la ruta privada `/me`

![](http://localhost:8484/d60b400a-02e8-4c61-b5f2-05c52600d584.avif)

Podemos cubrirlo con una prueba en `jest` en el archivo `test/account.test.ts`

```typescript
import { getFastifyServer } from '../src/fastify'
import {seed} from "../src/storage/seed";
import {prisma} from "../src/storage/prisma";
import {tokenizeUser} from "../src/auth/getUser";

const address = 'abc';

describe('i can see my account', () => {
    it('using token', async () => {
        await seed();
        prisma.users.create({
            data: {
                address,
                nonce: 'secret'
            }
        })

        const server = await getFastifyServer()
        const result = await server.inject({
            method: 'GET',
            path: '/me',
            headers: {
                authorization: `Bearer ${tokenizeUser({address})}`
            }
        })

        expect(JSON.parse(result.body)).toMatchObject({
            address
        })
        expect(result.statusCode).toEqual(200)
        expect(result.headers['content-type']).toContain('application/json')
    })
})
```

Desafortunadamente, esto conduce a un interbloqueo en las pruebas que se ejecutan simultáneamente:

```
Invalid `prisma.users.deleteMany()` i
nvocation:


    Transaction failed due to a write con
flict or a deadlock. Please retry your tr
ansaction
```

Podemos resolverlo simplemente añadiendo `--runInBand` al comando de jest.

```
    "test": "jest --runInBand",
```

## Mejoras generales en el proyecto Fastify

Hay tres mejoras que se pueden agregar.

* cors
* errores coloridos en los registros
* pruebas en el flujo de trabajo de github

### Cors

Queremos hacer que esta API sea abierta para aceptar solicitudes de todos los dominios. Instalemos el paquete `@fastify/cors`

```
npm i @fastify/cors
```

y en `src/fastify.ts` simplemente regístralo como `fastifySensible`

```typescript
import cors from '@fastify/cors'

//...

    app.register(cors)
```

podemos agregar pruebas de cors en el archivo `test/cors.test.ts`

```typescript
import {getFastifyServer} from '../src/fastify'

describe('cors', () => {
    it('for get I have access-control-allow-origin', async () => {
        const server = await getFastifyServer()
        const result = await server.inject({
            method: 'GET',
            path: '/',
        })

        expect(result.statusCode).toEqual(200)
        expect(result.headers['access-control-allow-origin']).toEqual('*')
    })

    it('for options I see cors headers', async () => {
        const server = await getFastifyServer()
        const result = await server.inject({
            method: 'OPTIONS',
            path: '/',
            headers: {
                'Access-Control-Request-Method': 'GET',
                'Origin': 'https://ilove.ethereum'
            }
        })

        expect(result.statusCode).toEqual(204)
        expect(result.headers['access-control-allow-origin']).toEqual('*')

    })
})
```

### Registros de errores coloridos

Para encontrar problemas en nuestro código más fácilmente, podemos usar colores para imprimir errores:

![](http://localhost:8484/985fb501-4012-4c4b-8f5a-bfd3423a939e.avif)

Instalemos la biblioteca `cli-color`:

```
npm i cli-color
npm i -D @types/cli-color
```

ahora en `src/fastify.ts` podemos definir la función `shouldPrintError`

```typescript
function shouldPrintError(error: FastifyError) {
    return process.env.NODE_ENV !== 'test' && (!error.statusCode || !(error.statusCode >= 400 && error.statusCode < 500))
}
```

decidimos que queremos imprimir solo errores sin código de estado (no manejados) o con un código diferente a `4xx`. Además, no queremos ver errores en modo de prueba. Puedes establecer estas condiciones como desees, pero es importante que queremos tratar diferentes tipos de errores de diferente manera.

Ahora podemos agregar `hook` en el cuerpo de `getFastifyServer`

```typescript
import {red, yellow} from 'cli-color'


    app.addHook('onError', async (request, reply, error) => {
        if (shouldPrintError(error)) {
            console.log(red(error), yellow(String(error.stack).replace(`Error: ${error.message}`, '')))
        }
        if (isNativeError(error)) {
            return reply.internalServerError(error.message)
        }
        throw error
    })
```

ahora nuestros errores serán fáciles de encontrar y analizar en la consola.

![](http://localhost:8484/b87442c3-adf2-4911-aada-5074b407bd8d.avif)

### Flujos de trabajo de Github

Comencemos por verificar si nuestro proyecto se puede construir. En `package.json` podemos agregar un script.

```
"build": "tsc"
```

para eliminar los archivos js creados por este comando puedes escribir

```
tsc --build --clean
```

En GitHub, puedes crear un flujo de trabajo básico para Node.js utilizando la interfaz gráfica.

```yml
name: Node.js CI

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:

    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]
        # See supported Node.js release schedule at https://nodejs.org/en/about/releases/

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

Pero no funcionará porque no hay mongodb en modo de conjunto de réplicas.

Afortunadamente, la configuración en github actions es muy fácil y después de pequeños arreglos, nuestro flujo de trabajo se ve como sigue:

```yml
name: Node.js CI

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

env:
  JWT_SECRET_KEY: 123
  DATABASE_URL: mongodb://localhost:27017/web3_bdl

jobs:
  build:

    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]
        mongodb-version: ['5.0']

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Start MongoDB
      uses: supercharge/mongodb-github-action@1.8.0
      with:
        mongodb-version: ${{ matrix.mongodb-version }}
        mongodb-replica-set: rs-test

    - run: npm ci
    - run: npm test
    - run: npm run build --if-present
```

Todo el código presentado se puede encontrar en el repositorio:

[metamask-fastify-rest-api](https://github.com/gustawdaniel/metamask-fastify-rest-api)

Espero que te haya gustado esta forma de publicación en la que cubrimos todas las partes desde cero hasta una demostración funcional. Déjame saber si ves cómo puedo mejorar mi código o si algo presentado aquí te ayudó en tus proyectos.
