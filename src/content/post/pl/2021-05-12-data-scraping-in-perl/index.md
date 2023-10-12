---
title: Scrapowanie danych w języku Perl
slug: scrapowanie-danych-w-jezyku-perl
publishDate: 2021-05-11T20:37:00.000Z
date_updated: 2021-06-22T09:00:09.000Z
tags: ['perl', 'scraping']
excerpt: Artykuł prezentuje prosty scraper napisany w perlu 5. Mimo obsługiwania trzech rejestrów danych jego kod jest wyjątkowo krótki.
---

## Opis projektu

Internet zwykle kojarzy się z przeglądaniem go w postaci renderowanej przez przeglądarkę z pliku html. Jest to wygodne, jeśli zależy nam na ładnej oprawie i łatwej nawigacji.

Jeśli jednak chcemy przeglądać i analizować dane, wtedy forma strony html może okazać się nie optymalna i prościej jest pobrać strony html na swój dysk, a następnie przetworzyć je do bardziej przyjaznego dla dalszej obróbki formatu. Proces ten nazywa się scrapowaniem.

Napiszemy dzisiaj aplikację która pozwala pobierać dane z różych stron, po których można iterować za pomocą parametru w adresie url i przetwarzać je do postaci plików json.

Wykorzystamy do tego język Perl. Aplikacja będzie składała się z części pobierającej dane oraz przetwarzającej. Konfiguracja będzie wydzielona do osobnej klasy co pozwoli na łatwe rozszerzanie zbioru obsługiwanych stron.

## Instalacja

Pobieramy repo z gita i przechodzimy do utworzonego katalogu

```
git clone git@github.com:gustawdaniel/scraper.git && cd scraper
```

## Ładownia konfiguracji

Proces scrapowania można podzielić na dwie fazy: pobranie danych i ich przetworzenie. W niegkórych wypadkach - kiedy to co pobieramy decyduje o tym co będziemy pobierać

* powinny one się zazębiać, u nas nie muszą. Za pobieranie danych będzie odpowiedzialny plik `app.pl`, a za analizę `json.pl`. Pliki z rozszerzeniem `pm`, to moduły, klasy, lub biblioteki, które sami piszemy, ale nie jest to kod wykonywalny aplikacji. Mamy tu `Loader.pm` moduł odpowiedzialny za rozpoznanie parametru przekazanego do `app.pl` i załadowanie jednej z trzech dostępnych konfiguracji z plików `*Config.pm`.

Ponieważ zarówno dla `app.pl` jak i `json.pl` pierwszą czynnością jest właśnie załadowanie konfiguracji, zaczniemy od omówinia modułów. Aby kod był modułem wymagane jest zadeklarowanie go zwrotem `package`:

> Loader.pm

```perl
use strict;
use warnings FATAL => 'all';

package Loader;
```

Posiada on jedną metodę - `load`, która rozpoznaje, czy podano argument określający rodzaj scrapowaej treści. Mamy do wyoboru `rhf` - rejestr hurotwni farmaceutycznych, `scpp` - Scandinavian-Polish Chamber of Commerce oraz domyślne `ra` - rejestr aptek.

Nie zajmujmy się teraz pytaniem czym są te instytucje i dlaczego pobieramy ich dane. Można je potraktować jako przykłady i samemu dopisać tutaj inne. Istotne jest, że parametr `$ARGV[0]` jest ciągiem znakowym wpisanym za nazwią programu i w zależności od niego dociągane są odpowiednie moduły z konfiguracją, na których wykonywana jest metoda `new`. Jest to konstruktor obiektu zawierającego konfigurację. Następnie obiekt otrzymuje swoją nazwę i jest zwracany.

```perl
sub load
{
    if(scalar @ARGV && $ARGV[0] eq "rhf") {
        use RhfConfig;
        my $config = RhfConfig->new();
        $config->{name} = "rhf";
        return $config;
    } elsif (scalar @ARGV && $ARGV[0] eq "spcc") {
        use SpccConfig;
        my $config = SpccConfig->new();
        $config->{name} = "spcc";
        return $config;
    } else {
        use RaConfig;
        my $config = RaConfig->new();
        $config->{name} = "ra";
        return $config;
    }
}
```

Na tym skończył by się kod w większości języków, ale Perl wymaga dopisanie jeszcze jednej linii:

```perl
1;
```

Jedynka jest tutaj wymagana aby poinformować o sukcesie operacji ładowania modułu. Ma to sens, jeśli przy inicjalizacji poszło by coś źle. Wtedy zwracając fałsz mogli byśmy w bardziej czysty sposób zakończyć nasz program.

Jak wspomnieliśmy wcześniej mamy dostępnych kilka konfiguracji. Żeby nie powtarzać kodu zamykamy je do obiektów, które konfigurowane są przez własności i metody. W innych językach zastosowali byśmy interfejs. W perlu nie ma wbudowanego mechanizmu interfejsów, ale można go napisać samemu. Pewnie zrobili byśmy to gdyby to był większy projekt, ale dla tak prostego przypadku nie warto. Umawiamy się więc, że każda konfiguracja musi mieć kilka metod i własności, ale może je implementować na swój własny sposób. Zaczniemy do rejestru aptek:

> RaConfig.pm

```perl
use strict;
use warnings FATAL => 'all';

package RaConfig;
```

Po określeniu nazwy paczki utworzymy jej konstruktor. Zastosujemy do tego funkcję bless, której zadaniem jest zwrócić instancję obiektu tworzonej przez nas klasy.

Pierwszym argumentem konstuktora (którego nie będziemy podawać, a ustawiamy jest automatycznie w tle) jest sam moduł, na którym wywoływana jest funkcja. Coś jak this, albo self w innych języakch. Wkładamy to jako drugi argument do funkcji bless za pomocą funkcji `shift`, która z tablicy z domyślnym kontekstem czyli właśnie argumentów `new` wyciąga pierwszy element. Za pierwszy argument funkcji `bless` podajemy zbiór własności obiektu. W tym przypadku `limit` równy maksymalnemu indeksowi strony, oraz
`rows` - selektor w którym znajduje się interesująca nas treść. Pozwala on przyśpieszyć wyszukiwanie bo wszystkie późniejsze zapytania będą ograniczone tylko od obszaru wybranego przez ten selektor.

```perl
sub new { return bless {limit=>100000,rows=>'.pharmacyDetailsControl_Div.controlContainer'}, shift; }
```

Dla pobierania danych najważniejszą informacją jest adres `url` z którego można je uzyskać. Konstruowanie tego adresu na podstawie iterowanego indeksu strony wykonuje metoda `source`

```perl
sub source { # arg index
    return "http://ra.rejestrymedyczne.csioz.gov.pl/_layouts/15/RA/PharmacyDetailsPublic.aspx?id=".$_[1]."&IsDlg=1";
}
```

Metoda `invalid` pozwala nam wyłapać strony, które z jakichś powodów należy ominąć. Podajemy do niej html, bo respons może mieć kod 200, ale jeśli jest z nim coś nie tak, to ta metoda zapobiegnie dalszemu przetwarzaniu tego htmla. W tym konkretnym przypadku zwróci ona true, jeśli html ma ciąg znaków zawarty w wyrażeniu regularnym:

```perl
sub invalid { # arg html
    return $_[1] =~ /ctl00_PlaceHolderPageTitleInTitleArea_ErrorPageTitlePanel/;
}
```

Do przetwarzania kluczowa jest informacja jakie klucze i selektory odpowiadają instancji pobieranych danych. Tutaj strona jest prostą tabelą, której klucze znajdują się w elementach h3, a wartości w span. Argumentem
metody jest obiekt służący do wyszukiwania w dokumencie html określonych wartości. Za pomocą swoich metod `query` zwraca tablicę elementów pasujących do wzorca, a przez `as_trimmed_text` rzutuje je do ciągów znakowych wewnątrz tych elementów. W metodzie `select` kolejno: tworzymy `hash` - czyli strukturę danych zawierającą klucze i wartości bez patrzenia na kolejność. Następnie odnosimy się do niej jak do tablicy co pozwala
włożyć tablicę zwracaną przez pierwszy selektor jako klucze, a przez drugi jako wartości. Na koniec zwracamy hasha.

```perl
sub select { # arg query
    my %hash;
    @hash{$_[1]->query('.inputArea.full h3')->as_trimmed_text} = $_[1]->query('.inputArea.full span')->as_trimmed_text;
    return %hash;
}
```

Na koniec tak jak wcześnie zwracamy `1;`

```perl
1;
```

Klasa dla rejestru hurtowni farmaceutycznych zostanie zaprezentowana już w całości, ponieważ jest bardzo podobna.

> RhfConfig.pm

```perl
use strict;
use warnings FATAL => 'all';

package RhfConfig;

sub new { return bless {limit=>100000,rows=>'.pharmacyDetailsControl_Div.controlContainer'}, shift; }

sub source {
    return "http://rhf.rejestrymedyczne.csioz.gov.pl/_layouts/15/RHF/WarehouseDetailsPublic.aspx?id=".$_[1]."&IsDlg=1";
}

sub invalid {
    return $_[1] =~ /ctl00_PlaceHolderPageTitleInTitleArea_ErrorPageTitlePanel/;
}

sub select { # arg query
    my %hash;
    @hash{$_[1]->query('.inputArea.full h3')->as_trimmed_text} = $_[1]->query('.inputArea.full span')->as_trimmed_text;
    return %hash;
}

1;
```

Trochę inaczej natomiast skonfigurowano Skandynawsko-Polską Izbę Gospodarczą.

> SpccConfig.pm

```perl
use strict;
use warnings FATAL => 'all';

package SpccConfig;

sub new { return bless {limit=>12,rows=>'td.col-1'}, shift; }

sub source {
    my $link = "https://www.spcc.pl/members/search/all/all/all";
    if($_[1]) { $link .= "?page=".$_[1]; }
    return $link;
}

sub invalid { return 0; }

sub select {
    my $q = $_[1];
    return (
        'name'       => $q->query('.members_search_title')->as_trimmed_text,
        'phone'      => $q->query('.views-field-field-telefon-value')->as_trimmed_text,
        'person'      => $q->query('.views-field-field-kontakt-osoba-value')->as_trimmed_text,
        'email'      => $q->query('.views-field-field-email-email')->as_trimmed_text,
        'www'      => $q->query('.views-field-field-www-url')->as_trimmed_text,
        'branches'     => $q->query('.views-field-phpcode-2')->as_trimmed_text
    )
}

1;
```

W kodzie widzimy, że za pobieranie danych służą już inne selektory. Nie ma szans, żeby kod 200 oznaczał błędą stronę oraz źródło pierwszej strony nie zawiera żadnych parametrów przekazywanych do adresu `URL`. Poza tym jednak wszystkie funkcji spełniają to samo zadanie. Dzięki temu w kolejnej części będziemy mogli wykorzystać jeden kod do pobierania danych z każdego z tych źródeł.

## Pobieranie treści

Za samo pobieranie danych odpowiada `app.pl`. Zaczynamy standordowo od załadowania wymaganych modułów:

> app.pl

```perl
#!/usr/bin/env perl
use strict;
use warnings FATAL => 'all';
use LWP::Simple;
use open ':std', ':encoding(UTF-8)';
use Loader;
```

`LWP` służy do wysyłania żądań `get`, `Loader` to nasz moduł omówiony w poprzednim rozdziale. Ładujemy konfigurację określoną parametrem za nazwą programu za pomocą linii:

```perl
my $config = Loader->load();
```

Nastawiamy na `0` liczniki sukcesów pobierania `s` i błędów `e`.

```perl
my $e = 0;
my $s = 0;
```

Tworzymy katalog `raw` na pobrane dane i wewnątrz podkatalog odpowiadający skróconej nazwie naszego źródła danych.

```perl
mkdir 'raw', 0755;
mkdir 'raw/'.$config->{name}, 0755;
```

Ponieważ jest to liniowy bardzo prosty scraper, indeks podawany do metody `source` obiektu `config` obliczamy poprzez iterowanie go o jeden od zera do limitu podanego w konfiguracji.

```perl
for(my $i = 7480; $i<=$config->{limit}; $i++) {
```

Url wyciągamy za pomocą metody `source` podając jej właśnie ten index. Funkcja get z modułu `LWP:Simple` wysyła request do zadany adres i zwraca ciało odpowiedzi.

```perl
    my $html = get $config->source($i);
```

Jeśli w zwróconej odpowiedzi - czyli kodzie html znajdują się informacje o błędzie to metoda `invalid` określona w konfiguracji powinna zwrócić true. Wówczas wyświetli się czerwony napisa `ERROR`, a licznik błędów podniesie się. Spowoduje to również automatyczne przejście do kolejnego indeksu pętli.

```perl
    if ($config->invalid($html))
    {
        print "ID:\t" . $i . " - \e[31mERROR\e[0m - [e: ".++$e.", s: $s]\n";
        next;
    }
```

Jeśli wszystko poszło dobrze, to do pliku którego nazwa to po prostu `index` pętli zapisywany jest kod html strony.

```perl
    open(my $fh, '>', "raw/".$config->{name}."/".$i.".html") or die "Could not open file: $!";
    print $fh ($html);
    close $fh;
```

Index numerujący sukcesy podnosi się i zielony komunikat SUCCESS pojawia się an ekranie.

```perl
    print "ID:\t" . $i . " - \e[32mSUCCESS\e[0m - [e: $e, s: ".++$s."]\n";
}
```

Czas wykonywania pobierania zależy od szybkości łącza. U mnie time wykonany na tym programie dla spcc dał wynik:

```
real	0m35.027s
user	0m0.456s
sys	0m0.080s
```

Co pokazuje, ogromny potencjał tkwiący w zrównolegleniu operacji pobierania danych.

Przykład screenu z pobierania danch:

![](http://i.imgur.com/yAuhj4a.png)

## Analiza danych

Do przetworzenia pobranych plkiów html do postaci pliku `json` służy program `json.pl`. Zastanawiałem się nad tym, czy nie włączyć tu sqlite3 albo mongodb, ale zależało mi na lekkiej, możliwie prostej bazie NoSQL. Niestety sqlite3 nie jest NoSQL, a mondodb nie jest tak łatwa w instalacji i konfiguracji. Ostatecznie zostałem przy zwykłym pliku `json`, lecz należy pamiętać, że to rozwiązanie nie sprawdzi się przy nprawdę dużych zbiorach danych, gdzie musimy liczyć się ze skończoną ilością pamięci RAM.

Program zaczyna się od ładowani modułów.

> json.pl

```perl
#!/usr/bin/env perl
use strict;
use warnings FATAL => 'all';

use HTML::Query 'Query';
use JSON;
use Loader;
```

Pierwszym jest `HTML::Query` - silnik do parsowania html i wykonywani na nim selektorów. Moduł `JSON` pozwala konwertować hashe i tablice do foramtu `json`. `Loader` poznaliśmy już i widzieliśmy go w akcji. Odpowiada on za ładownie konfiguracji. Obok konfiguracji drugą zmienną globalną w tym programie jest tablica instancji obieków reprezentujących pobrane dane - firmy, apteki lub hurtownie.

```perl
my $config = Loader->load();
my @instances = ();
```

Ponownie robimy przebieg po wszystkich indeksach.

```perl
for(my $i = 0; $i<=$config->{limit}; $i++) {
```

Tym razem za opuszczenie pętli odpowiada sprawdzenie czy plik istnieje, jeśli nie, to przechodzimy do kolejnego przebiegu

```perl
    if (! -f 'raw/'.$config->{name}."/".$i.".html") { next; }
```

Jeśli plik istnieje, to ładujemy go do obiektu `Query`, na którym będziemy wykonywać selektory.

```perl
    my $q = Query( file => 'raw/'.$config->{name}."/".$i.".html" );
```

Okazja do ich użycia nadarza się dość szybko. Pierwszy raz korzystamy z selektora określonego w konstruktorze obiektu `config` we własności `rows`. Nim wycinamy obszar w którym są interesujące dane. Może się okazać, że jest więcej takich obszarów.

Na przykład apteki mają układ z jedną apteką na stronie, a spcc ma wiele firm na jednym widoku. Niezależnie od tego wszystkie obszary odpowiadają pojedyńczym instancjom wyszukiwanego obiektu.

```perl
    my @rows = $q->query($config->{rows})->get_elements(); #
```

Nie ważne, czy instancja jest jedna, czy jest ich kilka iterujemy po nich:

```perl
    foreach my $row (@rows)
    {
```

Wewnąrz pęli przesłaniamy nasze `query` przez `query` obcięte tylko do obszaru danej instancji.

```perl
        $q = Query( tree => $row );
```

Tak ustawiony selektor przekazujemy do metody `select` obiektu config.

```perl
        my %object = $config->select($q);
```

W metodzie `select` leżą szczegóły dotyczące tego jak parsować daną instancję obiektu. Tu nie musimy się tym przejmować. Istostne jest, że to co otrzymamy będzie obiektem typu `hash`, który następnie dołączamy do tablicy `instances`.

```perl
        push @instances, \%object;
    }
}
```

Kiedy pętla zakończy się. Tablica `instances` zostaje przekazana do obiektu kodującego ją do formatu `json`. Z powodu polskich znaków obiekt dostaje po drodze konfigurację nakazującą mu korzystać z `utf-8`.

```perl
print JSON->new->utf8(0)->encode(
    {
        'instances'=> \@instances
    }
);
```

Przetworzenie danych dla spcc zajmuje nie całe trzy sekundy, tym razem przy pełnym obciążenieu procesora.

```
real	0m2.772s
user	0m2.768s
sys	0m0.000s
```

Screen z widokiem przetworzonych danych

![](http://i.imgur.com/Hs7axWN.png)

## Podsumowanie

Program był pisany około pół roku temu. Teraz przed publikacją standardowo odrobinę go dopracowałem. Zastosowano w nim staroszkolną metodę oobsługi obiektów w Perlu. Warto wspomnieć, że istnieją w nim również biblioteki jak [Moose](https://metacpan.org/pod/release/ETHER/Moose-2.0802/lib/Moose.pm), albo [Moo](https://metacpan.org/pod/Moo) które wprowadzają obiekty dodając do nich trochę tzw. "cukru składniowego". Jednak znacznie ciekawsze jest to, że dokładnie dwa tygodnie temu - 24 lipca wyszła stabilna wersja interpretera szóstej wersji języka Perl. Wprowadza ona obiektowość jako część natywnej składni języka. Zapewnia przy tym lepsze typowanie, czyli łata chyba ten główny brak Perla 5, przez który trudno było pisać w nim bezpiecznie. Być może oznacza to, że perl 6 powróci do wyższych poziomów
popularności.
