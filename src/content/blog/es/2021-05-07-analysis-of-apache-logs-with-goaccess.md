---
author: Daniel Gustaw
canonicalName: analysis-of-apache-logs-with-goaccess
coverImage: http://localhost:8484/f88a3ede-db3f-4b7c-aa56-62ee4b914bd8.avif
description: En esta publicación, muestro una herramienta que permite extraer información interesante de archivos generados automáticamente durante el funcionamiento del servidor.
excerpt: En esta publicación, muestro una herramienta que permite extraer información interesante de archivos generados automáticamente durante el funcionamiento del servidor.
publishDate: 2021-05-07 20:26:00+00:00
slug: es/analisis-de-registros-apache-con-goaccess
tags:
- spa
- mustache
- log
title: Análisis de registros de Apache con GoAccess
updateDate: 2021-07-18 18:21:38+00:00
---

Estructura del código

```
PHP 32.9% HTML 22.6% JavaScript 20.5% Shell 18.5% CSS 5.5%
```

## Instalación de GoAccess

GoAccess está adaptado para funcionar en muchos sistemas con varios tipos de registros. Asumo que tenemos `arch linux` y un servidor Apache2. En este caso, utilizaremos los siguientes comandos para [instalar GoAccess](https://goaccess.io/download):

```bash
yay -S goaccess
```

La configuración implica eliminar comentarios del archivo de configuración `/etc/goaccess.conf` en las líneas que contienen entradas:

```bash
time-format %H:%M:%S
date-format %d/%b/%Y
log-format %h %^[%d:%t %^] "%r" %s %b "%R" "%u"
```

Ahora necesitas descargar el repositorio desde GitHub.

```bash
git clone https://github.com/gustawdaniel/Apache-Log-Analysis-Admin-Panel.git
```

Estamos creando nuestra propia configuración para este proyecto. Como de costumbre, utilizaremos el archivo `yml`.

> config/parameters.yml

```yml
config:
  apache: /var/log/apache2/*access.log
  report: report
security:
  user: user
  pass: pass
  authorization: api
```

La propiedad `apache` es una colección de todos los archivos de registro de acceso para dominios individuales que mantenemos en el servidor. El sufijo `access.log` está relacionado con la convención que adopté, según la cual redirijo todos los registros de acceso a los archivos `domain_access.log` en la configuración del dominio. Por otro lado, `report` es la ubicación donde guardaremos los resultados del análisis.

Finalmente, ejecutamos el script de instalación.

```
bash install.sh
```

El proyecto debería ser accesible en el navegador en `http://localhost:8000`.

## Análisis de registros

Nuestro objetivo ahora es usar la herramienta `GoAccess` para procesar todos los registros en archivos html.

Para leer el archivo de configuración en bash, utilizaremos una función escrita por [Piotr Kuczyński](https://gist.github.com/pkuczynski/8665367).

> lib/parse\_yml.sh

```bash
#!/usr/bin/env bash

parse_yaml() {
   local prefix=$2
   local s='[[:space:]]*' w='[a-zA-Z0-9_]*' fs=$(echo @|tr @ '\034')
   sed -ne "s|^\($s\)\($w\)$s:$s\"\(.*\)\"$s\$|\1$fs\2$fs\3|p" \
        -e "s|^\($s\)\($w\)$s:$s\(.*\)$s\$|\1$fs\2$fs\3|p"  $1 |
   awk -F$fs '{
      indent = length($1)/2;
      vname[indent] = $2;
      for (i in vname) {if (i > indent) {delete vname[i]}}
      if (length($3) > 0) {
         vn=""; for (i=0; i<indent; i++) {vn=(vn)(vname[i])("_")}
         printf("%s%s%s=\"%s\"\n", "'$prefix'",vn, $2, $3);
      }
   }'
}
```

Esta función toma dos parámetros, el primero es el nombre del archivo a analizar, el segundo es el prefijo para los nombres asignados dentro de nuestro script a los parámetros extraídos del archivo `yml`. Su uso se ilustra a continuación.

```bash
#!/usr/bin/env bash

# include parse_yaml function
. lib/parse_yaml.sh

# read yaml file
eval $(parse_yaml config/parameters.yml "parameters_")

mkdir -p $parameters_config_report $parameters_config_report/html $parameters_config_report/json

arr=();

# loop over apache logs
for file in $parameters_config_apache
do
  out=$(basename "$file" .log)
  out=${out%_access}

  if [ ! -s $file ];
  then
    continue;
  fi

  echo "Processed: "$out;
  goaccess -f $file -a -o $parameters_config_report/html/$out.html;
  goaccess -f $file -a -o $parameters_config_report/json/$out.json;

  arr+=($out);
done

jq -n --arg inarr "${arr[*]}" '{ list: $inarr | split(" ") }' > $parameters_config_report/list.json
```

En este script, secuencialmente: incluimos la función anterior, cargamos la configuración en variables. Luego creamos directorios donde deben ubicarse los resultados del análisis de logs, inicializamos un array y recorremos todos los archivos de logs. En este bucle, extraemos el nombre base del archivo. Si contiene `_access` en su nombre, lo recortamos, omitimos archivos vacíos y ejecutamos el programa goaccess en los logs que crea archivos `html` listos para mostrar en el directorio especificado en la configuración. Finalmente, agregamos el nombre del archivo procesado al array.

Después de completar el bucle, convertimos la lista de nombres procesados a formato `json` y lo guardamos junto con los informes. Con esta lista, no necesitaremos recorrer el directorio en `php`. Antes de ejecutar este script, es posible que necesites instalar jq. Es muy simple:

```bash
apt-get install jq

```

## Backend

Tenemos los registros listos, ahora crearemos una API que los hará disponibles. No queremos mantenerlos en una ubicación accesible desde el nivel del navegador. El navegador solo tendrá acceso al directorio `web`, y por eso colocaremos el archivo `api.php` allí. Dado que necesitaremos acceso a la configuración, también instalaremos un analizador `yml`.

```bash
composer require symfony/yaml

```

El archivo de la API es principalmente de enrutamiento. Sin embargo, comienza con la conexión de paquetes, la configuración de variables y encabezados:

> web/api.php

```php
<?php

require_once __DIR__."/../vendor/autoload.php";
use Symfony\Component\Yaml\Yaml;

$config = Yaml::parse(file_get_contents(__DIR__.'/../config/parameters.yml'));

session_start();

$uri = explode('/', strtolower(substr($_SERVER['REQUEST_URI'], 1)));
$route = isset($uri[1]) ? $uri[1] : "";
$parameter = isset($uri[2]) ? $uri[2] : "";

$data = array();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST");
header('Content-Type: application/json');

```

Adjuntando la configuración de esta manera [ya ha sido discutido](https://gustawdaniel.com/posts/es/tesseract-ocr-y-selectores-de-pruebas/#contexto). La novedad es establecer la sesión. Esta es una función tan inteligente que crea una cookie con un número de sesión aleatorio para el usuario y simultáneamente guarda este número en el lado del servidor, para que se pueda referir a este número específico en la variable `$_SESSION` sin tener que verificar la cookie manualmente o preocuparse por el hecho de que.

La novedad es dividir la dirección `uri` en un array utilizando los caracteres `/`. Su primer elemento tendrá el valor `api.php`, por lo que capturamos los siguientes dos si existen. Establecemos un array vacío `data` para nosotros y finalmente agregamos encabezados que permiten eludir problemas de CORS y establecer el tipo de dato de retorno predeterminado.

En Symfony, hay clases especiales `Response` y `JsonResponse` que facilitan devolver respuestas; sin embargo, aquí utilizaremos un método más primitivo debido a su simplicidad. Definiremos una función para devolver errores.

```php
function returnError($code,$type,$message){
    $data["error"] = ["code" => $code, "type" => $type, "message" => $message];
    echo json_encode($data);
    die();
}

```

Vale la pena notar que devuelve códigos de error, pero siempre tiene un código igual a 200. Las excepciones serán errores del lado del servidor que no capturaré. Solo en tal caso quiero devolver un código de error. Es hora de comenzar a discutir el enrutamiento. Comenzaremos con la ruta para validar el inicio de sesión. En `Symfony`, no es `login`, sino `login_check`.

```php
switch ($route) {
        case "login": {

            if(!isset($_POST["user"]) || !isset($_POST["pass"])) {
                returnError(400,"Bad Request","Invalid form");
            } elseif($_POST["user"]!=$config["security"]["user"] || $_POST["pass"]!=$config["security"]["pass"]) {
                returnError(403,"Forbidden","Incorrect Login or Password");
            }

            $_SESSION['user'] = $config["security"]["user"];
            $data = ["state" => "loggedIn"];

        }

```

Nuestro interruptor acepta una ruta ingresada después de `api.php/` pero antes del siguiente carácter `/`. En esta parte del código, abordamos el caso cuando la dirección de la solicitud contenía `login`. Dado que usamos el método `$_POST` para iniciar sesión, el controlador en esta ruta verifica si se han enviado las variables `user` y `pass` y si coinciden con las establecidas en la configuración. Si la validación de datos es exitosa, se creará una variable `$_SESSION['user']`, y se agregará el estado que confirma el inicio de sesión a la lista de datos devueltos en la respuesta.

Tenga en cuenta que no añadí la declaración `break;` al final. Hice esto intencionadamente. Inmediatamente después de iniciar sesión, sin enviar otra solicitud, siempre quiero recibir una lista de dominios para los cuales Apache crea registros. Por lo tanto, coloqué un bloque `report` debajo del bloque `login`, que está destinado a ejecutarse tanto cuando se selecciona la ruta `report` como después de que el usuario haya iniciado sesión correctamente. Sin embargo, dado que quiero acceder a esta ruta a través de la `API` omitiendo el inicio de sesión por formulario, verificaré los derechos de acceso con la siguiente condición antes de recuperar los datos necesarios:

```php
        case "report": {

            if(
                (!isset($_SESSION['user'])
                    ||!$_SESSION['user'])
                &&(!isset(getallheaders()["Authorization"])
                    ||getallheaders()["Authorization"]!=$config["security"]["authorization"]
                )
            ){
                returnError(403,"Forbidden","Incorrect Login or Password");
            }

```

Además de verificar si la sesión está establecida, también verificamos el encabezado `Authorization` aquí como un método de inicio de sesión alternativo. Si al menos uno de los métodos de inicio de sesión (sesión o encabezado) se considera válido, se ejecutará el siguiente código:

```php
            $data["report"] = [];

            $list = json_decode(file_get_contents(__DIR__ . "/../" . $config["config"]["report"] . "/list.json"));

            foreach ($list->list as $key => $value) {
                $data["report"][] = ["name" => $value, "key" => $key, "link" => "api.php/report/" . $value];
            };

```

Creamos la clave `report` para el array de respuesta. Leímos y decodificamos la lista de nombres de archivos con los registros de Apache procesados generados por el script `build.sh`. Luego, en un bucle, ampliamos la estructura de cada elemento en esta lista con los atributos `key` y `link`, y asignamos el nombre en sí a la clave `name`. Esta transformación está destinada a facilitar un procesamiento más sencillo de estos datos por parte del front-end que hemos desarrollado.

Sin embargo, la funcionalidad principal no es mostrar los nombres de los archivos en sí, sino su contenido. Este es un buen momento para familiarizarse con el mecanismo de `negociación de contenido`. Es una manera para que una API RESTful asigne una representación a la misma dirección `url` utilizando diferentes tipos de datos. En nuestro ejemplo, estos serán `html` y `json`. El tipo de dato que queremos recibir se establece en el encabezado `Accept` al preparar la solicitud. El siguiente código es responsable de la correcta interpretación de este encabezado.

```php
            if ($parameter != "") {
                if (preg_match('/text\/html/', $_SERVER["HTTP_ACCEPT"])) {
                    header('Content-Type: text/html');
                    echo file_get_contents(__DIR__ . "/../" . $config["config"]["report"] . "/html/" . $parameter . ".html");
                } elseif (preg_match('/application\/json|\*\/\*/', $_SERVER["HTTP_ACCEPT"])) {
                    header('Content-Type: application/json');
                    echo file_get_contents(__DIR__ . "/../" . $config["config"]["report"] . "/json/" . $parameter . ".json");
                } else {
                    returnError(415,"Unsupported Media Type","Incorrect Content Type");
                }
                die();
            }
            break;
        }

```

Se ejecutará solo si la `url` contiene algo después de `api.php/report/`. Esta última parte se guardó en la variable `$parameter` al principio del script al dividir la `uri` en partes. Indica qué archivo necesitamos extraer, y se establece mediante la clave `link` del array `$data["report"]`. La función `preg_match` verifica si la expresión regular dada en el primer argumento aparece en la cadena del segundo argumento. Dependiendo de si se coincide con `text/html`, `application/json` o `*/*`, se devuelve `html` o `json`.

La última ruta manejada por la `api` es `logout`.

```php
        case "logout": {
            session_unset();
            session_destroy();
            $data = ["state" => "loggedOut"];
            break;
        }

```

Es responsable de eliminar la sesión y asignar el estado `loggedOut`. Finalmente, manejamos la excepción relacionada con la ruta incorrecta, en particular, este también es nuestro punto de partida `api.php/`

```php
        default: {
            returnError(404,"Not Found","Use route /report with Authorization header");
            break;
        }
    }

echo json_encode($data);

```

Después de ejecutar la instrucción `switch`, enviamos los datos que se recopilaron en el arreglo `$data` durante el procesamiento de la solicitud.

### Acceso a través de API

Para acceder a través de `API`, simplemente envía la siguiente solicitud:

```bash
http -v --pretty=all GET localhost:8000/api.php/report Authorization:api

```

![api](https://i.imgur.com/PEjG18F.png)

Recibimos una lista de archivos disponibles. Si queremos un archivo específico, ingresamos:

```bash
http -v --pretty=all GET localhost:8000/api.php/report/api_brainjinn Authorization:api

```

![api2](https://i.imgur.com/8p3nHB7.png)

## Frontend

La separación del frontend del backend ha sido de gran interés para mí durante algún tiempo. Me gustaron las formas de ver la organización del código en frameworks como `aurelia` y `angular`. Sin embargo, no nos pasemos de la raya. No vamos a sacar un cañón para matar una mosca y no usaremos ninguno de ellos aquí.

Solo establecí una condición para mi frontend: debe ser una aplicación de una sola página que maneje correctamente el inicio y cierre de sesión. También renuncié al uso de gulp, ya que complicaría innecesariamente este pequeño proyecto.

A pesar de esto, apliqué mecanismos de plantillas aquí y un enrutamiento muy primitivo basado en respuestas de `api` baratas o eventos en lugar de basarse en los fragmentos de URL.

Comenzaremos con la instalación de bibliotecas externas para el frontend. Estas serán `bootstrap 4` y `mustache 2.3`. Mientras que el primer paquete es generalmente bien conocido, encontré `mustache` por primera vez. Es el equivalente a `twig` pero ejecutado del lado del cliente en lugar de del servidor. Antes de comenzar la instalación, crearemos un archivo de configuración de bower:

> .bowerrc

```json
{
  "directory": "web/bower_components"
}

```

Indica instalar directamente en el directorio `web`. Esto está relacionado con el hecho de que al renunciar a `gulp`, desean tener paquetes listos para usar expuestos externamente. Les recuerdo que el navegador solo tiene acceso al directorio `web` en nuestra estructura de proyecto. Para instalar los paquetes, ejecutamos:

```bash
bower init
bower install --save bootstrap#v4.0.0-alpha.5
bower install --save mustache

```

Ahora pasaremos al punto de entrada de nuestra aplicación: el archivo `index.html`.

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Apache Log Analysis</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="bower_components/bootstrap/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="bower_components/tether/dist/css/tether.min.css">
    <link href="https://fonts.googleapis.com/css?family=Lato:300&subset=latin-ext" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

    <div id="content"></div>



    <script src="bower_components/jquery/dist/jquery.min.js"></script>
    <script src="bower_components/tether/dist/js/tether.min.js"></script>
    <script src="bower_components/bootstrap/dist/js/bootstrap.min.js"></script>
    <script src="bower_components/mustache.js/mustache.min.js"></script>

    <script src="js/site.js"></script>

    <script>
        var url = "/api.php/";
    </script>

    <script src="js/routing.js"></script>

</body>

```

Su estructura se asemeja un poco a la estructura de `index.html` de Aurelia o Angular. Es prácticamente un `html` vacío con estilos adjuntos, un div que sirve como punto de anclaje, y luego los scripts en sí. En términos de estilos, tenemos `bootstrap`, `tether` como su dependencia, la fuente `Lato` y nuestros estilos. Más adelante, hay espacio para el mencionado punto de anclaje. En el div con `id="content"`, nuestra aplicación se construirá dinámicamente. En cuanto a los scripts, adjuntamos `bootstrap` y `mustache` junto con las dependencias de `bootstrap`. El archivo `site.js` es nuestra biblioteca que contiene funciones comúnmente utilizadas. La variable global `url` ha sido expuesta en `index.html` porque no valía la pena crear un entorno de producción y desarrollo separado para esta única variable. Finalmente, se adjunta `routing.js`, que verifica si el usuario ha iniciado sesión y nos redirige a la página de inicio de sesión o muestra la lista de archivos de registro.

Sin embargo, más sobre eso más adelante, ahora repasaremos los adjuntos de `index.html` de arriba hacia abajo. Comenzaremos con estilos:

> web/css/style.css

```css
body {
    font-family: 'Lato', sans-serif;
}
.login-container {
    padding-top: 25vh;
}
.report-container {
    padding-top: 15vh;
}
.btn-login {
    background-color: #59B2E0;
    outline: none;
    color: #fff;
    font-size: 14px;
    height: auto;
    font-weight: normal;
    padding: 14px 0;
    text-transform: uppercase;
    border-color: #59B2E6;
}
.btn-login:hover,
.btn-login:focus {
    color: #fff;
    background-color: #53A3CD;
    border-color: #53A3CD;
}
.padding-b-10{
    padding-bottom: 10px;
}

```

Estilos como estilos. Nada especial. Agregamos una fuente, `padding` al `contenedor` principal, un botón de inicio de sesión personalizado y `padding` para mostrar la lista de archivos de registro. Los scripts son más interesantes, aquí está nuestra biblioteca con funciones útiles:

> web/js/site.js

```js
function getFormData($form){
    var unindexed_array = $form.serializeArray();
    var indexed_array = {};

    $.map(unindexed_array, function(n, i){
        indexed_array[n['name']] = n['value'];
    });

    return indexed_array;
}

```

El primero de estos se usa para convertir un formulario a un formato `json` que es más intuitivo que lo que ofrece `serializeArray`, a la vez que es mucho más elegante que lo que hace `serialize`.

```js
function deleteAllCookies() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

```

La segunda función es responsable de borrar cookies. Curiosamente, no se pueden simplemente eliminar, pero su fecha de caducidad se puede establecer en varias décadas atrás.

```js
function loadComponent(name,data){
    $.get("component/"+name+"/"+name+".html").done(function(template){
        var html = Mustache.render(template, data);
        $("#content").html(html);
        $.getScript("component/"+name+"/"+name+".js")
    });
}

```

La última función se adapta mejor a nuestra estructura de directorios y contenido, así que antes de discutirla, mencionaré la estructura de directorios. En `web`, además de los obvios `js`, `css`, `bower_components`, también tenemos el directorio `component`. El nombre tomado de Angular indica que dentro encontraremos scripts y plantillas correspondientes a una funcionalidad específica. Esta es una intuición correcta, así que en `component` tenemos el directorio `login` con los archivos `login.html` y `login.js`, y el directorio `report` con los archivos `report.html` y `report.js`. Esta función es responsable de obtener el archivo `html` del componente utilizando el método `GET`, renderizándolo con la biblioteca `mustache`, que inyecta los datos contenidos en la variable `data`. Luego, este archivo se une a nuestro punto de anclaje en `index.html`, y cuando eso sucede, se le proporcionan scripts. Un mecanismo hermoso en su simplicidad, y es el corazón de todo el front-end. Es gracias a este método que el front-end vive y cambia de vistas sin recargar la página.

Sin embargo, esta función no se llamará por sí sola. Mencioné el enrutamiento primitivo. Administra lo que veremos cuando se carga la página:

> web/js/routing.js

```js
$.get(url+"report").done(function(data){
    //console.log(data);
    if(data.hasOwnProperty('report')){
        loadComponent("report",data);
    } else {
        loadComponent("login",{});
    }
});

```

### Componentes

Su funcionamiento consiste en intentar recuperar contenido reservado para usuarios registrados. No quería devolver un código de error `403` aquí, porque realmente no es un error. Es bastante normal que a veces no estemos registrados. Gracias a esto, incluso si el usuario no tiene acceso a estos recursos, utilizo el método `done`. Por supuesto, si no estamos registrados, la respuesta no contendrá la clave `report` sino `error`. En este caso, el `login` se cargará con un array de datos vacío. Sin embargo, si la sesión se crea y el usuario está correctamente registrado, cargamos el componente `report` y le pasamos los datos recibidos del servidor.

Solo nos quedan 4 archivos por discutir de los componentes. Comenzaremos con la plantilla de inicio de sesión:

> web/component/login/login.html

```html
<div class="container login-container">
    <div class="row">
        <div class="offset-lg-3 col-lg-6 col-md-12 col-sm-12 col-xs-12">
            <div class="card card-block text-xs-center">
                <h4 class="card-title">Apache Log Analysis</h4>
                <div class="card-block">
                    <form id="login-form">
                        <div class="form-group">
                            <input type="text" name="user" tabindex="1" class="form-control" placeholder="Username" value="">
                        </div>
                        <div class="form-group">
                            <input type="password" name="pass" tabindex="2" class="form-control" placeholder="Password">
                        </div>
                        <div class="form-group">
                            <input type="submit" name="login-submit" id="login-submit" tabindex="4" class="form-control btn btn-login" value="Log In">
                        </div>
                    </form>
                    <div id="login-error"></div>
                </div>
            </div>
        </div>
    </div>
</div>

```

Formulario simple con dos campos y un div para posibles errores. Se ve así:

![login](https://i.imgur.com/yRTGig4.png)

El script que lo soporta es un ejemplo de libro de texto de manejo de formularios en js.

```js
    var form = document.getElementById("login-form");
    var error = document.getElementById("login-error");


    form.addEventListener("submit", function (e) {
        e.preventDefault();
        //console.log(JSON.stringify(getFormData($(this))));
        $.post(url + 'login', getFormData($(this))).done(function (data) {
            //console.log("s",data);
            if (data.hasOwnProperty('error')) {
                //console.log("error_detected");
                error.innerHTML = '<div class="alert alert-danger">' + data.error.message + '</div>';
            } else if (data.hasOwnProperty('state')) {
                if (data.state == "loggedIn") {
                    loadComponent("report", data);
                }
            }
        }).fail(function (data) {
            error.innerHTML = '<div class="alert alert-danger">' + 'There are unidentified problems with service.' + '</div>';
            //console.log(data);
        });
        return false;

    });

```

Elementos de seguimiento. Agregando un oyente. Al intentar enviar, enviamos un `POST` con el contenido del formulario. El manejo de errores para `4xx` está en `done` y no en `fail`. En caso de éxito, cargamos el `reporte`. Finalmente, manejamos errores `5xx` con `fail`.

La vista del informe es más interesante, ya que `mustache` crea un bucle aquí.

> web/component/report/report.html

```html
<div class="container report-container">
    <div class="row">
        <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <div class="card card-block text-xs-center">
                <h4 class="card-title">Apache Log Analysis</h4>
                <div class="card-block">
                    <ul class="list-group row">
                        {{ "{{ #report " }}}}
                        <div class="col-sm-6 col-md-4 col-lg-3 padding-b-10">
                        <a target="_blank" href="{{link}}" class="list-group-item ">{{ "{{ #name " }}}}</a>
                        </div>
                        {{ "{{ /report " }}}}
                    </ul>
                </div>
                <div class="card-block">
                    <button id="logout" class="btn btn-danger btn-block">Logout</button>
                </div>
            </div>
        </div>
    </div>
</div>

```

El bucle sobre el array `report` muestra todos los elementos de la lista, adjuntando nombres y enlaces a ellos. Para mis registros, se ve así:

![report](https://i.imgur.com/1Bb5BVf.png)

El script solo cierra sesión aquí, y por eso es bastante corto: 

> web/component/report/report.js

```js
    var logout = document.getElementById("logout");

    logout.addEventListener("click", function () {
        deleteAllCookies();
        $.get(url + "logout");
        loadComponent("login", {});
    });

```

Al final, también proporcionaré una captura de pantalla de un análisis de registro de muestra. Esta es la imagen que veremos después de seleccionar uno de los archivos desde la vista de `informe`. En este caso, estos son los registros de este blog.

![log](https://i.imgur.com/n3sleEF.png)

## Despliegue

Una técnica que me gusta mucho, pero que aún no he descrito, para desplegar un proyecto en producción es usar [git](https://www.digitalocean.com/community/tutorials/how-to-set-up-automatic-deployment-with-git-with-a-vps). Git nos permite enviar solo los archivos esenciales, y podemos instalar bibliotecas externas directamente desde el entorno de producción. Para que esto funcione, necesitamos agregar la ubicación del repositorio en nuestro servidor a la colección local de repositorios remotos.

Asumimos que iniciamos sesión como un usuario llamado `root` y que la `ip` de nuestro servidor está en la variable `$ip_gs`. El repositorio del proyecto en el servidor se mantendrá en el directorio `/var/repo/log_analysis`.

```
git remote add live ssh://root@$ip_gs/var/repo/log_analysis

```

En el servidor, ejecutamos comandos:

```
mkdir -p /var/repo/log_analysis && cd /var/repo/log_analysis
git init --bare

```

A continuación, creamos el archivo `post-receive` en el directorio `hooks` y guardamos el siguiente contenido en él:

> /var/repo/log\_analysis/hooks/post-receive

```bash
#!/bin/sh
WORK_TREE=/var/www/log_analysis
GIT_DIR=/var/repo/log_analysis

git --work-tree=$WORK_TREE --git-dir=$GIT_DIR checkout -f
exit

```

Finalmente, establecemos permisos `chmod a+x post-receive` y creamos un directorio donde se ubicarán los archivos del proyecto.

```bash
mkdir -p /var/www/log_analysis

```

Regresamos a la máquina local y empujamos el repositorio al servidor.

```
git push live master

```

Regresamos al servidor y configuramos la configuración de producción en el archivo `/var/www/log_analysis/config/parameters.yml`. El objetivo aquí es no dejar al usuario `user` con la contraseña `pass` en producción. La forma más sencilla será copiar el archivo `/var/www/log_analysis/config/parameters.yml.dist` y cambiar los valores bajo la clave `security`.

La instalación consiste en ejecutar cuatro comandos:

```
apt-get install jq
composer install
bower install
bash build.sh

```

Ahora nuestra tarea es conectar la web a uno de los dominios o puertos. Para nosotros, será el puerto 8001. Añadiremos un listener en este puerto a Apache añadiendo la línea apropiada a la configuración:

> /etc/apache2/ports.conf

```
# log analysis
Listen 8001

```

Agregamos un archivo al directorio `sites-available`:

> /etc/apache2/sites-available/log\_analysis.conf

```
<VirtualHost *:8001>
    DocumentRoot /var/www/log_analysis/web

    ErrorLog /var/log/apache2/log_analysis_error.log
    CustomLog /var/log/apache2/log_analysis_access.log combined
</VirtualHost>

```

Lo vinculamos simbólicamente con `sites-enabled` utilizando el comando:

```
a2ensite log_analysis.conf

```

Recargando Apache

```
service apache2 reload

```

El servicio debería funcionar, pero querían automatizar el proceso de actualización de las vistas de los registros procesados.

### Cron

Hay diferentes enfoques posibles. El primero es construir vistas al inicio de cada sesión. El segundo es construir solo la vista que estamos consultando actualmente. El tercero es construir todas las vistas diariamente y no sobrecargar al usuario con la espera.

Dado que la puntualidad de los registros con precisión horaria no es un valor más grande para mí que unos pocos segundos de espera para que se cargue la vista, decidí crear todas las vistas cíclicamente cada día.

Para lograr esto, basta con crear un archivo:

> /etc/cron.daily/log\_analysis

```bash
#!/bin/bash

cd /var/www/log_analysis/
bash build.sh

```

y otorgarle permisos de ejecución:

```bash
chmod a+x /etc/cron.daily/log_analysis

```

Los registros de Apache son una fuente valiosa de información. Aunque no tienen las capacidades de medición de los scripts instalados en el sitio (mapas de calor, tiempo de actividad, seguimiento de eventos), el hecho de que se recojan automáticamente significa que se pueden utilizar sin ninguna carga adicional en el sitio.

Háganme saber en los comentarios si este proyecto les ha sido útil, o si tienen alguna idea de cómo podría mejorarse.
