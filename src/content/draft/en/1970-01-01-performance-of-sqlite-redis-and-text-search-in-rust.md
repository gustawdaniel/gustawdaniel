---
title: Performance of SQLite, Redis and Text search in Rust
slug: performance-of-sqlite-redis-and-text-search-in-rust
publishDate: 1970-01-01T00:00:00.000Z
date_updated: 2022-12-15T17:06:59.000Z
draft: true
---

We have sorted dictionary with English words. Our goal is write program that check if words is present in dictionary. Open question remains which tools should be selected. We will consider comparison of:

* searching in text file - word by word O(n)
* searching in text file - words using newton method O(ln(n))
* searching in sqlite - unindexed O(n)
* searching in sqlite - indexed O(ln(n))
* redis

We have got dictionary from repository `wwfred`

[GitHub - gonsie/wwfred: Words With Friends RegExp Dictionary](https://github.com/gonsie/wwfred)

Stats of file:

```
wc collins-scrabble-2019.txt
279496  279496 3103753 collins-scrabble-2019.txt
```

```
du -h collins-scrabble-2019.txt
3,0M    collins-scrabble-2019.txt
```

## Access to parameter and ENV variable in Rust

Interface of our file will be following

```
METHOD=sqlite cargo run -- hello
```

we will choose method of searching using env variable and word to search as first parameter.

to have access to method and word we can write simple program

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    let method = env::var("METHOD").unwrap_or("file".to_string());
    println!("{:?}", args);
    println!("{:?}", method);
}
```

that will print

```
["target/debug/rust-sqlite-file-redis", "hello"]
"sqlite"
```

## Reading file line by line

First naive approach assume that we will read all file line by line and check if we found searched word.

We will use `match` to check if `method` is `text`.

Currently there is only function `find_using_text` so our `main` can looks like this

```rust
fn main() {
    let args: Vec<String> = env::args().collect();
    let method = env::var("METHOD").unwrap_or("file".to_string());

    let res:bool = match args[1].as_str()  {
        "text" => find_using_text(args[1].as_str()),
        _ => find_using_text(args[1].as_str())
    };

    println!("{:?}", args);
    println!("{:?}", method);
    println!("{:?}", res);
}
```

we can write tests to develop this function using TDD

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn find_using_text_exists() {
        assert_eq!(find_using_text("hello"), true);
    }

    #[test]
    fn find_using_text_non_exists() {
        assert_eq!(find_using_text("olleh"), false);
    }
}
```

finally lets implement `find_using_text`.

Lets start from `use` declaration

```rust
use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;
```

we can write helping function `read_lines`

```rust
// The output is wrapped in a Result to allow matching on errors
// Returns an Iterator to the Reader of the lines of the file.
fn read_lines<P>(filename: P) -> io::Result<io::Lines<io::BufReader<File>>>
    where P: AsRef<Path>, {
    let file = File::open(filename)?;
    Ok(io::BufReader::new(file).lines())
}
```

and our function that search text in file

```
fn find_using_text(word: &str) -> bool {
    let word = word.to_uppercase();
    if let Ok(lines) = read_lines("./collins-head.txt") {
        // Consumes the iterator, returns an (Optional) String
        for line in lines {
            if let Ok(line) = line {
                if line == word {
                    return true
                }
            }
        }
    }

    false
}
```

file `collins-head.txt` was created by command

```
(head collins-scrabble-2019.txt; echo "HELLO") > collins-head.txt
```

## Newton method of searching

![](http://localhost:8484/0daeec16-6073-46b3-98d3-16edfc24111f.avif)
