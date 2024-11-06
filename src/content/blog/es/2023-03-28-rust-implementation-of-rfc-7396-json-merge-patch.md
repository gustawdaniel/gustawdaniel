---
author: Daniel Gustaw
canonicalName: rust-implementation-of-rfc-7396-json-merge-patch
coverImage: http://localhost:8484/7ce53036-1711-40b9-90bf-0369f97b2f84.avif
description: La velocidad y fiabilidad de Rust lo hacen ideal para implementar JSON Merge Patch, como se define en la RFC 7396. Esta especificación permite actualizaciones parciales eficientes y seguras de documentos JSON.
excerpt: La velocidad y fiabilidad de Rust lo hacen ideal para implementar JSON Merge Patch, como se define en la RFC 7396. Esta especificación permite actualizaciones parciales eficientes y seguras de documentos JSON.
publishDate: 2023-03-28 11:43:54+00:00
slug: es/json-merge-patch
tags:
- json
- rfc
- rust
title: Implementación de Rust de RFC 7396 - JSON Merge Patch
updateDate: 2023-03-28 11:43:54+00:00
---

JSON Merge Patch es un algoritmo estandarizado para describir cambios en un documento JSON tratándolo como una colección de pares clave-valor no ordenados. Definido en la RFC 7396, JSON Merge Patch proporciona una forma simple y eficiente de actualizar documentos JSON de manera consistente. En esta publicación del blog, demostraremos cómo implementar el algoritmo JSON Merge Patch en Rust, un lenguaje de programación de sistemas que enfatiza la seguridad, concurrencia y rendimiento.

## Visión general de JSON Merge Patch:

JSON Merge Patch es una técnica que te permite aplicar modificaciones a un documento JSON creando un documento de "parche". El documento de parche contiene un conjunto de pares clave-valor que representan los cambios que se deben realizar en el documento original. El algoritmo sigue estas reglas:

1. Si el documento de parche contiene una clave con un valor no nulo, el par clave-valor se agrega al documento original. Si la clave ya existe, el valor se reemplaza.
2. Si el documento de parche contiene una clave con un valor nulo, la clave se elimina del documento original.
3. Si el documento de parche es un array, el documento original se reemplaza con el documento de parche.
4. Si el documento de parche es un valor primitivo (por ejemplo, cadena, número o booleano), el documento original se reemplaza con el documento de parche.

JSON Merge Patch es particularmente útil cuando necesitas realizar actualizaciones parciales a un documento JSON sin enviar el documento completo de regreso al servidor. Es una alternativa ligera a formatos de parche más complejos como JSON Patch (RFC 6902).

## Empezando con Rust:

Para implementar JSON Merge Patch en Rust, primero necesitaremos crear un nuevo proyecto de Rust y agregar la crate `serde_json`, que proporciona soporte para trabajar con datos JSON:

1. Instala Rust siguiendo las instrucciones en [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install).
2. Crea un nuevo proyecto de Rust con `cargo new json_merge_patch`.
3. Agrega la crate `serde_json` a tu archivo `Cargo.toml`:

```toml
[dependencies]
serde_json = "1.0"
```

Implementando JSON Merge Patch en Rust:

Crearemos una función `json_merge_patch` que toma una referencia mutable al documento JSON original (el objetivo) y una referencia al documento de parche. La función aplicará el parche al documento objetivo de acuerdo con las reglas descritas anteriormente.

```rust
use serde_json::Value;

pub fn json_merge_patch(target: &mut Value, patch: &Value) {
    match patch {
        Value::Object(patch_obj) => {
            if !(target.is_object()
                || target.is_array() && patch_obj.keys().all(|key| key.parse::<usize>().is_ok()))
            {
                *target = Value::Object(serde_json::Map::new());
            }

            if let Value::Object(target_obj) = target {
                for (key, value) in patch_obj {
                    if value.is_null() {
                        target_obj.remove(key);
                    } else {
                        let target_value =
                            target_obj.entry(key.clone()).or_insert_with(|| Value::Null);
                        json_merge_patch(target_value, value);
                    }
                }
            } else if let Value::Array(target_arr) = target {
                for (key, value) in patch_obj {
                    if let Ok(index) = key.parse::<usize>() {
                        if value.is_null() && index < target_arr.len() {
                            target_arr.remove(index);
                        } else if index < target_arr.len() {
                            json_merge_patch(&mut target_arr[index], value);
                        } else {
                            // Handling the case where the index is greater than the current length of the target array
                            while target_arr.len() < index {
                                target_arr.push(Value::Null);
                            }
                            target_arr.push(value.clone());
                        }
                    }
                }
            }
        }
        Value::Array(patch_arr) => {
            *target = serde_json::Value::Array(
                patch_arr
                    .clone()
                    .into_iter()
                    .filter(|value| !value.is_null())
                    .collect(),
            );
        }
        _ => *target = patch.clone(),
    }
}
```

En esta implementación, primero comprobamos si el documento de parche es un objeto. Si lo es, iteramos a través de los pares clave-valor en el objeto de parche y aplicamos las actualizaciones apropiadas al documento de destino. Si el documento de destino es un array, manejamos el caso en que el objeto de parche tiene claves que son índices de array válidos y modificamos el array de destino en consecuencia:

Si el valor es nulo, y el índice está dentro de los límites del array de destino, elimina el elemento en el índice.

Si el índice está dentro de los límites del array de destino, aplica el JSON Merge Patch de manera recursiva.

Si el índice es mayor que la longitud actual del array de destino, llena el array de destino con valores nulos hasta que alcance el índice deseado, y luego agrega el valor del objeto de parche.

Si el documento de parche no es un objeto, simplemente reemplazamos el documento de destino con el documento de parche.

## Pruebas de la Implementación:

Ahora que hemos implementado el algoritmo JSON Merge Patch, probémoslo usando algunos ejemplos:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_json_merge_patch_should_merge_objects_and_override_field() {
        let mut target = serde_json::from_str(r#"{"a": "b", "c": {"d": "e", "f": "g"}}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": "z", "c": {"f": null}}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        let expected: serde_json::Value =
            serde_json::from_str(r#"{"a": "z", "c": {"d": "e"}}"#).unwrap();
        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_override_field_in_object() {
        let mut target = serde_json::from_str(r#"{"a": "b"}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": "c"}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{"a": "c"}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_add_field_to_object() {
        let mut target = serde_json::from_str(r#"{"a": "b"}"#).unwrap();
        let patch = serde_json::from_str(r#"{"b": "c"}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{"a": "b", "b": "c"}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_remove_field_from_object() {
        let mut target = serde_json::from_str(r#"{"a": "b", "b": "c"}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": null}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{"b": "c"}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_override_field_in_array() {
        let mut target = serde_json::from_str(r#"{"a": ["b"]}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": "c"}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{"a": "c"}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_replace_array_with_scalar() {
        let mut target = serde_json::from_str(r#"{"a": "c"}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": ["b"]}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{"a": ["b"]}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_merge_objects_in_object() {
        let mut target = serde_json::from_str(r#"{"a": {"b": "c"}}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": {"b": "d", "c": null}}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{"a": {"b": "d"}}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_replace_array_with_value() {
        let mut target = serde_json::from_str(r#"{"a": [{"b": "c"}]}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": [1]}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{"a": [1]}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_merge_nested_objects_and_remove_leaf_nodes() {
        let mut target = serde_json::from_str(r#"{}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": {"bb": {"ccc": null}}}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{"a": {"bb": {}}}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_replace_scalar_with_scalar() {
        let mut target = serde_json::from_str(r#"{"a": "b"}"#).unwrap();
        let patch = serde_json::from_str(r#"["c"]"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"["c"]"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_replace_scalar_with_null() {
        let mut target = serde_json::from_str(r#"{"a": "foo"}"#).unwrap();
        let patch = serde_json::Value::Null;

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, serde_json::Value::Null);
    }

    #[test]
    fn test_json_merge_patch_should_replace_scalar_with_string() {
        let mut target = serde_json::from_str(r#"{"a": "foo"}"#).unwrap();
        let patch = serde_json::from_str(r#""bar""#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#""bar""#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_merge_null_with_scalar() {
        let mut target = serde_json::from_str(r#"{"e": null}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": 1}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{"e": null, "a": 1}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_replace_array_with_object() {
        let mut target = serde_json::from_str(r#"{"a": []}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": {"b": "c"}}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{"a": {"b": "c"}}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_merge_objects_in_array() {
        let mut target = serde_json::from_str(r#"[{"a": "b"}, {"c": "d"}]"#).unwrap();
        let patch = serde_json::from_str(r#"{"1": {"e": "f"}}"#).unwrap();
        let expected: serde_json::Value =
            serde_json::from_str(r#"[{"a": "b"}, {"c": "d", "e": "f"}]"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_replace_object_with_array() {
        let mut target = serde_json::from_str(r#"{"a": {"b": "c"}}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": []}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{"a": []}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_merge_arrays() {
        let mut target = serde_json::from_str(r#"["a", "b"]"#).unwrap();
        let patch = serde_json::from_str(r#"["c", "d"]"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"["c", "d"]"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_remove_key_from_object() {
        let mut target = serde_json::from_str(r#"{"a": "b"}"#).unwrap();
        let patch = serde_json::from_str(r#"{"a": null}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"{}"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_remove_index_from_array() {
        let mut target = serde_json::from_str(r#"["a", "b"]"#).unwrap();
        let patch = serde_json::from_str(r#"{"1": null}"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"["a"]"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }

    #[test]
    fn test_json_merge_patch_should_remove_array_element() {
        let mut target = serde_json::from_str(r#"[1, 2, 3]"#).unwrap();
        let patch = serde_json::from_str(r#"[null, 2]"#).unwrap();
        let expected: serde_json::Value = serde_json::from_str(r#"[2]"#).unwrap();

        json_merge_patch(&mut target, &patch);

        assert_eq!(target, expected);
    }
}
```

En esta publicación del blog, demostramos cómo implementar el algoritmo JSON Merge Patch (RFC 7396) en Rust. Nuestra implementación es eficiente y fácil de entender, y se puede utilizar para aplicar actualizaciones parciales a documentos JSON de manera consistente.

Utilizamos la biblioteca `serde_json` para trabajar con datos JSON en Rust. Puedes encontrar más información sobre `serde_json` en la documentación oficial: [https://docs.serde.rs/serde\_json/](https://docs.serde.rs/serde_json/).

El código fuente completo para esta implementación, incluidos los tests, está disponible en GitHub:

[GitHub - gustawdaniel/json-merge-patch: Implementación en Rust de RFC 7396 - JSON Merge Patch](https://github.com/gustawdaniel/json-merge-patch)

Siéntete libre de explorar, contribuir o usarlo como punto de partida para tus propios proyectos.

Con las fuertes garantías de Rust en torno a la seguridad, la concurrencia y el rendimiento, implementar JSON Merge Patch y otros algoritmos relacionados con JSON puede ser tanto placentero como confiable. Te animo a probar Rust para tu próximo proyecto que requiera procesamiento de JSON o cualquier otra tarea de programación a nivel de sistema.
