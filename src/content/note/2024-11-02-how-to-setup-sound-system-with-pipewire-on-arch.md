---
title: How to setup sound system with Pipewire on Arch
publishDate: 2024-11-02
---

Install `pipewire`

```bash
yay -S pipewire pipewire-pulse pipewire-alsa pipewire-jack
```

Enable `pipewire`

```bash
systemctl --user disable pulseaudio.service pulseaudio.socket
systemctl --user stop pulseaudio.service pulseaudio.socket

systemctl --user enable pipewire pipewire-pulse
systemctl --user start pipewire pipewire-pulse
```

Check if pipewire is running

```bash
$ pactl info

Server String: /run/user/1000/pulse/native
Library Protocol Version: 35
Server Protocol Version: 35
Is Local: yes
Client Index: 74
Tile Size: 65472
User Name: daniel
Host Name: rog
Server Name: PulseAudio (on PipeWire 1.2.6)
Server Version: 15.0.0
Default Sample Specification: float32le 2ch 48000Hz
Default Channel Map: front-left,front-right
Default Sink: alsa_output.pci-0000_09_00.6.analog-stereo
Default Source: alsa_input.pci-0000_09_00.6.analog-stereo
Cookie: 0f24:c169
[daniel@rog ~]$ pactl info
Server String: /run/user/1000/pulse/native
Library Protocol Version: 35
Server Protocol Version: 35
Is Local: yes
Client Index: 81
Tile Size: 65472
User Name: daniel
Host Name: rog
Server Name: PulseAudio (on PipeWire 1.2.6)
Server Version: 15.0.0
Default Sample Specification: float32le 2ch 48000Hz
Default Channel Map: front-left,front-right
Default Sink: alsa_output.pci-0000_09_00.6.analog-stereo
Default Source: alsa_input.pci-0000_09_00.6.analog-stereo
Cookie: 0f24:c169
```

Check if sound is working

```
speaker-test -c2
```

Install `pavucontrol-qt` to manage sound devices

```bash
yay -S pavucontrol-qt
```

Run `pavucontrol-qt`

```
pavucontrol-qt
```

Sources:

https://wiki.archlinux.org/title/Sound_system
https://wiki.archlinux.org/title/PipeWire
