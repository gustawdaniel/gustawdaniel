---
title: How to backup and restore Mongo DB
publishDate: 2024-11-11
---

Let's say you have a database called `scraped_data` and you want to back up and restore it to a new database called `matrix_aggregator`.

## Install MongoDB tools

```bash
yay -S mongodb-tools
```

## Backup

```bash
mongodump --uri="mongodb://localhost:27017/scraped_data" --out=/tmp/dump
```

## Restore

```bash
mongorestore --uri="mongodb://localhost:27017" /tmp/dump/scraped_data --nsInclude="scraped_data.*" --nsFrom="scraped_data.*" --nsTo="matrix_aggregator.*" --db=matrix_aggregator
```

