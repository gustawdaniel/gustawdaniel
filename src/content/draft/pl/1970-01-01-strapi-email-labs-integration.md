---
title: Konfiguracja wysyłki emaili w Strapi przez Emaillabs
slug: strapi-emaillabs
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2022-10-06T19:10:57.000Z
draft: true
canonicalName: strapi-email-labs-integration
---

[Strapi](https://strapi.io/) to wgodny CMS pozwalający wyklikać model danych i wygenerować na jego podstawie rest api oraz graphql.

![](http://localhost:8484/bd346aa0-be28-426a-aa3e-04a4e91914f0.avif)

[Emaillabs](https://emaillabs.io/) to polski serwis obsługujący wysyłkę e-maili.

![](http://localhost:8484/e75a7406-4771-4950-b527-bdc298ce6e68.avif)

## Wprowadzenie do strapi

Projekt tworzymy poleceniem

```bash
npx create-strapi-app@latest strapi-email --quickstart
```

Pod adresem `localhost:1337` tworzymy konto administratora. Następnie możemy pobrać jego token:

```httpie
http POST localhost:1337/admin/login email=gustaw.daniel@gmail.com password=Pass1234
```

możemy sprawdzić ustawienie e-maila zapytaniem

```httpie
http 'http://localhost:1337/email/settings' Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjU0OTQ2MDk5LCJleHAiOjE2NTc1MzgwOTl9.sy5AoNWE1fjcrNxjSFgteZHzxn097FyPlj-3D9e7ykw'
```

Jeśli interesuje Cię pełna lista dostępnych końcówek api możesz użyć CLI

```bash
npx strapi routes:list
```

## Provider Emaillabs

Nie ma on paczki w npm, ani tym bardziej wtyczki w Strapi, lecz mimo to, możemy skonfigurować strapi tak, żeby do wysyłek e-mail używać Emaillabs.

W pliku **package.json** dodajemy lokalną paczkę o nazwie zaczynającej się od `strapi-provider-email`. To ważne, bo dzięki temu strapi rozpoznaje, że chcemy nadpisywać wysyłkę emaili.

```json
{
  "dependencies": {
    "strapi-provider-email-emaillabs": "file:providers/strapi-provider-email-emaillabs",
  }
}
```

Konfugurację providera umieszczamy w `config/plugins.js` nazwa w polu `provider` musi pasować do ostatniego członu nazwy w `dependencies`. W opcjach instruujemy program, żeby podstawowych danych do integracji szukał w zmiennych środowiskowych, a w settings ustawiamy domyślne wartości dotyczące wysyłki.

```javascript
module.exports = ({ env }) => ({
  email: {
    provider: 'emaillabs',
    providerOptions: {
      smtp: env('EMAILLABS_SMTP'),
      apiKey: env('EMAILLABS_API_KEY'),
      secretKey: env('EMAILLABS_SECRET_KEY')
    },
    settings: {
      defaultFrom: 'office@preciselab.io',
      testAddress: 'gustaw.daniel@gmail.com',
      defaultName: 'Precise Lab'
    },
  },
});
```

Częstym błędem jest podanie tej samej domeny adresu nadawcy i odbiorcy. Nie można tak robić, bo wysyłka między tymi samymi domenami przez zewnętrznego dostawcę jakim jest Emaillabs może zostać zablokowana. Za adres testowy należy wybrać adres z innej domeny.

![](http://localhost:8484/926a4a8c-51f8-4280-8efe-21190294bab7.avif)

Sam kod naszego providera umieszczamy w pliku `providers/strapi-provider-email-emaillabs/index.js`

jest to implementacja `send`, która otrzymuje przekazywane przez strapi parametry i wykonuje wysyłkę. Wobec braku sdk od emailabs używamy axiosa do wysyłki żądania i qs do przetwarzania body.

```javascript
const axios = require("axios");
const qs = require('qs');

const sendByEmaillabs = async (providerOptions, settings, options) => {
  const url = "https://api.emaillabs.net.pl/api/sendmail_templates";

  const receiversObject = [options].reduce((p, n) => {
    return {
      ...p,
      [n.to]: {
        vars: {
          email: n.to
        }
      }
    }
  }, {})

  console.log(receiversObject);

  try {
    const response = await axios.post(url, qs.stringify({
      smtp_account: providerOptions.smtp,
      to: receiversObject,
      subject: options.subject,
      text: options.text,
      from: settings.defaultFrom,
      from_name: settings.defaultName,
    }), {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(providerOptions.apiKey + ":" + providerOptions.secretKey).toString("base64")
      }
    })

    return response.data;

  } catch (e) {
    console.log(e);
    throw e;
  }
}

module.exports = {
  init: (providerOptions = {}, settings = {}) => {
    return {
      send: async options => {
        return sendByEmaillabs(providerOptions, settings, options)
      },
    };
  },
};
```

Teraz możemy wysłać e-mail wstawiając do kontrolera

```
await strapi.plugins["email"].services.email.send({
      to: process.env.ADMIN_EMAIL,
      from: "office@preciselab.io",
      replyTo: `${entity.email}`,
      subject: `Zgłoszenie ze strony internetowej ${entity.studentName}`,
      text: `Wypełniono formularz zgłoszeniowy

| Imię i nazwisko ucznia  | ${entity.studentName}
| Data urodzenia          | ${entity.birthDate}
| Imię i nazwisko rodzica | ${entity.parentName}
| Telefon                 | ${entity.phone}
| E-mail                  | ${entity.email}

Adres:
${entity.address}

${
  entity.notes ??
  `Uwagi:
${entity.notes}`
}

       Data: ${entity.createdAt.toISOString()}`,
    });
```

Pełen interfejs pokazanej tu metody znajdziemy w dokumentacji strapi:

[Email - Strapi Developer Docs](https://docs.strapi.io/developer-docs/latest/plugins/email.html#configure-the-plugin)

Do `.env` dodajemy smtp i klucze api, `EMAILLABS_SMTP` znajdziemy na głównej stronie

![](http://localhost:8484/799dbb6f-19df-41a6-a04b-d8b80b43dae2.avif)

klucze api w zakładce "Administrator -> Api"

![](http://localhost:8484/6b273a58-4de6-44ae-973f-57fc51c8875f.avif)

Należy też pamiętać o autoryzacji nadawcy, żeby nasze e-maile dochodziły. Będzie to wymagało dodania odpowiednich rekordów w DNS, ale wykracza to poza zakres tego wpisu.

![](http://localhost:8484/fa5b0eae-a93a-4b35-ba1d-cfc343859b0a.avif)

Ponownie wysyłając zapytanie o konfigurację e-maila, które wysłaliśmy na początku

```
http 'http://localhost:1337/email/settings' Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwNDE1Mjk0OTE0OWU3NWE1Mjg0MmY4YyIsImlhdCI6MTY2NTA4MTc2MywiZXhwIjoxNjY3NjczNzYzfQ.7nCMQjGI9y5XNRtVaEpoc-oiiBm37Y27cHFpLNnudQo'
```

powinniśmy zobaczyć

```json
{
    "config": {
        "provider": "emaillabs",
        "settings": {
            "defaultFrom": "office@preciselab.io",
            "testAddress": "gustaw.daniel@gmail.com"
        }
    }
}
```

Przetestujmy to i przejdziemy do tematu załączników.

![](http://localhost:8484/c0a1f344-ad80-4f11-b853-5644983f0304.avif)

![](http://localhost:8484/9f743993-73c0-4099-824b-3d2b54c54007.avif)
