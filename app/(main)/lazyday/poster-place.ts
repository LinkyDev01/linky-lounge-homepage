/**
 * 실 위 글자 배치 — **경로 위 호길이 → 화면 좌표**를 우리가 직접 계산한다.
 *
 * 2026-08-17 전환 (운영자 "각각 텍스트가 또 확 튀어 위치가").
 * 종전엔 `<textPath>` 에 글자를 얹고 `startOffset` 을 밀었다. 배치를 엔진이 하니
 * 엔진마다 달랐고, 그게 지금까지의 iOS 결함 전부의 근원이었다:
 *   · 웹킷은 경로 용량을 넘는 글자를 **버리거나(고갈) 양 끝에 눌러 쌓았다(겹침)**
 *   · 경로에는 시작과 끝이 있어 **루프가 되지 않는다** (이음매가 원리적으로 생긴다)
 *   · 글자 폭·경로 길이를 브라우저에 물어 맞추다 보니 로드마다 답이 달랐다
 * → 글자 하나하나의 좌표·각도를 여기서 계산해 `<text>` 의 x/y/rotate 리스트로 준다.
 *   엔진은 "지정한 자리에 글자 하나 그리기"만 한다. 경로 끝이라는 개념이 없으므로
 *   **잘림·쌓임·이음매가 존재할 수 없고**, 호길이를 둘레로 나머지 연산하면 실이
 *   그냥 진짜 루프가 된다.
 *
 * ⚠ `dominant-baseline` 은 쓰지 않는다 — 엔진마다 적용 지점이 다르다(실측: 크롬은
 *   `<text>` 에서 무시, 웹킷은 자식 tspan 유무로 갈림). 중심 정렬은 법선 방향으로
 *   POSTER_BASELINE_DY 만큼 직접 밀어 넣는다.
 *
 * 정확도: 세그먼트 경계 누적 호길이는 빌드 타임 Gauss-Legendre 24점(≈기계 정밀도),
 * 세그먼트 **안**은 런타임 뉴턴 2회로 역산한다. 세그먼트가 6.5u 로 잘아 초기 추정
 * (선형)부터 이미 가깝고, 2회면 잔차가 1e-6u 아래로 떨어진다.
 */
import { POSTER_THREAD_D } from "./poster-thread"
import { POSTER_SEG_ARC, POSTER_LOOP_LEN, POSTER_BASELINE_DY } from "./poster-metrics"

/** 세그먼트 제어점 — [x0,y0,x1,y1,x2,y2,x3,y3] × 421 (한 번만 파싱) */
const SEG = (() => {
  const n = POSTER_THREAD_D.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
  const count = (n.length / 2 - 1) / 3
  const out = new Float64Array(count * 8)
  let px = n[0]
  let py = n[1]
  for (let i = 0; i < count; i++) {
    const b = 2 + i * 6
    const o = i * 8
    out[o] = px
    out[o + 1] = py
    out[o + 2] = n[b]
    out[o + 3] = n[b + 1]
    out[o + 4] = n[b + 2]
    out[o + 5] = n[b + 3]
    out[o + 6] = px = n[b + 4]
    out[o + 7] = py = n[b + 5]
  }
  return out
})()

export const POSTER_SEG_COUNT = SEG.length / 8

/** 부분 호길이용 Gauss-Legendre 5점 — 6.5u 구간에서 오차 무시 가능 */
const GL_X = [0.0, -0.5384693101056831, 0.5384693101056831, -0.9061798459386640, 0.9061798459386640]
const GL_W = [0.5688888888888889, 0.4786286704993665, 0.4786286704993665, 0.2369268850561891, 0.2369268850561891]

/** 세그먼트 s 의 t 에서의 속도 벡터 */
function deriv(o: number, t: number, out: { dx: number; dy: number }) {
  const u = 1 - t
  const a = 3 * u * u
  const b = 6 * u * t
  const c = 3 * t * t
  out.dx = a * (SEG[o + 2] - SEG[o]) + b * (SEG[o + 4] - SEG[o + 2]) + c * (SEG[o + 6] - SEG[o + 4])
  out.dy = a * (SEG[o + 3] - SEG[o + 1]) + b * (SEG[o + 5] - SEG[o + 3]) + c * (SEG[o + 7] - SEG[o + 5])
}

const _d = { dx: 0, dy: 0 }

/** 세그먼트 시작부터 t 까지의 호길이 */
function arcTo(o: number, t: number) {
  let sum = 0
  const h = t / 2
  for (let i = 0; i < 5; i++) {
    deriv(o, h * (GL_X[i] + 1), _d)
    sum += GL_W[i] * Math.sqrt(_d.dx * _d.dx + _d.dy * _d.dy)
  }
  return sum * h
}

/** 결과 담을 그릇 — 프레임마다 새로 만들지 않는다 */
export type PathPoint = { x: number; y: number; sin: number; cos: number; deg: number }

/**
 * 호길이 s(u, 0 이상 아무 값이나 — 둘레로 나머지 연산한다) → 좌표·접선.
 * @param hint 직전 호출의 세그먼트 인덱스. 글자를 순서대로 훑을 때 탐색을 없앤다.
 * @returns 이번에 쓴 세그먼트 인덱스 (다음 호출의 hint)
 */
export function pointAt(s: number, out: PathPoint, hint = 0): number {
  let d = s % POSTER_LOOP_LEN
  if (d < 0) d += POSTER_LOOP_LEN

  // 세그먼트 찾기 — 글자를 순서대로 훑으면 호길이가 단조 증가하므로 hint 에서 **앞으로
  // 걸어가면** 대개 한두 칸이다. 뒤로 가야 하는 경우는 한 벌이 둘레를 넘어 0 으로 감기는
  // 그 한 글자뿐이고, 그때만 이분 탐색(9회)을 한다.
  let i = hint >= 0 && hint < POSTER_SEG_COUNT ? hint : 0
  if (d < POSTER_SEG_ARC[i]) {
    let lo = 0
    let hi = POSTER_SEG_COUNT
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (POSTER_SEG_ARC[mid] <= d) lo = mid
      else hi = mid
    }
    i = lo
  } else {
    while (i + 1 < POSTER_SEG_COUNT && d >= POSTER_SEG_ARC[i + 1]) i++
  }

  const o = i * 8
  const base = POSTER_SEG_ARC[i]
  const len = POSTER_SEG_ARC[i + 1] - base
  const want = d - base
  // 선형 초기 추정 → 뉴턴 2회 (f(t) = arc(t) − want, f'(t) = |B'(t)|)
  let t = len > 0 ? want / len : 0
  for (let k = 0; k < 2; k++) {
    const e = arcTo(o, t) - want
    deriv(o, t, _d)
    const sp = Math.sqrt(_d.dx * _d.dx + _d.dy * _d.dy)
    if (sp < 1e-9) break
    t -= e / sp
    if (t < 0) t = 0
    else if (t > 1) t = 1
  }

  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const e = t * t * t
  out.x = a * SEG[o] + b * SEG[o + 2] + c * SEG[o + 4] + e * SEG[o + 6]
  out.y = a * SEG[o + 1] + b * SEG[o + 3] + c * SEG[o + 5] + e * SEG[o + 7]
  deriv(o, t, _d)
  const sp = Math.sqrt(_d.dx * _d.dx + _d.dy * _d.dy) || 1
  out.cos = _d.dx / sp
  out.sin = _d.dy / sp
  out.deg = (Math.atan2(_d.dy, _d.dx) * 180) / Math.PI
  return i
}

/**
 * 한 벌을 위상 `phase`(u) 에 얹어 x/y/rotate 리스트를 채운다.
 *
 * 글자 i 는 자기 **advance 의 중점**이 경로 위 (cum[i] + adv[i]/2 + phase) 에 오도록
 * 놓인다 — `<textPath>` 가 하던 것과 같은 규칙이라 기존 렌더와 자리가 같다.
 * `<text>` 의 x/y 는 글자의 **원점**(베이스라인 시작)이므로 중점에서 접선 반대로
 * advance/2 만큼 되돌리고, 법선으로 중심 오프셋만큼 민다.
 */
export function fillLists(
  cum: Float64Array,
  adv: Float64Array,
  count: number,
  phase: number,
  xs: Float64Array,
  ys: Float64Array,
  rs: Float64Array,
) {
  const pt: PathPoint = { x: 0, y: 0, sin: 0, cos: 0, deg: 0 }
  let hint = 0
  for (let i = 0; i < count; i++) {
    const half = adv[i] / 2
    hint = pointAt(cum[i] + half + phase, pt, hint)
    // 법선 = 접선을 90° 돌린 것. y 가 아래로 자라는 좌표계라 (sin, −cos) 가 '위'.
    xs[i] = pt.x - pt.cos * half + pt.sin * POSTER_BASELINE_DY
    ys[i] = pt.y - pt.sin * half - pt.cos * POSTER_BASELINE_DY
    rs[i] = pt.deg
  }
}

/** 숫자 배열 → 속성 문자열. 소수 2자리 = 0.01u ≈ 화면 0.01px (충분하고, 문자열이 짧다) */
export function listStr(v: Float64Array, count: number, digits = 2) {
  const k = digits === 2 ? 100 : 10
  let s = ""
  for (let i = 0; i < count; i++) {
    if (i) s += " "
    s += Math.round(v[i] * k) / k
  }
  return s
}
