# Daniel Gustaw - Blog

Real dates of drafts

```
2016-11-29-logowanie-danych-w-mysql-ajax-i-behat.md
2016-11-30-wizualizacja-dynamicznej-sieci-korelacyjnej.md
2016-12-02-tesseract-ocr-i-testowanie-selektów.md
2016-12-08-testowanie-szybkości-selektów.md
2016-12-11-analiza-logów-apache-z-goaccess.md
2016-12-24-kompilacja-interpretera-php-7-w-bunsenlabs.md
2017-01-17-aplikacja-z-fosuserbundle-i-api-google-maps.md
2017-02-13-analiza-wydajności-pustych-pętli-w-16-językach.md
2017-02-14-pomiar-ilości-tekstu-i-kodu-w-moich-wpisach.md
2017-06-16-instalacja-odnawialnego-certyfikatu-tls.md
2017-08-05-scrapowanie-danych-w-języku-perl.md
2018-02-13-fetch-promise-oraz-string-templates.md
2018-02-20-xss-attack-using-script-style-and-image.md
2018-02-21-snake-game-in-javascript-part-1-objects.md
2018-03-19-snake-game-in-javascript-part-2-events.md
2018-03-20-snake-game-in-javascript-part-3-vue.md
2018-07-08-measuring-the-amount-of-text-and-code-in-my-blog-posts.md
2019-07-08-badanie-wydajności-insertów-mysql.md
```

## Dev Setup:

```bash
pnpm dev
```

```bash
cd scripts && caddy run
```

## Deploy

https://dash.cloudflare.com/416275d8b658f8f343bf49806950ad25/web-analytics/overview?siteTag~in=deea757b9ff2486188009e891c56f064&time-window=4320

## Analytics

https://cloud.umami.is/settings/websites/5e908f7d-97e7-4cdd-abf5-a47de1aa1e2c

## Search

https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Agustawdaniel.com&breakdown=page


## Images

Images: https://cloud.digitalocean.com/spaces/preciselab?path=blog%2Fimg%2F&i=d27b97

```bash
s3cmd put --acl-public src/assets/images/* s3://preciselab/blog/img/
```

On deploy replace all

http://localhost:8484

by

http://fra1.digitaloceanspaces.com/preciselab/blog/img

Replace all img links

```bash
find src -type f -exec sed -i 's|http://localhost:8484|http://preciselab.fra1.digitaloceanspaces.com/blog/img|g' {} +
```

## Planned fixes

TODO:
- [ ] add projects page
- [ ] polish link fix replace (Nie będziemy się skupiać na tej części kodu. Jeśli jesteś tym zainteresowany i znasz język polski, napisałem artykuł na temat terraform tutaj:) by link per language
- [ ] tags in white mode more visible
- [ ] footer not visually separated
- [ ] separation on mobile between next articles
- [ ] articles recommendations engine using vector db
- [ ] dark mode colors are awful
- [ ] fix Core Web Vitals https://dash.cloudflare.com/416275d8b658f8f343bf49806950ad25/web-analytics/overview/web-vitals?siteTag~in=deea757b9ff2486188009e891c56f064

Daniel Homepage Review Report (v2)

Raport z przeglądu strony domowej Daniela przed przesiadką z Ghost na Astro.

### Scope
- Nowa wersja strony (Astro, podlega przeglądowi): https://gustawdaniel.com/
- Stara wersja strony (Ghost, tylko do porównanie zmian): https://165.227.171.10/

### Timeline
- 2024-11-14: Raport wydanie v2 - dodanie M2
- 2024-11-14: Raport wydanie v1
- 2024-11-13: Początek przeglądu
- 2024-11-09: Prośba o przegląd

### Header
- [ ] H1: Brak odpowiedniego wizualnego oddzielenie nagłówka/menu (innego koloru tła) w trybie jasnym (w tryb ciemny jest ok).
- [ ] H2: W mobilnym widoku menu lista dostępnych języków nie powinna być domyślnie rozwinięta.
- [ ] H3: Po wejściu w konkretny wpis na blogu/notatkę nie podświetla się w menu, w jakiej sekcji strony się znajdujemy.
- [ ] H4: W trybie jasnym pozioma linia oddzielająca nagłówek znika w sekcjach Notatki i Kontakt.

### Footer
- [ ] F1: Brak jakiegokolwiek wizualnego oddzielenie stopki (innego koloru tła, pozioma linia); oba tryby mają ten problem.
- [ ] F2: W wersji mobilnej linki do sekcji umieszczone w stopce strony nie są wyśrodkowane.

### Search
- [ ] S1: Ładowanie dodatkowych wyników wyszukiwania nie powinno wymagać kliknięcia w przycisk.
- [ ] S2: Nie da się wyjść z wyników wyszukiwania naciskając <Esc>, jeżeli pole wyszukiwania zostało odkliknięte.
- [ ] S3: W wersji mobilnej nie ma możliwości wyłączenia wyszukiwania.
- [ ] S4: Zasłanianie w trybie desktopowym całej strony wyszukiwarką działa dezorientująco.

### Blog
- [ ] B1: Tło tagów w trybie jasnym jest mało widoczne.
- [ ] B2: CSS tagów (szczególnie przy wąskiej wersji mobilnej) rozjeżdża się, kiedy tagi wyświetlają się w wielu liniach.
- [ ] B3: Tagi po najechaniu myszką zachowują się jak linki (zmiana kursora, podświetlenie), ale nie da się w nie kliknąć.
- [ ] B4: W treści wpisu przy każdej sekcji przydałby się link z odnośnikiem (tak jak na GitHub lub Wikipedii).
- [ ] B5: Wszystkie kody źródłowe inline są obudowane w apostrofy – warto rozważyć zmianę tego stylu.
- [ ] B6: Wpis https://gustawdaniel.com/posts/en/codingame-derivative-part-1/ zawiera błąd w ostatnim linku/obrazku.
- [ ] B7: Przykłady niepoprawnych odnośników do wpisów:
    - [ ] Wpis https://gustawdaniel.com/posts/en/pulumi-infrastructure-as-a-code/ odsyła do https://gustawdaniel.com/infrastrukura-defniowana-jako-kod/ (literówka w slugu)
    - [ ] Wpis https://gustawdaniel.com/posts/en/new-google-login/ odsyła do https://gustaw-daniel.com/login-by-metamask-rest-backend-in-fastify/
    - [ ] Wpis https://gustawdaniel.com/posts/en/analysis-of-cryptocurrency-name-frequency-in-the-english-language-corpus/ odsyła do https://gustawdaniel.com/posts/en/analysis-of-cryptocurrency-name-frequency-in-the-english-language-corpus/scraping-najbardziej-popularnych-kont-na-twitterze/
- [ ] B8: We wpisie https://gustawdaniel.com/posts/en/structuring-historical-exchange-rates-nbp/ pozostawiono TODO.

### Images
- [ ] B9: W wielu miejscach używasz niepoprawnych adresów obrazów. Obrazy te pochodzą z ser-
  wera preciselab.fra1.digitaloceanspaces.com i istnieją na tym serwerze, jednak
  dodajesz od och adresów jakiś losowy sufiks, który wszystko psuje.
- [ ] Przykładowo ten adres obrazka https://preciselab.fra1.digitaloceanspaces.com/blog/img/045d4962-
  c028-4eb1-be9e-9fbd46fcc60d.avifchf3table.png prawdopodobnie powinien być
  zamieniony na https://preciselab.fra1.digitaloceanspaces.com/blog/img/045d4962-
  c028-4eb1-be9e-9fbd46fcc60d.avif a wykorzystywany jest na przykład na tej stronie
  https://gustawdaniel.com/posts/pl/strukturyzacja-historycznych-kursow-walut-nbp/ i z powodu tego błędu nie wyświetla się on wcale.
- [ ] Identify incorrect image URLs.
      - Many URLs from `preciselab.fra1.digitaloceanspaces.com` are used incorrectly.
      - Issue: A random suffix is appended to the URLs, causing them to break.
      - Example:
          - Incorrect: `https://preciselab.fra1.digitaloceanspaces.com/blog/img/045d4962-c028-4eb1-be9e-9fbd46fcc60d.avifchf3table.png`
          - Correct: `https://preciselab.fra1.digitaloceanspaces.com/blog/img/045d4962-c028-4eb1-be9e-9fbd46fcc60d.avif`
      - Affected page: [https://gustawdaniel.com/posts/pl/strukturyzacja-historycznych-kursow-walut-nbp/](https://gustawdaniel.com/posts/pl/strukturyzacja-historycznych-kursow-walut-nbp/)
  - [ ] Review and fix all instances of incorrect URLs:
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/045d4962-c028-4eb1-be9e-9fbd46fcc60d.avifchf3table.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/093d1361-1532-4040-aa60-cd50cc9705de.avifchf9xls.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/13ae27b8-3d64-470c-b7d7-13813ffcbcf7.avifchf17bar.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/43871410-d47e-4076-95ab-61d8795fef17.avifchf132008.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/47831aa4-8526-44ad-b452-a874f467ec88.avifchf22netlify.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/49771fae-248f-44fe-a307-bc25574964da.avifchf20chart.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/61cf0fb7-0756-4f14-8139-5e7a19560cb8.avifchf6table.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/62ec75f9-e6c2-476a-abd5-6b53ca5df44c.avifchf10diff.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/6aea3892-5617-4b54-909f-c202c1ae20f5.avifchf4selector.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/70234f95-8834-4879-8290-b1b873c01f15.avifchf12fix.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/752e8b00-4302-4f82-a2b6-ba872c04ccdb.avifchf8correction.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/79297982-53d5-4631-80ce-233139e5e437.avifchf18graph.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/892c57e1-ea8f-45dc-aac4-e70fe31c48b4.avifchf16server.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/8d0b0279-28a4-4f36-8018-bd8cb6cbb5e0.avifchf21chart.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/95e88003-79bf-46d0-b300-d7661d4adcee.avifchf2download.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/99217fa8-3967-43d9-a7d9-b1a7cdf95603.avifchf7err.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/a1a5c29e-0331-469d-ba92-28bca784abbd.avifchf11empty.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/bedc08c4-895e-4579-b482-5c9d2cc39126.avifchf23chart.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/c45fe2c1-92f2-45a2-b2a3-34e616bc8bec.avifchf1pricehistory.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/db384089-4942-4f2c-9c7e-61960ff9385c.avifchf5codes.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/ddd3e51a-bd37-474f-8c4b-64d7e89fe9a3.avifchf24empty.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/e43bf31c-938d-446b-bba7-a2692d73e6ca.avifchf15diff.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/ec2b3b0d-9f59-42a9-8a1d-a15d417333f6.avifchf19chart.png`
      - [ ] `https://preciselab.fra1.digitaloceanspaces.com/blog/img/fa86f166-08a5-4f4d-a6ac-93564ffe122b.avifchf14schema.png`



### Notes
- [ ] N1: Strona notatek w języku polskim nie respektuje ustawienia trybu ciemnego.
- [ ] N2: W polskiej wersji notatek znajdują się zbędne odnośniki do różnych sekcji strony, w tym projektów, których brakuje w menu głównym.
- [ ] N3: Strzałka na prawo od elementów w liście notatek jest zbędna.
- [ ] N4: Brakuje tagów przy notatkach.
- [ ] N5: Przykłady źle zaadresowanych odnośników do notatek:
    - [ ] Notatka https://gustawdaniel.com/notes/how-to-install-custom-extension-in-vscode/ odsyła do https://gustawdaniel.com/note/how-to-generate-ssh-key-to-github-repo i https://gustawdaniel.com/note/how-to-install-nodejs-and-pnpm

### Contact
- [ ] C1: W wersji ciemnej linki w kontaktach są całkowicie niewidoczne.
- [ ] C2: W wersji jasnej animacja w kontaktach wygląda brzydko, w wersji ciemnej jest lepsza, ale warto rozważyć jej usunięcie w wersji mobilnej.
- [ ] C3: W wersji jasnej terminal zlewa się z tłem i jest słabo widoczny.

### Misc
- [ ] M1: Serwer ma otwarte wiele portów, które prowadzą w to samo miejsce. Czy to jest związane z Cloudflare?
- [ ] M2: W wielu miejscach odwołujesz się do `preciselab.fra1.digitaloceanspaces.com`. Sprawdź, czy to jest zamierzone.







