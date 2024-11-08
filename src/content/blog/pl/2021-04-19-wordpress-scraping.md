---
author: Daniel Gustaw
canonicalName: wordpress-scraping
coverImage: http://localhost:8484/8a96e11b-a834-413b-a886-3b5eb059ba3e.avif
description: Nie często się zdarza, żeby wykonanie usługi trwało której, niż jej wycenienie, ale przy scrapingu może się tak stać. Zobacz jak łatwe może być pobranie danych, szczególnie z Wordpressa.
excerpt: Nie często się zdarza, żeby wykonanie usługi trwało której, niż jej wycenienie, ale przy scrapingu może się tak stać. Zobacz jak łatwe może być pobranie danych, szczególnie z Wordpressa.
publishDate: 2021-04-19 12:14:43+00:00
slug: pl/scraping-wordpressa
tags:
- wordpress
- scraping
title: Scraping WordPress - 4300 wyroków sądów w sprawach frankowych bez linii kodu
updateDate: 2021-04-19 12:18:07+00:00
---

Nie często się zdarza, żeby wykonanie usługi trwało krócej niż jej wycenienie, ale przy scrapingu tak może się stać. Scraping przypomina pod tym względem hacking, że w zależności od zabezpieczeń i skomplikowania systemu, z którego pobieramy dane, może on być banalnie prosty lub stanowić poważne wyzwanie.

W tym wpisie pokażę jak wykonałem usługę scrapingu zanim zdążyłem ją wycenić. Nie napisałem żadnej linii kodu, a całość zajęła mi kilka minut.

## Czego potrzebował klient:

Zapytanie dotyczyły bazy wyroków sądowych ze strony

[https://nawigator.bankowebezprawie.pl/pozwy-indywidualne/](https://nawigator.bankowebezprawie.pl/pozwy-indywidualne/)

![](http://localhost:8484/7a238f0e-5274-43d1-abb9-24f9cbf45bad.avif)

Dzięki wtyczce Wappalyzer możemy przeczytać, że to WordPress - antyczna technologia, która zwykle jest przyjazna dla scrapingu, bo jej wybór świadczy o braku funduszy na jakiekolwiek antyscrapingowe działania.

Tabela przeładowuje się w czasie rzeczywistym. Paginacja nie zmienia adresów url. Jest to typowe rozwiązanie dla paczki `datatable` będącej wtyczką `jquery`.

[https://datatables.net/](https://datatables.net/)

Na stronie tej wtyczki znajdziemy tą samą tabelę, tylko z odrobinę zmienionymi stylami:

![](http://localhost:8484/8c945eb6-3854-4054-a3b2-b3282411e363.avif)

Są to wystarczające poszlaki, by sądzić, że dane do tabeli są ładowane z jednej końcówki. Szybka analiza ruchu sieciowego nie pokazuje niczego ciekawego, ale pokazanie źródła strony już tak:

![](http://localhost:8484/43d4180b-e8ae-4b4d-b8a6-1b5962d3e929.avif)

Reszta usługi polegała już tylko na zaznaczeniu tych kilu tysięcy linii tekstu i zapisaniu ich w pliku `json`. Potencjalnie dla wygody końcowego odbiorcy konwersja do `csv` lub `xlsx`, na przykład na stronie

[JSON to CSV - CSVJSON](https://csvjson.com/json2csv)

![](http://localhost:8484/2ae82148-8458-4caa-bb30-2376d9db19d8.avif)

Linki do pobranych danych:

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json)

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json.xlsx](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json.xlsx)

Na końcu zaznaczę, że mimo, że dostęp do tych danych jest darmowy, to ludzie pracujący nad ich strukturyzacją robią to w ramach wolontariatu aby realizować cel postawiony przez stowarzyszenie:

> B) gromadzenie informacji o nieuczciwych praktykach przedsiębiorcy i innych przypadkach naruszeń prawa przez te podmioty oraz opracowywanie i upublicznianie informacji, artykułów, raportów i opinii w tym zakresie

[https://rejestr.io/krs/573742/stowarzyszenie-stop-bankowemu-bezprawiu](https://rejestr.io/krs/573742/stowarzyszenie-stop-bankowemu-bezprawiu)

Jeśli chcecie korzystać z ich pracy zachęcam Was do wsparcia ich na stronie

[https://www.bankowebezprawie.pl/darowizna/](https://www.bankowebezprawie.pl/darowizna/)

![](http://localhost:8484/81b9771e-640d-4a50-997c-1018220a7158.avif)
