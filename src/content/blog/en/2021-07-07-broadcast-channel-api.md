---
author: Daniel Gustaw
canonicalName: broadcast-channel-api
coverImage: http://localhost:8484/8b3fb584-7d88-42e4-b053-b66de5ddfd09.avif
description: This post shows how to use the Broadcast Channel API to send data between browser tabs or windows without using a server and sockets.
excerpt: This post shows how to use the Broadcast Channel API to send data between browser tabs or windows without using a server and sockets.
publishDate: 2021-07-07 11:08:19+00:00
slug: en/broadcast-channel-api
tags:
- web-api
- broadcast
- channel
title: Broadcast Channel API
updateDate: 2021-07-23 09:22:25+00:00
---

We will learn how to use the `Broadcast Channel API` to send data between tabs or browser windows without using a server and sockets.

## Parcel Bundler - intuitive and simple builder

As always, we present the code from start to finish. We will begin by installing Parcel - the simplest bundler in the JS world that works out of the box, unlike Webpack, whose configuration is simply tedious. We install Parcel with the command:

```
npm install -g parcel-bundler
```

We create `html` and `ts` files with the commands:

```
echo '<html><body><script src="./index.ts"></script></body></html>' > index.html
touch index.ts
```

And we turn on our server

```
parcel index.html
```

## Basics of the Broadcast Channel API

We will now show how to see the simplest operation of the Broadcast Channel API in the browser console. In the `index.ts` file, we initialize the channel.

```
const bc = new BroadcastChannel('channel');
```

Next, we will assign a random ID to our card in the browser.

```
const id = Math.random();
```

And we will store in memory the counters of sent and received messages.

```
let send = 0, received = 0;
```

As a welcome message, we will display the ID selected for our card.

```
console.log("START", id);
```

Next, we set up listening for messages.

```
bc.onmessage = (e) => {
    console.log(e.data, send, received);
    received++;
}
```

We increase the message count received in it and display the received data and the counter values on the given card.

Now it's time to send messages to the channel. The `postMessage` functions are used for this.

A moment after the card is activated, we want to send a welcome message to other cards.

```
setTimeout(() => {
    bc.postMessage({title: `Connection from ${id}`})
}, 250)
```

Timeout allows waiting for other tabs to reload. Without it, on the tabs that are not ready when this message is sent, we wouldn't see the console log.

Next, we want to send two more messages that will update our send counters.

```
const i = setInterval(() => {
    const uptime = performance.now();
    bc.postMessage({id, uptime, send, received})
    send++;
    if (uptime > 1e3) clearInterval(i)
}, 500)
```

By the way, we used a different API here - performance:

[Performance - Web APIs | MDN](https://developer.mozilla.org/mdn-social-share.0ca9dbda.png)](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

For the two tabs, we can see that each tab has its own unique identifier and messages sent from the opposite tab.

![](http://localhost:8484/460465c8-3065-49e4-9856-b06dbd448dcd.avif)

Nothing prevents us from enabling four cards at once. Then the messages from the three remaining ones will interweave with each other.

![](http://localhost:8484/7d5446fd-3412-4adb-aaa2-ee9f4493f039.avif)

We can return to two tabs and refresh the one on the right several times. As a result of this action, the one on the left will receive several new notifications, while on the right one, nothing will be visible except for its own presentation since the left card has already finished sending messages. The specific result of refreshing the right card is shown in the screenshot:

![](http://localhost:8484/b0784926-0177-48cb-9841-b51e8bc24203.avif)

We see here that the messages come from different IDs because the card on the right changes ID with each refresh.

The next experiment is to check if the Broad Cast Channel works between different browsers:

![](http://localhost:8484/a391acb2-05de-4311-ab57-d5cb2b76007f.avif)

It turned out that no. It makes sense because if it were to work between browsers, there would have to be communication between the processes maintaining the browsers.

## Same Origin Policy

The Broadcast Channel has a range of operation for all tabs, browsers, and iframes within the same Origin, meaning the scheme (protocol), host, and port.

We can read more about the Origin itself in the Mozilla Developers dictionary

[Origin - MDN Web Docs Glossary: Definitions of Web-related terms](https://developer.mozilla.org/en-US/docs/Glossary/Origin)

We will check if it will work correctly for different computers as well. To do this, we need to change the parcel settings, because it currently exposes our service on localhost.

![](http://localhost:8484/f181a0be-8a4c-460e-8b88-af06434063a3.avif)

We can check our current IP address with the command.

```
ip route
```

![](http://localhost:8484/3dc7b0ef-fae0-45df-9f23-179df34c5106.avif)

From the documentation, we can read that simply adding the `--host` flag is enough.

[Parcel CLI](https://parceljs.org/cli.html)

```
parce index.html --host 192.168.2.162
```

![](http://localhost:8484/ea9494ab-6361-42e8-a9c8-88e8e2a3646d.avif)

It turned out that communication is not transmitted between different computers.

This is intuitive. While Web Sockets have some server to maintain (or even WebRTC for establishing) the connection, here the only layer of data transport is the RAM of the computer on which the Broadcast Channel is used.

## Broadcast Channel API vs Shared Workers, Message Channel, and post Message

You may be wondering what the difference is between the discussed API and other methods of communication between contexts such as:

* Shared Workers
* Message Channel
* window.postMessage()

In the case of SharedWorkers, you can do the same as with BroadcastChannel, but it requires more code. I recommend using SharedWorkers for more advanced tasks such as managing locks, sharing state, synchronizing resources, or sharing a WebSocket connection between tabs.

On the other hand, the Broadcast Channel API is more convenient in simple cases when we want to send a message to all windows, tabs, or workers.

As for the MessageChannel API, the main difference is that in the MessageChannel API, a message is sent to one recipient, while in the Broadcast Channel there is one sender and the recipients are always all other contexts.

In window.postMessage, on the other hand, it's required to maintain a reference to the iframe or worker object to transmit communication, for example:

```
const popup = window.open('https://another-origin.com', ...);
popup.postMessage('Sup popup!', 'https://another-origin.com');
```

On the other hand, you also need to ensure that when receiving, you check the source of the message for security reasons:

```
const iframe = document.querySelector('iframe');
iframe.contentWindow.onmessage = function(e) {
  if (e.origin !== 'https://expected-origin.com') {
    return;
  }
  e.source.postMessage('Ack!', e.origin);
};
```

In this regard, Broadcast Channel is more limited because it does not allow communication between different Origins, but it provides higher security by default. On the other hand, window.postMessage did not allow sending to other windows because references to them could not be caught.

## Drawing on Canvas in Independent Tabs

Time for a practical example. Well, maybe not super useful, but it nicely showcases the capabilities of the Broadcast Channel API.

We will program an application that allows transferring drawn shapes on the canvas between browser tabs.

We will start with regular mouse drawing on the canvas. To do this, we will modify our `index.html` code by adding a canvas and the necessary styles.

```
<html lang="en">
<body style="margin:0;">
<canvas id="canvas" style="width: 100vw; height: 100vh;"></canvas>
<script src="./index.ts"></script>
</body>
</html>
```

In the script `index.ts` we enter

```
interface Window {
    canvas?: HTMLCanvasElement;
}
```

This will allow us to keep the canvas in the window. To avoid searching for it multiple times, we can use `window` as a cache where we will keep it after the first find.

```
const getCanvasAndCtx = (): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } => {
    const canvas = window.canvas || document.querySelector('#canvas');
    if (canvas instanceof HTMLCanvasElement) {
        window.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            return {canvas, ctx}
        } else {
            throw new Error('Canvas do not have context');
        }
    }
    throw new Error('Canvas Not found');
}
```

To adjust the size of the canvas, we declare the function `syncCanvasSize`

```
const syncCanvasSize = () => {
    const { canvas } = getCanvasAndCtx()
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}
```

We will perform it on every `resize` event on the `window` and after the page loads.

```
window.addEventListener('resize', syncCanvasSize)

window.addEventListener('DOMContentLoaded', () => {
    syncCanvasSize();
    const {canvas, ctx} = getCanvasAndCtx()
```

We define several parameters to determine the state and history of the cursor.

```
    let flag = false,
        prevX = 0,
        currX = 0,
        prevY = 0,
        currY = 0;
```

Next, we define the `drawLine` function that draws a line and the `drawDot` function that draws a dot.

```
    function drawLine() {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    function drawDot() {
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.fillRect(currX, currY, 2, 2);
        ctx.closePath();
    }
```

And the most important function `findPosition` - controlling the drawing logic

```
    function findPosition(res: EventType, e: { clientX: number, clientY: number }) {
        if (res == EventType.down) {
            prevX = currX;
            prevY = currY;
            currX = e.clientX;
            currY = e.clientY;
            flag = true;
            drawDot()
        }
        if ([EventType.up, EventType.out].includes(res)) {
            flag = false;
        }
        if (res == EventType.move) {
            if (flag) {
                prevX = currX;
                prevY = currY;
                currX = e.clientX;
                currY = e.clientY;
                drawLine();
            }
        }
    }
```

At the end, we add a listener for mouse-related events to use the `findPosition` function.

```
    canvas.addEventListener("mousemove", (e) => {
        findPosition(EventType.move, e)
    });
    canvas.addEventListener("mousedown", (e) => {
        findPosition(EventType.down, e)
    });
    canvas.addEventListener("mouseup", (e) => {
        findPosition(EventType.up, e)
    });
    canvas.addEventListener("mouseout", (e) => {
        findPosition(EventType.out, e)
    });

})
```

The above code allows us to draw on the canvas within a single tab. To enable transferring the image between tabs, we will use the Broadcast Channel.

Its initialization will be required:

```
const bc = new BroadcastChannel('channel');
```

Adding a listener for the `findPosition` command.

```
bc.onmessage = (e) => {
	if(e.data.cmd === 'findPosition') {
		findPosition(e.data.args[0], e.data.args[1], false)
	}
}
```

In the `findPosition` function, we added a third argument - `propagate` indicating whether the function call should send a message to the channel. The value `false` allows avoiding infinite nesting.

Finally, we change the signature of the `findPosition` function as described and add a code snippet responsible for sending messages to other cards.

```
function findPosition(res: EventType, e: {clientX: number, clientY: number}, propagate: boolean) {

    if(propagate) {
        bc.postMessage({cmd: 'findPosition', args: [res, {clientX: e.clientX, clientY: e.clientY}]})
        }
```

It is worth noting that we are not passing full `event` objects here, but only the coordinates. This is not just an optimization. Cloning such objects as Event is not possible between contexts.

The entire code contained in `index.ts` is presented below:

```
interface Window {
    canvas?: HTMLCanvasElement;
}

const getCanvasAndCtx = (): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } => {
    const canvas = window.canvas || document.querySelector('#canvas');
    if (canvas instanceof HTMLCanvasElement) {
        window.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            return {canvas, ctx}
        } else {
            throw new Error('Canvas do not have context');
        }
    }
    throw new Error('Canvas Not found');
}

const syncCanvasSize = () => {
    const {canvas} = getCanvasAndCtx()
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}

window.addEventListener('resize', syncCanvasSize)

enum EventType {
    down,
    up,
    move,
    out
}

window.addEventListener('DOMContentLoaded', () => {
    syncCanvasSize();
    const {canvas, ctx} = getCanvasAndCtx()

    let flag = false,
        prevX = 0,
        currX = 0,
        prevY = 0,
        currY = 0;

    const bc = new BroadcastChannel('channel');

    function drawLine() {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    function drawDot() {
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.fillRect(currX, currY, 2, 2);
        ctx.closePath();
    }

    function findPosition(res: EventType, e: { clientX: number, clientY: number }, propagate: boolean) {

        if (propagate) {
            bc.postMessage({cmd: 'findPosition', args: [res, {clientX: e.clientX, clientY: e.clientY}]})
        }

        if (res == EventType.down) {
            prevX = currX;
            prevY = currY;
            currX = e.clientX;
            currY = e.clientY;
            flag = true;
            drawDot()
        }
        if ([EventType.up, EventType.out].includes(res)) {
            flag = false;
        }
        if (res == EventType.move) {
            if (flag) {
                prevX = currX;
                prevY = currY;
                currX = e.clientX;
                currY = e.clientY;
                drawLine();
            }
        }
    }

    canvas.addEventListener("mousemove", (e) => {
        findPosition(EventType.move, e, true)
    });
    canvas.addEventListener("mousedown", (e) => {
        findPosition(EventType.down, e, true)
    });
    canvas.addEventListener("mouseup", (e) => {
        findPosition(EventType.up, e, true)
    });
    canvas.addEventListener("mouseout", (e) => {
        findPosition(EventType.out, e, true)
    });

    bc.onmessage = (e) => {
        if (e.data.cmd === 'findPosition') {
            findPosition(e.data.args[0], e.data.args[1], false)
        }
    }

})
```

The application works in such a way that the image drawn in one tab appears in all the others:

## Uses of the Broadcast Channel API

The example application shows that the broadcast channel can be used in a very convenient way. Synchronization between tabs was achieved by adding 9 lines of code, of which 3 are closing curly braces.

Some example uses are:

* Detecting user actions in other tabs
* Checking when the user logged into their account in another tab or window
* Instructing Workers to perform some tasks in the background
* Distributing photos uploaded by the user in other tabs

If we need communication between computers, the Broadcast Channel API will not help, and we should use WebSockets or WebRTC for real-time communication.

Recommended resources and documentation:

[Broadcast Channel API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)

[BroadcastChannel API: A Message Bus for the Web | Google Developers](https://developers.google.com/web/updates/2016/09/broadcastchannel)
