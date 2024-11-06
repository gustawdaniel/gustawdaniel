---
author: Daniel Gustaw
canonicalName: wordpress-scraping
coverImage: http://localhost:8484/8a96e11b-a834-413b-a886-3b5eb059ba3e.avif
description: No es común que la ejecución de un servicio tome más tiempo que su precio, pero con el scraping, esto puede suceder. Vea lo fácil que puede ser recuperar datos, especialmente de WordPress.
excerpt: No es común que la ejecución de un servicio tome más tiempo que su precio, pero con el scraping, esto puede suceder. Vea lo fácil que puede ser recuperar datos, especialmente de WordPress.
publishDate: 2021-04-19 12:14:43+00:00
slug: es/raspado-de-wordpress
tags:
- wordpress
- scraping
title: Raspado de WordPress - 4300 fallos judiciales en demandas por tipo de cambio sin una línea de código
updateDate: 2021-04-19 12:18:07+00:00
---

## Lo que necesitaba el cliente:

![](http://localhost:8484/7a238f0e-5274-43d1-abb9-24f9cbf45bad.avif)

Gracias al plugin Wappalyzer, podemos leer que es WordPress - una tecnología antigua que suele ser amigable con el scraping, ya que su elección indica una falta de fondos para cualquier acción anti-scraping.

La tabla se recarga en tiempo real. La paginación no cambia las URL. Esta es una solución típica para el paquete `datatable` que es un plugin de `jquery`.

[https://datatables.net/](https://datatables.net/)

En la página de este plugin, encontraremos la misma tabla, solo con estilos ligeramente modificados:

![](http://localhost:8484/8c945eb6-3854-4054-a3b2-b3282411e363.avif)

Estas son pistas suficientes para sugerir que los datos de la tabla se cargan desde un solo endpoint. Un análisis rápido del tráfico de red no muestra nada interesante, pero mostrar el código fuente de la página sí:

![](http://localhost:8484/43d4180b-e8ae-4b4d-b8a6-1b5962d3e929.avif)

El resto del servicio consistía simplemente en seleccionar esas pocas miles de líneas de texto y guardarlas en un archivo `json`. Potencialmente para la comodidad del usuario final, conversión a `csv` o `xlsx`, por ejemplo en la página

[JSON a CSV - CSVJSON](https://csvjson.com/json2csv)

![](http://localhost:8484/2ae82148-8458-4caa-bb30-2376d9db19d8.avif)

Enlaces a los datos descargados:

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json)

[https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json.xlsx](https://preciselab.fra1.digitaloceanspaces.com/blog/scraping/pc.json.xlsx)

Al final, me gustaría enfatizar que aunque el acceso a estos datos es gratuito, las personas que trabajan en su estructuración lo hacen de forma voluntaria para lograr el objetivo establecido por la asociación:

> B) recolectar información sobre prácticas injustas de emprendedores y otros casos de violaciones legales por estas entidades, y desarrollar y compartir públicamente información, artículos, informes y opiniones al respecto.

[https://rejestr.io/krs/573742/stowarzyszenie-stop-bankowemu-bezprawiu](https://rejestr.io/krs/573742/stowarzyszenie-stop-bankowemu-bezprawiu)

Si deseas beneficiarte de su trabajo, te animo a apoyarlos en su sitio web

[https://www.bankowebezprawie.pl/darowizna/](https://www.bankowebezprawie.pl/darowizna/)

![](http://localhost:8484/81b9771e-640d-4a50-997c-1018220a7158.avif)
