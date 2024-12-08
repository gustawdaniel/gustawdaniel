---
Title: Arch i3 Ricing Guide
publishDate: 2024-11-30
---

My `picom` config:

```bash
backend = "glx";

opacity-rule = [ 
  "80:class_g = 'code-oss'",
  "95:class_g = 'jetbrains-webstorm'",
  "85:class_g = 'Thunar'",
]

blur: {
  method = "dual_kawase";
  strength = 5;
}

blur-background-exclude = [
  "class_g = 'kitty'"
]
```

How to get class from witndow.

```bash
xprop | grep CLASS
```

How to install gth theme:

```bash
cd ~/.themes
git clone https://github.com/EliverLara/Sweet
```

Apply theme using gui.

```bash
nwg-look
```

Remember that changes will be applied when you close all windows of tested app and open them again.
