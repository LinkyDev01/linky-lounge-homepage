# 포스터 실 경로 — 원본 PDF 파서

`POSTER_THREAD_D`(app/(main)/lazyday/poster-thread.ts)의 **출처**. 4기 포스터를 만든
미리캔버스 원본을 PDF 로 내보내면 안이 벡터라 **글자 하나하나의 아웃라인과 배치 행렬**이
들어 있다. 잉크를 추적하거나 호를 추정할 필요 없이 좌표를 그대로 읽으면 된다.

## 순서

```
python3 pdfglyphs.py     # PDF → 글리프 367개 (좌표·회전·bbox)   → /tmp/pdfglyphs.pkl
python3 assign.py        # Form XObject 17개 ↔ 본문 17줄 배정     → /tmp/assign.pkl
python3 buildpath.py     # 읽기 순서로 글자 중심 잇기 + 공백 보간 → /tmp/pdfpts.npy
python3 emit2_pdf.py     # 주기 스플라인 → 베지어 방출·검증       → /tmp/pdfpath.txt
```

`pdfglyphs.py` 상단의 PDF 경로만 바꿔 주면 된다.

## 좌표 변환

- 페이지 810 × 1012.5 pt = 캔버스 **1080 × 1350 px** (× 0.75)
- 콘텐츠 오프셋 `1 0 0 1 14.419115 91.895749 cm`
- `viewBox = 설계px × 400/1080`, y 는 `500 − y`

## 배정이 맞는지 보는 법

- 폼별 글리프 수의 다중집합이 17줄의 **비공백 글자 수**와 정확히 일치해야 한다
- 배정 후 각 줄 끝 → 다음 줄 시작이 **6~11u**(공백 한 칸 + 글자 한 칸)로 이어지고,
  17줄 끝이 1줄 시작과 **7.3u** 로 닫혀야 한다
- 큰 글자 12자(Form 16~27)를 `POSTER_GLYPHS` 와 대조하면 **평균 0.5u** 안에 든다

## 실측값 (2026-08-14)

글자 advance **7.115u** · 공백 advance **2.128u** · 경로 길이 **2735.24u** ·
잉크거리 0.43/2.70u · 중심 이탈 평균 0.37u · 자기교차 9곳 · 폐합 0
