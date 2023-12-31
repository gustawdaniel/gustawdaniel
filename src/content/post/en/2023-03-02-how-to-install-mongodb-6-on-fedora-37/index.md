---
title: How to install MongoDB 6 on Fedora 37
slug: how-to-install-mongodb-6-on-fedora-37
publishDate: 2023-03-02T05:53:26.000Z
date_updated: 2023-03-02T05:57:46.000Z
tags: ['mongodb', 'fedora', 'linux']
excerpt: Mongodb 6 installation on Fedora Linux 37. Article shows lacking fragment of official docs and two steps after installation that are presented in extremely simple way in comparison to other sources.
---

In official docs there is instruction only for Redhat

[Install MongoDB Community Edition on Red Hat or CentOS — MongoDB Manual

![](https://www.mongodb.com/docs/assets/favicon.ico)

![](https://www.mongodb.com/docs/assets/meta_generic.png)](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-red-hat/)

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

![](../../../../assets/2023-03-02/1_SwgB2rxPWgOjbh030ETxyg.png)

so there are two assumptions that are correct:

* using redhat repo for fedora works
* using dnf for yum repos works

Now you have to start `mongod` service

```
sudo systemctl start mongod
```

And you can connect with mongodb by `mongosh`

![](../../../../assets/2023-03-02/Zrzut-ekranu-z-2023-03-02-13-19-32.png)

Mongosh is better than `mongo` command because of colors and autocompletion, so use `mongosh` instead of `mongo`.

## Mongo compass

To browse mongo in graphic mode you will probably choose compass. Following after

[Download and Install Compass — MongoDB Compass

![](https://www.mongodb.com/docs/assets/favicon.ico)

![](https://www.mongodb.com/docs/assets/meta_generic.png)](https://www.mongodb.com/docs/compass/master/install/)

you can download `rpm` packages

```
wget https://downloads.mongodb.com/compass/mongodb-compass-1.35.0.x86_64.rpm
```

and install it

```
sudo dnf install -y mongodb-compass-1.35.0.x86_64.rpm
```

![](../../../../assets/2023-03-02/Zrzut-ekranu-z-2023-03-02-13-41-28.png)

## Enable Mongo Replica Set locally

Replication described here:

[Replication — MongoDB Manual

![](https://www.mongodb.com/docs/assets/favicon.ico)

![](https://www.mongodb.com/docs/assets/meta_generic.png)](https://www.mongodb.com/docs/manual/replication/)

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

![](../../../../assets/2023-03-02/Zrzut-ekranu-z-2023-03-02-13-30-41.png)

If you experiencing more complications there is great article with advanced config

[How To Configure a MongoDB Replica Set on Ubuntu 20.04 | DigitalOcean

The practice of synchronizing data across multiple separate databases is called replication. In MongoDB, a group of servers that maintain the same data set through replication are referred to as a replica set. This tutorial provides a brief overview of how replication works in MongoDB before outlini…

![](https://www.digitalocean.com/_next/static/media/android-chrome-512x512.5f2e6221.png)DigitalOceanMark Drake

![](https://www.digitalocean.com/_next/static/media/intro-to-cloud.d49bc5f7.jpeg)](https://www.digitalocean.com/community/tutorials/how-to-configure-a-mongodb-replica-set-on-ubuntu-20-04)

![](../../../../assets/2023-03-02/mongodb-is-web-scale-v0-twb0dwtz8sw81.jpeg)
