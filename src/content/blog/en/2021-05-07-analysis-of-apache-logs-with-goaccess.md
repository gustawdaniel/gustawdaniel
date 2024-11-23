---
author: Daniel Gustaw
canonicalName: analysis-of-apache-logs-with-goaccess
coverImage: http://localhost:8484/f88a3ede-db3f-4b7c-aa56-62ee4b914bd8.avif
description: In this post, I show a tool that allows you to extract interesting information from files automatically generated during server operation.
excerpt: In this post, I show a tool that allows you to extract interesting information from files automatically generated during server operation.
publishDate: 2021-05-07 20:26:00+00:00
slug: en/apache-log-analysis-with-goaccess
tags:
- spa
- mustache
- log
title: Analysis of Apache logs with GoAccess
updateDate: 2021-07-18 18:21:38+00:00
---

Once, I heard from a colleague that there is no worse job than analyzing Apache logs. It shocked me because I thought doing the dishes was the worst. This was quite some time ago, and since then a lot has changed for the better in my life. Today I use a dishwasher for washing dishes and GoAccess for log analysis.

In this project, we will learn about a tool that allows us to **extract interesting information** from files generated automatically during the server's operation. We will write a **panel** that provides the results of log analysis. Finally, we will add a **content negotiation** mechanism, which is a way to represent the same objects using different types of data.

Code structure

```
PHP 32.9% HTML 22.6% JavaScript 20.5% Shell 18.5% CSS 5.5%
```

## Installation of GoAccess

GoAccess is adapted to work on many systems with various types of logs. I assume that we have `arch linux` and an Apache2 server. In this case, we will use the following commands for [installing GoAccess](https://goaccess.io/download):

```bash
yay -S goaccess
```

The configuration involves cutting out comments from the configuration file `/etc/goaccess.conf` at the lines containing entries:

```bash
time-format %H:%M:%S
date-format %d/%b/%Y
log-format %h %^[%d:%t %^] "%r" %s %b "%R" "%u"
```

Now you need to download the repository from GitHub.

```bash
git clone https://github.com/gustawdaniel/Apache-Log-Analysis-Admin-Panel.git
```

We are creating our own configuration for this project. As usual, we will use the `yml` file.

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

The property `apache` is a collection of all access log files for individual domains that we keep on the server. The suffix `access.log` is related to the convention I adopted, according to which I redirect all access logs to the files `domain_access.log` in the domain configuration. On the other hand, `report` is the location where we will save the parsing results.

Finally, we execute the installation script.

```
bash install.sh
```

The project should be accessible in the browser at `http://localhost:8000`.

## Log Parsing

Our goal now is to use the `GoAccess` tool to process all logs into html files.

To read the configuration file in bash, we will use a function written by [Piotr Kuczyński](https://gist.github.com/pkuczynski/8665367).

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

This function takes two parameters, the first is the name of the file to be parsed, the second is the prefix for the names assigned within our script to the parameters extracted from the `yml` file. Its usage is illustrated below.

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

In this script, we sequentially: include the above function, load the configuration into variables. Then we create directories where the log parsing results should be located, initialize an array, and loop through all the log files. In this loop, we extract the base name of the file. If it contains `_access` in its name, we trim it, skip empty files, and run the goaccess program on the logs which creates `html` files ready for display in the directory specified in the configuration. Finally, we add the processed file name to the array.

After completing the loop, we convert the list of processed names to `json` format and save it together with the reports. With this list, we won't need to loop through the directory in `php`. Before running this script, you may need to install jq. It is very simple:

```bash
apt-get install jq

```

## Backend

We have the logs ready, now we will create an API that will make them available. We do not want to keep them in a location accessible from the browser level. The browser will only have access to the `web` directory, and that’s why we will place the `api.php` file there. Since we will need access to the configuration, we will also install a `yml` parser.

```bash
composer require symfony/yaml

```

The API file is primarily routing. However, it starts with connecting packages, setting variables, and headers:

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

Attaching configuration in this way [has already been discussed](https://gustawdaniel.com/posts/en/tesseract-ocr-and-testing-selectors/#context). The novelty is setting the session. This is such a clever feature that it creates a cookie with a random session number for the user and simultaneously saves this number on the server side, so that one can refer to this specific number in the `$_SESSION` variable without having to check the cookie manually or worry about the fact that.

The novelty is splitting the `uri` address into an array using the `/` characters. Its first element will have the value `api.php`, so we capture the next two if they exist. We set an empty array `data` for ourselves and finally add headers that allow bypassing CORS issues and setting the default return data type.

In Symfony, there are special `Response` and `JsonResponse` classes that facilitate returning responses; however, here we will use a more primitive method due to its simplicity. We will define a function for returning errors.

```php
function returnError($code,$type,$message){
    $data["error"] = ["code" => $code, "type" => $type, "message" => $message];
    echo json_encode($data);
    die();
}

```

It is worth noting that it returns error codes, but it always has a code equal to 200 itself. The exceptions will be server-side errors that I will not catch. Only in such a case do I want to return an error code. It’s time to start discussing routing. We will start with the path for validating the login. In `Symfony`, it is not `login`, but `login_check`.

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

Our switch accepts a path entered after `api.php/` but before the next character `/`. In this part of the code, we deal with the case when the request address contained `login`. Since we use the `$_POST` method for logging in, the controller at this path checks if the variables `user` and `pass` have been sent and whether they match the ones set in the configuration. If the data validation is successful, a variable `$_SESSION['user']` will be created, and the status confirming the login will be added to the list of data returned in the response.

Note that I did not add the `break;` statement at the end. I did this intentionally. Immediately after logging in, without sending another request, I always want to receive a list of domains for which Apache creates logs. Therefore, I placed a `report` block under the `login` block, which is meant to execute both when the `report` path is selected and after the user has logged in successfully. However, since I want to access this path through the `API` while bypassing form login, I will check access rights with the following condition before retrieving the necessary data:

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

Besides checking if the session is set, we also check the `Authorization` header here as an alternative login method. If at least one of the login methods (session or header) is deemed valid, the following code will be executed:

```php
            $data["report"] = [];

            $list = json_decode(file_get_contents(__DIR__ . "/../" . $config["config"]["report"] . "/list.json"));

            foreach ($list->list as $key => $value) {
                $data["report"][] = ["name" => $value, "key" => $key, "link" => "api.php/report/" . $value];
            };

```

We created the `report` key for the response array. We read and decoded the list of filenames with processed Apache logs generated by the `build.sh` script. Then, in a loop, we expanded the structure of each element in this list with the `key` and `link` attributes, and assigned the name itself to the `name` key. This transformation is meant to facilitate easier processing of this data by the front-end we have developed.

However, the main functionality is not to display the file names themselves, but their contents. This is a good time to familiarize yourself with the `content-negotiation` mechanism. It is a way for a RESTful API to assign a representation to the same `url` address using different types of data. In our example, these will be `html` and `json`. The type of data we want to receive is set in the `Accept` header when preparing the request. The following code is responsible for the proper interpretation of this header.

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

It will only be executed if the `url` contains something after `api.php/report/`. This last piece was saved to the variable `$parameter` at the beginning of the script when splitting the `uri` into pieces. It indicates which file we need to extract, and it is set by the `link` key from the `$data["report"]` array. The function `preg_match` checks whether the regular expression given in the first argument appears in the string from the second argument. Depending on whether `text/html`, `application/json`, or `*/*` is matched, `html` or `json` is returned.

The last path handled by the `api` is `logout`.

```php
        case "logout": {
            session_unset();
            session_destroy();
            $data = ["state" => "loggedOut"];
            break;
        }

```

It is responsible for removing the session and assigning the state `loggedOut`. Finally, we handle the exception related to the incorrect path, in particular, this is also our starting point `api.php/`

```php
        default: {
            returnError(404,"Not Found","Use route /report with Authorization header");
            break;
        }
    }

echo json_encode($data);

```

After executing the `switch` instruction, we send the data that was collected in the `$data` array during the request processing.

### Access via API

To access via `API`, simply send the following request:

```bash
http -v --pretty=all GET localhost:8000/api.php/report Authorization:api

```

![api](https://i.imgur.com/PEjG18F.png)

We received a list of available files. If we want a specific file, we enter:

```bash
http -v --pretty=all GET localhost:8000/api.php/report/api_brainjinn Authorization:api

```

![api2](https://i.imgur.com/8p3nHB7.png)

## Frontend

The separation of the frontend from the backend has been of great interest to me for some time. I liked the ways of looking at code organization in frameworks like `aurelia` and `angular`. However, let's not go overboard. We won’t bring out a cannon to shoot a fly and we won’t use any of them here.

I set only one condition for my frontend - it should be a single-page application that correctly handles login and logout. I also gave up using gulp, as it would complicate this small project unnecessarily.

Despite this, I applied templating mechanisms here and a very primitive routing based on cheap `api` responses or events rather than on the URL fragments themselves.

We will start with the installation of external libraries for the frontend. These will be `bootstrap 4` and `mustache 2.3`. While the first package is generally well-known, I encountered `mustache` for the first time. It is the equivalent of `twig` but executed on the client side rather than the server. Before we start the installation, we will create a bower configuration file:

> .bowerrc

```json
{
  "directory": "web/bower_components"
}

```

It indicates to install directly into the `web` directory. This is related to the fact that by giving up `gulp`, they want to have ready-to-use packages exposed externally. I remind you that the browser has access only to the `web` directory in our project structure. To install the packages, we execute:

```bash
bower init
bower install --save bootstrap#v4.0.0-alpha.5
bower install --save mustache

```

Now we will move on to the entry point of our application - the `index.html` file.

> web/index.html

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

Its structure resembles the structure of `index.html` from Aurelia or Angular a bit. It is practically an empty `html` with attached styles, one div serving as an anchor point, and then the scripts themselves. In terms of styles, we have `bootstrap`, `tether` as its dependency, the font `Lato`, and our styles. Later, there is space for the mentioned anchor point. In the div with `id="content"`, our application will be dynamically built. As for the scripts, we attach `bootstrap` and `mustache` along with `bootstrap` dependencies. The file `site.js` is our library containing commonly used functions. The global variable `url` has been exposed in `index.html` because it was not worth creating a separate production and development environment for this single variable. Finally, `routing.js` is attached, which checks if the user is logged in and redirects us to the login page or displaying the list of log files.

However, more on that later, now we will go through the attachments from `index.html` from top to bottom. We will start with styles:

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

Styles like styles. Nothing special. We added a font, `padding` to the main `container`, a custom login button, and `padding` for displaying the log file list. The scripts are more interesting, here is our library with useful functions:

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

The first of these is used to convert a form to a `json` format that is more intuitive than what `serializeArray` offers, while also being much more elegant than what `serialize` does.

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

The second function is responsible for clearing cookies. Interestingly, they cannot be simply deleted, but their expiration date can be set to several decades ago.

```js
function loadComponent(name,data){
    $.get("component/"+name+"/"+name+".html").done(function(template){
        var html = Mustache.render(template, data);
        $("#content").html(html);
        $.getScript("component/"+name+"/"+name+".js")
    });
}

```

The last function is best tailored to our directory structure and content, so before I discuss it, I will mention the directory structure. In `web`, besides the obvious `js`, `css`, `bower_components`, we also have the `component` directory. The name borrowed from Angular indicates that inside we will find scripts and templates corresponding to a specific functionality. This is a correct intuition, and so in `component` we have the `login` directory with the files `login.html` and `login.js`, and the `report` directory with the files `report.html` and `report.js`. This function is responsible for fetching the `html` file from the component using the `GET` method, rendering it with the `mustache` library, which injects the data contained in the variable `data`. Then this file is hooked to our anchor point in `index.html`, and when that happens, scripts are provided to it. A mechanism beautiful in its simplicity, and it is the heart of the entire front-end. It is thanks to this method that the front-end lives and changes views without reloading the page.

However, this function will not be called on its own. I mentioned primitive routing. It manages what we will see when the page is loaded:

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

### Components

Its operation consists of trying to retrieve content reserved for logged-in users. I didn't want to return a `403` error code here, because that’s really not an error. It's quite normal that sometimes we are not logged in. Thanks to this, even if the user does not have access to these resources, I use the `done` method. Of course, if we are not logged in, the response will not contain the `report` key but rather `error`. In this case, the `login` will be loaded with an empty data array. However, if the session is created and the user is logged in correctly, we load the `report` component and pass it the data received from the server.

We have only 4 files left to discuss from the components. We'll start with the login template:

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

Simple form with two fields and a div for potential errors. It looks like this:

![login](https://i.imgur.com/yRTGig4.png)

The script that supports it is a textbook example of form handling in js.

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

Tracking elements. Adding a listener. When attempting to send, we send a `POST` with the form content. Error handling for `4xx` is in `done` and not in `fail`. In case of success, we load the `report`. Finally, we handle `5xx` errors with `fail`.

The report view is more interesting, as `mustache` creates a loop here. 

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

The loop over the `report` array displays all elements of the list, attaching names and links to them. For my logs, it looks like this:

![report](https://i.imgur.com/1Bb5BVf.png)

The script only logs out here, and that’s why it’s quite short: 

> web/component/report/report.js

```js
    var logout = document.getElementById("logout");

    logout.addEventListener("click", function () {
        deleteAllCookies();
        $.get(url + "logout");
        loadComponent("login", {});
    });

```

At the end, I will also provide a screenshot of a sample log analysis. This is the image we will see after selecting one of the files from the `report` view. In this case, these are the logs of this blog.

![log](https://i.imgur.com/n3sleEF.png)

## Deployment

A technique I really like, but have not yet described, for deploying a project to production is using [git](https://www.digitalocean.com/community/tutorials/how-to-set-up-automatic-deployment-with-git-with-a-vps). Git allows us to push only the essential files, and we can install external libraries directly from the production environment. For this to work, we need to add the repository location on our server to the local collection of remote repositories.

We assume that we log in as a user named `root` and that the `ip` of our server is in the variable `$ip_gs`. The project repository on the server will be kept in the directory `/var/repo/log_analysis`.

```
git remote add live ssh://root@$ip_gs/var/repo/log_analysis

```

On the server, we execute commands:

```
mkdir -p /var/repo/log_analysis && cd /var/repo/log_analysis
git init --bare

```

Next, we create the `post-receive` file in the `hooks` directory and save the following content to it: 

> /var/repo/log\_analysis/hooks/post-receive

```bash
#!/bin/sh
WORK_TREE=/var/www/log_analysis
GIT_DIR=/var/repo/log_analysis

git --work-tree=$WORK_TREE --git-dir=$GIT_DIR checkout -f
exit

```

Finally, we set permissions `chmod a+x post-receive` and create a directory where the project files will be located.

```bash
mkdir -p /var/www/log_analysis

```

We return to the local machine and push the repository to the server.

```
git push live master

```

We return to the server and set the production configuration in the file `/var/www/log_analysis/config/parameters.yml`. The goal here is not to leave the user `user` with the password `pass` in production. The easiest way will be to copy the file `/var/www/log_analysis/config/parameters.yml.dist` and change the values under the `security` key.

The installation consists of executing four commands:

```
apt-get install jq
composer install
bower install
bash build.sh

```

Now our task is to connect the web to one of the domains or ports. For us, it will be port 8001. We will add a listener on this port to Apache by adding the appropriate line to the configuration:

> /etc/apache2/ports.conf

```
# log analysis
Listen 8001

```

We add a file to the `sites-available` directory:

> /etc/apache2/sites-available/log\_analysis.conf

```
<VirtualHost *:8001>
    DocumentRoot /var/www/log_analysis/web

    ErrorLog /var/log/apache2/log_analysis_error.log
    CustomLog /var/log/apache2/log_analysis_access.log combined
</VirtualHost>

```

We symbolically link it with `sites-enabled` using the command:

```
a2ensite log_analysis.conf

```

Reloading Apache

```
service apache2 reload

```

The service should work, but they wanted to automate the process of updating the views of processed logs.

### Cron

There are different possible approaches. The first is to build views at the start of each session. The second is to build only the view we are currently querying. The third is to build all views daily and not burden the user with waiting.

Since the timeliness of logs with hour accuracy is not a greater value for me than a few seconds of waiting for the view to load, I decided to create all views cyclically every day.

To achieve this, it is enough to create a file:

> /etc/cron.daily/log\_analysis

```bash
#!/bin/bash

cd /var/www/log_analysis/
bash build.sh

```

and grant it execution permissions:

```bash
chmod a+x /etc/cron.daily/log_analysis

```

Apache logs are a valuable source of information. Although they do not have the measurement capabilities of scripts installed on the site (heat maps, activity time, event tracking), the fact that they are collected automatically means that they can be used without any additional burden on the site.

Let me know in the comments if this project has been useful to you, or if you have any ideas on how it could be improved.
