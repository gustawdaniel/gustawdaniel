---
title: How to make a screen shot in i3?
publishDate: 2024-08-10
---
Install `flameshot`

```bash
yay -S flameshot
```

open i3 config

```bash
nvim ~/.config/i3/config
```

add line

```i3
bindsym Print exec "flameshot gui"
```

reload i3

```bash
super + shift + r
```

use your PrtSc button on keyboard