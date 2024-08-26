---
author: Daniel Gustaw
canonicalName: how-did-the-compatibility-war-shape-the-frontend
coverImage: http://localhost:8484/3737c82b-a958-48dd-a968-3cec36f8e7ee.avif
date_updated: 2023-03-10 15:56:02+00:00
description: We describe how abandonment and backward compatibility have influenced
  the direction of development in web technologies.
draft: true
excerpt: We describe how abandonment and backward compatibility have influenced the
  direction of development in web technologies.
publishDate: 2023-03-10 15:56:01+00:00
slug: en/how-did-the-compatibility-war-shape-the-frontend
title: How did the compatibility war shape the frontend?
tags:
  - compatibility
---


The issue of incompatible software or hardware versions has probably caused us problems in our daily lives more than once. You may have encountered situations or noticed:

Maybe as an entrepreneur, you have already been faced with the problem of migrating your IT system, or as a programmer, you have struggled with errors caused by updating a particular package.

This article aims to show how backward compatibility has influenced the direction of development of web technologies.

Understanding the mechanisms that I will describe will help you predict technology trends more easily and optimize decisions about which technology to invest in.

The compatibility war shaped today's web.

The compatibility issue is not just a problem for ordinary people, but a matter that significantly affects the direction of civilization development. Thanks to it, or due to its lack, certain technologies can grow while others are forgotten.

Let's take the example of the history of web frontend development, which I will briefly outline. It was the beginning of the millennium. Browser creators fought a fierce battle for customers, trying to attract them with increasingly new features. They worked independently, and when they released them, the programmers had to learn the browser specifications and became more and more frustrated.

Often, it was necessary to write separate code for each browser to perform the same task. Some even changed their API several times between versions! Instead of querying the window width, the programmer would first check which browser they were dealing with, and only then execute the appropriate commands based on the detected browser in a long list of conditions.

In these conditions, the jQuery library appeared in 2005. It acted as a mediator between web developers and browsers. It quickly gained popularity because while it added some load to the browser, it reduced the amount of code that needed to be written by the developer, and additionally it took on the responsibility of handling older browsers. As it gained popularity, it introduced innovative solutions such as some selectors for searching elements on the page which later became a permanent part of the standards. An innumerable amount of plugins were written for jQuery and by 2012 it became a technology that every web developer needed to know to create websites.

Everyone knew that code without jQuery often works much faster, but the huge success of jQuery shows how great the reward is for solving the compatibility problem that always arises when dynamically building modern technologies.

The popularity of jQuery began to decline only when it became clear that browser makers had reached an agreement and organized the implementation process of recommendations from standardizing organizations such as W3C. This organization was created through cooperation between MIT and CERN with the support of DARPA and the European Commission, and ensures that web technologies are compatible and provides documentation for language and browser creators. Building it in a thoughtful way now allows for achieving a much more difficult goal - forward compatibility. This means that web standards are now designed so that their later changes will not cause problems with the previous versions' operation.

However, that's not the end of the story. Perhaps you're interested in what happened to web technologies after jQuery slowly became unnecessary.

In 2013, Angular Js, a framework created by Google 4 years prior, started gaining popularity. At the same time, Facebook announced the development of React. Both tools implemented a declarative paradigm for building interfaces using stateless components. In short, the programmer defined conditions for how the frontend should work, and the components took responsibility for the visual layer, leaving more attention for the programmer to work on business logic. In simpler terms, both made coding even faster than with jQuery.

Angular Js started as the first and had an advantage. I remember being amazed when my friend showed me an application written in Angular Js for the first time in 2015. Everything indicated that it was worth learning Angular Js more than React back then.

In 2016, Angular 2.0 was released without Js. Initially, it was supposed to be just another version of Angular Js, but design decisions made it incompatible with the first version of Angular Js. From the beginning, this caused controversy. Similarly, from this point on, new versions were supposed to be released every six months and backward compatibility was only guaranteed for the two previous versions.

Web frameworks grew rapidly, there were more and more of them, and 2017 became a year of "Which new framework will I learn today?" slogan. At the programming school where I taught, the question was asked: "Which framework should we teach our students?" Its founder chose React. Backward compatibility was a significant factor in this decision.

It is easy to guess that many creators of educational materials wanted the course they produced to bring them benefits for a longer period of time. Many programmers wanted to learn a tool that would work in the same way a year from now and with which updates would not increase maintenance costs.

In 2017 - a year after Angular abused the backward compatibility trust and React overtook Angular and never released that lead.

What lesson can be drawn from this story? That compatibility is one of the crucial factors that should be taken seriously when analyzing or planning technology development.

Sources for further reading:

Compatibility with the example of monitors

https://www.eizo.pl/en/baza-wiedzy/od-displayport-po-d-sub-przeglad-zlaczy-wideo-w-monitorach-lcd/

The European Commission wants to force Apple to abandon Lightning in iPhones.

https://www.spidersweb.pl/2018/08/iphone-lightning-charger.html

BIOS and disk problems

http://itfocus.pl/dzial-it/storage/duze-dyski-duze-klopoty/ Translation: http://itfocus.pl/dzial-it/storage/duze-dyski-duze-klopoty/

History of W3C

http://www.tlumaczenia-angielski.info/w3c/history.html
