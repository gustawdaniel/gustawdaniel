---
author: Daniel Gustaw
canonicalName: rust-wasm-snake-performance
coverImage: https://ucarecdn.com/99588e8d-d808-4c67-93cd-a2ebd12c3b94/-/crop/1024x512/0,256/
description: Zmierzymy wydajność Rust w grze w węża na WASM. Sprawdzamy granice wydajności i porównujemy ją z wersją JS.
excerpt: Zmierzymy wydajność Rust w grze w węża na WASM. Sprawdzamy granice wydajności i porównujemy ją z wersją JS.
publishDate: 2025-06-06 00:00:00+00:00
slug: pl/rust-wasm-snake-wydajnosc
tags:
- wasm
- rust
- snake
- javascript
- performance
title: Wydajność Rust Wasm na przykładzie gry w węża
updateDate: 2025-06-06 00:00:00+00:00
---

W tym artykule pokażę, jak zbudować grę w węża w Rust i skompilować ją do WASM.

Następnie sprawdzimy, jak daleko możemy sięgnąć w kwestii wydajności Rust.

## Ustawienie projektu Wasm

Aby utworzyć projekt rust wasm, możesz użyć komendy:

```bash
cargo generate --git https://github.com/rustwasm/wasm-pack-template.git --name rust-snake-wasm
cd rust-snake-wasm
```

Zbuduj przez

```bash
wasm-pack build
```

Będziesz miał katalog `www` z przestarzałą wersją webpack, więc możesz zaktualizować `package.json` do wersji:

```json
  "devDependencies": {
    "webpack": "^5.99.9",
    "webpack-cli": "^6.0.1",
    "webpack-dev-server": "^5.2.1",
    "copy-webpack-plugin": "^13.0.0",
    "rust-snake-wasm": "file:../pkg"
  }
```

również skrypty powinny być uruchamiane z flagą `openssl-legacy-provider`, aby można było ustawić skrypty na:

```json
  "scripts": {
    "build": "NODE_OPTIONS=--openssl-legacy-provider webpack --config webpack.config.js",
    "start": "NODE_OPTIONS=--openssl-legacy-provider webpack-dev-server"
  },
```

Następnie możesz uruchomić serwer deweloperski w katalogu `www` za pomocą:

```bash
npm run start
```

## Układ i styl DOM

Możemy zdefiniować następujące bloki w naszej grze:

- Ekran Game Over - podtytuł i przycisk
- Płótno gry - płótno html
- Stopka - informacje o FPS i topologii gry

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

Możemy ustawić minimalistyczny styl z tylko czarnymi i białymi kolorami:

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

zamierzamy narysować coś takiego:

![](https://ucarecdn.com/c2ca1ee0-2f3a-4122-a790-1a389c1ae27e/-/preview/840x862/)

ale najpierw musimy stworzyć węża w wasm i połączyć jego stan z javaskriptem.

## Wąż w wasm

W pliku `src/lib.rs` musimy załadować pakiety, które będą używane w naszym wężu.

```rust
// === Modules and Imports ===
mod utils;

use std::cmp::PartialEq;
use std::convert::TryInto;
use std::fmt;
use wasm_bindgen::prelude::*;
use wasm_timer::Instant;
```

zazwyczaj, aby uzyskać `Instant`, możemy go zaimportować z `std::time::Instant`, ale nie jest on obsługiwany przez wasm, więc musimy użyć
`wasm_timer` crate.

Innym nieobsługiwanym crate jest `rand`, więc aby uzyskać losowe wartości, możemy użyć losowacza JavaScript z przeglądarki poprzez:

```rust
// === External JS Bindings ===
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = Math)]
    fn random() -> f64;
}
```

Teraz możemy stworzyć enumy i struktury związane z naszą logiką gry. Pierwszym z nich będzie `Cell`, który może być aktywny lub nie. Aktywne komórki (nazywane Alive) reprezentują ciało węża lub jabłko.

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

innym enumem jest `Direction`, który służy do wskazywania kierunków węża.

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

jest również enum `Topology`, który jest używany do określenia, w jaki sposób wąż będzie interagował z granicami mapy.

```rust
#[wasm_bindgen]
#[derive(Debug, Clone, Copy)]
pub enum UniverseTopology {
    Flat,
    Toroidal,
}
```

Możliwe opcje:

- Płaska - wąż nie opuści mapy i zakończy grę, gdy uderzy w granicę
- Toroidalna - wąż opuści mapę i pojawi się po drugiej stronie mapy

Aby wskazać konkretną pozycję na mapie, użyjemy dwóch możliwych konwencji:

- punkt `(x, y)` na mapie
- indeks `i = W * y + x`

Pierwsza jest bardziej logiczna, ale druga jest bardziej wydajna w kontekście wymiany danych między `wasm` a `js`.

Aby operować na pozycji `(x, y)`, użyjemy struktury `Position`.

```rust
#[wasm_bindgen]
#[derive(Clone)]
pub struct Position {
    x: u32,
    y: u32,
}
```

### Wąż

Pozycje będą porównywane ze sobą za pomocą cechy `PartialEq`.

```rust
impl PartialEq for Position {
    fn eq(&self, other: &Self) -> bool {
        (self.x == other.x) && (self.y == other.y)
    }
}
```

podczas gdy `Position` zawiera tylko `nienegatywne` wartości reprezentowane przez `u32`, prędkość może być zarówno dodatnia, jak i ujemna.

```rust
// === Snake ===
#[wasm_bindgen]
pub struct Direction {
    vx: i32,
    vy: i32,
}
```

Mając zarówno `Position`, jak i `Direction`, możemy stworzyć strukturę `Snake`, która będzie zawierać ciało węża i kierunek.

```rust
#[wasm_bindgen]
pub struct Snake {
    body: Vec<Position>,
    direction: Direction,
}
```

Wąż będzie miał:

- konstruktor
- metodę do ustawiania kierunku
- pomocniczą metodę sprawdzającą, czy pozycja (zakodowana jako indeks) należy do ciała węża

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

wprowadzamy metodę `set_direction_name`, która ustawi kierunek na podstawie enum `DirectionName`. To pozwala ukryć
mapowanie nazw na rzeczywiste wektory kierunkowe w logice wewnętrznej węża.

### Licznik FPS

Ważne jest, aby zmierzyć, jak szybko możemy renderować stan gry dzięki Wasm. Teraz zaprezentuję kod, który wykona te pomiary.

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

Aby obliczyć `FPS`, używamy wykładniczej średniej ruchomej. W `tick` dodajemy jednak argument `fps_measurements`, który służy do mierzenia więcej niż jednej symulacji ruchu węża na klatkę. Omówimy to szczegółowo w końcowej części artykułu, kiedy zostanie przeanalizowana wydajność.

### Uniwersum gry

Teraz omówmy szczegóły stanu gry:

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

Nasza gra `Universe` będzie zawierać:

- szerokość i wysokość mapy
- komórki, które reprezentują mapę
- węża, który będzie się poruszał
- jabłko, które będzie jedzone
- flaga końca gry
- topologia mapy
- licznik fps

Możemy stworzyć `Universe` za pomocą następującego konstruktora:

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

Aby obliczyć pojedynczy tick, potrzebujemy funkcji pomocniczych:

```rust
    ...
    
    fn add_u32_i32(&self, u: u32, i: i32, modulo: u32) -> u32 {
        (u as i64 + i as i64).rem_euclid(modulo as i64) as u32
    }

    ...
```

Wtedy pojedynczy `tick` będzie:
- obliczać nową pozycję głowy
- sprawdzać, czy głowa węża znajduje się na ciele węża
- sprawdzać, czy głowa węża znajduje się na jabłku
- ustawiać nową pozycję głowy
- przeprowadzać pomiar `fps`

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

Wszechświat będzie wystawiony na `JavaScript` i będzie odpowiedzialny za przekazywanie zdarzeń zmiany kierunku do `węża`:

```rust
    ...
    
    pub fn on_click(&mut self, direction: DirectionName) {
        self.snake.set_direction_name(direction);
    }
    
    ...
```

Dla debugowania dodaliśmy również renderowanie `Universe`, które nie będzie używane w praktyce, ale było pomocne przed wprowadzeniem `canvas` na frontend.

```rust
    ...

    pub fn render(&self) -> String {
        self.to_string()
    }
    
    ...
```

musimy wystawić niektóre gettery właściwości dla `JS`:

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

Również topologię będzie można zmieniać w locie.

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

Inną metodą dostępną w `Universe` jest `get_index`, która mapuje współrzędne `(x, y)` na indeks w tablicy `cells`.

```rust
    ...
    
    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }
    
    ...
```

Musimy również napisać randomizer dla jabłka.

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

gdzie `random_position` to pomocnik wykorzystujący funkcję `random` z crate'a `wasm-bindgen`, mapowaną do `Math.random` w JS.

```rust
// === Utility ===
#[wasm_bindgen]
pub fn random_position(max: i32) -> i32 {
    (random() * (max as f64)).floor() as i32
}
```

W końcu musimy zaimplementować trait `Display` dla `Universe`, aby móc go drukować na konsoli (bez wsparcia dla `canvas`).

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

## Obsługa JS w węża wasm

Po stronie frontendowej `index.html` importuje `bootstrap.js`, który importuje `index.js`.

Polecenie: `wasm-pack build` tworzy katalog `pkg`. W `package.json` mamy zależność:

```json
    "rust-snake-wasm": "file:../pkg"
```

Więc w `index.js` możemy zacząć od importów takich jak te:

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

Pamięć jest używana do dzielenia się stanem komórek pomiędzy `wasm` a `js`, a jej wydajność jest kluczowa dla rozwoju `wasm`.

Teraz możemy zadeklarować kilka stałych opisujących rozmiar mapy i kolory:

```javascript
// === Constants ===
const fpsTarget = 10;
const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";
```

Potrzebujemy również odniesień do niektórych elementów DOM:

```javascript
// === DOM Elements ===
const canvas = document.getElementById("rust-snake-wasm-universe");
const fpsElement = document.getElementById("fps");
const topologyElement = document.getElementById("topology");
```

I zmienne globalne:

```javascript
// === Globals ===
let universe = Universe.new(Snake.new(), fpsTarget);
const width = universe.width();
const height = universe.height();
let inRenderLoop = false;
const ctx = canvas.getContext('2d');
```

Najważniejsze jest `universe`, które będzie używane do interakcji z `wasm`.

W `html` obsługujemy przycisk na ekranie `Game Over` za pomocą globalnie zdefiniowanej `restartGame`. Tak więc przypisanie tej funkcji do `window` jest dokonane. Zdefiniujemy to później.

```javascript
// === Expose to Window ===
window.restartGame = restartGame;
```

Teraz możemy przygotować `canvas`.

```javascript
// === Canvas Setup ===
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;
```

I przejdź do głównej pętli w `JS`.

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

Widzę, że są funkcje `drawGrid` i `drawCells`, które powinniśmy zdefiniować.

Rysowanie siatki tworzy linie pionowe i poziome:

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

Podczas gdy `drawCells` rysuje pudełka wewnątrz na białym lub czarnym kolorze:

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

Istniała również mała funkcja pomocnicza, która konwertuje `(x,y)` na `index`, podobna do tej w `rust`:

```javascript
const getIndex = (row, column) => {
    return row * width + column;
};
```

Teraz, gdy mamy główną pętlę `renderLoop`, możemy zaimplementować `restartGame`:

```javascript
// === Game Functions ===
function restartGame() {
    document.getElementById("game-over").style.display = "none";
    universe = Universe.new(Snake.new(), fpsTarget);
    inRenderLoop = false;
    requestAnimationFrame(renderLoop);
}
```

Ostatni element to obsługa wejścia z klawiatury. Chcemy zareagować na:
- `strzałki` do zmiany kierunku
- `t` do przełączania topologii
- `Enter` do rozpoczęcia gry od nowa

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

## Wydajność

Kilka miesięcy temu na tym blogu zaprezentowałem grę w węża napisaną w `svelte`.

https://github.com/gustawdaniel/snake_js

Trochę ją zmodyfikowałem i dodałem topologię `Toroidal` oraz licznik `FPS`.

Ta wersja pozwala obserwować wzrosty `fps` aż do `170`. Oscyluje ona między `150` a `200`, ale średnia to `170`.

Spodziewamy się wyższych `fps` dla wersji `wasm`. Eksperyment na moim laptopie pokazuje stabilne `240`.

To nie jest przypadek. `240` to limit mojego ekranu, co możemy potwierdzić za pomocą komendy:

```bash
$ xrandr
Screen 0: minimum 320 x 200, current 3840 x 2700, maximum 16384 x 16384
eDP-1 connected primary 2560x1600+640+0 (normal left inverted right x axis y axis) 345mm x 215mm
   2560x1600    240.00*+  60.00 +  59.99    59.97
```

Więc jest pytanie, ile kroków symulacji można wykonać w trakcie jednej klatki.

Zmierzymy to.

Zamiast

```javascript
universe.tick(1);
```

możemy umieścić

```javascript
const n = 100;
universe.tick(n);
for (let i = 0; i < n - 1; i++) {
    universe.tick(0);
}
```

W ten sposób mierzymy 100 kroków symulacji w jednej klatce. Najpierw wysyłamy `n = 100` do `fpsCounter`, następne 99 wywołań nie dotknie `fpsCounter`, dając im więcej czasu na następny pomiar.

Przy `n = 100` widzimy stabilne `fps = 24 000`, co oznacza, że możemy wykonać znacznie więcej kroków na klatkę niż `100`.

Dla `n = 10 000` bez żadnych problemów możemy osiągnąć `fps = 2 400 000`, co jest niesamowitym wynikiem, biorąc pod uwagę problemy czystej wersji `js` z osiąganiem nawet `240`.

Dla `n = 100 000` widzimy, że fps nie zwiększa się liniowo i zatrzymuje się na poziomie `fps = 7 000 000` zamiast oczekiwanych `24 000 000`. Możemy również zaobserwować spadki w użyciu karty graficznej i 100% CPU w tym samym czasie.

Dla `n = 1 000 000` nasz canvas zamarza przy `fps = 14 000 000`, wykorzystanie karty graficznej jest tylko w małym procencie, co oznacza, że w ciągu jednej sekundy proces ten obliczy `14` milionów kroków, ale zaktualizuje ekran tylko `14` razy.

Możemy zobaczyć, że limity kroków w jednej klatce, które nie obniżą rzeczywistej liczby klatek na sekundę, mieszczą się między `10` a `100` tysiącami kroków na klatkę.

Dalsze eksperymenty pokazują, że limit `30 000` kroków na klatkę prowadzi do równowagi między `cpu` a `gpu`, gdzie niemal `100%` gpu jest wykorzystywane, a niemal `100%` pojedynczego rdzenia `cpu`.

Wyświetlone `fps = 7 200 000`, co jest oczekiwane, ponieważ wynosi `240*30000`. W ten sposób użytkownik obserwuje około 240 aktualizacji ekranu na sekundę, a każda aktualizacja odbywa się po `30 000` ruchach węża.

Oczywiście gra w tej wersji nie jest grywalna, ale pokazuje, ile więcej wydajności możemy osiągnąć, używając wasm.

## Kod

Wszystkie kody są dostępne na GitHubie:

https://github.com/gustawdaniel/rust-snake-wasm
