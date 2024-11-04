---
author: Daniel Gustaw
canonicalName: calculating-the-difference-between-json-files
coverImage: http://localhost:8484/7f52c42e-103b-4ef9-b689-d08807ad2f7f.avif
description: Dowiedz się, jak znaleźć brakujące tłumaczenia w plikach JSON przy użyciu słowników.
excerpt: Dowiedz się, jak znaleźć brakujące tłumaczenia w plikach JSON przy użyciu słowników.
publishDate: 2021-02-26
slug: pl/obliczanie-roznicy-miedzy-plikami-json
tags:
- diff
- i18next
title: Obliczanie różnicy między plikami JSON
updateDate: 2023-10-12
---

W tym artykule pokażemy, jak stworzyć funkcję, która identyfikuje różnice między dwoma plikami JSON.

Z edukacyjnego punktu widzenia jest to doskonały przykład wykorzystania funkcji rekurencyjnych. Z praktycznego punktu widzenia to cenne narzędzie do zarządzania tłumaczeniami.

Na początek stworzymy polecenie, które odczyta pliki i wyświetli wszystkie klucze obecne w pierwszym pliku, ale brakujące w drugim pliku na standardowym wyjściu.

Zaczniemy od sprawdzenia, czy pliki wskazane jako argumenty istnieją:

```js
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

Następnie odczytamy zawartość tych plików i przekształcimy JSON na obiekty:

```javascript
const base = JSON.parse(fs.readFileSync(pathBase).toString());
const comp = JSON.parse(fs.readFileSync(pathComp).toString());
```

Teraz zdefiniujemy funkcję do wykrywania różnic:

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

Ta funkcja przyjmuje parę obiektów i iteruje przez klucze pierwszego (podstawowego) obiektu. Jeśli drugi obiekt (porównawczy) nie ma klucza, jest on dodawany do wyniku. Jeśli klucz jest obecny, sprawdza, czy typ jest obiektem i, jeśli tak, rekurencyjnie wywołuje funkcję getDiff.

Na koniec usuwamy klucze z pustymi obiektami przed wyświetleniem wyników:

```javascript
process.stdout.write(JSON.stringify(getDiff(base, comp)))
```

Ten program nie obsługuje tablic. Dla plików tłumaczeń nie są one konieczne. Jeśli chcesz przeczytać o bardziej zaawansowanych metodach porównywania plików JSON, dobrym punktem wyjścia jest wątek na Stack Overflow:

[Użycie jq lub alternatywnych narzędzi wiersza poleceń do porównywania plików JSON](https://stackoverflow.com/questions/31930041/using-jq-or-alternative-command-line-tools-to-compare-json-files)

Teraz zobaczmy, jak program działa w praktyce z plikami tłumaczeń. Pierwszy plik, en_old.json, został przygotowany ręcznie i obejmuje wszystkie tłumaczenia w aplikacji, podczas gdy drugi plik, en.json, został wygenerowany przez i18next. Problem polega na tym, że i18next nie wykrył wszystkich tłumaczeń.

Na początku ręcznie posortowałem oba pliki za pomocą usługi: codeshack.io/json-sorter

![](http://localhost:8484/5459cca6-ed9e-4f75-8933-90306a6307fc.avif)

https://codeshack.io/json-sorter/

Następnie użyłem `diffchecker`, aby znaleźć różnice między nimi:

![](http://localhost:8484/6028a6b5-ca6a-4baa-b16d-fb66a7199df3.avif)

https://www.diffchecker.com/yffDMWff

A potem stworzyłem plik z brakującymi tłumaczeniami:

```bash
node ../DevTools/json-diff.js src/locales/en_old.json src/locales/en.json > src/locales/en-codes.json
```

Plik, wyświetlany i formatowany przez jq, wygląda tak:

![](http://localhost:8484/dd621642-427b-4560-9f26-b08150f04e97.avif)

Widzimy, że zawiera wszystkie brakujące klucze.

Podczas importowania plików tłumaczeń możemy użyć pakietu deepmerge. Plik konfiguracyjny i18n może wyglądać tak:

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

Jeśli masz jakiekolwiek doświadczenia związane z automatyzacją pracy tłumaczeniowej lub rekomendacje dotyczące narzędzi i skryptów, śmiało podziel się nimi w komentarzach. Interesuje mnie poznanie narzędzi i podejść, które stosujesz.
