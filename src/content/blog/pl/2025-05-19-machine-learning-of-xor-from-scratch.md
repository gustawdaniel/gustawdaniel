---
author: Daniel Gustaw
canonicalName: machine-learning-of-xor-from-scratch
coverImage: https://ucarecdn.com/19bf54c3-7109-4836-9dce-dbbfca11d7ed/-/preview/640x640/
description: Wprowadzenie do uczenia maszynowego na przykładzie problemu XOR. W artykule przedstawiamy, jak stworzyć model od podstaw, używając Pythona i NumPy.
excerpt: Wprowadzenie do uczenia maszynowego na przykładzie problemu XOR. W artykule przedstawiamy, jak stworzyć model od podstaw, używając Pythona i NumPy.
publishDate: 2025-05-19 00:00:00+00:00
slug: pl/machine-learning-of-xor-from-scratch
tags:
  - machine-learning
  - python
  - numpy
title: Uczenie maszynowe XOR od zera
updateDate: 2025-05-19 00:00:00+00:00
---

W tym artykule przeczytasz jak zbudować model AI od podstaw.

## XOR jako liniowa kombinacja klasyfikatorów liniowych

Przykład uczenia maszynowego to problem XOR.

**XOR** (exclusive OR) to funkcja logiczna, która zwraca wartość prawda (1), jeśli dokładnie jeden z jej argumentów jest
prawdziwy. W przeciwnym razie zwraca wartość fałsz (0). Problem XOR jest klasycznym przykładem problemu, który nie może
być rozwiązany przez liniowe modele klasyfikacji, takie jak regresja logistyczna. Dlatego jest często używany jako
przykład do nauki o sieciach neuronowych.

Można ją pokazać na tabelce logicznej:

| x | y | xor(x, y) |
|---|---|-----------|
| 0 | 0 | 0         |
| 0 | 1 | 1         |
| 1 | 0 | 1         |
| 1 | 1 | 0         |

albo na wykresie:

![](https://ucarecdn.com/572a9d0c-4d85-4891-8d2a-c12c5467c0ba/)

Dzięki temu 2 przedstawieniu widać, że można zbudować XOR z 2 klasyfikatorów liniowych.

![](https://ucarecdn.com/0037d1c8-79ad-412b-a557-d8992dd2f656/xor_linear_bernoulli_planes.svg)

Taki klasyfikator można interpretować jako przekształcenie, które bierze przestrzeń argumentów (u nas kwadrat
`[0,1] x [0,1]`) następnie przekształca go afinicznie (obraca, skaluje, przesuwa, odbija, ścina) a na końcu tworzy linię
graniczną między klasami `{0, 1}`. To znaczy, że dla branki `XOR` potrzeba 2 takich klasyfikatorów, bo na wykresie mamy
2 czarne linie graniczne.

## Sztuczny neuron to jeden klasyfikator liniowy

Operacja afiniczna może być zapisana jako:

$$
z = a x1 + b x2 + c, \quad z \in \mathbb{R}, \quad x1,x2 \in [0,1].
$$

gdzie `a` i `b` nazywa się wagami a `c` bajasem. Są to współczynniki, które można wyznaczyć w procesie uczenia.
Wygodniejszym zapisem jest postać wektorowa gdzie:

$$
z = w^T x + b, \quad w = [a, b]^T, \quad x = [x1, x2]^T.
$$

Ponieważ jednak składnie operacji liniowych daje operację liniową, to żeby wprowadzić nieliniowość, do neuronów dodaje
się funkcję aktywacji. Funkcja aktywacji to funkcja, która przekształca pobudzenie neuronu na wyjście neuronu. Może to
być dowolna funkcja nieliniowa, ale zwykle szukamy takiej która:

- łatwo się oblicza
- ma prostą pochodną
- pasuje do obrazu argumentów

W naszym przypadku:

$$
z \in \mathbb{R}, \quad f(z) \in [0,1].
$$

możemy wykorzystać funkcję aktywacji `sigmoid`:

$$
\sigma(z) = \frac{1}{1 + e^{-z}}, \quad z \in \mathbb{R}, \quad \text{Im}(\sigma) = (0, 1)
$$

która ma pochodną:

$$
\sigma'(z) = \sigma(z) (1 - \sigma(z)), \quad z \in \mathbb{R}.
$$

ponieważ

$$
\frac{d}{dz} \left( \frac{1}{1 + e^{-z}} \right)

= -\frac{1}{(1 + e^{-z})^2} \cdot (-e^{-z})

= \left( \frac{1}{1 + e^{-z}} \right) \cdot \left( \frac{e^{-z} + 1 - 1}{1 + e^{-z}} \right)
$$

nie jest to jednak jedyna możliwość. Można wykorzystać inne funkcje aktywacji, takie jak `tanh`, `ReLU`, `Leaky ReLU`
czy `ELU`. Wybór funkcji aktywacji zależy od konkretnego problemu i architektury sieci neuronowej.

Natomiast docenimy wybór funkcji `sigmoid`, kiedy zobaczymy, jak upraszcza wzory na pochodną funkcji straty względem
parametrów sieci.

## Funkcja straty sieci neuronowej

Strata jest miarą naszego niezadowolenia z działania modeu. Tak jak funckję aktywacji, można ją zdefiniować z dużą
dowolnością, ale zależy nam na tym, żeby:

- mierzyła jak model się myli
- była łatwa do obliczenia
- jej pochodna względem parametrów była łatwa do obliczenia

Argumentami funkcji straty są wartość wyjściowa modelu $\hat{y}$ i wartość wyjściowa danych treningowych $y$. Choć są to
dwie wartość w przedziałach `[0,1]`, to nie należy ich mylić z parą wartości wejściowych `x1` i `x2`. Żeby podkreślić tę
różnicę, wykresy poniżej mają inny kolor.

Zanim wprowadzimy funkcję straty, przyjrzyjmy się przykładowej funkcji zgodności.

$$
P(y | \hat{y}) = \hat{y}^y (1 - \hat{y})^{1 - y}, \quad y \in \{0,1\}.
$$

Jest to rozkład Bernoulliego: funkcjo o sidołowym kształcie o grzbiecie na prostej $y = \hat{y}$.

![](https://ucarecdn.com/80858d14-9c6b-4a86-865e-b8f0f414ab72/)

Możemy go nazwać miarą zgodności, ponieważ maksymalne wartości przyjmuje, kiedy nasz model przewiduje wartości $\hat{y}$
możliwie bliskie $y$.

Natomiast funkcja straty powinna mieć minima tam, gdzie funkcja zgodności ma maksima. Możemy to zarobić przez
inwersję: $1/P$, zmianę znaku $-P$, albo zadziałać innym przekształceniem, które przekształci maksima zgodności w minima
straty.

Ponownie mimo dużej dowolności, wybierzemy funkcję straty jako ujemny logarytm funkcji zgodności. Ten konkretny wybór
można uzasadnić tym, że pochodna tak określonej straty będzie bardzo łatwa do wyliczenia.

$$
\mathcal{L}_{\text{BCE}}(y, \hat{y}) = -\log(P(y | \hat{y}) )= -\left[ y \cdot \log(\hat{y}) + (1 - y) \cdot \log(1 - \hat{y}) \right]
$$

Ten wzór przedstawia `binary cross entropy` jako funkcję straty. Zobaczmy jak taka funkcja starty zależy od parametrów
modelu.

$$
\begin{aligned}
\text{Niech} \quad \hat{y} &= \sigma(z) = \frac{1}{1 + e^{-z}} \\[10pt]

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

Widzimy, że gradient straty jest naprawdę prosty do obliczenia i to pozwala nam przejść do praktycznej implementacji
sieci w kodzie.

## Implementacja uczenia XOR w Pythonie

Choć zwykle używa się do tego wyspecjalizowanych bibliotek jak `pytorch` lub `tensorflow`, tu skupimy się na pokazaniu
jak to zrobić bez nich, żeby lepiej zrozumieć poszczególne kroki. Zaczniemy od zdefiniowania funkcji, które omówiliśmy w
części teoretycznej:

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

Następnie podajemy dane treningowe, czyli przepisujemy tabelkę logiczną definiującą funkcję `XOR` której chcemy nauczyć
modelu.

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

Ustaliliśmy, że model będzie wymagał dwóch neuronów w warstwie ukrytej (dwie czarne linie na drugim wykresie) i jednego
na końcu, żeby dać jeden wynik.

![](https://ucarecdn.com/d9ea38bb-f8fd-4f9e-99fc-f3ff1941228e/)

Mamy więc następujące parametry:

```python
input_layer_neurons = 2
hidden_layer_neurons = 2
output_neurons = 1
learning_rate = 0.1
epochs = 10000
```

Ilość powtórzeń uczenia i jego szybkość wybraliśmy arbitralnie, ale to są ważne parametry, które optymalizuje się
zależnie od przypadku, który modelujemy.

Teraz wyznaczymy początkowe wartości wag. Ustalmy, że będą to wartości o rozkładzie normalnym z odchyleniem 1, ale
wrócimy do tego punktu, bo to jest coś, co można zrobić lepiej.

```python
hidden_weights = np.random.randn(input_layer_neurons, hidden_layer_neurons)
hidden_bias = np.random.randn(1, hidden_layer_neurons)
output_weights = np.random.randn(hidden_layer_neurons, output_neurons)
output_bias = np.random.randn(1, output_neurons)
```

Mając wszystkie potrzebne parametry, możemy rozpocząć uczenie.

```python
for epoch in range(epochs):
```

W pętli uczenia kolejno obliczamy wartości pobudzeń i wyników kolejnych warstw. Ta część nazywa się "Forward" i służy do
określenia, jakie przewidywania generuje model.

Druga część: "Backpropagation" to algorytm, który pozwala na zmianę parametrów w warstwach od ostatniej do pierwszej
tak, żeby w kolejnych krokach obniżać stratę.

Omówimy je linia po linii. Pierwszym krokiem jest przekształcenie wejść `x1` i `x2` nazywane w kodzie `inputs` w
aktywację neuronu `z` lub `hidden_input` a następnie w jego wyjście, czyli zastosowanie na nim funkcji `sigma`.

$$
h_i = w_h^T x + b_h \quad h_o = \sigma(h_i)
$$

```python
    # Forward
    hidden_input = np.dot(inputs, hidden_weights) + hidden_bias
    hidden_output = sigmoid(hidden_input)
```

Następnie składamy tą operację na kolejnej warstwie:

$$
f_i = w_o^T h_o + b_o \quad \hat{y} = \sigma(f_i)
$$

```python
    final_input = np.dot(hidden_output, output_weights) + output_bias
    predicted_output = sigmoid(final_input)
```

Następnie liczymy rozbieżność między przewidywaniem a rzeczywistą wartością. W tym przypadku jest to
`binary cross entropy`. Zapisujemy też jej pochodną względem aktywacji neuronu ostatniej warstwy.

$$
\mathtt{loss} = \mathcal{L}_{\mathrm{BCE}}(y, \hat{y}) \quad \mathtt{d\_predicted\_output} = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i}
$$

```python
    loss = binary_cross_entropy(expected_output, predicted_output)
    d_predicted_output = binary_cross_entropy_derivative(expected_output, predicted_output)
```

Teraz możemy wrócić od ostatniej do pierwszej warstwy, aktualizując parametry sieci.

W ostatniej warstwie mamy już pochodną względem aktywacji, więc zmiany parametrów to odpowiednio:

$$
\Delta w_o = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot \frac{df_i}{dw_o} = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot h_o \quad \Delta b_o = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i}
$$

Powinniśmy tylko zadbać o zgodność wymiarów przy mnożeniu.

| variable           | shape  |
|--------------------|--------|
| hidden_output      | (4, 2) |
| d_predicted_output | (4, 1) |
| output_weights     | (2, 1) |
| output_bias        | (1, 1) |

Wartość `4` to ilość próbek ze zbioru uczącego, natomiast `2` to ilość wejść do ostatniej warstwy. Chcemy wyeliminować wymiar `4` dlatego robimy następujące mnożenia i transpozycje:

```python
    # Backprop
    output_weights -= hidden_output.T.dot(d_predicted_output) * learning_rate
    output_bias -= np.sum(d_predicted_output, axis=0, keepdims=True) * learning_rate
```

W kolejnym kroku przechodzimy przez warstwę ukrytą. 

$$
\Delta w_h = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot \frac{df_i}{dh_o} \cdot \frac{dh_o}{dh_i} \cdot \frac{dh_i}{dw_h} = \\[10pt] = \mathtt{d\_predicted\_output} \cdot w_o^T \cdot \sigma'(h_o) * x  \\[20pt]

\Delta b_h = \frac{d\mathcal{L}_{\mathrm{BCE}}}{df_i} \cdot \frac{df_i}{dh_o} \cdot \frac{dh_o}{dh_i} \cdot \frac{dh_i}{db_h} = \\[10pt] = \mathtt{d\_predicted\_output} \cdot w_o^T \cdot \sigma'(h_o) 
$$

zapisujemy te wzory w kodzie ponownie dbając o zgodność wymiarów.

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

Po zakończeniu pętli możemy zobaczyć przewidywania sieci.

```python
print("Predicted Output:")
print(predicted_output.round(3))
```

Widzimy, skutecznie przewiduje XOR.

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

Tu moglibyśmy skończyć, ale tak naprawdę zbudowanie pierwszego działającego modelu to zwykle dopiero początek zabawy z sieciami neuronowymi, ponieważ teraz możemy zacząć szukać obszarów do ulepszeń.

## Optymalizacja początkowego rozkładu wag

Losując początkowe wagi, wspomniałem, że to da się zrobić lepiej. 
Choć są one skoncentrowane wokół zera, tam gdzie funkcja `sigma` ma 
najwyższą zmienność, to ich odchylenie standardowe zostało wybrane arbitralnie jako 1. 
Zobaczmy się, co by się stało, gdybyśmy je zmieniali.

Załóżmy, że odchylenie standardowe początkowych wag jest bardzo małe. Choć funkcja `sigma` ma maksymalną pochodną
właśnie wokół zera, to licząc zmianę wag, musimy uśrednić ją względem całego zbioru uczącego.

Nasze dane uczące mają symetrię, przez którą czynniki proporcjonalne do gradientów podczas wyliczania zmian wag występują z przeciwnymi znakami i znoszą się nawzajem. Wykonując rozwinięcie szeregu Taylora funkcji `sigma` możemy zobaczyć, że jedynie elementy proporcjonalne do samych wag a właściwie to ich różnic nie znoszą się w równaniach na zmianę wag.

Możemy więc wyciągnąć wniosek, że ewolucja wag dla bardzo małych początkowych odchyleń standardowych będzie przebiegać jak funkcja kwadratowa, co znaczy, że wystarczająco małe wariancje wag będą opóźniać proces rozpoczęcia optymalnego uczenia.

Możemy to zaobserwować na wykresie, na którym początkowe wagi skoncentrowane wokół zera praktycznie nie zmieniają się przez 2000 pierwszych cykli uczenia. Dopiero wtedy następuje szybka ewolucja wag i po kolejnych 2000 cykli ustabilizowanie w stabilnym zbieganiu do optimum.

![](https://ucarecdn.com/c502d3f7-0134-4208-91b9-4e30ad8fa349/)

Z drugiej strony zbyt wysokie wagi początkowe prowadzą do tego, że początkowa zmienność wag jest wysoka, ale często może następować w nieodpowiednim kierunku. Widzimy to na wykresie, w którym wagi nie zbiegają do optymalnych wartości jednostajnie (szczególnie początkowo).

![](https://ucarecdn.com/aaee8705-9eba-4196-9455-16b8f11f34cc/)

Zmierzmy więc, jak dokładnie szybkość uczenia zależy od początkowego odchylenia standardowego wag.

W tym celu wprowadzamy funkcję inicjalizującą wagi:

```python
def init_params(hidden_std_dev = 1, output_std_dev = 1):
    hidden_weights = np.random.randn(input_layer_neurons, hidden_layer_neurons) * hidden_std_dev
    hidden_bias = np.random.randn(1, hidden_layer_neurons) * hidden_std_dev
    output_weights = np.random.randn(hidden_layer_neurons, output_neurons) * output_std_dev
    output_bias = np.random.randn(1, output_neurons) * output_std_dev
    return hidden_weights, hidden_bias, output_weights, output_bias
```

Cały proces uczenia zamykamy w funkcji `train`, która jest teraz zależna od początkowych odchyleń parametrów 

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

Zwraca ona łączną stratę ze wszystkich kroków uczenia. Dzięki temu możemy się spodziewać, że jeśli uczenie się nie powiedzie, to dla losowej sieci suma strat będzie równa $N * T * \mathcal{L}_{\text{BCE}}(\hat{y} \sim \mathcal{U}(0,1), y)$, gdzie $\mathcal{L}_{BCE}$ to funkcja `binary cross entropy`, `T = 10,000` to długość uczenia, a `N = 4` to ilość przykładów w zbiorze uczącym. Łącznie maksymalne oszacowanie wynosi $-4 * 10^4 * \log(0.5)$ czyli `27,000`.

Chcemy znaleźć wykres straty od odchylenia standardowego parametrów, ale pojedyńczy pomiar jest dość niestabilny, ponieważ w ramach utrzymywania tej samej początkowej wariancji parametrów, uczenie może pójść różnie i czasami nie prowadzi do bliskiej zera straty nawet po 10 tysiącach kroków.

Dlatego właśnie będziemy zapisywać wyniki pomiarów do bazy i powtarzać je wielokrotnie. Pomoże nam w tym funkcja `train_n_times`.

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

Ta funkcja wykonuje trening `n` razy dla danych odchyleń i zapisuje wyniki do kolekcji w bazie `mongodb`.

Następnie ustalamy, na jakich wartościach chcemy wykonać pomiary. Przyjmijmy, że chcemy sprawdzić jedynie wariancję warstwy ukrytej,
zakładając stałą wariancję dla warstwy wyjściowej. Co więcej, nie chcemy rozkładać punktów pomiarowych liniowo, ponieważ bardziej 
wartościowa jest gęsta informacja w okolicach zera, a między większymi wartościami możemy pozostawić większe odstępy.

Dlatego rozpinamy naszą przestrzeń pomiarów na `n = 400` punktów, rozłożonych z wykładniczo spadającą gęstością.

```python
import numpy as np

n = 400
exp_values = np.exp(np.linspace(-3, 4, n))
```

Następnym krokiem będzie włączenie obliczeń. Żeby można było to zrobić na wielu rdzeniach jednocześnie użyjemy `concurent.futures`.

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

są różne strategie zrównoleglania, ale rozpinając zmiany wątków na sekwencjach wielu symulacji sieci, możemy uzyskać lepszą wydajność niż gdybyśmy każdą symulację przetwarzali w osobnym wątku. Jest tak dlatego, że tworzenie i zakańczanie wątku, tak jak połączenia z bazą zajmuje czas.

![](https://ucarecdn.com/dd2bebbf-6cbe-41a2-a54b-9e01565a34e0/)

Widzimy, że odchylenie wartości pomiarów jest na tyle duże, że wymaga podniesienia ilości pomiarów. Możemy w kolejnych krokach aplikować pomiary proporcjonalnie do relatywnego błędu pomiarowego. Żeby to zrobić, możemy pobrać dane z naszej kolekcji.

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

a następnie wyciągnąć wszystkie statystyczne cechy pomiarów:

```python
x = summary["hidden_std_dev"].to_numpy()
means = summary["mean"].to_numpy()
count = summary["count"].to_numpy()
errors = summary["std"].to_numpy() / np.sqrt(count)
```

Po wykonaniu 4 milionów symulacji efekt wygląda tak:

![](https://ucarecdn.com/4ff08abf-2e9d-4b77-a49d-ebe9144b2018/)

Czarna linia to `1/sqrt(2)` czyli przewidywanie wynikające z modelu Xaviera (Glorota). Zielona to minimum.

Z pomiarów widzimy, że ustalenie odchylenia rozkładu na `1/sqrt(2)` zamiast `1` poprawia zbieżność uczenia o `8.5%`, a zmieniając odchylenie na `0.6` zyskujemy kolejne `1.1%`.

Poświęciliśmy temu stosunkowo dużo miejsca, ale to jest tylko pierwszy z brzegu element, który możemy optymalizować w procesie uczenia.

Kolejnymi są:
- funkcja straty
- funkcja aktywacji
- szybkość uczenia (która nie musi być stała)

Tych parametrów jest znacznie więcej i w kolejnych artykułach będziemy je odkrywać na przykładach prostych sieci jak ta, żeby lepiej je zrozumieć i zbudować wokół nich intuicję pozwalającą na budowę większych projektów.