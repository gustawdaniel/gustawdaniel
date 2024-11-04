---
title: Snake game in JavaScript (part 2 - events)
slug: snake-game-in-javascript-part-2-events
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2021-04-20T20:45:02.000Z
tags: ['js', 'game', 'snake']
draft: true
---

## About project

We continuing our adventure with snake started at previous post. Now there is time to
present pre release version 0.2 available on [github](https://github.com/gustawdaniel/snake_js/releases/tag/v0.2).

We will be continue from last commit from previous article to commit connected directly with release 0.2

```bash
git diff ae194969e7d2a555c9dc7ed2fb57c81b56775b62..5eb5cd18880be6db4e77f69f6fd3096912d8100e --stat
 README.md     |   8 +++++
 css/style.css |  25 ++++++++++++---
 index.html    |  48 +++++++++++++++++++++++------
 js/app.js     | 138 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++---------------
 4 files changed, 181 insertions(+), 38 deletions(-)
```

## Changes out of Javascript

For the sake of simplicity I will present final state of files `index.html`, `README.md` and `css/style.css`.
Next we will focus on changes in `js/app.js` commit by commit. So because of pausing of game was added
it was documented and `REDAME.md` looks like this

> README.md

```
# snake_js
Snake game written in javascript using objects.


# Instaltion

To install dependencies

    yarn install

To run

    node node_modules/http-server/bin/http-server

# Game

To game run

    firefox localhost:8080

Pres space to start and use arrows to control snake.
```

We reorganized `index.html` placing all description on the bottom of page.

> index.html

```html
<html>
<head>
    <title>Snake - game dedicated for Sylwia Dainecka - my girlfriend!</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <h1>I love Sylwia <3</h1>
        <p>To start or pause press space</p>
        <!--<br>-->
        <p class="info center"><span class="points">0</span><span class="state">PAUSED</span><span class="counter">0</span></p>
    </header>
    <main>
        <div id="map"></div>
    </main>
    <footer>
        <ul class="history"></ul>
        <hr>
        <h4>TODO:</h4>
        <h5>v0.1</h5>
        <ol>
            <li style="text-decoration: line-through">Add map</li>
            <li style="text-decoration: line-through">Add snake</li>
            <li style="text-decoration: line-through">Add events</li>
        </ol>
        <h5>v0.2</h5>
        <ol>
            <li style="text-decoration: line-through">Add apples</li>
            <li style="text-decoration: line-through">Add boundaries</li>
            <li style="text-decoration: line-through">Add scores</li>
        </ol>
        <h5>Future (proposed)</h5>
        <ol>
            <li>Add bad apples</li>
            <li>Add two players</li>
            <li>Add network gaming</li>
            <li>Add tests</li>
            <li>Add CI</li>
            <li>Create snake as module</li>
            <li>Use sass instead of css</li>
            <li>Add webpack</li>
            <li>Add user account</li>
            <li>Fix bug connected with appearing simultaneously many apples</li>
            <li>Special color of head</li>
            <li>Fix bug connected with changes direction many time in one round that allow bump int snake with length 3</li>
            <li>Add login by google</li>
            <li>Make it mobile friendly</li>
        </ol>
    </footer>
    <script src="node_modules/jquery/dist/jquery.min.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

As you can see on the list of proposed features I think there is potential to create multi player game.

We have only some lines of styles. It is result of one of assumptions of project - simplicity. This
excludes using external libraries at this stage of development.

> css/style.css

```css
.rect {
    width: 30px;
    height: 30px;
    background-color: #dca6d1;
    display: inline-block;
    margin: 2px;
    /*border-radius: 4px;*/
    /*border: solid 1px #dc6f91;*/
}

footer {
    padding-top: 3vh;
}

.info {
    border: 1px solid black;
    padding: 7px;
    text-align: center;
}

.points {
    float: left;
}

.counter {
    float: right;
}

footer ul.history:not(:empty) {
    border: 1px solid black;
    padding: 7px;
}

footer ul.history li {
    list-style: none;
}
```

## Evolution of JavaScript logic

Now we focus on small changes of JavaScript logic of game.

### Apples

We start from creating apple when game is initialised

> git diff ae194969e7d2a555c9dc7ed2fb57c81b56775b62..3056362ad24cf3523bb2931a992be45e41dbf58e js/app.js

```diff
@@ -5,12 +5,23 @@
         mapHeight: 10,
         snakeColor: "#8165f3",
         mapColor: "#dca6d1",
+        appleColor: "#dc5c61",
         roundTime: 1000
     };

     let map = {
         width: config.mapWidth,
         height: config.mapHeight,
+        apples: [],
+        addApple: function () {
+            let apple = {
+                x: Math.floor(Math.random() * this.width),
+                y: Math.floor(Math.random() * this.height)
+            };
+            this.apples.push(apple);
+            $(`div.rect[data-x="${apple.x}"][data-y="${apple.y}"]`).css('background-color',config.appleColor);
+            // console.log(this.apples);
+        },
         init: function () {
             let mapDiv = $('#map');
             for(let i=0; i<this.width; i++) {
@@ -20,6 +31,7 @@
                 }
                 mapDiv.append(rowDiv);
             }
+            this.addApple()
         }
     };
```

But there is one problem. Apple can be placed in body of snake. To prevent this catastrophe we
randomizing apple position until it lands out of snake. We added also function for remove apple.

> git diff 3056362ad24cf3523bb2931a992be45e41dbf58e..faef0fa66dea476c761ebf45f87cf2742bcbed18 js/app.js

```diff
@@ -18,9 +18,18 @@
                 x: Math.floor(Math.random() * this.width),
                 y: Math.floor(Math.random() * this.height)
             };
-            this.apples.push(apple);
-            $(`div.rect[data-x="${apple.x}"][data-y="${apple.y}"]`).css('background-color',config.appleColor);
-            // console.log(this.apples);
+            if(snake.containsCoordinates(apple)) { // apple is on snake  then repeat
+                console.log("appleOnSnake");
+                this.addApple();
+            } else {
+                this.apples.push(apple);
+                $(`div.rect[data-x="${apple.x}"][data-y="${apple.y}"]`).css('background-color',config.appleColor);
+            }
+        },
+        removeApple: function (toRemove) {
+            this.apples = this.apples.filter((apple) => {
+                return apple.x !== toRemove.x && apple.y !== toRemove.y
+            });
         },
         init: function () {
             let mapDiv = $('#map');
```

Snake gets number of his points and method to check if given coordinates belong to him.

> git diff 3056362ad24cf3523bb2931a992be45e41dbf58e..faef0fa66dea476c761ebf45f87cf2742bcbed18 js/app.js

```diff
@@ -36,7 +45,12 @@
     };

     let snake = {
+        points: 0,
         body: [{x:5,y:2},{x:4,y:2},{x:3,y:2}],
+        containsCoordinates: function (inspected) {
+            return this.body.filter(function (part) {
+                return part.x === inspected.x && part.y === inspected.y }).length
+        },
         draw: function() {
             this.body.forEach(function (part) {
                 $(`div.rect[data-x="${part.x}"][data-y="${part.y}"]`).css('background-color',config.snakeColor);
```

Finally we added eating apples to snake move function:

> git diff 3056362ad24cf3523bb2931a992be45e41dbf58e..faef0fa66dea476c761ebf45f87cf2742bcbed18 js/app.js

```diff
@@ -57,10 +71,23 @@
             this.body.unshift(head);
             $(`div.rect[data-x="${head.x}"][data-y="${head.y}"]`)
                 .css('background-color',config.snakeColor);
-            let mapCoordinates  = this.body.pop();
-            $(`div.rect[data-x="${mapCoordinates.x}"][data-y="${mapCoordinates.y}"]`)
-                .css('background-color',config.mapColor);
-
+            if(!this.eatApple()) {
+                let mapCoordinates  = this.body.pop();
+                $(`div.rect[data-x="${mapCoordinates.x}"][data-y="${mapCoordinates.y}"]`)
+                    .css('background-color',config.mapColor);
+            }
+        },
+        eatApple: function () {
+            if(map.apples.filter((part) => {
+                return part.x === this.body[0].x && part.y === this.body[0].y }).length
+            ) {
+                this.points ++;
+                $('.points').text(this.points);
+                console.log("eatApple");
+                map.removeApple(this.body[0]);
+                map.addApple();
+                return true;
+            }
         }
     };
```

Last change in this step is shortening time of loop to add more dynamism to game.

> git diff 3056362ad24cf3523bb2931a992be45e41dbf58e..faef0fa66dea476c761ebf45f87cf2742bcbed18 js/app.js

```diff
@@ -6,7 +6,7 @@
         snakeColor: "#8165f3",
         mapColor: "#dca6d1",
         appleColor: "#dc5c61",
-        roundTime: 1000
+        roundTime: 500
     };
```

### Game Over

Now we will make our game impossible to game. Earlier snake was immortal, now he dies after
always after 6. Wee need this feature to see logs with scores and easily test game reset.

> git diff faef0fa66dea476c761ebf45f87cf2742bcbed18..2e843cc0bf5c895bac529b60942baa3e94435939 js/app.js

```diff
@@ -93,15 +97,20 @@

     let game = {
         counter: 0,
-        direction: 'right', // right, left, up, down
+        direction: 'right', // right, left, up, down,
+        timeout: undefined,
         run: function () {
             snake.move(this.direction);
         },
         init: function () {
+            this.counter = 0;
             map.init();
-            snake.draw();
-            setInterval(() => {
+            snake.init();
+            this.timeout = setInterval(() => {
                 this.counter ++;
+                if(this.counter === 6) {
+                    this.gameOver();
+                }
                 $('.counter').text(this.counter);
                 this.run();
             },config.roundTime);
```

In main loop of game we setting counter to 0, draw snake, set interval and assign it to timeout
property. Finally when counter reach 6 we run function gameOver that is presented below

> git diff faef0fa66dea476c761ebf45f87cf2742bcbed18..2e843cc0bf5c895bac529b60942baa3e94435939 js/app.js

```diff
@@ -118,6 +127,15 @@
                         this.direction = this.direction === "left" ? this.direction : "right"; break;
                 }
             })
+        },
+        logResult: function () {
+            $('ul.history').prepend($(`<li>${performance.now().toFixed(2)} - ${snake.points} - ${this.counter} - ${(snake.points/this.counter).toFixed(4)}</li>`));
+        },
+        gameOver: function () {
+            clearInterval(this.timeout);
+            this.timeout = undefined;
+            this.logResult();
+            this.init();
         }
     };
```

Game over run function `logResult` that save scores and some other statistics on the bottom of page in
`ul` with class `history`. We have now two bugs to fix after these changes: resetting of map and state
of snake. To fix these behaviour we can change script in following way

> git diff faef0fa66dea476c761ebf45f87cf2742bcbed18..2e843cc0bf5c895bac529b60942baa3e94435939 js/app.js

```diff
@@ -33,6 +32,7 @@
         },
         init: function () {
             let mapDiv = $('#map');
+            mapDiv.html("");
             for(let i=0; i<this.width; i++) {
                 let rowDiv =$('<div>', {class: "row"});
                 for(let j=0; j<this.width; j++) {
@@ -46,7 +46,12 @@

     let snake = {
         points: 0,
-        body: [{x:5,y:2},{x:4,y:2},{x:3,y:2}],
+        body: [],
+        init: function () {
+            this.body = [{x:5,y:2},{x:4,y:2},{x:3,y:2}];
+            this.points = 0;
+            this.draw();
+        },
         containsCoordinates: function (inspected) {
             return this.body.filter(function (part) {
                 return part.x === inspected.x && part.y === inspected.y }).length
```

### Boundaries detection

It is time to make game over more realistic. Game should be ended when snake goes out of map, not
after 6 turns so we need function that check if snake is out of map:

> git diff 2e843cc0bf5c895bac529b60942baa3e94435939..fda66af34beae7c28d0b064d95d2f3a15a00fbbd js/app.js

```diff
@@ -30,6 +30,10 @@
                 return apple.x !== toRemove.x && apple.y !== toRemove.y
             });
         },
+        outOfMap: function (inspected) {
+            return inspected.x < 0 || inspected.x >= map.width
+                || inspected.y < 0 || inspected.y >= map.height;
+        },
         init: function () {
             let mapDiv = $('#map');
             mapDiv.html("");
```

We want also reset scores after snake resurrection

> git diff 2e843cc0bf5c895bac529b60942baa3e94435939..fda66af34beae7c28d0b064d95d2f3a15a00fbbd js/app.js

```diff
@@ -50,6 +54,7 @@
         init: function () {
             this.body = [{x:5,y:2},{x:4,y:2},{x:3,y:2}];
             this.points = 0;
+            $('.points').text(this.points);
             this.draw();
         },
         containsCoordinates: function (inspected) {
```

Now snake move can be continued if snake is not out of map or has not contains his head

> git diff 2e843cc0bf5c895bac529b60942baa3e94435939..fda66af34beae7c28d0b064d95d2f3a15a00fbbd js/app.js

```diff
@@ -73,13 +78,17 @@
                 case "right":
                     head.y = head.y + 1; break;
             }
-            this.body.unshift(head);
-            $(`div.rect[data-x="${head.x}"][data-y="${head.y}"]`)
-                .css('background-color',config.snakeColor);
-            if(!this.eatApple()) {
-                let mapCoordinates  = this.body.pop();
-                $(`div.rect[data-x="${mapCoordinates.x}"][data-y="${mapCoordinates.y}"]`)
-                    .css('background-color',config.mapColor);
+            if (map.outOfMap(head) || this.containsCoordinates(head)) {
+                game.gameOver();
+            } else {
+                this.body.unshift(head);
+                $(`div.rect[data-x="${head.x}"][data-y="${head.y}"]`)
+                    .css('background-color', config.snakeColor);
+                if (!this.eatApple()) {
+                    let mapCoordinates = this.body.pop();
+                    $(`div.rect[data-x="${mapCoordinates.x}"][data-y="${mapCoordinates.y}"]`)
+                        .css('background-color', config.mapColor);
+                }
             }
         },
         eatApple: function () {
```

Finally we can remove 6 turns constrain of snake life and for debugging assign all objects to window

> git diff 2e843cc0bf5c895bac529b60942baa3e94435939..fda66af34beae7c28d0b064d95d2f3a15a00fbbd js/app.js

```diff
@@ -104,13 +113,11 @@
         },
         init: function () {
             this.counter = 0;
+            this.direction = 'right';
             map.init();
             snake.init();
             this.timeout = setInterval(() => {
                 this.counter ++;
-                if(this.counter === 6) {
-                    this.gameOver();
-                }
                 $('.counter').text(this.counter);
                 this.run();
             },config.roundTime);
@@ -141,5 +148,8 @@

     game.init();

-
+    window.snake = snake;
+    window.map = map;
+    window.game = game;
+
 })();
```

### Pause

Gaming in snake all time without any break can be fatiguing. So our new feature will be state of pause.

> git diff fda66af34beae7c28d0b064d95d2f3a15a00fbbd..bd87fd2ffa8f69e841fe553a7cd16b317ad771a8 js/app.js

```diff
@@ -106,6 +106,7 @@

     let game = {
         counter: 0,
+        state: 'paused', // paused, active
         direction: 'right', // right, left, up, down,
         timeout: undefined,
         run: function () {
@@ -114,15 +115,13 @@
         init: function () {
             this.counter = 0;
             this.direction = 'right';
+            this.state = 'paused';
+            $(".state").text(this.state.toUpperCase());
             map.init();
             snake.init();
-            this.timeout = setInterval(() => {
-                this.counter ++;
-                $('.counter').text(this.counter);
-                this.run();
-            },config.roundTime);
+
             document.addEventListener('keypress',(e) => {
-                console.log(e.key);
+                console.log({key: e.key, code: e.keyCode});
                 switch (e.key) {
                     case "ArrowUp":
                         this.direction = this.direction === "down" ? this.direction : "up"; break;
@@ -132,6 +131,16 @@
                         this.direction = this.direction === "right" ? this.direction : "left"; break;
                     case "ArrowRight":
                         this.direction = this.direction === "left" ? this.direction : "right"; break;
+                    case "Enter":
+                        if(this.state === 'paused') {
+                            this.state = 'active';
+                            $(".state").text(this.state.toUpperCase());
+                            this.timeout = setInterval(() => {
+                                this.counter ++;
+                                $('.counter').text(this.counter);
+                                this.run();
+                            },config.roundTime);
+                        }
                 }
             })
         },
```

As you can see we added state to game, moved stetting timeout to code executed after detection of ENTER,
so you have additional time to know game before start.

### Prevent scrolling on keypress detection

When we added list of features page is now long enough to be scrollable. Arrows has the same default
behaviour like scrolling so to prevent this we added also this code

> git diff bd87fd2ffa8f69e841fe553a7cd16b317ad771a8..d0776a2fd5fd26fcccc1664f9261fa19fc90c280 js/app.js

```diff
@@ -142,6 +142,9 @@
                             },config.roundTime);
                         }
                 }
+                if([0, 32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
+                    e.preventDefault();
+                }
             })
         },
         logResult: function () {
```

### Prevent cheating by using pause to change direction

New feature sometimes means new problems. In our case pausing of game do not prevent to change direction
of snake, so can be used in unfairly way. To prevent this we should detect state of game and basing on
it allow or disallow to change direction. In this step we changed pause/active button to more intuitive -
SPACE instead of ENTER and replaced keyCode by key to make it more readable in detection of scrolling.

> git diff d0776a2fd5fd26fcccc1664f9261fa19fc90c280..274a49d6556d8fa8cd4c3e4dc8f14e3c5f56d68b js/app.js

```diff
@@ -44,6 +44,7 @@
                 }
                 mapDiv.append(rowDiv);
             }
+            snake.init();
             this.addApple()
         }
     };
@@ -118,20 +119,19 @@
             this.state = 'paused';
             $(".state").text(this.state.toUpperCase());
             map.init();
-            snake.init();

             document.addEventListener('keypress',(e) => {
                 console.log({key: e.key, code: e.keyCode});
                 switch (e.key) {
                     case "ArrowUp":
-                        this.direction = this.direction === "down" ? this.direction : "up"; break;
+                        this.direction = this.direction === "down" || this.state === "paused" ? this.direction : "up"; break;
                     case "ArrowDown":
-                        this.direction = this.direction === "up" ? this.direction : "down"; break;
+                        this.direction = this.direction === "up" || this.state === "paused" ? this.direction : "down"; break;
                     case "ArrowLeft":
-                        this.direction = this.direction === "right" ? this.direction : "left"; break;
+                        this.direction = this.direction === "right" || this.state === "paused" ? this.direction : "left"; break;
                     case "ArrowRight":
-                        this.direction = this.direction === "left" ? this.direction : "right"; break;
-                    case "Enter":
+                        this.direction = this.direction === "left" || this.state === "paused" ? this.direction : "right"; break;
+                    case " ":
                         if(this.state === 'paused') {
                             this.state = 'active';
                             $(".state").text(this.state.toUpperCase());
@@ -140,9 +140,15 @@
                                 $('.counter').text(this.counter);
                                 this.run();
                             },config.roundTime);
+                        } else {
+                            this.state = 'paused';
+                            $(".state").text(this.state.toUpperCase());
+                            clearInterval(this.timeout);
+                            this.timeout = undefined;
                         }
                 }
-                if([0, 32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
+                if([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) > -1) {
+                    console.log("CAT",e);
                     e.preventDefault();
                 }
             })
```

### Bug with listener fixing

We can detected second interesting bug. After any game over game add next event listeners. Code need some
refactor. We moved setting listeners to independent method that is called in init but is not called in
case of reset of game.

> git diff 274a49d6556d8fa8cd4c3e4dc8f14e3c5f56d68b..cf7f8e7455f72ea0ec9cdd7c58c1b5bbf0872d9a js/app.js

```diff
@@ -113,13 +113,7 @@
         run: function () {
             snake.move(this.direction);
         },
-        init: function () {
-            this.counter = 0;
-            this.direction = 'right';
-            this.state = 'paused';
-            $(".state").text(this.state.toUpperCase());
-            map.init();
-
+        setListeners: function () {
             document.addEventListener('keypress',(e) => {
                 console.log({key: e.key, code: e.keyCode});
                 switch (e.key) {
@@ -153,6 +147,17 @@
                 }
             })
         },
+        init: function () {
+            this.reset();
+            this.setListeners();
+        },
+        reset: function () {
+            this.counter = 0;
+            this.direction = 'right';
+            this.state = 'paused';
+            $(".state").text(this.state.toUpperCase());
+            map.init();
+        },
         logResult: function () {
             $('ul.history').prepend($(`<li>${performance.now().toFixed(2)} - ${snake.points} - ${this.counter} - ${(snake.points/this.counter).toFixed(4)}</li>`));
         },
@@ -160,7 +165,7 @@
             clearInterval(this.timeout);
             this.timeout = undefined;
             this.logResult();
-            this.init();
+            this.reset();
         }
     };
```

This is end of changes in JavaScript. Two next commits introduce changes in `README.md` and `index.html`
and these lines was presented in previous chapter.

Now game is functional and can be used to have fun. I hope this differential manner of presentation
evolution of code has more educational value and will helpful for adepts of JavaScript.
