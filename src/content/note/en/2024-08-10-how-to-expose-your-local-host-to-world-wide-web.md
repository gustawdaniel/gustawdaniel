---
title: How to expose your local sever to world wide web?
publishDate: 2024-08-10
---
By default, you cannot connect directly from global network to you computer in local home network. To configure it you have to change router settings or setup tunnel. In this article we will show tunnel.

Install ngrok

```bash
yay -S ngrok
```

Login to ngrok page and get token

```bash
https://dashboard.ngrok.com/get-started/your-authtoken
```

you will see command like this

```bash
ngrok config add-authtoken xxx
```

now expose http on port

```bash
ngrok http http://localhost:41601
```