---
title: How to prepare multi dual boot?
publishDate: 2024-10-31
---

Install `ventoy`

```
yay -S ventoy-bin 
```

run GUI

```
/opt/ventoy/VentoyGUI.x86_64
```


in options set `Pathition sheme` to `GPT`.

Then just copy ISOs to USB drive.

you can use

```
sync
```

to make sure that usb can be unmounted and ejected.

Command

```
watch -n 1 "grep Dirty /proc/meminfo"
 ```

is useful to check progress.