---
title: How to change timezone in Arch
publishDate: 2024-08-09
---
First link new timezone

```bash
sudo ln -sf /usr/share/zoneinfo/Asia/Tbilisi /etc/localtime
```

Next sync clock

```bash
hwclock --systohc
```

You can check time typing

```bash
date
uptime
timedatectl
```

Last command will print timezone info.