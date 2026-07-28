---
title: How to record timelapse on Linux
publishDate: 2024-12-08
---

I will show you how to record screencast timelapse on Linux using `ffmpeg`.

You have to know your screen resolution. You can check it using `xrandr` command.

```bash
xrandr | grep '*'
   2560x1600    240.00*+  60.00 +  59.99    59.97  
   3840x1100     60.02*+
```

I want to record only first screen. I will use `2560x1600` resolution. But my second screen is placed below first one,
so I have to move recording area to the right by `640,0` offset.

My input is `x11grab` what means that I will capture the screen. I will use `libwebp` codec to save the file in `webp` format.

To capture one with these assumptions you can use command:

```bash
ffmpeg -y -video_size 2560x1600 -f x11grab -i :0.0+640,0 -frames:v 1 -c:v libwebp "timelapse.webp"
```

In your case probably `-i :0.0` will work better. This refers to the first X11 display but skip offset.

Assuming that you want to do many screenshots. You can write a bash script: `timelapse_capture.sh`.

```bash
#!/bin/bash

# Base directory to save the timelapses
BASE_DIR="$HOME/timelapses"

# Create the base directory if it doesn't exist
mkdir -p "$BASE_DIR"

# Infinite loop to capture screenshots every second
while true; do
    # Get the current date in YYYY-MM-DD format
    DATE=$(date +%Y-%m-%d)
    
    # Create a subdirectory for today's date
    DAY_DIR="$BASE_DIR/$DATE"
    mkdir -p "$DAY_DIR"
    
    # Get the current timestamp
    TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
    
    # Capture screenshot using ffmpeg and save to the day's folder
    time ffmpeg -y -video_size 2560x1600 -f x11grab -i :0.0+640,0 -frames:v 1 -c:v libwebp "$DAY_DIR/timelapse_$TIMESTAMP.webp"

    # Sleep for 1 second before the next capture
    sleep 1
done
```

In this case I decided to save one shot per second. You can change it by changing the `sleep 1` line.

Second script allow to assemble all screenshots to one video. You can save it as `timelapse_to_video.sh`.

```bash
#!/bin/bash

ffmpeg -framerate 30 -i "$HOME/timelapses/$(date +%Y-%m-%d)/timelapse_%*.webp" -c:v libvpx-vp9 -crf 30 -b:v 0 -preset medium "$HOME/timelapses/$(date +%Y-%m-%d)/timelapse_video.webm"
```

Now I share with you some stats about this setup.

I created `1200` screenshots. It took `20 minutes` to create them. The size of all screenshots is `194M`.

It means that `8h` of recording will take `4.6G` of space.

To combine all screenshots to one video it took `1m 13sec` and the size of the video is `17M`.

I can expect that `8h` of recording will take `30 min` of time and `408M` of space. 

Assuming 30 fps it would be 16 minutes.

Details about codecs.

```bash
$ mediainfo timelapses/2024-12-08/timelapse_video.webm 
General
Complete name                            : timelapses/2024-12-08/timelapse_video.webm
Format                                   : WebM
Format version                           : Version 2
File size                                : 16.6 MiB
Duration                                 : 40 s 0 ms
Overall bit rate                         : 3 488 kb/s
Frame rate                               : 30.000 FPS
Writing application                      : Lavf61.7.100
Writing library                          : Lavf61.7.100

Video
ID                                       : 1
Format                                   : VP9
Format profile                           : 0
Codec ID                                 : V_VP9
Duration                                 : 40 s 0 ms
Bit rate                                 : 3 343 kb/s
Width                                    : 2 560 pixels
Height                                   : 1 600 pixels
Display aspect ratio                     : 16:10
Frame rate mode                          : Constant
Frame rate                               : 30.000 FPS
Color space                              : YUV
Chroma subsampling                       : 4:2:0
Bit depth                                : 8 bits
Bits/(Pixel*Frame)                       : 0.027
Stream size                              : 15.9 MiB (96%)
Writing library                          : Lavc61.19.100 libvpx-vp9
Default                                  : No
Forced                                   : No
Color range                              : Limited
Matrix coefficients                      : BT.470 System B/G
```