---
author: Daniel Gustaw
canonicalName: measuring-the-amount-of-text-and-code-in-my-blog-posts
coverImage: https://preciselab.fra1.digitaloceanspaces.com/blog/img/15be2f16-3724-4012-b7a9-d9a4ee508c13.avif
description: Experimental study measuring code vs text volume in 68 blog posts across 4 languages (Perl 5, Raku, Python, Rust) with I/O and HTTP Keep-Alive performance analysis.
draft: false
publishDate: 2017-02-14T00:00:00.000Z
slug: en/measuring-the-amount-of-text-and-code-in-my-blog-posts
tags: ['perl', 'raku', 'python', 'rust', 'benchmark', 'unicode', 'http']
title: Measuring the Amount of Text and Code in My Blog Posts
updateDate: 2026-08-03T00:00:00.000Z
---

In 2017, out of pure curiosity, I decided to check what portion of my blog posts consisted of written text versus source code. Back then, I wrote a concise 21-line Perl program that gave me a quick answer.

In 2021—while experimenting with Perl 6 (now Raku)—I rewrote that script and, to my surprise, received completely different numbers. Due to lack of time, I set the topic aside, but recently returned to it to conduct a comprehensive investigation.

It turned out that a seemingly trivial problem—**"count text and code characters on an HTML page"**—conceals a fascinating world of engineering nuances. From bugs in open-source CPAN libraries and subtle DOM tree nesting issues to Unicode specifications (graphemes vs. code points) and network-layer HTTP performance optimizations.

In this article, I will take you on a journey through successive attempts to reconcile results across 4 programming languages (**Perl 5**, **Raku**, **Python**, and **Rust**), presenting complete statistics for 68 blog posts, code ratio evolution charts, and unexpected benchmark results.

---

## Act I: 2017 and the 21-Line Perl 5 Script

My initial 2017 approach relied on a simple premise: fetch the blog home page, extract post links from `<h2>` headers, download each post individually, and count characters in text elements (`<h1>-<h4>`, `<p>`, `<li>`) versus code blocks (`<pre>`).

Here is the original script utilizing the `HTML::TagParser` library:

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

It worked flawlessly... until I re-ran it years later in a modern environment and hit two major issues.

### Problem 1: Missing HTTPS Support
The first error upon re-running in a clean environment was:
```text
URI::Fetch failed: Protocol scheme 'https' is not supported (LWP::Protocol::https not installed)
```
It turned out that `HTML::TagParser` internally uses `LWP::UserAgent`. By default in Perl, `LWP` only supports `http://`. Installing `liblwp-protocol-https-perl` (or via CPAN: `cpanm LWP::Protocol::https`) enabled encrypted connections.

### Problem 2: Anatomy of a CPAN Bug (`HTML::TagParser`)
After fixing HTTPS, the script ran, but for certain posts (e.g., about Zipf's Law and Benford's Law) it printed **exactly `0` code characters**, even though those articles contained numerous `<pre>` blocks!

Debugging revealed a bug in `HTML::TagParser` itself (`HTML/TagParser.pm`, line 257). When parsing double-quoted attribute values (`"`), the module used a regular expression that truncated attribute strings at the first occurrence of a... single quote (`'`)!

The blog post URLs were structured as follows:
* `/posts/en/zipf's-law-in-nodejs/` $\rightarrow$ truncated to `/posts/en/zipf`
* `/posts/en/benford's-law/` $\rightarrow$ truncated to `/posts/en/benford`

Fetching those malformed URLs returned 404 error pages (which contained no `<pre>` tags).

The hacky Perl fix was to bypass the buggy parser method and access Perl's internal node array structure (`$node->[0]->[$node->[1]]->[2]`), which holds raw, unparsed HTML attribute text:

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

Library bug resolved, but this was only the beginning of our discoveries.

---

## Act II: The Raku Rewrite and the DOM Nesting Challenge

In 2021, I tried rewriting the algorithm in **Raku**. In Raku, instead of `HTML::TagParser`, I used the modern `DOM::Tiny` module with CSS selectors:

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

The code shrank to just **18 lines** and became remarkably clean. However, during an audit across all 68 blog posts, I noticed discrepancies.

In an old post from 2017 (*"Application with FOSUserBundle and Google Maps API"*), Raku returned **42,469** code characters, while other parsers reported **42,529** characters.

### Why Were 60 Characters Missing?
This post contained 70 `<pre>` code blocks featuring HTML and Twig template snippets. Inside some of those `<pre>` blocks were nested HTML elements, such as:
```html
<pre class="astro-code"><code><div class="container eternity-form">...</div></code></pre>
```
Raku's linear tree walker, without tracking parent node context, encountered the nested `<div>` tag, "forgot" it was inside a `<pre>` block, and counted that inner HTML snippet as article text instead of code!

The fix was recursively propagating an `$is_pre` context flag down the DOM tree:

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

## Act III: HTML Parsing Nuances – Spaces and Entities

Comparing different HTML parsing libraries in Python (`selectolax`), Rust (`scraper`), Perl 5 (`Mojo::DOM`), and Raku (`DOM::Tiny`) uncovered further subtle differences:

1. **HTML Entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`)**:
   Some parsers return raw text with unescaped entities (where `&amp;` counts as 5 characters), while others decode them to `&`, `<`, `>`, `"` (where `&` is 1 character). For consistency across languages, all parsers must operate on decoded text.

2. **Syntax Highlighter `<span>` Tags**:
   Modern static site engines (like Astro with Shiki or Prism) break code blocks into dozens of nested `<span class="line"><span class="token keyword">const</span>...</span>` elements.
   Some HTML parsers insert extra whitespace when joining adjacent `<span>` text nodes during `all_text` extraction. If a parser injects a space after every highlighted token, the code character count inflates unnaturally!

---

## Act IV: The Unicode Mystery – Graphemes vs. Code Points vs. Bytes

The most interesting discovery occurred while auditing post #13 (*tRPC – super fast development cycle...*).

The text character count results for this post were:
* **Rust**: `10,424` characters
* **Python**: `10,424` characters
* **Perl 5**: `10,424` characters
* **Raku**: **`10,423`** characters (exactly 1 character less!)

Why did Raku report 1 fewer character? I scanned the post's text character by character for non-ASCII symbols. The culprit was in the sentence:

> *"I learned tRPC today and fall in love **❤️** instantly..."*

Consider the red heart emoji **`❤️`**. In Unicode, this symbol consists of **two Code Points**:
1. `U+2764` (HEAVY BLACK HEART `❤`)
2. `U+FE0F` (Invisible `VARIATION SELECTOR-16`, instructing the renderer to display a colored emoji).

### How Do Languages Count Characters?

* **Python** (`len("❤️")`): Counts Unicode Code Points $\rightarrow$ **2 characters**.
* **Rust** (`str.chars().count()`): Counts Unicode Code Points $\rightarrow$ **2 characters**.
* **Perl 5** (`length("❤️")`): Counts Unicode Code Points $\rightarrow$ **2 characters**.
* **Raku** (`"❤️".chars`): Larry Wall designed Raku to operate natively on **NFG (*Normalized Form Grapheme*)**. Raku counts what a human user sees on screen as one glyph $\rightarrow$ **1 grapheme**!

To align Raku with Python, Rust, and Perl 5 (counting Code Points), we simply substitute `.chars` with **`.codes`**:

```raku
# .codes counts Unicode Code Points instead of NFG graphemes
printf("| %8d | %8d | %-60s \n", $text.codes, $code.codes, $title);
```

With this change, Raku achieved **100% byte-for-byte agreement** with the other languages.

---

## Act V: Results Table for All 68 Posts

With unified counting logic and proper DOM nesting handling, I generated complete statistics for all 68 posts published on the blog.

### Summary Statistics:
* **Total Posts Analyzed**: `68`
* **Total Text Characters**: **`504,233`**
* **Total Source Code Characters**: **`430,084`**
* **Total Blog Volume**: **`934,317`** characters
* **Overall Code Ratio**: **`46.03%`**

### Measurement Table:

| # | Text Chars | Code Chars | Code Ratio | Post Title |
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

### Text and Code Evolution Charts

The charts below illustrate article volume changes and code ratio percentages over time:

![Text vs Code Character Evolution across 68 Posts](/img/measuring-the-amount-of-text-and-code-in-my-blog-posts/chart_text_vs_code_evolution.svg)

![Code Ratio Percentage Evolution across 68 Posts](/img/measuring-the-amount-of-text-and-code-in-my-blog-posts/chart_code_ratio_evolution.svg)

---

## Act VI: Showdown Across 4 Programming Languages

I built matching implementations of the character counting algorithm across 4 languages:

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

### Verification Audit across All 68 Posts:

| Language Comparison | Posts with 100% Identical Results | Agreement |
| :--- | :---: | :---: |
| **Rust vs Python** | **68 / 68** | **100.00% (Baseline)** |
| **Rust vs Perl 5 (`Mojo::DOM`)** | **68 / 68** | **100.00% (Baseline)** |
| **Rust vs Raku (`.codes`)** | **68 / 68** | **100.00% (Baseline)** |

All scripts yielded **identical counts down to the single character**.

---

## Act VII: Performance Benchmark and HTTP Connection Pooling

With 4 working and 100% consistent scripts, I measured execution performance across all programs (Wall-clock real time, CPU time, and peak RAM consumption `Max RSS`).

### Initial Unexpected Result
In the initial benchmark run, Perl 5 with `Mojo::UserAgent` took **11.39 s**, while standard Rust took **5.21 s**, and Python took **5.74 s**.

However, it was puzzling why Python and standard Rust were only ~2x faster than Perl, given that Rust's CPU spent only **0.37 s** doing parsing work!

The bottleneck lay in the **network layer and HTTP Keep-Alive connection persistence**:
1. `Mojo::UserAgent` in Perl reuses persistent TCP/TLS connections.
2. Standard Rust (`rust/src/main.rs`) invoked static `ureq::get(&url)` in a loop. Without a shared agent holding a connection pool, every one of the 68 requests initiated a **fresh TCP connection and TLS handshake**.
3. Python (`count_text_and_code.py`) invoked top-level `httpx.get(url)` in a loop, creating a transient client per call. Using `with httpx.Client() as client:` would enable Connection Pooling (Keep-Alive) in Python as well.

### Rust Optimization: `rust/src/bin/connection_pool.rs`

We instantiate an explicit `ureq::Agent::new_with_defaults()` that maintains a pool of open sockets and reuses them across requests:

```rust
// rust/src/bin/connection_pool.rs - explicit agent with connection pooling
let agent = ureq::Agent::new_with_defaults();

let body: String = agent.get(BASE_URL).call()?.into_string()?;

for element in fragment.select(&selector) {
    // Reusing existing TLS connections via the same agent instance:
    let post_body: String = agent.get(&url).call()?.into_string()?;
}
```

---

### Final Benchmark Metrics

The table below presents the precise timing and RAM consumption measurements recorded across all implementations:

| Language / Variant | HTTP Client / Parser | Connection Pool | Real Time (`real`) | CPU Time (`user`+`sys`) | Peak RAM (`Max RSS`) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| 🥇 **Rust (`connection_pool`)** | `ureq::Agent` + `scraper` (Release) | ✅ **Yes** | **`3.34 s`** | **`0.28 s`** | **`15.05 MB`** |
| 🥈 **Rust (`rust` Standard)** | `ureq::get` + `scraper` (Release) | ❌ **No** | **`5.21 s`** | **`0.37 s`** | **`14.50 MB`** |
| 🥉 **Python** (`httpx`) | `httpx.get` + `selectolax` | ❌ **No** | **`5.74 s`** | **`0.82 s`** | **`85.16 MB`** |
| **Perl 5** | `Mojo::UserAgent` + `Mojo::DOM` | ✅ **Yes** | **`11.39 s`** | **`3.14 s`** | **`42.29 MB`** |
| **Raku** | `WWW` (`get`) + `DOM::Tiny` | ❌ **No** | **`37.63 s`** | **`31.93 s`** | **`388.90 MB`** |

---

### Performance Comparative Charts

#### Wall-Clock Real Time Execution
![Wall-Clock Execution Time](/img/measuring-the-amount-of-text-and-code-in-my-blog-posts/chart_real_time.svg)

#### CPU Processor Time
![Processor CPU Time](/img/measuring-the-amount-of-text-and-code-in-my-blog-posts/chart_cpu_time.svg)

#### Peak RAM Memory Usage
![Peak RAM Usage](/img/measuring-the-amount-of-text-and-code-in-my-blog-posts/chart_ram_usage.svg)

---

## Summary

What started as a simple metric calculation turned into a rich software engineering study:

1. **Library Quirks**: Even popular CPAN packages can contain regex edge-case bugs truncating attribute values at single quotes.
2. **DOM Hierarchy**: Recursively track node context (such as `<pre>`) to avoid misclassifying nested code tags as body text.
3. **Unicode Specs**: Before comparing string lengths across languages, verify if you are measuring **graphemes (NFG)**, **Code Points**, or **UTF-8 bytes**.
4. **Performance & RAM**: Rust with Connection Pooling delivers a **3.34 s** execution time while requiring only **15 MB RAM** (5.7x less than Python and 26x less than Raku).
5. **Network I/O Optimization**: Reusing HTTP Keep-Alive sessions has a far greater impact on overall execution time for network-bound tasks than choice of programming language or raw HTML parser speed.
