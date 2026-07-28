---
title: How to connect to Cloud InfluxDB by CLI
publishDate: 2024-11-24
---

InfluxDB is a time series database. It is used to store data that is time-stamped. It is used to store metrics, events, and analytics data.

We assume that you do not want to install full InfluxDB on your machine, but you want to connect to the cloud InfluxDB.

Install only CLI:

```bash
yay -S influx-cli
```

Now you need your
- organization name
- token

You can check your organization name in https://eu-central-1-1.aws.cloud2.influxdata.com/orgs/08384ac0bf08691e/org-settings

You can create token in: https://eu-central-1-1.aws.cloud2.influxdata.com/orgs/08384ac0bf08691e/load-data/tokens

Before connection you need to set up the configuration:

```bash
influx config update --config-name main --org main --token xxx
```

Now you can list buckets:

```bash
$ influx bucket list
ID                      Name            Retention       Shard group duration    Organization ID         Schema Type
d02fe76c568c8a93        _monitoring     168h0m0s        n/a                     08384ac0bf08691e        implicit
b4b2853600124862        _tasks          72h0m0s         n/a                     08384ac0bf08691e        implicit
4ff630f116119015        tts             720h0m0s        n/a                     08384ac0bf08691e        implicit
```

Now you can query the data:

For example there is a query that groups number of actions in intervals allowing me effectiveness of caching system for TTS app.

```
influx query 'from(bucket:"tts") 
    |> range(start: -2d)  
    |> filter(fn: (r) => r["_measurement"] == "action" and r["_field"] == "time_taken_ms") 
    |> group(columns: ["type"]) 
    |> aggregateWindow(every: 3h, fn: count, createEmpty: true) 
    |> fill(column: "_value", value: 0) 
    |> yield(name: "count")'
```

Connect to InfluxDB queries with grafana you can build dashboards like this:

![](https://ucarecdn.com/3ee6091f-fd09-4809-8777-50fceaf02ec3/-/preview/1000x598/)

But both official InfluxDB and Grafana consoles are not such friendly as the CLI when you're debugging queries.