---
title: How to control keyboard light on Linux
publishDate: 2024-11-01
---

Check your devices

```bash
ls /sys/class/leds/

asus::kbd_backlight  input11::capslock    input32::capslock
enp3s0-0::lan        input11::compose     input32::compose
enp3s0-1::lan        input11::kana        input32::kana
enp3s0-2::lan        input11::numlock     input32::numlock
enp3s0-3::lan        input11::scrolllock  input32::scrolllock
```

we are looking for `vendor::kbd_backlight`, in our case `asus::kbd_backlight`.

Lest check possible light modes

```bash
cat /sys/class/leds/asus::kbd_backlight/max_brightness
3
```

Now you can control them editing this file directly by `nano`, or use `brightnessctl`:

```
brightnessctl --device='asus::kbd_backlight' info
Device 'asus::kbd_backlight' of class 'leds':
	Current brightness: 0 (0%)
	Max brightness: 3
```

and

```
brightnessctl --device='asus::kbd_backlight' set 1
```




Sources:

https://wiki.archlinux.org/title/Keyboard_backlight

