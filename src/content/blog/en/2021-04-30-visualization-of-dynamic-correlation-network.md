---
author: Daniel Gustaw
canonicalName: visualization-of-dynamic-correlation-network
coverImage: http://localhost:8484/2b2a7b61-d441-4c24-b8f3-f05eebf30c10.avif
description: Python script for visualizing the dynamics of the relationship between financial instruments measured by correlation.
excerpt: Python script for visualizing the dynamics of the relationship between financial instruments measured by correlation.
publishDate: 2021-04-29 20:05:00+00:00
slug: en/visualization-of-dynamic-correlation-network
tags:
- python
- stock
- visualisation
title: Visualization of a dynamic correlation network.
updateDate: 2021-04-29 23:11:09+00:00
---

## Project Description

Python is a language in which one can write without knowing it. Although I don't know Python, I wrote a script to operate the ubigraph server - software that allows visualizing graphs.

The project was created in September 2015, before `ubigraph` [stopped being supported :(](https://twitter.com/SadieSv/status/716044022129659904). Despite the fact that the project website is not available, the software written based on the `ubigraph` server still works and the server file itself has been included in the repository.

By reading this article, you will familiarize yourself with the tool for reading **json files in bash**, learn how to **define classes and operate on arrays in python**, and see how much the **numpy** package simplifies calculations.

The source code composition is:

```
Python 90.1% Shell 9.9%
```

After writing, the project will look like this:

### Installation

To install the project, you need to download the repository

```
git clone https://github.com/gustawdaniel/dynamic_network_correaltion.git
```

Go to the `dynamic_network_correlation` directory and install the project using the `install.sh` script.

```
cd dynamic_network_correaltion && bash install.sh
```

You should see a new black window titled `Ubigraph`. In a new terminal (`ctrl+n`), run the script `visualise.py`.

```
python visualise.py
```

Select the following options in sequence:

```
test ENTER ENTER ENTER ENTER ENTER
```

In the `Ubigraph` window, you should see a visualization of the dynamic correlation network.

## Configuration

This chapter discusses all the installation steps except for installing dependencies.

We will start by downloading data from the brokerage house [bossa](https://bossa.pl). In their [public archive](https://bossa.pl/pub/), there are files with quotes in `mst` format (a variant of `csv`) packed in `zip` archives. All the addresses of the files we are interested in start with `http://bossa.pl/pub/`, but have different extensions. I have saved them in a configuration file.

> config/wget\_data\_config.json

```json
{
  "uri1": "https://bossa.pl/pub/",
  "data": [
    {
      "uri2": "metastock/mstock/mstall.zip"
    },{
      "uri2": "ciagle/mstock/mstcgl.zip"
    },{
      "uri2": "futures/mstock/mstfut.zip"
    },{
      "uri2": "newconnect/mstock/mstncn.zip"
    },{
      "uri2": "jednolity/f2/mstock/mstf2.zip"
    },{
      "uri2": "ciagle/mstock/mstobl.zip"
    },{
      "uri2": "indzagr/mstock/mstzgr.zip"
    },{
      "uri2": "waluty/mstock/mstnbp.zip"
    },{
      "uri2": "fundinwest/mstock/mstfun.zip"
    },{
      "uri2": "ofe/mstock/mstofe.zip"
    },{
      "uri2": "forex/mstock/mstfx.zip"
    }
  ]
}
```

### Downloading archives (json in bash)

Our goal is to download all files with addresses consisting of `"url1"."url2"`. The program `jq` will be responsible for this, allowing us to extract values from a `json` file for given keys. Let's take a look at the first part of the script for downloading quotes:

> wget\_data.sh

```bash
#!/bin/bash

#
#   Definitions
#

# catalogs structure
CONF="config/wget_data_config.json";
RAW="raw";

# method allowing get data from config file
function getFromConf {
    echo $(cat $CONF | jq -r $1);
}

# variables constant for all script
LINES=$(grep \"uri2\": $CONF | wc -l);
URI1=$(getFromConf '.uri1');
```

The variables `CONF` and `RAW` are merely static paths to the configuration file and the directory where the data is to be saved. The variable `LINES` retrieves the number of occurrences of the string `"uri2":` in the `json` file, which corresponds to the number of links we want to fetch.

The function `getFromConf` retrieves the key specified in the first parameter from the configuration file when we call it. Its first application is visible when defining the variable `URI1`. A dot precedes the key name, and the whole is in single quotes. That's enough. The next part of the script is a loop over the lines we have counted.

```bash
#
#   Script
#

#clear raw catalog
rm $RAW/*

# iterate over all lines
for i in `seq 1 $LINES`
do
    # downloading data from links from config
    wget $URI1$(getFromConf '.data['$i-1'].uri2') -P $RAW
done
```

### Unpacking Archives

```bash
#!/usr/bin/env bash

# catalogs structure
RAW=raw;
BUILD=build;

# clear build for idempotency
rm -rf $BUILD/*;

# loop over archives in raw
for FILE in $RAW/*.zip
do
#    create directory in build and unzip there file from raw
    NAME=$(basename $FILE .zip);
    echo $NAME;
    mkdir -p $BUILD/$NAME;
    unzip -q $FILE -d $BUILD/$NAME;
done

```

Option `-q` in the `unzip` command allows you to silence it.

### Preparing the Test Directory

If we look at the file `install.sh`, apart from installing dependencies and preparing data, there is also the preparation of tests.

> install.sh

```bash
# prepare test
mkdir -p test
rm -rf test/*
cp build/mstcgl/[A-D][A-D][A-D]* test/

```

This command is used to select quotes for several example companies and save them in the `test` directory. This simplifies the procedure for starting the program. In its interface, you only need to specify the directory name `test` for it to retrieve all files from there. If you want to see charts for other companies, this method of proceeding is recommended:

1. Create a directory
2. Copy the selected `mst` files into it
3. When starting the visualization, provide the name of this directory and press `ENTER` twice.

## Script executing visualization

Now we will discuss all parts of the script responsible for visualizing the correlation network. We will start with imports and establishing a connection to the server.

> visualise.py

```py
# -*- coding: utf-8 -*-

import os  # for loading files
import datetime  # for time operations
import numpy  # for calculation correlation

import xmlrpclib  # for visualise by ubigraph
import time  # for waiting between steps

#  connect to server displaying image
server_url = 'http://127.0.0.1:20738/RPC2'
server = xmlrpclib.Server(server_url)
G = server.ubigraph

G.clear()  # clear image before start

```

Loaded packages allow us to operate on files, time, perform calculations, connect to the `ubigraph` server, and pause the program for a specific duration. After loading the packages, a connection to the server is established, and its window is cleared.

### Classes

The next part of the script is the class with the configuration.

```py
##################################################################
#                          Configuration                         #
##################################################################

class Config:
    def __init__(self):
        self.state = 1

    # weights of open, highest, lowest and close price for calculating correlation
    op = 0.25
    hi = 0.25
    lo = 0.25
    cl = 0.25

    free_mem = 1  # option for free memory

    sleep = 0.001  # time of sleeping between steps
    memory = 100  # How many days before actual data should be taken in correlation?
    # boundary = 0 #
    boundary = 0.7  # correlation boundary between showed and hidden connection in graph


config = Config()

```

It has no methods, and the variables stored in it are public. It serves only as a container for these values to avoid cluttering the global namespace. The variables `op`, `hi`, `lo`, `cl` are weights with which the opening, highest, lowest, and closing prices for a given instrument on a specific day are used in calculating the correlation. Setting them to `0.25` means calculating a simple average. If we wanted the correlation to be calculated only for closing prices, we should set all except `cl` to `0`, and `cl` to `1`.

The variable `free_mem` will later serve as a marker when freeing memory. `sleep` is the waiting time between successive iterations given in seconds. Iterations mean moving one day back in history. The variable `memory` holds the range of days that should be taken into account for calculating the correlation; these are always days before the day for which we are calculating the correlation. The last variable - `boundary` - is the threshold value for the correlation above which connections are added or removed. If the correlation is higher than this variable's value, connections will appear during visualization; if lower, they will disappear.

This class was merely an equivalent of a structure in `Pascal`. Now it's time for a more "object-oriented" class.

```py
##################################################################
#                          Definitions                           #
##################################################################

class Company:
    """Company contains info about company needed to calculations"""

    def __init__(self, filename):
        self.filename = filename
        self.dates = []
        self.prices = []

        self.prices_evryday = []  # table used instead dates and prices after assigning time of simulation

        self.vertex_id = Company.vertex_id
        Company.vertex_id += 1

    vertex_id = 0
    min_date = 0
    max_date = 0
    name = ''

    def debug_print(self):
        print "name: ", self.name
        print "filename: ", self.filename
        print "vertex: ", self.vertex_id
        print "min_date: ", self.min_date
        print "max_date: ", self.max_date
        print "max price: ", max(self.prices)
        print "min price: ", min(self.prices)

    def in_range(self, date):  # czy date jest w zakresie
        if self.min_date < date < self.max_date:
            return 1
        else:
            return 0

```

### Interface and Data Preparation

```py
        ##################################################################
        #                          Interface                             #
        ##################################################################

print "Select files with input data"

i = 1
paths = []
while 1:
    path = raw_input("Get path to files " + str(i) + ", or ENTER to finish: ")
    if len(path) == 0:
        break
    i += 1
    paths.append(path)
    print path, len(path), paths

if len(paths) == 0:  # if error
    print "\nYou do not chosen enough number of files.\nRead docs or contact with author: gustaw.daniel@gmial.com.\n"
    exit()

directory = ''
if len(paths) == 1:  # catalog
    directory = paths[0]
    print "Loading from catalog :" + str(directory)
    paths = os.listdir(directory)  # names of files

else:
    print "Loading given files:"

```

The interface is somewhat mixed with logic, and I'm sure it could be written more neatly, but as I mentioned - I don't know Python, so if you have any comments or ideas on how this could be written better, please share them in the comments.

In general, the goal of this piece of code was to provide the user with the ability to select a directory or a list of individual files; however, the latter option turned out to be impractical, as it was more convenient to prepare a directory and enter its name than to enter the names manually. At this point, this is the only recommended way to input files into the program.

```py
##################################################################
#                     Loading list of files                      #
##################################################################

companies = []  # empty list of companies

files_content = []  # empty content of files
for path in paths:  # for any path
    files_content.append(open(str(directory) + '/' + str(path), 'r').readlines())
    company = Company(path)  # create company
    companies.append(company)  # append to companies list
    print paths.index(path), path

print "Processing files"

```

When the user specifies which files are to be loaded, their contents are loaded using the `open` function and its `readlines` method. For each file path, an instance of `Company` is created and added to the array of companies (or more generally, financial instruments).

If we look at the structure of the `mst` file, it is as follows:

```csv
<TICKER>,<DTYYYYMMDD>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>
01CYBATON,20080415,4.48,4.48,3.76,4.08,13220
01CYBATON,20080416,4.24,4.24,3.84,4.16,1120
01CYBATON,20080417,4.08,4.40,4.08,4.08,7600
           ...

```

Since we do not need the headers for calculations, we will cut them off from each array containing the line `file_content`.

```py
print "Cutting headers"

for file_content in files_content:  # removing headers
    file_content.pop(0)

```

However, there is still a large excess of data. Above all, the company names are repetitive, dates are in a difficult-to-process format, volumes are not needed at all, and instead of open, high, low, and close prices, we need one price from which the correlation will be calculated.

To get rid of this data, we create two tables - with dates and prices.

```py
date = []
price = []

min_date = 99999999999  # searching min and max date common for companies
max_date = 0

epoch = datetime.datetime.utcfromtimestamp(0)

```

The variables `max_date` and `min_date` will allow us to select the limits of the date range in which we can visualize. I will immediately mention the limitations. The visualization cannot end before January 1, 1970, because that day is the beginning of the countdown of time in seconds in Unix systems. And it cannot start more than `min_date` days ago. It is not an elegant solution, but from a practical point of view, that’s over 200 thousand years, so even though it’s not pretty, it works well.

```py
##################################################################
#           Loading files to memory                              #
##################################################################

print "Saving content"

for i in range(0, len(files_content)):  # for any file
    for line in files_content[i]:  # get line
        l = line.rstrip().split(',')  # split by coma
        date.append((datetime.datetime.strptime(l[1], "%Y%m%d").date() - epoch.date()).days)
        # append date in days form epoch to date array
        price.append(round(
            float(l[2]) * config.op +
            float(l[3]) * config.hi +
            float(l[4]) * config.lo +
            float(l[5]) * config.cl, 4))
        # and price as mean with proper weights to price array
    min_date = min(min_date, date[0])  # if there was no date before this one, set this date there
    max_date = max(max_date, date[-1])  # and in similar way set latest date

    companies[i].name = l[0]
    companies[i].dates = date
    companies[i].prices = price
    companies[i].min_date = date[0]
    companies[i].max_date = date[-1]

    date = []
    price = []
    print i + 1, "/", len(files_content)

if config.free_mem:
    files_content = []

```

This piece of code is responsible for extracting a single price instead of four and converting the date to a date in days since January 1, 1970. The arrays with these only values are saved to temporary variables `price` and `date`, and later to the array of the `Company` class. At the same time, the initial and final dates for each company are noted, and the widest possible date range is saved in `min_date` and `max_date`. By default, at the end of this operation, we clear the memory from the variable `files_content`.

The time has come for the last piece of interaction with the user. They have already specified the input files. The program has examined and processed their content. It is now time for the user to decide which historical period they want to observe.

```py
##################################################################
#           Selecting time of simulation                         #
##################################################################

print "Selecting time of visualisation: "
print "Time given is in days from 01.01.1970"
print "Company name         start of date      end of data"
min_max = max_date
max_min = min_date
for company in companies:
    min_max = min(min_max, company.max_date)
    max_min = max(max_min, company.min_date)
    print repr(company.name).ljust(25), repr(company.min_date).ljust(20), repr(company.max_date).ljust(20)
print "Union (at least one company on stock): ", min_date, max_date
print "Intersection (all companies on stock): ", max_min, min_max

min_user = raw_input("Set first day of simulation, ENTER - Intersection: ")
if len(min_user) == 0:
    min_user = max_min
else:
    min_user = int(min_user)
max_user = raw_input("Set last day of simulation, ENTER - Intersection: ")
if len(max_user) == 0:
    max_user = min_max
else:
    max_user = int(max_user)
memory = raw_input("Set range of calculating correlation, ENTER - 100: ")
if len(memory) == 0:
    memory = config.memory
else:
    memory = int(memory)

```

After explaining to the user the units in which dates are provided, the script calculates the sum and the product of all time intervals corresponding to the listing times of the entered companies. By default, the simulation occurs for a period in which all companies are listed simultaneously, but the user has the option to independently decide on that period. The last variable we ask the user about is the time range in which the correlation will be calculated.

There are still parameters such as the threshold correlation value between the appearance and disappearance of connections, waiting time between subsequent steps. To prevent the interface from being too tedious (and since by default we press enter 5 times), I left these values as default. The script code is explicit, so an interested person can easily change them.

### Calculating interpolation and price correlation

Now let's move on to the calculations.

```py
##################################################################
#                    Interpolation of prices                     #
##################################################################

print "Prices are interpolated"

# print "min memm, max ",min_user, memory, max_user

for company in companies:
    for date in range(min_user - memory, max_user):
        if company.in_range(date):
            price = round(numpy.interp(date, company.dates, company.prices), 4)
        else:
            price = 0
        company.prices_evryday.append(price)
    print repr(company.vertex_id + 1).ljust(3), "/", repr(Company.vertex_id).ljust(6), repr(company.name).ljust(20)
    if config.free_mem:  # free memory
        company.dates = []
        company.prices = []

```

Another problem to overcome is the lack of continuity in the quotes. There are days when the stock exchange is closed. To deal with this in the `Company` class, in addition to the `prices` array, there is also an array called `prices_everyday`. It stores the interpolated prices from all prices and all dates. If a company is not listed, `0` is recorded in the `prices_everyday` array. In this way, we handle the unequal lengths of the trading periods in the input data. After this operation, the arrays with data and prices are no longer needed. We can safely delete them. If for some reason we do not want to do this, we can set the `free_mem` parameter to `0`. However, by default, we clean the memory from this data.

Having data in a form convenient for calculations, we can calculate correlations. Just like with interpolation, the **numpy** package will help us.

```py
##################################################################
#                    Calculation of correlations                 #
##################################################################

print "Calculating of correlation"

corr = []
line = []
correlations = []  # Huge layer matrix with any correlations,

numpy.seterr(divide='ignore', invalid='ignore')  # ignoring of warnings that we get
# calculating correlation on identical lists

for date in range(0, max_user - min_user):
    corr = numpy.corrcoef([company.prices_evryday[date:date + memory] for company in companies])
    correlations.append(corr)

```

It's worth noting that the array `company.prices_everyday` starts at the time `min_user - memory`, meaning `memory` days earlier than the simulation takes place. For this reason, the loop for calculating correlations starts at `0` and ends at `max_user-min_user`, i.e., `memory` indexes before the end of the array `company.prices_everyday`. For each loop iteration, we calculate correlations from the current index to the index that is `memory` ahead of it.

Inside the argument of the function calculating the correlation, we iterate over all companies. It must be said that the `python` syntax is very concise here, while still being quite readable.

The product of this step is a layered correlation matrix, which we will refer to throughout the program.

### Unigraph Server Handling

At this point, the calculations essentially come to an end, and the following code snippets will be related to handling `unigraph`.

```py
##################################################################
#                  Creating matrix of connections                #
##################################################################

print "Initialisation of matrix of connection"

e = [[0 for x in range(Company.vertex_id)] for y in range(Company.vertex_id)]  # matrix of connections

```

At the beginning, we initialize an empty connection matrix representing the presence or absence of correlation between the quotes of financial instruments.

```py
##################################################################
#              Creation of initial vertexes                      #
##################################################################


for ind in range(0, Company.vertex_id):
    if companies[ind].prices_evryday[0] != 0:
        G.new_vertex_w_id(ind)
        G.set_vertex_attribute(ind, 'label', companies[ind].name)

```

We create vertices for companies listed from the beginning and assign them the company names as descriptions.

```py
##################################################################
#              Creation initial connections                      #
##################################################################

for ind1 in range(0, Company.vertex_id):
    for ind2 in range(ind1 + 1, Company.vertex_id):
        if correlations[0][ind1][ind2] >= config.boundary:
            e[ind1][ind2] = G.new_edge(ind1, ind2)

```

We iterate over the triangular adjacency matrix of connections between companies, adding connections if the initial correlations exceed the threshold value set in the configuration. And at the end, we conduct a simulation:

```py
##################################################################
#      Visualization of dynamic correlation network              #
##################################################################

# for any time
for x in range(1, len(correlations)):
    # for any company
    for ind1 in range(0, Company.vertex_id):
        # if company starts be noted, create them
        if companies[ind1].prices_evryday[x - 1] == 0 and companies[ind1].prices_evryday[x] != 0:
            G.new_vertex_w_id(ind1)
            G.set_vertex_attribute(ind1, 'label', companies[ind1].name)
            print x, " (a):v ", ind1
        # for any company with index higher than last one
        for ind2 in range(ind1 + 1, Company.vertex_id):
            # if connection occurs, add this
            if correlations[x - 1][ind1][ind2] < config.boundary <= correlations[x][ind1][ind2]:
                e[ind1][ind2] = G.new_edge(ind1, ind2)
                print x, " (a):e ", ind1, ind2
            # if connection vanishes, delete this
            if correlations[x - 1][ind1][ind2] >= config.boundary > correlations[x][ind1][ind2]:
                G.remove_edge(e[ind1][ind2])
                print x, " (r):e ", ind1, ind2
            time.sleep(config.sleep)
        if companies[ind1].prices_evryday[x - 1] != 0 and companies[ind1].prices_evryday[x] == 0:
            G.remove_vertex(ind1)
            print x, " (r):v ", ind1

```

## Summary

That's all. The cherry on top turned out to be a few lines of dense code compared to the hundreds of lines that struggled to understand the user's intentions and extract a structure convenient for performing calculations from the input data.

Unfortunately, this is a serious problem facing the entire data analysis industry. In many cases, the input data is so inconvenient that transforming it into the desired format costs more effort than actually performing the analysis.

However, the situation is improving. Increasingly common `APIs` and the growing popularity of the `json` format, which is slowly replacing `xml` and `csv`, are steps in the right direction and make working with data easier.

![popularność json, xml, csv](https://i.imgur.com/OyhoigO.png)

As always, I encourage you to comment, express doubts, and ask questions.
