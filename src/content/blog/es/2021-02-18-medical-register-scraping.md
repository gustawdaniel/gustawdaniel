---
author: Daniel Gustaw
canonicalName: medical-register-scraping
coverImage: http://localhost:8484/e6f09d94-68fb-472e-9972-9ffe2c6a025f.avif
description: A los administradores de datos no les gusta. Vea cómo, ingresando dos comandos en la consola, descargó el registro de todas las farmacias en Polonia.
excerpt: A los administradores de datos no les gusta. Vea cómo, ingresando dos comandos en la consola, descargó el registro de todas las farmacias en Polonia.
publishDate: 2021-02-17 23:25:12+00:00
slug: es/raspado-de-registros-medicos
tags:
- medical
title: Raspado del Registro de Farmacias
updateDate: 2021-02-17 23:27:35+00:00
---

Hay sitios web que están mejor o peor protegidos contra el scraping. Ahora echaremos un vistazo a un sitio web que no está protegido en absoluto: el Registro Médico que contiene datos sobre farmacias.

Del artículo, aprenderás cómo analizar sitios web y en qué debes prestar atención al hacer scraping de datos. Resulta que en algunos casos, realmente se necesitan cantidades mínimas de código para descargar datos en un formato conveniente para su posterior procesamiento.

El artículo se basa en un análisis de scraping en un caso específico. Aquí está el sitio web:

> [https://rejestrymedyczne.ezdrowie.gov.pl/main](https://rejestrymedyczne.ezdrowie.gov.pl/main)

Contiene varios registros de datos relacionados con la medicina.

![](http://localhost:8484/c17df1c5-6321-4840-bdbe-f47b6296c374.avif)

Supongamos que queremos descargar todos los datos sobre farmacias de esta página. Hacemos clic en el registro de farmacias y vemos:

![](http://localhost:8484/faf5fc8b-7bd7-40e5-9b3e-0d6b1669bd37.avif)

Curiosamente, la paginación no cambia la URL aquí, solo recarga la página y muestra la siguiente vista en la tabla.

Después de cambiar a la pestaña "Red" en la consola del navegador, podemos ver que se está enviando una solicitud en segundo plano.

![](http://localhost:8484/cb21eefb-14a1-4d54-a5ba-8df7f8e7a16c.avif)

Resulta que sin ningún token, clave o cookie, puedes descargar datos que se cargan en la tabla directamente desde la API utilizando un comando.

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=1\&size\=2\&sortField\=originId\&sortDirection\=ASC
```

![](http://localhost:8484/ace8898e-9b72-44d5-a5bf-f2e543ea67a0.avif)

No hay problema en descargar **dos** farmacias:

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=1\&size\=2\&sortField\=originId\&sortDirection\=ASC | jq '.[][] | {nr: .registrationNumber, name: .owners[0].name}'
```

![](http://localhost:8484/1eac6eca-3409-4c59-b678-367f6607d33f.avif)

No hay problema en descargar **diez mil** farmacias.

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=1\&size\=10000\&sortField\=originId\&sortDirection\=ASC | jq '.[][].owners[0].name' | wc
```

![](http://localhost:8484/51765dc2-2e85-47a2-916e-7f505842c0dc.avif)

Para descargar 15 mil farmacias, el comando es

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=1\&size\=15000\&sortField\=originId\&sortDirection\=ASC | jq '.[][]' > ra.json
```

Para insertar datos en la base de datos

```bash
mongoimport --db test --collection ra --drop --file ./ra.json
```

Resulta que, desafortunadamente, solo tenemos `8006` documentos, no los `15000` esperados.

```bash
2021-02-17T22:59:19.216+0100	connected to: mongodb://localhost/
2021-02-17T22:59:19.217+0100	dropping: test.ra
2021-02-17T22:59:20.234+0100	8006 document(s) imported successfully. 0 document(s) failed to import.
```

Para `10,000` tenemos el resultado correcto para ambas descargas

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=1\&size\=10000\&sortField\=originId\&sortDirection\=ASC | jq '.[][]' > ra.json
```

cómo y importar

```bash
mongoimport --db test --collection ra --drop --file ./ra.json

2021-02-17T23:02:11.893+0100	connected to: mongodb://localhost/
2021-02-17T23:02:11.894+0100	dropping: test.ra
2021-02-17T23:02:13.143+0100	10000 document(s) imported successfully. 0 document(s) failed to import.
```

Es importante que al descargar la segunda página añadamos al archivo `>>` y no sobrescribamos su contenido `>`.

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=2\&size\=10000\&sortField\=originId\&sortDirection\=ASC | jq '.[][]' >> ra.json
```

Esta vez el registro muestra `13006` archivos y todo está explicado.

```bash
mongoimport --db test --collection ra --drop --file ./ra.json

2021-02-17T23:03:43.592+0100	connected to: mongodb://localhost/
2021-02-17T23:03:43.592+0100	dropping: test.ra
2021-02-17T23:03:45.173+0100	13006 document(s) imported successfully. 0 document(s) failed to import.
```

El resultado `8006` en `size=15000` se debió al hecho de que las páginas están numeradas a partir de `0` en esta `api` y `8006` = `23006 - 15000`, que fue el resultado correcto.

De todos modos, no importa si obtenemos en lotes de 10 o 15 mil, tenemos una solicitud restante con `page=0`, por ejemplo:

```bash
http -b https://rejestrymedyczne.ezdrowie.gov.pl/api/pharmacies/search\?page\=0\&size\=10000\&sortField\=originId\&sortDirection\=ASC | jq '.[][]' >> ra.json
```

La última importación nos permite subir todas las farmacias.

```
mongoimport --db test --collection ra --drop --file ./ra.json

2021-02-17T23:08:02.038+0100	connected to: mongodb://localhost/
2021-02-17T23:08:02.038+0100	dropping: test.ra
2021-02-17T23:08:04.808+0100	23006 document(s) imported successfully. 0 document(s) failed to import.
```

En `compass` podemos diseñar una agregación con dos etapas:

1. Tomar una instantánea de la tabla `owners`

```
{
    '$unwind': {
      'path': '$owners'
    }
}
```

2. Proyección de los campos más interesantes

```
{
    '$project': {
      'name': '$owners.name',
      'firstName': '$owners.firstName',
      'lastName': '$owners.lastName',
      'krs': '$owners.krs',
      'nip': '$owners.nip',
      'regon': '$owners.regon',
      'address': {
        '$concat': [
          '$address.street', ' ', '$address.homeNumber', ', ', '$address.postcode', ' ', '$address.city'
        ]
      }
    }
}
```

Nos permitirá generar el código del programa.

```js
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

/*
 * Requires the MongoDB Node.js Driver
 * https://mongodb.github.io/node-mongodb-native
 */

const agg = [
  {
    '$unwind': {
      'path': '$owners'
    }
  }, {
    '$project': {
      'name': '$owners.name',
      'firstName': '$owners.firstName',
      'lastName': '$owners.lastName',
      'krs': '$owners.krs',
      'nip': '$owners.nip',
      'regon': '$owners.regon',
      'address': {
        '$concat': [
          '$address.street', ' ', '$address.homeNumber', ', ', '$address.postcode', ' ', '$address.city'
        ]
      }
    }
  }
];

MongoClient.connect(
  'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false',
  { useNewUrlParser: true, useUnifiedTopology: true },
  function(connectErr, client) {
    assert.equal(null, connectErr);
    const coll = client.db('test').collection('ra');
    coll.aggregate(agg, (cmdErr, result) => {
      assert.equal(null, cmdErr);
    });
    client.close();
  });
```

Para habilitarlo, necesitamos instalar los controladores para `mongo` y `assert`.

```
 npm init -y && npm i mongodb@3.6.3 assert
```

La versión `@3.6.3` es el resultado de la aparición del error `MongoError` faltante en la versión `3.6.4`.

[Advertencia: Acceder a la propiedad no existente ‘MongoError’ de las exportaciones del módulo dentro de una dependencia circular](https://developer.mongodb.com/community/forums/t/warning-accessing-non-existent-property-mongoerror-of-module-exports-inside-circular-dependency/15411)

El código presentado no hace nada además de realizar la agregación. Si quisiéramos guardar el resultado de la agregación en un archivo, necesitamos modificarlo ligeramente añadiendo la importación necesaria al principio.

```
const fs = require('fs')
```

y cambiando el callback a uno que realmente guarda el resultado.

```
MongoClient.connect(
    'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false',
    { useNewUrlParser: true, useUnifiedTopology: true },
    function(connectErr, client) {
      assert.strictEqual(null, connectErr);
      const coll = client.db('test').collection('ra');
      coll.aggregate(agg, async (cmdErr, result) => {
        assert.strictEqual(null, cmdErr);
          const out = await result.toArray();
          fs.writeFileSync('ra-project.json', JSON.stringify(out));
          return client.close();
      });
    });
```

Resulta que los datos más interesantes son aproximadamente el 10% de lo que descargamos.

```
du -h ra*json
50M	ra.json
4.8M	ra-project.json
```

Esta entrada muestra lo fácil que es realizar scraping utilizando APIs proporcionadas por los creadores de sitios web.

Desafortunadamente, no todos los registros de este servicio son tan fáciles de recuperar. Uno de los más desafiantes es el registro de diagnosticadores médicos. Sin embargo, la dificultad aquí radica en que incluso una persona no puede acceder a algunos de los datos presentados en este registro debido a errores en el código del sitio web.

## Resumen

Demostramos cómo detectar solicitudes al `api` utilizando la consola del navegador y cómo utilizarlas para scraping de datos. Luego colocamos los datos en `mongodb` y, a través de la agregación, generamos un conjunto de datos que es 10 veces más ligero, conteniendo solo la información más interesante.

En este proyecto, hay tan poco código que no se creó ningún repositorio para él. Los datos se pueden descargar desde los enlaces.

Todos los datos:

> [https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/ra.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/ra.json)

Solo KRS, NIP, REGON, DIRECCIÓN, NOMBRE, APELLIDO, NOMBRE

> [https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/ra-project.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/ra-project.json)

Si quieres desafiarme y sugerir un sitio web que valga la pena raspar, no dudes en programar una consulta sin compromiso.
