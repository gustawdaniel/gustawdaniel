---
author: Daniel Gustaw
canonicalName: ranger
description: ranger wow!
image:
  alt: Ranger.
  url: https://docs.astro.build/assets/arc.webp
publishDate: 2024-08-12
tags:
- ranger
- blogging
title: ranger
---


# Nodejs

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 22
corepack enable pnpm
```

# Ranger

Ranger [user guide](https://github.com/ranger/ranger/wiki/Official-user-guide)

Flash drive mounting: [Ranger Udisk](https://github.com/SL-RU/ranger_udisk_menu)

Cut `dd` paste `pp`.

[Cheat sheet](https://gist.github.com/heroheman/aba73e47443340c35526755ef79647eb)

# Nmcli

List wifi

```
nmcli device wifi
```

Connect

```
nmcli device wifi connect "D Block Workspace@stamba"
```

# Virtualization

```text
                                Virtbox Manager

    Virtual                         libvirt                  CLX
      Box
                   virtio         Quemu / KVM

```

Netcat

## Comparison: GNU Netcat vs. OpenBSD Netcat

### 1. GNU Netcat

**Features:**
- Known for its simplicity and ease of use.
- Basic functionalities include connecting to and listening on ports, transferring files, and executing commands.
- Lacks some of the more advanced features found in OpenBSD Netcat.
- Often considered a more lightweight version.

**Pros:**
- Simple and straightforward.
- Suitable for basic networking tasks.

**Cons:**
- Limited feature set compared to OpenBSD Netcat.
- Some users find it less secure and less versatile.

### 2. OpenBSD Netcat

**Features:**
- More feature-rich compared to GNU Netcat.
- Includes additional options such as Unix domain sockets, built-in support for TLS, and proxy connections.
- Supports more modern and secure coding practices.
- Can work in both TCP and UDP mode.
- Offers better support for IPv6.

**Pros:**
- Richer feature set and more versatile.
- Often preferred for more complex networking tasks and scripting.
- Generally considered more secure and modern.

**Cons:**
- Slightly more complex to use due to additional features.
- Can be overkill for simple tasks.

### Comparison Summary

| Feature                 | GNU Netcat            | OpenBSD Netcat         |
|-------------------------|-----------------------|------------------------|
| **Basic Networking**    | Yes                   | Yes                    |
| **Advanced Features**   | Limited               | Extensive              |
| **TLS Support**         | No                    | Yes                    |
| **Unix Domain Sockets** | No                    | Yes                    |
| **IPv6 Support**        | Limited               | Full                   |
| **Ease of Use**         | Simple                | Slightly complex       |
| **Security**            | Basic                 | Advanced               |

### Which is Better for Arch i3?

For Arch with the i3 window manager, **OpenBSD Netcat** is generally the better choice. Here's why:

- **Feature-Rich**: OpenBSD Netcat has a richer feature set which can be beneficial for advanced networking tasks.
- **Security**: It includes more modern and secure practices, which is crucial for networking utilities.
- **Flexibility**: The additional features provide more flexibility for various use cases, making it a more versatile tool.
- **Arch Compatibility**: OpenBSD Netcat is well-maintained and widely used in the Arch community, ensuring better compatibility and support.

### Installation on Arch Linux

To install OpenBSD Netcat on Arch Linux, you can use the following command:
```sh
sudo pacman -S openbsd-netcat
```

If you prefer the simpler GNU Netcat, you can install it using:

```bash
sudo pacman -S gnu-netcat
```

In conclusion, while both versions of netcat can be used effectively, OpenBSD Netcat’s advanced features, security enhancements, and greater flexibility make it a more suitable choice for users on Arch Linux with the i3 window manager.

|        Feature/Command        |           GNU Netcat           |          OpenBSD Netcat          |
|-------------------------------|--------------------------------|----------------------------------|
|     Basic Connect/Listen      |              Yes               |               Yes                |
|         File Transfer         |              Yes               |               Yes                |
|      Unix Domain Sockets      |               No               |               Yes                |
|         Proxy Support         |               No               |               Yes                |
|          TLS Support          |               No               |               Yes                |
|           Timeouts            | Yes (-w limited functionality) | Yes (-w with more functionality) |
| Zero-I/O Mode (Port Scanning) |               No               |               Yes                |
|         Verbose Mode          |            Yes (-v)            |             Yes (-v)             |
|           UDP Mode            |            Yes (-u)            |             Yes (-u)             |
|  Bind to Specific Interface   |            Yes (-s)            |             Yes (-s)             |
|  Limit Number of Connections  |               No               |             Yes (-k)             |

## LXC

```
sudo lxc-create --name statscore --template download -- --dist archlinux --release current --arch amd64
```

For error

```
netdev_configure_server_veth: 738 No such file or directory - Failed to attach "vethzOZGDW" to bridge "lxcbr0", bridge interface doesn't exist
```

### Create the Bridge Interface
   
First, you need to create the bridge interface:

```bash
sudo ip link add name lxcbr0 type bridge
sudo ip link set lxcbr0 up
```


### Assign an IP Address to the Bridge
   
Assign an IP address to the bridge so that it can be used for network communication:

```bash
sudo ip addr add 192.168.1.1/24 dev lxcbr0
```
### Enable IP Forwarding
   
Enable IP forwarding to allow network traffic to pass through the bridge:

```bash
sudo sysctl -w net.ipv4.ip_forward=1
```

To make this change permanent, you can add the following line to `/etc/sysctl.conf`:

```plaintext
net.ipv4.ip_forward = 1
```

### Configure NAT (Optional)
   
If you want your containers to access the internet, you need to set up NAT (Network Address Translation) using iptables:

```bash
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
```

Replace eth0 with the name of your actual network interface connected to the internet.

### Restart LXC Service
   
Restart the LXC service to apply the changes:

```bash
sudo systemctl restart lxc
```

### Verify Bridge Configuration

After setting up the bridge, verify that it exists and is correctly configured:

```bash
ip addr show lxcbr0
```

You should see the bridge interface with the assigned IP address.

### Start the Container
   
Now, try starting your container again:

```bash
sudo lxc-start -n statscore -F
```

# Attach to new container

```
sudo lxc-attach -n statscore
```

---

Prepare arch on lxc

Install yay

```bash
pacman -S --needed git base-devel && git clone https://aur.archlinux.org/yay.git && cd yay && makepkg -si
```

List of images

```bash
sudo lxc image list images:archlinux  architecture=$(uname -m) type=virtual-machine 
```

# Quemu

Get arch

```bash
wget https://archive.archlinux.org/iso/2024.08.01/archlinux-2024.08.01-x86_64.iso
```

create image

```bash
qemu-img create -f qcow2 Statscore.img 60G
```

startup iso on image

```bash
qemu-system-x86_64 -enable-kvm -cdrom archlinux-2024.08.01-x86_64.iso --boot order=d -drive file=Statscore.img -m 20G
```

Check disc

```bash
fdisk -l
```

Start partitioning

```bash
fdisk /dev/sda
```

then

```bash
n, ENTER x 4, w
```

where `n` means `new`, `w` is `write`, rest is default.

Format to ext4

```bash
mkfs.ext4 /dev/sda1
```

Mount

```bash
mount /dev/sda1 /mnt
```

Install base

```bash
pacstrap /mnt base base-devel
```

fstab

```bash
genfstab -U /mnt >> /mnt/etc/fstab
```

chroot

```bash
arch-chroot /mnt
```

```
pacman -S grub
```

```
grub-install /dev/sda
```

add `nomodeset` to default grub options in `/etc/grub/default`

cfg

```
grub-mkconfig -o /boot/grub/grub.cfg
```

Timezone

```bash
ln -sf /usr/share/zoneinfo/Asia/Tbilisi /etc/localtime
```

sync

```
hwclock --systohc
```

in file `/etc/vconsole.conf`

add

```text
KEYMAP=pl
FONT=Lat2-Terminus16
FONT_MAP=8859-2
```

Network

in `/etc/hostname` set hostname

in `/etc/hosts` add

```
127.0.0.1    localhost localhost.localdomain    <hostname>
```

where `<hostname>` is name in `/etc/hostname`

Install network manager

```
pacman -S networkmanager kea
```

-----

# Start arch installation 

```
ping -c 3 google.com
lsblk
cfdik -z /dev/sda
> select gpt              https://en.wikipedia.org/wiki/GUID_Partition_Table
- First partition 100M Type EFI 
- Second partition rest of dist Type Linux
> then Write
```

```
lablk
```

should show

```text
sda1 100M
sda2 rest
```

Format partitions

```
mkfs.vfat -F 32 /dev/sda1
mkfs.ext4 /dev/sda2
```

Mount

```
mount /dev/sda2 /mnt
mkdir -p /mnt/boot/efi
mount /dev/sda1 /mnt/boot/efi
```

uncomment Parallel Download in `/etc/pacman.conf`

On host

```
yay -S intel-ucode 
```

but vm using this form host so on vm use

```
pacstrap /mnt base linux linux-firmware
```

fstab

```
genfstab -U /mnt >> /mnt/etc/fstab
```

chroot

```
arch-chroot /mnt
```

install packages

```
pacman -S networkmanager grub efibootmgr
```

setup network

```
systemctl enable NetworkManager
```

install grub

```
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=arch
```

No efi vars so start form scratch

----

```
grub-install /dev/sda --force
grub-mkconfig -o /boot/grub/grub.cfg
```

then

```
passwd
exit
```

Create User

Yay installation

```
pacman -S --needed git base-devel && git clone https://aur.archlinux.org/yay.git && cd yay && makepkg -si
```

# Ricing

Resize qemu to screen size

```
xrandr --output Virtual-1 --auto
```

## Netcat connection

Install 

```
yay -S gnu-netcat
```

First

```
nc -l -p 8000
```

Second

```
nc <ip> 8000
```

## Quemu sharing

```
qemu-system-x86_64 -enable-kvm --boot order=d -drive file=Statscore.img -m 20G --smp cores=4 --cpu host --vga virtio -display sdl,gl=on -chardev qemu-vdagent,id=ch1,name=vdagent,clipboard=on -device virtio-serial-pci -device virtserialport,chardev=ch1,id=ch1,name=com.redhat.spice.0
```

Final command

```
qemu-system-x86_64 -enable-kvm --boot order=d -drive file=Statscore.img -m 20G --smp cores=4 --cpu host --vga virtio -display sdl,gl=on
```