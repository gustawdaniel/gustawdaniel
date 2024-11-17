---
title: How to wait for sync files on linux?
publishDate: 2024-10-31
---

Files are not always synchronized immediately. After copying them to flash drive you should execute

```
sync
```

and can check progress by

```bash
watch -n 1 "grep Dirty /proc/meminfo"
```

This command will show you how many dirty pages are in memory that wait to be written to disk.