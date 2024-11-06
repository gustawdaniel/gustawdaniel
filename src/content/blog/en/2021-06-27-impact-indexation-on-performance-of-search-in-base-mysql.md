---
author: Daniel Gustaw
canonicalName: impact-indexation-on-performance-of-search-in-base-mysql
coverImage: http://localhost:8484/8bdad4d4-f0bb-4b99-9ffd-46f484807c2a.avif
description: Using indexes speeds up searches and increases table size while slowing down modifications. The article shows how to profile queries and measure the impact of indexes on search performance.
excerpt: Using indexes speeds up searches and increases table size while slowing down modifications. The article shows how to profile queries and measure the impact of indexes on search performance.
publishDate: 2021-06-27 17:40:00+00:00
slug: en/testing-selection-speed
tags:
- mathematica
- mysql
- profiling
title: The impact of indexing on search performance in MySQL database
updateDate: 2021-06-27 17:40:00+00:00
---

Key-based searching is faster than searching by regular attribute. Nothing groundbreaking. However, I was curious about the extent of these differences. I prepared an experiment.

In this article, I will present a comparison of search speed by **primary key** with searching by **non-indexed attribute**. I will check how moving the table to **memory** affects search performance. I will also analyze the results using `Mathematica` software.

Code structure

```
46% MySql 54% Mathematica
```

## Database

We will start with the standard header ensuring idempotence. In MySql this is quite simple.

```sql
DROP DATABASE IF EXISTS test;
CREATE DATABASE IF NOT EXISTS test;
USE test;
```

Creating a single table with a key and a regular attribute

```sql
CREATE TABLE main(
  id INTEGER UNIQUE NOT NULL AUTO_INCREMENT PRIMARY KEY,
  value INTEGER
);
```

### Data Insertion Procedures

We define a procedure for populating the table with data

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

First, we removed the procedure by that name, if it already existed. In the next line, we set the command terminator to `#`. This way, the procedure definition won't be interrupted in the middle by the semicolons occurring there. We named our procedure `load_data` and it has one integer argument - the number of rows to fill the table. The line starting with `declare` is responsible for setting a local variable that stores our counter. Before starting the transaction, we clear the table we will be filling. Inside the transaction, a loop writes values from `1` to `_max` into the table. At the end, we use the `#` character as a semicolon and restore the semicolon to its default meaning. Quite a lot of code for such a simple operation. However, the benefit of this is that now we only need to type, for example:

```sql
call load_data(5);
```

the table will be filled with data according to our expectations

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

This procedure is very convenient because it allows you to set any table size, but because we will be testing large tables and often increasing their sizes, we will add a more limited, but more efficient procedure for our case that does not delete the array, but instead fills it with data to the specified size.

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

There is no longer any cleaning of the previous content of the table. The counter does not accept the default value of `0`, instead, we used the `SELECT ... INTO ...` statement which assigns the result of the select to a variable.

Now executing `call add_data(5)` will not change the state of our table, but after executing `call add_data(10)`, the result will be the same as after `call load_data(10)`, except that we saved time on deleting and inserting 5 rows that were already there.

### Performance Schema

Both in `mysql` and `mariadb`, the `performance_schema` database is used to analyze query performance. It may happen that its usage is disabled. We will check this using the `performance_schema` variable.

```
SELECT @@performance_schema;
```

If set to the value `0`, it should be in the configuration file:

```
sudo nvim /etc/my.cnf.d/server.cnf
```

add a line:

```
performance_schema
```

in the section:

```
[mysqld]
```

then restart the database with the command

```
sudo systemctl restart mysql
```

If `SELECT @@performance_schema;` returns 1, it means that we have activated this mechanism, but it is not equivalent to the ability to perform the measurements we need. The logging mechanism can be very complex, and we must configure it ourselves for performance reasons.

Queries about `setup_consumers` will allow us to review the current settings.

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

and about the instrumentation from the `setup_instruments` table

```
SELECT NAME,ENABLED,TIMED FROM performance_schema.setup_instruments;
```

there are a lot of results, so we will limit ourselves to:

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

We want to bring about a situation where after executing the query:

```
select * from main WHERE value=5;
```

they ask about

```
SELECT TIMER_WAIT FROM performance_schema.events_statements_history_long;
```

we will see the measured duration of the last query.

To achieve this, we will enable the consumers `events_statements_history_long` and `events_statements_current` with the query:

```
UPDATE performance_schema.setup_consumers SET ENABLED = 'YES' WHERE NAME = 'events_statements_current' OR NAME = 'events_statements_history_long';
```

Now for the query:

```
SELECT * FROM performance_schema.setup_consumers;
```

we should see:

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

And after execution

```
use test; SELECT * from main WHERE value=5;
```

and then

```
SELECT SQL_TEXT,TIMER_WAIT FROM performance_schema.events_statements_history_long;
```

we should see the duration of the query expressed in picoseconds

![](http://localhost:8484/12605ada-a72e-49a9-a9fe-7bb0d3c392b0.avif)

If the topic of profiling mechanism configuration has piqued your interest, you can deepen your knowledge directly in the documentation:

[Performance Schema Overview](https://mariadb.com/kb/en/performance-schema-overview/)

### Testing Procedure (InnoDB)

We will now perform tests. We are interested in the execution times of selects by `id` and by `value`.

```sql
select * from main WHERE id=5;
select * from main WHERE value=5;
```

The first one will be named `time_id`, the second `time_val`, and the number of rows will be called `counter`. Later, we will want to process the test results, so we will create a special table for them.

```sql
CREATE TABLE IF NOT EXISTS result (
  counter INTEGER PRIMARY KEY,
  time_id DECIMAL(10,6),
  time_val DECIMAL(10,6)
);
```

It will be the procedure responsible for its completion, which we will break down into several parts. Here is its beginning.

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

It starts like all the others - clearing space for itself, setting the new command sign to `#`, choosing a name, arguments, and declaring local variables. The arguments are the maximum table size for which we want to test, and the step that our counter should perform. Local variables are used for iteration - `counter`, prevent the display of unnecessary data `temp_id` and `temp_value`, and store the results of time measurements - `time_id` and `time_val`. Then there is the clearing of tables.

```sql
    truncate table result;
    call load_data(0);
```

Note that `call load_data(0)` is equivalent to the command `truncate table main`. After clearing all data, we can start running the loop.

```sql
    while counter < _max do
        set counter=counter+_step;
        call add_data(counter);
```

We increment the counter and add rows to the `main` table.

```sql
        truncate performance_schema.events_statements_history_long;
        RESET QUERY CACHE;
```

Clearing the performance measurement history and resetting the cache.

```sql
        select * INTO temp_id, temp_value from main WHERE id=counter;
        select * INTO temp_id, temp_value from main WHERE value=counter;
```

We perform the selects that we want to test. To avoid cluttering our screen, we redirect them to local variables that we won't do anything with anymore. Now the most interesting part - measuring performance:

```sql
        SELECT TRUNCATE(TIMER_WAIT/1000000000000,6) INTO time_id
             FROM performance_schema.events_statements_history_long WHERE SQL_TEXT like '%id=%';
        SELECT TRUNCATE(TIMER_WAIT/1000000000000,6) INTO time_val
             FROM performance_schema.events_statements_history_long WHERE SQL_TEXT like '%value=%';
```

This is a new [recommended](http://dev.mysql.com/doc/refman/5.6/en/performance-schema-query-profiling.html) method for measuring performance since `SET profiling = 1;` is already [deprecated](http://stackoverflow.com/questions/11274892/measuring-actual-mysql-query-time). Having all the necessary parameters, we append them to the `result` table, display them, and conclude the procedure definition in the standard way.

```sql
        INSERT INTO result (counter, time_id, time_val) VALUES (counter,time_id,time_val);

        SELECT counter/_max "state", counter, time_id, time_val;
    end while;
end #

delimiter ;
```

Exactly 4 hours, 40 minutes it took me to execute the procedure `call time_of_select(25000000,10000)`, which means taking measurements for a table sized from 10 thousand to 25 million records with a step of 10 thousand.

### Testing the MEMORY Engine

To be able to return to this data and perform measurements on a table stored in RAM without any changes to the procedure code, we will rewrite our results to a new table.

```sql
CREATE TABLE IF NOT EXISTS innoDB_result (
  counter INTEGER PRIMARY KEY,
  time_id DECIMAL(10,6),
  time_val DECIMAL(10,6)
) AS SELECT * FROM result LIMIT 2500;

```

And we will set up our `result` table from scratch this time in RAM.

```sql
DROP TABLE main;

CREATE TABLE main(
  id INTEGER UNIQUE NOT NULL AUTO_INCREMENT PRIMARY KEY,
  value INTEGER
) ENGINE=MEMORY;
```

If we were to activate the testing procedure at this moment, we would receive the following error after 8 seconds:

```
ERROR 1114 (HY000): The table 'main' is full
```

It is so because by default `MySQL` has the size of tables in memory `RAM` set to 16 MB. We can check this by typing

```
SELECT max_heap_table_size;
```

We will change it with the command:

```sql
SET max_heap_table_size = 2048*1024*1024;
```

Which in case sets 2 GB of RAM for the database. And here comes the question of where I got exactly 2 GB. I honestly admit that I didn't know at the time of writing this article. This table on disk occupied 930.72 MB for me, so I thought that 1 GB of RAM should suffice, but it turned out that after being saved in memory, its size increased to 1538.54 MB. I asked a question about this on [stack](http://dba.stackexchange.com/questions/157525/difference-between-size-of-table-saved-on-hard-drive-or-in-ram-how-to-calculate). It turned out that `InnoDB` stores data in `BTree` while `MEMORY` uses `Hash`, which significantly reduces the ability to compress keys in the table held in RAM. Now the tests should go smoothly. We can restart the testing procedure.

```
call time_of_select(25000000,10000)
```

This time the test lasted 46 minutes.

The `main` table will no longer interest us. To free up memory, we can delete it.

```sql
DROP TABLE main;
```

After these operations, we have the following situation: there are two tables left in the database, `innoDB_result` for the `innoDB` engine and `result` for the `MEMORY` engine. We will not use MySQL for their analysis anymore. We can close the connection to the database.

## Data Analysis

For data analysis, we will use the `Mathematica` program from `Wolfram Research`. This program can be used in two ways - by writing in notebooks (like a scratchpad) and by writing packages and executable scripts from the console. Packages and scripts are pure text files that are suitable for keeping in a repository. Unfortunately, notebooks [do not](http://mathematica.stackexchange.com/questions/26174/recommended-settings-for-git-when-using-with-mathematica-projects). Notebooks are suitable for developing code and calculating something that is to be calculated once, while packages and scripts are for multiple use and automation. In our case, the appropriate tool will be a notebook. We will therefore start writing in a new notebook.

### Data Visualization from the Database

To connect to the database, we import the appropriate package.

```
Needs["DatabaseLink`"]
```

And we set the variable containing the connection

```
conn = OpenSQLConnection[
  JDBC["MySQL(Connector/J)", "127.0.0.1:3306/test"],
  "Username" -> "root", "Password" -> ""]
```

We extract the data of interest from the database.

```
counterTimeIdInnoDB = SQLExecute[conn, "SELECT counter, time_id FROM innoDB_result"];
counterTimeValInnoDB = SQLExecute[conn, "SELECT counter, time_val FROM innoDB_result"];
counterTimeIdMemory = SQLExecute[conn, "SELECT counter, time_id FROM result"];
counterTimeValMemory = SQLExecute[conn, "SELECT counter, time_val FROM result"];
```

And we immediately move on to drawing the graph.

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

We see that for both `InnoDB` and `MEMORY`, the speed of selecting by identifier does not depend on the number of records in the database for our range. This is certainly not a dependency that could be discerned from the noise present here. It is evident that for the in-memory table, selects are performed faster and their execution time is more regular. The situation is completely different for non-indexed attributes.

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

The time to select a non-indexed attribute increases linearly with the size of the database. Here, too, the table stored in memory operates faster.

Thanks to the linear fit using the command `Fit[counterTimeValInnoDB, {x}, x]`, we see that the slope for the table on disk is `3.06e-7`, which means it takes 0.3 seconds to search for one million records. Calculating the slope for the `MEMORY` engine with the command `Fit[counterTimeValMemory, {x}, x]` gives us `6.46e-8`, or 0.06 seconds for one million records, which is 4.7 times shorter.

### Histogram

Let's return to selecting by keys. Since in that case the time dependency was not visible, let's reduce this variable and take a look at the histogram showing the number of counts whose execution time fell within a certain range. The following code is responsible for the drawing.

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

### Model

I do not know the mechanism responsible for this distribution well enough. Knowing it would allow me to choose the appropriate mathematical model that could be fitted to the data. For this reason, the following part is the fitting of a distribution that only roughly resembles the actual one. We start by trimming the data for model fitting.

```
dataInnoDB = Transpose[{Range[0.5, 299.5],
    BinCounts[Flatten[timeIdInnoDB], {0, 300, 1}*10^-6]}];
dataMemory = Transpose[{Range[0.5, 299.5],
    BinCounts[Flatten[timeIdMemory], {0, 300, 1}*10^-6]}];
```

These tables contain time converted to microseconds and the corresponding counts at those moments in time. The offset of 0.5 results from the fact that the interval from 0 to 1 corresponds to the point 0.5. Then we postulate a model.

```
model = c HeavisideTheta[x - a] (x - a)*Exp[-b (x - a)];
```

As I mentioned, this is not a model inferred from the properties of low-level database implementation, but rather the first simple model that came to my mind. When we have data and a model, all that is left is to calculate its coefficients. The lines responsible for this are:

```
lineInnoDB =
 FindFit[dataInnoDB, model, { {a, 120}, {b, 0.2}, {c, 100} }, x]
lineMemory =
 FindFit[dataMemory, model, { {a, 100}, {b, 0.8}, {c, 100} }, x]
```

The coefficients we obtained are respectively

```
{a -> 126.08, b -> 0.212895, c -> 102.94}
```

for `InnoDB` and

```
{a -> 99.4551, b -> 0.836701, c -> 1587.85}
```

for `MEMORY`. There is only the drawing of the chart comparing the fitted curves with experimental data left. The command `Show` is used to combine charts of different types, its syntax is as follows:

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

This is just the beginning of my journey with databases and I still only have a superficial knowledge of this topic. For this reason, entries related to databases should be treated more as a student's notes than expert advice. Nevertheless, I hope that the time spent reading has translated into a better understanding of the quantitative aspects related to indexing performance.

Finally, I thank [Rick James](http://dba.stackexchange.com/users/1876/rick-james) for answering practically every question I have asked so far on [dba.stackexchange.com](http://dba.stackexchange.com).
