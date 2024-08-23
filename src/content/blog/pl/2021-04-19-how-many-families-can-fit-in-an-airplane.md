---
author: Daniel Gustaw
canonicalName: ile-rodzin-zmiesci-sie-w-samolocie-zadanie-z-algorytmiki
coverImage: https://ucarecdn.com/e241188a-23c6-41d5-a640-95085128893c/
date_updated: 2021-04-20 18:41:10+00:00
description: Porównujemy dwa rozwiązania zadania polegającego na zliczaniu wolnych
  zestawów przyległych miejsc. Dowiesz się jak używać Profilowania i jak wielką różnicę
  robi użycie pop oraz shift na tablicach w js.
excerpt: Porównujemy dwa rozwiązania zadania polegającego na zliczaniu wolnych zestawów
  przyległych miejsc. Dowiesz się jak używać Profilowania i jak wielką różnicę robi
  użycie pop oraz shift na tablicach w js.
publishDate: 2021-04-20 18:41:10+00:00
slug: pl/ile-rodzin-zmiesci-sie-w-samolocie
tags:
- algorithm
title: Ile rodzin zmieści się w samolocie - zadanie z algorytmiki
---



Omówimy dwa rozwiązania zadania, które stosowane było podczas pewnej rekrutacji. Jeśli potraficie pisać kod, zalecam wam samodzielne rozwiązanie po przeczytaniu treści, zajmie to około 10 do 30 minut i pozwoli Wam porównać wasze rozwiązanie z tymi prezentowanymi poniżej:

## Treść zadania

W samolocie rozmieszczone są miejsca. Tworzą one trzy zestawy zawierające kolejno 3, 4 i 3 siedzenia sąsiadujące ze sobą. Zakładamy, że wiersze liczone są od 1 a kolumny indeksowane za pomocą liter alfabetu jak w tabeli EXCEL (od A do K). Schemat samolotu przedstawia poniższy rysunek. Zakładamy, że wszystkie miejsca mają taki sam układ jak te oznaczone na niebiesko.

![](https://ucarecdn.com/d7351e7c-8a1e-48d4-a56a-1e276afb1ca9/)

Zakładamy, że samolot ma długość `N` rzędów z miejscami. Znamy też aktualne zapełnienie miejsc, które zapisane jest w postaci ciągu znakowego `S` jako oddzielone spacją współrzędne numeru wiersza i kolumny, np:

```
S=1A 3C 2B 40G 5A
```

oznacza zajęcie miejsc `1A`, `3C`, `2B`, `40G` oraz `5A`.

Naszym celem jest napisanie funkcji, która zliczy ile 3 osobowych rodzin wymagających zajęcia miejsc bezpośrednio obok siebie zmieści się w samolocie.

Na przykład dla danych:

```
const S = "1A 2F 1C"
const N = 2;
```

poprawnym wynikiem będzie 4.

