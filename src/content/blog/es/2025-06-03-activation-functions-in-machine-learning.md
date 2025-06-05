---
author: Daniel Gustaw
canonicalName: activation-functions-in-machine-learning
coverImage: https://ucarecdn.com/43dafac9-01f5-4ff2-a101-20d0a8670bd5/-/preview/1000x1000/
description: Estudiamos varias funciones de activación, sus características y su impacto en el rendimiento de los modelos de aprendizaje automático.
excerpt: Estudiamos varias funciones de activación, sus características y su impacto en el rendimiento de los modelos de aprendizaje automático.
publishDate: 2025-06-04 00:00:00+00:00
slug: es/funciones-de-activacion-en-aprendizaje-maquina
tags:
- machine-learning
- python
- numpy
title: Funciones de Activación en Aprendizaje Automático
updateDate: 2025-06-04 00:00:00+00:00
---

Las funciones de activación son el corazón de cada red neuronal, determinando cómo las señales se propagan e interactúan a través de las capas. En esta publicación, exploraremos y compararemos varias funciones de activación populares utilizando una red neuronal mínima en un conjunto de datos de juguete.

Nos centraremos en qué tan rápido cada función ayuda a la red a converger—y qué tan bien se desempeña en una tarea de clasificación binaria con un límite de decisión no lineal.

## Configuración del problema

Simulamos una tarea de clasificación simple en 2D:

- Generamos `1000` puntos aleatorios de `2D` a partir de una distribución gaussiana.
- Etiquetamos cada punto como `1` si se encuentra dentro del círculo unitario, y `0` de lo contrario.

Esto crea un conjunto de datos no linealmente separable, perfecto para probar funciones de activación.

```python
import torch
import numpy as np

N = 1000
x = torch.randn(N, 2) * (1 / np.sqrt(2 * np.log(2)))
y = ((x[:, 0]**2 + x[:, 1]**2) < 1).float().unsqueeze(1)
```

El coeficiente $1 / \sqrt{2 \log 2}$ asegura que la mitad de los puntos lie dentro del círculo unitario y la otra mitad fuera:

$$
\lim_{N \to \infty} \frac{1}{N} \sum_{i=1}^{N} \mathbb{1}_{\{x_{i0}^2 + x_{i1}^2 < 1\}} = \mathbb{P}(x_0^2 + x_1^2 < 1) = \frac{1}{2}
$$

Queremos calcular la probabilidad:

$$
\mathbb{P}(x_0^2 + x_1^2 < 1) \quad x \sim \mathcal{N}(0, c^2)
$$

Esto es equivalente a calcular:

$$
\int \int_{x^2 + y^2 \leq 1} \frac{1}{2\pi c^2} e^{-\frac{x^2 + y^2}{2c^2}} \, dx \, dy
$$

Cambiando a coordenadas polares:

$$
\int_{0}^{2\pi} \int_{0}^{1} \frac{1}{2\pi c^2} e^{-\frac{r^2}{2c^2}} \cdot r \, dr \, d\theta
$$

Separando las integrales:

$$
\int_{0}^{2\pi} \frac{1}{2\pi} \, d\theta = 1
$$

La parte restante:

$$
\int_{0}^{1} \frac{1}{c^2} r e^{-\frac{r^2}{2c^2}} \, dr
$$

Calculemos esta integral utilizando la sustitución $u=\frac{r^2}{2 c^2}, \quad du=\frac{r}{c^2} dr$, así que:

$$
\int_{u = 0}^{\frac{1}{2c^2}} e^{-u} \, du = 1 - e^{-1/(2c^2)}
$$

Por lo tanto, el resultado final es:

$$
\mathbb{P}(x_0^2 + x_1^2 < 1) = 1 - e^{-1/(2c^2)}
$$

Ahora, resolvemos para $c$ tal que esta probabilidad sea igual a $\frac{1}{2}$:

$$
1 - e^{-1/(2c^2)} = \frac{1}{2}
\quad \Rightarrow \quad
e^{-1/(2c^2)} = \frac{1}{2}
\quad \Rightarrow \quad \newline
\frac{1}{2c^2} = \log 2
\quad \Rightarrow \quad
c = \frac{1}{\sqrt{2 \log 2}}
$$

## Arquitectura del Modelo

Utilizamos una pequeña red neuronal de retroalimentación con la siguiente estructura:

- Capa de entrada: 2 neuronas (para datos 2D)

- Capas ocultas: [16, 8] neuronas

- Salida: 1 neurona para clasificación binaria (con `BCEWithLogitsLoss`)

Cada capa oculta es seguida de una función de activación que queremos probar.

```python
import torch.nn as nn

def build_model(activation, layers=[2, 16, 8, 1]):
    layers_out = []
    for i in range(len(layers) - 2):
        layers_out += [nn.Linear(layers[i], layers[i+1]), activation()]
    layers_out += [nn.Linear(layers[-2], layers[-1])]
    return nn.Sequential(*layers_out)
```

## Entrenamiento y medición

Para entrenar el modelo necesitamos seleccionar la función de pérdida, el optimizador y el número de pasos. Podemos envolverlo en una función que devuelva una serie de tiempo de aprendizaje y pérdida que será útil para visualizar el rendimiento de las funciones de activación.

Podemos seleccionar las propiedades de entrenamiento:
- **Función de pérdida**: `BCEWithLogitsLoss` (numéricamente estable para clasificación binaria)
- **Optimizador**: Adam con tasa de aprendizaje `0.01`
- **Épocas**: 2000 pasos
- Registramos **pérdida** vs. **tiempo** para ver qué activaciones convergen más rápido.

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

Decidimos usar el optimizador `Adam` que a menudo se elige porque combina las fortalezas de dos optimizadores populares: `AdaGrad` y `RMSProp` y funciona bien de manera predeterminada para muchos problemas.

Para entrenar el modelo, podemos llamar a la función `train_timed` con nuestro modelo y algunos parámetros.

```python
model = build_model(nn.ReLU)
t, l = train_timed(model, 'ReLU')
```

Nuestro objetivo es comparar diferentes funciones de activación, pero ahora, veamos cómo el modelo predice la forma utilizando puntos de entrenamiento.

## Visualización de la predicción del modelo

Vamos a graficar la predicción del modelo utilizando código

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

## Comparemos funciones de activación

Comparamos las siguientes funciones de activación:

| Nombre       | Descripción                                                                   |
| ------------ | ----------------------------------------------------------------------------- |
| `ReLU`       | Rápida y efectiva, pero puede "morir" con entradas negativas (gradiente cero). |
| `Tanh`       | Suave, centrada en cero, pero se satura para valores grandes (gradientes que desaparecen). |
| `LeakyReLU`  | Variante de ReLU que permite un pequeño gradiente cuando las entradas son negativas. |
| `Sigmoid`    | Salidas entre 0 y 1; sufre de gradientes que desaparecen.                    |
| `ELU`        | Como ReLU pero más suave y puede producir negativos, mejorando el aprendizaje. |
| `SiLU`       | También conocido como Swish; suave y no monótono; promueve una mejor generalización. |
| `GELU`       | Basado en Gaussian; suave y probabilístico, popular en Transformers.          |
| `Softplus`   | Aproximación suave de ReLU; siempre diferenciable pero más costosa.          |

Podemos comparar estos gráficos mediante código que creará una cuadrícula de funciones de activación.

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

## Un solo entrenamiento no es suficiente

El enfoque ingenuo es simplemente entrenar cada modelo con la función de activación dada y comparar los resultados:

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

Aunque podemos ver una gran ventaja de `LeakyReLU` en la primera ejecución:

![](https://ucarecdn.com/2324479e-dfae-4119-81aa-cd3cc953c06e/)

Al llamar al mismo código por segunda vez, podemos ver que los resultados son diferentes:

![](https://ucarecdn.com/34e55503-493b-42c6-8169-8014dd862d96/)

Especialmente que el rendimiento de `GELU` es mucho mejor. Esto significa que para realmente comparar estas funciones necesitamos ejecutar estas simulaciones muchas veces, pero antes de eso, me gustaría mostrarles qué puede suceder cuando entrenamos un poco más de tiempo.

![](https://ucarecdn.com/e598dd94-5c94-4f90-8fe8-771e44eb7d0d/)

Ahí puedes ver que inicialmente el más lento `Tanh` fue más estable en una ejecución a largo plazo, pero `LeakyReLU` falló completamente. Presento estos gráficos, pero debes ser consciente de que estos son solo resultados de un solo aprendizaje y para construir conclusiones valiosas tenemos que ejecutarlos muchas veces.

Pero vemos que una única ejecución nos da dinámicas de aprendizaje que no pueden ser cortadas en ningún punto arbitrariamente seleccionado, porque la posición en el ranking puede cambiar en dependencia de la duración del entrenamiento.

Por esta razón, guardaremos en la base de datos todas las pérdidas medidas en objetos como este:

```json
{
  "name": "ReLU",
  "time": 1.54,
  "loss": 0.02,
  "epoch": 2000
}
```

Así que en el siguiente párrafo añadiremos el guardado de resultados en la base de datos y ejecutaremos simulaciones muchas veces.

## Ejecutando múltiples simulaciones

Agreguemos un array `steps` a la salida de la función `train_timed`.

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

Luego podemos construir un envoltorio que guarde los resultados en la base de datos MongoDB y permita múltiples ejecuciones:

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

y finalmente llama a la función `train_n_times` para ejecutar el entrenamiento para todas las funciones de activación múltiples veces.

```python
train_n_times(1000, 0.01, 2000)
```

## Análisis de resultados (por época)

Ahora extraigamos resultados de la base de datos `mongo` y tracemos gráficos.

Para simplificar, podemos usar las épocas como el eje x en lugar del tiempo. La primera parte del código obtiene los datos y los organiza en un `DataFrame` para cada función de activación.

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

La segunda parte es responsable de la representación gráfica.

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

Podemos verificar la pérdida para la última época para cada función de activación:

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

Resultados:

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

## Análisis por tiempo

Para trazar curvas de aprendizaje por tiempo, necesitamos convertir las mediciones de tiempo en flotante a bins de tamaño fijo.

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

Gracias a esta técnica, podemos trazar curvas de aprendizaje a lo largo del tiempo.

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

## Conclusiones

Vale la pena comparar nuestros resultados con el artículo que contiene un resumen de benchmarks mucho más extenso [**Funciones de Activación en Aprendizaje Profundo: Una Revisión Integral y Benchmark**](https://arxiv.org/pdf/2109.14545).

Aunque en mi benchmark `LeakyReLU` es el mejor, en el artículo encontraron que depende del caso de uso, el conjunto de datos y la complejidad de la red. Resumiré las conclusiones de este artículo y las compararé con nuestros resultados.

### 1. No hay un Ganador Universal

   Ninguna función de activación única domina en todos los conjuntos de datos y modelos.

   Algunas funciones (como Swish y Mish) tienen un rendimiento consistentemente bueno, pero no siempre son las mejores en cada escenario.

> Elige AFs según tu modelo y conjunto de datos, no ciegamente.

### 2. ReLU Sigue Siendo Fuerte

   A pesar de ser antigua y simple, ReLU sigue siendo competitiva en muchas tareas.

   Funciona especialmente bien en redes más profundas (como CNNs) y en conjuntos de datos grandes.

> Comienza con ReLU. Es un buen valor por defecto.

### 3. Swish, Mish y GELU Destacan

   Estas son funciones suaves, no lineales y adaptativas.

   Superan a ReLU en ciertas tareas, especialmente en conjuntos de datos más complejos o redes más profundas.

   - Swish: $x⋅\sigma(x)$

   - Mish: $x⋅\tanh(\ln(1+ex))$

   - GELU: Unidad Lineal de Error Gaussiano

> Prueba estas funciones cuando la precisión del entrenamiento se estanca o los gradientes desaparecen.

### 4. Leaky/Parametric ReLU Ayuda con Gradientes Escasos

   Variantes como Leaky ReLU y PReLU resuelven el problema de "neurona muerta" de ReLU.

   Especialmente útiles en conjuntos de datos más pequeños donde las neuronas pueden inactivarse.

> Usa estas funciones cuando partes de tu red se quedan en silencio.

### 5. Sigmoid/Tanh Funcionan Mal en Redes Profundas

   Causan gradientes que desaparecen y se saturan fácilmente.

   En modelos profundos, tienden a ralentizar el entrenamiento y perjudicar el rendimiento.

> Evita sigmoid/tanh a menos que estés en modelos superficiales o heredados (por ejemplo, RNN antiguas).

### 6. El Costo Computacional Importa

   Activaciones sofisticadas como Mish y GELU son más pesadas de calcular que ReLU.

   En dispositivos móviles o de borde, ReLU puede ser preferible por velocidad y eficiencia.

> Equilibra rendimiento y costo computacional según tu objetivo de implementación.

---

Así que en nuestra situación, de hecho, podemos confirmar los malos resultados de `tanh` y `sigmoid`. Los ganadores:
- LeakyReLU
- GELU
- ELU
- SiLU

son solo modificaciones de `ReLU` que se recomiendan como remedio para el problema de "neuronas muertas" o para conjuntos de datos pequeños.

Parece que ese es nuestro caso porque `1000` puntos pueden considerarse pequeños, así que versiones más suaves de `ReLU` son realmente mejores en este caso, lo que confirma los resultados de la publicación analizada.

Parece una buena práctica comenzar con `ReLU` y probar otras funciones más tarde si tenemos suficiente tiempo para el entrenamiento y los experimentos.
