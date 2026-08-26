#!/usr/bin/env python3
"""
gen_suit_subsets.py — SUIT 가변폰트를 unicode-range 분할 서브셋으로 쪼갠다.

왜: SUIT-Variable.woff2 한 벌이 610KB 였고, 이건 랜딩 전송량의 39% 로
    **이미지 전부를 합친 것보다 컸다** (2026-08-17 실측). 글자 수를 줄이는
    것만으로는 17% 밖에 안 준다 — 덩치의 대부분이 가변축(wght 45~920) 델타라
    굵기를 8종 쓰는 이상 축은 못 버린다.
    → 대신 **브라우저가 실제 렌더하는 조각만 받게** 쪼갠다. @font-face 마다
      unicode-range 를 달아두면 그 범위의 글자가 화면에 없을 때 조각을
      아예 요청하지 않는다 (구글 폰트가 쓰는 방식).

계층 (뒤로 갈수록 희귀):
  base  라틴·숫자·문장부호·기호·자모        — 어느 페이지든 필요
  k1    랜딩이 렌더하는 한글 음절
  k2    사이트 나머지 페이지의 한글 음절
  k3    KS X 1001 상용 2350 중 남은 것
  k4    현대 완성형 11172 중 남은 것        — 동적·사용자 입력 대비 보험

실측 (2026-08-17): 랜딩 = base+k1 = 206KB (610KB 대비 -66%).
전부 받는 최악의 경우에도 666KB 로 원본 대비 +9% 뿐이고, 그런 페이지는 없다.

사용:
    python3 scripts/gen_suit_subsets.py
    → public/fonts/suit-v2/*.woff2  +  app/suit-subset.css  재생성

⚠ 계층 경계를 바꾸거나 원본 폰트를 교체하면 **파일명의 VERSION 도 올릴 것**.
  next.config.mjs 의 headers() 가 /fonts/* 를 1년 immutable 로 박아두기 때문에
  같은 이름으로 내용만 바꾸면 기존 방문자에게 영영 옛 파일이 나간다.
⚠ SUIT 는 **수동 preload 를 두지 않는다** — Next 가 globals.css 의 @font-face 를
  보고 자동 preload 를 심는다. 수동분을 더하면 캐시가 갈려 이중 다운로드가 된다.
"""

import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/fonts/SUIT-Variable.woff2"
OUT_DIR = ROOT / "public/fonts/suit-v2"
CSS_OUT = ROOT / "app/suit-subset.css"
VERSION = "v2"

HANGUL_LO, HANGUL_HI = 0xAC00, 0xD7A3


def read_sources(patterns, exclude_preview=False):
    """레포의 소스에서 텍스트를 긁는다 — 화면에 나갈 문자열이 전부 여기 있다."""
    blob = []
    for pat in patterns:
        for p in ROOT.glob(pat):
            if not p.is_file():
                continue
            if exclude_preview and "preview" in p.parts:
                continue
            try:
                blob.append(p.read_text(encoding="utf-8", errors="ignore"))
            except OSError:
                pass
    return "".join(blob)


def syllables(text):
    return {c for c in text if HANGUL_LO <= ord(c) <= HANGUL_HI}


def ks_x_1001():
    """상용 한글 2350자 — EUC-KR 0xB0A1~0xC8FE 영역."""
    out = set()
    for hi in range(0xB0, 0xC9):
        for lo in range(0xA1, 0xFF):
            try:
                ch = bytes([hi, lo]).decode("euc-kr")
            except UnicodeDecodeError:
                continue
            if HANGUL_LO <= ord(ch) <= HANGUL_HI:
                out.add(ch)
    return out


def unicode_range(chars):
    """연속 코드포인트를 U+A-B 로 접어 CSS unicode-range 문자열을 만든다."""
    cps = sorted(ord(c) for c in chars)
    parts, i = [], 0
    while i < len(cps):
        j = i
        while j + 1 < len(cps) and cps[j + 1] == cps[j] + 1:
            j += 1
        parts.append(f"U+{cps[i]:04X}" if i == j else f"U+{cps[i]:04X}-{cps[j]:04X}")
        i = j + 1
    return ",".join(parts)


def subset(chars, name):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    txt = OUT_DIR / f".{name}.txt"
    txt.write_text("".join(sorted(chars)), encoding="utf-8")
    out = OUT_DIR / f"SUIT-{VERSION}-{name}.woff2"
    r = subprocess.run(
        ["pyftsubset", str(SRC), f"--text-file={txt}", "--flavor=woff2",
         "--layout-features=*", f"--output-file={out}"],
        capture_output=True, text=True,
    )
    txt.unlink(missing_ok=True)
    if r.returncode:
        sys.exit(f"pyftsubset 실패 ({name}): {r.stderr[-400:]}")
    return out


def main():
    if not SRC.exists():
        sys.exit(f"원본이 없다: {SRC}")

    # 랜딩이 렌더하는 문자 — lazyday 루트 컴포넌트 + 공용 컴포넌트 + 전역
    landing = read_sources(
        ["app/(main)/lazyday/*.tsx", "app/(main)/lazyday/*.ts",
         "app/layout.tsx", "app/globals.css", "components/**/*.tsx"],
        exclude_preview=True,
    )
    # 사이트 전체
    site = read_sources(["app/**/*.tsx", "app/**/*.ts", "app/**/*.css",
                         "components/**/*.tsx", "lib/**/*.ts"])

    k1 = syllables(landing)
    k2 = syllables(site) - k1
    k3 = ks_x_1001() - k1 - k2
    k4 = {chr(c) for c in range(HANGUL_LO, HANGUL_HI + 1)} - k1 - k2 - k3

    base = set()
    base |= {chr(c) for c in range(0x20, 0x7F)}          # 라틴·숫자·기본 부호
    base |= set("·—–…‘’“”′″「」『』〈〉《》【】→←↑↓★☆♥♡°※№℃€£¥₩©®™±×÷≤≥≠∞")
    base |= {chr(c) for c in range(0x3131, 0x3164)}      # 호환 자모
    base |= {chr(c) for c in range(0x00A0, 0x0100)}      # 라틴-1 보충
    base |= {c for c in site if 0x4E00 <= ord(c) <= 0x9FFF}  # 사이트에 쓰인 한자

    tiers = [("base", base), ("k1", k1), ("k2", k2), ("k3", k3), ("k4", k4)]

    lines = [
        "/* ⚠ 자동 생성 — 직접 고치지 말 것. `python3 scripts/gen_suit_subsets.py` 로 재생성한다.",
        " *",
        " * SUIT 를 unicode-range 로 쪼갠 @font-face 들. 브라우저는 화면에 실제로 나오는",
        " * 글자가 속한 조각만 내려받는다 — 랜딩은 base+k1 만 받아 610KB → 206KB 가 된다.",
        " * family 이름은 'SUIT' 그대로라 기존 .module.css 는 전부 무변경.",
        " */",
        "",
    ]
    total = 0
    print(f"{'조각':<6}{'문자수':>8}{'용량':>10}")
    for name, chars in tiers:
        if not chars:
            continue
        path = subset(chars, name)
        size = path.stat().st_size
        total += size
        print(f"{name:<6}{len(chars):>8}{size // 1024:>8} KB")
        lines += [
            "@font-face {",
            "  font-family: 'SUIT';",
            f"  src: url('/fonts/suit-v2/{path.name}') format('woff2-variations');",
            "  font-weight: 100 900;",
            "  font-style: normal;",
            "  font-display: swap;",
            f"  unicode-range: {unicode_range(chars)};",
            "}",
            "",
        ]
    CSS_OUT.write_text("\n".join(lines), encoding="utf-8")
    src_size = SRC.stat().st_size
    print(f"\n원본 {src_size // 1024} KB · 5벌 총합 {total // 1024} KB")
    print(f"CSS → {CSS_OUT.relative_to(ROOT)} ({CSS_OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
