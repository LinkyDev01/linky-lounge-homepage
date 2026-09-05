import { cookies } from "next/headers"
import { SEASON } from "../season-config"
import { listClassAssignments } from "@/lib/class-assignments"
import { CLASSES_COOKIE, classesGateEnabled, verifyClassesToken } from "@/lib/classes-gate"
import styles from "./classes.module.css"

export const dynamic = "force-dynamic"

/**
 * 반배정 열람 — 고객 공유용 (운영자 2026-09-05 "고객 공유용으로 반배정 페이지").
 *
 * · 서식은 운영자가 준 그대로: `(N명) 수요일 저녁 반 (19:30-22:30)` 머리 → `반 | 이름` 표.
 *   N 은 저장값이 아니라 행 수다(원문의 표기와 행 수가 어긋난 반이 있었다 — lib/class-assignments.ts).
 * · 서식(레이지클럽 관리 화면 §9)만 빌렸고 관리 셸·내비는 없다 — 멤버가 링크로 열어 보는 한 장.
 * · 열람 암호 하나로 연다(lib/classes-gate.ts). 명단은 DB 에만 있다 — 레포가 public 이라서.
 * · 북클럽 도메인에서 `/classes` (미들웨어 rewrite). 기수는 season-config 의 현재 기수.
 */
export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ wrong?: string; closed?: string }>
}) {
  const sp = await searchParams
  const jar = await cookies()
  const unlocked = await verifyClassesToken(jar.get(CLASSES_COOKIE)?.value)
  const enabled = classesGateEnabled()

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <header className={styles.head}>
          <h1 className={styles.h1}>레이지데이 북클럽 {SEASON.name} 반배정</h1>
          <p className={styles.sub}>{SEASON.periodLabel}</p>
        </header>

        {!enabled ? (
          <p className={styles.empty}>준비 중입니다.</p>
        ) : !unlocked ? (
          <Gate wrong={sp.wrong === "1"} />
        ) : (
          <Roster cohort={SEASON.name} />
        )}

        <footer className={styles.foot}>레이지데이 북클럽</footer>
      </main>
    </div>
  )
}

function Gate({ wrong }: { wrong: boolean }) {
  return (
    <section className={styles.gate}>
      <p className={styles.gateNote}>안내받으신 열람 암호를 입력해 주세요.</p>
      <form method="post" action="/api/lazyday/classes/unlock" className={styles.field}>
        <label className={styles.label} htmlFor="pw">
          열람 암호
        </label>
        <input
          id="pw"
          name="password"
          type="text"
          className={styles.input}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
        />
        {wrong && <p className={styles.error}>암호가 맞지 않습니다.</p>}
        <div className={styles.actions}>
          <button type="submit" className={styles.submit}>
            열람
          </button>
        </div>
      </form>
    </section>
  )
}

async function Roster({ cohort }: { cohort: string }) {
  const res = await listClassAssignments(cohort)
  if (!res.enabled || res.groups.length === 0) {
    return <p className={styles.empty}>아직 등록된 반배정이 없습니다.</p>
  }
  return (
    <>
      {res.groups.map((g) => (
        <section key={g.key} className={styles.block}>
          {/* 운영자 서식: (8명)  수요일 저녁 반 (19:30-22:30) */}
          <h2 className={styles.blockHead}>
            <span className={styles.count}>({g.members.length}명)</span>
            {g.label} 반<span className={styles.time}>({g.time})</span>
          </h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">반</th>
                <th scope="col">이름</th>
              </tr>
            </thead>
            <tbody>
              {g.members.map((name, i) => (
                <tr key={`${g.key}-${i}`}>
                  <td>{g.label}</td>
                  <td>{name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </>
  )
}
