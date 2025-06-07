---
author: Daniel Gustaw
canonicalName: rust-wasm-snake-performance
coverImage: https://ucarecdn.com/99588e8d-d808-4c67-93cd-a2ebd12c3b94/-/crop/1024x512/0,256/
description: Lets measure performance of Rust in WASM snake game. We checking limits of performance and compare it with JS version.
excerpt: Lets measure performance of Rust in WASM snake game. We checking limits of performance and compare it with JS version.
publishDate: 2025-06-06 00:00:00+00:00
slug: en/rust-wasm-snake-performance
tags:
- wasm
- rust
- snake
- javascript
- performance
title: Rust Wasm performance on snake game example
updateDate: 2025-06-06 00:00:00+00:00
---

In this article I will show how to build snake game in Rust and compile it to WASM.

Then we will check how far we can go with Rust performance.

## Wasm project setup

To create rust wasm project you can use command:

```bash
cargo generate --git https://github.com/rustwasm/wasm-pack-template.git --name rust-snake-wasm
cd rust-snake-wasm
```

Then build by

```bash
wasm-pack build
```

You will have `www` directory with outdated webpack version so you can update `package.json` to versions:

```json
  "devDependencies": {
    "webpack": "^5.99.9",
    "webpack-cli": "^6.0.1",
    "webpack-dev-server": "^5.2.1",
    "copy-webpack-plugin": "^13.0.0",
    "rust-snake-wasm": "file:../pkg"
  }
```

also scripts should be run with flag `openssl-legacy-provider` so you can set scripts to:

```json
  "scripts": {
    "build": "NODE_OPTIONS=--openssl-legacy-provider webpack --config webpack.config.js",
    "start": "NODE_OPTIONS=--openssl-legacy-provider webpack-dev-server"
  },
```

Then you can start development server in `www` directory by:

```bash
npm run start
```

## DOM layout and style

We can define the following blocks in our game:

- Game Over screen - subtitle and button
- Game canvas - html canvas
- Footer - FPS and game topology information

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

We can set minimalistic style with only black and white colors:

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

we are going to draw something like this:

![](https://ucarecdn.com/c2ca1ee0-2f3a-4122-a790-1a389c1ae27e/-/preview/840x862/)

but firstly we have to create snake in wasm and connect its state to javascript.

## Snake in wasm

In file `src/lib.rs` we have to load packages that will be used in our snake.

```rust
// === Modules and Imports ===
mod utils;

use std::cmp::PartialEq;
use std::convert::TryInto;
use std::fmt;
use wasm_bindgen::prelude::*;
use wasm_timer::Instant;
```

usually tp get `Instant` we can import it from `std::time::Instant` but it is not supported by wasm so we have to use
`wasm_timer` crate.

Another not supported crate is `rand`, so to get random values we can use JavaScript randomizer from browser by:

```rust
// === External JS Bindings ===
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = Math)]
    fn random() -> f64;
}
```

Now we can create enums and structures connected with out game logic. First one will be `Cell` that can
be either active on no. Acrive cells (called Alive) represents the snake body or apple.

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

another enum is `Direction` that is used to point snake directions.

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

there is also `Topology` enum that is used to define how snake will interact with borders of map.

```rust
#[wasm_bindgen]
#[derive(Debug, Clone, Copy)]
pub enum UniverseTopology {
    Flat,
    Toroidal,
}
```

Possible options:

- Flat - snake will not go outside of map and finish game when it hits the border
- Toroidal - snake will go outside of map and occure on other side of the map

To point specific map position we will use two possible conventions:

- point `(x, y)` on map
- index `i = W * y + x`

First is more logical but second is more performant in context of exchangin data between `wasm` and `js`.

To operate on `(x, y)` position we will use `Position` struct.

```rust
#[wasm_bindgen]
#[derive(Clone)]
pub struct Position {
    x: u32,
    y: u32,
}
```

### Snake 

Positions will be compared to each other using `PartialEq` trait.

```rust
impl PartialEq for Position {
    fn eq(&self, other: &Self) -> bool {
        (self.x == other.x) && (self.y == other.y)
    }
}
```

while `Position` contains only `non-negative` values represended by `u32`, velocity can be both positive and negative.

```rust
// === Snake ===
#[wasm_bindgen]
pub struct Direction {
    vx: i32,
    vy: i32,
}
```

Having both `Position` and `Direction` we can create `Snake` struct that will contain snake body and direction.

```rust
#[wasm_bindgen]
pub struct Snake {
    body: Vec<Position>,
    direction: Direction,
}
```

Snake will have:

- constructor
- method to set direction
- helper checking if position (encoed as index) belog to snake body

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

we exposing method `set_direction_name` that will set direction based on `DirectionName` enum. This allow to hide
mapping from names to real direction vectors to Snake internal logic.

### FPS Counter

It is important to measure how fast we can render game state thanks to Wasm. Now I will present code that will do these measurements.

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

To calculate `FPS` we are using exponential moving average. But in `tick` we adding argument `fps_measurements` that is used to measure more snake movements simulations that one per frame. We will cover this in details in final part of article when performance will be analyzed.

### Game Universe

Now let's discuss game state details:

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

Our game `Universe` will contain:

- width and height of map
- cells that represent map
- snake that will be moving
- apple that will be eaten
- game over flag
- topology of map
- fps counter

We can create `Universe` by the following constructor:

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

To compute single tick we need helper functions:

```rust
    ...
    
    fn add_u32_i32(&self, u: u32, i: i32, modulo: u32) -> u32 {
        (u as i64 + i as i64).rem_euclid(modulo as i64) as u32
    }

    ...
```

Then single `tick` will:
- calculate new head position
- check if snake head is on snake body
- check if snake head is on apple
- set new head position
- do `fps` measurement

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

Universe will be exposed for `JavaScript` and will be responsible for passing events of direction change to `snake`:

```rust
    ...
    
    pub fn on_click(&mut self, direction: DirectionName) {
        self.snake.set_direction_name(direction);
    }
    
    ...
```

For debug we added also rendering of `Universe` that will not be used in practice but was helpful before `canvas` was implemented on frontend.

```rust
    ...

    pub fn render(&self) -> String {
        self.to_string()
    }
    
    ...
```

we need to expose some properties getters for `JS`:

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

Also topology will be possible to change on the fly.

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

Another method available on `Universe` is `get_index` that will map `(x, y)` coordinates to index in `cells` array.

```rust
    ...
    
    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }
    
    ...
```

We need also write randomizer for apple.

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

where `random_position` is helper using `random` function from `wasm-bindgen` crate mapped to `Math.random` in JS.

```rust
// === Utility ===
#[wasm_bindgen]
pub fn random_position(max: i32) -> i32 {
    (random() * (max as f64)).floor() as i32
}
```

Finally we have to implement `Display` trait for `Universe` to be able to print it on console (without `canvas` support).

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

## JS handler of wasm snake

On fronend side `index.html` imports `bootstrap.js` that imports `index.js`.

Command: `wasm-pack build` creates `pkg` directory. In `package.json` we have dependency:

```json
    "rust-snake-wasm": "file:../pkg"
```

So in `index.js` we can start from imports like these:

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

Memory is used to share cells state between `wasm` and `js` and it's performance is critical for `wasm` development.

Now we can declare some constants describing map size and colors:

```javascript
// === Constants ===
const fpsTarget = 10;
const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";
```

We need also references to some DOM elements:

```javascript
// === DOM Elements ===
const canvas = document.getElementById("rust-snake-wasm-universe");
const fpsElement = document.getElementById("fps");
const topologyElement = document.getElementById("topology");
```

And global variables:

```javascript
// === Globals ===
let universe = Universe.new(Snake.new(), fpsTarget);
const width = universe.width();
const height = universe.height();
let inRenderLoop = false;
const ctx = canvas.getContext('2d');
```

The most important is `universe` that will be used to interact with `wasm`.

In `html` we handling button in `Game Over` screen by globally defined `restartGame`. So there is assigment of this function to `window`. We will define it later.

```javascript
// === Expose to Window ===
window.restartGame = restartGame;
```

Now we can prepare `canvas`.

```javascript
// === Canvas Setup ===
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;
```

And go to main loop in `JS`.

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

We see that there are `drawGrid` and `drawCells` functions that we should define.

Draw grid create vertical and horizontal lines:

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

While `drawCells` draws boxes inside on white or black color:

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

There was also small helper function that convert `(x,y)` to `index` similar to this one in `rust`:

```javascript
const getIndex = (row, column) => {
    return row * width + column;
};
```

Now, when we have main loop `renderLoop` we can implement `restartGame`:

```javascript
// === Game Functions ===
function restartGame() {
    document.getElementById("game-over").style.display = "none";
    universe = Universe.new(Snake.new(), fpsTarget);
    inRenderLoop = false;
    requestAnimationFrame(renderLoop);
}
```

Last element is handler of keyboard input. We want to react on:
- `arrow keys` to change direction
- `t` to toggle topology
- `Enter` to restart game

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

## Performance

Few months ago on this blog I presented snake written in `svelte`.

https://github.com/gustawdaniel/snake_js

I modified it a little bit and added `Toroidal` topology and `FPS` counter.

This version allow to observe `fps` growths until `170`. It oscilate between `150` and `200` but mean is `170`.

We expect higer `fps` for `wasm` version. Experiment on my laptop shows stable `240`.

It is not accident. `240` is limit of my screen what we can confirm by command:

```bash
$ xrandr
Screen 0: minimum 320 x 200, current 3840 x 2700, maximum 16384 x 16384
eDP-1 connected primary 2560x1600+640+0 (normal left inverted right x axis y axis) 345mm x 215mm
   2560x1600    240.00*+  60.00 +  59.99    59.97
```

So there is question how many steps of simulation can be done during one frame.

Lets measure it.

Instead of

```javascript
universe.tick(1);
```

we can put

```javascript
const n = 100;
universe.tick(n);
for (let i = 0; i < n - 1; i++) {
    universe.tick(0);
}
```

This way we're measuring 100 steps of simulation in single frame. Firs send `n = 100` to `fpsCounter`, next 99 calls will not touch `fpsCounter` giving them more time to next measurement.

With `n = 100` we can see stable `fps = 24 000` what means that we can execute much more steps per frame than `100`.

For `n = 10 000` without any problem we can reach `fps = 2 400 000` what is amazing result taking into account problems of pure `js` version with reaching even `240`.

For `n = 100 000` we see that fps do not increase linear and stops on level `fps = 7 000 000` instead of expected `24 000 000`. We can also observe drops in graphic card usage and 100% of CPU in the same time.

For `n = 1 000 000` our canvas freeze `fps = 14 000 000` graphic card is used only in small percentage what means that during one second this process will compute `14` millions of steps but update screen only `14` times.

We can see that limits of steps in single frame that will not decrease real frame rate of screen is between `10` and `100` thousands steps per frame.

Further experiments shows that limit `30 000` steps per frame leads to equilibrium between `cpu` and `gpu` where nearly `100%` gpu is utilized and nearly `100%` single core of `cpu`.

Displayed `fps = 7 200 000` what is expected because it is `240*30000`. This way user observe about 240 screen updates per second, and every update is done after `30 000` snake moves.

Of course game in this version is not playable, but is only show how much more performance we can reach using wasm.

## Code

All code is available on GitHub:

https://github.com/gustawdaniel/rust-snake-wasm