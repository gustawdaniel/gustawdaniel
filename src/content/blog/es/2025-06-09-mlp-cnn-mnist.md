---
author: Daniel Gustaw
canonicalName: mlp-cnn-mnist
coverImage: https://ucarecdn.com/4e2e19a5-ad94-44f4-bc3f-5e53bc395ccb/-/crop/1024x512/0,0/
description: Construimos y comparamos cuatro arquitecturas de redes neuronales en PyTorch, visualizamos el rendimiento, exploramos la complejidad frente a la precisión y mostramos por qué las CNN sobresalen en la clasificación de imágenes.
excerpt: Construimos y comparamos cuatro arquitecturas de redes neuronales en PyTorch, visualizamos el rendimiento, exploramos la complejidad frente a la precisión y mostramos por qué las CNN sobresalen en la clasificación de imágenes.
publishDate: 2025-06-09 00:00:00+00:00
slug: es/mlp-cnn-mnist
tags:
- mlp
- cnn
- mnist
- pytorch
title: De MLP a CNN. Redes Neuronales para el Reconocimiento de Dígitos MNIST
updateDate: 2025-06-09 00:00:00+00:00
---

## Introducción

El conjunto de datos **MNIST** es un clásico estándar en visión por computadora, que consiste en 70,000 imágenes en escala de grises de dígitos escritos a mano (28×28 píxeles). Es lo suficientemente pequeño como para entrenar rápidamente, pero lo suficientemente complejo como para revelar diferencias en el rendimiento del modelo, perfecto para experimentos con redes neuronales.

Mientras que los **Perceptrones Multicapa** (MLPs) pueden clasificar técnicamente los datos de imagen, tratan los píxeles como vectores planos, ignorando patrones espaciales. Las **Redes Neuronales Convolucionales** (CNNs), por otro lado, están diseñadas para aprovechar las estructuras locales en las imágenes: bordes, curvas, texturas, lo que las hace mucho más efectivas para tareas visuales.

En esta publicación, comparo cuatro arquitecturas: un MLP simple, un TinyCNN mínimo, un CNN equilibrado y un StrongCNN más pesado. Veremos la precisión, el tiempo de entrenamiento y los recuentos de parámetros para entender las compensaciones.

## Preparación del Conjunto de Datos

Como se mencionó anteriormente, estamos utilizando el conjunto de datos **MNIST**, convenientemente disponible a través de `torchvision.datasets`. Con solo unas pocas líneas de código, descargamos y cargamos los datos, aplicamos una transformación básica y los preparamos para el entrenamiento:

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

El único paso de preprocesamiento aquí es `transforms.ToTensor()`, que convierte cada imagen en un tensor de PyTorch y normaliza sus valores de píxel al rango `[0.0, 1.0]`.

```python
from torch.utils.data import DataLoader

BATCH_SIZE = 64

train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True)
test_loader = DataLoader(test_data, batch_size=BATCH_SIZE)
```

Mezclar los datos de entrenamiento evita memorizar el orden de los dígitos. Para el conjunto de prueba, omitimos la mezcla pero aún utilizamos el agrupamiento para la eficiencia.

Podemos mostrar algunas imágenes de muestra para visualizar el conjunto de datos:

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

## Entrenamiento y Evaluación

Ahora que nuestros datos están listos, es hora de enseñar a nuestros modelos cómo leer dígitos manuscritos. Para hacer esto, definimos un bucle de entrenamiento y evaluación estándar utilizando la estructura idiomática de PyTorch. También seguiremos la complejidad del modelo utilizando un simple contador de parámetros, útil al comparar diferentes arquitecturas.

### Configuración del Dispositivo y Épocas

Primero, detectamos si hay una GPU disponible. Si es así, el entrenamiento ocurrirá en CUDA; de lo contrario, recurrimos a la CPU. También establecemos una duración de entrenamiento razonable:

```python
import torch

EPOCHS = 5
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

Cinco épocas pueden no parecer mucho, pero en MNIST, a menudo es suficiente para obtener resultados sorprendentemente buenos, incluso con modelos básicos.

### Bucle de Entrenamiento

Aquí está nuestra función `train()`. Es tan estándar como se puede: establece el modelo en modo de entrenamiento, recorre los lotes, calcula la pérdida y actualiza los pesos.

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

Esta función no devuelve nada; solo actualiza los parámetros internos del modelo. Durante el entrenamiento, no nos importa la precisión todavía. Lo comprobamos más tarde.

### Bucle de Evaluación

Después del entrenamiento, evaluamos en el conjunto de prueba. El modelo se establece en modo `eval()`, se desactivan los gradientes y recogemos dos métricas: precisión y pérdida media de entropía cruzada.

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

Tenga en cuenta que tomamos la pérdida media sobre lotes, no ejemplos individuales. Es un buen equilibrio entre el seguimiento del rendimiento y la simplicidad.

### Conteo de Parámetros

Antes de comparar arquitecturas, es útil saber cuántos parámetros entrenables tiene cada una. Esta pequeña utilidad nos da el conteo:

```python
def count_params(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
```

Spoiler: el `StrongCNN` tiene más de `450,000` parámetros, mientras que `TinyCNN` se las arregla con solo unos pocos miles. Esa es una gran diferencia—y un gran punto de partida para un análisis más profundo.

### Ejecutador de Experimentos

Finalmente, juntamos todo en una sola función que entrena un modelo, cronometra el proceso, evalúa en el conjunto de prueba y imprime un breve resumen:

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

Esta estructura es lo suficientemente flexible como para trabajar con cualquier clase de modelo que pases, desde MLPs simples hasta bestias de convolución profundas.

En la siguiente sección, definiremos y analizaremos las cuatro arquitecturas: `MLP`, `TinyCNN`, `CNN` y `StrongCNN`.

## Modelo 1: Perceptrón Multicapa (MLP)

La arquitectura más simple que consideramos es el clásico Perceptrón Multicapa (MLP). Trata cada imagen de 28×28 como un vector plano de 784 píxeles, ignorando la estructura espacial pero aún capaz de aprender características útiles a través de capas completamente conectadas.

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

### Explicación

- **Flatten** convierte la imagen de entrada 2D en un vector 1D.
- La primera capa **Linear** proyecta este vector de entrada en un espacio oculto de 32 dimensiones.
- La activación **ReLU** introduce no linealidad para aprender patrones complejos.
- La última capa **Linear** genera logits para las 10 clases de dígitos.

Este pequeño MLP tiene relativamente pocos parámetros y entrena rápidamente, pero no captura las relaciones espaciales entre los píxeles, limitando su precisión en los datos de imagen.

```python
run_experiment(MLP, "MLP")
```

deberías ver:

```
MLP (25450 parameters)
Test Accuracy: 95.96% | Loss: 0.14 | Learning time: 8.7s
```

Será nuestro punto de referencia para comparar modelos `cnn`.

## Modelo 2: TinyCNN — Una Red Neuronal Convolucional Mínima

A continuación, presentamos una simple arquitectura TinyCNN que aprovecha las capas convolucionales para capturar patrones espaciales en imágenes. Este modelo es ligero pero mucho más poderoso que el MLP para tareas de imagen.

La figura a continuación ilustra la arquitectura TinyCNN:

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

### Descripción General de la Arquitectura

- La red comienza con una capa convolucional que transforma la entrada de 1 canal a 4 canales, preservando las dimensiones espaciales con relleno.
- Una activación **ReLU** añade no linealidad.
- **MaxPooling** reduce a la mitad el tamaño espacial a 14×14, disminuyendo el costo computacional y proporcionando invarianza espacial.
- Una segunda convolución expande los mapas de características de 4 a 8 canales.
- Otro ReLU y max-pooling reducen el tamaño del mapa de características a 7×7.
- Finalmente, las características se aplanan y se pasan directamente a una capa lineal que genera logits para las 10 clases de dígitos.

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

A veces, `cnn` se presentan gráficamente como el siguiente flujo de trabajo:

![](https://ucarecdn.com/49c9ba4e-3a99-441c-8255-ecde041531a4/-/preview/865x173/)

Lo que es más interesante es que estamos superando los resultados de `mlp` con solo `4266` parámetros en lugar de `25450`.

```
Tiny CNN (4266 parameters)
Test Accuracy: 97.96% | Loss: 0.06 | Learning time: 12.3s
```

Con una red mucho más pequeña, podemos esperar la mitad de errores en comparación con el modelo anterior.

Verifiquemos cómo mejoraría nuestra red si mantuviéramos una cantidad similar de parámetros al MLP original.

## Modelo 3: CNN — Una Red Neuronal Convolucional Balanceada

Ahora que hemos visto lo que un modelo convolucional mínimo puede hacer, escalemos un poco las cosas.

![](https://ucarecdn.com/f4949a96-b88c-44bd-a584-596deb7a5967/)

El modelo **CNN** a continuación está diseñado para mantener un equilibrio adecuado entre la cantidad de parámetros y el rendimiento. Expande las capacidades de extracción de características del `TinyCNN` utilizando más filtros y una capa lineal oculta antes de la salida final.

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

### Desglose de Arquitectura

En comparación con `TinyCNN`, este modelo:

- Duplica el número de filtros convolucionales (8 → 16), permitiendo que capture patrones visuales más ricos.
- Agrega una **capa oculta completamente conectada** con 32 neuronas antes de la salida. Esta capa adicional mejora la capacidad del modelo para combinar características extraídas antes de hacer la clasificación final.
- Sigue utilizando solo dos capas convolucionales y dos capas de pooling, manteniéndolo razonablemente ligero y rápido.

En la tabla a continuación se encuentran todas las capas, formas de salida y parámetros sin la dimensión del lote:


| Capa               | Forma de Salida | Parámetros |
|--------------------|------------------|------------|
| Conv2d (1→8, 3×3)  | 8×28×28          | 80         |
| ReLU               | 8×28×28          | 0          |
| MaxPool2d          | 8×14×14          | 0          |
| Conv2d (8→16, 3×3) | 16×14×14         | 1,168      |
| ReLU               | 16×14×14         | 0          |
| MaxPool2d          | 16×7×7           | 0          |
| Flatten            | 784              | 0          |
| Linear (784 → 32)  | 32               | 25,120     |
| ReLU               | 32               | 0          |
| Linear (32 → 10)   | 10               | 330        |
| **Total**          | —                | **26,698** |

![](https://ucarecdn.com/1130eea0-13da-44cb-a7b1-86f44789054f/-/preview/1000x170/)

Con 26,698 parámetros, este `CNN` tiene un tamaño similar al de la `MLP` (25,450) pero significativamente más potente.

```
CNN (26698 parameters)
Test Accuracy: 98.22% | Loss: 0.05 | Learning time: 14.3s
```

### Observaciones Clave

- **Mejora de precisión**: El modelo alcanza una precisión del **98.22%**, mejorando tanto en comparación con el `MLP` como con el `TinyCNN`.

- **Eficiencia de parámetros**: A pesar de tener un recuento de parámetros similar al MLP, esta CNN aprovecha los patrones espaciales a través de la convolución para lograr un mejor rendimiento.

- **Listo para inferencia**: El tamaño y la velocidad de este modelo lo hacen adecuado para aplicaciones ligeras y reconocimiento de dígitos en tiempo real.

Este modelo demuestra un punto óptimo: buena profundidad, tamaño de parámetros razonable y excelente precisión. Pero, ¿y si no nos importara el tamaño en absoluto y quisiéramos llevar el rendimiento aún más lejos?

Veamos en la siguiente sección.

## Modelo 4: StrongCNN — Una Potencia Convolucional Profunda

Hasta ahora, hemos examinado modelos que equilibran rendimiento y simplicidad. Pero, ¿qué pasaría si eliminamos las restricciones y nos enfocamos completamente en el rendimiento?

![](https://ucarecdn.com/416f3481-45ee-477e-b8bb-61f37902a46c/)

El `StrongCNN` es una arquitectura más profunda y expresiva que incorpora múltiples capas convolucionales, mayor recuento de canales y técnicas de regularización como `Dropout` para prevenir el sobreajuste. Se inspira en las mejores prácticas de modelos de visión más grandes, pero aún es lo suficientemente compacto como para entrenarse rápidamente en `MNIST`.

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

### Desglose de Arquitectura

Este modelo apila cuatro capas convolucionales en dos bloques, con un aumento en el conteo de filtros (32 → 64). Después de cada bloque:

- Aplicamos MaxPool2d(2) para reducir la resolución.
- Aplicamos Dropout para reducir el sobreajuste.
- Finalmente, las características se aplanan y se pasan a través de dos capas totalmente conectadas con una capa oculta de 128 neuronas y otro dropout.

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

Con casi **medio millón de parámetros**, este modelo eclipsa a los demás en capacidad. Pero vale la pena.

```
Strong CNN (467818 parameters)
Test Accuracy: 99.09% | Loss: 0.03 | Learning time: 75.0s
```

### Observaciones Clave

- **Precisión de primer nivel**: El StrongCNN alcanza una precisión de prueba del 99.09%, acercándose mucho al rendimiento humano en MNIST.

- **La regularización es importante**: Con esta cantidad de parámetros, el dropout es crucial para evitar el sobreajuste.

- **Costo del rendimiento**: El tiempo de entrenamiento es casi 3× el del MLP y 6× más parámetros que el CNN equilibrado.

Este modelo es excesivo para MNIST, pero ese es el punto. Ilustra hasta dónde puedes llegar cuando la precisión es el único objetivo.

## Resumen: Comparando los Cuatro Modelos

Terminemos con un resumen lado a lado:

| Modelo        | Parámetros | Precisión de Prueba | Pérdida | Tiempo de Entrenamiento |
| ------------- | ---------- |---------------------|---------|-------------------------|
| **MLP**       | 25,450     | 95.96%              | 0.14    | 8.7s                    |
| **TinyCNN**   | 4,266      | 97.96%              | 0.06    | 12.3s                   |
| **CNN**       | 26,698     | 98.22%              | 0.05    | 14.3s                   |
| **StrongCNN** | 467,818    | 99.09%              | 0.03    | 75.0s                   |


### Conclusión

Este experimento demuestra cómo las elecciones de arquitectura afectan el rendimiento en redes neuronales. Incluso para un conjunto de datos simple como MNIST:

- **MLPs** funcionan pero ignoran la estructura de la imagen.
- **CNNs** aprovechan las características espaciales para obtener mejores resultados.
- **La profundidad y el ancho** mejoran la precisión pero aumentan el costo de entrenamiento y el riesgo de sobreajuste.
- **La regularización** es esencial para redes más profundas.

Los modelos convolucionales superan a los MLPs no porque sean “más profundos” o “más sofisticados”, sino porque **entienden cómo funcionan las imágenes**.

Estos resultados reflejan tendencias más amplias observadas en la investigación [de vanguardia](https://paperswithcode.com/sota/image-classification-on-mnist):

- **Los modelos convolucionales** siguen siendo la columna vertebral de la clasificación de MNIST, ofreciendo fuertes sesgos inductivos para la estructura de la imagen.

- Técnicas como **dropout, aumento de datos** y **arquitecturas profundas** son clave para mejorar el rendimiento.

- Modelos más avanzados, como **redes de cápsulas, híbridos de transformadores** y **conjuntos**, han llevado la precisión más allá del **99.85%**, aunque estos métodos a menudo son excesivos para MNIST y requieren mucho más cómputo.

Nuestros experimentos reafirman que los CNNs no solo son más precisos que los MLPs, sino que también son más eficientes y están mejor adaptados a tareas basadas en imágenes. Mientras que los modelos SOTA continúan empujando los límites, nuestros modelos prácticos ya logran alta precisión con una fracción de la complejidad.

https://github.com/gustawdaniel/cnn-mnist
