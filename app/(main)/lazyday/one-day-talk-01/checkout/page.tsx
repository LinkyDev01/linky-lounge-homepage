"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { loadTossPayments, ANONYMOUS, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk"
import { LazydayLink } from "@/components/common/LazydayLink"
import { useBasePath } from "@/hooks/use-base-path"
import { reportClientError } from "../../support"
import {
  ONEDAY,
  ONEDAY_PRICE,
  TOSS_DOCS_TEST_CLIENT_KEY,
  buildOrderId,
  orderNameFor,
  sessionDateLabel,
} from "../oneday-shared"
import styles from "./checkout.module.css"

/**
 * 원데이 토크 결제 — 토스페이먼츠 결제위젯 v2 (2026-08-11, PG 심사 대비).
 * 신청 완료 화면의 [토스페이 결제]가 결제 링크(buy.tosspayments.com) 대신 이 페이지로 온다.
 * 회차는 ?days=2x9 쿼리로 받고, orderId에 인코딩해 서버(confirm)가 금액을 재검증한다.
 * successUrl/failUrl은 호스트 기준 절대 URL — 3개 도메인(북클럽·lazy-club·linkylounge) 모두 대응.
 */

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || TOSS_DOCS_TEST_CLIENT_KEY
const IS_TEST_KEY = !process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY.startsWith("test_")

function parseDaysParam(raw: string | null): number[] {
  if (!raw) return []
  const valid = new Set(ONEDAY.sessions.map((s) => s.day))
  const days = raw
    .split(/[x,]/)
    .map((v) => parseInt(v, 10))
    .filter((d) => valid.has(d))
  return [...new Set(days)].sort((a, b) => a - b)
}

function CheckoutInner() {
  const params = useSearchParams()
  const base = useBasePath()
  const days = parseDaysParam(params.get("days"))
  const picked = ONEDAY.sessions.filter((s) => days.includes(s.day))
  const amount = days.length * ONEDAY_PRICE

  const widgetsRef = useRef<TossPaymentsWidgets | null>(null)
  const [ready, setReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (days.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        const tossPayments = await loadTossPayments(CLIENT_KEY)
        if (cancelled) return
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS })
        widgetsRef.current = widgets
        await widgets.setAmount({ currency: "KRW", value: amount })
        await Promise.all([
          widgets.renderPaymentMethods({ selector: "#toss-payment-methods", variantKey: "DEFAULT" }),
          widgets.renderAgreement({ selector: "#toss-agreement", variantKey: "AGREEMENT" }),
        ])
        if (!cancelled) setReady(true)
      } catch (err) {
        if (cancelled) return
        setError("결제 화면을 불러오지 못했어요. 잠시 후 새로고침해 주세요.")
        reportClientError("oneday_widget_load", err instanceof Error ? err.message : "위젯 로드 실패")
      }
    })()
    return () => {
      cancelled = true
    }
    // days는 쿼리에서 파생 — 문자열 원본이 바뀔 때만 재로드
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get("days")])

  async function handlePay() {
    const widgets = widgetsRef.current
    if (!widgets || paying) return
    setPaying(true)
    setError("")
    try {
      await widgets.requestPayment({
        orderId: buildOrderId(days),
        orderName: orderNameFor(days),
        successUrl: `${window.location.origin}${base}/one-day-talk-01/checkout/success`,
        failUrl: `${window.location.origin}${base}/one-day-talk-01/checkout/fail`,
      })
    } catch (err) {
      // 사용자가 결제창을 닫은 경우도 여기로 온다 — 화면은 그대로 두고 버튼만 되살린다
      const msg = err instanceof Error ? err.message : ""
      if (msg && !/취소/.test(msg)) setError(msg)
      setPaying(false)
    }
  }

  if (days.length === 0) {
    return (
      <div className={styles.emptyBox}>
        <p className={styles.emptyText}>
          결제할 모임 정보가 없습니다.
          <br />
          신청 페이지에서 회차를 선택한 뒤 다시 시도해주세요.
        </p>
        <LazydayLink href="/one-day-talk-01/apply" className={styles.emptyLink}>
          원데이 토크 신청하기
        </LazydayLink>
      </div>
    )
  }

  return (
    <>
      <h1 className={styles.title}>결제하기</h1>
      <p className={styles.subtitle}>주문 내용을 확인하고 결제 수단을 선택해주세요.</p>

      <div className={styles.summaryCard}>
        {picked.map((s) => (
          <div key={s.day} className={styles.summaryRow}>
            <span className={styles.summaryBook}>
              원데이 토크 『{s.book}』
            </span>
            <span className={styles.summaryDate}>
              {sessionDateLabel(s.day)} {s.time}
            </span>
          </div>
        ))}
        <div className={styles.summaryTotal}>
          <span>총 결제 금액</span>
          <span className={styles.summaryTotalValue}>{amount.toLocaleString("ko-KR")}원</span>
        </div>
      </div>

      <div id="toss-payment-methods" className={styles.widgetBox} />
      <div id="toss-agreement" className={styles.agreementBox} />

      <button type="button" className={styles.payButton} onClick={handlePay} disabled={!ready || paying}>
        {ready ? `${amount.toLocaleString("ko-KR")}원 결제하기` : "결제 수단 불러오는 중..."}
      </button>

      {IS_TEST_KEY && (
        <p className={styles.testNotice}>지금은 테스트 결제 환경입니다 — 실제 결제가 이루어지지 않습니다.</p>
      )}
      {error && <p className={styles.errorText}>{error}</p>}

      {/* 환불 안내 — docs/tosspayments-refund-notice.md(약관 제3장)와 표현 일치 의무 (DECISIONS 2026-07-04) */}
      <div className={styles.refundBox}>
        <p className={styles.refundTitle}>취소·환불 안내</p>
        <ul className={styles.refundList}>
          <li>· 모임 시작 전에는 결제 후 7일 이내 전액 환불이 가능합니다.</li>
          <li>· 이미 시작된 회차는 환불 대상에서 제외됩니다.</li>
          <li>· 환불 신청은 카카오톡 채널 또는 문자로 접수되며, 접수일부터 영업일 기준 5일 이내에 처리됩니다. 별도의 위약금·수수료는 없습니다.</li>
        </ul>
        <LazydayLink href="/policy" className={styles.refundLink}>
          이용약관·환불 규정 전문 보기
        </LazydayLink>
      </div>
    </>
  )
}

export default function OnedayCheckoutPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <LazydayLink href="/one-day-talk-01/apply" className={styles.backLink}>
          ← 원데이 토크 신청으로
        </LazydayLink>
        {/* useSearchParams는 Suspense 경계 필요 (Next 정적 프리렌더 규칙) */}
        <Suspense fallback={null}>
          <CheckoutInner />
        </Suspense>
      </div>
    </main>
  )
}
