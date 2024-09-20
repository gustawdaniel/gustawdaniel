---
title: How to list all file extensions in directory
publishDate: 2024-08-27
---

To get files extensions type

```bash
find . -type f | sed -n 's/.*\.\([^.]*\)$/\1/p' | sort | uniq
```

