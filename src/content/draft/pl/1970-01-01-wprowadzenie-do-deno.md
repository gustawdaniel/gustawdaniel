---
title: Wprowadzenie do Deno
slug: wprowadzenie-do-deno
publishDate: 1970-01-01T00:00:00.000Z
date_updated: 2022-06-11T17:29:05.000Z
draft: true
---

`Deno` jest anagramem nazwy `Node`. Jest to interpreter `js` oraz `ts` napisany przez autora `Node.js`. Różni się tym, że:

* ma bardziej rozbudowane możliwości zarządzania uprawnieniami skryptu do korzystania z zasobów, przez co jest bezpieczniejszy
* natywnie wspiera typescript
* ma pewne problemy z częścią paczek z `npm` ponieważ naprawiając błędy związane z implementacją `node_modules` zerwał z kompatybilnością, której nie można zerwać w `Node.js`

Pod tym względem można go porównać do `php6`, z tą różnicą, że `deno` się ukazał, albo do `perl6`, z tą różnicą, że poprzednik `deno` nie odchodzi dzisiaj w zapomnienie.

Zwykle łamanie kompatybilności w celu naprawienia czegoś nie kończy się dobrze, bo ciężko o użytkowników, którzy zgodzą się nie używać swoich ulubionych paczek. Z tego powodu po tym jak usłyszałem o `deno` w maju 2020, postanowiłem dać mu trochę czasu i zajrzeć do niego po dwóch latach. Na razie jego popularność nie rośnie, ale

![](http://localhost:8484/f2cd7a84-0bde-4813-99b9-d1942b242364.avif)

Możemy go zainstalować poleceniem:

```
curl -fsSL https://deno.land/x/install/install.sh | sh
```
