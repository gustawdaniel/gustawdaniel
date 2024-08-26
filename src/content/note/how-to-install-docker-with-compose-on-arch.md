---
title: How to install Docker with Compose on Arch
publishDate: 2024-08-08
---
Lets install docker package

```bash
yay -S docker
```

Start daemon

```bash
sudo systemctl start docker.service
```

Enable to preserve changes

```bash
sudo systemctl enable docker.service
```

Add yourself to docker group

```bash
sudo usermod -aG docker $USER
```

change current user group id to docker

```bash
newgrp docker
```

Although versions looks correctly

```bash
$ docker --version
Docker version 27.1.1, build 63125853e3
$ docker compose --version
Docker version 27.1.1, build 63125853e3
```

You will get error on

```bash
$ docker compose
docker: 'compose' is not a docker command
```

Fix it installing `docker-compose`

```bash
yay -S docker-compose
```

And confirm by

```bash
$ docker compose version
Docker Compose version 2.29.1
```