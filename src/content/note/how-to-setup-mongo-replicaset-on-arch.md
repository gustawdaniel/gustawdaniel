---
title: How to setup mongo replicaset on Arch Linux?
publishDate: 2024-08-13
---
Install bin version, mongo from source will compile even few hours

```bash
yay -S mongodb-bin
```

start / enable `mongodb.service`

```bash
sudo systemctl enable mongodb.service
sudo systemctl start mongodb.service
```
optionally check status
```bash
sudo systemctl status mongodb.service
```
connect to mongo
```bash
mongosh
```

By default replicaset is disabled. You can confirm it in `mongosh`
```bash
rs.status()
MongoServerError[NoReplicationEnabled]: not running with --replSet
```
Now time to change settings:
```bash
sudo nvim /etc/mongodb.conf
```

replace
```toml
#replcation:
```
by
```toml
replication:
  replSetName: "rs0"
  
```

restart mongo service

```bash
sudo systemctl restart mongodb.service
```

now you can see different error

```mongo
rs.status()
MongoServerError[NotYetInitialized]: no replset config has been received
```

so lets init replicaset

```mongo
rs.initiate()
{
  info2: 'no configuration specified. Using a default configuration for the set',
  me: '127.0.0.1:27017',
  ok: 1
}
```
      
Finally rs.status() works correctly.