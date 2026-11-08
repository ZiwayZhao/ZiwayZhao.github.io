# 博客阅读排版

博客列表与两篇文章使用个人站点专用的 `_layouts/research.liquid`。个人主页、其他页面和原模板示例保持原样。

## 排版

- 桌面左侧固定目录，标记当前阅读章节；小屏改为可展开目录。
- 衬线字体优先 Iowan Old Style / Baskerville，中文优先宋体，搭配窄正文栏、纸色背景和较宽行距。
- 公式使用官方 npm 包 KaTeX 0.19.1 的自托管脚本、样式及 WOFF2 字体，不再在这两篇文章加载 MathJax。
- 表格和长公式在窄屏可横向滚动；键盘可聚焦超宽内容。目录与页面遵循 reduced-motion 偏好。
- 去掉模板的固定页脚、标签堆叠、示例博客列表以及重复系列卡片。

## 文件

- 布局：`_layouts/research.liquid`
- 页面样式：`assets/research/reading.css`
- 数学排版、目录当前位置：`assets/research/reading.js`
- 公式资源：`assets/vendor/katex/`（保留 MIT 许可证）
- 文章：`_posts/2026-11-08-*.md`

独立公式的 `$$` 块前后应各留一行空行，避免被 kramdown 解析成行内公式。正文中的观点、推导与符号未改，只整理空白、换行和网页配图路径。

留言及精选评论已按站主要求移除：页面不再展示表单，也不再连接 FormSubmit、Giscus 或 Disqus。

这是个人站点的新增布局，符合 docs/ARCHITECTURE.md 中关于个人站点定制的说明，没有覆盖同名的 gem 布局。starter 的目录约束检查与个人站点定制的适用范围不同。
