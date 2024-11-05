---
title: Najlepsze metody web-scrapingu
slug: najlepsze-metody-web-skrapingu
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2021-04-09T19:48:53.000Z
draft: true
canonicalName: best-web-scraping-methods
---

Zanim rozpoczniesz rozmowę o możliwościach, technologii i nowoczesnych metodach scrapingu stron internetowych, zadbaj o sformułowanie problemu.

## Sformułowanie problemu

Stała optymalizacja zasobów internetowych dla urządzeń mobilnych, rosnących szybkości internetowych, rozwiązania technologiczne na poziomie hardware i oprogramowania, a także projektantów wyszukujących w sieci Worldwide, takich jak widzisz ją dzisiaj. Mianowicie - kolorowe, kontrast, zatłoczone i absolutnie bezużyteczne (czasami szkodliwe) informacje. Są to różne techniki i technologie w realizacji stron internetowych i jest głównym problemem, który należy rozwiązać podczas organizowania dostępu do danych.

Dostęp do treści docelowej można zorganizować w dwóch głównych kierunkach:

Korzystając z interfejsu API, gdy właściciele informacji przekazują go użytkownikom na podstawie osobistych odsetek - subskrypcji, wysyłek, programów partnerskich itp.

Bez użycia API - Urząd strony internetowej przez skrobanie (chyba że jest to przewidziane przez ich kod).

Pierwszy kierunek jest ograniczony tylko przez środki pieniężne, a konsument nie doświadcza trudności w zakresie realizacji technicznej. Dane uzyskane przez API są wyraźnie zorganizowane i znormalizowane. Na przykład w formatach XML lub JSON.

Drugim kierunkiem jest symulowanie przeglądarki - zasługuje na większą uwagę i jest rodzajem "wyzwania" dla deweloperów i matematyków. Automatyczne przetwarzanie tekstu przy użyciu sztucznej inteligencji, analizy semantycznej itp. - Wszystko to można nazwać kolosalnym przełomem technologicznym wymagającym rozwoju, świadomości i właściwej oceny.

### Ręczne kopiowanie zawartości

Najłatwiejszą metodą scrapingu jest ręczne wyszukiwanie żądanych informacji, a następnie kopiowanie i utrzymanie miejsca docelowego (lokalizację w dokumencie, publikując nasz własny zasób, umieszczenie w bazie danych itp.).

Ta metoda jest odpowiednia dla małych blogów lub drobnych sklepów z skąpym asortymentem tego samego rodzaju towarów.

Korzyści:

* Wysokiej jakości treść i jego docelowa adaptacja dla potrzeb konsumenta.
* Wysoka prędkość wyszukiwania.

Niedogodności:

* Powtarzalna manualna praca droga w utrzymaniu

Możliwości osoby są znacznie ograniczone do zasobów fizycznych, znajomość kula docelowej i banalnych umiejętności wyszukiwania online (nie każdy może skutecznie korzystać z narzędzi usług wyszukiwania).

Osoba podlega różnym wpływom zewnętrznym (psychologicznym, fizycznym itp.), A to niekorzystnie wpływa na stabilność swojej pracy i wartości jego usług.

Scraping do kilkuset jakościowych wyników dziennie.

### Wyrażenia regularne i wychwytywanie dopasowania w tekście

Bardzo prosta technika przetwarzania danych tekstowych, a jednocześnie potężna metoda wyodrębniania informacji z Internetu. Zwłaszcza w połączeniu z użyciem poleceń UNIX Capture (na przykład "Curl"). Wyrażenia regularne są obecne w wielu językach programowania (na przykład, implementujemy skrobanie internetowe za pomocą tej metody dla kilku projektów na temat Pythona i Ruby).

Przedstawiona metoda jest odpowiednia dla projektów, które są angażowane w automatyczne monitorowanie kilku źródeł informacji. Przypuśćmy, skrobanie poszczególnych fragmentów (nazwa produktu, jego koszty, numery telefonów i adresy e-mail itp.). W praktyce wdrażanie skrobaka dla jednej witryny może trwać około godziny. Prawda tylko wtedy, gdy zasób docelowy nie zawiera pułapek w formie renderowania JS.

Zalety:

* Jeśli znasz już regularne wyrażenia co najmniej jednego języka programowania, wdrożenie niniejszej decyzji zajmie minimalny czas.
* Wyrażenia regularne umożliwiają szybkie odróżnienie dużej liczby niepotrzebnych drobnych "niewyraźnych" z korpusu wyniku, bez łamania głównej zawartości (na przykład, oczyścić pozostałości kodu HTML).
* Wyrażenia regularne są obsługiwane przez prawie wszystkie języki programowania. I co najważniejsze, ich składnia z języka do języka prawie nie zmienia się. Pozwala to wykonać bezbolesną migrację projektów w językach z większą wydajnością i jasnością Kodeksu (na przykład, z PHP na Ruby - ostatnio takich klientów stają się coraz bardziej).

Niedogodności:

* Wyrażenia regularne mogą zamienić się w układankę dla tych, którzy ich nie wykorzystali. W tym przypadku lepiej jest natychmiast skontaktować się z specjalistami. Z reguły pojawiają się problemy podczas integracji rozwiązań w jednym języku w innym lub podczas migracji projektów do innego języka programowania.
* Wyrażenia regularne są często bardzo złożone do czytania i analizy. Czasami oparte na specyfiki przetworzonych informacji są one nadmiernie rozciągane.
* Jeśli kod HTML został zmieniony na zasobach docelowym lub dodano nowy znacznik, najprawdopodobniej zostanie zmieniona i wyrażenie regularne (w przeciwnym razie istnieje duże ryzyko "złamanej" treści).

### Zapytania HTTP (analiza kodu HTML)

Ta metoda umożliwia odbieranie stron dynamicznych i statycznych, wysyłając żądania HTTP do serwerów zdalnych. Wykorzystuje gniazda programowania i demontuje odebrane odpowiedzi z (jeśli to konieczne) wstępnie przygotowanych danych na pojemnikach docelowych (ich klas i identyfikator).

Narzędzie jest odpowiednie dla większości projektów. W realizacji jest nieco bardziej skompensowany, ale jest to kompensowane przez możliwość szybkiego uzyskania dużej ilości danych.

Korzyści:

* Umożliwia uzyskanie oryginalnych stron w formie odpowiedzi HTTP.
* Ogromna liczba wyników ograniczona tylko przez zasoby serwera i szybkość Internetu.

Niedogodności:

* Wymaga przetwarzania otrzymanych odpowiedzi - wyniki mogą zawierać wiele zbędnych.
* Wiele witryn jest wyposażonych w ochronę przed podobnymi "robotami" (jako produkcji z sytuacji, powinieneś generować dodatkowe informacje o serwisie w nagłówku żądania HTTP, jednak nie wszystkie witryny można oszukać w ten sposób).
* Wysokie prawdopodobieństwo ma być zakazane przez administratora miejsca docelowego lub zautomatyzowanego systemu ochrony, gdy dziwne metodycznie powtarzające się "odsetki" pojawia się w zasobie. Praktyka pokazuje, że ilość i częstotliwość żądań może przekraczać możliwości ludzkie.
* Zdalny serwer może być wyłączony lub zajęty w momencie wysyłania żądania. W rezultacie pojawia się prawdopodobieństwo dużej liczby błędów limitujących.

### Analiza struktury DOM generowanej dynamicznie

Dynamiczna zawartość jest jednym z problematycznych momentów skrobania internetowego. Jak sobie z tym poradzić? Aby go uzyskać, możesz użyć dowolnej pełnej przeglądarki, która odtwarza dynamiczną zawartość i skrypt po stronie klienta. Są gotowe darmowe wtyczki, które dają dobre wyniki. Istotnym ograniczeniem jest niska wydajność. Możemy uzyskiwać tylko jeden wynik w danym momencie. W rzeczywistości takie wtyczki rozwiązują wiele problemów i pozwalają zapomnieć o rzeczach takich jak ciasteczka, wyrażenia regularne, http itp.

Analiza struktury DOM opartej na skutkach ekranowych jest odpowiednia dla dużych i średnich projektów zainteresowanych zarówno jak iw ilości ekstrahowanych informacji. Wdrożenie automatyzacji tej metody jest dość złożone z technicznego punktu widzenia. Jednak nasz zespół udało się osiągnąć cel, a od projektu do projektu poprawia opracowaną funkcjonalność. Aby to zrobić, emulator przeglądarki został napisany i obsługiwacz "wirtualny ekran" z inteligentnym wyszukiwaniem węzłów w strukturze DOM.

Korzyści:

* Uzyskać dynamiczną zawartość.
* Automatyzacja. Umożliwia uzyskanie wysokiej jakości treści w dużych ilościach.
* Możliwość wdrażania rozwiązań komercyjnych. Metoda pozwala łatwo cieszyć się wsparciem do rozwiązywania problemów z zakupionym / wynajmowanym oprogramowaniem.

Niedogodności:

* Złożoność i ładowanie serwera podczas automatyzacji sprawia, że ​​proces jest dość intensywny zasobów, zarówno w kosztach opracowywania, jak i serwera.
* Kompletność wdrażania. Dla osób niebędących specjalistami jest praktycznie niemożliwe, ponieważ Wymaga dokładnej znajomości zasobów sprzętowych, podstawy rozwoju sieci i doskonałego posiadania co najmniej jednego z języków programowania serwera.
* Większość wdrażania tej metody ma zastosowanie tylko na podstawie komercyjnej, a koszty takich produktów nie ma jeszcze tendencji do zmniejszenia.

### Metody sztucznej inteligencji

Wyobraź sobie, że stoisz przed zadaniem scrapingu setek lub tysięcy witryn. Jednocześnie mają inny układ i napisane w różnych językach i ramach. W takiej sytuacji racjonalne środki zainwestują w rozwój złożonych systemów sztucznej inteligencji i / lub ontologii (ta metoda opiera się na teorii, że wszystkie witryny można podzielić na zajęcia i grupy o podobnej strukturze i zestawu technologii ).

Korzyści:

* Po utworzeniu złożonego systemu pozwala uzyskać najwyższą możliwą zawartość z ogromnej liczby domen, nawet pomimo małych zmian na stronach (inteligentny system dostosuje możliwe niedokładności). Ocena jakości dla 150 tysięcy domen będzie średnio od 75% do 93% (weryfikowana na badaniach Jetrubia w realizowanym systemie).
* Metoda umożliwia normalizowanie wyniku uzyskanego ze wszystkich źródeł w strukturze bazy danych.
* Pomimo faktu, że taki system potrzebuje stałego wsparcia (na poziomie monitorowania), z możliwymi awariami, wymaga niewielkiej interwencji w kodzie

Niedogodności:

* Kompleksowa realizacja "silnika", wymagająca wysokiego poziomu wiedzy w matematyce, statystykach, sferze logiki rozmytej.
* Wysoki koszt rozwoju.
* Podobne koszty systemu wsparcia i szkolenia.

Praktyka subskrypcji gotowych projektów komercyjnych. Odnosi się to do ograniczonej liczby żądań i ich wysokich kosztów (zauważamy, że twój własny rozwój szybko się opłaca).

Musisz podać moduły śledzenia błędów, serwerów ważności danych i serwerów proxy kopii zapasowych do możliwej witryny docelowej "czarnej arkusza".
