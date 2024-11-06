---
author: Daniel Gustaw
canonicalName: bolt-always-lite-mitm-proxy-insomnia-and-vue
coverImage: http://localhost:8484/cd38117c-276f-4c95-9ea8-3eb55e806e87.avif
description: hack que permite ordenar bolt lite utilizando un ataque "hombre en el medio" en la aplicación
excerpt: hack que permite ordenar bolt lite utilizando un ataque "hombre en el medio" en la aplicación
publishDate: 2021-07-21 13:53:53+00:00
slug: es/bolt-siempre-ligero-mitm-proxy-e-insomnio
tags:
- attack
- hacking
- bolt
- vue
- MITM
title: Bolt (siempre) Lite - MITM, Proxy, Insomnio y Vue
updateDate: 2021-08-15 23:22:00+00:00
---

¡Hola!

Esta es la primera parte sobre cómo hicimos que el pedido de Bolt Lite siempre fuera posible. En esta parte discutiremos el uso práctico del ataque Man In The Middle (MITM) y el proxy a través del PC.

## **Fijación de Certificado**

Dado que la aplicación Bolt no utiliza un mecanismo conocido como Fijación de Certificado, debería ser un trabajo fácil capturar todos los datos enviados en los paquetes. Google ha estado sugiriendo implementar CP a todos los desarrolladores desde hace un tiempo, pero pocos desarrolladores todavía lo utilizan. Entre las aplicaciones que uso con más frecuencia, solo es utilizado por bancos y criptobolsas. Si hubiera fijación de certificado en la aplicación Bolt, la aplicación parecería desconectada de Internet al espiar. Aun así, es posible conectarse con la API cuando la fijación de certificado está en su lugar, pero implica algún tipo de ingeniería inversa de APK. Si estás interesado en cómo hacerlo, lee un excelente artículo de @XeEaton y después de que hayas terminado de parchear el APK, vuelve a mi artículo.

[Ingeniería inversa y eliminación de la fijación de certificado de Pokémon GO | Eaton Works](https://eaton-works.com/2016/07/31/reverse-engineering-and-removing-pokemon-gos-certificate-pinning/)

## **Proxy MITM**

Para espiar los paquetes enviados por la aplicación Bolt para Android, utilizaremos mitmproxy, que es un proyecto de código abierto.

[mitmproxy - un proxy HTTPS interactivo](https://mitmproxy.org/)

Si tu versión de Android es superior a Nougat (Android 7), lo cual probablemente sea el caso ya que eres un mega geek y estás leyendo este artículo, también necesitarás:

* dispositivo Android con root
* Framework Xposed instalado
* Módulo JustTrustMe ([https://github.com/Fuzion24/JustTrustMe](https://github.com/Fuzion24/JustTrustMe)) habilitado

Después de instalar mitmproxy en tu PC de red local, ejecuta el comando:

```
mitmweb (or mitmproxy if you love CLIs)
```

Mostrará el puerto en el que está escuchando (8080 por defecto). Ve a la configuración de red de tu dispositivo Android y escríbelo en "Proxy". A partir de ahora, puedes esnifar los paquetes, tal como lo harías en las herramientas de desarrollo de Google Chrome.

## **Forma alternativa: HTTPCanary**

GuoShi hizo un trabajo increíble y una hermosa aplicación de Android que te permite esnifar paquetes en tiempo real. Desafortunadamente, no pude encontrar la manera de acceder a los registros desde tu PC en tiempo real, pero aún así es un trabajo fácil introducirlos en Insomnia para pruebas.

## **Insomnia**

Después de capturar todas las solicitudes necesarias, procedí a Insomnia para verificar cuáles necesito.

### **Creando viajes**

La API de Bolt, aunque no es pública, tiene códigos de error muy descriptivos como:

![](http://localhost:8484/f1448226-f620-4b89-846f-5b11ac381211.avif)

Te encontrarás con tales errores a menudo - ¡lo más importante es escucharlos!

Por eso sabía que necesitábamos dar un paso atrás y buscar primero opciones de taxi para obtener el hash de bloqueo de precio y el id de categoría (Bolt, Lite, Mascotas...), que se enviarán con una consulta para crear un viaje.

### **Buscando opciones de taxi**

![](http://localhost:8484/91e0520b-03f7-4f91-923e-59a732c25770.avif)

Enviar una carga así nos devuelve la lista de tarifas posibles y categorías de Bolt disponibles:

![](http://localhost:8484/4782afcb-fec5-43b5-817b-41ea04ddccac.avif)

Lo intrigante es que también obtenemos el parámetro "surge\_multiplier", que no es visible en la aplicación. ¡Genial!

## **Flujo de solicitudes**

![](http://localhost:8484/93e25608-e518-4c95-94d1-45ba8cfecba9.avif)

## **Consultas de solicitud constantes**

Después de un análisis cuidadoso de las 4 solicitudes (creación de un viaje, cancelación de un viaje, obtención de autos disponibles y consulta del estado actual de la aplicación), es bastante fácil notar que hay algunos parámetros que conciernen a cada una de las consultas:

```
gps_lat: current latitude
gps_lng: current longitude
session_id: must not be null - doesn't really matter
user_id: string of numbers identifying user
country: current country
language: user language
deviceType: in my case "android"
version: in my case "CA.7.01"
deviceId: unique deviceId string generated
device_name: string including android device model number - probably for statistical purposes
device_os_version: android version (in my case 10)
```

Refactorizaremos esto como un objeto y configuraremos axios para que estos datos se envíen con cada solicitud como una consulta adicional.

## **Elección de la pila tecnológica**

Como hacemos frecuentemente en nuestra casa de software, utilizaremos Vue con Nuxt para el frontend. Para el backend, utilizaremos nuestro proxy CORS de Precise Lab.

## **Problema de tarjeta denegada**

A veces, cuando creas un nuevo viaje, bolt lanza aleatoriamente un error de autorización de tarjeta de crédito, lo que parece un error en su API. Simplemente lo `try {} catch {}` y esperaremos el error, lo afirmaremos y repetiremos la creación de un nuevo viaje. Nunca ocurre la segunda vez consecutiva, así que estamos bien con esa solución.

## **Haciéndolo más interesante**

Como último paso, me encargaré de mostrar el estado actual del viaje al usuario final y proporcionarle un mapa exacto para que pueda asegurarse de que eligió los puntos de recogida y entrega correctos. No hay necesidad de seguimiento de conductor en tiempo real porque puedes hacerlo en la aplicación como lo harías normalmente; sin embargo, esto podría añadirse fácilmente, ya que cuando el viaje ha sido confirmado por el conductor, obtienes las coordenadas del coche e incluso la orientación del coche (así es como la aplicación de bolt muestra coches haciendo acrobacias y derrapando) en cada solicitud de estado de viaje.

## **Talón de Aquiles**

¡Así que está desplegado y puedes usarlo! ¡Yay!  
El único problema es que aún necesitas obtener tu clave API. Lamentablemente, no podrás encontrarla en la configuración de tu aplicación Bolt. Para obtenerla, necesitas analizar las solicitudes que tu aplicación envía y, para hacer eso, necesitas HTTP Canary o otro analizador de paquetes del que escribí en la primera parte de esta aventura de hackeo de bolt. La buena noticia es que tu token de API de bolt es válido indefinidamente (o al menos por un tiempo muy largo).  
¿Quizás podríamos obtener este token con la aplicación web de bolt?  
Hay una aplicación móvil web de bolt, pero lamentablemente, realmente no funciona en ninguna parte:

![](http://localhost:8484/5727bb63-8155-4a8c-a3ea-76b298e091ce.avif)

Una triste alerta que recibirás cada vez que muevas el pin de recogida en m.bolt.eu.

Y si miras las solicitudes HTTP que se envían de ida y vuelta:

![](http://localhost:8484/a79b67c9-8fe9-45d9-8e98-4166d0281d01.avif)

¡Eso es casi todo! ¡Gracias por leer, amigos!
