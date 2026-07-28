---
title: Cómo convertir grabaciones de OBS en MKV a MP4 listos para WhatsApp con FFmpeg
publishDate: 2026-07-28
---

Para convertir la última grabación de video de OBS a un formato totalmente compatible con WhatsApp, usa el siguiente comando `ffmpeg`:

```bash
ffmpeg -i "$(ls -t ~/obs/*.mkv | head -n 1)" \
  -c:v libx264 -pix_fmt yuv420p -profile:v main -level 4.0 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  whatsapp_ready.mp4
```

### Explicación de las opciones y por qué son necesarias

* `-i "$(ls -t ~/obs/*.mkv | head -n 1)"`
  Busca archivos `.mkv` en `~/obs`, los ordena por fecha de modificación (`ls -t`) y selecciona el más reciente (`head -n 1`). Pasa automáticamente la última grabación como entrada a `ffmpeg`.
* `-c:v libx264`
  Establece el códec de video en H.264 (AVC). Es el códec más aceptado por WhatsApp y los decodificadores por hardware en dispositivos móviles.
* `-pix_fmt yuv420p`
  Fuerza el formato de píxeles a YUV 4:2:0 (8 bits). Las grabaciones de OBS a menudo usan 4:4:4 o color de 10 bits (como `yuv420p10le`), lo que resulta en una pantalla negra o error en WhatsApp.
* `-profile:v main -level 4.0`
  Restringe el perfil de H.264 a `Main` y el nivel a `4.0`. Evita perfiles altos (como High 5.2) que la aplicación móvil de WhatsApp puede rechazar.
* `-c:a aac -b:a 128k`
  Codifica el audio a AAC con una tasa de bits de 128 kbps. Las pistas de audio predeterminadas en archivos MKV de OBS (como Opus o PCM) no se reproducen en los videos MP4 de WhatsApp.
* `-movflags +faststart`
  Mueve los metadatos del encabezado (el átomo `moov`) al principio del archivo. Esto permite que el video comience a reproducirse inmediatamente mientras se carga en el chat.
* `whatsapp_ready.mp4`
  Nombre del archivo de salida en formato MP4. Los archivos MKV de OBS no son compatibles de forma nativa con el reproductor de WhatsApp.
