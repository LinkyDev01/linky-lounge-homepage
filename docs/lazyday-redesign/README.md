# Lazyday 북클럽 리뉴얼 — 핸드오프 패키지 (정리본)

## 큰 그림

처음에는 와이어프레임 기반 11단계 PR을 가정하고 시작했지만, **main 브랜치를 직접 확인해보니 와이어프레임의 70% 정도가 이미 구현되어 있었습니다** (`book-club` → `lazyday` 폴더로 rename됨, `NavBar`·`BookSubNav`·redesign된 8개 섹션 컴포넌트 모두 있음, `book-config.ts` season1·2 풀 데이터 채워짐).

남은 진짜 작업은 **양귀비 일러스트 시스템 + Framer Motion 모션 레이어** 두 가지입니다.

## 동민님의 다음 액션 (3분 안에 끝)

1. 로컬 워크스페이스를 main과 sync:
   ```bash
   cd C:\Users\KPMG\lounge-dev\lounge-homepage-main
   git add components/illustrations/poppy/ docs/lazyday-redesign/
   git commit -m "WIP: 양귀비 일러스트 + 핸드오프 문서"
   git pull origin main
   ```
2. 02 문서를 Claude Code에 던지기:
   > `docs/lazyday-redesign/02-implementation-plan.md` PR 1번부터 4번까지 순차 진행해줘. 5번 (ScrollProgressBar)는 일단 보류.

3. PR마다 `git diff` 보고 머지 결정.

## 문서 구성

| 파일 | 용도 |
|---|---|
| `README.md` (본 문서) | 전체 안내 |
| `02-implementation-plan.md` | **남은 작업 명세 — 핵심 문서** |
| `03-book-config-update.md` | obsolete 표기 (이미 main에 있음) |
| `01-illustration-prompts.md` | 양귀비 시리즈 컨셉·사용 가이드 |
| `../../components/illustrations/poppy/README.md` | SVG 컴포넌트 8개 사용법 |
| `wireframes/` (Claude Design URL) | 처음 와이어프레임 — 참고용 |

## main에 이미 들어있는 것 (재구현 금지)

| 영역 | 상태 |
|---|---|
| `app/(main)/lazyday/` 폴더 (구 `book-club`) | ✅ |
| `book-config.ts` season1·2 풀 데이터 | ✅ |
| `NavBar.tsx` (sticky tabs + scroll active) | ✅ |
| `BookSubNav.tsx` (이번/지난 기수 토글) | ✅ |
| `AboutSection`, `VibeSection`, `HowToSection`, `ScheduleSection`, `BookSection`, `FaqSection`, `ClosingSection` redesign | ✅ |
| Hero `lazyday_poster_v2.png` | ✅ |
| Past seasons smooth open/close | ✅ |
| 색상 팔레트 개편 | ✅ |

## 진짜 남은 작업 (lazyday를 독보적으로)

| 작업 | 추가 가치 |
|---|---|
| Framer Motion 설치 + 공용 wrapper (FadeUp, ParallaxFloat) | 스크롤마다 등장하는 호흡감 |
| 양귀비 일러스트 8개 섹션에 통합 | 트레바리·민음사가 안 가진 시그니처 비주얼 |
| 디바이더 떠다니는 양귀비 잎 (parallax) | 페이지 전체에 "한 송이가 피고 진다"는 서사 |
| ScrollProgressBar (선택) | 긴 페이지에서 위치감 |

## 미해결 항목 (별도 결정)

- [ ] **2기 책 표지 4장** 실제 파일 존재 여부 확인 — `public/linky-lounge/book-club/books/2기-*.jpg`
- [ ] **양귀비 일러스트 톤 시각 검증** — dev 서버 띄우고 실제 페이지에서 hero 이미지와 톤 충돌 없는지 확인
- [ ] **Hero 일러스트 보조 3프레임 cross-fade loop** 도입 여부 (선택)

## 양귀비 시리즈 한눈에

```tsx
import { Petal, Bud, Bloom, SeedPod, Leaf, Specimen, Cluster, Solo } from "@/components/illustrations/poppy"
```

- About → `<Specimen />` (인용구 옆 식물도감 표본)
- Vibe 카드 1·2 → `<Cluster />`, `<Solo />`
- How 1부·2부·마무리 → `<Bud />`, `<Bloom />`, `<SeedPod />`
- 디바이더 (parallax) → `<Petal />`, `<Leaf />`, `<Bud />`
- Apply 위치 마커 → 작은 `<SeedPod />`

자세한 컨셉·사용법은 `components/illustrations/poppy/README.md` 참고.
