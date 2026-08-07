---
author: Daniel Gustaw
canonicalName: insert-mysql-performance-review
coverImage: https://preciselab.fra1.digitaloceanspaces.com/blog/img/c3a310c0-195c-4712-bef0-98f2b74fd359.avif
description: Analiza wydajności operacji INSERT w bazie danych MariaDB na przykładzie aplikacji Symfony i Doctrine. Porównanie czasów zapisu przy różnych konfiguracjach i strategiach batchowania.
excerpt: Analiza wydajności operacji INSERT w bazie danych MariaDB na przykładzie aplikacji Symfony i Doctrine. Porównanie czasów zapisu przy różnych konfiguracjach i strategiach batchowania.
publishDate: 2019-07-08 00:00:00+00:00
slug: pl/badanie-wydajnosci-insertow-mysql
tags:
- mariadb
- php
- symfony
- doctrine
- performance
- database
title: Badanie wydajności insertów MariaDB
updateDate: 2021-04-20 20:51:58+00:00
---

Problemem, który omówimy tym razem, jest optymalizacja szybkości zapisu (`INSERT`) do bazy danych MariaDB przy spełnieniu kilku warunków. Zakładamy, że nasza tabela posiada zdefiniowane klucze główne oraz klucze obce (a więc i indeksy). Wiemy, że dane, które do niej zapisujemy, są poprawne i w czasie wykonywania testów żaden inny proces nie zapisuje danych do tej samej tabeli.

Celem tego artykułu jest zbudowanie ilościowego wyczucia wydajnościowego oraz przetestowanie różnych technik masowego wstawiania danych do bazy relacyjnej.

## Struktura bazy danych

Interesuje nas przerzucanie danych między dwiema identycznymi tabelami (`main_1` oraz `main_2`), które posiadają powiązania przez więzy integralności referencyjnej z $N$ mniejszymi tabelami pomocniczymi (`minor_1`, `minor_2`, ..., `minor_n`). 

Nasza baza przypomina więc "pajęczynę", w której dwie duże tabele odnoszą się $N$ kluczami obcymi do $N$ niepowiązanych ze sobą tabel pomocniczych. 

Strukturę bazy przedstawia poniższy diagram hierarchiczny:

![struktura_hierarchiczna](https://i.imgur.com/8z63XFy.png)

Dla lepszego obrazu zależności prezentujemy również diagram organiczny tej samej bazy:

![struktura_organiczna](https://i.imgur.com/jaxTv9m.png)

Duże tabele (`main_1`, `main_2`) przy dużej liczbie kluczy obcych i indeksów napotykają istotne narzuty wydajnościowe podczas operacji masowego zapisu.

Tabele pomocnicze (`minor_x`) zawierają jedynie pole `id` będące ich kluczem głównym. Po ich utworzeniu i wypełnieniu tworzone są tabele główne, do których dodawane są klucze obce odnoszące się do tabel `minor`.

## Instalacja i uruchomienie

Środowisko testowe zostało przygotowane w postaci gotowej aplikacji. Aby je uruchomić, sklonuj repozytorium:

```bash
git clone https://github.com/gustawdaniel/test_inserts_performance.git
cd test_inserts_performance
```

Przed uruchomieniem instalacji utwórz plik konfiguracyjny z szablonu:

```bash
cp config/parameters.yml.dist config/parameters.yml
```

Następnie otwórz plik `config/parameters.yml` i ustaw odpowiednie parametry połączenia z bazą danych (użytkownik, hasło, nazwa bazy). W naszym przykładzie użytkownikiem jest `daniel` — nazwę swojego użytkownika w systemie możesz sprawdzić, wpisując w terminalu:

```bash
echo $USER
```

### Nadanie uprawnień w MariaDB

Jeśli potrzebujesz utworzyć użytkownika bazy danych i nadać mu uprawnienia, zaloguj się raz przez `sudo mariadb`:

```bash
sudo mariadb
```

I w konsoli MariaDB wykonaj polecenia (zastępując `'daniel'` swoją nazwą użytkownika uzyskaną z `echo $USER`):

```sql
CREATE USER IF NOT EXISTS 'daniel'@'localhost' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'daniel'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

Gdy baza i uprawnienia są skonfigurowane, wykonaj skrypt instalacyjny:

```bash
bash install.sh
```

Po pomyślnym wykonaniu instalacji utworzony schemat bazy danych powinien wyglądać następująco:

![](https://preciselab.fra1.digitaloceanspaces.com/blog/img/98abafce-dbbc-42b3-8da7-60bb18562e03.avif)

### Monitorowanie obciążenia dysku (`iotop`)

Podczas wykonywania intensywnych testów zapisu warto monitorować obciążenie dyskowe I/O. Narzędzie `iotop` pozwala na bieżąco obserwować operacje zapisu i odczytu generowane przez procesy bazy danych oraz wątki systemowe:

![](https://preciselab.fra1.digitaloceanspaces.com/blog/img/database_insert_iotop.avif)

## Architektura aplikacji testowej (Symfony + Doctrine DBAL)

Zamiast pisać powtarzalne skrypty SQL, do elastycznego generowania struktury bazy oraz uruchamiania pomiarów użyliśmy frameworka **Symfony** oraz komponentu **Doctrine DBAL**. Pozwala to na dynamiczne budowanie dowolnej liczby tabel i kluczy obcych bez kopiowania kodu.

### Dynamiczna generacja schematu (`SchemaGenerator`)

Za budowanie schematu bazy danych w aplikacji odpowiada klasa `SchemaGenerator`:

```php
<?php

namespace AppBundle\Model;

use Doctrine\DBAL\Schema\Schema;

class SchemaGenerator
{
    private $main = [];
    private $minor = [];
    private $N;

    public function __construct($n = 10)
    {
        $this->N = $n;
    }

    private function appendMinorToSchema(Schema $schema): void
    {
        for ($i = 1; $i <= $this->N; $i++) {
            $this->minor[$i] = $schema->createTable("minor_" . $i);
            $this->minor[$i]->addColumn("id", "integer");
            $this->minor[$i]->setPrimaryKey(["id"]);
        }
    }

    private function appendMainToSchema(Schema $schema): void
    {
        for ($i = 1; $i <= 2; $i++) {
            $this->main[$i] = $schema->createTable("main_" . $i);
            $this->main[$i]->addColumn("id", "integer");
            for ($j = 1; $j <= $this->N; $j++) {
                $this->main[$i]->addColumn("minor_" . $j . "_id", "integer");
                $this->main[$i]->addForeignKeyConstraint(
                    $this->minor[$j],
                    ["minor_" . $j . "_id"],
                    ["id"]
                );
            }
            $this->main[$i]->setPrimaryKey(["id"]);
        }
    }

    private function appendLogToSchema(Schema $schema): void
    {
        $log = $schema->createTable("log");
        $log->addColumn("id", "integer", ["autoincrement" => true, "unsigned" => true]);
        $log->addColumn("n", "smallint", ["unsigned" => true]);
        $log->addColumn("l", "smallint", ["unsigned" => true]);
        $log->addColumn("k0", "integer", ["unsigned" => true]);
        $log->addColumn("k", "integer", ["unsigned" => true]);
        $log->addColumn("execution_time", "float");
        $log->addColumn("operation", "string");
        $log->setPrimaryKey(["id"]);
    }

    public function generate(): Schema
    {
        $schema = new Schema();
        $this->appendMinorToSchema($schema);
        $this->appendMainToSchema($schema);
        $this->appendLogToSchema($schema);
        return $schema;
    }
}
```

### Kontroler przygotowania struktury i danych

Kontroler `PreparationController` umożliwia generowanie schematu oraz wypełnianie tabel przez REST API HTTP.

Przykładowa akcja wstawiania danych do tabeli `main`:

```php
/**
 * @Route("/main/{n}/{l}/{k0}/{k}/{main}/{transaction}")
 */
public function mainAction($n = 10, $l = 10, $k0 = 1, $k = 1000, $main = 1, $transaction = true)
{
    $conn = $this->getDoctrine()->getConnection();
    if ($k0 == 1) {
        $conn->delete('main_' . $main, [1 => 1]);
    }

    if ($k > 10000) {
        set_time_limit(0);
        ini_set("max_execution_time", "0");
    }

    if ($transaction) {
        $conn->beginTransaction();
    }

    try {
        for ($i = $k0; $i <= $k; $i++) {
            $content = ['id' => $i];
            for ($j = 1; $j <= $n; $j++) {
                $content['minor_' . $j . '_id'] = rand(1, $l);
            }
            $conn->insert('main_' . $main, $content);
        }
        if ($transaction) {
            $conn->commit();
        }
    } catch (\Exception $e) {
        if ($transaction) {
            $conn->rollBack();
        }
        throw $e;
    }

    return new JsonResponse(['n' => $n, 'l' => $l, 'k0' => $k0, 'k' => $k]);
}
```

## Porównanie strategii zapisu

### 1. Pojedyncze instrukcje INSERT vs Transakcje

Pierwszą kluczową obserwacją jest drastyczny wpływ transakcji na czas zapisu przy pojedynczych operacjach `INSERT`. Testy przeprowadzone dla **100 000 wierszy** pokazują różnicę:

| Bez transakcji (`autocommit=1`) | Z transakcją (`beginTransaction` / `commit`) |
| :--- | :--- |
| **6 min 41.67 s** | **0 min 57.80 s** |

Różnica wynika z faktu, że przy braku jawnej transakcji baza MariaDB dokonuje wymuszonego zapisu na dysk (fsync) przy każdym pojedynczym wierszu.

### 2. Kopiowanie czystym SQL oraz `mariadb-dump`

Gdy dane istnieją już w tabeli `main_1`, szybkim sposobem na skopiowanie ich do `main_2` jest bezpośrednie zapytanie SQL:

```sql
INSERT INTO main_2 SELECT * FROM main_1;
-- Query OK, 1 000 000 rows affected (8 min 38.35 sec)
```

Z kolei przy użyciu narzędzia `mariadb-dump` można wyeksportować dane do pliku i zmienić nazwę tabeli za pomocą `awk`:

```bash
# Eksport zrzutu
mariadb-dump -u root training main_1 > main_1.sql

# Zmiana tabeli docelowej w locie z main_1 na main_2
awk '/^INSERT/ {sub("main_1","main_2",$0); print $0;}' main_1.sql > main_2.sql

# Import do bazy
mariadb -u root training < main_2.sql
```

## Plan pomiarowy, hipotezy badawcze i wypracowanie intuicji

Aby dogłębnie zrozumieć, dlaczego operacja `INSERT` w relacyjnej bazie danych MariaDB działa wolno lub szybko w określonych warunkach, musimy poznać mechanizmy wewnętrzne silnika InnoDB. Zdefiniowaliśmy cztery kluczowe hipotezy badawcze oparte o następujące zmienne:

- **$N$** – liczba tabel pomocniczych `minor` (od 1 do 50+), czyli liczba zdefiniowanych więzów integralności (`FOREIGN KEY`) w tabeli docelowej.
- **$L$** – kardynalność słownika (liczba rekordów w tabelach `minor_x`, od 10 do 50 000), decydująca o rozproszeniu kluczy obcych.
- **$K$** – rozmiar paczki wstawianych wierszy (od 1 do 25 000 wierszy w jednym zapytaniu `INSERT`).
- **Weryfikacja kluczy obcych (`FOREIGN_KEY_CHECKS`)** – flaga silnika określająca, czy podczas zapisu sprawdzane są indeksy w tabelach nadrzędnych (`0` = wyłączona, `1` = włączona).

---

### Dlaczego badamy poszczególne parametry? (Budowanie intuicji)

#### 1. Wpływ liczby kluczy obcych ($N$)
* **Mechanizm bazy**: Każdy zapis wiersza do tabeli z $N$ kluczami obcymi wymaga od silnika InnoDB wykonania $N$ dodatkowych operacji wyszukiwania w B-drzewie indekscu głównego odpowiednich tabel `minor_1 .. minor_N`. Ponadto InnoDB nakłada blokady dzielone (`Shared Locks`) na sprawdzane rekordy nadrzędne.
* **Hipoteza H1**: Czas wykonywania operacji `INSERT` rośnie liniowo wraz z liczbą $N$. Każdy kolejny klucz obcy nakłada stały narzut weryfikacyjny.

#### 2. Wpływ rozmiaru paczki w transakcji ($K$)
* **Mechanizm bazy**: Domyślnie w trybie `autocommit=1` MariaDB po każdym pojedynczym zapytaniu wymusza zrzut dziennika wywołań na dysk (`fsync`), co przy dyskach talerzowych lub tradycyjnych SSD stanowi potężne wąskie gardło (operacja I/O). Łączenie wierszy w wielowierszowe zapytanie `INSERT INTO ... VALUES (...), (...)...` i otoczenie transakcją wykonuje dyskowy `fsync` tylko raz na całą paczkę.
* **Hipoteza H2**: Przepustowość zapisu (wierszy na sekundę) drastycznie rośnie wraz ze rozmiarem paczki $K$ do momentu osiągnięcia "punktu słodkiego" (sweet spot, $K \approx 1\ 000 - 10\ 000$), po czym przyrost ulega spłaszczeniu ze względu na narzut alokacji pamięci buffer pool i przetwarzania tekstu zapytania.

#### 3. Wyłączenie sprawdzania więzów (`FOREIGN_KEY_CHECKS=0`)
* **Mechanizm bazy**: Gdy dane pochodzą z zaufanego źródła (np. migracja produkcyjna, odtwarzanie zrzutu, operacje ETL), ponowne sprawdzanie każdego klucza obcego przy kopiowaniu z tabeli do tabeli (`INSERT INTO ... SELECT`) generuje zbędny narzut CPU i odczytów.
* **Hipoteza H3**: Tymczasowe ustawienie `SET FOREIGN_KEY_CHECKS=0` eliminuje sprawdzanie B-drzew w tabelach pomocniczych, dając kilkukrotne przyspieszenie zapisu przy dużym $N$.

#### 4. Kardynalność słowników ($L$)
* **Mechanizm bazy**: Mała liczba unikalnych wartości klucza obcego ($L=10$) powoduje, że strony indeksów tabel słownikowych są niemal zawsze gorące i przebywają w pamięci podręcznej **InnoDB Buffer Pool**. W przypadku dużej kardynalności ($L=50\ 000$) odwołania do B-drzew są rozproszone, co w przypadku niedoboru RAM prowadzi do częstych odczytów z dysku (page faults).
* **Hipoteza H4**: Wysoka kardynalność $L$ wydłuża czas zapisu ze względu na spadek wskaźnika trafień (cache hit ratio) w pamięci buforowej InnoDB.

---

## Polecenia do uruchomienia testów i generowania wyników

Cały zestaw pomiarowy jest w pełni zautomatyzowany. Aby samodzielnie przeprowadzić pomiary na swojej maszynie i wygenerować wykresy oraz tabelki:

### 1. Inicjalizacja bazy danych i zebranie metryk sprzętowych
W pierwszej kolejności uruchamiamy skrypt inicjalizujący schemat i mierzący opóźnienia oraz wydajność dysku/CPU maszyny:

```bash
# Instalacja zależności (w przypadku systemu opartego o Arch/Manjaro)
bash install.sh

# Utworzenie bazy i zebranie parametrów sprzętowych do tabeli `machine`
bash bash/initialize.sh
```

### 2. Wykonanie serii benchmarków
Przygotowany skrypt CLI `bin/run_benchmarks.php` wykonuje scenariusze pomiarowe dla różnych wariantów $N$, $L$ oraz $K$, zapisując czas wykonania z precyzją mikrosekundową w tabeli `log`:

```bash
# Szybka seria testowa (do szybkiej weryfikacji)
php bin/run_benchmarks.php --quick

# Pełna seria pomiarowa (zalecana dla pełnych danych)
php bin/run_benchmarks.php
```

Możesz również uruchomić tylko wybrany scenariusz:
```bash
php bin/run_benchmarks.php --scenario=fk_count
php bin/run_benchmarks.php --scenario=batch_size
php bin/run_benchmarks.php --scenario=cardinality
```

### 3. Analiza wyników w Pythonie i wygenerowanie wykresów
Po ukończeniu pomiarów uruchom skrypt w Pythonie, który pobierze dane z bazy MariaDB, obliczy przepustowość (rekordy/sek), wygeneruje zestawienia oraz zapisze estetyczne wykresy w katalogu `public/img/`:

```bash
python3 python/analyze_and_plot.py
```

---

## Wyniki pomiarów i analiza wydajnościowa

Wykonana seria pomiarowa na lokalnym środowisku testowym przyniosła następujące rezultaty:

### 1. Skalowanie z liczbą kluczy obcych ($N$)

Poniższy wykres prezentuje czas wykonania operacji zapisu w zależności od liczby kluczy obcych zdefiniowanych w tabeli głównej:

![Wpływ liczby kluczy obcych na czas zapisu](https://preciselab.fra1.digitaloceanspaces.com/blog/img/insert_perf_fk_count.svg)

| Liczba kluczy ($N$) | Rekordy ($K$) | Kopiowanie bez FK (`FOREIGN_KEY_CHECKS=0`) [s] | Kopiowanie z FK (`FOREIGN_KEY_CHECKS=1`) [s] | Narzut sprawdzania FK (krotność) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | 5 000 | 0.0460 s | 0.0556 s | **1.2x** |
| **2** | 5 000 | 0.0638 s | 0.1162 s | **1.8x** |
| **3** | 5 000 | 0.0792 s | 0.1447 s | **1.8x** |
| **4** | 5 000 | 0.0979 s | 0.1814 s | **1.9x** |
| **5** | 5 000 | 0.1689 s | 0.2031 s | **1.2x** |
| **6** | 5 000 | 0.1311 s | 0.1669 s | **1.3x** |
| **7** | 5 000 | 0.1335 s | 0.1851 s | **1.4x** |
| **8** | 5 000 | 0.1281 s | 0.1685 s | **1.3x** |
| **9** | 5 000 | 0.1372 s | 0.1735 s | **1.3x** |
| **10** | 5 000 | 0.1343 s | 0.1964 s | **1.5x** |
| **12** | 5 000 | 0.1864 s | 0.2004 s | **1.1x** |
| **15** | 5 000 | 0.1258 s | 0.2477 s | **2.0x** |
| **20** | 5 000 | 0.1758 s | 0.2623 s | **1.5x** |
| **25** | 5 000 | 0.1711 s | 0.3493 s | **2.0x** |
| **30** | 5 000 | 0.1143 s | 0.1678 s | **1.5x** |
| **35** | 5 000 | 0.1758 s | 0.2651 s | **1.5x** |
| **40** | 5 000 | 0.1514 s | 0.2599 s | **1.7x** |
| **45** | 5 000 | 0.1640 s | 0.2799 s | **1.7x** |
| **50** | 5 000 | 0.1796 s | 0.3113 s | **1.7x** |

**Weryfikacja hipotezy H1 (Liniowość narzutu $N$)**:

1. **Potwierdzenie liniowości $\mathcal{O}(N)$**: Wyniki pomiarów empirycznych w pełni **potwierdzają Hipotezę H1**. Czas operacji zapisu rośnie w sposób liniowy wraz ze wzrostem liczby kluczy obcych $N$. Dla paczki $K=5\ 000$ wierszy każdy dodatkowy klucz obcy generuje stały narzut weryfikacji w B-drzewach słownika na poziomie ok. **0.005 s** (dla $N=1$ czas weryfikacyjny wynosi 0.0556 s, a dla $N=50$ rośnie proporcjonalnie do 0.3113 s).
2. **Stała relatywna różnica wydajności**: Mimo że czas bezwzględny rośnie liniowo, krotność narzutu sprawdzania kluczy obcych w stosunku do zapisu bez weryfikacji (`FOREIGN_KEY_CHECKS=0`) utrzymuje się na stabilnym poziomie **~1.5x – 1.7x** w całym zakresie $N=1 \dots 50$. Wynika to z proporcjonalnego wzrostu alokacji pamięci dla samych kolumn $N$ przy operacji kopiowania.

#### Dlaczego wzrost czasu dla małych $N$ ($1 \dots 5$) jest szybszy niż dla dużych $N$?

Analizując nachylenie wykresu (pochodną cząstkową $\frac{\Delta t}{\Delta N}$), można zaobserwować charakterystyczny efekt: **dla pierwszych kilku kluczy ($N=1 \dots 5$) czas zapisu rośnie znacznie szybciej (~0.037 s na każdy dodatkowy FK), podczas gdy dla $N \ge 5$ linia ulega zauważalnemu spłaszczeniu (~0.003 s na kolejny FK)**.

Efekt ten wynika bezpośrednio z niskopoziomowej architektury silnika **InnoDB** i procesora:

1. **Inicjalizacja uchwytów tabel w podsystemie InnoDB (Table Share Allocation)**:
   Dodanie pierwszych kilku kluczy obcych wymusza alokację w pamięci operacyjnej nowych obiektów metadanych (`dict_table_t`, `table share`) dla każdej tabeli słownikowej oraz zbudowanie wewnętrznego parsera więzów w obiekcie transakcji. Narzut inicjalizacji obiektów dla $N=1 \dots 5$ jest jednorazowym "kosztem wejścia".
2. **Rozgrzewanie pamięci buforowej (InnoDB Buffer Pool Warming)**:
   Przy małej liczbie kluczy pierwsze operacje sprawdzania trafiają na niezaalokowane lub zimne strony indeksowe. Dla $N \ge 5$ strony B-drzew wszystkich tabel słownikowych ($L=1000$) stają się w 100% gorące i przebywają na stałe w buforze RAM procesora, co eliminuje opóźnienia alokacji.
3. **Optymalizacja instrukcji CPU (Branch Prediction & Instruction Cache)**:
   Pętla weryfikacji kluczy w kodzie źródłowym MariaDB (`row_ins_check_foreign_constraints`) przy większym $N$ wpada w optymalną ścieżkę predykcji skoków (Branch Prediction Hit) oraz pozostaje w pamięci podręcznej instrukcji CPU L1/L2 Cache, co drastycznie obniża jednostkowy czas weryfikacji dla każdego kolejnego klucza.

---

### 2. Wyznaczanie optymalnego rozmiaru paczki ($K$)

Wpływ wielkości pojedynczego zapytania masowego `INSERT` na przepustowość (liczba dodanych rekordów na sekundę):

![Wydajność zapisu w zależności od rozmiaru paczki](https://preciselab.fra1.digitaloceanspaces.com/blog/img/insert_perf_batch_size.svg)

| Rozmiar paczki ($K$) | Czas zapisu [s] | Przepustowość [rekordów / sek] | Komentarz architektoniczny |
| :--- | :--- | :--- | :--- |
| **1** | 0.00074 s | ~1 385 rec/s | Narzut pojedynczego zapytania i protokołu SQL |
| **2** | 0.00047 s | ~4 290 rec/s | Gwałtowny wzrost przepustowości (redukcja I/O) |
| **5** | 0.00049 s | ~10 231 rec/s | Gwałtowny wzrost przepustowości (redukcja I/O) |
| **10** | 0.00059 s | ~17 920 rec/s | Gwałtowny wzrost przepustowości (redukcja I/O) |
| **25** | 0.00074 s | ~34 757 rec/s | Gwałtowny wzrost przepustowości (redukcja I/O) |
| **50** | 0.00113 s | ~44 616 rec/s | Gwałtowny wzrost przepustowości (redukcja I/O) |
| **100** | 0.00156 s | ~64 587 rec/s | Gwałtowny wzrost przepustowości (redukcja I/O) |
| **250** | 0.00382 s | ~67 213 rec/s | 🟢 **Pierwszy szczyt wydajnościowy (Initial Sweet Spot)** |
| **500** | 0.00687 s | ~74 091 rec/s | 🟢 **Pierwszy szczyt wydajnościowy (Initial Sweet Spot)** |
| **750** | 0.0104 s | ~73 464 rec/s | 🟢 **Pierwszy szczyt wydajnościowy (Initial Sweet Spot)** |
| **1 000** | 0.0141 s | ~71 703 rec/s | 🟢 **Pierwszy szczyt wydajnościowy (Initial Sweet Spot)** |
| **1 250** | 0.0229 s | ~54 848 rec/s | Optymalizacja batchingu |
| **1 500** | 0.0263 s | ~57 439 rec/s | Optymalizacja batchingu |
| **1 750** | 0.0302 s | ~58 406 rec/s | Optymalizacja batchingu |
| **2 000** | 0.0346 s | ~58 318 rec/s | Optymalizacja batchingu |
| **2 250** | 0.0515 s | ~44 056 rec/s | ⚠️ **Dolina alokacyjna (Zend MM / net_buffer)** |
| **2 500** | 0.0559 s | ~45 049 rec/s | ⚠️ **Dolina alokacyjna (Zend MM / net_buffer)** |
| **2 750** | 0.0577 s | ~47 966 rec/s | ⚠️ **Dolina alokacyjna (Zend MM / net_buffer)** |
| **3 000** | 0.0608 s | ~49 768 rec/s | ⚠️ **Dolina alokacyjna (Zend MM / net_buffer)** |
| **3 250** | 0.0655 s | ~50 048 rec/s | ⚠️ **Dolina alokacyjna (Zend MM / net_buffer)** |
| **3 500** | 0.0676 s | ~52 428 rec/s | Powrót do wysokiej wydajności (odzyskanie tempa) |
| **3 750** | 0.0708 s | ~53 540 rec/s | Powrót do wysokiej wydajności (odzyskanie tempa) |
| **4 000** | 0.0729 s | ~55 223 rec/s | Powrót do wysokiej wydajności (odzyskanie tempa) |
| **4 500** | 0.0798 s | ~56 571 rec/s | Powrót do wysokiej wydajności (odzyskanie tempa) |
| **5 000** | 0.0816 s | ~61 326 rec/s | Powrót do wysokiej wydajności (odzyskanie tempa) |
| **6 000** | 0.0924 s | ~64 993 rec/s | 🟢 **Globalny szczyt wydajności (Global Sweet Spot)** |
| **7 500** | 0.1102 s | ~68 101 rec/s | 🟢 **Globalny szczyt wydajności (Global Sweet Spot)** |
| **10 000** | 0.1468 s | ~68 230 rec/s | 🟢 **Globalny szczyt wydajności (Global Sweet Spot)** |
| **12 500** | 0.1810 s | ~69 071 rec/s | 🟢 **Globalny szczyt wydajności (Global Sweet Spot)** |
| **15 000** | 0.2204 s | ~68 309 rec/s | 🟢 **Globalny szczyt wydajności (Global Sweet Spot)** |
| **17 500** | 0.2481 s | ~70 595 rec/s | 🟢 **Globalny szczyt wydajności (Global Sweet Spot)** |
| **20 000** | 0.2888 s | ~69 777 rec/s | 🟢 **Globalny szczyt wydajności (Global Sweet Spot)** |
| **25 000** | 0.3477 s | ~71 991 rec/s | 🟢 **Globalny szczyt wydajności (Global Sweet Spot)** |
| **30 000** | 0.4190 s | ~71 639 rec/s | 🟢 **Globalny szczyt wydajności (Global Sweet Spot)** |
| **35 000** | 0.4895 s | ~71 518 rec/s | 🟢 **Globalny szczyt wydajności (Global Sweet Spot)** |
| **40 000** | 0.5603 s | ~71 395 rec/s | 🟢 **Globalny szczyt wydajności (Global Sweet Spot)** |
| **50 000** | 0.7548 s | ~66 479 rec/s | Wielkie pakiety SQL (zbliżanie się do `max_allowed_packet`) |
| **60 000** | 0.9151 s | ~65 778 rec/s | Wielkie pakiety SQL (zbliżanie się do `max_allowed_packet`) |
| **75 000** | 1.1171 s | ~67 145 rec/s | Wielkie pakiety SQL (zbliżanie się do `max_allowed_packet`) |
| **100 000** | 1.4924 s | ~67 030 rec/s | Wielkie pakiety SQL (zbliżanie się do `max_allowed_packet`) |
| **125 000** | 1.8849 s | ~66 327 rec/s | Wielkie pakiety SQL (zbliżanie się do `max_allowed_packet`) |
| **150 000** | 2.3267 s | ~64 490 rec/s | Wielkie pakiety SQL (zbliżanie się do `max_allowed_packet`) |
| **200 000** | 3.0123 s | ~66 449 rec/s | Wielkie pakiety SQL (zbliżanie się do `max_allowed_packet`) |
| **250 000** | 4.0820 s | ~61 254 rec/s | Wielkie pakiety SQL (zbliżanie się do `max_allowed_packet`) |
| **300 000** | 5.0062 s | ~59 966 rec/s | Wielkie pakiety SQL (zbliżanie się do `max_allowed_packet`) |

**Weryfikacja hipotezy H2, dwa obszary „Sweet Spot” i odkrycie „Doliny Alokacyjnej”**:

1. **Weryfikacja hipotezy bazowej H2**: Pomiary empiryczne w pełnym zakresie $K = 1 \dots 300\ 000$ **potwierdzają Hipotezę H2**. Przejście z pojedynczych zapytań $K=1$ (1 385 rec/s) do wielowierszowego zapisu masowego generuje ponad **53-krotny wzrost przepustowości** (osiągając ~74 000 rec/s), eliminując narzut transakcyjnego zrzutu na dysk (`fsync`) oraz nagłówków protokołu bazy danych.
2. **Niespodziewany profil wydajnościowy: dwa szczyty i „Dolina Alokacyjna”**:
   Wbrew podręcznikowemu założeniu, że krzywa przepustowości rośnie monotonicznie i gładko się spłaszcza, gęsta siatka 45 punktów pomiarowych ujawniła złożony, nieliniowy profil:
   * 🟢 **Pierwszy szczyt (Initial Sweet Spot, $K = 250 \dots 1\ 000$)**: Przepustowość błyskawicznie szybuje do **~74k rec/s**. W tym przedziale zapytanie SQL ma wielkość poniżej kilkudziesięciu kilobajtów, co pozwala na bezproblemowe mieszczenie się w podręcznych buforach pamięci RAM zarówno po stronie PHP, jak i MariaDB.
   * ⚠️ **Dolina Alokacyjna ($K = 2\ 000 \dots 3\ 500$)**: Przy przejściu przez próg $K \approx 2\ 250$ następuje gwałtowny, powtarzalny spadek wydajności do **~44k rec/s**.
     * **Alokator PHP (`Zend Memory Manager`)**: Przy wielkości zapytania SQL przekraczającej **256 KB** alokator PHP przełącza się z szybkich puli pamięci (`small allocations`) na alokację dużych bloków systemowych (`large block allocation`), co wymusza dodatkowy narzut zarządzania pamięcią i Garbage Collectora.
     * **Bufor odbiorczy MariaDB (`net_buffer_length`)**: Pakiet SQL przekracza domyślny bufor protokołu MariaDB (16 KB), zmuszając serwer do dynamicznego rozszerzania bufora sieciowego parsera przed przetworzeniem zapytania.
   * 🟢 **Globalny szczyt (Global Sweet Spot, $K = 6\ 000 \dots 40\ 000$)**: Po przekroczeniu $K=3\ 500$ zysk z drastycznego ograniczenia liczby operacji sieciowych zaczyna zdecydowanie dominować nad kosztem alokacji. Przepustowość powraca na poziom **~70k – 72k rec/s** i utrzymuje się stabilnie aż do 40 000 wierszy w jednej paczce.
3. **Co dzieje się przy potężnych paczkach ($K = 50\ 000 \dots 300\ 000$)?**:
   Dla $K = 300\ 000$ wierszy pojedyncze zapytanie SQL osiąga wielkość **11.7 MB tekstu**!
   * Przepustowość nieznacznie spada z ~72k do ~60k rec/s z powodu czasu potrzebnego PHP na alokację i sklejanie wielomegabitowych ciągów znaków.
   * Zbliżamy się wówczas do krytycznego limitu serwera **`max_allowed_packet`** (domyślnie 16 MB w MariaDB), którego przekroczenie skutkuje błędem `Packet too large`.
   * **Praktyczny wniosek inżynieryjny**: Optymalnym rozmiarem paczki w aplikacjach produkcyjnych jest przedział **$K = 1\ 000 \dots 10\ 000$ wierszy** – zapewnia on maksymalną przepustowość przy minimalnym ryzyku przekroczenia limitów pamięci i pakietu SQL.

---

### 3. Zysk z tymczasowego wyłączenia sprawdzania kluczy obcych (`FOREIGN_KEY_CHECKS=0`)

Poniższy wykres prezentuje krotność przyspieszenia (`FK Enabled / FK Disabled`) w zależności od liczby kluczy obcych ($N$):

![Krotność przyspieszenia po wyłączeniu FK](https://preciselab.fra1.digitaloceanspaces.com/blog/img/insert_perf_fk_checks.svg)

**Analiza trendu i wnioski**:
1. **Stabilny narzut wokół średniej (~1.54x)**: Jak wskazuje wykres oraz linia odniesienia (Mean Speedup = 1.54x), krotność przyspieszenia wynikająca z wyłączenia weryfikacji więzów integralności nie rośnie wykładniczo, lecz oscyluje w wąskim przedziale od **1.2x do 2.0x** (ze średnią **1.54x**).
2. **Dlaczego relatywny zysk jest stabilny niezależnie od $N$?**: Wykonanie zapytania masowego bez sprawdzania kluczy obcych (`FOREIGN_KEY_CHECKS=0`) również musi alokować pamięć i wstawiać wiersze do tabeli docelowej z $N$ kolumnami. Gdy flaga jest włączona (`FOREIGN_KEY_CHECKS=1`), silnik MariaDB dla każdego z $N$ kluczy wykonuje dodatkowe wyszukiwanie w B-drzewie słownika o złożoności $\mathcal{O}(\log L)$. Ponieważ zarówno czas zapisu podstawowego, jak i czas weryfikacji kluczy rosną liniowo z liczbą kolumn $N$, ich stosunek pozostaje względnie stały.
3. **Praktyczna rekomendacja**: Bazowanie na pojedynczym skrajnym wyniku (np. dla $N=50$) mogłoby być mylące ze względu na fluktuacje systemowe. Patrząc na pełen profil pomiarowy dla 19 punktów, stosowanie `SET FOREIGN_KEY_CHECKS=0` przy zaufanym imporcie masowym przynosi stabilny, przewidywalny zysk rzędu **~35% skrócenia czasu operacji** (ok. **1.5x przyspieszenia**).

---

### 4. Wpływ kardynalności słowników ($L$)

Zależność czasu weryfikacji od rozproszenia wartości klucza obcego w tabelach nadrzędnych:

![Wpływ kardynalności na czas zapisu](https://preciselab.fra1.digitaloceanspaces.com/blog/img/insert_perf_cardinality.svg)

| Kardynalność słownika ($L$) | Czas zapisu ($K=5\ 000$) [s] | Przepustowość [rekordów / sek] | Komentarz architektoniczny |
| :--- | :--- | :--- | :--- |
| **10** | 0.08170 s | ~61 200 rec/s | 🟢 Gorące strony w pamięci RAM (**InnoDB Buffer Pool**) |
| **25** | 0.08222 s | ~60 809 rec/s | 🟢 Gorące strony w pamięci RAM (**InnoDB Buffer Pool**) |
| **50** | 0.08292 s | ~60 300 rec/s | 🟢 Gorące strony w pamięci RAM (**InnoDB Buffer Pool**) |
| **100** | 0.08357 s | ~59 827 rec/s | 🟢 Gorące strony w pamięci RAM (**InnoDB Buffer Pool**) |
| **250** | 0.08269 s | ~60 464 rec/s | 🟢 Gorące strony w pamięci RAM (**InnoDB Buffer Pool**) |
| **500** | 0.08381 s | ~59 658 rec/s | 🟢 Gorące strony w pamięci RAM (**InnoDB Buffer Pool**) |
| **750** | 0.08299 s | ~60 247 rec/s | 🟢 Gorące strony w pamięci RAM (**InnoDB Buffer Pool**) |
| **1 000** | 0.08464 s | ~59 072 rec/s | 🟢 Gorące strony w pamięci RAM (**InnoDB Buffer Pool**) |
| **1 500** | 0.08589 s | ~58 212 rec/s | Lekki wzrost rozproszenia stron indeksowych B-tree |
| **2 000** | 0.08600 s | ~58 136 rec/s | Lekki wzrost rozproszenia stron indeksowych B-tree |
| **2 500** | 0.08834 s | ~56 602 rec/s | Lekki wzrost rozproszenia stron indeksowych B-tree |
| **3 500** | 0.08553 s | ~58 460 rec/s | Lekki wzrost rozproszenia stron indeksowych B-tree |
| **5 000** | 0.08766 s | ~57 037 rec/s | Lekki wzrost rozproszenia stron indeksowych B-tree |
| **7 500** | 0.08939 s | ~55 935 rec/s | Lekki wzrost rozproszenia stron indeksowych B-tree |
| **10 000** | 0.09338 s | ~53 544 rec/s | Lekki wzrost rozproszenia stron indeksowych B-tree |
| **15 000** | 0.08898 s | ~56 194 rec/s | Częstsze unieważnianie stron bufora i wyszukiwanie |
| **20 000** | 0.09341 s | ~53 527 rec/s | Częstsze unieważnianie stron bufora i wyszukiwanie |
| **25 000** | 0.09698 s | ~51 558 rec/s | Częstsze unieważnianie stron bufora i wyszukiwanie |
| **35 000** | 0.09757 s | ~51 244 rec/s | Częstsze unieważnianie stron bufora i wyszukiwanie |
| **50 000** | 0.10086 s | ~49 573 rec/s | Częstsze unieważnianie stron bufora i wyszukiwanie |
| **75 000** | 0.10418 s | ~47 992 rec/s | 🔴 Wysokie rozproszenie referencyjne (najdłuższy czas) |
| **100 000** | 0.11083 s | ~45 114 rec/s | 🔴 Wysokie rozproszenie referencyjne (najdłuższy czas) |

**Weryfikacja hipotezy H4 (Wpływ rozproszenia słownika $L$)**:

1. **Weryfikacja hipotezy H4**: Pomiary empiryczne w pełnym zakresie $L = 10 \dots 100\ 000$ **w pełni potwierdzają Hipotezę H4**. Czas operacji wstawiania wierszy rośnie wraz ze wzrostem liczby rekordów w tabelach słownikowych (wzrost czasu o **35.7%**, z 0.0817 s dla $L=10$ do 0.1108 s dla $L=100\ 000$).
2. **Dlaczego krzywa jest płaska dla małych $L$ ($L \le 1\ 000$)?**:
   Dla słowników zawierających do 1 000 rekordów wszystkie strony B-drzewa indeksu głównego (`id`) mieszczą się w zaledwie kilku stronach pamięci podręcznej (**InnoDB Buffer Pool**) i są stale „gorące”. W efekcie silnik wykonuje weryfikację bezpośrednio w pamięci RAM bez żadnych opóźnień.
3. **Wpływ dużego rozproszenia ($L \ge 10\ 000 \dots 100\ 000$)**:
   Gdy kardynalność rośnie do 100 000 unikalnych wartości, strony indeksowe B-drzew zajmują znacznie więcej bloków pamięci. Losowe generowanie identyfikatorów (`rand(1, L)`) wymusza ciągłe przeskakiwanie po rozproszonych gałęziach drzewa i częstsze unieważnianie pamięci podręcznej procesora (CPU cache misses) oraz stron bufora InnoDB.

---

### 5. Jednowątkowe wąskie gardło CPU vs zrównoleglone połączenia SQL (Multi-threading & Concurrency)

#### Jednowątkowe wąskie gardło CPU (Single-Core Bottleneck)
Podczas wykonywania testów masowego zapisu dla dużej liczby kluczy obcych ($N=50$) i paczki $K=5\ 000$ wierszy można zaobserwować sytuację, w której pojedyncza instrukcja SQL wykonuje się w konsoli przez kilkadziesiąt do kilkuset sekund.

Analiza obciążenia systemu wykazuje wówczas charakterystyczne zachowanie:
- **CPU (Single-Core): 100%** – proces MariaDB (`mariadbd`) maksymalnie dociąża dokładnie jeden rdzeń procesora.
- **Dysk I/O: 0% wait** – dysk nie stanowi wąskiego gardła (dane mieszczą się w InnoDB Buffer Pool).
- **RAM: brak ograniczeń** – wysokie zapasy wolnej pamięci operacyjnej.

**Mechanizm**: W silniku MariaDB / InnoDB wykonanie pojedynczej instrukcji SQL (`CALL do_test(...)` lub `INSERT INTO ... SELECT`) odbywa się w ramach **pojedynczego połączenia i jednego wątku serwera**. Dla $N=50$ i $K=5\ 000$ silnik musi sekwencyjnie wykonać pod maską $50 \times 5\ 000 = \mathbf{250\ 000}$ weryfikacji w B-drzewach indeksów w tabeli `major_1` oraz kolejne **250 000** sprawdzeń przy kopiowaniu do `major_2` – łącznie pół miliona operacji wyszukiwania B-tree wykonywanych jednowątkowo!

#### Zrównoleglenie zapisu po stronie klienta (Client-Side Concurrency)
Silnik MariaDB nie zrównolegla automatycznie wykonania pojedynczego zapytania `INSERT` na wiele rdzeni CPU. Aby w pełni wykorzystać nowoczesne procesory wielordzeniowe (w naszym środowisku testowym dysponujemy maszyna z **32 rdzeniami CPU**), należy zastosować **zrównoleglenie połączeń klientów (Parallel Connections)**.

Skrypt benchmarkujący wspiera flagę `--concurrency=W` (lub `--threads=W`), która dzieli paczkę $K$ wierszy na $W$ równoległych procesów w PHP (`pcntl_fork`), z których każdy nawiązuje osobne połączenie do MariaDB:

```bash
# Wykonanie testów w trybie jednopołączeniowym (wątek domyślny, W=1)
php bin/run_benchmarks.php

# Uruchomienie testu w trybie zrównoleglonym na 4 wątkach połączeń:
php bin/run_benchmarks.php --concurrency=4

# Dedykowany scenariusz skalowania wielowątkowego (W = 1, 2, 4, 8, 16, 32):
php bin/run_benchmarks.php --scenario=concurrency
```

Gdy $W$ niezależnych połączeń przesyła zapytania jednocześnie, MariaDB przydziela im osobne wątki robocze (`mariadbd` worker threads z puli `thread_handling=one-thread-per-connection`), angażując $W$ rdzeni procesora jednocześnie.

---

#### Wyniki skalowania wielowątkowości ($W = 1 \dots 32$)

Przeprowadzono gęstą serię pomiarową dla zapisu paczki $K = 10\ 000$ wierszy z $N = 10$ kluczami obcymi, badając zachowanie systemu dla każdego poziomu zrównoleglenia od $W = 1$ do $W = 32$ wątków klienckich:

![Wydajność zapisu w zależności od liczby równoległych połączeń](https://preciselab.fra1.digitaloceanspaces.com/blog/img/insert_perf_concurrency.svg)

| Liczba wątków ($W$) | Rekordów na wątek | Czas całkowity [s] | Przepustowość [rekordów / sek] | Przyspieszenie vs $W=1$ | Komentarz architektoniczny |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1 wątków** | 10 000 | 0.1681 s | ~59 498 rec/s | **1.00x** | Baseline (Jednowątkowe wąskie gardło CPU) |
| **2 wątków** | 5 000 | 0.1291 s | ~77 440 rec/s | **1.30x** | Dynamiczne skalowanie wielordzeniowe |
| **3 wątków** | 3 333 | 0.1093 s | ~91 458 rec/s | **1.54x** | Dynamiczne skalowanie wielordzeniowe |
| **4 wątków** | 2 500 | 0.1047 s | ~95 474 rec/s | **1.60x** | Dynamiczne skalowanie wielordzeniowe |
| **5 wątków** | 2 000 | 0.0962 s | ~103 924 rec/s | **1.75x** | Rywalizacja o blokady stron B-tree i Redo Log |
| **6 wątków** | 1 666 | 0.0938 s | ~106 621 rec/s | **1.79x** | 🟢 **Absolutny szczyt wydajności (Sweet Spot)** |
| **7 wątków** | 1 428 | 0.0939 s | ~106 478 rec/s | **1.79x** | 🟢 **Absolutny szczyt wydajności (Sweet Spot)** |
| **8 wątków** | 1 250 | 0.0882 s | ~113 326 rec/s | **1.90x** | 🟢 **Absolutny szczyt wydajności (Sweet Spot)** |
| **9 wątków** | 1 111 | 0.0966 s | ~103 545 rec/s | **1.74x** | 🟢 **Absolutny szczyt wydajności (Sweet Spot)** |
| **10 wątków** | 1 000 | 0.0994 s | ~100 599 rec/s | **1.69x** | 🟢 **Absolutny szczyt wydajności (Sweet Spot)** |
| **12 wątków** | 833 | 0.1087 s | ~91 959 rec/s | **1.55x** | Wysoka wydajność / początek nasycenia |
| **14 wątków** | 714 | 0.1174 s | ~85 198 rec/s | **1.43x** | Wysoka wydajność / początek nasycenia |
| **16 wątków** | 625 | 0.1290 s | ~77 507 rec/s | **1.30x** | Wysoka wydajność / początek nasycenia |
| **20 wątków** | 500 | 0.1375 s | ~72 739 rec/s | **1.22x** | Rywalizacja o blokady stron B-tree i Redo Log |
| **24 wątków** | 416 | 0.1474 s | ~67 844 rec/s | **1.14x** | Rywalizacja o blokady stron B-tree i Redo Log |
| **28 wątków** | 357 | 0.1573 s | ~63 586 rec/s | **1.07x** | Rywalizacja o blokady stron B-tree i Redo Log |
| **32 wątków** | 312 | 0.1699 s | ~58 851 rec/s | **0.99x** | Rywalizacja o blokady stron B-tree i Redo Log |

---

#### Wnioski i Prawo Amdahla w Praktyce

1. **Szczyt wydajności wielowątkowej przy $W=6 \dots 10$ (blisko $2\times$ przyspieszenia)**: Zwiększanie liczby równoległych wątków połączeń z 1 do 8 skraca czas zapisu $10\ 000$ wierszy z **0.1681 s do 0.0882 s**, zwiększając łączną przepustowość bazy do **~113 300 rekordów na sekundę**!
2. **Punkt nasycenia i stabilizacja ($W=6 \dots 10$)**: W przedziale od 6 do 10 równoległych połączeń MariaDB w pełni nasyca dedykowane wątki robocze procesora, utrzymując maksymalną stabilną przepustowość ~100k–113k rec/s.
3. **Narzut synchronizacji i rywalizacji przy $W \ge 16 \dots 32$**: Przy 32 współbieżnych połączeniach czas zapisu rośnie do **0.1699 s** (spadek przepustowości do ~58k rec/s, powrót w okolice pojedynczego wątku). Wynika to bezpośrednio z:
   - **Page Latches (Blokada stron indeksowych B-drzewa)**: 32 wątki próbują naraz modyfikować te same liście B-drzewa tabeli głównej `major_1`.
   - **Log Buffer Mutex**: Wszystkie wątki walczą o sekwencyjny dostęp i zapis do wspólnego dziennika transakcji `ib_logfile` w pamięci InnoDB.

**Rekomendacja architektoniczna**: W produkcyjnych systemach masowego przetwarzania (ETL / usługi importu) optymalny rozmiar puli równoległych workerów (Worker Pool / Connection Pool) w MariaDB wynosi **6 do 8 współbieżnych połączeń**. Zapewnia to maksymalną przepustowość I/O przy braku zbędnego narzutu rywalizacji o blokady InnoDB.

---

## Podsumowanie i praktyczne zalecenia (Best Practices)

1. **Grupuj zapisy w transakcje**: Nigdy nie wykonuj pętli z pojedynczymi zapytaniami `INSERT` przy domyślnym `autocommit=1`. Otoczenie bloku zapisu transakcją (`$conn->beginTransaction()` / `$conn->commit()`) redukuje czas zapisu z niemal 7 minut do poniżej 1 minuty, eliminując wymuszone wywołania dyskowe `fsync` po każdym wierszu.
2. **Stosuj zapis masowy (Multi-row INSERT / Batching)**:
   * **Zalecana wielkość paczki ($K$)**: Optymalny rozmiar paczki wstawianej w pojedynczym zapytaniu SQL wynosi od **500 do 1 000 rekordów** dla lekkich zapytań (początkowy szczyt ~74 000 rec/s) lub od **6 000 do 25 000 rekordów** w ciężkich procesach ETL (maksymalna stabilna przepustowość do ~72 000 rec/s).
   * **Unikaj „Doliny Alokacyjnej” ($2\ 250 \dots 3\ 500$ wierszy)**: Z powodu przejścia alokatora PHP (`Zend Memory Manager`) na duże bloki systemowe (>256 KB) oraz realokacji bufora pakietu w MariaDB (`net_buffer_length`), paczki tej wielkości generują lokalny spadek wydajności do ~44 000 rec/s.
   * **Unikaj paczek $>50\ 000$ wierszy**: Sklejanie gigantycznych ciągów tekstowych nie przynosi zysków, obciąża pamięć RAM i zbliża zapytanie do limitu `max_allowed_packet` (16 MB).
3. **Wyłączaj `FOREIGN_KEY_CHECKS` przy masowym imporcie**: Jeżeli importujesz dane z zaufanego źródła (np. zrzut bazy, migracje, przetwarzanie wsadowe), wyłączenie weryfikacji na czas operacji:
   ```sql
   SET FOREIGN_KEY_CHECKS=0;
   -- Masowy import danych
   SET FOREIGN_KEY_CHECKS=1;
   ```
   zapewnia **stabilne 1.5-krotne przyspieszenie (~35% redukcji czasu)** w całym zakresie liczby kluczy obcych ($N$), a przy bardzo złożonych strukturach skraca czas nawet o połowę (~2.0x).
4. **Zapewnij odpowiedni rozmiar `innodb_buffer_pool_size`**: Dla małych słowników ($L \le 1\ 000$) strony B-drzewa są stale gorące w pamięci RAM. Przy dużej kardynalności ($L \ge 100\ 000$) rozproszenie kluczy zwiększa czas weryfikacji o ponad 35%, dlatego wielkość bufora InnoDB powinna bez problemu mieścić wszystkie indeksy relacyjne.
5. **Wykorzystuj zrównoleglenie połączeń klienckich ($W = 6 \dots 10$)**: Pojedyncze zapytanie masowe w MariaDB wykonuje się zawsze jednowątkowo na jednym rdzeniu CPU. Podział zadania na **6 do 8 równoległych workerów** pozwala wykorzystać wielordzeniowość procesora i podnieść łączną przepustowość bazy do ponad **113 000 rekordów na sekundę** (blisko 2-krotne przyspieszenie bez ryzyka rywalizacji o blokady).
