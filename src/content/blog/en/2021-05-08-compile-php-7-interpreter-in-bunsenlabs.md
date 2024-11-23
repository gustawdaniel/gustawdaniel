---
author: Daniel Gustaw
canonicalName: compile-php-7-interpreter-in-bunsenlabs
coverImage: http://localhost:8484/7befcf74-cca9-4f73-b2fb-92961cbcefbd.avif
description: Compilation is a process that sometimes requires installing packages or linking dependencies. In this case, the task was to deliver php7 to a system that did not have it in the available repositories.
excerpt: Compilation is a process that sometimes requires installing packages or linking dependencies. In this case, the task was to deliver php7 to a system that did not have it in the available repositories.
publishDate: 2021-05-07 20:30:00+00:00
slug: en/compiling-php-7-interpreter-in-bunsenlabs
tags:
- php
- compilation
- bunsenlabs
title: Compilation of PHP 7 interpreter in BunsenLabs
updateDate: 2021-06-21 17:02:31+00:00
---

## Bunsenlabs Installation

I usually use Ubuntu, sometimes Debian. However, on one computer, I installed the [Bunsenlabs](https://www.bunsenlabs.org/index.html) distribution. It is a notebook that I bought for 400 PLN as a writing machine while traveling. Gnome3 is too heavy for it, while the [Openbox](http://openbox.org/wiki/Main_Page) installed in Bunsenlabs is just the opposite - it gives it new life. It looks really good:

![Bunshenlabs](https://www.bunsenlabs.org/img/frontpage-gallery/hydrogen2.jpg)

In this article, we will install `Bunsenlabs` on a virtual machine.

We will start by downloading the distribution from the site: [https://www.bunsenlabs.org/installation.html](https://www.bunsenlabs.org/installation.html)

[![installation](https://i.imgur.com/v4SafV3.png)](https://www.bunsenlabs.org/installation.html)

We select `bl-Hydrogen-amd64_20160710.iso` and download it (preferably via a Torrent client). The entire installation process from starting `VirtualBox` to configuring the environment is presented in the video below.

A key moment was skipping the installation of `LAPMA` when I realized that `php` is available there in version `5`. To have version `7`, we will now compile it.

## Connection to VirtualBox via SSH

We will now turn off the virtual machine to change its network settings. We select our machine in the VirtualBox panel. We choose settings by pressing the `ctr+s` combination. In the `network` tab, we change `NAT` to `Bridged Adapter`. We click `Ok` and turn the machine back on.

**Virtual machine:**

We install the `ssh` server on the virtual machine.

```
sudo apt-get install openssh-server
```

To check if everything is okay, we enter

```
netstat -lnpt | grep 22
```

To check what `ip` we received, we enter the command:

```
ifconfig
```

To enable root login via ssh, we edit the login settings file.

```
sudo nano /etc/ssh/sshd_config
```

Changing the line

```
PermitRootLogin without-password
```

on

```
PermitRootLogin yes
```

We are restarting `ssh`

```
sudo /etc/init.d/ssh restart
```

And we create a directory for root keys:

```
sudo mkdir -p /root/.ssh
```

Setting the root password

```
sudo su && passwd
```

**Local Machine**

On our computer, we save `ip` to environment variables. We add lines to `~/.bashrc` that may look like this:

```
ip_hy="192.168.0.11"             # ip of hydrogen_x86_64
alias 'sh_hy'='ssh root@$ip_hy'  # ssh shortcut
```

we reset the shell variables by entering:

```
bash
```

We authorize access from the local machine to the virtual one.

```
cat ~/.ssh/id_rsa.pub | sh_hy 'cat >> .ssh/authorized_keys'
```

We enter the root password on the virtual machine and we can now log into it via

```
sh_hy
```

The most important commands are presented in the video posted below

## PHP Compilation

The interpreter [`php`](https://github.com/php/php-src) has over 100,000 commits. We are interested in the number of its [latest release](https://github.com/php/php-src/releases). At the time of writing this, it is 7.0.14. We go to the directory `/usr/src` and download it:

```
git clone -b PHP-7.0.14 https://github.com/php/php-src --depth 1
```

The repository downloaded this way weighs 20.8 MB. If we hadn't chosen a version now and just did a `checkout` after downloading everything, it would have cost us over 320 MB. We move to the `php-src` directory.

### Configuration

We want to generate a configuration file:

```
./buildconf --force
```

I could immediately provide a script that installs all dependencies. However, I find that a table listing potential errors that may arise with this command is more useful - especially for those who encounter the errors mentioned here. I will attach the script with full compilation at the end.

|Problem|Solution|
|---|---|
|make: not found|apt-get install make|
|autoconf not found.|apt-get install autoconf|

After a fresh installation of `BunsenLabs`, the generation of the configuration file went relatively smoothly. I only had to install two dependencies. The configuration process itself was more interesting:

```
./configure --prefix=/usr/local/php/7.0 \
    --with-config-file-path=/etc/php/7.0/apache2 \
    --with-config-file-scan-dir=/etc/php/7.0/apache2/conf.d \
    --enable-mbstring \
    --enable-zip \
    --enable-bcmath \
    --enable-pcntl \
    --enable-ftp \
    --enable-exif \
    --enable-calendar \
    --enable-sysvmsg \
    --enable-sysvsem \
    --enable-sysvshm \
    --enable-wddx \
    --enable-intl \
    --with-curl \
    --with-mcrypt \
    --with-iconv \
    --with-gmp \
    --with-pspell \
    --with-gd \
    --with-jpeg-dir=/usr \
    --with-png-dir=/usr \
    --with-zlib-dir=/usr \
    --with-xpm-dir=/usr \
    --with-freetype-dir=/usr \
    --enable-gd-native-ttf \
    --enable-gd-jis-conv \
    --with-openssl \
    --with-pdo-mysql=/usr \
    --with-gettext=/usr \
    --with-zlib=/usr \
    --with-bz2 \
    --with-recode=/usr \
    --with-apxs2=/usr/bin/apxs2 \
    --with-mysqli=/usr/bin/mysql_config \
    --with-ldap \
```

Here I installed or linked 19 additional packages.

|Problem|Solution|
|---|---|
|checking for gcc... no|apt-get install gcc|
|bison is required|apt-get install bison|
|/usr/bin/apxs: No such file|apt-get install apache2-dev|
|xml2-config not found|apt-get install libxml2-dev|
|Cannot find OpenSSL's <evp.h>|apt-get install libssl-dev|
|Cannot find OpenSSL's libraries|apt-get install pkg-config|
|Please reinstall the BZip2|apt-get install libbz2-dev|
|easy.h should be in `<curl-dir>`|apt-get install libcurl4-gnutls-dev|
|jpeglib.h not found.|apt-get install libjpeg-dev|
|png.h not found|apt-get install libpng-dev|
|xpm.h not found|apt-get install libxpm-devel|
|freetype-config not found|apt-get install libfreetype6-dev|
|Unable to locate gmp.h|apt-get install libgmp-dev \*1|
|Unable to detect ICU|apt-get install libicu-dev|
|Cannot find ldap|\*2|
|mcrypt.h not found|apt-get install libmcrypt-dev|
|mysql\_config not found|apt-get install mysql-server libmysqlclient-dev|
|Cannot find pspell|apt-get install libpspell-dev|
|Can not find recode.h|apt-get install librecode-dev|

Stars are related to the fact that even though the packages are installed, the `php` installer does not detect them. In this case, the problem can be solved by linking them symbolically to the locations searched by the installer.

```
ln -sf /usr/include/x86_64-linux-gnu/gmp.h /usr/include/gmp.h
ln -sf /usr/lib/x86_64-linux-gnu/liblber.so /usr/lib/liblber.so
```

### Compilation

If we now perform the compilation, despite the successful configuration, it will throw the following error.

```
/usr/bin/ld: ext/ldap/.libs/ldap.o: undefined reference to symbol 'ber_scanf@@OPENLDAP_2.4_2'
/usr/lib/x86_64-linux-gnu/liblber-2.4.so.2: error adding symbols: DSO missing from command line
collect2: error: ld returned 1 exit status
Makefile:289: polecenia dla obiektu 'sapi/cli/php' nie powiodły się
make: *** [sapi/cli/php] Błąd 1
```

We solve this problem by installing `apache2`, but to proceed, it is required to redo the entire configuration from the beginning. Before the actual compilation, we clean up the results of previous failures.

```
sudo make clean
```

And we harness as many processors as possible for compilation

```
sudo make -j `cat /proc/cpuinfo | grep processor | wc -l`
```

It's been a while since there was an image, so here is a screenshot from the compilation:

![komplacja](https://i.imgur.com/5HPC4MC.png)

Since I was compiling logged in via `ssh` on the mentioned laptop and a virtual machine simultaneously, we have three htops on the right: the first with 2 processors (notebook), the middle one with 1 processor (virtual machine), and the last one with 8 (the local machine on which I'm writing). It is visible how my main computer (the third htop) shifts the compilation task being performed on the virtual machine between two physical cores at this moment.

This is a relatively long process, it can take several to a dozen minutes depending on the hardware. This is a good time to relax. The compilation ends with the message:

```
Build complete.
Don't forget to run 'make test'.
```

Tests last for a few minutes, but do not affect the final result. All the sources I used skipped this step. Regardless of whether you test your `php` or not, the next important step after compilation is installation.

```
sudo make install
```

To direct `php` to the appropriate locations, we enter:

```
sudo update-alternatives --install /usr/bin/php php /usr/local/php/7.0/bin/php 50 --slave /usr/share/man/man1/php.1.gz php.1.gz /usr/local/php/7.0/php/man/man1/php.1
```

If we ask the system for the `php` version at this moment we will get

```
# php -v
PHP 7.0.14 (cli) (built: Dec 18 2016 21:56:13) ( NTS )
Copyright (c) 1997-2016 The PHP Group
Zend Engine v3.0.0, Copyright (c) 1998-2016 Zend Technologies
```

However, it will not work on websites. To fix this, we configure the apache2 modules.

### Connecting to Apache2 

We will start by adding the file `/etc/apache2/mods-available/php7.conf` with the content:

```
<FilesMatch ".+\.ph(p[3457]?|t|tml)$">
    SetHandler application/x-httpd-php
</FilesMatch>
<FilesMatch ".+\.phps$">
    SetHandler application/x-httpd-php-source
    # Deny access to raw php sources by default
    # To re-enable it's recommended to enable access to the files
    # only in specific virtual host or directory
    Require all denied
</FilesMatch>
<FilesMatch "^\.ph(p[345]?|t|tml|ps)$">
    Require all denied
</FilesMatch>
```

and then we will turn on and off the appropriate modules.

```
a2dismod mpm_event
a2enmod mpm_prefork
a2enmod php7
```

And we restart it:

```
service apache2 restart
```

To check if everything is working in the directory `/var/www/html`, we replace the file `index.html` with the file `index.php` containing

```
5=<?php
echo 2+3;
```

The whole compilation process can be viewed in the video below:

### Gist with scripts

To avoid executing all commands manually, I am attaching a [gist](https://gist.github.com/gustawdaniel/79aae802d0c99ba3ef633efa441d5863) with scripts. We have three files there:

```
├── php7.conf
├── php_install.sh
└── send.sh
```

If we want to start from a local machine, we download them locally to the same folder and edit `send.sh` by entering the `ip` of the machine where we want to conduct the installation. The `send.sh` script sends the files `php7.conf` and `php_install.sh` to the virtual machine at the location `/usr/src`. We can also download `php7.conf` and `php_install.sh` to `/usr/src` of the virtual machine right away.

There, we execute `php_install.sh`, which installs the necessary packages, downloads the sources, performs configuration and compilation, installs `php`, and finally copies `php7.conf` to the configuration directory of `apache` and configures it to work correctly with `php`.

## Sources:

While writing this entry, I benefited from the help of dozens of people who solved compilation problems on their blogs, in various Stack communities, or in discussions on GitHub without expecting any compensation. I am extremely grateful to all of them. I cannot list them all, so I will mention only a few sources that helped me the most:

* [Compiling PHP 7 on CentOS](http://www.shaunfreeman.name/compiling-php-7-on-centos/)
* [Compiling PHP 7 on Ubuntu](https://gist.github.com/m1st0/1c41b8d0eb42169ce71a)
* [Logging in as root via SSH](https://linuxconfig.org/enable-ssh-root-login-on-debian-linux-server)
* [Saving password for SSH](http://www.linuxproblem.org/art_9.html)
* [Official PHP dependency list](http://php.net/manual/en/install.unix.php)
* [Apache configuration when compiling PHP](https://docs.moodle.org/32/en/Compiling_PHP_from_source)
* [AskUbuntu](http://askubuntu.com/questions/760907/upgrade-to-16-04-php7-not-working-in-browser)
