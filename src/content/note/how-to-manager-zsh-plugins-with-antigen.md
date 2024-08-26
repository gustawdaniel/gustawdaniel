---
title: How to manage zsh plugins with antigen?
publishDate: 2024-08-10
---
Install antigen

```bash
curl -L git.io/antigen > ~/.local/share/antigen.zsh
```

now paste to `~/.zshrc` content

```zsh
# antigen path when using Homebrew:
source ~/.local/share/antigen.zsh
# if you installed antigen using curl:
# source /path-to-antigen/antigen.zsh
# Load the oh-my-zsh's library.
antigen use oh-my-zsh
# load plugins
antigen bundle git
antigen bundle node
antigen bundle npm
antigen bundle zsh-users/zsh-autosuggestions
antigen bundle zdharma-continuum/fast-syntax-highlighting
antigen bundle djui/alias-tips
antigen theme robbyrussell
# Tell Antigen that you're done
antigen apply
# more configuration
```

Lets install package adding auto-recognizing of node vesion by .nvmrc and applying it by nvm.

You have to install nvm. It was described in https://gustawdaniel.notepin.co/how-to-install-nodejs-and-pnpm-lhcqltmr

Now you can add

```zsh
antigen bundle Sparragus/zsh-auto-nvm-use
```

but

```zsh
# nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion
```

have to be pasted ealier. My file looks following

```zsh
# antigen path when using Homebrew:
source ~/.local/share/antigen.zsh
# if you installed antigen using curl:
# source /path-to-antigen/antigen.zsh
# Load the oh-my-zsh's library.
antigen use oh-my-zsh
# nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion
# load plugins
antigen bundle git
antigen bundle node
antigen bundle npm
antigen bundle zsh-users/zsh-autosuggestions
antigen bundle zdharma-continuum/fast-syntax-highlighting
antigen bundle djui/alias-tips
antigen bundle Sparragus/zsh-auto-nvm-use
antigen theme robbyrussell
# Tell Antigen that you're done
antigen apply
# more configuration
```

now you cat see that node version is changed if `.nvmrc` file exist in current directory.