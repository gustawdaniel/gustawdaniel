---
author: Daniel Gustaw
canonicalName: fetch-promise-and-template-string-on-example-of-to-do-list-in-javascript
coverImage: http://localhost:8484/014d0920-5eca-46f4-b476-960e0fa98596.avif
description: Ten prosty projekt jest doskonałym wprowadzeniem do programowania w JavaScript. Nacisk kładzie się na elementy ES6 i frontend.
excerpt: Ten prosty projekt jest doskonałym wprowadzeniem do programowania w JavaScript. Nacisk kładzie się na elementy ES6 i frontend.
publishDate: 2021-04-20 21:46:37+00:00
slug: pl/fetch-promise-oraz-string-templates
tags:
- js
- es6
- html
- css
title: Fetch, Promise i Template String na przykładzie Listy Zadań w JavaScript
updateDate: 2021-04-20 21:46:37+00:00
---

### Opis projektu

Ten prosty projekt uczy, jak zastosować interfejs `fetch`, pokazuje przykłady użycia `promises` oraz niektórych interesujących właściwości `css`, takich jak `transform`, `user-select` lub dyrektywa `@media`.

Skład kodu źródłowego:

```
JavaScript 49.5% CSS 40.3% HTML 10.2%
```

Po zakończeniu projekt będzie wyglądał następująco:

![js-es6-1](http://localhost:8484/2f16cf65-198d-462d-9fe2-2a9e496aabbd.avif)

Lista rzeczy do zrobienia napisana w czystym JavaScript, która będzie zaprezentowana w tym artykule.

Możesz zobaczyć cały kod źródłowy pod tym linkiem

> [https://github.com/gustawdaniel/simple-todo-app-js-tutorial](https://github.com/gustawdaniel/simple-todo-app-js-tutorial)

### Instalacja

Jeśli chcesz przetestować kod na swoim komputerze bez jego przepisywania, najprostszym sposobem jest pobranie wydania za pomocą polecenia

```bash
wget -qO- https://github.com/gustawdaniel/simple-todo-app-js-tutorial/archive/1.0.tar.gz | tar xvz
```

Następnie przejdź do utworzonego katalogu

```bash
cd simple-todo-app-js-tutorial-1.0
```

Teraz powinieneś zainstalować zależności.

```bash
npm i
```

Aby skonfigurować serwery, potrzebujemy dwóch terminali. W pierwszym uruchamiamy serwer z naszym projektem.

```bash
node node_modules/http-server/bin/http-server
```

W drugim terminalu `ctrl+n` konfigrujemy serwer `REST API` dostarczany przez pakiet `json-server`.

```bash
node node_modules/json-server/lib/bin.js --watch db.json
```

Jeśli wszystko działa, powinniśmy zobaczyć coś takiego

![js-es6-2](http://localhost:8484/4193b63c-cfa6-4828-a4a1-ae620dd8de2f.avif)

Serwer z aplikacją (po prawej) i z REST API połączonym z plikiem db.json (po lewej)

Strona internetowa powinna być dostępna pod adresem `localhost:8080`

### Struktura projektu

Projekt zawiera następujące pliki

```text
├── app.js              // script providing creating, reading and deleting tasks
├── db.json             // json file with data that is connected with REST API
├── index.html          // html file with main page
├── LICENSE             // licencje WTFPL
├── package.json        // file with dependencies (servers: http and json)
├── README.md           // documentation for end user
└── style.css           // style
```

Możesz zobaczyć, że projekt jest naprawdę prosty. Strona umożliwia następujące działania:

* tworzenie zadań
* wyświetlanie zadań
* usuwanie zadań

W następnym rozdziale opisujemy zawartość plików statycznych `index.html` i `style.css`. Następnie omawiamy serwery, które skonfigurowaliśmy, rolę pliku `db.json` i na końcu logikę zawartą w pliku `app.js`.

### Dokument statyczny

Plik `index.html` zaczyna się w dość klasyczny sposób. Pobieramy czcionkę `Lato` i dołączamy nasz własny styl.

```html
<html>
<head>
    <link href="https://fonts.googleapis.com/css?family=Lato:300&subset=latin-ext" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
```

Z powodu kodu, który jest zgodny z zasadami semantyki `HTML5`, mamy podział na `header` i `main`. W nagłówku znajduje się formularz z jednym polem do wpisania treści zadania.

```html
<body>
<header>
    <form class="todo">
        <input name="task" type="text" placeholder="Type text to add note">
    </form>
</header>
```

W części `main` znajduje się lista z trzema przykładowymi elementami. Elementy mają swoje identyfikatory i są podzielone na dwie części. Pierwsza część zawiera identyfikator, druga tekst oraz przycisk do usuwania zadania.

```html
<main>
  <ul>
    <li data-id="1">
      <div class="list-elem-head">
          <span class="id">1</span>
      </div>
      <div class="list-elem-body">
          <span class="text">First One</span>
          <span class="delete">x</span>
      </div>
    </li>
    <li data-id="2">
      <div class="list-elem-head">
          <span class="id">2</span>
      </div>
      <div class="list-elem-body">
          <span class="text">Second todo</span>
          <span class="delete">x</span>
      </div>
    </li>
    <li data-id="5">
      <div class="list-elem-head">
          <span class="id">5</span>
      </div>
      <div class="list-elem-body">
          <span class="text">At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.</span>
          <span class="delete">x</span>
      </div>
    </li>
  </ul>
</main>
```

Na końcu dołączamy skrypt, który opisujemy później. Teraz może to być pusty plik.

```html
<script src="app.js"></script>
</body>
</html>
```

## Plik CSS

Jeśli nie byłoby stylizacji, patrzenie na tę stronę powodowałoby koszmary. Ale zainspirowany wykładami z `html` i `css`, które podałem ostatnim razem, postanowiłem napisać plik `css` od podstaw. Zasady, które dodałem, zaczynają się od określenia szerokości dokumentu w zależności od szerokości ekranu. Najczęściej używam do tego bootstrapa, ale można to zrobić bez niego. Służy do tego dyrektywa @media, której zastosowanie przedstawiono poniżej:

```css
@media (max-width: 575px) {
    input,main {
        width: 100%;
    }
}
@media (min-width: 576px) {
    input,main {
        width: 80%;
    }
    main {
        margin-left: 10%;
    }
}
```

Możesz zobaczyć, że na największych urządzeniach chcemy mieć margines, który na mniejszych nie jest konieczny. Następna zasada to zastosowanie czcionki Lato do całego dokumentu.

```css
body {
    font-family: 'Lato', sans-serif;
}
```

W nagłówku centrować formularz i usuwać jego naturalne marginesy.

```css
header {
    text-align: center;
}
form {
    margin: 0;
}
```

Następnie definiujemy zasady podświetlania wejścia, na które klikniemy lub nad którym mamy kursor myszy. Usuwamy przezroczystość z ramki oraz dodajemy rozmyty cień i czerwone tło.

```css
input:focus, input:hover {
    border: solid 1px crimson;
    box-shadow: 0 0 5px -1px crimson;
    background-color: rgba(220, 20, 60, 0.05);
}
```

Teraz możemy zobaczyć na niezaznaczonym wejściu.

```css
input {
    padding: 20px;
    border: solid 1px rgba(220, 20, 60, 0.52);
    margin: 10px 0;
    transition: box-shadow 1s, background-color 2s;
}
```

Ciekawą cechą niewybranego `input` jest `transition`. Umożliwia ona zdefiniowanie opóźnienia zmian cienia i tła. Dzięki `transition` możemy zobaczyć płynne znikanie i pojawianie się tych właściwości.

Analogiczne efekty chcemy zastosować do elementów listy. Najbardziej wyróżniającym się elementem jest przesunięcie lewego marginesu listy w prawo, co ustawiamy w właściwości `margin`.

```css
li:hover {
    border: solid 1px rgba(220, 20, 60, 0.8);
    background-color: rgba(220, 20, 60, 0.05);
    box-shadow: 0 0 2px -1px crimson;
    margin: 3px 0 3px 10px;
}
```

Dla porównania, jeśli kursor myszy nie jest nad elementem listy, margines jest symetryczny. Zastosowano również `transition`, aby uzyskać animację wcięcia i wyrzucania elementu listy.

```css
li {
    list-style: none;
    border: solid 1px rgba(220, 20, 60, 0.52);
    margin: 3px 0;
    color: gray;
    transition: margin 0.5s, background-color 2s;
}
```

Elementy listy są podzielone na dwie części, `.list-elem-head` jest używane do wyświetlania identyfikatora. Przestrzeń wokół jest wypychana marginesami. Warto również zwrócić uwagę na `float: left`, co pozwala na to, aby podziały były sąsiednie w jednej linii.

```css
.list-elem-head {
    float: left;
    margin: 20px;
}
```

Sytuacja jest zupełnie inna dla `.list-elem-body`. To nie marginesy, ale padding odpowiadają za przesuwanie i centrowanie względem granic elementu listy. Jest to spowodowane tym, że potrzebujemy pełnej wysokości elementu `.list-elem-body` wewnątrz elementu `li`, aby dodać obramowanie `border-left`.

```css
.list-elem-body {
    margin-left: 70px;
    padding: 20px 20px 20px 20px;
    border-left: solid 1px rgba(220, 20, 60, 0.52);
}
```

Ta lista nie potrzebuje marginesów ani wypełnień. Używając `list-style: none` dla `li`, usuwamy domyślny styl listy.

```css
ul {
    margin: 0;
    padding: 0;
}
```

Jedną z ostatnich zmian jest przesunięcie tekstu z notatką od wewnętrznej krawędzi elementu listy.

```css
li > span.text {
    padding-right: 20px;
}
```

Na końcu stylizujemy przycisk do usuwania zadania. Jest to span zawierający literę `x`. Nie pobieram tam żadnej dodatkowej czcionki. Mimo to, dzięki zaokrągleniu rogów, odpowiednim kolorom, wypełnieniu i ustawieniu rozmiaru elementu udało nam się uzyskać dość przejrzysty przycisk usuwania. Jednak została tu dodana jeszcze jedna ciekawa właściwość: `user-select`. Dzięki tej właściwości podwójne kliknięcie na tekst notatki nie powoduje zaznaczenia litery `x` na końcu.

```css
li > div > span.delete {
    float: right;
    border: solid 1px crimson;
    border-radius: 50%;
    padding: 5px;
    width: 7px;
    height: 7px;
    line-height: 5px;
    color: crimson;
    cursor: pointer;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select:none;
    user-select:none;
}
```

## Logika

Teraz omówimy, jak dodać do projektu możliwość tworzenia nowych zadań, usuwania ich oraz wyświetlania zadań zapisanych w bazie danych. Jeśli spojrzysz na `package.json`, zobaczysz następujące linie:

```json
"dependencies": {
    "http-server": "^0.11.1",
    "json-server": "^0.12.1"
  }
```

Pierwszym z tych pakietów jest serwer http, który obsługuje naszą aplikację na porcie 8080. W tym przypadku efekt jest dość podobny do polecenia `php -S localhost:8080`, ale bez interpretowania skryptu `php`.

Drugim pakietem jest serwer REST, który umożliwia zapisywanie danych do pliku `db.json`. W pliku `README.md` znajdują się polecenia do uruchomienia tych serwerów oraz zapytania, które możemy wysłać, aby komunikować się z API.

Możesz to osiągnąć, wpisując:

```bash
npm init -y
npm add http-server json-server
```

Następnie skonfiguruj oba serwery w oddzielnych terminalach. W pierwszym uruchom serwer z naszym projektem.

```bash
node node_modules/http-server/bin/http-server
```

W drugim terminalu otwórz serwer `REST API` dostarczony przez pakiet `json-server`.

```bash
echo '{"todo":[]}' > db.json
node node_modules/json-server/lib/bin.js --watch db.json
````

Aby dodać nowe zadanie, potrzebne jest żądanie POST.

Użyjemy programu `httpie` w wierszu polecenia, aby wysyłać żądania.

```bash
http POST localhost:3000/todo text="First One"
```

Aby wyświetlić wszystkie zadania z bazy danych, należy wysłać GET.

```bash
http GET localhost:3000/todo
```

Aby usunąć `n-tą` zadanie, wyślij żądanie DELETE wskazujące, które zadanie należy usunąć w URL.

```bash
http DELETE localhost:3000/todo/n
```

Nasza początkowa zawartość `db.json` może wyglądać następująco:

```javascript
{
  "todo": [
    {
      "text": "First One",
      "id": 1
    },
    {
      "text": "Second todo",
      "id": 2
    },
    {
      "text": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.",
      "id": 5
    }
  ]
}
```

Teraz możemy porozmawiać o logice aplikacji umieszczonej w `app.js`. Przed tym musimy usunąć z `index.html` przykładowe elementy listy. Mam na myśli usunięcie wszystkiego pomiędzy `<ul></ul>`. Modyfikujemy `index.html` w ten sposób, ponieważ odpowiedzialność za zarządzanie zadaniami została przeniesiona do `app.js`.

Cały skrypt jest umieszczony w anonimowej funkcji wykonywanej po zdarzeniu `DOMContentLoaded`. Zapobiega to wykonywaniu skryptu przed załadowaniem `DOM`.

```js
document.addEventListener('DOMContentLoaded',function () {

   // there should be placed code presented below

})
```

Wewnątrz tej funkcji definiujemy zmienne, które będą używane w skrypcie. Istnieje `dbUrl`, który zawiera adres do interfejsu API zarządzającego bazą danych. I dwie zmienne odnoszące się do formularza i listy z `DOM`.

```js
const dbUrl = 'http://localhost:3000/todo';
let form = document.querySelector('form.todo');
let list = document.querySelector('ul');
```

Teraz nadszedł czas na zdefiniowanie użytecznych funkcji. Zaczynamy od funkcji pobierającej wszystkie zadania. Ponieważ ta funkcja wysyła żądanie, powinna czekać na odpowiedź. Jednak czekanie nie może blokować reszty interfejsu i innych skryptów. Dlatego za pomocą metody `then` dodajemy nasłuchiwacz na odbieranie odpowiedzi z tego żądania. Możemy powiedzieć, że `then` usuwa się z synchronicznego przepływu programu i zaczyna czekać na odpowiedź niezależnie od reszty programu. Ale ponieważ chcemy otrzymać dane z odpowiedzi, musimy otrzymać Promise uzyskania tych danych. Promise to obiekt, który w konstruktorze akceptuje funkcję, której argumentem jest funkcja, do której musimy przekazać interesujące nas dane. Jest to skomplikowane do opisania, ale doskonale widoczne w poniższym kodzie:

```js
function getAllTodos() {
        return new Promise(resolve => {
            fetch(new Request(dbUrl))
                .then(res => { return res.json(); })
                .then(data => { resolve(data); });
        });
    }
```

Ale `Promise` to nie jedyna wspaniała rzecz, którą można zobaczyć w tych linijkach. Następna to funkcja `fetch`. Jest to następca interfejsu `XMLHttpRequest`. Różni się od niego lepszą składnią, nowocześniejszym podejściem do optymalizacji niskiego poziomu oraz wsparciem dla strumieniowania danych. Argumentem funkcji `fetch` jest obiekt `Request`. Najprostsze żądanie to żądanie z metodą `GET` do podanego adresu - to nasz przypadek. Do tej funkcji możemy dołączyć nasłuchiwacz odpowiedzi za pomocą `then`. Pierwszy `then` jest dodawany, aby oczekiwać na uzyskanie pełnej odpowiedzi i sparsowanie jej jako `json`. Drugi rozwiązuje `Promise`, zwracając obiekt z danymi uzyskanymi z odpowiedzi.

Druga metoda, którą zdefiniujemy, umożliwia zapisanie zadania do bazy danych. W tym przypadku również używamy `Promise` w identyczny sposób jak ostatnio, ale teraz żądanie jest bardziej skomplikowane. Aby zwiększyć czytelność kodu, zapisuję je do tymczasowej zmiennej `req`. Możemy zobaczyć, że `URL` jest taki sam, ale w drugim argumencie obiektu `Request` mamy jego dodatkową konfigurację: metodę, obiekt zawierający nagłówki i ciało żądania.

```js
function saveTodo(text) {
        let req = new Request(dbUrl,{ method: 'POST',
            headers: new Headers({'Content-Type': 'application/json'}),
            body: JSON.stringify({text: text})
        });

        return new Promise(resolve => {
            fetch(req)
                .then(res => { return res.json(); })
                .then(data => { resolve(data); });
        })
    }
```

Ostatnia funkcja w tym projekcie nie ma nic wspólnego z interfejsem `fetch` ani obiektem `Promise`, ale przedstawia inną nową cechę z `ES6` - `template strings`. Są to ciągi znaków otoczone ukośnymi pojedynczymi cudzysłowami w ten sposób “\`", które mogą zawierać ocenę wyrażeń JavaScript oznaczonych składnią `${}`. Do tej funkcji przekazujemy obiekt z właściwościami `id` i `text`. Funkcja renderuje odpowiedni kod `html`, który zostanie dołączony do listy. Jest to znacznie bardziej wygodne niż używanie `document.createElement()`.

```js
function appendTextToList(todo) {
        list.innerHTML += `
<li data-id="${todo.id}">
    <div class="list-elem-head">
        <span class="id">${todo.id}</span>
    </div>
    <div class="list-elem-body">
        <span class="text">${todo.text}</span>
        <span class="delete">x</span>
    </div>
</li>`;
    }
```

Po zdefiniowaniu tych funkcji możemy opisać wykonawczą część kodu. Zaczyna się ona od iteracji po liście notatek pobranych z `API` i dodawania ich do listy na stronie.

```js
getAllTodos().then(todos => {
        todos.forEach(todo => { appendTextToList(todo); });
    });
```

Następnie dodajemy nasłuchiwacz do formularza. Jeśli dodasz wpis, wysyłamy go do bazy danych, a po otrzymaniu identyfikatora dołączamy go do listy.

```js
form.addEventListener('submit', function (e) {
        e.preventDefault();
        saveTodo(form.task.value).then(res => {
            console.log(res);
            appendTextToList(res);
        });
        form.reset();
    });
```

Na końcu dodajemy nasłuchiwacz kliknięć na liście. Ma to być tylko o usuwaniu, więc używając metody `contains` w klasie listy, sprawdzamy, czy klikniesz na element z klasą `delete`. Jeśli tak, pobieramy `id` z tego elementu listy, wysyłamy żądanie z metodą `DELETE` do url zakończonego tym id i usuwamy go z listy.

```js
list.addEventListener('click',function (e) {
        if(e.target.classList.contains('delete')) {
            const id = e.target.parentElement.parentElement.dataset.id;
            console.log(id);
            fetch(new Request(`${dbUrl}/${id}`,{ method: 'DELETE'}));
            document.querySelector(`li[data-id="${id}"]`).outerHTML = "";
        }
    })
```

## Podsumowanie

Ten prosty projekt jest świetnym wprowadzeniem do programowania w JavaScript. Przedstawiliśmy również elementy CSS, które pokazują, że nie zawsze trzeba używać bootstrapa, aby uzyskać atrakcyjnie wyglądające pola wprowadzania i listy. Jeśli masz jakiekolwiek pytania po przeczytaniu tego tekstu, nie wahaj się i zadaj je w komentarzu.
