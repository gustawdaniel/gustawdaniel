---
title: Continuous Delivery w Gitlab Ci (Docker in Docker)
slug: continous-delivery-w-gitlab-ci-docker-in-docker
publishDate: 1970-01-01T00:00:00.000Z
updateDate: 2021-04-28T14:31:15.000Z
draft: true
canonicalName: continuous-delivery-in-gitlab
---

Skrót CI/CD - ciągła integracja i ciągłe dostarczanie oznaczają, że zamiast manualnego wdrażania systemu na serwer zmiana kodu źródłowego powoduje wykonanie się testów automatycznych i aktualizację systemu na serwerze.

W artykule opiszę korzyści z implementacji tego podejścia oraz konfigurację, której używam w swojej organizacji. Mam nadzieję, że będzie mogła ona posłużyć komuś jako wzór. Być może dzięki waszym komentarzom będę w stanie ją ulepszyć.

![](http://localhost:8484/68814d2a-60aa-4e46-8fce-4fa55fdac395.avif)

## Wartość biznesowa CI/CD

Ten proces ma wiele korzyści. Są to:

* obniżenie kosztu deploymentu \[ automatyzacja \]
* podniesienie bezpieczeństwa wdrożeń \[ uprawnienia \]
* formalizacja procesu \[ testy automatyczne, kopie zapasowe \]
* wgląd do logów z wdrożeń \[ kto, kiedy, co i gdzie wdrożył \]

### Koszty

Wdrożenie aktualizacji systemu na serwer może zajmować od kilku sekund do kilkudziesięciu minut. Zwykle główną część czasu zajmuje kompilacja lub budowanie kodu wynikowego ze źródeł projektu. Często obok samego kodu projektu, należy zaktualizować zmienne środowiskowe, przeinstalować nowe wersje zależnych paczek, wykonać migrację bazy danych, postawić nowe serwisy, a czasem nawet nowe serwery.

Najszybsze w realizacji, ale najdroższe w utrzymaniu jest manualne wykonywanie tych czynności. Rodzi to też ryzyko błędu ludzkiego.

Tańszym w utrzymaniu jest napisanie do tego skryptów, albo konfiguracji i wykonywanie jednego polecenia, aby przeprowadzić pełny deployment.

Najlepszym rozwiązaniem jest CI/CD czyli takie skonfigurowanie systemu, żeby od początku każda zmiana w kodzie załączona w odpowiedniej gałęzi repozytorium powodowała zbudowanie systemu i jego instalację na serwerze.

Wówczas koszty na DevOps ograniczają się do konfigurowania systemu i nie narastają wraz z intensyfikacją częstotliwości wypuszczania poprawek i nowych wersji.

### Bezpieczeństwo

Kiedy pracowałem jako freelancer, jednocześnie pisałem kod i miałem dostęp do danych produkcyjnych. Samodzielne robienie wdrożenia było naturalne. Nie było w tym nic dziwnego, że miałem klucze do wszystkich serwerów.

Jeśli w projekcie pracuje kilka osób i każda z nich, żeby wdrożyć poprawki potrzebuje dostępu do serwera, rodzi to pewne problemy. Trudniejszy staje się zarówno proces nadawania uprawnień jak i ich kontroli.

Bez dawania dostępu wszystkim do wszystkiego mamy z kolei opóźnienia wynikające z oczekiwania aż osoby mające dostęp pobiorą kod i puszczą go na serwer samodzielnie.

Dobrze konfigurując ustawienia repozytorium z kodem możemy wdrożenia uprościć i uszczelnić jednocześnie.

### Formalizacja

Z natury biurokracja i zbędne formalizmy są czymś z czym lepiej walczyć, niż to rozwijać. Natomiast pewne formalne nakładane na procesy pozwalają opanować chaos i uniknąć błędów. Przy wdrażaniu systemów IT na serwer jest to kluczowe.

Wykonanie kopii zapasowej przed migracją bazy. Ograniczenie osób mogących wykonać wdrożenie. Przetestowanie automatyczne oprogramowania przed jego instalacją. Te wszystkie rzeczy można na sztywno określić w konfiguracji aplikacji utrzymującej repozytorium z kodem i plikach na podstawie których przeprowadzane jest wdrożenie.

### Zapis historii

Każda aktualizacja ma dokładną datę, można przejrzeć jej logi. Informacje, kto i kiedy wprowadził system do użytku, jaką miał wersję, jakie wersje miały zależne paczki.

Przy pracy zespołowej pozwala to zorientować się, jaka wersja systemu jest obecnie dostępna na którym środowisku. Często mamy środowiska produkcyjne, testowe i developerskie z różnymi wersjami tego samego oprogramowania.

Dostęp do tych informacji jest bardzo ważny zarówno z powodów formalnych jak i przez ich znaczenie dla wykrywania błędów.

## Jak to skonfigurować

Dostępnych konfiguracji CI/CD jest bardzo dużo. Tutaj zaprezentuję taką, która uniwersalnie może być dzielona przez wszystkie projekty, które robię.

Ceną za tą uniwersalność jest rozbudowany stack technologiczny i więcej warstw abstrakcji, niż jest to niezbędne. Wartością jest przenośność, więc jest duża szansa, że część tej konfiguracji zadziała u Ciebie.

Stack technologiczny:

* gitlab ci
* make
* ansible
* docker

### Schemat działania

Po dołączeniu commita do gałęzi `prod` lub `stag` wykonywana jest komenda `make deploy` ze zmienną środowiskową `ENV` taką jak nazwa gałęzi.

W `makefile` do komendy `deploy` podłączony jest `ansible` z plikiem `hosts` wybieranym na podstawie flagi `ENV`.

Ansible dostaje `ENV` i plik `hosts` dzięki któremu buduje obraz dockerowy, wysyła go do repozytorium obrazów, następnie przygotowuje zmienne środowiskowe, przesyła je na serwer wraz z plikiem `docker-compose.yml`, loguje się na serwer przez `ssh` i przeładowuje obraz.

Wymagane klucze:

* do działania wymagany jest token do repozytorium docker
* musimy mieć klucz prywatny, dla którego klucz publiczny jest umieszczony w `authorized_keys` na serwerze

Dlaczego używamy `make`?

Właściwie to można zagnieździć polecenie `ansible` wewnątrz `.gitlab-ci.yml`, ale dołożenie `make` pozwala na uproszczenie konwencji, która rozciąga się na wszystkie projekty w organizacji.

Konwencja którą przyjąłem pozwala na jej ujednolicenie dla projektów pisanych w `php`, `node`, `python`.

```
make up - podnoszenie wszystkich serwisów do developowania
make deploy - umieszczenie projektu na serwerze
make t - wykonanie testów automatycznych
make ssh - zalogowanie na serwer powiązany z tym projektem
```

### Klucze

Aby wygenerować klucz wykonujemy komendę:

```
ssh-keygen -t ed25519 -f ~/.ssh/ci -q -N ""
```

Utworzy ona dwa pliki - klucz prywatny nie zabezpieczony hasłem:

```
~/.ssh/ci
```

oraz klucz publiczny

```
~/.ssh/ci.pub
```

Klucz publiczny wgrywamy na serwer dołączając jego zawartość do `~/.ssh/authorized_keys` na serwerze.

Klucz prywatny musimy umieścić w zmiennych środowiskowych gitlaba. Nie możemy tego zrobić bezpośrednio, ponieważ wielo-liniowe zmienne nie mogą być maskowane.

![](http://localhost:8484/d9cd5743-abe7-44c9-97b5-335a5b6176c0.avif)

Dzięki poleceniu

```
cat ~/.ssh/ci | base64 -w0
```

możemy dostać klucz zakodowany jako `base64`. Flaga `-w0` pozwala nie zawijać linii

> \-w, --wrap=COLS wrap encoded lines after COLS character (default 76). Use 0 to disable line wrapping

W celu ponownego odkodowania klucz a można użyć flagi `-d`

```
 cat ~/.ssh/ci | base64 -w0 | base64 -d
```

Drugim kluczem jest `DOCKER_TOKEN`. Metoda jego uzyskania zależy od repozytorium dockerowego. Najpopularniejsze to:

* Dockerhub
* Gitlab
* Digital Ocean
* Google Container Registry
* Codefresh Docker Registry

Dla Digital Ocean po wybraniu "Container Registry" wybieramy "Actions" i pobieramy token o uprawnieniach "Read and Write".

![](http://localhost:8484/184c43df-c784-4598-a349-cecb8f8cf622.avif)

### Dodanie zmiennych do Gitlaba

W gitlabie wybieramy grupę lub projekt dla których chcemy ustawić zmienne, przechodzimy do "Settings", "CI/CD", rozwijamy "Variables"

![](http://localhost:8484/9b2de431-c018-42cf-8078-e8d97e9b4186.avif)

Zakodowany klucz widoczny dzięki poleceniu `cat ~/.ssh/ci | base64 -w0` nazwiemy `SSH_PRIVATE_KEY_BASE64`. Ważne, żebyśmy dodając tą zmienną ustawili protected i mask.

![](http://localhost:8484/b18aebd3-23e9-4caf-96ae-40cf9784dd2a.avif)

Poprawnie ustawiając te zmienne zobaczymy tabelę:

![](http://localhost:8484/453f79d5-7412-46e1-9851-c90483eecc83.avif)

Niektóre repozytoria dockera mogą rozróżniać `DOCKER_USER` i `DOCKER_PASSWORD`. Wykorzystanie `DOCKER_TOKEN` jest typowe dla konwencji z Digital Ocean.

### Protected i Masked

W gitlabie mamy możliwość oznaczenia zmiennych jako "protected" lub "masked". Opcja "protected" pozwala na udostępnienie zmiennych jedynie w gałęziach lub tagach, które też oznaczone są jako protected. Pozwala to na przypisanie im uprawnień, określenie, kto może dołączać kod do tych gałęzi, czy wymaga on akceptacji przez właściciela kodu.

![](http://localhost:8484/5ba85090-a33d-4c81-8dd0-ed0e5d9e4639.avif)

Więcej na temat chronionych gałęzi możecie przeczytaj tutaj:

[Protected branches | GitLab](https://docs.gitlab.com/ee/user/project/protected_branches.html)

Druga opcja: "masked" oznacza, że zmienne nie będą widoczne w logach. Muszą spełniać kilka wymagań, między innymi ich wartości powinny mieścić się w jednej linii. Właśnie z tego powodu przetworzyliśmy klucz prywatny na postać zakodowaną przez `base64`.

Pamiętaj, że ta konfiguracja nie zadziała, jeśli nie oznaczysz swoich gałęzi w repozytorium, dla których wykonujesz deployment jako `protected`. Jeśli nie chcesz tego robić, to nie używaj opcji "protected" dla zmiennych środowiskowych.

### Uniwersalny workflow .gitlab-ci.yml

Niezależnie od serwisu, który wdrażam (poza wyjątkiem wtyczek do przeglądarki, czy tych frontów, które trafiają na netlify) zadania są takie same:

1. Potrzebujemy systemu na którym zalogujemy się do rejestru dockera
2. Określimy środowisko na podstawie nazwy gałęzi
3. Przygotujemy się do podłączenia docelowego serwera przez ssh
4. Włączymy `ansible`, żeby wykonał zadania deploymentu:

Te zadania to:

* zbudowanie obrazu dockera
* wypchnięcie obrazu do rejestru
* zalogowanie się na serwer
* przeładowanie obrazu

Poniżej prezentuję plik `.gitlab-ci.yml`, który pozwala to zrobić:

```
variables:
  DOCKER_REGISTRY_DOMAIN: "registry.digitalocean.com"
  DOCKER_HOST: tcp://docker:2375
  DOCKER_TLS_CERTDIR: ""
  DOCKER_DRIVER: overlay2

image: docker:latest

services:
  - docker:dind

.deploy:
  image: archlinux:latest
  stage: deploy
  before_script:
    - pacman -Sy make ansible python python-pip openssh docker --noconfirm
    - docker login -u ${DOCKER_TOKEN} -p ${DOCKER_TOKEN} ${DOCKER_REGISTRY_DOMAIN}
    - pip3 install docker docker-compose
    - eval $(ssh-agent -s)
    - ssh-add <(echo "$SSH_PRIVATE_KEY_BASE64 | base64 -d")
    - mkdir -p ~/.ssh
    - '[[ -f /.dockerenv ]] && echo -e "Host *\n\tStrictHostKeyChecking no\n\n" > ~/.ssh/config'
  script:
    - ENV=${ENV} make deploy

prod:
  extends: .deploy
  variables:
    ENV: prod
  only:
    refs:
      - prod

stag:
  extends: .deploy
  variables:
    ENV: stag
  only:
    refs:
      - stag
```

#### Zmienne

Zmienne na początku to ustawienia dockera.

* `DOCKER_REGISTRY_DOMAIN` pozwala wskazać gdzie ma być przechowywany obraz z aplikacją.
* `DOCKER_HOST` jest wymagane przy konfiguracji `Docker in docker`. Tak zwany `dind`. Pozwala to używać dockera wewnątrz dockerowego egzekutora. Mówi ona kontenerowi aby używał daemona `DinD`.

Jest to bardzo wygodna konfiguracja ponieważ egzekutor dockerowy jest jednym z najbardziej elastycznych i wszechstronnych.

Pełne zestawienie egzekutorów:

[Executors | GitLab](https://docs.gitlab.com/runner/executors/)

Przykładowa minimalna konfiguracja `dind` (bardzo podobna do mojej)

[GitLab CI - Testcontainers](https://www.testcontainers.org/supported_docker_environment/continuous_integration/gitlab_ci/)

Pełna dokumentacja `dind`

[Use Docker to build Docker images | GitLab](https://docs.gitlab.com/ee/ci/docker/using_docker_build.html#use-docker-in-docker-workflow-with-docker-executor)

Brak ustawienia `DOCKER_HOST` będzie powodował błąd:

> Error connecting: Error while fetching server API version: ('Connection aborted.', FileNotFoundError(2, 'No such file or directory'))

* `DOCKER_TLS_CERTDIR` - Wyłącza Dockerowi próbę łączenia się po TLS.
* `DOCKER_DRIVER` - poprawia wydajność i stabliność sterowników dockera do systemu plików

Więcej o tych sterownikach mówi dokumentacja:

[Use the OverlayFS storage driver](https://docs.docker.com/storage/storagedriver/overlayfs-driver/)

#### Obrazy

W naszym pliku mamy jeden obraz:

```
image: docker:latest
```

Często można spotkać się z tym, że w `.gitlab-ci.yml` podłącza się ich więcej. Ma to sens jeśli chcemy tu rozstawić środowisko testowe, albo mamy nie dockerowy deployment w którym budowane są artefakty poza dockerem. W naszym przypadku wszystko jest ukryte na innej warstwie. Gitlab Ci jest traktowany jako inicjator procesu, który przekazuje nazwę środowiska z gałęzi gita, łączy się z repozytorim dockera i zapewnia wstrzyknięcie klucza do łączenia z serwerem.

Odpowiedzialność pliku `.gitlab-ci.yml` jest dzięki temu uniwersalna i nie trzeba w nim większej ilości obrazów.

#### Serwisy

Tak samo jak z obrazami, sytuacja wygląda z serwisami. Jest to tylko jeden `dind`, który pozwala nam przygotować egzekutor dockerowy do budowania obrazu dockerowego.

Dlatego linie z serwisami to jedynie

```
services:
  - docker:dind
```

#### Środowiska

Zmienimy trochę kolejność i przejdziemy do końcówki pliku. Mamy tu wpisy:

```
prod:
  extends: .deploy
  variables:
    ENV: prod
  only:
    refs:
      - prod

stag:
  extends: .deploy
  variables:
    ENV: stag
  only:
    refs:
      - stag
```

Mówią one tylko, żeby włączyć task `.deploy` jeśli gałąź to `stag` lub `prod`. W każdym z przypadków, w tasku `.deploy` dostępna będzie zmienna `ENV` o wartości równej nazwie gałęzi.

#### Deployment

Sam deployment opisany kodem:

```
.deploy:
  image: archlinux:latest
  stage: deploy
  before_script:
    - pacman -Sy make ansible python python-pip openssh docker --noconfirm
#    - docker login
    - docker login -u ${DOCKER_TOKEN} -p ${DOCKER_TOKEN} ${DOCKER_REGISTRY_DOMAIN}
    - pip3 install docker docker-compose
    - eval $(ssh-agent -s)
    - ssh-add <(echo ${SSH_PRIVATE_KEY_BASE64} | base64 -d)
    - mkdir -p ~/.ssh
    - '[[ -f /.dockerenv ]] && echo -e "Host *\n\tStrictHostKeyChecking no\n\n" > ~/.ssh/config'
  script:
    - ENV=${ENV} make deploy
```

składa się z następujących kroków:

##### Wskazanie obrazu źródłowego

Wybraliśmy `archlinux:latest`. Ten uchodzący za jeden z trudniejszych do zainstalowania systemów odwdzięcza się jednym z najprostszych w obsłudze managerów pakietów. Jest w nim praktycznie wszystko. Główne alternatywy to:

* Ubuntu - ze starymi paczkami
* Alpine - bez potrzebnych paczek

Na tym tle arch jest nie do pobicia, tym bardziej, że stosowany jest jako bazowy system na komputerach większości programistów w naszej organizacji.

##### Wskazanie stage

```
  stage: deploy
```

Zarządzanie stages ma sens jeśli proces budowania, deploymentu i testowania są zarządzane na poziomie `.gitlab-ci.yml`. W tym wpisie wyciąłem część z testami automatycznymi i skupiłem się na wdrożeniu.

##### Instalacja zależności

```
- pacman -Sy make ansible python python-pip openssh docker --noconfirm
```

Pacman jest managerem pakietów archa, analogicznie jak `apt` dla `Ubuntu` oraz `apk` dla `Alpine`. Instalujemy następujące pakiety:

* make - potrzebny do wykonania komendy `make deploy`, która pod spodem włączy `ansible`. Gdyby nie ta konwencja, można by to wyrzucić.
* ansible - dużo wygodniejsza alternatywa do automatyzacji deploymentu niż pisanie skryptów w bashu, pozwala na optymalizację wykonywanych akcji dzięki oparciu się o idempotentność operacji.
* python, python-pip - w pythonie napisane jest api dockera, przez które ansible nim zarządza, można je traktować jako paczki wymagane do instalacji wtyczki `community.general.docker_image` ansible
* openssh - to jest pakiet pozwalający na komunikację ssh, wymagany do połączenia się z serwerem
* docker - kluczowy jest docker. Mimo, że stosujemy serwis `docker:dind` daje on tylko możliwość podłączenia się do dockera. Samą aplikcję dockera musimy zainstalować, choć nie będziemy startować deamona dockera, tylko skorzystamy z tego wystawionego z serwisu `docker:dind`.

##### Logowanie do repozytorium obrazów

```
- docker login -u ${DOCKER_TOKEN} -p ${DOCKER_TOKEN} ${DOCKER_REGISTRY_DOMAIN}
```

Ta komenda może różnić się w zależności od repozytorium. Niektóre z nich rozróżniają `DOCKER_USER` i `DOCKER_PASSWORD`. W digital ocean oba nazwane są tak samo - `DOCKER_TOKEN`.

Wynikiem włączenia tego polecenia jest możliwość wysyłania zbudowanego obrazu do repozytorium dockerowego.

##### Instalacja pythonowych sterowników dockera

```
- pip3 install docker docker-compose
```

O tym problemie pisałem kiedyś na stackoverflow:

[ansible returns with “Failed to import the required Python library (Docker SDK for Python: docker (Python >&#x3D; 2.7) or docker-py (Python 2.6))](https://stackoverflow.com/questions/59384708/ansible-returns-with-failed-to-import-the-required-python-library-docker-sdk-f/65495769#65495769)

Dokumentacja omawiająca te wymagania dostępna jest pod linkiem:

[community.docker.docker\_compose – Manage multi-container Docker applications with Docker Compose. — Ansible Documentation](https://docs.ansible.com/ansible/latest/collections/community/docker/docker_compose_module.html#ansible-collections-community-docker-docker-compose-module)

##### Włączenie agenta ssh

```
eval $(ssh-agent -s)
```

Powoduje to uruchomienie agenta ssh w tle i ustawienie odpowiednich zmiennych środowiskowych dla bieżącej powłoki

[ssh keys ssh-agent bash and ssh-add](https://superuser.com/questions/284374/ssh-keys-ssh-agent-bash-and-ssh-add)

##### Dodanie klucza prywatnego

```
- ssh-add <(echo ${SSH_PRIVATE_KEY_BASE64} | base64 -d)
```

Wykonujemy tu dwie operacje:

* odwracamy kodowanie klucza jako base64
* dodajemy ten klucz do agenta ssh

##### Wyłączenie sprawdzania kluczy hosta dla rejestru dockera

```
- mkdir -p ~/.ssh
- '[[ -f /.dockerenv ]] && echo -e "Host *\n\tStrictHostKeyChecking no\n\n" > ~/.ssh/config'
```

Instancja serwera z egzekutorem powstaje na czas budowania i znika zaraz potem. W normalnych sytuacjach łącząc się z nowym serwerem jesli nie mamy go w `known_hosts` dostajemy ostrzeżenie i musimy potwierdzić tą operację.

Jeśli chcemy, żeby proces odbywał się automatycznie, to musimy wyłączyć ten mechanizm.

##### Wykonanie deploymentu

```
  script:
    - ENV=${ENV} make deploy
```

Doszliśmy do końca pliku `.gitlab-ci.yml`. Ostateczna komenda `make deploy` wykonuje budowanie obrazu i deployment. Jej włączenie nie powiodło by się, gdyby nie te wszystkie przygotowawcze kroki, które opisaliśmy powyżej.

## Makefile

Pliki Makefile różnią się w zależności od projektu, ale można przyjąć, że ich struktura jest raczej podobna. Jako przykład podam plik z jednego z projektów:

```
include .env
export

node_modules: package.json
	npm i

up: node_modules
	npm run start

t:
	npm test

generate:
	npx prisma generate

.ONESHELL:
deploy:
	if [ ! -e "hosts.$(ENV)" ]; then printf "Use ENV=stag or ENV=prod before make deploy\n" && exit ; fi;
	ansible-playbook -i hosts.$(ENV) deploy.yml

clean:
	rm index.js helpers/*.js interfaces/*.js test/*.js signals/*.js
```

Jego kluczowa część - `make deploy` składa się z dwóch poleceń:

* sprawdzenia czy `ENV` jest poprawny - wymagany aby istniały pliki `hosts.prod` i `hosts.stag`.
* wykonania playbooku `deploy.yml` za pomocą `ansible` z odpowiednim plikiem `hosts`.

Zobaczymy teraz jaką strukturę mają pliki, których używa `ansible`.

## Pliki Hosts

Plik `hosts.prod` jest bardzo prosty

```
[local]
127.0.0.1 env=prod

[api]
134.xxx.xxx.149 ansible_user=root env=prod
```

analogicznie plik `hosts.stag`

```
[local]
127.0.0.1 env=stag

[api]
134.yyy.yyy.149  ansible_user=root env=stag
```

Definiują one parę hostów, ale oczywiście może być ich czasami więcej. Host lokalny służy do budowania obrazu, a host o nazwie `api`, czasem nazywany przeze mnie `front` to zdalny serwer na który ma trafić obraz aplikacji.

## Playbook Ansible

Do tej pory omówiliśmy `.gitlab-ci.yml` odpowiedzialny za przygotowanie egzekutora. Pokazaliśmy też pliki `hosts` z adresami serwerów docelowych. Teraz zaprezentuję plik `deploy.yml` czyli playbook ansible odpowiedzialny za budowanie i deployment obrazu dockerowego.

```
---
- name: Merge Env
  hosts: local
  connection: local
  tags:
    - deploy
  tasks:
    - name: Prepare env
      shell: "sort -u -t '=' -k 1,1 .env.{{env}} .env > .env.{{env}}.build"
- name: Build Backend
  hosts: local
  connection: local
  tags:
    - build
  tasks:
    - name: Build Image
      community.general.docker_image:
        build:
          path: .
          pull: no
        name: registry.digitalocean.com/main/telegram.ts
        push: true
        source: build
        force_source: yes
      environment:
        DOCKER_BUILDKIT: 1
- name: Deploy Backend
  hosts: api
  tags:
    - deploy
  vars:
    path: /root/telegram.ts
  tasks:
    - name: Creates directory
      file:
        path: "{{ path }}"
        state: directory
    - name: Copy Docker Compose
      copy:
        src: docker-compose.yml
        dest: "{{ path }}/docker-compose.yml"
    - name: Copy .env
      copy:
        src: "./.env.{{ env }}.build"
        dest: "{{ path }}/.env"
    - name: Reload Compose
      community.general.docker_compose:
        pull: yes
        project_src: "{{ path }}"
```

Zawiera on parę kontrowersyjnych fragmentów i wciąż nie jest idealny. Dlatego omówię go szczegółowo wskazując gdzie i na jakie kompromisy poszedłem przygotowując go.

Najbardziej problematyczna częścią jest tu zarządzanie zmiennymi środowiskowymi i sekretami. W obecnej formie w repozytorium znajdują się pliki `.env`, `.env.prod` oraz `.env.stag`. Dwa ostatnie nadpisują ustawienia z pierwszego. Pierwszy task "Prepare env" odpowiada za zbudowanie pliku `.env.stag.build` lub `.env.prod.build`.

```
- name: Merge Env
  hosts: local
  connection: local
  tags:
    - deploy
  tasks:
    - name: Prepare env
      shell: "sort -u -t '=' -k 1,1 .env.{{env}} .env > .env.{{env}}.build"
```

Dlaczego uważam, że to problematyczna część? Przede wszystkim dlatego, że w tych plikach znajdują się hasła i klucze. Jestem przekonany, że nie powinny się one znajdować w repozytorium, ale problemy związane z ich bezpiecznym współdzieleniem w ramach organizacji nie zostały jeszcze rozwiązane.
