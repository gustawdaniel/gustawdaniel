---
author: Daniel Gustaw
canonicalName: infrastructure-as-code-terraform-digital-ocean
coverImage: http://localhost:8484/27abc6de-a862-4788-8803-a28567286529.avif
description: "In this post, I show how to set up servers using the terraform command line."
excerpt: "In this post, I show how to set up servers using the terraform command line."
publishDate: 2021-03-04 18:19:11+00:00
slug: en/infrastructure-defined-as-code
tags:
- iac
title: Infrastructure as Code (Terraform + Digital Ocean)
updateDate: 2021-04-07 10:30:29+00:00
---

In scraping, an important factor is the scale to which we can expand the rate of data retrieval and processing. A few years ago, when I wrote my first system that collected data in parallel using several servers, each of these servers was "clicked" by me in the provider's panel.

Now I will show how to set up servers from the command line using `terraform`. The provider will be Digital Ocean, as it has very favorable (8-10 times lower) network transfer prices compared to its biggest competitor.

![](http://localhost:8484/72ece5c5-d1f6-4ebe-8859-9a24cd3b0792.avif)

# Installation of Terraform

```
yay -S terraform
```

# Connecting the Provider

To connect to Digital Ocean we need a token. If we do not have it, we will find the "Generate New Token" button in the API tab in the panel.

![](http://localhost:8484/7b60cea7-c6e4-45e7-bdac-d6d058495700.avif)

It's worth saving the token in `~/.zshrc` or `~/.bashrc`

```
export DIGITALOCEAN_TOKEN=xxxxxxxxxxxxxxxxxxxxxx
```

after re-executing this file will be available in all projects we create.

The official documentation shows how to do this using the `do_token` variable

but I do not recommend this method, as it forces us to add `-var` arguments to `terraform` commands, and the approach presented here saves us the number of characters typed.

To configure the connection to Digital Ocean having the token in environment variables, we create a file `provider.tf` and enter the following:

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

And then we execute the initialization command.

```
terraform init
```

# Server Deployment

The next step is to plan and set up the infrastructure. In our case, it will be very simple. It should contain exactly one droplet with keys to all the inventory that I want to log into.

We create another file. I named it `master.tf`

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

These are the keys that we will find in the "Settings -> Security" tab in the Digital Ocean panel.

![](http://localhost:8484/13c7dbc8-5b4f-4843-88e2-1e942b199997.avif)

Execution

```
 terraform plan
```

It will check if our configuration is okay and allow us to see how the architecture will change after deployment. In this case, it will be the addition of one server - exactly as we wrote in the configuration.

![](http://localhost:8484/bfa6cdb3-6771-4e57-a5e8-a4d2038b709d.avif)

We will implement by entering

```
terraform apply -auto-approve
```

The execution of this command took me `47s`.

# Overview of Results

To see what we have set up, we execute the command:

```
 terraform show terraform.tfstate
```

It returns data about resources managed by `terraform`

![](http://localhost:8484/327be4b6-5983-4721-865e-d1f701442660.avif)

The most interesting for us is `ip`. In this case `164.90.174.250`.

I log in to the server with the command

```
ssh -o "StrictHostKeyChecking no" root@164.90.174.250
```

As you can see, it works because the command logged us into the server `web-1` as `root`.

![](http://localhost:8484/31769e58-e37d-457e-a28f-09e42b3718aa.avif)

After returning to `localhost` with the command

```
exit
```

we can remove all created droplets with the command

```
 terraform destroy -auto-approve
```

It should be remembered after the work is completed, especially if we operate on a large scale of computing power!
