---
author: Daniel Gustaw
canonicalName: tesseract-ocr-i-testowanie-selektow
coverImage: https://ucarecdn.com/a72114fa-b210-47be-bdd6-1b2fd232b6fd/
date_updated: 2021-06-21 16:53:20+00:00
description: Odczytamy ze zdjęcia treść tabeli bazodanowej i napiszemy w behacie kilka
  testów na zapytania bazodanowe.
excerpt: Odczytamy ze zdjęcia treść tabeli bazodanowej i napiszemy w behacie kilka
  testów na zapytania bazodanowe.
publishDate: 2021-05-04 20:18:00+00:00
slug: pl/tesseract-ocr-i-testowanie-selektow
tags:
- mysql
- behat
- perl
title: Tesseract-OCR i testowanie selektów.
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
#