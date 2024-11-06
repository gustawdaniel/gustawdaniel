---
author: Daniel Gustaw
canonicalName: trpc-super-fast-development-cycle-for-fullstack-typescript-apps
coverImage: http://localhost:8484/7fc824e8-9e03-4665-9108-d9e1439bb971.avif
description: Budujemy klienta i serwer tRPC z zapytaniami, mutacjami, uwierzytelnianiem i subskrypcjami. Uwierzytelnianie dla websocketów może być skomplikowane i w tym przypadku także, dlatego przedstawione są trzy podejścia do rozwiązania tego problemu.
excerpt: Budujemy klienta i serwer tRPC z zapytaniami, mutacjami, uwierzytelnianiem i subskrypcjami. Uwierzytelnianie dla websocketów może być skomplikowane i w tym przypadku także, dlatego przedstawione są trzy podejścia do rozwiązania tego problemu.
publishDate: 2023-03-09 09:17:29+00:00
slug: pl/trpc
tags:
- trpc
- websocket
- authorization
title: tRPC - superszybki cykl rozwoju dla aplikacji fullstack w TypeScript
updateDate: 2023-03-09 09:17:29+00:00
---

Dzisiaj nauczyłem się tRPC i od razu się zakochałem ❤️, postanawiając przepisać projekt, nad którym obecnie pracuję, na ten framework.

W skrócie, co to jest:
1\. Możesz rozwijać schemat jak w gRPC
2\. Ale jesteś ograniczony tylko do typescript (wsparcie dla rusta w toku)
3\. Zamiast protobuf, który jest trudny do odczytania/debugowania, masz lekkie typy generowane z Twoich walidatorów (takich jak zod) i resolverów

Ostatecznie zyskujesz najszybszy cykl rozwoju pełnego stosu, jaki kiedykolwiek widziałem, i mogę go porównać tylko z ruby on rails.

## Minimalny przykład tRPC z zapytaniem przez http

Pozwól, że pokażę Ci minimalny projekt używający tego stosu.

Zaczniemy od 2 folderów:

* client
* server

W `client` musimy zainstalować `@trpc/client`, a w `server` instalujemy `@trpc/server` oraz `zod`.

W `server/index.ts` tworzymy serwer ze schematem wygenerowanym z naszego kodu.

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

Zobacz na linijkę `export type AppRouter`, która odpowiada za eksportowanie schematu dla klienta. Kilka linijek później definiujemy wszystkie trasy za pomocą funkcji `router`.

Nie ma tylko `query`, ale także `mutation` i `subscription`. Jednak w naszym przykładzie musimy pokazać minimalny zestaw startowy, więc przyjrzyjmy się kodowi klienta.

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

Oto import `AppRouter`, którego używamy jako typ ogólny do stworzenia `client`. Zatem wszystkie:

* metody klienta
* argumenty metod
* wyniki metod

mają silne typowanie.

## Uwierzytelnianie z tRPC

Dodajmy mutację, która może być wykonana tylko przez administratora. Aby uprościć, pominiemy jwt / logowanie / rejestrację i rozważymy sytuację, w której klient może wysłać nagłówek `Authorization` z `ABC`, aby się autoryzować.

W tej części dowiesz się, jak dodać autoryzację, middleware i mutacje.

Utwórzmy `context.ts` w `server`

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

Teraz możemy zmienić

```typescript
const t = initTRPC.create();
```

do

```typescript
import type { Context } from './context';
export const t = initTRPC.context<Context>().create();
```

Teraz oczekujemy, że w `context` będziemy mogli sprawdzić, czy użytkownik jest autoryzowany.

Musisz również dodać `createContext` do opcji `createHTTPServer`, więc zmień:

```typescript
createHTTPServer({
    router: appRouter,
}).listen(2022);
```

do

```typescript
import {createContext} from "./context";

createHTTPServer({
    router: appRouter,
    createContext
}).listen(2022);
```

Teraz mamy 2 opcje. Możemy sprawdzić `auth` w resolverze.

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

lepszym podejściem jest prawdopodobnie dodanie tej kontroli do middleware o nazwie `protectedProcedure`.

To nieco więcej kodu, ale daje nam pewne zalety

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

Najpierw możemy zdefiniować nasz kontekst na nowo, tj. znajdowanie użytkownika w bazie danych i konwersja identyfikatora w tokenie na pełny zestaw parametrów użytkownika. Dodatkowo możemy ponownie wykorzystać `protectedProcedure` we wszystkich miejscach bez powtarzania tej kontroli za każdym razem.

Teraz jest ostatni krok na serwerze: dodanie nowej trasy do kluczy argumentów `router`.

```typescript
secret: protectedProcedure.mutation(() => "access granted")
```

W kliencie możemy to użyć w następujący sposób:

```typescript
  const unauthorizedError = await client.secret.mutate();
  console.log(unauthorizedError);
```

i zobaczymy piękny błąd nieautoryzowany, jak ten

![](http://localhost:8484/096a9d57-0df1-4356-b9c9-85d8d39a5712.avif)

Aby uzyskać autoryzację, możemy dodać nagłówki w definicji klienta.

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

Jeśli zostawiłbym to w tej formie, musiałbym ponownie utworzyć klienta z nowymi nagłówkami przy każdej zmianie nagłówków. Na szczęście tę prostą formę można ulepszyć i możemy napisać w ten sposób:

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

i decydować o kształcie nagłówków dynamicznie w czasie wykonywania, np. ustawiając `Authorization` przez

```typescript
headers.set('Authorization', 'ABC');
```

## Czas na czas rzeczywisty z subskrypcjami tRPC

W `serwerze` instalujemy `ws`.

```bash
npm i ws
npm i -D @types/ws
```

Do `router` możemy dodać nową subskrypcję, która będzie nam dawała czas co sekundę.

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

Teraz musimy otworzyć serwer `websocket`, więc dodajmy go za pomocą kodu:

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

Sprawdziłem w `insomnia`, że mogę się połączyć.

![](http://localhost:8484/2db8b228-51fe-42cb-bc1c-0630fec958cd.avif)

W ładunku użyłem obiektu o kształcie opisanym w specyfikacji `jsonrpc`

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

Więc teraz połączmy naszego klienta w typescripcie.

Podążając za oficjalną dokumentacją, zobaczysz błąd.

```typescript
ReferenceError: WebSocket is not defined
```

ponieważ `createWSClient` zakłada, że działa w przeglądarce, ale w tym przykładzie używamy klienta node.

![](http://localhost:8484/3daf5f04-8832-43fc-aebc-9d73b5edec9c.avif)

Aby to naprawić, musimy zainstalować `ws` i przypisać go do zakresu `global`, ale jeśli twój klient działa w przeglądarce, możesz pominąć ten krok.

```bash
npm i ws
npm i -D @types/ws
```

Teraz możesz stworzyć `wsClient`

```typescript
const WebSocket = require('ws');
const wsClient = createWSClient({
    url: `ws://localhost:3001`,
    WebSocket: WebSocket,
});
```

użyj tego opakowując w link

```typescript
const client = createTRPCProxyClient<AppRouter>({
    links: [
        wsLink({
            client: wsClient
        }),
    ],
});
```

a na koniec subskrybuj, aby zobaczyć serię dat

```typescript
    client.time.subscribe(undefined, {
        onData: (time) => {
            console.log(time)
        }
    })
```

Niestety, musisz usunąć naszą tajną mutację.

```typescript
await client.secret.mutate();
```

aby to działało.

![](http://localhost:8484/890537bc-dfee-4334-a30e-a42dd593b854.avif)

## Brak dokumentacji - uwierzytelnianie websocket w tRPC

Teraz borykamy się z problemem zapewnienia uwierzytelnienia dla websocketów, ale prawdopodobnie wiesz, że czyste websockety nie obsługują nagłówków http. Możesz je przekazać w żądaniu http przy ustalaniu połączenia, które zaktualizuje protokół do websocketu. Szczegóły opisane są w RFC 6455.

[RFC 6455: Protokół WebSocket](https://www.rfc-editor.org/rfc/rfc6455)

W bardziej dojrzałych projektach, takich jak apollo server, można zauważyć, że żądanie aktualizacji jest używane do przekazywania informacji o uwierzytelnieniu, ale niestety teraz tRPC tego nie obsługuje.

Tak czy inaczej, możesz podzielić swojego klienta na części http i websocket.

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

Prawdopodobnie większość operacji to operacje http, więc możesz użyć mechanizmu autoryzacji opisanego wcześniej do zapytań i mutacji. W przypadku websocketu możesz użyć ładunku, aby teraz przekazać token lub zastosować sztuczkę, którą opisuję poniżej.

Aby dać ci więcej kontekstu, istnieje otwarty problem:

[feat: Authentication by Websocket · Issue #3955 · trpc/trpc](https://github.com/trpc/trpc/issues/3955)

Interesujący, ale wprowadzający w błąd temat na stackoverflow

[HTTP headers in Websockets client API](https://stackoverflow.com/questions/4361173/http-headers-in-websockets-client-api)

Odpowiedź z największą liczbą głosów jest błędna, ponieważ nie uwzględnia handshake. A `ws` implementuje to jako trzeci argument, ale nie możesz tego znaleźć w oficjalnym README.md

[GitHub - websockets/ws: Simple to use, blazing fast and thoroughly tested WebSocket client and server for Node.js](https://github.com/websockets/ws)

W kodzie `trpc` ten trzeci argument jest pomijany

[trpc/wsLink.ts at main · trpc/trpc](https://github.com/trpc/trpc/blob/main/packages/client/src/links/wsLink.ts#L130-L134)

![](http://localhost:8484/7d4e75e8-2862-41cd-863a-2c598ef97cce.avif)

Nie możesz także używać `Sec-WebSocket-Key`, ponieważ `ws` nadpisuje go losowym hashem.

[ws/websocket.js at master · websockets/ws](https://opengraph.githubassets.com/45c5a7f253c0db2b0bc8e3b601909e0a559e4afec84d93eb8c4362b6c8d91cde/websockets/ws)](https://github.com/websockets/ws/blob/master/lib/websocket.js#L717-L723)

![](http://localhost:8484/a40d66b4-2d1e-413a-a4f2-0b4323f2d5a2.avif)

i utrata `trpc` traci te informacje.

Istnieją trzy podejścia do rozwiązania tego problemu.

* przekazać nagłówek autoryzacji do handshake (łatwe, ale ograniczone i niepraktyczne)
* zbudować mapę między identyfikatorami połączeń a tymi tokenami na serwerze (ma wady, ale działa)
* przekazanie tokena do dowolnej subskrypcji w ładunku (mniej eleganckie, ale bardziej skalowalne)

![](http://localhost:8484/677b22ea-a0dc-447a-9c1e-ee5532981fc3.avif)

### Scenariusz 1: Znamy token autoryzacji przed utworzeniem klienta

To jest scenariusz, który jest niezwykle łatwy do zaimplementowania, ale niepraktyczny. Prezentuję go tylko dlatego, że nie wymaga zmian na backendzie i będzie naszym dowodem koncepcji, który wykorzystamy do poprawy w następnym kroku.

Zbudujmy twój Proxy, które doda nagłówki w każdym przypadku.

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

Ten obiekt będzie używał nagłówków zdefiniowanych wcześniej jako mapa w części dotyczącej autoryzacji.

```typescript
const headers: Map<string, string> = new Map<string, string>();
```

`args[0]` będzie adresem URL Twojego serwera, a undefined jest dla protokołu, nie musisz się tym martwić. I tak było undefined/pominięte.

Ale musimy ustawić nagłówek przez

```typescript
headers.set('Authorization', 'ABC');
```

przed wywołaniem `createWSClient`.

Teraz możesz użyć `WebSocketProxy` zamiast oryginalnej implementacji `Websocket`

```typescript
const wsClient = createWSClient({
    url: `ws://localhost:3001`,
    WebSocket: WebSocketProxy,
});
```

Klient może mieć tylko wsLink

```typescript
const client = createTRPCProxyClient<AppRouter>({
    links: [
        wsLink({
            client: wsClient
        }),
    ],
});
```

Lub być podzielonym na części http i websocket.

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

Po stronie serwera nie potrzebujemy zmian, ale wprowadzimy tylko jedną prostą poprawę. Zwrócimy stan `auth` z subskrypcji `time`.

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

Teraz nasza funkcja klienta `main` będzie następująca

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

powinniśmy zobaczyć, że wszystkie żądania działają poprawnie i mamy dostęp do tokena w kontekście websocketu również.

![](http://localhost:8484/7df97c33-f713-4cbf-b28a-a77824ad76ad.avif)

Ale w rzeczywistym przypadku użycia zaczynasz aplikację jako niezautoryzowany użytkownik, która będzie się uwierzytelniać za pomocą http, a następnie otworzy połączenia websocketowe, aby na nich działać.

tRPC definiuje funkcję `tryReconnect` dla `wsLink`, ale jej nie udostępnia. Dodatkowo lepiej by było móc się uwierzytelnić bez ponownego połączenia i specjalnego punktu końcowego websocketu dedykowanego do logowania.

### Scenariusz 2: Uwierzytelniamy się za pomocą kontekstu http i przekazujemy wynik do kontekstu websocketu

Zacznijmy od projektu na wysokim poziomie.

1. Skonfigurujemy nasz `sec-websocket-key`, który będziemy mogli zapisać i ponownie użyć po stronie klienta.
2. Skonfigurujemy mapę tych kluczy oraz ich stanów uwierzytelnienia po stronie klienta.
3. Umożliwimy modyfikację tej mapy za pomocą żądań http z nagłówkami autoryzacji.
4. Zobaczymy, że w stanie subskrypcji websocketu stan autoryzacji można uzyskać za pomocą `keys`.

#### Ustawianie nagłówka z identyfikatorem klienta

Jest otwarty [pr](https://github.com/websockets/ws/pull/2125), który pozwoli na nadpisanie `sec-websocket-key`, ale teraz użyjmy innej nazwy. `sec-websocket-id` wydaje się być świetne.

Więc gdy nasz klient się uruchamia (np. użytkownik wchodzi na nasz adres URL strony lub w naszym przypadku proces węzła się uruchamia), musimy wygenerować identyfikator. Skupię się na implementacji w `node`, więc możemy użyć `crypto`.

Nasze nowe linie po stronie klienta będą

```typescript
import crypto from 'crypto';
const id = crypto.randomBytes(16).toString('hex')
headers.set('sec-websocket-id', id);
```

musisz je ustawić przed `const wsClient = createWSClient({`.

#### Ustawianie mapy połączeń na serwerze

Kluczowym punktem jest to, że dzielimy `nagłówki` dla linków `http` i `websocket`. W serwerze `createContext` spodziewamy się zobaczyć ten nagłówek dla wszystkich typów żądań - zarówno standardowych żądań http, jak i żądań aktualizacji http, które otworzą websocket.

Nasz `context.ts` można przepisać w ten sposób:

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

teraz nie sprawdzamy stanu autoryzacji w bieżącym żądaniu, ale ostatniej wartości zapisanej w `Map`.

W naszym scenariuszu występują następujące zdarzenia:

* publiczne zapytanie
* ustawienie tokena
* prywatna mutacja <– tutaj ustawiamy autoryzację na true
* subskrypcja websocket <— tutaj używamy stanu z mapy

Potrzebujemy bardzo małych korekt w dwóch miejscach. W funkcji `isAuthed` musimy wywołać autoryzację.

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

a w subskrypcji musimy zmienić `ctx.auth` na `ctx.auth()` też

```typescript
const interval = setInterval(() => emit.next({date: new Date(), auth: ctx.auth()}), 1000);
```

#### Sprawdźmy, czy to działa dla klienta

Aby osiągnąć bardziej dramatyczny efekt, możemy użyć `setTimeout`, aby opóźnić uwierzytelnianie.

Nasza funkcja `main` ma teraz formularz

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

a w konsoli widzę

![](http://localhost:8484/92e2cfd7-6c15-4e2c-8067-4dae29b82213.avif)

#### Scenariusz 3: Przekazywanie tokena w danych wejściowych subskrypcji

Aby całkowicie rozwiązać problem, przedstawiam trzeci przedostatni sposób - przekazywanie tokena w ładunku do subskrypcji, zamiast do żądań handshake. Możemy zmodyfikować nasze `time`

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

i po stronie klienta

```typescript
    client.time.subscribe({token: 'ABC'}, {
        onData: (ctx) => {
            console.log(`I am ${ctx.input_auth ? 'auth' : 'not auth'} at ${ctx.date}`)
        }
    })
```

## Zalecane ulepszenia

Jeśli jesteś użytkownikiem gRPC i podobnie jak `Funwithloops` z tego wątku na reddit:

[https://www.reddit.com/r/node/comments/117fgb5/trpc\_correct\_way\_to\_authorize\_websocket/](https://www.reddit.com/r/node/comments/117fgb5/trpc_correct_way_to_authorize_websocket/)

zastanów się nad uwierzytelnianiem WebSocket. Powinieneś potraktować ten post jako szkic napisany przez osobę, która nauczyła się `tRPC` kilka godzin temu. W środowisku produkcyjnym musisz rozwiązać problem udostępniania stanu zapisanego w `authState` między swoimi instancjami backendu. Prawdopodobnie będziesz potrzebować Redis do tego celu. Następnie powinieneś ustawić parametry `TX`, aby nie przechowywać tych kluczy w nieskończoność. Zapomnieliśmy o punkcie końcowym wylogowania.

Używanie Redis do zarządzania uwierzytelnieniem zmniejsza wydajność w porównaniu do czystego `jwt`, więc może lepszym rozwiązaniem byłoby dodanie uwierzytelnienia do swojego wejścia subskrypcyjnego, które z drugiej strony jest mniej czytelne i wymaga więcej szablonowego kodu.

Powinieneś być świadomy, że `trpc` nie implementuje opcji `lazy` dla klienta WebSocket, która jest dostępna w Apollo i uprościłaby nasz pierwszy scenariusz, który opisałem tutaj.

Ta technologia jest bardzo na czasie, ale wciąż jest w fazie rozwoju i ten artykuł może wkrótce stać się nieaktualny.

![](http://localhost:8484/8a800bce-1eff-40a1-8ee9-f6d4fd570fd8.avif)

Jeśli jesteś jednym z maintainerów `trpc`, możesz użyć koncepcji przedstawionych tutaj w oficjalnej dokumentacji lub zasugerować mi lepsze podejście do autoryzacji websocket w sekcji komentarzy.
