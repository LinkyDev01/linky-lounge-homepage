"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import { LazydayLink } from "@/components/common/LazydayLink"
import { KAKAO_CHAT_URL, reportClientError } from "../../../support"
import { parseOrderCodes, resolveItems } from "@/lib/order-catalog"
import applyStyles from "../../../apply/page.module.css"
import cal from "../../apply/oneday.module.css"
import styles from "../checkout.module.css"

/**
 * 결제 성공 리다이렉트 — 토스가 paymentKey/orderId/amount 쿼리를 붙여 보낸다.
 * 여기서 서버 승인(/api/lazyday/payment/confirm)을 호출해야 결제가 최종 완료된다
 * (승인 전 이탈 시 결제는 만료 — 돈이 빠져나가지 않는다).
 * 완료 화면은 신청 완료 화면과 같은 문법(다크·로고 리빌, apply/page.module.css 재사용).
 */

type Phase = "confirming" | "done" | "error"

function SuccessInner() {
  const params = useSearchParams()
  const [phase, setPhase] = useState<Phase>("confirming")
  const [errorMsg, setErrorMsg] = useState("")
  const calledRef = useRef(false)

  const paymentKey = params.get("paymentKey") || ""
  const orderId = params.get("orderId") || ""
  const amount = Number(params.get("amount") || 0)
  // 승인 실패 시 같은 주문으로 다시 시도할 수 있게 orderId에서 상품 코드 복원
  const codes = parseOrderCodes(orderId)
  const items = codes ? resolveItems(codes) : null
  const retryHref = codes ? `/one-day-talk-01/checkout?items=${codes.join(",")}` : "/one-day-talk-01/apply"
  // 굿즈가 섞여 있으면 완료 문구를 수령 안내로 (배송 없음 — 현장 수령)
  const hasGoods = items?.some((i) => i.kind === "goods") ?? false

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setPhase("error")
      setErrorMsg("결제 정보가 올바르지 않습니다. 결제를 다시 시도해주세요.")
      return
    }
    if (calledRef.current) return // StrictMode 중복 호출 방지 (승인은 1회만)
    calledRef.current = true
    ;(async () => {
      try {
        const res = await fetch("/api/lazyday/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        })
        const result = await res.json().catch(() => null)
        if (!res.ok || !result?.success) {
          throw new Error(result?.error || "결제 승인에 실패했습니다.")
        }
        setPhase("done")
      } catch (err) {
        setPhase("error")
        setErrorMsg(err instanceof Error ? err.message : "결제 승인에 실패했습니다.")
        reportClientError("oneday_confirm", err instanceof Error ? err.message : "승인 실패")
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase === "confirming") {
    return <SubmitOverlay label="결제 승인 중..." />
  }

  if (phase === "error") {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stateBox}>
            <h1 className={styles.stateTitle}>결제가 완료되지 않았어요</h1>
            <p className={styles.stateBody}>{errorMsg}</p>
            <p className={styles.stateDetail}>
              카드 승인 문제일 수 있어요. 잠시 후 다시 시도하거나,
              <br />
              문제가 반복되면{" "}
              <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer" className={styles.refundLink}>
                카카오톡 채널
              </a>
              로 문의해주세요.
            </p>
            <LazydayLink href={retryHref} className={styles.emptyLink}>
              결제 다시 시도하기
            </LazydayLink>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={applyStyles.successPage}>
      <div className={`${applyStyles.successInner} ${cal.doneInner}`}>
        <BlurReveal duration={1.0} blur={10} fromScale={1.03}>
          <img
            src="/linky-lounge/book-club/lazyday_logo.png"
            alt="레이지데이"
            className={`${applyStyles.successMark} ${cal.doneMark}`}
          />
        </BlurReveal>
        <FadeUp delay={0.15}>
          <h1 className={`${applyStyles.successTitle} ${cal.doneTitle}`}>결제가 완료되었습니다.</h1>
        </FadeUp>
        <FadeUp delay={0.3}>
          {hasGoods ? (
            <p className={`${applyStyles.successBody} ${cal.doneBody}`}>
              주문이 완료되었어요.
              <br />
              굿즈는 <span className={applyStyles.successAccent}>링키라운지 현장 수령</span>이며, 수령 일정은 연락처로 안내드립니다.
            </p>
          ) : (
            <p className={`${applyStyles.successBody} ${cal.doneBody}`}>
              참여가 확정되었어요.
              <br />
              모임 안내는 신청하신 <span className={applyStyles.successAccent}>연락처</span>로 보내드립니다.
            </p>
          )}
        </FadeUp>
        <FadeUp delay={0.6}>
          <p className={`${applyStyles.successCloser} ${cal.doneCloser}`}>레이지데이 북클럽에서 곧 만나요.</p>
        </FadeUp>
      </div>
    </main>
  )
}

export default function OnedayCheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  )
}
