---
author: Daniel Gustaw
canonicalName: svelte-snake-deployed-on-deno
coverImage: http://localhost:8484/7ce53036-1711-40b9-90bf-0369f97b2f84.avif
description: Svelte Snake is a simple game written in Svelte. It's deployed on Deno, a secure runtime for JavaScript and TypeScript.
excerpt: Svelte Snake is a simple game written in Svelte. It's deployed on Deno, a secure runtime for JavaScript and TypeScript.
publishDate: 2024-11-15 00:00:00+00:00
slug: en/svelte-snake-deployed-on-deno
tags:
- svelte
- snake
- deno
title: Svelte snake deployed on deno
updateDate: 2024-11-15 00:00:00+00:00
---

## About project

This tutorial shows how to write Snake Game in
Svelte. It requires basic knowledge of objects
and methods of arrays. In first part we are going to
be able to display map, snake and allow snake to move
in chosen direction. This code will be not playable
version of game, but I decided to depart this project
to fragments because of highest educational value of
presenting process of building code, not only final
result.

### Create svelte app

Let's start with creating svelte app.

```bash
npx sv create svelte-snake
cd svelte-snake
```

We can start it with

```bash
pnpm i && pnpm dev
```

Now we can start writing game.

in `src/routes/+page.svelte` set code

```html
<script>
    let snake = [{ x: 5, y: 5 }];
    let direction = { x: 1, y: 0 };

    const move = () => {
        snake = [{ x: snake[0].x + direction.x, y: snake[0].y + direction.y }, ...snake.slice(0, -1)];
    };

    setInterval(move, 200);
</script>

<div>
    {#each snake as segment}
        <div class="snake-segment" style="top: {segment.y * 20}px; left: {segment.x * 20}px;"></div>
    {/each}
</div>

<style>
    .snake-segment {
        position: absolute;
        width: 20px;
        height: 20px;
        background: green;
    }
</style>
```

we can see that snake is moving to the right.

### Map rendering

Now we can render map. We will create 20x20 map.

```html
<script>
    let snake = [{ x: 5, y: 5 }];
    let direction = { x: 1, y: 0 };

    const move = () => {
        snake = [{ x: snake[0].x + direction.x, y: snake[0].y + direction.y }, ...snake.slice(0, -1)];
    };

    setInterval(move, 200);

    let map = Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => 0));
</script>

<div>
    {#each snake as segment}
        <div class="snake-segment" style="top: {segment.y * 20}px; left: {segment.x * 20}px;"></div>
    {/each}

    {#each map as row, y}
        {#each row as cell, x}
            <div class="map-cell" style="top: {y * 20}px; left: {x * 20}px;"></div>
        {/each}
    {/each}
</div>

<style>
    .snake-segment {
        position: absolute;
        width: 20px;
        height: 20px;
        background: green;
    }

    .map-cell {
        position: absolute;
        width: 20px;
        height: 20px;
        background: white;
        border: 1px solid black;
    }
</style>
```

### Snake movement

Now we can move snake in chosen direction. We're using `onMount` to avoid asking about `window` object on server side.

```html
<script>
    import { onMount } from 'svelte';

    let snake = [{ x: 5, y: 5 }];
    let direction = { x: 1, y: 0 };

    const move = () => {
        snake = [{ x: snake[0].x + direction.x, y: snake[0].y + direction.y }, ...snake.slice(0, -1)];
    };

    setInterval(move, 200);

    let map = Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => 0));

    onMount(() => {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowUp') {
                direction = {x: 0, y: -1};
            } else if (event.key === 'ArrowDown') {
                direction = {x: 0, y: 1};
            } else if (event.key === 'ArrowLeft') {
                direction = {x: -1, y: 0};
            } else if (event.key === 'ArrowRight') {
                direction = {x: 1, y: 0};
            }
        });
    });
</script>

<div>
    {#each map as row, y}
        {#each row as cell, x}
            <div class="map-cell" style="top: {y * 20}px; left: {x * 20}px;"></div>
        {/each}
    {/each}
    
    {#each snake as segment}
        <div class="snake-segment" style="top: {segment.y * 20}px; left: {segment.x * 20}px;"></div>
    {/each}
</div>

<style>
    .snake-segment {
        position: absolute;
        width: 20px;
        height: 20px;
        background: green;
    }

    .map-cell {
        position: absolute;
        width: 20px;
        height: 20px;
        background: white;
        border: 1px solid black;
    }
</style>
```

### Snake eating

Now we can make snake eat food. We will add food object and check if snake head is on food position.

Then we will generate new food position and add new segment to snake without removing last segment.

```html
<script>
    import { onMount } from 'svelte';

    let snake = [{ x: 5, y: 5 }];
    let direction = { x: 1, y: 0 };
    let food = { x: 10, y: 10 };

    const move = () => {
        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

        if (head.x === food.x && head.y === food.y) {
            food = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
            snake = [head, ...snake];
        } else {
            snake = [head, ...snake.slice(0, -1)];
        }
    };

    setInterval(move, 200);

    let map = Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => 0));

    onMount(() => {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowUp') {
                direction = {x: 0, y: -1};
            } else if (event.key === 'ArrowDown') {
                direction = {x: 0, y: 1};
            } else if (event.key === 'ArrowLeft') {
                direction = {x: -1, y: 0};
            } else if (event.key === 'ArrowRight') {
                direction = {x: 1, y: 0};
            }
        });
    });
</script>

<div>
    {#each map as row, y}
        {#each row as cell, x}
            <div class="map-cell" style="top: {y * 20}px; left: {x * 20}px;"></div>
        {/each}
    {/each}
    
    {#each snake as segment}
        <div class="snake-segment" style="top: {segment.y * 20}px; left: {segment.x * 20}px;"></div>
    {/each}

    <div class="food" style="top: {food.y * 20}px; left: {food.x * 20}px;"></div>
</div>

<style>
    .snake-segment {
        position: absolute;
        width: 20px;
        height: 20px;
        background: green;
    }

    .map-cell {
        position: absolute;
        width: 20px;
        height: 20px;
        background: white;
        border: 1px solid black;
    }

    .food {
        position: absolute;
        width: 20px;
        height: 20px;
        background: red;
    }
</style>
```