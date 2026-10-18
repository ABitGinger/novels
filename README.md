# 无职者

> 一部长篇小说。三卷，三十四章，另有楔子。

在线阅读：**https://abitinger.github.io/wuzhizhe/**

一个被培育出来、却没有被赋予任何用途的生物，在一座由**功能生物**构成的、正在慢慢饿死的活体世界里，寻找「我是什么」。

## 站点

- 引擎：[mdBook](https://github.com/rust-lang/mdBook)（MPL-2.0），纯静态输出，无后端。
- 主题：`theme/book.css`（纸感阅读配色、宋体正文、档案体文献排版）+ `theme/reading.js`（阅读进度条、章节分隔符、记住上次读到哪儿）。
- 构建：推送 `main` 后由 GitHub Actions 自动构建并发布到 GitHub Pages。

## 目录

```
.
├─ book.toml              mdBook 配置
├─ src/
│  ├─ README.md           首页（封面与简介）
│  ├─ SUMMARY.md          目录
│  ├─ 00_楔子.md
│  ├─ 卷一_误/01_育.md … 12_过.md
│  ├─ 卷二_器/01_膛.md … 12_记.md
│  └─ 卷三_无/01_返.md … 10_余.md
├─ theme/
│  ├─ book.css
│  └─ reading.js
├─ tools/
│  ├─ build_src.py        从正文目录生成 src/
│  └─ home.md             首页模板
└─ .github/workflows/deploy.yml
```

## 更新章节

`src/` 由 `tools/build_src.py` 从写作目录生成，不手改。生成时会做三件事：

1. 补章节标题（章节文件本身以铭牌开篇，无标题行）；
2. 把硬折行的段落接回一行（Markdown 软换行在中文里会多出空格）；
3. 给铭牌各行补硬换行，保留档案排版。

```bash
# 生成 src/（默认读取 D:/AI/lab/5 novel/无职者/正文，可在脚本顶部改 NOVEL）
python tools/build_src.py

# 本地预览
mdbook serve --open

# 构建
mdbook build
```

mdBook 把 `html` 字号设为 62.5%（1rem = 10px），`theme/book.css` 统一用 px 标定，改样式时留意这一点。

## 版权

正文为原创作品，全部权利归作者所有。站点仅用于在线阅读。
