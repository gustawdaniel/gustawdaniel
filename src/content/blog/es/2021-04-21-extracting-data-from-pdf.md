---
author: Daniel Gustaw
canonicalName: extracting-data-from-pdf
coverImage: http://localhost:8484/a99f6a5c-e91a-44b1-a1c9-e52bdefa6c45.avif
description: En este artículo, mostraremos cómo extraer datos de archivos PDF de manera conveniente escribiendo muy poca cantidad de código.
excerpt: En este artículo, mostraremos cómo extraer datos de archivos PDF de manera conveniente escribiendo muy poca cantidad de código.
publishDate: 2021-04-21 18:45:26+00:00
slug: es/exprimir-datos-de-pdf-como-jugo-de-limon
tags:
- pdf
title: Exprimimos datos de PDF como el jugo de un limón.
updateDate: 2021-04-21 18:45:26+00:00
---

Los datos son todo lo que se puede procesar mentalmente o a través de una computadora. En el procesamiento informático, algunas formas de grabación son más o menos convenientes. Por ejemplo, el PDF se considera un formato conveniente para los humanos, pero a menudo subestimamos las capacidades de las máquinas para automatizar procesos basados en archivos PDF.

En esta publicación, mostraremos cómo, escribiendo cantidades realmente mínimas de código, puedes extraer datos de archivos PDF de manera conveniente. Por ejemplo, utilizaremos boletos de tren, ya que no contienen ningún dato confidencial, pero también podrían ser facturas, contratos o archivos de CV.

![](http://localhost:8484/97f6f2a3-ee40-4587-9856-b4e0acae8f3d.avif)

**Adquisición de datos**

```
bilet pkp has:attachment -in:chats from:bilet.eic@intercity.pl to:me
```

Aquí está la vista que veo después de filtrar:

![](http://localhost:8484/197afc96-cebe-47bb-9bc8-7728243c3c48.avif)

Ahora solo era necesario descargar los archivos para poder procesarlos.

Guardé todos los archivos adjuntos en el disco duro en el directorio ocr. Como en cada publicación de este blog, las operaciones posteriores se realizarán en el sistema Ubuntu.

## **Procesando PDF a texto**

Comenzaremos por determinar el contenido inicial del directorio. Está lleno de archivos PDF.

![](http://localhost:8484/cf76fa1a-ff0b-4b1c-be71-57d00a51eddb.avif)

Gracias a la herramienta `pdftotext` del paquete `poppler-utils`, podemos extraer información de interés de archivos PDF en forma de texto plano. Podemos instalar esta herramienta con el siguiente comando:

```
sudo apt-get install poppler-utils
```

Para usarlo, usamos la sintaxis

```
pdftotext {PDF-file} {text-file}
```

En nuestro caso, tenemos muchos archivos de entrada y salida, por lo que usaremos `xargs`.

```
ls eic_*.pdf | xargs -i pdftotext "{}";
```

El comando consta de dos partes. En la primera parte, enumero todos los archivos que comienzan con `eic` y terminan con `.pdf`. Luego, utilizando el programa `xargs`, paso el flujo de datos resultante línea por línea al comando `pdftotext`. La ausencia de un segundo argumento significa que, en mi caso, los archivos de texto fueron creados con los mismos nombres que los archivos `pdf`.

Podemos verificar fácilmente si realmente existen usando el comando `ls`.

![](http://localhost:8484/3e37bea4-5125-4ec4-99eb-f0216fcf4add.avif)

**Estructuración de Datos**

```
ls eic_*.txt | xargs -i cat "{}" | perl -ne 'if(/SUMA PLN: (.*) zł/){print "$1\n";}' | tr , . | paste -sd+ | bc
```

Esta línea devolvió `786.11`, que es el costo de todos los boletos.

![](http://localhost:8484/e65863c8-b467-4dd1-ba24-5ff7657017c4.avif)

Ahora profundicemos y veamos qué hay detrás. Mostraremos uno de los archivos de texto con el comando `cat eic_67584344.txt`:

```
BILET INTERNETOWYTANIOMIASTOWY

"PKP Intercity"
Spółka Akcyjna

OF: 503

NORMAL. : 1
ULG. :
X : X

Przewoźnik: PKP IC
A-Cena bazowa: 1xNormal

¦ ¸

Od/From

27.09 05:50 Iława Gł.
*
*
*
PRZEZ: Działdowo * Nasielsk

Do/To

¦ ¸

KL./CL.

Warszawa C.
*

27.09 07:50
*
*

2
*

SUMA PLN: 39,90 zł
519836278964

Nr transakcji:

Informacje o podróży:
Stacja
Data Godzina
Iława Gł.
27.09 05:50
Warszawa C.
27.09 07:50

/Wagon K m
IC 5324
208
5

eIC67584344

Nr miejsca (o-okno ś-środek k-korytarz) Suma PLN
81 o
39,90 zł
1 m. do siedzenia; wagon bez przedziałów

d9U
Podróżny:
PTU
8%

Suma PLN Płatność: przelewem
39,90 Zapłacono i wystawiono dnia:
2018-09-26 09:01:20(52245592)

Ogółem PLN:

39,90

Niniejszy bilet internetowy nie jest fakturą VAT.
W związku z przeprowadzanymi modernizacjami sieci kolejowej, uprzejmie prosimy o
dokładne sprawdzanie rozkładu jazdy pociągów przed podróżą.

Data wydruku: 2018-09-26 09:01:57

5324

Bilet internetowy jest biletem imiennym i jest ważny:
a) wraz z dokumentem ze zdjęciem potwierdzającym tożsamość Podróżnego,
b) tylko w dniu, relacji, pociągu, wagonie i na miejsce na nim oznaczone.

Zwrotu należności za niewykorzystany bilet dokonuje się na podstawie wniosku
złożonego przez płatnika w wyznaczonych przez 'PKP Intercity' S.A. punktach, z
wyjątkiem należności zwracanych automatycznie na zasadach określonych w
Regulaminie e-IC.

Daniel Gustaw

d9U

Informacja o cenie
Opłata za przejazd:

(P24) 7219
```

Lo primero que viene a la mente es que el archivo contiene toda la información en una forma inalterada. No hay errores tipográficos, errores o transposiciones típicas de los sistemas OCR que realizan tareas similares en escaneos de documentos. El precio `39.90 zł` aparece varias veces en este texto. A veces aparece junto con `zł`, a veces no; el arreglo de la línea puede diferir si varias personas están viajando con el billete. Estamos buscando el patrón más confiable. Es `SUMA PLN: 39.90 zł`. Ahora queremos extraer `39.90` de este archivo. `perl` nos ayudará con esto: un lenguaje creado por el lingüista Larry Wall específicamente para trabajar con archivos de texto.

```
$ cat eic_67584344.txt | perl -ne 'if(/SUMA PLN: (.*) zł/){print "$1\n";}'
39,90
```

Este comando se puede explicar de la siguiente manera:

* toma el archivo `eic_67584344.txt`
* redirige todo su contenido al programa que escribimos en `perl` como entrada
* el programa realiza el mismo comando en cada línea de texto
* verifica si el texto coincide con el patrón que comienza con `SUMA PLN:` y termina con `zł`.
* si es así, extrae el valor entre estas cadenas y lo devuelve

El problema que tenemos es la `,` polaca en lugar del `.` utilizado globalmente. Este problema se puede eliminar fácilmente con el comando `tr` que reemplaza su primer argumento por el segundo.

![](http://localhost:8484/d12a72a6-1834-461a-81e9-3b7b89753873.avif)

Por supuesto, no repetiremos estos comandos para cada archivo individualmente. En su lugar, reutilizaremos el ya conocido `xargs`.

```
$ ls eic_*.txt | xargs -i cat "{}" | perl -ne 'if(/SUMA PLN: (.*) zł/){print "$1\n";}' | tr , .
39.90
63.00
15.14
55.00
60.00
186.00
70.56
89.40
139.00
68.11
```

Nos permitió buscar archivos de texto usando filtros definidos archivo por archivo. Una cosa interesante es que el `"{}"` utilizado representa el argumento que se pasó a `xargs`.

Solo queda la suma, pero sumar columnas de un archivo de texto es fácil en la consola `bash`. En el caso de una sola columna, ni siquiera necesitamos ejecutar `awk` - un programa avanzado de procesamiento de texto. Solo necesitamos `paste` - un programa para fusionar archivos y `bc`, un programa simple para calcular sumas.

Usando `paste` con la opción `-s`, transpondremos a una línea. Con la opción `d`, estableceremos el separador. Por supuesto, será el signo de adición `+`. El resultado se ve algo así:

![](http://localhost:8484/f286948c-7e71-4731-9b99-17f037f74813.avif)

La pieza final `bc` completa la tarea, pero se presentó al principio:

```
$ ls eic_*.txt | xargs -i cat "{}" | perl -ne 'if(/SUMA PLN: (.*) zł/){print "$1\n";}' | tr , . | paste -sd+ | bc
786.11
```

## **Visualización de Resultados**

```
wget https://github.com/marianogappa/chart/releases/download/v3.0.0/chart_3.0.0_linux_amd64.tar.gz -O /tmp/chart.tar.gz
```

Y desempacamos

```
tar -xvf /tmp/chart.tar.gz --directory /usr/local/bin
```

Otro comando, añade números de columna `cat -n` y dibuja un gráfico

```
ls eic_*.txt | xargs -i cat "{}" | perl -ne 'if(/SUMA PLN: (.*) zł/){print "$1\n";}' | tr , . | cat -n | chart line
```

![](http://localhost:8484/2b9c9215-df7b-4b23-a5d0-ef72ccf84fad.avif)

En resumen. No trabajamos demasiado aquí, pero ese era el objetivo. Mostrar cómo una línea de código puede resumir precios o dibujar un gráfico a partir de datos que parecen no estar disponibles porque su formato no es tan obvio como en el caso de datos organizados almacenados en una estructura de base de datos bien definida.

Si deseas ampliar tus conocimientos y familiarizarte con las herramientas que utilizamos, puedes encontrar enlaces a ellas a continuación:

Limpieza de datos

[https://en.wikipedia.org/wiki/Data\_cleansing](https://en.wikipedia.org/wiki/Data_cleansing)

Convertidor de Pdf a Texto

[https://www.cyberciti.biz/faq/converter-pdf-files-to-text-format-command/](https://www.cyberciti.biz/faq/converter-pdf-files-to-text-format-command/)

Ejemplo de uso de xargs

[https://stackoverflow.com/questions/33141207/what-is-the-working-of-this-command-ls-xargs-i-t-cp-1](https://stackoverflow.com/questions/33141207/what-is-the-working-of-this-command-ls-xargs-i-t-cp-1)

Gráfico - una herramienta para dibujar gráficos

[https://marianogappa.github.io/chart/](https://marianogappa.github.io/chart/)

Pegar - comando para fusionar archivos

[https://www.geeksforgeeks.org/paste-command-in-linux-with-examples/](https://www.geeksforgeeks.org/paste-command-in-linux-with-examples/)

Ejemplos de one-liners en Perl

[https://www.rexegg.com/regex-perl-one-liners.html](https://www.rexegg.com/regex-perl-one-liners.html)
