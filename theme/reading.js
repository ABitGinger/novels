/* 《无职者》阅读增强：进度条 · 分隔符 · 记住读到哪儿 */
(function () {
  "use strict";

  var KEY_LAST = "wzz:last";
  var KEY_RESUME = "wzz:resume";

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

  /* ── 进度条 ───────────────────────────────────────────────────────── */
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
      store(KEY_LAST, {
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

    // 由首页「继续阅读」跳转而来时，恢复滚动位置
    var want = sessionStorage.getItem(KEY_RESUME);
    if (want && want === path) {
      sessionStorage.removeItem(KEY_RESUME);
      var last = load(KEY_LAST);
      if (last && last.path === path && last.ratio > 0) {
        var target = last.ratio * h;
        setTimeout(function () {
          window.scrollTo({ top: target, behavior: "smooth" });
        }, 220);
      }
    }
  }

  /* ── 首页「继续阅读」──────────────────────────────────────────────── */
  function homeResume() {
    var btn = document.getElementById("read-btn");
    if (!btn) return;
    var last = load(KEY_LAST);
    if (!last || !last.path || !last.title) return;
    btn.textContent = "继续阅读 · " + last.title;
    btn.setAttribute("href", last.path);
    btn.addEventListener("click", function () {
      try {
        sessionStorage.setItem(KEY_RESUME, last.path);
      } catch (e) {}
    });
  }

  function boot() {
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
