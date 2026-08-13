---
author: Daniel Gustaw
canonicalName: cpu-thermal-throttling-asus-rog-zephyrus
coverImage: https://preciselab.fra1.digitaloceanspaces.com/blog/img/temperature-cover.avif
description: Analiza dławienia termicznego procesora AMD Ryzen 9 7945HX pod Arch Linux. Pomiary przed i po serwisie, awaryjne wyłączenie komputera, awaria sterowania wentylatorami (0 RPM GPU Fan) oraz raport diagnostyczny dla serwisu.
excerpt: Analiza temperatur i taktowania Ryzen 9 7945HX w ASUS ROG Zephyrus Duo 16. Wymiana płynnego metalu dała początkową poprawę, ale kompilacja jądra Linuxa ujawniła usterkę chłodzenia – zrzut taktowania do 544 MHz, limit obrotów wentylatora i thermal shutdown.
publishDate: 2026-08-04 00:00:00+00:00
slug: pl/cpu-thermal-throttling-asus-rog-zephyrus
tags:
  - hardware
  - linux
  - python
  - bash
  - arch-linux
title: "Thermal throttling w ASUS ROG Zephyrus Duo 16: analiza przed i po serwisie, awaria chłodzenia i raport RMA"
updateDate: 2026-08-13 09:30:00+00:00
---

Podczas wykonywania intensywnych benchmarków wydajnościowych oraz kompilacji jądra Linuxa na laptopie ASUS ROG Zephyrus Duo 16 (GX650PY) pod systemem Arch Linux (kernel 6.18 LTS / 7.1.5) wystąpiło drastyczne dławienie termiczne (thermal throttling) doprowadzające w skrajnym wypadku do awaryjnego wyłączenia komputera (Thermal Shutdown).

Początkowa diagnoza i pierwsza wymiana płynnego metalu przyniosły krótkotrwałą poprawę w prostych testach, jednak ciągłe obciążenie (kompilacja jądra Linuxa oraz pętle benchmarku 7-Zip) ujawniły głębszy defekt układu chłodzenia oraz sterowania wentylatorami.

Specyfikacja komputera:

- **CPU**: AMD Ryzen 9 7945HX (16c/32t, Zen 4, TDP 55W-110W+)
- **GPU**: NVIDIA GeForce RTX 4090 Laptop GPU (175W TGP)
- **RAM**: 64 GB DDR5
- **OS**: Arch Linux x86_64

---

## 1. Weryfikacja wieku i czasu pracy sprzętu

Przed analizą logów temperatur sprawdziłem wiek sprzętu i przepracowane godziny z poziomu CLI:

- Data wydania BIOSu: 25 maja 2023 (`05/25/2023`)
  ```bash
  cat /sys/class/dmi/id/bios_date
  ```
- Data instalacji obecnego systemu Arch Linux: 31 października 2024
  ```bash
  head -n 1 /var/log/pacman.log
  ```
- Liczba przepracowanych godzin dysku (Power On Hours): ponad 5400 godzin
  ```bash
  sudo smartctl -a /dev/nvme0n1 | grep Power_On_Hours
  ```

Ponad 5400 godzin pracy w laptopie o łącznym TDP komputera przekraczającym 200W tłumaczy degradację i przesunięcie fabrycznego płynnego metalu (zjawisko pump-out) na procesorze AMD Ryzen 9.

---

## 2. Pozyskiwanie danych: skrypty Bash i telemetria

Do zbierania danych pomiarowych co 1 sekundę użyłem zestawu skryptów monitorujących metryki z `lm_sensors`, `turbostat` oraz `cpupower`.

### Monitorowanie temperatur i wentylatorów (sensors-watch.sh)

```bash
#!/bin/bash

while true; do
    echo "=== $(date) ==="
    sensors
    sleep 1
done >> sensors.log
```

### Zintegrowana telemetria procesora i stanów mocy (turbostat-watch.sh)

```bash
#!/bin/bash

sudo turbostat --Summary --quiet --interval 1 >> turbostat.txt
```

---

## 3. Parsowanie logów i generowanie wykresów w Pythonie

Poniższy skrypt czyta pliki `sensors.log` oraz `turbostat.txt`, korelując dane o temperaturach, obrotach wentylatorów (`cpu_fan`, `gpu_fan`) oraz rzeczywistym taktowaniu i poborze mocy CPU (`PkgWatt`, `Bzy_MHz`).

```python
import re
import matplotlib.pyplot as plt
import pandas as pd

# Odczyt danych z sensors.log
sensors_data = []
with open('sensors.log') as f:
    s_text = f.read()

for b in s_text.split('=== '):
    if not b.strip(): continue
    lines = b.split('\n')
    ts = lines[0].replace(' ===', '').strip()
    cpu_fan = re.search(r'cpu_fan:\s+([0-9]+) RPM', b)
    gpu_fan = re.search(r'gpu_fan:\s+([0-9]+) RPM', b)
    tctl = re.search(r'Tctl:\s+\+([0-9\.]+)°C', b)
    tccd1 = re.search(r'Tccd1:\s+\+([0-9\.]+)°C', b)
    tccd2 = re.search(r'Tccd2:\s+\+([0-9\.]+)°C', b)
    
    sensors_data.append({
        'tctl': float(tctl.group(1)) if tctl else None,
        'tccd1': float(tccd1.group(1)) if tccd1 else None,
        'tccd2': float(tccd2.group(1)) if tccd2 else None,
        'cpu_fan': int(cpu_fan.group(1)) if cpu_fan else None,
        'gpu_fan': int(gpu_fan.group(1)) if gpu_fan else 0,
    })

df_s = pd.DataFrame(sensors_data)

# Odczyt z turbostat.txt
turbo_data = []
with open('turbostat.txt') as f:
    t_lines = f.readlines()

for i in range(len(t_lines)):
    line = t_lines[i].strip()
    if line.startswith('-'):
        p1 = line.split()
        p2 = t_lines[i+1].strip().split()
        avg_mhz = float(p1[4])
        bzy_mhz = float(p1[6])
        pkg_watt = float(p2[-1])
        turbo_data.append({
            'avg_mhz': avg_mhz,
            'bzy_mhz': bzy_mhz,
            'pkg_watt': pkg_watt
        })

df_t = pd.DataFrame(turbo_data)
min_len = min(len(df_s), len(df_t))
df = pd.concat([df_s.iloc[:min_len], df_t.iloc[:min_len]], axis=1)
df['sec'] = range(min_len)

# Wykres temperatur
plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(12, 6), dpi=150)
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#1e293b')

ax.plot(df['sec'], df['tctl'], label='CPU Tctl', color='#ff453a', linewidth=2.2)
ax.plot(df['sec'], df['tccd1'], label='CPU Tccd1', color='#ff9f0a', linewidth=1.8, linestyle='--')
ax.plot(df['sec'], df['tccd2'], label='CPU Tccd2', color='#ffd60a', linewidth=1.8, linestyle=':')

ax.axhline(y=100.0, color='#ff2d55', linestyle='-', linewidth=1.5, label='Próg Hard Throttling / Thermal Protection (100°C)')
ax.axhline(y=95.0, color='#ff9f0a', linestyle=':', linewidth=1.2, label='Nominalny limit AMD (95°C)')

ax.set_title('Temperatury CPU (AMD Ryzen 9 7945HX)', fontsize=13, fontweight='bold', pad=15)
ax.set_xlabel('Czas [sekundy]', fontsize=11)
ax.set_ylabel('Temperatura [°C]', fontsize=11)
ax.set_ylim(60, 110)
ax.grid(True, linestyle='--', alpha=0.25)
ax.legend(loc='lower right', facecolor='#0f172a', edgecolor='#334155')

plt.tight_layout()
plt.savefig('cpu_temperatures.svg')
plt.close()
```

---

## 4. Wyniki pomiarów przed serwisem (Fabryczny płynny metal po 5400 h)

Poniższe wykresy prezentują 13-minutowy fragment testu obciążeniowego przed serwisem.

### Temperatury CPU przed wymianą

![Temperatury CPU przed wymianą płynnego metalu](https://preciselab.fra1.digitaloceanspaces.com/blog/img/cpu_temperatures_before_repaste.svg)

Obserwacje z pomiaru stanu po 5400 h pracy:
- **Maksymalna temperatura**: `Tctl` oraz `Tccd1` osiągnęły krytyczne **104.2°C**.
- **Nierównomierne przewodzenie (Delaminacja / Pump-out)**: Matryca `Tccd1` miała 104.0°C, podczas gdy `Tccd2` w tym samym momencie osiągała 88.1°C (różnica 15.9°C świadczyła o przesunięciu i wyschnięciu płynnego metalu na jednym z bloków krzemu).

### Taktowanie rdzeni (Hard Throttling 544 MHz)

![Taktowanie CPU przed wymianą - Throttling 544 MHz](https://preciselab.fra1.digitaloceanspaces.com/blog/img/cpu_frequency_before_repaste.svg)

- **Spadek taktowania**: Logi `cpupower` wykazały gwałtowny zrzut zegara ze stałego 3.5 GHz do zaledwie **544 MHz** na wszystkich 32 wątkach po przekroczeniu progu 100°C.

---

## 5. Pierwsza próba serwisu (Repaste) i wstępne złudne wyniki

W reakcji na zdiagnozowane dławienie termiczne przeprowadzono serwis układu chłodzenia polegający na oczyszczeniu powierzchni i aplikacji nowej warstwy płynnego metalu na rdzeniu Ryzen 9 7945HX.

Krótki test obciążeniowy MariaDB wykazał początkową poprawę:

| Metryka pomiarowa                 | Przed wymianą (`backup`)       | Po wymianie (`repaste` - krótki test) | Zmiana / Wynik wstępny                                  |
| :-------------------------------- | :----------------------------- | :------------------------------------ | :------------------------------------------------------ |
| **Maksymalna temp. CPU Tctl**     | **104.2 °C**                   | **91.0 °C**                           | Spadek o 13.2 °C w krótkim teście                       |
| **Różnica temp. (CCD1 - CCD2)**   | 15.9 °C (punktowe przegrzanie) | Równomierne                           | Chwilowe wyrównanie temperatur                          |
| **Najniższe taktowanie CPU**      | **543 MHz** (Hard Throttling)  | **2331 MHz**                          | Wzrost zegara pod krótkim obciążeniem                   |
| **Maksymalny Boost CPU**          | 4913 MHz                       | **5416 MHz** (5.42 GHz)               | Chwilowy powrót fabrycznej wydajności Zen 4             |

Jednakże krótkie benchmarki syntetyczne nie oddają realiów pracy pod pełnym, długotrwałym obciążeniem.

---

## 6. Realne obciążenie: Kompilacja jądra Linuxa i wyłączenie awaryjne (Thermal Shutdown)

Po wstępnym entuzjazmie przystąpiono do wykonania pełnej kompilacji jądra Linuxa (`make -j32 vmlinux`). Jest to jedno z najbardziej wymagających zadań dla wielowątkowych procesorów.

### Przebieg awarii podczas kompilacji:

1. **Po 4 minutach pełnego obciążenia** temperatura na procesorze przekroczyła **100°C**.
2. **Hard Throttling**: Taktowanie procesora drastycznie spadło do **544 MHz** na wszystkich 32 wątkach.
3. **Limit obrotów wentylatora**: Wentylator CPU utknął na poziomie **3800 RPM** i nie zwiększał obrotów mimo przekroczenia krytycznej temperatury. Wentylator GPU pozostał całkowicie bezczynny (0 RPM).
4. **Thermal Protection Shutdown**: Po osiągnięciu przez matrycę krzemową temperatury rzędu **105.9°C** nastąpiła automatyczna aktywacja sprzętowego zabezpieczenia termicznego (Thermal Panic).
5. **Blokada włączenia**: Komputer natychmiastowo wyłączył się (odcięcie zasilania) i **nie dawał się ponownie uruchomić** do momentu całkowitego fizycznego ostygnięcia układu chłodzenia.

---

## 7. Pogłębiona re-ewaluacja pod testem 7-Zip (`/home/daniel/thermal-test`)

W celu dokładnego zdiagnozowania przyczyny ponownej awarii wykonano kontrolowany test syntetyczny z pełną rejestracją telemetryczną (`sensors.log`, `turbostat.txt`, `system-info.txt`). Test polegał na uruchomieniu pętli benchmarka 7-Zip (`7z b -mmt=32`) składającej się z 3 serii po 30 sekund z 30-sekundowym przestojem.

### Wykres 1: Przebieg temperatur CPU i nierównomierność CCD

![Temperatury CPU pod obciążeniem 7-Zip](https://preciselab.fra1.digitaloceanspaces.com/blog/img/cpu_temperatures_7z_failure.svg)

**Wnioski z pomiaru temperatur**:
- W ciągu **zaledwie 2 sekund** od rozpoczęcia obciążenia temperatura `Tctl` skacze z 71°C do **98.5°C**.
- Szczytowa temperatura matrycy `Tccd1` osiąga **105.9°C** (wyraźnie przekraczając granicę krytyczną 100°C).
### Wykres 2: Defekt sterowania wentylatorami i ostateczny test przy 6300 RPM

![Obroty wentylatorów CPU i GPU pod obciążeniem](https://preciselab.fra1.digitaloceanspaces.com/blog/img/cpu_fan_gpu_fan_7z_test.svg)

**Kluczowa obserwacja defektu układowego i weryfikacja empiryczna**:
- **Specyfikacja obrotów**: W laptopie ASUS ROG Zephyrus Duo 16 (GX650) pod pełnym obciążeniem w trybie Turbo / Manual nominalne obroty wentylatora procesora wynoszą około **6000 – 6300 RPM**.
- **Test przy wymuszonych maksymalnych obrotach (6300 RPM)**:
  W celu ostatecznego rozstrzygnięcia, czy problemem są obroty wentylatorów, czy usterka fizyczna, skonfigurowano wymuszenie profilu `Performance` z własną agresywną krzywą obrotów (`asusctl fan-curve`). Wentylator procesora wszedł na fizyczne maksimum **6300 RPM** (średnio 5978 RPM pod pełnym obciążeniem 7-Zip).
- **Ostateczny dowód usterki sprzętowej (Hardware Fault)**:
  **Mimo pracy wentylatora CPU na pełnych obrotach (6300 RPM), procesor i tak rozgrzał się do 103.9°C na matrycy CCD1 i 100.1°C Tctl!**
  Dowodzi to w 100%, że wentylatory pracujące z maksymalną wydajnością wydmuchują chłodne powietrze, ale ciepło z rdzenia krzemowego w ogóle nie dociera do radiatora z powodu degradacji płynnego metalu (pump-out) lub braku docisku stopy komory parowej.

---

### Wykres 3: Spadek taktowania i zrzut mocy (Power & Clock Throttling)

![Taktowanie CPU Bzy_MHz i Package Power pod obciążeniem](https://preciselab.fra1.digitaloceanspaces.com/blog/img/cpu_frequency_power_7z_test.svg)

**Analiza spadku wydajności**:
- **Początkowy Boost**: Procesor startuje z taktowaniem powyżej 5.0 GHz i poborem mocy Package Power na poziomie **110W**.
- **Zrzut taktowania**: W momencie osiągnięcia 105°C zegar `Bzy_MHz` spada drastycznie z 4.5 GHz do **713 MHz**, a na długim obciążeniu (kernel compile) do **544 MHz**.
- **Redukcja mocy**: Pobór mocy procesora zostaje wymuszony w dół z 110W do **70W**, a mimo to układ nie jest w stanie się schłodzić z powodu braku odpowiedniego przepływu powietrza.

---

## 8. Raport Diagnostyczny dla Serwisu (ASUS Service Diagnostic Report)

Poniższa sekcja stanowi podsumowanie techniczne przeznaczone dla inżynierów i techników serwisu gwarancyjnego / RMA.

> [!IMPORTANT]
> **Diagnoza końcowa**: Nawet przy wymuszeniu maksymalnych obrotów wentylatorów (6300 RPM) procesor nagrzewa się do 103.9°C na CCD1. Wyklucza to usterkę programową i dowodzi trwałej awarii fizycznej styków cieplnych i komory parowej (Vapor Chamber).

### Podsumowanie parametrów usterki w logach telemetrycznych

| Metryka / Parametr | Wartość zmierzona w logu | Wartość nominalna / Oczekiwana | Status usterki |
| :--- | :--- | :--- | :--- |
| **Szczytowa temp. Tccd1** | **103.9 °C - 105.9 °C** | max 95.0 °C (AMD Spec) | **PRZEKROCZONA** (Przegrzewanie) |
| **Max obroty CPU Fan** | **6300 RPM** (wymuszone) | ~6000 RPM | **PRACA MAKSYMALNA** |
| **Max obroty GPU Fan** | **0 RPM** | **>4500 RPM** (Współdzielona komora) | **DEFEKT** (Brak aktywacji fan2) |
| **Najniższe taktowanie CPU** | **544 MHz** | min 3700 MHz pod loadem | **HARD THROTTLING** |
| **Reakcja na długi load** | **Thermal Shutdown** | Ciągła praca pod obciążeniem | **AWARIA CHŁODZENIA (HARDWARE)** |

---

### Trzy główne przyczyny awarii chłodzenia:

1. **Defekt mikrokodu EC / BIOS i profilu ACPI (Fan Control Bug)**:
   - Sterownik układu KBC/EC w BIOS (wersja `GX650PY.315`) przy obciążeniu generowanym wyłącznie na CPU nie aktywuje drugiego wentylatora (GPU Fan = 0 RPM) oraz sztucznie ogranicza obroty pierwszego wentylatora do ~3800 RPM (zamiast 5400–6200 RPM).
   - Ze względu na **współdzieloną komorę parową (Vapor Chamber)** pokrywającą zarówno CPU jak i GPU, wymagana jest praca obu wentylatorów przy obciążeniu powyżej 55W TDP na procesorze.

2. **Nierównomierny docisk i zjawisko Pump-Out płynnego metalu (Delta CCD1 vs CCD2)**:
   - Skok temperatury `Tccd1` do 105.9°C w ciągu pierwszych sekund testu świadczy o braku bezpośredniego styku czapy rdzenia z miedzianą stopą komory parowej nad pierwszą matrycą krzemu (CCD1).
   - Płynny metal ulega wypychaniu poza obszar rdzenia (pump-out effect) pod wpływem cykli rozszerzalności cieplnej.

3. **Sprzętowe wyłączenie ochronne (Thermal Shutdown)**:
   - Zabezpieczenie procesora AMD wyłącza zasilanie magistrali przy przekroczeniu progu krytycznego TjMax, chroniąc krzem przed trwałym uszkodzeniem.

---

### Lista kontrolna dla technika serwisu (RMA Action Checklist):

1. **Weryfikacja płaskośc komory parowej (Vapor Chamber inspection)**:
   - Sprawdzić za pomocą liniału traserskiego, czy stopa komory parowej nie uległa odkształceniu (odkształcenie płaszczyzny wyklucza prawidłowy styk z rdzeniem procesora).
2. **Wymiana materiału termoprzewodzącego**:
   - Ze względu na powtarzające się zjawisko pump-out płynnego metalu zaleca się zastosowanie wydajnego materiału zmiennofazowego o wysokiej lepkości (np. podkładki zmiennofazowej **Honeywell PTM7950**) lub fabrycznego zestawu uszczelniającego z nowym płynnym metalem o odpowiedniej gęstości.
3. **Reset i aktualizacja mikrokodu EC / BIOS oraz weryfikacja trybu Turbo**:
   - Wykonać pełny reset układu KBC/EC oraz wgrać najnowszy BIOS zapewniający prawidłowe mapowanie obrotów obu wentylatorów (GPU Fan + CPU Fan do 6000+ RPM) przy obciążeniu procesora.

---

## 9. Skrypt pomiarowo-diagnostyczny dla serwisu

Poniższy skrypt pozwala technikowi serwisu na natychmiastowe zreplikowanie problemu i weryfikację poprawności działania chłodzenia po naprawie.

```bash
#!/bin/bash
# Script: thermal-bench-check.sh
# Opis: Diagnostyczny test obciążeniowy CPU z weryfikacją wentylatorów i throttling-u

LOG_DIR="./thermal-test-results"
mkdir -p "$LOG_DIR"

echo "=== Rozpoczęcie diagnostyki termicznej ASUS ROG Zephyrus ==="
echo "Zapis danych do: $LOG_DIR"

# 1. Zapis informacji o systemie i BIOS
cat /sys/class/dmi/id/product_name > "$LOG_DIR/system-info.txt"
cat /sys/class/dmi/id/bios_version >> "$LOG_DIR/system-info.txt"
uname -r >> "$LOG_DIR/system-info.txt"

# 2. Uruchomienie tła pomiarowego
sensors -j > "$LOG_DIR/sensors-start.json"
sudo turbostat --Summary --quiet --interval 1 > "$LOG_DIR/turbostat.log" &
TURBOSTAT_PID=$!

while true; do
    echo "=== $(date) ==="
    sensors
    sleep 1
done > "$LOG_DIR/sensors.log" &
SENSORS_PID=$!

# 3. Wykonanie obciążenia (3 pętle 7-Zip)
echo "Uruchamianie pętli obciążeniowej 7-Zip (3x30s)..."
for i in {1..3}; do
    echo "Pętla $i/3..."
    7z b -mmt=32 > /dev/null
    sleep 30
done

# 4. Zakończenie pomiaru
kill $TURBOSTAT_PID $SENSORS_PID

# 5. Automatyczna analiza przekroczeń
MAX_TEMP=$(grep -oP 'Tctl:\s+\+\K[0-9.]+' "$LOG_DIR/sensors.log" | sort -nr | head -n1)
MIN_FAN=$(grep -oP 'cpu_fan:\s+\K[0-9]+' "$LOG_DIR/sensors.log" | sort -n | head -n1)
GPU_FAN_MAX=$(grep -oP 'gpu_fan:\s+\K[0-9]+' "$LOG_DIR/sensors.log" | sort -nr | head -n1)

echo "--------------------------------------------------"
echo "WYNIKI DIAGNOSTYKI:"
echo "Maksymalna temperatura Tctl: ${MAX_TEMP}°C"
echo "Maksymalne obroty GPU Fan:   ${GPU_FAN_MAX:-0} RPM"
echo "--------------------------------------------------"

if (( $(echo "$MAX_TEMP > 95.0" | bc -l) )); then
    echo "[FAIL] Przekroczono bezpieczną temperaturę 95°C!"
fi

if [ "${GPU_FAN_MAX:-0}" -eq 0 ]; then
    echo "[FAIL] Wentylator GPU nie aktywował się podczas testu (0 RPM)!"
fi
```

---

---

---

## 10. Wyniki po serwisie i test obciążeniowy GPU (Data z /home/daniel/thermal-test)

Po powrocie komputera z serwisu i wdrożeniu poprawek w oprogramowaniu sterującym (`asusctl` / `asusd`) przeprowadzono powtórną diagnostykę w dwóch etapach: test obciążenia procesora CPU oraz dedykowany test obciążenia karty graficznej GPU (8 równoległych strumieni 4K NVENC).

### Tabela porównawcza: Stan Fabryczny vs Po Repaście vs Test Obciążenia GPU

| Metryka / Parametr | Stan Fabryczny (Po 5400h) | Pełny Test CPU Po Serwisie | Test Obciążenia GPU (8x 4K NVENC) | Werdykt i Wnioski |
| :--- | :--- | :--- | :--- | :--- |
| **Max Temp CPU Tctl** | **104.2 °C** | **99.8 °C** (Średnia: 91.1 °C) | ~78.0 °C | Stabilizacja poniżej progu wyłączenia awaryjnego |
| **Max Temp CPU CCD1** | **104.0 °C** | **106.4 °C** | — | Przegrzewanie z powodu braku nawiewu GPU Fan |
| **Max Temp GPU Core** | ~65.0 °C | 55.0 °C | **78.0 °C** | Wysokie obciążenie krzemu GPU (65W TDP) |
| **Różnica (CCD1 - CCD2)** | **15.9 °C** (Uszkodzony LM) | **7.2 °C** | — | **Poprawna aplikacja płynnego metalu przez serwis** |
| **Max Obroty CPU Fan** | ~3800 RPM | **6200 RPM** | **6100 RPM** | Praca wentylatora CPU na fizycznym maksimum |
| **Max Obroty GPU Fan** | **0 RPM** | **0 RPM** | **0 RPM (Brak aktywacji przy 78°C)** | **DEFEKT FIZYCZNY / UNPLUGGED GPU FAN** |
| **Minimalne Taktowanie CPU** | **544 MHz** (Hard Throttling) | **> 4400 MHz – 5100 MHz** | — | **Brak spowolnienia zegarów pod obciążeniem** |
| **Stabilność Systemu** | Awaryjne Wyłączenie (Thermal Panic) | Brak wyłączenia | Brak wyłączenia | Eliminacja restartów mimo braku wentylatora 2 |

---

### Dowód fizycznego uszkodzenia / odłączenia wentylatora GPU:

Podczas testu diagnostycznego karty graficznej wygenerowano obciążenie rzędu **65 W TDP**, pobór pamięci VRAM osiągnął **6844 MiB**, a temperatura rdzenia GPU wzrosła do **78 °C**. 

W normalnych warunkach mikrokontroler EC przy temperaturze GPU przekraczającej 65°C bezwarunkowo wymusza obroty drugiego wentylatora na poziomie **4000–5500 RPM**. Fakt, że przy 78°C na rdzeniu GPU wentylator `gpu_fan` w dalszym ciągu wskazywał **0 RPM**, dowodzi w 100%, że:
1. **Technik serwisu podczas składania laptopa nie podłączył wtyczki taśmy wentylatora GPU do płyty głównej.**
2. **LUB wentylator GPU uległ uszkodzeniu mechanicznemu / zablokowaniu.**

To wyjaśnia również, dlaczego podczas kompilacji jądra na procesorze matryca `CCD1` rozgrzewała się do 106.4°C – połowa współdzielonej komory parowej (Vapor Chamber) była całkowicie pozbawiona przepływu powietrza.

---

## 11. Rozwiązania po stronie oprogramowania (Linux System Optimization)

W celu rozwiązania problemów ze sterowaniem i kulturą pracy układu chłodzenia pod systemem Linux wdrożono następujące usprawnienia:

### A. Dynamiczne dowiązania czujników dla paska i3 (Rozwiązanie błędu *No such file or directory*)
Ścieżki w `/sys/class/hwmon/hwmonX/` zmieniają się po każdym kontakcie ze sterownikami przy uruchomieniu Linuksa. Utworzono skrypt `~/.local/bin/update-hwmon-symlinks.sh`:

```bash
#!/usr/bin/env bash
for d in /sys/class/hwmon/hwmon*; do
    if [ -f "$d/name" ]; then
        name=$(cat "$d/name" 2>/dev/null)
        if [ "$name" = "asus" ]; then
            ln -sfn "$d/fan1_input" /tmp/asus_cpu_fan
            ln -sfn "$d/fan2_input" /tmp/asus_gpu_fan
        elif [ "$name" = "k10temp" ]; then
            ln -sfn "$d/temp1_input" /tmp/cpu_temp1
        fi
    fi
done
```

W konfiguracji `i3status` wdrożono stabilne odnośniki `/tmp/asus_cpu_fan`, `/tmp/asus_gpu_fan` oraz `/tmp/cpu_temp1`, co całkowicie wyeliminowało błędy odczytu w pasku stanu.

### B. Wygładzenie krzywej obrotów w `asusctl`
W celu wyeliminowania nagłych, męczących ryków wentylatorów przy skokach obciążenia w przeglądarce, dostrojono profil `Balanced`:

```bash
asusctl fan-curve --mod-profile Balanced --fan cpu --data "30c:0%,45c:15%,55c:25%,65c:40%,75c:60%,80c:75%,85c:90%,90c:100%"
asusctl fan-curve --mod-profile Balanced --fan gpu --data "30c:0%,45c:15%,55c:25%,65c:40%,75c:60%,80c:75%,85c:90%,90c:100%"
asusctl profile set Balanced
```

---

## 12. Podsumowanie i zalecenia RMA

1. **Wymiana płynnego metalu (Repaste)** odniosła sukces pod kątem styków cieplnych na rdzeniu CPU – wyeliminowano dławienie zegarów do 544 MHz oraz awaryjne wyłączanie komputera (Thermal Shutdown).
2. **Defekt fabryczny / serwisowy wentylatora GPU**: Test obciążeniowy karty graficznej (78°C przy 65W TDP) ostatecznie udowodnił, że wentylator GPU jest fizycznie nieaktywny (0 RPM) z powodu niepodłączonej wtyczki lub uszkodzenia silniczka.
3. **Laptop wymaga ponownego zgłoszenia gwarancyjnego (RMA)** w celu fizycznego podłączenia taśmy wentylatora GPU na płycie głównej.


