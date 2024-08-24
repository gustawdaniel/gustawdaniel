import type {RoutePriorityOverride, ValidRedirectStatus} from "astro";

export const redirects: Record<string, string | {
    status: ValidRedirectStatus
    destination: string
    priority?: RoutePriorityOverride
}> = {
    '/prawo-zipfa-w-nodejs/': '/posts/pl/prawo-zipfa-w-nodejs/',
    '/retry-policy/': '/posts/pl/retry-policy/',
    '/aktualizacja-paczki-aur/': '/posts/pl/aktualizacja-paczki-aur/',
    '/najmniejsza-wspolna-wielokrotnosc/': '/posts/pl/najmniejsza-wspolna-wielokrotnosc/',
    '/jak-skonfigurowac-ssl-w-lokalnym-developmencie/': '/posts/pl/jak-skonfigurowac-ssl-w-lokalnym-developmencie/',
    '/jeszcze-jeden-wpis-o-instalacji-arch-linux/': '/posts/pl/jeszcze-jeden-wpis-o-instalacji-arch-linux/',
    '/rozklad-benforda/': '/posts/pl/rozklad-benforda/',
    '/sterowanie-obciazeniem-procesora-w-node-js/': '/posts/pl/sterowanie-obciazeniem-procesora-w-node-js/',
    '/broadcast-channel-api/': '/posts/pl/broadcast-channel-api/',
    '/analiza-czestosci-nazw-kryptowalut-w-korpusie-jezyka-angielskiego/': '/posts/pl/analiza-czestosci-nazw-kryptowalut-w-korpusie-jezyka-angielskiego/',
    '/testowanie-szybkosci-selektow/': '/posts/pl/testowanie-szybkosci-selektow/',
    '/scraping-najbardziej-popularnych-kont-na-twitterze/': '/posts/pl/scraping-najbardziej-popularnych-kont-na-twitterze/',
    '/bot-telegramowy-w-typescript/': '/posts/pl/bot-telegramowy-w-typescript/',
    '/aplikacja-z-fosuserbundle-i-api-google-maps/': '/posts/pl/aplikacja-z-fosuserbundle-i-api-google-maps/',
    '/instalacja-odnawialnego-certyfikatu-tls/': '/posts/pl/instalacja-odnawialnego-certyfikatu-tls/',
    '/scrapowanie-danych-w-jezyku-perl/': '/posts/pl/scrapowanie-danych-w-jezyku-perl/',
    '/kompilacja-interpretera-php-7-w-bunsenlabs/': '/posts/pl/kompilacja-interpretera-php-7-w-bunsenlabs/',
    '/analiza-logow-apache-z-goaccess/': '/posts/pl/analiza-logow-apache-z-goaccess/',
    '/tesseract-ocr-i-testowanie-selektow/': '/posts/pl/tesseract-ocr-i-testowanie-selektow/',
    '/wizualizacja-dynamicznej-sieci-korelacyjnej/': '/posts/pl/wizualizacja-dynamicznej-sieci-korelacyjnej/',
    '/logowanie-danych-w-mysql-ajax-i-behat/': '/posts/pl/logowanie-danych-w-mysql-ajax-i-behat/',
    '/scraping-facebooka-w-2021-roku/': '/posts/pl/scraping-facebooka-w-2021-roku/',
    '/w-jaki-sposob-wojna-o-kompatybilnosc-uksztaltowala-frontend/': '/posts/pl/w-jaki-sposob-wojna-o-kompatybilnosc-uksztaltowala-frontend/',
    '/wyciskamy-dane-z-pdf-jak-sok-z-cytryny/': '/posts/pl/wyciskamy-dane-z-pdf-jak-sok-z-cytryny/',
    '/ile-rodzin-zmiesci-sie-w-samolocie/': '/posts/pl/ile-rodzin-zmiesci-sie-w-samolocie/',
    '/scraping-wordpressa/': '/posts/pl/scraping-wordpressa/',
    '/rails/': '/posts/pl/rails/',
    '/infrastrukura-defniowana-jako-kod/': '/posts/pl/infrastrukura-defniowana-jako-kod/',
    '/wyznaczenie-roznicy-plikow-json/': '/posts/pl/wyznaczenie-roznicy-plikow-json/',
    '/scraping-rejestrow-medycznych/': '/posts/pl/scraping-rejestrow-medycznych/',
    '/jak-pobrac-dane-kontaktowe-20k-adwokatow-w-godzine/': '/posts/pl/jak-pobrac-dane-kontaktowe-20k-adwokatow-w-godzine/',
    '/scraping-libor-oraz-wibor-z-money-pl/': '/posts/pl/scraping-libor-oraz-wibor-z-money-pl/',
    '/strukturyzacja-historycznych-kursow-walut-nbp/': '/posts/pl/strukturyzacja-historycznych-kursow-walut-nbp/',
}