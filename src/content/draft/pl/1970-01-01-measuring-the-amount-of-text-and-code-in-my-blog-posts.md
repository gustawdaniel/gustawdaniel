---
title: Pomiar ilości tekstu i kodu w moich wpisach
slug: pomiar-ilosci-tekstu-i-kodu-w-moich-wpisach
publishDate: 2017-02-14T00:00:00.000Z
updateDate: 2026-08-03T00:00:00.000Z
draft: false
canonicalName: measuring-the-amount-of-text-and-code-in-my-blog-posts
---

W 2017 roku, z czystej ciekawości, postanowiłem sprawdzić, jaką część moich artykułów na blogu stanowi tekst pisany, a jaką kod źródłowy. Napisałem wtedy zwięzły, 21-liniowy program w Perlu, który dał mi szybką odpowiedź.

W 2021 roku – przy okazji eksperymentów z językiem Perl 6 (obecnie Raku) – przepisałem ten skrypt i ku mojemu zaskoczeniu otrzymałem zupełnie inne liczby. Z braku czasu zostawiłem ten temat, lecz niedawno powróciłem do niego, aby przeprowadzić kompleksowe śledztwo. 

Okazało się, że tak z pozoru trywialny problem – **„zlicz znaki tekstu i kodu na stronie HTML”** – kryje pod spodem fascynujący świat inżynieryjnych niuansów. Od błędów w darmowych bibliotekach CPAN, przez subtelności zagnieżdżania w drzewie DOM, aż po specyfikację Unicode (grafemy vs punkty kodowe) i optymalizację warstwy sieciowej HTTP.

W tym artykule zabiorę Cię w podróż przez kolejne próby uzgodnienia wyników w 4 językach programowania (**Perl 5**, **Raku**, **Python** oraz **Rust**), kończąc niespodziewanym werdyktem wydajnościowym, w którym kilkunastoletni Perl pokonał zoptymalizowany kod w Ruste.

---

## Akt I: Rok 2017 i 21-liniowy skrypt w Perlu 5

Moje pierwsze podejście z 2017 roku opierało się na prostym założeniu: pobieramy stronę główną bloga, wyciągamy z niej odnośniki do artykułów z nagłówków `<h2>`, pobieramy każdy post z osobna, a następnie zliczamy znaki w elementach tekstowych (`<h1>-<h4>`, `<p>`, `<li>`) oraz w blokach kodu (`<pre>`).

Oto oryginalny skrypt wykorzystujący bibliotekę `HTML::TagParser`:

```perl
#!/usr/bin/env perl
use warnings;
use strict;
use HTML::TagParser;

my $url = 'https://gustawdaniel.com';
my @tags = ("h1 h2 h3 h4 li p", "pre");

print "|     text |     code | title \n";

my @list = HTML::TagParser->new( $url )->getElementsByTagName( "h2" );
foreach my $elem ( @list ) {
    my $post = HTML::TagParser->new( $url . $elem->firstChild()->getAttribute( "href" ) );
    my @str = ("", "");
    foreach my $i ( (0, 1) ) {
        my @elements = map { $post->getElementsByTagName($_) } split / /, $tags[$i];
        $str[$i] = join("", map { $_->innerText } @elements);
    }
    printf("| %8d | %8d | %-60s \n", (map { $str[$_] =~ y===c } (0, 1)), $elem->innerText);
}
```

Działało doskonale... aż do momentu, gdy po latach uruchomiłem go ponownie i natrafiłem na dwa istotne problemy.

### Problem 1: Brak obsługi HTTPS
Pierwszy błąd przy ponownym uruchomieniu w nowym środowisku brzmiał:
```text
URI::Fetch failed: Protocol scheme 'https' is not supported (LWP::Protocol::https not installed)
```
Okazało się, że moduł `HTML::TagParser` pod spodem korzysta z `LWP::UserAgent`. Domyślnie w Perlu `LWP` wspiera jedynie protokół `http://`. Dopiero instalacja systemowego pakietu `liblwp-protocol-https-perl` (lub przez CPAN: `cpanm LWP::Protocol::https`) pozwoliła nawiązywać połączenia szyfrowane.

### Problem 2: Anatomia Buga w CPAN (`HTML::TagParser`)
Po naprawieniu HTTPS skrypt zadziałał, lecz dla niektórych wpisów (np. o prawie Zipfa oraz prawie Benforda) pokazywał **okrągłe `0` znaków kodu**, mimo że artykuły te zawierały mnóstwo bloków `<pre>`!

Debugowanie wykazało błąd w samej bibliotece `HTML::TagParser` (`HTML/TagParser.pm`, linia 257). Moduł ten przy parsowaniu wartości atrybutów w ujęciu podwójnego cudzysłowu `"` stosował wyrażenie regularne, które ucinało ciąg tekstowy w miejscu wystąpienia... pojedynczego apostrofu `'`!

Adresy artykułów na blogu wyglądały następująco:
* `/posts/en/zipf's-law-in-nodejs/` $\rightarrow$ ucinało do `/posts/en/zipf`
* `/posts/en/benford's-law/` $\rightarrow$ ucinało do `/posts/en/benford`

Serwer po zapytaniu o nieistniejący zniekształcony URL zwracał stronę 404 lub przekierowanie na stronę główną, gdzie brakowało tagów `<pre>`.

Hakerską poprawką w Perlu było sięgnięcie bezpośrednio do wewnętrznej struktury reprezentacji węzła w Perlu (`$node->[0]->[$node->[1]]->[2]`), w której przechowywany jest nieprzetworzony, surowy tekst atrybutów HTML:

```perl
sub get_href {
    my ($node) = @_;
    my $raw = $node->[0]->[$node->[1]]->[2] // "";
    if ($raw =~ /href=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i) {
        return $1 // $2 // $3;
    }
    return $node->getAttribute("href");
}
```

Błąd w bibliotece wyeliminowany, ale to był dopiero początek odkryć.

---

## Akt II: Przepisanie na Raku (Perl 6) i wyzwanie zagnieżdżania DOM

W 2021 roku spróbowałem przepisać ten algorytm do **Raku**. W Raku zamiast operować na przestarzałym `HTML::TagParser`, użyłem nowocześniejszego modułu `DOM::Tiny` z selektorami CSS:

```raku
#!/usr/bin/env raku
use WWW;
use DOM::Tiny;

my $base_url = 'https://gustawdaniel.com';
my $dom = DOM::Tiny.parse(get($base_url));

for $dom.find('h3 a') -> $a {
    my $url  = $a.attr('href');
    my $post = DOM::Tiny.parse(get($url));

    my $text = $post.find('h1, h2, h3, h4, p, li').map(*.all-text).join;
    my $code = $post.find('pre').map(*.all-text).join;

    printf("| %8d | %8d | %-60s \n", $text.chars, $code.chars, $a.all-text.trim);
}
```

Kod skrócił się do zaledwie **18 linii** i stał się wyjątkowo czytelny. Jednak podczas audytu wyników dla wszystkich 68 artykułów na blogu zauważyłem rozbieżności.

W jednym ze starych artykułów z 2017 roku (*„Application with FOSUserBundle and Google Maps API”*) Raku zwrócił **42 469** znaków kodu, podczas gdy inne parsery wskazywały **42 529** znaków.

### Dlaczego brakowało 60 znaków?
We wpisie tym znajdowało się aż 70 bloków kodu `<pre>` zawierających szablony HTML i Twig. Wewnątrz niektórych bloków `<pre>` znajdowały się zagnieżdżone elementy HTML, np.:
```html
<pre class="astro-code"><code><div class="container eternity-form">...</div></code></pre>
```
Liniowy przeszukiwacz drzewa w Raku bez przekazywania kontekstu rodzica, natrafiając na wewnętrzny znacznik `<div>`, „gubił” informację, że znajduje się wewnątrz bloku `<pre>` i zaliczał zawarty w nim kod HTML do tekstu artykułu!

Rozwiązaniem okazało się rekurencyjne przekazywanie flagi `$is_pre` w głąb drzewa DOM:

```raku
sub collect-text($tree, $is_pre = False) {
    my $t = "";
    my $c = "";
    for $tree.children -> $node {
        if $node ~~ DOM::Tiny::HTML::Text {
            if $is_pre { $c ~= $node.text; } else { $t ~= $node.text; }
        } elsif $node ~~ DOM::Tiny::HTML::Tag {
            my $in_code = $is_pre || $node.tag eq "pre";
            my ($sub_t, $sub_c) = collect-text($node, $in_code);
            $t ~= $sub_t;
            $c ~= $sub_c;
        }
    }
    return ($t, $c);
}
```

---

## Akt III: Niuans parsujący – spacje i encje HTML

Porównując różne biblioteki parsowania w Pythonie (`selectolax`), Ruste (`scraper`), Perlu 5 (`Mojo::DOM`) oraz Raku (`DOM::Tiny`), odkryłem kolejne źródła rozbieżności w wynikach:

1. **Encje HTML (`&amp;`, `&lt;`, `&gt;`, `&quot;`)**:
   Niektóre biblioteki zwracają surowy tekst z drzewa DOM wraz z encjami HTML (gdzie `&amp;` liczy się jako 5 znaków), podczas gdy inne automatycznie dekodują je do postaci znaków `&`, `<`, `>`, `"` (gdzie `&` to 1 znak). Aby uzyskać powtarzalność, wszystkie parsery muszą pracować na zdekodowanym tekście.

2. **Elementy `<span>` generatorów składni (Highlighterów)**:
   Współczesne silniki blogowe (np. Astro ze Shiki lub Prism) dzielą kod w blokach `<pre>` na dziesiątki zagnieżdżonych elementów `<span class="line"><span class="token keyword">const</span>...</span>`.
   Niektóre parsery HTML przy operacji `all_text` doklejają spójniki lub spacje pomiędzy sąsiadującymi tagami `<span>`. Jeśli parser doda spację po każdym słowie kluczowym ujętym w `<span>`, wynik zliczenia znaków w kodzie drastycznie wzrośnie!

---

## Akt IV: Tajemnica Unicode – Grafemy vs Punkty Kodowe vs Bajty

Najbardziej fascynujące odkrycie czekało na mnie podczas analizy wpisu `#13` (*tRPC – super fast development cycle...*). 

Wyniki wyliczeń tekstu dla tego wpisu wyglądały tak:
* **Rust**: `10 424` znaki
* **Python**: `10 424` znaki
* **Perl 5**: `10 424` znaki
* **Raku**: **`10 423`** znaki (dokładnie o 1 mniej!)

Dlaczego Raku uporczywie pokazywało o 1 znak mniej? Przeskanowałem tekst wpisu znak po znaku w poszukiwaniu symboli spoza zakładowej tablicy ASCII. Odpowiedź kryła się we fragmencie zdania:

> *„I learned tRPC today and fall in love **❤️** instantly...”*

Spójrzmy na emoji czerwonego serca **`❤️`**. W standardzie Unicode ten symbol składa się z **dwóch punktów kodowych** (*Code Points*):
1. `U+2764` (Czarny kształt serca `❤`)
2. `U+FE0F` (Niewidzialny modyfikator `VARIATION SELECTOR-16`, nakazujący wyrenderować kolorowe emoji).

### Jak liczą to języki programowania?

* **Python** (`len("❤️")`): Liczy punkty kodowe Unicode $\rightarrow$ **2 znaki**.
* **Rust** (`str.chars().count()`): Liczy punkty kodowe Unicode $\rightarrow$ **2 znaki**.
* **Perl 5** (`length("❤️")`): Liczy punkty kodowe Unicode $\rightarrow$ **2 znaki**.
* **Raku** (`"❤️".chars`): Larry Wall zaprojektował Raku tak, aby domyślnie operował na **NFG (*Normalized Form Grapheme*)**. Dla Raku liczy się to, co człowiek widzi na ekranie jako jeden widzialny symbol – czyli **1 grafem**!

Aby Raku zliczał znaki w dokładnie taki sam sposób jak Python, Rust czy Perl 5 (czyli punkty kodowe), wystarczyło zastąpić metodę `.chars` metodą **`.codes`**:

```raku
# .codes zlicza punkty kodowe Unicode (Code Points) zamiast grafemów NFG
printf("| %8d | %8d | %-60s \n", $text.codes, $code.codes, $title);
```

Po tej zmianie Raku osiągnął **100% zgodności co do jednego bajtu** z pozostałymi językami.

---

## Akt V: Konfrontacja 4 języków programowania

Stworzyłem spójne implementacje algorytmu zliczania tekstu i kodu w 4 językach:

### 1. Python (`httpx` + `selectolax`)
```python
#!/usr/bin/env python3
import httpx
from selectolax.parser import HTMLParser

BASE_URL = "https://gustawdaniel.com"
res = httpx.get(BASE_URL)
parser = HTMLParser(res.text)

for a in parser.css("h3 > a"):
    path = a.attributes.get("href", "")
    url = path if path.startswith("http") else f"{BASE_URL}{path}"
    post_parser = HTMLParser(httpx.get(url).text)

    code_str = "".join(pre.text(deep=True) for pre in post_parser.css("section pre"))
    for pre in post_parser.css("section pre"):
        pre.decompose()
    text_str = "".join(sec.text(deep=True) for sec in post_parser.css("section"))

    print(f"| {len(text_str):8d} | {len(code_str):8d} | {a.text().strip():<60} |")
```

### 2. Rust (`ureq` + `scraper`)
```rust
use ureq;
use scraper::{Html, Selector};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let body = ureq::get("https://gustawdaniel.com").call()?.into_string()?;
    let fragment = Html::parse_fragment(&body);

    for element in fragment.select(&Selector::parse("h3 > a")?) {
        let path = element.value().attr("href").unwrap_or("");
        let post_body = ureq::get(path).call()?.into_string()?;
        let post_fragment = Html::parse_fragment(&post_body);

        let mut code = String::new();
        let mut text = String::new();

        for section in post_fragment.select(&Selector::parse("section")?) {
            for node in section.descendants() {
                if let Some(t) = node.value().as_text() {
                    if node.parents().any(|p| p.value().as_element().map_or(false, |e| e.name() == "pre")) {
                        code.push_str(t);
                    } else {
                        text.push_str(t);
                    }
                }
            }
        }
        println!("| {:8} | {:8} | {:<60} |", text.chars().count(), code.chars().count(), element.text().collect::<String>());
    }
    Ok(())
}
```

### 3. Perl 5 (`Mojo::UserAgent` + `Mojo::DOM`)
```perl
#!/usr/bin/env perl
use warnings;
use strict;
use Mojo::DOM;
use Mojo::UserAgent;

my $ua   = Mojo::UserAgent->new;
my $main = $ua->get('https://gustawdaniel.com')->res->dom;

sub collect_text {
    my ($node) = @_;
    my ($t, $c) = ("", "");
    for my $child ($node->child_nodes->each) {
        if ($child->type eq "text") {
            $t .= $child->content;
        } elsif ($child->type eq "tag") {
            if ($child->tag eq "pre") {
                $c .= $child->all_text;
            } else {
                my ($st, $sc) = collect_text($child);
                $t .= $st; $c .= $sc;
            }
        }
    }
    return ($t, $c);
}

for my $elem ($main->find('h3 a')->each) {
    my $post = $ua->get($elem->attr('href'))->res->dom;
    my ($text, $code) = ("", "");
    for my $sec ($post->find('section')->each) {
        my ($t, $c) = collect_text($sec);
        $text .= $t; $code .= $c;
    }
    printf("| %8d | %8d | %-60s \n", length($text), length($code), $elem->all_text);
}
```

### Podsumowanie audytu dla wszystkich 68 wpisów:

| Porównanie języków | Liczba wpisów z 100% identycznymi wynikami | Zgodność |
| :--- | :---: | :---: |
| **Rust vs Python** | **68 / 68** | **100.00% (Wzorzec)** |
| **Rust vs Perl 5 (`Mojo::DOM`)** | **68 / 68** | **100.00% (Wzorzec)** |
| **Rust vs Raku (`.codes`)** | **68 / 68** | **100.00% (Wzorzec)** |

Wszystkie skrypty dały **co do jednego znaku tożsame wyniki**.

---

## Wisienka na torcie: Wyścig wydajności (Benchmark)

Mając 4 działające i w 100% zgodne skrypty, zmierzyłem czas potrzebny na przetworzenie wszystkich 68 artykułów z serwera produkcyjnego komendą `time`:

| Język / Środowisko | Biblioteka HTTP / Parser | Czas rzeczywisty (`real`) | Czas CPU (`user`) | Miejsce |
| :--- | :--- | :---: | :---: | :---: |
| **Perl 5** | `Mojo::UserAgent` + `Mojo::DOM` | **`6.542 s`** | `1.849 s` | 🥇 **1. miejsce** |
| **Rust** (Release) | `ureq` + `scraper` | **`11.123 s`** | **`0.355 s`** | 🥈 **2. miejsce** |
| **Python** (`uv`) | `httpx` + `selectolax` | **`12.068 s`** | `0.779 s` | 🥉 **3. miejsce** |
| **Raku** | `WWW` + `DOM::Tiny` | **`1m 23.241 s`** | `1m 01.892 s` | 4. miejsce |

### Dlaczego kilkunastoletni Perl 5 wygrał z Rustem?

Na pierwszy rzut oka wynik wywołuje szok: **jak Perl 5 mógł okazać się prawie 2-krotnie szybszy od skompilowanego Rusta?**

Wgląd w parametry CPU zdradza prawdę:
* **Rust wykorzystał zaledwie 0.35 s czasu procesora**. Samo parsowanie HTML w Rust było błyskawiczne.
* **Perl 5 zużył 1.85 s CPU**, ale zakończył całe zadanie w **6.54 s**.

Powód leży w **warstwie sieciowej HTTP i utrzymywaniu sesji (HTTP Keep-Alive)**:
1. `Mojo::UserAgent` w Perlu domyślnie inicjalizuje **pulę otwartych połączeń HTTP/1.1**. Po pobraniu pierwszego artykułu połączenie TCP oraz uścisk dłoni TLS (*TLS Handshake*) są wielokrotnie reużywane dla kolejnych 67 zapytań.
2. Skrypt w Ruste wywoływał `ureq::get(&url).call()` w pętli. Bez jawnie utworzonego agenta z pulą połączeń, dla każdego z 68 zapytań nawiązywane było **nowe połączenie TCP i nowy handshake TLS**.

Opóźnienia sieciowe (RTT) i nawiązywanie szyfrowania TLS dla 68 osobnych połączeń całkowicie zdominowały czas wykonania. Wynik ten pokazał najważniejszą lekcję inżynierii oprogramowania: **optymalizacja algorytmiczna i szybkość parsera są bezużyteczne, jeśli wąskim gardłem jest I/O i braki w optymalizacji protokołu sieciowego**.

---

## Podsumowanie

To, co miało być zwykłym wyliczeniem statystyk bloga, zmieniło się w niesamowity test wiedzy inżynieryjnej:

1. **Jakość bibliotek**: Nawet popularne pakiety w CPAN mogą zawierać nieoczekiwane błędy w regexach obcinające wartości atrybutów na apostrofach.
2. **Drzewo DOM**: Należy precyzyjnie kontrolować kontekst zagnieżdżenia elementów (takich jak `<pre>`) w kodzie HTML.
3. **Specyfikacja Unicode**: Zanim porównasz długość stringów w różnych językach, upewnij się, czy mierzysz **grafemy (NFG)**, **punkty kodowe (Code Points)**, czy **bajty UTF-8**.
4. **Wydajność sieciowa**: Utrzymywanie trwałej sesji HTTP (Keep-Alive) ma drastycznie większy wpływ na czas wykonania skryptów sieciowych niż sam wybór języka programowania czy szybkość parsera HTML.
