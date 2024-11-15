---
title: How to list all desktop apps in Linux?
publishDate: 2024-11-01
---

Just search .desktop files in `/usr/share` directory.

```bash
sudo find "/usr/share" -type f -name "*.desktop"
```

Sources:
- https://manpages.ubuntu.com/manpages/trusty/man1/i3-dmenu-desktop.1.html
- https://stackoverflow.com/questions/5927369/recursively-look-for-files-with-a-specific-extension