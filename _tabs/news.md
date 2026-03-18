---
layout: page
title: News
icon: fas fa-newspaper
order: 2
---

{% assign posts = site.posts | where_exp: "post", "post.categories contains 'News'" %}

{% include post-list.html posts=posts %}