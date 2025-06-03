---
author: Daniel Gustaw
canonicalName: web-push-notifications
coverImage: https://ucarecdn.com/e31317ea-2c64-41fd-8e2e-44224eab989a/-/preview/640x640/
description: Powiadomienia push w sieci napisane w czystym JavaScript bez użycia jakichkolwiek bibliotek.
excerpt: Powiadomienia push w sieci napisane w czystym JavaScript bez użycia jakichkolwiek bibliotek.
publishDate: 2025-01-07 00:00:00+00:00
slug: pl/web-push-powiadomienia
tags:
- web
- push
- notifications
title: Powiadomienia Push w sieciowej przeglądarce
updateDate: 2025-01-07 00:00:00+00:00
---

## Utwórz projekt Vite

```bash
pnpm create vite .
```

### Zainstaluj pakiet `web-push`.

```bash
pnpm add web-push
```

### Generowanie kluczy VAPID

```bash
pnpm web-push generate-vapid-keys --json > keys.json
```

Można to również zrobić programowo poprzez:

```
import fs from 'fs'
import push from 'web-push'

const keys = push.generateVAPIDKeys();

fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2));
```

### Uzyskaj zgodę na powiadomienia

W większości instrukcji w tym miejscu zobaczysz `Notification.requestPermission()`.

Jednak można to uprościć. Możemy użyć metody `pushManager.subscribe()`, opisanej w:

- https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration
- https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/pushManager

Aby uzyskać dostęp do `pushManager`, musimy zarejestrować pracownika serwisowego.

### Utwórz pracownika serwisowego

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

Teraz możesz zarejestrować service worker w swoim głównym skrypcie.

```typescript
// src/main.ts
document.addEventListener('DOMContentLoaded', async () => {
    await navigator.serviceWorker.register('sw.js');
})
```

### Subskrybuj powiadomienia push

Nie możemy subskrybować powiadomień po załadowaniu strony, ponieważ użytkownik musi to zrobić ręcznie.

Stwórzmy przycisk w `main.ts`

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

i obsłuż kliknięcie w `subscription.ts`

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

`push` obiekt wyświetlony w konsoli musi zostać skopiowany do backendu w następnym kroku. Zróbmy to na razie ręcznie.

## Wysyłanie powiadomień

Teraz zamierzamy napisać backend w Node.js.

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


