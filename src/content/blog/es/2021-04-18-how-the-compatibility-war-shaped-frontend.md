---
author: Daniel Gustaw
canonicalName: how-the-compatibility-war-shaped-frontend
coverImage: http://localhost:8484/e0ab5fe0-f28a-48c9-b055-ed3c3eb8a5cd.avif
description: Describimos cómo la desactualización y el mantenimiento de la compatibilidad hacia atrás han influido en la dirección del desarrollo de la tecnología web.
excerpt: Describimos cómo la desactualización y el mantenimiento de la compatibilidad hacia atrás han influido en la dirección del desarrollo de la tecnología web.
publishDate: 2021-04-22 18:51:16+00:00
slug: es/como-la-guerra-de-compatibilidad-formo-el-frontend
tags:
- compatibility
title: Cómo la guerra por la compatibilidad moldeó el frontend?
updateDate: 2021-04-2 18:51:16+00:00
---

Las versiones incompatibles de software o hardware han obstaculizado nuestras vidas diarias más de una vez. Quizás te has encontrado en situaciones o has notado:

* cómo, al pedirle a alguien un cargador de teléfono hace 10 años, tenía que establecerse si realmente encajaría
* cómo el BIOS fue suplantado por UEFI porque no soportaba el arranque de sistemas desde unidades mayores a 2TB
* cómo los juegos antiguos de la infancia causaban problemas en nuevos sistemas operativos
* cómo dos billeteras BTC podían mostrar diferentes saldos para la misma semilla

Como emprendedor, es posible que hayas enfrentado el desafío de migrar tu sistema de TI, o como programador, es posible que hayas luchado con errores provocados por la actualización de un paquete.

![](http://localhost:8484/89e36eaa-b1df-4048-b690-7942494408ad.avif)

Este artículo tiene como objetivo demostrar cómo la compatibilidad hacia atrás ha influido en la dirección de desarrollo de las tecnologías web.

Comprender los mecanismos que describiré te ayudará a prever mejor las tendencias en tecnologías y a optimizar las decisiones sobre en qué tecnología invertir.

**La guerra de la compatibilidad ha moldeado la web de hoy.**

El problema de la compatibilidad no es solo un inconveniente para las personas comunes, sino un asunto que influye significativamente en la dirección del desarrollo de la civilización. Es a través de esto, o por su ausencia, que ciertas tecnologías pueden prosperar mientras que otras son olvidadas.

Un ejemplo es la historia del desarrollo del frontend web, que describiré brevemente. Era el comienzo del milenio. Los desarrolladores de navegadores estaban inmersos en una feroz batalla por los clientes, tratando de atraerlos con funcionalidades cada vez más nuevas. Trabajaban de manera independiente, y cuando publicaban sus actualizaciones, los programadores aprendían las especificaciones introducidas por los navegadores y se frustraban cada vez más.

A menudo, se tenía que escribir código separado para cada navegador para realizar la misma tarea. ¡Algunos navegadores cambiaban su interfaz de programación varias veces incluso de versión a versión! Al escribir código, en lugar de preguntar por el ancho de la ventana, un programador primero verificaba con qué navegador estaba tratando y solo entonces ejecutaba los comandos apropiados de una larga lista de condiciones basadas en el navegador detectado.

![](http://localhost:8484/a05d33ed-5348-4ac0-959b-0df33e5f8823.avif)

En estas condiciones, surgió jQuery en 2005. Sirvió como una capa intermedia entre los desarrolladores web y los navegadores. Rápidamente ganó popularidad porque, aunque sobrecargaba a los navegadores, permitía a los desarrolladores escribir mucho menos código, asumiendo la responsabilidad de soportar navegadores antiguos. A medida que ganó popularidad, introdujo soluciones innovadoras, como ciertos selectores para buscar elementos en una página, que luego se convirtieron en permanentes en los estándares. Se crearon innumerables plugins para jQuery, y para 2012, se convirtió en una tecnología que todos los desarrolladores aprendían si querían crear sitios web.

Todos sabían que el código sin jQuery a menudo se ejecutaba significativamente más rápido, pero el inmenso éxito de jQuery demuestra cuán grande es la recompensa que espera a quienes resuelven el problema de la compatibilidad que surge cada vez que se construyen dinámicamente nuevas tecnologías.

La popularidad de jQuery comenzó a disminuir solo cuando quedó claro que los creadores de navegadores habían llegado a un acuerdo y organizado el proceso de implementación de recomendaciones de organizaciones de estandarización como el W3C. Esta organización, nacida de la cooperación del MIT y CERN con el apoyo de DARPA y la Comisión Europea, asegura que las tecnologías web sean compatibles y crea documentación para desarrolladores de lenguajes y navegadores. Construir esto de una manera reflexiva ahora permite lograr un objetivo mucho más desafiante: la compatibilidad hacia adelante. Esto significa que ahora los estándares web se diseñan de manera que los cambios posteriores no causen problemas en el funcionamiento de versiones anteriores.

Sin embargo, este no es el final de la historia. Puede que te estés preguntando qué ocurrió con las tecnologías web después de que jQuery se volviera gradualmente menos necesario.

![](http://localhost:8484/1c67ab75-ecb0-4267-b032-40e168750fe5.avif)

En 2013, el marco Angular Js, creado 4 años antes por Google, comenzó a ganar atención. Al mismo tiempo, Facebook anunció la creación de React. Ambas herramientas implementaron un paradigma declarativo para construir interfaces utilizando componentes sin estado. En resumen, el programador definía las condiciones que especificaban cómo debería funcionar el frontend, mientras que los componentes asumían la responsabilidad de la capa visual, permitiendo que el programador se centrara más en la lógica empresarial. En términos simples: ambos hicieron que escribir código fuera aún más rápido que con jQuery.

Angular Js comenzó siendo el primero y tenía una ventaja. Recuerdo estar asombrado al ver a mi amigo mostrarme una aplicación escrita en Angular Js por primera vez en 2015. Todo indicaba que valía más la pena aprender Angular Js que React.

En 2016, se lanzó Angular 2.0, eliminando el "Js" de su nombre. Inicialmente se pensaba que sería solo otra versión de Angular Js, pero las decisiones de diseño lo hicieron incompatible con la primera versión de Angular Js. Esto generó una gran controversia desde el principio. De manera similar, fue controvertido que a partir de ese momento, se lanzarían nuevas versiones cada seis meses, y la compatibilidad hacia atrás solo se mantendría para las dos últimas versiones.

Los marcos web crecieron rápidamente, y el año 2017 se convirtió en el año de la pregunta "¿Qué nuevo marco aprenderé hoy?". En la escuela de programación donde enseñé, se planteó la pregunta: "¿Qué marco deberíamos enseñar a nuestros estudiantes?". Su fundador eligió React. La compatibilidad hacia atrás fue un factor significativo en esa decisión.

Es fácil adivinar que muchos creadores de materiales educativos querían que los cursos producidos una vez siguieran siendo rentables por más tiempo. Muchos programadores querían aprender una herramienta que funcionara de la misma manera un año después y que no provocara un aumento de los costos de mantenimiento con las actualizaciones.

En 2017, un año después del abuso de Angular de la confianza construida a través de la compatibilidad hacia atrás, React superó a Angular y nunca renunció a esa ventaja.

¿Qué lección se puede extraer de esta historia? Que la compatibilidad es uno de los factores clave que debe tomarse en serio al analizar o planificar el desarrollo de tecnología.

Fuentes para una lectura adicional:

Compatibilidad a través del ejemplo de los monitores

[https://www.eizo.pl/baza-wiedzy/od-displayport-po-d-sub-przeglad-zlaczy-wideo-w-monitorach-lcd/](https://www.eizo.pl/baza-wiedzy/od-displayport-po-d-sub-przeglad-zlaczy-wideo-w-monitorach-lcd/)

La Comisión Europea quiere obligar a Apple a abandonar Lightning en los iPhones

[https://www.spidersweb.pl/2018/08/iphone-ladowarka-lightning.html](https://www.spidersweb.pl/2018/08/iphone-ladowarka-lightning.html)

Problemas con BIOS y unidades

[https://itfocus.pl/dzial-it/storage/duze-dyski-duze-klopoty/](https://itfocus.pl/dzial-it/storage/duze-dyski-duze-klopoty/)

Historia del W3C

[https://www.tlumaczenia-angielski.info/w3c/history.html](https://www.tlumaczenia-angielski.info/w3c/history.html)
