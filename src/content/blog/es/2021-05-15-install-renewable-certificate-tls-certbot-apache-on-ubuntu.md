---
author: Daniel Gustaw
canonicalName: install-renewable-certificate-tls-certbot-apache-on-ubuntu
coverImage: http://localhost:8484/c29ee70d-e79e-4738-b1dd-fa9818d798a9.avif
description: Hay muchos métodos para obtener un certificado que permita cifrar el tráfico HTTP. Uno de ellos es instalar Certbot y usarlo junto con el servidor Apache.
excerpt: Hay muchos métodos para obtener un certificado que permita cifrar el tráfico HTTP. Uno de ellos es instalar Certbot y usarlo junto con el servidor Apache.
publishDate: 2021-05-14 20:38:00+00:00
slug: es/instalacion-de-certificado-tls-renovable
tags:
- https
- ssl
- certbot
- ubuntu
title: Instalación de un certificado TLS renovable (certbot + apache en Ubuntu)
updateDate: 2021-06-22 09:05:15+00:00
---

## Descripción del Proyecto

Un protocolo se entiende como un conjunto de reglas para el intercambio de información. Uno de ellos es el protocolo HTTP desarrollado en el CERN en 1989, que define el método de transmisión de documentos de hipertexto. Si ciframos la comunicación utilizando protocolos criptográficos, obtenemos HTTPS. Su ventaja es que es resistente a la escucha y a los ataques de hombre en el medio.

En cuanto a los protocolos criptográficos, el protocolo actualmente utilizado es TLS 1.2. Es el sucesor del protocolo SSL, en el cual Google descubrió una grave vulnerabilidad en forma de susceptibilidad al ataque POODLE a finales de 2014. También hay un borrador de la versión 1.3 disponible en línea, que tiene como objetivo eliminar completamente MD5 y RC4, considerados herramientas débiles hoy en día, e introducir curvas elípticas, que también se utilizan en Bitcoins.

El objetivo de esta entrada es mostrar **cómo instalar un certificado TLS**.

## Instalación

El protocolo HTTPS se está volviendo cada vez más común, en gran parte gracias a la fundación Let’s Encrypt, patrocinada por EFF, Akamai, Cisco y Mozilla. Gracias a ella, se creó el programa certbot, que simplificó enormemente el proceso de obtención de un certificado. Asumo que tenemos el sistema Ubuntu y el servidor Apache 2 instalados. Para instalar certbot, introducimos lo siguiente:

```
apt-get install software-properties-common
add-apt-repository ppa:certbot/certbot
ENTER
apt-get update
apt-get install python-certbot-apache
```

Lo lanzamos con el comando:

```
certbot --apache
```

A continuación, proporcionamos nuestro correo electrónico, confirmamos nuestro acuerdo con los términos de servicio con la letra A, respondemos a la pregunta de si queremos compartir nuestro correo electrónico y seleccionamos dominios de la lista de dominios especificada en la configuración de Apache2. Finalmente, elegimos si queremos hacer cumplir https o ofrecer https como solo una de las opciones.

## Actualización

Dado que el certificado expira 90 días después de su emisión, necesitamos un mecanismo para su actualización automática. Afortunadamente, esto es simple. No hará daño si lo actualizamos con más frecuencia. Según una guía de terceros confiable, agregamos el comando para actualizar el certificado a cron.

```
crontab -e
```

y en el archivo colocamos una línea

```
45 1 * * 1 /usr/bin/certbot renew >> /var/log/certbot.log
```

Ahora podemos disfrutar de un candado verde en nuestro sitio.

![](https://i.imgur.com/6LaRspC.png)

## Fuentes:

Instalación de certbot

> [https://certbot.eff.org/#ubuntuxenial-apache](https://certbot.eff.org/#ubuntuxenial-apache)

Diferencias entre SSL y TLS

> [https://luxsci.com/blog/ssl-versus-tls-whats-the-difference.html](https://luxsci.com/blog/ssl-versus-tls-whats-the-difference.html)

Ataque POODLE

> [https://blog.mozilla.org/security/2014/10/14/the-poodle-attack-and-the-end-of-ssl-3-0/](https://blog.mozilla.org/security/2014/10/14/the-poodle-attack-and-the-end-of-ssl-3-0/)

Guía de un tercero de confianza

> [https://zaufanatrzeciastrona.pl/post/jak-wdrozyc-automatycznie-odnawiane-darmowe-certyfikaty-ssl-od-lets-encrypt/](https://zaufanatrzeciastrona.pl/post/jak-wdrozyc-automatycznie-odnawiane-darmowe-certyfikaty-ssl-od-lets-encrypt/)

Estadísticas de uso de HTTPS

> [https://www.google.com/transparencyreport/https/metrics/?hl=en](https://www.google.com/transparencyreport/https/metrics/?hl=en)
