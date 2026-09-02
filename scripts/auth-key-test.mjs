// Supabase 키 모양 검사 리허설 (2026-09-02) — `npx tsx scripts/auth-key-test.mjs`
// 실측 사고: Vercel SUPABASE_ANON_KEY 에 대시보드 마스킹 표시값(eyJhbGciOiJIUzI•••…)이 들어가
// 헤더 ByteString 오류로 소셜 로그인이 하루 종일 실패. 이 검사가 그 값을 "malformed" 로 잡아야 한다.
import { apiKeyProblem, describeApiKey, jwtRole, normalizeApiKey } from "../lib/supabase-key.ts"

const b64url = (s) => Buffer.from(s).toString("base64url")
const jwt = (role) => `${b64url('{"alg":"HS256","typ":"JWT"}')}.${b64url(JSON.stringify({ iss: "supabase", ref: "abc", role, iat: 1, exp: 2 }))}.${b64url("sig")}`
const ANON = jwt("anon")
const SERVICE = jwt("service_role")
const MASKED = "eyJhbGciOiJIUzI" + "•".repeat(31)

let fails = 0
function eq(label, got, want) {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? "ok " : "FAIL"} ${label}: ${JSON.stringify(got)}${ok ? "" : ` (want ${JSON.stringify(want)})`}`)
}

eq("anon JWT → 정상", apiKeyProblem(ANON, "anon"), null)
eq("publishable → 정상", apiKeyProblem("sb_publishable_8HziLT_sFEwMvwt0nbByCw_9LLYgINB", "anon"), null)
eq("service_role JWT → service 자리 정상", apiKeyProblem(SERVICE, "service"), null)
eq("sb_secret → service 자리 정상", apiKeyProblem("sb_secret_abc_DEF-123", "service"), null)
eq("마스킹 표시값 → malformed", apiKeyProblem(MASKED, "anon"), "malformed")
eq("마스킹 설명에 U+2022·위치", describeApiKey(MASKED), "길이 46, 15번째에 헤더 불가 문자 U+2022 (마스킹 •)")
eq("앞뒤 줄바꿈 → 고쳐서 정상", apiKeyProblem(`  ${ANON}\n`, "anon"), null)
eq("중간 줄바꿈(복붙 줄바꿈) → 고쳐서 정상", apiKeyProblem(ANON.slice(0, 20) + "\n" + ANON.slice(20), "anon"), null)
eq("정규화가 공백만 지움", normalizeApiKey(` ${ANON.slice(0, 5)} \n${ANON.slice(5)} `), ANON)
eq("'Bearer ' 접두 → malformed", apiKeyProblem(`Bearer ${ANON}`, "anon"), "malformed")
eq("따옴표 포함 → malformed", apiKeyProblem(`"${ANON}"`, "anon"), "malformed")
eq("service_role 을 anon 자리에 → wrongrole", apiKeyProblem(SERVICE, "anon"), "wrongrole")
eq("sb_secret 을 anon 자리에 → wrongrole", apiKeyProblem("sb_secret_x", "anon"), "wrongrole")
eq("anon 을 service 자리에 → wrongrole", apiKeyProblem(ANON, "service"), "wrongrole")
eq("비어 있음 → missing", apiKeyProblem("", "anon"), "missing")
eq("undefined → missing", apiKeyProblem(undefined, "anon"), "missing")
eq("공백만 → missing", apiKeyProblem("  \n", "anon"), "missing")
eq("jwtRole anon", jwtRole(ANON), "anon")
eq("jwtRole 비JWT → null", jwtRole("sb_publishable_x"), null)
eq("JWT 인데 페이로드 깨짐 → role null 이지만 모양은 정상", apiKeyProblem("eyJx.eyJ.sig", "anon"), null)

console.log(fails ? `\n${fails} FAILED` : "\nall ok")
process.exit(fails ? 1 : 0)
