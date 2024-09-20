---
title: Pomiar ilości tekstu i kodu w moich wpisach
slug: pomiar-ilosci-tekstu-i-kodu-w-moich-wpisach
publishDate: 1970-01-01T00:00:00.000Z
date_updated: 2021-04-20T20:35:08.000Z
draft: true
---

## Opis projektu

Ze czystej ciekawości chciałem sprawdzić jaką część moich wpisów stanowi tekst, a jaką kod źródłowy. Napisałem program, który to udzielił mi odpowiedzi na to pytanie.

Cały projekt jest napisany w perlu i składa się z jednego 21 liniowego pliku.

## Instalacja

Instalujemy zależności:

```bash
sudo apt-get install wget cpanminus
sudo cpanm install HTML::TagParser
sudo cpanm install URI::Fetch
```

Pobieramy kod źródłowy z gist

```bash
 wget https://gist.githubusercontent.com/gustawdaniel/a4bb55473e8e4399a5b087f1979e78d0/raw/3427bbd1f6b68c75e0481eaee0fc6f466db8af6d/count_text_and_code.pl -O count_text_and_code.pl
```

I gotowe.

## Działanie

Po włączeniu program drukuje nam na ekranie tabelę z liczbą znaków w tekstach (text), liczbą znaków prezentowanych kodów źródłowych (code) oraz tytułami wpisów (title).

{% include video.html url='[https://www.dropbox.com/s/bh4n1ko7ygfu3ko/10.mp4?dl=1](https://www.dropbox.com/s/bh4n1ko7ygfu3ko/10.mp4?dl=1)' webm='[https://www.dropbox.com/s/9ngx754jsj9wzxj/10.webm?dl=1](https://www.dropbox.com/s/9ngx754jsj9wzxj/10.webm?dl=1)' %}

## Kod źródłowy

Kod tego programu jest dość mocno skondensowany. Zaczyna się od załadowania bibliotek:

```perl
#!/usr/bin/env perl

use warnings;
use strict;

use HTML::TagParser;
```

Później następuje deklaracja zmiennych

```perl
my $url = 'https://blog.gustawdaniel.pl';
my @tags = ("h1 h2 h3 h4 li p","pre");
```

Pierwsza z nich to lokalizacja strony głównej tego bloga. Druga zawiera listę tagów traktowanych jako tekst (h1 h2 h3 h4 li p) oraz tagów traktowanych jako kod (pre).

Część wykonywalna skryptu rozpoczyna się rysowaniem nagłówka tabeli z wynikami

```perl
print "|     text |     code | title \n";
```

Tutaj kończy się wstęp i zaczyna magia. Kolejna linia pobiera zawartość strony głównej bloga, wyciąga z niej wszystkie elementy z tagiem `h2` i zapisuje do tablicy.

```perl
my @list = HTML::TagParser->new( $url )->getElementsByTagName( "h2" );
```

Zajmujemy się tagiem `h2` ponieważ na stronie głównej bloga wszystkie linki do wpisów znajdują się wewnątrz takiego tagu.

[![scr2.png](https://s1.postimg.org/fb5elwfgv/scr2.png)](https://postimg.org/image/r09e9v6ff/)

Naturalnym kolejnym krokiem jest przebiegnięcie pętlą po tej liście:

```perl
foreach my $elem ( @list ) {
```

Wewnątrz pętli wyciągamy wartość atrybutu `href` dla pierwszego dziecka elementu `h2` ze strony głównej. Dołączamy ją do adresu bloga - `$url` i ponownie ściągamy całą zawartość metodą `new` obiektu `TagParser`. Pobraną treść zapisujemy do zmiennej `$post`.

```perl
    my $post = HTML::TagParser->new( $url.$elem->firstChild()->getAttribute( "href" ) );
```

Za chwilę go przetworzymy, ale przed przejściem do kolejnej części programu inicjalizujemy dwuelementową tablicę wewnątrz której będziemy przechowywać tekst oraz kod wyciągnięty z posta.

```perl
    my @str = ("","");
```

Wchodzimy do kolejnego poziomu pętli, która iteruje właśnie po tych dwóch elementach. To znaczy, że dla `$i=0` wyciągamy teksty, a dla `$i=1` interesuje nas zliczanie ilości kodu źródłowego.

```perl
    foreach my $i ( (0,1) ) {
```

Taką elastyczność wyboru aktualnie zliczanych elementów dostajemy dzięki zdefiniowanej wcześniej zmiennej `@tags`. Teraz wybieramy jej pierwszy element i funkcją `split` przekształcamy go na tablicę zawierającą tagi. Funkcja `map` pozwala nam wykonać wybranie listy elementów po tagu dla każdego z wyodrębnionych tagów. Ostatecznie wszystkie te elementy trafiają do wspólnej tablicy `@elements`.

```perl
        my @elements = map {$post->getElementsByTagName($_)} split / /, $tags[$i];
```

Żeby wydobyć z nich tekst wykorzystamy metodę `innerText` i prostym mapowaniem oraz rzutowaniem tablicy na string wyciągniemy szukane teksty.

```perl
        $str[$i] = join("",map {$_->innerText} @elements);
```

Możemy na tym zakończyć ciało pętli po indeksach (0,1)

```perl
    }
```

Zostało nam już tylko obliczenie ilości znaków i wydrukowanie wyników - jedna linia kodu:

```perl
    printf("| %8d | %8d | %-60s \n", (map {$str[$_] =~ y===c} (0,1)), $elem->innerText);
```

Na sam koniec zamykamy pętlę po postach.

```perl
}
```

Działanie programu jest gwarantowane do momentu zmiany organizacji linków na stronie głównej w kodzie `html`.

## Podsumowanie

Wyniki są pomiarów przedstawia poniższy screen:

[![screen.png](https://s11.postimg.org/niq06o56r/screen.png)](https://postimg.org/image/o88sj15q7/)

Jest to jeden z najkrótszych wpisów. Jest to też jeden z najkrótszych kodów źródłowych. Właśnie gęstość składni w perlu jest moim zdaniem jedną z największych zalet tego pięknego języka.
