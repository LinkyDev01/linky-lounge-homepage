"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { loadTossPayments, ANONYMOUS, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk"
import { LazydayLink } from "@/components/common/LazydayLink"
import { useBasePath } from "@/hooks/use-base-path"
import { reportClientError } from "../../support"
import { TOSS_DOCS_TEST_CLIENT_KEY } from "../oneday-shared"
import { buildOrderId, orderNameFor, resolveItems, totalOf } from "@/lib/order-catalog"
import styles from "./checkout.module.css"

/**
 * 결제 — 토스페이먼츠 결제위젯 v2 (2026-08-11, PG 심사 대비).
 * 일회성 모임(신청 완료 화면의 [토스페이 결제])과 굿즈(상세 구매하기·카트 주문하기)가
 * 모두 이 페이지로 온다. 주문 항목은 ?items=d823,g-coffee-mug 코드로 받고,
 * orderId에 그대로 인코딩해 서버(confirm)가 금액을 재검증한다 (lib/order-catalog).
 * successUrl/failUrl은 호스트 기준 절대 URL — 3개 도메인 모두 대응.
 */

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || TOSS_DOCS_TEST_CLIENT_KEY
const IS_TEST_KEY = !process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY.startsWith("test_")

function CheckoutInner() {
  const params = useSearchParams()
  const base = useBasePath()
  const raw = params.get("items") || ""
  const codes = [...new Set(raw.split(",").filter(Boolean))]
  const items = resolveItems(codes) ?? []
  const amount = totalOf(items)
  const hasGoods = items.some((i) => i.kind === "goods")
  const hasMeeting = items.some((i) => i.kind === "meeting")

  const widgetsRef = useRef<TossPaymentsWidgets | null>(null)
  const [ready, setReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (items.length === 0) return
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
        reportClientError("checkout_widget_load", err instanceof Error ? err.message : "위젯 로드 실패")
      }
    })()
    return () => {
      cancelled = true
    }
    // 주문 항목이 바뀔 때만 재로드
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw])

  async function handlePay() {
    const widgets = widgetsRef.current
    if (!widgets || paying) return
    setPaying(true)
    setError("")
    try {
      await widgets.requestPayment({
        orderId: buildOrderId(codes),
        orderName: orderNameFor(items),
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

  if (items.length === 0) {
    return (
      <div className={styles.emptyBox}>
        <p className={styles.emptyText}>
          결제할 상품 정보가 없습니다.
          <br />
          다시 선택한 뒤 시도해주세요.
        </p>
        <LazydayLink href="/one-day-talk-01/apply" className={styles.emptyLink}>
          일회성 모임 신청하기
        </LazydayLink>
      </div>
    )
  }

  return (
    <>
      <h1 className={styles.title}>결제하기</h1>
      <p className={styles.subtitle}>주문 내용을 확인하고 결제 수단을 선택해주세요.</p>

      <div className={styles.summaryCard}>
        {items.map((i) => (
          <div key={i.code} className={styles.summaryRow}>
            <span className={styles.summaryBook}>{i.name}</span>
            <span className={styles.summaryDate}>{i.note}</span>
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

      {/* 굿즈 수령 안내 — 전 품목 현장 수령(배송 없음), 운영자 확정 2026-08-11 */}
      {hasGoods && (
        <div className={styles.refundBox}>
          <p className={styles.refundTitle}>수령·교환·환불 안내 (굿즈)</p>
          <ul className={styles.refundList}>
            <li>1. 굿즈는 배송하지 않고 <strong>링키라운지(경기도 남양주시 별내3로 322, 404호)에서 현장 수령</strong>합니다. 결제 후 안내된 연락처로 수령 일정을 조율해 드립니다.</li>
            <li>2. 수령일부터 7일 이내에 청약철회(반품)를 신청할 수 있으며, 미개봉·미사용 상태여야 합니다. 현장 반납이므로 별도의 반품 비용은 없습니다.</li>
            <li>3. 상품 하자·오배송의 경우 기간과 관계없이 교환 또는 전액 환불해 드립니다.</li>
            <li>환불 신청은 안내된 연락처로 접수하며, 접수일부터 영업일 기준 5일 이내에 처리됩니다.</li>
          </ul>
        </div>
      )}

      {/* 환불 안내 — 일회성 모임 환불 규정, 운영자 확정 원문 그대로 (2026-08-11) */}
      {hasMeeting && (
        <div className={styles.refundBox}>
          <p className={styles.refundTitle}>취소·환불 안내 (일회성 모임)</p>
          <ul className={styles.refundList}>
            <li>1. 환불 신청일이 결제일부터 7일 이내이거나 모임 시작일 7일 전까지인 경우, 참가비 전액을 환불합니다. 다만 이미 개최된 모임의 참가비는 환불되지 않습니다.</li>
            <li>2. 위에 해당하지 않는 경우, 모임 시작일 7일 전이 지난 날부터 하루가 지날 때마다 참가비의 20퍼센트씩 차감하여 환불하며, 모임 시작일 2일 전부터는 환불되지 않습니다.</li>
            <li>3. 내부 사정으로 모임이 취소되거나 연기되는 경우, 참가비를 전액 환불하거나 다른 모임으로 이월합니다.</li>
            <li>환불 신청은 안내된 연락처로 접수하며, 접수일부터 영업일 기준 5일 이내에 처리됩니다. 자세한 기준은 이용약관 3장에서 확인하실 수 있습니다.</li>
          </ul>
        </div>
      )}

      <p className={styles.refundBox}>
        <LazydayLink href="/policy" className={styles.refundLink}>
          이용약관·환불 규정 전문 보기
        </LazydayLink>
      </p>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* useSearchParams는 Suspense 경계 필요 (Next 정적 프리렌더 규칙) */}
        <Suspense fallback={null}>
          <CheckoutInner />
        </Suspense>
      </div>
    </main>
  )
}
