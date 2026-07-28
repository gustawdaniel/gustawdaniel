---
title: How to generate ssh key to github repo
publishDate: 2024-08-08
---

Install openssh

```bash
yay -S openssh
```

Generate key

```bash
ssh-keygen -t ed25519 -C "gustaw.daniel@gmail.com"
```

Install xclip

```bash
yay -S xclip
```

Copy public key

```bash
cat ~/.ssh/id_ed25519.pub | xclip -sel copy
```

Paste this key on github page https://github.com/settings/ssh/new and save this key.

Finally clone repo

```bash
git clone git@github.com:<org>/<repo>.git
```