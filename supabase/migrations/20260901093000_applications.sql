-- ============================================================================
-- 0005 · 접수 원장 (applications) — 시트 단일 저장의 이중화
-- ============================================================================
-- 정본 설계·규칙 원문: /lazyday/preview/commerce-journey (R6·R9·R11)
-- 실행 계획: docs/plans/2026-09-01-applications-ledger-and-members.md (P1)
--
-- 이 마이그레이션이 해소하는 것:
--   · 접수 데이터가 구글 시트(GAS)에만 남던 문제 — DB 에 흔적이 남는 접수는
--     선결제 원데이 하나뿐이었고(orders.application_submitted_at 플래그),
--     그나마도 주문이 있어야 남았다. 주문 없는 신청(북클럽·알림·커피앤바)은
--     시트가 유일본이라 시트 사고 = 접수 전량 소실이었다.
--     → 이 표가 시트와 나란히 같은 접수를 받는다. **시트가 1차 정본**이고
--       여기 기록 실패는 접수 응답을 깨뜨리지 않는다 (lib/applications.ts).
--
-- 이 파일이 지키는 결정:
--   1. **주문이 아니다.** orders 는 결제로 성립한 계약(법정 5년, R8), 이 표는 접수다.
--      금액의 정본은 여전히 orders/order_items 이고 여기엔 order_no 만 남는다 —
--      applications 는 5년 보존 대상이 아니다.
--   2. **purge_after 는 NOT NULL.** participants 는 null 이면 파기 잡이 건너뛰는
--      설계였지만(0001), 이 표는 전 접수가 들어와 규모가 다르다. null 을 허용하면
--      그 행의 개인정보가 영원히 남는다. 산출 불가 시 접수일+1년으로 폴백한다 (R9).
--   3. **dedup_key·sid 는 컬럼 unique — 부분 유니크 인덱스가 아니다.**
--      부분 인덱스는 PostgREST 가 술어를 실어 보내지 못해 on_conflict 가 42P10 으로
--      실패하고, 그 실패는 LedgerResult 규율(던지지 않음)에 삼켜져 **에러 없이 영구히
--      작동하지 않는다.** Postgres 는 NULL 을 서로 distinct 로 보므로 컬럼 unique 로도
--      "값이 있을 때만 유일" 이 성립한다 (선례: funnel_events.event_id).
--   4. **kind 는 열거 check 가 아니라 형태 check.** 열거로 두면 값 집합이 스키마와
--      classifyApply 두 곳에 중복돼, 어긋나는 순간 23514 로 조용히 실패한다.
--      화이트리스트는 애플리케이션이 강제하고 DB 는 형태만 본다
--      (선례: funnel_events.event_name, 20260826060000 의 같은 판단).
--   5. **RLS 전면 거부** — 정책 0개. enable + force + revoke (결정 5 · R13).
--      ⚠ 새 테이블마다 Supabase 어드바이저 INFO 가 1건 는다 — 의도된 상태다.
--        이걸 결함으로 보고 create policy 를 넣으면 anon 키가 브라우저에 실리는
--        구조상 "누구나 무제한 접근" 이 된다 (supabase/README.md §6).
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.applications (
  id            uuid        primary key default gen_random_uuid(),

  -- 제출 ID — 시트와 공유하는 멱등 키. P1 부터 라우트가 발급해 GAS payload 에 함께 보낸다.
  -- P2.5 스윕이 시트를 훑어 보정할 때 이 값으로 upsert 한다.
  sid           text        unique,

  -- 접수 종류. 화이트리스트는 classifyApply() 가 강제, DB 는 형태만 검사 (결정 4)
  kind          text        not null check (kind ~ '^[a-z_]{1,32}$'),

  name          text,
  phone         text,

  -- 라우트가 받은 body 원문 스냅샷 (또는 스윕이 시트에서 역구성한 값)
  payload       jsonb       not null default '{}',
  payload_src   text        not null default 'route' check (payload_src in ('route','sheet')),

  -- 선결제 접수만 값이 있다. 금액의 정본은 orders — 여기는 잇는 열쇠일 뿐 (결정 1)
  order_no      text,

  user_id       uuid        references auth.users(id) on delete set null,

  cohort        text,
  traffic_src   text,

  -- 상태 정본은 당분간 구글 시트다. 이 컬럼은 P5(Stage B)에서야 쓰기 대상이 된다.
  status        text        not null default 'received' check (status in
                            ('received','unpaid','paid','refunded','rejected','done')),
  status_note   text,

  ends_on       date,
  purge_after   date        not null,   -- 결정 2 — null 을 허용하지 않는다
  purged_at     timestamptz,

  -- GAS 가 302 로 실행은 됐는데 응답 본문만 유실된 경우 (lib/gas.ts). 시트에는 있다.
  gas_body_lost boolean     not null default false,

  -- 재제출을 같은 행으로 모으는 키 (예: written:01012345678). 값이 있을 때만 유일 (결정 3)
  dedup_key     text        unique,

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

comment on table  public.applications is 'R6 · 신청·인터뷰 접수 원장 (주문 아님). 시트가 1차 정본, 이 표는 이중화. 법정 5년 보존 대상이 아니다 — 금액 근거는 orders';
comment on column public.applications.sid         is '시트와 공유하는 제출 ID — P2.5 스윕의 멱등 키';
comment on column public.applications.kind        is '접수 종류. 화이트리스트는 classifyApply() 가 강제하고 DB 는 형태만 검사한다';
comment on column public.applications.payload_src is 'route=라우트가 받은 body 원문 / sheet=스윕이 시트 헤더에서 역구성. 대조 감사의 근거라 섞지 않는다';
comment on column public.applications.order_no    is '선결제 접수만. 금액의 정본은 orders/order_items — 여기는 잇는 열쇠';
comment on column public.applications.purge_after is 'R9 · 모임/기수 종료 + 1년, 산출 불가 시 접수 + 1년. NOT NULL — null 이면 그 행이 영원히 남는다';
comment on column public.applications.user_id     is 'R11 · 비회원이 기본이라 nullable';
comment on column public.applications.dedup_key   is '재제출을 같은 행으로 모으는 키. 부분 인덱스가 아니라 컬럼 unique — PostgREST 가 술어를 못 보낸다';
comment on column public.applications.status      is '상태 정본은 당분간 구글 시트. P5(Stage B) 전까지 이 컬럼은 쓰지 않는다';

-- ────────────────────────────────────────────────────────────────────────────
-- R9 파기 — 보유기간이 지난 접수의 개인정보를 지운다.
-- participants(0001)는 행을 통째로 delete 하지만 여기는 **행을 남기고 비운다**:
-- 시트와의 건수 대조(P3)가 파기 뒤에도 성립해야 하고, purged_at 이 파기 이력이 된다.
-- ⚠ dedup_key 에는 전화번호 원문이 들어 있다 — 반드시 함께 비운다.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.purge_expired_applications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  update public.applications
     set name        = null,
         phone       = null,
         payload     = '{}',
         status_note = null,
         dedup_key   = null,
         purged_at   = now()
   where purge_after < current_date
     and purged_at is null;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

comment on function public.purge_expired_applications() is 'R9 · 보유기간이 지난 접수의 개인정보를 비운다(행은 남긴다 — 대조·이력). dedup_key 도 전화번호라 함께 비운다';

-- 단건 즉시 파기 — 삭제 요청 (R9 후단 · 개인정보처리방침 제3조 1호 · 제8조)
create or replace function public.purge_application(target uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.applications
     set name        = null,
         phone       = null,
         payload     = '{}',
         status_note = null,
         dedup_key   = null,
         purged_at   = now()
   where id = target
     and purged_at is null;
  return found;
end;
$$;

comment on function public.purge_application(uuid) is '삭제 요청 즉시 파기 — cron 을 기다리지 않는다. 방침 제3조 1호 "삭제를 요청하는 경우 즉시 파기"';

revoke execute on function public.purge_expired_applications() from public, anon, authenticated;
grant  execute on function public.purge_expired_applications() to service_role;
revoke execute on function public.purge_application(uuid)      from public, anon, authenticated;
grant  execute on function public.purge_application(uuid)      to service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- RLS — 전면 거부 (결정 5). 정책을 하나도 만들지 않는다.
-- ────────────────────────────────────────────────────────────────────────────
alter table public.applications enable row level security;
alter table public.applications force  row level security;

revoke all on public.applications from anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- R9 파기 자동화 — 매일 18:30 UTC = 03:30 KST (0003 과 같은 시각·같은 판단).
-- 방침의 "지체 없이 파기"는 사람이 기억해서 지키는 게 아니라 스케줄러가 지킨다.
-- purge_after 는 date 이고 함수는 UTC current_date 로 비교하므로 삭제가 KST 기준보다
-- 하루 늦을 수는 있어도 이르지는 않다 — 일찍 지우는 사고가 없는 방향의 오차.
-- ────────────────────────────────────────────────────────────────────────────
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('r9-purge-applications');
exception when others then null; -- 최초 실행엔 잡이 없다
end $$;

select cron.schedule(
  'r9-purge-applications',
  '30 18 * * *',
  $$select public.purge_expired_applications()$$
);
