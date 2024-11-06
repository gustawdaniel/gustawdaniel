---
author: Daniel Gustaw
canonicalName: data-logging-with-mysql-ajax-and-behat
coverImage: http://localhost:8484/8a528c93-b962-4ba4-b410-944fd27661e1.avif
description: We will write a simple web application - a calculator. Using it as an example, we will show how to configure selenium with behat and perform automated tests on it.
excerpt: We will write a simple web application - a calculator. Using it as an example, we will show how to configure selenium with behat and perform automated tests on it.
publishDate: 2021-04-26 20:03:00+00:00
slug: en/logging-data-in-mysql-ajax-and-behat
tags:
- ajax
- mysql
- selenium
title: Data logging in MySql, Ajax, and Behat
updateDate: 2021-06-21 16:39:24+00:00
---

## Project Description

This is a project that I wrote while learning to use a database in PHP. A few days ago, I refreshed it, added tests, and decided to share it.

In this article, you will learn how to **centralize project configuration**, **log events on the site to the database**, and **test the site** using selenium.

The source code consists of:

```
PHP 43.2% Perl 19.8% HTML 19.6% Cucumber 7.4% JavaScript 6.5% CSS 3.5%
```

After writing, the project will look like this:

![](http://localhost:8484/0cd60295-e8e0-49fb-aa4b-a6a818262939.avif)

## Installation

**Note! Before you run install.pl, make sure you do not have a database named calc and chrome in sources.list. Installation scripts in perl and bash are not long; familiarize yourself with them before running.**

I recommend conducting the project installation on a virtual machine, e.g.: `Lubuntu`.

To install the project, you need to download the repository (in a location where there is no `calc` directory)

```
git clone https://github.com/gustawdaniel/calc
```

Go to the `calc` directory and install the required software. Before installation, review the `install.sh` file and comment out the addition of the chrome repository if you already have it installed.

```
cd calc && bash install.sh
```

Check your database connection parameters for `mysql`. If you pressed `enter` during installation and didn't have the `mysql-server` package installed previously, you can leave the defaults. Otherwise, enter the correct values in the `config/parameters.yml` file and remove it from the repository.

```
git rm --cached config/parameters.yml
```

To install the database and start the php server, enter the command

```
perl install.pl
```

In the new terminal (`ctrl+n`), start the selenium server.

```
selenium-standalone start
```

In the next one, you can enable tests:

```
vendor/bin/behat
```

You can also normally use the site that is exposed on port 9000.

```
firefox localhost:9000
```

If you have the default connection parameters to the database, to see the contents of the database type

```
sudo mysql -u root
use calc;
select * from log;

```

## Database Structure

I usually start a project with the database. I placed its installation in the file `sql/main.sql`.

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

## Configuration

```yml
config:
    host: 'localhost'
    user: 'root'
    pass: ''
    base: 'calc'
    port: '3306'

```

We will refer to them in the installer written in Perl and in the class responsible for saving to the database in PHP.

### Configuration in Perl

We will write two scripts - for creating and resetting the database. We will use the `YAML::Tiny` library to read the `parameters.yml` file. The following script:

Reads the file with parameters into the `$yaml` variable.
Saves all parameters into the corresponding variables.

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

Creates variables with directory settings. (The instructions for creating the database are located in the `main.sql` file.)

```perl
#
#       Catalogs structure:
#

    my $build = "build/";
    my $sql = "sql/";
    my $mainSQL = "main.sql";


```

Opens a file with `sql` code and saves the content to the variable `$content`.

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

Replaces every occurrence of the string `database_name` with the name from the `parameters.yml` file and saves it.

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

Grants the default user the right to open the database as root, creates the database, and starts the `php` server.

```perl
#       Execute file
    my $passSting = ($pass eq "") ? "" : " -p ".$pass;
    system('sudo mysql -h '.$host.' -P '.$port.' -u '.$user.$passSting.' < '.$build.$mainSQL);

#       Start server
    system('cd web && php -S localhost:9000');


```

### Configuration in PHP

To handle the configuration file in `php`, we will use the library `"mustangostang/spyc": "^0.6.1"`. It will only be used when connecting to the database - in the file `php/DataBase.php`.

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

In the variable `$config`, an array with parameters for connecting to the database is stored. The principle of operation is the same as in the previous script.

## Data Logging in the Database

In the section regarding the database structure, we showed what records are contained in the only table we have - `log`. These are `id`, `time`, `a`, `b`, `button`, and `useragent`. `a` and `b` correspond to the numbers entered by the user. `button` is the action chosen, either `sum` for the sum or `diff` for the difference. `useragent` contains data regarding the browser.

We will now map the database record in `php` as an object. To do this, we create a class `Log` in the file `php/Log.php`

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

It contains all fields from the table except for the identifier and timestamp, which are assigned during the write to the database. I marked all getters and setters for the class properties with three dots. In most IDEs, they can be generated automatically, e.g., in `PhpStorm` by selecting `code->Generate...`. The `getC` method allows for calculating the sum or difference value on the server side, which is later used in the `API` interface.

Now we can present in full the aforementioned `DataBase` class, which was used to save data received from the page to the database.

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

This class does not have properties, but it has one method - `save`. This method takes a `Log` object and logs all properties of this object to the database, adding the time as well. The most interesting part of this class - fetching the configuration was discussed earlier. The rest is just a regular database write.

These were classes, now it’s time for the back-end input script of our application. It is located in the file `web/api.php` and is responsible for correctly intercepting the request, fetching parameters, passing them to the database, and returning a response containing the result of the operation.

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

### Testing Api with httpie

We can test our `api` using `httpie`. Command

```
http -fv 127.0.0.1:9000/api.php/action a=1 b=2 action="sum"

```

should produce the following output:

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

When we have a ready database and scripts to handle it, there is nothing preventing us from completing the project by writing the front end. We assume that the installation was successful and `bower` installed the necessary packages - that is `"bootstrap": "v4.0.0-alpha.5"` in the `web` directory. Since `jQuery` is a dependency for `Bootstrap`, we can use it when creating scripts.

Our front end consists of three files: `web/index.html`, `web/css/style.css`, and `web/js/site.js`. Here they are:

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

Standard HTML file. What is interesting about it is the use of the `card` class from `bootstrap 4` and the change of button texts from full names to the symbols `+` and `-` at small screen widths.

Even simpler are the styles of our website.

> web/css/style.css

```css
body {
    font-family: 'Lato', 'SansSerif', serif;
}

section {
    margin-top: 20vh;
}

```

This is thanks to Bootstrap, which can really replicate a lot as I would expect. The only thing we need is vertical margin and font.

The most interesting part is JavaScript:

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

## Behat and Selenium

**Behat** is a tool for writing automated behavioral tests. It is the most natural way for humans to test based on scenarios that may occur while using the application. **Selenium** is a server that allows simulating a browser, equipped with a programming API. By combining these two tools, we gain the ability to write something like a bot that visits our site and performs specific actions. It is the use of this tool that you saw in the video at the beginning of the entry.

Thanks to the command `vendor/bin/behat --init`, behat generates a default file `features/bootstrap/FeatureContext.php`. We will extend this class by adding `MinkContext`. This is a collection of translations between the natural language `Gherkin` and actions performed by browser drivers such as `selenium`.

I mentioned that `Gherkin` is a natural language. In the [official documentation](https://github.com/cucumber/cucumber/wiki/Gherkin), it is presented as follows:

> Gherkin is the language that Cucumber understands. It is a Business Readable, Domain Specific Language that lets you describe software’s behaviour without detailing how that behaviour is implemented.

Besides this extension, we will add a few functions that are missing in `MinkContext`

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

These functions are setting field values when it is not in the form, checking result validity, and waiting: normal, and allowing not to wait longer if all requests have been executed.

With the context prepared, we can take a look at the contents of the file describing the tests

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

It contains a scenario consisting of 6 steps repeated in 10 configurations. These steps are typical calculations performed on the page - setting, `a`, `b`, selecting a button, waiting for the result, and checking its correctness.

For everything to work correctly, a configuration file `behat` is still missing. It is `behat.yml`.

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

That's all. If you've followed the code up to this point, you know this project inside out. I hope you've learned something, and if you see areas where I could improve something, feel free to let me know. I would appreciate all constructive feedback.
