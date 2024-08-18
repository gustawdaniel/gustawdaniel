---
author: Daniel Gustaw
canonicalName: aplikacja-z-fosuserbundle-i-api-google-maps
date_updated: 2021-06-22 09:23:37+00:00
description: "Prosta apka integruj\u0105ca fos user bundle z google maps. Serwis pozwala\
  \ na logowanie, rejestrację oraz zapisywanie swojej listy lokalizacji walidowanych\
  \ przez api od google."
excerpt: "Prosta apka integruj\u0105ca fos user bundle z google maps. Serwis pozwala\
  \ na logowanie, rejestrację oraz zapisywanie swojej listy lokalizacji walidowanych\
  \ przez api od google."
publishDate: 2021-05-18 20:50:00+00:00
slug: pl/aplikacja-z-fosuserbundle-i-api-google-maps
tags:
- symfony
- fosuserbundle
- google maps
- twig
- css
title: Aplikacja z FOSUserBundle i API Google Maps
---


## Opis projektu

Jest to projekt napisany jako jedna z funkcjonalności podczas mojej współpracy z `Smartselect`. Najzabawniejsze jest to, że był to mój pierwszy kontakt z `FOSUserBundle`, `Api Google Maps` i obiektem `navigator`. Kiedy go pisałem nie znałem `JavaScriptu`. Mimo, że przed publikacją kod wymagał odrobiny odświeżenia i dokładnego oddzielenie od innych funkcjonalności całej aplikacji, okazało się, że nie było to trudne i w tym wpisie przedstawiłem jak plik po pliku zbudować go od zera.

Z wpisu dowiesz się jak zainstalować, skonfigurować i nadpisywać `FOSUserBundle` - najpopularniejszą paczkę do obsługi użytkowników w `Symfony`. Stworzymy kilka widoków związanych z logowaniem, rejestracją, zarządzaniem kontem, resetowaniem hasła i tak dalej. Jeśli lubisz front, to przez większość tego wpisu będziesz czuł się jak ryba w wodzie. Do backendu zejdziemy przy logice aplikacji, czyli wykorzystywaniu `API Google Maps` do tłumaczenia tekstowych adresów, albo współrzędnych na encje naszej bazy danych. Nie zabraknie Ajaxa, zobaczymy jak obiekt `navigator` pozwala nam dostać się do połorzenia przeglądarki oraz jak pogodzić twiga i JavaScript w jednym froncie.

Działanie aplikacji możesz zobaczyć na poniższym video:

Skład kodu źródłowego to:

```
PHP 69.7% HTML 20.9% CSS 5.8% ApacheConf 3.1% JavaScript 0.5%
```

## Instalacja

Są dwa sposoby stawiania nowego projektu Symfony: [instalacja od zera](http://symfony.com/doc/current/best_practices/creating-the-project.html) oraz klonowanie z githuba.

Jeśli chcesz zainstalowawć projekt najprostszym możliwym sposobem, możesz pobrać go z [githuba](https://github.com/gustawdaniel/geo_local)
i zainstalować go zgodnie z instrukcją z `README.md`.

W tym wpisie pokażę jak instalować projekt od zera. Możesz nie zaglądać do mojego repo i wykonując wszystkie komendy i tworząc poniższe pliki powinienneś otrzymać praktycznie to samo. Jedyne różnice będą polagać na tym, że na blogu dla większej przjejrzystości nie umieściłem kilku i tak nie używanych widoków jak panel admina czy kontakt.

Wracając do instalacji. Jeśli chcesz instalować od zera to dokumentacja Symfony zaleca użycie jej instalatora.

```
symfony new geo_local && cd geo_local
```

## FosUserBundle

Będziemy chcieli stworzyć użytkowników. W tym celu wykorzystamy jedną z najpopularniejszych paczek - [FOSUserBundle](https://symfony.com/doc/master/bundles/FOSUserBundle/index.html).

```
composer require friendsofsymfony/user-bundle "~2.0@dev"
```

Żeby ją wykorzystać musimy zarejestrować ją a jądrze aplikacji poprzez dodanie elementu: `new FOS\UserBundle\FOSUserBundle()` do tablicy `$bundles` w pliku `app/AppKernel.php`.

Następnie rozszerzamy klasę `BaseUser` żeby móc modyfikować klasę opisującą Użytkowników (zakładam, że będziemy korzystać z mysql, dla innych silników baz danych konfiguracja może wyglądać trochę inaczej):

```php
<?php

namespace AppBundle\Entity;

use FOS\UserBundle\Model\User as BaseUser;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="users")
 */
class User extends BaseUser
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    public function __construct()
    {
        parent::__construct();
        // your own logic
    }
}
```

Zmieniamy zawartość pliku: `app/config/security.yml`

```yml
security:
    encoders:
        FOS\UserBundle\Model\UserInterface: bcrypt

    role_hierarchy:
        ROLE_ADMIN:       ROLE_USER
        ROLE_SUPER_ADMIN: ROLE_ADMIN

    providers:
        fos_userbundle:
            id: fos_user.user_provider.username

    firewalls:
        main:
            pattern: ^/
            form_login:
                provider: fos_userbundle
                csrf_token_generator: security.csrf.token_manager
                # if you are using Symfony < 2.8, use the following config instead:
                # csrf_provider: form.csrf_provider

            logout:       true
            anonymous:    true

    access_control:
        - { path: ^/login$, role: IS_AUTHENTICATED_ANONYMOUSLY }
        - { path: ^/register, role: IS_AUTHENTICATED_ANONYMOUSLY }
        - { path: ^/resetting, role: IS_AUTHENTICATED_ANONYMOUSLY }
        - { path: ^/admin/, role: ROLE_ADMIN }
```

Na koniec w pliku `app/config/config.yml` odkomentowujemy linię zawierającą wpis `#translator: { fallbacks: ["%locale%"] }`. I na końcu dodajemy:

```yml
fos_user:
    db_driver: orm
    firewall_name: main
    user_class: AppBundle\Entity\User
```

Powinniśmy też dodać dwie linie do routingu `app/config/routing.yml`:

```yml
fos_user:
    resource: "@FOSUserBundle/Resources/config/routing/all.xml"
```

Żeby wszystko działało powinniśmy jeszcze ustawić sobie parametry połączenia z bazą danych. W moim przypadku sprowadza się to do ustawienia: wpisu `database_name: geo_local` w plikach: `app/config/parameters.yml` i `app/config/parameters.yml.dist`.

Tworzymy bazę danych i potrzebne tabele za pomocą komend:

```bash
php bin/console doctrine:database:create
php bin/console doctrine:schema:update --force
```

Teraz wszystko powinno działać. Mam na myśli, że po uruchomieniu serwera komendą `php bin/console server:run` i wpisaniu w przeglądarkę adresu `127.0.0.1:8000/login` zobaczymy coś takiego:

![domyślny_login_fos_user_bundle](http://i.imgur.com/cCUzKD4.png)

### Nadpisywanie zachowania FOSUserBundle

Mamy teraz dwa problemy, pierwszy, że nie wygląda to ładnie, drugi, że chcemy zamiast `username` używać `email`, a po zalogowaniu chcemy dodać nasze własne przekierowanie. Zaczniemy od logiki, a front zostawimy na później.

#### Zastąpienie `username` przez `e-mail`

Bardzo czytelną instrukcję pozbywania się pola `username` można znaleźć na [stacku](http://stackoverflow.com/questions/8832916/remove-replace-the-username-field-with-email-using-fosuserbundle-in-symfony2). W klasie `User` nadpisujemy setter dla pola e-mail.

```php
public function setEmail($email)
{
    $email = is_null($email) ? '' : $email;
    parent::setEmail($email);
    $this->setUsername($email);

    return $this;
}
```

Nie podążymy jednak za tą instrukcję zbyt dosłownie, dlatego, że w oficjalnej dokumentacji można wyczytać między wierszami lepszy sposób. Wspomagając się dokumentacją [nadpisywania formularzy](http://symfony.com/doc/master/bundles/FOSUserBundle/overriding_forms.html), tworzymy plik `src/AppBundle/Form/RegistrationType.php` który nadpisze nam domyśny formularz rejestracji. Przy rejestracji chcemy wymagać od użytkownika tylko jednego hasła, dlatego upieczemy dwie pieczenie na jednym ogniu nadpisując ten formulaż. Oto treść pliku:

```php
<?php
namespace AppBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;

class RegistrationType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->remove('username')
            ->remove('plainPassword')
            ->add('plainPassword',PasswordType::class);
    }

    public function getParent()
    {
        return 'FOS\UserBundle\Form\Type\RegistrationFormType';
    }

    public function getBlockPrefix()
    {
        return 'app_user_registration';
    }
}
```

Usuwając i dodając hasło pozbywamy się dość ciekawej i zaawansowanej sztuczki z powtarzaniem tego pola, jaką stosuje `FOSUserBundle`. Analogicznie nadpisujemy edycję profilu `src/AppBundle/Type/ProfileType.php`:

```php
<?php
namespace AppBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;

class ProfileType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->remove('username');
    }

    public function getParent()
    {
        return 'FOS\UserBundle\Form\Type\ProfileFormType';
    }

    public function getBlockPrefix()
    {
        return 'app_user_profile';
    }
}
```

Rejestrujemy nasze formularze jako usługi modyfikując plik `app/config/services.yml`:

```yml
services:
    app.form.registration:
        class: AppBundle\Form\RegistrationType
        tags:
            - { name: form.type, alias: app_user_registration }
    app.form.profile:
        class: AppBundle\Form\ProfileType
        tags:
            - { name: form.type, alias: app_user_profile }
```

Na końcu w konfiguracji paczki ustawiamy nasze formularze jako te, które mają nadpisać domyślne.

```yml
fos_user:
    db_driver: orm
    firewall_name: main
    user_class: AppBundle\Entity\User
    registration:
        form:
            type: AppBundle\Form\RegistrationType
    profile:
        form:
            type: AppBundle\Form\ProfileType
```

Nie ruszamy w ogóle walidacji. Należy pamiętać, że [link](http://stackoverflow.com/questions/8832916/remove-replace-the-username-field-with-email-using-fosuserbundle-in-symfony2) z instrukcją odnosił się do wersji 2 Symfony, a w naszym projekcie używamy 3.

#### Przekierowanie po logowaniu

Domyślnie po zalogowaniu `FOSUserBundle` przekierowuje nas do profilu użytkownika. Jest to logiczne, ale nie praktyczne w naszym przypadku. Główna funkcjonalność aplikacji nie będzie polegała na zmienianiu swojego e-maila i hasła. Zamiast tego chcemy przekierować użytkownika do ścieżki nazywanej `homepage`, a dopiero jej kontroler będzie wysyłał zalogowanych do panelu z miejscami, a nie zalogowanych do strony informacyjnej. Żeby po zalogowaniu móc przekierować użytkownika do `homepage` wykonamy następujące zmiany: dodamy plik `src/AppBundle/Security/LoginSuccessHandler.php` o treści:

```php
<?php
namespace AppBundle\Security;

use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\Routing\Router;

class LoginSuccessHandler implements AuthenticationSuccessHandlerInterface {

    protected $router;
    protected $authorizationChecker;

    public function __construct(Router $router, AuthorizationChecker $authorizationChecker) {
        $this->router = $router;
        $this->authorizationChecker = $authorizationChecker;
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token) {
        return new RedirectResponse($this->router->generate('homepage'));
    }
}
```

W serwisach (`app/config/services.yml`) powinniśmy dodać usługę:

```yml
    authentication.handler.login_success_handler:
        class:  AppBundle\Security\LoginSuccessHandler
        arguments:  ['@router', '@security.authorization_checker']
```

Powinniśmy dodać parametr `success_handler` do pliku `app/config/security.yml`

```yml
    firewalls:
        main:
            pattern: ^/
            form_login:
                provider: fos_userbundle
                csrf_token_generator: security.csrf.token_manager
                success_handler: authentication.handler.login_success_handler
```

### Nadpisanie wyglądu FOSUserBundle

Teraz mając odpowiednią ilość pól w formularzu możemy zmienić wygląd, tak, żeby nie straszył, i nie powodował koszmarów u użytkowników. Listę ścieżek jakimi powinniśmy się zająć wyświetlimy komendą:

```bash
php bin/console debug:router | grep fos_user
```

Najprostszą metodą nadpisania domyślnego wyglądu jest wykonanie następującej komendy.

```bash
mkdir -p app/Resources/FOSUserBundle/views && cp -r vendor/friendsofsymfony/user-bundle/Resources/views/* "$_"
```

#### Dodawanie zewnętrznych bibliotek

Zainstalujemy teraz biblioteki frontowe i dodamy nasze własne style oraz skrypty.
Żeby nie było problemów z cache twiga, wyłączymy go w trybie deweloperskim dodając do pliku `app/config/config_dev.yml` linie:

```yml
twig:
    cache: false
```

Twożymy plik `.bowerrc` o treści:

```json
{
  "directory": "web/bower_components/"
}
```

Inicjalizujemy bowera komendą:

```
bower init
```

Instalujemy bootstrapa 3, animate.css, components-font-awesome, jQuery i iCheck - małą bibliotekę opartą na jQuery do wyświetlania efektów związanych z zaznaczaniem pól formularzy i checkboxów:

```
bower install --save bootstrap#^3.3.7 animate.css#^3.5.2 components-font-awesome#^4.7.0 iCheck#^1.0.2 jquery#^3.1.1
```

Do `.gitignore` dodajemy linie:

```
/.idea
/web/bower_components
```

Nie jestem dobrym frontowcem, dlatego kupuję fronty. Tak było i w tym przypadku. CSS, który załączam kupiłem na stronie
[wrapbootstrap.com](https://wrapbootstrap.com/theme/eternity-forms-WB0G8810G). Wyciąłem z niego połowę nie wykorzystywanej
funkcjonalności i zmieniłem linki do skinów `iCheck`. Umieściłem plik `css` w lokacji `src/AppBundle/Resources/public/css/forms.css`.

```css
.eternity-form-modal {
  background-color: #707d85;
}
.eternity-form {
  font-family: 'Roboto', 'PT Sans', sans-serif;
  font-weight: 300;
  color: #95a5a6;
}
.eternity-form h1,
.eternity-form h2,
.eternity-form h3,
.eternity-form h4,
.eternity-form h5,
.eternity-form h6 {
  font-family: 'Roboto', 'PT Sans', sans-serif;
  font-weight: 300;
}
.eternity-form .login-form-section,
.eternity-form .forgot-password-section {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}
.eternity-form .login-content,
.eternity-form .forgot-password-section,
.eternity-form .reg-content {
  background-color: white;
  -o-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  -ms-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  -moz-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  -webkit-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
}
.eternity-form .section-title {
  padding: 10px 20px;
  background-color: white;
}
.eternity-form .section-title h3 {
  color: #3498db;
}
.eternity-form .textbox-wrap {
  padding: 20px 20px 20px 15px;
  border-left: 5px solid transparent;
  -moz-transition: border-left-color 0.5s, box-shadow 0.5s, background-color 0.5s;
  -o-transition: border-left-color 0.5s, box-shadow 0.5s, background-color 0.5s;
  -webkit-transition: border-left-color 0.5s, box-shadow 0.5s, background-color 0.5s;
  transition: border-left-color 0.5s, box-shadow 0.5s, background-color 0.5s;
}
.eternity-form .textbox-wrap .input-group {
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
}
.eternity-form .textbox-wrap .input-group .input-group-addon,
.eternity-form .textbox-wrap .input-group input,
.eternity-form .textbox-wrap .input-group .form-control {
  background-color: transparent;
  border: none;
}
.eternity-form .textbox-wrap .input-group input,
.eternity-form .textbox-wrap .input-group .form-control,
.eternity-form .textbox-wrap .input-group input:focus,
.eternity-form .textbox-wrap .input-group .form-control:focus {
  box-shadow: none;
  outline: none;
}
.eternity-form .textbox-wrap .input-group i {
  color: #cccccc;
}
.eternity-form .textbox-wrap.focused {
  border-left-color: #3498db;
  background-color: #f0f0f0;
  -o-box-shadow: inset 0 0 3px rgba(0,0,0,.1);
  -ms-box-shadow: inset 0 0 3px rgba(0,0,0,.1);
  -moz-box-shadow: inset 0 0 3px rgba(0,0,0,.1);
  -webkit-box-shadow: inset 0 0 3px rgba(0,0,0,.1);
  box-shadow: inset 0 0 3px rgba(0,0,0,.1);
}
.eternity-form .green-btn,
.eternity-form .green-btn:hover,
.eternity-form .blue-btn {
  background-color: #2ecc71;
  border: none;
}
.eternity-form .blue-btn,
.eternity-form .blue-btn:hover {
  background-color: #2980b9;
}
.eternity-form .login-form-action {
  padding: 15px 20px 30px 20px;
}
.eternity-form input[type="checkbox"] {
  width: 30px;
}
.eternity-form .blue {
  color: #3498db;
}
.eternity-form .green {
  color: #2ecc71;
}
.eternity-form .login-form-links {
  padding: 20px;
  margin-top: 5px;
  -o-box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
  -ms-box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
  -moz-box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
  -webkit-box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
  background-color: white;
}
.eternity-form .login-form-links a.blue:hover,
.eternity-form .login-form-links a a.blue:focus {
  color: #3498db;
  text-decoration: underline;
}
.eternity-form .login-form-links a.green:hover,
.eternity-form .login-form-links a a.green:focus {
  color: #2ecc71;
  text-decoration: underline;
}
.eternity-form .forget-form-action {
  padding: 20px;
}
.eternity-form .registration-form-section {
  max-width: 620px;
  margin: 0 auto;
  width: 100%;
}
.eternity-form .reg-header {
  -o-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  -ms-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  -moz-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  -webkit-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
}
.eternity-form .registration-left-section {
  padding-left: 0;
  padding-right: 2px;
}
.eternity-form .registration-right-section {
  padding-left: 2px;
  padding-right: 0;
}
.eternity-form .reg-content {
  margin-top: 5px;
  padding: 20px 0;
}
.eternity-form .registration-form-action {
  margin-top: 5px;
  padding: 20px;
  -o-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  -ms-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  -moz-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  -webkit-box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  background-color: white;
}
.eternity-form .custom-checkbox {
  float: left;
}
.eternity-form .checkbox {
  display: inline-block;
  padding-left: 1px;
  margin-top: 7px;
  margin-bottom: 0;
}
.eternity-form .checkbox-text {
  line-height: 24px;
  padding-left: 5px;
}
.eternity-form .form-control:-moz-placeholder {
  font-weight: 300;
}
.eternity-form .form-control::-moz-placeholder {
  font-weight: 300;
}
.eternity-form .form-control:-ms-input-placeholder {
  font-weight: 300;
}
.eternity-form .form-control::-webkit-input-placeholder {
  font-weight: 300;
}

.eternity-form .checkbox label {
  font-weight: 300;
}

.eternity-form .icheckbox_square-blue {
  display: block;
  margin: 0;
  padding: 0;
  width: 22px;
  height: 22px;
  /*background: url(../img/blue.png) no-repeat;*/
  background: url("../../../bower_components/iCheck/skins/square/blue.png") no-repeat;
  border: none;
  cursor: pointer;
}
.eternity-form .icheckbox_square-blue {
  background-position: 0 0;
}
.eternity-form .icheckbox_square-blue.hover {
  background-position: -24px 0;
}
.eternity-form .icheckbox_square-blue.checked {
  background-position: -48px 0;
}
.eternity-form .icheckbox_square-blue.disabled {
  background-position: -72px 0;
  cursor: default;
}
.eternity-form .icheckbox_square-blue.checked.disabled {
  background-position: -96px 0;
}

@media only screen and (-webkit-min-device-pixel-ratio: 1.5), only screen and (-moz-min-device-pixel-ratio: 1.5), only screen and (-o-min-device-pixel-ratio: 3/2), only screen and (min-device-pixel-ratio: 1.5) {
  .eternity-form .icheckbox_square-blue {
    background-image: url("../../../bower_components/iCheck/skins/square/blue@2x.png");
    -webkit-background-size: 240px 24px;
    background-size: 240px 24px;
  }
}
@media (max-width: 767px) {
  .eternity-form .registration-left-section {
    padding-right: 0;
  }
  .eternity-form .registration-right-section {
    padding-left: 0;
  }
}
@media (max-width: 380px) {
  .eternity-form .blue-btn,
  .eternity-form .green-btn {
    font-size: .8em;
  }
}
```

Potrzebujemy jeszcze jednego skryptu - `src/AppBundle/Resources/public/js/iCheck-config.js` jest to konfiguracja wtyczki `iCheck` służącej do interaktywnego podświetlania aktywnych pól formularz:

```js
    $(function () {

        //Custom Checkbox For Light Theme
        $("input").iCheck({
            checkboxClass: 'icheckbox_square-blue',
            increaseArea: '20%'
        });

        //Custom Checkbox For Dark Theme
        $(".dark input").iCheck({
            checkboxClass: 'icheckbox_polaris',
            increaseArea: '20%'
        });

        //TextBox Focus Event
        $(".form-control").focus(function () {
            $(this).closest(".textbox-wrap").addClass("focused");
        }).blur(function () {
            $(this).closest(".textbox-wrap").removeClass("focused");
        });

    });
```

Linkujemy go z katalogiem `web` komendą

```
php bin/console assets:install --symlink
```

Nie jest to najlepsza dostępna metoda. Lepszą jest zastosowanie `gulpa`, ale jest najprostsza. Przy trzech kilku plikach styli i skryptów i kilku zewnętrznych bibliotekach brak konkatenacji i minifikacji nie jest niczym strasznym. Oczywiście tworzenie pliku ze stylami bezpośrednio w katalogu web jest prostsze, ale niepoprawne.

Ostatnią rzeczą jaka została nam do zrobienia jest dodanie bootstrapowych formularzy jako domyślnych dla twiga, w pliku `app/config/config.yml` dodajemy linie:

```yml
twig:
    form_themes:
        - 'bootstrap_3_layout.html.twig'
```

#### Szablon bazowy

Zaczniemy od dostosowania wyglądu loginu. Login będzie dziedziczył z `layout.html.twig` z FOSUserBundle, a ten będzie dziedziczył z `base.html.twig`. Żeby więc budować dom od fundamentów, nie od dachu, przyjrzymy się bazowemu szablonowi - `app/Resources/views/base.html.twig`.

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8"/>
    <title>{% block title %}Welcome!{% endblock %}</title>
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    {% block meta %}{% endblock %} {% block stylesheets %}       <!-- Bootstrap 3 CSS -->
    <link rel="stylesheet" href="{{ asset('bower_components/bootstrap/dist/css/bootstrap.min.css') }}">
    <!-- Eternity Login , Registration & Forgot Password Forms CSS -->
    <link href="{{ asset('bundles/app/css/forms.css') }}" rel="stylesheet"/>
    {% endblock %}
</head>

<body> {% block body %}
<nav class="navbar navbar-default">
    <div class="container">
        <div class="navbar-header">
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar"
                    aria-expanded="false" aria-controls="navbar"><span class="sr-only">Toggle navigation</span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </button>

            <div class="{% if app.request.attributes.get('_route') == 'homepage' %}active{% endif %}">
                <a class="navbar-brand" href="{{ url('homepage') }}">Places</a>
            </div>

        </div>
        <!-- Collect the nav links, forms, and other content for toggling -->
        <div class="collapse navbar-collapse" id="navbar">
            <ul class="nav navbar-nav navbar-right"> {% if app.user %}

                <li class="{% if app.request.attributes.get('_route') == 'fos_user_profile_show' %}list-group-item-info{% endif %}">
                    <a href="{{ url('fos_user_profile_show') }}" data-toggle="tooltip"
                       data-placement="bottom"
                       title="{{ 'layout.logged_in_as'|trans({'%username%': app.user.username}, 'FOSUserBundle') }}">
                        My Acconut
                    </a>
                </li>

                <li><a href="{{ url('fos_user_security_logout') }}">Logout</a></li>
                {% else %}
                <li class="{% if app.request.attributes.get('_route') == 'fos_user_security_login' %}active{% endif %}">
                    <a href="{{ url('fos_user_security_login') }}">Login</a>
                </li>

                <li class="list-group-item-info {% if app.request.attributes.get('_route') == 'fos_user_registration_register' %}active{% endif %}">
                    <a href="{{ url('fos_user_registration_register') }}">Register</a>
                </li>
                {% endif %}
            </ul>

        </div><!-- /.navbar-collapse -->
    </div><!-- /.container-fluid -->
</nav>
{% endblock %} {% block javascripts %}
<script src="{{ asset('bower_components/jquery/dist/jquery.min.js') }}"></script>

<script src="{{ asset('bower_components/bootstrap/dist/js/bootstrap.min.js') }}"></script>
{% endblock %}
</body>
</html>
```

Co my tu mamy? Jest `viewport` - strona działa na urządzeniach mobilnych. Podpinamy style, które mają się znaleźć wszędzie - bootstrap i forms. Dodaliśmy skrypty - jQuery i bootstrap. Nie ma tu potrzeby ładownia skryptów typu `iCheck` alby styli jak `animate.css` jeśli nie każda strona będzie ich potrzebować. Nie chcemy przecież zirytować użytkownika ciągłym animowaniem wszystkiego, tylko ucieszyć go animacjami przy logowaniu lub rejestracji - to wystarczy. Tag `<body>` zawiera jedynie pasek nawigacji. Nawigacja jednak posiada logikę odpowiadającą za wyświetlanie nie zalogowanemu użytkownikowi pól "login" i "rejestracja", a zalogowanemu "moje konto" i "wyloguj".

#### Layout dla FOSUserBundle

Teraz przyjrzymy się plikowi `app/Resources/FOSUserBundle/layout.html.twig` - czyli szablonowi, który dziedziczy z `base` i jest jednocześnie rodzicem dla wszystkiego co będziemy nadpisywali w `FOSUserBundle`:

```twig
{% extends '::base.html.twig' %}

{% block title %}{% endblock %}

{% block body %}
    {{ parent() }}
    {% block fos_user_content %}{% endblock fos_user_content %}
{%  endblock %}

{% block stylesheets %}
    {{ parent() }}

    <!-- Animations CSS -->
    <link rel="stylesheet" href="{{ asset('bower_components/animate.css/animate.min.css') }}">

    <!-- Font Icons -->
    <link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN" crossorigin="anonymous">

    <!-- Google Web Fonts -->
    <link href='http://fonts.googleapis.com/css?family=Roboto:400,300' rel='stylesheet' type='text/css'>

    <style>
        .eternity-form {
            margin-top: 6vh;
        }

        .width-min-300px {
            width: 100%;
            max-width: 300px;
        }
    </style>
{% endblock %}

{% block javascripts %}
    {{ parent() }}
    <!-- Custom Checkbox PLugin -->
    <script src="{{ asset('bower_components/iCheck/icheck.min.js') }}"></script>

    <!-- For Initializing Checkbox And Focus Event For Textbox -->
    <script src="{{ asset('bundles/app/js/iCheck-config.js') }}"></script>
{% endblock %}
```

W tym pliku dodaliśmy style i skrypty potrzebne tylko przy obsłudze użytkownika oraz podpięliśmy blok `fos_user_content` bezpośrednio pod nawigacją zapisaną w `base.html.twig`.

#### Login

Plik `app/Resources/FOSUserBundle/views/Security/login.html.twig` pozostawiamy praktycznie nie zmieniony, dodjemy jedynie tytuł:

```twig
{% extends "@FOSUser/layout.html.twig" %}

{% block fos_user_content %}
    {{ include('@FOSUser/Security/login_content.html.twig') }}
{% endblock fos_user_content %}

{% block title %}Login Form{% endblock %}
```

Dużo więcej kodu zostało dodanego w pliku `app/Resources/FOSUserBundle/views/Security/login_content.html.twig`

```twig
{% trans_default_domain 'FOSUserBundle' %}

<div class="container eternity-form">
    <div class="login-form-section">
        <div class="login-content animated zoomIn">
            <form action="{{ path("fos_user_security_check") }}" method="post">
                {% if csrf_token %}
                    <input type="hidden" name="_csrf_token" value="{{ csrf_token }}" />
                {% endif %}
                <div class="section-title">
                    <h3>LogIn to your Account</h3>
                </div>
                <div class="textbox-wrap">
                    <div class="input-group">
                        <span class="input-group-addon "><i class="fa fa-user" aria-hidden="true"></i></span>
                        <input type="email" id="username" name="_username" value="{{ last_username }}"
                               required="required" class="form-control" placeholder="{{ 'form.email'|trans }}" />
                    </div>
                </div>
                <div class="textbox-wrap">
                    <div class="input-group">
                        <span class="input-group-addon "><i class="fa fa-key" aria-hidden="true"></i></span>
                        <input type="password" id="password" name="_password" required="required" class="form-control " placeholder="{{ 'security.login.password'|trans }}"/>
                    </div>
                </div>
                <div class="login-form-action clearfix">
                    <div class="checkbox pull-left">
                        <div class="custom-checkbox">
                            <input type="checkbox" id="remember_me" name="_remember_me" value="on" checked />
                        </div>
                        <span class="checkbox-text pull-left">&nbsp;{{ 'security.login.remember_me'|trans }}</span>
                    </div>
                    <button type="submit" id="_submit" name="_submit" class="btn btn-success pull-right green-btn">LogIn &nbsp;<i class="fa fa-chevron-right" aria-hidden="true"></i></button>
                </div>
            </form>
        </div>

        {% if error %}
            <div class="login-form-links link1 animated fadeInUpBig text-danger">
                <h4>Error</h4>
                <p>
                    {{ error.messageKey|trans(error.messageData, 'security') }}
                </p>
            </div>
        {% endif %}

        <div class="login-form-links link1 animated fadeInLeftBig">
            <h4 class="blue">Don't have an Account?</h4>
            <span>No worry</span>
            <a href="{{ path('fos_user_registration_register') }}" class="blue">Click Here</a>
            <span>to Register</span>
        </div>
        <div class="login-form-links link2 animated fadeInRightBig">
            <h4 class="green">Forget your Password?</h4>
            <span>Dont worry</span>
            <a href="{{ path('fos_user_resetting_request') }}" class="green">Click Here</a>
            <span>to Get New One</span>
        </div>
    </div>
</div>
```

Jednak, jest to tylko front - formularz logowania i dwa linki w twigu. A ponieważ o frontach obraz mówi więcej niż tysiąc słów więc zamiast go opisywać wklejam screen:

![login](http://i.imgur.com/avrKaZd.png)

#### Rejestracja

Rejstracja wygląda podobnie.
Plik: `app/Resources/FOSUserBundle/views/Registration/register.html.twig`

```twig
{% extends "@FOSUser/layout.html.twig" %}

{% block fos_user_content %}
{% include "@FOSUser/Registration/register_content.html.twig" %}
{% endblock fos_user_content %}

{% block title %}Register{% endblock %}
```

Plik: `app/Resources/FOSUserBundle/views/Registration/register_content.html.twig`

```twig
{% trans_default_domain 'FOSUserBundle' %}

<div class="container eternity-form">
    <div class="registration-form-section">
            {{ form_start(form, {'method': 'post', 'action': path('fos_user_registration_register'), 'attr': {'class': 'fos_user_registration_register'}}) }}

            <div class="section-title reg-header animated fadeInDown">
                <h3>Get your Account Here </h3>

            </div>
            <div class="clearfix">
                <div class="col-sm-6 registration-left-section  animated fadeInRightBig">
                    <div class="reg-content">
                        <div class="textbox-wrap">
                            <div class="input-group">
                                <span class="input-group-addon "><i class="fa fa-user" aria-hidden="true"></i></span>
                                {{ form_widget(form.email, {'attr': {'placeholder': 'Email'}}) }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-sm-6 registration-right-section animated fadeInLeftBig">
                    <div class="reg-content">
                        <div class="textbox-wrap">
                            <div class="input-group">
                                <span class="input-group-addon "><i class="fa fa-key" aria-hidden="true"></i></span>
                                {{ form_widget(form.plainPassword, {'attr': {'placeholder': 'Password'}}) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="registration-form-action clearfix animated fadeInUp">
                <a href="{{ path('fos_user_security_login') }}" class="btn btn-success pull-left blue-btn ">
                    <i class="fa fa-chevron-left"></i>&nbsp; &nbsp;Back To Login
                </a>
                <button type="submit" class="btn btn-success pull-right green-btn ">Register Now &nbsp; <i class="fa fa-chevron-right"></i></button>
            </div>
        {{ form_end(form) }}
    </div>
</div>
```

Efekt:

![register](http://i.imgur.com/i9BZooS.png)

Jeśli rejestracja przebiega pomyślnie, gratulujemy użytkonikowi komunikatem z pliku: `app/Resources/FOSUserBundle/views/Registration/confirmed.html.twig`

```twig
{% extends "@FOSUser/layout.html.twig" %}

{% trans_default_domain 'FOSUserBundle' %}

{% block fos_user_content %}
    <div class="container eternity-form">
        <div class="section-title reg-header">
            <h3>Registration finished correctly</h3>
            <div>
                <p>{{ 'registration.confirmed'|trans({'%username%': user.username}) }}</p>
                {% if targetUrl %}
                    <p><a href="{{ targetUrl }}">{{ 'registration.back'|trans }}</a></p>
                {% endif %}
            </div>
            <a href="{{ path('homepage') }}" class="btn btn-info width-min-300px">Let's start</a>
        </div>
    </div>
{% endblock fos_user_content %}
```

Który prezentuje się tak:

![confirm](http://i.imgur.com/8v1SLZ1.png)

#### Resetowanie hasła

Jeśli posiadający konto użytkownik zapomni hasła, może je wysłać na swój e-mail (jeśli w `app/config/parameters.yml` są odpowiednie parametry umożliwiające wysłanie e-maila) za pomocą formularza, którego kod znajduje się w pliku `app/Resources/FOSUserBundle/views/Resetting/request_content.html.twig`

```twig
{% trans_default_domain 'FOSUserBundle' %}

<div class="container eternity-form">
    <div class="forgot-password-section animated bounceInLeft">
        <div class="section-title">
            <h3>Forget Password</h3>
        </div>
        <div class="forgot-content">
            <form action="{{ path('fos_user_resetting_send_email') }}" method="POST" class="fos_user_resetting_request">
                <div class="textbox-wrap">
                    <div class="input-group">
                        <span class="input-group-addon "><i class="fa fa-envelope"></i></span>
                        <input type="email" class="form-control" id="username" name="username" required="required" placeholder="Email Id"/>

                    </div>
                </div>
                <div class="forget-form-action clearfix">
                    <a href="{{ path('fos_user_security_login') }}" class="btn btn-success pull-left blue-btn"><i class="fa fa-chevron-left"></i>&nbsp;&nbsp;Back  </a>
                    <button type="submit" class="btn btn-success pull-right green-btn">Submit &nbsp;&nbsp; <i class="fa fa-chevron-right"></i></button>
                </div>
            </form>
        </div>
    </div>
</div>
```

Formularz wygląda tak:

![reset](http://i.imgur.com/XfCorCh.png)

Za to co pojawi się na ekranie po wpisaniu e-maila odpowiada plik: `app/Resources/FOSUserBundle/views/Resetting/check_email.html.twig` o treści

```twig
{% extends "@FOSUser/layout.html.twig" %}

{% trans_default_domain 'FOSUserBundle' %}

{% block fos_user_content %}
    <div class="container eternity-form">
        <div class="section-title reg-header">
            <h3>Check Email</h3>
            <div class="fos_user_user_show">
                <p>{{ 'resetting.check_email'|trans({'%tokenLifetime%': tokenLifetime})|nl2br }}
                </p>
            </div>
        </div>
    </div>
{% endblock %}
```

który prezentuje się tak:

![check](http://i.imgur.com/hZy5ERk.png)

W e-mailu mamy link zmiany hasła. Szablon twiga znajduje się w pliku: `app/Resources/FOSUserBundle/views/Resetting/reset_content.html.twig` i ma kod:

```twig
{% trans_default_domain 'FOSUserBundle' %}

<div class="container eternity-form">
    <div class="forgot-password-section section-title reg-header">
        <div class="section-title">
            <h3>Reset Password</h3>
        </div>
        {{ form_start(form, { 'action': path('fos_user_resetting_reset', {'token': token}), 'attr': { 'class': 'fos_user_resetting_reset' } }) }}
        {{ form_widget(form) }}
        <div>
            <input type="submit" class="btn btn-danger btn-block" value="{{ 'resetting.reset.submit'|trans }}" />
        </div>
        {{ form_end(form) }}
    </div>
</div>
```

Formularz zmiany hasła tak:

![](http://i.imgur.com/N7Ot9V6.png)

#### Panel użytkownika

Jeśli jako zalogowany użytkownik wybierzemy `MyAccount` z menu, zostaniemy przekierowani do widoku konta. Jego html generowany jest z pliku `app/Resources/FOSUserBundle/views/Profile/show_content.html.twig`

```twig
{% trans_default_domain 'FOSUserBundle' %}

<div class="container eternity-form">
    <div class="section-title reg-header">
        <h3>User Profile</h3>
        <div class="fos_user_user_show">
            <p>{{ 'profile.show.username'|trans }}: {{ user.username }}</p>
            <p>{{ 'profile.show.email'|trans }}: {{ user.email }}</p>
            <a href="{{ path('homepage') }}" class="btn btn-primary">Edit Places</a>
            <a href="{{ path('fos_user_profile_edit') }}" class="btn btn-info">Edit Profile</a>
            <a href="{{ path('fos_user_change_password') }}" class="btn btn-success">Change Password</a>
        </div>
    </div>
</div>
```

i wygląda tak:

![profile](http://i.imgur.com/jwR8Nlg.png)

Przycisk `Edit Places` będzie prowadził do głównej funkcjonalności aplikacji. Jednak żeby dokończyć to co związane z `FOSUserBundle` pokażemy teraz edycję profilu i zmanę hasła. Edycja profilu: `app/Resources/FOSUserBundle/views/Profile/edit_content.html.twig`

```twig
{% trans_default_domain 'FOSUserBundle' %}

<div class="container eternity-form">

    {{ form_start(form, { 'action': path('fos_user_profile_edit'), 'attr': { 'class': 'fos_user_profile_edit' } }) }}

    <div class="section-title reg-header">
        <h3>Edit Profile</h3>
        <div>
            {{ form_widget(form) }}
        </div>
    </div>

    <div class="registration-form-action clearfix">
        <div>
            <a href="{{ path('fos_user_profile_show') }}" class="btn btn-success pull-left blue-btn ">
                <i class="fa fa-chevron-left"></i>&nbsp; &nbsp;Back To Profile
            </a>
            <button type="submit" class="btn btn-success pull-right green-btn ">{{ 'profile.edit.submit'|trans }} &nbsp; <i class="fa fa-chevron-right"></i></button>
        </div>
    </div>
    {{ form_end(form) }}
</div>
```

![edit](http://i.imgur.com/QVWyPri.png)

Cały formularz sprowadza się do jednego pola - `email`, ponieważ jest to jedyna własność jaką chcemy nadawać użytkownikowi.

Zmiana hasła ma szablon w pliku `app/Resources/FOSUserBundle/views/ChangePassword/change_password_content.html.twig`

```html
{% trans_default_domain 'FOSUserBundle' %}

<div class="container eternity-form">
    <div class="section-title reg-header">
        <h3>User Profile</h3>
        <div class="fos_user_user_show">
            {{ form_start(form, { 'action': path('fos_user_change_password'), 'attr': { 'class': 'fos_user_change_password' } }) }}
            {{ form_widget(form) }}
            <div>
                <input type="submit" class="btn btn-danger btn-block" value="{{ 'change_password.submit'|trans }}" />
            </div>
            {{ form_end(form) }}
        </div>
    </div>
</div>
```

![password](http://i.imgur.com/cQkQC91.png)

Są to wszystkie zmiany jakie zrobiłem, żeby dostosować `FOSUserBundle` do swoich wymagań. W `app/Resources/FOSUserBundle` Są pliki, których nie zmieniałem, na przykład cały katalog `Group`, który jest związany z interakcjami między użytkonikami, ale ta funkcjonalność nie jest przez nas wykorzystywana. Zostawiłem równiż e-mail do resetu hasła, który bez grafik wygląda tak:

![reset](http://i.imgur.com/zksqsDt.png)

Ale w przypadku e-maila jest to jak najbardziej dopuszczalne.

## AppBundle

Kiedy mamy już działającą obsługę użytkowników, warto było by dać im ciekawą funkcjonalność. Żeby zachować balans między rozbudowaną aplikacją, a dobrym przykładem postawimy następujące wymagania przed logiką biznesową aplikacji:

* Użytkownik może dodać dowolną liczbę miejsc do swojego konta
* Miejsca wybiera się wpisując je w formulażu lub używając geolokalizacji
* Dane miejsce może zostać odłączone od konta, ale nie zniknie z bazy
* Do danego miejsca może być przypisanych dowolnie wielu użytkowników
* Zarządanie miejscami (dodawanie, usównie, lokalizowanie) nie przeładowuje strony

### Baza danych (Model)

Zaczniemy od przygotowania bazy. Chcemy dodać w niej tablelę z miejscami oraz utowrzyć relację wiele do wielu między nią a tabelą `users`. Tworzymy plik `src/AppBundle/Entity/Place.php` w którym definiujemy klasę odpowiadającą za reprezentowanie miejsc. Standardowo zaczynamy od własności

```php
<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;

/**
 * @ORM\Entity
 * @ORM\Table(name="places")
 */
class Place
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * @ORM\Column(name="google_id", type="string", nullable=true)
     */
    private $googleId;

    /**
    * @ORM\ManyToMany(targetEntity="User", inversedBy="places")
    * @ORM\JoinTable(name="users_places")
    */
    private $users;

    /** @ORM\Column(name="formatted_address", type="string", nullable=true)  */
    protected $formattedAddress;

    /** @ORM\Column(name="lon", type="float", precision=9, nullable=true)  */
    protected $lon;

    /** @ORM\Column(name="lat", type="float", precision=9, nullable=true)  */
    protected $lat;

    /** @ORM\Column(name="add_at",type="datetime") */
    protected $add_at;

    /** @ORM\Column(name="street_number",type="string", nullable=true) */
    protected $streetNumber;

    /** @ORM\Column(name="route",type="string", nullable=true) */
    protected $route;

    /** @ORM\Column(name="sublocalityLevel1",type="string", nullable=true) */
    protected $sublocalityLevel1;

    /** @ORM\Column(name="locality",type="string", nullable=true) */
    protected $locality;

    /** @ORM\Column(name="administrative_area_level_2",type="string", nullable=true) */
    protected $administrativeAreaLevel2;

    /** @ORM\Column(name="administrative_area_level_1",type="string", nullable=true) */
    protected $administrativeAreaLevel1;

    /** @ORM\Column(name="country",type="string", nullable=true) */
    protected $country;
```

Poza standardowymi własnościami dotyczącymy lokalizacji mamy tu własność `$users`. W bazie danych będzie odpowiadała ona występowaniu tabeli `users_places` z identyfikatorami użytkownika i miejsca. Wymagać to będzie jeszcze paru zmian w klasie `User`, ale o tym później. Teraz przejrzymy metody klasy `Place`.

```php
    public function __construct() {
        $this->users = new ArrayCollection();
        $this->setAddAt(new \DateTime("now"));
    }
```

Konstruktor ustawia datę dodania miejsca oraz zmienną `$users` jako `ArrayCollection`. Jest to obiekt podobny do zwykłej tablicy, ale ma kilka metod wygodnych dla stosowania go jako zbiór obiektów. Mamy też geter i setter dla `$googleId`:

```php
    /**
     * @return mixed
     */
    public function getGoogleId()
    {
        return $this->googleId;
    }

    /**
     * @param mixed $googleId
     */
    public function setGoogleId($googleId)
    {
        $this->googleId = $googleId;
    }
```

Do operowani na zmiennej `$users` mamy trzy metody.

```php
    /**
     * @return mixed
     */
    public function getUsers()
    {
        return $this->users;
    }

    /**
     * @param mixed $user
     */
    public function addUsers(User $user)
    {
        if (!$this->users->contains($user))
        {
            $this->users->add($user);
        }
    }

    public function removeUser(User $user)
    {
        $this->users->removeElement($user);
    }
```

Widać jak korzystamy tu z zalet `ArrayCollection`, gdyby `$users` było zwykłą tablicą, te operacje wyglądały by nieco mniej zgrabnie.

Kolejnymi metodami są pary getterów i setterów dla adresu: `$formattedAddress`, współrzędnych `$lon`, `$lat` i czasu dodania adresu do bazy `$addAt`:

```php
    /**
     * @return mixed
     */
    public function getFormattedAddress()
    {
        return $this->formattedAddress;
    }

    /**
     * @param mixed $formattedAddress
     */
    public function setFormattedAddress($formattedAddress)
    {
        $this->formattedAddress = $formattedAddress;
    }

    /**
     * @return mixed
     */
    public function getLon()
    {
        return $this->lon;
    }

    /**
     * @param mixed $lon
     */
    public function setLon($lon)
    {
        $this->lon = $lon;
    }

    /**
     * @return mixed
     */
    public function getLat()
    {
        return $this->lat;
    }

    /**
     * @param mixed $lat
     */
    public function setLat($lat)
    {
        $this->lat = $lat;
    }

    /**
     * @return mixed
     */
    public function getAddAt()
    {
        return $this->add_at;
    }

    /**
     * @param mixed $add_at
     */
    public function setAddAt($add_at)
    {
        $this->add_at = $add_at;
    }
```

Dla pozostałych parametrów nie będziemy stosować już pary getter, setter. Z powodu ich ustrukturyzowanego występowania w api google maps, z którego będziemy korzystać ustawimy jeden setter dla nich wszystkich. Gettery nie będą nam potrzebne więc metody do obsługi pozostałych parametów wyglądają następująco:

```php
    public function getParams()
    {
        return [
            "country",
            "administrative_area_level_1",
            "administrative_area_level_2",
            "locality",
            "sublocality_level_1",
            "route",
            "street_number"
        ];
    }

    public function setParam($name,$value)
    {
        if(in_array($name,$this->getParams())){
            $name = lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $name))));//camelcase
            $this->$name  = $value;
        }
    }
```

Pierwsza z nich zwraca listę nazw obsługiwanych przez drugą metodę, te nazwy można jako `string` podstawić jako `$name`. Funkcja zaczynająca się od `lcfirst` odpowiada za zmianę notacji z `a_b` na `aB`, czyli usówa podkreślenia i zmienia małe litery po podkreśleniach na duże.

Została nam jeszcze jedna metoda - do rzutowania obiektu na string.

```php
    public function __toString()
    {
        return json_encode(["id"=>$this->getGoogleId(),"address"=>$this->getFormattedAddress()],JSON_UNESCAPED_UNICODE);
    }
}
```

Żeby tabela łącząca została poprawnie dodana wprowadzimy teraz zmiany w klasie `User` i dodamy do pliku `src/AppBundle/Entity/User.php` linie:

```php
use Doctrine\Common\Collections\ArrayCollection;

(...)

    /**
     * @ORM\ManyToMany(targetEntity="Place", mappedBy="users", cascade={"persist"})
     */
    private $places;

    /**
     * @return mixed
     */
    public function getPlaces()
    {
        return $this->places->toArray();
    }


    public function removePlace(Place $place)
    {
        $this->places->remove($place);
    }

    /**
     * @param mixed $place
     */
    public function addPlace(Place $place)
    {
        if (!$this->places->contains($place))
        {
            $this->places->add($place);
        }
    }

    public function __construct()
    {
        parent::__construct();
        $this->places = new ArrayCollection();
    }

```

Możemy teraz zregenerować bazę danych komendą:

```
php bin/console doctrine:schema:update --force
```

Na koniec załączam wizualizację schematu bazy

![database](http://i.imgur.com/jfjLAoV.png)

### Logika serwera (Kontroler)

Mamy model. Teraz kontrolery. Na końcu zrobimy widoki. W defaultowym kontrolerze (`src/AppBundle/Controller/DefaultController`) ustawimy przekierowanie zalogowanych użytkowników do ścieżki z miejscami:

```php
    /**
     * @Route("/", name="homepage")
     */
    public function indexAction(Request $request)
    {
        if($this->getUser()){
            return $this->redirectToRoute('places');
        }
        return $this->render('default/index.html.twig', []);
    }
```

To wszystko jeśli chodzi o defaultową logikę.
W kontrolerze `src/AppBundle/Controller/PlacesController` będzie znacznie więcej logiki. Oto metoda
do wyświetlania ścieżki `places`, do której chcemy przekierowywać logowanych użytkowników.

```php
<?php
namespace AppBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use AppBundle\Entity\Place;
use AppBundle\Form\PlaceType;
use Symfony\Component\HttpFoundation\JsonResponse;

Class PlacesController extends Controller
{
    /**
     * @Route("/profile/places", name="places")
     * @Method("GET")
     * @return Response
     */
    public function editPlacesAction()
    {
        if(!$this->getUser()){
            return $this->redirectToRoute('fos_user_security_login');
        }

        $place = new Place();
        $places = $this->getUser()->getPlaces();
        $form = $this->createForm(PlaceType::class, $place);

        return $this->render(':places:places.html.twig', array(
            'places' => $places,
            'form' => $form->createView(),
        ));
    }
```

Zanim przejdziemy dalej zwrócę uwagę na dwie rzeczy - pierwsza to brak obsługi formularza i przyjmowania requestów. Tworzymy tutaj formularz, wysyłamy go do Twiga, ale nie będziemy go odbierać tutaj. Jego obsługą zajmie się JavaScript. Druga rzecz to sama klasa `PlaceType` została ona tutaj zastosowana, chociaż jeszcze je nie defniowaliśmy. Zrobię małą dygresję i pokażę kod tej klasy. Jest on umieszczony w pliku `src/AppBundle/Form/PlaceType.php`

```php
<?php

namespace AppBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormTypeInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class PlaceType extends AbstractType implements FormTypeInterface
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('formatted_address', TextType::class, array('label' => false));
    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'AppBundle\Entity\Place',
        ));
    }
}
```

Z php na nasze: ta klasa odpowada z to, że formularz, który reprezentuje ma jedno pole. Wracamy teraz do kontrolera `src/AppBundle/Form/PlaceType.php`. Kolejna metoda będzie odpowiadała za zapisywanie miejsca do bazy danych

```php
    /**
     * @Route("/profile/ajax_geo_save", name="ajax_geo_save")
     * @Route("/profile/ajax_geo_save/{debug}")
     * @Method("POST")
     */
    public function ajaxGeoSave(Request $request, $debug=null)
    {
        $content = $request->getContent();
        $params = json_decode($content, true);

        $formattedAddress = $params['formatted_address'];
        $address = $this->getAddress($formattedAddress);

        if($debug=="debug") { return new JsonResponse($address); }

        $place = $this->getPlace($address);

        // these lines persist user relation with place, not only place
        $em = $this->getDoctrine()->getManager();
        $em->persist($place);
        $em->flush();

        return new JsonResponse($address, 201);
    }
```

Można ją wywołać z parametrem `debug` w ścieżce, ale nie trzeba. Działanie metody jest następujące: pobiera ona zawartość requestu do zmiennej `$content`, do zmiennej `$params` zapisuje tablicę odpowiadającą treści requestu, do zmiennej `$formattedAddress` zapisujemy wartość odpowiadającą kluczowi `formatted_address`. Jest to dokładnie to co powinno zostać wysłane przez formularz definiowany klasą `PlaceType` prezentowaną przed chwilą.

Teraz linia `$address = $this->getAddress($formattedAddress);` robi bardzo ważną rzecz. Wysyła request do API Google w celu przetłumaczenia tego co wpisał użytkownik na to co Google rozumie jako lokalizację, którą prawdopodobnie miał na myśli. Do metody `getAddress` jeszcze przejdziemy, ale teraz dokończę omawianie metody `ajaxGeoSave`. Otrzymany adres jest tablicą. Jeśli metodę włączono z parametrem `debug` to zostaje on zwrócony jako `JSON` z kodem HTTP 200 i dalsza część metody nie jest wykonywana. W przeciwnym wypadku, czyli w sytuacji zwyczajnego użycia wywołujemy metodę `getPlace`, która transformuje nam tablicę `$address` do obiektu `$place`. Trzy kolejne linie to zapis do bazy. Na końcu zwracamy `$address` jak z metodzie z parametrem `debug`, ale ponieważ wykonaliśmy poprawny zapis do bazy, zmieniamy kod HTTP na 201.

Mamy tu więc dwie ważne transformacje danych - z tego co wpisał użytkownik na tablicę z danymi adresowymi od Google, oraz z tablicy na naszą strukturę danych - klasę `Place`.

Może jednak tak się zdarzyć, że użytkownikowi nie che się pisać swojego adresu, albo zgubił się i nie wie gdzie jest. W takim wypadku możemy wykorzystać metodę `geolocation` obiektu `navigator` dostępnego w `javascript`. Zwraca ona współrzędne geograficzne. Chcieli byśmy tłumaczyć je na adres czytelny dla człowieka. Do tego posłuży druga metoda kontrolera:

```php
    /**
     * @Route("/profile/ajax_geo_location", name="ajax_geo_location")
     * @param Request $request
     * @Method("GET")
     * @return JsonResponse
     */
    public function ajaxGeoLocation(Request $request)
    {
        $lon = $request->get('lon');
        $lat = $request->get('lat');

        $address = $this->getAddress([$lat,$lon]);// get address from coords

        return new JsonResponse($address);
    }
```

Jej struktura jest bardzo przejrzysta. Pobieramy dane z requesta, wykonujemy transformację metodą `getAddress`, zwracamy tablicę z adresem. Należy zauważyć, że tym razem `getAddress` przyjmuję tablicę a nie string. Mimo to działa poprawnie, ponieważ w zależności od tego co dostała metoda `getAddress` wykonuje nieco inną logikę dostosowaną zarówno do tekstowych adresów jak i par współrzędnych.

Kolejna metoda wiąże się ze smutnym eventem jakim jest usunięcie adresu przez użytkownika.

```php
    /**
     * @Route("/profile/ajax_geo_delete/{googleId}", name="ajax_geo_delete")
     * @Method("DELETE")
     * @param googleId
     * @return JsonResponse
     */
    public function ajaxGeoDelete($googleId)
    {
        $place = $this->getDoctrine()->getRepository("AppBundle:Place")->findOneBy(array(
            'googleId' => $googleId
        ));

        if(!$place) { return new JsonResponse(["error"=>"Place Not Found"],404); }

        $address = $this->getAddress($place->getFormattedAddress());

        $place->removeUser($this->getUser());
        $em = $this->getDoctrine()->getManager();
        $em->persist($place);
        $em->flush();

        return new JsonResponse($address,204);
    }
```

Adres jest wyszukiwany po `googleId`. Jeśli nie zostanie znaleziony odsyłamy błąd `404`, jeśli zostanie, to usunięte zostaje jedynie łącznie między użytkownikiem a miejscem, natomiast miejsce cały zostaje w bazie nawet jeśli nie będzie już połączone z żadnym użytkownikiem.

Najwyższy czas na zaprezentowanie pierwszego z transformatorów danych - metody `getAddress`

```php
    /**
     * @param $data
     * @return array
     * @throws \Exception
     */
    public function getAddress($data)
    {
        if(is_string($data)){
            $address = str_replace(" ", "+", $data); // replace all the white space with "+" sign to match with google search pattern
            $url = "http://maps.google.com/maps/api/geocode/json?sensor=false&address=$address";
        } elseif (is_array($data) && count($data)) {
            $url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=$data[0],$data[1]&sensor=false";
        } else {
            throw new \Exception("Incorrect args, put string or array with lat and lon");
        }

        $response = file_get_contents($url);
        $json = json_decode($response, TRUE); //generate array object from the response from the web
        return $json['results'][0];
    }
```

Ta metoda sprawdza czy dostała współrzędne czy tekstowy adres i w zależności od tego przygotowuje trochę inny `$url`. Następnie za pomocą najprostszego requestu `file_get_contents` odbiera to co odpowie Google, wycina to co nie potrzebne i odsyła dalej.

Myślę, że to dobry moment, żeby pokazać do dokładnie jest odsyłane. Wykonamy request do `ajax_geo_save` z parametrem `debug`, żeby zobaczyć jak wygląda `json` na wyjściu tej metody.

![api1](http://i.imgur.com/My3cMbW.png)
![api2](http://i.imgur.com/88vr0jN.png)

Widać, że `formatted_address`, `place_id` oraz współrzędne mają tu dobrze określone miejsce, ale pozostałe własności adresu zostały spakowane do jednej tablicy `address_components` i są tagowane za pomocą typów, które mogą występować po kilka, ale niektórych może też wcale nie być. Do przetwarzania tej tablicy do postaci zgodnej z naszym modelem danych służy ostatnia metoda, którą zaprezentuję: `getPlace`

```php
    /**
     * @param array $address
     * @return mixed
     */
    public function getPlace($address)
    {
        $place = $this->getDoctrine()->getRepository("AppBundle:Place")->findOneBy(array(
            'googleId' => $address['place_id']
        ));
                if($place === null)
        {
            $place = new Place();

            $place->setGoogleId($address['place_id']);
            $place->setLat($address['geometry']['location']['lat']);
            $place->setLon($address['geometry']['location']['lng']);
            $place->setFormattedAddress($address['formatted_address']);
```

Na początku sprawdzamy czy dany adres już znajduje się w naszej bazie. Jeśli tak, to możemy pominąć całe transformowanie, dodamy do niego aktualnego użytkownika i wystarczy. Załóżmy jednak, że to nowy adres. W takim przypadku powinniśmy w pierwszej kolejności ustawić mu `google_id`, współrzędne, oraz jego sformatowaną postać. Następnie zajmiemy się otagowanymi składowymi adresu.

```php
            $params = $place->getParams();

            foreach($address["address_components"] as $component){
                foreach($params as $paramId => $param){
                    if(in_array($param,$component["types"])){
                        $place->setParam($param,$component["long_name"]);
                        unset($params[$paramId]);
                    }
                }
            }
        }
```

Będziemy je wyciągać w podwójnej pętli. Po komponentach adresu oraz po parametrach jakich szukamy. Jeśli jakiś parametr zostanie znaleziony, zapiszemy właściwość i usuniemy go z tablicy parametrów, tak, żeby nie nabijał pustych pętli.

```php
        $place->addUsers($this->getUser());

        return $place;
    }
}
```

Na koniec niezależnie od tego, czy tworzyliśmy nowe miejsce, czy też wzięliśmy je z bazy, dołączamy do miejsca obecnego użytkownika. Jeśli zastanawia cię dlaczego nie sprawdzam czy ten użytkownik jest już dodany, to odpowiedź jest prosta. Sprawdzam, ale na poziomie metody dostępnej w `ArrayCollection` w encji a nie kontrolerze.

### Widoki

Bardzo dużą część widoków już przerobiliśmy. Zostały nam jeszcze dwa. Pierwszy z nich to strona główna dla niezalogowanych użytkowników. Strona po prostu informuje do czego jest aplikacja. Widok znajduje się w pliku `app/Resources/views/default/index.html.twig`, ma kod

```twig
{% extends 'base.html.twig' %}

{% block body %}
    {{ parent() }}


    <div class="container eternity-form">
        <div class="section-title reg-header">
            <h3>Places</h3>
            <p>App to collect your addresses</p>

        </div>
    </div>
{% endblock %}
```

i wygląda tak:

![olaces](http://i.imgur.com/7mkjpKI.png)

Ciekawszym widokiem jest widok miejsc. Umieściliśmy go w pliku `app/Resources/views/places/places.html.twig`

Jego kod html jest dość prosty:

```twig
{% extends 'base.html.twig' %}

{% block body %}
    {{ parent() }}

    <div class="container eternity-form">
        <div class="section-title reg-header">
            <h3>Update your address</h3>

            <br>
            <p id="info"></p>

            <div class="list">
            {% for place in places %}
                <div data-id="{{ place.googleId }}" class="btn-group place-elem" role="group">
                    <button type="button" class="place-name btn btn-default">{{ place.formattedAddress }}</button>
                    <button type="button" class="place-delete btn btn-danger delete">Delete</button>
                </div>
            {% endfor %}
            </div>

            <div class="input-group">
                <input name="formatted_address" type="text" class="form-control" placeholder="Type your location...">
                <span class="input-group-btn place-padding-bottom">
                    <button id="my_location" class="btn btn-info">Check my location</button>
                    <button id="save_location" class="btn btn-default">Save location</button>
                </span>
            </div>
        </div>
    </div>
{% endblock %}
```

Warto zwrócić uwagę na to jak sprawnie będą uzupełniały się tutaj metody zarządzania widokiem po stronie serwera (pętla w twigu) oraz po stronie klienta. Od momentu wygenerowania początkowego widoku wszystkie zmiany robi już `javascript`.

Widok wyposażony jest w swój styl, który zaciąga rozszerzając blok `stylesheets`

```twig
{% block stylesheets %}
    {{ parent() }}
    <link href="{{ asset('bundles/app/css/place.css') }}" rel="stylesheet" />
{% endblock %}
```

Styl znajduje się w pliku `src/AppBundle/Resources/public/css/place.css` i ma tylko 4 reguł:

```css
.place-name {
    width: 74%;
}

.place-delete {
    width: 26%;
}

.place-padding-bottom{
    padding-bottom: 30px;
}

.place-elem {
    padding-bottom: 5px;
    width: 100%;
}
```

Jeśli piszę w `css` to zwykle ograniczam się do takiego właśnie minimalizmu. Co innego z `javascriptem`. W widoku (`app/Resources/views/places/places.html.twig`) jest go objętościowo więcej niż `html`. Spełnia on następujące zadania:

```js
{% block javascripts %}
{{ parent() }}

<script>
    var places = [];
    {% for place in places %}
    places.push({{ place|raw }});
    {% endfor %}
```

Przy ładowaniu strony zapisuje do JavaScriptowej zmiennej `places` tablicę z tekstowymi reprezentacjami obiektów `Place` przekazanych do twigowej zmiennej. Będą nam one potrzebne do unikania duplikacji treści. Dzięki temu rozwiązaniu mamy stan aplikacji w zmiennej oraz na ekranie jednocześnie.

Następnie robię to co zawsze robię rozpoczynając skrypt

```js
    var info = document.getElementById("info");
    var area = document.getElementsByClassName("section-title")[0];
    var list = document.getElementsByClassName("list")[0];
```

identyfikuję potrzebne elementy za pomocą selektorów. Później robię to co zawsze robię w skryptach po identyfikacji elementów.

```js
    area.addEventListener('click',function(e){
       if(e.target.id=='my_location'){
           getLocation();
       } else if(e.target.id=='save_location') {
           saveLocation();
       } else if(e.target.classList.contains('delete')){
           deleteLocation(e.target.parentNode.dataset.id);
       }
    });
```

Dodaję jeden (staram się zwykle dodawać tylko jeden) listener, w którym przyporządkowują akcje wykrytym eventom. Mamy tu do wyboru trzy akcje: sprawdzenie lokacji za pomocą obiektu `navigarot` przeglądarki, zapisanie i usunięcie lokacji.

Za obsługę `navigatora` odpowiada poniższy kod.

```js
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            info.innerHTML = "Geolocation is not supported by this browser.";
        }
    }
```

Jeśli użytkownik wyrazi zgodę na dostęp do jego lokalizacji, jest ona przekazywana do funkcji `showPosition`.

```js
    function showPosition(position) {
        $.ajax({
            url: "{{ path('ajax_geo_location') }}",
            method: "GET",
            data: {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            },
            success: function(msg){
                $("#my_location").html('Position obtained');
                $("input[name=formatted_address]").val(msg['formatted_address']);
            }});
    }
```

Ta funkcja z kolei wysyła odpowiedni request i wypełnia pole formularza sformatowanym adresem odpowiadającym współrzędnych przeglądarki.

Zapisanie lokacji - czyli wysłanie formularza realizowane jest przez kolejną funkcję:

```js
    function saveLocation(){
        $.post('{{ path('ajax_geo_save') }}',
                JSON.stringify({formatted_address: $("input[name=formatted_address]").val()})
        ).done(function(res){

        if(places.filter(function(obj) {return obj.id == res.place_id}).length){
            return;
        }

        places.push({'id':res.place_id,'addess':res.formatted_address});
        list.innerHTML += '<div data-id="'+res.place_id+'" class="btn-group place-elem" role="group">\
            <button type="button" class="place-name btn btn-default">'+res.formatted_address+'</button>\
            <button type="button" class="place-delete btn btn-danger delete">Delete</button>\
            </div>';
        });
    }
```

Jej działanie zaczyna się od wysłania requestu POST z treścią formularza. Jeśli otrzymamy odpowiedź, sprawdzamy czy miejsce jest już przypisane do użytkownika filtrując tablicę `places`. Jeśli tak, nic więcej nie robimy. Jeśli nie było, to dodajemy je do tablicy `places` i do listy miejsc dołączamy lokację za pomocą składni `.innerHTML +=`. Są do tego metody polegające na traktowaniu htmla jako drzewa DOM, ale są one efektywne jeśli są stosowane w szerszym kontekście. W tym przypadku metoda doklejenia treści mimo, że mniej elegancka została wybrana ze względu na większą prostotę.

Ostatnia metoda odpowiada za usunięcie miejsca z listy miejsc użytkownika.

```js
    function deleteLocation(googleId){
        var route = "{{ path('ajax_geo_delete',{'googleId':'PLACEHOLDER'}) }}";
        $.ajax({
            url: route.replace("PLACEHOLDER",googleId),
            method: "DELETE"
        });
        places = places.filter(function( obj ) {
            return obj.id !== googleId;
        });
        list.querySelector("[data-id='"+googleId+"']").outerHTML='';
    }
</script>
{% endblock %}
```

Tutaj odwrotnie niż przy zapisywaniu, usuwamy element z tablicy `places` i czyścimy `HTML` odpowiadający miejscu, które usuwamy. Na koniec dodajemy screen z przykładowego użytkowania:

![](http://i.imgur.com/YwW9q5l.png)

To cały kod źródłowy. Nie ma tutaj testów, nie ma DoctrineFixturesBundle, nie ma panelu admina, nie ma gulpa.
Przede wszystkim jednak nie ma miejsca. Z tego względu wszystkie wspomniane rzeczy zostały wycięte.
Ten wpis i tak jest chyba najdłuższym jaki napisałem. Jego celem nie było przedstawianie kompleksowej aplikacji
tylko przykładu zastosowania FOSUserBundle.

Mam nadzieję, że komuś pomoże to przy wdrażaniu tej znakomitej paczki w swoim projekcie. Jak zwykle czekam na waszą krytykę,
pytania oraz wskazówki, co mogę poprawić.
