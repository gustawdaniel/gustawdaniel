---
author: Daniel Gustaw
canonicalName: scraping-facebooka-w-2021-roku
coverImage: http://localhost:8484/034f0b84-4b65-4157-8de6-cc9f01220f4f.avif
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

---

Mimo wielu trudności, twórca bota nadal nie jest na straconej pozycji. Front-end Facebooka nie jest rysowany na canvasie za pomocą webassmebly. Gdyby przepisano go na fluttera, problem był by naprawdę poważny. Jednak z taką obfuckacją, jaka jest stosowana na Facebooku można poradzić sobie dzięki następującej strategii.

1. Patrzymy nie na nazwy klas tylko na ich znacznie - style, które są do nich przypisane
2. Pobieramy aktualny CSS strony Facebooka, którą przeglądamy i rozkładamy ją na mapę klas i ich styli
3. Budujemy nasze stabilne meta selektory za pomocą styli używając np.: `{display:block}` zamiast `.d-block`.
4. Konwertujemy stabilne meta selektory do formy poprawnych tymczasowych selektorów działających dla tej konkretnej strony
5. Wydobywamy interesujące nas dane już bez problemów jak za starych dobrych czasów

Należy zaznaczyć, że niektóre style się powtarzają i znajdziemy wiele klas, które powodują takie samo stylowanie. Poniżej załączam histogram częstotliwości duplikacji styli dla selektorów w kodzie CSS Facebooka.

|Liczba równoważnych klas|Częstość wystąpień|
|---|---|
|1|6475|
|2|304|
|3|65|
|4|22|
|5|12|
|6|5|
|7|5|
|8|2|
|10|1|
|15|1|
|19|1|
|21|1|
|25|1|

Zaleca się korzystanie z tych, które się nie duplikują, ale obsługa pozostałych przypadków powoduje tylko podniesienie ilości możliwych kombinacji tymczasowych selektorów co nie wydaje się dużym kosztem, w szczególności jeśli zechcemy wykorzystać w naszych selektorach relacje między elementami drzewa DOM.

---

Prezentujemy teraz implementację tego konceptu w praktyce na przykładzie. Naszym celem jest ściągnięcie listy członków grupy.

> [https://www.facebook.com/groups/1590278311045624/members](https://www.facebook.com/groups/1590278311045624/members)

![](https://preciselab.fra1.digitaloceanspaces.com/blog/fb-scraping-in-2020/leads.png)

Na liście osób szukamy ramek otaczających całe elementy listy oraz ramki otaczającej teksty. Wśród nich zależy nam na tych, które mają umiarkowaną liczbę klas. Jedna to za mało, bo selektor nie był by zbyt precyzyjny, 10 to dużo, bo mimo precyzji mógł by nie być wystarczająco stabilny. Przykładowy działający selektor kod strukturyzujący tą listę wygląda tak.

Możemy zacząć od takiego kodu, który mapuje nam nazwę, kontekst, opis i awatar osoby w grupie

```javascript
[...document.querySelectorAll('div.ue3kfks5.pw54ja7n.uo3d90p7.l82x9zwi.a8c37x1j')].map(e => ({
    name: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg div.nc684nl6>a').innerText,
    context: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg :nth-child(2)')?.innerText,
    description: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))
```

Niestety o ile u mnie ten kod zadziałał, to u Ciebie może być z nim problem, ponieważ jest duża szansa, że Facebook wprowadził aktualizację zmieniającą nazwy klas. Dlatego właśnie chcemy stworzy meta-selektor, który będzie niezmiennym źródłem budującym selektory takie jak ten w oparciu o plik CSS Facebooka.

Oznacza to, że żeby utrwalić nasz kod musimy zamienić klasy na przypisane im style. W tym celu szukamy w źródle strony linku do pierwszego pliku CSS:

```scss
https://static.xx.fbcdn.net/rsrc.php/v3/yQ/l/0,cross/ArGQFhpa-mYIQaebMcDHPHgi1H0oF0i_rK0T6c_KgOBbWpC6CZY50c0PwrzoCWCCooTDwUJHUy3C2.css?_nc_x=JKmcfy-J-Ug
```

### TypeScript config

Następnie tworzymy plik `tsconfig.json` z zawartością

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "target": "ES2020",
    "moduleResolution": "node"
  }
}
```

Pierwsza własność - `esModuleInterop` pozwala nam na import zgodny ze specyfikacją modułów es6 bibliotek, które były modułami CommonJS. Np dzięki tej fladze możemy pisać:

```typescript
import fs from "fs";
```

zamiast

```typescript
import * as fs from "fs";
```

lub

```typescript
const fs = require("fs");
```

Kolejna: `"target": "ES2020"` pozwala nam na używanie nowych elementów specyfikacji, na przykład bez tej linii nie mogli byśmy użyć mapy `Set` do eliminacji duplikatów.

Ostatnia: `"moduleResolution": "node"` pozwala na bardziej elastyczny import paczek w TypeScript i jest zalecana do większości projektów. U nas rozwiązała problem z importem paczki `axios`.

### Zależności - Package.json

Kolejnym ważnym plikiem jest `package.json`, w naszym przypadku wygląda on tak:

```json
{
  "name": "fb-scraping-tools",
  "version": "1.0.0",
  "description": "Set of tools created to make scraping facebook easy.",
  "author": "Daniel Gustaw",
  "license": "WTFPL",
  "dependencies": {
    "axios": "^0.21.0",
    "md5": "^2.3.0",
    "ts-node": "^9.0.0"
  },
  "devDependencies": {
    "@types/md5": "^2.2.1",
    "@types/node": "^14.14.6",
    "typescript": "^4.0.5"
  }
}
```

Widzimy, że korzystamy tu z TypeScript, pobraliśmy kilka zestawów typów do podpowiadania składni, poza tym `axios` do wysyłania żądań http oraz `md5` do wyliczania sum kontrolnych z adresów `url`.

### Dekompozycja styli Facebooka

Przejdziemy teraz do najciekawszej części, czyli rozkładu styli Facebooka na mapę klas i styli oraz odwrotną mapę przypisującą kolekcję selektorów określonym stylom.

Plik `decompose_css_to_json.ts` zaczynamy od importu wymaganych paczek:

```typescript
import axios from "axios";
import md5 from "md5";
import fs from "fs";
```

Są to proste paczki, które opisaliśmy już przy okazji omawiania pliku z zależnościami. Kolejnym krokiem będzie definiowanie wymaganych typów.

```typescript
type StringAccumulator = Record<string, string>
type ArrayAccumulator = Record<string, string[]>
```

Tu nazwy mówią same za siebie, będą to typy w których nie znamy jeszcze kluczy, ale wiemy, że wartości są ciągami znakowymi, albo tablicami ciągów znakowych. Jest tak dlatego, że odwzorowanie styli do selektorów jest wielowartościowe.

Kolejnym krokiem jest nadanie programowi szkieletowej struktury:

```typescript
const CACHE_DIR = process.cwd() + `/.cache`;
const url = `https://static.xx.fbcdn.net/rsrc.php/v3/yQ/l/0,cross/ArGQFhpa-mYIQaebMcDHPHgi1H0oF0i_rK0T6c_KgOBbWpC6CZY50c0PwrzoCWCCooTDwUJHUy3C2.css?_nc_x=JKmcfy-J-Ug`;

const main = async (): Promise<void> => {
   // there will be placed source code of next part
};

main().catch(e => {
    console.error(e);
})
```

W stałych definiujemy adres pliku ze stylami Facebooka oraz lokalizację katalogu z cache. Następny krok jest bardzo przewidywalny, chcemy zapisać zawartość pliku w cache, lub odczytać ją z cache jeśli już była zapisana wcześniej. Dzięki temu uniezależnimy działanie programu od tego, czy link nie wygaśnie w przyszłości i obniżymy szansę zbanowania za zbyt częste requesty. Jest to ważny element pracy w pisaniu programów tego typu.

```typescript
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR);
    }

    const name = md5(url);
    const path = `${CACHE_DIR}/${name}.css`;
    let text = '';
    if (fs.existsSync(path)) {
        text = fs.readFileSync(path).toString()
    } else {
        const {data} = await axios.get(url);
        text = data;
        fs.writeFileSync(path, text);
    }
```

Mimo, że ważny, to nie odkrywczy i jedynym zadanie tego kodu jest przygotowanie zmiennych `path` z ścieżką do pliku `css` i `text` z jego zawartością.

Znacznie ciekawszym fragmentem jest sam rozkład. Polega on na rozbiciu styli za pomocą wyrażeń regularnych, a następnie budowaniu jednocześnie dwóch map.

```typescript
    const [styleToSelector, selectorToStyle]: [ArrayAccumulator, StringAccumulator] = text.match(/.*?\{.*?\}/g).reduce(
        (p: [ArrayAccumulator, StringAccumulator], n): [ArrayAccumulator, StringAccumulator] => {
            const [_, key, value]:string[] = n.match(/(.*?)\{(.*?)\}/);

            const cleanKey = key.replace(/^\}/,'')

            return [
                {...p[0], [value]: [cleanKey, ...(p[0][value] || [])]},
                {...p[1], [cleanKey]: value}
            ];
        }, [{}, {}]
    );
```

Zmienna `cleanKey` wprowadzona została, żeby poradzić sobie z klasami, występującymi za znakiem `}}`, co w plikach `css` jest możliwe. Utrata tego znaku `}` z wartości nie zmienia niczego, ponieważ wartości i tak są dla nas tylko identyfikatorami, a nie fragmentami stylizacji, którą mieli byśmy gdziekolwiek implementować.

Na końcu utrwalamy wyniki w plikach JSON.

```typescript
    fs.writeFileSync(path.replace(/css$/, 'styleToSelector.json'), JSON.stringify(styleToSelector));
    fs.writeFileSync(path.replace(/css$/, 'selectorToStyle.json'), JSON.stringify(selectorToStyle));
```

Program włączamy komendą

```bash
npx ts-node decompose_css_to_json.ts
```

Nie drukuje on wyników, ale tworzy trzy pliki w ukrytym katalogu `.cache`. Czas wykonywania tego programu to około

### Budowanie meta-selektorów na podstawie selektorów tymczasowych

Meta-selektorem nazywam selektor, którym nazwy klas są zastąpione identyfikującymi je zasadami stylowania. Tworzenie meta-selektorów jest potrzebne, żeby kod, który tworzymy był stabilny. Punktem wyjściowym do jego stworzenia jest selektor napisany w konsoli przeglądarki.

Program nazwiemy `generate_meta_selectors.ts`. W standardowym layoucie skryptu mamy zmienną `input`. W niej zapisujemy działające zapytanie strukturyzujące wyświetlaną stronę Facebookową. Wykonanie go w konsoli przeglądarki powinno zwrócić tablicę z obiektami odpowiadającymi uczestnikom grupy Facebookowej.

```typescript
import md5 from "md5";
import fs from "fs";

const input = `[...document.querySelectorAll('div.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.pfnyh3mw.d2edcug0.aahdfvyu.tvmbv18p div.ue3kfks5.pw54ja7n.uo3d90p7.l82x9zwi.a8c37x1j:not([aria-busy])')].map(e => ({
    name: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg div.nc684nl6>a').innerText,
    link: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg div.nc684nl6>a').href,
    context: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg :nth-child(2)')?.innerText,
    description: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))`;

const CACHE_DIR = process.cwd() + `/.cache`;
const url = `https://static.xx.fbcdn.net/rsrc.php/v3/yQ/l/0,cross/ArGQFhpa-mYIQaebMcDHPHgi1H0oF0i_rK0T6c_KgOBbWpC6CZY50c0PwrzoCWCCooTDwUJHUy3C2.css?_nc_x=JKmcfy-J-Ug`;

const main = async (): Promise<void> => {
	// there will be next part of presented program
};

main().catch(e => {
    console.error(e);
})
```

Teraz aby przetworzyć losowe klasy w selektorach na stabilne meta-selektory pobieramy zawartość pliku z mapą selektorów

```typescript
    const name = md5(url);
    const path = `${CACHE_DIR}/${name}.selectorToStyle.json`;
    const selectorToStyle = JSON.parse(fs.readFileSync(path).toString())
```

Tworzymy tablicę klas w dwóch krokach - pobierając ciągi w cudzysłowach, a następnie wycinając z nich ośmioznakowe ciągi cyfr i liter poprzedzone kropką

```typescript
    const classes = [...new Set(input.match(/'.*?'/g).join('').match(/\.\w{8}/g))];
```

Na podstawie tych klas oraz dzięki mapie pobranej do zmiennej `selectorToStyle` możemy wytworzyć tablicę podstawień

```typescript
    const replaces: [string, string][] = classes.map(c => [c, `{${selectorToStyle[c]}}`]);
```

Wartość tej zmiennej wyniosła w naszym przykładzie

```json
[
  [ '.rq0escxv', '{box-sizing:border-box}' ],
  [ '.l9j0dhe7', '{position:relative}' ],
  [ '.du4w35lb', '{z-index:0}' ],
  [ '.j83agx80', '{display:flex}' ],
  [ '.cbu4d94t', '{flex-direction:column}' ],
  [ '.pfnyh3mw', '{flex-shrink:0}' ],
  [ '.d2edcug0', '{max-width:100%}' ],
  [ '.aahdfvyu', '{margin-top:4px}' ],
  [ '.tvmbv18p', '{margin-bottom:4px}' ],
  [ '.ue3kfks5', '{border-top-left-radius:8px}' ],
  [ '.pw54ja7n', '{border-top-right-radius:8px}' ],
  [ '.uo3d90p7', '{border-bottom-right-radius:8px}' ],
  [ '.l82x9zwi', '{border-bottom-left-radius:8px}' ],
  [ '.a8c37x1j', '{display:block}' ],
  [ '.ew0dbk1b', '{margin-bottom:-5px}' ],
  [ '.irj2b8pg', '{margin-top:-5px}' ],
  [ '.nc684nl6', '{display:inline}' ]
]
```

Na końcu dokonujemy podmienienia klas na identyfikatory przypisane stylom

```typescript
    let out = input;

    replaces.forEach(r => {
        out = out.replace(new RegExp(r[0], 'g'), r[1])
    })
    console.log(out);
```

Widzimy naprawdę proste podstawienie dzięki temu, że każda klasa zawsze ma selektor w postaci stylu. To założenie potencjalnie mogło by nie być prawdą, ale Facebook stosuje skrypty minifikujące, które oczyszczają HTML z klas pozbawionych znaczenia.

Finalnie wynikiem działania tego programu włączonego komendą

```bash
 npx ts-node generate_meta_selectors.ts
```

jest tekst meta-selektora

```javascript
[...document.querySelectorAll('div{box-sizing:border-box}{position:relative}{z-index:0}{display:flex}{flex-direction:column}{flex-shrink:0}{max-width:100%}{margin-top:4px}{margin-bottom:4px} div{border-top-left-radius:8px}{border-top-right-radius:8px}{border-bottom-right-radius:8px}{border-bottom-left-radius:8px}{display:block}:not([aria-busy])')].map(e => ({
    name: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} div{display:inline}>a').innerText,
    link: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} div{display:inline}>a').href,
    context: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} :nth-child(2)')?.innerText,
    description: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))
```

Tak jak zapowiadałem, zamiast klas są tu ich znaczenia. Nazwy klas się zmieniają, ale znaczenia zostają. Teraz nadszedł czas, żeby zapisać ten meta-selektor jako stały element naszego programu np wbudowując go do wtyczki, która wykona go w stosownym momencie na stronie Facebooka. Na przykład kiedy strona zostanie zescrolowana do końca i interwał

```javascript
i = setInterval(() => window.scrollTo(0,document.body.scrollHeight), 1000);
```

przestanie podnosić wartość `document.body.scrollHeight`,

Nie możemy jednak tego kodu wykonać bezpośrednio, bo zawiera on selektory nie będące poprawnymi selektorami. Aby móc go wykonać musimy tą operację odwrócić. Do tego potrzebujemy oddzielnego skryptu.

### Odzyskanie prawdziwych i aktualnych selektorów dzięki meta-selektorom

Tworzymy plik `generate_temp_selector.ts`. Przyzwyczajeni do tego jak tego typu pliki wyglądają łatwo odnajdziemy się w części otaczającej ciało funkcji `main`.

```typescript
import md5 from "md5";
import fs from "fs";

const metaSelector = `[...document.querySelectorAll('div{box-sizing:border-box}{position:relative}{z-index:0}{display:flex}{flex-direction:column}{flex-shrink:0}{max-width:100%}{margin-top:4px}{margin-bottom:4px} div{border-top-left-radius:8px}{border-top-right-radius:8px}{border-bottom-right-radius:8px}{border-bottom-left-radius:8px}{display:block}:not([aria-busy])')].map(e => ({
    name: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} div{display:inline}>a').innerText,
    link: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} div{display:inline}>a').href,
    context: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} :nth-child(2)')?.innerText,
    description: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))`;


const CACHE_DIR = process.cwd() + `/.cache`;
const url = `https://static.xx.fbcdn.net/rsrc.php/v3/yQ/l/0,cross/ArGQFhpa-mYIQaebMcDHPHgi1H0oF0i_rK0T6c_KgOBbWpC6CZY50c0PwrzoCWCCooTDwUJHUy3C2.css?_nc_x=JKmcfy-J-Ug`;

const main = async (): Promise<void> => {

};

main().catch(e => {
    console.error(e);
})
```

Dane wejściowe do programu to ponownie `url` oraz ciąg znakowy, tym razem nazwany `metaSelector`. Celem funkcji `main` jest wydrukowanie na ekranie selektora używając drugiej mapy - tej przeprowadzającej style na selektory.

```typescript
    const name = md5(url);
    const path = `${CACHE_DIR}/${name}.styleToSelector.json`;
    const styleToSelector = JSON.parse(fs.readFileSync(path).toString())

    const selectors = [...new Set(metaSelector.match(/'.*?'/g).join('').match(/\{.*?\}/g))];
```

Zaczynamy tak jak ostatnio, ale tym razem szukamy selektorów, więc stosujemy odrobinę inny wyrażenia regularne i drugą z wygenerowanych map. Również tu chcemy stworzy listę zastąpień, ale różni się ona typem od tej stosowanej w poprzednim programie.

```typescript
    const replaces: [string, string[]][] = selectors.map(c => {
        const key = c.replace(/^\{/, '').replace(/\}$/, '');
        return [
            c,
            styleToSelector[key].filter((c: string) => /^\.\w{8}$/.test(c))
        ]
    });
```

Przykładowa wartość tej zmiennej to:

```json
[
  [ '{box-sizing:border-box}', [ '.ibamfamh', '.rq0escxv' ] ],
  [ '{position:relative}', [ '.jfde6mfb', '.l9j0dhe7' ] ],
  [ '{z-index:0}', [ '.du4w35lb' ] ],
  [ '{display:flex}', [ '.mmelxcy8', '.j83agx80' ] ],
  [ '{flex-direction:column}', [ '.pawmy52i', '.cbu4d94t' ] ],
  [ '{flex-shrink:0}', [ '.n0kn69sm', '.pfnyh3mw' ] ],
  [ '{max-width:100%}', [ '.d2edcug0' ] ],
  [ '{margin-top:4px}', [ '.aahdfvyu' ] ],
  [ '{margin-bottom:4px}', [ '.tvmbv18p' ] ],
  [ '{border-top-left-radius:8px}', [ '.ue3kfks5' ] ],
  [ '{border-top-right-radius:8px}', [ '.pw54ja7n' ] ],
  [ '{border-bottom-right-radius:8px}', [ '.uo3d90p7' ] ],
  [ '{border-bottom-left-radius:8px}', [ '.l82x9zwi' ] ],
  [ '{display:block}', [ '.a7hnopfp', '.a8c37x1j' ] ],
  [ '{margin-bottom:-5px}', [ '.ew0dbk1b' ] ],
  [ '{margin-top:-5px}', [ '.irj2b8pg' ] ],
  [ '{display:inline}', [ '.nc684nl6' ] ]
]
```

Niestety ze względu na wielowartościowość tego przekształcenia nie możemy użyć podmiany tak prostej jak ostatnio. Tym razem decydujemy się na kompromisy i piszemy kod, który usunie wszystkie wielowartościowe klasy. Możemy się z tym pogodzić ponieważ jak wskazaliśmy na początku, stanowią one nieznaczny procent wszystkich selektorów, jakie są stosowane.

```typescript
let out = metaSelector;

replaces.forEach(r => {
    out = out.replace(new RegExp(r[0], 'g'), r[1].length === 1 ? r[1][0] : '')
})
console.log(out);
```

Po wykonaniu programu komendą

```
npx ts-node generate_temp_selector.ts
```

dostaniemy gotowy do użycia kod strukturyzujący listę osób z grupy Facebooka:

```javascript
[...document.querySelectorAll('div.du4w35lb.d2edcug0.aahdfvyu.tvmbv18p div.ue3kfks5.pw54ja7n.uo3d90p7.l82x9zwi:not([aria-busy])')].map(e => ({
    name: e.querySelector('.ew0dbk1b.irj2b8pg div.nc684nl6>a').innerText,
    link: e.querySelector('.ew0dbk1b.irj2b8pg div.nc684nl6>a').href,
    context: e.querySelector('.ew0dbk1b.irj2b8pg :nth-child(2)')?.innerText,
    description: e.querySelector('.ew0dbk1b.irj2b8pg :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))
```

### Analiza wyników

Długość nowego selektora to 513 znaków w porównaniu z 639 dla selektora wejściowego, ale działa on świetnie. Dla grupy, którą analizowaliśmy mającej 4576 osób procedura automatycznego scrollingu w dół zajęła 90 minut.

![Szbybkość pozyskiwania leadów](https://preciselab.fra1.digitaloceanspaces.com/blog/fb-scraping-in-2020/lead-time.svg)

JSON z danymi ważył 2.1 MB. Po konwersji do formatu CSV komendą:

```bash
jq -r '.[] | ([.name,.context,.description,.link,.img] | @csv)' .cache/crypto.json > .cache/crypto.csv
```

powstały `.csv` miał 1.9 MB. Blisko połowa tych danych to adresy obrazków profilowych, które są dość długie, ale raczej działają od kilku godzin do kilku dni po pobraniu, nie dłużej, dlatego zalecam dodanie ich do kolejki pobierania przez osobny proces, jeśli chcemy je gromadzić. Łatwo możemy sprawdzić to dzięki utworzeniu pliku, który by ich nie posiadał:

```bash
jq '.[] | {name:.name,context:.context,description:.description,link:.link}' .cache/crypto.json > .cache/crypto-no-img.json
```

I sprawdzeniu rozmiaru tak powstałego pliku

```bash
du -ha .cache
332K    .cache/f3579000ff0b02d47dec7a17d043e454.selectorToStyle.json
360K    .cache/f3579000ff0b02d47dec7a17d043e454.styleToSelector.json
2.1M    .cache/crypto.json
1016K   .cache/crypto-no-img.json
336K    .cache/f3579000ff0b02d47dec7a17d043e454.css
1.9M    .cache/crypto.csv
6.0M    .cache
```

Te awatary same ważą 2.19 KiB i mają rozmiar 60x60 px. Łatwo można sprawdzić jaki był rozmiaru udział różnych typów danych w scrapingu:

![Procentowy udział typów danych w objętości scrapingu](https://preciselab.fra1.digitaloceanspaces.com/blog/fb-scraping-in-2020/data-volume.svg)

Należy zaznaczyć, że ze względu na realny rozmiar drzewa dom, w Facebooku, można szacować, że przeglądarka musiała wybudować kilkaset MB, żebyśmy mogli pobrać te dane. Przez cały czas scrolowania (90 minut) przeglądarka zużywała 100% rdzenia o taktowaniu 2GHz.

### Rekomendacja dla programistów Facebooka

Przepiszcie serwis na flutter, to scraping stanie się o całe rzędy wielkości droższy i praktycznie nieopłacalny w wielu przypadkach. Innym prostszym rozwiązaniem było by podniesienie ilości różnych klas mających ten sam styl i miksowanie ich za pomocą randomizerów, które powodowały by losowe wypadanie danych z selektorów opartych o te klasy. Owszem, pliki CSS były by cięższe, ale było by to mocne uderzenie w prezentowaną przeze mnie metodę.

### Rekomendacja dla tych, którzy scrapują

Wyścig zbrojeń w zakresie scrapingu wchodzi w coraz ciekawszą fazę. Automatyzacja jest wciąż częściowo możliwa, ale jej rozszerzanie wymaga coraz wyższych nakładów oraz badań nad odwzorowywaniem zachowań naturalnych dla użytkowników, tak aby pisane przez nas skrypty pozostawały nie wykryte mimo coraz bardziej wyrafinowanych metod ich detekcji.

Moim zdaniem na kontach przeznaczonych do scrapingu warto prowadzić normalne aktywności wykorzystując realne osoby przynajmniej w takim stopniu, aby generując taką naturalną aktywność przeplataną pracą bota można było obniżyć ryzyko klasyfikacji jako bot i uniknąć captha oraz banowania konta.

Należy pamiętać, że takie zbieranie danych jest niezgodne z regulaminem Facebooka, który mówi, że potrzebujemy na to pisemnej zgody.

[https://www.facebook.com/apps/site\_scraping\_tos\_terms.php](https://www.facebook.com/apps/site_scraping_tos_terms.php)

A ponieważ to są dane osobowe przetwarzane bez zgody właścicieli to w pewnych częściach świata jest to niezgodne z regulacjami takimi jak europejskie GDPR znane w Polsce jako RODO.

### Źródła

[http://www.proto.pl/aktualnosci/liczba-uzytkownikow-facebooka-zwieksza-sie-mimo-skandali](http://www.proto.pl/aktualnosci/liczba-uzytkownikow-facebooka-zwieksza-sie-mimo-skandali)

[https://www.wired.com/story/facebook-removes-accounts-ai-generated-photos/](https://www.wired.com/story/facebook-removes-accounts-ai-generated-photos/)

[https://stackoverflow.com/questions/56238356/understanding-esmoduleinterop-in-tsconfig-file](https://stackoverflow.com/questions/56238356/understanding-esmoduleinterop-in-tsconfig-file)

[https://www.typescriptlang.org/docs/handbook/module-resolution.html](https://www.typescriptlang.org/docs/handbook/module-resolution.html)

[https://about.fb.com/news/2020/10/taking-legal-action-against-data-scraping/](https://about.fb.com/news/2020/10/taking-legal-action-against-data-scraping/)

[https://www.octoparse.com/blog/5-things-you-need-to-know-before-scraping-data-from-facebook](https://www.octoparse.com/blog/5-things-you-need-to-know-before-scraping-data-from-facebook)
