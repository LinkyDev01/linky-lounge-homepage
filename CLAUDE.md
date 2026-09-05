# CLAUDE.md — linky-lounge-homepage AI 작업 가이드

**링키라운지**(linkylounge.com) + **레이지클럽**(lazy-club.com) ⊃ **레이지데이 북클럽**(lazyday-bookclub.com).
Next.js 16 App Router · CSS Modules · TypeScript · Vercel. **브랜드 위계: 레이지클럽이 상위, 북클럽은 그 안의 프로그램 하나**(운영자 2026-09-02) — 트래픽은 아직 북클럽이 크지만 회원·관리·인증 등 **장기 관리 단위의 이름·도메인·설명은 레이지클럽 기준**. 코드 트리 `app/(main)/lazyday/**` 가 북클럽 도메인의 본체인 것은 그대로다.
linkylounge.com 쪽은 명시 지시 없이 수정 금지 (§4 lounge-info 교차만 주의).

**세션 시작 시 반드시**: ① 이 문서 ② `docs/DECISIONS.md`(운영자 결정 로그). 북클럽 브랜드 철학·디자인 근거는 `docs/brand/lazyday/`(philosophy·design-system) — 이 문서와 충돌 시 이 문서 우선. 보류 항목을 새 지시 없이 부활시키거나 확정 결정을 임의 번복하지 않는다.

**진행 중 계획**: `docs/handoff/2026-09-02-dashboard-to-next-session.md`(**세션 인수인계 — 먼저 읽는다**: 현재 상태·다음 할 일 순서·운영자 대기) · `docs/admin-crm/02-build-plan.md`(대시보드 PR 순서표) · `docs/plans/2026-09-01-applications-ledger-and-members.md` — 접수 시트+DB 이중화 · 회원(profiles·소셜 로그인) · DB 관리 화면 (P0~P5, 단계별 독립 PR). 이 범위의 작업은 그 문서를 먼저 읽는다. · `docs/plans/2026-09-03-host-recruitment-page.md` — 모임장 모집(lazy-club.com `/hosts`) + 북클럽 원형 모임 페이지(`/meetings/lazyday-bookclub`) 기획 v3 — **레이지클럽은 모임장이 자기 모임을 직접 기획해 가져오고 협의로 확정하는 구조. 페이 미고지. 레퍼런스 참고 안 함**(운영자 2026-09-03). **안내 페이지+접수란 승인·병합됨**(운영자 2026-09-03 "승인할게") `app/(main)/lazyclub/hosts/`(lazy-club.com `/hosts` index·사이트맵, kind `host`·GAS `handleHost`, 방침 제1조 5호·제2조 6목·제3조 5호). **진입 링크(내비·푸터·사람 페이지)는 아직 없음 — 별도 결정**. **v2 승인·교체됨(2026-09-05)**: `/hosts` 안내(포스터 스트립·세 단락·절차) + `/hosts/apply` 여섯 걸음 기획서(noindex, `HostPlanFlow`). 문체 원칙: 주어 '저희', 말하듯 쓴 제목, 동사가 있는 문장. ⚠ 북클럽 철학 4축·**'문학과 철학' 범위·브랜드 3문단은 전부 북클럽 것** — 레이지클럽 페이지에 쓰지 않는다(운영자 2026-09-03). 레이지클럽 카피 재료는 **트리에 있는 마케팅 문구만**(브랜드 문장·원데이 토크 설명·홈 도록체 캡션·랜딩 키워드) — 새 은유·새 어휘 금지, **짧게 끊어 단정하는 문장 금지**(원고처럼 길게 이어지다 초대로 맺는 호흡), **북클럽은 언급만 하고 소개하지 않으며 모임의 소재(책·영화)를 페이지가 정해 두지 않는다**, 4권의 책 틀 없음(운영자 2026-09-03, DECISIONS 3·4차 행). 병합 전 방침 개정 선행. 나머지 결정은 계획서 §9·§12.

**브랜드·디자인·페이지 정의서**: `docs/brand/`(01 철학 · 02 디자인 시스템 · 03 페이지) — 새 화면·카피·페이지 작업 전에 읽는다. 규칙 정본은 여전히 이 문서·DECISIONS·docs/redesign 이고, 정의서는 그 '왜'를 묶은 것.

**명령어**: dev `npm run dev` · `npx tsc --noEmit` · `npm run build` · `npm run lint`. 테스트 스위트 없음 — 검증은 tsc + `scripts/shot.mjs` + 배포 curl 마커.
**GitHub**: `LinkyDev01/linky-lounge-homepage` (mcp__github). 브랜치는 main 분기, `claude/<주제>`.

---

## 1. 다섯 가지 철칙

1. **프리뷰 퍼스트.** 새 UI·리디자인은 `/lazyday/preview` 에 먼저 구현해 승인받고 실사이트로 이식한다. 프리뷰가 원본 — 이식본은 픽셀 동일, 이식하며 "개선" 금지 (절차: `lazyday-preview-migrate` 스킬).
   - **예외**: 실사이트 기존 요소의 직접 값 조정 지시(패딩·크기 트윅)는 바로 수정 — §4 소비자 확인 + 전/후 스크린샷.
   - **"리디자인해줘" = 복수 시안.** 레퍼런스 기반 3~5개를 인터랙티브 전환으로 비교시킨다 (선례: `preview/faq-designs`). 단, **배치·맥락이 쟁점인 시안은 쇼케이스 금지 — 프리뷰 랜딩 실배치 + 스위처**로 보여준다 (선례: IntroRuleLab, 2026-08-24 — 가짜 밴드 쇼케이스로 라운드 3개를 낭비한 교훈).
2. **승인 게이트.** 상시 배포 승인 (운영자 "반영하면 배포해", 2026-07-24): 지시 반영 변경은 검증 후 곧바로 병합·프로덕션 확인. 단 시안 검토가 필요한 신규 디자인은 프리뷰 승인 후 병합. 병합된 PR 재사용 불가 — 매번 새 PR.
3. **증거 기반 완료.** UI 변경은 스크린샷으로 직접 확인 전까지 미완료. 배포 후 실제 도메인 확인(deploy 스킬 §5). "됐을 것" 추정 금지.
4. **범위 절제.** 지목된 것만. 보류 항목이 실사이트로 새면 안 된다. 요청 안 된 리팩토링·정리 금지.
5. **공유 리소스 확인.** `.module.css` 수정 전 소비자 grep(§4). 공유 파일은 클래스 **추가** 방식 우선, 기존 클래스 수정 시 모든 소비자 화면을 각각 캡처해 확인 후 완료 선언.

## 2. 프로젝트 지도

- **레이지클럽** `app/(main)/lazyclub/**` (2026-08-21 프리뷰 졸업). `base-path.ts` 의 `BASE="/lazyclub"`, 홈 `HOME="/lazyclub/all"` (⚠ 트리 루트 아님 — 루트는 랜딩 coming-soon 과 겹침). lazy-club.com 은 이 트리가 도메인 루트(미들웨어 rewrite), 북클럽 도메인에선 `/lazyclub/*`(noindex, 운영자 검토용). 슬러그 = 내비 라벨 영문 대응(all·meetings·products·people·schedule·records) — **URL 규율은 `docs/url-policy.md` 정본**, 슬러그 신설·변경 전 필독. ⚠ 내부 링크는 `LazyclubLink`(`LazydayLink` 아님). ⚠ `lib/order-catalog.ts` 가 `lazyclub/goods-config` import (프로덕션 결제 — §4 데이터 지도).
- **도메인**: lazyday-bookclub.com → 미들웨어가 `/lazyday/*` rewrite. `linkylounge.com/lazyday/*` 는 301. `/lazyday/admin*` 은 `lazyday_admin` 쿠키 — **서명 토큰**(`lib/admin-session.ts`, who·만료 7일, HMAC=ADMIN_SECRET; 2026-09-02). 시크릿 원문은 브라우저에 없다. 목 검증용 토큰은 `ADMIN_SECRET=devsecret npx tsx scripts/admin-token-test.mjs --mint`. **관리 화면은 `admin.lazy-club.com/admin/*` 전용**(운영자 2026-09-02, 내부 트리는 `/lazyday/admin/*` 그대로 rewrite). `/admin` = 대시보드 홈(`AdminShell` 내비 6: 홈·고객·접수·주문·일정·도구), 차단 달력은 `/admin/schedule`, 고객은 `/admin/customers[/키]`. 새 관리 화면은 `admin/crm.module.css` 토큰(§9)만 쓴다 — 손님 도메인 3종의 `/admin*` 은 그리로 **307**, 관리 호스트는 관리 트리 외 전부 404. 쿠키가 host-only 라 관리 호스트에서 1회 로그인. **관리자 로그인 = 소셜 계정(카카오·구글) + `ADMIN_EMAILS` 허용 목록**(2026-09-02) — 비밀번호 경로는 `ADMIN_PASSWORD` env 가 있는 동안만. 관리 호스트 콜백 `https://admin.lazy-club.com/api/auth/callback` 이 Supabase Redirect URLs 에 있어야 한다. 프리뷰(vercel.app)·localhost 는 `/admin/*`·`/lazyday/admin/*` 둘 다 열린다. 도메인 역할표는 `lib/site.ts`. `/api/*` 는 미들웨어 밖이라 관리 API·GAS `SITE_URL`(북클럽) 무변경.
- **히어로** = `HeroBreathingPoster`(모션, HeroParallax 가 렌더, `useChromeIntro.HOLD_ENABLED=true`). 진입 안무: 포스터만 → 그어짐 끝 무렵 내비·푸터·본문 → +3초 스티키 CTA. 검수대 `preview/hero-check`. 포스터 내부 작업은 `docs/env-notes.md` 필독.
- **실사이트 랜딩** `app/(main)/lazyday/page.tsx`: 전체가 `LandingShell`(내비+푸터, landing-shell.module.css, 데스크톱 확장은 `--lz-*` 변수 주입) 안. 내비 탭 5개: 함께 읽는 책·모임소개·진행방식·일정·장소·후기·FAQ. **섹션 순서·배경 (2026-08-24 재배열, 7섹션 완전 교차)**: Hero(+HeroSummary) → 함께 읽는 책(B) → 모임소개(A, FeatureQuietSection) → **진행 방식(B, ProcessSection — 01 자기소개(규칙 원문 모달)·02 오프닝/질문(레이지 노트 4장 모달, 후기 모달과 동일 UI — 단일 이미지는 넘김 없음)·03 서로의 페이지·04 마무리)** → 일정·장소(A) → 후기(B, ReviewsSection 캐러셀+핀치줌 모달) → FAQ(A) → 클로징(B). **섹션 제목 서식은 전 섹션 '함께 읽는 책' 기준 통일(2026-08-24)** — 32px/800 좌정렬 + 주황 괘선 56×1.5, ≤480px 26px.
- **고아 보존**(렌더 안 함 — 삭제 금지): About·Closing·Rules·Vibe·FeatureBoxSection·FifthSessionSection·HowToSection·HowToBrief·NavBar·BrandCloseSection + 프리뷰 쪽 NavBarV2·Footer·HowToSectionV2·ClosingSectionV2·구 preview/ReviewsSection.
- **프리뷰 트리** `app/(main)/lazyday/preview/`: noindex + PreviewBar + 자체 폰트 로드(layout.tsx). **2026-08-24 재동기화** — 셸·진행방식·후기·클로징은 실사이트 컴포넌트를 **직접 import**(LandingShell·HeroParallax·ProcessSection·ReviewsSection·SeasonCountCta+BrandCloseV2). **분리 사본 쌍은 Schedule·모임소개(FeatureQuietSection) 둘뿐** — 한쪽 수정 시 쌍도 같은 값으로. 프리뷰 3개 CSS(`preview.module.css`·`ScheduleSectionV2.module.css`·`preview/FeatureQuietSection.module.css`)는 `--lz-*` 변수를 실사이트와 동일 소비 — **`--lz-*` 변수 추가·변경 시 이 3개 파일도 확인**(안 하면 프리뷰만 데스크톱 확장에서 빠진다). 배경 교차도 실사이트와 동일. 예외: `ScenesSection`(프리뷰 전용 보류, A)이 후기(B)와 FAQ(A) 사이 — 2색 교차에 홀수 삽입이라 완전 해소 불가, Scenes-FAQ A-A 인접만 용인(이식 시 재검토).
- **단일 출처 컨피그**: `season-config.ts`(기수·기간·마감·가격·회차·장소 — **기수 전환은 이 파일만**) · `book-config.ts`(기수별 책 4권) · `philosophy-content.tsx`(확정 원고) · `preview/preview-config.ts`(파생) · `one-day-talk-01/oneday-shared.ts`(원데이 일정·가격·orderId 계약 — confirm 이 금액 재검증하므로 §4 데이터 지도 참조).

## 3. 디자인 시스템 (레이지데이)

> 근거·실측값·전체 지도는 `docs/brand/lazyday/design-system.md`. 여기는 매 세션 지킬 압축 규칙만.

**팔레트** — 이 색만. 새 색은 운영자 승인.

| 역할 | 값 |
|---|---|
| 섹션 배경 A (밝은 오트) | `#f7f3ee` |
| 섹션 배경 B (짙은 오트) | `#f0e9e0` |
| 브랜드 주황 (CTA·활성·강조) | `#d2691e` / hover `#b8571a` / active `#a04d16` |
| 잉크 (제목) | `#1a1208` |
| 본문 다크브라운 | `#4a3020` |
| 보조 텍스트 | `#8a6a50` · `#8a7660` · `#a08b70` (옅어지는 순) |
| 각주 | `#9a9590` 11px |
| 카드 배경 | `#fffdf8` (보더 `#eee2d0`/`#e5d9c8`) |
| 괘선 | titleRow::after `rgba(210,105,30,.6)` 56×1.5px / FAQ 라인 `rgba(74,58,42,.18)` |

**규칙**
- **섹션 배경 A/B 교차 필수.** 순서 변경 시 배경 재배정으로 교차 유지 (fade·moreHint 배경은 섹션 배경과 동기화). 이식으로 교차가 깨지면 임의로 바꾸지 말고 선택지와 함께 보고.
- **섹션은 여백 없이 이어 붙인다** (margin 금지) — 숨구멍은 내부 하단 패딩으로.
- **폰트**: 기본 SUIT. 책 본문만 Noto Serif KR 500 13px/1.85. 책 제목만 Pretendard Variable 700 italic 19px. 세리프 확장은 운영자 확인.
- **타이포**: 본문 line-height 1.85 · 13~15.5px 위계 · `word-break: keep-all` + `text-wrap: pretty`. **섹션 제목 = 32px/800 좌정렬 + 주황 괘선 (≤480px 26px)** — '함께 읽는 책' 기준 전 섹션 통일.
- **UI 문법 재사용** (새로 발명 금지): 캐러셀(`BookSection.module.css` `.bookCarousel`~`.bookDots` — center snap + 슬리버 + 비활성 dim/scale/blur) · 세그먼트(`.seasonSeg` 주황 썸) · 접힘은 FAQ 미니멀 라인(`line*`, 괘선+`+`45°+grid-rows) 또는 FeatureBox 페이드+더보기 — 둘을 섞지 말 것 · 스텝퍼(JourneyStepper).
- **모션**: 등장 리빌은 섹션당 제목 1개 · y12 · 0.9s cubic-bezier(0.22,1,0.36,1), 본문은 정적. FadeUp 기본값(y24·0.6s)은 타 페이지용 — 수정 금지, lazyday 에선 명시 주입.
- **검증 뷰포트 390px** (모바일 퍼스트).

## 4. ⚠️ 공유 CSS·데이터 지도 (수정 전 필독)

| 파일 | 소비자 | 주의 |
|---|---|---|
| `page.module.css` (lazyday 루트) | page·HeroParallax·sticky-apply-button·apply-button·preview/page·StickyApplyButtonV2 (6곳) | 실+프리뷰 동시 |
| `FaqSection.module.css` | FaqSection·FaqSectionV2·ReviewsSection (+고아 preview/ReviewsSection 이 import) | 파티션: `line*`=실 FAQ / `.answer`·`.peek*`·`.fade*`·`.moreHint`=FaqSectionV2 전용(삭제 금지) / `titleRow`·`sectionTitle`=공유 |
| `BookSection.module.css` | BookSection·BookSectionV2 | V2 는 이 파일+`preview.module.css` 둘 다 import — 명조 본문은 preview 쪽 자체 사본. 수정 전 어느 모듈 클래스인지 grep |
| `FeatureBoxSection.module.css` | FeatureBoxSection·V2 (둘 다 고아) | — |
| `apply/**` 3종 page.module.css | 실 apply + preview/apply + one-day-talk-01/apply | `apply/interview/page.module.css` 는 소비자 없는 고아 |
| `LandingShell`·`ProcessSection`·`ReviewsSection`·`SeasonCountCta`·`FifthSessionSection` 의 module.css | **V2 없음 — 프리뷰가 직접 import** | 수정 = 실+프리뷰 동시. 시안 실험 시 이 파일 수정 금지, 쇼케이스 전용 CSS 신설 |
| `ScheduleSection`·`FeatureQuietSection` ↔ `ScheduleSectionV2`·`preview/FeatureQuietSection` | **분리 사본 쌍** | 한쪽 수정 시 쌍도 같은 값. 캘린더는 사본 하나 더: `apply/ApplyCalendar` — 3벌 동기화 |
| `lazyday/lounge-info/page.tsx` | lazyday 밖 `(main)/lounge-info/page.module.css` import | 라운지 오시는길과 교차 |
| `preview/preview.module.css` | 프리뷰 트리 허브 (10개 파일) | 수정 전 import grep |

| `lib/applications.ts` | 접수 라우트 4개 공유 (P2 에서 3개 더) | `classifyApply`(GAS type 화이트리스트와 값 집합 일치)·`recordSafe`(유령행 차단 규율). GAS `doPost` 분기를 고치면 여기도 같이 |
| `admin/applications` (화면+CSS) | **레이지클럽 베이스** (운영자 2026-09-01 "조회화면은 레이지클럽 베이스로") | §3 팔레트가 아니라 §9 개편 문법 — 백지+잉크·13.2px/1.5·괘선 리스트·**텍스트 링크만(보더 버튼·유채색 UI 0)**. §9 대로 기존 `.module.css` 를 import 하지 않고 토큰을 자체 선언한다 |
| `app/api/lazyday/admin/backfill-applications` | GAS 스윕 전용 (P2.5) | 인증은 **헤더 `X-Backfill-Token`**(쿠키 아님 — 부르는 쪽이 Apps Script 서버다). ⚠ 원장이 꺼져 있으면 **503 을 돌려줘야 한다** — 200 을 주면 GAS 가 '보정됨'을 찍고 그 행을 영영 안 보낸다 |
| `applications` 테이블 | 전 접수 원장 (0005) | **0012 시트 거울 4컬럼**(`sheet_progress`·`sheet_interview_status`·`sheet_interview_type`·`sheet_synced_at`)은 GAS 스윕만 쓴다 — 관리 화면·라우트가 쓰면 안 된다(정본은 시트, `status` 도 P5 전엔 스윕이 번역해 넣는 읽기값). `purge_after` NOT NULL — 산출 못 하면 접수+1년 폴백. `sid`·`dedup_key` 는 **컬럼 unique**(부분 인덱스 금지, 42P10). ⚠ **개인정보가 들어갈 수 있는 컬럼을 추가하면 파기 함수 2종**(`purge_expired_applications`·`purge_application`)**도 같은 PR 에서 고친다** — 0008 이 `triage_note` 를 함수보다 나중에 만들어 **파기해도 메모만 남았다**(2026-09-02 발견, 0010 로 수정) |
| `customer_activities` 테이블 (0013) | 고객 레코드 화면(메모·통화·문자)만 | **고객 표가 아니다** — 사람은 여전히 파생이고 `person_key` 는 `lib/customers.ts` 의 묶음 키다. 키 규칙의 정본은 **`appPersonKey()` 하나** (활동 기록과 단건 파기가 같은 값을 만들어야 한다 — SQL 에 다시 적지 않는다). ⚠ **`purge_application` 은 `(uuid, text)` 2인자다** — 옛 1인자 함수는 drop 됐다(오버로드로 남기면 라우트가 옛 시그니처를 불러 활동이 에러 없이 안 지워진다). 파기 라우트는 **이름·전화가 비워지기 전에** 키를 읽어 넘겨야 한다 |
| `applications.triage` (0008·0009) | admin 화면이 유일한 소비자 | **파기가 아니라 열람 표시**. ⚠ 두 종류다 — **빼는 표시**(test·typo·dummy·duplicate)만 기본 목록에서 빠지고 **`paid`(기결제자)는 표시만 하고 남는다**(운영자 2026-09-01 "기결제자는 물론 기본제외대상이 아니지"). 어느 쪽인지는 라우트의 `HIDDEN` 배열이 정한다 — DB 는 형태만 본다. 기본 목록 = `triage is null or triage not in (HIDDEN)`, `?triaged=1` 로 빼둔 것만 꺼내 본다. ⚠ **진행 상태(status)와 섞지 말 것** — 그 정본은 시트, 여는 건 P5 |

새 클래스 추가는 안전. **TSX 쌍 동기화**: `apply/**` 실↔프리뷰 TSX 는 별도 쌍 — 폼 필드·문구 변경 시 양쪽 반영.

**공유 데이터 — 프리뷰/레이지클럽 경로가 프로덕션 결제를 좌우한다**: `lazyclub/goods-config.ts` 와 `one-day-talk-01/oneday-shared.ts` 의 가격·slug·status 는 `lib/order-catalog.ts` → `/api/lazyday/payment/confirm` 이 **결제 승인 금액을 재계산하는 근거**다(주문 DB 없음 — 카탈로그가 과거 주문의 금액 근거). 가격 변경은 ① 진행 중 결제 없는 시각에 ② DECISIONS 에 전/후 값·시각 기록 후. (설계: `/lazyday/preview/commerce-journey`)

**Supabase 는 실배선 상태다** (2026-08-18 주문 원장 시공 — 구 "미배선 초안 3종"은 그때 삭제됨). 정본 절차 `supabase/README.md` · 규칙층 R1~R13/ERD v3 는 `/lazyday/preview/commerce-journey`. 테이블: orders 4종(원장) + funnel_events(퍼널 계측, 2026-08-26). 클라이언트는 `lib/supabase-server.ts`(service_role, 서버 전용) 하나 — RLS 전면 거부라 브라우저용을 만들지 않는다. ⚠ Vercel env(SUPABASE_URL·SERVICE_ROLE_KEY) 미설정이면 조용히 꺼짐 — `/lazyday/admin/status` 의 ledger 체크로 확인.

## 5. 환경 함정 (원격 실행 환경)

- **Playwright**: `/opt/node22/lib/node_modules/playwright`, 브라우저 `/opt/pw-browsers/chromium`, `--no-sandbox`. 외부 HTTPS 는 프록시 경유 — 배포 URL 검증은 `curl -c jar -b jar`.
- **브라우저에서 외부 SDK 를 실제로 띄워야 할 때** (결제창 등): 세 가지가 동시에 막힌다 — ① Playwright 는 `HTTPS_PROXY` 를 **자동으로 타지 않는다**(외부 스크립트가 안 뜬다) ② `chromium.launch({proxy})` 로 붙이면 **localhost 까지 프록시로 나가** dev 서버에 못 붙는다(`bypass` 옵션도 안 먹었다) ③ 프로덕션 HTTPS 에 직접 붙는 것도 Chromium 이 MITM CA 를 안 믿어 `ERR_CONNECTION_RESET`. **해법은 브라우저에 프록시를 걸지 않고 `ctx.route('**')` 로 외부 호스트 요청만 Node fetch 로 중계**(`NODE_USE_ENV_PROXY=1` 이면 Node 가 프록시를 탄다) — TLS 검증을 끄지 않고 localhost + 외부 SDK 를 동시에 쓰는 유일한 조합. 구현본 `scripts/pay-e2e.mjs`(2026-08-31 결제창 검증에 실사용, 외부 91건 중계 성공). ⚠ "프록시가 CDN 을 막는다"는 그동안의 진단은 틀렸다 — `curl https://cdn.portone.io/...` 는 200 이다.
- **Vercel env 의 Type 은 `Config` 여야 한다 — `Secret` 이면 `NEXT_PUBLIC_*` 이 끝내 안 박힌다**(빌드 타임에 값이 노출되지 않는다). 캐시를 꺼도 새 커밋을 밀어도 소용없으니, `||""` 참조가 계속 남으면 **캐시가 아니라 Type 을 먼저 의심할 것**(2026-08-31 실측 — 캐시 원인으로 오진해 재빌드를 두 번 낭비했다). 공개키·`NEXT_PUBLIC_ACTIVE_PG`=Config / API·웹훅 시크릿=Secret.
- **Vercel 의 Redeploy 는 빌드 캐시를 재사용한다** — env 를 넣고 Redeploy 만 누르면 `NEXT_PUBLIC_*` 이 **반영되지 않는다**(2026-08-31 실측: 청크가 바이트 단위로 동일). 새 커밋을 푸시하거나 'Use existing Build Cache' 를 꺼야 한다. 서버 전용 env(시크릿·`ACTIVE_PG`)는 런타임에 읽으므로 재배포만으로 즉시 반영된다 — 둘을 헷갈리지 말 것.
- **토스 결제가 "업체 사정으로 인해 결제를 일시 중지하였습니다"로 거부되면 키가 아니라 MID 를 의심할 것** — 토스 상점관리자 '결제 UI 설정'의 이용서비스가 **계약 안 된 MID** 로 잡혀 있으면 라이브 키가 멀쩡해도 거부된다(같은 clientKey 라도 variantKey 가 가리키는 MID 가 결제 가능 여부를 가른다). 2026-09-01 실측 — 계약 미완료로 오진해 링크페이 복구까지 한 바퀴 돌았다. 결제가 막히면 `MEETING_PAY_ROUTE="linkpay"` 한 줄로 모임 결제를 즉시 되살릴 수 있다(제품은 링크페이 상품이 없어 못 판다).
- **`NEXT_PUBLIC_*` 설정 여부는 프로덕션 번들로 확인한다**: Next 는 **설정된** 값만 리터럴로 인라인하고, 미설정은 `t.default.env.NEXT_PUBLIC_X||""` 참조로 남긴다. 청크를 받아 grep 하면 Vercel 콘솔 없이 주입 여부를 판정할 수 있다 (2026-08-31 포트원 공개키 미설정 확인).
- **스크린샷은 `node scripts/shot.mjs`** (boilerplate 재작성 금지, `--eval` 로 수치 검증). **networkidle 멈춤**: 외부 스크립트가 프록시에서 매달리면 30s 타임아웃 — waitUntil 'load' 폴백. 레이지클럽 트리는 폰트 요청까지 매달리므로 `ctx.route(외부, abort)` 로 끊고 캡처.
- **dev 서버는 턴 사이 자주 죽는다**: 백그라운드 재기동 후 curl 200 폴링. pkill 후 exit 144 무해.
- **`useSearchParams()` 는 `<Suspense>` 안에서만** — 클라이언트 페이지에서 그냥 쓰면 로컬 dev 는 멀쩡한데 **프리렌더에서 빌드가 깨진다**(`missing-suspense-with-csr-bailout`, 2026-09-02 Vercel ERROR 실측 — 프리뷰 레이아웃이 `headers()` 를 써도 페이지는 정적 생성 대상). 기본 export 가 `<Suspense fallback={null}><Inner/></Suspense>` 로 감싸고 Inner 에서 읽을 것. **푸시 전 `npm run build`** 가 이걸 잡는다 — tsc 는 못 잡는다.
- **`next-env.d.ts`**: 커밋 전 항상 `git checkout -- next-env.d.ts`.
- **패키지 매니저는 npm 하나다 — `pnpm-lock.yaml` 을 되살리지 말 것.** Vercel 은 `packageManager` 필드가 없으면 **락파일을 보고 매니저를 고르고 pnpm 이 npm 보다 우선**한다. 2026-08-26 에 96바이트짜리 빈 `pnpm-lock.yaml` 스텁이 무관한 PR(#500)에 딸려 들어왔고, 그때부터 프로덕션 빌드가 **pnpm@10 으로 설치**되고 있었다(2026-09-02 빌드 로그 실측: `Detected pnpm-lock.yaml 9` → `Done in 11.7s using pnpm v10.28.0`). 그 스텁엔 패키지 목록이 없어 **매 빌드가 `package.json` 범위에서 새로 해석**했다 — 즉 **락이 아무것도 고정하지 않았고** 진짜 락파일(`package-lock.json` 154KB)은 무시됐다. 로컬(`npm ci`)과 프로덕션이 다른 버전으로 갈릴 수 있는 상태. 지웠으니 npm 으로 돌아온다. pnpm 으로 옮길 거라면 **빈 스텁이 아니라 진짜 락파일을 만들고 `package-lock.json` 을 지우는 별건 작업**으로.
- **Vercel**: 프로젝트 `prj_iKxnwjdJoHtlXtEIBqxJ8uVjAmcy` / 팀 `team_Unc0jNsuK26xtE7mYRh09nRa` (유사 이름 프로젝트 다수 — 반드시 이 ID). 공유는 `get_access_to_vercel_url` 로 `_vercel_share` 토큰 — **배포 단위·~23h 만료, 새 푸시마다 재발급**, 만료 시각 명시. 배포 확인은 `list_deployments` READY + 프로덕션 `www.lazyday-bookclub.com` 폴링.
- **이미지 최적화 꺼짐**(`unoptimized: true` — 운영자 확인 없이 끄지 말 것): 소스 파일 크기 = 전송량. 새 이미지는 **최대 노출 크기 ×2 로 미리 축소해 커밋**, 모달용 원본과 카드용 축소본은 별도 파일(`review-0N-card.webp` 선례).
- **fixed/오버레이 요소를 새로 놓기 전 기존 fixed 지도 확인** — 헤더(top:0)·SectionIndicator(우측 도트)·스티키 CTA·PreviewBar(좌측). 겹침 사고 2회 선례(2026-08-24).
- **GAS 는 실패도 `200 + {success:false}` 로 준다** — 화이트리스트 밖 type·필수항목 누락·슬롯 중복이 전부 이 모양이다. 원장에 기록할 때는 반드시 `data?.success !== false` 로 거를 것(`recordSafe` 가 강제). 안 거르면 **시트에 없는 유령 행**이 쌓여 P2.5 대조가 통째로 무의미해진다. 판정은 `lib/gas.ts` 의 **`isGasRejected()` 하나로 통일** — 응답 판정(라우트)과 기록 판정(`recordSafe`)이 같은 함수를 쓴다. ⚠ **거절이면 손님에게도 `{success:false}` 를 돌려주고 `markSubmitted` 도 부르지 않는다**(2026-09-01 수정) — 폼 5개는 이미 `!res.ok || !result?.success` 로 판정해 구제 화면을 띄운다. ✔ **접수 라우트 4개 전부 적용됨**(2026-09-01, P2) — `written`·`review` 의 catch 삼킴도 제거했다. 순서가 규율이다: **기록 먼저(DB 가 유일한 흔적), 응답 나중(사실대로)**. ⚠ `review` 는 GAS 프로젝트가 별도(`REVIEW_GAS_URL`·`gas/review.gs`)이고 **`gas/project.json` 매핑 밖이라 자동 배포되지 않는다** — 배포본과 레포 파일이 어긋날 수 있다. **단 후기 접수는 현재 받지 않는다**(운영자 2026-09-01) — `/review` 는 사이트 어디서도 링크하지 않는 직접 전달용 주소라 지금은 유입이 0이다. 따라서 배포본 확인은 **접수를 다시 열기 직전**에 하면 된다(실제 제출 1건 → 완료 화면 확인). 그때까지 이 라우트 변경은 프로덕션에 영향이 없다
- **supabase-js 의 `.select()` 문자열은 타입 수준에서 파싱된다** — `"a, b" + "c"` 처럼 이어 붙이면 행 타입을 못 뽑아 **필드 접근이 전부 컴파일 에러**가 된다(`GenericStringError`). 길어도 **한 줄 리터럴**로 쓸 것
- **GAS→우리 서버 방향은 전용 토큰이다** — `BACKFILL_TOKEN`(Vercel env = GAS 스크립트 속성, 같은 값) + GAS 속성 `SITE_URL`. `ADMIN_TOKEN`(우리→GAS 한 방향)을 재사용하지 않는다: 과거 두 값이 불일치해 사고가 났다. **service_role 키는 GAS 에 절대 두지 않는다** — GAS 는 우리 라우트를 부를 뿐이고 DB 접근은 라우트가 한다
- **Supabase 대시보드의 키는 마스킹된 채(`eyJhbGciOiJIUzI•••…`) 복사된다** — 그 값이 Vercel `SUPABASE_ANON_KEY` 에 들어가면 `•`(U+2022) 가 HTTP 헤더에 못 실려 fetch 가 **요청을 보내기도 전에** `Cannot convert argument to a ByteString … 8226` 으로 던지고, auth-js 는 이를 삼켜 "교환 실패"로만 보인다. **Supabase auth·edge 로그엔 아무 흔적이 없다**(도달을 안 하니까) — 2026-09-02 에 Redirect URL·구글 비밀·PKCE 쿠키 순으로 헛짚느라 하루를 썼다. 판정은 **Vercel 런타임 로그 한 줄**(`get_runtime_logs`, query `auth/callback`). 이제 `lib/supabase-key.ts` 가 키 모양(JWT·`sb_publishable_`, 공백 제거, 역할)을 검사해 어긋나면 로그인을 끄고(`authConfigProblem()`), 로그인 시작·콜백이 `login=failed&reason=…` 을 달아 관리자 로그인 화면이 풀어 말한다(`reason=malformed` 등). 키는 대시보드에서 **'표시(reveal)' 뒤 전체 복사**. 리허설 `npx tsx scripts/auth-key-test.mjs`
- **`pkill -f <패턴>` 은 자기 명령줄까지 매칭한다** — `pkill -f "next dev"` 나 `pkill -f mock-gas.mjs` 를 쓰면 그 문자열이 든 **셸 자신이 죽어 exit 144** 로 끝나고 **뒤 명령이 통째로 실행되지 않는다**(heredoc 파일 쓰기가 조용히 누락돼 옛 파일로 검증하는 사고가 났다). `ps -eo pid,args | grep '패[턴]'` 로 PID 를 뽑아 `kill` 하거나, 아예 **다른 포트로 띄울 것**. 살아남아야 하는 백그라운드는 `setsid … < /dev/null &`
- **한 SELECT 안의 독립 서브쿼리는 평가 순서가 보장되지 않는다** — `select (파기함수()), (그 행 상태)` 로 한 번에 재면 파기 **전** 값을 읽어 거짓 실패로 보인다. 부작용이 있는 함수와 그 결과 관측은 **쿼리를 나눠서**
- **sed 광역 치환 금지** — 고유 컨텍스트 포함 치환만. **rm 전 파일별 import grep** (JourneyStepper 오삭제 선례). **JSX 래퍼 추가 직후 tsc** — 구문 에러가 6분 타임아웃처럼 보인다.
- **env 를 지워서 경로를 닫을 때 `undefined === undefined` 를 조심할 것** — `password !== process.env.ADMIN_PASSWORD` 는 env 를 지우는 순간 **본문 없는 요청(`{}`)을 통과**시킨다(양쪽 다 `undefined`). 2026-09-02 실증: 종전 관리자 비밀번호 라우트에 `{}` POST → 200 + 관리자 쿠키. **비밀값 비교는 ① env 가 설정됐는지 ② 입력이 문자열인지를 먼저 확인**하고 비교한다. '이 env 를 지우면 기능이 꺼진다'는 설계는 지우기 전에 그 코드가 정말 닫히는지 실측할 것.
- **`gh` CLI 없음** — `mcp__github__*` 사용.
- **클로징 검증**: SeasonCountCta 는 IO threshold .6 — `scrollTo(맨아래)` 로는 뷰포트 위로 빠져나가 발화 안 함. `scrollIntoView` 로 화면 중앙에.
- **포스터·서체 파이프라인·웹킷 검증** → `docs/env-notes.md` **필독** (빌드타임 포스터 배치, SUIT/포스터 서브셋 재생성, immutable 헤더, DeferredCss, 웹킷 특이점).

## 6. GAS (Google Apps Script) 계약

- **자동 배포**: `gas/` 변경을 main 병합하면 워크플로(`gas-deploy.yml`)가 실반영 (절차서 `docs/gas-automation.md`). 대조·회수는 `node scripts/gas-sync.mjs check`/`pull` — 기준선 검사에 걸리면 **덮어쓰지 말고 pull 로 회수해 커밋이 먼저**. '새 배포' 금지(URL 변경) — 기존 배포 갱신만.
- **비밀값은 스크립트 속성** — 레포에 평문 금지.
- **정본은 통합 스크립트 `gas/linkyincdev-main.gs`** (apply·oneday·notify·인터뷰·admin_block 전 계약). `gas/interview-booking.gs` 는 레거시 미러 — 고쳐도 실배포 무관. admin 연동 이상 시 GAS ADMIN_TOKEN ↔ Vercel ADMIN_SECRET 일치부터 확인.
- **handleApply payload**: name/gender/age/phone/interviewType/greeting/instagram/referral/marketingConsent/consentAt/preferredDays(현재 빈 값)/unavailableDays. 시트는 헤더 이름 매핑(열 순서 무관, `ensureColumn` 자동 생성, 한국어 헤더 관례). **동의 분리(2026-07-27)**: privacyConsent 는 프론트 검증만, marketingConsent 는 선택 마케팅 수신 — 필수화하거나 운영 연락을 여기 걸면 위법(개인정보 보호법 제22조).
- 프론트 화면 변경은 GAS 무관 — "건드려야 하나?"는 payload 계약 변경 여부로 판단.
- **전화 인터뷰 24h 리마인드**: `remindPendingInterviews` — 상세 규칙·적용 절차는 `docs/gas-interview-remind-setup.md`. ⚠ 슬롯 규칙은 `apply/interview/schedule/page.tsx` 14~26행과 값 동일 유지. ⚠ 트리거는 자동 생성 안 됨 — 시트 메뉴에서 1회 등록.
- **폼 필드 추가 절차**: ① 실 apply ② preview/apply(쌍 동기화) ③ handleApply(`ensureColumn`+row+메일) ④ 시트 수동 작업 불필요 안내 ⑤ **GAS 새 버전 확인 후에 프론트 병합** — 뒤집히면 새 필드 값이 조용히 유실.

## 7. 운영자 커뮤니케이션 규약

- 모든 보고는 한국어, 결론 먼저. UI 변경은 스크린샷 + 프리뷰 링크(만료 시각 표기).
- **해석**: 짧은 반말·오타 잦음 — 문맥으로 복원, 화면 문구는 교정본으로. 모호한 공간 피드백은 **최소 해석으로 구현 → 스크린샷 확인** (물어보느라 멈추지 말 것). 재해석 지시가 오면 이전 변경 전부 철회 후 새 해석 — 덧대기 금지. **적용 범위는 직전 논의 대상으로 좁게**. "~만"·"보류" 는 엄격한 범위 지시(보류 = 연기, DECISIONS 기록). "바로 배포해" = 검증→병합→프로덕션 확인까지. 번호 목록은 번호로 대응. 사실 진술("2기엔 20만원이었거든") = 컨피그 정정 지시.
- **브랜드 카피는 운영자 소유** — 원문 그대로 반영(강조 마크업만), 임의 창작 금지.
- 제안은 선택지 2~3개 + 추천 1개 + 근거. 운영자는 표·짧은 근거 선호.
- **결정은 즉시 `docs/DECISIONS.md`** (append, 최신 위).

## 8. 이 문서의 유지보수

- 새 함정 → §5 (심층은 env-notes.md). 새 공유 파일 → §4. 운영자 결정 → DECISIONS.md (병합과 같은 커밋).
- **이 문서는 압축 유지** (운영자 2026-08-24 "최대한 지우고 정리해") — 이력 서술은 DECISIONS/git 에 맡기고 여기엔 현재 유효한 규칙·상태만. 낡은 사실은 발견 즉시 수정.
- **기수 전환 시**: season-config.ts + 이 문서·DECISIONS 의 기수 표기 갱신 (현: 4기 모집 open, 9/9–11/1, 마감 9/7 비표기 자동마감, 수→일→화).

## 9. 레이지클럽 개편 (docs/redesign/)

> 정본: `docs/redesign/` 문서군(v3) — 개편 범위(레이지클럽 홈·일회성 모임)에서 기존 규칙과 충돌 시 그쪽이 우선. 작업 시 `docs/redesign/README.md`·`01-decisions.md` 필독.

- 개편 범위에선 §3 대신 02(토큰)·03(레이아웃)·04(레퍼런스) 적용: 검증 뷰포트 390/768/1280 3종, 제로베이스 구현(기존 UI 문법 재사용 의무 없음), 장식 도형 0·블롭 금지, 정적 골격 승인 전 모션 금지, 신규 CSS 는 기존 .module.css import 금지. 철칙 5개·DECISIONS 기록은 그대로.
- **라운드 처리 0 · 유채색 UI 0 · 보더 버튼 0 · 그림자 0**(운영자 2026-09-02 "라운드처리는 안할거고"). 상자 대신 괘선, 버튼 대신 텍스트 링크. **상태를 색으로만 말하지 않는다** — 채움 농도·질감(해칭)·글자 라벨로. 색각 이상·흑백에서 사라지지 않는 것이 UX 로도 낫다(선례: 관리 달력의 차단=잉크 채움 / 예약=사선 해칭 / 선택 중=테두리, 상태 점검의 '정상·확인 필요' 글자). ⚠ **문구가 색을 가리키면 안 된다**("주황 슬롯 클릭 시 삭제" 같은 안내는 재도색과 함께 고친다).
- **로고 종결(추가 로고 작업 금지)**: 마스터 `public/assets/logo/lazyday_logo.svg` + `logo-mono-ink.svg`·`logo-mono-cream.svg`. 화면 노출=mono-ink / 색면 위=mono-cream / 파비콘·OG·개편 홈=원본 풀컬러. 리컬러·임의 색 교체 금지.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
