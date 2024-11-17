---
title: How to add application launcher to dmenu
publishDate: 2024-08-08
---

Lets assume, that I would like to open program with long name quite often. For example.:
```bash
qemu-system-x86_64 -enable-kvm --boot order=d -drive file=~/qemu/DragonImage.img -m 20G --smp cores=4 --cpu host --vga virtio -display sdl,gl=on
```
We co do it by aliases on shell level, but in our case we don't event open console for it. We will create new desktop app. Lets start from cd to applications dir

```bash
cd ~/.local/share/applications/
```

create a new .desktop

```bash
touch dragon-qemu.desktop
```

open this file in editor

```bash
nano dragon-qemu.desktop
```

add content

```toml
[Desktop Entry]
Version=1.0
Name=Dragon QEMU
Comment=Launch Dragon QEMU with specific parameters
Exec=qemu-system-x86_64 -enable-kvm --boot order=d -drive file=/home/daniel/qemu/DragonImage.img -m 20G --smp cores=4 --cpu host --vga virtio -display sdl,gl=on
Icon=utilities-terminal
Terminal=false
Type=Application
Categories=Utility;System;
```

make it executable

```bash
chmod +x ~/.local/share/applications/dragon-qemu.desktop
```

If you do not see your program type

```bash
i3-dmenu-desktop
```

or to debug

```bash
strace -s 2048 i3-dmenu-desktop
```

But for me it works :)