-- ============================================================================
-- 0001 · 주문 원장 (orders · order_items · order_shipping · participants)
-- ============================================================================
-- 근본 규칙(R1~R13)에서 도출한 v3 스키마의 **첫 조각**이다.
-- 정본 설계·규칙 원문: /lazyday/preview/commerce-journey
--
-- 이 마이그레이션이 해소하는 것:
--   · 결제는 승인됐는데 신청서를 안 낸 손님의 기록이 우리 쪽에 0이던 문제
--     → orders 행이 승인 즉시 남는다. application_submitted_at 이 NULL 이면 구제 대상.
--   · 카탈로그 가격을 바꾸면 과거 주문의 금액 근거가 소급 변조되던 문제
--     → order_items 에 단가·상품명을 **복사해 박는다** (R2). 카탈로그와 무관해진다.
--
-- 이 파일이 지키는 결정 (2026-08-18 확정):
--   1. 보존기간이 다른 정보는 테이블을 나눈다 — orders/order_items(법정 5년) ↔
--      participants(모임 종료 후 1년). 같은 행에 두면 어느 쪽도 못 지킨다 (R9).
--   2. 금액은 integer 원 단위. 주문 시점 스냅샷을 행에 박는다 (R2).
--   3. order_no 는 결제사(토스) orderId 원문을 그대로 담는다 — 발급 후 불변(R1).
--      구형 orderId(lz-… / oneday-…)도 그대로 들어와 전환 시 호환이 끊기지 않는다.
--   4. 전화번호는 키가 아니다. PK 는 uuid 대리키, 전화는 숫자만 정규화한 조회용 속성.
--   5. RLS 전면 거부 — 정책을 만들지 않는다. 쓰기·읽기는 서버(service_role)만.
--      anon 키는 브라우저에 실리므로 어떤 정책도 곧 공개를 뜻한다 (R13).
--   6. 모든 시각은 timestamptz(UTC 저장). KST 경계 판단은 애플리케이션이 한다 (R12).
-- ============================================================================

create extension if not exists pgcrypto;

-- updated_at 자동 갱신 (주문 상태 변경 이력 추적의 최소선)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- orders — 결제로 성립한 계약 1건. 법정 5년 보존(R8), 사용자 삭제 요청으로도 못 지운다.
-- 주문자(결제자) 정보만 담는다. 실제 모임에 오는 사람은 participants (R3·R9).
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                        uuid primary key default gen_random_uuid(),

  -- R1: 사람이 부르는 유일한 기준. 결제사 orderId 원문 그대로. 발급 후 불변.
  order_no                  text        not null unique,
  payment_key               text,
  provider                  text        not null default 'toss',

  status                    text        not null default 'paid'
                                        check (status in ('paid','refunded','partially_refunded','cancelled')),

  -- R2: 승인된 총액. 카탈로그가 바뀌어도 변하지 않는다.
  amount_total              integer     not null check (amount_total >= 0),
  currency                  text        not null default 'KRW',

  -- 주문자 = 결제한 사람. 계약 기록이라 법정 5년 대상.
  orderer_name              text        not null,
  orderer_phone             text,                       -- 숫자만 정규화 (01012345678)

  -- R11: 비회원 주문이 기본. 회원 연결은 사후에 주문번호+전화 일치로만.
  user_id                   uuid        references auth.users(id) on delete set null,

  approved_at               timestamptz,
  -- 선결제→후신청 여정의 두 번째 걸음. NULL = 결제만 하고 신청서 미제출 → 구제 대상.
  application_submitted_at  timestamptz,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on table  public.orders is '주문 원장 — 결제로 성립한 계약. 법정 5년 보존(R8). 참가자 개인정보는 participants 로 분리(R9)';
comment on column public.orders.order_no is 'R1 · 결제사 orderId 원문. 발급 후 불변, 유일';
comment on column public.orders.user_id is 'R11 · 비회원 주문이 기본이라 nullable';
comment on column public.orders.application_submitted_at is 'NULL = 결제 후 신청서 미제출. 운영 구제(재진입 링크) 대상 탐지에 쓴다';

create index if not exists orders_orderer_phone_idx on public.orders (orderer_phone);
create index if not exists orders_created_at_idx    on public.orders (created_at desc);
create index if not exists orders_unsubmitted_idx   on public.orders (created_at desc)
  where application_submitted_at is null;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- order_items — R2 가격 스냅샷. products 를 참조하지 않고 **값을 복사**한다.
-- 카탈로그(goods-config·oneday-shared)가 어떻게 바뀌든 과거 주문은 불변.
-- on delete restrict: 법정 보존 대상이라 주문 삭제 자체를 막는다.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id              uuid        primary key default gen_random_uuid(),
  order_id        uuid        not null references public.orders(id) on delete restrict,

  product_code    text        not null,                 -- 'd823' · 'g-coffee-mug' · 'ship'
  name_snapshot   text        not null,                 -- 결제 시점 상품명
  kind            text        not null check (kind in ('meeting','goods','shipping')),
  unit_price      integer     not null check (unit_price >= 0),
  quantity        integer     not null default 1 check (quantity > 0),
  note_snapshot   text,                                 -- 모임이면 일시, 굿즈면 수령 안내

  created_at      timestamptz not null default now()
);

comment on table public.order_items is 'R2 · 주문 시점 가격·상품명 스냅샷. 카탈로그를 참조만 하고 값은 복사한다';

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ────────────────────────────────────────────────────────────────────────────
-- order_shipping — 배송형 주문에만. 공급 기록이라 orders 와 같은 5년 구획.
-- 지금까지 배송지는 토스 결제 metadata 에만 있었다 (주문 DB 부재의 부작용).
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.order_shipping (
  order_id        uuid        primary key references public.orders(id) on delete restrict,
  method          text        not null check (method in ('pickup','parcel')),
  zip             text,
  addr1           text,
  addr2           text,
  recipient_name  text,
  recipient_phone text,
  created_at      timestamptz not null default now()
);

comment on table public.order_shipping is '배송·수령 정보. 공급 기록이라 orders 와 같은 법정 5년 구획(R8)';

-- ────────────────────────────────────────────────────────────────────────────
-- participants — 실제 모임에 오는 사람 (R3 양도 불가).
-- ⚠ **여기가 R9 의 직접 결과다.** 이 정보를 orders 에 붙여 두면 5년 보존과
--   1년 파기가 한 행에서 충돌해 어느 쪽도 지킬 수 없다. 그래서 뗀다.
--   purge_after 가 지나면 행을 통째로 삭제한다 — 주문(금액·계약)은 그대로 남는다.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.participants (
  id            uuid        primary key default gen_random_uuid(),
  order_id      uuid        not null references public.orders(id) on delete restrict,

  product_code  text        not null,                   -- 어느 모임의 참가자인지
  name          text        not null,
  phone         text,

  ends_on       date,                                   -- 이 모임(기수)의 종료일
  purge_after   date,                                   -- ends_on + 1년 (R9). 앱이 계산해 넣는다

  created_at    timestamptz not null default now()
);

comment on table  public.participants is 'R3·R9 · 참가자 본인. 모임 종료 후 1년 뒤 파기 — orders 에서 분리한 이유';
comment on column public.participants.purge_after is 'R9 파기 기준일. 이 날짜가 지난 행은 purge_expired_participants() 가 지운다';

create index if not exists participants_order_id_idx    on public.participants (order_id);
create index if not exists participants_purge_after_idx on public.participants (purge_after);

-- R9 파기 — 정기 실행(pg_cron 또는 관리자 호출). 지운 행 수를 돌려준다.
create or replace function public.purge_expired_participants()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.participants
   where purge_after is not null
     and purge_after < current_date;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

comment on function public.purge_expired_participants() is 'R9 · 모임 종료 후 1년이 지난 참가자 개인정보를 파기. 주문(법정 5년)은 건드리지 않는다';

-- ────────────────────────────────────────────────────────────────────────────
-- RLS — 전면 거부 (결정 5)
-- 정책을 **하나도 만들지 않는다**. anon·authenticated 는 어떤 행에도 닿지 못한다.
-- 모든 접근은 Next 서버 라우트가 service_role 로 수행한다 (service_role 은 RLS 우회).
-- ⚠ 구 supabase/schema.sql 의 `WITH CHECK (true)` 방식을 계승하지 말 것 —
--   anon 키는 브라우저 번들에 실리므로 그건 "누구나 무제한 INSERT" 를 뜻했다.
-- ────────────────────────────────────────────────────────────────────────────
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.order_shipping enable row level security;
alter table public.participants   enable row level security;

alter table public.orders         force row level security;
alter table public.order_items    force row level security;
alter table public.order_shipping force row level security;
alter table public.participants   force row level security;

revoke all on public.orders, public.order_items, public.order_shipping, public.participants from anon, authenticated;
