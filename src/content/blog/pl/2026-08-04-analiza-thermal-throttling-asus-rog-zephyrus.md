---
author: Daniel Gustaw
canonicalName: cpu-thermal-throttling-asus-rog-zephyrus
coverImage: https://preciselab.fra1.digitaloceanspaces.com/blog/img/temperature-cover.avif
description: Analiza dławienia termicznego procesora AMD Ryzen 9 7945HX pod Arch Linux przed i po wymianie płynnego metalu. Skrypty Bash i Python oraz wykresy porównawcze.
excerpt: Porównanie temperatur i taktowania procesora Ryzen 9 7945HX przed i po wymianie płynnego metalu. Eliminacja dławienia z 544 MHz do stabilnych 5.4 GHz pod pełnym obciążeniem.
publishDate: 2026-08-04 00:00:00+00:00
slug: pl/cpu-thermal-throttling-asus-rog-zephyrus
tags:
  - hardware
  - linux
  - python
  - bash
  - arch-linux
title: "Thermal throttling w ASUS ROG Zephyrus Duo 16: analiza przed i po wymianie płynnego metalu"
updateDate: 2026-08-07 18:35:00+00:00
---

Podczas wykonywania intensywnych benchmarków wydajnościowych masowego zapisu do bazy danych na laptopie ASUS ROG Zephyrus Duo 16 (GX650PY) pod systemem Arch Linux (kernel 7.1.5) wystąpiło drastyczne dławienie termiczne (thermal throttling).

Obciążenie procesora generowane było za pomocą wielowątkowego skryptu pomiarowego w PHP (`bin/run_benchmarks.php --concurrency=8`), zaprezentowanego szczegółowo we wpisie [Badanie wydajności insertów MariaDB](/posts/pl/badanie-wydajnosci-insertow-mysql). Skrypt ten, zrównoleglając zapytania do bazy danych w osobnych procesach klientów, obciążył w 100% wszystkie 32 wątki procesora.

Specyfikacja komputera:

- CPU: AMD Ryzen 9 7945HX (16c/32t, Zen 4)
- GPU: NVIDIA GeForce RTX 4090 Laptop GPU (175W TGP)
- RAM: 64 GB DDR5
- OS: Arch Linux x86_64

## 1. Weryfikacja wieku i czasu pracy sprzętu

Przed analizą samych logów temperatur sprawdziłem wiek sprzętu i przepracowane godziny z poziomu CLI:

- Data wydania BIOSu: 25 maja 2023 (`05/25/2023`)
  ```bash
  cat /sys/class/dmi/id/bios_date
  ```
- Data instalacji obecnego systemu Arch Linux: 31 października 2024
  ```bash
  head -n 1 /var/log/pacman.log
  ```
- Liczba przepracowanych godzin dysku (Power On Hours): 5402 godziny
  ```bash
  sudo smartctl -a /dev/nvme0n1 | grep Power_On_Hours
  ```

Ponad 5400 godzin pracy w laptopie o łącznym TDP komputera przekraczającym 200W tłumaczy degradację i przesunięcie fabrycznego płynnego metalu na procesorze.

## 2. Pozyskiwanie danych: skrypty Bash

Do zbierania danych pomiarowych co 1 sekundę użyłem dwóch skryptów.

### Monitorowanie temperatur i wentylatorów (sensors-watch.sh)

```bash
#!/bin/bash

while true; do
    echo "=== $(date) ==="
    sensors
    sleep 1
done >> sensors.log
```

### Monitorowanie taktowania i stanów CPU (cpupower-watch.sh)

```bash
#!/bin/bash

while true; do
    echo "=== $(date) ==="
    sudo cpupower monitor
    sleep 1
done >> cpupower.log
```

## 3. Parsowanie logów i generowanie wykresów w Pythonie

Poniższy skrypt czyta plik `sensors.log`, wyciąga metryki przy użyciu wyrażeń regularnych i generuje wykresy z wykorzystaniem `pandas` i `matplotlib`.

```python
import re
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime

log_file = 'sensors.log'

with open(log_file, 'r') as f:
    content = f.read()

blocks = content.split('=== ')
data = []

for b in blocks:
    if not b.strip():
        continue
    lines = b.split('\n')
    ts_str = lines[0].replace(' ===', '').strip()
    try:
        ts_clean = re.sub(r' [A-Z]{3,4} ', ' ', ts_str)
        dt = datetime.strptime(ts_clean, '%a %b %d %H:%M:%S %Y')
    except Exception:
        continue

    entry = {'timestamp': dt}

    tctl_match = re.search(r'Tctl:\s+\+([0-9\.]+)°C', b)
    tccd1_match = re.search(r'Tccd1:\s+\+([0-9\.]+)°C', b)
    tccd2_match = re.search(r'Tccd2:\s+\+([0-9\.]+)°C', b)
    gpu_edge_match = re.search(r'edge:\s+\+([0-9\.]+)°C', b)
    gpu_ppt_match = re.search(r'PPT:\s+([0-9\.]+) W', b)
    cpu_fan_match = re.search(r'cpu_fan:\s+([0-9]+) RPM', b)
    gpu_fan_match = re.search(r'gpu_fan:\s+([0-9]+) RPM', b)
    acpi0_match = re.search(r'acpitz_0-acpi-0.*?temp1:\s+\+([0-9\.]+)°C', b, re.DOTALL)
    nvme1_match = re.search(r'nvme-pci-0200.*?Composite:\s+\+([0-9\.]+)°C', b, re.DOTALL)
    nvme2_match = re.search(r'nvme-pci-0800.*?Composite:\s+\+([0-9\.]+)°C', b, re.DOTALL)

    entry['Tctl'] = float(tctl_match.group(1)) if tctl_match else None
    entry['Tccd1'] = float(tccd1_match.group(1)) if tccd1_match else None
    entry['Tccd2'] = float(tccd2_match.group(1)) if tccd2_match else None
    entry['GPU_edge'] = float(gpu_edge_match.group(1)) if gpu_edge_match else None
    entry['GPU_PPT'] = float(gpu_ppt_match.group(1)) if gpu_ppt_match else None
    entry['CPU_Fan'] = int(cpu_fan_match.group(1)) if cpu_fan_match else None
    entry['GPU_Fan'] = int(gpu_fan_match.group(1)) if gpu_fan_match else None
    entry['ACPI_0'] = float(acpi0_match.group(1)) if acpi0_match else None
    entry['NVMe_1'] = float(nvme1_match.group(1)) if nvme1_match else None
    entry['NVMe_2'] = float(nvme2_match.group(1)) if nvme2_match else None

    data.append(entry)

df = pd.DataFrame(data).sort_values('timestamp').reset_index(drop=True)
df['elapsed_min'] = (df['timestamp'] - df['timestamp'].iloc[0]).dt.total_seconds() / 60.0

# Wykres 1: CPU
plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(12, 6), dpi=150)
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#1e293b')

ax.plot(df['elapsed_min'], df['Tctl'], label='CPU Tctl', color='#ff453a', linewidth=2.5)
ax.plot(df['elapsed_min'], df['Tccd1'], label='CPU Tccd1', color='#ff9f0a', linewidth=1.8, linestyle='--')
ax.plot(df['elapsed_min'], df['Tccd2'], label='CPU Tccd2', color='#ffd60a', linewidth=1.8, linestyle=':')

ax.axhline(y=100.0, color='#ff2d55', linestyle='-', linewidth=1.5, label='Próg throttling (100°C)')
ax.axhline(y=95.0, color='#ff9f0a', linestyle=':', linewidth=1.2, label='Limit AMD (95°C)')

ax.set_title('Temperatury CPU (AMD Ryzen 9 7945HX)', fontsize=14, fontweight='bold', pad=15)
ax.set_xlabel('Czas [minuty]', fontsize=11)
ax.set_ylabel('Temperatura [°C]', fontsize=11)
ax.set_ylim(40, 108)
ax.grid(True, linestyle='--', alpha=0.25)
ax.legend(loc='lower right', facecolor='#0f172a', edgecolor='#334155')

plt.tight_layout()
plt.savefig('cpu_temperatures_chart.png')
plt.close()
```

## 4. Wyniki pomiarów przed serwisem (Stary płynny metal)

Poniższe wykresy prezentują najbardziej kluczowy, 13-minutowy fragment testu obciążeniowego przed serwisem.

### Temperatury CPU przed wymianą

![Temperatury CPU przed wymianą płynnego metalu](https://preciselab.fra1.digitaloceanspaces.com/blog/img/cpu_temperatures_before_repaste.svg)

Obserwacje z pomiaru fabrycznego stanu po 5400 h pracy:
- **Maksymalna temperatura**: `Tctl` oraz `Tccd1` osiągnęły krytyczne **104.2°C**.
- **Nierównomierne przewodzenie (Delaminacja)**: matryca `Tccd1` miała 104.0°C, natomiast `Tccd2` w tym samym momencie 88.1°C (różnica aż 15.9°C świadczyła o przesunięciu i wyschnięciu płynnego metalu na jednym z bloków krzemu).

### Taktowanie rdzeni (Hard Throttling)

![Taktowanie CPU przed wymianą - Throttling 544 MHz](https://preciselab.fra1.digitaloceanspaces.com/blog/img/cpu_frequency_before_repaste.svg)

- **Spadek taktowania**: Logi `cpupower` wykazały gwałtowny zrzut zegara ze stałego 3.5 GHz do zaledwie **544 MHz** na wszystkich 32 wątkach po przekroczeniu progu 100°C.

---

## 5. Efekty po wymianie płynnego metalu (Repaste)

W reakcji na zdiagnozowane dławienie termiczne przeprowadziłem pełny serwis układu chłodzenia – usunięcie zdegradowanego płynnego metalu i aplikację nowej warstwy na rdzeniu Ryzen 9 7945HX.

Następnie powtórzyłem ten sam wielowątkowy scenariusz obciążeniowy MariaDB z użyciem `bin/run_benchmarks.php`.

### Zestawienie porównawcze: Przed vs Po serwisie

| Metryka pomiarowa                 | Przed wymianą (`backup`)       | Po wymianie (`repaste`)    | Zmiana / Rezultat                                       |
| :-------------------------------- | :----------------------------- | :------------------------- | :------------------------------------------------------ |
| **Czas trwania testu**            | 15.1 min                       | **34.3 min**               | **2.3x dłuższy** ciągły test obciążeniowy               |
| **Maksymalna temp. CPU Tctl**     | **104.2 °C**                   | **91.0 °C**                | **Spadek o 13.2 °C** (bezpiecznie poniżej limitu AMD)   |
| **Średnia temp. CPU Tctl**        | 98.4 °C                        | **72.4 °C**                | **Spadek średniej temperatury o 26.0 °C**               |
| **Maksymalna temp. CCD1**         | **104.0 °C**                   | **94.2 °C**                | **Spadek o 9.8 °C**                                     |
| **Maksymalna temp. CCD2**         | 88.1 °C                        | **78.1 °C**                | **Spadek o 10.0 °C**                                    |
| **Różnica temp. (CCD1 - CCD2)**   | 15.9 °C (punktowe przegrzanie) | Równomierne odprowadzanie  | Eliminacja dryfu ciepła między rdzeniami                |
| **Najniższe taktowanie CPU**      | **543 MHz** (Hard Throttling)  | **2331 MHz**               | **Wzrost minimalnego zegara o 4.3x** (Zero throttling!) |
| **Średnie taktowanie pod loadem** | 543.9 MHz (w fazie zrzutu)     | **3718.6 MHz** (~3.72 GHz) | **Wzrost średniej częstotliwości o ~6.8x**              |
| **Maksymalny Boost CPU**          | 4913 MHz                       | **5416 MHz** (5.42 GHz)    | Pełna wydajność fabryczna architektury Zen 4            |

---

### Temperatury CPU po wymianie (Fragment 0–13 min)

Poniższy wykres prezentuje przebieg temperatur podczas tej samej 13-minutowej fazy intensywnego obciążenia po serwisie:

![Temperatury CPU po wymianie płynnego metalu](https://preciselab.fra1.digitaloceanspaces.com/blog/img/cpu_temperatures_after_repaste.svg)

**Kluczowa obserwacja**: Po wymianie płynnego metalu temperatura procesora stabilizuje się na poziomie **91.0°C**, nie przekraczając ani limitu bezpieczeństwa AMD (95°C), ani progu hard throttlingu (100°C).

---

### Taktowanie rdzeni po wymianie (Pełna wydajność 3.7–5.4 GHz)

Taktowanie 32 wątków procesora pod obciążeniem po wymianie płynnego metalu:

![Taktowanie CPU po wymianie płynnego metalu](https://preciselab.fra1.digitaloceanspaces.com/blog/img/cpu_frequency_after_repaste.svg)

**Wnioski**:
- Taktowanie pod pełnym obciążeniem utrzymuje się stale w wysokim przedziale **3.7 GHz – 5.4 GHz**, całkowicie eliminując dawne spadki do 544 MHz.

---

## 6. Podsumowanie

Po 5400 godzinach pracy w laptopie ASUS ROG Zephyrus Duo 16 zrezygnowany płynny metal przestał efektywnie przekazywać ciepło z rdzeni procesora AMD Ryzen 9 7945HX do ciepłowodów, wprowadzając komputer w głęboki hard throttling (544 MHz przy 104.2°C).

Wymiana płynnego metalu przyniosła natychmiastowy rezultat:

1. **Spadek maksymalnej temperatury CPU o 13.2°C** (z 104.2°C do 91.0°C).
2. **Całkowitą eliminację dławienia zegarów** – wzrost średniego taktowania pod obciążeniem z 544 MHz do **3.72 GHz** (z chwilowymi skokami boost do **5.42 GHz**).
3. **Ponad 6-krotny przyrost przepustowości obliczeniowej** podczas wykonywania równoległych testów masowych insertów w MariaDB.

