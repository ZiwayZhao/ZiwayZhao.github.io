---
layout: research
title: 研究笔记
description: 关于优化、学习与模型训练的推导和思考。
permalink: /blog/
nav: true
nav_order: 1
research_index: true
lang: zh-CN
---

{% assign notes = site.posts | where_exp: "post", "post.categories contains 'research-notes'" | sort: 'series_order' %}
{% for post in notes %}

<article class="note-item">
  <div class="note-meta">
    <span class="note-number">blog{{ post.series_order }}</span>
    <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%Y.%m.%d' }}</time>
    <span>{{ post.reading_minutes }} 分钟阅读</span>
  </div>
  <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
  <p>{{ post.description }}</p>
</article>
{% endfor %}
