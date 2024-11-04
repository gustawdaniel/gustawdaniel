---
author: Daniel Gustaw
canonicalName: git-styled-calendar-with-custom-dates
coverImage: http://localhost:8484/9f33d20f-8d16-4a99-82b4-180bd4877124.avif
description: kalendarz w stylu git utworzony z listy dat zapisanych w pliku csv
excerpt: kalendarz w stylu git utworzony z listy dat zapisanych w pliku csv
publishDate: 2021-04-20 19:28:40+00:00
slug: pl/git-stylowy-kalendarz-z-niestandardowymi-datami
tags:
- git
title: Kalendarz w stylu Git z niestandardowymi datami
updateDate: 2021-04-20 19:28:39+00:00
---

Załóżmy, że masz zbiór dat. Chcesz wyświetlić te daty w czytelny sposób.

Na przykład tak:

![](http://localhost:8484/121db3d7-7ea4-4dd3-a4bc-9f7195206354.avif)

Mam więc świetne informacje. To jedna linia kodu, może dwie...

### W tym artykule pokażę, jak wygenerować obrazek taki jak ten.

Czego potrzebujesz?

* jq - świetne narzędzie do przetwarzania json / tekstu
* node - interpreter js
* awk - przetwarzacz tekstu do selekcji danych

### Instalacja

```
npm i -g cli-gh-cal
```

### Przygotowanie pliku z datami

Chcemy przygotować plik z datami takimi jak te

```csv
2019-08-13
2018-05-19
2018-06-22
2019-04-16
```

Załóżmy, że musisz pokazać daty utworzenia plików w swoim folderze ze zdjęciami. Możesz to zrobić, używając polecenia

```bash
ls -l --time-style=long-iso . | awk '{print $6}' | sort > /tmp/dates.csv
```

Opcja `--time-style` pozwala na wyświetlanie dat w formacie łatwym do przetwarzania. Następnie `awk` wybiera kolumnę z datami, a posortowane daty są zapisywane w tymczasowym pliku `/tmp/dates.csv`.

### Wyświetlanie kalendarza w stylu git

Teraz, jeśli chcesz wyświetlić te daty, musisz wpisać

```bash
cli-gh-cal --data "$(jq -R '[inputs | [.,1] ]' < /tmp/dates.csv)"
```

W tym przypadku wykorzystujemy `jq` - potężny szablon do plików json. Umożliwia on zamianę listy dat na ciąg json wymagany przez `cli-gh-cal`. Po wykonaniu tego polecenia powinieneś zobaczyć obrazek podobny do przedstawionego na początku.

### Wymagane pakiety

Aby to działało, musisz zainstalować `node`. Zalecam zainstalowanie go za pomocą `nvm` na lokalnej maszynie.

> [https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04)

Następny pakiet - `cli-gh-cal` można zainstalować za pomocą `npm` - menedżera pakietów node.

> [https://github.com/IonicaBizau/cli-gh-cal](https://github.com/IonicaBizau/cli-gh-cal)

Na koniec potrzebujesz również `jq`.

> [https://stedolan.github.io/jq/download/](https://stedolan.github.io/jq/download/)

Mam nadzieję, że podoba Ci się ten artykuł. Dla mnie to doskonały przykład, jak mała ilość kodu jest potrzebna, aby osiągnąć świetne wyniki wizualizacji danych dzisiaj. Wow!

Zrzut ekranu z mojej konsoli

![](http://localhost:8484/24696782-aeaa-4c8d-985c-9fc092980381.avif)
