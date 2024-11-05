---
title: Ugoda KNF, Odfrankowienie oraz Unieważnienie kredytu indeksowanego w CHF
slug: obliczanie-alternatywnych-rozliczen-dla-kredytow-indeksowanych-w-chf
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2021-02-09T10:20:01.000Z
draft: true
canonicalName: chf-credit-settlement
---

Kredytem CHF nazywa się potocznie w Polsce kredyt który został zaciągnięty w tej walucie mimo, że spłacany był często w złotówkach przez osoby mieszkające w naszym kraju. Popularność tego rozwiązania w latach 2004-2008 spowodowana była niskim kursem franka szwajcarskiego oraz niską wartością LIBOR, czyli stawką po której największe banki świata pożyczają sobie pieniądze. Tym czasem WIBOR, który doliczany był do marży polskich kredytów był wyższy przez to potencjalne warunki tego kredytu w momencie jego zaciągania mogły się wydawać lepsze.

Aby przedstawić wyliczenia przyjmiemy kilka założeń. Przede wszystkim ograniczymy parametry kredytu do:

* daty jego zaciągnięcia (zawsze 1 dzień miesiąca)
* ilości miesięcy na który brany jest kredyt (zawsze liczba całkowita)
* wartość kredytu (zawsze podawana w PLN)
* typ raty (Stała lub Malejąca)
* marża banku (wartość procentowa)

Rozważane warunki dalszej spłaty przedstawia tabela:

|Warunki|Obecne|Knf|Odfrankowienie|Unieważnienie|
|---|---|---|---|---|
|Indeksowanie|CHF|PLN|PLN|PLN|
|Marża poza bankowa|LIBOR|WIBOR|LIBOR|BRAK|
|Marża bankowa|ZWYKŁA|ZWYKŁA|ZWYKŁA|BRAK|

W przedstawionej symulacji przyjmiemy, że spłacano cały czas kredyt zgodnie z obecnymi warunkami. Nie było żadnych opóźnień, wakacji, nadpłat, a bank nie pobierał dodatkowych prowizji za przewalutowanie.

W takim modelu zewnętrzne dane, których potrzebujemy to:

1. Kurs CHF
2. Wartość LIBOR
3. Wartość WIBOR

Na początek rozważamy ratę stałą. Algorytm obliczeń jest następujący.

1. Dla każdego z rozwiązań wyliczamy wartość w kursie po którym indeksujemy kredyt.
2. Przyjmujemy stałą stopę spłaty na podstawie obecnej wartości marży.
3. Wyliczamy z niej udział kapitału oraz marży w spłacie na dany miesiąc.
4. Porównujemy to z wartością realnie zapłaconą sprowadzając to do waluty po której indeksujemy w danym wariancie.
5. Dodajemy nadpłatę lub odejmujemy niedopłatę od kapitału pozostałego do spłaty.
