---
title: Tesseract-OCR i testowanie selektów.
slug: tesseract-ocr-i-testowanie-selektow
publishDate: 2021-05-04T20:18:00.000Z
date_updated: 2021-06-21T16:53:20.000Z
tags: ['mysql', 'behat', 'perl']
excerpt: Odczytamy ze zdjęcia treść tabeli bazodanowej i napiszemy w behacie kilka testów na zapytania bazodanowe.
---

## Opis projektu

Miałem tylko odświeżyć sobie pisanie zapytań do bazy, a skończyłem instalując `DataGrip` i `Tesseracta`. Pierwszy program jest to IDE do baz danych od `JetBrains`, drugi jest oprogramowaniem OCR - służy do rozpoznawania tekstów w grafice rastrowej.

Naszym zadaniem będzie **utworzenie schematów baz** danych, **odczytanie tekstu z plików graficznych**, wrzucenie odczytanej zawartości **napisanie kilku zapytań** i **testowanie zawartości** za pomocą `behata`. Jeśli jesteś ciekaw jak to się robi, zapraszam do lektury.

Skład kodu:

```
Cucumber 49.9% Perl 26.7% PHP 21.8% Shell 1.6%
```

## Instalacja

Pobieramy repozytorium:

```bash
git clone https://github.com/gustawdaniel/image_to_database_converter_example.git && cd image_to_database_converter_example
```

Instalujemy zależności.

```bash
sudo apt-get install tesseract-ocr
```

Przetważamy obrazki na teksty

```
bash process.sh
```

Tworzymy bazy i wrzucamy do nich dane. Ten skrypt na początku usunie bazy o nazwach w z `config/parameters.yml`, sprawdź konfigurację przed jego wykonaniem.

```
perl insert.pl
```

Instalujemy paczki `php`

```
composer install
```

Wykonujemy testy

```
vendor/bin/behat
```

Po instalacji wykonanie przetważania obrazu, oczyszczenie danych, zapis treści oraz testowanie bazy wyglądają następująco.

## Struktura baz

Za punkt wyjścia przyjmiemy zadania `2.4.1` i `2.4.3` z rozdziału [`2`](http://infolab.stanford.edu/~ullman/fcdb/ch2.pdf) książki `Database Systems: The Complete Book`. Zadanie polegają na napisaniu selektów.

Będziemy tworzyć dwie bazy. Pierwsza zawiera magazyn sklepu elektronicznego.

> `electronic_store`

![struktura bazy 1](https://github.com/gustawdaniel/image_to_database_converter_example/raw/master/sql/electronic_store.png)

Jej kod w sql wygląda następująco:

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

Druga to baza z danymi dotyczącymi okrętów liniowych drugiej wojny światowej.

> `warships`

![struktura bazy 2](https://github.com/gustawdaniel/image_to_database_converter_example/raw/master/sql/warships.png)

Ma bardzo podobną strukturę kodu

> sq/warships.sql

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

Dane nie są powiązane żadnymi więzami integralności referencyjnej.

## Źródło danych

Problem z danymi zaczyna się od tego, że baza jest zapisana w pliku `pdf`, jest to po prostu fragment książki. Jest to słabo zrobiony `pdf` i dane z niego nie nadają się do zaznaczenia i skopiowania. Na szczęście znajdziemy rozwiązanie stosując OCR.

### Grafiki

Zaczniemy od zrobienia screenów tabel z książki. W [repozytorium](https://github.com/gustawdaniel/image_to_database_converter_example), znajdują się te screeny. Są zapisane do plików o nazwach odpowiadających nazwom tabel w katalogu `raw/1` dla pierwszej bazy i `raw/2` dla drugiej. Przykładowy plik `raw/1/laptop.png` wygląda następująco.

![laptop](http://i.imgur.com/CPRm97P.png)

### Wydobycie tekstu (OCR)

Teraz trzeba zainstalować `tesseract-ocr` komendą:

```
sudo apt-get install tesseract-ocr

```

Wykonamy rozpoznawanie tekstu na każdym z zapisanych plików. Pomoże nam w tym prosty skrypt:

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

Wyniki są w zasadzie dobre, poza tym, że czasami pojawiają się puste linie, w jednym miejscu pojawiła się spacja i `ram` został wczytany jako `mm`. Jednak poważnym problemem jest to, że w drugiej bazie część rekordów ma nazwy składające się z kilku wyrazów. Mimo to wyrażenia regularne szybko załatwią ten problem. Z wyrażeniami regularnymi i transformowaniem danych do strukturyzowanej postaci kojarzy mi się perl, dlatego ten język wykorzystamy do wypełnienia bazy danymi.

### Przetworzenie tekstu

Jak zwykle zaczynamy od konfiguracji, ponieważ korzystać z niej będą `perl` i `php`, wydzielamy ją do osobnego pliku.

> config/parameters.yml

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

Teraz zajmiemy się poprawą jakości tekstu i wrzuceniem go do bazy.

#### Definicje

Większość moich skryptów zaczyna się podobnie. Są to nagłówki z paczkami.

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

Później wchodzą zmienne z konfiguracją związaną ze środowiskiem:

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

Następnie mamy definicje. Jedyną zdefiniowaną tu funkcją jest procedura wykonywania wyrażeń regularnych - znajdź i zamień. Jest to zbiór filtrów przez jakie będzie przechodził tekst przeczytany przez OCR.

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

Funkcja nie ma parametrów, ponieważ działa na zmiennej `$_`. Warto przy tym zwrócić na pewną ciekawą właściwość `perla`, która wyróżnia go na tle innych języków. Jest to między innymi właśnie zmienna `$_` której wartość zależy od kontekstu i której nie trzeba nawet pisać jeśli kontekst wskazuje, że o nią chodzi. W zamyśle twórcy języka - Larry'ego Walla - upodabniało go to do języka mówionego, w którym nie wskazujemy ciągle podmiotu, jeśli jest on oczywisty. Z jednej strony pozwala to szybko pisać gęsty kod dużych możliwościach, z drugiej bardzo utrudnia jego czytanie, jeśli nie jest on wystarczająco dobrze udokumentowany, a osoba czytająca nie zna tego języka wystarczająco dobrze. Być może ta elastyczność jest jednym z powodów upadku tego języka w starciu z bardzo restrykcyjnym `pythonem`, ale dla mnie jest ona raczej zaletą niż wadą. W każdym razie u nas zmienna `$_` będzie przyjmować wartość ciągu znaków z jednej linii czytanego tekstu

Przyjrzyjmy się dokładnie regułom jakie wprowadziłem, bo to jest serce całego programu.

Reguły `s/A/B/g` wykonują na zmiennej `$_` operację wyszukania ciągu `A` i zamiany go na ciąg `B`. Pierwsza z nich naprawia błędny odczyt kolumny `ram` odczytanej przez `OCR` jako `mm`, druga usuwa spację z jednego z identyfikatorów, kolejna pozbywa się linii pionowych. Dwie następne przekształcają wartości logiczne do postaci zero-jedynkowej. Wszystkie następne to wybieranie odpowiednich spacji i zastępowanie ich znakami `_`. Jest to poprawne podejście jeśli w analizowanym tekście nie ma znaku `_`, co jest prawdą w omawianym tutaj przykładzie.

#### Skrypt

Wykonywalna część skryptu zaczyna się od iterowania po bazach danych wymienionych w konfiguracji:

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

Następnie dbamy o idempotentność czyli możliwość powtarzania skryptu wiele razy bez zmiany wyniku. Wykonujemy kody `sql` przywracające stany baz do czystej postaci. Możliwe, że w Twoim systemie będziesz musiał dopisać `sudo` przed komendą `mysql`. Ja jestem zwolennikiem raczej zmiany uprawnień dostępu do bazy, jeśli to mój prywatny, lokalny komputer, niż wpisywania haseł przy każdym włączaniu bazy z terminala.

```perl
    #--------------------------------------------------------------#
    #  Reset database, put `sudo` before `mysql` if access error   #
    #--------------------------------------------------------------#

    my $passSting = ($config->{pass} eq "") ? "" : " -p ".$config->{pass};
    system('mysql -h '.$config->{host}.' -u '.$config->{user}.$passSting.' < '.$sql.$baseName.".sql");

```

Połączenie z bazą danych było już omawiane na tym blogu, dla przypomnienia, wygląda ono tak:

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

Ciekawiej robi się przy pętli po wszystkich plikach:

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

W zmiennej `$name` zapisywane są nazwy pozbawione ścieżki i rozszerzenia. Tak się składa, że są to dokładnie nazwy tabel w naszej bazie. Jeszcze to wykorzystamy w przy składaniu insertów. Naturalną konsekwencją iterowania po plikach tekstowych jest otwieranie ich. Uchwyt pliku trzymamy w zmiennej `$fh`, więc wykonujemy po nim pętle:

```perl
        #--------------------------------------------------------------#
        #               Read all lines of given file                   #
        #--------------------------------------------------------------#

        my $index = 0; my $statement;
        while (<$fh>) {

```

Przed pętlą zdefiniowaliśmy sobie dwie zmienne. `$index` pozwalającą odnieść się do numeru nie pustej linii, oraz `$statement`, która będzie przechowywała przygotowany insert. Odczytywane linie należy poddać pewnej obróbce przed zapisaniem. Zaczniemy od wycięcia znaków końca linii i pominięcia linii zawierających tylko spacje.

```perl
        #--------------------------------------------------------------#
        #         Skip empty lines and cut new line signs              #
        #--------------------------------------------------------------#
            chomp;
            if(m/^\s*$/) {
                next;
            }

```

Tu właśnie objawia się magia zmiennej kontekstowej `$_`. Każdy wie, że iterując po liniach pliku, to właśnie te linie są w centrum zainteresowania. Dlatego nie musimy ich nawet nazywać. Zamiast pisać `chomp $line` możemy napisać `chomp $_`, ale po co, skoro wystarczy napisać `chomp`. Z kontekstu wynika, że znak nowej linii ma być wycięty ze zmiennej po której właśnie przechodzi bieżąca iteracja pętli. Tak więc po tym początkowym oczyszczeniu możemy zastosować nasze filtry. Nic prostszego. Odpowiada za to napis:

```perl
                &fixStructure;

```

Na koniec rozbijamy naprawiony już wiersz `$_` spacjami i jako tablicę zapisujemy do zmiennej `@row`. Zwykle u mnie jest tak, że największa magia dzieje się na końcu skryptu, tak jest i tym razem.

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

W warunku `$if` sprawdzamy czy `$idnex` był wcześniej podnoszony jednocześnie go podnosząc. Dla pierwszego wykonania tablica `@row` powinna zawierać nazwy kolumn z tabeli `$name`. Przypominam, że `$name` było tak dobierane, żeby odpowiadało nazwom kolumn już na etapie robienia screenów. Przy pierwszym wykonaniu tworzymy `$query`, jest to treść inserta, który będziemy wykonywać dla wszystkich pozostałych linii pliku tekstowego.

Fragment `join(",",$row)` wykonuje na tablicy `@row` operację rzutowania jej na `sting` i łączenia przecinkami.

Operacja `",?"x(@row-1)` również rzutuje tablicę `@row` ale tym razem w kontekście numerycznym - odejmujemy od niej jedynkę. Z tego względu rzutowanie wykonywane jest w najbardziej naturalny sposób na ilość elementów tablicy. Znak `x` bardzo typowy dla `perla` to operator powtarzania `stringa` określoną liczbę razy. Na przykład `"a"x3` jest równoważne napisaniu `"aaa"`.

Po określeniu tekstowej reprezentacji zapytania następuje jego przygotowanie, a przy każdej kolejnej linii przetworzonego tekstu, już tylko przywrócenie spacji zamiast znaków `_` wykonywane na każdym wyrazie tablicy osobno i wykonanie insertu.

```perl
        #-----------------------------------------------------------#
        #                   Close connection                        #
        #-----------------------------------------------------------#
    $dbh->disconnect();

```

Na końcu zamykamy połączenie z bazą.

## Zapytania do bazy

Po sklonowaniu repozytorium, możesz odtworzyć mój stan bazy wykonując komendy:

```bash
bash process.sh
perl insert.pl

```

Jeśli chodzi o oprogramowanie, to przez połowę życia pisałem zapytania bezpośrednio w konsoli `mysql`. Lubiłem to, ale często musiałem je kopiować do osobnego pliku, albo przepadały na zawsze. Było to trochę męczące przy opracowywaniu bardziej złożonych zapytań. Później przy pracy nad jednym z projektów zrobiłem research mając nadzieję, że znajdę jakieś przyjemne narzędzie. Udało się, trafiłem na `dbvis`. Pomogło mi przestać korzystać z `DIA`, które mimo, że jest użyteczne przy projektowaniu bazy nie nadaje się do utrzymywania jej aktualnego stanu. Teraz zacząłem korzystać z narzędzia `DataGrip`, które dostarczyło mi wszystko czego chciałem - podświetlanie składni, wizualizację schematów, zapisywanie selektów.

Przejdziemy teraz do zapytań, które będziemy projektować. Będę wymieniał na przemian pytanie i selekt, który daje odpowiedź.

### Baza skelpu elektronicznego

Które modele komputerów PC mają szybkość równą przynajmniej 3.00?

```sql
SELECT model FROM pc WHERE speed >= 3.0;

```

Którzy producenci wytwarzają laptopy z dyskiem twardym o wielkości przynajmniej 100 gigabajtów?

```sql
SELECT maker FROM product NATURAL JOIN laptop WHERE hd >= 100;

```

Znajdź numery modeli i ceny wszystkich produktów dowolnego typu wytwarzanych przez producenta B

```sql
SELECT model,price FROM laptop UNION SELECT model,price FROM pc UNION SELECT model,price FROM printer NATURAL JOIN product as p WHERE p.maker='B';

```

Znajdź numery wszystkich kolorowych drukarek laserowych

```sql
SELECT model FROM printer WHERE color AND type='laser';

```

Znajdź producentów sprzedających laptopy, ale już nie komputery pc

```sql
SELECT DISTINCT maker FROM laptop NATURAL JOIN product WHERE maker NOT IN (SELECT DISTINCT maker FROM pc NATURAL JOIN product);

```

Znajdź wielkości dysków twardych występujące w przynajmniej dwóch komputerach pc

```sql
SELECT hd FROM (SELECT count(*) as c, hd FROM pc GROUP BY hd) as calc WHERE c>=2;

```

Znajdź pary modeli PC o tej samej ilości pamięci ram i szybkości. pary powinny pojawiać się jednokrotnie, na przykład, należy wymienić parę (i,j) ale już nie (j,i)

```sql
SELECT a.model, b.model FROM pc as a JOIN pc as b ON a.speed=b.speed AND a.ram=b.ram WHERE a.model>b.model;

```

Znajdź producentów wytwarzjących przynajmniej dwa różne komputery pc lub laptopy o szybkości co najmniej 2.8

```sql
SELECT  maker from (SELECT maker, count(model) as c FROM product as p NATURAL JOIN (SELECT model, speed FROM pc WHERE speed>=2.8 UNION SELECT model, speed FROM laptop WHERE speed>=2.8) as u GROUP BY maker) as mc WHERE c>=2;

```

Znajdź producenta lub producentów najszybszych komputerów (pc lub laptopów)

```sql
SELECT DISTINCT maker FROM product as p NATURAL JOIN (SELECT model,speed FROM laptop UNION SELECT model,speed FROM pc) as c WHERE speed=(SELECT MAX(speed) FROM (SELECT speed FROM laptop UNION SELECT speed FROM pc) as u);

```

Znajdź producentów komputerów PC o przynajmniej trzech różnych szybkościach

```sql
SELECT maker from (SELECT maker, count(speed) as c FROM product NATURAL JOIN pc GROUP BY maker) as s WHERE s.c>=3;

```

Znajdź producentów którzy sprzedają dokładnie trzy różne modele komputerów PC

```sql
SELECT maker from (SELECT maker, count(model) as c FROM product NATURAL JOIN pc GROUP BY maker) as s WHERE s.c=3;

```

### Baza okrętów liniowych

Podaj nazwy i kraje klas okrętów z działami o kalibrze przynajmniej szesnastu cali.

```sql
SELECT name, country FROM classes NATURAL JOIN ships WHERE bore>=16;

```

Znajdź okręty zwodowane przed 1921 rokiem

```sql
SELECT name FROM ships WHERE launched<1921;

```

Znajdź okręty zatopione w bitwie pod Denamrk Strait

```sql
SELECT ship FROM outcomes WHERE result="sunk" AND battle="Denmark Strait";

```

Traktat Waszyngtoński z 1921 zabraniał budowania okrętów liniowych o masie powyżej 35 000 ton. Wymień okręty niezgodne z traktatem.

```sql
SELECT name FROM classes NATURAL JOIN ships WHERE launched>1921 AND displacement>35000;

```

Podać nazwę, wyporność i liczbę dział okrętów biorących udział w bitwie pod Guadalcanal

```sql
SELECT DISTINCT name, displacement, numGuns FROM classes NATURAL JOIN ships NATURAL JOIN outcomes WHERE battle='Guadalcanal';

```

Podaj wszystkie okręty znajdujące się bazie danych, pamiętaj, że niektóre okręty nie znajdują się w relacji Okręty

```sql
SELECT name FROM ships UNION SELECT ship FROM outcomes;

```

Znajdź klasy reprezentowane tylko przez jeden okręt

```sql
SELECT class FROM (SELECT class, count(class) as c FROM classes as cl NATURAL JOIN (SELECT ship, ship as class FROM outcomes as o UNION SELECT name, class FROM ships as s) as ext_ship GROUP BY class) as total WHERE c=1;

```

Znajdź kraje które posiadały zarówno pancerniki jak i krążowniki

```sql
SELECT t1.country FROM classes as t1 JOIN classes as t2 ON t1.country=t2.country WHERE t1.type='bb' AND t2.type='bc';

```

Znajdź okręty, które "przetrwały, ale mogły jeszcze wziąć udział w boju" - zostały uszkodzone w jednej bitwie, a później uczestniczyły w innej.

```sql
SELECT f.name as name FROM
  (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN     outcomes as o1 ON b1.name=o1.battle) as f
    JOIN
  (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN    outcomes as o1 ON b1.name=o1.battle) as s
    ON f.name=s.name AND s.year < f.year AND s.result='sunk';

```

Zdziwiło mnie to, ale baza nie zawiera żadnego rekordu odpowiadającego na ostatnie pytanie. Jednak sprawdziłem to ręcznie przeglądając bazę i faktycznie tak jest.

## Testy

Do testów wykorzystamy `behat`. Jeśli skopiowałeś to repozytorium, wystarczy, że wpiszesz `composer install` i nie musisz wykonywać żadnej z trzech poniższych instrukcji. W przeciwnym wypadku, możesz zainstalować `behat` komendą

```
composer require behat/behat

```

Żeby nie wymyślać koła od nowa, do assertów podepniemy `phpunit`

```
composer require phpunit/phpunit

```

Przygodę z `behatem` zaczynamy od utworzenia pustego kontekstu za pomocą komendy.

```
vendor/bin/behat --init

```

Wypełnimy go teraz treścią.

### Kontekst

Zaczynamy od podpięcia klas, z których będziemy korzystać:

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

Nasz kontekst rozszerza klasę `TestCase`, dostarczaną przez `phpunit` abyśmy mogli łatwo narzucać warunki. Podczas działania testów będą nam potrzebne trzy zmienne.

```php?start_inline=1
private $config;
private $pdo;
private $data;

```

Do zmiennej `$config` zapiszemy konfigurację z pliku `config/parameters.yml`, w `$pdo` będziemy trzymać połączenie z bazą, a `$data` będzie przechowywać wynik ostatniego zapytania. Dwóm pierwszym możemy przypisać wartości już w konstruktorze.

```php?start_inline=1
    public function __construct()
    {
        parent::__construct();

        $this->config = Yaml::parse(file_get_contents(__DIR__.'/../../config/parameters.yml'))["config"];
        $this->setPdoUsingBaseNumber(0);
    }

```

Dziedziczymy tutaj konstruktor z `phpunit`. Następnie ustawiany zmienną `$config`. Nie musimy instalować dodatkowego parsera do `yml` ponieważ `behat` wziął sobie ten z `symfony`, sam przecież używa swojej własnej konfiguracji w formacie `yml`. Na koniec ustawiamy połączenie z domyślną bazą - `electronic_store` za pomocą funkcji `setPdoUsingBaseNumber(0)`. Jej kod jest następujący:

```php?start_inline=1
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

Generalnie można się było tego spodziewać. Z ciekawych rzeczy jest tu tylko ustawienie atrybutów naszego połączenia. Chcemy, żeby konwertował wyniki zapytań do obiektów. Mimo, że do większości assertów wykorzystamy `phpunit` nie ma on sprawdzania występowania w tablicy dla bardziej złożonych obiektów. Można by to ominąć serializując obiekty, ale tutaj zastosowałem inne podejście i porównałem je ręcznie.

```php?start_inline=1
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

Te funkcje sprawdzają, czy w wyniku zapytania - `$theArray` pojawił się testowany przez nas zbiór atrybutów - `$hash`.

Teraz przedstawimy możliwe kroki, jakie mogą się pojawić podczas testowania.

```php?start_inline=1
    /**
     * @Given I'm connected to :number database
     */
    public function connectToSecondDatabase($number)
    {
        $this->setPdoUsingBaseNumber($number-1);
    }

```

Przełączamy się między bazami, zmieniamy numerację `1`, `2` na tą w jakiej numeruje się indeksy tablicy. Teraz wybieranie selektów.

```php?start_inline=1
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

Po prostu tworzymy zapytanie, wykonujemy je i wyniki zapisujemy do zmiennej `$data`. Dla zachowania porządku czyścimy zapytanie. Jeśli interesuje nas zobaczenie wyniku, przygotowałem na to metodę

```php?start_inline=1
    /**
     * @Then I print result
     */
    public function iPrintResult()
    {
//        echo json_encode($this->data, JSON_PRETTY_PRINT);
        print_r($this->data);
    }

```

Opcja formatowania do `jsona` też została przewidziana, ale ponieważ poza debugowaniem ten kod nie spełnia żadnego testowego zadania, nie tworzyłem dla niej osobnej metody. Czas na pierwsze z warunków jakie narzucamy na dane:

```php?start_inline=1
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

Jeśli chemy odnieść się do ilości rekordów w wyniku naszego zapytania możemy zarządać, żeby była ona równa, nie mniejsza, bądź nie większa od podanej.

Kolejny możliwy krok to sprawdzenie wartości atrybutu dla pierwszego wiersza danego zapytania.

```php?start_inline=1
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

Kolejno sprawdzamy czy wynik ma pierwszy wiersz, czy istnieje w nim podany atrybut i czy ma wartość której oczekujemy. Ostatni krok jest tak ogólny, że jest stosowany przy prawie każdym scenariuszu w prawie każdym przykładnie.

```php?start_inline=1
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

Sprawdza on czy wynik zapytania zawiera określona wartości dla podanych pól, lub czy ich nie zawiera. Ta ogólność możliwa jest dzięki wykorzystaniu w składni `gherkina` znaku `?` ozaczającego wystąpienie `0` lub `1` raz. Jeśli nie napiszemy `not`, zmienna `$not` przyjmie wartość domyślną `null` i jej zaprzeczenie będzie prawdziwe. Jednak ciekawsze niż sama logika instrukcji warunkowej jest zastosowanie obiektu `TableNode`. Jest to obiekt dostarczany przez `behat` i zawiera wszystkie dane z tabel, które użytkownik podaje w plikach `feature`. Tabele te mają nagłówk i wartości zapisane w wierszach. Obiekt `TableNode` powstał żeby nie powtarzać sztuczki jaką w `perlu` wykorzystałem do osobnego traktowania nagłówka i nie przetważać tych danych ręcznie. Iterując po jego metodzie `getHash()` przechodzimy po wszystkich wierszach tej tabeli z pominięciem nagłówka. W zmiennej `$hash`, trzymamy tablicę asocjacyjną z kluczami pobranymi z nagłówka (atrybutami w tabeli) i wartościm pobranymi z danego wiersza.

To właśnie tą tablicę asocjacyjną wrzucamy do pokazanych wczęśniej metod sprawdzania występowania danego rekordu w wyniku zapytania.

### Scenariusze testowe

W praktyce pisałem testy nie mając jeszcze zapytań i mój workflow był następujący:

1. Przeczytać treść zapytania w języku naturalnym.
2. Napisać zapytanie w języku SQL.
3. Spojrzeć na obrazki z danymi.
4. Wybrać przykładowe rekordy, które powinny znaleźć się w odpowiedzi.
5. Wybrać przykładowe rekordy które nie powinny znaleźć się w odpowiedzi.
6. Wkleić selekt i dane do tabeli z testami.
7. Jeśli warunki nie są standardowe, dopisać brakujący scenariusz.

Ostatecznie plik ze scenariuszami testowymi wyewoluował do takiego postaci:

> features/select.feature

```gherkin
Feature: Selecting chosen fields from database
  In order to check if my queries are correct
  As an an database user
  I want to execute them and test some asserts

```

To jest nagłówek, jest tylko dokumentacja, bo ten kod się nie wykonuje. Poniżej pierwszy scenariusz.

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

Zostały tu sprawdzone czy ilości rekordów w bazie odpowiadają tym z ksiązki. Następnie zostają sprawdzone wszystkie zapytania, które mają tylko jedną kolumnę z wynikiem.

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

Ciężko to nawet skomentować, ponieważ ten kod jest samowyjaśniający się. Po prostu łączymy się z bazę, wykonujemy selekt, sprawdzamy czy rezultat zawiera dwie przykładowe wartości, których się spodziewamy i czy nie zawiera dwóch innych, których nie powinno być.

Zupełnie analogicznie wygląda sytuacja, jeśli mamy dwie kolumny w wyniku.

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

Niestety nie znam mechanizmu, który pozwolił by połączyć te dwa scenariusze w jeden, nigdzie w dokumentacji nie było nawet słowa o dziedziczeniu scenariuszy. Może ktoś na [stacku](http://stackoverflow.com/questions/40941114/flexibility-of-scenarios-in-gherkin) zna na to jakiś hack.

Jeśli masz przeczucie czym to się skończy, to właśnie tak się kończy.

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

I stało się, powtarzam ten sam kod trzeci raz. Wyrywałem sobie włosy z głowy, kiedy to pisałem. Okazało się, że jest tylko jeden przypadek selekta z trzema kolumnami, ale już widzimy niedoskonałość tego kodu.

Czasem zdażało się, że chciałem przetestować występowanie tylko jednego wiersza, za to z dwoma atrybutami:

```gherkin
  Scenario: Testing query (pairs)
    When I select "SELECT a.model as a, b.model as b FROM pc as a JOIN pc as b ON a.speed=b.speed AND a.ram=b.ram WHERE a.model>b.model;" from database
    Then Result should contain fields:
      | a     | b       |
      | 1012  | 1004    |
    And I should see 1 results

```

Były też przypadki z jednym rezultatem i jednym atrybutem

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

I przypadek z w którym nie znałem dokładnej liczby wyników, ale mogłem określić przedział w jakim się znajduje.

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

Na końcu zostałem zaskoczony przez scenariusz, w którym na wyjściu niczego nie dostałem.

```gherkin
  Scenario: Select null
    Given I'm connected to 2 database
    When I select "SELECT f.name as name FROM (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN outcomes as o1 ON b1.name=o1.battle) as f JOIN (SELECT name, RIGHT(date,2) as year,ship,battle,result FROM battles as b1 JOIN outcomes as o1 ON b1.name=o1.battle) as s ON f.name=s.name AND s.year < f.year AND s.result='sunk';" from database
    Then I should see 0 results

```

Tak doszliśmy dokońca projektu.

Mam nadzieję, że przedstawiony materiał Ci się spodbał. Daj znać w komentarzu, jeśli coś wymaga dodatkowego wyjaśnienia, albo jeśli wiesz jak mógł bym napisać bardziej ogólne testy niż te przedstawione powyżej. Mam na myśli jeden scenariusz dla N atrubutów, z M przykładami, które występują i L które nie występują.
