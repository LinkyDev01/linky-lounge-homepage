// ================================================================
// GAS(Google Apps Script) 웹앱 호출 공통 헬퍼 (2026-08-05)
//
// 도입 배경: 프로덕션 런타임 에러에서 GAS가 간헐적으로
//   · POST에 **404** (신청/전화 인터뷰 예약 실패 — 신청자 "계속 오류")
//   · GET에 **HTML 에러 페이지** ("Unexpected token '<', \"<!DOCTYPE\"")
// 를 돌려주는 것이 확인됨. 스크립트가 실행되지 않은(=요청이 핸들러에
// 닿지 않은) 실패라 재시도 한 번이면 대부분 살아난다.
//
// ⚠ 재시도 정책이 GET/POST에서 다른 이유:
//   POST(신청·예약)는 재시도가 곧 **중복 접수·중복 캘린더 이벤트·알림톡
//   중복 발송** 위험이다. 그래서 "스크립트가 실행되지 않았음이 응답으로
//   확인된 경우"(404/502/503/504)만 재시도하고, 네트워크 오류·타임아웃처럼
//   실행 여부를 알 수 없는 실패는 절대 재시도하지 않는다.
// ================================================================

/** 스크립트가 실행되지 않았다고 볼 수 있는 상태코드 — 이때만 POST 재시도 */
const NOT_EXECUTED_STATUSES = [404, 502, 503, 504]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** GAS가 JSON 대신 HTML(로그인·오류 페이지)을 준 경우를 구분하기 위한 파싱 */
function parseJsonOrThrow(text: string, status: number) {
  try {
    return JSON.parse(text)
  } catch {
    const head = text.slice(0, 80).replace(/\s+/g, " ")
    throw new Error(`GAS non-JSON response (status ${status}): ${head}`)
  }
}

/**
 * GAS GET — 조회는 부작용이 없으므로 자유롭게 재시도한다.
 * 실패 시 마지막 오류를 throw (호출부가 폴백 처리).
 */
export async function gasGetJson(
  url: string,
  attempts = 3,
  timeoutMs = 7_000,
  /** 재시도 전체 시간 예산 — Vercel 함수 제한(관측상 ≥12s — 실측 최악 ~11s로 여유 확보)을 넘겨 504가 나지 않도록 (2026-08-05:
   *  GAS가 10초를 넘기는 사례 관측됨. 예산이 남지 않으면 더 시도하지 않고 실패시킨다) */
  totalBudgetMs = 10_000,
) {
  const startedAt = Date.now()
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    const remaining = totalBudgetMs - (Date.now() - startedAt)
    if (remaining <= 500) break // 남은 예산으로는 의미 있는 시도가 불가
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(Math.min(timeoutMs, remaining)),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(`GAS responded with ${res.status}`)
      return parseJsonOrThrow(text, res.status)
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) await sleep(300 * (i + 1))
    }
  }
  throw lastErr ?? new Error("GAS GET budget exhausted")
}

/**
 * GAS POST — 신청·예약처럼 부작용이 있는 요청.
 * 첫 시도의 **응답 상태코드가 404/502/503/504일 때만** 한 번 더 보낸다
 * (스크립트 미실행 확인). 네트워크 오류·타임아웃은 중복 위험 때문에 재시도 없음.
 */
export async function gasPostJson(url: string, payload: unknown) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      // 미실행이 확실한 상태코드 + 첫 시도 → 잠시 후 1회 재시도
      if (NOT_EXECUTED_STATUSES.includes(res.status) && attempt === 0) {
        await sleep(600)
        continue
      }
      throw new Error(`GAS responded with ${res.status}`)
    }

    const text = await res.text()
    return parseJsonOrThrow(text, res.status)
  }
  // 도달 불가 (위 루프에서 반환하거나 throw) — 타입 좁히기용
  throw new Error("GAS POST failed")
}
