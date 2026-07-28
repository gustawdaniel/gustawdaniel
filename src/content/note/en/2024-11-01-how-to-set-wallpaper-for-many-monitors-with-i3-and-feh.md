---
title: How to set wallpaper for many monitors with i3 and feh?
publishDate: 2024-11-01
---

Firstly you need to install `feh`:

```bash
yay -S feh
```

Then you need to create a directory for your wallpapers. For example:

```bash
mkdir -p ~/.config/bg
```

Then you need to download some wallpapers. For example:

I prefer to use [uhdpaper.com](https://www.uhdpaper.com/). For example:

https://www.uhdpaper.com/2024/04/synthwave-retrowave-moon-road-4k-1943a.html?m=0

Then we can cut it in gimp to backgrounds for each monitor. I calling thm `bg1.jpg`, `bg2.jpg`, `bg3.jpg` etc. and put them in `~/.config/bg`.

Then you can set them as wallpaper with `feh`:

```bash
feh --recursive --bg-scale ~/.config/bg
```

finally to persist result you can add this command to your `~/.config/i3/config`:

```bash
nano ~/.config/i3/config 
```

add line:

```bash
exec --no-startup-id feh --recursive --bg-scale /home/daniel/.config/bg
```