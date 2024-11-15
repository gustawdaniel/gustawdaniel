---
title: Difference between i3-dmenu-desktop and dmenu_run
publishDate: 2024-08-09
---
In ~/.config/i3/config you can see lines

```i3
# start dmenu (a program launcher)
bindsym $mod+d exec --no-startup-id dmenu_run
# A more modern dmenu replacement is rofi:
# bindcode $mod+40 exec "rofi -modi drun,run -show drun"
# There also is i3-dmenu-desktop which only displays applications shipping a
# .desktop file. It is a wrapper around dmenu, so you need that installed.
# bindcode $mod+40 exec --no-startup-id i3-dmenu-desktop
```

so there is by default `dmenu_run` and possible to activate i3-dmenu-desktop

Fist program - `dmenu_run` search by `$PATH` so it is more suitable for cli tools. Second - i3-dmenu-desktop checks locations /usr/share/applications and ~/.local/share/applications so it is better for applications with GUI.

So `i3-dmenu-desktop` gives better user experience.

Confounding `bindcode $mod+40` means the same what `bindsym $mod+d` where 40 is selected to denote "d" in agreement with X Window System (X11) convention. You can check it by command:

```i3
xmodmap -pke | grep 40
keycode 40 = d D d D eth ETH eth
```

You will not see difference between `bindsym $mod+d` and `bindcode $mod+40` unless you will use any exotic keyboard layout.

Finally I recommend settings with `i3-dmenu-desktop` instead of default `dmenu_run`, or you can try `rofi`.