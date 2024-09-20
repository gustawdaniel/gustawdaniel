---
title: How I used GPT-3 to solve my issues with OBS and Davinci Resolve problems with MKV format
slug: how-i-used-gpt-3-to-solve-my-issues-with-obs-and-davinci-resolve-problems-with-mkv-format
publishDate: 1970-01-01T00:00:00.000Z
date_updated: 2023-01-21T13:56:18.000Z
draft: true
---

I see value in creation content that in affordable and helpful for other people. From this reason I switched from Polish language to English and now considering move from text content to video.

I did research in topics of software to screen-cast and edit videos. Best options that I found were:

* OBS - for screen and camera recording
* Davinci Resolve - for editing

Unfortunately my screen-casting program OBS produce `mkv` format, that is too complicated for Davinci Resolve. Exact reason:

> One of the greatest things about MKV as a format is the sheer amount of stuff it can contain - you can have multiple subtitles in there, multiple audio tracks and even multiple video tracks. But that's just a bloody nightmare to try to handle in editing software.

is explained here:

[Transcode and Import MKV to DaVinci Resolve

Failed to import MKV files to DaVinci Resolve 10/11/12/13/14/15/16 for further editing? Don’t worry! An easy way is to transcode MKV to DaVinci Resolve compatible video formats. Below is the how to.

![](https://www.easefab.com/favicon.ico)EaseFab - Best DVD/Blu-ray Ripper/Copy Software, Video Converter and iPhone Data Recovery Software Provider | OFFICIALMKV Tips

![](https://www.easefab.com/images/icon_download.png)](https://www.easefab.com/mkv-tips/import-mkv-to-davinci-resolve.html)

I was trying to change settings of `OBS` to produce formats supported by `Davinci Resolve` but without success. I was trying to convert `MKV` to different formats and then import them, but this also failed. Additionally Davinci Resolve 100% load on 2 CPU cores on my computer, even in iddle state so finally I decided to find replacement for it.

## Why using google failed

I started as usual from typing

```
davinci resolve alternatives
```

to google and seen this:

![](__GHOST_URL__/content/images/2023/01/Zrzut-ekranu-z-2023-01-21-14-01-42.png)

from my previous research I remembered that for many people these programs can satisfy criteria, but i wanted:

* free software
* programs working on linux

I know that in case of **`Adobe Premiere Pro`**it is both paid and does not support linux. It is easy to check that further programs also have paid versions or trial and I can expect only part of them works on linux.

Google is great tool but these results are not personalized. It build average ranking of pages. On these pages authors build average ranking of programs. For any of these programs I have to build my own ranking reading about them, but it takes time, so cost of research like this can be huge.

## In this moment magic with GPT-3 started

I remembered how GPT-3 helped me pick queue system worth to learn and decide to use them as searching engine with filters defined by natural language.

My firs question was:

> software similar to davinci resolve that is free and works on linux

GPT answered:

Some free, open-source video editing software that works on Linux include:

* Blender (blender.org)
* Lightworks ([www.lwks.com](http://www.lwks.com/))
* Shotcut (shotcut.org)
* OpenShot ([www.openshot.org](http://www.openshot.org/))
* Pitivi ([www.pitivi.org](http://www.pitivi.org/))

Please note that some of them may have different capabilities and workflows compared to DaVinci Resolve. It's recommended to check their features and compatibility with your system before installing.

---

This list looks nice, but I rememer that `Blender` was good for `3D` and animations, physics. Every tutorial of blender starts from drawing sphere and lighting them from differens sides and finish on building tower and destroying them by spherical bullets.

So I described to GPT-3 what exactly content I want to produce.

> i am going to edit video with my screencast, please describe programs mentioned in previous answer in this context and select best one

Now answer was more comprehensive:

All of the programs I mentioned previously are capable of editing video, including screencasts. However, some may be more suitable for your specific needs than others. Here is a brief overview of each program and how they might be useful for editing screencasts:

* Blender: Blender is a powerful 3D animation and modeling program, but it also has a built-in video editor that can handle screencasts. It is a versatile and customizable tool that can handle multiple video and audio tracks, effects, and compositing. However, it has a steeper learning curve than other options, which may make it more challenging for beginners.
* Lightworks: Lightworks is a professional-grade video editing software, it is a cross-platform software and it has a free version that can be used to edit screencasts. It has advanced video and audio editing tools, effects, and support for multiple video and audio tracks. It is designed for experienced video editors and may not be as user-friendly for beginners.
* Shotcut: Shotcut is a free, open-source video editor that works on Linux. It has a simple and intuitive interface that is easy to use. It can handle multiple video and audio tracks, effects, and compositing. It also supports a wide variety of file formats, including screencasts. However, it may not have as many advanced features as some of the other options.
* OpenShot: OpenShot is a free, open-source video editor that works on Linux. It has a user-friendly interface and can handle multiple video and audio tracks, effects, and compositing. It also supports a wide variety of file formats, including screencasts. It is a good option for beginners, but may not have as many advanced features as some of the other options.
* Pitivi: Pitivi is a free, open-source video editor that works on Linux. It has a user-friendly interface and can handle multiple video and audio tracks, effects, and compositing. It also supports a wide variety of file formats, including screencasts. It is a good option for beginners, but may not have as many advanced features as some of the other options.

Based on your needs and the level of expertise, I would recommend Shotcut and OpenShot as they are easy to use and beginner friendly, while Lightworks can be a good option if you need more professional features, Lightworks is a powerful software, but it may be harder to use for someone who is new to video editing.

---

I was able to recognize in which programs should I focus and decided to install some of them.

But to install these programs I probably should go to these home pages, and find instalation instructions.

## I overestimated GPT-3 forgetting how it works

I assumed that I will take more time than asking `GPT-3` one more time:

> how to install Lightworks, shotcut and openshot on fedora linux?

Again I was **surprised positively** by answer, but did not know how wrong it is:

Installing Lightworks, Shotcut, and OpenShot on Fedora Linux can be done through the command line using the package manager. Here's how to install each of them:

Lightworks:

1. Add the Lightworks repository to your system by running the following command: `sudo dnf config-manager --add-repo https://lwks.com/rpm/lwks-repo.fedora.repo`
2. Update your package list by running: `sudo dnf update`
3. Install Lightworks by running: `sudo dnf install lightworks`

Shotcut:

1. Add the Shotcut repository to your system by running the following command: `sudo dnf config-manager --add-repo https://dl.fedoraproject.org/pub/fedora/linux/updates/32/Everything/x86_64/Packages/s/shotcut-20.12.31-1.fc32.x86_64.rpm`
2. Update your package list by running: `sudo dnf update`
3. Install Shotcut by running: `sudo dnf install shotcut`

OpenShot:

1. Add the OpenShot repository to your system by running the following command: `sudo dnf config-manager --add-repo https://openshot.org/download/openshot.repo`
2. Update your package list by running: `sudo dnf update`
3. Install OpenShot by running: `sudo dnf install openshot-qt`

Please note that the commands above are for Fedora 32, for other versions of Fedora you need to use the appropriate repository. Additionally, these commands also assume that you have administrative privileges on your system.

---

All these methods was incorrect or outdated. But I asked about script to install them:

> prepare bash script that execute all commands mentioned in previous answer

and recived

Here is a bash script that will install Lightworks, Shotcut, and OpenShot on Fedora Linux using the commands I provided in my previous answer:

```bash
#!/bin/bash

# Add Lightworks repository
sudo dnf config-manager --add-repo https://lwks.com/rpm/lwks-repo.fedora.repo

# Add Shotcut repository
sudo dnf config-manager --add-repo https://dl.fedoraproject.org/pub/fedora/linux/updates/32/Everything/x86_64/Packages/s/shotcut-20.12.31-1.fc32.x86_64.rpm

# Add OpenShot repository
sudo dnf config-manager --add-repo https://openshot.org/download/openshot.repo

# Update package list
sudo dnf update

# Install Lightworks
sudo dnf install lightworks

# Install Shotcut
sudo dnf install shotcut

# Install OpenShot
sudo dnf install openshot-qt
```

Please note that the script above is for Fedora 32, for other versions of Fedora you need to use the appropriate repository. Additionally, these commands also assume that you have administrative privileges on your system.

You can save the script on your computer with the .sh extension, for example "install\_editors.sh" and then make it executable by running `chmod +x install_editors.sh` and then you can run it by `./install_editors.sh`

---

It is nice but I fixed it by

> fix it adding option to dnf that will automaticly install packages without asking for confirmations

now I received better script:

```bash
#!/bin/bash

# Add Lightworks repository
sudo dnf config-manager --add-repo https://lwks.com/rpm/lwks-repo.fedora.repo

# Add Shotcut repository
sudo dnf config-manager --add-repo https://dl.fedoraproject.org/pub/fedora/linux/updates/32/Everything/x86_64/Packages/s/shotcut-20.12.31-1.fc32.x86_64.rpm

# Add OpenShot repository
sudo dnf config-manager --add-repo https://openshot.org/download/openshot.repo

# Update package list
sudo dnf update -y

# Install Lightworks
sudo dnf install lightworks -y

# Install Shotcut
sudo dnf install shotcut -y

# Install OpenShot
sudo dnf install openshot-qt -y
```

I forget on which version of fedora I am working so I asked as total noob:

> how to check my fedora version, show only command without description

answer was:

```
cat /etc/fedora-release
```

so in next iteration a send command:

> update previous script to fedora 36

and now I have seen

```
#!/bin/bash

# Add Lightworks repository
sudo dnf config-manager --add-repo https://lwks.com/rpm/lwks-repo.fedora.repo

# Add Shotcut repository
sudo dnf config-manager --add-repo https://dl.fedoraproject.org/pub/fedora/linux/updates/36/Everything/x86_64/Packages/s/shotcut-20.12.31-1.fc36.x86_64.rpm

# Add OpenShot repository
sudo dnf config-manager --add-repo https://openshot.org/download/openshot.repo

# Update package list
sudo dnf update -y

# Install Lightworks
sudo dnf install lightworks -y

# Install Shotcut
sudo dnf install shotcut -y

# Install OpenShot
sudo dnf install openshot-qt -y
```

After executing this and seeing a lot of errors I finished asking `GPT-3` about

* how to remove old repository from fedora
* how to automatically remove failing repositories in fedora linux

these responses are trash and does not works... so making long story short I installed these programs using google and checking homepages.

Shotout by `snap`

```
sudo snap install shotcut --classic
```

Lightworks following after https://computingforgeeks.com/install-lightworks-video-editor-on-fedora/
