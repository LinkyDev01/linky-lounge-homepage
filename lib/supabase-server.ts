/**
 * Supabase **서버 전용** 클라이언트 (2026-08-18, 주문 원장 도입).
 *
 * ⚠ 이 모듈은 라우트 핸들러·서버 액션에서만 import 한다. 클라이언트 컴포넌트에서
 *   부르면 service_role 키가 번들에 실린다 — 그 키는 RLS 를 통째로 우회한다.
 *   환경변수 이름에 `NEXT_PUBLIC_` 을 붙이지 않은 것도 그래서다 (붙이면 Next 가
 *   빌드 타임에 클라이언트 번들로 인라인한다).
 *
 * **설계 결정 5 — RLS 전면 거부**: 테이블에 정책을 하나도 두지 않는다. anon 키는
 * 브라우저에 실리므로 어떤 정책이든 곧 공개를 뜻한다. 모든 읽기·쓰기는 이 클라이언트
 * (service_role, RLS 우회)를 쓰는 서버 라우트를 거친다. 그래서 브라우저용
 * supabase-js 클라이언트는 만들지 않는다.
 *
 * **미설정 시 조용히 꺼진다**: 환경변수가 없으면 null 을 돌려준다. Supabase 프로젝트가
 * 아직 없는 상태에서도 결제·신청이 종전대로 동작해야 하기 때문이다 — 원장 기록은
 * 부가 기능이고, 그것 때문에 결제가 실패하면 본말전도다.
 *
 * 필요한 환경변수 (Vercel 프로젝트 설정 · Production/Preview 모두):
 *   SUPABASE_URL                 https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    Project Settings → API → service_role (secret)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let cached: SupabaseClient | null = null

/** 원장 기록이 켜져 있는가 (환경변수 두 개가 모두 설정됐는가) */
export function isLedgerEnabled() {
  return Boolean(URL && SERVICE_KEY)
}

/** service_role 클라이언트. 미설정이면 null — 호출부가 조용히 건너뛴다 */
export function supabaseAdmin(): SupabaseClient | null {
  if (!URL || !SERVICE_KEY) return null
  if (!cached) {
    cached = createClient(URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }
  return cached
}
