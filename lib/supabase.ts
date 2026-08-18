/**
 * ⚠️ **미배선 초안 — 정본이 아니다** (실사 2026-08-18).
 *
 * 이 파일은 2026-07-23 대량 임포트 커밋(#100)에 딸려 들어온 뒤 **한 번도 수정되지
 * 않았고, import 하는 곳이 0곳**이다 (`grep -rn "@/lib/supabase" app lib` 로 확인).
 * Supabase 프로젝트도 아직 만들어지지 않아 NEXT_PUBLIC_SUPABASE_* 환경변수가 없다 —
 * 지금 이 모듈을 import 하면 런타임에 빈 URL 로 createClient 가 불린다.
 *
 * 여기 타입(Application/PhoneInterview/WrittenInterview)은 **시트 컬럼을 그대로 옮긴
 * 것**이라, 규칙층(R1~R13)에서 재도출한 ERD v3 와 다르다 — 특히
 *   · 보존기간 개념 없음 (R9: 주문 5년 ↔ 참가자 개인정보 모임 종료 후 1년)
 *   · `applications` 라는 이름이 v3 의 신청 원장과 충돌 (뜻이 다름)
 *   · `job` 은 현행 신청 폼 payload 에 없는 필드 (이미 드리프트)
 * DB 를 실제로 세울 때는 이 파일을 **참고하지 말고 v3 스키마에서 새로 만든다.**
 * 정본 설계: /lazyday/preview/commerce-journey (규칙층 + ERD v3)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── 타입 정의 ────────────────────────────────────────────────────
export type Application = {
  id?: string;
  created_at?: string;
  name: string;
  gender: string;
  age: string;
  phone: string;
  job: string;
  instagram: string;
  referral: string;
  marketing_consent: string;
};

export type PhoneInterview = {
  id?: string;
  created_at?: string;
  name: string;
  phone: string;
  interview_at: string; // "M/d (E) HH:mm – HH:mm" 형식
};

export type WrittenInterview = {
  id?: string;
  created_at?: string;
  name: string;
  phone: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
};
