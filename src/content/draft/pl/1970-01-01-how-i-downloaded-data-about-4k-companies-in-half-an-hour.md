---
title: Jak pobrałem dane o 4k firm w pół godziny
slug: jak-pobralem-dane-o-4k-firm-w-pol-minuty
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2021-04-27T22:50:23.000Z
draft: true
canonicalName: how-i-downloaded-data-about-4k-companies-in-half-an-hour
---

O firmach wiedziałem tylko jak się nazywają. Potrzebowałem ich adresów, ...

Żeby to osiągnąć wydałem 20 zł w rejestr.io na dostęp do 10k żądań api. Dostałem klucz. Dokumentacja Rejestr.io dostępna jest pod linkiem:

[Dokumentacja API | Rejestr.io](https://rejestr.io/api-krs)

## Przygotowanie danych wejściowych

Zaczynamy od standardowego przygotowania projektu w typescript:

```
npx tsc --init
npm init -y
npm i --save-dev @types/node typescript ts-node chai @types/chai
touch app.ts
```

Plik źródłowy to xlsx z nazwami firm w katalogu `raw/base.xlsx`

Konwertujemy go do `csv` poleceniem:

```
libreoffice --headless --convert-to csv raw/base.xlsx --outdir raw --infilter=csv:44,34,76
```

Zagadkowa flaga `infilter` pozwala konwertować do formatu UTF-8 z poprawną obsługą polskich znaków. Więcej na jej temat możecie poczytać pod linkiem:

[Specify encoding with libreoffice --convert-to csv](https://unix.stackexchange.com/questions/259361/specify-encoding-with-libreoffice-convert-to-csv)

Ten plik odczytujemy w skrypcie linia po linii i dzielimy ze względu na przecinki, tak aby dostać tablicę z samymi nazwami firm.

Ten bardzo prosty kod:

```
import fs from 'fs'
import chai from 'chai'

const getCompanies = (): string[] => {
    const rawDir = process.cwd() + `/raw`

    const companies = fs
        .readFileSync(rawDir + `/base.csv`)
        .toString()
        .split(`\n`) // split to lines
        .map((line: string) => line.split(',')[1]) // get second column
        .filter(line => line) // only valid names
        .filter((line, index) => index); // excluded header with columns names

    companies.forEach(company => {
        chai.expect(company).to.be.a('string')
    })

    return companies;
}

console.dir(getCompanies(), {depth: Infinity, maxArrayLength: Infinity})
```

Pozwala po wykonaniu go komendą

```
npx ts-node app.ts
```

zobaczyć listę firm

![](http://localhost:8484/35afa927-2eea-45fa-8521-33072404148d.avif)

## Pobranie danych o firmach z KRS

Zgodnie z dokumentacją Rejestr.io zbudujemy zapytania, które pozwolą pobrać dane firm. Zaczniemy od zapisania klucza API w pliku `.env`

```
API_KEY=95772018-xxx
```

Aby pobierać zmienne środowiskowe możemy używać basha, albo bibliotek takich jak `dotenv`, ale preferuję dwie linie w konfiguracji `makefile`. Na przykład taki `Makefile`:

```
include .env
export

node_modules: package.json
	npm i

up: node_modules
	npx ts-node app.ts
```

Jego zalety to:

* wpisujemy `make up` i nie martwimy się o zmienne środowiskowe
* nie martwimy się o instalację paczek
* za nas przeinstalowuje paczki po aktualizacji `package.json`

Aby wysyłać żądania http użyjemy biblioteki `axios`. Instalujemy ją komendą:

```
npm i axios
```

Polecenie pobierające dane organizacji opisane w dokumentacji wygląda tak:

```
curl https://rejestr.io/api/v1/krs?name=energia --header "Authorization: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
```

Szuka ono organizacji w KRS po nazwie zawierającej słowo "energia".

Po przepisaniu do `node-js` dostaniemy kod:

```
import fs from 'fs'
import chai from 'chai'
import axios from "axios";

const getCompanies = (): string[] => {
    const rawDir = process.cwd() + `/raw`

    const companies = fs
        .readFileSync(rawDir + `/base.csv`)
        .toString()
        .split(`\n`)
        .map((line: string) => line.split(',')[1])
        .filter(line => line)
        .filter((line, index) => index);

    companies.forEach(company => {
        chai.expect(company).to.be.a('string')
    })

    return companies;
}

const main = async () => {
    const companies = getCompanies();

    const {data} = await axios.get(`https://rejestr.io/api/v1/krs`, {
            params: {
                name: companies[0]
            },
            headers: {
                Authorization: process.env.API_KEY
            }
        }
    )

    return {name: companies[0], data}
}

main()
    .then(res => console.dir(res, {depth: Infinity, maxArrayLength: Infinity}))
    .catch(console.error)
```

Rozczarowujące może być to, że uruchamiając kod komendą

```
make up
```

zobaczymy

```json
{
  name: 'Grupa Kapitałowa POLSKIE GÓRNICTWO NAFTOWE I GAZOWNICTWO SPÓŁKA AKCYJNA',
  data: { total: 0, items: [] }
}
```

Wynika to z własności wyszukiwarki `rejestr.io` która nie zwraca poprawnych wyników jeśli nazwy zawierają typ podmiotu, np rodzaj spółki

![](http://localhost:8484/65b96d96-1642-4588-9745-b4b30d09bffa.avif)

Po wycięciu `SPÓŁKA AKCYJNA` zobaczymy poprawne wyniki

![](http://localhost:8484/b2cc84a3-9822-450f-8ade-a92c2ecd7af8.avif)



Do naszej funkcji `getCompanies` aplikujemy poprawkę wycinającą typy podmiotów. Teraz funkcja ta przyjmie postać:

```
const getCompanies = (): string[] => {
    const rawDir = process.cwd() + `/raw`

    const companies = fs
        .readFileSync(rawDir + `/base.csv`)
        .toString()
        .split(`\n`)
        .map((line: string) => line.split(',')[1])
        .filter(line => line)
        .filter((line, index) => index)
        .map(name => name.replace(/(SPÓŁKA AKCYJNA)|(SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ)|(KOMANDYTOWA)/g,'').trim())

    companies.forEach(company => {
        chai.expect(company).to.be.a('string')
    })

    return companies;
}
```

W tej chwili cały skrypt celowo analizuje jedynie pierwszą firmę. Od pobrania danych dla wszystkich dzieli nas jedynie dopisanie jednej pętli. Jednak z doświadczenia wiemy, że dla niektórych firm będzie trzeba powtórzyć zapytanie, ponieważ prawdopodobnie w nazwach są błędy, albo wyszukiwarka nie zwróci poprawnego wyniku.

## Podłączenie do bazy i zapis wyników

Aby jednocześnie móc zapisać pobrane dane warto podłączyć system do bazy. Jest wiele dostępnych baz danych, ale do tego zadania preferuję `MongoDB` z uwagi na łatwość wykonywania w niej agregacji, prostotę eksportu do formatów `json` i `xlsx` oraz brak konieczności definiowania schematu.

Zainstalujemy sterowniki `node-js` dla mongo i bibliotekę do kolorowania wyników w konsoli:

```
npm i mongodb chalk @types/mongodb
```

Podłączenie do bazy wykonamy za pomocą kodu:

```
import fs from 'fs'
import chai from 'chai'
import axios from "axios";
import chalk from 'chalk';

import {MongoClient} from 'mongodb';

// const url = "mongodb://localhost:27017/krs";
const url = "";

const getDb = async ():Promise<any> => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, {useUnifiedTopology: true}, (err, db) => {
            if (err) reject(err);
            resolve(db)
        });
    })

}



const getCompanies = (): string[] => {
    const rawDir = process.cwd() + `/raw`

    const companies = fs
        .readFileSync(rawDir + `/base.csv`)
        .toString()
        .split(`\n`)
        .map((line: string) => line.split(',')[1])
        .filter(line => line)
        .filter((line, index) => index)
        .map(name => name.replace(/(SPÓŁKA AKCYJNA)|(SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ)|(KOMANDYTOWA)/g, '').trim())

    companies.forEach(company => {
        chai.expect(company).to.be.a('string')
    })

    return companies;
}

const main = async () => {
    const companies = getCompanies();

    const time0 = new Date().getTime();


    const db = await getDb()
    db.db("krs").collection('companies').createIndex({ name: 1 })

    for(let i = 0; i< companies.length; i++) {
        const company = companies[i];

        try {
            const {data} = await axios.get(`https://rejestr.io/api/v1/krs`, {
                    params: {
                        name: company
                    },
                    headers: {
                        Authorization: process.env.API_KEY
                    }
                }
            )

            await db.db("krs").collection('companies').insertOne({name: company, data})

            const time = (new Date().getTime()) - time0;

            if (data.total) {
                console.log(chalk.green(`${time}\t${i}\t${company}\t\t\t${data.total}`));
            } else {
                console.log(chalk.red(`${time}\t${i}\t${company}\t\t\t${data.total}`));
            }
        } catch (e) {
            console.log(chalk.red(e))
        }
    }
}

main().catch(console.error)

```

Okazuje się, że nie wszystkie firmy pobieramy prawidłowo:

![](http://localhost:8484/4385646c-7a67-4dce-9d0d-75a133f37b55.avif)

Powtarza się ten sam motyw co ze spółką akcyjną. `Grupa Kapitałowa` powoduje, że firma jest źle wyszukiwana. Podobnie `OPERATOR` występujące na końcu nazwy.

Po kilku poprawkach i wykluczeniu paru losowo wybranych nazw mamy około 15% odrzuceń. Baza firm przygotowywana była ręcznie i przez to konwencje nazw różnią się od tych oficjalnych w Rejestr.io.

Kolejne kolumny to:

* czas od włączenia programu
* numer porządkowy (liczony od 0)
* ilość firm dopasowanych w Rejestr.io

![](http://localhost:8484/e54a10bc-0572-4802-911e-ad529b7f31b6.avif)

O słabej jakości bazy świadczą takie kwiatki jak:

> [PRZEDSIĘBIORSTWO GOSPODARKI KOMUNALNEJ SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ](http://www.imsig.pl/szukaj/krs,45812,PRZEDSI%C4%98BIORSTWO_GOSPODARKI_KOMUNALNEJ_SP%C3%93%C5%81KA_Z_OGRANICZON%C4%84_ODPOWIEDZIALNO%C5%9ACI%C4%84)

Prawdopodobnie w prawie każdym szanującym się miasteczku mieści się firma o takiej nazwie.

Kod w tej chwili prezentuje się tak:

```
import fs from 'fs'
import chai from 'chai'
import axios from "axios";
import chalk from 'chalk';

import {MongoClient} from 'mongodb';

const url = process.env.MONGO_URI || '';

const getDb = async ():Promise<any> => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, {useUnifiedTopology: true}, (err, db) => {
            if (err) reject(err);
            resolve(db)
        });
    })

}



const getCompanies = (): string[] => {
    const rawDir = process.cwd() + `/raw`

    const companies = fs
        .readFileSync(rawDir + `/base.csv`)
        .toString()
        .split(`\n`)
        .map((line: string) => line.split(',')[1])
        .filter(line => line)
        .filter((line, index) => index)
        .map(name => name.replace(/(SPÓŁKA AKCYJNA)|(SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ)|(KOMANDYTOWA)|(^Grupa Kapitałowa)|(OPERATOR)|(-GRUPA GDF SUEZ ENERGIA POLSKA)|(S\.?A\.?)|(WARSZAWA)|(STOEN)|(Sp\. z o\.o\.)|(S\.K\.)|(G\.K\.)/ig, '').trim())

    companies.forEach(company => {
        chai.expect(company).to.be.a('string')
    })

    return [...new Set(companies)];
}

const main = async () => {
    const companies = getCompanies();

    const time0 = new Date().getTime();


    const db = await getDb()
    db.db("krs").collection('companies').createIndex({ name: 1 })

    for(let i = 0; i< companies.length; i++) {
        const company = companies[i];

        try {
            const existing = await db.db("krs").collection('companies').findOne({name: company})

            if(existing) {
                const time = (new Date().getTime()) - time0
                if (existing.data.total) {
                    console.log(chalk.yellow(`${time}\t${i}\t${existing.data.total}\t${company}\tSKIPPED`));
                } else {
                    console.log(chalk.red(`${time}\t${i}\t${existing.data.total}\t${company}`));
                }
                continue;
            }

            const {data} = await axios.get(`https://rejestr.io/api/v1/krs`, {
                    params: {
                        name: company
                    },
                    headers: {
                        Authorization: process.env.API_KEY
                    }
                }
            )

            await db.db("krs").collection('companies').insertOne({name: company, data})

            const time = (new Date().getTime()) - time0;

            if (data.total) {
                console.log(chalk.green(`${time}\t${i}\t${data.total}\t${company}`));
            } else {
                console.log(chalk.red(`${time}\t${i}\t${data.total}\t${company}`));
            }
        } catch (e) {
            console.log(chalk.red(e))
        }
    }
}

main().catch(console.error)

```

Jego mocne strony to:

* oszczędzamy requesty do API, jeśli mamy nazwę, która ma już dopasowania, to nie jest dalej przetwarzana.
* dane zapisywane są tak, aby nie było duplikatów

Niestety w pobranych danych nie ma kapitału zakładowego. Przykładowy obiekt ma dane:

![](http://localhost:8484/409ad8be-3c4f-45d6-a1b8-0d1d0a818c67.avif)

## Szczegółowe zapytania

Kolejnym krokiem będzie zapomnienie o firmach, których nie udało się zeskanować. Niektórych wyników jak `INSTYTUT CHEMII BIOORGANICZNEJ POLSKIEJ AKADEMII NAUK` nie da się uratować. Dopiero manualny research pozwala stwierdzić, że rejestr io zapisuje to jako `FUNDACJA ICHB PAN`, ale nie możemy nauczyć algorytmu poprawnego nazywania wszystkich firm z bazy.

Dlatego godząc się z tym, że pobraliśmy tylko część wyciągniemy konkretne numery KRS i identyfikatory firm i na tej podstawie zapytamy o dane szczegółowe.
