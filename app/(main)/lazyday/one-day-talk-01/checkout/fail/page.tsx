"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { LazydayLink } from "@/components/common/LazydayLink"
import { KAKAO_CHAT_URL } from "../../../support"
import styles from "../checkout.module.css"

/**
 * 결제 실패 리다이렉트 — 토스가 code/message/orderId 쿼리를 붙여 보낸다.
 * 사용자 취소(PAY_PROCESS_CANCELED)는 오류가 아니라 이탈 — 문구를 구분한다.
 */

function FailInner() {
  const params = useSearchParams()
  const code = params.get("code") || ""
  const message = params.get("message") || ""
  const canceled = code === "PAY_PROCESS_CANCELED"

  return (
    <div className={styles.stateBox}>
      <h1 className={styles.stateTitle}>{canceled ? "결제가 취소되었어요" : "결제에 실패했어요"}</h1>
      <p className={styles.stateBody}>
        {canceled
          ? "결제를 중단하셨어요. 준비되시면 다시 진행해주세요."
          : message || "결제 처리 중 문제가 발생했습니다."}
      </p>
      {!canceled && code && <p className={styles.stateDetail}>오류 코드: {code}</p>}
      <p className={styles.stateDetail}>
        문제가 반복되면{" "}
        <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer" className={styles.refundLink}>
          카카오톡 채널
        </a>
        로 문의해주세요.
      </p>
      <LazydayLink href="/one-day-talk-01/apply" className={styles.emptyLink}>
        원데이 토크 신청으로 돌아가기
      </LazydayLink>
    </div>
  )
}

export default function OnedayCheckoutFailPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* 좌측 위 내비 — 실패 화면에서도 이동 수단 유지 (운영자 2026-08-11) */}
        <div className={styles.navBar}>
          <LazydayLink href="/" className={styles.backLink}>
            홈
          </LazydayLink>
        </div>
        <Suspense fallback={null}>
          <FailInner />
        </Suspense>
      </div>
    </main>
  )
}
