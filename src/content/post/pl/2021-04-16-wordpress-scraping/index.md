---
title: Scraping WordPress - 4300 wyroków sądów w sprawach frankowych bez linii kodu
slug: scraping-wordpressa
publishDate: 2021-04-20T12:14:43.000Z
date_updated: 2021-04-20T12:18:07.000Z
tags: ['scraping']
excerpt: Nie często się zdarza, żeby wykonanie usługi trwało której, niż jej wycenienie, ale przy scrapingu może się tak stać. Zobacz jak łatwe może być pobranie danych, szczególnie z Wordpressa.
---

Nie często się zdarza, żeby wykonanie usługi trwało krócej niż jej wycenienie, ale przy scrapingu tak może się stać. Scraping przypomina pod tym względem hacking, że w zależności od zabezpieczeń i skomplikowania systemu, z którego pobieramy dane, może on być banalnie prosty lub stanowić poważne wyzwanie.

W tym wpisie pokażę jak wykonałem usługę scrapingu zanim zdążyłem ją wycenić. Nie napisałem żadnej linii kodu, a całość zajęła mi kilka minut.

## Czego potrzebował klient:

Zapytanie dotyczyły bazy wyroków sądowych ze strony

[https://nawigator.bankowebezprawie.pl/pozwy-indywidualne/](https://nawigator.bankowebezprawie.pl/pozwy-indywidualne/)

![](../../../../assets/2021-04-16/Screenshot-from-2021-04-20-13-51-47.png)

Dzięki wtyczce Wappalyzer możemy przeczytać, że to WordPress - antyczna technologia, która zwykle jest przyjazna dla scrapingu, bo jej wybór świadczy o braku funduszy na jakiekolwiek antyscrapingowe działania.

Tabela przeładowuje się w czasie rzeczywistym. Paginacja nie zmienia adresów url. Jest to typowe rozwiązanie dla paczki `datatable` będącej wtyczką `jquery`.

[https://datatables.net/](https://datatables.net/)

Na stronie tej wtyczki znajdziemy tą samą tabelę, tylko z odrobinę zmienionymi stylami:

![](../../../../assets/2021-04-16/Screenshot-from-2021-04-20-13-55-32.png)

Są to wystarczające poszlaki, by sądzić, że dane do tabeli są ładowane z jednej końcówki. Szybka analiza ruchu sieciowego nie pokazuje niczego ciekawego, ale pokazanie źródła strony już tak:

![](../../../../assets/2021-04-16/Screenshot-from-2021-04-20-13-57-19.png)

Reszta usługi polegała już tylko na zaznaczeniu tych kilu tysięcy linii tekstu i zapisaniu ich w pliku `json`. Potencjalnie dla wygody końcowego odbiorcy konwersja do `csv` lub `xlsx`, na przykład na stronie

[JSON to CSV - CSVJSON

Online tool for converting JSON to CSV or TSV. Convert JSON to Excel.

![](https://csvjson.com/img/favicon.ico)CSVJSON

![](https://csvjson.com/img/logo-sponsor-flatfile.svg)](https://csvjson.com/json2csv)

![](../../../../assets/2021-04-16/Screenshot-from-2021-04-20-14-01-40.png)

Linki do pobranych danych:

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json)

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json.xlsx](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json.xlsx)

Na końcu zaznaczę, że mimo, że dostęp do tych danych jest darmowy, to ludzie pracujący nad ich strukturyzacją robią to w ramach wolontariatu aby realizować cel postawiony przez stowarzyszenie:

> B) gromadzenie informacji o nieuczciwych praktykach przedsiębiorcy i innych przypadkach naruszeń prawa przez te podmioty oraz opracowywanie i upublicznianie informacji, artykułów, raportów i opinii w tym zakresie

[https://rejestr.io/krs/573742/stowarzyszenie-stop-bankowemu-bezprawiu](https://rejestr.io/krs/573742/stowarzyszenie-stop-bankowemu-bezprawiu)

Jeśli chcecie korzystać z ich pracy zachęcam Was do wsparcia ich na stronie

[https://www.bankowebezprawie.pl/darowizna/](https://www.bankowebezprawie.pl/darowizna/)

![](../../../../assets/2021-04-16/Screenshot-from-2021-04-20-13-43-17.png)
