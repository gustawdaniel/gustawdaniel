---
author: Daniel Gustaw
canonicalName: wizualizacja-dynamicznej-sieci-korelacyjnej
date_updated: 2021-04-29 23:11:09+00:00
description: "Pythonowy skrypt do wizualizacji dynamiki powi\u0105zania instrument\xF3\
  w finansowych mierzonej korelacj\u0105."
excerpt: "Pythonowy skrypt do wizualizacji dynamiki powi\u0105zania instrument\xF3\
  w finansowych mierzonej korelacj\u0105."
publishDate: 2021-04-29 20:05:00+00:00
slug: pl/wizualizacja-dynamicznej-sieci-korelacyjnej
tags:
- python
- stock
- visualisation
title: Wizualizacja dynamicznej sieci korelacyjnej.
---


## Opis projektu

Python jest językiem, w którym można pisać nie znając go. Mimo że nie znam Pythona napisałem w nim skrypt do obsługi serwera ubigraph - oprogramowania pozwalającego wizualizować grafy.

Projekt powstał we wrześniu 2015 roku, zanim `ubigraph` [przestał być wspierany :(](https://twitter.com/SadieSv/status/716044022129659904). Mimo tego, że strona projektu nie jest dostępna, oprogramowanie napisane w oparciu o serwer `ubigraph` wciąż działa a sam plik z serwerem został dołączony do repozytorium.

Dzięki przeczytaniu tego artykułu zapoznasz się narzędziem do odczytu plików **json w bashu**, dowiesz się jak **definiować klasy i operować na tablicach w pythonie**, oraz zobaczysz jak bardzo pakiet **numpy** upraszcza obliczenia.

Skład kodu źródłowego to:

```
Python 90.1% Shell 9.9%
```

Po napisaniu projekt będzie wyglądał tak:

### Instalacja

Aby zainstalować projekt należy pobrać repozytorium

```
git clone https://github.com/gustawdaniel/dynamic_network_correaltion.git
```

Przejść do katalogu `dynamic_network_correaltion` i zainstalować projekt skryptem `install.sh`.

```
cd dynamic_network_correaltion && bash install.sh
```

Powinieneś zobaczyć nowe czarne okno o tytule `Ubigraph`. W nowym terminalu (`ctrl+n`) włącz skrypt `visualise.py`.

```
python visualise.py
```

Kolejno wybieraj następujące opcje:

```
test ENTER ENTER ENTER ENTER ENTER
```

W oknie `Ubigraph` powinieneś zobaczyć wizualizację dynamicznej sieci korelacyjnej.

## Konfiguracja

W tym rozdziale omówione są wszystkie kroki instalacji poza instalacją zależności.

Zaczniemy od pobrania danych z archiwum domu maklerskiego [bossa](http://bossa.pl). W ich [publicznym archiwum](http://bossa.pl/pub/) znajdują się pliki z notowaniami w formacie `mst` (odmiana `csv`) spakowane w archiwa `zip`. Wszystkie adresy interesujących nas plików zaczynają się od `http://bossa.pl/pub/`, ale mają różne końcówki. Zapisałem je w pliku konfiguracyjnym.

> config/wget\_data\_config.json

```json
{
  "uri1": "http://bossa.pl/pub/",
  "data": [
    {
      "uri2": "metastock/mstock/mstall.zip"
    },{
      "uri2": "ciagle/mstock/mstcgl.zip"
    },{
      "uri2": "futures/mstock/mstfut.zip"
    },{
      "uri2": "newconnect/mstock/mstncn.zip"
    },{
      "uri2": "jednolity/f2/mstock/mstf2.zip"
    },{
      "uri2": "ciagle/mstock/mstobl.zip"
    },{
      "uri2": "indzagr/mstock/mstzgr.zip"
    },{
      "uri2": "waluty/mstock/mstnbp.zip"
    },{
      "uri2": "fundinwest/mstock/mstfun.zip"
    },{
      "uri2": "ofe/mstock/mstofe.zip"
    },{
      "uri2": "forex/mstock/mstfx.zip"
    }
  ]
}
```

### Pobranie archiwów (json w bashu)

Naszym celem jest pobranie wszystkich plików o adresach składających się z `"url1"."url2"`. Będzie za to odpowiedzialny program `jq`, który pozwala na wydobywanie z pliku `json` wartości dla podanych kluczy. Przyjrzyjmy się pierwszej części skryptu do pobierania notowań:

> wget\_data.sh

```bash
#!/bin/bash

#
#   Definitions
#

# catalogs structure
CONF="config/wget_data_config.json";
RAW="raw";

# method allowing get data from config file
function getFromConf {
    echo $(cat $CONF | jq -r $1);
}

# variables constant for all script
LINES=$(grep \"uri2\": $CONF | wc -l);
URI1=$(getFromConf '.uri1');
```

Zmienne `CONF` i `RAW` są jedynie statycznymi ścieżkami do pliku z konfiguracją oraz katalogu, gdzie dane mają zostać zapisane. Zmienna `LINES` pobiera ilość wystąpień ciągu `"uri2":` w pliku `json` co odpowiada liczbie linków które chcemy pobrać.

Funkcja `getFromConf` pobiera z pliku konfiguracyjnego klucz określony w pierwszym parametrze z jakim ją wywołamy. Jej pierwsze zastosowanie widać przy definiowaniu zmiennej `URI1`. Przed nazwą klucza występuje kropka, a całość jest w pojedynczych cudzysłowach. To wystarczy. Kolejna część skryptu to pętla po liniach które zliczyliśmy.

```bash
#
#   Script
#

#clear raw catalog
rm $RAW/*

# iterate over all lines
for i in `seq 1 $LINES`
do
    # downloading data from links from config
    wget $URI1$(getFromConf '.data['$i-1'].uri2') -P $RAW
done
```

Po wyczyszczeniu katalogu `raw` z dotychczasowej zawartości pętla pobiera linki do katalogu `raw`. Interesujący jest sposób w jaki w bashu przeprowadza się konkatenację - wystarczy postawić zmienne obok siebie. Tym razem klucz po którym wyszukujemy - `'.data['$i-1'].uri2'` jest bardziej skomplikowany, ale w pełni odpowiada naturalnej intuicji dotyczącej wyszukiwania w strukturze `json`.

### Rozpakowywanie archiwów

Rozpakowanie archiwów sprowadza się do iterowania po katalogu `raw`. Standardowo definiujemy strukturę katalogów w zmiennych, czyścimy katalog `build`, i we wspomnianej pętli odczytujemy nazwę bez ścieżki i rozszerzenia, tworzymy katalog z taką nazwą, rozpakowujemy tam archiwum.

> build\_data.sh

```bash
#!/usr/bin/env bash

# catalogs structure
RAW=raw;
BUILD=build;

# clear build for idempotency
rm -rf $BUILD/*;

# loop over archives in raw
for FILE in $RAW/*.zip
do
#    create directory in build and unzip there file from raw
    NAME=$(basename $FILE .zip);
    echo $NAME;
    mkdir -p $BUILD/$NAME;
    unzip -q $FILE -d $BUILD/$NAME;
done

```

Opcja `-q` w komendzie `unzip` pozwala ją wyciszyć.

### Przygotowanie katalogu testowego

Jeśli spojrzymy na plik `install.sh` to poza instalacją zależności i przygotowaniem danych jest tam również przygotowanie testów.

> install.sh

```bash
# prepare test
mkdir -p test
rm -rf test/*
cp build/mstcgl/[A-D][A-D][A-D]* test/

```

Ta komenda służy do wybrania notowań kilku przykładowych spółek i zapisania ich w katalogu `test`. Pozwala to na uproszczenie procedury włączania programu. W jego interfejsie wystarczy wskazać nazwę katalogu `test` aby pobrał on wszystkie pliki stamtąd. Jeśli chcesz zobaczyć wykresy dla innych spółek, zalecana jest właśnie taka metoda postępowania:

1. Tworzymy katalog
2. Kopiujemy do niego wybrane pliki `mst`
3. Przy włączaniu wizualizacji podajemy nazwę tego katalogu i dwa razy `ENTER`.

## Skrypt wykonujący wizualizację

Omówimy teraz wszystkie części skryptu odpowiedzialnego z wizualizację sieci korelacyjnej. Zaczniemy od importów i nawiązanie połączenia z serwerem.

> visualise.py

```py
# -*- coding: utf-8 -*-

import os  # for loading files
import datetime  # for time operations
import numpy  # for calculation correlation

import xmlrpclib  # for visualise by ubigraph
import time  # for waiting between steps

#  connect to server displaying image
server_url = 'http://127.0.0.1:20738/RPC2'
server = xmlrpclib.Server(server_url)
G = server.ubigraph

G.clear()  # clear image before start

```

Ładowane paczki pozwalają nam operować na plikach, czasie, wykonywać obliczenia, łączyć się z serwerem `ubigraph` oraz zatrzymywać program na określoną jednostkę czasu. Po załadowaniu paczek następuje nawiązanie połączenia z serwerem i wyczyszczenie jego okna.

### Klasy

Następną częścią skryptu jest klasa z konfiguracją.

```py
##################################################################
#                          Configuration                         #
##################################################################

class Config:
    def __init__(self):
        self.state = 1

    # weights of open, highest, lowest and close price for calculating correlation
    op = 0.25
    hi = 0.25
    lo = 0.25
    cl = 0.25

    free_mem = 1  # option for free memory

    sleep = 0.001  # time of sleeping between steps
    memory = 100  # How many days before actual data should be taken in correlation?
    # boundary = 0 #
    boundary = 0.7  # correlation boundary between showed and hidden connection in graph


config = Config()

```

Nie ma ona żadnej metody, a zmienne w niej przechowywane są publiczne. Służy więc ona jedynie jako kontener na te wartości, aby nie zaśmiecać globalnej przestrzeni nazw. Zmienne `op`, `hi`, `lo`, `cl` są to wagi z jakimi ceny otwarcia, najwyższa, najniższa i zamknięcia dla danego instrumentu w konkretnym dniu wchodzą do obliczania korelacji. Ustawienie ich na `0.25` oznacza liczenie zwykłej średniej. Jeśli chcieli byśmy, aby korelacja liczona była tylko dla cen zamknięcia powinniśmy ustawić wszystkie oprócz `cl` na `0`, a `cl` na `1`.

Zmienna `free_mem` posłuży nam później jako znacznik przy zwalnianiu pamięci. `sleep` jest to czas oczekiwania między kolejnymi iteracjami podany w sekundach. Iteracje oznaczają przechodzenie o 1 dzień w historii. W zmiennej `memory` trzymany jest zakres dni jakie mają być brane do obliczania korelacji, są to zawsze dni przed dniem dla którego obliczamy korelację. Ostatnia zmienna - `boundary` - jest wartością graniczną korelacji dla której połączenia są dodawane lub usuwane. Jeśli korelacje będzie wyższa niż wartość tej zmiennej, to podczas wizualizacji pojawi się połączenia, jeśli niższa, to zniknie.

Ta klasa była jedynie odpowiednikiem struktury w `Pascalu`. Teraz czas na bardziej "obiektową" klasę.

```py
##################################################################
#                          Definitions                           #
##################################################################

class Company:
    """Company contains info about company needed to calculations"""

    def __init__(self, filename):
        self.filename = filename
        self.dates = []
        self.prices = []

        self.prices_evryday = []  # table used instead dates and prices after assigning time of simulation

        self.vertex_id = Company.vertex_id
        Company.vertex_id += 1

    vertex_id = 0
    min_date = 0
    max_date = 0
    name = ''

    def debug_print(self):
        print "name: ", self.name
        print "filename: ", self.filename
        print "vertex: ", self.vertex_id
        print "min_date: ", self.min_date
        print "max_date: ", self.max_date
        print "max price: ", max(self.prices)
        print "min price: ", min(self.prices)

    def in_range(self, date):  # czy date jest w zakresie
        if self.min_date < date < self.max_date:
            return 1
        else:
            return 0

```

Klasa `Company` zawiera informacje o firmie potrzebne do obliczeń. Dokładnie tak jak sama o sobie mówi. Jej konstruktor przyjmuje nazwę pliku i automatycznie inkrementuje swoje `vertex_id`. Jej pierwsza metoda służy do wyświetlania informacji o klasie. Nie jest przydatna dla użytkownika, ale świetnie sprawdza się podczas pisania kodu. Druga metoda `in_range` sprawdza czy dana spółka jest notowana w czasie określonym w jej argumencie. Będzie to często wykorzystywane ze względu na to, że radzenie sobie z lukami w danych wejściowych stanowią dużą część tego kodu.

### Interfejs i przygotowanie danych

Po definicji klas możemy przejść do interfejsu użytkownika.

```py
        ##################################################################
        #                          Interface                             #
        ##################################################################

print "Select files with input data"

i = 1
paths = []
while 1:
    path = raw_input("Get path to files " + str(i) + ", or ENTER to finish: ")
    if len(path) == 0:
        break
    i += 1
    paths.append(path)
    print path, len(path), paths

if len(paths) == 0:  # if error
    print "\nYou do not chosen enough number of files.\nRead docs or contact with author: gustaw.daniel@gmial.com.\n"
    exit()

directory = ''
if len(paths) == 1:  # catalog
    directory = paths[0]
    print "Loading from catalog :" + str(directory)
    paths = os.listdir(directory)  # names of files

else:
    print "Loading given files:"

```

Interfejs jest trochę wymieszany z logiką i jestem pewien, że dało by się napisać to ładniej, ale jak wspomniałem - nie umiem Pythona, więc jeśli w tym miejscu masz jakieś uwagi, albo pomysły, jak lepiej można by to napisać, podziel się tym w komentarzu.

Generalnie celem tego kawałka kodu było udostępnienie użytkownikowi możliwości wybrania katalogu, bądź listy poszczególnych plików, jednak ta druga opcja okazała się mało praktyczna, bo wygodniej było przygotować katalog i wpisać jego nazwę, niż wprowadzać nazwy ręcznie. W tym momencie jest to jedyna zalecana forma wprowadzania plików do programu.

```py
##################################################################
#                     Loading list of files                      #
##################################################################

companies = []  # empty list of companies

files_content = []  # empty content of files
for path in paths:  # for any path
    files_content.append(open(str(directory) + '/' + str(path), 'r').readlines())
    company = Company(path)  # create company
    companies.append(company)  # append to companies list
    print paths.index(path), path

print "Processing files"

```

Kiedy użytkownik określi jakie pliki mają być wczytane, następuje ładowanie ich zawartości za pomocą funkcji `open` i jej metody `readlines`. Dla każdej ścieżki do pliku tworzona jest instancja `Company` i dołączana to tablicy z firmami (lub bardziej ogólnie instrumentami finansowymi).

Jeśli byśmy przyjrzeli się strukturze pliku `mst` to jest ona następująca:

```csv
<TICKER>,<DTYYYYMMDD>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>
01CYBATON,20080415,4.48,4.48,3.76,4.08,13220
01CYBATON,20080416,4.24,4.24,3.84,4.16,1120
01CYBATON,20080417,4.08,4.40,4.08,4.08,7600
           ...

```

Ponieważ nagłówki nie są nam potrzebne przy obliczeniach odcinamy je z każdej tablicy zawierającej line `file_content`.

```py
print "Cutting headers"

for file_content in files_content:  # removing headers
    file_content.pop(0)

```

Nadal jednak występuje tam duży nadmiar danych. Przede wszystkim nazwy spółki się powtarzają, daty są w trudnym do przetwarzania formacie, volumeny wcale nie są nam potrzebne, a zamiast cen otwarcia, najwyższej, najniższej i zamknięcia potrzebujemy jednej ceny z której będzie liczona korelacja.

Żeby pozbyć się tych danych tworzymy dwie tablice - z datami i cenami.

```py
date = []
price = []

min_date = 99999999999  # searching min and max date common for companies
max_date = 0

epoch = datetime.datetime.utcfromtimestamp(0)

```

Zmienne `max_date` i `min_date` pozwolą nam wybrać ograniczenia zakresu dat w jakich możemy wizualizować. Od razu wspomnę o ograniczeniach. Wizualizacja nie może kończyć się przed 1 stycznia 1970 ponieważ ten dzień jest początkiem odliczania czasu w sekundach w systemach uniksowych. No i nie może zaczynać się za `min_date` dni. Nie jest to eleganckie rozwiązanie, ale z praktycznego punktu widzenia to ponad 200 tysięcy lat, więc mimo, że nie jest ładne, działa dobrze.

```py
##################################################################
#           Loading files to memory                              #
##################################################################

print "Saving content"

for i in range(0, len(files_content)):  # for any file
    for line in files_content[i]:  # get line
        l = line.rstrip().split(',')  # split by coma
        date.append((datetime.datetime.strptime(l[1], "%Y%m%d").date() - epoch.date()).days)
        # append date in days form epoch to date array
        price.append(round(
            float(l[2]) * config.op +
            float(l[3]) * config.hi +
            float(l[4]) * config.lo +
            float(l[5]) * config.cl, 4))
        # and price as mean with proper weights to price array
    min_date = min(min_date, date[0])  # if there was no date before this one, set this date there
    max_date = max(max_date, date[-1])  # and in similar way set latest date

    companies[i].name = l[0]
    companies[i].dates = date
    companies[i].prices = price
    companies[i].min_date = date[0]
    companies[i].max_date = date[-1]

    date = []
    price = []
    print i + 1, "/", len(files_content)

if config.free_mem:
    files_content = []

```

Ten kawałek kodu odpowiada za wyłuskanie jednej ceny zamiast czterech i konwersję daty na datę w dniach od 1 stycznia 1970. Tablice z tymi tylko wartościami zapisywane są do zmiennych tymczasowych `price` i `date`, a później do tablicy klas `Company`. Przy tej okazji oblizane są początkowa i końcowa data dla każdej ze spółek oraz najszerszy możliwy zakres dat zapisywany jest w `min_date` i `max_date`. Domyślnie na końcu tej operacji czyścimy pamięć ze zmiennej `files_content`.

Przyszedł czas na ostatni kawałek interakcji z użytkownikiem. Określił on już pliki wejściowe. Program zbadał i przetworzył ich zawartość. Nadszedł czas, żeby użytkownik zdecydował, jaki okres historyczny chce obserwować.

```py
##################################################################
#           Selecting time of simulation                         #
##################################################################

print "Selecting time of visualisation: "
print "Time given is in days from 01.01.1970"
print "Company name         start of date      end of data"
min_max = max_date
max_min = min_date
for company in companies:
    min_max = min(min_max, company.max_date)
    max_min = max(max_min, company.min_date)
    print repr(company.name).ljust(25), repr(company.min_date).ljust(20), repr(company.max_date).ljust(20)
print "Union (at least one company on stock): ", min_date, max_date
print "Intersection (all companies on stock): ", max_min, min_max

min_user = raw_input("Set first day of simulation, ENTER - Intersection: ")
if len(min_user) == 0:
    min_user = max_min
else:
    min_user = int(min_user)
max_user = raw_input("Set last day of simulation, ENTER - Intersection: ")
if len(max_user) == 0:
    max_user = min_max
else:
    max_user = int(max_user)
memory = raw_input("Set range of calculating correlation, ENTER - 100: ")
if len(memory) == 0:
    memory = config.memory
else:
    memory = int(memory)

```

Po wyjaśnieniu użytkownikowi jednostek w jakich podawane są daty, skrypt oblicza sumę i iloczyn mnogościowy wszystkich przedziałów czasowych, jakie odpowiadają czasom notowania wprowadzonych spółek. Domyślnie symulacja następuje dla okresu w którym wszystkie spółki są notowane jednocześnie, ale użytkownik ma możliwość samodzielnego decydowania o tym okresie. Ostatnią zmienną o jaką pytamy użytkownika jest zakres czasu w jakim korelacja będzie obliczana.

Pozostały jeszcze parametry jakie jak graniczna wartość korelacji między pojawianiem się a znikaniem połączeń, czas czekania między kolejnymi krokami. Aby nie czynić interfejsu zbyt męczącym (i tak domyślnie klikamy enter aż 5 razy) pozostawiłem te wartości jako domyślne. Kod skryptu jest jawny, więc osoba zainteresowana łatwo sobie może je zmienić.

### Obliczanie interpolacji i korelacji cen

Przejdźmy teraz do obliczeń.

```py
##################################################################
#                    Interpolation of prices                     #
##################################################################

print "Prices are interpolated"

# print "min memm, max ",min_user, memory, max_user

for company in companies:
    for date in range(min_user - memory, max_user):
        if company.in_range(date):
            price = round(numpy.interp(date, company.dates, company.prices), 4)
        else:
            price = 0
        company.prices_evryday.append(price)
    print repr(company.vertex_id + 1).ljust(3), "/", repr(Company.vertex_id).ljust(6), repr(company.name).ljust(20)
    if config.free_mem:  # free memory
        company.dates = []
        company.prices = []

```

Kolejny problem do pokonania, to brak ciągłości notować. Są dni, kiedy giełada jest zamknięta. Żeby sobie z tym poradzić w klasie `Company` oprócz tablicy `prices` jest też tablica `prices_everyday`. Do niej wpisywane są ceny interpolowane ze wszystkich cen i wszystkich dat. Jeśli firma nie jest notowana, do tablicy `prices_everyday` zapisywane jest `0`. W ten sposób radzimy sobie z nierówną długością okresów notowań w danych wejściowych. Po wykonaniu tej operacji tablice z danymi i cenami nie są już potrzebne. Możemy je śmiało usunąć. Jeśli z jakichś powodów nie chcieli byśmy tego robić możemy ustawić parametr `free_mem` na `0`. Domyślnie jednak czyścimy pamięć z tych danych.

Mając dane w formie wygodnej do przeprowadzania obliczeń możemy wyliczyć korelacje. Tak jak przy interpolacji, pomoże nam pakiet **numpy**.

```py
##################################################################
#                    Calculation of correlations                 #
##################################################################

print "Calculating of correlation"

corr = []
line = []
correlations = []  # Huge layer matrix with any correlations,

numpy.seterr(divide='ignore', invalid='ignore')  # ignoring of warnings that we get
# calculating correlation on identical lists

for date in range(0, max_user - min_user):
    corr = numpy.corrcoef([company.prices_evryday[date:date + memory] for company in companies])
    correlations.append(corr)

```

Warto zauważyć, że tablica `company.prices_everyday` zaczyna się w chwili czasu `min_user - memory`, to znaczy `memory` dni wcześniej niż przebiega symulacjia. Z tego względu pętla do obliczania korelacji zaczyna się od `0` a kończy na `max_user-min_user` czyli `memory` indeksów przed skończeniem tablicy `company.prices_everyday`. Dla każdego kroku pętli obliczamy korelacje od indeksu bierzącego do wyprzedzającgo go o wartość `memory`.

Wewnątrz argumentu funkcji obliczającej korelację iterujemy po wszystkich firmach. Należy przyznać, że skaładnia `pythona` jest tu bardzo zwięzła, pozostając jednocześnie całkiem czytelną.

Produktem tego kroku jest warstwowa macież korelacji, do którj będziemy się odwoływać do końca programu.

### Obsługa serwera Unigraph

Na tym w zasadzie kończą się obliczenia i następne fragmenty kodu będą związane z obsługą `unigraph`.

```py
##################################################################
#                  Creating matrix of connections                #
##################################################################

print "Initialisation of matrix of connection"

e = [[0 for x in range(Company.vertex_id)] for y in range(Company.vertex_id)]  # matrix of connections

```

Na początku inicjalizujemy pustą macież połączeń reprezentujących występowanie lub brak korelacji między notowaniami instrumentów finansowych.

```py
##################################################################
#              Creation of initial vertexes                      #
##################################################################


for ind in range(0, Company.vertex_id):
    if companies[ind].prices_evryday[0] != 0:
        G.new_vertex_w_id(ind)
        G.set_vertex_attribute(ind, 'label', companies[ind].name)

```

Tworzymy wierzchołki dla firm notowanych od początku i nadajemy im nazwy firma jako opisy.

```py
##################################################################
#              Creation initial connections                      #
##################################################################

for ind1 in range(0, Company.vertex_id):
    for ind2 in range(ind1 + 1, Company.vertex_id):
        if correlations[0][ind1][ind2] >= config.boundary:
            e[ind1][ind2] = G.new_edge(ind1, ind2)

```

Iterujemy po trójkątnej macieży połączeń między firmami dodając połaczenia jeśli początkowe korelacje przekraczają graniczną wartoś ustaloną w konfiguracji. I na końcu przeprowadzamy symulację:

```py
##################################################################
#      Visualization of dynamic correlation network              #
##################################################################

# for any time
for x in range(1, len(correlations)):
    # for any company
    for ind1 in range(0, Company.vertex_id):
        # if company starts be noted, create them
        if companies[ind1].prices_evryday[x - 1] == 0 and companies[ind1].prices_evryday[x] != 0:
            G.new_vertex_w_id(ind1)
            G.set_vertex_attribute(ind1, 'label', companies[ind1].name)
            print x, " (a):v ", ind1
        # for any company with index higher than last one
        for ind2 in range(ind1 + 1, Company.vertex_id):
            # if connection occurs, add this
            if correlations[x - 1][ind1][ind2] < config.boundary <= correlations[x][ind1][ind2]:
                e[ind1][ind2] = G.new_edge(ind1, ind2)
                print x, " (a):e ", ind1, ind2
            # if connection vanishes, delete this
            if correlations[x - 1][ind1][ind2] >= config.boundary > correlations[x][ind1][ind2]:
                G.remove_edge(e[ind1][ind2])
                print x, " (r):e ", ind1, ind2
            time.sleep(config.sleep)
        if companies[ind1].prices_evryday[x - 1] != 0 and companies[ind1].prices_evryday[x] == 0:
            G.remove_vertex(ind1)
            print x, " (r):v ", ind1

```

Mimo, że to tu wykonuje się najważniejsza część kodu, zajmuje on stosunkowo mało miejsca. W tej pętli iterującej po dniach (a właściwie indeksach, które przypisaliśmy dniom) wykonywana jest pęta po wszystkich firmach. W niej sprawdzamy, czy firma zaczyna być notowana i jeśli tak, dodajemy ją do wizualizacji. Ponownie zagnieżdżamy pętlę po firmach dbając o unikanie powtórzeń. Jeśli korelacja przekroczyła granicę schodząc w dół - usówamy połączenie, jeśliw górę dodajemy. Czekamy chwilę, żeby użytkownik nacieszył oko. Na koniec jeśli firma skończyła notowanie na giełdzie usówamy jej wierzchołek.

## Podsumowanie

To wszystko. Wisienka na torcie okazła się być kilkoma linijkami gęstego kodu w porównaniu do setek linii, które walczyły o to by poznać intencje użytkownika i z danych wejściowych wyłuskać struturę wygodną do przeprowadzenia obliczeń.

Jest to niestety poważny problem całej branży analizy danych. W wielu przypadkach dane wejściowe są na tyle nie wygodne, że ich przekształcenie do porządanej postaci kosztuje nas więcej wysiłku niż samo wykonanie ich analizy.

Jednak sytuacja się polepsza. Coraz cześciej spotykane `API`, oraz wzrost popularności formatu `json` który wypiera powoli `xml` i `csv` są krokami w dobrym kierunku i ułatwiają pracę z danymi.

![popularność json, xml, csv](http://i.imgur.com/OyhoigO.png)

Jak zawsze zachęcam do komentowania, wyrażania wątpliwości i zadawania pytań.
