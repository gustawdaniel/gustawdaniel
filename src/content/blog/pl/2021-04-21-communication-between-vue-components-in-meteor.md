---
author: Daniel Gustaw
canonicalName: communication-between-vue-components-in-meteor
coverImage: http://localhost:8484/355876fb-80ec-4ae0-862e-9382ebf1a833.avif
description: Istnieje kilka metod przesyłania danych między niezwiązanymi komponentami vue. Niektóre z nich są uniwersalne, inne typowe dla vue, a jeszcze inne dla Meteor. Porównujemy je wszystkie.
excerpt: Istnieje kilka metod przesyłania danych między niezwiązanymi komponentami vue. Niektóre z nich są uniwersalne, inne typowe dla vue, a jeszcze inne dla Meteor. Porównujemy je wszystkie.
publishDate: 2021-04-20 21:12:22+00:00
slug: pl/komunikacja-pomiedzy-komponentami-vue-w-meteorze
tags:
- vue
- meteor
title: Komunikacja między komponentami Vue w Meteorze
updateDate: 2021-04-20 21:12:22+00:00
---

## Co mamy i czego chcemy?

Rozważmy następującą sytuację.

1. Mamy projekt Meteor z Vue
2. Mamy dwa komponenty, które używają tych samych danych
3. Chcemy obserwować zmiany dokonane w jednym komponencie w drugim

## Jak to zrobić?

Istnieją różne podejścia, aby osiągnąć ten rezultat:

a) Nie używać Vue ani Meteor i operować bezpośrednio na DOM

b) Użyć EventBus znanego z Vue do emitowania i nasłuchiwania zdarzeń

c) Użyć Vuex, który pozwala wielu komponentom operować na globalnym stanie

d) Użyć Meteor Tracker do przeliczania właściwości w drugim komponencie

e) Użyć Minimongo i pakietu [vue-meteor-tracker](https://github.com/meteor-vue/vue-meteor-tracker)

Poniżej pokazujemy przykłady zastosowania każdej z tych metod oraz opisujemy ich zalety i wady.

Pełne repozytorium ze wszystkimi tymi metodami można znaleźć tutaj: [https://github.com/gustawdaniel/vue-meteor-components-communication-tutorial](https://github.com/gustawdaniel/vue-meteor-components-communication-tutorial)

## Jak zintegrować Vue z Meteor?

Zakładamy, że potrafisz stworzyć projekt meteor z Vue. Jeśli nie, to po standardowym projekcie meteor utworzonym przez

```bash
meteor create .
```

powinieneś używać poleceń:

```bash
meteor remove autopublish insecure blaze-html-templates
meteor add akryum:vue-component static-html
meteor npm install --save vue-meteor-tracker vue
```

Zamień `/client/main.html` na

```html
<head>
   <title>Components communication</title>
</head>
<body>
   <div id="app"></div>
</body>
```

i `/client/main.js` przez

```js
import Vue from 'vue';

import VueMeteorTracker from 'vue-meteor-tracker';   // here!
Vue.use(VueMeteorTracker);                           // here!

import App from './App.vue';

Meteor.startup(() => {
  new Vue({
    el: '#app',
    render: h => h(App)
  });
});
```

Teraz w `/client/App.vue` możemy używać standardowej składni Vue, takiej jak

```html
<template>
    <h1>App</h1>
</template>

<script>
    export default {
        name: "App"
    }
</script>
```

W następujących sekcjach możemy zobaczyć wyniki w tabeli z zastosowanym spectre.css, ale nie będziemy tego omawiać. Możesz zobaczyć, jak go używać, przechodząc przez zmiany w dołączonym repozytorium.

# Operacja bezpośrednio na DOM

W najprostszych przypadkach, gdy nie chcemy operować na przesłanych danych, możemy użyć staromodnej bezpośredniej modyfikacji DOM. Nasłuchujemy na zmiany w pierwszym komponencie, a następnie wybieramy i bezpośrednio modyfikujemy `innerHTML` elementów w innym.

![meteor-vue-1-input.gif](http://localhost:8484/e0f5478a-b6ee-4b6c-90f0-5531c6397f96.avif)

Aby uzyskać ten wynik, możemy napisać następujący kod w pierwszym komponencie:

```html
<template>

    <input class="form-input" type="text" ref="input" @keyup="update">

</template>

<script>
    export default {
        methods: {
            update() {
                document.querySelector('#dom-target').innerHTML = this.$refs.input.value; // result of selector could be cached
            }
        }
    }
</script>
```

Jak widać, nasłuchujemy zdarzenia `keyup` na elemencie input i wykonujemy metodę `update`, która szuka `#dom-target` i bezpośrednio modyfikuje jego zawartość.

W drugim pliku nawet nie używamy JavaScriptu.

```html
<template>

    <p class="m-2" id="dom-target"></p>

</template>
```

Ta metoda jest

* bardzo prosta
* łatwa w użyciu i zrozumieniu
* wymaga małej ilości kodu

ale ma też wady:

* może powodować trudne do wykrycia błędy
* niszczy ideę niezależnych komponentów
* wprowadza globalną przestrzeń nazw dla identyfikatorów lub innych ograniczających selektorów
* należy unikać w większych projektach, w których współpracuje wiele osób

# Użyj Event Bus

Koncepcja Event Bus opiera się na stworzeniu jednego (lub wielu) niezależnych, globalnie dostępnych pustych komponentów, które mają tylko jedno zadanie: emitować i nasłuchiwać na zdarzenia. Ten komponent może być wstrzykiwany do innych komponentów naszej aplikacji i używany do sygnalizowania i wywoływania akcji.

```js
import Vue from 'vue';

export default new Vue();
```

Teraz nasz komponent inicjujący komunikację jest bardziej rozbudowany.

```html
<template>

    <input class="form-input" type="text" v-model="value" @keyup="update">

</template>

<script>
    import EventBus from '../../EventBus';

    export default {
        data() {
            return { value: null }
        },
        methods: {
            update() {
                EventBus.$emit('update', this.value)
            }
        }
    }
</script>
```

Zastosowaliśmy właściwość danych i używamy metody `$emit` na zaimportowanym `EventBus`, aby wysłać sygnał. W komponencie odbierającym możemy użyć metody `$on`, aby nasłuchiwać tego sygnału.

```html
<template>

    <p class="m-2" id="dom-target">{{value}}</p>

</template>

<script>
    import EventBus from '../../EventBus';

    export default {
        data() {
            return {
                value: null
            }
        },
        mounted() {
            EventBus.$on('update', (value) => {
                this.value = value;
            })
        }
    }
</script>
```

Zalety

* brak ograniczeń dotyczących względnej pozycji komponentów
* w bardziej skomplikowanych projektach można używać wielu EventBusów

Wady

* zawsze należy ręcznie emitować zdarzenie
* należy pamiętać, aby dodać ten mechanizm do każdego komponentu, który operuje na tych danych

## Vuex jako globalny stan aplikacji

Idea oddzielnych komponentów ma ogromny wpływ na czytelność kodu i możliwość jego utrzymania. Ale czasami mamy dane, które powinny być dostępne w każdym komponencie i chcemy świadomie dzielić się tymi danymi. Aby osiągnąć ten cel, możemy użyć Vuex. Nie jest to część podstawowej biblioteki vue, ale jest oficjalnie wspierane. Powinniśmy zainstalować vuex za pomocą polecenia:

```bash
npm install vuex --save
```

Aby to działało, musimy przygotować się przed użyciem `vuex` w komponentach. Po pierwsze, powinniśmy zarejestrować go jako pakiet, którego używamy. Możemy to zrobić w pliku `/imports/client/plugins/vuex.js`

```js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);
```

Następnie powinniśmy stworzyć globalny zbiór wspólnych właściwości oraz metod do zmiany stanu tych wartości, nazwany `store`. Proponuję stworzyć plik `/imports/client/vuex/store.js` z zawartością

```js
import Vuex from 'vuex'

export default new Vuex.Store({
    state: {
        value: null
    },
    mutations: {
        update (state, value) {
            state.value = value;
        }
    }
});
```

Możesz zobaczyć, że nasz stan zawiera `value` i może być "zmieniany" przez funkcję `update`. Ale to nie wszystko. Powinniśmy również dodać zarówno nasz plugin, jak i sklep do pliku `/client/main.js`. Możemy to zrobić w następujący sposób

```js
import Vue from 'vue';

import '../imports/client/plugins/tracker'
import '../imports/client/plugins/vuex'
import store from '../imports/client/vuex/store';

import App from '../imports/client/ui/App.vue';

Meteor.startup(() => {
  new Vue({
    el: '#app',
    store,
    render: h => h(App)
  });
});
```

Możesz zobaczyć, że `meteor-tracker` został przeniesiony do pliku depart w taki sam sposób jak `vuex`, a w konstruktorze naszego obiektu `Vue` zainjektowano `store`, który właśnie zdefiniowaliśmy.

Teraz jesteśmy gotowi do użycia `vuex` w naszych komponentach. Kiedy wpisujemy, aktualizacja powinna wykonać mutację o nazwie `update` i wysłać jako drugi argument wartość naszego wpisu.

```html
<template>

    <input class="form-input" type="text" @keyup="update">

</template>

<script>
    export default {
        methods: {
            update(event) {
                this.$store.commit('update', event.target.value)
            }
        }
    }
</script>
```

Sklep zdefiniował zachowanie tej metody. Wiemy, że jest to setter właściwości value. A w drugim komponencie możemy po prostu uzyskać tę wartość z vuex.

```html
<template>

    <p class="m-2" id="dom-target">{{$store.state.value}}</p>

</template>
```

Tak jak w przypadku bezpośredniej operacji na DOM, nie potrzebujemy dodatkowego JavaScript, ale w tym przypadku osiągamy to dzięki reaktywności wbudowanej w Vue.

Zalety:

* Wydajne dla współdzielonych stanów
* Pozwalają na tworzenie globalnych reguł manipulacji współdzielonymi zasobami
* Wymagają małej ilości kodu przy wdrożeniu

Wady:

* Relatywnie trudne do skonfigurowania w porównaniu do poprzednich metod
* Wymagają wielu komponentów, które używają tej samej wartości, aby miały sens

## Niezależna reaktywność od Meteor tracker

Można zauważyć, że opisaliśmy trzy metody, które możemy użyć z Vue, ale bez Meteora. Teraz przyjrzymy się Meteor Tracker i zobaczymy, jak połączyć reaktywność z meteora z reaktywnością z vue. Teraz pomysł jest następujący: stworzyć współdzieloną zależność, taką jak EventBus, zaimportować ją do dwóch komponentów. W pierwszym wysłać sygnał do przeliczenia dowolnej funkcji zależnej od tej zależności, w drugim komponencie stworzyć funkcję zależną. Aby przechowywać dane, użyjemy `localStorage`, ponieważ jest to z pewnością nieszeregowane przechowywanie danych i pokażemy, że dzięki Trackerowi nie musimy martwić się o sposób przechowywania (może to być zewnętrzne API), ale tylko skoncentrować się na tym, gdzie dane reaktywne są zmieniane i gdzie są używane.

Zacznijmy od stworzenia zależności w pliku `/imports/client/Dependency.js`

```js
export default new Tracker.Dependency;
```

Teraz chcemy zaimportować tę zależność i użyć metody `changed()`, aby zaznaczyć, że każda funkcja zależna od tego powinna zostać przeliczona. Dodatkowo zapisujemy wartość w `localStorage` i czyszczymy `localStorage` podczas tworzenia tego komponentu, aby uniknąć cachowania wartości między odświeżeniami przeglądarki.

```html
<template>

    <input class="form-input" type="text" @keyup="update">

</template>

<script>
    import dependency from '../../Dependency';

    export default {
        methods: {
            update(event) {
                window.localStorage.setItem('value', event.target.value);
                dependency.changed();
            }
        },
        created() {
            window.localStorage.clear();
        }
    }
</script>
```

W drugim komponencie mamy standardową funkcję `data()`, ale na etapie tworzenia zarejestrowana jest metoda `autorun` Trackera. Ta metoda będzie wywoływana zawsze, gdy zmieni się jakakolwiek reaktywna (z punktu widzenia Meteora) zmienna wewnątrz tej funkcji. Poprzez wpisanie `dependency.depend()` wydajemy Meteorowi polecenie przeliczenia tej funkcji w każdym przypadku, gdy zostanie wywołana `dependency.changed()`.

```html
<template>

    <p class="m-2" id="dom-target">{{value}}</p>

</template>

<script>
    import dependency from '../../Dependency';

    export default {
        data() {
            return {
                value: null
            }
        },
        created() {
            Tracker.autorun(() => {
                dependency.depend();
                this.value = window.localStorage.getItem('value');
            });
        }
    }
</script>
```

Czasami chcemy komunikować dane Meteor z danymi Vue. Ze względu na to, że ich reaktywność opiera się na różnych technologiach, Meteor Tracker jest punktem, w którym mogą się spotkać i współdziałać ze sobą.

Wady:

* Tracker nie jest tak dobrze znany jak inne czyste metody Vue
* Jeśli jest wiele punktów aktualizacji, należy pamiętać o wywołaniu `changed` w każdym z nich

Zalety:

* Umożliwia bardzo niestandardową integrację z Meteor, bardziej elastyczną niż pakiet `vue-meteor-tracker`.

## Automatyczne śledzenie za pomocą pakietu vue-meteor-tracker

Jednym z najwygodniejszych rozwiązań jest użycie `vue-meteor-tracker`. W przeciwieństwie do ostatniego przykładu potrzebujemy reaktywnego (z perspektywy Meteor) zasobu. Dzięki zastosowaniu zmiennych reaktywnych możemy zautomatyzować proces wysyłania sygnału o zmianie danych do funkcji zależnych. Możemy użyć kolekcji Mini Mongo, która symuluje kolekcję Mongo, ale działa tylko na froncie bez połączenia z backendem. Oczywiście można również użyć rzeczywistej kolekcji Mongo, ale wybieramy Mini Mongo dla uproszczenia. Stwórzmy kolekcję w `/imports/client/Values.js`

```js
export const Values = new Mongo.Collection(null);
```

Teraz w komponencie wejściowym chcemy zaktualizować lub wstawić dane do tej kolekcji w następujący sposób:

```html
<template>

    <input class="form-input" type="text" @keyup="update">

</template>

<script>
    import { Values } from '../../Values';

    export default {
        methods: {
            update(event) {
                Values.upsert('value', {$set: {value: event.target.value}})
            }
        },
        created() {
            Values.upsert('value', {$set: {value: null}});
        }
    }
</script>
```

Są `upsert` przy tworzeniu komponentu i przy aktualizacji danych wejściowych. Teraz w komponencie, który prezentuje dane, możemy mieć kod z właściwością `meteor` komponentu `Vue` dostarczoną przez pakiet `vue-meteor-tracker`.

```html
<template>

    <p class="m-2">{{valueObject.value}}</p>

</template>

<script>
    import { Values } from '../../Values';

    export default {
        meteor: {
            valueObject() {
                return Values.findOne('value');
            }
        }
    }
</script>
```

Ta właściwość pozwala definiować funkcje, które są reaktywne na dwa sposoby. Funkcje te są wywoływane przez zmiany zmiennych reaktywnych dla Meteor, ale zwracają wartości reaktywne dla Vue. Z tego powodu nie mamy żadnego nasłuchiwacza. Tylko czysta logika zapisywania danych do reaktywnej kolekcji Meteor w pierwszym komponencie i zwracania wartości z reaktywnego kursora dla Meteor w drugim komponencie. `Vue-meteor-tracker` przekształca tę reaktywność na reaktywność Vue, a `valueObject` może być traktowany w drugim komponencie jak właściwość zwracana przez metodę `data()`.

Wady:

* musisz nauczyć się i polegać na zewnętrznym dodatkowym pakiecie
* występują pewne problemy z dynamiczną zmianą parametrów subskrypcji

Zalety:

* pakiet jest dobrze udokumentowany
* intuicyjny i łatwy w użyciu
* zawsze używany, gdy chcesz zintegrować Meteor z Vue

# Podsumowanie

Przedstawiliśmy kilka metod komunikacji między komponentami. Niektóre z nich są uniwersalne, dwie ostatnie metody są typowe dla integracji `vue-meteor`. Nie ma najlepszej lub gorszej metody. Stworzysz najlepszy kod, jeśli będziesz znał i rozumiał wszystkie metody i wybierzesz odpowiednią w zależności od swoich potrzeb.

![vue-meteor-2-podsumowanie](http://localhost:8484/996e2a24-44f2-4b1f-8fbe-3ef42357032d.avif)

Wszystkie metody przedstawione w tym artykule z komponentami wejściowymi i wyjściowymi.

Jeśli chcesz dodać metodę, którą zapomniałem, lub zauważysz coś do poprawy, nie wahaj się wspomnieć o tym w komentarzu.

Źródła:

Zdarzenia niestandardowe w Vue

> [https://vuejs.org/v2/guide/components-custom-events.html](https://vuejs.org/v2/guide/components-custom-events.html)

Oficjalny przewodnik po Vuex

> [https://vuex.vuejs.org/guide/](https://vuex.vuejs.org/guide/)

Dokumentacja Tracker Meteor

> [https://docs.meteor.com/api/tracker.html](https://docs.meteor.com/api/tracker.html)

Vue Meteor Tracker

> [https://github.com/meteor-vue/vue-meteor-tracker](https://github.com/meteor-vue/vue-meteor-tracker)

Ten post na blogu jest również opublikowany tutaj: https://medium.com/@gustaw.daniel/communication-between-vue-components-in-meteor-29006be3dae9

Pełne repozytorium ze wszystkimi tymi metodami można znaleźć tutaj: https://github.com/gustawdaniel/vue-meteor-components-communication-tutorial
