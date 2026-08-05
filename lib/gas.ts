// ================================================================
// GAS(Google Apps Script) 웹앱 호출 공통 헬퍼 (2026-08-05)
//
// 도입 배경 (2026-08-05 실측): Apps Script 웹앱은 doPost 실행을 마친 뒤 결과 본문을
// script.googleusercontent.com 으로 302 시키는데, 그 결과 URL이 직후 잠깐
// "Page Not Found"(404)를 준다. 이것이 프로덕션 로그의 "GAS responded with 404"
// = 신청자가 본 오류의 정체다. **스크립트는 이미 실행된 뒤**이므로 재전송하면
// 중복 접수가 된다. GET은 부작용이 없어 자유롭게 재시도해도 된다.
// ================================================================

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
  /** Next 데이터 캐시 유지 시간(초). GAS는 콜드 스타트가 80초까지 걸린 사례가 있어
   *  (2026-08-05 실측) 캐시가 있어야 대부분의 방문자가 대기 없이 본다. 0이면 캐시 안 함 */
  revalidateSec = 0,
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
        ...(revalidateSec > 0 ? { next: { revalidate: revalidateSec } } : {}),
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
 *
 * Apps Script는 doPost 실행을 **마친 뒤** 결과 본문을 script.googleusercontent.com 으로
 * 302 시킨다. 즉 302를 받은 시점에 시트 기록·캘린더 생성·알림톡은 이미 끝났다.
 * 그런데 이 결과 URL이 직후 잠깐 "Page Not Found"(404)를 주는 사례가 관측됐고
 * (2026-08-05 실측: 같은 URL을 잠시 뒤 다시 부르면 {"success":true}),
 * 이것이 프로덕션의 "GAS 404" = 신청자에게 뜬 오류의 정체다.
 *
 * ⚠ 그러므로 POST는 **절대 재전송하지 않는다** — 재전송은 중복 접수·중복 예약·
 *   알림톡 중복 발송이다. 대신 같은 결과 URL만 다시 조회한다(재실행 없음).
 *   끝내 본문을 못 받으면 executed=true 오류로 알려, 호출부가 "실패"가 아니라
 *   "접수됨(본문 유실)"으로 처리하게 한다.
 */
export async function gasPostJson(url: string, payload: unknown) {
  const res = await fetch(url, {
    method: "POST",
    redirect: "manual", // 302를 직접 받아 '실행 완료' 신호로 쓴다
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location")
    if (loc) {
      for (let i = 0; i < 3; i++) {
        try {
          const r2 = await fetch(loc, { redirect: "follow", signal: AbortSignal.timeout(8_000) })
          const text = await r2.text()
          if (r2.ok && text.trim().startsWith("{")) return JSON.parse(text)
        } catch {
          // 결과 URL 일시 오류 — 잠시 후 같은 URL 재조회 (재실행 아님)
        }
        await sleep(400 * (i + 1))
      }
    }
    const err = new Error("GAS executed but response body unavailable") as Error & { executed?: boolean }
    err.executed = true
    throw err
  }

  const text = await res.text()
  if (!res.ok) throw new Error(`GAS responded with ${res.status}`)
  return parseJsonOrThrow(text, res.status)
}

/** gasPostJson이 "실행은 됐는데 본문만 못 받은" 경우인지 */
export function isGasExecuted(err: unknown) {
  return !!(err && typeof err === "object" && (err as { executed?: boolean }).executed)
}
