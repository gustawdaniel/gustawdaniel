---
title: How to install python with conda on Arch Linux?
publishDate: 2024-08-13
---
Installation of python-conda does not work because of issue

```bash
 Imported target "pybind11::headers" includes non-existent path
```

described in https://github.com/pybind/pybind11/discussions/5091

You can check versions of conda here:

https://conda.io/projects/conda/en/latest/user-guide/install/index.html

Best option is download: https://www.anaconda.com/download

You can read more about ecosystem on https://www.anaconda.com/

In your .zshrc you will see

```zsh
# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
__conda_setup="$('/home/daniel/.anaconda3/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
  eval "$__conda_setup"
else 
  if [ -f "/home/daniel/.anaconda3/etc/profile.d/conda.sh" ]; then
    . "/home/daniel/.anaconda3/etc/profile.d/conda.sh"
  else
    export PATH="/home/daniel/.anaconda3/bin:$PATH"
  fi
fi
unset __conda_setup
# <<< conda initialize <<<
```

It is recommended to avoid base env as default

```bash
conda config --set auto_activate_base false
```

## Activation new env

Lets assume, we will work on project called `ir`. We will create env by:

```bash
conda create --name ir
```

and activate it by

```bash
conda activate ir
```

To install packages:

```bash
conda install --file requirements.txt
```