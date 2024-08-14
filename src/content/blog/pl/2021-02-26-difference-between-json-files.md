---
author: Daniel Gustaw
canonicalName: wyznaczenie-roznicy-plikow-json
date_updated: 2023-10-12
description: "Zobacz jak wyznaczyć różnicę między dwoma plikami\
  \ JSON. Jest to świetny przykład zastosowania funkcji rekurencyjnej."
excerpt: "Zobacz jak wyznaczyć różnicę między dwoma plikami\
  \ JSON. Jest to świetny przykład zastosowania funkcji rekurencyjnej."
publishDate: 2021-02-26
slug: pl/wyznaczenie-roznicy-plikow-json
tags:
  - diff
  - i18next
title: "Wyznaczenie różnicy plików JSON"
---


W tym artykule pokażemy jak napisać funkcję do wyznaczenia różnicy między dwoma plikami JSON.

Z edukacyjnego punktu widzenia jest to świetny przykład zastosowania funkcji rekurencyjnej. Z praktycznego jest to
przydatne narzędzie do pracy z tłumaczeniami.

Skryptu będziemy używali z poziomu linii komend:

```bash
node json-diff.js src/locales/en_old.json src/locales/en.json
```

Po takiej komendzie będziemy spodziewać się, że pliki zostaną odczytane i wszystkie klucze, które występują w pierwszym
pliku, ale nie ma ich w drugim pliku, zostaną wypisane na standardowym wyjściu.

Pokażemy teraz kod źródłowy pliku `json-diff.js`.

Zaczniemy od sprawdzenia, czy pliki wskazane jako argumenty istnieją:

```javascript
const fs = require('fs')

const pathBase = `${process.cwd()}/${process.argv[2]}`;
const pathComp = `${process.cwd()}/${process.argv[3]}`;

if (!fs.existsSync(pathBase)) {
  console.error(`File ${pathBase} not existst`);
  process.exit()
}

if (!fs.existsSync(pathComp)) {
  console.error(`File ${pathComp} not existst`);
  process.exit()
}
```

Następnie odczytujemy zawartość tych plików i konwertujemy JSON do obiektów

```javascript
const base = JSON.parse(fs.readFileSync(pathBase).toString());
const comp = JSON.parse(fs.readFileSync(pathComp).toString());
```

Teraz piszemy funkcję do znajdowania różnic

```javascript
function getDiff(a, b) {
  const res = {};

  for (let key in a) {
    if (a.hasOwnProperty(key)) {
      if (!b.hasOwnProperty(key)) {
        res[key] = a[key]
      } else {
        if (typeof a[key] === 'object') {
          res[key] = getDiff(a[key], b[key])
        }
      }
      if (res[key] && !Object.keys(res[key]).length) {
        delete res[key];
      }
    }
  }

  return res;
}
```

Jej zadaniem jest przyjęcie pary obiektów i przejście po kluczach pierwszego z nich (bazowego). Jeśli drugi obiekt (
odejmowany) jej nie posiada, to ten klucz należy włożyć do wyniku.

W przeciwnym wypadku należy sprawdzić, czy typ nie jest obiektem. Wówczas może się okazać, że należy wykonać sprawdzenie
wewnątrz tego klucza.

Tu mamy kluczową linię - użycie funkcji `getDiff` wewnątrz niej samej.

Na końcu kasujemy te klucze, dla których wartością jest pusty obiekt.

Ostatnią linią programu jest wypisanie wyników na ekranie

```javascript
process.stdout.write(JSON.stringify(getDiff(base, comp)))
```

Ten program nie obsługuje tablic. W przypadku plików z tłumaczeniami nie są potrzebne. Jeśli chcesz poczytać o bardziej
zaawansowanych metodach porównywania plików JSON. Dobrym punktem startu jest wątek na stack overflow.

[Using jq or alternative command line tools to compare JSON files

Are there any command line utilities that can be used to find if two JSON files are identical with invariance to
within-dictionary-key and within-list-element ordering? Could this be done with jq or

![](https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon.png?v&#x3D;c78bd457575a)Stack OverflowAmelio
Vazquez-Reina

![](https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon@2.png?v&#x3D;73d79a89bded)](https://stackoverflow.com/questions/31930041/using-jq-or-alternative-command-line-tools-to-compare-json-files)

Zobaczmy teraz, jak program działa w praktyce. Na plikach z tłumaczeniami. Pierwszy plik jest przygotowany ręcznie i
pokrywa wszystkie tłumaczenia w aplikacji `en_old.json`, drugi jest wygenerowany przez `i18next` nazywa się `en.json`.
Problem stanowi to, że `i18next` nie wykrył wszystkich tłumaczeń.

Na początku wykonałem pracę ręcznie. Posortowałem oba pliki w serwisie: `codeshack.io/json-sorter`

![](../../../assets/2021-02-26/diff-1.png)

https://codeshack.io/json-sorter/

Następnie w serwisie `diffchecker` wyznaczyłem różnice między

![](../../../assets/2021-02-26/diff-2.png)

https://www.diffchecker.com/yffDMWff

Teraz utworzyłem pik z brakującymi tłumaczeniami

```bash
node ../DevTools/json-diff.js src/locales/en_old.json src/locales/en.json > src/locales/en-codes.json
```

Plik wyświetlony i formatowany przez `jq` wygląda tak:

![](../../../assets/2021-02-26/diff-3.png)

Widzimy, że zawiera wszystkie brakujące klucze.

Importując pliki z tłumaczeniami możemy użyć paczki `deepmerge`. Plik z konfiguracją `i18n` mógł by wyglądać na przykład
tak:

```javascript
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import deepmerge from 'deepmerge'

import en from 'vuetify/lib/locale/en'
import pl from 'vuetify/lib/locale/pl'

Vue.use(VueI18n);

const messages = {
  en: deepmerge(
    require('@/locales/en-codes.json'),
    require('@/locales/en.json'),
    {$vuetify: en}
  ),
  pl: deepmerge(
    require('@/locales/pl-codes.json'),
    require('@/locales/pl.json'),
    {$vuetify: pl}
  ),
};

export default new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages,
})

export const languages = [
  {text: 'lang.pl', value: 'pl'},
  {text: 'lang.en', value: 'en'},
];
```

Jeśli chcesz wymienić doświadczenia, związane z automatyzacją pracy z tłumaczeniami zapraszam do komentowania. Chętnie
dowiem się jakich narzędzi używacie i czy też czasami piszecie własne pomocnicze skrypty czy polecacie jakiś zestaw
narzędzi jak

[Introduction

![](https://gblobscdn.gitbook.com/spaces%2F-L9iS6Wm2hynS5H9Gj7j%2Favatar.png?alt&#x3D;media)i18next documentation

![](https://app.gitbook.com/share/space/thumbnail/-L9iS6Wm2hynS5H9Gj7j.png)](https://www.i18next.com/)
