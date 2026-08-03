---
title: Transkrypcja nagrań z telefonu
publishDate: 2026-08-02
---

Nagraliśmy na telefonie plik z rozmową i chcemy wyciągnać z niego tekst.

Pierwszym krokiem jest przeniesienie pliku na komputer.

Podłączamy telefon kablem i wpisujemy

```
adb devices
```

Jeśli zobaczymy nasz telefon, to

```
adb shell
```

komendami `ls` oraz `cd` lokalizujemy folder w którym zapisywany jest plik. Zwykle jest to folder `/sdcard/Records`.

Pobieramy plik z telefonu na dysk komputera.


```bash
adb pull /sdcard/Records/rec.m4a .
```

Żeby go odsłuchać na komputerze potrzebujemy `mpv`

```
mpv rec.m4a
```

Kolejnym krokiem jest transkrypcja. Instalujemy `whisper` przez

```
paru -S python-openai-whisper
```

i uruchamiamy:


```
whisper rec.m4a
```

Uzyskamy wtedy plik z transkrypcją.