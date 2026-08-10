"use client"

import { useEffect, useState } from "react"
import styles from "./ClosingCtaSection.module.css"
import { SEASON, daysUntilDeadline } from "./season-config"

/**
 * 클로징 CTA — 마감 안내 + 기수 요약 두 줄 (운영자 확정 2026-07-06)
 * 원본: preview/ClosingSectionV2.tsx의 closingCta 블록 (픽셀 동일 이식).
 * BrandCloseSection(로고) 바로 위에 배치 — 배경 #f5ede4가 같아 한 섹션처럼 읽힘.
 * 문구: "3기 모집은 X일 뒤 마감됩니다." + 작은 두 줄(기간·구성 / 장소+지도 링크).
 * 프리뷰 쌍(ClosingSectionV2)과 드리프트 금지 — 문구·값 수정 시 함께.
 */
export function ClosingCtaSection() {
  const [d, setD] = useState<number | null>(null)
  useEffect(() => { setD(daysUntilDeadline()) }, [])

  return (
    <div className={styles.closingCta}>
      <p className={styles.closingCtaTitle}>
        {/* showDeadline=false: 카운트다운 숨김 — 마감일 경과 시 '마감' 표기 (자동 종료) */}
        {SEASON.status === "closedEarly"
          ? `${SEASON.name} 모집이 조기 마감되었습니다.`
          : d !== null && d < 0
          ? `${SEASON.name} 모집이 마감되었습니다.`
          : !SEASON.showDeadline || d === null
          ? // 운영자 2026-08-09: "모집 중" → 문장형 "…를 모집합니다."
            `레이지데이 북클럽 ${SEASON.name}를 모집합니다.`
          : d === 0
          ? `${SEASON.name} 모집은 오늘 마감됩니다.`
          : `${SEASON.name} 모집은 ${d}일 뒤 마감됩니다.`}
      </p>
      <p className={styles.closingCtaSub}>
        ({SEASON.periodLabel}) 정규 독서모임 4회 + 자유 독서모임 1회
        <br />
        서울 사당역 부근 ·{" "}
        <a
          href="https://naver.me/FLebi2a9"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.closingCtaLink}
        >
          링키라운지
        </a>
      </p>
      {/* 2026-08-09 (운영자 "로고 위 CTA는 하단 고정 CTA와 동일한 거라 … 이중으로 될 필요 없어"):
          여기 있던 신청 버튼을 걷어낸다. 하단 고정 CTA(StickyApplyButton)가 sticky 로
          바뀌어 **끝까지 내리면 바로 이 자리(로고 위)에 내려앉는다** — 버튼은 하나뿐이다.
          `.closingCtaBtn` 서식과 `open` 판정은 되살릴 때를 위해 보존 (아래 주석) */}
    </div>
  )
}
