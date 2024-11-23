---
author: Daniel Gustaw
canonicalName: analysis-of-apache-logs-with-goaccess
coverImage: http://localhost:8484/f88a3ede-db3f-4b7c-aa56-62ee4b914bd8.avif
description: W tym wpisie pokazuję narzędzie pozwalające wydobywać ciekawe informacje z plików generowanych automatycznie podczas pracy serwera.
excerpt: W tym wpisie pokazuję narzędzie pozwalające wydobywać ciekawe informacje z plików generowanych automatycznie podczas pracy serwera.
publishDate: 2021-05-07 20:26:00+00:00
slug: pl/analiza-logow-apache-z-goaccess
tags:
- spa
- mustache
- log
title: Analiza logów Apache z GoAccess
updateDate: 2021-07-18 18:21:38+00:00
---

Kiedyś, usłyszałem od kolegi, że nie ma gorszego zajęcia, niż analiza logów Apache. Przeraziło mnie to bo myślałem, że to zmywanie naczyń jest najgorsze. Było to dość dawno i od tego czasu w moim życiu dużo zmieniło się na lepsze. Dzisiaj do zmywania używam zmywarki, a do analizy logów GoAccess.

W tym projekcie poznamy narzędzie pozwalające **wydobywać ciekawe informacje** z plików generowanych automatycznie podczas pracy serwera. Napiszemy **panel**udostępniający wyniki analizy logów. Na koniec dodamy do niego mechanizm **content negotiation** czyli sposób na reprezentowanie tych samych obiektów za pomocą różnego typu danych.

Skład kodu

```
PHP 32.9% HTML 22.6% JavaScript 20.5% Shell 18.5% CSS 5.5%
```

Po napisaniu projekt będzie wyglądał tak:

## Instalcja GoAccess

GoAccess jest przystosowany do działania na wielu systemach z różnymi rodzajami logów. Zakładam, że, mamy `arch linux`, serwer Apache2. W tym przypadku do [instalacji GoAccess](https://goaccess.io/download) posłuży nam komenda:

```bash
yay -S goaccess
```

Konfiguracja polega na wycięciu komentarzy z pliku konfiguracyjnego `/etc/goaccess.conf` przy liniach zawierających wpisy:

```bash
time-format %H:%M:%S
date-format %d/%b/%Y
log-format %h %^[%d:%t %^] "%r" %s %b "%R" "%u"
```

Teraz należy pobrać repozytorium z gihuba

```bash
git clone https://github.com/gustawdaniel/Apache-Log-Analysis-Admin-Panel.git
```

Tworzymy naszą własną konfigurację do tego projektu. Jak zwykle posłużymy się plikiem `yml`.

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

Własność `apache` jest to zbiór wszystkich plików z logami dostępu do poszczególnych domen, które trzymamy na serwerze. Końcówka `access.log` jest związana z przyjętą przeze mnie konwencją zgodnie z którą w konfiguracji domen przekierowuję wszystkie logi dostępu do plików `domain_access.log`. Natomiast `report` jest to lokalizacja do której będziemy zapisywać wyniki parsowania.

Na koniec wykonujemy skrypt instalacyjny

```
bash install.sh
```

Projekt powinien być dostępny w przeglądarce pod adresem `http://localhost:8000`.

## Parsowanie logów

Naszym celem jest teraz wykorzystanie programu `GoAccess` do przetworzenia wszystkich logów do postaci plików html.

Do odczytywania pliku konfiguracyjnego w bashu wykorzystamy funkcję napisaną przez [Piotra Kuczyńskiego](https://gist.github.com/pkuczynski/8665367).

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

Ta funkcja przyjmuje dwa parametry, pierwszy to nazwa pliku do parsowania, drugi jest prefixem nazw nadawanych wewnątrz naszego skryptu parametrom wydobytym z pliku `yml`. Jej zastosowanie widzimy poniżej.

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

W tym skrypcie kolejno: załączamy powyższą funkcję, wczytujemy konfigurację do zmiennych. Następnie tworzymy katalogi w których mają się znaleźć wyniki parsowania logów, inicjalizujemy tablicę i przebiegamy pętlę po wszystkich plikach z logami. W tej pętli wydobywamy nazwę bazową pliku. Jeśli ma w nazwie `_access` to wycinamy, pomijamy puste pliki, wykonujemy na logach program goaccess który tworzy nam we wskazanym w konfiguracji katalogu pliki `html` gotowe do wyświetlania. Na końcu dodajemy do tablicy przetworzoną nazwę pliku.

Po wykonaniu pętli konwertujemy listę przetworzonych nazw do formatu `json` i zapisujemy razem z raportami. Dzięki tej liście nie będziemy musieli wykonywać pętli po katalogu w `php`. Zanim wykonamy ten skrypt, możliwe, że będziemy potrzebowali zainstalować jq. Jest to bardzo proste:

```bash
apt-get install jq

```

## Backend

Logi mamy gotowe, teraz stworzymy API, które będzie je udostępniać. Nie chcemy trzymać ich w lokacji dostępnej z poziomu przeglądarki. Przeglądarka będzie miała dostęp tylko do katalogu `web` i dlatego tam umieścimy plik `api.php`. Ponieważ będziemy potrzebowali dostępu do konfiguracji zainstalujemy jeszcze parser `yml`.

```bash
composer require symfony/yaml

```

Plik z API to przede wszystkim routing. Zaczyna się jednak od podłączenia paczek, ustawienia zmiennych i nagłówków:

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

Podpinanie konfiguracji w ten sposób [było już omawiane](https://gustawdaniel.com/posts/pl/tesseract-ocr-i-testowanie-selektow/#kontekst). Nowością jest ustawianie sesji. Jest to na tyle sprytna funkcja, że tworzy u użytkownika plik cookie z losowym numerem sesji i jednocześnie ten numer zapisuje po stronie serwera, tak aby w zmiennej `$_SESSION` można było odwoływać się do tej konkretnej ani nie sprawdzając cookie ręcznie, ani nie martwiąc się o to, że

Nowością jest cięcie adresu `uri` na tablicę za pomocą znaków `/`. Pierwszy jej element będzie miał wartość `api.php` dlatego wychwytujemy dwa kolejne jeśli istnieją. Ustawiamy sobie pustą tablicę `data` i na koniec dodajemy nagłówki pozwalające ominąć problemy z CORS oraz ustawić domyślny typ zwracanych danych.

W Symfony istnieją specjalne klasy `Response` i `JsonResponse`, które ułatwiają zwracanie odpowiedzi, tu jednak posłużymy się bardziej prymitywną metodą ze względu na jej prostotę. Zdefiniujemy funkcję do zwracania błędów.

```php
function returnError($code,$type,$message){
    $data["error"] = ["code" => $code, "type" => $type, "message" => $message];
    echo json_encode($data);
    die();
}

```

Warto zwrócić uwagę, że zwraca ona kody błędów, ale sama ma kod zawsze równy 200. Wyjątkiem będą błędy po stronie serwera, których nie przechwycę. Tylko w takim wypadku chcę zwracać kod błędu. Czas rozpocząć omawianie routingu. Zaczniemy od ścieżki do sprawdzania poprawności loginu. W `Symfony` odpoiada jej nie `login` ale `login_check`.

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

Nasz switch przyjmuje do porównań ścieżkę wpisaną po `api.php/` ale przed kolejnym znakiem `/`. W tej części kodu zajmujemy się przypadkiem kiedy adres zapytania zawierał `login`. Ponieważ do logowania używamy metody `$_POST`, kontroler na tej ścieżce sprawdza czy wysłano zmienne `user` i `pass`, oraz czy są zgodne z tymi ustawionymi w konfiguracji. Jeśli sprawdzanie danych przebiegnie pomyślnie, zostanie utworzona zmienna `$_SESSION['user']`, a do listy danych odsyłanych w odpowiedzi zostanie dodany stan potwierdzający zalogowanie.

Zauważ, że na końcu nie dodałem instrukcji `break;`. Zrobiłem to celowo. Od razu po zalogowaniu bez wysyłania kolejnego requestu zawsze chcę dostawać listę domen, dla których Apache tworzy logi. Dlatego pod blokiem `login` umieściłem blok `report`, który ma wykonać się zarówno po wybraniu ścieżki `report` jak i po poprawnym zalogowaniu użytkownika. Jednak ponieważ chcę mieć dostęp do tej ścieżki przez `API` z pominięciem logowania formularzem, przed wydobyciem potrzebnych danych sprawdzę prawo dostępu za pomocą następującego warunku:

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

Poza sprawdzaniem, czy sesja jest ustawiona sprawdzamy tutaj też nagłówek `Authorization` jako alternatywną metodę logowania. Jeśli przynajmniej jedna z metod logowania (sesja albo nagłówek) zostaną uznane za poprawne, wykona się następujący kod:

```php
            $data["report"] = [];

            $list = json_decode(file_get_contents(__DIR__ . "/../" . $config["config"]["report"] . "/list.json"));

            foreach ($list->list as $key => $value) {
                $data["report"][] = ["name" => $value, "key" => $key, "link" => "api.php/report/" . $value];
            };

```

Stworzyliśmy tu klucz `report` do tablicy z odpowiedzią. Odczytaliśmy i zdekodowaliśmy listę nazw plików z przetworzonymi logami apache wygenerowaną przez skrypt `build.sh`. Następnie w pętli rozbudowaliśmy strukturę każdego elementu tej listy o atrybuty `key` i `link`, a samą nazwę przypisaliśmy do klucza `name`. Ta transformacja służy do łatwiejszego przetwarzania tych danych przez front-end który do tego napisaliśmy.

Jednak główną funkcjonalnością nie jest wyświetlanie samych nazw plików, tylko ich zawartości. To dobry moment aby zapoznać się z mechanizmem `content-negotiation`. Jest to sposób, aby w RESTowym API temu samemu adresowi `url` przypisać reprezentację za pomocą różnego typu danych. W naszym przykładzie będą to `html` i `json`. Typ danych jaki chcemy otrzymać ustawiamy na nagłówku `Accept` przygotowując żądanie. Poniższy kod odpowiada za odpowiednią interpretację tego nagłówka.

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

Wykona się on tylko jeśli `url` będzie zawierał po `api.php/report/` coś jeszcze. Ten ostatni kawałek zapisany był do zmiennej `$parameter` na początku skryptu przy dzieleniu `uri` na kawałki. Wskazuje on na to, który plik mamy wyciągnąć i za jego ustawianie odpowiedzialny jest klucz `link` z tablicy `$data["report"]`. Funkcja `preg_match` sprawdza czy wyrażenie regularne podane w pierwszym argumencie występuje w ciągu znaków z drugiego argumentu. I w zależności od tego czy dopasowano `text/html` czy `application/json` albo `*/*` zwracany jest `html` lub `json`.

Ostatnią ścieżką obsługiwaną przez `api` jest `logout`.

```php
        case "logout": {
            session_unset();
            session_destroy();
            $data = ["state" => "loggedOut"];
            break;
        }

```

Odpowiada on za usunięcie sesji i przypisanie stanu `loggedOut`. Na koniec obsługujemy wyjątek związany z nie poprawną ścieżką, w szczególności jest to też nasz punkt startowy `api.php/`

```php
        default: {
            returnError(404,"Not Found","Use route /report with Authorization header");
            break;
        }
    }

echo json_encode($data);

```

Po wykonaniu instrukcji `switch` wysyłamy dane które zostały zebrane do tablicy `$data` podczas przetwarzania żądania.

### Dostęp przez API

Aby uzyskać dostęp przez `API` wystarczy wysłać następujący request:

```bash
http -v --pretty=all GET localhost:8000/api.php/report Authorization:api

```

![api](https://i.imgur.com/PEjG18F.png)

Otrzymaliśmy listę dostępnych plików. Jeśli chcemy konkretny plik wpisujemy:

```bash
http -v --pretty=all GET localhost:8000/api.php/report/api_brainjinn Authorization:api

```

![api2](https://i.imgur.com/8p3nHB7.png)

## Frontend

Oddzielenie frontu od backednu od pewnego czasu bardzo mnie interesowało. Spodobały mi się sposoby patrzenia na uporządkowanie kodu w frameworkach takich jak `aurelia` czy `angular`. Jednak bez przesady. Nie będziemy zaprzęgać armaty do zestrzeliwania muchy i nie skorzystamy tu z żadnego z nich.

Na mój front nałożyłem tylko jeden warunek - ma to być single page application obsługująca poprawnie logowanie i wylogowywanie. Zrezygnowałem też ze stosowania gulpa, ze względu na to, że była by to niepotrzebna komplikacja w tak małym projekcie.

Mimo to zastosowałem tutaj mechanizmy templatingu i bardzo prymitywny routing oparty na tanie odpowiedzi `api` albo eventach a nie na samych fragmentach `url`.

Zaczniemy od instalacji zewnętrznych bibliotek do frontu. Będzie to `bootstrap 4` oraz `mustache 2.3`. O ile pierwsza paczka powszechnie dobrze znana, o tyle z `mustache` spotkałem się pierwszy raz. Jest to odpowiednik `twiga` tylko wykonywany po stronie klienta a nie serwera. Zanim zaczniemy instalację stworzymy plik konfiguracyjny bowera:

> .bowerrc

```json
{
  "directory": "web/bower_components"
}

```

Wskazuje on, żeby instalować bezpośrednio do katalogu `web`. Jest to związane z tym, że rezygnując z `gulpa` chemy mieć gotowe do użycia paczki wystawione na zewnątrz. Przypominam, że przeglądarka ma dostęp tylko do katalogu `web` w naszej strukturze projektu. Aby zainstalować paczki wykonujemy:

```bash
bower init
bower install --save bootstrap#v4.0.0-alpha.5
bower install --save mustache

```

Teraz przejdziemy do punktu wejściowego naszej aplikacji - pliku `index.html`.

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

Jego struktura przypomina trochę strukturę `index.html` z Aurelii czy Angulara. Jest to praktycznie pusty `html` z podpiętymi stylami, jednym divem służącym za punkt zaczepienia i następnie samymi skryptami. Jeśli chodzi o style, mamy tu `bootstrapa`, `tethera` jako jego zależność, czcionka `Lato`, i nasze style. Później jest miejsce dla wspomnianego punktu zaczepienia. To w divie z `id="content"` będzie dynamicznie budowana nasza aplikacja. Jeśli chodzi o skrypty, to podpinamy `bootstrapa` i `mustache` wraz z zależnościami `bootstrapa`. Plik `site.js` jest naszą biblioteką zawierającą często używane funkcje. Zmienna globalna `url` została wyeksponowana w `index.html` ponieważ dla tej jednej zmiennej nie opłacało się tworzyć oddzielnie środowiska produkcyjnego i developerskiego. Na końcu podpięty jest `routing.js` który sprawdzając czy użytkownik jest zalogowany przekierowuje nas do strony logowania, albo wyświetlania lisy plików z logami.

Jednak o tym później, teraz przejrzymy załączniki z `index.html` od góry na dół. Zaczniemy od stylów:

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

Style jak style. Nic specjalnego. Dodaliśmy czcionkę, `paddingi` na główny `container`, customowy button do logowania i `padding` na wyświetlanie listy plików z logami. Skrypty są ciekawsze, oto nasza biblioteka z przydatnymi funkcjami:

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

Pierwsza z nich służy do przekształcania formulaża do postaci formatu `json` bardziej intuicyjnego niż to co oferuje `serializeArray`, a jednocześnie dużo bardziej eleganckiego niż to co robi `serialize`.

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

Druga funkcja odpowiada za czyszczenie ciasteczek. Co ciekawe nie da się ich po prostu usunąć, ale da się ustawić datę ich wygaśnięcia na kilkadziesiąt lat temu.

```js
function loadComponent(name,data){
    $.get("component/"+name+"/"+name+".html").done(function(template){
        var html = Mustache.render(template, data);
        $("#content").html(html);
        $.getScript("component/"+name+"/"+name+".js")
    });
}

```

Ostatnia funkcja jest najbardziej dostosowana do naszej struktury katalogów i treści, więc zanim ją omówię wspomnę jeszcze o strukturze katalogów. Otuż w `web` oprócz oczywistych `js`, `css`, `bower_components` mamy też katalog `component`. Nazwa porzyczona od angulara wskazuje, że wewnątz znajdą się skrypty i szablony odpowiadające pewnej konkretnej funkcjonalności. Jest to poprawna intuicja i tak w `component` mamy katalogi `login` z plikami `login.html` i `login.js` oraz `report` z plikami `report.html` i `report.js`. Ta funkcja odpowiada za pobranie pliku `html` z komponentu za pomocą metody `GET`, renderowanie go za pomocą biblioteki `mustache` która wstawia do niego dane zawarte w zmiennej `data`. Następnie plik ten jest podpinany do naszego punktu zaczepienia w `index.html` a kiedy to nastąpi zostają mu dostarczone skrypty. Mechanizm piękny dzięki swojej prostocie, a jest on sercem całego frontu. To dzięki tej metodzie front żyje i zmienia widoki bez przeładowywania strony.

Jednak ta funkcja nie wywoła się sama. Wspominałem o prymitywnym routingu. To on zarządza tym co zobaczymy kiedy strona zostanie załadowana:

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

### Komponenty

Jego działanie polega na próbie pobrania zawartości zarezerwowanej dla zalogowanych użytkowników. Nie chciałem tu zwracać kodu błędu `403`, bo to tak naprawdę nie jest błąd. Jest całkiem normalne, że czasem nie jesteśmy zalogowani. Dzięki temu nawet jeśli użytkownik nie ma prawa dostępu do tych zasobów posługuję się metodą `done`. Oczywiście jeśli nie jesteśmy zalogowani, to odpowiedź nie będzie zawierała klucza `report` tylko `error`. W tym przypadku zostanie załadowany `login` z pustą tablicą danych. Jeśli jednak sesja jest stworzona i użytkownik jest zalogowany poprawnie ładujemy komponent `report` i przekazujemy mu dane otrzymane od serwera.

Do omówienia zostały nam już tylko 4 pliki z komponentów. Zaczniemy od szablonu loginu:

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

Prosty formularz z dwoma polami i div na potencjalne błędy. Wygląda tak:

![login](https://i.imgur.com/yRTGig4.png)

Skrypt który go obsługuje jest podręcznikowym przykładem obsługi formulaża w js

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

Namierzamy elementy. Dodajemy listener. Przy próbie wysłania wysyłamy `POST` z treścią formulaża. Obsługa błędów `4xx` jest tu w `done` a nie `fail`. W przypadku sukcesu ładujemy `report`. Na koniec obsługujemy błędy `5xx` przez `fail`.

W widoku raportu jest ciekawiej, bo tu `mustache` robi pętlę.

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

Pętla po tablicy `report` wyświetla wszystkie elementy listy podpinając do nich nazwy oraz linki. Dla moich logów wygląda to tak:

![report](https://i.imgur.com/1Bb5BVf.png)

Skrypt robi tu jedynie wylogowanie i dlatego jest dość któdki:

> web/component/report/report.js

```js
    var logout = document.getElementById("logout");

    logout.addEventListener("click", function () {
        deleteAllCookies();
        $.get(url + "logout");
        loadComponent("login", {});
    });

```

Na koniec podam jeszcze screen z przykładowej analizy logów. Jest to obraz jaki zobaczymy po wybraniu któregoś z listy plików z widoku `report`. W tym przypadku są to logi tego bloga.

![log](https://i.imgur.com/n3sleEF.png)

## Deployment

Bardzo lubianą przeze mnie, ale jeszcze nie opisywaną techniką wypuszczania projektu na produkcję jest użycie [gita](https://www.digitalocean.com/community/tutorials/how-to-set-up-automatic-deployment-with-git-with-a-vps). Git pozwala nam przesłać jedynie istotne pliki, a zewnętrzne biblioteki możemy instalować sobie już z poziomu środowiska produkcyjnego. Aby to zadziałało musimy dodać lokalizację repozytorium na naszym serwerze do lokalnego zbioru repozytoriów zdalnych.

Zakładamy, że logujemy się na użytkownika nazwanego `root` a `ip` naszego serwera mamy w zmiennej `$ip_gs`. Repozytorium projektu na serwerze będzie trzymane w katalogu `/var/repo/log_analysis`.

```
git remote add live ssh://root@$ip_gs/var/repo/log_analysis

```

Na serwerze wykonujemy komendy:

```
mkdir -p /var/repo/log_analysis && cd /var/repo/log_analysis
git init --bare

```

Następnie tworzymy plik `post-receive` w katalogu `hooks` i zapisujemy do niego poniższą treść:

> /var/repo/log\_analysis/hooks/post-receive

```bash
#!/bin/sh
WORK_TREE=/var/www/log_analysis
GIT_DIR=/var/repo/log_analysis

git --work-tree=$WORK_TREE --git-dir=$GIT_DIR checkout -f
exit

```

Na koniec nadajemy mu uprawnienia `chmod a+x post-receive` i tworzymy katalog w którym mają się znaleźć pliki projektu.

```bash
mkdir -p /var/www/log_analysis

```

Wracamy na maszynę lokalną i wypychamy repozytorium do serwera.

```
git push live master

```

Wracamy na serwer i ustawiamy produkcyjną konfigurację w pliku `/var/www/log_analysis/config/parameters.yml`. Chodzi tutaj o to, żeby nie zostawić użytkownika `user` z hasłem `pass` na produkcji. Najprościej będzie skopiować plik `/var/www/log_analysis/config/parameters.yml.dist` i pozmieniać wartości pod kluczem `security`.

Instalacja polega na wykonaniu czterech poleceń:

```
apt-get install jq
composer install
bower install
bash build.sh

```

Teraz naszym zadaniem jest podpiąć web do którejś domeny albo portu. U nas będzie to port 8001. Dodamy więc nasłuch na tym porcie do Apache dodając odpowiednią linię do konfiguracji:

> /etc/apache2/ports.conf

```
# log analysis
Listen 8001

```

Do katalogu `sites-avaliable` dodajemy plik:

> /etc/apache2/sites-avaliable/log\_analysis.conf

```
<VirtualHost *:8001>
    DocumentRoot /var/www/log_analysis/web

    ErrorLog /var/log/apache2/log_analysis_error.log
    CustomLog /var/log/apache2/log_analysis_access.log combined
</VirtualHost>

```

Linkujemy go symbolicznie z `sites-enabled` za pomocą polecenia:

```
a2ensite log_analysis.conf

```

Przeładowujemy apache

```
service apache2 reload

```

Usługa powinna działać, ale chcieli zautomatyzować proces aktualizacji widoków przetworzonych logów.

### Cron

Są różne możliwe podejścia. Pierwsze to budować widoki przy każdej rozpoczynającej się sesji. Drugie - budować tylko ten widok o który w danym momencie pytamy. Trzecie to budować wszystkie widoki codziennie i nie męczyć użytkownika czekaniem.

Ponieważ aktualność logów z dokładnością co do godzin nie jest dla mnie większą wartością niż kilka sekund czekania na załadowanie się widoku zdecydowałem się na cykliczne tworzenie wszystkich widoków co jeden dzień.

Żeby to osiągnąć wystarczy stworzyć plik:

> /etc/cron.daily/log\_analysis

```bash
#!/bin/bash

cd /var/www/log_analysis/
bash build.sh

```

i nadać mu uprawnienia do wykonywania:

```bash
chmod a+x /etc/cron.daily/log_analysis

```

Logi Apache są cennym źródłem informacji. Nie mają co prawda takich możliwości pomiarowych jak skrypty instalowane na stronie (mapy cieplne, czas aktywności, śledzenie
eventów), ale dzięki temu, że są zbierane automatycznie, można bez żadnego dodatkowego obciążania strony, po prostu je wykorzystać.

Daj znać w komentarzu, czy ten projekt znalazł zastosowanie u Ciebie, albo jeśli masz jakieś pomysły, gdzie można by go ulepszyć.
