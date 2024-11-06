---
author: Daniel Gustaw
canonicalName: facebook-scraping-in-2021
coverImage: http://localhost:8484/034f0b84-4b65-4157-8de6-cc9f01220f4f.avif
description: El artículo tiene como objetivo familiarizar al lector con el método para extraer datos del portal de Facebook después de la actualización del diseño.
excerpt: El artículo tiene como objetivo familiarizar al lector con el método para extraer datos del portal de Facebook después de la actualización del diseño.
publishDate: 2021-04-23 19:49:00+00:00
slug: es/raspado-de-facebook-en-2021
tags:
- facebook
title: Raspado de Facebook en 2021
updateDate: 2021-04-24 11:23:36+00:00
---

## Método de Meta-Selectores Estables Basados en Estilos

El artículo tiene como objetivo familiarizar al lector con el método para raspar el portal de Facebook después de la actualización del diseño. Se requiere conocimiento de TypeScript o JavaScript, así como una comprensión de cómo funcionan los selectores CSS. Muestra un conjunto de herramientas que resuelven el problema de construir selectores de manera que sean estables, utilizando el ejemplo de raspar miembros de grupos.

Después del escándalo de Cambridge Analytica, después de los interrogatorios de Zuckerberg ante el Senado de EE. UU., y tras la introducción del GDPR, el raspado de datos en redes sociales se está volviendo gradualmente más difícil. Facebook es, sin duda, el líder en la implementación de medidas de seguridad.

Con solo 2.3 mil millones de cuentas de usuario activas, se eliminan aproximadamente 6 mil millones de cuentas falsas anualmente. Curiosamente, a tal escala, no conozco a nadie con una cuenta real que se haya quejado de prohibiciones infundadas. Esta precisión fenomenal es asegurada para Facebook por el uso de 20,000 coeficientes que la inteligencia artificial utiliza para colocar a los usuarios en un mapa de niveles de riesgo, indicando que la cuenta no pertenece a una persona real.

La plataforma recoge información sobre individuos que no tienen cuentas pero existen y podrían potencialmente crearlas. También puede detectar imágenes generadas por ordenador debido a artefactos producidos al crear artificialmente fotos faciales en las esquinas de los ojos.

Todas estas acciones sirven a dos propósitos básicos:

* endurecer la red social contra publicaciones automatizadas y masivas de contenido
* prevenir la descarga y procesamiento automatizados de datos disponibles en la plataforma

La detección y prohibición de bots va acompañada de otras acciones, como la ofuscación del código del sitio web. Esta técnica consiste en reemplazar nombres e instrucciones legibles para humanos por aquellos que no obstaculizan la lectura y el trabajo con el código fuente.

Un ejemplo de código limpio, fácil de entender para un programador es:

```html
<form class="dismiss js-notice-dismiss" action="/users/16663028/dismiss_notice?notice_name=org_newbie" accept-charset="UTF-8" method="post"><input type="hidden" name="_method" value="delete">
```

Mientras estás en Facebook, puedes esperar algo como esto:

```html
<div class="rq0escxv l9j0dhe7 du4w35lb j83agx80 cbu4d94t pfnyh3mw d2edcug0 hv4rvrfc dati1w0a"><div class="rq0escxv l9j0dhe7 du4w35lb j83agx80 cbu4d94t e5nlhep0 aodizinl">
```

El front-end de Facebook, que estuvo disponible hasta hace poco, a menudo presentaba atributos como `data-testId`, que se utilizaban como anclajes para pruebas automatizadas de interfaz, pero el nuevo diseño carece de ellos. Los ingenieros de Facebook deben haberse dado cuenta de que estos ganchos útiles estaban siendo explotados por los creadores de bots.

La topología del árbol DOM también es más fluida de lo que uno podría esperar, y construir selectores largos en base a esto:

```
div > div > div > div > div > div > div > div:nth-child(2) span[dir=auto] > a:nth-child(1)
```

es una tarea que requiere mucho trabajo y es arriesgada.

---

A pesar de muchas dificultades, el creador del bot aún no se encuentra en una posición desesperada. El front-end de Facebook no se renderiza en un lienzo utilizando webassembly. Si se reescribiera en Flutter, el problema sería realmente serio. Sin embargo, con el tipo de ofuscación utilizada en Facebook, se puede hacer frente a ello utilizando la siguiente estrategia.

1. No miramos los nombres de las clases, sino su significado: los estilos asignados a ellas
2. Recuperamos el CSS actual de la página de Facebook que estamos navegando y lo desglosamos en un mapa de clases y sus estilos
3. Construimos nuestros selectores meta estables utilizando estilos, por ejemplo: `{display:block}` en lugar de `.d-block`.
4. Convertimos los selectores meta estables en la forma de selectores temporales correctos que funcionan para esa página específica
5. Extraemos los datos de interés sin problemas como en los buenos viejos tiempos

Cabe señalar que algunos estilos son repetitivos, y encontraremos muchas clases que causan el mismo estilo. A continuación, adjunto un histograma de la frecuencia de duplicación de estilos para selectores en el código CSS de Facebook.

|Número de clases equivalentes|Frecuencia|
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

Se recomienda utilizar aquellas que no se duplican, pero manejar los casos restantes solo aumenta el número de combinaciones posibles de selectores temporales, lo que no parece ser un costo significativo, especialmente si queremos aprovechar las relaciones entre los elementos en el árbol DOM en nuestros selectores.

---

Ahora presentamos la implementación de este concepto en la práctica con un ejemplo. Nuestro objetivo es descargar la lista de miembros del grupo.

> [https://www.facebook.com/groups/1590278311045624/members](https://www.facebook.com/groups/1590278311045624/members)

![](https://preciselab.fra1.digitaloceanspaces.com/blog/fb-scraping-in-2020/leads.png)

En la lista de personas, estamos buscando marcos que rodeen elementos de la lista completos y marcos que rodeen textos. Entre ellos, nos preocupan aquellos que tienen un número moderado de clases. Uno es demasiado poco, ya que el selector no sería lo suficientemente preciso, 10 es demasiado, ya que a pesar de la precisión, podría no ser lo suficientemente estable. Un ejemplo de un selector que funciona y estructura esta lista se ve así.

Podemos comenzar con un código que mapea el nombre, contexto, descripción y avatar de la persona en el grupo.

```javascript
[...document.querySelectorAll('div.ue3kfks5.pw54ja7n.uo3d90p7.l82x9zwi.a8c37x1j')].map(e => ({
    name: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg div.nc684nl6>a').innerText,
    context: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg :nth-child(2)')?.innerText,
    description: e.querySelector('.j83agx80.cbu4d94t.ew0dbk1b.irj2b8pg :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))
```

Desafortunadamente, aunque este código funcionó para mí, puede que tengas un problema con él porque hay una buena probabilidad de que Facebook haya hecho una actualización cambiando los nombres de las clases. Por eso queremos crear un meta-selector que será una fuente inmutable construyendo selectores como este basado en el archivo CSS de Facebook.

Esto significa que para solidificar nuestro código, necesitamos reemplazar las clases con sus estilos asignados. Para hacer esto, buscamos el enlace al primer archivo CSS en el código fuente de la página:

```scss
https://static.xx.fbcdn.net/rsrc.php/v3/yQ/l/0,cross/ArGQFhpa-mYIQaebMcDHPHgi1H0oF0i_rK0T6c_KgOBbWpC6CZY50c0PwrzoCWCCooTDwUJHUy3C2.css?_nc_x=JKmcfy-J-Ug
```

### Configuración de TypeScript

A continuación, creamos un archivo `tsconfig.json` con el contenido

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "target": "ES2020",
    "moduleResolution": "node"
  }
}
```

La primera propiedad - `esModuleInterop` nos permite importar según la especificación de módulos ES6 de bibliotecas que eran módulos CommonJS. Por ejemplo, gracias a esta bandera, podemos escribir:

```typescript
import fs from "fs";
```

en lugar de

```typescript
import * as fs from "fs";
```

o

```typescript
const fs = require("fs");
```

### Dependencias - Package.json

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

Vemos que estamos usando TypeScript aquí, hemos descargado algunas definiciones de tipo para sugerencias de sintaxis, además de eso `axios` para enviar solicitudes http y `md5` para calcular sumas de comprobación de direcciones `url`.

### Descomposición de Estilos de Facebook

Ahora pasaremos a la parte más interesante, que es la descomposición de los estilos de Facebook en un mapa de clases y estilos y un mapa inverso que asigna una colección de selectores a estilos específicos.

Comenzamos el archivo `decompose_css_to_json.ts` importando los paquetes requeridos:

```typescript
import axios from "axios";
import md5 from "md5";
import fs from "fs";
```

Estos son paquetes simples que ya describimos al hablar del archivo de dependencias. El siguiente paso será definir los tipos requeridos.

```typescript
type StringAccumulator = Record<string, string>
type ArrayAccumulator = Record<string, string[]>
```

Aquí los nombres hablan por sí mismos, estos serán tipos donde aún no conocemos las claves, pero sabemos que los valores son cadenas o arreglos de cadenas. Esto se debe a que el mapeo de estilos a selectores es multivaluado.

El siguiente paso es darle al programa una estructura esquelética:

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

En constantes, definimos la dirección del archivo de estilos de Facebook y la ubicación del directorio de caché. El siguiente paso es muy predecible, queremos guardar el contenido del archivo en la caché o leerlo de la caché si ha sido guardado previamente. De esta manera, haremos que el funcionamiento del programa sea independiente de si el enlace expira en el futuro y reduciremos la posibilidad de ser baneados por solicitudes demasiado frecuentes. Este es un aspecto importante de trabajar en la escritura de programas de este tipo.

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

Aunque es importante, no es innovador, y la única tarea de este código es preparar la variable `path` con la ruta al archivo `css` y `text` con su contenido.

Una parte mucho más interesante es el diseño en sí. Implica descomponer estilos utilizando expresiones regulares y luego construir dos mapas simultáneamente.

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

La variable `cleanKey` se introdujo para manejar clases que aparecen después del carácter `}}`, lo cual es posible en archivos `css`. Perder este carácter `}` del valor no cambia nada porque, para nosotros, los valores son solo identificadores y no piezas de estilo que implementaríamos en ningún lugar.

Al final, guardamos los resultados en archivos JSON.

```typescript
    fs.writeFileSync(path.replace(/css$/, 'styleToSelector.json'), JSON.stringify(styleToSelector));
    fs.writeFileSync(path.replace(/css$/, 'selectorToStyle.json'), JSON.stringify(selectorToStyle));
```

Comenzamos el programa con el comando

```bash
npx ts-node decompose_css_to_json.ts
```

No imprime los resultados, sino que crea tres archivos en el directorio oculto `.cache`. El tiempo de ejecución de este programa es de aproximadamente

### Construyendo meta-selectores basados en selectores temporales

Un meta-selector es un selector en el que los nombres de clase son reemplazados por las reglas de estilo que los identifican. Crear meta-selectores es necesario para que el código que escribimos sea estable. El punto de partida para crearlo es el selector escrito en la consola del navegador.

Llamaremos al programa `generate_meta_selectors.ts`. En la disposición estándar del script, tenemos una variable `input`. En ella, almacenamos la consulta de trabajo que estructura la página de Facebook mostrada. Ejecutarlo en la consola del navegador debería devolver un arreglo de objetos correspondientes a los miembros del grupo de Facebook.

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

Ahora, para procesar clases aleatorias en selectores en meta-selectores estables, recuperamos el contenido del archivo de mapa de selectores.

```typescript
    const name = md5(url);
    const path = `${CACHE_DIR}/${name}.selectorToStyle.json`;
    const selectorToStyle = JSON.parse(fs.readFileSync(path).toString())
```

Creamos un arreglo de clase en dos pasos: obteniendo cadenas entre comillas y luego cortando cadenas de ocho caracteres de dígitos y letras precedidas por un punto de ellas.

```typescript
    const classes = [...new Set(input.match(/'.*?'/g).join('').match(/\.\w{8}/g))];
```

Basado en estas clases y gracias al mapa descargado en la variable `selectorToStyle`, podemos generar un array de sustituciones.

```typescript
    const replaces: [string, string][] = classes.map(c => [c, `{${selectorToStyle[c]}}`]);
```

El valor de esta variable estaba en nuestro ejemplo

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

Al final, sustituimos clases por identificadores asignados a estilos.

```typescript
    let out = input;

    replaces.forEach(r => {
        out = out.replace(new RegExp(r[0], 'g'), r[1])
    })
    console.log(out);
```

Vemos una sustitución realmente simple debido al hecho de que cada clase siempre tiene un selector en forma de estilo. Esta suposición podría ser potencialmente falsa, pero Facebook utiliza scripts de minificación que limpian el HTML de clases sin sentido.

En última instancia, el resultado de este programa activado por el comando

```bash
 npx ts-node generate_meta_selectors.ts
```

es el texto del meta-selector

```javascript
[...document.querySelectorAll('div{box-sizing:border-box}{position:relative}{z-index:0}{display:flex}{flex-direction:column}{flex-shrink:0}{max-width:100%}{margin-top:4px}{margin-bottom:4px} div{border-top-left-radius:8px}{border-top-right-radius:8px}{border-bottom-right-radius:8px}{border-bottom-left-radius:8px}{display:block}:not([aria-busy])')].map(e => ({
    name: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} div{display:inline}>a').innerText,
    link: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} div{display:inline}>a').href,
    context: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} :nth-child(2)')?.innerText,
    description: e.querySelector('{display:flex}{flex-direction:column}{margin-bottom:-5px}{margin-top:-5px} :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))
```

Como anuncié, en lugar de clases, están sus significados. Los nombres de las clases cambian, pero los significados permanecen. Ahora es momento de guardar este meta-selector como un elemento constante de nuestro programa, por ejemplo, incrustándolo en un plugin que lo ejecute en el momento apropiado en la página de Facebook. Por ejemplo, cuando la página se desplaza hasta el final y el intervalo.

```javascript
i = setInterval(() => window.scrollTo(0,document.body.scrollHeight), 1000);
```

detiene el aumento del valor de `document.body.scrollHeight`,

Sin embargo, no podemos ejecutar este código directamente porque contiene selectores no válidos. Para poder ejecutarlo, necesitamos revertir esta operación. Para esto, necesitamos un script separado.

### Recuperando selectores verdaderos y actuales usando meta-selectores

Creamos un archivo `generate_temp_selector.ts`. Familiarizados con cómo lucen tales archivos, encontraremos fácilmente nuestro camino en la parte que rodea el cuerpo de la función `main`.

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

Los datos de entrada para el programa son nuevamente `url` y una cadena, esta vez llamada `metaSelector`. El propósito de la función `main` es imprimir el selector en la pantalla utilizando el segundo mapa - el que traduce estilos a selectores.

```typescript
    const name = md5(url);
    const path = `${CACHE_DIR}/${name}.styleToSelector.json`;
    const styleToSelector = JSON.parse(fs.readFileSync(path).toString())

    const selectors = [...new Set(metaSelector.match(/'.*?'/g).join('').match(/\{.*?\}/g))];
```

Comenzamos como la última vez, pero esta vez estamos buscando selectores, por lo que aplicamos una expresión regular ligeramente diferente y el segundo de los mapas generados. Aquí también queremos crear una lista de reemplazo, pero difiere en tipo de la utilizada en el programa anterior.

```typescript
    const replaces: [string, string[]][] = selectors.map(c => {
        const key = c.replace(/^\{/, '').replace(/\}$/, '');
        return [
            c,
            styleToSelector[key].filter((c: string) => /^\.\w{8}$/.test(c))
        ]
    });
```

Un valor de ejemplo de esta variable es:

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

Desafortunadamente, debido a la naturaleza multivaluada de esta transformación, no podemos usar una sustitución tan simple como la última vez. Esta vez decidimos hacer compromisos y escribir código que eliminará todas las clases multivaluadas. Podemos aceptar esto porque, como señalamos al principio, representan un porcentaje negligible de todos los selectores utilizados.

```typescript
let out = metaSelector;

replaces.forEach(r => {
    out = out.replace(new RegExp(r[0], 'g'), r[1].length === 1 ? r[1][0] : '')
})
console.log(out);
```

Después de ejecutar el programa con el comando

```
npx ts-node generate_temp_selector.ts
```

tendremos código listo para usar para estructurar una lista de personas de un grupo de Facebook:

```javascript
[...document.querySelectorAll('div.du4w35lb.d2edcug0.aahdfvyu.tvmbv18p div.ue3kfks5.pw54ja7n.uo3d90p7.l82x9zwi:not([aria-busy])')].map(e => ({
    name: e.querySelector('.ew0dbk1b.irj2b8pg div.nc684nl6>a').innerText,
    link: e.querySelector('.ew0dbk1b.irj2b8pg div.nc684nl6>a').href,
    context: e.querySelector('.ew0dbk1b.irj2b8pg :nth-child(2)')?.innerText,
    description: e.querySelector('.ew0dbk1b.irj2b8pg :nth-child(3)')?.innerText,
    img: e.querySelector('image')?.getAttribute('xlink:href')
}))
```

### Análisis de Resultados

La longitud del nuevo selector es de 513 caracteres en comparación con 639 para el selector de entrada, pero funciona muy bien. Para el grupo que analizamos, compuesto por 4576 personas, el procedimiento de desplazamiento automático hacia abajo tomó 90 minutos.

![](http://localhost:8484/6b3b63c5-36d4-44af-868a-5519ca5466cb.svg)

Los datos JSON pesaban 2.1 MB. Después de la conversión a formato CSV con el comando:

```bash
jq -r '.[] | ([.name,.context,.description,.link,.img] | @csv)' .cache/crypto.json > .cache/crypto.csv
```

el `.csv` creado tenía 1.9 MB. Casi la mitad de estos datos consisten en URLs de fotos de perfil, que son bastante largas, pero generalmente funcionan durante unas pocas horas a unos pocos días después de ser descargadas, no más, por lo que recomiendo agregarlas a la cola de descarga a través de un proceso separado si queremos recopilarlas. Podemos comprobar esto fácilmente creando un archivo que no las tenga:

```bash
jq '.[] | {name:.name,context:.context,description:.description,link:.link}' .cache/crypto.json > .cache/crypto-no-img.json
```

Y verificando el tamaño del archivo resultante

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

Estos avatares pesan 2.19 KiB y tienen un tamaño de 60x60 px. Es fácil verificar la distribución del tamaño de diferentes tipos de datos en el scraping:

![](http://localhost:8484/86469a55-2b9d-4340-a523-4a1517759cfe.svg)

### Recomendación para Desarrolladores de Facebook

Reescriba el servicio en flutter, hacer web scraping se volverá varias órdenes de magnitud más caro y prácticamente no rentable en muchos casos. Otra solución más simple sería aumentar el número de diferentes clases que tengan el mismo estilo y mezclarlas utilizando aleatorizadores que causarían que salieran datos aleatorios de los selectores basados en esas clases. De hecho, los archivos CSS serían más pesados, pero sería un golpe fuerte al método que presenté.

### Recomendación para Scrapers

La carrera armamentista en web scraping está entrando en una fase cada vez más interesante. La automatización sigue siendo parcialmente posible, pero su expansión requiere gastos cada vez más altos e investigación sobre cómo replicar el comportamiento natural para los usuarios, de modo que nuestros scripts permanezcan indetectables a pesar de los métodos de detección cada vez más sofisticados.

En mi opinión, en cuentas destinadas a scraping, vale la pena realizar actividades normales utilizando personas reales, al menos en la medida en que generar tal actividad natural intercalada con el trabajo de bots puede reducir el riesgo de clasificación como un bot y evitar captchas y bloqueos de cuentas.

Se debe recordar que dicha recopilación de datos va en contra de las regulaciones de Facebook, que establecen que necesitamos el consentimiento por escrito para esto.

Y dado que estos son datos personales procesados sin el consentimiento de los propietarios, va en contra de regulaciones como el GDPR europeo conocido en Polonia como RODO en ciertas partes del mundo.

### Fuentes
