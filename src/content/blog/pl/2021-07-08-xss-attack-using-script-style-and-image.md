---
author: Daniel Gustaw
canonicalName: xss-attack-using-script-style-and-image
coverImage: http://localhost:8484/94f5cc49-c10e-49c3-ad37-095e876d51cb.avif
description: Dowiedz się, jak zainfekować stronę za pomocą ataku XSS przy użyciu tagów skryptu, stylu lub obrazu. Możesz zobaczyć, jak zastąpić zawartość strony swoją własną, nawet bez javascriptu.
excerpt: Dowiedz się, jak zainfekować stronę za pomocą ataku XSS przy użyciu tagów skryptu, stylu lub obrazu. Możesz zobaczyć, jak zastąpić zawartość strony swoją własną, nawet bez javascriptu.
publishDate: 2021-07-08 13:51:40+00:00
slug: pl/xss-attack-using-script-style-and-image
tags:
- xss
- hacking
- attack
title: Atak XSS przy użyciu stylu skryptu i obrazu
updateDate: 2021-07-08 13:51:40+00:00
---

Artykuł ten opisuje przykłady ataków XSS. Użycie znaczników skryptu jest prawdopodobnie najbardziej znanym przypadkiem, ale istnieją również inne możliwości. Możesz zmienić zawartość strony internetowej samodzielnie, używając znacznika obrazu lub czystego CSS.

To materiał edukacyjny i powinieneś pamiętać, że hakowanie jest nielegalne, jeśli zostaniesz przyłapany na gorącym uczynku. :)

## Kod strony

Aby zaprezentować atak, tworzymy prostą stronę internetową opartą na PHP. Bardzo lubię oddzielać logikę od widoku w kodzie, ale dla uproszczenia i zminimalizowania liczby linii kodu połączyliśmy je, a cały kod strony znajduje się w pliku index.php. Aby uzyskać podatną stronę, musi ona być w stanie zapisywać tekst od użytkownika do bazy danych i wyświetlać go na ekranie bez jego filtrowania.

Ponownie, w celu uproszczenia i jasności, rezygnujemy z najlepszych praktyk i używamy pliku json zamiast baz danych. Pierwszym plikiem naszego projektu jest `db.json`

> db.json

```json
["First comment","Second one"]
```

Aby zapisać komentarze wysyłane za pomocą skryptu PHP, wykonaj następujące czynności:

> index.php

```php
<?php
$comments = json_decode(file_get_contents('db.json'));

if($_SERVER["REQUEST_METHOD"] === "POST") {
    $comments[] = $_POST["comment"];
    file_put_contents('db.json', json_encode($comments));
}
```

* Odczytaj zawartość pliku `db.json` i przekształć ją na tablicę PHP.
* Sprawdź, czy użytkownik wysyła zapytanie metodą POST - oznacza to, że wysyła formularz.
* Jeśli tak
* Dodaj komentarz przesłany przez użytkownika do tablicy.
* Nadpisz plik `db.json`, kodując tablicę z nowym komentarzem w formacie JSON.

Niezależnie od metody zapytania skrypt przechodzi dalej i wyświetla formularz oraz listę komentarzy.

> index.php

```php
echo '<form action="" method="post">
    <input type="text" name="comment">
    <input type="submit" value="send">
</form>
<ul>';

foreach ($comments as $comment) {
    echo "<li>".$comment."</li>";
}
echo '</ul>';
```

Stworzona strona internetowa wygląda następująco

![](http://localhost:8484/eb6cbfa1-de14-45e8-b5c0-aa9b8f33df89.avif)

Jest w pełni funkcjonalna, umożliwia dodawanie komentarzy, zapisywanie ich w formacie JSON oraz wyświetlanie listy komentarzy. Jeśli użytkownicy chcą dodać tekst, a nie zhackować, może to być koniec naszej przygody. Ale musimy założyć, że przynajmniej jeden użytkownik strony internetowej chce ją zhackować. :)

## Jak to zhackować?

Ten przepływ danych - zapis na serwerze i wyświetlanie po stronie klienta - umożliwia atak XSS, jeśli tekst nie jest odpowiednio filtrowany. XSS oznacza Cross-site scripting i umożliwia atakującym wstrzykiwanie skryptów po stronie klienta do stron internetowych przeglądanych przez innych użytkowników.

Dołączony kod wykonywalny jest interpretowany przez przeglądarkę, a nie przez serwer, więc nie możemy w ten sposób zdobyć serwera, ale możemy zmienić zachowanie klienta. Przykładowe korzyści dla atakujących to:

* kradzież ciasteczek (sesji) - przejęcie kontroli nad (zalogowaną) sesją ofiary
* dynamiczna zmiana treści strony internetowej
* włączenie keyloggera w przeglądarce

Skrypt może być przechowywany na serwerze lub dołączony do linku. W naszym przypadku chcemy zapisać skrypt do pliku JSON, wpisując komentarze. Interesuje nas zmiana treści strony internetowej na "Zhackowane przez Daniela". W każdym przypadku przedstawionej poniżej metody ataku strona będzie wyglądać tak:

![](http://localhost:8484/f24230e5-22d7-472d-b782-03adbba46806.avif)

### Skrypt

Najprostszym sposobem jest dołączenie skryptu, który dynamicznie, po załadowaniu strony, zmienia swoją treść na wymaganą. Spróbuj dodać komentarz:

```html
<script>document.querySelector('html').innerHTML="Hacked By Daniel"</script>
```

Ten kod wybiera `html` - oznacza to całą stronę i zmienia jej zawartość za pomocą właściwości `innerHTML`.

### Styl

Inna metoda działa nawet jeśli znaczniki javascript są usuwane, a javascript jest wyłączony w przeglądarce.

```html
<style>html::before {content: "Hacked By Daniel";} body {display: none;}</style>
```

Zdefiniowaliśmy dwie zasady dotyczące stylizacji strony internetowej. Pierwsza mówi przeglądarce, aby dodała tekst `Hacked By Daniel` przed treściami strony. Druga mówi, aby nie wyświetlać ciała.

### Obraz

Oczywiście, jeżeli zablokujemy tag `script` i tag `style` w naszych komentarzach, to nie wystarczy, ponieważ możemy uruchomić skrypt również w innych tagach.

```html
<img src=undefined onerror='document.querySelector("html").innerHTML="Hacked By Daniel"'>
```

To jest przykład obrazu, który ma nieprawidłowy adres. Jeśli adres jest nieprawidłowy, przeglądarka uruchamia skrypt będący wartością atrybutu `onerror`.

## Jak się bronić?

Aby bronić się przed tym atakiem, musimy filtrować komentarze naszych użytkowników i usuwać tagi HTML. Możemy to zrobić, zmieniając kod w `index.php` w następujący sposób

```diff
-      $comments[] = $_POST["comment"];
+      $comments[] = htmlspecialchars($_POST["comment"]);
```

Po zastosowaniu tego naprawionego tekstu, w formie zostanie wyświetlony w listach komentarzy tekst dosłownie równy tekstowi wpisanemu przez użytkownika i nie będzie interpretowany jako tag Html.

![](http://localhost:8484/42fe0eac-c6c6-4f93-b66e-bf2b68eb74fb.avif)

## Podsumowanie

Pokazaliśmy proste przykłady ataków XSS. Jeśli używasz frameworka takiego jak Symfony, to framework ma wbudowany mechanizm bezpieczeństwa w swojej strukturze, ale powinieneś pamiętać o funkcji `htmlspecialchars`, jeśli piszesz w czystym PHP.
