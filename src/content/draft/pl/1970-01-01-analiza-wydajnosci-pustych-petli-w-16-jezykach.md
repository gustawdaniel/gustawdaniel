---
title: Analiza wydajności pustych pętli w 16 językach
slug: analiza-wydajnosci-pustych-petli-w-16-jezykach
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2021-04-20T20:33:48.000Z
draft: true
---

## Opis projektu

Nie wiem, jakie są wasze wymarzone prezenty gwiazdkowe, ale moim jest kawałek ciekawego kodu. I właśnie taki prezent dostałem około półtora miesiąca temu.

Mój przyjaciel wysłał mi w e-mailu [Kod źródłowy programu](https://www.dropbox.com/s/s9dy1jabkzxzls6/loopspeed.zip?dl=1), który mierzył czasy wykonywania pustych pętli w czterech różnych językach programowania. Dopisałem testy dla dwunastu innych języków, lekko zautomatyzowałem testowanie i przeanalizowałem wyniki.

W tym wpisie pokażę jak wyglądają i jak szybko działają programy wykonujące puste pętle językach:

* Matlab,
* Bash,
* SQL,
* Mathematica,
* C#,
* JavaScript,
* Python,
* Ruby,
* Perl,
* R,
* Php,
* Fortran 95,
* C++,
* C,
* Pascal
* Java.

Do logowania danych wykorzystamy plik tekstowy oraz silnik bazodanowy `SQLite`. Analizę danych przeprowadzimy w programie Mathematica.

## Instalacja

Z automatyzacją instalacji serwera bazy danych `mysql` zawsze wiążą się pewne problemy jak [konieczność podawania hasła](http://stackoverflow.com/questions/7739645/install-mysql-on-ubuntu-without-password-prompt) albo zmieniania [zakresu lokacji](http://askubuntu.com/questions/766334/cant-login-as-mysql-user-root-from-normal-user-account-in-ubuntu-16-04) z których można łączyć się z bazą jako `root`. Dlatego nie umieściłem instalacji serwera `mysql` w pliku `install.sh`. Jeśli nie masz serwera bazy danych, zainstaluj go ręcznie:

```bash
sudo apt-get install -y mysql-server mysql-client
```

Niestety, a raczej niestety dla mnie, od kilku miesięcy świeżo zainstalowany serwer `MySQL` nie pozwala już domyślnie logować się komendą `mysql -u root`, zamiast tego wymaga `sudo mysql -u root`. Jest to zrozumiałe ze względów bezpieczeństwa i na pewno pomaga na serwerach produkcyjnych, ale z drugiej strony jest to niewygodne przy bawieniu się kodem w domu. Jeśli twój komputer to maszyna lokalna i tak jak ja nie chcesz używać `sudo` do każdego łączenia z bazą z `basha`, możesz wykonać następujący [manewr](http://stackoverflow.com/questions/38098505/mysql-works-with-sudo-but-without-not-ubuntu-16-04-mysql-5-7-12-0ubuntu1-1):

```bash
sudo mysql -u root
DROP USER 'root'@'localhost';
CREATE USER 'root'@'%' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';
FLUSH PRIVILEGES;
exit
```

w ten sposób przywrócisz `mysql -u root` jako działającą metodę łączenia się z bazą. Prezentowany tutaj program używa właśnie takiej metody - to znaczy bez `sudo`.

Jeśli nie chcesz zmieniać ustawień bazy danych zawsze możesz użyć [zmiennych środowiskowych](https://dev.mysql.com/doc/refman/5.7/en/environment-variables.html).

```bash
export MYSQL_PWD=<your password to mysql server>
export MYSQL_HOST=localhost;
```

Nie jest to rozwiązanie, które należy stosować na serwerach produkcyjnych, natomiast świetnie nadaje się na maszyny lokalne, bo jest wygodne.

Żeby sprawdzić, czy Twoja konfiguracja bazy jest poprawna wykonaj komendę:

```bash
mysql --user=root "$MYSQL_DATABASE" -e "SELECT 'OK' as 'state'"
```

Jeśli zobaczysz

```sql
+-------+
| state |
+-------+
| OK    |
+-------+
```

to reszta instalacji jest jeszcze prostsza.

Instalację projektu na czystym Ubuntu 16.04.1 LTS wymaga wpisania trzech komend:

```bash
sudo apt-get install git
git clone --depth=1 http://gitlab.com/gustawdaniel/loopspeed && cd loopspeed
sudo bash install.sh
perl util/parameters_load.pl
```

Jest to pierwszy wpis z repozytorium na `gitlabie` a nie `githubie`. Nie jest to przypadek, lecz zasługa świetnego narzędzia do ciągłej integracji - `gitlab-ci`, które omówię na samym końcu.

Teraz przyjrzymy się skryptom: instalacyjnemu i ładującemu parametry.

Skrypt instalacyjny `install.sh` wykonuje aktualizację listy dostępnych paczek i instalację wymaganych kompilatorów i interpreterów języków:

```bash
#!/usr/bin/env bash

apt-get update -y
apt-get install -y php
apt-get install -y python default-jdk g++ mono-mcs gfortran fp-compiler r-base nodejs-legacy ruby
```

dorzuca do tego kilka programów, które wykorzystujemy

```bash
apt-get install -y sqlite3 bc git mysql-client curl
```

oraz paczki perla, których używamy głównie do komunikacji z bazą danych `SQLite`

```
apt-get install -y libtext-csv-perl libdbi-perl libdbd-sqlite3-perl
```

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
"create table result (
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

Drugim skryptem który wykonaliśmy był

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

* `install.sh` - skrypt instalacyjny (omówiłem go w poprzednim paragrafie),
* `inc.bash` - bazowy skrypt do robienia pomiarów czasu trwania pustych pętli,
* `analysis.nb` - notebook programu Mathematica. Służył on do badania wyników.
* `test.sh` - skrypt do testowania działania `inc.bash` oraz innych elementów projektu.

Dzięki takiej strukturze jesteśmy w stanie bez problemu dodawać nowe języki programowania. Trzymanie w bazie numeru rewizji pozwala nam również sprawdzać, jak różne instrukcje spełniające teoretycznie tą samą funkcjonalność (np: `for` vs `while`) różnią się od siebie wydajnością.

## Dataflow

Przepływ danych w programie posiada wbudowane sprzężenie zwrotne. Z jednej strony `inc.bash` testuje pętle za pomocą parametrów wyliczonych z modelu za pomocą `util/generate_parameters.wl`, z drugiej strony, żeby móc dopasować model do danych, musieliśmy je najpierw dostać właśnie uruchamiając `inc.bash`.

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

Omówimy teraz skrypt który przekształca wyniki pomiarów na parametry modelu.

> util/generate\_parameters.wl

```
(*MathematicaScript -script util/generate_parameters.wl*)

Needs["DatabaseLink`"]
conn = OpenSQLConnection[
  JDBC["SQLite", $InitialDirectory <> "/log/log.db"]];

Print["Conection with database established..."];
```

Skrypt zaczyna pracę od połączenia do bazy. Robi to za pomocą dwóch linii kodu. Pierwsza z nich to importowanie paczki. Druga zapisuje do zmiennej `conn` nowe połączenie realizowane za pomocą interfejsu `JDBC`. Zmienna `$InitialDirectory` zwraca lokalizację z której startujemy, a znaki `<>` są operatorem konkatenacji stringów. W ten sposób `JDBC` przyjmuje tu tylko dwa argumenty: nazwę silnika bazodanowego i lokalizację pliku z bazą.

Pierwsze zapytanie do bazy wyciąga listę języków jakich używamy.

```
list = Flatten[
  SQLExecute[conn, "SELECT name FROM log GROUP BY name"]];
```

Za wykonanie zapytania na połączeniu `conn` odpowiada `SQLExecute`. Komenda `Flatten` służy spłaszczeniu tablicy, która w przeciwnym wypadku była by tablicą tablic. Jest to związane z tym, że jeśli wybieramy więcej niż jeden atrybut to tablica dwuwymiarowa jest bardziej naturalnym sposobem reprezentacji wyniku zapytania. Widać to dobrze na przykładzie kolejnego zapytania, a raczej całej serii zapytań wykonywanych wewnątrz instrukcji `Table`:

```
data = Table[{i,
  SQLExecute[conn,
    "SELECT size,time FROM log WHERE name='" <> ToString[i] <>
        "'"]}, {i, list}];

Print["Data extracted from database..."];
```

Tutaj do zmiennej `data` zapisujemy tablicę, która iterując po wyciągniętej wcześniej liście języków każdy swój element układa w dwuelementowa tablicę. Pierwszy z nich jest właśnie tą nazwą, drugi jest tablicą par zmiennych `size` i `time`, czyli liczb pętli i czasów wykonywania odpowiadających danemu językowi.

Kolejny "oneliner" odpowiada za modelowanie:

```
nlm = NonlinearModelFit[Log[data[[#, 2]]],
  Log[Exp[a] Exp[x] + b^2], {a, b}, x] & /@ Range[list // Length];

Print["Nonlienear models calculated..."];
```

Pierwsza linijka dopasowuje modele dla wszystkich języków za jednym razem. Rozłożymy ją na czynniki pierwsze.

Zacznijmy od najbardziej tajemniczych znaczków, czyli składni `f[#]&/@{1,2,3}` . Znaki `a/@b` oznaczają mapowanie, czyli zastosowanie operacji `a` do elementów pierwszego poziomu tablicy `b`. Znak `#` oznacza slot na włożenie danych, a `&` jest znacznikiem informującym, że to co nastąpi później będzie wkładane do slotów. Tak więc `f[#]&[a]` jest tym samym co `f[a]`. Ostatecznie `f[#]&/@{1,2,3}` jest równoważne `{f[1],f[2],f[3]}`. Wielkość `list//Length` to długość zmiennej `list`. W naszym przypadku `16`. Funkcja `Range` tworzy tablicę od jedności do swojego argumentu. Dlatego `Range[list//Length]` będzie tablicą od `1` do `16`. Więc te liczby kolejno będziemy wkładać do slotu oznaczonego `#` w wyrażeniu `NonlinearModelFit`.

`NonlinearModelFit` jest funkcją języka `Mathematica` odpowiadającą za dopasowywanie modelu do danych, oraz zwracanie dodatkowych informacji związanych na przykład z błędami pomiarowymi.

Jej pierwszym argumentem jest zbiór danych. W naszym przypadku zlogarytmowana lista par czasów i rozmiarów pętli. Działa tu zasada: "logarytm tablicy to tablica logarytmów".

Drugi argument to model danych jaki dopasowujemy. U nas `Log[Exp[a] Exp[x] + b^2]`. Choć na pierwszy rzut oka, tak nie wygląda, jest to prosta `Ax+B` tylko w zmienionym układzie współrzędnych. Spójrzmy na to tak. Do `x` i `y` dopasowywali byśmy prostą `y=Ax+B`, Jeśli zlogarytmujemy obie strony to mamy `log(y)=log(A exp(log(x))+B)`, dane, do jakich dopasowujemy to `{Log[x], Log[y]}`, więc tymczasowo nazywająć `log(x)=X` i `log(y)=Y` dostajemy wyrażenie `Y = log(A exp(X) + B)` dla danych `X,Y`. Jednak ponieważ nasze `A` jest bardzo małe, a `B` zawsze dodatnie, wprowadzamy oznaczenia `A=exp(a)` oraz `B=b^2`. Teraz `a` może mieć naturalne rzędy wielkości - tak lubiane przez metody numeryczne, a na `b` nie narzucamy żadnych ograniczeń dotyczących znaku - metody numeryczne skaczą ze szczęścia, kiedy widzą takie podstawienia. Od teraz będziemy operować zmiennymi `a` i `b` mając na myśli, że `A` i `B` możemy z nich łatwo obliczyć.

Trzeci argument `NonlinearModelFit` to lista stopni swobody, a czwarty nazwany po prostu `x` odpowiada naszemu dużemu `X` czyli logarytmowi z liczby powtórzeń pętli.

Cały zbiór dopasowanych modeli został zapisany w zmiennej `nlm`. Czas wydobyć z niego parametry, które chcemy zapisać do pliku. Odpowiada za to kod:

```
nameABlist = {list[[#]],
  Exp[a],
  b^2,
  Exp[a]*nlm[[#]]["ParameterErrors"][[1]],
  Abs[2*b]*nlm[[#]]["ParameterErrors"][[2]]} /. nlm[[#, 1, 2]] & /@
    Range[Length[list]];

Print["Parameters extracted from models..."];
```

Tworzona przez niego tablica `nameABList` jest prostokątną macierzą o wymiarach 5 kolumn na 16 wierszy. Ponownie wykorzystujemy mapowanie z przebieganiem po zakresie wskaźników odpowiadających językom `/@Range[Length[list]]`. Za `list[[#]]` zostaje wstawiona nazwa języka, dwie kolejne wielkości dzięki znacznikowi `/.` są podstawiane z modelu `nlm`. Dwie ostatnie to błędy pomiarowe odpowiednio przeskalowane w związku ze zmianą układu współrzędnych.

Na samym końcu wysyłamy naszą macierz do pliku:

```
Export[$InitialDirectory <> "/config/parameters.csv",
  SetPrecision[nameABlist, 10]];

Print["Parameters saved to file. Process finished correctly."];
Exit[];
```

## Wyniki

Dla każdego języka omówimy wyniki. Zamiast podawać ilość wykonywanych pętli na sekundę, na wykresach prezentujemy jej logarytm `a`, jako łatwiejszy do porównywania. A zamiast czasu włączania programu odpowiadającemu jednemu wykonaniu pętli jego pierwiastek `b`. Do wyrysowania wykresów zastosowaliśmy następujący kod z pliku `analysisi.nb`

Do prezentacji wyników wykorzystamy interfejs zrozumiały dla człowieka, czyli wykresy. Za ich wyświetlenie odpowiada poniższy fragment programu `analysis.nb`.

```
Do[Module[{img, bands},
  bands[x_] =
   nlm[[i]]["SinglePredictionBands", ConfidenceLevel -> .99];
  img = Show[{ListLogLogPlot[{data[[i, 2]]}, PlotRange -> Full,
      PlotLabel -> data[[i, 1]], ImageSize -> 800,
      BaseStyle -> {FontSize -> 15},
      FrameLabel -> {"$size [number of loops]", "$time [sec]"},
      Frame -> True, PlotStyle -> {Lighter[Red]},
      PlotLegends ->
       Placed[SwatchLegend[{"Experimental data"},
         LegendMarkerSize -> {30, 30}], {0.3, 0.85}]],
     LogLogPlot[{Exp[nlm[[i]][Log[x]]], Exp[bands[Log[x]]]}, {x, 1,
       10^13}, PlotLegends ->
       Placed[SwatchLegend[{nlm[[i]][
           "ParameterConfidenceIntervalTable"]},
         LegendMarkerSize -> {1, 1}], {0.3, 0.75}]]}];
  Print[img];
  Export["inc_" <> ToString[list[[i]]] <> ".png", img];
  ], {i, list // Length}]
```

Funkcja `Do` wykonuje swój pierwszy argument iterując po `i` od `1` do liczby badanych języków programowania. `Module` z jednej strony porządkuje kod zbierając go w jedną niepodzielną całość, z drugiej pozwala nie zaśmiecać głównego programu zmiennymi lokalnymi do przechowywania wykresów (`img`) i linii granicznych (`bands`). Owe linie graniczne to możliwie najkrótszy i najdłuższy czas wykonywania określonej ilości pętli przy założonym przedziale ufności. Nie wchodząc już w szczegóły, które związane głównie z formatowaniem nie są tak ciekawe: `img` zawiera wykres. Funkcja `Print` wyświetla go na ekranie a `Export` zapisuje do pliku.

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

[![inc_inc.bash.png](https://s23.postimg.org/6tnjwy8yz/inc_inc_bash.png)](https://postimg.org/image/6tnjwy8yv/)

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

mysql -u root inc -e "CALL inc_loop($1)";
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

[![inc_inc.sql.sh.png](https://s24.postimg.org/k07fsopkl/inc_inc_sql_sh.png)](https://postimg.org/image/cwzkd2k4x/)

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

[![inc_inc.cs.png](https://s28.postimg.org/wtbuvxy3h/inc_inc_cs.png)](https://postimg.org/image/zanm37hzt/)

Szybkość włączania jest umiarkowania, a szybkość pojedynczej pętli plasuje język na umiarkowanie słabej pozycji - 6 od końca.

### JS

[JavaScript](https://pl.wikipedia.org/wiki/JavaScript) z pewnością wielu ludziom myli się z Javą. Teraz się to wydaje zabawne, ale mi też się na początku mylił. Nic dziwnego, bo w 1995, kiedy język powstał nazwę wzięto od Javy, żeby JavaScript miał lepszy marketing. Tak naprawdę nie mają ze sobą wiele wspólnego. Obecnie jest to żywy wciąż rozwijany język, który zainspirował i bardzo spopularyzował funkcyjny styl programowania. Za jego sprawą w wielu innych językach pojawiły się tak zwane funkcje lambda, których składnia w ES6 została skrócona, tak, że nazywa się je [strzałkowymi](http://shebang.pl/artykuly/es6-funkcje-strzalkowe/).

Kod źródłowy jest całkiem przyjemny i wygląda tak:

```js
var max=process.argv[2];
for(var i=0;i<=max;i++){}
```

[![inc_inc.js.png](https://s23.postimg.org/fdvlylzqj/inc_inc_js.png)](https://postimg.org/image/ixhjof2g7/)

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

[![inc_inc.python.png](https://s30.postimg.org/gdrdtsu81/inc_inc_python.png)](https://postimg.org/image/ka4ppsf7h/)

Mimo, że python jest jednym z wolniejszych języków skryptowych, różnice te są na tyle małe, że można uczciwie przyznać, że mieści się dokładnie na środku rankingu. Ilość kodu nie jest przerażająca, a krzywa nauki? Jak dla mnie ciężko mówić o krzywej nauki w przypadku tego języka. Można w nim pisać, nawet go nie umiejąc, po prostu zgadując jak coś powinno być napisane. Jest to bardzo intuicyjny język o rozsądnej wydajności w większości przypadków.

### Ruby

[Ruby](https://pl.wikipedia.org/wiki/Ruby_(j%C4%99zyk_programowania)) jest stosunkowo młody, jak na język. Pierwsze wydanie ujrzało światło dzienne w 1995. Jest to dynamicznie typowany, obiektowy, interpretowany język popularny głównie w stanach. Jego znaczenie wzrosło po wydaniu frameworku Ruby on Rails - przeznaczonego do tworzenia aplikacji internetowych, ale widziałem Ruby w innych zastosowaniach od analizy danych giełdowych po platformę do blogowania - jekylla.

W tym języku, nie miałem okazji dużo pisać, ale kod wygląda dość przyjemnie

```ruby
for i in (1 .. ARGV[0].to_i)
end
```

Zaskakujące, że ta składnia, wcale nie zamula pamięci RAM nawet przy bardzo dużych tablicach ani nie powoduje problemów jakie w `pythonie` powoduje nie utworzenie zmiennej `max`. Składnia jest więc znacznie lepsza.

[![inc_inc.rb.png](https://s28.postimg.org/iirygthal/inc_inc_rb.png)](https://postimg.org/image/dwvu8gvrd/)

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

[![inc_inc.perl.png](https://s23.postimg.org/6uq89tx3v/inc_inc_perl.png)](https://postimg.org/image/engw1t32v/)

Wyniki nie są niespodzianką. Włączanie się jest najszybsze z języków skryptowych. Czas wykonywania pojedynczej pętli umiarkowany.

### R

[R](https://pl.wikipedia.org/wiki/R_(j%C4%99zyk_programowania)) jest środowiskiem do obliczeń statystycznych. W całym tym zestawieniu sporo jest języków powiązanych z matematyką, bo sam się nią lubię zajmować. R szczególnie często występuje w kontekście bioinformatyki.

Cechy charakterystyczne to: strzałki do przypisywania wartości i podobnie jak w Matlabie ogromna łatwość operowania na macierzach i wektorach.

```r
args <- commandArgs(trailingOnly = TRUE)

x <- 0
while(x < as.numeric(args)) {
    x <- x+1;
}
```

[![inc_inc.r.png](https://s29.postimg.org/fsrzxg0jr/inc_inc_r.png)](https://postimg.org/image/izmjh2kzn/)

Podobnie jak Wolfram Language, tak i tan wysoko poziomowy język o specjalizacji sprofilowanej na testowanie hipotez statystycznych i prowadzenie badań poradził sobie słabo w tym teście. Zarówno pod względem szybkości pętli jak i uruchamiania zajął trzecią pozycję od końca.

### Php

Język [Php](https://pl.wikipedia.org/wiki/PHP) pojawił się w roku 1995, jako język do generowania stron internetowych. I choć można pisać backend webowy w innych językach, trzeba przyznać, że PHP radzi sobie z tym zadaniem całkiem dobrze. Oczywiście, wielkim serwisom opłaca się kompilowanie backendu, ale w absolutnej większości zastosowań PHP stanowi świetny kompromis między wygodą języka interpretowanego a wydajnością.

Kod php wygląda standardowo i intuicyjne

```php
<?php

$max = (int)$argv[1];

for($i=0; $i<$max; $i++);
```

[![inc_inc.php.png](https://s28.postimg.org/svv7c3xl9/inc_inc_php.png)](https://postimg.org/image/ywsw96k7d/)

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

[![inc_inc.f95.png](https://s27.postimg.org/zbpgu9eeb/inc_inc_f95.png)](https://postimg.org/image/4u9m2pr1b/)

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

[![inc_inc.cpp.png](https://s30.postimg.org/grnuo989t/inc_inc_cpp.png)](https://postimg.org/image/n5cxrid5p/)

Jak przystało na język kompilowany ogólnego przeznaczenie `c++` staje na podium w obu rankingach. Uruchamia się jako trzeci, wykonuje pętle jako drugi najszybszy język w zestawieniu.

### C

Historia języka [`C`](https://pl.wikipedia.org/wiki/C_(j%C4%99zyk_programowania)) sięga roku 1972, wywodzi się on z języka [`B`](https://pl.wikipedia.org/wiki/B_(j%C4%99zyk_programowania)) współtworzonego przez twórcę `C` - Dennisa Ritchiego. `B` natomiast wywodzi się z [`BCPL`](https://pl.wikipedia.org/wiki/BCPL) - zapomnianego już języka, który jednak wywarł ogromny wpływ na to jak dzisiaj kodujemy. To długa i ciekawa historia, ale, żeby dygresja nie poszła zbyt daleko wrócę do `C`. Został zaprojektowany do programowania systemów operacyjnych i zadań dzisiaj uważanych za niskopoziomowe.

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

[![inc_inc.c.png](https://s24.postimg.org/71q65aglx/inc_inc_c.png)](https://postimg.org/image/71q65aglt/)

Wyniki testu pokazują, że `C` jest na trzecim miejscu pod względem szybkości pętli ustępując `C++` tylko o 1%, ale zajmuje pierwsze miejsca w klasyfikacji szybkości uruchamiania wyprzedzając `Pascala` o około 1‰.

### Pascal

O wilku mowa. To znaczy o [`Pascalu`](https://pl.wikipedia.org/wiki/Pascal_(j%C4%99zyk_programowania)) - języku, który powstał w 1970 roku i w przeciwieństwie do `C`, nie udostępniał mechanizmów niskopoziomowych, lecz został zaprojektowany do tworzenia strukturalnych aplikacji.

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

[![inc_inc.p.png](https://s23.postimg.org/kd5tcbe97/inc_inc_p.png)](https://postimg.org/image/n78yprgfb/)

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

[![inc_inc.java.png](https://s24.postimg.org/5e9nuhvkl/inc_inc_java.png)](https://postimg.org/image/6gjud1edt/)

Java zajęła czwarte miejsce pod względem szybkości pętli ustępując liderowi jedynie o 1-2%, ale jej włączanie trwało około 40 razy dłużej niż programów z czołówki rankingu. W kategorii szybkości włączania java była czwarta od końca.

### Podsumowanie

Na koniec załączam wykres porównujący czas trwania pojedyńczej pętli w każdym języku wykonany za w pliku `analysis.nb`

```
BarChart[Log[SortBy[nameABlist, #[[2]] &][[All, 2]]],
 ChartStyle -> "DarkRainbow",
 ChartLegends -> SortBy[nameABlist, #[[2]] &][[All, 1]],
 AxesLabel -> "Log[a]"]
```

[![speed.png](https://s17.postimg.org/fst8rikvj/speed.png)](https://postimg.org/image/4t81fwugb/)

Wykres ma skalę logarytmiczną, im niższa wartość tym lepiej.

Jeśli jesteś ciekaw dokładnych wyników poniżej prezentuję tabelę.

|language|one loop time \[s\]|loop time error \[s\]|launch time \[s\]|launch time error \[s\]|launch to loop ratio \[s\]|
|---|---|---|---|---|---|
|inc.f95|3.50468\*10^(-10)|1.07954\*10^(-12)|1.72753\*10^(-3)|5.04969\*10^(-6)|4.92921\*10^(6)|
|inc.cpp|3.5061\*10^(-10)|1.41184\*10^(-12)|1.38989\*10^(-3)|5.77246\*10^(-6)|3.9642\*10^(6)|
|inc.c|3.53343\*10^(-10)|1.01268\*10^(-12)|1.37686\*10^(-3)|3.62949\*10^(-6)|3.89666\*10^(6)|
|inc.java|3.55209\*10^(-10)|1.25794\*10^(-12)|5.70852\*10^(-2)|6.74846\*10^(-5)|1.60709\*10^(8)|
|inc.p|3.69329\*10^(-10)|2.36513\*10^(-12)|1.37772\*10^(-3)|4.0445\*10^(-6)|3.73033\*10^(6)|
|inc.m.sh|2.69198\*10^(-9)|2.10845\*10^(-11)|5.28642|4.69114\*10^(-2)|1.96377\*10^(9)|
|inc.php|8.89544\*10^(-9)|2.62779\*10^(-11)|2.13014\*10^(-2)|3.08575\*10^(-5)|2.39464\*10^(6)|
|inc.rb|3.64662\*10^(-8)|1.2021\*10^(-10)|3.40208\*10^(-2)|4.46364\*10^(-5)|9.32938\*10^(5)|
|inc.perl|4.24243\*10^(-8)|1.23231\*10^(-10)|2.15686\*10^(-3)|4.64159\*10^(-6)|5.08403\*10^(4)|
|inc.js|6.14158\*10^(-8)|2.27239\*10^(-10)|4.14627\*10^(-2)|6.47284\*10^(-5)|6.75115\*10^(5)|
|inc.python|6.29119\*10^(-8)|1.69606\*10^(-10)|1.02831\*10^(-2)|1.5976\*10^(-5)|1.63452\*10^(5)|
|inc.cs|1.59136\*10^(-7)|5.1884\*10^(-10)|1.06194\*10^(-2)|2.41509\*10^(-5)|6.67321\*10^(4)|
|inc.wl|4.87908\*10^(-7)|1.24762\*10^(-9)|1.91462\*10^(-1)|2.2833\*10^(-4)|3.92415\*10^(5)|
|inc.r|7.28671\*10^(-7)|2.11159\*10^(-9)|1.20264\*10^(-1)|1.79633\*10^(-4)|1.65045\*10^(5)|
|inc.sql.sh|2.24287\*10^(-6)|4.28608\*10^(-9)|5.33614\*10^(-3)|1.34152\*10^(-5)|2.37916\*10^(3)|
|inc.bash|4.23198\*10^(-6)|5.03612\*10^(-9)|1.8443\*10^(-3)|4.70927\*10^(-6)|4.35801\*10^(2)|

Analogicznie dla czasów włączania programów rysujemy drugi wykres

```
BarChart[Log[SortBy[nameABlist, #[[3]] &][[All, 3]]],
 ChartStyle -> "DarkRainbow",
 ChartLegends -> SortBy[nameABlist, #[[3]] &][[All, 1]],
 AxesLabel -> "Log[b]"]
```

[![speed2.png](https://s27.postimg.org/5zsco9ezn/speed2.png)](https://postimg.org/image/ll9o87qxr/)

Tutaj też najlepsze wartości to najniższe. Wartość zerowa oznacza czas włączania równy 1 sekundzie.

Poniżej ta sama tabela co poprzednio, ale posortowana po czasach włączania programu:

|language|one loop time \[s\]|loop time error \[s\]|launch time \[s\]|launch time error \[s\]|launch to loop ratio \[s\]|
|---|---|---|---|---|---|
|inc.c|3.53343\*10^(-10)|1.01268\*10^(-12)|1.37686\*10^(-3)|3.62949\*10^(-6)|3.89666\*10^(6)|
|inc.p|3.69329\*10^(-10)|2.36513\*10^(-12)|1.37772\*10^(-3)|4.0445\*10^(-6)|3.73033\*10^(6)|
|inc.cpp|3.5061\*10^(-10)|1.41184\*10^(-12)|1.38989\*10^(-3)|5.77246\*10^(-6)|3.9642\*10^(6)|
|inc.f95|3.50468\*10^(-10)|1.07954\*10^(-12)|1.72753\*10^(-3)|5.04969\*10^(-6)|4.92921\*10^(6)|
|inc.bash|4.23198\*10^(-6)|5.03612\*10^(-9)|1.8443\*10^(-3)|4.70927\*10^(-6)|4.35801\*10^(2)|
|inc.perl|4.24243\*10^(-8)|1.23231\*10^(-10)|2.15686\*10^(-3)|4.64159\*10^(-6)|5.08403\*10^(4)|
|inc.sql.sh|2.24287\*10^(-6)|4.28608\*10^(-9)|5.33614\*10^(-3)|1.34152\*10^(-5)|2.37916\*10^(3)|
|inc.python|6.29119\*10^(-8)|1.69606\*10^(-10)|1.02831\*10^(-2)|1.5976\*10^(-5)|1.63452\*10^(5)|
|inc.cs|1.59136\*10^(-7)|5.1884\*10^(-10)|1.06194\*10^(-2)|2.41509\*10^(-5)|6.67321\*10^(4)|
|inc.php|8.89544\*10^(-9)|2.62779\*10^(-11)|2.13014\*10^(-2)|3.08575\*10^(-5)|2.39464\*10^(6)|
|inc.rb|3.64662\*10^(-8)|1.2021\*10^(-10)|3.40208\*10^(-2)|4.46364\*10^(-5)|9.32938\*10^(5)|
|inc.js|6.14158\*10^(-8)|2.27239\*10^(-10)|4.14627\*10^(-2)|6.47284\*10^(-5)|6.75115\*10^(5)|
|inc.java|3.55209\*10^(-10)|1.25794\*10^(-12)|5.70852\*10^(-2)|6.74846\*10^(-5)|1.60709\*10^(8)|
|inc.r|7.28671\*10^(-7)|2.11159\*10^(-9)|1.20264\*10^(-1)|1.79633\*10^(-4)|1.65045\*10^(5)|
|inc.wl|4.87908\*10^(-7)|1.24762\*10^(-9)|1.91462\*10^(-1)|2.2833\*10^(-4)|3.92415\*10^(5)|
|inc.m.sh|2.69198\*10^(-9)|2.10845\*10^(-11)|5.28642|4.69114\*10^(-2)|1.96377\*10^(9)|

## Ciekawostki

Podczas prowadzenia niektórych testów zdarzało się, że zmiany w kodzie, czy sposobie kompilacji bardzo istotnie wpłynęły na wyniki, mimo, że teoretycznie, każdy program miał robić to samo: puste pętle.

Pierwszy przykład to zmiana sposobu przebiegania pętli

### RAM vs Procesor

Mamy dwie możliwości przebiegania po zakresie od 1 do n. Pierwsza to zacząć od 1 i zwiększać ją o jeden co chwilę sprawdzając czy doszliśmy już do n, czy nie. Drugi, to stworzyć tablicę od 1 do n, załadować ją do pamięci RAM i wykonać ciało pętli dla każdej z tych liczb z pamięci.

Pierwsza metoda, bardziej konserwatywna jest typową konstrukcją pętli, jaką chciałem testować. Jednak, ta druga, okazuje się być bardziej wydajna dla rozmiarów tablic, które mieszczą się nam w pamięci operacyjnej. Prezentuję na przykładzie języka `R`, jak zmiana sposobu wykonywania pętli wpłynęła na szybkość jej wykonywania.

Oto wycinek `git diff` pokazujący, jak zmienił się kod źródłowy:

[![r.png](https://s27.postimg.org/jzgak8vab/image.png)](https://postimg.org/image/rffk61izj/)

Widzimy, że zamieniliśmy pętlę ładującą wszystko do RAM, na iterującą co jeden ze sprawdzaniem warunku co krok. Poniżej dodaję kod do wykonania stosownego wykresu:

```
gitr = SQLExecute[conn,
   "SELECT git FROM log WHERE name='inc.r' GROUP BY git"];
dr = SQLExecute[conn,
     "SELECT size,time FROM log WHERE name='inc.r' AND git='" <>
      ToString[#] <> "'"] & /@ Flatten[gitr];
ListLogLogPlot[{Flatten[dr[[#]] & /@ Range[4], 1], dr[[5]]},
  PlotRange -> Full,
  PlotLabel -> "Differencies in loop time for inc.r",
  BaseStyle -> {FontSize -> 14}, ImageSize -> 800,
  PlotLegends ->
   Placed[SwatchLegend[{"while loop", "for in loop"},
     LegendMarkerSize -> {30, 30}], {0.3, 0.75}]]
```

[![diff_loop.png](https://s23.postimg.org/9d14t0ii3/diff_loop.png)](https://postimg.org/image/hvakxcp0n/)

Widzimy tutaj ogromną przewagę pętli `For in`. Kiedy spojrzymy na tabelę:

[![loop_type.png](https://s24.postimg.org/73qpc5985/loop_type.png)](https://postimg.org/image/5op4nf84x/)

Okazuje się być ona 22 krotna. To znaczy: w języku `R`, jeśli starczy nam pamięci RAM, to pusta pętla `for in` wykona się 22 razy szybciej niż pętla `while`. Podobne jakościowo rezultaty dostajemy w języku `python`, a intuicja podpowiada, że należy ten wniosek rozszerzyć na inne języki, w których istnieją konstrukcję pętli, które najpierw ładują zakres do RAM, a potem po nim przebiegają.

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

[![compilation.png](https://s30.postimg.org/h8ln3c8gh/compilation.png)](https://postimg.org/image/690frqi19/)

A liczbowe wyniki analizy w tabeli poniżej

[![compilation.png](https://s27.postimg.org/ajfz2n3df/compilation.png)](https://postimg.org/image/gkdnzppzj/)

Można z niej wyczytać, że tylko dzięki usunięciu niepotrzebnych przeładowań rejestru program przyśpieszył 5.6 raza. Inaczej ujmując - trzy znaki w komendzie kompilacyjnej `-O2` przyśpieszyły program kilkukrotnie.

#### C++

W przypadku `c++` sytuacja jest nawet bardziej złożona. Podobnie jak w Pascalu mamy do wyboru różne flagi mające różne zastosowania. Ostatecznie zdecydowaliśmy się, że wydajność `c++` najlepiej odda zastosowanie `-O1`.

```bash
g++ -O1 -o "$TMP/cpp" 'inc/inc.cpp';
```

Z [dokumentacji](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html) kompilatora wynika, że dzięki niej kompilator próbuje zredukować wielkość kodu i czas wykonywania, ale nie stosuje tych optymalizacji, które mogły by zająć więcej czasu.

Było to dla mnie dużym zaskoczeniem, ale kiedy stosowałem głębszą optymalizację, to znaczy flagi `-O2`, `-O3` i `-Ofast`, okazywało się, że pętla jest całkowicie pomijana. Czas wykonywania programu spadał do rzędu tysięcznych, czasem setnych sekundy, a więc całkowicie zlewał się z szumem i był niezależny od parametru, jaki wstawiałem. Myślałem, że sytuację popraw wykorzystanie zmiennych zapisywanych, nie na 8 bajtach, tylko na 16. Okazało się, że pętle po zmiennych typu `uint128_t` z biblioteki `boost/multiprecision/cpp_int.hpp` również są pomijane. Dopiero po użyciu zmiennych zapisywanych na 32 bajtach kompilator nie radził sobie z wycięciem pustej pętli z kodu programu. Jednak taki test był dla `c++` dość nieuczciwy, bo żaden inny język nie dochodził nigdy do takich zakresów. Architektura procesora w moim laptopie (x86\_64) świetnie nadaje się do liczb 8 bajtowych - 64bitowych. Używanie liczb 256 bitowych nawet przy najwyższym stopniu optymalizacji kompilacji nie dawało tak dobrych efektów jak `-O1` dla liczby 64 bitowej (unsigned long long int).

Dla porównania wyników jakie dała flaga `-O1` oraz jej brak załączam wykres

[![cpp_optimization.png](https://s23.postimg.org/r4ewreeyj/cpp_optimization.png)](https://postimg.org/image/i9e2gvq5z/)

Oraz tabelę

|language and parametes|one loop time \[s\]|loop time error \[s\]|launch time \[s\]|launch time error \[s\]|
|---|---|---|---|---|
|c++ -O1 optimization|3.50722\*10^(-10)|1.43966\*10^(-12)|1.38984\*10^(-3)|5.808\*10^(-6)|
|c++ no optimization|2.54525\*10^(-9)|9.24271\*10^(-12)|1.30566\*10^(-3)|2.83328\*10^(-6)|

#### Fortran

Tutaj też flaga optymalizująca znacznie wpływa na wyniki. Podobnie jak wcześniej, najlepiej oddaje się szybkość pustych pętli dzięki fladze `-O1`.

[![f_optimization.png](https://s29.postimg.org/dg6zyhszb/f_optimization.png)](https://postimg.org/image/q7l6502r7/)

|language|one loop time \[s\]|loop time error \[s\]|launch time \[s\]|launch time error \[s\]|
|---|---|---|---|---|
|f -O1 optimization|3.50474\*10^(-10)|1.0804\*10^(-12)|1.72753\*10^(-3)|5.05088\*10^(-6)|
|f no optimization|3.07201\*10^(-9)|1.12286\*10^(-11)|1.63708\*10^(-3)|3.55385\*10^(-6)|

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

Żeby dać tym metodom równe szanse włączyłem pętle w języku `bash`, które średnio trwały około 4.19 sekundy. Jest to wystarczająco długo, aby ograniczenie liczby cyfr wyników nie stało się kluczowe i wystarczająco krótko, żeby można było powtórzyć pomiar wiele razy. Wyniki zestawiłem na poniższym histogramie:

[![pairedHistogramTiming.png](https://s27.postimg.org/pev7oo7zn/paired_Histogram_Timing.png)](https://postimg.org/image/wuuhagvov/)

oraz w tabeli

|method|time \[s\]|standard dev \[s\]|
|---|---|---|
|uti/timing.sh|4.200|0.117|
|/usr/bin/time -f "%e"|4.178|0.119|

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

Następny test określa stosunek czasów dla programu zakładającego wykonywanie w 2 sekundy do 1 sekundy. Gdyby środowisko było idealne, to ten stosunek powinien wynosić dwa. jednak ponieważ na `gitlabie` moc obliczeniowa przydzielana runnerom jest dość niestabilna, pozwalamy na dużą granicę błędu pomiarowego.

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

Na sam koniec opiszę proces ciągłej integracji, który wdrożyłem w tym projekcie. Ciągła integracja jest to wykonywanie instalacji i testów automatycznych przy każdym `pushu` na serwer z repozytorium. Możemy do tego wykorzystywać różne narzędzia. Ja zdecydowałem się na [`gitlab-ci`](https://about.gitlab.com/gitlab-ci/).

Składnia pliku z instrukcjami dla runnera jest podobna do tej z [travisa](https://docs.travis-ci.com/). Zaczyna się od wybrania obrazu dystrybucji na której uruchamiany testy:

```yml
## Select image from https://hub.docker.com/_/php/
image: ubuntu:16.10
```

Następnie podpinamy serwisy, które mogły by być instalowane ręcznie, ale dla uproszczenia przygotowano je w formie gotowych do wpięcia komponentów:

```yml
services:
- mysql:8
- php:7
```

Definiujemy zmienne wykorzystywane do łączenia z bazą danych:

```yml
variables:
  # Configure mysql service (https://hub.docker.com/_/mysql/)
  MYSQL_DATABASE: inc
  MYSQL_ROOT_PASSWORD: pass
```

Określamy zestaw instrukcji do wykonania przed testami:

```yml
before_script:
- bash install.sh
- perl util/parameters_load.pl
- export MYSQL_PWD=$MYSQL_ROOT_PASSWORD;
- export MYSQL_HOST="mysql";
- echo "SELECT 'OK';" | mysql --user=root "$MYSQL_DATABASE"

# local variables
#  https://dev.mysql.com/doc/refman/5.7/en/environment-variables.html
```

W ich skład wchodzi instalacja naszych zależności, ładowanie parametrów, eksportowanie zmiennych środowiskowych do łączenia z bazą i prosty test na połączenie.

Główna część, czyli testowanie zawarte jest w poniższym fragmencie kodu;

```yml
test:
  image: mysql
  image: php
  script:
  - bash test.sh
```

Żeby przetestować kod lokalnie wykonujemy komendę:

```bash
sudo gitlab-ci-multi-runner exec docker test
```

To już wszystko. Mam nadzieję, że ten artykuł uświadomił Ci, że wybór języka może mieć ogromne znaczenie dla wydajności oraz przybliżył Ci historię kilku z nich. Jednak najważniejsze, że ten kod został przygotowany tak, aby łatwo było go rozszerzyć o pomiary dotyczące zadań jak na przykład zapis do pliku, albo wykonywanie całkowania numerycznego. Jeśli będziesz zainteresowany rozwijaniem tego softu daj znać, mam parę koncepcji, w którą stronę można by rozwinąć ten projekt.
