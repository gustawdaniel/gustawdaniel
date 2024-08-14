---
author: Daniel Gustaw
canonicalName: quicksort-implementation-in-rust-typescript-and-go
date_updated: 2023-02-21 03:51:40+00:00
description: Master QuickSort with our in-depth guide and implementation examples
  in three popular programming languages, and sort large datasets quickly and efficiently.
excerpt: Master QuickSort with our in-depth guide and implementation examples in three
  popular programming languages, and sort large datasets quickly and efficiently.
publishDate: 2023-02-21 03:51:40+00:00
slug: en/quicksort-implementation-in-rust-typescript-and-go
tags:
- quicksort
- rust
- google
- typescript
- sort
title: QuickSort implementation in Rust, Typescript and Go
---


QuickSort is a popular sorting algorithm that follows the divide-and-conquer approach to sort an array of elements. It works by dividing the array into two smaller sub-arrays around a pivot element, which is selected from the array. The elements in the left sub-array are all smaller than the pivot, and the elements in the right sub-array are all greater than the pivot. The pivot element is then placed in its final position, with all elements on its left being smaller than it, and all elements on its right being greater than it. This process is repeated recursively on the left and right sub-arrays until the whole array is sorted.

![](../../../assets/2023-02-21/quicksort-1.png)

Here are the basic steps of the QuickSort algorithm:

1. Choose a pivot element from the array. The pivot can be any element in the array, but it is often chosen to be the first or last element.
2. Partition the array into two sub-arrays around the pivot element. All elements smaller than the pivot are moved to the left sub-array, and all elements greater than the pivot are moved to the right sub-array.
3. Recursively sort the left and right sub-arrays using the same process.
4. Concatenate the sorted left sub-array, the pivot element, and the sorted right sub-array to produce the final sorted array.

To partition the array, QuickSort uses a two-pointer approach, where two pointers are used to scan the array from both ends. The left pointer starts from the first element of the array and moves to the right, while the right pointer starts from the last element of the array and moves to the left. When the left pointer encounters an element greater than or equal to the pivot, and the right pointer encounters an element less than or equal to the pivot, the two elements are swapped. The process continues until the left pointer and right pointer meet, at which point the pivot element is placed in its final position.

The worst-case time complexity of QuickSort is O(n^2), but in practice, it performs much better than this because it has an average-case time complexity of O(n log n). The performance of QuickSort can be further improved by selecting the pivot element more intelligently, for example, by choosing the median of the first, middle, and last elements of the array.

![](../../../assets/2023-02-21/quicksort-2.png)

Although in name there is `Quick` it is not the fastest algorithm, but `O( n log n)` is much better that `O( n^2 )` for popular simple Bubble sort.

I presenting three implementations:

## Quick Sort in Rust

```rust
fn quick_sort<T: Ord>(mut arr: Vec<T>) -> Vec<T> {
    if arr.len() <= 1 {
        return arr;
    }

    let pivot = arr.remove(0);
    let mut left = vec![];
    let mut right = vec![];

    for item in arr {
        if item <= pivot {
            left.push(item);
        } else {
            right.push(item);
        }
    }

    let mut sorted_left = quick_sort(left);
    let mut sorted_right = quick_sort(right);

    sorted_left.push(pivot);
    sorted_left.append(&mut sorted_right);

    sorted_left
}

fn main() {
    let arr = vec![10, 80, 30, 90, 40, 50, 70];

    println!("{:?}", arr);
    println!("{:?}", quick_sort(arr));
}
```

## Quick Sort in TypeScript

```typescript
function quickSort(arr: number[]): number[] {
    if (arr.length <= 1) {
        return arr;
    }

    const pivot = arr[0];
    const left: number[] = [];
    const right: number[] = [];

    for (let i = 1; i < arr.length; i++) {
        if (arr[i] < pivot) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }

    return [...quickSort(left), pivot, ...quickSort(right)];
}

// Example usage
const arr: number[] = [10, 80, 30, 90, 40, 50, 70];
const sortedArr: number[] = quickSort(arr);
console.log(sortedArr);
```

## Quick Sort in Go

```go
package main

import "fmt"

func quickSort(arr []int) []int {
    if len(arr) <= 1 {
        return arr
    }

    pivot := arr[0]
    left := []int{}
    right := []int{}

    for i := 1; i < len(arr); i++ {
        if arr[i] < pivot {
            left = append(left, arr[i])
        } else {
            right = append(right, arr[i])
        }
    }

    return append(append(quickSort(left), pivot), quickSort(right)...)
}

func main() {
    arr := []int{10, 80, 30, 90, 40, 50, 70}
    sortedArr := quickSort(arr)
    fmt.Println(sortedArr)
}
```

## Pivot selection in Quick Sort

There is one problem. In initial description of algorithm I mentioned that we selecting `pivot`. If I am starting with totally random data, then this step rather does not matter, because first element is enough rantom to expect that it can divide array to approximately similar subarrays.

Unfortunately if we getting already sorted, or nearly sorted input, then using first element we losing gain from splitting array using pivot because almost all elements are greater than first one.

The choice of pivot element is a critical factor in the performance of QuickSort, as it can have a significant impact on the number of comparisons and swaps needed to sort the array. If a bad pivot is chosen, such as the smallest or largest element in the array, the performance can degrade to O(n^2), which is much slower than the average-case time complexity of O(n log n) that QuickSort is known for.

To fix this problem we can easy replace

```rust
    let pivot = arr.remove(0);
```

by

```rust
    let pivot_index = arr.len() / 2;
    let pivot = arr.remove(pivot_index);
```

Other little more sophisticated approach is to use median of the first, middle, and last elements of the array as the pivot. Then:

```rust
    let pivot_index = median_of_three(&arr);
    let pivot = arr.remove(pivot_index);
```

and

```rust
fn median_of_three<T: Ord>(arr: &[T]) -> usize {
    let first = arr[0];
    let middle = arr[arr.len() / 2];
    let last = arr[arr.len() - 1];

    if (first < middle && middle < last) || (last < middle && middle < first) {
        arr.len() / 2
    } else if (middle < first && first < last) || (last < first && first < middle) {
        0
    } else {
        arr.len() - 1
    }
}
```

Due this issue with pivot selection QuickSort can be slowed down by specially malicious input data selection, so it is susceptible to some security attacks, such hash table collisions, its many advantages make it a popular choice for sorting large datasets. With the right choice of pivot element, QuickSort can achieve an average-case time complexity of O(n log n), which is faster than most other popular sorting algorithms. If you are working with large datasets and need to sort them quickly, QuickSort is a great choice.

![](../../../assets/2023-02-21/quicksort-3.png)

I know what you think. That this fun with sorting optimization is only for scientists, and in practice we are using sorting build in our languages, but sometimes to build something amazing it is worth to have deeper knowledge and intuition, what is worth to optimize and what not.
