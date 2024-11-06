---
author: Daniel Gustaw
canonicalName: telegram-bot-in-typescript
coverImage: http://localhost:8484/2dcee1e9-a7f9-48db-a443-eb083a918a4d.avif
description: Aprende a crear un bot en Telegram, agregar escucha de comandos y configurar el envío de notificaciones.
excerpt: Aprende a crear un bot en Telegram, agregar escucha de comandos y configurar el envío de notificaciones.
publishDate: 2021-05-24 11:06:00+00:00
slug: es/bot-de-telegram-en-typescript
tags:
- telegram
- bot
- typescript
title: Bot de Telegram en Typescript
updateDate: 2021-05-24 11:06:00+00:00
---

Uno de los proyectos que lanzamos el mes pasado utilizó Telegram para enviar notificaciones. Esta entrada te mostrará cómo configurar el envío de notificaciones desde cero usando `typescript`.

## Preparando el entorno

Comenzaremos preparando los archivos de configuración:

```
tsc --init
npm init -y
```

Instalamos `telebot` - un paquete que proporciona el SDK de Telegram. Su documentación se puede encontrar aquí:

[mullwar/telebot](https://github.com/mullwar/telebot)

Junto con él, instalamos el conjunto necesario de bibliotecas para `typescript`:

```
npm i telebot @types/telebot @types/node typescript ts-node
```

En el archivo `tsconfig.json`, sobreescribimos las siguientes opciones:

```
"target": "ESNEXT",
"moduleResolution": "node",
"allowSyntheticDefaultImports": true,
```

## Obtención de un TOKEN de API

Para poder usar la API, necesitaremos un token. La forma más sencilla de obtenerlo es escribir al bot que crea bots en Telegram. Este es `BotFather`.

Toda la conversación consiste en proporcionar el comando para crear un bot, su `nombre`, `nombre de usuario`, y recibir el token.

![](http://localhost:8484/dd1fe3ce-4c46-4c4d-94d7-c8db9d7b877a.avif)

## Agregar un token al proyecto

Recomiendo agregar `TELEGRAM_TOKEN` con este valor al archivo `.env`, p. ej.

```
TELEGRAM_TOKEN=xxx
```

En `package.json` añadimos una línea

```
    "start": "ts-node index.ts",
```

dentro de `scripts`. Creamos un archivo `Makefile`

```
include .env
export

node_modules: package.json
	npm i

up: node_modules
	npm run start
```

gracias a ello importamos automáticamente `.env` y no necesitamos usar flags desde la línea de comandos o paquetes como `dotenv`. No olvides agregar `.env` a `.gitignore`.

## Código para obtener el ID de chat

Si queremos que nuestro bot responda, solo necesitamos escribir el código en el archivo `index.ts`:

```
import TeleBot from "telebot"

const bot = new TeleBot({
    token: process.env.TELEGRAM_TOKEN || '',
});

bot.on(["/configure_bot"], (msg) => {
    console.log(msg);
    bot.sendMessage(msg.chat.id, `CHAT_ID: ${msg.chat.id}`);
});

bot.start();
```

A continuación, agrega el bot al chat y escríbele. El resultado será el siguiente:

![](http://localhost:8484/db5aa8de-98ce-4cd0-8bec-4a8422a82351.avif)

El identificador de chat es una pieza clave de información si queremos enviarle notificaciones. El ID de chat y el Token son piezas clave de información que indican qué bot está escribiendo y dónde. En nuestro caso, el bot fue configurado para enviar diferentes datos a diferentes grupos, así que tuvimos que repetir este comando para varios grupos y anotarlos en el archivo `.env`. Agregamos la línea al archivo `.env`

```
GROUP_LOG_ID=-506870285
```

## Enviando señales

Enviaremos un número aleatorio al canal cada segundo si es mayor que 0.5. El siguiente código es suficiente para esto.

```
setInterval(() => {
    const rand = Math.random();
    if (rand > .5) {
        bot.sendMessage(parseInt(process.env.GROUP_LOG_ID || ''), `${rand}`)
    }
}, 1000)
```

![](http://localhost:8484/bd59f2a8-88cb-4006-8fb0-51a99a78c6da.avif)

Era un código muy simple y un bot muy simple. Con tales bots, puedes hacer cosas prácticas. Por ejemplo:

* Construir una interfaz de texto para la configuración remota del sistema. Tal CLI es más económico que conectar un frontend, formularios y botones.
* Construir sistemas de notificación de eventos. Esto es más fácil que enviar SMS o correos electrónicos, que requieren (o recomiendan) proveedores externos. En Telegram, evitamos el problema del pago por mensajes, y los grupos pueden alojar cientos de miles de miembros.
