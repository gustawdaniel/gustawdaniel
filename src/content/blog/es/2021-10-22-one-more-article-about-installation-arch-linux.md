---
author: Daniel Gustaw
canonicalName: one-more-article-about-installation-arch-linux
coverImage: http://localhost:8484/665af0e9-93eb-47ce-b4d5-1d60c8d644ae.avif
description: Instalar Arch Linux me enseña algo nuevo cada vez sobre discos, redes y sistemas operativos. Te lo recomiendo si deseas un sistema adaptado a tus necesidades.
excerpt: Instalar Arch Linux me enseña algo nuevo cada vez sobre discos, redes y sistemas operativos. Te lo recomiendo si deseas un sistema adaptado a tus necesidades.
publishDate: 2021-10-22T01:24:19.000Z
slug: es/otro-post-sobre-instalar-arch-linux
tags: ['arch', 'linux']
title: Otra guía de instalación para Arch Linux (i3)
updateDate: 2021-10-30T12:31:37.000Z
---

Arch Linux es un sistema que amo por su flexibilidad y usabilidad. Su instalación es considerada una de las más difíciles porque coloca la carga de decidir sobre muchos detalles en nosotros, que no nos preocupamos durante nuestro trabajo diario con la computadora.

Por ejemplo, consideremos la elección de un cliente DHCP, que nos permite obtener una dirección IP, máscara de subred, dirección de puerta de enlace predeterminada y direcciones de servidor DNS. Hay dos programas disponibles para manejar el protocolo DHCP. Depende de ti cuál elijas instalar:

[Configuración de red (Español) - ArchWiki](https://wiki.archlinux.org/title/Network_configuration_(Spanish)#DHCP)

Tomamos más de este tipo de decisiones durante la instalación de Arch Linux, así que la mejor fuente de conocimiento siempre será ArchWiki. Este artículo tiene como objetivo mostrar mi instalación, que puedes replicar en su totalidad o seleccionar elementos valiosos de ella e incorporarlos en tu propia instalación adecuada.

La instalación se mostrará en computadoras tanto UEFI como BIOS.

A continuación, discutiremos:

1. Conectándose a una red Wi-Fi
2. Instalando el sistema
3. Instalando el administrador de ventanas `i3-gaps`
4. Configurando `i3` y programas básicos

El núcleo de la instalación se representa en el gráfico a continuación, pero algunos comandos pueden diferir para nosotros.

![](http://localhost:8484/b49cea1e-c602-46e3-a908-0b3470ec06a0.avif)

## Preparando una Unidad USB Arrancable

Podemos descargar la imagen ISO de Arch desde torrents:

[Arch Linux - Descargas](https://archlinux.org/download/)

Sin embargo, dado que los CD ya no se utilizan, la acción predeterminada es escribirlo en USB. Para hacer esto, insertamos la unidad USB en la computadora y verificamos qué nombre recibió usando uno de los comandos `dmesg | grep Attached`, `df -h` o `lsblk`.

![](http://localhost:8484/d4303721-d034-4dc5-9b98-2aa9ae5553b2.avif)

En nuestro caso, es `sde`. Desmontamos la memoria USB con el comando:

```
sudo umount /dev/sde1
```

Después de eso, subimos la imagen `iso` desde el directorio al pendrive.

```
sudo dd bs=8M if=arch.iso of=/dev/sde status=progress
```

Después de insertar la pendrive en la máquina de destino y encenderla, generalmente necesitas usar `F12` durante el inicio, pero depende del modelo de la computadora y la configuración del BIOS.

Si es exitoso, deberíamos ver:

![](http://localhost:8484/049176bc-bcf4-4774-9275-0edd0d980b37.avif)

Después de confirmar con `ENTER`, seremos llevados a la consola del instalador

## Conectándose a wifi usando iwctl

Establecer una conexión a internet es nuestra primera tarea.

Comenzaremos con una lista de dispositivos disponibles, escriba `iwctl`, y luego `device list`.

![](http://localhost:8484/553974c5-3944-43e7-9e25-0034204bae17.avif)

La lista de redes está disponible ingresando `station wlan0 get-networks`

![](http://localhost:8484/c6e726d4-85d0-4e02-ba9c-a0d281641f5b.avif)

Nos conectamos a la red seleccionada usando el comando `station wlan0 connect TP-Link_CEC8` y entramos la contraseña.

En el caso de un portátil Acer Aspire One muy antiguo - tuve un error de controlador de wifi y tuve que conectarme a través de ethernet.

[Arch Linux (arranque dual con Win 10). pánico del kernel - no sincronizando: Excepción fatal en la interrupción. Indicador de Bloq Mayus intermitente hasta el reinicio](https://superuser.com/questions/1581961/arch-linux-dual-boot-with-win-10-kernel-panic-not-syncing-fatal-exception/1582265#1582265)

Para salir de `iwctl`, escribimos `quit`.

Para comprobar si hemos establecido una conexión correctamente, podemos usar

```
ping -c 3 google.com
```

# Instalación de Arch

Instalamos `reflector`

```
pacman -Sy reflector
```

Actualizando la lista de repositorios

```
reflector -c "Poland" --latest 5 --sort rate --save /etc/pacman.d/mirrorlist
```

Si tu internet es lento, añade la bandera `--download-timeout`, por ejemplo:

```
reflector -c "Poland" --latest 5 --sort rate --download-timeout 60 --save /etc/pacman.d/mirrorlist
```

Uso de `fdisk -l` o `lsblk` para mostrar discos disponibles

Si vemos un error

```
GPT PMBR size mismatch will be corrected by w(rite)
```

lo solucionamos ingresando

```
parted -l
```

y luego `fix`.

Las particiones se pueden configurar con el comando

```
cfdisk /dev/sda
```

Por supuesto, la dirección del disco puede ser diferente para ti que `/dev/sda`. Elegimos el tipo `linux (x86)`.

Ahora necesitamos determinar si estamos instalando un sistema arrancable desde BIOS o a través de UEFI. Si no estamos seguros, verifiquemos si nuestra placa base admite UEFI, y si es así, es mejor elegir UEFI. Si tienes una computadora nueva, puedes omitir la sección "BIOS" e ir a "UEFI".

### BIOS

En computadoras más antiguas, utilizaremos BIOS. Con el programa `cfdisk` o `fdisk`, podemos establecer:

* partición de arranque sda1 con tipo 83 Linux
* partición no arrancable sda2 con tipo 82 Linux Swap

![](http://localhost:8484/88eda6fa-37ae-43a2-b5ce-9ea43ef00fcd.avif)

Formateamos la partición creada

```
mkfs.ext4 /dev/sda1
```

Montamos la partición lista en `/mnt`

```
mount /dev/sda1 /mnt
```

Ahora podemos omitir la sección "UEFI" y pasar a "Pacstrap"

### UEFI

En el caso de UEFI, necesitamos preparar una tabla GPT. Puedes usar el programa más fácil de usar `cfdisk`, o el más avanzado `fdisk`. A continuación, muestro esto en `fdisk`.

```
fdisk /dev/sda
```

seleccionando la opción `g`

Creando la partición `uefi` eligiendo `n` (nuevo), `ENTER` (no cambiar el primer sector), `+200M` (estableciendo el último sector en `+ 200 MB`).

Estableciendo el tipo a `EFI System` usando `t` (como tipo), `1` (número de tipo `EFI System`).

Creando la segunda partición `n` (nuevo), `ENTER` (número predeterminado 2), `ENTER` (bloque inicial predeterminado), `ENTER` (bloque final predeterminado).

Guardando cambios seleccionando `w`.

Formateando la partición UEFI a `fat 32`

```
mkfs.fat -F32 /dev/sda1
```

Formateando el sistema de archivos de la segunda partición a `ext4`:

```
mkfs.ext4 /dev/sda2
```

Montamos la partición en el sistema en el directorio `/mnt`.

```
mount /dev/sda2 /mnt
```

Y la partición UEFI en `/mnt/boot`, primero necesitamos crear este directorio.

```
mkdir /mnt/boot
```

y ahora instala

```
mount /dev/sda1 /mnt/boot
```

Gracias al comando `slblk`, podemos verificar si el montaje es correcto.

### Pacstrap

Y instalamos el sistema utilizando el comando `pacstrap`.

```
pacstrap /mnt base linux linux-firmware nano
```

Generando el archivo `fstab`.

```
genfstab -U /mnt >> /mnt/etc/fstab
```

Accediendo al sistema instalado

```
arch-chroot /mnt /bin/bash
```

### Archivo de intercambio

Preparando el intercambio:

```
fallocate -l 2GB /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

Agregamos a `/etc/fstab`

```
/swapfile none swap defaults 0 0
```

### Zona Horaria

Establecemos la zona horaria

```
ln -sf /usr/share/zoneinfo/Europe/Warsaw /etc/localtime
```

Generando `adjtime` para sincronizar el reloj del sistema con el reloj de hardware

```
hwclock --systohc
```

### Idioma

Estableceremos la configuración regional comentando una de las líneas en el archivo `locale.gen`.

```
nano /etc/locale.gen
```

Generamos soporte de idioma

```
locale-gen
```

En el archivo `/etc/locale.conf` ingresamos `LANG=pl_PL.UTF-8`

```
echo LANG=pl_PL.UTF-8 > /etc/locale.conf
```

Y en `/etc/vconsole.conf`

```
KEYMAP=pl
FONT=Lat2-Terminus16
FONT_MAP=8859-2
```

### Red

En `/etc/hostname` configuramos el nombre del host. Este es el nombre de nuestra computadora - útil si tenemos múltiples dispositivos en la red local.

En `/etc/hosts` añadimos líneas

```
127.0.0.1    localhost localhost.localdomain    preciselab
```

la tercera columna contiene el nombre de host previamente seleccionado.

Instalamos `networkmanager`.

```
pacman -S networkmanager kea
```

Habilitamos el servicio `NetworkManager`

```
systemctl enable NetworkManager
```

### Paquetes Útiles

Es una decisión individual qué otros paquetes debe incluir el sistema. Haré una lista y describiré varios que recomiendo.

* network-manager-applet - interfaz para gestionar conexiones de red
* wireless_tools - proyecto abierto patrocinado por HP - contiene herramientas como iwconfig iwlist iwspy wipriv e ifrename para manejar redes wifi
* wpa_supplicant - soporte para wifi encriptado WEP, WPA, WPA2 y WPA3 - esencial hoy en día
* dialog - paquete para mostrar ventanas de diálogo desde scripts bash, requerido para usar wifi-menu
* netctl - herramienta de consola para gestionar redes (incluye wifi-menu)
* os-prober - herramienta para detectar otros sistemas operativos y dispositivos, útil si grub no los ve
* base-devel - conjunto de paquetes para compilación, procesamiento de texto y compresión
* linux-headers - scripts para construir módulos del kernel
* reflector - script para automatizar la selección de servidores espejo
* git - sistema de control de versiones utilizado para programar e instalar paquetes
* cups - sistema de gestión de impresoras desarrollado por Apple
* xdg-utils - herramientas utilitarias para aplicaciones XDG MIME
* xdg-user-dirs - herramienta para integrar el directorio del usuario con otros programas, particularmente útil para gestores de archivos
* openssh - software para conectarse a través de ssh
* iwd - herramienta para conectarse a la red, por ejemplo, a través de iwctl

Podemos instalarlos con el comando:

```
pacman -S network-manager-applet wireless_tools wpa_supplicant dialog netctl os-prober base-devel linux-headers reflector git cups xdg-utils xdg-user-dirs openssh iwd
```

Si deseas usar Bluetooth, también necesitarás `bluez bluez-utils`.

Ahora instalaremos el cargador de arranque para que el sistema pueda iniciarse correctamente. Dependiendo de si elegiste la opción BIOS o UEFI, procede a la sección correspondiente.

### Cargador de arranque en BIOS

Instalando el cargador de arranque

```
pacman -S grub
```

utilizamos el comando `grub-install`

```
grub-install /dev/sda
```

y creamos el archivo de configuración de grub

```
grub-mkconfig -o /boot/grub/grub.cfg
```

### Cargador de arranque en UEFI

Instalando el cargador de arranque

```
pacman -S grub efibootmgr
```

utilizamos el comando `grub-install`

```
grub-install --target=x86_64-efi --efi-direcotry=/boot --bootloader-id=GRUB
```

en caso de error

> esta etiqueta de partición GPT no contiene ninguna partición de arranque de BIOS

lo solucionamos con el comando

```
parted /dev/sda
set 1 boot off
set 1 bios_grub on
q
```

[grub2-install: “esta etiqueta de partición GPT no contiene una partición de arranque BIOS”](https://superuser.com/a/1610045/1216455)

En caso de error

> "Las variables EFI no son compatibles con este sistema"

salimos de `chroot` escribiendo `exit` y tipeamos

```
modprobe efivars
```

[“Las variables EFI no son compatibles con este sistema”](https://unix.stackexchange.com/a/91623/431667)

Si vemos el error

> Módulo efivars no encontrado en el directorio /lib/modules/5.10.3-arch1-1

necesitamos reiniciar el ordenador en modo efi. Esto se debe a que algunas máquinas pueden optar por arrancar en modo bios o efi.

La documentación dice que podemos comprobar si funciona escribiendo:

```
efivar-tester
```

pero no recomiendo este método, se queda en un bucle infinito para mí y solo se puede apagar al apagar el ordenador.

Creamos un archivo de configuración para grub

```
grub-mkconfig -o /boot/grub/grub.cfg
```

### Usuarios

Para poder usar el sistema a diario sin permisos de root mientras se adquieren rápidamente, instalaremos sudo.

```
pacman -S sudo
```

Estableciendo una contraseña para `root`

```
passwd root
```

Agregar un usuario para uso diario

```
useradd -m -g users -G wheel -s /bin/bash daniel
```

Le damos una contraseña

```
passwd daniel
```

Permitimos que el grupo `wheel` utilice `sudo`.

```
EDITOR=nano visudo
```

eliminamos el comentario antes de la línea

```
%wheel ALL=(ALL) ALL
```

Salimos del instalador

```
exit
```

Desmontando la partición

```
umount /mnt
```

Apagar el ordenador

```
shutdown -P now
```

### Problemas de Red

Si después de ingresar

```
ip addr
```

las interfaces están deshabilitadas, pueden ser habilitadas por

```
ip link set dev <interface> up
```

Para comprobar qué interfaces vale la pena habilitar, `nmcli` puede ser útil.

Si no puedes habilitar la interfaz pero conoces el nombre y la contraseña de la red, puedes intentar una conexión directa siguiendo las recomendaciones del enlace:

[¿cómo adjunto dispositivos a conexiones usando nmcli?](https://unix.stackexchange.com/a/613819/431667)

No tengo idea de por qué esto funciona.

Si la resolución de nombres de dominio a direcciones IP no está funcionando correctamente, necesitamos elegir el DNS por defecto. Lo configuramos en

```
/etc/resolv.conf
```

escribiendo

```
nameserver 8.8.8.8
```

Verificaremos el estado del servicio responsable de asignar direcciones IP a los dominios con el comando.

```
systemctl status systemd-resolved.service
```

### Errores Clave

Si tenemos errores como

> La firma es una confianza desconocida

Podemos verificar la clave dada

```
pacman-key -l Thorsten
```

y si ha expirado, actualiza la lista de claves

```
pacman-key --refresh-keys
```

[La firma es una confianza desconocida \[RESUELTO\] / Problemas con Pacman y actualización de paquetes / Foros de Arch Linux]

![](https://bbs.archlinux.org/style/ArchLinux/favicon.ico)

![](https://bbs.archlinux.org/img/avatars/27289.jpg?m&#x3D;1572193439)](https://bbs.archlinux.org/viewtopic.php?id&#x3D;207957)

### Instalación de yay

Yay es un programa auxiliar para gestionar dependencias. Si has instalado `base-devel`, puedes descargar yay usando git.

```
git clone https://aur.archlinux.org/yay.git
```

y instalar con comandos

```
cd yay && makepkg -si
```

# Instalación de I3

El gestor de ventanas se instala con el comando

```
yay -S i3
```

Necesitas agregar una fuente y una barra a ello.

```
yay -S ttf-dejavu i3status
```

Instalamos `xorg`.

```
yay -S xorg xorg-xinit rxvt-unicode
```

Y controladores para tu tarjeta. Puedes verificar el tipo de tarjeta con el comando `lspci | grep VGA`.

Para la tarjeta `AMD/ATI RV370 [Radeon X300]`, es

```
yay -S xf86-video-ati
```

Para `nvidia`, estos serán:

```
yay -S nvidia nvidia-utils
```

Para `Controlador Gráfico Integrado del Procesador Atom` es

```
yay -S xf86-video-intel
```

Si no sabes qué paquete instalar para tu tarjeta, te recomiendo buscarlo en la página:

[Xorg - ArchWiki](https://wiki.archlinux.org/title/xorg)

Para soportar sonido, también añadimos `alsa-utils`, `pulseaudio` y `pavucontrol`

```
yay -S alsa-utils pulseaudio pavucontrol
speaker-test -c2
alsamixer
```

Editando el archivo

```
nano /etc/X11/xinit/xinitrc
```

comentando líneas

```
#twm &
#exec xterm ....
```

y agregando al final

```
exec i3
```

ahora podemos habilitar el modo gráfico escribiendo

```
startx
```

Confirmamos la generación de la configuración al presionar `ENTER` y confirmamos la tecla `win` como la tecla principal.

## Configuración de I3 y rxvt-unicode

Se grabó una valiosa introducción a `i3` por `Distroverse`:

Basé mi configuración en ella. Puedes encontrarla en el repositorio

[my-arch-i3-config/config en main · gustawdaniel/my-arch-i3-config](https://github.com/gustawdaniel/my-arch-i3-config/blob/main/.config/i3/config)

pero te recomiendo que revises varias configuraciones diferentes y leas la documentación de i3, que es una de las mejores documentaciones de administradores de ventanas.

Mientras tanto, nos ocuparemos del terminal `urxvt-unicode`. Te recomiendo este video

Nos trasladamos al directorio home

```
cd ~
```

Creando Configuración

```
touch .Xresources
```

podemos pegar una de las configuraciones listas en este archivo

```
curl https://raw.githubusercontent.com/gustawdaniel/my-arch-i3-config/main/.Xresources > .Xresources
```

pero recomiendo leer varias comparaciones diferentes o ver videos que expliquen las opciones posibles en detalle y seleccionar las que son mejores para nosotros.

El comando para recargar la configuración es

```
xrdb ~/.Xresources
```

### Navegador

Instalamos el navegador, cuya elección es una vez más tuya. En el caso de un navegador fantástico: Zen. Es:

```
yay -S zen-browser-bin
```

El primer complemento es `Ublock Origin`.

### Distribución del teclado polaco en X11

Para usar caracteres polacos, en el entorno gráfico configura la distribución del teclado insertando la configuración en el archivo `/usr/share/X11/xorg.conf.d/10-keyboard.conf`

```
Section "InputClass"
    Identifier "system-keyboard"
    MatchIsKeyboard "on"
    Option "XkbLayout" "pl"
EndSection
```

### Lanzador

El lanzador más simple es `dmenu`. Lo instalamos con el comando

```
yay -S dmenu
```

y lo usamos con la combinación de teclas `super+d`

### Capturas de pantalla

En mi opinión, el mejor es `flameshot`. Lo instalamos con el comando

```
yay -S flameshot
```

En la configuración de `i3`, podemos vincularlo al botón de `imprimir pantalla`.

```
bindsym Print exec flameshot gui
```

### Controlando Otros Ordenadores

Si estamos utilizando múltiples ordenadores y queremos controlarlos con un solo ratón y teclado en todos los ordenadores, podemos instalar `barrier`.

```
yay -S barrier
```

En el dispositivo del cliente, configuramos el ID del servidor:

![](http://localhost:8484/7e58151b-96fb-4217-b7f7-49a5552900a8.avif)

Y en el servidor:

![](http://localhost:8484/254f446b-c536-4626-ad8e-9461988b6c96.avif)

Indicamos dónde estará el cliente en relación con nuestra computadora.

![](http://localhost:8484/270694f4-09f0-4dfd-af1c-6d7332690f0a.avif)

En caso de problemas de configuración de conexión, apagar y encender ambas computadoras siempre ayudó.

### Oh my zsh

Zsh es un shell alternativo a `bash` con mayores opciones de personalización y extensión. Lo instalamos con el comando:

```
yay -S zsh
```

A continuación, instalamos `oh my zsh`.

```
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

### Fondo de pantalla

Comenzaremos verificando la resolución de los monitores con el comando

```
 xrandr --listmonitors
```

Descargamos el fondo de pantalla en el tamaño adecuado y lo guardamos en un archivo

```
.config/i3/.bg.jpeg
```

Instalamos `feh` con el comando

```
yay -S feh
```

Escribimos un script para establecer el fondo de pantalla en el archivo `.fehbg`.

```
#!/bin/sh
feh --no-fehbg --bg-scale '/home/daniel/.config/i3/.bg.jpeg'
```

Le damos derechos para ejecutarse

```
sudo chmod +x ~/.fehbg
```

en `.config/i3/config` lo habilitamos con el comando

```
exec --no-startup-id sh ~/.fehbg
```

### Neovim

Una versión ligeramente más cómoda de `vim`.

```
yay -S neovim
```

### Sincronización del Reloj del Sistema

Si hay una discrepancia en la fecha o la hora, vale la pena habilitar la sincronización con servidores que indican la hora correcta.

```
sudo timedatectl set-ntp true
```

### Monitoreo de Recursos

Para verificar el uso de CPU y la temperatura, la RAM utilizada, la transferencia de red, es decir, el monitoreo general, recomiendo `bashtop`.

```
yay -S bashtop
```

![](http://localhost:8484/87e08fbb-de98-4348-9169-9543d9a8aab4.avif)

### Gestor de Pantalla

El programa en el que selecciono el tipo de sesión e ingresó mi nombre de usuario y contraseña es `ly`.

```
yay -S ly
sudo systemctl enable ly.service
```

![](http://localhost:8484/9be76f2f-1843-4219-990f-9d5c1b422fd1.avif)

### Tmux y Tmuxinator

Para gestionar sesiones, ventanas y dividir ventanas en la terminal, utilizo `tmux`.

```
yay -S tmux ruby
gem install tmuxinator
```

Su configuración:

![](http://localhost:8484/8f6de7c2-8c6f-458c-8c65-43ff23ca8d7e.avif)

### Bitwarden

Usé `keeweb` para la gestión de contraseñas. Actualmente estoy usando `bitwarden`:

```
yay -S bitwardern
```

la siguiente configuración en el archivo `~/.config/i3/config` es responsable de gestionar su visibilidad:

```
exec --no-startup-id bitwarden
bindsym $Mod+k [instance="bitwarden"] scratchpad show; [instance="bitwarden"] move position center
for_window [instance="bitwarden"] move scratchpad
for_window [instance="bitwarden"] border pixel 3
for_window [instance="bitwarden"] resize set 800 600
```

![](http://localhost:8484/4d133afa-efe5-4cf9-acaa-72970b4f0ac5.avif)

## Nuestro Arch Linux con i3 está listo

Podríamos seguir careciendo de un `IDE` para un trabajo efectivo si somos programadores o `obs` si estamos grabando videos o programas de edición gráfica. Sin embargo, podemos considerar el sistema y los programas básicos como listos.

Si crees que falta algún programa en la lista, o ves lugares donde se podría simplificar algo, háznoslo saber en los comentarios.

![](http://localhost:8484/f28189da-1303-474d-a73f-0eaa5eae884b.avif)
