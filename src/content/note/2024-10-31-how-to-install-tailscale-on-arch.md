---
title: How to install tailscale on Arch?
publishDate: 2024-10-31
---

Install Tailscale on Arch Linux:

```
pacman -S tailscale
```

Use systemctl to enable and start the service:

```
sudo systemctl enable --now tailscaled
```

Connect your machine to your Tailscale network and authenticate in your browser:

```
sudo tailscale up
```

You're connected! You can find your Tailscale IPv4 address by running:

```
tailscale ip -4
```

Source: https://tailscale.com/download/linux/arch