#!/usr/bin/env python3
"""포스터 실 배치표 생성기 — 빌드 타임에 글자 자리를 **전부 계산**해 굽는다.

왜 필요한가 (2026-08-17, 운영자 "각각 텍스트가 또 확 튀어 위치가" 이후):
  종전 구조는 글자 배치를 브라우저 런타임 측정에 맡겼다 — 서체가 오면 폭을 재고,
  경로에 몇 자가 얹히는지 세고, 크기와 경로 둘레를 서로 맞췄다. 그래서 서체 도착
  타이밍·엔진·회선에 따라 **로드마다 다른 화면**이 나왔고, iOS 전용 결함(겹침·누락·
  고갈)도 전부 `<textPath>` 의 엔진별 끝단 처리에서 나왔다.
  → 서체 파일을 우리가 소유하므로 **글자 폭을 여기서 미리 읽어** 배치를 확정한다.
    런타임은 시계 → 좌표 계산만 한다. 브라우저에게 묻는 것이 없으니 브라우저마다
    다를 것도 없다.

무엇을 굽는가
  · POSTER_FONT_SIZE   한 벌(474자)이 루프를 **정확히 한 바퀴** 채우는 글자 크기(px)
  · POSTER_LOOP_LEN    실 둘레(u) — 베지어 호길이 정적분
  · POSTER_CHAR_ADV    글자별 advance(u) — 서브셋 woff2 의 hmtx 실측 + 자간
  · POSTER_SEG_ARC     421 세그먼트의 누적 호길이(u) — 런타임 호길이→좌표 변환용
  · POSTER_BASELINE_DY 베이스라인 → 글자줄 중심(central) 오프셋(u)

실행:  python3 scripts/gen_poster_layout.py
       (서브셋 서체나 경로·원문이 바뀌면 다시 돌리고 산출물을 커밋한다)
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
THREAD_TS = ROOT / "app/(main)/lazyday/poster-thread.ts"
FONT = ROOT / "public/fonts/pretendard-poster-subset.woff2"
OUT = ROOT / "app/(main)/lazyday/poster-metrics.ts"

# 자간 — 원본 포스터 조판 실측값 (poster-thread.ts 8차 주석). em 단위.
LETTER_SPACING_EM = 0.003


# ── ① 원문·경로 읽기 ────────────────────────────────────────────────────────
def read_source():
    src = THREAD_TS.read_text(encoding="utf-8")
    d = re.search(r'export const POSTER_THREAD_D =\s*\n?\s*"([^"]*)"', src)
    if not d:
        sys.exit("POSTER_THREAD_D 를 못 찾았다")
    parts = []
    for n in (1, 2, 3):
        m = re.search(r'export const SAYU_P%d =\s*\n?\s*"([^"]*)"' % n, src)
        if not m:
            sys.exit("SAYU_P%d 를 못 찾았다" % n)
        parts.append(m.group(1))
    return d.group(1), " ".join(parts)


def parse_path(d):
    """M + 절대 3차 C 나열 (+ Z) → [(p0,p1,p2,p3), …]"""
    nums = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", d)]
    if len(nums) % 2:
        sys.exit("좌표 개수가 홀수다")
    pts = [(nums[i], nums[i + 1]) for i in range(0, len(nums), 2)]
    segs = []
    cur = pts[0]
    i = 1
    while i + 2 < len(pts) + 1 and i + 2 <= len(pts) - 1 + 1:
        if i + 2 >= len(pts):
            break
        segs.append((cur, pts[i], pts[i + 1], pts[i + 2]))
        cur = pts[i + 2]
        i += 3
    return segs, pts


# ── ② 베지어 호길이 (Gauss-Legendre 24점 — 세그먼트가 6.5u 라 사실상 정확) ──
GL24 = [
    (-0.0640568928626056, 0.1279381953467522), (0.0640568928626056, 0.1279381953467522),
    (-0.1911188674736163, 0.1258374563468283), (0.1911188674736163, 0.1258374563468283),
    (-0.3150426796961634, 0.1216704729278034), (0.3150426796961634, 0.1216704729278034),
    (-0.4337935076260451, 0.1155056680537256), (0.4337935076260451, 0.1155056680537256),
    (-0.5454214713888396, 0.1074442701159656), (0.5454214713888396, 0.1074442701159656),
    (-0.6480936519369755, 0.0976186521041139), (0.6480936519369755, 0.0976186521041139),
    (-0.7401241915785544, 0.0861901615319533), (0.7401241915785544, 0.0861901615319533),
    (-0.8200019859739029, 0.0733464814110803), (0.8200019859739029, 0.0733464814110803),
    (-0.8864155270044011, 0.0592985849154368), (0.8864155270044011, 0.0592985849154368),
    (-0.9382745520027328, 0.0442774388174198), (0.9382745520027328, 0.0442774388174198),
    (-0.9747285559713095, 0.0285313886289337), (0.9747285559713095, 0.0285313886289337),
    (-0.9951872199970213, 0.0123412297999872), (0.9951872199970213, 0.0123412297999872),
]


def deriv(seg, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = seg
    u = 1 - t
    dx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2)
    dy = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2)
    return dx, dy


def seg_len(seg):
    total = 0.0
    for x, w in GL24:
        t = 0.5 * (x + 1)
        dx, dy = deriv(seg, t)
        total += w * (dx * dx + dy * dy) ** 0.5
    return total * 0.5


# ── ③ 서브셋 woff2 의 글자별 advance ────────────────────────────────────────
def char_advances(chars):
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        sys.exit("fontTools 가 필요하다:  pip install fonttools brotli")
    f = TTFont(str(FONT))
    upem = f["head"].unitsPerEm
    cmap = f.getBestCmap()
    hmtx = f["hmtx"]
    out = {}
    missing = []
    for ch in chars:
        g = cmap.get(ord(ch))
        if g is None:
            missing.append(ch)
            continue
        out[ch] = hmtx[g][0] / upem  # em 단위
    if missing:
        sys.exit("서브셋에 없는 글자: %r — 서브셋을 다시 떠야 한다" % "".join(missing))
    # central 베이스라인 오프셋 — SVG 'central' = 어센트와 디센트의 중간.
    # ⚠ 엔진마다 이 계산이 미세하게 다르다(실측 0.25u 차) — 그래서 런타임에 맡기지 않고
    #   여기서 정해 좌표에 직접 넣는다. hhea 를 쓴다(두 엔진의 기본 출처).
    hhea = f["hhea"]
    central_em = (hhea.ascender + hhea.descender) / 2 / upem
    return out, central_em, upem


def main():
    d, sayu_full = read_source()
    segs, pts = parse_path(d)

    # 닫힌 루프인지 확인 — 첫 점과 마지막 점이 같아야 한다
    if pts[0] != pts[-1]:
        sys.exit("경로가 닫혀 있지 않다: %r vs %r" % (pts[0], pts[-1]))

    arc = [0.0]
    for s in segs:
        arc.append(arc[-1] + seg_len(s))
    loop_len = arc[-1]

    # 흐름의 반복 단위 = 전문 + 문단 구분 한 칸 (컴포넌트의 UNIT 과 같아야 한다)
    unit = sayu_full + " "
    adv_em, central_em, upem = char_advances(sorted(set(unit)))

    # 한 벌의 총 진행거리(em) — 자간은 글자마다 한 번씩
    w_em = sum(adv_em[c] for c in unit) + LETTER_SPACING_EM * len(unit)
    # 한 벌이 루프를 **정확히** 한 바퀴 채우는 크기. 연속값이라 딱 떨어진다
    # (종전엔 이 값을 런타임이 글자 수를 세어 근사했다).
    font_size = loop_len / w_em

    per_char = {c: (adv_em[c] + LETTER_SPACING_EM) * font_size for c in adv_em}
    baseline_dy = central_em * font_size

    def num(v, n=5):
        s = f"{v:.{n}f}".rstrip("0").rstrip(".")
        return s if s else "0"

    keys = sorted(per_char)
    adv_lines = ",\n  ".join(f"{k!r}: {num(per_char[k])}".replace("'", '"') for k in keys)
    arc_str = ", ".join(num(a, 4) for a in arc)

    OUT.write_text(
        f'''// ⚠ **자동 생성 파일 — 손으로 고치지 말 것.**
//    생성:  python3 scripts/gen_poster_layout.py
//    입력:  poster-thread.ts (경로·원문) + public/fonts/pretendard-poster-subset.woff2
//
// 포스터 실 위 글자의 배치를 **빌드 타임에 확정**한 표다. 런타임은 이 표만 보고
// 좌표를 계산하며, 브라우저에 폭·길이·글자 수를 묻지 않는다 — 그래서 엔진·회선·
// 서체 도착 시각과 무관하게 언제나 같은 화면이 나온다.
// (배경: docs/DECISIONS.md 2026-08-17 "각각 텍스트가 또 확 튀어 위치가")

/** 실 둘레(u) — 421개 3차 베지어의 호길이 정적분 (Gauss-Legendre 24점) */
export const POSTER_LOOP_LEN = {num(loop_len, 4)}

/** 한 벌({len(unit)}자)이 실을 **정확히 한 바퀴** 채우는 글자 크기(px).
 *  loop_len ÷ (한 벌의 em 총폭 {num(w_em, 6)}) 로 역산했다. */
export const POSTER_FONT_SIZE = {num(font_size)}

/** 글자별 진행거리(u) = advance + 자간({LETTER_SPACING_EM}em). 서브셋 hmtx 실측. */
export const POSTER_CHAR_ADV: Record<string, number> = {{
  {adv_lines},
}}

/** 세그먼트 경계의 누적 호길이(u) — {len(arc)}개 (= 세그먼트 {len(segs)}개 + 1) */
export const POSTER_SEG_ARC: number[] = [{arc_str}]

/** 베이스라인 → 글자줄 중심(central)까지의 거리(u).
 *  ⚠ `dominant-baseline` 은 엔진마다 적용 지점이 달라(크롬은 <text> 에서 무시,
 *  웹킷은 tspan 유무로 갈림) 쓰지 않는다 — 이 값을 좌표에 직접 더한다. */
export const POSTER_BASELINE_DY = {num(baseline_dy)}
''',
        encoding="utf-8",
    )

    print(f"세그먼트      {len(segs)}")
    print(f"실 둘레       {loop_len:.4f} u")
    print(f"한 벌         {len(unit)}자 · {w_em:.6f} em")
    print(f"글자 크기     {font_size:.5f} px   (종전 상수 8.28 대비 {font_size / 8.28 - 1:+.2%})")
    print(f"평균 진행     {loop_len / len(unit):.4f} u/자")
    print(f"central 오프셋 {baseline_dy:.4f} u (upem {upem})")
    print(f"→ {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
