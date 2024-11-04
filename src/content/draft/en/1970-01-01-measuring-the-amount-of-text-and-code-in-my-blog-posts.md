---
title: Measuring the amount of text and code in my blog posts
slug: measuring-the-amount-of-text-and-code-in-my-blog-posts
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2021-04-20T20:49:54.000Z
draft: true
---

## Project description

Out of curiosity, I wanted to check what part of my blog posts are text and what source code. I wrote a program that gave me the answer to this question.

The whole project was originally written in perl5 in 2017 and described in Polish language, but there is presented perl6 version.

## Installation

We install dependencies manager: [zef](https://github.com/ugexe/zef). Then we are installing two packages:

```Bash
zef install WWW
```

~~We're downloading the source code from gist~~

```Bash
 wget https://gist.githubusercontent.com/gustawdaniel/a4bb55473e8e4399a5b087f1979e78d0/raw/3427bbd1f6b68c75e0481eaee0fc6f466db8af6d/count_text_and_code.pl -O count_text_and_code.pl
```

And ready.

|text|code|title|
|---|---|---|
|3306|903|Pomiar ilości tekstu i kodu w moich wpisach|
|2560|223|Instalacja odnawialnego certyfikatu TLS|
|3741|788|Xss attack using script style and image|
|461|4320|Measurement of the amount of text and code in my blog posts|
|6830|2938|Kompilacja interpretera php 7 w BunsenLabs|
|11276|3936|Scrapowanie danych w języku Perl|
|4790|5576|Snake game in JavaScript (part 1 - objects)|
|10278|11629|Logowanie danych w MySql, Ajax i Behat|
|9520|5747|Testowanie szybkości selektów|
|9754|7307|Fetch, promise oraz string templates|
|5711|17380|Snake game in JavaScript (part 2 - events)|
|13852|12268|Wizualizacja dynamicznej sieci korelacyjnej.|
|17293|11673|Analiza logów Apache z GoAccess|
|5798|22759|Snake game in JavaScript (part 3 - Vue)|
|18121|21940|Tesseract-OCR i testowanie selektów.|
|27173|15056|Struktura bazy danych|
|23915|43022|Aplikacja z FOSUserBundle i API Google Maps|
|48455|16256|Analiza wydajności pustych pętli w 16 językach|

## Action

After switching on, the program prints a table on the screen with the number of characters in the text (text), number of characters of the presented source code (code) and title of entries (title).

{% include video.html url = 'https: [//www.dropbox.com/s/bh4n1ko7ygfu3ko/10.mp4](//www.dropbox.com/s/bh4n1ko7ygfu3ko/10.mp4)? dl = 1' webm = 'https: [//www.dropbox.com/s/9ngx754jsj9wzxj/10](//www.dropbox.com/s/9ngx754jsj9wzxj/10). webm? dl = 1 '%}

## Source code

The code of this program is quite condensed. It starts with loading libraries:

```Perl
#! / usr / bin / env perl

use warnings;
use strict;

use HTML :: TagParser;
```

Then the declaration of variables follows

```Perl
my $ url = 'https://blog.gustawdaniel.pl';
my @tags = ("h1 h2 h3 h4 li p", "pre");
```

The first one is the location of the main page of this blog. The second contains a list of tags treated as text (h1 h2 h3 h4 li p) and tags treated as a (pre) code.

The executable part of the script starts with drawing the table header with the results

```Perl
print "| text | code | title \ n";
```

Here the introduction ends and magic begins. The next line takes the content of the main page of the blog, extracts all elements from the tag `h2` from it and writes to the table.

```Perl
my @list = HTML :: TagParser-> new ($ url) -> getElementsByTagName ("h2");
```

We deal with the tag `h2` because on the main page of the blog all the links to entries are located inside such a tag.

\[! \[Scr2.png\] ([https://s1.postimg.org/fb5elwfgv/scr2.png](https://s1.postimg.org/fb5elwfgv/scr2.png))\] ([https://postimg.org/image/r09e9v6ff/](https://postimg.org/image/r09e9v6ff/))

The next natural step is to loop through this list:

```Perl
foreach my $ elem (@list) {
```

Inside the loop, we extract the value of the 'href' attribute for the first child of the `h2` element from the home page. We attach it to the blog's address - `$ url` and again download all content using the`new` method of the 'TagParser`object. Download the downloaded content to the`$ post\` variable.

```Perl
    my $ post = HTML :: TagParser-> new ($ url. $ elem-> firstChild () -> getAttribute ("href"));
```

We are about to process it, but before moving on to the next part of the program, we initialize a two-element table inside which we will store the text and the code extracted from the post.

```Perl
    my @str = ("", "");
```

We enter the next level of the loop that iterates just after these two elements. This means that for `$ i = 0` we extract texts, and for`$ i = 1` we are interested in counting the amount of source code.

```Perl
    foreach my $ i ((0,1)) {
```

Such flexibility in the selection of the currently counted elements is obtained thanks to the `@ tags` variable defined earlier. Now we select its first element and convert it to an array containing tags. The `map` function allows us to select the list of elements after the tag for each of the extracted tags. Ultimately, all these elements end up in the common `@ elements` array.

```Perl
        my @elements = map {$ post-> getElementsByTagName ($ _)} split / /, $ tags [$ i];
```

To extract the text from them we will use the method of 'innerText\` and simple mapping and projection of the array on the string we will extract the searched texts.

```Perl
        $ str [$ i] = join ("", map {$ _-> innerText} @elements);
```

We can end the loop body by indexes (0,1)

```Perl
    }
```

All we have left is to calculate the number of characters and print results - one line of code:

```Perl
    printf ("|% 8d |% 8d |% -60s \ n", (map {$ str [$ _] = ~ y === c} (0,1)), $ elem-> innerText);
```

At the end we close the loop after posts.

```Perl
}
```

The operation of the program is guaranteed until you change the organization of links on the home page in the `html` code.

## Summary

The results are measured in the following screen:

\[! \[Screen.png\] ([https://s11.postimg.org/niq06o56r/screen.png](https://s11.postimg.org/niq06o56r/screen.png))\] ([https://postimg.org/image/o88sj15q7/](https://postimg.org/image/o88sj15q7/))

This is one of the shortest entries. It is also one of the shortest source codes. It is just the density of the syntax in pearl that is, in my opinion, one of the greatest advantages of this beautiful language.
