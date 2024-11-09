---
title: How to upload images with s3cmd
publishDate: 2024-11-07
---

In this article, I will show you how to upload images to an S3 bucket using the `s3cmd` command-line tool. S3cmd is a free command-line tool for managing Amazon S3 storage that allows you to upload, download, and manage files in your S3 bucket.

## Install s3cmd

```bash
yay -S s3cmd
```

## Configure s3cmd

To configure s3cmd, run the following command:

```bash
s3cmd --configure
```

You will be prompted to enter your AWS Access Key ID, AWS Secret Access Key, default region, and other configuration options. Once you have entered your credentials, s3cmd will create a configuration file in your home directory (`~/.s3cfg`) with your settings.

You can find detailed instruction for digital ocean here: https://docs.digitalocean.com/products/spaces/reference/s3cmd/

Generally you have to visit https://cloud.digitalocean.com/account/api/spaces to get Access and Secret key. Rest can be filled as following.:

```yaml
Access Key: 🍄🍄🍄🍄🍄🍄🍄🍄🍄
Secret Key: 🥕🥕🥕🥕🥕🥕🥕🥕🥕🥕🥕🥕🥕🥕🥕🥕🥕🥕🥕🥕
Default Region: fra1
S3 Endpoint: fra1.digitaloceanspaces.com
DNS-style bucket+hostname:port template for accessing a bucket: preciselab.fra1.digitaloceanspaces.com
Encryption password:
Path to GPG program: /usr/bin/gpg
Use HTTPS protocol: True
HTTP Proxy server name:
HTTP Proxy server port: 0
```

## Check if it works

````bash
$ s3cmd ls
2022-07-29 21:37  s3://preciselab
````

and

```bash
$ s3cmd ls s3://preciselab
DIR  s3://preciselab/blog/
```

## Upload image

You can upload single image

```bash
s3cmd put --acl-public image.jpg s3://preciselab/blog/img
```

Or just put all directory

```bash
$ s3cmd put --acl-public src/assets/images/* s3://preciselab/blog/img/ 

upload: 'src/assets/images/0062c4cc-438a-4837-b025-9a3bde260681.avif' -> 's3://preciselab/blog/img/0062c4cc-438a-4837-b025-9a3bde260681.avif'  [1 of 503]
 12653 of 12653   100% in   18s   676.65 B/s  done
Public URL of the object is: http://fra1.digitaloceanspaces.com/preciselab/blog/img/0062c4cc-438a-4837-b025-9a3bde260681.avif
...
```

Much better option is `sync` that copying only new/changed files:

```bash
s3cmd sync --acl-public src/assets/images s3://preciselab/blog/img/ 
```

## Download image

Now you can check if downloading by `curl` works:

```bash
curl -sL https://fra1.digitaloceanspaces.com/preciselab/blog/img/0062c4cc-438a-4837-b025-9a3bde260681.avif -o image.avif
feh image.avif 
```

but you can also download by `s3cmd`:

```bash
s3cmd get s3://preciselab/blog/img/0062c4cc-438a-4837-b025-9a3bde260681.avif
feh 0062c4cc-438a-4837-b025-9a3bde260681.avif
```

