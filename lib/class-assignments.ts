/**
 * 반배정 읽기 (2026-09-05) — `bookclub_class_assignments` 를 운영자 서식 그대로 묶어 돌려준다.
 *
 * 서식(운영자 2026-09-05 원문):
 *   (8명)  수요일 저녁 반 (19:30-22:30)
 *   반 | 이름
 *   수요일 저녁 | 김동휘 …
 *
 * · 반 수(N명)는 저장하지 않고 **세어서** 낸다 — 운영자가 준 원문의 (8명) 표기와 실제 행 수가
 *   어긋난 반이 있었다(일요일 오후: 표기 8 · 행 9). 화면은 행 수를 믿는다.
 * · 순서는 class_sort · member_sort — 가나다 재정렬을 하지 않는다(운영자 순서 보존).
 * · 파기된 행(member_name null)은 목록에서 뺀다.
 * · 원장 규율(lib/orders.ts LedgerResult)과 같이 **던지지 않는다** — env 가 없으면 enabled:false.
 */

import { supabaseAdmin } from "./supabase-server"

export type ClassGroup = {
  key: string
  /** "수요일 저녁" */
  label: string
  /** "19:30-22:30" */
  time: string
  /** 운영자 순서 그대로 */
  members: string[]
}

export type ClassAssignments =
  | { enabled: false; groups: [] }
  | { enabled: true; groups: ClassGroup[] }

type Row = {
  class_key: string
  class_label: string
  time_label: string
  class_sort: number
  member_name: string | null
  member_sort: number
}

export async function listClassAssignments(cohort: string): Promise<ClassAssignments> {
  const sb = supabaseAdmin()
  if (!sb) return { enabled: false, groups: [] }
  try {
    const { data, error } = await sb
      .from("bookclub_class_assignments")
      .select("class_key, class_label, time_label, class_sort, member_name, member_sort")
      .eq("cohort", cohort)
      .is("purged_at", null)
      .order("class_sort", { ascending: true })
      .order("member_sort", { ascending: true })
    if (error) {
      console.error("[class-assignments]", error.code)
      return { enabled: true, groups: [] }
    }
    const groups: ClassGroup[] = []
    for (const r of (data ?? []) as Row[]) {
      if (!r.member_name) continue
      let g = groups.find((x) => x.key === r.class_key)
      if (!g) {
        g = { key: r.class_key, label: r.class_label, time: r.time_label, members: [] }
        groups.push(g)
      }
      g.members.push(r.member_name)
    }
    return { enabled: true, groups }
  } catch (e) {
    console.error("[class-assignments]", e instanceof Error ? e.message : "unknown")
    return { enabled: true, groups: [] }
  }
}
