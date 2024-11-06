---
author: Daniel Gustaw
canonicalName: tesseract-ocr-and-selects-testing
coverImage: http://localhost:8484/a72114fa-b210-47be-bdd6-1b2fd232b6fd.avif
description: We will read the content of the database table from the photo and write a few tests for database queries in Behat.
excerpt: We will read the content of the database table from the photo and write a few tests for database queries in Behat.
publishDate: 2021-05-04 20:18:00+00:00
slug: en/tesseract-ocr-and-testing-selectors
tags:
- mysql
- behat
- perl
title: Tesseract-OCR and testing selects.
updateDate: 2021-06-21 16:53:20+00:00
---

## Project description

I only intended to refresh my knowledge of writing database queries, but I ended up installing `DataGrip` and `Tesseract`. The first program is an IDE for databases from `JetBrains`, the second is OCR software - used for recognizing text in raster graphics.

Our task will be **to create database schemas**, **to read text from image files**, to upload the read content, **to write several queries**, and **to test the content** using `behat`. If you are curious how to do this, feel free to read on.

Code structure:

```
Cucumber 49.9% Perl 26.7% PHP 21.8% Shell 1.6%
```

## Installation

We download the repository:

```bash
git clone https://github.com/gustawdaniel/image_to_database_converter_example.git && cd image_to_database_converter_example
```

Installing dependencies.

```bash
sudo apt-get install tesseract-ocr
```

We convert images into texts

```
bash process.sh
```

We create databases and insert data into them. This script will first delete the databases named in `config/parameters.yml`, check the configuration before executing it.

```
perl insert.pl
```

Installing `php` packages

```
composer install
```

We are conducting tests

```
vendor/bin/behat
```

After installation, image processing, data cleaning, content saving, and database testing look as follows.

## Database structure

We will take tasks `2.4.1` and `2.4.3` from chapter [`2`](http://infolab.stanford.edu/~ullman/fcdb/ch2.pdf) of the book `Database Systems: The Complete Book` as the starting point. The task involves writing selects.

We will create two databases. The first contains the inventory of an electronic store.

> `electronic_store`

![struktura bazy 1](https://github.com/gustawdaniel/image_to_database_converter_example/raw/master/sql/electronic_store.png)

Her code in SQL looks as follows: 

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

The second is a database of data regarding battleships of the Second World War.

![struktura bazy 2](https://github.com/gustawdaniel/image_to_database_converter_example/raw/master/sql/warships.png)

It has a very similar code structure

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

The data are not bound by any referential integrity constraints.

## Data Source

The problem with the data begins with the fact that the database is saved in a `pdf` file, which is simply a snippet of a book. It is a poorly made `pdf`, and the data from it are not suitable for highlighting and copying. Fortunately, we will find a solution by using OCR.

### Images

We will start by taking screenshots of the tables from the book. The [repository](https://github.com/gustawdaniel/image_to_database_converter_example) contains these screenshots. They are saved to files named according to the names of the tables in the `raw/1` directory for the first database and `raw/2` for the second. An example file `raw/1/laptop.png` looks as follows.

![laptop](http://i.imgur.com/CPRm97P.png)

### Text Extraction (OCR)

Now we need to install `tesseract-ocr` with the command:

```
sudo apt-get install tesseract-ocr

```

We will perform text recognition on each of the saved files. A simple script will help us with this:

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

### Text Processing

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

Now we will focus on improving the text quality and putting it into the database.

#### Definitions

Most of my scripts start similarly. These are headers with packages.

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

Later, environment-related configuration variables come in:

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

Next, we have definitions. The only defined function here is the regular expression execution procedure - find and replace. It is a set of filters through which the text read by OCR will pass.

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

The function has no parameters because it operates on the variable `$_`. It is worth noting an interesting property of `perl` that sets it apart from other languages. This is, among other things, the variable `$_`, whose value depends on the context and which does not even need to be written if the context indicates that it is the subject. In the creator of the language - Larry Wall's - intention, this made it similar to spoken language, where we do not continuously specify the subject if it is obvious. On one hand, this allows for quickly writing dense code with great capabilities, on the other hand, it makes it very difficult to read if it is not sufficiently well documented, and the reader does not know the language well enough. Perhaps this flexibility is one of the reasons for the decline of this language in the face of the very restrictive `python`, but for me, it is more of an advantage than a disadvantage. In any case, for us, the variable `$_` will take the value of a single line string of the read text.

Let's take a closer look at the rules I have introduced, as this is the heart of the entire program.

The rules `s/A/B/g` perform an operation on the variable `$_` that searches for the string `A` and replaces it with the string `B`. The first one fixes the incorrect reading of the column `ram` read by `OCR` as `mm`, the second removes a space from one of the identifiers, the next one eliminates vertical lines. The next two transform boolean values into binary form. All subsequent ones involve selecting appropriate spaces and replacing them with `_` characters. This is the correct approach if there are no `_` characters in the analyzed text, which is true in the example discussed here.

#### Script

The executable part of the script starts with iterating over the databases listed in the configuration:

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

Next, we take care of idempotence, meaning the ability to repeat the script multiple times without changing the outcome. We execute `sql` codes that restore the database states to a clean form. It is possible that in your system you will need to prepend `sudo` before the `mysql` command. I prefer changing access rights to the database if it's my private, local computer, rather than entering passwords every time I start the database from the terminal.

```perl
    #--------------------------------------------------------------#
    #  Reset database, put `sudo` before `mysql` if access error   #
    #--------------------------------------------------------------#

    my $passSting = ($config->{pass} eq "") ? "" : " -p ".$config->{pass};
    system('mysql -h '.$config->{host}.' -u '.$config->{user}.$passSting.' < '.$sql.$baseName.".sql");

```

The database connection has already been discussed on this blog; as a reminder, it looks like this:

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

It gets more interesting when looping through all files:

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

In the variable `$name`, names without paths and extensions are stored. It so happens that these are exactly the names of the tables in our database. We will make use of this when creating inserts. A natural consequence of iterating over text files is opening them. We hold the file handle in the variable `$fh`, so we perform loops on it:

```perl
        #--------------------------------------------------------------#
        #               Read all lines of given file                   #
        #--------------------------------------------------------------#

        my $index = 0; my $statement;
        while (<$fh>) {

```

Before the loop, we defined two variables. `$index` allowing us to refer to the number of a non-empty line, and `$statement`, which will store the prepared insert. The read lines need to be processed before saving. We will start by trimming newline characters and skipping lines that contain only spaces.

```perl
        #--------------------------------------------------------------#
        #         Skip empty lines and cut new line signs              #
        #--------------------------------------------------------------#
            chomp;
            if(m/^\s*$/) {
                next;
            }

```

This is where the magic of the context variable `$_` comes into play. Everyone knows that when iterating over lines of a file, it is those lines that are the focus of interest. Therefore, we don't even need to name them. Instead of writing `chomp $line`, we can write `chomp $_`, but why bother, since it’s enough to just write `chomp`. From the context, it is clear that the newline character is to be stripped from the variable currently being iterated over in the loop. Thus, after this initial cleaning, we can apply our filters. Nothing could be simpler. This is handled by the phrase:

```perl
                &fixStructure;

```

Finally, we split the already fixed row `$_` by spaces and store it as an array in the variable `@row`. Usually, for me, the biggest magic happens at the end of the script, and this time is no different.

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

In the condition `$if` we check if `$idnex` has been raised earlier while simultaneously raising it. For the first execution, the array `@row` should contain the names of columns from the table `$name`. I remind you that `$name` was chosen to correspond to the column names already at the stage of taking screenshots. During the first execution, we create `$query`, which is the content of the insert that we will perform for all other lines of the text file.

The fragment `join(",",$row)` performs an operation on the array `@row` that casts it to `string` and concatenates it with commas.

The operation `",?"x(@row-1)` also casts the array `@row` but this time in a numerical context – we subtract one from it. For this reason, the casting is done in the most natural way for the number of elements in the array. The `x` sign, very typical for `perl`, is the operator for repeating a `string` a specified number of times. For example, `"a"x3` is equivalent to writing `"aaa"`.

After determining the textual representation of the query, its preparation follows, and with each subsequent line of the processed text, only restoring spaces instead of `_` characters is performed on each word of the array separately, and the insert is executed.

```perl
        #-----------------------------------------------------------#
        #                   Close connection                        #
        #-----------------------------------------------------------#
    $dbh->disconnect();

```

At the end, we close the connection to the database.

## Database Queries

After cloning the repository, you can restore my database state by executing the commands:

```bash
bash process.sh
perl insert.pl

```

### Electronic Store Database

Which PC models have a speed of at least 3.00?

```sql
SELECT model FROM pc WHERE speed >= 3.0;

```

Which manufacturers produce laptops with a hard drive of at least 100 gigabytes?

```sql
SELECT maker FROM product NATURAL JOIN laptop WHERE hd >= 100;

```

Find model numbers and prices of all products of any type manufactured by producer B.

```sql
SELECT model,price FROM laptop UNION SELECT model,price FROM pc UNION SELECT model,price FROM printer NATURAL JOIN product as p WHERE p.maker='B';

```

Find the numbers of all color laser printers

```sql
SELECT model FROM printer WHERE color AND type='laser';

```

Find manufacturers selling laptops, but no longer PCs.

```sql
SELECT DISTINCT maker FROM laptop NATURAL JOIN product WHERE maker NOT IN (SELECT DISTINCT maker FROM pc NATURAL JOIN product);

```

Find the hard drive sizes occurring in at least two PCs

```sql
SELECT hd FROM (SELECT count(*) as c, hd FROM pc GROUP BY hd) as calc WHERE c>=2;

```

Find pairs of PC models with the same amount of RAM and speed. Pairs should appear only once, for example, the pair (i,j) should be mentioned, but not (j,i).

```sql
SELECT a.model, b.model FROM pc as a JOIN pc as b ON a.speed=b.speed AND a.ram=b.ram WHERE a.model>b.model;

```

Find manufacturers that produce at least two different PCs or laptops with a speed of at least 2.8.

```sql
SELECT  maker from (SELECT maker, count(model) as c FROM product as p NATURAL JOIN (SELECT model, speed FROM pc WHERE speed>=2.8 UNION SELECT model, speed FROM laptop WHERE speed>=2.8) as u GROUP BY maker) as mc WHERE c>=2;

```

Find the manufacturer or manufacturers of the fastest computers (PCs or laptops)

```sql
SELECT DISTINCT maker FROM product as p NATURAL JOIN (SELECT model,speed FROM laptop UNION SELECT model,speed FROM pc) as c WHERE speed=(SELECT MAX(speed) FROM (SELECT speed FROM laptop UNION SELECT speed FROM pc) as u);

```

Find PC manufacturers with at least three different speeds

```sql
SELECT maker from (SELECT maker, count(speed) as c FROM product NATURAL JOIN pc GROUP BY maker) as s WHERE s.c>=3;

```

Find manufacturers that sell exactly three different models of PCs.

```sql
SELECT maker from (SELECT maker, count(model) as c FROM product NATURAL JOIN pc GROUP BY maker) as s WHERE s.c=3;

```

### Battleship Fleet

List the names and countries of classes of ships with guns of at least sixteen inches caliber.

```sql
SELECT name, country FROM classes NATURAL JOIN ships WHERE bore>=16;

```

Find ships launched before 1921

```sql
SELECT name FROM ships WHERE launched<1921;

```

Find ships sunk in the Battle of Denmark Strait

```sql
SELECT ship FROM outcomes WHERE result="sunk" AND battle="Denmark Strait";

```

The Washington Treaty of 1921 prohibited the construction of battleships over 35,000 tons. List ships that are inconsistent with the treaty.

```sql
SELECT name FROM classes NATURAL JOIN ships WHERE launched>1921 AND displacement>35000;

```

Provide the name, displacement, and number of guns of the ships participating in the Battle of Guadalcanal

```sql
SELECT DISTINCT name, displacement, numGuns FROM classes NATURAL JOIN ships NATURAL JOIN outcomes WHERE battle='Guadalcanal';

```

Provide all ships in the database, remember that some ships are not in the Ships relation.

```sql
SELECT name FROM ships UNION SELECT ship FROM outcomes;

```

Find classes represented by only one ship

```sql
SELECT class FROM (SELECT class, count(class) as c FROM classes as cl NATURAL JOIN (SELECT ship, ship as class FROM outcomes as o UNION SELECT name, class FROM ships as s) as ext_ship GROUP BY class) as total WHERE c=1;

```

Find countries that had both battleships and cruisers

```sql
SELECT t1.country FROM classes as t1 JOIN classes as t2 ON t1.country=t2.country WHERE t1.type='bb' AND t2.type='bc';

```

Find ships that "survived but could still participate in battle" - were damaged in one battle and later participated in another.

```sql
SELECT f.name as name FROM
  (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN     outcomes as o1 ON b1.name=o1.battle) as f
    JOIN
  (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN    outcomes as o1 ON b1.name=o1.battle) as s
    ON f.name=s.name AND s.year < f.year AND s.result='sunk';

```

## Tests

For testing, we will use `behat`. If you copied this repository, simply type `composer install` and you don't need to execute any of the three instructions below. Otherwise, you can install `behat` with the command

```
composer require behat/behat

```

To avoid reinventing the wheel, we will attach `phpunit` to asserts.

```
composer require phpunit/phpunit

```

We start the adventure with `behat` by creating an empty context using the command.

```
vendor/bin/behat --init

```

We will now fill it with content.

### Context

We start by including the classes that we will use:

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

Our context extends the `TestCase` class provided by `phpunit` so that we can easily impose conditions. During the execution of tests, we will need three variables.

```php
private $config;
private $pdo;
private $data;

```

We will save the configuration from the file `config/parameters.yml` to the variable `$config`, we will keep the connection to the database in `$pdo`, and `$data` will store the result of the last query. We can assign values to the first two already in the constructor.

```php
    public function __construct()
    {
        parent::__construct();

        $this->config = Yaml::parse(file_get_contents(__DIR__.'/../../config/parameters.yml'))["config"];
        $this->setPdoUsingBaseNumber(0);
    }

```

We inherit the constructor from `phpunit` here. Then we set the variable `$config`. We do not need to install an additional parser for `yml` because `behat` takes the one from `symfony`, as it uses its own configuration in `yml` format. Finally, we set the connection to the default database - `electronic_store` using the function `setPdoUsingBaseNumber(0)`. Its code is as follows:

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

Generally, this could be expected. The only interesting thing here is the setting of the attributes of our connection. We want it to convert query results into objects. Although we will use `phpunit` for most assertions, it does not check for occurrence in an array for more complex objects. This could be bypassed by serializing objects, but here I used a different approach and compared them manually.

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

These functions check whether the tested set of attributes - `$hash` appeared in the query result - `$theArray`.

Now we will present the possible steps that may occur during testing.

```php
    /**
     * @Given I'm connected to :number database
     */
    public function connectToSecondDatabase($number)
    {
        $this->setPdoUsingBaseNumber($number-1);
    }

```

We switch between databases, changing the numbering `1`, `2` to that which is used for array index numbering. Now selecting selects.

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

We simply create a query, execute it, and save the results to the variable `$data`. To keep things tidy, we clear the query. If we are interested in seeing the result, I have prepared a method for that.

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

The formatting option to `json` has also been provided, but since this code does not fulfill any test task other than debugging, I did not create a separate method for it. It's time for the first of the conditions we impose on the data:

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

If we want to refer to the number of records in the result of our query, we can demand that it is equal to, not less than, or not greater than the specified value.

Another possible step is to check the attribute value for the first row of the given query.

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

Next, we check if the result has the first row, if the given attribute exists in it, and if it has the value we expect. The last step is so general that it is applied in almost every scenario in almost every example.

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

It checks if the query result contains specific values for the given fields, or if it does not contain them. This generality is possible due to the use of the `gherkina` syntax with the `?` character denoting an occurrence of `0` or `1` once. If we do not write `not`, the variable `$not` will take the default value of `null`, and its negation will be true. However, more interesting than the logic of the conditional statement is the use of the `TableNode` object. This object is provided by `behat` and contains all data from the tables that the user provides in the `feature` files. These tables have headers and values recorded in the rows. The `TableNode` object was created to avoid repeating the trick I used in `perl` for separately handling the header and not processing these data manually. By iterating through its `getHash()` method, we go through all the rows of this table, skipping the header. In the variable `$hash`, we hold an associative array with keys taken from the header (attributes in the table) and values taken from the given row.

It is this associative array that we pass to the methods shown earlier for checking the occurrence of a given record in the query result.

### Test Scenarios

In practice, I wrote tests without having queries yet, and my workflow was as follows:

1. Read the content of the query in natural language.
2. Write the query in SQL.
3. Look at images with data.
4. Choose sample records that should be in the response.
5. Choose sample records that should not be in the response.
6. Paste the select and data into the test table.
7. If the conditions are not standard, add the missing scenario.

Ultimately, the file with test scenarios evolved into the following form:

> features/select.feature

```gherkin
Feature: Selecting chosen fields from database
  In order to check if my queries are correct
  As an an database user
  I want to execute them and test some asserts

```

This is a header, it is just documentation because this code does not execute. Below is the first scenario.

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

It has been verified here whether the number of records in the database corresponds to those in the book. Then, all queries that have only one column with a result are checked.

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

It's hard to even comment on it, because this code is self-explanatory. We simply connect to the database, perform a select, check if the result contains the two example values we expect and does not contain the two others that should not be there.

The situation is completely analogous if we have two columns in the result.

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

Unfortunately, I don't know the mechanism that would allow connecting these two scenarios into one; there wasn't even a word about scenario inheritance in the documentation. Maybe someone on [stack](http://stackoverflow.com/questions/40941114/flexibility-of-scenarios-in-gherkin) knows a hack for this.

If you have a feeling about how this will end, this is exactly how it ends.

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

And it happened, I am repeating the same code for the third time. I was tearing my hair out when I was writing this. It turned out that there is only one select case with three columns, but we already see the imperfection of this code.

Sometimes it happened that I wanted to test the occurrence of only one row, with two attributes instead:

```gherkin
  Scenario: Testing query (pairs)
    When I select "SELECT a.model as a, b.model as b FROM pc as a JOIN pc as b ON a.speed=b.speed AND a.ram=b.ram WHERE a.model>b.model;" from database
    Then Result should contain fields:
      | a     | b       |
      | 1012  | 1004    |
    And I should see 1 results

```

There were also cases with one result and one attribute.

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

And a case where I didn't know the exact number of results, but I could determine the range in which it lies.

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

In the end, I was surprised by the scenario in which I received nothing at the exit.

```gherkin
  Scenario: Select null
    Given I'm connected to 2 database
    When I select "SELECT f.name as name FROM (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN outcomes as o1 ON b1.name=o1.battle) as f JOIN (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN outcomes as o1 ON b1.name=o1.battle) as s ON f.name=s.name AND s.year < f.year AND s.result='sunk';" from database
    Then I should see 0 results

```

This is how we completed the project.

I hope you liked the presented material. Let me know in the comments if anything needs further clarification, or if you know how I could write more general tests than those presented above. I'm thinking of one scenario for N attributes, with M examples that occur and L that do not occur.
