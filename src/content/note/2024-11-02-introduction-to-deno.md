---
title: Introduction to Deno
publishDate: 2024-11-02
---

[Installation](https://docs.deno.com/runtime/getting_started/installation/)

```
yay -S p7zip
sudo mkdir '/usr/local/etc/bash_completion.d'
chown -R daniel /usr/local/etc/bash_completion.d

curl -fsSL https://deno.land/install.sh | sh
bash
```

Start project

```
deno init .
```

Now you can run or test your project

```
deno test
deno main.ts
```

Crucial element of `deno` is permissions system.

For example in `node` you would write

```js
import * as os from "os";
console.log(os.cpus());
```

In deno you need to add permissions

```js
import * as os from "node:os";
console.log(os.cpus());
```

and run with

```
deno run --allow-sys main.ts
```

During development, you can add `--allow-all` or `-A` to allow all permissions. 
When you deploy, best practice is to allow only necessary permissions.


Let's build `netcat` clone in `deno`.

Netcat doing 2 things:
- read from stdin and write to socket
- read from socket and write to stdout

So we can prepare 2 functions in `net_utils.ts`

```ts
// Common function for reading from stdin and writing to a connection
export async function writeToConn(conn: Deno.Conn) {
    const stdin = Deno.stdin.readable.getReader();
    try {
        while (true) {
            const line = await stdin.read();
            if (line.done) break;
            await conn.write(line.value); // Send input to the connection
        }
    } finally {
        conn.close();
    }
}
```

and

```ts
// Common function for reading from a connection and outputting to stdout
export async function readFromConn(conn: Deno.Conn) {
    const buf = new Uint8Array(1024);
    while (true) {
        const bytesRead = await conn.read(buf);
        if (bytesRead === null) break; // Connection closed
        await Deno.stdout.write(buf.subarray(0, bytesRead)); // Output directly to console
    }
}
```

Our simplified Netcat will accept 2 arguments: `host | -l` and `port`. We will save them to `args` variable.

```ts
// nc.ts
import { readFromConn, writeToConn } from "./net_utils.ts";

const args = Deno.args;

if (args.length < 2) {
    console.error("Usage:");
    console.error("  Server: deno run --allow-net nc.ts -l <port>");
    console.error("  Client: deno run --allow-net nc.ts <hostname> <port>");
    Deno.exit(1);
}
```

In both cases handling connection means that we're applying both previous functions on it.

```ts
// Shared connection handler
async function handleConnection(conn: Deno.Conn) {
    await Promise.all([readFromConn(conn), writeToConn(conn)]);
}
```

In case of server we need to listen on port and accept connections.

```ts
if (args[0] === "-l") {
    // Server mode
    const port = Number(args[1]);
    const listener = Deno.listen({ port });
    console.log(`Listening on port ${port}...`);

    for await (const conn of listener) {
        handleConnection(conn).catch(console.error);
    }
}
```

In case of client we need to connect to the server.

```ts
if (args[0] === "-l") {
/// ...
} else {
    // Client mode
    const [hostname, port] = [args[0], Number(args[1])];
    const conn = await Deno.connect({ hostname, port });
    console.log(`Connected to ${hostname}:${port}`);
    await handleConnection(conn);
}
```

Now you can run server

```
deno run --allow-net nc.ts -l 8080
```

and client

```
deno run --allow-net nc.ts localhost 8080
```

and exchange messages between them like in classic `netcat`.