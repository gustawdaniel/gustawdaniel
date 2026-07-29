---
title: Arch i3 Ricing Guide
publishDate: 2024-11-30
tags: ["arch", "i3", "linux", "ricing", "dotfiles", "picom"]
---

Complete reference guide and dotfiles configuration for ricing Arch Linux with the i3 window manager.

GitHub Repository: [gustawdaniel/my-arch-i3-config](https://github.com/gustawdaniel/my-arch-i3-config)

## Picom Compositor Configuration (`~/.config/picom/picom.conf`)

Use GLX backend for GPU acceleration, custom opacity rules for specific applications, and `dual_kawase` blur:

```bash
backend = "glx";

opacity-rule = [
  "80:class_g = 'code-oss'",
  "95:class_g = 'jetbrains-webstorm'",
  "85:class_g = 'Thunar'",
  "90:class_g = 'kitty'"
];

blur: {
  method = "dual_kawase";
  strength = 5;
};

blur-background-exclude = [
  "class_g = 'kitty'"
];
```

### Finding Window Classes

To find the exact `class_g` string of any running window for `opacity-rule` or i3 window rules:

```bash
xprop | grep CLASS
```

Click on target window to get output like `WM_CLASS(STRING) = "code-oss", "Code - OSS"`.

## i3 Window Manager Key Configurations (`~/.config/i3/config`)

Keybindings, gaps, autostart programs, and borderless window management:

```bash
# Set modifier key to Super (Windows key)
set $mod Mod4

# Font for window titles and bar
font pnpm:JetBrains Mono 10

# Gaps configuration (requires i3-gaps or i3-gaps-rounded)
gaps inner 8
gaps outer 4

# Remove window titlebars and set thin borders
for_window [class="^.*"] border pixel 2

# Keybindings
bindsym $mod+Return exec kitty
bindsym $mod+d exec dmenu_run
bindsym $mod+Shift+q kill

# Autostart applications
exec_always --no-startup-id picom -b
exec_always --no-startup-id feh --bg-fill ~/.wallpaper.jpg
```

## GTK Theme & Icons Installation

Install the Sweet GTK theme and customize look and feel:

```bash
cd ~/.themes
git clone https://github.com/EliverLara/Sweet
```

Apply GTK themes, icons, and cursor styles using `nwg-look`:

```bash
nwg-look
```

_Note: Theme changes take effect when you restart the target applications._
