---
title: How to setup x11vnc
publishDate: 2024-12-30
---

On server

```bash
x11vnc -display :1
```

On client

```bash
vncviewer -PreferredEncoding=ZRLE 100.93.38.2:0
```