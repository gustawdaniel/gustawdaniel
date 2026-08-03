---
author: Daniel Gustaw
canonicalName: xss-attack-using-script-style-and-image
coverImage: https://preciselab.fra1.digitaloceanspaces.com/blog/img/7c750097-483e-409c-adba-7c3f66821283.avif
description: Learn how to infect a page using an XSS attack with script, style, or image tags. See how to replace page content with your own, even without JavaScript.
excerpt: Learn how to infect a page using an XSS attack with script, style, or image tags. See how to replace page content with your own, even without JavaScript.
publishDate: 2018-02-20 13:51:40+00:00
slug: en/xss-attack-using-script-style-and-image
tags:
- xss
- hacking
- attack
title: XSS Attack Using Script, Style, and Image Tags
updateDate: 2021-07-08 13:51:40+00:00
---

This article describes examples of XSS attacks. While using `<script>` tags is probably the most known vector, there are other possibilities. You can change the content of a website using an `<img>` tag or pure CSS.

This is educational material. Remember that hacking without authorization is illegal! :)

## Website Code

To present the attack, we create a simple website based on PHP. While separating logic and view in code is generally best practice, for simplicity and to minimize lines of code we place all website code in `index.php`. To create a vulnerable website, it must save user input to a database and display it on screen without filtering.

For simplicity and clarity, we abandon a full database and use a JSON file instead. The first file of our project is `db.json`:

> db.json

```json
["First comment","Second one"]
```

To save comments sent via PHP script:

> index.php

```php
<?php
$comments = json_decode(file_get_contents('db.json'));

if($_SERVER["REQUEST_METHOD"] === "POST") {
    $comments[] = $_POST["comment"];
    file_put_contents('db.json', json_encode($comments));
}
```

* Read the contents of `db.json` and parse it as a PHP array.
* Check if the user submitted a `POST` request (form submission).
* If yes:
  * Append the comment sent by the user to the array.
  * Overwrite `db.json` by JSON-encoding the updated array.

Regardless of the request method, the script proceeds to display the form and the list of comments:

> index.php

```php
echo '<form action="" method="post">
    <input type="text" name="comment">
    <input type="submit" value="send">
</form>
<ul>';

foreach ($comments as $comment) {
    echo "<li>".$comment."</li>";
}
echo '</ul>';
```

You can start it by command:

```bash
php -S localhost:8000
```

The created website looks like the following:

![](https://preciselab.fra1.digitaloceanspaces.com/blog/img/eb6cbfa1-de14-45e8-b5c0-aa9b8f33df89.avif)

It is fully functional, allowing users to add a comment, save it in JSON, and display the comment list. If users only intended to submit plain text, this would be the end of our story. But we must assume that at least one user will attempt to exploit the site. :)

## How to Hack It?

This flow of data—saving on the server and displaying on the client—makes XSS attacks possible if input is not properly sanitized. XSS stands for Cross-Site Scripting, enabling attackers to inject client-side scripts into web pages viewed by other users.

Injected executable code is interpreted by the browser, not the server, so we cannot compromise the server directly, but we can manipulate client-side behavior. Potential benefits for attackers include:

* Stealing session cookies – taking control over a victim's logged-in session.
* Dynamic modification of page content.
* Injecting a browser keylogger.

The payload script can be stored on the server or included in a malicious link. In our case, we want to save the payload script into `db.json` by submitting it as a comment. Our goal is to change the content of the website to "Hacked by Daniel". In each attack method presented below, the website will end up looking like this:

![](https://preciselab.fra1.digitaloceanspaces.com/blog/img/f24230e5-22d7-472d-b782-03adbba46806.avif)

### Script Tag

The simplest way is to append a `<script>` tag that dynamically changes the page content after loading. Try adding this comment:

```html
<script>document.querySelector('html').innerHTML="Hacked By Daniel"</script>
```

This code selects the `html` root element—meaning the whole page—and replaces its content using `innerHTML`.

### Style Tag

Another method works even if `<script>` tags are stripped and JavaScript is disabled in the browser:

```html
<style>html::before {content: "Hacked By Daniel";} body {display: none;}</style>
```

We define two styling rules. The first tells the browser to append the text `Hacked By Daniel` before the document body. The second hides the body completely.

### Image Tag

Blocking `<script>` and `<style>` tags in comments is not enough, because scripts can also be executed via event handlers in other HTML tags:

```html
<img src=undefined onerror='document.querySelector("html").innerHTML="Hacked By Daniel"'>
```

This element references an invalid image URL. When loading fails, the browser immediately executes the JavaScript code inside the `onerror` attribute.

## How to Defend?

To defend against this attack, we must sanitize user input and strip or escape HTML tags. We can update `index.php` as follows:

```diff
-      $comments[] = $_POST["comment"];
+      $comments[] = htmlspecialchars($_POST["comment"]);
```

After applying this fix, text entered into the form will be rendered literally on the page instead of being parsed as HTML tags:

![](https://preciselab.fra1.digitaloceanspaces.com/blog/img/42fe0eac-c6c6-4f93-b66e-bf2b68eb74fb.avif)

## Summary

We have shown simple examples of XSS attacks using different tags. Modern frameworks like Symfony or Laravel have built-in security mechanisms against XSS, but when writing raw PHP, always remember to use functions like `htmlspecialchars`.

