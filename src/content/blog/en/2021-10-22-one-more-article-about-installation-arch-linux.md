---
author: Daniel Gustaw
canonicalName: one-more-article-about-installation-arch-linux
coverImage: http://localhost:8484/665af0e9-93eb-47ce-b4d5-1d60c8d644ae.avif
description: Installing Arch Linux teaches me something new every time about disks, networks, and operating systems. I recommend it to you if you want a system tailored to your needs.
excerpt: Installing Arch Linux teaches me something new every time about disks, networks, and operating systems. I recommend it to you if you want a system tailored to your needs.
publishDate: 2021-10-22T01:24:19.000Z
slug: en/another-post-about-installing-arch-linux
tags: ['arch', 'linux']
title: Another installation guide for Arch Linux (i3)
updateDate: 2021-10-30T12:31:37.000Z
---

Arch Linux is a system that I love for its flexibility and usability. Its installation is considered one of the more difficult ones because it places the burden of deciding on many details on us, which we don't worry about during our daily work with the computer.

For example, let's consider the choice of a DHCP client, which allows us to obtain an IP address, subnet mask, default gateway address, and DNS server addresses. There are two available programs for handling the DHCP protocol. It’s up to you which one you choose to install:

[Network configuration (English) - ArchWiki](https://wiki.archlinux.org/title/Network_configuration_(English)#DHCP)

We make more of these kinds of decisions during the installation of Arch Linux, so the best source of knowledge will always be ArchWiki. This article aims to show my installation, which you can replicate in full or select valuable elements from it and incorporate them into your own fitting installation.

The installation will be shown on both UEFI and BIOS computers.

Next, we will discuss:

1. Connecting to a Wi-Fi network
2. Installing the system
3. Installing the window manager `i3-gaps`
4. Configuring `i3` and basic programs

The core of the installation is depicted in the graphic below, but some commands may differ for us.

![](http://localhost:8484/b49cea1e-c602-46e3-a908-0b3470ec06a0.avif)

## Preparing a Bootable USB Drive

We can download the Arch ISO image from torrents:

[Arch Linux - Downloads](https://archlinux.org/download/)

However, since CDs are no longer used, the default action is to write it to USB. To do this, we insert the USB drive into the computer and check what name it received using one of the commands `dmesg | grep Attached`, `df -h`, or `lsblk`.

![](http://localhost:8484/d4303721-d034-4dc5-9b98-2aa9ae5553b2.avif)

In our case, it is `sde`. We unmount the USB stick with the command:

```
sudo umount /dev/sde1
```

After that, we upload the `iso` image from the directory to the pendrive.

```
sudo dd bs=8M if=arch.iso of=/dev/sde status=progress
```

After inserting the pendrive into the target machine and starting it, you usually need to use `F12` during startup, but it depends on the computer model and BIOS settings.

If successful, we should see:

![](http://localhost:8484/049176bc-bcf4-4774-9275-0edd0d980b37.avif)

After confirming with `ENTER`, we will be taken to the installer console

## Connecting to wifi using iwctl

Establishing an internet connection is our first task.

We will start with a list of available devices, type `iwctl`, and then `device list`.

![](http://localhost:8484/553974c5-3944-43e7-9e25-0034204bae17.avif)

The list of networks is available by entering `station wlan0 get-networks`

![](http://localhost:8484/c6e726d4-85d0-4e02-ba9c-a0d281641f5b.avif)

We connect to the selected network using the command `station wlan0 connect TP-Link_CEC8` and enter the password.

In the case of a very old Acer Aspire One laptop - I had a wifi driver error and had to connect via ethernet.

[Arch Linux (dual boot with Win 10). Kernel panic - not syncing: Fatal exception in interrupt. Caps Lock indicator blinking until reboot](https://superuser.com/questions/1581961/arch-linux-dual-boot-with-win-10-kernel-panic-not-syncing-fatal-exception/1582265#1582265)

To exit `iwctl`, we type `quit`.

To check if we have established a connection correctly, we can use

```
ping -c 3 google.com
```

# Arch Installation

We install `reflector`

```
pacman -Sy reflector
```

Updating the repository list

```
reflector -c "Poland" --latest 5 --sort rate --save /etc/pacman.d/mirrorlist
```

If your internet is slow, add the flag `--download-timeout`, e.g.:

```
reflector -c "Poland" --latest 5 --sort rate --download-timeout 60 --save /etc/pacman.d/mirrorlist
```

Using `fdisk -l` or `lsblk` to display available disks

If we see an error

```
GPT PMBR size mismatch will be corrected by w(rite)
```

we fix it by entering

```
parted -l
```

and then `fix`.

Partitions can be set up with the command

```
cfdisk /dev/sda
```

Of course, the disk address may be different for you than `/dev/sda`. We choose the type `linux (x86)`.

Now we need to determine whether we are installing a bootable system from BIOS or through UEFI. If we're unsure, let's check if our motherboard supports UEFI, and if so, it's better to choose UEFI. If you have a new computer, you can skip the "BIOS" section and go to "UEFI".

### BIOS

On older computers, we will use BIOS. With the program `cfdisk` or `fdisk`, we can set:

* bootable partition sda1 with type 83 Linux
* non-bootable partition sda2 with type 82 Linux Swap

![](http://localhost:8484/88eda6fa-37ae-43a2-b5ce-9ea43ef00fcd.avif)

We format the created partition

```
mkfs.ext4 /dev/sda1
```

We mount the ready partition to `/mnt`

```
mount /dev/sda1 /mnt
```

We can now skip the "UEFI" section and move on to "Pacstrap"

### UEFI

In the case of UEFI, we need to prepare a GPT table. You can use the more user-friendly program `cfdisk`, or the more advanced `fdisk`. Below I show this in `fdisk`.

```
fdisk /dev/sda
```

selecting option `g`

Creating `uefi` partition by choosing `n` (new), `ENTER` (do not change the first sector), `+200M` (setting the last sector to `+ 200 MB`).

Setting the type to `EFI System` by using `t` (as type), `1` (type number `EFI System`).

Creating the second partition `n` (new), `ENTER` (default number 2), `ENTER` (default starting block), `ENTER` (default ending block).

Saving changes by selecting `w`.

Formatting the UEFI partition to `fat 32`

```
mkfs.fat -F32 /dev/sda1
```

Formatting the file system of the second partition to `ext4`:

```
mkfs.ext4 /dev/sda2
```

We mount the partition to the system in the directory `/mnt`.

```
mount /dev/sda2 /mnt
```

And the UEFI partition to `/mnt/boot`, we first need to create this directory.

```
mkdir /mnt/boot
```

and now install

```
mount /dev/sda1 /mnt/boot
```

Thanks to the `slblk` command, we can check if the mounting is correct.

### Pacstrap

And we install the system using the `pacstrap` command.

```
pacstrap /mnt base linux linux-firmware nano
```

Generating the `fstab` file.

```
genfstab -U /mnt >> /mnt/etc/fstab
```

Entering the installed system

```
arch-chroot /mnt /bin/bash
```

### Swapfile

Preparing swap:

```
fallocate -l 2GB /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

We add to `/etc/fstab`

```
/swapfile none swap defaults 0 0
```

### Time Zone

We set the time zone

```
ln -sf /usr/share/zoneinfo/Europe/Warsaw /etc/localtime
```

Generating `adjtime` to synchronize the system clock with the hardware clock

```
hwclock --systohc
```

### Language

We will set the locale by commenting out one of the lines in the `locale.gen` file.

```
nano /etc/locale.gen
```

We generate language support

```
locale-gen
```

In the file `/etc/locale.conf` we enter `LANG=pl_PL.UTF-8`

```
echo LANG=pl_PL.UTF-8 > /etc/locale.conf
```

And in `/etc/vconsole.conf`

```
KEYMAP=pl
FONT=Lat2-Terminus16
FONT_MAP=8859-2
```

### Network

In `/etc/hostname` we set the hostname. This is the name of our computer - useful if we have multiple devices on the local network.

In `/etc/hosts` we add lines

```
127.0.0.1    localhost localhost.localdomain    preciselab
```

the third column contains the hostname previously selected.

We install `networkmanager`.

```
pacman -S networkmanager kea
```

We enable the `NetworkManager` service

```
systemctl enable NetworkManager
```

### Useful Packages

It is an individual decision what other packages the system should include. I will list and describe several that I recommend.

* network-manager-applet - frontend for managing network connections
* wireless_tools - open project sponsored by HP - contains tools such as iwconfig iwlist iwspy wipriv and ifrename for handling wifi networks
* wpa_supplicant - support for encrypted wifi WEP, WPA, WPA2 and WPA3 - essential today
* dialog - package for displaying dialog windows from bash scripts, required for using wifi-menu
* netctl - console tool for managing networks (includes wifi-menu)
* os-prober - tool for detecting other operating systems and devices, useful if grub does not see them
* base-devel - set of packages for compilation, text processing and compression
* linux-headers - scripts for building kernel modules
* reflector - script for automating the selection of mirror servers
* git - version control system used for programming and installing packages
* cups - printer management system developed by Apple
* xdg-utils - utility tools for XDG MIME applications
* xdg-user-dirs - tool for integrating the user directory with other programs, particularly useful for file managers
* openssh - software for connecting via ssh
* iwd - tool for connecting to the network e.g. via iwctl

We can install them with the command:

```
pacman -S network-manager-applet wireless_tools wpa_supplicant dialog netctl os-prober base-devel linux-headers reflector git cups xdg-utils xdg-user-dirs openssh iwd
```

If you want to use Bluetooth, you will also need `bluez bluez-utils`.

Now we will install the bootloader so that the system can start correctly. Depending on whether you chose the BIOS or UEFI option, proceed to the appropriate section.

### Boot loader in BIOS

Installing the bootloader

```
pacman -S grub
```

we use the command `grub-install`

```
grub-install /dev/sda --force
```

and we create the grub configuration file

```
grub-mkconfig -o /boot/grub/grub.cfg
```

### Boot loader in UEFI

Installing the bootloader

```
pacman -S grub efibootmgr
```

we use the command `grub-install`

```
grub-install --target=x86_64-efi --efi-direcotry=/boot --bootloader-id=GRUB
```

in case of error

> this GPT partition label contains no BIOS Boot Partition

we fix it with the command

```
parted /dev/sda
set 1 boot off
set 1 bios_grub on
q
```

[grub2-install: “this GPT partition label contains no BIOS Boot Partition”](https://superuser.com/a/1610045/1216455)

In case of the error

> "EFI variables are not supported on this system"

we exit `chroot` by `exit` and type

```
modprobe efivars
```

[“EFI variables are not supported on this system”](https://unix.stackexchange.com/a/91623/431667)

If we see the error

> Module efivars not found in directory /lib/modules/5.10.3-arch1-1

we need to restart the computer in efi mode. This is because some machines can choose to boot in bios or efi mode.

The documentation says that we can check if it works by typing:

```
efivar-tester
```

but I do not recommend this method, it loops infinitely for me and can only be turned off by powering off the computer.

We create a configuration file for grub

```
grub-mkconfig -o /boot/grub/grub.cfg
```

### Users

To be able to use the system on a daily basis without root permissions while quickly acquiring them, we will install sudo.

```
pacman -S sudo
```

Setting a password for `root`

```
passwd root
```

Adding a user for daily use

```
useradd -m -g users -G wheel -s /bin/bash daniel
```

We give it a password

```
passwd daniel
```

We allow the `wheel` group to use `sudo`.

```
EDITOR=nano visudo
```

we remove the comment before the line

```
%wheel ALL=(ALL) ALL
```

We exit the installer

```
exit
```

Unmounting the partition

```
umount /mnt
```

Turning off the computer

```
shutdown -P now
```

### Network Issues

If after entering

```
ip addr
```

interfaces are disabled, they can be enabled by

```
ip link set dev <interface> up
```

To check which interfaces are worth enabling, `nmcli` may be useful.

If you can't enable the interface but know the name and password of the network, you can try a direct connection by following the recommendations from the link:

[how do I attach devices to connections using nmcli?](https://unix.stackexchange.com/a/613819/431667)

I have no idea why this works.

If domain name resolution to IP addresses is not working correctly, we need to choose the default DNS. We set this in

```
/etc/resolv.conf
```

typing

```
nameserver 8.8.8.8
```

We will check the status of the service responsible for assigning IP addresses to domains with the command.

```
systemctl status systemd-resolved.service
```

### Key Errors

If we have errors such as

> Signature is unknown trust

We can check the given key

```
pacman-key -l Thorsten
```

and if it has expired, refresh the key list

```
pacman-key --refresh-keys
```

[Podpis jest nieznanym zaufaniem \[ROZWIĄZANE\] / Problemy z Pacmanem i aktualizacją pakietów / Fora Arch Linux]

![](https://bbs.archlinux.org/style/ArchLinux/favicon.ico)

![](https://bbs.archlinux.org/img/avatars/27289.jpg?m&#x3D;1572193439)](https://bbs.archlinux.org/viewtopic.php?id&#x3D;207957)

### Installation of yay

Yay is an auxiliary program for managing dependencies. If you have installed `base-devel`, you can download yay using git.

```
git clone https://aur.archlinux.org/yay.git
```

and install with commands

```
cd yay && makepkg -si
```

# I3 Installation

The window manager itself is installed with the command

```
yay -S i3
```

You need to add a font and a bar to it.

```
yay -S ttf-dejavu i3status
```

We install `xorg`.

```
yay -S xorg xorg-xinit rxvt-unicode
```

And drivers for your card. You can check the card type with the command `lspci | grep VGA`.

For the `AMD/ATI RV370 [Radeon X300]` card, it is

```
yay -S xf86-video-ati
```

For `nvidia`, these will be:

```
yay -S nvidia nvidia-utils
```

For `Atom Processor Integrated Graphics Controller` it is

```
yay -S xf86-video-intel
```

If you don't know which package to install for your card, I recommend looking for it on the page:

[Xorg - ArchWiki](https://wiki.archlinux.org/title/xorg)

To support sound, we also add `alsa-utils`, `pulseaudio`, and `pavucontrol`

```
yay -S alsa-utils pulseaudio pavucontrol
speaker-test -c2
alsamixer
```

Editing the file

```
nano /etc/X11/xinit/xinitrc
```

commenting lines

```
#twm &
#exec xterm ....
```

and adding at the end

```
exec i3
```

now we can enable graphic mode by typing

```
startx
```

We confirm the generation of the configuration by pressing `ENTER` and confirm the `win` key as the main key.

## I3 and rxvt-unicode Configuration

A valuable introduction to `i3` was recorded by `Distroverse`:

I based my configuration on it. You can find it in the repository

[my-arch-i3-config/config at main · gustawdaniel/my-arch-i3-config](https://github.com/gustawdaniel/my-arch-i3-config/blob/main/.config/i3/config)

but I recommend you to look through several different configurations and read the i3 documentation, which is one of the better window manager documentation.

Meanwhile, we will take care of the terminal `urxvt-unicode`. I recommend this video

We move to the home directory

```
cd ~
```

Creating Configuration

```
touch .Xresources
```

we can paste one of the ready configurations into this file

```
curl https://raw.githubusercontent.com/gustawdaniel/my-arch-i3-config/main/.Xresources > .Xresources
```

but I recommend reading several different comparisons or watching videos that explain the possible options in detail and selecting the ones that are best for us.  

The command for reloading the configuration is

```
xrdb ~/.Xresources
```

### Browser

We install the browser, the choice of which is once again yours. In the case of a fantastic browser: Zen. It is:

```
yay -S zen-browser-bin
```

The first add-on is `Ublock Origin`.

### Polish keyboard layout in X11

To use Polish characters, in the graphical environment set the keyboard layout by inserting the configuration into the file `/usr/share/X11/xorg.conf.d/10-keyboard.conf`

```
Section "InputClass"
    Identifier "system-keyboard"
    MatchIsKeyboard "on"
    Option "XkbLayout" "pl"
EndSection
```

### Launcher

The simplest launcher is `dmenu`. We install it with the command

```
yay -S dmenu
```

and we use it by the key combination `super+d`

### Screenshots

In my opinion, the best is `flameshot`. We install it with the command

```
yay -S flameshot
```

In the `i3` configuration, we can link it to the `print screen` button.

```
bindsym Print exec flameshot gui
```

### Controlling Other Computers

If we are using multiple computers and want to control them using one mouse and keyboard on all computers, we can install `barrier`.

```
yay -S barrier
```

On the client device, we set the server ID:

![](http://localhost:8484/7e58151b-96fb-4217-b7f7-49a5552900a8.avif)

And on the server:

![](http://localhost:8484/254f446b-c536-4626-ad8e-9461988b6c96.avif)

We indicate where the client will be positioned relative to our computer.

![](http://localhost:8484/270694f4-09f0-4dfd-af1c-6d7332690f0a.avif)

In case of connection setup issues, turning both computers off and on always helped.

### Oh my zsh

Zsh is an alternative shell to `bash` with greater customization and extension options. We install it with the command:

```
yay -S zsh
```

Next, we install `oh my zsh`.

```
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

### Wallpaper

We will start by checking the resolution of the monitors with the command

```
 xrandr --listmonitors
```

We download the wallpaper in the appropriate size and save it to a file

```
.config/i3/.bg.jpeg
```

We install `feh` with the command

```
yay -S feh
```

We write a script to set the wallpaper in the `.fehbg` file.

```
#!/bin/sh
feh --no-fehbg --bg-scale '/home/daniel/.config/i3/.bg.jpeg'
```

We give it rights to run

```
sudo chmod +x ~/.fehbg
```

in `.config/i3/config` we enable it with the command

```
exec --no-startup-id sh ~/.fehbg
```

### Neovim

A slightly more comfortable version of `vim`.

```
yay -S neovim
```

### Synchronization of the System Clock

If there is a discrepancy in the date or time, it is worth enabling synchronization with servers that indicate the correct time.

```
sudo timedatectl set-ntp true
```

### Resource Monitoring

For checking CPU usage and temperature, used RAM, network transfer - that is, overall monitoring, I recommend `bashtop`.

```
yay -S bashtop
```

![](http://localhost:8484/87e08fbb-de98-4348-9169-9543d9a8aab4.avif)

### Display Manager

The program in which I select the session type and enter my login and password is `ly`.

```
yay -S ly
sudo systemctl enable ly.service
```

![](http://localhost:8484/9be76f2f-1843-4219-990f-9d5c1b422fd1.avif)

### Tmux and Tmuxinator

To manage sessions, windows, and window splitting in the terminal, I use `tmux`.

```
yay -S tmux ruby
gem install tmuxinator
```

His configuration:

![](http://localhost:8484/8f6de7c2-8c6f-458c-8c65-43ff23ca8d7e.avif)

### Bitwarden

I used `keeweb` for password management. I am currently using `bitwarden`:

```
yay -S bitwardern
```

the following configuration in the file `~/.config/i3/config` is responsible for managing its visibility:

```
exec --no-startup-id bitwarden
bindsym $Mod+k [instance="bitwarden"] scratchpad show; [instance="bitwarden"] move position center
for_window [instance="bitwarden"] move scratchpad
for_window [instance="bitwarden"] border pixel 3
for_window [instance="bitwarden"] resize set 800 600
```

![](http://localhost:8484/4d133afa-efe5-4cf9-acaa-72970b4f0ac5.avif)

## Our Arch Linux with i3 is ready

We might still lack an `IDE` for effective work if we are programmers or `obs` if we are recording videos or graphic editing programs. However, we can consider the system and basic programs as ready.

If you think some programs are missing from the list, or you see places where something could be simplified, let us know in the comments.

![](http://localhost:8484/f28189da-1303-474d-a73f-0eaa5eae884b.avif)
