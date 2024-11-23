---
author: Daniel Gustaw
canonicalName: compile-php-7-interpreter-in-bunsenlabs
coverImage: http://localhost:8484/7befcf74-cca9-4f73-b2fb-92961cbcefbd.avif
description: La compilación es un proceso que a veces requiere instalar paquetes o vincular dependencias. En este caso, la tarea era entregar php7 a un sistema que no lo tenía en los repositorios disponibles.
excerpt: La compilación es un proceso que a veces requiere instalar paquetes o vincular dependencias. En este caso, la tarea era entregar php7 a un sistema que no lo tenía en los repositorios disponibles.
publishDate: 2021-05-07 20:30:00+00:00
slug: es/compilando-el-interprete-php-7-en-bunsenlabs
tags:
- php
- compilation
- bunsenlabs
title: Compilación del intérprete PHP 7 en BunsenLabs
updateDate: 2021-06-21 17:02:31+00:00
---

## Instalación de Bunsenlabs

Normalmente uso Ubuntu, a veces Debian. Sin embargo, en una computadora, instalé la distribución [Bunsenlabs](https://www.bunsenlabs.org/index.html). Es un portátil que compré por 400 PLN como máquina de escribir mientras viajaba. Gnome3 es demasiado pesado para él, mientras que el [Openbox](http://openbox.org/wiki/Main_Page) instalado en Bunsenlabs es todo lo contrario: le da nueva vida. Se ve realmente bien:

![Bunshenlabs](https://www.bunsenlabs.org/img/frontpage-gallery/hydrogen2.jpg)

En este artículo, instalaremos `Bunsenlabs` en una máquina virtual.

Comenzaremos descargando la distribución desde el sitio: [https://www.bunsenlabs.org/installation.html](https://www.bunsenlabs.org/installation.html)

[![installation](https://i.imgur.com/v4SafV3.png)](https://www.bunsenlabs.org/installation.html)

Seleccionamos `bl-Hydrogen-amd64_20160710.iso` y lo descargamos (preferiblemente a través de un cliente Torrent). Todo el proceso de instalación desde el inicio de `VirtualBox` hasta la configuración del entorno se presenta en el video a continuación.

Un momento clave fue saltarse la instalación de `LAPMA` cuando me di cuenta de que `php` está disponible allí en versión `5`. Para tener la versión `7`, ahora la compilaremos.

## Conexión a VirtualBox vía SSH

Ahora apagaremos la máquina virtual para cambiar su configuración de red. Seleccionamos nuestra máquina en el panel de VirtualBox. Elegimos configuraciones presionando la combinación `ctr+s`. En la pestaña `red`, cambiamos `NAT` a `Adaptador Puente`. Hacemos clic en `Ok` y encendemos la máquina nuevamente.

**Máquina virtual:**

Instalamos el servidor `ssh` en la máquina virtual.

```
sudo apt-get install openssh-server
```

Para verificar si todo está bien, ingresamos

```
netstat -lnpt | grep 22
```

Para comprobar qué `ip` recibimos, ingresamos el comando:

```
ifconfig
```

Para habilitar el inicio de sesión como root a través de ssh, editamos el archivo de configuración de inicio de sesión.

```
sudo nano /etc/ssh/sshd_config
```

Cambiando la línea

```
PermitRootLogin without-password
```

en

```
PermitRootLogin yes
```

Estamos reiniciando `ssh`

```
sudo /etc/init.d/ssh restart
```

Y creamos un directorio para las claves raíz:

```
sudo mkdir -p /root/.ssh
```

Configurando la contraseña de root

```
sudo su && passwd
```

**Máquina Local**

En nuestra computadora, guardamos `ip` en variables de entorno. Agregamos líneas a `~/.bashrc` que pueden verse así:

```
ip_hy="192.168.0.11"             # ip of hydrogen_x86_64
alias 'sh_hy'='ssh root@$ip_hy'  # ssh shortcut
```

reiniciamos las variables de shell ingresando:

```
bash
```

Autorizamos el acceso desde la máquina local a la virtual.

```
cat ~/.ssh/id_rsa.pub | sh_hy 'cat >> .ssh/authorized_keys'
```

Ingresamos la contraseña de root en la máquina virtual y ahora podemos iniciar sesión en ella a través de

```
sh_hy
```

Los comandos más importantes se presentan en el video publicado a continuación

## Compilación de PHP

El intérprete [`php`](https://github.com/php/php-src) tiene más de 100,000 confirmaciones. Nos interesa el número de su [última versión](https://github.com/php/php-src/releases). En el momento de escribir esto, es 7.0.14. Vamos al directorio `/usr/src` y lo descargamos:

```
git clone -b PHP-7.0.14 https://github.com/php/php-src --depth 1
```

El repositorio descargado de esta manera pesa 20.8 MB. Si no hubiéramos elegido una versión ahora y simplemente hubiéramos hecho un `checkout` después de descargar todo, nos habría costado más de 320 MB. Nos movemos al directorio `php-src`.

### Configuración

Queremos generar un archivo de configuración:

```
./buildconf --force
```

Podría proporcionar de inmediato un script que instale todas las dependencias. Sin embargo, encuentro que una tabla que enumera los errores potenciales que pueden surgir con este comando es más útil, especialmente para aquellos que se encuentran con los errores mencionados aquí. Adjuntaré el script con la compilación completa al final.

|Problema|Solución|
|---|---|
|make: no encontrado|apt-get install make|
|autoconf no encontrado.|apt-get install autoconf|

Después de una instalación fresca de `BunsenLabs`, la generación del archivo de configuración fue relativamente fluida. Solo tuve que instalar dos dependencias. El proceso de configuración en sí fue más interesante:

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

Aquí instalé o vinculé 19 paquetes adicionales.

|Problema|Solución|
|---|---|
|comprobando si gcc... no|apt-get install gcc|
|se requiere bison|apt-get install bison|
|/usr/bin/apxs: No such file|apt-get install apache2-dev|
|xml2-config no encontrado|apt-get install libxml2-dev|
|No se puede encontrar <evp.h> de OpenSSL|apt-get install libssl-dev|
|No se pueden encontrar las bibliotecas de OpenSSL|apt-get install pkg-config|
|Por favor, reinstale BZip2|apt-get install libbz2-dev|
|easy.h debería estar en `<curl-dir>`|apt-get install libcurl4-gnutls-dev|
|jpeglib.h no encontrado.|apt-get install libjpeg-dev|
|png.h no encontrado|apt-get install libpng-dev|
|xpm.h no encontrado|apt-get install libxpm-devel|
|freetype-config no encontrado|apt-get install libfreetype6-dev|
|No se puede localizar gmp.h|apt-get install libgmp-dev \*1|
|No se puede detectar ICU|apt-get install libicu-dev|
|No se puede encontrar ldap| \*2 |
|mcrypt.h no encontrado|apt-get install libmcrypt-dev|
|mysql\_config no encontrado|apt-get install mysql-server libmysqlclient-dev|
|No se puede encontrar pspell|apt-get install libpspell-dev|
|No se puede encontrar recode.h|apt-get install librecode-dev|

Las estrellas están relacionadas con el hecho de que, aunque los paquetes están instalados, el instalador de `php` no los detecta. En este caso, el problema se puede resolver vinculándolos simbólicamente a las ubicaciones que busca el instalador.

```
ln -sf /usr/include/x86_64-linux-gnu/gmp.h /usr/include/gmp.h
ln -sf /usr/lib/x86_64-linux-gnu/liblber.so /usr/lib/liblber.so
```

### Compilación

Si ahora realizamos la compilación, a pesar de la configuración exitosa, se producirá el siguiente error.

```
/usr/bin/ld: ext/ldap/.libs/ldap.o: undefined reference to symbol 'ber_scanf@@OPENLDAP_2.4_2'
/usr/lib/x86_64-linux-gnu/liblber-2.4.so.2: error adding symbols: DSO missing from command line
collect2: error: ld returned 1 exit status
Makefile:289: polecenia dla obiektu 'sapi/cli/php' nie powiodły się
make: *** [sapi/cli/php] Błąd 1
```

Resolvemos este problema instalando `apache2`, pero para proceder, es necesario rehacer toda la configuración desde el principio. Antes de la compilación real, limpiamos los resultados de fracasos anteriores.

```
sudo make clean
```

Y aprovechamos tantos procesadores como sea posible para la compilación

```
sudo make -j `cat /proc/cpuinfo | grep processor | wc -l`
```

Ha pasado un tiempo desde que hubo una imagen, así que aquí hay una captura de pantalla de la compilación:

![komplacja](https://i.imgur.com/5HPC4MC.png)

Desde que estaba compilando conectado a través de `ssh` en la computadora portátil mencionada y una máquina virtual simultáneamente, tenemos tres htops a la derecha: el primero con 2 procesadores (portátil), el del medio con 1 procesador (máquina virtual) y el último con 8 (la máquina local en la que estoy escribiendo). Es visible cómo mi computadora principal (el tercer htop) desplaza la tarea de compilación que se está realizando en la máquina virtual entre dos núcleos físicos en este momento.

Este es un proceso relativamente largo, puede tomar varios minutos a una docena de minutos dependiendo del hardware. Este es un buen momento para relajarse. La compilación finaliza con el mensaje:

```
Build complete.
Don't forget to run 'make test'.
```

Las pruebas duran unos minutos, pero no afectan el resultado final. Todas las fuentes que utilicé omitieron este paso. Independientemente de si pruebas tu `php` o no, el siguiente paso importante después de la compilación es la instalación.

```
sudo make install
```

Para dirigir `php` a las ubicaciones apropiadas, ingresamos:

```
sudo update-alternatives --install /usr/bin/php php /usr/local/php/7.0/bin/php 50 --slave /usr/share/man/man1/php.1.gz php.1.gz /usr/local/php/7.0/php/man/man1/php.1
```

Si le pedimos al sistema la versión de `php` en este momento obtendremos

```
# php -v
PHP 7.0.14 (cli) (built: Dec 18 2016 21:56:13) ( NTS )
Copyright (c) 1997-2016 The PHP Group
Zend Engine v3.0.0, Copyright (c) 1998-2016 Zend Technologies
```

Sin embargo, no funcionará en sitios web. Para solucionar esto, configuramos los módulos de apache2.

### Conectando a Apache2

Comenzaremos agregando el archivo `/etc/apache2/mods-available/php7.conf` con el contenido:

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

y luego activaremos y desactivaremos los módulos apropiados.

```
a2dismod mpm_event
a2enmod mpm_prefork
a2enmod php7
```

Y lo reiniciamos:

```
service apache2 restart
```

Para comprobar si todo está funcionando en el directorio `/var/www/html`, reemplazamos el archivo `index.html` con el archivo `index.php` que contiene

```
5=<?php
echo 2+3;
```

Todo el proceso de compilación se puede ver en el video de abajo:

### Gist con scripts

Para evitar ejecutar todos los comandos manualmente, estoy adjuntando un [gist](https://gist.github.com/gustawdaniel/79aae802d0c99ba3ef633efa441d5863) con scripts. Tenemos tres archivos allí:

```
├── php7.conf
├── php_install.sh
└── send.sh
```

Si queremos empezar desde una máquina local, las descargamos localmente en la misma carpeta y editamos `send.sh` ingresando la `ip` de la máquina donde queremos realizar la instalación. El script `send.sh` envía los archivos `php7.conf` y `php_install.sh` a la máquina virtual en la ubicación `/usr/src`. También podemos descargar `php7.conf` y `php_install.sh` a `/usr/src` de la máquina virtual de inmediato.

Allí, ejecutamos `php_install.sh`, que instala los paquetes necesarios, descarga las fuentes, realiza la configuración y compilación, instala `php`, y finalmente copia `php7.conf` al directorio de configuración de `apache` y lo configura para trabajar correctamente con `php`.

## Fuentes:

Mientras escribía esta entrada, me beneficié de la ayuda de docenas de personas que resolvieron problemas de compilación en sus blogs, en diversas comunidades de Stack, o en discusiones en GitHub sin esperar ninguna compensación. Estoy extremadamente agradecido a todos ellos. No puedo enumerarlos a todos, así que mencionaré solo algunas fuentes que más me ayudaron:

* [Compilando PHP 7 en CentOS](http://www.shaunfreeman.name/compiling-php-7-on-centos/)
* [Compilando PHP 7 en Ubuntu](https://gist.github.com/m1st0/1c41b8d0eb42169ce71a)
* [Iniciando sesión como root a través de SSH](https://linuxconfig.org/enable-ssh-root-login-on-debian-linux-server)
* [Guardando la contraseña para SSH](http://www.linuxproblem.org/art_9.html)
* [Lista oficial de dependencias de PHP](http://php.net/manual/en/install.unix.php)
* [Configuración de Apache al compilar PHP](https://docs.moodle.org/32/en/Compiling_PHP_from_source)
* [AskUbuntu](http://askubuntu.com/questions/760907/upgrade-to-16-04-php7-not-working-in-browser)
