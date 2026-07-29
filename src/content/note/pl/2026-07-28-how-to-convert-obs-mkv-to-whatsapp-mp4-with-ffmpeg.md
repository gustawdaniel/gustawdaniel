---
title: Jak konwertować nagrania z OBS do MP4 dla WhatsApp za pomocą FFmpeg
publishDate: 2026-07-28
---

Aby przekonwertować najnowsze nagranie wideo z OBS do formatu kompatybilnego z WhatsApp, użyj poniższego polecenia `ffmpeg`:

```bash
ffmpeg -i "$(/usr/sbin/ls -t ~/obs/*.mkv | head -n 1)" \
  -c:v libx264 -pix_fmt yuv420p -profile:v main -level 4.0 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  whatsapp_ready.mp4
```

### Wyjaśnienie flag i dlaczego są potrzebne

* `-i "$(ls -t ~/obs/*.mkv | head -n 1)"`
  Wyszukuje pliki `.mkv` w katalogu `~/obs`, sortuje je od najnowszego (`ls -t`) i wybiera pierwszy z nich (`head -n 1`). Automatycznie przekazuje najświeższe nagranie jako wejście do `ffmpeg`.
* `-c:v libx264`
  Ustawia kodek wideo na H.264 (AVC). Jest to najbardziej uniwersalny kodek akceptowany przez silnik WhatsApp oraz dekodery sprzętowe na telefonach.
* `-pix_fmt yuv420p`
  Wymusza format pikseli YUV 4:2:0 (8-bit). Nagrania z OBS lub kart graficznych często mają format 4:4:4 lub 10-bit (np. `yuv420p10le`), co w WhatsApp objawia się czarnym ekranem lub błędem odtwarzania.
* `-profile:v main -level 4.0`
  Ustawia profil kompresji H.264 na `Main` z poziomem `4.0`. Zapobiega to stosowaniu zbyt wysokich profili (np. High 5.2), które mogą być odrzucone przez mobilną aplikację WhatsApp.
* `-c:a aac -b:a 128k`
  Koduje dźwięk do formatu AAC z bitrate 128 kbps. Domyślne ścieżki audio z OBS (np. Opus lub PCM) nie są odtwarzane w wideo przesyłanym przez WhatsApp.
* `-movflags +faststart`
  Przenosi metadane nagłówka pliku (atom `moov`) na początek strumienia. Dzięki temu film może zacząć się odtwarzać od razu w trakcie pobierania/wczytywania w oknie czatu.
* `whatsapp_ready.mp4`
  Nazwa pliku wyjściowego w formacie MP4. Kontener `.mkv` z OBS nie jest wspierany przez odtwarzacz WhatsApp.
