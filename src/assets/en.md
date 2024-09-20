---
title: Ruby on Rails - quick introduction
slug: rails
publishDate: 2021-04-20T11:28:00.000Z
date_updated: 2021-04-20T12:18:38.000Z
tags: ['rails', 'ruby']
excerpt: An introduction to Ruby on Rails presenting CRUD, database relationships, mailer, and communication through web sockets.
---

In 2019, I was rewriting a certain medical system from Rails to PHP, and in 2021, from Rails to NodeJS. Perhaps you also encounter Rails-based systems that are losing maintenance. This introduction will help you quickly familiarize yourself with the basics of this framework.

We will write a blog from scratch in this guide. I would like to mention that I am not familiar with Ruby or Rails, so instead of an extensive introduction, we have a recreation of my learning process.

Assumptions:

* we are using Linux (Arch)

## Setting up the application - CRUD

Let's start by installing the appropriate version of Ruby.

```bash
curl -sSL https://get.rvm.io | bash -s stable --rails
```

`rvm` is a tool similar to `nvm` - it allows you to manage the version of the interpreter, which is particularly useful when working with systems that use different versions of interpreters. You can read more about it here:

[RVM: Ruby Version Manager - Installing RVM

Fastly

![](https://rvm.io/images/logo.png)](https://rvm.io/rvm/install)

We create the application using the command

```bash
rails new weblog && cd weblog
```

This command takes a long time because it requires the installation of all `gem` packages and the compilation of `node-sass`.

The next step is to automatically generate the code to perform CRUD operations on a post. Posts will have a title and content.

```bash
rails generate scaffold post title:string body:text
```

This command generates a significant number of files:

![](./Screenshot-from-2021-04-18-14-15-08.png)

One of these files is the database migration, which is saved in `db/migrate/20210418121400_create_posts.rb` and looks like this:

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

To synchronize the database with the result of this migration, we enter the following command:

```bash
rails db:migrate
```

You may wonder, "Which database?". In the `config/database.yml` file, we can see the configuration from which it follows that the default is `sqlite`. The schema of the database is in the `db/schema.rb` file.

---

This is a good place for a digression. When migrating systems based on Ruby on Rails, I wondered why the production environment had "sqlite", and I thought someone deliberately configured it that way. It turns out that it was enough not to change the configuration in this file. Another problem that puzzled me two years ago was the "updated_at" field in tables that did not support editing. Seeing "updated_at" and not having documentation, I thought there was a process of editing these tables, but it is also a result of the default "rails" configuration, which adds these columns everywhere.

---

To start the server, we use the following command:

```
rails server
```

One of the great advantages of Rails is that we can already use the working CRUD at the link

[http://127.0.0.1:3000/posts](http://127.0.0.1:3000/posts)

After manually creating a post, we get:

![](./Screenshot-from-2021-04-18-14-33-12.png)

What's even better is that we also have an API at the `/posts.json` endpoint.

![](./Screenshot-from-2021-04-18-14-37-18.png)

Unfortunately, an attempt to create a post through the API

```
http POST localhost:3000/posts.json title="Hello" body="Ok"
```

results in an error

```
Can't verify CSRF token authenticity.
```

To disable CSRF protection, we configure the `protect_from_forgery` option in the `app/controllers/application_controller.rb` file.

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session
end
```

Now the API can save posts. Both

```
http POST localhost:3000/posts.json title=ok
```

and

```
http POST localhost:3000/posts.json body=ok
```

will save their posts without validating their correctness.

![](./Screenshot-from-2021-04-18-14-52-53.png)

To enforce the presence of the `title` parameter in a post, we add the `validates_presence_of` flag in the `app/models/post.rb` file.

```
class Post < ApplicationRecord
  validates_presence_of :title
end
```

Thanks to this, it will be impossible to add posts without a title, both on the page

![](./Screenshot-from-2021-04-19-14-41-18.png)

and through the API

![](./Screenshot-from-2021-04-19-14-42-01.png)

## Debugging - Rails Console

A very useful tool when working with Ruby on Rails is the console, which is available after entering the command:

```
rails console
```

It allows interactive access to data using the Ruby language and the objects defined in Rails. For example, you can see the first post by entering

```
Post.first
```

To get all posts, we write

```
Post.all
```

We can get the posts created from yesterday to tomorrow by writing

```
Post.where(created_at: Date.yesterday..Date.tomorrow)
```

It is easy to transform it into the form of an SQL query by adding the `to_sql` property at the end

```
Post.where(created_at: Date.yesterday..Date.tomorrow).to_sql
```

To create a new post, we write

```
Post.create! title: 'Hello', body: 'World'
```

## Relationships between tables

A typical example of a relationship with respect to posts is comments. We don't need the same controllers and views for comments as for posts, so instead of using `scaffold`, we will use the `resource` flag to generate them.

```
rails generate resource comment post:references body:text
```

We can see the full list of available generators by entering the command:

```
rails generate
```

or by reading the documentation:

[The Rails Command Line — Ruby on Rails Guides

The Rails Command LineAfter reading this guide, you will know: How to create a Rails application. How to generate models, controllers, database migrations, and unit tests. How to start a development server. How to experiment with objects through an interactive shell.

![](https://guides.rubyonrails.org/images/favicon.ico)Ruby on Rails Guides

![](https://avatars.githubusercontent.com/u/4223)](https://guides.rubyonrails.org/command_line.html#bin-rails-generate)

In the meantime, let's go back to the files generated using the `resource` option.

![](./Screenshot-from-2021-04-18-15-09-56-1.png)

Again, a migration was created, this time with the content:

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

To execute it, we enter

```
rails db:migrate
```

Now let's deal with routing. It doesn't make sense to ask for all comments. They are always associated with the post they relate to. Therefore, in the `config/routes.yml` file, we replace the adjacent lines

```ruby
Rails.application.routes.draw do
  resources :posts
  resources :comments
end
```

with configuration indicating that comments should be nested within posts

```ruby
Rails.application.routes.draw do
  resources :posts do
    resources :comments
  end
end
```

The routing can be displayed using the command:

```
rails routes
```

![](./Screenshot-from-2021-04-18-15-40-23-2.png)

As for the direction of the relationship, at this point, comments belong to posts, as described in the `app/models/comment.rb` file:

```
class Comment < ApplicationRecord
  belongs_to :post
end
```

But posts do not have a defined relationship with comments, which we will fix by adding `has_many` to `app/models/post.rb`.

```
class Post < ApplicationRecord
  has_many :comments
  validates_presence_of :title
end
```

In the console, we can now create a sample comment

```
Post.second.comments.create! body: "My first comment to the second post"
```

To display the comments and be able to add them, we will write helper view fragments (partials). `app/views/comments/_comment.html.erb` will be used to display a single comment

```
<p><%= comment.body %> -- <%= comment.created_at.to_s(:long) %></p>
```

While `app/views/comments/_new.html.erb` will be a form for creating a comment

```
<%= form_for([ @post, Comment.new], remote: true) do |form| %>
  Your comment: <br/>
  <%= form.text_area :body, size: '50x2' %><br/>
  <%= form.submit %>
<% end %>
```

We will include them in the view for a single post, by adding the following code to the `app/views/posts/show.html.erb` file

```
<hr>

<h2>Comments (<span id="count"><%= @post.comments.count %></span>)</h2>

<div id="comments">
   <%= render @post.comments %>
</div>

<%= render 'comments/new', post: @post %>
```

Now our post view will look as follows

![](./Screenshot-from-2021-04-18-16-19-22-1.png)

Although it looks ready to work, the comment creation functionality is still not available. We have only prepared the view, but we are missing the logic that would handle saving the comments to the database and associating them with posts.

To include it, we need to handle comment creation in the `app/controllers/comments_controller.rb` controller.

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

Let's take a closer look at it. It starts with the `before_action` option, which sets the post based on the parameter from the URL. Then, in `create`, we use this post to create a comment for it, with the parameters coming from `comments_params`, which fetches them from the request body.

Next, we redirect to the page with posts. This works very well on the page.

![](./Screenshot-from-2021-04-20-09-47-58.png)

But if we want to create comments from the API, every time we are redirected to the post, we will see it without the comments. If we replace

```
redirect_to @post
```

in the controller with instructions analogous to those for the post

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

we will get an error

![](./Screenshot-from-2021-04-18-18-28-49-1.png)

This happens because now the comments require a structure to be assigned to them when composing them in JSON. This is solved thanks to the fantastic `jbuilder` library.

[rails/jbuilder

Jbuilder: generate JSON objects with a Builder-style DSL - rails/jbuilder

GitHub rails

![](https://opengraph.githubassets.com/9d3c523e683d19d728cc3cf514eeedf49593ddb0bea84432b4c012c57bea8189/rails/jbuilder)](https://github.com/rails/jbuilder)

By creating the `app/views/comments/show.json.jbuilder` file with the following content:

```
json.partial! "posts/post", post: @post
json.comments @post.comments, :id, :body, :created_at
```

we configure the server to respond with the post view, including a list of all comments that belong to it, after creating a comment. This view corresponds to what we see in the HTML version, although it is not in accordance with REST principles.

![](./Screenshot-from-2021-04-18-18-36-24-1.png)

If we want to display that specific comment, we can use the syntax

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

in the controller. Then, in response view, we will see the comment along with the post.

![](./Screenshot-from-2021-04-20-11-48-56.png)

You can read more about formatting here:

[Rendering JSON in a Rails API

To go over rendering JSON in a Rails API, I will use an example. Example: Models: doctor,...

![](https://res.cloudinary.com/practicaldev/image/fetch/s--t7tVouP9--/c_limit,f_png,fl_progressive,q_80,w_192/https://practicaldev-herokuapp-com.freetls.fastly.net/assets/devlogo-pwa-512.png)DEV CommunityCindy

![](https://dev.to/social_previews/article/323041.png)](https://dev.to/caicindy87/rendering-json-in-a-rails-api-25fd)

## Sending Emails

Sending emails in response to events is a very common feature in web services. Instead of writing the code again, we will use a generator:

```
rails generate mailer comments submitted
```

This is a mailer that sends a welcome email. The first thing we will do is configure the data to be injected into the templates. In the `comments_mailer.rb` file, we write the code:

```
class CommentsMailer < ApplicationMailer
  def submitted(comment)
    @comment = comment

    mail to: "gustaw.daniel@gmail.com", subject: 'New comment'
  end
end
```

In the `app/views/comments_mailer` directory, we have two files with templates. For the HTML view, the file is `submitted.html.erb`. We will modify it to show the new comment using the previously defined partial:

```
<h1>New comment on post: <%= @comment.post.title %></h1>

<%= render @comment %>
```

In the `submitted.text.erb` file, we can no longer use `render`, so we will simplify the text view to:

```
New comment on post: <%= @comment.post.title %>: <%= @comment.body %>
```

What's amazing about Rails is that we have a ready-made view to preview these emails without having to send them. To use it, we just need to specify the comment we want to display. To do this, in the `test/mailers/previews/comments_mailer_preview.rb` file, we change the line

```
CommentsMailer.submitted
```

to

```
CommentsMailer.submitted Comment.first
```

At the address

[http://localhost:3000/rails/mailers/comments\_mailer/submitted](http://localhost:3000/rails/mailers/comments_mailer/submitted)

we can see a preview of this email.

![](./Screenshot-from-2021-04-18-19-17-35-1.png)

However, we cannot expect this email to be sent immediately. To include sending it, we need to add the line

```
CommentsMailer.submitted(comment).deliver_later
```

in the comments controller, after including the emailer in the comments controller.

For further learning, I recommend the following resources:

[Ruby on Rails Tutorial - Tutorialspoint

Ruby on Rails Tutorial - Ruby on Rails is an extremely productive web application framework written in Ruby by David Heinemeier Hansson. This tutorial gives you a complete understanding

![](https://www.tutorialspoint.com/favicon.ico)Ruby on Rails Tutorial

![](https://www.tutorialspoint.com/videotutorials/images/loader.gif)](https://www.tutorialspoint.com/ruby-on-rails/index.htm)

[Ruby on Rails

A web-application framework that includes everything needed to create database-backed web applications according to the Model-View-Controller (MVC) pattern.

Ruby on Rails

![](https://avatars.githubusercontent.com/u/4223)](https://rubyonrails.org/)
