---
author: Daniel Gustaw
canonicalName: zeromq-pull-push-pattern-for-node-js
coverImage: http://localhost:8484/70bb6ab5-16d9-4e33-a150-7dfe3fdbb9e4.avif
description: Artykuł podkreśla elastyczność ZeroMQ w zakresie przesyłania wiadomości w Node.js, zwracając uwagę na wzór pull-push, idealny dla rozproszonych systemów o dużej wydajności.
excerpt: Artykuł podkreśla elastyczność ZeroMQ w zakresie przesyłania wiadomości w Node.js, zwracając uwagę na wzór pull-push, idealny dla rozproszonych systemów o dużej wydajności.
publishDate: 2023-02-19 09:42:31+00:00
slug: pl/zeromq-pull-push-wzor-dla-node-js
tags:
- queue
- nodejs
title: Wzorzec pull-push ZeroMQ dla Node JS
updateDate: 2023-02-19 09:43:53+00:00
---

ZeroMQ to biblioteka do przesyłania wiadomości, która umożliwia szybkie i efektywne komunikowanie się między rozproszonymi systemami. Dzięki ZeroMQ programiści mogą łatwo budować złożone systemy komunikacji, które mogą obsługiwać wysokie wolumeny danych i są odporne na awarie sieci. W Node.js biblioteka ZeroMQ może być używana do tworzenia punktów końcowych komunikacji oraz wysyłania i odbierania wiadomości między nimi.

W tym artykule zbadamy, jak używać biblioteki ZeroMQ w Node.js, przyglądając się fragmentowi kodu, który demonstruje, jak wysyłać i odbierać wiadomości za pomocą gniazd `Push` i `Pull`. Kod pokazuje, jak utworzyć funkcję `push`, która wysyła wiadomość do gniazda `Pull`, oraz funkcję `pull`, która odbiera wiadomości z gniazda `Push`. Zbadamy różne składniki kodu i wyjaśnimy, jak współpracują ze sobą, aby stworzyć niezawodny system komunikacji. Zbadamy również najlepsze praktyki dotyczące korzystania z ZeroMQ w Node.js oraz omówimy niektóre powszechne przypadki użycia tej biblioteki.

[ZeroMQ](https://zeromq.org/)

Wbudowane podstawowe wzorce ZeroMQ to:

* [****Request-reply****](https://zeromq.org/socket-api/#request-reply-pattern), który łączy zestaw klientów z zestawem usług. Jest to wzorzec zdalnego wywołania procedury i dystrybucji zadań.
* [****Pub-sub****](https://zeromq.org/socket-api/#publish-subscribe-pattern), który łączy zestaw wydawców z zestawem subskrybentów. Jest to wzorzec dystrybucji danych.
* [****Pipeline****](https://zeromq.org/socket-api/#pipeline-pattern), który łączy węzły w wzorcu fan-out/fan-in, który może mieć wiele kroków i pętli. Jest to wzorzec równoległej dystrybucji zadań i zbierania.
* [****Exclusive pair****](https://zeromq.org/socket-api/#exclusive-pair-pattern), który łączy dwa gniazda wyłącznie. Jest to wzorzec do łączenia dwóch wątków w procesie, nie mylić z "normalnymi" parami gniazd.

Interesuje nas ściśle `pipeline`. Naszym celem jest napisanie kodu, z którego mogę importować i eksportować funkcje `pull` i `push`, aby łatwo je wykorzystywać później, nie martwiąc się, czy gniazdo jest otwarte lub czy utrzymuję gniazdo w stanie kontekstu lub globalnym.

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

Zakładając, że nazwałem ten plik `zero.ts`, mogę go użyć w poniższym skrypcie.

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

Zobaczę prawie natychmiast `push 1..10`, a następnie co `2` sekundy nowe linie z `Received Job`.

![](http://localhost:8484/a0d0f0c3-36aa-4836-acfc-d8986441cc0b.avif)

Oczywiście można używać wielu instancji skryptów, które są pracownikami i wykonują te zadania w niezależnych procesach. W tym przypadku chciałem uprościć wychodzące żądania http, więc postanowiłem przetwarzać je w pojedynczym `pull` i wstrzykiwać te żądania z różnych miejsc kodu za pomocą `push`. Można więc zauważyć, że istnieje ogromna różnorodność zastosowań, zwłaszcza biorąc pod uwagę, że zaprezentowałem tylko jeden wzorzec z 4 dostępnych w ZeroMQ.
