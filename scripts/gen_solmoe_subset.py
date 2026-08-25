#!/usr/bin/env python3
"""
솔뫼김대건체 서브셋 생성기 — 커피앤바 페이지 전용 (2026-08-25)

왜 서브셋인가: 원본 woff2 는 굵기당 179KB(12,252 글리프)다. 이스터에그 한 페이지가
그만큼을 끌어오면 §5 의 전송량 규율과 어긋난다. 실제로 쓰는 글자만 남기면 16KB 대다.

무엇을 남기나: `app/(main)/lazyclub/meetings/dm-gd/` 의 TSX 에서 **주석을 걷어낸 뒤**
남는 모든 한글·영숫자·문장부호. 주석을 먼저 지우는 게 핵심이다 — 이 레포는 주석이
길고 한국어라, 그대로 긁으면 서브셋이 원본만큼 커진다.

placeholder·오류 문구처럼 지금은 트리 기본 서체로 그려지는 문자열도 함께 넣는다.
몇 KB 더 들지만, 나중에 어느 요소를 손글씨체로 바꿔도 글리프가 비지 않는다.

⚠ **카피를 고치면 이 스크립트를 다시 돌린다.** 안 돌리면 새 글자가 폴백 서체로 떨어져
   그 글자만 다른 서체로 보인다(조용한 실패 — 눈으로만 잡힌다).
⚠ **산출물 파일명의 버전을 올린다.** /fonts/* 는 1년 immutable 캐시라(next.config.mjs)
   같은 이름으로 덮어쓰면 재방문자가 1년간 옛 파일을 본다 (§5 계약).
   올린 뒤 coffeebar.module.css 의 @font-face src 도 같이 고칠 것.

사용:
    python3 scripts/gen_solmoe_subset.py            # 기본 v1 로 생성
    python3 scripts/gen_solmoe_subset.py --version 2

원본: 솔뫼 김대건체 (솔뫼성지) — https://noonnu.cc/font_page/506
      배포본은 눈누가 호스팅하는 jsdelivr 미러를 쓴다.
"""

import argparse
import io
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_URL = "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts-20-12@1.0/kdg_Medium.woff"
PAGE_DIR = os.path.join(ROOT, "app", "(main)", "lazyclub", "meetings", "dm-gd")
OUT_DIR = os.path.join(ROOT, "public", "fonts")

# 카피에 없어도 항상 넣어 두는 글자 — 숫자·기본 부호는 값이 바뀌어도 깨지면 안 된다
ALWAYS = "0123456789.,:;/()[]~-·… ?!'\"%"


def strip_comments(src: str) -> str:
    """블록/줄 주석 제거. 문자열 안의 '//' 를 지우지 않도록 따옴표를 먼저 건너뛴다."""
    out = []
    i, n = 0, len(src)
    while i < n:
        c = src[i]
        if c in "\"'`":  # 문자열 리터럴 — 통째로 통과시킨다
            quote = c
            out.append(c)
            i += 1
            while i < n:
                out.append(src[i])
                if src[i] == "\\":
                    i += 2
                    if i - 1 < n:
                        out.append(src[i - 1])
                    continue
                if src[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        if src.startswith("/*", i):
            i = src.find("*/", i + 2)
            i = n if i < 0 else i + 2
            continue
        if src.startswith("//", i):
            j = src.find("\n", i)
            i = n if j < 0 else j
            continue
        out.append(c)
        i += 1
    return "".join(out)


# 남길 문자: 한글 음절·자모, 영숫자, 일반 문장부호
KEEP = re.compile(r"[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z0-9 .,:;/()\[\]~\-·…?!'\"%&+*=@#]")


def collect_chars() -> set:
    chars = set(ALWAYS)
    files = sorted(f for f in os.listdir(PAGE_DIR) if f.endswith((".tsx", ".ts")))
    if not files:
        sys.exit(f"✖ 원고 파일이 없습니다: {PAGE_DIR}")
    for name in files:
        with io.open(os.path.join(PAGE_DIR, name), encoding="utf-8") as f:
            text = strip_comments(f.read())
        chars |= set(KEEP.findall(text))
        print(f"  · {name}: 누적 {len(chars)}자")
    return chars


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", default="1", help="산출물 파일명 버전 (기본 1)")
    args = ap.parse_args()

    try:
        from fontTools import subset
        from fontTools.ttLib import TTFont
    except ImportError:
        sys.exit("✖ fontTools 가 필요합니다: pip install fonttools brotli")

    print(f"원본 내려받기: {SRC_URL}")
    raw = urllib.request.urlopen(SRC_URL, timeout=60).read()
    src_path = os.path.join(OUT_DIR, ".kdg_Medium.src.woff")
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(src_path, "wb") as f:
        f.write(raw)
    print(f"  {len(raw):,} 바이트")

    print("원고에서 글자 수집:")
    chars = collect_chars()
    text = "".join(sorted(chars))

    out_path = os.path.join(OUT_DIR, f"solmoe-kdg-medium-subset-v{args.version}.woff2")
    subset.main(
        [
            src_path,
            "--text=" + text,
            "--flavor=woff2",
            "--layout-features=*",
            "--no-hinting",
            "--desubroutinize",
            # 이 서체에는 컬러 SVG 글리프 테이블이 있다 — 웹 본문에 쓸모없고
            # 서브셋하려면 lxml 이 필요해 통째로 버린다
            "--drop-tables+=SVG",
            f"--output-file={out_path}",
        ]
    )
    os.remove(src_path)

    font = TTFont(out_path)
    cmap = set(font.getBestCmap().keys())
    missing = [c for c in sorted(chars) if ord(c) not in cmap]
    size = os.path.getsize(out_path)
    print(f"\n✔ {os.path.relpath(out_path, ROOT)}  {size:,} 바이트 / {len(font.getGlyphOrder())} 글리프")
    if missing:
        # 원본에 없는 글자다 — 그 글자만 폴백 서체로 그려진다. 카피를 바꾸거나 감수할 것
        print(f"⚠ 원본 서체에 없는 문자 {len(missing)}개: {''.join(missing)}")
    print("\n다음: coffeebar.module.css 의 @font-face src 파일명이 위와 같은지 확인")


if __name__ == "__main__":
    main()
