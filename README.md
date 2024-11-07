# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
|:--------------------------|:-------------------------------------------------|
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

/content/images/size/w300/2022/01/209_159470772.jpg 300w,
/content/images/size/w600/2022/01/209_159470772.jpg 600w,
/content/images/size/w1000/2022/01/209_159470772.jpg 1000w,
/content/images/size/w2000/2022/01/209_159470772.jpg 2000w

Other blogs:

https://techsquidtv.com/contact/
https://bepyan.me/en/craft

Selector to debug

```xsl
<xsl:for-each select="*">
    <xsl:value-of select="name()"/> 
    <xsl:text>, </xsl:text>
</xsl:for-each>
```


```css
body {
    font-family: sans-serif;
    font-size: 16px;
    color: #242628;
}
a {
    color: #000;
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
table {
    border: none;
    border-collapse: collapse;
    width: 100%
}
th {
    text-align: left;
    padding-right: 30px;
    font-size: 11px;
}
thead th {
    border-bottom: 1px solid #7d878a;
    cursor: pointer;
}
td {
    font-size:11px;
    padding: 5px;
}
tr:nth-child(odd) td {
    background-color: rgba(0,0,0,0.04);
}
tr:hover td {
    background-color: #e2edf2;
}

#content {
    margin: 0 auto;
    padding: 2% 5%;
    max-width: 800px;
}

.desc {
    margin: 18px 3px;
    line-height: 1.2em;
}
.desc a {
    color: #5ba4e5;
}
```

https://ucarecdn.com
http://localhost:8484

Real dates of drafts

```
2016-11-29-logowanie-danych-w-mysql-ajax-i-behat.md
2016-11-30-wizualizacja-dynamicznej-sieci-korelacyjnej.md
2016-12-02-tesseract-ocr-i-testowanie-selektów.md
2016-12-08-testowanie-szybkości-selektów.md
2016-12-11-analiza-logów-apache-z-goaccess.md
2016-12-24-kompilacja-interpretera-php-7-w-bunsenlabs.md
2017-01-17-aplikacja-z-fosuserbundle-i-api-google-maps.md
2017-02-13-analiza-wydajności-pustych-pętli-w-16-językach.md
2017-02-14-pomiar-ilości-tekstu-i-kodu-w-moich-wpisach.md
2017-06-16-instalacja-odnawialnego-certyfikatu-tls.md
2017-08-05-scrapowanie-danych-w-języku-perl.md
2018-02-13-fetch-promise-oraz-string-templates.md
2018-02-20-xss-attack-using-script-style-and-image.md
2018-02-21-snake-game-in-javascript-part-1-objects.md
2018-03-19-snake-game-in-javascript-part-2-events.md
2018-03-20-snake-game-in-javascript-part-3-vue.md
2018-07-08-measuring-the-amount-of-text-and-code-in-my-blog-posts.md
2019-07-08-badanie-wydajności-insertów-mysql.md
```

In scripts

```
caddy run
```

TODO:
- [ ] add projects page
- [ ] polish link fix replace (Nie będziemy się skupiać na tej części kodu. Jeśli jesteś tym zainteresowany i znasz język polski, napisałem artykuł na temat terraform tutaj:) by link per language



Images: https://cloud.digitalocean.com/spaces/preciselab?path=blog%2Fimg%2F&i=d27b97

```bash
s3cmd put --acl-public src/assets/images/* s3://preciselab/blog/img/
```

On deploy replace all

http://localhost:8484

by

http://fra1.digitaloceanspaces.com/preciselab/blog/img

Replace all img links

```bash
find src -type f -exec sed -i 's|http://localhost:8484|http://preciselab.fra1.digitaloceanspaces.com/blog/img|g' {} +
```