-- ============================================================================
-- 0004 · 퍼널 계측 (funnel_events)
-- ============================================================================
-- 유입 출처별 (결제 시작 수 / 제출 수) 를 SQL 로 뽑기 위한 계측 테이블 (운영자 2026-08-26).
-- 종전에는 결제 시작(InitiateCheckout)이 어디에도 저장되지 않아 자체 집계가 불가능했다 —
-- 픽셀·CAPI 는 Meta 로 나가기만 하고, GAS 시트는 제출만 담는다.
--
-- 커머스 원장(ERD v3)의 일부가 **아니다** — 규칙층 R1~R13 의 보존기간·계약 논리와
-- 무관한 순수 계측이라 별도 테이블로 둔다. 정본 설계: /lazyday/preview/commerce-journey.
--
-- 이 파일이 지키는 결정:
--   1. **개인정보 0** — 이름·전화·IP·UA 를 담지 않는다. 그래서 보존기간 규칙(R8·R9)의
--      적용 대상이 아니며 파기 스케줄이 필요 없다. 사람 단위 분석이 필요해지면
--      그때 별도 설계로 (해시라도 개인정보다 — 여기 얹지 말 것).
--   2. event_id 는 브라우저 픽셀·CAPI 와 같은 값 — unique 로 멱등을 보장한다.
--      sendBeacon 재전송·서버 재시도가 있어도 한 건은 한 번만 세어진다.
--   3. RLS 전면 거부 — 정책 0개, 쓰기·읽기는 서버(service_role)만 (R13 과 같은 이유).
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.funnel_events (
  id          uuid        primary key default gen_random_uuid(),

  -- 브라우저 fbq 의 eventID = CAPI 의 event_id 와 같은 값. 멱등 키.
  event_id    text        not null unique,

  -- 화이트리스트는 애플리케이션(/api/capi)이 강제한다. DB 는 형태만 검사.
  event_name  text        not null check (event_name ~ '^[A-Za-z][A-Za-z0-9_-]{0,49}$'),

  -- 유입 출처 (profile / ad_direct / organic / 그 외 ?src= 값). 캡처 전 이벤트는 null.
  traffic_src text        check (traffic_src ~ '^[a-z0-9_-]{1,32}$'),

  -- 이벤트 발생 시각 (클라이언트 기준, 서버가 클램프한 값)
  occurred_at timestamptz not null,

  created_at  timestamptz not null default now()
);

comment on table  public.funnel_events is '퍼널 계측 — 유입 출처별 결제시작/제출 집계용. 개인정보 0 (보존기간 규칙 비대상)';
comment on column public.funnel_events.event_id is '픽셀 eventID = CAPI event_id. unique 로 멱등';
comment on column public.funnel_events.traffic_src is 'profile(인스타 바이오)·ad_direct(fbclid)·organic. null = 캡처 전';

-- 집계는 (이벤트, 출처, 기간) 축으로 돈다
create index if not exists funnel_events_name_src_idx on public.funnel_events (event_name, traffic_src, occurred_at desc);
create index if not exists funnel_events_occurred_idx on public.funnel_events (occurred_at desc);

alter table public.funnel_events enable row level security;
alter table public.funnel_events force row level security;
revoke all on public.funnel_events from anon, authenticated;
