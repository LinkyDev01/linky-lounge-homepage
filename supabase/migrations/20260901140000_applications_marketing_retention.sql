-- 0006 · 마케팅 동의자 연락처는 파기에서 제외한다 (운영자 2026-09-01 "무제한 안 돼?")
--
-- 이 마이그레이션이 해소하는 것
--   0005 의 파기 함수는 보유기간이 지나면 name·phone 을 **무조건** 비웠다. 그래서 모임이
--   끝나고 1년이 지나면 재모집 안내를 보낼 수단이 사라진다. 운영자가 "무기한 보유"를
--   원했는데, 신청서 전체를 무기한 보유하는 것은 개인정보 보호법 제21조(목적 달성 시
--   지체 없이 파기) 위반이다. 합법적으로 가능한 형태는 하나뿐이다 —
--   **정보주체가 별도로 동의한 목적(마케팅 수신)에 한해, 그 목적에 필요한 최소 항목만.**
--
-- 이 파일이 지키는 결정
--   · 신청서 본문(payload·주관식·상태 메모)은 종전대로 종료 + 1년에 파기한다.
--   · **마케팅 수신에 동의한 사람의 이름·전화만** 남긴다. 보유 근거는 그 동의이고,
--     동의를 철회하면 즉시 파기된다(아래 withdraw_marketing_consent).
--   · 개인정보처리방침 제3조 3호가 이미 "마케팅 활용 정보(선택 동의): 동의 철회 시까지"
--     로 고지하고 있다 — 새 고지가 아니라 그 고지대로 동작하게 만드는 것이다.
--   · ⚠ 이 동의를 **필수로 묶으면 위법**이다(제22조). 선택 동의로만 유지할 것
--     (DECISIONS 2026-07-27 과 같은 규율).
--
--   ⚠ dedup_key 는 동의자도 비운다 — 전화번호 원문이지만 그 목적은 '서면 재제출 중복
--     판정'이라 보유기간이 지나면 근거가 없다. 연락처는 phone 컬럼에만 남긴다.

alter table public.applications
  add column if not exists marketing_consent_at timestamptz;

comment on column public.applications.marketing_consent_at is
  '선택 동의(마케팅 수신) 시각. NOT NULL 이면 파기 시 이름·전화를 남긴다 — 보유 근거가 이 동의다. 철회 시 이 값을 비우면 다음 파기에서 연락처도 지워진다 (R10)';

-- 동의자 조회용 — "지금 안내를 보낼 수 있는 사람" 이 이 인덱스로 뽑힌다
create index if not exists applications_marketing_idx
  on public.applications (marketing_consent_at)
  where marketing_consent_at is not null and phone is not null;

-- ── 정기 파기 (pg_cron 03:30 KST) — 동의자는 이름·전화를 남긴다 ──────────────
-- purged_at 은 두 경우 모두 세운다: '보유기간 처리가 끝난 행' 이라는 뜻이지
-- '아무것도 안 남았다' 는 뜻이 아니다. 남은 것은 오직 동의에 근거한 연락처다.
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
     set name        = case when marketing_consent_at is null then null else name end,
         phone       = case when marketing_consent_at is null then null else phone end,
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
comment on function public.purge_expired_applications() is
  'R9 · 보유기간이 지난 접수의 개인정보를 비운다(행은 남긴다 — 대조·이력). 단 마케팅 수신 동의자의 이름·전화는 그 동의를 근거로 남긴다 (2026-09-01)';

-- ── 단건 즉시 파기 (삭제 요청) — 동의 여부와 무관하게 전부 지운다 ─────────────
-- 삭제 요청은 마케팅 동의보다 앞선다. 방침 제3조 1호·제8조가 '즉시 파기' 를 약속한다.
create or replace function public.purge_application(target uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.applications
     set name = null, phone = null, payload = '{}', status_note = null,
         dedup_key = null, marketing_consent_at = null, purged_at = now()
   where id = target
     and purged_at is null;
  return found;
end;
$$;
comment on function public.purge_application(uuid) is
  'R9 후단 · 삭제 요청 시 단건 즉시 파기. 마케팅 동의도 함께 지운다 — 삭제 요청이 동의에 우선한다';

-- ── 마케팅 수신 철회 — 그 번호의 모든 접수에서 보유 근거를 없앤다 ──────────────
-- 이미 보유기간이 지나 purged_at 이 찍힌 행은 연락처를 이 자리에서 바로 비운다
-- (다음 정기 파기를 기다리면 철회가 '지체 없이' 가 아니게 된다).
create or replace function public.withdraw_marketing_consent(target_phone text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.applications
     set marketing_consent_at = null,
         name  = case when purged_at is null then name  else null end,
         phone = case when purged_at is null then phone else null end
   where phone = target_phone
     and marketing_consent_at is not null;
  get diagnostics affected = row_count;
  return affected;
end;
$$;
comment on function public.withdraw_marketing_consent(text) is
  'R10 · 마케팅 수신 철회. 보유기간이 남은 행은 동의만 지우고(신청서는 원래 기간까지 유지), 이미 파기된 행은 연락처까지 즉시 비운다';

revoke execute on function public.purge_expired_applications()      from public, anon, authenticated;
revoke execute on function public.purge_application(uuid)           from public, anon, authenticated;
revoke execute on function public.withdraw_marketing_consent(text)  from public, anon, authenticated;
grant  execute on function public.purge_expired_applications()      to service_role;
grant  execute on function public.purge_application(uuid)           to service_role;
grant  execute on function public.withdraw_marketing_consent(text)  to service_role;
