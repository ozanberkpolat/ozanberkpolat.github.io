---
layout: page
title: News
icon: fas fa-newspaper
order: 5
---

{% assign news_posts = site.posts | where_exp: "post", "post.categories contains 'News'" %}

<ul class="post-list">
{% for post in news_posts %}
  <li>
    <a href="{{ post.url }}">{{ post.title }}</a>
    <span>{{ post.date | date: "%Y-%m-%d" }}</span>
  </li>
{% endfor %}
</ul>