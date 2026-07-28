---
title: How to setup quemu vm with quickemu?
publishDate: 2024-08-12
---
Install quickemu

```bash
yay -Sy quickemu
```

Get new ubuntu image

```bash
quickget ubuntu 22.04
```

By default, `quickemu` works in uefi mode, you can change it typing

```bash
boot="legacy"
```

at the ond of ubuntu-22.04.conf file.

You can start your vm by command:

```bash
quickemu --vm ubuntu-22.04.conf
``` 
