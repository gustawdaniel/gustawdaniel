---
author: Daniel Gustaw
canonicalName: xss-attack-using-script-style-and-image
coverImage: http://localhost:8484/94f5cc49-c10e-49c3-ad37-095e876d51cb.avif
description: Aprende a infectar una página usando un ataque XSS con las etiquetas script, style o image. Puedes ver cómo reemplazar el contenido de la página con el tuyo incluso sin javascript.
excerpt: Aprende a infectar una página usando un ataque XSS con las etiquetas script, style o image. Puedes ver cómo reemplazar el contenido de la página con el tuyo incluso sin javascript.
publishDate: 2021-07-08 13:51:40+00:00
slug: es/xss-ataque-usando-script-estilo-e-imagen
tags:
- xss
- hacking
- attack
title: Ataque XSS utilizando estilo de script e imagen
updateDate: 2021-07-08 13:51:40+00:00
---

Este artículo describe ejemplos de ataques XSS. El uso de etiquetas de script es probablemente el caso más conocido, pero también hay otras posibilidades. Puedes cambiar el contenido del sitio web por tu cuenta usando una etiqueta de imagen o css puro.

Este es material educativo, y debes recordar que hackear es ilegal si te atrapan en el acto. :)

## Código del sitio web

Para presentar el ataque, creamos un sitio web simple basado en PHP. Me gusta separar la lógica y la vista en el código, pero por simplicidad y para minimizar el número de líneas de código, lo mezclamos y todo el código del sitio web se coloca en index.php. Para obtener el sitio web vulnerable, tiene que ser capaz de guardar texto del usuario en la base de datos y mostrarlo en pantalla sin filtrarlo.

Nuevamente, por el caso de simplicidad y claridad, abandonamos las mejores prácticas y usamos un archivo json en lugar de bases de datos. El primer archivo de nuestro proyecto es `db.json`.

> db.json

```json
["First comment","Second one"]
```

Para guardar los comentarios enviados usando un script PHP, haz lo siguiente:

> index.php

```php
<?php
$comments = json_decode(file_get_contents('db.json'));

if($_SERVER["REQUEST_METHOD"] === "POST") {
    $comments[] = $_POST["comment"];
    file_put_contents('db.json', json_encode($comments));
}
```

* Leer el contenido del archivo `db.json` y convertirlo en un array de PHP.
* Verificar si el usuario envía una solicitud mediante el método POST - significa enviar el formulario
* Si es así
* Agregar el comentario enviado por el usuario al array
* Sobrescribir el archivo `db.json` codificando en json el array con el nuevo comentario

Independientemente del método de solicitud, el script continúa y muestra el formulario y la lista de comentarios

> index.php

```php
echo '<form action="" method="post">
    <input type="text" name="comment">
    <input type="submit" value="send">
</form>
<ul>';

foreach ($comments as $comment) {
    echo "<li>".$comment."</li>";
}
echo '</ul>';
```

El sitio web creado se ve como el siguiente

![](http://localhost:8484/eb6cbfa1-de14-45e8-b5c0-aa9b8f33df89.avif)

Es completamente funcional, permite agregar un comentario, guardarlo en json y mostrar una lista de comentarios. Si los usuarios quieren agregar texto, no hackear, podría ser el final de nuestra aventura. Pero debemos asumir que al menos un usuario de un sitio web quiere hackearlo. :)

## ¿Cómo hackearlo?

Este flujo de datos - guardando en el servidor y mostrando en el cliente - hace posible un ataque XSS si el texto no se filtra adecuadamente. XSS significa scripting entre sitios y permite a los atacantes inyectar scripts del lado del cliente en páginas web vistas por otros usuarios.

El código ejecutable agregado es interpretado por el navegador, no por el servidor, así que no podemos conquistar el servidor con ello, pero podemos cambiar el comportamiento del cliente. Los beneficios ejemplares para los atacantes son los siguientes:

* robar cookies (de sesión) - tomar control sobre la (sesión iniciada) de la víctima
* cambio dinámico del contenido del sitio web
* habilitar un key logger en el navegador

El script puede ser almacenado en un servidor o incluido en el enlace. En nuestro caso, queremos guardar el script en un archivo json escribiendo comentarios. Nos interesa cambiar el contenido del sitio web a "Hackeado por Daniel". En cualquier caso del método de ataque presentado a continuación, el sitio web se verá así:

![](http://localhost:8484/f24230e5-22d7-472d-b782-03adbba46806.avif)

### Script

La forma más sencilla es agregar un script que cambie dinámicamente su contenido a lo requerido después de que se cargue sile. Intenta agregar un comentario:

```html
<script>document.querySelector('html').innerHTML="Hacked By Daniel"</script>
```

Este código selecciona `html` - significa toda la página, y cambia su contenido usando la propiedad `innerHTML`.

### Estilo

Otro método funciona incluso si las etiquetas de javascript están eliminadas y javascript está deshabilitado en el navegador.

```html
<style>html::before {content: "Hacked By Daniel";} body {display: none;}</style>
```

Definimos dos reglas para el estilo de un sitio web. La primera dice al navegador que añada el texto `Hacked By Daniel` antes del cuerpo de un sitio web. La segunda es que no se muestre el cuerpo.

### Imagen

Por supuesto, si bloqueamos la etiqueta `script` y la etiqueta `style` en nuestros comentarios no es suficiente, porque también podemos ejecutar el script en otras etiquetas.

```html
<img src=undefined onerror='document.querySelector("html").innerHTML="Hacked By Daniel"'>
```

Este es un ejemplo de una imagen que tiene una dirección inválida. Si la dirección es inválida, el navegador ejecuta el script que es el valor del atributo `onerror`.

## ¿Cómo defenderse?

Para defenderse de este ataque necesitamos filtrar los comentarios de nuestros usuarios y eliminar las etiquetas HTML. Podemos hacerlo cambiando el código en `index.php` como se muestra a continuación.

```diff
-      $comments[] = $_POST["comment"];
+      $comments[] = htmlspecialchars($_POST["comment"]);
```

Después de aplicar este texto fijo, el texto escrito en el formulario se mostrará en las listas de comentarios exactamente igual al texto escrito por el usuario, y no se interpretará como etiqueta HTML.

![](http://localhost:8484/42fe0eac-c6c6-4f93-b66e-bf2b68eb74fb.avif)

## Resumen

Mostramos ejemplos simples de ataques XSS. Si usas un framework como Symfony, entonces el framework tiene un mecanismo de seguridad integrado en su estructura, pero debes recordar la función `htmlspecialchars` si escribes en PHP puro.
