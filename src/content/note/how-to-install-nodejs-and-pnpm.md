---
title: How to install Node.js and pnpm
publishDate: 2024-08-08
---
Install nvm

```bash
yay -S nvm
```

or install from source

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
```

you can check last version on https://github.com/nvm-sh/nvm

List node versions

```bash
nvm ls-remote
```

Install selected version

```bash
nvm install 22
```

Enable corepack

```bash
corepack enable
```

Confirm versions

```bash
$ node --version
v22.6.0
$ pnpm --version
9.6.0
```