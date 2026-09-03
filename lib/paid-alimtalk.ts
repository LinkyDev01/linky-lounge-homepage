import { gasPostJson, isGasExecuted, isGasRejected, gasRejectReason } from "@/lib/gas"
import { ONE_DAY_MEETINGS } from "@/app/(main)/lazyclub/one-day-config"
import type { OrderItem } from "@/lib/order-catalog"

/**
 * 레이지클럽 모임 **결제 완료** 알림톡 (2026-09-03).
 *
 * 발송 주체는 GAS(`handlePaidNotify`, type:"paid") 이고 여기는 그 호출부다. 부르는 곳은 둘:
 *   - `/api/lazyday/payment/confirm` — 카드·간편결제가 승인돼 status DONE 이 된 직후
 *   - `/api/payment/toss-webhook` — 가상계좌 입금이 확인돼 DONE 이 된 때
 * 두 곳이 같은 결제로 겹칠 수 있다(카드 결제도 웹훅 DONE 이 한 번 더 온다). **중복 차단은
 * GAS 가 주문번호 원장('결제 알림 발송' 탭 + LockService)으로 한다** — 여기서는 막지 않는다.
 * 그래서 이 함수는 같은 주문으로 여러 번 불려도 손님에게는 한 통만 간다.
 *
 * 왜 결제 시점인가: 템플릿 본문이 "신청 및 결제 확인되었습니다"다. 레이지클럽 모임은
 * "선신청 → 후결제"라 신청 폼 제출 시점에 보내면 결제 안 한 손님에게 결제 확인이 나간다
 * (2026-08-31~09-02 사이 실제로 그렇게 나가고 있었다). 운영자 2026-09-03 "결제완료되면 반영".
 *
 * 왜 모임마다 손댈 것이 없는가: 주문번호 → 상품 코드 → 카탈로그(`lib/order-catalog`)가
 * 모임 항목을 복원한다. one-day-config 에 모임을 추가해 orderCode 가 생기면 그 즉시 이 경로에
 * 포함된다. `notice`(알림톡 '비고')도 같은 컨피그에서 서버가 직접 읽는다 — 폼이 실어 보내던
 * 값에 의존하지 않는다.
 *
 * ⚠ **절대 던지지 않는다.** 결제 응답을 깨뜨리면 안 된다 — 손님 돈은 이미 빠져나간 뒤다.
 *   실패는 로그로만 남긴다 (원장·CAPI 와 같은 규율).
 */

const GAS_URL = process.env.INTERVIEW_GAS_URL

export type PaidNotifyInput = {
  orderId: string
  items: OrderItem[]
  name?: string | null
  phone?: string | null
}

/** 주문 항목 → GAS 로 보낼 모임 목록. 제품·배송비는 제외한다 (템플릿이 모임 전용이다) */
export function paidMeetingsOf(items: OrderItem[]) {
  return items
    .filter((i) => i.kind === "meeting")
    .map((i) => {
      // 4주 과정 등 one-day-config 모임은 orderCode 로 역참조해 notice 를 얹는다.
      // 원데이 토크 회차(oneday-shared)는 컨피그에 notice 칸이 없어 비고가 엔대시로 나간다.
      const m = ONE_DAY_MEETINGS.find((x) => x.orderCode === i.code)
      return { title: i.name, notice: m?.notice ?? "" }
    })
}

export async function notifyMeetingPaid(input: PaidNotifyInput): Promise<void> {
  const tag = `[paid-alimtalk] (${input.orderId})`
  try {
    const meetings = paidMeetingsOf(input.items)
    if (meetings.length === 0) return // 제품만 산 주문 — 보낼 템플릿이 없다
    const phone = (input.phone ?? "").replace(/[^0-9]/g, "")
    if (!phone) {
      // 구매자 정보는 클라이언트가 결제 직전 보관한 값이라 비어 있을 수 있다(스토리지 차단 등).
      // 이 경우 보낼 수 없다 — 운영자가 원장(orderer_phone 비어 있음)에서 알아볼 수 있게 남긴다.
      console.warn(`${tag} 전화번호 없음 — 알림톡 미발송`)
      return
    }
    if (!GAS_URL) {
      console.warn(`${tag} INTERVIEW_GAS_URL 미설정 — 알림톡 미발송`)
      return
    }
    const data = await gasPostJson(GAS_URL, {
      type: "paid",
      orderId: input.orderId,
      name: (input.name ?? "").trim(),
      phone,
      meetings,
    })
    if (isGasRejected(data)) {
      console.error(`${tag} GAS 거절:`, gasRejectReason(data))
      return
    }
    const d = data as { duplicate?: boolean; sent?: number; total?: number } | null
    if (d?.duplicate) console.log(`${tag} 이미 발송된 주문 — 건너뜀`)
    else console.log(`${tag} 발송 ${d?.sent ?? "?"}/${d?.total ?? meetings.length}`)
  } catch (err) {
    // 302 뒤 본문 유실 = GAS 는 실행됐다(발송·기록 완료). 재전송하면 GAS 원장이 막긴 하지만
    // 굳이 다시 부르지 않는다.
    if (isGasExecuted(err)) {
      console.warn(`${tag} GAS 실행됨(응답 본문 유실)`)
      return
    }
    console.error(`${tag} GAS 호출 실패:`, err)
  }
}
