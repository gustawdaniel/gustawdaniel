---
title: How to open androind on arch linux with i3
publishDate: 2026-02-13
---

I3 is based on X11. So we have to use `weston` to run android on it.

Just start `weston`.

```bash
weston
```

In new window click terminal icon in top left corner and run:

```bash
waydorid session start
```

after few seconds you will see `Android with user 0 is ready` in terminal.

In next terminal inside of `weston` run:

```bash
waydroid show-full-ui
```

And you will see android on your screen.

### Move your files from linux to android

Set correct permissions for media folder.

```bash
sudo chmod 755 ~/.local/share/waydroid/data/media
sudo chmod 755 ~/.local/share/waydroid/data/media/0
```

Now you can copy files from linux to android using `cp` command.

```bash
sudo cp ~/path-to-your-file ~/.local/share/waydroid/data/media/0/Download/
```

And you will see your file in android `Downloads` folder.

## Older Android versions

```bash
paru -S genymotion
```

Open `genymotion`, login to your account and download android image. Then start it.

This way is better for older android versions like Pixel 1 with Android 5.
