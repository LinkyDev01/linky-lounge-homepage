# 인수인계 — 고객관리 대시보드·회원 (2026-09-02, 다음 세션용)

> **읽는 순서**: ① `CLAUDE.md` ② `docs/DECISIONS.md` 2026-09-01~02 행 전부 ③ 이 문서 ④ `docs/admin-crm/02-build-plan.md`.
> 이 문서는 **오늘 하루에 일어난 일과 다음 세션이 이어서 할 일**을 한곳에 모은 것이다. 규칙의 정본은 CLAUDE.md, 결정의 정본은 DECISIONS — 여기와 어긋나면 그쪽이 맞다.

## 0. 한 문단 요약

레이지클럽(상위 브랜드) ⊃ 레이지데이 북클럽. 관리 화면은 오늘 `admin.lazy-club.com` 으로 분리됐고, 그 위에 **고객관리 대시보드(CRM형 — HubSpot·Attio 정보 구조 × 레이지클럽 베이스 팔레트)** 를 6개 PR 로 올렸다: 고객 레코드 API(세 원장을 전화로 묶은 파생) → 시트 진행 상태 거울 → 셸+고객 → 홈 칸반+오늘 할 일 → 주문 탭. 관리자 로그인은 소셜 계정+허용 이메일로 바꾸는 PR 이 마지막(#584). 회원(소셜 로그인 · profiles)은 뼈대만 프로덕션에 있고 **화면(계정 패널·마이페이지)은 WIP 브랜치**에 멈춰 있다.

## 1. 프로덕션 현재 상태 (실측 2026-09-02)

| 영역 | 상태 | 확인 방법 |
|---|---|---|
| 관리 호스트 `admin.lazy-club.com` | 손님 3도메인 `/admin*` → 307. 관리 호스트는 `/admin/*` 만, 나머지 404 | `curl -sI https://www.lazyday-bookclub.com/admin` → 307 |
| 관리 화면 | `/admin` 홈(칸반+오늘 할 일) · `/admin/customers[/키]` · `/admin/orders` · `/admin/applications`(셸 안) · `/admin/schedule`(차단 달력, 옛 화면) · `/admin/status` · `/admin/simulate`(옛 화면) | 로그인 필요 — 운영자 확인 |
| 관리 API | `/api/lazyday/admin/{customers,today,orders,applications,blocks,health,sync-status,backfill-applications}` | 무쿠키 401 |
| 회원 뼈대 | `/api/auth/{signin/[provider],callback,signout,me}` · `profiles`(0011) · Supabase Google·Kakao 켜짐 · `SUPABASE_ANON_KEY` 설정됨 | `curl https://www.lazy-club.com/api/auth/me` → `{"enabled":true,...}` |
| DB (prod `qdxnxdfebkgoxeqzfmji`) | 마이그레이션 0001~0012 적용. `applications` 10행(전부 route 유입, **시트 스윕 0회**) | Supabase MCP `execute_sql` |
| GAS | 스윕(`sweepApplicationsToDb`) + 거울(`syncProgressToDb`) 배포됨(run #25 success). **트리거는 운영자가 아직 안 켬** | `select count(*) filter (where sheet_synced_at is not null) from applications` → 0 이면 아직 |

## 2. 오늘의 결정 (DECISIONS 행 제목만 — 본문은 그쪽)

1. 브랜드 위계: 레이지클럽 ⊃ 북클럽 — 장기 관리 단위 이름·도메인·설명은 레이지클럽 기준.
2. 가입은 상시 공개 / 회원 본진은 lazy-club.com (데이터는 한 DB, 세션만 도메인별).
3. 관리 화면 → `admin.lazy-club.com` (307, 관리 호스트는 `/admin/*` 만). linkykorea.com 기각.
4. 관리자 화면 = 고객관리 대시보드, **CRM형(HubSpot·Attio)** 레퍼런스, 통합안(C 칸반 홈 + A 3열 상세 + B 표+패널) 확정. 내비 6(홈·고객·접수·주문·일정·도구).
5. 고객은 표가 아니라 **파생**(세 원장을 정규화 전화로 묶음). 단계는 시트 거울 > 인터뷰 행 > DB status 로 읽기 파생. **정본은 시트(P5 전)** — 쓰기 UI 없음.
6. 오늘 할 일 8종 확정.
7. 관리자 로그인 = 소셜 + `ADMIN_EMAILS`. 비밀번호는 `ADMIN_PASSWORD` env 가 있는 동안만.

## 3. 다음 세션이 할 일 (순서대로 · 각각 독립 PR)

### 3-1. (먼저) PR #584 관리자 소셜 로그인 — 병합됨, 운영자 준비물 확인
브랜치 `claude/admin-social-login`. 빌드·tsc·게이트 검증 끝. 병합 안 돼 있으면 병합. 병합 뒤 운영자에게 준비물 3개 확인(§5). **완료 기준**: 운영자 두 분이 소셜로 로그인 성공 → `ADMIN_PASSWORD` 삭제.

### 3-2. CRM-7 일정·도구 셸 편입
`/admin/schedule`(차단 달력, `admin/schedule/page.tsx` + `admin.module.css`), `/admin/status`, `/admin/simulate` 를 `AdminShell` 안으로. 세 화면 모두 자기 CSS 가 화면 전체 배경(베이지/다크)을 가지므로 접수 원장처럼 `.embedded` 변형을 두거나 §9 토큰으로 다시 그린다(달력은 그리기 큰 화면 — 옮기기만). **완료 기준**: 6개 내비 항목 전부 같은 셸, 390/1280 스크린샷.

### 3-3. CRM-5 활동 남기기 (메모·통화·문자 기록)
레코드 페이지의 '메모·통화 기록·문자 보내기'가 **기록을 남기게**. 설계 판단이 필요하다:
- 저장소: `applications.triage_note` 는 접수 1건에 붙는 메모라 사람 단위 활동 로그로 부족. **새 표 `customer_activities`**(key=정규화 전화 또는 user_id, type, body, at, who) 가 자연스럽다 — 마이그레이션 **0013**.
- ⚠ 개인정보가 들어가는 컬럼이므로 **파기 함수 2종을 같은 PR 에서**(CLAUDE.md §4 규율) — 보유기간은 접수 원장과 맞춘다(사람의 마지막 접수 `purge_after`).
- `who` 는 `lazyday_admin_who` 쿠키(3-1 이후 존재)에서.
- `lib/customers.ts` 의 `buildActivities` 에 합친다.

### 3-4. 마이페이지·계정 패널 재개 (계획서 P4a 4~7)
브랜치 **`claude/p4a-entrance-mypage`** 에 WIP 커밋 `e0269b9` 가 있다(12파일, 미검증). 내용: `lazyclub/Shell.tsx` 계정 아이콘 → 로그인 패널, `lazyclub/mypage`(내 주문·내 신청·주문 연결), `/api/lazyday/mypage`·`link-order`, **user_id 스탬핑**(`lib/applications.ts` `recordSafe` 가 세션을 스스로 해석 · `lib/orders.ts` `userId` · `payment/confirm`). 절차:
1. `git checkout claude/p4a-entrance-mypage && git rebase origin/main` — `lib/auth-server.ts`(`sessionUserIdSafe` 추가)·`lib/applications.ts`·`robots.ts` 충돌 가능. main 쪽 변경(CRM)을 살리고 WIP 를 얹는다.
2. 화면은 **철칙 1**: 스크린샷(390·1280) 승인 뒤 병합. 계정 패널 문구는 '가입=입회'로 읽히지 않게(DECISIONS 2026-09-02 "가입은 상시 공개").
3. `/mypage` 는 레이지클럽 트리(`lazyclub/mypage`) — lazy-club.com 에서 `/mypage`, 북클럽 도메인에서 `/lazyclub/mypage`. 미들웨어 변경 불필요(루트 경로가 `/lazyclub/*` 로 rewrite).
4. 실로그인 검증은 운영자 계정으로(프리뷰 URL 은 Supabase Redirect URLs 에 없어 실패한다 — 프로덕션에서).

### 3-5. 회원 후속 (계획서 P4-0 잔여)
약관 회원 조항(30일 예고) · 만 14세 확인 화면(첫 로그인 뒤, `profiles.age_verified_at`) · 마케팅 수신 철회 버튼. 그 뒤 P4b 네이버 spike.

### 3-6. P5 (운영자 합의 후에만)
"시트 '진행 상태' 기입 중단" 선언 → `applications.status` 가 정본 → 칸반 드래그(쓰기) 개통. 그 전엔 절대 쓰기 UI 를 열지 않는다.

## 4. 함정 (오늘 실측한 것 — CLAUDE.md §5 에도 있음)

- `useSearchParams()` 는 `<Suspense>` 안에서만 — 로컬 dev 는 멀쩡하고 **Vercel 프리렌더에서 빌드가 깨진다**. 푸시 전 `npm run build`.
- dev 서버를 죽이면 `.next/dev/types/validator.ts` 가 깨져 tsc 가 엉뚱한 에러를 낸다 → `rm -rf .next/dev`.
- Bash 의 `cd` 가 다음 명령에 남는다(하위 폴더로 들어간 채 `next dev` 를 띄우면 "app 디렉터리 없음"). 절대 경로로.
- 관리 화면 스크린샷은 실 API 를 못 부른다(service_role 키 로컬 없음) → Playwright `page.route` 로 API 를 목 응답. 선례 `scratchpad/crm3-shot.mjs` 패턴(쿠키 `lazyday_admin=devsecret`, dev 서버 `ADMIN_SECRET=devsecret`).
- 모바일 셸 공백: `.shell` 그리드에 `grid-template-rows: auto 1fr` 없으면 100vh 여백이 내비 행에 배분된다(수정됨 — 새 그리드 만들 때 주의).
- 리허설 스크립트 `scripts/customers-test.mjs` 는 `npx tsx` 로만 돈다(strip-types 는 확장자 없는 import 를 못 푼다). 로직을 바꾸면 여기부터.
- 시트 값의 집합: 진행 상태 = 미진행·미결제·결제완료·환불·탈락 (GAS `PROGRESS_OPTIONS`), 인터뷰 상태 = O·대기·X.

## 5. 운영자 대기 항목 (다음 세션이 첫 브리핑에서 다시 물을 것)

| 항목 | 왜 필요한가 | 확인 방법 |
|---|---|---|
| GAS 스크립트 속성 `SITE_URL`·`BACKFILL_TOKEN` + 시트 메뉴 "DB 보정 자동 실행 켜기" | 이게 꺼져 있으면 파이프라인에 합격·미결제·탈락이 안 뜬다(시트에만 있는 값) | prod `applications.sheet_synced_at` not null 건수 |
| Vercel env `ADMIN_EMAILS`(Secret) | 관리자 소셜 로그인 허용 목록 | 로그인 페이지에서 소셜 로그인 성공 |
| Supabase Redirect URLs 에 `https://admin.lazy-club.com/api/auth/callback` | 관리 호스트로 콜백이 돌아와야 한다 | 〃 |
| 확인 뒤 `ADMIN_PASSWORD` 삭제 | 공유 비밀번호 제거 | 로그인 페이지 비밀번호 폼이 401. ⚠ **가드 PR 병합 뒤에 지울 것** — 그전에 지우면 빈 요청에 관리자 쿠키가 발급된다(DECISIONS 2026-09-02 결함수정 행) |
| 약관 회원 조항 초안 | 30일 예고 리드타임 | — |

## 6. 파일 지도 (오늘 만든 것)

```
lib/customers.ts                 고객 파생(assemble·listCustomers·getCustomer·listCustomersDetailed)
lib/admin-today.ts               오늘 할 일 8종 파생
lib/site.ts                      도메인 역할표(BOOKCLUB_ORIGIN·ADMIN_HOST)
lib/auth-server.ts               회원 세션(서버 전용) — WIP 브랜치엔 sessionUserIdSafe 추가본
app/(main)/lazyday/admin/AdminShell.tsx · crm.module.css · page.tsx(홈) · customers/{page,[key]/page,parts}.tsx · orders/page.tsx · schedule/page.tsx(옛 달력)
app/api/lazyday/admin/{customers,today,orders,sync-status,auth/social}/route.ts
app/api/auth/{signin/[provider],callback,signout,me}/route.ts · _next.ts(safeNext)
app/(main)/lazyday/preview/admin-crm/*   시안(통합안 + A/B/C 비교) — 프리뷰 전용, 실화면의 원본
supabase/migrations/20260902120000_profiles.sql · 20260902150000_applications_sheet_mirror.sql
gas/linkyincdev-main.gs          syncProgressToDb · postJson
docs/admin-crm/{01-references,02-build-plan}.md · scripts/customers-test.mjs
```

## 7. 작업 규율 (오늘 지킨 대로)

브랜치 `claude/<주제>` → tsc → `npm run build` → 목 API 스크린샷(390/1280) → 커밋(끝에 `Co-Authored-By` + `Claude-Session`) → PR → 병합 → 프로덕션 curl → DECISIONS/plan 갱신은 같은 PR. 문서 PR 도 병합. `next-env.d.ts` 는 커밋 전 `git checkout --`. 화면이 새로우면 스크린샷을 운영자에게 보내고 승인 뒤 병합(대시보드는 통합안 승인으로 갈음됨 — 새 화면 유형이 생기면 다시 승인).
