---
title: Problem with standard Auth flow
slug: is-login-registration
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2023-04-19T05:39:46.000Z
draft: true
canonicalName: is-login-registration
---

In most apps we have to register account to act as user. On the other hand we living in society when instant gratification is extremely important force in shaping humans behaviour.

There is open question if friction connected with registration of account not stops our users before trying our app?

When I selecting any new app I almost always have list of few apps. I have to collect informations about them and limited time to made good decision. It is obvious that registration forms with many questions will decrease conversion rate, that was proven in many A/B tests.

[How To Optimize Contact Forms For Conversions \[Infographic\]

Every marketer wants to optimize their forms to get more leads, but how do you do it? Dig into the infographic for some inspiration, examples, stats & tips.

![](https://unbounce.com/photos/cropped-unbounce-favicon-2-270x270.png)UnbounceOli Gardner

![](https://unbounce.com/photos/never-submit1.png)](https://unbounce.com/conversion-rate-optimization/how-to-optimize-contact-forms/)

But what will happen if I will reduce number of questions to **"0".**

I literally mean building flow when new page visitors can start using app as registered, logged in user. He can test it, use and even reload page, but registration time is moved in time as late as possible?

This approach is obvious tradeoff with these disadvantages:

* user do not understand that his account is created in background and can worry about saving result of his actions
* user did not allowed for processing his data, but on the other hand not give us any personal data trying app, so potentially there will be no law problems
* we creating huge amount of test accounts in database always when we need to save user actions

But potential advantage is that user can go throug process of dreams:

* visit page first time
* start using app instantly
* decide if he like it and only then create "real" account

This starts to be extremely important because we can bring forward gratification, and postpone user investment (giving data / clicking "sign up"), that can be competitive advantage worth to implement.

Below I will explain how I implemented this idea in xue.academy - app that allow to learn languages in personalised process driven by AI.

Tech stack is t3. In details: prisma, nuxt, trpc, fastify. I decided to use the following flow:

1. Nuxt server check if request contains cookie.
2. If no, then temporary user is created and cookie are assigned.
3. So fronted always is rendered with "cookie" and user.
4. User will see that is "not logged" but in practice he is logged on temporary account.
5. This temporary user can use app with default settings, but core features are provided.
6. After reaching limits for temporary users he will be kindly asked about registration.
7. Then new real account is created and is merged with temporary account.

First problem is:

* should I save temporary account in database, it will slow down first page.

First page loading speed is priority, so I decided to make process of saving to database non blocking for page rendering.

Additionally all temporary clients will start from similar experience, so I
