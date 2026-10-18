/* 《无职者》阅读增强
   · 主题 / 字号（可跟随系统）
   · 返回书房
   · 章节跳转的载入反馈与预取
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
      var l = document.createElement("link");
      l.rel = "prefetch";
      l.href = url;
      document.head.appendChild(l);
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
    if (next && next.href) {
      setTimeout(function () {
        pf(next.href);
      }, 1500);
    }
  }

  /* ── 记住读到哪儿 ─────────────────────────────────────────────────── */
  function remember() {
    var path = location.pathname;
    var isHome = /\/$|\/index\.html$/.test(path);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (isHome || h < 400) return;

    var timer = null;
    function save() {
      var hh = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = hh > 0 ? Math.min(1, Math.max(0, window.scrollY / hh)) : 0;
      store(LS_LAST, {
        path: path,
        title: document.title.replace(/\s*-\s*无职者\s*$/, ""),
        ratio: ratio,
        at: Date.now()
      });
    }
    window.addEventListener(
      "scroll",
      function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(save, 400);
      },
      { passive: true }
    );
    window.addEventListener("pagehide", save);

    var want = sessionStorage.getItem(LS_RESUME);
    if (want && want === path) {
      sessionStorage.removeItem(LS_RESUME);
      var last = load(LS_LAST);
      if (last && last.path === path && last.ratio > 0) {
        var target = last.ratio * h;
        setTimeout(function () {
          window.scrollTo({ top: target, behavior: "smooth" });
        }, 220);
      }
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
    btn.addEventListener("click", function () {
      try {
        sessionStorage.setItem(LS_RESUME, last.path);
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
    navFeedback();
    prefetch();

    var content = document.querySelector(".content main");
    if (content) {
      decorate(content);
      remember();
    }
    homeResume();
    progress();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
