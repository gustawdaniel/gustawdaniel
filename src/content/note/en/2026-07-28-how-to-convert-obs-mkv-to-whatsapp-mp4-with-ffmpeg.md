---
title: How to convert OBS MKV recordings to MP4 ready for WhatsApp with FFmpeg
publishDate: 2026-07-28
---

To convert the latest OBS video recording into a format fully compatible with WhatsApp, use the following `ffmpeg` command:

```bash
ffmpeg -i "$(ls -t ~/obs/*.mkv | head -n 1)" \
  -c:v libx264 -pix_fmt yuv420p -profile:v main -level 4.0 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  whatsapp_ready.mp4
```

### Explanation of flags and why they are needed

* `-i "$(ls -t ~/obs/*.mkv | head -n 1)"`
  Finds `.mkv` files in `~/obs`, sorts them by modification time (`ls -t`), and picks the newest one (`head -n 1`). Automatically passes the latest recording as input to `ffmpeg`.
* `-c:v libx264`
  Sets the video codec to H.264 (AVC). This is the most universally accepted video codec by WhatsApp and hardware decoders on mobile devices.
* `-pix_fmt yuv420p`
  Forces the pixel format to YUV 4:2:0 (8-bit). OBS or GPU encoders often record in 4:4:4 or 10-bit color (e.g. `yuv420p10le`), which results in a black screen or playback error on WhatsApp.
* `-profile:v main -level 4.0`
  Restricts the H.264 profile to `Main` and level to `4.0`. Prevents using high profiles (like High 5.2) that may be rejected by mobile WhatsApp apps.
* `-c:a aac -b:a 128k`
  Encodes audio to AAC at 128 kbps bitrate. Default audio tracks in OBS MKV files (such as Opus or raw PCM) are not played back in WhatsApp MP4 videos.
* `-movflags +faststart`
  Moves the file header metadata (the `moov` atom) to the beginning of the file. This allows the video to start playing immediately while downloading or uploading in the chat window.
* `whatsapp_ready.mp4`
  Output file name in MP4 container format. MKV files from OBS are not natively supported by the WhatsApp media player.
