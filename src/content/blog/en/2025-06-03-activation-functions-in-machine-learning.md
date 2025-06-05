---
author: Daniel Gustaw
canonicalName: activation-functions-in-machine-learning
coverImage: https://ucarecdn.com/43dafac9-01f5-4ff2-a101-20d0a8670bd5/-/preview/1000x1000/
description: We study various activation functions, their characteristics, and their impact on the performance of machine learning models.
excerpt: We study various activation functions, their characteristics, and their impact on the performance of machine learning models.
publishDate: 2025-06-04 00:00:00+00:00
slug: en/activation-functions-in-machine-learning
tags:
- machine-learning
- python
- numpy
title: Activation Functions in Machine Learning
updateDate: 2025-06-04 00:00:00+00:00
---

Activation functions are at the heart of every neural network, determining how signals propagate and interact through layers. In this post, we’ll explore and compare several popular activation functions using a minimal neural network on a toy dataset.

We’ll focus on how quickly each function helps the network converge—and how well it performs in a binary classification task with a nonlinear decision boundary.

## Problem Setup

We simulate a simple 2D classification task:

- We generate `1000` random `2D` points from a Gaussian distribution.
- We label each point as `1` if it lies inside the unit circle, and `0` otherwise.

This creates a nonlinearly separable dataset, perfect for testing activation functions.

```python
import torch
import numpy as np

N = 1000
x = torch.randn(N, 2) * (1 / np.sqrt(2 * np.log(2)))
y = ((x[:, 0]**2 + x[:, 1]**2) < 1).float().unsqueeze(1)
```

The coefficient $1 / \sqrt{2 \log 2}$ ensures that half of the points lie inside the unit circle and half outside:

$$
\lim_{N \to \infty} \frac{1}{N} \sum_{i=1}^{N} \mathbb{1}_{\{x_{i0}^2 + x_{i1}^2 < 1\}} = \mathbb{P}(x_0^2 + x_1^2 < 1) = \frac{1}{2}
$$

We want to compute the probability:

$$
\mathbb{P}(x_0^2 + x_1^2 < 1) \quad x \sim \mathcal{N}(0, c^2)
$$


This is equivalent to computing:

$$
\int \int_{x^2 + y^2 \leq 1} \frac{1}{2\pi c^2} e^{-\frac{x^2 + y^2}{2c^2}} \, dx \, dy
$$

Switching to polar coordinates:

$$
\int_{0}^{2\pi} \int_{0}^{1} \frac{1}{2\pi c^2} e^{-\frac{r^2}{2c^2}} \cdot r \, dr \, d\theta
$$

Separate the integrals:

$$
\int_{0}^{2\pi} \frac{1}{2\pi} \, d\theta = 1
$$

The remaining part:

$$
\int_{0}^{1} \frac{1}{c^2} r e^{-\frac{r^2}{2c^2}} \, dr
$$

Let’s compute this integral using substitution $u=\frac{r^2}{2 c^2}, \quad du=\frac{r}{c^2} dr$, so:

$$
\int_{u = 0}^{\frac{1}{2c^2}} e^{-u} \, du = 1 - e^{-1/(2c^2)}
$$

So the final result is:

$$
\mathbb{P}(x_0^2 + x_1^2 < 1) = 1 - e^{-1/(2c^2)}
$$

Now, solve for $c$ such that this probability equals $\frac{1}{2}$:

$$
1 - e^{-1/(2c^2)} = \frac{1}{2}
\quad \Rightarrow \quad
e^{-1/(2c^2)} = \frac{1}{2}
\quad \Rightarrow \quad \newline
\frac{1}{2c^2} = \log 2
\quad \Rightarrow \quad
c = \frac{1}{\sqrt{2 \log 2}}
$$

## Model Architecture

We use a small feedforward neural network with the following structure:

- Input layer: 2 neurons (for 2D data)

- Hidden layers: [16, 8] neurons

- Output: 1 neuron for binary classification (with `BCEWithLogitsLoss`)

Each hidden layer is followed by an activation function that we want to test.

```python
import torch.nn as nn

def build_model(activation, layers=[2, 16, 8, 1]):
    layers_out = []
    for i in range(len(layers) - 2):
        layers_out += [nn.Linear(layers[i], layers[i+1]), activation()]
    layers_out += [nn.Linear(layers[-2], layers[-1])]
    return nn.Sequential(*layers_out)
```

## Training and measurement

To train the model we need to select loss function, optimizer and number of steps. We can wrap it in function that return series of learning time and loss that will be useful to visualize performance of actiation functions.

We can select training properties:
- **Loss function**: `BCEWithLogitsLoss` (numerically stable for binary classification)
- **Optimizer**: Adam with learning rate `0.01`
- **Epochs**: 2000 steps
- We record **loss** vs. **time** to see which activations converge fastest.

```python
import torch.optim as optim
import time

# Training loop with timing
def train_timed(model, name, lr=0.01, steps=2000):
    loss_fn = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    losses = []
    times = []

    start_time = time.time()
    for step in range(steps):
        pred = model(x)
        loss = loss_fn(pred, y)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        elapsed = time.time() - start_time
        losses.append(loss.item())
        times.append(elapsed)

    return times, losses
```

We decided to use `Adam` optimizer that is often chosen because it combines the strengths of two popular optimizers: `AdaGrad` and `RMSProp` and works well out-of-the-box for many problems.

To train model we can call `train_timed` function with our model and some parameters.

```python
model = build_model(nn.ReLU)
t, l = train_timed(model, 'ReLU')
```

Our goal is to compare different activation functions, but now, lets see how model predict shape using training points.

## Model prediction visualization

Let's plot model prediction using code

```python
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle
import torch

# 1. Generate grid
xs = np.arange(-2, 2.1, 0.2)
ys = np.arange(-2, 2.1, 0.2)
xx, yy = np.meshgrid(xs, ys)
Xmesh = np.c_[xx.ravel(), yy.ravel()]
inputs = torch.tensor(Xmesh).float()

# 2. Predict
with torch.no_grad():
    scores = torch.sigmoid(model(inputs)).squeeze().numpy()

Z = (scores > 0.5).reshape(xx.shape)

# 3. Plot
plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(8, 8))

# Green-black binary decision surface
ax.contourf(xx, yy, Z, levels=1, colors=["black", "#00FF00"], alpha=0.25)

# Data points: class 1 = bright green, class 0 = dim green
colors = ['#BB3300', '#00FF00']
point_colors = [colors[int(label)] for label in y.squeeze().tolist()]
ax.scatter(x[:, 0], x[:, 1], c=point_colors, s=20, edgecolors='none')

# Circle border
circle = Circle((0, 0), 1, color="#00FF00", fill=False, linewidth=1.5)
ax.add_patch(circle)

# Cleanup for hacker aesthetic
ax.set_xlim(xx.min(), xx.max())
ax.set_ylim(yy.min(), yy.max())
ax.set_xticks([])
ax.set_yticks([])
ax.set_facecolor('black')
ax.spines['top'].set_visible(False)
ax.spines['bottom'].set_visible(False)
ax.spines['left'].set_visible(False)
ax.spines['right'].set_visible(False)

plt.tight_layout()
plt.show()
```

![](https://ucarecdn.com/bdb93744-8788-47e9-849a-60f7cf9c5876/)

## Let's compare activation functions

We compare the following activation functions:

| Name        | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| `ReLU`      | Fast and effective, but can “die” on negative inputs (zero gradient).          |
| `Tanh`      | Smooth, zero-centered, but saturates for large values (vanishing gradients).   |
| `LeakyReLU` | ReLU variant allowing a small gradient when inputs are negative.               |
| `Sigmoid`   | Outputs between 0 and 1; suffers from vanishing gradients.                     |
| `ELU`       | Like ReLU but smoother and can output negatives, improving learning.           |
| `SiLU`      | Also known as Swish; smooth and non-monotonic; promotes better generalization. |
| `GELU`      | Gaussian-based; smooth and probabilistic, popular in Transformers.             |
| `Softplus`  | Smooth approximation of ReLU; always differentiable but more expensive.        |

We can compare these graphs by code that will create grid of activation functions.

```python
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
import numpy as np

# Define input range
x = torch.linspace(-3, 3, 1000)

# Activation functions with display names
activations = [
    ("ReLU", nn.ReLU()),
    ("Tanh", nn.Tanh()),
    ("LeakyReLU", nn.LeakyReLU()),
    ("Sigmoid", nn.Sigmoid()),
    ("ELU", nn.ELU()),
    ("SiLU", nn.SiLU()),
    ("GELU", nn.GELU()),
    ("Softplus", nn.Softplus())
]

x_ticks = np.arange(-2, 3, 1)
y_ticks = np.arange(-2, 3, 1)

# Create subplot grid
fig, axes = plt.subplots(2, 4, figsize=(14, 6), sharex=True, sharey=True)
axes = axes.flatten()

for ax, (name, fn) in zip(axes, activations):
    y = fn(x)
    ax.plot(x.numpy(), y.detach().numpy(), label=name, color="tab:blue")
    ax.axhline(0, color='gray', lw=0.5)
    ax.axvline(0, color='gray', lw=0.5)
    ax.set_title(name)
    ax.grid(True, linestyle='--', linewidth=0.5)
    ax.legend(frameon=False, loc="lower right", fontsize='small')
    ax.tick_params(axis='both', which='both', labelsize=8)  # Ensure ticks show
    ax.set_xticks(x_ticks)
    ax.set_yticks(y_ticks)
    ax.ticklabel_format(style='sci', scilimits=(-2, 2), axis='both')


# Add main title and layout
fig.suptitle("Activation Functions", fontsize=16)
fig.tight_layout(rect=[0, 0, 1, 0.95])

# Save as vector image
plt.savefig("activations_grid.svg", format="svg", dpi=300)
plt.show()
```

![](https://ucarecdn.com/7f95f3cb-21a2-4e5e-ac6f-b49f8244c37c/)

## Single training is not enough

Naive approach is to just train every model with given activation function and compare results:

```python
import matplotlib.pyplot as plt

# Configs to compare
configs = [
    ("ReLU", nn.ReLU),             # Rectified Linear Unit: fast and simple, but can "die" (zero gradient for x < 0)
    ("Tanh", nn.Tanh),             # Hyperbolic tangent: zero-centered, but saturates at extremes
    ("LeakyReLU", nn.LeakyReLU),   # Variant of ReLU: allows small gradient when x < 0 to prevent dead neurons
    ("Sigmoid", nn.Sigmoid),       # Maps input to (0, 1): good for probabilities, but suffers from vanishing gradients
    ("ELU", nn.ELU),               # Exponential Linear Unit: smooth ReLU alternative, can produce negative outputs
    ("SiLU", nn.SiLU),             # Sigmoid-weighted Linear Unit (Swish): smooth and non-monotonic, helps generalization
    ("GELU", nn.GELU),             # Gaussian Error Linear Unit: used in Transformers, smooth and noise-tolerant
    ("Softplus", nn.Softplus)      # Smooth approximation of ReLU: always positive gradient, but computationally heavier
]

# Train and collect
results = []
for name, act_fn in configs:
    print(f"Training {name}...")
    model = build_model(act_fn)
    t, l = train_timed(model, name)
    results.append((name, t, l))

# Plotting
plt.figure(figsize=(10, 6))
plt.yscale('log')
for name, times, losses in results:
    plt.plot(times, losses, label=name)

plt.xlabel("Time (s)")
plt.ylabel("Loss")
plt.title("Convergence over Time")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig("activation_8_2000_5.svg", format="svg", dpi=300)
plt.show()
```

Although we can see huge advantage of `LeakyReLU` in first run:

![](https://ucarecdn.com/2324479e-dfae-4119-81aa-cd3cc953c06e/)

Calling the same code second time we can see that results are different:

![](https://ucarecdn.com/34e55503-493b-42c6-8169-8014dd862d96/)

Especially that `GELU` performance is much better. It means that to really compare these functions we need run these simulations many times, but before it, I would like to show you what can happen when we will train little longer time.

![](https://ucarecdn.com/e598dd94-5c94-4f90-8fe8-771e44eb7d0d/)

There you can see that initially slower `Tanh` was more stable in long time run, but `LeakyReLU` failed completely. I present these graphs, but you have to be aware that these are just single learning results and to construct any valuable conclusions we have to run them many times.

But we see that single run give us dynamics of learning that can't be cut in any single arbitral selected point, because of position on ranking can change in dependence from training duration.

So due this reason we will save to database all measured losses in objects like this:

```json
{
  "name": "ReLU",
  "time": 1.54,
  "loss": 0.02,
  "epoch": 2000
}
```

So in next paragraph we will add saving results to database and run simulations many times.

## Running multiple simulations

Let's add `steps` array to output of `train_timed` function.

```python
def train_timed(model, name, lr=0.01, steps=2000):
    loss_fn = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    losses = []
    times = []
    _steps = []

    start_time = time.time()
    for step in range(steps):
        pred = model(x)
        loss = loss_fn(pred, y)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        elapsed = time.time() - start_time
        losses.append(loss.item())
        times.append(elapsed)
        _steps.append(step)

    return times, losses, _steps
```

Then we can build wrapper that saves results to MongoDB database and allow for multiple runs:

```python
def train_n_times(n=1, lr=0.01, steps=2000):
    client = MongoClient("mongodb://localhost:27017/")
    db = client["experiment_db"]
    collection = db["activations"]

    for name, act_fn in configs:
        times, losses, epochs = [], [], []

        for _ in range(n):
            model = build_model(act_fn)
            time_taken_list, loss_list, epoch_list = train_timed(model, name, lr, steps)
            times.extend(time_taken_list)
            losses.extend(loss_list)
            epochs.extend(epoch_list)

        documents = [
            {"name": name, "time": t, "loss": l, "epoch": e}
            for t, l, e in zip(times, losses, epochs)
        ]

        collection.insert_many(documents)

    client.close()
    return 0
```

and finally call `train_n_times` function to run the training for all activation functions multiple times.

```python
train_n_times(1000, 0.01, 2000)
```

## Analysis of results (by epoch)

Now lets extract results form `mongo` database and plot them.

To simplify we can use epochs as x-axis instead of time. First part of code gets data and organize them in `DataFrame` for each activation function.

```python
from pymongo import MongoClient
import pandas as pd

# Define activation functions
activation_names = [
    "ReLU", "Tanh", "LeakyReLU", "Sigmoid",
    "ELU", "SiLU", "GELU", "Softplus"
]

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["experiment_db"]
collection = db["activations"]

# Dictionary to store DataFrames per activation
summaries = {}

for name in activation_names:
    cursor = collection.find(
        {"name": name},
        {"_id": 0, "epoch": 1, "loss": 1}
    )
    df = pd.DataFrame(list(cursor))

    if df.empty:
        continue

    summary = df.groupby("epoch")["loss"].agg(["mean", "std", "count"]).reset_index()
    summaries[name] = summary
```

Second part is responsible for plotting.

```python
import matplotlib.pyplot as plt
import numpy as np

# Setup plot
plt.figure(figsize=(12, 8))
plt.yscale('log')

for name, summary in summaries.items():
    x = summary["epoch"].to_numpy()
    means = summary["mean"].to_numpy()
    count = summary["count"].to_numpy()
    errors = summary["std"].to_numpy() / np.sqrt(count)

    lower = np.clip(means - errors, a_min=1e-10, a_max=None)
    upper = means + errors

    plt.plot(x, means, label=name)
    plt.fill_between(x, lower, upper, alpha=0.2)

plt.xlabel("Epoch")
plt.ylabel("Loss (log scale)")
plt.title("Learning Curves by Activation Function")
plt.legend()
plt.grid(True, which="both", ls="--", linewidth=0.5)
plt.tight_layout()
plt.savefig("activation_1000_calls.svg", format="svg", dpi=300)
plt.show()
```

![](https://ucarecdn.com/e7cc2e75-6190-4f9c-812c-0453ab06c249/)

We can check loss for last epoch for each activation function:

```python
results = []
for name, summary in summaries.items():
    mean = summary["mean"].to_numpy()[-1]
    stderr = summary["std"].to_numpy()[-1] / np.sqrt(summary["count"].to_numpy()[-1])
    results.append((name, mean, stderr))

# Sort by mean
results.sort(key=lambda x: x[1])  # x[1] is the mean

# Print sorted results
for name, mean, stderr in results:
    print("%-9s : %6.6f ± %6.6f" % (name, mean, stderr))
```

Results:

```json
LeakyReLU : 0.000170 ± 0.000007
GELU      : 0.000220 ± 0.000003
ELU       : 0.000229 ± 0.000002
SiLU      : 0.000303 ± 0.000003
Tanh      : 0.000396 ± 0.000003
ReLU      : 0.000433 ± 0.000021
Softplus  : 0.001038 ± 0.000099
Sigmoid   : 0.002588 ± 0.000569
```

## Analysis by time

To plot learning curves by time we need to convert float time measurements to bins with fixed size.

```python
from pymongo import MongoClient
import pandas as pd

# Define activation functions
activation_names = [
    "ReLU", "Tanh", "LeakyReLU", "Sigmoid",
    "ELU", "SiLU", "GELU", "Softplus"
]

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["experiment_db"]
collection = db["activations"]

# Dictionary to store DataFrames per activation
summaries = {}

for name in activation_names:
    cursor = collection.find(
        {"name": name},
        {"_id": 0, "time": 1, "loss": 1}
    )
    df = pd.DataFrame(list(cursor))

    if df.empty:
        continue
    
    bin_size = 0.01  # 10ms resolution
    df["time_bin"] = (df["time"] // bin_size) * bin_size
    df["time_bin"] = df["time_bin"].round(3) 

    summary = df.groupby("time_bin")["loss"].agg(["mean", "std", "count"]).reset_index()
    summary.rename(columns={"time_bin": "time"}, inplace=True)
    
    summaries[name] = summary
```

Thanks to this technique we can plot learning curves by time.

```python
import matplotlib.pyplot as plt
import numpy as np

# Setup plot
plt.figure(figsize=(12, 8))
plt.yscale('log')

for name, summary in summaries.items():
    x = summary["time"].to_numpy()
    means = summary["mean"].to_numpy()
    count = summary["count"].to_numpy()
    errors = 20 * summary["std"].to_numpy() / np.sqrt(count)

    lower = np.clip(means - errors, a_min=1e-10, a_max=None)
    upper = means + errors

    plt.plot(x, means, label=name)
    plt.fill_between(x, lower, upper, alpha=0.2)

plt.xlabel("Second")
plt.ylabel("Loss (log scale)")
plt.title("Learning Curves by Activation Function")
plt.legend()
plt.grid(True, which="both", ls="--", linewidth=0.5)

plt.xlim(left=0, right=0.7)
plt.ylim(1e-4, 1)

plt.tight_layout()
plt.savefig("activation_1000_calls_sec.svg", format="svg", dpi=300)
plt.show()
```

![](https://ucarecdn.com/2eec12f2-c40d-4f8b-a0f7-dffcb575454e/)

## Conclusions

It is worth to compare our results with paper that contain much more benchmarks summary [**Activation Functions in Deep Learning: A Comprehensive Survey and Benchmark**](https://arxiv.org/pdf/2109.14545).

Although in my benchmark `LeakyReLU` is the best, in paper they found that it depends on use case, dataset and network complexity. I will sum up this paper conclusions and compare them with our results.

### 1. There’s No Universal Winner

   No single activation function dominates across all datasets and models.

   Some functions (like Swish and Mish) perform consistently well, but aren't always the best in every scenario.

> Choose AFs based on your model and dataset — not blindly.

### 2. ReLU Is Still Strong

   Despite being old and simple, ReLU remains competitive across many tasks.

   It performs especially well in deeper networks (like CNNs) and large datasets.

> Start with ReLU. It's a strong default.

### 3. Swish, Mish, and GELU Stand Out

   These are smooth, nonlinear, and adaptive functions.

   They outperform ReLU on certain tasks — especially on more complex datasets or deeper networks.

   - Swish: $x⋅\sigma(x)$

   - Mish: $x⋅\tanh(\ln(1+ex))$

   - GELU: Gaussian Error Linear Unit

> Try these when training accuracy stalls or gradients vanish.

### 4. Leaky/Parametric ReLU Help for Sparse Gradients

   Variants like Leaky ReLU and PReLU solve ReLU’s “dying neuron” problem.

   Especially useful in smaller datasets where neurons can go inactive.

> Use these when parts of your network go silent.

### 5. Sigmoid/Tanh Perform Poorly in Deep Networks

   They cause vanishing gradients and saturate easily.

   In deep models, they tend to slow down training and hurt performance.

> Avoid sigmoid/tanh unless you're in shallow or legacy models (e.g. old RNNs).

### 6. Computational Cost Matters

   Fancy activations like Mish and GELU are heavier to compute than ReLU.

   On mobile or edge devices, ReLU may be preferable for speed and efficiency.

> Balance performance and compute cost based on your deployment target.

---

So in our situation we actually can confirm bad results of `tanh` and `sigmoid`. Winners:
- LeakyReLU
- GELU
- ELU
- SiLU

are just modification of `ReLU` that are recommended as remedy for "dying neurons" problem or for small datasets.

It seems that be our case because `1000` points can be considered as small, so smoother versions of `ReLU` are actually better in this case what confirm results from analysed publication.

Good practice seems to be starting with `ReLU` and trying other functions later if we have enough time for training and experiments.