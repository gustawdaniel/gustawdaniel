---
author: Daniel Gustaw
canonicalName: how-to-install-yay-on-a-pure-arch-linux-docker-image
coverImage: http://localhost:8484/dfb43cd8-1f8f-4a2d-96f9-a9221028eca1.avif
description: Instalacja yay wymaga kilku kroków, takich jak tworzenie użytkownika, instalacja base-devel i git, zmiana w /etc/sudoers, klonowanie repozytorium yay i uruchomienie makepkg na nim. Ten post opisuje ten proces krok po kroku.
excerpt: Instalacja yay wymaga kilku kroków, takich jak tworzenie użytkownika, instalacja base-devel i git, zmiana w /etc/sudoers, klonowanie repozytorium yay i uruchomienie makepkg na nim. Ten post opisuje ten proces krok po kroku.
publishDate: 2023-03-20 06:03:00+00:00
slug: pl/jak-zainstalowac-yay-na-pure-archlinux-image
tags:
- linux
- arch
- docker
- yay
title: Jak zainstalować Yay na czystym obrazie Dockera Arch Linux
updateDate: 2023-03-20 06:03:00+00:00
---

W tym artykule przeprowadzimy Cię przez proces instalacji pomocnika AUR `yay` na czystym obrazie Dockera Arch Linux. Yay to popularne, przyjazne dla użytkownika narzędzie do zarządzania pakietami z Arch User Repository (AUR). Instalacja `yay` na obrazie Dockera Arch Linux może pomóc w uproszczeniu zarządzania pakietami i utrzymaniu aplikacji w kontenerach na bieżąco.

![](http://localhost:8484/6e96a98f-6c66-4687-9621-b29431e820b5.avif)

## Przygotowanie obrazu Docker Arch Linux

Najpierw uruchom nowy kontener Docker Arch Linux, wykonując następujące polecenie:

```bash
docker run --rm -it archlinux
```

To polecenie pobierze najnowszy obraz Arch Linux (jeśli jeszcze go nie masz) i rozpocznie interaktywną sesję kontenera.

## Aktualizacja systemu i instalacja zależności

Przed instalacją `yay` upewnij się, że twój kontener Arch Linux jest aktualny i ma zainstalowane wymagane zależności. Zaktualizuj system i zainstaluj `base-devel` oraz `git` za pomocą następującego polecenia:

```bash
pacman -Syu --noconfirm && pacman -S --noconfirm base-devel git
```

`base-devel` zawiera niezbędne narzędzia do budowania pakietów, podczas gdy `git` pozwala na sklonowanie repozytorium `yay`.

## Tworzenie Tymczasowego Katalogu Budowy

Aby zbudować i zainstalować `yay`, potrzebujesz tymczasowego katalogu. Stwórz katalog o nazwie `/tmp/yay-build` i zmień jego właściciela na nowego użytkownika `builder` za pomocą tych poleceń:

```bash
mkdir -p /tmp/yay-build
useradd -m -G wheel builder && passwd -d builder
chown -R builder:builder /tmp/yay-build
```

## Przyznawanie uprawnień Sudo

Pozwól użytkownikowi `builder` używać `sudo` bez hasła, dodając wpis w pliku `/etc/sudoers`:

```bash
echo 'builder ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers
```

## Klonowanie repozytorium Yay

Jako użytkownik `builder` sklonuj repozytorium `yay` do katalogu `/tmp/yay-build`:

```bash
su - builder -c "git clone https://aur.archlinux.org/yay.git /tmp/yay-build/yay"
```

## Budowanie i instalowanie Yay

Teraz zbuduj i zainstaluj `yay` używając polecenia `makepkg`:

```bash
su - builder -c "cd /tmp/yay-build/yay && makepkg -si --noconfirm"
```

To polecenie zbuduje i zainstaluje `yay` bez pytania o potwierdzenie.

## Porządkowanie

Po pomyślnym zainstalowaniu `yay` usuń tymczasowy katalog budowania:

```bash
rm -rf /tmp/yay-build
```

Pomyślnie zainstalowałeś `yay` na czystym obrazie Dockera Arch Linux. Po zainstalowaniu `yay` możesz teraz łatwo zarządzać pakietami AUR w swoim kontenerze Arch Linux. Może to być szczególnie przydatne dla programistów i administratorów systemów, którzy używają Arch Linux i Dockera do swoich aplikacji i usług.

## Sprawdźmy, czy działa na przykładzie gpt-cli

Przełączymy się na użytkownika `builder`

```bash
su - builder
```

i zainstaluj pierwszą paczkę. Na przykład

```bash
yay -S gpt-cli
```

![](http://localhost:8484/43be4bb9-02a5-4b86-b987-72fcd9f4c485.avif)

Pozwala to na rekomendowanie ci poleceń linuxowych za pomocą API `openai` z modelem `gpt-3.5-turbo`. Możesz to przetestować, wpisując:

```bash
GPT3_API_KEY="sk-xxx" p perl onliner that will show first 10 fibonacci sequence elements
```

zobaczysz informacje, że skrypt przedstawiony poniżej został skopiowany do twojego schowka

```bash
perl -e 'sub f{ $_[0] < 2 ? $_[0] : f($_[0]-1) + f($_[0]-2) }; foreach(0..9){ print f($_), "\n"; }'
```

![](http://localhost:8484/8743f013-5a07-42fc-bde9-43ec61fad1d2.avif)

Możesz przeczytać pełną dokumentację `gpt-cli` na githubie.

[GitHub - gustawdaniel/gpt-cli: Uruchamiaj polecenia linuxowe w języku naturalnym. Np.: „pokaż moją kartę graficzną” zamiast „lspci | grep VGA”](https://github.com/gustawdaniel/gpt-cli)

Mam nadzieję, że ten wpis na blogu pomoże ci w zainstalowaniu yay na obrazie dockera arch.
