#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""从《无职者》正文目录生成 mdBook 站点源文件（src/）。"""
import os
import re
import shutil
from pathlib import Path

NOVEL = Path(r"D:/AI/lab/5 novel/无职者/正文")
SITE = Path(r"D:/Repositories/novels")
SRC = SITE / "books" / "wuzhizhe" / "src"

VOLUMES = [
    ("卷一_误", "卷一 · 误"),
    ("卷二_器", "卷二 · 器"),
    ("卷三_无", "卷三 · 无"),
]

CN_NUM = "零一二三四五六七八九十"


def cn_index(n: int) -> str:
    if n <= 10:
        return CN_NUM[n] if n < 10 else "十"
    if n < 20:
        return "十" + CN_NUM[n - 10]
    if n % 10 == 0:
        return CN_NUM[n // 10] + "十"
    return CN_NUM[n // 10] + "十" + CN_NUM[n % 10]


def read_text(p: Path) -> str:
    raw = p.read_bytes().decode("utf-8-sig")
    raw = raw.replace("\r\n", "\n").replace("\r", "\n")
    lines = [ln.rstrip() for ln in raw.split("\n")]
    # 折叠超过两行的连续空行
    out, blank = [], 0
    for ln in lines:
        if ln == "":
            blank += 1
            if blank > 1:
                continue
        else:
            blank = 0
        out.append(ln)
    return "\n".join(out).strip("\n") + "\n"


SEP_RE = re.compile(r"^>\s*——\s*×\s*——\s*$")

TERMINAL = "。！？」』）…；：—、"


def unwrap_fence(text: str) -> str:
    """档案体（代码块）原是按固定宽度手打的，网页里会二次折行。
    只在上一行未以句末标点收尾时接续，保留「第N日」这类真正的分行。
    """
    lines = text.split("\n")
    out, in_fence = [], False
    for ln in lines:
        if ln.strip().startswith("```"):
            in_fence = not in_fence
            out.append(ln)
            continue
        if not in_fence or ln.strip() == "":
            out.append(ln)
            continue
        prev = out[-1] if out else ""
        layout = ln[:1] in ("\u3000", " ") or prev[:1] in ("\u3000", " ")
        if (
            out
            and not layout
            and prev.strip()
            and prev[-1] not in TERMINAL
            and not prev.strip().startswith("```")
        ):
            out[-1] = prev.rstrip() + ln.strip()
        else:
            out.append(ln)
    return "\n".join(out)


def unwrap_paragraphs(text: str) -> str:
    """把硬折行的正文段落接回一行（Markdown 软换行在中文里会多出空格）。"""
    lines = text.split("\n")
    out, i, in_fence = [], 0, False
    while i < len(lines):
        ln = lines[i]
        if ln.strip().startswith("```"):
            in_fence = not in_fence
            out.append(ln)
            i += 1
            continue
        if in_fence or ln.strip() == "" or ln.lstrip().startswith((">", "#", "-", "*", "|")):
            out.append(ln)
            i += 1
            continue
        # 普通段落块：连续非空且非特殊行
        block = [ln]
        j = i + 1
        while (
            j < len(lines)
            and lines[j].strip() != ""
            and not lines[j].lstrip().startswith((">", "#", "-", "*", "|", "```"))
        ):
            block.append(lines[j])
            j += 1
        out.append(block[0] if len(block) == 1 else "".join(s.strip() for s in block))
        i = j
    return "\n".join(out)


def harden_plate(text: str) -> str:
    """铭牌各行原本各占一行，Markdown 会合并成整段；补硬换行保留档案排版。"""
    lines = text.split("\n")
    start = None
    for i, ln in enumerate(lines):
        if SEP_RE.match(ln):
            start = i
            break
    if start is None:
        return text
    for i in range(start, len(lines)):
        ln = lines[i]
        if not ln.startswith(">"):
            break
        if SEP_RE.match(ln):
            continue
        body = ln[1:].strip()
        if body and not body.endswith("  "):
            lines[i] = ln + "  "
    return "\n".join(lines)


def main():
    if SRC.exists():
        shutil.rmtree(SRC)
    SRC.mkdir(parents=True, exist_ok=True)

    summary = ["- [封面与简介](README.md)", "- [楔子 · 末问](00_楔子.md)", ""]
    total_chars = 0
    stats = []

    # ── 首页 ──
    shutil.copyfile(Path(__file__).parent / "home.md", SRC / "README.md")

    # ── 楔子 ──
    pre = unwrap_fence(unwrap_paragraphs(read_text(NOVEL / "楔子.md")))
    (SRC / "00_楔子.md").write_text(pre, encoding="utf-8", newline="\n")
    n = len(re.sub(r"\s", "", pre))
    total_chars += n
    stats.append(("楔子", "末问", n))

    for dirname, label in VOLUMES:
        srcdir = NOVEL / dirname
        outdir = SRC / dirname
        outdir.mkdir(parents=True, exist_ok=True)
        files = sorted(srcdir.glob("第*章_*.md"))
        summary += [f"# {label}", ""]
        for i, f in enumerate(files, start=1):
            m = re.match(r"第(\d+)章_(.+)\.md$", f.name)
            if not m:
                continue
            idx, title = int(m.group(1)), m.group(2)
            body = unwrap_fence(harden_plate(unwrap_paragraphs(read_text(f))))
            # 楔子外的章节正文以铭牌开篇，缺 H1：补一个纯标题（不加"第X章"字样，保持留白体例）
            if not body.startswith("# "):
                body = f"# {title}\n\n{body}"
            outname = f"{idx:02d}_{title}.md"
            (outdir / outname).write_text(body, encoding="utf-8", newline="\n")
            n = len(re.sub(r"\s", "", body))
            total_chars += n
            stats.append((label, title, n))
            summary.append(f"- [{cn_index(idx).join(['第', '章'])} · {title}]({dirname}/{outname})")
        summary.append("")

    (SRC / "SUMMARY.md").write_text("\n".join(summary), encoding="utf-8", newline="\n")

    print(f"章节数: {len(stats)}")
    print(f"总字数(去空白): {total_chars}")
    for s in stats[:3] + stats[-2:]:
        print("  ", s)


if __name__ == "__main__":
    main()
