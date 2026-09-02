/**
 * 신청·인터뷰 흐름 시뮬레이션 (운영자 지시 2026-08-06).
 *
 * 목적: 운영자가 **실제 신청자와 똑같은 화면**을 밟으면서 성공/실패 케이스를
 * 눈으로 확인할 수 있게 한다. `?sim=` 파라미터가 붙은 동안에는 서버를 아예
 * 호출하지 않으므로 **시트·캘린더·알림톡에 아무것도 남지 않는다.**
 *
 * 진입은 관리자 전용 페이지(/admin/simulate)에서 하고, 시뮬레이션 중인
 * 화면에는 항상 상단 배너가 떠 실제 신청과 혼동되지 않게 한다.
 */

export const SIM_MODES = ["ok", "fail", "slow", "empty", "slotfail"] as const
export type SimMode = (typeof SIM_MODES)[number]

export const SIM_LABEL: Record<SimMode, string> = {
  ok: "정상 (성공)",
  fail: "서버 오류 (제출 실패)",
  slow: "응답 지연 (13초)",
  empty: "예약 슬롯 전부 마감",
  slotfail: "예약 슬롯 조회 실패",
}

/** 현재 URL의 ?sim= 값 — 유효하지 않으면 null */
export function readSim(search?: string): SimMode | null {
  const qs = search ?? (typeof window !== "undefined" ? window.location.search : "")
  if (!qs) return null
  const v = new URLSearchParams(qs).get("sim")
  return SIM_MODES.includes(v as SimMode) ? (v as SimMode) : null
}

/** 링크에 현재 sim 모드를 이어 붙인다 (단계 이동 시 모드 유지) */
export function withSim(href: string, mode: SimMode | null) {
  if (!mode) return href
  return href + (href.includes("?") ? "&" : "?") + "sim=" + mode
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * 제출(신청·서면·예약) 시뮬레이션 — 실제 API를 호출하지 않는다.
 * 실패 케이스는 throw 해서 각 페이지의 기존 실패 처리(배너·복사·문의 링크)를 그대로 태운다.
 */
export async function simSubmit(mode: SimMode): Promise<{ success: true }> {
  if (mode === "fail") {
    await wait(900)
    throw new Error("시뮬레이션: 서버 오류")
  }
  if (mode === "slow") {
    // 지연 안내(10초)가 뜨는지 확인할 수 있게 그보다 길게
    await wait(13_000)
    return { success: true }
  }
  await wait(700)
  return { success: true }
}

/**
 * 예약 슬롯 조회 시뮬레이션.
 * - empty:    앞으로 9일을 통째로 예약됨 처리 → '전부 마감' 안내 확인
 * - slotfail: 조회 실패 → 조회 실패 안내·문의 링크 확인
 * - 그 외:    실제와 같은 빈 목록(전부 예약 가능)
 */
export async function simSlots(mode: SimMode): Promise<{ bookedSlots: { start: string; end: string }[] }> {
  if (mode === "slotfail") {
    await wait(600)
    throw new Error("시뮬레이션: 슬롯 조회 실패")
  }
  if (mode === "empty") {
    const all: { start: string; end: string }[] = []
    for (let d = 0; d < 9; d++) {
      const base = new Date(Date.now() + d * 86_400_000)
      const s = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()))
      all.push({ start: s.toISOString(), end: new Date(s.getTime() + 86_400_000).toISOString() })
    }
    await wait(400)
    return { bookedSlots: all }
  }
  await wait(400)
  return { bookedSlots: [] }
}
