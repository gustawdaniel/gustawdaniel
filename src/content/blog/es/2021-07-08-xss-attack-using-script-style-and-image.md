---
author: Daniel Gustaw
canonicalName: xss-attack-using-script-style-and-image
coverImage: https://preciselab.fra1.digitaloceanspaces.com/blog/img/7c750097-483e-409c-adba-7c3f66821283.avif
description: Aprende a infectar una página usando un ataque XSS con las etiquetas script, style o image. Mira cómo reemplazar el contenido de la página con el tuyo incluso sin JavaScript.
excerpt: Aprende a infectar una página usando un ataque XSS con las etiquetas script, style o image. Mira cómo reemplazar el contenido de la página con el tuyo incluso sin JavaScript.
publishDate: 2018-02-20 13:51:40+00:00
slug: es/xss-ataque-usando-script-estilo-e-imagen
tags:
- xss
- hacking
- attack
title: Ataque XSS utilizando etiquetas script, style e imagen
updateDate: 2021-07-08 13:51:40+00:00
---

Este artículo describe ejemplos de ataques XSS. El uso de etiquetas `<script>` es probablemente el caso más conocido, pero existen otras posibilidades. Puedes cambiar el contenido de un sitio web usando una etiqueta `<img>` o CSS puro.

Este es material educativo. ¡Recuerda que hackear sin autorización es ilegal! :)

## Código del sitio web

Para presentar el ataque, creamos un sitio web simple basado en PHP. Aunque la mejor práctica es separar la lógica de la vista, por simplicidad y para minimizar el número de líneas de código las combinamos en un solo archivo: `index.php`. Para crear un sitio web vulnerable, este debe guardar la entrada del usuario y mostrarla en pantalla sin filtrarla.

Por simplicidad, prescindimos de una base de datos y utilizamos un archivo JSON. El primer archivo de nuestro proyecto es `db.json`:

> db.json

```json
["First comment","Second one"]
```

Para guardar los comentarios enviados a través del script PHP:

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
* Verificar si el usuario envía una solicitud mediante el método POST (envío del formulario).
* Si es así:
  * Agregar el comentario enviado por el usuario al array.
  * Sobrescribir el archivo `db.json` guardando el array actualizado en formato JSON.

Independientemente del método de solicitud, el script muestra el formulario y la lista de comentarios:

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

Puedes iniciar el servidor local con el comando:

```bash
php -S localhost:8000
```

El sitio web creado se ve de la siguiente manera:

![](https://preciselab.fra1.digitaloceanspaces.com/blog/img/eb6cbfa1-de14-45e8-b5c0-aa9b8f33df89.avif)

Es completamente funcional: permite agregar un comentario, guardarlo en JSON y mostrar la lista de comentarios. Si los usuarios solo quisieran agregar texto normal, aquí terminaría nuestra historia. Pero debemos asumir que al menos un usuario intentará atacar el sitio. :)

## ¿Cómo hackearlo?

Este flujo de datos (guardar en el servidor y mostrar en el cliente) permite un ataque XSS si el texto no se filtra adecuadamente. XSS (Cross-Site Scripting) permite a los atacantes inyectar scripts del lado del cliente en páginas web vistas por otros usuarios.

El código ejecutable inyectado es interpretado por el navegador, no por el servidor. Por lo tanto, no tomamos el control del servidor, pero sí podemos manipular el comportamiento del cliente. Los beneficios potenciales para el atacante incluyen:

* Robar cookies de sesión – tomar el control de la sesión iniciada de la víctima.
* Cambio dinámico del contenido de la página web.
* Habilitar un keylogger en el navegador.

El script puede estar almacenado en el servidor o incluirse en un enlace. En nuestro caso, queremos guardar el script en el archivo `db.json` enviándolo a través del formulario de comentarios. Queremos cambiar el contenido del sitio web a "Hacked by Daniel". En cualquiera de los métodos presentados a continuación, el sitio web terminará viéndose así:

![](https://preciselab.fra1.digitaloceanspaces.com/blog/img/f24230e5-22d7-472d-b782-03adbba46806.avif)

### Script

La forma más sencilla es agregar una etiqueta `<script>` que cambie dinámicamente el contenido de la página tras cargarse:

```html
<script>document.querySelector('html').innerHTML="Hacked By Daniel"</script>
```

Este código selecciona el elemento `html` raíz (toda la página) y reemplaza su contenido usando la propiedad `innerHTML`.

### Estilo

Otro método funciona incluso si las etiquetas `<script>` se eliminan y JavaScript está deshabilitado en el navegador:

```html
<style>html::before {content: "Hacked By Daniel";} body {display: none;}</style>
```

Definimos dos reglas CSS. La primera indica al navegador que añada el texto `Hacked By Daniel` antes del cuerpo del sitio web (`body`). La segunda oculta completamente el cuerpo de la página.

### Imagen

Bloquear las etiquetas `<script>` y `<style>` en los comentarios no es suficiente, ya que también se pueden ejecutar scripts a través de controladores de eventos en otras etiquetas HTML:

```html
<img src=undefined onerror='document.querySelector("html").innerHTML="Hacked By Daniel"'>
```

Este es un ejemplo de una imagen con una dirección inválida. Cuando la carga falla, el navegador ejecuta automáticamente el script dentro del atributo `onerror`.

## ¿Cómo defenderse?

Para defenderse de este ataque, debemos sanitizar los comentarios de los usuarios y escapar las etiquetas HTML. Podemos hacerlo modificando el código en `index.php`:

```diff
-      $comments[] = $_POST["comment"];
+      $comments[] = htmlspecialchars($_POST["comment"]);
```

Después de aplicar esta corrección, el texto ingresado en el formulario se mostrará literalmente como texto en la lista de comentarios, sin ser interpretado como etiqueta HTML:

![](https://preciselab.fra1.digitaloceanspaces.com/blog/img/42fe0eac-c6c6-4f93-b66e-bf2b68eb74fb.avif)

## Resumen

Mostramos ejemplos simples de ataques XSS utilizando diferentes etiquetas. Los frameworks modernos como Symfony o Laravel tienen mecanismos de seguridad integrados contra XSS, pero al escribir en PHP puro, siempre debes recordar usar funciones como `htmlspecialchars`.

