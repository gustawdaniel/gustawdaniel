---
author: Daniel Gustaw
canonicalName: wordpress-scraping
coverImage: http://localhost:8484/8a96e11b-a834-413b-a886-3b5eb059ba3e.avif
description: It is not often that the execution of a service takes longer than its pricing, but with scraping, this can happen. See how easy it can be to retrieve data, especially from WordPress.
excerpt: It is not often that the execution of a service takes longer than its pricing, but with scraping, this can happen. See how easy it can be to retrieve data, especially from WordPress.
publishDate: 2021-04-19 12:14:43+00:00
slug: en/scraping-wordpress
tags:
- wordpress
- scraping
title: Scraping WordPress - 4300 court rulings in exchange rate lawsuits without a line of code
updateDate: 2021-04-19 12:18:07+00:00
---

It is not often that the execution of a service takes less time than its estimation, but with scraping, this can happen. Scraping is similar to hacking in that, depending on the security measures and the complexity of the system from which we are extracting data, it can be either trivially simple or pose a serious challenge.

In this post, I will show how I performed the scraping service before I had time to estimate it. I did not write a single line of code, and the whole process took me a few minutes.

## What the client needed:

The inquiry was about the database of court judgments from the site

[https://nawigator.bankowebezprawie.pl/pozwy-indywidualne/](https://nawigator.bankowebezprawie.pl/pozwy-indywidualne/)

![](http://localhost:8484/7a238f0e-5274-43d1-abb9-24f9cbf45bad.avif)

Thanks to the Wappalyzer plugin, we can read that it is WordPress - an ancient technology that is usually friendly to scraping, as its choice indicates a lack of funds for any anti-scraping actions.

The table reloads in real-time. Pagination does not change the URLs. This is a typical solution for the `datatable` package which is a `jquery` plugin.

[https://datatables.net/](https://datatables.net/)

On the page of this plugin, we will find the same table, just with slightly modified styles:

![](http://localhost:8484/8c945eb6-3854-4054-a3b2-b3282411e363.avif)

These are sufficient clues to suggest that the data for the table is loaded from a single endpoint. A quick analysis of network traffic does not show anything interesting, but showing the page source does:

![](http://localhost:8484/43d4180b-e8ae-4b4d-b8a6-1b5962d3e929.avif)

The rest of the service was just about selecting those few thousand lines of text and saving them in a `json` file. Potentially for the convenience of the end user, conversion to `csv` or `xlsx`, for example on the page

[JSON to CSV - CSVJSON](https://csvjson.com/json2csv)

![](http://localhost:8484/2ae82148-8458-4caa-bb30-2376d9db19d8.avif)

Links to downloaded data:

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json)

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json.xlsx](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json.xlsx)

At the end, I would like to emphasize that although access to this data is free, the people working on its structuring are doing so on a voluntary basis to achieve the goal set by the association:

> B) collecting information about unfair practices of entrepreneurs and other cases of legal violations by these entities, and developing and publicly sharing information, articles, reports, and opinions in this regard.

[https://rejestr.io/krs/573742/stowarzyszenie-stop-bankowemu-bezprawiu](https://rejestr.io/krs/573742/stowarzyszenie-stop-bankowemu-bezprawiu)

If you want to benefit from their work, I encourage you to support them on their website

[https://www.bankowebezprawie.pl/darowizna/](https://www.bankowebezprawie.pl/darowizna/)

![](http://localhost:8484/81b9771e-640d-4a50-997c-1018220a7158.avif)
