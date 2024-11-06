---
author: Daniel Gustaw
canonicalName: scraping-data-in-perl-language
coverImage: http://localhost:8484/f2b67965-a6e0-4112-8ff2-ae3330414969.avif
description: El artículo presenta un scraper simple escrito en Perl 5. A pesar de manejar tres registros de datos, su código es notablemente corto.
excerpt: El artículo presenta un scraper simple escrito en Perl 5. A pesar de manejar tres registros de datos, su código es notablemente corto.
publishDate: 2021-05-11 20:37:00+00:00
slug: es/raspado-de-datos-en-Perl
tags:
- perl
- scraping
title: Raspado de datos en Perl
updateDate: 2021-06-22 09:00:09+00:00
---

## Descripción del Proyecto

La internet generalmente se asocia con navegarla en la forma renderizada por un navegador a partir de un archivo html. Esto es conveniente si nos importa una buena presentación y una navegación fácil.

Sin embargo, si queremos navegar y analizar datos, entonces la forma de una página html puede resultar subóptima y es más sencillo descargar páginas html a nuestro disco y luego procesarlas en un formato más amigable para un procesamiento posterior. Este proceso se llama scraping.

Hoy, escribiremos una aplicación que te permite descargar datos de varias páginas, que pueden ser iteradas a través de un parámetro en la url y procesadas en archivos json.

Usaremos el lenguaje Perl para esto. La aplicación consistirá en una parte que descarga datos y una parte que los procesa. La configuración se separará en una clase aparte, permitiendo una fácil expansión de la colección de páginas soportadas.

## Instalación

Descargamos el repositorio de git y vamos al directorio creado.

```
git clone git@github.com:gustawdaniel/scraper.git && cd scraper
```

## Carga de Configuración

El proceso de scraping se puede dividir en dos fases: recuperación de datos y procesamiento de los mismos. En algunos casos - cuando lo que descargamos determina lo que estaremos descargando

* deberían superponerse, pero no tienen que hacerlo en nuestro caso. El archivo `app.pl` será responsable de la recuperación de datos, y `json.pl` del análisis. Los archivos con la extensión `.pm` son módulos, clases o bibliotecas que escribimos nosotros mismos, pero no son código ejecutable para la aplicación. Aquí tenemos el módulo `Loader.pm` responsable de reconocer el parámetro pasado a `app.pl` y cargar una de las tres configuraciones disponibles de los archivos `*Config.pm`.

Dado que la primera acción tanto para `app.pl` como para `json.pl` es efectivamente cargar la configuración, comenzaremos discutiendo los módulos. Para ser un módulo, el código debe declararse con la declaración `package`:

> Loader.pm

```perl
use strict;
use warnings FATAL => 'all';

package Loader;
```

Tiene un método - `load`, que reconoce si se ha proporcionado el argumento que especifica el tipo de contenido a raspar. Tenemos la opción de `rhf` - registro de mayoristas farmacéuticos, `scpp` - Cámara de Comercio Escandinava-Polaca, y el predeterminado `ra` - registro de farmacias.

No nos preocupemos ahora por lo que son estas instituciones y por qué estamos descargando sus datos. Se pueden tratar como ejemplos, y uno puede escribir aquí otras instituciones. Es importante que el parámetro `$ARGV[0]` sea una cadena introducida después del nombre del programa, y en función de ello, se cargan los módulos apropiados con la configuración, sobre los que se ejecuta el método `new`. Este es el constructor del objeto que contiene la configuración. Luego, el objeto recibe su nombre y es devuelto.

```perl
sub load
{
    if(scalar @ARGV && $ARGV[0] eq "rhf") {
        use RhfConfig;
        my $config = RhfConfig->new();
        $config->{name} = "rhf";
        return $config;
    } elsif (scalar @ARGV && $ARGV[0] eq "spcc") {
        use SpccConfig;
        my $config = SpccConfig->new();
        $config->{name} = "spcc";
        return $config;
    } else {
        use RaConfig;
        my $config = RaConfig->new();
        $config->{name} = "ra";
        return $config;
    }
}
```

Aquí es donde el código terminaría en la mayoría de los lenguajes, pero Perl requiere agregar una línea más:

```perl
1;
```

El uno es requerido aquí para indicar el éxito de la operación de carga del módulo. Tiene sentido si algo salió mal durante la inicialización. Al devolver falso, podríamos finalizar nuestro programa de una manera más limpia.

Como se mencionó anteriormente, tenemos varias configuraciones disponibles. Para evitar repetir código, las encapsulamos en objetos que se configuran a través de propiedades y métodos. En otros lenguajes, usaríamos una interfaz. Perl no tiene un mecanismo integrado para interfaces, pero se puede escribir desde cero. Probablemente haríamos esto si fuera un proyecto más grande, pero para un caso tan simple, no vale la pena. Así que estamos de acuerdo en que cada configuración debe tener algunos métodos y propiedades, pero puede implementarlos a su manera. Comencemos con el registro de la farmacia:

> RaConfig.pm

```perl
use strict;
use warnings FATAL => 'all';

package RaConfig;
```

Después de definir el nombre del paquete, crearemos su constructor. Usaremos la función bless, cuya tarea es devolver una instancia del objeto creado por nuestra clase.

El primer argumento del constructor (que no proporcionaremos, ya que se establece automáticamente en segundo plano) es el módulo en sí en el que se llama a la función. Algo como esto o self en otros lenguajes. Lo ponemos como el segundo argumento de la función bless utilizando la función shift, que extrae el primer elemento del array con el contexto por defecto, que son los argumentos de new. Para el primer argumento de la función bless, proporcionamos un conjunto de propiedades del objeto. En este caso, limit igual al índice de página máximo, y rows - el selector en el que se encuentra el contenido que nos interesa. Esto acelera la búsqueda porque todas las consultas posteriores estarán limitadas solo al área seleccionada por este selector.

```perl
sub new { return bless {limit=>100000,rows=>'.pharmacyDetailsControl_Div.controlContainer'}, shift; }
```

Para la recuperación de datos, la información más importante es la dirección `url` desde la cual se puede obtener. La construcción de esta dirección basada en el índice de página iterado se realiza mediante el método `source`.

```perl
sub source { # arg index
    return "http://ra.rejestrymedyczne.csioz.gov.pl/_layouts/15/RA/PharmacyDetailsPublic.aspx?id=".$_[1]."&IsDlg=1";
}
```

El método `invalid` nos permite capturar páginas que por alguna razón deben ser omitidas. Le proporcionamos HTML, ya que la respuesta puede tener un código 200, pero si algo está mal con él, este método evitará el procesamiento adicional de ese HTML. En este caso específico, devolverá verdadero si el HTML contiene una cadena que coincide con la expresión regular:

```perl
sub invalid { # arg html
    return $_[1] =~ /ctl00_PlaceHolderPageTitleInTitleArea_ErrorPageTitlePanel/;
}
```

Para el procesamiento, la información clave es qué claves y selectores corresponden a la instancia de los datos recuperados. Aquí, la página es una tabla simple, donde las claves se encuentran en elementos h3 y los valores en spans. El argumento del método es un objeto utilizado para buscar valores específicos en el documento html. Usando sus métodos `query`, devuelve un arreglo de elementos que coinciden con el patrón y a través de `as_trimmed_text`, los convierte en cadenas dentro de esos elementos. En el método `select`, secuencialmente: creamos un `hash` - es decir, una estructura de datos que contiene claves y valores independientemente del orden. Luego nos referimos a él como un arreglo, lo que nos permite insertar el arreglo devuelto por el primer selector como claves y por el segundo como valores. Finalmente, devolvemos el hash.

```perl
sub select { # arg query
    my %hash;
    @hash{$_[1]->query('.inputArea.full h3')->as_trimmed_text} = $_[1]->query('.inputArea.full span')->as_trimmed_text;
    return %hash;
}
```

Al final, al igual que antes, devolvemos `1;`

```perl
1;
```

La clase para el registro de mayoristas farmacéuticos se presentará en su totalidad, ya que es muy similar.

> RhfConfig.pm

```perl
use strict;
use warnings FATAL => 'all';

package RhfConfig;

sub new { return bless {limit=>100000,rows=>'.pharmacyDetailsControl_Div.controlContainer'}, shift; }

sub source {
    return "http://rhf.rejestrymedyczne.csioz.gov.pl/_layouts/15/RHF/WarehouseDetailsPublic.aspx?id=".$_[1]."&IsDlg=1";
}

sub invalid {
    return $_[1] =~ /ctl00_PlaceHolderPageTitleInTitleArea_ErrorPageTitlePanel/;
}

sub select { # arg query
    my %hash;
    @hash{$_[1]->query('.inputArea.full h3')->as_trimmed_text} = $_[1]->query('.inputArea.full span')->as_trimmed_text;
    return %hash;
}

1;
```

Un poco diferente, sin embargo, se configuró la Cámara de Comercio Escandinava-Polaca.

> SpccConfig.pm

```perl
use strict;
use warnings FATAL => 'all';

package SpccConfig;

sub new { return bless {limit=>12,rows=>'td.col-1'}, shift; }

sub source {
    my $link = "https://www.spcc.pl/members/search/all/all/all";
    if($_[1]) { $link .= "?page=".$_[1]; }
    return $link;
}

sub invalid { return 0; }

sub select {
    my $q = $_[1];
    return (
        'name'       => $q->query('.members_search_title')->as_trimmed_text,
        'phone'      => $q->query('.views-field-field-telefon-value')->as_trimmed_text,
        'person'      => $q->query('.views-field-field-kontakt-osoba-value')->as_trimmed_text,
        'email'      => $q->query('.views-field-field-email-email')->as_trimmed_text,
        'www'      => $q->query('.views-field-field-www-url')->as_trimmed_text,
        'branches'     => $q->query('.views-field-phpcode-2')->as_trimmed_text
    )
}

1;
```

## Descargando Contenido

```perl
#!/usr/bin/env perl
use strict;
use warnings FATAL => 'all';
use LWP::Simple;
use open ':std', ':encoding(UTF-8)';
use Loader;
```

`LWP` se utiliza para enviar solicitudes `get`, `Loader` es nuestro módulo discutido en el capítulo anterior. Cargamos la configuración especificada por el parámetro después del nombre del programa usando la línea:

```perl
my $config = Loader->load();
```

Establecemos el contador de descargas exitosas `s` y el contador de errores `e` en `0`.

```perl
my $e = 0;
my $s = 0;
```

Creamos un directorio `raw` para los datos descargados y dentro un subdirectorio correspondiente al nombre abreviado de nuestra fuente de datos.

```perl
mkdir 'raw', 0755;
mkdir 'raw/'.$config->{name}, 0755;
```

Dado que se trata de un raspador lineal muy simple, el índice pasado al método `source` del objeto `config` se calcula iterándolo desde cero hasta el límite especificado en la configuración.

```perl
for(my $i = 7480; $i<=$config->{limit}; $i++) {
```

Extraemos la URL utilizando el método `source` proporcionando este índice. La función get del módulo `LWP::Simple` envía una solicitud a la dirección especificada y devuelve el cuerpo de la respuesta.

```perl
    my $html = get $config->source($i);
```

Si la respuesta devuelta, es decir, el código HTML contiene información de error, el método `invalid` especificado en la configuración debería retornar verdadero. Luego se mostrará un mensaje rojo `ERROR`, y el contador de errores aumentará. Esto también disparará una transición automática al siguiente índice del bucle.

```perl
    if ($config->invalid($html))
    {
        print "ID:\t" . $i . " - \e[31mERROR\e[0m - [e: ".++$e.", s: $s]\n";
        next;
    }
```

Si todo salió bien, el código HTML de la página se guarda en un archivo llamado simplemente `index` del bucle.

```perl
    open(my $fh, '>', "raw/".$config->{name}."/".$i.".html") or die "Could not open file: $!";
    print $fh ($html);
    close $fh;
```

El contador de éxito aumenta y el mensaje verde ÉXITO aparece en la pantalla.

```perl
    print "ID:\t" . $i . " - \e[32mSUCCESS\e[0m - [e: $e, s: ".++$s."]\n";
}
```

El tiempo de ejecución de la descarga depende de la velocidad de la conexión. Para mí, el tiempo ejecutado en este programa para spcc resultó en:

```
real	0m35.027s
user	0m0.456s
sys	0m0.080s
```

Lo que muestra, el enorme potencial inherente a la paralelización de las operaciones de recuperación de datos.

Ejemplo de pantalla de recuperación de datos:

![](http://i.imgur.com/yAuhj4a.png)

## Análisis de Datos

Para procesar los archivos HTML descargados en un archivo `json`, se utiliza el programa `json.pl`. Me preguntaba si incluir sqlite3 o mongodb, pero quería una base de datos NoSQL lo más ligera y simple posible. Desafortunadamente, sqlite3 no es NoSQL y mongodb no es tan fácil de instalar y configurar. Al final, me quedé con un archivo `json` normal, pero hay que señalar que esta solución no funcionará con conjuntos de datos realmente grandes, donde tenemos que tener en cuenta una cantidad limitada de RAM.

El programa comienza cargando módulos.

> json.pl

```perl
#!/usr/bin/env perl
use strict;
use warnings FATAL => 'all';

use HTML::Query 'Query';
use JSON;
use Loader;
```

El primero es `HTML::Query` - un motor de análisis para HTML y la ejecución de selectores en él. El módulo `JSON` permite convertir hashes y arreglos a formato `json`. Ya nos hemos encontrado con `Loader` y lo hemos visto en acción. Es responsable de cargar la configuración. Junto a la configuración, la segunda variable global en este programa es un arreglo de instancias de objetos que representan los datos obtenidos - empresas, farmacias o mayoristas.

```perl
my $config = Loader->load();
my @instances = ();
```

Estamos revisando todos los índices nuevamente.

```perl
for(my $i = 0; $i<=$config->{limit}; $i++) {
```

Esta vez, la razón para salir del bucle es comprobar si el archivo existe; si no, pasamos a la siguiente iteración.

```perl
    if (! -f 'raw/'.$config->{name}."/".$i.".html") { next; }
```

Si el archivo existe, lo cargamos en el objeto `Query`, sobre el cual realizaremos selectores.

```perl
    my $q = Query( file => 'raw/'.$config->{name}."/".$i.".html" );
```

La oportunidad de usarlos surge bastante rápido. Por primera vez, utilizamos el selector especificado en el constructor del objeto `config` en la propiedad `rows`. Recortamos el área donde se encuentran los datos interesantes. Puede resultar que haya más de tales áreas.

Por ejemplo, las farmacias tienen un diseño con una farmacia por página, mientras que spcc tiene múltiples empresas en una vista. Sin embargo, todas las áreas corresponden a instancias individuales del objeto buscado.

```perl
    my @rows = $q->query($config->{rows})->get_elements(); #
```

No importa si hay una instancia o varias, iteramos sobre ellas:

```perl
    foreach my $row (@rows)
    {
```

Dentro del bucle, filtramos nuestra `consulta` a través de la `consulta` recortada a la área de la instancia dada.

```perl
        $q = Query( tree => $row );
```

El selector configurado de esta manera se pasa al método `select` del objeto de configuración.

```perl
        my %object = $config->select($q);
```

En el método `select`, se encuentran los detalles sobre cómo analizar una instancia dada de un objeto. No tenemos que preocuparnos por eso aquí. Lo que es importante es que lo que recibimos será un objeto del tipo `hash`, que luego agregamos al array `instances`.

```perl
        push @instances, \%object;
    }
}
```

Cuando terminará el bucle. El array `instances` se pasa al objeto codificándolo en formato `json`. Debido a los caracteres polacos, el objeto recibe una configuración en el camino que le instruye a usar `utf-8`.

```perl
print JSON->new->utf8(0)->encode(
    {
        'instances'=> \@instances
    }
);
```

El procesamiento de datos para spcc tarda poco menos de tres segundos, este tiempo bajo una carga completa de CPU.

```
real	0m2.772s
user	0m2.768s
sys	0m0.000s
```

Pantalla con vista de datos procesados

![](http://i.imgur.com/Hs7axWN.png)

## Resumen

El programa fue escrito hace unos seis meses. Ahora, antes de la publicación, lo he refinado un poco de manera estándar. Emplea un método de manejo de objetos a la antigua en Perl. Vale la pena mencionar que también incluye bibliotecas como [Moose](https://metacpan.org/pod/release/ETHER/Moose-2.0802/lib/Moose.pm) o [Moo](https://metacpan.org/pod/Moo) que introducen objetos agregando un poco de lo que se llama "azúcar sintáctico." Sin embargo, lo que es mucho más interesante es que exactamente hace dos semanas - el 24 de julio, se lanzó una versión estable de la sexta versión del intérprete de Perl. Introduce la programación orientada a objetos como parte de la sintaxis nativa del lenguaje. También proporciona un mejor tipado, lo que probablemente aborda la principal desventaja de Perl 5, dificultando escribir de manera segura en él. Quizás esto signifique que Perl 6 regresará a niveles más altos de popularidad.
