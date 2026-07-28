---
title: Minimalistic Linux torrent movie guide
publishDate: 2024-11-24
---

Check if torrens are legal in your country. If they are, you can use the following minimalistic guide to download movies on Linux.

https://yts.mx is a good source for movies visited by [140 million users every month](https://www.semrush.com/website/yts.mx/overview/).

You can download the torrent file from the website and then use `transmission-cli` to download the movie.

```bash
transmission-cli movie.torrent
```

Then you can watch the movie with `mpv`.

```bash
mpv movie.mp4
```

or with `vlc`.

```bash
vlc movie.mp4
```

I prefer `mpv` because its ui disappear after short inactivity time. Enjoy the movie!
