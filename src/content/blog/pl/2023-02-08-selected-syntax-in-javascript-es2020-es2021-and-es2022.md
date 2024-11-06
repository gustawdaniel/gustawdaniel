---
author: Daniel Gustaw
canonicalName: selected-syntax-in-javascript-es2020-es2021-and-es2022
coverImage: http://localhost:8484/dc12881c-1152-4886-bd6b-32ec7961740c.avif
description: Nullish coalescing, Opcjonalne łańcuchowanie, Proxies, Pola prywatne, allSettled, BigInt, Dynamiczny import, replaceAll, Separatorzy numeryczni, matchAll, Przypisanie logiczne, Await na najwyższym poziomie
excerpt: Nullish coalescing, Opcjonalne łańcuchowanie, Proxies, Pola prywatne, allSettled, BigInt, Dynamiczny import, replaceAll, Separatorzy numeryczni, matchAll, Przypisanie logiczne, Await na najwyższym poziomie
publishDate: 2023-02-08 16:39:54+00:00
slug: pl/skladnia-w-javascript
tags:
- javascript
- es6
title: Wybrane składnie w JavaScript ES2020, ES2021 i ES2022
updateDate: 2023-02-08 16:39:54+00:00
---

JavaScript jest głównym językiem programowania. Jednak jego dynamiczny rozwój wymusza na mnie ciągłe aktualizowanie mojej wiedzy na jego temat. W tym artykule pokażę kilka składni, które nauczyłem się w ciągu ostatnich dwóch lat i które nie były dostępne, jeśli nauczyłeś się JavaScriptu wcześniej.

Możliwe, że niektóre z nich są ci znane, ale mam nadzieję, że niektóre z nich rozszerzą twoje umiejętności w składni JS. Aby zaoszczędzić twój czas, dodaję spis treści:

* ES2020 - Nullish coalescing
* ES2020 - Optional chaining
* ES2015 - Proxies
* ES2022 - Private fields
* ES2020 - Promise.allSettled
* ES2020 - BigInt
* ES2020 - Dynamic Import
* ES2022 - String.replaceAll
* ES2020 - Numeric Separators
* ES2020 - String.matchAll
* ES2021 - Logical Assignment
* ES2020 - Promise.any
* ES2022 - Array.prototype.at
* ES2022 - Top level await

![](http://localhost:8484/98e9fea6-990b-4122-bf8d-534cd0124cf5.avif)

## Operator koalescencji nulli ?? \[ bardziej ścisły || \]

Operator koalescencji nulli (`??`) w JavaScript ES2020 jest operatorem logicznym, który zwraca operand po prawej stronie, gdy operand po lewej stronie jest `null` lub `undefined`, a w przeciwnym razie zwraca operand po lewej stronie.

Oto przykład, jak operator koalescencji nulli może być używany w JavaScript

```javascript
let name = userName ?? 'default';
```

W tym przykładzie, jeśli `userName` jest `null` lub `undefined`, wartość `name` będzie ustawiona na `'default'`. Jeśli `userName` ma wartość prawdziwą, wartość `name` zostanie ustawiona na tę wartość.

Operator koalescencji nulli różni się od wcześniej zastosowanych technik, takich jak operator OR logiczny (`||`), w tym, że operator OR logiczny zwraca operand po prawej stronie, gdy operand po lewej stronie jest fałszywy, co obejmuje nie tylko `null` i `undefined`, ale także wartości takie jak `0`, `''` i `false`.

Oto przykład, który ilustruje różnicę między operatorem koalescencji nulli a operatorem OR logicznym:

```javascript
let name = userName ?? 'default'; // using the nullish coalescing operator
let name = userName || 'default'; // using the logical OR operator
```

W pierwszym przykładzie, jeśli `userName` jest `null` lub `undefined`, wartość `name` zostanie ustawiona na `'default'`. W drugim przykładzie, jeśli `userName` jest fałszywy, wartość `name` również zostanie ustawiona na `'default'`.

Podsumowując, operator łączenia nulli jest bardziej surowym i specyficznym sposobem obsługi wartości domyślnych w JavaScript w porównaniu do operatora logicznego OR.

![](http://localhost:8484/0cd67446-74e2-4230-ad86-43ac76a47b6c.avif)

## Opcjonalne łańcuchowanie .? \[ mniej surowy dostęp do właściwości \]

Opcjonalne łańcuchowanie w JavaScript to funkcja wprowadzona w ECMAScript 2020, która pozwala na bezpieczny dostęp do właściwości obiektu, elementu tablicy lub wartości zwracanej przez funkcję oraz unikanie `TypeError` w przypadku dostępu do niezdefiniowanego obiektu lub wartości null. Jest zapisywane za pomocą składni `?.` i może być używane do uzyskiwania dostępu do zagnieżdżonych właściwości obiektu.

Na przykład, rozważ następujący kod, który wykorzystuje opcjonalne łańcuchowanie:

```javascript
let obj = {
  prop1: {
    prop2: {
      prop3: 'value'
    }
  }
};

let value = obj?.prop1?.prop2?.prop3;
console.log(value); // Output: "value"
```

Przed wprowadzeniem opcjonalnego łańcuchowania, powszechnym podejściem do unikania błędu `TypeError` było użycie operatora `&&` oraz sprawdzenie wartości `null` i `undefined`:

```javascript
let obj = {
  prop1: {
    prop2: {
      prop3: 'value'
    }
  }
};

let value = obj && obj.prop1 && obj.prop1.prop2 && obj.prop1.prop2.prop3;
console.log(value); // Output: "value"
```

Główna różnica między opcjonalnym łańcuchowaniem a tym podejściem polega na tym, że opcjonalne łańcuchowanie jest bardziej zwięzłe, czytelne i ekspresyjne. Jest również mniej podatne na błędy, ponieważ eliminuje potrzebę ręcznego sprawdzania wartości `null` i `undefined` na każdym kroku.

## Proksy \[ do metaprogramowania, jak refleksja \]

Proksy w JavaScript to obiekt, który działa jako pośrednik między docelowym obiektem a kodem, który z nim współdziała. Proksy są używane do przechwytywania i modyfikowania operacji wykonywanych na docelowym obiekcie, takich jak dostęp do właściwości, wywołania metod i przypisania obiektów. Czyni to je potężnym narzędziem do dodawania niestandardowego zachowania do istniejących obiektów, egzekwowania ograniczeń i tworzenia abstrakcji.

Przykładem użycia proksy jest dodanie mechanizmu logowania do obiektu, aby śledzić, kiedy jego właściwości są dostępne. Oto przykład, jak można to zrobić za pomocą proksy:

```javascript
let target = { name: 'John Doe' };

let handler = {
  get: function(target, prop) {
    console.log(`Accessing property ${prop}`);
    return target[prop];
  }
};

let proxy = new Proxy(target, handler);

console.log(proxy.name); // Output: Accessing property name
//                           John Doe
```

W tym przykładzie definiujemy obiekt docelowy oraz obiekt handlera. Obiekt handlera zawiera metodę `get`, która loguje wiadomość i zwraca wartość właściwości obiektu docelowego. Na koniec tworzymy nowy obiekt proxy, przekazując obiekt docelowy i handler do konstruktora `Proxy`. Gdy uzyskujemy dostęp do właściwości `name` obiektu proxy, wywoływana jest metoda `get` handlera, która loguje wiadomość i zwraca wartość właściwości obiektu docelowego.

To jest przykład refleksji - funkcji, która pozwala programowi na inspekcję i manipulację swoją własną strukturą i zachowaniem w czasie wykonywania. Obejmuje to introspekcję obiektów, klas i metod, a także modyfikację ich właściwości i zachowania.

W naszym przykładzie jest `console.log`, ale możesz użyć dowolnej logiki w pułapkach get lub set. Na przykład powiadamianie innych części programu o zmianie lub rejestrowanie historii zmian. Proxy jest szeroko używane w implementacji reaktywności w frameworkach frontendowych, takich jak Vue.

Jest 13 pułapek w Proxy, które są opisane tutaj:

[Looking at All 13 JavaScript Proxy Traps | DigitalOcean](https://www.digitalocean.com/community/tutorials/js-proxy-traps)

Pokażę tylko 3 najpopularniejsze `get`, `set` i `has`. W poniższym przykładzie możemy zbudować handler, który pozwoli nam zbudować obiekty, które zapobiegają dostępowi do "prywatnych" właściwości.

```javascript
function invariant (key, action) {
  if (key[0] === '_') {
    throw new Error(`Invalid attempt to ${action} private "${key}" property`)
  }
}
var handler = {
  get (target, key) {
    invariant(key, 'get')
    return target[key]
  },
  set (target, key, value) {
    invariant(key, 'set')
    return true
  },
  has (target, key) {
    if (key[0] === '_') {
      return false
    }
    return key in target
  }
}
```

Proxysy zasługują na osobny artykuł, ale mam nadzieję, że poczujesz się zainspirowany, aby zgłębić je bardziej.

![](http://localhost:8484/d5ed1e3f-839f-45b5-8042-0aa0d73a2daa.avif)

## Prywatne pola \[ prywatność bez WeakMap i zamknięć \]

Prywatne pola w JavaScript to funkcja wprowadzona w ECMAScript 2020, która pozwala na definiowanie właściwości obiektu, które nie są dostępne z zewnątrz obiektu. Są one zapisywane za pomocą symbolu `#` przed nazwą właściwości i są dostępne tylko w metodach obiektu.

Prywatne człony nie były natywne dla tego języka przed wprowadzeniem tej składni. W dziedziczeniu prototypowym, ich zachowanie można emulować za pomocą obiektów [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap#emulating_private_members) lub [zamknięć](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures#emulating_private_methods_with_closures), ale nie mogą się one równać składni `#` pod względem ergonomii.

Oto przykład, jak prywatne pola mogą być używane w JavaScript:

```javascript
class Person {
  #name;

  constructor(name) {
    this.#name = name;
  }

  getName() {
    return this.#name;
  }
}

let person = new Person('John Doe');
console.log(person.getName()); // Output: "John Doe"
console.log(person.#name); // Output: SyntaxError: Private field '#name' must be accessed within the class declaration.
```

W tym przykładzie definiujemy klasę `Person` z prywatnym polem `#name`. Pole `#name` jest przypisywane w konstruktorze, a metoda `getName` jest zdefiniowana w celu zwrócenia jego wartości. Gdy próbujemy uzyskać dostęp do pola `#name` poza klasą `Person`, otrzymujemy `SyntaxError`, co oznacza, że prywatne pola muszą być dostępne w obrębie deklaracji klasy.

Prywatne pola zapewniają sposób kapsułkowania wewnętrznego stanu obiektu i zapobiegają jego modyfikacji lub bezpośredniemu dostępowi. Ułatwia to utrzymanie integralności danych obiektu i egzekwowanie jego wewnętrznych invariatów.

To świetnie, że ta funkcja została wprowadzona, ale myślę, że wciąż wydaje się być mało znana. Bardziej szczegółowe specyfikacje poniżej:

[Prywatne cechy klas - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields)

## Promise.allSettled() \[ dla programowania równoległego \]

Metoda `Promise.allSettled()` w JavaScript jest używana do stworzenia pojedynczej obietnicy, która rozwiązuje się, gdy wszystkie obietnice w iterable zostały zakończone (czy to spełnione, czy odrzucone). Zwraca tablicę obiektów, które reprezentują wynik każdej obietnicy, a nie pojedynczą wartość lub błąd.

Oto przykład, jak `Promise.allSettled()` może być używane w JavaScript:

```javascript
let p1 = Promise.resolve(42);
let p2 = Promise.reject(new Error('failed'));
let p3 = Promise.resolve(10);

Promise.allSettled([p1, p2, p3]).then((results) => {
  console.log(results);
  /* Output:
  [
    { status: 'fulfilled', value: 42 },
    { status: 'rejected', reason: Error: failed },
    { status: 'fulfilled', value: 10 }
  ]
  */
});
```

W tym przykładzie tworzymy trzy obietnice: `p1`, `p2` i `p3`. `p1` to zrealizowana obietnica z wartością 42, `p2` to odrzucona obietnica z komunikatem o błędzie, a `p3` to zrealizowana obietnica z wartością 10. Następnie przekazujemy te obietnice jako iterable do `Promise.allSettled()` i rejestrujemy wyniki, gdy wszystkie się zakończą. Wynik to tablica obiektów, które przedstawiają wynik każdej obietnicy, z właściwością `status`, która wskazuje, czy obietnica została zrealizowana, czy odrzucona, oraz właściwościami `value` lub `reason`, które zawierają wynik lub błąd.

Metoda `Promise.allSettled()` jest przydatna, gdy chcesz poczekać na zakończenie wielu obietnic, ale nie musisz znać wyniku każdej obietnicy, aby kontynuować. W przeciwieństwie do `Promise.all()`, która odrzuca z pierwszym błędem, który wystąpi, `Promise.allSettled()` będzie czekać, aż wszystkie obietnice się zakończą, zanim zostanie rozwiązana, nawet jeśli niektóre z nich zostały odrzucone.

[Promise.allSettled() - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

![](http://localhost:8484/9ec41cb4-0b3c-4f77-9906-74048d4e67ed.avif)

## BigInt \[ dla matematyki i ogromnych identyfikatorów z baz danych \]

BigInt to nowy typ prymitywny w JavaScript, który został wprowadzony w ECMAScript 2020. Reprezentuje on dowolnie dużą liczbę całkowitą i pozwala na wykonywanie operacji arytmetycznych z wartościami, które mogą być większe niż maksymalna bezpieczna wartość całkowita typu `Number`, która wynosi `2^53 - 1`.

Oto przykład, jak BigInt może być używany w JavaScript:

```javascript
const a = BigInt(9007199254740992);
const b = BigInt(1);
console.log(a + b); // Output: 9007199254740993n
```

W tym przykładzie tworzymy dwie wartości BigInt i wykonujemy operację dodawania na nich. Wynik to wartość BigInt, która dokładnie reprezentuje rezultat obliczenia, nawet jeśli przekracza maksymalną bezpieczną wartość całkowitą `Number`.

Dla porównania, dodając jeden do tak dużego `Number`, otrzymasz błędny wynik.

```javascript
console.log(9007199254740992 + 1); // 9007199254740992
```

Inna różnica polega na tym, że wartości BigInt obsługują bardziej ograniczony zestaw operacji arytmetycznych i porównawczych niż wartości `Number`. Na przykład wartości BigInt nie obsługują operacji takich jak dzielenie przez zero, NaN czy Infinity.

```javascript
BigInt(1) / BigInt(0); // Uncaught RangeError: Division by zero
```

i

```javascript
BigInt(1) / 0; // Uncaught TypeError: Cannot mix BigInt and other types, use explicit conversions
```

BigInt zapewnia sposób reprezentowania i manipulowania dużymi liczbami całkowitymi w JavaScript bez utraty dokładności, która może wystąpić z typem `Number`. Jest szczególnie przydatny w przypadkach, gdy musisz wykonywać obliczenia z wartościami, które przekraczają maksymalną bezpieczną wartość całkowitą `Number`.

[BigInt - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

![](http://localhost:8484/e6c62d94-225d-4f29-be1e-04a75c8c51c3.avif)

## Dynamiczne Importowanie

Dynamiczne Importowanie to funkcja w JavaScript, która pozwala na asynchroniczne ładowanie modułu lub kawałka kodu w czasie wykonywania, a nie w momencie analizy i wykonywania skryptu. Umożliwia to ładowanie tylko tych zasobów, których potrzebujesz, kiedy ich potrzebujesz, zamiast ładowania wszystkiego od razu, co może poprawić wydajność i czas ładowania Twojej aplikacji.

Oto przykład, jak Dynamiczne Importowanie może być użyte w JavaScript:

```javascript
// ? say.mjs
console.log("Now file is imported");

export function hi() {
  console.log(`Hello`);
}

export function bye() {
  console.log(`Bye`);
}

```

i

```javascript
async function main() {
  let {hi, bye} = await import('./say.mjs');

  hi();
  bye();
}

console.log("Import not executed yet");
main().catch(console.error);
```

Polecenie `node index.js` wydrukuje

```
Import not executed yet
Now file is imported
Hello
Bye
```

W tym przykładzie używamy funkcji `import()` do asynchronicznego ładowania modułu `module.js`. Funkcja `import()` zwraca obietnicę, która rozwiązuje się do obiektu modułu, do którego możemy uzyskać dostęp za pomocą destrukturyzacji lub właściwości domyślnej.

Dynamiczny import różni się od innych typów importu (takich jak instrukcje `import` i `require`) na kilka kluczowych sposobów:

* Czas ładowania: Dynamiczny import jest ładowany w czasie wykonywania, gdy wywoływana jest funkcja `import()`, a nie w momencie parsowania skryptu. Oznacza to, że moduł lub kod jest ładowany tylko wtedy, gdy jest rzeczywiście potrzebny, co może poprawić wydajność i czas ładowania aplikacji.
* Wartość zwracana: Dynamiczny import zwraca obietnicę, która rozwiązuje się do obiektu modułu, a nie do samego obiektu modułu. Umożliwia to asynchroniczne ładowanie modułu i obsługę wyniku, gdy będzie dostępny, zamiast blokować wykonywanie skryptu podczas ładowania modułu.
* Dzielnie kodu: Dynamiczny import umożliwia dzielenie kodu na mniejsze, bardziej zarządzalne kawałki, które można ładować na żądanie. Może to poprawić wydajność i skalowalność aplikacji, zmniejszając ilość kodu, który musi być załadowany i zanalizowany na początku skryptu.

Dynamiczny import zapewnia elastyczny i potężny sposób asynchronicznego ładowania kodu w JavaScript i jest szczególnie przydatny w dużych i złożonych aplikacjach, które potrzebują ładować zasoby na żądanie. Korzystając z dynamicznego importu, możesz zoptymalizować wydajność i czas ładowania aplikacji oraz poprawić ogólne doświadczenie użytkownika.

Możesz dowiedzieć się więcej, porównując dokumenty statycznego importu

[import - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)

Z dynamicznym importem opisanym tutaj

[import() - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)

Dzięki dynamicznym importom możesz zarządzać zarówno czasem importowania, jak i poprawkami do importowanego modułu w czasie wykonywania, co może być przydatne, na przykład, jeśli musisz załadować słownik z tłumaczeniami swojej strony internetowej lub wybrać jeden komponent zamiast wszystkich, aby wyświetlić pierwszą stronę.

## replaceAll \[ zwięzła składnia dla replace z //g \]

Metoda `String.prototype.replaceAll` w JavaScript jest niedawnym dodatkiem (część standardu ECMAScript 2022), który zapewnia prostszy sposób wykonywania globalnych operacji wyszukiwania i zastępowania na ciągach. W przeciwieństwie do poprzedniej metody używania `String.prototype.replace` z wyrażeniem regularnym i flagą `g` (globalną), `String.prototype.replaceAll` zapewnia prostszą składnię dla tego typowego przypadku użycia.

Na przykład, aby globalnie zastąpić wszystkie wystąpienia docelowego ciągu innym ciągiem, możesz użyć `replaceAll` w następujący sposób:

```javascript
const originalString = "Hello world! Hello again.";
const newString = originalString.replaceAll("Hello", "Goodbye");
console.log(newString); // Goodbye world! Goodbye again.
```

W porównaniu, użycie `replace` z wyrażeniem regularnym i flagą `g` wyglądałoby następująco:

```javascript
const originalString = "Hello world! Hello again.";
const newString = originalString.replace(/Hello/g, "Goodbye");
console.log(newString); // Goodbye world! Goodbye again.
```

Jak widać, `replaceAll` oferuje bardziej zwięzłą i czytelną składnię dla tego powszechnego przypadku użycia.

## Separatory numeryczne \[ cukier dla czytelności kodu \]

Separatory numeryczne w JavaScript to niedawno wprowadzona cecha (część standardu ECMAScript 2020), która pozwala programistom na ułatwienie odczytu dużych liczb poprzez dodawanie podkreśleń jako separatorów między grupami cyfr. Podkreślenia są ignorowane podczas oceny, ale służą jako pomoc wizualna do oddzielania cyfr.

Na przykład, zamiast pisać:

```javascript
const x = 1000000000;
```

Możesz pisać:

```javascript
const x = 1_000_000_000;
```

Ułatwia to dostrzeganie różnych grup cyfr, szczególnie w dużych liczbach. Separatory numeryczne mogą być używane z literami dziesiętnymi, jak również z literami binarnymi, ósemkowymi i szesnastkowymi.

Oto przykład użycia liter binarnych:

```javascript
const y = 0b1010_0101_1001_0010;
```

A oto przykład użycia literałów szesnastkowych:

```javascript
const z = 0xff_ff_ff;
```

Wszystkie przypadki numeryczne separatory są ignorowane podczas oceny, a wartości są przechowywane i używane jak każda inna liczba w JavaScript.

![](http://localhost:8484/080468b3-91ec-407d-b20e-5159e7e12f4c.avif)

## matchAll \[ dostęp do dopasowań dla wyrażenia regularnego //g \]

Metoda `String.prototype.matchAll()` w JavaScript jest niedawnym dodatkiem (część standardu ECMAScript 2020), który zapewnia nowy sposób na wyodrębnienie wszystkich dopasowań wyrażenia regularnego z ciągu znaków. W przeciwieństwie do wcześniejszej metody używania `String.prototype.match` z wyrażeniem regularnym, `String.prototype.matchAll` zwraca iterator, który generuje wszystkie dopasowania, a nie tylko pierwsze dopasowanie lub wszystkie dopasowania jako tablicę.

Na przykład, aby wyodrębnić wszystkie wystąpienia docelowego ciągu z tekstu, możesz użyć `matchAll` w następujący sposób:

```javascript
const originalString = "Hello world! Hello again.";
const regex = /Hello/g;
const matches = originalString.matchAll(regex);
```

teraz `matches` jest obiektem `RegExpStringIterator`.

![](http://localhost:8484/dc16049c-f1b7-4a89-8699-eddc3e83d19f.avif)

możemy uzyskać dostęp do pojedynczego meczu za pomocą `next`

```javascript
m = matches.next()
```

wtedy `m` będzie obiektem z wartością logiczną `done` oraz `value`, która zawiera szczegóły dotyczące meczu.

![](http://localhost:8484/5427fdde-d4fb-43d6-b8ac-b6d7f6e367f0.avif)

drugą opcją na uzyskanie dopasowań jest iteracja

```javascript
for (const match of matches) {
  console.log(match[0]);
}
// Hello
// Hello
```

lub

![](http://localhost:8484/5ff51c58-9603-4286-a4e0-eb02af715ced.avif)

W porównaniu, użycie `match` z wyrażeniem regularnym wyglądałoby tak:

```javascript
const originalString = "Hello world! Hello again.";
const regex = /Hello/g;
const matches = originalString.match(regex);
console.log(matches); // [ "Hello", "Hello" ]
```

więc `match` traci dostęp do indeksu, wejścia i grup, gdy był użyty z wyrażeniem regularnym `//g`.

Jak widać, matchAll zapewnia sposób na pracę z każdym dopasowaniem jeden po drugim, zamiast przetwarzać wszystkie dopasowania jako tablicę. Może to być przydatne w niektórych przypadkach, na przykład gdy musisz przeprowadzić dodatkowe przetwarzanie dla każdego dopasowania lub gdy musisz wyodrębnić informacje z przechwyconych grup w każdym dopasowaniu. Dodatkowo, ponieważ `matchAll` zwraca iterator, możesz używać go w pętli `for...of`, co może sprawić, że twój kod będzie bardziej czytelny i zwięzły.

## Przypisania logiczne \[ przypisanie warunkowe \]

Przypisania logiczne w JavaScript to nowa funkcja (część standardu ECMAScript 2021), która pozwala uprościć i skondensować pewne rodzaje przypisań, które obejmują operacje logiczne. Zapewnia skrót do łączenia przypisania z operacją logiczną, taką jak `&&` lub `||`.

Operatory przypisania logicznego to `&&=`, `||=` i `??=`. Wykonują te same operacje co odpowiadające im operatory logiczne, ale z dodatkowym zachowaniem przypisania.

```javascript
x &&= y
```

jest równoważne z

```
x && (x = y);
```

Oto przykład użycia operatora `&&=`:

```javascript
let x = 1;
x &&= 2;
console.log(x); // 2

x = 0;
x &&= 2;
console.log(x); // 0
```

W pierwszym przypadku `x` otrzymuje wartość `2`, ponieważ `1 && 2` to `2`. W drugim przypadku `x` otrzymuje wartość `0`, ponieważ `0 && 2` to `0`.

Oto przykład użycia operatora `||=`:

```javascript
let x = null;
x ||= 1;
console.log(x); // 1

x = 2;
x ||= 1;
console.log(x); // 2
```

W pierwszym przypadku `x` jest przypisywane wartość `1`, ponieważ `null || 1` to `1`. W drugim przypadku `x` jest przypisywane wartość `2`, ponieważ `2 || 1` to `2`.

A oto przykład użycia operatora `??=`:

```javascript
let x = null;
x ??= 1;
console.log(x); // 1

x = 2;
x ??= 1;
console.log(x); // 2
```

W pierwszym przypadku, x otrzymuje wartość 1, ponieważ null ?? 1 to 1. W drugim przypadku, x otrzymuje wartość 2, ponieważ 2 ?? 1 to 2. Operator ?? jest podobny do operatora ||, ale ocenia wyrażenie po prawej stronie tylko wtedy, gdy wyrażenie po lewej stronie jest null lub undefined.

![](http://localhost:8484/7fa48648-26df-4d5a-8137-72a13b00933a.avif)

## Promise.any() \[ dla wyścigów \]

Metoda `Promise.any()` w JavaScript to niedawno wprowadzona funkcja (część standardu ECMAScript 2020), która pozwala na oczekiwanie na pierwszą z kilku obietnic, która zakończy działanie (tj. zostanie rozwiązana lub odrzucona), a następnie zwróci wynik tej obietnicy. Umożliwia to czekanie na zakończenie wielu obietnic i zwrócenie pierwszej, która się powiedzie, bez konieczności oczekiwania na zakończenie wszystkich.

Oto przykład użycia `Promise.any()`

```javascript
const promise1 = Promise.resolve(1);
const promise2 = Promise.reject(new Error("error"));
const promise3 = Promise.resolve(3);

Promise.any([promise1, promise2, promise3])
  .then((value) => {
    console.log(value); // 1
  })
  .catch((error) => {
    console.error(error);
  });
```

W tym przykładzie metoda `Promise.any()` przyjmuje tablicę obietnic jako argument i zwraca nową obietnicę, która jest rozwiązywana z pierwszą rozwiązaną wartością od wejściowych obietnic. Jeśli wszystkie wejściowe obietnice są odrzucone, `Promise.any()` zwraca odrzuconą obietnicę z pierwszym błędem, który występuje.

Użycie `Promise.any()` może uprościć twój kod i poprawić wydajność w przypadkach, gdy chcesz czekać na zakończenie wielu obietnic, ale potrzebujesz tylko obsłużyć wynik pierwszej, która zakończy się sukcesem.

![](http://localhost:8484/d7ba2fa1-1be9-4d7e-a741-956c2fd0c415.avif)

## Metoda Array.prototype.at()

Metoda **`at()`** przyjmuje wartość całkowitą i zwraca element znajdujący się na tym indeksie, pozwalając na użycie zarówno liczb całkowitych dodatnich, jak i ujemnych. Liczby całkowite ujemne liczą wstecz od ostatniego elementu w tablicy.

```
a = [0,1,2]
a.at(0); // 0
a.at(4); // undefined
a.at(-2); // 1
a.at(Infinity); // undefined
```

To fajna funkcja. Wcześniej używałem składni

```
a[(a.length + n) % a.length]
```

aby otrzymać podobne (ale nie identyczne) wyniki:

```
a[(a.length + 0) % a.length] // 0 as a.at(0)
a[(a.length + 4) % a.length] // 1
a[(a.length -2) % a.length] // 1
a[(a.length + Infinity) % a.length] // undefined
```

## *Najwyższy* poziom await

Koncepcja ta wiąże się z dynamicznym importem. Ponieważ import jest wykonywany w czasie działania, eksportowane obiekty mogą być przygotowywane w czasie rzeczywistym. Nie ma więc powodów, aby nie dać im trochę czasu.

Możemy to osiągnąć za pomocą składni takiej jak ta

```javascript
const colors = fetch("../data/colors.json").then((response) => response.json());

export default await colors;
```

w zaimportowanym module. Pozwól, że zaprezentuję pełny przykład:

```
// file objects.mjs
const res = fetch('https://api.restful-api.dev/objects');

export default await (await res).json();
```

i

```
// file index.js
async function main() {
  let ok = await import('./objects.mjs');
  console.log(ok.default);
}

main().catch(console.error);
```

wykonanie wydrukuje w konsoli:

```
[
  {
    id: '1',
    name: 'Google Pixel 6 Pro',
    data: { color: 'Cloudy White', capacity: '128 GB' }
  },
  ...
]
```

Możesz przeczytać o bardziej niesamowitych funkcjach await tutaj:

[await - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)

---

Wszystko jest w tym artykule, ale zdecydowanie poruszyłem tylko małą część obecnych funkcji JS i jestem pewien, że ten artykuł jest gorszym źródłem do ich nauki niż oficjalne specyfikacje. Jego celem było raczej podsumowanie, które funkcje uważam za przydatne, ale wciąż rzadko spotykane w kodzie.

Mam nadzieję, że czujesz się zainspirowany lub nauczyłeś się czegoś nowego, a jeśli tak, kliknij subskrybuj lub napisz komentarz. Dziękuję
