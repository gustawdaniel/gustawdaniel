---
author: Daniel Gustaw
canonicalName: kompilacja-interpretera-php-7-w-bunsenlabs
coverImage: https://ucarecdn.com/7befcf74-cca9-4f73-b2fb-92961cbcefbd/
date_updated: 2021-06-21 17:02:31+00:00
description: Kompilacja to proces, który czasami wymaga instalacji paczek lub linkowania
  zależności. W tym przypadku zadanie polegało na dostarczeniu php7, na system na
  który nie miał go w dostępnych repozytoriach.
excerpt: Kompilacja to proces, który czasami wymaga instalacji paczek lub linkowania
  zależności. W tym przypadku zadanie polegało na dostarczeniu php7, na system na
  który nie miał go w dostępnych repozytoriach.
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
|