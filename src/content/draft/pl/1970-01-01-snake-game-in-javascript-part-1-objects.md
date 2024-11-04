---
title: Snake game in JavaScript (part 1 - objects)
slug: snake-game-in-javascript-part-1-objects
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2021-04-20T20:43:51.000Z
tags: ['json', 'game', 'snake']
draft: true
---

## About project

This tutorial shows how to write Snake Game in
JavaScript. It require basic knowledge about objects
and methods of arrays. In first part we are going to
be able to display map, snake and allow snake to move
in chosen direction. This code will be not playable
version of game, but I decided to depart this project
to fragments because of highest educational value of
presenting process of building code, not only final
result.

If you are interested in final result you can
download it from
[github](https://github.com/gustawdaniel/snake_js/releases/tag/v0.1).

If you want to write code line by line together lets
start typing following these chapters.

## Map.

In this section we will se how to generate map for
snake.

### Server setup

> Commits
> 23d7da5a511855efd8e01da219af045d037dba93..26816daa5de0bd3c5203ca61d3b616ac003cfe39

We starting from creating `index.html`. It can be
empty or filled by simple text. I started from this
one:

```html
<html>
<head>
    <title>Snake - game dedicated for Sylwia Daniecka - my girlfriend!</title>
</head>
<body>
    <h1>I love Sylwia <3</h1>
</body>
</html>
```

To serve this document I installed `http-server` using
yarn. I typed:

```
yarn init
```

and press `Enter` such many times as needed. After
this i used commad:

```
yarn add http-server
```

These command are responsible for shape of file

> package.json

```json
{
  "name": "snake_js",
  "version": "1.0.0",
  "main": "index.js",
  "repository": "git@github.com:gustawdaniel/snake_js.git",
  "author": "Daniel Gustaw <gustaw.daniel@gmail.com>",
  "license": "MIT",
  "dependencies": {
    "http-server": "^0.11.1"
  }
}
```

Finally I write docs about starting project

```markdown
# snake_js
Snake game written in javascript using objects.

# Instaltion

To install dependencies

    yarn install

To run

    node node_modules/http-server/bin/http-server
```

### Map generation

> Commits
> 26816daa5de0bd3c5203ca61d3b616ac003cfe39..87dbf6d8162dde68ab137ddee78dcb975413d104

We will use `jquery` so we should type in console

```
yarn add jquery
```

Now we place div with id `map` and append script and
style from external files in `index.html`

> index.html

```diff
 <html>
 <head>
     <title>Snake - game dedicated for Sylwia Daniecka - my girlfriend!</title>
+    <link rel="stylesheet" href="css/style.css">
 </head>
 <body>
     <h1>I love Sylwia <3</h1>
+    <hr>
+    <h4>TODO:</h4>
+    <ol>
+        <li style="text-decoration: line-through">Add map</li>
+        <li>Add snake</li>
+        <li>Add events</li>
+    </ol>
+    <hr>
+    <main>
+        <div id="map"></div>
+    </main>
+    <script src="node_modules/jquery/dist/jquery.min.js"></script>
+    <script src="js/app.js"></script>
 </body>
 </html>
```

We are interested creating script that iterate over
size of map and place for example 10 rows with
10 rectangles in each. This script will be placed
in anonymous function in `js/app.js`

> js/app.js

```js
(function () {

    const config = {
        mapWidth: 10,
        mapHeight: 10
    };

    let map = {
        width: config.mapWidth,
        height: config.mapHeight,
        init: function () {
            let mapDiv = $('#map');
            for(let i=0; i<this.height; i++) {
                console.log(i);
                let rowDiv =$('<div>', {class: "row"});
                console.log(rowDiv);
                for(let j=0; j<this.width; j++) {
                    rowDiv.append($('<div>',{class:"rect", "data-x":i, "data-y":j}));
                }
                mapDiv.append(rowDiv);
            }
        }
    };

    map.init();


})();
```

This script create divs with class `rect` and place
it into divs with class `row` that are placed into
existing dive with id `map`.

These all divs have zero height so we should define
style for him.

> css/style.css

```css
.rect {
    width: 30px;
    height: 30px;
    background-color: #dca6d1;
    display: inline-block;
    margin: 2px;
}
```

Map should look like this:

[![Zrzut_ekranu_z_2018-02-21_11-05-20.png](https://s17.postimg.org/wilseqtgv/Zrzut_ekranu_z_2018-02-21_11-05-20.png)](https://postimg.org/image/ajfdrjcmj/)

## Snake

> Commit
> d50265a3a5adca92bfe7d5139c0e519e72d853dc..87dbf6d8162dde68ab137ddee78dcb975413d104

To add snake we should chose his color. In constant `config` responsible for
global configuration we describing color of snake.

> js/app.js

```diff
@@ -2,7 +2,8 @@

     const config = {
         mapWidth: 10,
         mapHeight: 10,
+        snakeColor: "#8165f3"
     };

     let map = {
```

Now se want to create object of snake. We have to define his initial shape,
iterate over his all parts (coordinates) and change background-color of
dives with this coordinates. Fortunately we added to divs with class `rect`
attributes `data-x` and `data-y` that will help in searching proper elements.

> js/app.js

```diff
@@ -22,7 +23,17 @@
         }
     };

+    let snake = {
+        body: [{x:5,y:2},{x:4,y:2},{x:3,y:2}],
+        draw: function() {
+            this.body.forEach(function (part) {
+                $(`div.rect[data-x="${part.x}"][data-y="${part.y}"]`).css('background-color',config.snakeColor);
+            })
+        }
+    };
+
     map.init();
+    snake.draw();


 })();
```

Finally we can proudly check these changes in todo list in index.html adding
to text-decoration property `line-through`

> index.html

```diff
@@ -9,7 +9,7 @@
     <h4>TODO:</h4>
     <ol>
         <li style="text-decoration: line-through">Add map</li>
-        <li>Add snake</li>
+        <li style="text-decoration: line-through">Add snake</li>
         <li>Add events</li>
     </ol>
     <hr>
```

Our ma should look like this

[![Zrzut_ekranu_z_2018-02-21_11-16-02.png](https://s17.postimg.org/4708hnju7/Zrzut_ekranu_z_2018-02-21_11-16-02.png)](https://postimg.org/image/wwn4eanu3/)

## Move and events

> Commit
> ae194969e7d2a555c9dc7ed2fb57c81b56775b62..d50265a3a5adca92bfe7d5139c0e519e72d853dc

It is time to add dynamics for our snake.

We start from adding counter to show how many turns have our game.

> index.html

```diff
     </ol>
     <hr>
+    <header>
+        <p class="counter">0</p>
+    </header>
     <main>
         <div id="map"></div>
     </main>
```

And style for this element

> css/style.css

```diff
+.counter {
+    text-align: right;
+    border: 1px solid black;
+    padding: 7px;
+ }
```

Now we come back to logic. Firstly we will need color of map, and
time of one rund in our configuration. Second value is measured in
milliseconds

> js/app.js

```diff
@@ -3,7 +3,9 @@
     const config = {
         mapWidth: 10,
         mapHeight: 10,
-        snakeColor: "#8165f3"
+        snakeColor: "#8165f3",
+        mapColor: "#dca6d1",
+        roundTime: 1000
     };

     let map = {
```

Next we want to add method move to snake object that remove his tail and
add his head in chosen direction in relate to current head.

> js/app.js

```diff
@@ -25,15 +25,64 @@

     let snake = {
         body: [{x:5,y:2},{x:4,y:2},{x:3,y:2}],
         draw: function() {
             this.body.forEach(function (part) {
                 $(`div.rect[data-x="${part.x}"][data-y="${part.y}"]`).css
('background-color',config.snakeColor);
             })
+        },
+        move: function (direction) {
+            let head = Object.assign({}, this.body[0]);
```

In function move we assign new head to variable head cloning current head. Simple
equality would not copy variable but only create reference to the same cell of memory.

> js/app.js

```diff
+            switch (direction) {
+                case "up":
+                    head.x = head.x -1; break;
+                case "down":
+                    head.x = head.x + 1; break;
+                case "left":
+                    head.y = head.y - 1; break;
+                case "right":
+                    head.y = head.y + 1; break;
+            }
```

Next in dependence of direction we change coordinates. It can be misleading
but x means height and increasing in down direction.

> js/app.js

```diff
+            this.body.unshift(head);
+            $(`div.rect[data-x="${head.x}"][data-y="${head.y}"]`)
+                .css('background-color',config.snakeColor);
+            let mapCoordinates  = this.body.pop();
+            $(`div.rect[data-x="${mapCoordinates.x}"][data-y="${mapCoordinates.y}"]`)
+                .css('background-color',config.mapColor);
+
+        }
+    };
```

Finally we append new head to body by `unshift`, add snake color to this field,
remove tail by `pop` function and add map color to this coordinate.

Now we want to call move function in interval and allow user to change direction.
We need new object - game.

> js/app.js

```diff
+    let game = {
+        counter: 0,
+        direction: 'right', // right, left, up, down
+        run: function () {
+            snake.move(this.direction);
+        },
```

Our game should have property with current direction of snake and counter
with number of turns. Function run of game contains now move of snake.

When game will start we will call `init` method of game.

```diff
+        init: function () {
+            map.init();
+            snake.draw();
+            setInterval(() => {
+                this.counter ++;
+                $('.counter').text(this.counter);
+                this.run();
+            },config.roundTime);
```

Init of game means init of map, drawing snake and set interval that
increase counter, update it on view, and call run method that move snake.

If snake would have the same direction all time, it could be end, but we
want to allow user change direction of snake by pressing arrows on keyboard,
for this purpose after defining time interval we defining event listener
for `keypress` that will change direction of snake.

> js/app.js

```diff
+            document.addEventListener('keypress',(e) => {
+                console.log(e.key);
+                switch (e.key) {
+                    case "ArrowUp":
+                        this.direction = this.direction === "down" ? this.direction : "up"; break;
+                    case "ArrowDown":
+                        this.direction = this.direction === "up" ? this.direction : "down"; break;
+                    case "ArrowLeft":
+                        this.direction = this.direction === "right" ? this.direction : "left"; break;
+                    case "ArrowRight":
+                        this.direction = this.direction === "left" ? this.direction : "right"; break;
+                }
+            })
         }
     };

-    map.init();
-    snake.drow();
+    game.init();
```

[![Zrzut_ekranu_z_2018-02-21_11-20-20.png](https://s17.postimg.org/83dkdw4wf/Zrzut_ekranu_z_2018-02-21_11-20-20.png)](https://postimg.org/image/mmkpfay17/)

## Summary

We can now move snake in map. It is can penetrate the walls and himself.
There is no apples for eating, but as it was mentioned. It is not final product
but first pre release that present rather educational than functional value.

Below I present plans about future releases.

##### v0.1

1. Add map
2. Add snake
3. Add events

##### v0.2

1. Add apples
2. Add boundaries
3. Add scores

##### Future (proposed)

1. Add bad apples
2. Add two players
3. Add network gaming

You can propose your own features if you want and add them as comments or
issues in github repository. I hope you learned something valuable reading
this tutorial.
