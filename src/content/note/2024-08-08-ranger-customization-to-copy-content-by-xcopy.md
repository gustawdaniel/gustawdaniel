---
title: Ranger customization to copy file content with xcopy!
publishDate: 2024-08-08
---
Problem:
Ranger doesn't have shortcut for copy of file content. It was planned in release v1.9.4 https://github.com/ranger/ranger/milestone/2 in issue https://github.com/ranger/ranger/issues/1525 and there is open PR https://github.com/ranger/ranger/pull/1831 but release was delayed, what was discussed here https://github.com/ranger/ranger/issues/2702

So now we will solve this problem manually. First copy ranger config

```bash
ranger --copy-config=rc
```

we will see that config was stored in file

```bash
~/.config/ranger/rc.conf
```

so lets open it

```bash
nano ~/.config/ranger/rc.conf
```

and add lines

```bash
# Custom
map yc shell cat %p | xclip -sel clip
``` 

Now navigate to text file in ranger and type

```bash
yc
```

Finally navigate to other app and paste copied content.