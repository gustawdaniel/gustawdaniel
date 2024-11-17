---
title: How to install custom extension in VSCode
publishDate: 2024-11-02
---

First install `vscode`

```
yay -S code
```

Then go to the tmp directory

```
cd /tmp
```

Download the extension

```
git clone git@github.com:juanmnl/vs-1984.git
```

if you do not have private key, check [how to generate ssh key to github repo](/note/how-to-generate-ssh-key-to-github-repo)


install `vsce` packages

```
npm install -g @vscode/vsce
```

if you do not have npm installed, check [how to install Node.js and pnpm](/note/how-to-install-nodejs-and-pnpm)

Go to the extension directory

```
cd vs-1984
```

Create LICENCE file

```
touch LICENCE
```

create package

```
vsce package
```

Install package

```bash
code --install-extension /tmp/vs-1984/vscode-theme-1984-0.3.4.vsix
```

Restart `code` and select the theme.

To debug you can check

```bash
code --list-extensions
dracula-theme.theme-dracula
juanmnl.vscode-theme-1984
```

or check the `settings.json` file

```
code ~/.config/Code\ -\ OSS/User/settings.json
```

Go to extension dir 

```
cd ~/.vscode-oss/extensions/
```

or check file `extensions.json`

```bash
code .vscode-oss/extensions/extensions.json
```

If you're playing in IntelliJ team you can check [themes for jetbrains](https://plugins.jetbrains.com/search?excludeTags=internal&pricingModels=FREE&pricingModels=FREEMIUM&tags=Theme).
