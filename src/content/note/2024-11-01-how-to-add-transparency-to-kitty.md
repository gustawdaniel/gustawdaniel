---
title: How to add transparency to kitty
publishDate: 2024-11-01
---

In your `~/.config/kitty/kitty.conf` add:

```bash
background_opacity         0.5
dynamic_background_opacity yes
```

but you do do not have configured picom running kitty you will see

```bash
[0.134] Failed to enable transparency. This happens when your desktop environment does not support compositing.
[0.158] [glfw error 65544]: process_desktop_settings: failed with error: [org.freedesktop.DBus.Error.ServiceUnknown] The name is not activatable
[0.158] [glfw error 65544]: Notify: Failed to get server capabilities error: [org.freedesktop.DBus.Error.ServiceUnknown] The name is not activatable
```

So you need to install picom:

```bash
yay -S picom
```

and add to your `~/.config/picom/picom.conf`:

```
mkdir -p ~/.config/picom
echo 'backend = "glx";' > ~/.config/picom/picom.conf
```

now calling picom

```
picom --config ~/.config/picom/picom.conf
```

you should see transparency in new kitty windows that you opening now.

If you have problems with `glx` backend you can try `xrender` or `glx-legacy`:

Picom supports several backends that you can use for rendering. The main backends available in Picom are:

- `glx`: This backend uses OpenGL for rendering, which can provide better performance and visual effects. It's recommended for systems with good OpenGL support, especially when using hardware acceleration.
- `xrender`: This is a more widely compatible backend that uses the X Render Extension. It's typically a good choice for systems that may not support OpenGL. However, it may not provide the same level of visual effects (like shadows and transparency) as glx.
- `glx-legacy`: This is a variant of the glx backend and can be used for systems with older hardware that may not support newer OpenGL features. It’s less commonly used.

If you want to start picom with i3 you can add to your `~/.config/i3/config`:

```bash
exec_always --no-startup-id picom --config ~/.config/picom/picom.conf -b
```

Sources:

https://www.reddit.com/r/linux4noobs/comments/99s6tm/i_hope_this_is_the_right_subreddit_but_how_do_i/
https://github.com/i3/i3/discussions/4841

