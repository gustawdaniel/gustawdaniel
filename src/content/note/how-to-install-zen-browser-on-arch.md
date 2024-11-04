---
title: How to install Zen Browser on Arch
publishDate: 2024-11-01
---

There are 3 aur packages

https://aur.archlinux.org/packages?O=0&SeB=nd&K=zen-browser&outdated=&SB=p&SO=d&PP=50&submit=Go

Generally you have 2 options

- with `avx2` - faster rendering but required modern cpu
- without `avx2` - higher compatibility
- private-window-launcher - we will not cover this package

What `avx2` is?

AVX2, or Advanced Vector Extensions 2, is an instruction set that enhances CPU performance by enabling parallel processing
for tasks involving large datasets, like numerical simulations and multimedia applications, by operating on multiple data
points in a single instruction.

AVX2 typically shines in tasks with high data parallelism, such as video playback, image processing, and JavaScript-heavy sites.
For these tasks, AVX2 can provide a 10-30% performance boost over non-AVX2 workloads, sometimes even higher for highly optimized algorithms.

In real-world web browsing, the AVX2 gain might be lower because only some parts of a browser's workload (like rendering and media decoding)
are AVX2-optimized.

you can read more here: https://en.wikipedia.org/wiki/Advanced_Vector_Extensions

---

Check your cpu avx2 support

```bash
lscpu | grep avx2
```

if you see flags like `avx2` you can install `zen-browser` with `avx2` support

```
yay -S zen-browser-avx2-bin
```

in other case:

```
yay -S zen-browser-bin
```