-- ============================================================================
-- 0003 · R9 파기 자동화 — purge_expired_participants() 를 매일 실행 (pg_cron)
-- ============================================================================
-- 파기 함수는 0001 에서 만들었지만 부르는 주체가 없어 수동 대기 상태였다.
-- 개인정보처리방침의 "지체 없이 파기"는 사람이 기억해서 지키는 게 아니라
-- 스케줄러가 지키게 한다. 매일 18:30 UTC = 03:30 KST (한가한 시각).
--
-- 시각 오차에 대해: purge_after 는 날짜(date)이고 함수는 UTC current_date 로
-- 비교한다. UTC 날짜가 KST 보다 최대 9시간 늦으므로 삭제가 KST 기준보다
-- 하루 늦을 수는 있어도 이르지는 않다 — "1년까지 보유 후 지체 없이 파기"에
-- 부합한다 (일찍 지우는 사고가 없는 방향의 오차).
--
-- 검증 (dev, 2026-08-18): 잡 등록 확인(cron.job active=true) + 파기 대상
-- 1건 심고 잡 명령을 그대로 실행해 참가자 행만 삭제됨을 실증.
-- ============================================================================

create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('r9-purge-participants');
exception when others then null; -- 최초 실행엔 잡이 없다
end $$;

select cron.schedule(
  'r9-purge-participants',
  '30 18 * * *',
  $$select public.purge_expired_participants()$$
);
