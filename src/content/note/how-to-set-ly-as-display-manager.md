---
title: How to set ly as display manager?
publishDate: 2024-08-12
---
Repo: https://github.com/fairyglade/ly

Installation:

```bash
yay -S ly
```

Enabling service

```bash
systemctl enable ly.service
```

How to add cmatrix animation during login?

In file: /etc/ly/config.ini set

```bash
animation = matrix
```

And install cmatrix:

```bash
yay -S cmatrix
```
