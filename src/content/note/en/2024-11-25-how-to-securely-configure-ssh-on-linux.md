---
title: How to Securely Configure SSH on Linux
publishDate: 2024-11-25
---

# How to Securely Configure SSH on Linux

SSH is a powerful tool for remote server management, but improper configuration can leave your server vulnerable to attacks. In this guide, we'll show you how to securely configure SSH to allow only key-based authentication.

---

## 1. Install and Enable SSH

First, ensure the OpenSSH server is installed and running.

### Install OpenSSH

```bash
yay -S openssh
```

## 2. Enable and Start the SSH Service

```bash
sudo systemctl enable sshd
sudo systemctl start sshd
```

Unfortunately now you are exposed for attack from the internet if your password is weak or will leak.

In next step we will disable password authentication and enable only public key authentication.

## 3. Edit the SSH Configuration File

Modify the SSH configuration file to enhance security.
Open the Configuration File

```bash
sudo nano /etc/ssh/sshd_config
```

Update the Following Settings

a) Disable Password Authentication:

```txt
PasswordAuthentication no
```

b) Enable Public Key Authentication (this is usually enabled by default):

```txt
PubkeyAuthentication yes
```

c) Disable Other Authentication Methods (optional, for stricter security):

```txt
KbdInteractiveAuthentication no
UsePAM no
```

Save and close the file.

## 4. Restart the SSH Service

Restart the SSH service to apply the changes:

```bash
sudo systemctl restart sshd
```

You can test it and expect result should look like this:

```
$ ssh daniel@69.69.69.69
daniel@69.69.69.69: Permission denied (publickey).
```

Now manually copy you public key to the server typing on your local machine:

```bash
cat ~/.ssh/id_ed25519.pub | xclip -sel copy
```

Then open the server terminal and paste the key to the `~/.ssh/authorized_keys`.

Now you can't log in to the server even knowing password.