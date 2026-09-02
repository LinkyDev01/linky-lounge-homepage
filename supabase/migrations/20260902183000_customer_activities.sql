-- ============================================================================
-- 0013 · 고객 활동 기록 (customer_activities) — 메모 · 통화 · 문자
-- ============================================================================
-- 대시보드 CRM-5. 레코드 페이지의 '전화 걸기 · 문자 보내기'가 링크로만 있고
-- 남는 게 없었다 — "저 사람한테 언제 연락했더라"를 아무 데서도 알 수 없다.
--
-- **왜 applications.triage_note 를 늘리지 않는가**: 그 메모는 접수 1건에 붙는다.
-- 한 사람이 3기·4기에 각각 접수하면 메모가 갈라지고, 접수가 없는 사람(주문만 있는
-- 손님·회원)에겐 메모를 남길 자리가 아예 없다. 활동은 **사람 단위**라 표가 따로다.
-- (triage_note 는 그대로 둔다 — 그건 '이 접수를 왜 뺐는가'라는 다른 뜻이다)
--
-- 이 파일이 지키는 결정:
--   1. **사람은 여전히 파생이다** (CRM-1). 이 표는 고객 표가 아니라 활동 기록이고,
--      `person_key` 는 lib/customers.ts 가 만드는 묶음 키(정규화 전화 · `u:<user_id>` ·
--      `a:`/`o:` 단독)를 그대로 받는다. 외래키를 걸 상대가 없다 — 사람 행이 없으니까.
--   2. **kind 는 형태 check** (0005 결정 4와 같은 판단). 값 집합(note·call·sms)은
--      라우트가 강제하고 DB 는 형태만 본다 — 두 곳에 열거하면 어긋나는 순간 23514 로
--      조용히 실패한다.
--   3. **purge_after 는 NOT NULL** (0005 결정 2). null 이면 그 기록이 영원히 남는다.
--      값은 라우트가 **그 사람의 마지막 접수 purge_after** 로 넣고, 접수가 없으면
--      기록일+1년으로 폴백한다 (운영자 2026-09-02 "그 사람 접수와 같이").
--   4. **RLS 전면 거부** — 정책 0개 (0005 결정 5). 어드바이저 INFO 1건은 의도된 상태.
--
-- ⚠ **개인정보가 들어가는 자리다** — "○○님 소개로 왔다더라", 통화 내용 요약이 실제로
--   적힌다. CLAUDE.md §4 규율대로 **파기 함수 2종을 이 파일에서 함께 고친다**
--   (0008 이 triage_note 를 함수보다 나중에 만들어 파기해도 메모만 남았던 사고를
--   되풀이하지 않는다 — 그 수정이 0010 이었다).
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.customer_activities (
  id          uuid        primary key default gen_random_uuid(),

  -- 사람 묶음 키 = lib/customers.ts 의 Customer.key (결정 1)
  person_key  text        not null check (person_key ~ '^[A-Za-z0-9:_-]{1,64}$'),

  -- note(메모) · call(통화) · sms(문자). 화이트리스트는 라우트가 강제 (결정 2)
  kind        text        not null check (kind ~ '^[a-z_]{1,32}$'),

  -- ⚠ 개인정보가 들어갈 수 있는 자리 — 파기가 비운다
  body        text        check (body is null or char_length(body) between 1 and 2000),

  -- 남긴 사람 (lazyday_admin_who = 관리자 이메일). R13 "누가 했는가".
  -- 정보주체의 개인정보가 아니라 우리 쪽 기록이라 파기 대상이 아니다 — 지우면
  -- 파기된 행이 "누가 남긴 것이었는지"를 잃는다 (0010 의 triage 판단과 같은 정신)
  who         text,

  -- 실제로 통화·문자한 시각. 기본은 지금이지만 나중에 적을 수도 있어 별도 컬럼
  occurred_at timestamptz not null default now(),

  purge_after date        not null,   -- 결정 3 — null 을 허용하지 않는다
  purged_at   timestamptz,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists customer_activities_person_idx
  on public.customer_activities (person_key, occurred_at desc);
create index if not exists customer_activities_purge_idx
  on public.customer_activities (purge_after) where purged_at is null;

drop trigger if exists customer_activities_set_updated_at on public.customer_activities;
create trigger customer_activities_set_updated_at before update on public.customer_activities
  for each row execute function public.set_updated_at();

comment on table  public.customer_activities is
  'CRM-5 · 사람 단위 활동 기록(메모·통화·문자). 고객 표가 아니다 — 사람은 여전히 세 원장의 파생이고 person_key 는 lib/customers.ts 의 묶음 키다';
comment on column public.customer_activities.person_key  is
  'lib/customers.ts 의 Customer.key — 정규화 전화 · u:<user_id> · a:/o: 단독. 외래키 아님(사람 행이 없다)';
comment on column public.customer_activities.kind        is
  '활동 종류. 화이트리스트(note·call·sms)는 라우트가 강제하고 DB 는 형태만 검사한다';
comment on column public.customer_activities.body        is
  '⚠ 개인정보가 들어갈 수 있다. 파기 함수 2종이 비운다 (CLAUDE.md §4)';
comment on column public.customer_activities.who         is
  '남긴 관리자(lazyday_admin_who). 정보주체의 개인정보가 아니라 파기 대상이 아니다';
comment on column public.customer_activities.purge_after is
  '그 사람의 마지막 접수 purge_after — 접수가 없으면 기록일+1년 폴백 (운영자 2026-09-02)';

-- ────────────────────────────────────────────────────────────────────────────
-- RLS — 전면 거부 (결정 4). 정책을 하나도 만들지 않는다.
-- ────────────────────────────────────────────────────────────────────────────
alter table public.customer_activities enable row level security;
alter table public.customer_activities force  row level security;

revoke all on public.customer_activities from anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 파기 ① 정기 (R9) — 새 함수. 기존 cron 잡이 접수와 함께 부르게 갱신한다.
-- 행은 남기고 비운다 (0005 결정 4와 같은 판단 — purged_at 이 이력이 된다).
-- ⚠ 마케팅 수신 동의의 예외가 여기엔 없다: 그 동의가 덮는 것은 발송에 필요한
--   최소 항목(이름·전화)이지 운영 기록이 아니다 (0010 과 같은 판단).
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.purge_expired_customer_activities()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  update public.customer_activities
     set body      = null,
         purged_at = now()
   where purge_after < current_date
     and purged_at is null;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

comment on function public.purge_expired_customer_activities() is
  'R9 · 보유기간이 지난 활동 기록의 본문을 비운다(행·kind·who 는 남긴다 — 대조와 이력). 마케팅 동의 예외 없음';

-- ────────────────────────────────────────────────────────────────────────────
-- 파기 ② 단건 즉시 (삭제 요청) — `purge_application` 이 그 사람의 활동도 함께 지운다.
--
-- ⚠ **인자를 늘리면서 옛 1인자 함수를 반드시 지운다.** `create or replace` 로
--   인자만 더하면 Postgres 는 **오버로드**로 보아 옛 1인자 함수가 그대로 남고,
--   라우트가 옛 시그니처로 부르는 한 활동은 영영 안 지워진다 — 에러 없이 조용히
--   새는 형태라 0008 사고와 같은 모양이 된다. drop 하고 2인자만 남긴다.
--   (호출자는 `app/api/lazyday/admin/applications/route.ts` 한 곳뿐 — 같은 PR 에서 고친다)
--
-- ⚠ 왜 함수가 person_key 를 스스로 만들지 않고 받는가: 키 규칙(normalizePhone)이
--   TS 에 있고, SQL 에 같은 규칙을 다시 적으면 둘이 어긋나는 순간 한쪽만 샌다.
--   키를 만드는 곳은 lib/customers.ts 하나로 둔다.
-- ────────────────────────────────────────────────────────────────────────────
drop function if exists public.purge_application(uuid);

create or replace function public.purge_application(target uuid, person_key text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.applications
     set name = null, phone = null, payload = '{}', status_note = null,
         triage_note = null, -- 0010
         dedup_key = null, marketing_consent_at = null, purged_at = now()
   where id = target
     and purged_at is null;

  -- 삭제 요청은 사람 단위다 — 그 사람의 활동 기록도 같은 트랜잭션에서 비운다 (0013)
  if person_key is not null then
    update public.customer_activities a
       set body = null, purged_at = now()
     where a.person_key = purge_application.person_key
       and a.purged_at is null;
  end if;

  return found;
end;
$$;

comment on function public.purge_application(uuid, text) is
  'R9 후단 · 삭제 요청 시 단건 즉시 파기. 마케팅 동의·운영 메모(triage_note)도 함께 지운다 — 삭제 요청이 동의에 우선한다. person_key 를 주면 그 사람의 활동 기록(0013)도 같은 트랜잭션에서 비운다. 분류(triage)는 남긴다';

-- 권한 — 0005·0006·0010 과 같게 다시 못박는다
revoke execute on function public.purge_expired_customer_activities() from public, anon, authenticated;
grant  execute on function public.purge_expired_customer_activities() to service_role;
revoke execute on function public.purge_application(uuid, text)       from public, anon, authenticated;
grant  execute on function public.purge_application(uuid, text)       to service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 정기 파기 잡 — 잡을 늘리지 않고 기존 것이 두 함수를 함께 부르게 한다.
-- (0005 와 같은 시각·같은 이름. unschedule 후 재등록하는 패턴도 그대로)
-- ────────────────────────────────────────────────────────────────────────────
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('r9-purge-applications');
exception when others then null;
end $$;

select cron.schedule(
  'r9-purge-applications',
  '30 18 * * *',
  $$select public.purge_expired_applications(); select public.purge_expired_customer_activities();$$
);
