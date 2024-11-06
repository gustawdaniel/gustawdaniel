---
author: Daniel Gustaw
canonicalName: new-google-identity-in-nuxt-3
coverImage: http://localhost:8484/08a5e268-fcf7-4af8-ba14-376a20394223.avif
description: Nowa instalacja Google Identity dla Nuxt 3 z weryfikacją poświadczeń w fastify.
excerpt: Nowa instalacja Google Identity dla Nuxt 3 z weryfikacją poświadczeń w fastify.
publishDate: 2023-02-16 13:20:19+00:00
slug: pl/nowe-logowanie-google
tags:
- google
title: Nowa tożsamość Google w Nuxt 3
updateDate: 2023-02-16 13:20:19+00:00
---

Dzisiaj się przestraszyłem, ponieważ dwie świetne biblioteki nie działały z Google Sign In dla Nuxt 3. Mam na myśli `auth.nuxtjs` i `nuxt-vue3-google-signin`.

Z Stack Overflow

[Jak używać modułu nuxtjs/auth-next z Nuxt3?](https://stackoverflow.com/questions/74559363/how-to-use-nuxtjs-auth-next-module-with-nuxt3)

Dowiedziałem się, że pierwsza jest niekompatybilna z nuxt 3, ale jest to zaplanowane w roadmapie.

[Roadmap · Nuxt](https://nuxt.com/docs/community/roadmap#%EF%B8%8F-roadmap)

Druga po prostu nie mogła działać, wyświetlając błąd, który sugerował, że coś jest nie tak z moim identyfikatorem klienta.

Sprawdziłem oficjalna dokumentację Google i zobaczyłem to:

![](http://localhost:8484/dc0afc0e-9d09-400f-98f2-f68c6026058b.avif)

[Integracja logowania Google do twojej aplikacji internetowej | Uwierzytelnianie | Google Developers](https://www.gstatic.com/devrel-devsite/prod/vd277a93d7226f1fcf53372e6780919bb823bca6ca1c3adbaa8a14ef6554ad67d/developers/images/opengraph/teal.png)](https://developers.google.com/identity/sign-in/web/sign-in)

Wygląda strasznie, ale na szczęście szybko zintegrowałem przycisk logowania Google bez użycia zewnętrznych bibliotek. W tym artykule pokażę, jak zaimplementować nową tożsamość Google w Nuxt 3.

![](http://localhost:8484/9704407b-d5fc-4e05-84c3-95547050aa0c.avif)

## Tożsamość Google - jak się różni

Ponieważ obraz jest wart więcej niż tysiąc słów, nowy przycisk logowania zawiera awatar:

[Przycisk Zaloguj się za pomocą Google UX | Uwierzytelnianie | Google Developers](https://developers.google.com/identity/gsi/web/guides/personalized-button)

![](http://localhost:8484/7e73b9a3-da99-4b05-92af-1d98c1196fdf.avif)

## Przycisk Zaloguj się HTML

Aby dodać go do swojego komponentu, będziesz musiał wkleić poniższy kod HTML

```
  <div id="g_id_onload"
       :data-client_id="config.public.googleClientId"
       data-context="signin"
       data-ux_mode="popup"
       data-callback="googleLoginCallback"
       data-auto_select="true"
       data-itp_support="true">
  </div>

  <div class="g_id_signin"
       data-type="standard"
       data-shape="pill"
       data-theme="outline"
       data-text="continue_with"
       data-size="large"
       data-logo_alignment="left">
  </div>
```

lub przygotuj swój własny w konfiguratorze

[Generuj kod HTML | Uwierzytelnianie | Google Developers](https://developers.google.com/identity/gsi/web/tools/configurator)

![](http://localhost:8484/d4b19d15-18c7-4e7a-8fc5-63cb8f6c828a.avif)

Są trzy elementy, które musimy połączyć:

1. `config.public.googleClientId` - identyfikator klienta Google
2. `googleLoginCallback` - globalnie zdefiniowana funkcja, która uzyska wyniki logowania
3. biblioteka google, która sprawi, że te przyciski będą działać

## Przekazywanie .env do Nuxt 3

Aby przekazać .env do nuxt 3, możesz postępować zgodnie z tym rozwiązaniem

[Jak przekazać zmienne środowiskowe do nuxt w produkcji?](https://stackoverflow.com/questions/53993890/how-to-pass-env-variables-to-nuxt-in-production/74463160#74463160)

Tworzysz plik `.env` z

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

aby połączyć te wartości, możesz użyć biblioteki `dotenv`, ale wolę `Makefile` taki jak ten

```
include .env
export

node_modules: package.json
	npm i

up: node_modules
	npm run dev
```

W konfiguracji nuxt należy dodać

```
export default defineNuxtConfig({
    runtimeConfig: {
        public: {
            googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
        }
    },
})
```

a na końcu w komponencie możesz uzyskać dostęp do `config` poprzez

```
const config = useRuntimeConfig()
```

## Rozszerzanie obiektu window za pomocą funkcji zwrotnej

Obiekt window domyślnie nie ma `googleLoginCallback`, więc aby go dodać, należy stworzyć plik `types/global.d.ts` z

```
declare global {
    interface Window {
        googleLoginCallback: () => void;
    }
}
```

i w komponencie dodaj

```
if(process.client) {
  window.googleLoginCallback = (...args) => {
    console.log(args);
  }
}
```

## Załaduj bibliotekę klienta w Nuxt 3

Google wspomina o tym kroku na stronie

[Załaduj bibliotekę klienta | Uwierzytelnianie | Google Developers](https://developers.google.com/identity/gsi/web/guides/client-library)

Ale nie powinieneś dodawać

```
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

w nuxt3 zamiast używać tego kodu w swoim komponencie:

```
useHead({
  script: [{
    async: true,
    src: 'https://accounts.google.com/gsi/client',
    defer: true
  }]
})
```

Teraz powinieneś zobaczyć przycisk logowania. Powinieneś móc kliknąć go, zalogować się i zobaczyć dane uwierzytelniające w konsoli. Zakładając, że prawidłowo skonfigurowałeś klienta OAuth 2.0.

![](http://localhost:8484/1fa9c03c-8be1-48fe-b53a-ccff8d83e079.avif)

I dodano localhost do Autoryzowanych pochodzeń JavaScript

![](http://localhost:8484/5da80aad-7e3a-4158-9fd7-25e34653b891.avif)

Po zalogowaniu się w konsoli zobaczysz tablicę z pojedynczym obiektem, tak jak to:

```
{
  clientId:"xxx.apps.googleusercontent.com"
  client_id:"xxx.apps.googleusercontent.com"
  credential: "token"
  select_by:"auto"
}
```

Token uwierzytelniający to `JWT` z ładunkiem.

```
{
  "iss": "https://accounts.google.com",
  "nbf": 1676544985,
  "aud": "xxx.apps.googleusercontent.com",
  "sub": "108561822785941523583",
  "email": "gustaw.daniel@gmail.com",
  "email_verified": true,
  "azp": "xxx.apps.googleusercontent.com",
  "name": "Daniel Gustaw",
  "picture": "https://lh3.googleusercontent.com/a/AEdFTp64X-0imH5xey6U4JDKzFRrMXdtg4lGy8GlEjLxyQ=s96-c",
  "given_name": "Daniel",
  "family_name": "Gustaw",
  "iat": 1676545285,
  "exp": 1676548885,
  "jti": "a7e1afd716925de385bf0069c7c370f8e64580d3"
}
```

Aby to zweryfikować, powinieneś wysłać to do backendu.

![](http://localhost:8484/dd66e012-cd3b-4e6d-b07f-c332f74da32b.avif)

## Weryfikacja backendu dla poświadczeń Google

Jako backend możemy użyć fastify. Opisałem konfigurację fastify w tym blogu tutaj

[Logowanie za pomocą Metamask - Backend Rest w Fastify (Node, Typescript, Prisma)](/login-by-metamask-rest-backend-in-fastify/)

zakładam, że wykonałeś krok „Dodaj Fastify z pierwszym punktem końcowym” z tego artykułu.

W `fastify.ts` możemy dodać linię z ścieżką

```
app.post('/google-verify', Auth.googleVerify)
```

i w `routes/Auth.ts` zdefiniuj statyczną funkcję `googleVerify`.

W `googleVerify` będziemy sprawdzać, czy dane uwierzytelniające zostały poprawnie utworzone przez google.

## Sprawdzanie autentyczności danych uwierzytelniających

Aby zweryfikować, musimy zainstalować pakiet `google` na backendzie zgodnie z instrukcją

[Zweryfikuj token identyfikacyjny Google po stronie serwera | Uwierzytelnianie | Google Developers](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)

```
npm install google-auth-library --save
```

potrzebujemy tego samego `GOOGLE_CLIENT_ID` w backendowym `.env`

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

w pliku z kontrolerem - `routes/Auth.ts` możemy napisać naszą funkcję jako

```
import {FastifyRequest} from "fastify";
import {OAuth2Client} from 'google-auth-library';

export class Auth {
  static async googleVerify(req: FastifyRequest<{ Body: { credential: string } }>) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if(!payload) throw new Error(`No payload`);

    console.log(payload);
    return payload;
  }
}
```

a teraz zaktualizuj część frontendową. Najpierw `global.d.ts`

```
interface GoogleAuthenticatedResponse {
    clientId: string
    client_id: string
    credential: string
    select_by: "auto"
}

declare global {
    interface Window {
        googleLoginCallback: (userData: GoogleAuthenticatedResponse) => void;
    }
}
```

następnie dodaj `API_URL` do `.env`, a następnie dodaj `apiUrl` do `runtimeConfig` tak jak `googleClientId`, na koniec możemy napisać funkcję zwrotną w komponencie nuxt3 w formie:

```
if(process.client) {
  window.googleLoginCallback = (userData) => {
    console.log("ud", userData);
    axios.post(config.public.apiUrl + '/google-verify', {
      credential: userData.credential
    }).then((res) => {
      console.log("pl", res.data)
    }).catch(console.error)
  }
}
```

## Włącz CORS w Fastify

zapomnieliśmy o `cors`

![](http://localhost:8484/a131da56-cca9-4264-844b-dd6592ce593d.avif)

![](http://localhost:8484/bcdedd8e-0e4c-43de-be3e-2b03686d2b4c.avif)

więc szybka poprawka

```
npm i @fastify/cors
```

i w `src/fastify.ts`

```
import cors from '@fastify/cors'

//...

    app.register(cors)
```

i możemy zobaczyć w konsoli wszystkie szczegóły użytkownika

![](http://localhost:8484/90ad6daa-3859-4482-979f-f01507bc1de7.avif)

Nie chcemy wywoływać `await client.verifyIdToken(` przy żadnym żądaniu, więc musimy wymienić token JWT Google na nasz własny, dlatego warto utworzyć użytkownika w swojej bazie danych i wygenerować dla niego token JWT, ale opisałem to w wcześniej wspomnianym artykule:

[Logowanie przez Metamask - Rest Backend w Fastify (Node, Typescript, Prisma)](/login-by-metamask-rest-backend-in-fastify/)
