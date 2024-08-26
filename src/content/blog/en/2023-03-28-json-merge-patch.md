---
author: Daniel Gustaw
canonicalName: rust-implementation-of-rfc-7396-json-merge-patch
coverImage: http://localhost:8484/7ce53036-1711-40b9-90bf-0369f97b2f84.avif
date_updated: 2023-03-28 11:43:54+00:00
description: Rust's speed and reliability make it ideal for implementing JSON Merge
  Patch, as defined in RFC 7396. This specification enables efficient and safe partial
  updates to JSON documents.
excerpt: Rust's speed and reliability make it ideal for implementing JSON Merge Patch,
  as defined in RFC 7396. This specification enables efficient and safe partial updates
  to JSON documents.
publishDate: 2023-03-28 11:43:54+00:00
slug: en/json-merge-patch
tags:
- json
- rfc
- rust
title: Rust implementation of RFC 7396 - JSON Merge Patch
---



JSON Merge Patch is a standardized algorithm for describing changes to a JSON document by treating it as a collection of unordered key-value pairs. Defined in RFC 7396, JSON Merge Patch provides a simple and efficient way to update JSON documents in a consistent manner. In this blog post, we will demonstrate how to implement the JSON Merge Patch algorithm in Rust, a systems programming language that emphasizes safety, concurrency, and performance.

## Overview of JSON Merge Patch:

JSON Merge Patch is a technique that allows you to apply modifications to a JSON document by creating a "patch" document. The patch document contains a set of key-value pairs representing the changes to be made to the original document. The algorithm follows these rules:

1. If the patch document contains a key with a non-null value, the key-value pair is added to the original document. If the key already exists, the value is replaced.
2. If the patch document contains a key with a null value, the key is removed from the original document.
3. If the patch document is an array, the original document is replaced with the patch document.
4. If the patch document is a primitive value (e.g.g., string, number, or boolean), the original document is replaced with the patch document.

JSON Merge Patch is particularly useful when you need to make partial updates to a JSON document without sending the entire document back to the server. It's a lightweight alternative to more complex patch formats like JSON Patch (RFC 6902).

## Getting Started with Rust:

To implement JSON Merge Patch in Rust, we will first need to set up a new Rust project and add the `serde_json` crate, which provides support for working with JSON data:

1. Install Rust by following the instructions at [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install).
2. Create a new Rust project with `cargo new json_merge_patch`.
3. Add the `serde_json` crate to your `Cargo.toml` file:

```toml
[dependencies]
serde_json = "1.0"
```

Implementing JSON Merge Patch in Rust:

We will create a `json_merge_patch` function that takes a mutable reference to the original JSON document (the target) and a reference to the patch document. The function will then apply the patch to the target document according to the rules described earlier.

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

In this implementation, we first check if the patch document is an object. If it is, we iterate through the key-value pairs in the patch object and apply the appropriate updates to the target document. If the target document is an array, we handle the case where the patch object has keys that are valid array indices, and modify the target array accordingly:

If the value is null, and the index is within the target array's bounds, remove the element at the index.

If the index is within the target array's bounds, apply the JSON Merge Patch recursively.

If the index is greater than the current length of the target array, fill the target array with null values until it reaches the desired index, and then append the value from the patch object.

If the patch document is not an object, we simply replace the target document with the patch document.

## Testing the Implementation:

Now that we have implemented the JSON Merge Patch algorithm, let's test it using a few examples:

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

In this blog post, we demonstrated how to implement the JSON Merge Patch algorithm (RFC 7396) in Rust. Our implementation is both efficient and easy to understand, and it can be used to apply partial updates to JSON documents in a consistent manner.

We used the `serde_json` crate to work with JSON data in Rust. You can find more information about `serde_json` in the official documentation: [https://docs.serde.rs/serde\_json/](https://docs.serde.rs/serde_json/).

The complete source code for this implementation, including tests, is available on GitHub:

[GitHub - gustawdaniel/json-merge-patch: Rust implementation of RFC 7396 - JSON Merge Patch

Rust implementation of RFC 7396 - JSON Merge Patch - GitHub - gustawdaniel/json-merge-patch: Rust implementation of RFC 7396 - JSON Merge Patch

![](https://github.com/fluidicon.png)GitHubgustawdaniel

![](https://opengraph.githubassets.com/c34b4e8cb98eeb7a9a0e63c0affcb870059934bbf93121f05f370c5b89e57e83/gustawdaniel/json-merge-patch)](https://github.com/gustawdaniel/json-merge-patch)

Feel free to explore, contribute, or use it as a starting point for your own projects.

With Rust's strong guarantees around safety, concurrency, and performance, implementing JSON Merge Patch and other JSON-related algorithms can be both enjoyable and reliable. I encourage you to try Rust for your next project that requires JSON processing or any other system-level programming tasks.
