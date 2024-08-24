---
author: Daniel Gustaw
title: Jak skonfigurować SSL w lokalnym developmencie
canonicalName: jak-skonfigurowac-ssl-w-lokalnym-developmencie
slug: pl/jak-skonfigurowac-ssl-w-lokalnym-developmencie
publishDate: 2021-11-15T16:47:42.000Z
date_updated: 2021-11-15T16:47:42.000Z
tags: ['ssl', 'https', 'security']
description: Ustawienie połączenia https na domenie localhost może być wyzwaniem jeśli robimy to pierwszy raz. Ten wpis jest bardzo szczegółowym tutorialem ze wszystkimi komendami i screenshotami.
excerpt: Ustawienie połączenia https na domenie localhost może być wyzwaniem jeśli robimy to pierwszy raz. Ten wpis jest bardzo szczegółowym tutorialem ze wszystkimi komendami i screenshotami.
coverImage: https://ucarecdn.com/54493527-eac3-463a-a991-b0d4ced05f23/
---

Ustawianie certyfikatu ssl podczas developmentu może być poważnym wyzwaniem. Nie wynika to ze złożoności tego zadania, ale z pułapek, w jakie można wpaść jeśli posiada się luki w wiedzy na temat sieci, certyfikatów i protokołu https.

W tym wpisie pokażę jak krok po kroku przejść przez proces ustawiania lokalnego developmentu z https. Zrobimy przy tym kilka dygresji dotyczących problemów jakie mogą się pojawić.

W tym wpisie opisuję jak nadpisać zewnętrzne DNS, utworzyć organizację certyfikującą, przygotować żądanie utworzenia certyfikatu dla domeny, spełnić je, zaufać tej organizacji, skonfigurować serwer nginx do proxowania ruchu i używania certyfikatu domeny i finalnie cieszyć się połączeniem https.

## Lokalna domena

Zaczniemy od podstaw. Czyli lokalnego przekierowania domeny na nasz lokalny komputer. Zwykle kiedy pytamy przeglądarki o domenę serwery DNS ustawione w naszym komputerze dostarczają na numer IP na który należy wysłać żądanie.

Ustawienia `DNS` dla naszego komputera możemy sprawdzić w pliku `resolv.conf`

```
cat /etc/resolv.conf
```

[Domain name resolution - ArchWiki

![](https://wiki.archlinux.org/favicon.ico)ArchWiki

![](https://wiki.archlinux.org/images/3/38/Tango-view-fullscreen.png)](https://wiki.archlinux.org/index.php/Domain_name_resolution)

Nie zawsze jednak musimy pytać o IP serwerów `DNS`. Zapytania do zewnętrznych serwerów DNS możemy przesłonić naszymi wpisami w pliku `/etc/hosts`.

Zawartość tego pliku może u Ciebie wyglądać tak:

```
# Static table lookup for hostnames.
# See hosts(5) for details.
127.0.0.1	localhost
::1		localhost
127.0.1.1	hp-1589
```

Aby dodać do niego naszą domenę musimy edytować plik `hosts`

```
sudo nvim /etc/hosts
```

Dodajemy na końcu linię:

```
127.0.0.1	local.dev
```

Aby przetestować tą konfigurację napiszemy prostą stronę w `php`. Do pliku `index.php` zapisujemy:

```
<?php
header('Content-Type: application/json');
echo '{"status":"ok"}';
```

Możemy ją hostować poleceniem

```
php -S localhost:8000 index.php
```

Naturalnie polecenie:

```
http http://localhost:8000/
```

zwróci nam `{"status": "ok"}`. Niestety zapytanie o domenę:

```
http http://local.dev:8000/
```

pokarze błąd:

```
http: error: ConnectionError: HTTPConnectionPool(host='local.dev', port=8000): Max retries exceeded with url: / (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7fbaa2dfcc40>: Failed to establish a new connection: [Errno 111] Connection refused')) while doing a GET request to URL: http://local.dev:8000/
```

Domena kieruje nas w odpowiednie miejsce co może potwierdzić `getent`

```
getent hosts local.dev
127.0.0.1       local.dev
```

Problem leży w ograniczeniu hostów na których jest ustawiony serwer.

> Pułapka 1: sprawdź jakiego hosta ma twój lokalny server.

W komendzie `php -S localhost:8000 index.php` nie powinniśmy używać `localhost`. Jest to częsty przypadek również w innych językach, gdzie frameworki serwują domyślnie na hoście localhost a powinny na `0.0.0.0`.

Aby naprawić problem wyłączamy serwer i stawiamy go komendą

```
php -S 0.0.0.0:8000 index.php
```

Tym razem działa on poprawnie.

![](https://ucarecdn.com/d280540b-5da1-4b91-87e3-c85834524e59/)

Dlaczego tak jest? Sam localhost stanowi tylko alias względem adresu `127.0.0.1`. Nasza domena `local.dev` też jest aliasem do `127.0.0.1` ale już nie do `localhost`. Ustawiając serwer komendą: `php -S 127.0.0.1:8000 index.php`, też uzyskaliśmy pożądany wynik. Chyba, że pracowali byśmy z adresacją ipv6, wtedy zamiast lub obok `127.0.0.1` w `/etc/hosts` ustawili byśmy `::1`. Jeśli temat różnic między `localhost` a `127.0.0.1` jest dla Ciebie nowy polecam Ci artykuł:

[Difference between localhost and 127.0.0.1

Lots of people would think what the address 127.0.0.1 is when first seeing this address. In fact, 127.0.0.1 is a loopback address which refers to the local machine. It is generally used for local test

Pixelstech.net

![](https://www.pixelstech.net/images/logo.png)](https://www.pixelstech.net/article/1538275121-Difference-between-localhost-and-127-0-0-1)

## Instalacja Nginx

Pokazane tu rozwiązanie, to nie jedyna droga, bo wiele serwerów i frameworków ma swoje własne rozwiązania do ssl w lokalnym developmencie. Zaletą mojego podejścia jest uniwersalność.

Instalacja serwera `nginx`

```
yay -S nginx
```

Włączamy go:

```
sudo systemctl start nginx.service
```

Jeśli chcemy, żeby startował przy każdym włączeniu systemy dodajemy:

```
sudo systemctl enable nginx.service
```

Sam nie używał bym tego drugiego polecenia na komputerze lokalnym, ponieważ niepotrzebnie blokuje port `80`.

Po instalacji `nginx` przywitał nas swoją stroną startową na porcie `80`.

![](https://ucarecdn.com/edc5f538-f5d8-4da4-b860-1e724fff2f49/)

### Nginx w Mac OS

Na systemie `Mac OS` ngnix domyślnie startuje na porcie `8080`

[https://www.javatpoint.com/installing-nginx-on-mac](https://www.javatpoint.com/installing-nginx-on-mac)

Możemy to zmienić edytując plik `/usr/local/etc/nginx/nginx.conf` a sam serwer włączyć poleceniem

```
launchctl load /usr/local/Cellar/nginx/1.21.4/homebrew.mxcl.nginx.plist
```

przy czym wersja w Twoim systemie może różnić się od tej podanej przeze mnie. Odpowiednikiem archowego `enable` jest opcjonalna flaga `-w`

[Launchctl difference between load and start, unload and stop

I was reading through the launchctl man page and have a few questions about its functioning: What is the difference between load and start, unload and stop?Where do I find the job label for a dae...

![](https://cdn.sstatic.net/Sites/apple/Img/apple-touch-icon.png?v&#x3D;daa7ff1d953e)Ask DifferentJason Rubenstein

![](https://cdn.sstatic.net/Sites/apple/Img/apple-touch-icon@2.png?v&#x3D;b514451ec60c)](https://apple.stackexchange.com/a/308421)

## Przygotowanie certyfikatu self-signed

Aby móc posługiwać się certyfikatem SSL podczas lokalnego developmentu aplikacji należy posłużyć się certyfikatem `self-signed`.

Jego utworzenie opisano w dokumentacji archa:

[nginx - ArchWiki

![](https://wiki.archlinux.org/favicon.ico)ArchWiki

![](https://wiki.archlinux.org/images/8/87/Tango-edit-clear.png)](https://wiki.archlinux.org/index.php/nginx)

Interesujące nas polecenia to:

```
sudo mkdir /etc/nginx/ssl
cd /etc/nginx/ssl
sudo openssl req -new -x509 -nodes -newkey rsa:4096 -keyout server.key -out server.crt -days 1095
sudo chmod 400 server.key
sudo chmod 444 server.crt
```

Na `Mac OS` lepszą lokalizacją będzie katalog `/usr/local/etc/nginx/ssl`.

## Dołączenie certyfikatu do Nginx

W tej chwili nasz certyfikat nie jest jeszcze podłączony do serwera. Nginx nie nasłuchuje na porcie `443` i przez to zapytanie o `https://localhost` kończy się niepowodzeniem:

```
http --verify no https://localhost

http: error: ConnectionError: HTTPSConnectionPool(host='localhost', port=443): Max retries exceeded with url: / (Caused by NewConnectionError('<urllib3.connection.HTTPSConnection object at 0x7f089f77fee0>: Failed to establish a new connection: [Errno 111] Connection refused')) while doing a GET request to URL: https://localhost/
```

Zmienimy teraz ustawienia `nginx`

```
sudo nvim /etc/nginx/nginx.conf
```

lub na `Mac OS`

```
sudo nano /usr/local/etc/nginx/nginx.conf
```

dodając pod kluczem `http` wpis:

```
    server {
        listen       443 ssl;
        server_name  localhost;

        ssl_certificate      ssl/server.crt;
        ssl_certificate_key  ssl/server.key;

        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
        }
    }
```

Po przeładowaniu serwisu komendą:

```
sudo systemctl reload nginx.service
```

lub na `Mac OS`

```
sudo brew services restart nginx
```

[How to restart Nginx on Mac OS X? | Newbedev

Solution 1: sudo nginx -s stop && sudo nginx Solution 2: For a one-liner, you could just do: sudo nginx -s reload The -s options stands for signal, and is the o

![](https://newbedev.com/android-icon-192x192.png)NewbeDEV

![](https://newbedev.sfo3.digitaloceanspaces.com/wp-content/uploads/2021/11/12032228/BANNER-NEWBEDEV-15.png)](https://newbedev.com/how-to-restart-nginx-on-mac-os-x)

zobaczymy, że domyślna strona nginx jest dostępna pod `https`:

```
http --verify no -h https://localhost
HTTP/1.1 200 OK
```

Zaletą takiej konfiguracji jest to, że https działa, ale certyfikaty samopodpisane nie są obsługiwane przez `httpie` a przeglądarka też może mieć z nimi problemy.

Aby przejść do kolejnego kroku skasujemy te certyfikaty. Nie będziemy ich więcej używać. Zamiast certyfikatów samo-podpisanych stworzymy organizację, która podpisze nam certyfikat domeny.

## Przekierowanie ssl do aplikacji

Stajemy się weryfikatorem certyfikatów (CA)

#### Weryfikator Certyfikatów (CA)

Generowanie klucza prywatnego bez hasła

```
openssl genrsa -out myCA.key 2048
```

To polecenie tworzy plik `myCA.key`

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA+aKMj19W37DjX3nrQ7XTjP3trXXK5hLvByRDKL/QsMGOrxac
...
Xt0itnAcq1vPqqRcsV+YPAE8oyAOXHM1aaTQIH5mp5jHySOqZtSFca8=
-----END RSA PRIVATE KEY-----
```

Generowanie certyfikatu `root`.

```
openssl req -x509 -new -nodes -key myCA.key -sha256 -days 825 -out myCA.pem
```

Dostajemy pytania o dane instytucji certyfikującej. Na pytania odpowiedziałem w następujący sposób:

```
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:PL
State or Province Name (full name) [Some-State]:Mazovian
Locality Name (eg, city) []:Warsaw
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Precise Lab CA
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:PL_CA
Email Address []:gustaw.daniel@gmail.com
```

dostaliśmy plik `myCA.pem` o zawartości

```
-----BEGIN CERTIFICATE-----
MIID5zCCAs+gAwIBAgIUUfo+Snobo0e/HXHJm5Hf4B0TvGEwDQYJKoZIhvcNAQEL
...
7ntEpRg3YZUdDtM0ptDvETM8+H35V9aZtUo1/e2136x459pGZd1aJz+Hhg==
-----END CERTIFICATE-----
```

#### Certyfikat podpisany

Tworzymy `CA-signed` certyfikat (już nie samo-podpisany)

Definiujemy zmienną z zapisaną domeną:

```
NAME=local.dev
```

Generujemy klucz prywatny

```
openssl genrsa -out $NAME.key 2048
```

dostajemy plik `local.dev.key` o treści

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEApvXY4EiWGELQuVTEH9YZ8Qoi0Owq39cQ+g93e7EaKlMzx1fU
...
VburjZcC/InypDy0ZChc6tC0z5A6qkWlLA+3eGs8ADtvQ4qtCS9+Aw==
-----END RSA PRIVATE KEY-----
```

Następnie tworzymy żądanie jego podpisania.

```
openssl req -new -key local.dev.key -out local.dev.csr
```

Ponownie jesteśmy pytani o dane. Tym razem są to dane organizacji chcącej podpisać certyfikat. Nie możemy podać tej samej `Common Name`. Moje odpowiedzi:

```
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:PL
State or Province Name (full name) [Some-State]:Mazovian
Locality Name (eg, city) []:Warsaw
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Precise Lab Org
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:PL
Email Address []:gustaw.daniel@gmail.com

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

Po wykonaniu tego polecenia dostajemy plik `local.dev.csr` o treści:

```
-----BEGIN CERTIFICATE REQUEST-----
MIICxjCCAa4CAQAwgYAxCzAJBgNVBAYTAlBMMREwDwYDVQQIDAhNYXpvdmlhbjEP
...
9f1qkg6LHapOjzevheKWEjWG1hnJjBOj42mmIDBVZBHVszP7rrfiRMma
-----END CERTIFICATE REQUEST-----
```

Teraz utworzymy plik konfiguracyjny rozszerzenia. Zapisujemy do pliku `$NAME.ext` zawartość

```
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = local.dev
```

Tworzymy podpisany certyfikat

```
openssl x509 -req -in $NAME.csr -CA myCA.pem -CAkey myCA.key -CAcreateserial -out $NAME.crt -days 825 -sha256 -extfile $NAME.ext
```

Jeśli wszystko się powiodło powinniśmy zobaczyć:

```
Signature ok
subject=C = PL, ST = Mazovian, L = Warsaw, O = Precise Lab, emailAddress = gustaw.daniel@gmail.com
Getting CA Private Key
```

Sprawdzenie czy poprawnie zbudowaliśmy certyfikat możemy wykonać komendą:

```
openssl verify -CAfile myCA.pem -verify_hostname local.dev local.dev.crt

local.dev.crt: OK
```

lub na `Mac OS`

```
openssl verify -CAfile myCA.pem local.dev.crt
```

Podsumujmy kroki, które wykonaliśmy:

* zostaliśmy organizacją certyfikującą "Precise Lab CA", która ma klucz `myCA.key` i certyfikat `myCA.pem`
* podpisaliśmy certyfikat domeny używając certyfikatu i klucza organizacji certyfikującej dla domeny. Był do tego potrzebny jej klucz `local.dev.key`, żądanie jego podpisania `local.dev.csr` wystawione przez "Precise Lab Org" i plik konfiguracyjny rozszerzenia `local.dev.ext`
* podpisany certyfikat znajduje się w pliku `local.dev.crt`.

#### Zaufanie organizacji certyfikującej w Chrome

Teraz powinniśmy zaufać organizacji certyfikującej. Dodajmy jej plik `pem` jako `Authority` w ustawieniach przeglądarki. W pasku adresu wpisujemy:

```
chrome://settings/certificates
```

Zobaczymy:

![](https://ucarecdn.com/6c552745-d6d7-452f-a6a8-c82b77ee9398/)

Po kliknięciu import i wybraniu pliku `myCA.pem` zaznaczamy jakim operacjom tej organizacji chcemy ufać:

![](https://ucarecdn.com/e185608f-e06f-465d-98bc-e75a4927ef7e/)

#### Zaufanie organizacji certyfikującej w Firefox

W Firefox wchodzimy na adres `about:preferences#privacy` i w zakładce "Certificates" do "View Certificates". Następnie wybieramy import i plik `myCA.pem`

![](https://ucarecdn.com/cdd83c80-7b45-4b9d-a265-ceeb578f1ebf/)

od razu zaznaczamy organizację certyfikującą jako zaufaną

![](https://ucarecdn.com/dd644237-d42b-4a95-8b0b-1d956846ab83/)

W przeciwieństwie do Chrome, te ustawienia są niezależne od systemu operacyjnego.

#### Zaufanie organizacji certyfikującej na Mac OS w Chrome

Na komputerach z `Mac OS` nie możemy zmienić ustawień bezpośrednio w chome. Zamiast tego otwieramy finder. Znajdujemy w nim plik `myCA.pem` i klikamy go dwa razy.

![](https://ucarecdn.com/9991f51f-8d61-4770-81e8-8f154afa0a68/)

po potwierdzeniu hasłem powinniśmy zobaczyć w programie "Pęk Kluczy" (Keychain) naszą organizację w zakładce "Certificates"

![](https://ucarecdn.com/5b588af5-97db-419c-ab7e-8f481ee6a521/)

Teraz musimy oznaczyć ten certyfikat jako zaufany wybierając opcję "Always Trust".

![](https://ucarecdn.com/5aba5b59-a2de-432c-b7a7-15812fc0ea64/)

#### Konfiguracja Nginx jako proxy

Kolejny raz zmieniamy ustawienia `nginx`. Tym razem przełączamy się na wygenerowany certyfikat i jego klucz.

```
    server {
        listen       443 ssl;
        server_name  local.dev;

        ssl_certificate      ssl/local.dev.crt;
        ssl_certificate_key  ssl/local.dev.key;

        location / {
                proxy_pass          http://127.0.0.1:8000;
                proxy_set_header    Host             $host;
                proxy_set_header    X-Real-IP        $remote_addr;
                proxy_set_header    X-Forwarded-For  $proxy_add_x_forwarded_for;
                proxy_set_header    X-Client-Verify  SUCCESS;
                proxy_set_header    X-Client-DN      $ssl_client_s_dn;
                proxy_set_header    X-SSL-Subject    $ssl_client_s_dn;
                proxy_set_header    X-SSL-Issuer     $ssl_client_i_dn;
                proxy_read_timeout 1800;
                proxy_connect_timeout 1800;
        }
    }
```

Nie możemy zapomnieć o przeładowaniu serwera:

```
sudo systemctl reload nginx.service
```

Na `Mac OS` nie ma `systemctl` i używamy `brew`

```
sudo brew services restart nginx
sudo pkill nginx
sudo nginx
```

Po wejściu na stronę:

> [https://local.dev/](https://local.dev/)

możemy cieszyć się widokiem kłódki przy adresie lokalnej strony:

* na Chrome

![](https://ucarecdn.com/36f90ff2-6819-4123-a28a-fb0283c960fc/)

* oraz na Firefox

![](https://ucarecdn.com/5ea4ee9a-1437-4038-90f3-a30f91344a6e/)

W konsoli nie zobaczymy jednak poprawnego wyniku:

```
http https://local.dev

http: error: SSLError: HTTPSConnectionPool(host='local.dev', port=443): Max retries exceeded with url: / (Caused by SSLError(SSLCertVerificationError(1, '[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1123)'))) while doing a GET request to URL: https://local.dev/
```

Błąd mówi nam, że nie udało się zweryfikować lokalnego wystawcy certyfikatu. Aby request z konsoli zadziałał musimy wskazać certyfikat organizacji weryfikującej jako argument flagi `--verify`.

```
http --verify /etc/nginx/ssl/myCA.pem https://local.dev
```

lub na `Mac OS`

```
http --verify /usr/local/etc/nginx/ssl/myCA.pem https://local.dev
```

![](https://ucarecdn.com/cc8230e1-7e35-4f2e-a9c9-9cd0c9d7c0b3/)

### Zastosowania lokalnego certyfikatu SSL

Pokazaliśmy jak skonfigurować połączenie po https na lokalnym komputerze, co jest szczególnie przydatne w developmencie aplikacji webowych. Zwykle można rozwijać swoje projekty lokalnie z użyciem `http`.

![](https://ucarecdn.com/a6538c2f-4169-43c1-85bb-ab1883ab4b05/)

Czasami `https` jest wymagany przez takie mechanizmy jak:

* ustawienia Secure lub SameSite dla Cookie
* ustawienia dostępu dla kamery lub mikrofonu w przeglądarce
* niektóre adresy webhooks zewnętrznych API

### Zalety i wady Caddy

Auth0 w swojej dokumentacji rekomenduje wykorzystanie programu `caddy`.

[HTTPS in Development

Securing local development servers to work with samesite cookies

![](https://cdn.auth0.com/website/new-homepage/dark-favicon.png)Auth0 DocsAuth0

![](https://cdn2.auth0.com/docs/media/social-media/fb-card.png)](https://auth0.com/docs/libraries/secure-local-development#how-to-set-up-a-secure-local-server)

Jego instalacja to

```
yay -S caddy
```

lub

```
brew install caddy
```

Wyłączymy teraz nasz serwer `nginx`.

```
sudo pkill nginx
```

uruchamiany `caddy` poleceniem

```
caddy reverse-proxy --from localhost:443 --to localhost:8000
```

I mamy następujący efekt:

1. Na chrome działa nam kłódka na stronie `https://localhost`

![](https://ucarecdn.com/975e97f2-7903-46e8-b69b-0fa9209c7699/)

2\. Na Firefox `https://localhost` nie działa

![](https://ucarecdn.com/e0abd4de-a853-465b-bda9-30ccae9ef5d4/)

3\. Z poziomu linii komend (httpie) też nie działa

![](https://ucarecdn.com/da304157-3ba2-45fa-8d0e-61352c24a8c5/)

4\. Z drugiej strony curl działa `curl [https://localhost](https://localhost)`.

Czyli "caddy" to metoda na bardzo szybkie konfigurowanie lokalnego ssl ale z ograniczeniami. Ich dokumentacja wygląda obiecująco, ale można się spodziewać, że napotykając na błędy będziemy mieli znacznie mniejsze szanse na support od community, niż w przypadku samodzielnej konfiguracji zgodnie z krokami przedstawionymi w tym wpisie. Jeśli zaczniemy od Caddy bez rozumienia jak skonfigurować ssl samodzielnie, to szansa, że spotkane błędy zatrzymają nas na długi czas znacznie wzrośnie.

[Getting Started - Caddy Documentation

Caddy is a powerful, enterprise-ready, open source web server with automatic HTTPS written in Go

![](https://caddyserver.com/resources/images/favicon.png)Caddy Web Server

![](https://caddyserver.com/resources/images/caddy-open-graph.jpg)](https://caddyserver.com/docs/getting-started)

#### Wartościowe linki pogłębiające temat SSL

Przygotowując ten wpis korzystałem z wielu zewnętrznych źródeł. Najbardziej wartościowe jakie znalazłem są podlinkowane poniżej.

[How to use a CA (like curl’s --cacert) with HTTPie

In curl I can connect with a private key, client cert, and a ca cert like this curl --cert cert.pem --key key.pem --cacert ca.pem https://example.org I can see the --cert and --cert-key options in

![](https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon.png?v&#x3D;c78bd457575a)Stack OverflowAhmadster

![](https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon@2.png?v&#x3D;73d79a89bded)](https://stackoverflow.com/questions/44443269/how-to-use-a-ca-like-curls-cacert-with-httpie/67326625#67326625)

[Setup (https) SSL on localhost for meteor development

How do you create a self signed SSL certificate to use on local server on mac 10.9? I require my localhost serving as https://localhost I am using the linkedin API. The feature which requires the...

![](https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon.png?v&#x3D;c78bd457575a)Stack OverflowmeteorBuzz

![](https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon@2.png?v&#x3D;73d79a89bded)](https://stackoverflow.com/a/35867609/6398044)

[error 18 at 0 depth lookup: self signed certificate

I was trying to test SSL connection between MySQL client and server. For that I created SSL certificate and keys by following the MySQL doc...

![](http://markstutpnt.blogspot.com/favicon.ico)BloggerAbhishek G

![](https://lh3.googleusercontent.com/ULB6iBuCeTVvSjjjU1A-O8e9ZpVba6uvyhtiWRti_rBAs9yMYOFBujxriJRZ-A&#x3D;w1200)](http://markstutpnt.blogspot.com/2019/01/error-18-at-0-depth-lookup-self-signed.html)
