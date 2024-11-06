---
author: Daniel Gustaw
canonicalName: infrastructure-as-code-terraform-digital-ocean
coverImage: http://localhost:8484/27abc6de-a862-4788-8803-a28567286529.avif
description: "En esta publicación, muestro cómo configurar servidores utilizando la línea de comandos de terraform."
excerpt: "En esta publicación, muestro cómo configurar servidores utilizando la línea de comandos de terraform."
publishDate: 2021-03-04 18:19:11+00:00
slug: es/infraestructura-definida-como-codigo
tags:
- iac
title: Infraestructura como Código (Terraform + Digital Ocean)
updateDate: 2021-04-07 10:30:29+00:00
---

En el raspado, un factor importante es la escala a la que podemos expandir la tasa de recuperación y procesamiento de datos. Hace unos años, cuando escribí mi primer sistema que recopilaba datos en paralelo utilizando varios servidores, cada uno de estos servidores fue "clicado" por mí en el panel del proveedor.

Ahora mostraré cómo configurar servidores desde la línea de comandos utilizando `terraform`. El proveedor será Digital Ocean, ya que tiene precios de transferencia de red muy favorables (8-10 veces más bajos) en comparación con su mayor competidor.

![](http://localhost:8484/72ece5c5-d1f6-4ebe-8859-9a24cd3b0792.avif)

# Instalación de Terraform

```
yay -S terraform
```

# Conectando el Proveedor

Para conectarnos a Digital Ocean necesitamos un token. Si no lo tenemos, encontraremos el botón "Generar Nuevo Token" en la pestaña API en el panel.

![](http://localhost:8484/7b60cea7-c6e4-45e7-bdac-d6d058495700.avif)

Vale la pena guardar el token en `~/.zshrc` o `~/.bashrc`

```
export DIGITALOCEAN_TOKEN=xxxxxxxxxxxxxxxxxxxxxx
```

después de volver a ejecutar, este archivo estará disponible en todos los proyectos que creemos.

La documentación oficial muestra cómo hacer esto utilizando la variable `do_token`

pero no recomiendo este método, ya que nos obliga a agregar argumentos `-var` a los comandos de `terraform`, y el enfoque presentado aquí nos ahorra la cantidad de caracteres escritos.

Para configurar la conexión a Digital Ocean teniendo el token en variables de entorno, creamos un archivo `provider.tf` y escribimos lo siguiente:

```
terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
      version = "2.5.1"
    }
  }
}

provider "digitalocean" {}
```

Y luego ejecutamos el comando de inicialización.

```
terraform init
```

# Implementación del Servidor

El siguiente paso es planificar y configurar la infraestructura. En nuestro caso, será muy simple. Debería contener exactamente un droplet con claves para todo el inventario en el que quiero iniciar sesión.

Creamos otro archivo. Lo llamé `master.tf`

```
data "digitalocean_ssh_key" "dell" {
  name = "Daniel Laptop Dell"
}
data "digitalocean_ssh_key" "yoga" {
  name = "Daniel Lenovo Yoga"
}
data "digitalocean_ssh_key" "hp" {
  name = "Daniel Stacjonarny"
}
# Create a web server
resource "digitalocean_droplet" "web" {
  image  = "ubuntu-18-04-x64"
  name   = "web-1"
  region = "fra1"
  size   = "s-1vcpu-1gb"
  ssh_keys = [
    data.digitalocean_ssh_key.dell.id,
    data.digitalocean_ssh_key.yoga.id,
    data.digitalocean_ssh_key.hp.id
  ]
}
```

Estas son las claves que encontraremos en la pestaña "Configuración -> Seguridad" en el panel de Digital Ocean.

![](http://localhost:8484/13c7dbc8-5b4f-4843-88e2-1e942b199997.avif)

Ejecución

```
 terraform plan
```

Verificará si nuestra configuración está bien y nos permitirá ver cómo cambiará la arquitectura después del despliegue. En este caso, será la adición de un servidor - exactamente como lo escribimos en la configuración.

![](http://localhost:8484/bfa6cdb3-6771-4e57-a5e8-a4d2038b709d.avif)

Implementaremos ingresando

```
terraform apply -auto-approve
```

La ejecución de este comando me tomó `47s`.

# Resumen de Resultados

Para ver lo que hemos configurado, ejecutamos el comando:

```
 terraform show terraform.tfstate
```

Devuelve datos sobre los recursos gestionados por `terraform`

![](http://localhost:8484/327be4b6-5983-4721-865e-d1f701442660.avif)

Lo más interesante para nosotros es `ip`. En este caso `164.90.174.250`.

Inicia sesión en el servidor con el comando

```
ssh -o "StrictHostKeyChecking no" root@164.90.174.250
```

Como puedes ver, funciona porque el comando nos registró en el servidor `web-1` como `root`.

![](http://localhost:8484/31769e58-e37d-457e-a28f-09e42b3718aa.avif)

Después de regresar a `localhost` con el comando

```
exit
```

podemos eliminar todos los droplets creados con el comando

```
 terraform destroy -auto-approve
```

¡Se debe recordar después de completar el trabajo, especialmente si operamos a gran escala de potencia de computación!
