---
author: Daniel Gustaw
canonicalName: pulumi-infrastructure-as-a-code-digital-ocean
coverImage: http://localhost:8484/f370e14e-6fd0-48ef-b689-02d89d85bfb7.avif
description: Za pomocą Pulumi możesz zdefiniować swoją infrastrukturę IT w pliku opisanym za pomocą twojego ulubionego języka programowania. Ten artykuł pokazuje, jak to zrobić.
excerpt: Za pomocą Pulumi możesz zdefiniować swoją infrastrukturę IT w pliku opisanym za pomocą twojego ulubionego języka programowania. Ten artykuł pokazuje, jak to zrobić.
publishDate: 2022-11-27 12:52:11+00:00
slug: pl/pulumi-infrastruktura-jako-kod
tags:
- pulumi
- iac
- deployment
title: Pulumi - Infrastruktura jako kod [ Digital Ocean ]
updateDate: 2022-11-27 12:53:23+00:00
---

### Jak zmieniało się wdrażanie w ciągu lat?

Początkowo (70 lat temu) komputery były programowane poprzez ręczną zmianę połączeń kablowych. Nie było osobistego komputera stacjonarnego, więc programy były pisane na produkcji. Brak wdrożenia - brak problemu.

![](http://localhost:8484/bddc2654-5995-464a-b996-2dd693d9ae4e.avif)

pierwsi programiści komputerów cyfrowych

Około dekadę później IBM wprowadził karty dziurkowane, więc wdrożenie lub instalacja odbywała się poprzez wsunięcie karty z programem do czytnika.

![](http://localhost:8484/6a3f24e6-d7bc-4356-8b14-46ecbbccf45f.avif)

Kolejny przełom - internet i protokoły ftp (1971) zmieniły wszystko. Aby przenieść programy na inne maszyny, przestano potrzebować fizycznego nośnika oprócz kabli łączących z siecią.

Generalnie proces był prosty. Należało skopiować pliki binarne na mainframe i uruchomić tutaj program.

Istniał tylko jeden problem. Koszt komputerów był ogromny, więc aby je optymalnie wykorzystać i odzyskać inwestycję, wprowadzono wirtualizację - logiczne dzielenie zasobów maszyny pomiędzy procesy.

Niestety na maszynach x86 występował problem z wirtualizacją niektórych instrukcji procesora, a w latach 1980-1990 ta metoda została porzucona na koniec epoki superkomputerów.

Wracamy do wirtualizacji w 1990 roku, nie tylko z powodu rosnących kosztów i nieefektywności utrzymania infrastruktury, ale także dzięki technice wirtualizacji adaptacyjnej wprowadzonej przez VMware. Wykryli instrukcje, które były problematyczne podczas wirtualizacji i przekształcili je na bezpieczne odpowiedniki.

Moim zdaniem, dla procesu wdrażania to rewolucja porównywalna do internetu. Internet zcyfryzował nośnik programu podczas wdrażania, ale wirtualizacja pozwoliła na zmianę parametrów serwera bez dotykania sprzętu.

Te zmiany były ważne dla dostawców chmury i branży IaaS, ale deweloperzy byli podzieleni na tych, którzy umieszczali na serwerach swoje własne maszyny wirtualne, oraz tych, którzy używali ftp lub scp do kopiowania programów na VPS-y dostarczane przez ich dostawców.

Kolejną ogromną rewolucją był Docker, napisany w Go w 2013 roku, i wykorzystujący przestrzenie nazw dostępne od jądra Linux 2.6.24 z 2008 roku. Jego popularność eksplodowała w 2017 roku. Głównym problemem czasów przed Dockerem była konfiguracja serwera do używania naszej aplikacji. Kiedy środowisko uruchomieniowe było skonfigurowane na serwerze, wtedy dwie różne aplikacje z różnymi wersjami lub konfiguracją uruchomieniową nie mogły być zainstalowane na tym samym hoście. Jeśli były pakowane jako maszyny wirtualne, cała warstwa systemu operacyjnego była duplikowana. Docker rozwiązał te problemy.

![](http://localhost:8484/9f422d08-4002-44ac-b29c-a8b841c07dc2.avif)

Ale to nie koniec. Gdy ludzie nauczyli się korzystać z Dockera i stworzyli przepływy CI/CD do automatyzacji procesów wdrażania i testowania, zdali sobie sprawę, że zarządzanie serwerami można również realizować na poziomie kodu.

Infrastruktura jako kod ma tę samą przewagę nad panelem administracyjnym w zarządzaniu serwerami, co interfejs wiersza poleceń nad GUI w zarządzaniu osobistym komputerem stacjonarnym - jest uniwersalna i można nią łatwo zarządzać za pomocą skryptów napisanych przez użytkownika końcowego.

Dominującą pozycję wśród produktów IaC ma Terraform rozwijany przez Hashicorp. Jest łatwy do nauczenia, ale wymaga własnego języka konfiguracyjnego.

to jest przykładowa konfiguracja:

```tf
provider "aws" {
  region = "us-west-2"
}

provider "random" {}

resource "random_pet" "name" {}

resource "aws_instance" "web" {
  ami           = "ami-a0cfeed8"
  instance_type = "t2.micro"
  user_data     = file("init-script.sh")

  tags = {
    Name = random_pet.name.id
  }
}
```

Nie będziemy się skupiać na tej części kodu. Jeśli jesteś tym zainteresowany i znasz język polski, napisałem artykuł na temat terraform tutaj:

[Infrastrukura defniowana przez kod (terraform + digital ocean)](https://gustawdaniel.com/infrastrukura-defniowana-jako-kod/)

Teraz skupimy się na konkurencie Terraform. Porozmawiajmy o pulumi.

![](http://localhost:8484/2c69f8e4-e541-4d09-bc72-c55d3118ae44.avif)

# Pulumi

Pulumi to platforma do definiowania infrastruktury za pomocą programów napisanych w:

* typescript
* python
* go
* c#
* java
* yaml

Obsługuje ponad 70 dostawców chmur. Kluczową różnicą w porównaniu do terraformu jest prostota dostosowywania uzyskiwana dzięki przetwarzaniu danych używanych do definiowania parametrów infrastruktury.

Zamiast pliku z `init-script`, który należy wykonać na nowym `vps`, mogę użyć szablonu i zrenderować go z moimi zmiennymi środowiskowymi. Zamiast kopiować konfigurację, mogę przechodzić przez środowiska, łącząc subdomeny z odpowiednimi serwerami.

Aby zainstalować pulumi cli, uruchom polecenie:

```
curl -sSL https://get.pulumi.com | sh
```

Możemy zacząć od utworzenia katalogu dla naszej konfiguracji:

```
mkdir pulumi && cd pulumi
```

Teraz chcemy stworzyć nowy projekt korzystając z szablonu. Aby wyświetlić szablony typescript, możemy wpisać:

```
pulumi new -l | grep typescript
```

Stwórzmy konfigurację dla Digital Ocean

```
pulumi new digitalocean-typescript
```

Teraz zainstalujemy dwa pakiety:

* dotenv - aby używać wartości zdefiniowanych w pliku .env i dodać je do `process`
* jsrender - aby renderować szablon skryptu do przygotowania serwera

```
npm i dotenv jsrender
```

Teraz możemy utworzyć plik `.env` z dwiema wartościami:

```
DOCKER_REGISTRY_DOMAIN=___
DOCKER_TOKEN=__
```

Musimy przygotować wszystkie serwery w ten sam sposób. Poniżej przedstawiam nasze wymagania:

* musimy być zalogowani do rejestru docker
* tmux musi być skonfigurowany z odpowiednim przypisaniem klawiszy
* snap musi być wyłączony i usunięty, aby uniknąć błędu 100% CPU
* python z zainstalowanymi pakietami `docker` i `docker-compose` dla ansible
* zainstalowane i uruchomione `nginx-proxy-automation`

Aby to zrealizować, stwórzmy `userData.sh` z następującą treścią:

```bash
#!/bin/bash

export DOCKER_REGISTRY_DOMAIN={{:DOCKER_REGISTRY_DOMAIN}}
export DOCKER_TOKEN={{:DOCKER_TOKEN}}

cat <<EOT >> ~/.bashrc
export DOCKER_REGISTRY_DOMAIN={{:DOCKER_REGISTRY_DOMAIN}}
export DOCKER_TOKEN={{:DOCKER_TOKEN}}
EOT

cat <<EOT >> ~/.tmux.conf
set -g terminal-overrides 'xterm*:smcup@:rmcup@'

# remap prefix from 'C-b' to 'C-a'
unbind C-b
set-option -g prefix C-a
bind-key C-a send-prefix

# switch panes using Alt-arrow without prefix
bind -n M-Left select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up select-pane -U
bind -n M-Down select-pane -D

# Enable mouse control (clickable windows, panes, resizable panes)
#set -g mouse-select-window on
#set -g mouse-select-pane on
#set -g mouse-resize-pane on

# Enable mouse mode (tmux 2.1 and above)
set -g mouse on

set -g pane-border-format "#{pane_index}#{?@custom_pane_title,:#{@custom_pane_title},}:#{pane_title}"

bind e set-window-option synchronize-panes
EOT

sudo systemctl disable snapd.service
sudo systemctl disable snapd.socket
sudo systemctl disable snapd.seeded.service

sudo apt autoremove --purge snapd -y
sudo rm -rf /var/cache/snapd/
rm -rf ~/snap

echo "${DOCKER_TOKEN}" | docker login -u "${DOCKER_TOKEN}" "${DOCKER_REGISTRY_DOMAIN}" --password-stdin;

apt -y update
apt -y install python3 python3-pip
pip3 install docker docker-compose

git clone --recurse-submodules https://github.com/evertramos/nginx-proxy-automation.git ~/proxy && cd ~/proxy/bin && ./fresh-start.sh --yes -e gustaw.daniel@gmail.com --use-nginx-conf-files
```

### Token osobisty Digital Ocean

Teraz musimy wybrać klucze ssh do serwera. Aby to zrobić, potrzebujemy `doctl` - interfejsu wiersza poleceń dla digital ocean. Na tej platformie możesz mieć konto, które należy do różnych zespołów (kontekstów). Aby wyświetlić konteksty, użyj

```
doctl auth ls
```

Możemy wybrać kontekst przez:

```
doctl auth switch --context preciselab
```

Sprawdźmy, czy mamy prawidłowy dostęp:

```
doctl account get
```

jeśli zobaczysz błąd, możemy zalogować się za pomocą tokenu

```
doctl auth init
```

Będziesz potrzebować tokena, który można wygenerować w zakładce `API` w panelu Digital Ocean

![](http://localhost:8484/b01bcdbe-b267-4ff1-9738-da6dfcae157e.avif)

Ten sam token powinien być użyty do połączenia pulumi z Twoim Digital Ocean:

```
pulumi config set digitalocean:token TOKEN_VALUE --secret
```

### Klucze SSH

W tym zespole musisz przechowywać swoje klucze SSH. Aby je wyświetlić, użyj:

```
doctl compute ssh-key list
```

w nowym projekcie będzie to pusta lista, więc utwórz klucze. Jeśli chcesz oddzielić klucze w CI/CD od swoich osobistych, jako nazwę pliku możesz użyć swojego projektu.

```
ssh-keygen -t ed25519 -C "gustaw.daniel@gmail.com" -f ~/.ssh/id_ed25519
```

dodaj klucze publiczne do ustawień zabezpieczeń w Digital Ocean:

![](http://localhost:8484/4afd761e-f1ce-4e61-b4df-8e822587e997.avif)

Po dodaniu możesz ponownie zapytać o klucze, ponieważ będziesz potrzebować tych numerów zwróconych przez polecenie:

```
doctl compute ssh-key list
```

### Konfiguracja Pulumi index.ts

Aby używać importu bez gwiazdek, musimy dodać dwie `compilerOptions` do twojego `tsconfig.json`

```json
"allowSyntheticDefaultImports": true,
"esModuleInterop": true
```

A na koniec crème de la crème - plik `index.ts`

```typescript
import 'dotenv/config'
import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";
import fs from 'fs';
import {templates} from 'jsrender';

// we reading template ( there are no secretes )
const userDataTemplate = fs.readFileSync('./userData.sh').toString();

// secretes are injected during render
const userData = templates(userDataTemplate).render(process.env)

// this is our default droplet config
const dropletConfig = {
    image: "docker-20-04",
    region: "fra1",
    size: "s-1vcpu-1gb-intel",
    monitoring: true,
    backups: false,
    userData, // there is rendered script to initiate server
    sshKeys: [
        // here are ids of keys saved on digital ocean
        '36403277', //    Github Actions
        '34336169', //    Daniel Laptop
    ]
};

// now we defining that we need two servers
const dropletApi = new digitalocean.Droplet("xue-api", dropletConfig);
const dropletUi = new digitalocean.Droplet("xue-ui", dropletConfig);

// and single main domain
const domain = new digitalocean.Domain("xue.academy", {
    name: "xue.academy",
}, {deleteBeforeReplace: true});

// two environments:
// a) production without subdomain
// b) staging with subdomain stag
const envs:Array<{name: 'stag' | 'prod', subdomain: string}> = [{
    subdomain: '',
    name: 'prod'
}, {
    subdomain: 'stag',
    name: 'stag'
}]

// there are helpers function to name resources correctly
function recordName(envName: 'prod' | 'stag', name: string) {
    return envName === 'prod' ? name : `${name}-${envName}`;
}

// and simplify subdomain selecton
function subdomainName(envName: 'prod' | 'stag', name: string) {
    return envName === 'prod' ? name : (name === '@' ? `${envName}` : `${name}.${envName}`);
}

// we can iterate over environments connecting domains with servers
for(let env of envs) {
    const dnsUi = new digitalocean.DnsRecord(recordName(env.name, `xue.academy`), {
        name: subdomainName(env.name, "@"),
        domain: domain.id,
        value: dropletUi.ipv4Address,
        type: 'A'
    }, {deleteBeforeReplace: true})

    const dnsApi = new digitalocean.DnsRecord(recordName(env.name, "api.xue.academy"), {
        name: subdomainName(env.name, "api"),
        domain: domain.id,
        value: dropletApi.ipv4Address,
        type: 'A'
    }, {deleteBeforeReplace: true})
}

// Export the name of the domain
export const ipUi = dropletUi.ipv4Address;
export const ipApi = dropletApi.ipv4Address;
```

To jest super prosta konfiguracja, ale możemy łatwo dodać bazę danych mysql.

```typescript
const mysql = new digitalocean.DatabaseCluster("mysql", {
  engine: "mysql",
  nodeCount: 1,
  region: "fra1",
  size: "db-s-1vcpu-1gb",
  version: "8",
}, {parent: playground});

const coreDatabase = new digitalocean.DatabaseDb("database-core", {clusterId: mysql.id});

export const mysqlId = mysql.id;
export const mysqlHost = mysql.host;
export const mysqlUser = mysql.user;
export const mysqlPassword = mysql.password;
export const mysqlPort = mysql.port;
export const mysqlUri = mysql.uri;
```

lub instancja redis

```typescript
const redis = new digitalocean.DatabaseCluster("redis", {
  engine: "redis",
  nodeCount: 1,
  region: "fra1",
  size: "db-s-1vcpu-1gb",
  version: "6",
}, {parent: playground});

export const redisHost = redis.host;
export const redisUser = redis.user;
export const redisPassword = redis.password;
export const redisPort = redis.port;
export const redisUri = redis.uri;
```

Mam nadzieję, że ten artykuł pomoże Ci zacząć z pulumi na Digital Ocean i przestrzegać podstawowej zasady devops:

> Lepiej spędzić 10 godzin na nieudanym automatyzowaniu, niż robić zadanie ręcznie.

![](http://localhost:8484/de358710-bd2f-40ee-a21e-ccb7758edec6.avif)

Podsumujmy zalety podejścia IaC.

* bardziej niezawodne zarządzanie infrastrukturą
* możesz używać tego samego procesu zatwierdzania / testowania co dla kodu do infrastruktury
* łatwo możesz mnożyć środowiska bez klikania w panele administracyjne dostawców
* migracje projektu do konta klienta niezależne od mechanizmu migracji dostawcy infrastruktury
