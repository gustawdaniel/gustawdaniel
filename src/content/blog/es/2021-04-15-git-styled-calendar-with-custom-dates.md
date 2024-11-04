---
author: Daniel Gustaw
canonicalName: git-styled-calendar-with-custom-dates
coverImage: http://localhost:8484/9f33d20f-8d16-4a99-82b4-180bd4877124.avif
description: calendario estilo git creado a partir de una lista de fechas guardadas como archivo csv
excerpt: calendario estilo git creado a partir de una lista de fechas guardadas como archivo csv
publishDate: 2021-04-20 19:28:40+00:00
slug: es/calendario-estilo-git-con-fechas-personalizadas
tags:
- git
title: Calendario estilo Git con fechas personalizadas
updateDate: 2021-04-20 19:28:39+00:00
---

Supongamos que tienes un conjunto de fechas. Quieres mostrar estas fechas de una manera clara y legible.

Por ejemplo, así:

![](http://localhost:8484/121db3d7-7ea4-4dd3-a4bc-9f7195206354.avif)

Así que tengo una gran información. Es una línea de código, tal vez dos...

### En este artículo mostraré cómo generar una imagen como estas.

¿Qué necesitas?

* jq - gran herramienta para el procesamiento de json / texto
* node - intérprete de js
* awk - procesador de texto para seleccionar datos

### Instalación

```
npm i -g cli-gh-cal
```

### Preparar un archivo con fechas

Queremos preparar un archivo con fechas como estas.

```csv
2019-08-13
2018-05-19
2018-06-22
2019-04-16
```

Permítanos suponer que necesita mostrar las fechas de creación de archivos en su carpeta de fotos. Puede hacerlo utilizando el comando

```bash
ls -l --time-style=long-iso . | awk '{print $6}' | sort > /tmp/dates.csv
```

La opción `--time-style` permite mostrar las fechas en un formato fácil de procesar. A continuación, `awk` selecciona la columna con las fechas y las fechas ordenadas se guardan en un archivo temporal `/tmp/dates.csv`.

### Mostrando un calendario estilo git

Ahora, si deseas mostrar estas fechas, necesitas escribir

```bash
cli-gh-cal --data "$(jq -R '[inputs | [.,1] ]' < /tmp/dates.csv)"
```

En este caso, ponemos a trabajar `jq` - un potente generador de plantillas para archivos json. Permite reemplazar la lista de fechas por una cadena json requerida por `cli-gh-cal`. Después de ejecutar este comando, deberías ver una imagen similar a la presentada al principio.

### Paquetes requeridos

Para trabajar aquí, es necesario tener instalado `node`. Recomiendo instalarlo con `nvm` en la máquina local.

> [https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04)

El siguiente paquete - `cli-gh-cal` se puede instalar mediante `npm` - el gestor de paquetes de node.

> [https://github.com/IonicaBizau/cli-gh-cal](https://github.com/IonicaBizau/cli-gh-cal)

Finalmente, también necesitas `jq`.

> [https://stedolan.github.io/jq/download/](https://stedolan.github.io/jq/download/)

Espero que te guste este artículo. Para mí, es un gran ejemplo de cuán poca cantidad de código se necesita para lograr resultados de gran apariencia en la visualización de datos hoy en día. ¡Guau!

Captura de pantalla de mi consola

![](http://localhost:8484/24696782-aeaa-4c8d-985c-9fc092980381.avif)
