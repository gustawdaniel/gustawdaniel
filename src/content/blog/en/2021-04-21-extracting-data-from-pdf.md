---
author: Daniel Gustaw
canonicalName: extracting-data-from-pdf
coverImage: http://localhost:8484/a99f6a5c-e91a-44b1-a1c9-e52bdefa6c45.avif
description: In this post, we will show how to conveniently extract data from PDF files by writing really minimal amounts of code.
excerpt: In this post, we will show how to conveniently extract data from PDF files by writing really minimal amounts of code.
publishDate: 2021-04-21 18:45:26+00:00
slug: en/squeezing-data-from-pdf-like-lemon-juice
tags:
- pdf
title: We squeeze data from PDF like juice from a lemon
updateDate: 2021-04-21 18:45:26+00:00
---

Data is everything that is or can be processed mentally or computer-wise. In computer processing, some forms of their recording are more or less convenient. For example, PDF is considered a format convenient for humans, but we often underestimate the capabilities of machines in automating processes based on PDF files.

In this post, we will show how by writing really minimal amounts of code, you can conveniently extract data from PDF files. For example, we will use train tickets since they do not contain any confidential data, but it could just as well be invoices, contracts, or CV files.

![](http://localhost:8484/97f6f2a3-ee40-4587-9856-b4e0acae8f3d.avif)

**Data Acquisition**

```
bilet pkp has:attachment -in:chats from:bilet.eic@intercity.pl to:me
```

Here is the view I see after filtering:

![](http://localhost:8484/197afc96-cebe-47bb-9bc8-7728243c3c48.avif)

Now it was enough to download the files to be able to process them.

I saved all the attachments on the hard drive in the ocr directory. As in every post on this blog, further operations will be performed on the Ubuntu system.

## **Processing PDF to text** 

We will start by determining the initial content of the directory. It is filled with PDF files.

![](http://localhost:8484/cf76fa1a-ff0b-4b1c-be71-57d00a51eddb.avif)

Thanks to the `pdftotext` tool from the `poppler-utils` package, we can extract information of interest from PDF files in the form of plain text. We can install this tool with the following command:

```
sudo apt-get install poppler-utils
```

To use it, we use the syntax

```
pdftotext {PDF-file} {text-file}
```

In our case, we have many input and output files, so we will use `xargs`.

```
ls eic_*.pdf | xargs -i pdftotext "{}";
```

The command consists of two parts. In the first part, I list all files starting with `eic` and ending with `.pdf`. Then, using the `xargs` program, I pass the resulting stream of data line by line to the `pdftotext` command. The absence of a second argument means that in my case, the text files were created with the same names as the `pdf` files.

We can easily check if they actually exist using the `ls` command.

![](http://localhost:8484/3e37bea4-5125-4ec4-99eb-f0216fcf4add.avif)

**Data Structuring**

Let's start with something simple. Let's assume we want to calculate how much money I spent in total on tickets, but we won't check each ticket manually one by one - that's what the computer is for. Besides, if we get a different set of tickets, we would have to repeat the manual work. You might be surprised, but to accomplish this task, you don't even need a code editor and we wrote it in one line:

```
ls eic_*.txt | xargs -i cat "{}" | perl -ne 'if(/SUMA PLN: (.*) zł/){print "$1\n";}' | tr , . | paste -sd+ | bc
```

This line returned `786.11`, which is the cost of all tickets.

![](http://localhost:8484/e65863c8-b467-4dd1-ba24-5ff7657017c4.avif)

Let's dive deeper now and see what's behind it. We will display one of the text files with the command `cat eic_67584344.txt`:

```
BILET INTERNETOWYTANIOMIASTOWY

"PKP Intercity"
Spółka Akcyjna

OF: 503

NORMAL. : 1
ULG. :
X : X

Przewoźnik: PKP IC
A-Cena bazowa: 1xNormal

¦ ¸

Od/From

27.09 05:50 Iława Gł.
*
*
*
PRZEZ: Działdowo * Nasielsk

Do/To

¦ ¸

KL./CL.

Warszawa C.
*

27.09 07:50
*
*

2
*

SUMA PLN: 39,90 zł
519836278964

Nr transakcji:

Informacje o podróży:
Stacja
Data Godzina
Iława Gł.
27.09 05:50
Warszawa C.
27.09 07:50

/Wagon K m
IC 5324
208
5

eIC67584344

Nr miejsca (o-okno ś-środek k-korytarz) Suma PLN
81 o
39,90 zł
1 m. do siedzenia; wagon bez przedziałów

d9U
Podróżny:
PTU
8%

Suma PLN Płatność: przelewem
39,90 Zapłacono i wystawiono dnia:
2018-09-26 09:01:20(52245592)

Ogółem PLN:

39,90

Niniejszy bilet internetowy nie jest fakturą VAT.
W związku z przeprowadzanymi modernizacjami sieci kolejowej, uprzejmie prosimy o
dokładne sprawdzanie rozkładu jazdy pociągów przed podróżą.

Data wydruku: 2018-09-26 09:01:57

5324

Bilet internetowy jest biletem imiennym i jest ważny:
a) wraz z dokumentem ze zdjęciem potwierdzającym tożsamość Podróżnego,
b) tylko w dniu, relacji, pociągu, wagonie i na miejsce na nim oznaczone.

Zwrotu należności za niewykorzystany bilet dokonuje się na podstawie wniosku
złożonego przez płatnika w wyznaczonych przez 'PKP Intercity' S.A. punktach, z
wyjątkiem należności zwracanych automatycznie na zasadach określonych w
Regulaminie e-IC.

Daniel Gustaw

d9U

Informacja o cenie
Opłata za przejazd:

(P24) 7219
```

The first thing that comes to mind is that the file contains all information in an unaltered form. There are no typos, errors, or transpositions typical of OCR systems performing similar tasks on document scans. The price `39.90 zł` appears several times in this text. Sometimes it appears together with `zł`, sometimes not; the line arrangement may differ if several people are traveling on the ticket. We are looking for the most reliable pattern. It is `SUMA PLN: 39.90 zł`. Now we want to extract `39.90` from this file. `perl` will help us with this - a language created by linguist Larry Wall specifically for working with text files.

```
$ cat eic_67584344.txt | perl -ne 'if(/SUMA PLN: (.*) zł/){print "$1\n";}'
39,90
```

This command can be explained as follows:

* take the file `eic_67584344.txt`
* redirect its entire content to the program we wrote in `perl` as input
* the program performs the same command on each line of text
* it checks whether the text matches the pattern starting with `SUMA PLN:` and ending with `zł`.
* if so, it extracts the value between these strings and returns it

The problem we have is the Polish `,` instead of the globally used `.`. This problem can be easily eliminated by the `tr` command which replaces its first argument with the second.

![](http://localhost:8484/d12a72a6-1834-461a-81e9-3b7b89753873.avif)

Of course, we will not repeat these commands for each file individually. Instead, we will reuse the already known `xargs`.

```
$ ls eic_*.txt | xargs -i cat "{}" | perl -ne 'if(/SUMA PLN: (.*) zł/){print "$1\n";}' | tr , .
39.90
63.00
15.14
55.00
60.00
186.00
70.56
89.40
139.00
68.11
```

It allowed us to search text files using defined filters file by file. One interesting thing is that the `"{}"` used represents the argument that went into `xargs`.

Only summation is left, but summing columns from a text file is a piece of cake in the `bash` console. In the case of a single column, we don’t even need to run `awk` - an advanced text processing program. We just need `paste` - a program for merging files and `bc`, a simple program for calculating sums.

Using `paste` with the `-s` option, we will transpose to one line. With the `d` option, we will set the separator. It will of course be the addition sign `+`. The result looks something like this:

![](http://localhost:8484/f286948c-7e71-4731-9b99-17f037f74813.avif)

The final piece `bc` completes the task, but it was presented at the very beginning:

```
$ ls eic_*.txt | xargs -i cat "{}" | perl -ne 'if(/SUMA PLN: (.*) zł/){print "$1\n";}' | tr , . | paste -sd+ | bc
786.11
```

## **Visualization of Results**

Since the files are arranged chronologically, it will be easy for us to see the chart of subsequent prices. To do this, we download `chart` - a package written in `go` for creating charts.

```
wget https://github.com/marianogappa/chart/releases/download/v3.0.0/chart_3.0.0_linux_amd64.tar.gz -O /tmp/chart.tar.gz
```

And we unpack

```
tar -xvf /tmp/chart.tar.gz --directory /usr/local/bin
```

Another command, adds column numbers `cat -n` and draws a graph

```
ls eic_*.txt | xargs -i cat "{}" | perl -ne 'if(/SUMA PLN: (.*) zł/){print "$1\n";}' | tr , . | cat -n | chart line
```

![](http://localhost:8484/2b9c9215-df7b-4b23-a5d0-ef72ccf84fad.avif)

In summary. We didn't work too hard here, but that was the goal. Showing how one line of code can summarize prices or draw a chart from data that seems unavailable because its format is not as obvious as in the case of organized data stored in a well-defined database structure.

If you want to expand your knowledge and familiarize yourself with the tools we used, you can find links to them below:

Data cleaning

[https://en.wikipedia.org/wiki/Data\_cleansing](https://en.wikipedia.org/wiki/Data_cleansing)

Pdf to Text Converter

[https://www.cyberciti.biz/faq/converter-pdf-files-to-text-format-command/](https://www.cyberciti.biz/faq/converter-pdf-files-to-text-format-command/)

Example of using xargs

[https://stackoverflow.com/questions/33141207/what-is-the-working-of-this-command-ls-xargs-i-t-cp-1](https://stackoverflow.com/questions/33141207/what-is-the-working-of-this-command-ls-xargs-i-t-cp-1)

Chart - a tool for drawing charts

[https://marianogappa.github.io/chart/](https://marianogappa.github.io/chart/)

Paste - command for merging files

[https://www.geeksforgeeks.org/paste-command-in-linux-with-examples/](https://www.geeksforgeeks.org/paste-command-in-linux-with-examples/)

Examples of oneliners in Perl

[https://www.rexegg.com/regex-perl-one-liners.html](https://www.rexegg.com/regex-perl-one-liners.html)
