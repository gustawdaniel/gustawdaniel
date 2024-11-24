---
author: Daniel Gustaw
canonicalName: quick-intro-to-ruby-on-rails
coverImage: http://localhost:8484/d85ff050-96df-4cb7-9058-f9097653e3ad.avif
description: Introduction to Ruby on Rails presenting CRUD, database relations, mailer, and web sockets communication.
excerpt: Introduction to Ruby on Rails presenting CRUD, database relations, mailer, and web sockets communication.
publishDate: 2021-04-17 11:28:00+00:00
slug: en/rails
tags:
- rails
- ruby
title: Ruby on Rails - quick introduction
updateDate: 2021-04-17 12:18:38+00:00
---

In 2019, I rewrote a certain medical system from Rails to PHP, and in 2021 from Rails to NodeJS. Perhaps you are also encountering Rails-based systems that are losing maintenance. This introduction will help you quickly familiarize yourself with the basics of this framework.

We will write a blog completely from scratch. I would like to point out that I am not very familiar with either Ruby or Rails, so instead of an extensive introduction, we have a recreation of my learning process.

Assumptions:

* we are using linux (arch)

## Setting up the application - CRUD

We will start with installing the appropriate version of ruby.

```bash
curl -sSL https://get.rvm.io | bash -s stable --rails
```

`rvm` is a tool analogous to `nvm` - it allows you to manage the interpreter version, which is exceptionally useful when working with systems that use different versions of interpreters. You can read about it here:

[RVM: Ruby Version Manager - Installing RVM](https://rvm.io/rvm/install)

We create the application with the following command:

```bash
rails new weblog && cd weblog
```

This command takes a long time because it requires the installation of all `gem` packages and compilation of `node-sass`.

The next step is to automatically generate code to perform CRUD operations on a post. Posts will have a title and content.

```bash
rails generate scaffold post title:string body:text
```

This command generates a large number of files:

![](http://localhost:8484/0cd60295-e8e0-49fb-aa4b-a6a818262938.avif)

One of them is the database migration, which is written in `db/migrate/20210418121400_create_posts.rb` and looks like this:

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

To synchronize the database with the result of this migration, we enter

```bash
rails db:migrate
```

Here you may ask the question: "Which database?". In the file `config/database.yml` we can see the configuration that indicates that by default it is `sqlite`. In the file `db/schema.rb` there is the database schema.

---

This is a good place for a digression. While migrating systems based on Ruby on Rails, I wondered why the production environment uses "sqlite"; I thought someone deliberately configured it this way. It turns out that it was enough not to change the configuration in this file. Another issue that occupied my mind two years ago was the "updated_at" field in tables that didn't handle editing. Seeing "updated_at" and lacking documentation, I thought there was a process for editing these tables; however, this is also a consequence of the default "rails" configuration, which everywhere adds these columns.

---

To start the server, we use the command

```
rails server
```

A huge advantage of Rails is that we can already use a working CRUD at the link

```
http://127.0.0.1:3000/posts
```

After manually creating a post, we get:

![](http://localhost:8484/b2c81fc5-5bed-4658-8d8e-12938d74d038.avif)

What is even more pleasant is that we also have an "api" available at `/posts.json`

![](http://localhost:8484/80897738-a337-4640-a228-58517e8aff43.avif)

Unfortunately, the attempt to create a post via the API.

```
http POST localhost:3000/posts.json title="Hej" body="Ok"
```

ends with an error

```
Can't verify CSRF token authenticity.
```

To disable "CSRF" protection in the `app/controllers/application_controller.rb` file, configure the `protect_from_forgery` option.

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session
end
```

Now the post saving through the API works. Both

```
http POST localhost:3000/posts.json title=ok
```

how and

```
http POST localhost:3000/posts.json body=ok
```

will post their entries without validating their correctness.

![](http://localhost:8484/8873c9da-4396-48b3-8d70-6108e8528fd7.avif)

To enforce the presence of the `title` parameter in the post, in the file `app/models/post.rb` we add the `validates_presence_of` flag.

```
class Post < ApplicationRecord
  validates_presence_of :title
end
```

Thanks to it, it will be impossible to add posts without a title both on the page

![](http://localhost:8484/0062c4cc-438a-4837-b025-9a3bde260681.avif)

how and through API

![](http://localhost:8484/93aace27-457b-43d7-88f8-8189bda7a84a.avif)

## Debugging - Rails Console

A very useful tool when working with Ruby on Rails is the console available by entering the command:

```
rails console
```

It allows for interactive access to data using the Ruby language and objects defined in Rails. For example, we will see the first post by entering

```
Post.first
```

To get all posts we write

```
Post.all
```

Posts created from yesterday to tomorrow will be received by writing

```
Post.where(created_at: Date.yesterday..Date.tomorrow)
```

It can be easily transformed into an SQL query by adding the `to_sql` property at the end.

```
Post.where(created_at: Date.yesterday..Date.tomorrow).to_sql
```

To create a new post we write

```
Post.create! title: 'Hello', body: 'World'
```

## Relationships Between Tables

A typical example of a relationship regarding posts is comments. We do not need the same controllers and views for them as for posts, so instead of `scaffold`, we will use the `resource` flag for generation.

```
rails generate resource comment post:references body:text
```

We can see the full list of available generators by entering the command:

```
rails generate
```

or by reading the documentation

[The Rails Command Line — Ruby on Rails Guides](https://guides.rubyonrails.org/command_line.html#bin-rails-generate)

Meanwhile, we will return to the files generated by the `resource` option.

![](http://localhost:8484/6043c7ba-5a2b-46fe-866e-5b0474cc6c5e.avif)

A migration has been created here again, this time containing:

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

Let's now talk about routing. There is no point in ever asking for all comments. They are always related to the post they pertain to. So in the `config/routes.yml` file, we replace the adjacent occurrences.

```ruby
Rails.application.routes.draw do
  resources :posts
  resources :comments
end
```

to configuration that allows comments to be nested in the post

```ruby
Rails.application.routes.draw do
  resources :posts do
    resources :comments
  end
end
```

Displaying the routing is possible thanks to the command:

```
rails routes
```

![](http://localhost:8484/818913a8-7bcb-47ad-953a-10efe7d9c6b4.avif)

As for the direction of the relationship, at this moment comments belong to posts as described in the file `app/models/comment.rb`

```
class Comment < ApplicationRecord
  belongs_to :post
end
```

But posts do not have a designated relationship with comments, which we will fix by adding `has_many` to `app/models/post.rb`

```
class Post < ApplicationRecord
  has_many :comments
  validates_presence_of :title
end
```

In the console we can now create a sample comment

```
Post.second.comments.create! body: "My first comment to second post"
```

To display comments and add them, we will write helper view fragments (partials). `app/views/comments/_comment.html.erb` will be used to display a single comment.

```
<p><%= comment.body %> -- <%= comment.created_at.to_s(:long) %></p>
```

On the other hand, `app/views/comments/_new.html.erb` will be the form for creating a comment.

```
<%= form_for([ @post, Comment.new], remote: true) do |form| %>
  Your comment: <br/>
  <%= form.text_area :body, size: '50x2' %><br/>
  <%= form.submit %>
<% end %>
```

We will attach them in the single post view by adding the code to the file `app/views/posts/show.html.erb`

```
<hr>

<h2>Comments (<span id="count"><%= @post.comments.count %></span>)</h2>

<div id="comments">
   <%= render @post.comments %>
</div>

<%= render 'comments/new', post: @post %>
```

Now our post view will look as follows

![](http://localhost:8484/ecf12b37-935a-4fdd-ba56-9ab97f52a860.avif)

Although it looks ready to go, the comment addition feature is still unavailable. We only prepared the view, but the logic to handle saving comments to the database and linking them to posts is missing.

To integrate it, we need to handle comment creation in the controller `app/controllers/comments_controller.rb`

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

Let's take a close look at it. It starts with the `before_action` option, which sets the post based on the parameter from the `url`. Then in `create`, we use this post to create a comment, its parameters come from `comments_params`, which retrieves them from the request body.

Next, there is a redirection to the posts page. It works very well on the page.

![](http://localhost:8484/77228d3e-7d38-4c1b-981a-05c9d74ab699.avif)

But if we want to create posts from the API level, every time we are redirected to the post, we will see it without comments. If we replace

```
redirect_to @post
```

in the controller using instructions analogous to that for the post

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

![](http://localhost:8484/4d751696-3dfd-4684-b847-f0b28de86bbe.avif)

It is so because now comments require structuring when arranging them in a JSON file. This is resolved thanks to the fantastic library `jbuilder`.

[rails/jbuilder](https://github.com/rails/jbuilder)

By creating the file `app/views/comments/show.json.jbuilder` with the content

```
json.partial! "posts/post", post: @post
json.comments @post.comments, :id, :body, :created_at
```

we will configure the server to respond with the post view containing a list of all comments corresponding to it after a comment is created. This is a view that corresponds to what we see in the HTML version, although it does not conform to REST principles.

![](http://localhost:8484/61a3d18f-8260-437b-9b0f-50dbe420e406.avif)

If we wanted to display this specific comment, we can use the syntax

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

in the controller. Then in the response view we will see the comment along with the post.

![](http://localhost:8484/a43ef393-0a06-4fa2-94fc-2da3fd73f5e2.avif)

More about formatting can be read here:

[Rendering JSON in a Rails API](https://dev.to/caicindy87/rendering-json-in-a-rails-api-25fd)

## Sending emails

A very common function in web services is sending emails in response to certain events. Instead of rewriting the code, we will use a generator:

```
rails generate mailer comments submitted
```

This is an emailer sending a greeting. The first thing we will do is configure the data that it will inject into the templates. In the `comments_mailer.rb` file, we write the code:

```
class CommentsMailer < ApplicationMailer
  def submitted(comment)
    @comment = comment

    mail to: "gustaw.daniel@gmail.com", subject: 'New comment'
  end
end
```

In `app/views/comments_mailer` we have two template files. For the HTML view, it is the `submitted.html.erb` file. We will modify it so that using the previously defined partial, it shows the new comment:

```
<h1>New comment on post: <%= @comment.post.title %></h1>

<%= render @comment %>
```

In the `submitted.text.erb` file, we can no longer use `render`, so we will simplify the text view to the form:

```
New comment on post: <%= @comment.post.title %>: <%= @comment.body %>
```

What's amazing about Rails is that we have a ready-made view to preview these emails without having to send them. To use it, we just need to specify the comment we will display. For this purpose, in the file `test/mailers/previews/comments_mailer_preview.rb` the line

```
CommentsMailer.submitted
```

we change to

```
CommentsMailer.submitted Comment.first
```

At the address

```
http://localhost:3000/rails/mailers/comments\_mailer/submitted
```

We can see a preview of this email

![](http://localhost:8484/dd89e83f-d2c2-4833-a43b-b5a0ea528d96.avif)

However, we cannot expect this email to be sent immediately. To include its sending, we need to add a line.

```
CommentsMailer.submitted(comment).deliver_later
```

in the comments controller. The entire controller should now look like this:

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

The "deliver_later" flag allows you to attach an email sending to the internal Ruby on Rails loop, which will send it as soon as possible without blocking the execution of the rest of the code. Creating a comment still won't send the email to the actual mail, but in the console, we will see that such an action would have been taken if the sending were fully configured.

![](http://localhost:8484/0f6a89a7-7d40-4b93-a98e-eca529b2fbec.avif)

We will not go that way, but if you want to complete the configuration, read about `smtp_settings` and `delivery_method` in the documentation:

[Action Mailer Basics — Ruby on Rails Guides](https://guides.rubyonrails.org/action_mailer_basics.html)

Now we will move on to real-time communication.

## Cable - communication via web socket

To use real-time communication, we need a channel. We will generate it with the command:

```
rails generate channel comments
```

![](http://localhost:8484/8781f3f8-0891-49b7-83ab-be6216f97342.avif)

In the file `app/channels/comments_channel.rb` containing:

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

adding the `broadcast` method

```
  def self.broadcast(comment)
    broadcast_to comment.post, comment:
      CommentsController.render(partial: 'comments/comment', locals: { comment: comment })
  end
```

we will also make a simplification that the subscription will only apply to the latest post. Our goal is to show the basics of Rails, so we will focus on bringing the channel mechanism to presentation, skipping this aspect. As part of this simplification, we write

```
  def subscribed
    stream_for Post.last
  end
```

To enable message sending to the browser, we add the line

```
CommentsChannel.broadcast(comment)
```

with the emailer included in the comments controller.

A file with the channel configuration `app/javascript/channels/comments_channel.js` will be attached to the browser. We set it up so that in response to a comment being attached to the publication (channel), it should be added to the end of the thread, and the comment counter should increase by 1:

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

The effect is as follows:

For further study, I recommend the following materials:

[Ruby on Rails Tutorial - Tutorialspoint](https://www.tutorialspoint.com/ruby-on-rails/index.htm)

[Ruby on Rails](https://rubyonrails.org/)
