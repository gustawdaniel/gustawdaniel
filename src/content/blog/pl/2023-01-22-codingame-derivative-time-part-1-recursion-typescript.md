---
author: Daniel Gustaw
canonicalName: codingame-derivative-time-part-1-recursion-typescript
coverImage: http://localhost:8484/4fa140be-b4cd-472c-9a33-31181e493f79.avif
description: Rozwiązanie ćwiczenia CodinGame. Prosty przykład rekurencji z typescriptem. Reprezentacja formuły inspirowana lispem.
excerpt: Rozwiązanie ćwiczenia CodinGame. Prosty przykład rekurencji z typescriptem. Reprezentacja formuły inspirowana lispem.
publishDate: 2023-01-21 20:31:28+00:00
slug: pl/codingame-pochodna-czesc-1
tags:
- recursion
- typescript
- codingame
title: 'CodinGame: Czas pochodnej - Część 1, Rekursja (Typescript)'
updateDate: 2023-01-21 20:31:28+00:00
---

Teraz rozwiążemy zadanie `CZAS PIERWŚCIEŃ`:

[Coding Games and Programming Challenges to Code Better](https://www.codingame.com/training/medium/derivative-time---part1)

Naszym celem jest obliczenie pochodnej częściowej podanego wzoru.

Na przykład, mając funkcję "(5\*(x\*(y^2)))" oraz "y x", zmienne, względem których musisz obliczyć pochodną

Więc tutaj f(x,y) = 5xy² i musisz obliczyć:

```
   d²f(x,y)
  ----------
    dxdy
```

daje ci wzór 10\*y. Na końcu "x 2 y 6" oznacza x=2, y=6, daje ci wartości, dla których musisz ocenić uzyskaną pochodną. Tak więc odpowiedź powinna wynosić 60

**Uwaga**
Aby uprościć zadanie, rozważaj tylko **+**, **\*** i **^**. Zakładaj, że **+**, **\*** i **^** zawsze przyjmują dwa argumenty i że wyrażenia są w pełni zagnieżdżone.

Potęga ujemna nie ma nawiasów. np. (((18\*(x^**\-1**))+y)+z)

zmienne mogą być w innych formach niż x, y i z. Podobnie jak identyfikatory w wielu językach programowania, zmienna byłaby jakąś literą, po której następują litery, cyfry lub podkreślenie.

link do zasad rachunku:

[Zasady różniczkowania - Wikipedia](https://wikimedia.org/api/rest_v1/media/math/render/svg/86a67b81c2de995bd608d5b2df50cd8cd7d92455)](https://en.wikipedia.org/wiki/Differentiation_rules)

Reguły potrzebne tutaj:

```
a'=0
(a*x)'=a
(x^a)'=a*x^(a-1) (when a is not 0)
(u+v)'=u'+v'
(u*v)'=u'*v+v'*u
```

# Teoretyczne wprowadzenie do pochodnych

Aby obliczyć pochodną funkcji, musimy przedstawić funkcję jako obiekt możliwy do manipulacji. Jedną z możliwości jest przedstawienie jej jako tablicy, w której operacja znajduje się na początku, a argumenty zajmują pozostałe miejsca.

Koncepcja ta jest intensywnie używana w niektórych językach, takich jak Lisp czy Scheme. Jeśli nie znasz Lispa, możesz go łatwo nauczyć się w `y` minut na stronie:

[Naucz się Common Lisp w Y minut](https://learnxinyminutes.com/docs/common-lisp/)

Zamiast pisać

```
a + b
```

w lispie napiszesz

```
(+ a b)
```

Nasze dalsze rozwiązanie będzie w dużej mierze oparte na tym koncepcie porządkowania. Jakie ma zalety w porównaniu do `a + b`? Przede wszystkim możemy dekomponować nasze wyrażenia przez

```typescript
const [operation, ...arguments] = expression;
```

Po drugie, dla operacji [stowarzyszonych](https://mathworld.wolfram.com/Associative.html) możemy użyć funkcji `reduce` w następujący sposób

```
const res = arguments.reduce(fn, identity);
```

W tym przypadku `identity` to wartość, która nie zmieni wyniku operacji, a `fn` to funkcja przypisana do `operation`, np. `(a,b) => a+b` dla dodawania.

Mając na uwadze te podstawowe pojęcia, możemy uznać pochodną za funkcję, która przekształca tablicę reprezentującą formułę matematyczną w inną tablicę z inną formułą.

Wiemy, jakie przekształcenia należy zastosować do dodawania, mnożenia lub potęg. Możemy również uprościć wynik, znając pochodne funkcji stałej lub funkcji tożsamościowej.

Podzielmy więc nasze rozwiązanie na cztery kroki.

1. Ustawienie projektu
2. Parsowanie wejścia
3. Ocena wartości
4. Obliczanie pochodnej

## Ustawienie projektu NodeJS z TypeScriptem i JEST

Zainicjujmy projekt

```
npm init -y
tsc --init
```

w wygenerowanym `tsconfigl.json` musimy ustawić

```
"target": "ESNext",
```

aby móc używać `Map` lub innych nowoczesnych struktur danych lub składni.

W `package.json` powinniśmy ustawić

```
"test": "jest"
```

w sekcji `scripts` i zainstalować wymagane pakiety.

```
npm i -D @types/jest @types/node esbuild-jest jest ts-node typescript
```

Teraz utwórzmy konfigurację `jest` `jest.config.ts`

```typescript
module.exports = {
    roots: ['<rootDir>'],
    testMatch: ['**/__tests__/**/*.+(ts|tsx)', '**/?(*.)+(spec|test).+(ts|tsx)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'esbuild-jest',
    },
    setupFilesAfterEnv: [],
    testEnvironment: 'node',
}
```

Ostatecznie możemy utworzyć trzy pliki: `lib.ts` z:

```typescript
export function run(input: string): string {
    return ''
}
```

Przetestuj `test/lib.test.ts` za pomocą

```typescript
import {run} from "../lib";

describe('e2e', () => {
    it('temporary', () => {
        expect(run('')).toEqual('')
    })
});
```

i `index.ts`, który jest odpowiedzialny za operacje wejścia/wyjścia

```typescript
import {run} from "./lib";

process.stdin.on('data', (buff) => {
    const input = buff.toString();
    process.stdout.write(run(input));
})
```

Teraz powinniśmy być w stanie uruchomić program za pomocą

```
echo '' | ts-node index.ts
```

i testuj za pomocą polecenia

```
npm run test
```

## Parsowanie wejścia i budowanie obiektów

Zobaczmy na wejście

Z treści tego ćwiczenia możemy odczytać, że wejście zawiera 3 linie:

**Linia 1**: wzór  
**Linia 2**: lista zmiennych do pochodnej cząstkowej, oddzielona spacją, długość listy będzie wynosić 1, 2 lub 3.  
**Linia 3**: wartości zmiennych, parowane i oddzielone spacją  

Wynik to rezultat (zawsze liczba całkowita).

Więc na przykład wejście

```
(5*(x*y))
x
x 2 y 6
```

będziemy mieć pochodną według `x`, dającą `(5*y)`, która w punkcie `{x:2, y:6}` wynosi `5*6` lub po prostu

```
30
```

Teraz wprowadzimy trzy obiekty, które będą odnosić się do tych linii:

* Formuła
* DiffOperator
* Współrzędna

Ogólnie rzecz biorąc, każdy z tych obiektów powinien być tworzony na podstawie swojej linii. Jedynym wyjątkiem jest `Formuła`, która wymaga `zmiennych` z `współrzędnej`, aby rozpoznać argumenty i traktować je w specjalny sposób.

Teraz funkcję `run` z `lib.ts` można przepisać jako

```typescript
export function run(input: string): string {
    const [F, vs, dict] = input.split('\n');
    const point = new Coordinate(dict);
    const diff = new DiffOperator(vs);
    const formula = new Formula(F, point.variables);

    return diff.actOn(formula).evaluate(point).toString();
}
```

Co można wyjaśnić jako działanie operatora pochodnej na funkcji i jego ocenę w danym punkcie. To dokładnie to, co musimy zrobić w tym zadaniu.

Teraz zaimplementujemy te klasy i napiszemy kilka testów dla nich.

### Implementacja współrzędnej

Zacznijmy od `współrzędnej`.

```typescript
export class Coordinate {
    map: Map<string, number> = new Map();

    constructor(input: string) {
        const pairs = input.split(' ');
        for (let i = 0; i < pairs.length / 2; i++) {
            const [key, value] = [pairs[i * 2], Number.parseFloat(pairs[i * 2 + 1])];
            this.map.set(key, value);
        }
    }

    get variables(): string[] {
        return [...this.map.keys()]
    }

    get(name): number {
        return this.map.get(name) ?? 0;
    }
}
```

Po prostu dzieli jego ciąg `x 2 y 6` według spacji i przesuwa parami, ustawiając je jako klucze i wartości wewnętrznej `Map`. Może zwrócić zarówno listę kluczy, aby pomóc w inicjalizacji `Formula`, jak i uzyskać pojedynczą wartość klucza, która jest użyteczna w ocenie.

testy dla współrzędnych są następujące

```typescript
describe('coordinate', () => {
    it('parsing', () => {
        const point = new Coordinate('x 2 y 6');
        expect(point.variables).toEqual(['x', 'y']);
        expect(point.get('x')).toEqual(2);
        expect(point.get('y')).toEqual(6);
        expect(point.get('undefined')).toEqual(0);
    })
})
```

### Inicjalizacja formuły

Następnym obiektem jest formuła. Potrzebujemy dwóch dodatkowych typów.

```typescript
type Operator = '*' | '^' | '+' | '-';
type SubFormula = Array<string | number | SubFormula> | string | number
```

i możemy napisać naszą klasę formuły

```typescript
export class Formula {
    f: SubFormula;
    v: string[] = [];
}
```

następujące funkcje będą umieszczone w tej klasie. Potrzebujemy konstruktora, który przyjmie ciąg formuły oraz listę zmiennych. Aby operować na ciągłej formie formuły, zdefiniujemy dwie funkcje:

* `decomposeInput(input: string): SubFormula`
* `isDecomposable(input: string): boolean`

Pierwsza będzie odpowiedzialna za analizę, druga sprawdzi, czy powinniśmy rozszerzyć wejście na elementy, czy też zostawić je jako atomową część formuły.

W naszym przypadku musimy dokonać dekompozycji, jeśli ciąg zaczyna się i kończy nawiasami oraz zawiera operator.

```typescript
    isDecomposable(input: string): boolean {
        return input.startsWith('(') && input.endsWith(')') && /[*^+-]/.test(input)
    }
```

Dezagragacja zawiera część, która przygotowuje trzy elementy `p` jak poprzedni, `n` jak następny i operator.

```typescript
decomposeInput(input: string): SubFormula {
        let p: SubFormula = '', operator: Operator | '' = '', n: SubFormula = '', level: number = 0;
        if (!this.isDecomposable(input)) return [0];
        for (let i = 1; i < input.length - 1; i++) {
            if (level === 0 && !operator && /[*^+-]/.test(input[i])) {
                operator = input[i] as Operator;
                continue;
            } else if (input[i] === '(') {
                level++;
            } else if (input[i] === ')') {
                level--;
            }
            if (operator) {
                n += input[i];
            } else {
                p += input[i];
            }
        }
```

używamy `level`, aby określić, na którym poziomie podzakresu się znajdujemy podczas pętli.

Po przejściu przez wszystkie znaki i zakończeniu `p`, `n` oraz `operator` musimy sprawdzić, czy powinniśmy rozłożyć lub analizować te elementy za pomocą kodu.

```typescript
        if (this.isDecomposable(p)) {
            p = this.decomposeInput(p);
        } else {
            if (!this.v.includes(p)) {
                p = Number.parseFloat(p);
            }
        }
        if (this.isDecomposable(n)) {
            n = this.decomposeInput(n);
        } else {
            if (!this.v.includes(n)) {
                n = Number.parseFloat(n);
            }
        }
        return [operator, p, n];
    }
```

po zdefiniowaniu tych funkcji możemy napisać konstruktor

```typescript
    constructor(input: string, variables: string[]) {
        this.v = variables;
        this.f = this.decomposeInput(input);
    }
```

i testować je

```typescript
describe('formula', () => {
    const f = new Formula('(5*(x*y))', ['x', 'y']);

    it('parse', () => {
        expect(f.f).toEqual(['*', 5, ['*', 'x', 'y']]);
        expect(f.v).toEqual(['x', 'y']);
    });

    it('parse with many brackets', () => {
        const f = new Formula('((x^3)+(x^2))', ['x']);
        expect(f.f).toEqual(['+', ['^', 'x', 3], ['^', 'x', 2]])
    })
})
```

### Inicjalizacja DiffOperator (pochodna)

Na szczęście pochodna jest niezwykle łatwa do skonstruowania.

```typescript
export class DiffOperator {
    d: string[] = [];

    constructor(input: string) {
        this.d = input.split(' ');
    }
}
```

wewnątrz chcemy przechować tablicę nazw zmiennych, które będziemy używać sekwencyjnie, działając na danej funkcji.

Możemy pominąć testy dla tego i przejść do następnej części - Ocena wartości

## Ocena wartości

Teraz nadal będziemy pisać kod w klasie `Formula`.

Nasza funkcja obliczeniowa będzie mogła wywoływać samą siebie wiele razy, więc aby uprościć ich interfejs, podzielimy obliczenie na:

```typescript
static compute(f: SubFormula | string | number, point: Coordinate): number
```

i

```typescript
evaluate(point: Coordinate): number
```

pierwszy będzie używany do bezpośredniego działania na `SubFormula`, ale drugi będzie warstwą, która została zastosowana w `run` w wyrażeniu

```typescript
diff.actOn(formula).evaluate(point)
```

ocenić można zdefiniować jako

```typescript
    evaluate(point: Coordinate): number {
        return Formula.compute(this.f, point);
    }
```

Ale `compute` powinno zaczynać się od klasyfikacji swojego argumentu. Może to być wyrażenie, wtedy `Array.isArray(f)` będzie prawdziwe, liczba, wtedy ta liczba powinna być zwrócona jako nazwa współrzędnej, następnie współrzędna zapisana w `point` może być zwrócona.

Nasz kod będzie następujący

```typescript
    static compute(f: SubFormula | string | number, point: Coordinate): number {
        if (Array.isArray(f)) {
            // ... TO BE DEFINED IN NEXT STEP
        } else if (typeof f === 'number') {
            return f;
        } else {
            return point.get(f);
        }
    }
```

Najciekawszy jest przypadek, gdy `f` jest tablicą. Wtedy, korzystając z teorii z wprowadzenia, powinniśmy rozłożyć to na operator i argumenty;

```typescript
const [op, ...rest] = f;
```

a w następnym kroku, w zależności od argumentów `operator`, można przetwarzać je za pomocą różnych funkcji:

```typescript
switch (op) {
    case '+':
        return <number>rest.reduce((p: number, n: SubFormula): number => p + this.compute(n, point), 0);
    case '*':
        return <number>rest.reduce((p: number, n: SubFormula): number => p * this.compute(n, point), 1);
    case '^': {
        const [p, n] = rest;
        return Math.pow(this.compute(p, point), this.compute(n, point));
    }
    case '-': {
        const [p, n] = rest;
        return this.compute(p,point) - this.compute(n, point);
    }
    default:
        return 0;
}
```

Dla operacji asocjacyjnych, takich jak `*` i `+` z istniejącą wartością neutralną, użyliśmy `reduce`. Jednak w pozostałych przypadkach zakładamy, że istnieją dwa argumenty i używamy destrukturyzacji.

Aby udowodnić, że to działa, możemy dodać następujący test do sekcji `formula`

```typescript
    it('evaluate', () => {
        expect(f.evaluate(new Coordinate('x 1 y 2'))).toStrictEqual(10);
    });
```

nasza formuła zdefiniowana wcześniej brzmiała `(5*(x*y))`, więc oczekujemy wyniku `10`.

Jeśli śledzisz wszystkie te koncepcje do tego momentu, to następny krok będzie dla Ciebie łatwą logiczną kontynuacją.

## Obliczanie pochodnej

Obliczanie pochodnej będzie wykonane w tym samym stylu co ocena wartości funkcji. Podzielimy to na dwie metody Dynamic `actOn` z interfejsem.

```typescript
actOn(f: Formula): Formula
```

i statyczna funkcja wewnętrzna

```typescript
static derivative(s: SubFormula, dir: string): SubFormula
```

Pierwsza z nich będzie iterować po wszystkich kierunkach zapisanych w właściwości `d`. Druga to pierwsza pochodna w kierunku przekazanym jako drugi argument. Te funkcje działają również na innych poziomach: `actOn` będzie używać abstrakcji `Formula`, ale `derivative` potrzebuje i zwraca `SubFormula`, aby operować na bardziej niskopoziomowej strukturze.

Wprowadzimy również jedną więcej funkcję statyczną.

```typescript
static simplify(s: SubFormula): SubFormula
```

który nie będzie potrzebował wskazania i użyje prostych zasad algebry, aby uczynić częściowe wyniki obliczeń bardziej zrozumiałymi dla ludzi i łatwiejszymi do przetworzenia. Funkcja Simplify zwróci tę samą formułę matematyczną, ale zapisaną w najprostszy możliwy sposób, usuwając niepotrzebne dodawania `0` lub mnożenia przez `1`.

Poniższe funkcje są zdefiniowane jako metody `DiffOperator`.

### Uproszczenie formuły

Zacznijmy od `simplify`, ponieważ zacząłem od niej wyjaśniać. Aby uprościć formuły, zastosujemy następujące zasady:

* wszystkie podargumenty powinny być uproszczone (rekurencyjnie)
* jeśli wszystkie podargumenty są liczbami, powinny zostać obliczone
* jeśli jeden z argumentów to `0` lub `1`, specjalne traktowanie drugiego argumentu powinno być stosowane w zależności od `operatora`

Kod, który implementuje opisane zachowanie, to

```typescript
    static simplify(s: SubFormula): SubFormula {
        if (Array.isArray(s)) {
            const [op, ...rest] = s;
            for (let i = 0; i < rest.length; i++) {
                rest[i] = this.simplify(rest[i]);
            }
            if (rest.every((r) => typeof r === 'number')) {
                return Formula.compute(s, new Coordinate(''));
            }
            if (rest[0] === 0) {
                if (op === '+') return rest[1]
                if (op === '*') return 0
                if (op === '^') return 0
            }
            if (rest[0] === 1) {
                if (op === '*') return rest[1]
                if (op === '^') return 1
            }
            if (rest[1] === 0) {
                if (op === '+') return rest[0]
                if (op === '*') return 0
                if (op === '^') return 1
            }
            if (rest[1] === 1) {
                if (op === '*') return rest[0]
                if (op === '^') return rest[0]
            }
            return [op, ...rest];
        } else {
            return s;
        }
    }
```

### Pochodna wzoru

Aby zdefiniować pochodną pierwszego rzędu w danym kierunku:

```typescript
static derivative(s: SubFormula, dir: string): SubFormula
```

musimy założyć, że możemy to obliczyć na

* wyrażeniu
* naszej zmiennej
* stałej

Jeśli jest to wykonywane na zmiennej lub stałej, wynik będzie `1` lub `0`, ale w przypadku wyrażenia musimy sprawdzić `operator` i zdecydować, którą regułę powinniśmy zastosować. Ta część jest dokładnie tym samym konceptem co przy ewaluacji, ale zwracamy tablice z operatorami, które reprezentują funkcje zamiast liczb. Kod poniżej:

```typescript
    static derivative(s: SubFormula, dir: string): SubFormula {
        if (Array.isArray(s)) {
            const [op, p, n] = s;
            switch (op) {
                case '*':
                    return ['+', ['*', p, this.derivative(n, dir)], ['*', this.derivative(p, dir), n]];
                case '+':
                    return ['+', this.derivative(p, dir), this.derivative(n, dir)];
                case '-':
                    return ['-', this.derivative(p, dir), this.derivative(n, dir)];
                case '^': {
                    if (p === dir) {
                        if (n === 0) return 0;
                        return typeof n === 'number' ? ['*', n, ['^', p, n - 1]] : ['*', n, ['^', p, ['+', n, -1]]]
                    } else {
                        return 0;
                    }
                }
            }

        } else if (typeof s === 'string' && s === dir) {
            return 1
        } else {
            return 0;
        }
    }
```

możemy zobaczyć, że tylko z potęgami jest trochę zamieszania, ponieważ postanowiłem ocenić odejmowanie `1` w potędze, jeśli jest liczbą. Postanowiłem pominąć obsługę `a^x`, ponieważ jest to funkcja wykładnicza, która wykracza poza zakres pierwszej części tego ćwiczenia.

Na koniec, aby zaimplementować `actOn`, będziemy potrzebować klonu formuły, więc na formule powinniśmy zaimplementować

```typescript
    clone(): Formula {
        const o = new Formula('', []);
        o.f = JSON.parse(JSON.stringify(this.f));
        o.v = JSON.parse(JSON.stringify(this.f));
        return o;
    }
```

a następnie na `DiffOperator`

```typescript
    actOn(f: Formula): Formula {
        const o = f.clone();
        return this.d.reduce((p, n) => {
            o.f = DiffOperator.simplify(DiffOperator.derivative(p.f, n));
            return o;
        }, o);
    }
```

Aby napisać stabilny, edytowalny i działający kod, powinniśmy dodać testy.

```typescript
describe('diff operation', () => {
    it('simplify', () => {
        expect(DiffOperator.simplify(["+", ["*", 1, 0], ["*", 0, 1]])).toEqual(0);
        expect(DiffOperator.simplify(['^', 'x', 1])).toEqual('x');
        expect(DiffOperator.simplify(['*', 2, ['^', 'x', 1]])).toEqual(['*', 2, 'x']);
        expect(DiffOperator.simplify(["*", 5, ["+", ["*", "x", 0], ["*", 1, "y"]]])).toEqual(['*', 5, 'y'])
        expect(DiffOperator.simplify(["+", ["*", 5, ["+", ["*", "x", 0], ["*", 1, "y"]]], ["*", 0, ["*", "x", "y"]]])).toEqual(['*', 5, 'y'])
    });
    it('derivative', () => {
        expect(DiffOperator.simplify(DiffOperator.derivative(['*', 2, 'x'], 'x'))).toEqual(2);
        expect(DiffOperator.simplify(DiffOperator.derivative(['*', 5, ['*', 'x', 'y']], 'x'))).toEqual(['*', 5, 'y'])
    })
    it("a'=0", () => {
        const f = new Formula('(1*1)', ['x']);
        const d = new DiffOperator('x');
        expect(d.actOn(f).f).toEqual(0);
    });
    it("(a*x)'=a", () => {
        const f = new Formula('(4*x)', ['x']);
        const d = new DiffOperator('x');
        expect(d.actOn(f).f).toEqual(4);
    });
    it("(x^a)'=a*x^(a-1) (when a is not 0)", () => {
        const cases = [
            {in: '(x^5)', out: ['*', 5, ['^', 'x', 4]]},
            {in: '(x^3)', out: ['*', 3, ['^', 'x', 2]]},
            {in: '(x^2)', out: ['*', 2, 'x']},
        ];
        for (const c of cases) {
            const f = new Formula(c.in, ['x']);
            const d = new DiffOperator('x');
            expect(d.actOn(f).f).toEqual(c.out);
        }
    });
    it("(u+v)'=u'+v for (x+(x^2))'", () => {
        const f = new Formula('(x+(x^2))', ['x']);
        const d = new DiffOperator('x');
        expect(d.actOn(f).f).toEqual(['+', 1, ['*', 2, 'x']]);
    });

    it("(u+v)'=u'+v'", () => {
        const f = new Formula('((x^3)+(x^2))', ['x']);
        const d = new DiffOperator('x');
        console.log("f", f);
        expect(d.actOn(f).f).toEqual(['+', ['*', 3, ['^', 'x', 2]], ['*', 2, 'x']]);
    });
    it("(u*v)'=u'*v+v'*u", () => {
        const f = new Formula('(x*x)', ['x']);
        const d = new DiffOperator('x');
        console.log("f", f);
        expect(d.actOn(f).f).toEqual(['+', 'x', 'x']);
    });

    it('d(8*(y^x))/dy', () => {
        const f = new Formula('(8*(y^x))', ['x', 'y']);
        expect(f.f).toEqual(['*', 8, ['^', 'y', 'x']]);
        expect(DiffOperator.simplify(DiffOperator.derivative(['*', 8, ['^', 'y', 'x']], 'y'))).toEqual(['*', 8, ['*', 'x', ['^', 'y', ['+', 'x', -1]]]]);
    })

    it('(18*(x^-1))',() => {
        const f = new Formula('(18*(x^-1))', ['x']);
        expect(f.f).toEqual(['*', 18, ['^', 'x', -1]]);
        expect(DiffOperator.simplify(DiffOperator.derivative(f.f, 'x'))).toEqual( ['*', 18, ['*', -1, ['^', 'x', -2]]]);
    });

    it('d(((x^2)+(2*(z^5)))+(((18*(x^-1))+y)+z))/dx', () => {
        const f = new Formula('(((x^2)+(2*(z^5)))+(((18*(x^-1))+y)+z))', ['x', 'y', 'z']);
        expect(DiffOperator.simplify(DiffOperator.derivative(f.f, 'x'))).toEqual(['+', ['*', 2, 'x'], ['*', 18, ['*', -1, ['^', 'x', -2]]]]);
    })
})
```

W końcu wszystkie elementy programu działają, więc możemy również dodać testy `e2e` dla funkcji `run`.

```typescript
describe('e2e', () => {
    it('easy multiply', () => {
        expect(run('(5*(x*y))\nx\nx 2 y 6')).toEqual('30')
    })
    it("second derivative", () => {
        expect(run('(5*((x^4)*(y^2)))\nx x\nx 2 y 6')).toEqual('8640')
    })
    it("second derivative mix", () => {
        expect(run('(5*(x*(y^2)))\ny x\nx 2 y 6')).toEqual('60')
    })
    it("power with number", () => {
        expect(run('((x^2)+(9*(x+y)))\nx\nx 1 y 2')).toEqual('11')
    })
    it("power with variable", () => {
        expect(run('(8*(y^x))\ny y\nx -1 y 2')).toEqual('2')
    })
    it("3 variables", () => {
        expect(run('(((x^2)+(2*(z^5)))+((x+y)+z))\nz\nx 2 y 3 z 4')).toEqual('2561')
    })
    it("fraction", () => {
        expect(run('(((x^2)+(2*(z^5)))+(((18*(x^-1))+y)+z))\nx\nx 3 y 4 z 1')).toEqual('4')
    })
    it("longer multiply", () => {
        expect(run('(((x^2)*(2*(z^5)))*((x+y)+z))\nz\nx 1 y 1 z 1')).toEqual('32')
    })
    it("3rd derivative", () => {
        expect(run('(((y^6)*(z^5))*(((3*(x^4))+y)+z))\ny y z\nx 1 y 1 z 2')).toEqual('16320')
    })
    it("some Greek ;)", () => {
        expect(run('(((Beta^6)*(Gamma^5))*(((3*(Alpha^4))+Beta)+Gamma))\nBeta Beta Gamma\nAlpha 1 Beta 1 Gamma 2')).toEqual('16320')
    })
    it("maybe not xyz ;)", () => {
        expect(run('(((x2^6)*(x3^5))*(((3*(x1^4))+x2)+x3))\nx2 x2 x3\nx1 1 x2 1 x3 2')).toEqual('16320')
    })
    it("some Vars ;)))", () => {
        expect(run('(((Var_2^6)*(Var_3^5))*(((3*(Var_1^4))+Var_2)+Var_3))\nVar_2 Var_2 Var_3\nVar_1 1 Var_2 1 Var_3 2')).toEqual('16320')
    })
    it("bigger constants", () => {
        expect(run('(50*((x^40)*(y^20)))\nx x\nx 1 y 1')).toEqual('78000')
    })
    it("bigger power", () => {
        expect(run('(x^(y^10))\nx x\nx 1 y 2')).toEqual('1047552')
    })
    it("cannot find", () => {
        expect(run('(5*(x*(y^2)))\nz\nx 2 y 6')).toEqual('0')
    })
})
```

i odpowiedni workflow githuba

```yml
name: Node.js CI

on:
  push:
    branches: [ "main" ]

jobs:
  build:

    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test
```

## Dalsze kroki

W codingame jest także druga część tego ćwiczenia:

[Coding Games and Programming Challenges to Code Better](https://www.codingame.com/training/medium/derivative-time---part2)

która obejmie funkcje trygonometryczne, logarytm, eksponent i nawet regułę łańcuchową.

Możesz zaprosić mnie do swoich znajomych na tej platformie używając linku:

[https://www.codingame.com/servlet/urlinvite?u=5287657](https://www.codingame.com/servlet/urlinvite?u=5287657)

Wszystkie przedstawione kody znajdziesz na moim githubie:

[GitHub - gustawdaniel/codingame-derivative-time-part-1](https://opengraph.githubassets.com/f239053bc814122dc1c46e68d764599685c1bcf41c7c4651e8f19786982fa0db/gustawdaniel/codingame-derivative-time-part-1)](https://github.com/gustawdaniel/codingame-derivative-time-part-1)
