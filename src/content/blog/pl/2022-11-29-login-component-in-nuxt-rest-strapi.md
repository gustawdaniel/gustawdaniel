---
author: Daniel Gustaw
canonicalName: login-component-in-nuxt-rest-strapi
coverImage: http://localhost:8484/e5269211-5b98-4476-abdf-2196dfc06c7d.avif
description: Prosty przykład strony logowania w nuxt3, napisany jako baza do kopiowania i wklejania w wielu podobnych projektach.
excerpt: Prosty przykład strony logowania w nuxt3, napisany jako baza do kopiowania i wklejania w wielu podobnych projektach.
publishDate: 2022-11-29 19:22:30+00:00
slug: pl/strona-logowania-w-nuxt3
tags:
- nuxt
- strapi
- login
title: Komponent logowania w Nuxt (Rest Strapi)
updateDate: 2022-11-29 19:22:30+00:00
---

Ile razy w swoim życiu zaimplementowałeś widok logowania? Zrobiłem to zbyt wiele razy. W końcu, aby nie szukać kodu do skopiowania do moich projektów, postanowiłem wkleić tutaj proste instrukcje, jak zbudować prosty komponent logowania w nuxt.

![](http://localhost:8484/6aa24b83-38f2-470e-a682-95fa9766363d.avif)

Ta konfiguracja używa strapi jako backendu, ale będę pracować z każdym API rest po modyfikacjach w ciele i URL. W następnej części stworzymy projekt nuxt3, zbudujemy stronę logowania i przekażemy informacje o użytkowniku przez pliki cookie do komponentu profilu.

### Konfiguracja projektu Nuxt

Aby stworzyć projekt:

```bash
npx nuxi init front_nuxt
```

Możemy stworzyć uniwersalny `Makefile`, aby uruchomić projekt za pomocą `make up`

```makefile
node_modules: package.json
	npm i

up: node_modules
	npm run dev
```

Teraz, aby rozpocząć kodowanie, musimy zastąpić:

```
<NuxtWelcome />
```

w `app.vue` przez

```
    <NuxtPage />
```

### Pierwsza strona (logowanie)

Teraz stwórz pierwszą stronę

```
npx nuxi add page login
```

Musimy się zalogować za pomocą `REST` API, ale zamiast `axios` użyjemy `useFetch` dostępnego w nuxt. Aby osiągnąć ten cel, musimy dodać plik `.env` z

```
NUXT_PUBLIC_BASE_URL=http://localhsot:1337
```

i dodaj na początku linie

```
include .env
export
```

do `Makefile`, aby odczytać `.env` bez pakietu `dotenv`.

Do `nuxt.config.ts` musimy dodać

```
    runtimeConfig: {
        public: {
            baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
        },
    },
```

Teraz w `script` pliku `pages/login.vue` możemy zdefiniować `formBody` i `requestBody`

```typescript
import {ref, useLazyFetch, useRuntimeConfig} from "#imports";

const config = useRuntimeConfig();

const formBody = ref<{ identifier: string, password: string }>({
  identifier: 'user@ok.com',
  password: 'pass'
});

const requestBody = ref<{ identifier: string, password: string }>({
  identifier: '',
  password: ''
});
```

różne zmienne są konsekwencją reaktywności metody `useLazyFetch`, która automatycznie wyśle żądanie http, gdy `requestBody` zostanie zmienione. Aby móc modyfikować `formBody` bez wysyłania żądań `http`, musimy podzielić je na dwa odrębne reaktywne referencje.

Nasze żądanie zostanie wykonane przez `useLazyFetch`

```typescript
const {data, error, pending} = await useLazyFetch(`${config.public.baseUrl}/api/auth/local`, {
  body: requestBody,
  method: 'post',
  immediate: false,
  watch: [],
})
```

w końcu możemy zdefiniować funkcję `login`, która wywołuje żądanie http, po prostu zmieniając treść w opcjach `useLazyFetch`.

```typescript
async function login() {
  requestBody.value = formBody.value;
}
```

W szablonie dodajemy super minimalistyczny frontend z formularzem logowania i tagami `pre`, aby prezentować dane:

```html
<template>
  <div>
    <pre>PENDING: {{ pending }}</pre>
    <pre>DATA: {{ data }}</pre>
    <pre>ERROR: {{ error }}</pre>
    <hr>

    <form @submit.prevent="login">
      <label for="email">
        Email
        <input type="text" v-model.lazy="formBody.identifier">
      </label>
      <label for="password">
        Password
        <input type="password" v-model.lazy="formBody.password">
      </label>

      <button>Login</button>
    </form>
  </div>
</template>
```

![](http://localhost:8484/3e5849f5-3225-4a9d-a5f3-5dc3fb8781a5.avif)

### Przekazywanie tokena użytkownika między komponentami

Aby dzielić się stanem między komponentami, możemy użyć magazynu, takiego jak `pinia`, który można utrwalić za pomocą `local-sorage`. Inne rozwiązanie to `ciasteczka`. W naszym przypadku pokażemy implementację ciasteczek, ponieważ jest wbudowana w nuxt i wymaga mniej linii kodu. W większych projektach warto rozważyć pinia jako bardziej rozszerzalne rozwiązanie, ale ciasteczka także mają zalety w obszarze bezpieczeństwa.

Stwórzmy dwie zmienne przy użyciu funkcji `useCookie`.

```typescript
const token = useCookie('token');
const user = useCookie('user');
```

teraz przyjrzymy się danym zwróconym z żądania logowania

```typescript
watch(data, (value) => {
  token.value = value.jwt;
  user.value = value.user;
})
```

nasz wynik `useLazyFetch` jest teraz rozszerzony o `execute`

```typescript
const {data, error, execute, pending} = await useLazyFetch...
```

więc funkcję logowania można przepisz.

```typescript
function login() {
  if(JSON.stringify(requestBody.value) === JSON.stringify(formBody.value)) {
    execute()
  } else {
    requestBody.value = formBody.value;
  }
}
```

ta zmiana pozwala na wielokrotne wykonanie logowania z tym samym ładunkiem.

![](http://localhost:8484/70488004-a8c7-468a-974b-0f6cc66ee09e.avif)

Jest to szczególnie ważne, aby uniknąć błędów, ponieważ teraz dodaliśmy także funkcję `logout`

```typescript
function logout() {
  token.value = '';
  user.value = '';
}
```

W szablonie dodaliśmy `token` i `v-if`, aby wyświetlić formularz logowania dla niezalogowanych oraz przycisk wylogowania dla zalogowanych użytkowników.

```html
<template>
  <div>
    <pre>{{ token }}</pre>
    <hr>
    <pre>PENDING: {{ pending }}</pre>
    <pre>DATA: {{ data }}</pre>
    <pre>ERROR: {{ error }}</pre>
    <hr>

    <div v-if="token">

      <pre>{{user}}</pre>

      <button @click="logout">Logout</button>
    </div>
    <div v-else>
      <form @submit.prevent="login">
        <label for="email">
          Email
          <input type="text" v-model.lazy="formBody.identifier">
        </label>
        <label for="password">
          Password
          <input type="password" v-model.lazy="formBody.password">
        </label>

        <button>Login</button>
      </form>
    </div>
  </div>
</template>
```

Możemy teraz stworzyć drugą stronę.

```
npx nuxi add page profile
```

i w skrypcie pobierz użytkownika i router, a następnie zdecyduj, czy musimy przekierować do logowania

```typescript
import {useCookie, useRouter} from "#imports";

const user = useCookie('user');
const router = useRouter();

if(!user.value) {
  router.push('/login');
}
```

nasz symboliczny szablon może mieć formę

```html
<template>
  <div v-if="user">
    <p>Email: {{user.email}}</p>
  </div>
</template>
```

To już wszystko. Zbudowaliśmy super prosty interfejs z stronami logowania i profilu. Nie ma stylizacji, nie ma rejestracji, a nawet pominąłem część z konfiguracją strapi. Dzięki tym uproszczeniom jest to przydatna baza, aby przyspieszyć ustawianie nowych projektów nuxt3. Mam nadzieję, że będzie to dla Ciebie przydatne i pomoże uniknąć sytuacji jak na obrazku poniżej:

![](http://localhost:8484/dc2ca83a-d254-4988-af9e-451a4487403f.avif)
