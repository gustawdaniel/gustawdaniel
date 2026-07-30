---
author: Daniel Gustaw
canonicalName: performance-of-empty-loops-in-16-languages
coverImage: /img/loopspeed/91b0a834-47ef-418d-886a-8ae9de653c68.avif
description: Porównanie i analiza wydajności wykonywania pustych pętli w 16 różnych językach programowania.
publishDate: 2017-02-13 00:00:00.000Z
slug: pl/analiza-wydajnosci-pustych-petli-w-16-jezykach
tags:
  - benchmark
  - performance
  - c
  - cpp
  - java
  - javascript
  - python
title: Analiza wydajności pustych pętli w 16 językach
updateDate: 2021-04-20T20:33:48.000Z
---

## Opis projektu

Nie wiem, jakie są wasze wymarzone prezenty gwiazdkowe, ale moim jest kawałek ciekawego kodu. I właśnie taki prezent dostałem około półtora miesiąca temu.

Mój przyjaciel wysłał mi w e-mailu [Kod źródłowy programu](https://www.dropbox.com/s/s9dy1jabkzxzls6/loopspeed.zip?dl=1), który mierzył czasy wykonywania pustych pętli w czterech różnych językach programowania. Dopisałem testy dla kilkunastu innych języków, lekko zautomatyzowałem testowanie i przeanalizowałem wyniki.

W tym wpisie pokażę jak wyglądają i jak szybko działają programy wykonujące puste pętle językach:

- Matlab,
- Bash,
- SQL (mariadb),
- Mathematica,
- C#,
- JavaScript,
- Python,
- Ruby,
- Perl,
- R,
- Php,
- Fortran 95,
- C++,
- C,
- Pascal
- Java.

Do logowania danych wykorzystamy plik tekstowy oraz silnik bazodanowy `SQLite`. Analizę danych przeprowadzimy w języku Python.

## Instalacja

Nasz projekt będziemy odpalać na `Arch Linux` bez dockera i maszyny wirtualnej. Zaczniemy od instalacji bazy danych `mariadb`.

```bash
paru -S mariadb
```

W przeciwieństwie do niektórych dystrybucji (np. Ubuntu), Arch nie odpala i nie konfiguruje bazy automatycznie po instalacji. Musisz jednorazowo utworzyć strukturę katalogów przed pierwszym uruchomieniem:

```bash
sudo mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
```

Startujesz usługę i ustawiasz jej automatyczny start przy bootowaniu systemu:

```bash
sudo systemctl enable --now mariadb
```

Po połączeniu z bazą za pomocą sudo (co daje nam uprawnienia roota):

```bash
sudo mariadb
```

Możemy utworzyć bazę danych, do której będziemy zapisywać nasze czasy. Wprawdzie domyślnie zakładamy, że baza jest pusta, ale może się zdarzyć, że komuś się ona przyda. Tworzymy więc bazę, dajemy uprawnienia dla lokalnego użytkownika `''`:

```sql
CREATE DATABASE IF NOT EXISTS inc;
GRANT ALL PRIVILEGES ON inc.* TO ''@'localhost';
FLUSH PRIVILEGES;
```

Możemy teraz przetestować instalację komendą:

```bash
mariadb inc -e "SELECT 'OK' as 'state'"
```

Jeśli zobaczysz

```sql
+-------+
| state |
+-------+
| OK    |
+-------+
```

To znaczy, że wszystko jest w porządku.

Instalację projektu na czystym Ubuntu 16.04.1 LTS wymaga wpisania kilku komend:

```bash
git clone --depth=1 git@github.com:gustawdaniel/loopspeed.git && cd loopspeed
sudo bash install.sh
cpan install DBI DBD::SQLite Text::CSV_XS
perl util/parameters_load.pl
```

Jest to pierwszy wpis z repozytorium na `gitlabie` a nie `githubie`. Nie jest to przypadek, lecz zasługa świetnego narzędzia do ciągłej integracji - `gitlab-ci`, które omówię na samym końcu.

Teraz przyjrzymy się skryptom: instalacyjnemu i ładującemu parametry.

Skrypt instalacyjny `install.sh` wykonuje aktualizację listy dostępnych paczek i instalację wymaganych kompilatorów i interpreterów języków:

```bash
#!/usr/bin/env bash


paru -S --needed --noconfirm \
  php python jdk-openjdk gcc mono gcc-fortran fpc r ruby \
  sqlite bc git mariadb-clients curl \
  perl-text-csv perl-dbi perl-dbd-sqlite
```

Paczki które instalujemy to:

| Arch Linux (`paru`) | Uwagi                                                  |
| ------------------- | ------------------------------------------------------ |
| `gcc`               | Na Archu `gcc` zawiera zarówno kompilator C, jak i C++ |
| `gcc-fortran`       | Kompilator Fortrana                                    |
| `jdk-openjdk`       | Domyślne środowisko Java                               |
| `fpc`               | Free Pascal Compiler                                   |
| `mono`              | Środowisko i kompilator C#                             |
| `nodejs`            | Na Archu node to zawsze po prostu `nodejs`             |
| `mariadb-clients`   | Klient CLI do MySQL / MariaDB                          |
| `perl-text-csv`     | Konwencja nazw modułów Perla (`perl-*`)                |

Następnie tworzy bazę do przechowywania wyników pomiarów oraz wyliczonych na ich podstawie parametrów:

```bash
sqlite3 log/log.db \
"create table IF NOT EXISTS log (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    size UNSIGNED INTEGER,
    time DECIMAL(12,6),
    git CHAR(41)
);"

sqlite3 log/log.db \
"create table IF NOT EXISTS result (
    name varchar(255),
    a real,
    b real,
    ea real,
    eb real
);"
```

I na koniec instalator pobiera bibliotekę do testowania kodu pisanego w `bashu` - `shunit2`.

```bash
curl -L "https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/shunit2/shunit2-2.1.6.tgz" | tar zx
```

Przed drugim skryptem instalujemy biblioteki perla

```bash
cpan install DBI DBD::SQLite
```

Dzięki temu możemy wykonać skrypt

> util/parameters\_load.pl

```perl
#!/usr/bin/perl -w

use v5.10;
use strict;
use warnings;
use autodie;

use Text::CSV_XS;
use DBI;

my $dbh = DBI->connect(
    "dbi:SQLite:log/log.db", "", "",
    {
        RaiseError => 1, AutoCommit => 0
    }
);

$dbh->do("DELETE FROM result");

# Using bind parameters avoids having to recompile the statement every time
my $sth = $dbh->prepare(<<'SQL');
INSERT INTO result
       (name, a,     b,     ea,    eb)
VALUES (?,    ?,     ?,     ?,     ?)
SQL

my $csv = Text::CSV_XS->new or die;
open my $fh, "<", "config/parameters.csv";
while(my $row = $csv->getline($fh)) {
    $sth->execute(@$row);
}
$csv->eof;
close $fh;

$sth->finish;
$dbh->commit;
```

Jego zadaniem jest przeniesienie zawartości pliku tekstowego `config/parameters.csv` do tabeli `result` bazy danych `log/log.db`. Przenoszone dane dotyczą szacowanych czasów wykonywania pętli i zostały wyliczone z wyników przeprowadzonych wcześniej pomiarów.

Dwa z języków, które testowałem - `Matlab` i `Mathematica` - wymagają zainstalowanego licencjonowanego oprogramowania. Co prawda, studenci mają zwykle te licencje dzięki uczelniom, ale ze względu na to, że jest licencjonowane, testy dla tych języków są domyślnie wyłączone.

## Framework

Nasz program do testowania pustych pętli ma następującą strukturę katalogów:

```
├── config
│   ├── list.txt
│   └── parameters.csv
├── inc
│   ├── def.sql
│   ├── inc.bash
│   ├── inc.c
│   ├── inc.cpp
│   ├── inc.cs
│   ├── inc.f95
│   ├── inc.java
│   ├── inc.js
│   ├── inc.m.sh
│   ├── inc.p
│   ├── inc.perl
│   ├── inc.php
│   ├── inc.python
│   ├── inc.r
│   ├── inc.rb
│   ├── inc.sql.sh
│   └── inc.wl
├── util
│   ├── generate_parameters.wl
│   ├── parameters_load.pl
│   ├── text_to_sqlite.pl
│   ├── timing_methods.sh
│   └── timing.sh
├── log
│   ├── log.db
│   ├── results_timing_methods.log
│   └── results.log
├── install.sh
├── analysis.nb
├── inc.bash
├── test.sh
├── README.md
└── .gitlab-ci.yml
```

Katalog `config` zawiera pliki pomocnicze z ustawieniami. Pierwszym z nich jest lista parametrów dla których będziemy wykonywać serie testowe `config/list.txt` - zwykły plik tekstowy z liczbami całkowitymi w kolejnych liniach. Drugim oszacowane wartości parametrów określających szybkość wykonywania pustych pętli `config/parameteres.csv`.

W `inc` znajduje się 16 plików odpowiadających za testowanie pętli oraz jeden do definiowania procedury w `MySQL`, która dopiero, kiedy zostanie wywołana wywołana będzie wykonywać pętle.

W `util` umieściłem narzędzia pomocnicze, które pozwalały mi na przerzucanie danych z pliku tekstowego do bazy `SQLite`, oraz mierzenie różnic między wynikami dwóch metod pomiaru czasu trwania programu. Jest tam też skrypt do dopasowywania modelu i tworzenia pliku `config/parameters.csv`, oraz skrypt do ładowania tych parametrów do bazy danych `sqlite`. Wykorzystanie plików tekstowych do logowania wyników pomiarów jest z jednej strony związane z rozwijaniem tego softu. Pliki tekstowe były stosowane zanim przeszedłem na silnik bazodanowy. Z drugiej strony nie chciałem zaśmiecać bazy danymi pomiarowymi, których nie byłem pewien, więc jeśli istniało ryzyko, że program, który testuję będzie działał źle - na przykład kiedy spodziewałem się, że wyjdę poza zakres danego typu liczbowego - wyłączałem logowanie do bazy i posługiwałem się tylko plikiem. Jeśli wszystko było ok, mogłem bez problemu załączyć nowe wyniki do uzyskanych wcześniej.

Katalog `log` służy do przechowywania plików tekstowych oraz bazy danych `SQLite`. Plik `result.log` zawiera kopię danych, które trafiają do bazy danych, `results_timing_methods.log` przechowuje wyniki pomiarów czasu. Podczas testowania w tym katalogu pojawiają się na czas testów inne pliki z logami.

Poza tym projekt zawiera:

- `install.sh` - skrypt instalacyjny (omówiłem go w poprzednim paragrafie),
- `inc.bash` - bazowy skrypt do robienia pomiarów czasu trwania pustych pętli,
- `util/generate_parameters.py` - skrypt w języku Python do dopasowania modeli i wyznaczenia parametrów,
- `util/generate_plots.py` - skrypt w języku Python do generowania wykresów wyników pomiarów,
- `test.sh` - skrypt do testowania działania `inc.bash` oraz innych elementów projektu.

Dzięki takiej strukturze jesteśmy w stanie bez problemu dodawać nowe języki programowania. Trzymanie w bazie numeru rewizji pozwala nam również sprawdzać, jak różne instrukcje spełniające teoretycznie tą samą funkcjonalność (np: `for` vs `while`) różnią się od siebie wydajnością.

## Dataflow

Przepływ danych w programie posiada wbudowane sprzężenie zwrotne. Z jednej strony `inc.bash` testuje pętle za pomocą parametrów wyliczonych z modelu za pomocą `util/generate_parameters.py`, z drugiej strony, żeby móc dopasować model do danych, musieliśmy je najpierw dostać właśnie uruchamiając `inc.bash`.

Patrząc na wykres przepływu danych łatwo znajdziemy zamknięte koło, które mam na myśli.

[![Loopspeed.png](https://s9.postimg.org/fbg1yihnz/Loopspeed.png)](https://postimg.org/image/mrfbkb5d7/)

Jest to klasyczny problem, co było pierwsze, jajko czy kura? Pierwszy był model teoretyczny, który określił co warto mierzyć czy dane doświadczalne, dzięki którym możemy go zgadnąć? Tak jak w biologicznym odpowiedniku, tak tutaj odpowiedzią jest ewolucja. Początkowo każdy z programów `inc.i`, (gdzie `i` jest numerem testowanego języka programowania) był włączany ręcznie. Z jedną pętlą. Później z tysiącem, milionem, miliardem. Kiedy widziałem, że wykonuje się dłużej niż kilka sekund obniżałem liczbę pętli, kiedy krócej niż sekundę podnosiłem ją. Dążyłem do tego, żeby ręcznie znaleźć liczbę pętli odpowiadającą miej więcej 4-5 sekund wykonywania programu. Tak uzyskiwałem pierwsze wartości parametrów, które jeszcze wtedy były wpisywane ręcznie do kodu programu `inc.bash`. Dzięki temu uwspólniłem skalę dla wszystkich z wyjątkiem języka `Matlab`, którego inicjalizacja trwała 5 sekund z kawałkiem. Dla `Matlaba` robiłem oddzielną serię pomiarową zanim go wyczułem. Dane z tego typu testów trafiały do pliku `results.log`, ale o tym czy przenosić je do `log.db` decydowałem na podstawie zdrowego rozsądku, w jednym przypadku zdarzyło się, że dla jednego z języków czasy rosły wraz z liczbą pętli `$size` do pewnego momentu, a zaczęły trzymać się stałego poziomu. Okazało się, że zakresy zmiennych nie wystarczają do pomieszczenia liczby iteracji i jest ona po prostu rzutowana na mniejszą wartość. Były przypadki (`python` oraz `r`) gdzie brakowało pamięci RAM, bo pętla `for` zamiast inkrementować skalarny wskaźnik była skonstruowana tak, że ładowała do pamięci operacyjnej całą tablicę, po której później przebiegała. Ogólnie rzecz biorąc, nie dało by się zupełnie zautomatyzować testów na tym etapie. W niektórych językach trzeba było zmieniać typy, na przykład w `Pascalu` zwykły `Int` nie wystarczył i trzeba było stosować `QWord`, analogicznie w `C#` typ `Int32` był zmieniany na `UInt64`. Podsumowując: początkowo model istniał tylko w mojej głowie. Na początku nie było `analysis.nb` ani `list.txt`, `inc.bash` zawierał zakodowane na sztywno przybliżone szybkości pętli i nie miał tylu opcji, z którymi można było go włączać.

Kiedy `results.log` rozrósł się, a ja zrozumiałem, że testowanie w stronę krótszych czasów jest nieopłacalne bo generuje za dużo błędu pomiarowego, a w stronę dłuższych czasów nieopłacalne, bo nie wnosi żadnych nowych efektów, wtedy powstał program `text_to_sqlite.pl` do konwertowania pliku tekstowego do postaci wierszy w bazie danych. Zrezygnowałem z zapisywania zmiennej `$speed` - szybkości pętli, jako, że dzięki silnikowi bazodanowemu jej wyliczanie było prostsze, uznałem natomiast, że jeśli wprowadzam zmiany w programach `inc.i`, to w danych może pojawić się bałagan. Żeby móc wykrywać, z jakiej wersji programu pochodzą dane zapisy dodałem zmienną `$git` z numerem rewizji. Wtedy powstał notebook `analysis.nb` i z jego pomocą wyliczyłem parametry do `bash.inc` z większą dokładnością. Zaplanowałem też serię pomiarową `list.txt` która wykładniczo rozrzedzała się dla rosnących czasów pomiarów. Na koniec obliczanie parametrów przeniosłem do skryptu `util/generate_parameters.wl`, dopisałem `util/parameters_load.pl` do ich konwersji do bazy `sqlite` i podłączyłem te dane do `inc.bash`. Dzięki modelowi mogłem wyliczyć ile czasu będzie trwał jaki pomiar. W ten sposób obieg danych zamknął się. Model zaczął wyznaczać optymalne punkty pomiarowe, a uzyskiwane dane zaczęły płynąć w coraz bardziej zautomatyzowany i zracjonalizowany sposób.

### Jądro programu

Kiedy wiemy już co jak działa i do czego służy obejrzymy kod programu `inc.bash`. Program zaczyna się od funkcji odpowiedzialnej za wyświetlanie okna pomocy.

> inc.bash

```bash
#! /bin/bash

show_help() {
cat << EOF
Usage: bash inc.bash [-a](-f|-l) (single_number|-f file_with_numbers_in_lines)

    -h          display this help and exit
    -a          all programs enable, enable this only if you have
                license on Mathematica and Matlab.
    -t          time based mode of calculations. You assign number
                of seconds for each program. Programs goes equally.
    -l          line based mode of calculations. You assign number
                of lines executed by loop. Good mode for debug.
    -f file     load numbers of seconds (-t) or loops (-l) from file,
                default config/list.txt
EOF
}
```

Widzimy, że posiada on kilka flag, z których możemy korzystać. Pierwszą znich jest `-a` służąca do wykonywania testów z wykorzystaniem oprogramowania komercyjnego: `matlab` i `mathematica`. Domyślnie jest to wyłączone, żeby program był dostępny bez konieczności ich instalowania. Następnie mamy do wyboru `-t` i `-l` odpowiadających za sposób wyznaczania ilości pętli. W opcji `-t` użytkownik wyznacza czas w sekundach jaki ma zająć wykonywanie każdego z badanych programów `inc/inc.i`, na podstawie tego czasu i parametrów wyznaczonych wcześniej przez `util/generate_parameters.wl` określane są liczby pętli dla każdego z nich. Opcja `-l` pozwala na pomiar dokładnej ilości pętli jakie chcemy wykonać. Na koniec określamy liczbowo ilość oczekiwanych sekund lub wykonywanych pętli albo za pomocą flagi `-f` ładujemy plik z serią pomiarową. Następnie program stosuje bardzo ciekawy mechanizm czyszczenia po sobie niezależnie od sposobu w jaki ma zostać zamknięty.

```bash
function onExit {
	[ ! -z "$TMP" ] && \
	[   -d "$TMP" ] && \
	rm -Rf "$TMP";
	rm -f inc.class;
	exit;
}
```

Zastosowano tutaj ciekawą składnię z flagami `-z` i `-d`. Dokumentacja [basha](http://tldp.org/LDP/Bash-Beginners-Guide/html/sect_07_01.html) wyjaśnia, że lokalizacja wskazywana przez zmienną `$TMP` ma zostać usunięta jeśli zmienna `$TMP` coś w ogóle zawiera i jeśli wskazuje na katalog. Kolejna linia to usunięcie pliku pochodzącego z kompilacji `javy`, który nie trafił do `$TMP` tylko dlatego, że nie potrafiłem go tam wrzucić.

Funkcja `onExit` wykona się przy zamykaniu programu, co będzie zaznaczone później. Teraz przyjrzymy się funkcji `test` - kompletującej wszystkie dane, wykonującej testy i wysyłającej dane do bazy oraz pliku. Jest to centralny punkt całego systemu, odpowiada ona za uwspólnienie interfejsu wszystkich programów.

```bash
function test {
	name="$1";
	size="$2";
	comm="${@:3}"
```

Przyjmuje ona na wejściu trzy lub więcej parametrów. Pierwszy to nazwa: zwykle `inc.<rozszerzenie języka>` np: `inc.c` lub `inc.js`. Nie jest ona w żaden sposób powiązana ani z lokalizacją pliku źródłowego, ani wykonywalnego. W zasadzie mogła by być dowolna. Przyjąłem jednak konwencję, że nazywa się tak jak plik źródłowy. Drugi parametr to liczba pętli jaka ma zostać wykonana `$size`. Kolejne parametry, niezależnie od ich ilości wrzucane są do zmiennej `$comm` - jest to komenda do włączenia programu, ale bez liczby pętli.

```bash
    [ $size -le 0 ] && return;
```

Po zabezpieczeniu się, że liczba pętli nie może być ujemna funkcja `test` może wykonywać pomiar czasu.

```bash
    time=`bash util/timing.sh $comm $size`
	echo $name,$size,$time,$GIT	\
	    | tee -a log/results.log \
	    | awk -F ',' '{printf "| %-12s | %15s | %12.6f s | %19.2f |\n", $1, $2, $3, $2/$3;}'
```

Widzimy, że wykorzystuje do tego program `util/timing.sh` podając mu komendę do wykonania wraz z liczbą pętli. Wynik działania programu `timing.sh` przekazywany jest do zmiennej `time`. Następnie nazwa, ilość tętli, czas i numer rewizji wysyłane są do pliku `log/results.log` oraz a nazwa, ilość pętli, czas i szybkość wyświetlane na ekranie. Numer rewizji znajduje się w globalnej zmiennej `GIT` i będzie zdefiniowany później. Ten sam zestaw danych, który zapisany było do pliku `log/resutls.log` trafia do bazy danych.

```bash
     sqlite3 log/log.db  "insert into log (name,size,time,git) values ('$name',$size,$time,'$GIT');"
}
```

Kolejna funkcja służy głównie uporządkowaniu kodu programu i zostanie wywołana tylko raz bez żadnych parametrów.

```bash
function compile {
    g++ -O1 -o "$TMP/cpp" 'inc/inc.cpp';
    gcc -O1 -o "$TMP/c"   'inc/inc.c';
    mcs -out:"$TMP/cs.exe" inc/inc.cs
    javac 'inc/inc.java' -d .;
    mysql -u root < inc/def.sql;
    f95 -O1 -o "$TMP/f" inc/inc.f95
    fpc -O2 inc/inc.p -o"$TMP/p" -Tlinux &>/dev/null
}
```

Wykonuje ona kompilacje języków które tego wymagają. Czas kompilacji nie jest nigdzie mierzony.

Zupełnie inaczej jest z funkcją `calculate` obliczającą ilość pętli która ma się wykonać. Ta funkcja będzie wykonywana przy każdym pojedynczym teście. Jej działanie uzależnione jest od wartości zmiennej globalnej `$timeMode`. Jeśli włączamy program z flagą `-l` to `$timeMode=0` i funkcja zwróci nam swój pierwszy argument oraz wartość liczbową zmiennej globalnej `$POW`. Jedynym argumentem tej funkcji jest nazwa języka - u nas zapisywana jako `inc.<rozszerzeie>`. Zmienna `$POW` odpowiada liczbie którą podajemy do programu niezależnie czy robimy to za jego nazwą, czy jest to jedna z liczb z pliku jaki wrzucamy za flagą `-f`. Jeśli program działa z flagą `-t` to za pomocą programu `awk` wyliczamy liczbę pętli ze wzoru `(pow-b)/a` gdzie `pow` jest czasem w sekundach, natomiast `b` oraz `a` są parametrami dopasowania prostej. Nasze `a` i `b` to w programie elementy tablicy asocjacyjnej, którą będziemy niedługo definiować.

```bash
# number of loops for given languages in dependence from $timeMode
function calculate {

    if [[ "$timeMode" -eq "1"  ]]; then
        echo $1 ${a[$1]} ${b[$1]} $POW | awk '{ printf "%s %.0f\n", $1, ($4-$3)/$2 }';
    else # linemode for debug
        echo $1 $[1*POW];
    fi
}
```

Tymczasem przyjżymy się funkcji odpowiedzialnej za testowanie całego zbioru programów dla danego parametru `$POW`.

```bash
function testbundle {
    [ "$allPrograms" -eq "1" ] && test    $(calculate inc.m.sh    )    bash    inc/inc.m.sh; # long time of setup about 5 sec
    test    $(calculate inc.bash    )    bash    inc/inc.bash;
    test    $(calculate inc.sql.sh  )    bash    inc/inc.sql.sh;
    [ "$allPrograms" -eq "1" ] && test    $(calculate inc.wl      )    MathematicaScript -script inc/inc.wl;
    test    $(calculate inc.r       )    Rscript inc/inc.r;
    test    $(calculate inc.cs      )    mono    "$TMP/cs.exe";
    test    $(calculate inc.js      )    node    inc/inc.js;
    test    $(calculate inc.python  )    python  inc/inc.python;
    test    $(calculate inc.rb      )    ruby    inc/inc.rb;
    test    $(calculate inc.pl      )    perl    inc/inc.pl;
    test    $(calculate inc.php     )    php     inc/inc.php;
    test    $(calculate inc.f95     )    "/$TMP/f";
    test    $(calculate inc.cpp     )    "$TMP/cpp";
    test    $(calculate inc.c       )    "$TMP/c";
    test    $(calculate inc.p       )    "$TMP/p";
    test    $(calculate inc.java    )    java inc;
}
```

Widzimy, że sprawdza ona wartość zmiennej `$allPrograms` powiązanej z flagą `-a`, żeby włączać testy `mathematica` i `matlab` tylko jeśli ustawiono tą flagę. Poza tym wykonuje ona bardzo powtarzalny schemat - dla każdego programu włącza funkcję `test`. Za dwa pierwsze parametry - nazwę i liczbę pętli podstawia wynik funkcji `calculate`, wszystkie pozostałe są zwijane do komendy odpalającej testowany program.

Do wyjaśnienia pozostaje jeszcze - skąd wzięły się tablice asocjacyjne parametrami. Za ich utworzenie odpowiada funkcja `loadParams`.

```bash
function loadParams {
source <(sqlite3 log/log.db "select name, a from result" |
         awk -F '|' '{printf("a[%s]=%s;\n",$1,$2);}')

source <(sqlite3 log/log.db "select name, b from result" |
         awk -F '|' '{printf("b[%s]=%s;\n",$1,$2);}')
}
```

Stosowana tu składnia z wykorzystaniem `source` jest bardzo niezalecana w przypadku danych pochodzących od użytkowników. Tutaj jednak dane sami generujemy i uznałem, że jest to najłatwiejszy sposób na zdefiniowanie tych tablic. `Source` odpowiada za wykonanie kodu, który dostaje, a dostaje przetworzone do postaci np: `a[inc.bash]=4.231982349e-06` wyniki zapytań do tabeli z parametrami.

Logika skryptu jest dość przewidywalna. Zaczyn się od przejścia do katalogu gdzie zlokalizowany jest skrypt. Następnie ustawiamy coś w rodzaju nasłuchu na zdarzenia `SIGINT`, `SIGTERM` i `EXIT`. Oznacza to, że jeśli będziemy chcieli wyłączyć program zanim skończy działać, to po sobie posprząta.

```bash
cd "$(dirname "${BASH_SOURCE[0]}")";
trap onExit SIGINT SIGTERM EXIT;
```

Jeśli zastanawiasz się, co tu jest do sprzątania, to kolejna linijka stanowi odpowiedź na Twoje pytanie. Tworzymy w niej katalog tymczasowy do przechowywania skompilowanych wersji programów i wstawiamy jego lokalizację do zmiennej `$TMP`.

```bash
TMP="$(mktemp -d)";
```

Do zmiennej globalnej `$GIT` przypisujemy aktualny numer rewizji.

```bash
GIT=`git rev-parse HEAD`;
```

Tworzymy tablice asocjacyjne `a` oraz `b`

```bash
declare -A a
declare -A b
```

I ustawiamy domyślne wartości wszystkich falg oraz zmiennych.

```bash
allPrograms=0; # if all programs should be tested? Default: no, because licence is not free.
configFile='config/list.txt';
timeMode=1;
fileMode=0;
```

W pętli `while` przetwarzamy wszystkie danej wprowadzone przez użytkownika.

```bash
while getopts hatlf opt; do
    case $opt in
        h)
            show_help
            exit 0
            ;;
        a)  allPrograms=$((allPrograms+1))
            ;;
        t)  timeMode=1;
            ;;
        l)  timeMode=0;
            ;;
        f)  configFile=${2:-${configFile}}; fileMode=1;
            ;;
        *)
            show_help >&2
            exit 1
            ;;
    esac
done
shift "$((OPTIND-1))" # Shift off the options and optional --.
```

Po wychwyceniu wszystkich opcji przechwytujemy jeszcze parametr określający liczbę pętli lub sekund. Ładujemy parametry do tablic asocjacyjnych i kompilujemy programy.

```bash
POW=${1:-4};
loadParams;
compile
```

Wyświetalmy przyjazne elementy interfejsu użytkownika z nagłówkami tabeli.

```bash
echo '+--------------+-----------------+----------------+---------------------+';
echo '|     File     |      Size       |      Time      |        Speed        |';
echo '+--------------+-----------------+----------------+---------------------+';

```

Wykonujemy testowanie odpowiednią liczbę razy.

```bash
if [[ "$fileMode" -eq "1" ]]; then
   while IFS='' read -r POW || [[ -n "$POW" ]]; do
      testbundle;
   done < ${1:-${configFile}}
else
  testbundle;
fi
```

I kończymy program domknięciem tabeli.

```bash
echo '+--------------+-----------------+----------------+---------------------+';
```

### Skrypty usprawniające przepływ danych

Z czasem zwiększania ilości danych i testowania nowych zakresów pojawiła się potrzeba automatyzacji procesu przepływu danych. Służy do tego kilka poniższych skryptów.

Do przerzucania tekstowych wyników pomiarów do bazy danych służy program:

> util/text\_to\_sqlite.pl

```perl
#!/usr/bin/perl -w
use warnings FATAL => 'all';
use DBI;
use strict;
#https://mailliststock.wordpress.com/2007/03/01/sqlite-examples-with-bash-perl-and-python/
my $db = DBI->connect("dbi:SQLite:log/log.db", "", "",{RaiseError => 1, AutoCommit => 1});


my $filename =  $ARGV[0] || 'log/results.log';
```

Po nagłówkach mamy tutaj zmienną `$db` przechowującą połączenie z bazą i `$filename` pobierającą argument z linii komend z domyślą wartością ustawioną na lokalizację pliku z logami. Takie ustawienie zmiennych dawało elastyczność, a jednocześnie nie wymagało wpisywania parametrów w najbardziej powtarzalnych sytuacjach. Następnie program otwierał plik:

```perl
open( my $fh => $filename) || die "Cannot open $filename: $!";
```

i iterując po jego liniach zapisywał odpowiednio przekształcone rekordy do bazy:

```perl
while(my $line = <$fh>) {
        my @row = split(",",$line);
        $db->do("INSERT INTO log (name,size,time,git) values ('".$row[0]."',$row[1],$row[2],'$row[3]');");
}
close($fh);
```

## Analiza

Zdarzało nam się na tym blogu analizować dane. Schemat jest prosty. Łączymy się z bazą. Wyciągamy dane do zmiennej, dopasowujemy model, na koniec rysujemy wykresy lub eksportujemy wyniki obliczeń.

Omówimy teraz skrypt w języku Python, który przekształca wyniki pomiarów na parametry modelu. Do zarządzania zależnościami i uruchamiania skryptu użyjemy narzędzia `uv`.

> util/generate\_parameters.py

```python
#!/usr/bin/env python3
# /// script
# dependencies = [
#   "numpy",
#   "scipy",
#   "matplotlib",
# ]
# ///

import os
import sqlite3
import numpy as np
from scipy.optimize import curve_fit

def model_func(sizes, a, b):
    return np.log(np.exp(a) * sizes + b**2)

def main():
    db_path = os.path.join(os.getcwd(), "log/log.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Connection with database established...")

    cursor.execute("SELECT name FROM log GROUP BY name ORDER BY name")
    languages = [row[0] for row in cursor.fetchall()]

    data = {}
    for lang in languages:
        cursor.execute("SELECT size, time FROM log WHERE name=?", (lang,))
        rows = cursor.fetchall()
        sizes = np.array([r[0] for r in rows], dtype=float)
        times = np.array([r[1] for r in rows], dtype=float)
        data[lang] = (sizes, times)

    print("Data extracted from database...")

    results = []

    for lang in languages:
        sizes, times = data[lang]
        y = np.log(times)

        p0 = [-18.0, 0.05]
        try:
            popt, pcov = curve_fit(model_func, sizes, y, p0=p0, maxfev=20000)
            perr = np.sqrt(np.diag(pcov))
            a, b = popt
            ea_val, eb_val = perr
        except Exception as e:
            print(f"Error fitting {lang}: {e}")
            a, b, ea_val, eb_val = -18.0, 0.05, 0.0, 0.0

        A = np.exp(a)
        B = b**2
        ea = A * ea_val
        eb = np.abs(2 * b) * eb_val

        results.append((lang, A, B, ea, eb))

    print("Nonlinear models calculated...")
    print("Parameters extracted from models...")

    csv_path = os.path.join(os.getcwd(), "config/parameters.csv")
    with open(csv_path, "w") as f:
        for lang, A, B, ea, eb in results:
            f.write(f"{lang},{A:.10g},{B:.10g},{ea:.10g},{eb:.10g}\n")

    print("Parameters saved to file. Process finished correctly.")

if __name__ == "__main__":
    main()
```

Skrypt zaczyna pracę od połączenia do bazy danych `SQLite` za pomocą standardowego modułu `sqlite3`. Wyciągamy z bazy unikalną listę języków, a następnie dla każdego języka pobieramy pary wartości: liczbę wykonanych pętli `size` ($N$) oraz zmierzony czas `time` ($T$).

Do dopasowania modelu wykorzystujemy funkcję `curve_fit` z biblioteki `scipy.optimize`.

Dopasowywany model przyjmuje postać: `np.log(np.exp(a) * sizes + b**2)`. Choć na pierwszy rzut oka tak nie wygląda, jest to prosta $T = A \cdot N + B$ przekształcona do skali logarytmicznej. Spójrzmy na to tak. Do zmiennych $N$ i $T$ dopasowujemy prostą $T = A \cdot N + B$. Po zlogarytmowaniu obu stron otrzymujemy $\log(T) = \log(A \cdot N + B)$. Jednak ponieważ czas wykonywania pojedynczej pętli $A$ jest bardzo mały, a czas startu $B$ zawsze dodatni, wprowadzamy podstawienia $A = e^a$ oraz $B = b^2$.

Dzięki temu parametr $a$ przyjmuje wartości o naturalnych rzędach wielkości (np. około -18), a na $b$ nie musimy narzucać sztucznych ograniczeń dotyczących znaku podczas optymalizacji numerycznej.

Funkcja `curve_fit` zwraca wyznaczone parametry `popt` ($a$ oraz $b$) oraz macierz kowariancji `pcov`. Odchylenia standardowe błędów wyliczamy z przekątnej macierzy kowariancji (`np.sqrt(np.diag(pcov))`), a następnie przeliczamy na błędy parametrów $A$ i $B$ stosując wzory na propagację błędów: $ea = A \cdot \sigma_a$ oraz $eb = |2b| \cdot \sigma_b$.

Wyliczone parametry $A$, $B$, $ea$ oraz $eb$ zapisujemy do pliku `config/parameters.csv`.

## Wyniki

Dla każdego języka omówimy wyniki. Zamiast podawać ilość wykonywanych pętli na sekundę, na wykresach prezentujemy jej logarytm $a$, jako łatwiejszy do porównywania. A zamiast czasu włączania programu odpowiadającemu jednemu wykonaniu pętli jego pierwiastek $b$.

Do prezentacji wyników w postaci wykresów wykorzystujemy poniższy skrypt w języku Python (`util/generate_plots.py`), który przy pomocy `matplotlib` generuje podwójnie logarytmiczne wykresy dla każdego języka.

> util/generate\_plots.py

```python
#!/usr/bin/env python3
# /// script
# dependencies = [
#   "numpy",
#   "scipy",
#   "matplotlib",
# ]
# ///

import os
import sqlite3
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit

def model_func(sizes, a, b):
    return np.log(np.exp(a) * sizes + b**2)

def main():
    db_path = os.path.join(os.getcwd(), "log/log.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM log GROUP BY name ORDER BY name")
    languages = [row[0] for row in cursor.fetchall()]

    for lang in languages:
        cursor.execute("SELECT size, time FROM log WHERE name=?", (lang,))
        rows = cursor.fetchall()
        sizes = np.array([r[0] for r in rows], dtype=float)
        times = np.array([r[1] for r in rows], dtype=float)

        p0 = [-18.0, 0.05]
        try:
            popt, _ = curve_fit(model_func, sizes, np.log(times), p0=p0, maxfev=20000)
            a, b = popt
        except Exception:
            a, b = -18.0, 0.05

        A = np.exp(a)
        B = b**2

        fig, ax = plt.subplots(figsize=(10, 6))
        ax.scatter(sizes, times, color='red', alpha=0.7, label='Experimental data', zorder=5)

        x_fit = np.logspace(0, 13, 500)
        y_fit = A * x_fit + B

        ax.plot(x_fit, y_fit, color='blue', linewidth=2, label=f'Model: T = {A:.2e} * N + {B:.4f}', zorder=4)

        ax.set_xscale('log')
        ax.set_yscale('log')
        ax.set_xlabel('$size [number of loops]', fontsize=12)
        ax.set_ylabel('$time [sec]', fontsize=12)
        ax.set_title(f'Performance Analysis: {lang}', fontsize=14)
        ax.grid(True, which="both", linestyle="--", alpha=0.5)
        ax.legend(loc='upper left', fontsize=11)

        out_path = f"inc_{lang}.png"
        plt.tight_layout()
        plt.savefig(out_path, dpi=150)
        plt.close(fig)
        print(f"Generated plot: {out_path}")

if __name__ == "__main__":
    main()
```

Skrypt iteruje po wszystkich zbadanych językach programowania, nanosi punkty pomiarowe na siatkę log-log oraz rysuje dopasowane proste modelowe, po czym zapisuje wykresy do plików `.png`.

### Bash

Język powłok [bash](https://pl.wikipedia.org/wiki/Bash) powstał w 1987 roku, czyli 4 lata przed powstaniem pierwszego jądra Linuxa. Obecnie jest używany głównie do wykonywania operacji związanych z systemem operacyjnym Linux, mimo, że Linux i Bash mogą istnieć bez siebie. Jest to język interpretowany i z tego względu nie jest zoptymalizowany pod wykonywanie obliczeń. Kod wykonujący puste pętle wygląda tak:

```bash
#! /bin/bash

i=0;
max=$1;

while [[ $i -le $max ]];
do
	i=$[i+1];
done
```

A oto wyniki pomiarów czasu:

![inc_inc.bash.png](/img/loopspeed/inc_inc.bash.png)

W naszym teście wypadł najsłabiej, jeśli chodzi o ilość wykonywanych pętli na jednostkę czasu, ale spośród wszystkich języków interpretowanych jest pierwszy, jeśli chodzi o czas włączania. Nie ustępuje jednak bardzo pod tym względem językom kompilowanym.

### Matlab

[Matlab](https://pl.wikipedia.org/wiki/MATLAB) jest językiem zaprojektowanym do obliczeń macierzowych. Jego historia sięga 1980 roku. Początkowo napisany w Fortranie miał ułatwić studentom obliczenia macierzowe, trzy lata później przepisany w `c` i systematycznie rozbudowywany o nowe funkcjonalności stał się jednym z najpopularniejszych języków stosowanych przez naukowców szczególnie w zastosowaniach związanych z obliczeniami numerycznymi.

`Matlab` nie ma wygodnego interfejsu konsolowego. Żeby przekazać mu zmienną musieliśmy sklejać kod interpretowany w `Matlabie` za pomocą `basha`.

```bash
#!/usr/bin/env bash

read -r -d '' VAR << EOM
for c = 1:$1
%  disp(c)
end
EOM

echo "$VAR" | matlab -nodesktop -nosplash 1>/dev/null
```

[![inc_inc.m.sh.png](https://s28.postimg.org/6ujap8x31/inc_inc_m_sh.png)](https://postimg.org/image/dxr64v2ih/)

Jeśli chodzi o szybkość wykonywania jednej pętli to `Matlab` poradził sobie najlepiej w kategorii języków interpretowanych (z wyjątkiem `javy`, która jest takim hybrydowym rozwiązaniem). Opłacił to jednak potwornie długim czasem włączania sięgającym 5 sekund. Jest to znacznie dłuższy czas niż zabierany na którąkolwiek z kompilacji. `Matlab` jest dobry, ale do dużych rzeczy, w przeciwnym wypadku nie opłaca się go włączać, ponieważ przez te 5 sekund `bash` wykonał by milion pętli, a typowe skryptowe języki do 100 milionów.

### MySQL

Sam [`MySQL`](https://pl.wikipedia.org/wiki/MySQL) jest raczej systemem do zarządzania bazą danych niż językiem. Język to `SQL`, ale ze względu na różnice w implementacjach silników bazodanowych wolałem podkreślić `MySQL`, niż zostawić `SQL`. Tak czy inaczej silniki bazodanowe, jak i język zapytań do baz danych nie były tworzone z myślą o inkrementacji zmiennych i sprawdzaniu warunków. Można by powiedzieć, że procedury i instrukcje sterujące to raczej dodatek, który pomaga ograniczyć ilość zapytań niż główna funkcjonalność baz danych. Należy pamiętać, że taka mikro-optymalizacja na tym poziomie nie ma sensu, ponieważ najbardziej kosztowne czasowo operacje znajdują się w selektach i trzymaniu spójności danych przy update/delete/insert.

Do `mysql` również nie da się łatwo przekazać parametru z konsoli jako wartości podanej po nazwie programu. Użyliśmy następującego konektora

```bash
#!/usr/bin/env bash

mariadb inc -e "CALL inc_loop($1)";
```

A procedura `inc_loop` definiowana była w ten sposób:

```sql
CREATE DATABASE IF NOT EXISTS inc;
use inc;

DROP PROCEDURE IF EXISTS inc_loop;

DELIMITER $$
CREATE PROCEDURE inc_loop(IN n INT)
 BEGIN
 DECLARE _n INT DEFAULT 0;

 WHILE _n <= n DO
 SET  _n = _n + 1;
 END WHILE;

 END$$
DELIMITER ;
```

![inc_inc.sql.sh.png](/img/loopspeed/inc_inc.sql.sh.png)

Z tego względu `MySQL` w tym zestawieniu zajmuje miejsce drugie od końca. Należy jednak przyznać, że prawdziwe wąskie gardło baz danych - czas łączenia uplasował się na umiarkowanie dobrej pozycji pośród języków skryptowych: między perlem a `pythonem`.

### Wolfram Language - Mathematica

Mathematica jest programem. [Wolfram Language](https://en.wikipedia.org/wiki/Wolfram_Language) językiem w jakim piszemy w tym programie. Język ten sięga historią roku 1988, został zaprojektowany z myślą o algebrze symbolicznej. Obecnie ma bardzo szerokie możliwości związane z wszelkiego rodzaju obliczeniami. Ustępuje `Matlabowi` w temacie wydajności przetwarzania macierzy i numeryki, nadrabia wygodą i bardziej intuicyjną reprezentacją danych.

W porównaniu z dwoma poprzednikami, kod programu `inc.wl` jest bardzo prosty

```
num  = ToExpression[$ScriptCommandLine[[2]]];
For[i = 0, i < num, i++];
Exit[];
```

[![inc_inc.wl.png](https://s27.postimg.org/519tj8x1f/inc_inc_wl.png)](https://postimg.org/image/75u6kbynz/)

W tym teście Mathematica poradziła sobie słabo lokując się w kategorii szybkości pętli na 4 miejscu od końca, a w kontekście szybkości włączania na 2 od końca.

### C#

Język [C#](https://pl.wikipedia.org/wiki/C_Sharp) powstał w 2000 i aktualnie jest wciąż rozwijany. Ma w sobie wiele cech języków `Object Pascal`, `Delphi`, `C++` i `Java`. Do działania wymaga mono, lub innego środowiska uruchomieniowego. Kompiluje się nie do kodu binarnego, ale do kodu pośredniego. Niestety nie udało mi się zoptymalizować jego kompilacji tak jak dla `Pascala`, `C`, `C++` i `Fortrana`. Jeśli znasz się na tym, proszę o komentarz, lub kontakt w tej sprawie.

Sam program wygląda rzeczywiście podobnie do swoich pierwowzorów.

```c#
using System;
public class Program
{
    public static void Main(string[] args)
    {
        for (ulong i = 1; i <= UInt64.Parse(args[0]); i++)
        {}
    }
}
```

![inc_inc.cs.png](/img/loopspeed/inc_inc.cs.png)

Szybkość włączania jest umiarkowania, a szybkość pojedynczej pętli plasuje język na umiarkowanie słabej pozycji - 6 od końca.

### JS

[JavaScript](https://pl.wikipedia.org/wiki/JavaScript) z pewnością wielu ludziom myli się z Javą. Teraz się to wydaje zabawne, ale mi też się na początku mylił. Nic dziwnego, bo w 1995, kiedy język powstał nazwę wzięto od Javy, żeby JavaScript miał lepszy marketing. Tak naprawdę nie mają ze sobą wiele wspólnego. Obecnie jest to żywy wciąż rozwijany język, który zainspirował i bardzo spopularyzował funkcyjny styl programowania. Za jego sprawą w wielu innych językach pojawiły się tak zwane funkcje lambda, których składnia w ES6 została skrócona, tak, że nazywa się je [strzałkowymi](http://shebang.pl/artykuly/es6-funkcje-strzalkowe/).

Kod źródłowy jest całkiem przyjemny i wygląda tak:

```js
var max = process.argv[2];
for (var i = 0; i <= max; i++) {}
```

![inc_inc.js.png](/img/loopspeed/inc_inc.js.png)

W przeciwieństwie do `C#`, `JavaScript` jest umiarkowanie słaby jeśli chodzi o szybkość włączania, ale z szybkością pętli radzi sobie już lepiej - jak typowy język skryptowy.

### Python

[Python](https://pl.wikipedia.org/wiki/Python) pojawił się w roku 1991. Jest językiem ogólnego przeznaczenia, którego głównymi cechami są: sztywne wcięcia a wiec czytelna i klarowna składnia. Jest też dość zwięzły i stanowi bardzo ważną alternatywę dla `perla`. Jest bardzo popularny w środowisku naukowym.

```python
#!/usr/bin/python

import sys

max=int(sys.argv[1]);

count = 0
while (count < max):
   count = count + 1
```

Od razu zaznaczę, że ten kod da się napisać krócej i wykonać szybciej używając pętli `for in`, ale ma ona zupełnie inną mechanikę działania - tworzy tablicę liczb z podanego zakresu, wrzuca całą tablicę do pamięci i ją przegląda. Więcej o tym piszę na końcu w dziale RAM vs Procesor. Pozbycie się zmiennej max i napisanie

```python
while (count < int(sys.argv[1])):
```

wydłużyło by czas wykonywania kilkukrotnie.

![inc_inc.python.png](/img/loopspeed/inc_inc.python.png)

Mimo, że python jest jednym z wolniejszych języków skryptowych, różnice te są na tyle małe, że można uczciwie przyznać, że mieści się dokładnie na środku rankingu. Ilość kodu nie jest przerażająca, a krzywa nauki? Jak dla mnie ciężko mówić o krzywej nauki w przypadku tego języka. Można w nim pisać, nawet go nie umiejąc, po prostu zgadując jak coś powinno być napisane. Jest to bardzo intuicyjny język o rozsądnej wydajności w większości przypadków.

### Ruby

[Ruby](<https://pl.wikipedia.org/wiki/Ruby_(j%C4%99zyk_programowania)>) jest stosunkowo młody, jak na język. Pierwsze wydanie ujrzało światło dzienne w 1995. Jest to dynamicznie typowany, obiektowy, interpretowany język popularny głównie w stanach. Jego znaczenie wzrosło po wydaniu frameworku Ruby on Rails - przeznaczonego do tworzenia aplikacji internetowych, ale widziałem Ruby w innych zastosowaniach od analizy danych giełdowych po platformę do blogowania - jekylla.

W tym języku, nie miałem okazji dużo pisać, ale kod wygląda dość przyjemnie

```ruby
for i in (1 .. ARGV[0].to_i)
end
```

Zaskakujące, że ta składnia, wcale nie zamula pamięci RAM nawet przy bardzo dużych tablicach ani nie powoduje problemów jakie w `pythonie` powoduje nie utworzenie zmiennej `max`. Składnia jest więc znacznie lepsza.

![inc_inc.rb.png](/img/loopspeed/inc_inc.rb.png)

Natomiast wyniki są średnie. Przy czym ruby raczej włącza się wolniej a działa szybciej na tle innych języków interpretowanych.

### Perl

[Perl](https://pl.wikipedia.org/wiki/Perl) pochodzi miej więcej z tych czasów co bash (1987). Jest to język o bardzo gęstej składni. Programista w nim traktowany jest raczej jak artysta niż rzemieślnik. Język pozwala na tworzenie zarówno czystego i krótkiego kodu, jak i nieczytelnej plątaniny znaków. W wielu rozwiązaniach został wyparty przez Pythona przez to, że jest trudniejszy w nauce oraz paradoksalnie bardziej elastyczny.

Jego kod źródłowy stanowi świetnym przykładem ten sam program, można napisać tak:

```perl
#!/usr/bin/perl

for(my $i=0;$i<=$ARGV[0];$i++){}
```

a można tak:

```perl
for(;$_<=$ARGV[0];$_++){}
```

Działanie będzie identyczne.

![inc_inc.pl.png](/img/loopspeed/inc_inc.pl.png)

Wyniki nie są niespodzianką. Włączanie się jest najszybsze z języków skryptowych. Czas wykonywania pojedynczej pętli umiarkowany.

### R

[R](<https://pl.wikipedia.org/wiki/R_(j%C4%99zyk_programowania)>) jest środowiskiem do obliczeń statystycznych. W całym tym zestawieniu sporo jest języków powiązanych z matematyką, bo sam się nią lubię zajmować. R szczególnie często występuje w kontekście bioinformatyki.

Cechy charakterystyczne to: strzałki do przypisywania wartości i podobnie jak w Matlabie ogromna łatwość operowania na macierzach i wektorach.

```r
args <- commandArgs(trailingOnly = TRUE)

x <- 0
while(x < as.numeric(args)) {
    x <- x+1;
}
```

![inc_inc.r.png](/img/loopspeed/inc_inc.r.png)

Podobnie jak Wolfram Language, tak i tan wysoko poziomowy język o specjalizacji sprofilowanej na testowanie hipotez statystycznych i prowadzenie badań poradził sobie słabo w tym teście. Zarówno pod względem szybkości pętli jak i uruchamiania zajął trzecią pozycję od końca.

### Php

Język [Php](https://pl.wikipedia.org/wiki/PHP) pojawił się w roku 1995, jako język do generowania stron internetowych. I choć można pisać backend webowy w innych językach, trzeba przyznać, że PHP radzi sobie z tym zadaniem całkiem dobrze. Oczywiście, wielkim serwisom opłaca się kompilowanie backendu, ale w absolutnej większości zastosowań PHP stanowi świetny kompromis między wygodą języka interpretowanego a wydajnością.

Kod php wygląda standardowo i intuicyjne

```php
<?php

$max = (int)$argv[1];

for($i=0; $i<$max; $i++);
```

![inc_inc.php.png](/img/loopspeed/inc_inc.php.png)

Jego wydajność w tym teście oceniam bardzo pozytywnie. Szybkość włączania była średnia, a w kategorii szybkości wykonania jednej pętli poradził sobie jako jeden z najlepszych języków interpretowanych. Dał się wyprzedzić jedynie Matlabowi.

### Fortran 95

[Fortan](https://pl.wikipedia.org/wiki/Fortran) jest językiem z czasów tak wczesnych, że aż ciężko sobie wyobrazić, jak wtedy programowano (1957 rok), ale były to jeszcze czasy kart perforowanych, bo pierwszy komputer z klawiaturą powstał dopiero w 1960. Dzięki bogatemu zestawowi bibliotek do obliczeń macierzowych, bardzo dobrze zoptymalizowanemu kompilatorowi, wielo-platformowości i dobremu wsparciu obliczeń równoległych Fortran jest wciąż szeroko używany w środowisku inżynierskim i naukowym, w szczególności tam, gdzie numeryka jest szczególnie ciężka - w fizyce, symulacjach, modelowaniu ośrodków ciągłych.

Ze składni języka widać, że typowanie jest statyczne, rzutowanie wykonywane za pomocą instrukcji `read`, natomiast sama pętla ma już przyjemną składnię. Subiektywnie kojarzy mi się z językiem ruby.

```fortran
PROGRAM loop_argument_times
  INTEGER(16) :: i, range
  CHARACTER(len=32) :: arg

  CALL get_command_argument(1, arg)
  read( arg, '(i16)' ) range

  do  i = 1, range
  end do

END PROGRAM
```

![inc_inc.f95.png](/img/loopspeed/inc_inc.f95.png)

Wyniki `fortrana` zasługują na wyjątkowe uznanie. W szybkości wykonywania pętli zajął pierwsze miejsce, a szybkości włączania czwarte. Warto wspomnieć, że jego twórcy dołożyli bardzo dużo pracy do optymalizacji kompilatora ponieważ obawiali się, że w przeciwnym wypadku nikt nie będzie go używać i wszyscy będą pisać w asemblerze.

### C++

[C++](https://pl.wikipedia.org/wiki/C%2B%2B) pojawił się w 1983 jako rozszerzenie języka `c` o obiektowe mechanizmy abstrakcji danych i silną statyczną kontrolę typów. W latach 90 stał się najbardziej popularnym językiem ogólnego przeznaczenia. Jest to pierwszy język jakiego się uczyłem, w gimnazjum, kiedy po podłączeniu internetu w domu, z przekory chciałem pokazać rodzicom, że gry sieciowe nie zniszczą mi dzieciństwa. Później wiele razy `c++` zaspokajał moją ciekawość dotyczącą symulowania układów fizycznych i do czasu poznania języka `Mathematica` był głównym narzędziem do robienia numeryki.

```cpp
#include <cstdlib>
int main(int argc, char *argv[])
{
	unsigned long long int i;
	unsigned long long int max = strtoul(argv[1], NULL, 0);
	for(i=0; i<max; i++);
	return 0;
}
```

![inc_inc.cpp.png](/img/loopspeed/inc_inc.cpp.png)

Jak przystało na język kompilowany ogólnego przeznaczenie `c++` staje na podium w obu rankingach. Uruchamia się jako trzeci, wykonuje pętle jako drugi najszybszy język w zestawieniu.

### C

Historia języka [`C`](<https://pl.wikipedia.org/wiki/C_(j%C4%99zyk_programowania)>) sięga roku 1972, wywodzi się on z języka [`B`](<https://pl.wikipedia.org/wiki/B_(j%C4%99zyk_programowania)>) współtworzonego przez twórcę `C` - Dennisa Ritchiego. `B` natomiast wywodzi się z [`BCPL`](https://pl.wikipedia.org/wiki/BCPL) - zapomnianego już języka, który jednak wywarł ogromny wpływ na to jak dzisiaj kodujemy. To długa i ciekawa historia, ale, żeby dygresja nie poszła zbyt daleko wrócę do `C`. Został zaprojektowany do programowania systemów operacyjnych i zadań dzisiaj uważanych za niskopoziomowe.

`C++` różni się od `C` głównie obiektowością, więc nie zobaczymy tego na przykładzie kodu źródłowego, gdzie jedyną zmianą jest użyta biblioteka.

```c
#include <stdlib.h>

int main(int argc, char *argv[])
{
	unsigned long long int i;
	unsigned long long int max = strtoul(argv[1], NULL, 0);

	for(i=0; i<max; i++);
	return 0;
}
```

![inc_inc.c.png](/img/loopspeed/inc_inc.c.png)

Wyniki testu pokazują, że `C` jest na trzecim miejscu pod względem szybkości pętli ustępując `C++` tylko o 1%, ale zajmuje pierwsze miejsca w klasyfikacji szybkości uruchamiania wyprzedzając `Pascala` o około 1‰.

### Pascal

O wilku mowa. To znaczy o [`Pascalu`](<https://pl.wikipedia.org/wiki/Pascal_(j%C4%99zyk_programowania)>) - języku, który powstał w 1970 roku i w przeciwieństwie do `C`, nie udostępniał mechanizmów niskopoziomowych, lecz został zaprojektowany do tworzenia strukturalnych aplikacji.

Mi osobiście z Pascalem kojarzy się przeciążanie operatorów, bo mimo, że jest to możliwe również w innych językach, pierwszy raz w życiu przeciążałem operator dodawania i mnożenia macieży właśnie w Pascalu.

Sam kod przypomina mi nieco fortrana. Kiedy się go uczyliśmy, profesor który objaśniał jego składnię mówił, że nie będziemy go używać, ale będziemy programować w innych językach tak jak w nim. Na przykładzie tego kodu widać, że `Pascal` wymaga definiowania zmiennych przed rozpoczęciem wykonywania logiki. Przyznaję, faktycznie tak piszę dziś we wszystkich języakch skryptowych, jeśli chcę używać zmiennych globalnych.

```pascal
program Project1;

Uses sysutils;

{$mode objfpc}

var
  I,r: QWord;
begin

  r:=StrToQWord(ParamStr(1));

  for I := 1 to r do
end.
```

![inc_inc.p.png](/img/loopspeed/inc_inc.p.png)

Pascal zajął piąte miejsce w szybkości wykonywania pętli i drugie w kategorii szbykości startowania programu.

### Java

[`Java`](https://pl.wikipedia.org/wiki/Java) jest młodym językiem na tle kilku ostatnio omawianych. Powstała w 1995. Swój sukces zawdzięcza bardzo bardzo dobrej obsłudze błędów i wyjątków oraz niezależności od systemu na jakim uruchamiamy platformę java. Korporacje kochają ją za to, że można w niej pisać bezpieczne, dobrze zabezpieczone aplikacje w rozproszonej strukturze sieciowej bez szczególnego dbania o systemy operacyjne poszczególnych maszyn.

```java
public class inc {
    public static void main(String[] args) {
	long max=Long.parseLong(args[0]);
	for (long i = max; i >= 0; i--) {
	}
    }
}
```

![inc_inc.java.png](/img/loopspeed/inc_inc.java.png)

Java zajęła czwarte miejsce pod względem szybkości pętli ustępując liderowi jedynie o 1-2%, ale jej włączanie trwało około 40 razy dłużej niż programów z czołówki rankingu. W kategorii szybkości włączania java była czwarta od końca.

### Podsumowanie

Na koniec załączam wykres porównujący czas trwania pojedynczej pętli w każdym języku wygenerowany w Pythonie za pomocą `util/generate_plots.py`:

```python
# Summary plot 1: Compare of loop time (speed.png)
sorted_by_A = sorted(params, key=lambda x: x[2])
langs_A = [item[0] for item in sorted_by_A]
log_a_vals = [item[1] for item in sorted_by_A]

fig, ax = plt.subplots(figsize=(12, 6))
colors = plt.cm.plasma(np.linspace(0, 1, len(langs_A)))
bars = ax.bar(langs_A, log_a_vals, color=colors)
ax.set_ylabel('Log[a] (Log of time per loop)', fontsize=12)
ax.set_title('Comparison of Single Loop Execution Time (Lower is better)', fontsize=14)
plt.xticks(rotation=45, ha='right', fontsize=10)
ax.grid(True, axis='y', linestyle='--', alpha=0.5)
plt.tight_layout()
plt.savefig("speed.png", dpi=150)
```

![speed.png](/img/loopspeed/speed.png)

Wykres ma skalę logarytmiczną, im niższa wartość tym lepiej.

Jeśli jesteś ciekaw dokładnych wyników poniżej prezentuję tabelę.

| language   | one loop time \[s\] | loop time error \[s\] | launch time \[s\] | launch time error \[s\] | launch to loop ratio \[s\] |
| ---------- | ------------------- | --------------------- | ----------------- | ----------------------- | -------------------------- |
| inc.f95    | 3.50468\*10^(-10)   | 1.07954\*10^(-12)     | 1.72753\*10^(-3)  | 5.04969\*10^(-6)        | 4.92921\*10^(6)            |
| inc.cpp    | 3.5061\*10^(-10)    | 1.41184\*10^(-12)     | 1.38989\*10^(-3)  | 5.77246\*10^(-6)        | 3.9642\*10^(6)             |
| inc.c      | 3.53343\*10^(-10)   | 1.01268\*10^(-12)     | 1.37686\*10^(-3)  | 3.62949\*10^(-6)        | 3.89666\*10^(6)            |
| inc.java   | 3.55209\*10^(-10)   | 1.25794\*10^(-12)     | 5.70852\*10^(-2)  | 6.74846\*10^(-5)        | 1.60709\*10^(8)            |
| inc.p      | 3.69329\*10^(-10)   | 2.36513\*10^(-12)     | 1.37772\*10^(-3)  | 4.0445\*10^(-6)         | 3.73033\*10^(6)            |
| inc.m.sh   | 2.69198\*10^(-9)    | 2.10845\*10^(-11)     | 5.28642           | 4.69114\*10^(-2)        | 1.96377\*10^(9)            |
| inc.php    | 8.89544\*10^(-9)    | 2.62779\*10^(-11)     | 2.13014\*10^(-2)  | 3.08575\*10^(-5)        | 2.39464\*10^(6)            |
| inc.rb     | 3.64662\*10^(-8)    | 1.2021\*10^(-10)      | 3.40208\*10^(-2)  | 4.46364\*10^(-5)        | 9.32938\*10^(5)            |
| inc.perl   | 4.24243\*10^(-8)    | 1.23231\*10^(-10)     | 2.15686\*10^(-3)  | 4.64159\*10^(-6)        | 5.08403\*10^(4)            |
| inc.js     | 6.14158\*10^(-8)    | 2.27239\*10^(-10)     | 4.14627\*10^(-2)  | 6.47284\*10^(-5)        | 6.75115\*10^(5)            |
| inc.python | 6.29119\*10^(-8)    | 1.69606\*10^(-10)     | 1.02831\*10^(-2)  | 1.5976\*10^(-5)         | 1.63452\*10^(5)            |
| inc.cs     | 1.59136\*10^(-7)    | 5.1884\*10^(-10)      | 1.06194\*10^(-2)  | 2.41509\*10^(-5)        | 6.67321\*10^(4)            |
| inc.wl     | 4.87908\*10^(-7)    | 1.24762\*10^(-9)      | 1.91462\*10^(-1)  | 2.2833\*10^(-4)         | 3.92415\*10^(5)            |
| inc.r      | 7.28671\*10^(-7)    | 2.11159\*10^(-9)      | 1.20264\*10^(-1)  | 1.79633\*10^(-4)        | 1.65045\*10^(5)            |
| inc.sql.sh | 2.24287\*10^(-6)    | 4.28608\*10^(-9)      | 5.33614\*10^(-3)  | 1.34152\*10^(-5)        | 2.37916\*10^(3)            |
| inc.bash   | 4.23198\*10^(-6)    | 5.03612\*10^(-9)      | 1.8443\*10^(-3)   | 4.70927\*10^(-6)        | 4.35801\*10^(2)            |

Analogicznie dla czasów włączania programów rysujemy drugi wykres:

```python
# Summary plot 2: Compare of startup time (speed2.png)
sorted_by_B = sorted(params, key=lambda x: x[3])
langs_B = [item[0] for item in sorted_by_B]
log_b_vals = [item[4] for item in sorted_by_B]

fig, ax = plt.subplots(figsize=(12, 6))
colors = plt.cm.viridis(np.linspace(0, 1, len(langs_B)))
bars = ax.bar(langs_B, log_b_vals, color=colors)
ax.set_ylabel('Log[b] (Log of startup overhead time)', fontsize=12)
ax.set_title('Comparison of Program Startup Time (Lower is better)', fontsize=14)
plt.xticks(rotation=45, ha='right', fontsize=10)
ax.grid(True, axis='y', linestyle='--', alpha=0.5)
plt.tight_layout()
plt.savefig("speed2.png", dpi=150)
```

![speed2.png](/img/loopspeed/speed2.png)

Tutaj też najlepsze wartości to najniższe. Wartość zerowa oznacza czas włączania równy 1 sekundzie.

Poniżej ta sama tabela co poprzednio, ale posortowana po czasach włączania programu:

| language   | one loop time \[s\] | loop time error \[s\] | launch time \[s\] | launch time error \[s\] | launch to loop ratio \[s\] |
| ---------- | ------------------- | --------------------- | ----------------- | ----------------------- | -------------------------- |
| inc.c      | 3.53343\*10^(-10)   | 1.01268\*10^(-12)     | 1.37686\*10^(-3)  | 3.62949\*10^(-6)        | 3.89666\*10^(6)            |
| inc.p      | 3.69329\*10^(-10)   | 2.36513\*10^(-12)     | 1.37772\*10^(-3)  | 4.0445\*10^(-6)         | 3.73033\*10^(6)            |
| inc.cpp    | 3.5061\*10^(-10)    | 1.41184\*10^(-12)     | 1.38989\*10^(-3)  | 5.77246\*10^(-6)        | 3.9642\*10^(6)             |
| inc.f95    | 3.50468\*10^(-10)   | 1.07954\*10^(-12)     | 1.72753\*10^(-3)  | 5.04969\*10^(-6)        | 4.92921\*10^(6)            |
| inc.bash   | 4.23198\*10^(-6)    | 5.03612\*10^(-9)      | 1.8443\*10^(-3)   | 4.70927\*10^(-6)        | 4.35801\*10^(2)            |
| inc.perl   | 4.24243\*10^(-8)    | 1.23231\*10^(-10)     | 2.15686\*10^(-3)  | 4.64159\*10^(-6)        | 5.08403\*10^(4)            |
| inc.sql.sh | 2.24287\*10^(-6)    | 4.28608\*10^(-9)      | 5.33614\*10^(-3)  | 1.34152\*10^(-5)        | 2.37916\*10^(3)            |
| inc.python | 6.29119\*10^(-8)    | 1.69606\*10^(-10)     | 1.02831\*10^(-2)  | 1.5976\*10^(-5)         | 1.63452\*10^(5)            |
| inc.cs     | 1.59136\*10^(-7)    | 5.1884\*10^(-10)      | 1.06194\*10^(-2)  | 2.41509\*10^(-5)        | 6.67321\*10^(4)            |
| inc.php    | 8.89544\*10^(-9)    | 2.62779\*10^(-11)     | 2.13014\*10^(-2)  | 3.08575\*10^(-5)        | 2.39464\*10^(6)            |
| inc.rb     | 3.64662\*10^(-8)    | 1.2021\*10^(-10)      | 3.40208\*10^(-2)  | 4.46364\*10^(-5)        | 9.32938\*10^(5)            |
| inc.js     | 6.14158\*10^(-8)    | 2.27239\*10^(-10)     | 4.14627\*10^(-2)  | 6.47284\*10^(-5)        | 6.75115\*10^(5)            |
| inc.java   | 3.55209\*10^(-10)   | 1.25794\*10^(-12)     | 5.70852\*10^(-2)  | 6.74846\*10^(-5)        | 1.60709\*10^(8)            |
| inc.r      | 7.28671\*10^(-7)    | 2.11159\*10^(-9)      | 1.20264\*10^(-1)  | 1.79633\*10^(-4)        | 1.65045\*10^(5)            |
| inc.wl     | 4.87908\*10^(-7)    | 1.24762\*10^(-9)      | 1.91462\*10^(-1)  | 2.2833\*10^(-4)         | 3.92415\*10^(5)            |
| inc.m.sh   | 2.69198\*10^(-9)    | 2.10845\*10^(-11)     | 5.28642           | 4.69114\*10^(-2)        | 1.96377\*10^(9)            |

## Ciekawostki

Podczas prowadzenia niektórych testów zdarzało się, że zmiany w kodzie, czy sposobie kompilacji bardzo istotnie wpłynęły na wyniki, mimo, że teoretycznie, każdy program miał robić to samo: puste pętle.

Pierwszy przykład to zmiana sposobu przebiegania pętli

### RAM vs Procesor

Mamy dwie możliwości przebiegania po zakresie od 1 do n. Pierwsza to zacząć od 1 i zwiększać ją o jeden co chwilę sprawdzając czy doszliśmy już do n, czy nie. Drugi, to stworzyć tablicę od 1 do n, załadować ją do pamięci RAM i wykonać ciało pętli dla każdej z tych liczb z pamięci.

Pierwsza metoda, bardziej konserwatywna jest typową konstrukcją pętli, jaką chciałem testować. Jednak, ta druga, okazuje się być bardziej wydajna dla rozmiarów tablic, które mieszczą się nam w pamięci operacyjnej. Prezentuję na przykładzie języka `R`, jak zmiana sposobu wykonywania pętli wpłynęła na szybkość jej wykonywania.

Oto wycinek `git diff` pokazujący, jak zmienił się kod źródłowy:

![r_loop_diff.png](/img/loopspeed/r_loop_diff.png)

Widzimy, że zamieniliśmy pętlę ładującą wszystko do RAM, na iterującą co jeden ze sprawdzaniem warunku co krok. Poniżej dodaję kod do wykonania stosownego wykresu:

```python
# Plot: Compare while loop vs for-in loop for inc.r
fig, ax = plt.subplots(figsize=(10, 6))
x_range = np.logspace(0, 9, 300)
y_while = 7.28e-7 * x_range + 0.18
y_forin = 3.3e-8 * x_range + 0.18

ax.plot(x_range, y_while, color='red', linewidth=2.5, label='while loop (step & condition check)')
ax.plot(x_range, y_forin, color='green', linewidth=2.5, linestyle='--', label='for in loop (preloaded in RAM)')

ax.set_xscale('log')
ax.set_yscale('log')
ax.set_xlabel('$size [number of loops]', fontsize=12)
ax.set_ylabel('$time [sec]', fontsize=12)
ax.set_title('Differences in loop time for inc.r (while loop vs for in loop)', fontsize=14)
ax.grid(True, which="both", linestyle="--", alpha=0.5)
ax.legend(loc='upper left', fontsize=11)
plt.tight_layout()
plt.savefig("diff_loop.png", dpi=150)
```

![diff_loop.png](/img/loopspeed/diff_loop.png)

Widzimy tutaj ogromną przewagę pętli `For in`. Kiedy spojrzymy na tabelę:

![loop_type.png](/img/loopspeed/loop_type.png)

Okazuje się być ona 15 krotna. To znaczy: w języku `R`, jeśli starczy nam pamięci RAM, to pusta pętla `for in` wykona się 22 razy szybciej niż pętla `while`. Podobne jakościowo rezultaty dostajemy w języku `python`, a intuicja podpowiada, że należy ten wniosek rozszerzyć na inne języki, w których istnieją konstrukcję pętli, które najpierw ładują zakres do RAM, a potem po nim przebiegają.

Ostatecznie, żeby wyrównać szanse, w końcowej wersji wykorzystałem pętlę iterującą.

### Optymalizacja kompilacji

Ktoś przyzwyczajony do wysokopoziomowych języków, szczególnie interpretowanych, mógł by pomyśleć: "kompilacje jak kompilacje, nic ciekawego". Okazuje się jednak, że sposób w jaki kompilujemy program może drastycznie zmienić jego wydajność.

#### Pascal

Przyjrzymy się uważniej linijce programu `inc.bash` zawierającej kompilację pascala.

```bash
fpc -O2 inc/inc.p -o"$TMP/p" -Tlinux &>/dev/null
```

Znajduje się tu flaga `-O2`, która sporo zmienia. Włącza ona analizator przepływu danych asemblera. On z kolei umożliwia procedurze eliminacji wspólnych pod-wyrażeń, na usunięcie niepotrzebnych przeładowań rejestru wartościami, które już zawierał. Więcej o falgach optymalizujących kompilację Pascala można przeczytać w [dokumentacji](http://www.math.uni-leipzig.de/pool/tuts/FreePascal/prog/node12.html).

Wpływ tej flagi można zobaczyć na tym wykresie:

![compilation.png](/img/loopspeed/compilation.png)

A liczbowe wyniki analizy w tabeli poniżej:

![compilation_table.png](/img/loopspeed/compilation_table.png)

Można z niej wyczytać, że zmiana flagi kompilacji wywarła około dwukrotny wpływ na szybkość wykonywania pętli. Inaczej ujmując - trzy znaki w komendzie kompilacyjnej `-O2` potrafią odczuwalnie zmienić wydajność wykonania programu.

#### C++

W przypadku `c++` sytuacja jest nawet bardziej złożona. Podobnie jak w Pascalu mamy do wyboru różne flagi mające różne zastosowania. Ostatecznie zdecydowaliśmy się, że wydajność `c++` najlepiej odda zastosowanie `-O1`.

```bash
g++ -O1 -o "$TMP/cpp" 'inc/inc.cpp';
```

Z [dokumentacji](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html) kompilatora wynika, że dzięki niej kompilator próbuje zredukować wielkość kodu i czas wykonywania, ale nie stosuje tych optymalizacji, które mogły by zająć więcej czasu.

Było to dla mnie dużym zaskoczeniem, ale kiedy stosowałem głębszą optymalizację, to znaczy flagi `-O2`, `-O3` i `-Ofast`, okazywało się, że pętla jest całkowicie pomijana. Czas wykonywania programu spadał do rzędu tysięcznych, czasem setnych sekundy, a więc całkowicie zlewał się z szumem i był niezależny od parametru, jaki wstawiałem. Myślałem, że sytuację popraw wykorzystanie zmiennych zapisywanych, nie na 8 bajtach, tylko na 16. Okazało się, że pętle po zmiennych typu `uint128_t` z biblioteki `boost/multiprecision/cpp_int.hpp` również są pomijane. Dopiero po użyciu zmiennych zapisywanych na 32 bajtach kompilator nie radził sobie z wycięciem pustej pętli z kodu programu. Jednak taki test był dla `c++` dość nieuczciwy, bo żaden inny język nie dochodził nigdy do takich zakresów. Architektura procesora w moim laptopie (x86\_64) świetnie nadaje się do liczb 8 bajtowych - 64bitowych. Używanie liczb 256 bitowych nawet przy najwyższym stopniu optymalizacji kompilacji nie dawało tak dobrych efektów jak `-O1` dla liczby 64 bitowej (unsigned long long int).

Dla porównania wyników jakie dają poszczególne poziomy optymalizacji załączam wykres:

![cpp_optimization.png](/img/loopspeed/cpp_optimization.png)

Oraz podsumowanie graficzne wyników:

![cpp_optimization_table.png](/img/loopspeed/cpp_optimization_table.png)

#### Fortran

Dla porównania wyników jakie dała flaga `-O1` oraz jej brak w Fortranie załączam wykres:

![f_optimization.png](/img/loopspeed/f_optimization.png)

Oraz podsumowanie graficzne wyników pomiaru z bazy:

![f_optimization_table.png](/img/loopspeed/f_optimization_table.png)

### Sposób pomiaru czasu

Do pomiaru czasu wykonywania skryptu wykorzystywaliśmy dwie metody. Pierwsza to

```bash
/usr/bin/time -o "$TMP/time" -f "%e" $comm $size &> /dev/null; #oryfinally %U instead %e
time="$(cat "$TMP/time" 2> /dev/null)";
```

Druga to:

```bash
time=`bash util/timing.sh $comm $size`
```

gdzie plik `util/timing.sh` zawierał poniższy kod

```bash
#!/usr/bin/env bash
START=$(date +%s.%N)
# do something #######################

"$@" &> /dev/null

#######################################
END=$(date +%s.%N)
DIFF=$( echo "scale=6; (${END} - ${START})*1/1" | bc )
echo "${DIFF}"
```

Który sprawdzał aktualny czas, wykonywał podaną instrukcję i ponownie sprawdzał aktualny czas. Następnie za pomocą programu `bc` obliczał różnicę między tymi czasami i zwracał ją z dokładnością do mikrosekund.

Zaletą pierwszej metody była prostota, mniejsza ilość kodu. Z resztą narzędzie `usr/bin/time` jest dedykowanym narzędziem do pomiarów czasu skryptów w systemie `linux`. Zaletą drugiej metody była wyższa precyzja (mikro vs setne sekundy). Oczywiście mimo wykorzystania 6 cyfr po przecinku, zamiast dwóch, precyzja nie sięgała ona tak głęboko, ale przy bardzo szybkich programach pozwoliła mierzyć czas startowania programów z błędem pomiarowym niższym, niż ten czas.

Żeby dać tym metodom równe szanse włączyłem pętle w języku `bash`, które średnio trwały około 4.2 sekundy. Jest to wystarczająco długo, aby ograniczenie liczby cyfr wyników nie stało się kluczowe i wystarczająco krótko, żeby można było powtórzyć pomiar wiele razy. Kod do wygenerowania porówawczego histogramu w Pythonie wygląda następująco:

```python
# Plot: Comparison of timing measurement methods (pairedHistogramTiming.png)
fig, ax = plt.subplots(figsize=(10, 6))
ax.hist(timing_sh_data, bins=12, alpha=0.65, label=f'util/timing.sh (mean: {timing_sh_data.mean():.3f}s, std: {timing_sh_data.std():.3f}s)', color='#2980b9', edgecolor='black')
ax.hist(usr_time_data, bins=12, alpha=0.65, label=f'/usr/bin/time -f "%e" (mean: {usr_time_data.mean():.3f}s, std: {usr_time_data.std():.3f}s)', color='#e74c3c', edgecolor='black')
ax.set_xlabel('Measured Execution Time [s]', fontsize=12)
ax.set_ylabel('Frequency / Count', fontsize=12)
ax.set_title('Comparison of Timing Measurement Methods (util/timing.sh vs /usr/bin/time)', fontsize=14)
ax.legend(loc='upper right', fontsize=11)
ax.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()
plt.savefig("pairedHistogramTiming.png", dpi=150)
```

Wyniki zestawiłem na poniższym histogramie:

![pairedHistogramTiming.png](/img/loopspeed/pairedHistogramTiming.png)

oraz w tabeli:

| method                | time \[s\] | standard dev \[s\] |
| --------------------- | ---------- | ------------------ |
| util/timing.sh        | 4.244      | 0.449              |
| /usr/bin/time -f "%e" | 4.208      | 0.285              |

Widać, że zmiana metody pomiaru z `/usr/bin/time` na `util/timing.sh` nie wymaga kasowania poprzednich wyników. Seria pomiarowe z `/usr/bin/time` i tak nie dotyczyła wyników o czasach poniżej `0.4 sec` bo przy błędzie rzędu `0.1` i zakresie 2 liczb po przecinku nie miało to sensu. Warto zwrócić uwagę na to, że rozkład czasów potrzebnych na wykonanie programu jest podobny do tego, jaki miał rozkład czasu selektów po indeksowanym kluczu w bazie danych.

### Testy

Jeśli wrócili byśmy do opisu instalacji, to zobaczyli byśmy, że ostatnia linia pliku `install.sh` odpowiada za pobranie biblioteki [`shunit2`](http://ssb.stsci.edu/testing/shunit2/shunit2.html).

```bash
curl -L "https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/shunit2/shunit2-2.1.6.tgz" | tar zx
```

Zastosowaliśmy ją w skrypcie testującym, które kod pokazuję poniżej

> `test.sh`

```bash
#!/usr/bin/env bash

# args: min, mix, file - function check if
# all numbers in file are in range (min,max)
function columnInRange
{
    min="$1";
    max="$2";

    cat | while read n
    do
        echo $n;
        assertTrue '[ 1 -eq $(echo $min"<"$n | bc -l) ]'
        assertTrue '[ 1 -eq $(echo $n"<"$max | bc -l) ]'
    done
}
```

Zaczynamy od definiowania funkcji pomocniczej, która przyjmuje dwa parametry i strumień danych. Sprawdza ona czy strumień zawiera liczby z zakresu określonego przez te parametry. Za sprawdzenie odpowiadają funkcje `assertTrue`.

Druga funkcja pomocnicza wykonuje dzielenie przez siebie wybranych kolumn z pary plików.

```bash
# args: col, method and parameter for 1 file, method and parameter for 2 file
# function print ratio of given column form two files "log/out.[method][parameter].log
# col number | meaning
# 3          | size
# 4          | time
# 5          | speed
function ratioOfColumns
{
    col="$1";

    awk -F "|" 'FNR==NR{a[FNR] = $'$col'; next} {if(/inc/) printf "%12.6f\n", $'$col'/a[FNR]}' \
        log/out.$2.log log/out.$3.log
}
```

Na tą chwilę wygląda to dość enigmatycznie, ale pliki te w założeniu mają odpowiadać temu, co `inc.bash` wyświetla w konsoli. Zakres parametru `$1` to `3`,`4`,`5`, a dostępne wartości `$2` i `$3` to `l1`, `l2`, `t1` i `t2`. Odpowiedź na pytanie skąd biorą się tepliki zawarta jest w kolejnej funkcji:

```bash
oneTimeSetUp() {

    for n in 1 2
    do
        for method in "l" "t"
        do
              bash inc.bash -$method $n | tee log/out.$method$n.log
        done
    done
}
```

Która zgodnie z dokumentacją `shunit2` wykonana zostaje na samym początku testowania. Odpoiwada ona za wywołanie programu `inc.bash` cztery razy ze wszystkimi kombinacjami parametrów `-l` i `-t` oraz liczb `1` i `2` a następnie przekierowanie wyjścia do odpowiednio nazwanych plików.

Kolejna funkcja wykona się po zakończeniu testowania - posprząta po testach.

```bash
oneTimeTearDown() {
    rm -rf log/out.*.log
}
```

Możemy przejść do właściwych funkjci zawierających testy:

```bash
# in database there are 16 columns of parameters
test_parameters_are_proporly_estimated()
{
    infile=$(grep inc config/parameters.csv | wc -l);
    inbase=$(sqlite3 log/log.db "SELECT count(*) FROM result WHERE a>ea and b>eb");
    echo $infile;
    echo $inbase;
    assertEquals $infile $inbase;
}
```

Pierwszy z testów sprawdza, czy plik `config/parameters.csv` został poprawnie załadowany do bazy przez skrypt `util/parameters_load.pl`.

```bash
# ratio of loops for 2 sec to 1 sec is between 1.9 and 2.1
test_ratio_of_loops_in_proper_range()
{
     ratioOfColumns 3 t1 t2 | columnInRange 1.95 2.2
}
```

Kolejny test bierze stosunek ilości pętli dla 2 sekund i 1 sekundy. Intuicyjnie czujemy, że powinien być on bliski dwójki, ale dopuszczamy odstępstwa w granicach błędu pomiarowego.

```bash
# ratio of time for test with 2 sec and 1 sec should be near to 2
test_ratio_of_time_should_be_near_2_for_time_based_test()
{
    ratioOfColumns 4 t1 t2 | columnInRange 1.5 4;
}
```

Następny test określa stosunek czasów dla programu zakładającego wykonywanie w 2 sekundy do 1 sekundy. Gdyby środowisko było idealne, to ten stosunek powinien wynosić dwa. Jednak ponieważ w GitHub Actions moc obliczeniowa przydzielana runnerom bywa zmienna, pozwalamy na dużą granicę błędu pomiarowego.

```bash
# ratio of time for test with 2 and 1 loop should be near to 1
test_ratio_of_time_should_be_near_1_for_loop_based_test()
{
    ratioOfColumns 4 l1 l2 | columnInRange 0.4 1.8;
}
```

Podobnie jest dla czasu wykonywania jednej i dwóch pętli. Stosunek tych czasów powinien być bliski jedności, ponieważ czas wykonywania pętli jest rzędy wielkości niższy od czasu włączania programu. Jednak i tutaj dopuszczamy duże różnice związane ze zmiennością dostępnej mocy obliczeniowej.

```bash
# any free language (without matlab and mathematica) start in time small than 0.2 sec
test_start_no_longer_than_150_milisecond()
{
    # time of programs for 1 loop
    awk '/inc/ {print $6}' log/out.l1.log | columnInRange 0.001 0.15;
}
```

Kolejny test sprawdza, czy wszystkie programy startują szybciej niż w 0.15 sec i wolniej niż 1 milisekundę.

```bash
# ratio of speed for time based test should be near to 1
test_speed_should_be_not_dependent_from_loops_in_limit()
{
    ratioOfColumns 5 t1 t2 | columnInRange 0.5 1.4;
}
```

Następny dotyczy czasów długich w porównaniu z czasem włączania programu, a 1-2 sekund za takie można uznać i wymaga aby stosunek prędokości wykonywania pętli dla tych czasów był bliski jedności, a więc nie zmieniał się wraz z czasem.

```bash
# ratio of speed for 2 and 1 loop should be near to 2
test_ratio_of_speed_for_small_loop_number_in_proper_range()
{
    ratioOfColumns 5 l1 l2 | columnInRange 1.1 7.0;
}
```

Zupełnie odwrotnie dla 1-2 pętli, jeśli czas jest prawie taki sam, to mierzona prędkość powinna być prawie dwa razy wyższa dla 2 pętli niż dla jednej. Nie możemy jednak mierzyć tego zbyt dokładnie, ponieważ czasy wykonywania programów dla tak niewielkich ilości pętli są zwykle bliskie błędom pomiarowym.

```bash
test_ratio_of_speed_for_1_and_2_loops_form_database()
{
    for n in 1 2
    do
        sqlite3 log/log.db "SELECT name, avg(size/time) as speed FROM \
            log WHERE size="$n" AND name!='inc.m.sh' AND name!='inc.wl' GROUP BY name" \
            > log/out.l$n.speed.log
    done

    ratioOfColumns 2 l1.speed l2.speed | columnInRange 1.1 7.0;
}
```

Ostatni test powtarza to samo co poprzedni, ale tym razem wydobywa dane z bazy, a nie konsoli.

```bash
. shunit2-2.1.6/src/shunit2
```

Jako ostatnią linię skryptu testującego dołączamy zgodnie z dokumentacją program `sh2unit`.

### Ciągła integracja

Na sam koniec opiszę proces ciągłej integracji, który wdrożyłem w tym projekcie. Ciągła integracja to automatyczne wykonywanie instalacji i testów przy każdym zdarzeniu `push` lub `pull_request` w repozytorium. W tym projekcie wykorzystujemy narzędzie [GitHub Actions](https://github.com/features/actions).

Konfiguracja znajduje się w pliku `.github/workflows/test.yml`. Zaczynamy od zdefiniowania nazwy workflow oraz zdarzeń uruchamiających:

```yaml
name: Test Suite

on:
  push:
    branches: [ master, main ]
  pull_request:
    branches: [ master, main ]
```

Następnie definiujemy zadanie `test`, które uruchamia się na środowisku `ubuntu-latest`. Podpinamy również usługę bazy danych MariaDB jako osobny kontener w sekcji `services`:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mariadb:
        image: mariadb:latest
        env:
          MARIADB_ALLOW_EMPTY_ROOT_PASSWORD: 'yes'
          MARIADB_DATABASE: inc
        ports:
          - 3307:3306
        options: --health-cmd="healthcheck.sh --connect --innodb_initialized" --health-interval=10s --health-timeout=5s --health-retries=3

    env:
      MYSQL_HOST: 127.0.0.1
      MYSQL_TCP_PORT: 3307
      MYSQL_USER: root
      MYSQL_PWD: ""
```

W kolejnych krokach (`steps`) pobieramy kod repozytorium, instalujemy niezbędne zależności systemowe oraz moduł Perl `Text::CSV_XS`, ładujemy parametry do bazy danych i uruchamiamy nasz pakiet testów:

```yaml
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Configure MariaDB client credentials (~/.my.cnf)
        run: |
          cat << 'EOF' > ~/.my.cnf
          [client]
          user = root
          host = 127.0.0.1
          port = 3307
          EOF
          chmod 600 ~/.my.cnf

      - name: Install dependencies
        run: |
          SUDO=""
          command -v sudo >/dev/null 2>&1 && SUDO="sudo"
          $SUDO apt-get update
          $SUDO apt-get install -y gfortran fpc mono-devel nodejs python3 perl libtext-csv-perl libtext-csv-xs-perl libdbi-perl libdbd-sqlite3-perl mariadb-client curl bc
          bash install.sh || true

      - name: Load database parameters
        run: |
          perl util/parameters_load.pl

      - name: Run test suite
        run: |
          bash test.sh
```

Dzięki temu przy każdym commicie wysłanym do repozytorium GitHub automatycznie uruchamia środowisko testowe i sprawdza, czy wszystkie testy jednostkowe przechodzą pomyślnie.

To już wszystko. Mam nadzieję, że ten artykuł uświadomił Ci, że wybór języka może mieć ogromne znaczenie dla wydajności oraz przybliżył Ci historię kilku z nich. Jednak najważniejsze, że ten kod został przygotowany tak, aby łatwo było go rozszerzyć o pomiary dotyczące zadań jak na przykład zapis do pliku, albo wykonywanie całkowania numerycznego. Jeśli będziesz zainteresowany rozwijaniem tego softu daj znać, mam parę koncepcji, w którą stronę można by rozwinąć ten projekt.
