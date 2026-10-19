/* 《无职者》阅读增强
   · 主题 / 字号（可跟随系统）
   · 返回书房
   · 页内换页：站内章节只换正文、不重载整页（预取 + 路由缓存）
   · 阅读进度条、分隔符、记住读到哪儿
   注：主题的"防闪"引导脚本在 theme/head.hbs 里，先于本文件执行。
*/
(function () {
  "use strict";

  var LS_THEME = "wzz:theme"; // auto | light | dark
  var LS_SIZE = "wzz:size"; // "0.92" | "1" | "1.14" | "1.3"
  var LS_THEME_MD = "mdbook-theme";
  var LS_LAST = "wzz:last";
  var LS_RESUME = "wzz:resume";
  var SIZES = ["0.92", "1", "1.14", "1.3"];

  function get(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }
  function store(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }
  function load(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function meta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.getAttribute("content") || "" : "";
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function closestLink(node) {
    while (node && node !== document) {
      if (node.tagName === "A") return node;
      node = node.parentNode;
    }
    return null;
  }

  /* ── 书房首页地址：从路径里切掉 "/<slug>/" 之后的部分 ─────────────── */
  function shelfUrl() {
    var slug = meta("wzz:slug");
    var p = location.pathname;
    if (slug) {
      var i = p.indexOf("/" + slug + "/");
      if (i >= 0) return p.slice(0, i + 1);
    }
    return "../";
  }

  /* ── 书根路径：判断"是否还在本书内"，页内路由要用 ─────────────────── */
  function bookBase() {
    var slug = meta("wzz:slug");
    var p = location.pathname;
    if (!slug) return null;
    var i = p.indexOf("/" + slug + "/");
    return i >= 0 ? p.slice(0, i + slug.length + 2) : null;
  }

  /* ── 主题 ─────────────────────────────────────────────────────────── */
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function themePref() {
    var v = get(LS_THEME);
    return v === "light" || v === "dark" ? v : "auto";
  }

  function applyTheme(pref, remember) {
    var dark =
      pref === "dark" || (pref === "auto" && mq && mq.matches);
    document.documentElement.className = dark ? "coal" : "light";
    set(LS_THEME_MD, document.documentElement.className);
    if (remember !== false) set(LS_THEME, pref);
    syncUI();
  }

  function onSystemThemeChange() {
    if (themePref() === "auto") applyTheme("auto", false);
  }

  /* ── 字号 ─────────────────────────────────────────────────────────── */
  function applySize(v) {
    document.documentElement.style.setProperty("--reading-scale", v);
    set(LS_SIZE, v);
    syncUI();
  }

  function currentSize() {
    var v = get(LS_SIZE);
    return SIZES.indexOf(v) >= 0 ? v : "1";
  }

  /* ── 侧栏：目录顶部的「返回书房」──────────────────────────────────── */
  function buildShelfEntry() {
    var box = document.querySelector("#sidebar .sidebar-scrollbox");
    if (!box) return;
    var a = document.createElement("a");
    a.className = "wzz-side-shelf";
    a.href = shelfUrl();
    a.innerHTML = '<span class="wzz-side-arrow">←</span>返回书房';
    box.insertBefore(a, box.firstChild);
  }

  /* ── 顶栏：Aa 设置面板 ────────────────────────────────────────────── */
  function buildUI() {
    var host = document.querySelector("#menu-bar .left-buttons");
    if (!host) return;

    var btn = document.createElement("button");
    btn.id = "wzz-btn";
    btn.type = "button";
    btn.className = "icon-button wzz-btn";
    btn.title = "主题与字号";
    btn.setAttribute("aria-label", "主题与字号");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<span class="wzz-aa">Aa</span>';
    var search = host.querySelector("#search-toggle");
    if (search) host.insertBefore(btn, search);
    else host.appendChild(btn);

    var panel = document.createElement("div");
    panel.id = "wzz-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "主题与字号");
    panel.innerHTML =
      '<div class="wzz-row"><span class="wzz-lab">主题</span>' +
      '<div class="wzz-seg" data-group="theme">' +
      '<button type="button" data-val="auto">跟随系统</button>' +
      '<button type="button" data-val="light">浅色</button>' +
      '<button type="button" data-val="dark">深色</button>' +
      "</div></div>" +
      '<div class="wzz-row"><span class="wzz-lab">字号</span>' +
      '<div class="wzz-seg" data-group="size">' +
      '<button type="button" data-val="0.92">小</button>' +
      '<button type="button" data-val="1">标准</button>' +
      '<button type="button" data-val="1.14">大</button>' +
      '<button type="button" data-val="1.3">特大</button>' +
      "</div></div>";
    document.body.appendChild(panel);

    function open() {
      panel.classList.add("on");
      var pw = panel.offsetWidth || 280;
      var r = btn.getBoundingClientRect();
      var left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - pw - 8));
      panel.style.left = Math.round(left) + "px";
      panel.style.top = Math.round(r.bottom + 8) + "px";
      btn.setAttribute("aria-expanded", "true");
      syncUI();
    }
    function close() {
      panel.classList.remove("on");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (panel.classList.contains("on")) close();
      else open();
    });

    panel.addEventListener("click", function (e) {
      e.stopPropagation();
      var t = e.target;
      if (t.tagName !== "BUTTON") return;
      var group = t.parentNode.getAttribute("data-group");
      var val = t.getAttribute("data-val");
      if (group === "theme") applyTheme(val);
      else applySize(val);
    });

    document.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    window.addEventListener("resize", function () {
      if (panel.classList.contains("on")) close();
    });
  }

  function syncUI() {
    var panel = document.getElementById("wzz-panel");
    if (!panel) return;
    var pref = themePref();
    var size = currentSize();
    var groups = panel.querySelectorAll(".wzz-seg");
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var isTheme = g.getAttribute("data-group") === "theme";
      var btns = g.querySelectorAll("button");
      for (var j = 0; j < btns.length; j++) {
        var v = btns[j].getAttribute("data-val");
        var on = isTheme ? v === pref : v === size;
        btns[j].className = on ? "on" : "";
        btns[j].setAttribute("aria-pressed", on ? "true" : "false");
      }
    }
  }

  /* ── 页脚 ─────────────────────────────────────────────────────────── */
  function buildFooter() {
    var main = document.querySelector(".content main");
    if (!main) return;
    // 读到最后不该再被任何东西拦住：章节页底部只有翻页（mdBook 自带），不注入页脚。
    // 版权与 AI 声明只放在扉页——那是书的门面，不是阅读过程。
    var isFront = /\/$|\/index\.html$/.test(location.pathname);
    if (!isFront) return;

    var foot = document.createElement("footer");
    foot.className = "wzz-foot wzz-foot-front";

    var html =
      '<a class="wzz-foot-back" href="' + esc(shelfUrl()) + '" data-wzz-instant>' +
      '<span class="wzz-foot-arrow">←</span>' +
      '<span class="wzz-foot-t">返回书房</span></a>';

    // 正文里已写过声明（扉页「创作方式」）就不再在页脚重复
    var ai = main.querySelector(".ai-note") ? "" : meta("wzz:ai");
    var cr = meta("wzz:copyright");
    if (ai) html += '<p class="wzz-foot-ai">' + esc(ai) + "</p>";
    if (cr) html += '<p class="wzz-foot-cr">' + esc(cr) + "</p>";

    foot.innerHTML = html;
    main.appendChild(foot);
  }

  /* ── 正文装饰 ─────────────────────────────────────────────────────── */
  function decorate(content) {
    var ps = content.querySelectorAll("p");
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      var inQuote = p.parentNode && p.parentNode.tagName === "BLOCKQUOTE";
      var t = (p.textContent || "").trim();
      if (/^[—–-]{1,2}\s*[×xX]\s*[—–-]{1,2}$/.test(t)) {
        p.classList.add("sep");
      } else if (!inQuote && /^——\s*\S/.test(t) && t.length <= 18) {
        p.classList.add("center-line");
      }
    }
  }

  /* ── 阅读进度条 ───────────────────────────────────────────────────── */
  var progressUpdate = null; // 换页后由 router 调用，重算一次

  function progress() {
    var bar = document.createElement("div");
    bar.id = "read-progress";
    document.body.appendChild(bar);
    var scheduled = false;
    function update() {
      scheduled = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var r = h > 120 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      bar.style.width = (r * 100).toFixed(2) + "%";
    }
    progressUpdate = update;
    window.addEventListener(
      "scroll",
      function () {
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* ── 页内路由：翻页只换正文，不重载整页 ──────────────────────────────
     每一章共用同一套外壳（侧栏、顶栏、脚本），整页 reload 等于把几十 KB
     的 HTML 重新解析一遍，慢网下还得白屏等一次。这里改成：取回目标页 →
     只替换 #content（正文 + 上下页导航）→ pushState 改地址。
     外壳、字号、主题、阅读进度原地不动，翻页只剩一次内容替换。
  */
  var pageCache = {};
  var pageOrder = [];
  var CACHE_MAX = 18;
  var barTimer = null;
  var navSeq = 0;
  var prefetchNext = null; // 换页后重新预热"新的下一章"

  function sameBook(u) {
    var base = bookBase();
    return !!base && u.origin === location.origin && u.pathname.indexOf(base) === 0;
  }

  function cached(u) {
    return Object.prototype.hasOwnProperty.call(pageCache, u.pathname) ? pageCache[u.pathname] : null;
  }

  function cacheSet(u, html) {
    var k = u.pathname;
    if (!pageCache[k]) pageOrder.push(k);
    pageCache[k] = html;
    while (pageOrder.length > CACHE_MAX) delete pageCache[pageOrder.shift()];
  }

  function fetchPage(u) {
    var hit = cached(u);
    if (hit) return Promise.resolve(hit);
    return fetch(u.href, { credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (t) {
        cacheSet(u, t);
        return t;
      });
  }

  function warm(u) {
    if (!u || cached(u)) return;
    fetchPage(u).catch(function () {});
  }

  /* 相对地址转绝对：换页后 location 变了，目录里的 ../ 就会指错 */
  function absolutize(root, baseUrl) {
    var names = ["href", "src"];
    for (var n = 0; n < names.length; n++) {
      var els = root.querySelectorAll("[" + names[n] + "]");
      for (var i = 0; i < els.length; i++) {
        var raw = els[i].getAttribute(names[n]);
        if (!raw || raw.charAt(0) === "#") continue;
        if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue;
        try {
          els[i].setAttribute(names[n], new URL(raw, baseUrl).href);
        } catch (e) {}
      }
    }
  }

  function syncToc(u) {
    var box = document.querySelector("#sidebar .chapter");
    if (!box) return;
    var links = box.querySelectorAll("a");
    var hit = null;
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var on = false;
      try {
        on = new URL(link.getAttribute("href"), location.href).pathname === u.pathname;
      } catch (e) {}
      if (on) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
        hit = link;
      } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    }
    if (!hit) return;
    // 目录跟着滚一下，但别把正文带走（.sidebar-scrollbox 才是真正的滚动容器）
    var sc = document.querySelector("#sidebar .sidebar-scrollbox");
    if (!sc) return;
    if (sc.scrollHeight <= sc.clientHeight + 4) return;
    var ar = hit.getBoundingClientRect();
    var sr = sc.getBoundingClientRect();
    if (ar.top < sr.top + 48) sc.scrollTop -= sr.top + 48 - ar.top;
    else if (ar.bottom > sr.bottom - 48) sc.scrollTop += ar.bottom - sr.bottom + 48;
  }

  function swap(html, u) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var next = doc.getElementById("content");
    var cur = document.getElementById("content");
    if (!next || !cur) return false;

    // 整个 body 一起绝对化：桌面两侧的 .nav-wide-wrapper 在 #content 之外
    absolutize(doc.body, u.href);
    cur.innerHTML = next.innerHTML;

    // 宽屏两侧那对悬浮箭头是 #content 的兄弟节点，得单独换
    var nw = doc.querySelector(".nav-wide-wrapper");
    var cw = document.querySelector(".nav-wide-wrapper");
    if (nw && cw) cw.innerHTML = nw.innerHTML;

    if (doc.title) document.title = doc.title;

    var main = cur.querySelector("main");
    if (main) {
      decorate(main);
      cur.classList.remove("wzz-swap");
      void cur.offsetWidth; // 强制回流，动画才会重新播
      cur.classList.add("wzz-swap");
    }

    syncToc(u);
    buildFooter(); // 只有扉页会真的插入
    homeResume(); // 扉页的「继续阅读」
    if (prefetchNext) prefetchNext();
    if (progressUpdate) progressUpdate();
    return true;
  }

  function merge(o, k, v) {
    var r = {};
    var key;
    for (key in o) if (Object.prototype.hasOwnProperty.call(o, key)) r[key] = o[key];
    r[k] = v;
    return r;
  }

  function barShow(pct) {
    var b = document.getElementById("loadbar");
    if (!b) return;
    b.classList.add("on");
    b.style.width = pct + "%";
  }

  function barDone() {
    var b = document.getElementById("loadbar");
    if (!b) return;
    b.style.width = "100%";
    b.classList.remove("on");
    setTimeout(function () {
      if (!b.classList.contains("on")) b.style.width = "0";
    }, 340);
  }

  /* 扉页「继续阅读」点的是站内链接，也走页内路由，这里补上落点 */
  function resumeHere(u) {
    var want = null;
    try {
      want = sessionStorage.getItem(LS_RESUME);
    } catch (e) {}
    if (!want || want !== u.pathname) return false;
    try {
      sessionStorage.removeItem(LS_RESUME);
    } catch (e) {}
    var last = load(LS_LAST);
    if (!last || last.path !== u.pathname || !(last.ratio > 0)) return false;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h < 200) return false;
    window.scrollTo(0, last.ratio * h);
    return true;
  }

  function go(u, opts) {
    opts = opts || {};
    var my = ++navSeq;
    var y0 = window.scrollY;
    if (!cached(u)) {
      barTimer = setTimeout(function () {
        barTimer = null;
        barShow(14);
      }, 150);
    }
    return fetchPage(u)
      .then(function (html) {
        if (my !== navSeq) return; // 连点时只认最后一次，别让旧结果盖回来
        if (barTimer) {
          clearTimeout(barTimer);
          barTimer = null;
        }
        if (!opts.fromPop) {
          if (saveProgress) saveProgress(); // 先把旧页读到哪儿记下来
          try {
            history.replaceState(merge(history.state || {}, "wzzY", y0), "");
          } catch (e) {}
          history.pushState({ wzz: 1, wzzY: 0 }, "", u.href);
        }
        if (!swap(html, u)) throw new Error("swap failed");
        if (!opts.fromPop && resumeHere(u)) {
          barDone();
          return;
        }
        window.scrollTo(0, opts.fromPop ? opts.y || 0 : 0);
        if (u.hash) {
          var el = document.getElementById(decodeURIComponent(u.hash.slice(1)));
          if (el) el.scrollIntoView();
        }
        barDone();
        if (progressUpdate) progressUpdate();
      })
      .catch(function () {
        if (my !== navSeq) return;
        if (barTimer) {
          clearTimeout(barTimer);
          barTimer = null;
        }
        barDone();
        // 出错就退回整页跳转：宁可慢一次，也不能把读者卡在原地
        location.href = u.href;
      });
  }

  function spaTarget(a, e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
    if (!a) return null;
    var raw = a.getAttribute("href");
    if (!raw || raw.charAt(0) === "#" || /^javascript:/i.test(raw)) return null;
    if (a.target && a.target !== "_self") return null;
    var u;
    try {
      u = new URL(a.href);
    } catch (err) {
      return null;
    }
    if (!sameBook(u)) return null;
    if (u.pathname === location.pathname && u.search === location.search) return null;
    return u;
  }

  function router() {
    // 位置自己管：浏览器默认的滚动恢复会在 popstate 后覆盖我们的落点
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    try {
      history.replaceState(merge(history.state || {}, "wzzY", window.scrollY), "");
    } catch (e) {}

    // 目录里的 href 是相对"当前页"写的，而页内换页只换正文、不换侧栏：
    // 必须一次性钉成绝对地址，否则跨层级翻几页后每条目录链接都会算错基准。
    var toc = document.querySelector("#sidebar .chapter");
    if (toc) absolutize(toc, location.href);

    document.addEventListener(
      "click",
      function (e) {
        var u = spaTarget(closestLink(e.target), e);
        if (!u) return;
        e.preventDefault();
        go(u);
      },
      true
    );

    // mdBook 的左右方向键是整页跳，这里接管成页内换页
    document.addEventListener(
      "keydown",
      function (e) {
        if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        var t = e.target;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
        var rtl = document.documentElement.dir === "rtl";
        var next = (e.key === "ArrowRight") !== rtl;
        var a = document.querySelector(
          next ? ".nav-chapters.next, .mobile-nav-chapters.next" : ".nav-chapters.previous, .mobile-nav-chapters.previous"
        );
        if (!a) return;
        var u;
        try {
          u = new URL(a.href);
        } catch (err) {
          return;
        }
        if (!sameBook(u)) return;
        e.preventDefault();
        e.stopPropagation();
        go(u);
      },
      true
    );

    window.addEventListener("popstate", function (e) {
      var u;
      try {
        u = new URL(location.href);
      } catch (err) {
        return;
      }
      if (!sameBook(u)) {
        location.reload();
        return;
      }
      var st = e.state || {};
      go(u, { fromPop: true, y: st.wzzY || 0 });
    });
  }

  /* ── 跳转反馈：进度条 + 载入提示 + 慢网提示 ───────────────────────── */
  function navFeedback() {
    var bar = document.createElement("div");
    bar.id = "loadbar";
    var pill = document.createElement("div");
    pill.id = "loadpill";
    pill.innerHTML = '<i class="wzz-spin"></i><span class="wzz-pill-t">载入中…</span>';
    document.body.appendChild(bar);
    document.body.appendChild(pill);

    var on = false;
    var slowTimer = null;
    var stepTimer = null;

    function start(a) {
      if (on) return;
      on = true;
      bar.classList.add("on");
      pill.classList.add("on");
      document.documentElement.classList.add("wzz-busy");
      bar.style.width = "10%";
      stepTimer = setTimeout(function () {
        if (on) bar.style.width = "62%";
      }, 240);
      slowTimer = setTimeout(function () {
        if (!on) return;
        bar.style.width = "86%";
        pill.querySelector(".wzz-pill-t").textContent = "网络较慢，仍在载入…";
      }, 2800);
      if (a) a.classList.add("wzz-nav");
    }

    function stop() {
      if (!on) return;
      on = false;
      clearTimeout(slowTimer);
      clearTimeout(stepTimer);
      bar.style.width = "100%";
      bar.classList.remove("on");
      pill.classList.remove("on");
      document.documentElement.classList.remove("wzz-busy");
      setTimeout(function () {
        if (!on) bar.style.width = "0";
      }, 340);
    }

    document.addEventListener(
      "click",
      function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = closestLink(e.target);
        if (!a) return;
        var href = a.getAttribute("href");
        if (!href || href.charAt(0) === "#" || href.indexOf("javascript:") === 0) return;
        if (a.target && a.target !== "_self") return;
        if (a.host !== location.host) return;
        if (a.href === location.href) return;
        // 页脚那个出口离顶栏很远，顶部闪一下反而像是“点空了、没反应”。
        // 这里在点到的位置上就地反馈，不抢顶栏。
        if (a.hasAttribute("data-wzz-instant")) {
          if (a.classList.contains("wzz-pending")) return;
          a.classList.add("wzz-pending");
          var t = a.querySelector(".wzz-foot-t");
          if (t) t.textContent = "正在返回书房…";
          return;
        }
        start(a);
      },
      true
    );
    window.addEventListener("pageshow", stop);
    // 浏览器「后退」回到本页时，就地反馈要复原，否则会停在「正在返回书房…」
    window.addEventListener("pageshow", function () {
      var p = document.querySelector(".wzz-foot-back.wzz-pending");
      if (!p) return;
      p.classList.remove("wzz-pending");
      var t = p.querySelector(".wzz-foot-t");
      if (t) t.textContent = "返回书房";
    });
    window.addEventListener("beforeunload", function () {
      /* 交给下一页自然接管，避免闪一下 */
      if (on) bar.style.width = "92%";
    });
  }

  /* ── 预取：悬停预热 + 空闲预取下一章 ─────────────────────────────── */
  function prefetch() {
    var conn = navigator.connection || {};
    if (conn.saveData) return;
    if (/^(slow-2g|2g)$/.test(conn.effectiveType || "")) return;

    var seen = {};
    function pf(url) {
      if (!url || seen[url]) return;
      seen[url] = 1;
      var u;
      try {
        u = new URL(url);
      } catch (e) {
        return;
      }
      if (!sameBook(u)) return;
      warm(u); // 取回 HTML 存进路由缓存，点下去就是瞬开
    }
    function onHover(e) {
      var a = closestLink(e.target);
      if (!a || a.host !== location.host) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;
      pf(a.href);
    }
    document.addEventListener("mouseover", onHover, { passive: true });
    document.addEventListener("touchstart", onHover, { passive: true });

    var next = document.querySelector(".nav-chapters.next, .mobile-nav-chapters.next");
    // 页内换页后 DOM 全换了，下一章也跟着变，所以每次换页都要重新排一次
    prefetchNext = function () {
      var n = document.querySelector(".nav-chapters.next, .mobile-nav-chapters.next");
      if (!n || !n.href) return;
      setTimeout(function () {
        pf(n.href);
      }, 1500);
    };
    if (next && next.href) prefetchNext();
  }

  /* ── 记住读到哪儿 ─────────────────────────────────────────────────── */
  var rememberBound = false;
  var saveProgress = null; // 换页前保存旧页进度

  function remember() {
    // 路径每次都现读：页内换页后 location 已经变了，不能缓存 boot 时的值
    function save() {
      var path = location.pathname;
      if (/\/$|\/index\.html$/.test(path)) return; // 扉页不记
      var hh = document.documentElement.scrollHeight - window.innerHeight;
      if (hh < 400) return;
      store(LS_LAST, {
        path: path,
        title: document.title.replace(/\s*-\s*无职者\s*$/, ""),
        ratio: Math.min(1, Math.max(0, window.scrollY / hh)),
        at: Date.now()
      });
    }
    saveProgress = save;
    if (rememberBound) return;
    rememberBound = true;

    var timer = null;
    window.addEventListener(
      "scroll",
      function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(save, 400);
      },
      { passive: true }
    );
    window.addEventListener("pagehide", save);

    // 整页载入（从书架点进来 / 刷新）时回到上次位置；页内换页走 resumeHere()
    var path = location.pathname;
    var want = null;
    try {
      want = sessionStorage.getItem(LS_RESUME);
    } catch (e) {}
    if (!want || want !== path) return;
    try {
      sessionStorage.removeItem(LS_RESUME);
    } catch (e) {}
    var last = load(LS_LAST);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (last && last.path === path && last.ratio > 0 && h > 200) {
      setTimeout(function () {
        window.scrollTo(0, last.ratio * h);
      }, 220);
    }
  }

  /* ── 扉页「继续阅读」──────────────────────────────────────────────── */
  function homeResume() {
    var btn = document.getElementById("read-btn");
    if (!btn) return;
    var last = load(LS_LAST);
    if (!last || !last.path || !last.title) return;
    btn.textContent = "继续阅读 · " + last.title;
    btn.setAttribute("href", last.path);
    // 页内换页回到扉页时这里会再跑一次，监听只绑一遍
    if (btn.getAttribute("data-wzz-bound")) return;
    btn.setAttribute("data-wzz-bound", "1");
    btn.addEventListener("click", function () {
      // 现读 href：这个监听只绑一次，而目标章节会随阅读进度变
      try {
        sessionStorage.setItem(LS_RESUME, new URL(btn.href).pathname);
      } catch (e) {}
    });
  }

  function boot() {
    // 主题：跟随系统时，系统切换要即时生效
    if (mq) {
      if (mq.addEventListener) mq.addEventListener("change", onSystemThemeChange);
      else if (mq.addListener) mq.addListener(onSystemThemeChange);
    }
    applyTheme(themePref(), false);

    buildUI();
    buildShelfEntry();
    buildFooter();
    router(); // 先于 navFeedback：页内换页要抢在"整页载入"反馈之前接管点击
    navFeedback();
    prefetch();

    var content = document.querySelector(".content main");
    if (content) decorate(content);
    remember();
    homeResume();
    progress();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
