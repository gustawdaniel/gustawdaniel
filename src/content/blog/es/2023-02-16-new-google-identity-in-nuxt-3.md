---
author: Daniel Gustaw
canonicalName: new-google-identity-in-nuxt-3
coverImage: http://localhost:8484/08a5e268-fcf7-4af8-ba14-376a20394223.avif
description: Nueva instalación de Google Identity para Nuxt 3 con verificación de credenciales en fastify.
excerpt: Nueva instalación de Google Identity para Nuxt 3 con verificación de credenciales en fastify.
publishDate: 2023-02-16 13:20:19+00:00
slug: es/nuevo-inicio-de-sesion-en-google
tags:
- google
title: Nueva Identidad de Google en Nuxt 3
updateDate: 2023-02-16 13:20:19+00:00
---

Hoy estaba asustado porque dos grandes bibliotecas no funcionaban con Google Sign In para Nuxt 3. Me refiero a `auth.nuxtjs` y `nuxt-vue3-google-signin`.

De stack overflow

[¿Cómo usar el módulo nuxtjs/auth-next con Nuxt3?](https://stackoverflow.com/questions/74559363/how-to-use-nuxtjs-auth-next-module-with-nuxt3)

Aprendí que la primera es incompatible con nuxt 3, pero está planeada en la hoja de ruta

[Hoja de Ruta · Nuxt](https://nuxt.com/docs/community/roadmap#%EF%B8%8F-roadmap)

La segunda simplemente no pudo funcionar, dando un error que sugería que algo estaba mal con mi id de cliente.

Revisé la documentación oficial de Google y vi esto:

![](http://localhost:8484/dc0afc0e-9d09-400f-98f2-f68c6026058b.avif)

[Integración de Google Sign-In en tu aplicación web | Autenticación | Desarrolladores de Google](https://www.gstatic.com/devrel-devsite/prod/vd277a93d7226f1fcf53372e6780919bb823bca6ca1c3adbaa8a14ef6554ad67d/developers/images/opengraph/teal.png)](https://developers.google.com/identity/sign-in/web/sign-in)

Se ve terrible, pero afortunadamente integré el botón de inicio de sesión de Google bastante rápido sin bibliotecas externas. En este artículo, mostraré cómo implementar la nueva Identidad de Google con Nuxt 3.

![](http://localhost:8484/9704407b-d5fc-4e05-84c3-95547050aa0c.avif)

## Identidad de Google - cómo es diferente

Dado que una imagen vale más que mil palabras, el nuevo botón de inicio de sesión contiene un avatar:

[Botón de inicio de sesión con Google UX | Autenticación | Desarrolladores de Google](https://developers.google.com/identity/gsi/web/guides/personalized-button)

![](http://localhost:8484/7e73b9a3-da99-4b05-92af-1d98c1196fdf.avif)

## Botón de Iniciar Sesión HTML

Para agregarlo a tu componente, necesitarás pegar el siguiente HTML.

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

o prepara tu propio en el configurador

[Generar código HTML | Autenticación | Desarrolladores de Google](https://developers.google.com/identity/gsi/web/tools/configurator)

![](http://localhost:8484/d4b19d15-18c7-4e7a-8fc5-63cb8f6c828a.avif)

Hay tres elementos que debemos conectar:

1. `config.public.googleClientId` - ID de cliente de Google
2. `googleLoginCallback` - función definida globalmente que obtendrá los resultados del inicio de sesión
3. biblioteca de Google que hará que estos botones funcionen

## Pasando .env a Nuxt 3

Para pasar .env a nuxt 3, puedes seguir esta respuesta

[¿Cómo pasar variables de entorno a nuxt en producción?](https://stackoverflow.com/questions/53993890/how-to-pass-env-variables-to-nuxt-in-production/74463160#74463160)

Creas un archivo `.env` con

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

para conectar estos valores puedes usar la biblioteca `dotenv`, pero prefiero `Makefile` como este.

```
include .env
export

node_modules: package.json
	npm i

up: node_modules
	npm run dev
```

En la configuración de nuxt deberías agregar

```
export default defineNuxtConfig({
    runtimeConfig: {
        public: {
            googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
        }
    },
})
```

y finalmente en el componente puedes acceder a `config` mediante

```
const config = useRuntimeConfig()
```

## Ampliando la ventana mediante una función de callback

La ventana por defecto no tiene `googleLoginCallback`, por lo que para agregarlo debes crear el archivo `types/global.d.ts` con

```
declare global {
    interface Window {
        googleLoginCallback: () => void;
    }
}
```

y en el componente agregar

```
if(process.client) {
  window.googleLoginCallback = (...args) => {
    console.log(args);
  }
}
```

## Cargar la biblioteca de cliente en Nuxt 3

Google menciona este paso en la página

[Cargar la biblioteca de cliente | Autenticación | Desarrolladores de Google](https://developers.google.com/identity/gsi/web/guides/client-library)

Pero no deberías añadir

```
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

en nuxt3, en su lugar use este código en su componente:

```
useHead({
  script: [{
    async: true,
    src: 'https://accounts.google.com/gsi/client',
    defer: true
  }]
})
```

Ahora deberías ver el botón de inicio de sesión. Deberías poder hacer clic en él, iniciar sesión y ver las credenciales en la consola. Suponiendo que configuraste correctamente el Cliente OAuth 2.0.

![](http://localhost:8484/1fa9c03c-8be1-48fe-b53a-ccff8d83e079.avif)

Y agregué localhost a los orígenes de JavaScript autorizados

![](http://localhost:8484/5da80aad-7e3a-4158-9fd7-25e34653b891.avif)

Después de iniciar sesión en la consola, verás un array con un solo objeto así:

```
{
  clientId:"xxx.apps.googleusercontent.com"
  client_id:"xxx.apps.googleusercontent.com"
  credential: "token"
  select_by:"auto"
}
```

El token de credencial es `JWT` con carga útil

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

Para verificarlo, debes enviarlo al backend.

![](http://localhost:8484/dd66e012-cd3b-4e6d-b07f-c332f74da32b.avif)

## Verificación de backend para credenciales de Google

Como backend podemos usar fastify. Describí la configuración de fastify en este blog aquí

[Inicio de sesión con Metamask - Backend Rest en Fastify (Node, Typescript, Prisma)](/login-by-metamask-rest-backend-in-fastify/)

así que ahora asumo que has completado el paso "Agregar Fastify con el primer punto de acceso" de este artículo.

En `fastify.ts` podemos agregar una línea con la ruta

```
app.post('/google-verify', Auth.googleVerify)
```

y en `routes/Auth.ts` define la función estática `googleVerify`.

Así que en `googleVerify` vamos a verificar si las credenciales fueron creadas correctamente por google.

## Verificando la autenticidad de las credenciales

Para verificar necesitamos instalar el paquete `google` en el backend según las instrucciones

[Verifica el token de ID de Google en el lado de tu servidor | Autenticación | Google Developers](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)

```
npm install google-auth-library --save
```

necesitamos el mismo `GOOGLE_CLIENT_ID` en el backend `.env`

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

en el archivo con el controlador - `routes/Auth.ts` podemos escribir nuestra función como

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

y ahora actualiza la parte del frontend. Primero `global.d.ts`

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

a continuación, agrega `API_URL` a `.env`, luego agrega `apiUrl` a `runtimeConfig` como `googleClientId`, finalmente podemos escribir la función de callback en el componente nuxt3 en la siguiente forma:

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

## Habilitar Cors en Fastify

olvidamos sobre `cors`

![](http://localhost:8484/a131da56-cca9-4264-844b-dd6592ce593d.avif)

![](http://localhost:8484/bcdedd8e-0e4c-43de-be3e-2b03686d2b4c.avif)

así que solución rápida

```
npm i @fastify/cors
```

y en `src/fastify.ts`

```
import cors from '@fastify/cors'

//...

    app.register(cors)
```

y podemos ver en la consola todos los detalles del usuario

![](http://localhost:8484/90ad6daa-3859-4482-979f-f01507bc1de7.avif)

No queremos llamar a `await client.verifyIdToken(` en ninguna solicitud, por lo que tenemos que intercambiar el JWT de Google por el nuestro. Así que vale la pena crear un usuario en tu base de datos y generar un token JWT para él, pero lo describí en el artículo mencionado anteriormente:

[Login by Metamask - Rest Backend in Fastify (Node, Typescript, Prisma)](/login-by-metamask-rest-backend-in-fastify/)
