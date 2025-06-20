---
author: Daniel Gustaw
canonicalName: mlp-cnn-mnist
coverImage: https://ucarecdn.com/4e2e19a5-ad94-44f4-bc3f-5e53bc395ccb/-/crop/1024x512/0,0/
description: We build and compare four neural network architectures in PyTorch, visualize performance, explore complexity vs. accuracy, and show why CNNs excel at image classification.
excerpt: We build and compare four neural network architectures in PyTorch, visualize performance, explore complexity vs. accuracy, and show why CNNs excel at image classification.
publishDate: 2025-06-09 00:00:00+00:00
slug: en/mlp-cnn-mnist
tags:
- mlp
- cnn
- mnist
- pytorch
title: From MLP to CNN. Neural Networks for MNIST Digit Recognition
updateDate: 2025-06-09 00:00:00+00:00
---

## Introduction

The **MNIST** dataset is a classic benchmark in computer vision, consisting of 70,000 grayscale images of handwritten digits (28×28 pixels). It's small enough to train quickly but complex enough to reveal differences in model performance—perfect for neural network experiments.

While **Multi-Layer Perceptrons** (MLPs) can technically classify image data, they treat pixels as flat vectors, ignoring spatial patterns. **Convolutional Neural Networks** (CNNs), on the other hand, are designed to exploit local structures in images—edges, curves, textures—making them far more effective for visual tasks.

In this post, I compare four architectures: a simple MLP, a minimal TinyCNN, a balanced CNN, and a heavier StrongCNN. We’ll look at accuracy, training time, and parameter counts to understand the trade-offs.


## Dataset Preparation
- Explain `torchvision.datasets.MNIST`
- Transformation pipeline (ToTensor)
- DataLoader explanation (train/test split)

## Baseline: Multilayer Perceptron (MLP)
- Code snippet
- Explanation of flattening and fully connected layers
- Show accuracy and params

## Step 1: Tiny CNN
- Architecture explanation (low filters, small size)
- Show performance vs MLP
- Trade-offs (low complexity, surprisingly high accuracy)

## Step 2: CNN
- More filters, one hidden FC layer
- Conv → Pool → Conv → Pool → FC
- Better performance, slight increase in params

## Step 3: Strong CNN
- Deeper stack with Dropout
- Strong regularization and capacity
- Excellent accuracy, but heavier and slower

## Results Summary
- Table of accuracy, loss, learning time, parameters
- Graphs (optional): accuracy vs params, loss vs model
- Discussion: diminishing returns, when is "enough" enough?

## Conclusion
- Key takeaways: why CNNs work better, when simpler models suffice
- Encouragement to experiment with architecture depth and regularization
- Mention how this pipeline can be adapted to other datasets

## Appendix (Optional)
- Full training code
- PyTorch setup notes
- Resources for further reading

```text
MLP (25450 parameters)
Test Accuracy: 95.96% | Loss: 0.14 | Learning time: 8.7s

CNN (26698 parameters)
Test Accuracy: 98.22% | Loss: 0.05 | Learning time: 14.3s

Tiny CNN (4266 parameters)
Test Accuracy: 97.96% | Loss: 0.06 | Learning time: 12.3s

Strong CNN (467818 parameters)
Test Accuracy: 99.09% | Loss: 0.03 | Learning time: 75.0s
```