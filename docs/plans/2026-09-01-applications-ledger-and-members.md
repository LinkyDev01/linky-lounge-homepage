# 접수 이중화(시트+DB) + 회원(카카오·구글·네이버) + DB 관리 화면 — 실행 계획 v3

> **v3 = 사실검증 완전 반영판.** 초안을 레포와 6갈래로 대조하고 3인이 적대적으로 비판해
> **blocker 24건 + 함정 100여 건**을 잡아 전부 반영했다. 운영자 지시: "모두 수정·반영·보완 후 계획 반영".
>
> **초안이 틀렸던 것 — 되살리지 말 것**: 부분 유니크 인덱스+upsert / `/api/payment/prepare` 에서 recordOrder /
> `@supabase/ssr` 설치돼 있음 / review 를 스윕 범위에 포함 / GAS 성공=HTTP 200 / 방침 개정을 P4 로 미룸 /
> 삽입 지점이 라우트당 2곳 / 진입점이 '텍스트 링크 추가' / 접수 9종.
>
> **실행 전 필독**: ① `CLAUDE.md` ② `docs/DECISIONS.md` ③ `supabase/README.md`
> ④ `app/(main)/lazyday/preview/commerce-journey/Rules.tsx`(R1~R13 원문) ⑤ `docs/url-policy.md`
>
> **브랜치**: Phase 마다 **새 이름**으로 — `git fetch origin main && git checkout -B claude/<주제> origin/main`.
> 병합된 브랜치명을 다시 밀지 않는다(CLAUDE.md: 병합된 PR 재사용 불가).

---

## Context

접수 데이터가 Google 시트(GAS)에만 저장된다 — DB(Supabase)에 흔적이 남는 건 선결제 원데이 하나뿐이다.
운영자 지시(2026-09-01): ① **접수 전부** 시트+DB 이중화(시트 유지) ② **회원 기능** ③ **DB 관리 화면**.
추가 확정: **영구결손 금지**, 로그인 진입점은 **탑네비 우측 상단 + 결제 페이지 회원/비회원 분기**.

설계 정본(commerce-journey)의 미구현 칸을 채우는 일 — **R6**(applications 별도 테이블) · **profiles**(북클럽·레이지클럽 공통 회원 원장, 기확정) · **R11**(비회원 유지, 사후 연결은 주문번호+전화 둘 다 일치).

**이 작업이 건드리지 않는 규칙(한 줄로 못박는다)**: R3(참가자≠주문자 — 대리 결제 분리) · R4 · R5(refunds) · R7(holds) 은 **범위 밖**이다. 다음 세션이 "미구현 칸을 채운다"는 말에 끌려 손대지 말 것.

## 접수 지도 (정정 — 초안의 '9종'은 틀렸다)

| kind | 폼 | 라우트 | GAS 핸들러 | 시트 |
|---|---|---|---|---|
| bookclub | `lazyday/apply` | `/api/lazyday/apply`(패스스루) | handleApply | 북클럽·신청현황 |
| notify | `NextSeasonNotify` | 〃 | handleNotify | 북클럽·4기 알림 |
| coffeebar | `lazyclub/meetings/dm-gd` | 〃 | handleCoffeeBar | 레이지클럽·커피앤바 |
| oneday | `lazyclub/meetings/[slug]/apply`(orderId 없음) **+** `lazyday/checkout/success`(orderId 있음) | 〃 | handleOnedayApply | 레이지클럽·원데이 토크 |
| interview_phone | `apply/interview/schedule` | `/api/lazyday/interview/book`(구조분해) | handlePhoneBooking | 북클럽·전화 인터뷰 |
| interview_written | `apply/interview/written` | `/api/lazyday/interview/written` | handleWritten | 북클럽·서면 인터뷰 |
| review | `lazyday/review` | `/api/lazyday/review`(원시 fetch) | **별도 프로젝트** `gas/review.gs` | 후기 별도 파일 |

**라우트 경유 7 kind / 라우트 4개.** 그 밖에 **`lazyday/review/week1/page.tsx:52-60` 은 브라우저가 하드코딩 GAS URL 로 `mode:"no-cors"` 직접 POST** 한다 — 서버를 안 거치고 성공·실패 판별도 불가하다. **이중화 범위 밖**으로 명시하고 손대지 않는다(라우트화는 후속 판단).

## 운영자 확정 (2026-09-01 문답)

| 항목 | 확정 |
|---|---|
| 이중화 범위 | **접수 전부** (시트 저장 유지) |
| 로그인 사업자 | **카카오+구글 먼저, 네이버 후속** |
| 관리 | **DB 관리 화면까지** (정본 전환은 단계적) |
| 결손 | **영구결손 금지** |
| DB 적용 경로 | **Supabase MCP 재연결** |
| 개인정보처리방침 | **지금 바로 단독 배포**(P0) |
| 마이페이지 주소 | **`/mypage`** ("국내 관습 따를게") |

---

## 불변 원칙 (전 Phase 공통)

1. **GAS(시트) = 1차 정본.** DB 기록 실패가 접수 응답을 깨뜨리지 않는다 — `lib/orders.ts:22-24` 의 `LedgerResult`(던지지 않음 / env 미설정 시 `{ok:true,skipped:"disabled"}` / 23505=duplicate 성공).
2. **GAS 성공 판정은 HTTP 가 아니다.** 실패도 **200 + `{success:false}`** 로 온다 — 화이트리스트 밖 type(`gas/linkyincdev-main.gs:278`), 필수항목 누락(`:291`·`:567`), **슬롯 중복(`:579`)**. `data?.success !== false` 일 때만 기록한다. 안 지키면 시트에 없는 **유령 행**이 쌓여 P3 대조가 무의미해진다. (302 유실 경로는 실행 확정이므로 무조건 기록 + `gasBodyLost:true`.)
3. **RLS 정책 0개 유지.** enable+force+revoke, 브라우저 supabase-js 금지, 조회는 서버 라우트(service_role) 경유. **`NEXT_PUBLIC_SUPABASE_*` 절대 금지.** ⚠ 새 테이블마다 Supabase 어드바이저 **INFO 가 1건씩 는다 — 의도된 상태다**(DECISIONS:169). 이걸 결함으로 오인해 `create policy` 를 넣으면 `supabase/README.md:122-124` 의 명시 금지를 정면으로 어긴다.
4. **마이그레이션**: append-only, **dev(`kfqtzxxtwokouvoqpebq`) → prod(`qdxnxdfebkgoxeqzfmji`)**. 적용은 **Supabase MCP** — 세션 시작 시 `ToolSearch "select:mcp__Supabase__apply_migration"` 로 확인하고 **없으면 운영자에게 알리고 대기**. 적용 후 **`supabase/README.md` §4 표(`| 파일 | 내용 | dev | prod |`)에 행 추가는 필수** — SQL Editor 로 적용하면 `supabase_migrations.schema_migrations` 에 안 남아(DECISIONS:49 실측) 그 표가 **적용 이력의 유일한 정본**이다.
5. **마이그레이션 SQL 관례**: 배너 주석 `-- 000N · <제목>` + '해소하는 것 / 지키는 결정' 문단(전례 `core_orders.sql:1-23`) → applications 는 **0005**, profiles 는 **0006**. `create extension if not exists pgcrypto;`(gen_random_uuid 쓰는 전례 파일이 매번 선언) · `create table/index if not exists` · `drop trigger if exists … ; create trigger …` · **`comment on` 으로 R# 근거**(인라인 `--` 는 DB 에 안 남는다).
6. **GAS 변경이 있는 Phase 는 §6 순서**: `gas/` main 병합 → `gas-deploy.yml` success 확인 → 프론트 병합. ⚠ 착수 전 **`node scripts/gas-sync.mjs check`** 로 드리프트 확인(걸리면 `pull` → 커밋이 선행). ⚠ 워크플로가 `script.googleapis.com` 503 으로 실패한 실사고가 있고(DECISIONS:45) **세션에는 재실행 권한이 없다** — 막히면 운영자에게 재실행을 요청하고 프론트 병합을 보류한다.
7. **검증에서 시트를 오염시키지 않는다**: `INTERVIEW_GAS_URL` 미설정 목업 모드 + dev Supabase env. ⚠ 함정 3개 — ① 폼에 **`sim` 테스트 모드**가 있어 `/lazyday/admin/simulate` 경유로 열면 라우트를 아예 안 부른다(조용히 0행) ② **프리뷰 apply 폼(`preview/apply/**`)은 fetch 자체가 없다** — 반드시 실사이트 경로로 ③ 레이지클럽 트리는 Playwright 에서 폰트가 매달리므로 외부 요청 차단 필수.
8. **`npm run build` 는 타입 게이트가 아니다** — `next.config.mjs:3-5` 가 `typescript:{ignoreBuildErrors:true}`. 실제 게이트는 **`npx tsc --noEmit` 하나뿐**이다.
9. **프리뷰 퍼스트(철칙 1) 경계** — P1·P2·P2.5·P3(라우트·DB·GAS·admin)은 직접. **P4 의 고객 대면 UI**(셸 진입점·`/mypage`·checkout 분기)는 **브랜치 프리뷰 + 390px 스크린샷 승인 후 병합**.
10. **로그·응답에 개인정보 금지** — kind·sid·건수·에러 코드까지만. GAS Logger, backfill 실패 로그, PR 본문에 붙이는 검증 로그까지 적용(dev 목업 모드는 body 전문을 `console.log` 한다).
11. **문서 갱신 의무** (CLAUDE.md §8) — 각 Phase 병합 커밋에 함께: **DECISIONS append** / **CLAUDE.md §4** 에 새 공유 자산 등재(`lib/applications.ts`(라우트 4곳 공유)·`lib/auth-server.ts`·`Shell.tsx`·`applications` 테이블) / **§5** 에 새 함정 / **P1 에서 `Rules.tsx` 의 R6 `ok:false` → `true`**(순수 문서 컴포넌트, 결제 무관) / **P4 에서 DECISIONS '대기 중' 불릿의 '인증 방식·적용 시점' 2건 제거**(머리말이 같은 커밋을 요구).

---

## P0. 개인정보처리방침 Supabase 수탁자 고지 (즉시, 단독 PR)

운영자 확정: **지금 바로.** 2026-08-18 주문 원장 배선 때부터 이미 사실과 달랐다.

- `app/(main)/lazyday/privacy/page.tsx` 제5조 위탁 목록에 추가 — 현재 Google LLC·Vercel·솔라피·토스페이먼츠 4곳뿐, **Supabase 없음**: `<li>Supabase, Inc.: 주문·신청 정보의 저장·관리 (데이터베이스 호스팅)</li>`
- 제6조(국외 이전): 프로젝트 리전이 **ap-northeast-2(서울)** — 고지 필요 여부를 운영자에게 확인.
- 제12조 시행일 갱신.
- ⚠ **제12조가 "시행 7일 전부터 고지"를 약속한다** — 공지 시점을 운영자와 맞춘다.
- ⚠ 문구는 운영자 소유. 초안 제시 → 확인 후 반영.

---

## P1. `applications` 테이블 + 패스스루 라우트 이중화

### P1-1. 마이그레이션 `supabase/migrations/20260901HHMMSS_applications.sql` (0005)

```sql
create extension if not exists pgcrypto;

create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  sid           text unique,                 -- 제출 ID — 시트와 공유하는 멱등 키 (P1 부터 발급)
  kind          text not null check (kind ~ '^[a-z_]{1,32}$'),  -- 형태만 검사 (아래 근거)
  name          text,
  phone         text,
  payload       jsonb not null default '{}',
  payload_src   text not null default 'route' check (payload_src in ('route','sheet')),
  order_no      text,
  user_id       uuid references auth.users(id) on delete set null,  -- R11
  cohort        text,
  traffic_src   text,
  status        text not null default 'received' check (status in
                ('received','unpaid','paid','refunded','rejected','done')),
  status_note   text,
  ends_on       date,
  purge_after   date not null,               -- ⚠ NOT NULL
  purged_at     timestamptz,
  gas_body_lost boolean not null default false,
  dedup_key     text unique,                 -- ⚠ 부분 인덱스 아님
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
         dedup_key=null,                     -- ⚠ 전화번호 원문이 여기 들어 있다
         purged_at=now()
   where purge_after < current_date and purged_at is null;
  get diagnostics removed = row_count;
  return removed;
end; $$;
revoke execute on function public.purge_expired_applications() from public, anon, authenticated;
grant  execute on function public.purge_expired_applications() to service_role;

-- 단건 즉시 파기 (삭제 요청 — R9 후단·방침 제3조 1호·제8조)
create or replace function public.purge_application(target uuid) returns boolean
  language plpgsql security definer set search_path = public as $$
begin
  update public.applications
     set name=null, phone=null, payload='{}', status_note=null, dedup_key=null, purged_at=now()
   where id = target and purged_at is null;
  return found;
end; $$;
revoke execute on function public.purge_application(uuid) from public, anon, authenticated;
grant  execute on function public.purge_application(uuid) to service_role;

alter table public.applications enable row level security;
alter table public.applications force  row level security;
revoke all on public.applications from anon, authenticated;

comment on table  public.applications is 'R6 · 신청·인터뷰 접수 원장 (주문 아님). 시트가 1차 정본, 이 표는 이중화';
comment on column public.applications.sid         is '시트와 공유하는 제출 ID — P2.5 스윕의 멱등 키';
comment on column public.applications.payload_src is 'route=라우트가 보낸 body 원문 / sheet=스윕이 시트 헤더에서 역구성';
comment on column public.applications.purge_after is 'R9 · 모임 종료+1년, 산출 불가 시 접수+1년';
comment on column public.applications.user_id     is 'R11 · 비회원이 기본이라 nullable';
```

pg_cron: 전례(`20260818150000`) 복제 — `do $$ begin perform cron.unschedule('r9-purge-applications'); exception when others then null; end $$;` → `select cron.schedule('r9-purge-applications','30 18 * * *', $$select public.purge_expired_applications()$$);`

**설계 판단 4건 (근거와 함께 못박는다)**
1. **`dedup_key`·`sid` 는 컬럼 unique.** 부분 유니크 인덱스는 PostgREST 가 술어를 못 보내 **42P10** 으로 실패하고, 그 실패는 LedgerResult 규율에 삼켜져 **에러 없이 영구히 작동하지 않는다.** Postgres 는 NULL 을 서로 distinct 로 보므로 컬럼 unique 로도 의미가 같다(전례 `funnel_events.event_id`).
2. **`purge_after` NOT NULL.** null 이면 그 행의 개인정보가 **영원히 남는다**(`participants` 와 달리 전 접수가 들어오는 테이블이라 규모가 다르다). 산출 불가 시 `submitted_at + 1년` 폴백. `lib/orders.ts:69-74` 의 **`purgeAfter(endsOn)` 가 이미 +1년을 정확히 계산**한다 — 새로 쓰지 말고 export 해서 재사용.
3. **`kind` 는 열거 check 가 아니라 형태 check.** 열거로 두면 스키마와 `classifyApply` 두 곳에 값 집합이 중복돼 어긋나는 순간 **23514 로 조용히 실패**한다. `funnel_events` 가 같은 문제를 "화이트리스트는 애플리케이션이 강제, DB 는 형태만 검사"(`funnel_events.sql:28-29`)로 풀었다 — 같은 판단을 따른다.
4. **`payload_src`** 로 라우트 기록과 스윕 보정을 구분한다. 같은 컬럼이 '원문 스냅샷'과 '시트 역구성'을 동시에 뜻하면 대조 감사의 근거가 흐려진다.

**purge_after kind 별 정책** (코드 상수 + `comment on` 양쪽)

| kind | ends_on | purge_after |
|---|---|---|
| oneday · bookclub | 모임/시즌 종료일 | ends_on + 1년 (R9) |
| coffeebar · interview_* · review · notify | null | **접수 + 1년** |

⚠ **ends_on 산출 함정**
- `meetingEndsOn(code)`(`lib/orders.ts:58-66`)는 **`dNNN` 주문 코드만** 받는다 — meetingSlug 가 아니다. oneday 두 경로 어느 쪽도 dNNN 을 담지 않는다 → slug 면 `meetingOrderCode(slug)`(`one-day-config.ts:243`), orderId 면 `parseOrderCodes`(`lib/order-catalog.ts:112`) 경유.
- **`season-config.ts` 에 시즌 종료일의 기계 판독 필드가 없다**(있는 건 표기용 `periodLabel`·`fifth.date`·`deadline`=마감일). 택1: **(권장) `seasonEndsOn()` 신설**(`seasonYear()` + `SEASON.fifth.date` 파싱) / bookclub 도 접수+1년 보수 기본.
- ⚠ **화면 고지가 세 갈래로 갈려 있다** — 북클럽 신청·커피앤바는 "**동의 철회 시까지**"(`apply/page.tsx:628`, `CoffeeBarForm.tsx:465`), 레이지클럽 모임은 "모임 종료 후 1년", 방침 제3조는 "기수 종료 후 1년". **코드가 고지와 어긋나면 안 된다** — 정책 표를 확정하기 전에 운영자에게 문구 통일을 확인받는다.
- ⚠ **삭제 요청 즉시 파기**는 cron 으로 충족되지 않는다 → 위 `purge_application(uuid)` + P3 운영 절차.
- ⚠ **R8(5년 보존) 교차**: oneday payload 에 주문·금액이 있을 수 있으나 **금액의 정본은 `orders`/`order_items`** 이고 applications 에는 `order_no` 가 남으므로 실질 결손 없음 — "applications 는 5년 보존 대상이 아니다"를 주석에 명시.

### P1-2. `lib/applications.ts` 신설

`lib/orders.ts` 규격 복제(머리 주석: 왜 생겼나 / 원칙 / 스키마 경로 / 규칙 링크).

- **선행**: `lib/orders.ts` 의 `normalizePhone`(`:52`)·`meetingEndsOn`(`:58`)·`purgeAfter`(`:69`)는 **module-private → export** 로. (`lib/payments/orders.ts:23` 의 재수출 shim 은 건드릴 이유 없음.)
- `classifyApply(body): Kind | null` — `type` → kind. **미지 type·`apply_draft`·`admin_*` 는 null(스킵 + `console.warn`)**. ⚠ `apply_draft` 는 `SAVE_DRAFT=false` 로 꺼져 있는 죽은 경로이고 GAS 도 거절한다 — **이 경로에서는 sid 발급도 하지 말 것**(시트에 안 남아 영구 미보정 행이 된다).
- `recordApplication({kind, body, sid, orderNo?, userId?, gasBodyLost?, payloadSrc?})` — `supabaseAdmin()` null → skipped:"disabled" / name·phone 은 **kind 별 추출 맵**(라우트마다 필드명이 다르다. **review 는 phone 이 아예 없다** — 전화 기반 매칭에서 영구히 제외됨을 주석에) / upsert 는 `onConflict:"sid"`(+`ignoreDuplicates`) 또는 written 은 `dedup_key` / 전체 try/catch → `{ok:false,error}`.
- **`dedup_key` null 가드**: `const np = normalizePhone(phone); const dedupKey = np ? \`written:${np}\` : null` — ⚠ `normalizePhone` 은 **9자리 미만이면 null** 이라 가드 없이 결합하면 `"written:null"` 이 되어 비정상 번호 접수가 전부 서로를 덮어쓴다(=유실). GAS 의 `normPhone`(`gas/…:184`)은 길이 컷오프가 없다는 차이도 주석에.
- **`traffic_src` 는 coalesce 의미로** — GAS written 재제출은 1~9열만 갱신해 **최초 유입을 보존**한다(`gas/…:714-718` "최초 유입이 공이다"). 무조건 덮어쓰면 시트와 값이 갈린다.
- **`recordSafe(kind, body, opts)` 헬퍼를 함께 둔다** — 삽입 지점이 **라우트당 3곳(dev 목업 / GAS 성공 / 302 유실) × 라우트 4개 = 10~12곳**이라 복붙 누락이 난다.
- **타임아웃**: `.abortSignal()` 은 **쿼리 빌더 인스턴스별로** 걸어야 한다(postgrest-js 가 빌더에 저장). 5s 권장하되 ⚠ **응답 지연의 주범은 DB 가 아니다** — `gasPostJson` 의 최초 POST 에는 타임아웃이 없고(`lib/gas.ts:75-80`) 302 결과 재조회가 **8s×3 + 대기**라 최악 27초까지 간다. **P1 착수 전 Vercel 함수 타임아웃(`vercel.json`/route segment config)을 확인**할 것.
- ⚠ `supabaseAdmin()` 은 모듈 레벨 캐시 + env 를 로드 시 1회만 읽는다 — **로컬 검증에서 env 를 바꾸면 dev 서버 재시작** 필요.

### P1-3. `app/api/lazyday/apply/route.ts`

- 삽입 **3지점**(dev 목업 / GAS 성공 / 302 유실). 성공 경로는 **불변 원칙 2**(`data?.success !== false`), 유실 경로는 무조건 + `gasBodyLost:true`.
- `sid = crypto.randomUUID()` 를 **P1 부터** 발급해 GAS payload 에 함께 보낸다(GAS 가 아직 무시해도 무해).
- ⚠ `markSubmitted` 와 **실패를 한 덩어리로 묶지 말 것**(그건 orders 쪽 기존 로직이다). 로그 접두어도 `[lazyday/apply]` vs `[apply-ledger]` 로 분리.

### P1 검증·배포

0. **로컬 PG16 리허설** — 이 환경에 PostgreSQL 16 + pgcrypto 가 설치돼 있다(DECISIONS:170 에 같은 선례). 자격 없이도 제약·파기 함수·재실행 안전성을 먼저 실증한다.
1. **dev 적용 전** 운영자에게 dev·prod 스키마 대조를 부탁(README §3 표가 낡아 8/18 문구 그대로다) → MCP 로 dev 적용 → insert·unique 충돌·`purge_expired_applications()`·`purge_application()`·anon revoke 실측 → prod → **README §4 표 갱신**.
2. 로컬 목업 + dev Supabase → **실사이트 경로**로 4폼 제출(sim 금지·프리뷰 폼 금지·레이지클럽은 외부 차단) → kind·payload·purge_after·sid 확인 + **`{success:false}` 흉내로 유령 행이 안 생기는지**.
3. `npx tsc --noEmit`(유일한 타입 게이트) → PR → 병합 → 프로덕션 확인. **Rules.tsx R6 → ok:true**, CLAUDE.md §4, DECISIONS 를 같은 PR 에.

---

## P2. 전용 라우트 3종

- **`interview/book`** — kind `interview_phone`. ⚠ GAS 응답을 검사하지 않고 흘린다(`:44-45`). **슬롯 중복이 흔한 경로**라 불변 원칙 2 가드가 특히 중요.
- **`interview/written`** — kind `interview_written`, dedup_key 가드 적용. ⚠ **catch 가 실패해도 `{success:true}` 를 돌려준다**(`:53-55`, 주석에 'UX 우선'). 시트에도 DB 에도 안 남는 **진짜 영구결손 경로**이고 스윕으로도 복구 불가(시트에 행이 없다) → **catch 안에서도 `recordApplication` 을 호출**해 DB 를 유일한 흔적으로 남긴다.
- **`review`** — kind `review`. ⚠ 이 라우트만 구조가 다르다: `lib/gas.ts` 미사용, 원시 `fetch(redirect:"follow")`, env `REVIEW_GAS_URL`, **302 유실 판정 없음**, catch 가 `{success:true}` 로 삼킴 → written 과 같은 처리.
- 검증: P1 과 동일. 독립 PR.

---

## P2.5. 결손 0 보정 루프

**원리**: 접수마다 sid(P1 부터) → 시트·DB 공유 → GAS 시간 트리거 스윕이 시트를 훑어 보정 엔드포인트로 밀고 sid upsert → **시트에 있으면 DB 에 반드시 생긴다.**

⚠ **제약 8건 — 설계를 여기에 맞춘다**
1. **GAS→우리 API 인증 선례가 없다.** 기존 ADMIN_TOKEN 계약은 **우리 사이트 → GAS 한 방향**뿐이고(GAS 아웃바운드는 전부 solapi), 그 두 값이 불일치했던 사고 기록도 있다(DECISIONS:321). **역방향 전용 토큰을 새로 두는 편이 안전** — 재사용하려면 불일치 시 스윕이 통째로 죽는다는 점을 감수.
2. **GAS 가 우리 도메인을 모른다** — 스크립트 속성 `SITE_URL` 신설(운영자 1회 입력).
3. **후기(review)는 스윕 범위 밖으로 확정한다** — `gas/review.gs` 는 별도 프로젝트이고 `gas/project.json` 매핑에 없어 **자동 배포 대상이 아니다**. 게다가 소유 계정이 다를 수 있어(메인=linkyincdev / review=linkylounge 계열) `openById` 가 통할지도 미검증이다. 후기는 P2 라우트층 이중화만으로 두고, **'영구결손 금지'가 후기에는 성립하지 않음을 명시**한다.
4. **서면 재제출이 sid 등식을 깬다** — `handleWritten` 은 `setValues(existingRow,1,1,9)` 로 **1~9열만** 갱신(의도적 — 유입 출처 보존)이라 뒤쪽 '제출 ID' 는 **최초 sid 로 남는다**. → **written 은 전화번호 파생 결정적 sid** 를 쓰거나, GAS 재제출 분기에서 '제출 ID' 셀을 명시적으로 덮어쓴다.
5. **탭마다 쓰기 방식이 다르다** — 4개만 `ensureColumn`+`colIndexMap`, `handlePhoneBooking` 은 고정 6칸 `prependRow`(`:593`), written 신규는 9칸 배열 + 별도 셀 쓰기.
6. **정렬을 믿을 수 없다** — 전화 인터뷰는 `sortPhoneByInterview()` 로 **인터뷰 일시 순** 재정렬, 다른 탭도 메뉴로 재정렬, written 재제출은 오래된 행을 제자리 갱신. → **"최근 N행" 금지**, **'제출 ID 가 있고 아직 보정 안 된 행'을 전체에서 훑는다**.
7. **`lazyclubSs()` 부작용**(`:136-155`): 속성이 비었거나 파일이 지워졌으면 **새 스프레드시트를 만들고 운영자에게 메일까지 보낸다** — 시간 트리거가 빈 시트를 양산할 수 있다. **스윕은 속성을 직접 읽어 값이 없으면 no-op.** `ensureColumn` 도 빈 시트에서 예외를 던지니 없는 탭·빈 탭은 건너뛴다.
8. **GAS 할당량** — 트리거 1회 6분 상한, UrlFetchApp 페이로드 크기. 신청현황은 전 기수 누적이라 전 행 스캔 + 개인정보 rows 를 한 번에 POST 하면 위험 → **배치·페이지네이션·`muteHttpExceptions:true` + 상태코드 로깅**. 반복 실패 시 Apps Script 가 소유자에게 실패 메일을 자동 발송한다(운영자 소음).

### 순서
1. **GAS 선배포**: 6종 핸들러가 `d.sid` 를 `ensureColumn("제출 ID")` 로 기록(쓰기 방식 차이 반영) + `sweepApplicationsToDb()` + `onOpen` 메뉴 항목. **service_role 키는 GAS 에 넣지 않는다.** → 병합 → `gas-deploy.yml` success 확인.
2. **프론트**: `app/api/lazyday/admin/backfill-applications/route.ts`(토큰 검증 → sid upsert `ignoreDuplicates`, `payload_src:'sheet'`, sid 없는 구행 스킵, **응답은 건수만**) + health Check.
3. **운영자**: **스프레드시트 새로고침 → [메뉴] → 트리거 켜기**(onOpen 은 파일을 열 때만 실행된다) + 스크립트 속성 `SITE_URL`·토큰 입력.
4. 검증: dev 에서 모의 rows 2회 POST → 행 1개(멱등). `gas-sync check` → 실배포 후 Logger 로 스윕 1회 수동 실행.

⚠ **리스크 정정**: 이 루프가 없애는 것은 **'GAS 성공 + DB 실패'** 뿐이다. **GAS 자체 실패는 시트에도 DB 에도 안 남는다** — 그 경로(written·review catch)를 P2 에서 DB 기록으로 막아야 "영구결손 없음"이 성립한다. `gasPostJson` 은 재전송하지 않으므로 같은 sid 가 시트에 두 번 찍히는 일은 원칙적으로 없다(`ignoreDuplicates` 는 스윕 중복 호출 방어용).

---

## P3. Admin 조회 전용 (Stage A — 쓰기 API 미배포)

- `app/api/lazyday/admin/applications/route.ts` — **GET only**. 쿠키 `lazyday_admin`===`ADMIN_SECRET`, `if (!sb) return {enabled:false, rows:[]}`, 필터(kind·기간·이름/전화), 페이지네이션, snake→camel 은 라우트에서.
- `app/(main)/lazyday/admin/applications/page.tsx` — status 페이지 패턴. **status 는 렌더링하지 않고** "상태 정본: 구글 시트" 배지.
- **대조 숫자의 주체를 정한다** — "최근 7일 kind 별 건수"는 DB 값일 뿐이라 시트는 운영자가 눈으로 세야 한다. **스윕 응답의 `received/upserted/skipped` 를 무개인정보 행으로 남겨** DB 안에서 대조가 닫히게 한다. health 의 "미보정 건수" 산식도 정의할 것.
- **즉시 파기 수단** — `purge_application(uuid)` 를 admin 단건 버튼 또는 문서화된 절차로.
- ⚠ **R13 후반부**("관리자는 service_role 로 우회하되 **감사 로그를 남긴다**", `Rules.tsx:114`) — 이 화면은 이름·전화를 조회하면서 열람 기록을 남기지 않는다. 남기지 않기로 한다면 **그 판단과 근거를 계획서·DECISIONS 에 명시**해 R13 과의 차이를 드러낸다.
- 검증: preview + Playwright 스모크.

---

## P4. 회원 — P4a 카카오+구글 → P4b 네이버(후속)

### P4-0. 선행 (P1 착수와 **동시에** 안내 — 리드타임이 길다)

- **의존성**: `@supabase/ssr` **미설치** → `npm i @supabase/ssr`. ⚠ **락파일이 둘이다** — `package-lock.json`(실제) + `pnpm-lock.yaml`(96바이트 빈 스텁). `packageManager` 필드도 `vercel.json` 도 없어 **Vercel 이 pnpm 을 감지해 빈 락파일로 설치를 시도할 위험**이 있다. 의존성 추가 전에 이 상태를 정리할지 판단할 것.
- **약관 개정** — 현행 약관에 **회원 조항이 없다**: `TermsBody.tsx:90` 제7조① "**별도의 회원가입 없이 구매할 수 있습니다**"가 '회원'이 나오는 유일한 문장이고 제2조 정의에 '회원'·'계정'이 없다. 수정 지점은 **`app/(main)/lazyday/terms/TermsBody.tsx` 한 곳**(lazyclub/terms 가 직접 import — 사본 금지 명시). ⚠ **제3조③: 7일 전 공지, 불리 변경은 30일 전** — 회원 조항 신설은 30일 해석 여지가 있다.
- ⚠ **용어 충돌**: `/lazyday/policy`(기수제 약관)의 '회원'은 **기수 참가자**를 뜻하는데, 설계 정본 용어집은 "회원 = 소셜 로그인 계정 보유자"다. 같은 단어가 두 문서에서 다른 뜻이 된다 → 정리(예: 계정 보유자='회원', 기수 참가자='참가자')를 개정에 포함.
- **만 14세** — 소셜 로그인은 나이를 묻지 않는다(법 제22조의2). `docs/community-spec-2026-07.md:73` 이 이미 1차 과제로 적어 뒀다 → **최초 로그인 직후 확인 체크(시각 저장)** 를 약관 개정과 같은 배포에.
- ⚠ **노선 확인 필요**: `community-spec-2026-07.md:10·32` 는 "**공개 '회원가입' 버튼이 없는 사이트** — 인터뷰 합격자에게만 문이 열리는 구조가 '선별의 서사'의 기술적 완성형"이라고 적었다. 이번 계획은 탑네비에 **상시 공개 로그인 입구**를 둔다. 명세는 초안·미결이라 확정 번복은 아니지만 **브랜드 서사 판단이므로 운영자에게 확인**한다.
- **운영자 준비물**: Kakao/Google(후속 Naver) 개발자 앱 + 키, Redirect URI `https://<ref>.supabase.co/auth/v1/callback`(dev·prod 각각), Supabase provider 활성화 + Redirect URLs 에 **두 도메인 + preview**, Vercel env **`SUPABASE_ANON_KEY`**(신규, 서버 전용 → **Type=Secret** 로 넣고 재배포만으로 반영. `NEXT_PUBLIC_*` 이 아니므로 빌드 캐시 함정과 무관).

### P4a. 카카오 + 구글

1. **`profiles` 마이그레이션(0006)** — 테이블 + **`drop trigger if exists`/`create trigger` set_updated_at**(초안은 updated_at 을 선언만 하고 트리거를 안 걸어 값이 고정됐다) + **실행 가능한 SQL 로 RLS**(초안은 주석이라 **RLS 꺼진 채 이메일이 담길 뻔했다**) + `comment on`.
   컬럼: `user_id` PK→auth.users cascade · `display_name` · `email` · `phone`(자기 신고, **키가 아니다**) · `phone_verified_at` · `age_verified_at`(만 14세) · `marketing_consent_at`(R10) · 타임스탬프.
   같은 파일에 **`create index if not exists orders_user_id_idx on public.orders (user_id) where user_id is not null;`** — '내 주문' 조회용 인덱스가 없다.
   **identities 테이블 불필요** — `auth.identities` 가 담는다.
2. `lib/auth-server.ts` — `@supabase/ssr` `createServerClient`(서버 전용 `SUPABASE_ANON_KEY` + 쿠키 어댑터) + `getSessionUser()`. ⚠ **`setAll` 을 try/catch 로 감쌀 것** — Server Component 렌더 중 `cookies().set()` 은 Next 가 금지해 throw 한다(표준 회피책). 브라우저 클라이언트는 만들지 않는다.
3. 라우트: `app/api/auth/signin/[provider]` · `callback`(`exchangeCodeForSession` → service_role 로 profiles upsert → 302) · `signout` · **`GET /api/auth/me`**(→ `{loggedIn, displayName, phone}`).
   ⚠ **`/api/auth/me` 는 선택이 아니라 필수다** — `Shell.tsx:1` 과 `checkout/page.tsx:1` 이 **둘 다 `"use client"`** 이고 Shell 소비자가 16곳이라 세션을 prop 으로 내릴 수 없다.
4. **진입점** (철칙 1 — 프리뷰 승인 후 병합):
   - **탑네비**: `Shell.tsx:136-146` 의 `.navIcons` 첫 번째 **`aria-label="계정"` 버튼이 이미 있다**(현재 `onClick={() => notify()}` 더미). **텍스트 링크를 옆에 붙이지 말고 이 더미를 로그인/마이로 배선**하는 것이 최소 변경이자 워크룸 문법 유지다(글자를 붙이면 아이콘 행이 깨지고 더미와 나란히 놓여 혼란).
   - ⚠ **로그인/로그아웃 링크는 plain `<a>` 여야 한다** — `LazyclubLink`(`:31-43`)는 `${useBasePath()}${href}` 로 감싸므로 브랜치 프리뷰에서 `/lazyday/api/auth/signin/kakao` 라는 없는 경로가 되고, `/api/*` 는 미들웨어 matcher 밖이라 구제되지 않는다.
   - **`/mypage` 라우팅**: 라우트는 `/lazyday/mypage` 에 두고, **`middleware.ts:72` 의 `LAZYCLUB_OPEN_PREFIXES` 에 `"/mypage"` 를 추가**하지 않으면 lazy-club.com 에서 `/lazyclub/mypage` 로 rewrite 되어 **404** 다. `docs/url-policy.md` §5 이력에 행 추가(슬러그 운영자 확정 완료). **`robots.ts` 에 `/mypage`·`/lazyday/mypage` disallow + 페이지 noindex**(결제 화면조차 제외한 관례).
   - **결제 페이지 분기**: 주문자 정보 위에 "로그인하고 계속 / 비회원으로 계속". **비회원 결제를 막지 않는다**(R11). ⚠ 프리필 우선순위를 **상태로 표현**할 것 — 현재 `editOrderer()`(`checkout/page.tsx:111-114`)는 `clearOrderer()`+`setPrefilled(false)` 뿐이라 profiles 프리필에는 아무 효과가 없다 → `prefillSrc: "stash"|"profile"|null` + '수정 뒤에는 다시 채우지 않는다' 플래그. 신청서 인계값(`lz-orderer`)이 있으면 그쪽 우선.
5. **user_id 스탬핑** — `/api/payment/prepare` 는 **원장에 쓰지 않는다**(주석이 "기록은 승인 확정 시 한 번"이라 명시). 실제 호출부는 **`app/api/lazyday/payment/confirm/route.ts:114`** 와 **`app/api/payment/toss-webhook/route.ts`** → `RecordOrderInput` 에 `userId?` 추가 후 이 두 곳에서 전달. 신청은 apply 라우트에서 세션이 있으면 전달.
   ⚠ **가상계좌는 스탬핑 불가** — 웹훅은 토스가 서버로 직접 부르므로 세션 쿠키가 없다. 그 주문은 `user_id`=null 로 남고 link-order 로만 회수된다 → `/mypage` 문구에 명시.
6. `app/(main)/lazyday/mypage/page.tsx` + `app/api/lazyday/mypage/*` — 내 주문·내 신청·주문 연결 폼. 서버 라우트가 세션→user_id 필터로 R13("본인은 자기 행만")을 강제.
   ⚠ **R3 한계**: link-order 는 `orders.orderer_phone`(주문자)로 매칭하므로 **대리 결제 건은 결제한 사람에게만 연결된다** — '내 주문/내 신청' 문구가 이를 오해시키지 않게.
7. `app/api/lazyday/mypage/link-order/route.ts` — orderNo+phone **둘 다 일치할 때만** user_id set(+같은 order_no 의 applications). **전화 단독 매칭 금지**(R11).
8. ⚠ **도메인이 갈리면 세션도 갈린다** — lazy-club.com 과 lazyday-bookclub.com 은 eTLD+1 이 달라 쿠키를 공유하지 못하는데 셸도 checkout 도 두 도메인에서 열린다. **계정(profiles)은 하나지만 로그인은 도메인별 1회**라는 한계를 운영자에게 사전 고지하고, 노선(회원을 북클럽 도메인 하나로 통일 vs 도메인별 독립 로그인)을 정해 DECISIONS 에 남긴다.
9. 검증: dev + localhost redirect 로 **실계정 카카오·구글 로그인 실측**(auth.users·auth.identities·profiles) → 프리필·스탬핑·link-order 4조합 → **두 도메인 각각 `/mypage` 200** → preview 스크린샷 승인 → 프로덕션 후 운영자 계정 1회.

### P4b. 네이버 (spike 게이트)

1. **dev spike(반나절)**: Supabase **Custom OAuth2 Provider**(2026-04 출시)에 네이버 등록(authorize/token/userinfo 3종) → 실로그인 → **userinfo 가 `{resultcode, message, response:{…}}` 로 중첩**된 것을 필드 매핑이 소화하는지 확인.
2. 성공 → provider 추가(콜백·profiles 공통) → 배포. 실패 → **폴백**(서버 수동 OAuth + `admin.generateLink`+`verifyOtp`, 이메일 미동의는 합성 이메일) **공수 재보고 후**.

---

## P5. Admin 상태 관리 (Stage B)

- 전제: P3 가동 후 2~4주 정합 확인 → **운영자 보고 + "시트 '진행 상태' 기입 중단" 합의 후에만.**
- PATCH(변경 이력 포함) + 드롭다운(미진행/미결제/결제완료/환불/탈락 ↔ received/unpaid/paid/refunded/rejected).
- 시트 헤더에 "→ admin 에서 관리" 메모(수동 1회). **역동기화 없음.** 반배정·비고는 Stage C(범위 밖).

---

## 운영자 대기 포인트

| 시점 | 내용 |
|---|---|
| **P0 직후** | 방침 문구 확인(제5조·제6조) + **시행 7일 전 공지** 시점 |
| **P1 착수 전** | **Supabase MCP 커넥터 재연결** — 없으면 시작 불가 / dev·prod 스키마 대조 |
| **P1 착수와 동시** | P4-0 안내문 전달(개발자 앱·약관 30일 리드타임) — 병렬 진행해야 P4 가 안 밀린다 |
| P1 중 | 보유기간 고지 문구 통일(동의 철회 시까지 ↔ 종료 후 1년) / bookclub 정책 택1 |
| P2.5 | **시트 새로고침 → 메뉴 → 트리거 켜기** + 스크립트 속성 `SITE_URL`·토큰 / 후기는 범위 밖 확인 |
| P3 | R13 감사 로그 생략 여부 판단 |
| P4-0 | 개발자 앱 등록 / 약관·방침 2차 개정 문구 / 만 14세 정책 / **공개 로그인 입구 노선 확인**(community-spec 과 충돌) |
| P4a | 도메인별 세션 노선 확정 · 프리뷰 스크린샷 승인 |
| P5 | "시트 '진행 상태' 기입 중단" 선언 |

## 실행 시작

**P0 → P1 → P2 → P2.5 → P3 → P4a → (P4b) → P5**, 각 Phase 독립 PR. 위 '불변 원칙' 11개는 전 구간 적용.

⚠ **P1 은 Supabase MCP 가 붙어 있어야 시작된다** — 세션 시작 시 `ToolSearch "select:mcp__Supabase__apply_migration"` 로 확인하고 없으면 운영자에게 알리고 대기.

⚠ 이 문서는 2026-09-01 시점의 코드를 근거로 쓰였다. 인용된 파일·줄 번호는 어긋날 수 있으니 **고치기 전 해당 파일을 직접 열어 확인**하고, 문서와 코드가 다르면 **코드를 믿고 문서를 고쳐 같은 PR 에 담는다**.
