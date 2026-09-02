# 인수인계 — 고객관리 대시보드·회원 (2026-09-02, 다음 세션용)

> **읽는 순서**: ① `CLAUDE.md` ② `docs/DECISIONS.md` 2026-09-01~02 행 전부 ③ 이 문서 ④ `docs/admin-crm/02-build-plan.md`.
> 이 문서는 **오늘 하루에 일어난 일과 다음 세션이 이어서 할 일**을 한곳에 모은 것이다. 규칙의 정본은 CLAUDE.md, 결정의 정본은 DECISIONS — 여기와 어긋나면 그쪽이 맞다.

## 0. 한 문단 요약

레이지클럽(상위 브랜드) ⊃ 레이지데이 북클럽. 관리 화면은 오늘 `admin.lazy-club.com` 으로 분리됐고, 그 위에 **고객관리 대시보드(CRM형 — HubSpot·Attio 정보 구조 × 레이지클럽 베이스 팔레트)** 를 6개 PR 로 올렸다: 고객 레코드 API(세 원장을 전화로 묶은 파생) → 시트 진행 상태 거울 → 셸+고객 → 홈 칸반+오늘 할 일 → 주문 탭. 관리자 로그인은 소셜 계정+허용 이메일(#584) → 비밀번호 가드(#586) → **서명 토큰 쿠키**(2026-09-02 저녁) 순으로 굳혔다. 회원(소셜 로그인 · profiles)은 **화면까지 프로덕션에 있다** — 계정 패널·마이페이지(#589) · 만 14세 확인·마케팅 철회(#592) · 방침 회원 조항+프로필 사진 자리 0014(#590). ⚠ **오늘 오후는 세션 두 개가 병렬로 돌았다**(이 문서의 세션 + `session_011wisJoj7K8WseZaXxxETYy`) — 커밋 메시지의 Claude-Session 으로 구분한다. 남은 건 §3.

## 1. 프로덕션 현재 상태 (실측 2026-09-02)

| 영역 | 상태 | 확인 방법 |
|---|---|---|
| 관리 호스트 `admin.lazy-club.com` | 손님 3도메인 `/admin*` → 307. 관리 호스트는 `/admin/*` 만, 나머지 404 | `curl -sI https://www.lazyday-bookclub.com/admin` → 307 |
| 관리 화면 | `/admin` 홈(칸반+오늘 할 일) · `/admin/customers[/키]`(활동 남기기 포함, CRM-5) · `/admin/orders` · `/admin/applications` · `/admin/schedule`(차단 달력) · `/admin/status` · `/admin/simulate` — **6종 전부 한 셸, §9 톤(라운드 0·유채색 0)**(CRM-7 #587) | 로그인 필요 — 운영자 확인 |
| 관리 API | `/api/lazyday/admin/{customers,today,orders,applications,activities,blocks,health,orders/unsubmitted,sync-status,backfill-applications}` — 게이트는 **서명 토큰**(`lib/admin-session.ts`) | 무쿠키 401 |
| 회원 | `/api/auth/{signin/[provider],callback,signout,me}` (복귀 주소는 `lz_auth_next` 쿠키, #591) · `profiles`(0011 + 0014 avatar_url) · 계정 패널·`/mypage`·`/api/lazyday/mypage{,/link-order,/consents}` · Supabase Google·Kakao 켜짐(구글 비밀은 17:53Z 에 고쳐져 `user_signedup` 이 찍힘). ⚠ **소셜 로그인은 아직 실패 — 원인 확정(2026-09-02 저녁, Vercel 런타임 로그)**: Vercel `SUPABASE_ANON_KEY` 가 대시보드 **마스킹 표시값**(`eyJhbGciOiJIUzI•••…`)이라 `apikey` 헤더 ByteString 오류로 `/auth/v1/token` 요청이 **나가지도 않았다**(Supabase 로그엔 흔적 0). 코드 결함 아님(로컬 재현 정상). 저녁 PR 이 키 모양 검사(`lib/supabase-key.ts`) + 로그인 화면 사유 표시(`reason=malformed`)를 넣었다 — **운영자가 키를 재입력하면 풀린다**(§5 1번) | 키 재입력 전: `curl https://www.lazy-club.com/api/auth/me` → `{"enabled":false,...}`(검사가 끈 상태) · 재입력 후 `enabled:true` + 로그인 성공 |
| DB (prod `qdxnxdfebkgoxeqzfmji`) | 마이그레이션 0001~**0014** 적용(0013 `customer_activities`, 0014 `profiles.avatar_url`). `applications` 10행(전부 route 유입, **시트 스윕 0회**), `profiles` 0행 | Supabase MCP `execute_sql` · `list_migrations` |
| GAS | 스윕(`sweepApplicationsToDb`) + 거울(`syncProgressToDb`) 배포됨(run #25 success). **트리거는 운영자가 아직 안 켬** | `select count(*) filter (where sheet_synced_at is not null) from applications` → 0 이면 아직 |

## 2. 오늘의 결정 (DECISIONS 행 제목만 — 본문은 그쪽)

1. 브랜드 위계: 레이지클럽 ⊃ 북클럽 — 장기 관리 단위 이름·도메인·설명은 레이지클럽 기준.
2. 가입은 상시 공개 / 회원 본진은 lazy-club.com (데이터는 한 DB, 세션만 도메인별).
3. 관리 화면 → `admin.lazy-club.com` (307, 관리 호스트는 `/admin/*` 만). linkykorea.com 기각.
4. 관리자 화면 = 고객관리 대시보드, **CRM형(HubSpot·Attio)** 레퍼런스, 통합안(C 칸반 홈 + A 3열 상세 + B 표+패널) 확정. 내비 6(홈·고객·접수·주문·일정·도구).
5. 고객은 표가 아니라 **파생**(세 원장을 정규화 전화로 묶음). 단계는 시트 거울 > 인터뷰 행 > DB status 로 읽기 파생. **정본은 시트(P5 전)** — 쓰기 UI 없음.
6. 오늘 할 일 8종 확정.
7. 관리자 로그인 = 소셜 + `ADMIN_EMAILS`. 비밀번호는 `ADMIN_PASSWORD` env 가 있는 동안만(가드 #586 뒤에 지워야 안전).
8. 관리자 쿠키 = **서명 토큰**(who·만료 7일). who 쿠키 폐지. GAS `ADMIN_TOKEN` 무변경.
9. 활동 기록(CRM-5)은 **수동 저장**·사람 단위 새 표·파기 2종 같은 PR. 관리 화면 톤 = §9(라운드 0·유채색 0, CLAUDE.md §9 승격).
10. 소셜에서 받을 수 있는 건 최대한(프로필 사진은 URL 만) · 방침은 기능보다 먼저(#590) · 만 14세 확인은 true 만 · 마케팅 철회는 접수 원장까지(#592).

## 3. 다음 세션이 할 일 (순서대로 · 각각 독립 PR)

> 오늘 계획했던 3-1~3-5 는 **전부 병합됐다**: 소셜 로그인 준비물 안내(3-1) · CRM-7(#587) · CRM-5(#588) · 마이페이지(#589) · 만 14세·마케팅 철회(#592) · 방침 회원 조항(#590) · 서명 토큰(저녁 PR). 아래가 진짜 남은 것이다.

### 3-1. (먼저) 운영자 준비물이 끝났는지 실측 — §5 표대로
`SUPABASE_ANON_KEY` 재입력(§5 1번 — 구글 비밀은 이미 고쳐짐) → `/api/auth/me` 가 `enabled:true` → 두 분이 로그인 성공(`auth.users.last_sign_in_at`·`profiles` 행) → `ADMIN_PASSWORD` 삭제. 스윕 트리거 → `sheet_synced_at` 건수 > 0. 끝나기 전엔 대시보드 파이프라인에 합격·미결제·탈락이 비어 보인다(정상).

### 3-2. 약관(이용약관) 회원 조항 — 30일 예고
방침(개인정보처리방침)은 #590 으로 끝났지만 **이용약관**(`app/(main)/lazyday/terms/TermsBody.tsx`, 레이지클럽이 직접 import)엔 아직 회원 조항이 없다(제7조① "별도의 회원가입 없이"). 브랜드 카피는 운영자 소유 — **초안을 제안해 운영자가 확정**한 뒤 시행일을 30일 뒤로 두고 배포. 용어 정리(계정 보유자='회원', 기수 참가자='참가자')도 이때.

### 3-3. P4b 네이버 로그인 spike (운영자가 네이버 앱을 만든 뒤)
Supabase 커스텀 OAuth 공급자에 네이버 등록(authorize/token/userinfo) → dev 실로그인 → userinfo 가 `{resultcode, message, response:{…}}` 로 중첩된 것을 소화하는지. 되면 `signin/[provider]` 화이트리스트에 `naver` 추가 + 로그인 버튼. 안 되면 폴백 공수 재보고(계획서 P4b).

### 3-4. 회원 후속 소소한 것
마케팅 동의자 발송 목록(오늘 할 일과 별개, 관리 화면에서 내려받기) · 후기 접수 재개 시 `/review` robots · 관리자 감사 로그(R13 — 이제 who 가 토큰에 있으니 열람 로그를 남길 수 있다: 어떤 고객 레코드를 누가 언제 열었는지. 개인정보 컬럼 아님, 별도 표).

### 3-5. P5 (운영자 합의 후에만)
"시트 '진행 상태' 기입 중단" 선언 → `applications.status` 가 정본 → 칸반 드래그(쓰기) 개통. 그 전엔 절대 쓰기 UI 를 열지 않는다. CRM-2 의 거울 컬럼(0012)이 그때 정본 컬럼으로 승격되는 마이그레이션이 필요하다.

## 4. 함정 (오늘 실측한 것 — CLAUDE.md §5 에도 있음)

- `useSearchParams()` 는 `<Suspense>` 안에서만 — 로컬 dev 는 멀쩡하고 **Vercel 프리렌더에서 빌드가 깨진다**. 푸시 전 `npm run build`.
- dev 서버를 죽이면 `.next/dev/types/validator.ts` 가 깨져 tsc 가 엉뚱한 에러를 낸다 → `rm -rf .next/dev`.
- Bash 의 `cd` 가 다음 명령에 남는다(하위 폴더로 들어간 채 `next dev` 를 띄우면 "app 디렉터리 없음"). 절대 경로로.
- 관리 화면 스크린샷은 실 API 를 못 부른다(service_role 키 로컬 없음) → Playwright `page.route` 로 API 를 목 응답. 선례 `scratchpad/crm3-shot.mjs` 패턴(쿠키 `lazyday_admin=devsecret`, dev 서버 `ADMIN_SECRET=devsecret`).
- 모바일 셸 공백: `.shell` 그리드에 `grid-template-rows: auto 1fr` 없으면 100vh 여백이 내비 행에 배분된다(수정됨 — 새 그리드 만들 때 주의).
- 리허설 스크립트 `scripts/customers-test.mjs` 는 `npx tsx` 로만 돈다(strip-types 는 확장자 없는 import 를 못 푼다). 로직을 바꾸면 여기부터.
- 시트 값의 집합: 진행 상태 = 미진행·미결제·결제완료·환불·탈락 (GAS `PROGRESS_OPTIONS`), 인터뷰 상태 = O·대기·X.
- **관리 목 쿠키**: `lazyday_admin=devsecret` 은 더 이상 통과하지 않는다(서명 토큰). `ADMIN_SECRET=devsecret npx tsx scripts/admin-token-test.mjs --mint` 로 찍은 값을 쿠키에 넣을 것.
- **환경변수 값이 헤더에 못 실리면 Supabase 로그에 아무것도 안 남는다** — 마스킹 `•`·비ASCII 문자가 든 `SUPABASE_ANON_KEY` 는 fetch 가 요청 전에 던진다(`Cannot convert argument to a ByteString`). auth·edge 로그를 뒤지기 전에 **Vercel 런타임 로그**(`get_runtime_logs`, query `auth/callback`)부터. 이제 로그인 화면이 `reason=` 으로 말해 준다(CLAUDE.md §5).
- **병렬 세션**: 같은 날 두 세션이 같은 레포에 PR 을 올리면 로컬 `origin/main` 참조가 금세 낡는다 — 작업 시작 전 `git fetch origin main` 과 GitHub 커밋 목록 확인을 습관으로. 다른 세션이 이미 한 일을 다시 하지 말 것(오늘 CRM-5·7 이 그랬다).

## 5. 운영자 대기 항목 (다음 세션이 첫 브리핑에서 다시 물을 것)

| 순서 | 어디서 | 무엇을 | 확인 방법 |
|---|---|---|---|
| 1 | Vercel env (Production·Preview) | **`SUPABASE_ANON_KEY` 를 진짜 값으로 재입력** — 지금 값은 대시보드 마스킹 표시값(`eyJhbGciOiJIUzI•••…`). Supabase → Project Settings → API Keys → Legacy anon key **'표시'** 후 전체 복사(`eyJ…` 로 시작해 `…xthTEc` 로 끝나는 한 줄, 공백 없이) → 저장 → **Redeploy**(서버 env 라 재배포로 충분). 구글 비밀은 17:53Z 에 이미 고쳐짐 | `curl https://admin.lazy-club.com/api/auth/me` → `{"enabled":true,…}` · 로그인 화면에 `reason=malformed` 문구가 더 안 뜸 |
| 2 | Vercel env | `ADMIN_EMAILS`(두 분 이메일, 쉼표, Secret) → Redeploy | 소셜 로그인 성공 |
| 3 | Supabase → URL Configuration → Redirect URLs | ✔ 확인됨 — `auth.flow_state.referrer` 에 `https://admin.lazy-club.com/api/auth/callback` 이 검증된 값으로 찍혀 있다 | — |
| 4 | `admin.lazy-club.com/admin/login` | 두 분 각각 카카오·구글로 로그인 성공 | — |
| 5 | Vercel env | 4 뒤 `ADMIN_PASSWORD` 삭제 → Redeploy (가드 #586 병합됨 — 지워도 구멍 없음) | 비밀번호 폼 401 |
| 6 | 구글 시트 메뉴 | 스크립트 속성 `SITE_URL`·`BACKFILL_TOKEN` → "DB 보정 자동 실행 켜기(1시간마다)" | prod `applications.sheet_synced_at` not null 건수 > 0 |
| 7 | (선택) Google Cloud OAuth 동의 화면 | 앱 이름·로고·홈페이지·방침 URL → 검증 신청 | 동의 화면에 '레이지클럽' 표기 |
| 8 | (선택) 네이버 개발자센터 | 앱 등록 + Client ID/Secret | 3-3 착수 조건 |
| — | 이용약관 회원 조항 초안 확정 | 3-2 | 30일 예고 시작 |

## 6. 파일 지도 (오늘 만든 것)

```
lib/customers.ts                 고객 파생(assemble·listCustomers·getCustomer·listCustomersDetailed)
lib/admin-today.ts               오늘 할 일 8종 파생
lib/site.ts                      도메인 역할표(BOOKCLUB_ORIGIN·ADMIN_HOST)
lib/auth-server.ts               회원 세션(서버 전용) · sessionUserIdSafe · avatarUrlOf · authConfigProblem · exchangeFailReason
lib/supabase-key.ts              Supabase 키 모양 검사(순수) — 리허설 scripts/auth-key-test.mjs
lib/admin-session.ts             관리자 서명 토큰(signAdminToken·verifyAdminToken·adminWho) — Edge+Node 공용
lib/customer-activities.ts       활동 기록(CRM-5) — customer_activities(0013)
app/(main)/lazyday/admin/AdminShell.tsx · crm.module.css · page.tsx(홈) · customers/{page,[key]/page,parts}.tsx · orders/page.tsx · schedule/page.tsx(옛 달력)
app/api/lazyday/admin/{customers,today,orders,activities,sync-status,auth,auth/social}/route.ts
app/(main)/lazyclub/mypage/* · app/api/lazyday/mypage/{route,link-order,consents}
app/api/auth/{signin/[provider],callback,signout,me}/route.ts · _next.ts(safeNext)
app/(main)/lazyday/preview/admin-crm/*   시안(통합안 + A/B/C 비교) — 프리뷰 전용, 실화면의 원본
supabase/migrations/20260902120000_profiles.sql · 20260902150000_applications_sheet_mirror.sql · 0013 customer_activities · 0014 profiles avatar_url
gas/linkyincdev-main.gs          syncProgressToDb · postJson
docs/admin-crm/{01-references,02-build-plan}.md · scripts/customers-test.mjs · scripts/admin-token-test.mjs
```

## 7. 작업 규율 (오늘 지킨 대로)

브랜치 `claude/<주제>` → tsc → `npm run build` → 목 API 스크린샷(390/1280) → 커밋(끝에 `Co-Authored-By` + `Claude-Session`) → PR → 병합 → 프로덕션 curl → DECISIONS/plan 갱신은 같은 PR. 문서 PR 도 병합. `next-env.d.ts` 는 커밋 전 `git checkout --`. 화면이 새로우면 스크린샷을 운영자에게 보내고 승인 뒤 병합(대시보드는 통합안 승인으로 갈음됨 — 새 화면 유형이 생기면 다시 승인).
