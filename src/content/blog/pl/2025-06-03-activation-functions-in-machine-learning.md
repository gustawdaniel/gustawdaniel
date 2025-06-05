---
author: Daniel Gustaw
canonicalName: activation-functions-in-machine-learning
coverImage: https://ucarecdn.com/43dafac9-01f5-4ff2-a101-20d0a8670bd5/-/preview/1000x1000/
description: Badamy różne funkcje aktywacji, ich cechy oraz ich wpływ na wydajność modeli uczenia maszynowego.
excerpt: Badamy różne funkcje aktywacji, ich cechy oraz ich wpływ na wydajność modeli uczenia maszynowego.
publishDate: 2025-06-04 00:00:00+00:00
slug: pl/funkcje-aktywacji-w-uczeniu-maszynowym
tags:
- machine-learning
- python
- numpy
title: Funkcje aktywacji w uczeniu maszynowym
updateDate: 2025-06-04 00:00:00+00:00
---

Funkcje aktywacji są sercem każdej sieci neuronowej, decydując, jak sygnały propagują się i oddziałują przez warstwy. W tym poście zbadamy i porównamy kilka popularnych funkcji aktywacji, korzystając z minimalnej sieci neuronowej na sztucznym zbiorze danych.

Skoncentrujemy się na tym, jak szybko każda funkcja pomaga sieci zbiec się - i jak dobrze radzi sobie w zadaniu klasyfikacji binarnej z nieliniową granicą decyzyjną.

## Ustawienie problemu

Symulujemy proste zadanie klasyfikacji 2D:

- Generujemy `1000` losowych punktów `2D` z rozkładu Gaussa.
- Oznaczamy każdy punkt jako `1`, jeśli leży wewnątrz jednostkowego okręgu, a jako `0` w przeciwnym razie.

Tworzy to nieliniowo separowalny zbiór danych, idealny do testowania funkcji aktywacji.

```python
import torch
import numpy as np

N = 1000
x = torch.randn(N, 2) * (1 / np.sqrt(2 * np.log(2)))
y = ((x[:, 0]**2 + x[:, 1]**2) < 1).float().unsqueeze(1)
```

Współczynnik $1 / \sqrt{2 \log 2}$ zapewnia, że połowa punktów znajduje się wewnątrz okręgu jednostkowego, a połowa na zewnątrz:

$$
\lim_{N \to \infty} \frac{1}{N} \sum_{i=1}^{N} \mathbb{1}_{\{x_{i0}^2 + x_{i1}^2 < 1\}} = \mathbb{P}(x_0^2 + x_1^2 < 1) = \frac{1}{2}
$$

Chcemy obliczyć prawdopodobieństwo:

$$
\mathbb{P}(x_0^2 + x_1^2 < 1) \quad x \sim \mathcal{N}(0, c^2)
$$


To jest równoważne obliczeniu:

$$
\int \int_{x^2 + y^2 \leq 1} \frac{1}{2\pi c^2} e^{-\frac{x^2 + y^2}{2c^2}} \, dx \, dy
$$

Przechodząc do układów biegunowych:

$$
\int_{0}^{2\pi} \int_{0}^{1} \frac{1}{2\pi c^2} e^{-\frac{r^2}{2c^2}} \cdot r \, dr \, d\theta
$$

Rozdzielając całki:

$$
\int_{0}^{2\pi} \frac{1}{2\pi} \, d\theta = 1
$$

Pozostała część:

$$
\int_{0}^{1} \frac{1}{c^2} r e^{-\frac{r^2}{2c^2}} \, dr
$$

Obliczmy tę całkę używając podstawienia $u=\frac{r^2}{2 c^2}, \quad du=\frac{r}{c^2} dr$, więc:

$$
\int_{u = 0}^{\frac{1}{2c^2}} e^{-u} \, du = 1 - e^{-1/(2c^2)}
$$

Tak więc, ostateczny wynik to:

$$
\mathbb{P}(x_0^2 + x_1^2 < 1) = 1 - e^{-1/(2c^2)}
$$

Teraz, aby znaleźć $c$, tak aby to prawdopodobieństwo wynosiło $\frac{1}{2}$:

$$
1 - e^{-1/(2c^2)} = \frac{1}{2}
\quad \Rightarrow \quad
e^{-1/(2c^2)} = \frac{1}{2}
\quad \Rightarrow \quad \newline
\frac{1}{2c^2} = \log 2
\quad \Rightarrow \quad
c = \frac{1}{\sqrt{2 \log 2}}
$$

## Architektura Modelu

Używamy małej sieci neuronowej typu feedforward o następującej strukturze:

- Warstwa wejściowa: 2 neurony (dla danych 2D)

- Warstwy ukryte: [16, 8] neuronów

- Wyjście: 1 neuron do klasyfikacji binarnej (z `BCEWithLogitsLoss`)

Każda warstwa ukryta jest następnie zakończona funkcją aktywacji, którą chcemy przetestować.

```python
import torch.nn as nn

def build_model(activation, layers=[2, 16, 8, 1]):
    layers_out = []
    for i in range(len(layers) - 2):
        layers_out += [nn.Linear(layers[i], layers[i+1]), activation()]
    layers_out += [nn.Linear(layers[-2], layers[-1])]
    return nn.Sequential(*layers_out)
```

## Szkolenie i pomiar

Aby wytrenować model, musimy wybrać funkcję straty, optymalizator i liczbę kroków. Możemy to opakować w funkcję, która zwróci serię czasu uczenia i straty, co będzie przydatne do wizualizacji wydajności funkcji aktywacji.

Możemy wybrać właściwości szkolenia:
- **Funkcja straty**: `BCEWithLogitsLoss` (numerycznie stabilna dla klasyfikacji binarnej)
- **Optymalizator**: Adam z szybkością uczenia `0.01`
- **Epoki**: 2000 kroków
- Rejestrujemy **stratę** w stosunku do **czasu**, aby zobaczyć, które aktywacje konwergują najszybciej.

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

Zdecydowaliśmy się użyć optymalizatora `Adam`, który często jest wybierany, ponieważ łączy mocne strony dwóch popularnych optymalizatorów: `AdaGrad` i `RMSProp` i dobrze działa od razu na wielu problemach.

Aby wytrenować model, możemy wywołać funkcję `train_timed` z naszym modelem i pewnymi parametrami.

```python
model = build_model(nn.ReLU)
t, l = train_timed(model, 'ReLU')
```

Naszym celem jest porównanie różnych funkcji aktywacji, ale teraz spójrzmy, jak model przewiduje kształt używając punktów treningowych.

## Wizualizacja predykcji modelu

Zobaczmy wizualizację predykcji modelu za pomocą kodu

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

## Porównajmy funkcje aktywacji

Porównujemy następujące funkcje aktywacji:

| Nazwa       | Opis                                                                          |
| ----------- | ----------------------------------------------------------------------------- |
| `ReLU`      | Szybka i skuteczna, ale może „umrzeć” na ujemnych danych wejściowych (gradient równy zeru).  |
| `Tanh`      | Gładka, o zerowym środku, ale nasyca dla dużych wartości (zanikające gradienty).   |
| `LeakyReLU` | Wariant ReLU pozwalający na mały gradient przy ujemnych danych wejściowych.       |
| `Sigmoid`   | Wyjścia między 0 a 1; cierpi na zanikające gradienty.                          |
| `ELU`       | Jak ReLU, ale gładsza i może zwracać wartości ujemne, poprawiając uczenie.     |
| `SiLU`      | Znana również jako Swish; gładka i nien monotoniczna; sprzyja lepszemu uogólnieniu. |
| `GELU`      | Oparta na rozkładzie Gaussa; gładka i probabilistyczna, popularna w Transformerach. |
| `Softplus`  | Gładkie przybliżenie ReLU; zawsze różniczkowalna, ale droższa.                 |

Możemy porównać te wykresy za pomocą kodu, który stworzy siatkę funkcji aktywacji.

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

## Pojedyncze szkolenie to za mało

Naivnym podejściem jest po prostu przetrenowanie każdego modelu z daną funkcją aktywacji i porównanie wyników:

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

Chociaż możemy dostrzec ogromną przewagę `LeakyReLU` przy pierwszym uruchomieniu:

![](https://ucarecdn.com/2324479e-dfae-4119-81aa-cd3cc953c06e/)

Wywołując ten sam kod po raz drugi, widzimy, że wyniki są różne:

![](https://ucarecdn.com/34e55503-493b-42c6-8169-8014dd862d96/)

Szczególnie, że wydajność `GELU` jest znacznie lepsza. Oznacza to, że aby naprawdę porównać te funkcje, musimy przeprowadzić te symulacje wiele razy, ale przed tym chciałbym pokazać, co może się stać, gdy będziemy trenować trochę dłużej.

![](https://ucarecdn.com/e598dd94-5c94-4f90-8fe8-771e44eb7d0d/)

Tam możesz zobaczyć, że początkowo wolniejszy `Tanh` był bardziej stabilny w długim okresie czasu, ale `LeakyReLU` całkowicie zawiodło. Prezentuję te wykresy, ale musisz być świadomy, że to tylko pojedyncze wyniki uczenia się i aby wyciągnąć jakiekolwiek wartościowe wnioski, musimy przeprowadzić je wiele razy.

Jednak widzimy, że pojedynczy przebieg daje nam dynamikę uczenia się, która nie może być przecięta w żadnym dowolnie wybranym punkcie, ponieważ pozycja w rankingach może się zmieniać w zależności od czasu treningu.

Z tego powodu zapiszemy do bazy danych wszystkie zmierzone straty w obiektach takich jak ten:

```json
{
  "name": "ReLU",
  "time": 1.54,
  "loss": 0.02,
  "epoch": 2000
}
```

W następnym akapicie dodamy zapisywanie wyników do bazy danych i uruchomimy symulacje wiele razy.

## Uruchamianie wielu symulacji

Dodajmy tablicę `steps` do wyjścia funkcji `train_timed`.

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

Następnie możemy zbudować wrapper, który zapisuje wyniki do bazy danych MongoDB i umożliwia wiele uruchomień:

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

a na końcu wywołaj funkcję `train_n_times`, aby uruchomić trening dla wszystkich funkcji aktywacji wielokrotnie.

```python
train_n_times(1000, 0.01, 2000)
```

## Analiza wyników (według epok)

Teraz wyodrębnijmy wyniki z bazy danych `mongo` i je wykreślmy.

Aby uprościć, możemy użyć epok jako osi x zamiast czasu. Pierwsza część kodu pobiera dane i organizuje je w `DataFrame` dla każdej funkcji aktywacji.

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

Druga część odpowiada za rysowanie.

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

Możemy sprawdzić stratę za ostatnią epokę dla każdej funkcji aktywacji:

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

Wyniki:

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

## Analiza w czasie

Aby narysować krzywe uczenia w czasie, musimy przekształcić pomiary czasu w postaci zmiennoprzecinkowej na przedziały o stałej wielkości.

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

Dzięki tej technice możemy tworzyć wykresy krzywych uczenia w czasie.

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

## Wnioski

Warto porównać nasze wyniki z pracą, która zawiera znacznie więcej podsumowań benchmarków [**Funkcje aktywacyjne w uczeniu głębokim: kompleksowy przegląd i benchmark**](https://arxiv.org/pdf/2109.14545).

Chociaż w moim benchmarku `LeakyReLU` jest najlepszy, w pracy stwierdzono, że to zależy od przypadku użycia, zestawu danych i złożoności sieci. Podsumuję wnioski z tej pracy i porównam je z naszymi wynikami.

### 1. Nie ma uniwersalnego zwycięzcy

   Żadna pojedyncza funkcja aktywacyjna nie dominuje we wszystkich zestawach danych i modelach.

   Niektóre funkcje (jak Swish i Mish) działają dobrze w sposób konsekwentny, ale nie zawsze są najlepsze w każdym scenariuszu.

> Wybieraj funkcje AF w oparciu o swój model i zestaw danych — nie ślepo.

### 2. ReLU wciąż jest silny

   Mimo że jest stara i prosta, ReLU pozostaje konkurencyjna w wielu zadaniach.

   Działa szczególnie dobrze w głębszych sieciach (jak CNN) i dużych zestawach danych.

> Zaczynaj od ReLU. To silny domyślny wybór.

### 3. Swish, Mish i GELU wyróżniają się

   To gładkie, nieliniowe i adaptacyjne funkcje.

   Przewyższają ReLU w niektórych zadaniach — szczególnie na bardziej złożonych zestawach danych lub głębszych sieciach.

   - Swish: $x⋅\sigma(x)$

   - Mish: $x⋅\tanh(\ln(1+ex))$

   - GELU: Gaussian Error Linear Unit

> Wypróbuj je, gdy dokładność treningu osiądzie lub gradienty znikną.

### 4. Leaky/Parametric ReLU pomaga w przypadku rzadkich gradientów

   Warianty takie jak Leaky ReLU i PReLU rozwiązują problem "umierającego neuronu" w ReLU.

   Szczególnie przydatne w mniejszych zestawach danych, gdzie neurony mogą stać się nieaktywne.

> Użyj tych, gdy części Twojej sieci milkną.

### 5. Sigmoid/Tanh działają słabo w głębokich sieciach

   Powodują znikające gradienty i łatwo się nasycają.

   W głębokich modelach mają tendencję do spowalniania treningu i pogarszania wydajności.

> Unikaj sigmoid/tanh, chyba że pracujesz w płytkich lub starych modelach (np. starych RNN).

### 6. Koszt obliczeniowy ma znaczenie

   Wyszukane aktywacje, takie jak Mish i GELU, są cięższe do obliczeń niż ReLU.

   Na urządzeniach mobilnych lub brzegowych, ReLU może być preferowane ze względu na szybkość i efektywność.

> Zrównoważ wydajność i koszt obliczeniowy w zależności od celu wdrożenia.

---

W naszej sytuacji możemy faktycznie potwierdzić złe wyniki `tanh` i `sigmoid`. Zwycięzcy:
- LeakyReLU
- GELU
- ELU
- SiLU

są tylko modyfikacjami `ReLU`, które są zalecane jako remedium na problem "umierających neuronów" lub dla małych zestawów danych.

Wydaje się, że to jest nasz przypadek, ponieważ `1000` punktów można uznać za małe, więc gładsze wersje `ReLU` w tym przypadku są rzeczywiście lepsze, co potwierdzają wyniki z analizowanej publikacji.

Dobrą praktyką wydaje się zaczynanie od `ReLU` i próbowanie innych funkcji później, jeśli mamy wystarczająco dużo czasu na trening i eksperymenty.
