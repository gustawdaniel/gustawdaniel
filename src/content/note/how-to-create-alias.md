---
title: How to create alias?
publishDate: 2024-08-08
---

How to create alias!

Let's assume you have long command. For example

```bash
nmcli d wifi connect SSID password 'PASS' ifname wlan0
``` 

To create alias you can use syntax

```bash
alias shortname='longer command'
```

But to make it persistent you have to save it to .bashrc or .zshrc

In our case

```bash
alias ap="nmcli d wifi connect SSID password 'PASS' ifname wlan0"
```

It's worth to note that alias in .profile will not work because .profile is called only on login and only environment variables can be exported and shared between terminal sessions but aliases not.