---
author: Daniel Gustaw
canonicalName: measuring-the-amount-of-text-and-code-in-my-blog-posts
coverImage: https://preciselab.fra1.digitaloceanspaces.com/blog/img/15be2f16-3724-4012-b7a9-d9a4ee508c13.avif
description: Eksperymentalne badanie ilości kodu i tekstu w 68 wpisach na blogu w 4 językach (Perl 5, Raku, Python, Rust) wraz z analizą wydajności I/O i HTTP Keep-Alive.
draft: false
publishDate: 2017-02-14T00:00:00.000Z
slug: pomiar-ilosci-tekstu-i-kodu-w-moich-wpisach
tags: ['perl', 'raku', 'python', 'rust', 'benchmark', 'unicode', 'http']
title: Pomiar ilości tekstu i kodu w moich wpisach
updateDate: 2026-08-03T00:00:00.000Z
---

W 2017 roku, z czystej ciekawości, postanowiłem sprawdzić, jaką część moich artykułów na blogu stanowi tekst pisany, a jaką kod źródłowy. Napisałem wtedy zwięzły, 21-liniowy program w Perlu, który dał mi szybką odpowiedź.

W 2021 roku – przy okazji eksperymentów z językiem Perl 6 (obecnie Raku) – przepisałem ten skrypt i ku mojemu zaskoczeniu otrzymałem zupełnie inne liczby. Z braku czasu zostawiłem ten temat, lecz niedawno powróciłem do niego, aby przeprowadzić kompleksowe śledztwo. 

Okazało się, że tak z pozoru trywialny problem – **„zlicz znaki tekstu i kodu na stronie HTML”** – kryje pod spodem fascynujący świat inżynieryjnych niuansów. Od błędów w darmowych bibliotekach CPAN, przez subtelności zagnieżdżania w drzewie DOM, aż po specyfikację Unicode (grafemy vs punkty kodowe) i optymalizację warstwy sieciowej HTTP.

W tym artykule zabiorę Cię w podróż przez kolejne próby uzgodnienia wyników w 4 językach programowania (**Perl 5**, **Raku**, **Python** oraz **Rust**), przedstawiając kompletne statystyki dla 68 artykułów, wykresy ewolucji proporcji kodu oraz niespodziewane wyniki wydajnościowe.

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

## Akt V: Tabela wyników dla wszystkich 68 artykułów

Po ujednoliceniu algorytmu zliczania i obsłudze zagnieżdżania w DOM, wygenerowałem pełne zestawienie długości tekstu oraz kodu dla wszystkich 68 wpisów opublikowanych na blogu.

### Podsumowanie statystyczne:
* **Łączna liczba przeanalizowanych artykułów**: `68`
* **Łączna liczba znaków tekstu**: **`504 233`**
* **Łączna liczba znaków kodu źródłowego**: **`430 084`**
* **Łączna objętość znakowa bloga**: **`934 317`** znaków
* **Średni udział kodu na blogu**: **`46.03%`**

### Tabela pomiarowa:

| # | Znaki tekstu | Znaki kodu | Udział kodu | Tytuł artykułu |
| :---: | :---: | :---: | :---: | :--- |
| 1 | 7 770 | 10 782 | 58.1% | Leveraging SIMD in Rust for High-Performance Computing |
| 2 | 10 794 | 8 754 | 44.8% | From MLP to CNN. Neural Networks for MNIST Digit Recognition |
| 3 | 7 906 | 14 172 | 64.2% | Rust Wasm performance on snake game example |
| 4 | 9 370 | 10 517 | 52.9% | Activation Functions in Machine Learning |
| 5 | 16 421 | 6 088 | 27.0% | Machine Learning XOR from Scratch |
| 6 | 5 324 | 3 504 | 39.7% | LangChain Exemplary Use Cases |
| 7 | 1 835 | 8 461 | 82.2% | Fastify Prisma REST backend |
| 8 | 1 171 | 2 454 | 67.7% | Web Push Notifications |
| 9 | 2 854 | 10 898 | 79.3% | Svelte snake deployed on deno |
| 10 | 4 478 | 10 277 | 69.6% | Rust implementation of RFC 7396 - JSON Merge Patch |
| 11 | 6 219 | 1 590 | 20.4% | Tutorial for ESM + CommonJS package creators |
| 12 | 2 860 | 638 | 18.2% | How to Install Yay on a Pure Arch Linux Docker Image |
| 13 | 4 381 | 456 | 9.4% | Simplifying Linux Command Line with GPT-CLI (rust, open source) |
| 14 | 10 424 | 8 602 | 45.2% | tRPC - super fast development cycle for fullstack typescript apps |
| 15 | 1 739 | 567 | 24.6% | How to install MongoDB 6 on Fedora 37 |
| 16 | 4 685 | 2 325 | 33.2% | QuickSort implementation in Rust, Typescript and Go |
| 17 | 2 640 | 1 823 | 40.8% | ZeroMQ pull-push pattern for Node JS |
| 18 | 4 054 | 3 103 | 43.4% | New Google Identity in Nuxt 3 |
| 19 | 17 975 | 4 703 | 20.7% | Selected syntax in JavaScript ES2020, ES2021 and ES2022 |
| 20 | 6 291 | 3 389 | 35.0% | CodinGame: Best fit to data - Rust - Regression Analysis |
| 21 | 9 734 | 13 419 | 57.9% | CodinGame: Derivative Time - Part 1, Recursion (Typescript) |
| 22 | 7 971 | 17 238 | 68.4% | CodinGame: Quaternion Multiplication - Rust, NodeJS - Parsing, Algebra |
| 23 | 5 453 | 7 563 | 58.1% | CodinGame: ASCI Art - Rust, NodeJs - Strings, Arrays, Loops |
| 24 | 1 538 | 805 | 34.4% | Overload Signatures in Typescript |
| 25 | 12 712 | 15 481 | 54.9% | Login by Metamask - Rest Backend in Fastify (Node, Typescript, Prisma) |
| 26 | 3 051 | 2 711 | 47.1% | Login Component in Nuxt (Rest Strapi) |
| 27 | 3 642 | 5 461 | 60.0% | Maximum Inequality [Linear Search] rust and typescript |
| 28 | 6 427 | 5 635 | 46.7% | Pulumi - Infrastructure as a Code [ Digital Ocean ] |
| 29 | 1 153 | 2 011 | 63.6% | Last Occurrence [Linear Search] easy |
| 30 | 5 573 | 2 270 | 28.9% | Analysis of Zipf's Law in Node.js |
| 31 | 5 628 | 2 186 | 28.0% | Retry Policy - How to Handle Random, Unpredictable Errors |
| 32 | 2 012 | 1 438 | 41.7% | Publishing an update of the package in the AUR repository |
| 33 | 3 726 | 1 735 | 31.8% | Least Common Multiple - Number Theory |
| 34 | 8 025 | 6 501 | 44.8% | How to configure SSL in local development |
| 35 | 13 753 | 3 217 | 18.9% | Another installation guide for Arch Linux (i3) |
| 36 | 17 645 | 5 769 | 24.6% | Benford's Law for the Fibonacci Sequence in Java, Rust, and Node JS |
| 37 | 5 226 | 488 | 8.5% | Bolt (always) Lite - MITM, Proxy, Insomnia and Vue |
| 38 | 14 801 | 5 190 | 25.9% | Process Control in Node JS |
| 39 | 4 168 | 788 | 15.9% | Xss attack using script style and image |
| 40 | 8 111 | 6 704 | 45.2% | Broadcast Channel API |
| 41 | 5 953 | 11 488 | 65.9% | Analysis of the frequency of altcoin names in the English language corpus |
| 42 | 4 977 | 5 391 | 52.0% | Scraping the most popular Twitter accounts |
| 43 | 1 667 | 0 | 0.0% | How to create a free email account with custom domain? |
| 44 | 2 549 | 735 | 22.4% | Telegram Bot in Typescript |
| 45 | 2 829 | 223 | 7.3% | Installation of a renewable TLS certificate (certbot + apache on Ubuntu) |
| 46 | 11 063 | 3 997 | 26.5% | Data scraping in Perl |
| 47 | 13 494 | 10 561 | 43.9% | Scraping Facebook in 2021 |
| 48 | 6 689 | 0 | 0.0% | How the war for compatibility shaped the frontend? |
| 49 | 5 789 | 2 364 | 29.0% | We squeeze data from PDF like juice from a lemon |
| 50 | 9 900 | 7 392 | 42.7% | Fetch, Promise and Template String on example of To Do List in JavaScript |
| 51 | 9 647 | 4 423 | 31.4% | Communication between Vue components in Meteor |
| 52 | 1 845 | 199 | 9.7% | Git styled calendar with custom dates |
| 53 | 6 222 | 9 663 | 60.8% | How many families can fit on the plane - an algorithmics problem |
| 54 | 2 711 | 0 | 0.0% | Scraping WordPress - 4300 court rulings in exchange rate lawsuits without a line of code |
| 55 | 9 772 | 5 335 | 35.3% | Ruby on Rails - quick introduction |
| 56 | 2 631 | 897 | 25.4% | Infrastructure as Code (Terraform + Digital Ocean) |
| 57 | 2 491 | 1 718 | 40.8% | Calculating the Difference Between JSON Files |
| 58 | 4 137 | 4 421 | 51.7% | Scraping of the Pharmacy Register |
| 59 | 11 266 | 8 429 | 42.8% | How to download contact data for 20k lawyers in an hour |
| 60 | 5 399 | 4 318 | 44.4% | Scraping from money.pl in 30 lines of code. |
| 61 | 17 602 | 16 397 | 48.2% | Data Structuring on the Example of CHF NBP Course |
| 62 | 23 419 | 42 529 | 64.5% | Application with FOSUserBundle and Google Maps API |
| 63 | 7 876 | 2 916 | 27.0% | Compilation of PHP 7 interpreter in BunsenLabs |
| 64 | 17 066 | 11 550 | 40.4% | Analysis of Apache logs with GoAccess |
| 65 | 11 265 | 9 313 | 45.3% | The impact of indexing on search performance in MySQL database |
| 66 | 16 235 | 22 121 | 57.7% | Tesseract-OCR and testing selects. |
| 67 | 12 066 | 12 339 | 50.6% | Visualization of a dynamic correlation network. |
| 68 | 8 133 | 11 652 | 58.9% | Data logging in MySql, Ajax, and Behat |

---

### Wykresy ewolucji tekstu i kodu

Poniższe wykresy obrazują zmianę objętości artykułów oraz procentowy udział kodu źródłowego na przestrzeni lat:

![Ewolucja ilości tekstu i kodu w kolejnych wpisach](/img/measuring-the-amount-of-text-and-code-in-my-blog-posts/chart_text_vs_code_evolution.svg)

![Procentowy udział kodu we wpisach](/img/measuring-the-amount-of-text-and-code-in-my-blog-posts/chart_code_ratio_evolution.svg)

---

## Akt VI: Konfrontacja 4 języków programowania

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

## Akt VII: Wyścig wydajności i Pula Połączeń HTTP

Mając 4 działające i w 100% zgodne skrypty, zmierzyłem wydajność wykonania wszystkich programów (czas rzeczywisty `real`, czas CPU oraz szczytowe zużycie pamięci operacyjnej `Max RSS`).

### Niespodziewany wynik wstępny
W pierwszej wersji benchmarku skrypt w Perlu 5 z `Mojo::UserAgent` wykonywał się w czasie **11.39 s**, podczas gdy podstawowa wersja w Ruste potrzebowała **5.21 s**, a Python **5.74 s**.

Zastanawiające było jednak to, dlaczego Python i podstawowy Rust były tylko 2-krotnie szybsze od Perla, mimo że procesor w Rust wykonywał całą pracę w zaledwie **0.37 s**!

Powód leżał w **warstwie sieciowej HTTP i utrzymywaniu sesji (HTTP Keep-Alive)**:
1. `Mojo::UserAgent` w Perlu oraz zoptymalizowany klient sieciowy reużywają połączenia TCP/TLS.
2. Podstawowa wersja skryptu w Ruste (`rust/src/main.rs`) wywoływała statyczną funkcję `ureq::get(&url)` w pętli. Bez jawnie utworzonego agenta z pulą połączeń, dla każdego z 68 zapytań nawiązywane było **nowe połączenie TCP i nowy handshake TLS**.
3. W Pythonie (`count_text_and_code.py`) wywoływano `httpx.get(url)` w pętli. Podobnie jak w Ruste, wywołanie `httpx.get()` tworzy tymczasowego klienta i zamyka gniazdo po każdym zapytaniu. Gdybyśmy użyli `with httpx.Client() as client:`, Python również utrzymywałby pulę połączeń Keep-Alive.

### Reorganizacja w Ruste: `rust/src/bin/connection_pool.rs`

Tworzymy jawną instancję `ureq::Agent::new_with_defaults()`, która przechowuje pulę otwartych połączeń TCP i reużywa je dla kolejnych zapytań HTTP:

```rust
// rust/src/bin/connection_pool.rs - jawny agent z pulą połączeń
let agent = ureq::Agent::new_with_defaults();

let body: String = agent.get(BASE_URL).call()?.into_string()?;

for element in fragment.select(&selector) {
    // Reużywanie istniejącego połączenia TLS dzięki tej samej instancji agenta:
    let post_body: String = agent.get(&url).call()?.into_string()?;
}
```

---

### Ostateczne zestawienie benchmarków

Poniższa tabela przedstawia precyzyjne pomiary czasu oraz pamięci RAM zarejestrowane dla poszczególnych implementacji:

| Język / Wariant | Biblioteka HTTP / Parser | Connection Pool | Czas rzeczywisty (`real`) | Czas CPU (`user`+`sys`) | Zużycie RAM (`Max RSS`) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| 🥇 **Rust (`connection_pool`)** | `ureq::Agent` + `scraper` (Release) | ✅ **Tak** | **`3.34 s`** | **`0.28 s`** | **`15.05 MB`** |
| 🥈 **Rust (`rust` Standard)** | `ureq::get` + `scraper` (Release) | ❌ **Nie** | **`5.21 s`** | **`0.37 s`** | **`14.50 MB`** |
| 🥉 **Python** (`httpx`) | `httpx.get` + `selectolax` | ❌ **Nie** | **`5.74 s`** | **`0.82 s`** | **`85.16 MB`** |
| **Perl 5** | `Mojo::UserAgent` + `Mojo::DOM` | ✅ **Tak** | **`11.39 s`** | **`3.14 s`** | **`42.29 MB`** |
| **Raku** | `WWW` (`get`) + `DOM::Tiny` | ❌ **Nie** | **`37.63 s`** | **`31.93 s`** | **`388.90 MB`** |

---

### Wykresy porównawcze wydajności

#### Czas rzeczywisty wykonania (`Wall-Clock Real Time`)
![Czas rzeczywisty wykonania](/img/measuring-the-amount-of-text-and-code-in-my-blog-posts/chart_real_time.svg)

#### Zużycie czasu procesora (`CPU Time`)
![Czas procesora CPU](/img/measuring-the-amount-of-text-and-code-in-my-blog-posts/chart_cpu_time.svg)

#### Szczytowe zużycie pamięci RAM (`Max RSS`)
![Szczytowe zużycie pamięci RAM](/img/measuring-the-amount-of-text-and-code-in-my-blog-posts/chart_ram_usage.svg)

---

## Podsumowanie

To, co miało być zwykłym wyliczeniem statystyk bloga, zmieniło się w niesamowity test wiedzy inżynieryjnej:

1. **Jakość bibliotek**: Nawet popularne pakiety w CPAN mogą zawierać nieoczekiwane błędy w regexach obcinające wartości atrybutów na apostrofach.
2. **Drzewo DOM**: Należy precyzyjnie kontrolować kontekst zagnieżdżenia elementów (takich jak `<pre>`) w kodzie HTML.
3. **Specyfikacja Unicode**: Zanim porównasz długość stringów w różnych językach, upewnij się, czy mierzysz **grafemy (NFG)**, **punkty kodowe (Code Points)**, czy **bajty UTF-8**.
4. **Wydajność i RAM**: Rust z pulą połączeń HTTP osiąga imponujący wynik **3.34 s** oraz zużywa zaledwie **15 MB RAM** (5.7x mniej niż Python i 26x mniej niż Raku).
5. **Wydajność sieciowa**: Utrzymywanie trwałej sesji HTTP (Keep-Alive) ma drastycznie większy wpływ na czas wykonania skryptów sieciowych niż sam wybór języka programowania czy szybkość parsera HTML.
