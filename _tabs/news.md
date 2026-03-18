---
layout: page
title: News
icon: fas fa-newspaper
order: 2
---

{% for post in site.posts %}
  {% if post.categories contains "News" %}
  <article>
    <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
    <p>{{ post.description }}</p>
    <small>{{ post.date | date: "%Y-%m-%d" }}</small>
  </article>
  {% endif %}
{% endfor %}