---
title: How to check screen resolution
publishDate: 2024-11-01
---

Just type in terminal:

```bash
xrandr | grep '*'
```

For example if you have two screens:

```bash
xrandr | grep '*'
   2560x1600    240.00*+  60.00 +  59.99    59.97  
   3840x1100     60.02*+
```

Or for standard laptop screen:

```bash
xrandr | grep '*'
   1920x1080    144.00*+  60.01    59.97    59.96    60.00    59.93  
```