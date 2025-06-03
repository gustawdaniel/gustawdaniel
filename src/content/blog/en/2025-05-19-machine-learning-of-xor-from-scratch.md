---
author: Daniel Gustaw
canonicalName: machine-learning-of-xor-from-scratch
coverImage: https://ucarecdn.com/19bf54c3-7109-4836-9dce-dbbfca11d7ed/-/preview/640x640/
description: Introduction to machine learning using the XOR problem as an example. In this article, we present how to create a model from scratch using Python and NumPy.
excerpt: Introduction to machine learning using the XOR problem as an example. In this article, we present how to create a model from scratch using Python and NumPy.
publishDate: 2025-05-19 00:00:00+00:00
slug: en/machine-learning-of-xor-from-scratch
tags:
- machine-learning
- python
- numpy
title: Machine Learning XOR from Scratch
updateDate: 2025-05-19 00:00:00+00:00
---

In this article, you will read about how to build an AI model from scratch.

## XOR as a linear combination of linear classifiers

An example of machine learning is the XOR problem.

**XOR** (exclusive OR) is a logical function that returns true (1) if exactly one of its arguments is true. Otherwise, it returns false (0). The XOR problem is a classic example of a problem that cannot be solved by linear classification models, such as logistic regression. Therefore, it is often used as an example for learning about neural networks.

It can be shown in a truth table:

| x | y | xor(x, y) |
|---|---|-----------|
| 0 | 0 | 0         |
| 0 | 1 | 1         |
| 1 | 0 | 1         |
| 1 | 1 | 0         |

or in a graph:

![](https://ucarecdn.com/572a9d0c-4d85-4891-8d2a-c12c5467c0ba/)

This second representation shows that XOR can be built from 2 linear classifiers.

![](https://ucarecdn.com/0037d1c8-79ad-412b-a557-d8992dd2f656/xor_linear_bernoulli_planes.svg)

Such a classifier can be interpreted as a transformation that takes the argument space (in our case, the square `[0,1] x [0,1]`), then transforms it affinely (rotates, scales, shifts, reflects, shears), and finally creates a decision boundary between classes `{0, 1}`. This means that for the `XOR` gate, 2 such classifiers are needed, because we have 2 black decision boundaries in the graph.

## An artificial neuron is one linear classifier

An affine operation can be expressed as:

$$
z = a x1 + b x2 + c, \quad z \in \mathbb{R}, \quad x1,x2 \in [0,1].
$$

where `a` and `b` are called weights and `c` is the bias. These are coefficients that can be determined in the learning process. A more convenient notation is vector form where:

$$
z = w^T x + b, \quad w = [a, b]^T, \quad x = [x1, x2]^T.
$$

However, since the syntax of linear operations yields a linear operation, to introduce non-linearity, an activation function is added to the neurons. The activation function is a function that transforms the neuron's input into the neuron's output. It can be any non-linear function, but we usually look for one that:

- is easy to compute
- has a simple derivative
- fits the shape of the arguments

In our case:

$$
z \in \mathbb{R}, \quad f(z) \in [0,1].
$$

we can use the activation function `sigmoid`:

$$
\sigma(z) = \frac{1}{1 + e^{-z}}, \quad z \in \mathbb{R}, \quad \text{Im}(\sigma) = (0, 1)
$$

which has the derivative:

$$
\sigma'(z) = \sigma(z) (1 - \sigma(z)), \quad z \in \mathbb{R}.
$$

because

$$
\frac{d}{dz} \left( \frac{1}{1 + e^{-z}} \right)

= -\frac{1}{(1 + e^{-z})^2} \cdot (-e^{-z})

= \left( \frac{1}{1 + e^{-z}} \right) \cdot \left( \frac{e^{-z} + 1 - 1}{1 + e^{-z}} \right)
$$

however, this is not the only option. Other activation functions such as `tanh`, `ReLU`, `Leaky ReLU`, or `ELU` can be used. The choice of activation function depends on the specific problem and the architecture of the neural network.

We will appreciate the choice of the `sigmoid` function when we see how it simplifies the formulas for the derivative of the loss function concerning the network parameters.

## Loss function of the neural network

The loss is a measure of our dissatisfaction with the model's performance. Just like the activation function, it can be defined with great flexibility, but we want it to:

- measure how model errors
- be easy to compute
- have an easy-to-compute derivative with respect to the parameters

The arguments of the loss function are the model's output $\hat{y}$ and the training data's output $y$. Although these are two values in the range `[0,1]`, they should not be confused with the pair of input values `x1` and `x2`. To emphasize this difference, the graphs below are colored differently.

Before introducing the loss function, let’s take a look at an example of a compatibility function.

$$
P(y | \hat{y}) = \hat{y}^y (1 - \hat{y})^{1 - y}, \quad y \in \{0,1\}.
$$

This is a Bernoulli distribution: a function with a bell-shaped curve peaking at the line $y = \hat{y}$.

![](https://ucarecdn.com/80858d14-9c6b-4a86-865e-b8f0f414ab72/)

We can call it a measure of compatibility because it takes maximum values when our model predicts values $\hat{y}$ as close to $y$ as possible.

The loss function, on the other hand, should have minima where the compatibility function has maxima. We can achieve this by inverting: $1/P$, changing the sign $-P$, or applying some other transformation that converts the maxima of compatibility into minima of loss.

Again, despite the great flexibility, we will choose the loss function as the negative logarithm of the compatibility function. This specific choice can be justified by the fact that the derivative of such defined loss will be very easy to calculate.

$$
\mathcal{L}_{\text{BCE}}(y, \hat{y}) = -\log(P(y | \hat{y}) )= -\left[ y \cdot \log(\hat{y}) + (1 - y) \cdot \log(1 - \hat{y}) \right]
$$

This formula presents `binary cross-entropy` as the loss function. Let’s see how such a loss function depends on the model parameters.

$$
\begin{aligned}
\text{Let} \quad \hat{y} &= \sigma(z) = \frac{1}{1 + e^{-z}} \\[10pt]

\mathcal{L}_{\mathrm{BCE}}(y, \hat{y}) &= -\left[ y \log(\hat{y}) + (1 - y) \log(1 - \hat{y}) \right] \\[10pt]

\frac{\partial \mathcal{L}_{\mathrm{BCE}}}{\partial \hat{y}} &= -\left( \frac{y}{\hat{y}} - \frac{1 - y}{1 - \hat{y}}
\right) \\[10pt]

\frac{d\hat{y}}{dz} &= \sigma'(z) = \hat{y}(1 - \hat{y}) \\[10pt]

\frac{d\mathcal{L}_{\mathrm{BCE}}}{dz} &= \frac{\partial \mathcal{L}_{\mathrm{BCE}}}{\partial \hat{y}} \cdot
\frac{d\hat{y}}{dz} \\[10pt]
&= -\left( \frac{y}{\hat{y}} - \frac{1 - y}{1 - \hat{y}} \right) \cdot \hat{y}(1 - \hat{y}) \\[10pt]
&= \hat{y} - y
\end{aligned}
$$

We see that the gradient of the loss is really easy to compute, and this allows us to move to the practical implementation of the network in code.

## Implementing XOR learning in Python

Though specialized libraries such as `pytorch` or `tensorflow` are usually used for this, we will focus on showing how to do this without them, to better understand the individual steps. We will start by defining the functions we discussed in the theoretical part:

```python
import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def sigmoid_derivative(output):
    return output * (1 - output)

def binary_cross_entropy(y_true, y_pred):
    epsilon = 1e-15
    y_pred = np.clip(y_pred, epsilon, 1 - epsilon)
    return -(y_true * np.log(y_pred) + (1 - y_true) * np.log(1 - y_pred))

def binary_cross_entropy_derivative(y_true, y_pred):
    return y_pred - y_true
```

Next, we provide the training data, that is, we transcribe the truth table defining the `XOR` function that we want to teach the model.

```python
# XOR data
inputs = np.array([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
])
expected_output = np.array([[0], [1], [1], [0]])
```

We established that the model will require two neurons in the hidden layer (two black lines on the second chart) and one at the end to give one output.

![](https://ucarecdn.com/d9ea38bb-f8fd-4f9e-99fc-f3ff1941228e/)

So we have the following parameters:

```python
input_layer_neurons = 2
hidden_layer_neurons = 2
output_neurons = 1
learning_rate = 0.1
epochs = 10000
```

The number of training repetitions and its speed were chosen arbitrarily, but these are important parameters that are optimized depending on the case we are modeling.

Now we will determine the initial values of the weights. Let's assume that they will be values with a normal distribution with a deviation of 1, but we will return to this point, as this is something that can be done better.

```python
hidden_weights = np.random.randn(input_layer_neurons, hidden_layer_neurons)
hidden_bias = np.random.randn(1, hidden_layer_neurons)
output_weights = np.random.randn(hidden_layer_neurons, output_neurons)
output_bias = np.random.randn(1, output_neurons)
```

Having all the necessary parameters, we can begin the training.

```python
for epoch in range(epochs):
```

In the learning loop, we sequentially calculate the activation values and outputs of the subsequent layers. This part is called "Forward" and is used to determine what predictions the model generates.

The second part: "Backpropagation" is an algorithm that allows for changing the parameters in the layers from the last to the first in order to reduce the loss in subsequent steps.

We will discuss them line by line. The first step is to transform the inputs `x1` and `x2`, referred to in code as `inputs`, into the activation of the neuron `z` or `hidden_input`, and then into its output, that is applying the function `sigma` on it.

$$
h_i = w_h^T x + b_h \quad h_o = \sigma(h_i)
$$

```python
    # Forward
    hidden_input = np.dot(inputs, hidden_weights) + hidden_bias
    hidden_output = sigmoid(hidden_input)
```

Next, we compose this operation at the next layer:

$$
f_i = w_o^T h_o + b_o \quad \hat{y} = \sigma(f_i)
$$

```python
    final_input = np.dot(hidden_output, output_weights) + output_bias
    predicted_output = sigmoid(final_input)
```

Next, we calculate the divergence between the prediction and the actual value. In this case, it is `binary cross entropy`. We also write down its derivative with respect to the activation of the neuron in the last layer.

$$
\mathtt{loss} = \mathcal{L}_{\mathrm{BCE}}(y, \hat{y}) \quad \mathtt{d\_predicted\_output} = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i}
$$

```python
    loss = binary_cross_entropy(expected_output, predicted_output)
    d_predicted_output = binary_cross_entropy_derivative(expected_output, predicted_output)
```

Now we can go back from the last layer to the first layer, updating the network parameters.

In the last layer, we already have the derivative with respect to the activation, so the changes in parameters are as follows:

$$
\Delta w_o = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot \frac{df_i}{dw_o} = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot h_o \quad \Delta b_o = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i}
$$

We just need to ensure dimension compatibility during multiplication.

| variable           | shape  |
|--------------------|--------|
| hidden_output      | (4, 2) |
| d_predicted_output | (4, 1) |
| output_weights     | (2, 1) |
| output_bias        | (1, 1) |

The value `4` is the number of samples from the training set, whereas `2` is the number of inputs to the last layer. We want to eliminate dimension `4`, so we perform the following multiplications and transpositions:

```python
    # Backprop
    output_weights -= hidden_output.T.dot(d_predicted_output) * learning_rate
    output_bias -= np.sum(d_predicted_output, axis=0, keepdims=True) * learning_rate
```

In the next step, we go through the hidden layer.

$$
\Delta w_h = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot \frac{df_i}{dh_o} \cdot \frac{dh_o}{dh_i} \cdot \frac{dh_i}{dw_h} = \\[10pt] = \mathtt{d\_predicted\_output} \cdot w_o^T \cdot \sigma'(h_o) * x  \\[20pt]

\Delta b_h = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot \frac{df_i}{dh_o} \cdot \frac{dh_o}{dh_i} \cdot \frac{dh_i}{db_h} = \\[10pt] = \mathtt{d\_predicted\_output} \cdot w_o^T \cdot \sigma'(h_o) 
$$

We write these formulas in code again ensuring compatibility of dimensions.

| variable           | shape  |
|--------------------|--------|
| hidden_output      | (4, 2) |
| d_predicted_output | (4, 1) |
| output_weights     | (2, 1) |
| output_bias        | (1, 1) |
| hidden_weights     | (2, 2) |
| hidden_bias        | (2, 1) |

```python    
    error_hidden = d_predicted_output.dot(output_weights.T)
    d_hidden = error_hidden * sigmoid_derivative(hidden_output)

    hidden_weights -= inputs.T.dot(d_hidden) * learning_rate
    hidden_bias -= np.sum(d_hidden, axis=0, keepdims=True) * learning_rate

    if epoch % 500 == 0:
        print(f"Epoch {epoch}, Loss: {np.mean(loss):.4f}")
```

After the loop, we can see the network's predictions.

```python
print("Predicted Output:")
print(predicted_output.round(3))
```

We see that it effectively predicts XOR.

```json
Epoch 0, Loss: 1.1385
Epoch 500, Loss: 0.6927
Epoch 1000, Loss: 0.6731
Epoch 1500, Loss: 0.4776
Epoch 2000, Loss: 0.0666
Epoch 2500, Loss: 0.0292
Epoch 3000, Loss: 0.0184
Epoch 3500, Loss: 0.0134
Epoch 4000, Loss: 0.0105
Epoch 4500, Loss: 0.0086
Epoch 5000, Loss: 0.0073
Epoch 5500, Loss: 0.0063
Epoch 6000, Loss: 0.0056
Epoch 6500, Loss: 0.0050
Epoch 7000, Loss: 0.0045
Epoch 7500, Loss: 0.0041
Epoch 8000, Loss: 0.0038
Epoch 8500, Loss: 0.0035
Epoch 9000, Loss: 0.0032
Epoch 9500, Loss: 0.0030
Predicted Output:
[[0.003]
 [0.997]
 [0.997]
 [0.003]]
```

Here we could end, but in reality building the first functioning model is usually just the beginning of the fun with neural networks, because now we can start looking for areas for improvements.

## Optimization of the initial weight distribution

When we randomly select initial weights, I mentioned that it can be done better. 
Although they are concentrated around zero, where the `sigma` function has 
the highest variability, its standard deviation was arbitrarily chosen as 1. 
Let's see what would happen if we changed them.

Assume that the standard deviation of the initial weights is very small. Although the `sigma` function has a maximum derivative 
right around zero, when calculating the change in weights, we need to average it over the entire training set.

Our training data has symmetry, due to which proportional factors to the gradients during the calculation of weight changes appear with opposite signs and cancel each other out. By expanding the Taylor series of the `sigma` function, we can see that only elements proportional to the weights themselves, or rather their differences, do not cancel out in the equations for weight changes.

We can therefore conclude that the evolution of weights for very small initial standard deviations will proceed like a quadratic function, which means that sufficiently small variances of weights will delay the process of starting optimal learning.

We can observe this on a graph, where the initial weights concentrated around zero practically do not change for the first 2000 learning cycles. Only then does a rapid evolution of weights occur, and after another 2000 cycles, they settle into a stable convergence towards the optimum.

![](https://ucarecdn.com/c502d3f7-0134-4208-91b9-4e30ad8fa349/)

On the other hand, too high initial weights lead to a situation where the initial variability of weights is high, but can often proceed in the wrong direction. We can see this on a graph, where weights do not converge to optimal values uniformly (especially initially).

![](https://ucarecdn.com/aaee8705-9eba-4196-9455-16b8f11f34cc/)

Let's measure how the learning rate depends on the initial standard deviation of the weights.

To do this, we introduce a weight initialization function:

```python
def init_params(hidden_std_dev = 1, output_std_dev = 1):
    hidden_weights = np.random.randn(input_layer_neurons, hidden_layer_neurons) * hidden_std_dev
    hidden_bias = np.random.randn(1, hidden_layer_neurons) * hidden_std_dev
    output_weights = np.random.randn(hidden_layer_neurons, output_neurons) * output_std_dev
    output_bias = np.random.randn(1, output_neurons) * output_std_dev
    return hidden_weights, hidden_bias, output_weights, output_bias
```

The entire learning process is encapsulated in the `train` function, which is now dependent on the initial parameter deviations.

```python
def train(hidden_std_dev = 1, output_std_dev = 1):
    hidden_weights, hidden_bias, output_weights, output_bias = init_params(hidden_std_dev, output_std_dev)
    total_loss = 0.0
    # Training loop
    for epoch in range(epochs):
        # Forward
        hidden_input = np.dot(inputs, hidden_weights) + hidden_bias
        hidden_output = sigmoid(hidden_input)
    
        final_input = np.dot(hidden_output, output_weights) + output_bias
        predicted_output = sigmoid(final_input)
    
        loss = binary_cross_entropy(expected_output, predicted_output)
        d_predicted_output = binary_cross_entropy_derivative(expected_output, predicted_output)
    
        # Backprop
        output_weights -= hidden_output.T.dot(d_predicted_output) * learning_rate
        output_bias -= np.sum(d_predicted_output, axis=0, keepdims=True) * learning_rate
    
        error_hidden = d_predicted_output.dot(output_weights.T)
        d_hidden = error_hidden * sigmoid_derivative(hidden_output)
    
        hidden_weights -= inputs.T.dot(d_hidden) * learning_rate
        hidden_bias -= np.sum(d_hidden, axis=0, keepdims=True) * learning_rate

        total_loss += np.mean(loss)

    return total_loss
```

It returns the total loss from all learning steps. This allows us to expect that if learning fails, then for a random network the sum of losses will be equal to $N * T * \mathcal{L}_{\text{BCE}}(\hat{y} \sim \mathcal{U}(0,1), y)$, where $\mathcal{L}_{BCE}$ is the `binary cross entropy` function, `T = 10,000` is the length of learning, and `N = 4` is the number of examples in the training set. In total, the maximum estimate is $-4 * 10^4 * \log(0.5)$ or `27,000`.

We want to find the loss graph from the standard deviation of the parameters, but a single measurement is quite unstable because, while maintaining the same initial variance of the parameters, learning may go differently and sometimes does not lead to a near-zero loss even after 10 thousand steps.

That is why we will be saving the measurement results to a database and repeating them multiple times. The function `train_n_times` will help us with this.

```python
from pymongo import MongoClient

def train_n_times(n = 1, hidden_std_dev = 1.0, output_std_dev = 1.0):
    client = MongoClient("mongodb://localhost:27017/")
    db = client["experiment_db"]
    collection = db["results"]
    
    losses = []
    for i in range(n):
        loss = train(hidden_std_dev, output_std_dev)
        losses.append(loss)
        
        # Save each result to MongoDB
        collection.insert_one({
            "hidden_std_dev": hidden_std_dev,
            "output_std_dev": output_std_dev,
            "loss": loss
        })
        
    client.close()
    return np.array(losses).mean(), np.array(losses).std()    
```

This function performs training `n` times for the given deviations and saves the results to a collection in the `mongodb` database.

Next, we determine which values we want to measure. Let's assume we only want to check the variance of the hidden layer, assuming a constant variance for the output layer. Furthermore, we do not want to distribute the measurement points linearly, as denser information around zero is more valuable, and we can leave larger gaps between larger values.

Therefore, we expand our measurement space to `n = 400` points, distributed with exponentially decreasing density.

```python
import numpy as np

n = 400
exp_values = np.exp(np.linspace(-3, 4, n))
```

The next step will be to enable calculations. In order to do this on multiple cores simultaneously, we will use `concurrent.futures`.

```python
from concurrent.futures import ProcessPoolExecutor, as_completed
from tqdm import tqdm
import time
from sys import stdout

def train_wrapper(y):
    return train_n_times(10, y, 0.8165)

start = time.time()

tl = []
with ProcessPoolExecutor() as executor:
    futures = [executor.submit(train_wrapper, y) for y in exp_values]
    for future in tqdm(
        as_completed(futures),
        total=len(futures),
        desc="Processing",
        leave=True,
        position=0,
        file=stdout
    ):
        tl.append(future.result())

end = time.time()
print(f"Time: {end - start:.2f} sec")
```

There are different parallelization strategies, but by spreading thread changes across sequences of multiple network simulations, we can achieve better performance than if we processed each simulation in a separate thread. This is because creating and terminating a thread, just like database connections, takes time.

![](https://ucarecdn.com/dd2bebbf-6cbe-41a2-a54b-9e01565a34e0/)

We see that the deviation of measurement values is large enough that it requires increasing the number of measurements. We can apply measurements proportionally to the relative measurement error in subsequent steps. To do this, we can retrieve data from our collection.

```python
from pymongo import MongoClient
import pandas as pd

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["experiment_db"]
collection = db["results"]

# Load all documents into a DataFrame
cursor = collection.find({}, {"_id": 0, "hidden_std_dev": 1, "loss": 1})
df = pd.DataFrame(list(cursor))

# Group by hidden_std_dev and compute mean, std, and count
summary = df.groupby("hidden_std_dev")["loss"].agg(["mean", "std", "count"]).reset_index()

print(summary, summary['count'].to_numpy().sum())
```

and then extract all statistical features of the measurements:

```python
x = summary["hidden_std_dev"].to_numpy()
means = summary["mean"].to_numpy()
count = summary["count"].to_numpy()
errors = summary["std"].to_numpy() / np.sqrt(count)
```

After performing 4 million simulations, the effect looks like this:

![](https://ucarecdn.com/4ff08abf-2e9d-4b77-a49d-ebe9144b2018/)

The black line is `1/sqrt(2)` which is the prediction derived from Xavier's (Glorota) model. The green line is the minimum.

From the measurements, we see that setting the deviation of the distribution to `1/sqrt(2}` instead of `1` improves the learning convergence by `8.5%`, and changing the deviation to `0.6` gives us an additional `1.1%`.

We devoted a relatively large space to this, but it is just the first element we can optimize in the learning process.

The next ones are:
- loss function
- activation function
- learning rate (which does not need to be constant)

There are significantly more of these parameters, and in upcoming articles, we will explore them using examples of simple networks like this one, to better understand them and build an intuition that allows for the construction of larger projects.
