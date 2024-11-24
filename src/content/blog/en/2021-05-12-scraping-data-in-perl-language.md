---
author: Daniel Gustaw
canonicalName: scraping-data-in-perl-language
coverImage: http://localhost:8484/f2b67965-a6e0-4112-8ff2-ae3330414969.avif
description: The article presents a simple scraper written in Perl 5. Despite handling three data records, its code is remarkably short.
excerpt: The article presents a simple scraper written in Perl 5. Despite handling three data records, its code is remarkably short.
publishDate: 2021-05-11 20:37:00+00:00
slug: en/data-scraping-in-perl
tags:
- perl
- scraping
title: Data scraping in Perl
updateDate: 2021-06-22 09:00:09+00:00
---

## Project Description

The internet is usually associated with browsing it in the form rendered by a browser from an html file. This is convenient if we care about a nice presentation and easy navigation.

However, if we want to browse and analyze data, then the form of an html page may turn out to be suboptimal and it's simpler to download html pages to our disk and then process them into a more friendly format for further processing. This process is called scraping.

Today, we will write an application that allows you to download data from various pages, which can be iterated through a parameter in the url and processed into json files.

We will use the Perl language for this. The application will consist of a part that downloads data and a part that processes it. The configuration will be separated into a separate class, allowing for easy expansion of the supported pages collection.

## Installation

We download the repo from git and go to the created directory.

```
git clone git@github.com:gustawdaniel/scraper.git && cd scraper
```

## Loading Configuration

The scraping process can be divided into two phases: data retrieval and processing them. In some cases - when what we download determines what we will be downloading

* they should overlap, but they do not have to in our case. The file `app.pl` will be responsible for data retrieval, and `json.pl` for analysis. Files with the `.pm` extension are modules, classes, or libraries that we write ourselves, but they are not executable code for the application. Here we have the `Loader.pm` module responsible for recognizing the parameter passed to `app.pl` and loading one of the three available configurations from the `*Config.pm` files.

Since the first action for both `app.pl` and `json.pl` is indeed loading the configuration, we will start by discussing the modules. To be a module, the code must be declared with the `package` statement:

> Loader.pm

```perl
use strict;
use warnings FATAL => 'all';

package Loader;
```

It has one method - `load`, which recognizes whether the argument specifying the type of content to be scraped has been provided. We have the option of `rhf` - register of pharmaceutical wholesalers, `scpp` - Scandinavian-Polish Chamber of Commerce, and the default `ra` - register of pharmacies.

Let's not concern ourselves now with what these institutions are and why we are downloading their data. They can be treated as examples, and one can write in other institutions here. It is important that the parameter `$ARGV[0]` is a string entered after the program name, and based on it, the appropriate modules with the configuration are loaded, on which the `new` method is executed. This is the constructor of the object containing the configuration. Then, the object receives its name and is returned.

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

This is where the code would end in most languages, but Perl requires adding one more line:

```perl
1;
```

The one is required here to indicate the success of the module loading operation. It makes sense if something went wrong during initialization. By returning false then, we could end our program in a cleaner way.

As mentioned earlier, we have several configurations available. To avoid repeating code, we encapsulate them into objects that are configured through properties and methods. In other languages, we would use an interface. Perl does not have a built-in mechanism for interfaces, but one can be written from scratch. We would probably do this if it were a larger project, but for such a simple case, it's not worth it. So we agree that each configuration must have a few methods and properties, but can implement them in its own way. Let's start with the pharmacy registry:

> RaConfig.pm

```perl
use strict;
use warnings FATAL => 'all';

package RaConfig;
```

After defining the package name, we will create its constructor. We will use the bless function, whose task is to return an instance of the object created by our class.

The first argument of the constructor (which we will not provide, as it is automatically set in the background) is the module itself on which the function is called. Something like this or self in other languages. We put this as the second argument to the bless function using the shift function, which extracts the first element from the array with the default context, which is the arguments of new. For the first argument of the bless function, we provide a set of properties of the object. In this case, limit equal to the maximum page index, and rows - the selector in which the content we are interested in is located. It speeds up the search because all subsequent queries will be limited only to the area selected by this selector.

```perl
sub new { return bless {limit=>100000,rows=>'.pharmacyDetailsControl_Div.controlContainer'}, shift; }
```

For data retrieval, the most important information is the `url` address from which it can be obtained. Constructing this address based on the iterated page index is performed by the `source` method.

```perl
sub source { # arg index
    return "https://ra.rejestrymedyczne.csioz.gov.pl/_layouts/15/RA/PharmacyDetailsPublic.aspx?id=".$_[1]."&IsDlg=1";
}
```

The `invalid` method allows us to catch pages that for some reason should be skipped. We provide it with HTML, as the response may have a 200 code, but if something is wrong with it, this method will prevent further processing of that HTML. In this specific case, it will return true if the HTML contains a string matched by the regular expression:

```perl
sub invalid { # arg html
    return $_[1] =~ /ctl00_PlaceHolderPageTitleInTitleArea_ErrorPageTitlePanel/;
}
```

For processing, the key information is which keys and selectors correspond to the instance of the retrieved data. Here, the page is a simple table, where the keys are located in h3 elements and the values in spans. The method's argument is an object used to search for specific values in the html document. Using its `query` methods, it returns an array of elements matching the pattern, and through `as_trimmed_text`, it casts them to strings within those elements. In the `select` method, we sequentially: create a `hash` - that is, a data structure containing keys and values regardless of order. Then we refer to it as an array, which allows us to insert the array returned by the first selector as keys and by the second as values. Finally, we return the hash.

```perl
sub select { # arg query
    my %hash;
    @hash{$_[1]->query('.inputArea.full h3')->as_trimmed_text} = $_[1]->query('.inputArea.full span')->as_trimmed_text;
    return %hash;
}
```

At the end, just like before, we return `1;`

```perl
1;
```

The class for the pharmaceutical wholesaler registry will be presented in its entirety, as it is very similar.

> RhfConfig.pm

```perl
use strict;
use warnings FATAL => 'all';

package RhfConfig;

sub new { return bless {limit=>100000,rows=>'.pharmacyDetailsControl_Div.controlContainer'}, shift; }

sub source {
    return "https://rhf.rejestrymedyczne.csioz.gov.pl/_layouts/15/RHF/WarehouseDetailsPublic.aspx?id=".$_[1]."&IsDlg=1";
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

A little differently, however, the Scandinavian-Polish Chamber of Commerce was configured.

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

## Downloading Content

```perl
#!/usr/bin/env perl
use strict;
use warnings FATAL => 'all';
use LWP::Simple;
use open ':std', ':encoding(UTF-8)';
use Loader;
```

`LWP` is used to send `get` requests, `Loader` is our module discussed in the previous chapter. We load the configuration specified by the parameter after the program name using the line:

```perl
my $config = Loader->load();
```

We set the success download counter `s` and error counter `e` to `0`.

```perl
my $e = 0;
my $s = 0;
```

We create a `raw` directory for the downloaded data and inside a subdirectory corresponding to the abbreviated name of our data source.

```perl
mkdir 'raw', 0755;
mkdir 'raw/'.$config->{name}, 0755;
```

Since this is a very simple linear scraper, the index passed to the `source` method of the `config` object is calculated by iterating it from zero to the limit specified in the configuration.

```perl
for(my $i = 7480; $i<=$config->{limit}; $i++) {
```

We extract the URL using the `source` method by providing this index. The get function from the `LWP::Simple` module sends a request to the specified address and returns the response body.

```perl
    my $html = get $config->source($i);
```

If the returned response - i.e., the HTML code contains error information, the `invalid` method specified in the configuration should return true. Then a red message `ERROR` will be displayed, and the error counter will increase. This will also trigger an automatic transition to the next index of the loop.

```perl
    if ($config->invalid($html))
    {
        print "ID:\t" . $i . " - \e[31mERROR\e[0m - [e: ".++$e.", s: $s]\n";
        next;
    }
```

If everything went well, the HTML code of the page is saved to a file named simply `index` of the loop.

```perl
    open(my $fh, '>', "raw/".$config->{name}."/".$i.".html") or die "Could not open file: $!";
    print $fh ($html);
    close $fh;
```

The success counter increases and the green message SUCCESS appears on the screen.

```perl
    print "ID:\t" . $i . " - \e[32mSUCCESS\e[0m - [e: $e, s: ".++$s."]\n";
}
```

The execution time of the download depends on the speed of the connection. For me, the time executed on this program for spcc resulted in:

```
real	0m35.027s
user	0m0.456s
sys	0m0.080s
```

What it shows, the enormous potential inherent in parallelizing data retrieval operations.

Example screen of data retrieval:

![](https://i.imgur.com/yAuhj4a.png)

## Data Analysis

To process the downloaded HTML files into a `json` file, the program `json.pl` is used. I wondered whether to include sqlite3 or mongodb, but I wanted a light, as simple as possible NoSQL database. Unfortunately, sqlite3 is not NoSQL, and mongodb is not as easy to install and configure. Ultimately, I stuck with a regular `json` file, but it should be noted that this solution will not work with really large datasets, where we have to account for a limited amount of RAM.

The program starts with loading modules.

> json.pl

```perl
#!/usr/bin/env perl
use strict;
use warnings FATAL => 'all';

use HTML::Query 'Query';
use JSON;
use Loader;
```

The first is `HTML::Query` - a parser engine for HTML and executing selectors on it. The `JSON` module allows converting hashes and arrays to `json` format. We have already encountered `Loader` and seen it in action. It is responsible for loading the configuration. Next to configuration, the second global variable in this program is an array of instances of objects representing the fetched data - companies, pharmacies, or wholesalers.

```perl
my $config = Loader->load();
my @instances = ();
```

We are running through all the indexes again.

```perl
for(my $i = 0; $i<=$config->{limit}; $i++) {
```

This time, the reason for exiting the loop is checking whether the file exists; if not, we move on to the next iteration.

```perl
    if (! -f 'raw/'.$config->{name}."/".$i.".html") { next; }
```

If the file exists, we load it into the `Query` object, on which we will perform selectors.

```perl
    my $q = Query( file => 'raw/'.$config->{name}."/".$i.".html" );
```

The opportunity to use them arises rather quickly. For the first time, we use the selector specified in the `config` object's constructor in the `rows` property. We cut out the area where the interesting data is located. It may turn out that there are more such areas.

For example, pharmacies have a layout with one pharmacy per page, while spcc has multiple companies in one view. Regardless, all areas correspond to single instances of the searched object.

```perl
    my @rows = $q->query($config->{rows})->get_elements(); #
```

It doesn't matter if there is one instance or several, we iterate over them:

```perl
    foreach my $row (@rows)
    {
```

Inside the loop, we filter our `query` through the `query` trimmed to the area of the given instance.

```perl
        $q = Query( tree => $row );
```

The selector set this way is passed to the `select` method of the config object.

```perl
        my %object = $config->select($q);
```

In the `select` method, the details regarding how to parse a given instance of an object lie. We don't have to worry about that here. What is important is that what we receive will be an object of type `hash`, which we then add to the `instances` array.

```perl
        push @instances, \%object;
    }
}
```

When the loop will end. The array `instances` is passed to the object encoding it to the `json` format. Due to Polish characters, the object receives a configuration along the way instructing it to use `utf-8`.

```perl
print JSON->new->utf8(0)->encode(
    {
        'instances'=> \@instances
    }
);
```

Data processing for spcc takes just under three seconds, this time under full CPU load.

```
real	0m2.772s
user	0m2.768s
sys	0m0.000s
```

Screen with a view of processed data

![](https://i.imgur.com/Hs7axWN.png)

## Summary

The program was written about six months ago. Now, before publication, I have standardly refined it a bit. It employs an old-school method of object handling in Perl. It's worth mentioning that it also includes libraries like [Moose](https://metacpan.org/pod/release/ETHER/Moose-2.0802/lib/Moose.pm) or [Moo](https://metacpan.org/pod/Moo) which introduce objects by adding a bit of so-called "syntactic sugar." However, what is much more interesting is that exactly two weeks ago - on July 24th, a stable version of the sixth version of the Perl interpreter was released. It introduces object-oriented programming as part of the native syntax of the language. It also provides better typing, which probably addresses the main drawback of Perl 5, making it difficult to write securely in it. Perhaps this means that Perl 6 will return to higher levels of popularity.
