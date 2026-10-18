<!-- 本文件由 tools/make_share.py 从 books/<slug>/share.json 生成，请勿手改 -->
<meta property="og:type" content="{{#if (eq path "index.md")}}book{{else}}article{{/if}}">
<meta property="og:site_name" content="__SITE__">
<meta property="og:title" content="{{#if (eq path "index.md")}}《__BOOK__》· __QUOTE__{{else}}{{ title }}{{/if}}">
<meta property="og:description" content="__DESC__">
<meta property="og:image" content="__BASE_URL__/assets/__COVER__">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:alt" content="{{#if (eq path "index.md")}}《__BOOK__》· __QUOTE__{{else}}{{ title }}{{/if}}">
<meta property="og:locale" content="zh_CN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{#if (eq path "index.md")}}《__BOOK__》· __QUOTE__{{else}}{{ title }}{{/if}}">
<meta name="twitter:description" content="__DESC__">
<meta name="twitter:image" content="__BASE_URL__/assets/__COVER__">
<link rel="image_src" href="__BASE_URL__/assets/__COVER__">
<meta name="wzz:slug" content="__SLUG__">
<meta name="wzz:site" content="__SITE__">
<meta name="wzz:copyright" content="__COPYRIGHT__">
<meta name="wzz:ai" content="__AI__">
<script>
/* 主题与字号在首次绘制前落地，避免刷新时先闪一下浅色 */
(function () {
  try {
    var root = document.documentElement;
    var pref = localStorage.getItem("wzz:theme") || "auto";
    var dark = pref === "dark" ||
      (pref === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.className = dark ? "coal" : "light";
    localStorage.setItem("mdbook-theme", root.className);
    var scale = parseFloat(localStorage.getItem("wzz:size") || "1");
    if (scale && scale !== 1) {
      root.style.setProperty("--reading-scale", scale);
    }
  } catch (e) {}
})();
</script>
