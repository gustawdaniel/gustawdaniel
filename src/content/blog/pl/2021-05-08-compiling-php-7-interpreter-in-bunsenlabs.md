---
author: Daniel Gustaw
canonicalName: kompilacja-interpretera-php-7-w-bunsenlabs
date_updated: 2021-06-21 17:02:31+00:00
description: "Kompilacja to proces, który czasami wymaga instalacji paczek lub\
  \ linkowania zależności. W tym przypadku zadanie polegało na dostarczeniu\
  \ php7, na system na który nie miał go w dostępnych repozytoriach."
excerpt: "Kompilacja to proces, który czasami wymaga instalacji paczek lub linkowania\
  \ zależności. W tym przypadku zadanie polegało na dostarczeniu php7,\
  \ na system na który nie miał go w dostępnych repozytoriach."
publishDate: 2021-05-07 20:30:00+00:00
slug: pl/kompilacja-interpretera-php-7-w-bunsenlabs
tags:
- php
- compilation
- bunsenlabs
title: Kompilacja interpretera php 7 w BunsenLabs
---


## Instalacja Bunsenlabs

Zwykle używam Ubuntu, czasem Debiana. Jednak na jednym komputerze postawiłem dystrybucję [Bunsenlabs](https://www.bunsenlabs.org/index.html). Jest to notebook, którego kupiłem za 400 zł jako maszynę do pisania podczas podróży. Gnome3 jest dla niego za ciężki, a [Openbox](http://openbox.org/wiki/Main_Page) zainstalowany w Bunshenlabs wprost przeciwnie - daje mu nowe życie. Wygląda przy tym naprawdę dobrze:

![Bunshenlabs](https://www.bunsenlabs.org/img/frontpage-gallery/hydrogen2.jpg)

W tym artykule zainstalujemy `Bunsenlabs` na maszynie wirtualnej.

Zaczniemy od pobrania dystrybucji ze strony: [https://www.bunsenlabs.org/installation.html](https://www.bunsenlabs.org/installation.html)

[![instalacja](http://i.imgur.com/v4SafV3.png)](https://www.bunsenlabs.org/installation.html)

Wybieramy `bl-Hydrogen-amd64_20160710.iso` i pobieramy (najlepiej przez klienta sieci Torrent). Cały proces instalacji od włączenia `VirtualBoxa` do skonfigurowania środowiska przedstawiony jest na poniższym video.

Kluczowym momentem było pominięcie instalacji `LAPMA` kiedy zorientowałem się, że `php` występuje tam w wersji `5`. Żeby mieć wersję `7` będziemy go teraz kompilować.

## Połączenie do Virtualboxa przez SSH

Wyłączymy teraz maszynę wirtualną, żeby zmienić jej ustawienia sieciowe. Zaznaczamy naszą maszynę w panelu VirtualBoxa. Wybieramy ustawienia wciskając kombinację `ctr+s`. W zakładce `sieć` zmieniamy `NAT` na `Mostkowa karta sieciowa (bridget)`. Klikamy `Ok` i ponownie włączamy maszynę.

**Maszyna wirtualna:**

Instalujemy serwer `ssh` na maszynie wirtualnej

```
sudo apt-get install openssh-server
```

Żeby sprawdzić czy wszystko jest ok, wpisujemy

```
netstat -lnpt | grep 22
```

Żeby sprawdzić jakie `ip` dostaliśmy wpisujemy komendę:

```
ifconfig
```

Żeby umożliwić logowanie jako root przez ssh edytujemy plik z ustawieniami logowania

```
sudo nano /etc/ssh/sshd_config
```

Zmieniamy linię

```
PermitRootLogin without-password
```

na

```
PermitRootLogin yes
```

Restartujemy `ssh`

```
sudo /etc/init.d/ssh restart
```

I tworzymy katalog dla kluczy roota:

```
sudo mkdir -p /root/.ssh
```

Ustawiamy hasło roota

```
sudo su && passwd
```

**Maszyna lokalna**

Na naszym komputerze zapisujemy `ip` do zmiennych środowiskowych. Do `~/.bashrc` dodajemy linie które mogą wyglądać na przykład tak:

```
ip_hy="192.168.0.11"             # ip of hydrogen_x86_64
alias 'sh_hy'='ssh root@$ip_hy'  # ssh shortcut
```

resetujemy zmienne powłoki wpisując:

```
bash
```

Autoryzujemy dostęp z maszyny lokalnej do wirtualnej.

```
cat ~/.ssh/id_rsa.pub | sh_hy 'cat >> .ssh/authorized_keys'
```

Wpisujemy hasło roota na wirtualce i możemy już logować się do niej przez

```
sh_hy
```

Najważniejsze komendy zostały przedstawione na filmie zamieszczonym poniżej

## Kompilacja PHP

Interpreter [`php`](https://github.com/php/php-src) ma już ponad 100 000 commitów. Interesuje nas numer jego [ostatniego wydania](https://github.com/php/php-src/releases). W momencie, w którym to piszę jest to 7.0.14. Przechodzimy do katalogu `/usr/src` i pobieramy je:

```
git clone -b PHP-7.0.14 https://github.com/php/php-src --depth 1
```

Repozytorium pobrane w ten sposób waży 20.8 MB. Gdybyśmy nie wybrali wersji teraz, tylko zrobili `checkout` po pobraniu całości, kosztowało by to nas ponad 320 MB. Przechodzimy do katalogu `php-src`.

### Konfiguracja

Checmy wygenerować plik konfiguracyjny:

```
./buildconf --force
```

Mógł bym od razu podać skrypt, który instaluje wszystkie zależności. Jednak bardziej przydatne - szczególnie dla osób które napotkają podane tutaj błędy - uważam wypisanie tabelki z potencjalnymi błędami jakie mogą się pojawić przy tej komendzie. Skrypt z pełną kompilacją załączę na koniec

|Problem|Rozwiązanie|
|---|---|
|make: not found|apt-get install make|
|autoconf not found.|apt-get install autoconf|

Po świeżej instalacji `BunsenLabs` generacja pliku konfiguracyjnego poszła stosunkowo prosto. Wystarczyło doinstalować tylko dwie zależności. Ciekawiej było samym procesem konfiguracji:

```
./configure --prefix=/usr/local/php/7.0 \
    --with-config-file-path=/etc/php/7.0/apache2 \
    --with-config-file-scan-dir=/etc/php/7.0/apache2/conf.d \
    --enable-mbstring \
    --enable-zip \
    --enable-bcmath \
    --enable-pcntl \
    --enable-ftp \
    --enable-exif \
    --enable-calendar \
    --enable-sysvmsg \
    --enable-sysvsem \
    --enable-sysvshm \
    --enable-wddx \
    --enable-intl \
    --with-curl \
    --with-mcrypt \
    --with-iconv \
    --with-gmp \
    --with-pspell \
    --with-gd \
    --with-jpeg-dir=/usr \
    --with-png-dir=/usr \
    --with-zlib-dir=/usr \
    --with-xpm-dir=/usr \
    --with-freetype-dir=/usr \
    --enable-gd-native-ttf \
    --enable-gd-jis-conv \
    --with-openssl \
    --with-pdo-mysql=/usr \
    --with-gettext=/usr \
    --with-zlib=/usr \
    --with-bz2 \
    --with-recode=/usr \
    --with-apxs2=/usr/bin/apxs2 \
    --with-mysqli=/usr/bin/mysql_config \
    --with-ldap \
```

Tutaj doinstalowywałem albo linkowałem 19 dodatkowych paczek.

|Problem|Rozwiązanie|
|---|---|
|checking for gcc... no|apt-get install gcc|
|bison is required|apt-get install bison|
|/usr/bin/apxs: No such file|apt-get install apache2-dev|
|xml2-config not found|apt-get install libxml2-dev|
|Cannot find OpenSSL's <evp.h>|apt-get install libssl-dev|
|Cannot find OpenSSL's libraries|apt-get install pkg-config|
|Please reinstall the BZip2|apt-get install libbz2-dev|
|easy.h should be in `<curl-dir>`|apt-get install libcurl4-gnutls-dev|
|jpeglib.h not found.|apt-get install libjpeg-dev|
|png.h not found|apt-get install libpng-dev|
|xpm.h not found|apt-get install libxpm-devel|
|freetype-config not found|apt-get install libfreetype6-dev|
|Unable to locate gmp.h|apt-get install libgmp-dev \*1|
|Unable to detect ICU|apt-get install libicu-dev|
|Cannot find ldap|\*2|
|mcrypt.h not found|apt-get install libmcrypt-dev|
|mysql\_config not found|apt-get install mysql-server libmysqlclient-dev|
|Cannot find pspell|apt-get install libpspell-dev|
|Can not find recode.h|apt-get install librecode-dev|

Gwiazdki związane są z tym, że mimo, że pakiety są zainstalowane, instalator `php` ich nie wykrywa. W tym przypadku problem można rozwiązać dowiązując je symbolicznie do lokalizacji przeszukiwanych przez instalator.

```
ln -sf /usr/include/x86_64-linux-gnu/gmp.h /usr/include/gmp.h
ln -sf /usr/lib/x86_64-linux-gnu/liblber.so /usr/lib/liblber.so
```

### Kompilacja

Jeśli teraz wykonamy kompilacje, to mimo pozytywnie zakończonej konfiguracji wyrzuci ona następujący błąd

```
/usr/bin/ld: ext/ldap/.libs/ldap.o: undefined reference to symbol 'ber_scanf@@OPENLDAP_2.4_2'
/usr/lib/x86_64-linux-gnu/liblber-2.4.so.2: error adding symbols: DSO missing from command line
collect2: error: ld returned 1 exit status
Makefile:289: polecenia dla obiektu 'sapi/cli/php' nie powiodły się
make: *** [sapi/cli/php] Błąd 1
```

Problem ten rozwiązujemy doinstalowaniem `apache2`, ale, żeby przejść dalej wymagane jest ponowne wykonanie całej konfiguracji od początku. Przed samą kompilacją czyścimy wyniki wcześniejszych niepowodzeń.

```
sudo make clean
```

I zaprzęgamy do kompilacji tak wiele procesorów jak to tylko możliwe

```
sudo make -j `cat /proc/cpuinfo | grep processor | wc -l`
```

Dawno nie było obrazka więc oto screen z kompilacji:

![komplacja](http://i.imgur.com/5HPC4MC.png)

Ponieważ kompilowałem zalogowany przez `ssh` na wspomnianego laptopa, oraz maszynę wirtualną jednocześnie, mamy trzy htopy po prawej: pierwszy z 2 procesorami (notebook), środkowy z 1 procesorem (wirtualka), ostatni z 8 (maszyna lokalna na której piszę). Widać, jak mój główny komputer (trzeci htop) przerzuca sobie w tym momencie zadanie kompilacji wykonywane na maszynie wirtualnej między dwoma fizycznymi rdzeniami.

Jest to stosunkowo długi proces, może zająć kilka do kilkunastu minut w zależności od sprzętu. Jest to dobry moment, żeby się zrelaksować. Kompilacja kończy się wyświetlaniem komunikatu:

```
Build complete.
Don't forget to run 'make test'.
```

Testy trwają kilka minut, ale nie wpływają na końcowy wynik. Wszystkie źródła z których korzystałem pomijały ten krok. Niezależnie od tego czy przetestujesz swojego `php` czy nie następnym ważnym krokiem po kompilacji jest instalacja.

```
sudo make install
```

Żeby `php` trafił do odpowiednich lokalizacji wpisujemy:

```
sudo update-alternatives --install /usr/bin/php php /usr/local/php/7.0/bin/php 50 --slave /usr/share/man/man1/php.1.gz php.1.gz /usr/local/php/7.0/php/man/man1/php.1
```

Jeśli w tym momencie zapytamy system o wersję `php` dostaniemy

```
# php -v
PHP 7.0.14 (cli) (built: Dec 18 2016 21:56:13) ( NTS )
Copyright (c) 1997-2016 The PHP Group
Zend Engine v3.0.0, Copyright (c) 1998-2016 Zend Technologies
```

Jednak nie będzie on działał na stronach internetowych. Żeby to naprawić konfigurujemy mouły apache2.

### Podłączenie do Apache2

Zaczniemy od dodania pliku `/etc/apache2/mods-available/php7.conf` o treści:

```
<FilesMatch ".+\.ph(p[3457]?|t|tml)$">
    SetHandler application/x-httpd-php
</FilesMatch>
<FilesMatch ".+\.phps$">
    SetHandler application/x-httpd-php-source
    # Deny access to raw php sources by default
    # To re-enable it's recommended to enable access to the files
    # only in specific virtual host or directory
    Require all denied
</FilesMatch>
<FilesMatch "^\.ph(p[345]?|t|tml|ps)$">
    Require all denied
</FilesMatch>
```

a następnie powłączamy i powyłączamy odpowiednie moduły.

```
a2dismod mpm_event
a2enmod mpm_prefork
a2enmod php7
```

I restartujemy go:

```
service apache2 restart
```

Żeby sprawdzić, czy wszystko gra w katalogu `/var/www/html` zastępujemy plik `index.html` plikiem `index.php` o treści

```
5=<?php
echo 2+3;
```

Całość procesu kompilacji można obejrzeć na poniższym video:

### Gist ze skryptami

Żeby nie wykonywać wszystkich komend ręcznie załączam [gist](https://gist.github.com/gustawdaniel/79aae802d0c99ba3ef633efa441d5863) z skryptami. Mamy tam trzy pliki:

```
├── php7.conf
├── php_install.sh
└── send.sh
```

Jeśli chcemy startować z maszyny lokalnej, to ściągamy je lokalnie do tego samego folderu i edytujemy `send.sh` wpisując tam `ip` maszyny na której chcemy przeprowadzić instalację. Skrypt `send.sh` wysyła pliki `php7.conf` i `php_install.sh` na maszynę wirtualną do lokacji `/ust/src`. Możemy też ściągnąć `php7.conf` i `php_install.sh` do `/usr/src` maszyny wirtualnej od razu.

Tam wykonujemy `php_install.sh`, który doinstalowuje potrzebne paczki, ściąga źródła, przeprowadza konfiguracje i kompilację, instalację `php`, na koniec kopiuje `php7.conf` do katalogu z konfiguracją `apache` i konfiguruje go tak, aby poprawnie współpracował z `php`.

## Źródła:

Przy pisaniu tego wpisu skorzystałem z pomocy dziesiątek ludzi, którzy na swoich blogach, w różnych społecznościach Stacka, czy w dyskusjach na Githubie rozwiązywali problemy z kompilacją nie chcąc za to żadnego wynagrodzenia. Jestem im wszystkim ogromnie wdzięczny. Nie jestem w stanie wymienić ich wszystkich dlatego podam tylko kilka źródeł, które pomogły mi najbardziej:

* [Kompilacja PHP 7 Na Cent OS](http://www.shaunfreeman.name/compiling-php-7-on-centos/)
* [Kompilacja PHP 7 Na Ubuntu](https://gist.github.com/m1st0/1c41b8d0eb42169ce71a)
* [Logowanie jako root przez SSH](https://linuxconfig.org/enable-ssh-root-login-on-debian-linux-server)
* [Zapamiętanie hasła do SSH](http://www.linuxproblem.org/art_9.html)
* [Oficjalna lista zależności PHP](http://php.net/manual/en/install.unix.php)
* [Konfiguracja Apache przy kompilacji PHP](https://docs.moodle.org/32/en/Compiling_PHP_from_source)
* [AskUbuntu](http://askubuntu.com/questions/760907/upgrade-to-16-04-php7-not-working-in-browser)
