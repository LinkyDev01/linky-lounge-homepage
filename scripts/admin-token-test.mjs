/**
 * 관리자 서명 토큰 리허설 — lib/admin-session.ts (2026-09-02).
 * 실행: `ADMIN_SECRET=devsecret npx tsx scripts/admin-token-test.mjs`
 *   · 발급→검증 왕복 / 서명 변조 / 만료 / 다른 시크릿 / 옛 형식(시크릿 원문) / 형식 오류
 * 토큰만 찍고 싶으면: `ADMIN_SECRET=devsecret npx tsx scripts/admin-token-test.mjs --mint [who]`
 *   (목 스크린샷 스크립트가 쿠키 값으로 쓴다 — 시크릿 원문은 더 이상 통과하지 않는다)
 */
import assert from "node:assert/strict"

process.env.ADMIN_SECRET ||= "devsecret"
const { signAdminToken, verifyAdminToken, ADMIN_MAX_AGE } = await import("../lib/admin-session.ts")

if (process.argv[2] === "--mint") {
  console.log(await signAdminToken(process.argv[3] || "rehearsal@example.com"))
  process.exit(0)
}

const t = await signAdminToken("dongmin@example.com")
assert.equal(t.split(".").length, 2, "payload.sig 두 조각")
assert.ok(!t.includes(process.env.ADMIN_SECRET), "토큰에 시크릿 원문이 들어가면 안 된다")

const ok = await verifyAdminToken(t)
assert.ok(ok && ok.who === "dongmin@example.com", "왕복 — who 복원")
assert.ok(ok.exp - ok.iat === ADMIN_MAX_AGE, "만료 = 7일")

// 서명 1글자 변조
const [p, s] = t.split(".")
const flipped = s[0] === "A" ? "B" : "A"
assert.equal(await verifyAdminToken(`${p}.${flipped}${s.slice(1)}`), null, "서명 변조 → null")
// payload 변조 (who 바꿔치기) — 서명이 안 맞아야 한다
const forged = Buffer.from(JSON.stringify({ v: 1, who: "evil@example.com", iat: ok.iat, exp: ok.exp })).toString("base64url")
assert.equal(await verifyAdminToken(`${forged}.${s}`), null, "payload 바꿔치기 → null")
// 만료
const expired = await signAdminToken("x@example.com", { now: Date.now() - (ADMIN_MAX_AGE + 60) * 1000 })
assert.equal(await verifyAdminToken(expired), null, "만료 → null")
// 옛 형식 · 형식 오류
assert.equal(await verifyAdminToken(process.env.ADMIN_SECRET), null, "옛 형식(시크릿 원문) → null")
assert.equal(await verifyAdminToken(""), null)
assert.equal(await verifyAdminToken("a.b.c"), null)
assert.equal(await verifyAdminToken("not-base64!.x"), null)
// 다른 시크릿으로 검증
process.env.ADMIN_SECRET = "othersecret"
assert.equal(await verifyAdminToken(t), null, "다른 시크릿 → null")
// 시크릿 미설정
process.env.ADMIN_SECRET = ""
assert.equal(await verifyAdminToken(t), null, "시크릿 미설정 → null")

console.log("admin-token-test: ok — 발급·왕복·변조 2종·만료·옛 형식·형식 오류 3종·다른 시크릿·미설정")
