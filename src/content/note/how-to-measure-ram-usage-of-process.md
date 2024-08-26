---
title: How to measure RAM usage of process?
publishDate: 2024-08-09
---
Install time

```bash
yay -S time
```

use it with -v (verbose option). For example

```bash
/usr/bin/time -v pnpm build
```

result can be following

```out
 Command being timed: "pnpm build"
 User time (seconds): 23.70
 System time (seconds): 1.27
 Percent of CPU this job got: 163%
 Elapsed (wall clock) time (h:mm:ss or m:ss): 0:15.25
 Average shared text size (kbytes): 0
 Average unshared data size (kbytes): 0
 Average stack size (kbytes): 0
 Average total size (kbytes): 0
 Maximum resident set size (kbytes): 2959112
 Average resident set size (kbytes): 0
 Major (requiring I/O) page faults: 0
 Minor (reclaiming a frame) page faults: 704182
 Voluntary context switches: 17418
 Involuntary context switches: 531
 Swaps: 0
 File system inputs: 0
 File system outputs: 1104
 Socket messages sent: 0
 Socket messages received: 0
 Signals delivered: 0
 Page size (bytes): 4096
 Exit status: 0
```

Find `Maximum resident set size`. In our case

```bash
 Maximum resident set size (kbytes): 2959112
```

what can be read as 2.959 gigabytes