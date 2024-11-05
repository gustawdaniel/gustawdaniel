---
author: Daniel Gustaw
canonicalName: communication-between-vue-components-in-meteor
coverImage: http://localhost:8484/355876fb-80ec-4ae0-862e-9382ebf1a833.avif
description: Hay pocos métodos para enviar datos entre componentes de Vue no relacionados. Algunos de estos son universales, otros típicos de Vue y otros para Meteor. Compararemos todos ellos.
excerpt: Hay pocos métodos para enviar datos entre componentes de Vue no relacionados. Algunos de estos son universales, otros típicos de Vue y otros para Meteor. Compararemos todos ellos.
publishDate: 2021-04-20 21:12:22+00:00
slug: es/comunicacion-entre-componentes-vue-en-meteor
tags:
- vue
- meteor
title: Comunicación entre componentes de Vue en Meteor
updateDate: 2021-04-20 21:12:22+00:00
---

## ¿Qué tenemos y qué queremos?

Consideremos la siguiente situación.

1. Tenemos un proyecto de Meteor con Vue
2. Tenemos dos componentes que usan los mismos datos
3. Queremos observar los cambios realizados en un componente en el otro

## ¿Cómo hacer esto?

Existen algunos enfoques muy diferentes para lograr este resultado:

a) No usar Vue ni Meteor y operar directamente en el DOM

b) Usar EventBus conocido de Vue para emitir y escuchar eventos

c) Usar Vuex que permite a muchos componentes operar en el estado global

d) Usar Meteor Tracker para recalcular propiedades en el segundo componente

e) Usar Minimongo y el paquete [vue-meteor-tracker](https://github.com/meteor-vue/vue-meteor-tracker)

A continuación, mostramos ejemplos de aplicación de cualquiera de estos métodos y describimos sus pros y contras.

El repositorio completo con todos estos métodos se puede encontrar aquí: [https://github.com/gustawdaniel/vue-meteor-components-communication-tutorial](https://github.com/gustawdaniel/vue-meteor-components-communication-tutorial)

## ¿Cómo integrar Vue con Meteor?

Asumimos que puedes crear un proyecto de Meteor con Vue. Si no, entonces después en un proyecto estándar de Meteor creado por

```bash
meteor create .
```

deberías usar comandos:

```bash
meteor remove autopublish insecure blaze-html-templates
meteor add akryum:vue-component static-html
meteor npm install --save vue-meteor-tracker vue
```

Reemplaza `/client/main.html` por

```html
<head>
   <title>Components communication</title>
</head>
<body>
   <div id="app"></div>
</body>
```

y `/client/main.js` por

```js
import Vue from 'vue';

import VueMeteorTracker from 'vue-meteor-tracker';   // here!
Vue.use(VueMeteorTracker);                           // here!

import App from './App.vue';

Meteor.startup(() => {
  new Vue({
    el: '#app',
    render: h => h(App)
  });
});
```

Ahora en `/client/App.vue` podemos usar la sintaxis estándar de Vue como

```html
<template>
    <h1>App</h1>
</template>

<script>
    export default {
        name: "App"
    }
</script>
```

En las siguientes secciones podemos ver resultados en una tabla con spectre.css aplicado, pero no lo discutiremos. Puedes ver cómo usarlo siguiendo los commits en el repositorio adjunto.

# Operación directamente en el DOM

En los casos más simples, cuando no queremos operar sobre los datos enviados, podemos usar la modificación directa del DOM a la antigua. Escucha los cambios en el primer componente, luego selecciona y modifica directamente el `innerHTML` de los elementos en el otro.

![meteor-vue-1-input.gif](http://localhost:8484/e0f5478a-b6ee-4b6c-90f0-5531c6397f96.avif)

Para obtener este resultado, podemos escribir el siguiente código en el primer componente.

```html
<template>

    <input class="form-input" type="text" ref="input" @keyup="update">

</template>

<script>
    export default {
        methods: {
            update() {
                document.querySelector('#dom-target').innerHTML = this.$refs.input.value; // result of selector could be cached
            }
        }
    }
</script>
```

Como puedes ver, escuchamos el evento `keyup` en el elemento de entrada y ejecutamos el método `update` que busca `#dom-target` y modifica directamente su contenido.

En el segundo archivo, ni siquiera usamos JavaScript.

```html
<template>

    <p class="m-2" id="dom-target"></p>

</template>
```

Este método es

* muy simple
* fácil de usar y entender
* requiere una pequeña cantidad de código

pero también tiene desventajas:

* puede causar errores difíciles de detectar
* arruina la idea de componentes independientes
* introduce un espacio de nombres global de id u otros selectores restrictivos
* debemos evitar en proyectos más grandes donde colaboran muchas personas

# Usar Event Bus

El concepto de Event Bus se basa en la creación de uno (o varios) componentes vacíos independientes globalmente disponibles que tienen solo una tarea: emitir y escuchar eventos. Este componente puede ser inyectado en otros componentes de nuestra aplicación y ser utilizado para señalizar e invocar acciones.

```js
import Vue from 'vue';

export default new Vue();
```

Ahora nuestro componente que inicia la comunicación está más expandido.

```html
<template>

    <input class="form-input" type="text" v-model="value" @keyup="update">

</template>

<script>
    import EventBus from '../../EventBus';

    export default {
        data() {
            return { value: null }
        },
        methods: {
            update() {
                EventBus.$emit('update', this.value)
            }
        }
    }
</script>
```

Aplicamos la propiedad de datos y usamos el método `$emit` en el `EventBus` importado para enviar una señal. En el componente receptor, podemos usar el método `$on` para escuchar esto.

```html
<template>

    <p class="m-2" id="dom-target">{{value}}</p>

</template>

<script>
    import EventBus from '../../EventBus';

    export default {
        data() {
            return {
                value: null
            }
        },
        mounted() {
            EventBus.$on('update', (value) => {
                this.value = value;
            })
        }
    }
</script>
```

Ventajas

* sin restricciones en la posición de los componentes relativos
* en proyectos más complejos puedes usar muchos EventBuses

Desventajas

* siempre debes emitir eventos manualmente
* debes recordar agregar este mecanismo a cualquier componente que opere en estos datos

## Vuex como estado global de la aplicación

La idea de componentes separados tiene una gran influencia en la claridad del código y en la posibilidad de mantenimiento. Pero a veces tenemos datos que deben ser accesibles en cualquier componente y queremos compartir estos datos deliberadamente. Para lograr este objetivo, podemos usar Vuex. No es parte de la biblioteca principal de Vue, pero está oficialmente soportado. Debemos instalar Vuex con el comando:

```bash
npm install vuex --save
```

Para hacerlo funcionar, debemos hacer algunas preparaciones antes de usar `vuex` en los componentes. Primero, debemos registrarlo como un paquete que utilizamos. Podemos hacerlo en el archivo `/imports/client/plugins/vuex.js`.

```js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);
```

A continuación, deberíamos crear un conjunto global de propiedades compartidas y un método para cambiar el estado de estos valores llamado `store`. Propongo crear el archivo `/imports/client/vuex/store.js` con el siguiente contenido:

```js
import Vuex from 'vuex'

export default new Vuex.Store({
    state: {
        value: null
    },
    mutations: {
        update (state, value) {
            state.value = value;
        }
    }
});
```

Puedes ver que nuestro estado contiene `value` y puede ser "mutado" por la función `update`. Pero no es todo. También debemos agregar tanto nuestro plugin como la tienda al archivo `/client/main.js`. Podemos hacer esto de la siguiente manera.

```js
import Vue from 'vue';

import '../imports/client/plugins/tracker'
import '../imports/client/plugins/vuex'
import store from '../imports/client/vuex/store';

import App from '../imports/client/ui/App.vue';

Meteor.startup(() => {
  new Vue({
    el: '#app',
    store,
    render: h => h(App)
  });
});
```

Puedes ver que `meteor-tracker` se ha movido al archivo de partida de la misma manera que `vuex`, y en el constructor de nuestro objeto `Vue` se inyecta `store` que acabamos de definir.

Ahora estamos preparados para usar `vuex` en nuestros componentes. Cuando escribimos, la actualización debería confirmar la mutación con el nombre `update` y enviar como segundo argumento el valor de nuestra entrada.

```html
<template>

    <input class="form-input" type="text" @keyup="update">

</template>

<script>
    export default {
        methods: {
            update(event) {
                this.$store.commit('update', event.target.value)
            }
        }
    }
</script>
```

La tienda ha definido el comportamiento de este método. Sabemos que es un setter de la propiedad de valor. Y en el segundo componente, simplemente podemos obtener este valor de Vuex.

```html
<template>

    <p class="m-2" id="dom-target">{{$store.state.value}}</p>

</template>
```

Como en el caso de la operación directa en el DOM, no necesitamos JavaScript adicional, pero en este caso se logra gracias a la reactividad incorporada en Vue.

Ventajas:

* Eficiente para estados compartidos
* Permite crear reglas globales para manipular recursos compartidos
* Requiere una pequeña cantidad de código cuando se implementa

Desventajas:

* Relativamente difícil de configurar en comparación con los métodos anteriores
* Necesita muchos componentes que usen el mismo valor para tener sentido de uso

## Reactividad independiente del rastreador de Meteor

Puedes ver que hemos descrito tres métodos que podemos usar con Vue pero sin Meteor. Ahora miramos el Rastreador de Meteor y vemos cómo combinar la reactividad de Meteor con la reactividad de Vue. Ahora la idea es la siguiente: crear una dependencia compartida como EventBus, importarla en dos componentes. En el primero, se envía una señal para recalcular cualquier función dependiente de esta dependencia; en el segundo componente, se crea una función dependiente. Para almacenar datos, utilizaremos `localStorage` porque este es definitivamente un almacenamiento de datos no reactivo y mostramos que gracias al Rastreador no podemos preocuparnos por la forma de almacenamiento (podría ser una API externa), sino que solo debemos preocuparnos por dónde se cambian los datos reactivos y dónde se utilizan.

Comencemos creando la dependencia en el archivo `/imports/client/Dependency.js`.

```js
export default new Tracker.Dependency;
```

Ahora queremos importar esta dependencia y usar el método `changed()` para señalar que cualquier función dependiente de esto debería ser recalculada. Adicionalmente, estamos guardando el valor en `localStorage` y limpiando `localStorage` al crear este componente para evitar el almacenamiento en caché del valor entre las actualizaciones del navegador.

```html
<template>

    <input class="form-input" type="text" @keyup="update">

</template>

<script>
    import dependency from '../../Dependency';

    export default {
        methods: {
            update(event) {
                window.localStorage.setItem('value', event.target.value);
                dependency.changed();
            }
        },
        created() {
            window.localStorage.clear();
        }
    }
</script>
```

En el segundo componente tenemos la función estándar `data()`, pero en `created` se ha registrado el método `autorun` del Tracker. Este método se llamará siempre que cualquier variable reactiva (desde el punto de vista de Meteor) dentro de su función cambie. Al escribir `dependency.depend()`, le ordenamos a Meteor que vuelva a calcular esta función en cualquier caso cuando se invoque `dependency.changed()`.

```html
<template>

    <p class="m-2" id="dom-target">{{value}}</p>

</template>

<script>
    import dependency from '../../Dependency';

    export default {
        data() {
            return {
                value: null
            }
        },
        created() {
            Tracker.autorun(() => {
                dependency.depend();
                this.value = window.localStorage.getItem('value');
            });
        }
    }
</script>
```

A veces queremos comunicar los datos de Meteor con los datos de Vue. Debido a que su reactividad se basa en tecnologías diferentes, el Tracker de Meteor es el punto donde pueden encontrarse e interactuar entre ellos.

Desventajas:

* Tracker no es tan conocido como otros métodos puros de Vue.
* Si hay muchos puntos de actualización, debes recordar invocar `changed` en cualquiera de ellos.

Ventajas:

* Permite una integración muy personalizada con Meteor, más flexible que el paquete `vue-meteor-tracker`.

## Seguimiento automatizado mediante el paquete vue-meteor-tracker

Una de las soluciones más cómodas es el uso de `vue-meteor-tracker`. A diferencia del último ejemplo, necesitamos un recurso reactivo (desde la perspectiva de Meteor). Gracias al uso de variables reactivas, podemos automatizar el proceso de enviar señales sobre los cambios de datos a funciones dependientes. Podemos utilizar una colección Mini Mongo que simula una colección Mongo pero que vive solo en el front-end sin conexión con el back-end. Por supuesto, también se puede utilizar una colección Mongo real, pero elegimos Mini Mongo por simplicidad. Vamos a crear una colección en `/imports/client/Values.js`.

```js
export const Values = new Mongo.Collection(null);
```

Ahora, en el componente de entrada, queremos realizar una inserción o actualización de datos en esta colección de la siguiente manera:

```html
<template>

    <input class="form-input" type="text" @keyup="update">

</template>

<script>
    import { Values } from '../../Values';

    export default {
        methods: {
            update(event) {
                Values.upsert('value', {$set: {value: event.target.value}})
            }
        },
        created() {
            Values.upsert('value', {$set: {value: null}});
        }
    }
</script>
```

Hay `upserts` en la creación de componentes y en la actualización de entradas. Ahora, en el componente que presenta datos, podemos tener código con la propiedad `meteor` del componente `Vue` proporcionada por el paquete `vue-meteor-tracker`.

```html
<template>

    <p class="m-2">{{valueObject.value}}</p>

</template>

<script>
    import { Values } from '../../Values';

    export default {
        meteor: {
            valueObject() {
                return Values.findOne('value');
            }
        }
    }
</script>
```

Esta propiedad permite definir funciones que son reactivas de dos maneras. Estas funciones son invocadas por cambios en variables reactivas para Meteor, pero devuelven valores reactivos para Vue. Debido a este hecho, no tenemos ningún listener. Solo lógica pura de guardar datos en una colección reactiva de Meteor en el primer componente y devolver un valor del cursor reactivo de Meteor en el segundo componente. `Vue-meteor-tracker` transforma esta reactividad en reactividad de Vue y `valueObject` puede ser tratado en el segundo componente como una propiedad devuelta por el método `data()`.

Desventajas:

* debes aprender y confiar en un paquete adicional externo
* hay algunos problemas con el cambio dinámico de parámetros de suscripción

Ventajas:

* el paquete está bien documentado
* intuitivo y fácil de usar
* siempre se utiliza cuando deseas integrar Meteor con Vue

# Resumen

Hemos presentado algunos métodos de comunicación entre componentes. Algunos de ellos son universales, los dos últimos métodos son típicos de la integración `vue-meteor`. No hay uno mejor o peor. Crearás el mejor código si conoces y entiendes todo y seleccionas el adecuado dependiendo de tus necesidades.

![vue-meteor-2-summary](http://localhost:8484/996e2a24-44f2-4b1f-8fbe-3ef42357032d.avif)

Todos los métodos presentados en este artículo con componentes de entrada y salida.

Si deseas añadir un método que olvidé o ves otra cosa que mejorar, no dudes en mencionarlo en los comentarios.

Fuentes:

Eventos personalizados en Vue

> [https://vuejs.org/v2/guide/components-custom-events.html](https://vuejs.org/v2/guide/components-custom-events.html)

Guía oficial de Vuex

> [https://vuex.vuejs.org/guide/](https://vuex.vuejs.org/guide/)

Documentación de Meteor Tracker

> [https://docs.meteor.com/api/tracker.html](https://docs.meteor.com/api/tracker.html)

Vue Meteor Tracker

> [https://github.com/meteor-vue/vue-meteor-tracker](https://github.com/meteor-vue/vue-meteor-tracker)

Esta publicación del blog también se publica allí: https://medium.com/@gustaw.daniel/communication-between-vue-components-in-meteor-29006be3dae9

El repositorio completo con todos estos métodos se puede encontrar allí: https://github.com/gustawdaniel/vue-meteor-components-communication-tutorial
