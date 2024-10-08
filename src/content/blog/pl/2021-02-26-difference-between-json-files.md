---
author: Daniel Gustaw
canonicalName: calculating-the-difference-between-json-files
coverImage: http://localhost:8484/add30d50-3b0e-4cd7-9720-f990331f1806.avif
date_updated: 2023-10-12
description: Zobacz jak wyznaczyć różnicę między dwoma plikami JSON. Jest to świetny
  przykład zastosowania funkcji rekurencyjnej.
excerpt: Zobacz jak wyznaczyć różnicę między dwoma plikami JSON. Jest to świetny przykład
  zastosowania funkcji rekurencyjnej.
publishDate: 2021-02-26
slug: pl/wyznaczenie-roznicy-plikow-json
tags:
- diff
- i18next
title: Wyznaczenie różnicy plików JSON
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

[Using jq or alternative command line tools to compare JSON files](https://stackoverflow.com/questions/31930041/using-jq-or-alternative-command-line-tools-to-compare-json-files)

Zobaczmy teraz, jak program działa w praktyce. Na plikach z tłumaczeniami. Pierwszy plik jest przygotowany ręcznie i
pokrywa wszystkie tłumaczenia w aplikacji `en_old.json`, drugi jest wygenerowany przez `i18next` nazywa się `en.json`.
Problem stanowi to, że `i18next` nie wykrył wszystkich tłumaczeń.

Na początku wykonałem pracę ręcznie. Posortowałem oba pliki w serwisie: `codeshack.io/json-sorter`

![](http://localhost:8484/5459cca6-ed9e-4f75-8933-90306a6307fc.avif)

https://codeshack.io/json-sorter/

Następnie w serwisie `diffchecker` wyznaczyłem różnice między

![](http://localhost:8484/6028a6b5-ca6a-4baa-b16d-fb66a7199df3.avif)

https://www.diffchecker.com/yffDMWff

Teraz utworzyłem pik z brakującymi tłumaczeniami

```bash
node ../DevTools/json-diff.js src/locales/en_old.json src/locales/en.json > src/locales/en-codes.json
```

Plik wyświetlony i formatowany przez `jq` wygląda tak:

![](http://localhost:8484/dd621642-427b-4560-9f26-b08150f04e97.avif)

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

[Introduction](https://www.i18next.com/)
