---
author: Daniel Gustaw
canonicalName: aur-package-publication
coverImage: http://localhost:8484/f3b21d8a-2483-40fe-8603-d39fb987ebf8.avif
description: Learn how to publish package updates in the Arch Linux user repository.
excerpt: Learn how to publish package updates in the Arch Linux user repository.
publishDate: 2022-01-29T20:34:39.000Z
slug: en/update-aur-package
tags: ['arch', 'aur', 'linux']
title: Publishing an update of the package in the AUR repository
updateDate: 2022-01-29T20:34:39.000Z
---

### Create an account on AUR

![](http://localhost:8484/08559ea5-1a3c-40c5-96f0-d5e3b34148cf.avif)

### Download the package you want to update

In our case, we are updating `infinitywallet`.

[AUR (en) - infinitywallet](https://aur.archlinux.org/packages/infinitywallet/)

We download the repository with the command

```
git clone ssh://aur@aur.archlinux.org/infinitywallet.git
```

It contains three files:

```
infinitywallet.install  - hooki zakładane na operacje dookoła instalacji
PKGBUILD                - konfiguracja źródeł instalcji
.SRCINFO                - metadane pakietu generowane atuomatycznie
```

### Update "source" in "PKGBUILD"

In the file `PKGBUILD`

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

We have information about the source. This is version 1.2.1 from Ubuntu/Debian.

In the meantime, at the link with releases on Github, we have version 1.4.0

[Releases · InfinityWallet/Releases](https://github.com/InfinityWallet/Releases/releases)

![](http://localhost:8484/03aa2c9c-5c02-48c1-b89a-5b6dc474378b.avif)

The version for Debian can be found at

```
https://github.com/InfinityWallet/Releases/releases/download/v1.4.0-beta/InfinityWallet_1.4.0-beta.deb
```

After setting this value under the key `source_x86_64` in `PKGBUILD`, we should recalculate the `sha512sums_x86_64` checksum. We can use the command line to download the package.

```
wget https://github.com/InfinityWallet/Releases/releases/download/v1.4.0-beta/InfinityWallet_1.4.0-beta.deb -O /tmp/iw.deb
```

and calculation of checksum

```
sha512sum /tmp/iw.deb
```

we paste it into the `PKGBUILD` file.

In the end, we change the version description in `pkgver` and increase the `pkgrel` by one.

### Generating `.SRCINFO`

We can rebuild the metadata file with the command

```
makepkg --printsrcinfo > .SRCINFO
```

### Testing the package installation locally

We can check if the installation is successful by typing

```
makepkg -si
```

![](http://localhost:8484/edfefedf-af85-409b-9e6d-ff33fbeefd07.avif)

### Sending changes to the repository

Creating a new commit

```
 git commit -a -m "Release v1.4.0-beta"
```

and we send changes to the "master" branch

```
git push origin master
```

That's all. Our update is now publicly available.

---

## Key steps in publishing an AUR package:

* your public ssh key must match the one in the AUR account
* the repo must have the address ssh://aur@aur.archlinux.org/package.git
* you need to bump both the description and the version number
* use sha512sum to calculate the checksum
* besides PKGBUILD, there is also a .SRCINFO file created by `makepkg --printsrcinfo > .SRCINFO`
* locally, you can test the installation with the command `makepkg -si`
* finally, you push the changes to master

If anyone from you will be uploading packages to AUR and encounters any problems - feel free to ask, I’ll be happy to help.

Source: https://wiki.archlinux.org/title/AUR_submission_guidelines