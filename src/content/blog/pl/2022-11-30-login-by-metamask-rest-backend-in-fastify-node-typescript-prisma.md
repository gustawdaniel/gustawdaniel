---
author: Daniel Gustaw
canonicalName: login-by-metamask-rest-backend-in-fastify-node-typescript-prisma
coverImage: http://localhost:8484/4063ad62-79ab-432e-94a1-7ec1bbd852b8.avif
description: Budujemy od podstaw REST API w Fastify, korzystając z MongoDB połączonej przez Prisma jako bazę danych, Jest jako framework testowy oraz Ether.js do weryfikacji podpisów podpisanych przez MetaMask.
excerpt: Budujemy od podstaw REST API w Fastify, korzystając z MongoDB połączonej przez Prisma jako bazę danych, Jest jako framework testowy oraz Ether.js do weryfikacji podpisów podpisanych przez MetaMask.
publishDate: 2022-11-30 17:23:41+00:00
slug: pl/login-przez-metamask-backend-rest-w-fastify
tags:
- metamask
- fastify
- nodejs
- typescript
- jest
- prisma
- rest
title: Logowanie przez Metamask - Backend Rest w Fastify (Node, Typescript, Prisma)
updateDate: 2022-11-30 17:23:41+00:00
---

Metamask to portfel kryptowalutowy i brama do aplikacji blockchain. Może być zainstalowany jako aplikacja mobilna lub rozszerzenie do przeglądarki. Metamask można używać do budowy bezkosztowego, kryptograficznie zabezpieczonego procesu autoryzacji bez przetwarzania danych osobowych.

W tym blogu pokażę, jak przygotować API REST w Fastify. Do testów użyjemy `jest`. Jako bazę danych wybieramy `mongodb` połączone przez `prisma`. Pierwsza część opisuje ustawienie punktu końcowego `version` oraz konfigurację środowiska. Następnie zaprezentujemy diagram procesu autoryzacji, połączymy bazę danych i zaimplementujemy wszystkie punkty końcowe.

## Ustawienie projektu Node z TypeScript

Pierwsze polecenia w nowym projekcie `nodejs` z `typescript` to zawsze inicjalizacja `package.json`.

```
npm init -y
```

i `tsconfig.json`

```
tsc --init
```

Teraz musimy zdecydować, jak uruchomić nasz projekt. Stare metody, takie jak `ts-node` z `nodemon`, zostały przeze mnie porzucone, kiedy spotkałem `ts-node-dev`. Restartuje on docelowy proces node, gdy jakikolwiek z wymaganych plików się zmienia (jak standardowy node-dev), ale dzieli proces kompilacji Typescript między restartami. To znacznie zwiększa prędkość restartu w porównaniu do wspomnianych rozwiązań. W skryptach `package.json` możemy dodać linię:

```
    "dev": "ts-node-dev --no-notify --respawn --transpile-only src/index.ts",
```

zainstalujmy `ts-node-dev`

```
npm i -D ts-node-dev
```

w `src/index.ts` możemy dodać zawartość

```typescript
async function main() {
    console.log("ok");
}

main().catch(console.error)
```

i uruchom to przez

```
npm run dev
```

Pokaże "ok" i będzie czekać na zmiany, aby zareagować na nie w czasie rzeczywistym.

![](http://localhost:8484/7125cc3e-5539-4850-b765-01a1c2dea692.avif)

## Dodaj Fastify z pierwszym punktem końcowym

Fastify to framework podobny do express, ale z dwoma zaletami

* jest około 20% szybszy w przetwarzaniu zapytań

![](http://localhost:8484/b8d54d3e-88fc-494a-b406-0c117bb9b4ed.avif)

* jest szybszy w rozwoju dzięki użytecznym uproszczeniom w jego API

Jedną z wad fastify jest mniejsza społeczność (teraz 32 razy mniejsza).

Aby zainstalować `fastify`, wpisz:

```
npm i fastify
```

Teraz możemy stworzyć `src/fastify.ts` z zawartością:

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

i w `src/index.ts` zaimportuj to i użyj do uruchomienia serwera na wybranym porcie

```typescript
import { getFastifyServer } from './fastify'

async function main() {
    const app = await getFastifyServer()
    await app.listen({ port: 4200, host: '0.0.0.0' })
    console.log(`Fastify listen on http://localhost:4200/`)
}

main().catch(console.error)
```

Teraz nie jest to zbyt użyteczne, ponieważ nie zdefiniowaliśmy żadnej trasy, middleware ani haka do przetwarzania żądań. Zróbmy to i zdefiniujmy punkt końcowy `/`.

## Pierwszy punkt końcowy w Fastify - wersja projektu

To będzie publiczna trasa, ale aby nie zaśmiecać pliku `fastify.ts`, stworzymy następny w `src/routes/version.ts` z zawartością

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

To jest prosta klasa z metodą statyczną, która zwraca obiekt. Fastify przekształci to dla nas w odpowiedź z typem zawartości `application/json`, ale musimy włączyć opcję `resolveJsonModule` w `tsconfig.json`

```json
     "resolveJsonModule": true,                        /* Enable importing .json files. */
```

teraz w centrum pliku `fastify.ts` możemy dodać

```
    app.get('/', Version.root)
```

i prośba do głównej trasy naszego serwera

```
 http -b localhost:4200
```

zaczyna zwracać odpowiedź

```json
{
    "name": "metamask-fastify-rest-api",
    "version": "1.0.0"
}
```

![](http://localhost:8484/7ffbbcf3-ef0d-4431-a300-3eec3eb41ccf.avif)

## Testy w Jest z użyciem esbuild

Jeśli jesteś programistą dłużej niż jeden dzień, to wiesz, jak łatwo można zepsuć działający program, zmieniając coś w kodzie źródłowym w losowych miejscach. Na szczęście możemy napisać testy, które udowodnią, że kod działa zgodnie z naszymi oczekiwaniami.

![](http://localhost:8484/b23e01cd-3fbb-473b-8213-5c9c95e64cc1.avif)

W node js jednym z najlepszych frameworków do testowania jest `jest`. Aby jednak połączyć go z typescriptem, potrzebujemy wtyczki, która przekształci pliki `ts`. To straszne, że najpopularniejszy `ts-jest` jest używany 2000 razy częściej niż około 26 razy szybszy `jest-ebuild`. Ale użyjmy technologii z przyszłości - esbuild.

![](http://localhost:8484/42715107-7b7c-4e7a-8388-8d19edb97451.avif)

Nasz `jest.config.ts` będzie zawierał

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

Zainstalujmy pakiety

```
npm i -D jest @types/jest jest-esbuild
```

i dodaj skrypt `test` w `package.json`

nasz pierwszy plik testowy `test/version.test.ts` może wyglądać następująco:

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

Teraz kiedy wpisujesz

```
npm test
```

powinieneś zobaczyć

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

Skonfigurowaliśmy serwer fastify z środowiskiem deweloperskim z automatycznym przeładowywaniem oraz super szybkie testy skonfigurowane w jest. Stworzyliśmy pierwszy punkt końcowy, który zwraca nazwę i wersję serwera w punkcie głównym. Czas opisać proces autoryzacji i wdrożyć wymagane trasy.

## Diagram procesu autoryzacji

Ogólnie idea jest następująca. Użytkownik ma klucz prywatny połączony z adresem jego portfela. Możemy zapisać ten adres w bazie danych jako jego unikalny identyfikator i wygenerować dla niego nonce. Nonce to prosta losowa fraza generowana w celu sprawdzenia, czy użytkownik może poprawnie ją podpisać za pomocą swojego adresu. Jeśli nonce wycieknie, to nic strasznego, ponieważ nikt nie będzie w stanie podpisać jej poprawnym adresem, jeśli nie posiada klucza prywatnego. Poniżej przedstawiamy diagram:

![](http://localhost:8484/f6921ccd-2b57-4935-9aa8-18cf7e8296eb.avif)

Więc potrzebujemy kolekcji użytkowników tylko z `adresami` i `nonce` oraz 4 punktów końcowych

* aby uzyskać nonce dla danego adresu
* aby zarejestrować nowy adres i przypisać mu nonce
* aby zalogować się za pomocą adresu, nonce i podpisu
* aby uzyskać szczegóły mojego konta używając tokena JWT

## Model DB z prisma

Prisma to świetne oprogramowanie, które pomaga korzystać z bazy danych w niezawodny sposób dzięki wspaniałym typom i interfejsom, które umożliwiają statyczną walidację wszystkich miejsc w kodzie, gdy korzystamy z bazy danych.

Aby zainstalować prismę, będziemy potrzebować dwóch bibliotek

```
npm i prisma @prisma/client
```

Teraz pisanie:

```
npx prisma init
```

możemy wygenerować wstępne ustawienia.

Został utworzony plik `.env` z `DATABASE_URL` oraz `prisma/schema.prisma`, który domyślnie używa postgresql. Potrzebujemy mongo, więc zmodyfikujmy plik ze schematem.

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

a w `.env` możemy wybrać adres naszej bazy danych mongo

```
DATABASE_URL=mongodb://localhost:27017/web3_bdl
```

![](http://localhost:8484/4116df67-d537-41fe-b933-aff45f28ac77.avif)

### Mongo w trybie Replica Set

Ważne jest, aby prisma teraz używała mongo w trybie replikacji.

[Replikacja — Podręcznik MongoDB](https://www.mongodb.com/docs/manual/replication/)

aby to skonfigurować, będziesz musiał dodać linie

```
replication:
  replSetName: rs0
```

do swojego pliku konfiguracyjnego mongodb `/etc/mongod.conf`. Ta ścieżka zależy od twojego systemu operacyjnego.

W kliencie `mongo` powinieneś wykonać

```
rs.initiate()
```

ustawić zestaw replik i

```
rs.status()
```

aby to sprawdzić. Będziesz musiał zrestartować usługę mongo, aby odczytać zmiany z konfiguracji.

### Generowanie typescript z prisma

Jeśli poprawnie skonfigurowałeś mongo i utworzyłeś modele użytkowników, uruchom

```
npx prisma generate
```

ta komenda wygeneruje typescript, aby pomóc w autouzupełnianiu i statycznej walidacji twojego dalszego kodu.

### Pojedynczy klient prisma dla całej aplikacji

To dość dobra praktyka, aby skonfigurować punkt dostępu do bazy danych w jednym miejscu i importować go z tego pliku niż używać biblioteki. W naszym przypadku będzie to plik `src/storage/prisma.ts`. W tym pliku zmodyfikujemy `DATABASE_URL`, dodając `_test` na końcu w środowisku testowym. Dzięki tej modyfikacji nie musimy się martwić o odrębny zestaw zmiennych środowiskowych na potrzeby testów i możemy uniknąć nadpisywania naszych lokalnych danych podczas testów napisanych w jest.

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

Teraz możemy zaimportować prismę z tego miejsca i uzyskać dostęp do odpowiedniej bazy danych w zależności od `NODE_ENV`.

![](http://localhost:8484/e2b309fd-236d-4a82-9995-c6f5e8db7f22.avif)

### Przekazywanie env do procesu

Nie ma ostatniego wyzwania związanego z bazą danych - przekazywanie adresu bazy danych do programu w bezpieczny sposób. Możemy to zrobić za pomocą biblioteki `dotenv`, ale wolę `Makefile` jako punkt dostępu do aplikacji, ponieważ jest to bardziej uniwersalny sposób i można go stosować z `python`, `go`, `ruby` i innymi językami w ten sam sposób. To jest mój `Makefile`

```makefile
include .env
export

node_modules: package.json
	npm i

up: node_modules
	npm run dev
```

więc od teraz, zamiast pisać

```
npm run dev
```

możesz pisać

```
make up
```

oczywiście, to tylko rozwiązanie w trybie deweloperskim. W produkcji lepiej jest przekazać zmienne środowiskowe za pomocą dockera lub podobnego rozwiązania.

## Sprawdzanie, czy użytkownik z danym adresem istnieje

Pierwszym krokiem w naszym diagramie było sprawdzenie, czy użytkownik z danym adresem istnieje i uzyskanie jego nonce. Jeśli adres nie istnieje, chcemy zwrócić odpowiedź `Not Found`. Możemy użyć pomocnika do stworzenia odpowiedzi `notFound` za pomocą `@fastify/sensible`. Zainstalujmy to:

```
npm i @fastify/sensible
```

teraz możemy zaimportować to w `src/fastify.ts`

```typescript
import fastifySensible from '@fastify/sensible'
```

i zarejestruj w ciele funkcji `getFastifyServer`

```
    app.register(fastifySensible)
```

Aby dodać punkt końcowy wyszukujący użytkowników według adresu, dodaj tutaj również linię

```typescript
    app.get('/users/:address/nonce', User.getNonce)
```

Będziemy musieli zaimportować użytkownika z `routes`, więc w `src/routes/user.ts` stwórzmy klasę `User` z metodą statyczną `getNonce`, tak jak wcześniej zrobiliśmy to z `version`.

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

Teraz możemy przetestować to ręcznie.

```
http -b localhost:4200/users/123/nonce
{
    "error": "Not Found",
    "message": "Not Found",
    "statusCode": 404
}
```

lepiej jest pisać testy w `jest`. Zanim napiszemy testy, przygotujemy plik `src/storage/seed.ts` z funkcją `seed`, aby wyczyścić naszą bazę danych.

```typescript
import {prisma} from "./prisma";

export async function seed() {
    await prisma.users.deleteMany();
}
```

Teraz w `test/address.test.ts` możemy napisać testy, aby sprawdzić, czy ten punkt końcowy działa.

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

Tutaj omówiliśmy wszystkie możliwe scenariusze.

![](http://localhost:8484/316a676f-2eb0-499f-a8f4-82f9fa59c5f2.avif)

## Rejestracja użytkownika za pomocą adresu portfela

Teraz użytkownik może sprawdzić, czy jego adres jest zarejestrowany. Oczywiście, jeśli zobaczy naszą aplikację po raz pierwszy, nie będzie zarejestrowany, więc otrzyma błąd 404 i spróbuje zarejestrować swój adres. Zaimplementujmy rejestrację.

Nonce musi być losowym ciągiem. Aby go wygenerować, użyjemy pakietu `uid`.

```
npm i uid
```

W `src/routes/user.ts` dodajemy nową statyczną metodę do klasy `User`.

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

Logika tutaj jest bardzo prosta. Szukamy użytkownika. Jeśli istnieje, kod odpowiedzi to 200. Jeśli nie, użytkownik jest tworzony, a kod odpowiedzi to 201. W każdym przypadku chcemy zwrócić nonce użytkownika.

W `src/fastify.ts` dodajemy linię, która zarejestruje ten handler.

```typescript
    app.post('/register', User.register)
```

Możemy to pokryć testem w sposób podobny do poprzedniego.

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

## Logowanie użytkownika za pomocą podpisanego komunikatu

Teraz musimy zaimplementować weryfikację podpisu stworzonego przez metamask. Możemy to zrobić, używając funkcji `verifyMessage` dostarczonej przez bibliotekę `etherjs`.

### Weryfikacja podpisu z etherjs

```
npm i ethers
```

w nowym pliku `src/auth/getUser.ts` możemy stworzyć kilka funkcji pomocniczych.

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

pierwszy podaje adres użyty do podpisania wiadomości. Drugi sprawdza, czy ten adres jest taki sam jak posiadany przez naszego użytkownika. W `test/auth.test.ts` możemy sprawdzić, czy to działa.

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

wartości w teście `address`, `nonce` i `signature` są przygotowywane w przeglądarce.

### Podpisywanie nonce w przeglądarce za pomocą metamask

Jeśli masz `metamask`, możesz uzyskać adres podpisu, wpisując w konsoli przeglądarki:

```javascript
ethereum.enable()
```

a potem

```javascript
ethereum.selectedAddress
```

Jeśli chcesz podpisać nonce, stwórzmy pomocnika w konsoli przeglądarki:

```javascript
function utf8ToHex(str) {
  return Array.from(str).map(c =>
      c.charCodeAt(0) < 128 ? c.charCodeAt(0).toString(16) :
          encodeURIComponent(c).replace(/\%/g, '').toLowerCase()
  ).join('');
}
```

następnie zdefiniuj nonce

```javascript
nonce = 'abc'
```

i na koniec

```javascript
await ethereum.request({
    method: "personal_sign",
    params: [utf8ToHex(nonce), ethereum.selectedAddress],
  })
```

### Generowanie tokena JWT z danymi użytkownika

Naszym następnym wyzwaniem jest wysłanie tokena `jwt`. Aby go utworzyć, zainstalujmy dwie biblioteki.

```
npm i jsonwebtoken dayjs
npm i --save-dev @types/jsonwebtoken
```

W `src/auth/getUser.ts` możemy zdefiniować następujący pomocniczy sposób na tworzenie tokenów

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

Te tokeny będą miały `1` miesiąc żywotności i będą zawierać adres użytkownika oraz informacje o organizacji. W `.env` musimy dodać linię z naszym kluczem tajnym jwt.

```
JWT_SECRET_KEY=123
```

### Punkt końcowy logowania w API REST

Teraz jesteśmy gotowi, aby dodać funkcję `login` do `src/routes/user.ts`

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

w `src/fastify.ts` musimy zarejestrować trasę `/login`

```typescript
    app.post('/login', User.login)
```

Teraz możemy dodać kolejny test w `test/auth.test.ts`

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

## Pobieranie danych użytkownika z tokena JWT

Na końcu jesteśmy gotowi, aby zaimplementować trasę `/me`, ale będzie ona różnić się od poprzednich. Nie będzie to publiczna trasa. Zamierzamy stworzyć middleware, aby zabezpieczyć tę trasę. W tym middleware rozpoznamy użytkownika i dodamy go do obiektu `request` żyjącego podczas przetwarzania tego żądania.

Pierwszym brakującym elementem jest funkcja `getUser`. Zdefiniujmy ją w pliku `src/auth/getUser.ts`

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

zwrócony interfejs `JWTUser` może być zdefiniowany w `src/interfaces/context.ts` jako

```typescript
import { PrismaClient } from '../storage/prisma'

export interface JWTUser {
  address: string
  token_expiring_at: Date
}
```

Drugim brakującym elementem jest rozszerzenie `FastifyRequest`, pozwalające na zapisanie użytkownika wśród właściwości żądania. W `src/fastify.ts` możemy zadeklarować moduł `fastify`, rozszerzając `FastifyRequest`.

```typescript
declare module 'fastify' {
    interface FastifyRequest {
        user: JWTUser | null
    }
}
```

Teraz możemy zdefiniować funkcję `auth`, która będzie używana w tablicy `preValidation` jako strażnik dla wszelkich prywatnych tras.

```typescript
async function auth(request: FastifyRequest, reply: FastifyReply) {
    const token = (request.headers.authorization || '').replace(/Bearer\s+/, '') || undefined
    request.user = getUser(token)
    if (!request.user) reply.unauthorized()
}
```

Ten middleware `auth` przypisze użytkownika do żądania, jeśli token jest ważny. W przeciwnym razie odpowie kodem 401.

Formalnie 401 Unauthorized to kod statusu, który należy zwrócić, gdy klient nie dostarcza danych uwierzytelniających lub dostarcza nieprawidłowe dane uwierzytelniające. 403 Forbidden to kod statusu, który należy zwrócić, gdy klient ma ważne dane uwierzytelniające, ale nie ma wystarczających uprawnień do wykonania akcji na zasobie.

Jednak dla uproszczenia pominiemy tę niuansę. Teraz możemy zarejestrować `/me` z zabezpieczeniem wstępnym.

```typescript
    app.get('/me', {preValidation: [auth]}, User.root)
```

a w `src/route/user.ts` dodaj kontroler o nazwie `root`.

```
    static async root(req: FastifyRequest, res: FastifyReply) {
        return req.user;
    }
```

Teraz spróbujmy to użyć. Najpierw zarejestruj konto z adresem z mojej przeglądarki.

![](http://localhost:8484/c0280d22-ead4-4f84-a5aa-1d410013046e.avif)

Następnie podpisz `nonce` w przeglądarce

![](http://localhost:8484/1ebb796e-3494-45c1-93f3-6b70eee435f1.avif)

Zaloguj się za pomocą podpisu, aby uzyskać token jwt

![](http://localhost:8484/4f94593d-a657-44e9-a132-2fd13837b3c3.avif)

I w końcu uzyskaj dane użytkownika za pomocą prywatnej trasy `/me`

![](http://localhost:8484/d60b400a-02e8-4c61-b5f2-05c52600d584.avif)

Możemy to pokryć testem w `jest` w pliku `test/account.test.ts`

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

Niestety prowadzi to do zakleszczenia w testach, które są wykonywane jednocześnie:

```
Invalid `prisma.users.deleteMany()` i
nvocation:


    Transaction failed due to a write con
flict or a deadlock. Please retry your tr
ansaction
```

Możemy to rozwiązać, po prostu dodając `--runInBand` do polecenia jest.

```
    "test": "jest --runInBand",
```

## Ogólne ulepszenia w projekcie Fastify

Istnieją trzy ulepszenia, które możemy dodać.

* cors
* kolorowe błędy w logach
* testowanie w workflow githuba

### Cors

Chcemy, aby to API było otwarte na przyjmowanie żądań ze wszystkich domen. Zainstalujmy pakiet `@fastify/cors`

```
npm i @fastify/cors
```

a w `src/fastify.ts` po prostu zarejestruj to jako `fastifySensible`

```typescript
import cors from '@fastify/cors'

//...

    app.register(cors)
```

możemy dodać testy cors w pliku `test/cors.test.ts`

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

### Kolorowe dzienniki błędów

Aby łatwiej znaleźć problemy w naszym kodzie, możemy użyć kolorów do drukowania błędów:

![](http://localhost:8484/985fb501-4012-4c4b-8f5a-bfd3423a939e.avif)

Zainstalujmy bibliotekę `cli-color`:

```
npm i cli-color
npm i -D @types/cli-color
```

teraz w `src/fastify.ts` możemy zdefiniować funkcję `shouldPrintError`

```typescript
function shouldPrintError(error: FastifyError) {
    return process.env.NODE_ENV !== 'test' && (!error.statusCode || !(error.statusCode >= 400 && error.statusCode < 500))
}
```

decyduje, że chcemy drukować tylko błędy bez kodu statusu (nieobsługiwane) lub z kodem innym niż `4xx`. Dodatkowo nie chcemy widzieć błędów w trybie testowym. Możesz ustawić te warunki według własnych preferencji, ale ważne jest, abyśmy chcieli traktować różne typy błędów w różny sposób.

Teraz możemy dodać `hook` w ciele `getFastifyServer`

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

teraz nasze błędy będą łatwe do znalezienia i analizy w konsoli.

![](http://localhost:8484/b87442c3-adf2-4911-aada-5074b407bd8d.avif)

### Przepływy pracy Github

Zacznijmy od sprawdzenia, czy nasz projekt może być zbudowany. W `package.json` możemy dodać skrypt

```
"build": "tsc"
```

aby usunąć pliki js utworzone przez to polecenie, możesz wpisać

```
tsc --build --clean
```

W GitHubie możesz stworzyć podstawowy workflow dla Node.js za pomocą interfejsu graficznego.

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

Ale to nie zadziała, ponieważ nie ma mongodb w trybie zestawu replik.

Na szczęście konfiguracja w github actions jest super prosta i po małych poprawkach nasz workflow wygląda następująco:

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

Wszystkie przedstawione kody można znaleźć w repozytorium:

[metamask-fastify-rest-api](https://github.com/gustawdaniel/metamask-fastify-rest-api)

Mam nadzieję, że podobała Ci się ta forma publikacji, w której omówiliśmy wszystkie części od podstaw do działającej wersji demo. Daj mi znać, jeśli widzisz, jak mogę poprawić swój kod lub jeśli coś przedstawionego tutaj pomogło w Twoich projektach.
