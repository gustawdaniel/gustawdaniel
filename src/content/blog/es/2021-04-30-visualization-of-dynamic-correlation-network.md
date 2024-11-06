---
author: Daniel Gustaw
canonicalName: visualization-of-dynamic-correlation-network
coverImage: http://localhost:8484/2b2a7b61-d441-4c24-b8f3-f05eebf30c10.avif
description: Script de Python para visualizar la dinámica de la relación entre instrumentos financieros medidos por correlación.
excerpt: Script de Python para visualizar la dinámica de la relación entre instrumentos financieros medidos por correlación.
publishDate: 2021-04-29 20:05:00+00:00
slug: es/visualizacion-de-la-red-de-correlacion-dinamica
tags:
- python
- stock
- visualisation
title: Visualización de una red de correlación dinámica.
updateDate: 2021-04-29 23:11:09+00:00
---

## Descripción del Proyecto

Python es un lenguaje en el que se puede escribir sin conocerlo. Aunque no conozco Python, escribí un script para operar el servidor ubigraph: un software que permite visualizar gráficos.

El proyecto fue creado en septiembre de 2015, antes de que `ubigraph` [dejara de ser soportado :(](https://twitter.com/SadieSv/status/716044022129659904). A pesar de que el sitio web del proyecto no está disponible, el software escrito basado en el servidor `ubigraph` todavía funciona y el propio archivo del servidor se ha incluido en el repositorio.

Al leer este artículo, te familiarizarás con la herramienta para leer **archivos json en bash**, aprenderás a **definir clases y operar sobre arreglos en python**, y verás cómo el paquete **numpy** simplifica los cálculos.

La composición del código fuente es:

```
Python 90.1% Shell 9.9%
```

Después de escribir, el proyecto se verá así:

### Instalación

Para instalar el proyecto, necesitas descargar el repositorio

```
git clone https://github.com/gustawdaniel/dynamic_network_correaltion.git
```

Ve al directorio `dynamic_network_correlation` e instala el proyecto utilizando el script `install.sh`.

```
cd dynamic_network_correaltion && bash install.sh
```

Deberías ver una nueva ventana negra titulada `Ubigraph`. En una nueva terminal (`ctrl+n`), ejecuta el script `visualise.py`.

```
python visualise.py
```

Seleccione las siguientes opciones en secuencia:

```
test ENTER ENTER ENTER ENTER ENTER
```

En la ventana de `Ubigraph`, deberías ver una visualización de la red de correlación dinámica.

## Configuración

Este capítulo discute todos los pasos de instalación excepto la instalación de dependencias.

Comenzaremos descargando datos de la casa de corretaje [bossa](http://bossa.pl). En su [archivo público](http://bossa.pl/pub/), hay archivos con cotizaciones en formato `mst` (una variante de `csv`) empaquetados en archivos `zip`. Todas las direcciones de los archivos que nos interesan comienzan con `http://bossa.pl/pub/`, pero tienen diferentes extensiones. Los he guardado en un archivo de configuración.

> config/wget\_data\_config.json

```json
{
  "uri1": "http://bossa.pl/pub/",
  "data": [
    {
      "uri2": "metastock/mstock/mstall.zip"
    },{
      "uri2": "ciagle/mstock/mstcgl.zip"
    },{
      "uri2": "futures/mstock/mstfut.zip"
    },{
      "uri2": "newconnect/mstock/mstncn.zip"
    },{
      "uri2": "jednolity/f2/mstock/mstf2.zip"
    },{
      "uri2": "ciagle/mstock/mstobl.zip"
    },{
      "uri2": "indzagr/mstock/mstzgr.zip"
    },{
      "uri2": "waluty/mstock/mstnbp.zip"
    },{
      "uri2": "fundinwest/mstock/mstfun.zip"
    },{
      "uri2": "ofe/mstock/mstofe.zip"
    },{
      "uri2": "forex/mstock/mstfx.zip"
    }
  ]
}
```

### Descargando archivos (json en bash)

Nuestro objetivo es descargar todos los archivos con direcciones que consisten en `"url1"."url2"`. El programa `jq` será responsable de esto, permitiéndonos extraer valores de un archivo `json` para claves dadas. Echemos un vistazo a la primera parte del script para descargar cotizaciones:

> wget\_data.sh

```bash
#!/bin/bash

#
#   Definitions
#

# catalogs structure
CONF="config/wget_data_config.json";
RAW="raw";

# method allowing get data from config file
function getFromConf {
    echo $(cat $CONF | jq -r $1);
}

# variables constant for all script
LINES=$(grep \"uri2\": $CONF | wc -l);
URI1=$(getFromConf '.uri1');
```

Las variables `CONF` y `RAW` son simplemente rutas estáticas al archivo de configuración y al directorio donde se guardarán los datos. La variable `LINES` recupera el número de ocurrencias de la cadena `"uri2":` en el archivo `json`, que corresponde al número de enlaces que queremos obtener.

La función `getFromConf` recupera la clave especificada en el primer parámetro del archivo de configuración cuando la llamamos. Su primera aplicación es visible al definir la variable `URI1`. Un punto precede al nombre de la clave, y todo está entre comillas simples. Eso es suficiente. La siguiente parte del script es un bucle sobre las líneas que hemos contado.

```bash
#
#   Script
#

#clear raw catalog
rm $RAW/*

# iterate over all lines
for i in `seq 1 $LINES`
do
    # downloading data from links from config
    wget $URI1$(getFromConf '.data['$i-1'].uri2') -P $RAW
done
```

### Desempaquetando Archivos

```bash
#!/usr/bin/env bash

# catalogs structure
RAW=raw;
BUILD=build;

# clear build for idempotency
rm -rf $BUILD/*;

# loop over archives in raw
for FILE in $RAW/*.zip
do
#    create directory in build and unzip there file from raw
    NAME=$(basename $FILE .zip);
    echo $NAME;
    mkdir -p $BUILD/$NAME;
    unzip -q $FILE -d $BUILD/$NAME;
done

```

La opción `-q` en el comando `unzip` te permite silenciarlo.

### Preparando el Directorio de Pruebas

Si miramos el archivo `install.sh`, además de instalar dependencias y preparar datos, también está la preparación de pruebas.

> install.sh

```bash
# prepare test
mkdir -p test
rm -rf test/*
cp build/mstcgl/[A-D][A-D][A-D]* test/

```

Este comando se utiliza para seleccionar cotizaciones de varias empresas de ejemplo y guardarlas en el directorio `test`. Esto simplifica el procedimiento para iniciar el programa. En su interfaz, solo necesitas especificar el nombre del directorio `test` para que recupere todos los archivos de allí. Si deseas ver gráficos de otras empresas, se recomienda este método de proceder:

1. Crear un directorio
2. Copiar los archivos `mst` seleccionados en él
3. Al iniciar la visualización, proporciona el nombre de este directorio y presiona `ENTER` dos veces.

## Script ejecutando la visualización

Ahora discutiremos todas las partes del script responsables de visualizar la red de correlación. Comenzaremos con las importaciones y el establecimiento de una conexión con el servidor.

> visualise.py

```py
# -*- coding: utf-8 -*-

import os  # for loading files
import datetime  # for time operations
import numpy  # for calculation correlation

import xmlrpclib  # for visualise by ubigraph
import time  # for waiting between steps

#  connect to server displaying image
server_url = 'http://127.0.0.1:20738/RPC2'
server = xmlrpclib.Server(server_url)
G = server.ubigraph

G.clear()  # clear image before start

```

Los paquetes cargados nos permiten operar en archivos, tiempo, realizar cálculos, conectarnos al servidor `ubigraph` y pausar el programa por una duración específica. Después de cargar los paquetes, se establece una conexión con el servidor y se limpia su ventana.

### Clases

La siguiente parte del script es la clase con la configuración.

```py
##################################################################
#                          Configuration                         #
##################################################################

class Config:
    def __init__(self):
        self.state = 1

    # weights of open, highest, lowest and close price for calculating correlation
    op = 0.25
    hi = 0.25
    lo = 0.25
    cl = 0.25

    free_mem = 1  # option for free memory

    sleep = 0.001  # time of sleeping between steps
    memory = 100  # How many days before actual data should be taken in correlation?
    # boundary = 0 #
    boundary = 0.7  # correlation boundary between showed and hidden connection in graph


config = Config()

```

No tiene métodos y las variables almacenadas en él son públicas. Sirve solo como un contenedor para estos valores para evitar la saturación del espacio de nombres global. Las variables `op`, `hi`, `lo`, `cl` son pesos con los que se utilizan los precios de apertura, más altos, más bajos y de cierre para un instrumento dado en un día específico para calcular la correlación. Establecerlos en `0.25` significa calcular un promedio simple. Si quisiéramos que la correlación se calculara solo para los precios de cierre, deberíamos establecer todos excepto `cl` en `0`, y `cl` en `1`.

La variable `free_mem` servirá más tarde como un marcador para liberar memoria. `sleep` es el tiempo de espera entre iteraciones sucesivas dado en segundos. Las iteraciones significan retroceder un día en la historia. La variable `memory` contiene el rango de días que deben tenerse en cuenta para calcular la correlación; estos son siempre días anteriores al día para el cual estamos calculando la correlación. La última variable - `boundary` - es el valor umbral para la correlación por encima del cual se agregan o eliminan conexiones. Si la correlación es mayor que el valor de esta variable, las conexiones aparecerán durante la visualización; si es menor, desaparecerán.

Esta clase era meramente un equivalente de una estructura en `Pascal`. Ahora es el momento de una clase más "orientada a objetos".

```py
##################################################################
#                          Definitions                           #
##################################################################

class Company:
    """Company contains info about company needed to calculations"""

    def __init__(self, filename):
        self.filename = filename
        self.dates = []
        self.prices = []

        self.prices_evryday = []  # table used instead dates and prices after assigning time of simulation

        self.vertex_id = Company.vertex_id
        Company.vertex_id += 1

    vertex_id = 0
    min_date = 0
    max_date = 0
    name = ''

    def debug_print(self):
        print "name: ", self.name
        print "filename: ", self.filename
        print "vertex: ", self.vertex_id
        print "min_date: ", self.min_date
        print "max_date: ", self.max_date
        print "max price: ", max(self.prices)
        print "min price: ", min(self.prices)

    def in_range(self, date):  # czy date jest w zakresie
        if self.min_date < date < self.max_date:
            return 1
        else:
            return 0

```

### Interfaz y Preparación de Datos

```py
        ##################################################################
        #                          Interface                             #
        ##################################################################

print "Select files with input data"

i = 1
paths = []
while 1:
    path = raw_input("Get path to files " + str(i) + ", or ENTER to finish: ")
    if len(path) == 0:
        break
    i += 1
    paths.append(path)
    print path, len(path), paths

if len(paths) == 0:  # if error
    print "\nYou do not chosen enough number of files.\nRead docs or contact with author: gustaw.daniel@gmial.com.\n"
    exit()

directory = ''
if len(paths) == 1:  # catalog
    directory = paths[0]
    print "Loading from catalog :" + str(directory)
    paths = os.listdir(directory)  # names of files

else:
    print "Loading given files:"

```

La interfaz está algo mezclada con la lógica, y estoy seguro de que podría escribirse de una manera más ordenada, pero como mencioné, no sé Python, así que si tienes algún comentario o idea sobre cómo esto podría escribirse mejor, por favor compártelo en los comentarios.

En general, el objetivo de este fragmento de código era proporcionar al usuario la capacidad de seleccionar un directorio o una lista de archivos individuales; sin embargo, esta última opción resultó ser impráctica, ya que era más conveniente preparar un directorio y ingresar su nombre que ingresar los nombres manualmente. En este momento, esta es la única forma recomendada de ingresar archivos en el programa.

```py
##################################################################
#                     Loading list of files                      #
##################################################################

companies = []  # empty list of companies

files_content = []  # empty content of files
for path in paths:  # for any path
    files_content.append(open(str(directory) + '/' + str(path), 'r').readlines())
    company = Company(path)  # create company
    companies.append(company)  # append to companies list
    print paths.index(path), path

print "Processing files"

```

Cuando el usuario especifica qué archivos deben ser cargados, su contenido se carga utilizando la función `open` y su método `readlines`. Para cada ruta de archivo, se crea una instancia de `Company` y se añade a la matriz de empresas (o, más generalmente, instrumentos financieros).

Si miramos la estructura del archivo `mst`, es la siguiente:

```csv
<TICKER>,<DTYYYYMMDD>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>
01CYBATON,20080415,4.48,4.48,3.76,4.08,13220
01CYBATON,20080416,4.24,4.24,3.84,4.16,1120
01CYBATON,20080417,4.08,4.40,4.08,4.08,7600
           ...

```

Dado que no necesitamos los encabezados para los cálculos, los eliminaremos de cada array que contenga la línea `file_content`.

```py
print "Cutting headers"

for file_content in files_content:  # removing headers
    file_content.pop(0)

```

Sin embargo, todavía hay un gran exceso de datos. Sobre todo, los nombres de las empresas son repetitivos, las fechas están en un formato difícil de procesar, los volúmenes no son necesarios en absoluto, y en lugar de los precios de apertura, máximo, mínimo y cierre, necesitamos un precio a partir del cual se calculará la correlación.

Para deshacernos de estos datos, creamos dos tablas: con fechas y precios.

```py
date = []
price = []

min_date = 99999999999  # searching min and max date common for companies
max_date = 0

epoch = datetime.datetime.utcfromtimestamp(0)

```

Las variables `max_date` y `min_date` nos permitirán seleccionar los límites del rango de fechas en el que podemos visualizar. Mencionaré de inmediato las limitaciones. La visualización no puede terminar antes del 1 de enero de 1970, porque ese día es el inicio de la cuenta regresiva del tiempo en segundos en los sistemas Unix. Y no puede empezar hace más de `min_date` días. No es una solución elegante, pero desde un punto de vista práctico, eso son más de 200 mil años, así que aunque no sea bonito, funciona bien.

```py
##################################################################
#           Loading files to memory                              #
##################################################################

print "Saving content"

for i in range(0, len(files_content)):  # for any file
    for line in files_content[i]:  # get line
        l = line.rstrip().split(',')  # split by coma
        date.append((datetime.datetime.strptime(l[1], "%Y%m%d").date() - epoch.date()).days)
        # append date in days form epoch to date array
        price.append(round(
            float(l[2]) * config.op +
            float(l[3]) * config.hi +
            float(l[4]) * config.lo +
            float(l[5]) * config.cl, 4))
        # and price as mean with proper weights to price array
    min_date = min(min_date, date[0])  # if there was no date before this one, set this date there
    max_date = max(max_date, date[-1])  # and in similar way set latest date

    companies[i].name = l[0]
    companies[i].dates = date
    companies[i].prices = price
    companies[i].min_date = date[0]
    companies[i].max_date = date[-1]

    date = []
    price = []
    print i + 1, "/", len(files_content)

if config.free_mem:
    files_content = []

```

Este fragmento de código es responsable de extraer un solo precio en lugar de cuatro y convertir la fecha a una fecha en días desde el 1 de enero de 1970. Los arreglos con estos valores únicos se guardan en variables temporales `price` y `date`, y luego en el arreglo de la clase `Company`. Al mismo tiempo, se anotan las fechas inicial y final para cada empresa, y se guarda el rango de fechas más amplio posible en `min_date` y `max_date`. Por defecto, al final de esta operación, limpiamos la memoria de la variable `files_content`.

Ha llegado el momento del último fragmento de interacción con el usuario. Ya han especificado los archivos de entrada. El programa ha examinado y procesado su contenido. Ahora es el momento de que el usuario decida qué período histórico desea observar.

```py
##################################################################
#           Selecting time of simulation                         #
##################################################################

print "Selecting time of visualisation: "
print "Time given is in days from 01.01.1970"
print "Company name         start of date      end of data"
min_max = max_date
max_min = min_date
for company in companies:
    min_max = min(min_max, company.max_date)
    max_min = max(max_min, company.min_date)
    print repr(company.name).ljust(25), repr(company.min_date).ljust(20), repr(company.max_date).ljust(20)
print "Union (at least one company on stock): ", min_date, max_date
print "Intersection (all companies on stock): ", max_min, min_max

min_user = raw_input("Set first day of simulation, ENTER - Intersection: ")
if len(min_user) == 0:
    min_user = max_min
else:
    min_user = int(min_user)
max_user = raw_input("Set last day of simulation, ENTER - Intersection: ")
if len(max_user) == 0:
    max_user = min_max
else:
    max_user = int(max_user)
memory = raw_input("Set range of calculating correlation, ENTER - 100: ")
if len(memory) == 0:
    memory = config.memory
else:
    memory = int(memory)

```

### Cálculo de la interpolación y correlación de precios

```py
##################################################################
#                    Interpolation of prices                     #
##################################################################

print "Prices are interpolated"

# print "min memm, max ",min_user, memory, max_user

for company in companies:
    for date in range(min_user - memory, max_user):
        if company.in_range(date):
            price = round(numpy.interp(date, company.dates, company.prices), 4)
        else:
            price = 0
        company.prices_evryday.append(price)
    print repr(company.vertex_id + 1).ljust(3), "/", repr(Company.vertex_id).ljust(6), repr(company.name).ljust(20)
    if config.free_mem:  # free memory
        company.dates = []
        company.prices = []

```

Otro problema a superar es la falta de continuidad en las cotizaciones. Hay días en los que la bolsa está cerrada. Para abordar esto en la clase `Company`, además del array `prices`, también hay un array llamado `prices_everyday`. Este almacena los precios interpolados de todos los precios y todas las fechas. Si una empresa no está cotizada, se registra `0` en el array `prices_everyday`. De esta manera, manejamos las longitudes desiguales de los períodos de negociación en los datos de entrada. Después de esta operación, los arrays con datos y precios ya no son necesarios. Podemos eliminarlos sin problemas. Si por alguna razón no queremos hacer esto, podemos establecer el parámetro `free_mem` en `0`. Sin embargo, por defecto, limpiamos la memoria de estos datos.

Teniendo los datos en una forma conveniente para los cálculos, podemos calcular correlaciones. Al igual que con la interpolación, el paquete **numpy** nos ayudará.

```py
##################################################################
#                    Calculation of correlations                 #
##################################################################

print "Calculating of correlation"

corr = []
line = []
correlations = []  # Huge layer matrix with any correlations,

numpy.seterr(divide='ignore', invalid='ignore')  # ignoring of warnings that we get
# calculating correlation on identical lists

for date in range(0, max_user - min_user):
    corr = numpy.corrcoef([company.prices_evryday[date:date + memory] for company in companies])
    correlations.append(corr)

```

Vale la pena señalar que el arreglo `company.prices_everyday` comienza en el momento `min_user - memory`, es decir, `memory` días antes de que ocurra la simulación. Por esta razón, el bucle para calcular correlaciones comienza en `0` y termina en `max_user-min_user`, es decir, `memory` índices antes del final del arreglo `company.prices_everyday`. En cada iteración del bucle, calculamos correlaciones desde el índice actual hasta el índice que está `memory` por delante.

Dentro del argumento de la función que calcula la correlación, iteramos sobre todas las compañías. Debe decirse que la sintaxis de `python` es muy concisa aquí, mientras sigue siendo bastante legible.

El producto de este paso es una matriz de correlación en capas, a la que nos referiremos a lo largo del programa.

### Manejo del Servidor Unigraph

En este punto, los cálculos llegan esencialmente a su fin, y los siguientes fragmentos de código estarán relacionados con el manejo de `unigraph`.

```py
##################################################################
#                  Creating matrix of connections                #
##################################################################

print "Initialisation of matrix of connection"

e = [[0 for x in range(Company.vertex_id)] for y in range(Company.vertex_id)]  # matrix of connections

```

Al principio, inicializamos una matriz de conexión vacía que representa la presencia o ausencia de correlación entre las cotizaciones de los instrumentos financieros.

```py
##################################################################
#              Creation of initial vertexes                      #
##################################################################


for ind in range(0, Company.vertex_id):
    if companies[ind].prices_evryday[0] != 0:
        G.new_vertex_w_id(ind)
        G.set_vertex_attribute(ind, 'label', companies[ind].name)

```

Creamos vértices para las empresas listadas desde el principio y les asignamos los nombres de las empresas como descripciones.

```py
##################################################################
#              Creation initial connections                      #
##################################################################

for ind1 in range(0, Company.vertex_id):
    for ind2 in range(ind1 + 1, Company.vertex_id):
        if correlations[0][ind1][ind2] >= config.boundary:
            e[ind1][ind2] = G.new_edge(ind1, ind2)

```

Iteramos sobre la matriz de adyacencia triangular de conexiones entre empresas, añadiendo conexiones si las correlaciones iniciales superan el valor de umbral establecido en la configuración. Y al final, realizamos una simulación:

```py
##################################################################
#      Visualization of dynamic correlation network              #
##################################################################

# for any time
for x in range(1, len(correlations)):
    # for any company
    for ind1 in range(0, Company.vertex_id):
        # if company starts be noted, create them
        if companies[ind1].prices_evryday[x - 1] == 0 and companies[ind1].prices_evryday[x] != 0:
            G.new_vertex_w_id(ind1)
            G.set_vertex_attribute(ind1, 'label', companies[ind1].name)
            print x, " (a):v ", ind1
        # for any company with index higher than last one
        for ind2 in range(ind1 + 1, Company.vertex_id):
            # if connection occurs, add this
            if correlations[x - 1][ind1][ind2] < config.boundary <= correlations[x][ind1][ind2]:
                e[ind1][ind2] = G.new_edge(ind1, ind2)
                print x, " (a):e ", ind1, ind2
            # if connection vanishes, delete this
            if correlations[x - 1][ind1][ind2] >= config.boundary > correlations[x][ind1][ind2]:
                G.remove_edge(e[ind1][ind2])
                print x, " (r):e ", ind1, ind2
            time.sleep(config.sleep)
        if companies[ind1].prices_evryday[x - 1] != 0 and companies[ind1].prices_evryday[x] == 0:
            G.remove_vertex(ind1)
            print x, " (r):v ", ind1

```

## Resumen

Eso es todo. La guinda del pastel resultó ser unas pocas líneas de código denso en comparación con las cientos de líneas que lucharon por entender las intenciones del usuario y extraer una estructura conveniente para realizar cálculos a partir de los datos de entrada.

Desafortunadamente, este es un problema grave que enfrenta toda la industria del análisis de datos. En muchos casos, los datos de entrada son tan inconvenientes que transformarlos en el formato deseado cuesta más esfuerzo que realizar realmente el análisis.

Sin embargo, la situación está mejorando. Las `APIs` cada vez son más comunes y la creciente popularidad del formato `json`, que está reemplazando lentamente a `xml` y `csv`, son pasos en la dirección correcta y facilitan el trabajo con datos.

![popularność json, xml, csv](http://i.imgur.com/OyhoigO.png)

Como siempre, te animo a comentar, expresar dudas y hacer preguntas.
