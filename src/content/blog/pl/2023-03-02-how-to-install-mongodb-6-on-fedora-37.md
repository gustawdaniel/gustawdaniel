---
author: Daniel Gustaw
canonicalName: how-to-install-mongodb-6-on-fedora-37
coverImage: http://localhost:8484/acfa5bf6-4988-403e-8cc9-cbcca1a77015.avif
description: Instalacja Mongodb 6 na Fedora Linux 37. Artykuł pokazuje brakujący fragment oficjalnej dokumentacji oraz dwa kroki po instalacji, które są przedstawione w niezwykle prosty sposób w porównaniu do innych źródeł.
excerpt: Instalacja Mongodb 6 na Fedora Linux 37. Artykuł pokazuje brakujący fragment oficjalnej dokumentacji oraz dwa kroki po instalacji, które są przedstawione w niezwykle prosty sposób w porównaniu do innych źródeł.
publishDate: 2023-03-02 05:53:26+00:00
slug: pl/jak-zainstalowac-mongodb-6-na-fedora-37
tags:
- mongodb
- fedora
- linux
title: Jak zainstalować MongoDB 6 na Fedore 37
updateDate: 2023-03-02 05:57:46+00:00
---

W oficjalnej dokumentacji znajduje się instrukcja tylko dla Redhat

[Zainstaluj MongoDB Community Edition na Red Hat lub CentOS — Dokumentacja MongoDB](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-red-hat/)

i zawiera `$releasever` w pliku repozytorium. Ale w fedora `$releasever` nie jest zdefiniowane. Aby to naprawić, możesz sprawdzić adres URL.

```
https://repo.mongodb.org/yum/redhat/
```

i zobacz, że najwyższą wersją redhat jest 9. Ponieważ Fedora jest eksperymentalnym poligonem Redhat, możesz wyciągnąć wniosek, że powinno działać, jeśli użyjesz repozytorium redhat na fedora w ten sposób:

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

Teraz możesz zainstalować przez

```
sudo dnf install -y mongodb-org
```

![](http://localhost:8484/248dfc2f-9001-42a9-ab1c-56499b862376.avif)

więc są dwie poprawne założenia:

* używanie repozytoriów redhat dla fedory działa
* używanie dnf dla repozytoriów yum działa

Teraz musisz uruchomić usługę `mongod`

```bash
sudo systemctl start mongod
```

Możesz połączyć się z mongodb za pomocą `mongosh`

![](http://localhost:8484/cd36581b-5767-4983-8381-b05d8ef53202.avif)

Mongosh jest lepszy niż polecenie `mongo` z powodu kolorów i autouzupełniania, więc używaj `mongosh` zamiast `mongo`.

## Mongo Compass

Aby przeglądać mongo w trybie graficznym, prawdopodobnie wybierzesz Compass. Po tym

[Ściągnij i zainstaluj Compass — MongoDB Compass](https://www.mongodb.com/docs/compass/master/install/)

możesz pobrać pakiety `rpm`

```
wget https://downloads.mongodb.com/compass/mongodb-compass-1.35.0.x86_64.rpm
```

i zainstalować to

```
sudo dnf install -y mongodb-compass-1.35.0.x86_64.rpm
```

![](http://localhost:8484/d539655f-fa59-41a2-b203-e219fc72a510.avif)

## Włącz lokalnie zestaw replik Mongo

Replikacja opisana tutaj:

[Replikacja — Podręcznik MongoDB](https://www.mongodb.com/docs/manual/replication/)

jest wymagana przez `prisma`, więc włączam ją lokalnie.

W pliku `/etc/mongod.conf` musisz zastąpić

```yaml
#replication:
```

przez

```yaml
replication:
  replSetName: "rs0"
```

następnie załaduj ponownie usługę `mongod`

```bash
sudo systemctl restart mongod
```

Zaloguj się do bazy danych za pomocą `mongosh` i użyj polecenia

```sh
rs.initiate()
```

potem możesz potwierdzić zmiany przez

```sh
rs.status()
```

![](http://localhost:8484/89eeb74d-98d4-43f3-90c5-ddf888fb0534.avif)

Jeśli napotykasz więcej komplikacji, istnieje świetny artykuł z zaawansowaną konfiguracją

[Jak skonfigurować zestaw replik MongoDB na Ubuntu 20.04 | DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-configure-a-mongodb-replica-set-on-ubuntu-20-04)

![](http://localhost:8484/dd7f7dee-6cd4-4048-bc05-f83127be372f.avif)
