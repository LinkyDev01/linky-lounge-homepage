-- 0015 · 북클럽 반배정 (고객 공유용 열람 페이지의 데이터) — 운영자 2026-09-05
--
-- 왜 DB 인가
--   레포가 **public** 이다. 고객 실명 36명을 컨피그 파일로 커밋하면 열람 암호가 무의미해진다.
--   명단은 여기 담고, 페이지(`/classes`)는 서버 라우트(service_role)로만 읽는다.
--   행 삽입은 마이그레이션이 아니라 운영자 지시 시점에 SQL 로 한다 — 마이그레이션 파일도 레포에 남기 때문.
--
-- 형태 = 운영자가 준 서식 그대로 (한 행 = "반 | 이름")
--   (N명)  수요일 저녁 반 (19:30-22:30)      ← class_label · time_label, N 은 세어서 낸다(저장 안 함)
--   반 | 이름
--   수요일 저녁 | 김동휘                       ← 한 행
--   반 머리·행 순서는 class_sort · member_sort — 운영자가 준 순서를 그대로 보존한다(가나다 재정렬 금지)
--
-- 개인정보 규율 (CLAUDE.md §4) — 이름이 들어가므로 파기 함수를 같은 파일에서 만든다
--   purge_after NOT NULL = 기수 종료 + 1년 (applications 와 같은 기준). 지나면 이름만 비운다(행·반은 남는다).

create table if not exists public.bookclub_class_assignments (
  id            uuid primary key default gen_random_uuid(),
  cohort        text not null,                 -- "4기" (season-config SEASON.name 과 같은 표기)
  class_key     text not null,                 -- 묶음 키 (wed-eve · sun-am …) — 화면엔 안 보인다
  class_label   text not null,                 -- "수요일 저녁"
  time_label    text not null,                 -- "19:30-22:30"
  class_sort    smallint not null,             -- 반 머리 순서 (운영자 서식 순)
  member_name   text,                          -- 파기 시 null
  member_sort   smallint not null,             -- 반 안에서의 행 순서 (운영자 서식 순)
  purge_after   date not null,                 -- ⚠ NOT NULL — null 이면 이름이 영원히 남는다
  purged_at     timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists bookclub_class_assignments_order_idx
  on public.bookclub_class_assignments (cohort, class_sort, member_sort);
create index if not exists bookclub_class_assignments_purge_idx
  on public.bookclub_class_assignments (purge_after) where purged_at is null;

comment on table  public.bookclub_class_assignments is
  '북클럽 기수별 반배정 — 고객 공유용 열람 페이지(/classes)의 데이터. 한 행 = 반|이름. 레포가 public 이라 명단은 DB 에만 둔다 (2026-09-05)';
comment on column public.bookclub_class_assignments.member_name is
  '멤버 이름 — 개인정보. purge_after 가 지나면 purge_expired_class_assignments() 가 null 로 비운다';
comment on column public.bookclub_class_assignments.purge_after is
  '기수 종료 + 1년 (applications 와 같은 기준, R9). NOT NULL';

-- ── RLS 전면 거부 (결정 5) — 접근은 서버 라우트(service_role)만 ────────────────
alter table public.bookclub_class_assignments enable row level security;
alter table public.bookclub_class_assignments force  row level security;
revoke all on public.bookclub_class_assignments from anon, authenticated;

-- ── 정기 파기 — 이름만 비운다 ─────────────────────────────────────────────────
create or replace function public.purge_expired_class_assignments()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  update public.bookclub_class_assignments
     set member_name = null,
         purged_at   = now()
   where purge_after < current_date
     and purged_at is null;
  get diagnostics removed = row_count;
  return removed;
end;
$$;
comment on function public.purge_expired_class_assignments() is
  'R9 · 보유기간이 지난 반배정의 이름을 비운다(행·반 정보는 남긴다). 마케팅 동의 예외 없음';

revoke execute on function public.purge_expired_class_assignments() from public, anon, authenticated;
grant  execute on function public.purge_expired_class_assignments() to service_role;

-- ── 정기 파기 잡 — 잡을 늘리지 않고 기존 것이 세 함수를 함께 부르게 한다 (0013 패턴) ──
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('r9-purge-applications');
exception when others then null;
end $$;

select cron.schedule(
  'r9-purge-applications',
  '30 18 * * *',
  $$select public.purge_expired_applications(); select public.purge_expired_customer_activities(); select public.purge_expired_class_assignments();$$
);
