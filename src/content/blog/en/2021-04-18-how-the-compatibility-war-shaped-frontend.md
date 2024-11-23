---
author: Daniel Gustaw
canonicalName: how-the-compatibility-war-shaped-frontend
coverImage: http://localhost:8484/e0ab5fe0-f28a-48c9-b055-ed3c3eb8a5cd.avif
description: We describe how deprecation and maintaining backward compatibility have influenced the direction of web technology development.
excerpt: We describe how deprecation and maintaining backward compatibility have influenced the direction of web technology development.
publishDate: 2021-04-22 18:51:16+00:00
slug: en/how-the-compatibility-war-shaped-frontend
tags:
- compatibility
title: How the war for compatibility shaped the frontend?
updateDate: 2021-04-2 18:51:16+00:00
---

Incompatible versions of software or hardware have likely hindered us in our daily lives more than once. Perhaps you've encountered situations or noticed:

* how, when asking someone for a phone charger 10 years ago, it had to be established whether it would actually fit
* how BIOS was supplanted by UEFI because it did not support booting systems from drives larger than 2TB
* how old games from childhood caused problems on new operating systems
* how two BTC wallets could display different account balances for the same seed

As an entrepreneur, you may have faced the challenge of migrating your IT system, or as a programmer, you may have struggled with errors caused by updating a package.

![](http://localhost:8484/89e36eaa-b1df-4048-b690-7942494408ad.avif)

This article aims to demonstrate how backward compatibility has influenced the development direction of web technologies.

Understanding the mechanisms I will describe will help you better forecast trends in technologies and optimize decisions regarding which technology to invest in.

**The compatibility war has shaped today's web.**

The issue of compatibility is not just a problem for ordinary people, but a matter that significantly influences the direction of civilization's development. It is through this, or due to its absence, that certain technologies can thrive while others are forgotten.

An example is the history of web frontend development, which I will briefly outline. It was the beginning of the millennium. Browser developers engaged in a fierce battle for customers, trying to attract them with increasingly new functionalities. They worked on them independently, and when they published their updates, programmers learned the specifications introduced by the browsers and became increasingly frustrated.

Often, separate code had to be written for each browser to perform the same task. Some browsers changed their programming interface several times even from version to version! When writing code, instead of asking for the window's width, a programmer first checked which browser they were dealing with, and only then did they execute the appropriate commands from a long list of conditions based on the detected browser.

![](http://localhost:8484/a05d33ed-5348-4ac0-959b-0df33e5f8823.avif)

Under these conditions, jQuery emerged in 2005. It served as an intermediary layer between web developers and browsers. It quickly gained popularity because, although it burdened browsers, it allowed developers to write much less code, while taking on the responsibility for supporting old browsers. As it gained popularity, it introduced innovative solutions such as certain selectors for searching elements on a page, which later became permanent in standards. Countless plugins were created for jQuery, and by 2012, it became a technology that every developer learned if they wanted to create websites.

Everyone knew that code without jQuery often ran significantly faster, but the immense success of jQuery shows how great a reward awaits those who solve the compatibility problem that arises whenever new technologies are dynamically built.

The popularity of jQuery began to wane only when it became clear that browser creators had reached an agreement and organized the process of implementing recommendations from standardizing organizations like W3C. This organization, born from the cooperation of MIT and CERN with the support of DARPA and the European Commission, ensures that web technologies are compatible and creates documentation for language and browser developers. Building this in a thoughtful way now allows for achieving a much more challenging goal - forward compatibility. This means that web standards are now designed so that later changes do not cause issues in the operation of previous versions.

However, this is not the end of the story. You may be wondering what happened to web technologies after jQuery gradually became less necessary.

![](http://localhost:8484/1c67ab75-ecb0-4267-b032-40e168750fe5.avif)

In 2013, the Angular Js framework, created 4 years earlier by Google, began to gain attention. At the same time, Facebook announced the creation of React. Both tools implemented a declarative paradigm for building interfaces using stateless components. In short, the programmer defined the conditions specifying how the frontend should work, while the components took responsibility for the visual layer, allowing the programmer to focus more on business logic. Simply put: both made writing code even faster than with jQuery.

Angular Js started as the first one and had an advantage. I remember being astonished watching my friend show me an application written in Angular Js for the first time in 2015. Everything indicated that it was more worthwhile to learn Angular Js than React.

In 2016, Angular 2.0 was released, dropping the "Js" from its name. It was initially meant to be just another version of Angular Js, but design decisions made it incompatible with the first version of Angular Js. This raised significant controversy from the beginning. Similarly, it was controversial that from that point on, new versions were to be released every six months, and backward compatibility would only be maintained for the last two versions.

Web frameworks grew rapidly, and the year 2017 became the year of the question "What new framework will I learn today?". In the programming school where I taught, the question was posed: "Which framework should we teach our students?". Its founder chose React. Backward compatibility was a significant factor in that decision.

It’s easy to guess that many creators of educational materials wanted once produced courses to remain profitable longer. Many programmers wanted to learn a tool that would work the same way a year later and would not cause maintenance costs to rise with updates.

In 2017 - a year after Angular's abuse of the trust built through backward compatibility, React overtook Angular and never relinquished that advantage.

What lesson can be drawn from this story? That compatibility is one of the key factors that must be taken seriously when analyzing or planning the development of technology.

Sources for further reading:

Compatibility through the example of monitors

[https://www.eizo.pl/baza-wiedzy/od-displayport-po-d-sub-przeglad-zlaczy-wideo-w-monitorach-lcd/](https://www.eizo.pl/baza-wiedzy/od-displayport-po-d-sub-przeglad-zlaczy-wideo-w-monitorach-lcd/)

The European Commission wants to force Apple to abandon Lightning in iPhones

[https://www.spidersweb.pl/2018/08/iphone-ladowarka-lightning.html](https://www.spidersweb.pl/2018/08/iphone-ladowarka-lightning.html)

Problems with BIOS and drives

[https://itfocus.pl/dzial-it/storage/duze-dyski-duze-klopoty/](https://itfocus.pl/dzial-it/storage/duze-dyski-duze-klopoty/)

History of W3C

[https://www.tlumaczenia-angielski.info/w3c/history.html](https://www.tlumaczenia-angielski.info/w3c/history.html)
