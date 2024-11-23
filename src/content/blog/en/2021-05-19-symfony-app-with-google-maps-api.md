---
author: Daniel Gustaw
canonicalName: symfony-app-with-google-maps-api
coverImage: http://localhost:8484/3dc294cf-2fe2-4b97-8267-4f1e2d364ca3.avif
description: A simple app integrating the fos user bundle with Google Maps. The service allows for logging in, registration, and saving your list of locations validated by the Google API.
excerpt: A simple app integrating the fos user bundle with Google Maps. The service allows for logging in, registration, and saving your list of locations validated by the Google API.
publishDate: 2021-05-18 20:50:00+00:00
slug: en/application-with-fosuserbundle-and-google-maps-api
tags:
- symfony
- fosuserbundle
- google maps
- twig
- css
title: Application with FOSUserBundle and Google Maps API
updateDate: 2021-06-22 09:23:37+00:00
---

## Project Description 

This is a project written as one of the functionalities during my collaboration with `Smartselect`. The funniest thing is that it was my first contact with `FOSUserBundle`, `Google Maps API`, and the `navigator` object. When I was writing it, I didn't know `JavaScript`. Although the code required a little refreshment and a thorough separation from other functionalities of the entire application before publication, it turned out that it was not difficult, and in this entry, I presented how to build it file by file from scratch.

From the entry, you will learn how to install, configure, and override `FOSUserBundle` - the most popular package for user management in `Symfony`. We will create several views related to logging in, registration, account management, password resetting, and so on. If you like the frontend, you will feel like a fish in water for most of this entry. We will dive into the backend with the application logic, which involves using the `Google Maps API` to translate textual addresses or coordinates into entities in our database. Ajax will not be missing, we will see how the `navigator` object allows us to access the browser's location and how to reconcile Twig and JavaScript in one frontend.

You can see the application in action in the video below:

The source code composition is:

```
PHP 69.7% HTML 20.9% CSS 5.8% ApacheConf 3.1% JavaScript 0.5%
```

## Installation

There are two ways to set up a new Symfony project: [installation from scratch](http://symfony.com/doc/current/best_practices/creating-the-project.html) and cloning from GitHub.

If you want to install the project in the simplest possible way, you can download it from [GitHub](https://github.com/gustawdaniel/geo_local)
and install it according to the instructions in `README.md`.

In this post, I will show you how to install the project from scratch. You can avoid looking at my repo and by executing all the commands and creating the files below you should get practically the same result. The only differences will be that for greater clarity, I did not include several unused views, such as the admin panel or contact.

Back to the installation. If you want to install from scratch, Symfony's documentation recommends using its installer.

```
symfony new geo_local && cd geo_local
```

## FosUserBundle

We will want to create users. For this purpose, we will use one of the most popular packages - [FOSUserBundle](https://symfony.com/doc/master/bundles/FOSUserBundle/index.html).

```
composer require friendsofsymfony/user-bundle "~2.0@dev"
```

To use it, we need to register it in the application kernel by adding the element: `new FOS\UserBundle\FOSUserBundle()` to the `$bundles` array in the `app/AppKernel.php` file.

Next, we extend the `BaseUser` class to be able to modify the class describing Users (I assume we will be using MySQL, for other database engines the configuration may look a bit different):

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

We are changing the contents of the file: `app/config/security.yml`

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

Finally, in the file `app/config/config.yml`, uncomment the line containing the entry `#translator: { fallbacks: ["%locale%"] }`. And finally, add:

```yml
fos_user:
    db_driver: orm
    firewall_name: main
    user_class: AppBundle\Entity\User
```

We should also add two lines to the routing `app/config/routing.yml`:

```yml
fos_user:
    resource: "@FOSUserBundle/Resources/config/routing/all.xml"
```

To make everything work, we should also set our database connection parameters. In my case, this boils down to setting: the entry `database_name: geo_local` in the files: `app/config/parameters.yml` and `app/config/parameters.yml.dist`.

We create the database and the necessary tables using the commands:

```bash
php bin/console doctrine:database:create
php bin/console doctrine:schema:update --force
```

Now everything should work. I mean that after starting the server with the command `php bin/console server:run` and entering the address `127.0.0.1:8000/login` in the browser, we should see something like this:

![domyślny_login_fos_user_bundle](https://i.imgur.com/cCUzKD4.png)

### Overriding FOSUserBundle Behavior

We now have two problems, the first is that it doesn't look nice, the second is that we want to use `email` instead of `username`, and after logging in, we want to add our own redirect. We'll start with the logic and leave the front for later.

#### Replacing `username` with `email`

A very clear instruction on removing the `username` field can be found on [stack](http://stackoverflow.com/questions/8832916/remove-replace-the-username-field-with-email-using-fosuserbundle-in-symfony2). In the `User` class, we override the setter for the email field.

```php
public function setEmail($email)
{
    $email = is_null($email) ? '' : $email;
    parent::setEmail($email);
    $this->setUsername($email);

    return $this;
}
```

We will not follow this instruction too literally, because in the official documentation, you can read between the lines a better way. Using the documentation on [overriding forms](http://symfony.com/doc/master/bundles/FOSUserBundle/overriding_forms.html), we create the file `src/AppBundle/Form/RegistrationType.php` which will override the default registration form for us. When registering, we want to require the user to provide only one password, so we will kill two birds with one stone by overriding this form. Here is the content of the file:

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

By removing and adding the password, we eliminate quite an interesting and advanced trick of repeating this field, which is used by `FOSUserBundle`. Similarly, we overwrite the profile edit in `src/AppBundle/Type/ProfileType.php`:

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

We register our forms as services by modifying the `app/config/services.yml` file:

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

At the end of the package configuration, we set our forms as those that are to override the defaults.

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

We do not touch validation at all. It should be noted that the [link](http://stackoverflow.com/questions/8832916/remove-replace-the-username-field-with-email-using-fosuserbundle-in-symfony2) with instructions referred to version 2 of Symfony, while in our project we use version 3.

#### Redirect After Login

By default, after logging in, `FOSUserBundle` redirects us to the user's profile. This is logical, but not practical in our case. The main functionality of the application will not revolve around changing one's email and password. Instead, we want to redirect the user to a path called `homepage`, and only its controller will send logged-in users to the panel with places, not logged-in to the informational page. In order to redirect the user to `homepage` after logging in, we will make the following changes: we will add the file `src/AppBundle/Security/LoginSuccessHandler.php` with the content:

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

In the services (`app/config/services.yml`) we should add the service:

```yml
    authentication.handler.login_success_handler:
        class:  AppBundle\Security\LoginSuccessHandler
        arguments:  ['@router', '@security.authorization_checker']
```

We should add the `success_handler` parameter to the `app/config/security.yml` file.

```yml
    firewalls:
        main:
            pattern: ^/
            form_login:
                provider: fos_userbundle
                csrf_token_generator: security.csrf.token_manager
                success_handler: authentication.handler.login_success_handler
```

### Overriding the appearance of FOSUserBundle

Now that we have the right amount of fields in the form, we can change the appearance so that it doesn't scare users and doesn't cause nightmares. We will display the list of paths we should take care of with the command:

```bash
php bin/console debug:router | grep fos_user
```

The simplest way to override the default appearance is to execute the following command.

```bash
mkdir -p app/Resources/FOSUserBundle/views && cp -r vendor/friendsofsymfony/user-bundle/Resources/views/* "$_"
```

#### Adding External Libraries

We will now install frontend libraries and add our own styles and scripts.
To avoid problems with Twig caching, we will disable it in development mode by adding the following lines to the file `app/config/config_dev.yml`:

```yml
twig:
    cache: false
```

We create a `.bowerrc` file with the content:

```json
{
  "directory": "web/bower_components/"
}
```

We initialize bower with the command:

```
bower init
```

We are installing bootstrap 3, animate.css, components-font-awesome, jQuery, and iCheck - a small library based on jQuery for displaying effects related to checking form fields and checkboxes:

```
bower install --save bootstrap#^3.3.7 animate.css#^3.5.2 components-font-awesome#^4.7.0 iCheck#^1.0.2 jquery#^3.1.1
```

We add lines to `.gitignore`:

```
/.idea
/web/bower_components
```

I am not a good front-end developer, so I buy front-end designs. This was also the case here. The CSS I am attaching was purchased from the website 
[wrapbootstrap.com](https://wrapbootstrap.com/theme/eternity-forms-WB0G8810G). I cut out half of the unused functionality and changed the links to the `iCheck` skins. I placed the `css` file in the location `src/AppBundle/Resources/public/css/forms.css`.

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

We need one more script - `src/AppBundle/Resources/public/js/iCheck-config.js` is the configuration of the `iCheck` plugin used for interactively highlighting active form fields:

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

We link it with the `web` directory using the command

```
php bin/console assets:install --symlink
```

This is not the best available method. A better one is using `gulp`, but it is the simplest. With a few style and script files and some external libraries, the lack of concatenation and minification is nothing terrible. Of course, creating a file with styles directly in the web directory is simpler, but incorrect.

The last thing we have to do is add Bootstrap forms as defaults for Twig, in the file `app/config/config.yml` we add the line:

```yml
twig:
    form_themes:
        - 'bootstrap_3_layout.html.twig'
```

#### Base template

We will start by customizing the appearance of the login. The login will inherit from `layout.html.twig` from FOSUserBundle, and this will inherit from `base.html.twig`. So to build the house from the foundations, not from the roof, we will take a look at the base template - `app/Resources/views/base.html.twig`.

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

What do we have here? There is `viewport` - the page works on mobile devices. We are linking styles that need to be everywhere - bootstrap and forms. We added scripts - jQuery and bootstrap. There is no need to load scripts like `iCheck` or styles like `animate.css` if not every page will need them. We don't want to irritate the user with constant animations, but rather please them with animations during login or registration - that will suffice. The `<body>` tag contains only the navigation bar. However, the navigation has logic that displays "login" and "registration" fields to the unauthenticated user, and "my account" and "logout" to the authenticated user.

#### Layout for FOSUserBundle

Now let's take a look at the file `app/Resources/FOSUserBundle/layout.html.twig` - which is a template that inherits from `base` and is also the parent for everything we will override in `FOSUserBundle`:

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

In this file, we added styles and scripts needed only for user handling and directly connected the `fos_user_content` block under the navigation saved in `base.html.twig`.

#### Login

The file `app/Resources/FOSUserBundle/views/Security/login.html.twig` remains virtually unchanged, we will only add a title:

```twig
{% extends "@FOSUser/layout.html.twig" %}

{% block fos_user_content %}
    {{ include('@FOSUser/Security/login_content.html.twig') }}
{% endblock fos_user_content %}

{% block title %}Login Form{% endblock %}
```

A lot more code has been added to the file `app/Resources/FOSUserBundle/views/Security/login_content.html.twig`

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

However, this is just the front - a login form and two links in the twig. And since the front speaks more than a thousand words, instead of describing it, I am pasting the screenshot:

![login](https://i.imgur.com/avrKaZd.png)

#### Registration

The registration looks similar.  
File: `app/Resources/FOSUserBundle/views/Registration/register.html.twig`

```twig
{% extends "@FOSUser/layout.html.twig" %}

{% block fos_user_content %}
{% include "@FOSUser/Registration/register_content.html.twig" %}
{% endblock fos_user_content %}

{% block title %}Register{% endblock %}
```

File: `app/Resources/FOSUserBundle/views/Registration/register_content.html.twig`

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

Effect:

![register](https://i.imgur.com/i9BZooS.png)

If the registration is successful, we congratulate the user with a message from the file: `app/Resources/FOSUserBundle/views/Registration/confirmed.html.twig`

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

Which presents itself as follows:

![confirm](https://i.imgur.com/8v1SLZ1.png)

#### Password Reset

If a user with an account forgets their password, they can send it to their email (if the appropriate parameters for sending emails are set in `app/config/parameters.yml`) using a form whose code is located in the file `app/Resources/FOSUserBundle/views/Resetting/request_content.html.twig`

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

The form looks like this:

![reset](https://i.imgur.com/XfCorCh.png)

The file responsible for what appears on the screen after entering the email is: `app/Resources/FOSUserBundle/views/Resetting/check_email.html.twig` with the content

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

which looks like this:

![check](https://i.imgur.com/hZy5ERk.png)

In the email, we have a password reset link. The Twig template is located in the file: `app/Resources/FOSUserBundle/views/Resetting/reset_content.html.twig` and has the code:

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

Password change form as follows:

![](https://i.imgur.com/N7Ot9V6.png)

#### User Panel

If we, as a logged-in user, select `MyAccount` from the menu, we will be redirected to the account view. Its html is generated from the file `app/Resources/FOSUserBundle/views/Profile/show_content.html.twig`

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

and it looks like this:

![profile](https://i.imgur.com/jwR8Nlg.png)

The `Edit Places` button will lead to the main functionality of the application. However, to complete what is related to `FOSUserBundle`, we will now show profile editing and password change. Profile editing: `app/Resources/FOSUserBundle/views/Profile/edit_content.html.twig`

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

![edit](https://i.imgur.com/QVWyPri.png)

The entire form comes down to one field - `email`, as it is the only attribute we want to assign to the user.

The password change template is in the file `app/Resources/FOSUserBundle/views/ChangePassword/change_password_content.html.twig`

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

![password](https://i.imgur.com/cQkQC91.png)

These are all the changes I made to adapt `FOSUserBundle` to my requirements. In `app/Resources/FOSUserBundle`, there are files that I did not modify, for example, the entire `Group` directory, which is related to interactions between users, but this functionality is not used by us. I also left the email for password reset, which without graphics looks like this:

![reset](https://i.imgur.com/zksqsDt.png)

But in the case of email, it is completely permissible.

## AppBundle

Once we have a functioning user management system, it would be worthwhile to provide them with an interesting feature. To maintain a balance between a comprehensive application and a good example, we will set the following requirements for the application's business logic:

* The user can add any number of places to their account
* Places are selected by entering them in the form or using geolocation
* A given place can be detached from the account, but it will not disappear from the database
* Any number of users can be assigned to a given place
* Managing places (adding, removing, locating) does not overload the page

### Database (Model)

We will start by preparing the database. We want to add a table for places and create a many-to-many relationship between it and the `users` table. We create the file `src/AppBundle/Entity/Place.php` in which we define the class responsible for representing places. By default, we start with properties.

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

Apart from the standard properties related to location, we have the property `$users`. In the database, it will correspond to the occurrence of the `users_places` table with user and place identifiers. This will require a few more changes in the `User` class, but we'll talk about that later. Now let's review the methods of the `Place` class.

```php
    public function __construct() {
        $this->users = new ArrayCollection();
        $this->setAddAt(new \DateTime("now"));
    }
```

The constructor sets the date of adding the place and the variable `$users` as `ArrayCollection`. It is an object similar to a regular array, but it has several methods convenient for using it as a collection of objects. We also have a getter and setter for `$googleId`:

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

For the variable `$users`, we have three methods.

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

You can see how we take advantage of `ArrayCollection` here; if `$users` were a regular array, these operations would look a bit less elegant.

The next methods are pairs of getters and setters for the address: `$formattedAddress`, coordinates `$lon`, `$lat`, and the time the address was added to the database `$addAt`:

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

For the remaining parameters, we will not use the getter-setter pair anymore. Due to their structured occurrence in the Google Maps API, which we will use, we will set one setter for all of them. Getters will not be needed, so the methods to handle the remaining parameters look as follows:

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

The first of them returns a list of names supported by the second method, these names can be substituted as a `string` for `$name`. The function starting with `lcfirst` is responsible for changing the notation from `a_b` to `aB`, which means it removes underscores and changes lowercase letters after underscores to uppercase.

We have one more method left - for casting an object to a string.

```php
    public function __toString()
    {
        return json_encode(["id"=>$this->getGoogleId(),"address"=>$this->getFormattedAddress()],JSON_UNESCAPED_UNICODE);
    }
}
```

To correctly add the linking table, we will now make changes to the `User` class and add the lines to the file `src/AppBundle/Entity/User.php`:

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

We can now regenerate the database with the command:

```
php bin/console doctrine:schema:update --force
```

Finally, I am attaching a visualization of the database schema.

![database](https://i.imgur.com/jfjLAoV.png)

### Server Logic (Controller)

We have the model. Now the controllers. Finally, we will create the views. In the default controller (`src/AppBundle/Controller/DefaultController`), we will set up redirection for logged-in users to the path with places:

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

That's all regarding the default logic.  
In the controller `src/AppBundle/Controller/PlacesController` there will be much more logic. Here is the method for displaying the `places` path, to which we want to redirect logged-in users.

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

Before we proceed, I will point out two things - the first is the lack of form handling and request processing. We are creating a form here, sending it to Twig, but we will not be receiving it here. JavaScript will handle its processing. The second thing is that the `PlaceType` class has been used here, although we have not defined it yet. I will make a small digression and show the code of this class. It is located in the file `src/AppBundle/Form/PlaceType.php`.

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

From PHP to our language: this class is responsible for having a single field in the form it represents. We are now returning to the controller `src/AppBundle/Form/PlaceType.php`. The next method will be responsible for saving the place to the database.

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

It can be called with the `debug` parameter in the path, but it is not necessary. The method operates as follows: it retrieves the contents of the request into the variable `$content`, saves the array corresponding to the request content into the variable `$params`, and we store the value corresponding to the key `formatted_address` in the variable `$formattedAddress`. This is exactly what should be sent by the form defined by the class `PlaceType` presented a moment ago.

Now, the line `$address = $this->getAddress($formattedAddress);` does something very important. It sends a request to the Google API to translate what the user entered into what Google understands as the location that they likely meant. We will come back to the `getAddress` method, but now I will finish discussing the `ajaxGeoSave` method. The obtained address is an array. If the method was invoked with the `debug` parameter, it is returned as `JSON` with an HTTP code of 200 and the rest of the method is not executed. Otherwise, in the case of normal usage, we call the `getPlace` method, which transforms the array `$address` into the object `$place`. The next three lines are the database write. Finally, we return `$address` as in the method with the `debug` parameter, but since we successfully wrote to the database, we change the HTTP code to 201.

So we have two important data transformations here - from what the user entered to an array of address data from Google, and from the array to our data structure - the `Place` class.

However, it may happen that the user does not want to write their address, or they got lost and do not know where they are. In that case, we can use the `geolocation` method of the `navigator` object available in `javascript`. It returns geographical coordinates. We would like to translate them into a human-readable address. For this purpose, we will use the second method of the controller:

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

Its structure is very clear. We obtain data from the request, perform a transformation using the method `getAddress`, and return an array with the address. It should be noted that this time `getAddress` takes an array and not a string. Nevertheless, it works correctly, as depending on what it received, the `getAddress` method executes slightly different logic tailored to both textual addresses and pairs of coordinates.

The next method is related to the sad event of a user deleting an address.

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

The address is searched by `googleId`. If it is not found, we return a `404` error; if it is found, only the link between the user and the place is removed, while the place remains in the database even if it is no longer linked to any user.

It's high time to present the first of the data transformers - the `getAddress` method.

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

This method checks whether it received coordinates or a textual address and, depending on that, prepares a slightly different `$url`. Then, using the simplest request `file_get_contents`, it retrieves what Google replies, trims out what is unnecessary, and sends it back.

I think this is a good time to show what exactly is being sent back. We will make a request to `ajax_geo_save` with the parameter `debug` to see what the `json` looks like at the output of this method.

![api1](https://i.imgur.com/My3cMbW.png)

![api2](https://i.imgur.com/88vr0jN.png)

It is clear that `formatted_address`, `place_id`, and coordinates have a well-defined location here, but other address properties have been packed into a single array `address_components` and are tagged using types that can occur multiple times, but some may also be absent. The last method I will present for processing this array into a format compliant with our data model is `getPlace`.

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

At the beginning, we check if the given address is already in our database. If so, we can skip the whole transformation, just add the current user to it, and that's enough. However, let's assume it's a new address. In that case, we should first set its `google_id`, coordinates, and its formatted version. Then we will deal with the tagged components of the address.

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

We will extract them in a double loop. By the components of the address and by the parameters we are looking for. If any parameter is found, we will save the property and remove it from the parameters array, to avoid empty loops.

```php
        $place->addUsers($this->getUser());

        return $place;
    }
}
```

### Views

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

and it looks like this:

![olaces](https://i.imgur.com/7mkjpKI.png)

A more interesting view is the view of places. We placed it in the file `app/Resources/views/places/places.html.twig`

Its HTML code is quite simple:

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

It is worth noting how efficiently the view management methods will complement each other here on the server side (Twig loop) and on the client side. From the moment the initial view is generated, all changes are made by `javascript`.

The view is equipped with its own style, which is pulled in by extending the `stylesheets` block.

```twig
{% block stylesheets %}
    {{ parent() }}
    <link href="{{ asset('bundles/app/css/place.css') }}" rel="stylesheet" />
{% endblock %}
```

The style is located in the file `src/AppBundle/Resources/public/css/place.css` and has only 4 rules:

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

If I write in `css`, I usually stick to such minimalism. It's different with `javascript`. In the view (`app/Resources/views/places/places.html.twig`), there is more of it in terms of volume than `html`. It performs the following tasks:

```js
{% block javascripts %}
{{ parent() }}

<script>
    var places = [];
    {% for place in places %}
    places.push({{ place|raw }});
    {% endfor %}
```

When loading the page, it saves an array of textual representations of `Place` objects passed to the Twig variable into a JavaScript variable `places`. We will need them to avoid content duplication. Thanks to this solution, we have the application state in a variable and on the screen at the same time.

Next, I do what I always do when starting the script.

```js
    var info = document.getElementById("info");
    var area = document.getElementsByClassName("section-title")[0];
    var list = document.getElementsByClassName("list")[0];
```

I identify the necessary elements using selectors. Then I do what I always do in scripts after identifying the elements.

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

I add one (I usually try to add only one) listener, in which I assign actions to detected events. We have three actions to choose from: checking location using the browser's `navigator` object, saving, and deleting the location.

The code responsible for handling the `navigator` is below.

```js
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            info.innerHTML = "Geolocation is not supported by this browser.";
        }
    }
```

If the user consents to access their location, it is passed to the `showPosition` function.

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

This function, in turn, sends the appropriate request and fills the form field with the formatted address corresponding to the browser's coordinates.

Saving the location - that is, submitting the form is done by another function:

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

Its operation starts with sending a POST request with the form content. If we receive a response, we check if the place is already assigned to the user by filtering the `places` array. If so, we do nothing more. If it wasn't, we add it to the `places` array and append the location to the list of places using the syntax `.innerHTML +=`. There are methods that treat HTML as a DOM tree, but they are effective when used in a broader context. In this case, the content appending method, although less elegant, was chosen for its greater simplicity.

The last method is responsible for removing a place from the user's list of places.

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

Here, unlike when saving, we remove the element from the `places` array and clear the `HTML` corresponding to the place we are removing. Finally, we add a screenshot from an example usage:

![](https://i.imgur.com/YwW9q5l.png)

This is the entire source code. There are no tests here, no DoctrineFixturesBundle, no admin panel, no gulp.
However, most importantly, there is no room. For this reason, all the mentioned things have been cut out.
This entry is still probably the longest one I have written. Its purpose was not to present a comprehensive application
but an example of using FOSUserBundle.

I hope this will help someone in implementing this excellent package in their project. As always, I am looking forward to your criticism,
questions, and suggestions on what I can improve.
