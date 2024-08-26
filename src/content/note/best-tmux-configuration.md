---
title: Best tmux configuration
publishDate: 2024-08-08
---
How to install tmux https://github.com/tmux/tmux/wiki/Installing

On arch

```bash
yay -S tmux wget
```

get config

```bash
cd ~ && wget https://raw.githubusercontent.com/gustawdaniel/my-arch-i3-config/main/.tmux.conf
```

or paste

```tmux
set -g terminal-overrides 'xterm*:smcup@:rmcup@'
# remap prefix from 'C-b' to 'C-a'
unbind C-b
set-option -g prefix C-a
bind-key C-a send-prefix
# switch panes using Alt-arrow without prefix
bind -n M-Left select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up select-pane -U
bind -n M-Down select-pane -D
# Enable mouse control (clickable windows, panes, resizable panes)
#set -g mouse-select-window on
#set -g mouse-select-pane on
#set -g mouse-resize-pane on
# Enable mouse mode (tmux 2.1 and above)
set -g mouse on
set -g pane-border-format "#{pane_index}#{?@custom_pane_title,:#{@custom_pane_title},}:#{pane_title}"
bind e set-window-option synchronize-panes
```

now you can use tmux with sensible settings.