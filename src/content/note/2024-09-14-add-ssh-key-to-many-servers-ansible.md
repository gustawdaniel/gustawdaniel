---
title: Script to add SSH key to many servers using Ansible
publishDate: 2024-09-14
---

Suppose you have a list of servers you can access using a private key `~/.ssh/old_key`, and now you need to append
your new SSH public key `~/.ssh/id_ed25519.pub` to each server's `~/.ssh/authorized_keys` file. 

Rather than manually adding the key to each server, we can automate the process using Ansible. 
This article walks you through creating a single script to ensure secure key-based access across multiple machines with minimal effort.

### Prerequisites

Create `inventory.ini` file with the list of servers you want to update:

```ini
[remote_hosts] 
96.96.69.96
69.69.69.96
96.69.69.69
96.69.96.96
```

Build you playbook `add_pub_key.yml`:

```yaml
---
- hosts: remote_hosts
  gather_facts: no
  become: yes  # if you need to run this as root
  remote_user: root
  tasks:
    - name: Ensure .ssh directory exists
      file:
        path: ~/.ssh
        state: directory
        mode: '0700'

    - name: Add public key to authorized_keys
      ansible.builtin.authorized_key:
        user: "{{ ansible_user | default('root') }}"
        state: present
        key: "{{ lookup('file', '~/.ssh/id_ed25519.pub') }}"
        path: ~/.ssh/authorized_keys
```

Call playbook

```bash
ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i inventory.ini add_pub_key.yml --private-key=~/.ssh/old_key
```

![](http://localhost:8484/50191eec-f1d9-45be-9fce-e1f07a774963.avif)
