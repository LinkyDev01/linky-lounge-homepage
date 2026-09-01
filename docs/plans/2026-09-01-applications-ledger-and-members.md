# 접수 이중화(시트+DB) + 회원(카카오·구글·네이버) + DB 관리 화면 — 실행 계획 v2

> **v2 = 사실검증 개정판.** v1 을 6갈래로 레포와 대조하고 3인이 적대적으로 비판해 blocker 24건을 잡았다.
> 아래 본문은 그 정정을 모두 반영한 것이다. **v1 의 다음 주장들은 틀렸으니 되살리지 말 것**:
> 부분 유니크 인덱스 + upsert / `/api/payment/prepare` 에서 recordOrder / `@supabase/ssr` 설치돼 있음 /
> review 를 스윕 범위에 포함 / GAS 성공 = HTTP 200 / 방침 개정을 P4 로 미룸.
>
> **실행 전 필독**: ① `CLAUDE.md` ② `docs/DECISIONS.md` ③ `supabase/README.md`
> ④ `app/(main)/lazyday/preview/commerce-journey/Rules.tsx`(R1~R13 원문)
> 각 Phase = 독립 PR·독립 배포·독립 검증(검증→커밋→PR→병합→프로덕션 확인), 완료 시 DECISIONS append.
> 브랜치: 매 Phase 시작 시 `git fetch origin main && git checkout -B claude/<주제> origin/main`.

---

## Context

접수 데이터가 Google 시트(GAS)에만 저장된다 — 접수 9종 중 DB(Supabase)에 흔적이 남는 건 선결제 원데이 하나뿐이다. 운영자 지시(2026-09-01): ① **접수 전부**를 시트+DB 이중화(시트는 그대로 유지) ② **회원 기능** 구현 ③ **DB 관리 화면**. 추가 확정: **영구결손 금지**, 로그인 진입점은 **탑네비 우측 상단 + 결제 페이지 회원/비회원 분기**.

설계 정본(commerce-journey)의 미구현 칸을 채우는 일이다 — **R6**(applications 를 orders 와 별도 테이블로) · **profiles**(북클럽·레이지클럽 공통 회원 원장, 기확정) · **R11**(비회원 유지, 사후 연결은 주문번호+전화 둘 다 일치).

## 운영자 확정 (2026-09-01 문답)

| 항목 | 확정 |
|---|---|
| 이중화 범위 | **접수 전부** (시트 저장 유지) |
| 로그인 사업자 | **카카오+구글 먼저, 네이버 후속** (8/18 확정 3사 중 네이버만 뒤로) |
| 관리 | **DB 관리 화면까지** (정본 전환은 단계적) |
| 결손 | **영구결손 금지** — 보정 루프 필수 |
| DB 적용 경로 | **Supabase MCP 재연결** (운영자가 커넥터 부착) |
| 개인정보처리방침 | **지금 바로 단독 배포** (P0, 이 계획과 독립) |
| 마이페이지 주소 | **`/mypage`** (운영자: "국내 관습 따를게") |
| 로그인 진입점 | 탑네비 우측 상단 + 결제 페이지 회원/비회원 분기 |

---

## 불변 원칙 (전 Phase 공통)

1. **GAS(시트) = 1차 정본.** DB 기록 실패가 접수 응답을 절대 깨뜨리지 않는다 — `lib/orders.ts:22-24` 의 `LedgerResult`(던지지 않음 / env 미설정 시 `{ok:true,skipped:"disabled"}` / 23505=duplicate 성공)를 그대로 쓴다.
2. **GAS 성공 판정은 HTTP 가 아니다.** GAS 는 실패도 **HTTP 200 + `{success:false}`** 로 돌려준다 — 화이트리스트 밖 type(`gas/linkyincdev-main.gs:278`), 필수항목 누락(`:291`·`:567`), **슬롯 중복 "이미 예약된 시간입니다"(`:579`)**. 따라서 `const data = await gasPostJson(...)` 후 **`data?.success !== false` 일 때만** `recordApplication` 을 호출한다. 안 그러면 시트에 없는 **유령 행**이 DB 에 쌓여 P3 의 시트↔DB 대조가 못 쓰게 된다. (302 유실 경로는 실행이 확정이므로 무조건 기록 + `gasBodyLost:true`.)
3. **RLS 정책 0개 유지.** 새 테이블도 enable+force+revoke, 브라우저 supabase-js 금지, 모든 조회는 서버 라우트(service_role) 경유. **`NEXT_PUBLIC_SUPABASE_*` 절대 금지.**
4. **마이그레이션**: append-only, **dev(`kfqtzxxtwokouvoqpebq`) → prod(`qdxnxdfebkgoxeqzfmji`)** 순. 적용 경로는 **Supabase MCP**(운영자 재연결 확정) — 세션 시작 시 `ToolSearch "select:mcp__Supabase__apply_migration"` 로 존재를 확인하고, **없으면 즉시 운영자에게 알리고 대기**(v1 은 이 경로가 있다고 전제해 첫 단계에서 막혔다). 적용 후 `supabase/README.md` §4 표(`| 파일 | 내용 | dev | prod |`)에 행 추가.
5. **마이그레이션 SQL 은 재실행 가능해야 한다** — 레포 전례가 전부 그렇다: `create table if not exists`(`core_orders.sql:42`), `create index if not exists`(`:77`), `drop trigger if exists … ; create trigger …`(`:82-84`). README §4 의 적용 명령이 `psql -v ON_ERROR_STOP=1` 이라 중간 실패 시 재실행이 필요하다. **`comment on` 으로 R# 근거를 남기는 것도 관례**(`core_orders.sql:72-75`) — 인라인 `--` 주석은 DB 에 남지 않는다.
6. **GAS 변경이 있는 Phase 는 §6 순서**: `gas/` 를 main 병합 → `gas-deploy.yml` **success 확인 후** 프론트 병합. 뒤집히면 새 필드가 시트에서 조용히 유실된다.
7. **검증에서 실제 시트를 오염시키지 않는다**: 로컬은 `INTERVIEW_GAS_URL` 미설정 목업 모드(`app/api/lazyday/apply/route.ts:5-19`) + dev Supabase env. Playwright 는 외부 요청 차단(`scripts/shot.mjs --block-external` 선례).
8. **프리뷰 퍼스트(CLAUDE.md 철칙 1) 적용 경계** — P1·P2·P2.5·P3(라우트·DB·GAS·admin)은 프리뷰 없이 직접(admin 은 선례가 있다). **P4 의 고객 대면 UI**(셸 로그인 진입점·`/mypage`·checkout 분기)는 **브랜치 프리뷰 + 390px 스크린샷으로 운영자 승인 후 병합**.
9. 로그에 개인정보 금지 — kind·sid·에러 코드까지만.

---

## P0. 개인정보처리방침 Supabase 수탁자 고지 (즉시, 단독 PR — 이 계획과 독립)

운영자 확정: **지금 바로 단독 배포.** 2026-08-18 주문 원장 배선 때부터 이미 어긋나 있던 결손이라 이번 작업과 무관하게 사실과 다르다.

- `app/(main)/lazyday/privacy/page.tsx` 제5조(개인정보 처리의 위탁) 목록에 한 줄 추가 — 현재 Google LLC·Vercel·솔라피·토스페이먼츠 4곳뿐이고 **Supabase 가 없다**:
  `<li>Supabase, Inc.: 주문·신청 정보의 저장·관리 (데이터베이스 호스팅)</li>`
- 제6조(국외 이전) 판단: Supabase 프로젝트 리전이 **ap-northeast-2(서울)** 이므로 데이터는 국내에 저장된다 — 국외이전 고지가 필요한지 문구를 운영자에게 확인받고 반영.
- 제12조 시행일 갱신.
- ⚠ 문구는 운영자 소유 — 초안을 제시하고 확인받은 뒤 반영한다.

---

## P1. `applications` 테이블 + 패스스루 라우트 이중화

### P1-1. 마이그레이션 `supabase/migrations/20260901HHMMSS_applications.sql`

전례를 그대로 따른다: `20260818090000_core_orders.sql`(스키마·RLS·파기함수) · `20260818120000_harden_functions.sql`(revoke/grant) · `20260818150000_r9_purge_schedule.sql`(pg_cron).

```sql
create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  sid           text unique,                 -- 제출 ID — 시트와 공유하는 멱등 키 (P1 부터 발급)
  kind          text not null check (kind in
                ('bookclub','notify','coffeebar','oneday',
                 'interview_phone','interview_written','review')),
  name          text,
  phone         text,                        -- 숫자만 정규화
  payload       jsonb not null default '{}', -- GAS 로 보낸 body 스냅샷 (시트 대조 근거)
  order_no      text,
  user_id       uuid references auth.users(id) on delete set null,  -- R11
  cohort        text,
  traffic_src   text,
  status        text not null default 'received' check (status in
                ('received','unpaid','paid','refunded','rejected','done')),
  status_note   text,
  ends_on       date,
  purge_after   date not null,               -- ⚠ NOT NULL — null 이면 영원히 안 지워진다
  purged_at     timestamptz,
  gas_body_lost boolean not null default false,
  dedup_key     text unique,                 -- ⚠ 부분 인덱스 아님 (아래 근거)
  submitted_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists applications_kind_idx  on public.applications (kind, submitted_at desc);
create index if not exists applications_phone_idx on public.applications (phone);
create index if not exists applications_purge_idx on public.applications (purge_after) where purged_at is null;
drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

create or replace function public.purge_expired_applications() returns integer
  language plpgsql security definer set search_path = public as $$
declare removed integer;
begin
  update public.applications
     set name=null, phone=null, payload='{}', status_note=null,
         dedup_key=null,                      -- ⚠ 여기에 전화번호 원문이 들어 있다
         purged_at=now()
   where purge_after < current_date and purged_at is null;
  get diagnostics removed = row_count;
  return removed;
end; $$;
revoke execute on function public.purge_expired_applications() from public, anon, authenticated;
grant  execute on function public.purge_expired_applications() to service_role;

alter table public.applications enable row level security;
alter table public.applications force  row level security;
revoke all on public.applications from anon, authenticated;
-- comment on table/column 으로 R6·R9·R11 근거를 남긴다 (core_orders.sql:72-75 형식)
```

pg_cron: `20260818150000` 전례 복제 — `do $$ begin perform cron.unschedule('r9-purge-applications'); exception when others then null; end $$;` 후 `select cron.schedule('r9-purge-applications','30 18 * * *', $$select public.purge_expired_applications()$$);` (18:30 UTC = 03:30 KST).

**핵심 정정 3건 (v1 이 틀렸던 곳)**
1. **`dedup_key` 는 부분 유니크 인덱스가 아니라 컬럼 unique.** v1 은 `where dedup_key is not null` 부분 인덱스를 만들고 `upsert({onConflict:"dedup_key"})` 를 쓰려 했는데, PostgREST 는 컬럼명만 보내고 인덱스 술어를 붙이지 못해 **42P10 으로 실패**한다. 그 실패는 LedgerResult 규율에 삼켜져 **에러 없이 영구히 작동하지 않는다.** Postgres 는 유니크 인덱스에서 NULL 을 서로 distinct 로 보므로 컬럼 unique 로 바꿔도 dedup_key 없는 kind 의 다중 NULL 행은 그대로 허용된다(전례: `funnel_events.event_id text not null unique`).
2. **`purge_after` 는 NOT NULL.** v1 표대로면 bookclub 전체와 oneday 상당수가 null 이 되어 **개인정보가 영원히 파기되지 않는다.** 기록 시점에 항상 계산하고, 계산 불가면 `submitted_at + 1년` 을 폴백으로 넣는다.
3. **파기 시 `dedup_key` 도 비운다** — `written:01012345678` 형태로 **전화번호 원문이 그 컬럼에 남는다.**

**purge_after kind 별 정책** (코드 상수 + `comment on` 양쪽에 명시)

| kind | ends_on | purge_after |
|---|---|---|
| oneday | 회차 마지막 날 | ends_on + 1년 (R9) |
| bookclub | 시즌 종료일 | ends_on + 1년 (R9) |
| coffeebar · interview_* · review · notify | null | **접수 + 1년** (보수적 기본) |

⚠ **ends_on 산출이 v1 생각보다 어렵다** — 실행자가 반드시 확인할 것:
- `meetingEndsOn(code)`(`lib/orders.ts:58-66`)은 **`dNNN` 주문 코드만** 받는다. meetingSlug 가 아니다. oneday 접수 두 경로 어느 쪽도 dNNN 을 직접 담지 않는다 → meetingSlug 가 있으면 `meetingOrderCode(slug)`(`app/(main)/lazyclub/one-day-config.ts:243`) 로 코드를 얻어 넘기고, orderId 만 있으면 `parseOrderCodes`(`lib/order-catalog.ts:112`)로 뽑는다.
- **`season-config.ts` 에 시즌 종료일의 기계 판독 필드가 없다** — 있는 건 표기용 `periodLabel: "9/9 – 11/1"`, `fifth.date: "11/1 (일)"`, `deadline`(=신청 마감일, 종료일 아님). 둘 중 하나를 택하고 계획대로 실행: **(권장) `season-config.ts` 에 `seasonEndsOn()` 신설**(`seasonYear()` + `SEASON.fifth.date` 파싱, `calendarData` 와 같은 규칙) / 또는 bookclub 도 접수+1년 보수 기본으로 두고 R9 정확 적용은 후속.
- 화면에 이미 고지된 보유기간이 폼마다 다르다(북클럽 신청 "동의 철회 시까지" 등) — **고지와 코드가 어긋나지 않게** 대조하고, 어긋나면 방침·동의문 쪽 수정을 운영자에게 보고한다.
- **삭제 요청 시 즉시 파기**(R9 후단·방침 제3조·제8조)는 시간 기반 cron 으로 충족되지 않는다 → 수동 파기 수단(admin 또는 SQL 절차)을 P3 에서 함께 다룰 것.

### P1-2. `lib/applications.ts` 신설

`lib/orders.ts` 규격 복제(파일 머리 주석: 왜 생겼나 / 원칙 / 스키마 경로 / 규칙 링크).

- **선행 작업**: `lib/orders.ts` 의 `normalizePhone`(`:52`)·`meetingEndsOn`(`:58`)은 **module-private 다 — export 로 바꾼다**(v1 이 "export 필요"라고만 적었던 것의 실물).
- `classifyApply(body): Kind | null` — `type` → kind(`undefined|""`→`bookclub`, `notify`, `coffeebar`, `oneday`). **미지 type 은 null(기록 스킵 + `console.warn`)** — GAS 의 "모르는 type=신청 폼" 함정을 DB 에 복제하지 않는다. `apply_draft`·`admin_*` 도 null.
- `recordApplication({kind, body, sid, orderNo?, userId?, gasBodyLost?})` →
  - `supabaseAdmin()` null → `{ok:true, skipped:"disabled"}`.
  - name/phone 추출 — **라우트마다 필드명이 다르다**(예약·후기 등) → kind 별 추출 맵을 코드에 표로.
  - `dedup_key`: **written 만**. `const np = normalizePhone(phone); const dedupKey = np ? \`written:${np}\` : null` — ⚠ `normalizePhone` 은 **9자리 미만이면 null 을 반환**하므로 가드 없이 문자열 결합하면 `"written:null"` 이 되어 비정상 번호 접수가 전부 한 행으로 덮어써진다(=접수 유실). GAS 의 `normPhone`(`gas/linkyincdev-main.gs:184`)과 정규화 규칙이 다르다는 점도 주석에.
  - upsert 는 `onConflict:"sid"`(+`ignoreDuplicates:true`) 또는 written 은 `onConflict:"dedup_key"` — `lib/funnel.ts:44-51` 패턴.
  - **타임아웃**: 설치된 supabase-js 버전에서 AbortSignal 을 실제로 걸 수 있는지 먼저 확인하고(가능하면 5s), 불가하면 `Promise.race` 로 감싸되 **race 로 끊긴 요청이 서버에서는 성공할 수 있음**을 주석에 남긴다(멱등 키가 있어 중복은 안 생긴다).
  - 전체 try/catch → `{ok:false,error}`. 절대 던지지 않는다.

### P1-3. 라우트 수정 — `app/api/lazyday/apply/route.ts`

- `markSubmitted(body)` 호출 **두 지점**(정상 성공 / `isGasExecuted` 302 유실) 옆에 `recordApplication` 추가.
- **불변 원칙 2 적용** — 정상 경로는 `data?.success !== false` 일 때만. 302 유실 경로는 무조건 + `gasBodyLost:true`.
- `sid = crypto.randomUUID()` 를 **P1 부터** 발급해 GAS payload 에 함께 보낸다(§6: GAS 가 아직 그 필드를 무시해도 무해 — 시트에 안 남을 뿐. P2.5 에서 GAS 가 받기 시작한다).
- dev 목업 분기에서도 `recordApplication` 호출(dev DB 검증 경로).
- 실패는 `console.error("[apply-ledger]", kind, code)` 만 — 응답 불변.

### P1 검증·배포

0. **로컬 리허설**(자격 없이 가능): 로컬 PostgreSQL 16 에 마이그레이션을 적용해 문법·제약·파기 함수·재실행 안전성을 먼저 확인.
1. Supabase MCP 로 **dev 적용** → insert·unique 충돌·`purge_expired_applications()`(과거 purge_after 시드 후 실행 → 개인정보 칼럼 null 화 확인)·anon revoke 실측 → **prod 적용** → README §4 갱신.
2. 로컬 dev 서버(GAS_URL 미설정 목업) + dev Supabase env → 북클럽 신청·notify·커피앤바·모임 신청 **4폼 실제 제출**(Playwright, 외부 차단) → kind 별 행·payload·purge_after·sid 확인. 미지 type 스킵 로그 확인. **GAS `{success:false}` 응답을 흉내 내 유령 행이 안 생기는지도 확인.**
3. `npx tsc --noEmit` · `npm run build` → PR → 병합 → 프로덕션 확인.

---

## P2. 전용 라우트 3종 이중화

- `app/api/lazyday/interview/book/route.ts` — kind `interview_phone`. ⚠ 이 라우트는 GAS 응답을 검사하지 않고 그대로 흘린다(`:44-45`). **슬롯 중복(`{success:false}`)이 흔한 경로**라 불변 원칙 2 가드가 특히 중요하다. `trafficSrc` 포함.
- `app/api/lazyday/interview/written/route.ts` — kind `interview_written`, `dedup_key` 는 위 null 가드 규칙대로.
- `app/api/lazyday/review/route.ts` — kind `review`. ⚠ **이 라우트만 구조가 다르다**: `lib/gas.ts` 를 안 쓰고 원시 `fetch(GAS_URL,{redirect:"follow"})`(`:27-32`), env 는 `REVIEW_GAS_URL`, **302 유실 판정이 없고** catch 가 실패를 `{success:true}` 로 삼킨다(`:36-38`). 삽입 지점은 한 곳뿐이며, catch 경로에서도 기록해 **DB 를 유일한 흔적으로 남길지** 판단해 계획대로 실행(권장: 기록하고 `gasBodyLost:true` 로 표시).
- 검증: P1 과 동일한 목업 방식 3폼. 독립 PR.

---

## P2.5. 결손 0 보정 루프 (운영자: "영구결손은 있으면 안되잖아")

**원리**: 접수마다 서버가 `sid` 발급(P1 부터) → 시트·DB 양쪽에 같은 값 → GAS 시간 트리거 스윕이 시트를 훑어 보정 엔드포인트로 밀고, 라우트가 sid 기준 upsert → **시트에 있으면 DB 에 반드시 생긴다**.

⚠ **v1 이 몰랐던 제약 5건 — 설계를 바꿔야 한다**
1. **GAS→우리 API 인증 선례가 없다.** 기존 ADMIN_TOKEN 계약은 **우리 사이트 → GAS 한 방향뿐**이다(doGet `e.parameter.adminToken` 검증). 역방향은 신규 설계 — GAS 스크립트 속성의 토큰을 헤더로 보내고 우리 라우트가 `ADMIN_SECRET` 과 대조한다.
2. **GAS 가 우리 도메인을 모른다** — `gas/` 어디에도 사이트 URL 상수가 없다. 스크립트 속성 `SITE_URL` 신설(운영자 1회 입력) 또는 코드 상수.
3. **후기(review)는 스윕에 못 들어온다** — `gas/review.gs` 는 **별도 Apps Script 프로젝트**(자체 SHEET_ID·자체 배포 URL)이고 `gas/project.json` 의 files 매핑은 `appsscript.json` + `linkyincdev-main.gs` 둘뿐이라 **자동 배포 대상이 아니다.** 셋 중 하나를 확정: ⓐ 후기는 스윕 범위에서 제외(P2 라우트층 이중화만) — **권장** ⓑ review.gs 를 운영자가 편집기에 수동 반영(대기 포인트 추가) ⓒ 후기 시트를 통합 스크립트가 함께 읽게 개조.
4. **서면 재제출에서 sid 가 갈라진다** — `handleWritten` 은 같은 번호를 덮어쓰는데 `setValues(existingRow,1,1,9)` 로 **1~9열만** 건드린다(의도적 — 유입 출처 보존). 뒤쪽 '제출 ID' 칼럼은 **첫 제출의 sid 가 남는다.** 그대로 두면 스윕이 새 sid 를 못 보고 중복 행을 만든다 → **written 은 sid 를 전화번호에서 파생한 결정적 값으로 쓰거나**, GAS 재제출 분기에서 '제출 ID' 셀을 명시적으로 덮어쓴다.
5. **탭마다 쓰기 방식과 정렬이 다르다** — `handlePhoneBooking` 은 고정 6칸 위치배열(`prependRow`)이라 추가 칼럼은 뒤에 `getRange().setValue()` 로 따로 써야 하고, 전화 인터뷰 탭은 **인터뷰 일시 순으로 재정렬**되어 "최근 N행"이 접수순이 아니다 → 스윕은 **'제출 ID 가 있고 아직 보정 안 된 행'을 전체에서 훑는** 방식으로. 대상 스프레드시트는 **3개**(북클럽 `SHEET_ID` / 레이지클럽 `LAZYCLUB_SHEET_ID` / 후기 별도).

### 실행 순서 (⚠ §6 — GAS 먼저)

1. **GAS 선배포**(`gas/linkyincdev-main.gs`): 6종 핸들러가 `d.sid` 를 `ensureColumn("제출 ID")` 로 기록(핸들러별 쓰기 방식 차이 반영) + `sweepApplicationsToDb()` 신설(3개 시트 중 통합 스크립트가 여는 2개) + `onOpen` 메뉴에 트리거 등록 항목 추가. **service_role 키는 GAS 에 넣지 않는다.** main 병합 → `gas-deploy.yml` success 확인.
2. **프론트 배포**: `app/api/lazyday/admin/backfill-applications/route.ts` 신설(토큰 검증 → sid upsert `ignoreDuplicates`, sid 없는 구행 스킵) + health Check 에 "스윕 최근 도착 시각·미보정 건수" 추가.
3. **운영자 작업**: 시트 메뉴에서 **시간 트리거 1회 등록**(자동 생성 안 됨 — 리마인드 트리거 선례, `docs/gas-interview-remind-setup.md`) + 스크립트 속성 `SITE_URL` 입력.
4. 검증: dev 에서 backfill 에 모의 rows 2회 POST → 행 1개(멱등) 확인. `node scripts/gas-sync.mjs check` → 실배포 후 Logger 로 스윕 1회 수동 실행.

⚠ **리스크 2 정정**: 이 루프가 없애는 것은 **'GAS 성공 + DB 실패'** 뿐이다. **GAS 자체가 실패하면 시트에도 DB 에도 근거가 없고**, 그 실패를 사용자에게 감추는 라우트가 둘 있다(review·written 의 catch → 성공 화면). 그 경로에서 DB 를 유일한 흔적으로 남기는 처리를 P2 에서 함께 넣어야 "영구결손 없음"이 성립한다.

---

## P3. Admin 조회 전용 화면 (Stage A — 쓰기 API 를 아예 배포하지 않는다)

- `app/api/lazyday/admin/applications/route.ts` — **GET only**. 쿠키 `lazyday_admin`===`ADMIN_SECRET` 인증(기존 `admin/orders/unsubmitted/route.ts` 복제), `if (!sb) return {enabled:false, rows:[]}`, 필터(kind·기간·이름/전화), limit + 페이지네이션, snake→camel 은 라우트에서.
- `app/(main)/lazyday/admin/applications/page.tsx` — `admin/status/page.tsx` 패턴(401→login). kind 탭 · 최근 7일 kind 별 건수(시트 대조용) · 목록. **status 는 렌더링하지 않고** 상단에 "상태 정본: 구글 시트" 배지.
- `admin/health/route.ts` 에 applications Check(최근 기록 시각·count·스윕 도착) 추가. status 화면에 링크.
- **삭제 요청 즉시 파기 수단**(R9 후단)을 여기서 함께 마련 — 최소한 절차 문서화, 가능하면 admin 버튼.
- 검증: preview 배포 + Playwright 스모크.

---

## P4. 회원 — P4a 카카오+구글 → P4b 네이버(후속)

### P4-0. 선행 (코드 밖)

- **의존성**: `@supabase/ssr` 은 **설치돼 있지 않다**(`node_modules/@supabase/*` 는 전부 supabase-js 전이 의존성). `npm i @supabase/ssr` 후 package.json + package-lock.json 을 커밋에 포함. Next 16 의 `cookies()` 비동기 여부를 확인하고 어댑터를 맞춘다.
- **약관 개정** — 현행 이용약관에 **회원 조항이 없다.** `app/(main)/lazyday/terms/TermsBody.tsx:90` 제7조① 이 **"별도의 회원가입 없이 구매할 수 있습니다"** 라고 못박고 있고 제2조 정의에 '회원'이 없다. 최소: 제2조에 회원·계정 정의 / 제7조① 문언 정정 / 가입·자격·탈퇴·이용제한 조항 신설. (lazyclub/terms 가 이 파일을 직접 import — 사본 없음.)
- **개인정보처리방침 2차 개정** — 회원(소셜 로그인) 수집항목·보유기간 반영. **만 14세 미만** 처리(법 제22조의2)는 소셜 로그인이 나이를 묻지 않으므로 가입 게이트 또는 약관 조항이 필요하다(`docs/community-spec-2026-07.md:73` 에 이미 1차 과제로 적혀 있다).
- **운영자 준비물**: Kakao/Google/(후속)Naver 개발자 앱 등록 + 키, Redirect URI `https://<ref>.supabase.co/auth/v1/callback`(dev·prod 각각), Supabase 대시보드 provider 활성화 + Redirect URLs 에 **두 도메인**(`lazy-club.com`, `www.lazyday-bookclub.com`) + preview, Vercel env `SUPABASE_ANON_KEY`(**`NEXT_PUBLIC_` 금지**).

### P4a. 카카오 + 구글

1. **`profiles` 마이그레이션** — v1 은 RLS 를 주석으로만 적어 **RLS 가 꺼진 채 이메일이 담기는 테이블**이 될 뻔했다. 실행 가능한 SQL 로: 테이블 + `drop trigger if exists profiles_set_updated_at …; create trigger …`(updated_at 이 안 갱신되는 것도 v1 결함) + `enable/force row level security` + `revoke all from anon, authenticated` + `comment on`.
   컬럼: `user_id` PK→auth.users cascade · `display_name` · `email` · `phone`(자기 신고, **키가 아니다**) · `phone_verified_at` · `marketing_consent_at`(R10) · 타임스탬프. **identities 테이블 불필요** — `auth.identities` 가 담는다.
2. `lib/auth-server.ts` — `@supabase/ssr` `createServerClient`(서버 전용 `SUPABASE_ANON_KEY` + 쿠키 어댑터) + `getSessionUser()`. **브라우저 클라이언트는 만들지 않는다.**
3. 라우트: `app/api/auth/signin/[provider]/route.ts` · `callback/route.ts`(`exchangeCodeForSession` → service_role 로 profiles upsert → next 로 302) · `signout/route.ts`.
   ⚠ **두 도메인 문제**: 세션 쿠키는 발급 호스트에만 붙는다 — lazy-club.com 에서 로그인해도 lazyday-bookclub.com 은 비로그인이다. 도메인별 독립 로그인으로 갈지, 한쪽을 정본으로 삼을지 **설계해서 계획대로 실행**하고 결과를 DECISIONS 에 남긴다.
4. **진입점** (철칙 1 — 프리뷰 승인 후 병합):
   - **탑네비**: `app/(main)/lazyclub/Shell.tsx:136-147` 헤더 우측에 **이미 `aria-label="계정"` 버튼이 있다**(현재 `onClick={() => notify()}` 안내 토스트). 새 요소를 만들 게 아니라 **이 버튼을 실링크로 바꾸는 최소 변경**이면 된다.
   - **`/mypage` 라우팅**: `middleware.ts:72` 의 `LAZYCLUB_OPEN_PREFIXES` 에 **`"/mypage"` 를 추가하지 않으면 lazy-club.com/mypage 는 `/lazyclub/mypage` 로 rewrite 되어 404 다.** 슬러그 `mypage` 는 운영자 확정 완료(url-policy §1 — "국내 관습 따를게") → `docs/url-policy.md` §5 이력에 행 추가. `robots.ts` 에 `/mypage`·`/lazyday/mypage` disallow(개인 화면).
   - **마이페이지 위치**: 라우트는 `/lazyday/mypage`(북클럽 트리)에 두고 두 도메인이 깔끔한 `/mypage` 로 rewrite 되게 한다 — checkout 이 이미 쓰는 방식과 동일.
   - **결제 페이지 분기**: `app/(main)/lazyday/checkout/page.tsx` 주문자 정보 위에 "로그인하고 계속 / 비회원으로 계속". **비회원 결제를 막지 않는다**(R11). 로그인 시 profiles 로 프리필하되 **신청서 인계값(`lz-orderer` sessionStorage)이 있으면 그쪽 우선** — 기존 확인 행(`.orderer` + 수정) UI 재사용.
5. **user_id 스탬핑** — v1 이 지목한 `/api/payment/prepare` 경로는 **원장에 아무것도 쓰지 않는다**(그 파일 주석이 "기록은 승인 확정 시 한 번"이라고 명시). 실제 `recordOrder` 호출부는 **`app/api/lazyday/payment/confirm/route.ts:114`** 와 **`app/api/payment/toss-webhook/route.ts`** 둘이다 → `RecordOrderInput` 에 `userId?` 를 추가하고 이 두 곳에서 넘긴다. 신청은 apply 라우트에서 세션이 있으면 `recordApplication({userId})`.
6. `app/(main)/lazyday/mypage/page.tsx` + `app/api/lazyday/mypage/*` — 내 주문·내 신청·주문 연결 폼. 서버 라우트가 세션→user_id 필터로 R13("본인은 자기 행만")을 강제.
7. `app/api/lazyday/mypage/link-order/route.ts` — 입력 orderNo+phone 이 `orders.order_no`·`orderer_phone` **둘 다 일치할 때만** user_id set + 같은 order_no 의 applications 연결. **전화 단독 매칭 금지**(R11 문언).
8. 검증: dev + localhost redirect 로 **실계정 카카오·구글 로그인 실측**(auth.users·auth.identities·profiles) → 프리필·스탬핑·link-order 4조합 → **두 도메인 각각 `/mypage` 200** → preview 스크린샷 승인 → 프로덕션 배포 후 운영자 계정 1회.

### P4b. 네이버 (후속 · spike 게이트)

1. **dev spike(반나절 한도)**: Supabase **Custom OAuth2 Provider**(2026-04 출시)에 네이버 등록(authorize `https://nid.naver.com/oauth2.0/authorize` / token `…/token` / userinfo `https://openapi.naver.com/v1/nid/me`) → 실로그인 → **userinfo 가 `{resultcode, message, response:{id,name,email}}` 로 중첩**되어 있는데 필드 매핑이 이를 소화하는지 확인. 성공 기준: auth.users 생성 + identity + 이름/이메일 수신.
2. 성공 → provider 추가(콜백·profiles upsert 는 공통) → 검증·배포.
3. 실패 → **폴백**: 서버 수동 OAuth + `admin.generateLink(magiclink)`+`verifyOtp` 로 세션 발급, 이메일 미동의 계정은 합성 이메일. **공수 재보고 후 진행.**

---

## P5. Admin 상태 관리 (Stage B — 정합 확인 + 운영자 합의 후에만)

- 전제: P3 가동 후 2~4주 시트↔DB 정합 확인 → **운영자에게 보고하고 "시트 '진행 상태' 기입 중단" 합의를 받은 뒤에만.**
- PATCH(status 변경, 변경 이력 남김) + 화면 드롭다운(미진행/미결제/결제완료/환불/탈락 ↔ received/unpaid/paid/refunded/rejected).
- 시트 칼럼 헤더에 "→ admin 에서 관리" 메모(수동 1회). **역동기화 없음.** 반배정·비고는 Stage C(범위 밖).

---

## 운영자 대기 포인트

| 시점 | 내용 |
|---|---|
| **P0 직후** | 방침 개정 문구 확인 (제5조 Supabase·제6조 국외이전) |
| **P1 착수 전** | **Supabase MCP 커넥터 재연결** — 없으면 P1 이 시작조차 안 된다 |
| P1 중 | bookclub 보유기간 정책 택1(seasonEndsOn 신설 vs 접수+1년) |
| P2.5 | 시트 메뉴에서 **시간 트리거 1회 등록** + 스크립트 속성 `SITE_URL` 입력 / 후기 시트 처리 방식 택1 |
| P4-0 | 카카오·구글 개발자 앱 등록 + 키 / 약관·방침 2차 개정 문구 확인 / 만 14세 정책 |
| P4a | 두 도메인 세션 정책 확인 · 프리뷰 스크린샷 승인 |
| P5 | "시트 '진행 상태' 기입 중단" 선언 |

## 실행 시작

이 문서가 곧 작업 지시서다. 새 세션은 **P0 → P1 → P2 → P2.5 → P3 → P4a → (P4b) → P5** 순으로,
각 Phase 를 독립 PR 로 낸다. 위 '불변 원칙' 9개는 전 구간에 적용된다.

⚠ **P1 은 Supabase MCP 커넥터가 붙어 있어야 시작된다** — 세션 시작 시
`ToolSearch "select:mcp__Supabase__apply_migration"` 로 확인하고, 없으면 운영자에게 알리고 대기할 것.

⚠ 이 문서는 2026-09-01 시점의 코드를 근거로 쓰였다. 인용된 파일·줄 번호는 실행 시점에 어긋날 수 있으니
**고치기 전 해당 파일을 직접 열어 확인**하고, 문서와 코드가 다르면 코드를 믿고 문서를 고쳐 같은 PR 에 담는다.
