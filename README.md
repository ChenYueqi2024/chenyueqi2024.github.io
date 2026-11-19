# Yueqi Chen · Personal Website

Yueqi 的个人网站，以原生 HTML、CSS 和少量 JavaScript 构建，部署于 GitHub Pages。

- [选择版本](https://chenyueqi2024.github.io/)
- [成长手记 / 严肃版](https://chenyueqi2024.github.io/academic/)
- [个人小天地 / 活泼版](https://chenyueqi2024.github.io/life/)

## 文件结构

- `index.html`：双版本入口。
- `academic/index.html`：学术兴趣、开源实践、成长经历与荣誉。
- `life/index.html`：故事、项目演示、荣誉筛选与联系入口。
- `styles.css`：响应式样式、打印样式与减少动画支持。
- `script.js`：移动导航、项目对比、荣誉筛选、随机故事。
- `assets/`：原创卡通头像与公开项目截图。

无构建步骤，无外部字体、统计追踪或运行时第三方依赖。禁用 JavaScript 时仍可阅读内容、使用链接和导航。

## 本地预览

在仓库根目录运行 `python -m http.server 8000`，访问 `http://localhost:8000`。

## 内容维护

更新经历时同步修改两个版本。排名、志愿时长和 PR 状态保留统计口径与日期；团队竞赛明确标注团队获奖。论文状态只展示“有一篇 CVPR 2027 在投”，不发布论文内容。

证书原件、成绩单、申请表、研究稿件及私人核对资料均不属于本仓库。项目截图来自本人已公开仓库；个人经历不授予第三方再利用许可。

## 小项目入口

两个版本同步展示以下小项目，源码各自维护在独立仓库：

- [视角游乐场](https://chenyueqi2024.github.io/viewpoint-playground/)：v0.3 双目几何实验，含模拟画面、挑战、可展开知识与论文引用。
- [多视角数据体检](https://chenyueqi2024.github.io/multiview-check/)：v0.2 浏览器内选择图像和清单检查，不上传材料；保留 Python 本地工具。
- [公开之前](https://chenyueqi2024.github.io/before-public/)：本地发布前隐私检查，网页提供合成报告和样例。

## 部署

GitHub Pages 使用 `main` 分支根目录，`.nojekyll` 保证原样发布静态文件。推送更新后等待 Pages 部署完成。
