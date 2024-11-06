---
author: Daniel Gustaw
canonicalName: telegram-bot-in-typescript
coverImage: http://localhost:8484/2dcee1e9-a7f9-48db-a443-eb083a918a4d.avif
description: Learn how to create a bot on Telegram, add command listening to it, and configure notification sending.
excerpt: Learn how to create a bot on Telegram, add command listening to it, and configure notification sending.
publishDate: 2021-05-24 11:06:00+00:00
slug: en/telegram-bot-in-typescript
tags:
- telegram
- bot
- typescript
title: Telegram Bot in Typescript
updateDate: 2021-05-24 11:06:00+00:00
---

One of the projects we released last month used Telegram to send notifications. This entry will show you how to configure notification sending from scratch using `typescript`.

## Preparing the environment

We will start by preparing the configuration files:

```
tsc --init
npm init -y
```

We install `telebot` - a package that provides the Telegram SDK. Its documentation can be found here:

[mullwar/telebot](https://github.com/mullwar/telebot)

Along with it, we install the necessary set of libraries for `typescript`:

```
npm i telebot @types/telebot @types/node typescript ts-node
```

In the `tsconfig.json` file, we overwrite the following options:

```
"target": "ESNEXT",
"moduleResolution": "node",
"allowSyntheticDefaultImports": true,
```

## Obtaining an API TOKEN

To be able to use the API, we will need a token. The simplest way to obtain it is to write to the bot that creates bots on Telegram. This is `BotFather`.

The whole conversation consists of providing the command to create a bot, its `name`, `username`, and receiving the token.

![](http://localhost:8484/dd1fe3ce-4c46-4c4d-94d7-c8db9d7b877a.avif)

## Adding a token to the project

I recommend adding `TELEGRAM_TOKEN` with this value to the `.env` file, e.g.

```
TELEGRAM_TOKEN=xxx
```

In `package.json` we add a line

```
    "start": "ts-node index.ts",
```

inside `scripts`. We create a `Makefile` file

```
include .env
export

node_modules: package.json
	npm i

up: node_modules
	npm run start
```

thanks to it we automatically import `.env` and we do not need to use flags from the command line or packages like `dotenv`. Don't forget to add `.env` to `.gitignore`.

## Code to get chat ID

If we want our bot to respond, we just need to write the code in the `index.ts` file:

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

Next, add the bot to the chat and write to it. The result will be as follows:

![](http://localhost:8484/db5aa8de-98ce-4cd0-8bec-4a8422a82351.avif)

The chat identifier is a key piece of information if we want to send notifications to it. The chat ID and Token are key pieces of information indicating which bot is writing and where. In our case, the bot was set up to send different data to different groups, so we had to repeat this command for several groups and note them down in the `.env` file. We add the line to `.env`

```
GROUP_LOG_ID=-506870285
```

## Sending signals

We will send a random number to the channel every second if it is greater than 0.5. The following code is sufficient for this.

```
setInterval(() => {
    const rand = Math.random();
    if (rand > .5) {
        bot.sendMessage(parseInt(process.env.GROUP_LOG_ID || ''), `${rand}`)
    }
}, 1000)
```

![](http://localhost:8484/bd59f2a8-88cb-4006-8fb0-51a99a78c6da.avif)

It was a very simple code and a very simple bot. With such bots, you can do practical things. For example:

* Build a text interface for remote system configuration. Such a CLI is cheaper than connecting a frontend, forms, and buttons.
* Build event notification systems. This is easier than sending SMS or Emails, which require (or recommend) external providers. In Telegram, we bypassed the problem of payment for messages, and groups can accommodate hundreds of thousands of members.
