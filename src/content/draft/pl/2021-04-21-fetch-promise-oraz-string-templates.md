---
title: Fetch, Promise oraz  Template String
slug: fetch-promise-oraz-string-templates
publishDate: 2021-04-20T21:28:44.000Z
date_updated: 2021-04-20T21:34:41.000Z
tags: ['es6', 'js', 'html', 'css']
draft: true
excerpt: Ten prosty projekt nadaje się świetnie jako wprowadzenie do programowania w JavaScript. Nacisk położony jest na elementy ES6 oraz frontend.
---

## Opis projektu

Projekt prezentuje zastosowanie interfejsu `fetch`, przykłady użycia `promise` oraz kilka sztuczek cssowych jak własności `transform`, `user-select` czy dyrektywa `@media`.

Skład kodu źródłowego:

```
JavaScript 49.5% CSS 40.3% HTML 10.2%
```

Po napisaniu projekt będzie wyglądał tak:

![](__GHOST_URL__/content/images/2021/04/1_qm93PtCN3Y0mZWzQrqVAFw.png)

To Do List typed in pure JavaScript that will be presented in this article.

## Instalacja

Jeśli chcesz przetestować kod u siebie bez jego przepisywania najszybciej będzie ściągnąć release komendą

```
wget -qO- https://github.com/gustawdaniel/simple_todo_app_js/archive/1.0.tar.gz | tar xvz
```

Następnie należy przejść do utworzonego katalogu

```
cd simple-todo-app-js-tutorial-1.0
```

Teraz należy zainstalować zależności

```
npm i
```

Żeby rozstawić serwery będziemy potrzebowali dwóch terminali. W pierwszym stawiamy serwer z naszym projektem

```
node node_modules/http-server/bin/http-server
```

W drugim terminalu (`ctrl+n`) stawiamy serwer REST API z pozwalający używać bazy danych

```
node node_modules/json-server/bin/index.js --watch db.json
```

Jeśli wszystko poszło dobrze powinniśmy zobaczyć coś takiego:

![](__GHOST_URL__/content/images/2021/04/1_PD3FHn76We8mFzIivvnpvg.png)

Server with application (on the right) and with REST API connected with db.json file (on the left)

Strona powinna być dostępna pod adresem [`localhost:8080`](http://localhost:8080)

## Struktura projektu

Projekt zawiera następujące pliki

```
├── app.js              // skrypt obsługujący pobieranie, tworzenie i usuwanie wpisów
├── db.json             // plik json z danymi do którego dostajemy się przez API
├── index.html          // plik html ze stroną
├── LICENSE             // licencje WTFPL
├── package.json        // plik z zależnościami do zainstalowania, tutaj serwer http i json
├── README.md           // instrukcja z komendami do obsługi serwera
└── style.css           // style
```

Widać, że jest bardzo prosty. Możliwości jakie daje strona to

* tworzenie wpisów
* wyświetlanie wpisów
* usuwanie wpisów

W kolejnym rozdziale opiszemy zawartość plików `index.html` oraz `style.css`. Później omówimy serwery jakie postawiliśmy, rolę pliku `db.json` i na końcu logikę umieszczoną w pliku `app.js`.

## Statyczny dokument

Plik `index.html` zaczyna się dość klasycznie. Pobieramy czcionkę `Lato` oraz załączamy nasz customowy styl.

```html
<html>
<head>
    <link href="https://fonts.googleapis.com/css?family=Lato:300&subset=latin-ext" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
```

Ponieważ kod pisany jest zgodnie z zasadami semantyki HTML5 mamy tu podział na `header` oraz `main`. W nagłówku znajduje się formularz z jednym polem do wpisywania teksu notatek.

```html
<body>
<header>
    <form class="todo">
        <input name="task" type="text" placeholder="Type text to add note">
    </form>
</header>
```

W części `main` znajduje się lista z trzema przykładowymi elementami.
Elementy mają swoje identyfikatory i są podzielone na dwie części
pierwsza zawiera identyfikator, druga tekst oraz przycisk do usuwania
notatki.

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

Na końcu załączamy skrypt, który omówimy później. Na razie może być to pusty plik.

```html
<script src="app.js"></script>
</body>
</html>
```

Gdyby nie stylowanie, nie dało by się na to patrzeć, ale zainspirowany zajęciami z html i css, które ostatnio prowadziłem postanowiłem napisać plik css całkowicie samodzielnie od zera. Reguły które dodałem zaczynają się od ustalenia szerokości dokumentu w zależności od szerokości ekranu. Zwykle stosuje się do tego bootstrapa, ale można to robić również bez niego. Służy to tego dyrektywa `@media` której zastosowanie zaprezentowane jest poniżej:

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

Widać tutaj, że na większych urządzeniach chcę mieć margines, który na mniejszych nie jest już potrzebny. Następną regułą jest zastosowanie czcionki `Lato` do całego dokumentu:

```css
body {
    font-family: 'Lato', sans-serif;
}
```

W nagłówku centrujemy formularz i pozbywamy się jego naturalnych marginesów.

```css
header {
    text-align: center;
}
form {
    margin: 0;
}
```

Następnie definiujemy zasady podświetlania inputa na który klikniemy, albo
nad którym nasuniemy myszkę. Oprócz usunięcia przezroczystości z ramki mamy
tutaj dodanie rozmytego cienia oraz zaczerwienienie tła.

```css
input:focus, input:hover {
    border: solid 1px crimson;
    box-shadow: 0 0 5px -1px crimson;
    background-color: rgba(220, 20, 60, 0.05);
}
```

Interesującą własnością nie zaznaczonego inputa jest `transition`. Pozwala ona na określenie opóźnienia z jakim dany zmienia swoją własność. Dzięki niemu zobaczymy, że tło pojawia się i znika płynnie.

```css
input {
    padding: 20px;
    border: solid 1px rgba(220, 20, 60, 0.52);
    margin: 10px 0;
    transition: box-shadow 1s, background-color 2s;
}
```

Nieco inne efekty nadane są na najechanie myszką nad element listy. Najmocniej wyróżniającym się elementem jest przesunięcie się lewej krawędzi listy w prawo co ustawiane jest we własności `margin`.

```css
li:hover {
    border: solid 1px rgba(220, 20, 60, 0.8);
    background-color: rgba(220, 20, 60, 0.05);
    box-shadow: 0 0 2px -1px crimson;
    margin: 3px 0 3px 10px;
}
```

Dla porównania jeśli myszka nie znajduje się nad elementem listy margines jest symetryczny. Tutaj również zastosowano `transition` uzyskując animację wcinania i wysuwania elementu listy.

```css
li {
    list-style: none;
    border: solid 1px rgba(220, 20, 60, 0.52);
    margin: 3px 0;
    color: gray;
    transition: margin 0.5s, background-color 2s;
}
```

Elementy listy podzielone są na dwie części, `.list-elem-head` służy do wyświetlania identyfikatora. Przestrzeń wokół rozepchana jest marginesami. Warto zwrócić też uwagę na `float: left` pozwalający divom na sąsiadowanie w jednej linii.

```css
.list-elem-head {
    float: left;
    margin: 20px;
}
```

Zupełnie inaczej jest w przypadku `.list-elem-body`. Tutaj nie marginesy a paddingi odpowiadają za rozpychanie się i centrowanie względem granic elementu listy. Jest tak dlatego, że potrzebujemy pełnej wysokości elementu `.list-elem-body` wewnątrz elementu `li` aby dodać granicę `border-left`.

```css
.list-elem-body {
    margin-left: 50px;
    padding: 20px 20px 20px 20px;
    border-left: solid 1px rgba(220, 20, 60, 0.52);
}
```

Sama lista nie potrzebuje ani marginesów, ani paddingów. Razem z `list-style: none` zastosowanym dla `li` pozbywamy się dzięki temu domyślnego stylowania list.

```css
ul {
    margin: 0;
    padding: 0;
}
```

Jedną z ostatnich zmian jest odsunięcie tekstu z notatką od wewnętrznej granicy elementu listy.

```css
li > span.text {
    padding-right: 20px;
}
```

Na koniec stylujemy przycisk do usuwania. Jest to span zawierający literę x. Nie ściągałem tu żadnych dodatkowych czcionek. Mimo to dzięki zaokrągleniu rogów, odpowiednim kolorom, paddigom i zafixowaniu wielkości elementu udało się uzyskać dość jednoznacznie wyglądający przycisk do usuwania. Jedak dodana została tu jeszcze jedna ciekawa własność: `user-select`. Pozwala ona pominąć dany element przy zaznaczaniu. Dzięki temu podwójne kliknięcie na tekst notatki nie spowoduje zaznaczenia `x` na końcu.

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

Teraz omówimy w jaki sposób dodać do projektu możliwość tworzenia nowych wpisów, usuwania ich i wyświetlania wpisów zapisanych w bazie. Jeśli przyjrzymy się wycinkowi pliku `package.json` zobaczymy tam następujące linie:

```
  "dependencies": {
    "http-server": "^0.11.1",
    "json-server": "^0.12.1"
  }
```

Pierwsza z paczek to serwer http który odpowiada za to, że pod portem 8080 wystawia się nasza aplikacja. Daje to z grubsza taki sam efekt jak napisanie `php -S localhost:8080`.

Druga to serwer REST do obsługi bazy danych zapisanych w pliku `db.json`. W pliku `README.md` zapisane są komendy do włączania tych serwerów oraz requesty jakie należy wykonać aby dokonać zmian w bazie:

Do dodana wpisu konieczne jest wysłanie żądania metodą POST:

```
http POST localhost:3000/todo text="First One"
```

Żeby wylistować wszystkie wpisy wysyłamy żądanie GET:

```
http GET localhost:3000/todo
```

A w celu usunięcia n-tego wpisu metodą DELETE i wskazujemy numer wpisu w adresie URL:

```
http DELETE localhost:3000/todo/n
```

Sam plik `db.json` może wyglądać następująco:

```json
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

Teraz przejdziemy do omówienia logiki aplikacji umieszczonej w pliku `app.js`. Zanim jednak to nastąpi musimy wyczyścić plik `index.html` usuwając wszystko co znajduje się miedzy elementami `<ul></ul>`. Modyfikujemy html czyszcząc listę z zawartości ponieważ za dodawania zawartości odpowiadać będzie teraz skrypt w `app.js`.

Cały skrypt zawarto jest w funkjci anonimowej wykonywanej po wydarzeniu `DOMContentLoaded`.
Zapobiega to wykonywaniu skryptu przed załadowaniem drzewa `DOM`.

```js
document.addEventListener('DOMContentLoaded',function () {

   // there should be placed code presented below

})
```

wewnątrz tej funkcji definiujemy zmienne które wykorzystywane będą w skrypcie. Są to `dbUrl` zawierająca adres do API zarządzającego bazą danych. Dwie kolejne zmienne zawierając formularz oraz listę.

```js
    const dbUrl = 'http://localhost:3000/todo';
    let form = document.querySelector('form.todo');
    let list = document.querySelector('ul');
```

Teraz czas na definiowanie przydatnych funkcji. Zaczniemy od funkcji pobierającej wszystkie notatki. Ponieważ funkcja ta wysyła request musi poczekać na jego odpowiedź, ale oczekiwanie na odpowiedź oznacza, że metodą then nadajemy nasłuch i jak by wypinamy się z synchronicznej kolejności wykonywania kolejnych linii kodu. Żeby zachować asynchroniczną naturę dobrego kodu JavaScript na kliencie nie możemy pozwolić sobie na blokowanie reszty skryptu. Sposobem na poradzenie sobie z koniecznością zwracania danych, których jeszcze nie ma jest zwracanie obietnicy ich dostarczenia czyli obiektu `Promise`. Obiekt te przyjmuje w swoim konstruktorze funkcję, której argumentem jest funkcja której jako argument powinniśmy przekazać interesujące nas dane. Widać to dobrze w poniższym kodzie:

```js
    function getAllTodos() {
        return new Promise(resolve => {
            fetch(new Request(dbUrl))
                .then(res => { return res.json(); })
                .then(data => { resolve(data); });
        });
    }
```

Jenak `Promise` to nie jedyna ciekawa rzecz, którą można dostrzec w tych kilku liniach. Kolejną jest funkcji `fetch`. Jest to następca interfejsu XMLHttpRequest. Różni się od niego między innymi lepiej przemyślaną i nowocześniejszą składnią, lepszym wsparciem dla przetwarzania strumieni danych. Argumentem funkcji fetch jest obiekt `Request`. Najprostszym requestem jest request metodą `GET` pod podany adres - to jest nasz przypadek. Do funkcji tej doczepia się nasłuch na odpowiedź przez `then`. pierwszy z nich służy temu żeby poczekać na dojście całej odpowiedzi i sparsowanie jej jako `json`. Drugi `then` rozwiązuje obietnicę zwracając obiekt z danymi wydobyty za pomocą wysłanego żądania.

Druga metoda pozwala na zapisanie notatki do bazy. Tu również stosujemy `Promise` w sposób identyczny jak poprzednio, ale tym razem request jest bardziej skomplikowany. Aby zwiększyć czytelność kodu zapisuję go to tymczasowej zmiennej `req`. Widzimy, że `URL` jest taki sam, ale w drugim argumencie obiektu `Request` mamy jego dodatkową konfigurację: metodę, obiekt zawierający nagłówki oraz ciało requestu.

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

Ostatnia funkcja w tym projekcie nie ma nic wspólnego z interfejsem `fetch` ani obiektem `Promise`, ale prezentuje inną nowość z ES6 - `string templates`. Są to ciągi znakowe otoczone ukośnymi cudzysłowami takimi jak ten - "\`". Które zawierają zmienne wywoływane za pomocą znaku dolara i nawiasów klamrowych. Do tej funkcji przekujemy obiekt mający własności `id` oraz `text`. Tworzy ona odpowiedni kod `html` który załączony będzie następnie do listy. Jest to znacznie wygodniejsze niż stosowanie `document.createElement()`.

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

Po zdefiniowaniu funkcji możemy przejść do części wykonywalnej. Zaczyna się ona od prze-iterowania po liście notatek pobranych z bazy i załączenia ich do listy na stronie.

```js
    getAllTodos().then(todos => {
        todos.forEach(todo => { appendTextToList(todo); });
    });
```

Następnie dodajemy nasłuch na formularz. W przypadku dodania wpisu wysyłamy go do bazy, a po otrzymaniu identyfikatora załączamy do listy.

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

Na koniec dodajemy nasłuch na kliknięcia w listę. Ma on dotyczyć jedynie usuwania, więc za pomocą metody `contains` na liście klas sprawdzamy, czy kliknięto na element o klasie `delete`. Jeśli tak, to wyciągamy `id` z tego elementu listy, wysyłamy żądanie z metodą `DELETE` na url zakończony tym `id` oraz wycinamy go z listy.

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

Ten prosty projekt nadaje się świetnie jako wprowadzenie do programowania w JavaScript. Zaprezentowaliśmy tu również elementy CSS, które pokazują, że nie zawsze trzeba używać bootstrapa, żeby uzyskać atrakcyjnie wyglądające inputy oraz listy. Jeśli po przeczytaniu tego tekstu masz jakieś pytania, nie wahaj się i zadaj je w komentarzu.
