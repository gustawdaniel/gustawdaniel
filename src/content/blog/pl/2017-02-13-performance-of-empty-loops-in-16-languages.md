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

Nie wiem, jakie są Wasze wymarzone prezenty gwiazdkowe, ale moim jest kawałek ciekawego kodu. I właśnie taki prezent otrzymałem około półtora miesiąca temu.

Mój przyjaciel wysłał mi e-mailem [kod źródłowy programu](https://www.dropbox.com/s/s9dy1jabkzxzls6/loopspeed.zip?dl=1), który mierzył czas wykonywania pustych pętli w czterech językach programowania. Dopisałem testy dla kilkunastu kolejnych języków, zautomatyzowałem proces testowania i przeanalizowałem uzyskane wyniki.

W tym wpisie pokażę, jak wyglądają i z jaką szybkością działają programy wykonujące puste pętle w 16 językach:

- Matlab,
- Bash,
- SQL (MariaDB),
- Mathematica,
- C#,
- JavaScript,
- Python,
- Ruby,
- Perl,
- R,
- PHP,
- Fortran 95,
- C++,
- C,
- Pascal,
- Java.

Do rejestrowania danych wykorzystamy plik tekstowy oraz silnik bazy danych `SQLite`. Analizę danych przeprowadzimy w języku Python.

## Instalacja

Projekt będziemy uruchamiać w środowisku `Arch Linux` (bez użycia Dockera czy maszyny wirtualnej). Rozpoczniemy od instalacji bazy danych `mariadb`.

```bash
paru -S mariadb
```

W przeciwieństwie do niektórych dystrybucji (np. Ubuntu), Arch nie uruchamia i nie konfiguruje bazy automatycznie po instalacji. Przed pierwszym uruchomieniem należy jednorazowo utworzyć strukturę katalogów:

```bash
sudo mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
```

Uruchamiamy usługę i włączamy jej automatyczny start podczas rozruchu systemu:

```bash
sudo systemctl enable --now mariadb
```

Po połączeniu z bazą za pomocą `sudo` (z uprawnieniami administratora):

```bash
sudo mariadb
```

Tworzymy bazę danych, w której będziemy zapisywać zmierzone czasy, oraz przyznajemy uprawnienia dla lokalnego użytkownika `''`:

```sql
CREATE DATABASE IF NOT EXISTS inc;
GRANT ALL PRIVILEGES ON inc.* TO ''@'localhost';
FLUSH PRIVILEGES;
```

Instalację możemy przetestować poleceniem:

```bash
mariadb inc -e "SELECT 'OK' as 'state'"
```

Jeśli w konsoli pojawi się poniższy wynik, wszystko zostało skonfigurowane poprawnie:

```sql
+-------+
| state |
+-------+
| OK    |
+-------+
```

W celu przygotowania środowiska do pracy, należy wykonać polecenia:

```bash
git clone --depth=1 git@github.com:gustawdaniel/loopspeed.git && cd loopspeed
sudo bash install.sh
cpan install DBI DBD::SQLite Text::CSV_XS
perl util/parameters_load.pl
```

Przyjrzyjmy się teraz skryptom: instalacyjnemu oraz ładującemu parametry.

Skrypt instalacyjny `install.sh` aktualizuje listę pakietów oraz instaluje wymagane kompilatory i interpretery języków:

```bash
#!/usr/bin/env bash


paru -S --needed --noconfirm \
  php python jdk-openjdk gcc mono gcc-fortran fpc r ruby \
  sqlite bc git mariadb-clients curl \
  perl-text-csv perl-dbi perl-dbd-sqlite
```

Instalowane pakiety to m.in.:

| Arch Linux (`paru`) | Uwagi                                                  |
| ------------------- | ------------------------------------------------------ |
| `gcc`               | Na Archu `gcc` zawiera zarówno kompilator C, jak i C++ |
| `gcc-fortran`       | Kompilator Fortrana                                    |
| `jdk-openjdk`       | Domyślne środowisko Java                               |
| `fpc`               | Free Pascal Compiler                                   |
| `mono`              | Środowisko i kompilator C#                             |
| `nodejs`            | Środowisko uruchomieniowe JavaScript (Node.js)         |
| `mariadb-clients`   | Klient CLI do MySQL / MariaDB                          |
| `perl-text-csv`     | Konwencja nazw modułów Perla (`perl-*`)                |

Zadaniem skryptu jest również utworzenie bazy danych do przechowywania wyników pomiarów oraz wyliczonych na ich podstawie parametrów:

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

Na koniec instalator pobiera bibliotekę do testowania skryptów napisanych w Bashu – `shunit2`:

```bash
curl -L "https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/shunit2/shunit2-2.1.6.tgz" | tar zx
```

Przed uruchomieniem drugiego skryptu instalujemy wymagane moduły Perla:

```bash
cpan install DBI DBD::SQLite
```

Dzięki temu możemy wykonać skrypt:

> util/parameters_load.pl

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

Jego zadaniem jest przeniesienie zawartości pliku tekstowego `config/parameters.csv` do tabeli `result` w bazie danych `log/log.db`. Przenoszone dane dotyczą szacowanych czasów wykonywania pętli i zostały wyznaczone na podstawie wcześniejszych pomiarów.

Dwa spośród testowanych języków – `Matlab` oraz `Mathematica` – wymagają licencjonowanego oprogramowania commercial. Z tego względu testy dla nich są domyślnie wyłączone.

## Architektura projektu (Framework)

Program do testowania pustych pętli posiada następującą strukturę katalogów:

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

Katalog `config` zawiera pliki konfiguracji. Pierwszym jest `config/list.txt` – lista parametrów (liczb całkowitych), dla których wykonywane są serie testowe. Drugim jest `config/parameters.csv`, zawierający oszacowane wartości parametrów szybkości wykonywania pętli.

W katalogu `inc` znajduje się 16 plików odpowiedzialnych za testowanie poszczególnych języków oraz plik definiujący procedurę w `MariaDB`, która wykonuje pętlę po jej wywołaniu.

W `util` umieściłem skrypty pomocnicze do przesyłania danych z plików tekstowych do bazy `SQLite` oraz do porównywania precyzji dwóch metod pomiaru czasu. Znajdują się tam również skrypty wyznaczające parametry modelu i ładujące je do bazy SQLite. Wykorzystanie plików tekstowych obok bazy danych wynika z historii rozwoju projektu oraz pozwala unikać wprowadzania do bazy niepewnych wyników podczas testowania wartości skrajnych.

Katalog `log` przechowuje pliki logów oraz bazę `SQLite`. Plik `results.log` zawiera kopię danych trafiających do bazy, natomiast `results_timing_methods.log` zapisuje wyniki pomiarów porównawczych.

Pozostałe kluczowe pliki w projekcie:

- `install.sh` – skrypt instalacyjny,
- `inc.bash` – główny skrypt uruchamiający pomiary czasów pustych pętli,
- `util/generate_parameters.py` – skrypt w Pythonie dopasowujący modele i wyznaczający parametry,
- `util/generate_plots.py` – skrypt w Pythonie generujący wykresy wyników,
- `test.sh` – zestaw testów automatycznych.

Dzięki takiej strukturze dodawanie obsługi nowych języków jest proste. Przechowywanie identyfikatora rewizji Git pozwala ponadto porównywać wydajność różnych konstrukcji językowych (np. `for` vs `while`).

## Przepływ danych (Dataflow)

Przepływ danych w aplikacji opiera się na sprzężeniu zwrotnym: `inc.bash` testuje pętle na podstawie parametrów wyliczonych przez `util/generate_parameters.py`, natomiast sam model wymaga wcześniejszego zgromadzenia danych empirycznych za pomocą `inc.bash`.

![Diagram przepływu danych - Loopspeed](/img/loopspeed/dataflow_pl.png)

Mamy tu do czynienia z klasycznym problemem "co było pierwsze: jajko czy kura?". Odpowiedzią okazuje się podejście ewolucyjne. Początkowo każdy ze skryptów `inc.i` uruchamiany był ręcznie – najpierw dla pojedynczej pętli, potem dla tysiąca, miliona i miliarda iteracji. Jeśli wykonanie trwało zbyt długo (powyżej kilku sekund), zmniejszałem liczbę iteracji; gdy było zbyt krótkie – zwiększałem. Celem było ręczne znalezienie liczby iteracji odpowiadającej czasowi wykonania rzędu 4–5 sekund. 

Uzyskane w ten sposób wartości trafiły do kodu `inc.bash` jako pierwsze stałe. Pozwoliło to uwspólnić skalę dla większości języków, poza Matlabem, którego sam rozruch trwał ponad 5 sekund. Dane pomiarowe trafiały początkowo do pliku `results.log`. Podczas testów ujawniły się też różne ograniczenia systemowe i językowe: w niektórych językach przepełniał się zakres zmiennych liczbowych (co wymagało przejścia np. z `Int32` na `UInt64` w C# lub na `QWord` w Pascalu), w innych (`Python`, `R`) pętla `for in` potrafiła alokować całą tablicę w pamięci RAM, powodując brak pamięci. Z tego powodu na wstępnym etapie pełna automatyzacja nie była możliwa.

Gdy plik `results.log` znacząco urósł, a ja dostrzegłem, że testy dla zbyt krótkich czasów generują duży błąd pomiarowy, natomiast dla zbyt długich – nie dają nowych informacji, napisałem skrypt `text_to_sqlite.pl` do konwersji wyników do bazy SQLite. Aby zapobiec mieszaniu danych pochodzących z różnych wersji skryptów, dodałem kolumnę `$git` z identyfikatorem commitu. Następnie wyliczyłem dokładniejsze parametry modelu, utworzyłem wykładniczo rozrzedzoną serię testową `list.txt` i zautomatyzowałem wyznaczanie parametrów w skrypcie Python. W ten sposób obieg danych został zamknięty: model zaczął wyznaczać optymalne punkty pomiarowe, a dane płynęły w sposób w pełni zautomatyzowany.

### Jądro programu (`inc.bash`)

Przyjrzyjmy się budowie głównego skryptu testującego `inc.bash`. Zaczyna się on od funkcji wyświetlającej pomoc:

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

Skrypt udostępnia kilka opcji. Flaga `-a` włącza testy komercyjnych środowisk (`Matlab` i `Mathematica`), domyślnie wyłączone. Flagi `-t` oraz `-l` określają sposób wyznaczania obciążenia: w trybie `-t` podajemy oczekiwany czas w sekundach, a skrypt wylicza odpowiednią liczbę pętli dla każdego języka z wyznaczonego modelu; tryb `-l` pozwala podać dokładną liczbę iteracji. Opcja `-f` umożliwia wczytanie pliku z serią pomiarową.

Następnie skrypt definiuje procedurę sprzątania zasobów:

```bash
function onExit {
	[ ! -z "$TMP" ] && \
	[   -d "$TMP" ] && \
	rm -Rf "$TMP";
	rm -f inc.class;
	exit;
}
```

Wykorzystano tu flagi `-z` oraz `-d`: katalog wskazywany przez `$TMP` zostanie usunięty, o ile zmienna nie jest pusta i wskazuje na istniejący katalog. Czyszczony jest także plik binarny Javy. Funkcja `onExit` jest wywoływana automatycznie przy wyjściu ze skryptu.

Centralnym punktem całego środowiska jest funkcja `test`, odpowiedzialna za wykonanie pomiaru i rejestrację wyników:

```bash
function test {
	name="$1";
	size="$2";
	comm="${@:3}"
```

Przyjmuje ona co najmniej trzy parametry: identyfikator testu (`$name`, np. `inc.c`), liczbę iteracji (`$size`) oraz polecenie uruchamiające (`$comm`).

```bash
    [ $size -le 0 ] && return;
```

Po zweryfikowaniu, że liczba iteracji jest dodatnia, następuje wywołanie pomiaru czasu:

```bash
    time=`bash util/timing.sh $comm $size`
	echo $name,$size,$time,$GIT	\
	    | tee -a log/results.log \
	    | awk -F ',' '{printf "| %-12s | %15s | %12.6f s | %19.2f |\n", $1, $2, $3, $2/$3;}'
```

Pomiar realizowany jest przez skrypt `util/timing.sh`. Uzyskany czas zapisywany jest do pliku `log/results.log`, a sformatowany wynik wypisywany na konsolę. Te same dane trafiają do bazy SQLite:

```bash
     sqlite3 log/log.db  "insert into log (name,size,time,git) values ('$name',$size,$time,'$GIT');"
}
```

Kompilacja programów wymagających wcześniejszego zbudowania odbywa się w funkcji `compile`:

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

Czas kompilacji nie wchodzi w skład mierzonego czasu wykonania pętli.

Liczba iteracji do wykonania wyliczana jest w funkcji `calculate`:

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

W trybie `-t` (`$timeMode=1`) funkcja przelicza żądany czas na liczbę pętli według wzoru $(POW - B) / A$, korzystając z dopasowanych parametrów liniowych $A$ i $B$.

Sekwencję testów dla poszczególnych języków uruchamia funkcja `testbundle`:

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

Ładowanie parametrów z bazy danych do tablic asocjacyjnych Basha realizuje funkcja `loadParams`:

```bash
function loadParams {
source <(sqlite3 log/log.db "select name, a from result" |
         awk -F '|' '{printf("a[%s]=%s;\n",$1,$2);}')

source <(sqlite3 log/log.db "select name, b from result" |
         awk -F '|' '{printf("b[%s]=%s;\n",$1,$2);}')
}
```

W dalszej części skryptu następuje rejestracja sygnałów czyszczenia (`trap`), utworzenie katalogu tymczasowego, pobranie identyfikatora commitu Git, parsowanie opcji przekazanych przez użytkownika (`getopts`), załadowanie parametrów, kompilacja oraz wywołanie pętli testowej:

```bash
cd "$(dirname "${BASH_SOURCE[0]}")";
trap onExit SIGINT SIGTERM EXIT;

TMP="$(mktemp -d)";
GIT=`git rev-parse HEAD`;

declare -A a
declare -A b

allPrograms=0;
configFile='config/list.txt';
timeMode=1;
fileMode=0;

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
shift "$((OPTIND-1))"

POW=${1:-4};
loadParams;
compile

echo '+--------------+-----------------+----------------+---------------------+';
echo '|     File     |      Size       |      Time      |        Speed        |';
echo '+--------------+-----------------+----------------+---------------------+';

if [[ "$fileMode" -eq "1" ]]; then
   while IFS='' read -r POW || [[ -n "$POW" ]]; do
      testbundle;
   done < ${1:-${configFile}}
else
  testbundle;
fi

echo '+--------------+-----------------+----------------+---------------------+';
```

### Skrypty pomocnicze

Do przenoszenia wyników tekstowych do bazy danych służy skrypt w Perlu:

> util/text_to_sqlite.pl

```perl
#!/usr/bin/perl -w
use warnings FATAL => 'all';
use DBI;
use strict;

my $db = DBI->connect("dbi:SQLite:log/log.db", "", "",{RaiseError => 1, AutoCommit => 1});

my $filename =  $ARGV[0] || 'log/results.log';

open( my $fh => $filename) || die "Cannot open $filename: $!";

while(my $line = <$fh>) {
        my @row = split(",",$line);
        $db->do("INSERT INTO log (name,size,time,git) values ('".$row[0]."',$row[1],$row[2],'$row[3]');");
}
close($fh);
```

## Analiza statystyczna

Proces analizy danych polega na połączeniu z bazą SQLite, pobraniu zebranych pomiarów, dopasowaniu modelu nieliniowego oraz wygenerowaniu parametrów i wykresów.

Do wyznaczenia parametrów wykorzystujemy poniższy skrypt Python (`util/generate_parameters.py`), uruchamiany przy użyciu narzędzia `uv`:

> util/generate_parameters.py

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

Skrypt pobiera z bazy danych SQLite parę wartości: liczbę pętli $N$ (`size`) oraz zmierzony czas $T$ (`time`). Do dopasowania modelu wykorzystywana jest funkcja `curve_fit` z modułu `scipy.optimize`.

Dopasowywana funkcja ma postać: `np.log(np.exp(a) * sizes + b**2)`. Jest to zależność liniowa $T = A \cdot N + B$ przekształcona do skali logarytmicznej: $\log(T) = \log(A \cdot N + B)$. Ponieważ czas pojedynczej pętli $A$ przyjmuje bardzo małe wartości, a narzut uruchomienia $B$ jest zawsze dodatni, zastosowano podstawienia $A = e^a$ oraz $B = b^2$. Dzięki temu parametr $a$ przyjmuje wartości rzędu -18, a optymalizator nie wymaga sztucznych ograniczeń znaku.

Błędy wyznaczane są z przekątnej macierzy kowariancji (`pcov`), a następnie przeliczane według wzorów propagacji błędów ($ea = A \cdot \sigma_a$, $eb = |2b| \cdot \sigma_b$). Wyliczone wartości trafiają do `config/parameters.csv`.

## Wyniki pomiarów

Wykresy dla poszczególnych języków generowane są przez skrypt `util/generate_plots.py` z wykorzystaniem biblioteki `matplotlib`:

> util/generate_plots.py

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

Poniżej przedstawiam omówienie wyników dla poszczególnych języków programowania.

### Bash

Powłoka [Bash](https://pl.wikipedia.org/wiki/Bash) (stworzona w 1987 r.) służy przede wszystkim do automatyzacji zadań w systemach Unix/Linux. Jako język interpretowany nie jest optymalizowana pod kątem szybkich obliczeń w pętli.

Kod testowy:

```bash
#! /bin/bash

i=0;
max=$1;

while [[ $i -le $max ]];
do
	i=$[i+1];
done
```

Wyniki pomiarów:

![inc_inc.bash.png](/img/loopspeed/inc_inc.bash.png)

Bash uzyskał najniższą szybkość wykonywania iteracji pętli w całym zestawieniu, charakteryzuje się jednak bardzo niskim czasem uruchamiania, nieustępującym znacząco językom kompilowanym.

### Matlab

[MATLAB](https://pl.wikipedia.org/wiki/MATLAB) jest środowiskiem zaprojektowanym do obliczeń macierzowych i numerycznych. Ponieważ nie posiada natywnego prostego interfejsu CLI do przekazywania argumentów pojedynczej funkcji, skrypt wywołujący został oprawiony w Bashu:

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

Pod względem szybkości pojedynczej iteracji Matlab okazuje się najszybszy wśród języków interpretowanych (wyłączając środowiska JIT, takie jak Java). Płaci za to jednak potężnym narzutem czasowym uruchomienia środowiska (ponad 5 sekund). Jest to idealne narzędzie do dużych obliczeń macierzowych, lecz zupełnie nieopłacalne dla drobnych, jednorazowych zadań.

### MySQL / MariaDB

Język [SQL](https://pl.wikipedia.org/wiki/SQL) i silniki relacyjnych baz danych nie były projektowane z myślą o wykonywaniu pustych pętli czy inkrementacji zmiennych w kodzie proceduralnym.

Wywołanie procedury z poziomu konsoli:

```bash
#!/usr/bin/env bash

mariadb inc -e "CALL inc_loop($1)";
```

Kod procedury:

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

MariaDB zajmuje w klasyfikacji szybkości pętli przedostatnie miejsce. Co ciekawe, czas nawiązywania połączenia z bazą danych plasuje się na całkiem przyzwoitym poziomie na tle innych języków skryptowych.

### Wolfram Language (Mathematica)

[Wolfram Language](https://en.wikipedia.org/wiki/Wolfram_Language) (1988 r.) to język stworzony z myślą o algebrze symbolicznej oraz zaawansowanych obliczeniach naukowych.

Kod skryptu `inc.wl`:

```
num  = ToExpression[$ScriptCommandLine[[2]]];
For[i = 0, i < num, i++];
Exit[];
```

[![inc_inc.wl.png](https://s27.postimg.org/519tj8x1f/inc_inc_wl.png)](https://postimg.org/image/75u6kbynz/)

W teście pustej pętli Mathematica wypadła słabo, zajmując 4. miejsce od końca pod względem szybkości pętli i 2. od końca pod względem czasu uruchomienia.

### C#

Język [C#](https://pl.wikipedia.org/wiki/C_Sharp) (2000 r.) kompiluje się do kodu pośredniego (CIL), uruchamianego w środowisku uruchomieniowym (np. Mono / .NET CLR).

Kod źródłowy:

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

Czas uruchamiania środowiska Mono jest umiarkowany, natomiast szybkość pętli plasuje C# na 6. pozycji od końca w tym zestawieniu pomiarów.

### JavaScript (Node.js)

[JavaScript](https://pl.wikipedia.org/wiki/JavaScript) (1995 r.) dzięki nowoczesnym silnikom V8 (JIT) ewoluował z języka skryptowego przeglądarek do pełnoprawnego środowiska ogólnego przeznaczenia.

Kod źródłowy:

```js
var max = process.argv[2];
for (var i = 0; i <= max; i++) {}
```

![inc_inc.js.png](/img/loopspeed/inc_inc.js.png)

Node.js wykazuje średni narzut przy uruchamianiu, ale w szybkości wykonywania pętli radzi sobie dobrze jak na środowisko dynamiczne.

### Python

[Python](https://pl.wikipedia.org/wiki/Python) (1991 r.) stawia na zwięzłość, czytelność i czystość składni.

Kod testowy:

```python
#!/usr/bin/python

import sys

max=int(sys.argv[1]);

count = 0
while (count < max):
   count = count + 1
```

*(Uwaga: Zastosowanie konstrukcji `for i in range(...)` w Pythonie 2/3 bez użycia iteratorów generowało w pamięci RAM pełną tablicę, co doprowadzało do braku pamięci przy dużych wartościach `max` – szczegóły opisano w sekcji z ciekawostkami).*

![inc_inc.python.png](/img/loopspeed/inc_inc.python.png)

Python plasuje się w środku stawki. Mimo że nie należy do najszybszych języków, nadrabia to prostotą i bardzo niskim progiem wejścia.

### Ruby

[Ruby](<https://pl.wikipedia.org/wiki/Ruby_(j%C4%99zyk_programowania)>) (1995 r.) to w pełni obiektowy, dynamicznie typowany język interpretowany.

Kod testowy:

```ruby
for i in (1 .. ARGV[0].to_i)
end
```

Składnia zakreślająca przedział `(1 .. N)` w Ruby okazuje się zoptymalizowana pod kątem zużycia pamięci i nie zapycha RAM-u nawet dla bardzo dużych wartości $N$.

![inc_inc.rb.png](/img/loopspeed/inc_inc.rb.png)

Ruby osiąga umiarkowane wyniki: czas uruchamiania jest nieco dłuższy, ale pętla wykonuje się sprawnie.

### Perl

[Perl](https://pl.wikipedia.org/wiki/Perl) (1987 r.) słynie z elastyczności i zwięzłości składniowej.

Przykładowy kod:

```perl
#!/usr/bin/perl

for(my $i=0;$i<=$ARGV[0];$i++){}
```

![inc_inc.pl.png](/img/loopspeed/inc_inc.pl.png)

Perl wykazuje najkrótszy czas uruchomienia spośród tradycyjnych języków skryptowych. Szybkość samej pętli plasuje go na średnim poziomie.

### R

[R](<https://pl.wikipedia.org/wiki/R_(j%C4%99zyk_programowania)>) to środowisko wyspecjalizowane w obliczeniach statystycznych i analizie danych.

Kod testowy:

```r
args <- commandArgs(trailingOnly = TRUE)

x <- 0
while(x < as.numeric(args)) {
    x <- x+1;
}
```

![inc_inc.r.png](/img/loopspeed/inc_inc.r.png)

Jako język wysokiego poziomu zorientowany na wektoryzację danych, R w pętli skalarnej wypadł słabo, zajmując 3. miejsce od końca pod względem szybkości pętli i czasu startu.

### PHP

[PHP](https://pl.wikipedia.org/wiki/PHP) (1995 r.) jest powszechnie stosowany w tworzeniu aplikacji internetowych.

Kod testowy:

```php
<?php

$max = (int)$argv[1];

for($i=0; $i<$max; $i++);
```

![inc_inc.php.png](/img/loopspeed/inc_inc.php.png)

PHP uzyskał bardzo dobre wyniki – okazał się jednym z najszybszych języków interpretowanych pod względem czasu pojedynczej pętli, ustępując w tej kategorii jedynie Matlabowi.

### Fortran 95

[Fortran](https://pl.wikipedia.org/wiki/Fortran) (1957 r.) jest jednym z najstarszych języków programowania, do dziś powszechnie używanym w fizyce i obliczeniach superkomputerowych dzięki doskonałym optymalizacjom kompilatora.

Kod testowy:

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

Fortran 95 odniósł zwycięstwo w kategorii szybkości wykonywania pojedynczej pętli oraz zajął 4. miejsce pod względem najkrótszego czasu uruchomienia.

### C++

[C++](https://pl.wikipedia.org/wiki/C%2B%2B) (1983 r.) łączy wydajność i niskopoziomowy dostęp do pamięci z abstrakcją obiektową.

Kod testowy:

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

C++ plasuje się w ścisłej czołówce: 3. miejsce pod względem czasu uruchomienia i 2. miejsce pod względem szybkości wykonywania pętli.

### C

Język [C](<https://pl.wikipedia.org/wiki/C_(j%C4%99zyk_programowania)>) (1972 r.) stanowi fundament współczesnych systemów operacyjnych.

Kod testowy:

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

C zdobywa 1. miejsce pod względem najkrótszego czasu uruchomienia oraz 3. miejsce pod względem szybkości pętli (zaledwie o 1% za C++ i Fortranem).

### Pascal

[Pascal](<https://pl.wikipedia.org/wiki/Pascal_(j%C4%99zyk_programowania)>) (1970 r.) projektowano z myślą o czytelności i nauce programowania strukturalnego.

Kod testowy:

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

Pascal zajął 2. miejsce pod względem czasu uruchomienia i 5. miejsce pod względem szybkości pętli.

### Java

[Java](https://pl.wikipedia.org/wiki/Java) (1995 r.) kompiluje się do kodu bajtowego uruchamianego na maszynie wirtualnej JVM.

Kod testowy:

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

Java osiągnęła znakomitą szybkość wykonywania pętli (4. miejsce, zaledwie 1–2% za liderem), jednak uruchomienie JVM wiązało się z narzutem czasowym około 40-krotnie większym niż w przypadku C czy Pascala.

## Podsumowanie zbiorcze

Poniższy wykres (wygenerowany w Pythonie) porównuje czas wykonania pojedynczej pętli dla wszystkich 16 języków (skala logarytmiczna – im niższa wartość, tym szybciej):

![speed.png](/img/loopspeed/speed.png)

Szczegółowe parametry zebrane w tabeli:

| Język      | Czas 1 pętli \[s\]  | Błąd czasu pętli \[s\] | Czas startu \[s\] | Błąd czasu startu \[s\] | Stosunek start/pętla       |
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

Porównanie czasów uruchamiania programów (narzutu startowego):

![speed2.png](/img/loopspeed/speed2.png)

Tabela posortowana według czasów uruchamiania:

| Język      | Czas 1 pętli \[s\]  | Błąd czasu pętli \[s\] | Czas startu \[s\] | Błąd czasu startu \[s\] | Stosunek start/pętla       |
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

## Ciekawostki i obserwacje

Podczas przeprowadzania eksperymentów ujawniło się kilka zjawisk mających istotny wpływ na wydajność.

### RAM vs Procesor

Wybór mechanizmu pętli (np. iteracja skalarnego licznika vs przechodzenie po tablicy alokowanej w pamięci) znacząco wpływa na czas wykonania. 

Na przykładzie języka R zmiana z pętli `while` (inkrementacja licznika) na pętlę `for in` (wcześniejsza alokacja wektora w RAM):

![r_loop_diff.png](/img/loopspeed/r_loop_diff.png)

Porównanie modelowe:

![diff_loop.png](/img/loopspeed/diff_loop.png)

![loop_type.png](/img/loopspeed/loop_type.png)

W języku R pętla `for in` z alokacją w RAM okazała się ponad 22-krotnie szybsza od klasycznej pętli `while`. Ceną za wydajność jest jednak wysokie zużycie pamięci operacyjnej przy dużych wartościach $N$.

### Optymalizacja kompilacji

Wpływ flag optymalizacyjnych kompilatora ma kluczowe znaczenie w językach kompilowanych.

#### Pascal

Włączenie flagi `-O2` w kompilatorze Free Pascal (`fpc -O2`):

```bash
fpc -O2 inc/inc.p -o"$TMP/p" -Tlinux &>/dev/null
```

powoduje dwukrotny wzrost szybkości wykonywania pętli dzięki eliminacji zbędnych operacji na rejestrach procesora:

![compilation.png](/img/loopspeed/compilation.png)

![compilation_table.png](/img/loopspeed/compilation_table.png)

#### C++

W przypadku C++ zastosowanie flag optymalizacyjnych `-O2` lub `-O3` prowadziło do całkowitego wycięcia pustej pętli z kodu binarnego przez kompilator (`dead code elimination`), redukując czas wykonania do zera (szumu pomiarowego). Aby zachować wykonywanie pętli w pomiarze, zastosowano poziom `-O1`:

```bash
g++ -O1 -o "$TMP/cpp" 'inc/inc.cpp';
```

Porównanie poziomów optymalizacji w C++:

![cpp_optimization.png](/img/loopspeed/cpp_optimization.png)

![cpp_optimization_table.png](/img/loopspeed/cpp_optimization_table.png)

#### Fortran

Podobne zależności zaobserwowano dla Fortrana przy użyciu flagi `-O1`:

![f_optimization.png](/img/loopspeed/f_optimization.png)

![f_optimization_table.png](/img/loopspeed/f_optimization_table.png)

### Sposób pomiaru czasu

Porównano dwie metody pomiaru czasu wykonania: narzędzie systemowe `/usr/bin/time -f "%e"` oraz dedykowany skrypt `util/timing.sh` oparty na mikrosekundowym stemplu `date +%s.%N` i kalkulatorze `bc`:

```bash
#!/usr/bin/env bash
START=$(date +%s.%N)
"$@" &> /dev/null
END=$(date +%s.%N)
DIFF=$( echo "scale=6; (${END} - ${START})*1/1" | bc )
echo "${DIFF}"
```

Porównanie rozkładu wyników obu metod:

![pairedHistogramTiming.png](/img/loopspeed/pairedHistogramTiming.png)

| Metoda                | Czas \[s\] | Odchylenie std \[s\] |
| --------------------- | ---------- | -------------------- |
| util/timing.sh        | 4.244      | 0.449                |
| /usr/bin/time -f "%e" | 4.208      | 0.285                |

Obie metody dają spójne wyniki w zakresie dłuższych pomiarów, jednak `util/timing.sh` zapewnia wyższą precyzję niezbędną przy szacowaniu krótkich czasów uruchamiania.

### Testy jednostkowe (`shunit2`)

Prawidłowość działania środowiska weryfikowana jest przez pakiet testów napisany w `shunit2`:

> test.sh

Skrypt weryfikuje poprawność estymacji parametrów, spójność skali czasowej oraz graniczne czasy uruchamiania skryptów.

### Ciągła integracja (CI/CD)

W projekcie wdrożono automatyczny pipeline CI/CD (GitHub Actions), zdefiniowany w `.github/workflows/test.yml`. W ramach każdego pusha/pull requesta uruchamiany jest kontener MariaDB oraz zestaw testów jednostkowych.

Testowanie pipeline'u lokalnie można przeprowadzić przy użyciu narzędzia `act`:

```bash
# Instalacja narzędzia act (np. na Arch Linux)
paru -S act

# Uruchomienie lokalnego pipeline z użyciem obrazu Ubuntu
act -P ubuntu-latest=catthehacker/ubuntu:act-latest
```

---

Mam nadzieję, że przeprowadzone porównanie oraz analiza pozwalają lepiej zrozumieć różnice wydajnościowe i narzuty uruchomieniowe poszczególnych języków programowania. Zaprezentowaną strukturę testową można łatwo rozbudować o kolejne testy – np. operacje wejścia/wyjścia (I/O) czy całkowanie numeryczne.
