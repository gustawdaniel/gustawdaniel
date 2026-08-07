---
author: Daniel Gustaw
canonicalName: measuring-the-amount-of-text-and-code-in-my-blog-posts
coverImage: https://preciselab.fra1.digitaloceanspaces.com/blog/img/15be2f16-3724-4012-b7a9-d9a4ee508c13.avif
description: Estudio experimental midiendo la cantidad de código y texto en 68 artículos del blog en 4 lenguajes (Perl 5, Raku, Python, Rust) con análisis de rendimiento de E/S y HTTP Keep-Alive.
draft: false
publishDate: 2017-02-14T00:00:00.000Z
slug: es/medicion-de-la-cantidad-de-texto-y-codigo-en-mis-articulos
tags: ['perl', 'raku', 'python', 'rust', 'benchmark', 'unicode', 'http']
title: Medición de la cantidad de texto y código en mis artículos
updateDate: 2026-08-03T00:00:00.000Z
---

En 2017, por pura curiosidad, decidí comprobar qué proporción de mis artículos en el blog era texto escrito y qué parte correspondía a código fuente. En aquel momento, escribí un conciso programa de 21 líneas en Perl que me dio una respuesta rápida.

En 2021—con motivo de unos experimentos con el lenguaje Perl 6 (actualmente Raku)—reescribí dicho script y, para mi sorpresa, obtuve números completamente diferentes. Por falta de tiempo dejé el tema de lado, pero recientemente volví a él para llevar a cabo una investigación exhaustiva.

Resultó que un problema aparentemente trivial—**"contar los caracteres de texto y código en una página HTML"**—oculta bajo la superficie un fascinante mundo de matices de ingeniería. Desde errores en librerías abiertas de CPAN y sutilezas en el anidamiento del árbol DOM, hasta la especificación de Unicode (grafemas frente a puntos de código) y optimizaciones de rendimiento en la capa de red HTTP.

En este artículo, te guiaré a través de sucesivos intentos para conciliar los resultados en 4 lenguajes de programación (**Perl 5**, **Raku**, **Python** y **Rust**), presentando estadísticas completas para 68 artículos, gráficos de evolución de la proporción de código y resultados de rendimiento inesperados.

---

## Acto I: El año 2017 y el script de 21 líneas en Perl 5

Mi enfoque inicial en 2017 se basaba en una premisa sencilla: obtener la página principal del blog, extraer los enlaces a los artículos desde los encabezados `<h2>`, descargar cada publicación individualmente y contar los caracteres en los elementos de texto (`<h1>-<h4>`, `<p>`, `<li>`) frente a los bloques de código (`<pre>`).

A continuación se muestra el script original utilizando la librería `HTML::TagParser`:

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

Funcionó a la perfección... hasta que lo ejecuté de nuevo años más tarde en un entorno moderno y me encontré con dos problemas importantes.

### Problema 1: Falta de soporte HTTPS
El primer error al volver a ejecutarlo en un entorno limpio fue:
```text
URI::Fetch failed: Protocol scheme 'https' is not supported (LWP::Protocol::https not installed)
```
Resultó que `HTML::TagParser` utiliza internamente `LWP::UserAgent`. Por defecto en Perl, `LWP` solo admite `http://`. La instalación del paquete `liblwp-protocol-https-perl` (o mediante CPAN: `cpanm LWP::Protocol::https`) permitió establecer conexiones cifradas.

### Problema 2: Anatomía de un error en CPAN (`HTML::TagParser`)
Tras solucionar HTTPS, el script funcionó, pero para ciertos artículos (por ejemplo, sobre la Ley de Zipf y la Ley de Benford) mostraba **exactamente `0` caracteres de código**, ¡a pesar de que dichos artículos contenían numerosos bloques `<pre>`!

La depuración reveló un fallo en el propio módulo `HTML::TagParser` (`HTML/TagParser.pm`, línea 257). Al analizar valores de atributos entre comillas dobles (`"`), el módulo utilizaba una expresión regular que truncaba la cadena del atributo en la primera aparición de... ¡una comilla simple (`'`)!

Las URL de los artículos estaban estructuradas de la siguiente manera:
* `/posts/en/zipf's-law-in-nodejs/` $\rightarrow$ se truncaba a `/posts/en/zipf`
* `/posts/en/benford's-law/` $\rightarrow$ se truncaba a `/posts/en/benford`

Al solicitar esas URL malformadas, el servidor devolvía páginas de error 404 (las cuales no contenían etiquetas `<pre>`).

La solución rudimentaria en Perl consistió en eludir el método defectuoso de la librería y acceder directamente a la estructura interna del arreglo de nodos de Perl (`$node->[0]->[$node->[1]]->[2]`), que almacena el texto sin procesar de los atributos HTML:

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

Error de la librería resuelto, pero esto era solo el comienzo de nuestros descubrimientos.

---

## Acto II: La reescritura en Raku y el desafío de anidamiento en el DOM

En 2021, intenté reescribir el algoritmo en **Raku**. En Raku, en lugar de `HTML::TagParser`, utilicé el moderno módulo `DOM::Tiny` con selectores CSS:

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

El código se redujo a solo **18 líneas** y resultó sumamente limpio. Sin embargo, durante una auditoría en los 68 artículos del blog, noté discrepancias.

En un artículo antiguo de 2017 (*"Application with FOSUserBundle and Google Maps API"*), Raku devolvió **42,469** caracteres de código, mientras que otros analizadores indicaban **42,529** caracteres.

### ¿Por qué faltaban 60 caracteres?
Este artículo contenía 70 bloques de código `<pre>` con fragmentos de plantillas HTML y Twig. Dentro de algunos de esos bloques `<pre>` había elementos HTML anidados, como:
```html
<pre class="astro-code"><code><div class="container eternity-form">...</div></code></pre>
```
El recorrido lineal del árbol en Raku, al no rastrear el contexto del nodo padre, encontraba la etiqueta `<div>` anidada, "olvidaba" que estaba dentro de un bloque `<pre>` y contabilizaba ese fragmento de HTML interno como texto del artículo en lugar de código.

La solución fue propagar recursivamente una bandera de contexto `$is_pre` a lo largo del árbol DOM:

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

## Acto III: Sutilezas en el análisis HTML – Espacios y entidades

Al comparar diferentes librerías de análisis HTML en Python (`selectolax`), Rust (`scraper`), Perl 5 (`Mojo::DOM`) y Raku (`DOM::Tiny`), descubrí otras diferencias sutiles:

1. **Entidades HTML (`&amp;`, `&lt;`, `&gt;`, `&quot;`)**:
   Algunas librerías devuelven el texto plano con entidades sin escapar (donde `&amp;` cuenta como 5 caracteres), mientras que otras las decodifican a `&`, `<`, `>`, `"` (donde `&` es 1 carácter). Para lograr consistencia entre lenguajes, todos los parsers deben operar sobre texto decodificado.

2. **Etiquetas `<span>` de resaltadores de sintaxis**:
   Los motores de blogs modernos (como Astro con Shiki o Prism) dividen los bloques de código en docenas de elementos `<span class="line"><span class="token keyword">const</span>...</span>` anidados.
   Algunos parsers HTML insertan espacios en blanco adicionales al unir nodos de texto `<span>` adyacentes durante la extracción de `all_text`. Si un analizador añade un espacio después de cada palabra clave resaltada, ¡el conteo de caracteres de código aumenta de forma no natural!

---

## Acto IV: El misterio de Unicode – Grafemas frente a Puntos de Código y Bytes

El descubrimiento más fascinante ocurrió al auditar el artículo #13 (*tRPC – super fast development cycle...*).

Los resultados de conteo de caracteres de texto para este artículo fueron:
* **Rust**: `10,424` caracteres
* **Python**: `10,424` caracteres
* **Perl 5**: `10,424` caracteres
* **Raku**: **`10,423`** caracteres (¡exactamente 1 carácter menos!)

¿Por qué Raku reportaba 1 carácter menos? Escaneé el texto de la publicación carácter por carácter en busca de símbolos fuera de la tabla ASCII. El causante estaba en la frase:

> *"I learned tRPC today and fall in love **❤️** instantly..."*

Analicemos el emoji del corazón rojo **`❤️`**. En Unicode, este símbolo consta de **dos Puntos de Código** (*Code Points*):
1. `U+2764` (HEAVY BLACK HEART `❤`)
2. `U+FE0F` (Modificador invisible `VARIATION SELECTOR-16`, que indica al renderizador mostrar un emoji en color).

### ¿Cómo cuentan caracteres los lenguajes de programación?

* **Python** (`len("❤️")`): Cuenta Puntos de Código Unicode $\rightarrow$ **2 caracteres**.
* **Rust** (`str.chars().count()`): Cuenta Puntos de Código Unicode $\rightarrow$ **2 caracteres**.
* **Perl 5** (`length("❤️")`): Cuenta Puntos de Código Unicode $\rightarrow$ **2 caracteres**.
* **Raku** (`"❤️".chars`): Larry Wall diseñó Raku para operar de forma nativa en **NFG (*Normalized Form Grapheme*)**. Raku cuenta lo que el usuario ve visualmente en pantalla como un solo glifo $\rightarrow$ **¡1 grafema!**

Para alinear Raku con Python, Rust y Perl 5 (contando Puntos de Código), simplemente sustituimos `.chars` por **`.codes`**:

```raku
# .codes cuenta Puntos de Código Unicode en lugar de grafemas NFG
printf("| %8d | %8d | %-60s \n", $text.codes, $code.codes, $title);
```

Con este cambio, Raku logró una **coincidencia del 100% byte por byte** con los demás lenguajes.

---

## Acto V: Tabla de resultados para los 68 artículos

Con una lógica de conteo unificada y una gestión adecuada del anidamiento en el DOM, generé las estadísticas completas para los 68 artículos publicados en el blog.

### Estadísticas resumidas:
* **Total de artículos analizados**: `68`
* **Total de caracteres de texto**: **`504,233`**
* **Total de caracteres de código fuente**: **`430,084`**
* **Volumen total del blog**: **`934,317`** caracteres
* **Proporción global de código**: **`46.03%`**

### Tabla de mediciones:

| # | Caracteres de Texto | Caracteres de Código | Proporción de Código | Título del Artículo |
| :---: | :---: | :---: | :---: | :--- |
| 1 | 7,770 | 10,782 | 58.1% | Leveraging SIMD in Rust for High-Performance Computing |
| 2 | 10,794 | 8,754 | 44.8% | From MLP to CNN. Neural Networks for MNIST Digit Recognition |
| 3 | 7,906 | 14,172 | 64.2% | Rust Wasm performance on snake game example |
| 4 | 9,370 | 10,517 | 52.9% | Activation Functions in Machine Learning |
| 5 | 16,421 | 6,088 | 27.0% | Machine Learning XOR from Scratch |
| 6 | 5,324 | 3,504 | 39.7% | LangChain Exemplary Use Cases |
| 7 | 1,835 | 8,461 | 82.2% | Fastify Prisma REST backend |
| 8 | 1,171 | 2,454 | 67.7% | Web Push Notifications |
| 9 | 2,854 | 10,898 | 79.3% | Svelte snake deployed on deno |
| 10 | 4,478 | 10,277 | 69.6% | Rust implementation of RFC 7396 - JSON Merge Patch |
| 11 | 6,219 | 1,590 | 20.4% | Tutorial for ESM + CommonJS package creators |
| 12 | 2,860 | 638 | 18.2% | How to Install Yay on a Pure Arch Linux Docker Image |
| 13 | 4,381 | 456 | 9.4% | Simplifying Linux Command Line with GPT-CLI (rust, open source) |
| 14 | 10,424 | 8,602 | 45.2% | tRPC - super fast development cycle for fullstack typescript apps |
| 15 | 1,739 | 567 | 24.6% | How to install MongoDB 6 on Fedora 37 |
| 16 | 4,685 | 2,325 | 33.2% | QuickSort implementation in Rust, Typescript and Go |
| 17 | 2,640 | 1,823 | 40.8% | ZeroMQ pull-push pattern for Node JS |
| 18 | 4,054 | 3,103 | 43.4% | New Google Identity in Nuxt 3 |
| 19 | 17,975 | 4,703 | 20.7% | Selected syntax in JavaScript ES2020, ES2021 and ES2022 |
| 20 | 6,291 | 3,389 | 35.0% | CodinGame: Best fit to data - Rust - Regression Analysis |
| 21 | 9,734 | 13,419 | 57.9% | CodinGame: Derivative Time - Part 1, Recursion (Typescript) |
| 22 | 7,971 | 17,238 | 68.4% | CodinGame: Quaternion Multiplication - Rust, NodeJS - Parsing, Algebra |
| 23 | 5,453 | 7,563 | 58.1% | CodinGame: ASCI Art - Rust, NodeJs - Strings, Arrays, Loops |
| 24 | 1,538 | 805 | 34.4% | Overload Signatures in Typescript |
| 25 | 12,712 | 15,481 | 54.9% | Login by Metamask - Rest Backend in Fastify (Node, Typescript, Prisma) |
| 26 | 3,051 | 2,711 | 47.1% | Login Component in Nuxt (Rest Strapi) |
| 27 | 3,642 | 5,461 | 60.0% | Maximum Inequality [Linear Search] rust and typescript |
| 28 | 6,427 | 5,635 | 46.7% | Pulumi - Infrastructure as a Code [ Digital Ocean ] |
| 29 | 1,153 | 2,011 | 63.6% | Last Occurrence [Linear Search] easy |
| 30 | 5,573 | 2,270 | 28.9% | Analysis of Zipf's Law in Node.js |
| 31 | 5,628 | 2,186 | 28.0% | Retry Policy - How to Handle Random, Unpredictable Errors |
| 32 | 2,012 | 1,438 | 41.7% | Publishing an update of the package in the AUR repository |
| 33 | 3,726 | 1,735 | 31.8% | Least Common Multiple - Number Theory |
| 34 | 8,025 | 6,501 | 44.8% | How to configure SSL in local development |
| 35 | 13,753 | 3,217 | 18.9% | Another installation guide for Arch Linux (i3) |
| 36 | 17,645 | 5,769 | 24.6% | Benford's Law for the Fibonacci Sequence in Java, Rust, and Node JS |
| 37 | 5,226 | 488 | 8.5% | Bolt (always) Lite - MITM, Proxy, Insomnia and Vue |
| 38 | 14,801 | 5,190 | 25.9% | Process Control in Node JS |
| 39 | 4,168 | 788 | 15.9% | Xss attack using script style and image |
| 40 | 8,111 | 6,704 | 45.2% | Broadcast Channel API |
| 41 | 5,953 | 11,488 | 65.9% | Analysis of the frequency of altcoin names in the English language corpus |
| 42 | 4,977 | 5,391 | 52.0% | Scraping the most popular Twitter accounts |
| 43 | 1,667 | 0 | 0.0% | How to create a free email account with custom domain? |
| 44 | 2,549 | 735 | 22.4% | Telegram Bot in Typescript |
| 45 | 2,829 | 223 | 7.3% | Installation of a renewable TLS certificate (certbot + apache on Ubuntu) |
| 46 | 11,063 | 3,997 | 26.5% | Data scraping in Perl |
| 47 | 13,494 | 10,561 | 43.9% | Scraping Facebook in 2021 |
| 48 | 6,689 | 0 | 0.0% | How the war for compatibility shaped the frontend? |
| 49 | 5,789 | 2,364 | 29.0% | We squeeze data from PDF like juice from a lemon |
| 50 | 9,900 | 7,392 | 42.7% | Fetch, Promise and Template String on example of To Do List in JavaScript |
| 51 | 9,647 | 4,423 | 31.4% | Communication between Vue components in Meteor |
| 52 | 1,845 | 199 | 9.7% | Git styled calendar with custom dates |
| 53 | 6,222 | 9,663 | 60.8% | How many families can fit on the plane - an algorithmics problem |
| 54 | 2,711 | 0 | 0.0% | Scraping WordPress - 4300 court rulings in exchange rate lawsuits without a line of code |
| 55 | 9,772 | 5,335 | 35.3% | Ruby on Rails - quick introduction |
| 56 | 2,631 | 897 | 25.4% | Infrastructure as Code (Terraform + Digital Ocean) |
| 57 | 2,491 | 1,718 | 40.8% | Calculating the Difference Between JSON Files |
| 58 | 4,137 | 4,421 | 51.7% | Scraping of the Pharmacy Register |
| 59 | 11,266 | 8,429 | 42.8% | How to download contact data for 20k lawyers in an hour |
| 60 | 5,399 | 4,318 | 44.4% | Scraping from money.pl in 30 lines of code. |
| 61 | 17,602 | 16,397 | 48.2% | Data Structuring on the Example of CHF NBP Course |
| 62 | 23,419 | 42,529 | 64.5% | Application with FOSUserBundle and Google Maps API |
| 63 | 7,876 | 2,916 | 27.0% | Compilation of PHP 7 interpreter in BunsenLabs |
| 64 | 17,066 | 11,550 | 40.4% | Analysis of Apache logs with GoAccess |
| 65 | 11,265 | 9,313 | 45.3% | The impact of indexing on search performance in MySQL database |
| 66 | 16,235 | 22,121 | 57.7% | Tesseract-OCR and testing selects. |
| 67 | 12,066 | 12,339 | 50.6% | Visualization of a dynamic correlation network. |
| 68 | 8,133 | 11,652 | 58.9% | Data logging in MySql, Ajax, and Behat |

---

### Gráficos de evolución de texto y código

Los siguientes gráficos ilustran los cambios en el volumen de los artículos y el porcentaje de proporción de código a lo largo del tiempo:

![Evolución del volumen de texto frente a código en los 68 artículos](https://preciselab.fra1.digitaloceanspaces.com/blog/img/chart_text_vs_code_evolution.svg)

![Evolución del porcentaje de proporción de código en los 68 artículos](https://preciselab.fra1.digitaloceanspaces.com/blog/img/chart_code_ratio_evolution.svg)

---

## Acto VI: Enfrentamiento en 4 lenguajes de programación

Desarrollé implementaciones equivalentes del algoritmo de conteo de caracteres en 4 lenguajes:

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

### Auditoría de verificación para los 68 artículos:

| Comparación de Lenguajes | Publicaciones con Resultados 100% Identicos | Coincidencia |
| :--- | :---: | :---: |
| **Rust vs Python** | **68 / 68** | **100.00% (Línea base)** |
| **Rust vs Perl 5 (`Mojo::DOM`)** | **68 / 68** | **100.00% (Línea base)** |
| **Rust vs Raku (`.codes`)** | **68 / 68** | **100.00% (Línea base)** |

Todos los scripts produjeron **conteos idénticos hasta el último carácter**.

---

## Acto VII: Benchmark de rendimiento y reutilización de conexiones HTTP

Con 4 scripts funcionales y 100% consistentes, medí el rendimiento de ejecución en todos los programas (tiempo real de reloj, tiempo de CPU y consumo máximo de memoria RAM `Max RSS`).

### Resultado inicial inesperado
En la ejecución inicial del benchmark, Perl 5 con `Mojo::UserAgent` tardó **11.39 s**, mientras que Rust estándar tardó **5.21 s** y Python **5.74 s**.

Sin embargo, resultaba desconcertante por qué Python y Rust estándar eran solo ~2 veces más rápidos que Perl, dado que la CPU de Rust dedicó solo **0.37 s** al análisis de código.

El cuello de botella residía en la **capa de red y la persistencia HTTP Keep-Alive**:
1. `Mojo::UserAgent` en Perl reutiliza conexiones TCP/TLS persistentes.
2. La versión estándar de Rust (`rust/src/main.rs`) invocaba la función estática `ureq::get(&url)` dentro de un bucle. Al no disponer de un agente compartido que gestionara un pool de conexiones, cada una de las 68 peticiones abría una **nueva conexión TCP y un nuevo saludo TLS**.
3. En Python (`count_text_and_code.py`), se llamaba a `httpx.get(url)` dentro del bucle, creando un cliente efímero por cada petición. Si hubiéramos utilizado `with httpx.Client() as client:`, Python también habría mantenido un pool de conexiones Keep-Alive.

### Optimización en Rust: `rust/src/bin/connection_pool.rs`

Instanciamos un agente explícito `ureq::Agent::new_with_defaults()` que mantiene un pool de sockets abiertos y los reutiliza en peticiones sucesivas:

```rust
// rust/src/bin/connection_pool.rs - agente explícito con pool de conexiones
let agent = ureq::Agent::new_with_defaults();

let body: String = agent.get(BASE_URL).call()?.into_string()?;

for element in fragment.select(&selector) {
    // Reutilización de conexiones TLS existentes mediante la misma instancia de agente:
    let post_body: String = agent.get(&url).call()?.into_string()?;
}
```

---

### Métricas finales de rendimiento

La siguiente tabla presenta las mediciones precisas de tiempo y consumo de RAM registradas en todas las implementaciones:

| Lenguaje / Variante | Cliente HTTP / Parser | Connection Pool | Tiempo Real (`real`) | Tiempo CPU (`user`+`sys`) | RAM Máxima (`Max RSS`) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| 🥇 **Rust (`connection_pool`)** | `ureq::Agent` + `scraper` (Release) | ✅ **Sí** | **`3.34 s`** | **`0.28 s`** | **`15.05 MB`** |
| 🥈 **Rust (`rust` Estándar)** | `ureq::get` + `scraper` (Release) | ❌ **No** | **`5.21 s`** | **`0.37 s`** | **`14.50 MB`** |
| 🥉 **Python** (`httpx`) | `httpx.get` + `selectolax` | ❌ **No** | **`5.74 s`** | **`0.82 s`** | **`85.16 MB`** |
| **Perl 5** | `Mojo::UserAgent` + `Mojo::DOM` | ✅ **Sí** | **`11.39 s`** | **`3.14 s`** | **`42.29 MB`** |
| **Raku** | `WWW` (`get`) + `DOM::Tiny` | ❌ **No** | **`37.63 s`** | **`31.93 s`** | **`388.90 MB`** |

---

### Gráficos comparativos de rendimiento

#### Tiempo Real de Ejecución de Reloj (`Wall-Clock Real Time`)
![Tiempo Real de Ejecución](https://preciselab.fra1.digitaloceanspaces.com/blog/img/chart_real_time.svg)

#### Tiempo de Procesador de CPU
![Tiempo de Procesador CPU](https://preciselab.fra1.digitaloceanspaces.com/blog/img/chart_cpu_time.svg)

#### Consumo Máximo de Memoria RAM
![Consumo Máximo de Memoria RAM](https://preciselab.fra1.digitaloceanspaces.com/blog/img/chart_ram_usage.svg)

---

## Resumen

Lo que comenzó como un simple cálculo de métricas se convirtió en un valioso estudio de ingeniería de software:

1. **Particularidades de las librerías**: Incluso paquetes populares en CPAN pueden contener errores en expresiones regulares que truncan atributos en comillas simples.
2. **Jerarquía del DOM**: Rastrea de forma recursiva el contexto del nodo (como `<pre>`) para evitar clasificar etiquetas de código anidadas como texto del cuerpo.
3. **Especificación Unicode**: Antes de comparar longitudes de cadenas entre lenguajes, verifica si estás midiendo **grafemas (NFG)**, **Puntos de Código** o **bytes UTF-8**.
4. **Rendimiento y Memoria**: Rust con Connection Pool logra un tiempo de ejecución de **3.34 s** requiriendo solo **15 MB de RAM** (5.7 veces menos que Python y 26 veces menos que Raku).
5. **Optimización de E/S de red**: Reutilizar sesiones HTTP Keep-Alive tiene un impacto drásticamente mayor en el tiempo total de ejecución para tareas orientadas a red que la elección del lenguaje de programación o la velocidad pura del analizador HTML.
