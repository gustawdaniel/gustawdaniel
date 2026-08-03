---
author: Daniel Gustaw
canonicalName: xss-attack-using-script-style-and-image
coverImage: https://preciselab.fra1.digitaloceanspaces.com/blog/img/7c750097-483e-409c-adba-7c3f66821283.avif
description: Dowiedz się, jak zainfekować stronę za pomocą ataku XSS przy użyciu tagów script, style lub image. Zobacz, jak zastąpić zawartość strony swoją własną, nawet bez JavaScriptu.
excerpt: Dowiedz się, jak zainfekować stronę za pomocą ataku XSS przy użyciu tagów script, style lub image. Zobacz, jak zastąpić zawartość strony swoją własną, nawet bez JavaScriptu.
publishDate: 2018-02-20 13:51:40+00:00
slug: pl/xss-attack-using-script-style-and-image
tags:
- xss
- hacking
- attack
title: Atak XSS przy użyciu znaczników script, style i image
updateDate: 2021-07-08 13:51:40+00:00
---

Artykuł ten opisuje przykłady ataków XSS. Użycie znaczników `<script>` jest prawdopodobnie najbardziej znanym przypadkiem, ale istnieją również inne możliwości. Możesz zmienić zawartość strony internetowej, używając znacznika `<img>` lub czystego CSS.

To materiał edukacyjny — pamiętaj, że hakowanie bez zgody właściciela jest nielegalne! :)

## Kod strony

Aby zaprezentować atak, tworzymy prostą stronę internetową opartą na PHP. Zazwyczaj oddzielamy logikę od widoku, ale dla uproszczenia i zminimalizowania liczby linii kodu połączyliśmy je, a cały kod strony znajduje się w pliku `index.php`. Aby uzyskać podatną stronę, musi ona być w stanie zapisywać tekst od użytkownika i wyświetlać go na ekranie bez wcześniejszego filtrowania.

W celu uproszczenia rezygnujemy z bazy danych i używamy pliku JSON. Pierwszym plikiem naszego projektu jest `db.json`:

> db.json

```json
["First comment","Second one"]
```

Aby zapisać komentarze wysyłane za pomocą skryptu PHP, wykonujemy następujące czynności:

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
* Sprawdź, czy użytkownik wysyła zapytanie metodą POST (wysłanie formularza).
* Jeśli tak:
  * Dodaj komentarz przesłany przez użytkownika do tablicy.
  * Nadpisz plik `db.json`, kodując zaktualizowaną tablicę w formacie JSON.

Niezależnie od metody zapytania, skrypt wyświetla formularz oraz listę komentarzy:

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

Możesz uruchomić serwer za pomocą polecenia:

```bash
php -S localhost:8000
```

Utworzona strona internetowa wygląda następująco:

![](https://preciselab.fra1.digitaloceanspaces.com/blog/img/eb6cbfa1-de14-45e8-b5c0-aa9b8f33df89.avif)

Strona jest w pełni funkcjonalna — pozwala na dodawanie komentarzy, zapisywanie ich w formacie JSON i wyświetlanie ich listy. Gdyby użytkownicy chcieli dodawać tylko zwykły tekst, na tym moglibyśmy zakończyć. Musimy jednak założyć, że przynajmniej jeden użytkownik będzie chciał przeprowadzić atak. :)

## Jak przeprowadzić atak?

Ten przepływ danych — zapisywanie na serwerze i wyświetlanie po stronie klienta — umożliwia przeprowadzenie ataku XSS, jeśli tekst nie zostanie odpowiednio przefiltrowany. XSS (Cross-Site Scripting) umożliwia wstrzyknięcie skryptów po stronie klienta do stron oglądanych przez innych użytkowników.

Dodany kod jest interpretowany przez przeglądarkę, a nie serwer. Nie przejmujemy więc samego serwera, ale kontrolujemy zachowanie przeglądarki klienta. Przykładowe cele atakującego to:

* Kradzież ciasteczek sesyjnych — przejęcie kontroli nad zalogowaną sesją ofiary.
* Dynamiczna zmiana treści strony.
* Uruchomienie keyloggera w przeglądarce.

Skrypt może być zapisany w bazie/pliku na serwerze lub przekazany w linku. W naszym przypadku zapisujemy skrypt do pliku `db.json` poprzez formularz komentarzy. Chcemy zmienić treść strony na "Hacked by Daniel". Po zastosowaniu każdej z poniższych metod strona będzie wyglądać tak:

![](https://preciselab.fra1.digitaloceanspaces.com/blog/img/f24230e5-22d7-472d-b782-03adbba46806.avif)

### Tag Script

Najprostszym sposobem jest dodanie znacznika `<script>`, który dynamicznie po załadowaniu strony zmienia jej zawartość:

```html
<script>document.querySelector('html').innerHTML="Hacked By Daniel"</script>
```

Ten kod wybiera element główny `html` i podmienia całą jego zawartość za pomocą właściwości `innerHTML`.

### Tag Style

Inna metoda działa nawet w sytuacji, gdy tagi `<script>` są filtrowane, a JavaScript wyłączony w przeglądarce:

```html
<style>html::before {content: "Hacked By Daniel";} body {display: none;}</style>
```

Zdefiniowaliśmy dwie reguły CSS. Pierwsza dodaje tekst `Hacked By Daniel` przed elementem body, a druga całkowicie ukrywa oryginalną treść strony (`body`).

### Tag Image

Filtrowanie tagów `<script>` i `<style>` w komentarzach nie wystarczy, ponieważ skrypty można uruchamiać również w zdarzeniach innych tagów HTML:

```html
<img src=undefined onerror='document.querySelector("html").innerHTML="Hacked By Daniel"'>
```

To przykład obrazu z nieprawidłowym adresem URL. Gdy próba załadowania pliku się nie powiedzie, przeglądarka automatycznie wykona kod JavaScript zawarty w atrybucie `onerror`.

## Jak się bronić?

Aby obronić się przed tym atakiem, musimy filtrować dane wejściowe i uciekać (escape'ować) tagi HTML. Możemy to zrobić, modyfikując kod w `index.php`:

```diff
-      $comments[] = $_POST["comment"];
+      $comments[] = htmlspecialchars($_POST["comment"]);
```

Po zastosowaniu tej poprawki tekst wpisany w formularzu zostanie wyświetlony dosłownie jako zwykły ciąg znaków, a nie zinterpretowany jako kod HTML:

![](https://preciselab.fra1.digitaloceanspaces.com/blog/img/42fe0eac-c6c6-4f93-b66e-bf2b68eb74fb.avif)

## Podsumowanie

Przedstawiliśmy proste przykłady ataków XSS przy użyciu różnych tagów HTML. Nowoczesne frameworki, takie jak Symfony czy Laravel, posiadają wbudowane mechanizmy chroniące przed XSS, ale pisząc w czystym PHP, zawsze należy pamiętać o używaniu funkcji takich jak `htmlspecialchars`.

