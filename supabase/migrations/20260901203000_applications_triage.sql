-- ============================================================================
-- 0008 · 접수 분류(triage) — 목록에서 빼는 이유를 명시적으로 남긴다
-- ============================================================================
-- 운영자 지시 (2026-09-01): "테스트 오기 더미 중복신청 기결제자 등으로 표기해야해
-- 일반적으로 분류되는 것으로 명확하게" / "파기가 아니라 보기에서 기본 제외,
-- 선택해서 볼 수는 있음".
--
-- 이 마이그레이션이 해소하는 것:
--   · 원장에 테스트·더미가 섞여 진짜 접수를 가린다. 지울 수도 없다 —
--     지우면 시트와의 건수 대조가 깨지고 "왜 없어졌는지"도 남지 않는다.
--     → 행은 그대로 두고 **왜 빼는지**를 적는다. 기본 목록에서만 빠진다.
--
-- 이 파일이 지키는 결정:
--   1. **파기가 아니다.** triage 는 열람 필터일 뿐 개인정보를 건드리지 않는다.
--      파기는 보유기간(R9)과 삭제 요청(purge_application)이 따로 담당한다.
--   2. **진행 상태(status)와 섞지 않는다.** 진행 상태의 정본은 구글 시트이고
--      (미진행·미결제·결제완료·환불·탈락) 두 곳에서 고치면 어느 쪽이 참인지
--      알 수 없어진다. triage 는 시트에 없는 개념 — "내가 훑다가 뺀 이유"다.
--      ⚠ 'paid'(기결제자)가 시트의 '결제완료'와 겹쳐 보이지만 뜻이 다르다:
--        시트는 **상태 선언**, 여기는 **더 안 봐도 된다는 열람 표시**다.
--   3. **형태 check 로 둔다** — 열거로 두면 분류를 하나 늘릴 때마다
--      마이그레이션이 필요하다. 값 집합은 애플리케이션이 강제한다
--      (0005 의 kind, funnel_events 의 event_name 과 같은 판단).
-- ============================================================================

alter table public.applications
  add column if not exists triage      text check (triage ~ '^[a-z_]{1,32}$'),
  add column if not exists triage_note text,
  add column if not exists triaged_at  timestamptz;

comment on column public.applications.triage is
  '목록에서 빼는 이유 (test·dummy·typo·duplicate·paid …). NULL = 정상 접수. 파기가 아니라 열람 필터다 — 값 집합은 애플리케이션이 강제';
comment on column public.applications.triage_note is
  '운영 메모. 접수 원문(payload)과 **분리된 자리**다 — 손님이 쓴 것과 우리가 단 것이 섞이면 안 된다';
comment on column public.applications.triaged_at is
  '분류한 시각. 누가 했는지는 남기지 않는다 — ADMIN_SECRET 이 공유 단일 값이라 주체를 구분할 수 없다(R13, P4 의 사람별 로그인으로 이행)';

-- 기본 목록은 "분류 안 된 행"이다 — 그 조회가 가장 잦으므로 부분 인덱스로 받는다
create index if not exists applications_triage_open_idx
  on public.applications (submitted_at desc)
  where triage is null;

-- ⚠ 분류된 행도 파기 대상이다 — triage 는 보유기간과 무관하다(결정 1).
--   purge_expired_applications() 는 그대로 두고 여기서 손대지 않는다.
