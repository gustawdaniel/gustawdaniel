---
author: Daniel Gustaw
canonicalName: how-to-install-mongodb-6-on-fedora-37
coverImage: http://localhost:8484/acfa5bf6-4988-403e-8cc9-cbcca1a77015.avif
description: Instalación de Mongodb 6 en Fedora Linux 37. El artículo muestra un fragmento faltante de la documentación oficial y dos pasos después de la instalación que se presentan de manera extremadamente simple en comparación con otras fuentes.
excerpt: Instalación de Mongodb 6 en Fedora Linux 37. El artículo muestra un fragmento faltante de la documentación oficial y dos pasos después de la instalación que se presentan de manera extremadamente simple en comparación con otras fuentes.
publishDate: 2023-03-02 05:53:26+00:00
slug: es/como-instalar-mongodb-6-en-fedora-37
tags:
- mongodb
- fedora
- linux
title: Cómo instalar MongoDB 6 en Fedora 37
updateDate: 2023-03-02 05:57:46+00:00
---

En la documentación oficial, hay instrucciones solo para Redhat

[Instalar MongoDB Community Edition en Red Hat o CentOS — Manual de MongoDB](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-red-hat/)

y contiene `$releasever` en el archivo del repositorio. Pero en Fedora, `$releasever` no está definido. Así que para solucionarlo, puedes verificar la URL.

```
https://repo.mongodb.org/yum/redhat/
```

y ver que la versión más alta de Red Hat es 9. Debido a que Fedora es un polígono experimental de Red Hat, puedes llegar a la conclusión de que debería funcionar si usas el repositorio de Red Hat en Fedora de esta manera:

```
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo<<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF
```

Ahora puedes instalar mediante

```
sudo dnf install -y mongodb-org
```

![](http://localhost:8484/248dfc2f-9001-42a9-ab1c-56499b862376.avif)

así que hay dos suposiciones que son correctas:

* usar el repositorio de redhat para fedora funciona
* usar dnf para repositorios de yum funciona

Ahora tienes que iniciar el servicio `mongod`

```bash
sudo systemctl start mongod
```

Y puedes conectarte con mongodb mediante `mongosh`

![](http://localhost:8484/cd36581b-5767-4983-8381-b05d8ef53202.avif)

Mongosh es mejor que el comando `mongo` debido a los colores y la autocompleción, así que usa `mongosh` en lugar de `mongo`.

## Mongo Compass

Para navegar por mongo en modo gráfico, probablemente elegirás Compass. Siguiendo después de

[Descargar e instalar Compass — MongoDB Compass](https://www.mongodb.com/docs/compass/master/install/)

puedes descargar paquetes `rpm`

```
wget https://downloads.mongodb.com/compass/mongodb-compass-1.35.0.x86_64.rpm
```

y instálalo

```
sudo dnf install -y mongodb-compass-1.35.0.x86_64.rpm
```

![](http://localhost:8484/d539655f-fa59-41a2-b203-e219fc72a510.avif)

## Habilitar el conjunto de réplicas de Mongo localmente

La replicación descrita aquí:

[Replicación — Manual de MongoDB](https://www.mongodb.com/docs/manual/replication/)

es requerida por `prisma`, así que la estoy habilitando localmente.

En el archivo `/etc/mongod.conf` tienes que reemplazar

```yaml
#replication:
```

por

```yaml
replication:
  replSetName: "rs0"
```

entonces recarga el servicio `mongod`

```bash
sudo systemctl restart mongod
```

Inicie sesión en la base de datos mediante `mongosh` y utilice el comando

```sh
rs.initiate()
```

entonces puedes confirmar cambios mediante

```sh
rs.status()
```

![](http://localhost:8484/89eeb74d-98d4-43f3-90c5-ddf888fb0534.avif)

Si está experimentando más complicaciones, hay un gran artículo con configuración avanzada

[Cómo Configurar un Conjunto de Réplicas de MongoDB en Ubuntu 20.04 | DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-configure-a-mongodb-replica-set-on-ubuntu-20-04)

![](http://localhost:8484/dd7f7dee-6cd4-4048-bc05-f83127be372f.avif)
