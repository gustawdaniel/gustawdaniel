---
author: Daniel Gustaw
canonicalName: aur-package-publication
coverImage: http://localhost:8484/f3b21d8a-2483-40fe-8603-d39fb987ebf8.avif
description: Aprende a publicar actualizaciones de paquetes en el repositorio de usuarios de Arch Linux.
excerpt: Aprende a publicar actualizaciones de paquetes en el repositorio de usuarios de Arch Linux.
publishDate: 2022-01-29T20:34:39.000Z
slug: es/actualizar-paquete-aur
tags: ['arch', 'aur', 'linux']
title: Publicando una actualización del paquete en el repositorio AUR
updateDate: 2022-01-29T20:34:39.000Z
---

### Crear una cuenta en AUR

![](http://localhost:8484/08559ea5-1a3c-40c5-96f0-d5e3b34148cf.avif)

### Descargue el paquete que desea actualizar

En nuestro caso, estamos actualizando `infinitywallet`.

[AUR (es) - infinitywallet](https://aur.archlinux.org/packages/infinitywallet/)

Descargamos el repositorio con el comando

```
git clone ssh://aur@aur.archlinux.org/infinitywallet.git
```

Contiene tres archivos:

```
infinitywallet.install  - hooki zakładane na operacje dookoła instalacji
PKGBUILD                - konfiguracja źródeł instalcji
.SRCINFO                - metadane pakietu generowane atuomatycznie
```

### Actualizar "source" en "PKGBUILD"

En el archivo `PKGBUILD`

```
pkgname=infinitywallet
pkgver=1.2.1beta
pkgrel=10
pkgdesc="Digital asset wallet"
arch=('x86_64')
url="https://infinitywallet.io"
depends=('gtk3' 'libnotify' 'nss' 'libxss' 'libxtst' 'xdg-utils' 'at-spi2-core' 'util-linux-libs' 'libappindicator-gtk3' 'libsecret')
options=('!strip' '!emptydirs')
install=${pkgname}.install
source_x86_64=("https://github.com/InfinityWallet/Releases/releases/download/v1.2.1-beta/InfinityWallet_1.2.1-beta.deb")
sha512sums_x86_64=('f36da80cdc3d35bf6d83e573240f92ea115ab03fe7ec3b5acd699bce999df6d5e81a8ab1966ad8977773bbba2710e3fb6fba0229c3195262cd698e938fd864de')

package(){

	# Extract package data
	tar xf data.tar.xz -C "${pkgdir}"

	install -D -m644 "${pkgdir}/opt/InfinityWallet/resources/app.asar.unpacked/node_modules/phantomjs-prebuilt/LICENSE.txt" "${pkgdir}/usr/share/licenses/${pkgname}/LICENSE"

}
```

Tenemos información sobre la fuente. Esta es la versión 1.2.1 de Ubuntu/Debian.

Mientras tanto, en el enlace con lanzamientos en Github, tenemos la versión 1.4.0

[Releases · InfinityWallet/Releases](https://github.com/InfinityWallet/Releases/releases)

![](http://localhost:8484/03aa2c9c-5c02-48c1-b89a-5b6dc474378b.avif)

La versión para Debian se puede encontrar en

```
https://github.com/InfinityWallet/Releases/releases/download/v1.4.0-beta/InfinityWallet_1.4.0-beta.deb
```

Después de establecer este valor bajo la clave `source_x86_64` en `PKGBUILD`, debemos recalcular la suma de verificación `sha512sums_x86_64`. Podemos usar la línea de comandos para descargar el paquete.

```
wget https://github.com/InfinityWallet/Releases/releases/download/v1.4.0-beta/InfinityWallet_1.4.0-beta.deb -O /tmp/iw.deb
```

y cálculo de la suma de verificación

```
sha512sum /tmp/iw.deb
```

lo pegamos en el archivo `PKGBUILD`.

Al final, cambiamos la descripción de la versión en `pkgver` y aumentamos el `pkgrel` en uno.

### Generando `.SRCINFO`

Podemos reconstruir el archivo de metadatos con el comando

```
makepkg --printsrcinfo > .SRCINFO
```

### Probando la instalación del paquete localmente

Podemos verificar si la instalación es exitosa escribiendo

```
makepkg -si
```

![](http://localhost:8484/edfefedf-af85-409b-9e6d-ff33fbeefd07.avif)

### Enviando cambios al repositorio

Creando un nuevo commit

```
 git commit -a -m "Release v1.4.0-beta"
```

y enviamos cambios a la rama "master"

```
git push origin master
```

Eso es todo. Nuestra actualización ya está disponible públicamente.

---

## Pasos clave para publicar un paquete AUR:

* tu clave ssh pública debe coincidir con la de la cuenta AUR
* el repositorio debe tener la dirección ssh://aur@aur.archlinux.org/package.git
* necesitas actualizar tanto la descripción como el número de versión
* usa sha512sum para calcular la suma de verificación
* además de PKGBUILD, también hay un archivo .SRCINFO creado por `makepkg --printsrcinfo > .SRCINFO`
* localmente, puedes probar la instalación con el comando `makepkg -si`
* finalmente, empujas los cambios a master

Si alguno de ustedes va a subir paquetes a AUR y encuentra algún problema, no duden en preguntar, estaré encantado de ayudar.
