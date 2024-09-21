---
author: Daniel Gustaw
canonicalName: new-google-identity-in-nuxt-3
coverImage: http://localhost:8484/08a5e268-fcf7-4af8-ba14-376a20394223.avif
date_updated: 2023-02-16 13:20:19+00:00
description: New Google Identity installation for Nuxt 3 with credentials verification
  in fastify.
excerpt: New Google Identity installation for Nuxt 3 with credentials verification
  in fastify.
publishDate: 2023-02-16 13:20:19+00:00
slug: en/new-google-login
tags:
- google
title: New Google Identity in Nuxt 3
---



I was scared today because two great libraries did not work with Google Sign In for Nuxt 3. I mean `auth.nuxtjs` and `nuxt-vue3-google-signin`.

From stack overflow

[How to use nuxtjs/auth-next module with Nuxt3?](https://stackoverflow.com/questions/74559363/how-to-use-nuxtjs-auth-next-module-with-nuxt3)

I learned that first one is incompatible with nuxt 3, but it is planned on roadmap

[Roadmap · Nuxt](https://nuxt.com/docs/community/roadmap#%EF%B8%8F-roadmap)

Second simply could not work giving error that was suggesting that something is wrong with my client id.

I checked official Google Docs and see this:

![](http://localhost:8484/dc0afc0e-9d09-400f-98f2-f68c6026058b.avif)

[Integrating Google Sign-In into your web app | Authentication | Google Developers](https://www.gstatic.com/devrel-devsite/prod/vd277a93d7226f1fcf53372e6780919bb823bca6ca1c3adbaa8a14ef6554ad67d/developers/images/opengraph/teal.png)](https://developers.google.com/identity/sign-in/web/sign-in)

Looks terrible, but hepilly I integrated google sign in button quite fast without external libs. In this article I will show how to implement new Google Identity with Nuxt 3.

![](http://localhost:8484/9704407b-d5fc-4e05-84c3-95547050aa0c.avif)

## Google Identity - how it is different

Because image is worth more than thousand of words, new login button contains avatar:

[Sign in with Google button UX | Authentication | Google Developers](https://developers.google.com/identity/gsi/web/guides/personalized-button)

![](http://localhost:8484/7e73b9a3-da99-4b05-92af-1d98c1196fdf.avif)

## Sign In button HTML

To add it to your component you will need paste below html

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

or prepare your own in configurator

[Generate HTML code | Authentication | Google Developers](https://developers.google.com/identity/gsi/web/tools/configurator)

![](http://localhost:8484/d4b19d15-18c7-4e7a-8fc5-63cb8f6c828a.avif)

There are three elements that we have to connect:

1. `config.public.googleClientId` - google client ID
2. `googleLoginCallback` - globally defined function that will get results of login
3. google library that will make these buttons working

## Passing .env to Nuxt 3

To pass .env to nuxt 3 you can follow this answer

[How to pass env variables to nuxt in production?](https://stackoverflow.com/questions/53993890/how-to-pass-env-variables-to-nuxt-in-production/74463160#74463160)

You create `.env` file with

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

to connect these values you can use `dotenv` library, but I prefere `Makefile` like this one

```
include .env
export

node_modules: package.json
	npm i

up: node_modules
	npm run dev
```

In nuxt config you should add

```
export default defineNuxtConfig({
    runtimeConfig: {
        public: {
            googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
        }
    },
})
```

and finally in component you can get access to `config` by

```
const config = useRuntimeConfig()
```

## Extending window by callback function

Window by default do not have `googleLoginCallback` so to add it you should create file `types/global.d.ts` with

```
declare global {
    interface Window {
        googleLoginCallback: () => void;
    }
}
```

and in component add

```
if(process.client) {
  window.googleLoginCallback = (...args) => {
    console.log(args);
  }
}
```

## Load the client library in Nuxt 3

Google mentions about this step on page

[Load the client library | Authentication | Google Developers](https://developers.google.com/identity/gsi/web/guides/client-library)

But you should not add

```
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

in nuxt3, Instead use this code in your component:

```
useHead({
  script: [{
    async: true,
    src: 'https://accounts.google.com/gsi/client',
    defer: true
  }]
})
```

Now you should see login button. You should be able to click on it, login and see credentials in console. Assuming that you correctly configured OAuth 2.0 Client

![](http://localhost:8484/1fa9c03c-8be1-48fe-b53a-ccff8d83e079.avif)

And added localhost to Authorized JavaScript origins

![](http://localhost:8484/5da80aad-7e3a-4158-9fd7-25e34653b891.avif)

After login in console you will see array with single object like this

```
{
  clientId:"xxx.apps.googleusercontent.com"
  client_id:"xxx.apps.googleusercontent.com"
  credential: "token"
  select_by:"auto"
}
```

Credentail token is `JWT` with payload

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

To verify it you should send it to backend.

![](http://localhost:8484/dd66e012-cd3b-4e6d-b07f-c332f74da32b.avif)

## Backend verification for Google credential

As backend we can use fastify. I described fastify config on this blog here

[Login by Metamask - Rest Backend in Fastify (Node, Typescript, Prisma)](/login-by-metamask-rest-backend-in-fastify/)

so now I assume you have done step "Add Fastify with first endpoint" from this article.

In `fastify.ts` we can add line with path

```
app.post('/google-verify', Auth.googleVerify)
```

and in `routes/Auth.ts` define static function `googleVerify`.

So in `googleVerify` we will to check if credentials are correctly created by google.

## Checking credentials authenticity

To verify we need install `google` package on backend according to instruction

[Verify the Google ID token on your server side | Authentication | Google Developers](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)

```
npm install google-auth-library --save
```

we need the same `GOOGLE_CLIENT_ID` in backend `.env`

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

in file with controller - `routes/Auth.ts` we can write our function as

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

and now update frontend part. First `global.d.ts`

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

next add `API_URL` to `.env`, then add `apiUrl` to `runtimeConfig` like `googleClientId`, finally we can write callback function in nuxt3 component in form:

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

## Enable Cors in Fastify

we forgot about `cors`

![](http://localhost:8484/a131da56-cca9-4264-844b-dd6592ce593d.avif)

![](http://localhost:8484/bcdedd8e-0e4c-43de-be3e-2b03686d2b4c.avif)

so quick fix

```
npm i @fastify/cors
```

and in `src/fastify.ts`

```
import cors from '@fastify/cors'

//...

    app.register(cors)
```

and we can see in console all user's details

![](http://localhost:8484/90ad6daa-3859-4482-979f-f01507bc1de7.avif)

We do not want to call `await client.verifyIdToken(` on any request so we have to exchange google JWT for our own, so it is worth to create user in your database and generate jwt token for him, but I described this in mentione before article:

[Login by Metamask - Rest Backend in Fastify (Node, Typescript, Prisma)](/login-by-metamask-rest-backend-in-fastify/)
