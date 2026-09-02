-- ============================================================================
-- 0010 · 파기 함수가 운영 메모(triage_note)도 비우게 한다
-- ============================================================================
-- 0008 이 triage_note 를 **파기 함수보다 나중에** 추가했다. 함수는 그 컬럼을 모른 채
-- 그대로라, 파기해도 메모만 남는다 (2026-09-02 dev 실측: 이름·전화·payload 는 비었는데
-- triage_note '입금 확인' 이 그대로 살아 있었다).
--
-- 메모는 우리가 쓴 글이지만 **개인정보가 들어갈 수 있다** — "같은 번호로 두 번",
-- "○○님 소개" 같은 것들이 실제로 적히는 자리다. 파기가 그걸 남기면 파기가 아니다.
--
-- 판단 두 가지:
--   1. **triage_note 는 항상 비운다.** 정기 파기(R9)의 마케팅 예외는 이름·전화에만
--      걸린다 — 그 근거(수신 동의)가 덮는 건 **발송에 필요한 최소 항목**이지
--      운영 메모가 아니다. 동의 여부와 무관하게 지운다.
--   2. **triage(분류)는 남긴다.** test·paid 같은 분류값 자체엔 개인정보가 없고,
--      지우면 파기된 행이 "왜 목록에서 빠져 있었는지"를 잃는다 — 시트 대조가 어려워진다.
--
-- ⚠ 본문은 현행 정의 그대로에 한 줄만 더한다. 0006 을 고치지 않고 새 파일로 얹는 이유는
--   append-only 규칙 때문이다.
-- ============================================================================

-- ── 정기 파기 (R9) ──────────────────────────────────────────────────────────
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
         triage_note = null, -- 0010: 메모에도 개인정보가 들어간다. 동의 예외가 덮지 않는다
         dedup_key   = null,
         purged_at   = now()
   where purge_after < current_date
     and purged_at is null;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

comment on function public.purge_expired_applications() is
  'R9 · 보유기간이 지난 접수의 개인정보를 비운다(행은 남긴다 — 대조·이력). 마케팅 수신 동의자의 이름·전화만 그 동의를 근거로 남긴다. 운영 메모(triage_note)는 동의와 무관하게 비운다 (0010)';

-- ── 단건 즉시 파기 (삭제 요청) ──────────────────────────────────────────────
create or replace function public.purge_application(target uuid)
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
  return found;
end;
$$;

comment on function public.purge_application(uuid) is
  'R9 후단 · 삭제 요청 시 단건 즉시 파기. 마케팅 동의와 운영 메모(triage_note)도 함께 지운다 — 삭제 요청이 동의에 우선한다. 분류(triage)는 남긴다: 개인정보가 없고 대조에 쓰인다';

-- 권한은 0005·0006 과 같게 다시 못박는다 (create or replace 는 grant 를 유지하지만,
-- 이 파일만 읽고도 누가 실행할 수 있는지 알 수 있어야 한다)
revoke execute on function public.purge_expired_applications() from public, anon, authenticated;
grant  execute on function public.purge_expired_applications() to service_role;
revoke execute on function public.purge_application(uuid)      from public, anon, authenticated;
grant  execute on function public.purge_application(uuid)      to service_role;
