---
author: Daniel Gustaw
canonicalName: broadcast-channel-api
coverImage: http://localhost:8484/8b3fb584-7d88-42e4-b053-b66de5ddfd09.avif
description: Esta publicación muestra cómo usar la API de Canal de Difusión para enviar datos entre pestañas o ventanas del navegador sin usar un servidor y sockets.
excerpt: Esta publicación muestra cómo usar la API de Canal de Difusión para enviar datos entre pestañas o ventanas del navegador sin usar un servidor y sockets.
publishDate: 2021-07-07 11:08:19+00:00
slug: es/api-del-canal-de-difusion
tags:
- web-api
- broadcast
- channel
title: API de Canal de Difusión
updateDate: 2021-07-23 09:22:25+00:00
---

Aprenderemos cómo usar la `API de Canal de Difusión` para enviar datos entre pestañas o ventanas del navegador sin utilizar un servidor y sockets.

## Parcel Bundler - constructor intuitivo y simple

Como siempre, presentamos el código de principio a fin. Comenzaremos instalando Parcel - el constructor más sencillo en el mundo de JS que funciona directamente, a diferencia de Webpack, cuya configuración es simplemente tediosa. Instalamos Parcel con el comando:

```
npm install -g parcel-bundler
```

Creamos archivos `html` y `ts` con los comandos:

```
echo '<html><body><script src="./index.ts"></script></body></html>' > index.html
touch index.ts
```

Y encendemos nuestro servidor

```
parcel index.html
```

## Fundamentos de la API del Canal de Difusión

Ahora mostraremos cómo ver la operación más simple de la API del Canal de Difusión en la consola del navegador. En el archivo `index.ts`, inicializamos el canal.

```
const bc = new BroadcastChannel('channel');
```

A continuación, asignaremos un ID aleatorio a nuestra tarjeta en el navegador.

```
const id = Math.random();
```

Y almacenaremos en memoria los contadores de mensajes enviados y recibidos.

```
let send = 0, received = 0;
```

Como mensaje de bienvenida, mostraremos el ID seleccionado para nuestra tarjeta.

```
console.log("START", id);
```

A continuación, configuramos la escucha de mensajes.

```
bc.onmessage = (e) => {
    console.log(e.data, send, received);
    received++;
}
```

Aumentamos el conteo de mensajes recibidos en él y mostramos los datos recibidos y los valores del contador en la tarjeta dada.

Ahora es el momento de enviar mensajes al canal. Las funciones `postMessage` se utilizan para esto.

Un momento después de que la tarjeta se active, queremos enviar un mensaje de bienvenida a otras tarjetas.

```
setTimeout(() => {
    bc.postMessage({title: `Connection from ${id}`})
}, 250)
```

El tiempo de espera permite esperar a que otras pestañas se recarguen. Sin él, en las pestañas que no están listas cuando se envía este mensaje, no veríamos el registro de la consola.

A continuación, queremos enviar dos mensajes más que actualizarán nuestros contadores de envío.

```
const i = setInterval(() => {
    const uptime = performance.now();
    bc.postMessage({id, uptime, send, received})
    send++;
    if (uptime > 1e3) clearInterval(i)
}, 500)
```

Por cierto, utilizamos una API diferente aquí - rendimiento:

[Rendimiento - Web APIs | MDN](https://developer.mozilla.org/mdn-social-share.0ca9dbda.png)](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

Para las dos pestañas, podemos ver que cada pestaña tiene su propio identificador único y mensajes enviados desde la pestaña opuesta.

![](http://localhost:8484/460465c8-3065-49e4-9856-b06dbd448dcd.avif)

Nada nos impide habilitar cuatro tarjetas a la vez. Entonces los mensajes de las tres restantes se entrelazarán entre sí.

![](http://localhost:8484/7d5446fd-3412-4adb-aaa2-ee9f4493f039.avif)

Podemos volver a dos pestañas y refrescar la de la derecha varias veces. Como resultado de esta acción, la de la izquierda recibirá varias nuevas notificaciones, mientras que en la de la derecha, no se verá nada excepto su propia presentación, ya que la tarjeta de la izquierda ya ha terminado de enviar mensajes. El resultado específico de refrescar la tarjeta de la derecha se muestra en la captura de pantalla:

![](http://localhost:8484/b0784926-0177-48cb-9841-b51e8bc24203.avif)

Aquí vemos que los mensajes provienen de diferentes ID porque la tarjeta a la derecha cambia de ID con cada actualización.

El siguiente experimento es comprobar si el Canal de Difusión funciona entre diferentes navegadores:

![](http://localhost:8484/a391acb2-05de-4311-ab57-d5cb2b76007f.avif)

Resulta que no. Tiene sentido porque si funcionara entre navegadores, tendría que haber comunicación entre los procesos que mantienen los navegadores.

## Política de mismo origen

El Canal de Difusión tiene un rango de operación para todas las pestañas, navegadores e iframes dentro del mismo Origen, lo que significa el esquema (protocolo), host y puerto.

Podemos leer más sobre el Origen en el diccionario de desarrolladores de Mozilla

[Origen - Glosario de MDN Web Docs: Definiciones de términos relacionados con la web](https://developer.mozilla.org/en-US/docs/Glossary/Origin)

Verificaremos si funcionará correctamente para diferentes computadoras también. Para ello, necesitamos cambiar la configuración del paquete, porque actualmente expone nuestro servicio en localhost.

![](http://localhost:8484/f181a0be-8a4c-460e-8b88-af06434063a3.avif)

Podemos verificar nuestra dirección IP actual con el comando.

```
ip route
```

![](http://localhost:8484/3dc7b0ef-fae0-45df-9f23-179df34c5106.avif)

De la documentación, podemos leer que simplemente agregar la bandera `--host` es suficiente.

[Parcel CLI](https://parceljs.org/cli.html)

```
parce index.html --host 192.168.2.162
```

![](http://localhost:8484/ea9494ab-6361-42e8-a9c8-88e8e2a3646d.avif)

Resultó que la comunicación no se transmite entre diferentes computadoras.

Esto es intuitivo. Mientras que los Web Sockets tienen algún servidor para mantener (o incluso WebRTC para establecer) la conexión, aquí la única capa de transporte de datos es la RAM de la computadora en la que se utiliza el Canal de Difusión.

## API de Canal de Difusión vs Trabajadores Compartidos, Canal de Mensajes y post Message

Puede que te estés preguntando cuál es la diferencia entre la API discutida y otros métodos de comunicación entre contextos como:

* Trabajadores Compartidos
* Canal de Mensajes
* window.postMessage()

En el caso de los Trabajadores Compartidos, puedes hacer lo mismo que con el Canal de Difusión, pero requiere más código. Recomiendo usar Trabajadores Compartidos para tareas más avanzadas como gestionar bloqueos, compartir estado, sincronizar recursos o compartir una conexión WebSocket entre pestañas.

Por otro lado, la API de Canal de Difusión es más conveniente en casos simples cuando queremos enviar un mensaje a todas las ventanas, pestañas o trabajadores.

En cuanto a la API de Canal de Mensajes, la principal diferencia es que en la API de Canal de Mensajes, un mensaje se envía a un destinatario, mientras que en el Canal de Difusión hay un emisor y los destinatarios son siempre todos los demás contextos.

En window.postMessage, por otro lado, es necesario mantener una referencia al iframe o al objeto trabajador para transmitir la comunicación, por ejemplo:

```
const popup = window.open('https://another-origin.com', ...);
popup.postMessage('Sup popup!', 'https://another-origin.com');
```

Por otro lado, también debes asegurarte de que al recibir, verifiques la fuente del mensaje por razones de seguridad:

```
const iframe = document.querySelector('iframe');
iframe.contentWindow.onmessage = function(e) {
  if (e.origin !== 'https://expected-origin.com') {
    return;
  }
  e.source.postMessage('Ack!', e.origin);
};
```

En este sentido, el Canal de Broadcast es más limitado porque no permite la comunicación entre diferentes Orígenes, pero proporciona una mayor seguridad por defecto. Por otro lado, window.postMessage no permitió el envío a otras ventanas porque no se podían capturar las referencias a ellas.

## Dibujo en el Lienzo en Pestañas Independientes

Hora de un ejemplo práctico. Bueno, quizás no super útil, pero muestra bien las capacidades de la API del Canal de Broadcast.

Programaremos una aplicación que permita transferir formas dibujadas en el lienzo entre pestañas del navegador.

Comenzaremos con el dibujo regular con el mouse en el lienzo. Para ello, modificaremos nuestro código `index.html` añadiendo un lienzo y los estilos necesarios.

```
<html lang="en">
<body style="margin:0;">
<canvas id="canvas" style="width: 100vw; height: 100vh;"></canvas>
<script src="./index.ts"></script>
</body>
</html>
```

En el script `index.ts` ingresamos

```
interface Window {
    canvas?: HTMLCanvasElement;
}
```

Esto nos permitirá mantener el lienzo en la ventana. Para evitar buscarlo múltiples veces, podemos usar `window` como una caché donde lo mantendremos después de la primera búsqueda.

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

Para ajustar el tamaño del lienzo, declaramos la función `syncCanvasSize`

```
const syncCanvasSize = () => {
    const { canvas } = getCanvasAndCtx()
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}
```

Lo realizaremos en cada evento `resize` en la `ventana` y después de que se cargue la página.

```
window.addEventListener('resize', syncCanvasSize)

window.addEventListener('DOMContentLoaded', () => {
    syncCanvasSize();
    const {canvas, ctx} = getCanvasAndCtx()
```

Definimos varios parámetros para determinar el estado y la historia del cursor.

```
    let flag = false,
        prevX = 0,
        currX = 0,
        prevY = 0,
        currY = 0;
```

A continuación, definimos la función `drawLine` que dibuja una línea y la función `drawDot` que dibuja un punto.

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

Y la función más importante `findPosition` - controlando la lógica de dibujo

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

Al final, añadimos un listener para eventos relacionados con el ratón para usar la función `findPosition`.

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

El código anterior nos permite dibujar en el lienzo dentro de una sola pestaña. Para habilitar la transferencia de la imagen entre pestañas, utilizaremos el Canal de Difusión.

Su inicialización será necesaria:

```
const bc = new BroadcastChannel('channel');
```

Agregando un oyente para el comando `findPosition`.

```
bc.onmessage = (e) => {
	if(e.data.cmd === 'findPosition') {
		findPosition(e.data.args[0], e.data.args[1], false)
	}
}
```

En la función `findPosition`, añadimos un tercer argumento - `propagate` que indica si la llamada a la función debe enviar un mensaje al canal. El valor `false` permite evitar la anidación infinita.

Finalmente, cambiamos la firma de la función `findPosition` como se describió y añadimos un fragmento de código responsable de enviar mensajes a otras tarjetas.

```
function findPosition(res: EventType, e: {clientX: number, clientY: number}, propagate: boolean) {

    if(propagate) {
        bc.postMessage({cmd: 'findPosition', args: [res, {clientX: e.clientX, clientY: e.clientY}]})
        }
```

Vale la pena señalar que no estamos pasando objetos `event` completos aquí, sino solo las coordenadas. Esto no es solo una optimización. Clonar objetos como Event no es posible entre contextos.

El código completo contenido en `index.ts` se presenta a continuación:

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

La aplicación funciona de tal manera que la imagen dibujada en una pestaña aparece en todas las demás:

## Usos de la API de Canal de Difusión

La aplicación de ejemplo muestra que el canal de difusión se puede utilizar de manera muy conveniente. La sincronización entre pestañas se logró agregando 9 líneas de código, de las cuales 3 son llaves de cierre.

Algunos usos de ejemplo son:

* Detectar acciones del usuario en otras pestañas
* Comprobar cuándo el usuario inició sesión en su cuenta en otra pestaña o ventana
* Instruir a los Trabajadores para realizar algunas tareas en segundo plano
* Distribuir fotos subidas por el usuario en otras pestañas

Si necesitamos comunicación entre computadoras, la API de Canal de Difusión no ayudará, y debemos usar WebSockets o WebRTC para comunicación en tiempo real.

Recursos y documentación recomendados:

[API de Canal de Difusión - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)

[API BroadcastChannel: un bus de mensajes para la web | Google Developers](https://developers.google.com/web/updates/2016/09/broadcastchannel)
