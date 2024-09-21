---
title: How to transform BTC blockchain to neo4j on Fedora Linux
slug: btc-neo4j-fedora
publishDate: 1970-01-01T00:00:00.000Z
date_updated: 2023-04-27T07:25:49.000Z
draft: true
---

This article is heavily inspired by repository, but add some context for Fedora Linux and analyse chance of speedup data preparation.

[GitHub - in3rsha/bitcoin-to-neo4j: Import the Bitcoin blockchain in to a Neo4j graph database.](https://github.com/in3rsha/bitcoin-to-neo4j)

## Setup BTC node

Firstly we need to install Bitcoin node

```
dnf install bitcoin-core-server
```

And start it by

```
bitcoin-core-server
```

You will see something like this

![](http://localhost:8484/c8665561-71c4-4336-9923-22980843b17b.avif)

You should expect about half of TB of data. So you can measure it by

```
du -h ~/.bitcoin
```

Expected time of synchronization can be estimated as 1-5 days.

## Setup neo4j server

Second step is installation of neo4j database.

[Red Hat, CentOS, Fedora, and Amazon Linux distributions (.rpm) - Operations Manual](https://neo4j.com/docs/operations-manual/current/installation/linux/rpm/)

In my case there was java already installed

```
java --version
openjdk 17.0.6 2023-01-17
OpenJDK Runtime Environment (Red_Hat-17.0.6.0.10-1.fc37) (build 17.0.6+10)
OpenJDK 64-Bit Server VM (Red_Hat-17.0.6.0.10-1.fc37) (build 17.0.6+10, mixed mode, sharing)
```

So lacking steps was:

```
sudo rpm --import https://debian.neo4j.com/neotechnology.gpg.key
sudo cat <  /etc/yum.repos.d/neo4j.repo
[neo4j]
name=Neo4j RPM Repository
baseurl=https://yum.neo4j.com/stable/5
enabled=1
gpgcheck=1
EOF
```

and

```
sudo dnf install neo4j
```

It installed both db server and shell to `cypher` that is general language for graph data

![](http://localhost:8484/1b2da78e-7d6e-4bdb-bdae-7cc98e5c4678.avif)

Finally i started neo4j db

```
sudo service neo4j start
```

Next step was installation neo4j desktop interface.

[Neo4j Desktop User Interface Guide - Developer Guides](https://neo4j.com/developer/neo4j-desktop/)
