---
author: Daniel Gustaw
canonicalName: how-to-configure-ssl-in-local-development
coverImage: http://localhost:8484/54493527-eac3-463a-a991-b0d4ced05f23.avif
description: Setting up an https connection on the localhost domain can be challenging if you're doing it for the first time. This post is a very detailed tutorial with all the commands and screenshots.
excerpt: Setting up an https connection on the localhost domain can be challenging if you're doing it for the first time. This post is a very detailed tutorial with all the commands and screenshots.
publishDate: 2021-11-15T16:47:42.000Z
slug: en/how-to-configure-ssl-in-local-development
tags: ['ssl', 'https', 'security']
title: How to configure SSL in local development
updateDate: 2021-11-15T16:47:42.000Z
---

## Local Domain

```
cat /etc/resolv.conf
```

[Domain name resolution - ArchWiki](https://wiki.archlinux.org/index.php/Domain_name_resolution)

However, we do not always have to ask for the IP addresses of `DNS` servers. Queries to external DNS servers can be overridden by our entries in the file `/etc/hosts`.

The contents of this file may look like this for you:

```
# Static table lookup for hostnames.
# See hosts(5) for details.
127.0.0.1	localhost
::1		localhost
127.0.1.1	hp-1589
```

To add our domain to it, we need to edit the `hosts` file.

```
sudo nvim /etc/hosts
```

We add a line at the end:

```
127.0.0.1	local.dev
```

To test this configuration, we will write a simple page in `php`. We save to the file `index.php`:

```
<?php
header('Content-Type: application/json');
echo '{"status":"ok"}';
```

We can host it with the command

```
php -S localhost:8000 index.php
```

Naturally Command:

```
http http://localhost:8000/
```

it will return `{"status": "ok"}`. Unfortunately, the query for the domain:

```
http http://local.dev:8000/
```

show error:

```
http: error: ConnectionError: HTTPConnectionPool(host='local.dev', port=8000): Max retries exceeded with url: / (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7fbaa2dfcc40>: Failed to establish a new connection: [Errno 111] Connection refused')) while doing a GET request to URL: http://local.dev:8000/
```

The domain directs us to the appropriate place, which can be confirmed by `getent`.

```
getent hosts local.dev
127.0.0.1       local.dev
```

The problem lies in the limitation of hosts on which the server is set up.

> Trap 1: check what host your local server has.

In the command `php -S localhost:8000 index.php` we should not use `localhost`. This is a common case in other languages as well, where frameworks serve by default on the localhost host when they should be on `0.0.0.0`.

To fix the problem, we stop the server and set it up with the command

```
php -S 0.0.0.0:8000 index.php
```

This time it works correctly.

![](http://localhost:8484/d280540b-5da1-4b91-87e3-c85834524e59.avif)

## Nginx Installation

```
yay -S nginx
```

We turn it on:

```
sudo systemctl start nginx.service
```

If we want it to start at every system boot, we add:

```
sudo systemctl enable nginx.service
```

I wouldn't use that second command on a local computer, as it unnecessarily blocks port `80`.

After installing `nginx`, we were greeted by its welcome page on port `80`.

![](http://localhost:8484/edc5f538-f5d8-4da4-b860-1e724fff2f49.avif)

### Nginx on Mac OS

On the `Mac OS` system, nginx by default starts on port `8080`.

We can change this by editing the file `/usr/local/etc/nginx/nginx.conf` and starting the server with the command.

```
launchctl load /usr/local/Cellar/nginx/1.21.4/homebrew.mxcl.nginx.plist
```

## Preparing self-signed certificate

To use an SSL certificate during local application development, you need to use a `self-signed` certificate.

Its creation is described in the Arch documentation:

[nginx - ArchWiki](https://wiki.archlinux.org/index.php/nginx)

The commands we are interested in are:

```
sudo mkdir /etc/nginx/ssl
cd /etc/nginx/ssl
sudo openssl req -new -x509 -nodes -newkey rsa:4096 -keyout server.key -out server.crt -days 1095
sudo chmod 400 server.key
sudo chmod 444 server.crt
```

On `Mac OS`, a better location will be the directory `/usr/local/etc/nginx/ssl`.

## Adding the certificate to Nginx

At this moment, our certificate is not yet connected to the server. Nginx is not listening on port `443`, and as a result, a request to `https://localhost` fails:

```
http --verify no https://localhost

http: error: ConnectionError: HTTPSConnectionPool(host='localhost', port=443): Max retries exceeded with url: / (Caused by NewConnectionError('<urllib3.connection.HTTPSConnection object at 0x7f089f77fee0>: Failed to establish a new connection: [Errno 111] Connection refused')) while doing a GET request to URL: https://localhost/
```

Now we will change the `nginx` settings.

```
sudo nvim /etc/nginx/nginx.conf
```

or on `Mac OS`

```
sudo nano /usr/local/etc/nginx/nginx.conf
```

adding an entry under the key `http`:

```
    server {
        listen       443 ssl;
        server_name  localhost;

        ssl_certificate      ssl/server.crt;
        ssl_certificate_key  ssl/server.key;

        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
        }
    }
```

After reloading the service with the command:

```
sudo systemctl reload nginx.service
```

or on `Mac OS`

```
sudo brew services restart nginx
```

we will see that the default nginx page is available at `https`:

```
http --verify no -h https://localhost
HTTP/1.1 200 OK
```

The advantage of such a configuration is that https works, but self-signed certificates are not supported by `httpie` and the browser may also have issues with them.

To move on to the next step, we will delete these certificates. We will not use them anymore. Instead of self-signed certificates, we will create an organization that will sign a domain certificate for us.

## SSL redirect to the application

We become a certificate authority (CA)

#### Certificate Authority (CA)

Generating a private key without a password

```
openssl genrsa -out myCA.key 2048
```

This command creates the file `myCA.key`

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA+aKMj19W37DjX3nrQ7XTjP3trXXK5hLvByRDKL/QsMGOrxac
...
Xt0itnAcq1vPqqRcsV+YPAE8oyAOXHM1aaTQIH5mp5jHySOqZtSFca8=
-----END RSA PRIVATE KEY-----
```

Generating a `root` certificate.

```
openssl req -x509 -new -nodes -key myCA.key -sha256 -days 825 -out myCA.pem
```

We receive questions about the certification body's data. I answered the questions as follows:

```
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:PL
State or Province Name (full name) [Some-State]:Mazovian
Locality Name (eg, city) []:Warsaw
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Precise Lab CA
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:PL_CA
Email Address []:gustaw.daniel@gmail.com
```

we received the file `myCA.pem` with the content

```
-----BEGIN CERTIFICATE-----
MIID5zCCAs+gAwIBAgIUUfo+Snobo0e/HXHJm5Hf4B0TvGEwDQYJKoZIhvcNAQEL
...
7ntEpRg3YZUdDtM0ptDvETM8+H35V9aZtUo1/e2136x459pGZd1aJz+Hhg==
-----END CERTIFICATE-----
```

#### Signed Certificate

We create a `CA-signed` certificate (no longer self-signed)

We define a variable with the saved domain:

```
NAME=local.dev
```

Generating a private key

```
openssl genrsa -out $NAME.key 2048
```

we receive the file `local.dev.key` with the content

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEApvXY4EiWGELQuVTEH9YZ8Qoi0Owq39cQ+g93e7EaKlMzx1fU
...
VburjZcC/InypDy0ZChc6tC0z5A6qkWlLA+3eGs8ADtvQ4qtCS9+Aw==
-----END RSA PRIVATE KEY-----
```

Next, we create a request for its signature.

```
openssl req -new -key local.dev.key -out local.dev.csr
```

We are asked again for data. This time it is the data of the organization wishing to sign the certificate. We cannot provide the same `Common Name`. My answers:

```
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:PL
State or Province Name (full name) [Some-State]:Mazovian
Locality Name (eg, city) []:Warsaw
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Precise Lab Org
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:PL
Email Address []:gustaw.daniel@gmail.com

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

After executing this command, we get the file `local.dev.csr` with the content:

```
-----BEGIN CERTIFICATE REQUEST-----
MIICxjCCAa4CAQAwgYAxCzAJBgNVBAYTAlBMMREwDwYDVQQIDAhNYXpvdmlhbjEP
...
9f1qkg6LHapOjzevheKWEjWG1hnJjBOj42mmIDBVZBHVszP7rrfiRMma
-----END CERTIFICATE REQUEST-----
```

Now we will create the extension configuration file. We save the content to the file `$NAME.ext`

```
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = local.dev
```

Creating a signed certificate

```
openssl x509 -req -in $NAME.csr -CA myCA.pem -CAkey myCA.key -CAcreateserial -out $NAME.crt -days 825 -sha256 -extfile $NAME.ext
```

If everything was successful, we should see:

```
Signature ok
subject=C = PL, ST = Mazovian, L = Warsaw, O = Precise Lab, emailAddress = gustaw.daniel@gmail.com
Getting CA Private Key
```

We can verify if we correctly built the certificate using the command:

```
openssl verify -CAfile myCA.pem -verify_hostname local.dev local.dev.crt

local.dev.crt: OK
```

or on `Mac OS`

```
openssl verify -CAfile myCA.pem local.dev.crt
```

Let's summarize the steps we have taken:

* We became the certifying organization "Precise Lab CA," which has the key `myCA.key` and the certificate `myCA.pem`
* We signed the domain certificate using the certifying organization's certificate and key for the domain. For this, its key `local.dev.key`, the signing request `local.dev.csr` issued by "Precise Lab Org," and the configuration file extension `local.dev.ext` were needed
* The signed certificate is located in the file `local.dev.crt`.

#### Trusting the certifying organization in Chrome

Now we should trust the certifying organization. Let's add its `pem` file as `Authority` in the browser settings. In the address bar, we type:

```
chrome://settings/certificates
```

We will see:

![](http://localhost:8484/6c552745-d6d7-452f-a6a8-c82b77ee9398.avif)

After clicking import and selecting the file `myCA.pem`, we indicate which operations of this organization we want to trust:

![](http://localhost:8484/e185608f-e06f-465d-98bc-e75a4927ef7e.avif)

#### Trust of the certification authority in Firefox

In Firefox, go to `about:preferences#privacy` and in the "Certificates" tab, click "View Certificates". Then we select import and the file `myCA.pem`.

![](http://localhost:8484/cdd83c80-7b45-4b9d-a265-ceeb578f1ebf.avif)

immediately mark the certifying organization as trusted

![](http://localhost:8484/dd644237-d42b-4a95-8b0b-1d956846ab83.avif)

In contrast to Chrome, these settings are independent of the operating system.

#### Trusting a certificate authority on Mac OS in Chrome

On computers with `Mac OS`, we cannot change settings directly in Chrome. Instead, we open Finder. We find the file `myCA.pem` and double-click it.

![](http://localhost:8484/9991f51f-8d61-4770-81e8-8f154afa0a68.avif)

after confirming with the password, we should see our organization in the "Certificates" tab in the "Keychain" program

![](http://localhost:8484/5b588af5-97db-419c-ab7e-8f481ee6a521.avif)

Now we need to mark this certificate as trusted by selecting the "Always Trust" option.

![](http://localhost:8484/5aba5b59-a2de-432c-b7a7-15812fc0ea64.avif)

#### Nginx Configuration as a Proxy

Once again, we change the `nginx` settings. This time we switch to the generated certificate and its key.

```
    server {
        listen       443 ssl;
        server_name  local.dev;

        ssl_certificate      ssl/local.dev.crt;
        ssl_certificate_key  ssl/local.dev.key;

        location / {
                proxy_pass          http://127.0.0.1:8000;
                proxy_set_header    Host             $host;
                proxy_set_header    X-Real-IP        $remote_addr;
                proxy_set_header    X-Forwarded-For  $proxy_add_x_forwarded_for;
                proxy_set_header    X-Client-Verify  SUCCESS;
                proxy_set_header    X-Client-DN      $ssl_client_s_dn;
                proxy_set_header    X-SSL-Subject    $ssl_client_s_dn;
                proxy_set_header    X-SSL-Issuer     $ssl_client_i_dn;
                proxy_read_timeout 1800;
                proxy_connect_timeout 1800;
        }
    }
```

We cannot forget about server overload:

```
sudo systemctl reload nginx.service
```

On `Mac OS` there is no `systemctl` and we use `brew`

```
sudo brew services restart nginx
sudo pkill nginx
sudo nginx
```

Upon entering the website:

> [https://local.dev/](https://local.dev/)

we can enjoy the sight of a padlock next to the address of the local site:

* on Chrome

![](http://localhost:8484/36f90ff2-6819-4123-a28a-fb0283c960fc.avif)

* and on Firefox

![](http://localhost:8484/5ea4ee9a-1437-4038-90f3-a30f91344a6e.avif)

However, we will not see the correct result in the console:

```
http https://local.dev

http: error: SSLError: HTTPSConnectionPool(host='local.dev', port=443): Max retries exceeded with url: / (Caused by SSLError(SSLCertVerificationError(1, '[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1123)'))) while doing a GET request to URL: https://local.dev/
```

The error tells us that the local certificate issuer could not be verified. For the request from the console to work, we need to specify the organization's verifying certificate as an argument to the `--verify` flag.

```
http --verify /etc/nginx/ssl/myCA.pem https://local.dev
```

or on `Mac OS`

```
http --verify /usr/local/etc/nginx/ssl/myCA.pem https://local.dev
```

![](http://localhost:8484/cc8230e1-7e35-4f2e-a9c9-9cd0c9d7c0b3.avif)

### Applications of Local SSL Certificate

We showed how to configure an https connection on a local machine, which is particularly useful in web application development. Typically, you can develop your projects locally using `http`.

![](http://localhost:8484/a6538c2f-4169-43c1-85bb-ab1883ab4b05.avif)

Sometimes `https` is required by mechanisms such as:

* Secure or SameSite settings for Cookies
* Access settings for camera or microphone in the browser
* Some webhook addresses of external APIs

### Advantages and disadvantages of Caddy

Auth0 recommends using the `caddy` program in its documentation.

[HTTPS in Development](https://auth0.com/docs/libraries/secure-local-development#how-to-set-up-a-secure-local-server)

Its installation is

```
yay -S caddy
```

or

```
brew install caddy
```

Now we will turn off our `nginx` server.

```
sudo pkill nginx
```

started with the `caddy` command

```
caddy reverse-proxy --from localhost:443 --to localhost:8000
```

And we have the following effect:

1. The padlock works on the page `https://localhost` in Chrome.

![](http://localhost:8484/975e97f2-7903-46e8-b69b-0fa9209c7699.avif)

2\. `https://localhost` does not work on Firefox

![](http://localhost:8484/e0abd4de-a853-465b-bda9-30ccae9ef5d4.avif)

3. It doesn't work from the command line (httpie) either

![](http://localhost:8484/da304157-3ba2-45fa-8d0e-61352c24a8c5.avif)

4. On the other hand, curl works `curl [https://localhost](https://localhost)`.

So "caddy" is a way to quickly configure local ssl but with limitations. Their documentation looks promising, but one can expect that encountering errors will leave us with much lower chances for community support than in the case of self-configuration according to the steps outlined in this entry. If we start with Caddy without understanding how to configure ssl on our own, the chance that encountered errors will hold us back for a long time will significantly increase.

[Getting Started - Caddy Documentation](https://caddyserver.com/docs/getting-started)

#### Valuable links deepening the SSL topic

In preparing this entry, I used many external sources. The most valuable ones I found are linked below.

[How to use a CA (like curl’s --cacert) with HTTPie](https://stackoverflow.com/questions/44443269/how-to-use-a-ca-like-curls-cacert-with-httpie/67326625#67326625)

[Setup (https) SSL on localhost for meteor development](https://stackoverflow.com/a/35867609/6398044)

[error 18 at 0 depth lookup: self signed certificate](http://markstutpnt.blogspot.com/2019/01/error-18-at-0-depth-lookup-self-signed.html)
