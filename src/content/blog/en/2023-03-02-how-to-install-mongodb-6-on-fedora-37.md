---
author: Daniel Gustaw
canonicalName: how-to-install-mongodb-6-on-fedora-37
coverImage: http://localhost:8484/acfa5bf6-4988-403e-8cc9-cbcca1a77015.avif
date_updated: 2023-03-02 05:57:46+00:00
description: Mongodb 6 installation on Fedora Linux 37. Article shows lacking fragment
  of official docs and two steps after installation that are presented in extremely
  simple way in comparison to other sources.
excerpt: Mongodb 6 installation on Fedora Linux 37. Article shows lacking fragment
  of official docs and two steps after installation that are presented in extremely
  simple way in comparison to other sources.
publishDate: 2023-03-02 05:53:26+00:00
slug: en/how-to-install-mongodb-6-on-fedora-37
tags:
- mongodb
- fedora
- linux
title: How to install MongoDB 6 on Fedora 37
---



In official docs there is instruction only for Redhat

[Install MongoDB Community Edition on Red Hat or CentOS — MongoDB Manual](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-red-hat/)

and it contains `$releasever` in repository file. But on fedora `$releasever` is not defined. So to fix it you can check url

```
https://repo.mongodb.org/yum/redhat/
```

and see that higest version of redhat is 9. Because of Fedora is experimental polygon of Redhat you can derive conclusion that it should works if you use redhat repository on fedora like this:

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

Now you can install by

```
sudo dnf install -y mongodb-org
```

![](http://localhost:8484/248dfc2f-9001-42a9-ab1c-56499b862376.avif)

so there are two assumptions that are correct:

* using redhat repo for fedora works
* using dnf for yum repos works

Now you have to start `mongod` service

```
sudo systemctl start mongod
```

And you can connect with mongodb by `mongosh`

![](http://localhost:8484/cd36581b-5767-4983-8381-b05d8ef53202.avif)

Mongosh is better than `mongo` command because of colors and autocompletion, so use `mongosh` instead of `mongo`.

## Mongo compass

To browse mongo in graphic mode you will probably choose compass. Following after

[Download and Install Compass — MongoDB Compass](https://www.mongodb.com/docs/compass/master/install/)

you can download `rpm` packages

```
wget https://downloads.mongodb.com/compass/mongodb-compass-1.35.0.x86_64.rpm
```

and install it

```
sudo dnf install -y mongodb-compass-1.35.0.x86_64.rpm
```

![](http://localhost:8484/d539655f-fa59-41a2-b203-e219fc72a510.avif)

## Enable Mongo Replica Set locally

Replication described here:

[Replication — MongoDB Manual](https://www.mongodb.com/docs/manual/replication/)

is required by `prisma` so I am enabling it locally.

In file `/etc/mongod.conf` you have to replace

```
#replication:
```

by

```3
replication:
  replSetName: "rs0"
```

then reload `mongod` service

```
sudo systemctl restart mongod
```

Login to database by `mongosh` and use command

```
rs.initiate()
```

then you can confirm changes by

```
rs.status()
```

![](http://localhost:8484/89eeb74d-98d4-43f3-90c5-ddf888fb0534.avif)

If you experiencing more complications there is great article with advanced config

[How To Configure a MongoDB Replica Set on Ubuntu 20.04 | DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-configure-a-mongodb-replica-set-on-ubuntu-20-04)

![](http://localhost:8484/dd7f7dee-6cd4-4048-bc05-f83127be372f.avif)
