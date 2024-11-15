---
title: How to install DaVinci Resolve?
publishDate: 2024-08-14
---

DaVinci Resolve is a professional video editing software. In this note I will show you how to install it on Arch Linux.

Lets start form wiki: https://wiki.archlinux.org/title/DaVinci_Resolve

Abbreviations worth to know:
- ROCm: Radeon Open Compute
- OpenGL: Open Graphics Library
- OpenCL: Open Computing Language
- CUDA: Compute Unified Device Architecture

Installation:

```bash
yay -S nvidia-utils opencl-nvidia cuda davinci-resolve
```

If it not work go to `Help -> Create Diagnostics Log` and check what is wrong.

in my case

```
find . -name 'log_archive_20241028-105551.tgz'
```

gives

```
./.local/share/DaVinciResolve/logs/log_archive_20241028-105551.tgz
```

unpack archive using command:

```
tar -xvf ./.local/share/DaVinciResolve/logs/log_archive_20241028-105551.tgz
```

then check `ResolveDebug.txt` file.

```
cd ./.local/share/DaVinciResolve/logs/
cat ResolveDebug.txt
```

For me there is a lot of lines:

```
ALSA lib pcm_dmix.c:1000:(snd_pcm_dmix_open) unable to open slave
```

We will use audio file from https://www2.cs.uic.edu/~i101/SoundFiles/

lets install `alsa-utils`:

```
yay -S alsa-utils
```

then test on file

```
aplay CantinaBand3.wav
```

lets show only unique lines:

```
cat ResolveDebug.txt | sort | uniq
```

Codecs support:

```
https://documents.blackmagicdesign.com/SupportNotes/DaVinci_Resolve_18_Supported_Codec_List.pdf?_v=1689663610000
```

# How to investigate file codecs?

```
yay -S perl-image-exiftool
```

then check file:

```
exiftool ai-car-many-fast.mkv | grep Codec

Codec ID                        : V_MPEG4/ISO/AVC
```

or by `mediainfo`:

```
mediainfo ai-car-many-fast.mkv | grep Format

Format                                   : AVC
```

Advanced Video Coding (AVC), also referred to as H. 264 or MPEG-4 Part 10, is a video compression standard based on block-oriented, motion-compensated coding.

Unfortunately DaVinci Resolve free version does not support AVC codec.

# How to convert AVC to AV1?

```
ffmpeg -i ai-car-many-fast.mkv -c:v libaom-av1 -crf 30 -b:v 0 -strict experimental -cpu-used 8 -row-mt 1 -tile-columns 2 -tile-rows 2 -c:a copy ai-car-many-fast-av1.mkv
```

To show video length:

```
ffprobe -i ai-car-many-fast-av1.mkv  -show_entries format=duration -v quiet -of csv="p=0"
8.017000
```

Run with

```
__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia /opt/resolve/bin/resolve
```