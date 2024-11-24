---
title: Badanie wydajności insertów mysql
slug: badanie-wydajnosci-insertow-mysql
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2021-04-20T20:51:58.000Z
draft: true
canonicalName: insert-mysql-performance-review
---

> Written with [StackEdit](https://stackedit.io/).

# Testowanie szybkości insertów

\[toc\]

## Opis projektu

Problemem, który omówimy tym razem, będzie optymalizacja szybkości zapisu do bazy danych przy kilku warunkach. Zakładamy, że nasza tabela ma nałożone klucze a więc również indeksy. Wiemy, że dane które chcemy do niej zapisać są poprawne. Podczas zapisu tych danych na pewno nie jest wykonywany żaden inny zapis.

Ponieważ dopiero zaczynam zabawę z większymi zbiorami danych, moje intuicje są oparte głównie na czytaniu dokumentacji i celem tego ćwiczenia jest wyrobienie sobie ilościowego wyczucia w tej materii.

## Zastosowane technologie

Inaczej, niż przy testowaniu selektów, nie decyduję się tym razem na czystego `sql`. Zamiast tego wykorzystamy `doctrine` ze względu na jego mechanizm dziedziczenia, którego sam `sql` z tego co wiem nie oferuje. Poza tym pisanie procedur do testowania w `php` i wystawienie przez niego `api` wydaje mi się bardziej atrakcyjne niż liniowe pliki wykonywalne w `sql`.

Do obsługi `doctrine` wykorzystamy `symfony` - genialnie napisany framework `php`. Trochę trudniejszy niż Laravel, ale z drugiej strony polecany do większych projektów, gdzie elastyczność i stabilność są bardzo ważne. Instalacja polega na wykonaniu komendy:

```bash
symfony new insert_test latest && cd insert_test
```

Zaczniemy od konfiguracji i w pliku `app/config/parameters.yml` zmienimy `database_name` na `insert_test`. Bazę danych stawiamy komendą:

```bash
php bin/console doctrine:database:create
```

Jest pusta, dlatego teraz zajmiemy się jej wypełnianiem.

## Struktura bazy danych

Interesuje nas przerzucanie danych między dwiema identycznymi tabelami, które mają powiązania przez więzy integralności referencyjnej z kilkoma mniejszymi tabelami. Nasza baza danych będzie więc przypominała pajęczynę, w której dwie duże tabele będą odnosić się `n` kluczami do `n` mniejszych nie powiązanych tabel. Główne tabela nazwiemy `main_1` i `main_2`, a mniejsze `minor_1`, `minor_2`, ... `minor_n`. Ponieważ obraz mówi więcej niż tysiąc słów załączam diagram hierarchiczny bazy:

![struktura_hierarchiczna](https://i.imgur.com/8z63XFy.png)

A dla wyjaśnienia, dlaczego początkowo wyobrażałem sobie tą bazę jak pajęczynę, prezentuję też diagram organiczny tej samej bazy.

![struktura_organiczna](https://i.imgur.com/jaxTv9m.png)

Właściwie, to te duże tabele będą miały poważne problemy z optymalnością insertów, dokładnie tak jak by było w sieci pająka...

Wracając do konkretów, ponieważ optymalność nie będzie testowana na mniejszych tabelach, nie dostaną one kluczy obcych, a więc to od nich zaczniemy stawianie bazy. Będą one zawierały tylko jedno pole - `id` będące ich kluczem głównym. Po ich utworzeniu będą tworzone tabele główne, i dopiero wtedy będziemy im dodawać klucze obce.


### Instalacja

Instalacja składa się ze ściągnięcia repozytorium i wykonania skryptu instalacyjnego. W skrypcie należy zmienić parametry połączenia z bazą danych.

```
git clone https://github.com/gustawdaniel/test_inserts_performace --depth 1
cd test_inserts_performace && bash install.sh
```

Jeśli po wykonaniu instalacji proces `jdb2/sda1-8` będzie zabierał prawie całe `I/O` (screen z `iotop`):

[![iotop.png](https://s28.postimg.org/o333sq0xp/iotop.png)](https://postimg.org/image/wlcjx27g9/)

możemy go wyłączyć, ale wymaga to włączenia systemu w trybie bezpiecznym (`recovery mode`). Proces ten jest to tak zwany `journaling`.

```
umount /dev/sda1
tune2fs -O ^has_journal /dev/sda1
```

Zwykłe kopiowanie

```
INSERT INTO major_2 SELECT * FROM major_1;
Query OK, 1000000 rows affected (8 min 38,35 sec)
```

Mysqldump

```
time mysqldump -u root training major_1 > major_1.sql
```

Pliki generowane przez mysqldump zwykle są duże i nie warto ich oglądać w całości. Podobnie jak `head` służy do wyświetlania pierwszych linii pliku tak poniższym poleceniem wyświetlimy pierwsze znaki każdej linii.

```
awk '{print substr($0,1,210);}' major_1.sql
```

Ponieważ interesuje nas wrzucenie danych do tabeli major\_2, więc chcemy wybrać tylko inserty i zmienić 1 na 2 w nazwie tabeli. W języku skryptowym `awk` tego typu zadania załatwia się jedną linią:

```
awk '/^INSERT/ {sub("_1","_2",$0); print $0;}' major_1.sql > major_2.sql
```

Teraz możemy wykonać wrzut danych do bazy.

## Instalacja

```
git clone http://github.com/gustawdaniel/test_inserts_performance
cd test_inserts_performance
bash install.sh
```

paste Dropbox token

```
bash bash/initialize.sh
php app.php
bash bash/send.sh
```

On analysing machine

```
mysql -u root training -e "TRUNCATE log; TRUNCATE machine;"
bash bash/get.sh
```


## Struktura bazy danych

Interesuje nas przerzucanie danych między dwiema identycznymi tabelami, które mają powiązania przez więzy integralności referencyjnej z kilkoma mniejszymi tabelami. Nasza baza danych będzie więc przypominała pajęczynę, w której dwie duże tabele będą odnosić się `n` kluczami do `n` mniejszych nie powiązanych tabel. Główne tabela nazwiemy `main_1` i `main_2`, a mniejsze `minor_1`, `minor_2`, ... `minor_n`. Ponieważ obraz mówi więcej niż tysiąc słów załączam diagram hierarchiczny bazy:

![struktura_hierarchiczna](https://i.imgur.com/8z63XFy.png)

A dla wyjaśnienia, dlaczego początkowo wyobrażałem sobie tą bazę jak pajęczynę, prezentuję też diagram organiczny tej samej bazy.

![struktura_organiczna](https://i.imgur.com/jaxTv9m.png)

Właściwie, to te duże tabele będą miały poważne problemy z optymalnością insertów dokładnie tak jak by było w sieci pająka...

Wracając do konkretów, ponieważ optymalność nie będzie testowana na mniejszych tabelach, nie dostaną one kluczy obcych, a więc to od nich zaczniemy stawianie bazy. Będą one zawierały tylko jedno pole - `id` będące ich kluczem głównym. Po ich utworzeniu będą tworzone tabele główne, i dopiero wtedy będziemy im dodawać klucze obce.

## Tworzenie tabel

Kiedy kończyłem pisać wpis o [testowaniu selektów](https://gustawdaniel.com/posts/pl/tesseract-ocr-i-testowanie-selektow/) za pomocą Behata, nie byłem zbyt zadowolony z pisania scenariuszy, które różniły się tylko liczbą atrybutów, lub warunków. Mimo, że bardzo wygodny dla osób nie technicznych, `Gherkin` nie dawał mi wystarczającej elastyczności. 
Podobnie czułem się [pisząc procedury](https://gustawdaniel.com/posts/pl/testowanie-szybkosci-selektow/) w czystym `SQL`. Brak dziedziczenia sprawiał, że musiałem kopiować kod, a tego bardzo nie lubię.

Zupełnie inaczej jest tym razem. Całość kodu odpowiedzialnego za tworzenie całej tej bazy danych i wystawienie do tego prymitywnego, ale funkcjonalnego `API` mieści się w 100 liniach kodu.

Naszą zabawę możemy zacząć od usunięcia katalogu `Resources` z `app/config`. Nasz kontroler będzie rozmawiał w `jsonie`, więc widoki nie będą nam potrzebne. Przechodzimy do edycji kontrolera. Zaczynamy od dołączenia bibliotek:

> src/AppBundle/Controller/DefaultController.php

```php
<?php

namespace AppBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\DBAL\Schema\Comparator;
use Doctrine\DBAL\Schema\Table;
```

Mamy tu `Route` odpowiadające za przypisywanie adnotacjom przy akcjach odpowiednich ścieżek w routingu. Jest `Controller`, który pozwala nam odnosić się do wszystkich najbardziej podstawowych funkcji `Symfony` przez `$this`. Następnie `JsonResponse` łączący działanie funkcji `json_decode` z jednoczesnym ustawianiem nagłówka na `application/json`. Trzy kolejne to paczki `Doctrine`, które odpowiednio tłumaczą jego `api` na `SQL` i dostarczają obiekty `Doctrine`.

Wewnątrz kontrolera będą istnieć dwie zmienne prywatne będące tablicami tabel `main` i `minor` oraz liczba określające ile tabel typu `minor` ma występować.

```php
class DefaultController extends Controller
{
    /**
     * @var Table[]
     */
    private $main, $minor;

    private $N;

    public function __construct()
    {
        $this->main = [];
        $this->minor = [];
        $this->N = 10;
    }
```

Konstruktor ustawia `$minor` i `$main` jako puste tablice, a domyślną liczbę tabel na `10`. Klasa `Table` jest jednym z obiektów `doctrine`, które dopiero co załączyliśmy. Obsługę tej klasy zobaczymy za chwilę w funkcji tworzącej schemat jednej z tabel.

```php
    /**
     * @param $schema Schema
     */
    private function appendMinorToSchema($schema)
    {
        for($i=1;$i<=$this->N;$i++) {
            $this->minor[$i] = $schema->createTable("minor_".$i);
            $this->minor[$i]->addColumn("id", "integer");
            $this->minor[$i]->setPrimaryKey(array("id"));
        }
    }
```

Jak wspominałem wcześniej zaczynamy od tworzenia mniejszych tabel. Ponieważ ma być ich `N`, właśnie to tej wielkości ustawiona jest pętla. Wewnątrz do zmiennej zawierającej tabele `$minor` przypisujemy wynik metody `creteTable` na schemacie, który będzie podany jako argument. Schemat odpowiada temu jak `doctrine` rozumie strukturę bazy danych w ramach swoich własnych klas. Tworzonej tabeli przypisywany jest atrybut będący kluczem głównym. To wystarczy. Odrobinę bardziej złożoną logikę ma tworzenie dużych tabel.

```php
    /**
     * @param $schema Schema
     */
    private function appendMainToSchema($schema)
    {
        for($i=1;$i<=2;$i++)
        {
            $this->main[$i] = $schema->createTable("main_".$i);
            $this->main[$i]->addColumn("id", "integer");
            for($j=1;$j<=$this->N;$j++)
            {
                $this->main[$i]->addColumn("minor_".$j."_id", "integer");
                $this->main[$i]->addForeignKeyConstraint($this->minor[$j], array("minor_".$j."_id"), array("id"));
            }
            $this->main[$i]->setPrimaryKey(array("id"));
        }
    }
```

Ponieważ są dwie, pętla główna przebiega tylko wartości `1` i `2`. Tak jak poprzednio do schematu dodawane są tabele, oraz kolumna o nazwie `id`, która zostanie u nas kluczem głównym. Nie dostała ona `auto_increment` bo będziemy ją ustawiać w zewnętrznym skrypcie.

Po dodaniu bazowego atrybutu - `id` do tabeli rozpoczynamy pętlę po mniejszych tabelach, w której podpinamy kolumnę i przypisujemy jej więzy integralności referencyjnej. Na ustanawiamy `id` kluczem głównym.

Na tym się kończy lista zmiennych i metod. Jak w zwykłych skryptach, przechodzimy do ciała programu.

```php
    /**
     * @Route("/", name="home")
     * @Route("/do/{n}")
     */
    public function indexAction($n=10,$action="do")
    {
        if($n){ $this->N = $n; }
        $conn = $this->getDoctrine()->getConnection();
```

Routing pozwala nam wybrać domyślną ścieżkę `/`, albo określić akcję i wybrać dla niej argument. Na tym etapie będziemy mieli dwie akcje - `show` i `do`. Show będzie jedynie wyświetlało kod `SQL` jaki trzeba wykonać, aby obecny stan bazy przekształcić do posiadającego `n` małych tabel, a `do` będzie nie tylko pokazywać, ale też wykonywać ten kod. Jak łatwo zgadnąć, `n` jest właśnie liczbą tabel i nadpisuje domyślne `10` z konstruktora. Na końcu tego kodu tworzymy połączenie z bazą danych i zapisujemy jego reprezentację do zmiennej `$conn`. Teraz przygotujemy schemat.

```php
        $schema = new Schema();

        $this->appendMinorToSchema($schema);
        $this->appendMainToSchema($schema);
```

Schemat, czyli to jak `doctrine` rozumie strukturę bazy tworzymy w trzech linijkach. Czas porównać go z obecnym stanem bazy.

```php
        $comparator = new Comparator();
        $queries = $comparator->compare($conn->getSchemaManager()->createSchema(), $schema)->toSql($conn->getDatabasePlatform());

```

Dzięki obiektom `Comparator` oraz `ShemaManager` otrzymanie tablicy z zapytaniami `SQL` aktualizującymi naszą strukturę bazy mieści się w dwóch liniach. Zostało już tylko wykonanie tych zapytań, jeśli `action` ustawione jest na `do`.

```php
        if($action=="do"){
            foreach($queries as $query) {
                $conn->prepare($query)->execute();
            }
        }
```

Dzięki metodom pozwalającym wykonywać czyste sqlowe zapytania nasze zadanie sprowadza się do wykonania pętli po nich. Możemy teraz zwrócić użytkownikowi jakiś sensowny komunikat.

```php
        return new JsonResponse(
            [
                "alter"=>$queries,
            ]
        );
    }
}
```

Najlepszy wydał mi się `json` z listą zapytań jakie należy wykonać, aby obecny stan bazy przekształcić do zadanego przez parametr `n`. Na koniec dołączam metodę `show`, która świetnie nadaje się do debugowania, ale nie pełni żadnej funkcji poza tym:

```php
    /**
    * @Route("/show/{n}")
    */
    public function showAction($n=10)
    {
        return $this->doAction($n,"show");
    }
```

Żeby móc obsłużyć nasz kontroler postawimy serwer komendą.

```bash
php bin/console server:run
```

I w drugim terminalu wyślemy request http, który wypełni nam bazę tabelami.

```
time http -b GET localhost:8000/do/10
```

Jego wykonanie trwało u mnie 3 sekundy, a odpowiedź wyglądała tak:

![database_creation](https://i.imgur.com/NQVaaWB.png)

## Wypełnianie bazy danymi

Nadszedł czas wypełnić bazę danymi. Dla małych tabel będą to liczby z przedziału od `1` do `L`. Dla dużych będziemy losować `N` liczb od `1` do `L`, które dodamy do kluczy obcych. Wartość `id` ustawimy na `auto_increment` ale nie z poziomu `sql` tylko przez zewnętrzny skrypt. Poza małymi tabelami wypełnimy tylko tabelę `main_1`, zostawiając `main_2` pustą. Przypominam, że chcemy przetestować klonowanie dużej tabli z dużą ilością kluczy obcych.

### Tabele minor

Zaczniemy od wypełniania małych tabel. Podzielę ten proces na wypełnianie małych i dużej tabeli oddzielnie, ze względu na większą elastyczność takiego podejścia, a po części też dlatego, że da mi to lepszy wgląd w czasy wykonywania poszczególnych procesów. Małe tabele będziemy tworzyć za pomocą następującej akcji w `DefaultController`:

```php
    /**
     * @Route("/minor/{n}/{l}")
     */
    public function minorAction($n=10,$l=10)
    {
        $conn = $this->getDoctrine()->getConnection();
        for($i=1;$i<=$n;$i++){
            $conn->delete('minor_'.$i,[1=>1]);
            for($j=1;$j<=$l;$j++){
                $conn->insert('minor_'.$i, array('id' => $j));
            }
        }
        return new  JsonResponse(['n'=>$n, 'l'=>$l]);
    }
```

Jest ona wyjątkowo prosta, ale posiada jeden dość ciekawy hak. Chodzi o idempotentność. W metodzie `delete` obiektu `Connection` mamy nazwę tabeli a później tablicę `[1=>1]`. Jest to warunek który w instrukcji `DELETE FROM` występuje za `WHERE`. `1=1` jest zawsze prawdziwe i dlatego przed rozpoczęciem zapisu zostają usunięte zostają wszystkie elementy jednym zapytaniem. Żeby wywołać tą akcję wystarczy wpisać w konsoli:

```bash
time http -b GET localhost:8000/minor/10/10
```

Odpowiedź którą zobaczymy będzie wyglądała tak:

```json
{
    "l": "10",
    "n": "10"
}
```

### Dodanie stałych

Mógł bym kontynuować dodawanie akcji, ale zacząłem martwić się zbytnią powtarzalnością wartości domyślnych. Zanim przejdziemy dalej wprowadzimy w kodzie następujące zmiany. Na początku kontrolera definiujemy stałe:

```php
    const N = 10;
    const L = 10;
    const K = 1000;
```

W konstruktorze ustawiamy `private $N` na:

```php
        $this->N = self::N;
```

Zmieniamy domyślne wartości w definicjach akcji na następujące:

```php
    public function doAction($n=self::N,$action="do")
    public function showAction($n=self::N)
    public function minorAction($n=self::N,$l=self::L)
```

Dodajemy routingi bez parametrów, czyli

```php
     * @Route("/show")
```

przed `* @Route("/minor/{n}/{l}")` oraz

```ph
     * @Route("/minor")
```

przed `* @Route("/main/{n}/{l}/{k}")`

### Tabela main

Do wypełnienia tabeli `main_1` wykorzystamy następujący kod

```php
    /**
     * @Route("/main")
     * @Route("/main/{n}/{l}/{k}")
     * @Route("/main/{n}/{l}/{k0}/{k}")
     */
    public function mainAction($n=self::N,$l=self::L,$k=self::K,$k0=1)
    {
        $conn = $this->getDoctrine()->getConnection();
        if($k0==1) { $conn->delete('main_1',[1=>1]); }
        for($i=$k0;$i<=$k;$i++){                // row in table main
            $content = ['id'=>$i];
            for($j=1;$j<=$n;$j++){            // foreign key of row
                $content['minor_'.$j.'_id'] = rand(1,$l);
            }
            $conn->insert('main_1', $content);
        }
        return new  JsonResponse(['n'=>$n,'l'=>$l,'k0'=>$k0,'k'=>$k]);
    }
```

Jest to akcja która nadaje się zarówno do czyszczenia, nadpisywania, jak i dopisywania do tabeli `main`. Tak duża ogólność została uzyskana dzięki dość ciekawemu routingowi. Zmienne `n` i `l` to odpowiednio liczba tabel typu `minor` oraz liczba ich wierszy. `k` jest maksymalnym indeksem `id` do którego będziemy wypełniać tabelę `main`. `k0` jest indeksem od którego zaczynamy. Jeśli wynosi on 1 lub nie jest podany, zawartość tabeli `main` zostanie skasowana przed dalszym zapisem.

To co się dzieje wewnątrz pętli jest dość przewidywalne. Tworzymy wartość `id` zgodnie z zapowiedzianym schematem (`auto_increment`), losujemy klucze obce, zapisujemy wiersz i przechodzimy dalej. Tej akcji można użyć na kilka sposobów. Na przykład żeby wypełnić tabelę `main_1` dziesięcioma wierszami wpiszemy:

```
time http -b GET localhost:8000/main/10/10/10
```

Jeśli chcemy ją wyczyścić:

```
time http -b GET localhost:8000/main/10/10/0
```

Teraz możemy zapisać z powrotem 10 wierszy, ale rozbijając to na dwa kroki:

```
time http -b GET localhost:8000/main/10/10/1/5
time http -b GET localhost:8000/main/10/10/6/10
```

Zanim wypełnimy tabelę `main_1` milionami wierszy należy zauważyć, że pierwszą przyczyną dla której szybkość wykonywania insertów jest niezadowalająca jest sprawdzanie poprawności więzów przy każdym zapisie. Celowo nie dodałem transakcji, żebyśmy mogli porównać szybkość wykonywania tego kodu z analogicznym otoczonym transakcją. Wyniki dla `100k` wierszy:

|Bez transakcji|Z transakcją|
|---|---|
|6m 41.672s|0m 57.804s|

Transakcje uzyskamy dzięki następującej modyfikacji ciała akcji `mainAction`:

```php
        $conn = $this->getDoctrine()->getConnection();
        if($k0==1) { $conn->delete('main_1',[1=>1]); }
        $conn->beginTransaction();
        try{
            // loop over rows - exactly the same as before
            $conn->commit();
        } catch(\Exception $e) {
            $conn->rollBack();
            throw $e;
        }
        return new  JsonResponse(['n'=>$n,'l'=>$l,'k0'=>$k0,'k'=>$k]);
```

## Pomiary

Ponieważ nadszedł czas na wykonywanie pomiarów, warto było by stworzyć dla wyników kolejną tabelę nie połączoną z poprzednimi. Powinna ona zawierać czas, parametry i opis mierzonej funkcjonalności. Jednak dla czystości kodu oddzielimy część generującą tabele od wykonującej akcje. Zależy mi też na pogrupowaniu akcji ze względu na to czy stawiają bazę, czy dokonują na niej pomiarów. Oto nowa struktura katalogów jaką zastosujemy.

![katalogi](https://i.imgur.com/HFAxvGJ.png)

Nasz model odpowiedzialny za tworzeniu schematu bazy będzie miał kod wycięty z prywatnych funkcji i własności `DefaultController` oraz jego konstruktora.

> src/AppBundle/Model/SchemaGenerator.php

```php
<?php

namespace AppBundle\Model;

use AppBundle\Controller\BaseController;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\DBAL\Schema\Table;

class SchemaGenerator
```

Nie zmieni się tam nic poza konstruktorem:

```php
    public function __construct($n)
    {
        $this->main = [];
        $this->minor = [];
        $this->N = $n ? $n : BaseController::N;
    }
```

Ustawia on domyślnie `N` na wartość stałej z `BaseController`, albo na wartość podaną przy powoływaniu instancji obiektu. Jak wspomniałem, funkcje `appendMinorToSchema` i `appendMainToSchema` się nie zmieniają. Dochodzi za to funkcja `appendLogToSchema`:

```php
    /**
     * @param $schema Schema
     */
    private function appendLogToSchema($schema)
    {
        $log = $schema->createTable("log");
        $log->addColumn("id", "integer",array("autoincrement"=>true,"unsigned" => true));
        $log->addColumn("n", "smallint",array("unsigned" => true));
        $log->addColumn("l", "smallint",array("unsigned" => true));
        $log->addColumn("k0", "integer",array("unsigned" => true));
        $log->addColumn("k", "integer",array("unsigned" => true));
        $log->addColumn("execution_time", "float");
        $log->addColumn("operation", "string",array());
        $log->setPrimaryKey(array("id"));
    }
```

Będzie to tabela przechowująca wyniki pomiarów z parametrami. Wyposażymy nasz generator w jedną funkcję, która zbinduje poprzednie funkcje ze schematem i zwróci nam gotowy schemat.

```php
    /**
     * @return Schema Schema
     */
    public function generate()
    {
        $schema=new Schema();

        $this->appendMinorToSchema($schema);
        $this->appendMainToSchema($schema);
        $this->appendLogToSchema($schema);

        return $schema;
    }
```

To wszystko, jeśli chodzi o model. Spójrzmy na kontroler bazowy.

```php
<?php

namespace AppBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class BaseController extends Controller
{
    const N = 10;
    const L = 10;
    const K = 1000;
}
```

Jest to nasz kontener na stałe. Sam nie wiem, czy w takim przypadku, nie lepiej było by tego nawet zrobić w parametrach `Symfony`. I pewnie tak zrobię, jeśli dla tego kontrolera nie pojawią się jakieś dodatkowe zastosowania. Tym czasem zostało nam jeszcze dostosowanie `DefaultController`. Przede wszystkim zmieniliśmy jego nazwę (nazwę pliku i klasy) na `PreparationController` aby lepiej odpowiadała jego funkcjonalności. W Metodzie `doAction` usunęliśmy ustawianie zmiennej prywatnej `N` w pierwszej instrukcji warunkowej. Wiąże się to z tym, że wycięliśmy też wszystkie zmienne i funkcje prywatne oraz konstruktor. Trzy linijkową generację schematu zastąpiliśmy linią:

```php
        $schema = (new SchemaGenerator($n))->generate();
```

Na koniec zwiększyliśmy jeszcze bardziej elastyczność metody `mainAction`, ze względu na to, że zainteresowało mnie jakie dokładnie różnice robi ustawianie transakcji przy jakich ilościach wierszy. Dodałem też numer tabeli `main` do routingu, jeśli chcaił bym nie ruszając dużej już wypełnionej tabeli, wykonywać testy na tej drugiej.

```php
    /**
     * @Route("/main")
     * @Route("/main/{n}/{l}/{k}")
     * @Route("/main/{n}/{l}/{k0}/{k}")
     * @Route("/main/{n}/{l}/{k0}/{k}/{main}/{transaction}")
     */
    public function mainAction($n=self::N,$l=self::L,$k=self::K,$k0=1,$main=1,$transaction=true)
    {
        $conn = $this->getDoctrine()->getConnection();
        if($k0==1) { $conn->delete('main_'.$main,[1=>1]); }
        if($k>1e4) {
            set_time_limit(0);
            ini_set("max_execution_time", 0);
        }
        if($transaction) {$conn->beginTransaction();}
        try{
            for($i=$k0;$i<=$k;$i++){                // row in table main
                $content = ['id'=>$i];
                for($j=1;$j<=$n;$j++){            // foreign key of row
                    $content['minor_'.$j.'_id'] = rand(1,$l);
                }
                $conn->insert('main_'.$main, $content);
            }
            if($transaction) {$conn->commit();}
        } catch(\Exception $e) {
            if($transaction) {$conn->rollBack();}
            throw $e;
        }
        return new  JsonResponse(['n'=>$n,'l'=>$l,'k0'=>$k0,'k'=>$k]);
    }
```

Te zmiany pozwalają zapisać wiersze do drugiej tabeli bez transakcji:

```bash
time http -b --timeout=3600 GET localhost:8000/main/10/10/1/10000/2/0
```

Lub z nimi

```bash
time http -b --timeout=3600 GET localhost:8000/main/10/10/1/10000/2/1
```

Dodaliśmy też ustawianie dłuższego czasu wykonywania jeśli ilość zapisywanych wierszy jest odpowiednio duża.

### Hipotezy

Mamy już całkiem insteresujący zbiór zmiennych w naszym modelu. Możemy manipulować liczbą tabel typu `minor` - `N`, liczbą ich kluczy - `L`, ilością wierszy które wstawiamy `k-k0+1` i numerem wiersza od którego zaczynamy `k0`. Możemy też wstawiać wiersze z wykorzystaniem lub bez użycia transakcji. Wadą naszego systemu pomiarowego jest narzut czasu związany z wykonywaniem `doctrine` i reszty `php`, zaletą elastyczność `api`, które wystawiliśmy. Jednak wadę o której wspomniałem jesteśmy w stanie łatwo wyeliminować wykonując odpowiednio długie pomiary. Przez długie mam na myśli długie w stosunku do czasu jaki zajmuje wykonanie kodu nie będącego bezpośrednio operacjami na bazie - łączenie, wczytywanie bibliotek itd. To zadanie od testowania selektów różni się tym, że mamy tu stosunkowo trudne, ale

Testując będziemy zmieniać liczbę małych tabel `n`, 1-63, liczbę ich kluczy `l` od 1-50, liczbę wstawianych wierszy `k` od `1` do `100`.

Interfejs: nazwa\_testu, n,l,k

