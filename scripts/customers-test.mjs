/**
 * lib/customers.ts 조립 로직 리허설 — 합성 행으로 "세 원장을 전화로 묶기"가 맞게 도는지 본다.
 * 실행: `npx tsx scripts/customers-test.mjs` (DB 를 부르지 않는다 — assemble() 만 순수 함수로 검사).
 * ⚠ `node --experimental-strip-types` 로는 안 된다 — 확장자 없는 상대 import 를 못 푼다.
 * service_role 키가 로컬에 없어 라우트 실호출은 프로덕션(관리 호스트 로그인 뒤)에서 확인한다.
 */
import assert from "node:assert/strict"
import { assemble } from "../lib/customers.ts"

const H = 3600_000
const now = Date.now()
const iso = (ms) => new Date(ms).toISOString()

const apps = [
  // 김서연: 북클럽 4기 신청 + 전화 인터뷰 예약(내일) → interview_booked · 회원
  { id: "a1", kind: "bookclub", name: "김서연", phone: "01033334444", order_no: null, cohort: "4기", traffic_src: "profile",
    payload: { interviewType: "전화" }, payload_src: "route", status: "received", status_note: null, gas_body_lost: false,
    purged_at: null, submitted_at: iso(now - 30 * H), triage: null, triage_note: null, marketing_consent_at: iso(now - 30 * H), user_id: "u-1" },
  { id: "a2", kind: "interview_phone", name: "김서연", phone: "010-3333-4444", order_no: null, cohort: null, traffic_src: null,
    payload: { slotStart: iso(now + 20 * H), slotEnd: iso(now + 20.5 * H) }, payload_src: "route", status: "received", status_note: null,
    gas_body_lost: false, purged_at: null, submitted_at: iso(now - 20 * H), triage: null, triage_note: null, marketing_consent_at: null, user_id: null },
  // 박지훈: 시트에서 온 행 — 진행 상태 '미결제' → accepted_unpaid. 서면 제출.
  { id: "a3", kind: "bookclub", name: "박지훈", phone: "01077778888", order_no: null, cohort: "4기", traffic_src: "ad_direct",
    payload: { "진행 상태": "미결제", "인터뷰 방식": "서면", "인터뷰 상태": "O" }, payload_src: "sheet", status: "received", status_note: null,
    gas_body_lost: false, purged_at: null, submitted_at: iso(now - 100 * H), triage: null, triage_note: "9/2 문자, 무응답", marketing_consent_at: null, user_id: null },
  { id: "a4", kind: "interview_written", name: "박지훈", phone: "01077778888", order_no: null, cohort: null, traffic_src: null,
    payload: {}, payload_src: "route", status: "received", status_note: null, gas_body_lost: false, purged_at: null,
    submitted_at: iso(now - 90 * H), triage: null, triage_note: null, marketing_consent_at: null, user_id: null },
  // 문가은: 같은 기수 2건 → dup 플래그 · GAS 실패 표시
  { id: "a5", kind: "bookclub", name: "문가은", phone: "01034345656", order_no: null, cohort: "4기", traffic_src: null,
    payload: {}, payload_src: "route", status: "received", status_note: "GAS 호출 실패", gas_body_lost: false, purged_at: null,
    submitted_at: iso(now - 5 * H), triage: null, triage_note: null, marketing_consent_at: null, user_id: null },
  { id: "a6", kind: "bookclub", name: "문가은", phone: "01034345656", order_no: null, cohort: "4기", traffic_src: null,
    payload: {}, payload_src: "route", status: "received", status_note: null, gas_body_lost: false, purged_at: null,
    submitted_at: iso(now - 4.9 * H), triage: null, triage_note: null, marketing_consent_at: null, user_id: null },
  // 파기된 행만 있는 사람 → purged
  { id: "a7", kind: "notify", name: null, phone: null, order_no: null, cohort: null, traffic_src: null,
    payload: {}, payload_src: "route", status: "received", status_note: null, gas_body_lost: false, purged_at: iso(now - 2 * H),
    submitted_at: iso(now - 400 * 24 * H), triage: null, triage_note: null, marketing_consent_at: null, user_id: null },
]
const orders = [
  // 최민서: 북클럽 4기 결제 → paid (접수는 없어도 주문만으로 사람이 된다) · 신청서 제출됨
  { id: "o1", order_no: "lz-9c41", amount_total: 240000, status: "paid", orderer_name: "최민서", orderer_phone: "01022223333",
    approved_at: iso(now - 50 * H), created_at: iso(now - 50 * H), application_submitted_at: iso(now - 49 * H), user_id: "u-2",
    order_items: [{ name_snapshot: "레이지데이 북클럽 4기", quantity: 1, kind: "meeting" }] },
  // 오태양: 원데이 결제, 신청서 미제출 → unsubmitted
  { id: "o2", order_no: "lz-d830", amount_total: 35000, status: "paid", orderer_name: "오태양", orderer_phone: "01044445555",
    approved_at: iso(now - 70 * H), created_at: iso(now - 70 * H), application_submitted_at: null, user_id: null,
    order_items: [{ name_snapshot: "원데이 토크 · 브람스", quantity: 1, kind: "meeting" }] },
]
const profiles = [
  { user_id: "u-1", display_name: "서연", email: "seoyeon@example.com", phone: null, marketing_consent_at: null },
  { user_id: "u-2", display_name: null, email: "minseo@example.com", phone: "01022223333", marketing_consent_at: iso(now - 50 * H) },
  { user_id: "u-3", display_name: "로그인만", email: "only@example.com", phone: null, marketing_consent_at: null },
]

const list = assemble(apps, orders, profiles, true)
const by = Object.fromEntries(list.map((c) => [c.name, c]))

// 묶임
assert.equal(list.length, 7, "사람 7명: 서연·박지훈·문가은·최민서·오태양·로그인만·(파기행) — 전화 없는 회원 프로필이 접수 묶음과 갈라지면 8이 된다")
assert.equal(by["서연"].phone, "01033334444", "회원 표시이름이 접수 이름보다 우선")
assert.equal(by["서연"].counts.applications, 2, "하이픈 전화(010-3333-4444)가 같은 사람으로 묶인다")
assert.equal(by["서연"].member, true)
assert.equal(by["서연"].marketingConsent, true, "접수의 마케팅 동의가 반영")

// 단계 파생
assert.equal(by["서연"].entries[0].stage, "interview_booked", "내일 전화 인터뷰 → 예정")
assert.equal(by["서연"].entries[0].interview, "phone")
assert.equal(by["서연"].activities[0].upcoming, true, "예정이 타임라인 맨 위")
assert.equal(by["박지훈"].entries[0].stage, "accepted_unpaid", "시트 '미결제' → 합격·미결제 (서면 제출보다 앞선 단계가 이긴다)")
assert.equal(by["박지훈"].entries[0].sheetProgress, "미결제")
assert.equal(by["박지훈"].entries[0].interview, "written")
assert.equal(by["박지훈"].note, "9/2 문자, 무응답")
assert.equal(by["최민서"].entries.length, 0, "접수 없이 주문만 → 기수 엔트리 없음(접수가 기수의 근거)")
assert.equal(by["최민서"].member, true)
assert.equal(by["최민서"].orders[0].applicationSubmitted, true)

// 플래그
assert.deepEqual(by["문가은"].flags, ["gas_failed", "dup"])
assert.deepEqual(by["오태양"].flags, ["unsubmitted"])
assert.equal(by["로그인만"].counts.applications + by["로그인만"].counts.orders, 0, "로그인만 한 회원도 한 사람")
const purged = list.find((c) => c.flags.includes("purged"))
assert.ok(purged && purged.name === null && purged.phone === null, "파기행만 있는 사람은 이름·전화 없이 purged")

// 정렬: 최근 활동순 (문가은 5h 전 > 서연 20h > 최민서 50h > 오태양 70h > 박지훈 90h)
assert.deepEqual(list.filter((c) => c.name).map((c) => c.name).slice(0, 5), ["문가은", "서연", "최민서", "오태양", "박지훈"])

console.log("customers-test: ok —", list.length, "명,", list.map((c) => `${c.name ?? "(파기)"}:${c.entries[0]?.stage ?? "-"}`).join(" · "))

// ── 오늘 할 일 파생 (CRM-4) ───────────────────────────────────────────
const { deriveToday } = await import("../lib/admin-today.ts")
const today = deriveToday(list, now)
const kinds = (name) => today.filter((t) => t.name === name).map((t) => t.kind)
assert.deepEqual(kinds("서연"), ["interview_today", "age_unverified"], "내일 전화 인터뷰 → 인터뷰 예정 (+ 회원이라 만 14세 미확인)")
assert.ok(kinds("박지훈").includes("unpaid"), "시트 '미결제' → 합격 후 미결제")
assert.deepEqual(kinds("오태양"), ["unsubmitted"])
assert.deepEqual(kinds("문가은").sort(), ["dup", "gas_failed"])
assert.equal(today.filter((t) => t.kind === "age_unverified").length, 3, "회원 3명(서연·최민서·로그인만) 전부 만 14세 미확인")
// 인터뷰 완료 3일 경과 결과 미기록: 박지훈은 시트 값이 있어 제외. 한소희 같은 케이스를 합성
const hs = { ...by["박지훈"], key: "01011112222", name: "한소희", entries: [{ cohort: "4기", stage: "interviewed", sheetProgress: null, interview: "phone", since: iso(now - 200 * H) }], lastInterviewAt: iso(now - 4 * 24 * H), flags: [], activities: [] }
assert.deepEqual(deriveToday([hs], now).map((t) => t.kind), ["result_missing"], "인터뷰 4일 전, 시트 비어 있음 → 결과 미기록")
const hs2 = { ...hs, lastInterviewAt: iso(now - 2 * 24 * H) }
assert.deepEqual(deriveToday([hs2], now), [], "2일 전이면 아직 아님")
console.log("today-test: ok —", today.map((t) => `${t.name}:${t.kind}`).join(" · "))
