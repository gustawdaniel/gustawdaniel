---
title: Apollo Server w Node JS + Mongo DB + Prisma
slug: jak-napisac-backend-w-apollo
publishDate: 1970-01-01T00:00:00.000Z
date_updated: 2021-07-03T17:36:42.000Z
draft: true
---

Pokażę jak napisać aplikację, która wylicza wpływ nagłych zmiany rezerwy BTC na giełdach na ich cenę. Kod piszemy od zera w technologiach

* node js (typescript)
* mongo db (prisma)
* apollo server

## Przygotowanie serwera Apollo

Inicjalizujemy projekt:

```
npm init -y && tsc --init && npm i -D typescript @types/node @types/jest jest jest-extended ts-jest prisma nodemon ts-node && npm i @prisma/client apollo-server graphql
```

Przygotowujemy nodemon

```
echo '{ "watch": ["src"],  "ext": "ts,json",  "ignore": ["src/**/*.spec.ts"] }' > nodemon.json
```

W `package.json` ustawiamy skrypty

```
    "start": "nodemon --exec 'ts-node' src/gql.ts",
    "test": "jest",
    "codegen": "graphql-codegen --config codegen.yml"
```

Dołączamy plik `codegen.yml` o treści

```
overwrite: true
#schema: "http://localhost:4000"
schema: "./src/type-defs.graphql"
documents: null
generates:
  src/generated/graphql.ts:
    plugins:
      - "typescript"
      - "typescript-resolvers"
      - "typescript-mongodb"
      - "typescript-document-nodes"
  ./graphql.schema.json:
    plugins:
      - "introspection"
```

Instalujemy paczki:

```
npm i -D @graphql-codegen/cli @graphql-codegen/introspection @graphql-codegen/typescript @graphql-codegen/typescript-document-nodes @graphql-codegen/typescript-mongodb @graphql-codegen/typescript-resolvers && npm i -g graphql-codegen
```

Aby wygenerować typy typescript na podstawie schematu graphql będziemy wykonywać komendę `npm run codegen`, ale żeby ona zadziałała w pliku `./src/type-defs.graphql` musimy umieścić typy graphql. Zacznijmy od prostego

```
type Query {
    "A simple type for getting started!"
    hello: String
}
```

Żeby zaimportować ten plik i użyć go do konfiguracji serwera potrzebujemy jeszcze jednej paczki:

```
npm i -D graphql-import-node
```

Jednocześnie w pliku `tsconfig.json` dodajemy:

```
"resolveJsonModule": true
```

oraz ustawiamy

```
"target": "ESNext",
```

Teraz w pliku `src/gql.ts` stawiamy najprostszy możliwy serwer graphql

```
import "graphql-import-node";

import { ApolloServer }from 'apollo-server';
import typeDefs from './type-defs.graphql'

const resolvers = {
    Query: {
        hello: () => 'world',
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

server.listen().then(({ url }) => {
    console.log(`? Server ready at ${url}`);
});
```

Po wystartowaniu serwera poleceniem

```
npm run start
```

pod adresem `localhost:4000` zobaczymy

![](https://gustawdaniel.com/content/images/2021/07/Screenshot-from-2021-07-03-19-37-56.png)
