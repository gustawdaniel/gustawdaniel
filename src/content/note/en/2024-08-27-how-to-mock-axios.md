---
title: How to mock Axios in Jest
publishDate: 2024-08-27
---

There are [many ways](https://vhudyma-blog.eu/3-ways-to-mock-axios-in-jest/) to mock Axios. The best
is `axios-mock-adapter`. It allows you to intercept requests and respond with mocked data.

Let's assume we have function that send request.

```ts
import axios from "axios";

export async function getMyHexIp() {
    return axios.get("https://ipinfo.io/ip").then((response) => '0x' + response.data.split('.').map((x: string) => parseInt(x).toString(16)).join(''));
}
```

We can test it with `axios-mock-adapter` like this:

```ts
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {describe, beforeAll, afterEach,it, expect} from "@jest/globals";
import {getMyHexIp} from "./getMyHexIp";

describe("External axios call", () => {
    let mock: MockAdapter;

    beforeAll(() => {
        mock = new MockAdapter(axios);

        mock.onGet(`https://ipinfo.io/ip`).reply(200, '69.69.69.69');
    });

    afterEach(() => {
        mock.reset();
    });

    it("getMyHexIp", async () => {
        // when
        const result = await getMyHexIp()

        // then
        expect(mock.history.get[0].url).toEqual(`https://ipinfo.io/ip`);
        expect(result).toEqual('0x45454545');
    });
});
```

### Additional notes about jest setup:

1. Install `devDependencies`

```bash
pnpm add axios
pnpm add -D @jest/globals jest jest-esbuild ts-node axios-mock-adapter
```

2. Add `jest.config.js`

```ts
import type {Config} from 'jest';
const config: Config = {
  coverageProvider: "v8",
  transform: {
    '^.+\\.(ts|tsx)$': 'jest-esbuild',
  },
};
export default config;
```

3. Add tsconfig by

```bash
npx tsc --init
```

## Off-topic but about jest

### Other recommended mock library `ioredis-mock`. 

Usage:

```ts
import RedisMock from "ioredis-mock";

const createRedisMockClient = () => {
    return new RedisMock();
};
```

### How i testing version endpoint in Fastify

```ts
import pJson from '../package.json'
import { getFastifyServer } from '../src/fastify'

const correctVersion = { name: pJson.name, version: pJson.version }

describe('i can read version', () => {
    it('from rest api', async () => {
        const server = getFastifyServer()
        const result = await server.inject({
            method: 'GET',
            path: '/',
        })

        expect(result.body).toEqual(JSON.stringify(correctVersion))
        expect(result.statusCode).toEqual(200)
        expect(result.headers['content-type']).toContain('application/json')
    })
})
```