---
title: IPERF WiFi vs Cable
publishDate: 2025-07-04
---

To measure the speed of internet connection between two devices I use `iperf`.

On first start listening:

```bash
iperf -s
```

On second device run:

```bash
iperf -c <ip> 
```

I am connected by *GL.iNet GL-X3000 (Spitz AX)*. According to specs:

> Wi-Fi 6: Max speed 574 Mbps (2.4GHz) and 2402 Mbps (5GHz). 

Being connected to `5GHz` I measured:

Linux to macOS (both in 5GHz):

```
------------------------------------------------------------
Client connecting to 100.115.157.69, TCP port 5001
TCP window size: 16.0 KByte (default)
------------------------------------------------------------
[ ID] Interval       Transfer     Bandwidth
[  1] 0.0000-10.0463 sec   451 MBytes   377 Mbits/sec
[  1] 0.0000-10.0276 sec   458 MBytes   383 Mbits/sec
[  1] 0.0000-10.0429 sec   448 MBytes   375 Mbits/sec
```

MacOS to Linux (both in 5GHz):

```
------------------------------------------------------------
Client connecting to rog, TCP port 5001
TCP window size:  128 KByte (default)
------------------------------------------------------------
[ ID] Interval       Transfer     Bandwidth
[  1] 0.00-10.06 sec   265 MBytes   221 Mbits/sec
[  1] 0.00-10.04 sec   273 MBytes   228 Mbits/sec
[  1] 0.00-10.04 sec   277 MBytes   231 Mbits/sec
```

I am seeing not symmetric results.

- Linux → macOS: ~375–383 Mbits/sec
- macOS → Linux: ~221–231 Mbits/sec

So the download to macOS is faster than the upload from macOS to Linux.

Linux (2.4GHz) to MacOS (5GHz):

```
[  1] 0.0000-10.0000 sec   227 MBytes   190 Mbits/sec
[  1] 10.0000-20.0000 sec   247 MBytes   207 Mbits/sec
[  1] 20.0000-30.0000 sec   246 MBytes   207 Mbits/sec
[  1] 0.0000-30.1582 sec   720 MBytes   200 Mbits/sec
```

Linux (2.4GHz) to MacOS (2.4GHz):

```
[  1] 0.0000-10.0000 sec  74.5 MBytes  62.5 Mbits/sec
[  1] 10.0000-20.0000 sec  92.6 MBytes  77.7 Mbits/sec
[  1] 20.0000-30.0000 sec  96.0 MBytes  80.5 Mbits/sec
[  1] 0.0000-30.6303 sec   263 MBytes  72.1 Mbits/sec
```

MacOS (2.4GHz) to Linux (2.4GHz):

```
[  1] 0.00-10.00 sec  65.3 MBytes  54.7 Mbits/sec
[  1] 10.00-20.00 sec  82.5 MBytes  69.2 Mbits/sec
[  1] 20.00-30.00 sec  82.2 MBytes  69.0 Mbits/sec
[  1] 0.00-30.19 sec   230 MBytes  63.9 Mbits/sec
```

Linux (Android wifi) to MacOS (2.4GHz):

```
[  1] 0.0000-10.0000 sec  4.88 MBytes  4.09 Mbits/sec
[  1] 10.0000-20.0000 sec  11.1 MBytes  9.33 Mbits/sec
[  1] 20.0000-30.0000 sec  13.5 MBytes  11.3 Mbits/sec
[  1] 0.0000-31.3220 sec  29.6 MBytes  7.93 Mbits/sec
```

MacOS (2.4GHz) to Linux (Android wifi):

```
[  1] 0.00-10.00 sec  23.3 MBytes  19.5 Mbits/sec
[  1] 10.00-20.00 sec  19.9 MBytes  16.7 Mbits/sec
[  1] 20.00-30.00 sec  15.5 MBytes  13.0 Mbits/sec
[  1] 0.00-30.39 sec  58.8 MBytes  16.2 Mbits/sec
```

Linux (Android wifi) to MacOS (Android wifi):

```
[  1] 0.0000-10.0000 sec  46.5 MBytes  39.0 Mbits/sec
[  1] 10.0000-20.0000 sec  44.2 MBytes  37.1 Mbits/sec
[  1] 20.0000-30.0000 sec  45.9 MBytes  38.5 Mbits/sec
[  1] 0.0000-30.4709 sec   137 MBytes  37.6 Mbits/sec
```

MacOS (Android wifi)) to Linux (Android wifi):

```
[  1] 0.00-10.00 sec  46.0 MBytes  38.6 Mbits/sec
[  1] 10.00-20.00 sec  44.4 MBytes  37.2 Mbits/sec
[  1] 20.00-30.00 sec  43.2 MBytes  36.3 Mbits/sec
[  1] 0.00-30.61 sec   134 MBytes  36.6 Mbits/sec
```

Linux (ethernet cat6) to MacOS (5.0GHz):

```
[  1] 0.0000-10.0000 sec  84.3 MBytes  70.7 Mbits/sec
[  1] 10.0000-20.0000 sec  83.1 MBytes  69.7 Mbits/sec
[  1] 20.0000-30.0000 sec  84.1 MBytes  70.6 Mbits/sec
[  1] 0.0000-30.0797 sec   252 MBytes  70.2 Mbits/sec
```

MacOS (5.0GHz) to Linux (ethernet cat6):

```
[  1] 0.00-10.00 sec  90.8 MBytes  76.1 Mbits/sec
[  1] 10.00-20.00 sec  98.0 MBytes  82.2 Mbits/sec
[  1] 20.00-30.00 sec   105 MBytes  88.1 Mbits/sec
[  1] 0.00-30.05 sec   294 MBytes  82.0 Mbits/sec
```

Linux (ethernet cat5e) to MacOS (ethernet cat5e):

```
[  1] 0.0000-10.0000 sec  1.02 GBytes   878 Mbits/sec
[  1] 10.0000-20.0000 sec  1.03 GBytes   888 Mbits/sec
[  1] 20.0000-30.0000 sec  1.03 GBytes   886 Mbits/sec
[  1] 0.0000-30.0341 sec  3.09 GBytes   883 Mbits/sec
```

MacOS (ethernet cat5e) to Linux (ethernet cat5e):

```
[  1] 0.00-10.00 sec   704 MBytes   590 Mbits/sec
[  1] 10.00-20.00 sec   700 MBytes   587 Mbits/sec
[  1] 20.00-30.00 sec   689 MBytes   578 Mbits/sec
[  1] 0.00-30.05 sec  2.04 GBytes   584 Mbits/sec
```

Conclusions:

We can see that connecting 2 computers by just normal hotspot from phone we can expect: `37 Mbits/sec` in both directions.
Adding extra router with wifi 6 we can improve to `70 Mbits/sec` on 2.4 GHz and `230-370 Mbits/sec` on 5 GHz.
But real speed is on wired connection `584 - 883 Mbits/sec` on ethernet cat5e.

Let's assume, we want to stream video from Linux to MacOS by command:

```
x11vnc -display :0 -clip 2560x1600+1080+320
```

then we have 2560x1600 = 4096000 pixels per frame.

24-bit color (True Color) = 3 bytes per pixel (1 byte for R, G, B)

So, the size of one frame is:

```
4096000 pixels * 3 bytes/pixel = 12 288 000 bytes = 11.7 MB
```

We're measuring speed of internet in `Mbits/s` but `8b = 1B` so `800 Mbits/sec` means that we will send `100 MB/sec`
so it will be about 9 frames per second. But fortunately we vnc is optimized to send only changed pixels.
