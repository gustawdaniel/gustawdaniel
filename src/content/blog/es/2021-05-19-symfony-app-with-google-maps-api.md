---
author: Daniel Gustaw
canonicalName: symfony-app-with-google-maps-api
coverImage: http://localhost:8484/3dc294cf-2fe2-4b97-8267-4f1e2d364ca3.avif
description: Una aplicación simple que integra el paquete de usuario fos con Google Maps. El servicio permite iniciar sesión, registrarse y guardar su lista de ubicaciones validadas por la API de Google.
excerpt: Una aplicación simple que integra el paquete de usuario fos con Google Maps. El servicio permite iniciar sesión, registrarse y guardar su lista de ubicaciones validadas por la API de Google.
publishDate: 2021-05-18 20:50:00+00:00
slug: es/aplicacion-con-fosuserbundle-y-google-maps-api
tags:
- symfony
- fosuserbundle
- google maps
- twig
- css
title: Aplicación con FOSUserBundle y Google Maps API
updateDate: 2021-06-22 09:23:37+00:00
---

## Descripción del Proyecto

Este es un proyecto escrito como una de las funcionalidades durante mi colaboración con `Smartselect`. Lo más divertido es que fue mi primer contacto con `FOSUserBundle`, `Google Maps API` y el objeto `navigator`. Cuando lo estaba escribiendo, no sabía `JavaScript`. Aunque el código requería un poco de actualización y una separación exhaustiva de otras funcionalidades de toda la aplicación antes de la publicación, resultó que no fue difícil, y en esta entrada, presenté cómo construirlo archivo por archivo desde cero.

En la entrada, aprenderás cómo instalar, configurar y sobrescribir `FOSUserBundle` - el paquete más popular para la gestión de usuarios en `Symfony`. Crearemos varias vistas relacionadas con el inicio de sesión, el registro, la gestión de cuentas, la restablecimiento de contraseñas, y así sucesivamente. Si te gusta el frontend, te sentirás como pez en el agua durante la mayor parte de esta entrada. Nos sumergiremos en el backend con la lógica de la aplicación, lo que implica utilizar la `Google Maps API` para traducir direcciones textuales o coordenadas en entidades en nuestra base de datos. Ajax no faltará, veremos cómo el objeto `navigator` nos permite acceder a la ubicación del navegador y cómo reconciliar Twig y JavaScript en un frontend.

Puedes ver la aplicación en acción en el video a continuación:

La composición del código fuente es:

```
PHP 69.7% HTML 20.9% CSS 5.8% ApacheConf 3.1% JavaScript 0.5%
```

## Instalación

Hay dos maneras de configurar un nuevo proyecto Symfony: [instalación desde cero](http://symfony.com/doc/current/best_practices/creating-the-project.html) y clonación desde GitHub.

Si quieres instalar el proyecto de la manera más sencilla posible, puedes descargarlo de [GitHub](https://github.com/gustawdaniel/geo_local) y instalarlo según las instrucciones en `README.md`.

En esta publicación, te mostraré cómo instalar el proyecto desde cero. Puedes evitar mirar mi repositorio y al ejecutar todos los comandos y crear los archivos a continuación deberías obtener prácticamente el mismo resultado. Las únicas diferencias serán que, para mayor claridad, no incluí varias vistas no utilizadas, como el panel de administración o contacto.

Volviendo a la instalación. Si quieres instalar desde cero, la documentación de Symfony recomienda utilizar su instalador.

```
symfony new geo_local && cd geo_local
```

## FosUserBundle

Queremos crear usuarios. Para este propósito, utilizaremos uno de los paquetes más populares: [FOSUserBundle](https://symfony.com/doc/master/bundles/FOSUserBundle/index.html).

```
composer require friendsofsymfony/user-bundle "~2.0@dev"
```

Para usarlo, necesitamos registrarlo en el núcleo de la aplicación agregando el elemento: `new FOS\UserBundle\FOSUserBundle()` al array `$bundles` en el archivo `app/AppKernel.php`.

A continuación, extendemos la clase `BaseUser` para poder modificar la clase que describe a los Usuarios (asumo que estaremos usando MySQL, para otros motores de base de datos la configuración puede verse un poco diferente):

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

Estamos cambiando el contenido del archivo: `app/config/security.yml`

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

Finalmente, en el archivo `app/config/config.yml`, descomente la línea que contiene la entrada `#translator: { fallbacks: ["%locale%"] }`. Y finalmente, agregue:

```yml
fos_user:
    db_driver: orm
    firewall_name: main
    user_class: AppBundle\Entity\User
```

También deberíamos agregar dos líneas a la configuración de enrutamiento `app/config/routing.yml`:

```yml
fos_user:
    resource: "@FOSUserBundle/Resources/config/routing/all.xml"
```

Para que todo funcione, también debemos establecer nuestros parámetros de conexión a la base de datos. En mi caso, esto se reduce a establecer: la entrada `database_name: geo_local` en los archivos: `app/config/parameters.yml` y `app/config/parameters.yml.dist`.

Creamos la base de datos y las tablas necesarias utilizando los comandos:

```bash
php bin/console doctrine:database:create
php bin/console doctrine:schema:update --force
```

Ahora todo debería funcionar. Quiero decir que después de iniciar el servidor con el comando `php bin/console server:run` y entrar la dirección `127.0.0.1:8000/login` en el navegador, deberíamos ver algo como esto:

![domyślny_login_fos_user_bundle](https://i.imgur.com/cCUzKD4.png)

### Sobrescribiendo el Comportamiento de FOSUserBundle

Ahora tenemos dos problemas, el primero es que no se ve bien, el segundo es que queremos usar `email` en lugar de `nombre de usuario`, y después de iniciar sesión, queremos agregar nuestra propia redirección. Comenzaremos con la lógica y dejaremos el front para después.

#### Reemplazando `nombre de usuario` con `email`

Una instrucción muy clara sobre cómo eliminar el campo `nombre de usuario` se puede encontrar en [stack](http://stackoverflow.com/questions/8832916/remove-replace-the-username-field-with-email-using-fosuserbundle-in-symfony2). En la clase `User`, sobrescribimos el setter para el campo de email.

```php
public function setEmail($email)
{
    $email = is_null($email) ? '' : $email;
    parent::setEmail($email);
    $this->setUsername($email);

    return $this;
}
```

No seguiremos esta instrucción demasiado al pie de la letra, porque en la documentación oficial, se puede leer entre líneas una mejor manera. Usando la documentación sobre [sobrescribir formularios](http://symfony.com/doc/master/bundles/FOSUserBundle/overriding_forms.html), creamos el archivo `src/AppBundle/Form/RegistrationType.php` que sobrescribirá el formulario de registro predeterminado para nosotros. Al registrarse, queremos exigir al usuario que proporcione solo una contraseña, por lo que mataremos dos pájaros de un tiro al sobrescribir este formulario. Aquí está el contenido del archivo:

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

Al eliminar y agregar la contraseña, eliminamos un truco bastante interesante y avanzado de repetir este campo, que es utilizado por `FOSUserBundle`. De manera similar, sobreescribimos la edición del perfil en `src/AppBundle/Type/ProfileType.php`:

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

Registramos nuestros formularios como servicios modificando el archivo `app/config/services.yml`:

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

Al final de la configuración del paquete, establecemos nuestros formularios como aquellos que deben sobrescribir los valores predeterminados.

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

No tocamos la validación en absoluto. Cabe señalar que el [enlace](http://stackoverflow.com/questions/8832916/remove-replace-the-username-field-with-email-using-fosuserbundle-in-symfony2) con las instrucciones se refería a la versión 2 de Symfony, mientras que en nuestro proyecto usamos la versión 3.

#### Redirección Después de Iniciar Sesión

Por defecto, después de iniciar sesión, `FOSUserBundle` nos redirige al perfil del usuario. Esto es lógico, pero no práctico en nuestro caso. La funcionalidad principal de la aplicación no girará en torno al cambio de correo electrónico y contraseña. En cambio, queremos redirigir al usuario a una ruta llamada `homepage`, y solo su controlador enviará a los usuarios registrados al panel con lugares, mientras que los no registrados a la página informativa. Para redirigir al usuario a `homepage` después de iniciar sesión, haremos los siguientes cambios: añadiremos el archivo `src/AppBundle/Security/LoginSuccessHandler.php` con el contenido:

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

En los servicios (`app/config/services.yml`) debemos agregar el servicio:

```yml
    authentication.handler.login_success_handler:
        class:  AppBundle\Security\LoginSuccessHandler
        arguments:  ['@router', '@security.authorization_checker']
```

Deberíamos agregar el parámetro `success_handler` al archivo `app/config/security.yml`.

```yml
    firewalls:
        main:
            pattern: ^/
            form_login:
                provider: fos_userbundle
                csrf_token_generator: security.csrf.token_manager
                success_handler: authentication.handler.login_success_handler
```

### Sobrescribiendo la apariencia de FOSUserBundle

Ahora que tenemos la cantidad correcta de campos en el formulario, podemos cambiar la apariencia para que no asuste a los usuarios y no cause pesadillas. Mostraremos la lista de rutas que debemos cuidar con el comando:

```bash
php bin/console debug:router | grep fos_user
```

La forma más simple de anular la apariencia predeterminada es ejecutar el siguiente comando.

```bash
mkdir -p app/Resources/FOSUserBundle/views && cp -r vendor/friendsofsymfony/user-bundle/Resources/views/* "$_"
```

#### Agregar bibliotecas externas

Ahora instalaremos bibliotecas de frontend y añadiremos nuestros propios estilos y scripts.  
Para evitar problemas con el almacenamiento en caché de Twig, deshabilitaremos esta función en el modo de desarrollo añadiendo las siguientes líneas al archivo `app/config/config_dev.yml`:

```yml
twig:
    cache: false
```

Creamos un archivo `.bowerrc` con el contenido:

```json
{
  "directory": "web/bower_components/"
}
```

Inicializamos bower con el comando:

```
bower init
```

Estamos instalando bootstrap 3, animate.css, components-font-awesome, jQuery e iCheck - una pequeña biblioteca basada en jQuery para mostrar efectos relacionados con la verificación de campos de formulario y casillas de verificación:

```
bower install --save bootstrap#^3.3.7 animate.css#^3.5.2 components-font-awesome#^4.7.0 iCheck#^1.0.2 jquery#^3.1.1
```

Agregamos líneas a `.gitignore`:

```
/.idea
/web/bower_components
```

No soy un buen desarrollador front-end, así que compro diseños front-end. También fue así aquí. El CSS que estoy adjuntando fue comprado en el sitio web 
[wrapbootstrap.com](https://wrapbootstrap.com/theme/eternity-forms-WB0G8810G). Recorté la mitad de la funcionalidad no utilizada y cambié los enlaces a las pieles `iCheck`. Colocé el archivo `css` en la ubicación `src/AppBundle/Resources/public/css/forms.css`.

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

Necesitamos un script más - `src/AppBundle/Resources/public/js/iCheck-config.js` es la configuración del plugin `iCheck` utilizado para resaltar interactivamente los campos de formulario activos:

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

Lo vinculamos con el directorio `web` usando el comando

```
php bin/console assets:install --symlink
```

Este no es el mejor método disponible. Uno mejor es usar `gulp`, pero este es el más sencillo. Con algunos archivos de estilo y script y algunas bibliotecas externas, la falta de concatenación y minificación no es nada terrible. Por supuesto, crear un archivo con estilos directamente en el directorio web es más simple, pero incorrecto.

Lo último que tenemos que hacer es agregar formularios de Bootstrap como predeterminados para Twig, en el archivo `app/config/config.yml` agregamos la línea:

```yml
twig:
    form_themes:
        - 'bootstrap_3_layout.html.twig'
```

#### Plantilla base

Comenzaremos personalizando la apariencia del inicio de sesión. El inicio de sesión heredará de `layout.html.twig` de FOSUserBundle, y esto heredará de `base.html.twig`. Así que para construir la casa desde los cimientos, no desde el techo, echaremos un vistazo a la plantilla base - `app/Resources/views/base.html.twig`.

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

#### Diseño para FOSUserBundle

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

#### Inicio de sesión

```twig
{% extends "@FOSUser/layout.html.twig" %}

{% block fos_user_content %}
    {{ include('@FOSUser/Security/login_content.html.twig') }}
{% endblock fos_user_content %}

{% block title %}Login Form{% endblock %}
```

Se ha añadido mucho más código al archivo `app/Resources/FOSUserBundle/views/Security/login_content.html.twig`

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

Sin embargo, esto es solo el front - un formulario de inicio de sesión y dos enlaces en el twig. Y dado que el front habla más que mil palabras, en lugar de describirlo, estoy pegando la captura de pantalla:

![login](https://i.imgur.com/avrKaZd.png)

#### Registro

El registro se ve similar.  
Archivo: `app/Resources/FOSUserBundle/views/Registration/register.html.twig`

```twig
{% extends "@FOSUser/layout.html.twig" %}

{% block fos_user_content %}
{% include "@FOSUser/Registration/register_content.html.twig" %}
{% endblock fos_user_content %}

{% block title %}Register{% endblock %}
```

Archivo: `app/Resources/FOSUserBundle/views/Registration/register_content.html.twig`

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

Efecto:

![register](https://i.imgur.com/i9BZooS.png)

Si el registro es exitoso, felicitamos al usuario con un mensaje del archivo: `app/Resources/FOSUserBundle/views/Registration/confirmed.html.twig`

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

Que se presenta de la siguiente manera:

![confirm](https://i.imgur.com/8v1SLZ1.png)

#### Restablecimiento de Contraseña

Si un usuario con una cuenta olvida su contraseña, puede enviarla a su correo electrónico (si los parámetros apropiados para enviar correos electrónicos están configurados en `app/config/parameters.yml`) utilizando un formulario cuyo código se encuentra en el archivo `app/Resources/FOSUserBundle/views/Resetting/request_content.html.twig`

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

El formulario se ve así:

![reset](https://i.imgur.com/XfCorCh.png)

El archivo responsable de lo que aparece en la pantalla después de ingresar el correo electrónico es: `app/Resources/FOSUserBundle/views/Resetting/check_email.html.twig` con el contenido

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

que se ve así:

![check](https://i.imgur.com/hZy5ERk.png)

En el correo electrónico, tenemos un enlace para restablecer la contraseña. La plantilla Twig se encuentra en el archivo: `app/Resources/FOSUserBundle/views/Resetting/reset_content.html.twig` y tiene el código:

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

Formulario de cambio de contraseña como sigue:

![](https://i.imgur.com/N7Ot9V6.png)

#### Panel de Usuario

Si nosotros, como usuario conectado, seleccionamos `MiCuenta` en el menú, seremos redirigidos a la vista de la cuenta. Su html se genera a partir del archivo `app/Resources/FOSUserBundle/views/Profile/show_content.html.twig`

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

y se ve así:

![profile](https://i.imgur.com/jwR8Nlg.png)

El botón `Editar Lugares` llevará a la funcionalidad principal de la aplicación. Sin embargo, para completar lo relacionado con `FOSUserBundle`, ahora mostraremos la edición del perfil y el cambio de contraseña. Edición del perfil: `app/Resources/FOSUserBundle/views/Profile/edit_content.html.twig`

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

Todo el formulario se reduce a un campo - `email`, ya que es el único atributo que queremos asignar al usuario.

La plantilla de cambio de contraseña está en el archivo `app/Resources/FOSUserBundle/views/ChangePassword/change_password_content.html.twig`

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

Estos son todos los cambios que hice para adaptar `FOSUserBundle` a mis requisitos. En `app/Resources/FOSUserBundle`, hay archivos que no modifiqué, por ejemplo, todo el directorio `Group`, que está relacionado con las interacciones entre usuarios, pero esta funcionalidad no es utilizada por nosotros. También dejé el correo electrónico para restablecer la contraseña, que sin gráficos se ve así:

![reset](https://i.imgur.com/zksqsDt.png)

Pero en el caso del correo electrónico, es completamente permisible.

## AppBundle

Una vez que tengamos un sistema de gestión de usuarios funcional, valdrá la pena ofrecerles una característica interesante. Para mantener un equilibrio entre una aplicación completa y un buen ejemplo, estableceremos los siguientes requisitos para la lógica de negocio de la aplicación:

* El usuario puede agregar cualquier número de lugares a su cuenta
* Los lugares se seleccionan ingresándolos en el formulario o utilizando geolocalización
* Un lugar determinado puede ser separado de la cuenta, pero no desaparecerá de la base de datos
* Cualquier número de usuarios puede ser asignado a un lugar determinado
* La gestión de lugares (agregar, eliminar, localizar) no sobrecarga la página

### Base de datos (Modelo)

Comenzaremos preparando la base de datos. Queremos agregar una tabla para lugares y crear una relación de muchos a muchos entre esta y la tabla `users`. Creamos el archivo `src/AppBundle/Entity/Place.php` en el que definimos la clase encargada de representar los lugares. Por defecto, comenzamos con propiedades.

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

Además de las propiedades estándar relacionadas con la ubicación, tenemos la propiedad `$users`. En la base de datos, corresponderá a la ocurrencia de la tabla `users_places` con identificadores de usuarios y lugares. Esto requerirá algunos cambios más en la clase `User`, pero hablaremos de eso más tarde. Ahora revisemos los métodos de la clase `Place`.

```php
    public function __construct() {
        $this->users = new ArrayCollection();
        $this->setAddAt(new \DateTime("now"));
    }
```

El constructor establece la fecha de adición del lugar y la variable `$users` como `ArrayCollection`. Es un objeto similar a un array normal, pero tiene varios métodos convenientes para usarlo como una colección de objetos. También tenemos un getter y setter para `$googleId`:

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

Para la variable `$users`, tenemos tres métodos.

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

Puedes ver cómo aprovechamos `ArrayCollection` aquí; si `$users` fuera un array regular, estas operaciones lucirían un poco menos elegantes.

Los siguientes métodos son pares de getters y setters para la dirección: `$formattedAddress`, coordenadas `$lon`, `$lat`, y el tiempo en que la dirección fue añadida a la base de datos `$addAt`:

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

Para los parámetros restantes, ya no utilizaremos el par getter-setter. Debido a su ocurrencia estructurada en la API de Google Maps, que utilizaremos, estableceremos un setter para todos ellos. No se necesitarán getters, por lo que los métodos para manejar los parámetros restantes son los siguientes:

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

El primero de ellos devuelve una lista de nombres soportados por el segundo método, estos nombres pueden ser sustituidos como un `string` para `$name`. La función que comienza con `lcfirst` se encarga de cambiar la notación de `a_b` a `aB`, lo que significa que elimina los guiones bajos y cambia las letras minúsculas después de los guiones bajos a mayúsculas.

Nos queda un método más - para convertir un objeto a una cadena.

```php
    public function __toString()
    {
        return json_encode(["id"=>$this->getGoogleId(),"address"=>$this->getFormattedAddress()],JSON_UNESCAPED_UNICODE);
    }
}
```

Para agregar correctamente la tabla de enlace, ahora haremos cambios en la clase `User` y agregaremos las líneas al archivo `src/AppBundle/Entity/User.php`:

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

Ahora podemos regenerar la base de datos con el comando:

```
php bin/console doctrine:schema:update --force
```

Finalmente, adjunto una visualización del esquema de la base de datos.

![database](https://i.imgur.com/jfjLAoV.png)

### Lógica del Servidor (Controlador)

Tenemos el modelo. Ahora los controladores. Finalmente, crearemos las vistas. En el controlador predeterminado (`src/AppBundle/Controller/DefaultController`), configuraremos la redirección para los usuarios registrados al camino con lugares:

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

Eso es todo respecto a la lógica por defecto.  
En el controlador `src/AppBundle/Controller/PlacesController` habrá mucha más lógica. Aquí está el método para mostrar la ruta `places`, a la que queremos redirigir a los usuarios conectados.

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

Antes de proceder, señalaré dos cosas: la primera es la falta de manejo de formularios y procesamiento de solicitudes. Estamos creando un formulario aquí, enviándolo a Twig, pero no lo estaremos recibiendo aquí. JavaScript se encargará de su procesamiento. La segunda cosa es que se ha utilizado la clase `PlaceType`, aunque aún no la hemos definido. Haré una pequeña digresión y mostraré el código de esta clase. Está ubicada en el archivo `src/AppBundle/Form/PlaceType.php`.

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

De PHP a nuestro lenguaje: esta clase es responsable de tener un solo campo en el formulario que representa. Ahora estamos regresando al controlador `src/AppBundle/Form/PlaceType.php`. El siguiente método será responsable de guardar el lugar en la base de datos.

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

Se puede llamar con el parámetro `debug` en la ruta, pero no es necesario. El método opera de la siguiente manera: recupera el contenido de la solicitud en la variable `$content`, guarda el array correspondiente al contenido de la solicitud en la variable `$params$, y almacenamos el valor correspondiente a la clave `formatted_address` en la variable `$formattedAddress$. Esto es exactamente lo que debería ser enviado por el formulario definido por la clase `PlaceType` presentada hace un momento.

Ahora, la línea `$address = $this->getAddress($formattedAddress);` hace algo muy importante. Envía una solicitud a la API de Google para traducir lo que el usuario ingresó en lo que Google entiende como la ubicación que probablemente quisieron decir. Volveremos al método `getAddress`, pero ahora terminaré de discutir el método `ajaxGeoSave`. La dirección obtenida es un array. Si el método fue invocado con el parámetro `debug`, se devuelve como `JSON` con un código HTTP de 200 y el resto del método no se ejecuta. De lo contrario, en el caso de uso normal, llamamos al método `getPlace`, que transforma el array `$address` en el objeto `$place$. Las siguientes tres líneas son la escritura en la base de datos. Finalmente, devolvemos `$address` como en el método con el parámetro `debug`, pero dado que escribimos satisfactoriamente en la base de datos, cambiamos el código HTTP a 201.

Entonces tenemos dos transformaciones de datos importantes aquí - de lo que el usuario ingresó a un array de datos de dirección de Google, y del array a nuestra estructura de datos - la clase `Place`.

Sin embargo, puede suceder que el usuario no quiera escribir su dirección, o se haya perdido y no sepa dónde se encuentra. En ese caso, podemos usar el método `geolocation` del objeto `navigator` disponible en `javascript`. Devuelve coordenadas geográficas. Nos gustaría traducirlas en una dirección legible por humanos. Para este propósito, utilizaremos el segundo método del controlador:

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

Su estructura es muy clara. Obtenemos datos de la solicitud, realizamos una transformación utilizando el método `getAddress`, y retornamos un arreglo con la dirección. Cabe destacar que esta vez `getAddress` toma un arreglo y no una cadena. Sin embargo, funciona correctamente, ya que dependiendo de lo que recibió, el método `getAddress` ejecuta una lógica ligeramente diferente adaptada tanto a direcciones textuales como a pares de coordenadas.

El siguiente método está relacionado con el triste evento de un usuario eliminando una dirección.

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

La dirección se busca por `googleId`. Si no se encuentra, devolvemos un error `404`; si se encuentra, solo se elimina el enlace entre el usuario y el lugar, mientras que el lugar permanece en la base de datos incluso si ya no está vinculado a ningún usuario.

Es hora de presentar el primero de los transformadores de datos: el método `getAddress`.

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

Este método verifica si recibió coordenadas o una dirección textual y, dependiendo de eso, prepara una `$url` ligeramente diferente. Luego, utilizando la solicitud más simple `file_get_contents`, recupera lo que responde Google, elimina lo innecesario y lo envía de vuelta.

Creo que este es un buen momento para mostrar lo que exactamente se está enviando de vuelta. Haremos una solicitud a `ajax_geo_save` con el parámetro `debug` para ver cómo se ve el `json` en la salida de este método.

![api1](https://i.imgur.com/My3cMbW.png)

![api2](https://i.imgur.com/88vr0jN.png)

Es claro que `formatted_address`, `place_id` y coordenadas tienen una ubicación bien definida aquí, pero otras propiedades de dirección se han empaquetado en un solo array `address_components` y están etiquetadas usando tipos que pueden ocurrir múltiples veces, pero algunos pueden estar ausentes. El último método que presentaré para procesar este array en un formato compatible con nuestro modelo de datos es `getPlace`.

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

Al principio, verificamos si la dirección dada ya está en nuestra base de datos. Si es así, podemos omitir toda la transformación, simplemente añadir al usuario actual a ella, y eso es suficiente. Sin embargo, supongamos que es una nueva dirección. En ese caso, primero debemos establecer su `google_id`, coordenadas y su versión formateada. Luego nos ocuparemos de los componentes etiquetados de la dirección.

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

Los extraeremos en un bucle doble. Por los componentes de la dirección y por los parámetros que estamos buscando. Si se encuentra algún parámetro, guardaremos la propiedad y la eliminaremos del array de parámetros, para evitar bucles vacíos.

```php
        $place->addUsers($this->getUser());

        return $place;
    }
}
```

### Vistas

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

y se ve así:

![olaces](https://i.imgur.com/7mkjpKI.png)

Una vista más interesante es la vista de lugares. La colocamos en el archivo `app/Resources/views/places/places.html.twig`

Su código HTML es bastante simple:

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

Vale la pena señalar cómo los métodos de gestión de vistas se complementarán entre sí de manera eficiente aquí en el lado del servidor (bucle Twig) y en el lado del cliente. Desde el momento en que se genera la vista inicial, todos los cambios se realizan mediante `javascript`.

La vista está equipada con su propio estilo, que se incluye al extender el bloque `stylesheets`.

```twig
{% block stylesheets %}
    {{ parent() }}
    <link href="{{ asset('bundles/app/css/place.css') }}" rel="stylesheet" />
{% endblock %}
```

El estilo se encuentra en el archivo `src/AppBundle/Resources/public/css/place.css` y tiene solo 4 reglas:

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

Si escribo en `css`, generalmente me apego a ese minimalismo. Es diferente con `javascript`. En la vista (`app/Resources/views/places/places.html.twig`), hay más en términos de volumen que en `html`. Realiza las siguientes tareas:

```js
{% block javascripts %}
{{ parent() }}

<script>
    var places = [];
    {% for place in places %}
    places.push({{ place|raw }});
    {% endfor %}
```

Al cargar la página, guarda un array de representaciones textuales de los objetos `Place` pasados a la variable Twig en una variable JavaScript `places`. Los necesitaremos para evitar la duplicación de contenido. Gracias a esta solución, tenemos el estado de la aplicación en una variable y en la pantalla al mismo tiempo.

A continuación, hago lo que siempre hago al iniciar el script.

```js
    var info = document.getElementById("info");
    var area = document.getElementsByClassName("section-title")[0];
    var list = document.getElementsByClassName("list")[0];
```

Identifico los elementos necesarios usando selectores. Luego hago lo que siempre hago en scripts después de identificar los elementos.

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

Agrego un oyente (normalmente trato de agregar solo uno), en el que asigno acciones a los eventos detectados. Tenemos tres acciones para elegir: verificar la ubicación usando el objeto `navigator` del navegador, guardar y eliminar la ubicación.

El código responsable de manejar el `navigator` está abajo.

```js
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            info.innerHTML = "Geolocation is not supported by this browser.";
        }
    }
```

Si el usuario consiente en acceder a su ubicación, se pasa a la función `showPosition`.

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

Esta función, a su vez, envía la solicitud apropiada y llena el campo del formulario con la dirección formateada correspondiente a las coordenadas del navegador.

Guardar la ubicación - es decir, enviar el formulario se realiza mediante otra función:

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

Su funcionamiento comienza con el envío de una solicitud POST con el contenido del formulario. Si recibimos una respuesta, verificamos si el lugar ya está asignado al usuario filtrando el array `places`. Si es así, no hacemos nada más. Si no lo estaba, lo agregamos al array `places` y añadimos la ubicación a la lista de lugares utilizando la sintaxis `.innerHTML +=`. Hay métodos que tratan el HTML como un árbol DOM, pero son efectivos cuando se utilizan en un contexto más amplio. En este caso, se eligió el método de adición de contenido, aunque menos elegante, por su mayor simplicidad.

El último método es responsable de eliminar un lugar de la lista de lugares del usuario.

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

Aquí, a diferencia de al guardar, eliminamos el elemento del array `places` y limpiamos el `HTML` correspondiente al lugar que estamos eliminando. Finalmente, añadimos una captura de pantalla de un ejemplo de uso:

![](https://i.imgur.com/YwW9q5l.png)

Este es el código fuente completo. No hay pruebas aquí, ni DoctrineFixturesBundle, ni panel de administración, ni gulp.  
Sin embargo, lo más importante, no hay espacio. Por esta razón, todas las cosas mencionadas han sido eliminadas.  
Esta entrada sigue siendo probablemente la más larga que he escrito. Su propósito no era presentar una aplicación integral  
sino un ejemplo de uso de FOSUserBundle.  

Espero que esto ayude a alguien en la implementación de este excelente paquete en su proyecto. Como siempre, espero con ansias sus críticas,  
preguntas y sugerencias sobre lo que puedo mejorar.
