---
title: Wpływ zmian rezerwy na giełdach na cenę BTC
slug: analiza-on-chain
publishDate: 1970-01-01T00:00:00.000Z
date_updated: 2021-07-15T14:18:03.000Z
draft: true
---

Każdy inwestor interesujący się kryptowalutami wie, że trzymanie środków na giełdzie eksponuje go na stałe ryzyko:

* upadku tej giełdy
* zamknięcia jej za pranie pieniędzy i finansowanie terroryzmu
* zniknięcia prezesa, który okazuje się być jedyną osobą mającą dostęp do środków

Historia przekrętów i strat związanych z giełdami kryptowalut jest długa i interesująca. Jeśli jej nie znacie, zachęcam do poczytania o takich giełdach ja Cryptopia, Mt. Gox, FCoin, czy nasz polski BitMarket. Jednak dla nas stanowi ona jedynie wyjście do sformułowania hipotezy, którą omówimy w tym artykule.

Rozumowanie, które przedstawię brzmi następująco:

Skoro trzymając środki na giełdzie mogę je stracić, to nie powinienem ich tam trzymać. Z drugiej strony aby wykonać transakcję muszę je tam przelać. Zatem rozsądne będzie przelewanie BTC na adres giełdy tuż przed sprzedażą, a wyjmowanie BTC z adresu giełdy, kiedy nie chcę ich sprzedawać dłuższy czas.

Zatem jeśli na adresie giełdy szybko wzrasta ilość BTC zdeponowanych przez użytkowników, to oznacza, że sprzedając swoje środki mogą spowodować spadek ceny Bitcoina.

Taki mechanizm predykcji cen nie może być stosowany w klasycznych rynkach z kilku powodów:

* giełdy i maklerzy w tradycyjnych rynkach są objęci funduszami gwarancyjnymi
* częstotliwość upadków giełd w klasycznych rynkach nie jest wysoka
* nie ma sposobu na uzyskanie informacji o wpłatach środków na te giełdy

Jednak w przypadku wielu kryptowalut - w tym Bitcoina można śledzić transakcje przeglądając blockchain. Można z nich odfiltrować transakcje dotyczące adresów należących do giełd. W szczególności można wyszukać takich momentów, kiedy na giełdy wpływają naprawdę duże ilość BTC i sprawdzić jak oddziałuje to na jego cenę.

Jeśli inwestorzy stosują się do zasady bezpieczeństwa i wpłacają środki na giełdę z zamiarem ich szybkiej sprzedaży to powinniśmy się spodziewać opóźnionej korelacji między gwałtownym wzrostem rezerwy a spadkiem ceny w stosunkowo krótkim horyzoncie czasowym.

Ten wpis pokaże jak zbadałem to powiązanie i czy można to wykorzystać do podniesienia zwrotu z inwestycji w kryptowaluty.

## Zebranie danych o cenie i rezerwie BTC

Aby móc postawić pytania danym należy je najpierw pobrać. Wspomniałem, że można śledzić dane z bezpośrednio z BlockChain. Jest to prawda, ale wymaga to znajomości adresów giełd, w szczególności tych historycznych. Ich zebranie i poprawna klasyfikacji transakcji oraz odsianie ich spośród milionów transakcji jest technicznie możliwe, ale stanowi wyzwanie. Znacznie łatwiej jest kupić takie dane w cenie kilkuset USD.

Do ich pobrania posłuży nam skrypt napisany w pythonie:

```python
from requests import get
import dateutil.parser
import pymongo
import logging
from print_elapsed_time import print_elapsed_time

db_user = ''
db_pass = ''
db_name = 'on_chain_data'
db_host = '127.0.0.1'
db_is_srv = False

api_token = 'xxx'

client = pymongo.MongoClient(
    "mongodb{db_is_srv}://{db_auth}{db_host}/{db_name}?retryWrites=true&w=majority".format(
        db_auth='{db_user}:{db_pass}@'.format(db_user=db_user, db_pass=db_pass) if db_user and db_pass else '',
        db_host=db_host,
        db_name=db_name,
        db_is_srv='+srv' if db_is_srv else ''
    ))

db = client[db_name]
db.quant_btc_market_data_price_usd.create_index([('blockheight', pymongo.ASCENDING)], unique=True)
db.quant_btc_exchange_flow_reserve.create_index([('blockheight', pymongo.ASCENDING)], unique=True)


def get_resource(year, uri, params, collection):
    url = "https://api.cryptoquant.com/{}".format(uri)

    params = {
                 'window': 'block',
                 'from': '{}0101T000000'.format(year),
                 'limit': 100000,
                 'to': '{}0101T000000'.format(year + 1),
             } | params

    headers = {
        'Authorization': 'Bearer {token}'.format(token=api_token),
    }

    response = get(url, headers=headers, params=params)

    try:
        logs = response.json()['result']['data']
    except KeyError:
        return []

    for log in logs:
        log['datetime'] = dateutil.parser.parse(log['datetime'])

    if len(logs):
        try:
            db[collection].insert_many(logs)
        except pymongo.errors.BulkWriteError as e:
            logging.warning(e.details['writeErrors'])

    return logs


def get_price(year):
    return get_resource(
        year,
        'v1/btc/market-data/price-usd',
        {},
        'quant_btc_market_data_price_usd'
    )


def get_reserve(year):
    return get_resource(
        year,
        'v1/btc/exchange-flows/reserve',
        {'exchange': 'all_exchange'},
        'quant_btc_exchange_flow_reserve'
    )


def get_all_resources():
    for year in range(2009, 2021):
        res1 = len(get_price(year))
        res2 = len(get_reserve(year))
        print_elapsed_time('from {} - to {}, {}/{} results'.format(year, year + 1, res1, res2))
```

Korzysta on z API serwisu `cryptoquant`, którego klucz jest wymagany do pobrania tych danych. Następnie są one zapisywane dwóch kolekcjach

* quant\_btc\_market\_data\_price\_usd
* quant\_btc\_exchange\_flow\_reserve

Skrypt możemy uruchomić w trybie interaktywnym poleceniem

```
python -i quant.py
```

a następnie wywołać funkcję, która pobierze dane i zapisze je do bazy:

```
>>> get_all_resources()
```

Dla rezerwy mamy dane:

```json
{
    "_id":{"$oid":"60749560134562392b920278"},
    "blockheight":201299,
    "datetime":{"$date":"2012-09-30T22:31:19.000Z"},
    "reserve":27.523675060000194,
    "reserve_usd":341.2935707440024
}
```

Dla ceny

```
{
    "_id":{"$oid":"607490d472b29b2a5863bfab"},
    "blockheight":82996,
    "datetime":{"$date":"2010-09-30T23:56:42.000Z"},
    "price_usd_open":0.0619,
    "price_usd_high":0.0619,
    "price_usd_low":0.0619,
    "price_usd_close":0.0619
}
```

## Czym jest "nagły" wzrost rezerwy

Aby nadać słowom "nagły", "szybki", "gwałtywny", "znaczny", "istotny" wzrost rezerwy sens matematyczny należy rozłożyć je na dwa wymiary:

* tempo wzrostu ( pochodna logarytmiczna rezerwy względem numeracji bloków )
* czas trwania wzrostu ( liczony w ilości bloków )

Para tych parametrów pozwala na wskazanie zakresów w których wzrost rezerwy wart był obserwacji.

Żeby pobrać dane z Mongo do programu Mathematica możemy używać pakietu `MongoLinks`, ale okazuje się on bardzo źle zoptymalizowany.

[MongoLink Introduction—Wolfram Language Documentation](https://reference.wolfram.com/language/MongoLink/tutorial/MongoLinkSimpleTutorial.html)

Dlatego w tym przypadku lepiej wyeksportować dane z mongo do csv na przykład przez mongo compass.

![](http://localhost:8484/5c870232-6004-49b2-8ad6-13c3e0490186.avif)

Te pliki nie są posortowane, ponieważ `cryptoquant` zwraca je w kolejności odwrotnej niż upływ czasu. Sortujemy je poleceniami:

```
sed -n '1!p' quant_btc_exchange_flow_reserve.csv | sort -t$',' -k 1,1 -n > sorted_quant_btc_exchange_flow_reserve.csv
sed -n '1!p' quant_btc_market_data_price_usd.csv | sort -t$',' -k 1,1 -n > sorted_quant_btc_market_data_price_usd.csv
```

które przy okazji kasują nagłówki. Opcja `-n` to sortowanie numeryczne. Gdyby nie ona stosowane było by sortowanie alfabetyczne:

```csv
100000,0.3,2010-12-29T11:57:43.000Z,0.3,0.3,0.3
10000,0,2009-04-06T03:23:33.000Z,0,0,0
100001,0.3,2010-12-29T12:06:44.000Z,0.3,0.3,0.3
1000,0,2009-01-19T06:34:42.000Z,0,0,0
```

Opcja `-t` pozwala wybrać separator a `-k` określić kolumny po których sortujemy.

Dzięki wykonaniu `head` oraz `tail` na posortowanym pliku widzimy zakres naszej analizy:

* Start - blok 173949 - 2012-04-02
* Koniec - blok 690974 - 2021-07-14

![](http://localhost:8484/75fba08d-97f9-44b8-96a1-9d84e9b1d5fc.avif)

Aby pobrać zawartość plików do nootebooka w `Mathematica` wpisujemy:

```
(*blockheight,datetime,open,low,high,close*)

priceCSV = Import["/home/daniel/pro/crypto/on-chain-data/sorted_quant_btc_market_data_price_usd.csv", "Data"];
(*blockheight,datetime,reserve,reserve_usd*)

reserveCSV = Import["/home/daniel/pro/crypto/on-chain-data/sorted_quant_btc_exchange_flow_reserve.csv", "Data"];
```

Wygenerowanie tablicy z rezerwą to:

```
(* block, reserve - array *)
res = Transpose[{reserveCSV[[All, 1]], reserveCSV[[All, 3]]}]
```

Następnie budujemy moduł do tworzenia tablicy tablic ze stosunkami rezerwy w okresach co ileś bloków. W tym przypadku mamy 5 okresów i krok ustawiony na 100 bloków.

```
ratRes = Module[{parts = 5},
   Table[Module[{step}, step = IntegerPart[Length[res]/parts];
     Ratios[#[[2]] & /@ res[[1 + i*step ;; (1 + i)*step ;; 100]]]
     ], {i, 0, parts - 1}]];
```

Ten moduł pozwoli nam zobaczyć jak ewoluowała zmienność rezerwy na przestrzeni czasu. Spodziewamy się, że kiedy bitcoin był młodszy, zmienność rezerwy była wyższa, bo rynek miał niższą kapitalizację. Zatem niewielkie transakcje mogły mocniej zaburzać wartość rezerwy.

Na histogramie nie jest to wyraźnie widoczne. Można nawet odnieść mylne wrażenie, że w początkowym okresie istnienia Bitcoina koncentracja względnej zmienności rezerwy woków jedynki (czyli jej stała wartość) była dominująca. Jest to mylne wrażenie, bo jednocześnie z wysoką koncentracją współwystępowały znacznie częstsze niż obecnie wartości skrajne.

![](https://gustawdaniel.com/content/images/2021/07/res-2.svg)

Jeśli podzielimy cały rozważany okres na 100 części i policzymy wariancję względnej zmiany rezerwy co jeden blok z tego okresu to okaże się, że początkowo ta wariancja miała nie tylko wyższe wartości ale i wyższy rozrzut. To znaczy, zdarzały się takie okresy, kiedy z rezerwą działo się bardzo niewiele.

Przedefiniujemy teraz `ratRes` jako tablicę względnych rezerw podzieloną na 100 okresów. Tym razem sprawdzamy zmienność w ramach jednego bloku co jest bardziej arbitralnym wyborem.

```
ratRes = Module[{parts = 100},
   Table[Module[{step}, step = IntegerPart[Length[res]/parts];
     Ratios[#[[2]] & /@ res[[1 + i*step ;; (1 + i)*step]]]
     ], {i, 0, parts - 1}]];
```

Wariancję rezerwy policzymy używając mapowania

```
v = Variance[#] & /@ ratRes;
```

Ze względu na początkową zmienność dopasowanie krzywej wymaga specjalnego warzenia początkowych punktów wykresu. Najprostszą metodą jest ich wycięcie. Wybór granicy wycięcia niestety jest uznaniowy.

```
w = MapIndexed[If[First[#2] < 36, 0, 1] &, v];
```

W ten sposób mając wagi równe 1 dla punktów bliskich teraźniejszości i 0 dla odległej przeszłości możemy dopasować model wraz z granicami przedziału ufności.

```
nlm = NonlinearModelFit[v, c Exp[d x], {{c, 0.01}, {d, -0.1}}, x, Weights -> w];
bands90[x_] = nlm["MeanPredictionBands", ConfidenceLevel -> .7];
```

Parametry najlepszego dopasowania możemy dostać wpisując

```
nlm["BestFit"]
```

A wykres rysujemy poleceniem

```
Show[
 ListLogPlot[{v}, PlotRange -> All],
 LogPlot[{nlm[x], bands90[x]}, {x, 1, 100}, PlotRange -> All,
  Filling -> {2 -> {1}}],
 Frame -> True,
 PlotLabel ->
  "Wariancja względnej zmienności rezerwy BTC w kolejnych okresach czasu\nz dopasowaniem 7.18*10^-6*e^-0.051 x) (przy poziomie ufności 0.7)\nx to numer przedziału czasowego od 1 do 100 z okresu 2012-04-02 - 2021-07-14", ImageSize -> Full]
```

![](https://gustawdaniel.com/content/images/2021/07/res2.svg)

Z wykresu widzimy, że zmienność rezerwy systematycznie spada i można założyć, że jest to spadek wykładniczy analogiczny do znanego nam z codzienności stygnięcia herbaty.

Kluczowym wnioskiem z przedstawionych obliczeń jest:

> Jeśli chcemy mówić o gwałtownej zmianie rezerwy musimy określić w jakim momencie historii Bitcoina jesteśmy. Obecnie rezerwa jest znacznie bardziej stabilna niż kiedyś i stosowanie stałego kryterium niezależnie od okresu zaburzyło by obraz sytuacji.

Początkowo opisałem "tępo wzrostów" jako pochodną logarytmiczną rezerwy. Słowo "logarytmiczna" pozwalało pozbyć się skali. Jednak teraz należało by zmienić nomenklaturę i zacząć myśleć o stosunku pochodnej logarytmicznej rezerwy do wariancji względnej zmienności rezerwy z danego okresu.

W ten sposób wyższa wariancja z przeszłości obniży "znaczenie" dużych zmian rezerwy z tamtego okresu, a niższa obecna wariancja zagwarantuje wyższą wrażliwość na obecne zmiany rezerwy.

## Nagły wzrost rezerwy BTC względem otoczenia

Przypomnijmy arbitralne wybory, które są istotną wadą prowadzonego tutaj rozumowania:

* założyliśmy podział okresu na 100 podokresów (po około 5170 bloków - 29 dni)
* wycięliśmy 36 pierwszych okresów z dopasowania modelu krzywej wykładniczej

Początkowo gwałtowny wzrost rozumieliśmy jako względną zmianę rezerwy powyżej jakiegoś poziomu trwającą przynajmniej jakiś czas.

Wystawiało nas to na ryzyko nadreprezentacji gwałtownych zmian z dalekiej historii i ominięcia obecnej zmienności jako niewystarczająco "gwałtownej".

Teraz przechodzimy do definiowania relatywnego tępa wzrostów względem wariancji względnej zmienności.

Przez wariancję względnej zmienności rezerwy rozumiemy krzywą

```
6.82*10^-6 E^(-5.06 t)
```

gdzie `t = (x-1)/99`. Nie ma tu już podziału na 100 okresów. Jest tylko dopasowana do danych uśredniona wariancja względnej zmienności rezerwy. Współczynniki zmieniły się nieznacznie ze względu na to podstawienie. Ich zmiana została uwzględniona dzięki formule:

```
Simplify[7.18*^-6 E^(-0.051 (t + 1/99)*99)]
```

Teraz `t` zmienia się od `0` do `1`. I zależy od numeru bloku zmieniającego się od 173949 do 690974 w prosty sposób:

```
t = ( block_number - 173949 ) / ( 690974 - 173949 )
```

Wprowadzenie dzielnika w postaci tej wariancji jest istotną zmianą, bo `Exp[-0] = 1` ale `Exp[-5] = 0.0067` więc czułość na aktualne zmiany rezerwy jest kilkaset razy wyższa niż na te z początku istnienia Bitcoina.
