---
author: Daniel Gustaw
canonicalName: svelte-snake-deployed-on-deno
coverImage: https://ucarecdn.com/a29bb2f8-5795-487b-a9c3-d80c124970f8/-/preview/926x891/
description: Svelte Snake es un juego simple escrito en Svelte. Está desplegado en Deno, un entorno de ejecución seguro para JavaScript y TypeScript.
excerpt: Svelte Snake es un juego simple escrito en Svelte. Está desplegado en Deno, un entorno de ejecución seguro para JavaScript y TypeScript.
publishDate: 2024-11-15 00:00:00+00:00
slug: es/svelte-snake-desplegado-en-deno
tags:
- svelte
- snake
- deno
title: Svelte snake desplegado en deno
updateDate: 2024-11-15 00:00:00+00:00
---

## Acerca del proyecto

Este tutorial muestra cómo escribir el juego de Serpiente en Svelte. Requiere conocimientos básicos de objetos y métodos de arreglos. En la primera parte, podremos mostrar el mapa, la serpiente y permitir que la serpiente se mueva en la dirección elegida. Este código no será una versión jugable del juego, pero decidí dividir este proyecto en fragmentos por el mayor valor educativo que tiene presentar el proceso de construcción del código, no solo el resultado final.

### Crear una aplicación Svelte

Comencemos creando una aplicación Svelte.

```bash
npx sv create svelte-snake
cd svelte-snake
```

Podemos comenzarlo con

```bash
pnpm i && pnpm dev
```

Ahora podemos empezar a escribir el juego.

en `src/routes/+page.svelte` establece el código

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

![](https://ucarecdn.com/10c7c557-f5a4-4a3d-b8dc-970ffd78f46c/-/preview/726x97/)

podemos ver que la serpiente se está moviendo hacia la derecha.

### Renderizado del mapa

Ahora podemos renderizar el mapa. Crearemos un mapa de 20x20.

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

![](https://ucarecdn.com/23cda6e4-c4e0-443d-93b5-79743e768219/-/preview/681x428/)

### Movimiento de la serpiente

Ahora podemos mover la serpiente en la dirección elegida. Estamos usando `onMount` para evitar preguntar sobre el objeto `window` en el lado del servidor.

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

### Serpiente comiendo

Ahora podemos hacer que la serpiente coma comida. Agregaremos un objeto de comida y verificaremos si la cabeza de la serpiente está en la posición de la comida.

Luego generaremos una nueva posición de comida y agregaremos un nuevo segmento a la serpiente sin eliminar el último segmento.

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

### Detección de colisiones

Para hacer el juego jugable, necesitamos agregar detección de colisiones. Verificaremos si la cabeza de la serpiente está en el borde del mapa o en el cuerpo de la serpiente.

```html
<script lang="ts">
    import { onMount } from 'svelte';

    let snake = [{ x: 5, y: 5 }];
    let direction = { x: 1, y: 0 };
    let food = { x: 10, y: 10 };
    const gridSize = 20;
    let gameOver = false;

    const move = () => {
        if (gameOver) return;

        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

        // Check for collisions with borders
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
            endGame("You hit the border!");
            return;
        }

        // Check for collisions with the snake itself
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            endGame("You collided with yourself!");
            return;
        }

        // Check if the snake eats the food
        if (head.x === food.x && head.y === food.y) {
            food = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
            snake = [head, ...snake];
        } else {
            snake = [head, ...snake.slice(0, -1)];
        }
    };

    const endGame = (message: string) => {
        gameOver = true;
        console.log(message); // Optionally log the message for debugging
    };

    const resetGame = () => {
        gameOver = false;
        snake = [{ x: 5, y: 5 }];
        direction = { x: 1, y: 0 };
        food = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
    };

    setInterval(move, 200);

    let map = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => 0));

    onMount(() => {
        window.addEventListener('keydown', (event) => {
            if (gameOver) return;
            if (event.key === 'ArrowUp' && direction.y === 0) {
                direction = { x: 0, y: -1 };
            } else if (event.key === 'ArrowDown' && direction.y === 0) {
                direction = { x: 0, y: 1 };
            } else if (event.key === 'ArrowLeft' && direction.x === 0) {
                direction = { x: -1, y: 0 };
            } else if (event.key === 'ArrowRight' && direction.x === 0) {
                direction = { x: 1, y: 0 };
            }
        });
    });
</script>

<div>
    {#if gameOver}
        <div class="overlay">
            <p>Game Over!</p>
            <button on:click={resetGame}>Restart</button>
        </div>
    {/if}

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

    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10;
    }

    .overlay button {
        margin-top: 10px;
        padding: 10px 20px;
        background: white;
        color: black;
        border: none;
        cursor: pointer;
        font-size: 1rem;
    }
</style>
```

Este es el final del juego clásico de la serpiente. Vamos a agregar más características como puntuación, aumento de velocidad, multijugador, pero primero desplegaremos este juego en Deno Deploy.

## Desplegar en Deno

Hay documentación de [adaptadores de svelte kit](https://svelte.dev/docs/kit/adapters) y [discusión en reddit](https://www.reddit.com/r/Deno/comments/1g4gtrh/anyone_using_sveltekit_with_deno_2/).

Tanto la documentación como la discusión no presentan ninguna solución funcional documentada paso a paso.

Hay un panel de control de deno https://dash.deno.com/projects donde puedes seleccionar svelte, pero no funciona por defecto.

Primero necesitamos reemplazar `@sveltejs/adapter-auto` con `@sveltejs/adapter-static` en `svelte.config.js`.

```bash
pnpm remove @sveltejs/adapter-auto
pnpm add @sveltejs/adapter-static
```

en `svelte.config.js` cambia

```javascript
import adapter from "@sveltejs/adapter-auto";
```

a

```javascript
import adapter from "@sveltejs/adapter-static";
```

para hacer que todas las rutas sean completamente `pre-renderizables`, añadimos el archivo `src/routes/+layout.ts` con el contenido

```typescript
export const prerender = true;
```

Ahora, si ejecutamos `pnpm build`, tendremos un directorio `build` con archivos estáticos.

Para servir desde este directorio, necesitamos un script más: `statoc/mod.ts` en el directorio principal.

```typescript
import { serve } from "https://deno.land/std@0.188.0/http/mod.ts";

serve((req) => {
    const url = new URL(req.url);
    const filePath = `${Deno.cwd()}${url.pathname}`;

    try {
        const file = Deno.readFileSync(filePath);
        const contentType = getContentType(url.pathname);
        return new Response(file, {
            headers: { "content-type": contentType || "application/octet-stream" },
        });
    } catch {
        const file = Deno.readFileSync(`${Deno.cwd()}/index.html`);
        return new Response(file, {headers: { "content-type": "text/html" } });
    }
});

function getContentType(pathname: string): string | undefined {
    const ext = pathname.split(".").pop();
    switch (ext) {
        case "html": return "text/html";
        case "js": return "application/javascript";
        case "css": return "text/css";
        case "png": return "image/png";
        case "jpg": return "image/jpeg";
        case "svg": return "image/svg+xml";
        case "json": return "application/json";
        default: return undefined;
    }
}
```

Configurando deno deploy manualmente, se generará un archivo de flujo de trabajo de github actions `.github/workflows/deploy.yml` con el contenido

```yaml
name: Deploy
on:
  push:
    branches: main
  pull_request:
    branches: main

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest

    permissions:
      id-token: write # Needed for auth with Deno Deploy
      contents: read # Needed to clone the repository

    steps:
      - name: Clone repository
        uses: actions/checkout@v4

      - name: Install Deno
        uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - name: Install step
        run: "deno install --allow-scripts"

      - name: Build step
        run: "npm run build"

      - name: Upload to Deno Deploy
        uses: denoland/deployctl@v1
        with:
          project: "snake-svelte"
          entrypoint: "mod.ts"
          root: "build"
```

entonces `mod.ts` en `static` se colocará en el directorio `build`. 
Ahora puedes desplegar simplemente enviando el código al repositorio de github.

Puedes ver el resultado en

https://snake-svelte-ppwa4dcfqbyd.deno.dev/

O para una versión más avanzada, que se describirá en las próximas publicaciones

https://snake-svelte.deno.dev/

Repositorio con el proyecto 

https://github.com/gustawdaniel/snake_js

Agregué algunos cambios encss para hacer el juego más jugable, que no son lo suficientemente interesantes como para adjuntarlos aquí, pero puedes revisarlos en [commit](https://github.com/gustawdaniel/snake_js/commit/6d8c681ece83a43a1f505cd89579c4e939386251)

![](https://ucarecdn.com/a29bb2f8-5795-487b-a9c3-d80c124970f8/-/preview/926x891/)
