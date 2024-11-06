---
author: Daniel Gustaw
canonicalName: how-to-configure-ssl-in-local-development
coverImage: http://localhost:8484/54493527-eac3-463a-a991-b0d4ced05f23.avif
description: Configurar una conexión https en el dominio localhost puede ser un desafío si lo haces por primera vez. Esta publicación es un tutorial muy detallado con todos los comandos y capturas de pantalla.
excerpt: Configurar una conexión https en el dominio localhost puede ser un desafío si lo haces por primera vez. Esta publicación es un tutorial muy detallado con todos los comandos y capturas de pantalla.
publishDate: 2021-11-15T16:47:42.000Z
slug: es/como-configurar-ssl-en-desarrollo-local
tags: ['ssl', 'https', 'security']
title: Cómo configurar SSL en el desarrollo local
updateDate: 2021-11-15T16:47:42.000Z
---

## Dominio Local

```
cat /etc/resolv.conf
```

[Resolución de nombres de dominio - ArchWiki](https://wiki.archlinux.org/index.php/Resolución_de_nombres_de_dominio)

Sin embargo, no siempre tenemos que pedir las direcciones IP de los servidores `DNS`. Las consultas a servidores DNS externos pueden ser anuladas por nuestras entradas en el archivo `/etc/hosts`.

El contenido de este archivo puede verse así para ti:

```
# Static table lookup for hostnames.
# See hosts(5) for details.
127.0.0.1	localhost
::1		localhost
127.0.1.1	hp-1589
```

Para agregar nuestro dominio a esto, necesitamos editar el archivo `hosts`.

```
sudo nvim /etc/hosts
```

Agregamos una línea al final:

```
127.0.0.1	local.dev
```

Para probar esta configuración, escribiremos una página simple en `php`. Guardamos en el archivo `index.php`:

```
<?php
header('Content-Type: application/json');
echo '{"status":"ok"}';
```

Podemos alojarlo con el comando

```
php -S localhost:8000 index.php
```

Comando Natural:

```
http http://localhost:8000/
```

devolverá `{"status": "ok"}`. Desafortunadamente, la consulta para el dominio:

```
http http://local.dev:8000/
```

mostrar error:

```
http: error: ConnectionError: HTTPConnectionPool(host='local.dev', port=8000): Max retries exceeded with url: / (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7fbaa2dfcc40>: Failed to establish a new connection: [Errno 111] Connection refused')) while doing a GET request to URL: http://local.dev:8000/
```

El dominio nos dirige al lugar apropiado, lo cual se puede confirmar con `getent`.

```
getent hosts local.dev
127.0.0.1       local.dev
```

El problema radica en la limitación de hosts en los que está configurado el servidor.

> Trampa 1: verifica qué host tiene tu servidor local.

En el comando `php -S localhost:8000 index.php` no deberíamos usar `localhost`. Este es un caso común en otros lenguajes también, donde los frameworks sirven por defecto en el host localhost cuando deberían estar en `0.0.0.0`.

Para solucionar el problema, detenemos el servidor y lo configuramos con el comando

```
php -S 0.0.0.0:8000 index.php
```

Esta vez funciona correctamente.

![](http://localhost:8484/d280540b-5da1-4b91-87e3-c85834524e59.avif)

## Instalación de Nginx

```
yay -S nginx
```

Lo encendemos:

```
sudo systemctl start nginx.service
```

Si queremos que comience en cada arranque del sistema, añadimos:

```
sudo systemctl enable nginx.service
```

No usaría ese segundo comando en una computadora local, ya que bloquea innecesariamente el puerto `80`.

Después de instalar `nginx`, nos recibió su página de bienvenida en el puerto `80`.

![](http://localhost:8484/edc5f538-f5d8-4da4-b860-1e724fff2f49.avif)

### Nginx en Mac OS

En el sistema `Mac OS`, nginx por defecto se inicia en el puerto `8080`.

Podemos cambiar esto editando el archivo `/usr/local/etc/nginx/nginx.conf` y comenzando el servidor con el comando.

```
launchctl load /usr/local/Cellar/nginx/1.21.4/homebrew.mxcl.nginx.plist
```

## Preparando un certificado auto-firmado

Para usar un certificado SSL durante el desarrollo de aplicaciones locales, necesitas usar un certificado `auto-firmado`.

Su creación está descrita en la documentación de Arch:

[nginx - ArchWiki](https://wiki.archlinux.org/index.php/nginx)

Los comandos que nos interesan son:

```
sudo mkdir /etc/nginx/ssl
cd /etc/nginx/ssl
sudo openssl req -new -x509 -nodes -newkey rsa:4096 -keyout server.key -out server.crt -days 1095
sudo chmod 400 server.key
sudo chmod 444 server.crt
```

En `Mac OS`, una mejor ubicación será el directorio `/usr/local/etc/nginx/ssl`.

## Agregando el certificado a Nginx

En este momento, nuestro certificado aún no está conectado al servidor. Nginx no está escuchando en el puerto `443`, y como resultado, una solicitud a `https://localhost` falla:

```
http --verify no https://localhost

http: error: ConnectionError: HTTPSConnectionPool(host='localhost', port=443): Max retries exceeded with url: / (Caused by NewConnectionError('<urllib3.connection.HTTPSConnection object at 0x7f089f77fee0>: Failed to establish a new connection: [Errno 111] Connection refused')) while doing a GET request to URL: https://localhost/
```

Ahora cambiaremos la configuración de `nginx`.

```
sudo nvim /etc/nginx/nginx.conf
```

o en `Mac OS`

```
sudo nano /usr/local/etc/nginx/nginx.conf
```

agregar una entrada bajo la clave `http`:

```
    server {
        listen       443 ssl;
        server_name  localhost;

        ssl_certificate      ssl/server.crt;
        ssl_certificate_key  ssl/server.key;

        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
        }
    }
```

Después de recargar el servicio con el comando:

```
sudo systemctl reload nginx.service
```

o en `Mac OS`

```
sudo brew services restart nginx
```

veremos que la página predeterminada de nginx está disponible en `https`:

```
http --verify no -h https://localhost
HTTP/1.1 200 OK
```

La ventaja de tal configuración es que https funciona, pero los certificados autofirmados no son soportados por `httpie` y el navegador también puede tener problemas con ellos.

Para pasar al siguiente paso, vamos a eliminar estos certificados. No los utilizaremos más. En lugar de certificados autofirmados, crearemos una organización que firmará un certificado de dominio para nosotros.

## Redirección SSL a la aplicación

Nos convertimos en una autoridad certificadora (CA)

#### Autoridad Certificadora (CA)

Generando una clave privada sin una contraseña

```
openssl genrsa -out myCA.key 2048
```

Este comando crea el archivo `myCA.key`

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA+aKMj19W37DjX3nrQ7XTjP3trXXK5hLvByRDKL/QsMGOrxac
...
Xt0itnAcq1vPqqRcsV+YPAE8oyAOXHM1aaTQIH5mp5jHySOqZtSFca8=
-----END RSA PRIVATE KEY-----
```

Generando un certificado `root`.

```
openssl req -x509 -new -nodes -key myCA.key -sha256 -days 825 -out myCA.pem
```

Recibimos preguntas sobre los datos del organismo de certificación. Respondí a las preguntas de la siguiente manera:

```
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:PL
State or Province Name (full name) [Some-State]:Mazovian
Locality Name (eg, city) []:Warsaw
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Precise Lab CA
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:PL_CA
Email Address []:gustaw.daniel@gmail.com
```

recibimos el archivo `myCA.pem` con el contenido

```
-----BEGIN CERTIFICATE-----
MIID5zCCAs+gAwIBAgIUUfo+Snobo0e/HXHJm5Hf4B0TvGEwDQYJKoZIhvcNAQEL
...
7ntEpRg3YZUdDtM0ptDvETM8+H35V9aZtUo1/e2136x459pGZd1aJz+Hhg==
-----END CERTIFICATE-----
```

#### Certificado Firmado

Creamos un certificado `firmado por la CA` (ya no auto-firmado)

Definimos una variable con el dominio guardado:

```
NAME=local.dev
```

Generando una clave privada

```
openssl genrsa -out $NAME.key 2048
```

recibimos el archivo `local.dev.key` con el contenido

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEApvXY4EiWGELQuVTEH9YZ8Qoi0Owq39cQ+g93e7EaKlMzx1fU
...
VburjZcC/InypDy0ZChc6tC0z5A6qkWlLA+3eGs8ADtvQ4qtCS9+Aw==
-----END RSA PRIVATE KEY-----
```

A continuación, creamos una solicitud para su firma.

```
openssl req -new -key local.dev.key -out local.dev.csr
```

Se nos pide de nuevo datos. Esta vez son los datos de la organización que desea firmar el certificado. No podemos proporcionar el mismo `Common Name`. Mis respuestas:

```
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:PL
State or Province Name (full name) [Some-State]:Mazovian
Locality Name (eg, city) []:Warsaw
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Precise Lab Org
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:PL
Email Address []:gustaw.daniel@gmail.com

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

Después de ejecutar este comando, obtenemos el archivo `local.dev.csr` con el contenido:

```
-----BEGIN CERTIFICATE REQUEST-----
MIICxjCCAa4CAQAwgYAxCzAJBgNVBAYTAlBMMREwDwYDVQQIDAhNYXpvdmlhbjEP
...
9f1qkg6LHapOjzevheKWEjWG1hnJjBOj42mmIDBVZBHVszP7rrfiRMma
-----END CERTIFICATE REQUEST-----
```

Ahora crearemos el archivo de configuración de la extensión. Guardamos el contenido en el archivo `$NAME.ext`

```
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = local.dev
```

Creando un certificado firmado

```
openssl x509 -req -in $NAME.csr -CA myCA.pem -CAkey myCA.key -CAcreateserial -out $NAME.crt -days 825 -sha256 -extfile $NAME.ext
```

Si todo fue exitoso, deberíamos ver:

```
Signature ok
subject=C = PL, ST = Mazovian, L = Warsaw, O = Precise Lab, emailAddress = gustaw.daniel@gmail.com
Getting CA Private Key
```

Podemos verificar si construimos correctamente el certificado usando el comando:

```
openssl verify -CAfile myCA.pem -verify_hostname local.dev local.dev.crt

local.dev.crt: OK
```

o en `Mac OS`

```
openssl verify -CAfile myCA.pem local.dev.crt
```

Resumamos los pasos que hemos tomado:

* Nos convertimos en la organización certificadora "Precise Lab CA," que tiene la clave `myCA.key` y el certificado `myCA.pem`
* Firmamos el certificado de dominio utilizando el certificado y la clave de la organización certificadora para el dominio. Para esto, se necesitaba su clave `local.dev.key`, la solicitud de firma `local.dev.csr` emitida por "Precise Lab Org," y el archivo de configuración de extensión `local.dev.ext`
* El certificado firmado se encuentra en el archivo `local.dev.crt`.

#### Confiando en la organización certificadora en Chrome

Ahora deberíamos confiar en la organización certificadora. Agreguemos su archivo `pem` como `Autoridad` en la configuración del navegador. En la barra de direcciones, escribimos:

```
chrome://settings/certificates
```

Veremos:

![](http://localhost:8484/6c552745-d6d7-452f-a6a8-c82b77ee9398.avif)

Después de hacer clic en importar y seleccionar el archivo `myCA.pem`, indicamos qué operaciones de esta organización queremos confiar:

![](http://localhost:8484/e185608f-e06f-465d-98bc-e75a4927ef7e.avif)

#### Confianza de la autoridad de certificación en Firefox

En Firefox, ve a `about:preferences#privacy` y en la pestaña "Certificados", haz clic en "Ver Certificados". Luego seleccionamos importar y el archivo `myCA.pem`.

![](http://localhost:8484/cdd83c80-7b45-4b9d-a265-ceeb578f1ebf.avif)

marcar inmediatamente a la organización certificadora como confiable

![](http://localhost:8484/dd644237-d42b-4a95-8b0b-1d956846ab83.avif)

En contraste con Chrome, estos ajustes son independientes del sistema operativo.

#### Confiando en una autoridad de certificación en Mac OS en Chrome

En computadoras con `Mac OS`, no podemos cambiar la configuración directamente en Chrome. En su lugar, abrimos Finder. Buscamos el archivo `myCA.pem` y hacemos doble clic en él.

![](http://localhost:8484/9991f51f-8d61-4770-81e8-8f154afa0a68.avif)

después de confirmar con la contraseña, deberíamos ver nuestra organización en la pestaña "Certificados" en el programa "Llaveros"

![](http://localhost:8484/5b588af5-97db-419c-ab7e-8f481ee6a521.avif)

Ahora necesitamos marcar este certificado como confiable seleccionando la opción "Siempre Confiar".

![](http://localhost:8484/5aba5b59-a2de-432c-b7a7-15812fc0ea64.avif)

#### Configuración de Nginx como Proxy

Una vez más, cambiamos la configuración de `nginx`. Esta vez cambiamos al certificado generado y su clave.

```
    server {
        listen       443 ssl;
        server_name  local.dev;

        ssl_certificate      ssl/local.dev.crt;
        ssl_certificate_key  ssl/local.dev.key;

        location / {
                proxy_pass          http://127.0.0.1:8000;
                proxy_set_header    Host             $host;
                proxy_set_header    X-Real-IP        $remote_addr;
                proxy_set_header    X-Forwarded-For  $proxy_add_x_forwarded_for;
                proxy_set_header    X-Client-Verify  SUCCESS;
                proxy_set_header    X-Client-DN      $ssl_client_s_dn;
                proxy_set_header    X-SSL-Subject    $ssl_client_s_dn;
                proxy_set_header    X-SSL-Issuer     $ssl_client_i_dn;
                proxy_read_timeout 1800;
                proxy_connect_timeout 1800;
        }
    }
```

No podemos olvidar la sobrecarga del servidor:

```
sudo systemctl reload nginx.service
```

En `Mac OS` no hay `systemctl` y usamos `brew`

```
sudo brew services restart nginx
sudo pkill nginx
sudo nginx
```

al ingresar al sitio web:

> [https://local.dev/](https://local.dev/)

podemos disfrutar de la vista de un candado junto a la dirección del sitio local:

* en Chrome

![](http://localhost:8484/36f90ff2-6819-4123-a28a-fb0283c960fc.avif)

* y en Firefox

![](http://localhost:8484/5ea4ee9a-1437-4038-90f3-a30f91344a6e.avif)

Sin embargo, no veremos el resultado correcto en la consola:

```
http https://local.dev

http: error: SSLError: HTTPSConnectionPool(host='local.dev', port=443): Max retries exceeded with url: / (Caused by SSLError(SSLCertVerificationError(1, '[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1123)'))) while doing a GET request to URL: https://local.dev/
```

El error nos dice que no se pudo verificar el emisor del certificado local. Para que la solicitud desde la consola funcione, necesitamos especificar el certificado de verificación de la organización como un argumento de la bandera `--verify`.

```
http --verify /etc/nginx/ssl/myCA.pem https://local.dev
```

o en `Mac OS`

```
http --verify /usr/local/etc/nginx/ssl/myCA.pem https://local.dev
```

![](http://localhost:8484/cc8230e1-7e35-4f2e-a9c9-9cd0c9d7c0b3.avif)

### Aplicaciones del Certificado SSL Local

Mostramos cómo configurar una conexión https en una máquina local, lo cual es particularmente útil en el desarrollo de aplicaciones web. Típicamente, puedes desarrollar tus proyectos localmente utilizando `http`.

![](http://localhost:8484/a6538c2f-4169-43c1-85bb-ab1883ab4b05.avif)

A veces `https` es requerido por mecanismos como:

* Configuraciones de seguridad o SameSite para Cookies
* Configuraciones de acceso para cámara o micrófono en el navegador
* Algunas direcciones de webhook de APIs externas

### Ventajas y desventajas de Caddy

Auth0 recomienda usar el programa `caddy` en su documentación.

[HTTPS en Desarrollo](https://auth0.com/docs/libraries/secure-local-development#how-to-set-up-a-secure-local-server)

Su instalación es

```
yay -S caddy
```

o

```
brew install caddy
```

Ahora apagaremos nuestro servidor `nginx`.

```
sudo pkill nginx
```

inició con el comando `caddy`

```
caddy reverse-proxy --from localhost:443 --to localhost:8000
```

Y tenemos el siguiente efecto:

1. El candado funciona en la página `https://localhost` en Chrome.

![](http://localhost:8484/975e97f2-7903-46e8-b69b-0fa9209c7699.avif)

2\. `https://localhost` no funciona en Firefox

![](http://localhost:8484/e0abd4de-a853-465b-bda9-30ccae9ef5d4.avif)

3. Tampoco funciona desde la línea de comandos (httpie)

![](http://localhost:8484/da304157-3ba2-45fa-8d0e-61352c24a8c5.avif)

4. Por otro lado, curl funciona `curl [https://localhost](https://localhost)`.

Así que "caddy" es una manera de configurar rápidamente ssl local, pero con limitaciones. Su documentación parece prometedora, pero se puede esperar que enfrentar errores nos deje con muchas menos posibilidades de apoyo comunitario que en el caso de la auto-configuración según los pasos descritos en esta entrada. Si comenzamos con Caddy sin entender cómo configurar ssl por nuestra cuenta, la posibilidad de que los errores encontrados nos detengan durante un largo tiempo aumentará significativamente.

[Introducción - Documentación de Caddy](https://caddyserver.com/docs/getting-started)

#### Enlaces valiosos que profundizan en el tema SSL

Al preparar esta entrada, utilicé muchas fuentes externas. Los más valiosos que encontré están enlazados a continuación.

[Cómo usar una CA (como --cacert de curl) con HTTPie](https://stackoverflow.com/questions/44443269/how-to-use-a-ca-like-curls-cacert-with-httpie/67326625#67326625)

[Configurar (https) SSL en localhost para desarrollo de meteor](https://stackoverflow.com/a/35867609/6398044)

[error 18 en 0 depth lookup: certificado autofirmado](http://markstutpnt.blogspot.com/2019/01/error-18-at-0-depth-lookup-self-signed.html)
