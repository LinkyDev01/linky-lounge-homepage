import { cookies, headers } from "next/headers"
import { SEASON } from "../season-config"
import { listClassAssignments } from "@/lib/class-assignments"
import { CLASSES_COOKIE, classesGateEnabled, verifyClassesToken } from "@/lib/classes-gate"
import { ClassesGateModal } from "./ClassesGateModal"
import styles from "./classes.module.css"

export const dynamic = "force-dynamic"

/**
 * 반배정 열람 — 고객 공유용 (운영자 2026-09-05 "고객 공유용으로 반배정 페이지").
 *
 * · 서식은 운영자가 준 그대로: `(N명) 수요일 저녁 반 (19:30-22:30)` 머리 → `반 | 이름` 표.
 *   N 은 저장값이 아니라 행 수다(원문의 표기와 행 수가 어긋난 반이 있었다 — lib/class-assignments.ts).
 * · 서식(레이지클럽 관리 화면 §9)만 빌렸고 관리 셸·내비는 없다 — 멤버가 링크로 열어 보는 한 장.
 * · 잠겨 있으면 **모달**이 뜬다(운영자 "누구나 직접 그 자리 모달에서 입력하는 형태").
 *   ⚠ 잠긴 동안 명단은 **HTML 에 실리지 않는다** — 모달은 덮개가 아니라 문이다.
 * · 암호·명단 둘 다 DB 에 있다(0015·0016) — 레포가 public 이라서.
 * · 북클럽 도메인에서 `/classes` (미들웨어 rewrite). 기수는 season-config 의 현재 기수.
 */
export default async function ClassesPage() {
  const jar = await cookies()
  const unlocked = await verifyClassesToken(jar.get(CLASSES_COOKIE)?.value)
  const enabled = classesGateEnabled()

  // 모달이 부를 주소 — `/api/*` 는 미들웨어 밖이라 어느 호스트에서도 같은 경로다
  const endpoint = "/api/lazyday/classes/unlock"
  // 잠긴 화면은 본문을 비워 둔다 — 뒤에 깔아 두고 가리면 소스 보기로 읽힌다
  const showRoster = enabled && unlocked

  return (
    <div className={styles.root}>
      <main className={styles.main} aria-hidden={enabled && !unlocked ? true : undefined}>
        <header className={styles.head}>
          <h1 className={styles.h1}>레이지데이 북클럽 {SEASON.name} 반배정</h1>
          <p className={styles.sub}>{SEASON.periodLabel}</p>
        </header>

        {!enabled ? (
          <p className={styles.empty}>준비 중입니다.</p>
        ) : showRoster ? (
          <Roster cohort={SEASON.name} />
        ) : (
          <p className={styles.empty}>&nbsp;</p>
        )}

        <footer className={styles.foot}>레이지데이 북클럽</footer>
      </main>

      {enabled && !unlocked && <ClassesGateModal endpoint={endpoint} />}
    </div>
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
