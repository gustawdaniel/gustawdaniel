---
title: How to connect computers by nc!
publishDate: 2024-08-09
---
Install netcat.

You have 2 options:
- gnu-netcat - simpler option without advanced features
- openbsd-netcat - feature rich advanced netcat

If it is your first contact with netcat I recommend

```bash
yay -S gnu-netcat
```
  
Now on first device start listening on port, for example 1234

```bash
nc -l 1234
```
  
And on second connect giving IP and PORT from first device

```bash
nc 192.168.27.91 1234
```
  
Now you can paste any text and confirm by ENTER to send it instantly to second computer.

It is important that you have to be in the same network, and some networks can block traffic between devices if they are properly configured. It it will not work you have to check your iptables, for example using ufw that is interface for iptables and simplify configuration.