---
title: How to control brightness with i3
publishDate: 2024-11-01
---

### Low level manual brightness control

List your devices

```bash
ls /sys/class/backlight/
```

In my case

```bash
ls /sys/class/backlight/
amdgpu_bl1  asus_screenpad
```

or

```bash
ls /sys/class/backlight/
intel_backlight  nvidia_0
```

You can check these brightness values

```bash
cat /sys/class/backlight/*/brightness
```

in relation to `max_brightness`

```bash
cat /sys/class/backlight/*/max_brightness
```

You can manually set brightness for selected device. For example.:

```bash
sudo nano /sys/class/backlight/amdgpu_bl1/brightness
```

### Cli brightness control

but it's not convenient. You can use `brightnessctl` instead.

```bash
yay -S brightnessctl
```

Then

```
brightnessctl s 5%+
```

or

```
brightnessctl s 5%+
```

more options can be found in help

```
brightnessctl --help
```

```
brightnessctl 0.5 - read and control device brightness.

Usage: brightnessctl [options] [operation] [value]

Options:
  -l, --list			list devices with available brightness controls.
  -q, --quiet			suppress output.
  -p, --pretend			do not perform write operations.
  -m, --machine-readable	produce machine-readable output.
  -n, --min-value		set minimum brightness, defaults to 1.
  -e, --exponent[=K]		changes percentage curve to exponential.
  -s, --save			save previous state in a temporary file.
  -r, --restore			restore previous saved state.
  -h, --help			print this help.
  -d, --device=DEVICE		specify device name (can be a wildcard).
  -c, --class=CLASS		specify device class.
  -V, --version			print version and exit.

Operations:
  i, info			get device info.
  g, get			get current brightness of the device.
  m, max			get maximum brightness of the device.
  s, set VALUE			set brightness of the device.

Valid values:
  specific value		Example: 500
  percentage value		Example: 50%
  specific delta		Example: 50- or +10
  percentage delta		Example: 50%- or +10%
```

### Keybinding for brightness in i3

To bind it to i3 you can add to your config `~/.config/i3/config`

```
bindsym XF86MonBrightnessDown exec brightnessctl s 5%-
bindsym XF86MonBrightnessUp exec brightnessctl s +5%
```

### Automatic brightness control

If you are interested in automatic brightness control using camera as a sensor, you can check `wluma`

https://github.com/maximbaz/wluma
