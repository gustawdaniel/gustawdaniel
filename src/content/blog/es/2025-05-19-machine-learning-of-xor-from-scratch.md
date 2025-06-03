---
author: Daniel Gustaw
canonicalName: machine-learning-of-xor-from-scratch
coverImage: https://ucarecdn.com/19bf54c3-7109-4836-9dce-dbbfca11d7ed/-/preview/640x640/
description: Introducción al aprendizaje automático mediante el ejemplo del problema XOR. En este artículo mostramos cómo crear un modelo desde cero, utilizando Python y NumPy.
excerpt: Introducción al aprendizaje automático mediante el ejemplo del problema XOR. En este artículo mostramos cómo crear un modelo desde cero, utilizando Python y NumPy.
publishDate: 2025-05-19 00:00:00+00:00
slug: es/aprendizaje-maquina-del-xor-desde-cero
tags:
- machine-learning
- python
- numpy
title: Aprendizaje automático XOR desde cero
updateDate: 2025-05-19 00:00:00+00:00
---

En este artículo leerás cómo construir un modelo de IA desde cero.

## XOR como combinación lineal de clasificadores lineales

Un ejemplo de aprendizaje automático es el problema XOR.

**XOR** (o exclusivo) es una función lógica que devuelve verdadero (1) si exactamente uno de sus argumentos es verdadero. De lo contrario, devuelve falso (0). El problema XOR es un ejemplo clásico de un problema que no puede ser resuelto por modelos de clasificación lineales, como la regresión logística. Por ello, se utiliza a menudo como ejemplo para la enseñanza de redes neuronales.

Se puede mostrar en una tabla lógica:

| x | y | xor(x, y) |
|---|---|-----------|
| 0 | 0 | 0         |
| 0 | 1 | 1         |
| 1 | 0 | 1         |
| 1 | 1 | 0         |

o en un gráfico:

![](https://ucarecdn.com/572a9d0c-4d85-4891-8d2a-c12c5467c0ba/)

Con esta segunda representación, se puede ver que se puede construir XOR con 2 clasificadores lineales.

![](https://ucarecdn.com/0037d1c8-79ad-412b-a557-d8992dd2f656/xor_linear_bernoulli_planes.svg)

Un clasificador así se puede interpretar como una transformación que toma el espacio de argumentos (en nuestro caso el cuadrado `[0,1] x [0,1]`), luego lo transforma afínmente (gira, escala, desplaza, refleja, corta) y al final crea una línea límite entre las clases `{0, 1}`. Eso significa que para la compuerta `XOR` se necesitan 2 de tales clasificadores, porque en el gráfico tenemos 2 líneas límite negras.

## Neurona artificial como un clasificador lineal

Una operación afín puede escribirse como:

$$
z = a x1 + b x2 + c, \quad z \in \mathbb{R}, \quad x1,x2 \in [0,1].
$$

donde `a` y `b` se llaman pesos y `c` es el sesgo. Son coeficientes que se pueden determinar en el proceso de aprendizaje. Una forma más conveniente es la forma vectorial donde:

$$
z = w^T x + b, \quad w = [a, b]^T, \quad x = [x1, x2]^T.
$$

Sin embargo, dado que la sintaxis de las operaciones lineales produce una operación lineal, para introducir no linealidad se agrega una función de activación a las neuronas. La función de activación es una función que transforma la excitación de la neurona en la salida de la neurona. Puede ser cualquier función no lineal, pero generalmente buscamos una que:

- sea fácil de calcular
- tenga una derivada simple
- se ajuste a la imagen de los argumentos

En nuestro caso:

$$
z \in \mathbb{R}, \quad f(z) \in [0,1].
$$

podemos usar la función de activación `sigmoide`:

$$
\sigma(z) = \frac{1}{1 + e^{-z}}, \quad z \in \mathbb{R}, \quad \text{Im}(\sigma) = (0, 1)
$$

que tiene una derivada:

$$
\sigma'(z) = \sigma(z) (1 - \sigma(z)), \quad z \in \mathbb{R}.
$$

dado que

$$
\frac{d}{dz} \left( \frac{1}{1 + e^{-z}} \right)

= -\frac{1}{(1 + e^{-z})^2} \cdot (-e^{-z})

= \left( \frac{1}{1 + e^{-z}} \right) \cdot \left( \frac{e^{-z} + 1 - 1}{1 + e^{-z}} \right)
$$

Sin embargo, esta no es la única posibilidad. Se pueden utilizar otras funciones de activación, como `tanh`, `ReLU`, `Leaky ReLU` o `ELU`. La elección de la función de activación depende del problema específico y de la arquitectura de la red neuronal.

Sin embargo, apreciaremos la elección de la función `sigmoide` cuando veamos cómo simplifica las fórmulas sobre la derivada de la función de pérdida con respecto a los parámetros de la red.

## Función de pérdida de la red neuronal

La pérdida es una medida de nuestro descontento con el funcionamiento del modelo. Al igual que la función de activación, se puede definir con gran libertad, pero nos interesa que:

- mida cuán errado está el modelo
- sea fácil de calcular
- su derivada con respecto a los parámetros sea fácil de calcular

Los argumentos de la función de pérdida son el valor de salida del modelo $\hat{y}$ y el valor de salida de los datos de entrenamiento $y$. Aunque son dos valores en el intervalo `[0,1]`, no deben confundirse con el par de valores de entrada `x1` y `x2`. Para subrayar esta diferencia, las gráficas a continuación tienen un color diferente.

Antes de introducir la función de pérdida, echemos un vistazo a una función de concordancia de ejemplo.

$$
P(y | \hat{y}) = \hat{y}^y (1 - \hat{y})^{1 - y}, \quad y \in \{0,1\}.
$$

Es la distribución de Bernoulli: una función con forma de campana con un pico en la línea $y = \hat{y}$.

![](https://ucarecdn.com/80858d14-9c6b-4a86-865e-b8f0f414ab72/)

Podemos llamarlo medida de concordancia, porque alcanza su valor máximo cuando nuestro modelo predice valores $\hat{y}$ lo más cercanos posible a $y$.

Sin embargo, la función de pérdida debe tener mínimos donde la función de concordancia tiene máximos. Podemos conseguir esto mediante la inversión: $1/P$, un cambio de signo $-P$, o aplicando otra transformación que convierta los máximos de concordancia en mínimos de pérdida.

Nuevamente, a pesar de la gran libertad, elegiremos la función de pérdida como el logaritmo negativo de la función de concordancia. Esta elección específica se puede justificar por el hecho de que la derivada de la pérdida definida de esta manera será muy fácil de calcular.

$$
\mathcal{L}_{\text{BCE}}(y, \hat{y}) = -\log(P(y | \hat{y}) )= -\left[ y \cdot \log(\hat{y}) + (1 - y) \cdot \log(1 - \hat{y}) \right]
$$

Esta fórmula presenta `binary cross entropy` como función de pérdida. Veamos cómo depende esta función de pérdida de los parámetros del modelo.

$$
\begin{aligned}
\text{Sea} \quad \hat{y} &= \sigma(z) = \frac{1}{1 + e^{-z}} \\[10pt]

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

Vemos que el gradiente de la pérdida es realmente simple de calcular y esto nos permite pasar a la implementación práctica de la red en código.

## Implementación del aprendizaje XOR en Python

Aunque normalmente se utilizan para esto bibliotecas especializadas como `pytorch` o `tensorflow`, aquí nos centraremos en mostrar cómo hacerlo sin ellas, para entender mejor cada uno de los pasos. Comenzaremos definiendo las funciones que discutimos en la parte teórica:

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

A continuación, proporcionamos los datos de entrenamiento, es decir, transcribimos la tabla lógica que define la función `XOR` que queremos enseñar al modelo.

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

Hemos establecido que el modelo requerirá dos neuronas en la capa oculta (dos líneas negras en el segundo gráfico) y una al final, para dar un resultado.

![](https://ucarecdn.com/d9ea38bb-f8fd-4f9e-99fc-f3ff1941228e/)

Por lo tanto, tenemos los siguientes parámetros:

```python
input_layer_neurons = 2
hidden_layer_neurons = 2
output_neurons = 1
learning_rate = 0.1
epochs = 10000
```

La cantidad de repeticiones de entrenamiento y su velocidad las elegimos arbitrariamente, pero son parámetros importantes que se optimizan dependiendo del caso que estamos modelando.

Ahora determinaremos los valores iniciales de los pesos. Establezcamos que serán valores con distribución normal con una desviación de 1, pero volveremos a este punto, porque es algo que se puede hacer mejor.

```python
hidden_weights = np.random.randn(input_layer_neurons, hidden_layer_neurons)
hidden_bias = np.random.randn(1, hidden_layer_neurons)
output_weights = np.random.randn(hidden_layer_neurons, output_neurons)
output_bias = np.random.randn(1, output_neurons)
```

Teniendo todos los parámetros necesarios, podemos comenzar el aprendizaje.

```python
for epoch in range(epochs):
```

En el bucle de aprendizaje, calculamos secuencialmente los valores de activación y los resultados de las siguientes capas. Esta parte se llama "Forward" y sirve para determinar qué predicciones genera el modelo.

La segunda parte: "Backpropagation" es un algoritmo que permite modificar los parámetros en las capas de la última a la primera de manera que, en los siguientes pasos, se reduzca la pérdida.

Las discutiremos línea por línea. El primer paso es transformar las entradas `x1` y `x2`, llamadas en el código `inputs`, en la activación de la neurona `z` o `hidden_input` y luego en su salida, es decir, aplicar la función `sigma` sobre ella.

$$
h_i = w_h^T x + b_h \quad h_o = \sigma(h_i)
$$

```python
    # Forward
    hidden_input = np.dot(inputs, hidden_weights) + hidden_bias
    hidden_output = sigmoid(hidden_input)
```

A continuación, aplicamos esta operación en la siguiente capa:

$$
f_i = w_o^T h_o + b_o \quad \hat{y} = \sigma(f_i)
$$

```python
    final_input = np.dot(hidden_output, output_weights) + output_bias
    predicted_output = sigmoid(final_input)
```

A continuación, calculamos la divergencia entre la predicción y el valor real. En este caso, es la 
`entropía cruzada binaria`. También anotamos su derivada con respecto a la activación de la neurona de la última capa.

$$
\mathtt{loss} = \mathcal{L}_{\mathrm{BCE}}(y, \hat{y}) \quad \mathtt{d\_predicted\_output} = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i}
$$

```python
    loss = binary_cross_entropy(expected_output, predicted_output)
    d_predicted_output = binary_cross_entropy_derivative(expected_output, predicted_output)
```

Ahora podemos volver de la última a la primera capa, actualizando los parámetros de la red.

En la última capa ya tenemos la derivada respecto a la activación, por lo que los cambios en los parámetros son respectivamente:

$$
\Delta w_o = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot \frac{df_i}{dw_o} = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot h_o \quad \Delta b_o = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i}
$$

Solo debemos asegurarnos de la compatibilidad de dimensiones al multiplicar.

| variable           | shape  |
|--------------------|--------|
| hidden_output      | (4, 2) |
| d_predicted_output | (4, 1) |
| output_weights     | (2, 1) |
| output_bias        | (1, 1) |

El valor `4` es la cantidad de muestras del conjunto de entrenamiento, mientras que `2` es la cantidad de entradas a la última capa. Queremos eliminar la dimensión `4`, por lo que hacemos las siguientes multiplicaciones y transposiciones:

```python
    # Backprop
    output_weights -= hidden_output.T.dot(d_predicted_output) * learning_rate
    output_bias -= np.sum(d_predicted_output, axis=0, keepdims=True) * learning_rate
```

En el siguiente paso pasamos a través de la capa oculta.

$$
\Delta w_h = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot \frac{df_i}{dh_o} \cdot \frac{dh_o}{dh_i} \cdot \frac{dh_i}{dw_h} = \\[10pt] = \mathtt{d\_predicted\_output} \cdot w_o^T \cdot \sigma'(h_o) * x  \\[20pt]

\Delta b_h = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot \frac{df_i}{dh_o} \cdot \frac{dh_o}{dh_i} \cdot \frac{dh_i}{db_h} = \\[10pt] = \mathtt{d\_predicted\_output} \cdot w_o^T \cdot \sigma'(h_o) 
$$

escribimos estas fórmulas en el código nuevamente cuidando la compatibilidad de dimensiones.

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

Al finalizar el bucle, podemos ver las predicciones de la red.

```python
print("Predicted Output:")
print(predicted_output.round(3))
```

Vemos que predice efectivamente XOR.

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

Aquí podríamos terminar, pero en realidad construir el primer modelo funcional suele ser solo el comienzo de la diversión con redes neuronales, ya que ahora podemos comenzar a buscar áreas de mejora.

## Optimización de la distribución inicial de pesos

Al seleccionar pesos iniciales al azar, mencioné que se puede hacer mejor. 
Aunque están concentrados alrededor de cero, donde la función `sigma` tiene 
la mayor variabilidad, su desviación estándar se eligió arbitrariamente como 1. 
Veamos qué pasaría si los cambiáramos.

Supongamos que la desviación estándar de los pesos iniciales es muy pequeña. Aunque la función `sigma` tiene una derivada máxima
justo alrededor de cero, al calcular el cambio de pesos, debemos promediarlo respecto a todo el conjunto de entrenamiento.

Nuestros datos de entrenamiento tienen simetría, por la cual los factores proporcionales a los gradientes al calcular los cambios de pesos aparecen con signos opuestos y se cancelan entre sí. Al realizar la expansión en serie de Taylor de la función `sigma`, podemos ver que solo los elementos proporcionales a los propios pesos, o más bien a sus diferencias, no se cancelan en las ecuaciones para el cambio de pesos.

Por lo tanto, podemos concluir que la evolución de los pesos para desviaciones estándar iniciales muy pequeñas se comportará como una función cuadrática, lo que significa que variaciones de pesos suficientemente pequeñas retrasarán el proceso de inicio del aprendizaje óptimo.

Podemos observar esto en el gráfico, donde los pesos iniciales concentrados alrededor de cero prácticamente no cambian durante los primeros 2000 ciclos de aprendizaje. Solo entonces ocurre una rápida evolución de los pesos y tras otros 2000 ciclos se estabilizan en una convergencia estable hacia el óptimo.

![](https://ucarecdn.com/c502d3f7-0134-4208-91b9-4e30ad8fa349/)

Por otro lado, pesos iniciales demasiado altos conducen a que la variabilidad inicial de los pesos sea alta, pero a menudo puede dirigirse en una dirección incorrecta. Lo vemos en el gráfico, donde los pesos no convergen a valores óptimos de manera uniforme (particularmente al principio).

![](https://ucarecdn.com/aaee8705-9eba-4196-9455-16b8f11f34cc/)

Entonces, midamos cuán exactamente la velocidad de aprendizaje depende de la desviación estándar inicial de los pesos.

Para ello, introducimos una función que inicializa los pesos:

```python
def init_params(hidden_std_dev = 1, output_std_dev = 1):
    hidden_weights = np.random.randn(input_layer_neurons, hidden_layer_neurons) * hidden_std_dev
    hidden_bias = np.random.randn(1, hidden_layer_neurons) * hidden_std_dev
    output_weights = np.random.randn(hidden_layer_neurons, output_neurons) * output_std_dev
    output_bias = np.random.randn(1, output_neurons) * output_std_dev
    return hidden_weights, hidden_bias, output_weights, output_bias
```

Todo el proceso de aprendizaje lo cerramos en la función `train`, que ahora depende de las desviaciones iniciales de los parámetros.

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

Devuelve la pérdida total de todos los pasos de entrenamiento. Gracias a esto, podemos esperar que si el aprendizaje no tiene éxito, para una red aleatoria la suma de las pérdidas será igual a $N * T * \mathcal{L}_{\text{BCE}}(\hat{y} \sim \mathcal{U}(0,1), y)$, donde $\mathcal{L}_{BCE}$ es la función `binary cross entropy`, `T = 10,000` es la longitud del entrenamiento, y `N = 4` es la cantidad de ejemplos en el conjunto de entrenamiento. En total, la estimación máxima es $-4 * 10^4 * \log(0.5)$ es decir `27,000`.

Queremos encontrar el gráfico de la pérdida respecto a la desviación estándar de los parámetros, pero una única medición es bastante inestable, ya que al mantener la misma variación inicial de los parámetros, el aprendizaje puede ir de diversas maneras y a veces no conduce a una pérdida cercana a cero incluso después de 10 mil pasos.

Por eso, estaremos registrando los resultados de las mediciones en una base y repitiéndolos múltiples veces. La función `train_n_times` nos ayudará con esto.

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

Esta función realiza un entrenamiento `n` veces para las desviaciones dadas y guarda los resultados en una colección en la base de datos `mongodb`.

A continuación, establecemos en qué valores queremos realizar las mediciones. Supongamos que solo queremos comprobar la varianza de la capa oculta, asumiendo una varianza constante para la capa de salida. Además, no queremos distribuir los puntos de medición de manera lineal, ya que la información densa cerca de cero es más valiosa, y podemos dejar mayores intervalos entre valores más altos.

Por lo tanto, expandimos nuestro espacio de mediciones a `n = 400` puntos, dispuestos con una densidad que disminuye exponencialmente.

```python
import numpy as np

n = 400
exp_values = np.exp(np.linspace(-3, 4, n))
```

El siguiente paso será habilitar los cálculos. Para que se pueda hacer en múltiples núcleos simultáneamente, utilizaremos `concurent.futures`.

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

hay diferentes estrategias de paralelización, pero al extender los cambios de hilos en secuencias de múltiples simulaciones de red, podemos lograr un mejor rendimiento que si procesáramos cada simulación en un hilo separado. Esto se debe a que crear y finalizar un hilo, al igual que las conexiones a la base de datos, lleva tiempo.

![](https://ucarecdn.com/dd2bebbf-6cbe-41a2-a54b-9e01565a34e0/)

Vemos que la desviación de los valores de mediciones es lo suficientemente grande como para requerir un aumento en la cantidad de mediciones. En los pasos siguientes, podemos aplicar las mediciones proporcionalmente al error relativo de medición. Para hacer esto, podemos obtener datos de nuestra colección.

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

y luego extraer todas las características estadísticas de las mediciones:

```python
x = summary["hidden_std_dev"].to_numpy()
means = summary["mean"].to_numpy()
count = summary["count"].to_numpy()
errors = summary["std"].to_numpy() / np.sqrt(count)
```

Después de realizar 4 millones de simulaciones, el efecto se ve así:

![](https://ucarecdn.com/4ff08abf-2e9d-4b77-a49d-ebe9144b2018/)

La línea negra es `1/sqrt(2)`, es decir, la predicción resultante del modelo de Xavier (Glorota). La verde es el mínimo.

De las mediciones, vemos que establecer la desviación del distribuidor en `1/sqrt(2)` en lugar de `1` mejora la convergencia del aprendizaje en `8.5%`, y al cambiar la desviación a `0.6` obtenemos un `1.1%` adicional.

Le hemos dedicado relativamente mucho espacio a esto, pero es solo el primer elemento al azar que podemos optimizar en el proceso de aprendizaje.

Los siguientes son:
- función de pérdida
- función de activación
- tasa de aprendizaje (que no tiene que ser constante)

Hay muchos más parámetros y en los siguientes artículos los descubriremos a través de ejemplos de redes simples como esta, para comprenderlos mejor y construir alrededor de ellos una intuición que permita la creación de proyectos más grandes.
