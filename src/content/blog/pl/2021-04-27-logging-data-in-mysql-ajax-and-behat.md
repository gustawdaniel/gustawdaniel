---
author: Daniel Gustaw
canonicalName: logowanie-danych-w-mysql-ajax-i-behat
date_updated: 2021-06-21 16:39:24+00:00
description: "Napiszemy prost\u0105 aplikacj\u0119 webow\u0105 - kalkulator. Na jego\
  \ przyk\u0142adzie poka\u017Cemy jak skonfigurowa\u0107 selenium z behatem i wykona\u0107\
  \ na nim testy automatyczne."
excerpt: "Napiszemy prost\u0105 aplikacj\u0119 webow\u0105 - kalkulator. Na jego przyk\u0142\
  adzie poka\u017Cemy jak skonfigurowa\u0107 selenium z behatem i wykona\u0107 na\
  \ nim testy automatyczne."
publishDate: 2021-04-26 20:03:00+00:00
slug: pl/logowanie-danych-w-mysql-ajax-i-behat
tags:
- ajax
- mysql
- selenium
title: Logowanie danych w MySql, Ajax i Behat
---


## Opis projektu

Jest to projekt, który pisałem ucząc się używania bazy danych w PHP. Kilka dni temu odświeżyłem go, dopisałem testy i postanowiłem udostępnić.

Z artykułu dowiesz się jak **centralizować konfigurację** projektu, **logować zdarzenia na stronie do bazy** danych, **testować stronę** wykorzystując selenium.

Skład kodu źródłowego to:

```
PHP 43.2% Perl 19.8% HTML 19.6% Cucumber 7.4% JavaScript 6.5% CSS 3.5%
```

Po napisaniu projekt będzie wyglądał tak:

## Instalacja

**Uwaga! Zanim włączysz install.pl upewnij się, że nie masz bazy o nazwie calc, zanim włączysz install.sh upewnij się, że nie masz chrome w sources.list. Skrypy instalacyjne w perlu i bashu nie są długie, zapoznaj się z nimi przed uruchomieniem.**

Instalację projektu zalecam przeprowadzić na maszynie wirtualnej, np.: `Lubuntu`.

Aby zainstalować projekt należy pobrać repozytorium (w lokacji, w której nie ma katalogu `calc`)

```
git clone https://github.com/gustawdaniel/calc
```

Przejść do katalogu `calc` i zainstalować potrzebne oprogramowanie. Przed instalacją przejrzyj plik `install.sh` i wykomentuj dodawanie repozytorium chrome jeśli masz je już zainstalowane.

```
cd calc && bash install.sh
```

Sprawdź swoje parametry połączenia z bazą danych `mysql`. Jeśli podczas instalacji klikałeś tylko `enter` i nie miałeś wcześniej zainstalowanego pakietu `mysql-server` możesz zostawić domyślne. W przeciwnym wypadku wpisz poprawne wartości do pliku `config/parameters.yml` i usuń go z repozytorium.

```
git rm --cached config/parameters.yml
```

Aby zainstalować bazę danych i włączyć serwer php wpisz komendę

```
perl install.pl
```

W nowym terminalu (`ctrl+n`) włącz serwer selenium

```
selenium-standalone start
```

W kolejnym możesz włączyć testy:

```
vendor/bin/behat
```

Możesz również normalnie korzystać ze strony, która wystawiona jest na porcie 9000

```
firefox localhost:9000
```

Jeśli masz domyślne parametry łączenia z bazą, to, żeby zobaczyć zawartość bazy danych wpisz

```
sudo mysql -u root
use calc;
select * from log;

```

## Struktura bazy

Zwykle zaczynam projekt od bazy danych. Jej instalację umieściłem w pliku `sql/main.sql`.

> sql/main.sql

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

Istotne jest, że nazwa bazy, jaką stworzymy to nie `database_name` lecz nazwa podana później w pliku konfiguracyjnym. Zastąpi ona tą nazwę dzięki zastosowaniu języka perl, który "skompiluje" ten skrypt do wykonywalnej postaci. O tym będzie kolejny rozdział.

## Konfiguracja

Bardzo dobrym nawykiem, który wyniosłem z pracy z Symfony jest trzymanie parametrów dotyczących połączenia z bazą danych poza kodem projektu. Jeszcze lepszym jest rozdzielenie parametrów prywatnych (które mogą zawierać loginy i hasła ze środowiska produkcyjnego - nie trzymanych w repozytorium), od domyślnych.

W tym przykładzie stosujemy jedynie domyślne parametry. Umieścimy je w pliku `parameters.yml` w katalogu `config`.

> config/parameters.yml

```yml
config:
    host: 'localhost'
    user: 'root'
    pass: ''
    base: 'calc'
    port: '3306'

```

Będziemy się do nich odnosić w instalatorze napisanym w perlu oraz w klasie odpowiadającej za zapis do bazy danych w PHP.

### Konfiguracja w Perlu

Napiszemy dwa skrypty - do tworzenia, oraz do resetowania bazy. Do odczytywania pliku `parameters.yml` wykorzystamy bibliotekę `YAML::Tiny`. Poniższy skrypt kolejno:

Odczytuje plik z parametrami do zmiennej `$yaml`.
Zapisuje wszystkie parametry do odpowiednich zmiennych.

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

Tworzy zmienne z ustawieniami katalogów. (Instrukcje tworzące bazę znajdują się w pliku `main.sql`.)

```perl
#
#       Catalogs structure:
#

    my $build = "build/";
    my $sql = "sql/";
    my $mainSQL = "main.sql";


```

Otwiera plik z kodem `sql` i zapisuje treść do zmiennej `$content`.

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

Zamienia każde wystąpienie ciągu `database_name` na nazwę z pliku `parameters.yml` i zapisuje.

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

Nadaje domyślnemu użytkownikowi prawo otwierania bazy jako root, tworzy bazę i włącza serwer `php`.

```perl
#       Execute file
    my $passSting = ($pass eq "") ? "" : " -p ".$pass;
    system('sudo mysql -h '.$host.' -P '.$port.' -u '.$user.$passSting.' < '.$build.$mainSQL);

#       Start server
    system('cd web && php -S localhost:9000');


```

### Konfiguracja w PHP

Do obsługi pliku konfiguracyjnego w `php` zastosujemy bibliotekę `"mustangostang/spyc": "^0.6.1"`. Będzie ona wykorzystana jedynie przy łączeniu się z bazą - w pliku `php/DataBase.php`.

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

W do zmiennej `$config` zapisywana jest tablica z parametrami do połączenia z bazą. Zasada działania jest taka sama, jak w poprzednim skrypcie.

## Logowanie danych w bazie

W paragrafie dotyczącym struktury bazy pokazaliśmy jakie rekordy zawiera jedyna tabela jaką mamy - `log`. Są to `id`, `time`, `a`, `b`, `button` i `useragent`. `a` i `b` odpowiadają liczbom wpisanym przez użytkownika. `button` jest akcją którą wybrał `sum` dla sumy lub `diff` dla różnicy. `useragent` to dane dotyczące przeglądarki.

Odwzorujemy teraz rekord bazy danych w `php` jako obiekt. W tym celu tworzymy klasę `Log` w pliku `php/Log.php`

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

Zawiera ona wszystkie pola z tabeli poza identyfikatorem i czasem, które nadawane są podczas zapisu do bazy. Przez trzy kropki oznaczyłem wszystkie gettery i settery dla własności klasy. W większości IDE można je wygenerować automatycznie, np.: w `PhpStorm` wybierając `code->Generate...`. Metoda `getC` pozwala wyliczyć wartość sumy lub różnicy po stronie serwera, co wykorzystane jest później w interfejsie `API`.

Teraz możemy przedstawić w całości wspomnianą wcześniej klasę `DataBase`, która służyła do zapisu danych otrzymanych ze strony do bazy.

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

Klasa ta nie ma własności, ma za to jedną metodę - `save`. Ta metoda pobiera obiekt `Log` i wykonuje logowanie do bazy danych wszystkich własności tego obiektu, przy czym dodaje jeszcze czas. Najciekawsza część tej klasy - pobieranie konfiguracji była omówiona wcześniej. Reszta jest po prostu w zwykłym zapisem do bazy.

To były klasy, teraz czas na skrypt wejściowy back-endu naszej aplikacji. Znajduje się w pliku `web/api.php` i odpowiada za poprawne przechwycenie żądania, pobranie parametrów, przekazanie ich bazie i oddanie odpowiedzi zawierającej wynik działania.

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

### Testowanie Api przez httpie

Możemy przetestować nasze `api` wykorzystując `httpie`. Komenda

```
http -fv 127.0.0.1:9000/api.php/action a=1 b=2 action="sum"

```

powinna wyprodukować następujący output:

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

Kiedy mamy gotową bazę oraz skrypty do jej obsługiwania, nic nie stoi na przeszkodzie dokończenia projektu przez napisanie frontu. Zakładamy, że instalacja przebiegła pomyślnie i `bower` zainstalował potrzebne paczki - to znaczy `"bootstrap": "v4.0.0-alpha.5"` w katalogu `web`. Ponieważ `jQuery` jest zależnością dla `Bootstrapa` możemy z niej skorzystać przy tworzeniu skryptów.

Nasz front składa się z trzech plików: `web/index.html`, `web/css/style.css` i `web/js/site.js`. Oto one:

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

Standardowy plik html. To co jest w nim ciekawego, to wykorzystanie klasy `card` z `bootstrap 4` oraz zmiana napisów na przyciskach z pełnych nazw na znaki `+` i `-` przy małych szerokościach ekranu.

Jeszcze prostsze są style naszej strony.

> web/css/style.css

```css
body {
    font-family: 'Lato', 'SansSerif', serif;
}

section {
    margin-top: 20vh;
}

```

Jest to zasługa Bootstrapa który naprawdę dużo potrafi odwzorować tak, jak bym oczekiwał. Jedyne czego potrzebujemy to margines pionowy i czcionka.

Najciekawsza część to JavaScript:

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

Cały zawarty jest w funkcji anonimowej, co zapewnia enkapsulację - nie mieszamy naszych zmiennych z globalnymi. Struktura skryptu jest następująca. Najpierw definiujemy zmienne powiązane z elementami htmla, później umieszczamy funkcje pomocnicze - u nas `round`, na koniec definiujemy listener.

Funkcja `round` pozwala na zaokrąglanie obliczeń w JavaScript. Domyślna funkcja round z obiektu `Math` zawsze zaokrągla do liczb całkowitych. Wartość domyślna liczby miejsc po przecinku definiowana przez znak `=` jest stosunkowo nowym rozwiązaniem w JavaScript. Wnętrze funkcji pełnymi garściami czerpie z dynamicznego typowania i notacji naukowej do przedstawiania liczb w tym języku.

Zauważ, że ponieważ przyciski do liczenia sumy i różnycy występują podwójnie (ze względu na responsywność aplikacji), dopiero wewnątrz listenera musimy określić który z nich został wybrany. Jeśli jest to suma, mnożymy nasze wartości przez 1, aby znak `+` oznaczał dodawanie, a nie konkatenację.

Natychmiast po zidentyfikowaniu, który przycisk został wybrany, następuje aktualizacja wyniku. Dopiero wtedy wysyłane jest żadnie `POST` co dzięki `jQuery` jest wyjątkowo proste. Takie rozwiązanie ma zalety i wady. Zaletą jest szybkość, użytkownik nie musi czekać naodpowiedź z serwera. Wadą jest duplikacja logiki odpowiedzialnej za wykonywanie obliczeń. Nie trudno domyślić się, że z powodu innych zaokrągleń wyniki przekazywane w odpowiedzi `API` będą mogły różnić się od tych wyświetlanych na stronie.

## Behat i Selenium

**Behat** jest narzędziem do pisania behawioralnych testów automatycznych. Jest to najbardziej naturalny dla człowieka sposób testowania oparty o historie, które mogą się wydażyć podczas korzystania z aplikacji. **Selenium** to serwer pozwalający symulować przeglądarkę, wyposażony w programistyczne API. Łącząc te dwa narzędzia otrzymujemy możliwość pisania czegoś w rodzaju bota odwiedzającego naszą stronę i wykonującego określone akcje. To właśnie użycie tego narzędzia widziałeś w video na początku wpisu.

Dzięki poleceniu `vendor/bin/behat --init` behat generuje domyślny plik `features/bootstrap/FeatureContext.php`. Rozszerzymy tą klasę dodając do niej `MinkContext`. Jest to zbiór tłumaczeń między naturalnym językiem `Gherkin` a akcjami wykonywanymi przed drivery przeglądarki takie jak `selenium`.

Napisałem o `Gerkinie`, że jest językiem naturalnym. W [oficjalnej dokumentacji](https://github.com/cucumber/cucumber/wiki/Gherkin) jest przedstawiany następująco:

> Gherkin is the language that Cucumber understands. It is a Business Readable, Domain Specific Language that lets you describe software’s behaviour without detailing how that behaviour is implemented.

Poza tym rozszerzeniem dodamy kilka funkcji, których brakuje w `MinkConext`

> features/bootstrap/FeatureContext.php

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

Te funkcje to ustawianie wartości pola, kiedy nie znajduje się ono w formulażu, sprawdzanie poprawności wyniku i czekanie: zwykłe, oraz pozwalające nie czekać dłużej jeśli wszystkie requesty zostały wykonane.

Mając przygotowany kontekst możemy przyjrzeć się zawartości pliku opisującego testy

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

Zawiera on scenariusz składający się z 6 kroków powtórzyny w 10 konfiguracjach. Te kroki to typowe wykonywanie obliczeń na stronie - ustawienie, `a`, `b` wybranie przycisku, czekanie na rezultat i sprawdzenie jego poprawności.

Żeby wszystko zadziałało poprawnie brakuje jeszcze pliku konfiguracyjnego `behata`. Jest to `behat.yml`.

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

To już wszystko. Jeśli prześledziłeś kod aż do tego momentu, znasz ten projekt na wylot. Mam nadzieję, że czegoś się nauczyłeś, a jeśli widzisz miejsca, gdzie mógł bym coś poprawić, śmiało daj mi znać. Będę wdzięczny za wszystkie konstruktywne uwagi.
