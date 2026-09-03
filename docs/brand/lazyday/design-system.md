# 레이지데이 북클럽 — 디자인 시스템

> **적용 범위**: `app/(main)/lazyday/**` (lazyday-bookclub.com). 레이지클럽(`app/(main)/lazyclub/**`)은 별도 체계 —
> `docs/redesign/02-design-tokens.md`·`03-layout-spec.md`가 정본이며 이 문서를 따르지 않는다.
> 관리 화면(`admin.lazy-club.com`)도 레이지클럽 §9 문법(라운드 0 · 유채색 0 · 보더 버튼 0 · 그림자 0, 2026-09-02) — 이 문서 밖.
>
> **정본 관계**: 매 세션이 지켜야 할 압축 규칙은 `CLAUDE.md` §3이고, 충돌 시 그쪽이 우선한다.
> 이 문서는 그 규칙의 **근거·실측값·전체 지도**다. 값은 전부 레포 CSS에서 뽑았다 (2026-09-03 실측, main #602).
>
> 자매 문서: [`philosophy.md`](./philosophy.md) — 이 시스템이 표현하려는 것.
> 상위 브랜드 정의서: [`../README.md`](../README.md) (레이지클럽) — 그쪽 02 가 레이지클럽 화면의 정본이고, 이 문서는 북클럽 랜딩 전용이다.

---

## 1. 디자인 방향

**콰이어트 에디토리얼.** 레퍼런스: Aesop, The Row. (디자인 브리프 2026-07, DECISIONS 2026-07-06 확정)

- 좁은 단, 명조 본문, 압도적 여백, **박스·배지·이모지 없음**
- 절제 = 자신감의 신호. 설득 장치(후기 숫자·혜택·긴급성)를 제거하고 여백과 침묵이 지위를 만든다
- 기각: 라운딩 박스 헤더 아코디언("너무 가벼워 보임"), 하우스코드/초대장/룩북/크레도 시안

**검증 뷰포트 390px** — 모바일 퍼스트. 데스크톱은 `--lz-*` 변수 주입으로 확장한다 (§5).

---

## 2. 색

**이 팔레트 밖의 색은 쓰지 않는다.** 새 색은 운영자 승인 (CLAUDE.md §3). 출현은 lazyday CSS 전체 횟수(2026-09-03).

| 역할 | 값 | 출현 |
|---|---|---|
| 섹션 배경 A (밝은 오트) | `#f7f3ee` | 57 |
| 섹션 배경 B (짙은 오트) | `#f0e9e0` | 23 |
| 브랜드 주황 — CTA·활성·강조 | `#d2691e` | **266** |
| 주황 hover / active | `#b8571a` / `#a04d16` | 79 / 7 |
| 잉크 (제목) | `#1a1208` | 225 |
| 본문 다크브라운 | `#4a3020` | 97 |
| 보조 텍스트 (옅어지는 순) | `#8a6a50` → `#8a7660` → `#a08b70` | 94 / 43 / 61 |
| 각주 | `#9a9590` (11px) | 23 |
| 카드 배경 | `#fffdf8` | 79 |
| 카드 보더 | `#eee2d0` / `#e5d9c8` / `#e8dccd` | 12 / 34 / 26 |
| 괘선 (섹션 제목) | `rgba(210,105,30,.6)` 56×1.5px | — |
| 괘선 (FAQ 라인) | `rgba(74,58,42,.18)` | — |
| 오류 | `#c0392b` | 13 |

⚠ `#f5ede4`(35회)·`#ede0d0`(13회)은 **구 배경 A/B**다 — 2026-07 디자인 브리프 시점 값. apply·인터뷰 하위 페이지와 일부 카드 배경에 남아 있으며 랜딩 섹션 배경으로는 쓰지 않는다.

### 배경 교차 규칙

- 랜딩 섹션은 **A/B 반드시 교차**. 순서를 바꾸면 배경을 재배정해 교차를 유지한다.
- fade·moreHint(페이드 컷 그라디언트)의 배경색은 섹션 배경과 동기화 — 안 하면 페이드가 다른 색으로 끝난다.
- 2색 교차에 홀수 섹션을 끼우면 한쪽은 반드시 인접 충돌한다. 임의로 색을 바꾸지 말고 선택지와 함께 보고 (선례: 프리뷰 ScenesSection, 2026-08-24).

---

## 3. 서체

| 서체 | 용도 | 로드 |
|---|---|---|
| **SUIT** | 기본 (UI·제목·본문 전부) | 자체 서브셋 woff2, `globals.css` `@font-face` 번들 인라인. **수동 preload 금지** — Next 16 자동 preload와 겹쳐 610KB가 두 번 내려간다 (2026-08-17) |
| **Noto Serif KR 500** | 책 본문만 — 13px / 1.85 | Google Fonts CDN, `DeferredCss`(비차단) |
| **Pretendard Variable 700 italic** | 책 제목만 — 19px | jsdelivr CDN, `DeferredCss` |

**세리프 확장은 운영자 확인.** 현재 승인된 세리프 예외는 HeroSummary 제목 "오프라인 독서모임"(명조 20px) 하나.

서체 파이프라인(서브셋 재생성·immutable 헤더·FOUT 해소)은 `docs/env-notes.md`.

---

## 4. 타이포그래피 위계

| 층위 | 값 | 비고 |
|---|---|---|
| **섹션 제목** | 32px / 800 / `#1a1208` / lh 1.2 / ls −0.025em · **좌정렬** · 아래 주황 괘선 56×1.5 · ≤480px **26px** | '함께 읽는 책' 기준 **전 섹션 통일** (2026-08-24). `FaqSection.module.css` `.titleRow`·`.sectionTitle` |
| 섹션 부제 | 14~15px / 500 / `#8a6a50` | "멤버들이 손으로 눌러 적어준 이야기들이에요." |
| 눈썹 레이블 | 10px / 자간 0.28em / 영문 대문자 | PEOPLE · TEXTS · QUESTIONS · SPACE (모임소개) |
| 챕터 제목 | 16.5px / 700 | 모임소개 |
| 핵심 문장 | 명조 14.5px · 중앙 | 모임소개 — **콰이어트 섹션만 중앙 정렬 예외** |
| **본문** | 13 ~ 15.5px / **lh 1.85** / `#4a3020` | FAQ 답변 14px |
| 책 본문 | Noto Serif KR 500 · 13px / **lh 1.85~2.0** | 종이책 조판 (아래) |
| 각주 | 11px / `#9a9590` · `*`로 시작 · **좌정렬 · lh 1** · 연속 시 4px 간격 | DECISIONS 2026-07-28 표준 |
| 캡션 | 카드 하단 "2026. 8. 27의 기록" | 후기 |

### 줄바꿈

- 기본: `word-break: keep-all` + `text-wrap: pretty`
- **종이책 조판 예외** — 명조 본문 블록만 `word-break: normal` + `text-align: justify` (음절 단위 줄바꿈 + 양쪽 정렬, 국내 단행본 표준). 제목·핵심 문장·UI·FAQ는 keep-all 유지.
- 일정 값은 **시간대 그룹 단위로만** 줄바꿈 — "일 10:30–13:30, 14:30–17:30"이 중간에서 끊기면 오전만 있는 것처럼 읽힌다 (2026-08-17, `white-space: nowrap` 그룹).

---

## 5. 레이아웃

### 컨테이너 — `--lz-*` 변수

`landing-shell.module.css`가 주입하고 모든 섹션이 소비한다. **변수를 추가·변경하면 프리뷰 CSS 3개**(`preview.module.css`·`ScheduleSectionV2.module.css`·`preview/FeatureQuietSection.module.css`)도 확인 — 안 하면 프리뷰만 데스크톱 확장에서 빠진다.

| 변수 | 모바일 (≤1099) | 데스크톱 (≥1100) |
|---|---|---|
| `--lz-max` 컨테이너 | 600px | 100% |
| `--lz-rail` 본문 컬럼 | 600px | min(1100px, 100vw − 80px) |
| `--lz-gutter` 좌우 패딩 | 24px | max(40px, (100vw − 1100px)/2) |
| `--lz-gutter-lg` ≥768 패딩 | 56px | 〃 |
| `--lz-block` 카드·캘린더 | 420px | 520px |
| `--lz-card` 캐러셀 카드 | 560px | 660px |
| `--lz-chapter` 원고 폭 | 320px | 460px |
| `--lz-qt-cols` 모임소개 그리드 | — | 2 (2×2) |

### 브레이크포인트 (lazyday CSS 출현 빈도순)

`max-width: 480` (30) · `min-width: 768` (17) · `prefers-reduced-motion` (14) · `min-width: 721` (11) · `max-width: 379` (2)

→ 실질 3단: **≤480 모바일 압축 / 768~ 태블릿 / 1100~ 데스크톱 확장**.

### 섹션 이어 붙이기

- **섹션 간 margin 금지.** 배경색 교차만으로 구분한다.
- 숨구멍은 **내부 하단 패딩** — 모든 섹션 `padding: 0 var(--lz-gutter) 56px` 골격.
- 텍스트란 390px 기준 본문 폭 350px (챕터 max 360 + 좌우 20).

---

## 6. 랜딩 섹션 구조 (2026-08-24 재배열)

| # | 섹션 | 배경 | 컴포넌트 | 내비 탭 |
|---|---|---|---|---|
| 0 | 히어로 + 요약 | 포스터 | `HeroParallax` → `HeroBreathingPoster` + `HeroSummary` | — |
| 1 | 함께 읽는 책 | **B** | `BookSection` | 함께 읽는 책 |
| 2 | 모임소개 | **A** | `FeatureQuietSection` | 모임소개 |
| 3 | 진행 방식 | **B** | `ProcessSection` (01 자기소개 · 02 오프닝/질문 · 03 서로의 페이지 · 04 마무리) | 진행방식 |
| 4 | 일정·장소 | **A** | `ScheduleSection` | 일정·장소 |
| 5 | 후기 | **B** | `ReviewsSection` (10장, 밀도 순) | 후기·FAQ |
| 6 | FAQ | **A** | `FaqSection` | 후기·FAQ (5와 공유) |
| 7 | 클로징 | **B** | `SeasonCountCta` + `BrandCloseV2` | — |
| 7′ | 다음 기수 알림 | — | `NextSeasonNotify` — `SEASON.status === "closedEarly"` 일 때만, 클로징 직전 | — |

내비 탭은 **5개**(함께 읽는 책 · 모임소개 · 진행방식 · 일정·장소 · 후기·FAQ). 전체가 `LandingShell`(내비 + 푸터) 안. 진입 안무: 포스터만 → 그어짐 끝 무렵 내비·푸터·본문 → +3초 스티키 CTA (`useChromeIntro.HOLD_ENABLED=true`).

---

## 7. 컴포넌트 문법 — 재사용, 발명 금지

새 UI는 아래 문법 중 하나를 쓴다. **둘을 섞거나 새로 만들지 않는다.**

### 캐러셀 (`BookSection.module.css` `.bookCarousel` ~ `.bookDots`)

- `scroll-snap-type: x mandatory` · `scroll-snap-align: center` — 가운데 스냅
- 카드 `flex: 0 0 calc(100% − 36px)` → 양끝에 이전·다음 카드가 **~10px 슬리버로 존재만** 보임
- 비활성 카드: `opacity .45` · `scale(.94)` · `blur(1px)` (변수 `--lz-card-dim/scale/blur`, 데스크톱 그리드에선 전부 활성)
- 카드: `#fffdf8` · 보더 `#eee2d0` · radius 16 · padding 22/16/20
- 점 인디케이터 + ‹ › 셰브론. 소비자: 책 · 후기 · 레이지클럽 기록

### 세그먼트 (`.seasonSeg`)

주황 썸이 이동하는 탭. 기수 전환용.

### 접힘 — 두 문법, 섞지 말 것

| | FAQ 미니멀 라인 | 페이드 + 이어 읽기 |
|---|---|---|
| 클래스 | `FaqSection.module.css` `.line*` | `FeatureBox` / 모임소개 `.fade*`·`.moreHint` |
| 구분 | 괘선 `rgba(74,58,42,.18)` | 없음 (챕터 사이 `·` 하나) |
| 아이콘 | `+` → 45° 회전 | 밑줄 텍스트 "이어 읽기", 박스 없음 |
| 전개 | `grid-template-rows: 0fr → 1fr` · 0.35s cubic-bezier(0.22,0.8,0.36,1) | 첫 두 줄 노출 후 문장 중간에서 배경색으로 페이드 컷 |
| 쓰는 곳 | 문답형 (FAQ) | 원고형 (모임소개) — 핵심 문장이 결론형이라 잘린 본문의 정보 공백이 클릭 동기 |

### 스텝퍼 (`JourneyStepper`)

번호 + 라벨 + 설명. 진행 방식 01~04. **삭제 금지** (오삭제 선례).

### 카드 — 종이 낱장 (`SummaryCard`, 후기 폴라로이드)

`#fffdf8` 배경 · 보더 · 그림자 최소. 후기 카드는 하단 흰 여백에 날짜만 ("--의 기록"), 인용 블록 없음.

### CTA

- 스티키 하단 CTA: `fit-content` · radius 0 · 15px · padding 13/26 · 주황 `#d2691e`. **하단 고정 방식 변경 금지** (상시 원칙) — 문구만.
- 모집 마감 시 `d < 0` → href `/`로, 픽셀 발화 안 함.

---

## 8. 모달 · 제스처 (인스타그램 사진 뷰어 문법)

`ReviewsSection.module.css` `.lightbox` 블록이 정본. 소비자: 후기 · 자기소개 규칙 · 레이지 노트 · 레이지클럽 기록 · 라운지 공간.

| 요소 | 값 |
|---|---|
| 배경 | 반투명 검정, `z-index: 200` |
| 확대 | 핀치 · 더블탭 1.8× · +/− 0.35 스텝 · 1×~4× · 오버 탄성 0.6 · 240ms 정착 (`useZoomGesture.ts`) |
| 넘김 | 스와이프 45px · ‹ › · 방향키. **낱장은 넘김 숨김** |
| **드래그 탈출** | 시작 14px · 탈출 96px 또는 0.55px/ms · 배경 360px에 걸쳐 0.35까지 페이드 (`useDragDismiss.ts`) |
| 축 | `vertical` — 다장 갤러리 (가로는 넘김에 양보) / `omni` — **낱장 전용** (자기소개 규칙) |
| 우선순위 | 확대 중 이동 = 팬 (드래그 아님) · 둘째 손가락 = 핀치 (드래그 취소) |

이미지: 모달용 원본 세로 1440px · 카드용 가로 700px 축소본 별도 파일 (§11).

---

## 9. 모션

- **등장 리빌은 섹션당 제목 1개.** `y: 12` · `0.9s` · `cubic-bezier(0.22, 1, 0.36, 1)`. **본문은 정적.**
- `FadeUp` 기본값(`y 24` · `0.6s`)은 **타 페이지용** — 수정 금지. lazyday에서는 명시 주입.
- `prefers-reduced-motion: reduce` 전 모션 비활성 (14곳).
- 히어로 `HeroBreathingPoster` — 랜딩 직접 배포 금지, `preview/hero-check`에서 확인 후 반영 (원칙 2026-08-14). 포스터 내부는 `docs/env-notes.md` 필독.
- 클로징 `SeasonCountCta` 카운트업 — IO threshold .6, 검증 시 `scrollIntoView`로 화면 중앙에 (`scrollTo(맨아래)`는 발화 안 함).

---

## 10. 고정 레이어 지도

**새 fixed/오버레이 요소를 놓기 전 반드시 확인** — 겹침 사고 2회 (2026-08-24).

| 요소 | 위치 | z |
|---|---|---|
| `LandingShell` 헤더 | `top: 0` | — |
| `SectionIndicator` 도트 | 우측 세로 중앙 | — |
| 스티키 CTA | 하단 | — |
| `PreviewBar` (프리뷰만) | **좌측** 가장자리 | — |
| 라이트박스 | 전면 | **200** (헤더·CTA 위) |

---

## 11. 이미지

- `next.config` `unoptimized: true` — **소스 파일 크기 = 전송량.** 운영자 확인 없이 끄지 않는다.
- 새 이미지는 **최대 노출 크기 ×2로 미리 축소해 커밋.** webp q82.
- **모달용 원본과 카드용 축소본은 별도 파일** (`review-0N.webp` 1440h + `review-0N-card.webp` 700w). 카드는 최대 322px로 그려지므로 700w면 레티나 충분.
- 후기 규격 실측: 원본 1006~1029×1440 (130~172KB) · 카드 700×980~1002 (72~88KB). 현재 10장.
- **새 후기는 기존 장의 종이색에 맞춰 화이트밸런스 한 단계로 보정한다.** 중앙값 기준 보정 금지 — 중앙값은 필기량과 그림자에 흔들려 잉크가 적은 장이 과보정된다 (2026-09-02, 두 번의 재보정 끝에 확정).
- 후기 배열은 날짜가 아니라 **글의 밀도 순** (`philosophy.md` §4). 북클럽 `photoCards`와 레이지클럽 `ARCHIVE_SLIDES`는 **수동 사본** — 순서를 바꾸면 둘 다 고친다.
- 포스터·서브셋 파이프라인은 `docs/env-notes.md`.

---

## 12. 로고 (종결 — 추가 작업 금지)

| 파일 | 용도 |
|---|---|
| `public/assets/logo/lazyday_logo.svg` | 마스터 풀컬러 — 파비콘·OG·레이지클럽 홈 |
| `logo-mono-ink.svg` | 화면 노출 (기본) |
| `logo-mono-cream.svg` | 색면 위 |

리컬러·임의 색 교체 금지. 북클럽 랜딩 푸터 마크는 `ldbc-logo-text.png`, 내비는 동적 `LazydayMark`(도미노 모션, 2026-08-12).

---

## 13. 프로세스 규칙 (디자인 작업의 절차)

1. **프리뷰 퍼스트** — 새 UI·리디자인은 `/lazyday/preview`에 먼저. 프리뷰가 원본, 이식본은 픽셀 동일.
2. **"리디자인해줘" = 복수 시안** (3~5개, 인터랙티브 전환). 단 **배치·맥락이 쟁점이면 쇼케이스 금지** — 프리뷰 랜딩 실배치 + 스위처.
3. **공유 CSS 확인** — `.module.css` 수정 전 소비자 grep (지도: CLAUDE.md §4). 클래스 **추가** 우선.
4. **분리 사본 쌍 동기화** — Schedule·모임소개(FeatureQuietSection) 실↔프리뷰, 캘린더 3벌(+ApplyCalendar).
5. **증거 기반 완료** — 390px 스크린샷(`scripts/shot.mjs`) 없이 "됐다" 금지. 배포 후 실도메인 curl.
6. **레이지클럽은 이 문서 밖** — `docs/redesign/` 체계(3뷰포트·제로베이스·기존 문법 재사용 의무 없음·블롭 금지).

---

## 14. 출처 지도

| 무엇 | 어디 |
|---|---|
| 압축 규칙 (정본) | `CLAUDE.md` §3 · §4 · §5 |
| 섹션 제목·FAQ 라인 | `app/(main)/lazyday/FaqSection.module.css` |
| 캐러셀·세그먼트 | `app/(main)/lazyday/BookSection.module.css` |
| 모달·라이트박스 | `app/(main)/lazyday/ReviewsSection.module.css` |
| 제스처 상수 | `app/(main)/lazyday/useZoomGesture.ts` · `useDragDismiss.ts` |
| `--lz-*` 변수 | `app/(main)/lazyday/landing-shell.module.css` |
| 모션 기본값 | `components/animation/FadeUp.tsx` |
| 디자인 방향 확정 경위 | `docs/design-brief-2026-07.md` (값 일부 구버전) |
| 환경·파이프라인 | `docs/env-notes.md` |
| 결정 이력 | `docs/DECISIONS.md` |
