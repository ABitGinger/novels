# novels

原创长篇小说在线阅读站，GitHub Pages 托管。

**https://abitginger.top/novels/**（账号自定义域名；`github.io` 下的同路径不可用）

## 书架

| 书 | 状态 | 篇幅 | 地址 |
|---|---|---|---|
| 《无职者》 | 完结 | 三卷 34 章 + 楔子，约 22.2 万字 | [/novels/wuzhizhe/](https://abitginger.top/novels/wuzhizhe/) |

## 结构

```
.
├─ site/index.html        书架首页（静态，加书时加一条 <a class="book">）
├─ books/
│  └─ wuzhizhe/          每本书一个 mdBook 项目
│     ├─ book.toml
│     ├─ src/
│     └─ theme/
├─ tools/
│  ├─ build_src.py       从正文目录生成 src/
│  └─ home.md            该书首页模板
└─ .github/workflows/deploy.yml
```

构建产物：`_site/<书名>/`，由 Actions 生成，不入库。

## 部署前提

本仓库的 Pages 已开通，`build_type` 为 `workflow`（Settings → Pages → Source：**GitHub Actions**）。

复制到新仓库时要先手动开一次 Pages：工作流自带的临时令牌**无权创建** Pages 站点，未开通时构建会失败。可用有 `repo` 权限的令牌调一次：

```bash
curl -X POST https://api.github.com/repos/<owner>/<repo>/pages \
  -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
  -d '{"build_type":"workflow"}'
```

开通后再推送或重跑工作流即可。

## 技术

- [mdBook](https://github.com/rust-lang/mdBook)（MPL-2.0）——纯静态输出、自带目录/搜索/键盘翻页，无后端、无 npm 依赖。
- 自定义主题 `books/*/theme/book.css`：纸感配色、宋体正文、档案体文献排版、阅读进度条、记住上次读到哪儿。

## 加一本书

1. `books/<slug>/` 放 `book.toml`、`src/`、`theme/`（可从 `books/wuzhizhe` 复制后改）；
2. `book.toml` 里把 `site-url` 改为 `/novels/<slug>/`；
3. `site/index.html` 里加一条 `<a class="book" href="./<slug>/">`；
4. 推送 `main`，Actions 自动构建全部书并发布。

## 更新《无职者》正文

`books/wuzhizhe/src/` 由脚本从写作目录生成，不手改。脚本会做三件事：补章节标题、把硬折行的段落接回一行（Markdown 软换行在中文里会多出空格）、给铭牌各行补硬换行以保留档案排版。

```bash
python tools/build_src.py                     # 生成 src/
cd books/wuzhizhe && mdbook serve --open      # 本地预览
```

mdBook 把 `html` 字号设为 62.5%（1rem = 10px），主题 CSS 统一用 px 标定，改样式时留意这一点。

## 版权

正文为原创作品，全部权利归作者所有。
