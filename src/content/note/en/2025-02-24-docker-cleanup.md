---
title: Docker cleanup
publishDate: 2025-02-24
---

After installing docker on server you can add cleanup script to `crontab`.

```bash
echo -e '#!/bin/sh\ndocker system prune -af' | sudo tee /etc/cron.weekly/docker-prune > /dev/null && sudo chmod +x /etc/cron.weekly/docker-prune
```

it will remove all unused images and containers every week.

To test call

```bash
run-parts /etc/cron.weekly
```