# CLAUDE.md — linky-lounge-homepage AI 작업 가이드

이 레포는 **링키라운지**(linkylounge.com)와 **레이지데이 북클럽**(lazyday-bookclub.com) 사이트다.
Next.js 16 App Router · CSS Modules · TypeScript · Vercel 배포. 최근 작업의 중심은 레이지데이 북클럽.
linkylounge.com 쪽 페이지는 명시 지시 없이 수정하지 않는다 (§4의 lounge-info CSS 교차만 주의).

**세션 시작 시 반드시**: ① 이 문서 전체 ② `docs/DECISIONS.md`(운영자 결정 로그)를 읽는다.
보류된 항목을 운영자의 새 지시 없이 부활시키거나, 확정된 결정을 임의로 번복하지 않는다.

**기본 명령어**: dev `npm run dev` · 타입체크 `npx tsc --noEmit` · 빌드 `npm run build` · 린트 `npm run lint`.
테스트 스위트는 없다 — 검증 수단은 tsc + `scripts/shot.mjs` 스크린샷 + 배포 curl 마커가 전부.
**GitHub 좌표**: `LinkyDev01/linky-lounge-homepage` (mcp__github 호출의 owner/repo). 작업 브랜치는 main에서 분기, `claude/<주제>` 관례.

---

## 1. 다섯 가지 철칙

1. **프리뷰 퍼스트.** 새 UI·리디자인·실험은 `/lazyday/preview` 트리에 먼저 구현해 보여주고, 운영자가 승인한 것만 실사이트로 이식한다. 프리뷰가 원본(source of truth) — 이식본은 픽셀 단위로 동일해야 하며, 이식하며 "개선"하지 않는다. (절차: `lazyday-preview-migrate` 스킬)
   - **예외**: 이미 실사이트에 있는 요소에 대한 운영자의 직접 값 조정 지시(패딩·간격·크기 트윅)는 프리뷰 신설 없이 바로 수정한다 — §4 소비자 확인 + 전/후 스크린샷으로 갈음.
   - **"디자인 개편/리디자인해줘" = 시안 쇼케이스.** 현행 유사 개선 1개로 답하면 안 된다. `preview/<섹션>-designs/` 라우트를 만들어 서로 다른 레퍼런스 기반 시안 3~5개를 인터랙티브 전환으로 비교시킨다 (선례·템플릿: `preview/faq-designs/page.tsx`). 채택된 시안은 프리뷰 V2로 고정한 뒤 이식.
2. **승인 게이트.** ~~main 병합은 명시 승인 시에만~~ → **상시 배포 승인으로 전환 (운영자 "반영하면 배포해", 2026-07-24)**: 운영자 지시를 반영한 변경은 검증 후 곧바로 병합·프로덕션 확인까지 진행한다. 단, **시안 검토가 필요한 신규 디자인·리디자인(철칙 1 프리뷰 퍼스트 대상)은 종전대로 프리뷰 승인 후 병합.** 병합된 PR은 재사용 불가 — 매번 새 PR.
3. **증거 기반 완료.** UI 변경은 `node scripts/shot.mjs`로 렌더 스크린샷을 찍어 직접 확인하기 전까지 완료가 아니다. 배포 후에는 실제 도메인에서 확인한다(방법은 deploy 스킬 §5 — CSS 값만 바뀐 경우 포함). "됐을 것"이라는 추정으로 완료 선언 금지.
4. **범위 절제.** 운영자가 지목한 것만 한다. "○○만 반영"이면 그것만. 보류 항목이 실사이트로 새어들면 안 된다. 요청 안 된 리팩토링·개선·파일 정리 금지.
5. **공유 리소스 확인.** `.module.css`를 고치기 전에 반드시 소비자를 grep 한다(§4 공유 CSS 지도). 여러 곳이 쓰는 파일은 클래스를 **추가**하는 방식으로, 기존 클래스 변형은 모든 소비자 확인 후에만. 기존 클래스를 수정했다면 **그 클래스를 쓰는 모든 소비자 화면을 shot.mjs로 각각 캡처**해 의도한 곳만 바뀌었는지 확인한 뒤 완료 선언한다.

## 2. 프로젝트 지도

- **도메인**: `lazyday-bookclub.com` → middleware가 내부 `/lazyday/*`로 rewrite (`middleware.ts`). `/apply/interview`는 `/apply/interview/schedule`로 redirect. `linkylounge.com/lazyday/*`는 북클럽 도메인으로 301. `/lazyday/admin*`은 `lazyday_admin` 쿠키(=ADMIN_SECRET) 필요.
- **실사이트 랜딩** `app/(main)/lazyday/page.tsx` — **2026-08-12 반응형 개편 이식**: 페이지 전체가 `LandingShell`(레이지클럽 문법 내비+푸터, landing-shell.module.css)로 감싸이고, 내비는 동적 마크 `LazydayMark`(I♥LAZYDAY, 냥이체+난수 도미노), 폭 시스템은 CSS 변수(--lz-*)로 데스크톱(≥721px) 확장 — **≤720px 는 종전과 픽셀 동일**. 클로징은 `SeasonCountCta`(기수 카운트)+`BrandCloseV2`. 구 NavBar·Footer(랜딩에서만)·ClosingCtaSection·BrandCloseSection 은 **고아 보존**. 모임소개 데스크톱 = 2×2 그리드(시안 A 확정). 섹션 순서·배경(**오트 톤 저대비 교차 — 짙은 쪽부터**): Hero(+HeroSummary 병치 heroRow) → **선정도서(B#f0e9e0, 종이책 조판, 기수 세그 4기·3기·2기·1기 — 4기 upcoming 리드)** → 모임소개(A#f7f3ee, **FeatureQuietSection** 콰이어트 페이드 이어 읽기) → 진행방식(B, 콰이어트 리스트) → 일정·장소(A, **6b 괘선 박스+7b 점선 5회차+6c 손그림 장소**, 7b '자유 독서모임'은 #gathering FAQ 딥링크) → **후기(B, ReviewsSection — 캐러셀+모달 갤러리, FAQ와 B–B 인접 예외는 운영자 수용 2026-07-22)** → FAQ(B) → **ClosingCta+BrandClose(A)**. 5회차 섹션은 삭제되고 내용은 FAQ 문항으로 이관. About/Closing/Rules/Vibe/**FeatureBoxSection·FifthSessionSection** 은 **고아 상태로 보존**(렌더 안 함 — 삭제하지 말 것).
- **프리뷰 트리** `app/(main)/lazyday/preview/` : noindex + PreviewBar + 자체 폰트 로드(layout.tsx). 실사이트 컴포넌트의 V2 대응물 + 프리뷰 전용(HeroSummary, PhilosophySectionV2, ReviewsSection, faq-designs). HeroParallax·FifthSession·Footer는 실사이트 것을 그대로 import (V2 없음). HowTo·Schedule·모임소개·클로징CTA는 실↔프리뷰 **분리 사본 쌍** (§4 참조 — 한쪽 수정 시 쌍도 같은 값으로). FifthSession은 섹션 삭제로 실·프리뷰 모두 미렌더(고아 보존).
- **단일 출처 컨피그** (여기만 고치면 전체 반영):
  - `season-config.ts` — 기수명·기간·마감일(D-day 계산 `daysUntilDeadline`)·가격·요일·회차 일정·장소. **기수 전환 시 이 파일만 수정.**
  - `book-config.ts` — 기수별 책 4권 데이터 (소비자: BookSection, BookSectionV2)
  - `philosophy-content.tsx` — '결'·'불균형의 균형' 확정 원고 (강조는 `<strong>`, 색은 소비처 CSS가)
  - `preview/preview-config.ts` — season-config에서 파생. 프리뷰 실험값(capacity)만 자체 보유.
  - `one-day-talk-01/oneday-shared.ts` — 원데이 토크 일정·가격·orderId 계약 (소비자: apply, checkout, `/api/lazyday/payment/confirm` — **회차·가격 변경은 여기만**. confirm이 orderId로 금액을 재검증하므로 가격 변경 시 결제 진행 중 주문과의 불일치에 유의)

## 3. 디자인 시스템 (레이지데이)

**팔레트** — 이 색만 쓴다. 새 색 도입은 운영자 승인 필요.

| 역할 | 값 |
|---|---|
| 섹션 배경 A (밝은 오트) | `#f7f3ee` (구 크림 `#f5ede4` — 2026-07-06 오트 전환) |
| 섹션 배경 B (짙은 오트) | `#f0e9e0` (구 베이지 `#ede0d0`; 내부 박스 `#edddd0` 미전환 — 랜딩 미사용) |
| 브랜드 주황 (CTA·활성·강조) | `#d2691e` / hover `#b8571a` / active `#a04d16` |
| 잉크 (제목) | `#1a1208` |
| 본문 다크브라운 | `#4a3020` (명조 본문·FAQ 답변) |
| 보조 텍스트 | `#8a6a50` · `#8a7660` · `#a08b70` (옅어지는 순) |
| 각주 | `#9a9590` 11px |
| 카드 배경 | `#fffdf8` (보더 `#eee2d0`/`#e5d9c8`) |
| 내비 (브라운 그레이 반투명) | `rgba(110,100,90,.85)` + blur, 탭 `#ece1d2`, 활성 `#ffc590`/밑줄 `#eb8b3f` |
| 괘선 | titleRow::after `rgba(210,105,30,.6)` 56×1.5px / FAQ 라인 `rgba(74,58,42,.18)` |

**규칙들**
- **섹션 배경 교차**: 랜딩에서 A/B가 반드시 번갈아야 한다. 섹션 순서를 바꾸면 배경색도 재배정해서 교차 유지 (fade+더보기의 `fadeBg`·`moreHint` 배경은 섹션 배경과 **동기화** — 같이 바꿀 것).
- **섹션은 여백 없이 이어 붙인다** (margin 금지). 대신 섹션 **내부** 콘텐츠가 끝나자마자 경계가 오지 않게 내부 하단 패딩으로 숨 쉴 공간 확보.
- **폰트**: 기본 SUIT. 책 본문(인용·소개·큐레이터 노트)만 Noto Serif KR 500 13px/1.85 (`var(--font-noto-serif)`, app/layout.tsx에서 로드). 책 제목만 Pretendard Variable 700 italic 19px (CDN). 다른 곳에 세리프 확장 시 운영자 확인.
- **타이포**: 본문 line-height 1.85, 13~15.5px 위계, `word-break: keep-all` 표준, `text-wrap: pretty` 병행. 섹션 제목 32px/800 (모바일 26px) + 주황 괘선.
- **UI 문법 재사용** (새로 발명하지 말고 이걸 따를 것):
  - 캐러셀: 카드 `flex: 0 0 calc(100% - 36px)` + center snap + 양옆 ~10px 슬리버, 비활성 `opacity .45 / scale(.94) / blur(1px)`, 셰브런+도트 (BookSection.module.css의 `.bookCarousel`~`.bookDots` 블록)
  - 세그먼트 (운영자 표현 "기수 버튼/탭", 섹션 `#book`): `.seasonSeg`/`.seasonSegBtn` — 주황 썸 슬라이드, 버튼 `padding 8px 30px`, 첫 페인트 폴백 클래스
  - 접힘: FeatureBox = 페이드+`...더보기` (프리뷰 V2는 같은 문법에 접힘 높이만 '첫 문단+슬리버'로 개량 — 보류 해제 시 V2가 원본) / FAQ = **미니멀 라인**(괘선+`+`45°회전+grid-rows 애니, A안 확정, `line*` 클래스 계열 — 답변 텍스트는 `.lineAnswer`) — 두 문법을 섞지 말 것
  - 스텝퍼: JourneyStepper 공용 컴포넌트 (max-width 560, 26px 도트)
- **모션(등장 리빌)**: 등장 리빌은 섹션당 제목 1개 · y12 · 0.9s cubic-bezier(0.22,1,0.36,1), 본문·표·폼은 정적. (FadeUp 컴포넌트 기본값 y24·0.6s는 타 페이지용 — 수정 금지, lazyday에선 y·duration 명시 주입)
- **검증 기준 뷰포트: 390px** (모바일 퍼스트). 스크린샷 검증은 390px로.
- **이식으로 배경 교차가 깨지는 경우**: 이식 자체는 원본 값 그대로 두고, 배경 재배정은 별도 항목으로 운영자에게 선택지와 함께 보고 후 진행 — 임의로 원본 배경을 바꾸거나 교차가 깨진 채 병합하지 않는다.

## 4. ⚠️ 공유 CSS 지도 (수정 전 필독)

| 파일 | 소비자 | 수정 시 영향 |
|---|---|---|
| `page.module.css` (lazyday 루트) | page, HeroParallax, sticky-apply-button, apply-button, preview/page, StickyApplyButtonV2 **(6곳)** | 실+프리뷰 랜딩·히어로·CTA 동시 |
| `FaqSection.module.css` | FaqSection, preview/FaqSectionV2, preview/ReviewsSection, ReviewsSection **(4곳)** | **클래스 파티션 주의**: `line*` = 실 FAQ A안 전용 / `.answer`·`.peek*`·`.fade*`·`.moreHint` = 프리뷰 FaqSectionV2 전용(구형, 삭제 금지) / `titleRow`·`sectionTitle` = 넷 다 공유 |
| `BookSection.module.css` | BookSection, preview/BookSectionV2 | 실+프리뷰 선정도서. **주의**: V2는 이 파일(`bstyles`)과 `preview.module.css`(`styles`)를 둘 다 import — 명조 본문(bookQuote·bookParagraph·bookCuratorNote)은 preview.module.css의 **자체 사본**을 쓴다. 한쪽만 바꿀 땐 어느 모듈의 클래스인지 grep으로 먼저 확인 |
| `FeatureBoxSection.module.css` | FeatureBoxSection, preview/FeatureBoxSectionV2 | 실+프리뷰 모임소개 |
| `NavBar.module.css` | NavBar, preview/NavBarV2 | 실+프리뷰 내비 |
| `BrandCloseSection.module.css` | BrandCloseSection, preview/ClosingSectionV2 | 실+프리뷰 클로징 |
| `apply/page.module.css` · `apply/interview/written/page.module.css` · `apply/interview/schedule/page.module.css` | 실 apply 페이지 + preview/apply 대응 페이지 + **one-day-talk-01/apply/page.tsx(apply/page.module.css만)** | 신청·서면·전화 실+프리뷰 + 1회성 모임 (주의: `apply/interview/page.module.css`는 소비자 없는 고아 — 공유 아님) |
| `FifthSessionSection`의 module.css | **V2 없음** — 프리뷰 랜딩이 실사이트 컴포넌트를 직접 import | 수정 = 실사이트 즉시 변경. 시안 실험 시 이 파일 수정 금지, 쇼케이스 전용 CSS를 새로 만들 것 |
| `HowToSection`·`ScheduleSection`·`FeatureQuietSection`·`ClosingCtaSection` (실) ↔ `HowToSectionV2`·`ScheduleSectionV2`·`preview/FeatureQuietSection`·`ClosingSectionV2` (프리뷰) | **분리된 파일 쌍** (2026-07-06 배포) | 실·프리뷰가 같은 디자인의 **별도 사본** — 한쪽 수정 시 반드시 쌍도 같은 값으로 (TSX 쌍 동기화 원칙). CSS import 공유 없음. **ScheduleSection 캘린더는 사본이 하나 더**: `apply/ApplyCalendar.tsx/.module.css`(실·프리뷰 apply 공용, 2026-07-27) — 랜딩 캘린더 수정 시 3벌 동기화 |
| `lazyday/lounge-info/page.tsx` | **lazyday 밖** `(main)/lounge-info/page.module.css`를 import | 라운지 오시는길과 교차 |
| `preview/preview.module.css` | 프리뷰 트리 전역 허브 (10개 파일) | 수정 전 import grep 필수 |

새 클래스 추가는 안전. 기존 클래스 값 변경은 위 소비자 전부 확인 후에만.
**TSX 쌍 동기화**: `apply/**`의 실 TSX와 `preview/apply/**` TSX는 별도 파일 쌍 — 폼 필드·문구를 실사이트에서 직접 바꾸면 프리뷰 대응 TSX에도 같은 변경을 반영해 드리프트를 막는다.

## 5. 환경 함정 (원격 실행 환경)

- **Playwright**: `import('playwright')` 실패 시 `/opt/node22/lib/node_modules/playwright`, 브라우저 `/opt/pw-browsers/chromium`, `--no-sandbox` 필수. **외부 HTTPS 불가**(프록시 미설정) — localhost 전용. 배포 URL 검증은 `curl -c jar -b jar` 쿠키자로.
- **실제 WebKit(사파리 엔진) 검증 가능** (2026-08-15 신설): `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright@latest install webkit` → `apt-get update && npx playwright@latest install-deps webkit` (우분투 계열이라 됨). 드라이버는 **npx 로 받은 playwright-core** 를 쓴다 (`/opt/node22` 의 playwright 는 webkit 리비전이 달라 못 붙는다). ⚠ **웹킷 '흉내'로 검증하지 말 것** — 흉내가 틀린 가정 위에 서 있어 iOS 전용 결함 3건을 통과시킨 사고가 있었다(DECISIONS 2026-08-15). 웹킷 특이점: ① **경로 용량을 넘는 글자는 아예 렌더하지 않는다**(textPath 에 여러 벌을 이어 붙이고 음수 startOffset 으로 미는 기법이 성립하지 않음) ② `<text>`·`<textPath>` 의 `getComputedTextLength` 는 **둘 다 '경로에 실린 만큼'** ③ CSS 애니 리스타트 수법(`animation:none` 붙였다 떼기)이 안 먹는다. 헤드리스 웹킷은 소프트웨어 렌더라 프레임 시간(중앙 ~85ms)은 실기기 지표로 쓰지 말 것.
- **`getPointAtLength` 는 비싸다** — 421 세그먼트 경로에서 호출당 ~0.5ms. 글자마다 부르면 크롬이 8.8초 블록한다. 좁은 창만 훑을 것.
- **스크린샷은 `node scripts/shot.mjs`** 로 통일 (boilerplate 재작성 금지). `--eval`로 computed style 수치 검증 가능.
- **dev 서버는 턴 사이에 자주 죽는다**: `(npm run dev > /tmp/dev.log 2>&1 &)` 후 curl 200 폴링. `pkill` 후 exit 144는 무해.
- **`next-env.d.ts`**: dev 서버가 재생성 — **모든 커밋 전 `git checkout -- next-env.d.ts`**.
- **Vercel**: 프로젝트 `prj_iKxnwjdJoHtlXtEIBqxJ8uVjAmcy` / 팀 `team_Unc0jNsuK26xtE7mYRh09nRa`. 브랜치 별칭 `linky-lounge-homepage-git-<branch>-dmahns-projects.vercel.app`. 배포 보호 때문에 `mcp__Vercel__get_access_to_vercel_url`로 `_vercel_share` 토큰 발급 — **토큰은 배포 단위·~23h 만료, 새 푸시마다 재발급**, 운영자에게 만료 시각 명시.
- **배포 확인**: `mcp__Vercel__list_deployments`에서 SHA가 READY인지 (콘텐츠 grep 워처는 클라이언트 전용 문자열엔 부정확). 프로덕션은 `www.lazyday-bookclub.com`을 백그라운드 폴링 (~60초 내 반영).
- **sed 광역 치환 금지** — 과거 `font-weight` 전역 치환으로 무관한 5곳이 바뀐 사고. 반드시 고유 컨텍스트 포함 치환 or 라인 앵커.
- **GitHub**: `gh` CLI 없음 — `mcp__github__*` 도구 사용.
- **Vercel 유사 프로젝트 혼동 주의**: 같은 팀에 `linky-website`, `lounge-homepage-dev` 등 비슷한 이름이 여럿 — 반드시 `prj_iKxn...` 사용.
- **파일 일괄 삭제 전 참조 확인**: 과거 미사용 파일 정리 중 사용 중이던 JourneyStepper.tsx를 함께 삭제한 사고(`git checkout --`로 복구). rm 전 파일별 import grep.
- **JSX 래퍼 추가 직후 `npx tsc --noEmit`**: unclosed div(TS17008) 상태로 빌드하면 6분 타임아웃처럼 보인다 — tsc가 오래 걸리면 구문 에러부터 의심.
- **스크롤 최하단 ≠ 클로징 섹션 노출**: `SeasonCountCta`(기수 카운트)는 IntersectionObserver threshold .6 인데, `scrollTo(document.body.scrollHeight)` 로 내리면 브랜드 로고+푸터에 밀려 이 섹션이 **뷰포트 위로 빠져나간다**(390px 기준 rect.bottom ≈ −20). 발화 안 해서 "애니메이션이 없다"로 오진하기 쉽다 — 검증 시 `scrollIntoView` 로 **화면 중앙**에 맞출 것.
- **shot.mjs networkidle 멈춤**: 외부 스크립트(va.vercel-scripts.com, fbevents 등)가 프록시에서 pending으로 매달리면 `page.goto(networkidle)`이 30s 타임아웃 난다 — 서버는 정상(200)인데 캡처만 실패하면 이것부터 의심. 대처: waitUntil 'load' 폴백 스크립트로 캡처.

## 6. GAS (Google Apps Script) 계약

- **자동 배포 파이프라인 (2026-08-13 신설 — 절차서 `docs/gas-automation.md`)**: `scripts/gas-sync.mjs` + `.github/workflows/gas-deploy.yml` 이 Apps Script REST API 로 소스 반영·새 버전·**기존 배포 갱신**까지 한다. 설정(GitHub Secrets `GAS_SCRIPT_ID`/`GAS_REFRESH_TOKEN`/`GAS_WEBAPP_URL`)이 끝나면 **`gas/` 변경을 main 에 병합하는 것만으로 실반영**된다. 매핑은 `gas/project.json`, 매니페스트 미러는 `gas/appsscript.json`.
  - **설정 전에는 종전 수작업** — 운영자가 편집기에 붙여넣고 **"배포 관리 → 기존 배포 편집 → 새 버전"** (⚠️ '새 배포' 아님 — URL이 바뀌면 프론트가 끊긴다). 스크립트도 `deployments.create` 를 아예 구현하지 않아 같은 규율을 강제한다.
  - 대조·회수는 언제든 `node scripts/gas-sync.mjs check` / `pull`. Claude 는 Google 자격증명을 갖지 않는다 (Secrets 는 Actions 에만).
- ⚠️ **실배포본이 레포 미러보다 최신일 수 있다** — 이제 `check` 로 실측한다(주 1회 자동 점검도 있음). push 전 기준선 검사가 걸리면 **덮어쓰지 말고 `pull` 로 회수해 커밋**하는 게 먼저다. API 를 못 쓰는 상황이면 종전대로 운영자에게 배포본 원문을 받아 대조하거나, 바뀐 함수(예: handleApply)만 교체하도록 안내한다. (2026-08-13 실측 드리프트: 주석 2군데뿐, 기능 동일)
- 비밀값(ADMIN_TOKEN, SOLAPI_KEY/SEC)은 코드가 아닌 **스크립트 속성** — 레포 사본에 절대 하드코딩하지 않는다. (2026-07-13: `interview-booking.gs`의 구식 평문 키도 속성 방식으로 정리·솔라피 키 재발급 완료 — 새 코드에서 평문 패턴 금지)
- 신청 payload 계약 (`handleApply`): name/gender/age/phone/interviewType/greeting/instagram/referral/marketingConsent/**consentAt**(항상 — 필수 개인정보 동의 시각)/**preferredDays**(현재 `SHOW_PREFERRED_DAYS=false`로 빈 값)/**unavailableDays**('참여 불가 요일' 복수 선택 — 슬롯은 season-config `unavailableDaySlots`, 미선택 시 `"없음"`, 시트 헤더 '불가 요일'). **동의 분리(2026-07-27)**: 폼은 개인정보 수집·이용(필수, `privacyConsent`는 프론트 검증만 — payload 미전송)과 마케팅 수신(선택) 2박스. `marketingConsent`("동의"/"미동의")는 이제 **선택 마케팅 수신 동의**를 뜻함 — 시트 '마케팅 동의' 컬럼 재사용, GAS 무변경. 선택 동의를 필수화하거나 운영 연락(인터뷰 결과 등)을 마케팅 동의 조건으로 거는 것 금지(개인정보 보호법 제22조). 시트는 **헤더 이름 매핑** — 열 순서 무관, 새 필드는 `ensureColumn`으로 자동 생성. 헤더는 한국어 관례 ('희망 요일', '동의 시각' 패턴).
- 프론트 화면 변경은 GAS와 무관. GAS를 "건드려야 하나?"는 payload 계약이 바뀌었는지로 판단.
- **INTERVIEW_GAS_URL은 통합 스크립트(`gas/linkyincdev-main.gs`, 시트 바인딩) 배포를 가리킨다** — apply·oneday·notify·인터뷰·admin_block 전 계약이 통합본 하나에 있음. `gas/interview-booking.gs`는 레거시 미러(참고용) — 여기 고치면 실배포와 무관 (2026-07-29 오진 사례). admin 차단 관리가 "연동 안 됨"으로 보이면 **GAS 스크립트 속성 ADMIN_TOKEN ↔ Vercel ADMIN_SECRET 값 일치**부터 확인 (불일치 시 doGet이 id·title 없는 공개 응답으로 조용히 강등).
- **전화 인터뷰 미예약 24h 리마인드** (2026-08-12): `remindPendingInterviews`(10분 트리거, 핸들러가 **15:30~22:00 KST 창**만 처리) → 조건(`인터뷰 방식`=전화 AND `인터뷰 일시` 공란 AND `전화 인터뷰` 시트에 번호 없음 AND **신청 후 24~48h**(하한만 두면 지난 기수 미예약자가 전원 스윕 — 상한 48은 창 밖에서 24h를 넘긴 사람의 최악 픽업 지연 41.5h를 흡수하는 최소값) AND `리마인드 발송` 공란) 충족분을 찾아 **contact@linkylounge.com**(`DIGEST_EMAIL`, ADMIN_EMAIL 과 별개)로 카톡 초안 메일. 1회만 — `리마인드 발송` 칼럼(ensureColumn 자동 생성)에 타임스탬프. 이름·나이(20~55)·번호 자체 필터, 제외분은 메일 하단에 사유 표기 후 함께 플래그. ⚠️ **슬롯 규칙은 `apply/interview/schedule/page.tsx` 14~26행과 값이 같아야 한다**(평일 18–23·주말 13–23·30분·2h 유예) — 한쪽만 바꾸면 안내한 시간에 예약이 안 된다. ⚠️ **코드 배포는 자동**(gas/ 병합 → GAS 배포 워크플로)이지만 **트리거는 자동으로 안 생긴다** — Apps Script API 로 트리거를 만들 수 없어 시트 메뉴 "자동 리마인드 켜기"를 한 번 눌러야 등록된다(백업과 동일). 적용 절차: `docs/gas-interview-remind-setup.md`
- **폼 필드 추가 표준 절차**: ① 실 `apply/page.tsx` ② `preview/apply/page.tsx` (TSX 쌍 동기화) ③ `gas/linkyincdev-main.gs` handleApply: `ensureColumn('한국어 헤더')` + row 기록 + 관리자 메일 본문 ④ 시트 수동 컬럼 추가 불필요함을 안내 ⑤ 배포 — 자동 파이프라인 설정 후에는 `gas/` 변경을 병합하면 끝(Actions 결과 확인), 설정 전이면 운영자에게 handleApply 교체 + '배포 관리 → 새 버전' 안내. **⚠️ 순서: GAS 새 버전 완료 확인 후에 프론트 main 병합** — 뒤집히면 그 사이 제출분의 새 필드 값이 조용히 유실된다. 계약 변경이 크면 `gas/` 만 먼저 병합해 워크플로 성공을 확인한 뒤 프론트를 병합한다.

## 7. 운영자 커뮤니케이션 규약

- **언어**: 모든 보고는 한국어. 결론 먼저, 그다음 근거. UI 변경은 스크린샷 첨부 + 프리뷰 공유 링크(만료 시각 표기).
- **해석 규칙**:
  - 짧은 반말 지시가 기본이고 **오타가 잦다** ("날링 거야"="날릴 거야") — 문맥으로 복원해 해석하되, 화면에 들어갈 문구는 오타 교정본으로.
  - 짧고 모호한 공간 피드백("좁다", "여백")은 대상이 무엇인지가 관건 — 간격인지 컨테이너 폭인지, 마진인지 내부 패딩인지. **가장 그럴듯한 최소 해석으로 구현 → 스크린샷으로 확인**받는다. 물어보느라 멈추지 말 것.
  - 재해석 지시가 오면(이전 구현이 오해였다면) **이전 변경을 전부 깨끗이 철회한 뒤** 새 해석을 적용한다. 덧대기 금지.
  - **지시의 적용 범위는 직전 논의 대상으로 좁게** 해석한다 (폰트 지시를 전역 적용했다가 "책소개 섹션에 한해서 이야기한 거야"로 두 번 정정당한 사례). "그 외는 건들지 마"는 문자 그대로.
  - "~만", "~는 보류/유지/저장만"은 엄격한 범위 지시. 보류는 거절이 아니라 연기 — DECISIONS.md에 기록하고 새 지시 전까지 대기.
  - "바로 배포해" = 검증→커밋→푸시→PR→병합→프로덕션 확인까지 한 번에.
  - 여러 건 번호 목록으로 오면 각 항목을 개별 추적하고 응답에서도 번호로 대응.
  - 형식은 스펙으로 정확히 주되(`[3기 신청 (마감일까지 D-XX)]`) 단어 선택은 위임하는 경우가 있다 ("더 나은 표현 있으면 그걸로 바로 해") — 틀은 지키고 빈칸은 최선안으로 채운 뒤 근거를 밝힌다.
  - "참가비는 2기에서 20만원이었거든" 류의 **사실 진술 = 데이터/컨피그 정정 지시**로 받는다.
  - **브랜드 카피는 운영자 소유** — 장문 원고를 통째로 붙여넣어 준다. 임의 창작하지 말고 원문 그대로 반영(강조 마크업만 추가). 원고가 보류면 텍스트도 대기.
- **리디자인 요청은 "다양한 레퍼런스 기반 복수 안"을 뜻한다** — 현행과 비슷한 개선안 하나는 "지금이랑 똑같으면 의미가 없지"라는 질책을 받는다. 인터랙티브 시안 여러 개 + 레퍼런스 명시 + 추천 1개.
- **결정은 즉시 `docs/DECISIONS.md`에 기록** (append, 최신 위). 세션이 끝나도 다음 세션이 이어받도록.
- 제안할 때는 선택지 2~3개 + 명확한 추천 1개 + 근거. 운영자는 표·짧은 근거를 선호한다.

## 8. 이 문서의 유지보수

- 새 함정 발견 → §5에 추가. 새 공유 파일 → §4에 추가. 운영자 결정 → `docs/DECISIONS.md` (병합과 같은 커밋에).
- **기수 전환 시**: season-config.ts 수정 + 이 문서와 DECISIONS.md의 기수 표기(현 **4기 모집(open), 기간 9/7–11/1, 마감 9/7 — showDeadline=false로 비표기(경과 시 자동 마감)**, 요일 수→일→화·일요일 오전·오후 2슬롯) 일괄 갱신.
- 낡은 사실(기수 전환, 색 변경 등)은 발견 즉시 수정. 이 문서가 틀리면 다음 세션 전체가 틀린다.

## 9. 전면 대개편 (docs/redesign/)

> 원문: `docs/redesign/06-claude-md-patch.md` (2026-08-03 부트스트랩 커밋, 2026-08-04 v3 개정 반영). 개편 범위에서 기존 규칙과 충돌 시 본 절이 우선한다.
> 원문 대비 현행화 2곳: ① 로고 색 교체 서술 → **보류** 반영 (01 최신 결정 우선) ② 모션 절 "(확정 후)" → 확정 완료 반영.

- **v3 (2026-08-04)**: docs/redesign/ 문서군은 v3(워크룸 이식판)이며, 03 v2의 좌축+오프셋 레이아웃 서술은 실효 없음
- 프리뷰 라우트 기준: `preview/lazyclub-4b073000ddec094f` (구 `home-v3-workroom` — 실도메인 공유용 난수 슬러그로 개명, 2026-08-04. 기존 home-v3 트리가 있으면 보존)
- 수치 우선순위: 08 실측값 > 02 규율 > 기존 §3 (충돌 시 상위 우선)
- 범위: 신규 홈(허브), 일회성 모임 목록·상세, `preview/home-v3/` 이하 프리뷰 트리.
  기수제 상세·신청·GAS는 종전 규칙 유지
- 세션 시작 시 `docs/redesign/README.md`와 `01-decisions.md` 필독
- 디자인 기준: 02(토큰)·03(레이아웃)·04(레퍼런스)가 §3(콰이어트 문법)을 대체.
  §3의 다음 조항은 개편 범위에 적용하지 않음:
  검증 뷰포트 390px 단일 → 390/768/1280 3종,
  모션 "섹션당 제목 1개" 제한 → 02 모션 절(확정) 따름,
  기존 UI 문법 재사용 의무 → 제로베이스 신규 구현
- 유지되는 기존 철칙: 프리뷰 퍼스트, 승인 게이트, 증거 기반 완료(shot.mjs — 단 3뷰포트),
  범위 절제, 공유 CSS 확인, DECISIONS 기록
- 신규 구현 원칙:
  * 장식 도형 기본 0개. 조판(축·스케일·간격)으로만 구성. 블롭 금지
  * 정적 골격 승인 전 모션 구현 금지 (2층 순서 강제)
  * 신규 CSS는 기존 .module.css를 import하지 않는다 (공유 CSS 지도 오염 방지)
  * season-config.ts 등 데이터 단일 출처는 계승. 일회성 모임은 one-day-config.ts 신설
- 로고 (**종결 — 추가 로고 작업 금지**, 2026-08-03): 벡터 마스터
  `public/assets/logo/lazyday_logo.svg` (운영자 제공 — 정본 호 6종 내장,
  3색 #F59936/#95AC9A/#7D5456, 카운터 evenodd 투명) + 마스터 파생
  `logo-mono-ink.svg`(#1c1814)·`logo-mono-cream.svg`(#F5F0E6).
  **사용 규칙: 화면 노출 = mono-ink / 색면 위 = mono-cream / 파비콘·OG = 원본 풀컬러 / 개편 홈(v3)은 원본 풀컬러 (운영자 2026-08-04).**
  리컬러 없음(`logo-color*` 폐기), 원본·파생 임의 색 교체 금지. (구 래스터
  `linky-lounge/book-club/lazyday_logo.png`는 기존 화면이 계속 사용 — 교체는 별도 지시 시)
