---
author: Daniel Gustaw
canonicalName: zeromq-pull-push-pattern-for-node-js
coverImage: http://localhost:8484/70bb6ab5-16d9-4e33-a150-7dfe3fdbb9e4.avif
description: El artículo enfatiza la flexibilidad de ZeroMQ para la mensajería en Node.js, destacando el patrón pull-push ideal para sistemas distribuidos de alto volumen.
excerpt: El artículo enfatiza la flexibilidad de ZeroMQ para la mensajería en Node.js, destacando el patrón pull-push ideal para sistemas distribuidos de alto volumen.
publishDate: 2023-02-19 09:42:31+00:00
slug: es/patron-zeromq-pull-push-para-node-js
tags:
- queue
- nodejs
title: Patrón pull-push de ZeroMQ para Node JS
updateDate: 2023-02-19 09:43:53+00:00
---

ZeroMQ es una biblioteca de mensajería que permite una comunicación rápida y eficiente entre sistemas distribuidos. Con ZeroMQ, los desarrolladores pueden construir fácilmente sistemas de mensajería complejos que pueden manejar altos volúmenes de datos y son resilientes a fallos de red. En Node.js, la biblioteca ZeroMQ se puede utilizar para crear puntos finales de mensajería y enviar y recibir mensajes entre ellos.

En este artículo, exploraremos cómo usar la biblioteca ZeroMQ en Node.js examinando un fragmento de código que demuestra cómo enviar y recibir mensajes utilizando los sockets `Push` y `Pull` de ZeroMQ. El código muestra cómo crear una función `push` que envía un mensaje a un socket `Pull`, y una función `pull` que recibe mensajes de un socket `Push`. Examinaremos los diversos componentes del código y explicaremos cómo trabajan juntos para crear un sistema de mensajería confiable. También exploraremos algunas mejores prácticas para usar ZeroMQ en Node.js y discutiremos algunos casos de uso comunes para la biblioteca.

[ZeroMQ](https://zeromq.org/)

Los patrones centrales de ZeroMQ incorporados son:

* [****Solicitud-respuesta****](https://zeromq.org/socket-api/#request-reply-pattern), que conecta un conjunto de clientes a un conjunto de servicios. Este es un patrón de llamada a procedimiento remoto y distribución de tareas.
* [****Publicar-suscribirse****](https://zeromq.org/socket-api/#publish-subscribe-pattern), que conecta un conjunto de publicadores a un conjunto de suscriptores. Este es un patrón de distribución de datos.
* [****Pipeline****](https://zeromq.org/socket-api/#pipeline-pattern), que conecta nodos en un patrón de distribución que puede tener múltiples pasos y ciclos. Este es un patrón de distribución y recolección de tareas en paralelo.
* [****Par exclusivo****](https://zeromq.org/socket-api/#exclusive-pair-pattern), que conecta dos sockets de manera exclusiva. Este es un patrón para conectar dos hilos en un proceso, no debe confundirse con pares de sockets "normales".

Estamos interesados estrictamente en `pipeline`. Nuestro objetivo es escribir código desde el cual pueda importar y exportar funciones `pull` y `push` para usarlas fácilmente más tarde sin preocuparnos de si el socket está abierto o de mantener el socket en el contexto o el estado global.

```typescript
import {Push, Pull, MessageLike} from "zeromq";

// Import the required ZeroMQ sockets and types

const sleep = (time: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, time))

// Define a sleep function that returns a Promise that resolves after a given time interval

const pushSocket = new Push();
const pullSocket = new Pull();

// Create a new ZeroMQ Push socket and a new Pull socket

export async function push<T extends MessageLike | MessageLike[]>(job: T): Promise<void> {

    // Define a push function that takes a generic message and sends it to the Pull socket
    // The function returns a Promise that resolves when the message is sent

    if(!pushSocket.writable){
        await pushSocket.bind("tcp://*:7777");
    }

    // If the socket is not yet writable, bind it to the address "tcp://*:7777"

    await pushSocket.send(job);

    // Send the message to the connected Pull socket
}

export async function pull<T>(): Promise<void> {

    // Define a pull function that receives messages from the Push socket
    // The function returns a Promise that resolves when a message is received

    pullSocket.connect("tcp://localhost:7777");

    // Connect the Pull socket to the address "tcp://localhost:7777"

    for await (const [msg] of pullSocket) {
        await sleep(2000);
        console.log(`Received Job ${msg.toString()}`);
    }

    // Use a for-await-of loop to iterate over incoming messages from the Pull socket
    // The sleep function is called to simulate a delay in processing the message
    // The message is then logged to the console
}
```

Suponiendo que llamé a este archivo `zero.ts`, puedo usarlo en el script a continuación.

```typescript
import {pull, push} from "./zero";

pull().catch(console.error)

async function main() {
    for(let i = 1; i <= 10; i++) {
        console.log("push", i);
        await push(`ok ${i}`)
    }
}

main().catch(console.error)
```

Veré casi instantáneamente `push 1..10` y luego cada `2` segundos nuevas líneas con `Received Job`.

![](http://localhost:8484/a0d0f0c3-36aa-4836-acfc-d8986441cc0b.avif)

Por supuesto, puedes usar muchas instancias de scripts que son trabajadores y realizan estos trabajos en procesos independientes. En este caso, quería optimizar las solicitudes http salientes, así que decidí procesarlas en un solo `pull` e inyectar estas solicitudes desde diferentes lugares del código mediante `push`. Así que puedes ver que hay una gran variedad de aplicaciones, especialmente teniendo en cuenta que presenté solo un patrón de los 4 disponibles en ZeroMQ.
