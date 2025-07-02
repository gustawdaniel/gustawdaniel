---
author: Daniel Gustaw
canonicalName: mlp-cnn-mnist
coverImage: https://ucarecdn.com/4e2e19a5-ad94-44f4-bc3f-5e53bc395ccb/-/crop/1024x512/0,0/
description: Budujemy i porównujemy cztery architektury sieci neuronowych w PyTorch, wizualizujemy wydajność, badamy złożoność w porównaniu do dokładności i pokazujemy, dlaczego CNN-y są najlepsze w klasyfikacji obrazów.
excerpt: Budujemy i porównujemy cztery architektury sieci neuronowych w PyTorch, wizualizujemy wydajność, badamy złożoność w porównaniu do dokładności i pokazujemy, dlaczego CNN-y są najlepsze w klasyfikacji obrazów.
publishDate: 2025-06-09 00:00:00+00:00
slug: pl/mlp-cnn-mnist
tags:
- mlp
- cnn
- mnist
- pytorch
title: Od MLP do CNN. Sieci neuronowe do rozpoznawania cyfr MNIST
updateDate: 2025-06-09 00:00:00+00:00
---

## Wprowadzenie

Zbiór danych **MNIST** to klasyczny punkt odniesienia w sztucznej inteligencji, składający się z 70 000 grayscale obrazów ręcznie pisanych cyfr (28×28 pikseli). Jest wystarczająco mały, aby szybko trenować, ale wystarczająco złożony, aby ujawniać różnice w wydajności modeli—idealny do eksperymentów z sieciami neuronowymi.

Podczas gdy **Wielowarstwowe Perceptrony** (MLP) mogą technicznie klasyfikować dane obrazowe, traktują piksele jako płaskie wektory, ignorując wzorce przestrzenne. **Konwolucyjne Sieci Neuronowe** (CNN), z drugiej strony, są zaprojektowane do wykorzystania lokalnych struktur w obrazach—krawędzi, krzywych, tekstur—co czyni je znacznie bardziej efektywnymi w zadaniach wizualnych.

W tym wpisie porównam cztery architektury: prosty MLP, minimalny TinyCNN, zbalansowany CNN oraz cięższy StrongCNN. Przyjrzymy się dokładności, czasowi treningu oraz liczbie parametrów, aby zrozumieć kompromisy.

## Przygotowanie danych

Jak wspomniano wcześniej, korzystamy ze zbioru danych **MNIST**, dostępnego wygodnie przez `torchvision.datasets`. W zaledwie kilku linijkach kodu pobieramy i ładujemy dane, stosujemy podstawową transformację i przygotowujemy je do treningu:

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

Jedynym krokiem przetwarzania wstępnego tutaj jest `transforms.ToTensor()`, który konwertuje każde zdjęcie na tensor PyTorch i normalizuje jego wartości pikseli do zakresu `[0.0, 1.0]`.

```python
from torch.utils.data import DataLoader

BATCH_SIZE = 64

train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True)
test_loader = DataLoader(test_data, batch_size=BATCH_SIZE)
```

Tasowanie danych treningowych unika zapamiętywania kolejności cyfr. Dla zestawu testowego pomijamy tasowanie, ale nadal używamy pakowania dla efektywności.

Możemy wyświetlić kilka przykładowych obrazów, aby zwizualizować zestaw danych:

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

## Trening i Ocena

Teraz, gdy nasze dane są gotowe, czas nauczyć nasze modele czytać ręcznie napisane cyfry. Aby to zrobić, definiujemy
standardową pętlę treningową i oceny, używając idiomatycznej struktury PyTorch. Będziemy również śledzić złożoność modelu za pomocą
prostej licznika parametrów — przydatne podczas porównywania różnych architektur.

### Ustawienia Urządzenia i Epoki

Najpierw sprawdzamy, czy dostępny jest GPU. Jeśli tak, trening odbędzie się na CUDA; w przeciwnym razie korzystamy z CPU. 
Ustawiamy też rozsądny czas trwania treningu:

```python
import torch

EPOCHS = 5
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

Pięć epok może nie brzmieć jak dużo, ale na MNIST często wystarcza, aby uzyskać zaskakująco dobre wyniki — nawet z podstawowymi modelami.

### Pętla treningowa

Oto nasza funkcja `train()`. To najbardziej standardowy kod: ustawienie modelu w trybie treningowym, pętla po partiach, obliczenie straty i aktualizacja wag.

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

Ta funkcja nic nie zwraca—po prostu aktualizuje wewnętrzne parametry modelu. Podczas treningu nie zależy nam jeszcze na dokładności. Sprawdzimy to później.

### Pętla ewaluacyjna

Po treningu oceniamy na zbiorze testowym. Model jest ustawiony w tryb `eval()`, gradienty są wyłączone, a my zbieramy dwa metryki: dokładność i średnią stratę krzyżową.

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

Zauważ, że obliczamy średnią stratę dla partii — a nie pojedynczych przykładów. To dobre zrównoważenie między śledzeniem wydajności a prostotą.

### Liczba parametrów

Zanim porównamy architektury, warto wiedzieć, ile trenowalnych parametrów ma każda z nich. To małe narzędzie daje nam ich liczbę:

```python
def count_params(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
```

Spoiler: `StrongCNN` ma ponad `450,000` parametrów, podczas gdy `TinyCNN` radzi sobie z tylko kilkoma tysiącami. To ogromna różnica — i świetny punkt wyjścia do głębszej analizy.

### Uruchamiacz eksperymentów

Na koniec łączymy wszystko w jedną funkcję, która trenuje model, mierzy czas procesu, ocenia na zbiorze testowym i drukuje krótkie podsumowanie:

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

Ta struktura jest wystarczająco elastyczna, aby działać z każdą klasą modelu, którą przekażesz — od prostych MLP po głębokie potwory konwolucyjne.

W następnej sekcji zdefiniujemy i przeanalizujemy cztery architektury: `MLP`, `TinyCNN`, `CNN` i `StrongCNN`.

## Model 1: Perceptron wielowarstwowy (MLP)

Najprostsza architektura, którą rozważamy, to klasyczny Perceptron wielowarstwowy (MLP). Traktuje każdy obraz 28×28 jako płaski wektor 784 pikseli, ignorując strukturę przestrzenną, ale wciąż zdolny do uczenia się użytecznych cech poprzez warstwy w pełni połączone.

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

### Wyjaśnienie

- **Flatten** przekształca 2-wymiarowy obraz wejściowy w 1-wymiarowy wektor.
- Pierwsza warstwa **Linear** projektuje ten wektor wejściowy w 32-wymiarową przestrzeń ukrytą.
- Aktywacja **ReLU** wprowadza nieliniowość, aby nauczyć się złożonych wzorców.
- Ostatnia warstwa **Linear** generuje logity dla 10 klas cyfr.

Ten mały MLP ma stosunkowo niewiele parametrów i szybko się uczy, ale nie uchwyca relacji przestrzennych
między pikselami, co ogranicza jego dokładność w przypadku danych obrazowych. 

Wywoływanie

```python
run_experiment(MLP, "MLP")
```

powinieneś zobaczyć:

```
MLP (25450 parameters)
Test Accuracy: 95.96% | Loss: 0.14 | Learning time: 8.7s
```

To będzie nasz punkt odniesienia do porównania modeli `cnn`.

## Model 2: TinyCNN — Minimalna Konwolucyjna Sieć Neuronowa

Następnie przedstawiamy prostą architekturę TinyCNN, która wykorzystuje warstwy konwolucyjne do uchwycenia wzorców przestrzennych w obrazach. Ten model jest lekki, ale znacznie potężniejszy niż MLP w zadaniach związanych z obrazami.

Poniższy rysunek ilustruje architekturę TinyCNN:

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

### Przegląd architektury

- Sieć rozpoczyna się od warstwy konwolucyjnej, która przekształca dane wejściowe z 1 kanału do 4 kanałów, zachowując wymiary przestrzenne dzięki paddingowi.
- Aktywacja **ReLU** dodaje nieliniowości.
- **MaxPooling** zmniejsza rozmiar przestrzenny o połowę do 14×14, co redukuje koszty obliczeniowe i zapewnia inwarancję przestrzenną.
- Druga konwolucja rozszerza mapy cech z 4 do 8 kanałów.
- Kolejna ReLU i max-pooling zmniejszają rozmiar mapy cech do 7×7.
- Na koniec cechy są spłaszczane i przekazywane bezpośrednio do warstwy liniowej, która generuje logity dla 10 klas cyfr.

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

Czasami `cnn` są przedstawiane graficznie jako następujący proces:

![](https://ucarecdn.com/49c9ba4e-3a99-441c-8255-ecde041531a4/-/preview/865x173/)

Najciekawsze jest to, że uzyskujemy lepsze wyniki niż `mlp` mając tylko `4266` parametrów zamiast `25450`.

```
Tiny CNN (4266 parameters)
Test Accuracy: 97.96% | Loss: 0.06 | Learning time: 12.3s
```

Z mniejszą siecią o kilka razy możemy oczekiwać połowy błędów w porównaniu do poprzedniego modelu.

Sprawdźmy, jak nasza sieć poprawiłaby się, gdybyśmy utrzymali podobną liczbę parametrów jak w oryginalnym MLP.

## Model 3: CNN — Zrównoważona Konwolucyjna Sieć Neuronowa

Teraz, gdy zobaczyliśmy, co może zrobić minimalny model konwolucyjny, zwiększmy nieco skalę.

![](https://ucarecdn.com/f4949a96-b88c-44bd-a584-596deb7a5967/)

Model **CNN** poniżej został zaprojektowany w celu utrzymania zrównoważonego kompromisu między liczbą parametrów a wydajnością. Rozszerza możliwości ekstrakcji cech `TinyCNN`, wykorzystując więcej filtrów i ukrytą warstwę liniową przed ostatecznym wyjściem.

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

### Podział Architektury

W porównaniu do `TinyCNN`, ten model:

- Podwaja liczbę filtrów konwolucyjnych (8 → 16), co pozwala na uchwycenie bogatszych wzorców wizualnych.
- Dodaje **ukrytą warstwę w pełni połączoną** z 32 neuronami przed wyjściem. Ta dodatkowa warstwa poprawia zdolność modelu do łączenia wyodrębnionych cech przed dokonaniem ostatecznej klasyfikacji.
- Nadal korzysta tylko z dwóch warstw konwolucyjnych i dwóch warstw poolingowych, co sprawia, że model jest stosunkowo lekki i szybki.

W poniższej tabeli znajdują się wszystkie warstwy, kształty wyjścia i parametry bez wymiaru wsadowego:


| Warstwa            | Kształt Wyjścia | Parametry  |
|--------------------|-----------------|------------|
| Conv2d (1→8, 3×3)  | 8×28×28         | 80         |
| ReLU               | 8×28×28         | 0          |
| MaxPool2d          | 8×14×14         | 0          |
| Conv2d (8→16, 3×3) | 16×14×14        | 1,168      |
| ReLU               | 16×14×14        | 0          |
| MaxPool2d          | 16×7×7          | 0          |
| Flatten            | 784             | 0          |
| Linear (784 → 32)  | 32              | 25,120     |
| ReLU               | 32              | 0          |
| Linear (32 → 10)   | 10              | 330        |
| **Razem**          | —               | **26,698** |

![](https://ucarecdn.com/1130eea0-13da-44cb-a7b1-86f44789054f/-/preview/1000x170/)

Z 26,698 parametrami, ten `CNN` ma rozmiar porównywalny z `MLP` (25,450), ale jest znacznie potężniejszy.

```
CNN (26698 parameters)
Test Accuracy: 98.22% | Loss: 0.05 | Learning time: 14.3s
```

### Kluczowe obserwacje

- **Zwiększenie dokładności**: Model skacze do **98.22%** dokładności, poprawiając wyniki zarówno w porównaniu do `MLP`, jak i `TinyCNN`.

- **Efektywność parametrów**: Pomimo podobnej liczby parametrów do MLP, ten CNN wykorzystuje wzorce przestrzenne poprzez konwolucję, aby osiągnąć lepszą wydajność.

- **Gotowość do wnioskowania**: Rozmiar i szybkość tego modelu sprawiają, że nadaje się do aplikacji lekkich i rozpoznawania cyfr w czasie rzeczywistym.

Ten model demonstruje idealny punkt: dobrą głębokość, rozsądny rozmiar parametrów i doskonałą dokładność. Ale co jeśli w ogóle nie zależałoby nam na rozmiarze i chcieliśmy jeszcze bardziej zwiększyć wydajność?

Dowiedzmy się w następnej sekcji.

## Model 4: StrongCNN — Głęboki konwolucyjny potwór

Jak dotąd przyjrzeliśmy się modelom, które balansują wydajność i prostotę. Ale co jeśli usuniemy ograniczenia i postawimy wszystko na wydajność?

![](https://ucarecdn.com/416f3481-45ee-477e-b8bb-61f37902a46c/)

`StrongCNN` to głębsza, bardziej ekspresyjna architektura, która wprowadza wiele warstw konwolucyjnych, wyższą liczbę kanałów i techniki regularizacji, takie jak `Dropout`, aby zapobiec przeuczeniu. Jest inspirowana najlepszymi praktykami z większych modeli wizji, ale wciąż na tyle kompaktowa, aby szybko trenować na `MNIST`.

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

### Rozbicie architektury

Ten model składa się z czterech warstw konwolucyjnych w dwóch blokach, z rosnącą liczbą filtrów (32 → 64). Po każdym bloku:

- Stosujemy MaxPool2d(2) w celu zmniejszenia rozmiaru.
- Stosujemy Dropout w celu redukcji nadmiernego dopasowania.
- Na końcu cechy są spłaszczane i przekazywane przez dwie w pełni połączone warstwy z warstwą ukrytą zawierającą 128 neuronów oraz kolejnym dropoutem.

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

Z niemal **pół miliona parametrów**, ten model przyćmiewa inne pod względem pojemności. Ale się opłaca.

```
Strong CNN (467818 parameters)
Test Accuracy: 99.09% | Loss: 0.03 | Learning time: 75.0s
```

### Kluczowe obserwacje

- **Najwyższa dokładność**: StrongCNN osiąga 99,09% dokładności testowej, zbliżając się bardzo do wydajności na poziomie człowieka w MNIST.

- **Regularyzacja ma znaczenie**: Przy tak dużej liczbie parametrów, dropout jest kluczowy, aby uniknąć przeuczenia.

- **Koszt wydajności**: Czas treningu jest prawie 3× dłuższy niż w przypadku MLP i 6× więcej parametrów niż w zrównoważonym CNN.

Ten model jest przesadny dla MNIST - ale o to chodzi. Ilustruje, jak daleko można zajść, gdy dokładność jest jedynym celem.

## Podsumowanie: Porównanie wszystkich czterech modeli

Podsumujmy z boku:

| Model         | Parametry | Dokładność testowa | Strata | Czas trenowania |
| ------------- | ---------- |-------------------|--------|-----------------|
| **MLP**       | 25 450    | 95,96%            | 0,14   | 8,7s            |
| **TinyCNN**   | 4 266     | 97,96%            | 0,06   | 12,3s           |
| **CNN**       | 26 698    | 98,22%            | 0,05   | 14,3s           |
| **StrongCNN** | 467 818   | 99,09%            | 0,03   | 75,0s           |


### Wnioski

Eksperyment ten pokazuje, jak wybory architektoniczne wpływają na wydajność w sieciach neuronowych. Nawet dla prostego zbioru danych, takiego jak MNIST:

- **MLP** działają, ale ignorują strukturę obrazu.
- **CNN** wykorzystują cechy przestrzenne dla lepszych wyników.
- **Głębokość i szerokość** zwiększają dokładność, ale podnoszą koszty treningu i ryzyko przeuczenia.
- **Regularyzacja** jest niezbędna dla głębszych sieci.

Modele konwolucyjne przewyższają MLP nie dlatego, że są „głębsze” lub „fajniejsze”, ale dlatego, że **rozumieją, jak działają obrazy**.

Te wyniki odzwierciedlają szersze trendy zauważane w badaniach [stanowiących szczyt techniki](https://paperswithcode.com/sota/image-classification-on-mnist):

- **Modele konwolucyjne** pozostają podstawą klasyfikacji MNIST, oferując silne indukcyjne przesunięcia dla struktury obrazu.

- Techniki takie jak **dropout, augmentacja danych** i **głębokie architektury** są kluczowe dla poprawy wydajności.

- Bardziej zaawansowane modele, takie jak **sieci kapsułkowe, hybrydy transformatorów** i **zespoły**, przesunęły dokładność ponad **99,85%**, chociaż te metody często są przesadzone dla MNIST i wymagają znacznie więcej mocy obliczeniowej.

Nasze eksperymenty potwierdzają, że CNN są nie tylko dokładniejsze niż MLP - są również bardziej wydajne i lepiej przystosowane do zadań opartych na obrazach. Chociaż modele SOTA nadal przesuwają granice, nasze praktyczne modele już osiągają wysoką dokładność przy ułamku złożoności.

https://github.com/gustawdaniel/cnn-mnist
