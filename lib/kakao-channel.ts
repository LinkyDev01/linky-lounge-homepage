/**
 * 카카오톡 채널 **간편 추가하기**(Kakao JS SDK `Channel.followChannel`) — 2026-09-03.
 *
 * 왜 있나: 지금까지 채널 추가는 pf.kakao.com 링크를 새 창으로 여는 방식뿐이었다.
 * 간편 추가는 우리 화면 위에 카카오 팝업이 떠서 그 자리에서 추가되고 **결과가 우리에게
 * 돌아온다**(운영자 2026-09-03 "레이지클럽에 간편 추가기능도 필요해"). 카카오 로그인 없이 된다.
 *
 * 원칙 — **점진적 향상**: SDK 가 못 뜨거나(키 미설정·CDN 차단·구형 브라우저) 팝업이 막히면
 * 종전 링크(채널 홈 새 창)로 떨어진다. 이 기능이 죽어도 손님이 채널을 못 찾는 일은 없다.
 *
 * 운영자 준비물(코드 밖) — 셋 다 있어야 팝업이 뜬다, 하나라도 빠지면 폴백 링크로 간다:
 *   ① Kakao Developers 앱의 **JavaScript 키** → Vercel env `NEXT_PUBLIC_KAKAO_JS_KEY`
 *      (⚠ Type 은 **Config** — Secret 이면 NEXT_PUBLIC 이 번들에 안 박힌다, CLAUDE.md §5)
 *   ② 같은 앱 [플랫폼 키] > [JavaScript SDK 도메인] 에 `https://www.lazy-club.com`,
 *      `https://www.lazyday-bookclub.com`(결제 완료 화면이 이 도메인일 수 있다), 프리뷰 vercel.app
 *   ③ 같은 앱에 카카오톡 채널 `_gixaAX` 연결
 *
 * ⚠ 채널 ID 는 레이지클럽·북클럽 **공용 채널** 하나다(`_gixaAX`, Shell·LandingShell 이 같은 값).
 *   `_cuWDn` 은 링키라운지 채널 — 여기 쓰면 안 된다.
 */

export const KAKAO_CHANNEL_PUBLIC_ID = "_gixaAX"
/** 채널 홈 — SDK 가 없을 때의 폴백. 이 페이지에도 카카오가 그리는 '채널 추가' 버튼이 있다 */
export const KAKAO_CHANNEL_URL = `https://pf.kakao.com/${KAKAO_CHANNEL_PUBLIC_ID}`

/** ⚠ 버전과 integrity 는 한 쌍이다 — 버전만 올리면 브라우저가 스크립트를 **조용히 버린다**
 *  (SRI 불일치 = 로드 실패 = 폴백 링크). 값은 CDN 파일에서 직접 계산했다:
 *  `curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A` (2026-09-03, 2.8.3 = 87,110B) */
const SDK_VERSION = "2.8.3"
const SDK_URL = `https://t1.kakaocdn.net/kakao_js_sdk/${SDK_VERSION}/kakao.min.js`
const SDK_INTEGRITY = "sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy"

const JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || ""

type KakaoSdk = {
  init: (key: string) => void
  isInitialized: () => boolean
  Channel: { followChannel: (o: { channelPublicId: string }) => Promise<unknown> }
}
declare global {
  interface Window {
    Kakao?: KakaoSdk
  }
}

let loading: Promise<KakaoSdk | null> | null = null

/** SDK 를 한 번만 끼운다. 키가 없으면 **로드조차 하지 않는다**(87KB 를 헛되이 받지 않게).
 *  ⚠ 클릭 시점이 아니라 **버튼이 마운트될 때** 불러 둔다 — 팝업은 사용자 제스처 안에서
 *  열려야 차단되지 않는데, 클릭 후에 스크립트를 받기 시작하면 그 제스처가 끝나 버린다 */
export function loadKakaoSdk(): Promise<KakaoSdk | null> {
  if (typeof window === "undefined") return Promise.resolve(null)
  if (!JS_KEY) return Promise.resolve(null)
  if (window.Kakao?.isInitialized?.()) return Promise.resolve(window.Kakao)
  if (loading) return loading
  loading = new Promise((resolve) => {
    const s = document.createElement("script")
    s.src = SDK_URL
    s.integrity = SDK_INTEGRITY
    s.crossOrigin = "anonymous"
    s.async = true
    s.onload = () => {
      try {
        const k = window.Kakao
        if (!k) return resolve(null)
        if (!k.isInitialized()) k.init(JS_KEY)
        resolve(k)
      } catch {
        resolve(null)
      }
    }
    s.onerror = () => resolve(null)
    document.head.appendChild(s)
  })
  return loading
}

export type FollowResult = "followed" | "fallback" | "failed"

/**
 * 간편 추가를 시도한다. **반드시 클릭 핸들러 안에서 동기적으로** 부를 것 — 팝업 허용은
 * 제스처에 묶여 있다. SDK 가 준비돼 있지 않으면 즉시 폴백(채널 홈 새 창)으로 간다.
 *
 *  · followed — 카카오가 성공 응답을 줬다
 *  · fallback — SDK 없음 → 채널 홈을 새 창으로 열었다 (그쪽에서 손님이 직접 추가)
 *  · failed   — SDK 는 있는데 요청이 거절·취소됐다 (손님이 팝업을 닫은 경우 포함)
 */
export function followKakaoChannel(): Promise<FollowResult> {
  const k = typeof window !== "undefined" ? window.Kakao : undefined
  if (!k?.isInitialized?.()) {
    window.open(KAKAO_CHANNEL_URL, "_blank", "noopener,noreferrer")
    return Promise.resolve("fallback")
  }
  return k.Channel.followChannel({ channelPublicId: KAKAO_CHANNEL_PUBLIC_ID })
    .then(() => "followed" as const)
    .catch(() => "failed" as const)
}
