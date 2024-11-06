---
author: Daniel Gustaw
canonicalName: rust-implementation-of-rfc-7396-json-merge-patch
coverImage: http://localhost:8484/7ce53036-1711-40b9-90bf-0369f97b2f84.avif
description: Prędkość i niezawodność Rust sprawiają, że jest idealny do implementacji JSON Merge Patch, zgodnie z definicją w RFC 7396. Ta specyfikacja umożliwia efektywne i bezpieczne częściowe aktualizacje dokumentów JSON.
excerpt: Prędkość i niezawodność Rust sprawiają, że jest idealny do implementacji JSON Merge Patch, zgodnie z definicją w RFC 7396. Ta specyfikacja umożliwia efektywne i bezpieczne częściowe aktualizacje dokumentów JSON.
publishDate: 2023-03-28 11:43:54+00:00
slug: pl/json-merge-patch
tags:
- json
- rfc
- rust
title: Implementacja Rust RFC 7396 - Łatka JSON Merge
updateDate: 2023-03-28 11:43:54+00:00
---

JSON Merge Patch to znormalizowany algorytm do opisywania zmian w dokumencie JSON, traktując go jako zbiór nieuporządkowanych par klucz-wartość. Zdefiniowany w RFC 7396, JSON Merge Patch oferuje prosty i efektywny sposób aktualizacji dokumentów JSON w spójny sposób. W tym wpisie na blogu pokażemy, jak zaimplementować algorytm JSON Merge Patch w Rust, języku programowania systemowego, który kładzie nacisk na bezpieczeństwo, współbieżność i wydajność.

## Przegląd JSON Merge Patch:

JSON Merge Patch to technika, która pozwala na wprowadzanie modyfikacji do dokumentu JSON poprzez stworzenie dokumentu "łaty". Dokument łatki zawiera zestaw par klucz-wartość, które reprezentują zmiany wprowadzane do oryginalnego dokumentu. Algorytm przestrzega tych zasad:

1. Jeśli dokument łatki zawiera klucz z wartością różną od null, para klucz-wartość jest dodawana do oryginalnego dokumentu. Jeśli klucz już istnieje, wartość jest zastępowana.
2. Jeśli dokument łatki zawiera klucz z wartością null, klucz jest usuwany z oryginalnego dokumentu.
3. Jeśli dokument łatki jest tablicą, oryginalny dokument jest zastępowany przez dokument łatki.
4. Jeśli dokument łatki jest wartością prymitywną (np. łańcuch, liczba, lub boolean), oryginalny dokument jest zastępowany przez dokument łatki.

JSON Merge Patch jest szczególnie przydatny, gdy potrzebujesz dokonać częściowych aktualizacji w dokumencie JSON bez wysyłania całego dokumentu z powrotem na serwer. To lekkie rozwiązanie w porównaniu do bardziej złożonych formatów łatek, takich jak JSON Patch (RFC 6902).

## Rozpoczęcie pracy z Rust:

Aby zaimplementować JSON Merge Patch w Rust, najpierw musimy założyć nowy projekt Rust i dodać paczkę `serde_json`, która zapewnia wsparcie dla pracy z danymi JSON:

1. Zainstaluj Rust, postępując zgodnie z instrukcjami na [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install).
2. Utwórz nowy projekt Rust, używając `cargo new json_merge_patch`.
3. Dodaj paczkę `serde_json` do swojego pliku `Cargo.toml`:

```toml
[dependencies]
serde_json = "1.0"
```

Implementacja JSON Merge Patch w Rust:

Stworzymy funkcję `json_merge_patch`, która przyjmuje mutowalną referencję do oryginalnego dokumentu JSON (cel) oraz referencję do dokumentu poprawki. Funkcja zastosuje poprawkę do dokumentu celu zgodnie z zasadami opisanymi wcześniej.

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

W tej implementacji najpierw sprawdzamy, czy dokument poprawki jest obiektem. Jeśli tak, iterujemy przez pary klucz-wartość w obiekcie poprawki i stosujemy odpowiednie aktualizacje do dokumentu docelowego. Jeśli dokument docelowy jest tablicą, obsługujemy przypadek, gdy obiekt poprawki ma klucze, które są ważnymi indeksami tablicy, i modyfikujemy docelową tablicę w odpowiedni sposób:

Jeśli wartość jest równa null, a indeks mieści się w granicach tablicy docelowej, usuń element w tym indeksie.

Jeśli indeks mieści się w granicach tablicy docelowej, zastosuj JSON Merge Patch rekurencyjnie.

Jeśli indeks jest większy niż obecna długość tablicy docelowej, wypełnij tablicę docelową wartościami null, aż osiągnie pożądany indeks, a następnie dołącz wartość z obiektu poprawki.

Jeśli dokument poprawki nie jest obiektem, po prostu zastępujemy dokument docelowy dokumentem poprawki.

## Testowanie implementacji:

Teraz, gdy zaimplementowaliśmy algorytm JSON Merge Patch, przetestujmy go za pomocą kilku przykładów:

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

W tym poście na blogu pokazaliśmy, jak zaimplementować algorytm JSON Merge Patch (RFC 7396) w Rust. Nasza implementacja jest zarówno wydajna, jak i łatwa do zrozumienia, a także może być używana do stosowania częściowych aktualizacji w dokumentach JSON w sposób spójny.

Użyliśmy biblioteki `serde_json`, aby pracować z danymi JSON w Rust. Więcej informacji na temat `serde_json` można znaleźć w oficjalnej dokumentacji: [https://docs.serde.rs/serde\_json/](https://docs.serde.rs/serde_json/).

Pełny kod źródłowy tej implementacji, w tym testy, jest dostępny na GitHubie:

[GitHub - gustawdaniel/json-merge-patch: Rust implementation of RFC 7396 - JSON Merge Patch](https://github.com/gustawdaniel/json-merge-patch)

Czuj się swobodnie, aby eksplorować, wnosić wkład lub używać tego jako punktu wyjścia do własnych projektów.

Dzięki silnym gwarancjom Rust dotyczących bezpieczeństwa, współbieżności i wydajności, implementacja JSON Merge Patch i innych algorytmów związanych z JSON może być zarówno przyjemna, jak i niezawodna. Zachęcam do spróbowania Rust w swoim następnym projekcie, który wymaga przetwarzania JSON lub jakichkolwiek innych zadań związanych z programowaniem na poziomie systemu.
