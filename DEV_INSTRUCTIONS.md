# Blog Development Instructions

This file contains development notes, tasks, and setup instructions preserved from the original README.

## Real dates of drafts

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


## Images & Synchronization

All images are stored locally in `src/assets/images/` and automatically resolved by Astro's asset pipeline with Sharp (generating AVIF/WebP in multiple sizes locally without build-time HTTP latency).

To synchronize images with DigitalOcean Spaces (`s3://preciselab/blog/img/`):

```bash
# Pull new/updated images from DigitalOcean Spaces to src/assets/images/
make img-pull

# Push local images to DigitalOcean Spaces with public ACL
make img-push

# Two-way sync (pull & push)
make img-sync
```

## Planned fixes

TODO:
- [x] add projects page (`/projects`, `/pl/projects`, `/es/projects` built from Notion export)
- [x] fix GitHub Edit Page button links (append `.md` extension in `EditPageButton.astro`)
- [x] fix body default background (`bg-white dark:bg-slate-900` in `BaseLayout.astro`)
- [x] upgrade Tailwind CSS to v4 (`v4.3.3` via `@tailwindcss/vite`)
- [x] fix blog posts & dev notes sorting by `publishDate` (newest first in `PostsList.astro` & `DevNotesList.astro`)
- [x] tags in white mode more visible, responsive flex-wrap on mobile, and clickable links to `/tags/[tag]` page
- [x] header visual separation & sticky border (`AppTopNavBar.astro`)
- [x] footer visual separation & centered links on mobile (`BaseFoot- [x] separation on mobile between next articles (border-b & pb-8 on mobile)
- [ ] articles recommendations engine using vector db
- [x] dark mode color scheme adjusted using VS 1984 Synthwave palette (#070825 / #0D0F31 / #46BDFF / #FF16B0 / #B3F361)
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
- [x] H1: Brak odpowiedniego wizualnego oddzielenie nagłówka/menu (innego koloru tła) w trybie jasnym (w tryb ciemny jest ok).
- [x] H2: W mobilnym widoku menu lista dostępnych języków nie powinna być domyślnie rozwinięta (składane menu Alpine.js).
- [x] H3: Po wejściu w konkretny wpis na blogu/notatkę nie podświetla się w menu, w jakiej sekcji strony się znajdujemy (`isActive` matching dla `/posts`, `/notes`, `/projects`, `/contact`, `/tags`).
- [x] H4: W trybie jasnym pozioma linia oddzielająca nagłówek znika w sekcjach Notatki i Kontakt.

### Footer
- [x] F1: Brak jakiegokolwiek wizualnego oddzielenie stopki (innego koloru tła, pozioma linia); oba tryby mają ten problem.
- [x] F2: W wersji mobilnej linki do sekcji umieszczone w stopce strony nie są wyśrodkowane.

### Search
- [x] S1: Ładowanie dodatkowych wyników wyszukiwania nie powinno wymagać kliknięcia w przycisk (`showSubResults: true`).
- [x] S2: Nie da się wyjść z wyników wyszukiwania naciskając <Esc>, jeżeli pole wyszukiwania zostało odkliknięte (`@keydown.window.escape`).
- [x] S3: W wersji mobilnej nie ma możliwości wyłączenia wyszukiwania (dodano widoczny przycisk zamknięcia `X`).
- [x] S4: Przekształcono widok wyszukiwarki na desktopie na elegancki, symetryczny modal typu Command Palette (`max-w-3xl`, zaokrąglona karta z cieniem, zdefiniowane ograniczenie wysokości i scrollbar).

### Blog
- [x] B1: Tło tagów w trybie jasnym jest mało widoczne.
- [x] B2: CSS tagów (szczególnie przy wąskiej wersji mobilnej) rozjeżdża się, kiedy tagi wyświetlają się w wielu liniach.
- [x] B3: Tagi po najechaniu myszką zachowują się jak linki (zmiana kursora, podświetlenie), ale nie da się w nie kliknąć.
- [x] B4: W treści wpisu przy każdej sekcji h2/h3 dodano bezpośredni link-kotwicę (`🔗 anchor link`).
- [x] B5: Usunięto zbędne cudzysłowy/apostrofy wokoło kodów źródłowych inline (`code::before/after { content: "" }`).

### Images
- [x] B9: Zweryfikowano i poprawiono niepoprawne adresy URL obrazków w starych postach (usunięto przyklejone sufiksy typu `.avifchf3table.png` -> `.avif`).
- [x] Review and fix all instances of incorrect URLs (verified 72 clean `.avif` URLs across all markdown content files).

### Notes
- [x] N1: Strona notatek w języku polskim respektuje tryb ciemny (`bg-white dark:bg-slate-900`).
- [x] N2: Usunięto zbędne odnośniki oraz zaktualizowano zlokalizowane nagłówki w notatkach.
- [x] N3: Usunięto niepotrzebną strzałkę po prawej stronie elementów na liście notatek.
- [x] N4: Dodano obsługę i wyświetlanie tagów przy notatkach.
- [x] N5: Naprawiono niepoprawne linki w notatkach (`/note/...` -> `/notes/...`). https://gustawdaniel.com/note/how-to-generate-ssh-key-to-github-repo i https://gustawdaniel.com/note/how-to-install-nodejs-and-pnpm

### Contact
- [x] C1: W wersji ciemnej linki w kontaktach są całkowicie niewidoczne (`dark:prose-a:text-indigo-400`).
- [x] C2: Usunięto niedziałający terminal CLI oraz animację ze strony kontaktowej na rzecz czystego, responsywnego układu.
- [x] C3: Wyczyszczono stronę kontaktową.

### Misc
- [ ] M1: Serwer ma otwarte wiele portów, które prowadzą w to samo miejsce. Czy to jest związane z Cloudflare?
- [ ] M2: W wielu miejscach odwołujesz się do `preciselab.fra1.digitaloceanspaces.com`. Sprawdź, czy to jest zamierzone.




Seo roadmap:

https://learningseo.io/

Tools:
- https://app.ahrefs.com/dashboard
- screaming frog

Astro seo:

https://destiner.io/blog/post/astro-seo/
