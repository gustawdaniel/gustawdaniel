---
author: Daniel Gustaw
canonicalName: retry-policy
coverImage: http://localhost:8484/06db71a6-c569-4d4c-8497-9872e525bcb9.avif
description: Dowiedz się, jak sprawić, że losowe, niemożliwe do odtworzenia błędy nie będą już groźne dla Twojego programu.
excerpt: Dowiedz się, jak sprawić, że losowe, niemożliwe do odtworzenia błędy nie będą już groźne dla Twojego programu.
publishDate: 2022-06-10T16:14:57.000Z
slug: pl/retry-policy
tags: ['typescript', 'nodejs', 'error']
title: Retry Policy - Jak obsługiwać losowe, nieprzewidywalne błędy
updateDate: 2022-06-10T16:14:57.000Z
---

Czasami z szeregu różnych przyczyn programy komputerowe potrafią zwracać dziwne błędy, których odtworzenie jest niezwykle trudne, a naprawienie nie możliwe. Jeśli jednak poprawne działanie programu udaje się uzyskać w skończonej ilości ponownych jego uruchomień, może to stanowić optymalny sposób rozwiązania tego problemu.

![](http://localhost:8484/80ac4d04-5e5c-40dd-8e24-a8acc023dac4.avif)

Ma to znaczenie, szczególnie w złożonych systemach, gdzie wiele potencjalnych źródeł błędów akumuluje się, a ponowna próba wywołania wadliwych funkcji pozwala obniżyć prawdopodobieństwo błędu podnosząc je do kwadratu.

W tym artykule pokarzę jak dzięki paczce `ts-retry` oraz obiektowi `Proxy`, możesz podnieść stabilność swojego kodu i sprawić, że kod który prawie nigdy nie działał będzie zwracał błędy tylko czasami.

## Program zwracający losowe błędy

Zacznijmy od implementacji przykładowej klasy - Prostokąta, który z pewnym prawdopodobieństwem nie radzi sobie z obliczeniem swojego pola.

```typescript
class Rectangle {
    a: number
    b: number

    constructor(a: number, b: number) {
        this.a = a;
        this.b = b;
    }

    async field(n: number) {
        if (Math.random() > n) {
            return this.a * this.b
        } else {
            throw new Error(`Random Fail`);
        }
    }
}
```

Argumentem funkcji `field` jest prawdopodobieństwo błędu.

Teraz zobaczmy jak wyglądałoby użycie obiektu tej klasy i policzmy ilość błędów

```typescript
async function main() {
    const rec = new Rectangle(1, 2);
    const res = {
        ok: 0,
        fail: 0
    }

    for (let i = 0; i < 10000; i++) {
        try {
            await rec.field(0.1);
            res.ok++;
        } catch {
            res.fail++;
        }
    }

    console.log(res);
}

main().catch(console.error)
```

po włączeniu tej funkcji widzimy, że co mniej więcej dziesiąty wynik jest błędny

```json
{ ok: 9035, fail: 965 }
```

Jest niemal pewne, że w 10.000 przypadków znajdziemy przynajmniej jeden błąd. Jeśli chcieli byśmy w 10.000 przypadków mieć prawdopodobieństwo błędu na poziomie 0.1% to musieli byśmy obniżyć szansę błędu pojedynczego wywołania z 10% do 0.000001%. czyli milion razy.

Okazuje się, że nie tylko jest to możliwe, ale nie zajmie nawet dużo czasu. Całkowity czas działania programu, stosującego metodę ponownego próbowania dla otrzymanych błędów liczymy jako

$$
T = T_0 \sum_{n=0}^{\infty} p_e^n = T_0 \exp(p_e) \approx (1+p_e) T_0
$$

W naszym przypadku będzie to oznaczało, że być może zdarzą się serie 6 nie udanych prób pod rząd, ale cały program zamiast zwracać błędy po prostu będzie działał średnio jedynie o 1/10 dłużej.

## Redukcja ilości błędów na wyjściu

Zainstalujmy paczkę `ts-retry` i napiszmy następujący kod:

```typescript
import {retryAsyncDecorator} from "ts-retry/lib/cjs/retry/decorators";
import { RetryOptions} from "ts-retry";

export function retryPolicy<T>(obj: any, policy: RetryOptions): T {
    return new Proxy(obj, {
        get(target, handler) {
            if (handler in target) {
                if (handler === 'field') {
                    return retryAsyncDecorator(target[handler].bind(target), policy)
                }
                return target[handler];
            }
        }
    })
}
```

Funkcja `retryPolicy` zwraca obiekt Proxy, który zachowuje się prawie tak jak nasza wejściowa klasa, ale dla funkcji `field` zwraca handler, który wykonuje próby wywołania tej funkcji zgodnie z konfiguracją przekazaną do `retryPolicy` jako drugi argument.

Jeśli teraz wrócimy do funkcji `main` i zastąpimy:

```typescript
const rec = new Rectangle(1, 2);
```

przez

```typescript
const rec = retryPolicy<Rectangle>(new Rectangle(1, 2), {maxTry: 6, delay: 0});
```

jest prawie pewne, że zobaczymy:

```json
{ ok: 10000, fail: 0 }
```

Jeśli chcemy, aby było to pewne, można zmienić `maxTry` z `6` na `Infinity`, ale tu jest pułapka. Taka wartość owszem obniżyła by szansę, że jakiś nie odtwarzalny, losowy błąd zepsuje nam wynik końcowy, ale wraz z każdą kolejną próbą rośnie szansa, że błąd, z którym mamy do czynienia wcale nie jest losowy i wcale nie zniknie wraz z kolejną iteracją.

Czasami przyczyną błędu może być brak dostępu do jakiegoś zasobu właśnie dlatego, że odpytujemy o niego zbyt często. Wtedy warto przy każdej kolejnej próbie czekać coraz dłużej. Często jednak trafimy na błędy, których nie można po prostu naprawić metodą "wyłącz i spróbuj jeszcze raz". W ich przypadku zbyt duża wartość `maxTry` podnosi nam łączny czas poświęcony przez program na bezcelowe działania.

![](http://localhost:8484/61babd67-eb90-458a-928f-7b929bf00f8c.avif)

Wobec trudności z pomiarem szans na błędy i ich kategoryzacją w wielu przypadkach zamiast wyliczać parametry `retry policy` ustala się je intuicyjnie.

Bardzo rozsądne jest zróżnicowanie polityki retry w zależności od rodzaju błędu:

![](http://localhost:8484/9fc3b562-2ac9-4e30-918c-80fa74af3f60.avif)

Niestety paczka `ts-retry` nie obsługuje ani `exponential backoff` ani różnego traktowania np kodów błędów, które pomagają w decydowaniu co zrobić z tym błędem. Na szczęście od lat powstają bardziej rozbudowane paczki. Wśród nich najciekawsza wydaje się `ts-retry-promise`, która mimo niskiej popularności daje dobry kompromis między prostotą użycia a możliwością customizacji.

![](http://localhost:8484/90c12071-2e59-4b09-b000-c8fe52afe717.avif)

Więcej o optymalnych strategiach `retry` możesz przeczytać w artykule Prof. Douglas Thain - Exponential Backoff in Distributed Systems z 2009.

[Exponential Backoff in Distributed Systems](https://dthain.blogspot.com/2009/02/exponential-backoff-in-distributed.html)

Aby użyć `ts-retry-promise` do importów dodamy:

```typescript
import {NotRetryableError, RetryConfig, retryDecorator} from "ts-retry-promise";
```

zmieniamy `maxTry` na `retries`. Możemy ustawić `backoff` na `EXPONENTIAL` ale został nam jeszcze problem błędów, przy których chcieli byśmy się poddać bez walki.

Zmieńmy ciało funkcji field następująco

```typescript
    async field(n: number, m: number) {
        if (Math.random() > n) {
            return this.a * this.b
        } else {
            if(Math.random() > m) {
                throw new Error(`Random Fail`);
            } else {
                throw new Error(`CRITICAL`);
            }
        }
    }
```

teraz zwraca ono dwa rodzaje błędów, `Random Fail` przy którym będziemy próbować ponownie (mógł by to być kod błędu 429) oraz `CRITICAL` przy którym wiemy, że nie ma to sensu (np 401).

W `main` funkcja `field` przyjmuje teraz szansę błędu (n) oraz szansę, że jest to błąd krytyczny (m).

Bez dalszych zmian w `Rectangle` i `main` zmienimy w funkcji `retryPolicy` linię

```typescript
return retryAsyncDecorator(target[handler].bind(target), policy)
```

na

```typescript
return retryDecorator(rethrowNotRetryableErrors(target[handler].bind(target)), policy)
```

i dołożymy funkcję:

```typescript
import {types} from 'util';

function rethrowNotRetryableErrors(fun: any):any {
    return (...args:any) => {
        return fun(...args).catch((err: unknown) => {
            if(types.isNativeError(err)) {
                if(err.message.includes('CRITICAL')) throw new NotRetryableError(err.message);
            }
            throw err;
        })
    }
}
```

Jej zadaniem jest ukrycie logiki translacji błędów zwracanych przez `Rectangle` na takie, które różnią się sposobem obsługi w paczce `ts-retry-promise`. Dzięki temu zostawiając resztę kodu nie tkniętą możemy tu napisać, że nie będziemy próbować ponownych wywołań z błędami zawierającymi `CRITICAL` w polu `message`.

Prezentowany tu kod znajdziesz pod linkiem:

[GitHub - gustawdaniel/blog-retry-policy](https://github.com/gustawdaniel/blog-retry-policy)

## Co, jeśli błędu nie da się obsłużyć

Wtedy trzeba poinformować użytkownika końcowego, stosując się do następujących reguł:

* nie można mu powiedzieć o błędzie za dużo, bo może być hackerem i to wykorzystać
* nie można mu powiedzieć za mało, bo w dziale supportu nie będzie dało się mu pomóc
* nie można w komunikacie błędu przyznać się, że kod nie działa... wiadomo dlaczego
* pozostaje wymieszać cynizm i szczerość z humorem i wyświetlić mu to:

![](http://localhost:8484/be0b858a-5648-408d-aa10-fc750a896244.avif)
