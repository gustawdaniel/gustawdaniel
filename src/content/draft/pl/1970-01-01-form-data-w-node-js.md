---
title: Form Data w Node JS
slug: form-data-w-node-js
publishDate: 1970-01-01T00:00:00.000Z
date_updated: 2021-03-18T12:32:13.000Z
draft: true
---

Wysyłanie żądań HTTP jest podstawową umiejętnością programisty webowego. W tym wpisie pokażemy jak za pomocą przeglądarki oraz node js wysyłać żądania typu `application/x-www-form-urlencoded` znane też jako `form data` za pomocą biblioteki axios.

Zaczniemy od utworzenia projektu w którym powstaną pliki

* app.ts - wysyłka requesta z node js
* index.ts - wysyłka requesta z przeglądarki
* index.html
* catcher.ts - mikroserwis do przyjmowania i logowania danych o żądaniach http.

Zaczniemy od backendu.

## Wysyłanie form data z node js

Inicjalizujemy projekt wykonując komendy:

```
node -v > .nvmrc
npm init --yes
npm i -g typescript
npx tsc --init
npm i axios node-fetch chalk @types/node-fetch
touch app.ts
```

W `tsconfig.json` wymieniamy `target` na `ESNEXT`.

[axios post request to send form data

axios POST request is hitting the url on the controller but setting null values to my POJO class, when I go through developer tools in chrome, the payload contains data. What am I doing wrong? Axios

![](https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon.png?v&#x3D;c78bd457575a)Stack OverflowSrikanth Gowda

![](https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon@2.png?v&#x3D;73d79a89bded)](https://stackoverflow.com/questions/47630163/axios-post-request-to-send-form-data)
