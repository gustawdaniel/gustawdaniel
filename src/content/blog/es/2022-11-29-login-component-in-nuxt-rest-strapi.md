---
author: Daniel Gustaw
canonicalName: login-component-in-nuxt-rest-strapi
coverImage: http://localhost:8484/e5269211-5b98-4476-abdf-2196dfc06c7d.avif
description: Ejemplo simple de página de inicio de sesión en nuxt3 escrita como base para copiar y pegar en muchos proyectos similares.
excerpt: Ejemplo simple de página de inicio de sesión en nuxt3 escrita como base para copiar y pegar en muchos proyectos similares.
publishDate: 2022-11-29 19:22:30+00:00
slug: es/pagina-de-inicio-de-sesion-en-nuxt3
tags:
- nuxt
- strapi
- login
title: Componente de Inicio de Sesión en Nuxt (Rest Strapi)
updateDate: 2022-11-29 19:22:30+00:00
---

¿Cuántas veces en tu vida has implementado una vista de inicio de sesión? Yo lo he hecho demasiadas veces. Finalmente, para no buscar código para copiar en mis proyectos, decidí pegar aquí instrucciones simples sobre cómo construir un componente de inicio de sesión en nuxt.

![](http://localhost:8484/6aa24b83-38f2-470e-a682-95fa9766363d.avif)

Esta configuración utiliza strapi como backend, pero funcionará con cualquier API REST después de modificar el cuerpo y la URL. En la próxima parte crearemos un proyecto nuxt3, construiremos la página de inicio de sesión y pasaremos información sobre el usuario mediante una cookie al componente de perfil.

### Configurar el proyecto Nuxt

Para crear el proyecto:

```bash
npx nuxi init front_nuxt
```

Podemos crear un `Makefile` universal para iniciar el proyecto con `make up`

```makefile
node_modules: package.json
	npm i

up: node_modules
	npm run dev
```

Ahora, para comenzar a codificar, tenemos que reemplazar:

```
<NuxtWelcome />
```

en `app.vue` por

```
    <NuxtPage />
```

### Primera página (inicio de sesión)

Ahora crea la primera página

```
npx nuxi add page login
```

Necesitamos iniciar sesión a través de la API `REST`, pero en lugar de `axios`, utilizaremos `useFetch` disponible en nuxt. Para lograr este objetivo, tenemos que agregar un archivo `.env` con

```
NUXT_PUBLIC_BASE_URL=http://localhsot:1337
```

y anteponer líneas

```
include .env
export
```

al `Makefile` para leer `.env` sin el paquete `dotenv`.

A `nuxt.config.ts` tenemos que añadir

```
    runtimeConfig: {
        public: {
            baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
        },
    },
```

Ahora en `script` de `pages/login.vue` podemos definir `formBody` y `requestBody`

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

diferentes variables son consecuencia de la reactividad del método `useLazyFetch` que automáticamente enviará una solicitud http cuando se cambie `requestBody`. Así que para permitir modificar `formBody` sin enviar solicitudes `http`, tenemos que dividirlas en dos referencias reactivas distintas.

Nuestra solicitud será realizada por `useLazyFetch`

```typescript
const {data, error, pending} = await useLazyFetch(`${config.public.baseUrl}/api/auth/local`, {
  body: requestBody,
  method: 'post',
  immediate: false,
  watch: [],
})
```

finalmente podemos definir la función `login` que activa la solicitud http simplemente cambiando el cuerpo en las opciones de `useLazyFetch`.

```typescript
async function login() {
  requestBody.value = formBody.value;
}
```

En la plantilla estamos añadiendo un frontend super minimalista con un formulario de inicio de sesión y etiquetas `pre` para presentar datos:

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

### Pasando el token de usuario entre componentes

Para compartir el estado entre componentes, podemos usar un almacén como `pinia`, que puede ser persistido por `local-storage`. Otra solución es `cookie`. En nuestro caso, mostraremos la implementación de cookies porque está integrada en nuxt y requiere menos líneas de código. En proyectos más grandes, deberías considerar pinia como una solución más extensible, pero las cookies también tienen ventajas en el área de seguridad.

Vamos a crear dos variables mediante la función `useCookie`.

```typescript
const token = useCookie('token');
const user = useCookie('user');
```

ahora veremos los datos devueltos de la solicitud de inicio de sesión

```typescript
watch(data, (value) => {
  token.value = value.jwt;
  user.value = value.user;
})
```

nuestro resultado `useLazyFetch` ahora está extendido por `execute`

```typescript
const {data, error, execute, pending} = await useLazyFetch...
```

así que la función de inicio de sesión se puede reescribir

```typescript
function login() {
  if(JSON.stringify(requestBody.value) === JSON.stringify(formBody.value)) {
    execute()
  } else {
    requestBody.value = formBody.value;
  }
}
```

este cambio permite ejecutar el inicio de sesión muchas veces con la misma carga útil.

![](http://localhost:8484/70488004-a8c7-468a-974b-0f6cc66ee09e.avif)

Es especialmente importante para evitar errores, porque ahora también hemos añadido la función `logout`.

```typescript
function logout() {
  token.value = '';
  user.value = '';
}
```

En la plantilla añadimos `token` y `v-if` para mostrar el formulario de inicio de sesión para los usuarios no registrados y el botón de cierre de sesión para los usuarios registrados.

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

Ahora podemos crear la segunda página.

```
npx nuxi add page profile
```

y en el script obtener usuario y enrutador y luego decidir si necesitamos redirigir a la página de inicio de sesión

```typescript
import {useCookie, useRouter} from "#imports";

const user = useCookie('user');
const router = useRouter();

if(!user.value) {
  router.push('/login');
}
```

nuestro template simbólico puede tener forma

```html
<template>
  <div v-if="user">
    <p>Email: {{user.email}}</p>
  </div>
</template>
```

Eso es todo. Construimos una interfaz super simple con páginas de inicio de sesión y perfil. No hay estilo, no hay registro e incluso omití la parte de configuración de Strapi. Pero gracias a estas simplificaciones, es útil como base para acelerar la configuración de nuevos proyectos de Nuxt3. Espero que te sea útil y ayude a evitar situaciones como la de la imagen a continuación:

![](http://localhost:8484/dc2ca83a-d254-4988-af9e-451a4487403f.avif)
