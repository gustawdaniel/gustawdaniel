---
title: Snake game in JavaScript (part 3 - Vue)
slug: snake-game-in-javascript-part-3-vue
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2021-04-20T20:48:16.000Z
tags: ['js', 'game', 'snake']
draft: true
canonicalName: snake-game-in-javascript-part-3-vue
---

## About project

What is better than playing in snake? Playing in snake with friends. Now there is time to present
version of game for two players that use one computer. First player use arrows, second `WSAD`.

This is the same game like before but project was totally refactored. Code was divided into ES6 modules,
dependency of jQuery of Zepto was removed and replaced by Vue. Finally instead of snake we now have
collection of snakes.

As you can see below practically all code was rewritten so there is no sense to use differential presentation
of changes.

```bash
git diff 5eb5cd18880be6db4e77f69f6fd3096912d8100e..e48d9ba1200c70867317957bd22f4e8e6e37b4e8 --stat
 .gitignore                      |   3 +-
 README.md                       |  17 ++++---
 css/style.css                   |  44 ++++++++++++----
 index.html                      |  52 +++----------------
 js/app.js                       | 178 -----------------------------------------------------------------
 package.json                    |  31 ++++++++++--
 src/App.vue                     |  28 +++++++++++
 src/Event.js                    |   3 ++
 src/components/Footer.vue       |  45 +++++++++++++++++
 src/components/Header.vue       |  16 ++++++
 src/components/Main.vue         |  74 +++++++++++++++++++++++++++
 src/components/main/Board.vue   |  66 ++++++++++++++++++++++++
 src/components/main/Results.vue |  40 +++++++++++++++
 src/components/main/State.vue   |  25 +++++++++
 src/game/Board.js               |  54 ++++++++++++++++++++
 src/game/Config.js              |   5 ++
 src/game/Game.js                |  26 ++++++++++
 src/game/Snake.js               |  97 +++++++++++++++++++++++++++++++++++
 src/main.js                     |   7 +++
 webpack.config.js               |  78 +++++++++++++++++++++++++++++
 yarn.lock                       | 129 -----------------------------------------------
 21 files changed, 644 insertions(+), 374 deletions(-)
```

You can download this 0.3 pre release from [github](https://github.com/gustawdaniel/snake_js/releases/tag/v0.3).

## Code presentation

Project is organised in the following files

```
.
├── css
│   └── style.css
├── index.html
├── LICENSE
├── package.json
├── README.md
├── src
│   ├── App.vue
│   ├── components
│   │   ├── Footer.vue
│   │   ├── Header.vue
│   │   ├── main
│   │   │   ├── Board.vue
│   │   │   ├── Results.vue
│   │   │   └── State.vue
│   │   └── Main.vue
│   ├── Event.js
│   ├── game
│   │   ├── Board.js
│   │   ├── Config.js
│   │   ├── Game.js
│   │   └── Snake.js
│   └── main.js
└── webpack.config.js
```

We presents also statistics of code lines number

```
cloc $(git ls-files)
      20 text files.
      20 unique files.
      11 files ignored.

-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Javascript                       7             25              2            243
CSS                              1              9              0             49
HTML                             1              3              0             10
-------------------------------------------------------------------------------
SUM:                             9             37              2            302
-------------------------------------------------------------------------------
```

## Index and styles

Lets start from `css`. We removed colors form JavaScript config and now colors are defined in CSS
and cant displaying of snake or apple on map is controlled by classes, not inline styles. We introduced
also some flex rules. If you do not know flex, I strongly recommend to learn it. Flex fixes many
problems that css with position absolute/relative has.

> css/style.css

```css
#map .row {
    text-align: center;
}

.rect {
    width: 30px;
    height: 30px;
    background-color: #dca6d1;
    display: inline-block;
    margin: 2px;
}

.rect.out-map {
    background-color: #c1d0dc;
}
.rect.snake-0 {
    background-color: #8165f3;
}
.rect.snake-1 {
    background-color: #eff36a;
}
.rect.apple {
    background-color: #97dcd5;
}

.info {
    border: 1px solid black;
    padding: 7px;
    margin-bottom: 1em;
    text-align: center;
    justify-content: space-between;
    display: flex;
}

main .logs {
    display: flex;
    justify-content: space-evenly;
}

main .logs tr.best{
    background-color: whitesmoke;
}

main .logs tr.best td.points{
    font-weight: bold;
}

main .history {
    border: 1px solid black;
    padding: 7px;
    margin: 2vh 5px 0 5px;
    width: 100%;

}

main .history table {
    width: 100%;
}
```

Now because of we applied Vue, `index.html` is much smaller.

> index.html

```html
<html>
<head>
    <title>Snake - game dedicated for Sylwia Daniecka!</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

    <div id="app"></div>

    <script src="dist/build.js"></script>

</body>
</html>
```

We do not have file `dist/build.js` in this project but it is builded by webpack. You can see in Readme
that to run project we use now `npm run dev` command. It is more standard.

> README.md

```
# snake_js
Snake game written in javascript using objects.


# Instaltion

    # install dependencies
    yarn

    # serve with hot reload at localhost:8080
    npm run dev

    # build for production with minification
    npm run build

# Game

To game run

    firefox localhost:8080

Pres space to start and use arrows to control snake first snake or `WSAD` to control second one.

[![Zrzut_ekranu_z_2018-02-18_04-36-10.png](https://i.imgur.com/fnkcp2e.png)](https://i.imgur.com/fnkcp2e.png)
```

What means `npm run dev`? We can see it in `package.json` file

> package.json

```json
{
  "name": "snake_js",
  "description": "Simple javascript snake game.",
  "version": "0.3.0",
  "main": "index.js",
  "repository": "git@github.com:gustawdaniel/snake_js.git",
  "author": "Daniel Gustaw <gustaw.daniel@gmail.com>",
  "license": "MIT",
  "private": true,
  "scripts": {
    "dev": "cross-env NODE_ENV=development webpack-dev-server --open --hot",
    "build": "cross-env NODE_ENV=production webpack --progress --hide-modules"
  },
  "dependencies": {
    "vue": "^2.5.11"
  },
  "browserslist": [
    "> 1%",
    "last 2 versions",
    "not ie <= 8"
  ],
  "devDependencies": {
    "babel-core": "^6.26.0",
    "babel-loader": "^7.1.2",
    "babel-preset-env": "^1.6.0",
    "babel-preset-stage-3": "^6.24.1",
    "cross-env": "^5.0.5",
    "css-loader": "^0.28.7",
    "file-loader": "^1.1.4",
    "imports-loader": "^0.8.0",
    "live-server": "^1.2.0",
    "vue-loader": "^13.0.5",
    "vue-template-compiler": "^2.4.4",
    "webpack": "^3.6.0",
    "webpack-dev-server": "^2.9.1"
  }
}
```

You can see that this is hot reload webpack dev server with environmental variable NODE\_ENV set as `development`.
We come back to webpack configuration later. Now I would like to mention about last basic static file that
was added to project - LICENCE. I decided to use MIT Licence.

## ES6 modules

Old file `js/app.js` is now divided into for files `src/game/Board.js`, `src/game/Config.js`, `src/game/Game.js`
and `src/game/Snake.js`.

### Config

Config is simplified. We removed colors from this file. Time again is shorted from half second to 200 ms.

> src/game/Config.js

```js
export default {
    mapWidth: 10,
    mapHeight: 10,
    roundTime: 200
};
```

### Snake

Snake absorbed some game methods. For example game over for single player was mor connected with
state of game, but now it is game over for given snake and do not breaks game of his competitor.

Snake gets also new `class` world from `ES6` and real constructor. There are also footpring from
previous version (method init) but it shows advantage of Vue - progressive approach that allows
but not forces applying Vue methods of update frontend.

Last change is connected with logging. Any snake has his own array of logs, so logs was ealier
only in html, without connection with data model, now logs are stored in data model and are
assigned to snake, not to all game.

> src/game/Snake.js

```javascript
import config from './Config';
import Board from './Board';
import game from './Game';

export default class Snake {
    constructor(index,body,direction) {
        this.index = index;
        this.points = 0;
        this.body = body;
        this.direction = direction; // right, left, up, down,
        this.inGame = false; // check if snake goes to game area, when snake fail hi is out of game, when enter to game area hi is in game
        this.age = 0; // TODO increment snake age
        this.initialConfig = {
            body: body.slice(),
            direction: direction
        };
        this.logs = [];
    }

    init() {
        this.draw();
    }

    containsCoordinates(inspected) {
        return this.body.filter(function (part) {
            return part.x === inspected.x && part.y === inspected.y }).length
    }

    draw() {
        this.body.forEach((part) => {
            document.querySelector(`div.rect[data-x="${part.x}"][data-y="${part.y}"]`).classList.add(`snake-${this.index}`);
        })
    }

    move(direction) {
        let head = Object.assign({}, this.body[0]);
        switch (direction) {
            case "up":
                head.x = head.x -1; break;
            case "down":
                head.x = head.x + 1; break;
            case "left":
                head.y = head.y - 1; break;
            case "right":
                head.y = head.y + 1; break;
        }
        if (Board.outOfExtendedMap(head) || this.inGame && (Board.outOfMap(head) || this.containsCoordinates(head))) {
            this.gameOver();
        } else {
            if(!this.inGame && !Board.outOfMap(head)) { this.inGame = true; }

            this.body.unshift(head);
            document.querySelector(`div.rect[data-x="${head.x}"][data-y="${head.y}"]`).classList.add(`snake-${this.index}`);
            if (!this.eatApple()) {
                let mapCoordinates = this.body.pop();
                document.querySelector(`div.rect[data-x="${mapCoordinates.x}"][data-y="${mapCoordinates.y}"]`)
                    .classList.remove(`snake-${this.index}`);
            }
        }
    }

    eatApple() {
        if(game.map.apples.filter((part) => {
            return part.x === this.body[0].x && part.y === this.body[0].y }).length
        ) {

            this.points ++;
            game.map.removeApple(this.body[0]);
            game.map.addApple();
            return true;
        }
    }

    gameOver() {
        game.map.clearPositions(this.body);
        this.logResult();
        this.age = 0;
        this.points = 0;
        this.inGame = false;
        this.body = this.initialConfig.body.slice(); // fastest way of cloning array https://stackoverflow.com/questions/3978492/javascript-fastest-way-to-duplicate-an-array-slice-vs-for-loop
        this.direction =  this.initialConfig.direction;

        this.body.forEach(el => document.querySelector(`div.rect[data-x="${el.x}"][data-y="${el.y}"]`).classList.add(`snake-${this.index}`));
    }

    logResult() {

        if(this.inGame) {
            this.logs.unshift({
                now: performance.now().toFixed(2),
                points: this.points,
                age: this.age,
                counter: game.counter
            });
        }
    }
};
```

### Board

Board lost some of his responsibility. For example displaying apples are totally out of this code. In
Board object we only adding apples or removing them. For communication with layer of view, there is
responsible Vue.

But because of two snakes will play together map changed schape. Now it is divided into game area 10x10
and on the left area of spawn first snake, finally on the right area of spawn second snake.

> src/game/Board.js

```js
import config from './Config';
import game from './Game';

export default class Board {
    constructor() {
        this.width = config.mapWidth;
        this.height = config.mapHeight;
        this.apples = [];
    }

    addApple() {
        let apple = {
            x: Math.floor(Math.random() * this.width),
            y: Math.floor(Math.random() * this.height)
        };
       if(game.snakes[0].containsCoordinates(apple) || game.snakes[1].containsCoordinates(apple)) { // apple is on snake  then repeat
           this.addApple();
       } else {
           this.apples.push(apple);
       }
    }

    removeApple(toRemove) {

        this.apples = this.apples.filter((apple) => {
            return apple.x !== toRemove.x && apple.y !== toRemove.y
        });
    }

    static outOfMap(inspected) {
        return inspected.x < 0 || inspected.x >= config.mapWidth
            || inspected.y < 0 || inspected.y >= config.mapHeight;
    }

    static outOfExtendedMap(inspected) {
        return inspected.x < 0 || inspected.x >= config.mapWidth
            || inspected.y < 0-3 || inspected.y >= config.mapHeight+3;
    }

    clearPositions(positions) {
        positions.forEach(position => {
            const el = document.querySelector(`div.rect[data-x="${position.x}"][data-y="${position.y}"]`);
            el.classList.remove('snake-0');
            el.classList.remove('snake-1');
        });
    }

    init() {
        console.log(game.snakes[0]);
        game.snakes[0].init();
        game.snakes[1].init();
        this.addApple()
    }
}
```

### Game

Game object is extremely simplified. All logic connected with event handling is delegated to Vue component.
Game over is placed in Snake instances. In this case all program always use one instance of game so we do
not need use `new` keyword. Game defines two snakes and give then in constructor initial parameters.

```js
import Snake from './Snake';
import Board from './Board';

export default {
    counter: 0,
    timeout: undefined,
    snakes: [
        new Snake(0,[{x:9,y:-3}],"up"), // ,{x:8,y:-3},{x:7,y:-3}
        new Snake(1,[{x:0,y:12}],"down") // ,{x:1,y:12},{x:2,y:12}
    ],
    map: new Board(),
    state: "paused",
    run: function () {
       this.snakes[0].move(this.snakes[0].direction);
       this.snakes[1].move(this.snakes[1].direction);
    },
    init: function () {
        this.reset();
    },
    reset: function () {
        this.counter = 0;
        this.state = 'paused';
        this.map.init();
    }
};
```

## Vue

Now there is time to present role of Vue framework in this project. Entry point for webpack is selected as
`cat src/main.js` so I will start from this file

> cat src/main.js

```js
import Vue from 'vue'
import App from './App.vue'

new Vue({
    el: '#app',
    render: h => h(App)
});
```

If you rememver `package.json` Vue is only dependency in production environment. We import them and use
to create new Vue instance connected with `#app` element from `index.html` and we see that there rendered
component `App`

> src/App.vue

```html
<template>

    <div id="app">

        <Header></Header>

        <Main></Main>

        <Footer></Footer>

    </div>

</template>

<script>

    import Footer from './components/Footer.vue';
    import Header from './components/Header.vue';
    import Main from './components/Main.vue';

    export default {
        name: 'app',
        components: {
            Header, Main, Footer
        }
    }

</script>
```

This component only assembly components `Header`, `Main` and `Footer` and place them in one view.

Header is dedicated for inventor of this project

> src/components/Header.vue

```html
<template>

    <header>
        <h1>I love Sylwia <3</h1>
        <p>To start or pause press space</p>
    </header>

</template>

<script>

    export default {
        name: "Header"
    }

</script>
```

Footer contains change log and ideas to introduce in future.

> src/components/Footer.vue

```html
<template>
    <footer>
        <hr>
        <h4>Future (proposed)</h4>
        <ol>
            <li><strong>Add network gaming</strong></li>
            <li>Use sass instead of css</li>
            <li>Add CI</li>
            <li>Add bad apples</li>
            <li>Add tests</li>
            <li>Add user account</li>
            <li>Special color of head</li>
            <li>Fix bug connected with changes direction many time in one round that allow bump int snake with length 3</li>
            <li>Add login by google</li>
            <li>Add sounds</li>
            <li>Make it mobile friendly (how to swipe when we have two snakes?)</li>
            <li>Fix bug connected with appearing simultaneously many apples (probably fixed)</li>
        </ol>
        <h4>Change Log</h4>
        <h5>v0.3</h5>
        <ol>
            <li style="text-decoration: line-through">Add webpack</li>
            <li style="text-decoration: line-through">Create snake as module</li>
            <li style="text-decoration: line-through">Add two players</li>
        </ol>
        <h5>v0.2</h5>
        <ol>
            <li style="text-decoration: line-through">Add apples</li>
            <li style="text-decoration: line-through">Add boundaries</li>
            <li style="text-decoration: line-through">Add scores</li>
        </ol>
        <h5>v0.1</h5>
        <ol>
            <li style="text-decoration: line-through">Add map</li>
            <li style="text-decoration: line-through">Add snake</li>
            <li style="text-decoration: line-through">Add events</li>
        </ol>
    </footer>
</template>

<script>
    export default {
        name: 'Footer'
    }
</script>
```

So most interesting is `Main`. Main again contains three childrens but has also some logic. When main is
mounted there is executed method `game.init()`, when is created event listeners are added. Now for 9, not
5 buttons. Pause is still allowed.

> src/components/Main.vue

```html
<template>
    <main>
        <State></State>
        <Board></Board>
        <Results></Results>
    </main>
</template>

<script>

    import State from './main/State.vue'
    import Board from './main/Board.vue'
    import Results from './main/Results.vue'
    import Event from '../Event';

    import game from '../game/Game';
    import config from '../game/Config';

    export default {
        name: "Main",
        data() {
            return {
                game
            }
        },
        mounted() {
            game.init();
        },
        components: {
            State, Board, Results
        },
        created() {
            window.addEventListener('keydown', (e) => {
                console.log({key: e.key, code: e.keyCode});
                switch (e.key) {
                    case "ArrowUp":
                        game.snakes[0].direction = game.snakes[0].direction === "down" || game.state === "paused" ? game.snakes[0].direction : "up"; break;
                    case "ArrowDown":
                        game.snakes[0].direction = game.snakes[0].direction === "up" || game.state === "paused" ? game.snakes[0].direction : "down"; break;
                    case "ArrowLeft":
                        game.snakes[0].direction = game.snakes[0].direction === "right" || game.state === "paused" ? game.snakes[0].direction : "left"; break;
                    case "ArrowRight":
                        game.snakes[0].direction = game.snakes[0].direction === "left" || game.state === "paused" ? game.snakes[0].direction : "right"; break;
                    case "w":
                        game.snakes[1].direction = game.snakes[1].direction === "down" || game.state === "paused" ? game.snakes[1].direction : "up"; break;
                    case "s":
                        game.snakes[1].direction = game.snakes[1].direction === "up" || game.state === "paused" ? game.snakes[1].direction : "down"; break;
                    case "a":
                        game.snakes[1].direction = game.snakes[1].direction === "right" || game.state === "paused" ? game.snakes[1].direction : "left"; break;
                    case "d":
                        game.snakes[1].direction = game.snakes[1].direction === "left" || game.state === "paused" ? game.snakes[1].direction : "right"; break;
                    case " ":
                        if(game.state === 'paused') {
                            game.state = 'active';
                            game.timeout = game.timeout || setInterval(() => {
                                game.counter ++;
                                game.snakes.forEach(s => s.age++);
                                game.run();
                            },config.roundTime);
                        } else {
                            game.state = 'paused';
                            clearInterval(game.timeout);
                            game.timeout = undefined;
                        }
                }
                if([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) > -1) {
                    e.preventDefault();
                }
            });
        }
    };


</script>
```

There is also one interesing element `Event` - instance of vue used to proxy events between poorly related
Vue components.

> src/Event.js

```js
import Vue from 'vue';

export default Event = new Vue();
```

Come back to `Main` and look into his children. Lets start from `State`. Now state is directly binded
into view and updated on any change of game object - practically any turn.

> src/components/main/State.vue

```html
<template>
    <div class="info center">
        <span>{{game.snakes[0].points}}<br>{{game.snakes[0].age}}</span>
        <span>{{state}}<br>{{game.counter}}</span>
        <span>{{game.snakes[1].points}}<br>{{game.snakes[1].age}}</span>
    </div>
</template>

<script>
    import game from '../../game/Game';

    export default {
        name: "State",
        data() {
            return {
                game
            }
        },
        computed: {
            state() {
                return game.state.toUpperCase();
            }
        }
    }
</script>
```

Board is more complicated. We create double loop to create `.rect` divs. We use `:ref` property to prevent
of searching these elements any time when changes are done.

> src/components/main/Board.vue

```html
<template>
    <div id="map" v-if="show">
        <div v-for="i in range('rows')" class="row">
            <div v-for="j in range('cols')" class="rect" :class="isOutMap(j)" :data-x="i" :data-y="j" :ref="cordsToIndex(i,j)"></div>
        </div>
    </div>
</template>

<script>

    import Event from '../../Event';
    import game from '../../game/Game';

    export default {
        name: "Board",
        data() {
            return { show:true, game: game }
        },
        computed: {
            apples() {
                return this.game.map.apples;
            }
        },
        methods: {
            indexToCords(index) {
                return { x: index.splice("_")[0], y: index.splice("_")[1] };
            },
            cordsToIndex(i, j) {
                return `${i}_${j}`;
            },
            isOutMap(j) {
                return j<0 || j>=10 ? "out-map" : "";
            },
            range(direction) {
                if(direction === 'rows') {
                    return (new Array(10)).fill(1).map((e, i)=>{return i})
                } else if(direction === 'cols') {
                    return (new Array(10+6)).fill(1).map((e, i)=>{return i-3})
                } else {
                    throw new Error("not known direction, possible: rows and cols");
                }
            },
            rerender(){
                this.show = false;
                this.$nextTick(() => {
                    this.show = true;
                    console.log('re-render start');
                    this.$nextTick(() => {
                        console.log('re-render end')
                    })
                })
            }
        },
        created: function () {
            Event.$on("reset_map", () => {
                this.rerender();
            });
        },
        watch: {
            apples: function(n, o) {
                o.forEach(a => this.$refs[this.cordsToIndex(a.x,a.y)][0].classList.remove('apple'));
                n.forEach(a => this.$refs[this.cordsToIndex(a.x,a.y)][0].classList.add('apple'));
            }
        }
    }
</script>
```

Finally last component - `Results.vue` that presents historical resluts of players and make bold best
scores of player.

> src/components/main/Results.vue

```html
<template>

    <div class="logs">
        <div v-for="list in logs" class="history">
            <table>
                <thead>
                    <tr><th>Age</th><th>Counter</th><th>Points</th><th>Time</th><th>Age/Points</th></tr>
                </thead>
                <tbody>
                    <tr v-for="log in list" :class="best(list,log.points)">
                        <td>{{log.age}}</td>
                        <td>{{log.counter}}</td>
                        <td class="points">{{log.points}}</td>
                        <td>{{log.now}}</td>
                        <td v-text="(log.age / log.points).toFixed(2)"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
    import game from '../../game/Game';

    export default {
        name: "Results",
        data() {
            return {
                logs: game.snakes.map(s => s.logs)
            }
        },
        methods: {
            best(list, points) {
                console.log("LIST",list, points);
                return Math.max(...(list.map(l => l.points))) === points ? "best" : ""
            }
        }
    }
</script>
```

There are presented all files from `src` directory. It is time to present method od building project
configured in `webpack.config.js`

## Webpack

We use standard webpack proposed by Vue framework.

```js
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/dist/',
        filename: 'build.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    'css-loader'
                ],
            },      {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    loaders: {
                    }
                    // other vue-loader options go here
                }
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]?[hash]'
                }
            }
        ]
    },
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.esm.js'
        },
        extensions: ['*', '.js', '.vue', '.json']
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true,
        overlay: true
    },
    performance: {
        hints: false
    },
    devtool: '#eval-source-map'
};

if (process.env.NODE_ENV === 'production') {
    module.exports.devtool = '#source-map';
    // https://vue-loader.vuejs.org/en/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false
            }
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ])
}
```

Now we can attach screen shot from game.

[![Zrzut_ekranu_z_2018-02-18_04-36-10.png](https://i.imgur.com/fnkcp2e.png)](https://i.imgur.com/fnkcp2e.png)

Happy eating apples. I hope next version will allow to real multiplayer network game. If do you think any
feature out of this list

1. **Add network gaming**
2. Use sass instead of css
3. Add CI
4. Add bad apples
5. Add tests
6. Add user account
7. Special color of head
8. Fix bug connected with changes direction many time in one round that allow bump int snake with length 3
9. Add login by google
10. Add sounds
11. Make it mobile friendly (how to swipe when we have two snakes?)
12. Fix bug connected with appearing simultaneously many apples (probably fixed)

would be nice, please don't hesitate and add comment :D
