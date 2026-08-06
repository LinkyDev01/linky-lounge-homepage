/**
 * 장애 시 신청자 구제 장치 (운영자 지시 2026-08-06).
 * 제출·조회가 실패하면 신청자가 막히지 않도록 카카오채널 문의로 연결하고,
 * 동시에 서버에 실패 사실을 남겨 운영자가 인지할 수 있게 한다.
 */

/** 카카오채널 1:1 채팅 */
export const KAKAO_CHAT_URL = "https://pf.kakao.com/_gixaAX/chat"

/** 전송이 끝내 안 될 때의 안내 — "복사 → 카카오톡으로 보내면 우리가 접수한다"는 맥락을
 *  링크보다 먼저 전달한다 (운영자 지시 2026-08-06). 링크 라벨은 '문의'가 아니라 '제출'. */
export const KAKAO_SUBMIT_GUIDE =
  "계속 안 되면 아래 버튼으로 내용을 복사해 카카오톡으로 보내주세요. 저희가 대신 접수해 드릴게요."
export const KAKAO_SUBMIT_LABEL = "카카오톡으로 제출하기"

/** 실패 사실을 서버 로그로 신고 (개인정보 미전송, 실패해도 조용히 무시) */
export function reportClientError(where: string, detail = "") {
  try {
    const body = JSON.stringify({ where, detail })
    // 페이지 이탈 중에도 전송되도록 sendBeacon 우선
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/lazyday/client-error", new Blob([body], { type: "application/json" }))
      return
    }
    void fetch("/api/lazyday/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    })
  } catch {
    // 신고 실패는 사용자 흐름에 영향을 주지 않는다
  }
}

/** 클립보드 복사 — 미지원 환경에서는 선택 가능한 프롬프트로 폴백 */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      window.prompt("아래 내용을 길게 눌러 복사해주세요.", text)
    } catch {}
    return false
  }
}
