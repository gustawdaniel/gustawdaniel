---
author: Daniel Gustaw
canonicalName: benford-distribution-for-fibonacci-sequence-in-java-rust-node-js
coverImage: http://localhost:8484/148d29c9-465f-472c-ac6b-7ce78ebe3bd1.avif
description: Los programas escritos en Java, Rust y Node JS compiten en comprobar la distribución de los primeros dígitos de la secuencia de Fibonacci. Vea cómo son similares, en qué se diferencian y cómo su rendimiento depende de la longitud de la secuencia.
excerpt: Los programas escritos en Java, Rust y Node JS compiten en comprobar la distribución de los primeros dígitos de la secuencia de Fibonacci. Vea cómo son similares, en qué se diferencian y cómo su rendimiento depende de la longitud de la secuencia.
publishDate: 2021-07-21 15:57:21+00:00
slug: es/la-ley-de-benford
tags:
- rust
- java
- nodejs
title: La Ley de Benford para la Secuencia de Fibonacci en Java, Rust y Node JS
updateDate: 2021-07-22 10:10:14+00:00
---

Era 1992. En la ciudad de Wayne (Arizona, EE. UU.), se llegó a un veredicto para James Nelson - el contador jefe y gerente del Tesorero del Estado de Arizona. Sus cheques falsos, a través de los cuales desvió casi 2 millones de dólares, fueron detectados porque la distribución de los primeros dígitos en los montos defraudados se desvió de la distribución de Benford.

![](http://localhost:8484/c1a7958b-17cd-410d-b4cb-403bb76cac96.avif)

En las primeras posiciones imaginadas por el contador, los valores 7, 8 y 9 estaban presentes con demasiada frecuencia - valores típicos percibidos por nosotros como "más" aleatorios que 1, 2 o 3.

---

A partir de esta entrada, aprenderás qué es la Distribución de Benford y por qué se observa en muchos conjuntos de datos. Más adelante, discutiremos la secuencia de Fibonacci y sus propiedades básicas. Finalmente, escribiremos un programa para comprobar si la Distribución de Benford se aplica a la secuencia de Fibonacci. El programa se escribirá en tres lenguajes:

* Java
* Rust
* Node JS

Compararemos los resultados de su rendimiento.

## Distribución de Benford

La Distribución de Benford es una distribución de probabilidad de la ocurrencia de números específicos en las posiciones principales en muchos conjuntos de datos observados. Para que ocurra, deben cumplirse las siguientes condiciones:

* el conjunto de valores debe abarcar muchos órdenes de magnitud
* la probabilidad debe ser invariante con respecto a la escala y la base

![](http://localhost:8484/1d0416b4-db35-4e92-a7fc-3abceedd15ac.avif)

Un ejemplo de una distribución de tamaños donde el primer dígito sigue aproximadamente la ley de Benford. La decayencia exponencial de la distribución es evidente a medida que el eje de valores se densifica.

![](http://localhost:8484/8dbf58e1-31d9-45e6-b6a7-2178aa19a87e.avif)

Distribución de tamaños abarcando un orden de magnitud. Por lo general, los primeros dígitos no siguen la distribución de Benford si la distribución inicial no es lo suficientemente amplia.

Una gran derivación formal de la distribución de Benford fue presentada por Arno Berger y Theodore P. Hill en la publicación: ["Una teoría básica de la Ley de Benford"](https://digitalcommons.calpoly.edu/cgi/viewcontent.cgi?referer=https://www.google.com/&httpsredir=1&article=1083&context=rgp_rsr)

Esta es una publicación de más de 100 páginas que discute extensamente el tema y lo recomiendo a todos los que aman las matemáticas. Una derivación más corta y simple que vale la pena mencionar fue escrita por [Victor Romero-Rochin](https://www.researchgate.net/publication/45873771_A_derivation_of_Benford's_Law_and_a_vindication_of_Newcomb)

Ejemplos de distribuciones que siguen la ley de Benford se muestran claramente en el enlace:

[Prueba de la Ley de Benford](https://testingbenfordslaw.com/)

Una razón intuitiva para la mayor representación de los dígitos inferiores es la mayor probabilidad de ocurrencia de muchos valores más pequeños, que, al superponerse con la densidad variable escalonada de los dígitos a medida que aumenta el orden de magnitud, causa un desplazamiento hacia una mayor representación de los dígitos inferiores en las primeras posiciones.

Dado que en este artículo, la distribución de Benford es meramente un pretexto para comparar el rendimiento de programas escritos en varios lenguajes y no el tema principal, me permitiré limitar su descripción a mostrar las mejores publicaciones, la fórmula derivada y algunos ejemplos.

La fórmula para la probabilidad de que el dígito `d` ocurra en la primera posición es:

![](http://localhost:8484/87e83494-bb63-4c20-a359-5392bda46134.avif)

* Distribución uniforme de distribución uniforme

Del conjunto de números naturales que van del 1 al 9999, sacamos al azar un número p, utilizando un generador de números aleatorios con una distribución uniforme. A continuación, del rango de números naturales del 1 al p, sacamos al azar un número r, también utilizando la distribución uniforme.

![](http://localhost:8484/98c32399-f9e6-47ea-b571-c47e956c0ae0.avif)

* Masa atómica de los elementos de la tabla periódica

Echemos un vistazo a la tabla periódica de elementos químicos, más específicamente, a uno de los parámetros de cada elemento: masa atómica.

![](http://localhost:8484/5ee78f6d-c0ce-42d9-ace8-da38dd6087fb.avif)

* Superficie de los países del mundo en km²

El último ejemplo está relacionado con la geografía: echemos un vistazo a la superficie de todos los países del mundo en km².

![](http://localhost:8484/72722365-4efd-4357-b0d2-40420d2480cb.avif)

* La Ley de Benford

La distribución discreta de Benford para el sistema decimal también conocida como la ley de los primeros (significativos) dígitos.

![](http://localhost:8484/65baa70d-2665-4c67-bd0f-9cf9f36198a9.avif)

Como vemos, todos estos conjuntos de números tienen la misma propiedad: invariancia con respecto a la escala, base y extensión por varios órdenes de magnitud.

## Secuencia de Fibonacci

La secuencia de Fibonacci es una secuencia de números naturales con una definición recursiva:

![](http://localhost:8484/4d2011f5-ed80-4f02-a5b2-fe27c37e26cf.avif)

dónde

![](http://localhost:8484/cd6431d2-5e38-4471-b87d-ad3102177679.avif)

Sus valores iniciales son:

```
1,1,2,3,5,8,13,21,34,55,89
```

Esta es una secuencia que podemos observar a menudo en la naturaleza: en vórtices de agua, en la forma de los tornados, en la disposición de las flores, en el ramificación de las plantas y en la división de los cuerpos de insectos. Su prevalencia fascina a los investigadores de este fenómeno. Al igual que la prevalencia de funciones exponenciales o cuadráticas, resulta de la simplicidad de la fórmula y de ser una buena aproximación para sistemas mucho más complejos observados en la realidad.

![](http://localhost:8484/f51dc67a-f506-447c-b141-cc74bd7c3f4c.avif)

Las razones de los valores sucesivos de la secuencia convergen al número áureo. La prueba sigue directamente de la definición.

## Java

![](http://localhost:8484/de07baa3-4ca2-4e9d-87fa-394f7e757a5c.avif)

Para hacer esto en Java, se requiere la importación del módulo `java.math.BigInteger`.

```java
import java.math.BigInteger;
```

En el archivo `Benford.java` en la clase `Benford`, crearemos una función `generateFibonacci` que nos permitirá preparar la secuencia.

```java
public class Benford {
    private static BigInteger[] generateFibonacci(int n) {
        BigInteger[] fib = new BigInteger[n];
        fib[0] = BigInteger.ONE;
        if(n == 1) return fib;
        fib[1] = BigInteger.ONE;
        for (int i = 2; i < n; i++)
            fib[i] = fib[i - 1].add(fib[i - 2]);
        return fib;
    }
```

Cabe señalar que en lugar de `1` usamos `BigInteger.ONE` para mantener la compatibilidad de tipos. De manera similar, en lugar de la suma clásica por `+`, usamos el método `add` definido en los objetos `BigInteger`.

En el método `main`, preparamos la secuencia de Fibonacci.

```java
    public static void main(String[] args) {
        BigInteger[] numbers = generateFibonacci(
            args.length > 0 ? Integer.parseInt(args[0]) : 1000
        );
```

Gracias a `args`, podemos usar el argumento ingresado por el usuario. Si no se proporciona, el valor predeterminado es `1000`.

A continuación, el array `digits` se llena con la cantidad de dígitos.

```java
        int[] digits = new int[10];

        for (BigInteger number : numbers)
            digits[Integer.valueOf(number.toString().substring(0, 1))]++;
```

Al final, mostramos una tabla que compara los resultados con las predicciones teóricas.

```java
        System.out.print("N   Ben        Fib\n");
        for (int i = 1; i < digits.length; i++)
            System.out.printf("%d %10.6f %10.6f\n",
                    i,
                    (double) digits[i] / numbers.length,
                    Math.log10(1.0 + 1.0 / i)
            );
    }
}
```

Ejecutamos el código escribiendo `java Benford.java` y obtenemos un resultado que confirma nuestra teoría:

![](http://localhost:8484/d408d398-519c-46a9-a081-4e309adb9767.avif)

## Rust

Comenzamos proyectos en `Rust` con el comando

```bash
cargo new benford
```

se crea un archivo `Cargo.toml` en el directorio `benford` con el contenido

```toml
[package]
name = "b"
version = "0.1.0"
edition = "2018"

[dependencies]
```

y el archivo `src/main.rs` con el contenido

```rust
fn main() {
    println!("Hello, world!");
}
```

Es muy agradable que Rust nos reciba de una manera tan agradable, facilitando el inicio de trabajo con este lenguaje.

![](http://localhost:8484/8c306ef2-043e-4995-9896-ee25f46f3f45.avif)

Para compilar el programa, ejecutamos el comando.

```bash
cargo build
```

Se puede iniciar utilizando el comando

```bash
./target/debug/benford
```

Para compilar y ejecutar el programa simultáneamente, usaremos el comando

```bash
cargo run
```

Mientras que en Java utilizamos un paquete para manejar enteros grandes, en Rust necesitamos dos: `num-bigint` y `num-traits`. Los añadiremos al proyecto escribiendo líneas

```toml
num-bigint = "0.4.0"
num-traits = "0.2.14"
```

bajo la clave `[dependencies]` en el archivo `Cargo.toml`. Las versiones de los paquetes serán sugeridas automáticamente por nuestro `IDE`. Su uso en el archivo `src/main.rs` requiere escribir

```rust
use num_bigint::BigUint;
use num_traits::{Zero, One};
use std::env;
```

Donde `Uint` proviene de `entero sin signo`, que son números enteros que no reservan ni un bit para el signo, porque siempre son positivos. La función que genera la secuencia de Fibonacci será similar a la de `Java`.

```rust
fn generate_fibonacci(n: usize) -> Vec<BigUint> {
    let mut fib = vec![Zero::zero(); n];
    fib[0] = One::one();
    if n == 1 { return fib; }
    fib[1] = One::one();
    for i in 2..n {
        fib[i] = &fib[i - 1] + &fib[i - 2];
    }
    return fib;
}
```

Vemos que la principal diferencia radica en nombrar los tipos. En la función `main`, generamos la secuencia de la misma manera al guardarla en un array.

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let numbers = generate_fibonacci(
        if args.len() > 1 { (&args[1]).trim().parse().unwrap() }
        else { 100 }
    );
```

Esta vez, el arreglo de argumentos comienza con el nombre del programa y el valor pasado desde la línea de comandos tiene un índice de 1.

preparamos un arreglo con el conteo de dígitos en las primeras posiciones

```rust
let mut digits = vec![0; 10];
```

Un registro análogo al de Java nos permite contar los dígitos y almacenar el número de sus ocurrencias en un arreglo.

```rust
for n in numbers.iter() {
    digits[n.to_string()[..1].parse::<usize>().unwrap()] += 1;
}
```

Al final, mostramos los resultados en la consola utilizando el siguiente bucle.

```rust
    println!("N   Fib        Ben");
    for i in 1..digits.len() {
        println!("{:} {:10.6} {:10.6}",
                 i,
                 digits[i] as f64 / numbers.len() as f64,
                 (1.0 + 1.0 / i as f64).log10()
        );
    }
}
```

## Node JS

Una característica única del programa presentado es que, a diferencia de pocos otros proyectos en `node js`, no contiene una lista de paquetes requeridos. No necesitamos importar ningún módulo responsable de manejar grandes números. Las constantes de tipo `BigInt` se crean añadiendo la letra `n` después del número. Como resultado, la función para generar la secuencia de Fibonacci toma la forma:

```javascript
const generate_fibonacci = (n) => {
    let fib = [];
    fib[0] = 1n;
    if(n === 1) return fib;
    fib[1] = 1n;
    for (let i = 2; i < n; i++)
        fib[i] = fib[i - 1] + fib[i - 2];
    return fib;
};
```

Sin embargo, podemos imaginar fácilmente que alguien escribiendo código no sabe la diferencia entre `1n` y `1` o simplemente olvidó que está trabajando con números grandes y lo escribió así:

```javascript
const generate_fibonacci = (n) => {
    let fib = [];
    fib[0] = 1;
    if(n === 1) return fib;
    fib[1] = 1;
    for (let i = 2; i < n; i++)
        fib[i] = fib[i - 1] + fib[i - 2];
    return fib;
};
```

Para simular ambos casos, escribamos una función universal controlada por la opción `--cheat`.

```javascript
const generate_fibonacci = (n) => {
    let fib = [];
    fib[0] = process.argv[3] === '--cheat' ? 1 : 1n;
    if(n === 1) return fib;
    fib[1] = process.argv[3] === '--cheat' ? 1 : 1n;
    for (let i = 2; i < n; i++)
        fib[i] = fib[i - 1] + fib[i - 2];
    return fib;
};
```

En la parte siguiente, se hará evidente cómo las diferencias colosales en rendimiento y corrección del programa son provocadas por este único símbolo `n`. Al escribir software, es importante entender en qué rangos de valores opera el programa y manejar correctamente sus límites.

![](http://localhost:8484/1ff3b625-6b92-4b17-bc7c-53676c7f9b23.avif)

> En este sentido, `node` requiere una responsabilidad particular del programador, ya que intentar salvar el programa lanzando un error lleva a compromisos que a veces pueden ser brillantes, pero también pueden ser muy engañosos.

Usaremos la función `generate_fibonacci` en la función `main` de la siguiente manera

```javascript
const main = () => {
    const numbers = generate_fibonacci(
       parseInt(process.argv[2]) || 1000
    );
```

Por supuesto, en `node` no estamos obligados a definir una función `main`, pero considero que es una buena práctica que el programa tenga un punto de partida claramente definido y límites bien delineados entre declarar funciones y procedimientos y utilizarlos.

Por cierto, probablemente notaste que `argv` se indexa completamente diferente nuevamente. Como puedes ver, cada lenguaje tiene su propia convención aquí, y esta vez los dos primeros argumentos son el directorio y el nombre del programa.

Un array de diez ceros, que contendrá los recuentos de los primeros dígitos registrados, se puede declarar de la siguiente manera.

```javascript
const digits = [...new Array(10)].map(() => 0);
```

Contar en sí mismo es tan simple como en otros idiomas.

```javascript
numbers.forEach(n =>
    digits[n.toString().substr(0, 1)]++
)
```

Por otro lado, imprimir resultados en lugar de usar una plantilla donde introducimos valores como argumentos utiliza cadenas de plantilla.

```javascript
    process.stdout.write("N   Ben        Fib\n");
    for (let i = 1; i < digits.length; i++) {
        const ben = digits[i] / numbers.length;
        const fib = Math.log10(1 + 1 / i);
        process.stdout.write(
            `${i}   ${ben.toFixed(6)}   ${fib.toFixed(6)}\n`
        )
    }
}
```

Al final, activamos nuestro programa llamando a la función `main`.

```javascript
main();
```

## Comparación de Rendimiento de Programas

```bash
javac Benford.java
```

Como resultado de este comando, se creará un archivo `Benford.class`.

Para Rust, la compilación realizada por `cargo build` crea una versión de desarrollador que no está optimizada. Para crear una versión optimizada, necesitas añadir el flag `release`.

```bash
cargo build --release
```

Por ejemplo, para `n=1000`, cada programa muestra el mismo resultado, pero los tiempos de computación varían.

![](http://localhost:8484/5aa2a8ee-87c7-4f60-95d5-d70a4da9c9b7.avif)

Rust aplasta a la competencia. Node.js muestra los mismos resultados y muy similares, incluso un buen tiempo, independientemente de si comenzamos desde `1` o `1n`. Java, a pesar de un uso significativo de `cpu`, tarda tanto en iniciarse que realiza el peor desempeño en esta prueba.

Para `n=10000`, el resultado de Java solo aumenta por 10 veces, a pesar de que Rust realiza cálculos dos órdenes de magnitud más largos, y Node 24 veces más largos.

![](http://localhost:8484/81925e03-09e3-49d0-a7c4-2d902da7e63f.avif)

No te dejes engañar por el hecho de que `n` ha aumentado "solo" 10 veces. Los valores procesados por el programa crecen a un ritmo geométrico, alcanzando rápidamente valores gigantescos. Por ejemplo, para `n=10000`, el valor de la secuencia es:

![](http://localhost:8484/f0b9f7f5-50af-448e-9a85-7f206bb8eaa2.avif)

La diferencia en el aumento de rendimiento proviene del hecho de que Java tiene el proceso de inicio más pesado. Node, aunque bastante ligero, aún requiere cargar todo el intérprete, razón por la cual Rust, al tener el inicio más rápido, demostró cuánto ha aumentado realmente la complejidad computacional.

Dado que la carga principal aquí es agregar números cada vez más grandes, cuya longitud aumenta linealmente, podemos esperar una complejidad de O(n^2), que es la que presenta Rust.

La última conclusión es que un programa escrito en `Node JS` con la bandera `--cheat` "no notó" que estaba funcionando incorrectamente. Sus resultados muestran que a pesar de la rápida ejecución, no contó con precisión los dígitos principales. Conociendo las limitaciones del tipo `Number` en Node, sabemos que no puede exceder el valor de `Number.MAX_VALUE`, que es `1.7976931348623157e+308`, mientras que `Log10[Fibonacci[1000]]` es igual a `208.638`, pero `Log10[Fibonacci[10000]]` ya es `2089.53`. Por lo tanto, los números que suma el programa en Node son `Infinity`.

Por supuesto, `Infinity` + `Infinity` = `Infinity`, lo que reduce significativamente el tiempo de cómputo, pero el primer "dígito" de infinito para Node es `I` porque lo calculamos con el comando.

```javascript
n.toString().substr(0, 1)
```

Si me detuviera en la comparación del par de resultados para tres programas, no sería yo mismo. La curiosidad me impulsa a mirar más a fondo y preparar un gráfico que muestre cómo aumentó el tiempo de cómputo con la longitud de la secuencia.

También mostraré el punto de medición `50,000`.

![](http://localhost:8484/855ea912-ebd2-4c71-b67b-200176981079.avif)

Sin embargo, discutir cada uno individualmente no es tan valioso como realizar toda una serie de mediciones y superponerlas en un gráfico común.

### Medición del rendimiento del programa dependiendo del argumento

Para medir eficazmente el rendimiento de los programas, necesitamos resolver varios problemas

* separar los flujos de salida del programa de la medición del rendimiento
* elegir un conjunto de valores para los cuales realizaremos la medición
* dibujar los gráficos

#### Separar el flujo del programa del flujo de medición de tiempo

En bash, los programas se comunican redirigiendo flujos de datos. La salida de un programa puede convertirse en la entrada de otro, que puede querer guardar la información procesada en un archivo.

Para una ejecución simple:

```bash
java Benford 10
```

resultado en forma de:

```tsv
N   Ben        Fib
1   0.300000   0.301030
2   0.200000   0.176091
3   0.200000   0.124939
4   0.000000   0.096910
5   0.200000   0.079181
6   0.000000   0.066947
7   0.000000   0.057992
8   0.100000   0.051153
9   0.000000   0.045757
```

se mostrará en la terminal porque la terminal es la salida predeterminada para el flujo de datos producido por este programa. Los datos producidos por el programa se envían por defecto a través de la salida estándar. Podemos redirigirlo a otro lugar usando `1>` o simplemente `>` y omitir el `1`, que es predeterminado.

Ejecutar `java Benford 10 > out` no mostrará nada pero creará un archivo con datos de la salida estándar.

Sin embargo, cuando precedemos el programa con el comando `time`, es decir, escribimos

```bash
time java Benford 10
```

resultará que recibiremos en el terminal

```tsv
N   Ben        Fib
1   0.300000   0.301030
2   0.200000   0.176091
3   0.200000   0.124939
4   0.000000   0.096910
5   0.200000   0.079181
6   0.000000   0.066947
7   0.000000   0.057992
8   0.100000   0.051153
9   0.000000   0.045757
java Benford 10  0.12s user 0.02s system 153% cpu 0.091 total
```

sin embargo, intentar capturar el tiempo de ejecución en un archivo como antes usando `>` terminará mostrando la línea

```tsv
java Benford 10  0.12s user 0.02s system 153% cpu 0.091 total
```

en la terminal, y toda otra salida se redirigirá al archivo. Esto se debe a que time no mezcla sus datos con los datos de la corriente estándar. En su lugar, utiliza la corriente de error `2>`.

Nuestro objetivo es ocultar los datos de la corriente estándar. Podemos hacerlo redirigiéndolo a `/dev/null`. Esto significa

```bash
time java Benford 10 > /dev/null
```

Sin embargo, el flujo de error es imposible de procesar para nosotros a menos que lo redirijamos al flujo principal. Lograremos esto con el comando

```bash
(time java Benford 10 > /dev/null) 2>&1
```

El resultado de estos dos se ve igual, pero la diferencia clave es que en el segundo caso, podemos procesar el flujo redirigiéndolo a `awk`.

Por ejemplo, un comando que implica procesamiento de datos:

```bash
(time java Benford 10 > /dev/null) 2>&1 | awk '{print $1,10,$6,$10,$12}'
```

solo devolverá en salida estándar

```tsv
java 10 0.11s 154% 0.090
```

para limpiar estos resultados del signo `s` y `%` podemos agregar

```bash
| tr -d "s%"
```

Si queremos ver este resultado mientras lo guardamos en un archivo, `tee` viene en nuestra ayuda - el tercero de mis herramientas favoritas junto a Kafka y Express.

Simplemente agrega al final:

```bash
| tee -a logs
```

y la línea mostrada se añadirá al final del archivo `logs`. Ahora supongamos que queremos envolver el comando generado recientemente en un bucle que itere sobre la secuencia:

```bash
for i in $(seq 5 5 25); do echo $i; done;
```

La secuencia nos mostrará

```tsv
5
10
15
20
25
```

Pero si ingenuamente pegamos `$i` en `print` en `awk` así:

```bash
for i in $(seq 5 5 25); do (time java Benford $i > /dev/null) 2>&1 | awk '{print $1,$i,$6,$10,$12}' | tr -d "s%" | tee -a logs; done;
```

tendríamos una línea repetidamente repetida

```bash
java java Benford $i > /dev/null  0.12s user 0.02s system 152% cpu 0.091 total 0.12 152 0.091
```

Es así porque `i` no existe dentro de `print` a menos que lo pongamos allí. Por lo tanto, `$i` es igual a `$0`, que corresponde a toda la línea, no a una columna seleccionada. Para usar variables dentro del contexto de `print` en `awk`, podemos usar la bandera `-v`. La sintaxis correcta del comando es:

```bash
for i in $(seq 5 5 25); do (time java Benford $i > /dev/null) 2>&1 | awk -v i=$i '{print $1,i,$6,$10,$12}' | tr -d "s%" | tee -a logs; done;
```

y su resultado es escribir simultáneamente en el archivo `logs` y mostrar la línea en la pantalla:

```bash
java 5 0.11 150 0.090
java 10 0.12 153 0.089
java 15 0.11 152 0.088
java 20 0.10 154 0.087
java 25 0.11 153 0.089
```

#### Preparación de una serie de valores `n` para el análisis de rendimiento

```matlab
Module[{steps = 100, minY = 1, maxY = 50000, pow = 3},
   Table[maxY (minY + maxY (n)^pow)/(minY + maxY), {n, 0, 1,
     1/(steps - 1)}]] // Ceiling // DeleteDuplicates
```

resultará en una serie con la siguiente distribución

![](http://localhost:8484/86665921-d254-40b6-937e-bc9bc677d397.avif)

Lo guardamos en el archivo `n_values` con el comando

```matlab
Export["~/exp/benford/n_values.csv", %]
```

#### Preparación de gráficos comparando el rendimiento del programa

Guardaremos el código de medición de rendimiento en un archivo `measure.sh`

```bash
#!/usr/bin/zsh

while IFS= read -r i
do
 (time node benford.js "$i" > /dev/null) 2>&1 | awk -v i="$i" '{print $1,i,$6,$10,$12}' | tee -a logs;
 (time ./target/release/benford "$i" > /dev/null) 2>&1 | awk -v i="$i" '{print "rust",i,$5,$9,$11}' | tee -a logs;
 (time java Benford "$i" > /dev/null) 2>&1 | awk -v i="$i" '{print $1,i,$6,$10,$12}' | tee -a logs;
done;
```

Reemplazamos el bucle `for` con `while`. Usar `cat n_values.csv` es permisible pero no recomendado

[koalaman/shellcheck Wiki](https://github.com/koalaman/shellcheck/wiki/SC2013)

También vale la pena encerrar `$i` entre comillas. Cuando obtuvimos datos de la secuencia, no importó, y no afectará al programa ahora, pero es una buena práctica usar comillas porque si las variables contienen valores con espacios, las palabras separadas por espacios pueden ser tratadas como argumentos en posiciones posteriores en lugar de un solo valor.

[koalaman/shellcheck Wiki](https://github.com/koalaman/shellcheck/wiki/SC2086)

Medimos ingresando

```bash
time zsh measure.sh
```

Subiendo el archivo creado

```matlab
logs = Import["/home/daniel/exp/benford/logs", "Data"];
```

y trazamos un gráfico

```matlab
ListLogPlot[
 Table[{#[[1]],
     PadLeft[ToExpression /@ StringSplit[ToString[#[[2]]], ":"],
        2]*{60, 1} // Total} & /@
   GroupBy[logs, First][i][[All, {2, 5}]], {i, {"java", "rut",
    "node"}}],
 PlotLegends -> {"Java", "Rust", "Node"}, ImageSize -> Full,
 Frame -> True,
 FrameLabel -> {"Fibonaccin sequence length", "Total time"},
 LabelStyle -> Directive[FontSize -> 16]]
```

![](http://localhost:8484/8aafa240-d291-4fd8-beb4-9149876eb2db.avif)

Resumen:

* el largo tiempo de inicio de la máquina virtual de Java impidió que despegara en la fase temprana, haciendo que tuviera el peor rendimiento para valores pequeños de `n`.
* sorprendentemente bien gestionado `Node`, que aunque no se recomienda para tareas intensivas en CPU, tiene una implementación realmente bien optimizada de [BigInt](https://v8.dev/blog/bigint)
* imbatible para `n` bajos resultó ser `Rust`, que, como no está cargado por ningún entorno de ejecución o intérprete, sin embargo sucumbió ante Java para `n` grandes, cuyo equipo ha estado [mejorando](https://es.wikipedia.org/wiki/Rendimiento_de_Java) el rendimiento de Java en versiones sucesivas durante años.

Me doy cuenta de que estos programas pueden ser optimizados, por ejemplo en términos de uso de memoria - no guardando matrices enteras con cadenas. Intenté escribirlos de una manera que sea lo más similar y simple posible en todos los lenguajes. Si notaste un error en ellos, te agradecería mucho que me lo hicieras saber en los comentarios.

### Actualización: Implementaciones de números grandes en Rust

DK13 - un usuario del servicio wykop señaló que en Rust tenemos diferentes implementaciones de números grandes y cuál elegimos afecta significativamente el resultado final.

[Escribe una vez, depura en todas partes.](https://www.wykop.pl/ludzie/DK13/)

[https://github.com/tczajka/bigint-benchmark-rs#results](https://github.com/tczajka/bigint-benchmark-rs#results)

Lo comprobaré pronto y actualizaré el contenido de esta publicación.
