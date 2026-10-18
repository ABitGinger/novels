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

## 阅读体验（`theme/reading.js`）

mdBook 自带的五套英文主题（Light / Rust / Coal / Navy / Ayu）已全部停用，改为顶栏一个「Aa」面板，只有两项：

| 项 | 取值 | 说明 |
|---|---|---|
| 主题 | 跟随系统 / 浅色 / 深色 | 默认「跟随系统」，系统换深浅色即时跟随；手动选择后记住，可随时切回自动 |
| 字号 | 小 / 标准 / 大 / 特大 | 0.92 / 1 / 1.14 / 1.3 倍，写入 `--reading-scale`，正文、铭牌、档案体一起缩放 |

- 主题在 `theme/head.hbs` 的引导脚本里**于首次绘制前**落地（`html.className = light|coal`），刷新不会先闪一下浅色；
  同时写回 mdBook 自己的 `mdbook-theme` 键，避免两套逻辑打架。
- 顶栏左侧有「← 书房」入口，正文末尾还有「← 返回书房」，从任何一章都能一步回书架。
  书架地址由 `<meta name="wzz:slug">` 反推（切掉路径里的 `/<slug>/`），仓库改名不用改代码。
- **跳转反馈**：点击任意站内链接立刻出现顶部进度条 + 居中「载入中…」提示；超过 2.8 秒改口为「网络较慢，仍在载入…」。
  GitHub Pages 在国内常有 1–3 秒延迟，没有反馈会让人以为按钮失效。
- **预取**：鼠标悬停目录项即预取该章，空闲 1.5 秒后自动预取「下一章」；`saveData` 或 2G 网络下自动关闭。
- 页脚由 `share.json` 的 `copyright` / `ai` 字段驱动，每页都显示；若正文里已有声明（扉页「创作方式」带 `.ai-note`），页脚不再重复。

## 分享卡片（微信 / QQ）

每页都带 `<title>`、`<meta name="description">` 与 `og:*`，分享出去显示的是这一页**自己的**标题 + 简介 + 方图封面，而不是浏览器图标：

| 分享对象 | og:title | 封面 |
|---|---|---|
| 书架页 `/novels/` | 书房 ·《无职者》全本在线阅读 | `site/assets/og-shelf.png` |
| 书的扉页 `/wuzhizhe/` | 《无职者》· 看，也是一种使用。 | `site/assets/og-wuzhizhe.png` |
| 楔子 / 任意章节 | 楔子 · 末问 - 无职者（mdBook 的 `{{ title }}`） | 同上 |

**机制**：每本书一份 `books/<slug>/share.json`（书名、署名、题记、简介、卷章字数、印章字、封面文件名），一条命令据此生成两样东西：

```bash
python tools/make_share.py wuzhizhe --render   # 生成 head.hbs + 重渲封面 PNG
python tools/make_share.py wuzhizhe            # 只改元信息，不动图片
```

- `theme/head.hbs`：mdBook 会自动把它注入每页 `<head>`。里面用 handlebars 判断 `path`——`index.md`（扉页）用书名与题记，其余页面用 `{{ title }}`（形如「第一章 · 育 - 无职者」），于是每章卡片自带章名和书名，不用逐章维护。
- `site/assets/og-<slug>.png`：1200×1200，文案集中在中央安全带内，裁成 1.91:1 或 1:1 都不切字。

书架页是手写的静态页，不走这套，改文案直接编辑 `site/index.html` 头部，再按下面这条重截封面：

```bash
msedge --headless=new --hide-scrollbars --window-size=1200,1200 \
  --screenshot=site/assets/og-shelf.png tools/og/shelf.html
```

- 站内图标也已替换 mdBook 默认图标：`theme/favicon.{svg,png}`、`site/assets/favicon.{svg,png}`。
- 微信对同一链接会缓存旧预览；改完想立刻验证，加个 `?v=2` 之类的参数再分享。

## 加一本书

1. `books/<slug>/` 放 `book.toml`、`src/`、`theme/`（可从 `books/wuzhizhe` 复制后改）；
2. `book.toml` 里把 `site-url` 改为 `/novels/<slug>/`；
3. 写一份 `books/<slug>/share.json`（书名、署名、题记、简介、卷章字数、印章字、封面文件名、版权与 AI 声明，封面叫 `og-<slug>.png`）；
4. `python tools/make_share.py <slug> --render`，生成该书的 `head.hbs` 与封面；
5. `site/index.html` 里加一条 `<a class="book" href="./<slug>/">`；
6. 推送 `main`，Actions 自动构建全部书并发布。

`share.json` 示例（字段名全小写，模板里写作 `__BOOK__` 这类大写占位符，由脚本替换）：

```json
{
  "slug": "wuzhizhe",
  "site": "书房",
  "base_url": "https://abitginger.top/novels",
  "book": "无职者",
  "author": "壹 位 姜",
  "quote": "看，也是一种使用。",
  "desc": "一个被培育出来、却没有被赋予任何用途的生物……",
  "meta": "三卷 · 三十四章 · 22.2 万字",
  "seal": "无",
  "cover": "og-wuzhizhe.png",
  "copyright": "版权所有 © 壹位姜 2024–2026　·　未经许可，请勿转载或用于商业用途",
  "ai": "本书正文由 AI 模型 DeepSeek-V4-Flash-0731-W8A8 生成，人物、世界与情节均为虚构。"
}
```

## 更新《无职者》正文

`books/wuzhizhe/src/` 由脚本从写作目录生成，不手改。脚本会做三件事：补章节标题、把硬折行的段落接回一行（Markdown 软换行在中文里会多出空格）、给铭牌各行补硬换行以保留档案排版。

```bash
python tools/build_src.py                     # 生成 src/
cd books/wuzhizhe && mdbook serve --open      # 本地预览
```

mdBook 把 `html` 字号设为 62.5%（1rem = 10px），主题 CSS 统一用 px 标定，改样式时留意这一点。

## 版权

版权所有 © 壹位姜 2024–2026。除另有说明外，未经许可请勿转载、摘编或用于商业用途。

《无职者》正文由 AI 模型 DeepSeek-V4-Flash-0731-W8A8 生成，人物、世界与情节均为虚构。
