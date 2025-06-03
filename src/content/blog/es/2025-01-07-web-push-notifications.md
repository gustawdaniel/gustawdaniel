---
author: Daniel Gustaw
canonicalName: web-push-notifications
coverImage: https://ucarecdn.com/e31317ea-2c64-41fd-8e2e-44224eab989a/-/preview/640x640/
description: Notificación push web escrita en JavaScript puro sin ninguna biblioteca.
excerpt: Notificación push web escrita en JavaScript puro sin ninguna biblioteca.
publishDate: 2025-01-07 00:00:00+00:00
slug: es/notificaciones-push-web
tags:
- web
- push
- notifications
title: Notificaciones Push Web
updateDate: 2025-01-07 00:00:00+00:00
---

## Crear Proyecto Vite

```bash
pnpm create vite .
```

### Instalar el paquete `web-push`.

```bash
pnpm add web-push
```

### Generar claves VAPID

```bash
pnpm web-push generate-vapid-keys --json > keys.json
```

También se puede hacer de manera programática mediante:

```
import fs from 'fs'
import push from 'web-push'

const keys = push.generateVAPIDKeys();

fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2));
```

### Obtener acuerdo sobre notificaciones

En la mayoría de las instrucciones verás `Notification.requestPermission()` en este lugar.

Pero se puede simplificar. Podemos usar el método `pushManager.subscribe()` descrito en:

- https://developer.mozilla.org/es/docs/Web/API/ServiceWorkerRegistration
- https://developer.mozilla.org/es/docs/Web/API/ServiceWorkerRegistration/pushManager

Para tener acceso a `pushManager` debemos registrar el service worker.

### Crear service worker

```javascript
// public/sw.js
self.addEventListener('push', (message) => {
    const payload = message.data.json();

    console.log(payload);

    self.registration
        .showNotification(payload.title, {
            body: payload.body,
        })
        .catch(console.error);
});
```

Ahora puedes registrar el service worker en tu script principal.

```typescript
// src/main.ts
document.addEventListener('DOMContentLoaded', async () => {
    await navigator.serviceWorker.register('sw.js');
})
```

### Suscribirse a las notificaciones push

No podemos suscribirnos a las notificaciones después de cargar la página porque el usuario tiene que activarlo manualmente.

Vamos a crear un botón en `main.ts`

```typescript
// src/main.ts
import {setupSubscription} from './subscription.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="card">
       <p>Agree on notifications</p>
      <button id="subscribe" type="button">Subscribe</button>
    </div>
  </div>
`

setupSubscription(document.querySelector<HTMLButtonElement>('#subscribe')!)
```

y manejar clic en `subscription.ts`

```typescript
// src/subscription.ts
export function setupSubscription(subscribeButton: HTMLButtonElement) {
    console.log('subscribeButton', subscribeButton);

    subscribeButton.addEventListener('click', async () => {
        try {
            const sw = await navigator.serviceWorker.ready;
            const push = await sw.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: '<public vapid key>'
            });
            console.log(push.toJSON());
            // TODO: Send subscription to server
        } catch (err) {
            console.error(err);
        }
    })
}
```

`push` objeto impreso en la consola tiene que ser copiado al back-end en el siguiente paso. Hagámoslo manualmente por ahora.

## Enviar notificaciones

Ahora vamos a escribir el back-end en Node.js.

```typescript
import push from 'web-push'
import keys from './keys.json' assert { type: 'json' }

push.setVapidDetails('https://myapp.com', keys.publicKey, keys.privateKey);

// there should be object copied from browser console
let sub: push.PushSubscription = {
    "endpoint": "https://jmt17.google.com/fcm/send/eeg8M0Ydr0Y:APA91bE5xr9wV2hLFyMuavOJFCQqqiTybLI30fWd8wOdAMvoITBfSgs-WW4LpUWw7kn7kTb39_ornJgNPb4gCcdh-AW9HEiY2qAP7eSiwpp0dmY__-ef4fcS3RUrAbLbI2hYgphaOjNz",
    "expirationTime": null,
    "keys": {
        "p256dh": "BORNkcqyS0qf43f4Ph058C9pBB0tiLv9JTqjYWAVfLGs472aSlsPt0lNRMdioUU3HOUg4f2lHnog34FNV0Fi_1k",
        "auth": "jJwCvDwpVTThRQd5beYWzg"
    }
};

const payload = JSON.stringify({
    title: "Hello World",
    body: "This is your second push notification"
});

push
    .sendNotification(sub, payload)
    .catch(console.error);
```


