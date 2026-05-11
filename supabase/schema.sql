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
