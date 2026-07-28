---
title: How to setup redis on Arch Linux?
publishDate: 2024-08-13
---

Install

```bash
yay -S redis
```

Enable / Start

```bash
sudo systemctl enable redis.service
sudo systemctl start redis.service
```

optionally check status

```bash
sudo systemctl status redis.service
```

start cli and check if redis server respond to ping

```bash
redis-cli
127.0.0.1:6379> ping
PONG
```