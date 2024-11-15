---
title: How to connect to network by nmcli
publishDate: 2024-08-09
---
Show devices:

```bash
$ nmcli d
```

Info about device
```bash
$ nmcli d show wlan0
```

List of wifi

```bash
nmcli d wifi list ifname wlan0
```

Connect

```bash
nmcli d wifi connect SSID password 'PASS' ifname wlan0
```

Check if it works

```bash
nmcli d
ip a
```
