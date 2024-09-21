---
author: Daniel Gustaw
title: Publikacja aktualizacji paczki w repozytorium AUR
canonicalName: aktualizacja-paczki-aur
slug: pl/aktualizacja-paczki-aur
publishDate: 2022-01-29T20:34:39.000Z
date_updated: 2022-01-29T20:34:39.000Z
tags: ['arch', 'aur', 'linux']
description: Naucz się jak publikować aktualizację pakietów w repozytorium użytkowników Arch Linux.
excerpt: Naucz się jak publikować aktualizację pakietów w repozytorium użytkowników Arch Linux.
coverImage: http://localhost:8484/f3b21d8a-2483-40fe-8603-d39fb987ebf8.avif
---

Znalazłem w repozytorium aur paczkę, która nie jest regularnie aktualizowana. Nauczyłem się jak mogę ją utrzymywać i ten wpis pozwoli Ci przejść przez wszystkie kroki potrzebne do tego, żebyś sam mógł utrzymywać lub publikować pakiety w repozytorium użytkowników Arch Linux.

### Załóż konto w aur

Po założeniu konta na stronie

[AUR (en) - Home](https://aur.archlinux.org/)

przejdź do zakładki "moje konto" i uzupełnij "Klucz publiczny SSH"

![](http://localhost:8484/08559ea5-1a3c-40c5-96f0-d5e3b34148cf.avif)

### Pobierz paczkę, którą chcesz zaktualizować

W naszym przypadku aktualizujemy `infinitywallet`.

[AUR (en) - infinitywallet](https://aur.archlinux.org/packages/infinitywallet/)

Pobieramy repozytorium komendą

```
git clone ssh://aur@aur.archlinux.org/infinitywallet.git
```

Znajdują się w nim trzy pliki:

```
infinitywallet.install  - hooki zakładane na operacje dookoła instalacji
PKGBUILD                - konfiguracja źródeł instalcji
.SRCINFO                - metadane pakietu generowane atuomatycznie
```

### Zaktualizuj "source" w "PKGBUILD"

W pliku `PKGBUILD`

```
pkgname=infinitywallet
pkgver=1.2.1beta
pkgrel=10
pkgdesc="Digital asset wallet"
arch=('x86_64')
url="https://infinitywallet.io"
depends=('gtk3' 'libnotify' 'nss' 'libxss' 'libxtst' 'xdg-utils' 'at-spi2-core' 'util-linux-libs' 'libappindicator-gtk3' 'libsecret')
options=('!strip' '!emptydirs')
install=${pkgname}.install
source_x86_64=("https://github.com/InfinityWallet/Releases/releases/download/v1.2.1-beta/InfinityWallet_1.2.1-beta.deb")
sha512sums_x86_64=('f36da80cdc3d35bf6d83e573240f92ea115ab03fe7ec3b5acd699bce999df6d5e81a8ab1966ad8977773bbba2710e3fb6fba0229c3195262cd698e938fd864de')

package(){

	# Extract package data
	tar xf data.tar.xz -C "${pkgdir}"

	install -D -m644 "${pkgdir}/opt/InfinityWallet/resources/app.asar.unpacked/node_modules/phantomjs-prebuilt/LICENSE.txt" "${pkgdir}/usr/share/licenses/${pkgname}/LICENSE"

}
```

mamy informację o źródle. Jest to wersja z Ubuntu/Debiana o numerze 1.2.1.

Tym czasem pod linkiem z wydaniami z Githuba mamy wersję 1.4.0

[Releases · InfinityWallet/Releases](https://github.com/InfinityWallet/Releases/releases)

![](http://localhost:8484/03aa2c9c-5c02-48c1-b89a-5b6dc474378b.avif)

A wersję dla Debiana znajdziemy pod adresem

```
https://github.com/InfinityWallet/Releases/releases/download/v1.4.0-beta/InfinityWallet_1.4.0-beta.deb
```

Po ustawieniu tej wartości pod kluczem `source_x86_64` w `PKGBUILD` powinniśmy przeliczyć sumę kontrolną `sha512sums_x86_64`. Możemy użyć linii komend do pobrania paczki

```
wget https://github.com/InfinityWallet/Releases/releases/download/v1.4.0-beta/InfinityWallet_1.4.0-beta.deb -O /tmp/iw.deb
```

i wyliczenia sumy kontrolnej

```
sha512sum /tmp/iw.deb
```

wklejamy ją do pliku `PKGBUILD`.

Na końcu zmieniamy opis wersji w `pkgver` i podnosimy o jeden `pkgrel`.

### Generujemy `.SRCINFO`

Plik z metadanymi możemy przebudować komendą

```
makepkg --printsrcinfo > .SRCINFO
```

### Testujemy instalację paczki lokalnie

Możemy sprawdzić czy instalacja przebiega pomyślnie wpisując

```
makepkg -si
```

![](http://localhost:8484/edfefedf-af85-409b-9e6d-ff33fbeefd07.avif)

### Wysyłamy zmiany do repozytorium

Tworzymy nowy commit

```
 git commit -a -m "Release v1.4.0-beta"
```

i wysyłamy zmiany na głąź "master"

```
git push origin master
```

To wszystko. Nasza aktualizacja jest już publicznie dostępna.

---

## Kluczowe kroki w publikowaniu pakietu AUR:

* twój klucz publiczny ssh musi się zgadzać z tym w koncie aur
* repo ma mieć adres ssh://[aur@aur.archlinux.org](mailto:aur@aur.archlinux.org)/package.git
* musisz podbić zarówno opis jak i numer wersji
* programem sha512sum wyliczasz sumę kontrolną
* poza PKGBUILD jest jeszcze plik .SRCINFO tworzony przez `makepkg --printsrcinfo > .SRCINFO`
* lokalnie możesz przetestować instalację poleceniem `makepkg -si`
* na końcu wysyłasz zmiany na master

Jeśli ktoś z Was będzie wrzucał paczki na AUR i napotkacie jakieś problemy - piszcie, chętnie pomogę.
