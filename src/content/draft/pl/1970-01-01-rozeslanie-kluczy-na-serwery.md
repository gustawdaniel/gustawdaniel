---
title: Rozesłanie kluczy na serwery
slug: rozeslanie-kluczy-na-serwery
publishDate: 1970-01-01T00:00:00.000Z
date_updated: 2021-04-29T12:06:59.000Z
draft: true
---

Aby wygenerować parę kluczy `ssh` w określonej lokalizacji, używamy flagi `-f`. Na przykład:

```
ssh-keygen -t ed25519 -C "<comment>" -f ~/.ssh/new_key
```

Załóżmy, że w pliku `/tmp/ips` mamy numery `ip` serwerów. Zakładam, że już mamy wymieniony z nimi nasz podstawowy klucz.

```
167.xxx.xxx.221
157.yyy.yyy.194
134.zzz.zzz.149
```

Chcemy logować się na te serwery nowym kluczem `~/.ssh/new_key`.

Aby rozesłać odpowiadający mu klucz publiczny do pliku `~/.ssh/authorized_keys` na tych serwerach wykonujemy polecenie

```
xargs -a /tmp/ips -n 1 -I {} ssh-copy-id -i ~/.ssh/new_key root@{}
```

Możemy zweryfikować czy się powiodło sprawdzając, czy polecenie:

```
ssh root@134.zzz.zzz.149 'tail -n 1 ~/.ssh/authorized_keys'
```

pokaże tą samą zawartość co lokalny plik z kluczem publicznym:

```
cat ~/.ssh/new_key.pub
```

Świetny artykuł o kluczach znajdziemy tutaj:

[GitLab and SSH keys | GitLab](https://docs.gitlab.com/ee/ssh/)
