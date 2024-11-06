---
author: Daniel Gustaw
canonicalName: bolt-always-lite-mitm-proxy-insomnia-and-vue
coverImage: http://localhost:8484/cd38117c-276f-4c95-9ea8-3eb55e806e87.avif
description: atak typu man-in-the-middle umożliwiający zamówienie bolt lite za pomocą aplikacji
excerpt: atak typu man-in-the-middle umożliwiający zamówienie bolt lite za pomocą aplikacji
publishDate: 2021-07-21 13:53:53+00:00
slug: pl/bolt-zawsze-lekki-mitm-proxy-i-insomnia
tags:
- attack
- hacking
- bolt
- vue
- MITM
title: Bolt (zawsze) Lite - MITM, Proxy, Insomnia i Vue
updateDate: 2021-08-15 23:22:00+00:00
---

Cześć!

To jest pierwsza część na temat tego, jak sprawić, by zamawianie Bolt Lite było zawsze możliwe. W tej części omówimy praktyczne zastosowanie ataku Man In The Middle (MITM) oraz proxy przez PC.

## **Przypinanie certyfikatów**

Ponieważ aplikacja Bolt nie używa mechanizmu znanego jako przypinanie certyfikatów, uchwycenie wszystkich danych wysyłanych w pakietach powinno być łatwym zadaniem. Google od dłuższego czasu sugeruje wdrożenie CP wszystkim deweloperom, ale niektórzy z nich wciąż tego nie robią. Z aplikacji, których używam najczęściej, przypinanie certyfikatów stosują tylko banki i portfele kryptowalutowe. Gdyby w aplikacji Bolt było przypinanie certyfikatów, aplikacja wydawałaby się odłączona od internetu podczas sniffingu. Nadal możliwe jest połączenie z API, gdy przypinanie certyfikatów jest wprowadzone, ale wiąże się to z inżynierią wsteczną pliku APK. Jeśli interesuje Cię, jak to zrobić, przeczytaj świetny artykuł @XeEaton, a po zakończeniu patchowania APK wróć do mojego artykułu.

[Inżynieria wstępna i usuwanie przypinania certyfikatów Pokémon GO | Eaton Works](https://eaton-works.com/2016/07/31/reverse-engineering-and-removing-pokemon-gos-certificate-pinning/)

## **Proxy MITM**

Aby sniffować pakiety wysyłane przez aplikację Bolt na Androida, użyjemy mitmproxy, który jest projektem o otwartym kodzie źródłowym.

[mitmproxy - interaktywne proxy HTTPS](https://mitmproxy.org/)

Jeśli twoja wersja Androida jest wyższa niż Nougat (Android 7), co prawdopodobnie jest prawdą, ponieważ jesteś mega geekiem i czytasz ten artykuł, będziesz także potrzebować:

* zrootowanego urządzenia Android
* zainstalowanego Xposed Framework
* włączonego modułu JustTrustMe ([https://github.com/Fuzion24/JustTrustMe](https://github.com/Fuzion24/JustTrustMe))

Po zainstalowaniu mitmproxy na swoim komputerze lokalnej sieci, uruchom polecenie:

```
mitmweb (or mitmproxy if you love CLIs)
```

Pokaże ci port, na którym nasłuchuje (domyślnie 8080). Przejdź do ustawień sieci na swoim urządzeniu z Androidem i wpisz go w sekcji "Proxy". Od teraz możesz przechwytywać pakiety, tak jak w narzędziach dewelopera Google Chrome.

## **Alternatywny sposób: HTTPCanary**

GuoShi wykonał wspaniałą pracę i stworzył piękną aplikację na Androida, która pozwala na przechwytywanie pakietów w czasie rzeczywistym. Niestety, nie udało mi się znaleźć sposobu na dostęp do dzienników z twojego komputera w czasie rzeczywistym, ale wciąż można łatwo wprowadzić je do Insomnia do testów.

## **Insomnia**

Po przechwyceniu wszystkich niezbędnych zapytań przeszedłem do Insomnia, aby sprawdzić, które z nich są potrzebne.

### **Tworzenie przejazdów**

API Bolt, choć niepubliczne, ma nadal bardzo opisowe kody błędów, takie jak:

![](http://localhost:8484/f1448226-f620-4b89-846f-5b11ac381211.avif)

Natkniesz się na takie błędy dość często - najważniejsze jest, aby ich słuchać!

Z tego powodu wiedziałem, że musimy cofnąć się o krok i najpierw poszukać opcji taksówek, aby uzyskać hash blokady ceny i identyfikator kategorii (Bolt, Lite, Pets...), który będzie wysyłany z zapytaniem o stworzenie przejazdu.

### **Wyszukiwanie opcji taksówek**

![](http://localhost:8484/91e0520b-03f7-4f91-923e-59a732c25770.avif)

Wysłanie takiego payloadu zwraca nam listę możliwych taryf i dostępnych kategorii bolt:

![](http://localhost:8484/4782afcb-fec5-43b5-817b-41ea04ddccac.avif)

Intrygujące jest to, że otrzymujemy również parametr "surge\_multiplier", który nie jest widoczny w aplikacji. Fajnie!

## **Przepływ zapytań**

![](http://localhost:8484/93e25608-e518-4c95-94d1-45ba8cfecba9.avif)

## **Stałe zapytania o dane**

Po dokładnej analizie wszystkich 4 zapytań (tworzenie przejazdu, anulowanie przejazdu, pobieranie dostępnych samochodów i sprawdzanie bieżącego stanu aplikacji) dość łatwo zauważyć, że istnieją pewne parametry, które dotyczą każdego z zapytań:

```
gps_lat: current latitude
gps_lng: current longitude
session_id: must not be null - doesn't really matter
user_id: string of numbers identifying user
country: current country
language: user language
deviceType: in my case "android"
version: in my case "CA.7.01"
deviceId: unique deviceId string generated
device_name: string including android device model number - probably for statistical purposes
device_os_version: android version (in my case 10)
```

Przekształcimy to w obiekt i skonfigurujemy axios, aby te dane były wysyłane z każdym żądaniem jako dodatkowe zapytanie.

## **Wybór stacku technologicznego**

Jak często robimy w naszej firmie oprogramowania, użyjemy Vue z Nuxt na front-end. Na zapleczu użyjemy naszego proxy CORS z Precise Lab.

## **Problem odrzucenia karty**

Czasami, gdy tworzysz nową przejażdżkę, bolt losowo zgłasza błąd autoryzacji karty kredytowej, co wygląda jak błąd w ich API. Po prostu użyjemy `try {} catch {}`, poczekamy na błąd, potwierdzimy go i powtórzymy tworzenie nowej przejażdżki. Nigdy nie zdarza się to drugi raz z rzędu, więc jesteśmy zadowoleni z tego rozwiązania.

## **Uatrakcyjnienie**

Na ostatnim etapie zadbam o wyświetlenie aktualnego statusu przejażdżki użytkownikowi oraz dostarczenie mu dokładnej mapy, żeby mógł upewnić się, że wybrał odpowiednie punkty odbioru i dowozu. Nie ma potrzeby śledzenia kierowcy w czasie rzeczywistym, ponieważ można to zrobić w aplikacji jak zwykle, jednak można to łatwo dodać, gdy przejażdżka zostanie potwierdzona przez kierowcę, otrzymujesz koordynaty samochodu, a nawet orientację samochodu (w ten sposób aplikacja bolt pokazuje samochody robiące salta wsteczne i driftujące) w każdym żądaniu statusu przejażdżki.

## **Słaby punkt**

Więc jest wdrożone i możesz z tego korzystać! Hurra! 
Jedynym problemem jest to, że nadal musisz zdobyć klucz API. Niestety, nie znajdziesz go w ustawieniach aplikacji Bolt. Aby go zdobyć, musisz analizować żądania, które wysyła twoja aplikacja, a do tego potrzebujesz HTTP Canary lub innego sniffera pakietów, o którym pisałem w pierwszej części tej przygody z hackowaniem bolta. Dobrą wiadomością jest to, że twój token API bolta jest ważny na czas nieokreślony (lub przynajmniej przez bardzo długi czas).
Może moglibyśmy zdobyć ten token za pomocą aplikacji webowej bolta?
Jest aplikacja webowa bolta, ale niestety, nie działa ona wcale:

![](http://localhost:8484/5727bb63-8155-4a8c-a3ea-76b298e091ce.avif)

Smutne powiadomienie, które otrzymasz, gdy przesuniesz wskaźnik odbioru na m.bolt.eu.

A jeśli przyjrzysz się żądaniom HTTP, które są wysyłane tam i z powrotem:

![](http://localhost:8484/a79b67c9-8fe9-45d9-8e98-4166d0281d01.avif)

To właściwie wszystko! Dziękujemy za przeczytanie, przyjaciele!