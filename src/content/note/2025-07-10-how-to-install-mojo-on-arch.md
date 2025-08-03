---
title: How to install Mojo on Arch
publishDate: 2025-07-10
---

Recently `modular cli` (specifically `magic` command) was deprecated and replaced with `pixi`.

Existing package `mojo` on Arch Linux is outdated and does not work with latest `pixi` version.

There is a new ways to install `mojo` on Arch Linux using `pixi` package manager.

Lets install `pixi`

```bash
curl -fsSL https://pixi.sh/install.sh | sh
```

Reload your shell:

```bash
zsh
```

Then create project `mojo-hello-world`:

```bash
pixi init mojo-hello-world \
  -c https://conda.modular.com/max-nightly/ -c conda-forge \
  && cd mojo-hello-world
```

Install modular package to use `mojo`:

```bash
pixi add modular
```

now you can check if mojo works:

```bash
pixi run mojo --version
```

# Lest write simple mojo program

Create file `hello.mojo`:

```mojo
from gpu.host import DeviceContext
from sys import has_accelerator

def main():
    @parameter
    if not has_accelerator():
        print("No compatible GPU found")
    else:
        ctx = DeviceContext()
        print("Found GPU:", ctx.name())
```

and run it by

```bash
pixi run mojo hello.mojo
```

About mojo: https://docs.modular.com/mojo/manual/get-started/
About pixi: https://pixi.sh/

I checked that in [uv](https://astral.sh/blog/uv) you can't install `mojo`.