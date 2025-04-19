---
author: Daniel Gustaw
canonicalName: web-push-notifications
coverImage: https://ucarecdn.com/e31317ea-2c64-41fd-8e2e-44224eab989a/-/preview/640x640/
description: Web push notification written in raw JavaScript without any libraries.
excerpt: Web push notification written in raw JavaScript without any libraries.
publishDate: 2025-01-07 00:00:00+00:00
slug: en/web-push-notifications
tags:
- web
- push
- notifications
title: Web Push Notifications
updateDate: 2025-01-07 00:00:00+00:00
---

## Create Vite Project

```bash
pnpm create vite .
```

### Install `web-push` package.

```bash
pnpm add web-push
```

### Generate VAPID keys

```bash
pnpm web-push generate-vapid-keys --json > keys.json
```

It can be done also programmatically by:

```
import fs from 'fs'
import push from 'web-push'

const keys = push.generateVAPIDKeys();

fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2));
```

### Get agreement on notifications

In most of the instructions you will see `Notification.requestPermission()` in this place.

But it can be simplified. We can use `pushManager.subscribe()` method described in:

- https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration
- https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/pushManager

To have access to `pushManager` we have to register service worker.

### Create service worker

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

Now you can register service worker in your main script.

```typescript
// src/main.ts
document.addEventListener('DOMContentLoaded', async () => {
    await navigator.serviceWorker.register('sw.js');
})
```

### Subscribe to push notifications

We can't subscribe on notifications after page load because user have to trigger it manually.

Lets create button in `main.ts`

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

and handle click in `subscription.ts`

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

`push` object printed in console have to be copied to back-end in next step. Lets do it manually for now.

## Send notifications

Now we are going to write back-end in Node.js.
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