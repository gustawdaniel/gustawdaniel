---
author: Daniel Gustaw
canonicalName: data-logging-with-mysql-ajax-and-behat
coverImage: http://localhost:8484/8a528c93-b962-4ba4-b410-944fd27661e1.avif
description: Escribiremos una aplicación web simple - una calculadora. Usándola como ejemplo, mostraremos cómo configurar selenium con behat y realizar pruebas automatizadas en ella.
excerpt: Escribiremos una aplicación web simple - una calculadora. Usándola como ejemplo, mostraremos cómo configurar selenium con behat y realizar pruebas automatizadas en ella.
publishDate: 2021-04-26 20:03:00+00:00
slug: es/registro-de-datos-en-mysql-ajax-y-behat
tags:
- ajax
- mysql
- selenium
title: Registro de datos en MySql, Ajax y Behat
updateDate: 2021-06-21 16:39:24+00:00
---

## Descripción del Proyecto

Este es un proyecto que escribí mientras aprendía a usar una base de datos en PHP. Hace unos días, lo actualicé, añadí pruebas y decidí compartirlo.

En este artículo, aprenderás a **centralizar la configuración del proyecto**, **registrar eventos en el sitio en la base de datos** y **probar el sitio** utilizando selenium.

El código fuente consiste en:

```
PHP 43.2% Perl 19.8% HTML 19.6% Cucumber 7.4% JavaScript 6.5% CSS 3.5%
```

Después de escribir, el proyecto se verá así:

![](http://localhost:8484/0cd60295-e8e0-49fb-aa4b-a6a818262939.avif)

## Instalación

**¡Nota! Antes de ejecutar install.pl, asegúrate de que no tengas una base de datos llamada calc y chrome en sources.list. Los scripts de instalación en perl y bash no son largos; familiarízate con ellos antes de ejecutarlos.**

Recomiendo realizar la instalación del proyecto en una máquina virtual, p.ej.: `Lubuntu`.

Para instalar el proyecto, necesitas descargar el repositorio (en una ubicación donde no haya un directorio `calc`)

```
git clone https://github.com/gustawdaniel/calc
```

Ve al directorio `calc` e instala el software requerido. Antes de la instalación, revisa el archivo `install.sh` y comenta la adición del repositorio de chrome si ya lo tienes instalado.

```
cd calc && bash install.sh
```

Verifica los parámetros de conexión de tu base de datos para `mysql`. Si presionaste `enter` durante la instalación y no tenías instalado previamente el paquete `mysql-server`, puedes dejar los valores predeterminados. De lo contrario, ingresa los valores correctos en el archivo `config/parameters.yml` y elimínalo del repositorio.

```
git rm --cached config/parameters.yml
```

Para instalar la base de datos y iniciar el servidor php, ingrese el comando

```
perl install.pl
```

En la nueva terminal (`ctrl+n`), inicia el servidor de selenium.

```
selenium-standalone start
```

En el siguiente, puedes habilitar pruebas:

```
vendor/bin/behat
```

También puedes usar normalmente el sitio que está expuesto en el puerto 9000.

```
firefox localhost:9000
```

Si tienes los parámetros de conexión predeterminados a la base de datos, para ver el contenido de la base de datos escribe

```
sudo mysql -u root
use calc;
select * from log;

```

## Estructura de Base de Datos

Normalmente empiezo un proyecto con la base de datos. Coloco su instalación en el archivo `sql/main.sql`.

```sql
DROP   DATABASE IF     EXISTS database_name;
CREATE DATABASE IF NOT EXISTS database_name
    DEFAULT CHARACTER SET = 'utf8'
    DEFAULT COLLATE 'utf8_unicode_ci';

USE database_name;

CREATE TABLE log
(
    id      	  BIGINT UNSIGNED    		NOT NULL AUTO_INCREMENT PRIMARY KEY,
    time   		  DATETIME           		NOT NULL,
    a      		  DOUBLE					,
    b      		  DOUBLE					,
    button  	  ENUM('sum', 'diff')       ,
    useragent	  VARCHAR(255)
);

```

## Configuración

```yml
config:
    host: 'localhost'
    user: 'root'
    pass: ''
    base: 'calc'
    port: '3306'

```

Nos referiremos a ellos en el instalador escrito en Perl y en la clase responsable de guardar en la base de datos en PHP.

### Configuración en Perl

Escribiremos dos scripts - para crear y restablecer la base de datos. Usaremos la biblioteca `YAML::Tiny` para leer el archivo `parameters.yml`. El siguiente script:

Lee el archivo con parámetros en la variable `$yaml`.
Guarda todos los parámetros en las variables correspondientes.

> install.pl

```perl
#!/bin/perl

use YAML::Tiny;

use strict;
use warnings;

#
#       Config:
#

    my $yaml = YAML::Tiny->read( 'config/parameters.yml' );
    my $baseName  = $yaml->[0]->{config}->{base};
    my $user  = $yaml->[0]->{config}->{user};
    my $pass  = $yaml->[0]->{config}->{pass};
    my $host  = $yaml->[0]->{config}->{host};
    my $port  = $yaml->[0]->{config}->{port};

```

Crea variables con configuraciones de directorio. (Las instrucciones para crear la base de datos se encuentran en el archivo `main.sql`.)

```perl
#
#       Catalogs structure:
#

    my $build = "build/";
    my $sql = "sql/";
    my $mainSQL = "main.sql";


```

Abre un archivo con código `sql` y guarda el contenido en la variable `$content`.

```perl
#
#       Script:
#


#-----------------------------------------    Database   -------------#

#       Prepare catalog
    system('mkdir -p '.$build);

#       Read file with mysql
    my $content;
    open(my $fh, '<', $sql.$mainSQL) or die "cannot open file";
    {
        local $/;
        $content = <$fh>;
    }
    close($fh);

```

Reemplaza cada ocurrencia de la cadena `database_name` con el nombre del archivo `parameters.yml` y lo guarda.

```perl
#       Replace database name by name from config
    $content =~ s/database_name/$baseName/g;

#       Save file with correct db name
    open($fh, '>', $build.$mainSQL) or die "Could not open file' $!";
    {
        print $fh $content;
    }
    close $fh;

```

Otorga al usuario predeterminado el derecho a abrir la base de datos como root, crea la base de datos y inicia el servidor `php`.

```perl
#       Execute file
    my $passSting = ($pass eq "") ? "" : " -p ".$pass;
    system('sudo mysql -h '.$host.' -P '.$port.' -u '.$user.$passSting.' < '.$build.$mainSQL);

#       Start server
    system('cd web && php -S localhost:9000');


```

### Configuración en PHP

Para manejar el archivo de configuración en `php`, utilizaremos la biblioteca `"mustangostang/spyc": "^0.6.1"`. Solo se usará al conectar a la base de datos - en el archivo `php/DataBase.php`.

> php/DataBase.php

```php
<?php

require_once __DIR__."/../vendor/mustangostang/spyc/Spyc.php";

class DataBase
{

	...

		// config from yml
		$config = Spyc::YAMLLoad(__DIR__."/../config/parameters.yml")["config"];

		// connecting
		$mysqli = @new mysqli($config["host"], $config["user"], $config["pass"], $config["base"], $config["port"]);

	...

```

En la variable `$config`, se almacena un array con parámetros para conectarse a la base de datos. El principio de funcionamiento es el mismo que en el script anterior.

## Registro de Datos en la Base de Datos

En la sección sobre la estructura de la base de datos, mostramos qué registros contiene la única tabla que tenemos - `log`. Estos son `id`, `time`, `a`, `b`, `button` y `useragent`. `a` y `b` corresponden a los números ingresados por el usuario. `button` es la acción elegida, ya sea `sum` para la suma o `diff` para la diferencia. `useragent` contiene datos sobre el navegador.

Ahora mapearemos el registro de la base de datos en `php` como un objeto. Para ello, creamos una clase `Log` en el archivo `php/Log.php`

> php/Log.php

```php
<?php

class Log
{
    private $a;
    private $b;
    private $action;
    private $agent;

    /**
     * @return mixed
     */
    public function getC()
    {
        if($this->action=="sum"){
            return $this->a + $this->b;
        } elseif ($this->action=="diff") {
            return $this->a - $this->b;
        } else {
            return null;
        }
    }

   ...
}

```

Contiene todos los campos de la tabla, excepto el identificador y la marca de tiempo, que se asignan durante la escritura en la base de datos. Marqué todos los getters y setters de las propiedades de la clase con tres puntos. En la mayoría de los IDE, pueden generarse automáticamente, por ejemplo, en `PhpStorm` seleccionando `código->Generar...`. El método `getC` permite calcular el valor de suma o diferencia en el lado del servidor, que se utiliza más tarde en la interfaz `API`.

Ahora podemos presentar en su totalidad la mencionada clase `DataBase`, que se utilizó para guardar los datos recibidos de la página en la base de datos.

> php/DataBase.php

```php
<?php

require_once __DIR__."/Log.php";
require_once __DIR__."/../vendor/mustangostang/spyc/Spyc.php";

class DataBase
{
	function save(Log $log){

		$a = $log->getA();
		$b = $log->getB();
		$s = $log->getAction();
		$u = $log->getAgent();

		// config from yml
		$config = Spyc::YAMLLoad(__DIR__."/../config/parameters.yml")["config"];

		// connecting
		$mysqli = @new mysqli($config["host"], $config["user"], $config["pass"], $config["base"], $config["port"]);

		// test of connecting
		if ($mysqli -> connect_errno)
		{
			$code = $mysqli -> connect_errno;
			$mess = $mysqli -> connect_error;
			die("Failed to connect to MySQL: ($code) $mess\n");
		}

		// definition of query
		$query  = 'INSERT INTO log VALUES(NULL,NOW(),?,?,?,?);';

		// preparing
		$stmt = @$mysqli -> prepare($query);

		// test of preparing
		if(!$stmt)
		{
			$code = $mysqli -> errno;
			$mess = $mysqli -> error;
			$mysqli -> close();
			die("Failed to prepare statement: ($code) $mess\n");
		}

		// binding
		$bind = @$stmt -> bind_param("ddss", $a, $b, $s, $u);

		// test of binding
		if(!$bind)
		{
			$stmt   -> close();
			$mysqli -> close();
			die("Failed to bind param.\n");
		}

		// executing query
		$exec = @$stmt -> execute();

		// checking fails
		if(!$exec)
		{
			$stmt   -> close();
			$mysqli -> close();
			die("Failed to execute prepare statement.\n");
		}

		// clearing and disconnecting
		$stmt   -> close();
		$mysqli -> close();
	}
}

```

Esta clase no tiene propiedades, pero tiene un método - `save`. Este método toma un objeto `Log` y registra todas las propiedades de este objeto en la base de datos, agregando la hora también. La parte más interesante de esta clase - la obtención de la configuración se discutió anteriormente. El resto es solo una escritura regular en la base de datos.

Estas fueron clases, ahora es el momento del script de entrada del back-end de nuestra aplicación. Se encuentra en el archivo `web/api.php` y es responsable de interceptar correctamente la solicitud, obtener parámetros, pasarlos a la base de datos y devolver una respuesta que contenga el resultado de la operación.

```php
<?php

// error display
//ini_set('display_errors', 1);
//ini_set('display_startup_errors', 1);
//error_reporting(E_ALL);

require_once __DIR__."/../php/Log.php";
require_once __DIR__."/../php/DataBase.php";

// routing
if($_SERVER['REQUEST_METHOD']=="POST"
    && parse_url($_SERVER["REQUEST_URI"])["path"]=="/api.php/action"){

    // get data from request
    $log = new Log();
    $log->setA($_POST["a"]);
    $log->setB($_POST["b"]);
    $log->setAction($_POST["action"]);
    $log->setAgent($_SERVER['HTTP_USER_AGENT']);

    // connect to db and save data
    $db = new DataBase();
    $db->save($log);

    // send response
    header('Content-type: application/json');
    echo json_encode([
        "a"=>$log->getA(),
        "b"=>$log->getB(),
        "c"=>$log->getC(),
        "action"=>$log->getAction()
    ]);
}

```

### Pruebas de Api con httpie

Podemos probar nuestra `api` usando `httpie`. Comando

```
http -fv 127.0.0.1:9000/api.php/action a=1 b=2 action="sum"

```

debería producir la siguiente salida:

```http
POST /api.php/action HTTP/1.1
Accept: */*
Accept-Encoding: gzip, deflate
Connection: keep-alive
Content-Length: 18
Content-Type: application/x-www-form-urlencoded; charset=utf-8
Host: 127.0.0.1:9000
User-Agent: HTTPie/0.9.2

a=1&b=2&action=sum

HTTP/1.1 200 OK
Connection: close
Content-type: application/json
Host: 127.0.0.1:9000
X-Powered-By: PHP/7.0.8-0ubuntu0.16.04.3

{
    "a": "1",
    "action": "sum",
    "b": "2",
    "c": 3
}

```

## AJAX

Cuando tenemos una base de datos lista y scripts para manejarla, no hay nada que nos impida completar el proyecto escribiendo el front end. Asumimos que la instalación fue exitosa y `bower` instaló los paquetes necesarios - es decir, `"bootstrap": "v4.0.0-alpha.5"` en el directorio `web`. Dado que `jQuery` es una dependencia para `Bootstrap`, podemos usarlo al crear scripts.

Nuestro front end consiste en tres archivos: `web/index.html`, `web/css/style.css` y `web/js/site.js`. Aquí están:

> web/index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Php calculator logging requests into database.</title>

    <link rel="stylesheet" href="bower_components/bootstrap/dist/css/bootstrap.min.css">
    <link href="https://fonts.googleapis.com/css?family=Lato:300" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
  </head>
  <body>

    <section>
      <div class="container">
        <div class="row">
          <div class="offset-md-3 col-md-6">
            <div class="card text-xs-center">
              <div class="card-header">
                Set two numbers and chose calculation
              </div>
              <div class="card-block">
                <div class="form-group">
                  <input id="a" type="number" step="any" class="form-control">
                </div>
                <div class="form-group">
                  <input id="b" type="number" step="any" class="form-control">
                </div>

                <div class="form-group row submit-area">
                  <div class="col-xs-6">
                    <input class="btn btn-lg btn-block hidden-xs-down btn-primary" type="submit" value='Sum' name="sum">
                    <input class="btn btn-lg btn-block hidden-sm-up btn-primary" type="submit" value='+' name="sum">
                  </div>
                  <div class="col-xs-6">
                    <input class="btn btn-lg btn-block hidden-xs-down btn-danger" type="submit" value='Difference' name="diff">
                    <input class="btn btn-lg btn-block hidden-sm-up btn-danger" type="submit" value='-' name="diff">
                  </div>
                </div>
                <div class="form-group">
                  <input id="c" type="text" readonly step="any" class="form-control">
                </div>

              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>


    <nav class="navbar navbar-fixed-bottom navbar-light bg-faded">
      <a class="navbar-brand" href="README.html">Documentation</a>
      <a class="navbar-brand float-xs-right" href="http://gustawdaniel.pl">Daniel Gustaw</a>
    </nav>

    <script src="bower_components/jquery/dist/jquery.min.js"></script>
    <script src="js/site.js"></script>
  </body>
</html>

```

Archivo HTML estándar. Lo que es interesante es el uso de la clase `card` de `bootstrap 4` y el cambio de textos de los botones de nombres completos a los símbolos `+` y `-` en anchos de pantalla pequeños.

Aún más simples son los estilos de nuestro sitio web.

> web/css/style.css

```css
body {
    font-family: 'Lato', 'SansSerif', serif;
}

section {
    margin-top: 20vh;
}

```

Esto se debe a Bootstrap, que realmente puede replicar mucho como yo esperaría. Lo único que necesitamos es margen vertical y fuente.

La parte más interesante es JavaScript:

> web/js/site.js

```js
(function () {

    var submitArea = document.getElementsByClassName("submit-area")[0];
    var card = document.getElementsByClassName("card")[0];
    var a = document.getElementById("a");
    var b = document.getElementById("b");
    var c = document.getElementById("c");

    function round(value,dec=5) {
        return 1*(Math.round(value+"e+"+dec)+"e-"+dec);
    }

    submitArea.addEventListener('click',function (e) {
        if(e.target.name=='sum') {
            c.value = round((a.value*1) + (b.value*1));
        } else if(e.target.name=='diff') {
            c.value = a.value - b.value;
        }

        $.post("api.php/action", {a: a.value, b: b.value, c: c.value, action: e.target.getAttribute('name')}, function (data) {
            console.log(data);
        })
    });

})();

```

## Behat y Selenium

**Behat** es una herramienta para escribir pruebas de comportamiento automatizadas. Es la forma más natural para que los humanos prueben basándose en escenarios que pueden ocurrir al usar la aplicación. **Selenium** es un servidor que permite simular un navegador, equipado con una API de programación. Al combinar estas dos herramientas, ganamos la capacidad de escribir algo como un bot que visita nuestro sitio y realiza acciones específicas. Es el uso de esta herramienta que viste en el video al principio de la entrada.

Gracias al comando `vendor/bin/behat --init`, behat genera un archivo por defecto `features/bootstrap/FeatureContext.php`. Ampliaramos esta clase añadiendo `MinkContext`. Esta es una colección de traducciones entre el lenguaje natural `Gherkin` y las acciones realizadas por los controladores del navegador como `selenium`.

Mencioné que `Gherkin` es un lenguaje natural. En la [documentación oficial](https://github.com/cucumber/cucumber/wiki/Gherkin), se presenta de la siguiente manera:

> Gherkin es el lenguaje que Cucumber entiende. Es un Lenguaje Específico de Dominio, Legible por Negocios, que te permite describir el comportamiento del software sin detallar cómo se implementa ese comportamiento.

Además de esta extensión, añadiremos algunas funciones que faltan en `MinkContext`.

```php
<?php

use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\PyStringNode;
use Behat\Gherkin\Node\TableNode;
use Behat\MinkExtension\Context\MinkContext;

/**
 * Defines application features from the specific context.
 */
class FeatureContext extends MinkContext implements Context
{
    /**
     * Initializes context.
     *
     * Every scenario gets its own context instance.
     * You can also pass arbitrary arguments to the
     * context constructor through behat.yml.
     */
    public function __construct()
    {
    }

    /**
     * @param String $field
     * @param String $value
     * @Given I set :field as :value
     */
    public function iSetAs($field, $value)
    {
        $javascript = 'document.getElementById("'.$field.'").value='.$value;
        $this->getSession()->executeScript($javascript);
    }

    /**
     * @Then Result should be :value
     */
    public function resultShouldBe($value)
    {
        $javascript = 'document.getElementById("c").value';
        $realResult = $this->getSession()->evaluateScript($javascript);

        if ( $value !== $realResult) {
            throw new Exception(
                "Actual result is:\n" . $realResult
            );
        }
    }

    /**
     * @param String $number
     * @When I wait :number ms
     */
    public function iWaitMs($number)
    {
        $this->getSession()->wait($number);
    }

    /**
     * @param String $number
     * @When I wait :number ms for jQuery
     */
    public function iWaitMsForJQuery($number)
    {
        $this->getSession()->wait($number, '(0 === jQuery.active)');
    }
}

```

Estas funciones están configurando los valores del campo cuando no está en el formulario, comprobando la validez del resultado y esperando: normal, y permitiendo no esperar más tiempo si todas las solicitudes han sido ejecutadas.

Con el contexto preparado, podemos echar un vistazo al contenido del archivo que describe las pruebas

> features/calculation.feature

```gherkin
Feature: Executing calculations on the website
  In order to calculate sum or difference
  As an web browser
  I want to see result after pressing button

  @javascript
  Scenario Outline: Action on two numbers
    Given I am on the homepage
    And I set "a" as <a>
    And I set "b" as <b>
    When I press "<action>"
    And I wait 1000 ms for jQuery
    Then Result should be <result>

    Examples:
      | a      | b       | action | result |
      | 1      | 2       | sum    | 3      |
      | 3      | 6       | sum    | 9      |
      | 100    | 2000    | sum    | 2100   |
      | -1.5   | -3.1    | sum    | -4.6   |
      | 1.9990 | -0.0090 | sum    | 1.99   |
      | 1      | 2       | diff   | -1     |
      | -1     | -2      | diff   | 1      |
      | 1.001  | 2.001   | diff   | -1     |
      | 0.993  | 9.33    | diff   | -8.337 |
      | 12     | -12     | diff   | 24     |


```

Contiene un escenario que consiste en 6 pasos repetidos en 10 configuraciones. Estos pasos son cálculos típicos realizados en la página - establecer, `a`, `b`, seleccionar un botón, esperar el resultado y verificar su corrección.

Para que todo funcione correctamente, aún falta un archivo de configuración `behat`. Es `behat.yml`.

> behat.yml

```yml
default:
  extensions:
    Behat\MinkExtension:
      browser_name: chrome
      base_url:  'http://localhost:9000'
      sessions:
        default:
          goutte: ~
        selenium:
          selenium2: ~

```

Eso es todo. Si has seguido el código hasta este punto, conoces este proyecto al dedillo. Espero que hayas aprendido algo, y si ves áreas donde podría mejorar algo, no dudes en hacérmelo saber. Agradecería todos los comentarios constructivos.
