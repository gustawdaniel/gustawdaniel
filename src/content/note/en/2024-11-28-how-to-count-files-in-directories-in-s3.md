---
title: How to count files in directories in S3
publishDate: 2024-11-28
---

Problem:

We can count files in directories in S3 using the AWS CLI. The command is:

```bash
s3cmd ls --recursive s3://preciselab/sowa/voice/gtt | wc -l
```

We list all files recursively and then counting lines (-l flag) with file names.

But we would like to get distribution of files in directories. 

Solution:

We can use the following command:

```bash
s3cmd ls --recursive s3://preciselab/sowa/voice/gtts | awk '{print $4}' | grep -oP 'gtts/\K[^/]+' | sort | uniq -c | sort -nr

    190 pl
    111 it
    109 en
    108 de
    104 es
    103 fr
    100 ar
     98 ru
     97 nl
     97 ja
     96 zh
     24 nb
```

Keys to understand what is happening:

1. s3cmd ls --recursive: Lists all files in the S3 bucket recursively.
2. awk '{print $4}': Extracts the 4th column, which contains the S3 object paths.
3. grep -oP 'gtts/\K[^/]+': Extracts directory in gtts/ using a Perl-compatible regex (\K discards everything before it).
4. sort: Sorts the language codes alphabetically.
5. uniq -c: Counts occurrences of each language code.
5. sort -nr: Sorts the counted output in descending numerical order for easy reading.

It is worth to know regex, awk, grep, sort and uniq commands to faster analyze data.