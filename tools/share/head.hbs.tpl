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
