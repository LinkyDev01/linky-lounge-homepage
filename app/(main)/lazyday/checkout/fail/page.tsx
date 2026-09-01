"use client"

import { CHECKOUT_PATH } from "@/lib/payments/config"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { LazydayLink } from "@/components/common/LazydayLink"
import { KAKAO_CHAT_URL } from "../../support"
import { parseOrderCodes } from "@/lib/order-catalog"
import styles from "../checkout.module.css"

/**
 * 결제 실패 화면 — 두 PG 공용 (2026-08-31).
 *  토스가 code/message/orderId 쿼리를 붙여 리다이렉트한다
 *    (paymentId 로도 올 수 있어 주문번호 파라미터를 둘 다 읽는다)
 * 사용자 취소는 오류가 아니라 이탈 — 문구를 구분한다.
 * 오류 코드·메시지는 **심사·디버깅에 필요하므로 화면에 그대로 노출**한다.
 * 재시도는 실패한 주문 항목 그대로 checkout 으로 (2026-08-11 디버깅 — 종전엔
 * 굿즈 주문 실패도 '원데이 토크 신청'으로 보내 장바구니가 증발했다)
 */

/** 두 PG 의 사용자 취소 코드 — 토스 PAY_PROCESS_CANCELED / 포트원 *_CANCEL* 계열 */
function isCanceledCode(code: string, message: string) {
  return code === "PAY_PROCESS_CANCELED" || /CANCEL/i.test(code) || /취소/.test(message)
}

function FailInner() {
  const params = useSearchParams()
  const code = params.get("code") || ""
  const message = params.get("message") || ""
  const canceled = isCanceledCode(code, message)
  // 실패한 주문의 상품 코드 복원 — 같은 항목으로 바로 재시도
  const codes = parseOrderCodes(params.get("orderId") || "")
  const retryHref = codes ? `${CHECKOUT_PATH}?items=${codes.join(",")}` : "/one-day-talk-01/apply"

  return (
    <div className={styles.stateBox}>
      <h1 className={styles.stateTitle}>{canceled ? "결제가 취소되었어요" : "결제에 실패했어요"}</h1>
      <p className={styles.stateBody}>
        {canceled
          ? "결제를 중단하셨어요. 준비되시면 다시 진행해주세요."
          : message || "결제 처리 중 문제가 발생했습니다."}
      </p>
      {/* 오류 코드·메시지 노출 — 카드사 심사·장애 디버깅에 필요 */}
      {!canceled && (code || message) && (
        <p className={styles.stateDetail}>
          {code && <>오류 코드: {code}</>}
          {code && message && <br />}
          {message && <>메시지: {message}</>}
        </p>
      )}
      <p className={styles.stateDetail}>
        문제가 반복되면{" "}
        <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer" className={styles.refundLink}>
          카카오톡 채널
        </a>
        로 문의해주세요.
      </p>
      <LazydayLink href={retryHref} className={styles.emptyLink}>
        {codes ? "같은 주문으로 다시 결제하기" : "일회성 모임 신청으로 돌아가기"}
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
