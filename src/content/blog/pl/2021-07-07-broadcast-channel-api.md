---
author: Daniel Gustaw
canonicalName: broadcast-channel-api
coverImage: http://localhost:8484/8b3fb584-7d88-42e4-b053-b66de5ddfd09.avif
updateDate: 2021-07-23 09:22:25+00:00
description: Wpis pokazuje jak używać Broadcast Channel API do przesyłania danych
  między kartami lub oknami przeglądarki bez wykorzystania serwera i socketów.
excerpt: Wpis pokazuje jak używać Broadcast Channel API do przesyłania danych między
  kartami lub oknami przeglądarki bez wykorzystania serwera i socketów.
publishDate: 2021-07-07 11:08:19+00:00
slug: pl/broadcast-channel-api
tags:
- web-api
- broadcast
- channel
title: Broadcast Channel API
---



Nauczymy się jak używać `Broadcast Channel API` do przesyłania danych między kartami lub oknami przeglądarki bez wykorzystania serwera i socketów.

## Parcel Bundler - intuicyjny i prosty builder

Jak zwykle prezentujemy kod od początku do końca. Zaczniemy od instalacji parcela - najprostszego bundler w świecie JS działającego out of the box w przeciwieństwie do webpacka, którego konfiguracja jest po prostu nudna. Parcela instalujemy komendą:

```
npm install -g parcel-bundler
```

Tworzymy pliki `html` i `ts` poleceniami:

```
echo '<html><body><script src="./index.ts"></script></body></html>' > index.html
touch index.ts
```

I włączamy nasz serwer

```
parcel index.html
```

## Podstawy działania Broadcast Channel API

Pokażemy teraz jak w konsoli przeglądarki zobaczyć najprostsze działanie Broadcast Channel Api. W pliku `index.ts` inicjalizujemy kanał.

```
const bc = new BroadcastChannel('channel');
```

Następnie przypiszemy naszej karcie w przeglądarce losowe ID

```
const id = Math.random();
```

Oraz zapiszemy w pamięci liczniki wiadomości wysłanych i odebranych

```
let send = 0, received = 0;
```

Jako wiadomość powitalną wyświetlimy id wybrane dla naszej karty

```
console.log("START", id);
```

Następnie ustawiamy nasłuch na wiadomości

```
bc.onmessage = (e) => {
    console.log(e.data, send, received);
    received++;
}
```

Podnosimy w nim licznik wiadomości odebranych oraz pokazujemy przysłane dane oraz wartości liczników w danej karcie.

Teraz czas na wysyłanie wiadomości do kanału. Służą do tego funkcje `postMessage`.

Chwilę po włączeniu karty chcemy wysłać wiadomość powitalną do innych kart

```
setTimeout(() => {
    bc.postMessage({title: `Connection from ${id}`})
}, 250)
```

Timeout pozwala poczekać na to, żeby inne karty się przeładowały. Gdyby nie on, to na kartach które nie są gotowe kiedy ta wiadomość jest wysyłana nie zobaczyli byśmy console loga.

Następnie chcemy wysłać jeszcze dwie wiadomości, które przestawią nam liczniki wysłań

```
const i = setInterval(() => {
    const uptime = performance.now();
    bc.postMessage({id, uptime, send, received})
    send++;
    if (uptime > 1e3) clearInterval(i)
}, 500)
```

Przy okazji użyliśmy tu innego API - performance:

[Performance - Web APIs | MDN](https://developer.mozilla.org/mdn-social-share.0ca9dbda.png)](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

Dla dwóch kart w możemy zobaczyć, że w każdej karcie widać jej odrębny identyfikator i wiadomości wysłane z przeciwnej karty.

![](http://localhost:8484/460465c8-3065-49e4-9856-b06dbd448dcd.avif)

Nic nie stoi na przeszkodzie, żebyśmy włączyli cztery karty na raz. Wtedy wiadomości od trzech pozostałych w każdej z nich będą się wzajemnie przeplatać.

![](http://localhost:8484/7d5446fd-3412-4adb-aaa2-ee9f4493f039.avif)

Możemy wrócić do dwóch kart i odświeżyć kilka razy tą z prawej strony. W wyniku takiego działania ta po lewej dostanie kilkukrotnie nowe powiadomienia, a na tej prawej nie będzie widać nic poza jej własnym przedstawieniem się ponieważ lewa karta zakończyła już nadawanie wiadomości. Konkretny wynik odświeżania prawej karty przedstawia screenshot:

![](http://localhost:8484/b0784926-0177-48cb-9841-b51e8bc24203.avif)

Widzimy tu, że wiadomości pochodzą od różnych ID, bo karta po prawej zmienia ID przy każdym odświeżeniu.

Kolejny eksperyment to sprawdzenie czy Broad Cast Channel działa między różnymi przeglądarkami:

![](http://localhost:8484/a391acb2-05de-4311-ab57-d5cb2b76007f.avif)

Okazało się, że nie. Ma to sens, bo jeśli miało by działać między przeglądarkami, to musiała by istnieć komunikacja między procesami utrzymującymi przeglądarki.

## Zasada Same Origin

Broadcast Channel ma zasięg działania w dla wszystkich kart, przeglądarek, iframes w ramach tego samego Origin czyli schematu (protokołu), hosta i portu.

Więcej o samym Origin możemy przeczytać w słowniku Mozilla Developers

[Origin - MDN Web Docs Glossary: Definitions of Web-related terms](https://developer.mozilla.org/en-US/docs/Glossary/Origin)

Sprawdzimy czy dla różnych komputerów też będzie działał poprawnie. W tym celu musimy zmienić ustawienia parcela, bo obecnie wystawia on nasz serwis na localhost

![](http://localhost:8484/f181a0be-8a4c-460e-8b88-af06434063a3.avif)

Nasz obecny adres IP możemy sprawdzić poleceniem

```
ip route
```

![](http://localhost:8484/3dc7b0ef-fae0-45df-9f23-179df34c5106.avif)

Z dokumentacji możemy wyczytać, że wystarczy dodanie flagi `--host`

[Parcel CLI](https://parceljs.org/cli.html)

```
parce index.html --host 192.168.2.162
```

![](http://localhost:8484/ea9494ab-6361-42e8-a9c8-88e8e2a3646d.avif)

Okazało się, że komunikacja nie jest przesyłana między różnymi komputerami.

Jest to zgodne z intuicją. O ile w przypadku Web Socketów istnieje jakiś serwer do utrzymywania (czy nawet WebRCT do samego nawiązywania) połączenia, to tutaj jedyną warstwą transportu danych jest pamięć operacyjna komputera na którym używany jest Broadcast Channel.

## Broadcast Channel API a Shared Workers, Message Channel i post Message

Być może zastanawiasz się jaka jest różnica między omawianym API a innymi metodami komunikacji między kontekstami jak:

* Shared Workers
* Message Channel
* window.postMessage()

W przypadku SharedWorkers możesz zrobić to samo co za pomocą BroadcastChannel ale wymaga to większej ilości kodu. Zalecam używanie SharedWorkers do bardziej zaawansowanych zdań jak zarządzanie blokadami, współdzielenie stanu, synchronizacja zasobów czy dzielenie połączenia WebSocket między kartami.

Natomiast Broadcast Channel Api jest wygodniejsze w prostych przypadkach, kiedy chcemy wysłać wiadomość do wszystkich okien, zakładek lub workerów.

Co do MessageChannel API to główna różnica polega na tym, że w MessageChannel API wysyła się wiadomość do jednego odbiorcy, podczas gdy w Broadcast Channel wysyłający jest jeden, a odbiorcami są zawsze wszystkie pozostałe konteksty.

W window.postMessage wymagane jest z kolei utrzymywanie referencji do obiektu iframe lub workera, żeby nadawać komunikację, na przykład:

```
const popup = window.open('https://another-origin.com', ...);
popup.postMessage('Sup popup!', 'https://another-origin.com');
```

Z drugiej strony trzeba też pilnować, żeby przy odbieraniu sprawdzić źródło wiadomości ze względów bezpieczeństwa:

```
const iframe = document.querySelector('iframe');
iframe.contentWindow.onmessage = function(e) {
  if (e.origin !== 'https://expected-origin.com') {
    return;
  }
  e.source.postMessage('Ack!', e.origin);
};
```

Pod tym względem Broadcast Channel jest bardziej ograniczony, bo nie pozwala na komunikację między różnymi Origin, ale zapewnia to domyślnie wyższe bezpieczeństwo. Z drugiej strony window.postMessage nie pozwalał na wysyłkę do innych okien bo nie można do nich było złapać referencji.

## Rysowanie na Canvas w niezależnych kartach

Czas na praktyczny przykład. No może nie super użyteczny, ale za to dobrze prezentujący możliwości Broadcast Channel API.

Zaprogramujemy aplikację pozwalającą na przenoszenie rysowanych kształtów na płótnie między kartami przeglądarki.

Zaczniemy od zwykłego rysowania myszką na canvas. W tym celu zmienimy nasz kod `index.html` dodając do niego płótno i niezbędne style

```
<html lang="en">
<body style="margin:0;">
<canvas id="canvas" style="width: 100vw; height: 100vh;"></canvas>
<script src="./index.ts"></script>
</body>
</html>
```

W skrypcie `index.ts` wpisujemy

```
interface Window {
    canvas?: HTMLCanvasElement;
}
```

Pozwoli nam to na trzymanie canvasu w oknie. Aby nie wyszukiwać go wiele razy możemy użyć `window` jako cache w którym będziemy go trzymać po pierwszym znalezieniu.

```
const getCanvasAndCtx = (): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } => {
    const canvas = window.canvas || document.querySelector('#canvas');
    if (canvas instanceof HTMLCanvasElement) {
        window.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            return {canvas, ctx}
        } else {
            throw new Error('Canvas do not have context');
        }
    }
    throw new Error('Canvas Not found');
}
```

W celu dostrojenia wielkości canvasu deklarujemy funkcję `syncCanvasSize`

```
const syncCanvasSize = () => {
    const { canvas } = getCanvasAndCtx()
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}
```

Wykonamy ją przy każdym evencie `resize` na `window` oraz po załadowaniu strony

```
window.addEventListener('resize', syncCanvasSize)

window.addEventListener('DOMContentLoaded', () => {
    syncCanvasSize();
    const {canvas, ctx} = getCanvasAndCtx()
```

Definiujemy kilka parametrów do określania stanu i historii kursora.

```
    let flag = false,
        prevX = 0,
        currX = 0,
        prevY = 0,
        currY = 0;
```

Następnie definiujemy funkcje `drawLine` rysującą linię oraz `drawDot` rysującą kropkę

```
    function drawLine() {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    function drawDot() {
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.fillRect(currX, currY, 2, 2);
        ctx.closePath();
    }
```

Oraz najważniejszą funkcję `findPosition` - sterującą logiką rysowania

```
    function findPosition(res: EventType, e: { clientX: number, clientY: number }) {
        if (res == EventType.down) {
            prevX = currX;
            prevY = currY;
            currX = e.clientX;
            currY = e.clientY;
            flag = true;
            drawDot()
        }
        if ([EventType.up, EventType.out].includes(res)) {
            flag = false;
        }
        if (res == EventType.move) {
            if (flag) {
                prevX = currX;
                prevY = currY;
                currX = e.clientX;
                currY = e.clientY;
                drawLine();
            }
        }
    }
```

Na końcu dodajemy nasłuch na wydarzenia powiązane z myszą aby używać funkcji `findPosition`

```
    canvas.addEventListener("mousemove", (e) => {
        findPosition(EventType.move, e)
    });
    canvas.addEventListener("mousedown", (e) => {
        findPosition(EventType.down, e)
    });
    canvas.addEventListener("mouseup", (e) => {
        findPosition(EventType.up, e)
    });
    canvas.addEventListener("mouseout", (e) => {
        findPosition(EventType.out, e)
    });

})
```

Powyższy kod pozwala nam to na rysowanie na canvasie w ramach pojedynczej karty. Żeby było możliwe przenoszenie obrazu między kartami wykorzystamy Broadcast Channel.

Wymagana będzie jego inicjalizacja:

```
const bc = new BroadcastChannel('channel');
```

Dodanie nasłuchu na polecenie `findPosition`.

```
bc.onmessage = (e) => {
	if(e.data.cmd === 'findPosition') {
		findPosition(e.data.args[0], e.data.args[1], false)
	}
}
```

Do samej funkcji `findPosition` dodaliśmy trzeci argument - `propagate` mówiący czy wywołanie tej funkcji ma powodować wysłanie wiadomości do kanału. Wartość `false` pozwala unikną nieskończonego zagnieżdżenia.

Na końcu zmieniamy sygnaturę samej funkcji `findPosition` tak jak to opisaliśmy i dodajemy fragment kodu odpowiedzialny za wysyłkę wiadomości do innych kart

```
function findPosition(res: EventType, e: {clientX: number, clientY: number}, propagate: boolean) {

    if(propagate) {
        bc.postMessage({cmd: 'findPosition', args: [res, {clientX: e.clientX, clientY: e.clientY}]})
        }
```

Warto zauważyć, że nie przekazujemy tu pełnych obiektów `event` a jedynie współrzędne. Jest to nie tylko optymalizacja. Klonowanie takich obiektów jak Event nie jest możliwe między kontekstami.

Cały kod zawarty w `index.ts` prezentuję poniżej:

```
interface Window {
    canvas?: HTMLCanvasElement;
}

const getCanvasAndCtx = (): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } => {
    const canvas = window.canvas || document.querySelector('#canvas');
    if (canvas instanceof HTMLCanvasElement) {
        window.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            return {canvas, ctx}
        } else {
            throw new Error('Canvas do not have context');
        }
    }
    throw new Error('Canvas Not found');
}

const syncCanvasSize = () => {
    const {canvas} = getCanvasAndCtx()
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}

window.addEventListener('resize', syncCanvasSize)

enum EventType {
    down,
    up,
    move,
    out
}

window.addEventListener('DOMContentLoaded', () => {
    syncCanvasSize();
    const {canvas, ctx} = getCanvasAndCtx()

    let flag = false,
        prevX = 0,
        currX = 0,
        prevY = 0,
        currY = 0;

    const bc = new BroadcastChannel('channel');

    function drawLine() {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    function drawDot() {
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.fillRect(currX, currY, 2, 2);
        ctx.closePath();
    }

    function findPosition(res: EventType, e: { clientX: number, clientY: number }, propagate: boolean) {

        if (propagate) {
            bc.postMessage({cmd: 'findPosition', args: [res, {clientX: e.clientX, clientY: e.clientY}]})
        }

        if (res == EventType.down) {
            prevX = currX;
            prevY = currY;
            currX = e.clientX;
            currY = e.clientY;
            flag = true;
            drawDot()
        }
        if ([EventType.up, EventType.out].includes(res)) {
            flag = false;
        }
        if (res == EventType.move) {
            if (flag) {
                prevX = currX;
                prevY = currY;
                currX = e.clientX;
                currY = e.clientY;
                drawLine();
            }
        }
    }

    canvas.addEventListener("mousemove", (e) => {
        findPosition(EventType.move, e, true)
    });
    canvas.addEventListener("mousedown", (e) => {
        findPosition(EventType.down, e, true)
    });
    canvas.addEventListener("mouseup", (e) => {
        findPosition(EventType.up, e, true)
    });
    canvas.addEventListener("mouseout", (e) => {
        findPosition(EventType.out, e, true)
    });

    bc.onmessage = (e) => {
        if (e.data.cmd === 'findPosition') {
            findPosition(e.data.args[0], e.data.args[1], false)
        }
    }

})
```

Aplikacja działa tak, że obraz rysowany w jednej karcie pojawia się we wszystkich pozostałych:

## Zastosowania Broadcast Channel API

Przykładowa aplikacja pokazuje, że broadcast channel może być stosowany w bardzo wygodny sposób. Zapewnienie synchronizacji między kartami zostało wprowadzone przez dodanie 9 linii kodu z czego 3 to domknięcia nawiasów klamrowych.

Jego przykładowe zastosowania to:

* Wykrywanie akcji użytkownika w innych zakładkach
* Sprawdzanie kiedy użytkownik zalogował się na swoje konto w innej zakładce lub oknie
* Zlecenie Workerom wykonania jakichś zadań w tle
* Rozsyłanie zdjęć załadowanych przez użytkownika w innych kartach

Jeśli potrzebujemy komunikacji między komputerami to Broadcast Channel API nam nie pomoże i wtedy do komunikacji w czasie rzeczywistym należy użyć WebSockets lub WebRTC.

Polecane materiały oraz dokumentacja:

[Broadcast Channel API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)

[BroadcastChannel API: A Message Bus for the Web | Google Developers](https://developers.google.com/web/updates/2016/09/broadcastchannel)
