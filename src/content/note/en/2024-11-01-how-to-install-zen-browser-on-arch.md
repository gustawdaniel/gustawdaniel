---
title: How to install Zen Browser on Arch
publishDate: 2024-11-01
---

You can check available packages here:

https://aur.archlinux.org/packages?O=0&SeB=nd&K=zen-browser&outdated=&SB=p&SO=d&PP=50&submit=Go

Best option is to use `zen-browser-bin` package, which is the latest version of Zen Browser.

```
yay -S zen-browser-bin
```

In early days there was special package for AVX2 CPUs, but it was removed due to the fact that Zen Browser is now built with AVX2 support by default.

https://www.reddit.com/r/zen_browser/comments/1hnzex9/no_avx2_package_anymore/