---
author: Daniel Gustaw
canonicalName: scraping-facebooka-w-2021-roku
coverImage: https://ucarecdn.com/034f0b84-4b65-4157-8de6-cc9f01220f4f/
date_updated: 2021-04-24 11:23:36+00:00
description: Artykuł ma na celu zapoznanie czytelnika z metodą na scaping portalu
  Facebooka po wprowadzeniu aktualizacji layoutu.
excerpt: Artykuł ma na celu zapoznanie czytelnika z metodą na scaping portalu Facebooka
  po wprowadzeniu aktualizacji layoutu.
publishDate: 2021-04-23 19:49:00+00:00
slug: pl/scraping-facebooka-w-2021-roku
tags:
- facebook
title: Scraping Facebooka w 2021 roku
---



## Metoda stabilnych meta-selektorów opartych o stylowanie

Artykuł ma na celu zapoznanie czytelnika z metodą na scaping portalu Facebooka po wprowadzeniu aktualizacji layoutu. Wymagana jest znajomość TypeScript lub JavaScript, oraz zasad działania selektorów CSS. Pokazujemy w nim zestaw narzędzi, które rozwiązują problem takiego budowania selektorów, aby były one stabilne na przykładzie scrapingu członków grupy.

Po aferze Cambridge Analitica, po przesłuchaniach Zucka przed senatem USA, po wprowadzeniu RODO scraping danych w mediach społecznościowych staje się stopniowo coraz trudniejszy. Liderem we wprowadzaniu zabezpieczeń jest bezsprzecznie Facebook.

Przy zaledwie 2.3 miliarda kont aktywnych użytkowników rocznie usuwanych jest około 6 miliardów fakeowych kont. Co ciekawe przy takiej skali nie znam nikogo, kto mając prawdziwe konto skarżył by się na bezpodstawne banowanie. Tą fenomenalną precyzję zapewnia Facebookowi wykorzystanie 20 tysięcy współczynników, które sztuczna inteligencja wykorzystuje do umieszczania użytkowników na mapie poziomów ryzyka, że konto nie należy do prawdziwego człowieka.

Serwis w miarę możliwości zbiera informacje o osobach, które nie mają kont, ale istnieją i mogły by je założyć. Potrafi też wykrywać zdjęcia generowane komputerowo dzięki artefaktom powstającym przy sztucznym tworzeniu zdjęć twarzy przy kącikach oczu.

Wszystkie te działania, służą dwóm podstawowym celom:

* uodpornieniu sieci społecznościowej na zautomatyzowane, masowe umieszczenie treści
* zapobieganiu zautomatyzowanemu pobieraniu i przetwarzaniu danych dostępnych w serwisie

Samemu wykrywaniu i banowaniu botów towarzyszą inne działania, jak na przykład obfuskacja kodu strony internetowej. Technika ta polega na zastępowaniu nazw i instrukcji zrozumiałych dla człowieka przez takie, które nie utrudniają czytanie i pracę z kodem źródłowym.

Przykładem czystego kodu, łatwego do zrozumienia dla programisty jest:

```html
<form class="dismiss js-notice-dismiss" action="/users/16663028/dismiss_notice?notice_name=org_newbie" accept-charset="UTF-8" method="post"><input type="hidden" name="_method" value="delete">
```

Podczas gdy na Facebooku można się spodziewać raczej czegoś takiego:

```html
<div class="rq0escxv l9j0dhe7 du4w35lb j83agx80 cbu4d94t pfnyh3mw d2edcug0 hv4rvrfc dati1w0a"><div class="rq0escxv l9j0dhe7 du4w35lb j83agx80 cbu4d94t e5nlhep0 aodizinl">
```

W dostępnym jeszcze niedawno front-endzie Facebooka często można było natknąć się na atrybuty takie jak `data-testId`, które służyły do opierania o nie testów automatycznych interfejsu, ale nowy layout jest ich pozbawiony. Inżynierowie Facebooka musieli sobie zdawać sprawę z tego, że pomocne dla nich punkty zaczepienia były wykorzystywane przez twórców botów.

Topologia drzewa DOM jest również bardziej płynna niż można by się spodziewać i budowanie długich opartych o nią selektorów typu:

```
div > div > div > div > div > div > div > div:nth-child(2) span[dir=auto] > a:nth-child(1)
```

jest pracochłonnym i ryzykownym zadaniem.

