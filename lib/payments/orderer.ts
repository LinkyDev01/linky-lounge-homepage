/**
 * 신청 폼 → 결제 화면으로 **주문자 정보(이름·연락처)를 넘기는 창구** (2026-09-01).
 *
 * 왜 있나: 모임은 신청서에서 이름·연락처를 이미 받는다. 그 다음 화면인 결제에서
 * 같은 걸 또 받고 있었다 — 운영자 "굳이 2단계로 하지 말고". 이제 폼이 여기 담아 두면
 * 결제 화면이 꺼내 채우고, 입력칸 대신 **확인 한 줄**만 보여준다.
 *
 * ⚠ **URL 로 넘기지 않는다.** 연락처는 개인정보다 — 쿼리스트링에 실으면 브라우저
 *   히스토리·리퍼러·서버 접근로그·공유된 링크에 그대로 남는다. sessionStorage 는
 *   그 탭에서만 살고 탭을 닫으면 사라진다(결제 링크는 같은 탭 이동이라 유지된다).
 *
 * ⚠ **유효기간이 필요하다.** 어제 신청하다 만 값이 오늘 다른 사람 결제에 채워지면
 *   엉뚱한 이름으로 결제가 잡힌다. 저장 시각을 함께 적고 30분이 지나면 무시한다.
 */

const KEY = "lz-orderer"
/** 신청 직후 결제로 넘어가는 시간 — 넉넉히 잡아도 이 정도면 충분하다 */
const MAX_AGE_MS = 30 * 60 * 1000

export type Orderer = { name: string; phone: string }

/** 신청 폼이 접수에 성공한 직후 호출한다. 실패해도 여정을 막지 않는다(칸이 그냥 빈다) */
export function stashOrderer(o: Orderer) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...o, ts: Date.now() }))
  } catch {}
}

/** 결제 화면이 마운트 후 읽는다 (초깃값으로 쓰면 하이드레이션 불일치 — 서버는 모른다).
 *  값이 없거나·낡았거나·형식이 깨졌으면 null 을 돌려 종전대로 입력칸을 띄운다 */
export function readOrderer(): Orderer | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<Orderer> & { ts?: number }
    if (!v?.name || !v?.phone) return null
    if (typeof v.ts !== "number" || Date.now() - v.ts > MAX_AGE_MS) return null
    return { name: String(v.name), phone: String(v.phone) }
  } catch {
    return null
  }
}

/** 결제 화면에서 '수정'을 누르면 지운다 — 안 지우면 새로고침에 다시 채워진다 */
export function clearOrderer() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {}
}
