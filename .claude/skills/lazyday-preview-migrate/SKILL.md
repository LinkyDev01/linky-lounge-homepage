---
name: lazyday-preview-migrate
description: 프리뷰(/lazyday/preview)에서 승인된 UI를 실사이트(/lazyday)로 이식하는 절차. "○○만 실제 반영해", "프리뷰대로 배포해" 지시를 받았을 때 사용. 프리뷰가 원본(source of truth)이며 이식본은 픽셀 단위로 동일해야 한다.
---

# 프리뷰 → 실사이트 이식 절차

핵심 원칙: **프리뷰가 승인된 원본이다.** 이식하면서 "개선"하지 않는다. 운영자가 "원본대로 다 했어?"라고 물으면 증거로 답할 수 있어야 한다.

## 0. 범위 확정

- 운영자가 지목한 것**만** 이식한다. ("책소개와 스테퍼까지만" → 그 둘만)
- 나머지 프리뷰 개선은 `docs/DECISIONS.md`의 보류 목록에 있어야 하며 실사이트로 새어들면 안 된다.

## 1. 대응물 파악

| 프리뷰 | 실사이트 |
|---|---|
| preview/BookSectionV2.tsx | BookSection.tsx |
| preview/FeatureBoxSectionV2.tsx | FeatureBoxSection.tsx |
| preview/FaqSectionV2.tsx | FaqSection.tsx |
| preview/NavBarV2.tsx | NavBar.tsx |
| preview/StickyApplyButtonV2.tsx | apply-button.tsx (+sticky-apply-button.tsx) |
| preview/JourneyStepper.tsx | JourneyStepper.tsx (실사이트 공용) |
| preview/apply/** | apply/** |

- 프리뷰 전용 CSS는 `preview/preview.module.css`(및 개별 V2 모듈)에, 실사이트 CSS는 각 컴포넌트 모듈에 있다.
- **주의**: 일부 모듈 CSS는 실사이트·프리뷰가 공유한다 (CLAUDE.md의 공유 CSS 지도 참조). 공유 파일 수정 = 양쪽 동시 변경.

## 2. 이식

- JSX는 프리뷰 버전을 기준으로 복사하되 import 경로·컴포넌트명만 실사이트에 맞게.
- CSS는 프리뷰 블록을 **값 그대로** 복사. "비슷하게"가 아니라 diff 0을 목표로.
- 폰트·전역 자원(Noto Serif 변수, Pretendard CDN)이 실사이트 렌더 경로(app/layout.tsx)에 로드되어 있는지 확인 — 프리뷰는 자체 layout에서 로드하므로 놓치기 쉽다.

## 3. 픽셀 대조 (핵심 — 생략 금지)

같은 조건(390px 뷰포트, localhost)에서 프리뷰와 실사이트를 **같은 상태로** 캡처해 나란히 비교:

```bash
node scripts/shot.mjs --url http://localhost:3000/lazyday/preview --selector "#book" --out /tmp/pv.png
node scripts/shot.mjs --url http://localhost:3000/lazyday        --selector "#book" --out /tmp/real.png
```
- 상호작용 상태도 대조: 카드 넘긴 상태(`--click`), 탭 전환 상태 등 최소 2–3개 상태.
- 눈 비교 + 필요 시 `--eval`로 렌더 수치(이미지 크기, 폰트, 색) 대조.
- **프리뷰 자체의 잠재 불일치**(JSX prop vs CSS 승자 등)를 발견하면: 실제 *렌더된* 값이 승인된 모습이다 — 그 값으로 양쪽을 통일한다.
- 발견된 차이는 전부 고치고 재캡처. 운영자 보고에 대조 스크린샷 첨부.

## 4. 정리·배포

- 이식으로 고아가 된 실사이트 구버전 컴포넌트/CSS는 삭제 (단, 공유 CSS 소비자 grep 후).
- 이후 배포는 `lazyday-deploy` 스킬 절차대로.
