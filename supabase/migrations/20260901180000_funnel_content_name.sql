-- ============================================================================
-- 0007 · funnel_events 에 content_name 추가 — Lead 종류 구분
-- ============================================================================
-- 종전 funnel_events 는 event_name 만 담아 **북클럽 신청서 제출**과
-- **원데이 토크 결제완료**가 둘 다 'Lead' 한 덩어리로 섞였다. 두 흐름은 퍼널도
-- 금액도 다른데 집계에서 갈라낼 수가 없었다 (2026-08-31 실측 중 발견).
--
-- content_name 은 이미 픽셀·CAPI 페이로드에 실려 오는 값이라 새로 만들 것이 없다:
--   'lazyday_bookclub_4'    북클럽 4기 (신청서·인터뷰 확정·결제시작)
--   'OneDayTalk_신청완료'    원데이 토크 결제 후 신청
--
-- ⚠ 과거 행은 null 로 남는다 — 소급 복원이 불가능하다(원본이 Meta 쪽에만 있다).
--   이 마이그레이션 이후의 집계만 정확해진다.
-- ⚠ 인덱스는 추가하지 않는다. 집계는 기존 (event_name, traffic_src, occurred_at)
--   인덱스로 충분하고, content_name 은 그 안에서 걸러 읽는 보조 축이다.
-- ============================================================================

alter table public.funnel_events
  add column if not exists content_name text;

-- 애플리케이션(/api/capi)이 화이트리스트를 강제한다. DB 는 형태만 본다 —
-- 한글 상품명(OneDayTalk_신청완료)이 들어오므로 문자 종류는 제한하지 않고 길이만 자른다.
do $$
begin
  alter table public.funnel_events
    add constraint funnel_events_content_name_len
    check (content_name is null or char_length(content_name) between 1 and 100);
exception when duplicate_object then null; -- 재실행 안전
end $$;

comment on column public.funnel_events.content_name is
  '픽셀 custom_data.content_name — Lead 종류 구분(lazyday_bookclub_4 / OneDayTalk_신청완료). 2026-09-01 이전 행은 null';
