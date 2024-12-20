---
title: Scrabble
slug: scrabble
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2022-12-06T16:02:47.000Z
draft: true
canonicalName: scrabble-game-in-cpp
---

## Board generation

As many games `scrabble` is played on the board.

![](http://localhost:8484/1bbb26b9-c68c-4d39-8161-f03582cff199.avif)

In our case we want to play in terminal so it will looks like this:

![](http://localhost:8484/d734d549-e356-47f9-960d-bfb7b5bc50a4.avif)

To draw it we need only 33 lines of `c++` code. In `main.cpp` we defining `Game` and `Map` structures. Using `mvprintw` function from `ncurses` we can print all coordinates around map.

```c++
#include <ncurses.h>

struct Map {
public:
    int size = 15;

    void init() {
        initscr();
        // printing letters from A to O
        for (int i = 2; i < size + 2; i++) {
            const char c[] = {static_cast<char>(65 + i - 2), '\0'};
            mvprintw(0, i, "%s", c);
            mvprintw(size + 1, i, "%s", c);
        }
        // printing numbers from 1 to 15
        for (int i = 1; i < size + 1; i++) {
            mvprintw(i, 0, "%2d", i);
            mvprintw(i, 0 + size + 2, "%d", i);
        }
    }
};

struct Game {
    void init() {
        Map *map = new Map();
        map->init();
    }

    int end() {
        getch();
        endwin();
        return 0;
    }
};


int main() {
    Game *g = new Game();
    g->init();
    return g->end();
}
```

So initially our game is initialised. Then Map is initialised, all coordinates are printed and in function that will end game there is `getch` that wait for characted from keyboard.

To compile and run you can write

```
make run
```

with `Makefile`

```
build:
	g++ -lncursesw -o main main.cpp

run: build
	./main
```

## Cursor positioning

Now we have to allow for user to decide where he will type word. To do this we will show cursor on position `A1` and allow for changing them using arrows.

But there are some problems:

1. We do not want to print arrows on screen. So we will use

```
noecho();
```

from `ncurses`.

2\. We want to intercept special keys like arrows. So we have to set modifier

```
keypad(stdscr, TRUE);
```

Position of cursor is assigned to user in our game so we created additiona structures:

```c++
struct Pos {
    int x;
    int y;
};

struct Player {
    Pos pos;
}
```

user will have `init` method to set his cursor on `A1`

```
    void init() {
        pos.x = 2;
        pos.y = 1;
        mvprintw(pos.y, pos.x, "");
    }
```

and `setPosition` to allow to decide which position should be used as start of first word:

```
    void setPosition() {
        while (int c = getch()) {
            switch (c) {
                case KEY_LEFT: {
                    pos.x--;
                    break;
                }
                case KEY_RIGHT: {
                    pos.x++;
                    break;
                }
                case KEY_UP: {
                    pos.y--;
                    break;
                }
                case KEY_DOWN: {
                    pos.y++;
                    break;
                }
                default: {}
            }
            mvprintw(pos.y, pos.x, "");
        }
    }
```

In this loop we supporting all arrows. Currently do not worry about bounds of board.

All changes from previous step can be found in commit:

[added positions selection · gustawdaniel/scrabble-cpp-game@7a8c64d](https://github.com/gustawdaniel/scrabble-cpp-game/commit/7a8c64dcf43462a81511cb7a36888e16559fd9d4)

## Writing direction

Now we have to decide in which direction we will write our sentence. Unfortunately `ncurses` do not support special keys properly and I do not want to hack it. So I decided to support the following controll convention:

User can use arrows to select position of initial letter. But if he changing direction from `down` to `right` of inversely, then changing direction has hgher priority but can be done also only by arrows.

It would be confusing if user would not be able to see feedback. So in this step I added right panel with basic info about current position and direction.

![](http://localhost:8484/f8a96d73-7b56-4f79-bee0-bc1b4c49ef58.avif)

Because `Map` uses `Player` and `Player` uses `Map` I splited declarations from definitions of some methods in `Player`.

All changes are available here:

[direction possible to select · gustawdaniel/scrabble-cpp-game@e588a0c](https://github.com/gustawdaniel/scrabble-cpp-game/commit/e588a0c5feeed51cb325f347c849f2576241ddd4)

But the most important are these:

In `Map` there is function that gets letter for given position

```c++
    static char get_letter(int from_a) {
        return static_cast<char>(65 + from_a - 2);
    }
```

This function is used in other methods in `Map` that allows to print right panel with informations about user's name, position and direction of writing.

```c++
    static void showUserName(const Player *p) {
        mvprintw(0, size + 5, "Name: %s", p->name.c_str());
        mvprintw(p->pos.y, p->pos.x, "");
    }

    static void showUserPosition(const Player *p) {
        const char x[] = {get_letter(p->pos.x)};
        mvprintw(1, size + 5, "Pos : %s%d ", x, p->pos.y);
        mvprintw(p->pos.y, p->pos.x, "");
    }

    static void showUserDirection(const Player *p) {
        mvprintw(2, size + 5, "Dir : %s ", p->direction == 'R' ? "Right" : "Down");
        mvprintw(p->pos.y, p->pos.x, "");
    }
```

Init function in `Player` is moved out of `Player` struct definition and uses `Map` functions mentioned above to display right panel.

```c++
void Player::init() {
    pos.x = 2 + 7;
    pos.y = 1 + 7;
    mvprintw(pos.y, pos.x, "");
    Map::showUserName(this);
    Map::showUserPosition(this);
    Map::showUserDirection(this);
}
```

Finally in `setPosition` we handling change of direction and updating position and direction after any change.

```c++
void Player::setPosition() {
    while (int c = getch()) {
        switch (c) {
            case KEY_LEFT: {
                pos.x--;
                break;
            }
            case KEY_RIGHT: {
                if (direction == 'R') {
                    pos.x++;
                } else {
                    direction = 'R';
                }
                break;
            }
            case KEY_UP: {
                pos.y--;
                break;
            }
            case KEY_DOWN: {
                if (direction == 'D') {
                    pos.y++;
                } else {
                    direction = 'D';
                }
                break;
            }
            default: {
            }
        }
        Map::showUserPosition(this);
        Map::showUserDirection(this);
        mvprintw(pos.y, pos.x, "");
    }
}
```

Player has constructor with name and `Right` direction as default

```c++
struct Player {
public:
    std::string name;
    Pos pos{};
    char direction = 'R';

    explicit Player(std::string init_name) {
        name = std::move(init_name);
    }

    void init();

    void setPosition();
};
```

Game now create new Player with name.

```
struct Game {
    static void init() {
        Map::init();

        auto *p1 = new Player("Player 1");
        p1->init();

        p1->setPosition();
    }

    static int end() {
        getch();
        endwin();
        return 0;
    }
};
```

Our next challenge will be writing words.

## Writing words

To write words we have to split game on phases. First phase was selection of position and direction. Second will be writing words, last one will be checking answers and changing player. Now we will focus on "writing words" phase. Because of positioning can be done only by arrows it is enough to write one letter to change phase to writing. Confirmation will be done by `Enter`.

To write words user have to possess set of letters. So before writing words we will implement also letters assignment.

We can't select them randomly with equal probability for any letters. Instead we will use probabilities assigned to language. In our example it will be english. Rules are described here:

[Scrabble letter distributions - Wikipedia](https://en.wikipedia.org/wiki/Scrabble_letter_distributions#English)

To support random number we adding

```
#include <ctime>
```

that allows to set seed basing on time.

Set with letters can be represented by struct `LettersSet`

```
struct LettersSet {
    int size = 100;

    char letters[100] = {
            'k',
            'j',
            'x',
            'q',
            'z',
            'b', 'b',
            'c', 'c',
            'm', 'm',
            'p', 'p',
            'f', 'f',
            'h', 'h',
            'v', 'v',
            'w', 'w',
            'y', 'y',
            'g', 'g', 'g',
            'l', 'l', 'l', 'l',
            's', 's', 's', 's',
            'u', 'u', 'u', 'u',
            'd', 'd', 'd', 'd',
            'n', 'n', 'n', 'n', 'n', 'n',
            'r', 'r', 'r', 'r', 'r', 'r',
            't', 't', 't', 't', 't', 't',
            'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o',
            'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a',
            'i', 'i', 'i', 'i', 'i', 'i', 'i', 'i', 'i',
            'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e',
            '_', '_'
    };

    char getRandomLetter() {
        if(!size) return '#';
        int index = rand() % size;
        char c = letters[index];

        for(int i=index; i<size; i++)
            letters[i] = letters[i + 1];

        size--;

        return c;
    }
};
```

Here is applied technique of removing element by move of elements and decrement of integer with size. Real size of array with letters is constant and memory is not freed when we selecting letter. We applying convention when no available letters are marked by `#`.

So now any user has his own letters

```
    char letters[8];
```

and `LettersSet` is passed to `init` function on `Player`.

```
    void init(LettersSet *ls);
```

Our `Map` structure can be extended and gain two additional functions

```
    static void showUserLetters(const Player *p) {
        mvprintw(3, size + 5, "Lett: %s ", p->letters);
        mvprintw(p->pos.y, p->pos.x, "");
    }

    static void showLeftLetters(const Player *p, const LettersSet *ls) {
        mvprintw(4, size + 5, "Left: %d   ", ls->size);
        mvprintw(p->pos.y, p->pos.x, "");
    }
```

that can be used in `Player::init`

```
void Player::init(LettersSet *ls) {
    pos.x = 2 + 7;
    pos.y = 1 + 7;
    for (char &letter: letters) {
        letter = ls->getRandomLetter();
    }
    mvprintw(pos.y, pos.x, "");
    Map::showUserName(this);
    Map::showUserPosition(this);
    Map::showUserDirection(this);
    Map::showUserLetters(this);
    Map::showLeftLetters(this, ls);
}
```

From now we have info about available letters on the right on panel.

To write letters we can add

```
if(c >= 97 && c <= 122) {
            mvprintw(pos.y, pos.x, "%c", c);
            if(direction == 'R') {
                pos.x++;
            } else {
                pos.y++;
            }
        }
```

to `Player::setPosition`. Numbers 97 and 122 are bounds of small letters alphabed i ASCI.

To use random generator correctly we have to add `srand`, for example in `Game::init`.

```
    static void init() {
        srand(time(nullptr));

        auto *ls = new LettersSet();

        Map::init();

        auto *p1 = new Player("Player 1");
        p1->init(ls);

        p1->setPosition();
    }
```

details in commit:

[letters selection and basic writing · gustawdaniel/scrabble-cpp-game@23cf4b2](https://github.com/gustawdaniel/scrabble-cpp-game/commit/23cf4b2fd8ae84e6d01bb71e805ed21edc656513)

Now you can write words on board, but they do not use sets generated for users.

![](http://localhost:8484/c61247a0-c91f-4451-b6e4-785f27ca8844.avif)

It is time to join these elements. So now we want to:

* allow for writing only by letters in users sets
* remove letters from sets after usage

in `Player` we can add size of letters array. Thanks to this we will be able remove letters from array (without acutal changing array length).

```
    int lettersSize = 8;
```

our function to show letters can be improved and print letters one by one.

```
    static void showUserLetters(const Player *p) {
        mvprintw(3, size + 5, "Lett: ");
        for (int i = 0; i < 8; i++) {
            mvprintw(3, size + 5 + 6 + i, "%c ", i < p->lettersSize ? p->letters[i] : ' ');
        }
        mvprintw(p->pos.y, p->pos.x, "");
    }
```

We need function that will check if letter can be used. It will return index of this letter in players `letters` array or `-1` if letter is unavailable.

```
int indexOf(const char *arr, int len, char target) {
    int dashIndex = -1;
    for (int i = 0; i < len; i++) {
        if (arr[i] == target)
            return i;
        if(arr[i] == '_')
            dashIndex = i;
    }
    if(dashIndex != -1)
        return dashIndex;
    return -1;
}
```

special feature of this function in treating `_` as any other characted but only if all other options was checked before.

Improved version of typing can be written as

```
if (c >= 97 && c <= 122) {
            int charPos = indexOf(letters, lettersSize, (char) c);
            if (charPos != -1) {
                mvprintw(pos.y, pos.x, "%c", c);
                if (direction == 'R') {
                    pos.x++;
                } else {
                    pos.y++;
                }
                for (int i = charPos; i < lettersSize; i++)
                    letters[i] = letters[i + 1];

                lettersSize--;
            }
        }
```

So here we writing only if user posses selected letter or potentially `_`. We also removing this letter from his set.

In `setPosition` function we can add update of available letters list after any typed character.

```
        Map::showUserLetters(this);
```

[writing with letters belonging to user · gustawdaniel/scrabble-cpp-game@f3bc561](https://github.com/gustawdaniel/scrabble-cpp-game/commit/f3bc5616d10e56dc3a281059b5bc1a2e8c263269)

After some small cleanup in commits:

[added two players handling · gustawdaniel/scrabble-cpp-game@9b6d5fe](https://github.com/gustawdaniel/scrabble-cpp-game/commit/9b6d5fe9263a1ad95352a4cae1770e4d2343e466)

and

[adding letters from set after turn · gustawdaniel/scrabble-cpp-game@803648f](https://github.com/gustawdaniel/scrabble-cpp-game/commit/803648fcbcb8c23741358d3196008f720ff0ab3d)

it is time to check if our words are correct.

## Words checking

But there are two problems:

* where is our source of true, are we going to download dictonary or use http to check answer
* where words starts and ends

Not counting first word, any other will have some letters from other words, so we have to detect bounds of words and move cursor if we meet other letters on our road. Additionally we should ensure that written letters are not mutable.

## Words erasing

## Player change

## Points multipliers

## Win/loose conditions
