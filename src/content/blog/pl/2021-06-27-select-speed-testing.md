---
author: Daniel Gustaw
canonicalName: wplyw-indeksacji-na-wydajnosc-wyszukiwania-w-bazie-mysql
coverImage: https://ucarecdn.com/8bdad4d4-f0bb-4b99-9ffd-46f484807c2a/
date_updated: 2021-06-27 17:40:00+00:00
description: Stosowanie indeksów przyśpiesza wyszukiwanie i podnosi wielkość tabel
  spowalniając modyfikacje. Artykuł pokazuje jak profilować zapytania i mierzyć wpływ
  indeksów na wydajność wyszukiwania.
excerpt: Stosowanie indeksów przyśpiesza wyszukiwanie i podnosi wielkość tabel spowalniając
  modyfikacje. Artykuł pokazuje jak profilować zapytania i mierzyć wpływ indeksów
  na wydajność wyszukiwania.
publishDate: 2021-06-27 17:40:00+00:00
slug: pl/testowanie-szybkosci-selektow
tags:
- mathematica
- mysql
- profiling
title: Wpływ indeksacji na wydajność wyszukiwania w bazie MySQL
---



Wyszukiwanie po kluczu jest szybsze niż wyszukiwanie po zwykłym atrybucie. Nic odkrywczego. Jednak byłem ciekaw jakiego rzędu są to różnice. Przygotowałem eksperyment.

W tym artykule przedstawię porównanie szybkości wyszukiwania po **kluczu głównym** z wyszukiwaniem po **nie indeksowanym atrybucie**. Zobaczę jak na wydajność wyszukiwania wpływa przeniesienie tabeli do **pamięci operacyjnej**. Oraz przeanalizuję wyniki za pomocą oprogramowania `Mathematica`.

Skład kodu

```
46% MySql 54% Mathematica
```

## Baza danych

Zaczniemy od standardowego nagłówka zapewniającego idempotentność. W MySql jest to dość proste

```sql
DROP DATABASE IF EXISTS test;
CREATE DATABASE IF NOT EXISTS test;
USE test;
```

Tworzymy jedną tabelę z kluczem oraz zwykłym atrybutem

```sql
CREATE TABLE main(
  id INTEGER UNIQUE NOT NULL AUTO_INCREMENT PRIMARY KEY,
  value INTEGER
);
```

### Procedury zapisu danych

Definiujemy procedurę wypełniającą tabelę danymi

```sql
drop procedure if exists load_data;

delimiter #
create procedure load_data(IN _max INTEGER)
begin

declare counter int unsigned default 0;

  truncate table main;
  start transaction;
  while counter < _max do
    set counter=counter+1;
    insert into main (value) values (counter);
  end while;
  commit;
end #

delimiter ;
```

Najpierw usunęliśmy procedurę o tej nazwie, jeśli już istniała. W kolejnej linii ustawiliśmy znak końca komendy na `#`. Dzięki temu definiowanie procedury nie zostanie przerwane w środku przez występujące tam średniki. Naszą procedurę nazwaliśmy `load_data` i posiada ona jeden argument całkowitoliczbowy - liczbę wierszy jakimi wypełni tabelę. Linia zaczynająca się od `declare` odpowiada za ustawienie zmiennej lokalnej przechowującą nasz licznik. Przed rozpoczęciem transakcji czyścimy tabelę którą będziemy wypełniać. Wewnątrz transakcji wykonuje się pętla zapisująca do tabeli wartości od `1` do `_max`. Na końcu używamy znaku `#` jako średnika i przywracamy średnikowi jego domyślne znaczenia. Całkiem sporo kodu jak na tak prostą operację. Jednak zysk z tego jest taki, że teraz wystarczy wpisać np.:

```sql
call load_data(5);
```

a tabela wypełni się danymi zgodnie z naszymi oczekiwaniami

```sql
SELECT * FROM main;
+