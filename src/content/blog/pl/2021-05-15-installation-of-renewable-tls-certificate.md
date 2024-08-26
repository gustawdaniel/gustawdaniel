---
author: Daniel Gustaw
canonicalName: instalacja-odnawialnego-certyfikatu-tls-certbot-apache-na-ubuntu
coverImage: http://localhost:8484/c29ee70d-e79e-4738-b1dd-fa9818d798a9.avif
date_updated: 2021-06-22 09:05:15+00:00
description: Jest wiele metod uzyskiwania certyfikatu pozwalającego szyfrować ruch
  http. Jedną z nich jest instalacja certbota i użycie go w zestawieniu z serwerem
  apache.
excerpt: Jest wiele metod uzyskiwania certyfikatu pozwalającego szyfrować ruch http.
  Jedną z nich jest instalacja certbota i użycie go w zestawieniu z serwerem apache.
publishDate: 2021-05-14 20:38:00+00:00
slug: pl/instalacja-odnawialnego-certyfikatu-tls
tags:
- https
- ssl
- certbot
- ubuntu
title: Instalacja odnawialnego certyfikatu TLS (certbot + apache na Ubuntu)
---



## Opis projektu

Przez protokół rozumie się zbiór zasad wymiany informacji. Jednym z nich jest opracowany w CERN w 1989 roku protokół HTTP - określjący sposób przesyłania dokumentów hipertekstowych. Jeśli zaszyfrujemy komunikację za pomocą protokołów kryptograficznych dostaniemy HTTPS. Jego zaletą jest to że jest odporny podsłuchiwanie oraz ataki typu man-in-the-middle.

Co do protokołów kryptograficznych, to na dzień dzisiejszy stosowanym protokołem jest TLS 1.2. Jest on następcą protokołu SSL, w którym Google wykryło poważną lukę w postaci wrażliwości na atak typu POODLE pod koniec 2014. W internecie dostępny jest też draft wersji 1.3, która ma całkowicie wyrzucić MD5 oraz RC4 uważane dzisiaj za słabe narzędzia i wprowadzić krzywe eliptyczne, które stosowane są również w BitCoinach.

Celem tego wpisu jest pokazanie **jak za zainstalować certyfikat TLS**.

## Instalacja

Protokół HTTPS jest coraz powszechniej stosowany, w dużej mierze przyczyniła się do tego fundacja Let’s Encrypt, sponsorowana przez EFF, Akamai, Cisco i Mozillę. To dzięki niej powstał program certbot, który bardzo uprościł proces otrzymywania certyfikatu. Zakładam, że mamy zainstalowany system Ubuntu oraz serwer Apache 2. Żeby go zainstalować certbot wpisujemy kolejno:

```
apt-get install software-properties-common
add-apt-repository ppa:certbot/certbot
ENTER
apt-get update
apt-get install python-certbot-apache
```

Uruchamiamy go komendą:

```
certbot --apache
```

Kolejno podajemy swój e-mail, literą A potwierdzamy zgodę na warunki usługi, odpowiadaomy na pytanie, czy chcemy udostępnić e-mail i wybieramy domeny z listy domen określonych w konfiguracji Apache2. Na koniec wybieramy czy chcemy wymuszać https czy dać https jedynie jako jedną z opcji.

## Odświeżanie

Ponieważ certyfikat wygasa po 90 dniach od jego pobrania, potrzebujemy mechanizmu jego automatycznego odświerzania. Na szczęście jest to proste. Nie zaszkodzi, jeśli będziemy go odśwerzać częściej. Zgodnie z poradnikiem zaufanej trzeciej strony dodajemy komendę doświerzającą certyfikat do crona.

```
crontab -e
```

a w pliku umieszczamy linię

```
45 1 * * 1 /usr/bin/certbot renew >> /var/log/certbot.log
```

Możemy cieszyć się już zieloną kłódką na naszej stronie.

![](http://i.imgur.com/6LaRspC.png)

## Żródła:

Instalacja certbot

> [https://certbot.eff.org/#ubuntuxenial-apache](https://certbot.eff.org/#ubuntuxenial-apache)

Różnice między SSL i TLS

> [https://luxsci.com/blog/ssl-versus-tls-whats-the-difference.html](https://luxsci.com/blog/ssl-versus-tls-whats-the-difference.html)

Atak POODLE

> [https://blog.mozilla.org/security/2014/10/14/the-poodle-attack-and-the-end-of-ssl-3-0/](https://blog.mozilla.org/security/2014/10/14/the-poodle-attack-and-the-end-of-ssl-3-0/)

Poradnik od zaufanej trzeciej strony

> [https://zaufanatrzeciastrona.pl/post/jak-wdrozyc-automatycznie-odnawiane-darmowe-certyfikaty-ssl-od-lets-encrypt/](https://zaufanatrzeciastrona.pl/post/jak-wdrozyc-automatycznie-odnawiane-darmowe-certyfikaty-ssl-od-lets-encrypt/)

Statystyki wykorzystania https

> [https://www.google.com/transparencyreport/https/metrics/?hl=en](https://www.google.com/transparencyreport/https/metrics/?hl=en)
