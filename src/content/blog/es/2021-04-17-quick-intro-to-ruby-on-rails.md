---
author: Daniel Gustaw
canonicalName: quick-intro-to-ruby-on-rails
coverImage: http://localhost:8484/d85ff050-96df-4cb7-9058-f9097653e3ad.avif
description: Introducción a Ruby on Rails presentando CRUD, relaciones de base de datos, correo y comunicación por sockets web.
excerpt: Introducción a Ruby on Rails presentando CRUD, relaciones de base de datos, correo y comunicación por sockets web.
publishDate: 2021-04-17 11:28:00+00:00
slug: es/railes
tags:
- rails
- ruby
title: Ruby on Rails - introducción rápida
updateDate: 2021-04-17 12:18:38+00:00
---

En 2019, reescribí un cierto sistema médico de Rails a PHP, y en 2021 de Rails a NodeJS. Quizás también te estés encontrando con sistemas basados en Rails que están perdiendo mantenimiento. Esta introducción te ayudará a familiarizarte rápidamente con los conceptos básicos de este framework.

Escribiremos un blog completamente desde cero. Me gustaría señalar que no estoy muy familiarizado ni con Ruby ni con Rails, así que en lugar de una extensa introducción, tenemos una recreación de mi proceso de aprendizaje.

Supuestos:

* estamos usando linux (arch)

## Configurando la aplicación - CRUD

Comenzaremos con la instalación de la versión adecuada de ruby.

```bash
curl -sSL https://get.rvm.io | bash -s stable --rails
```

`rvm` es una herramienta análoga a `nvm` - te permite gestionar la versión del intérprete, lo cual es excepcionalmente útil al trabajar con sistemas que utilizan diferentes versiones de intérpretes. Puedes leer sobre ello aquí:

[RVM: Administrador de Versiones de Ruby - Instalando RVM](https://rvm.io/rvm/install)

Creamos la aplicación con el siguiente comando:

```bash
rails new weblog && cd weblog
```

Este comando tarda mucho tiempo porque requiere la instalación de todos los paquetes `gem` y la compilación de `node-sass`.

El siguiente paso es generar automáticamente el código para realizar operaciones CRUD en una publicación. Las publicaciones tendrán un título y contenido.

```bash
rails generate scaffold post title:string body:text
```

Este comando genera una gran cantidad de archivos:

![](http://localhost:8484/0cd60295-e8e0-49fb-aa4b-a6a818262938.avif)

Uno de ellos es la migración de la base de datos, que está escrita en `db/migrate/20210418121400_create_posts.rb` y se ve así:

```ruby
class CreatePosts < ActiveRecord::Migration[6.1]
  def change
    create_table :posts do |t|
      t.string :title
      t.text :body

      t.timestamps
    end
  end
end
```

Para sincronizar la base de datos con el resultado de esta migración, ingresamos

```bash
rails db:migrate
```

Aquí puede hacer la pregunta: "¿Qué base de datos?". En el archivo `config/database.yml` podemos ver la configuración que indica que por defecto es `sqlite`. En el archivo `db/schema.rb` está el esquema de la base de datos.

---

Este es un buen lugar para una digresión. Al migrar sistemas basados en Ruby on Rails, me pregunté por qué el entorno de producción usa "sqlite"; pensé que alguien lo configuró deliberadamente de esta manera. Resulta que era suficiente no cambiar la configuración en este archivo. Otro tema que ocupó mi mente hace dos años fue el campo "updated_at" en tablas que no manejaban edición. Al ver "updated_at" y carecer de documentación, pensé que había un proceso para editar estas tablas; sin embargo, esto también es una consecuencia de la configuración predeterminada de "rails", que en todas partes agrega estas columnas.

---

Para iniciar el servidor, utilizamos el comando

```
rails server
```

Una gran ventaja de Rails es que ya podemos usar un CRUD funcional en el enlace

[http://127.0.0.1:3000/posts](http://127.0.0.1:3000/posts)

Después de crear manualmente una publicación, obtenemos:

![](http://localhost:8484/b2c81fc5-5bed-4658-8d8e-12938d74d038.avif)

Lo que es aún más agradable es que también tenemos una "api" disponible en `/posts.json`

![](http://localhost:8484/80897738-a337-4640-a228-58517e8aff43.avif)

Desafortunadamente, el intento de crear una publicación a través de la API.

```
http POST localhost:3000/posts.json title="Hej" body="Ok"
```

termina con un error

```
Can't verify CSRF token authenticity.
```

Para deshabilitar la protección "CSRF" en el archivo `app/controllers/application_controller.rb`, configura la opción `protect_from_forgery`.

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session
end
```

Ahora el guardado de la publicación a través de la API funciona. Ambos

```
http POST localhost:3000/posts.json title=ok
```

cómo y

```
http POST localhost:3000/posts.json body=ok
```

publicarán sus entradas sin validar su corrección.

![](http://localhost:8484/8873c9da-4396-48b3-8d70-6108e8528fd7.avif)

Para hacer cumplir la presencia del parámetro `title` en el post, en el archivo `app/models/post.rb` añadimos la bandera `validates_presence_of`.

```
class Post < ApplicationRecord
  validates_presence_of :title
end
```

Gracias a ello, será imposible añadir publicaciones sin un título tanto en la página

![](http://localhost:8484/0062c4cc-438a-4837-b025-9a3bde260681.avif)

cómo y a través de API

![](http://localhost:8484/93aace27-457b-43d7-88f8-8189bda7a84a.avif)

## Depuración - Consola de Rails

Una herramienta muy útil al trabajar con Ruby on Rails es la consola que se puede acceder ingresando el comando:

```
rails console
```

Permite el acceso interactivo a los datos utilizando el lenguaje Ruby y objetos definidos en Rails. Por ejemplo, veremos la primera publicación ingresando

```
Post.first
```

Para obtener todas las publicaciones que escribimos

```
Post.all
```

Las publicaciones creadas desde ayer hasta mañana se recibirán por escrito.

```
Post.where(created_at: Date.yesterday..Date.tomorrow)
```

Se puede transformar fácilmente en una consulta SQL agregando la propiedad `to_sql` al final.

```
Post.where(created_at: Date.yesterday..Date.tomorrow).to_sql
```

Para crear una nueva publicación escribimos

```
Post.create! title: 'Hello', body: 'World'
```

## Relaciones Entre Tablas

Un ejemplo típico de una relación con respecto a las publicaciones son los comentarios. No necesitamos los mismos controladores y vistas para ellos que para las publicaciones, por lo que en lugar de `scaffold`, usaremos la bandera `resource` para la generación.

```
rails generate resource comment post:references body:text
```

Podemos ver la lista completa de generadores disponibles ingresando el comando:

```
rails generate
```

o leyendo la documentación

[La línea de comandos de Rails — Guías de Ruby on Rails](https://guides.rubyonrails.org/command_line.html#bin-rails-generate)

Mientras tanto, volveremos a los archivos generados por la opción `resource`.

![](http://localhost:8484/6043c7ba-5a2b-46fe-866e-5b0474cc6c5e.avif)

Se ha creado una migración aquí nuevamente, esta vez conteniendo:

```ruby
class CreateComments < ActiveRecord::Migration[6.1]
  def change
    create_table :comments do |t|
      t.references :post, null: false, foreign_key: true
      t.text :body

      t.timestamps
    end
  end
end
```

Para ejecutarlo, ingresamos

```
rails db:migrate
```

Ahora hablemos sobre el enrutamiento. No tiene sentido pedir todos los comentarios. Siempre están relacionados con la publicación a la que pertenecen. Así que en el archivo `config/routes.yml`, reemplazamos las ocurrencias adyacentes.

```ruby
Rails.application.routes.draw do
  resources :posts
  resources :comments
end
```

a configuración que permite los comentarios anidados en la publicación

```ruby
Rails.application.routes.draw do
  resources :posts do
    resources :comments
  end
end
```

La visualización del enrutamiento es posible gracias al comando:

```
rails routes
```

![](http://localhost:8484/818913a8-7bcb-47ad-953a-10efe7d9c6b4.avif)

En cuanto a la dirección de la relación, en este momento los comentarios pertenecen a las publicaciones como se describe en el archivo `app/models/comment.rb`

```
class Comment < ApplicationRecord
  belongs_to :post
end
```

Pero las publicaciones no tienen una relación designada con los comentarios, lo que solucionaremos agregando `has_many` a `app/models/post.rb`

```
class Post < ApplicationRecord
  has_many :comments
  validates_presence_of :title
end
```

En la consola ahora podemos crear un comentario de muestra.

```
Post.second.comments.create! body: "My first comment to second post"
```

Para mostrar comentarios y añadirlos, escribiremos fragmentos de vista auxiliares (parciales). `app/views/comments/_comment.html.erb` se utilizará para mostrar un solo comentario.

```
<p><%= comment.body %> -- <%= comment.created_at.to_s(:long) %></p>
```

Por otro lado, `app/views/comments/_new.html.erb` será el formulario para crear un comentario.

```
<%= form_for([ @post, Comment.new], remote: true) do |form| %>
  Your comment: <br/>
  <%= form.text_area :body, size: '50x2' %><br/>
  <%= form.submit %>
<% end %>
```

Los adjuntaremos en la vista de publicación única agregando el código al archivo `app/views/posts/show.html.erb`

```
<hr>

<h2>Comments (<span id="count"><%= @post.comments.count %></span>)</h2>

<div id="comments">
   <%= render @post.comments %>
</div>

<%= render 'comments/new', post: @post %>
```

Ahora nuestra vista del post se verá de la siguiente manera.

![](http://localhost:8484/ecf12b37-935a-4fdd-ba56-9ab97f52a860.avif)

Aunque parece listo para usar, la función de añadir comentarios aún no está disponible. Solo preparamos la vista, pero falta la lógica para guardar comentarios en la base de datos y vincularlos a las publicaciones.

Para integrarlo, necesitamos manejar la creación de comentarios en el controlador `app/controllers/comments_controller.rb`

```
class CommentsController < ApplicationController
  before_action :set_post

  def create
    @post.comments.create! comments_params
    redirect_to @post
  end

  private

  def set_post
    @post = Post.find(params[:post_id])
  end

  def comments_params
    params.required(:comment).permit(:body)
  end

end
```

Echemos un vistazo más de cerca. Comienza con la opción `before_action`, que establece la publicación según el parámetro de la `url`. Luego, en `create`, usamos esta publicación para crear un comentario, cuyos parámetros provienen de `comments_params`, que los recupera del cuerpo de la solicitud.

A continuación, hay una redirección a la página de publicaciones. Funciona muy bien en la página.

![](http://localhost:8484/77228d3e-7d38-4c1b-981a-05c9d74ab699.avif)

Pero si queremos crear publicaciones desde el nivel de API, cada vez que se nos redirige a la publicación, la veremos sin comentarios. Si reemplazamos

```
redirect_to @post
```

en el controlador usando instrucciones análogas a las del post

```
    respond_to do |format|
      if @post.save
        format.html { redirect_to @post, notice: "Comment was successfully created." }
        format.json { render :show, status: :created, location: @post }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @post.errors, status: :unprocessable_entity }
      end
    end
```

tendremos un error

![](http://localhost:8484/4d751696-3dfd-4684-b847-f0b28de86bbe.avif)

Es así porque ahora los comentarios requieren estructuración al organizarlos en un archivo JSON. Esto se resuelve gracias a la fantástica biblioteca `jbuilder`.

[rails/jbuilder](https://github.com/rails/jbuilder)

Al crear el archivo `app/views/comments/show.json.jbuilder` con el contenido

```
json.partial! "posts/post", post: @post
json.comments @post.comments, :id, :body, :created_at
```

configuraremos el servidor para que responda con la vista de la publicación que contiene una lista de todos los comentarios correspondientes una vez que se crea un comentario. Esta es una vista que corresponde a lo que vemos en la versión HTML, aunque no se ajusta a los principios REST.

![](http://localhost:8484/61a3d18f-8260-437b-9b0f-50dbe420e406.avif)

Si quisiéramos mostrar este comentario específico, podemos usar la sintaxis

```
  def create
    comment = @post.comments.create! comments_params

    respond_to do |format|
      if @post.save
        format.html { redirect_to @post, notice: "Comment was successfully created." }
        format.json { render json: comment.to_json(include: [:post]) }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @post.errors, status: :unprocessable_entity }
      end
    end

  end
```

en el controlador. Luego, en la vista de respuesta, veremos el comentario junto con la publicación.

![](http://localhost:8484/a43ef393-0a06-4fa2-94fc-2da3fd73f5e2.avif)

Más información sobre el formato se puede leer aquí:

[Renderizando JSON en una API de Rails](https://dev.to/caicindy87/rendering-json-in-a-rails-api-25fd)

## Enviando correos electrónicos

Una función muy común en los servicios web es enviar correos electrónicos en respuesta a ciertos eventos. En lugar de reescribir el código, utilizaremos un generador:

```
rails generate mailer comments submitted
```

Este es un correo electrónico enviando un saludo. Lo primero que haremos es configurar los datos que se inyectarán en las plantillas. En el archivo `comments_mailer.rb`, escribimos el código:

```
class CommentsMailer < ApplicationMailer
  def submitted(comment)
    @comment = comment

    mail to: "gustaw.daniel@gmail.com", subject: 'New comment'
  end
end
```

En `app/views/comments_mailer` tenemos dos archivos de plantilla. Para la vista HTML, es el archivo `submitted.html.erb`. Lo modificaremos para que, utilizando el parcial definido anteriormente, muestre el nuevo comentario:

```
<h1>New comment on post: <%= @comment.post.title %></h1>

<%= render @comment %>
```

En el archivo `submitted.text.erb`, ya no podemos usar `render`, por lo que simplificaremos la vista de texto al formulario:

```
New comment on post: <%= @comment.post.title %>: <%= @comment.body %>
```

Lo asombroso de Rails es que tenemos una vista lista para previsualizar estos correos electrónicos sin tener que enviarlos. Para usarla, solo necesitamos especificar el comentario que mostraremos. Para este propósito, en el archivo `test/mailers/previews/comments_mailer_preview.rb`, la línea

```
CommentsMailer.submitted
```

cambiamos a

```
CommentsMailer.submitted Comment.first
```

En la dirección

[http://localhost:3000/rails/mailers/comments\_mailer/submitted](http://localhost:3000/rails/mailers/comments_mailer/submitted)

Podemos ver una vista previa de este correo electrónico

![](http://localhost:8484/dd89e83f-d2c2-4833-a43b-b5a0ea528d96.avif)

Sin embargo, no podemos esperar que este correo electrónico se envíe de inmediato. Para incluir su envío, necesitamos agregar una línea.

```
CommentsMailer.submitted(comment).deliver_later
```

en el controlador de comentarios. El controlador completo debería verse así:

```
class CommentsController < ApplicationController
  before_action :set_post

  def create
    comment = @post.comments.create! comments_params
    CommentsMailer.submitted(comment).deliver_later

    respond_to do |format|
      if @post.save
        format.html { redirect_to @post, notice: "Comment was successfully created." }
        format.json { render json: comment.to_json(include: [:post]) }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @post.errors, status: :unprocessable_entity }
      end
    end

  end

  private

  def set_post
    @post = Post.find(params[:post_id])
  end

  def comments_params
    params.required(:comment).permit(:body)
  end

end
```

El flag "deliver_later" te permite adjuntar el envío de un correo electrónico al ciclo interno de Ruby on Rails, que lo enviará lo antes posible sin bloquear la ejecución del resto del código. Crear un comentario aún no enviará el correo electrónico al correo real, pero en la consola, veremos que tal acción se habría tomado si el envío estuviera completamente configurado.

![](http://localhost:8484/0f6a89a7-7d40-4b93-a98e-eca529b2fbec.avif)

No iremos por ese camino, pero si deseas completar la configuración, lee sobre `smtp_settings` y `delivery_method` en la documentación:

[Conceptos básicos de Action Mailer — Guías de Ruby on Rails](https://guides.rubyonrails.org/action_mailer_basics.html)

Ahora pasaremos a la comunicación en tiempo real.

## Cable - comunicación a través de web socket

Para usar la comunicación en tiempo real, necesitamos un canal. Lo generaremos con el comando:

```
rails generate channel comments
```

![](http://localhost:8484/8781f3f8-0891-49b7-83ab-be6216f97342.avif)

En el archivo `app/channels/comments_channel.rb` que contiene:

```ruby
class CommentsChannel < ApplicationCable::Channel
  def subscribed
    # stream_from "some_channel"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
```

agregando el método `broadcast`

```
  def self.broadcast(comment)
    broadcast_to comment.post, comment:
      CommentsController.render(partial: 'comments/comment', locals: { comment: comment })
  end
```

también haremos una simplificación de que la suscripción solo se aplicará al último post. Nuestro objetivo es mostrar los conceptos básicos de Rails, así que nos enfocaremos en llevar el mecanismo del canal a la presentación, saltando este aspecto. Como parte de esta simplificación, escribimos

```
  def subscribed
    stream_for Post.last
  end
```

Para habilitar el envío de mensajes al navegador, agregamos la línea

```
CommentsChannel.broadcast(comment)
```

con el correo electrónico incluido en el controlador de comentarios.

Un archivo con la configuración del canal `app/javascript/channels/comments_channel.js` se adjuntará al navegador. Lo configuramos de manera que, en respuesta a un comentario que se adjunta a la publicación (canal), se debe agregar al final del hilo, y el contador de comentarios debe aumentar en 1:

```
    received(data) {
        const commentsElement = document.querySelector('#comments');
        const countElement = document.querySelector('#count');

        if (commentsElement) {
            commentsElement.innerHTML += data.comment
        }
        if (countElement) {
            countElement.innerHTML = String(1 + parseInt(countElement.innerHTML))
        }
    }
```

El efecto es el siguiente:

Para un estudio más profundo, recomiendo los siguientes materiales:

[Tutorial de Ruby on Rails - Tutorialspoint](https://www.tutorialspoint.com/ruby-on-rails/index.htm)

[Ruby on Rails](https://rubyonrails.org/)
