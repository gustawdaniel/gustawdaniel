---
author: Daniel Gustaw
canonicalName: rust-wasm-snake-performance
coverImage: https://ucarecdn.com/99588e8d-d808-4c67-93cd-a2ebd12c3b94/-/crop/1024x512/0,256/
description: Vamos a medir el rendimiento de Rust en el juego de serpiente WASM. Estamos comprobando los límites del rendimiento y comparándolo con la versión de JS.
excerpt: Vamos a medir el rendimiento de Rust en el juego de serpiente WASM. Estamos comprobando los límites del rendimiento y comparándolo con la versión de JS.
publishDate: 2025-06-06 00:00:00+00:00
slug: es/rust-wasm-snake-rendimiento
tags:
- wasm
- rust
- snake
- javascript
- performance
title: Rendimiento de Rust Wasm en el ejemplo del juego de la serpiente
updateDate: 2025-06-06 00:00:00+00:00
---

En este artículo mostraré cómo construir un juego de serpiente en Rust y compilarlo a WASM.

Luego verificaremos hasta dónde podemos llegar con el rendimiento de Rust.

## Configuración del proyecto Wasm

Para crear un proyecto de rust wasm puedes usar el comando:

```bash
cargo generate --git https://github.com/rustwasm/wasm-pack-template.git --name rust-snake-wasm
cd rust-snake-wasm
```

Luego construir por

```bash
wasm-pack build
```

Tendrás un directorio `www` con una versión desactualizada de webpack, así que puedes actualizar `package.json` a las versiones:

```json
  "devDependencies": {
    "webpack": "^5.99.9",
    "webpack-cli": "^6.0.1",
    "webpack-dev-server": "^5.2.1",
    "copy-webpack-plugin": "^13.0.0",
    "rust-snake-wasm": "file:../pkg"
  }
```

también los scripts deben ejecutarse con la bandera `openssl-legacy-provider`, por lo que puedes configurar los scripts en:

```json
  "scripts": {
    "build": "NODE_OPTIONS=--openssl-legacy-provider webpack --config webpack.config.js",
    "start": "NODE_OPTIONS=--openssl-legacy-provider webpack-dev-server"
  },
```

Entonces puedes iniciar el servidor de desarrollo en el directorio `www` con:

```bash
npm run start
```

## Diseño y estilo del DOM

Podemos definir los siguientes bloques en nuestro juego:

- Pantalla de Juego Terminado - subtítulo y botón
- Canvas del juego - canvas html
- Pie de página - información de FPS y topología del juego

```html
  <body>
    <noscript>This page contains webassembly and javascript content, please enable javascript in your browser.</noscript>
    <div id="game-over">
      <p>Game Over!</p>
      <button onclick="restartGame()">Restart</button>
    </div>
    <canvas id="rust-snake-wasm-universe"></canvas>
    <footer>
      <span></span>
      <pre id="fps">1 FPS</pre>
      <pre id="topology" title="Change by pressing 't'">Flat</pre>
    </footer>
    <script src="./bootstrap.js"></script>
  </body>
```

Podemos establecer un estilo minimalista con solo colores negro y blanco:

```css
body {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

#game-over {
    display: none; /* show by flex */
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;

    background: white;
    color: black;
    font-family: monospace;
    z-index: 9999;

    flex-direction: column;
    align-items: center;
    justify-content: center;

    border: 2px solid black;
}

#game-over p {
    font-size: 1.5em;
    margin-bottom: 1em;
}

#game-over button {
    font-family: monospace;
    font-size: 1em;
    padding: 0.5em 1em;
    background: black;
    color: white;
    border: none;
    cursor: pointer;
}

footer {
    display: grid;
    width: 385px;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 10px;
}
footer #fps {
    text-align: center;
    font-size: 0.7rem;
}
footer #topology {
    text-align: right;
    font-size: 0.7rem;
    margin-left: 1em;
}
```

vamos a dibujar algo como esto:

![](https://ucarecdn.com/c2ca1ee0-2f3a-4122-a790-1a389c1ae27e/-/preview/840x862/)

pero primero tenemos que crear una serpiente en wasm y conectar su estado a javascript.

## Serpiente en wasm

En el archivo `src/lib.rs` debemos cargar los paquetes que se usarán en nuestra serpiente.

```rust
// === Modules and Imports ===
mod utils;

use std::cmp::PartialEq;
use std::convert::TryInto;
use std::fmt;
use wasm_bindgen::prelude::*;
use wasm_timer::Instant;
```

normalmente para obtener `Instant` podemos importarlo de `std::time::Instant` pero no es compatible con wasm, así que tenemos que usar
el crate `wasm_timer`.

Otro crate no soportado es `rand`, así que para obtener valores aleatorios podemos usar el generador de números aleatorios de JavaScript del navegador mediante:

```rust
// === External JS Bindings ===
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = Math)]
    fn random() -> f64;
}
```

Ahora podemos crear enums y estructuras relacionadas con la lógica de nuestro juego. El primero será `Cell`, que puede estar activa o no. Las celdas activas (llamadas Vivas) representan el cuerpo de la serpiente o la manzana.

```rust
// === Shared Enums and Structs ===
#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Alive = 1,
    Dead = 0,
}
```

otro enum es `Direction` que se utiliza para señalar las direcciones de la serpiente.

```rust
#[wasm_bindgen]
#[derive(Debug, Clone, Copy)]
pub enum DirectionName {
    Up,
    Down,
    Left,
    Right,
}
```

también hay un `Topology` enum que se utiliza para definir cómo la serpiente interactuará con los bordes del mapa.

```rust
#[wasm_bindgen]
#[derive(Debug, Clone, Copy)]
pub enum UniverseTopology {
    Flat,
    Toroidal,
}
```

Opciones posibles:

- Plano - la serpiente no saldrá del mapa y terminará el juego cuando golpee el borde
- Toroidal - la serpiente saldrá del mapa y aparecerá en el otro lado del mapa

Para señalar una posición específica en el mapa utilizaremos dos convenciones posibles:

- punto `(x, y)` en el mapa
- índice `i = W * y + x`

La primera es más lógica, pero la segunda es más eficiente en el contexto de intercambio de datos entre `wasm` y `js`.

Para operar en la posición `(x, y)` utilizaremos la estructura `Position`.

```rust
#[wasm_bindgen]
#[derive(Clone)]
pub struct Position {
    x: u32,
    y: u32,
}
```

### Serpiente

Las posiciones se compararán entre sí utilizando el rasgo `PartialEq`.

```rust
impl PartialEq for Position {
    fn eq(&self, other: &Self) -> bool {
        (self.x == other.x) && (self.y == other.y)
    }
}
```

mientras que `Position` contiene solo valores `no negativos` representados por `u32`, la velocidad puede ser tanto positiva como negativa.

```rust
// === Snake ===
#[wasm_bindgen]
pub struct Direction {
    vx: i32,
    vy: i32,
}
```

Teniendo tanto `Position` como `Direction` podemos crear una estructura `Snake` que contendrá el cuerpo de la serpiente y la dirección.

```rust
#[wasm_bindgen]
pub struct Snake {
    body: Vec<Position>,
    direction: Direction,
}
```

La serpiente tendrá:

- constructor
- método para establecer la dirección
- helper que verifica si la posición (codificada como índice) pertenece al cuerpo de la serpiente

```rust
#[wasm_bindgen]
impl Snake {
    pub fn new() -> Snake {
        Snake {
            body: vec![
                Position { x: 5, y: 6 },
                Position { x: 4, y: 6 },
                Position { x: 3, y: 6 },
                Position { x: 2, y: 6 },
            ],
            direction: Direction { vx: 1, vy: 0 },
        }
    }

    fn set_direction(&mut self, vx: i32, vy: i32) {
        self.direction = Direction { vx, vy };
    }

    pub fn set_direction_name(&mut self, direction: DirectionName) {
        match direction {
            DirectionName::Up => self.set_direction(0, -1),
            DirectionName::Down => self.set_direction(0, 1),
            DirectionName::Left => self.set_direction(-1, 0),
            DirectionName::Right => self.set_direction(1, 0),
        }
    }

    pub fn has_index(&self, index: u32, universe_width: u32) -> bool {
        self.body.iter().any(|p| p.y * universe_width + p.x == index)
    }
}
```

exponemos el método `set_direction_name` que establecerá la dirección basándose en el enum `DirectionName`. Esto permite ocultar el mapeo de nombres a vectores de dirección reales de la lógica interna de Snake.

### Contador de FPS

Es importante medir cuán rápido podemos renderizar el estado del juego gracias a Wasm. Ahora presentaré un código que realizará estas mediciones.

```rust
// === FPS Counter ===
pub struct FpsCounter {
    last_frame: Instant,
    frames: u32,
    fps: f64,
}

impl FpsCounter {
    pub fn new(fps_target: f64) -> FpsCounter {
        FpsCounter {
            last_frame: Instant::now(),
            frames: 0,
            fps: fps_target,
        }
    }

    pub fn tick(&mut self, fps_measurements: u32) {
        const AVG_LEARNING_RATE: f64 = 0.01;

        let now = Instant::now();
        let elapsed = now.duration_since(self.last_frame).as_nanos() as f64 / 1_000_000_000.0;
        self.last_frame = now;

        if self.frames != 0 {
            self.fps = self.fps * (1.0 - AVG_LEARNING_RATE)
                + ((fps_measurements as f64) / elapsed) * AVG_LEARNING_RATE;
        }

        self.frames += 1;
    }
}
```

Para calcular `FPS` estamos utilizando un promedio móvil exponencial. Pero en `tick` estamos añadiendo el argumento `fps_measurements` que se utiliza para medir más simulaciones de movimientos de la serpiente que una por cuadro. Cubriremos esto en detalle en la parte final del artículo cuando se analice el rendimiento.

### Universo del Juego

Ahora hablemos de los detalles del estado del juego:

```rust
// === Universe ===
#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: Vec<Cell>,
    snake: Snake,
    apple: Option<Position>,
    game_over: bool,
    topology: UniverseTopology,
    counter: FpsCounter,
}
```

Nuestro juego `Universe` contendrá:

- ancho y alto del mapa
- celdas que representan el mapa
- serpiente que se estará moviendo
- manzana que será comida
- bandera de fin de juego
- topología del mapa
- contador de fps

Podemos crear `Universe` mediante el siguiente constructor:

```rust
#[wasm_bindgen]
impl Universe {
    pub fn new(snake: Snake, fps_target: f64) -> Universe {
        utils::set_panic_hook();

        let width: u32 = 64;
        let height: u32 = 64;

        let cells = (0..width * height)
            .map(|i| if snake.has_index(i, width) { Cell::Alive } else { Cell::Dead })
            .collect();

        Universe {
            width,
            height,
            cells,
            snake,
            apple: None,
            game_over: false,
            topology: UniverseTopology::Toroidal,
            counter: FpsCounter::new(fps_target),
        }
    }
    
    ...
```

Para calcular un solo tick necesitamos funciones auxiliares:

```rust
    ...
    
    fn add_u32_i32(&self, u: u32, i: i32, modulo: u32) -> u32 {
        (u as i64 + i as i64).rem_euclid(modulo as i64) as u32
    }

    ...
```

Entonces, un solo `tick` hará:
- calcular la nueva posición de la cabeza
- verificar si la cabeza de la serpiente está en el cuerpo de la serpiente
- verificar si la cabeza de la serpiente está en la manzana
- establecer la nueva posición de la cabeza
- realizar la medición de `fps`

```rust
    ...
    
    pub fn tick(&mut self, fps_measurements: u32) {
        if self.game_over {
            return;
        }

        let new_head = match self.topology {
            UniverseTopology::Flat => {
                let head = self.snake.body.first().unwrap();
                let new_x = head.x as i32 + self.snake.direction.vx;
                let new_y = head.y as i32 + self.snake.direction.vy;

                if new_x < 0 || new_y < 0 || new_x >= self.width as i32 || new_y >= self.height as i32 {
                    self.game_over = true;
                    return;
                }

                Position {
                    x: new_x as u32,
                    y: new_y as u32,
                }
            }
            UniverseTopology::Toroidal => Position {
                x: self.add_u32_i32(self.snake.body.first().unwrap().x, self.snake.direction.vx, self.width),
                y: self.add_u32_i32(self.snake.body.first().unwrap().y, self.snake.direction.vy, self.height),
            },
        };

        if self.snake.body.contains(&new_head) {
            self.game_over = true;
            return;
        }

        let mut next = self.cells.clone();

        if let Some(apple) = &self.apple {
            if new_head.eq(apple) {
                self.randomize_apple();
                let apple = self.apple.clone().unwrap();
                let apple_idx = self.get_index(apple.y, apple.x);
                next[apple_idx] = Cell::Alive;
            } else {
                let last = self.snake.body.pop().unwrap();
                let old_idx = self.get_index(last.y, last.x);
                next[old_idx] = Cell::Dead;
            }
        }

        self.snake.body.insert(0, new_head);
        let new_idx = self.get_index(
            self.snake.body.first().unwrap().y,
            self.snake.body.first().unwrap().x
        );
        next[new_idx] = Cell::Alive;

        self.cells = next;

        if self.apple.is_none() {
            self.randomize_apple();
        }

        if fps_measurements > 0 {
            self.counter.tick(fps_measurements);
        }
    }
    
    ...
```

El universo será expuesto para `JavaScript` y será responsable de pasar eventos de cambio de dirección a `snake`:

```rust
    ...
    
    pub fn on_click(&mut self, direction: DirectionName) {
        self.snake.set_direction_name(direction);
    }
    
    ...
```

Para depuración, también añadimos el renderizado de `Universe` que no se utilizará en la práctica, pero que fue útil antes de que se implementara `canvas` en el frontend.

```rust
    ...

    pub fn render(&self) -> String {
        self.to_string()
    }
    
    ...
```

necesitamos exponer algunos getters de propiedades para `JS`:

```rust
    ...
    
    
    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    pub fn snake_mut(&mut self) -> *mut Snake {
        &mut self.snake
    }

    pub fn is_game_over(&self) -> bool {
        self.game_over
    }

    pub fn fps(&self) -> f64 {
        self.counter.fps
    }
    
    ...
```

Además, será posible cambiar la topología sobre la marcha.

```rust
    ...

    pub fn topology(&self) -> UniverseTopology {
        self.topology
    }

    pub fn toggle_topology(&mut self) {
        self.topology = match self.topology {
            UniverseTopology::Flat => UniverseTopology::Toroidal,
            UniverseTopology::Toroidal => UniverseTopology::Flat,
        };
    }

    ...
```

Otro método disponible en `Universe` es `get_index` que mapeará las coordenadas `(x, y)` al índice en el arreglo `cells`.

```rust
    ...
    
    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }
    
    ...
```

También necesitamos escribir un randomizador para Apple.

```rust
    ...
    
    fn randomize_apple(&mut self) {
        let apple_x = random_position(self.width.try_into().unwrap()) as u32;
        let apple_y = random_position(self.height.try_into().unwrap()) as u32;
        let apple_index = self.get_index(apple_y, apple_x);

        if self.cells[apple_index] == Cell::Dead {
            self.cells[apple_index] = Cell::Alive;
        } else {
            self.randomize_apple();
        }

        self.apple = Some(Position { x: apple_x, y: apple_y });
    }
}
```

donde `random_position` es un helper que utiliza la función `random` del crate `wasm-bindgen` mapeada a `Math.random` en JS.

```rust
// === Utility ===
#[wasm_bindgen]
pub fn random_position(max: i32) -> i32 {
    (random() * (max as f64)).floor() as i32
}
```

Finalmente, tenemos que implementar el rasgo `Display` para `Universe` para poder imprimirlo en la consola (sin soporte de `canvas`).

```rust
// === Traits ===
impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for line in self.cells.as_slice().chunks(self.width as usize) {
            for &cell in line {
                let symbol = if cell == Cell::Dead { '◻' } else { '◼' };
                write!(f, "{}", symbol)?;
            }
            writeln!(f)?;
        }
        Ok(())
    }
}
```

## Controlador JS de wasm snake

En el lado del frontend, `index.html` importa `bootstrap.js` que importa `index.js`.

Comando: `wasm-pack build` crea el directorio `pkg`. En `package.json` tenemos dependencia:

```json
    "rust-snake-wasm": "file:../pkg"
```

Así que en `index.js` podemos comenzar con importaciones como estas:

```javascript
// === Imports ===
import { memory } from "rust-snake-wasm/rust_snake_wasm_bg.wasm";
import {
    Universe,
    Cell,
    Snake,
    DirectionName,
} from "rust-snake-wasm";
```

La memoria se utiliza para compartir el estado de las celdas entre `wasm` y `js` y su rendimiento es crítico para el desarrollo de `wasm`.

Ahora podemos declarar algunas constantes que describen el tamaño del mapa y los colores:

```javascript
// === Constants ===
const fpsTarget = 10;
const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";
```

También necesitamos referencias a algunos elementos del DOM:

```javascript
// === DOM Elements ===
const canvas = document.getElementById("rust-snake-wasm-universe");
const fpsElement = document.getElementById("fps");
const topologyElement = document.getElementById("topology");
```

Y variables globales:

```javascript
// === Globals ===
let universe = Universe.new(Snake.new(), fpsTarget);
const width = universe.width();
const height = universe.height();
let inRenderLoop = false;
const ctx = canvas.getContext('2d');
```

Lo más importante es `universo` que se utilizará para interactuar con `wasm`.

En `html` manejamos el botón en la pantalla de `Game Over` mediante la función `restartGame` definida globalmente. Así que hay una asignación de esta función a `window`. La definiremos más tarde.

```javascript
// === Expose to Window ===
window.restartGame = restartGame;
```

Ahora podemos preparar `canvas`.

```javascript
// === Canvas Setup ===
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;
```

Y ve al bucle principal en `JS`.

```javascript
// === Main Loop ===
const renderLoop = () => {
    if (universe.is_game_over()) {
        console.log("Game over");
        drawGrid();
        drawCells();
        document.getElementById("game-over").style.display = "flex";
        return;
    }

    if (inRenderLoop) return;
    inRenderLoop = true;

    universe.tick(1);
    drawGrid();
    drawCells();

    fpsElement.innerText = `${universe.fps().toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} FPS`;

    topologyElement.innerText = universe.topology() === 0 ? "Flat" : "Toroidal";

    inRenderLoop = false;
};

setInterval(renderLoop, 1000 / fpsTarget);
```

Vemos que hay funciones `drawGrid` y `drawCells` que debemos definir.

La función de dibujar la cuadrícula crea líneas verticales y horizontales:

```javascript
// === Drawing Functions ===
const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines
    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
};
```

Mientras `drawCells` dibuja cajas dentro en color blanco o negro:

```javascript
const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);

            ctx.fillStyle = cells[idx] === Cell.Dead
                ? DEAD_COLOR
                : ALIVE_COLOR;

            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.stroke();
};
```

También había una pequeña función auxiliar que convierte `(x,y)` en `índice` similar a esta en `rust`:

```javascript
const getIndex = (row, column) => {
    return row * width + column;
};
```

Ahora, cuando tenemos el bucle principal `renderLoop`, podemos implementar `restartGame`:

```javascript
// === Game Functions ===
function restartGame() {
    document.getElementById("game-over").style.display = "none";
    universe = Universe.new(Snake.new(), fpsTarget);
    inRenderLoop = false;
    requestAnimationFrame(renderLoop);
}
```

El último elemento es el controlador de la entrada del teclado. Queremos reaccionar a:
- `teclas de flecha` para cambiar de dirección
- `t` para alternar la topología
- `Enter` para reiniciar el juego

```javascript
// === Input Handling ===
document.addEventListener("keydown", e => {
    switch (e.key) {
        case "ArrowUp":
            universe.on_click(DirectionName.Up);
            break;
        case "ArrowDown":
            universe.on_click(DirectionName.Down);
            break;
        case "ArrowLeft":
            universe.on_click(DirectionName.Left);
            break;
        case "ArrowRight":
            universe.on_click(DirectionName.Right);
            break;
        case "t":
            universe.toggle_topology();
            break;
        case "Enter":
            restartGame();
            break;
    }
});
```

## Rendimiento

Hace unos meses, en este blog presenté una serpiente escrita en `svelte`.

https://github.com/gustawdaniel/snake_js

Lo modifiqué un poco y añadí topología `Toroidal` y contador de `FPS`.

Esta versión permite observar aumentos de `fps` hasta `170`. Oscila entre `150` y `200`, pero la media es `170`.

Esperamos un `fps` más alto para la versión `wasm`. Experimentos en mi laptop muestran `240` estables.

No es una coincidencia. `240` es el límite de mi pantalla, lo que podemos confirmar con el comando:

```bash
$ xrandr
Screen 0: minimum 320 x 200, current 3840 x 2700, maximum 16384 x 16384
eDP-1 connected primary 2560x1600+640+0 (normal left inverted right x axis y axis) 345mm x 215mm
   2560x1600    240.00*+  60.00 +  59.99    59.97
```

Así que hay una pregunta sobre cuántos pasos de simulación se pueden realizar durante un fotograma.

Vamos a medirlo.

En lugar de

```javascript
universe.tick(1);
```

podemos poner

```javascript
const n = 100;
universe.tick(n);
for (let i = 0; i < n - 1; i++) {
    universe.tick(0);
}
```

De esta manera estamos midiendo 100 pasos de simulación en un solo fotograma. Primero envía `n = 100` a `fpsCounter`, las siguientes 99 llamadas no tocarán `fpsCounter` dándoles más tiempo para la siguiente medición.

Con `n = 100` podemos ver un `fps = 24 000` lo que significa que podemos ejecutar muchos más pasos por fotograma que `100`.

Para `n = 10 000` sin ningún problema podemos alcanzar `fps = 2 400 000` lo que es un resultado asombroso teniendo en cuenta los problemas de la versión pura de `js` al alcanzar incluso `240`.

Para `n = 100 000` vemos que el fps no aumenta de manera lineal y se detiene en el nivel `fps = 7 000 000` en lugar del esperado `24 000 000`. También podemos observar caídas en el uso de la tarjeta gráfica y el 100% de CPU al mismo tiempo.

Para `n = 1 000 000` nuestro lienzo se congela `fps = 14 000 000`, la tarjeta gráfica se utiliza solo en un pequeño porcentaje lo que significa que durante un segundo este proceso computará `14` millones de pasos pero actualizará la pantalla solo `14` veces.

Podemos ver que los límites de pasos en un solo fotograma que no disminuirán la tasa de fotogramas real de la pantalla están entre `10` y `100` mil pasos por fotograma.

Experimentos adicionales muestran que el límite de `30 000` pasos por fotograma lleva a un equilibrio entre `cpu` y `gpu` donde casi el `100%` de la GPU está en uso y casi el `100%` de un solo núcleo de la CPU.

Se muestra `fps = 7 200 000` lo cual es esperado porque es `240*30000`. De esta manera, el usuario observa aproximadamente 240 actualizaciones de pantalla por segundo, y cada actualización se realiza después de que la serpiente se mueve `30 000` veces.

Por supuesto, el juego en esta versión no es jugable, pero solo muestra cuánto más rendimiento podemos alcanzar utilizando wasm.

## Código

Todo el código está disponible en GitHub:

https://github.com/gustawdaniel/rust-snake-wasm
