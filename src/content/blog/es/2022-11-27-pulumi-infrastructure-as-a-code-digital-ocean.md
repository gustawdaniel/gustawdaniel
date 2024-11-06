---
author: Daniel Gustaw
canonicalName: pulumi-infrastructure-as-a-code-digital-ocean
coverImage: http://localhost:8484/f370e14e-6fd0-48ef-b689-02d89d85bfb7.avif
description: Con Pulumi, puedes definir tu infraestructura de TI en un archivo descrito por tu lenguaje de programación favorito. Este artículo muestra cómo hacerlo.
excerpt: Con Pulumi, puedes definir tu infraestructura de TI en un archivo descrito por tu lenguaje de programación favorito. Este artículo muestra cómo hacerlo.
publishDate: 2022-11-27 12:52:11+00:00
slug: es/pulumi-infraestructura-como-codigo
tags:
- pulumi
- iac
- deployment
title: Pulumi - Infraestructura como Código [ Digital Ocean ]
updateDate: 2022-11-27 12:53:23+00:00
---

### ¿Cómo ha evolucionado el despliegue a lo largo de los años?

Inicialmente (hace 70 años), las computadoras se programaban mediante el cambio manual de conexiones de cables. No había escritorio personal, por lo que los programas se escribían en producción. Sin despliegue, sin problema.

![](http://localhost:8484/bddc2654-5995-464a-b996-2dd693d9ae4e.avif)

primeros programadores de computadora digital

Aproximadamente una década después, IBM introdujo tarjetas perforadas, por lo que el despliegue o la instalación se realizaba insertando una tarjeta con el programa en un lector.

![](http://localhost:8484/6a3f24e6-d7bc-4356-8b14-46ecbbccf45f.avif)

El siguiente gran avance - internet y protocolos ftp (1971) cambiaron todo. Para mover programas a otras máquinas ya no necesitabas un controlador físico, más allá de los cables que conectaban con la red.

En general, el proceso era simple. Tenías que copiar binarios al mainframe y ejecutar tu programa allí.

Solo había un problema. El costo de las computadoras era enorme, así que para utilizarlas de manera óptima y obtener un retorno de la inversión se introdujo la virtualización: división lógica de los recursos de la máquina entre procesos.

Desafortunadamente, en máquinas x86 había un problema con la virtualización de algunas instrucciones del procesador y en la década de 1980-1990 este método fue abandonado con el fin de la época de los supercomputadores.

Regresamos a la virtualización en 1990 no solo debido al aumento de costos y la ineficacia del mantenimiento de la infraestructura, sino también gracias a la técnica de virtualización adaptativa introducida por VMware. Ellos detectaron instrucciones que eran problemáticas durante la virtualización y las convirtieron en equivalentes seguros.

En mi opinión, para el proceso de despliegue, esto es una revolución similar a internet. Internet digitalizó el transporte de programas durante el despliegue, pero la virtualización permitió cambiar los parámetros del servidor sin tocar el hardware.

Estos cambios fueron importantes para los proveedores de nube y la rama IaaS, pero los desarrolladores estaban divididos entre aquellos que ponían en los servidores sus propias máquinas virtuales o aquellos que usaban ftp o scp para copiar programas a vps proporcionados por sus proveedores.

La siguiente gran revolución fue Docker, escrito en Go en 2013, y utilizando namespaces disponibles desde el kernel de linux 2.6.24 de 2008. Su popularidad explotó en 2017. El principal problema antes de Docker era la configuración del servidor para usar nuestra aplicación. Cuando el entorno de ejecución estaba configurado en el servidor, entonces dos aplicaciones diferentes con versiones o configuraciones diferentes de runtime no podían instalarse en el mismo host. Si estaban empaquetadas como máquinas virtuales, entonces toda la capa del sistema operativo se duplicaba. Docker resolvió estos problemas.

![](http://localhost:8484/9f422d08-4002-44ac-b29c-a8b841c07dc2.avif)

Pero no es el fin. Cuando la gente aprendió a usar Docker y creó flujos de CI/CD para automatizar los procesos de despliegue y pruebas, se dieron cuenta de que la gestión del servidor también se podía hacer a nivel de código.

La infraestructura como código tiene la misma ventaja sobre el panel de administración para gestionar servidores que la línea de comandos sobre la interfaz gráfica en la gestión del escritorio personal - es universal y puede ser gestionada fácilmente por scripts escritos por el usuario final.

La posición dominante entre los productos de IaC la tiene Terraform, desarrollado por Hashicorp. Es fácil de aprender pero requiere un lenguaje de configuración personalizado.

este es un ejemplo de configuración:

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

No nos enfocaremos en ninguna línea de este código. Si estás interesado en esto y sabes polaco, escribí un artículo sobre terraform aquí:

[Infrastrukura defniowana przez kod (terraform + digital ocean)](https://gustawdaniel.com/infrastrukura-defniowana-jako-kod/)

Ahora nos enfocaremos en el competidor de Terraform. Vamos a discutir Pulumi.

![](http://localhost:8484/2c69f8e4-e541-4d09-bc72-c55d3118ae44.avif)

# Pulumi

Pulumi es una plataforma para definir infraestructura mediante programas escritos en:

* typescript
* python
* go
* c#
* java
* yaml

Soporta más de 70 proveedores de nube. La principal diferencia con Terraform es la simplicidad de la personalización obtenida al procesar los datos usados para definir los parámetros de infraestructura.

En lugar de un archivo con `init-script` para ejecutar en un nuevo `vps`, puedo usar una plantilla y renderizarla con mis variables de entorno. En lugar de copiar la configuración, puedo iterar sobre los entornos conectando subdominios a servidores apropiados.

Para instalar el cli de Pulumi, ejecuta el comando:

```
curl -sSL https://get.pulumi.com | sh
```

Podemos empezar creando un directorio para nuestra configuración:

```
mkdir pulumi && cd pulumi
```

Ahora queremos crear un nuevo proyecto utilizando una plantilla. Para listar las plantillas de TypeScript podemos escribir:

```
pulumi new -l | grep typescript
```

Creemos una configuración para Digital Ocean.

```
pulumi new digitalocean-typescript
```

Ahora instalaremos dos paquetes:

* dotenv - para usar valores definidos en el archivo .env y agregarlos a `process`
* jsrender - para renderizar la plantilla del script para preparar el servidor

```
npm i dotenv jsrender
```

Ahora podemos crear un archivo `.env` con dos valores:

```
DOCKER_REGISTRY_DOMAIN=___
DOCKER_TOKEN=__
```

Necesitamos que todos los servidores tengan la misma preparación inicial. A continuación, enumero nuestros requisitos:

* necesitamos estar conectados al registro de docker
* tmux debe estar configurado con la vinculación de teclas correcta
* snap debe estar deshabilitado y eliminado para evitar el error de CPU al 100%
* python con los paquetes `docker` y `docker-compose` instalados para ansible
* `nginx-proxy-automation` instalado y iniciado

Para satisfacerlos, vamos a crear `userData.sh` con el contenido:

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

### Token Personal de Digital Ocean

Ahora tenemos que seleccionar claves ssh para el servidor. Para hacerlo necesitamos `doctl` - cli para digital ocean. En esta plataforma puedes tener una cuenta que pertenece a diferentes equipos (contextos). Para listar los contextos usa

```
doctl auth ls
```

Podemos seleccionar el contexto mediante:

```
doctl auth switch --context preciselab
```

Verifiquemos si tenemos acceso correcto:

```
doctl account get
```

si ves un error, podemos iniciar sesión con token

```
doctl auth init
```

Necesitarás un token que se puede generar en la pestaña `API` en el panel de Digital Ocean

![](http://localhost:8484/b01bcdbe-b267-4ff1-9738-da6dfcae157e.avif)

El mismo token debe ser utilizado para conectar pulumi con tu digital ocean:

```
pulumi config set digitalocean:token TOKEN_VALUE --secret
```

### Claves SSH

En este equipo, debes almacenar tus claves ssh. Para listarlas, usa:

```
doctl compute ssh-key list
```

en un nuevo proyecto estará vacía la lista, así que crea claves. Si deseas aislar las claves en CI/CD de tus claves personales como nombre de archivo, puedes utilizar tu proyecto.

```
ssh-keygen -t ed25519 -C "gustaw.daniel@gmail.com" -f ~/.ssh/id_ed25519
```

agregar claves públicas a la configuración de seguridad en digital ocean:

![](http://localhost:8484/4afd761e-f1ce-4e61-b4df-8e822587e997.avif)

Después de agregar, puedes preguntar nuevamente sobre las claves porque necesitarás estos números devueltos por el comando:

```
doctl compute ssh-key list
```

### Configuración de index.ts de Pulumi

Para usar importaciones sin asteriscos, necesitamos agregar dos `compilerOptions` a tu `tsconfig.json`

```json
"allowSyntheticDefaultImports": true,
"esModuleInterop": true
```

Y finalmente la crème de la crème - archivo `index.ts`

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

Esta es una configuración súper simple, pero podemos añadir fácilmente una base de datos MySQL.

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

o instancia de redis

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

Espero que este artículo te ayude a comenzar con pulumi en Digital Ocean y seguir la regla principal de devops:

> Es mejor gastar 10 horas fallando en automatizar, que hacer la tarea manualmente.

![](http://localhost:8484/de358710-bd2f-40ee-a21e-ccb7758edec6.avif)

Vamos a resumir las ventajas del enfoque IaC.

* gestión de infraestructura más confiable
* puedes utilizar el mismo flujo de aprobación / pruebas que para el código a infraestructura
* puedes multiplicar fácilmente los entornos sin hacer clic en los paneles de administración de los proveedores
* migraciones de proyectos a la cuenta de los clientes independientes del mecanismo de migración del proveedor de infraestructura
