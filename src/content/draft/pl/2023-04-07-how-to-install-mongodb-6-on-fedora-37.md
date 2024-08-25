---
title: How to install MongoDB 6 on Fedora 37
slug: how-to-install-mongodb-6-on-fedora-37
publishDate: 2023-04-07T06:06:07.000Z
date_updated: 2023-04-07T06:06:08.000Z
draft: true
---

In official docs there is instruction only for Redhat

[https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-red-hat/](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-red-hat/)

and it contains $releasever in repository file. But on fedora $releasever is not defined. So to fix it you can check url

```
https://repo.mongodb.org/yum/redhat/
```

and see that the highest version of redhat is 9. Because of Fedora is experimental polygon of Redhat you can derive conclusion that it should works if you use redhat repository on fedora like this:

```
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo<
```

Now you can install by

```
sudo dnf install -y mongodb-org
```

![](https://preciselab.io/content/images/2023/03/1_SwgB2rxPWgOjbh030ETxyg.png)

so there are two assumptions that are correct:

* using redhat repo for fedora works
* using dnf for yum repos works

```
sudo systemctl start mongod
```

And you can connect with mongodb by mongosh

![](https://preciselab.io/content/images/2023/03/Zrzut-ekranu-z-2023-03-02-13-19-32.png)

Mongosh is better than mongo command because of colors and autocompletion, so use mongosh instead of mongo.

## Mongo compass

To browse mongo in graphic mode you will probably choose compass. Following after

[https://www.mongodb.com/docs/compass/master/install/](https://www.mongodb.com/docs/compass/master/install/)

you can download rpm packages

```
wget https://downloads.mongodb.com/compass/mongodb-compass-1.35.0.x86_64.rpm
```

and install it

```
sudo dnf install -y mongodb-compass-1.35.0.x86_64.rpm
```

![](https://preciselab.io/content/images/2023/03/Zrzut-ekranu-z-2023-03-02-13-41-28.png)

## Enable Mongo Replica Set locally

Replication described here:

[https://www.mongodb.com/docs/manual/replication/](https://www.mongodb.com/docs/manual/replication/)

is required by prisma so I am enabling it locally.

In file /etc/mongod.conf you have to replace

```
#replication:
```

by

```
replication:
  replSetName: "rs0"
```

then reload mongod service

```
sudo systemctl restart mongod
```

Login to database by mongosh and use command

```
rs.initiate()
```

then you can confirm changes by

```
rs.status()
```

![](https://preciselab.io/content/images/2023/03/Zrzut-ekranu-z-2023-03-02-13-30-41.png)

If you experiencing more complications there is great article with advanced config

[https://www.digitalocean.com/community/tutorials/how-to-configure-a-mongodb-replica-set-on-ubuntu-20-04/](https://www.digitalocean.com/community/tutorials/how-to-configure-a-mongodb-replica-set-on-ubuntu-20-04/)

![](https://preciselab.io/content/images/2023/03/mongodb-is-web-scale-v0-twb0dwtz8sw81.jpeg)
