"use client"

/**
 * lazy-club.com 랜딩 인트로 (라운드 47 도입 · 라운드 48 개정)
 *
 * 이 페이지는 '커밍순'이 아니라 정식 랜딩이다. 방문하면 인트로(WELCOME TO →
 * 4×4 알파벳 셔플 → LAZY·CLUB 완성 → 빙고 동그라미)가 재생되고, 끝나는 순간
 * 내비·푸터가 색을 되찾으며 나타난다.
 *
 * 시퀀스 (총 4.6s, 1회성):
 *   0–1.0s   WELX / COME / TOXX / XXXX — 잉크 단색(#1a1208) 정지 화면 (라운드 54)
 *   1.0–3.0s 셔플 2.0s — 16칸이 각자 60~140ms 무작위 간격으로 A–Z를 교체하며,
 *            글자가 바뀔 때마다 3색(#f49938/#96ab9b/#845d5e) 중 무작위 재배정
 *   3.0s     고정 — CWEL / LAZY / UCOM / BETO. LAZY·CLUB 7글자는 세 컬러 중
 *            무작위 1색으로 통일(새로고침마다 다름), 나머지 9글자(=WELCOME TO)는
 *            셔플 마지막 색 유지 — 단 단색과 같으면 다른 색으로 치환
 *            (써클 주위 글자는 써클 안 글자와 반드시 다른 색)
 *   3.3s     LAZY 동그라미 — 글자 확정 후 0.3s, 한 번에 짠 (라운드 59)
 *   3.6s     CLUB 동그라미 — 다시 0.3s 뒤. 글자 확정과 동시에 그리지 않는다
 *   3.6–4.6s 정지 유지 (써클까지 완성된 화면을 1.0s — 라운드 60)
 *   4.6s     최종 상태 — 내비·푸터가 색을 되찾아 노출 (페이드 없이 즉시)
 *
 * 레이아웃 불변 (라운드 48 핵심): 내비·푸터는 t=0부터 최종 레이아웃 그대로
 * 렌더하고, 인트로 동안에만 배경색으로 맞춰 숨긴다(로고 이미지는 opacity 0).
 * 따라서 시작 시점과 끝 시점의 화면 배치가 완전히 같고 그리드는 1px도 움직이지 않는다.
 * 스크롤은 잠그지 않는다 — 잠그면 데스크톱 스크롤바가 사라지며 폭이 바뀐다.
 * 대신 스크롤·휠은 스킵 트리거라 인트로가 즉시 끝난다.
 *
 * 입력(라운드 57): 인트로를 끊지 않는다. 터치·클릭·키·휠·스크롤이 들어오면
 * **내비·푸터만 먼저 드러내고** 애니메이션은 끝까지 재생된다 — 한 번의 터치로
 * 연출 전체가 날아가지 않게. reduced-motion만 예외로 즉시 최종 상태.
 * 인트로는 방문마다 재생.
 *
 * 유휴 셔플(라운드 77, 운영자): 마지막 입력으로부터 **60초** 동안 화면을 건드리지
 * 않으면 고정 배열을 벗어나 **끝없는 난수 셔플**로 돌아간다 (인트로 셔플과 같은
 * 문법, 종료 시점 없음). 이 동안에는 빙고 동그라미·맥동·링크가 모두 없다 —
 * 마크가 LAZY·CLUB을 말하고 있지 않으므로. 아무 입력이나 들어오면 즉시 최종
 * 고정 상태로 복귀하고 60초 타이머가 다시 시작된다.
 * 유휴 60초 셔플(라운드 77)은 라운드 79에서 셸 오버레이(IdleShuffle.tsx)로 이관 —
 * lazy-club.com 트리 전 페이지 공통. 이 컴포넌트는 인트로 1회 재생만 담당한다.
 *
 * ?still=1 (라운드 78, 운영자): 인트로를 재생하지 않고 **최종 정지 화면부터** 연다.
 * 내비 로고가 이 주소를 가리킨다 — 로고를 누를 때마다 인트로가 다시 도는 걸 막기 위함.
 * 색은 이전 방문값을 저장·복원하지 않고 이번 시드로 새로 뽑는다(상태 없음 = 오류 없음).
 * 유휴 60초 셔플은 이 경로에서도 그대로 작동한다.
 *
 * 구현: 단일 rAF 클록 + 순수 함수 stateAt. 난수는 마운트 시 시드 하나만 뽑고
 * (셔플 글자·색·간격·단색은 전부 시드 해시로 유도) stateAt은 읽기만 한다 —
 * 프레임마다 Math.random()을 부르면 화면이 발작하듯 재추첨된다.
 * 시드는 클라이언트 effect에서 생성 (SSR 첫 페인트는 웰컴 배열 → 배치 동일).
 */

import { useEffect, useState } from "react"
import { LazyclubLink } from "../LazyclubLink"
import { HOME, WorkroomShell } from "../Shell"
import styles from "./coming-soon.module.css"
// 배열·타임라인·상태 함수는 공유 코어에서 (2026-08-22 추출) — 하위 페이지 인트로
// 오버레이(IntroOverlay)와 **같은 것을 읽는다**. 사본을 뜨면 연출이 갈라진다
import { HOT, INITIAL, markIntroSeen, stateAt, T } from "../intro-core"

export function ComingSoonMain() {
  const [elapsed, setElapsed] = useState(0)
  const [seed, setSeed] = useState<number | null>(null)
  // 입력이 있으면 인트로를 끊지 않고 내비·푸터만 먼저 내보낸다 (라운드 57)
  const [chromeEarly, setChromeEarly] = useState(false)

  useEffect(() => {
    // 랜딩 = 인트로 그 자체 — 여기 도착한 것만으로 '이번 방문에 봤다'로 기록한다
    // (?still·reduced-motion 포함: 최종 마크를 봤으면 본 것). 안 남기면 하위 페이지의
    // IntroOverlay 가 처음 방문으로 판정해 **같은 인트로가 연달아 두 번** 뜬다
    // (2026-08-23 운영자 실측 신고 — 기록·판정의 단일 출처는 intro-core)
    markIntroSeen()

    // 난수 시드는 여기서 딱 한 번 (구현 주의 — stateAt은 읽기만 한다)
    const s = Math.floor(Math.random() * 2147483647) || 1
    setSeed(s)

    // ?t=<ms> — 검토 스크린샷용 시점 고정
    const q = new URLSearchParams(window.location.search)
    const t = Number(q.get("t"))
    if (q.get("t") && Number.isFinite(t)) {
      setElapsed(t)
      return
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setElapsed(T.END) // 모션 없이 즉시 최종 상태
      return
    }
    // ?still=1 — 인트로를 건너뛰고 최종 정지 화면부터 (라운드 78: 내비 로고 진입 경로).
    // 색은 이번 시드로 새로 뽑는다 — 이전 값을 저장·복원하지 않아 상태가 없다
    if (q.get("still") !== null) {
      setElapsed(T.END)
      return
    }

    // 유휴 60초 셔플은 라운드 79부터 셸 오버레이(IdleShuffle)가 전 페이지 공통으로
    // 담당한다 — 이 컴포넌트는 인트로 1회 재생만 맡는다 (라운드 77 페이지 내 유휴 로직 이관)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const e = now - start
      if (e >= T.END) {
        setElapsed(T.END)
        removeListeners()
        return
      }
      setElapsed(e)
      raf = requestAnimationFrame(tick)
    }
    // 입력 — 인트로를 끊지 않는다. 내비·푸터만 먼저 드러내고 애니메이션은 끝까지 재생
    // (라운드 57: 터치 한 번에 연출이 통째로 날아가던 동작 폐기)
    const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const
    const onInput = () => setChromeEarly(true)
    const removeListeners = () => EVENTS.forEach((ev) => window.removeEventListener(ev, onInput))
    EVENTS.forEach((ev) => window.addEventListener(ev, onInput, { passive: true }))
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      removeListeners()
    }
  }, [])

  const s = seed === null ? null : stateAt(elapsed, seed)
  const cells = s?.cells ?? INITIAL

  const gridInner = (
    <>
      {cells.map((cell, i) => (
        // 써클 안 7글자(C·L·U·B + A·Z·Y)에는 hot 표식 — hover 그림자(라운드 61) +
        // 링크 상태에서 맥동(라운드 66~68). 7글자는 한 몸처럼 **동일 위상**으로
        // 밝아지고 어두워진다 (라운드 68 — 67의 엇갈림 폐기, 운영자 지시)
        <span
          key={i}
          className={`${styles.cell}${HOT.has(`${Math.floor(i / 4)}-${i % 4}`) ? ` ${styles.hot}` : ""}`}
          style={{ color: cell.color }}
          aria-hidden
        >
          {cell.ch}
        </span>
      ))}
      {/* 빙고 동그라미 — 각각 한 번에 짠 하고 나타난다 (라운드 59, 4스텝 와이프 폐기).
          글자 확정 0.3s 뒤 LAZY, 다시 0.3s 뒤 CLUB */}
      {s?.capLazy && <div className={`${styles.capsule} ${styles.capRow}`} aria-hidden />}
      {s?.capClub && <div className={`${styles.capsule} ${styles.capCol}`} aria-hidden />}
    </>
  )

  // 셸은 t=0부터 최종 레이아웃 그대로 — 인트로 동안 내비·푸터만 배경색으로 가린다
  // (인트로가 끝났거나, 사용자가 입력해 크롬을 먼저 요청했으면 노출)
  return (
    <WorkroomShell paper="#f8f3ef" chromeHidden={!s?.done && !chromeEarly}>
      <main className={styles.main}>
        <div className={styles.stage}>
          {/* 인트로가 끝나면 마크 전체가 레이지클럽 홈으로 가는 링크가 된다 (라운드 58).
              화면에는 어떤 표시도 더하지 않는다 — 마크가 변하지 않는다는 것이 선택 이유.
              반응은 hover·press의 옅은 그림자뿐 (모바일은 상시 옅은 그림자) */}
          {s?.done ? (
            <LazyclubLink href={HOME} className={`${styles.grid} ${styles.gridLink}`} aria-label="레이지클럽 홈으로">
              {gridInner}
            </LazyclubLink>
          ) : (
            <div className={styles.grid} aria-label="LAZY CLUB">
              {gridInner}
            </div>
          )}
        </div>
      </main>
    </WorkroomShell>
  )
}
