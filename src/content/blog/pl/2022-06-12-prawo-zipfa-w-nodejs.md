---
author: Daniel Gustaw
title: Analiza Prawa Zipfa w Node.js
canonicalName: prawo-zipfa-w-nodejs
slug: pl/prawo-zipfa-w-nodejs
publishDate: 2022-06-11T22:50:51.000Z
updateDate: 2022-06-11T23:06:08.000Z
tags: ['nodejs', 'zipf', 'typescript']
description: Naucz się jak odczytywać duże pliki w Node.js, zliczać wystąpienia słów używając obiektu Map oraz radzić sobie z limitami pamięci.
excerpt: Naucz się jak odczytywać duże pliki w Node.js, zliczać wystąpienia słów używając obiektu Map oraz radzić sobie z limitami pamięci.
coverImage: http://localhost:8484/9ce72a45-8820-4738-8ccb-71dae040e3ee.avif
---

Prawo Zipfa mówi, że jeśli posortuje się słowa w danym języku względem częstości ich występowania, to to częstość będzie odwrotnie proporcjonalna do pozycji (rangi) słowa.

Innymi słowy występuje liniowa zależność o ujemnym współczynniku między logartymami częstotliwości i rangi, co widać na wykresie w skali logarytmiczno-logarytmicznej.

![](http://localhost:8484/6239ac87-abab-42ec-8187-c0cc1048c36f.avif)

lub dzięki prostemu przekształceniu:

$$
f * r = const \Leftrightarrow \log(f *r) = const \Leftrightarrow \log(f) = const - \log(r)
$$

[Zipf’s law - Wikipedia](https://en.wikipedia.org/wiki/Zipf%27s_law)

Wiemy, że jest to prawdą i na Wikipedii można znaleźć wykresy wykonane na podstawie korpusów z wielu języków. My sprawdzamy to dla zabawy i z miłości do nauki.

Teksty do wzięliśmy z Ukraińskiego prawodawstwa, pół miliarda słów powinno wystarczyć.

[Corpora: lang-uk](https://lang.org.ua/en/corpora/)

Na stronie mamy wersję z tokenizacją, czyli podziałem na słowa, i lematyzacja, która dodatkowo scala odmian słów zastępując je domyślną nie odmienioną formą. Więcej o tokenizacji i lemmatyzacji możecie przeczytać pod linkiem:

[https://medium.com/mlearning-ai/nlp-tokenization-stemming-lemmatization-and-part-of-speech-tagging-9088ac068768](https://medium.com/mlearning-ai/nlp-tokenization-stemming-lemmatization-and-part-of-speech-tagging-9088ac068768)

## Przygotowanie danych od analizy

Dla nas wygodniejsza będzie lematyzacja, bo nie chcemy analizować treści, a jedynie statystyki tego słownictwa. Pobieramy plik

```bash
wget https://lang.org.ua/static/downloads/corpora/laws.txt.lemmatized.bz2
```

rozpakowujemy go:

```
tar -xf laws.txt.lemmatized.bz2
```

i przygotowujemy jego skrót, aby móc testować aplikację na mniejszym pliku

```
head -n 200 laws.txt.lemmatized > laws.txt.lemmatized.head
```

Statystyki pliku wejściowego prezentują się następująco

```
wc laws.txt.lemmatized
43230994  580844603 7538876115 laws.txt.lemmatized

du -h laws.txt.lemmatized
7,1G	laws.txt.lemmatized
```

## Czytanie pliku w Node.js

Startujemy projekt poleceniami

```
npm init -y && tsc --init
```

Instalujemy paczki `esbuild esbuild-node-tsc` do budowania projektu oraz `dayjs` do mierzenia czasu wykonywania programu.

```
npm i -D esbuild esbuild-node-tsc
npm i dayjs
```

w pliku `Makefile` umieszczamy

```
run:
	etsc && node ./dist/index.js
```

dzięki czemu poleceniem `make run` będziemy mogli kompilować i włączać nasz program. Jest to co prawda więcej konfiguracji niż `ts-node` ale szybkość kompilacji jest 4 razy wyższa.

Z uwagi na wielkość pliku nie wypada pisać `fs.readFileSync` choć pewnie większość z Was ma powyżej 8GB ram. Załóżmy jednak, że chcemy napisać program, który obsłuży większe pliki nie nakładając ograniczeń związanych z koniecznością ładowania ich w całości do pamięci operacyjnej.

Posłuży nam do tego konstrukcja

```typescript
import readline from "readline";
import fs from "fs";

async function main() {
    const path = process.cwd() + '/laws.txt.lemmatized.head';

    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        console.log(line)
    }
}

main().catch(console.log)
```

ten kod umieszczamy w pliku `src/index.ts`. Opcja `crlfDelay` pozwala czytać poprawnie pliki z `\r\n`, dobrze jest ją na wszelki wypadek dołączać. Widzimy, że pierwsza linia zawierająca `await` to dopiero pętla `for`. Dzięki temu możemy zacząć przetwarzanie pliku zanim odczyt dojdzie do jego końca.

## Zliczanie ilości wystąpień słów

Teraz dołączymy zliczanie wystąpień słów i umieścimy je w mapie.

```typescript
    const map = new Map<string, number>()
```

`console.log` w pętli `for` możemy zastąpić przez

```typescript
        line.split(' ').forEach(word => {
            if (map.has(word)) {
                map.set(word, (map.get(word) || 0) + 1)
            } else {
                map.set(word, 1)
            }
        })
```

po zakończeniu pętli sortujemy mapę względem częstości wystąpień

```typescript
    const sortedAsc = new Map([...map].sort((a, b) => (a[1] < b[1] ? 1 : -1)));
```

formujemy tekst pliku wyjściowego

```typescript
    const out = [...sortedAsc.entries()].reduce((p, n) => `${p}\n${n[1]},${n[0]}`, ``)
```

i zapisujemy plik

```typescript
    fs.writeFileSync(process.cwd() + '/out', out)
```

Właściwie to tyle. Po włączeniu programu z całym plikiem spodziewamy się dostać plik z dwiema kolumnami - ilością zliczeń i słowem. Jednak bez żadnej informacji zwrotnej na jakim etapie jesteśmy, ciężko było by stwierdzić czy program działa poprawnie, czy się zawiesił i ile jeszcze będziemy czekać na wynik.

## Dekoracja programu logami

Zaczniemy od importu dayjs, w celu pokazywanie czasu. Zwykle nie należy instalować bibliotek które nie są potrzebne, ale natywny obiekt Date do niczego się nie nadaje.

```
console.log('Time', dayjs().diff(s))
```

```typescript
import dayjs from 'dayjs'
```

Na początku funkcji `main` definiujemy zmienną z czasem początku wykonywania

```typescript
    const s = dayjs()
```

Przed pętlą definiujemy licznik

```typescript
    let i = 0;
```

a w pętli pokazujemy jego wartość oraz czas od włączenia

```typescript
        i++;
        if (i % 1e5 === 0) {
            console.log(`I`, i, `T`, dayjs().diff(s))
        }
```

Dzięki temu wiedząc, że plik ma 43 miliony linii możemy szacować kiedy program się zakończy. Na samym końcu funkcji `main` możemy dodać

```typescript
    console.log('Time', dayjs().diff(s))
```

Alternatywą dla tego podejścia jest `console.time`.

## Uruchomienie programu i problem z pamięcią

Po uruchomieniu początkowo wszystko szło dobrze, aż do fatalnego błędu `heap out of memory`.

![](http://localhost:8484/75262dcb-25cd-46a0-9a22-2e580b0d4652.avif)

Co istotne, komputer nie zawiesił się i miał zapas wolnej pamięci. Stało się tak dlatego, że domyślny limit ustawiony na 2GB został przekroczony. Możemy sprawdzić ten limit poleceniem:

```bash
node -e 'console.log(v8.getHeapStatistics().heap_size_limit/(1024*1024))'
```

i podnieść go ustawiając odpowiednią flagę przy procesie `node`, w `Makefile`

```
run:
	etsc && node --max-old-space-size=4096 ./dist/index.js
```

Tym razem program zadziałał poprawnie i zapisał wynikowy plik po 5.5 minuty.

Jego pierwsze linie widzimy poniżej

```csv
14022692,
9279668,та
8653492,з
7907815,на
7890310,у
7462816,в
7090614,Україна
6233283,від
6075057,до
6042053,за
5698079,і
4811990,про
4300976,N
3969368,або
3863955,який
3547579,державний
3309810,що
3123859,1
3059829,для
3036979,закон
2992163,особа
2738219,не
2611769,згідно
2555994,стаття
2390347,із
2315387,орган
2275758,інший
2267005,2
2262961,а
2208099,рік
2038612,бути
1920091,вони
1836843,пункт
1785740,це
1737457,3
1584258,порядок
1573372,такий
1516880,частина
1424188,зміна
```

## Przygotowanie wykresu

Chcieli byśmy teraz zobaczyć plik, w którym pierwsza linia zawiera pozycję słowa, a druga ilość wystąpień. Tworzymy go poleceniem:

```
grep '\S' out | awk -F',' '{print NR, $1}' > log.txt
```

W tej linii `\S` odpowiada za odsianie pustych linii. Flaga `-F` pozwala ustawić `,` jako separator, a `NR` wstawia numer linii zaczynając od `1`.

Narysowanie wykresu wykonamy dzięki `gnuplot`

```
gnuplot -e "set ylabel 'Count'; set xlabel 'Rank'; set logscale xy; plot 'log.txt' with linespoints linestyle 1" -p
```

Flaga `-e` pozwala podać komendę a `-p` nie wyłącza wykresu po jego narysowaniu.

![](http://localhost:8484/ad6a0225-ab79-4797-9ef6-285c623bd87a.avif)

Widzimy, że wykres pokrywa się z tym, który widzieliśmy na Wikipedii.

![](http://localhost:8484/bc9c8b7d-7019-4011-97a1-d2ac6549cdca.avif)

## Interpretacja wyników

Dzięki takiemu rozkładowi częstości słów, nauka języka może zostać przedstawiona jako przesuwanie się od znajomości najczęściej do najrzadziej znanych zwrotów. Możemy też sortować teksty względem ich trudności dla czytelników i dostosowywać je do poziomu ucznia. Jesteśmy też w stanie szacować jakie jest prawdopodobieństwo napotkania nie znanego słowa w danej próbce tekstu.

Wygląda na to, że pogłębienie tego tematu może mieć ciekawe praktyczne zastosowania.
