---
title: How to install arch with uefi?
publishDate: 2024-10-31
---

Lets assume we have the following partitions

```
lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
loop0         7:0    0 794.4M  1 loop /run/archiso/airootfs
sda           8:0    1  29.3G  0 disk
├─sda1        8:1    1  29.3G  0 part
│ └─ventoy  254:0    0   1.1G  0 dm
└─sda2        8:2    1    32M  0 part
nvme0n1     259:0    0   1.9T  0 disk
├─nvme0n1p1 259:7    0     2G  0 part
└─nvme0n1p2 259:8    0   1.9T  0 part
nvme1n1     259:1    0   1.9T  0 disk
└─nvme1n1p1 259:4    0   1.9T  0 part
```

We can prepare them by `fdisk` (cli) or `cfdick` (gui).

# Fdisk - partitions preparation

```
fdisk /dev/nvme0n1
```

G to create GPT disk

```
g
Created a new GPT disklabel
```

n to create new partition

```
n
Partition number (1-128, default 1)
```

ENTER (default numbers are ok)

```
First sector (2048-4000797326, default 2048
```

ENTER (default first sector is ok)

```
Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-4000797326, default 4000796671):
```

we typing

```
+2G
```

you can find also advices to set +200M, +500M or +1G but I prefer +2G to avoid potential problems with space.

Then type of partition. We can list all types by `l`

```
Partition type or alias (type L to list all): L
  1 EFI System                     C12A7328-F81F-11D2-BA4B-00A0C93EC93B
  2 MBR partition scheme           024DEE41-33E7-11D3-9D69-0008C781F39F
  3 Intel Fast Flash               D3BFE2DE-3DAF-11DF-BA40-E3A556D89593
  4 BIOS boot                      21686148-6449-6E6F-744E-656564454649
 ...
 19 Linux swap                     0657FD6D-A4AB-43C4-84E5-0933C84B4F4F
 20 Linux filesystem               0FC63DAF-8483-4772-8E79-3D69D8477DE4
```

For EFI we need `EFI System`

So value is `1`

```
1
```

Second will by root partition

```
n ENTER ENTER ENTER
```

We are writing by `w`.

Second disk for `/home`.



```
fdisk /dev/nvme1n1
```

```
g n ENTER ENTER ENTER
```

we should see

```
Created a new partition 1 of type 'Linux filesystem' and of size 1.9 TiB.
Partition #1 contains a ext4 signature.
```

Finally to save

```
w
```

# Mounting before pacstrap

```
mkdir /mnt/boot
mkdir /mnt/boot/efi
mkdir /mnt/home
mount /dev/nvme0n1p2 /mnt
mount /dev/nvme0n1p1 /mnt/boot/efi
mount /dev/nvme1n1p1 /mnt/home
```

you can verify by

```
genfstab -U /mn
```

you should see

```
# /dev/nvme0n1p2
UUID=2fe58f5b-f4d3-4c5b-9df1-441dbc1c9533	/         	ext4      	rw,relatime	0 1

# /dev/nvme0n1p1
UUID=BBD9-757F      	/boot/efi 	vfat      	rw,relatime,fmask=0022,dmask=0022,codepage=437,iocharset=ascii,shortname=mixed,utf8,errors=remount-ro	0 2

# /dev/nvme1n1p1
UUID=4c36344b-48b7-4c4d-9843-a43bb87d8260	/home     	ext4      	rw,relatime	0 2
```

# Pacstrap

```
pacstrap /mnt base linux linux-firmware nano
```

# Fstab

```
genfstab -U /mnt >> /mnt/etc/fstab
```

# Chroot

```
arch-chroot /mnt /bin/bash
```

# Timezone

```
ln -sf /usr/share/zoneinfo/Europe/Warsaw /etc/localtime
hwclock --systohc
```

# Hostname

For hostname `rog`:

```
echo "rog" > /etc/hostname
```

# Hosts

```
echo "127.0.0.1    localhost localhost.localdomain    rog" >> /etc/hosts
```

# Network manager

```
pacman -S networkmanager kea
systemctl enable NetworkManager
```

# Packages

```
pacman -S network-manager-applet wireless_tools wpa_supplicant dialog netctl os-prober base-devel linux-headers reflector git xdg-utils xdg-user-dirs openssh iwd
```

1. network-manager-applet

   Purpose: Provides a graphical interface (system tray applet) to manage NetworkManager connections, making it easier to connect to Wi-Fi, VPN, Ethernet, and other networks in a desktop environment.
   Disadvantage: Without it, network management must be done manually (e.g., with nmcli in the terminal) or through another GUI if available, which can be less convenient, especially for desktop users who frequently switch networks.

2. wireless_tools

   Purpose: Includes command-line tools (iwconfig, iwlist, etc.) for configuring and managing wireless networks.
   Disadvantage: Without this, certain legacy Wi-Fi commands won’t be available. Though newer tools (iw, nmcli) cover most modern needs, wireless_tools is still sometimes necessary for troubleshooting or managing older wireless cards.

3. wpa_supplicant

   Purpose: Handles authentication for Wi-Fi networks, especially those requiring WPA/WPA2 (most modern Wi-Fi networks).
   Disadvantage: Without wpa_supplicant, connecting to secure Wi-Fi networks is impossible, as it’s essential for authenticating connections. Some network management tools require it, and even iwd may need it for compatibility in specific setups.

4. dialog

   Purpose: Provides a way to display simple text-based dialog boxes in the terminal, often used by scripts and command-line installers to prompt users.
   Disadvantage: Without dialog, scripts that rely on it won’t be able to show prompts, which can make certain configurations harder. Tools like archinstall and some system management scripts may fail or have reduced functionality without it.

5. netctl

   Purpose: A profile-based network manager for Arch Linux, allowing you to configure network connections through profiles.
   Disadvantage: While NetworkManager or iwd can manage networks, netctl is lightweight and highly configurable. Not installing it limits networking options, especially if you prefer or need a profile-based, systemd-integrated approach without using NetworkManager.

6. os-prober

   Purpose: Detects other operating systems (like Windows or other Linux installations) on the system, useful for adding them to the bootloader (e.g., GRUB).
   Disadvantage: Without os-prober, GRUB won’t automatically detect and add entries for other operating systems on the same machine, making dual-boot setups more challenging. Manual configuration would be required to boot other OSs.

7. base-devel

   Purpose: A meta-package containing essential development tools like gcc, make, patch, etc., needed to compile software and build Arch packages from the AUR (Arch User Repository).
   Disadvantage: Without base-devel, compiling software or installing packages from the AUR is practically impossible. Arch users often rely on AUR for additional software, and missing base-devel limits customization and access to non-official packages.

8. linux-headers

   Purpose: Provides the kernel headers required to build kernel modules, like drivers for certain hardware (e.g., Wi-Fi adapters, graphics cards).
   Disadvantage: Without linux-headers, you can’t build or install kernel modules, which can prevent certain hardware from functioning correctly, especially if it requires third-party drivers.

9. reflector

   Purpose: A tool to update the pacman mirrorlist by selecting the fastest and most up-to-date Arch mirrors.
   Disadvantage: Without reflector, you may have slower or outdated mirrors in your mirrorlist, leading to slower package downloads and potential issues accessing the latest updates. Manual mirror management becomes necessary to maintain speed and reliability.

10. git

    Purpose: A version control tool, crucial for cloning repositories, especially for the AUR where many packages are hosted on GitHub or GitLab.
    Disadvantage: Without git, cloning repositories is impossible, limiting your ability to access AUR packages or version-controlled projects. This impacts software development, collaboration, and access to code.

11. xdg-utils

    Purpose: A set of utilities to help applications integrate with the desktop environment (e.g., opening links in the default browser, handling default file associations).
    Disadvantage: Without xdg-utils, some applications may not work as expected, especially those that rely on opening files or URLs with the system’s default applications. This can reduce the overall integration and smoothness of the desktop environment.

12. xdg-user-dirs

    Purpose: Manages standard user directories like Documents, Downloads, Music, etc.
    Disadvantage: Without xdg-user-dirs, these directories won’t be automatically created or managed, which can make the file structure less organized. Some applications rely on these standard directories, so missing them can cause minor issues with file saving and management.

13. openssh

    Purpose: Provides the OpenSSH client and server for secure remote access and file transfer.
    Disadvantage: Without openssh, you can’t SSH into or from the machine, which can hinder remote management, file transfers, and development workflows that require SSH access (e.g., Git over SSH).

14. iwd

    Purpose: An alternative to wpa_supplicant, providing a simpler and sometimes faster Wi-Fi daemon developed by Intel.
    Disadvantage: Without iwd, you’re limited to wpa_supplicant for Wi-Fi management. While wpa_supplicant is standard, iwd is more modern, often lighter, and integrates well with NetworkManager, offering an alternative for those needing advanced Wi-Fi management.

# Grub

```
pacman -S grub efibootmgr
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg
```

# Users

```
pacman -S sudo
```

Set root password

```
passwd root
```

Add user

```
useradd -m -g users -G wheel -s /bin/bash daniel
```

set password for him

```
passwd daniel
```

Allow sudo for wheel group

```
EDITOR=nano visudo
```

uncomment line

```
%wheel ALL=(ALL) ALL
```

Close instalator

```
exit
```

Unmount partition

```
umount /mnt
```

Shutdown computer

```
shutdown -P now
```

Remove USB and boot from disk.