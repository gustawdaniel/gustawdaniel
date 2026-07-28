---
title: UFW Docker config
publishDate: 2025-02-24
---

Docker by default overrides iptables rules and allows all traffic..
To secure your server you have to configure UFW to allow only necessary ports


```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "iptables": false
}
```


## UFW Docker config

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS

sudo ufw enable
```