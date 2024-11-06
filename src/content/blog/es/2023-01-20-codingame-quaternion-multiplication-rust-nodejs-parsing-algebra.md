---
author: Daniel Gustaw
canonicalName: codingame-quaternion-multiplication-rust-nodejs-parsing-algebra
coverImage: http://localhost:8484/d49f26ae-0d28-40ec-a9ec-a242c016b45d.avif
description: En este artículo, veremos cómo implementar la multiplicación de cuaterniones en Rust y NodeJS. Aprenderás sobre el análisis y el álgebra.
excerpt: En este artículo, veremos cómo implementar la multiplicación de cuaterniones en Rust y NodeJS. Aprenderás sobre el análisis y el álgebra.
publishDate: 2023-01-20 02:19:57+00:00
slug: es/multiplicacion-de-cuaterniones
tags:
- quaternion
- rust
- nodejs
- algebra
- mathematics
- parsing
title: 'CodinGame: Multiplicación de cuaterniones - Rust, NodeJS - Análisis, Álgebra'
updateDate: 2023-01-20 02:19:57+00:00
---

En este artículo veremos cómo implementar la multiplicación de cuaterniones en Rust y NodeJS. Te animo a que intentes resolver este problema antes de ver las soluciones. A continuación, adjunto un enlace a este ejercicio:

[Juegos de Codificación y Desafíos de Programación para Mejorar el Código](https://www.codingame.com/training/medium/quaternion-multiplication)

Los cuaterniones pertenecen a un sistema numérico que extiende los números complejos. Un cuaternión se define por la suma de múltiplos escalares de las constantes **i**, **j**, **k** y **1**. Más información está disponible en:

[Cuaternión -- de Wolfram MathWorld](https://mathworld.wolfram.com/Quaternion.html)

Considere las siguientes propiedades:  
**jk** = **i**  
**ki** = **j**  
**ij** = **k**  
**i**² = **j**² = **k**² = **\-1**  

Estas propiedades también implican que:  
**kj** = **\-i**  
**ik** = **\-j**  
**ji** = **\-k**  

El orden de la multiplicación es importante.

Tu programa debe mostrar el resultado del producto de una serie de cuaterniones simplificados entre paréntesis.

**Presta atención al formato**  
El coeficiente se agrega a la izquierda de la constante.  
Si un coeficiente es **1** o **\-1**, no incluyas el símbolo **1**.  
Si un coeficiente o término escalar es **0**, no lo incluyas.  
Los términos deben mostrarse en el siguiente orden: a**i** + b**j** + c**k** + d.

**Multiplicación de Ejemplo**  
(2i+2j)(j+1) = (2ij+2i+2j² +2j) = (2k+2i-2+2j) = (2i+2j+2k-2)

---

**Entrada:**

**Línea 1**: La expresión expr a evaluar. Este siempre será el producto de expresiones simplificadas entre paréntesis.

**Salida:** Una sola línea que contiene el resultado simplificado de la expresión del producto. No se requieren paréntesis.

**Restricciones:** Todos los coeficientes en cualquier parte de la evaluación serán menores que **10^9**  
La entrada no contiene más de 10 expresiones simplificadas entre paréntesis.

**Ejemplo**

**Entrada**

```
(i+j)(k)
```

**Salida**

```
i-j
```

# Solución

Decidí presentar solo las partes más importantes aquí. La solución completa se puede encontrar en el repositorio:

[GitHub - gustawdaniel/codingame-quaternion-multiplication](https://opengraph.githubassets.com/85682fcbd54214a903a6cb968a0137db1d1243d42b118b9e0764ac9229c76d63/gustawdaniel/codingame-quaternion-multiplication)](https://github.com/gustawdaniel/codingame-quaternion-multiplication)

Podemos dividir nuestro problema en tres pasos:

* análisis de entrada a la estructura Quaternion
* multiplicación de Quaterniones
* formateo de Quaternion de vuelta a cadena

![](http://localhost:8484/8467207d-4e35-4dd6-ac96-8b874028e6ef.avif)

Estas operaciones de alto nivel se pueden implementar en NodeJS.

```typescript
import {Quaternion} from "./lib";

process.stdin.on('data', (buff) => {
    const line = buff.toString();
    const qs = Quaternion.parse(line);
    process.stdout.write(qs.reduce((p, n) => p.multiply(n)).format());
})
```

y en Rust

```rust
fn main() {
    let mut input_line = String::new();
    io::stdin().read_line(&mut input_line).unwrap();
    let expr = input_line.trim_matches('\n').to_string();

    let qs = Quaternion::parse(&expr);
    let out = qs.into_iter().reduce(|p, n| p.multiply(n)).unwrap();
    println!("{}", out);
}
```

Puedes ver que este código es muy similar, pero en ambos casos tenemos que implementar `Struct/Class` llamado `Quaternion`. Ahora pasaremos por los tres pasos mencionados anteriormente utilizando `TDD`. Las pruebas son nativamente compatibles en rust, pero en `NodeJS` decidí usar `jest` como marco de pruebas.

## Análisis de la entrada a la estructura Quaternion

Nuestra entrada

```
(i+j)(k)
```

debe ser tratado como un arreglo de cuaterniones - separados por corchetes. En cualquier corchete, tenemos un arreglo de coeficientes. Así que podemos dividir nuestro análisis en 4 partes:

* división por corchetes
* división de cualquier corchete en coeficientes
* creación de cuaterniones a partir de arreglos de coeficientes
* extracción de números de coeficientes

![](http://localhost:8484/dd766517-6a3f-4c23-b9df-dbf68b0c0c80.avif)

En NodeJS podemos comenzar con dos pruebas. Primero para casos simples:

```typescript
    it('simple parse', () => {
        const qs = Quaternion.parse('(i+j)');
        expect(qs.length).toEqual(1);
        expect(qs[0].r).toEqual(0);
        expect(qs[0].i).toEqual(1);
        expect(qs[0].j).toEqual(1);
        expect(qs[0].k).toEqual(0);
    });
```

Segundo para coeficientes más avanzados:

```typescript
    it('complex parse', () => {
        const qs = Quaternion.parse('(9+i-j)(k-8.4j)');
        expect(qs.length).toEqual(2);
        expect(qs[0].r).toEqual(9);
        expect(qs[0].i).toEqual(1);
        expect(qs[0].j).toEqual(-1);
        expect(qs[0].k).toEqual(0);

        expect(qs[1].r).toEqual(0);
        expect(qs[1].i).toEqual(0);
        expect(qs[1].j).toEqual(-8.4);
        expect(qs[1].k).toEqual(1);
    });
```

Las pruebas idénticas en `rust` se pueden expresar como

```rust
#[cfg(test)]
mod tests {
    use crate::{Quaternion};


    #[test]
    fn simple_parse() {
        let qs = Quaternion::parse("(i+j)");
        assert_eq!(qs.len(), 1);
        assert_eq!(qs[0].r, 0f64);
        assert_eq!(qs[0].i, 1f64);
        assert_eq!(qs[0].j, 1f64);
        assert_eq!(qs[0].k, 0f64);
    }

    #[test]
    fn complex_parse() {
        let qs = Quaternion::parse("(9+i-j)(k-8.4j)");
        assert_eq!(qs.len(), 2);
        assert_eq!(qs[0].r, 9f64);
        assert_eq!(qs[0].i, 1f64);
        assert_eq!(qs[0].j, -1f64);
        assert_eq!(qs[0].k, 0f64);

        assert_eq!(qs[1].r, 0f64);
        assert_eq!(qs[1].i, 0f64);
        assert_eq!(qs[1].j, -8.4f64);
        assert_eq!(qs[1].k, 1f64);
    }
}
```

Nuestra clase base `Quaternion` tendrá `4` propiedades. En NodeJS:

```typescript
export class Quaternion {
    r: number = 0;
    i: number = 0;
    j: number = 0;
    k: number = 0;
}
```

donde `r` significa `parte` real que hereda la aritmética de los números reales. En `rust` estamos usando la palabra clave `struct` en lugar de `class`

```rust
#[derive(Debug)]
struct Quaternion {
    r: f64,
    i: f64,
    j: f64,
    k: f64,
}
```

### Division de cadenas usando expresiones regulares

Para dividir la entrada y proporcionar arreglos de coeficientes a los constructores de Quaternion, podemos escribir métodos en NodeJS:

```typescript
    static parse(input: string): Quaternion[] {
        const qs = (input.match(/\(.*?\)/g) ?? []).map(
            (e: string) => (e
                    .replace('(', '')
                    .replace(')', '')
                    .match(/[-+]?[\d.]*[ijk]?/g) ?? []
            ).filter(v => v).map(
                v => v.replace(/^\+/, '')
            )
        );
        return qs.map((q) => new Quaternion(q));
    }
```

y Rust

```rust
impl Quaternion {
    fn parse(input: &str) -> Vec<Quaternion> {
        let re = Regex::new(r"\((.*?)\)").expect("can't create regex");

        let qs = re.captures_iter(input).filter_map(|cap| Some(cap.get(1)?.as_str()))
            .map(|m| m.to_string()).collect::<Vec<_>>();

        let re = Regex::new(r"\+?(-?[\d.]*[ijk]?)").expect("can't create regex");

        let res = qs.iter().map(|q| {
            let args = re.captures_iter(&q).filter_map(|cap| Some(cap.get(1)?.as_str()))
                .map(|m| m.to_string()).collect::<Vec<_>>();
            Quaternion::new(args)
        });

        res.collect::<Vec<_>>()
    }
}
```

Generalmente, hay las mismas expresiones regex, pero `rust` requiere aquí una biblioteca externa llamada `regex`. Además, `rust` verifica la corrección de las expresiones regex y asegura el manejo de errores en ellas, lo cual se puede omitir por defecto en el código de `node js`. En general, siento que el enfoque de `node js` hacia regex es más limpio y legible.

Ahora tenemos el siguiente problema. Nuestros coeficientes pueden contener números, números con nombres de componentes como: `i`, `j` o `k`, o incluso letras solitarias como `i` que significa `1i`. También hay signos posibles como `-k`.

Necesitamos un código que extraiga números de ellos. Llamemos `i`, `j` o `k` como `tipo` y la cadena completa del coeficiente como `entrada`. Entonces, extraer un número puede considerarse como:

* eliminar `tipo` de `entrada`
* si el resto no termina con un dígito, entonces agregar `1` al final (el ejemplo es `-`)
* finalmente, analizarlo como float

Implementación en `node js`

```typescript
    static getCoefficient(type: string, input: string): number {
        const coefficient = input.replace(type, '');
        return Number.parseFloat(/\d$/.test(coefficient) ? coefficient : coefficient + '1')
    }
```

y analógico en rust

```rust
    fn get_coefficient(t: &str, input: String) -> f64 {
        let c = input.replace(t, "");
        if Regex::new(r"\d$").expect("ff").is_match(&c) {
            c.parse::<f64>().unwrap()
        } else {
            (c + "1").parse::<f64>().unwrap()
        }
    }
```

En Rust, generalmente manejar conversiones entre tipos requiere más caracteres pero es más confiable. En este caso, escribir `unwrap` nos obliga a pensar en posibles formas de manejar problemas con el análisis.

Ahora podemos presentar constructores. En ellos, pasaremos un arreglo de cadenas con coeficientes como `8`, `-9k` o `i`. En `Node.js`:

```typescript
    constructor(args: Array<string>) {
        for (let arg of args) {
            if (arg.includes('i')) {
                this.i = Quaternion.getCoefficient('i', arg);
            } else if (arg.includes('j')) {
                this.j = Quaternion.getCoefficient('j', arg);
            } else if (arg.includes('k')) {
                this.k = Quaternion.getCoefficient('k', arg);
            } else {
                this.r = Number.parseFloat(arg);
            }
        }
    }
```

o en `rust`:

```rust
    fn new(args: Vec<String>) -> Quaternion {
        let mut q = Quaternion {
            i: 0f64,
            j: 0f64,
            k: 0f64,
            r: 0f64,
        };

        for arg in args {
            if arg.contains("i") {
                q.i = Quaternion::get_coefficient("i", arg)
            } else if arg.contains("j") {
                q.j = Quaternion::get_coefficient("j", arg)
            } else if arg.contains("k") {
                q.k = Quaternion::get_coefficient("k", arg)
            } else {
                q.r = arg.parse::<f64>().unwrap()
            }
        }

        q
    }
```

## Multiplicación de Cuaterniones

La multiplicación de dos cuaterniones es similar a la multiplicación de polinomios. Primero, multiplicamos cualquier par de componentes entre sí. Luego podemos agruparlas por tipo de componente y, finalmente, sumar los coeficientes. La diferencia es que en la multiplicación de polinomios siempre estamos sumando potencias, pero en los cuaterniones estamos utilizando álgebra de división no conmutativa presentada en la tabla:

![](http://localhost:8484/c7947573-0696-486e-8bd7-ffbfc5b8c85c.avif)

Así que básicamente podemos dividir nuestro problema en:

* multiplicación de elementos base
* multiplicación de combinaciones lineales de elementos base

### Multiplicación de elementos base

Reescribí todos los casos posibles en el archivo de prueba en `NodeJS`

```typescript
    it('multiply base', () => {
        expect(Quaternion.multiplyBase('r', 'r')).toEqual({c: 1, d: 'r'});
        expect(Quaternion.multiplyBase('r', 'i')).toEqual({c: 1, d: 'i'});
        expect(Quaternion.multiplyBase('r', 'j')).toEqual({c: 1, d: 'j'});
        expect(Quaternion.multiplyBase('r', 'k')).toEqual({c: 1, d: 'k'});

        expect(Quaternion.multiplyBase('i', 'r')).toEqual({c: 1, d: 'i'});
        expect(Quaternion.multiplyBase('i', 'i')).toEqual({c: -1, d: 'r'});
        expect(Quaternion.multiplyBase('i', 'j')).toEqual({c: 1, d: 'k'});
        expect(Quaternion.multiplyBase('i', 'k')).toEqual({c: -1, d: 'j'});

        expect(Quaternion.multiplyBase('j', 'r')).toEqual({c: 1, d: 'j'});
        expect(Quaternion.multiplyBase('j', 'i')).toEqual({c: -1, d: 'k'});
        expect(Quaternion.multiplyBase('j', 'j')).toEqual({c: -1, d: 'r'});
        expect(Quaternion.multiplyBase('j', 'k')).toEqual({c: 1, d: 'i'});

        expect(Quaternion.multiplyBase('k', 'r')).toEqual({c: 1, d: 'k'});
        expect(Quaternion.multiplyBase('k', 'i')).toEqual({c: 1, d: 'j'});
        expect(Quaternion.multiplyBase('k', 'j')).toEqual({c: -1, d: 'i'});
        expect(Quaternion.multiplyBase('k', 'k')).toEqual({c: -1, d: 'r'});
    })
```

y `Rust`

```rust
    #[test]
    fn multiply_base() {
        assert_eq!(Quaternion::multiply_base('r', 'r'), SignedCoefficient { c: 1f64, d: 'r' });
        assert_eq!(Quaternion::multiply_base('r', 'i'), SignedCoefficient { c: 1f64, d: 'i' });
        assert_eq!(Quaternion::multiply_base('r', 'j'), SignedCoefficient { c: 1f64, d: 'j' });
        assert_eq!(Quaternion::multiply_base('r', 'k'), SignedCoefficient { c: 1f64, d: 'k' });

        assert_eq!(Quaternion::multiply_base('i', 'r'), SignedCoefficient { c: 1f64, d: 'i' });
        assert_eq!(Quaternion::multiply_base('i', 'i'), SignedCoefficient { c: -1f64, d: 'r' });
        assert_eq!(Quaternion::multiply_base('i', 'j'), SignedCoefficient { c: 1f64, d: 'k' });
        assert_eq!(Quaternion::multiply_base('i', 'k'), SignedCoefficient { c: -1f64, d: 'j' });

        assert_eq!(Quaternion::multiply_base('j', 'r'), SignedCoefficient { c: 1f64, d: 'j' });
        assert_eq!(Quaternion::multiply_base('j', 'i'), SignedCoefficient { c: -1f64, d: 'k' });
        assert_eq!(Quaternion::multiply_base('j', 'j'), SignedCoefficient { c: -1f64, d: 'r' });
        assert_eq!(Quaternion::multiply_base('j', 'k'), SignedCoefficient { c: 1f64, d: 'i' });

        assert_eq!(Quaternion::multiply_base('k', 'r'), SignedCoefficient { c: 1f64, d: 'k' });
        assert_eq!(Quaternion::multiply_base('k', 'i'), SignedCoefficient { c: 1f64, d: 'j' });
        assert_eq!(Quaternion::multiply_base('k', 'j'), SignedCoefficient { c: -1f64, d: 'i' });
        assert_eq!(Quaternion::multiply_base('k', 'k'), SignedCoefficient { c: -1f64, d: 'r' });
    }
```

En `Rust`, tengo que definir `SignedCoefficient`, que eran objetos anónimos simples en `node`.

```rust
#[derive(Debug)]
struct SignedCoefficient {
    c: f64,
    d: char,
}
```

además, tengo que implementar la relación de ecuación en ellos para usar `assert_eq`.

```rust
impl PartialEq<SignedCoefficient> for SignedCoefficient {
    fn eq(&self, other: &SignedCoefficient) -> bool {
        self.c == other.c && self.d == other.d
    }
}
```

La función `multiplyBase` es super simple y para construirla tenemos que ver que:

* la multiplicación por 1 es siempre el otro elemento. `a * 1 = a` y `1 * a = a`
* excluyendo 1 siempre tenemos `a * a = -1`
* excluyendo 1 y la diagonal siempre recibimos un coeficiente diferente de aquellos utilizados para multiplicar, el signo se puede determinar utilizando la operación `%2` y la dirección de la multiplicación.

Usando estas observaciones podemos definir la multiplicación en `node` como

```typescript
    static multiplyBase(a: Base, b: Base): { c: -1 | 1, d: Base } {
        if (a === 'r') return {c: 1, d: b};
        if (b === 'r') return {c: 1, d: a};
        if (a === b) return {c: -1, d: 'r'};
        const diff = a.charCodeAt(0) - b.charCodeAt(0);
        return {
            c: (diff > 0 ? -1 : 1) * ((diff + 2) % 2 === 0 ? -1 : 1) as -1 | 1,
            d: ['i', 'j', 'k'].find((e) => e !== a && e !== b) as Base
        }
    }
```

y en `rust`

```rust
    fn multiply_base(a: char, b: char) -> SignedCoefficient {
        if a == 'r' { return SignedCoefficient { c: 1f64, d: b }; }
        if b == 'r' { return SignedCoefficient { c: 1f64, d: a }; }
        if a == b { return SignedCoefficient { c: -1f64, d: 'r' }; }
        let diff = u32::from(a) as i32 - u32::from(b) as i32;

        SignedCoefficient {
            c: (if diff > 0 { -1f64 } else { 1f64 }) * (if (diff + 2i32) % 2 == 0 { -1f64 } else { 1f64 }),
            d: vec!['i', 'j', 'k'].iter().find(|&&e| e != a && e != b).unwrap().to_owned(),
        }
    }
```

### Multiplicación de combinaciones lineales

Dividí las pruebas de multiplicación en casos simples y complejos.

```typescript
    it('simple multiply', () => {
        const res = (new Quaternion(['1']))
            .multiply(new Quaternion(['1']))

        expect(res.r).toEqual(1);
        expect(res.i).toEqual(0);
        expect(res.j).toEqual(0);
        expect(res.k).toEqual(0);
    })

    it('complex multiply', () => {
        const res = (new Quaternion(['2i', '2j']))
            .multiply(new Quaternion(['j', '1']))

        expect(res.r).toEqual(-2);
        expect(res.i).toEqual(2);
        expect(res.j).toEqual(2);
        expect(res.k).toEqual(2);
    })
```

y

```rust
    #[test]
    fn simple_multiply() {
        let res = Quaternion::new(vec![String::from("1")])
            .multiply(Quaternion::new(vec![String::from("1")]));

        assert_eq!(res, Quaternion {
            r: 1f64,
            i: 0f64,
            j: 0f64,
            k: 0f64,
        })
    }

    #[test]
    fn complex_multiply() {
        let res = Quaternion::new(vec![String::from("2i"), String::from("2j")])
            .multiply(Quaternion::new(vec![String::from("j"), String::from("1")]));

        assert_eq!(res, Quaternion {
            r: -2f64,
            i: 2f64,
            j: 2f64,
            k: 2f64,
        })
    }
```

aquí para comparar cuaterniones tenemos que implementar `PartialEq`

```rust
impl PartialEq<Quaternion> for Quaternion {
    fn eq(&self, other: &Quaternion) -> bool {
        self.r == other.r && self.i == other.i && self.j == other.j && self.k == other.k
    }
}
```

En `NodeJS`, se puede reducir a un bucle anidado como este

```typescript
    multiply(a: Quaternion): Quaternion {
        const res = new Quaternion([]);
        for (let p of ['r', 'i', 'j', 'k'] as Array<Base>) {
            for (let n of ['r', 'i', 'j', 'k'] as Array<Base>) {
                const {c, d} = Quaternion.multiplyBase(p, n);
                res[d] += c * this[p] * a[n];
            }
        }
        return res;
    }
```

`c` es un signo, `d` es el nombre del coeficiente.

En `Rust`, no podemos acceder a propiedades dinámicas que son caracteres, así que tenemos que añadir dos métodos auxiliares para obtener y establecer valores usando caracteres.

```rust
    fn get(&self, key: char) -> f64 {
        match key {
            'r' => self.r,
            'i' => self.i,
            'j' => self.j,
            'k' => self.k,
            _ => 0f64
        }
    }

    fn set(&mut self, key: char, value: f64) -> &Quaternion {
        match key {
            'r' => self.r = value,
            'i' => self.i = value,
            'j' => self.j = value,
            'k' => self.k = value,
            _ => ()
        }

        self
    }

    fn multiply(&self, a: Quaternion) -> Quaternion {
        let mut res = Quaternion::new(vec![]);
        for p in vec!['r', 'i', 'j', 'k'] {
            for n in vec!['r', 'i', 'j', 'k'] {
                let SignedCoefficient { c, d } = Quaternion::multiply_base(p, n);
                res.set(d, res.get(d) + c * self.get(p) * a.get(n));
            }
        }
        res
    }
```

pero generalmente la idea es la misma.

Ahora tenemos un programa que puede leer la entrada, convertirla a un arreglo de cuaterniones y multiplicarlos.

![](http://localhost:8484/0dd8108f-02cd-4dfd-84c6-63517935dd45.avif)

El último elemento que falta es formatear el resultado como cadena.

## Formateando cuaterniones a cadenas

Los resultados de formateo se pueden considerar como:

* formatear cualquier coeficiente individual usando tratamientos especiales para `1`
* construir un array ordenado de coeficientes que se unen como cadena

Estas operaciones son la inversa del análisis presentado en la primera parte. Comencemos con las pruebas en `node js`

```typescript
    it('format coefficient', () => {
       expect(Quaternion.formatCoefficient('i', 20)).toEqual('20i');
       expect(Quaternion.formatCoefficient('i', 1)).toEqual('i');
       expect(Quaternion.formatCoefficient('', 0)).toEqual('0');
    });

    it('format', () => {
        expect((new Quaternion([]).format())).toEqual('0');
        expect((new Quaternion(['1']).format())).toEqual('1');
        expect((new Quaternion(['i', '1']).format())).toEqual('i+1');
        expect((new Quaternion(['i', '-3.4j', '1']).format())).toEqual('i-3.4j+1');
        expect((new Quaternion(['j', 'k']).format())).toEqual('j+k');

    })
```

Pruebas analógicas en `rust`

```rust
    #[test]
    fn format_coefficient() {
        assert_eq!(Quaternion::format_coefficient('i', 20f64), String::from("20i"));
        assert_eq!(Quaternion::format_coefficient('i', 1f64), String::from("i"));
        assert_eq!(Quaternion::format_coefficient(' ', 0f64), String::from("0"));
    }

    #[test]
    fn format() {
        assert_eq!(format!("{}", Quaternion::new(vec![])), String::from("0"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("1")])), String::from("1"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("i"), String::from("1")])), String::from("i+1"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("i"), String::from("-3.4j"), String::from("1")])), String::from("i-3.4j+1"));
        assert_eq!(format!("{}", Quaternion::new(vec![String::from("j"), String::from("k")])), String::from("j+k"));
    }
```

En la función `formatCoefficient`, manejamos casos como `1`, `-`, y determinamos si nombres de componentes como `i`, `j` o `k` deben ser incluidos en el resultado.

```typescript
    static formatCoefficient(type: Base | '', value: number) {
        const out = `${Math.abs(value) === 1 ? (
            Math.sign(value) === 1 ? '' : '-'
        ) : value}${type}`;
        return /[\dijk]$/.test(out) ? out : `${out}1`;
    }
```

y

```rust
    fn format_coefficient(t: char, value: f64) -> String {
        let out = if f64::abs(value) == 1f64 {
            if f64::signum(value) == 1f64 {
                String::from("") + &t.to_string()[..].trim()
            } else {
                String::from("-") + &t.to_string()[..].trim()
            }
        } else {
            format!("{}", value) + &t.to_string()[..].trim()
        };

        match Regex::new(r"[\dijk]$").unwrap().captures(&out[..]) {
            Some(_) => out,
            None => out + "1"
        }
    }
}
```

En la función `format`, recopilamos estos componentes y decidimos cómo unirlos. No podemos unir usando `+` porque algunos elementos comienzan con `-`. Sin embargo, debemos manejar el caso de `0`. Finalmente, en `NodeJS`, tenemos:

```typescript
    format(): string {
        let out = [];
        if (this.i) {
            out.push(Quaternion.formatCoefficient('i', this.i));
        }
        if (this.j) {
            out.push(Quaternion.formatCoefficient('j', this.j));
        }
        if (this.k) {
            out.push(Quaternion.formatCoefficient('k', this.k));
        }
        if (this.r) {
            out.push(Quaternion.formatCoefficient('', this.r));
        }

        if (!out.length) return '0';

        return out.reduce((p, n) => p + (
            p.length && Quaternion.getCoefficient('',n.replace(/[kij]/, '')) > 0 ? `+${n}` : `${n}`), ''
        );
    }
```

mientras que en la implementación de `rust` el formateo se puede hacer mediante la función `fmt`

```rust
impl fmt::Display for Quaternion {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut out: Vec<String> = vec![];
        if self.i != 0f64 {
            out.push(Quaternion::format_coefficient('i', self.i))
        }
        if self.j != 0f64 {
            out.push(Quaternion::format_coefficient('j', self.j))
        }
        if self.k != 0f64 {
            out.push(Quaternion::format_coefficient('k', self.k))
        }
        if self.r != 0f64 {
            out.push(Quaternion::format_coefficient(' ', self.r))
        }

        let out = out.into_iter().reduce(
            |p, n| format!(
                "{}{}",
                p.clone(),
                if p.len() > 0 && Quaternion::get_coefficient(&"", n.replace("i", "").replace("j", "").replace("k", "")) > 0f64 {
                    format!("{}{}", "+", n)
                } else {
                    n
                }
            )
        );

        write!(f, "{}", out.unwrap_or(String::from("0")))
    }
}
```

### Pruebas e2e finales

Para verificar que todos los componentes de los programas correspondan entre sí, podemos preparar algunos casos de prueba `e2e` en `node`

```typescript
    it('e2e', () => {
        const cases = [
            {
                in: '(i+j)(k)',
                out: 'i-j'
            },
            {
                in: '(i+j+20)(j-9)',
                out: '-9i+11j+k-181'
            },
            {
                in: '(10i)(10j-k+1)(-99i+j-10k+7)(4)',
                out: '-520i-38920j+6800k+7920'
            },
            {
                in: '(i+j+k+1)(i+2j+4k+8)(i+3j+9k+27)(i+j+8k+8)(i-j+k-10)(99i-j+k-1)(k)(j)(i)(3)',
                out: '11415288i-8751432j-5206896k+9766704'
            }
        ]
        for (const c of cases) {
            const qs = Quaternion.parse(c.in);
            const out = qs.reduce((p, n) => p.multiply(n)).format();
            expect(out).toEqual(c.out);
        }
    })
```

y de manera análoga en `rust`

```rust
#[test]
    fn e2e() {
        struct Case {
            input: String,
            output: String,
        }

        let cases: Vec<Case> = vec![
            Case {
                input: String::from("(i+j)(k)"),
                output: String::from("i-j"),
            },
            Case {
                input: String::from("(i+j+20)(j-9)"),
                output: String::from("-9i+11j+k-181"),
            },
            Case {
                input: String::from("(10i)(10j-k+1)(-99i+j-10k+7)(4)"),
                output: String::from("-520i-38920j+6800k+7920"),
            },
            Case {
                input: String::from("(i+j+k+1)(i+2j+4k+8)(i+3j+9k+27)(i+j+8k+8)(i-j+k-10)(99i-j+k-1)(k)(j)(i)(3)"),
                output: String::from("11415288i-8751432j-5206896k+9766704"),
            },
        ];
        for c in cases {
            let qs = Quaternion::parse(&c.input[..]);
            let out = qs.into_iter().reduce(|p, n| p.multiply(n)).unwrap();
            assert_eq!(format!("{}", out), c.output);
        }
    }
```

Es el final de este ejercicio. Si estás interesado en aprender más sobre la multiplicación de cuaterniones y cómo se conecta con la geometría, te recomiendo el video:

Como puedes ver, `rust` y `typescript` tienen muchos elementos similares. Todas las descripciones y los elementos lógicos son idénticos y solo las diferencias se pueden ver en el nivel de la sintaxis, que está más enfocada en la eliminación de comportamientos indefinidos en rust. Por otro lado, en typescript el código se puede escribir de una manera un poco más concisa que puede mejorar la legibilidad.
