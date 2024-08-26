---
author: Daniel Gustaw
canonicalName: login-component-in-nuxt-rest-strapi
coverImage: http://localhost:8484/e5269211-5b98-4476-abdf-2196dfc06c7d.avif
date_updated: 2022-11-29 19:22:30+00:00
description: Simple example of login page in nuxt3 written as base to copy and paste
  in many similar projects.
excerpt: Simple example of login page in nuxt3 written as base to copy and paste in
  many similar projects.
publishDate: 2022-11-29 19:22:30+00:00
slug: en/login-page-in-nuxt3
tags:
- nuxt
- strapi
- login
title: Login Component in Nuxt (Rest Strapi)
---



How many times in your live did you implemented login view? I did it too much times. Finally to no search code to copy in my projects I decided to paste here easy instruction how to build simple login component in nuxt.

![](http://localhost:8484/6aa24b83-38f2-470e-a682-95fa9766363d.avif)

This setup using strapi as backend, but I will works with any rest API after body and url modifications. In next part we will create nuxt3 project, build login page and pass info about user by cookie to profile component.

### Setup Nuxt project

To create project:

```bash
npx nuxi init front_nuxt
```

We can create universal `Makefile` to start project by `make up`

```makefile
node_modules: package.json
	npm i

up: node_modules
	npm run dev
```

Now to start coding we have to replace:

```
<NuxtWelcome />
```

in `app.vue` by

```
    <NuxtPage />
```

### First page (login)

Now create first page

```
npx nuxi add page login
```

We need to login by `REST` api but instead of `axios` we will use `useFetch` available in nuxt. To achieve this goal we have to add `.env` file with

```
NUXT_PUBLIC_BASE_URL=http://localhsot:1337
```

and prepend lines

```
include .env
export
```

to the `Makefile` to read `.env` without `dotenv` package.

To `nuxt.config.ts` we have to add

```
    runtimeConfig: {
        public: {
            baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
        },
    },
```

Now in `script` of `pages/login.vue` we can define `formBody` and `requestBody`

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

different variables are consequence of reactivity of `useLazyFetch` method that will automatically send http request when `requestBody` will be changed. So to allow modify `formBody` without sending `http` requests we have to split them to two distinct reactive references.

Our request will be performed by `useLazyFetch`

```typescript
const {data, error, pending} = await useLazyFetch(`${config.public.baseUrl}/api/auth/local`, {
  body: requestBody,
  method: 'post',
  immediate: false,
  watch: [],
})
```

finally we can define `login` function that trigger http request simply changing body in `useLazyFetch` options.

```typescript
async function login() {
  requestBody.value = formBody.value;
}
```

In template we adding super minimalistic frontend with login form and `pre` tags to present data:

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

### Passing user token between components

To share state between components we can use store like `pinia`, that can be persisted by `local-sorage`. Other solution is `cookie`. In our case we will show cokkie implementation because it is build in nuxt and require less lines of code. In biger projects you should consider pinia as more extendable and solution but cookies also have advantages in security area.

Lets create two variables by `useCookie` function.

```typescript
const token = useCookie('token');
const user = useCookie('user');
```

now we will watch on data returned from login request

```typescript
watch(data, (value) => {
  token.value = value.jwt;
  user.value = value.user;
})
```

our `useLazyFetch` result is now extended by `execute`

```typescript
const {data, error, execute, pending} = await useLazyFetch...
```

so login function can be rewritten

```typescript
function login() {
  if(JSON.stringify(requestBody.value) === JSON.stringify(formBody.value)) {
    execute()
  } else {
    requestBody.value = formBody.value;
  }
}
```

this change allow to execute login many times with she same payload.

![](http://localhost:8484/70488004-a8c7-468a-974b-0f6cc66ee09e.avif)

It is especially important to avoid bugs, because we now added also `logout` function

```typescript
function logout() {
  token.value = '';
  user.value = '';
}
```

In template we added `token` and `v-if` to display login form for not logged in and logout button for logged in users.

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

We can now create second page

```
npx nuxi add page profile
```

and in script get user and router and then decide if we need to redirect to login

```typescript
import {useCookie, useRouter} from "#imports";

const user = useCookie('user');
const router = useRouter();

if(!user.value) {
  router.push('/login');
}
```

our symbolic template can have form

```html
<template>
  <div v-if="user">
    <p>Email: {{user.email}}</p>
  </div>
</template>
```

That's it. We built super simple front with login and profile pages. There is no styling, no registration and even 
I skipped part with strapi setup. But thanks to these simplifications it is useful as base to speedup setting up new 
nuxt3 projects. I hope it will be useful for you and help to avoid situations like on image below:

![](http://localhost:8484/dc2ca83a-d254-4988-af9e-451a4487403f.avif)
