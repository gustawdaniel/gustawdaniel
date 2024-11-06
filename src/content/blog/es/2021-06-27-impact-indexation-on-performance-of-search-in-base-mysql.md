---
author: Daniel Gustaw
canonicalName: impact-indexation-on-performance-of-search-in-base-mysql
coverImage: http://localhost:8484/8bdad4d4-f0bb-4b99-9ffd-46f484807c2a.avif
description: El uso de índices acelera las búsquedas y aumenta el tamaño de la tabla, mientras que ralentiza las modificaciones. El artículo muestra cómo perfilar consultas y medir el impacto de los índices en el rendimiento de búsqueda.
excerpt: El uso de índices acelera las búsquedas y aumenta el tamaño de la tabla, mientras que ralentiza las modificaciones. El artículo muestra cómo perfilar consultas y medir el impacto de los índices en el rendimiento de búsqueda.
publishDate: 2021-06-27 17:40:00+00:00
slug: es/prueba-seleccion-velocidad
tags:
- mathematica
- mysql
- profiling
title: El impacto de la indexación en el rendimiento de búsqueda en la base de datos MySQL
updateDate: 2021-06-27 17:40:00+00:00
---

La búsqueda basada en claves es más rápida que la búsqueda por atributo regular. Nada revolucionario. Sin embargo, tenía curiosidad sobre la magnitud de estas diferencias. Preparé un experimento.

En este artículo, presentaré una comparación de la velocidad de búsqueda por **clave primaria** con la búsqueda por **atributo no indexado**. Veré cómo el traslado de la tabla a **memoria** afecta el rendimiento de búsqueda. También analizaré los resultados usando el software `Mathematica`.

Estructura del código

```
46% MySql 54% Mathematica
```

## Base de datos

Comenzaremos con el encabezado estándar asegurando la idempotencia. En MySql, esto es bastante simple.

```sql
DROP DATABASE IF EXISTS test;
CREATE DATABASE IF NOT EXISTS test;
USE test;
```

Crear una tabla única con una clave y un atributo regular

```sql
CREATE TABLE main(
  id INTEGER UNIQUE NOT NULL AUTO_INCREMENT PRIMARY KEY,
  value INTEGER
);
```

### Procedimientos de Inserción de Datos

Definimos un procedimiento para poblar la tabla con datos

```sql
drop procedure if exists load_data;

delimiter #
create procedure load_data(IN _max INTEGER)
begin

declare counter int unsigned default 0;

  truncate table main;
  start transaction;
  while counter < _max do
    set counter=counter+1;
    insert into main (value) values (counter);
  end while;
  commit;
end #

delimiter ;
```

Primero, eliminamos el procedimiento con ese nombre, si ya existía. En la siguiente línea, establecemos el terminador de comandos en `#`. De esta manera, la definición del procedimiento no se interrumpirá en medio por los punto y coma que ocurren allí. Nombramos nuestro procedimiento `load_data` y tiene un argumento entero: el número de filas para llenar la tabla. La línea que comienza con `declare` es responsable de establecer una variable local que almacena nuestro contador. Antes de comenzar la transacción, limpiamos la tabla que vamos a llenar. Dentro de la transacción, un bucle escribe valores del `1` al `_max` en la tabla. Al final, usamos el carácter `#` como un punto y coma y restauramos el punto y coma a su significado predeterminado. Bastante código para una operación tan simple. Sin embargo, el beneficio de esto es que ahora solo necesitamos escribir, por ejemplo:

```sql
call load_data(5);
```

la tabla se llenará con datos según nuestras expectativas

```sql
SELECT * FROM main;
+----+-------+
| id | value |
+----+-------+
|  1 |     1 |
|  2 |     2 |
|  3 |     3 |
|  4 |     4 |
|  5 |     5 |
+----+-------+
5 rows in set (0,00 sec)
```

Este procedimiento es muy conveniente porque te permite establecer cualquier tamaño de tabla, pero como estaremos probando tablas grandes y a menudo aumentando sus tamaños, agregaremos un procedimiento más limitado, pero más eficiente para nuestro caso que no elimina el arreglo, sino que lo llena con datos hasta el tamaño especificado.

```sql
drop procedure if exists add_data;

delimiter #
create procedure add_data(IN _max INTEGER)
begin

declare counter int unsigned;
SELECT COUNT(*) INTO counter FROM main;

  start transaction;
  while counter < _max do
    set counter=counter+1;
    insert into main (value) values (counter);
  end while;
  commit;
end #

delimiter ;
```

Ya no hay limpieza del contenido anterior de la tabla. El contador no acepta el valor predeterminado de `0`, en su lugar, utilizamos la declaración `SELECT ... INTO ...` que asigna el resultado de la selección a una variable.

Ahora ejecutar `call add_data(5)` no cambiará el estado de nuestra tabla, pero después de ejecutar `call add_data(10)`, el resultado será el mismo que después de `call load_data(10)`, excepto que ahorramos tiempo en eliminar e insertar 5 filas que ya estaban allí.

### Esquema de rendimiento

Tanto en `mysql` como en `mariadb`, la base de datos `performance_schema` se utiliza para analizar el rendimiento de las consultas. Puede suceder que su uso esté deshabilitado. Comprobaremos esto utilizando la variable `performance_schema`.

```
SELECT @@performance_schema;
```

Si se establece en el valor `0`, debe estar en el archivo de configuración:

```
sudo nvim /etc/my.cnf.d/server.cnf
```

agregar una línea:

```
performance_schema
```

en la sección:

```
[mysqld]
```

entonces reinicie la base de datos con el comando

```
sudo systemctl restart mysql
```

Si `SELECT @@performance_schema;` devuelve 1, significa que hemos activado este mecanismo, pero no es equivalente a la capacidad de realizar las mediciones que necesitamos. El mecanismo de registro puede ser muy complejo, y debemos configurarlo nosotros mismos por razones de rendimiento.

Las consultas sobre `setup_consumers` nos permitirán revisar la configuración actual.

```
SELECT NAME,ENABLED FROM performance_schema.setup_consumers;
```

```
+----------------------------------+---------+
| NAME                             | ENABLED |
+----------------------------------+---------+
| events_stages_current            | NO      |
| events_stages_history            | NO      |
| events_stages_history_long       | NO      |
| events_statements_current        | NO      |
| events_statements_history        | NO      |
| events_statements_history_long   | NO      |
| events_transactions_current      | NO      |
| events_transactions_history      | NO      |
| events_transactions_history_long | NO      |
| events_waits_current             | NO      |
| events_waits_history             | NO      |
| events_waits_history_long        | NO      |
| global_instrumentation           | YES     |
| thread_instrumentation           | YES     |
| statements_digest                | YES     |
+----------------------------------+---------+
```

y sobre la instrumentación de la tabla `setup_instruments`

```
SELECT NAME,ENABLED,TIMED FROM performance_schema.setup_instruments;
```

hay muchos resultados, por lo que nos limitaremos a:

```
SELECT NAME,ENABLED,TIMED FROM performance_schema.setup_instruments WHERE NAME LIKE '%long%';
```

```
+------------------------------------------------------------------+---------+-------+
| NAME                                                             | ENABLED | TIMED |
+------------------------------------------------------------------+---------+-------+
| statement/com/Long Data                                          | YES     | YES   |
| memory/performance_schema/events_stages_history_long             | YES     | NO    |
| memory/performance_schema/events_statements_history_long         | YES     | NO    |
| memory/performance_schema/events_statements_history_long.tokens  | YES     | NO    |
| memory/performance_schema/events_statements_history_long.sqltext | YES     | NO    |
| memory/performance_schema/events_transactions_history_long       | YES     | NO    |
| memory/performance_schema/events_waits_history_long              | YES     | NO    |
+------------------------------------------------------------------+---------+-------+
```

Queremos lograr una situación en la que, después de ejecutar la consulta:

```
select * from main WHERE value=5;
```

preguntan sobre

```
SELECT TIMER_WAIT FROM performance_schema.events_statements_history_long;
```

veremos la duración medida de la última consulta.

Para lograr esto, habilitaremos los consumidores `events_statements_history_long` y `events_statements_current` con la consulta:

```
UPDATE performance_schema.setup_consumers SET ENABLED = 'YES' WHERE NAME = 'events_statements_current' OR NAME = 'events_statements_history_long';
```

Ahora para la consulta:

```
SELECT * FROM performance_schema.setup_consumers;
```

debemos ver:

```
+----------------------------------+---------+
| NAME                             | ENABLED |
+----------------------------------+---------+
| events_stages_current            | NO      |
| events_stages_history            | NO      |
| events_stages_history_long       | NO      |
| events_statements_current        | YES     |
| events_statements_history        | NO      |
| events_statements_history_long   | YES     |
| events_transactions_current      | NO      |
| events_transactions_history      | NO      |
| events_transactions_history_long | NO      |
| events_waits_current             | NO      |
| events_waits_history             | NO      |
| events_waits_history_long        | NO      |
| global_instrumentation           | YES     |
| thread_instrumentation           | YES     |
| statements_digest                | YES     |
+----------------------------------+---------+
```

Y después de la ejecución

```
use test; SELECT * from main WHERE value=5;
```

y luego

```
SELECT SQL_TEXT,TIMER_WAIT FROM performance_schema.events_statements_history_long;
```

deberíamos ver la duración de la consulta expresada en picosegundos

![](http://localhost:8484/12605ada-a72e-49a9-a9fe-7bb0d3c392b0.avif)

Si el tema de la configuración del mecanismo de perfilado ha despertado su interés, puede profundizar su conocimiento directamente en la documentación:

[Descripción general del esquema de rendimiento](https://mariadb.com/kb/en/performance-schema-overview/)

### Procedimiento de prueba (InnoDB)

Ahora realizaremos pruebas. Nos interesan los tiempos de ejecución de selects por `id` y por `valor`.

```sql
select * from main WHERE id=5;
select * from main WHERE value=5;
```

El primero se llamará `time_id`, el segundo `time_val`, y el número de filas se llamará `counter`. Más tarde, queremos procesar los resultados de la prueba, así que crearemos una tabla especial para ellos.

```sql
CREATE TABLE IF NOT EXISTS result (
  counter INTEGER PRIMARY KEY,
  time_id DECIMAL(10,6),
  time_val DECIMAL(10,6)
);
```

Será el procedimiento responsable de su finalización, que desglosaremos en varias partes. Aquí está su inicio.

```sql
drop procedure if exists time_of_select;

delimiter #
create procedure time_of_select(IN _max INTEGER, IN _step INTEGER)
begin
    declare counter int unsigned DEFAULT 0;
    declare temp_id int unsigned DEFAULT 0;
    declare temp_value int unsigned DEFAULT 0;
    declare time_id DECIMAL(10,6);
    declare time_val DECIMAL(10,6);
```

Empieza como todos los demás - despejando espacio para sí mismo, estableciendo el nuevo signo de comando en `#`, eligiendo un nombre, argumentos y declarando variables locales. Los argumentos son el tamaño máximo de la tabla para la que queremos probar y el paso que debe realizar nuestro contador. Las variables locales se utilizan para la iteración - `counter`, prevenir la visualización de datos innecesarios `temp_id` y `temp_value`, y almacenar los resultados de las mediciones de tiempo - `time_id` y `time_val`. Luego está la limpieza de tablas.

```sql
    truncate table result;
    call load_data(0);
```

Tenga en cuenta que `call load_data(0)` es equivalente al comando `truncate table main`. Después de limpiar todos los datos, podemos comenzar a ejecutar el bucle.

```sql
    while counter < _max do
        set counter=counter+_step;
        call add_data(counter);
```

Incrementamos el contador y agregamos filas a la tabla `main`.

```sql
        truncate performance_schema.events_statements_history_long;
        RESET QUERY CACHE;
```

Borrar el historial de medición de rendimiento y restablecer la caché.

```sql
        select * INTO temp_id, temp_value from main WHERE id=counter;
        select * INTO temp_id, temp_value from main WHERE value=counter;
```

Realizamos las selecciones que queremos probar. Para evitar desordenar nuestra pantalla, las redirigimos a variables locales con las que ya no haremos nada. Ahora la parte más interesante: medir el rendimiento:

```sql
        SELECT TRUNCATE(TIMER_WAIT/1000000000000,6) INTO time_id
             FROM performance_schema.events_statements_history_long WHERE SQL_TEXT like '%id=%';
        SELECT TRUNCATE(TIMER_WAIT/1000000000000,6) INTO time_val
             FROM performance_schema.events_statements_history_long WHERE SQL_TEXT like '%value=%';
```

Este es un nuevo método [recomendado](http://dev.mysql.com/doc/refman/5.6/en/performance-schema-query-profiling.html) para medir el rendimiento ya que `SET profiling = 1;` ya está [obsoleto](http://stackoverflow.com/questions/11274892/measuring-actual-mysql-query-time). Teniendo todos los parámetros necesarios, los añadimos a la tabla `result`, los mostramos y concluimos la definición del procedimiento de la manera estándar.

```sql
        INSERT INTO result (counter, time_id, time_val) VALUES (counter,time_id,time_val);

        SELECT counter/_max "state", counter, time_id, time_val;
    end while;
end #

delimiter ;
```

Exactamente 4 horas, 40 minutos me llevó ejecutar el procedimiento `call time_of_select(25000000,10000)`, lo que significa tomar mediciones para una tabla de tamaño desde 10 mil a 25 millones de registros con un paso de 10 mil.

### Prueba del motor MEMORY

Para poder regresar a estos datos y realizar mediciones en una tabla almacenada en RAM sin ningún cambio en el código del procedimiento, reescribiremos nuestros resultados en una nueva tabla.

```sql
CREATE TABLE IF NOT EXISTS innoDB_result (
  counter INTEGER PRIMARY KEY,
  time_id DECIMAL(10,6),
  time_val DECIMAL(10,6)
) AS SELECT * FROM result LIMIT 2500;

```

Y configuraremos nuestra tabla `result` desde cero esta vez en RAM.

```sql
DROP TABLE main;

CREATE TABLE main(
  id INTEGER UNIQUE NOT NULL AUTO_INCREMENT PRIMARY KEY,
  value INTEGER
) ENGINE=MEMORY;
```

Si activáramos el procedimiento de prueba en este momento, recibiríamos el siguiente error después de 8 segundos:

```
ERROR 1114 (HY000): The table 'main' is full
```

Esto es así porque por defecto `MySQL` tiene el tamaño de las tablas en memoria `RAM` establecido en 16 MB. Podemos verificar esto escribiendo

```
SELECT max_heap_table_size;
```

Lo cambiaremos con el comando:

```sql
SET max_heap_table_size = 2048*1024*1024;
```

Lo que en caso establece 2 GB de RAM para la base de datos. Y aquí surge la pregunta de dónde obtuve exactamente 2 GB. Admito honestamente que no sabía en el momento de escribir este artículo. Esta tabla en disco ocupó 930.72 MB para mí, así que pensé que 1 GB de RAM debería ser suficiente, pero resultó que después de ser guardada en memoria, su tamaño aumentó a 1538.54 MB. Hice una pregunta sobre esto en [stack](http://dba.stackexchange.com/questions/157525/difference-between-size-of-table-saved-on-hard-drive-or-in-ram-how-to-calculate). Resultó que `InnoDB` almacena datos en `BTree` mientras que `MEMORY` utiliza `Hash`, lo que reduce significativamente la capacidad de comprimir claves en la tabla mantenida en RAM. Ahora las pruebas deberían ir sin problemas. Podemos reiniciar el procedimiento de prueba.

```
call time_of_select(25000000,10000)
```

Esta vez la prueba duró 46 minutos.

La tabla `main` ya no nos interesará. Para liberar memoria, podemos eliminarla.

```sql
DROP TABLE main;
```

Después de estas operaciones, tenemos la siguiente situación: quedan dos tablas en la base de datos, `innoDB_result` para el motor `innoDB` y `result` para el motor `MEMORY`. No utilizaremos MySQL para su análisis. Podemos cerrar la conexión a la base de datos.

## Análisis de Datos

Para el análisis de datos, utilizaremos el programa `Mathematica` de `Wolfram Research`. Este programa se puede utilizar de dos maneras: escribiendo en cuadernos (como una hoja de cálculo) y escribiendo paquetes y scripts ejecutables desde la consola. Los paquetes y scripts son archivos de texto puro que son adecuados para mantener en un repositorio. Desafortunadamente, los cuadernos [no](http://mathematica.stackexchange.com/questions/26174/recommended-settings-for-git-when-using-with-mathematica-projects). Los cuadernos son adecuados para desarrollar código y calcular algo que se va a calcular una vez, mientras que los paquetes y scripts son para uso múltiple y automatización. En nuestro caso, la herramienta apropiada será un cuaderno. Por lo tanto, comenzaremos a escribir en un nuevo cuaderno.

### Visualización de Datos desde la Base de Datos

Para conectarnos a la base de datos, importamos el paquete correspondiente.

```
Needs["DatabaseLink`"]
```

Y establecemos la variable que contiene la conexión

```
conn = OpenSQLConnection[
  JDBC["MySQL(Connector/J)", "127.0.0.1:3306/test"],
  "Username" -> "root", "Password" -> ""]
```

Extraemos los datos de interés de la base de datos.

```
counterTimeIdInnoDB = SQLExecute[conn, "SELECT counter, time_id FROM innoDB_result"];
counterTimeValInnoDB = SQLExecute[conn, "SELECT counter, time_val FROM innoDB_result"];
counterTimeIdMemory = SQLExecute[conn, "SELECT counter, time_id FROM result"];
counterTimeValMemory = SQLExecute[conn, "SELECT counter, time_val FROM result"];
```

Y pasamos inmediatamente a dibujar el gráfico.

```
ListPlot[{counterTimeIdInnoDB, counterTimeIdMemory},
 PlotLabel ->
  "Time of SELECT using PRIMARY KEY for InnoDB and MEMORY engines for \
different number of rows.",
 PlotLegends ->
  Placed[SwatchLegend[{"InnoDB", "MEMORY"},
    LegendMarkerSize -> {30, 30}], {0.5, 0.25}],
 AxesLabel -> {"Rows", "Time[s]"} , BaseStyle -> {FontSize -> 14},
 ImageSize -> 1200]
Export["plotId.png", %];
```

![](http://localhost:8484/845a64eb-b6e9-449c-8c56-9bb9ccd72edc.avif)

Vemos que tanto para `InnoDB` como para `MEMORY`, la velocidad de selección por identificador no depende del número de registros en la base de datos para nuestro rango. Ciertamente, esta no es una dependencia que se pueda discernir del ruido presente aquí. Es evidente que para la tabla en memoria, las selecciones se realizan más rápido y su tiempo de ejecución es más regular. La situación es completamente diferente para los atributos no indexados.

```
ListPlot[{counterTimeValInnoDB, counterTimeValMemory},
 PlotLabel ->
  "Time of SELECT using not indexed attribute for InnoDB and MEMORY \
engines for different number of rows.",
 PlotLegends ->
  Placed[SwatchLegend[{"InnoDB", "MEMORY"},
    LegendMarkerSize -> {30, 30}], {0.5, 0.25}],
 AxesLabel -> {"Rows", "Time[s]"} , BaseStyle -> {FontSize -> 14},
 ImageSize -> 1200]
Export["plotVal.png", %];
```

![](http://localhost:8484/f35404ce-0d52-4e75-9ee3-2844dcfe21e8.avif)

El tiempo para seleccionar un atributo no indexado aumenta linealmente con el tamaño de la base de datos. Aquí también, la tabla almacenada en memoria opera más rápido.

Gracias al ajuste lineal utilizando el comando `Fit[counterTimeValInnoDB, {x}, x]`, vemos que la pendiente para la tabla en disco es `3.06e-7`, lo que significa que toma 0.3 segundos buscar un millón de registros. Calcular la pendiente para el motor `MEMORY` con el comando `Fit[counterTimeValMemory, {x}, x]` nos da `6.46e-8`, o 0.06 segundos para un millón de registros, lo que es 4.7 veces más corto.

### Histograma

Regresamos a la selección por claves. Dado que en ese caso la dependencia del tiempo no era visible, reduzcamos esta variable y echemos un vistazo al histograma que muestra el número de conteos cuyo tiempo de ejecución cayó dentro de un cierto rango. El siguiente código es responsable del dibujo.

```
timeIdInnoDB = Transpose[counterTimeIdInnoDB][[2]];
timeIdMemory = Transpose[counterTimeIdMemory][[2]];
Histogram[{Flatten[timeIdInnoDB],
  Flatten[timeIdMemory]}, {90, 180, 1}*10^-6,
 PlotLabel ->
  "Histogram of times of select by PRIMARY KEY for different times \
(from 90\[Mu]s to 180\[Mu]s with step 1\[Mu]s)",
 AxesLabel -> {"Time[s]", "Count"} ,
 ChartLegends ->
  Placed[SwatchLegend[{"InnoDB", "MEMORY"},
    LegendMarkerSize -> {30, 30}], {0.5, 0.75}],
 BaseStyle -> {FontSize -> 14},
 ChartStyle -> ColorData[97, "ColorList"], ImageSize -> 1200]
Export["histogram.png", %];
```

![](http://localhost:8484/45e6712c-528f-4841-82df-1e26739e11ac.avif)

### Modelo

No conozco el mecanismo responsable de esta distribución lo suficiente. Conocerlo me permitiría elegir el modelo matemático apropiado que podría ajustarse a los datos. Por esta razón, la siguiente parte es el ajuste de una distribución que solo se asemeja de manera aproximada a la actual. Comenzamos recortando los datos para el ajuste del modelo.

```
dataInnoDB = Transpose[{Range[0.5, 299.5],
    BinCounts[Flatten[timeIdInnoDB], {0, 300, 1}*10^-6]}];
dataMemory = Transpose[{Range[0.5, 299.5],
    BinCounts[Flatten[timeIdMemory], {0, 300, 1}*10^-6]}];
```

Estas tablas contienen tiempo convertido a microsegundos y los conteos correspondientes en esos momentos del tiempo. El desplazamiento de 0.5 resulta del hecho de que el intervalo de 0 a 1 corresponde al punto 0.5. Luego postulamos un modelo.

```
model = c HeavisideTheta[x - a] (x - a)*Exp[-b (x - a)];
```

Como mencioné, este no es un modelo inferido de las propiedades de la implementación de bases de datos de bajo nivel, sino más bien el primer modelo simple que se me ocurrió. Cuando tenemos datos y un modelo, lo único que queda es calcular sus coeficientes. Las líneas responsables de esto son:

```
lineInnoDB =
 FindFit[dataInnoDB, model, { {a, 120}, {b, 0.2}, {c, 100} }, x]
lineMemory =
 FindFit[dataMemory, model, { {a, 100}, {b, 0.8}, {c, 100} }, x]
```

Los coeficientes que obtuvimos son respectivamente

```
{a -> 126.08, b -> 0.212895, c -> 102.94}
```

para `InnoDB` y

```
{a -> 99.4551, b -> 0.836701, c -> 1587.85}
```

para `MEMORIA`. Solo queda el dibujo del gráfico que compara las curvas ajustadas con los datos experimentales. El comando `Mostrar` se utiliza para combinar gráficos de diferentes tipos, su sintaxis es la siguiente:

```
Show[ListPlot[{dataInnoDB, dataMemory}, Filling -> Axis,
  PlotRange -> All, PlotMarkers -> {"\[FilledCircle]", 4},
  PlotLegends ->
   Placed[SwatchLegend[{"InnoDB", "MEMORY"},
     LegendMarkerSize -> {30, 30}], {0.5, 0.75}]],
 Plot[{model /. lineInnoDB, model /. lineMemory}, {x, 0, 300},
  PlotRange -> All], AxesLabel -> {"Time[\[Mu]s]", "Count"},
 PlotLabel ->
  "Histogram of times of selects execution with curves fitted for \
model c HeavisideTheta[x-a](x-a)*Exp[-b(x-a)]",
 BaseStyle -> {FontSize -> 14}, ImageSize -> 1200]
Export["model.png", %]
```

![](http://localhost:8484/9c843764-e061-4469-b638-772a2bfee396.avif)

Esto es solo el comienzo de mi viaje con bases de datos y todavía tengo solo un conocimiento superficial de este tema. Por esta razón, las entradas relacionadas con bases de datos deben ser tratadas más como notas de estudiante que como consejos de experto. Sin embargo, espero que el tiempo dedicado a la lectura se haya traducido en una mejor comprensión de los aspectos cuantitativos relacionados con el rendimiento de la indexación.

Finalmente, agradezco a [Rick James](http://dba.stackexchange.com/users/1876/rick-james) por responder prácticamente cada pregunta que he hecho hasta ahora en [dba.stackexchange.com](http://dba.stackexchange.com).
