"use client"

import { SIM_LABEL, type SimMode } from "../../sim"
import { BOOKCLUB_ORIGIN } from "@/lib/site"
import { AdminShell } from "../AdminShell"
import styles from "./simulate.module.css"

/**
 * 신청·인터뷰 흐름 체험 테스트 (운영자 지시 2026-08-06).
 * 실제 신청자와 똑같은 화면을 그대로 밟으면서 성공/실패 케이스를 눈으로 확인한다.
 * 이 메뉴로 들어간 화면은 서버를 호출하지 않아 시트·캘린더·알림톡에 아무것도 남지 않는다.
 * (경로가 /admin/* 이라 미들웨어의 관리자 로그인 보호를 그대로 받는다)
 * 2026-09-02 관리 호스트 분리: 신청 화면은 관리 호스트(admin.lazy-club.com)에 없으므로
 * 진입 링크는 북클럽 도메인 절대 URL 이다 — 프리뷰 빌드의 sim 검증은 그 프리뷰 호스트에서
 * `/apply?sim=ok` 처럼 직접 입력한다.
 */

type Step = {
  key: string
  title: string
  desc: string
  href: string
  cases: { mode: SimMode; expect: string }[]
}

const STEPS: Step[] = [
  {
    key: "apply",
    title: "1단계 · 북클럽 신청",
    desc: "인적사항 입력 → 제출 → 완료 화면(인터뷰로 넘어가는 버튼)",
    href: `${BOOKCLUB_ORIGIN}/apply`,
    cases: [
      { mode: "ok", expect: "제출 성공 → '신청해주셔서 감사합니다' 완료 화면" },
      { mode: "fail", expect: "제출 실패 안내가 뜨고 입력값이 그대로 남는지" },
      { mode: "slow", expect: "제출이 13초 걸릴 때 대기 화면이 어떻게 보이는지" },
    ],
  },
  {
    key: "written",
    title: "2단계 · 서면 인터뷰",
    desc: "6개 문항 작성 → 제출. 실패 시 작성 내용 복사·문의 링크 확인",
    href: `${BOOKCLUB_ORIGIN}/apply/interview/written`,
    cases: [
      { mode: "ok", expect: "제출 성공 → 완료 화면" },
      { mode: "fail", expect: "실패 배너 + '작성 내용 전체 복사' + 카카오 문의 링크" },
      { mode: "slow", expect: "10초 지나면 '제출이 오래 걸리고 있어요' + 복사 안내" },
    ],
  },
  {
    key: "schedule",
    title: "2단계 · 전화 인터뷰 예약",
    desc: "날짜·시간 선택 → 예약. 슬롯이 없거나 조회가 실패하는 경우까지",
    href: `${BOOKCLUB_ORIGIN}/apply/interview/schedule`,
    cases: [
      { mode: "ok", expect: "예약 성공 → 예약 완료 화면" },
      { mode: "fail", expect: "예약 실패 안내 + 카카오 문의 링크" },
      { mode: "empty", expect: "'지금은 예약 가능한 시간이 없습니다' + 문의 링크" },
      { mode: "slotfail", expect: "'예약 가능한 시간을 불러오지 못했어요' + 문의 링크" },
    ],
  },
]

export default function SimulatePage() {
  return (
    <AdminShell>
    <main className={`${styles.page} ${styles.embedded}`}>
      <div className={styles.container}>
        {/* '상태 점검' 링크는 셸 내비가 대신한다 (CRM-7) */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>신청 흐름 테스트</h1>
            <p className={styles.sub}>
              실제 신청자와 <strong>똑같은 화면</strong>을 그대로 밟으면서 성공·실패 상황을 확인합니다.
            </p>
          </div>
        </header>

        <p className={styles.notice}>
          여기서 연 화면은 <strong>서버를 호출하지 않습니다</strong> — 신청현황 시트·구글 캘린더·알림톡에
          아무것도 남지 않으니 마음껏 눌러보셔도 됩니다. 테스트 중에는 화면 맨 위에 검은 띠가 계속 떠 있습니다.
        </p>

        {STEPS.map((step) => (
          <section key={step.key} className={styles.card}>
            <h2 className={styles.cardTitle}>{step.title}</h2>
            <p className={styles.cardDesc}>{step.desc}</p>
            <ul className={styles.caseList}>
              {step.cases.map((c) => (
                <li key={c.mode} className={styles.caseRow}>
                  <a className={styles.caseBtn} href={`${step.href}?sim=${c.mode}`}>
                    {SIM_LABEL[c.mode]}
                  </a>
                  <span className={styles.caseExpect}>{c.expect}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className={styles.foot}>
          실제 접수까지 확인하려면 테스트 모드 없이 <a href={`${BOOKCLUB_ORIGIN}/apply`}>신청 페이지</a>에서 진행하시면 됩니다.
          (이 경우 시트·캘린더에 실제로 기록됩니다)
        </p>
      </div>
    </main>
    </AdminShell>
  )
}
