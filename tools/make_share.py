#!/usr/bin/env python3
"""从 books/<slug>/share.json 生成该书的分享元信息与封面。

    python tools/make_share.py wuzhizhe            # 生成 head.hbs
    python tools/make_share.py wuzhizhe --render   # 同时用无头浏览器重出封面 PNG

head.hbs 交给 mdBook 注入每页 <head>，其中的 {{ title }} 是 mdBook 自己的
handlebars 变量（值为「第一章 · 育 - 无职者」），所以每章卡片自动带章名和书名。
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TPL_HEAD = ROOT / "tools" / "share" / "head.hbs.tpl"
TPL_COVER = ROOT / "tools" / "og" / "cover.html"
EDGE = os.environ.get("EDGE", r"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")


def title_size(name: str) -> int:
    n = len(name)
    return 210 if n <= 3 else 178 if n == 4 else 152 if n == 5 else 130


def fill(tpl: str, values: dict) -> str:
    for k, v in values.items():
        tpl = tpl.replace(f"__{k.upper()}__", str(v))
    missing = sorted(set(re.findall(r"__[A-Z_]+__", tpl)))
    if missing:
        sys.exit("share.json 缺少字段：" + "、".join(m.lower() for m in missing))
    return tpl


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("用法: python tools/make_share.py <slug> [--render]")
    slug = sys.argv[1]
    render = "--render" in sys.argv

    book_dir = ROOT / "books" / slug
    conf = json.loads((book_dir / "share.json").read_text(encoding="utf-8"))
    values = dict(conf)
    values["TITLE_SIZE"] = title_size(conf["book"])

    head = fill(TPL_HEAD.read_text(encoding="utf-8"), values)
    (book_dir / "theme").mkdir(exist_ok=True)
    out_head = book_dir / "theme" / "head.hbs"
    out_head.write_text(head, encoding="utf-8", newline="\n")
    print("写入", out_head.relative_to(ROOT))

    if not render:
        return
    if not Path(EDGE).exists():
        sys.exit(f"找不到浏览器：{EDGE}（可用 EDGE 环境变量指定）")

    html = fill(TPL_COVER.read_text(encoding="utf-8"), values)
    out_png = ROOT / "site" / "assets" / conf["cover"]
    out_png.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        tmp_html = Path(td) / "cover.html"
        tmp_html.write_text(html, encoding="utf-8", newline="\n")
        subprocess.run(
            [EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars",
             "--force-device-scale-factor=1", "--window-size=1200,1200",
             f"--screenshot={out_png}", tmp_html.as_uri()],
            check=False, capture_output=True,
        )
    print("写入", out_png.relative_to(ROOT), f"({out_png.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
