---
author: Daniel Gustaw
canonicalName: structuring-historical-currency-rates-nbp
coverImage: https://ucarecdn.com/df272521-e61f-4143-bcb4-a664b6cc1384/
date_updated: 2021-02-17 15:21:43+00:00
description: Naucz się jak napisać kod normalizujący i strukturyzujący dane w oparciu
  case study z dziedziny finansów.
excerpt: Naucz się jak napisać kod normalizujący i strukturyzujący dane w oparciu
  case study z dziedziny finansów.
publishDate: 2021-02-04 06:02:21+00:00
slug: pl/strukturyzacja-historycznych-kursow-walut-nbp
tags:
- csv
- typescript
- parcel
- data-processing
- apexcharts
- xls
- json
title: Strukturyzacja danych na przykładzie kursu CHF NBP
---



Strukturyzacja danych to nadawanie danym kształtu pozwalającego na ich analizę i wygodne przetwarzanie. W tym wpisie pokażę jak może wyglądać taki proces na przykładzie danych pochodzących z NBP, które są składowane w plikach, których konwencja układania nagłówków ulegała zmianom na przestrzeni lat.

Dane z NBP nie nadają się przez to do natychmiastowego użycia i należy je uporządkować, jeśli chcieli byśmy je przetwarzać.

Od razu zaznaczę, że historyczne kursy walut są świetnie prezentowane na stronie:

[https://stooq.com/](https://stooq.com/)

Za przykład weźmy kurs franka szwajcarskiego:

![](https://ucarecdn.com/c45fe2c1-92f2-45a2-b2a3-34e616bc8bec/chf1pricehistory.png)

https://stooq.com/q/?s=chfpln&c=mx&t=l&a=ln&b=0

Aby pobrać te dane, wystarczy przejść na stronę:

[https://stooq.com/q/d/?s=chfpln](https://stooq.com/q/d/?s=chfpln)

i kliknąć przycisk poniżej tabeli

![](https://ucarecdn.com/95e88003-79bf-46d0-b300-d7661d4adcee/chf2download.png)

https://stooq.com/q/d/l/?s=chfpln&i=d

W tym artykule nie rozwiązuję *realnego problemu*, tylko prezentuję możliwe do zastosowania *metody strukturyzacji danych **na przykładzie*** konkretnego zbioru plików o niespójnej i nieprzewidywalnej konwencji.

Kolejno przejdziemy przez problemy:

1. Pobrania danych
2. Przetworzenia ich
3. Wyświetlenia wykresu

Główną wartością dla czytelnika jest śledzenie całego procesu od początku do końca i poznanie stosowanych tu narzędzi.

