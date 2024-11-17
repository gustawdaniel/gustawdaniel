---
title: How to install JetBrains software on Arch
publishDate: 2024-11-01
---

Instead of installing editors one by one use `toolbox`

```bash
yay -S jetbrains-toolbox
```

Then you can install and update JetBrains software by gui.

After installation, I prefer to add keybindings to i3 config:

```
bindsym $mod+i exec "/home/daniel/.local/share/JetBrains/Toolbox/apps/webstorm/bin/webstorm.sh"
bindsym $mod+o exec "/home/daniel/.local/share/JetBrains/Toolbox/apps/rustrover/bin/rustrover.sh"
bindsym $mod+p exec "/home/daniel/.local/share/JetBrains/Toolbox/apps/pycharm-community/bin/pycharm.sh"
```