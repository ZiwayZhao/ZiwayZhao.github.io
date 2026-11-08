# 博客留言与精选回复

两篇文章沿用 al-folio 的 `post` 模板、MathJax 和目录支持。正文来自这次写作的最终 Markdown，只调整网站元数据和图片地址；文章开头、结尾提供系列导航。

## 私密收件

留言通过 FormSubmit 发送到 `_data/socials.yml` 中的 `email`，当前为 `ziwei.zhao@tum.de`。未精选留言不进入 GitHub 仓库，也不会在网页中显示。提交内容会经过 FormSubmit 处理，表单中已经告知访客。

**首次启用需要你操作一次：** 打开任意文章，在文末提交一条自己的测试留言；随后在该邮箱中找到 FormSubmit 的确认邮件，点击确认链接。确认后再提交一条测试留言，检查实际收件。没有完成验证前，不能认为邮件收件已经启用。不要把确认链接、服务管理令牌或读者邮箱提交到仓库。

本站使用普通表单 POST，保留服务默认的人机验证，并设置蜜罐字段。不需要在网页中放置密码、API 密钥或 GitHub token。代码和页面检查不会代替你提交真实邮件。

每封留言包含文章标题、文章网址、昵称、可选邮箱、正文和是否同意精选公开。邮箱仅用于私下回复；未勾选公开同意的留言应仅作私下交流。

## 展示精选评论与作者回复

只有 `_data/blog_comments.yml` 中的条目会被公开。原始来信继续留在邮箱，不要把所有来信复制到公开仓库。

收到同意公开的留言后，可以把需要精选的内容和你的回复交给 Codex 更新；也可以在 GitHub 编辑该文件：

https://github.com/ZiwayZhao/ZiwayZhao.github.io/edit/main/_data/blog_comments.yml

`blog1`、`blog2` 分别对应两篇文章。例如，把 `blog1: []` 改成以下格式（这里仅为格式示例，不会自动发布示例评论）：

```yaml
blog1:
  - author: "读者昵称"
    date: "2026-11-09"
    message: |
      经读者同意公开的留言内容。
    reply: |
      你的回复。
    reply_date: "2026-11-09"
blog2: []
```

只记录已经决定公开的昵称、日期、留言和回复，不要添加邮箱或其他私密信息。页面会对留言内容做 HTML 转义，作为纯文本展示。`reply` 可留空，之后再补。保存到 main 后，现有 GitHub Actions 会重新发布网站；删除条目后会从新页面移除，但公开 Git 历史仍会保留曾提交的内容。

## 维护文章

- blog1：`_posts/2026-11-08-invariance-to-relative-updates.md`
- blog2：`_posts/2026-11-08-relative-updates-and-hypersphere.md`
- 配图与可编辑 SVG：`assets/img/blog/relative-updates/`
- 博客入口：`/blog/`

两篇没有启用 Giscus 或 Disqus，避免把未经精选的留言发布到公开讨论区。正文中的数学公式保留原稿，像模板现有数学示例一样排除自动格式重写。

表单服务说明：https://formsubmit.co/
