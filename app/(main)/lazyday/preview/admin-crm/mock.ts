/**
 * 고객관리 대시보드 시안용 목 데이터 — 전부 가짜. 실 DB 를 부르지 않는다.
 * 사람(Person) 하나에 기수별 파이프라인 엔트리·활동 타임라인이 달린다 (Attio 리스트 문법).
 */

export type Stage =
  | "received" // 접수
  | "interview_booked" // 인터뷰 예정
  | "interviewed" // 인터뷰 완료
  | "accepted_unpaid" // 합격 · 미결제
  | "paid" // 결제 완료
  | "attending" // 참가 중
  | "hold" // 보류
  | "rejected" // 탈락

export const STAGES: { key: Stage; label: string; short: string }[] = [
  { key: "received", label: "접수", short: "접수" },
  { key: "interview_booked", label: "인터뷰 예정", short: "인터뷰 예정" },
  { key: "interviewed", label: "인터뷰 완료", short: "인터뷰 완료" },
  { key: "accepted_unpaid", label: "합격 · 미결제", short: "미결제" },
  { key: "paid", label: "결제 완료", short: "결제" },
  { key: "attending", label: "참가 중", short: "참가" },
  { key: "hold", label: "보류", short: "보류" },
  { key: "rejected", label: "탈락", short: "탈락" },
]

export type EventType = "apply" | "interview" | "order" | "note" | "call" | "sms" | "system"
export type Activity = { at: string; type: EventType; title: string; detail?: string; amount?: number; upcoming?: boolean }

export type Entry = { cohort: "3기" | "4기"; stage: Stage; interview?: "phone" | "written"; since: string }

export type Person = {
  id: string
  name: string
  phone: string
  email?: string
  member: boolean
  marketing: boolean
  source?: "profile" | "ad_direct" | "referral"
  entries: Entry[]
  orders: { orderNo: string; at: string; amount: number; items: string; status: "paid" | "refunded" }[]
  applications: { kind: string; at: string; cohort?: string }[]
  note?: string
  flags?: ("gas_failed" | "unsubmitted" | "dup")[]
  activities: Activity[]
}

export const KIND_LABEL: Record<string, string> = {
  bookclub: "북클럽 신청",
  oneday: "원데이 토크",
  coffeebar: "커피앤바",
  notify: "기수 알림",
  interview_phone: "전화 인터뷰",
  interview_written: "서면 인터뷰",
}

const N = (name: string, phone: string, p: Partial<Person>): Person => ({
  id: phone,
  name,
  phone,
  member: false,
  marketing: false,
  entries: [],
  orders: [],
  applications: [],
  activities: [],
  ...p,
})

export const PEOPLE: Person[] = [
  N("김서연", "01033334444", {
    email: "seoyeon@example.com", member: true, marketing: true, source: "profile",
    entries: [{ cohort: "4기", stage: "interview_booked", interview: "phone", since: "2026-09-01" }],
    applications: [{ kind: "bookclub", at: "2026-09-01T05:12:00Z", cohort: "4기" }],
    activities: [
      { at: "2026-09-03T10:00:00Z", type: "interview", title: "전화 인터뷰 예정 · 9/3 (목) 19:00", upcoming: true },
      { at: "2026-09-01T05:12:00Z", type: "apply", title: "북클럽 4기 신청", detail: "서면 X · 전화 인터뷰 희망 · 인스타 프로필 유입" },
      { at: "2026-09-01T05:12:10Z", type: "system", title: "카카오 로그인 계정과 연결됨" },
    ],
  }),
  N("박지훈", "01077778888", {
    source: "ad_direct",
    entries: [{ cohort: "4기", stage: "accepted_unpaid", interview: "written", since: "2026-08-30" }],
    applications: [{ kind: "bookclub", at: "2026-08-27T09:02:00Z", cohort: "4기" }, { kind: "interview_written", at: "2026-08-28T11:20:00Z" }],
    note: "9/2 안내 문자 발송, 답 없음 — 9/4 재안내",
    activities: [
      { at: "2026-09-02T02:00:00Z", type: "sms", title: "결제 안내 문자 발송", detail: "무응답" },
      { at: "2026-08-30T08:00:00Z", type: "system", title: "합격 처리 (시트)" },
      { at: "2026-08-28T11:20:00Z", type: "interview", title: "서면 인터뷰 제출" },
      { at: "2026-08-27T09:02:00Z", type: "apply", title: "북클럽 4기 신청", detail: "광고 직행 유입" },
    ],
  }),
  N("최민서", "01022223333", {
    email: "minseo@example.com", member: true, marketing: true, source: "profile",
    entries: [{ cohort: "4기", stage: "paid", interview: "phone", since: "2026-08-31" }, { cohort: "3기", stage: "attending", since: "2026-05-02" }],
    orders: [{ orderNo: "lz-9c41-77aa-0011", at: "2026-08-31T02:10:00Z", amount: 240000, items: "레이지데이 북클럽 4기", status: "paid" }],
    applications: [{ kind: "bookclub", at: "2026-08-25T02:10:00Z", cohort: "4기" }, { kind: "bookclub", at: "2026-04-20T02:10:00Z", cohort: "3기" }],
    note: "3기 수료 · 재등록",
    activities: [
      { at: "2026-08-31T02:10:00Z", type: "order", title: "결제 완료 · 북클럽 4기", amount: 240000 },
      { at: "2026-08-29T10:30:00Z", type: "call", title: "전화 인터뷰 20분", detail: "3기 때 얘기, 수요반 희망" },
      { at: "2026-08-25T02:10:00Z", type: "apply", title: "북클럽 4기 신청" },
      { at: "2026-06-28T10:00:00Z", type: "system", title: "3기 수료" },
    ],
  }),
  N("이하늘", "01099990000", {
    applications: [{ kind: "coffeebar", at: "2026-08-25T02:00:00Z" }],
    activities: [{ at: "2026-08-25T02:00:00Z", type: "apply", title: "커피앤바 신청", detail: "평일 저녁 희망" }],
  }),
  N("정우진", "01055556666", {
    member: true, source: "profile",
    entries: [{ cohort: "4기", stage: "received", since: "2026-09-02" }],
    applications: [{ kind: "bookclub", at: "2026-09-02T01:40:00Z", cohort: "4기" }],
    flags: ["gas_failed"],
    activities: [{ at: "2026-09-02T01:40:00Z", type: "apply", title: "북클럽 4기 신청", detail: "⚠ 시트 기록 실패 — DB 가 유일한 흔적" }],
  }),
  N("한소희", "01011112222", {
    source: "referral",
    entries: [{ cohort: "4기", stage: "interviewed", interview: "phone", since: "2026-08-30" }],
    applications: [{ kind: "bookclub", at: "2026-08-26T12:00:00Z", cohort: "4기" }],
    activities: [
      { at: "2026-08-30T11:00:00Z", type: "call", title: "전화 인터뷰 25분", detail: "지인 소개(최민서). 일요반" },
      { at: "2026-08-26T12:00:00Z", type: "apply", title: "북클럽 4기 신청" },
    ],
  }),
  N("오태양", "01044445555", {
    orders: [{ orderNo: "lz-d830-a1b2-c3d4", at: "2026-08-30T09:02:00Z", amount: 35000, items: "원데이 토크 · 브람스", status: "paid" }],
    flags: ["unsubmitted"],
    activities: [{ at: "2026-08-30T09:02:00Z", type: "order", title: "결제 완료 · 원데이 토크", amount: 35000, detail: "⚠ 신청서 미제출 — 재진입 링크 보낼 것" }],
  }),
  N("윤지아", "01066667777", {
    email: "jia@example.com", member: true, marketing: false,
    entries: [{ cohort: "4기", stage: "hold", interview: "written", since: "2026-08-29" }],
    applications: [{ kind: "bookclub", at: "2026-08-24T03:00:00Z", cohort: "4기" }, { kind: "interview_written", at: "2026-08-26T03:00:00Z" }],
    note: "일정 미정 — 9/5 다시 연락하기로",
    activities: [
      { at: "2026-08-29T05:00:00Z", type: "note", title: "보류", detail: "본인 요청, 9월 중순 확정" },
      { at: "2026-08-26T03:00:00Z", type: "interview", title: "서면 인터뷰 제출" },
      { at: "2026-08-24T03:00:00Z", type: "apply", title: "북클럽 4기 신청" },
    ],
  }),
  N("강도윤", "01088889999", {
    entries: [{ cohort: "4기", stage: "rejected", interview: "phone", since: "2026-08-28" }],
    applications: [{ kind: "bookclub", at: "2026-08-22T03:00:00Z", cohort: "4기" }],
    activities: [
      { at: "2026-08-28T10:00:00Z", type: "call", title: "전화 인터뷰 15분", detail: "결 안 맞음 — 정중히 안내" },
      { at: "2026-08-22T03:00:00Z", type: "apply", title: "북클럽 4기 신청" },
    ],
  }),
  N("서예린", "01012123434", {
    member: true, marketing: true,
    entries: [{ cohort: "4기", stage: "paid", interview: "written", since: "2026-09-01" }],
    orders: [{ orderNo: "lz-4f2a-19bb-7c01", at: "2026-09-01T12:00:00Z", amount: 240000, items: "레이지데이 북클럽 4기", status: "paid" }],
    applications: [{ kind: "bookclub", at: "2026-08-23T12:00:00Z", cohort: "4기" }, { kind: "interview_written", at: "2026-08-24T12:00:00Z" }],
    activities: [
      { at: "2026-09-01T12:00:00Z", type: "order", title: "결제 완료 · 북클럽 4기", amount: 240000 },
      { at: "2026-08-24T12:00:00Z", type: "interview", title: "서면 인터뷰 제출" },
      { at: "2026-08-23T12:00:00Z", type: "apply", title: "북클럽 4기 신청" },
    ],
  }),
  N("임재현", "01023234545", {
    entries: [{ cohort: "4기", stage: "interview_booked", interview: "phone", since: "2026-09-02" }],
    applications: [{ kind: "bookclub", at: "2026-09-02T00:30:00Z", cohort: "4기" }],
    activities: [
      { at: "2026-09-02T10:30:00Z", type: "interview", title: "전화 인터뷰 예정 · 오늘 19:30", upcoming: true },
      { at: "2026-09-02T00:30:00Z", type: "apply", title: "북클럽 4기 신청" },
    ],
  }),
  N("문가은", "01034345656", {
    entries: [{ cohort: "4기", stage: "received", since: "2026-09-02" }],
    applications: [{ kind: "bookclub", at: "2026-09-02T03:10:00Z", cohort: "4기" }, { kind: "bookclub", at: "2026-09-02T03:12:00Z", cohort: "4기" }],
    flags: ["dup"],
    activities: [
      { at: "2026-09-02T03:12:00Z", type: "apply", title: "북클럽 4기 신청 (중복)", detail: "같은 번호로 2분 간격 2건" },
      { at: "2026-09-02T03:10:00Z", type: "apply", title: "북클럽 4기 신청" },
    ],
  }),
  N("배수아", "01045456767", {
    entries: [{ cohort: "3기", stage: "attending", since: "2026-05-02" }],
    orders: [{ orderNo: "lz-3a01-88cc-2210", at: "2026-04-28T12:00:00Z", amount: 200000, items: "레이지데이 북클럽 3기", status: "paid" }],
    applications: [{ kind: "notify", at: "2026-08-20T12:00:00Z" }],
    activities: [
      { at: "2026-08-20T12:00:00Z", type: "apply", title: "다음 기수 알림 신청" },
      { at: "2026-06-28T10:00:00Z", type: "system", title: "3기 수료" },
      { at: "2026-04-28T12:00:00Z", type: "order", title: "결제 완료 · 북클럽 3기", amount: 200000 },
    ],
  }),
  N("황민준", "01056567878", {
    orders: [{ orderNo: "lz-7b12-33dd-9e05", at: "2026-08-29T12:00:00Z", amount: 35000, items: "원데이 토크 · 브람스", status: "refunded" }],
    applications: [{ kind: "oneday", at: "2026-08-29T12:05:00Z" }],
    activities: [
      { at: "2026-08-31T09:00:00Z", type: "order", title: "환불 · 원데이 토크", amount: -35000, detail: "본인 사정" },
      { at: "2026-08-29T12:05:00Z", type: "apply", title: "원데이 토크 신청" },
      { at: "2026-08-29T12:00:00Z", type: "order", title: "결제 완료 · 원데이 토크", amount: 35000 },
    ],
  }),
  N("신유나", "01067678989", {
    entries: [{ cohort: "4기", stage: "accepted_unpaid", interview: "phone", since: "2026-08-31" }],
    applications: [{ kind: "bookclub", at: "2026-08-25T12:00:00Z", cohort: "4기" }],
    activities: [
      { at: "2026-08-31T10:00:00Z", type: "system", title: "합격 처리 (시트)" },
      { at: "2026-08-29T13:00:00Z", type: "call", title: "전화 인터뷰 20분" },
      { at: "2026-08-25T12:00:00Z", type: "apply", title: "북클럽 4기 신청" },
    ],
  }),
  N("조현우", "01078789090", {
    entries: [{ cohort: "4기", stage: "attending", interview: "written", since: "2026-09-01" }],
    orders: [{ orderNo: "lz-5c33-21ee-4f77", at: "2026-08-30T12:00:00Z", amount: 240000, items: "레이지데이 북클럽 4기", status: "paid" }],
    applications: [{ kind: "bookclub", at: "2026-08-21T12:00:00Z", cohort: "4기" }, { kind: "interview_written", at: "2026-08-22T12:00:00Z" }],
    activities: [
      { at: "2026-08-30T12:00:00Z", type: "order", title: "결제 완료 · 북클럽 4기", amount: 240000 },
      { at: "2026-08-22T12:00:00Z", type: "interview", title: "서면 인터뷰 제출" },
      { at: "2026-08-21T12:00:00Z", type: "apply", title: "북클럽 4기 신청" },
    ],
  }),
]

export const stageOf = (p: Person, cohort: "3기" | "4기" = "4기") => p.entries.find((e) => e.cohort === cohort)?.stage

export const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
export const fmtDateTime = (iso: string) => {
  const d = new Date(iso)
  const k = new Date(d.getTime() + 9 * 3600 * 1000) // KST
  return `${k.getUTCMonth() + 1}/${k.getUTCDate()} ${String(k.getUTCHours()).padStart(2, "0")}:${String(k.getUTCMinutes()).padStart(2, "0")}`
}
export const fmtPhone = (p: string) => p.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
export const won = (n: number) => `${n < 0 ? "−" : ""}₩${Math.abs(n).toLocaleString("ko-KR")}`

/** 오늘 할 일 — 파생 (레퍼런스: HubSpot Overview 의 "upcoming activities" + 우리 상태 점검의 손볼 행) */
export function todayList() {
  const out: { who: Person; what: string; why: string }[] = []
  for (const p of PEOPLE) {
    const up = p.activities.find((a) => a.upcoming)
    if (up) out.push({ who: p, what: up.title, why: "인터뷰" })
    if (p.entries.some((e) => e.stage === "accepted_unpaid")) out.push({ who: p, what: "합격 후 미결제", why: "결제 안내" })
    if (p.flags?.includes("unsubmitted")) out.push({ who: p, what: "결제했는데 신청서 미제출", why: "재진입 링크" })
    if (p.flags?.includes("gas_failed")) out.push({ who: p, what: "시트 기록 실패 — DB 만 있음", why: "시트 보정" })
    if (p.flags?.includes("dup")) out.push({ who: p, what: "중복 접수 2건", why: "분류" })
  }
  return out
}
