---
author: Daniel Gustaw
canonicalName: managing-processes-in-node-js
coverImage: http://localhost:8484/d8bce439-7a26-4a7d-aef8-4308277995db.avif
description: Aprende a crear y eliminar procesos hijos en Node JS, gestionar dinámicamente su cantidad y realizar comunicación bidireccional con ellos.
excerpt: Aprende a crear y eliminar procesos hijos en Node JS, gestionar dinámicamente su cantidad y realizar comunicación bidireccional con ellos.
publishDate: 2021-07-17 13:53:19+00:00
slug: es/control-de-carga-cpu-en-node-js
tags:
- nodejs
- cpu
title: Control de Procesos en Node JS
updateDate: 2021-07-17 13:57:27+00:00
---

En esta publicación, aprenderemos cómo crear y terminar `subprocesos` en Node JS y cómo pasar datos entre ellos.

Si el programa realiza cálculos pesados pero no está paralelizado, el estado de su procesador puede parecerse a esto:

![](http://localhost:8484/3b1ed569-b0e0-490f-81a6-df3454db4788.avif)

Por lo tanto, vale la pena profundizar en este tema, independientemente del lenguaje en el que estés escribiendo.

El artículo se dividirá en 3 partes:

* controlando el proceso usando `readline`
* creando y matando subprocesos
* comunicación entre procesos

En las dos primeras, escribiremos un script para simular la carga en los núcleos del procesador. En la última, paralelizaremos un ataque de fuerza bruta a una contraseña.

Al final, analizaremos la escalabilidad del programa que escribimos.

## Controlando el proceso con `readline`

Queremos escribir un programa en el que presionar una tecla en el teclado establezca cuántos núcleos del procesador deben ser cargados. Comenzaremos capturando eventos del teclado en tiempo real.

El módulo `readline` nos permitirá hacer esto, proporcionando una interfaz para leer y escribir datos desde flujos como el teclado - `process.stdin`.

Comenzaremos importando este módulo.

```javascript
const readline = require('readline');
```

A continuación, configuramos la emisión de eventos desde `readline` en una pulsación de tecla usando el comando

```javascript
readline.emitKeypressEvents(process.stdin);
```

El `readline` puede trabajar con diferentes flujos. Con esta línea, indicamos que debe escuchar el teclado. Inmediatamente configuramos el modo a `raw`.

```javascript
process.stdin.setRawMode(true);
```

Esto permite leer del teclado carácter por carácter con modificadores alternados como ctrl o shift. Al mismo tiempo, este modo obliga a manejar manualmente la terminación del proceso a través de `ctrl+c`. Más sobre los modos de flujo y la conexión del terminal a un proceso se puede encontrar en la documentación:

[Readline | Documentación de Node.js v16.5.0 | Documentación de Node.js v16.5.0](https://nodejs.org/api/readline.html#readline_readline_emitkeypressevents_stream_interface)

[TTY | Documentación de Node.js v16.5.0 | Documentación de Node.js v16.5.0](https://nodejs.org/api/tty.html#tty_readstream_setrawmode_mode)

Mientras tanto, en nuestro programa, las siguientes líneas manejarán la lectura de caracteres:

```javascript
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit();
    } else {
        console.log('typed char', key.name);
    }
});
```

El signo escrito en `key` es un objeto con las siguientes claves

```json lines
{ sequence: 'v', name: 'v', ctrl: false, meta: false, shift: false }
```

En el código presentado, manejamos el cierre del proceso con la combinación `ctrl+c` y la impresión en la consola del carácter seleccionado en el teclado. Escribiendo caracteres subsecuentes se mostrarán en la terminal cada vez.

![](http://localhost:8484/ed2de3c0-579d-4be5-b2ae-57c87cc4e1d8.avif)

El siguiente paso es reemplazar la impresión de caracteres por la creación o eliminación de procesos que carguen el procesador.

## Creando y Eliminando Procesos en Node JS

En Node JS, podemos crear subprocessos y gestionarlos muy fácilmente. Para gestionar subprocessos, podemos usar el módulo `child_process`. Lo importamos de la misma manera que el módulo anterior.

```
const cp = require('child_process');
```

A continuación, creamos un array donde almacenaremos referencias a los procesos que se están creando.

```
const forks = [];
```

Si nos olvidamos de ellos al cerrar el programa, se convertirían en procesos `zombie` - es decir, aquellos que aún viven y consumen recursos del ordenador sin supervisión.

![](http://localhost:8484/b76d2cab-977e-458c-bf42-027fe76d3234.avif)

Para eliminarlos, antes de cerrar nuestro script, escribimos el código:

```javascript
    if (key.ctrl && key.name === 'c') {
        while (forks.length > 0) {
            forks[forks.length - 1].kill()
            forks.pop()
        }
        process.exit();
    } else {
```

En el caso de seleccionar botones diferentes a `c` mientras se presiona `ctrl`, leeremos el valor numérico de ese botón y, en función de ello, agregaremos o eliminaremos el número apropiado de procesos para que su cantidad sea igual a ese número.

```javascript
        if (!Number.isNaN(parseInt(key.name,32))) {
            const req = parseInt(key.name,32);

            if (forks.length < req) {
                while (forks.length < req) {
                    const n = cp.fork(`${__dirname}/bomb.js`);
                    forks.push(n)
                }
            }

            if (forks.length > req) {
                while (forks.length > req) {
                    forks[forks.length - 1].kill()
                    forks.pop()
                }
            }

            console.log('processes PIDs', forks.map(f => f.pid));

        }
```

Uno podría sorprenderse por la elección del sistema numérico `32`. Sin embargo, es un sistema conveniente si asumimos que con una tecla queremos indicar un número pequeño que exceda 10.

La variable `req` recibe el número requerido de procesos, y gracias a `cp.fork` o `kill`, creamos y terminamos los procesos faltantes o en exceso.

Todo lo que necesitamos para completar el todo es el contenido del archivo `bomb.js`. Podría haber cualquier operación que consuma poder computacional. En nuestro caso, es

```javascript
let result = 0;
while (true) {
    result += Math.random() * Math.random();
}
```

significando que el código está escrito solo para simular carga.

Al iniciar el programa y seleccionar algunas opciones de carga, vemos cómo se crean y terminan procesos. Gracias a `htop`, podemos observar cómo cambia el uso de la CPU durante este tiempo.

![](http://localhost:8484/a089f093-d5f3-443b-ab10-728a38ca6a6b.avif)

Una interfaz aún más agradable para monitorear el procesador es proporcionada por `bashtop`, ya que también muestra el uso histórico. En la captura de pantalla a continuación, podemos ver cómo al modificar la cantidad de procesos en nuestro programa, pude simular varios niveles de carga de CPU con tareas.

![](http://localhost:8484/47bf0bb1-95cc-46b4-9d29-237b504b6a29.avif)

Y cómo se veía el uso del núcleo cuando seleccioné la opción de crear 16 procesos.

![](http://localhost:8484/05911406-d43c-4316-b265-9202b0042ea1.avif)

Podemos usar este programa para simular carga. En el archivo `bomb.js`, podemos reemplazar la generación de números aleatorios con el envío de solicitudes http o el consumo de otros recursos, como RAM o disco.

## Ataque de fuerza bruta en paralelo a una contraseña

Históricamente se han utilizado varios métodos para el hashing de contraseñas. Actualmente, el más popular es `bcrypt`, pero un competidor más moderno es `argon2i`, que también tiene una posición fuerte. Para simplificar, la diferencia entre ellos es que romper bcrypt requiere mucha potencia de cálculo, mientras que argon puede ser configurado para requerir una gran cantidad de RAM. En el primer caso, podemos adquirir fácilmente poder de cómputo en cantidades muy grandes, además, nuestras capacidades de descifrado de contraseñas se ven mejoradas por las tarjetas gráficas y procesadores de flujo. Sin embargo, al romper argon, es mucho más difícil reunir las cantidades necesarias de RAM en una sola máquina. Mi muy breve descripción merece ser ampliada con la lectura del artículo:

[Hashing de contraseñas: PBKDF2, Scrypt, Bcrypt y ARGON2](https://medium.com/analytics-vidhya/password-hashing-pbkdf2-scrypt-bcrypt-and-argon2-e25aaf41598e)

En la parte posterior de la entrada, mostraremos cómo el uso de múltiples núcleos acelera el descifrado de una contraseña hash con el algoritmo `bcrypt`.

Escribiremos código para generar un hash de contraseña, crackearlo usando un núcleo y luego escribir el mismo código usando subprocesos que asignaremos para verificar sucesivas frases.

### Generando un hash de contraseña usando bcrypt

Se requiere la instalación del paquete `bcrypt` para esto:

```
npm init -y && npm i bcrypt
```

Generaremos la contraseña utilizando el script `generate_hash.js`, que toma un argumento que es la contraseña y guarda su hash en el archivo `.pass`.

```javascript
const fs = require('fs')
const bc = require('bcrypt')

const main = async () => {
    return bc.hash(process.argv[2] || 'pass', 11)
}

main().then(p => {
    fs.writeFileSync(`${__dirname}/.pass`, p);
    console.log(p)
}).catch(console.error);
```

### Ataque de fuerza bruta para la ruptura de contraseñas en un solo hilo

En un ataque de fuerza bruta, la clave es el conjunto de caracteres sobre el que basaremos las secuencias que vamos a verificar. Usaremos el alfabeto estándar de `a` a `z`. Generaremos secuencias de caracteres para verificar combinándolos entre sí. El proceso de su generación y procesamiento se puede colocar en una función recursiva, pero al hacerlo, perdemos la oportunidad de un control conveniente sobre el orden. En su lugar, utilizaremos una cola simple mantenida en memoria. No se descargará, ya que descargarla desde el frente cambiaría el indexado dentro de la cola. Ya he descrito cuán perjudicial puede ser esto para el rendimiento en el artículo:

> ¿Cuántas familias pueden caber en un avión? - un problema algorítmico

Comparamos dos soluciones al problema de contar conjuntos de asientos adyacentes libres. Aprenderás a usar el Profiling y cuán significativa es la diferencia al usar pop y shift en arrays en js.

![](http://localhost:8484/e4679649-0445-42f4-9890-f45307625bd6.avif)

En lugar de descargar la cola, leeremos valores de ella utilizando un índice variable que se moverá a lo largo de ella. El diagrama de flujo del programa que escribiremos es el siguiente:

![](http://localhost:8484/50ac21aa-497e-4dca-8292-d672a9cd5198.avif)

Su código es:

```javascript
const fs = require('fs');
const bc = require('bcrypt');
const alphabet = String.fromCharCode(...Array(123).keys()).slice(97);
const hash = fs.readFileSync(`${__dirname}/.pass`).toString()
const chalk = require('chalk')

let i = 0;
const s = new Date().getTime();
const n = () => new Date().getTime() - s;
let found = false;

const que = [];

async function check(input) {
  if (found) return;
  const r = await bc.compare(input, hash)

  console.log(`${i}\t${input}\t${n()}\t${r}\t${que.length}`)
  if (r) {
    console.log(chalk.green(`FOUND: "${input}"`))
    found = true;
    process.exit();
  }
  for (let n of alphabet) {
    que.push(input + n);
  }
}

async function processQue() {
  const phrase = que[i++]
  await check(phrase)
}

const main = async () => {
  while (!found) {
    await processQue()
  }
}

console.log(`i\tinput\tn()\tr\tque.length`)
check('').then(() => main()).catch(console.error)
```

El paquete `chalk` es necesario para las acciones, lo que permite una fácil coloración del texto:

```
npm i chalk
```

Probemos nuestro programa.

Primero, generaremos una contraseña. Elegiremos "ac" porque es simple y la romperemos rápidamente.

```
node generate_hash.js ac
```

A continuación, lanzamos nuestro programa y vemos cómo verifica secuencialmente las contraseñas de la cola.

```
time node force-single.js
```

![](http://localhost:8484/72cbd407-9321-4ca7-b7e9-b57a8911bad8.avif)

En las columnas tenemos el índice, la secuencia que se está comprobando, el tiempo desde que se inició el programa en milisegundos, información sobre si la contraseña coincide con el hash y la longitud actual de la cola.

Si le preocupa que la cola esté creciendo demasiado rápido y desperdiciando mucha energía, podemos ver cómo se comportará el programa después de reemplazar la línea.

```
const r = await bc.compare(input, hash)
```

por

```
const r = i >= 29 // await bc.compare(input, hash)
```

Resultará que el tiempo de ejecución del script disminuirá de 7.27 segundos a 0.17 segundos.

```
node force-single.js  0.17s user 0.03s system 103% cpu 0.188 total
```

¿Qué significa que solo el 2.3% de la potencia computacional está asignada a operaciones distintas de las comparaciones de contraseñas?

### Uso de Subprocesos para Mejorar el Rendimiento

Dado que comprobar la compatibilidad de contraseñas y hashes es una operación intensiva en CPU, esperamos un aumento significativo en el rendimiento de esta tarea si utilizamos múltiples núcleos simultáneamente. Por esta razón, reescribiremos nuestro programa para que el proceso principal maneje la cola y asigne la tarea de verificación a subprocesos en lugar de realizar las comprobaciones de contraseñas por sí mismo.

![](http://localhost:8484/cffe8d53-af1d-41cc-afd9-9559222f20c6.avif)

El diagrama de nuestro programa está dividido en el proceso principal y los subprocesos. En el proceso principal, se crea una lista de procesos hijo, una cola y oyentes para mensajes de los subprocesos. Al final, cada subproceso recibe una tarea de la cola para ejecutar. Tras completar, los subprocesos informan de vuelta al hilo principal con la respuesta, que incrementa el índice y les asigna nuevas tareas. Esto continúa hasta que se encuentra la contraseña correcta.

![](http://localhost:8484/9f6ce1ed-a710-42bb-890e-1def30a24127.avif)

Vale la pena señalar que los hijos independientes ejecutarán tareas a diferentes velocidades, lo que afectará el orden de los informes de respuesta. Un ejemplo de salida del programa es:

![](http://localhost:8484/ba051803-3c65-464d-8441-1368270ef48e.avif)

El código está dividido en dos archivos:

* force-child.js - proceso principal que utiliza procesos hijo
* force-fork.js - subproceso para verificar contraseñas con bcrypt

Comenzaremos analizando el proceso principal - `force-child.js`. El programa comienza definiendo el alfabeto y variables auxiliares para la indexación y conteo del tiempo.

```
const cp = require('child_process');
const fs = require('fs');
const chalk = require('chalk')

const alphabet = String.fromCharCode(...Array(123).keys()).slice(97);
const forks = [];

let i = 0;
const s = new Date().getTime();
const n = () => new Date().getTime() - s;
let found = false;
```

A continuación, llenamos la cola con el alfabeto.

```
const que = alphabet.split('');
```

La función `check` en la versión de un solo hilo del programa recibió una frase, la verificó y amplió la cola. Esta vez, además de la frase, el argumento será el subproceso elegido para realizar la verificación - `f`. En lugar de usar `bcrypt` directamente, enviaremos una solicitud para que el subproceso procese la frase y amplíe la cola.

```
function check(input, f) {
    if (found) return;

    f.send(input);

    for (let n of alphabet) {
        que.push(input + n);
    }
}
```

Eliminamos la palabra `async` aquí, lo que significa que no tenemos que esperar la ejecución de esta función. Es una simple delegación de la tarea. Un elemento clave de este código es el envío de un mensaje al subproceso realizado por la función `send` ejecutada directamente en el subproceso.

La siguiente función `processQue` se utiliza para realizar un único tick en la cola.

```
function processQue(f) {
    const phrase = que[i++]
    check(phrase, f)
}
```

Es muy corto y su tarea principal es prevenir la duplicación de la lógica responsable de iterar a través de la cola.

La función principal del programa es `main` y es responsable de configurar los oyentes para las respuestas de los subprocessos y asignarles tareas iniciales que les permiten entrar en el bucle de comunicación entre ellos.

```javascript
const main = async () => {
  forks.forEach(f => {
    f.on('message', ({input, r}) => {
      console.log(`${i}\t${input}\t${n()}\t${r}\t${que.length}\t${f.pid}`)

      if (r) {
        console.log(chalk.green(`FOUND: "${input}"`))
        found = true;

        fs.appendFileSync('logs.txt', `${forks.length},${n()}\n`)

        while (forks.length > 0) {
          forks[forks.length - 1].kill()
          forks.pop()
        }

        process.exit();
      } else {
        processQue(f);
      }
    });
    processQue(f);
  })
}
```

Antes de llamar a la función `main`, es necesario generar los procesos en el arreglo `forks`:

```javascript
while (forks.length < (process.argv[2] || 15)) {
  const n = cp.fork(`${__dirname}/force-fork.js`);
  forks.push(n)
}
```

El número recomendado es un valor cercano al número de hilos del procesador pero menor que este, para que el proceso principal no se bloquee.

Al final, imprimimos información sobre el programa, los nombres de las columnas y comenzamos la función `main`.

```javascript
console.log(chalk.blue(`Run using ${forks.length} child processes`))
console.log(`i\tinput\tn()\tr\tque.length\tpid`)
main().catch(console.error)
```

El segundo archivo - `force-fork.js` es mucho más simple y solo contiene la lectura del `hash` y la espera de tareas. Cuando las recibe, verifica la contraseña probada usando `bcrypt`, y luego envía el resultado de vuelta a través del mismo canal de comunicación.

```javascript
const fs = require('fs');
const bc = require('bcrypt');

const hash = fs.readFileSync(`${__dirname}/.pass`).toString()

process.on('message', (input) => {
  bc.compare(input, hash).then((r) => {
    process.send({r, input});
  })
});
```

## Análisis de Escalabilidad

El lector observador probablemente ha notado una línea de código discreta, pero importante para la continuación del artículo:

```javascript
fs.appendFileSync('logs.txt', `${forks.length},${n()}\n`)
```

Se realiza después de encontrar la contraseña y adjunta el número de subprocesos y el tiempo tomado para encontrar la contraseña al archivo `logs.txt`. Los datos para este archivo se proporcionaron ejecutando un bucle doble en `bash`.

```
for j in $(seq 1 20); do for i in $(seq 1 25); do time node force-child.js $i; sleep 4; done; done;
```

Y luego expandiendo estos resultados con un mayor número de procesos.

```
for j in $(seq 1 5); do for i in $(seq 1 50); do time node force-child.js $i; sleep 4; done; done;
```

Según la Ley General de Escalabilidad, esperamos que el rendimiento aumente hasta cierto punto (alrededor de 15 núcleos) y luego decline debido a los retrasos causados por el bloqueo mutuo de los subprocesos.

### Ley Universal de Escalabilidad

Si no has oído hablar de la ley universal de escalabilidad, déjame presentarte rápidamente el tema. Sugiere que en un mundo ideal, si los sistemas fueran escalables de manera lineal, significaría que añadir `n` veces más recursos aumentaría el rendimiento o el rendimiento del sistema en `n` veces. Esta situación se puede ilustrar con la imagen:

![](http://localhost:8484/b551739b-a90e-4e7d-b275-9cbf067b2c02.avif)

Sin embargo, tales situaciones no se encuentran en el mundo real. Siempre hay alguna ineficiencia asociada con la asignación de datos a nodos (servidores o hilos) y su recolección. Los retrasos relacionados con la asignación y recepción de datos se llaman serialización, y a veces puedes encontrar el término `contención`:

![](http://localhost:8484/3f245c79-a00f-42ed-9050-209d5a69e8d9.avif)

Tomar en cuenta este fenómeno lleva al modelo de Amdahl. Sin embargo, resulta que es insuficiente para la mayoría de los sistemas de TI porque ignora completamente el segundo factor principal que limita la escalabilidad: la comunicación entre procesos - `crosstalk`. Esto se puede representar gráficamente de la siguiente manera:

![](http://localhost:8484/a3003513-1d18-4386-85cf-e6d83bdc3581.avif)

Mientras que la serialización tiene un costo proporcional al número de nodos, la comunicación es proporcional al cuadrado de su número, al igual que el número de diagonales de un polígono con respecto al número de ángulos.

![](http://localhost:8484/0a680f83-94b6-4398-aeda-28b4186f3e8b.avif)

En el gráfico, vemos curvas que comparan el impacto del número de nodos en el rendimiento del sistema según estos tres modelos.

![](http://localhost:8484/6ddf6ca7-c25e-473a-bceb-d4d4a19506d0.avif)

Un buen estudio (de 50 páginas) sobre este tema se puede encontrar en el siguiente enlace:

[https://cdn2.hubspot.net/hubfs/498921/eBooks/scalability\_new.pdf](https://cdn2.hubspot.net/hubfs/498921/eBooks/scalability_new.pdf)

### Resumen de los datos de medición con el modelo USL

Los datos recopilados son las cantidades de hilos y los tiempos de ejecución del programa. Cargamos el programa en `Mathematica` con el comando:

```
load = Import["/home/daniel/exp/node/logs.txt", "Data"];
```

Dado que queremos considerar el rendimiento y no el tiempo de ejecución, invertimos la segunda columna con el comando.

```
loadEff = {#[[1]], 1/#[[2]]} & /@ load;
```

La unidad más sensible es la normalización con respecto al tiempo de ejecución de un solo subproceso. Esto nos permitirá ver la ganancia de agregar procesos adicionales. Calculamos el promedio de estos tiempos usando el comando

```
firstMean = GroupBy[loadEff // N, First -> Last, Mean][[1]];
```

A continuación, ajustamos el modelo:

```
nlm = NonlinearModelFit[{#[[1]], #[[2]]/firstMean} & /@
   loadEff, \[Lambda] n/(1 + \[Sigma] (n - 1) + \[Kappa] n (n -
         1)), {{\[Lambda], 0.9}, {\[Sigma], 0.9}, {\[Kappa],
    0.1}}, {n}]
```

Y lo comparamos con el gráfico de la lista de puntos de medición.

```
Show[ListPlot[{#[[1]], #[[2]]/firstMean} & /@ loadEff],
 Plot[nlm[s], {s, 0, 50}, PlotStyle -> Orange, PlotRange -> All],
 AxesLabel -> {"processes", "gain of efficiency"}, ImageSize -> Large,
  PlotLabel -> "Gain of efficiency relative to single process"]
```

![](http://localhost:8484/ae266323-acb4-4792-a077-286260383b11.avif)

Vale la pena mostrar una fórmula muy interesante para el máximo teórico.

```
Solve[D[\[Lambda] n/(1 + \[Sigma] (n - 1) + \[Kappa] n (n - 1)),
   n] == 0, n]
```

![](http://localhost:8484/5eeff6fb-5759-4d91-b8bf-7a9684533bf7.avif)

Calculado numéricamente

```
NSolve[D[Normal[nlm], n] == 0, n]
```

el número óptimo de procesos es `14.8271`. Hace unos párrafos, escribí que se recomienda tener un valor ligeramente inferior al número de hilos disponibles - tenía 16.

## Procesos, Trabajadores y Clústeres en Node JS

Este artículo se centró en los procesos descritos en la documentación en el enlace

[Process | Node.js v16.5.0 Documentation | Node.js v16.5.0 Documentation](https://nodejs.org/api/process.html)

Mostramos cómo crear subprocessos, matarlos. Cómo gestionar dinámicamente el número de subprocessos y mantener una comunicación bidireccional con ellos. Al final, comparamos la escalabilidad de la ruptura de contraseñas utilizando el método de fuerza bruta con predicciones de la ley de escalado universal.

Sin embargo, solo tocamos ligeramente este tema. No escribí nada sobre clústeres descritos aquí:

[Cluster | Node.js v16.5.0 Documentation | Node.js v16.5.0 Documentation](https://nodejs.org/api/cluster.html)

O trabajadores, que también tienen una sección separada en la documentación

[Worker threads | Node.js v16.5.0 Documentation | Node.js v16.5.0 Documentation](https://nodejs.org/api/worker_threads.html)

Te animo a leer la documentación de `Node JS` por tu cuenta y diseñar tus propios experimentos.
