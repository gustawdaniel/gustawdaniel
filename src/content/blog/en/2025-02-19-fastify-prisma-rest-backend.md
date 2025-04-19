---
author: Daniel Gustaw
canonicalName: fastify-prisma-rest-backend
coverImage: https://ucarecdn.com/6b6fe485-db42-4bf6-bf3a-36c09c1a9972/-/preview/640x640/
description: Typescript template for Fastify REST API with Prisma and JWT authentication.
excerpt: Typescript template for Fastify REST API with Prisma and JWT authentication.
publishDate: 2025-02-19 00:00:00+00:00
slug: en/fastify-prisma-rest-backend
tags:
  - typescript
  - fastify
  - prisma
  - jwt
title: Fastify Prisma REST backend
updateDate: 2025-02-19 00:00:00+00:00
---

## Fastify Prisma REST backend

```
pnpm init
pnpm --package=typescript dlx tsc --init
pnpm add -D typescript @types/node
```

optionally add

```json
{
  "pnpm": {
    "neverBuiltDependencies": []
  }
}
```

to `package.json` to avoid `pnpm` asking for approval for every build.

```bash

## Env validation

We do not want to start project if there are missing env variables.

```bash
mkdir -p src && touch src/config.ts
pnpm add zod
```

add file `src/config.ts`

```typescript
import { z } from 'zod';

export const serverVariables = z.object({
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),

    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),

    PORT: z.coerce.number().int().default(4747),
});

export const config = serverVariables.parse(process.env);
```

## Prisma connection

```bash
pnpm add prisma @prisma/client
npx prisma init
pnpm approve-builds
```

then agree for builds.

Sync prisma schema if exists

```bash
pnpm dlx prisma db pull
touch src/db.ts
```

## Add Fastify

Uncomment `"resolveJsonModule": true,` line in `tsconfig.json`.

Install packages

```bash
pnpm add fastify @fastify/cors @fastify/sensible jsonwebtoken
pnpm add -D @types/jsonwebtoken tsx
```

Add file `src/fastify.ts`

```typescript
import fastify, {
    FastifyInstance, FastifyPluginOptions,
    FastifyReply,
    FastifyRequest, RouteShorthandOptions,
} from 'fastify';
import {config} from "./config";
import cors from '@fastify/cors';
import fastifySensible from '@fastify/sensible';
import {FastifyRouteConfig} from "fastify/types/route";
import jwt from 'jsonwebtoken';
import pJson from '../package.json';

interface TokenPayload {
    id: number,
    iat: number,
    exp: number
}

interface UserProjection {
    id: number
}

declare module 'fastify' {
    interface FastifyRequest {
        user: UserProjection | null;
    }
}

export function verifyToken(token: string):  UserProjection {
    const payload = jwt.verify(token, config.JWT_SECRET) as TokenPayload;

    return {
        id: payload.id,
    }
}

function isProtected(config: FastifyRouteConfig): boolean {
    return (
        Boolean('isProtected' in config && config.isProtected)
    );
}

function getErrorMessage(error: unknown): string {
    if(error instanceof Error) {
        return error.message;
    }
    return 'Unknown error';
}

function version(_req: FastifyRequest, res: FastifyReply): void {
    res.code(200).send({
        name: pJson.name,
        version: pJson.version,
    });
};


const PROTECTED: RouteShorthandOptions = { config: { isProtected: true } };
const PUBLIC: RouteShorthandOptions = { config: { isProtected: false } };

function router(
    server: FastifyInstance,
    _options: FastifyPluginOptions,
    next: () => void,
) {
    server.get('/', PUBLIC, version);

    next();
}

export function getFastifyInstance(): FastifyInstance {
    const app = fastify({
        logger: config.NODE_ENV === 'development',
        bodyLimit: 100 * 1048576,
    });

    app.register(cors, {});
    app.register(fastifySensible);

    app.addHook(
        'onRequest',
        async (
            request: FastifyRequest<{ Headers: { authorization?: string } }>,
            reply: FastifyReply,
        ) => {
            // If the route is not private we ignore this hook
            if (isProtected(request.routeOptions.config)) {
                const authHeader = request.headers.authorization;
                if (typeof authHeader !== 'string') {
                    reply.unauthorized('No Authorization header');
                    return;
                }
                const token: string = String(authHeader)
                    .replace(/^Bearer\s+/, '')
                    .trim();
                if (!token) {
                    reply.unauthorized('Token is empty');
                    return;
                }

                try {
                    request.user = verifyToken(token);
                } catch (error) {
                    return reply.unauthorized(getErrorMessage(error));
                }
            }
        },
    );

    app.register(router);

    return app;
}
```

This is minimalistic setup with users validation. We can import it in `src/index.ts`

```typescript
import {getFastifyInstance} from './fastify';
import { config } from './config';

const app = getFastifyInstance();

app.listen(
    { port: config.PORT, host: '0.0.0.0' },
    (err: Error | null, host: string) => {
        if (err) {
            throw err;
        }
        console.info(`server listening on ${host}`);
    },
);
```

add script `dev` to `package.json`

```json
{
  "scripts": {
    "dev": "infisical run --env=dev --path=/apps/fastify -- tsx watch ./src/index.ts",
  }
}
```

Test by

```bash
pnpm dev
```

and

```bash
http localhost:4747
```

## Building

```
pnpm add -D tsup
```

add scripts
    
```json
{
    "scripts": {
        "build": "tsup src/index.ts",
        "serve:prod": "infisical run --domain https://infisical.preciselab.io --projectId acb5ccfb-c211-4461-a06d-8caa248beea1 --env=prod --path=/apps/fastify -- node dist/index.js"
    }
}
```

## E2E test

```bash
pnpm add -D vitest
```

add file `test/version.e2e.spec.ts`

```typescript
import {it, expect} from "vitest";

import {getFastifyInstance} from "../src/fastify";

it('should return version', async () => {
    const app = getFastifyInstance();

    const response = await app.inject({
        method: 'GET',
        url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
        name: 'fastify',
        version: '1.0.0',
    });
})
```

and script

```json
{
    "scripts": {
        "test": "infisical run --env=dev --path=/apps/fastify -- vitest run",
    }
}
```

call

```bash
pnpm test
```

## Test protected route

create route

```bash
mkdir -p src/controller/auth
touch src/controller/auth/me.ts
```

add file `src/controller/auth/me.ts`

```typescript
import {FastifyRequest} from "fastify";
import {UserProjection} from "../../types/auth";

export function me(req: FastifyRequest): UserProjection | null {
    return req.user;
}
```

where `src/types/auth.ts` contains types excluded from fastify.ts

```typescript
export interface TokenPayload {
    id: number,
    iat: number,
    exp: number
}

export interface UserProjection {
    id: number
}
```

We can also exclude `router.ts` from `fastify.ts` to separate file

```typescript
import {FastifyInstance, FastifyPluginOptions, RouteShorthandOptions} from "fastify";
import {version} from "./controllers/app/version";
import {me} from "./controllers/auth/me";

const PROTECTED: RouteShorthandOptions = { config: { isProtected: true } };
const PUBLIC: RouteShorthandOptions = { config: { isProtected: false } };

export function router(
    server: FastifyInstance,
    _options: FastifyPluginOptions,
    next: () => void,
) {
    server.get('/', PUBLIC, version);
    server.get('/me', PROTECTED, me);

    next();
}
```

and move `version` to `controllers/app/version.ts`

```typescript
import {FastifyReply, FastifyRequest} from "fastify";
import pJson from "../../../package.json";

export function version(_req: FastifyRequest, res: FastifyReply): void {
    res.code(200).send({
        name: pJson.name,
        version: pJson.version,
    });
}
```

Now we can test it in file `test/auth.e2e.spec.ts`

```typescript
import {it, expect} from "vitest";

import {getFastifyInstance} from "../src/fastify";
import jwt from "jsonwebtoken";
import {config} from "../src/config";

it('should return me', async () => {
    const app = getFastifyInstance();
    const token = jwt.sign({
        "id": 6,
        "iat": 1739986214,
        "exp": (Date.now() / 1000) + 3600 // 1 hour from now
    }, config.JWT_SECRET);

    const response = await app.inject({
        method: 'GET',
        url: '/me',
        headers: {
            authorization: `Bearer ${token}`
        }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
        id: 6,
    });
})
```

## Deployment

Dockerfile

```dockerfile
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@9.15.4 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

FROM base AS build

COPY . .

RUN pnpm dlx prisma generate
RUN pnpm build

RUN apk add --no-cache bash curl && curl -1sLf \
'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.alpine.sh' | bash \
&& apk add infisical

CMD pnpm serve:prod
```

Docker compose: `docker-compose.yml`

```
services:
  app:
    image: registry.digitalocean.com/main/up-fastify
    ports:
      - '4747:4747'
    environment:
      - INFISICAL_TOKEN
```

Hosts file

```hosts
[local]
127.0.0.1 env=prod ansible_python_interpreter=/usr/bin/python3

[api]
142.132.182.19 ansible_user=root env=prod ansible_python_interpreter=/usr/bin/python3
```

Ansible playbook `deploy.yml`

```yaml
---
- name: Build Backend
  hosts: local
  connection: local
  vars:
    image_url: registry.digitalocean.com/main/api-domain-com
  tasks:
    - name: Build Image
      ansible.builtin.shell: >
        DOCKER_BUILDKIT=1 docker build -t {{image_url}} .
    - name: Push Image
      ansible.builtin.shell: >
        docker push {{image_url}}
- name: Deploy Backend
  hosts: api
  vars:
    path: /root/api.domain.com
  tasks:
    - name: Creates Api directory
      file:
        path: '{{ path }}'
        state: directory
    - name: Copy Docker Compose
      copy:
        src: ./docker-compose.yml
        dest: '{{ path }}/docker-compose.yml'
    - name: Pull Image
      shell:
        cmd: docker compose pull
        chdir: '{{ path }}'
    - name: Restart Image
      shell:
        cmd: docker compose up -d --remove-orphans
        chdir: '{{ path }}'
```

Go to infisical access control, select service token and create new with `read` permissions selecting scope `/**` and expiration time `never`.

Finally add deploy command to `Makefile`

```makefile
deploy:
	ansible-playbook -i "hosts.${ENV}" deploy.yml
```

Then having `hosts.prod` and `hosts.stag` you can deploy by running `ENV=prod make deploy` or `ENV=stag make deploy`.

To tie deployment with domain on server add to `/etc/caddy/Caddyfile` lines

```caddyfile
api.domain.com {
 reverse_proxy localhost:4747
}
```

and reload by

```bash
systemctl reload caddy
```


