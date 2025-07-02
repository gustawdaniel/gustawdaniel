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

The **MNIST** dataset is a classic benchmark in computer vision, consisting of 70,000 grayscale images of handwritten
digits (28×28 pixels). It's small enough to train quickly but complex enough to reveal differences in model
performance—perfect for neural network experiments.

While **Multi-Layer Perceptrons** (MLPs) can technically classify image data, they treat pixels as flat vectors,
ignoring spatial patterns. **Convolutional Neural Networks** (CNNs), on the other hand, are designed to exploit local
structures in images—edges, curves, textures—making them far more effective for visual tasks.

In this post, I compare four architectures: a simple MLP, a minimal TinyCNN, a balanced CNN, and a heavier StrongCNN.
We’ll look at accuracy, training time, and parameter counts to understand the trade-offs.

## Dataset Preparation

As mentioned earlier, we’re using the **MNIST** dataset, conveniently available through `torchvision.datasets`. With
just a few lines of code, we download and load the data, apply a basic transformation, and prepare it for training:

```python
from torchvision import datasets, transforms

transform = transforms.ToTensor()

train_data = datasets.MNIST(
    root="./data", train=True, download=True, transform=transform
)
test_data = datasets.MNIST(
    root="./data", train=False, download=True, transform=transform
)
```

The only preprocessing step here is `transforms.ToTensor()`, which converts each image to a PyTorch tensor and
normalizes its pixel values to the `[0.0, 1.0]` range.

```python
from torch.utils.data import DataLoader

BATCH_SIZE = 64

train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True)
test_loader = DataLoader(test_data, batch_size=BATCH_SIZE)
```

Shuffling the training data avoids memorizing digit order. For the test set, we skip shuffling but still use batching
for efficiency.

We can display some sample images to visualize the dataset:

```python
import matplotlib.pyplot as plt

images, labels = next(iter(train_loader))

plt.figure(figsize=(6, 6))
for i in range(9):
    plt.subplot(3, 3, i + 1)
    plt.imshow(images[i][0], cmap="gray")
    plt.title(f"Label: {labels[i].item()}")
    plt.axis("off")
plt.tight_layout()
plt.savefig("mnist_digits.svg")
plt.show()
```

![](https://ucarecdn.com/f919e89b-28e9-47bd-916a-5e16389bc3d0/)

## Training and Evaluation

Now that our data is ready, it's time to teach our models how to read handwritten digits. To do this, we define a
standard training and evaluation loop using PyTorch’s idiomatic structure. We’ll also track model complexity using a
simple parameter counter—useful when comparing different architectures.

### Device Setup and Epochs

First, we detect whether a GPU is available. If so, training will happen on CUDA; otherwise, we fall back to CPU. We
also set a reasonable training duration:

```python
import torch

EPOCHS = 5
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

Five epochs may not sound like much, but on MNIST, it's often enough to get surprisingly good results—even with basic
models.

### Training Loop

Here’s our `train()` function. It's as boilerplate as it gets: set the model to training mode, loop over batches,
calculate the loss, and update the weights.

```python
def train(model, loader, optimizer, criterion):
    model.train()
    for x, y in loader:
        x, y = x.to(DEVICE), y.to(DEVICE)
        optimizer.zero_grad()
        output = model(x)
        loss = criterion(output, y)
        loss.backward()
        optimizer.step()
```

This function doesn’t return anything—it just updates the model's internal parameters. During training, we don’t care
about accuracy yet. We'll check that later.

### Evaluation Loop

After training, we evaluate on the test set. The model is set to `eval()` mode, gradients are disabled, and we collect
two metrics: accuracy and average cross-entropy loss.

```python
import torch.nn.functional as F

def test(model, loader):
    model.eval()
    correct = 0
    total = 0
    total_loss = 0.0
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(DEVICE), y.to(DEVICE)
            output = model(x)
            loss = F.cross_entropy(output, y)
            total_loss += loss.item()
            preds = output.argmax(dim=1)
            correct += (preds == y).sum().item()
            total += y.size(0)
    avg_loss = total_loss / len(loader)  # average over batches
    return correct / total, avg_loss
```

Notice that we take the mean loss over batches—not individual examples. It's a good balance between performance tracking
and simplicity.

### Parameter Count

Before we compare architectures, it’s helpful to know how many trainable parameters each one has. This tiny utility
gives us the count:

```python
def count_params(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
```

Spoiler: the `StrongCNN` has over `450,000` parameters, while `TinyCNN` manages with just a few thousand. That’s a huge
difference—and a great starting point for deeper analysis.

### Experiment Runner

Finally, we put everything together into a single function that trains a model, times the process, evaluates on the test
set, and prints a short summary:

```python
import time
import torch.optim as optim
import torch.nn as nn

def run_experiment(model_class, name):
    model = model_class().to(DEVICE)
    optimizer = optim.Adam(model.parameters())
    criterion = nn.CrossEntropyLoss()

    print(f"\n{name} ({count_params(model)} parameters)")
    start = time.time()
    for epoch in range(EPOCHS):
        train(model, train_loader, optimizer, criterion)
    duration = time.time() - start

    acc, loss = test(model, test_loader)
    print(f"Test Accuracy: {acc * 100:.2f}% | Loss: {loss:.2f} | Learning time: {duration:.1f}s")
```

This structure is flexible enough to work with any model class you pass in—from simple MLPs to deep convolutional
beasts.

In the next section, we’ll define and analyze the four architectures: `MLP`, `TinyCNN`, `CNN`, and `StrongCNN`.

## Model 1: Multi-Layer Perceptron (MLP)

The simplest architecture we consider is the classic Multi-Layer Perceptron (MLP). It treats each 28×28 image as a flat
vector of 784 pixels, ignoring spatial structure but still able to learn useful features through fully connected layers.

![](https://ucarecdn.com/cd180d21-2acb-4c37-93b8-7ca827a6a1bf/)

```python
import torch.nn as nn

class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        h = 32  # number of hidden units
        self.model = nn.Sequential(
            nn.Flatten(),          # Flatten 28x28 image into a vector of length 784
            nn.Linear(28 * 28, h), # Fully connected layer: 784 → 32
            nn.ReLU(),             # Non-linear activation
            nn.Linear(h, 10)       # Output layer: 32 → 10 classes
        )

    def forward(self, x):
        return self.model(x)
```

### Explanation

- **Flatten** converts the 2D input image into a 1D vector.
- The first **Linear** layer projects this input vector into a 32-dimensional hidden space.
- The **ReLU** activation introduces non-linearity to learn complex patterns.
- The final **Linear** layer outputs logits for the 10 digit classes.

This small MLP has relatively few parameters and trains quickly, but it does not capture the spatial relationships
between pixels, limiting its accuracy on image data.

Calling

```python
run_experiment(MLP, "MLP")
```

you should see:

```
MLP (25450 parameters)
Test Accuracy: 95.96% | Loss: 0.14 | Learning time: 8.7s
```

It will be our point of reference for comparing `cnn` models.

## Model 2: TinyCNN — A Minimal Convolutional Neural Network

Next, we introduce a simple TinyCNN architecture that leverages convolutional layers to capture spatial patterns in
images. This model is lightweight but far more powerful than the MLP for image tasks.

The figure below illustrates the TinyCNN architecture:

![](https://ucarecdn.com/31fd2ef1-f51d-421c-88d7-21845946c683/)

```python
import torch.nn as nn

class TinyCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(1, 4, kernel_size=3, padding=1),   # 1x28x28 → 4x28x28
            nn.ReLU(),
            nn.MaxPool2d(2),                             # 4x14x14
            nn.Conv2d(4, 8, kernel_size=3, padding=1),   # 8x14x14
            nn.ReLU(),
            nn.MaxPool2d(2),                             # 8x7x7
            nn.Flatten(),
            nn.Linear(8 * 7 * 7, 10)                     # Direct to output layer
        )

    def forward(self, x):
        return self.net(x)
```

### Architecture Overview

- The network begins with a convolutional layer transforming the input from 1 channel to 4 channels, preserving spatial
  dimensions with padding.
- A **ReLU** activation adds non-linearity.
- **MaxPooling** halves the spatial size to 14×14, reducing computational cost and providing spatial invariance.
- A second convolution expands feature maps from 4 to 8 channels.
- Another ReLU and max-pooling reduce the feature map size to 7×7.
- Finally, the features are flattened and passed directly to a linear layer outputting logits for the 10 digit classes.

```
======================================================================
Layer (type:depth-idx)                   Output Shape          Param #
======================================================================
TinyCNN                                  [64, 10]                  --
├─Sequential: 1-1                        [64, 10]                  --
│    └─Conv2d: 2-1                       [64, 4, 28, 28]           40
│    └─ReLU: 2-2                         [64, 4, 28, 28]           --
│    └─MaxPool2d: 2-3                    [64, 4, 14, 14]           --
│    └─Conv2d: 2-4                       [64, 8, 14, 14]           296
│    └─ReLU: 2-5                         [64, 8, 14, 14]           --
│    └─MaxPool2d: 2-6                    [64, 8, 7, 7]             --
│    └─Flatten: 2-7                      [64, 392]                 --
│    └─Linear: 2-8                       [64, 10]                3,930
======================================================================
Total params: 4,266
Trainable params: 4,266
Non-trainable params: 0
Total mult-adds (Units.MEGABYTES): 5.97
======================================================================
Input size (MB): 0.20
Forward/backward pass size (MB): 2.41
Params size (MB): 0.02
Estimated Total Size (MB): 2.63
======================================================================
```

Sometimes `cnn` are presented graphically as the following pipeline:

![](https://ucarecdn.com/49c9ba4e-3a99-441c-8255-ecde041531a4/-/preview/865x173/)

what is most interesting, that we are beating results of `mlp` with just `4266` parameters instead of `25450`.

```
Tiny CNN (4266 parameters)
Test Accuracy: 97.96% | Loss: 0.06 | Learning time: 12.3s
```

With few times smaller network we can expect half of mistakes in comparison to the previous model.

Let's check how our network would improve if we would maintain similar amount of parameters to original MLP.

## Modle 3: CNN — A Balanced Convolutional Neural Network

Now that we've seen what a minimal convolutional model can do, let’s scale things up a bit.

![](https://ucarecdn.com/f4949a96-b88c-44bd-a584-596deb7a5967/)

The **CNN** model below is designed to maintain a balanced trade-off between parameter count and performance. It expands
the feature extraction capabilities of the `TinyCNN` by using more filters and a hidden linear layer before the final
output.

```python
class CNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(1, 8, kernel_size=3, padding=1),   # 1x28x28 → 8x28x28
            nn.ReLU(),
            nn.MaxPool2d(2),                             # 8x14x14
            nn.Conv2d(8, 16, kernel_size=3, padding=1),  # 16x14x14
            nn.ReLU(),
            nn.MaxPool2d(2),                             # 16x7x7
            nn.Flatten(),
            nn.Linear(16 * 7 * 7, 32),                   # Dense layer with 32 units
            nn.ReLU(),
            nn.Linear(32, 10)                            # Final output layer
        )

    def forward(self, x):
        return self.net(x)
```

### Architecture Breakdown

Compared to `TinyCNN`, this model:

- Doubles the number of convolutional filters (8 → 16), allowing it to capture richer visual patterns.
- Adds a **hidden fully connected layer** with 32 neurons before the output. This extra layer improves the model's ability
  to combine extracted features before making the final classification.
- Still uses only two convolutional layers and two pooling layers—keeping it reasonably lightweight and fast.

In table below there are all layers, output shapes, and parameters without batch dimension:


| Layer              | Output Shape | Parameters |
|--------------------|--------------|------------|
| Conv2d (1→8, 3×3)  | 8×28×28      | 80         |
| ReLU               | 8×28×28      | 0          |
| MaxPool2d          | 8×14×14      | 0          |
| Conv2d (8→16, 3×3) | 16×14×14     | 1,168      |
| ReLU               | 16×14×14     | 0          |
| MaxPool2d          | 16×7×7       | 0          |
| Flatten            | 784          | 0          |
| Linear (784 → 32)  | 32           | 25,120     |
| ReLU               | 32           | 0          |
| Linear (32 → 10)   | 10           | 330        |
| **Total**          | —            | **26,698** |

![](https://ucarecdn.com/1130eea0-13da-44cb-a7b1-86f44789054f/-/preview/1000x170/)

With 26,698 parameters, this `CNN` have similar size to the `MLP` (25,450) yet significantly more powerful.

```
CNN (26698 parameters)
Test Accuracy: 98.22% | Loss: 0.05 | Learning time: 14.3s
```

### Key Observations

- **Accuracy boost**: The model jumps to **98.22%** accuracy, improving both over the `MLP` and `TinyCNN`.

- **Parameter efficiency**: Despite a similar parameter count to the MLP, this CNN leverages spatial patterns through convolution to achieve better performance.

- **Inference-ready**: The size and speed of this model make it suitable for lightweight applications and real-time digit recognition.

This model demonstrates a sweet spot: good depth, reasonable parameter size, and excellent accuracy. But what if we didn’t care about size at all and wanted to push performance even further?

Let’s find out in the next section.

## Model 4: StrongCNN — A Deep Convolutional Powerhouse

So far, we've looked at models that balance performance and simplicity. But what if we remove the constraints and go all-in on performance?

![](https://ucarecdn.com/416f3481-45ee-477e-b8bb-61f37902a46c/)

The `StrongCNN` is a deeper, more expressive architecture that brings in multiple convolutional layers, higher channel counts, and regularization techniques like `Dropout` to prevent overfitting. It’s inspired by best practices from larger vision models but still compact enough to train quickly on `MNIST`.

```python
class StrongCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),   # 1x28x28 → 32x28x28
            nn.ReLU(),
            nn.Conv2d(32, 32, 3, padding=1),  # 32x28x28
            nn.ReLU(),
            nn.MaxPool2d(2),                  # 32x14x14
            nn.Dropout(0.25),

            nn.Conv2d(32, 64, 3, padding=1),  # 64x14x14
            nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1),  # 64x14x14
            nn.ReLU(),
            nn.MaxPool2d(2),                  # 64x7x7
            nn.Dropout(0.25),

            nn.Flatten(),
            nn.Linear(64 * 7 * 7, 128),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(128, 10)
        )

    def forward(self, x):
        return self.net(x)
```

### Architecture Breakdown

This model stacks four convolutional layers in two blocks, with increasing filter counts (32 → 64). After each block:

- We apply MaxPool2d(2) to downsample.
- We apply Dropout to reduce overfitting.
- Finally, features are flattened and passed through two fully connected layers with a 128-neuron hidden layer and another dropout.

```
======================================================================
Layer (type:depth-idx)                   Output Shape          Param #
======================================================================
StrongCNN                                [64, 10]                  --
├─Sequential: 1-1                        [64, 10]                  --
│    └─Conv2d: 2-1                       [64, 32, 28, 28]          320
│    └─ReLU: 2-2                         [64, 32, 28, 28]          --
│    └─Conv2d: 2-3                       [64, 32, 28, 28]        9,248
│    └─ReLU: 2-4                         [64, 32, 28, 28]          --
│    └─MaxPool2d: 2-5                    [64, 32, 14, 14]          --
│    └─Dropout: 2-6                      [64, 32, 14, 14]          --
│    └─Conv2d: 2-7                       [64, 64, 14, 14]       18,496
│    └─ReLU: 2-8                         [64, 64, 14, 14]          --
│    └─Conv2d: 2-9                       [64, 64, 14, 14]       36,928
│    └─ReLU: 2-10                        [64, 64, 14, 14]          --
│    └─MaxPool2d: 2-11                   [64, 64, 7, 7]            --
│    └─Dropout: 2-12                     [64, 64, 7, 7]            --
│    └─Flatten: 2-13                     [64, 3136]                --
│    └─Linear: 2-14                      [64, 128]             401,536
│    └─ReLU: 2-15                        [64, 128]                 --
│    └─Dropout: 2-16                     [64, 128]                 --
│    └─Linear: 2-17                      [64, 10]                1,290
======================================================================
Total params: 467,818
Trainable params: 467,818
Non-trainable params: 0
Total mult-adds (Units.GIGABYTES): 1.20
======================================================================
Input size (MB): 0.20
Forward/backward pass size (MB): 38.61
Params size (MB): 1.87
Estimated Total Size (MB): 40.68
======================================================================
```

![](https://ucarecdn.com/a825a6e9-69d4-435c-8213-eb27f8e1320c/-/preview/1000x251/)

With nearly **half a million parameters**, this model dwarfs the others in capacity. But it pays off.

```
Strong CNN (467818 parameters)
Test Accuracy: 99.09% | Loss: 0.03 | Learning time: 75.0s
```

### Key Observations

- **Top-tier accuracy**: The StrongCNN approaches 99.09% test accuracy, getting very close to human-level performance on MNIST.

- **Regularization matters**: With this many parameters, dropout is crucial to avoid overfitting.

- **Cost of performance**: Training time is almost 3× that of the MLP and 6× more parameters than the balanced CNN.

This model is overkill for MNIST—but that’s the point. It illustrates how far you can go when accuracy is the only goal.

## Recap: Comparing All Four Models

Let’s wrap up with a side-by-side summary:

| Model         | Parameters | Test Accuracy | Loss | Training Time |
| ------------- | ---------- |---------------|------|---------------|
| **MLP**       | 25,450     | 95.96%        | 0.14 | 8.7s          |
| **TinyCNN**   | 4,266      | 97.96%        | 0.06 | 12.3s         |
| **CNN**       | 26,698     | 98.22%        | 0.05 | 14.3s         |
| **StrongCNN** | 467,818    | 99.09%        | 0.03 | 75.0s         |


### Conclusion

This experiment demonstrates how architecture choices affect performance in neural networks. Even for a simple dataset like MNIST:

- **MLPs** work but ignore image structure.
- **CNNs** leverage spatial features for better results.
- **Depth and width** improve accuracy but increase training cost and overfitting risk.
- **Regularization** is essential for deeper networks.

Convolutional models outperform MLPs not because they’re “deeper” or “fancier,” but because they **understand how images work**.

These results mirror broader trends seen in [state-of-the-art](https://paperswithcode.com/sota/image-classification-on-mnist) research:

- **Convolutional models** remain the backbone of MNIST classification, offering strong inductive biases for image structure.

- Techniques like **dropout, data augmentation**, and **deep architectures** are key to improving performance.

- More advanced models, such as **capsule networks, transformer hybrids**, and **ensembles**, have pushed accuracy beyond **99.85%**, although these methods are often overkill for MNIST and require far more compute.

Our experiments reaffirm that CNNs are not only more accurate than MLPs—they are also more efficient and better suited to image-based tasks. While SOTA models continue to push the boundary, our practical models already achieve high accuracy with a fraction of the complexity.

https://github.com/gustawdaniel/cnn-mnist