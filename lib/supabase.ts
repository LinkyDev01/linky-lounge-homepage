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
