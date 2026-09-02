-- ============================================================================
-- 0012 · 접수 원장에 시트 '진행 상태' 읽기 거울 (고객관리 대시보드 CRM-2)
-- ============================================================================
-- 실행 계획: docs/admin-crm/02-build-plan.md (CRM-2) · 근거: DECISIONS 2026-09-02
--
-- 무엇을 여는가:
--   대시보드 파이프라인(접수 → 인터뷰 → 합격·미결제 → 결제 → 참가 / 탈락)의 단계를
--   그리려면 **시트에만 있는 '진행 상태'**(미진행·미결제·결제완료·환불·탈락)와
--   '인터뷰 상태'(O·대기·X)가 DB 에서 읽혀야 한다. GAS 시간 스윕이 매번 그 값을 실어
--   보내고, 이 컬럼들이 그것을 **그대로 비춘다**.
--
-- 이 파일이 지키는 결정:
--   1. **정본은 여전히 시트다.** 이 컬럼들은 읽기 전용 거울 — 관리 화면이 여기에 쓰지
--      않는다. 시트 '진행 상태' 기입을 중단하고 DB 가 정본이 되는 것은 P5(운영자 합의)다.
--      그때 이 거울은 역할을 마치고 `status` 가 정본이 된다.
--   2. **원문을 따로 남긴다.** `status`(정규 값)로 번역해 넣는 것과 별개로 시트 원문
--      (`sheet_progress`)을 두는 이유: 번역 규칙이 틀렸을 때 원문이 없으면 왜 그 단계로
--      보였는지 알 수 없다. `sheet_synced_at` 이 "언제 본 값인가"를 답한다.
--   3. **개인정보가 아니다** — 파기 함수 2종(purge_*)을 고치지 않는다(CLAUDE.md §4 규율은
--      개인정보 컬럼에 대한 것). 진행 상태는 운영 사실이고 파기 뒤에도 대조에 쓰인다.
--   4. status 컬럼 주석(0005 "P5 전까지 쓰지 않는다")은 이 거울로 **읽기용으로만** 갱신된다는
--      뜻으로 바뀐다 — 아래 comment 로 정정. 값 집합은 그대로.
-- ============================================================================

alter table public.applications
  add column if not exists sheet_progress          text,          -- 시트 '진행 상태' 원문
  add column if not exists sheet_interview_status  text,          -- 시트 '인터뷰 상태' 원문 (O·대기·X)
  add column if not exists sheet_interview_type    text,          -- 시트 '인터뷰 방식' 원문 (전화·서면)
  add column if not exists sheet_synced_at         timestamptz;   -- 마지막으로 시트에서 비춘 시각

comment on column public.applications.sheet_progress         is '시트 ''진행 상태'' 원문 거울(읽기 전용) — GAS 스윕이 매시 갱신. 정본은 시트';
comment on column public.applications.sheet_interview_status is '시트 ''인터뷰 상태'' 원문 거울(O·대기·X)';
comment on column public.applications.sheet_interview_type   is '시트 ''인터뷰 방식'' 원문 거울(전화·서면)';
comment on column public.applications.sheet_synced_at        is '이 행의 시트 값을 마지막으로 비춘 시각 — null 이면 아직 한 번도 안 비춤';
comment on column public.applications.status is '진행 상태 — 정본은 구글 시트. CRM-2(2026-09-02)부터 GAS 스윕이 시트 값을 번역해 **읽기용으로만** 갱신한다. 관리 화면의 쓰기는 P5(시트 기입 중단 합의) 뒤';
