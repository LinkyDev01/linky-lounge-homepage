-- ============================================================
-- ⚠️ 미적용 초안 — **정본 스키마가 아니다** (실사 2026-08-18)
-- ============================================================
-- 2026-07-23 대량 임포트 커밋(#100)에 딸려 들어온 뒤 손대지 않았고, 어떤 Supabase
-- 프로젝트에도 적용된 적이 없다. 아래 세 테이블은 구글 시트 컬럼을 그대로 옮긴 것이라
-- 규칙층(R1~R13)에서 재도출한 ERD v3 와 어긋난다:
--
--   1. 보존기간 개념 없음 — 전자상거래법 5년 보존 대상(주문·결제)과 개인정보보호법상
--      파기 대상(신청·인터뷰 답변)이 같은 행에 있으면 **어느 쪽도 지킬 수 없다** (R9).
--      한 번 이 구조로 데이터가 쌓이면 사후 분리가 사실상 불가능하다.
--   2. `CREATE POLICY "allow insert" ... WITH CHECK (true)` — anon 키는 브라우저 번들에
--      실리므로 이 정책은 **누구나 무제한 INSERT** 를 뜻한다. 스팸·오염에 무방비.
--   3. phone_interviews / written_interviews 가 applications 와 FK 없이 이름+전화로만
--      느슨하게 연결 — 동명이인·번호 변경 시 고아 행이 생긴다.
--   4. `job` 컬럼은 현행 신청 폼 payload 에 없다 (시트 계약과 이미 드리프트).
--
-- 실제 DB 를 세울 때는 이 파일을 이어붙이지 말고 ERD v3 에서 새로 도출한다.
-- 정본 설계: /lazyday/preview/commerce-journey (근본 규칙 R1~R13 + ERD v3)
-- ============================================================

-- ================================================================
-- 레이지데이 북클럽 — Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ================================================================

-- 1) 신청 폼 (handleApply)
CREATE TABLE IF NOT EXISTS applications (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now(),
  name             text        NOT NULL,
  gender           text,
  age              text,
  phone            text,
  job              text,
  instagram        text,
  referral         text,
  marketing_consent text
);

-- 2) 전화 인터뷰 예약 (handlePhoneInterviewBooking)
CREATE TABLE IF NOT EXISTS phone_interviews (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now(),
  name         text        NOT NULL,
  phone        text,
  interview_at text        -- 예: "5/15 (금) 19:00 – 19:30"
);

-- 3) 서면 인터뷰 제출 (handleWrittenInterview)
CREATE TABLE IF NOT EXISTS written_interviews (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  name       text        NOT NULL,
  phone      text,
  q1         text,
  q2         text,
  q3         text,
  q4         text,
  q5         text,
  q6         text
);

-- ── RLS (Row Level Security) ─────────────────────────────────────
-- GAS 는 service_role key 로 직접 insert (RLS bypass)
-- Next.js 클라이언트는 anon key → 읽기 불가 (관리자만 읽어야 함)
ALTER TABLE applications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_interviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE written_interviews ENABLE ROW LEVEL SECURITY;

-- INSERT 는 허용 (GAS → service_role 이 bypass 하므로 사실상 무관,
--  하지만 anon key 로도 직접 insert 가능하게 열어둠)
CREATE POLICY "allow insert" ON applications      FOR INSERT WITH CHECK (true);
CREATE POLICY "allow insert" ON phone_interviews  FOR INSERT WITH CHECK (true);
CREATE POLICY "allow insert" ON written_interviews FOR INSERT WITH CHECK (true);

-- SELECT 는 인증된 사용자(service_role)만
-- 일반 anon 사용자는 데이터 조회 불가
CREATE POLICY "deny select anon" ON applications
  FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "deny select anon" ON phone_interviews
  FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "deny select anon" ON written_interviews
  FOR SELECT USING (auth.role() = 'service_role');
