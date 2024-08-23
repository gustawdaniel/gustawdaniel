---
author: Daniel Gustaw
canonicalName: logowanie-danych-w-mysql-ajax-i-behat
coverImage: https://ucarecdn.com/8a528c93-b962-4ba4-b410-944fd27661e1/
date_updated: 2021-06-21 16:39:24+00:00
description: Napiszemy prostą aplikację webową - kalkulator. Na jego przykładzie pokażemy
  jak skonfigurować selenium z behatem i wykonać na nim testy automatyczne.
excerpt: Napiszemy prostą aplikację webową - kalkulator. Na jego przykładzie pokażemy
  jak skonfigurować selenium z behatem i wykonać na nim testy automatyczne.
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


#