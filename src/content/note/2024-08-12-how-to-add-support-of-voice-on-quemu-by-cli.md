---
title: How to add support of voice on qemu by command line?
publishDate: 2024-08-12
---

To command that start your machine add:


```bash
-audiodev pa,id=snd0 -device ich9-intel-hda -device hda-output,audiodev=snd0
```

for example your full command can look like this:

```bash
qemu-system-x86_64 -enable-kvm --boot order=d -drive file=/home/daniel/qemu/Statscore.img -m 40G --smp cores=8 --cpu host --vga virtio -display sdl,gl=on -audiodev pa,id=snd0 -device ich9-intel-hda -device hda-output,audiodev=snd0
```