"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { loadTossPayments, ANONYMOUS, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk"
import { LazydayLink } from "@/components/common/LazydayLink"
import { useBasePath } from "@/hooks/use-base-path"
import { reportClientError } from "../../support"
import { TOSS_DOCS_TEST_CLIENT_KEY, findSession, isPastSession } from "../oneday-shared"
import {
  SHIPPING_CODE,
  SHIPPING_FEE,
  buildOrderId,
  orderNameFor,
  resolveItems,
  totalOf,
  type OrderItem,
} from "@/lib/order-catalog"
import styles from "./checkout.module.css"

/**
 * 결제 — 토스페이먼츠 결제위젯 v2.
 * 서식은 레이지클럽 워크룸 톤 (2026-08-11 운영자: "기존 톤앤매너와 맞춰서" —
 * 상품정보·기본정보는 브라운야드, 결제 파트는 노아 주문서 문법).
 * 일회성 모임(신청 완료 화면)과 굿즈(상세 구매하기·카트 주문하기)가 모두 이 페이지로 온다.
 * 주문 항목은 ?items=d823,g-coffee-mug:민트 — 코드 뒤 :옵션(색상/사이즈)은 표기 전용
 * (금액 무관). orderId에는 코드만 인코딩해 서버(confirm)가 금액을 재검증한다.
 */

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || TOSS_DOCS_TEST_CLIENT_KEY
const IS_TEST_KEY = !process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY.startsWith("test_")
// 위젯 내부 색은 코드로 못 바꾼다(토스 iframe) — 개발자센터 위젯 어드민에서 만든
// 커스텀 테마의 variantKey 를 env 로 받아 적용 (미설정 시 토스 기본 테마)
const VARIANT_PAYMENT = process.env.NEXT_PUBLIC_TOSS_VARIANT_PAYMENT || "DEFAULT"
const VARIANT_AGREEMENT = process.env.NEXT_PUBLIC_TOSS_VARIANT_AGREEMENT || "AGREEMENT"

type Entry = { item: OrderItem; option: string }

/** 010-0000-0000 자동 하이픈 — apply·결제 후 신청서와 동일 문법 (2026-08-11 디버깅:
 *  checkout 만 미적용이라 알림톡 발송용 번호 오입력이 가장 잦은 지점이 무방비였다) */
function formatPhone(value: string) {
  const nums = value.replace(/[^0-9]/g, "")
  if (nums.length <= 3) return nums
  if (nums.length <= 7) return nums.slice(0, 3) + "-" + nums.slice(3)
  return nums.slice(0, 3) + "-" + nums.slice(3, 7) + "-" + nums.slice(7, 11)
}

/** ?items= 파싱 — "code:옵션" 항목을 카탈로그와 대조해 확정 (모르는 코드는 버린다).
 *  지난·마감 회차(dNNN)는 여기서 걸러 결제 자체를 막는다 — 서버 catalog()는 승인
 *  경계(결제 도중 시각 경과)를 위해 그대로 두고, 진입만 차단 (2026-08-11 디버깅:
 *  apply 는 지난 회차를 막지만 checkout 직접 URL 로는 종료 모임이 결제됐다) */
function parseEntries(raw: string): Entry[] {
  const out: Entry[] = []
  const seen = new Set<string>()
  for (const token of raw.split(",").filter(Boolean)) {
    const [code, opt] = token.split(":")
    if (code === SHIPPING_CODE || seen.has(code)) continue
    const item = resolveItems([code])?.[0]
    if (!item) continue
    if (item.kind === "meeting") {
      const s = findSession(Number(code.slice(1)))
      if (!s || s.closed === true || isPastSession(s)) continue
    }
    seen.add(code)
    out.push({ item, option: opt ? decodeURIComponent(opt) : "" })
  }
  return out
}

function CheckoutInner() {
  const params = useSearchParams()
  const base = useBasePath()
  const raw = params.get("items") || ""
  const entries = parseEntries(raw)
  const baseItems = entries.map((e) => e.item)
  const hasGoods = baseItems.some((i) => i.kind === "goods")
  const hasMeeting = baseItems.some((i) => i.kind === "meeting")

  // 수령 방법 — 굿즈가 있을 때만 노출. 택배면 배송비를 주문 항목으로 더한다 (운영자 2026-08-11)
  const [delivery, setDelivery] = useState<"pickup" | "parcel">("pickup")
  const useParcel = hasGoods && delivery === "parcel"
  const shipping = useParcel ? resolveItems([SHIPPING_CODE]) ?? [] : []
  const codes = [...entries.map((e) => e.item.code), ...(useParcel ? [SHIPPING_CODE] : [])]
  const items = [...baseItems, ...shipping]
  const amount = totalOf(items)
  const goodsSubtotal = totalOf(baseItems)

  // 주문자 정보 — 브라운야드 기본정보 문법으로 항상 노출 (운영자 2026-08-11 "주소·연락처 정보가 빠졌네").
  // 택배 선택 시 배송지(우편번호·주소·상세)까지 입력받아 토스 결제 metadata 로 전달 —
  // 운영자가 상점관리자 결제 상세에서 확인 (별도 주문 DB 없음)
  const [buyerName, setBuyerName] = useState("")
  const [buyerPhone, setBuyerPhone] = useState("")
  const [zip, setZip] = useState("")
  const [addr1, setAddr1] = useState("")
  const [addr2, setAddr2] = useState("")
  const buyerFilled = buyerName.trim().length > 0 && buyerPhone.replace(/[^0-9]/g, "").length >= 10
  const addressFilled = addr1.trim().length > 0
  const buyerReady = buyerFilled && (!useParcel || addressFilled)

  const widgetsRef = useRef<TossPaymentsWidgets | null>(null)
  const [ready, setReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (entries.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        const tossPayments = await loadTossPayments(CLIENT_KEY)
        if (cancelled) return
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS })
        widgetsRef.current = widgets
        await widgets.setAmount({ currency: "KRW", value: amount })
        await Promise.all([
          widgets.renderPaymentMethods({ selector: "#toss-payment-methods", variantKey: VARIANT_PAYMENT }),
          widgets.renderAgreement({ selector: "#toss-agreement", variantKey: VARIANT_AGREEMENT }),
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

  // 수령 방법 변경 → 결제 금액 갱신 (위젯은 재렌더하지 않고 금액만 바꾼다)
  useEffect(() => {
    if (!ready) return
    widgetsRef.current?.setAmount({ currency: "KRW", value: amount }).catch(() => {})
  }, [amount, ready])

  async function handlePay() {
    const widgets = widgetsRef.current
    if (!widgets || paying) return
    setPaying(true)
    setError("")
    try {
      // 주문명에는 첫 상품의 옵션을 병기 — 운영자가 토스 내역에서 옵션 확인
      const firstOpt = entries[0]?.option
      const name = orderNameFor(items)
      const orderId = buildOrderId(codes)
      // 선결제→후신청 (2026-08-11): 결제 후 success 신청서에 이름·연락처를 프리필한다.
      // 토스 리다이렉트는 같은 탭이라 sessionStorage 가 살아 있다 (실패해도 폼은 빈 값으로 동작)
      try {
        sessionStorage.setItem(
          "lz-buyer",
          JSON.stringify({ orderId, name: buyerName.trim(), phone: buyerPhone.replace(/[^0-9]/g, "") }),
        )
      } catch {}
      await widgets.requestPayment({
        orderId,
        orderName: firstOpt ? name.replace(/^([^—]+)/, `$1(${firstOpt}) `) : name,
        successUrl: `${window.location.origin}${base}/one-day-talk-01/checkout/success`,
        failUrl: `${window.location.origin}${base}/one-day-talk-01/checkout/fail`,
        customerName: buyerName.trim(),
        customerMobilePhone: buyerPhone.replace(/[^0-9]/g, ""),
        // 수령 방법·배송지 — 상점관리자 결제 상세의 metadata 로 확인 (주문 DB 없음)
        ...(hasGoods
          ? {
              metadata: {
                수령방법: useParcel ? "택배 배송" : "현장 수령",
                ...(useParcel
                  ? { 배송지: `${zip.trim() ? `[${zip.trim()}] ` : ""}${addr1.trim()} ${addr2.trim()}`.trim() }
                  : {}),
              },
            }
          : {}),
      })
    } catch (err) {
      // 사용자가 결제창을 닫은 경우도 여기로 온다 — 화면은 그대로 두고 버튼만 되살린다
      const msg = err instanceof Error ? err.message : ""
      if (msg && !/취소/.test(msg)) setError(msg)
      setPaying(false)
    }
  }

  if (entries.length === 0) {
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
      <h1 className={styles.title}>checkout</h1>

      {/* 2단 주문서 (브라운야드) — 좌: 상품·정보 / 우: 결제. 모바일은 상품이 상단 (운영자 2026-08-11) */}
      <div className={styles.orderGrid}>
        <div className={styles.colMain}>

      {/* 주문 상품 — 브라운야드 상품정보 행 (썸네일·이름·옵션·가격) */}
      <p className={styles.sectionLabel}>주문 상품</p>
      <div className={styles.summaryCard}>
        {entries.map(({ item, option }) => (
          <div key={item.code} className={styles.summaryRow}>
            {item.img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.img} alt="" className={styles.summaryThumb} />
            )}
            <span className={styles.summaryInfo}>
              <span className={styles.summaryBook}>{item.name}</span>
              <span className={styles.summaryDate}>
                {[option, item.note].filter(Boolean).join(" · ") || " "}
              </span>
            </span>
            <span className={styles.summaryPrice}>₩{item.price.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* 기본 정보·수령 방법 — 수령 선택은 제품 주문에만, 주문자 정보는 항상 (운영자 2026-08-11) */}
      <div className={styles.optionCard}>
        {hasGoods && (
          <>
          <p className={styles.optionTitle}>수령 방법</p>
          <label className={styles.optionRow}>
            <input
              type="radio"
              name="delivery"
              checked={delivery === "pickup"}
              onChange={() => setDelivery("pickup")}
            />
            <span className={styles.optionLabel}>
              현장 수령
              <span className={styles.optionSub}>링키라운지(사당역 도보 3분)에서 직접 수령 · 배송비 없음</span>
            </span>
          </label>
          <label className={styles.optionRow}>
            <input
              type="radio"
              name="delivery"
              checked={delivery === "parcel"}
              onChange={() => setDelivery("parcel")}
            />
            <span className={styles.optionLabel}>
              택배 배송 (+{SHIPPING_FEE.toLocaleString("ko-KR")}원)
              <span className={styles.optionSub}>우체국택배 · 제주·도서산간 추가 · 결제 확인 후 2~5영업일 내 발송</span>
            </span>
          </label>
          </>
        )}

        <p className={styles.optionTitle}>주문자 정보</p>
        <input
          type="text"
          className={styles.optionInput}
          placeholder="이름"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
        />
        <input
          type="tel"
          inputMode="numeric"
          className={styles.optionInput}
          placeholder="연락처 (010-0000-0000)"
          value={buyerPhone}
          onChange={(e) => setBuyerPhone(formatPhone(e.target.value))}
        />

        {/* 배송지 — 택배 선택 시에만 (우편번호·주소·상세) */}
        {useParcel && (
          <>
            <p className={styles.optionTitle}>배송지</p>
            <input
              type="text"
              inputMode="numeric"
              className={styles.optionInput}
              placeholder="우편번호"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
            />
            <input
              type="text"
              className={styles.optionInput}
              placeholder="주소"
              value={addr1}
              onChange={(e) => setAddr1(e.target.value)}
            />
            <input
              type="text"
              className={styles.optionInput}
              placeholder="상세 주소 (동·호수 등)"
              value={addr2}
              onChange={(e) => setAddr2(e.target.value)}
            />
          </>
        )}

        <p className={styles.optionNote}>
          {!hasGoods
            ? "결제 확인·모임 안내에 사용됩니다."
            : useParcel
            ? "입력하신 배송지로 발송해 드립니다."
            : "결제 후 이 연락처로 수령 일정을 안내해 드립니다."}
        </p>
      </div>

        </div>

        {/* 결제 파트 — 노아 문법: TOTAL 요약 행 → 결제 수단 → 동의 → 잉크 바 버튼.
            데스크톱 우측 고정(sticky), 모바일은 정보 아래 */}
        <aside className={styles.colPay}>
      <div className={styles.payBlock}>
        <p className={styles.sectionLabel}>결제</p>
        <div className={styles.totalRows}>
          <div className={styles.totalRow}>
            <span>상품 금액</span>
            <span>₩{goodsSubtotal.toLocaleString()}</span>
          </div>
          <div className={styles.totalRow}>
            <span>배송비</span>
            <span>{useParcel ? `₩${SHIPPING_FEE.toLocaleString()}` : "₩0"}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.totalRowGrand}`}>
            <span>TOTAL</span>
            <span>₩{amount.toLocaleString()}</span>
          </div>
        </div>

        <div id="toss-payment-methods" className={styles.widgetBox} />
        <div id="toss-agreement" className={styles.agreementBox} />

        <button
          type="button"
          className={styles.payButton}
          onClick={handlePay}
          disabled={!ready || paying || !buyerReady}
        >
          {!ready
            ? "결제 수단 불러오는 중..."
            : !buyerFilled
            ? "주문자 정보를 입력해주세요"
            : !buyerReady
            ? "배송지를 입력해주세요"
            : `₩${amount.toLocaleString()} 결제하기`}
        </button>

        {IS_TEST_KEY && (
          <p className={styles.testNotice}>지금은 테스트 결제 환경입니다 — 실제 결제가 이루어지지 않습니다.</p>
        )}
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
        </aside>
      </div>

      {/* 제품 수령·배송·교환·반품 안내 — 우체국택배·현장 수령 병행 (운영자 확정 2026-08-11.
          표기는 "굿즈" 아닌 "제품" — 레이지클럽 태그와 통일, 운영자 2026-08-11) */}
      {hasGoods && (
        <div className={styles.refundBox}>
          <p className={styles.refundTitle}>배송·수령·교환·반품 안내 (제품)</p>
          <ul className={styles.refundList}>
            <li>1. 제품은 <strong>링키라운지 현장 수령</strong> 또는 <strong>택배 배송</strong> 중 위에서 선택하실 수 있습니다. 현장 수령은 결제 후 연락처로 수령 일정을 안내드리며, 택배는 입력하신 배송지로 발송합니다.</li>
            <li>2. 택배 배송: 우체국택배 · 배송비 3,500원(제주·도서산간 추가) · 결제 확인 후 영업일 2–5일 이내 발송합니다.</li>
            <li>3. 교환·반품은 수령일(배송 완료일)부터 7일 이내에 신청할 수 있습니다. 단순 변심의 경우 반품 배송비(초기 3,500원 + 반품 3,500원 = 7,000원)는 구매자 부담이며, 현장 반납 시에는 비용이 없습니다. 보내실 곳: 링키라운지(서울 동작구 동작대로7길 44, 지하 1층).</li>
            <li>4. 상품 하자·오배송의 경우 기간과 관계없이 판매자 부담으로 교환 또는 전액 환불해 드립니다.</li>
            <li>5. 사용·훼손되었거나 포장 개봉으로 상품 가치가 훼손된 경우에는 교환·반품이 제한될 수 있습니다.</li>
            <li>환불은 접수일부터 영업일 기준 5일 이내에 처리됩니다.</li>
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
        {/* 통합 약관(/terms — 모임·제품·배송 전부)으로 연결 (2026-08-11 이관).
            /policy 는 기수제 북클럽 전용이라 굿즈 주문엔 맞지 않았다 */}
        <LazydayLink href="/terms" className={styles.refundLink}>
          이용약관·환불 규정 전문 보기
        </LazydayLink>
      </p>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <main className={styles.page}>
      {/* 워크룸 서체 — Pretendard·Gothic A1 은 전역 미로드라 페이지에서 로드
          (레이지클럽 calendar/turtle 페이지와 같은 방식) */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
      />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300;600&display=swap" />
      <div className={styles.container}>
        <CheckoutNav />
        {/* useSearchParams는 Suspense 경계 필요 (Next 정적 프리렌더 규칙) */}
        <Suspense fallback={null}>
          <CheckoutInner />
        </Suspense>
      </div>
    </main>
  )
}

/** 좌측 위 내비 — 뒤로 가기(직전 상품·신청 화면)와 홈 (운영자 2026-08-11) */
function CheckoutNav() {
  return (
    <div className={styles.navBar}>
      <button
        type="button"
        className={styles.backLink}
        onClick={() => (window.history.length > 1 ? window.history.back() : undefined)}
      >
        ← 돌아가기
      </button>
      <span className={styles.navDivider} aria-hidden />
      <LazydayLink href="/" className={styles.backLink}>
        홈
      </LazydayLink>
    </div>
  )
}
