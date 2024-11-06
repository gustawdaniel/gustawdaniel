---
author: Daniel Gustaw
canonicalName: tesseract-ocr-and-selects-testing
coverImage: http://localhost:8484/a72114fa-b210-47be-bdd6-1b2fd232b6fd.avif
description: Leeremos el contenido de la tabla de la base de datos de la foto y escribiremos algunas pruebas para las consultas de la base de datos en Behat.
excerpt: Leeremos el contenido de la tabla de la base de datos de la foto y escribiremos algunas pruebas para las consultas de la base de datos en Behat.
publishDate: 2021-05-04 20:18:00+00:00
slug: es/tesseract-ocr-y-selectores-de-pruebas
tags:
- mysql
- behat
- perl
title: Tesseract-OCR y pruebas de selección.
updateDate: 2021-06-21 16:53:20+00:00
---

## Descripción del proyecto

Solo pretendía refrescar mis conocimientos sobre la escritura de consultas de bases de datos, pero terminé instalando `DataGrip` y `Tesseract`. El primer programa es un IDE para bases de datos de `JetBrains`, el segundo es un software de OCR - utilizado para reconocer texto en gráficos de trama.

Nuestra tarea será **crear esquemas de bases de datos**, **leer texto de archivos de imagen**, cargar el contenido leído, **escribir varias consultas**, y **probar el contenido** usando `behat`. Si tienes curiosidad sobre cómo hacerlo, siéntete libre de seguir leyendo.

Estructura del código:

```
Cucumber 49.9% Perl 26.7% PHP 21.8% Shell 1.6%
```

## Instalación

Descargamos el repositorio:

```bash
git clone https://github.com/gustawdaniel/image_to_database_converter_example.git && cd image_to_database_converter_example
```

Instalando dependencias.

```bash
sudo apt-get install tesseract-ocr
```

Convertimos imágenes en textos

```
bash process.sh
```

Creamos bases de datos e insertamos datos en ellas. Este script primero eliminará las bases de datos nombradas en `config/parameters.yml`, verificará la configuración antes de ejecutarlo.

```
perl insert.pl
```

Instalando paquetes `php`

```
composer install
```

Estamos realizando pruebas

```
vendor/bin/behat
```

Después de la instalación, el procesamiento de imágenes, la limpieza de datos, el guardado de contenido y las pruebas de bases de datos se ven de la siguiente manera.

## Estructura de la base de datos

Tomaremos las tareas `2.4.1` y `2.4.3` del capítulo [`2`](http://infolab.stanford.edu/~ullman/fcdb/ch2.pdf) del libro `Database Systems: The Complete Book` como punto de partida. La tarea implica escribir selecciones.

Crearemos dos bases de datos. La primera contiene el inventario de una tienda de electrónica.

> `tienda_electronica`

![struktura bazy 1](https://github.com/gustawdaniel/image_to_database_converter_example/raw/master/sql/electronic_store.png)

Su código en SQL se ve de la siguiente manera: 

> sql/electronic\_store.sql

```sql
DROP DATABASE   IF     EXISTS electronic_store;
CREATE DATABASE IF NOT EXISTS electronic_store;
use electronic_store;

CREATE TABLE product (
  producer CHAR(1),
  model    DECIMAL(4,0),
  type     VARCHAR(255)
);

CREATE TABLE pc (
  model DECIMAL(4,0),
  speed DECIMAL(3,2),
  ram   SMALLINT,
  disc  SMALLINT,
  price SMALLINT
);

CREATE TABLE laptop (
  model DECIMAL(4,0),
  speed DECIMAL(3,2),
  ram   SMALLINT,
  disc  SMALLINT,
  screen DECIMAL(3,1),
  price SMALLINT
);

CREATE TABLE printer (
  model DECIMAL(4,0),
  color BOOL,
  type  VARCHAR(255),
  price SMALLINT
);
```

El segundo es una base de datos de datos sobre acorazados de la Segunda Guerra Mundial.

![struktura bazy 2](https://github.com/gustawdaniel/image_to_database_converter_example/raw/master/sql/warships.png)

Tiene una estructura de código muy similar

```sql
DROP DATABASE   IF     EXISTS warships;
CREATE DATABASE IF NOT EXISTS warships;
use warships;

CREATE TABLE classes (
  class VARCHAR(255),
  type CHAR(2),
  country VARCHAR(255),
  numGuns SMALLINT,
  bore SMALLINT,
  displacement INTEGER
);

CREATE TABLE ships (
  name VARCHAR(255),
  class VARCHAR(255),
  launched SMALLINT
);

CREATE TABLE battles (
  name VARCHAR(255),
  date VARCHAR(255)
);

CREATE TABLE outcomes (
  ship VARCHAR(255),
  battle VARCHAR(255),
  result VARCHAR(255)
)

```

Los datos no están sujetos a ninguna restricción de integridad referencial.

## Fuente de Datos

El problema con los datos comienza con el hecho de que la base de datos está guardada en un archivo `pdf`, que es simplemente un fragmento de un libro. Es un `pdf` mal hecho, y los datos de él no son adecuados para resaltar y copiar. Afortunadamente, encontraremos una solución utilizando OCR.

### Imágenes

Comenzaremos tomando capturas de pantalla de las tablas del libro. El [repositorio](https://github.com/gustawdaniel/image_to_database_converter_example) contiene estas capturas de pantalla. Se guardan en archivos nombrados de acuerdo a los nombres de las tablas en el directorio `raw/1` para la primera base de datos y `raw/2` para la segunda. Un archivo de ejemplo `raw/1/laptop.png` se ve de la siguiente manera.

![laptop](http://i.imgur.com/CPRm97P.png)

### Extracción de texto (OCR)

Ahora necesitamos instalar `tesseract-ocr` con el comando:

```
sudo apt-get install tesseract-ocr

```

Realizaremos el reconocimiento de texto en cada uno de los archivos guardados. Un script simple nos ayudará con esto:

> process.sh

```bash
#!/usr/bin/env bash

RAW=raw;
BUILD=build;

mkdir -p $BUILD;
rm -rf $BUILD/*

for cat in $RAW/*
do
    baseCat=$(basename $cat .png);
    for file in $cat/*.png
    do
        baseFile=$(basename $file .png);
        mkdir -p $BUILD/$baseCat;
        tesseract $file $BUILD/$baseCat/$baseFile;
    done
done

```

### Procesamiento de Texto

```yml
config:
  type: mysql
  host: localhost
  user: root
  pass: ""
  bases:
   - electronic_store
   - warships

```

#### Definiciones

La mayoría de mis scripts comienzan de manera similar. Estos son encabezados con paquetes.

> insert.pl

```perl
#!/usr/bin/env perl
# This script save data to database

use Modern::Perl;       # modern syntax
use File::Basename;     # parsing names of files
use YAML::Tiny;         # open yml config
use DBI();              # database connection

use strict;             # strict mode
use warnings;
use open ':std', ':encoding(UTF-8)';

```

Más tarde, entran las variables de configuración relacionadas con el entorno:

```perl
#----------------------------------------------------------------------#
#                        Configuration                                 #
#----------------------------------------------------------------------#
my $build = "build/";
my $sql = "sql/";
my $parameters = 'config/parameters.yml';


my $yaml = YAML::Tiny->read( $parameters );
my $config = $yaml->[0]->{config};

```

A continuación, tenemos definiciones. La única función definida aquí es el procedimiento de ejecución de expresiones regulares: encontrar y reemplazar. Es un conjunto de filtros por los que pasará el texto leído por OCR.

```perl
#--------------------------------------------------------------#
#         Fix file structure broken by OCR inaccuracy          #
#--------------------------------------------------------------#
sub fixStructure
{
    s/mm/ram/g;
    s/\s(\d{3})\s(\d)\s/ $1$2 /g;
    s/\|\s//g;
    s/true/1/g;
    s/false/0/g;

    s/(\w+)\s(\w+)\s(\d{1,2}\/)/$1_$2 $3/g;
    s/North\s(\w+)/North_$1/g;
    s/West Virginia/West_Virginia/g;
    s/South Dakota/South_Dakota/g;
    s/Royal\s(\w+)/Royal_$1/g;
    s/New Jersey/New_Jersey/g;
    s/King George V/King_George_V/g;
    s/Pearl Harbor/Pearl_Harbor/g;
    s/Prince of Wales/Prince_of_Wales/g;
    s/Duke of York/Duke_of_York/g;
    s/Gt. Britain/Gt._Britain/g;
    s/\sStrait/_Strait/g;
};


```

#### Función

La función no tiene parámetros porque opera sobre la variable `$_`. Vale la pena señalar una propiedad interesante de `perl` que la distingue de otros lenguajes. Esto es, entre otras cosas, la variable `$_`, cuyo valor depende del contexto y que ni siquiera necesita ser escrita si el contexto indica que es el sujeto. En la intención del creador del lenguaje - Larry Wall - esto lo hacía similar a un lenguaje hablado, donde no especificamos continuamente el sujeto si es obvio. Por un lado, esto permite escribir rápidamente código denso con grandes capacidades, por otro lado, dificulta mucho la lectura si no está suficientemente documentado y el lector no conoce bien el lenguaje. Quizás esta flexibilidad sea una de las razones del declive de este lenguaje frente al muy restrictivo `python`, pero para mí, es más una ventaja que una desventaja. En cualquier caso, para nosotros, la variable `$_` tomará el valor de una cadena de texto de una sola línea leída.

Veamos más de cerca las reglas que he introducido, ya que este es el corazón de todo el programa.

Las reglas `s/A/B/g` realizan una operación sobre la variable `$_` que busca la cadena `A` y la reemplaza por la cadena `B`. La primera corrige la lectura incorrecta de la columna `ram` leída por `OCR` como `mm`, la segunda elimina un espacio de uno de los identificadores, la siguiente elimina líneas verticales. Las siguientes dos transforman valores booleanos en forma binaria. Todas las subsiguientes implican seleccionar espacios apropiados y reemplazarlos con caracteres `_`. Este es el enfoque correcto si no hay caracteres `_` en el texto analizado, lo cual es cierto en el ejemplo discutido aquí.

#### Script

La parte ejecutable del script comienza iterando sobre las bases de datos enumeradas en la configuración:

```perl
#----------------------------------------------------------------------#
#                            Script                                    #
#----------------------------------------------------------------------#

        #--------------------------------------------------------------#
        #                      Loop over databases                     #
        #--------------------------------------------------------------#
while (my ($baseNumber, $baseName) = each @{ $config->{"bases"} })
{
    print $baseNumber."\t".$baseName.".sql"."\n";

```

A continuación, nos ocupamos de la idempotencia, lo que significa la capacidad de repetir el script varias veces sin cambiar el resultado. Ejecutamos códigos `sql` que restauran los estados de la base de datos a una forma limpia. Es posible que en tu sistema necesites anteponer `sudo` antes del comando `mysql`. Prefiero cambiar los derechos de acceso a la base de datos si es mi computadora privada y local, en lugar de ingresar contraseñas cada vez que inicio la base de datos desde la terminal.

```perl
    #--------------------------------------------------------------#
    #  Reset database, put `sudo` before `mysql` if access error   #
    #--------------------------------------------------------------#

    my $passSting = ($config->{pass} eq "") ? "" : " -p ".$config->{pass};
    system('mysql -h '.$config->{host}.' -u '.$config->{user}.$passSting.' < '.$sql.$baseName.".sql");

```

La conexión a la base de datos ya se ha discutido en este blog; como recordatorio, se ve así:

```perl
    #--------------------------------------------------------------#
    #                 Connect to the database                      #
    #--------------------------------------------------------------#

    my $dbh = DBI->connect( "DBI:mysql:database=".$baseName.";host=".$config->{host},
        $config->{user}, $config->{pass}, {
            'PrintError'        => 0,
            'RaiseError'        => 1,
            'mysql_enable_utf8' => 1
        } ) or die "Connect to database failed";

```

Se vuelve más interesante al recorrer todos los archivos:

```perl
            #--------------------------------------------------------------#
            #                     Loop over files                          #
            #--------------------------------------------------------------#

        my @files = <$build$baseNumber"/"*.txt>;
        foreach my $file (@files) {

            my $name = basename($file, ".txt");
            print $file."\t".$name."\n";
            open(my $fh, '<:encoding(UTF-8)', $file)
                or die "Could not open file '$file' $!";

```

En la variable `$name`, se almacenan nombres sin rutas y extensiones. Sucede que estos son exactamente los nombres de las tablas en nuestra base de datos. Haremos uso de esto al crear inserciones. Una consecuencia natural de iterar sobre archivos de texto es abrirlos. Mantenemos el manejador de archivos en la variable `$fh`, así que realizamos bucles sobre él:

```perl
        #--------------------------------------------------------------#
        #               Read all lines of given file                   #
        #--------------------------------------------------------------#

        my $index = 0; my $statement;
        while (<$fh>) {

```

Antes del bucle, definimos dos variables. `$index` que nos permite referirnos al número de una línea no vacía, y `$statement`, que almacenará la inserción preparada. Las líneas leídas deben ser procesadas antes de guardar. Comenzaremos eliminando los caracteres de nueva línea y saltando las líneas que contienen solo espacios.

```perl
        #--------------------------------------------------------------#
        #         Skip empty lines and cut new line signs              #
        #--------------------------------------------------------------#
            chomp;
            if(m/^\s*$/) {
                next;
            }

```

Aquí es donde entra en juego la magia de la variable de contexto `$_`. Todo el mundo sabe que al iterar sobre las líneas de un archivo, son esas líneas las que son el foco de interés. Por lo tanto, ni siquiera necesitamos nombrarlas. En lugar de escribir `chomp $line`, podemos escribir `chomp $_`, pero ¿por qué molestarse, ya que es suficiente con escribir solo `chomp`. A partir del contexto, está claro que el carácter de nueva línea debe ser eliminado de la variable que se está iterando en el bucle. Así, después de esta limpieza inicial, podemos aplicar nuestros filtros. Nada podría ser más simple. Esto lo maneja la frase:

```perl
                &fixStructure;

```

Finalmente, dividimos la fila ya fijada `$_` por espacios y la almacenamos como un arreglo en la variable `@row`. Normalmente, para mí, la mayor magia ocurre al final del script, y esta vez no es diferente.

```perl
        #--------------------------------------------------------------#
        #   In first row define statement, in next ones execute them   #
        #--------------------------------------------------------------#
            if(!$index++){
                my $query = "INSERT INTO $name (".join(",",@row).") VALUES (?". ",?"x(@row-1) .")";
                $statement = $dbh->prepare($query);
            } else {
                s/_/ / for @row;
                $statement->execute(@row);
            }

            print "\t" . $_ . "\n";
        }
    }

```

En la condición `$if` comprobamos si `$idnex` se ha elevado anteriormente mientras lo elevamos simultáneamente. Para la primera ejecución, el arreglo `@row` debe contener los nombres de las columnas de la tabla `$name`. Les recuerdo que `$name` fue elegido para corresponder a los nombres de columnas ya en la etapa de toma de capturas de pantalla. Durante la primera ejecución, creamos `$query`, que es el contenido de la inserción que realizaremos para todas las demás líneas del archivo de texto.

El fragmento `join(",",$row)` realiza una operación en el arreglo `@row` que lo convierte a `string` y lo concatena con comas.

La operación `",?"x(@row-1)` también convierte el arreglo `@row`, pero esta vez en un contexto numérico: le restamos uno. Por esta razón, la conversión se realiza de la manera más natural para el número de elementos en el arreglo. El signo `x`, muy típico de `perl`, es el operador para repetir un `string` un número especificado de veces. Por ejemplo, `"a"x3` es equivalente a escribir `"aaa"`.

Después de determinar la representación textual de la consulta, sigue su preparación, y con cada línea subsecuente del texto procesado, solo se restaura el espacio en lugar de los caracteres `_` en cada palabra del arreglo de manera separada, y se ejecuta la inserción.

```perl
        #-----------------------------------------------------------#
        #                   Close connection                        #
        #-----------------------------------------------------------#
    $dbh->disconnect();

```

Al final, cerramos la conexión a la base de datos.

## Consultas de Base de Datos

Después de clonar el repositorio, puedes restaurar el estado de mi base de datos ejecutando los comandos:

```bash
bash process.sh
perl insert.pl

```

### Base de Datos de Tienda Electrónica

¿Qué modelos de PC tienen una velocidad de al menos 3.00?

```sql
SELECT model FROM pc WHERE speed >= 3.0;

```

¿Qué fabricantes producen laptops con un disco duro de al menos 100 gigabytes?

```sql
SELECT maker FROM product NATURAL JOIN laptop WHERE hd >= 100;

```

Encuentra los números de modelo y precios de todos los productos de cualquier tipo fabricados por el productor B.

```sql
SELECT model,price FROM laptop UNION SELECT model,price FROM pc UNION SELECT model,price FROM printer NATURAL JOIN product as p WHERE p.maker='B';

```

Encuentra los números de todas las impresoras láser a color

```sql
SELECT model FROM printer WHERE color AND type='laser';

```

Encuentra fabricantes que vendan laptops, pero ya no PC.

```sql
SELECT DISTINCT maker FROM laptop NATURAL JOIN product WHERE maker NOT IN (SELECT DISTINCT maker FROM pc NATURAL JOIN product);

```

Encuentra los tamaños de disco duro que ocurren en al menos dos PCs

```sql
SELECT hd FROM (SELECT count(*) as c, hd FROM pc GROUP BY hd) as calc WHERE c>=2;

```

Encuentra pares de modelos de PC con la misma cantidad de RAM y velocidad. Los pares deben aparecer solo una vez, por ejemplo, el par (i,j) debe ser mencionado, pero no (j,i).

```sql
SELECT a.model, b.model FROM pc as a JOIN pc as b ON a.speed=b.speed AND a.ram=b.ram WHERE a.model>b.model;

```

Encuentra fabricantes que produzcan al menos dos ordenadores personales o portátiles diferentes con una velocidad de al menos 2.8.

```sql
SELECT  maker from (SELECT maker, count(model) as c FROM product as p NATURAL JOIN (SELECT model, speed FROM pc WHERE speed>=2.8 UNION SELECT model, speed FROM laptop WHERE speed>=2.8) as u GROUP BY maker) as mc WHERE c>=2;

```

Encuentra el fabricante o los fabricantes de las computadoras más rápidas (PCs o laptops)

```sql
SELECT DISTINCT maker FROM product as p NATURAL JOIN (SELECT model,speed FROM laptop UNION SELECT model,speed FROM pc) as c WHERE speed=(SELECT MAX(speed) FROM (SELECT speed FROM laptop UNION SELECT speed FROM pc) as u);

```

Encuentra fabricantes de PC con al menos tres velocidades diferentes

```sql
SELECT maker from (SELECT maker, count(speed) as c FROM product NATURAL JOIN pc GROUP BY maker) as s WHERE s.c>=3;

```

Encuentra fabricantes que vendan exactamente tres modelos diferentes de PCs.

```sql
SELECT maker from (SELECT maker, count(model) as c FROM product NATURAL JOIN pc GROUP BY maker) as s WHERE s.c=3;

```

### Flota de Acorazados

Enumera los nombres y países de las clases de barcos con cañones de al menos dieciséis pulgadas de calibre.

```sql
SELECT name, country FROM classes NATURAL JOIN ships WHERE bore>=16;

```

Encuentra barcos lanzados antes de 1921

```sql
SELECT name FROM ships WHERE launched<1921;

```

Encontrar barcos hundidos en la Batalla del Estrecho de Dinamarca

```sql
SELECT ship FROM outcomes WHERE result="sunk" AND battle="Denmark Strait";

```

El Tratado de Washington de 1921 prohibió la construcción de acorazados de más de 35,000 toneladas. Enumere los barcos que son inconsistentes con el tratado.

```sql
SELECT name FROM classes NATURAL JOIN ships WHERE launched>1921 AND displacement>35000;

```

Proporcione el nombre, desplazamiento y número de cañones de los barcos que participaron en la Batalla de Guadalcanal.

```sql
SELECT DISTINCT name, displacement, numGuns FROM classes NATURAL JOIN ships NATURAL JOIN outcomes WHERE battle='Guadalcanal';

```

Proporcione todos los barcos en la base de datos, recuerde que algunos barcos no están en la relación de Barcos.

```sql
SELECT name FROM ships UNION SELECT ship FROM outcomes;

```

Encontrar clases representadas por un solo barco

```sql
SELECT class FROM (SELECT class, count(class) as c FROM classes as cl NATURAL JOIN (SELECT ship, ship as class FROM outcomes as o UNION SELECT name, class FROM ships as s) as ext_ship GROUP BY class) as total WHERE c=1;

```

Encuentra países que tuvieron tanto acorazados como cruceros.

```sql
SELECT t1.country FROM classes as t1 JOIN classes as t2 ON t1.country=t2.country WHERE t1.type='bb' AND t2.type='bc';

```

Encuentra barcos que "sobrevivieron pero aún podían participar en batalla" - fueron dañados en una batalla y luego participaron en otra.

```sql
SELECT f.name as name FROM
  (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN     outcomes as o1 ON b1.name=o1.battle) as f
    JOIN
  (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN    outcomes as o1 ON b1.name=o1.battle) as s
    ON f.name=s.name AND s.year < f.year AND s.result='sunk';

```

## Pruebas

Para las pruebas, utilizaremos `behat`. Si copiaste este repositorio, simplemente escribe `composer install` y no necesitas ejecutar ninguna de las tres instrucciones a continuación. De lo contrario, puedes instalar `behat` con el comando

```
composer require behat/behat

```

Para evitar reinventar la rueda, adjuntaremos `phpunit` a las assertions.

```
composer require phpunit/phpunit

```

Comenzamos la aventura con `behat` creando un contexto vacío usando el comando.

```
vendor/bin/behat --init

```

Ahora lo llenaremos con contenido.

### Contexto

Comenzamos incluyendo las clases que utilizaremos:

> features/bootstrap/FeatureContext.php

```php
<?php

use Behat\Behat\Context\Context;
use Behat\Gherkin\Node\TableNode;
use Symfony\Component\Yaml\Yaml;
use PHPUnit\Framework\TestCase;

/**
 * Defines application features from the specific context.
 */
class FeatureContext extends TestCase implements Context
{

```

Nuestro contexto amplía la clase `TestCase` proporcionada por `phpunit` para que podamos imponer condiciones fácilmente. Durante la ejecución de las pruebas, necesitaremos tres variables.

```php
private $config;
private $pdo;
private $data;

```

Guardaremos la configuración del archivo `config/parameters.yml` en la variable `$config`, mantendremos la conexión a la base de datos en `$pdo`, y `$data` almacenará el resultado de la última consulta. Podemos asignar valores a los dos primeros ya en el constructor.

```php
    public function __construct()
    {
        parent::__construct();

        $this->config = Yaml::parse(file_get_contents(__DIR__.'/../../config/parameters.yml'))["config"];
        $this->setPdoUsingBaseNumber(0);
    }

```

Heredamos el constructor de `phpunit` aquí. Luego, establecemos la variable `$config`. No necesitamos instalar un analizador adicional para `yml` porque `behat` utiliza el de `symfony`, ya que usa su propia configuración en formato `yml`. Finalmente, establecemos la conexión a la base de datos predeterminada - `electronic_store` usando la función `setPdoUsingBaseNumber(0)`. Su código es el siguiente:

```php
    private function setPdoUsingBaseNumber($baseNumber)
    {
        try {
            $this->pdo = new PDO(
                $this->config["type"].
                ':host='.$this->config["host"].
                ';dbname='.$this->config["bases"][$baseNumber],
                $this->config["user"],
                $this->config["pass"]);

            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);

        } catch (PDOException $e) {
            echo 'Connection failed: ' . $e->getMessage();
        }
    }

```

En general, esto podría ser esperado. Lo único interesante aquí es la configuración de los atributos de nuestra conexión. Queremos que convierta los resultados de las consultas en objetos. Aunque utilizaremos `phpunit` para la mayoría de las afirmaciones, no verifica la ocurrencia en un array para objetos más complejos. Esto podría evitarse serializando objetos, pero aquí usé un enfoque diferente y los comparé manualmente.

```php
    private function assertArrayContainsHash($theArray, $hash)
    {
        foreach($theArray as $arrayItem) {
            if((array) $arrayItem == $hash) {
                return true;
            }
        }
        throw new Exception(print_r($theArray)." do not contain ".print_r($hash));
    }

    private function assertArrayNotContainsHash($theArray, $hash)
    {
        foreach($theArray as $arrayItem) {
            if((array) $arrayItem == $hash) {
                throw new Exception(print_r($theArray)." do contain ".print_r($hash));
            }
        }
        return true;
    }

```

Estas funciones verifican si el conjunto de atributos probado - `$hash` apareció en el resultado de la consulta - `$theArray`.

Ahora presentaremos los posibles pasos que pueden ocurrir durante la prueba.

```php
    /**
     * @Given I'm connected to :number database
     */
    public function connectToSecondDatabase($number)
    {
        $this->setPdoUsingBaseNumber($number-1);
    }

```

Cambiamos entre bases de datos, cambiando la numeración `1`, `2` a la que se utiliza para la numeración de índices de arreglo. Ahora seleccionar selecciona.

```php
    /**
     * @When I select :query from database
     */
    public function iSelectFromDatabase($query)
    {
        $stmt = $this->pdo->query($query);
        $stmt->execute();
        $this->data = $stmt->fetchAll();
        $stmt->closeCursor();
    }

```

Simplemente creamos una consulta, la ejecutamos y guardamos los resultados en la variable `$data`. Para mantener las cosas ordenadas, limpiamos la consulta. Si estamos interesados en ver el resultado, he preparado un método para eso.

```php
    /**
     * @Then I print result
     */
    public function iPrintResult()
    {
//        echo json_encode($this->data, JSON_PRETTY_PRINT);
        print_r($this->data);
    }

```

La opción de formateo a `json` también se ha proporcionado, pero dado que este código no cumple con ninguna tarea de prueba además de la depuración, no creé un método separado para ello. Es hora de la primera de las condiciones que imponemos a los datos:

```php
    /**
     * @Then I should see :count results
     */
    public function iShouldSeeResults($count)
    {
        $this->assertEquals(sizeof($this->data), $count);
    }

    /**
     * @Then I should see not less than :arg1 results
     */
    public function iShouldSeeNotLessThanResults($arg1)
    {
        $this->assertGreaterThanOrEqual($arg1,count($this->data));
    }

    /**
     * @Then I should see not more than :arg1 results
     */
    public function iShouldSeeNotMoreThanResults($arg1)
    {
        $this->assertGreaterThanOrEqual(count($this->data),$arg1);
    }

```

Si queremos referirnos al número de registros en el resultado de nuestra consulta, podemos exigir que sea igual a, no menor que, o no mayor que el valor especificado.

Otro paso posible es verificar el valor del atributo para la primera fila de la consulta dada.

```php
    /**
     * @Then Firs result should have :key equal :value
     */
    public function firsResultShouldHaveEqual($key, $value)
    {
        $this->assertArrayHasKey(0,$this->data);
        $this->assertObjectHasAttribute($key,$this->data[0]);
        $this->assertEquals($this->data[0]->$key,$value);
    }

```

A continuación, verificamos si el resultado tiene la primera fila, si el atributo dado existe en ella y si tiene el valor que esperamos. El último paso es tan general que se aplica en casi todos los escenarios en casi todos los ejemplos.

```php
    /**
     * @Then /^Result should( not)? contain fields:$/
     */
    public function resultShouldContainFields($not = null, TableNode $table)
    {
        foreach($table->getHash() as $hash)
        {
            if (!$not) {
                $this->assertArrayContainsHash($this->data, $hash);
            } else {
                $this->assertArrayNotContainsHash($this->data,$hash);
            }
        }
    }

```

### Escenarios de Prueba

```gherkin
Feature: Selecting chosen fields from database
  In order to check if my queries are correct
  As an an database user
  I want to execute them and test some asserts

```

Este es un encabezado, es solo documentación porque este código no se ejecuta. A continuación se presenta el primer escenario.

```gherkin
  Scenario Outline: Checking number of rows
    Given I'm connected to <db> database
    When I select "SELECT count(*) AS c FROM <table>" from database
    Then I should see 1 results
    And Firs result should have "c" equal <count>

    Examples:
      | db | table    | count |
      | 1  | product  | 30    |
      | 1  | pc       | 13    |
      | 1  | laptop   | 10    |
      | 1  | printer  | 7     |
      | 2  | classes  | 8     |
      | 2  | battles  | 4     |
      | 2  | outcomes | 16    |
      | 2  | ships    | 21    |

```

Se ha verificado aquí si el número de registros en la base de datos corresponde a los del libro. Luego, se revisan todas las consultas que tienen solo una columna con un resultado.

```gherkin
  Scenario Outline: Testing query
    Given I'm connected to <db> database
    When I select <query> from database
    Then Result should contain fields:
      | <row>  |
      | <yes1> |
      | <yes2> |
    And Result should not contain fields:
      | <row>  |
      | <no1>  |
      | <no2>  |

    Examples:
      | db | row   | yes1      | yes2             | no1       | no2        | query                                                                                                                                                                                                                              |
      | 1  | model | 1013      | 1006             | 1012      | 1007       | "SELECT model FROM pc WHERE speed >= 3.0;"                                                                                                                                                                                         |
      | 1  | maker | E         | A                | C         | H          | "SELECT maker FROM product NATURAL JOIN laptop WHERE hd >= 100;"                                                                                                                                                                   |
      | 1  | model | 3003      | 3007             | 3002      | 3005       | "SELECT model FROM printer WHERE color AND type='laser'"                                                                                                                                                                           |
      | 1  | maker | F         | G                | A         | D          | "SELECT DISTINCT maker FROM laptop NATURAL JOIN product WHERE maker NOT IN (SELECT DISTINCT maker FROM pc NATURAL JOIN product);"                                                                                                  |
      | 1  | maker | F         | G                | A         | D          | "SELECT l.maker FROM (SELECT maker,type FROM product WHERE type='laptop') as l LEFT JOIN (SELECT maker,type FROM product WHERE type='pc') as p ON l.maker=p.maker WHERE p.maker IS NULL;"                                          |
      | 1  | hd    | 250       | 80               | 300       | 350        | "SELECT hd FROM (SELECT count(*) as c, hd FROM pc GROUP BY hd) as calc WHERE c>=2;"                                                                                                                                                |
      | 1  | maker | B         | E                | H         | G          | "SELECT  maker from (SELECT maker, count(model) as c FROM product as p NATURAL JOIN (SELECT model, speed FROM pc WHERE speed>=2.8 UNION  SELECT model, speed FROM laptop WHERE speed>=2.8) as u GROUP BY maker) as mc WHERE c>=2;" |
      | 1  | maker | A         | B                | C         | G          | "SELECT maker from (SELECT maker, count(speed) as c FROM product NATURAL JOIN pc GROUP BY maker) as s WHERE s.c>=3;"                                                                                                               |
      | 1  | maker | A         | D                | C         | H          | "SELECT maker from (SELECT maker, count(model) as c FROM product NATURAL JOIN pc GROUP BY maker) as s WHERE s.c=3;"                                                                                                                |
      | 2  | name  | Ramillies | Royal Oak        | Wisconsin | Yamato     | "SELECT name FROM ships WHERE launched<1921;"                                                                                                                                                                                      |
      | 2  | ship  | Bismarck  | Hood             | Wisconsin | Rodney     | "SELECT ship FROM outcomes WHERE result='sunk' AND battle='Denmark Strait'"                                                                                                                                                        |
      | 2  | name  | Yamato    | North Carolina   | Kirishima | California | "SELECT name FROM classes NATURAL JOIN ships WHERE launched>1921 AND displacement>35000"                                                                                                                                           |
      | 2  |country| Japan     | Gt. Britain      |USA        | Germany    | "SELECT t1.country FROM classes as t1 JOIN classes as t2 ON t1.country=t2.country WHERE t1.type='bb' AND t2.type='bc';"                                                                                                            |

```

Es difícil incluso comentar sobre esto, porque este código es autoexplicativo. Simplemente nos conectamos a la base de datos, realizamos un select, verificamos si el resultado contiene los dos valores de ejemplo que esperamos y no contiene los otros dos que no deberían estar allí.

La situación es completamente análoga si tenemos dos columnas en el resultado.

```gherkin
  Scenario Outline: Testing query with two attributes
    Given I'm connected to <db> database
    When I select <query> from database
    Then Result should contain fields:
      | <rowA>  | <rowB>  |
      | <yes1A> | <yes1B> |
      | <yes2A> | <yes2B> |
    And Result should not contain fields:
      | <rowA> | <rowB> |
      | <no1A> | <no1B> |
      | <no2A> | <no2B> |
    Examples:
      | db | rowA  | rowB    | yes1A  | yes1B | yes2A          | yes2B | no1A    | no1B         | no2A       | no2B | query                                                                                                                                                                            |
      | 1  | model | price   | 1004   | 649   | 2007           | 1429  | 2004    | 1150         | 3007       | 200  | "SELECT model,price FROM product as p NATURAL JOIN (SELECT model,price FROM pc UNION SELECT model,price FROM laptop UNION SELECT model,price FROM printer) as s WHERE maker='B'" |
      | 2  | name  | country | Yamato | Japan | North Carolina | USA   | Repulse | Gr. Brritain | California | USA  | "SELECT name, country FROM classes NATURAL JOIN ships WHERE bore>=16;"                                                                                                           |

```

Desafortunadamente, no sé el mecanismo que permitiría conectar estos dos escenarios en uno; ni siquiera se mencionó una palabra sobre la herencia de escenarios en la documentación. Quizás alguien en [stack](http://stackoverflow.com/questions/40941114/flexibility-of-scenarios-in-gherkin) conozca un truco para esto.

Si tienes una corazonada sobre cómo terminará esto, así es exactamente como termina.

```gherkin
  Scenario: Testing query with three attributes
    Given I'm connected to 2 database
    When I select "SELECT DISTINCT name, displacement, numGuns FROM classes NATURAL JOIN ships NATURAL JOIN outcomes WHERE battle='Guadalcanal';" from database
    Then Result should contain fields:
      | name       | numGuns | displacement |
      | Kirishima  | 8       | 32000        |
      | Washington | 9       | 37000        |
    And Result should not contain fields:
      | name     | numGuns | displacement |
      | Tenessee | 12      | 32000        |
      | Bismarck | 8       | 42000        |

```

Y sucedió, estoy repitiendo el mismo código por tercera vez. Me estaba arrancando los pelos mientras escribía esto. Resultó que solo hay un caso select con tres columnas, pero ya vemos la imperfección de este código.

A veces sucedía que quería probar la existencia de solo una fila, con dos atributos en su lugar:

```gherkin
  Scenario: Testing query (pairs)
    When I select "SELECT a.model as a, b.model as b FROM pc as a JOIN pc as b ON a.speed=b.speed AND a.ram=b.ram WHERE a.model>b.model;" from database
    Then Result should contain fields:
      | a     | b       |
      | 1012  | 1004    |
    And I should see 1 results

```

También hubo casos con un resultado y un atributo.

```gherkin
  Scenario Outline: Testing query (max speed)
    Given I'm connected to <db> database
    When I select <query> from database
    And I should see 1 results
    And Firs result should have <row> equal <value>
    Examples:
      | db | row   | value    | query                                                                                                                                                                                                                          |
      | 1  | maker | B        | "SELECT DISTINCT maker FROM product as p NATURAL JOIN (SELECT model,speed FROM laptop UNION SELECT model,speed FROM pc) as c WHERE speed=(SELECT MAX(speed) FROM (SELECT speed FROM laptop UNION SELECT speed FROM pc) as u);" |
      | 2  | class | Bismarck | "SELECT class FROM (SELECT class, count(class) as c FROM classes as cl NATURAL JOIN (SELECT ship, ship as class FROM outcomes as o UNION SELECT name, class FROM ships as s) as ext_ship GROUP BY class) as total WHERE c=1;"  |

```

Y un caso en el que no conocía el número exacto de resultados, pero podía determinar el rango en el que se encuentra.

```gherkin
  Scenario: Select all ships
    Given I'm connected to 2 database
    When I select "SELECT name FROM ships UNION SELECT ship FROM outcomes;" from database
    Then I should see not less than "21" results
    And I should see not less than "16" results
    And I should see not more than 37 results
    And Result should contain fields:
      | name |
      | Yamashiro |
      | Bismarck |
      | Fuso |

```

Al final, me sorprendió el escenario en el que no recibí nada a la salida.

```gherkin
  Scenario: Select null
    Given I'm connected to 2 database
    When I select "SELECT f.name as name FROM (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN outcomes as o1 ON b1.name=o1.battle) as f JOIN (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN outcomes as o1 ON b1.name=o1.battle) as s ON f.name=s.name AND s.year < f.year AND s.result='sunk';" from database
    Then I should see 0 results

```

Así es como completamos el proyecto.

Espero que te haya gustado el material presentado. Házmelo saber en los comentarios si algo necesita más aclaración, o si sabes cómo podría escribir pruebas más generales que las presentadas arriba. Estoy pensando en un escenario para N atributos, con M ejemplos que ocurren y L que no ocurren.
