---
author: Daniel Gustaw
canonicalName: facebook-scraping-in-2021
coverImage: http://localhost:8484/034f0b84-4b65-4157-8de6-cc9f01220f4f.avif
description: The article aims to familiarize the reader with the method for scraping the Facebook portal after the layout update.
excerpt: The article aims to familiarize the reader with the method for scraping the Facebook portal after the layout update.
publishDate: 2021-04-23 19:49:00+00:00
slug: en/scraping-facebook-in-2021
tags:
- facebook
title: Scraping Facebook in 2021
updateDate: 2021-04-24 11:23:36+00:00
---

## Method of Stable Meta-Selectors Based on Styling

The article aims to familiarize the reader with the method for scraping the Facebook portal after the layout update. Knowledge of TypeScript or JavaScript, as well as an understanding of how CSS selectors work, is required. It shows a set of tools that solve the problem of building selectors in such a way that they are stable, using the example of scraping group members.

After the Cambridge Analytica scandal, after Zuckerberg's hearings before the US Senate, and after the introduction of GDPR, data scraping in social media is gradually becoming more difficult. Facebook is undoubtedly the leader in implementing security measures.

With only 2.3 billion active user accounts, approximately 6 billion fake accounts are removed annually. Interestingly, at such scale, I don't know anyone with a real account who has complained about baseless banning. This phenomenal precision is ensured for Facebook by the use of 20,000 coefficients that artificial intelligence uses to place users on a risk level map, indicating that the account does not belong to a real person.

The platform collects information about individuals who do not have accounts but exist and could potentially create them. It can also detect computer-generated images due to artifacts produced when artificially creating facial photos at the corners of the eyes.

All these actions serve two basic purposes:

* to harden the social network against automated, mass content posting
* to prevent automated downloading and processing of data available on the platform

The detection and banning of bots is accompanied by other actions, such as obfuscating the website's code. This technique involves replacing human-readable names and instructions with those that do not hinder reading and working with the source code.

An example of clean code, easy to understand for a programmer is:

```html
<form class="dismiss js-notice-dismiss" action="/users/16663028/dismiss_notice?notice_name=org_newbie" accept-charset="UTF-8" method="post"><input type="hidden" name="_method" value="delete">
```

While on Facebook, you can rather expect something like this:

```html
<div class="rq0escxv l9j0dhe7 du4w35lb j83agx80 cbu4d94t pfnyh3mw d2edcug0 hv4rvrfc dati1w0a"><div class="rq0escxv l9j0dhe7 du4w35lb j83agx80 cbu4d94t e5nlhep0 aodizinl">
```

The front-end of Facebook, which was available until recently, often featured attributes like `data-testId`, which were used as anchors for automated interface tests, but the new layout lacks them. Facebook engineers must have realized that these helpful hooks were being exploited by bot creators.

The DOM tree topology is also more fluid than one might expect, and building long selectors based on it:

```
div > div > div > div > div > div > div > div:nth-child(2) span[dir=auto] > a:nth-child(1)
```

is a labor-intensive and risky task.

---

Despite many difficulties, the bot creator is still not in a desperate position. The Facebook front-end is not rendered on a canvas using webassembly. If it were rewritten in Flutter, the problem would be really serious. However, with the type of obfuscation used on Facebook, one can cope with it using the following strategy.

1. We look not at class names but at their meaning - the styles assigned to them
2. We retrieve the current CSS of the Facebook page we are browsing and break it down into a map of classes and their styles
3. We build our stable meta selectors using styles, for example: `{display:block}` instead of `.d-block`.
4. We convert stable meta selectors into the form of correct temporary selectors that work for that specific page
5. We extract the data of interest without problems like in the good old days

It should be noted that some styles are repetitive, and we will find many classes that cause the same styling. Below I attach a histogram of the frequency of style duplication for selectors in Facebook's CSS code.

|Number of equivalent classes|Frequency|
|---|---|
|1|6475|
|2|304|
|3|65|
|4|22|
|5|12|
|6|5|
|7|5|
|8|2|
|10|1|
|15|1|
|19|1|
|21|1|
|25|1|

It is recommended to use those that do not duplicate, but handling the remaining cases only increases the number of possible combinations of temporary selectors, which does not seem like a significant cost, especially if we want to leverage the relationships between elements in the DOM tree in our selectors.

---

We now present the implementation of this concept in practice with an example. Our goal is to download the list of group members.

> [https://www.facebook.com/groups/1590278311045624/members](https://www.facebook.com/groups/1590278311045624/members)

![](https://preciselab.fra1.digitaloceanspaces.com/blog/fb-scraping-in-2020/leads.png)

On the list of people, we are looking for frames surrounding entire list elements and frames surrounding texts. Among them, we care about those that have a moderate number of classes. One is too few, as the selector would not be precise enough, 10 is too many, as despite precision, it might not be stable enough. An example of a working selector that structures this list looks like this.

We can start with such code that maps the name, context, description, and avatar of the person in the group.

```javascript
[...document.querySelectorAll('div.ue3kfks5.pw54ja7n.uo3d90p7.l82x9zwi.a8c37x1j')].map(e => ({
    name: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg div.nc684nl6>a').innerText,
    context: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg :nth-child(2)')?.innerText,
    description: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))
```

Unfortunately, while this code worked for me, you may have a problem with it because there is a good chance that Facebook has made an update changing the class names. That is why we want to create a meta-selector that will be an immutable source building selectors like this based on Facebook's CSS file.

This means that in order to solidify our code, we need to replace classes with their assigned styles. To do this, we look for the link to the first CSS file in the page source:

```scss
https://static.xx.fbcdn.net/rsrc.php/v3/yQ/l/0,cross/ArGQFhpa-mYIQaebMcDHPHgi1H0oF0i_rK0T6c_KgOBbWpC6CZY50c0PwrzoCWCCooTDwUJHUy3C2.css?_nc_x=JKmcfy-J-Ug
```

### TypeScript config

Next, we create a file `tsconfig.json` with the content

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "target": "ES2020",
    "moduleResolution": "node"
  }
}
```

The first property - `esModuleInterop` allows us to import according to the ES6 module specification of libraries that were CommonJS modules. For example, thanks to this flag, we can write:

```typescript
import fs from "fs";
```

instead of

```typescript
import * as fs from "fs";
```

or

```typescript
const fs = require("fs");
```

### Dependencies - Package.json

```json
{
  "name": "fb-scraping-tools",
  "version": "1.0.0",
  "description": "Set of tools created to make scraping facebook easy.",
  "author": "Daniel Gustaw",
  "license": "WTFPL",
  "dependencies": {
    "axios": "^0.21.0",
    "md5": "^2.3.0",
    "ts-node": "^9.0.0"
  },
  "devDependencies": {
    "@types/md5": "^2.2.1",
    "@types/node": "^14.14.6",
    "typescript": "^4.0.5"
  }
}
```

We see that we are using TypeScript here, we have downloaded some type definitions for syntax suggestions, besides that `axios` for sending http requests and `md5` for calculating checksums from `url` addresses.

### Decomposition of Facebook Styles

Now we will move on to the most interesting part, which is the decomposition of Facebook styles into a map of classes and styles and a reverse map assigning a collection of selectors to specific styles.

We start the `decompose_css_to_json.ts` file by importing the required packages:

```typescript
import axios from "axios";
import md5 from "md5";
import fs from "fs";
```

These are simple packages that we already described when discussing the dependency file. The next step will be defining the required types.

```typescript
type StringAccumulator = Record<string, string>
type ArrayAccumulator = Record<string, string[]>
```

Here the names speak for themselves, these will be types where we don't yet know the keys, but we know that the values are strings or arrays of strings. This is because the mapping of styles to selectors is multivalued.

The next step is to give the program a skeletal structure:

```typescript
const CACHE_DIR = process.cwd() + `/.cache`;
const url = `https://static.xx.fbcdn.net/rsrc.php/v3/yQ/l/0,cross/ArGQFhpa-mYIQaebMcDHPHgi1H0oF0i_rK0T6c_KgOBbWpC6CZY50c0PwrzoCWCCooTDwUJHUy3C2.css?_nc_x=JKmcfy-J-Ug`;

const main = async (): Promise<void> => {
   // there will be placed source code of next part
};

main().catch(e => {
    console.error(e);
})
```

In constants, we define the address of the Facebook styles file and the location of the cache directory. The next step is very predictable, we want to save the content of the file in the cache or read it from the cache if it has been saved previously. This way, we will make the program's operation independent of whether the link expires in the future and reduce the chance of being banned for too frequent requests. This is an important aspect of working on writing programs of this type.

```typescript
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR);
    }

    const name = md5(url);
    const path = `${CACHE_DIR}/${name}.css`;
    let text = '';
    if (fs.existsSync(path)) {
        text = fs.readFileSync(path).toString()
    } else {
        const {data} = await axios.get(url);
        text = data;
        fs.writeFileSync(path, text);
    }
```

Although important, it is not groundbreaking, and the only task of this code is to prepare the variable `path` with the path to the `css` file and `text` with its content.

A much more interesting part is the layout itself. It involves breaking down styles using regular expressions and then building two maps simultaneously.

```typescript
    const [styleToSelector, selectorToStyle]: [ArrayAccumulator, StringAccumulator] = text.match(/.*?\{.*?\}/g).reduce(
        (p: [ArrayAccumulator, StringAccumulator], n): [ArrayAccumulator, StringAccumulator] => {
            const [_, key, value]:string[] = n.match(/(.*?)\{(.*?)\}/);

            const cleanKey = key.replace(/^\}/,'')

            return [
                {...p[0], [value]: [cleanKey, ...(p[0][value] || [])]},
                {...p[1], [cleanKey]: value}
            ];
        }, [{}, {}]
    );
```

The variable `cleanKey` was introduced to deal with classes that appear after the character `}}`, which is possible in `css` files. Losing this `}` character from the value does not change anything because, for us, the values are just identifiers and not pieces of styling that we would implement anywhere.

In the end, we save the results in JSON files.

```typescript
    fs.writeFileSync(path.replace(/css$/, 'styleToSelector.json'), JSON.stringify(styleToSelector));
    fs.writeFileSync(path.replace(/css$/, 'selectorToStyle.json'), JSON.stringify(selectorToStyle));
```

We start the program with the command

```bash
npx ts-node decompose_css_to_json.ts
```

It does not print the results, but creates three files in the hidden directory `.cache`. The execution time of this program is about

### Building meta-selectors based on temporary selectors

A meta-selector is a selector in which class names are replaced by the styling rules identifying them. Creating meta-selectors is necessary for the code we write to be stable. The starting point for creating it is the selector written in the browser console.

We will call the program `generate_meta_selectors.ts`. In the standard layout of the script, we have a variable `input`. In it, we store the working query structuring the displayed Facebook page. Executing it in the browser console should return an array of objects corresponding to the participants of the Facebook group.

```typescript
import md5 from "md5";
import fs from "fs";

const input = `[...document.querySelectorAll('div.rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.pfnyh3mw.d2edcug0.aahdfvyu.tvmbv18p div.ue3kfks5.pw54ja7n.uo3d90p7.l82x9zwi.a8c37x1j:not([aria-busy])')].map(e => ({
    name: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg div.nc684nl6>a').innerText,
    link: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg div.nc684nl6>a').href,
    context: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg :nth-child(2)')?.innerText,
    description: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))`;

const CACHE_DIR = process.cwd() + `/.cache`;
const url = `https://static.xx.fbcdn.net/rsrc.php/v3/yQ/l/0,cross/ArGQFhpa-mYIQaebMcDHPHgi1H0oF0i_rK0T6c_KgOBbWpC6CZY50c0PwrzoCWCCooTDwUJHUy3C2.css?_nc_x=JKmcfy-J-Ug`;

const main = async (): Promise<void> => {
	// there will be next part of presented program
};

main().catch(e => {
    console.error(e);
})
```

Now to process random classes in selectors into stable meta-selectors, we retrieve the contents of the selector map file.

```typescript
    const name = md5(url);
    const path = `${CACHE_DIR}/${name}.selectorToStyle.json`;
    const selectorToStyle = JSON.parse(fs.readFileSync(path).toString())
```

We create a class array in two steps - by fetching strings in quotes, and then cutting eight-character strings of digits and letters preceded by a dot from them.

```typescript
    const classes = [...new Set(input.match(/'.*?'/g).join('').match(/\.\w{8}/g))];
```

Based on these classes and thanks to the map downloaded to the variable `selectorToStyle`, we can generate an array of substitutions.

```typescript
    const replaces: [string, string][] = classes.map(c => [c, `{${selectorToStyle[c]}}`]);
```

The value of this variable was in our example

```json
[
  [ '.rq0escxv', '{box-sizing:border-box}' ],
  [ '.l9j0dhe7', '{position:relative}' ],
  [ '.du4w35lb', '{z-index:0}' ],
  [ '.j83agx80', '{display:flex}' ],
  [ '.cbu4d94t', '{flex-direction:column}' ],
  [ '.pfnyh3mw', '{flex-shrink:0}' ],
  [ '.d2edcug0', '{max-width:100%}' ],
  [ '.aahdfvyu', '{margin-top:4px}' ],
  [ '.tvmbv18p', '{margin-bottom:4px}' ],
  [ '.ue3kfks5', '{border-top-left-radius:8px}' ],
  [ '.pw54ja7n', '{border-top-right-radius:8px}' ],
  [ '.uo3d90p7', '{border-bottom-right-radius:8px}' ],
  [ '.l82x9zwi', '{border-bottom-left-radius:8px}' ],
  [ '.a8c37x1j', '{display:block}' ],
  [ '.ew0dbk1b', '{margin-bottom:-5px}' ],
  [ '.irj2b8pg', '{margin-top:-5px}' ],
  [ '.nc684nl6', '{display:inline}' ]
]
```

At the end, we substitute classes with identifiers assigned to styles.

```typescript
    let out = input;

    replaces.forEach(r => {
        out = out.replace(new RegExp(r[0], 'g'), r[1])
    })
    console.log(out);
```

We see a really simple substitution due to the fact that each class always has a selector in the form of a style. This assumption could potentially be false, but Facebook uses minifying scripts that cleanse the HTML of meaningless classes.

Ultimately, the result of this program activated by the command

```bash
 npx ts-node generate_meta_selectors.ts
```

is the meta-selector text

```javascript
[...document.querySelectorAll('div{box-sizing:border-box}{position:relative}{z-index:0}{display:flex}{flex-direction:column}{flex-shrink:0}{max-width:100%}{margin-top:4px}{margin-bottom:4px} div{border-top-left-radius:8px}{border-top-right-radius:8px}{border-bottom-right-radius:8px}{border-bottom-left-radius:8px}{display:block}:not([aria-busy])')].map(e => ({
    name: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} div{display:inline}>a').innerText,
    link: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} div{display:inline}>a').href,
    context: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} :nth-child(2)')?.innerText,
    description: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))
```

As I announced, instead of classes, there are their meanings. Class names change, but meanings remain. Now it’s time to save this meta-selector as a constant element of our program, e.g., by embedding it in a plugin that will execute it at the appropriate moment on the Facebook page. For example, when the page is scrolled to the end and the interval.

```javascript
i = setInterval(() => window.scrollTo(0,document.body.scrollHeight), 1000);
```

stops increasing the value of `document.body.scrollHeight`,

However, we cannot execute this code directly because it contains invalid selectors. To be able to execute it, we need to reverse this operation. For this, we need a separate script.

### Recovering true and current selectors using meta-selectors

We create a file `generate_temp_selector.ts`. Familiar with how such files look, we will easily find our way in the part surrounding the body of the `main` function.

```typescript
import md5 from "md5";
import fs from "fs";

const metaSelector = `[...document.querySelectorAll('div{box-sizing:border-box}{position:relative}{z-index:0}{display:flex}{flex-direction:column}{flex-shrink:0}{max-width:100%}{margin-top:4px}{margin-bottom:4px} div{border-top-left-radius:8px}{border-top-right-radius:8px}{border-bottom-right-radius:8px}{border-bottom-left-radius:8px}{display:block}:not([aria-busy])')].map(e => ({
    name: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} div{display:inline}>a').innerText,
    link: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} div{display:inline}>a').href,
    context: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} :nth-child(2)')?.innerText,
    description: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))`;


const CACHE_DIR = process.cwd() + `/.cache`;
const url = `https://static.xx.fbcdn.net/rsrc.php/v3/yQ/l/0,cross/ArGQFhpa-mYIQaebMcDHPHgi1H0oF0i_rK0T6c_KgOBbWpC6CZY50c0PwrzoCWCCooTDwUJHUy3C2.css?_nc_x=JKmcfy-J-Ug`;

const main = async (): Promise<void> => {

};

main().catch(e => {
    console.error(e);
})
```

The input data for the program is again `url` and a string, this time named `metaSelector`. The purpose of the `main` function is to print the selector on the screen using the second map - the one that translates styles to selectors.

```typescript
    const name = md5(url);
    const path = `${CACHE_DIR}/${name}.styleToSelector.json`;
    const styleToSelector = JSON.parse(fs.readFileSync(path).toString())

    const selectors = [...new Set(metaSelector.match(/'.*?'/g).join('').match(/\{.*?\}/g))];
```

We start like last time, but this time we are looking for selectors, so we apply a slightly different regular expression and the second of the generated maps. Here we also want to create a replacement list, but it differs in type from the one used in the previous program.

```typescript
    const replaces: [string, string[]][] = selectors.map(c => {
        const key = c.replace(/^\{/, '').replace(/\}$/, '');
        return [
            c,
            styleToSelector[key].filter((c: string) => /^\.\w{8}$/.test(c))
        ]
    });
```

An example value of this variable is:

```json
[
  [ '{box-sizing:border-box}', [ '.ibamfamh', '.rq0escxv' ] ],
  [ '{position:relative}', [ '.jfde6mfb', '.l9j0dhe7' ] ],
  [ '{z-index:0}', [ '.du4w35lb' ] ],
  [ '{display:flex}', [ '.mmelxcy8', '.j83agx80' ] ],
  [ '{flex-direction:column}', [ '.pawmy52i', '.cbu4d94t' ] ],
  [ '{flex-shrink:0}', [ '.n0kn69sm', '.pfnyh3mw' ] ],
  [ '{max-width:100%}', [ '.d2edcug0' ] ],
  [ '{margin-top:4px}', [ '.aahdfvyu' ] ],
  [ '{margin-bottom:4px}', [ '.tvmbv18p' ] ],
  [ '{border-top-left-radius:8px}', [ '.ue3kfks5' ] ],
  [ '{border-top-right-radius:8px}', [ '.pw54ja7n' ] ],
  [ '{border-bottom-right-radius:8px}', [ '.uo3d90p7' ] ],
  [ '{border-bottom-left-radius:8px}', [ '.l82x9zwi' ] ],
  [ '{display:block}', [ '.a7hnopfp', '.a8c37x1j' ] ],
  [ '{margin-bottom:-5px}', [ '.ew0dbk1b' ] ],
  [ '{margin-top:-5px}', [ '.irj2b8pg' ] ],
  [ '{display:inline}', [ '.nc684nl6' ] ]
]
```

Unfortunately, due to the multivalued nature of this transformation, we cannot use a substitution as simple as last time. This time we decide to make compromises and write code that will remove all multivalued classes. We can accept this because, as we pointed out at the beginning, they represent a negligible percentage of all selectors used.

```typescript
let out = metaSelector;

replaces.forEach(r => {
    out = out.replace(new RegExp(r[0], 'g'), r[1].length === 1 ? r[1][0] : '')
})
console.log(out);
```

After executing the program with the command

```
npx ts-node generate_temp_selector.ts
```

we will get ready-to-use code for structuring a list of people from a Facebook group:

```javascript
[...document.querySelectorAll('div.du4w35lb.d2edcug0.aahdfvyu.tvmbv18p div.ue3kfks5.pw54ja7n.uo3d90p7.l82x9zwi:not([aria-busy])')].map(e => ({
    name: e.querySelector('.ew0dbk1b.irj2b8pg div.nc684nl6>a').innerText,
    link: e.querySelector('.ew0dbk1b.irj2b8pg div.nc684nl6>a').href,
    context: e.querySelector('.ew0dbk1b.irj2b8pg :nth-child(2)')?.innerText,
    description: e.querySelector('.ew0dbk1b.irj2b8pg :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))
```

### Analysis of Results

The length of the new selector is 513 characters compared to 639 for the input selector, but it works great. For the group we analyzed consisting of 4576 people, the automatic scrolling down procedure took 90 minutes.

![](http://localhost:8484/6b3b63c5-36d4-44af-868a-5519ca5466cb.svg)

The JSON data weighed 2.1 MB. After conversion to CSV format with the command:

```bash
jq -r '.[] | ([.name,.context,.description,.link,.img] | @csv)' .cache/crypto.json > .cache/crypto.csv
```

the created `.csv` was 1.9 MB. Almost half of this data consists of profile picture URLs, which are quite long, but usually work for a few hours to a few days after downloading, not longer, which is why I recommend adding them to the download queue via a separate process if we want to collect them. We can easily check this by creating a file that does not have them:

```bash
jq '.[] | {name:.name,context:.context,description:.description,link:.link}' .cache/crypto.json > .cache/crypto-no-img.json
```

And checking the size of the resulting file

```bash
du -ha .cache
332K    .cache/f3579000ff0b02d47dec7a17d043e454.selectorToStyle.json
360K    .cache/f3579000ff0b02d47dec7a17d043e454.styleToSelector.json
2.1M    .cache/crypto.json
1016K   .cache/crypto-no-img.json
336K    .cache/f3579000ff0b02d47dec7a17d043e454.css
1.9M    .cache/crypto.csv
6.0M    .cache
```

These avatars weigh 2.19 KiB and are 60x60 px in size. It’s easy to check the size distribution of different data types in scraping:

![](http://localhost:8484/86469a55-2b9d-4340-a523-4a1517759cfe.svg)

### Recommendation for Facebook Developers

Rewrite the service in flutter, scraping will become several orders of magnitude more expensive and practically unprofitable in many cases. Another simpler solution would be to increase the number of different classes that have the same style and mix them using randomizers that would cause random data to drop out from selectors based on those classes. Indeed, the CSS files would be heavier, but it would be a strong blow to the method I presented.

### Recommendation for Scrapers

The arms race in scraping is entering an increasingly interesting phase. Automation is still partially possible, but its expansion requires increasingly higher expenditures and research on replicating natural behavior for users, so that our scripts remain undetected despite increasingly sophisticated detection methods.

In my opinion, on accounts intended for scraping, it is worth conducting normal activities using real people at least to the extent that generating such natural activity interspersed with bot work can reduce the risk of classification as a bot and avoid captchas and account bans.

It should be remembered that such data collection is against Facebook's regulations, which state that we need written consent for this.

And since these are personal data processed without the owners' consent, it is against regulations such as the European GDPR known in Poland as RODO in certain parts of the world.

### Sources
