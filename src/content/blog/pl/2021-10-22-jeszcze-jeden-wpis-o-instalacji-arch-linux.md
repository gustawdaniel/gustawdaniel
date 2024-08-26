---
author: Daniel Gustaw
canonicalName: jeszcze-jeden-wpis-o-instalacji-arch-linux
slug: pl/jeszcze-jeden-wpis-o-instalacji-arch-linux
publishDate: 2021-10-22T01:24:19.000Z
date_updated: 2021-10-30T12:31:37.000Z
tags: ['arch', 'linux']
description: Instalacja Arch Linux za każdym razem uczy mnie czegoś nowego na temat dysków, sieci, systemów operacyjnych. Polecam Ci ją jeśli chcesz mieć system skrojony pod Twoje wymagania.
excerpt: Instalacja Arch Linux za każdym razem uczy mnie czegoś nowego na temat dysków, sieci, systemów operacyjnych. Polecam Ci ją jeśli chcesz mieć system skrojony pod Twoje wymagania.
title: Jeszcze jedna instrukcja instalacji Arch Linux (i3)
coverImage: http://localhost:8484/665af0e9-93eb-47ce-b4d5-1d60c8d644ae.avif
---

Arch Linux jest systemem, który kocham za elastyczność i wygodę użytkowania. Jego instalacja uchodzi za jedną z trudniejszych, ponieważ przenosi na nas ciężar decydowania o wielu szczegółach, którymi nie przejmujemy się podczas codziennej pracy z komputerem.

Za przykład niech posłuży wybór klienta DHCP, dzięki któremu możemy dostać adres IP, maskę podsieci, adres bramy domyślnej i adresy serwerów DNS. Są dwa dostępne programy do obsługi protokołu DHCP. Od Ciebie zależy, który z nich zainstalujesz:

[Network configuration (Polski) - ArchWiki

![](https://wiki.archlinux.org/favicon.ico)ArchWiki

![](https://wiki.archlinux.org/images/3/38/Tango-view-fullscreen.png)](https://wiki.archlinux.org/title/Network_configuration_(Polski)#DHCP)

Tego typu decyzji podejmujemy przy instalacji arch linux więcej, dlatego najlepszym źródłem wiedzy będzie zawsze ArchWiki. Ten artykuł ma na celu pokazanie mojej instalacji, którą możesz powtórzyć w całości lub wybrać z niej wartościowe dla Ciebie elementy i wkomponować je we własną pasującą do Ciebie instalację.

Instalacja zostanie pokazana zarówno na komputerze z UEFI jak i BIOS.

Kolejno omówimy:

1. Podłączenie do sieci wifi
2. Instalację systemu
3. Instalację managera okien `i3-gaps`
4. Konfigurację `i3` i podstawowych programów

Rdzeń instalacji przedstawia poniższa grafika, ale niektóre komendy będą się u nas różnić.

![](http://localhost:8484/b49cea1e-c602-46e3-a908-0b3470ec06a0.avif)

## Przygotowanie bootowalnego pendrive

Obraz ISO Archa możemy pobrać z torrentów:

[Arch Linux - Downloads

![](https://archlinux.org/static/logos/apple-touch-icon-144x144.38cf584757c3.png)Downloads

![](https://archlinux.org/static/magnet.29ed728b8ae4.png)](https://archlinux.org/download/)

Jednak ponieważ płyty CD nie są już używane, domyślnym działaniem jest wgranie go na USB. Żeby to zrobić wkładamy pendrive do komputera i sprawdzamy jaką nazwę dostał jednym z poleceń `dmesg | grep Attached`, `df -h` lub `lsblk`.

![](http://localhost:8484/d4303721-d034-4dc5-9b98-2aa9ae5553b2.avif)

W naszym przypadku jest to `sde`. Odmontowujemy pendrive komedą:

```
sudo umount /dev/sde1
```

Po czym z katalogu zawierającego obraz `iso` wgrywamy go na pendrive.

```
sudo dd bs=8M if=arch.iso of=/dev/sde status=progress
```

Po włożeniu pendrive do docelowej maszyny i uruchomieniu zwykle należy użyć `F12` przy starcie, ale to zależy od modelu komputera i ustawień BIOS.

Jeśli się uda powinniśmy zobaczyć:

![](http://localhost:8484/049176bc-bcf4-4774-9275-0edd0d980b37.avif)

Po zatwierdzeniu przez `ENTER` trafimy do konsoli instalatora

## Podłączenie sieci wifi przez iwctl

Nawiązanie połączenia z internetem jest naszym pierwszym zadaniem.

Zaczniemy od listy dostępnych urządzeń, wpisujemy `iwctl` a następnie `device list`.

![](http://localhost:8484/553974c5-3944-43e7-9e25-0034204bae17.avif)

Lista sieci dostępna jest po wpisaniu `station wlan0 get-networks`

![](http://localhost:8484/c6e726d4-85d0-4e02-ba9c-a0d281641f5b.avif)

Podłączamy się do wybranej sieci poleceniem `station wlan0 connect TP-Link_CEC8` i podajemy hasło.

W przypadku bardzo starego laptopa Acer Aspire One - miałem błąd ze sterownikami wifi i musiałem podłączyć się przez ethernet.

[Arch Linux (dual boot with Win 10). Kernel panic - not syncing: Fatal exception in interrupt. Caps Lock indicator blinking until reboot

On my laptop I have Arch Linux and Windows 10 installed (BIOS MBR). When I’m using Arch occasional kernel panic occurs. This happens mostly when I install some packages using pacman.Last time I st...

![](https://cdn.sstatic.net/Sites/superuser/Img/apple-touch-icon.png?v&#x3D;0ad5b7a83e49)Super Userquantumleap

![](https://cdn.sstatic.net/Sites/superuser/Img/apple-touch-icon@2.png?v&#x3D;e869e4459439)](https://superuser.com/questions/1581961/arch-linux-dual-boot-with-win-10-kernel-panic-not-syncing-fatal-exception/1582265#1582265)

Aby wyłączyć `iwctl` wpisujemy `quit`.

Do sprawdzenia, czy mamy poprawnie nawiązane połączenie możemy użyć

```
ping -c 3 google.com
```

# Instalacja Arch

Instalujemy `reflector`

```
pacman -Sy reflector
```

Aktualizujemy listę repozytoriów

```
reflector -c "Poland" --latest 5 --sort rate --save /etc/pacman.d/mirrorlist
```

Jeśli twój internet jest wolny dodaj falgę `--download-timeout`, np.:

```
reflector -c "Poland" --latest 5 --sort rate --download-timeout 60 --save /etc/pacman.d/mirrorlist
```

[Reflector returns “failed to rate http(s) download: Download ......” ! / Newbie Corner / Arch Linux Forums

![](https://bbs.archlinux.org/style/ArchLinux/favicon.ico)

![](https://bbs.archlinux.org/img/smilies/big_smile.png)](https://bbs.archlinux.org/viewtopic.php?id&#x3D;262621)

Za pomocą `fdisk -l` lub `lsblk` wyświetlamy dostępne dyski

Jeśli zobaczymy błąd

```
GPT PMBR size mismatch will be corrected by w(rite)
```

naprawiamy go wpisując

```
parted -l
```

a następnie `fix`.

Partycje można poustawiać poleceniem

```
cfdisk /dev/sda
```

oczywiście adres dysku może u Ciebie być inny niż `/dev/sda`. Wybieramy typ `linux (x86)`.

Teraz musimy okreslicz czy instalujemy system bootawny z biosa czy przez uefi. Jesli nie wiemy sprawdzmy czy nasza plyta gowna obsluguje UEFI i jesli tak to lepiej wybrac uefi. Jesli masz nowy komputer mozesz pominac rozdzial "BIOS" i przejsc do "UEFI".

### BIOS

Na starszych komputerach użyjemy biosa. Programem `cfdisk` lub `fdisk` mozemy ustawic:

* bootowalna patrycje sda1 z typem 83 Linux
* nie bootowalna partycje sda2 z typem 82 Linux Swap

![](http://localhost:8484/88eda6fa-37ae-43a2-b5ce-9ea43ef00fcd.avif)

Fortsmtujemy utworzona partycje

```
mkfs.ext4 /dev/sda1
```

Montujemy gotowa partycje do `/mnt`

```
mount /dev/sda1 /mnt
```

Możemy teraz pominąć fragment "UEFI" i przejść do "Pacstrap"

### UEFI

W przypadku UEFI musimy przygotować tabelę GPT. Możesz użyć do tego bardziej przyjazdnego programu `cfdisk`, lub bardziej zaawansowanego `fdisk`. Poniżej pokazuję to w `fdisk`.

```
fdisk /dev/sda
```

wybieramy opcję `g`

Tworzymy partycję `uefi` wybierając kolejno `n` (nowa), `ENTER` (nie zmieniamy punku pierwszego sektora), `+200M` (ustawiamy ostatni sektor na `+ 200 MB`.

Ustawiamy typ na `EFI System` przez `t` (jak type), `1` (numer typu `EFI System`).

Tworzymy drugą partycję `n` (new), `ENTER` (domyślny numer 2), `ENTER` (domyślny początkowy blok), `ENTER` (domyślny końcowy blok).

Zapisujemy zmiany wybierając `w`.

Formatowanie partycji UEFI na `fat 32`

```
mkfs.fat -F32 /dev/sda1
```

Formatowanie na system plików drugiej partycji na `ext4`:

```
mkfs.ext4 /dev/sda2
```

Montujemy partycję na system do katalogu `/mnt`.

```
mount /dev/sda2 /mnt
```

A partycję na uefi do `/mnt/boot`, najpierw musimy utworzyć ten katalog

```
mkdir /mnt/boot
```

i teraz zamontować

```
mount /dev/sda1 /mnt/boot
```

Dzięki poleceniu `slblk` możemy sprawdzić, czy montowanie jest poprawne.

### Pacstrap

I instalujemy system poleceniem `pacstrap`

```
pacstrap /mnt base linux linux-firmware nano
```

Generujemy plik `fstab`.

```
genfstab -U /mnt >> /mnt/etc/fstab
```

Wchodzimy do zainstalowanego systemu

```
arch-chroot /mnt /bin/bash
```

### Swapfile

Przygotowujemy swap:

```
fallocate -l 2GB /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

Do `/etc/fstab` dodajemy

```
/swapfile none swap defaults 0 0
```

### Strefa czasowa

Ustawiamy strefę czasową

```
ln -sf /usr/share/zoneinfo/Europe/Warsaw /etc/localtime
```

Generujemy `adjtime` żeby zsynchronizować zegar systemowy ze sprzętowym

```
hwclock --systohc
```

### Język

Ustawimy lokalizację kasując komentarz jednej z linii pliku `locale.gen`

```
nano /etc/locale.gen
```

Generujemy obsługę języków

```
locale-gen
```

W pliku `/etc/locale.conf` wpisujemy `LANG=pl_PL.UTF-8`

```
echo LANG=pl_PL.UTF-8 > /etc/locale.conf
```

A w `/etc/vconsole.conf`

```
KEYMAP=pl
FONT=Lat2-Terminus16
FONT_MAP=8859-2
```

### Sieć

W `/etc/hostname` ustawiamy nazwę hosta. Jest to nazwa naszego komputera - przydatna jeśli mamy kilka urządzeń w sieci lokalnej.

W `/etc/hosts` dodajemy linie

```
127.0.0.1    localhost.localdomain    preciselab
```

trzecia kolumna zawiera nazwę hosta wybrana poprzednio.

Instalujemy `networkmanager`.

```
pacman -S networkmanager dhcpcd
```

Włączamy usługę `NetworkManager`

```
systemctl enable NetworkMananger
```

### Przydatne paczki

Jest to indywidualna decyzja, jakie jeszcze inne pakiety powinien zawierać system. Wymienię i opiszę kilka polecanych przeze mnie.

* network-manager-applet - frontend do zarządzania połączeniami z siecią
* wireless\_tools - otwarty projekt sponsorowany przez HP - zawiera narzędzia takie jak iwconfig iwlist iwspy wipriv oraz ifrename do obsługi sieci wifi
* wpa\_supplicant - wsparcie dla szyfrowanych wifi WEP, WPA, WPA2 and WPA3 - dzisiaj niezbędny
* dialog - paczka do wyświetlania okien dialogowych ze skryptów w bashu, wymagana do używania wifi-menu
* netctl - konsolowe narzędzie do zarządzania sieciami ( zawiera wifi-menu )
* os-prober - narzędzie do wykrywania innych systemów operacyjnych i urządzeń, przydatne jeśli grub ich nie widzi
* base-devel - zestaw paczek do kompilacji, obróbki tekstu i kompresji
* linux-headers - skrypty do budowania modułów jadra systemowego
* reflector - skrypt do automatyzacji wyboru serwerów lustrzanych
* git - system kontroli wersji używany do programowania i instalacji pakietów
* cups - rozwijany przez Apple system do obsługi drukarek
* xdg-utils - narzędzia pomocnicze dla aplikacji XDG MIME
* xdg-user-dirs - narzędzie do integracji katalogu użytkownika z innymi programami, w szczególności przydatne dla managerów plików
* openssh - oprogramowanie do połączenia się przez ssh
* iwd - narzędzie do łączenia się z siecią np przez iwctl

Możemy je zainstalować poleceniem:

```
pacman -S network-manager-applet wireless_tools wpa_supplicant dialog netctl os-prober base-devel linux-headers reflector git cups xdg-utils xdg-user-dirs openssh iwd
```

Jeśli chcesz używać bluetooth to przydadzą Ci się jeszcze `bluez bluez-utils`.

Teraz zainstalujemy bootloader, żeby system mógł poprawnie wystartować. W zależności od tego czy wybrałeś opcje BIOS czy UEFI przejdź do odpowiedniego rozdziału.

### Boot loader w BIOS

Instalujemy bootloader

```
pacman -S grub
```

używamy komendy `grub-install`

```
grub-install /dev/sda
```

i tworzymy plik konfiguracyjny gruba

```
grub-mkconfig -o /boot/grub/grub.cfg
```

### Boot loader w UEFI

Instalujemy bootloader

```
pacman -S grub efibootmgr
```

używamy komendy `grub-install`

```
grub-install --target=x86_64-efi --efi-direcotry=/boot --bootloader-id=GRUB
```

w przypadku błędu

> this GPT partition label contains no BIOS Boot Partition

naprawiamy poleceniem

```
parted /dev/sda
set 1 boot off
set 1 bios_grub on
q
```

[grub2-install: “this GPT partition label contains no BIOS Boot Partition”

There seems to be quite a bit of discussion about this but I can’t find a simple answer. When I try to install grub2 I get this error: # grub2-install /dev/sdaInstalling for i386-pc platform.gr...

![](https://cdn.sstatic.net/Sites/superuser/Img/apple-touch-icon.png?v&#x3D;0ad5b7a83e49)Super UserRobert S

![](https://cdn.sstatic.net/Sites/superuser/Img/apple-touch-icon@2.png?v&#x3D;e869e4459439)](https://superuser.com/a/1610045/1216455)

W przypadku błędu

> "EFI variables are not supported on this system"

wychodzimy z `chroot` przez `exit` i wpisujemy

```
modprobe efivars
```

[“EFI variables are not supported on this system”

I am attempting to install Arch linux to a new (and very crappy) HP Pavillion 15 Notebook. This is a UEFI-based machine. After several swings at it, I have managed to get pretty far. Legacy mode...

![](https://cdn.sstatic.net/Sites/unix/Img/apple-touch-icon.png?v&#x3D;5cf7fe716a89)Unix & Linux Stack ExchangeJohn Dibling

![](https://cdn.sstatic.net/Sites/unix/Img/apple-touch-icon@2.png?v&#x3D;32fb07f7ce26)](https://unix.stackexchange.com/a/91623/431667)

Jeśli zobaczymy błąd

> Module efivars not found in directory /lib/modules/5.10.3-arch1-1

musimy włączyć komputer ponownie w trybie efi. Jest tak dlatego, że cześć maszyn może wybierać czy włącza się w trybie bios czy efi.

Dokumentacja mówi, że możemy sprawdzić czy to działa wpisując:

```
efivar-tester
```

ale nie polecam tej metody, u mnie zapętla się w nieskończoność i nie da się tego wyłączyć inaczej niż sprzętowo wyłączając komputer.

Tworzymy plik konfiguracyjny dla gruba

```
grub-mkconfig -o /boot/grub/grub.cfg
```

### Użytkownicy

Aby na co dzień moc poslugiwac sie systemem bez uprawnień roota a jednocześnie móc szybko nabywać, zainstalujemy sudo

```
pacman -S sudo
```

Ustawiamy hasło dla `root`

```
passwd root
```

Dodajemy użytkownika do codziennego użytku

```
useradd -m -g users -G wheel -s /bin/bash daniel
```

Dajemy mu hasło

```
passwd daniel
```

Grupie `wheel` pozwalamy na używanie `sudo`.

```
EDITOR=nano visudo
```

kasujemy komentarz przed linią

```
%wheel ALL=(ALL) ALL
```

Wychodzimy z instalatora

```
exit
```

Odmontowujemy partycję

```
umount /mnt
```

Wyłączamy komputer

```
shutdown -P now
```

### Problemy sieciowe

Jeśli po wpisaniu

```
ip addr
```

interfejsy są wyłączone to można je włączyć przez

```
ip link set dev <interface> up
```

Do sprawdzenia, które interfejsy warto włączyć przydatne może być `nmcli`.

Jeśli nie możesz włączyć interfejsu, ale znasz nazwę i hasło sieci możesz spróbować bezpośredniego połączenia podążając za zaleceniami z linku:

[how do I attach devices to connections using nmcli?

An installation of CentOS 7 has two connections and three devices. How can I attach the device ens7 to the connection my-bridge? And how can I attach the device eth0 to the connection my-eth1? ...

![](https://cdn.sstatic.net/Sites/unix/Img/apple-touch-icon.png?v&#x3D;5cf7fe716a89)Unix & Linux Stack ExchangeCodeMed

![](https://cdn.sstatic.net/Sites/unix/Img/apple-touch-icon@2.png?v&#x3D;32fb07f7ce26)](https://unix.stackexchange.com/a/613819/431667)

nie mam pojęcia dlaczego to działa.

Jeśli tłumaczenie nazw domen na adresy ip, nie działa poprawnie musimy wybrać domyślny DNS. Ustawiamy to w

```
/etc/resolv.conf
```

wpisując

```
nameserver 8.8.8.8
```

Stan serwisu odpowiadającego za nadawanie domenom numerów ip sprawdzimy poleceniem

```
systemctl status systemd-resolved.service
```

### Błędy z kluczami

Jeśli mamy błędy typu

> Signature is unknown trust

Możemy sprawdzić dany klucz

```
pacman-key -l Thorsten
```

i jeśli wygasł, to odświeżyć listę kluczy

```
pacman-key --refresh-keys
```

[Signature is unknown trust \[SOLVED\] / Pacman & Package Upgrade Issues / Arch Linux Forums

![](https://bbs.archlinux.org/style/ArchLinux/favicon.ico)

![](https://bbs.archlinux.org/img/avatars/27289.jpg?m&#x3D;1572193439)](https://bbs.archlinux.org/viewtopic.php?id&#x3D;207957)

### Instalacja yay

Yay jest pomocniczym programem do zarządzania zależnościami. Jeśli zainstalowałeś `base-devel` możesz pobrać yay za pomocą gita

```
git clone https://aur.archlinux.org/yay.git
```

i zainstalować poleceniami

```
cd yay && makepkg -si
```

[Arch Linux How to Install Yay - Super EASY | Low Orbit Flux

Arch Linux How to Install Yay - Super EASY | Low Orbit Flux

![](https://low-orbit.net/favicon.png)Low Orbit Flux

![](https://low-orbit.net/low-orbit-logo-2-d.png)](https://low-orbit.net/arch-linux-how-to-install-yay)

# Instalacja I3

Sam manager okien instaluje się poleceniem

```
yay -S i3-gaps
```

Należy do niego dodać czcionkę i pasek

```
yay -S ttf-dejavu i3status
```

Instalujemy `xorg`.

```
yay -S xorg xorg-xinit rxvt-unicode
```

Oraz sterowniki do swojej karty. Typ karty możesz sprawdzić poleceniem `lspci | grep VGA`.

Dla karty `AMD/ATI RV370 [Radeon X300]` jest to

```
yay -S xf86-video-ati
```

Dla `nvidia` będą to:

```
yay -S nvidia nvidia-utils
```

Dla `Atom Processor Integrated Graphics Controller` jest to

```
yay -S xf86-video-intel
```

Jeśli nie wiesz jaką paczkę zainstalować dla swojej karty polecam poszukać na stronie:

[Xorg - ArchWiki

![](https://wiki.archlinux.org/favicon.ico)ArchWiki

![](https://wiki.archlinux.org/images/d/d6/Tango-inaccurate.png)](https://wiki.archlinux.org/title/xorg)

Aby obsługiwać dźwięk dodajemy też `alsa-utils`, `pulseaudio` i `pavucontrol`

```
yay -S alsa-utils pulseaudio pavucontrol
speaker-test -c2
alsamixer
```

Edytujemy plik

```
nano /etc/X11/xinit/xinitrc
```

komentując linie

```
#twm &
#exec xterm ....
```

i dodając na końcu

```
exec i3
```

teraz możemy włączyć tryb graficzny wpisując

```
startx
```

[Arch Linux How to Install i3 Gaps - Super EASY | Low Orbit Flux

Arch Linux How to Install i3 Gaps - Super EASY | Low Orbit Flux

![](https://low-orbit.net/favicon.png)Low Orbit Flux

![](https://low-orbit.net/low-orbit-logo-2-d.png)](https://low-orbit.net/arch-linux-how-to-install-i3-gaps)

Potwierdzamy wygenerowanie konfiguracji przez `ENTER` oraz potwierdzamy klawisz `win` jako główny klawisz.

## Konfiguracja I3 i rxvt-unicode

Wartościowe wprowadzenie do `i3` nagrał `Distroverse`:

Wzorowałem się na nim tworząc swoją konfigurację. Znajdziesz ją w repozytorium

[my-arch-i3-config/config at main · gustawdaniel/my-arch-i3-config

Contribute to gustawdaniel/my-arch-i3-config development by creating an account on GitHub.

![](https://github.githubassets.com/favicons/favicon.svg)GitHubgustawdaniel

![](https://opengraph.githubassets.com/c7e9ab912b1bb2522df5792cd3bf38216fc9c7e33d89de79f8f0dd67df2a6c22/gustawdaniel/my-arch-i3-config)](https://github.com/gustawdaniel/my-arch-i3-config/blob/main/.config/i3/config)

ale polecam Ci przejrzeć kilka różnych konfiguracji i poczytać dokumentację i3, która jest jedną z lepszych dokumentacji managerów okien.

Tym czasem zajmiemy się samym terminalem `urxt-unicode`. Polecam Ci to video

Przechodzimy do katalogu domowego

```
cd ~
```

Tworzymy konfigurację

```
touch .Xresources
```

możemy wkleić do tego pliku jedną z gotowych konfiguracji

```
curl https://raw.githubusercontent.com/gustawdaniel/my-arch-i3-config/main/.Xresources > .Xresources
```

lecz ja polecam poczytać kilka różnych zestawień lub obejrzeć filmy wyjaśniające dokładnie możliwe opcje i dobrać z nich te, które są najlepsze dla nas.

Do przeładowania konfiguracji służy komenda

```
xrdb ~/.Xresources
```

### Przeglądarka

Instalujemy przeglądarkę, której wybór ponownie jest Twoim wyborem. W przypadku najpopularniejszej przeglądarki - google chrome jest to:

```
yay -S google-chrome
```

Pierwszy dodatkiem jest `Ublock Origin`.

### Polski układ klawiatury w X11

Aby używać polskich znaków w środowisku graficznym ustaw layout klawiatury wstawiając do pliku `/usr/share/X11/xorg.conf.d/10-keyboard.conf` konfigurację

```
Section "InputClass"
    Identifier "system-keyboard"
    MatchIsKeyboard "on"
    Option "XkbLayout" "pl"
EndSection
```

### Launcher

Najprostszy launcher to `dmenu`. Instalujemy go komendą

```
yay -S dmenu
```

i używamy przez kombinację klawiszy `super+d`

### Screenshoty

Według mnie najlepszy jest `flameshot`. Instalujemy go komendą

```
yay -S flameshot
```

W konfiguracji `i3` możemy połączyć go z przyciskiem `print screen`

```
bindsym Print exec flameshot gui
```

### Sterowanie innymi komputerami

Jeśli używamy kilku komputerów i chcemy sterować nimi używając jednej myszki i klawiatury na wszystkich komputerach możemy zainstalować `barrier`.

```
yay -S barrier
```

Na urządzeniu klienckim ustawiamy id serwera:

![](http://localhost:8484/7e58151b-96fb-4217-b7f7-49a5552900a8.avif)

A na serwerze:

![](http://localhost:8484/254f446b-c536-4626-ad8e-9461988b6c96.avif)

Wskazujemy gdzie względem naszego komputera ustawi się klient

![](http://localhost:8484/270694f4-09f0-4dfd-af1c-6d7332690f0a.avif)

W przypadku problemów z zestawieniem połączenia zawsze pomagało wyłączenie i włączeniu obu komputerów.

### Oh my zsh

Zsh jest powłoką alternatywną do `bash` o więszych możliwościach customizacji i rozszerzania. Instalujemy ją poleceniem:

```
yay -S zsh
```

Następnie instalujemy `oh my zsh`.

```
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

### Tapeta

Zaczniemy od sprawdzenia rozdzielczości monitorów poleceniem

```
 xrandr --listmonitors
```

Pobieramy tapetę w odpowiednim rozmiarze i zapisujemy ją do pliku

```
.config/i3/.bg.jpeg
```

Instalujemy `feh` komendą

```
yay -S feh
```

Do pliku `.fehbg` zapisujemy skrypt ustawiający tapetę

```
#!/bin/sh
feh --no-fehbg --bg-scale '/home/daniel/.config/i3/.bg.jpeg'
```

Dajemy mu prawa do uruchamiania

```
sudo chmod +x ~/.fehbg
```

w `.config/i3/config` włączamy go poleceniem

```
exec --no-startup-id sh ~/.fehbg
```

### Neovim

Odrobinkę wygodniejsza wersja `vim`.

```
yay -S neovim
```

### Synchronizacja zegara systemowego

Jeśli w dacie lub godzinie pojawia się rozbieżność warto włączyć synchronizację z serwerami wskazującymi poprawny czas.

```
sudo timedatectl set-ntp true
```

### Monitoring zasobów

Do sprawdzania użycia i temperatury procesora, zajętej pamięci operacyjnej, transferu sieci - czyli ogólnego monitoringu polecam `bashtop`.

```
yay -S bashtop
```

![](http://localhost:8484/87e08fbb-de98-4348-9169-9543d9a8aab4.avif)

### Display Manager

Program w którym wybieram typ sesji oraz podaję login i hasło to `ly`.

```
yay -S ly
sudo systemctl enable ly.service
```

![](http://localhost:8484/9be76f2f-1843-4219-990f-9d5c1b422fd1.avif)

### Tmux i Tmuxinator

Do zarządzania sesjami, oknami i podziałem okien w terminalu używam tmuxa.

```
yay -S tmux ruby
gem install tmuxinator
```

Jego konfiguracja:

[my-arch-i3-config/.tmux.conf at main · gustawdaniel/my-arch-i3-config

Contribute to gustawdaniel/my-arch-i3-config development by creating an account on GitHub.

![](https://github.githubassets.com/favicons/favicon.svg)GitHubgustawdaniel

![](https://opengraph.githubassets.com/329bf602abfbb3c32fc70733557d3fb9f40c7171acdb51064027ff062f032e06/gustawdaniel/my-arch-i3-config)](https://github.com/gustawdaniel/my-arch-i3-config/blob/main/.tmux.conf)

![](http://localhost:8484/8f6de7c2-8c6f-458c-8c65-43ff23ca8d7e.avif)

### Bitwarden

Do zarządzania hasłami używałem keeweb. Obecnie korzystam z bitwarden:

```
yay -S bitwardern
```

za zarządzanie jego widocznością odpowiada następująca konfiguracja w pliku `~/.config/i3/config`:

```
exec --no-startup-id bitwarden
bindsym $Mod+k [instance="bitwarden"] scratchpad show; [instance="bitwarden"] move position center
for_window [instance="bitwarden"] move scratchpad
for_window [instance="bitwarden"] border pixel 3
for_window [instance="bitwarden"] resize set 800 600
```

![](http://localhost:8484/4d133afa-efe5-4cf9-acaa-72970b4f0ac5.avif)

## Nasz Arch Linux z i3 jest gotowy

Wciąż do efektywnej pracy może brakować nam `IDE` jeśli jesteśmy programistami lub `obs` jeśli nagrywamy video albo programów do obróbki grafiki. Jednak sam system i podstawowe programy możemy uznać za gotowe.

Jeśli twoim zdaniem w zestawieniu zabrakło jakichś programów, albo widzisz miejsca gdzie mógł być coś uprościć daj znać w komentarzu.

![](http://localhost:8484/f28189da-1303-474d-a73f-0eaa5eae884b.avif)
