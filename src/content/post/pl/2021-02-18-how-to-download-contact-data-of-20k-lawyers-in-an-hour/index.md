---
title: Jak pobrać dane kontaktowe 20k adwokatów w godzinę
slug: jak-pobrac-dane-kontaktowe-20k-adwokatow-w-godzine
publishDate: 2021-02-17T20:59:14.000Z
date_updated: 2021-02-17T20:59:14.000Z
excerpt: Poznaj technikę zrównoleglania scrapingu która może kilkukrotnie przyśpieszyć pobieranie danych.
---

Strona internetowa "Rejestr Adwokatów" jest publicznym zbiorem danych. Zgodnie z obwiązującym prawem można gromadzić i przetwarzać publicznie dostępne dane osobowe z rejestrów.

[:: KRAIA - adwokaci, prawnicy zagraniczni, aplikanci ::

Krajowy Rejestr Adwokatów i Aplikantów Adwokackich

![](https://rejestradwokatow.pl/favicon16x16.ico) Adwokaci, prawnicy zagraniczni, aplikanci ::

![](https://rejestradwokatow.pl/templates/client_tpl/pl/_images/grafika/logo.png)](https://rejestradwokatow.pl/adwokat)

W tym artykule przygotujemy zestaw danych pozwalających na kontakt z prawnikami z tego rejestru. Jeśli po prostu szukasz prawnika, to możesz go tam znaleźć i nie potrzebujesz pobierać całej bazy.

Jeśli jednak prowadzisz działalność, w której adwokaci stanowią Twoją grupę docelową, to dostrzeżesz korzyści z możliwości załadowania tych danych do swojego systemu CRM.

Ten artykuł pokazuje jak w napisać kod programu pobierającego te dane z publicznego rejestru. Jeśli interesują Cię same dane przejdź do końca artykułu.

Projekt podzielimy na etapy:

1. Zbadanie strony z danymi i wyznaczenie strategii pobierania
2. Pobranie tabel z podstawowymi danymi
3. Przetworzenie tabel i wydobycie linków do podstron
4. Pobranie podstron z danymi kontaktowymi
5. Przetworzenie danych kontaktowych
6. Załadowanie danych do bazy i pokazanie wyników zapytań

## Badanie strony z danymi (strategia)

Rejestr adwokatów dostępny pod linkiem:

[:: KRAIA - adwokaci, prawnicy zagraniczni, aplikanci ::

Krajowy Rejestr Adwokatów i Aplikantów Adwokackich

![](https://rejestradwokatow.pl/favicon16x16.ico)adwokaci, prawnicy zagraniczni, aplikanci ::

![](https://rejestradwokatow.pl/templates/client_tpl/pl/_images/grafika/logo.png)](https://rejestradwokatow.pl/adwokat)

zawiera zielony przycisk wyszukaj. Po jego kliknięciu przechodzimy na stronę

> [https://rejestradwokatow.pl/adwokat/wyszukaj](https://rejestradwokatow.pl/adwokat/wyszukaj)

zawierającą klasyczną tabelę

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-16-48-01.png)

Schodząc na sam dół i klikając "ostatnia"

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-16-49-24.png)

zostaniemy przekierowani na stronę z klasyczną paginacją

> [https://rejestradwokatow.pl/adwokat/wyszukaj/strona/272](https://rejestradwokatow.pl/adwokat/wyszukaj/strona/272)

Adwokatów na tel liście można podzielić na:

* wykonujących zawód
* byłych adwokatów
* nie wykonujących zawodu

Każda z kategorii ma nieco inną stronę profilową:

> [https://rejestradwokatow.pl/adwokat/urek-macias-paulina-54635](https://rejestradwokatow.pl/adwokat/urek-macias-paulina-54635)

Adwokat wykonujący zawód ma najpełniejszy profil

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-17-16-58.png)

Niektórzy mają do tego telefon komórkowy

> [https://rejestradwokatow.pl/adwokat/urkowska-trzciska-justyna-48516](https://rejestradwokatow.pl/adwokat/urkowska-trzciska-justyna-48516)

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-17-17-45.png)

Dane o byłych adwokatach są ograniczone

> [https://rejestradwokatow.pl/adwokat/urowski-jan-52462](https://rejestradwokatow.pl/adwokat/urowski-jan-52462)

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-17-18-34.png)

Jeszcze bardziej o nie wykonujących zawodu

> [https://rejestradwokatow.pl/adwokat/urek-wanda-54247](https://rejestradwokatow.pl/adwokat/urek-wanda-54247)

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-17-19-00.png)

Strategia pobrania tych danych jest prosta. Na początku przejdziemy tabelę budując bazową listę z podstawowymi danymi. Wśród nich znajdą się linki do profili. Pobierzemy je wszystkie i z nich uzyskamy rozszerzenie tej bazowej listy o najcenniejsze dane, na przykład kontaktowe.

## Pobranie tabel z bazowymi danymi

Wszystkie podstrony pobieramy jedną komendą w bashu

```bash
mkdir -p raw && for i in {1..272}; do wget "https://rejestradwokatow.pl/adwokat/wyszukaj/strona/$i" -O raw/$i.html; done
```

Mogli byśmy to przyśpieszyć pobierając kilka stron jednocześnie, ale dla naszych celów taki jedno-liniowy kod jest znacznie lepszy, bo czas jego napisania jest bardzo krótki. Czas pobranie wszystkich stron zależy oczywiście od szybkości łącza internetowego, u mnie było to `0.54` pliku na sekundę czyli około `8.39` minuty.

## Przetworzenie tabel

Na każdej podstronie mamy taką samą tabelę

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-17-29-47.png)

Projekt inicjalizujemy komendą

```
npm init -y && tsc --init && touch entry.ts
```

Instalujemy `cheerio` oraz `axios` które będą nam potrzebne do przetwarzania plików `html` oraz wysyłania żądań `http`. Dodamy jeszcze `@types/node` które pozwalają nam importować na przykład `fs`.

```
npm i cheerio axios @types/node
```

Ponieważ projekt będzie zawierał kilka plików utworzymy też plik `helpers.ts`, w którym będziemy umieszczać współdzielony kod. Przede wszystkim interfejsy.

Pisanie kodu zaczniemy od zdefiniowania interfejsów danych wyjściowych z przetwarzania tabeli. Zamiast trzymania polskich nazw jak w nagłówku tabeli:

```
NAZWISKO
IMIĘ
DRUGIE IMIĘ
MIEJSCOWOŚĆ
IZBA ADWOKACKA
STATUS
SZCZEGÓŁY
```

Zdecydujemy się na ich angielskie odpowiedniki

```
export enum LawyerStatus {
    active = "Wykonujący zawód",
    former = "Były adwokat",
    inavtive = "Niewykonujący zawodu",
    undefined = ""
}

export interface Output {
    surname: string
    name: string
    second_name: string
    city: string
    office: string
    status: LawyerStatus
    link: string
}
```

i umieścimy je w pliku `helpers.ts`

W `entry.ts` znajdzie się kod który na plikach wykona klasyczną procedurę mapowania i redukcji.

Plik zaczyna się od niezbędnych importów

```ts
import fs from 'fs';
import cheerio from 'cheerio';

import {LawyerStatus, Output} from './helpers'
```

Następnie dodajemy funkcję odczytującą pliki i oddającą tablicę z ich zawartościami.

```ts
const getFiles = (): string[] => fs
    .readdirSync(process.cwd() + `/raw`)
    .filter((name) => /^\d+\.html/.test(name))
    .map(name =>
        fs.readFileSync(process.cwd() + '/raw/' + name).toString()
    );
```

Kolejną funkcją, kluczową dla tego skryptu jest `processFile`, która za pomocą `cheerio` przetwarza ciągi znaków z `html` na tablice z danymi adwokatów, które zawarte są w tabeli.

```ts
const processFile = (content: string): Output[] => cheerio
    .load(content)('.rejestr tbody tr')
    .toArray()
    .map(row => ({
        surname: cheerio(row).find('td:nth-of-type(2)').text(),
        name: cheerio(row).find('td:nth-of-type(3)').text().trim(),
        second_name: cheerio(row).find('td:nth-of-type(4)').text(),
        city: cheerio(row).find('td:nth-of-type(5)').text(),
        office: cheerio(row).find('td:nth-of-type(6)').text(),
        status: cheerio(row).find('td:nth-of-type(7)').text() as LawyerStatus,
        link: cheerio(row).find('td:nth-of-type(8) a').attr('href') || '',
    }))
```

Ponieważ każda podstrona tabeli zwraca osobną tablicę, musimy połączyć je w jedną aby uniknąć problemów z nienaturalną dla naszych potrzeb paginacją. Pomoże nam w tym funkcja `reducer`.

```ts
const reducer = (a:Output[], b:Output[]):Output[] => [...a, ...b];
```

Cały program to po prostu wykonanie kolejno tych funkcji, tak aby przekazywały sobie nawzajem wyniki jako argumenty.

```ts
const main = () => {
    return getFiles().map(processFile).reduce(reducer);
}
```

Finalnie tworzymy katalog `out` i umieszczamy w nim plik `basic_data.json` z danymi odczytanymi z plików

```
const out = main();

!fs.existsSync(process.cwd() + '/out') && fs.mkdirSync(process.cwd() + '/out', {recursive: true})
fs.writeFileSync(process.cwd() + '/out/basic_data.json', JSON.stringify(out))

console.dir(out)
```

Wykonanie:

```
ts-node entry.ts
```

zajmuje pół minuty

```
35.95s user 0.98s system 125% cpu 29.466 total
```

i generuje plik o wadze `5.1M`

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-18-08-48.png)

Repozytorium z kodem można znaleźć tutaj:

[Processing tables with lawyers data (1b87854f) · Commits · gustawdaniel / lawyers-scraper

GitLab.com

![](https://assets.gitlab-static.net/assets/touch-icon-ipad-retina-8ebe416f5313483d9c1bc772b5bbe03ecad52a54eba443e5215a22caed2a16a2.png)GitLab

![](https://assets.gitlab-static.net/assets/gitlab_logo-7ae504fe4f68fdebb3c2034e36621930cd36ea87924c11ff65dbcb8ed50dca58.png)](https://gitlab.com/gustawdaniel/lawyers-scraper/-/commit/1b87854fd741d6bfc10f8c36c21b7390a3095260)

## Pobranie podstron

Pobranie podstron zrealizujemy już nie przez `wget` lecz w `node`. W pliku `helpers.ts` umieścimy pomocniczy kod do odczytu wytworzonego właśnie zbioru danych bazowych.

```
import {readFileSync} from "fs";

export const getConfig = () => JSON.parse(readFileSync(process.cwd() + '/out/basic_data.json').toString());
```

Bardzo pomocne przy scrapingu jest kolorowanie na zielono poprawnie wykonanych requestów oraz na czerwono tych zakończonych błędem.

Mimo, że istnieją gotowe biblioteki do kolorowania, w tak prostym przypadku wygodniej jest zapisać kolory w stałych.

Nowy plik `scraper.ts` zaczniemy właśnie od importów i definiowania kolorów.

```ts
import fs from "fs";
import axios from 'axios';
import {getConfig} from "./helpers";

const Reset = "\x1b[0m"
const FgRed = "\x1b[31m"
const FgGreen = "\x1b[32m"
```

Kolejną obok graficznego oznaczania sukcesu i porażki cenną informacją jest czas. Dlatego w kolejnych liniach zdefiniujemy sobie zmienne pozwalające przechowywać punkty czasowe rozpoczęcia programu oraz zakończenia poprzedniej pętli.

```ts
const init = new Date().getTime();
let last = new Date().getTime();
```

W funkcji `main` umieścimy kod pobierający zbiór danych bazowych i iterujący po nim w celu pobrania wszystkich linków i zapisania stron w plikach.

```ts
const main = async () => {
    const links = getConfig().map((a:{link:string}):string => a.link);

    while (links.length) {
        const link = links.pop();
        const name = link.split('/').reverse()[0];
        const {data, status} = await axios.get(link);
        fs.writeFileSync(process.cwd() + `/raw/${name}.html`, data);
        const now = new Date().getTime();
        console.log(status === 200 ? `${FgGreen}%s\t%s\t%s\t%s\t%s${Reset}` : `${FgRed}%s\t%s\t%s\t%s\t%s${Reset}`, status, links.length, now - last, now - init, name);
        last = new Date().getTime();
    }
}
```

Najmniej oczywiste jest tu wyświetlanie, ale napiszę tylko, że dzięki znacznikom z kolorami mamy tu zielone lub czerwone linie. Prezentują one kolejno.

* kod odpowiedzi (spodziewany to 200)
* ilość pozostałych do końca rekordów
* czas od ostatniego wykonania pętli w ms
* czas od początku działania programu w ms
* nazwę tworzonego pliku

Wykonanie to linia:

```ts
main().then(() => console.log("ok")).catch(console.error);
```

Tak wyglądają przykładowe wywołania, jedno z, a drugie bez zapisu plików.

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-18-30-20.png)

Widać, że nie różnią się od siebie w zauważalny sposób i średni czas na zapis jednego adwokata to koło 150 ms. Daje to łącznie `27190*0.15` = `4078` sekund. Jednak to więcej niż `3600`. Ponad godzina!

Nie możemy sobie na to pozwolić, ponieważ w tytule artykułu obiecuję, że pobierzemy te dane w czasie krótszym niż godzinę, a ponad 8 minut zużyto już na pobranie bazowych danych.

## Jednoczesne żądania

Na szczęście dzięki możliwości wysyłania kolejnych żądań zanim spłyną wyniki z poprzednich jesteśmy w stanie podnieść szybkość pobierania z około `6.6` plików na sekundę (1 plik co 150 ms) do około `40` plików na sekundę (średnio 1 plik co 25 ms).

Finalnie wynik pobierania to `27191/(11*60+24.20)` = `39.74` plików / sekundę. Czyli łączny czas wyniósł 11 minut 24 sekundy zamiast szacowanej w poprzednim akapicie 1 godziny i 8 minut.

Jak udało się tak bardzo podnieść czas pobierania danych? Spójrzmy na kod. Przede wszystkim zacząłem od dołączenia dwóch kolejnych zmiennych:

```ts
let queueLength = 0;
const MAX_QUEUE_LENGTH = 500;
```

Stała oznacza liczbę plików które mogą być jednocześnie przetwarzane. To znaczy, że jeśli czekamy na 500 plików jednocześnie, to skrypt nie będzie wysyłał kolejnych żądań. Nie ma to sensu, bo nie chcemy przecież niepotrzebnie obciążyć zbyt dużej ilości RAM ani zostać odcięci przez serwer z powodu przekroczenia liczby żądań, które ten może zakolejkować.

Stała `queueLength` jest naszą aktualną liczbą żądań, które wysłaliśmy i na których odpowiedzi jeszcze czekamy.

Całą logikę, która wcześniej znalazła się w `main` przenosimy do funkcji `append`. Jej zadaniem jest załączenie żądania do kolejki.

```ts
const append = async (links: string[]) => {
    queueLength++;
    const link: string = links.pop() || '';
    const name = link.split('/').reverse()[0];
    const {data, status} = await axios.get(link);
    fs.writeFileSync(process.cwd() + `/raw/${name}.html`, data);
    const now = new Date().getTime();
    console.log(status === 200 ? `${FgGreen}%s\t%s\t%s\t%s\t%s\t%s${Reset}` : `${FgRed}%s\t%s\t%s\t%s\t%s\t%s${Reset}`,
        status, links.length, queueLength, now - last, now - init, name
    );
    last = new Date().getTime();
}
```

Od poprzedniego kodu różni się tym, że podnosi `queueLength` oraz wyświetla jej aktualną wartość.

Do tego dołączamy funkcję `sleep`, która pozwoli nam na odczekiwania między kolejnymi żądaniami.

```ts
const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time))
```

Jak widać przy wysyłaniu wielu żądań jednocześnie ważne są mechanizmy zabezpieczające nas przed ryzykiem, że przygnieciemy serwer nadmierną ilością ruchu sieciowego i doprowadzimy do gubienia się pakietów.

Sama funkcja `main` przyjmuje teraz rolę tę samą co ostatnia, le nie czeka na wypełnianie `promises` z funkcji `append`. Zamiast tego limituje jej wywołania na podstawie oczekiwania na `sleep` i warunku nie przekroczenia `MAX_QUEUE_LENGTH`.

```ts
const main = async () => {
    const links = getConfig().map((a: { link: string }): string => a.link);

    while (links.length) {
        await sleep(9);
        if (queueLength < MAX_QUEUE_LENGTH)
            append(links).finally(() => queueLength--)
    }
}
```

Poniżej widzimy fragment z wywołania tak przepisanego programu:

Kod można sprawdzić w commicie:

[Parallel scraping of profile pages (ca8895f1) · Commits · gustawdaniel / lawyers-scraper

GitLab.com

![](https://assets.gitlab-static.net/assets/touch-icon-ipad-retina-8ebe416f5313483d9c1bc772b5bbe03ecad52a54eba443e5215a22caed2a16a2.png)GitLab

![](https://assets.gitlab-static.net/assets/gitlab_logo-7ae504fe4f68fdebb3c2034e36621930cd36ea87924c11ff65dbcb8ed50dca58.png)](https://gitlab.com/gustawdaniel/lawyers-scraper/-/commit/ca8895f1d3474881269fbf3ef088a7ff03f9010f)

## Przetworzenie stron profilowych

Kiedy mamy już podstrony z profilami adwokatów, możemy utworzyć ostatni już plik `parser.ts` i za jego pomocą wzbogacić bazowy zbiór danych o informacje widoczne na stronach profilowych. Zanim jednak przejdziemy do kodu skupimy się na danych, jakie chcemy zebrać o prawnikach o różnych statusach:

```
export interface ActiveOutput {
    id: string
    date: string
    address: string
    phone: string
    email: string
    workplace: string
    speciality: string[]
}

export interface FormerOutput {
    id: string
    date: string
    date_end: string
    last_place: string
    replaced_by: string
}

export interface UndefinedOutput {
    id: string
}

export interface InactiveOutput {
    id: string
    date: string
}

export type ExtraOutput = ActiveOutput | FormerOutput | UndefinedOutput | InactiveOutput
```

Status "Undefined" oznacza prawnika, który nie ma statusu. Jest w tej bazie kilku takich prawników, często jest to związane ze znalezieniem duplikatu konta. Nie będziemy w to wnikać, bo to margines tej bazy.

W pliku `parser.ts` dołączamy importy

```ts
import {FormerOutput, getConfig} from "./helpers";
import {Output, ExtraOutput, LawyerStatus} from './helpers'
import {readFileSync, writeFileSync} from "fs";
import cheerio from 'cheerio';
```

Ponieważ teksty są często wypełnione znakami nowej linii i pustymi znakami między nimi zwykły `trim` nie wystarczy. Dlatego napisaliśmy funkcję do czyszczenia tekstów wieloliniowych

```ts
const cleanText = (text: string): string => text.split(/[\n|\t]/).map((t: string): string => t.trim()).filter(t => t).join('\n');
```

Samo przetwarzanie plików wygląda tak samo jak zawsze, z tym, że zależy ono od statusu prawnika

```ts
const processFile = (content: string, status: LawyerStatus): ExtraOutput => {
    const $ = cheerio.load(content);

    const section = (n: number): string => `section .line_list_K div:nth-of-type(${n}) div:nth-of-type(1)`

    const id = $('main section h3').text();

    switch (status) {
        case LawyerStatus.active:
            return {
                id,
                date: $(section(2)).text(),
                address: cleanText($('.line_list_K div:nth-of-type(3) div:nth-of-type(1)').text()),
                phone: $('.line_list_K div:nth-of-type(4) div:nth-of-type(1)').text(),
                email: (el => el.attr('data-ea') + `@` + el.attr('data-eb'))($('.line_list_K div:last-of-type div:nth-of-type(1)')),
                speciality: $('.line_list_A > div').toArray().map((el): string => cheerio(el).text().trim()),
                workplace: cleanText($('.mb_tab_content.special_one .line_list_K').text())
            };
        case LawyerStatus.former:
            return {
                id,
                date: $(section(2)).text(),
                date_end: $(section(3)).text().trim(),
                last_place: $(section(4)).text().trim(),
                replaced_by: $(section(5)).text().trim()
            }
        case LawyerStatus.inavtive:
            return {
                id,
                date: $(section(2)).text(),
            }
        case LawyerStatus.undefined:
            return {
                id
            }
    }
}
```

Kolejny dość przewidywalny fragment kodu to funkcja `main`.

```ts
let initDate = new Date().getTime();
let lastDate = new Date().getTime();

const main = () => {
    const lawyers = getConfig().reverse().filter((e: Output, i: number) => i < Infinity);
    const res: (Output & ExtraOutput)[] = [];

    while (lawyers.length) {
        const lawyer = lawyers.shift();
        const name = lawyer.link.split('/').reverse()[0];
        const extraLawyerInfo = processFile(readFileSync(process.cwd() + `/raw/${name}.html`).toString(), lawyer.status)

        res.push({...lawyer, ...extraLawyerInfo});

        if (lawyers.length % 100 === 0) {
            const now = new Date().getTime();
            console.log(res.length, lawyers.length, now - lastDate, now - initDate);
            lastDate = new Date().getTime();
        }
    }

    return res;
}
```

Na końcu zapis pliku

```ts
const out = main();
writeFileSync(process.cwd() + '/out/extended_data.json', JSON.stringify(out))
```

Wykonanie tego pliku pokazuje kolumny z

* ilością przetworzonych plików
* ilością pozostałych plików
* czasem miedzy kolejnymi setkami
* łącznym czasem od włączenia aplikacji

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-20-17-27.png)

Przetworzenie każdej setki plików zajmuje około 340 ms. Co oznacza mniej więcej 300 na sekundę, czyli całość powinna zająć około półtorej minuty. Faktycznie:

```
ts-node parser.ts  124.32s user 1.81s system 131% cpu 1:35.98 total
```

Wygenerowany plik z danymi dotyczącymi prawników warzy `13MB`

```
du -h out/extended_data.json
13M	out/extended_data.json
```

Jeśli chcesz pobrać ten plik, znajduje się on pod linkiem:

> [https://gitlab.com/gustawdaniel/lawyers-scraper/-/raw/8259451e89ef695a89576a8229c440301c53009e/out/extended\_data.json](https://gitlab.com/gustawdaniel/lawyers-scraper/-/raw/8259451e89ef695a89576a8229c440301c53009e/out/extended_data.json)

## Załadowanie danych do bazy

Plik `json` jest bardzo wygodny jako nośnik wymiany danych. Nie nadaje się niestety do tego, żeby bezpośrednio wygodnie go przetwarzać i budować na nim zapytania. Na szczęście od załadowania tego pliku do bazy `mongo` dzieli nas tylko jedna komenda. Jest to:

```bash
mongoimport --db test --collection lawyer --jsonArray --drop --file ./out/extended_data.json
```

Pokaże ona

```bash
2021-02-17T20:26:58.455+0100	connected to: mongodb://localhost/
2021-02-17T20:26:58.455+0100	dropping: test.lawyer
2021-02-17T20:27:00.013+0100	27191 document(s) imported successfully. 0 document(s) failed to import.
```

Włączając bazę poleceniem

```
mongo test
```

dostaniemy się do konsoli z której możemy wykonywać zapytania:

```
db.lawyer.aggregate([{$group:{_id: "$status", sum:{$sum: 1}, link:{$first: "$link"}}}])
```

Zwróci rozkład względem wykonywanych zawodów i przykładowe linki:

```
{ "_id" : "", "sum" : 7, "link" : "https://rejestradwokatow.pl/adwokat/jawor-marcin-51297" }
{ "_id" : "Niewykonujący zawodu", "sum" : 4410, "link" : "https://rejestradwokatow.pl/adwokat/konopacka-izabela-83958" }
{ "_id" : "Wykonujący zawód", "sum" : 19930, "link" : "https://rejestradwokatow.pl/adwokat/konrad-adam-33796" }
{ "_id" : "Były adwokat", "sum" : 2844, "link" : "https://rejestradwokatow.pl/adwokat/konopiski-sawomir-48480" }
```

Dzięki interfejsowi Compass możemy przeglądać znacznie więcej takich grupowań w trybie graficznym

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-20-33-57.png)

Jeśli chcemy wrzucić te dane do mongo atlas możemy użyć komendy

```
mongoimport --collection lawyer <connection-string>  --jsonArray --drop --file ./out/extended_data.json
```

gdzie `connection-string` to ciąg znakowy pozwalający łączyć się z bazą:

```
mongodb+srv://user:pass@cluseter_number.mongodb.net/db_name
```

W mongo charts możemy w chwilę wyklikać kilka wykresów, np wspomniany wcześniej rozkład statusu prawników

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-21-01-11.png)

Interaktywny wykres dostępny do zagnieżdżenia jako `iframe` możemy zobaczyć poniżej.

Kolejny wykres przedstawia roczną liczbę wpisów do rejestru. Można się było spodziewać, że w danych pobieranych z internetu są błędy. Tak było i tym razem. Musieliśmy wyrzucić wszystkie wpisy pozbawione dat, z datami "0000-00-00" i jeden z datą "2019-00-01". za pomocą filtru

```json
{status: {$ne: ""}, date:{$nin: ["","0000-00-00","2019-00-01"]}}
```

Po dodaniu wyliczanego pola z datą i rokiem:

```json
{computed_date: {
  $dateFromString: {
    dateString: "$date"
  }
},
  year:  {$year:{
  $dateFromString: {
    dateString: "$date"
  }
}}
}
```

Możemy zdefiniować wykres

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-21-34-30.png)

Podobnie przygotowujemy wykres ze średnią liczbą specjalizacji

Za pomocą konfiguracji

![](../../../../assets/2021-02-18/Screenshot-from-2021-02-17-21-46-31.png)

możemy pokazać częstotliwość wybieranych specjalizacji

Na koniec załączam tabelę z danymi kontaktowymi. Nie zawiera ona wszystkich adwokatów, lecz jedynie tych mających poprawne numery telefonów, czyli spełniających warunek

```json
{phone: /^(\d|-)+$/}
```

Mam nadzieję, że lektura tego wpisu rozszerzyła Twój arsenał narzędzi do scrapingu i wizualizacji danych. Jeśli chcesz porozmawiać o projektach z tego zakresu, myślisz o zamówieniu scrapingu lub po prostu chcesz wymienić się doświadczeniem zapraszam do kontaktu.

[Daniel Gustaw

Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.

![](https://assets.calendly.com/assets/touch-icon-ipad-retina-7a95e0c775301f4c0a22002bdf0a95d3c2b9cbe95af29c64f9c9573bac1f01e4.png)Calendly

![](https://assets.calendly.com/assets/ogimage-a63bb2f442cd9e6345a5e4d7fe75393c6cfcc1ff29e48e858742d43573a8b02c.png?source&#x3D;opengraph)](https://calendly.com/gustaw-daniel)
