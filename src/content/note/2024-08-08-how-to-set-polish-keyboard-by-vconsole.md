---
title: How to set polish keyboard by vconsole?
publishDate: 2024-08-08
---

To file `/etc/vconsole.conf` save content

```config
KEYMAP=pl
FONT=Lat2-Terminus16
FONT_MAP=8859-2
```

Or using one line command

```bash
echo -e "KEYMAP=pl\nFONT=Lat2-Terminus16\nFONT_MAP=8859-2" | sudo tee /etc/vconsole.conf > /dev/null
```

Finally

```bash
setxkbmap pl
```

and to persist add

```config
exec_always "setxkbmap pl"
```

in  ~/.config/i3/config