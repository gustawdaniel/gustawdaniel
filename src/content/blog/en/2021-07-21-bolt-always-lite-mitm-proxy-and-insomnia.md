---
author: Daniel Gustaw
canonicalName: bolt-always-lite-mitm-proxy-insomnia-and-vue
date_updated: 2021-08-15 23:22:00+00:00
description: hack allowing to order bolt lite using man in the middle attack on app
excerpt: hack allowing to order bolt lite using man in the middle attack on app
publishDate: 2021-07-21 13:53:53+00:00
slug: en/bolt-always-lite-mitm-proxy-and-insomnia
tags:
- attack
- hacking
- bolt
- vue
- MITM
title: Bolt (always) Lite - MITM, Proxy, Insomnia and Vue
---


Howdy!

This is the first part on how we made ordering Bolt Lite always possible. In this part we will discuss practical usage of Man In The Middle (MITM) attack and proxying through PC.

## **Certificate Pinning**

Since Bolt app doesn't use mechanism known as Certificate Pinning it should be an easy job to capture all data sent in the packets.Google has been suggesting implementing CP to all the developers since quite some time, but a few of developers still use it. From the apps that I use most frequently, it is only used by banks and cryptowallets.If there would be certificate pinning in Bolt app, the app would seem disconnected from the internet when sniffing.It is still possible to connect with API when certificate pinning is in place but it involves some APK reverse engineering. If you're interested in how to do that read an excellent @XeEaton article and after you've done with patching the APK come back to my article.

[Reverse engineering and removing Pokémon GO’s certificate pinning | Eaton Works

Eaton Works

![](https://eaton-works.com/wp-content/uploads/PGOCP1.png)](https://eaton-works.com/2016/07/31/reverse-engineering-and-removing-pokemon-gos-certificate-pinning/)

## **MITM Proxy**

To sniff on packets sent by the Bolt Android App we will be using mitmproxy, which is an open source project.

[mitmproxy - an interactive HTTPS proxy

![](https://mitmproxy.org/favicon.ico)an interactive HTTPS proxy

![](https://mitmproxy.org/logo-navbar.png)](https://mitmproxy.org/)

If your Android version is higher than Nougat (Android 7), which probably is the case since you're a mega geek and you're reading this article, you'll also need:

* rooted Android device
* Xposed Framework installed
* JustTrustMe ([https://github.com/Fuzion24/JustTrustMe](https://github.com/Fuzion24/JustTrustMe)) module enabled

After installing the mitmproxy on your local-network PC, run command:

```
mitmweb (or mitmproxy if you love CLIs)
```

It will show you the port it's listening on (8080 by default). Go to the network settings of your Android device and type it in under "Proxy".From now on you can sniff the packets, just like you would be in dev-tools of Google Chrome.

## **Alternative way: HTTPCanary**

GuoShi made an awesome job and a beautiful Android app that allows you to sniff packets in real time. Unfortunately, I wasn't able to find the way to access the logs from your PC in real-time, but it is still an easy job to input those into Insomnia for tests.

## **Insomnia**

After I catched all the necessary requests I've proceeded to Insomnia to check which ones do I need.

### **Creating rides**

The Bolt API, though not public, has still very descriptive error codes such as:

![](../../../assets/2021-07-21/attack-1.png)

You will encounter such errors a lot - the most important thing is to listen to them!

Because of that I knew we need to take a step back and first search for a taxi options to obtain the price lock hash and category id (Bolt, Lite, Pets...), which will be sent with a query for creating a ride.

### **Searching for taxi options**

![](../../../assets/2021-07-21/attack-2.png)

Sending such payload returns us with the list of possible fares and available bolt categories:

![](../../../assets/2021-07-21/attack-3.png)

What's intriguing about it is that we also get "surge\_multiplier" parameter, which is not visible in the app. Nice!

## **Request flow**

![](../../../assets/2021-07-21/attack-4.png)

## **Constant reuqest queries**

After careful analysis of all 4 requests (creating a ride, cancelling a ride, getting available cars and polling current app status) it's pretty easy to notice that there are some parameters, which concern each of requests' query:

```
gps_lat: current latitude
gps_lng: current longitude
session_id: must not be null - doesn't really matter
user_id: string of numbers identifying user
country: current country
language: user language
deviceType: in my case "android"
version: in my case "CA.7.01"
deviceId: unique deviceId string generated
device_name: string including android device model number - probably for statistical purposes
device_os_version: android version (in my case 10)
```

We will refactor those as an object and configure axios so that this data will be sent with each request as an additional query.

## **Tech stack choice**

As we frequently do in our software house, we will be using Vue with Nuxt for front end. For the backend we will be using our Precise Lab CORS proxy.

## **Card denied issue**

Sometimes, when you create a new ride, bolt randomly throws a credit card authorization error, which looks like a bug in their API. We will just `try {} catch {}` it, wait for the error, assert it, and repeat creating a new ride. It never happens the second time in a row, so we are fine with that solution.

## **Making it fancier**

As a last step I will take care of showing the current ride status to the end-user and providing him with an exact map so that he can make sure he chose the right pick-up and drop-off points. There's no need for real-time driver tracking because you can do it in the app as you would normally, however this could be added easily as when the ride has been confirmed by the driver you get car coordinates and even car orientation (that's how the bolt app shows cars doing backflips and drifting) in every ride status request.

## **Achilles' heel**

So it is deployed and you can use it! Yay!
The only issue is that you still need to get you API key. Sadly, you won't be able to find it in your Bolt app settings. To get it you need to analyse requests that your app sends and to do that you need HTTP Canary or other packet sniffer that I wrote about in the 1st part of this bolt-hacking adventure. The good news are that your bolt api token is valid indefinitely (or at least for a very long time).
Maybe we could get this token with bolt web application?
There's a bolt mobile web app but sadly, it doesn't really work anywhere:

![](../../../assets/2021-07-21/attack-5.png)

A sad alert you will get whenever you move the pickup pin on m.bolt.eu.

And if you look into HTTP requests that are sent back and forth:

![](../../../assets/2021-07-21/attack-6.png)

That's pretty much it! Thanks for reading folks!

If You love what we do, feel free to reach me at [krzysztof.dziardziel@preciselab.io](mailto:krzysztof.dziardziel@preciselab.io).
