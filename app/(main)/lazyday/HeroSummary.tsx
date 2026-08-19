"use client"

import { Fragment, useEffect, useState } from "react"
import { SEASON, daysUntilDeadline } from "./season-config"
import styles from "./HeroSummary.module.css"

/**
 * 히어로 포스터 바로 아래의 핵심 요약 (10b 정본 이식, 운영자 확정 2026-07-08).
 * 키커(D-day) + 제목 '오프라인 독서모임'(명조 20px — 세리프 확장 승인) + 종이 낱장 SummaryCard.
 * 제목이 기존 태그라인·서브·메타를 대체. 참가비 행(장소 아래, 취소선 없이 담백하게) 2026-08-19 재부활.
 * 데이터는 season-config 단일 출처. D-day는 마운트 후 계산(빌드 박제 방지).
 * ⚠ 프리뷰 쌍: preview/HeroSummary.tsx — 한쪽 수정 시 동기화 (TSX 쌍 동기화).
 */

// 요일을 시간대별로 묶어 ["화·수 19:30–22:30", "일 10:30–13:30, 14:30–17:30"] 로.
// (수·일·화처럼 같은 시간이 떨어져 있어도 묶는다 — 등장 순서 유지)
// ⚠ **한 문자열로 잇지 않는다** (2026-08-17). 모바일에서 자연 줄바꿈이 일요일 그룹
//   **안쪽**을 잘라 "일 10:30–13:30," 까지만 첫 줄에 남기고 "14:30–17:30" 을 다음 줄로
//   보냈다 — 일요일에 오전 한 타임만 있는 것처럼 읽힌다 (운영자 "모바일에서는 일요일
//   통째로 줄바꿈해서 착오가 없게끔 해"). 그룹 단위로 넘겨 오전·오후가 늘 같은 줄에
//   붙어 있게 한다 (렌더에서 그룹마다 white-space: nowrap).
function dayScheduleGroups() {
  const groups: { labels: string[]; time: string }[] = []
  for (const d of SEASON.days) {
    const g = groups.find((x) => x.time === d.time)
    if (g) g.labels.push(d.label)
    else groups.push({ labels: [d.label], time: d.time })
  }
  const DOW = ["일", "월", "화", "수", "목", "금", "토"]
  return groups.map((g) => {
    // 같은 시간대 요일은 주중 순서로 — '화·수' (운영자 지시 2026-07-24)
    const names = g.labels
      .map((l) => l.replace("요일", ""))
      .sort((a, b) => DOW.indexOf(a) - DOW.indexOf(b))
      .join("·")
    return `${names} ${g.time}`
  })
}

// 장소 표기는 **season-config 원문 그대로** — "링키라운지 (사당역 도보 3분)".
// ⚠ 종전엔 낱장 카드용이라며 괄호를 점으로 풀어 "링키라운지 · 사당역 도보 3분" 으로
//   썼는데, 그러면 **동격 정보를 나열한 것처럼** 읽힌다. 뒤에 오는 건 장소의 부연이라
//   괄호가 맞고, 사이트의 다른 모든 화면(모임소개·FAQ·인터뷰 확인·원데이 신청·결제)도
//   이미 괄호 표기다 — 이 카드만 예외였다 (운영자 2026-08-17 "링키라운지는 점으로
//   우측 정보를 나열하는 게 아니라 뒷내용은 소괄호로 짜야지").
const locationLine = SEASON.location.short

// SEASON.deadline("2026-07-16") → "7/16 (목) 23:59까지" — 요일은 날짜에서 계산. null이면 미표기
function deadlineLine() {
  if (!SEASON.deadline) return null
  const [y, m, day] = SEASON.deadline.split("-").map(Number)
  const week = ["일", "월", "화", "수", "목", "금", "토"][new Date(y, m - 1, day).getDay()]
  return `${m}/${day} (${week}) 23:59까지`
}

export function HeroSummary() {
  const [d, setD] = useState<number | null>(null)
  useEffect(() => {
    setD(daysUntilDeadline())
    const t = setInterval(() => setD(daysUntilDeadline()), 60_000)
    return () => clearInterval(t)
  }, [])

  const closedEarly = SEASON.status === "closedEarly"
  // showDeadline=false: D-day 카운트는 숨기고 '모집 중'만 — 마감일이 지나면 '마감'은 표기 (자동 종료)
  const kicker = closedEarly
    ? `${SEASON.name} 모집 조기 마감`
    : d !== null && d < 0
    ? `${SEASON.name} 모집이 마감되었어요`
    : !SEASON.showDeadline || d === null
    ? `레이지데이 북클럽 ${SEASON.name}를 모집합니다.` // 문장형 (운영자 2026-08-12 — 클로징 CTA와 동일 전환)
    : d === 0
    ? `${SEASON.name} 모집 오늘 마감`
    : `${SEASON.name} 모집 마감 D-${d}`

  return (
    <div className={styles.heroSummary}>
      {/* 문장형 킥커 — 괘선·배지 강조 제거, 조용한 안내문으로 (운영자 2026-08-12 "너무 강조할 필요 없어") */}
      <p className={styles.heroKicker}>
        <span className={styles.kickerText}>{kicker}</span>
      </p>
      <p className={styles.summaryTitle}>오프라인 독서모임</p>

      <div className={styles.summaryCard}>
        <span className={styles.summaryTape} aria-hidden />
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>기간</span>
          <span className={styles.summaryValue}>
            {SEASON.periodLabel} (격주, 5회)
            <span className={styles.summarySubNote}>
              *정규 독서모임 4회 + 자유 독서모임 1회
            </span>
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>일정</span>
          <span className={styles.summaryValue}>
            {/* 그룹 하나가 통째로 다음 줄로 — 구분자 '/'는 **앞 그룹에 붙여** 줄 끝에
                남기고, 그룹 사이 공백에서만 줄바꿈이 일어나게 한다 */}
            {dayScheduleGroups().map((g, i, all) => (
              <Fragment key={g}>
                {/* ⚠ 줄바꿈 기회가 되는 공백은 nowrap 그룹 **바깥**에 둔다 —
                    안에 넣으면 그 공백까지 안 끊겨 두 그룹이 한 줄로 붙는다 */}
                {i > 0 ? " " : null}
                <span className={styles.schedGroup}>
                  {g}
                  {i < all.length - 1 ? " /" : ""}
                </span>
              </Fragment>
            ))}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>장소</span>
          <span className={styles.summaryValue}>{locationLine}</span>
        </div>
        {/* 참가비 — 2026-08-19 재부활. 2026-08-18 취소선(priceWas) 버전은 그날 바로
            철회됐었는데, 이번엔 취소선 없이 담백하게 현재가만 표기 (운영자 "할인가
            찍 긋지 말고 담백하게 참가비 15만원 이렇게만"). */}
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>참가비</span>
          <span className={styles.summaryValue}>{SEASON.price}</span>
        </div>
        {/* 마감 행 — deadline이 있고 노출 허용일 때만 (showDeadline=false면 미표기, 운영자 지시 2026-07-23) */}
        {SEASON.deadline && SEASON.showDeadline && (
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>마감</span>
            <span className={styles.summaryValue}>
              {deadlineLine()}
              {closedEarly ? (
                <span className={styles.summaryDday}> · 마감</span>
              ) : (
                d !== null && (
                  <span className={styles.summaryDday}>
                    {" "}
                    {d < 0 ? "· 마감" : d === 0 ? "· D-DAY" : `· D-${d}`}
                  </span>
                )
              )}
            </span>
          </div>
        )}
      </div>

      <p className={styles.summaryFoot}>
        {closedEarly
          ? `${SEASON.next} 오픈 알림은 아래에서 신청할 수 있어요`
          : "인터뷰 및 결제 후 참여가 확정됩니다"}
      </p>
    </div>
  )
}
