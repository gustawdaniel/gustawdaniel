---
author: Daniel Gustaw
canonicalName: how-to-install-yay-on-a-pure-arch-linux-docker-image
coverImage: http://localhost:8484/dfb43cd8-1f8f-4a2d-96f9-a9221028eca1.avif
description: La instalación de yay requiere algunos pasos como la creación de usuario, la instalación de base-devel y git, cambios en /etc/sudousers, clonar el repositorio de yay y hacer makepkg en él. Esta publicación cubre este proceso paso a paso.
excerpt: La instalación de yay requiere algunos pasos como la creación de usuario, la instalación de base-devel y git, cambios en /etc/sudousers, clonar el repositorio de yay y hacer makepkg en él. Esta publicación cubre este proceso paso a paso.
publishDate: 2023-03-20 06:03:00+00:00
slug: es/como-instalar-yay-en-imagen-pura-de-archlinux
tags:
- linux
- arch
- docker
- yay
title: Cómo instalar Yay en una imagen Docker de Arch Linux pura
updateDate: 2023-03-20 06:03:00+00:00
---

En este artículo, te guiaremos a través del proceso de instalación del helper AUR `yay` en una imagen Docker de Arch Linux pura. Yay es una herramienta popular y fácil de usar para gestionar paquetes del Arch User Repository (AUR). Instalar `yay` en una imagen Docker de Arch Linux puede ayudarte a optimizar la gestión de paquetes y mantener tus aplicaciones en contenedores actualizadas.

![](http://localhost:8484/6e96a98f-6c66-4687-9621-b29431e820b5.avif)

## Preparando la imagen de Docker de Arch Linux

Primero, inicia un nuevo contenedor de Docker de Arch Linux ejecutando el siguiente comando:

```bash
docker run --rm -it archlinux
```

Este comando descargará la última imagen de Arch Linux (si no la tienes ya) y comenzará una sesión de contenedor interactiva.

## Actualizando el Sistema e Instalando Dependencias

Antes de instalar `yay`, asegúrate de que tu contenedor de Arch Linux esté actualizado y tenga las dependencias necesarias instaladas. Actualiza el sistema e instala `base-devel` y `git` utilizando el siguiente comando:

```bash
pacman -Syu --noconfirm && pacman -S --noconfirm base-devel git
```

`base-devel` contiene herramientas esenciales para construir paquetes, mientras que `git` te permite clonar el repositorio de `yay`.

## Creando un Directorio de Construcción Temporal

Para construir e instalar `yay`, necesitas un directorio temporal. Crea un directorio llamado `/tmp/yay-build` y cambia su propiedad al nuevo usuario `builder` utilizando estos comandos:

```bash
mkdir -p /tmp/yay-build
useradd -m -G wheel builder && passwd -d builder
chown -R builder:builder /tmp/yay-build
```

## Conceder Permisos Sudo

Permitir que el usuario `builder` use `sudo` sin una contraseña añadiendo una entrada en el archivo `/etc/sudoers`:

```bash
echo 'builder ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers
```

## Clonando el Repositorio de Yay

Como usuario `builder`, clona el repositorio `yay` en el directorio `/tmp/yay-build`:

```bash
su - builder -c "git clone https://aur.archlinux.org/yay.git /tmp/yay-build/yay"
```

## Construyendo e Instalando Yay

Ahora, construye e instala `yay` utilizando el comando `makepkg`:

```bash
su - builder -c "cd /tmp/yay-build/yay && makepkg -si --noconfirm"
```

Este comando construirá e instalará `yay` sin solicitar confirmación.

## Limpieza

Después de instalar `yay` con éxito, elimina el directorio de construcción temporal:

```bash
rm -rf /tmp/yay-build
```

Has instalado con éxito `yay` en una imagen de Docker de Arch Linux puro. Con `yay` instalado, ahora puedes gestionar fácilmente los paquetes AUR dentro de tu entorno de Arch Linux en contenedor. Esto puede ser especialmente útil para desarrolladores y administradores de sistemas que utilizan Arch Linux y Docker para sus aplicaciones y servicios.

## Probemos si funciona con el ejemplo de gpt-cli

Cambiaremos al usuario `builder`

```bash
su - builder
```

y installa el primer paquete. Por ejemplo

```bash
yay -S gpt-cli
```

![](http://localhost:8484/43be4bb9-02a5-4b86-b987-72fcd9f4c485.avif)

Permite recomendarte comandos de linux utilizando la API `openai` con el modelo `gpt-3.5-turbo`. Puedes probarlo escribiendo:

```bash
GPT3_API_KEY="sk-xxx" p perl onliner that will show first 10 fibonacci sequence elements
```

verás que la información que se presenta en el script a continuación fue copiada a tu portapapeles

```bash
perl -e 'sub f{ $_[0] < 2 ? $_[0] : f($_[0]-1) + f($_[0]-2) }; foreach(0..9){ print f($_), "\n"; }'
```

![](http://localhost:8484/8743f013-5a07-42fc-bde9-43ec61fad1d2.avif)

Puedes leer la documentación completa de `gpt-cli` en github.

[GitHub - gustawdaniel/gpt-cli: Ejecuta comandos de linux con lenguaje natural. Ej.: “muestra mi tarjeta gráfica” en lugar de “lspci | grep VGA”](https://github.com/gustawdaniel/gpt-cli)

Espero que esta publicación de blog te ayude a instalar yay en la imagen de docker de arch.
