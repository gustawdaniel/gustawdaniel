---
author: Daniel Gustaw
canonicalName: calculating-the-difference-between-json-files
coverImage: http://localhost:8484/7f52c42e-103b-4ef9-b689-d08807ad2f7f.avif
description: Aprende a encontrar traducciones faltantes en archivos JSON con diccionarios.
excerpt: Aprende a encontrar traducciones faltantes en archivos JSON con diccionarios.
publishDate: 2021-02-26
slug: es/calculando-la-diferencia-entre-archivos-json
tags:
- diff
- i18next
title: Calculando la diferencia entre archivos JSON
updateDate: 2023-10-12
---

En este artículo, demostramos cómo crear una función que identifica las diferencias entre dos archivos JSON.

Desde un punto de vista educativo, esto sirve como un excelente ejemplo de uso de funciones recursivas. Desde una perspectiva práctica, es una herramienta valiosa para gestionar traducciones.

Para comenzar, crearemos un comando que lea los archivos y muestre todas las claves presentes en el primer archivo pero faltantes en el segundo archivo en la salida estándar.

Comenzaremos verificando si los archivos indicados como argumentos existen:

```js
const fs = require('fs')

const pathBase = `${process.cwd()}/${process.argv[2]}`;
const pathComp = `${process.cwd()}/${process.argv[3]}`;

if (!fs.existsSync(pathBase)) {
  console.error(`File ${pathBase} not existst`);
  process.exit()
}

if (!fs.existsSync(pathComp)) {
  console.error(`File ${pathComp} not existst`);
  process.exit()
}
```

A continuación, leeremos el contenido de estos archivos y convertiremos JSON a objetos:

```javascript
const base = JSON.parse(fs.readFileSync(pathBase).toString());
const comp = JSON.parse(fs.readFileSync(pathComp).toString());
```

Ahora, definiremos una función para encontrar diferencias:

```javascript
function getDiff(a, b) {
  const res = {};

  for (let key in a) {
    if (a.hasOwnProperty(key)) {
      if (!b.hasOwnProperty(key)) {
        res[key] = a[key]
      } else {
        if (typeof a[key] === 'object') {
          res[key] = getDiff(a[key], b[key])
        }
      }
      if (res[key] && !Object.keys(res[key]).length) {
        delete res[key];
      }
    }
  }

  return res;
}
```

Esta función toma un par de objetos e itera a través de las claves del primer objeto (base). Si el segundo objeto (comparación) no tiene la clave, se agrega al resultado. Si la clave está presente, verifica si el tipo es un objeto y, si es así, llama recursivamente a la función getDiff.

Finalmente, eliminamos las claves con objetos vacíos antes de mostrar los resultados:

```javascript
process.stdout.write(JSON.stringify(getDiff(base, comp)))
```

Este programa no soporta arreglos. Para los archivos de traducción, no son necesarios. Si deseas leer sobre métodos más avanzados para comparar archivos JSON, un buen punto de partida es un hilo en Stack Overflow:

[Usando jq o herramientas de línea de comandos alternativas para comparar archivos JSON](https://stackoverflow.com/questions/31930041/using-jq-or-alternative-command-line-tools-to-compare-json-files)

Ahora, veamos cómo funciona el programa en la práctica con archivos de traducción. El primer archivo, en_old.json, fue preparado manualmente y cubre todas las traducciones en la aplicación, mientras que el segundo archivo, en.json, fue generado por i18next. El problema es que i18next no detectó todas las traducciones.

Al principio, ordené ambos archivos manualmente utilizando el servicio: codeshack.io/json-sorter

![](http://localhost:8484/5459cca6-ed9e-4f75-8933-90306a6307fc.avif)

https://codeshack.io/json-sorter/

A continuación, utilicé `diffchecker` para encontrar las diferencias entre ellos:

![](http://localhost:8484/6028a6b5-ca6a-4baa-b16d-fb66a7199df3.avif)

https://www.diffchecker.com/yffDMWff

Luego, creé un archivo con las traducciones faltantes:

```bash
node ../DevTools/json-diff.js src/locales/en_old.json src/locales/en.json > src/locales/en-codes.json
```

El archivo, mostrado y formateado por jq, se ve así:

![](http://localhost:8484/dd621642-427b-4560-9f26-b08150f04e97.avif)

Podemos ver que incluye todas las claves faltantes.

Al importar archivos de traducción, podemos utilizar el paquete deepmerge. El archivo de configuración de i18n podría verse así:

```javascript
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import deepmerge from 'deepmerge'

import en from 'vuetify/lib/locale/en'
import pl from 'vuetify/lib/locale/pl'

Vue.use(VueI18n);

const messages = {
  en: deepmerge(
    require('@/locales/en-codes.json'),
    require('@/locales/en.json'),
    {$vuetify: en}
  ),
  pl: deepmerge(
    require('@/locales/pl-codes.json'),
    require('@/locales/pl.json'),
    {$vuetify: pl}
  ),
};

export default new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages,
})

export const languages = [
  {text: 'lang.pl', value: 'pl'},
  {text: 'lang.en', value: 'en'},
];
```

Si tienes experiencias relacionadas con la automatización del trabajo de traducción o recomendaciones de herramientas y scripts, no dudes en compartirlas en los comentarios. Estoy interesado en conocer las herramientas y enfoques que utilizas.
