-- ============================================================================
-- 0002 · 함수 권한 강화 — 어드바이저 지적 2건 (dev 적용 중 발견, 2026-08-18)
-- ============================================================================
-- ① purge_expired_participants 가 SECURITY DEFINER 인 채 EXECUTE 가 공개라
--    anon 이 /rest/v1/rpc/ 로 파기를 트리거할 수 있었다. 지우는 건 만료분뿐이라
--    파괴력은 제한적이지만 "anon 이 할 수 있는 일 = 0" 원칙(결정 5) 위반.
--    → PUBLIC·anon·authenticated 에서 EXECUTE 회수. service_role 만 남긴다.
-- ② set_updated_at 의 search_path 미고정 (mutable search_path 경고) → 고정.
-- ============================================================================

revoke execute on function public.purge_expired_participants() from public, anon, authenticated;
grant  execute on function public.purge_expired_participants() to service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
