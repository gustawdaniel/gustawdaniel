---
author: Daniel Gustaw
canonicalName: fetch-promise-and-template-string-on-example-of-to-do-list-in-javascript
coverImage: http://localhost:8484/014d0920-5eca-46f4-b476-960e0fa98596.avif
description: Este proyecto simple es excelente como introducción a la programación en JavaScript. El énfasis está en los elementos de ES6 y el frontend.
excerpt: Este proyecto simple es excelente como introducción a la programación en JavaScript. El énfasis está en los elementos de ES6 y el frontend.
publishDate: 2021-04-20 21:46:37+00:00
slug: es/fetch-promesa-y-cadena-de-plantilla-en-ejemplo-de-lista-de-tareas-en-javascript
tags:
- js
- es6
- html
- css
title: Fetch, Promise y Template String en el ejemplo de Lista de Tareas en JavaScript
updateDate: 2021-04-20 21:46:37+00:00
---

### Descripción del proyecto

Este proyecto simple te enseña cómo aplicar la interfaz `fetch`, muestra ejemplos de uso de `promesas` y algunas propiedades de `css` interesantes como `transform`, `user-select` o la directiva `@media`.

Composición del código fuente:

```
JavaScript 49.5% CSS 40.3% HTML 10.2%
```

Después de terminar el proyecto, se verá de la siguiente manera:

![js-es6-1](http://localhost:8484/2f16cf65-198d-462d-9fe2-2a9e496aabbd.avif)

Lista de tareas escrita en JavaScript puro que se presentará en este artículo.

Puedes ver todo el código fuente en el siguiente enlace

> [https://github.com/gustawdaniel/simple-todo-app-js-tutorial](https://github.com/gustawdaniel/simple-todo-app-js-tutorial)

### Instalación

Si deseas probar el código en tu computadora sin reescribirlo, la forma más sencilla es descargar la versión mediante el comando

```bash
wget -qO- https://github.com/gustawdaniel/simple-todo-app-js-tutorial/archive/1.0.tar.gz | tar xvz
```

A continuación, dirígete al directorio creado.

```bash
cd simple-todo-app-js-tutorial-1.0
```

Ahora deberías instalar las dependencias.

```bash
npm i
```

Para configurar los servidores necesitaremos dos terminales. En la primera ejecutamos el servidor con nuestro proyecto.

```bash
node node_modules/http-server/bin/http-server
```

En la segunda terminal `ctrl+n` configuramos el servidor `REST API` proporcionado por el paquete `json-server`.

```bash
node node_modules/json-server/lib/bin.js --watch db.json
```

Si todo funciona, deberíamos ver algo como esto.

![js-es6-2](http://localhost:8484/4193b63c-cfa6-4828-a4a1-ae620dd8de2f.avif)

Servidor con aplicación (a la derecha) y con API REST conectada con el archivo db.json (a la izquierda)

El sitio web debería estar disponible en la dirección `localhost:8080`

### Estructura del proyecto

El proyecto contiene los siguientes archivos

```text
├── app.js              // script providing creating, reading and deleting tasks
├── db.json             // json file with data that is connected with REST API
├── index.html          // html file with main page
├── LICENSE             // licencje WTFPL
├── package.json        // file with dependencies (servers: http and json)
├── README.md           // documentation for end user
└── style.css           // style
```

Puedes ver que el proyecto es realmente simple. La página permite las siguientes acciones:

* crear tareas
* mostrar tareas
* eliminar tareas

En el siguiente capítulo describimos el contenido de los archivos estáticos `index.html` y `style.css`. A continuación, discutimos los servidores que configuramos, el papel del archivo `db.json` y al final la lógica ubicada en el archivo `app.js`.

### Documento estático

El archivo `index.html` comienza de una manera bastante clásica. Estamos descargando la fuente `Lato` y adjuntando nuestro estilo personalizado.

```html
<html>
<head>
    <link href="https://fonts.googleapis.com/css?family=Lato:300&subset=latin-ext" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
```

Debido a que el código escrito está en acuerdo con las reglas de la semántica de `HTML5`, tenemos una división en `header` y `main`. En el encabezado hay un formulario con un campo para escribir el texto de la tarea.

```html
<body>
<header>
    <form class="todo">
        <input name="task" type="text" placeholder="Type text to add note">
    </form>
</header>
```

En la parte `main` hay una lista con tres elementos ejemplares. Los elementos tienen sus propios identificadores y están divididos en dos partes. La primera contiene el identificador, la segunda el texto y un botón para eliminar la tarea.

```html
<main>
  <ul>
    <li data-id="1">
      <div class="list-elem-head">
          <span class="id">1</span>
      </div>
      <div class="list-elem-body">
          <span class="text">First One</span>
          <span class="delete">x</span>
      </div>
    </li>
    <li data-id="2">
      <div class="list-elem-head">
          <span class="id">2</span>
      </div>
      <div class="list-elem-body">
          <span class="text">Second todo</span>
          <span class="delete">x</span>
      </div>
    </li>
    <li data-id="5">
      <div class="list-elem-head">
          <span class="id">5</span>
      </div>
      <div class="list-elem-body">
          <span class="text">At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.</span>
          <span class="delete">x</span>
      </div>
    </li>
  </ul>
</main>
```

Al final adjuntamos el script, que describimos más adelante. Ahora puede ser un archivo vacío.

```html
<script src="app.js"></script>
</body>
</html>
```

## Archivo CSS

Si no hubiera estilos, ver esta página causaría pesadillas. Pero inspirado por las conferencias de `html` y `css` que proporcioné la última vez, decidí escribir un archivo `css` desde cero. Las reglas que he añadido comienzan determinando el ancho del documento dependiendo del ancho de la pantalla. Con más frecuencia uso bootstrap para este propósito, pero se puede hacer sin él. Esto se realiza mediante la directiva @media, cuyo uso se presenta a continuación:

```css
@media (max-width: 575px) {
    input,main {
        width: 100%;
    }
}
@media (min-width: 576px) {
    input,main {
        width: 80%;
    }
    main {
        margin-left: 10%;
    }
}
```

Puedes ver que en los dispositivos más grandes queremos tener margen, que en los más pequeños no es necesario. La siguiente regla es aplicar la fuente Lato a todo el documento.

```css
body {
    font-family: 'Lato', sans-serif;
}
```

En el encabezado, estamos centrando el formulario y eliminando sus márgenes naturales.

```css
header {
    text-align: center;
}
form {
    margin: 0;
}
```

A continuación, definimos las reglas para resaltar la entrada a la que haremos clic o sobre la que pasaremos el ratón. Eliminamos la transparencia del marco y añadimos sombra difusa y fondo rojo.

```css
input:focus, input:hover {
    border: solid 1px crimson;
    box-shadow: 0 0 5px -1px crimson;
    background-color: rgba(220, 20, 60, 0.05);
}
```

Ahora podemos ver en la entrada no seleccionada.

```css
input {
    padding: 20px;
    border: solid 1px rgba(220, 20, 60, 0.52);
    margin: 10px 0;
    transition: box-shadow 1s, background-color 2s;
}
```

La propiedad interesante de `input` no seleccionado es `transition`. Permite definir un retraso en los cambios de sombra y fondo. Gracias a la transición, podemos ver la desaparición y aparición suaves de estas propiedades.

Efectos análogos queremos aplicar a los elementos de la lista. El elemento más destacado es el movimiento del borde izquierdo de la lista hacia la derecha, lo que establecemos en la propiedad `margin`.

```css
li:hover {
    border: solid 1px rgba(220, 20, 60, 0.8);
    background-color: rgba(220, 20, 60, 0.05);
    box-shadow: 0 0 2px -1px crimson;
    margin: 3px 0 3px 10px;
}
```

Para comparación, si el mouse no pasa por encima del elemento de la lista, entonces el margen es simétrico. También se aplica `transition` para obtener una animación de indentación y expulsión de un elemento de la lista.

```css
li {
    list-style: none;
    border: solid 1px rgba(220, 20, 60, 0.52);
    margin: 3px 0;
    color: gray;
    transition: margin 0.5s, background-color 2s;
}
```

Los elementos de la lista se dividen en dos partes, `.list-elem-head` se utiliza para mostrar el identificador. El espacio alrededor se empuja con márgenes. También vale la pena prestar atención a `float: left` que permite que las divisiones estén adyacentes en una sola línea.

```css
.list-elem-head {
    float: left;
    margin: 20px;
}
```

La situación es completamente diferente para `.list-elem-body`. Allí no son los márgenes, sino el padding los que son responsables de empujar y centrar en relación con los límites del elemento de la lista. Esto se debe a que necesitamos la altura completa del elemento `.list-elem-body` dentro del elemento `li` para agregar el borde `border-left`.

```css
.list-elem-body {
    margin-left: 70px;
    padding: 20px 20px 20px 20px;
    border-left: solid 1px rgba(220, 20, 60, 0.52);
}
```

Esta lista no necesita márgenes ni rellenos. Con `list-style: none` para `li` estamos eliminando el estilo predeterminado de la lista.

```css
ul {
    margin: 0;
    padding: 0;
}
```

Uno de los últimos cambios es desplazar el texto con una nota desde el borde interno del elemento de la lista.

```css
li > span.text {
    padding-right: 20px;
}
```

Al final, estilizamos el botón para eliminar tareas. Es un span que contiene la letra `x`. No estoy descargando ninguna fuente adicional. Sin embargo, gracias a los bordes redondeados, los colores apropiados, el relleno y el tamaño del elemento, logramos obtener un botón de eliminación con un aspecto bastante claro. Sin embargo, se ha añadido una propiedad más interesante aquí: `user-select`. Esto permite omitir el elemento dado al seleccionar. Gracias a esta propiedad, hacer doble clic en el texto de la nota no causará que se seleccione la letra `x` al final.

```css
li > div > span.delete {
    float: right;
    border: solid 1px crimson;
    border-radius: 50%;
    padding: 5px;
    width: 7px;
    height: 7px;
    line-height: 5px;
    color: crimson;
    cursor: pointer;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select:none;
    user-select:none;
}
```

## Lógica

Ahora discutiremos cómo agregar al proyecto la posibilidad de crear nuevas tareas, eliminarlas y mostrar las tareas guardadas en la base de datos. Si miras el `package.json`, verás las siguientes líneas:

```json
"dependencies": {
    "http-server": "^0.11.1",
    "json-server": "^0.12.1"
  }
```

El primero de estos paquetes es un servidor http que sirve nuestra aplicación en el puerto 8080. En este caso, el efecto es bastante similar al comando `php -S localhost:8080`, pero sin interpretar el script `php`.

El segundo paquete es un servidor REST que proporciona el guardado de datos en el archivo `db.json`. En el archivo `README.md` se encuentran los comandos para ejecutar estos servidores y las solicitudes que podemos hacer para comunicarnos con la API.

Puedes lograr esto escribiendo.:

```bash
npm init -y
npm add http-server json-server
```

Luego configura ambos servidores en terminales distintas. En la primera deberías ejecutar el servidor con nuestro proyecto.

```bash
node node_modules/http-server/bin/http-server
```

En la segunda terminal, abre el servidor `REST API` proporcionado por el paquete `json-server`.

```bash
echo '{"todo":[]}' > db.json
node node_modules/json-server/lib/bin.js --watch db.json
````

Para agregar una nueva tarea se necesita una solicitud POST.

Usaremos el programa de línea de comandos `httpie` para enviar solicitudes.

```bash
http POST localhost:3000/todo text="First One"
```

Para listar todas las tareas de la base de datos, debes enviar un GET.

```bash
http GET localhost:3000/todo
```

Para eliminar la tarea `n-ésima`, envía una solicitud DELETE indicando qué tarea debe ser eliminada en la URL.

```bash
http DELETE localhost:3000/todo/n
```

Nuestro estado inicial de `db.json` puede verse así:

```javascript
{
  "todo": [
    {
      "text": "First One",
      "id": 1
    },
    {
      "text": "Second todo",
      "id": 2
    },
    {
      "text": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.",
      "id": 5
    }
  ]
}
```

Ahora podemos hablar sobre la lógica de la aplicación ubicada en `app.js`. Antes de esto, necesitamos eliminar de `index.html` los elementos de lista de ejemplo. Me refiero a eliminar todo entre `<ul></ul>`. Estamos modificando `index.html` de esta manera ahora porque la responsabilidad de gestionar tareas se transfiere a `app.js`.

Todo el script está ubicado en una función anónima que se ejecuta después del evento `DOMContentLoaded`. Esto previene la ejecución del script antes de que se cargue el `DOM`.

```js
document.addEventListener('DOMContentLoaded',function () {

   // there should be placed code presented below

})
```

Dentro de esta función definimos variables que se utilizarán en el script. Hay `dbUrl` que contiene la dirección de la API que gestiona la base de datos. Y dos variables con referencia al formulario y la lista del `DOM`.

```js
const dbUrl = 'http://localhost:3000/todo';
let form = document.querySelector('form.todo');
let list = document.querySelector('ul');
```

Ahora es el momento de definir funciones útiles. Comenzamos con la función que descarga todas las tareas. Debido a que esta función envía una solicitud, debe esperar una respuesta. Pero la espera no puede bloquear el resto de la interfaz y otros scripts. Así que, mediante el método `then`, agregamos un oyente para recibir la respuesta de esta solicitud. Podemos decir que `then` se elimina a sí mismo del flujo sincrónico del programa y comienza a esperar la respuesta de manera independiente al resto del programa. Pero debido a que queremos recibir datos de la respuesta, necesitamos recibir la Promesa de obtener estos datos. La Promesa es un objeto que en el constructor acepta una función cuyo argumento es la función a la que debemos pasar los datos que nos interesan. Es complicado de describir, pero se ve muy bien en el siguiente código:

```js
function getAllTodos() {
        return new Promise(resolve => {
            fetch(new Request(dbUrl))
                .then(res => { return res.json(); })
                .then(data => { resolve(data); });
        });
    }
```

Pero `Promise` no es la única gran cosa que puedes ver en estas líneas. La siguiente es la función `fetch`. Es el sucesor de la interfaz `XMLHttpRequest`. Se diferencia de ella por una mejor sintaxis, un enfoque más moderno para la optimización de bajo nivel y soporte para la transmisión de datos. El argumento de la función `fetch` es el objeto `Request`. La solicitud más simple es una solicitud con el método `GET` a la dirección dada; este es nuestro caso. A esta función podemos adjuntar un listener de respuesta mediante `then`. El primer `then` se añade para esperar a obtener toda la respuesta y analizarla como `json`. El segundo resuelve el objeto `Promise` que devuelve los datos obtenidos de la respuesta.

El segundo método que definiremos permite guardar una tarea en la base de datos. En este caso, también usamos `Promise` de la misma manera que la última vez, pero ahora la solicitud es más complicada. Para aumentar la legibilidad del código, lo guardo en la variable temporal `req`. Podemos ver que la `URL` es la misma, pero en el segundo argumento del objeto `Request` tenemos su configuración adicional: método, objeto que contiene encabezados y cuerpo de la solicitud.

```js
function saveTodo(text) {
        let req = new Request(dbUrl,{ method: 'POST',
            headers: new Headers({'Content-Type': 'application/json'}),
            body: JSON.stringify({text: text})
        });

        return new Promise(resolve => {
            fetch(req)
                .then(res => { return res.json(); })
                .then(data => { resolve(data); });
        })
    }
```

La última función en este proyecto no tiene nada que ver con la interfaz `fetch` o el objeto `Promise`, pero presenta otra nueva característica de `ES6` - `template strings`. Estas son cadenas de caracteres rodeadas por comillas simples diagonales así “\`", que pueden contener la evaluación de expresiones de JavaScript designadas por la sintaxis `${}`. A esta función le pasamos un objeto con las propiedades `id` y `text`. La función renderiza el código `html` adecuado que se adjuntará a la lista. Es mucho más cómodo que usar `document.createElement()`.

```js
function appendTextToList(todo) {
        list.innerHTML += `
<li data-id="${todo.id}">
    <div class="list-elem-head">
        <span class="id">${todo.id}</span>
    </div>
    <div class="list-elem-body">
        <span class="text">${todo.text}</span>
        <span class="delete">x</span>
    </div>
</li>`;
    }
```

Después de definir estas funciones, podemos describir la parte ejecutiva del código. Comienza iterando sobre la lista de notas extraídas de `API` y agregándolas a la lista en la página.

```js
getAllTodos().then(todos => {
        todos.forEach(todo => { appendTextToList(todo); });
    });
```

Luego, agregamos un listener al formulario. Si agregas una entrada, la enviamos a la base de datos, y después de recibir el identificador, lo adjuntamos a la lista.

```js
form.addEventListener('submit', function (e) {
        e.preventDefault();
        saveTodo(form.task.value).then(res => {
            console.log(res);
            appendTextToList(res);
        });
        form.reset();
    });
```

Al final, estamos agregando un listener para los clics en la lista. Se supone que se trata solo de eliminar, así que utilizando el método `contains` en la lista de clases, verificamos si haces clic en el elemento con la clase `delete`. Si es así, extraemos el `id` de este elemento de la lista, enviamos la solicitud con el método `DELETE` a la url que termina con este id y lo eliminamos de la lista.

```js
list.addEventListener('click',function (e) {
        if(e.target.classList.contains('delete')) {
            const id = e.target.parentElement.parentElement.dataset.id;
            console.log(id);
            fetch(new Request(`${dbUrl}/${id}`,{ method: 'DELETE'}));
            document.querySelector(`li[data-id="${id}"]`).outerHTML = "";
        }
    })
```

## Resumen

Este diseño simple es excelente como una introducción a la programación en JavaScript. También hemos presentado elementos de CSS aquí, que muestran que no siempre es necesario utilizar bootstrap para obtener entradas y listas de aspecto atractivo. Si tienes alguna pregunta después de leer este texto, no dudes en hacerla en un comentario.
